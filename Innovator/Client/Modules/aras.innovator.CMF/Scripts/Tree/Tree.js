/* global define,dojo, treeNodeTemplate */
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/tree/ObjectStoreModel',
	'dijit/Tree',
	'./TreeStore',
	'CMF/Scripts/DataModel',
	'CMF/Scripts/ComputedMethodHelper',
	'dijit/popup',
	'CMF/Scripts/PublicApi/Element',
	'dojo/keys'
], function (
	declare,
	connect,
	ObjectStoreModel,
	Tree,
	TreeStore,
	DataModel,
	ComputedMethodHelper,
	popup,
	Element,
	keys
) {
	var aras = parent.aras;
	var isMacOs = /mac/i.test(navigator.platform);
	/* jshint ignore:start */
	var treeNodeTemplate =
		'<div class="dijitTreeNode myClass" role="presentation"\r\n\t>' +
		'<div data-dojo-attach-point="rowNode" class="dijitTreeRow" role="presentation"' +
		'style="padding-top: 0px; padding-bottom: 0px; line-height:26px; border:none; position:relative"\r\n\t\t>' +
		'<span data-dojo-attach-point="expandoNode" class="dijitInline dijitTreeExpando"' +
		' role="presentation"></span\r\n\t\t><span data-dojo-attach-point="expandoNodeText"' +
		'class="dijitExpandoText" role="presentation"></span\r\n\t\t>' +
		'<span data-dojo-attach-point="contentNode"\r\n\t\t\tclass="dijitTreeContent" role="presentation">\r\n\t\t\t' +
		'<span role="presentation" class="dijitInline dijitIcon dijitTreeIcon" data-dojo-attach-point="iconNode">' +
		'</span\r\n\t\t\t><span data-dojo-attach-point="labelNode,focusNode" class="dijitTreeLabel" role="treeitem"' +
		'tabindex="-1" aria-selected="false" style="outline:0;">' +
		'</span>\r\n\t\t</span\r\n\t><span class="smm-container"></span></div>\r\n\t' +
		'<div data-dojo-attach-point="containerNode" class="dijitTreeNodeContainer" role="presentation" style="display: none;"></div>\r\n</div>\r\n';
	/* jshint ignore:end */
	return declare(null, {
		_tree: null,
		_docElemTypes: null,
		_treeStore: null,
		_connectId: null,
		_labelMethod: null,
		//TODO: can we get rid of this variable? Should tree know about Grid?
		lastSelectedTableId: null,

		_treeMenu: null,

		constructor: function (connectId, data, menu) {
			TreeStore.loadItems(data.items, data.store);
			Tree._TreeNode.prototype.templateString = treeNodeTemplate;
			this._treeStore = TreeStore;
			this._docElemTypes = data.docElemTypes;
			this._connectId = connectId;
			this._labelMethod = data.items.labelMethodName;

			var self = this;
			var store = this._treeStore.getMemStore();
			var storeModel = new ObjectStoreModel({
				store: store,
				query: { id: 'root' },
				mayHaveChildren: function (item) {
					return this.store.mayHaveChildren(item);
				},
				getLabel: function (item) {
					return self.getLabel(item, self);
				}
			});

			// set up the tree, assigning data model;
			var tree = new Tree(
				{
					model: storeModel,
					persist: false,
					onOpenClick: true,
					showRoot: true,
					getIconStyle: function (item, opened) {
						return self.getIconForTreeItem(item, opened);
					}
				},
				connectId
			);

			tree._createTreeNode = function (args) {
				var node = new Tree._TreeNode(args);
				self.updateSmmIcon(node, node.item);
				return node;
			};

			tree.startup();
			this._tree = tree;
			this._treeMenu = menu;
			menu._menu.bindDomNode(this._tree.domNode);

			this._tree.domNode.addEventListener(
				'contextmenu',
				function (menuEvent) {
					//disable browser's menu, e.g., on RMB click.
					if (
						tree.selectedNodes &&
						tree.dndController &&
						tree.dndController.current
					) {
						var isSelected = tree.selectedNodes.filter(function (node) {
							if (node.item === tree.dndController.current.item) {
								return true;
							}
						});
						// if we press rmb on node which is not selected
						if (isSelected.length === 0) {
							var treeItem = tree.tree.dndController.current.item;
							self.selectNode(
								treeItem.rootItemId,
								treeItem.id,
								treeItem.id,
								treeItem.parentId,
								true
							);
						}
					}
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			connect.connect(this._tree, 'onClick', function (treeItem, node, evt) {
				popup.close(menu._menu);
				if (treeItem) {
					var visibleTreeItems = self._tree.model.store.getPropertyElements(
						treeItem
					);
					if (visibleTreeItems.length > 0) {
						var isCtrlPressed;
						if (evt) {
							isCtrlPressed = isMacOs ? evt.metaKey : evt.ctrlKey;
						}
						var isToUnselect = isCtrlPressed;
						if (isCtrlPressed) {
							var selectedNodes = self.getSelectedNodes();
							var i;
							for (i = 0; i < selectedNodes.length; i++) {
								if (selectedNodes[i].id === treeItem.id) {
									isToUnselect = false;
									break;
								}
							}
						}
						self.onNodeSelected(
							treeItem.rootItemId,
							visibleTreeItems[0].id,
							null,
							isCtrlPressed,
							isToUnselect
						);
						self.lastSelectedTableId = visibleTreeItems[0].id;
					}
				}
			});

			connect.connect(this._tree.domNode, 'onscroll', function () {
				if (
					menu.isShowingNow() &&
					menu._menu.currentTarget.closest('#' + connectId)
				) {
					popup.close(menu._menu);
				}
			});

			connect.connect(this._tree, 'onKeyDown', this.onKeyDown.bind(this));

			this.computedMethodHelper = new ComputedMethodHelper(data.store);
			this.updateRootNodes();
		},

		getIconForTreeItem: function (item) {
			var iconPath = item.getIconPath();
			if (iconPath) {
				if (iconPath.toLowerCase().indexOf('vault:///?fileid=') === 0) {
					var fileId = iconPath.replace(/vault:\/\/\/\?fileid=/i, '');
					iconPath = aras.IomInnovator.getFileUrl(
						fileId,
						parent.aras.Enums.UrlType.SecurityToken
					);
				} else {
					// because of docementEditor.html location
					iconPath = dojo.baseUrl + '../' + iconPath;
				}
				var size = '22px';
				var backgroundImage = 'url(' + iconPath + ')';
				return {
					backgroundImage: backgroundImage,
					backgroundSize: '22px 22px',
					backgroundPosition: 'center center',
					height: size,
					width: size,
					marginBottom: '2px'
				};
			}
			return '';
		},

		isNodeExist: function (id) {
			var node = this._tree.model.store.getTreeItem(id);
			return node ? true : false;
		},

		getSelectedNode: function () {
			return this._tree.selectedItem;
		},

		getSelectedNodes: function () {
			return this._tree.selectedItems;
		},

		selectNode: function (
			rowId,
			nodeId,
			cellId,
			parentNodeId,
			isNotToSelectForEdit
		) {
			if (nodeId === 'root') {
				this.selectRootNode();
				return;
			}
			var rootItem = this._tree.model.store.getTreeItem(rowId);
			var node = this._tree.model.store.getTreeItem(nodeId);
			if (!node && parentNodeId) {
				nodeId = parentNodeId;
				var parentNode = this._tree.model.store.getTreeItem(parentNodeId);
				var visibleTableItems = this._tree.model.store.getPropertyElements(
					parentNode
				);
				cellId = visibleTableItems[0].id;
			} else {
				var tableItems = this._tree.model.store.getPropertyElements(node);
				var tableItem = tableItems.filter(function (element) {
					return element.tableItemId === cellId && element.visible;
				});
				if (tableItem.length < 1 && nodeId !== 'root') {
					cellId = this._tree.model.store.getPropertyElements(node)[0].id;
				}
			}
			this.selectNodeByRootItem(nodeId, rootItem, null, !isNotToSelectForEdit);
			this.onNodeSelected(rowId, cellId);
			this.lastSelectedTableId = cellId;
		},

		selectRootNode: function () {
			var resultChain = ['root'];
			var self = this;
			this._tree.set('path', resultChain).then(function () {
				self._tree.domNode.scrollTop =
					self._tree.selectedNode.domNode.offsetTop - 10;
			});
		},

		selectNodeByRootItem: function (
			nodeId,
			rootItem,
			currentNode,
			isToSelectForEdit
		) {
			var chain = this._tree.model.store.getItemChain(nodeId);
			var resultChain = ['root'];
			resultChain = resultChain.concat(chain);
			var self = this;
			this._tree.set('path', resultChain).then(function () {
				self._tree.domNode.scrollTop =
					self._tree.selectedNode.domNode.offsetTop - 10;
			});
			if (currentNode) {
				var visibleItems = this._tree.model.store.getPropertyElements(
					currentNode
				);
				if (visibleItems.length > 0) {
					this.lastSelectedTableId = isToSelectForEdit
						? this._tree.model.store.getPropertyElementIdForEdit(currentNode)
						: visibleItems[0].id;
					this.onNodeSelected(
						rootItem.id,
						this.lastSelectedTableId,
						isToSelectForEdit
					);
				}
			}
		},

		updateElementInTree: function (parentNode, element) {
			this.updateChildrenNodes(parentNode, true);
			if (element) {
				element.title = this.getLabel(element);
				this.updateTreeLabel(element);
			}
		},

		updateTreeLabel: function (treeItem) {
			var node = this._tree.getNodesByItem(treeItem);
			if (node && node.length > 0 && node[0]) {
				//var textSpan = node[0].domNode.getElementsByClassName("dijitTreeLabel");
				//textSpan = textSpan.length > 0 ? textSpan[0] : null;
				//if (textSpan) {
				//	if (treeItem.isCandidate) {
				//		textSpan.classList.add("candidate");
				//	}
				//}
				node[0].set('label', treeItem.title);
			}
		},

		updateChildrenNodes: function (parentNode, updateIcons) {
			var parentNodes = this._tree.getNodesByItem(parentNode);
			if (parentNodes && parentNodes[0]) {
				var children = this._tree.model.store.getChildren(parentNode);
				parentNodes[0].setChildItems(children);
				if (updateIcons) {
					this.updateChildrenIcons(children);
				}
			}
		},

		updateRootNodes: function () {
			var rootItem = this._tree.model.store.getTreeItem('root');
			var children = this._tree.model.store.getChildren(rootItem);
			this.updateChildrenIcons(children);
		},

		updateChildrenIcons: function (children) {
			for (var i = 0; i < children.length; i++) {
				var node = this._tree.getNodesByItem(children[i]);
				if (node && node.length > 0) {
					this.updateSmmIcon(node[0], children[i]);
				}
			}
		},

		updateSmmIcon: function (treeNode, item) {
			if (treeNode.rowNode.children.length > 3) {
				var smmSpan = treeNode.rowNode.children[3];
				smmSpan.classList.remove('smm-candidate');
				smmSpan.classList.remove('smm-flagged');
				if (item.isCandidate) {
					smmSpan.classList.add('smm-candidate');
				}

				if (item.flagged) {
					smmSpan.classList.add('smm-flagged');
				}

				var smmTextSpan = treeNode.contentNode.children[1];
				smmTextSpan.classList.remove('smm-candidate-in-tree');
				smmTextSpan.classList.remove('smm-flagged-in-tree');

				if (item.isCandidate) {
					smmTextSpan.classList.add('smm-candidate-in-tree');
				}

				if (item.flagged) {
					smmTextSpan.classList.add('smm-flagged-in-tree');
				}
			}
		},

		addRootNode: function (newNode, parentNode, sorceNodeId) {
			newNode.title = this.getLabel(newNode);
			this.updateChildrenNodes(parentNode, true);
			this.onRowNodeAdded(newNode, sorceNodeId);
		},

		insertNode: function (
			rootItem,
			newNode,
			changedItems,
			doNotSaveToItem,
			parentNode
		) {
			newNode.title = this.getLabel(newNode);
			this.updateChildrenNodes(parentNode, true);
			this.onRowNodeUpdated(rootItem, newNode, changedItems, true);
			this.onInsertItem(rootItem);
		},

		deleteNode: function (nodeId, rootNode, parentNode, isRootNode) {
			this.updateChildrenNodes(parentNode);
			if (isRootNode) {
				this.onRowNodeDeleted(nodeId);
			} else {
				this.onDeleteItem(rootNode);
			}
		},

		updateNode: function (treeItem, rowId, cellId) {
			treeItem.title = this.getLabel(treeItem);
			this.updateTreeLabel(treeItem);
			this.onNodeSelected(rowId, cellId);
		},

		getDocElemTypes: function () {
			return this._docElemTypes;
		},

		getRootNodeById: function (id) {
			return this._tree.model.store.findRootNode(id);
		},

		getLabel: function (item, self) {
			//TODO: make this method static and not public
			if (item.id === 'root') {
				return aras.getItemProperty(window.parent.item, 'name');
			}
			var store = this._tree
				? this._tree.model.store
				: self._treeStore.getMemStore();
			if (this._labelMethod) {
				var element = new Element(item, store.getDataStore());
				return aras.evalMethod(this._labelMethod, '', { element: element });
			} else {
				return store.getTreeNodeLabel(item);
			}
		},

		reload: function (data) {
			this._tree.dndController.selectNone();

			// Completely delete every node from the dijit.Tree
			this._tree._itemNodesMap = {};
			this._tree.rootNode.state = 'UNCHECKED';
			if (this._tree.model.root) {
				this._tree.model.root.children = null;
			}

			// Destroy the widget
			this._tree.rootNode.destroyRecursive();

			// Recreate the model, (with the model again)
			this._treeStore.setData(data.items, data.store);
			var self = this;
			var dataModel = new ObjectStoreModel({
				store: this._treeStore.getMemStore(),
				query: { id: 'root' },
				mayHaveChildren: function (item) {
					return this.store.mayHaveChildren(item);
				},
				getLabel: function (item) {
					return self.getLabel(item);
				}
			});

			this._tree.model = dataModel;

			// Rebuild the tree
			this._tree.postMixInProperties();
			this._tree._load();
		},
		destroy: function () {
			this._treeMenu._menu.unBindDomNode(this._tree.domNode);
			this._tree.destroy();
		},

		getStore: function () {
			return this._tree.model.store;
		},

		/* jshint ignore:start */
		//Events
		onNodeSelected: function (
			rootNodeId,
			tableItemId,
			isSelectedForEdit,
			isMultiselect,
			isToUnselect
		) {},

		onNodeTextUpdated: function (id, value) {},

		onRowNodeAdded: function (newNode, sourceId, doNotSaveToItem) {},

		onRowNodeUpdated: function (row, newNode, changedItems, doNotSaveToItem) {},

		onRowNodeDeleted: function (id) {},

		onInsertItem: function (rootItem) {},

		onDeleteItem: function (rootItem) {},

		onSimpleUpdate: function (rows) {},
		/* jshint ignore:end */

		onKeyDown: function (e) {
			if (
				e.keyCode !== keys.UP_ARROW &&
				e.keyCode !== keys.DOWN_ARROW &&
				e.keyCode !== keys.RIGHT_ARROW &&
				e.keyCode !== keys.LEFT_ARROW
			) {
				return;
			}

			var selNode = this.getSelectedNode();
			var nextNode;

			switch (e.keyCode) {
				case keys.UP_ARROW:
					nextNode = this.getPreviousVisibleNode(selNode);
					break;
				case keys.DOWN_ARROW:
					nextNode = this.getNextVisibleNode(selNode);
					break;
				case keys.RIGHT_ARROW:
					nextNode = this._tree.model.store.getFirstChild(selNode);
					break;
				case keys.LEFT_ARROW:
					nextNode = this._tree.model.store.getParent(selNode);
					break;
			}

			if (nextNode) {
				this.selectNode(
					nextNode.rootItemId,
					nextNode.id,
					nextNode.id,
					nextNode.parentId,
					true
				);

				var node = this._tree.getNodesByItem(nextNode);
				node = node[0];
				node.focus();
			}
		},

		getNextVisibleNode: function (selectedNode) {
			var itemDomNode = this._tree.getNodesByItem(selectedNode);
			itemDomNode = itemDomNode[0];

			var store = this._tree.model.store;

			if (itemDomNode.isExpanded) {
				//return first child if item is expanded
				return store.getTreeItem(selectedNode.childrenIds[0]);
			} else {
				firstParentNodeWithSibling = this.getFirstParentNodeWithSibling(
					selectedNode
				);
				return firstParentNodeWithSibling
					? store.getNextChild(firstParentNodeWithSibling)
					: null;
			}
		},

		getFirstParentNodeWithSibling: function (treeNode) {
			if (treeNode.id === 'root') {
				//root item cannot have siblings
				return null;
			}

			return this._tree.model.store.getNextChild(treeNode)
				? treeNode
				: this.getFirstParentNodeWithSibling(
						this._tree.model.store.getTreeItem(treeNode.parentId)
				  );
		},

		getPreviousVisibleNode: function (selectedNode) {
			if (selectedNode.id === 'root') {
				return null;
			}

			var store = this._tree.model.store;
			var previousSibling = store.getPreviousSibling(selectedNode);

			if (previousSibling) {
				return this.getDeepestVisibleChildNode(previousSibling);
			} else {
				return this._tree.model.store.getTreeItem(selectedNode.parentId);
			}
		},

		getDeepestVisibleChildNode: function (treeNode) {
			var itemDomNode = this._tree.getNodesByItem(treeNode);
			itemDomNode = itemDomNode[0];

			return itemDomNode.isExpanded
				? this.getDeepestVisibleChildNode(
						this._tree.model.store.getTreeItem(
							treeNode.childrenIds[treeNode.childrenIds.length - 1]
						)
				  )
				: treeNode;
		}
	});
});
