define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/RendererFactory'
], function (declare, RendererFactory) {
	return declare('Aras.Client.Controls.TechDoc.UI.TreeRenderer', null, {
		_viewmodel: null,
		_tree: null,
		_rendererFactory: null,

		constructor: function (args) {
			this._viewmodel = args.viewmodel;
			this._tree = args.tree;
			this._rendererFactory = new RendererFactory({
				viewmodel: this._viewmodel
			});
			this._invalidationList = [];
		},

		_isTopInvalidObject: function (/*WrappedObject*/ obj) {
			var objectToCheck = obj.Parent;

			while (objectToCheck) {
				if (this._invalidationList.indexOf(objectToCheck) >= 0) {
					return false;
				}

				objectToCheck = objectToCheck.Parent;
			}

			return true;
		},

		invalidate: function (/*WrappedObject*/ invalidObject) {
			this._invalidateObject(invalidObject);
		},

		_invalidateObject: function (/*WrapeedObject*/ invalidObject) {
			if (this._invalidationList.indexOf(invalidObject) == -1) {
				this._invalidationList.push(invalidObject);
			}
		},

		buildStoreStructure: function () {
			var storeStructure = {};
			var storeItems = this._tree.model.store.data;
			var storeIndex = this._tree.model.store.index;
			var currentItem;
			var itemId;
			var parentId;
			var i;

			for (i = 0; i < storeItems.length; i++) {
				currentItem = storeItems[i];
				parentId = currentItem.parent;
				itemId = currentItem.id;

				if (parentId) {
					structureItem = storeStructure[parentId];

					if (!structureItem) {
						structureItem = {
							id: parentId,
							children: [],
							index: storeIndex[parentId]
						};

						storeStructure[parentId] = structureItem;
					}

					structureItem.children.push(currentItem);
				}

				if (!storeStructure[itemId]) {
					storeStructure[itemId] = {
						id: itemId,
						children: [],
						index: storeIndex[itemId]
					};

					storeStructure[itemId].index = storeIndex[itemId];
				}
			}

			return storeStructure;
		},

		getChildrenFromStoreStructure: function (
			targetStoreItem,
			storeStructure,
			itemChildren
		) {
			var childItems = storeStructure[targetStoreItem.id].children;
			var storeItem;
			var i;

			itemChildren = itemChildren || [];

			for (i = 0; i < childItems.length; i++) {
				storeItem = childItems[i];
				itemChildren.push(storeStructure[storeItem.id]);

				this.getChildrenFromStoreStructure(
					storeItem,
					storeStructure,
					itemChildren
				);
			}

			return itemChildren;
		},

		itemDescendantSorter: function (firstItem, secondItem) {
			return secondItem.index - firstItem.index;
		},

		removeChildItemsFromStore: function (invalidTreeItem, storeStructure) {
			var childItems = this.getChildrenFromStoreStructure(
				invalidTreeItem,
				storeStructure
			);
			var treeStore = this._tree.model.store;
			var treeNodes;
			var item;
			var itemId;
			var i;
			var j;

			childItems = childItems.sort(this.itemDescendantSorter);

			for (i = 0; i < childItems.length; i++) {
				item = childItems[i];
				itemId = item.id;
				treeNodes = this._tree._itemNodesMap[itemId] || [];

				for (j = 0; j < treeNodes.length; j++) {
					treeNodes[j]._loadDeferred = null;
				}

				treeStore.data.splice(item.index, 1);
				delete this._tree.model.childrenCache[itemId];
			}

			treeStore.setData(treeStore.data);
		},

		refresh: function (/*WrappedObject*/ wrappedObject) {
			var invalidObject;
			var i;

			if (!wrappedObject) {
				for (i = 0; i < this._invalidationList.length; i++) {
					invalidObject = this._invalidationList[i];

					if (this._isTopInvalidObject(invalidObject)) {
						this.refresh(invalidObject);
					}
				}

				this._invalidationList.length = 0;
			} else {
				var actualElement = this._viewmodel.GetAncestorOrSelfInteractiveElement(
					wrappedObject
				);
				var treeWidget = this._tree;
				var treeStore = treeWidget.model.store;
				var invalidTreeItem = treeStore.query({ id: actualElement.Id() })[0];

				// If Changed DOM
				if (!actualElement.Parent && !invalidTreeItem) {
					this._removeChildItemsFromStoreRecursively(invalidTreeItem);
					treeStore.remove(invalidTreeItem.id);
				} else if (invalidTreeItem) {
					var invalidItemChilds = treeStore.query({
						parent: invalidTreeItem.id
					});
					var validTreeItems;
					var invalidWrappedObject;

					invalidWrappedObject = this._viewmodel.GetElementById(
						invalidTreeItem.id
					);
					validTreeItems = this.RenderModel(invalidWrappedObject);

					if (validTreeItems.length == 1 && !invalidItemChilds.length) {
						// we changed current item
						var validItem = validTreeItems[0];

						treeStore.put(validItem);
						treeWidget._onItemChange(validItem);
					} else {
						var storeStructure = this.buildStoreStructure();
						var treeItem;
						var modelElement;
						var idPath;
						var newChildItems;

						openedUidPaths = treeWidget._getOpenedNodesUidPaths();
						this.removeChildItemsFromStore(invalidTreeItem, storeStructure);

						treeWidget.suspendPainting();
						for (i = 0; i < validTreeItems.length; i++) {
							treeStore.put(validTreeItems[i]);
							treeWidget._onItemChange(validTreeItems[i]);
						}
						treeWidget.resumePainting();

						treeWidget._openedNodes = {};
						for (i = 0; i < openedUidPaths.length; i++) {
							modelElement = this._viewmodel.findElementByUidPath(
								openedUidPaths[i]
							);

							if (modelElement) {
								idPath = this._viewmodel.getElementIdPath(modelElement.Id());
								treeWidget._openedNodes[idPath.join('/')] = true;
							}
						}

						newChildItems = treeStore.query({ parent: invalidTreeItem.id });
						treeWidget._onItemChildrenChange(invalidTreeItem, newChildItems);
					}
				}
			}
		},

		RenderModel: function (/*WrappedObject*/ renderObject) {
			var renderer = this._rendererFactory.CreateRenderer(renderObject);

			return renderer.RenderModel(renderObject);
		}
	});
});
