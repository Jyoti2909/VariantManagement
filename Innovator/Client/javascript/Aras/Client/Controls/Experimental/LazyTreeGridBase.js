define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/_base/lang',
	'dojo/dom',
	'dojo/dom-class',
	'dojox/grid/LazyTreeGrid',
	'dojo/aspect',
	'dojo/_base/event',
	'dijit/form/TextBox',
	'dijit/form/DropDownButton',
	'dijit/DropDownMenu',
	'dijit/MenuItem',
	'dijit/form/FilteringSelect',
	'./_grid/CheckedMultiSelect',
	'dojo/data/ItemFileReadStore',
	'dojo/store/Memory',
	'dijit/form/ComboBox',
	'dijit/form/DateTextBox',
	'dojo/keys',
	'dojo/date',
	'dojo/date/locale',
	'dojo/date/stamp',
	'dojo/on',
	'dojo/touch',
	'dojo/has',
	'dojox/grid/_Scroller'
], function (
	declare,
	connect,
	lang,
	domSelect,
	DomClass,
	LazyTreeGrid,
	aspect,
	event,
	TextBox,
	DropDownButton,
	DropDownMenu,
	MenuItem,
	FilteringSelect,
	CheckedMultiSelect,
	ItemFileReadStore,
	Memory,
	ComboBox,
	_DateTextBox,
	keys,
	date,
	locale,
	stamp,
	on,
	touch,
	has,
	_Scroller
) {
	var ArasDateTextBox = declare(_DateTextBox, {
		datePackage: lang.mixin(date, { locale: locale, stamp: stamp }),
		format: function (value, pos) {
			var res = '';
			if (value) {
				this.constraints = { selector: 'date', datePattern: this.inputformat };
				res = this.datePackage.locale.format(value, {
					selector: 'date',
					datePattern: this.inputformat
				});
			}
			return res;
		},
		onFocus: function () {
			this.constraints = { selector: 'date' };
			this.inherited(arguments);
		},
		validator: function (value, constraints) {
			var con = constraints.datePattern
				? { selector: 'date' }
				: { selector: 'date', datePattern: this.inputformat };
			var res = true;
			if (!this.inherited(arguments)) {
				this.constraints = con;
				constraints = con;
				res = this.inherited(arguments);
			}
			return res;
		},
		_setValueAttr: function (value) {
			if (!value) {
				value = null;
			}
			this.inherited(arguments);
		}
	});

	var Scroller = declare(_Scroller, {
		updatePageHeight: function (inPageIndex, fromBuild, fromAsynRendering) {
			if (this.pageExists(inPageIndex)) {
				var oh = this.getPageHeight(inPageIndex);
				var h = this.measurePage(inPageIndex);
				if (h === undefined || h === 0) {
					h = oh;
				}
				this.pageHeights[inPageIndex] = h;
				if (oh != h) {
					this.updateContentHeight(h - oh);
					var ah = this.grid.get('autoHeight');
					if (
						(typeof ah == 'number' && ah > this.rowCount) ||
						(ah === true && !fromBuild)
					) {
						if (!fromAsynRendering) {
							this.grid.sizeChange();
						} else {
							//fix #11101 by using fromAsynRendering to avoid deadlock
							var ns = this.grid.viewsNode.style;
							ns.height = parseInt(ns.height) + h - oh + 'px';
							this.repositionPages(inPageIndex);
						}
					} else {
						this.repositionPages(inPageIndex);
					}
				}
				return h;
			}
			return 0;
		}
	});

	return declare(
		'Aras.Client.Controls.Experimental.LazyTreeGridBase',
		LazyTreeGrid,
		{
			inputRowNode: null,
			inputRowCollections: null,
			nameColumns: null,
			openHTMLCell: null,
			order: null,
			styleGrid: null,
			//fix of bug related on the transition to edit mode for inputRow
			selectable: true,
			treeGridIndent: null,

			constructor: function (args) {
				this.nameColumns = [];
				this.order = [];
				this.inputRowCollections = {};
				this.noBodyCollections = {};
				this.styleGrid = {};
				this.openHTMLCell = [];
				this.treeGridIndent = args.treeGridIndent;
			},

			_clearData: function () {
				this.inherited(arguments);
				this._treeCache.items = [];
			},

			createScroller: function () {
				// summary:
				//		Creates a new virtual scroller
				this.scroller = new Scroller();
				this.scroller.grid = this;
				this.scroller.renderRow = lang.hitch(this, 'renderRow');
				this.scroller.removeRow = lang.hitch(this, 'rowRemoved');
			},

			onResizeColumn: function (/*int*/ cellIdx) {
				// Called when a column is resized.
				var info = this.edit.info;
				if (info && info.cell) {
					this.focus.setFocusIndex(info.rowIndex, info.cell.index);
				}
			},

			onKeyDown: function (e) {
				switch (e.keyCode) {
					case keys.ENTER:
						var currentView = this.focus.focusView || this.views.views[0];
						currentView.content.decorateEvent(e);
						break;
				}
				this.inherited(arguments);
			},

			renderInputRow: function () {
				var cells = this.grid.layout.cells,
					table = this.headerContentNode.lastChild.lastChild,
					row,
					rowCell,
					widget,
					i;

				connect.connect(this.headerNode, 'onscroll', this, function () {
					if (this.scrollboxNode && this.headerNode) {
						this.scrollboxNode.scrollLeft = this.headerNode.scrollLeft;
					}
				});

				// row dom creation
				row = document.createElement('TR');
				row.setAttribute('class', 'SearchBar');
				row.setAttribute(
					'style',
					this.grid.visibleSearchBar ? '' : 'display: none;'
				);

				connect.connect(row, 'onkeydown', this.grid, function (e) {
					e.inputRow = true;
				});
				on(
					row,
					'mousedown',
					function (evt) {
						domSelect.setSelectable(row, true);
						this.grid.edit.apply();
					}.bind(this)
				);

				table.appendChild(row);
				this.grid.inputRowNode = row;
				for (i = 0; i < cells.length; i++) {
					widget = this.grid.createWidgetInputRow(cells[i].field, i);
					rowCell = document.createElement('TD');
					if (cells[i].hidden) {
						rowCell.style.display = 'none';
					}

					if (cells[i].editableType === 'InputHelper') {
						DomClass.add(rowCell, 'InputHelper');
					}

					rowCell.appendChild(widget.domNode);
					row.appendChild(rowCell);
				}
			},

			htmlButtonOnClick: function () {
				var parent = this.getParent();
				var value;
				if (parent.cell.optionsLables) {
					var indexLabel = parent.cell.optionsLables.indexOf(this.get('label'));
					value = parent.cell.options[indexLabel];
				} else {
					value = this.get('label');
				}
				parent.widget.set('label', value);
			},

			createWidgetInputRow: function (field, index) {
				var cells = this.layout.cells;
				var widget, labels, j, data;

				if (!this.inputRowCollections[field]) {
					var cell = cells[index];
					var editableTypeOfCell = cell.editableType;
					if ('dropDownButton' === editableTypeOfCell) {
						labels = cell.optionsLables || cell.options;
						var menu = new DropDownMenu({ style: 'display: none;' });
						for (j = 0; j < cell.options.length; j++) {
							menu.addChild(
								new MenuItem({
									label: labels[j],
									onClick: this.htmlButtonOnClick
								})
							);
						}
						widget = new DropDownButton({
							class: 'dropDownInputRow',
							dropDown: menu,
							style: 'width:100%; height:100%; margin: 0;',
							onKeyDown: this._keyPressInputRow()
						});
						menu.widget = widget;
						menu.cell = cell;
						widget.watch('label', this._callEventSearchRow('onChangeInputRow'));
					} else if ('FilterComboBox' === editableTypeOfCell && cell.options) {
						data = [];
						for (var i = 0; i < cell.options.length; i++) {
							data.push({
								name: cell.optionsLables[i],
								id: cell.options[i]
							});
						}
						widget = new FilteringSelect({
							store: new Memory({ data: data }),
							onFocus: this._callEventSearchRow('onFocusInputRow'),
							onChange: this._callEventSearchRow('onChangeInputRow'),
							required: false,
							onKeyDown: this._keyPressInputRow()
						});
					} else if ('dateTime' === editableTypeOfCell) {
						var format = cell.editformat || cell.inputformat;
						widget = new ArasDateTextBox({
							inputformat: format,
							onKeyDown: this._keyPressInputHelper(),
							onChange: this._callEventSearchRow('onChangeInputRow'),
							// for now default dropDownWinget turned off
							openDropDown: function () {}
						});
						var self = this;
						connect.connect(widget._buttonNode, 'onclick', function () {
							self.onInputHelperShow(
								'input_row',
								grid.GetColumnIndex(widget.field)
							);
						});
					} else if (
						'CheckedMultiSelect' === editableTypeOfCell &&
						cell.options
					) {
						labels = cell.optionsLables || cell.options;
						var items = [];
						for (j = 0; j < cell.options.length; j++) {
							items.push({
								label: labels[j] || '&nbsp;',
								value: cell.options[j]
							});
						}
						data = { identifier: 'value', label: 'label', items: items };
						widget = new CheckedMultiSelect({
							store: new ItemFileReadStore({ data: lang.clone(data) }),
							onKeyDown: this._keyPressInputRow(),
							onChange: this._callEventSearchRow('onChangeInputRow')
						});
						widget.startup();
					} else if ('InputHelper' === editableTypeOfCell) {
						widget = new ComboBox({
							store: new ItemFileReadStore({
								data: { identifier: 'name', items: [] }
							}),
							validate: this._validateInputHelper(),
							onClick: this._comboBoxClick(),
							onKeyDown: this._keyPressInputHelper(),
							onChange: this._callEventSearchRow('onChangeInputRow')
						});
					} else {
						widget = new TextBox({
							onKeyDown: this._keyPressInputHelper(),
							onFocus: this._callEventSearchRow('onFocusInputRow'),
							onChange: this._callEventSearchRow('onChangeInputRow')
						});
					}
					widget.index = index;
					widget.field = field;
					this.inputRowCollections[field] = widget;
				} else {
					widget = this.inputRowCollections[field];
				}
				return widget;
			},

			_comboBoxClick: function () {
				var self = this;
				return function (e) {
					var targetClass = e.target.className.toLowerCase();
					if (targetClass.indexOf('dijitArrowButtonInner'.toLowerCase()) > -1) {
						self.onInputHelperShow(
							'input_row',
							grid.GetColumnIndex(this.field)
						);
					}
				};
			},

			_keyPressInputRow: function () {
				var self = this;
				return function (e) {
					if (keys.ENTER === e.keyCode) {
						this.onChange();
						self.onStartSearch();
					}
				};
			},

			_keyPressInputHelper: function () {
				var self = this;
				return function (e) {
					switch (e.keyCode) {
						case keys.F2:
						case keys.DOWN_ARROW:
							self.onInputHelperShow(
								'input_row',
								grid.GetColumnIndex(this.field)
							);
							break;
						case keys.ENTER:
							this.onChange();
							grid.turnEditOff();
							self.onStartSearch();
							break;
					}
				};
			},

			_callEventSearchRow: function (func) {
				var self = this;
				return function () {
					if (func && typeof self[func] == 'function') {
						self[func]('input_row', this.field);
					}
				};
			},

			_validateInputHelper: function () {
				var self = this;
				return function () {
					return self.validateCell('input_row', self.order[this.index]);
				};
			},

			buildViews: function () {
				this.inherited(arguments);
				var myView = this.views.views[0];
				//After the View creation that will have handlers for oncontextmenu event from myView.contentNode and myView.headerNode
				//However that leaves an area where the event is not handled and thus may bubble up.
				//That is the area left in myView.scrollboxNode below myView.contentNode.
				connect.connect(myView.scrollboxNode, 'oncontextmenu', this, function (
					e
				) {
					if (e.target === myView.scrollboxNode) {
						event.stop(e);
					}
				});
				aspect.before(myView, 'renderHeader', this.viewsRender);
				aspect.after(myView, 'renderHeader', this.renderInputRow);
			},

			_onDelete: function (item) {
				var id = this.store.getIdentity(item);
				delete this.styleGrid[id];
				this.inherited(arguments);
			},

			viewsRender: function () {
				var widget;
				for (var field in this.grid.inputRowCollections) {
					widget = this.grid.inputRowCollections[field];
					widget.domNode.parentNode.removeChild(widget.domNode);
				}
			},

			_setStructureAttr: function (structure) {
				for (var item in this.inputRowCollections) {
					this.inputRowCollections[item].destroyRecursive(false);
				}
				this.inputRowCollections = {};
				this.inherited(arguments);
			},

			_canDoOperationsOnCell: function (newCell, newRowIndex) {
				const editingCellChanged =
					this.edit.info.cell &&
					(!newCell ||
						this.edit.info.rowIndex !== newRowIndex ||
						this.edit.info.cell.field !== newCell.field);
				return !editingCellChanged || this.edit._isValidInput();
			},

			canSort: function (col) {
				return this.getCell(Math.abs(col) - 1).sort !== 'NOSORT';
			},

			onFocusInputRow: function (rowId, column) {
				//Event fired when focus on inputRow;
			},

			onChangeInputRow: function (rowId, column) {
				//Event fired when changed on inputRow;
			},

			onInputHelperShow: function (rowId, column) {
				//Event fired when click arrow inputHelper in edit mode cell;
			},

			onStartSearch: function () {
				//Event fired when call Enter in Simple Search;
			},

			validateCell: function (rowId, column, value) {
				//Event fired when start and finish edit cell;
				return true;
			},

			gridLinkClick: function (e) {
				//event when click on link
			},

			doclick: function (e) {
				let cellValid = true;
				if (!this._canDoOperationsOnCell(e.cell, e.rowIndex)) {
					cellValid = false;
					event.stop(e);
				}

				if ('A' === e.target.nodeName && 'gridLink' === e.target.className) {
					this.gridLinkClick(e);
					event.stop(e);
				}

				if (cellValid) {
					this.inherited(arguments);
				}
			},

			onCellClick: function (e) {
				var item = this.getItem(e.rowIndex),
					isCheckBox = e.target.isCheckBox,
					value = this.store.getValue(item, e.cell.field);

				if (
					!connect.isCopyKey(e) &&
					!e.shiftKey &&
					this.selection.isSelected(e.rowIndex) &&
					!this.edit.isEditing() &&
					!isCheckBox
				) {
					if ('boolean' !== typeof value) {
						this.focus.setFocusCell(e.cell, e.rowIndex);
						this.edit.setEditCell(e.cell, e.rowIndex);
					}
				} else if (!connect.isCopyKey(e) && !e.shiftKey && isCheckBox) {
					if (this.edit.isEditing()) {
						this.edit.apply();
					}
					this.focus.setFocusCell(e.cell, e.rowIndex);
					if (
						e.cell.editable &&
						this.canEdit &&
						this.canEdit(e.cell, e.rowIndex)
					) {
						this.store.setValue(item, e.cell.field, !value);
						this.onApplyCellEdit(!value, e.rowIndex, e.cell.field);
					}
				}

				this.inherited(arguments);
			},

			onCellDblClick: function (e) {
				//This is copy from dbClick without edit and focus on cell
				if (!this._canDoOperationsOnCell(e.cell, e.rowIndex)) {
					return;
				}
				var event;
				if (this._click.length > 1 && has('ie')) {
					event = this._click[1];
				} else if (
					this._click.length > 1 &&
					this._click[0].rowIndex != this._click[1].rowIndex
				) {
					event = this._click[0];
				} else {
					event = e;
				}
				this.onRowClick(event);
				this.onRowDblClick(e);
			},

			dokeydown: function (e) {
				//Workaround for Dojo bug #17569.
				//Remove it after transition to the version of Dojo where it will be fixed.
				var enterPressed = keys.ENTER === e.keyCode,
					noHeaderHasFocus = -1 === this.focus.getHeaderIndex(),
					noCellHasFocus = !this.focus.cell && -1 === this.focus.rowIndex;
				if (
					enterPressed &&
					noHeaderHasFocus &&
					!e.shiftKey &&
					!this.edit.isEditing() &&
					noCellHasFocus
				) {
					return;
				}
				if (!e.inputRow) {
					this.inherited(arguments);
				}
			},

			onRowContextMenu: function (e) {
				if (
					e.cell &&
					this._canDoOperationsOnCell(e.cell, e.rowIndex) &&
					!this.selection.isSelected(e.rowIndex)
				) {
					this.onRowClick(e);
				}
			},

			_itemSorterAsceding: function (first, second) {
				// Aras method: for internal use only
				return first.sortValue !== second.sortValue
					? first.sortValue > second.sortValue
						? 1
						: -1
					: 0;
			},

			_itemSorterDesceding: function (first, second) {
				// Aras method: for internal use only
				return first.sortValue !== second.sortValue
					? first.sortValue < second.sortValue
						? 1
						: -1
					: 0;
			},

			_sortItemsRecursive: function (inItems, sortProperty, sortResult) {
				// Aras method: for internal use only
				if (inItems) {
					var sortedItems = [],
						sortCell = this.getCell(this.getSortIndex()),
						currentItem,
						itemId,
						parentItemId,
						parentItem,
						propertyValue,
						i;

					// check that all items were loaded
					for (i = 0; i < inItems.length; i++) {
						currentItem = inItems[i];
						itemId = this.store.getIdentity(currentItem);

						if (this._by_idty[itemId]) {
							propertyValue = this.store.getValue(
								currentItem,
								sortProperty.attribute
							);

							sortedItems.push({
								id: itemId,
								item: currentItem,
								sortValue: sortCell.parseValue(propertyValue)
							});
						}
					}

					if (sortedItems.length) {
						if (sortedItems.length > 1) {
							sortedItems.sort(
								sortProperty.descending
									? this._itemSorterDesceding
									: this._itemSorterAsceding
							);
						}

						for (i = 0; i < sortedItems.length; i++) {
							currentItem = sortedItems[i];
							sortResult.push(currentItem);

							if (currentItem.item.children) {
								this._sortItemsRecursive(
									currentItem.item.children.slice(),
									sortProperty,
									sortResult
								);
							}
						}

						parentItemId = this.store.getValue(sortedItems[0].item, 'parent');
						parentItem = parentItemId ? this._by_idty[parentItemId].item : null;
						if (parentItem) {
							parentItem.children.length = 0;

							for (i = 0; i < sortedItems.length; i++) {
								parentItem.children.push(sortedItems[i].item);
							}
						}
					}
				}
			},

			_sortGridItems: function () {
				// Aras method: for internal use only
				var sortProperties = this.getSortProps();

				if (sortProperties) {
					var rootLevelItems = [],
						sortedItems = [],
						savedCache = {},
						currentItem,
						i;

					for (i = 0; i < this._by_idx.length; i++) {
						currentItem = this._by_idx[i];
						if (currentItem) {
							savedCache[currentItem.idty] = this._treeCache.items[i];

							if (currentItem.item.treePath.length == 1) {
								rootLevelItems.push(currentItem.item);
							}
						}
					}

					if (rootLevelItems.length) {
						this._sortItemsRecursive(
							rootLevelItems,
							sortProperties[0],
							sortedItems
						);

						this._by_idx.length = 0;
						this._treeCache.items.length = 0;
						for (i = 0; i < sortedItems.length; i++) {
							currentItem = sortedItems[i];
							this._by_idx[i] = {
								idty: currentItem.id,
								item: currentItem.item
							};
							this._treeCache.items[i] = savedCache[currentItem.id];
							this._clearNodeStyle(i);
						}
					}
				}
			},

			_clearNodeStyle: function (rowIndex) {
				// Aras method: for internal use only
				var rowNode = this.views.views[this.views.views.length - 1].getRowNode(
					rowIndex
				);
				if (rowNode) {
					if (rowNode.style.cssText === undefined) {
						rowNode.setAttribute('style', '');
					} else {
						rowNode.style.cssText = '';
					}
				}
			},

			_fetchChildsForExpandedItem: function (
				parentItem,
				parentTreePath,
				parentIndex
			) {
				// Aras method: for internal use only
				// currently it's pushes childs at the end of grid, it is possible because sorting performed after
				// perhaps later it must be improved
				var children = parentItem && parentItem.children,
					firstChildIndex,
					parentId,
					childItem,
					childId,
					childrenTreePath,
					isChildExpanded,
					byIdty,
					byIdx,
					treeCacheItems,
					openedItemsIds,
					i;

				if (children) {
					byIdty = this._by_idty;
					byIdx = this._by_idx;
					treeCacheItems = this._treeCache.items;
					openedItemsIds = this.openedExpandos;

					parentId = parentItem.uniqueId[0];
					firstChildIndex = parentIndex + 1;
					childrenTreePath = parentTreePath.slice();
					childrenTreePath[childrenTreePath.length] = parentId;
					for (i = children.length - 1; i >= 0; i--) {
						childItem = children[i];
						childId = childItem.uniqueId[0];
						isChildExpanded = !!openedItemsIds[childId];

						if (!byIdty[childId]) {
							byIdx.splice(
								firstChildIndex,
								0,
								(byIdty[childId] = {
									idty: childId,
									item: childItem
								})
							);
							treeCacheItems.splice(firstChildIndex, 0, {
								opened: isChildExpanded,
								treePath: childrenTreePath
							});
							this._fetchedChildrenCount++;
						}

						if (isChildExpanded) {
							this._fetchChildsForExpandedItem(
								childItem,
								childrenTreePath,
								firstChildIndex
							);
						}
					}
				}
			},

			_fetch: function (start) {
				// internal dojox.grid.LazyTreeGrid method
				// Aras: 1) modified required items count
				//       2) modified default treePath for non-fetched items
				if (!this._loading) {
					this._loading = true;
				}

				start = start || 0;

				var count = this._size - start + this._fetchedChildrenCount, // Aras: modified line
					byIdx = this._by_idx,
					fetchedItems = [],
					i,
					level,
					nextLevel,
					len,
					treeCacheItems,
					treePath;

				if (0 >= count) {
					count = this.rowsPerPage;
				}

				this._reqQueueLen = 0;

				for (i = 0; i < count; i++) {
					if (byIdx[start + i]) {
						fetchedItems.push(byIdx[start + i].item);
					} else {
						break;
					}
				}

				if (fetchedItems.length === count) {
					this._reqQueueLen = 1;
					this._onFetchBegin(this._size, { startRowIdx: start, count: count });
					this._onFetchComplete(fetchedItems, {
						startRowIdx: start,
						count: count
					});
				} else {
					len = 1;
					treeCacheItems = this._treeCache.items;
					treePath = treeCacheItems[start]
						? treeCacheItems[start].treePath
						: [];
					for (i = 1; i < count; i++) {
						level = treeCacheItems[start + len - 1]
							? treeCacheItems[start + len - 1].treePath.length
							: 0;
						nextLevel = treeCacheItems[start + len]
							? treeCacheItems[start + len].treePath.length
							: 0;
						if (level !== nextLevel) {
							this._reqQueueLen++;
							this._fetchItems({
								startRowIdx: start,
								count: len,
								treePath: treePath
							});
							start = start + len;
							len = 1;
							treePath = treeCacheItems[start]
								? treeCacheItems[start].treePath
								: []; // Aras: modified line
						} else {
							len++;
						}
					}
					this._reqQueueLen++;
					this._fetchItems({
						startRowIdx: start,
						count: len,
						treePath: treePath
					});
				}
			},

			_fetchedChildrenCount: 0,

			_onFetchComplete: function (items, request) {
				// internal dojox.grid.LazyTreeGrid method
				// Aras: 1) added _sortGridItems method call;
				var startRowIdx = request.startRowIdx,
					count = request.count,
					start = items.length <= count ? 0 : request.start,
					treePath = request.treePath || [],
					byIdx,
					byIdty,
					treeCacheItems,
					openedItemsIds,
					itemsCount,
					i,
					rowIdx,
					item,
					itemId,
					byIdxCopy;

				if (Array.isArray(items) && items.length > 0) {
					byIdx = this._by_idx;
					byIdty = this._by_idty;
					treeCacheItems = this._treeCache.items;
					openedItemsIds = this.openedExpandos;
					itemsCount = Math.min(count, items.length);
					for (i = 0; i < itemsCount; i++) {
						rowIdx = startRowIdx + i;
						item = items[start + i];
						itemId = item.uniqueId[0];
						if (!byIdty[itemId] || !byIdx[rowIdx]) {
							byIdty[itemId] = byIdx[rowIdx] = {
								idty: itemId,
								item: item
							};
							treeCacheItems[rowIdx] = {
								opened: !!openedItemsIds[itemId],
								treePath: treePath
							};
						}
					}

					// Aras: new block with _fetchChildsForExpandedItem
					// if some of fetched items is expanded, then their childs will be fetched too
					this._fetchedChildrenCount = 0;
					byIdxCopy = byIdx.slice();
					for (
						rowIdx = itemsCount + startRowIdx - 1;
						rowIdx >= startRowIdx;
						rowIdx--
					) {
						item = byIdxCopy[rowIdx].item;
						itemId = item.uniqueId[0];
						if (openedItemsIds[itemId]) {
							this._fetchChildsForExpandedItem(
								item,
								treeCacheItems[rowIdx].treePath,
								rowIdx
							);
						}
					}

					this._sortGridItems();

					if (this._fetchedChildrenCount > 0) {
						this._size += this._fetchedChildrenCount;
						this.rowCount += this._fetchedChildrenCount;
						this.scroller.updateRowCount(this._size);
					}
					var rowsNumToUpdate =
						this._size - startRowIdx > 0
							? Math.min(this.rowsPerPage, this._size - start)
							: this.rowsPerPage;
					this.updateRows(startRowIdx, rowsNumToUpdate);
					// Aras: end block
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
			}
		}
	);
});
