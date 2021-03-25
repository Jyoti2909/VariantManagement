define([
	'dojo/_base/declare',
	'./TgvTreeGridFormatters',
	'./TgvTreeGridSort',
	'dojo/_base/connect',
	'Aras/Client/Controls/Experimental/ContextMenuWrapper'
], function (declare, TgvTreeGridFormatters, TgvTreeGridSort, connect) {
	var aras = parent.aras;

	return declare('TgvTreeGrid', [], {
		//this object is used for Lazy Loading.
		//it has following fields/methods:
		//function loadData(@string parentRowId),  returns: rows @object, the same object like argument of function _createRows.
		onDemandLoader: null,

		columnNamePrefix: 'col',

		firstColumnName: null,

		_rows: {},

		_uniqueRowKey: 1,

		_contextMenu: null,

		_prevFocusedCell: null,

		_tgvFocusedCell: null,

		showMoreLinkValue: 'show_more',

		compressionDictionariesByRowId: {},

		constructor: function (args) {
			this.firstColumnName = this.columnNamePrefix + 0;
			new TgvTreeGridFormatters(this);
			var rows = new Map();
			var head = new Map();

			var treeGrid = new TreeGrid(document.getElementById(args.connectId), {
				multiSelect: false
			});

			var buildBranchData = treeGrid._buildBranchData;
			this._grid = treeGrid;
			TgvTreeGridSort.initSort(this);
			var self = this;
			Object.defineProperty(treeGrid.settings, '_focusedCell', {
				get: function () {
					return self._tgvFocusedCell;
				},
				set: function (value) {
					if (!value) {
						self._prevFocusedCell = self._tgvFocusedCell;
					}
					self._tgvFocusedCell = value;
				}
			});

			//This way we may prevent bubbling of oncontextmenu event from lower level parts of grid.
			this._contextMenu = new ContextMenuWrapper(document.body);
			treeGrid._buildBranchData = function (rowId) {
				return buildBranchData.apply(this, arguments).then(function (value) {
					var row = treeGrid.rows.get(rowId);
					// Restore "+" in the case when user aborts the request for a case if user clicks '+' (not Expand All/Grow) to expand node.
					//note that another fix can be an option to fix this: to do a request before expand
					// (at a moment when user clicks '+') instead of a request in loadBranchDataHandler.
					row.children = row.children || true;
					treeGrid.rows.set(rowId, row);
					return value;
				});
			};
			treeGrid.loadBranchDataHandler = function (rowId) {
				return self.onDemandLoader.loadData(rowId).then(function (result) {
					if (!result) {
						return;
					}
					let rows = result.gridRows;

					return rows
						? self._createRows(rows, result.compressionDicts, rowId)
						: null;
				});
			};

			treeGrid.getRowClasses = function (rowId) {
				var row = self.getRow(rowId);
				if (row.offsetInfo && JSON.stringify(row.offsetInfo)) {
					return 'aras-grid-row_show-more';
				}

				return '';
			};

			var firstColumnName = this.firstColumnName;
			treeGrid.getCellType = function (headId, rowId) {
				var formatter;
				var row = self.getRow(rowId);
				var cell = row.cells[self.getCellIndex(headId)];
				var viewType = cell.viewType;
				if (cell.link) {
					formatter =
						headId === firstColumnName && !row.offsetInfo ? 'iconLink' : 'link';
				} else if (cell.listName) {
					formatter = headId === firstColumnName ? 'iconList' : 'list';
				} else if (viewType === 'date') {
					formatter = headId === firstColumnName ? 'iconDate' : 'date';
				} else if (viewType === 'decimal') {
					formatter = headId === firstColumnName ? 'iconDecimal' : 'decimal';
				} else if (viewType === 'float') {
					formatter = headId === firstColumnName ? 'iconFloat' : 'float';
				} else if (viewType === 'integer') {
					formatter = headId === firstColumnName ? 'iconInteger' : 'integer';
				} else if (viewType === 'boolean') {
					formatter =
						headId === firstColumnName ? 'iconBooleanTgv' : 'booleanTgv';
				} else if (viewType === 'color') {
					formatter = headId === firstColumnName ? 'iconColor' : 'color';
				} else if (headId === firstColumnName) {
					formatter = 'iconText';
				}
				return formatter;
			};

			head.set(firstColumnName, {});
			treeGrid.head = head;
			treeGrid.rows = rows;
			treeGrid.roots = [];
			treeGrid.settings.treeHeadView = firstColumnName;

			this._attachEventHandlers();
		},

		_createRowsFromChildRowsToAdd: function (
			gridRowId,
			childRowsToAdd,
			compressionDicts
		) {
			const rowsToAdd = this._createRows(
				childRowsToAdd,
				compressionDicts,
				gridRowId
			);
			const parentRow = gridRowId && this._grid.rows.get(gridRowId);

			rowsToAdd.forEach(
				function (item, key) {
					parentRow.children.push(key);
					this._grid.rows._store.set(key, item);
					this._grid.rows.set(key, item);
				}.bind(this)
			);

			if (parentRow) {
				this._grid.settings.indexTreeRows[gridRowId] = parentRow.children;
			}

			this._rowIdsToExpand.push(gridRowId);
		},

		_expandRowWithDescendants: function (
			gridRowId,
			levelsToExpand,
			childRows,
			compressionDicts
		) {
			let rowToExpand = this._grid.rows.get(gridRowId);
			if (!rowToExpand.children) {
				return;
			}
			this._grid.settings.expanded.delete(gridRowId);
			this._removeDescendantRows(rowToExpand.children);
			rowToExpand.children = [];
			this._grid.rows.set(gridRowId, rowToExpand);
			this._createRowsFromChildRowsToAdd(
				gridRowId,
				childRows,
				compressionDicts
			);
			this._expandDescendantRows(childRows, compressionDicts, levelsToExpand);
		},

		expandAll: function (levelsToExpand) {
			return this.loadRowsWithDescendants(
				this.getSelectedItemIDs_Experimental(),
				levelsToExpand
			);
		},

		loadRowsWithDescendants: function (
			gridRowId,
			levelsToExpand,
			reloadHeaders
		) {
			let isToExpandRootItems = !gridRowId && gridRowId !== 0;
			this._rowIdsToExpand = [];

			return this.onDemandLoader
				.loadData(
					gridRowId,
					isToExpandRootItems ? levelsToExpand + 1 : levelsToExpand,
					reloadHeaders
				)
				.then(
					function (result) {
						let rows = result && result.gridRows;
						if (result && result.isCancelClicked) {
							return;
						}

						if (isToExpandRootItems) {
							this.removeAllRows_Experimental();
							if (reloadHeaders) {
								this.removeOrderBy();
								this.createHeader(result.headers);
							}

							if (!rows) {
								return;
							}
							this.addRows(rows, result.compressionDicts, null, null, true); //skip sorting because it's in '_expandTreeGrid'
							for (let i = 0; i < rows.length; i++) {
								let row = rows[i];
								this._expandRowWithDescendants(
									row.gridRowId,
									levelsToExpand,
									row.childRows || [],
									result.compressionDicts
								);
							}

							return this._expandTreeGrid().then(function () {
								return result;
							});
						}
						if (rows) {
							this._expandRowWithDescendants(
								gridRowId,
								levelsToExpand,
								rows,
								result.compressionDicts
							);
							return this._expandTreeGrid().then(function () {
								return result;
							});
						}
					}.bind(this)
				)
				.catch(function (ex) {
					aras.AlertError(ex.message);
				});
		},

		_expandTreeGrid: function () {
			const self = this;
			this._grid.metadata = this._grid.actions._calcRowsMetadata(
				this._grid.settings.indexTreeRows
			);
			return this._grid
				.sort()
				.then(function () {
					return self._grid.expandBranches(self._rowIdsToExpand);
				})
				.catch(function (ex) {
					aras.AlertError(ex.message);
				});
		},

		_removeDescendantRows: function (rows) {
			if (!rows || rows === true) {
				return;
			}

			for (let i = 0; i < rows.length; i++) {
				let gridRowId = rows[i];
				let row = this._grid.rows.get(gridRowId);
				this._removeDescendantRows(row.children);
				delete this._grid.settings.indexTreeRows[gridRowId];
				this._grid.rows.delete(gridRowId);
				this._grid.settings.expanded.delete(gridRowId);
			}
		},

		_expandDescendantRows: function (rows, compressionDicts, levelsToExpand) {
			let row;

			if (levelsToExpand <= 1) {
				return;
			}

			for (let i = 0; i < rows.length; i++) {
				row = rows[i];
				if (row.childRows && row.childRows.length) {
					this._createRowsFromChildRowsToAdd(
						row.gridRowId,
						row.childRows,
						compressionDicts
					);
					this._expandDescendantRows(
						row.childRows || [],
						compressionDicts,
						levelsToExpand - 1
					);
				}
			}
		},

		_attachEventHandlers: function () {
			var self = this;
			var rowClickHandler = function (headId, rowId, event) {
				if (
					!event.target.classList ||
					!event.target.classList.contains('aras-grid-link')
				) {
					return;
				}
				var row = self.getRow(rowId);
				var itemData = row.cells[self.getCellIndex(headId)].link;
				if (!itemData) {
					return;
				}
				self.gridLinkClick(itemData);
			};

			var selectRowHandler = function () {
				self.onSelectRow();
			};
			var onRowContextMenu = function (headId, rowId, e) {
				self._contextMenu.rowId = rowId;
				self.gridMenuInit(rowId, headId);

				self.getMenu().menu.show({
					x: e.clientX,
					y: e.clientY
				});
				e.preventDefault();
			};

			this._grid.on('click', rowClickHandler, 'cell');
			this._grid.on('contextmenu', onRowContextMenu, 'cell');

			var detachMenuClickEventCallback = this._contextMenu.menu.on(
				'click',
				function (command, e) {
					var rowId = self._contextMenu.rowId;

					self._contextMenu.rowId = null;

					if (this.customClickHandler) {
						this.customClickHandler(rowId);
					}

					self.gridMenuClick(command, rowId);
					self._contextMenu.onItemClick(command, rowId);
				}
			);

			this._grid.dom.addEventListener('selectRow', selectRowHandler);

			//note that self._grid.off requires a callback, e.g., rowClickHandler. That's why we must to declare the function such a way.
			this._detachEventHandlers = function () {
				self._grid.off('click', rowClickHandler);
				self._grid.off('contextmenu', onRowContextMenu);
				detachMenuClickEventCallback();
				self._grid.dom.removeEventListener('selectRow', selectRowHandler);
			};
		},

		gridLinkClick: function (itemData) {},

		gridMenuInit: function (rowId, headId) {},

		onSelectRow: function () {},

		gridMenuClick: function (menuItem, rowId) {},

		createHeader: function (headerColumns) {
			var headerColumn;
			var head = this._grid.head;

			for (var i = 0; i < headerColumns.length; i++) {
				headerColumn = headerColumns[i];
				head.set(this.columnNamePrefix + i, {
					label: headerColumn.label,
					width: headerColumn.width,
					resize: true
				});
			}
		},

		addRows: function (
			rows,
			compressionDicts,
			parentId,
			showMoreRowId,
			isToSkipSorting
		) {
			var rowsToAdd = this._createRows(rows, compressionDicts, parentId);
			var parentRow = parentId && this._grid.rows.get(parentId);
			var indexRows = this._grid.settings.indexRows;
			var position;
			if (!showMoreRowId) {
				position = indexRows.indexOf(parentId);
			} else {
				position = indexRows.indexOf(showMoreRowId) - 1;
				this._grid.rows.delete(showMoreRowId);
				if (parentRow) {
					parentRow.children.splice(
						parentRow.children.indexOf(showMoreRowId),
						1
					);
				} else {
					this._grid.roots.splice(this._grid.roots.indexOf(showMoreRowId), 1);
				}
			}

			let firstGridRowId;
			rowsToAdd.forEach(
				function (item, key) {
					if (!parentId) {
						this._grid.roots.push(key);
					} else {
						parentRow.children.push(key);
						this._grid.rows._store.set(key, item);
						position++;
						indexRows.splice(position, 0, key);
					}
					if (!firstGridRowId) {
						firstGridRowId = key;
					}
					this._grid.rows.set(key, item);
				}.bind(this)
			);

			if (showMoreRowId) {
				this.setSelectedFocusedAndScrollToRow(firstGridRowId);
				this.onSelectRow();
			}

			if (parentRow) {
				this._grid.settings.indexTreeRows[parentId] = parentRow.children;
				this._grid.metadata = this._grid.actions._calcRowsMetadata(
					this._grid.settings.indexTreeRows
				);
			}

			if (!isToSkipSorting) {
				this._grid.sort();
			}
		},

		setSelectedFocusedAndScrollToRow: function (gridRowId) {
			this._grid.settings.selectedRows = [gridRowId];
			this._grid.settings.focusedCell = {
				//logic to scroll - set focusedCell
				rowId: gridRowId,
				headId: this.firstColumnName,
				editing: false
			};
		},

		getCellIndex: function (columnName) {
			var indexString = columnName.replace(this.columnNamePrefix, '');
			return parseInt(indexString, 10);
		},

		_createRows: function (rows, compressionDicts, parentId) {
			var rowsToAdd = new Map();
			var rowId;
			var row;
			var rowToAdd;

			for (var i = 0; i < rows.length; i++) {
				row = rows[i];
				rowToAdd = {
					children:
						row.childRows && row.childRows.length ? [] : row.hasChild || false,
					parentKey: parentId
				};
				rowId = (++this._uniqueRowKey).toString();
				row.gridRowId = rowId;
				this.compressionDictionariesByRowId[rowId] = compressionDicts;
				this._rows[rowId] = row;

				for (var j = 0; j < row.cells.length; j++) {
					cell = row.cells[j];
					columnName = this.columnNamePrefix + j;
					rowToAdd[columnName] = cell.value || '';
				}
				rowsToAdd.set(rowId, rowToAdd);
			}
			return rowsToAdd;
		},

		getSelectedItemIDs_Experimental: function () {
			return this._grid.settings.selectedRows[0] || '';
		},

		getAllRowIds: function () {
			return Array.from(this._grid.rows._store.keys());
		},

		getRow: function (rowId) {
			return this._rows[rowId];
		},

		getParentId: function (rowId) {
			return this._grid.rows.get(rowId).parentKey;
		},

		removeAllRows_Experimental: function () {
			this._grid.rows = new Map();
			this._grid.roots = [];
			this._grid.settings.indexRows = [];
			this._grid.settings.selectedRows = [];
			this._grid.settings.expanded = new Set();
			this._grid.roots = [];
			this._prevFocusedCell = null;
		},

		removeOrderBy: function () {
			this._grid.settings.orderBy = [];
		},

		getMenu: function () {
			return this._contextMenu;
		},

		getFocusedCell: function () {
			return this._grid.settings.focusedCell;
		},

		getPrevFocusedCell: function () {
			return this._prevFocusedCell;
		},

		getColumnCount: function () {
			return this._grid.head._store.size;
		},

		getColumnIndex: function (headId) {
			var headers = this._grid.head._store;
			var i = 0;
			var toReturn;
			headers.forEach(function (header, key) {
				if (key === headId) {
					toReturn = i;
				}
				i++;
			});
			return toReturn;
		},

		_getHeadId: function (columnIndex) {
			var headers = this._grid.head._store;
			var i = 0;
			var toReturn;
			headers.forEach(function (header, key) {
				if (i === columnIndex) {
					toReturn = key;
				}
				i++;
			});
			return toReturn;
		},

		getCellValue: function (rowId, columnIndex) {
			var headId = this._getHeadId(columnIndex);
			var row = this._grid.rows.get(rowId);
			return row[headId];
		},

		setCellValue: function (rowId, columnIndex, value) {
			const dataRow = this.getRow(rowId);
			if (
				dataRow &&
				dataRow.cells[columnIndex] &&
				!dataRow.cells[columnIndex].isSetterAllowed
			) {
				throw 'TGV cell value cannot be changed';
			}

			const rows = this._grid.rows;
			const row = rows.get(rowId);
			const headId = this._getHeadId(columnIndex);

			dataRow.cells[columnIndex].value = value;
			row[headId] = value;
			rows.set(rowId, row);
		},

		collapseLevel: function (selectedRowId) {
			var promises = [];
			var treeGrid = this._grid;
			var gridRows = treeGrid.rows;
			var parentRow = gridRows.get(this.getParentId(selectedRowId));
			var arr = (parentRow && parentRow.children) || treeGrid.roots;

			arr.forEach(function (childId) {
				promises.push(treeGrid.collapse(childId));
			});

			return Promise.all(promises);
		},
		destroy: function () {
			this._detachEventHandlers();
			//TODO: destroy should be called. But, we haven't destroy function in menu now.
			//this._contextMenu.menu.destroyRecursive(false);
		}
	});
});
