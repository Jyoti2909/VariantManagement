(function (window, utils, handlersProvider) {
	'use strict';

	const defaultTreeGridSettings = {
		multiSelect: false,
		editable: true
	};

	/**
	 * DynamicTreeGrid class
	 *
	 * @class
	 * @name DynamicTreeGrid
	 * @extends TreeGrid
	 * @param {object} dom - DOM element used as grid container
	 * @param {object} [settings] - grid settings
	 * @param {boolean} [settings.multiSelect] - enable/disable rows multi selecting
	 * @param {boolean} [settings.draggableColumns] - enable/disable columns moving
	 * @param {boolean} [settings.resizable] - enable/disable columns resizing
	 * @param {boolean} [settings.editable] - enable/disable cells editing
	 * @param {boolean} [settings.sortable] - enable/disable columns sorting
	 *
	 * @property {string[]} roots - ids of root rows
	 * @property {object} settings - grid state
	 * @property {string[]} settings.selectedRows - ids of selected rows
	 * @property {Set} settings.expanded - ids of expanded rows
	 * @property {{headId: string, rowId: string, editing: boolean}} settings.focusedCell - focused cell object
	 * @property {{headId: string, desc: boolean}[]} settings.orderBy - sortable heads array
	 */
	function DynamicTreeGrid(dom, settings) {
		this.treeGrid = new TreeGrid(
			dom,
			Object.assign({}, defaultTreeGridSettings, settings)
		);
		this.initialize();
	}

	DynamicTreeGrid.prototype = {
		constructor: DynamicTreeGrid,

		_uniqueId: -1,

		get _uniqueRowId() {
			let newId;

			do {
				newId = ++this._uniqueId + '';
			} while (this.containsRow(newId));

			return newId;
		},

		set head(value) {
			this.treeGrid.head = value;
		},
		get head() {
			return this.treeGrid.head;
		},

		set rows(value) {
			this.treeGrid.rows = value;
		},
		get rows() {
			return this.treeGrid.rows;
		},

		set roots(value) {
			this.treeGrid.roots = value;
		},
		get roots() {
			return this.treeGrid.roots;
		},

		get settings() {
			return this.treeGrid.settings;
		},
		get view() {
			return this.treeGrid.view;
		},

		on: function (type, callback, element) {
			this.treeGrid.on.call(this.treeGrid, type, callback, element);
		},
		off: function (type, callback) {
			this.treeGrid.off.call(this.treeGrid, type, callback);
		},
		render: function () {
			return this.treeGrid.render();
		},

		/**
		 * The first initialization of DynamicTreeGrid.
		 * Initialize head, rows, roots properties and extend tree grid handlers.
		 *
		 * @protected
		 */
		initialize: function () {
			this._columnsMap = new Map();
			this._rowsMap = new Map();
			this.head = this._columnsMap;
			this.rows = this._rowsMap;
			this.roots = [];
			this.treeGrid.actions.dynamicTreeGridHandlers = handlersProvider.getHandlers();

			this.treeGrid.actions.dynamicTreeGridHandlers.forEach(
				function (handlerInfo) {
					const useCapture = handlerInfo.type === 'before';
					handlerInfo.target = useCapture
						? this.treeGrid.dom.parentElement
						: this.treeGrid.dom;
					handlerInfo.handler = handlerInfo.handler.bind(this);
					handlerInfo.target.addEventListener(
						handlerInfo.action,
						handlerInfo.handler,
						useCapture
					);
				}.bind(this)
			);

			const treeGridExtendFunctions = {
				getCellMetadata: this.getCellMetadata,
				getCellType: this.getCellType,
				checkEditAvailability: this.checkEditAvailability,
				getEditorType: this.getEditorType
			};

			Object.keys(treeGridExtendFunctions).forEach(
				function (functionName) {
					this.treeGrid[functionName] = treeGridExtendFunctions[
						functionName
					].bind(this);
				}.bind(this)
			);
		},

		/**
		 * Handler which obtains row ID for the given row object when adding a new row.
		 * By default returns null to generate row ID automatically.
		 *
		 * @public
		 * @param   {object} rowObject - incoming row object
		 * @param   {string} parentId - parent row id (null if root)
		 * @returns {?string} - row id
		 */
		obtainRowId: function (rowObject, parentId) {
			return null;
		},

		/**
		 * Method that initializes grid with data
		 * If columns parameter is not specified, columns will be obtained from the row objects -
		 * each unique property will be considered as column name
		 *
		 * @public
		 * @param   {object[]} [rows] - Array containing objects with information about rows
		 * @param   {object[]} [columns] - Array containing objects with information about columns
		 * @returns {string[]} - Array containing ids of the added rows
		 */
		loadData: function (rows, columns) {
			if (!Array.isArray(columns)) {
				columns = [];
				const properties = new Set();

				if (Array.isArray(rows)) {
					rows.forEach(function (row) {
						Object.keys(row).forEach(function (property) {
							properties.add(property);
						});
					});
				}

				properties.forEach(function (property) {
					columns.push({
						name: property
					});
				});
			}

			this.removeAllRows();
			this._columnsMap.clear();
			this.settings.indexHead = [];
			this.settings.orderBy = [];

			columns.forEach(this.addColumn.bind(this));
			return this.addRows(rows);
		},

		/**
		 * Method which adds new column to the columns collection.
		 *
		 * @public
		 * @param {object} column - object with information about column
		 * @param {string} column.name - column name
		 * @param {string} [column.label] - column label
		 * @param {number} [column.width] - column width
		 * @param {object} [column.metadata] - column metadata
		 * @param {object} [column.settings] - column settings
		 * @param {boolean} [column.settings.editable] - are column cells editable by default
		 * @param {boolean} [column.settings.resizable] - is column resizable
		 * @param {boolean} [column.settings.sortable] - is column sortable
		 * @param {boolean} [column.settings.visible=true] - is column visible
		 * @param {number} [position] - column index
		 */
		addColumn: function (column, position) {
			const columnName = column.name;
			const columnLabel = column.label || columnName;
			let columnWidth;

			if (Number.isInteger(column.width)) {
				columnWidth = column.width;
			} else {
				const labelMargin = 10;
				columnWidth =
					utils.measureTextWidth(columnLabel, this.treeGrid.dom) + labelMargin;
			}

			const columnSettings = column.settings;
			const getSettingValueOrDefault = function (propertyName, defaultValue) {
				return columnSettings && utils.isBoolean(columnSettings[propertyName])
					? columnSettings[propertyName]
					: defaultValue;
			};

			const columnObject = {
				label: columnLabel,
				width: columnWidth,
				metadata: column.metadata || null,
				resizable: getSettingValueOrDefault(
					'resizable',
					this.view.defaultSettings.resizable
				),
				settings: {
					visible: getSettingValueOrDefault('visible', true),
					editable: getSettingValueOrDefault(
						'editable',
						this.view.defaultSettings.editable
					),
					sortable: getSettingValueOrDefault(
						'sortable',
						this.view.defaultSettings.sortable
					)
				}
			};

			this._columnsMap.set(columnName, columnObject);

			if (columnObject.settings.visible) {
				const maxIndex = this.settings.indexHead.length;
				position = Number.isInteger(position)
					? Math.min(maxIndex, Math.max(position, 0))
					: maxIndex;
				this.settings.indexHead.splice(position, 0, columnName);
			}

			const isColumnEditable = columnObject.settings.editable;
			this._rowsMap.forEach(function (treeGridRow) {
				treeGridRow.dynamicTreeGridRowData.cells.set(columnName, {
					editable: isColumnEditable,
					metadata: null
				});
			});

			this.render();

			utils.dispatchEvent(this.treeGrid.dom, 'addColumn', {
				columnName: columnName
			});
		},

		/**
		 * Method which adds rows to the tree grid
		 *
		 * @public
		 * @param {object[]} rows - Array contains objects with information about rows
		 * @param {string} [parentId] - parent row id. Specify null or undefined to add rows as roots
		 * @param {number} [childInsertionIndex] - index relative to the parent row for inserting new rows
		 * @param {boolean} [doRender=true] - should render grid after adding new rows or not
		 * @returns {string[]} - Array containing ids of the added rows
		 */
		addRows: function (rows, parentId, childInsertionIndex, doRender) {
			if (!Array.isArray(rows)) {
				return [];
			}

			const rowIds = this._addRows(rows, parentId, childInsertionIndex);
			const branchMetadata = this.treeGrid.actions._calcRowsMetadata(
				this.settings.indexTreeRows,
				parentId
			);
			Object.assign(this.treeGrid.metadata, branchMetadata);

			if (doRender || !utils.isBoolean(doRender)) {
				this.render();
			}

			utils.dispatchEvent(this.treeGrid.dom, 'addRows', {
				rowIds: rowIds.slice(),
				parentId: parentId || null
			});

			return rowIds;
		},

		/**
		 * Private method which adds rows to the tree grid
		 *
		 * @private
		 * @param {object[]} rows - Array contains objects with information about rows
		 * @param {string} [parentId] - parent row id. Specify null or undefined to add rows as roots
		 * @param {number} [childInsertionIndex] - index relative to the parent row for inserting new rows
		 * @returns {string[]} - Array containing ids of the added rows
		 */
		_addRows: function (rows, parentId, childInsertionIndex) {
			const newRowIds = [];
			let currentLevelRowIds;
			let isNewRowVisible = false;
			let rowInsertionIndex = 0;

			if (!parentId) {
				currentLevelRowIds = this.settings.indexTreeRows.roots;
				isNewRowVisible = true;
				parentId = null;
			} else {
				if (!this.containsRow(parentId)) {
					const errorMessage =
						'Parent row with id "' + parentId + '" is not found.';
					throw new Error(errorMessage);
				}

				if (!Array.isArray(this.settings.indexTreeRows[parentId])) {
					this.settings.indexTreeRows[parentId] = [];
				}

				currentLevelRowIds = this.settings.indexTreeRows[parentId];
				const parentIndex = this.getRowIndex(parentId);
				isNewRowVisible = parentIndex !== -1 && this.isRowExpanded(parentId);
				rowInsertionIndex = parentIndex + 1;
			}

			const maxIndex = currentLevelRowIds.length;
			childInsertionIndex = Number.isInteger(childInsertionIndex)
				? Math.min(maxIndex, Math.max(childInsertionIndex, 0))
				: maxIndex;

			if (isNewRowVisible) {
				let previousVisibleChildRowsCount = childInsertionIndex;

				for (let i = 0; i < childInsertionIndex; i++) {
					let childRowId = currentLevelRowIds[i];
					previousVisibleChildRowsCount += this._getVisibleDescendantsCountRecursively(
						childRowId
					);
				}

				rowInsertionIndex += previousVisibleChildRowsCount;
			}

			const populateRowObject = function (treeGridRow) {
				const userRowObject = treeGridRow.dynamicTreeGridRowData.rowInfo;
				const cells = treeGridRow.dynamicTreeGridRowData.cells;

				this._columnsMap.forEach(function (column, columnName) {
					if (userRowObject.hasOwnProperty(columnName)) {
						treeGridRow[columnName] = userRowObject[columnName];
					}
					cells.set(columnName, {
						editable: column.settings.editable,
						metadata: null
					});
				});
			}.bind(this);

			const rowsLength = rows.length;

			for (let i = 0; i < rowsLength; i++) {
				const userRowObject = rows[i];
				let rowId = this.obtainRowId(userRowObject, parentId);
				let errorMessage;

				if (!rowId) {
					rowId = this._uniqueRowId;
				} else if (!utils.isString(rowId) || rowId === '') {
					errorMessage =
						'Row id must be non empty string. Obtained row id: ' + rowId;
				} else if (this.containsRow(rowId)) {
					errorMessage = 'Row with id "' + rowId + '" already exists.';
				}

				if (errorMessage) {
					throw new Error(errorMessage);
				}

				const treeGridRow = {
					dynamicTreeGridRowData: {
						parentId: parentId,
						cells: new Map(),
						rowInfo: userRowObject
					}
				};

				populateRowObject(treeGridRow);
				this._rowsMap.set(rowId, treeGridRow);

				currentLevelRowIds.splice(childInsertionIndex, 0, rowId);
				childInsertionIndex++;

				if (isNewRowVisible) {
					this.settings.indexRows.splice(rowInsertionIndex, 0, rowId);
					rowInsertionIndex++;
				}

				newRowIds.push(rowId);

				utils.dispatchEvent(this.treeGrid.dom, 'addRow', {
					rowId: rowId,
					parentId: parentId
				});
			}

			if (parentId !== null) {
				const parentRow = this._rowsMap.get(parentId);
				parentRow.children = currentLevelRowIds.slice();
			}

			return newRowIds;
		},

		/**
		 * Method which removes all grid rows
		 *
		 * @public
		 */
		removeAllRows: function () {
			const rowIds = [];

			this._rowsMap.forEach(function (treeGridRow, rowId) {
				rowIds.push(rowId);
			});

			this.treeGrid.cancelEdit();
			this.settings.focusedCell = null;
			this._rowsMap.clear();
			this.settings.expanded.clear();
			this.settings.selectedRows = [];
			this.rows = this._rowsMap;
			this.roots = [];
			this.metadata = this.treeGrid.actions._calcRowsMetadata(
				this.settings.indexTreeRows
			);

			utils.dispatchEvent(this.treeGrid.dom, 'removeAllRows', {
				rowIds: rowIds
			});
		},

		/**
		 * Method that checks whether grid contains specified row in the rows collection
		 *
		 * @public
		 * @param   {string} rowId - row id
		 * @returns {boolean} - is row present in the rows collection or not
		 */
		containsRow: function (rowId) {
			return this._rowsMap.has(rowId);
		},

		/**
		 * Method that checks whether grid contains specified column in the columns collection
		 *
		 * @public
		 * @param   {string} columnName - column name
		 * @returns {boolean} - is column present in the columns collection or not
		 */
		containsColumn: function (columnName) {
			return this._columnsMap.has(columnName);
		},

		/**
		 * Method which gets value of the specified cell
		 *
		 * @public
		 * @param   {string} rowId - row id
		 * @param   {string} columnName - column name
		 * @returns {*} - cell value
		 */
		getCellValue: function (rowId, columnName) {
			return this.rows.get(rowId, columnName);
		},

		/**
		 * Method which sets value for the specified cell
		 *
		 * @public
		 * @param {string} rowId - row id
		 * @param {string} columnName - column name
		 * @param {*} value - cell value
		 */
		setCellValue: function (rowId, columnName, value) {
			if (this.containsColumn(columnName)) {
				const row = this._rowsMap.get(rowId);
				if (row) {
					row[columnName] = value;
					this._updateUserRowObject(row, columnName, value);
					this.render();
				}
			}
		},

		/**
		 * Private method which updates user's object model when cell value is changed
		 *
		 * @private
		 * @param {object} row - tree grid row object
		 * @param {string} columnName - column name
		 * @param {*} value - cell value
		 */
		_updateUserRowObject: function (row, columnName, value) {
			row.dynamicTreeGridRowData.rowInfo[columnName] = value;
		},

		/**
		 * Method that checks whether specified row is expanded
		 *
		 * @public
		 * @param   {string} rowId - row id
		 * @returns {boolean} - is row expanded
		 */
		isRowExpanded: function (rowId) {
			return this.settings.expanded.has(rowId);
		},

		/**
		 * Method that checks whether specified row is visible
		 *
		 * @public
		 * @param   {string} rowId - row id
		 * @returns {boolean} - is row visible
		 */
		isRowVisible: function (rowId) {
			return this.getRowIndex(rowId) !== -1;
		},

		/**
		 * Private method that checks whether specified row is expanded and visible
		 *
		 * @private
		 * @param   {string} rowId - row id
		 * @returns {boolean} - is row expanded and visible
		 */
		_isRowExpandedAndVisible: function (rowId) {
			return this.isRowExpanded(rowId) && this.isRowVisible(rowId);
		},

		/**
		 * Private method which get visible descendants count for the specified row
		 *
		 * @private
		 * @param   {string} parentId - parent row id
		 * @returns {number} - visible descendants count
		 */
		_getVisibleDescendantsCountRecursively: function (parentId) {
			let count = 0;

			if (this._isRowExpandedAndVisible(parentId)) {
				const children = this._getChildRowIds(parentId);
				const childrenCount = children.length;
				count += childrenCount;

				for (let i = 0; i < childrenCount; i++) {
					const childRowId = children[i];
					count += this._getVisibleDescendantsCountRecursively(childRowId);
				}
			}

			return count;
		},

		/**
		 * Method which expands all tree grid rows at all levels
		 *
		 * @public
		 */
		expandAll: function () {
			const expanded = this.settings.expanded;
			const indexTreeRows = this.settings.indexTreeRows;
			const indexRows = [];

			const populateIndexRowsAndExpandedSet = function (parentId) {
				indexTreeRows[parentId].forEach(function (rowId) {
					indexRows.push(rowId);
					if (indexTreeRows[rowId]) {
						expanded.add(rowId);
						populateIndexRowsAndExpandedSet(rowId);
					}
				});
			};
			populateIndexRowsAndExpandedSet('roots');

			this.settings.indexRows = indexRows;
			this.render();
		},

		/**
		 * Method which collapses all tree grid rows at all levels
		 *
		 * @public
		 */
		collapseAll: function () {
			this.settings.expanded.clear();
			this.settings.indexRows = this.settings.indexTreeRows.roots.slice();
			this.render();
		},

		/**
		 * Method which gets column visibility
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @returns {(boolean|undefined)} - is column visible or not
		 */
		getColumnVisibility: function (columnName) {
			const column = this._columnsMap.get(columnName);
			if (column) {
				return column.settings.visible;
			}
		},

		/**
		 * Method which sets column visibility
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @param {boolean} [visible=true] - should column be visible or not
		 */
		setColumnVisibility: function (columnName, visible) {
			if (!utils.isBoolean(visible)) {
				visible = true;
			}

			const columnObject = this._columnsMap.get(columnName);
			if (columnObject && columnObject.settings.visible !== visible) {
				columnObject.settings.visible = visible;

				if (visible) {
					this.settings.indexHead.push(columnName);
				} else {
					const focusedCell = this.settings.focusedCell;
					if (focusedCell && focusedCell.headId === columnName) {
						this.treeGrid.cancelEdit();
						this.settings.focusedCell = null;
					}
					utils.removeArrayElementByValue(this.settings.indexHead, columnName);
					this._removeColumnSortOrder(columnName);
				}

				this.render();
			}
		},

		/**
		 * Method which removes column from the columns collection
		 *
		 * @public
		 * @param {string} columnName - column name
		 */
		removeColumn: function (columnName) {
			if (!this.containsColumn(columnName)) {
				return;
			}

			this._rowsMap.forEach(function (treeGridRow) {
				treeGridRow.dynamicTreeGridRowData.cells.delete(columnName);
			});

			const focusedCell = this.settings.focusedCell;
			if (focusedCell && focusedCell.headId === columnName) {
				this.treeGrid.cancelEdit();
				this.settings.focusedCell = null;
			}

			utils.removeArrayElementByValue(this.settings.indexHead, columnName);
			this._columnsMap.delete(columnName);
			this._removeColumnSortOrder(columnName);
			this.render();

			utils.dispatchEvent(this.treeGrid.dom, 'removeColumn', {
				columnName: columnName
			});
		},

		/**
		 * Method which moves column to specified position
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @param {number} [newColumnIndex] - new column index
		 */
		moveColumn: function (columnName, newColumnIndex) {
			if (!this.getColumnVisibility(columnName)) {
				return;
			}

			const maxIndex = this.settings.indexHead.length - 1;
			newColumnIndex = Number.isInteger(newColumnIndex)
				? Math.min(maxIndex, Math.max(newColumnIndex, 0))
				: maxIndex;

			utils.removeArrayElementByValue(this.settings.indexHead, columnName);
			this.settings.indexHead.splice(newColumnIndex, 0, columnName);

			this.render();
		},

		/**
		 * Method which removes specified column from the sort order array
		 *
		 * @private
		 * @param {string} columnName - column name
		 */
		_removeColumnSortOrder: function (columnName) {
			const orderBy = this.settings.orderBy;

			for (let i = orderBy.length - 1; i >= 0; i--) {
				const orderByInfo = orderBy[i];
				if (orderByInfo.headId === columnName) {
					orderBy.splice(i, 1);
				}
			}

			this.settings.orderBy = orderBy;
		},

		/**
		 * Method which sets column settings for the specified column
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @param {object} settings - column settings
		 * @param {boolean} [settings.editable] - are column cells editable by default
		 * @param {boolean} [settings.resizable] - is column resizable
		 * @param {boolean} [settings.sortable] - is column sortable
		 * @param {boolean} [settings.visible] - is column visible
		 */
		setColumnSettings: function (columnName, settings) {
			const column = this._columnsMap.get(columnName);
			if (!column || !settings) {
				return;
			}

			const applySetting = function (key) {
				const value = settings[key];
				if (!utils.isBoolean(value)) {
					return;
				}

				if (key !== 'resizable') {
					column.settings[key] = value;
				}

				switch (key) {
					case 'sortable':
						if (!value) {
							this._removeColumnSortOrder(columnName);
						}
						break;
					case 'resizable':
						column.resizable = value;
						break;
					case 'visible':
						this.setColumnVisibility(columnName, value);
						break;
				}
			}.bind(this);

			const availableColumnSettings = [
				'editable',
				'sortable',
				'resizable',
				'visible'
			];
			availableColumnSettings.forEach(applySetting);
			this.render();
		},

		/**
		 * Method which gets settings for the specified column
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @returns {object|undefined} - column settings
		 */
		getColumnSettings: function (columnName) {
			const column = this._columnsMap.get(columnName);
			if (column) {
				return Object.assign({ resizable: column.resizable }, column.settings);
			}
		},

		/**
		 * Method which sets metadata for the specified column
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @param {?object} metadata - column metadata
		 */
		setColumnMetadata: function (columnName, metadata) {
			const column = this._columnsMap.get(columnName);
			if (column) {
				column.metadata = metadata;
			}
		},

		/**
		 * Method which gets metadata for the specified column
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @returns {?object} - column metadata
		 */
		getColumnMetadata: function (columnName) {
			const column = this._columnsMap.get(columnName);
			if (column) {
				return column.metadata;
			}
		},

		/**
		 * Method which sets label for the specified column
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @param {string} label - column label
		 */
		setColumnLabel: function (columnName, label) {
			if (!utils.isString(label)) {
				return;
			}

			const column = this._columnsMap.get(columnName);
			if (column) {
				column.label = label;

				if (column.settings.visible) {
					this.render();
				}
			}
		},

		/**
		 * Method which gets label for the specified column
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @returns {string|undefined} - column label
		 */
		getColumnLabel: function (columnName) {
			const column = this._columnsMap.get(columnName);
			if (column) {
				return column.label;
			}
		},

		/**
		 * Method which sets width for the specified column
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @param {(number|string)} width - column width
		 */
		setColumnWidth: function (columnName, width) {
			const column = this._columnsMap.get(columnName);
			if (!column) {
				return;
			}
			if (utils.isString(width)) {
				width = parseInt(width, 10);
			}
			if (Number.isInteger(width)) {
				column.width = width;

				if (column.settings.visible) {
					this.render();
				}
			}
		},

		/**
		 * Method which gets width for the specified column
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @returns {(number|undefined)} - column width
		 */
		getColumnWidth: function (columnName) {
			const column = this._columnsMap.get(columnName);
			if (column) {
				return column.width;
			}
		},

		/**
		 * Method which gets column index by the column name
		 *
		 * @public
		 * @param {string} columnName - column name
		 * @returns {number} - column index
		 */
		getColumnIndex: function (columnName) {
			return this.settings.indexHead.indexOf(columnName);
		},

		/**
		 * Method which gets column name by the column index
		 *
		 * @public
		 * @param {number} columnIndex - column index
		 * @returns {(string|undefined)} - column name
		 */
		getColumnName: function (columnIndex) {
			return this.settings.indexHead[columnIndex];
		},

		/**
		 * Method which gets count of all columns
		 *
		 * @public
		 * @returns {number} - count of all columns
		 */
		getColumnCount: function () {
			return this._columnsMap.size;
		},

		/**
		 * Method which gets count of visible columns
		 *
		 * @public
		 * @returns {number} - count of visible columns
		 */
		getVisibleColumnCount: function () {
			return this.settings.indexHead.length;
		},

		/**
		 * Method which gets visible column names in their display order
		 *
		 * @public
		 * @returns {string[]} - Array containing visible column names in their display order
		 */
		getColumnOrder: function () {
			return this.settings.indexHead.slice();
		},

		/**
		 * Method which gets all column names
		 *
		 * @public
		 * @returns {string[]} - Array with all column names
		 */
		getAllColumnNames: function () {
			const columnNames = [];

			this._columnsMap.forEach(function (column, columnName) {
				columnNames.push(columnName);
			});

			return columnNames;
		},

		/**
		 * Method which gets count of the visible rows
		 *
		 * @public
		 * @returns {number} - count of the visible grid rows
		 */
		getVisibleRowCount: function () {
			return this.settings.indexRows.length;
		},

		/**
		 * Method which gets visible row ids in their display order
		 *
		 * @public
		 * @returns {string[]} - Array with visible row ids
		 */
		getVisibleRowIds: function () {
			return this.settings.indexRows.slice();
		},

		/**
		 * Method which gets count of the all grid rows
		 *
		 * @public
		 * @returns {number} - count of the all grid rows
		 */
		getAllRowCount: function () {
			return this._rowsMap.size;
		},

		/**
		 * Method which gets all row ids in their display order
		 *
		 * @public
		 * @returns {string[]} - Array with all row ids
		 */
		getAllRowIds: function () {
			const rowIds = [];
			const indexTreeRows = this.settings.indexTreeRows;

			const getAllRowIdsRecursively = function (parentId) {
				indexTreeRows[parentId].forEach(function (rowId) {
					rowIds.push(rowId);
					if (indexTreeRows[rowId]) {
						getAllRowIdsRecursively(rowId);
					}
				});
			};
			getAllRowIdsRecursively('roots');

			return rowIds;
		},

		/**
		 * Method which gets child row ids in their display order for the specified parent row
		 * Return empty array if parent row has no children
		 * Return root row ids if parentId is null or undefined
		 *
		 * @public
		 * @param {(string|null|undefined)} parentId - parent row id
		 * @returns {string[]} - Array with child row ids
		 */
		getChildRowIds: function (parentId) {
			return this._getChildRowIds(parentId).slice();
		},

		/**
		 * Private method which gets child row ids in their display order for the specified parent row
		 * Return empty array if parent row has no children
		 * Return root row ids if parentId is null or undefined
		 *
		 * @private
		 * @param {(string|null|undefined)} parentId - parent row id
		 * @returns {string[]} - Array with child row ids
		 */
		_getChildRowIds: function (parentId) {
			if (!parentId) {
				return this.settings.indexTreeRows.roots;
			}
			return this.settings.indexTreeRows[parentId] || [];
		},

		/**
		 * Method which gets row index by the row id
		 *
		 * @public
		 * @param {string} rowId - row id
		 * @returns {number} - row index
		 */
		getRowIndex: function (rowId) {
			return this.settings.indexRows.indexOf(rowId);
		},

		/**
		 * Method which gets row id by the row index
		 *
		 * @public
		 * @param {number} rowIndex - row index
		 * @returns {(string|undefined)} - row id
		 */
		getRowId: function (rowIndex) {
			return this.settings.indexRows[rowIndex];
		},

		/**
		 * Method which removes specified row and its descendants
		 *
		 * @public
		 * @param {string} rowId - row id
		 */
		removeRow: function (rowId) {
			if (!this.containsRow(rowId)) {
				return;
			}

			const rowIdsToDelete = [];
			let visibleRowsCount = 0;

			const getRowsToDeleteRecursively = function (
				parentId,
				isParentExpandedAndVisible
			) {
				rowIdsToDelete.push(parentId);
				const children = this._getChildRowIds(parentId);
				const childrenCount = children.length;

				if (isParentExpandedAndVisible) {
					visibleRowsCount += childrenCount;
				}

				for (let i = 0; i < childrenCount; i++) {
					const childRowId = children[i];
					const isChildExpandedAndVisible = isParentExpandedAndVisible
						? this._isRowExpandedAndVisible(childRowId)
						: false;
					getRowsToDeleteRecursively(childRowId, isChildExpandedAndVisible);
				}
			}.bind(this);

			const rowIndex = this.getRowIndex(rowId);
			const isRowVisible = rowIndex !== -1;
			getRowsToDeleteRecursively(
				rowId,
				isRowVisible && this.isRowExpanded(rowId)
			);

			if (isRowVisible) {
				visibleRowsCount++;
				this.settings.indexRows.splice(rowIndex, visibleRowsCount);
			}

			const focusedCell = this.settings.focusedCell;
			if (focusedCell && rowIdsToDelete.indexOf(focusedCell.rowId) !== -1) {
				this.treeGrid.cancelEdit();
				this.settings.focusedCell = null;
			}

			const parentId = this.getParentId(rowId);
			if (parentId === null) {
				utils.removeArrayElementByValue(
					this.settings.indexTreeRows.roots,
					rowId
				);
			} else {
				const parentRow = this._rowsMap.get(parentId);
				utils.removeArrayElementByValue(parentRow.children, rowId);
				utils.removeArrayElementByValue(
					this.settings.indexTreeRows[parentId],
					rowId
				);
			}

			rowIdsToDelete.forEach(
				function (rowIdToDelete) {
					utils.removeArrayElementByValue(
						this.settings.selectedRows,
						rowIdToDelete
					);
					this.settings.expanded.delete(rowIdToDelete);
					this._rowsMap.delete(rowIdToDelete);

					if (this.settings.indexTreeRows.hasOwnProperty(rowIdToDelete)) {
						delete this.settings.indexTreeRows[rowIdToDelete];
					}
				}.bind(this)
			);

			this.metadata = this.treeGrid.actions._calcRowsMetadata(
				this.settings.indexTreeRows
			);
			this.render();

			utils.dispatchEvent(this.treeGrid.dom, 'removeRow', {
				rowIds: rowIdsToDelete,
				parentId: parentId
			});
		},

		/**
		 * Method which gets parent row id for the specified row
		 * Returns null if parent row is root
		 * Returns undefined if specified row does not exist
		 *
		 * @public
		 * @param {string} rowId - row id
		 * @returns {(string|null|undefined)} - parent id
		 */
		getParentId: function (rowId) {
			const row = this._rowsMap.get(rowId);
			if (row) {
				return row.dynamicTreeGridRowData.parentId;
			}
		},

		/**
		 * Method which sets editable setting for the specified cell
		 *
		 * @public
		 * @param {string} rowId - row id
		 * @param {string} columnName - column name
		 * @param {boolean} [editable=true] - cell editable setting
		 */
		setCellEditability: function (rowId, columnName, editable) {
			const cell = this._getCellInfo(rowId, columnName);
			if (cell) {
				cell.editable = utils.isBoolean(editable) ? editable : true;
			}
		},

		/**
		 * Method which gets editable setting for the specified cell
		 *
		 * @public
		 * @param {string} rowId - row id
		 * @param {string} columnName - column name
		 * @returns {(boolean|undefined)} - cell editable setting
		 */
		getCellEditability: function (rowId, columnName) {
			const cell = this._getCellInfo(rowId, columnName);
			if (cell) {
				return cell.editable;
			}
		},

		/**
		 * Method which deselects row by the specified row id
		 *
		 * @public
		 * @param {string} rowId - row id
		 */
		deselectRow: function (rowId) {
			const index = this.settings.selectedRows.indexOf(rowId);
			if (index !== -1) {
				this.settings.selectedRows.splice(index, 1);
				this.render();
			}
		},

		/**
		 * Method which selects row by the specified row id
		 * If grid's "multiSelect" setting is set to false, specified row becomes the only selected row
		 * Otherwise specified row becomes selected and all previously selected rows stay selected
		 *
		 * @public
		 * @param {string} rowId - row id
		 */
		selectRow: function (rowId) {
			if (
				!this.containsRow(rowId) ||
				this.settings.selectedRows.indexOf(rowId) !== -1
			) {
				return;
			}

			if (!this.view.defaultSettings.multiSelect) {
				this.settings.selectedRows = [];
			}

			this.settings.selectedRows.push(rowId);
			this.render();
		},

		/**
		 * Method which gets user data by the specified row and key
		 *
		 * @public
		 * @param   {string} rowId - row id
		 * @param   {*} key - user data key
		 * @returns {*} - user data value
		 */
		getRowUserData: function (rowId, key) {
			const row = this._rowsMap.get(rowId);
			if (row && row.dynamicTreeGridRowData.userData) {
				return row.dynamicTreeGridRowData.userData.get(key);
			}
		},

		/**
		 * Method which sets user data for the specified row and key
		 *
		 * @public
		 * @param {string} rowId - row id
		 * @param {*} key - user data key
		 * @param {*} value - user data value
		 */
		setRowUserData: function (rowId, key, value) {
			const row = this._rowsMap.get(rowId);
			if (row) {
				if (!row.dynamicTreeGridRowData.userData) {
					row.dynamicTreeGridRowData.userData = new Map();
				}

				row.dynamicTreeGridRowData.userData.set(key, value);
			}
		},

		/**
		 * Method which sets cell metadata for the specified cell
		 *
		 * @public
		 * @param {string} rowId - row id
		 * @param {string} columnName - column name
		 * @param {?object} metadata - cell metadata
		 */
		setCellMetadata: function (rowId, columnName, metadata) {
			const cell = this._getCellInfo(rowId, columnName);
			if (cell) {
				cell.metadata = metadata;
			}
		},

		/**
		 * Handler which gets cell metadata for the specified cell.
		 * Handler returns column metadata if specified cell does not have its own metadata.
		 *
		 * @public
		 * @param   {string} columnName - column name
		 * @param   {string} rowId - row id
		 * @param   {string} type - cell type calculated by grid
		 * @returns {?object} - metadata object for editors or formatters
		 */
		getCellMetadata: function (columnName, rowId, type) {
			return (
				this.getCellMetadataOnly(rowId, columnName) ||
				this.getColumnMetadata(columnName)
			);
		},

		/**
		 * Method which gets only cell metadata for the specified cell.
		 * This method does not take into account column metadata.
		 *
		 * @public
		 * @param   {string} rowId - row id
		 * @param   {string} columnName - column name
		 * @returns {?object} - cell metadata
		 */
		getCellMetadataOnly: function (rowId, columnName) {
			const cell = this._getCellInfo(rowId, columnName);
			if (cell) {
				return cell.metadata;
			}
		},

		/**
		 * Private method which gets object with information about cell metadata and editable setting
		 *
		 * @private
		 * @param   {string} rowId - row id
		 * @param   {string} columnName - column name
		 * @returns {({editable: boolean, metadata: ?object}|undefined)} - cell object
		 */
		_getCellInfo: function (rowId, columnName) {
			const row = this._rowsMap.get(rowId);
			if (row) {
				return row.dynamicTreeGridRowData.cells.get(columnName);
			}
		},

		/**
		 * Handler which gets cell type to call specific formatter
		 *
		 * @public
		 * @param   {string} columnName - column name
		 * @param   {string} rowId - row id
		 * @param   {*} value - cell value
		 * @param   {string} type - type calculated by grid
		 * @returns {string} - cell type (formatter name)
		 */
		getCellType: function (columnName, rowId, value, type) {
			const metadata = this.getCellMetadata(columnName, rowId, type);
			return (metadata && metadata.formatter) || type;
		},

		/**
		 * Handler which gets editor type to call specific editor
		 *
		 * @public
		 * @param   {string} columnName - column name
		 * @param   {string} rowId - row id
		 * @param   {*} value - cell value
		 * @param   {string} type - type calculated by grid
		 * @returns {string} - editor name
		 */
		getEditorType: function (columnName, rowId, value, type) {
			const metadata = this.getCellMetadata(columnName, rowId, type);
			return (metadata && metadata.editor) || type;
		},

		/**
		 * Handler which checks cell edit availability
		 *
		 * @public
		 * @param   {string} columnName - column name
		 * @param   {string} rowId - row id
		 * @param   {DynamicTreeGrid} grid - grid instance
		 * @returns {boolean} - can a cell be edited or not
		 */
		checkEditAvailability: function (columnName, rowId, grid) {
			return (
				this.view.defaultSettings.editable &&
				this.getCellEditability(rowId, columnName)
			);
		}
	};
	window.DynamicTreeGrid = DynamicTreeGrid;
})(window, window.DynamicTreeGridUtils, window.DynamicTreeGridActions);
