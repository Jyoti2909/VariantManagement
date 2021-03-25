define(['dojo/_base/declare', 'dojo/_base/connect'], function (
	declare,
	connect
) {
	const ATTACHABLE_GRID_EVENT_TYPES = ['onSelectRow'];
	const ATTACHABLE_MAIN_PAGE_EVENT_TYPES = ['onBeforeReload'];

	return declare([], {
		constructor: function (mainPage) {
			Object.defineProperty(this, 'visibleChildrenMaxCount', {
				set: function (visibleChildrenMaxCount) {
					mainPage.visibleChildrenMaxCount = visibleChildrenMaxCount;
				},
				get: function () {
					return mainPage.visibleChildrenMaxCount;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(this, 'parametersProvider', {
				enumerable: true,
				get: function () {
					return {
						getParameters: function () {
							return mainPage._parametersProvider.getParameters();
						},
						setParameter: function (name, value) {
							mainPage._parametersProvider.setParameter(name, value);
						}
					};
				}
			});
			this.toolbar = {
				refresh: function () {
					mainPage._updateToolbarItems();
				}
			};
			this.reload = function () {
				mainPage.reload();
			};

			const removeEventListener = function (listenerHandle) {
				const handlesToLinkedListeners = mainPage._eventHandlers;

				const indexOfHandleToLinkedListener = handlesToLinkedListeners.indexOf(
					listenerHandle
				);
				if (indexOfHandleToLinkedListener !== -1) {
					handlesToLinkedListeners.splice(indexOfHandleToLinkedListener, 1);
					listenerHandle.remove();
				}
			};

			const attachEvent = function (obj, type, listener) {
				const handleToLinkedListener = connect.connect(obj, type, listener);
				mainPage._eventHandlers.push(handleToLinkedListener);

				return handleToLinkedListener;
			};

			this.addPageEventListener = function (type, listener) {
				if (ATTACHABLE_MAIN_PAGE_EVENT_TYPES.indexOf(type) === -1) {
					return;
				}

				return attachEvent(mainPage, type, listener);
			};

			this.removePageEventListener = function (listenerHandle) {
				removeEventListener(listenerHandle);
			};

			this.modifyParameters = function () {
				mainPage._modifyParameters();
			};
			this.getViewDefinitionId = function () {
				return mainPage._treeGridViewDefinitionNode.getAttribute('id');
			};
			this.grid = {
				addEventListener: function (type, listener) {
					if (ATTACHABLE_GRID_EVENT_TYPES.indexOf(type) === -1) {
						return;
					}

					return attachEvent(mainPage._grid, type, listener);
				},
				removeEventListener: function (listenerHandle) {
					removeEventListener(listenerHandle);
				},
				collapseLevel: function () {
					var grid = mainPage._grid;

					grid.collapseLevel(grid.getSelectedItemIDs_Experimental());
				},
				expandAll: function () {
					return mainPage.expandAll();
				}
			};
			this.gridToXml = function () {
				return mainPage._tgvTreeGridToXml.toXml(mainPage._grid);
			};
			this.getGridData = function () {
				var grid = mainPage._grid;
				if (!grid) {
					return {};
				}
				var selectedColIndex;
				var selectedRowId;
				//we need to call getPrevFocusedCell because in time of showing ContextMenu the menu is focused and grid.getFocusedCell() returns null
				var gridFocusedCell =
					grid.getFocusedCell() || grid.getPrevFocusedCell();
				if (gridFocusedCell && gridFocusedCell.headId) {
					selectedColIndex = grid.getColumnIndex(gridFocusedCell.headId);
					selectedRowId = gridFocusedCell.rowId;
				}

				const createRowFromDataRow = function (rowId) {
					const cells = [];
					const colCount = grid.getColumnCount();

					for (let j = 0; j < colCount; j++) {
						const cell = new Cell({
							rowId: rowId,
							columnIndex: j
						});
						cells.push(cell);
					}

					return {
						cells: cells
					};
				};

				const selectedRows = [];
				const focusInfo = [];
				if (selectedRowId && grid.getRow(selectedRowId)) {
					const row = createRowFromDataRow(selectedRowId);
					selectedRows.push(row);

					const focusedCell = row.cells[selectedColIndex];

					if (focusedCell) {
						focusInfo.push({
							//we haven't multiselect now, but, we need this only for a case if several items was selected.
							//cellColumnIndex: selectedColIndex,
							cell: focusedCell,
							row: row
						});
					}
				}

				let gridRows;

				return {
					selection: {
						rows: selectedRows
					},
					focus: focusInfo,
					get rows() {
						if (!gridRows) {
							gridRows = grid.getAllRowIds().map(function (id) {
								return createRowFromDataRow(id);
							});
						}
						return gridRows;
					}
				};
			};
			function Cell(properties) {
				this._rowId = properties.rowId;
				this._columnIndex = properties.columnIndex;
			}
			Cell.prototype = {
				constructor: Cell,

				_rowId: null,

				_columnIndex: null,

				get data() {
					return mainPage._grid.getRow(this.rowId).cells[this.columnIndex].data;
				},

				get rowId() {
					return this._rowId;
				},

				get columnIndex() {
					return this._columnIndex;
				},

				get text() {
					return mainPage._grid.getCellValue(this.rowId, this.columnIndex);
				},

				set text(value) {
					mainPage._grid.setCellValue(this.rowId, this.columnIndex, value);
				}
			};
		}
	});
});
