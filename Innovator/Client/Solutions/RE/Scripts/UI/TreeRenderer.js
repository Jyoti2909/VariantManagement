define([
	'dojo/_base/declare',
	'RE/Scripts/UI/RequirementTreeRenderer',
],
function(declare, RequirementTreeRenderer) {
	return declare('Aras.Client.Controls.RE.UI.TreeRenderer', [RequirementTreeRenderer], {
		_previousStore: null,
		_deferredUpdateRootHandler: null,

		constructor: function() {
			this._deferredUpdateRootHandler = this._debounce(this._updateRootNodeIfNeed, this);
		},

		refresh: function(/*WrappedObject*/ wrappedObject, renderRoot) {
			if (!wrappedObject) {
				for (let i = 0; i < this._invalidationList.length; i++) {
					let invalidObject = this._invalidationList[i];

					if (this._isTopInvalidObject(invalidObject)) {
						this.refresh(invalidObject, renderRoot);
					}
				}

				this._invalidationList.length = 0;
			} else {
				this._reflectDomChanges(wrappedObject, renderRoot);
			}
		},

		_reflectDomChanges: function(wrappedObject, renderRoot) {
			let treeWidget = this._tree;
			let treeStore = treeWidget.model.store;
			let actualElement = this._viewmodel.GetAncestorOrSelfInteractiveElement(wrappedObject);
			let invalidTreeItem = this._getInvalidTreeItem(treeStore, actualElement.Id(), renderRoot);

			if (invalidTreeItem) {
				let invalidItemChilds = treeStore.query({parent: invalidTreeItem.id});
				let validTreeItems = this._getValidTreeItems(wrappedObject, invalidTreeItem.id);

				if (validTreeItems.length == 1 && !invalidItemChilds.length) {
					this._treeWidgetOnItemChange(treeWidget, {
						validItem: validTreeItems[0]
					});
				} else {
					this._refreshTreeWidget(treeWidget, {
						invalidTreeItem: invalidTreeItem,
						validTreeItems: validTreeItems,
						renderRoot: renderRoot
					});
				}
			}
		},

		_getInvalidTreeItem: function(treeStore, actualElementId, renderRoot) {
			let invalidTreeItem = treeStore.query({id: actualElementId})[0];

			// if invalidTreeItem is missed it means that we load new requirement to tree
			if (!invalidTreeItem || renderRoot) {
				invalidTreeItem = treeStore.data[0];
			}

			return invalidTreeItem;
		},

		_getValidTreeItems: function(wrappedObject, invalidTreeItemId) {
			// need to get item only in case when node name is not classified node. Need to figure out how it should be done.
			let invalidWrappedObject = wrappedObject.Parent && wrappedObject.Parent.nodeName != 'aras:block' ?
				this._viewmodel.GetElementById(invalidTreeItemId) : wrappedObject;
			return this.RenderModel(invalidWrappedObject);
		},

		_treeWidgetOnItemChange: function(treeWidget, treeParams) {
			treeWidget.model.store.put(treeParams.validItem);
			treeWidget._onItemChange(treeParams.validItem);
		},

		_refreshTreeWidget: function(treeWidget, treeParams) {
			if (!this._previousStore) {
				this._previousStore = this._getStoreCompactIds(treeWidget);
			}
			let storeStructure = this.buildStoreStructure();

			let openedUidPaths = treeWidget._getOpenedNodesUidPaths();
			this.removeChildItemsFromStore(treeParams.invalidTreeItem, storeStructure);

			treeWidget.suspendPainting();
			for (i = 0; i < treeParams.validTreeItems.length; i++) {
				treeWidget.model.store.put(treeParams.validTreeItems[i]);
				treeWidget._onItemChange(treeParams.validTreeItems[i]);
			}
			treeWidget.resumePainting();

			treeWidget._openedNodes = {};
			for (i = 0; i < openedUidPaths.length; i++) {
				let modelElement = this._viewmodel.findElementByUidPath(openedUidPaths[i]);

				if (modelElement) {
					let idPath = this._viewmodel.getElementIdPath(modelElement.Id());
					treeWidget._openedNodes[idPath.join('/')] = true;
				}
			}

			let newChildItems = treeWidget.model.store.query({parent: treeParams.invalidTreeItem.id});
			treeWidget._onItemChildrenChange(treeParams.invalidTreeItem, newChildItems);

			this._deferredUpdateRootHandler(treeWidget, treeParams);
		},

		_getStoreCompactIds: function(treeWidget) {
			return treeWidget.model.store.data.map(function(elem) {
				return elem.id;
			}).join(',');
		},

		_updateRootNodeIfNeed: function(treeWidget, treeParams) {
			const parentNode = this._viewmodel.GetElementById(treeParams.validTreeItems[0].parent);
			const activeId = this._tree.getCurrentActiveId();
			const currentStore = this._getStoreCompactIds(treeWidget);

			if (this._previousStore !== currentStore && parentNode && parentNode.nodeName === 'aras:block' && activeId &&
				(activeId.toString() !== treeParams.validTreeItems[0].id || treeParams.renderRoot)) {
				this._tree.setDeferredFunction('rootNodeUpdate', this._tree._rootNodeUpdate, this._tree);
				if (!this._viewmodel.GetElementById(activeId)) {
					this._tree.setCurrentActiveId(treeParams.validTreeItems[0].id);
				}
			}

			this._previousStore = null;
		},

		_debounce: function(func, context) {
			let timeout;
			return function() {
				const args = arguments;
				const later = function() {
					timeout = null;
					func.apply(context, args);
				};
				clearTimeout(timeout);
				timeout = setTimeout(later, 20);
			};
		}
	});
});
