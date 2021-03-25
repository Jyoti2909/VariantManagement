define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/_base/lang',
	'dojo/_base/event',
	'dojox/grid/EnhancedGrid',
	'dojox/grid/_RowManager',
	'dojox/grid/_FocusManager',
	'dojox/grid/_Scroller',
	'./ExcelEditManager'
], function (
	declare,
	connect,
	lang,
	event,
	EnhancedGrid,
	_RowManager,
	_FocusManager,
	_Scroller,
	ExcelEditManager
) {
	var excelGridDoesntSupportMethod = function () {
		throw "ExcelGrid doesn't support this method";
	};

	// We use AppletGridMap to adapt Com Controls API for DataGrid
	var createAppletGridMap = function () {
		var rows = [];

		var privateMethods = {
			getMapRowIndex: function (storeRowIndex, columnNumber, cellNumber) {
				for (var i = 0, count = rows.length; i < count; i++) {
					if (
						rows[i].storeRowIndex === storeRowIndex &&
						rows[i].cells[columnNumber] &&
						rows[i].cells[columnNumber].storeCellIndex === cellNumber
					) {
						return i;
					}
				}
				return -1;
			}
		};

		return {
			clear: function () {
				rows = [];
			},

			addRow: function (rowIndex, storeRowIndex, storeRowId) {
				rows[rowIndex] = {
					storeRowIndex: storeRowIndex,
					storeRowId: storeRowId,
					rowId: undefined,
					cells: []
				};
			},

			setRowId: function (rowIndex, rowId) {
				rows[rowIndex].rowId = rowId;
			},

			addCell: function (rowIndex, columnIndex, storeCellIndex, itemId) {
				rows[rowIndex].cells[columnIndex] = {
					storeCellIndex: storeCellIndex,
					itemId: itemId
				};
			},

			getStoreRowIndex: function (rowIndex) {
				var i;
				for (i = 0; i < rows.length; i++) {
					if (rows[i].rowIndex !== rowIndex) {
						return rows[i].storeRowIndex;
					}
				}
			},

			//returns object {rowIndex: num, columnNumber: num, cellIndex: num}
			//input: rowIndex - store row index, cellIndex - store cell index, columnOffset - offset in columns from current cell
			getRowCellByColumnOffset: function (
				storeRowIndex,
				storeCellIndex,
				columnOffset
			) {
				var columnNumber = this.getColumnIndexByStoreRowIndexAndStoreCellIndex(
						storeRowIndex,
						storeCellIndex
					),
					rowIndex = privateMethods.getMapRowIndex(
						storeRowIndex,
						columnNumber,
						storeCellIndex
					),
					resultCell = {
						rowIndex: storeRowIndex,
						columnNumber: columnNumber,
						cellIndex: storeCellIndex
					},
					newColumnNumber = columnNumber + columnOffset;

				while (rowIndex >= 0) {
					if (rows[rowIndex].cells[newColumnNumber]) {
						resultCell.cellIndex =
							rows[rowIndex].cells[newColumnNumber].storeCellIndex;
						break;
					}
					rowIndex--;
				}

				return resultCell;
			},

			//returns object {rowIndex: num, cellIndex: num} (for store)
			//input: rowIndex - store row index, cellIndex - store cell index
			getCellBelow: function (storeRowIndex, storeCellIndex, rowOffset) {
				//get column number by col index and row
				var columnNumber = this.getColumnIndexByStoreRowIndexAndStoreCellIndex(
						storeRowIndex,
						storeCellIndex
					),
					startIndex = privateMethods.getMapRowIndex(
						storeRowIndex,
						columnNumber,
						storeCellIndex
					),
					resultCell = {
						rowIndex: storeRowIndex,
						columnNumber: columnNumber,
						cellIndex: storeCellIndex
					};

				rowOffset = isNaN(rowOffset) ? 1 : rowOffset;
				if (startIndex !== -1) {
					var currentCell;

					startIndex += 1;
					for (
						var i = 0, count = rows.length;
						i < count && startIndex + i < count && rowOffset;
						i++
					) {
						currentCell = rows[startIndex + i].cells[columnNumber];

						if (currentCell) {
							resultCell.rowIndex = rows[startIndex + i].storeRowIndex;
							resultCell.columnNumber = columnNumber;
							resultCell.cellIndex = currentCell.storeCellIndex;

							rowOffset--;
						}
					}
				}
				return resultCell;
			},

			getCellAbove: function (storeRowIndex, storeCellIndex, rowOffset) {
				//not implemented
				//get column number by col index and row
				var columnNumber = this.getColumnIndexByStoreRowIndexAndStoreCellIndex(
						storeRowIndex,
						storeCellIndex
					),
					startIndex = privateMethods.getMapRowIndex(
						storeRowIndex,
						columnNumber,
						storeCellIndex
					),
					resultCell = {
						rowIndex: storeRowIndex,
						columnNumber: columnNumber,
						cellIndex: storeCellIndex
					};

				rowOffset = isNaN(rowOffset) ? 1 : rowOffset;
				if (startIndex !== -1) {
					var currentCell;

					startIndex -= 1;
					for (var i = 0; startIndex - i >= 0 && rowOffset; i++) {
						currentCell = rows[startIndex - i].cells[columnNumber];

						if (currentCell) {
							resultCell.rowIndex = rows[startIndex - i].storeRowIndex;
							resultCell.columnNumber = columnNumber;
							resultCell.cellIndex = currentCell.storeCellIndex;

							rowOffset--;
						}
					}
				}
				return resultCell;
			},

			getRowId: function (rowIndex) {
				if (rows[rowIndex]) {
					return rows[rowIndex].rowId;
				}
			},

			getRowIndexByRowId: function (rowId) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].rowId === rowId) {
						return i;
					}
				}
			},

			getStoreRowIndexByRowId: function (rowId) {
				var i;
				for (i = 0; i < rows.length; i++) {
					if (rows[i].rowId === rowId) {
						return rows[i].storeRowIndex;
					}
				}
			},

			getRowsCountInCurrentRow: function (storeRowIndex) {
				var count = 0;
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].storeRowIndex == storeRowIndex) {
						count++;
					}
				}
				return count;
			},

			getRowCount: function () {
				return rows.length;
			},

			getItemIdByStoreRowIndexAndStoreCellIndex: function (
				storeRowIndex,
				storeCellIndex
			) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].storeRowIndex === storeRowIndex) {
						for (var columnIndex in rows[i].cells) {
							if (
								rows[i].cells[columnIndex].storeCellIndex === storeCellIndex
							) {
								return rows[i].cells[columnIndex].itemId;
							}
						}
					}
				}
			},

			getParentItemIdByStoreRowIndexAndStoreCellIndex: function (
				storeRowIndex,
				storeCellIndex
			) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].storeRowIndex === storeRowIndex) {
						for (var columnIndex in rows[i].cells) {
							if (
								rows[i].cells[columnIndex].storeCellIndex === storeCellIndex
							) {
								var itemId = rows[i].cells[columnIndex].itemId;
								var firstCol = columnIndex;
								while (rows[i].cells[firstCol - 1]) {
									if (rows[i].cells[firstCol - 1].itemId === itemId) {
										firstCol = firstCol - 1;
									} else {
										return rows[i].cells[firstCol - 1].itemId;
									}
								}
								if (rows[i - 1] && rows[i - 1].cells[firstCol - 1]) {
									return rows[i - 1].cells[firstCol - 1].itemId;
								}
								return '';
							}
						}
					}
				}
			},

			getStoreRowIdByStoreRowIndex: function (storeRowIndex) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].storeRowIndex === storeRowIndex) {
						return rows[i].storeRowId;
					}
				}
			},

			getRowIdByStoreRowIndexAndStoreCellIndex: function (
				storeRowIndex,
				storeCellIndex
			) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].storeRowIndex === storeRowIndex) {
						for (var columnIndex in rows[i].cells) {
							if (
								rows[i].cells[columnIndex].storeCellIndex === storeCellIndex
							) {
								return rows[i].rowId;
							}
						}
					}
				}
			},

			getRowIdByStoreRowIdAndStoreCellIndex: function (
				storeRowId,
				storeCellIndex
			) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].storeRowId === storeRowId) {
						for (var columnIndex in rows[i].cells) {
							if (
								rows[i].cells[columnIndex].storeCellIndex === storeCellIndex
							) {
								return rows[i].rowId;
							}
						}
					}
				}
			},

			getColumnIndexByStoreRowIndexAndStoreCellIndex: function (
				storeRowIndex,
				storeCellIndex
			) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].storeRowIndex === storeRowIndex) {
						for (var columnIndex in rows[i].cells) {
							if (
								rows[i].cells[columnIndex].storeCellIndex === storeCellIndex
							) {
								return parseInt(columnIndex);
							}
						}
					}
				}
			},

			getStoreCellIndexByRowIdAndColumnIndex: function (rowId, columnIndex) {
				var currentRow, i;
				for (i = 0; i < rows.length; i++) {
					currentRow = rows[i];
					if (currentRow.rowId === rowId && currentRow.cells[columnIndex]) {
						return currentRow.cells[columnIndex].storeCellIndex;
					}
				}

				return null;
			},

			getStoreRowIdByRowId: function (appletRowId) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].rowId === appletRowId) {
						return rows[i].storeRowId;
					}
				}
			},

			getItemId: function (rowId, columnIndex) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].rowId === rowId) {
						return rows[i].cells[columnIndex].itemId;
					}
				}
			}
		};
	};

	var Scroller = declare(_Scroller, {
		measurePage: function (inPageIndex) {
			if (this.grid.rowHeight) {
				return (
					((inPageIndex + 1) * this.rowsPerPage > this.rowCount
						? this.rowCount - inPageIndex * this.rowsPerPage
						: this.rowsPerPage) * this.grid.rowHeight
				);
			}
			var n = this.getDefaultPageNode(inPageIndex);
			var result = n && n.innerHTML ? n.offsetHeight : undefined;
			if (result === 0) {
				n = this.getDefaultPageNode(inPageIndex);
				result = n && n.innerHTML ? n.offsetHeight : undefined;
			}
			return result;
		}
	});

	return declare(
		'Aras.Client.Controls.Experimental.ExcelDataGrid',
		EnhancedGrid,
		{
			nameColumns: null,
			openHTMLCell: null,
			order: null,
			styleGrid: null,
			selectable: true,
			map: null,

			constructor: function (args) {
				this.nameColumns = [];
				this.order = [];
				this.noBodyCollections = {};
				this.styleGrid = {};
				this.openHTMLCell = [];
				this.map = createAppletGridMap();
				this.rowsPerPage = 50;
				this.keepRows = 150;
				if (args.validateCell) {
					this.validateCell = args.validateCell;
				}
			},

			createScroller: function () {
				// summary:
				// Creates a new virtual scroller
				this.scroller = new Scroller();
				this.scroller.grid = this;
				this.scroller.renderRow = lang.hitch(this, 'renderRow');
				this.scroller.removeRow = lang.hitch(this, 'rowRemoved');
			},

			createManagers: function () {
				// row manager
				this.rows = new _RowManager(this);
				// focus manager
				this.focus = new _FocusManager(this);
				// edit manager
				this.edit = new ExcelEditManager(this);
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
			},

			_onDelete: function (item) {
				var id = this.store.getIdentity(item);
				delete this.styleGrid[id];
				this.inherited(arguments);
			},

			canSort: function (col) {
				return this.getCell(Math.abs(col) - 1).sort !== 'NOSORT';
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
				this.inherited(arguments);

				if ('A' === e.target.nodeName && 'gridLink' === e.target.className) {
					this.gridLinkClick(e);
					event.stop(e);
				} else if (
					e.cell &&
					e.cell.externalWidget &&
					e.cell.externalWidget.functionalFlags.interactive
				) {
					e.cell.externalWidget.onClick(e);
					event.stop(e);
				}
			},

			dokeydown: function (e) {
				//Workaround for Dojo bug #17569.
				//Remove it after transition to the version of Dojo where it will be fixed.
				var enterPressed = e.keyCode === 13,
					noHeaderHasFocus = -1 === this.focus.getHeaderIndex(),
					focusCell = this.focus.cell,
					cellHasFocus = focusCell && -1 !== this.focus.rowIndex;

				if (
					enterPressed &&
					noHeaderHasFocus &&
					!e.shiftKey &&
					!this.edit.isEditing() &&
					!cellHasFocus
				) {
					return;
				} else {
					this.inherited(arguments);

					if (cellHasFocus) {
						if (
							focusCell.externalWidget &&
							focusCell.externalWidget.functionalFlags.interactive
						) {
							focusCell.externalWidget.onKeyDown(
								focusCell,
								this.focus.rowIndex,
								e
							);
						}
					}
				}
			},

			doApplyCellEditExcel: function (inValue, inRowIndex, inCellIndex) {
				var self = this;
				var rowIndex = this.edit.info.rowIndex;
				var cellIndex = this.edit.info.cellIndex;
				var cells = this.layout.cells;
				var item = this.getItem(rowIndex);
				var itemXML = this.store.getValue(item, 'rowItemXML', '');
				var inputDom = new XmlDocument();
				var idx = 0;
				var propNode;
				var column;
				inputDom.loadXML(itemXML);

				var rec = function (parentItem, col) {
					var properties = parentItem.selectNodes('./prop');
					if (idx + properties.length <= cellIndex) {
						idx += properties.length;
						col += properties.length;
					} else {
						var propIndex = cellIndex - idx;
						column = cells[col + propIndex];
						propNode = properties[propIndex];
						return false;
					}
					var childItems = parentItem.selectNodes('./Item');
					for (var i = 0; i < childItems.length; i++) {
						if (!rec(childItems[i], col)) {
							return false;
						}
					}
					return true;
				};

				rec(inputDom.firstChild, 0);
				var value;
				var oldValue = propNode.text;

				if (/^<checkbox\ state\=\"\d?\"\/>$/.test(oldValue)) {
					// jshint ignore:line
					value = oldValue;
				} else if (column.sort === 'NUMERIC' || column.sort === 'DATE') {
					if (inValue) {
						value = column.convertToNeutral(inValue) || oldValue;
					} else {
						value = inValue === '' ? inValue : oldValue;
					}
				} else {
					value = inValue;
				}
				propNode.text = value;

				this.store.setValue(item, 'rowItemXML', inputDom.xml);
				this.onApplyCellEditExcel(value, inRowIndex, inCellIndex);
			},

			doCanEditExcel: function (inRowIndex, inCellIndex) {
				var layoutCell = this._getLayoutCell(inRowIndex, inCellIndex);

				if (
					layoutCell.externalWidget &&
					layoutCell.externalWidget.functionalFlags.edit
				) {
					return false;
				} else {
					return this.canEditExcel(inRowIndex, inCellIndex);
				}
			},

			_getLayoutCell: function (rowIndex, cellIndex) {
				var cellNode = this.views.views[0].getCellNode(rowIndex, cellIndex),
					columnIndex = cellNode.getAttribute('col');

				return this.layout.cells[columnIndex];
			},

			onApplyCellEdit: excelGridDoesntSupportMethod,

			onCellFocus: excelGridDoesntSupportMethod,

			canEdit: excelGridDoesntSupportMethod,

			doCancelEdit: function (inRowIndex) {
				this.onCancelEdit.apply(this, arguments);
			},

			doApplyEdit: excelGridDoesntSupportMethod,

			onApplyCellEditExcel: function (value, inRowIndex, inCellIndex) {},

			onCellFocusExcel: function (inRowIndex, inCellIndex) {
				this.edit.cellFocus(inRowIndex, inCellIndex);
			},

			selectCell: function (rowIndex, columnIndex, cellIndex) {
				var selector = this.pluginMgr.getPlugin('Selector');
				selector.select('cell', rowIndex, columnIndex, cellIndex);
				this.focus.setFocusIndex(rowIndex, cellIndex);
			},

			clearSelection: function () {
				var selector = this.pluginMgr.getPlugin('Selector');
				selector.clear();

				this.focus.rowIndex = this.focus.cellIndex = -1;
			},

			canEditExcel: function (inRowIndex, inCellIndex) {
				return this._canEdit;
			},

			getItem: function (storeRowIndex) {
				var storeRowId = this.map.getStoreRowIdByStoreRowIndex(storeRowIndex);
				return this.store._getItemByIdentity(storeRowId);
			}
		}
	);
});
