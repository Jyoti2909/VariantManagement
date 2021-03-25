define([
	'dojo/_base/declare',
	'MassPromote/Scripts/Classes/Components/ContextMenuModule'
], function (declare, ContextMenuModule) {
	return declare(null, {
		_items: [],
		_grid: null,
		_promoteType: '',

		constructor: function (mediator, dataProvider, statusBar) {
			this._dataProvider = dataProvider;
			this._mediator = mediator;
			this._initToolbar();
			this._initGrid();
			this._contextMenuModule = new ContextMenuModule(mediator, this._grid);
			this._statusBar = statusBar;
		},

		setLifeCycle: function (lifeCycleInfo) {},

		setTargetState: function (lifeCycleInfo) {},

		resolveConflicts: function (method) {
			if (method === 'move-to-another') {
				const invalidItems = this._dataProvider.getInvalidItems();
				this._massPromote(invalidItems);
			}

			this._dataProvider.removeInvalidItems();
			this._onGridRowsChanged();
		},

		updateItemPromoteStatus: function (promoteInfo) {},

		loadFromXml: function () {
			this._promoteType = this._dataProvider.getPromoteType();
			this._onGridRowsChanged();
		},

		onLifecycleMapChanged: function (lifecycleMap) {
			this._lifecycleMap = lifecycleMap;
			this._onGridRowsChanged();
		},

		onTargetStateChanged: function (targetState) {
			this._targetState = targetState;
			this._onGridRowsChanged();
		},

		onAddItemButtonClick: function () {
			const self = this;
			const param = {
				itemtypeName: this._promoteType,
				multiselect: true,
				fullMultiResponse: true
			};
			param.type = 'SearchDialog';
			const pickDialog = window.parent.ArasModules.MaximazableDialog.show(
				'iframe',
				param
			);

			pickDialog.promise.then(function (res) {
				if (res) {
					const gridWasChanged = self._dataProvider.addItems(res);

					if (gridWasChanged) {
						self._onGridRowsChanged();
					}
				}
			});
		},

		onRemoveItemButtonClick: function () {
			const selectedRowIds = this._grid.getSelectedRowIds().map(function (id) {
				const row = this._grid.rows.get(id);

				if (row) {
					return row.itemId;
				}
			}, this);

			const rowsChanged = this._dataProvider.removeItems(selectedRowIds);

			if (rowsChanged) {
				this._onGridRowsChanged();
			}
		},

		onPromoteButtonClick: function () {
			const selectedRowIds = this._grid.getSelectedRowIds();

			if (selectedRowIds.length === 1) {
				const row = this._grid.rows.get(selectedRowIds[0]);

				if (row) {
					this._singlePromote(row);
				}
			} else {
				const self = this;
				const selectedItems = selectedRowIds.map(function (id) {
					curRow = self._grid.rows.get(id);

					return curRow.sourceObject;
				});

				this._massPromote(selectedItems);
			}
		},

		onItemPromoted: function (itemId, status) {
			this._dataProvider.updateItemStatus(itemId, status);
			this._onGridRowChanged(itemId);
		},

		onItemsPromoted: function (status) {
			const itemIds = this.getItemIds();

			for (let i = 0; i < itemIds.length; i++) {
				this._dataProvider.updateItemStatus(itemIds[i], status);
			}

			this._onGridRowsChanged();
		},

		refreshItems: function () {
			this._dataProvider.refreshItems();
			this._onGridRowsChanged();
		},

		getItemIds: function () {
			const items = this._dataProvider.getItems();

			return items.map(function (el) {
				return el.getId();
			});
		},

		getPromoteType: function () {
			return this._promoteType;
		},

		_massPromote: function (items) {
			const newItemNd = aras.newItem('mpo_MassPromotion');
			aras.itemsCache.addItem(newItemNd);
			aras.setItemProperty(newItemNd, 'promote_type', this._promoteType);
			const relationships = newItemNd.ownerDocument.createElement(
				'Relationships'
			);

			for (let i = 0; i < items.length; i++) {
				relationships.appendChild(items[i].node.cloneNode(true));
			}

			newItemNd.appendChild(relationships);
			aras.uiShowItemEx(newItemNd, 'new');
		},

		_singlePromote: function (row) {
			const self = this;
			const param = {
				item: row.sourceObject.node.cloneNode(true),
				aras: aras,
				title: aras.getResource(
					'',
					'promotedlg.propmote',
					aras.getKeyedNameEx(row.sourceObject.node)
				),
				dialogWidth: 400,
				dialogHeight: 300,
				resizable: true,
				content: 'promoteDialog.html'
			};

			window.ArasModules.Dialog.show('iframe', param).promise.then(function (
				res
			) {
				if (!res) {
					return;
				}

				self._dataProvider.updateItem(res, row.sourceObject);
				self._onGridRowsChanged();
			});
		},

		disable: function () {
			// disable module
		},

		onUnlockItemButtonClick: function () {
			const selectedRowIds = this._grid.getSelectedRowIds();
			let rowsChanged = false;

			for (let i = 0; i < selectedRowIds.length; i++) {
				const rowId = selectedRowIds[i];
				const row = this._grid.rows.get(rowId);

				if (row) {
					const success = this._unlockItem(row);

					if (success) {
						rowsChanged = true;
					}
				}
			}

			if (rowsChanged) {
				this._onGridRowsChanged();
			}
		},

		onPromotionStarted: function () {
			this._promotionStarted = true;
			this._toolbar.disable();
			this._contextMenuModule.disable();
		},

		selectAll: function () {
			this._grid.settings.selectedRows = this._grid.settings.indexRows.slice(0);
			this._grid.render();
		},

		_unlockItem: function (row) {
			if (aras.isLockedByUser(row.sourceObject.node)) {
				const unlockedNode = aras.unlockItemEx(
					row.sourceObject.node.cloneNode(true)
				);

				if (unlockedNode) {
					this._dataProvider.updateItem(unlockedNode, row.sourceObject);

					return true;
				}
			}
		},

		_onGridRowsChanged: function () {
			if (!this._promotionStarted) {
				this._checkValidity();
			}

			const rows = this._getRows();
			this._grid.rows = rows;
			this._statusBar.setStatus(
				'status',
				rows.size + ' ' + this._mediator.getResource('items')
			);
			this._mediator.onGridChanged({
				items: this._dataProvider.getItems(),
				promoteType: this._promoteType
			});
		},

		_onGridRowChanged: function (itemId) {
			if (!this._promotionStarted) {
				this._checkValidity();
			}

			const row = this._getRow(itemId);
			this._grid.rows._store.set(itemId, row.get(itemId));
			this._statusBar.setStatus(
				'status',
				this._grid.rows._store.size + ' ' + this._mediator.getResource('items')
			);
			this._mediator.onGridChanged({
				items: this._dataProvider.getItems(),
				promoteType: this._promoteType
			});
		},

		_initToolbar: function () {
			const topWindow = aras.getMostTopWindowWithAras(window);
			this._toolbar = new ToolbarWrapper({
				id: 'mpo_gridtoolbar',
				connectId: 'gridtoolbar',
				useCompatToolbar: true
			});

			const contextParams = {
				toolbarApplet: this._toolbar,
				item: window.item,
				locationName: 'CustomGridToolbar',
				itemType: window.itemType,
				itemID: window.itemID
			};

			topWindow.cui.loadToolbarFromCommandBarsAsync(contextParams).then(
				function () {
					topWindow.cui.initToolbarEvents(this._toolbar);
					this._toolbar.showToolbar('mpo_gridtoolbar');
				}.bind(this)
			);
		},

		_initGrid: function () {
			const rows = new Map();
			this._grid = new Grid(document.getElementById('grid'), {
				editable: false,
				search: false
			});
			this._grid.head = this._createHeaders();
			this._grid.rows = rows;

			const self = this;
			this._grid.on('selectRow', function () {
				const isRowSelect = self._grid.settings.selectedRows.length > 0;
				self._toolbar.getItem('mpo_promote').setEnabled(isRowSelect);
			});

			this._initAditionalFormatters();
			this._ovverideGetCellType();

			this._grid.getSelectedRowIds = function () {
				return this.settings.selectedRows;
			};
		},

		_ovverideGetCellType: function () {
			this._grid.getCellType = function (headId, rowKey) {
				const formatters = {
					valid: 'validIcon',
					locked: 'lockedIcon'
				};

				return formatters[headId] ? formatters[headId] : 'text';
			};
		},

		_initAditionalFormatters: function () {
			const self = this;

			Grid.formatters.validIcon = function (headId, rowId, value) {
				if (!value) {
					return {
						className: 'aras-grid-row-cell__image',
						children: [
							{
								tag: 'img',
								className: 'aras-grid-row-image',
								attrs: {
									src: '../images/RedWarning.svg'
								}
							}
						]
					};
				} else {
					return {
						children: []
					};
				}
			};

			Grid.formatters.lockedIcon = function (headId, rowId, value, grid) {
				const row = grid.rows.get(rowId);
				const isNewItem = row.status === 'New Item';

				if (isNewItem || value) {
					const image = value
						? self._getLockedImage(row.sourceObject)
						: '../Images/New.svg';
					const imageNode = ArasModules.SvgManager.createInfernoVNode(image);
					imageNode.className = 'aras-grid-row-image';

					return {
						className: 'aras-grid-row-cell__image',
						children: [imageNode]
					};
				} else {
					return {
						children: []
					};
				}
			};

			Grid.formatters.text = function (headId, rowId, value, grid) {
				const row = grid.rows.get(rowId);
				let className = row.promoted ? 'mpo-promoted-cell ' : '';
				className += row.valid ? '' : 'mpo-invalid-cell';

				return {
					className: className
				};
			};
		},

		_getLockedImage: function (item) {
			const lockedById = item.getProperty('locked_by_id');
			const currentUserId = aras.getCurrentUserID();
			const lockedByMe = lockedById === currentUserId;
			const isDirty = item.getAttribute('isDirty');
			let image = '';

			if (lockedByMe) {
				if (isDirty) {
					image = '../images/Edit.svg';
				} else {
					image = '../images/ClaimOn.svg';
				}
			} else {
				image = '../images/ClaimOther.svg';
			}

			return image;
		},

		_getRows: function () {
			const rows = new Map();
			const items = this._dataProvider.getItems();

			for (let i = 0; i < items.length; i++) {
				rows.set(items[i].getID(), this._createItemRowObject(items[i]));
			}

			return rows;
		},

		_getRow: function (itemId) {
			const row = new Map();
			const item = this._dataProvider.getItem(itemId);

			row.set(itemId, this._createItemRowObject(item));

			return row;
		},

		_createItemRowObject: function (item) {
			const lifeCycleMapModel = this._dataProvider
				.getLifecycleMapProvider()
				.getLifeCycleForItem(item);
			let stateCellValue = '';
			if (lifeCycleMapModel) {
				const currentStateId = item.getProperty('current_state');
				const currentState = lifeCycleMapModel
					.getAllTargetStates()
					.find((state) => state.id === currentStateId);
				stateCellValue = currentState.label || currentState.name;
			}

			return {
				sourceObject: item,
				item: item.getProperty('keyed_name'),
				state: stateCellValue,
				locked: item.getProperty('locked_by_id') ? true : false,
				valid: item.getProperty('mpo_isItemValid') === '1',
				itemId: item.getID(),
				status: item.getProperty('mpo_status'),
				promoted: item.getProperty('mpo_promoted') === '1'
			};
		},

		_checkValidity: function () {
			this._dataProvider.validateItems(this._lifecycleMap, this._targetState);
		},

		_createHeaders: function () {
			const head = new Map();

			head.set('locked', {
				label: this._mediator.getResource('locked'),
				width: 60,
				resize: true
			});

			head.set('item', {
				label: this._mediator.getResource('item'),
				width: 140,
				resize: true
			});

			head.set('state', {
				label: this._mediator.getResource('state'),
				width: 110,
				resize: true
			});

			head.set('valid', {
				label: this._mediator.getResource('valid'),
				width: 60,
				resize: true
			});

			head.set('status', {
				label: this._mediator.getResource('status'),
				width: 240,
				resize: true
			});

			return head;
		},

		getSelectedItems: function () {
			const selectedRowsIds = this._grid.getSelectedRowIds();

			return selectedRowsIds.map(
				function (id) {
					return this._grid.rows.get(id).sourceObject;
				}.bind(this)
			);
		}
	});
});
