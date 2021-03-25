define([
	'dojo/_base/kernel',
	'dojo/_base/declare',
	'./LazyTreeGridBase',
	'dojox/grid/LazyTreeGridStoreModel',
	'dojox/grid/_FocusManager',
	'dojox/grid/_RowManager',
	'dojox/grid/_EditManager',
	'dojox/grid/cells/tree',
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/dom-attr',
	'dojo/dom-class',
	'dojo/query',
	'dojo/keys'
], function (
	dojo,
	declare,
	LazyTreeGridBase,
	LazyTreeGridStoreModel,
	_FocusManager,
	_RowManager,
	_EditManager,
	TreeCell,
	array,
	lang,
	domAttr,
	domClass,
	query,
	keys
) {
	var Array_splice = Array.prototype.splice;

	//this is for fix edit TreeGrid
	TreeCell.formatIndexes = function (inRowIndexes, inItem) {
		var g = this.grid,
			i = g.edit.info,
			d = this.get
				? this.get(inRowIndexes[0], inItem, inRowIndexes)
				: this.value || this.defaultValue;
		if (
			this.editable &&
			(this.alwaysEditing ||
				(i.rowIndex == inRowIndexes.join('/') && i.cell == this))
		) {
			return this.formatEditing(d, inRowIndexes.join('/'));
		} else {
			return this._defaultFormat(d, [d, inRowIndexes[0], inRowIndexes, this]);
		}
	};

	var TreePath = declare('dojox.grid.TreePath', null, {
		level: 0,
		_str: '',
		_arr: null,
		grid: null,
		store: null,
		cell: null,

		constructor: function (
			/*String|Integer[]|Integer|dojox.grid.TreePath*/ path,
			/*dojox.grid.TreeGrid*/ grid
		) {
			if (lang.isString(path)) {
				this._str = path;
				this._arr = array.map(path.split('/'), function (item) {
					return parseInt(item, 10);
				});
			} else if (lang.isArray(path)) {
				this._str = path.join('/');
				this._arr = path.slice(0);
			} else if (typeof path == 'number') {
				this._str = String(path);
				this._arr = [path];
			} else {
				this._str = path._str;
				this._arr = path._arr.slice(0);
			}
			this.level = this._arr.length - 1;
			this.grid = grid;
			this.store = this.grid.store;
			if (grid.treeModel) {
				this.cell = grid.layout.cells[grid.expandoCell];
			} else {
				this.cell = grid.layout.cells[this.level];
			}
		},
		item: function () {
			// summary:
			//	gets the dojo.data item associated with this path
			if (!this._item) {
				this._item = this.grid.getItem(this._arr);
			}
			return this._item;
		},
		compare: function (path /*dojox.grid.TreePath|String|Array*/) {
			// summary:
			//	compares two paths
			if (lang.isString(path) || lang.isArray(path)) {
				if (this._str == path) {
					return 0;
				}
				if (path.join && this._str == path.join('/')) {
					return 0;
				}
				path = new TreePath(path, this.grid);
			} else if (path instanceof TreePath) {
				if (this._str == path._str) {
					return 0;
				}
			}
			for (
				var i = 0,
					l =
						this._arr.length < path._arr.length
							? this._arr.length
							: path._arr.length;
				i < l;
				i++
			) {
				if (this._arr[i] < path._arr[i]) {
					return -1;
				}
				if (this._arr[i] > path._arr[i]) {
					return 1;
				}
			}
			if (this._arr.length < path._arr.length) {
				return -1;
			}
			if (this._arr.length > path._arr.length) {
				return 1;
			}
			return 0;
		},
		isOpen: function () {
			// summary:
			//	Returns the open state of this cell.
			return this.cell.openStates && this.cell.getOpenState(this.item());
		},
		previous: function () {
			// summary:
			//	Returns the path that is before this path in the
			//	grid. If no path is found, returns null.
			var new_path = this._arr.slice(0);

			if (this._str == '0') {
				return null;
			}

			var last = new_path.length - 1;

			if (new_path[last] === 0) {
				new_path.pop();
				return new TreePath(new_path, this.grid);
			}

			new_path[last]--;
			var path = new TreePath(new_path, this.grid);
			return path.lastChild(true);
		},
		next: function () {
			// summary:
			//	Returns the next path in the grid.  If no path
			//	is found, returns null.
			var new_path = this._arr.slice(0);

			if (this.isOpen()) {
				new_path.push(0);
			} else {
				new_path[new_path.length - 1]++;
				for (var i = this.level; i >= 0; i--) {
					var item = this.grid.getItem(new_path.slice(0, i + 1));
					if (i > 0) {
						if (!item) {
							new_path.pop();
							new_path[i - 1]++;
						}
					} else {
						if (!item) {
							return null;
						}
					}
				}
			}

			return new TreePath(new_path, this.grid);
		},
		children: function (alwaysReturn) {
			// summary:
			//	Returns the child data items of this row.  If this
			//	row isn't open and alwaysReturn is falsey, returns null.
			if (!this.isOpen() && !alwaysReturn) {
				return null;
			}
			var items = [];
			var model = this.grid.treeModel;
			if (model) {
				var item = this.item();
				var store = model.store;
				if (!model.mayHaveChildren(item)) {
					return null;
				}
				array.forEach(model.childrenAttrs, function (attr) {
					items = items.concat(store.getValues(item, attr));
				});
			} else {
				items = this.store.getValues(
					this.item(),
					this.grid.layout.cells[this.cell.level + 1].parentCell.field
				);
				if (items.length > 1 && this.grid.sortChildItems) {
					var sortProps = this.grid.getSortProps();
					if (sortProps && sortProps.length) {
						var attr = sortProps[0].attribute,
							grid = this.grid;
						if (attr && items[0][attr]) {
							var desc = !!sortProps[0].descending;
							items = items.slice(0); // don't touch the array in the store, make a copy
							items.sort(function (a, b) {
								return grid._childItemSorter(a, b, attr, desc);
							});
						}
					}
				}
			}
			return items;
		},
		childPaths: function () {
			var childItems = this.children();
			if (!childItems) {
				return [];
			}
			return array.map(
				childItems,
				function (item, index) {
					return new TreePath(this._str + '/' + index, this.grid);
				},
				this
			);
		},
		parent: function () {
			// summary:
			//	Returns the parent path of this path.  If this is a
			//	top-level row, returns null.
			if (this.level === 0) {
				return null;
			}
			return new TreePath(this._arr.slice(0, this.level), this.grid);
		},
		lastChild: function (/*Boolean?*/ traverse) {
			// summary:
			//	Returns the last child row below this path.  If traverse
			//	is true, will traverse down to find the last child row
			//	of this branch.  If there are no children, returns itself.
			var children = this.children();
			if (!children || !children.length) {
				return this;
			}
			var path = new TreePath(
				this._str + '/' + String(children.length - 1),
				this.grid
			);
			if (!traverse) {
				return path;
			}
			return path.lastChild(true);
		},
		toString: function () {
			return this._str;
		}
	});

	var _TreeEditManager = declare('dojox.grid._TreeEditManager', _EditManager, {
		_applyRowStarted: false,

		setEditCell: function (inCell, inRowIndex) {
			if (this.isEditing()) {
				this.apply();
			}
			this.inherited(arguments);
		},
		styleRow: function (inRow) {
			if (inRow.index == this.info.rowIndex) {
				inRow.customClasses += ' dojoxGridRowEditing';
			}
		},
		apply: function () {
			if (this.isEditing() && this._isValidInput() && !this._applyRowStarted) {
				this._applyRowStarted = true;
				this.grid.beginUpdate();
				this.editorApply();
				this.applyRowEdit();
				this.info = {};
				this._applyRowStarted = false;
				this.grid.endUpdate();
				// commented because grid always captures focus during apply event
				//this.grid.focus.focusGrid();
				this._doCatchBoomerang();
			}
		}
	});

	var _TreeFocusManager = declare(
		'dojox.grid._TreeFocusManager',
		_FocusManager,
		{
			setFocusCell: function (inCell, inRowIndex) {
				if (inCell && inCell.getNode(inRowIndex)) {
					this.inherited(arguments);
				}
			},
			isLastFocusCell: function () {
				if (this.cell && this.cell.index == this.grid.layout.cellCount - 1) {
					var path = new TreePath(this.grid.rowCount - 1, this.grid);
					path = path.lastChild(true);
					return this.rowIndex == path._str;
				}
				return false;
			},
			next: function () {
				// summary:
				//	focus next grid cell
				if (this.cell) {
					var row = this.rowIndex,
						col = this.cell.index + 1,
						cc = this.grid.layout.cellCount - 1;
					var path = new TreePath(this.rowIndex, this.grid);
					if (col > cc) {
						var new_path = path.next();
						if (!new_path) {
							col--;
						} else {
							col = 0;
							path = new_path;
						}
					}
					if (this.grid.edit.isEditing()) {
						//when editing, only navigate to editable cells
						var nextCell = this.grid.getCell(col);
						if (!this.isLastFocusCell() && !nextCell.editable) {
							this._focusifyCellNode(false);
							this.cell = nextCell;
							this.rowIndex = path._str;
							this.next();
							return;
						}
					}
					this.setFocusIndex(path._str, col);
				}
			},
			previous: function () {
				// summary:
				//	focus previous grid cell
				if (this.cell) {
					var row = this.rowIndex || 0,
						col = (this.cell.index || 0) - 1;
					var path = new TreePath(row, this.grid);
					if (col < 0) {
						var new_path = path.previous();
						if (!new_path) {
							col = 0;
						} else {
							col = this.grid.layout.cellCount - 1;
							path = new_path;
						}
					}
					if (this.grid.edit.isEditing()) {
						//when editing, only navigate to editable cells
						var prevCell = this.grid.getCell(col);
						if (!this.isFirstFocusCell() && !prevCell.editable) {
							this._focusifyCellNode(false);
							this.cell = prevCell;
							this.rowIndex = path._str;
							this.previous();
							return;
						}
					}
					this.setFocusIndex(path._str, col);
				}
			},
			move: function (inRowDelta, inColDelta) {
				if (this.isNavHeader()) {
					this.inherited(arguments);
					return;
				}
				if (!this.cell) {
					return;
				}
				// Handle grid proper.
				var sc = this.grid.scroller,
					r = this.rowIndex,
					rc = this.grid.rowCount - 1,
					path = new TreePath(this.rowIndex, this.grid);
				if (inRowDelta) {
					var row;
					if (inRowDelta > 0) {
						path = path.next();
						row = path._arr[0];
						if (row > sc.getLastPageRow(sc.page)) {
							//need to load additional data, let scroller do that
							this.grid.setScrollTop(
								this.grid.scrollTop +
									sc.findScrollTop(row) -
									sc.findScrollTop(r)
							);
						}
					} else if (inRowDelta < 0) {
						path = path.previous();
						row = path._arr[0];
						if (row <= sc.getPageRow(sc.page)) {
							//need to load additional data, let scroller do that
							this.grid.setScrollTop(
								this.grid.scrollTop -
									sc.findScrollTop(r) -
									sc.findScrollTop(row)
							);
						}
					}
				}
				var cc = this.grid.layout.cellCount - 1,
					i = this.cell.index,
					col = Math.min(cc, Math.max(0, i + inColDelta));
				var cell = this.grid.getCell(col);
				var colDir = inColDelta < 0 ? -1 : 1;
				while (col >= 0 && col < cc && cell && cell.hidden === true) {
					// skip hidden cells
					col += colDir;
					cell = this.grid.getCell(col);
				}
				if (!cell || cell.hidden === true) {
					// don't change col if would move to hidden
					col = i;
				}
				if (inRowDelta) {
					this.grid.updateRow(r);
				}
				this.setFocusIndex(path._str, col);
			}
		}
	);

	var AbleToExpandAndCollapseAll = declare(
		'AbleToExpandAndCollapseAll',
		null,
		(function () {
			var _self = null,
				_rowsNewCount = 0,
				_treeGridStore = null,
				_itemsById = null,
				_openedExpandos = null,
				_insertItem = function (itemId, item, itemTreePath, openState) {
					if (openState) {
						_openedExpandos[itemId] = true;
					}
					_self._by_idx[_self._by_idx.length] = _self._by_idty[itemId] = {
						idty: itemId,
						item: item
					};
					_self._treeCache.items[_self._treeCache.items.length] = {
						opened: openState,
						treePath: itemTreePath
					};
				},
				_clearData = function () {
					_self.updateRowCount(0);
					_self._by_idx = [];
					_self._by_idty = {};
					_self._treeCache.items = [];
					_self.views.views[0]._expandos = {};
					_openedExpandos = _self.openedExpandos = {};
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
						itemId = item.uniqueId[0];
						children = item.children;
						if (!children || 'boolean' === typeof children[0]) {
							children = item.children = [];
						}
						_insertItem(itemId, item, treePath, true);
						_rowsNewCount++;
						childrenTreePath = treePath.slice();
						childrenTreePath.push(itemId);
						_insertItemsRecursively(children, childrenTreePath);
					}
				},
				_updateRowsCountAndScrollUp = function () {
					_self._size = _rowsNewCount;
					_self.rowCount = _rowsNewCount;
					_self.scroller.updateRowCount(_rowsNewCount);
					_self.scrollToRow(0);
				},
				_expandAllExecuter = function () {
					_rowsNewCount = 0;
					_insertItemsRecursively(_treeGridStore._arrayOfTopLevelItems, []);
				},
				_collapseAllExecuter = function () {
					var topLevelItems = _treeGridStore._arrayOfTopLevelItems,
						item,
						itemId,
						i;
					_rowsNewCount = topLevelItems.length;
					for (i = 0; i < _rowsNewCount; i++) {
						item = topLevelItems[i];
						itemId = item.uniqueId[0];
						_insertItem(itemId, item, [], false);
					}
					_self.openedExpandos = {};
				},
				_toggleAll = function (executer) {
					_self = this;
					_treeGridStore = this.store;
					_itemsById = _treeGridStore._itemsByIdentity;
					_clearData();
					executer();
					_self._sortGridItems();
					_updateRowsCountAndScrollUp();
				};

			return {
				expandAll: function () {
					_toggleAll.call(this, _expandAllExecuter);
				},
				collapseAll: function () {
					_toggleAll.call(this, _collapseAllExecuter);
				}
			};
		})()
	);

	var TreeGrid = declare(
		'Aras.Client.Controls.Experimental.TreeGrid',
		[LazyTreeGridBase, AbleToExpandAndCollapseAll],
		{
			// summary:
			//		A grid that supports nesting rows - it provides an expando function
			//		similar to dijit.Tree.  It also provides mechanisms for aggregating
			//		the values of subrows
			//
			// description:
			//		TreeGrid currently only works on "simple" structures.  That is,
			//		single-view structures with a single row in them.
			//
			//		The TreeGrid works using the concept of "levels" - level 0 are the
			//		top-level items.

			// defaultOpen: Boolean
			//		Whether or not we default to open (all levels).  This defaults to
			//		false for grids with a treeModel.
			defaultOpen: true,

			// sortChildItems: Boolean
			//		If true, child items will be returned sorted according to the sorting
			//		properties of the grid.
			sortChildItems: false,

			// openAtLevels: Array
			//		Which levels we are open at (overrides defaultOpen for the values
			//		that exist here).  Its values can be a boolean (true/false) or an
			//		integer (for the # of children to be closed if there are more than
			//		that)
			openAtLevels: [],

			// treeModel: dojox.grid.LazyTreeGridStoreModel
			//		A dijit.Tree model that will be used instead of using aggregates.
			//		Setting this value will make the TreeGrid behave like a columnar
			//		tree.  When setting this value, defaultOpen will default to false,
			//		and openAtLevels will be ignored.
			treeModel: null,

			// expandoCell: Integer
			//		When used in conjunction with a treeModel (see above), this is a 0-based
			//		index of the cell in which to place the actual expando
			expandoCell: 0,

			// private values
			// aggregator: Object
			//		The aggregator class - it will be populated automatically if we
			//		are a collapsable grid
			aggregator: null,

			openedExpandos: {},
			keepSelection: true,
			_updateEnabled: true,
			onNewUpdateEnabled: true,
			onSetUpdateEnabled: true,

			_childItemSorter: function (a, b, attribute, descending) {
				var sortColumn = this.getCell(this.getSortIndex());
				var av = sortColumn.parseValue(this.store.getValue(a, attribute));
				var bv = sortColumn.parseValue(this.store.getValue(b, attribute));
				if (av != bv) {
					return av < bv == descending ? 1 : -1;
				}
				return 0;
			},

			_addReferenceToStoreMap: function (refItem, parentItem, attribute) {
				/* this function code represents dojo.data.ItemFileWriteStore._addReferenceToMap-method code changed for better performance */
				var parentId = parentItem.uniqueId[0],
					references =
						refItem[this.store._reverseRefMap] ||
						(refItem[this.store._reverseRefMap] = {}),
					itemRef = references[parentId] || (references[parentId] = {});
				itemRef[attribute] = true;
			},

			_newRootItem: function (object, skipAddingToCache) {
				/* this function code represents dojo.data.ItemFileWriteStore.newItem-method code changed for better performance */
				var id = object.uniqueId,
					newItem = {},
					store = this.store,
					propName,
					propValue,
					propValueCount,
					i;

				if (store._saveInProgress) {
					throw new Error('assertion failed in ItemFileWriteStore');
				}
				if (!store._loadFinished) {
					store._forceLoad();
				}
				if ('undefined' !== typeof store._pending._newItems[id]) {
					delete store._pending._newItems[id];
					delete store._pending._deletedItems[id];
					delete store._pending._modifiedItems[id];
				}

				newItem[store._storeRefPropName] = store;
				newItem[store._itemNumPropName] = store._arrayOfAllItems.length;
				newItem.uniqueId = [id];
				newItem.children = [];
				newItem[store._rootItemPropName] = true;
				store._arrayOfTopLevelItems[
					store._arrayOfTopLevelItems.length
				] = store._pending._newItems[id] = store._itemsByIdentity[
					id
				] = store._arrayOfAllItems[store._arrayOfAllItems.length] = newItem;

				for (propName in object) {
					propValue = object[propName];
					if (!(propValue instanceof Array)) {
						propValue = [propValue];
					}
					newItem[propName] = propValue;
					propValueCount = propValue.length;
					for (i = 0; i < propValueCount; i++) {
						if (store.isItem(propValue[i])) {
							this._addReferenceToStoreMap(propValue[i], newItem, propName);
						}
					}
				}

				if (!skipAddingToCache) {
					this._onNew(newItem, null);
				}

				return newItem;
			},

			_newItem: function (object, parentItem, skipAddingToCache) {
				/* this function code represents dojo.data.ItemFileWriteStore.newItem-method code changed for better performance */
				var id = object.uniqueId,
					newItem = {},
					parentChildren = parentItem.children || (parentItem.children = []),
					store = this.store,
					propName,
					propValue,
					propValueCount,
					i,
					parentInfo;
				if (true === parentChildren[0]) {
					parentChildren = parentItem.children = [];
				}

				if (store._saveInProgress) {
					throw new Error('assertion failed in ItemFileWriteStore');
				}
				if (!store._loadFinished) {
					store._forceLoad();
				}
				if ('undefined' !== typeof store._pending._newItems[id]) {
					delete store._pending._newItems[id];
					delete store._pending._deletedItems[id];
					delete store._pending._modifiedItems[id];
				}

				newItem[store._storeRefPropName] = store;
				newItem[store._itemNumPropName] = store._arrayOfAllItems.length;
				newItem.uniqueId = [id];
				newItem.children = [];
				parentChildren[parentChildren.length] = store._pending._newItems[
					id
				] = store._itemsByIdentity[id] = store._arrayOfAllItems[
					store._arrayOfAllItems.length
				] = newItem;
				this._addReferenceToStoreMap(newItem, parentItem, 'children');

				for (propName in object) {
					propValue = object[propName];
					if (!(propValue instanceof Array)) {
						propValue = [propValue];
					}
					newItem[propName] = propValue;
					propValueCount = propValue.length;
					for (i = 0; i < propValueCount; i++) {
						if (store.isItem(propValue[i])) {
							this._addReferenceToStoreMap(propValue[i], newItem, propName);
						}
					}
				}

				parentInfo = {
					item: parentItem,
					attribute: 'children',
					newValue: parentChildren
				};
				if (!skipAddingToCache) {
					this._onNew(newItem, parentInfo);
				}

				return newItem;
			},

			_onNew: function (item, parentInfo) {
				var treeCacheItems = this._treeCache.items,
					itemsByIndex = this._by_idx,
					itemId = item.uniqueId[0],
					itemIsOpened = !!this.openedExpandos[itemId],
					count,
					parentId,
					parentRowIndex,
					parentInfoByIndex,
					i,
					parentTreePath,
					parentTreePathCount,
					itemIndex,
					treePath;

				if (
					itemIsOpened &&
					item.children &&
					'boolean' === typeof item.children[0]
				) {
					item.children = [];
				}

				if (!parentInfo || 'children' !== parentInfo.attribute) {
					treeCacheItems[treeCacheItems.length] = {
						opened: itemIsOpened,
						treePath: []
					};
					++this._size;
					_dojox_grid_TreeGrid__onNew.apply(this, arguments);
				} else {
					count = itemsByIndex.length;
					parentId = parentInfo.item.uniqueId[0];
					parentRowIndex = -1;
					for (i = 0; i < count; i++) {
						if (parentId === itemsByIndex[i].idty) {
							parentRowIndex = i;
							break;
						}
					}
					if (parentRowIndex >= 0) {
						parentInfoByIndex = treeCacheItems[parentRowIndex];
						if (parentInfoByIndex && parentInfoByIndex.opened) {
							parentTreePath = parentInfoByIndex.treePath;
							parentTreePathCount = parentTreePath.length;
							count = treeCacheItems.length;
							for (
								itemIndex = parentRowIndex + 1;
								itemIndex < count;
								itemIndex++
							) {
								if (
									treeCacheItems[itemIndex].treePath.length <=
									parentTreePathCount
								) {
									break;
								}
							}
							treePath = parentTreePath.slice();
							treePath[parentTreePathCount] = parentId;
							treeCacheItems.splice(itemIndex, 0, {
								opened: itemIsOpened,
								treePath: treePath
							});

							this._by_idty[itemId] = {
								idty: itemId,
								item: item
							};
							itemsByIndex.splice(itemIndex, 0, this._by_idty[itemId]);

							++this._size;
							if (this.onNewUpdateEnabled && this._updateEnabled) {
								this.updateRowCount(this._size);
								this._updateRenderedRows(itemIndex);
							}
						} else if (this.onNewUpdateEnabled && this._updateEnabled) {
							this.updateRow(parentRowIndex);
						}
					}
				}
			},

			_onSet: function (item, attribute, oldValue, newValue) {
				var rowIndex;
				this._checkUpdateStatus();
				if (this.aggregator) {
					this.aggregator.clearSubtotalCache();
				}
				if (this.onSetUpdateEnabled) {
					rowIndex = this._getItemIndex(item);
					this.updateRow(rowIndex);
				}
			},

			updateRow: function (rowIndex) {
				if (this._updateEnabled && rowIndex > -1) {
					this.inherited(arguments);
				}
			},

			updateRowCount: function (inRowCount) {
				if (this._updateEnabled) {
					this.inherited(arguments);
				}
			},

			_updateRenderedRows: function (startIndex) {
				if (this._updateEnabled) {
					this.inherited(arguments);
				}
			},

			_onDelete: function (item) {
				var rowIndex = this._getItemIndex(item, true),
					itemId = this.store.getIdentity(item);
				this._cleanupExpandoCache(itemId);

				//Copy from DataGrid, but removed this.selection.selected.splice(idx, 1); selected isn't array - it is Object
				this._checkUpdateStatus();

				if (rowIndex >= 0) {
					// When a row is deleted, all rest rows are shifted down,
					// and migrate from page to page. If some page is not
					// loaded yet empty rows can migrate to initialized pages
					// without refreshing. It causes empty rows in some pages, see:
					// http://bugs.dojotoolkit.org/ticket/6818
					// this code fix this problem by reseting loaded page info
					this._pages = [];
					this._bop = -1;
					this._eop = -1;

					var o = this._by_idx[rowIndex];
					this._by_idx.splice(rowIndex, 1);
					delete this._by_idty[o.idty];
					this.updateRowCount(this.get('rowCount') - 1);
					if (this.get('rowCount') === 0) {
						this.showMessage(this.noDataMessage);
					}
				}
				if (this.selection.isSelected(rowIndex)) {
					this.selection.deselect(rowIndex);
				}
			},

			_cleanupExpandoCache: function (index, identity, item) {},

			_addItem: function (item, index, noUpdate, dontUpdateRoot) {
				// add our root items to the root of the model's children
				// list since we don't query the model
				if (
					!dontUpdateRoot &&
					this.model &&
					array.indexOf(this.model.root.children, item) == -1
				) {
					this.model.root.children[index] = item;
				}
				this.inherited(arguments);
			},

			getItem: function (/*integer|Array|String*/ idx) {
				// summary:
				//		overridden so that you can pass in a '/' delimited string of indexes to get the
				//		item based off its path...that is, passing in "1/3/2" will get the
				//		3rd (0-based) child from the 4th child of the 2nd top-level item.
				var isArray = lang.isArray(idx);
				if (lang.isString(idx) && idx.indexOf('/')) {
					idx = idx.split('/');
					isArray = true;
				}
				if (isArray && idx.length == 1) {
					idx = idx[0];
					isArray = false;
				}
				if (!isArray) {
					return LazyTreeGridBase.prototype.getItem.call(this, idx);
				}
				var s = this.store;
				var itm = LazyTreeGridBase.prototype.getItem.call(this, idx[0]);
				var cf, i, j;
				if (this.aggregator) {
					cf = this.aggregator.childFields || [];
					if (cf) {
						for (i = 0; i < idx.length - 1 && itm; i++) {
							if (cf[i]) {
								itm = (s.getValues(itm, cf[i]) || [])[idx[i + 1]];
							} else {
								itm = null;
							}
						}
					}
				} else if (this.treeModel) {
					cf = this.treeModel.childrenAttrs || [];
					if (cf && itm) {
						for (i = 1, il = idx.length; i < il && itm; i++) {
							for (j = 0, jl = cf.length; j < jl; j++) {
								if (cf[j]) {
									itm = (s.getValues(itm, cf[j]) || [])[idx[i]];
								} else {
									itm = null;
								}
								if (itm) {
									break;
								}
							}
						}
					}
				}
				return itm || null;
			},

			_getItemIndex: function (item, isDeleted) {
				if (!isDeleted && !this.store.isItem(item)) {
					return -1;
				}
				var idx = this.inherited(arguments);
				if (idx == -1) {
					var idty = this.store.getIdentity(item);
					return this._by_idty_paths[idty] || -1;
				}
				return idx;
			},

			postMixInProperties: function () {
				if (this.treeModel && !('defaultOpen' in this.params)) {
					// Default open to false for tree models, true for other tree
					// grids.
					this.defaultOpen = false;
				}
				var def = this.defaultOpen;
				this.openAtLevels = array.map(this.openAtLevels, function (l) {
					if (typeof l == 'string') {
						switch (l.toLowerCase()) {
							case 'true':
								return true;
							case 'false':
								return false;
							default:
								var r = parseInt(l, 10);
								if (isNaN(r)) {
									return def;
								}
								return r;
						}
					}
					return l;
				});
				this._by_idty_paths = {};
				this.inherited(arguments);
			},

			postCreate: function () {
				this.inherited(arguments);
				if (this.treeModel) {
					this._setModel(this.treeModel);
				}
			},

			setModel: function (treeModel) {
				this._setModel(treeModel);
				this._cleanup();
				this._refresh(true);
			},

			_setModel: function (treeModel) {
				if (
					treeModel &&
					(!LazyTreeGridStoreModel ||
						!(treeModel instanceof LazyTreeGridStoreModel))
				) {
					throw new Error(
						'dojox.grid.TreeGrid: treeModel must be an instance of dojox.grid.LazyTreeGridStoreModel'
					);
				}
				//clear _by_idty_paths when set new model
				this._by_idty_paths = {};
				this.treeModel = treeModel;
				domClass.toggle(
					this.domNode,
					'dojoxGridTreeModel',
					this.treeModel ? true : false
				);
				this._setQuery(treeModel ? treeModel.query : null);
				this._setStore(treeModel ? treeModel.store : null);
			},

			createScroller: function () {
				this.inherited(arguments);
				this.scroller._origDefaultRowHeight = this.scroller.defaultRowHeight;
			},

			scrollTo: function (inTop) {
				var delta;
				if (!this.fastScroll) {
					this.setScrollTop(inTop);
					return;
				}
				delta = Math.abs(this.lastScrollTop - inTop);
				this.lastScrollTop = inTop;
				if (delta > this.scrollRedrawThreshold || this.delayScroll) {
					this.delayScroll = true;
					this.scrollTop = inTop;
					this.views.setScrollTop(inTop);
					if (this._pendingScroll) {
						window.clearTimeout(this._pendingScroll);
					}
					delete this._pendingScroll;
					this.finishScrollJob();
				} else {
					this.setScrollTop(inTop);
				}
			},

			createManagers: function () {
				// summary:
				//		create grid managers for various tasks including rows, focus, selection, editing

				// row manager
				this.rows = new _RowManager(this);
				// focus manager
				this.focus = new _TreeFocusManager(this);
				// edit manager
				this.edit = new _TreeEditManager(this);
			},

			_setStore: function (store) {
				this.inherited(arguments);

				if (this.store) {
					var storeConnects = this._store_connects || [];

					// new store event listeners shoud be placed into _store_connects
					// in this case they will be properly released during next _setStore call
					storeConnects.push(this.connect(this.store, 'onSet', '_onSet'));
					storeConnects.push(this.connect(this.store, 'onNew', '_onNew'));
					storeConnects.push(this.connect(this.store, 'onDelete', '_onDelete'));

					this._store_connects = storeConnects;
				}
			},

			onStyleRow: function (row) {
				if (!this.layout._isCollapsable) {
					this.inherited(arguments);
					return;
				}
				var base = domAttr.get(row.node, 'dojoxTreeGridBaseClasses');
				if (base) {
					row.customClasses = base;
				}
				row.customClasses +=
					((row.odd && ' dojoxGridRowOdd') || '') +
					((row.selected && ' dojoxGridRowSelected') || '') +
					((row.over && ' dojoxGridRowOver') || '');
				this.focus.styleRow(row);
				this.edit.styleRow(row);
			},

			styleRowNode: function (inRowIndex, inRowNode) {
				if (inRowNode) {
					if (inRowNode.tagName.toLowerCase() == 'div' && this.aggregator) {
						query('tr[dojoxTreeGridPath]', inRowNode).forEach(function (
							rowNode
						) {
							this.rows.styleRowNode(
								domAttr.get(rowNode, 'dojoxTreeGridPath'),
								rowNode
							);
						},
						this);
					}
					this.rows.styleRowNode(inRowIndex, inRowNode);
				}
			},
			onCanSelect: function (inRowIndex) {
				var nodes = query(
					"tr[dojoxTreeGridPath='" + inRowIndex + "']",
					this.domNode
				);
				if (nodes.length) {
					if (domClass.contains(nodes[0], 'dojoxGridSummaryRow')) {
						return false;
					}
				}
				return this.inherited(arguments);
			},
			onKeyDown: function (e) {
				if (e.altKey || e.metaKey) {
					return;
				}
				switch (e.keyCode) {
					case keys.UP_ARROW:
						if (!this.edit.isEditing() && this.focus.rowIndex != '0') {
							e.preventDefault();
							e.stopPropagation();

							this.focus.move(-1, 0);
						}
						break;
					case keys.DOWN_ARROW:
						var currPath = new TreePath(this.focus.rowIndex, this);
						var lastPath = new TreePath(this.rowCount - 1, this);
						lastPath = lastPath.lastChild(true);
						if (
							!this.edit.isEditing() &&
							currPath.toString() != lastPath.toString()
						) {
							e.preventDefault();
							e.stopPropagation();

							this.focus.move(1, 0);
						}
						break;
					default:
						this.inherited(arguments);
						break;
				}
			},
			canEdit: function (inCell, inRowIndex) {
				var node = inCell.getNode(inRowIndex);
				return node && this._canEdit;
			},

			doApplyCellEdit: function (inValue, inRowIndex, inAttrName) {
				var item = this.getItem(inRowIndex);
				var oldValue = this.store.getValue(item, inAttrName);
				if (typeof oldValue == 'number') {
					inValue = isNaN(inValue) ? inValue : parseFloat(inValue);
				} else if (typeof oldValue == 'boolean') {
					inValue =
						inValue == 'true' ? true : inValue == 'false' ? false : inValue;
				} else if (oldValue instanceof Date) {
					var asDate = new Date(inValue);
					inValue = isNaN(asDate.getTime()) ? inValue : asDate;
				}
				this.store.setValue(item, inAttrName, inValue);
				this.onApplyCellEdit(inValue, inRowIndex, inAttrName);
			},

			onToggleRow: function (itemId, state) {
				//Event fired after row is expanded or collapsed
			},

			_tempTreeCacheItems: null,
			_tempItemsByIndex: null,
			_commonChildrenCount: 0,

			_insertChildren: function (parentIndex) {
				this._commonChildrenCount = 0;
				this._tempTreeCacheItems = [this._treeCache.items[parentIndex]];
				this._tempItemsByIndex = [this._by_idx[parentIndex]];
				this._insertChildrenRecursively(0);
				this._tempTreeCacheItems.shift();
				this._tempItemsByIndex.shift();
				Array_splice.apply(
					this._treeCache.items,
					[parentIndex + 1, 0].concat(this._tempTreeCacheItems)
				);
				Array_splice.apply(
					this._by_idx,
					[parentIndex + 1, 0].concat(this._tempItemsByIndex)
				);
				this._size += this._commonChildrenCount;
				this._tempTreeCacheItems = [];
				this._tempItemsByIndex = [];
				this._commonChildrenCount = 0;
			},

			_insertChildrenRecursively: function (parentIndex) {
				var tempItemsByIndex = this._tempItemsByIndex,
					tempTreeCacheItems = this._tempTreeCacheItems,
					itemsById = this._by_idty,
					parentItem = tempItemsByIndex[parentIndex].item,
					parentItemTreePath = tempTreeCacheItems[parentIndex].treePath,
					children = parentItem.children || (parentItem.children = []),
					insertedRecursivelyCount = 0,
					childrenCount,
					treePath,
					firstChildIndex,
					i,
					child,
					childId,
					childIndex,
					openedItemsIds,
					childIsOpened;

				if ('boolean' === typeof children[0]) {
					children = parentItem.children = [];
				}
				childrenCount = children.length;

				if (childrenCount) {
					var sortProps = this.getSortProps();
					var sortDescriptor = sortProps && sortProps.length && sortProps[0];

					openedItemsIds = this.openedExpandos;
					treePath = parentItemTreePath.slice();
					treePath[treePath.length] = parentItem.uniqueId[0];
					firstChildIndex = parentIndex + 1;

					if (sortDescriptor) {
						var sortAttributeName = sortDescriptor.attribute;
						var isDescending = Boolean(sortDescriptor.descending);

						if (sortAttributeName) {
							children = children.slice();

							children.sort(
								function (a, b) {
									return this._childItemSorter(
										a,
										b,
										sortAttributeName,
										isDescending
									);
								}.bind(this)
							);
						}
					}

					for (i = 0; i < childrenCount; i++) {
						child = children[i];
						childId = child.uniqueId[0];
						childIndex = firstChildIndex + i + insertedRecursivelyCount;
						childIsOpened = !!openedItemsIds[childId];

						itemsById[childId] = tempItemsByIndex[tempItemsByIndex.length] = {
							idty: childId,
							item: child
						};

						tempTreeCacheItems[tempTreeCacheItems.length] = {
							treePath: treePath,
							opened: childIsOpened
						};

						if (childIsOpened) {
							insertedRecursivelyCount += this._insertChildrenRecursively(
								childIndex
							);
						}
					}

					this._commonChildrenCount += childrenCount;
				}

				return childrenCount + insertedRecursivelyCount;
			},

			_onExpandoComplete: function (childItems, request, size) {
				var parentIndex = this.expandoRowIndex;
				this._insertChildren(parentIndex);
				this.updateRowCount(this._size);
				this._updateRenderedRows(parentIndex + 1);
				this.stateChangeNode = null;
				if (this._loading) {
					this._loading = false;
				}
				if (true === this.autoHeight) {
					this._resize();
				}
				this.focus._delayedCellFocus();
			},

			_fold: function (itemId, open) {
				var itemWrapper = this._by_idty[itemId],
					expando;
				if (
					itemWrapper &&
					itemWrapper.item &&
					this.treeModel.mayHaveChildren(itemWrapper.item)
				) {
					expando = this.views.views[this.views.views.length - 1]._expandos[
						itemId
					];
					if (expando) {
						expando.setOpen(open);
					}
				}
			},

			setPaintEnabled: function (value, endUpdateOnly) {
				var updateWasDisabled = !this._updateEnabled;
				this._updateEnabled = !!value;

				if (updateWasDisabled && value) {
					this.endUpdate();

					if (!endUpdateOnly) {
						this.render();
					}
				} else if (!updateWasDisabled && !value) {
					this.beginUpdate();
				}
			},

			_update: function () {
				if (this._updateEnabled && !this.updating) {
					this._refresh(true);
				}
			}
		}
	);
	TreeGrid.markupFactory = function (props, node, ctor, cellFunc) {
		var widthFromAttr = function (n) {
			var w = domAttr.get(n, 'width') || 'auto';
			if (w != 'auto' && w.slice(-2) != 'em' && w.slice(-1) != '%') {
				w = parseInt(w, 10) + 'px';
			}
			return w;
		};

		var cellsFromMarkup = function (table) {
			var rows;
			// Don't support colgroup on our grid - single view, single row only
			if (
				table.nodeName.toLowerCase() == 'table' &&
				query('> colgroup', table).length === 0 &&
				(rows = query('> thead > tr', table)).length == 1
			) {
				var tr = rows[0];
				return query('> th', rows[0]).map(function (th) {
					// Grab type and field (the only ones that are shared
					var cell = {
						type: lang.trim(domAttr.get(th, 'cellType') || ''),
						field: lang.trim(domAttr.get(th, 'field') || '')
					};
					if (cell.type) {
						cell.type = lang.getObject(cell.type);
					}

					var subTable = query('> table', th)[0];
					if (subTable) {
						// If we have a subtable, we are an aggregate and a summary cell
						cell.name = '';
						cell.children = cellsFromMarkup(subTable);
						if (domAttr.has(th, 'itemAggregates')) {
							cell.itemAggregates = array.map(
								domAttr.get(th, 'itemAggregates').split(','),
								function (v) {
									return lang.trim(v);
								}
							);
						} else {
							cell.itemAggregates = [];
						}
						if (domAttr.has(th, 'aggregate')) {
							cell.aggregate = domAttr.get(th, 'aggregate');
						}
						cell.type = cell.type || dojox.grid.cells.SubtableCell;
					} else {
						// Grab our other stuff we need (mostly what's in the normal
						// Grid)
						cell.name = lang.trim(domAttr.get(th, 'name') || th.innerHTML);
						if (domAttr.has(th, 'width')) {
							cell.width = widthFromAttr(th);
						}
						if (domAttr.has(th, 'relWidth')) {
							cell.relWidth = window.parseInt(domAttr.get(th, 'relWidth'), 10);
						}
						if (domAttr.has(th, 'hidden')) {
							cell.hidden = domAttr.get(th, 'hidden') == 'true';
						}
						cell.field = cell.field || cell.name;
						LazyTreeGridBase.cell_markupFactory(cellFunc, th, cell);
						cell.type = cell.type || dojox.grid.cells.Cell;
					}
					if (cell.type && cell.type.markupFactory) {
						cell.type.markupFactory(th, cell);
					}
					return cell;
				});
			}
			return [];
		};

		var rows;
		if (!props.structure) {
			var row = cellsFromMarkup(node);
			if (row.length) {
				// Set our structure here - so that we don't try and set it in the
				// markup factory
				props.structure = [{ __span: Infinity, cells: [row] }];
			}
		}
		return LazyTreeGridBase.markupFactory(props, node, ctor, cellFunc);
	};

	return TreeGrid;
});
