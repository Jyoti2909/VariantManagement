define([
	'dojox/grid/LazyTreeGrid',
	'./AbleToExpandAndCollapseAll',
	'./LazyDataLoader',
	'dojo/aspect'
], function (LazyTreeGrid, AbleToExpandAndCollapseAll, LazyDataLoader, aspect) {
	var _dojox_grid_TreeGrid__onNew = dojox.grid.TreeGrid.prototype._onNew,
		_dojox_grid_TreeGrid_onStyleRow = dojox.grid.TreeGrid.prototype.onStyleRow,
		_dijit_tree_TreeStoreModel_getChildren =
			dijit.tree.TreeStoreModel.prototype.getChildren,
		_dojox_grid_LazyTreeGrid_setModel =
			dojox.grid.LazyTreeGrid.prototype.setModel,
		_dojox_grid__TreeGridView_buildRow =
			dojox.grid._TreeGridView.prototype.buildRow,
		_dojox_grid__LazyExpando_onToggle =
			dojox.grid._LazyExpando.prototype.onToggle,
		Array_splice = Array.prototype.splice,
		_dojo_baseUrl = dojo.baseUrl,
		_expandoTemplateString =
			'<div class="dojoxGridExpando" style="padding-right: 7px; position: relative; z-index: 1;">' +
			'<div class="dojoxGridExpandoNode" dojoAttachEvent="onclick:onToggle">' +
			'<div class="dojoxGridExpandoNodeInner" dojoAttachPoint="expandoInner"></div>' +
			'</div>' +
			'<img  class="treeExpandoLeaf" alt="" src="' +
			_dojo_baseUrl +
			'resources/blank.gif" />' +
			'<img  class="treeExpandoLeafNoChilds" style="display: none;" alt="" src="' +
			_dojo_baseUrl +
			'resources/blank.gif" />' +
			'<img class="aras_item_image" src="' +
			_dojo_baseUrl +
			'resources/blank.gif" />' +
			'</div>';

	function _addDomNodeClass(domNode, classToAdd) {
		if (
			-1 === (' ' + domNode.className + ' ').indexOf(' ' + classToAdd + ' ')
		) {
			domNode.className += ' ' + classToAdd;
		}
	}

	function _removeDomNodeClass(domNode, classToRemove) {
		if (
			-1 !== (' ' + domNode.className + ' ').indexOf(' ' + classToRemove + ' ')
		) {
			domNode.className = (' ' + domNode.className).replace(
				' ' + classToRemove,
				''
			);
		}
	}

	/*
		args: {
			idAttr ("id"),
			childrenAttr ("children"),
			loadItemData,
			imageUrlAttr ("imageUrl"),
			imageClassName (""),
			noImageClassName (""),
			imagesRelPath (""),
			dontHighlightOddRows (false),
			dontShowRowBorders (false),
			fetchChildren (empty function), arguments: (item),
			cachedRowsCount (100),
			expandAllByDefault (false),
			rowsUpdateEnabled (true),
			multipleSelection ("single"),
			fetchChildrenOnExpandAll (true)
		}
	*/
	function _LazyTreeGridSubclass(args) {
		var _grid = this,
			_store = (args.treeModel && args.treeModel.store) || null,
			_idAttr = args.idAttr || 'id',
			_childrenAttr = args.childrenAttr || 'children',
			_loader = null,
			_imageUrlAttr = args.imageUrlAttr || 'imageUrl',
			_imageClassName = args.imageClassName || '',
			_noImageClassName = args.noImageClassName || '',
			_imagesRelPath = _dojo_baseUrl + (args.imagesRelPath || ''),
			_highlightOddRows = !args.dontHighlightOddRows,
			_dontShowRowBorders = args.dontShowRowBorders,
			/*
				set expandAllByDefault to TRUE if there's not too much items;
				example:	if there's one root item, children per item = 2, levels count = 13 (8191 items),
							treeGrid loading lasts at least 11.5 seconds (with expandAllByDefault set to FALSE it lasts twice less (5.5-6 seconds)
			*/
			_expandAllByDefault = !!args.expandAllByDefault,
			_rowsUpdateEnabled = false !== args.rowsUpdateEnabled,
			_openedExpandos = {},
			_expandosToHide = {},
			/* +++ common containers for items +++ */
			_treeCache = null,
			_treeCacheItems = null,
			_itemsById = null,
			_itemsByIndex = null,
			/* --- common containers for items --- */
			_itemsToFetchChildren = {},
			_fetchChildren =
				args.fetchChildren ||
				function (parentItem) {
					parentItem[_childrenAttr] = [];
					return parentItem[_childrenAttr];
				},
			_tryToFetchChildren = function (item) {
				/*
					Returns true, if at least one child has been successfully fetched.
					If item already has all children, fetch is not performed and false returns.
				*/
				var children = item[_childrenAttr];
				if (children && true === children[0]) {
					item[_childrenAttr] = [];
					children = _fetchChildren(item);
					delete _itemsToFetchChildren[item[_idAttr][0]];
					if (0 < children.length) {
						return true;
					}
				}
				return false;
			},
			_commonChildrenCount = null,
			_tempTreeCacheItems = null,
			_tempItemsByIndex = null,
			_insertChildrenRecursively = function (parentIndex) {
				var parentItem = _tempItemsByIndex[parentIndex].item,
					parentItemTreePath = _tempTreeCacheItems[parentIndex].treePath,
					children = _tryToFetchChildren(parentItem)
						? []
						: parentItem[_childrenAttr] || [],
					childrenCount = children.length,
					insertedRecursivelyCount = 0,
					treePath,
					firstChildIndex,
					i,
					child,
					childId,
					childIndex,
					childIsOpened;

				if (0 < childrenCount) {
					treePath = parentItemTreePath.slice(0);
					treePath[treePath.length] = parentItem[_idAttr][0];
					firstChildIndex = parentIndex + 1;
					for (i = 0; i < childrenCount; i++) {
						child = children[i];
						childId = child[_idAttr][0];
						childIndex = firstChildIndex + i + insertedRecursivelyCount;
						childIsOpened = _expandAllByDefault || !!_openedExpandos[childId];
						_itemsById[childId] = _tempItemsByIndex[
							_tempItemsByIndex.length
						] = {
							idty: childId,
							item: child
						};
						_tempTreeCacheItems[_tempTreeCacheItems.length] = {
							treePath: treePath,
							opened: childIsOpened
						};
						if (childIsOpened) {
							insertedRecursivelyCount += _insertChildrenRecursively(
								childIndex
							);
						}
					}
					_commonChildrenCount += childrenCount;
				}
				return childrenCount + insertedRecursivelyCount;
			},
			_insertChildren = function (parentIndex) {
				_commonChildrenCount = 0;
				_tempTreeCacheItems = [_treeCacheItems[parentIndex]];
				_tempItemsByIndex = [_itemsByIndex[parentIndex]];
				_insertChildrenRecursively(0);
				_tempTreeCacheItems.shift();
				_tempItemsByIndex.shift();
				Array_splice.apply(
					_treeCacheItems,
					[parentIndex + 1, 0].concat(_tempTreeCacheItems)
				);
				Array_splice.apply(
					_itemsByIndex,
					[parentIndex + 1, 0].concat(_tempItemsByIndex)
				);
				_grid._size += _commonChildrenCount;
				_tempTreeCacheItems = [];
				_tempItemsByIndex = [];
				_commonChildrenCount = 0;
			},
			_setChildrenExpandosRecursively = function (itemId, state) {
				var item = _store._itemsByIdentity[itemId],
					children,
					childrenCount,
					i,
					childId;
				_tryToFetchChildren(item);
				children = item[_childrenAttr];
				if (children) {
					childrenCount = children.length;
					for (i = 0; i < childrenCount; i++) {
						childId = children[i][_idAttr];
						_setChildrenExpandosRecursively(childId, state);
						if (state) {
							_openedExpandos[childId] = true;
						} else {
							delete _openedExpandos[childId];
						}
					}
				}
			},
			_initLoader = function (itemDataLoadingExecuter) {
				_loader = new LazyDataLoader({
					loadItemData: itemDataLoadingExecuter,
					getItemId: function (rowIndex) {
						var itemWrapper = _itemsByIndex[rowIndex];
						return itemWrapper && itemWrapper.item[_idAttr][0];
					}
				});
				aspect.before(_grid, 'updateRows', function (startIndex, howMany) {
					_loader.fillRowsWithData(startIndex, startIndex + howMany);
				});
				return _loader;
			},
			_getRowIndex = function (id) {
				var itemsByIndexCount = _itemsByIndex.length,
					i;
				for (i = 0; i < itemsByIndexCount; i++) {
					if (id === _itemsByIndex[i].idty) {
						return i;
					}
				}
				return -1;
			};

		_initLoader(args.loadItemData);

		Object.defineProperties(this, {
			_by_idty: {
				get: function () {
					return _itemsById;
				},
				set: function (value) {
					_itemsById = value;
				}
			},
			_by_idx: {
				get: function () {
					return _itemsByIndex;
				},
				set: function (value) {
					_itemsByIndex = value;
				}
			},
			_treeCache: {
				get: function () {
					return _treeCache;
				},
				set: function (value) {
					_treeCache = value;
					_treeCacheItems = _treeCache.items;
					Object.defineProperty(_treeCache, 'items', {
						get: function () {
							return _treeCacheItems;
						},
						set: function (newValue) {
							_treeCacheItems = newValue;
						}
					});
				}
			},
			openedExpandos: {
				get: function () {
					return _openedExpandos;
				},
				set: function (value) {
					_openedExpandos = value;
				}
			},
			expandosToHide: {
				get: function () {
					return _expandosToHide;
				},
				set: function (value) {
					_expandosToHide = value;
				}
			},
			itemsToFetchChildren: {
				get: function () {
					return _itemsToFetchChildren;
				},
				set: function (value) {
					_itemsToFetchChildren = value;
				}
			},
			fetchChildren: {
				get: function () {
					return _fetchChildren;
				},
				set: function (value) {
					_fetchChildren = value;
					return _fetchChildren;
				}
			},
			tryToFetchChildren: {
				get: function () {
					return _tryToFetchChildren;
				}
			}
		});

		dojo.extend(dojox.grid.LazyTreeGridStoreModel, {
			mayHaveChildren: function (item) {
				var children = item[_childrenAttr] || [];
				if (true === children[0]) {
					return true;
				}
				return 0 < children.length;
			}
		});

		dojo.extend(dijit.tree.TreeStoreModel, {
			getChildren: function (parentItem, onComplete, onError) {
				var self;
				if (_store.isItem(parentItem)) {
					onComplete(parentItem[_childrenAttr]);
				} else {
					self = this;
					_store.loadItem({
						item: parentItem,
						onItem: function (parentItem) {
							self.getChildren(parentItem, onComplete, onError);
						},
						onError: onError
					});
				}
			}
		});

		dojo.extend(dojox.grid.cells._Base, {
			getEditNode: function (rowIndex) {
				var cellNode = this.getNode(rowIndex || 0),
					dojoxGridInputs,
					fakeInput;
				if (cellNode) {
					dojoxGridInputs = cellNode.getElementsByClassName('dojoxGridInput');
					return dojoxGridInputs[dojoxGridInputs.length - 1];
				} else {
					fakeInput = {};
					fakeInput[this._valueProp] = _grid._cache[rowIndex];
					return fakeInput;
				}
			}
		});

		dojo.extend(dojox.grid._LazyExpando, {
			_childRowIndent: 28 /* px */,
			_marginPosAttr: this.isLeftToRight() ? 'marginLeft' : 'marginRight',
			templateString: _expandoTemplateString,

			onToggle: function (event) {
				var gridEdit = _grid.edit;
				if (gridEdit && gridEdit.isEditing()) {
					gridEdit.apply();
				}
				_dojox_grid__LazyExpando_onToggle.apply(this, arguments);
				if (_treeCacheItems[this.rowIdx].opened) {
					_openedExpandos[this.itemId] = true;
				} else {
					delete _openedExpandos[this.itemId];
				}
			},

			setOpen: function (state, item) {
				var rowIndex;
				if (!_grid._loading) {
					rowIndex = this.rowIdx;
					item = item || _itemsByIndex[rowIndex].item;
					if (
						item &&
						_grid.treeModel.mayHaveChildren(item) &&
						_treeCacheItems[rowIndex].opened !== state
					) {
						_treeCacheItems[rowIndex].opened = state;
						_grid.expandoFetch(rowIndex, state);
						this._updateExpandoInner(state);
					}
				}
			},

			setRowNode: function (rowIdx, rowNode, view) {
				var item;
				if (this.cellIdx < 0 || !this.itemId) {
					return false;
				}
				this.view = view;
				this.grid = view.grid;
				this.rowIdx = rowIdx;
				this.domNode.parentNode.style[this._marginPosAttr] =
					this.level * this._childRowIndent + 'px';
				item = _itemsByIndex[rowIdx].item;
				this._updateOpenState(item);
				this._setImageSrc(item);
				/* hide expando if necessary */
				if (_expandosToHide[this.itemId]) {
					_addDomNodeClass(this.domNode, 'dojoxGridNoChildren');
				}
				this._addVerticalDots(
					item,
					_treeCacheItems[rowIdx].treePath,
					this.level
				);
				return true;
			},

			_updateExpandoInner: function (state) {
				if (state) {
					this.expandoInner.innerHTML = '-';
					_addDomNodeClass(this.domNode, 'dojoxGridExpandoOpened');
				} else {
					this.expandoInner.innerHTML = '+';
					_removeDomNodeClass(this.domNode, 'dojoxGridExpandoOpened');
				}
				_removeDomNodeClass(this.domNode, 'dojoxGridExpandoLoading');
			},

			_updateOpenState: function (item) {
				if (item && _grid.treeModel.mayHaveChildren(item)) {
					this._updateExpandoInner(_treeCacheItems[this.rowIdx].opened);
				} else {
					_removeDomNodeClass(this.domNode, 'dojoxGridExpandoOpened');
				}
			},

			_setImageSrc: function (item) {
				var imageUrl = item[_imageUrlAttr],
					img = this.domNode.lastChild;

				if (imageUrl) {
					imageUrl = imageUrl[0];
				}

				if (imageUrl) {
					if (imageUrl.indexOf('vault:///?file') === 0) {
						const fileId = imageUrl.replace(/vault:\/\/\/\?fileid=/i, '');
						img.src = aras.IomInnovator.getFileUrl(
							fileId,
							aras.Enums.UrlType.SecurityToken
						);
					} else {
						img.src =
							(/^http.*/i.test(imageUrl) ? '' : _imagesRelPath) + imageUrl;
					}
					_addDomNodeClass(img, _imageClassName);
				} else {
					_addDomNodeClass(img, _noImageClassName);
				}
				_addDomNodeClass(this.domNode, 'aras_lazytreegrid_expando_with_icon');
			},

			_addVerticalDots: function (
				item,
				itemTreePath,
				level,
				calledRecursively
			) {
				var ancestorsCount = itemTreePath.length,
					isItemNotRoot = 0 < ancestorsCount,
					parentId,
					isItemNotLastChild,
					parentItem,
					parentTreePath,
					i;
				if (isItemNotRoot) {
					parentId = itemTreePath[ancestorsCount - 1];
					parentItem = _itemsById[parentId].item;
					parentChildren = parentItem[_childrenAttr];
					isItemNotLastChild =
						parentChildren[parentChildren.length - 1] !== item;
					if (isItemNotLastChild) {
						this._addDots(level, true);
					} else if (!calledRecursively) {
						this._addDots(level, false);
					}
					/* add dots for ancestors recursively */
					parentTreePath = itemTreePath.slice(0, ancestorsCount - 1);
					this._addVerticalDots(parentItem, parentTreePath, level - 1, true);
				}
			},

			_addDots: function (level, notForLastChild) {
				var dotsDiv = document.createElement('div'),
					dotsIndent = level * this._childRowIndent,
					dotsWidth = dotsIndent + 8,
					dotsStyle =
						'background-position: ' +
						dotsIndent +
						'px 0px; width: ' +
						dotsWidth +
						'px;' +
						(notForLastChild ? 'height: 26px' : '');
				dotsDiv.setAttribute('class', 'aras_lazytreegrid_vert_dots');
				dotsDiv.setAttribute('style', dotsStyle);
				this.domNode.parentNode.parentNode.appendChild(dotsDiv);
			}
		});

		dojo.extend(dojox.grid._TreeGridView, {
			buildRow: function (rowIndex, rowNode) {
				_loader.fillRowWithData(rowIndex);
				_dojox_grid__TreeGridView_buildRow.apply(this, arguments);
				_grid.onBuildRow(rowIndex, rowNode);
			}
		});

		return {
			/* new API implementing */

			deferItemDataLoading: function (itemData) {
				var itemId = itemData[_idAttr];
				delete itemData[_idAttr];
				_loader.deferItemDataLoading(itemId, itemData);
			},

			setUpdateEnabled: function (enable, updateRightNow) {
				var updateWasEnabled = _rowsUpdateEnabled;
				_rowsUpdateEnabled = !!enable;
				if (updateWasEnabled && !_rowsUpdateEnabled) {
					this.beginUpdate();
				} else if (!updateWasEnabled && _rowsUpdateEnabled) {
					this.endUpdate();
					if (updateRightNow) {
						this.render();
					}
				}
			},

			removeHeaderRow: function () {
				this.domNode.removeChild(this.viewsHeaderNode);
			},

			removeExtraData: function (itemId) {
				_loader.removeData(itemId);
				if (itemId) {
					delete _openedExpandos[itemId];
					delete _expandosToHide[itemId];
					delete _itemsToFetchChildren[itemId];
				} else {
					_openedExpandos = {};
					_expandosToHide = {};
					_itemsToFetchChildren = {};
				}
			},

			setOpenState: function (itemId, state, withChildren) {
				if (withChildren) {
					_setChildrenExpandosRecursively(itemId, state);
				}
				this._fold(itemId, state);
				if (state) {
					_openedExpandos[itemId] = true;
				} else {
					delete _openedExpandos[itemId];
				}
			},

			onBuildRow: function (rowIndex, rowNode) {
				/* Event fires in dojox.grid._TreeGridView.buildRow-method */
			},

			sortChildren: function (itemId, childrenIdsOrder) {
				var itemsById = _store._itemsByIdentity,
					children = itemsById[itemId][_childrenAttr],
					childrenCount = children.length,
					i,
					childId,
					child;
				for (i = 0; i < childrenCount; i++) {
					childId = childrenIdsOrder[i];
					child = itemsById[childId];
					children[i] = child;
				}

				_itemsByIndex = [];
				_itemsById = {};
				_treeCacheItems = [];
				this._refresh();
			},

			/* native API overriding */

			keepRows: args.cachedRowsCount || 100,
			selectionMode: args.multipleSelection ? 'extended' : 'single',

			setModel: function () {
				this.removeExtraData();
				_dojox_grid_LazyTreeGrid_setModel.apply(this, arguments);
				_store = this.store;
			},

			_onNew: function (item, parentInfo) {
				var itemId = item[_idAttr][0],
					itemIsOpened = _expandAllByDefault || !!_openedExpandos[itemId],
					treeCacheItemsCount,
					parentId,
					parentRowIndex,
					parentInfoByIndex,
					parentTreePath,
					parentTreePathCount,
					itemIndex,
					itemTreePath;

				if (item[_childrenAttr] && true === item[_childrenAttr][0]) {
					_itemsToFetchChildren[itemId] = item;
				}

				if (!parentInfo || parentInfo.attribute !== _childrenAttr) {
					_treeCacheItems[_treeCacheItems.length] = {
						opened: itemIsOpened,
						treePath: []
					};
					++this._size;
					_dojox_grid_TreeGrid__onNew.apply(this, arguments);
				} else {
					parentId = parentInfo.item[_idAttr][0];
					parentRowIndex = _getRowIndex(parentId);
					if (parentRowIndex >= 0) {
						parentInfoByIndex = _treeCacheItems[parentRowIndex];
						if (parentInfoByIndex && parentInfoByIndex.opened) {
							parentTreePath = parentInfoByIndex.treePath;
							parentTreePathCount = parentTreePath.length;
							treeCacheItemsCount = _treeCacheItems.length;
							for (
								itemIndex = parentRowIndex + 1;
								itemIndex < treeCacheItemsCount;
								itemIndex++
							) {
								if (
									_treeCacheItems[itemIndex].treePath.length <=
									parentTreePathCount
								) {
									break;
								}
							}
							itemTreePath = parentTreePath.slice(0);
							itemTreePath[parentTreePathCount] = parentId;

							_itemsById[itemId] = {
								idty: itemId,
								item: item
							};

							_treeCacheItems.splice(itemIndex, 0, {
								opened: itemIsOpened,
								treePath: itemTreePath
							});
							_itemsByIndex.splice(itemIndex, 0, _itemsById[itemId]);

							++this._size;
							if (_rowsUpdateEnabled) {
								this.updateRowCount(this._size);
								this._updateRenderedRows(itemIndex);
							}
						} else if (_rowsUpdateEnabled) {
							this.updateRow(parentRowIndex);
						}
					}
				}

				if (itemIsOpened) {
					_tryToFetchChildren(item);
					_openedExpandos[itemId] = true;
				}
			},

			_onNewRange: function (items, parentInfo) {
				var itemsCount = items.length,
					i,
					item,
					itemId,
					itemIsOpened,
					treeCacheItemsCount,
					parentId,
					parentRowIndex,
					parentInfoByIndex,
					parentIsOpened,
					parentTreePath,
					parentTreePathCount,
					firstItemIndex,
					itemIndex,
					itemTreePath,
					tempTreeCacheItems,
					tempItemsByIndex,
					openedItems;

				if (parentInfo && _childrenAttr === parentInfo.attribute) {
					parentId = parentInfo.item[_idAttr][0];
					parentRowIndex = _getRowIndex(parentId);
					if (0 <= parentRowIndex) {
						parentInfoByIndex = _treeCacheItems[parentRowIndex];
						parentIsOpened = !!(parentInfoByIndex && parentInfoByIndex.opened);
						if (parentIsOpened) {
							parentTreePath = parentInfoByIndex.treePath;
							parentTreePathCount = parentTreePath.length;
							treeCacheItemsCount = _treeCacheItems.length;
							for (
								firstItemIndex = parentRowIndex + 1;
								firstItemIndex < treeCacheItemsCount;
								firstItemIndex++
							) {
								if (
									_treeCacheItems[firstItemIndex].treePath.length <=
									parentTreePathCount
								) {
									break;
								}
							}
							itemTreePath = parentTreePath.slice(0);
							itemTreePath[parentTreePathCount] = parentId;

							tempTreeCacheItems = [];
							tempItemsByIndex = [];
							openedItems = [];

							for (i = 0; i < itemsCount; i++) {
								item = items[i];
								itemId = item[_idAttr][0];
								itemIsOpened = _expandAllByDefault || !!_openedExpandos[itemId];
								itemIndex = firstItemIndex + i;

								if (item[_childrenAttr] && true === item[_childrenAttr][0]) {
									_itemsToFetchChildren[itemId] = item;
								}

								_itemsById[itemId] = {
									idty: itemId,
									item: item
								};

								tempTreeCacheItems[tempTreeCacheItems.length] = {
									opened: itemIsOpened,
									treePath: itemTreePath
								};
								tempItemsByIndex[tempItemsByIndex.length] = _itemsById[itemId];

								++this._size;

								if (itemIsOpened) {
									openedItems[openedItems.length] = item;
									_openedExpandos[itemId] = true;
								}
							}

							Array_splice.apply(
								_treeCacheItems,
								[firstItemIndex, 0].concat(tempTreeCacheItems)
							);
							Array_splice.apply(
								_itemsByIndex,
								[firstItemIndex, 0].concat(tempItemsByIndex)
							);

							if (_rowsUpdateEnabled && 0 < itemsCount) {
								this.updateRowCount(this._size);
								this._updateRenderedRows(firstItemIndex);
							}

							openedItemsCount = openedItems.length;
							for (i = 0; i < openedItemsCount; i++) {
								_tryToFetchChildren(openedItems[i]);
							}
						} else if (_rowsUpdateEnabled && 0 < itemsCount) {
							this.updateRow(parentRowIndex);
						}
					}
				} else {
					for (i = 0; i < itemsCount; i++) {
						item = items[i];
						itemId = item[_idAttr][0];
						itemIsOpened = _expandAllByDefault || !!_openedExpandos[itemId];

						if (item[_childrenAttr] && true === item[_childrenAttr][0]) {
							_itemsToFetchChildren[itemId] = item;
						}

						_treeCacheItems[_treeCacheItems.length] = {
							opened: itemIsOpened,
							treePath: []
						};
						++this._size;
						_dojox_grid_TreeGrid__onNew.apply(this, arguments);
					}
				}
			},

			updateRowCount: function (inRowCount) {
				if (_rowsUpdateEnabled) {
					if (this.updating) {
						this.invalidated.rowCount = inRowCount;
					} else {
						this.rowCount = inRowCount;
						this._setAutoHeightAttr(this.autoHeight, true);
						this.scroller.updateRowCount(inRowCount);
						this._resize();
						this.setScrollTop(this.scrollTop);
					}
				}
			},

			_updateRenderedRows: function (startIndex) {
				var scrollerStack, scrollerStackCount, rowsPerPage, i, page;
				if (_rowsUpdateEnabled) {
					scrollerStack = this.scroller.stack;
					scrollerStackCount = scrollerStack.length;
					rowsPerPage = this.rowsPerPage;
					for (i = 0; i < scrollerStackCount; i++) {
						page = scrollerStack[i];
						if (page * rowsPerPage >= startIndex) {
							this.updateRows(page * rowsPerPage, rowsPerPage);
						} else if ((page + 1) * rowsPerPage >= startIndex) {
							this.updateRows(
								startIndex,
								(page + 1) * rowsPerPage - startIndex + 1
							);
						}
					}
				}
			},

			onStyleRow: function (row) {
				if (!this.layout._isCollapsable) {
					_dojox_grid_TreeGrid_onStyleRow.apply(this, arguments);
					return;
				}
				row.customClasses +=
					(_highlightOddRows && row.odd ? ' dojoxGridRowOdd' : '') +
					(_dontShowRowBorders ? ' aras_lazytreegrid_no_border' : '') +
					(row.selected ? ' dojoxGridRowSelected' : '') +
					(row.over ? ' dojoxGridRowOver' : '');
				this.focus.styleRow(row);
				this.edit.styleRow(row);
			},

			_onExpandoComplete: function (childItems, request, size) {
				var parentIndex = this.expandoRowIndex;
				_insertChildren(parentIndex);
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

			_onFetchComplete: function (items, request) {
				var startRowIdx = request.startRowIdx,
					count = request.count,
					start = items.length <= count ? 0 : request.start,
					treePath = request.treePath || [],
					rowIndex,
					itemId,
					itemsCount,
					i,
					loadingState;
				if (Array.isArray(items) && items.length > 0) {
					itemsCount = Math.min(count, items.length);
					loadingState = this._loading;
					this._loading = false;
					for (i = 0; i < itemsCount; i++) {
						rowIndex = startRowIdx + i;
						itemId = items[start + i].uniqueId[0];
						if (!_treeCacheItems[rowIndex]) {
							_treeCacheItems[rowIndex] = {
								opened: false,
								treePath: treePath
							};
						}
						if (!_itemsByIndex[rowIndex]) {
							this._addItem(items[start + i], rowIndex, true);
						}
						this.updateRow(rowIndex);
						if (_openedExpandos[itemId]) {
							this._fold(itemId, true);
						}
					}
					this._loading = loadingState;
				}
				this.showMessage(0 === this._size ? this.noDataMessage : '');
				this._pending_requests[startRowIdx] = false;
				this._reqQueueLen--;
				if (this._loading && 0 === this._reqQueueLen) {
					this._loading = false;
					if (this._lastScrollTop) {
						this.setScrollTop(this._lastScrollTop);
					}
				}
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
			}
		};
	}

	return dojo.declare(
		'LazyTreeGridSubclass',
		[LazyTreeGrid, AbleToExpandAndCollapseAll],
		{
			constructor: function (args) {
				window.addEventListener(
					'resize',
					function () {
						this.resize();
					}.bind(this),
					false
				);
				var publicAPI = _LazyTreeGridSubclass.call(this, args || {}),
					propName;
				for (propName in publicAPI) {
					this[propName] = publicAPI[propName];
				}
			}
		}
	);
});
