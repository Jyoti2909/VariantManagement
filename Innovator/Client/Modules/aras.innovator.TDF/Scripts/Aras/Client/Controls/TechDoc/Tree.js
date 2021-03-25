define([
	'dojo/_base/declare',
	'dijit/Tree',
	'dojo/store/Memory',
	'dojo/store/Observable',
	'dijit/tree/ObjectStoreModel',
	'dojo/aspect',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/TreeRenderer',
	'Aras/Client/Controls/Experimental/ContextMenu',
	'dojo/on',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOM',
	'dojo/when'
], function (
	declare,
	DijitTree,
	Memory,
	Observable,
	ObjectStoreModel,
	aspect,
	TreeRenderer,
	ContextMenu,
	on,
	DOMapi,
	when
) {
	var TechDocTree = declare('Aras.Client.Controls.TechDoc.Tree', DijitTree, {
		viewmodel: null,
		treeRenderer: null,
		actionsHelper: null,
		_contextMenu: null,
		_contextMenuHelper: null,
		_contextMenuKey: null,
		_clipboard: null,
		_scrollNode: null,

		constructor: function (args) {
			var fileref = document.createElement('link');
			var storeData;

			fileref.setAttribute('rel', 'stylesheet');
			fileref.setAttribute('type', 'text/css');
			fileref.setAttribute(
				'href',
				args.styleSheet ||
					'Scripts/Aras/Client/Controls/TechDoc/themes/Tree.css'
			);
			document.getElementsByTagName('head')[0].appendChild(fileref);

			this.persist = true;
			this.viewmodel = args.structuredDocument;
			this.treeRenderer = new TreeRenderer({
				tree: this,
				viewmodel: this.viewmodel
			});
			this.actionsHelper = this.viewmodel.ActionsHelper();
			this._clipboard = this.viewmodel.Clipboard();
			this.domapi = new DOMapi({
				document: document,
				viewmodel: this.viewmodel
			});
			this._contextMenuKey = 0;
			storeData = this._getRenderedTreeStoreData();

			this._populateTreeModel(storeData);
		},

		_getRenderedTreeStoreData: function () {
			var storeData = this.treeRenderer.RenderModel(this.viewmodel.Dom());
			storeData.labelType = 'html';
			return storeData;
		},

		_populateTreeModel: function (storeData) {
			var viewModel;
			var schemaHelper;
			var treeStore;

			treeStore = new Memory({
				data: storeData,
				getChildren: function (object) {
					return this.query({ parent: object.id });
				}
			});

			// Create the model
			viewModel = this.viewmodel;
			schemaHelper = this.viewmodel.Schema();

			this.model = new ObjectStoreModel({
				store: treeStore,
				query: { id: this.viewmodel.Dom().Id() },
				mayHaveChildren: function (object) {
					var schemaElement = viewModel.GetElementById(object.id);
					var isTextElement =
						schemaElement.is('ArasTextXmlSchemaElement') ||
						schemaHelper.IsContentMixed(schemaElement);
					var childItems = schemaElement.ChildItems();

					return !isTextElement && childItems && childItems.length() > 0;
				},
				labelType: 'html'
			});
		},

		startup: function () {
			var self = this;
			var originOnClickRelease;

			this.inherited(arguments);

			this._contextMenu = new ContextMenu(this.domNode, true);
			this.domNode.oncontextmenu = this._showContextMenu.bind(this);
			this._scrollNode = this.domNode.querySelector('.dijitTreeContainer');

			on(this.domNode, 'keydown', function (e) {
				self._onKeyDownHandler(e);
			});

			this.domNode.addEventListener(
				'click',
				function (clickEvent) {
					var targetWidget = dijit.getEnclosingWidget(clickEvent.target);

					if (targetWidget.declaredClass != 'dijit._TreeNode') {
						this.structuredDocument.SetSelectedItems();
					}
				}.bind(this)
			);

			this._setupRootNode();

			aspect.after(
				this._contextMenu,
				'onItemClick',
				this._onItemClickHandler.bind(this),
				true
			);
			aspect.after(this, 'onClick', this._onTreeNodeClick, true);
			aspect.after(
				this.viewmodel,
				'OnInvalidate',
				this._onViewModelInvalidate.bind(this),
				true
			);
			aspect.after(
				this.viewmodel,
				'onSelectionChanged',
				this.selectionChangeHandler.bind(this),
				true
			);
		},

		getIconClass: function (item, opened) {
			//return this.inherited(arguments);
			return item.type;
		},

		getLabelClass: function (item, opened) {
			return item.type;
		},

		getIconStyle: function (item, opened) {
			return item.style;
		},

		getRowClass: function (item, opened) {
			return item.rowClass;
		},

		_getNodeById: function (itemId) {
			var mappedNodes = this._itemNodesMap[itemId];

			return mappedNodes ? mappedNodes[0].domNode : null;
		},

		_onItemChange: function (item) {
			// overriden version from dijit/Tree.js
			var model = this.model;
			var identity = model.getIdentity(item);
			var itemNodes = this._itemNodesMap[identity];

			if (itemNodes) {
				var label = this.getLabel(item);
				var tooltip = this.getTooltip(item);
				var node;
				var i;

				for (i = 0; i < itemNodes.length; i++) {
					node = itemNodes[i];

					node._setLabelAttr(label);
					node._set('tooltip', tooltip);
					node.item = item;

					node._updateItemClasses(item);
				}
			}
		},

		suspendPainting: function () {
			this._isPaintingSuspended = true;
		},

		resumePainting: function (forcePaint) {
			if (this._isPaintingSuspended) {
				this._isPaintingSuspended = false;

				if (forcePaint) {
					this._startPaint(true);
				}
			}
		},

		_startPaint: function (p) {
			// overriden version from dijit/Tree.js
			if (!this._isPaintingSuspended) {
				this._outstandingPaintOperations++;

				if (this._adjustWidthsTimer) {
					this._adjustWidthsTimer.remove();
					delete this._adjustWidthsTimer;
				}

				var oc = function () {
					this._outstandingPaintOperations--;

					if (
						this._outstandingPaintOperations <= 0 &&
						!this._adjustWidthsTimer &&
						this._started
					) {
						// Use defer() to avoid a width adjustment when another operation will immediately follow,
						// such as a sequence of opening a node, then it's children, then it's grandchildren, etc.
						this._adjustWidthsTimer = this.defer('_adjustWidths');
					}
				}.bind(this);
				when(p, oc, oc);
			}
		},

		_onItemClickHandler: function (cmdId, rowId) {
			this.actionsHelper.onMenuItemClick(cmdId, rowId);
			this._hideContextMenu();

			if (cmdId.split(':')[0] === 'pasteelement') {
				var selectedItems = this.viewmodel.GetSelectedItems();
				var selectedNode = this._getNodeById(rowId);
				var self = this;

				setTimeout(function () {
					self._scrollToSelectedItems([{ id: selectedItems[0].Id() }]);
				});

				selectedNode.focus();
			}
		},

		_onKeyDownHandler: function (e) {
			var isEditDocument = this.viewmodel.IsEditable();
			var keyCode = (this._contextMenuKey = e.keyCode);
			var isMacOS = /mac/i.test(navigator.platform);
			var ctrlKeyPressed = isMacOS ? e.metaKey : e.ctrlKey;
			var selectedItems = this.viewmodel.GetSelectedItems();
			var isLockedNodesSelected = selectedItems.some(
				function (item) {
					return this.viewmodel.isRootElementContained(item.Parent || item);
				}.bind(this)
			);
			var isAvailablePastCut =
				!this.viewmodel.hasClassificationBindedElements() ||
				!isLockedNodesSelected;

			if (ctrlKeyPressed) {
				switch (keyCode) {
					case 90: //z
						if (isEditDocument) {
							this.actionsHelper.executeAction('undoaction');
						}
						break;
					case 89: //y
						if (isEditDocument) {
							this.actionsHelper.executeAction('redoaction');
						}
						break;
					case 67: //c
						if (
							selectedItems.length &&
							!this.viewmodel.isRootElementContained(selectedItems)
						) {
							this.actionsHelper.executeAction('copyelement', {
								selectedItems: selectedItems,
								clipboard: this._clipboard
							});
						}
						break;
					case 88: //x
						if (isEditDocument && isAvailablePastCut) {
							if (
								selectedItems.length &&
								!this.viewmodel.isRootElementContained(selectedItems)
							) {
								this.actionsHelper.executeAction('cutelement', {
									selectedItems: selectedItems,
									clipboard: this._clipboard,
									checkAccess: true
								});
							}
						}
						break;
					case 86: //v
						if (isEditDocument && isAvailablePastCut) {
							var targetWidget = dijit.getEnclosingWidget(e.target);

							if (targetWidget.declaredClass == 'dijit._TreeNode') {
								var treeItem = targetWidget.item;
								var pasteSubMenu = [];
								var modes = [
									{ value: 'before', name: 'Before' },
									{ value: 'into', name: 'Into' },
									{ value: 'after', name: 'After' }
								];
								var action = this.actionsHelper.getAction('pasteelement');
								var selectedItem = selectedItems[0];
								var validationResult;
								var currentMode;
								var i;

								validationResult = action.Validate({
									selectedItem: selectedItem,
									clipboard: this._clipboard,
									actions: modes
								});
								for (i = 0; i < modes.length; i++) {
									currentMode = modes[i];

									if (validationResult[currentMode.value]) {
										pasteSubMenu.push({
											id: 'pasteelement:' + currentMode.value,
											name: currentMode.name
										});
									}
								}

								if (pasteSubMenu.length === 1) {
									this.viewmodel.SuspendInvalidation();
									action.Execute({
										selectedItem: selectedItem,
										clipboard: this._clipboard,
										action: pasteSubMenu[0].id.split(':')[1]
									});
									this.viewmodel.ResumeInvalidation();
								} else {
									var position = dojo.position(targetWidget.domNode);
									this.actionsHelper.showContextMenu(
										this._contextMenu,
										this,
										pasteSubMenu,
										treeItem.id,
										{
											x: position.x + this.domNode.offsetWidth / 2,
											y: position.y
										}
									);
								}
							}
						}
						break;
					default:
						e.preventDefault();
						return false;
				}
			} else {
				e.preventDefault();
			}
		},

		_getSelectionPath: function (item) {
			var parentItem = item;
			var path = [parentItem.id];

			while (parentItem.parent) {
				parentItem = this.model.store.query({ id: parentItem.parent })[0];
				path.push(parentItem.id);
			}

			path.reverse();
			return path;
		},

		_selectItems: function (selectedItems) {
			var paths = [];
			var selectedItem;
			var i;

			for (i = 0; i < selectedItems.length; i++) {
				selectedItem = selectedItems[i];
				paths.push(this._getSelectionPath(selectedItem));
			}

			this.set('paths', paths);
		},

		_showContextMenu: function (e) {
			var targetWidget = dijit.getEnclosingWidget(e.target);

			if (targetWidget.declaredClass == 'dijit._TreeNode') {
				var treeItem = targetWidget.item;
				var selectedWrappedObject = this.viewmodel.GetElementById(treeItem.id);
				var isClickOnSelected =
					this.viewmodel.GetSelectedItems().indexOf(selectedWrappedObject) >= 0;
				var xCoor = 0;
				var yCoor = 0;
				var menuModel;

				if (!isClickOnSelected) {
					this._selectItems([treeItem]);
					this._onTreeNodeClick(treeItem, this.getParent().currentTarget, null);
				}

				if (this._contextMenuKey === 93) {
					var targetNode = this._getNodeById(treeItem.id);
					var currentNode = targetNode
						? targetNode.querySelector('.dijitTreeContent')
						: null;

					while (currentNode) {
						xCoor += currentNode.offsetLeft;
						yCoor += currentNode.offsetTop;
						currentNode = currentNode.offsetParent;
					}

					xCoor += 10;
					yCoor += 10 - this.domNode.scrollTop;
				} else {
					xCoor = e.pageX;
					yCoor = e.pageY;
				}

				menuModel = this.actionsHelper.GetActionsMenuModel(
					this.viewmodel.GetSelectedItems()
				);
				this.actionsHelper.showContextMenu(
					this._contextMenu,
					this,
					menuModel,
					treeItem.id,
					{
						x: xCoor,
						y: yCoor
					}
				);
			} else {
				this.viewmodel.SetSelectedItems();
			}

			this._contextMenuKey = 0;
			e.preventDefault();
			e.stopPropagation();
		},

		_hideContextMenu: function () {
			dijit.popup.close(this._contextMenu.menu);

			this._contextMenu.rowId = null;
			this._contextMenu.removeAll();
		},

		_onTreeNodeClick: function (treeItem, treeNode, evt) {
			var selectedWrappedObjects = [];
			var selectedTreeItem;
			var wrappedObject;
			var i;

			for (i = 0; i < this.selectedItems.length; i++) {
				selectedTreeItem = this.selectedItems[i];
				wrappedObject = this.structuredDocument.GetElementById(
					selectedTreeItem.id
				);

				selectedWrappedObjects.push(wrappedObject);
			}

			this.structuredDocument.Cursor().Set(null, -1, null, -1);
			this.structuredDocument.SetSelectedItems(selectedWrappedObjects);
		},

		_onViewModelInvalidate: function (sender, earg) {
			var invalidationList = earg.invalidationList;

			if (invalidationList.length) {
				var scrollNode = this._scrollNode;
				var originScrollTop = scrollNode.scrollTop;
				var i;

				for (i = 0; i < invalidationList.length; i++) {
					this.treeRenderer.invalidate(invalidationList[i]);
				}

				this.treeRenderer.refresh();

				if (scrollNode.scrollTop !== originScrollTop) {
					scrollNode.scrollTop = originScrollTop;
				}
			}
		},

		_setupRootNode: function () {
			if (!this._rootNode) {
				var rootTreeNode = this.domNode.querySelector('.dijitTreeIsRoot');
				var widgetId = rootTreeNode.getAttribute('widgetId');

				this._rootNode = rootTreeNode.firstChild;
				this._rootNode.setAttribute('widgetId', widgetId);
				this._rootNode.classList.add('TitleRow');

				this.domNode.insertBefore(this._rootNode, this.domNode.firstChild);

				this._rootNode.addEventListener('keydown', function (keyEvent) {
					keyEvent.preventDefault();
					keyEvent.stopPropagation();
				});
			}
		},

		selectionChangeHandler: function (sender, selectedItems) {
			var selectedTreeItems = [];
			var paths = [];
			var self = this;
			var schemaElement;
			var referencedElements;
			var referencedElement;
			var storeItem;
			var selectionPromise;
			var i;
			var j;

			for (i = 0; i < selectedItems.length; i++) {
				schemaElement = selectedItems[i];
				referencedElements = this.viewmodel.GetElementsByOrigin(
					schemaElement.origin
				);

				for (j = 0; j < referencedElements.length; j++) {
					referencedElement = this.viewmodel.GetAncestorOrSelfInteractiveElement(
						referencedElements[j]
					);

					storeItem = this.model.store.query({
						id: referencedElement.Id()
					})[0];
					if (storeItem) {
						selectedTreeItems.push(storeItem);
						paths.push(this._getSelectionPath(storeItem));
					}
				}
			}

			selectionPromise = this.set('paths', paths);

			if (selectedTreeItems.length == 1) {
				selectionPromise.then(function () {
					self._scrollToSelectedItems(selectedTreeItems);
				});
			}
		},

		_scrollToSelectedItems: function (selectedItems) {
			if (selectedItems.length) {
				var scrollNode = this._scrollNode;
				var selectedItem;
				var itemNode;
				var currentNode;
				var minOffsetTop;
				var treeHeight;
				var scrollTop;
				var offsetTop;
				var i;

				for (i = 0; i < selectedItems.length; i++) {
					selectedItem = selectedItems[i];
					itemNode = this._getNodeById(selectedItem.id);
					currentNode = itemNode;
					offsetTop = 0;

					while (currentNode && currentNode !== scrollNode) {
						offsetTop += currentNode.offsetTop;
						currentNode = currentNode.offsetParent;
					}

					minOffsetTop =
						minOffsetTop === undefined
							? offsetTop
							: Math.min(minOffsetTop, offsetTop);
				}

				scrollTop = scrollNode.scrollTop;
				treeHeight = scrollNode.offsetHeight;

				if (minOffsetTop < scrollTop || minOffsetTop > scrollTop + treeHeight) {
					scrollNode.scrollTop = minOffsetTop - treeHeight / 2;
				}
			}
		},

		_initState: function () {
			// overridden dijit/Tree method
			this._openedNodes = {};
		},

		_saveExpandedNodes: function () {
			// overridden dijit/Tree method, prevented saving expand/collapse state into cookie
		},

		_getOpenedNodesUidPaths: function () {
			var uidPaths = [];
			var idPath;
			var uidPath;
			var nodeId;
			var separatorIndex;

			for (idPath in this._openedNodes) {
				separatorIndex = idPath.lastIndexOf('/');
				nodeId = idPath.substr(separatorIndex > -1 ? separatorIndex + 1 : 0);

				uidPath = this._getNodeUidPath(nodeId);
				uidPaths.push(uidPath);
			}

			return uidPaths;
		},

		_getNodeUidPath: function (nodeId) {
			var nodeItem = this.model.store.get(nodeId);
			var uidPath;
			var parentItem;

			if (nodeItem) {
				uidPath = [nodeItem.uid];

				parentItem = this.model.store.get(nodeItem.parent);
				while (parentItem) {
					uidPath.push(parentItem.uid);
					parentItem = this.model.store.get(parentItem.parent);
				}
				uidPath.reverse();
			}

			return uidPath;
		}
	});

	return TechDocTree;
});
