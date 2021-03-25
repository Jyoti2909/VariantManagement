define(function () {
	function _AbleToExpandAndCollapseAll(args) {
		var _grid = this,
			_idAttr = args.idAttr || 'id',
			_childrenAttr = args.childrenAttr || 'children',
			_arrayOfTopLevelItems = null,
			_itemsByIndex = null,
			_itemsById = null,
			_treeCacheItems = null,
			_openedExpandos = null,
			_expandosToHide = null,
			_rowsNewCount = 0,
			_fetchChildrenOnExpandAll = false !== args.fetchChildrenOnExpandAll,
			_tryToFetchChildren = null,
			_clearData = function () {
				_itemsByIndex = _grid._by_idx = [];
				_itemsById = _grid._by_idty = {};
				_treeCacheItems = _grid._treeCache.items = [];
				_grid.views.views[_grid.views.views.length - 1]._expandos = {};
				_openedExpandos = _grid.openedExpandos = {};
				_expandosToHide = _grid.expandosToHide = {};
			},
			_insertItem = function (itemId, item, itemTreePath, openState) {
				if (openState) {
					_openedExpandos[itemId] = true;
				}
				_itemsByIndex[_itemsByIndex.length] = _itemsById[itemId] = {
					idty: itemId,
					item: item
				};
				_treeCacheItems[_treeCacheItems.length] = {
					opened: openState,
					treePath: itemTreePath
				};
			},
			_insertItemsRecursively = function (items, treePath) {
				var itemsCount = items.length,
					item,
					itemId,
					children,
					childrenTreePath,
					i;
				for (i = 0; i < itemsCount; i++) {
					item = items[i];
					itemId = item[_idAttr][0];
					children = item[_childrenAttr] || [];
					if (true === children[0]) {
						if (_fetchChildrenOnExpandAll) {
							_tryToFetchChildren(item);
						} else {
							item[_childrenAttr] = [];
						}
						children = item[_childrenAttr];
					}
					_insertItem(itemId, item, treePath, true);
					_rowsNewCount++;
					if (0 === children.length) {
						_expandosToHide[itemId] = true;
					} else {
						childrenTreePath = treePath.slice();
						childrenTreePath[childrenTreePath.length] = itemId;
						_insertItemsRecursively(children, childrenTreePath);
					}
				}
			},
			_updateRowsCountAndScrollUp = function () {
				_grid._size = _rowsNewCount;
				_grid.updateRowCount(_rowsNewCount);
				_grid.scrollToRow(0);
			},
			_expandAllExecuter = function () {
				_rowsNewCount = 0;
				_tryToFetchChildren = _grid.tryToFetchChildren;
				_insertItemsRecursively(_arrayOfTopLevelItems, []);
			},
			_collapseAllExecuter = function () {
				var item, itemId, i;
				_rowsNewCount = _arrayOfTopLevelItems.length;
				for (i = 0; i < _rowsNewCount; i++) {
					item = _arrayOfTopLevelItems[i];
					itemId = item[_idAttr][0];
					_insertItem(itemId, item, [], false);
				}
			};

		return {
			toggleAll: function (openThem) {
				_arrayOfTopLevelItems = this.store._arrayOfTopLevelItems;
				_clearData();
				(openThem ? _expandAllExecuter : _collapseAllExecuter)();
				_updateRowsCountAndScrollUp();
			}
		};
	}

	return dojo.declare('AbleToExpandAndCollapseAll', null, {
		constructor: function (args) {
			var publicAPI = _AbleToExpandAndCollapseAll.call(this, args),
				propName;
			for (propName in publicAPI) {
				this[propName] = publicAPI[propName];
			}
		}
	});
});
