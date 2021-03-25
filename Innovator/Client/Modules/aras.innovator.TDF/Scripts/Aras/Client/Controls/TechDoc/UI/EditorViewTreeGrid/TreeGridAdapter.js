define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/UI/EditorViewTreeGrid/TDFTreeGridContainer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/UI/Rendering/RendererFactory',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, connect, TDFTreeGridContainer, RendererFactory, Enums) {
	return declare('Aras.Client.Controls.TDF.TreeGridAdapter', [], {
		isEditable: null,
		_eventHandlers: null,
		dataStore: null,
		_suspendedEventsCount: null,
		_invalidationSuspendLevel: null,
		gridContainer: null,
		gridWidget: null,
		menuHelper: null,
		connectId: 'tdfTreeGridContainer',
		_viewModel: null,
		_schemaHelper: null,
		_rendererFactory: null,
		_invalidItemsHash: null,
		_rowLevelIndent: 28,
		aras: null,

		constructor: function (initialArguments) {
			this.connectId = initialArguments.connectId || this.connectId;

			this.aras = initialArguments.aras;
			this._viewModel = initialArguments.viewModel;
			this._rendererFactory = new RendererFactory({
				viewmodel: this._viewModel
			});

			this._eventHandlers = [];
			this.dataStore = initialArguments.dataStore;
			this.menuHelper = initialArguments.menuHelper;
			this.isEditable = initialArguments.isEditable;
			this._suspendedEventsCount = 0;
			this._invalidationSuspendLevel = 0;
			this._invalidItemsHash = {};

			this._overrideExpandoWidget();
			this._createTree();

			this._viewModel.getStatePromise('initComplete').then(
				function () {
					this._schemaHelper = this._viewModel.Schema();

					this._onViewModelInitializedHandler();
					this.attachViewModelListeners();

					this.gridWidget.domNode.classList.add('controlInited');
				}.bind(this)
			);
		},

		attachViewModelListeners: function () {
			connect.connect(
				this._viewModel,
				'OnInvalidate',
				this._onViewModelInvalidateHandler.bind(this),
				true
			);
			connect.connect(
				this._viewModel,
				'onSelectionChanged',
				this._modelSelectionChangeHandler.bind(this),
				true
			);
		},

		attachGridWidgetListeners: function () {
			// Required to drop selection if it was clicked on empty area in grid
			this.gridWidget.domNode.addEventListener(
				'mousedown',
				this.onGridMouseDownHandler.bind(this)
			);

			this._eventHandlers.push(
				connect.connect(
					this.gridWidget.selection,
					'clickSelect',
					this,
					this.onGridClickSelectHandler.bind(this)
				)
			);

			// Header is a representation of root item of DataModel, so content menu should be handler for it
			this._eventHandlers.push(
				connect.connect(this.gridWidget, 'onHeaderEvent', this, function (
					headerEvent
				) {
					if (headerEvent.type == 'contextmenu') {
						try {
							this._selectionInProgress = true;
							this._viewModel.SetSelectedItems(this._viewModel.Dom());
							this.gridContainer.deselect();
						} finally {
							this._selectionInProgress = false;
							this.gridContainer.gridMenuInit('headerRow');
						}
					}
				})
			);

			// Set corresponding cssClasses and background-image for grid row
			this._eventHandlers.push(
				connect.connect(this.gridWidget, 'onStyleRow', this, function (row) {
					const itemId = this.gridContainer.getRowId(row.index);
					const gridStoreItem = this.gridWidget.store._itemsByIdentity[itemId];
					const schemaItem = this._viewModel.GetElementById(itemId);

					if (gridStoreItem && schemaItem) {
						const elementRenderer = this._rendererFactory.CreateRenderer(
							schemaItem
						);
						const elementState = elementRenderer.prepareElementState(
							schemaItem
						);
						const customClasses = elementRenderer.getTreeClassList(
							schemaItem,
							elementState
						);
						const treeStyles =
							elementRenderer.GetTreeStyle(schemaItem, elementState) || {};
						const iconProperty =
							treeStyles.backgroundImage ||
							"url('" +
								Enums.getImagefromType(
									this._schemaHelper.GetSchemaElementType(schemaItem)
								) +
								"')";
						let customStyles = '';

						if (iconProperty) {
							customStyles +=
								'background-image:' +
								iconProperty +
								';' +
								' background-position-x:' +
								this._rowLevelIndent * gridStoreItem.treePath.length +
								'px;';
						}

						row.customClasses += customClasses ? ' ' + customClasses : '';
						row.customStyles += customStyles ? ' ' + customStyles : '';
					}
				})
			);

			// _getHeaderContent method should be overriden because renderRowHTML is used for content generation
			this._eventHandlers.push(
				connect.connect(
					this.gridWidget,
					'buildViews',
					function () {
						const gridView = this.gridWidget.views.views[0];

						gridView._originGetHeaderContent = gridView._getHeaderContent;
						gridView._getHeaderContent = function (targetColumn) {
							const columnId = targetColumn.field;
							let headerContent = '';

							if (columnId === 'schemaElement') {
								headerContent += this._renderRowHTML(this._viewModel.Dom());
							} else {
								gridView._originGetHeaderContent.apply(
									this.gridWidget,
									arguments
								);
							}

							return headerContent;
						}.bind(this);
					}.bind(this)
				)
			);
		},

		_getTreeLayout: function () {
			return [
				{
					field: 'schemaElement',
					width: '100%',
					editable: false,
					draggable: false,
					multiselect: true,
					formatter: this._renderRowHTML.bind(this),
					name: 'schemaElement',
					styles: 'text-align: left;'
				}
			];
		},

		_modelSelectionChangeHandler: function (sender, selectedItems) {
			if (!this._selectionInProgress) {
				this._setSelectedRows(selectedItems, true);
			}
		},

		_setSelectedRows: function (selectedItems, scrollToSelection) {
			this.gridContainer.deselect();

			if (scrollToSelection) {
				this._scrollToSelection();
			}

			for (let i = 0; i < selectedItems.length; i++) {
				this.selectItem(selectedItems[i].Id(), true);
			}
		},

		_scrollToSelection: function () {
			const selectedElements = this._viewModel.GetSelectedItems();

			if (selectedElements.length) {
				let targetElement = selectedElements[selectedElements.length - 1];
				let gridRowIndex = this.gridContainer.getRowIndex(targetElement.Id());

				while (gridRowIndex === -1 && targetElement.Parent) {
					targetElement = targetElement.Parent;
					gridRowIndex = this.gridContainer.getRowIndex(targetElement.Id());
				}

				this.gridWidget.scrollToRow(Math.max(gridRowIndex, 0));
			}
		},

		_onViewModelInvalidateHandler: function (sender, invalidationParameters) {
			this.refreshGridData(invalidationParameters.invalidationList);

			if (!this._selectionInProgress) {
				const selectedItems = this._viewModel.GetSelectedItems();

				this._selectionInProgress = true;
				this._setSelectedRows(selectedItems, false);
				this._selectionInProgress = false;
			}
		},

		_invalidateObject: function (/*WrapeedObject*/ invalidObject) {
			if (this._invalidationList.indexOf(invalidObject) == -1) {
				this._invalidationList.push(invalidObject);
			}
		},

		_isTopInvalidItem: function (targetItem) {
			var parentItem = targetItem.Parent;

			while (parentItem) {
				if (this._invalidItemsHash[parentItem.Id()]) {
					return false;
				}

				parentItem = parentItem.Parent;
			}

			return true;
		},

		_getExpandedItems: function (rowItems, expandoStates, expandedItems) {
			let currentItem;

			expandedItems = expandedItems || [];

			for (let i = 0; i < rowItems.length; i++) {
				currentItem = rowItems[i];
				expandedItems.push(rowItems[i]);

				if (currentItem.children && expandoStates[currentItem.uniqueId]) {
					this._getExpandedItems(
						currentItem.children,
						expandoStates,
						expandedItems
					);
				}
			}

			return expandedItems;
		},

		onGridClickSelectHandler: function (inIndex, inCtrlKey, inShiftKey) {
			this._onSelectionChanged();
		},

		onGridMouseDownHandler: function (mouseEvent) {
			this.gridWidget._lastMouseDownEvent = mouseEvent;

			if (!mouseEvent.cell) {
				this._viewModel.SetSelectedItems();
			} else {
				if (mouseEvent.rowIndex >= 0) {
					const gridStoreItem = this.gridWidget.getItem(mouseEvent.rowIndex);

					this.processSpecialNodeAction(mouseEvent.target, gridStoreItem);
				}

				mouseEvent.preventDefault();
			}
		},

		refreshGridData: function (invalidationList) {
			invalidationList = invalidationList
				? Array.isArray(invalidationList)
					? invalidationList
					: [invalidationList]
				: [];

			if (invalidationList.length) {
				invalidationList.map(
					function (invalidItem) {
						const itemId = invalidItem.Id();

						if (!this._invalidItemsHash[itemId]) {
							this._invalidItemsHash[itemId] = invalidItem;
						}
					}.bind(this)
				);
			}

			if (!this._invalidationSuspendLevel) {
				if (Object.keys(this._invalidItemsHash).length) {
					const updateItems = this._invalidItemsHash;
					const isRootItemUpdated =
						this._invalidItemsHash[this._viewModel.Dom().Id()] !== undefined;
					let singleItemsUpdated;
					let itemId;

					if (!isRootItemUpdated) {
						singleItemsUpdated = true;

						for (itemId in this._invalidItemsHash) {
							const invalidItem = this._viewModel.GetAncestorOrSelfElement(
								this._invalidItemsHash[itemId]
							);
							const gridStoreItem = this.gridWidget.store._itemsByIdentity[
								itemId
							];
							const gridStoreNeedsUpdate =
								!gridStoreItem || gridStoreItem.children.length;

							if (
								!this._isTopInvalidItem(invalidItem) ||
								invalidItem.ChildItems().length() > 0 ||
								gridStoreNeedsUpdate
							) {
								singleItemsUpdated = false;
								break;
							}
						}
					} else {
						const gridView = this.gridWidget.views.views[0];

						gridView.renderHeader();
					}

					if (singleItemsUpdated) {
						for (itemId in this._invalidItemsHash) {
							this.updateGridRow(this._invalidItemsHash[itemId]);
						}
					} else {
						let rowItems = this._createTreeItemsFromModel();
						const rootItems = rowItems.length ? rowItems[0].children : rowItems;
						let expandedItems;

						this._rememberExpanded();

						rootItems.map(function (currentItem) {
							currentItem.parent = undefined;
						});
						rowItems = this.gridContainer.decorateRowItemsBeforeAdd(
							rootItems,
							'',
							''
						);

						this.cleanupStore();
						this._restoreExpanded();

						for (let i = 0; i < rowItems.length; i++) {
							this.gridContainer.items_Experimental.add(rowItems[i]); // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
						}

						expandedItems = this._getExpandedItems(
							rowItems,
							this.gridWidget.openedExpandos
						);

						this.gridWidget._by_idx = []; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
						this.gridWidget._size = expandedItems.length;
						this.gridWidget.rowCount = rowItems.length;
						this.gridWidget._fetchedChildrenCount = 0;
						this.gridWidget.invalidated.all = true;
						this.gridWidget.refresh();
						this.gridWidget.selection.clear();

						this.gridWidget.invalidated.all = false;
						this.gridWidget.invalidated.rowCount = this.gridWidget._size;
						this.gridWidget.endUpdate();
					}

					this._invalidItemsHash = {};
				}
			} else {
				this._suspendedEventsCount++;
			}
		},

		cleanupStore: function () {
			const gridStore = this.gridWidget.store;

			gridStore._arrayOfAllItems = [];
			gridStore._arrayOfTopLevelItems = [];
			gridStore._itemsByIdentity = {};
			gridStore._loadInProgress = false;
			gridStore._queuedFetches = [];
		},

		selectItem: function (itemId, isMultiselect) {
			if (itemId !== undefined) {
				var schemaElement =
					typeof itemId == 'object'
						? itemId
						: this._viewModel.GetElementById(itemId);

				if (schemaElement && schemaElement.Parent) {
					const elementId = schemaElement.Id();
					const idPath = this._viewModel.getElementIdPath(elementId);

					if (idPath.length > 1) {
						this.expandRows(idPath.slice(0, -1));
					}

					this.gridContainer.setSelectedRow(elementId, isMultiselect);

					this._onSelectionChanged();
				}
			} else {
				this.selectItem(this._viewModel.Dom().Id());
			}
		},

		_onSelectionChanged: function () {
			const selectedGridItems = this.gridWidget.selection.getSelected();
			const selectedModelItems = selectedGridItems.map(function (
				gridStoreItem
			) {
				return gridStoreItem.schemaElement[0];
			});

			try {
				this._selectionInProgress = true;
				this._viewModel.SetSelectedItems(selectedModelItems);
			} finally {
				this._selectionInProgress = false;
			}
		},

		_getDataModelElements: function () {
			const registeredElements = this._viewModel.Dom().getAllChilds();

			return registeredElements.filter(function (schemaElement) {
				return schemaElement.is('XmlSchemaElement');
			});
		},

		_createTreeItemsFromModel: function () {
			const itemsChildrenHash = {};

			const rootElement = this._viewModel.Dom();
			const elementRenderer = this._rendererFactory.CreateRenderer(rootElement);

			const allElements = elementRenderer.RenderModel(rootElement);
			return allElements.map(function (element) {
				const parentId = element.parent;
				const itemId = element.id;
				element.children =
					itemsChildrenHash[itemId] || (itemsChildrenHash[itemId] = []);

				if (parentId !== null) {
					const parentChildren =
						itemsChildrenHash[parentId] || (itemsChildrenHash[parentId] = []);

					parentChildren.push(element);
				}

				return element;
			});
		},

		_loadGridRows: function (gridContainer) {
			let rowItems = this._createTreeItemsFromModel();

			if (rowItems.length) {
				const rootItems = rowItems[0].children;
				const gridWidget = gridContainer.grid_Experimental;

				rootItems.map(function (currentItem) {
					currentItem.parent = undefined;
				});
				rowItems = gridContainer.decorateRowItemsBeforeAdd(rootItems, '', '');

				for (let i = 0; i < rowItems.length; i++) {
					gridContainer.items_Experimental.add(rowItems[i], ''); // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
				}

				gridWidget.rowCount = rowItems.length;
			}
		},

		_overrideExpandoWidget: function () {
			dojo.extend(dojox.grid._LazyExpando, {
				_childRowIndent: this._rowLevelIndent,
				templateString:
					'<div class="dojoxGridExpando">' +
					'<div class="dojoxGridExpandoNode" dojoAttachEvent="onclick:onToggle"></div>' +
					'</div>',
				_addVerticalDots: function () {},
				_addDots: function () {},
				_setImageSrc: function () {},
				_updateExpandoInner: function (state) {
					if (state) {
						this.domNode.classList.add('dojoxGridExpandoOpened');
					} else {
						this.domNode.classList.remove('dojoxGridExpandoOpened');
					}
					this.domNode.classList.remove('dojoxGridExpandoLoading');
				}
			});
		},

		_createTree: function () {
			const gridContainer = new TDFTreeGridContainer({
				TreeClass: 'arasTDFTree',
				connectId: this.connectId,
				canEdit_Experimental: function (rowId) {
					// jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
					return false;
				}.bind(this)
			});

			this.gridContainer = gridContainer;
			this.gridWidget = gridContainer.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
			this.gridWidget.beginUpdate();

			gridContainer.rowHeight = 24;
			gridContainer.setMultiselect(true);
			this.gridWidget.scroller.defaultRowHeight = 24;

			// Fix problem with header shift
			this.gridWidget.focus.focusGridView = function () {};

			// Disable mouse interactions with header
			this.gridWidget.doheaderclick = function () {};

			// Attach gridContainer event handlers
			this._eventHandlers.push(
				connect.connect(
					gridContainer,
					'gridMenuInit',
					this,
					this._onGridMenuInit
				)
			);
			this._eventHandlers.push(
				connect.connect(
					gridContainer,
					'gridMenuClick',
					this,
					this._onGridMenuClick
				)
			);

			this.attachGridWidgetListeners();
		},

		processSpecialNodeAction: function (targetNode, storeItem) {
			if (targetNode) {
				if (targetNode.classList.contains('ItemModifiedMark')) {
					const dialogSettings = {
						title: this.aras.getResource('', 'common.refresh')
					};
					const dialogMessage = this.aras.getResource(
						'',
						'common.discard_confirmationmessage'
					);
					const topWindow = this.aras.getMostTopWindowWithAras(window);

					return topWindow.ArasModules.Dialog.confirm(
						dialogMessage,
						dialogSettings
					).then(
						function (result) {
							if (result === 'ok') {
								const schemaElement = storeItem.schemaElement[0];

								if (schemaElement.is('ArasItemXmlSchemaElement')) {
									schemaElement.dropItemPropertiesChanges();
								} else if (
									schemaElement.is('ArasItemPropertyXmlSchemaElement')
								) {
									const sourceItemElement = schemaElement.getSourceItem();

									sourceItemElement.dropItemPropertiesChanges(
										schemaElement.getPropertyName()
									);
								}
							}
						}.bind(this)
					);
				}
			}
		},

		_onViewModelInitializedHandler: function () {
			this.gridWidget.beginUpdate();

			// Initializing grid structure
			this.gridContainer.setLayout_Experimental(this._getTreeLayout());

			// Loading grid data
			this._loadGridRows(this.gridContainer);
			this.gridWidget.render();
			this.gridWidget.invalidated.all = true;

			this.gridWidget.endUpdate();
		},

		updateGridRow: function (schemaElement) {
			if (schemaElement) {
				const rowIndex =
					typeof schemaElement === 'object'
						? this.gridContainer.getRowIndex(schemaElement.Id())
						: schemaElement;

				this.gridWidget.updateRow(rowIndex);
			}
		},

		_renderRowHTML: function (storeValue, rowId, level, layoutCell) {
			const elementRenderer = this._rendererFactory.CreateRenderer(storeValue);
			const elementState = elementRenderer.prepareElementState(storeValue);

			return (
				elementRenderer.GetTreeName(storeValue, elementState) +
				elementRenderer.getStatusMarksContent(storeValue, elementState)
			);
		},

		expandRows: function (targetIds) {
			targetIds = targetIds
				? Array.isArray(targetIds)
					? targetIds
					: [targetIds]
				: [];

			if (targetIds.length) {
				const gridView = this.gridWidget.views.views[0];
				let expandoWidget;
				let rowId;
				let i;

				for (i = 0; i < targetIds.length; i++) {
					rowId = targetIds[i];
					rowId = typeof rowId === 'object' ? rowId.uniqueId : rowId;
					expandoWidget = gridView._expandos[rowId];

					if (expandoWidget && !this.gridWidget.openedExpandos[rowId]) {
						expandoWidget.setOpen(true);
						this.gridWidget.openedExpandos[rowId] = true;
					}
				}
			}
		},

		suspendInvalidation: function () {
			this._invalidationSuspendLevel++;
		},

		resumeInvalidation: function () {
			if (this._invalidationSuspendLevel) {
				this._invalidationSuspendLevel--;
			}

			if (!this._invalidationSuspendLevel && this._suspendedEventsCount) {
				this.refreshGridData();
				this._suspendedEventsCount = 0;
			}
		},

		_rememberExpanded: function () {
			const expandedRowIds = this.gridContainer.getOpenedItems();
			let schemaElement;
			let gridStoreItem;
			let uidPath;
			let rowId;

			this.expandedRowPaths = [];

			for (let i = 0; i < expandedRowIds.length; i++) {
				rowId = expandedRowIds[i];
				gridStoreItem = this.gridWidget.store._itemsByIdentity[rowId];
				schemaElement = gridStoreItem.schemaElement[0];

				if (schemaElement) {
					uidPath = this._viewModel.getElementUidPath(schemaElement).join(',');
					this.expandedRowPaths[uidPath] = true;
				}
			}
		},

		_restoreExpanded: function () {
			const allModelElements = this._getDataModelElements();
			let schemaElement;
			let idPath;
			let uidPath;
			let itemId;

			this.gridWidget.openedExpandos = {};

			for (let i = 0; i < allModelElements.length; i++) {
				schemaElement = allModelElements[i];
				itemId = schemaElement.Id();
				uidPath = this._viewModel.getElementUidPath(itemId).join(',');

				if (this.expandedRowPaths[uidPath]) {
					idPath = this._viewModel.getElementIdPath(itemId).join(',');
					this.gridWidget.openedExpandos[itemId] = true;
				}
			}
		},

		destroy: function () {
			if (this.gridContainer) {
				this.inherited(arguments);
			}
		},

		_onGridMenuClick: function (commandId, rowId) {
			const actionHelper = this._viewModel.ActionsHelper();
			const gridMenu = this.gridContainer.getMenu();

			actionHelper.onMenuItemClick(commandId, rowId);
			actionHelper.hideContextMenu(gridMenu);

			if (commandId.split(':')[0] === 'pasteelement') {
				const selectedItems = this._viewModel.GetSelectedItems();

				setTimeout(
					function () {
						this.selectItem(selectedItems[0].Id());
					}.bind(this)
				);
			}
		},

		_onGridMenuInit: function (rowId, columnIndex) {
			const selectedElements =
				rowId == 'headerRow'
					? [this._viewModel.Dom()]
					: this._viewModel.GetSelectedItems();

			if (selectedElements.length) {
				const actionHelper = this._viewModel.ActionsHelper();
				const firstSelectedElement = selectedElements[0];
				const gridMenu = this.gridContainer.getMenu();
				const menuModel = actionHelper.GetActionsMenuModel(selectedElements);
				const clickEvent = this.gridWidget._lastMouseDownEvent;

				setTimeout(
					function () {
						actionHelper.showContextMenu(
							gridMenu,
							this.gridWidget,
							menuModel,
							firstSelectedElement.Id(),
							{
								x: clickEvent.pageX,
								y: clickEvent.pageY
							}
						);
					}.bind(this),
					0
				);
			}

			return false;
		}
	});
});
