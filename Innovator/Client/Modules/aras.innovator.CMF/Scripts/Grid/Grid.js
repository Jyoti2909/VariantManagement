/* global define, CMF */
define([
	'dgrid/Grid',
	'dstore/Memory',
	'dgrid/OnDemandGrid',
	'dojo/_base/declare',
	'dgrid/Keyboard',
	'dgrid/extensions/ColumnResizer',
	'dgrid/extensions/CompoundColumns',
	'./QpGridExtension',
	'./GridStore',
	'./KeyboardExtention',
	'dijit/popup',
	'./ColumnStore',
	'dojo/keys'
], function (
	Grid,
	Memory,
	OnDemandGrid,
	declare,
	Keyboard,
	ColumnResizer,
	CompoundColumns,
	QpGridExtension,
	GridStore,
	KeyboardExtention,
	popup,
	ColumnStore,
	keys
) {
	var dojoFieldConst = 'field';

	function createStyle() {
		var style = document.createElement('style');
		return document.head.appendChild(style);
	}

	function findChildren(
		columnStore,
		columnGroupHeaders,
		level,
		columnGroupCollection
	) {
		var nextLevel = level + 1;
		var func = function (element) {
			return element.level === nextLevel;
		};
		var filter = function (element) {
			for (var k = 0; k < element.properties.length; k++) {
				if (element.properties[k] === currentProperty) {
					return true;
				}
			}
			return false;
		};
		var filterChild = function (element) {
			return element.field === childrenColumnGroups[m].id;
		};
		for (var i = 0; i < columnGroupHeaders.length; i++) {
			var nextLevelColumnGroups = columnGroupCollection.filter(func);

			if (nextLevelColumnGroups.length > 0) {
				for (var j = 0; j < columnGroupHeaders[i].properties.length; j++) {
					var currentProperty = columnGroupHeaders[i].properties[j];
					var childrenColumnGroups = nextLevelColumnGroups.filter(filter);

					for (var m = 0; m < childrenColumnGroups.length; m++) {
						var existColumnGroups = columnGroupHeaders[i].children.filter(
							filterChild
						);
						if (existColumnGroups.length === 0) {
							var childHeader = {
								field: childrenColumnGroups[m].id,
								label: childrenColumnGroups[m].label,
								sortable: false,
								children: [],
								properties: childrenColumnGroups[m].properties
							};
							columnGroupHeaders[i].children.push(childHeader);
						}
					}
				}
				if (columnGroupHeaders[i].children.length > 0) {
					findChildren(
						columnStore,
						columnGroupHeaders[i].children,
						nextLevel,
						columnGroupCollection
					);
				} else {
					createLowHeader(columnStore, columnGroupHeaders[i]);
				}
			} else {
				createLowHeader(columnStore, columnGroupHeaders[i]);
			}
		}
	}

	function createLowHeader(columnStore, columnGroupHeader) {
		columnGroupHeader.label =
			columnGroupHeader.properties.length > 1 ? columnGroupHeader.label : '';
		for (var k = 0; k < columnGroupHeader.properties.length; k++) {
			var currentItem = columnGroupHeader.properties[k];
			var childProperty = {
				columnName: currentItem.name,
				field: currentItem.id,
				label: currentItem.label,
				sortable: false,
				headerStyle: currentItem.headerStyle,
				contentStyle: currentItem.contentStyle,
				width: columnStore.getColumnWidth(
					currentItem.name,
					currentItem.initialWidth
				),
				dataType: currentItem.dataType,
				editorType: currentItem.editorType,
				editorDataSourceList: currentItem.editorDataSourceList,
				editorDataSourceMethod: currentItem.editorDataSourceMethod,
				editorUseBoth: currentItem.editorUseBoth,
				editorHeader1: currentItem.editorHeader1,
				editorHeader1Width: currentItem.editorHeader1Width,
				editorHeader2: currentItem.editorHeader2,
				editorHeader2Width: currentItem.editorHeader2Width,
				datePattern: currentItem.datePattern,
				binding: currentItem.binding,
				additPropertyId: currentItem.additPropertyId,
				isLowHeader: true
			};
			columnGroupHeader.children.push(childProperty);
		}
	}

	function createHeaders(columnStore, columnGroupCollection) {
		var res = [];
		var level = 2;
		var topColumnGroups = columnGroupCollection.filter(function (element) {
			return element.level === level;
		});

		for (var i = 0; i < topColumnGroups.length; i++) {
			var columnGroupHeader = {
				field: topColumnGroups[i].id,
				label: topColumnGroups[i].label,
				sortable: false,
				children: [],
				properties: topColumnGroups[i].properties,
				display: !topColumnGroups[i].isEmpty
			};
			res.push(columnGroupHeader);
		}
		findChildren(columnStore, res, level, columnGroupCollection);
		return res;
	}

	function escapeRegExp(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function restoreCollpasing(grid) {
		var columnStore = grid._grid.columnStore;
		var collapsedColumnGroups = columnStore.getCollapsedColumnGroups();
		collapsedColumnGroups.forEach(function (columnId) {
			if (!grid.isCollapsed(columnId)) {
				grid.collapseColumnGroup(columnId);
			}
		});
	}

	return declare(null, {
		_grid: null,

		_gridStore: null,

		_connectId: null,

		_collapseStyleSheets: {},

		_collapseEventHandlers: {},

		_cellMenu: null,

		selectedCellId: null,

		_selectedRowId: null,

		dataStore: null,

		_aras: null,

		constructor: function (
			connectId,
			cellMenu,
			headerMenu,
			commonData,
			dataStore,
			defaultHealderStyle,
			defaultColumnGroupsStyle,
			borderColor,
			aras
		) {
			this._connectId = connectId;
			this.dataStore = dataStore;

			this._cellMenu = cellMenu;
			this._headerMenu = headerMenu;
			this._aras = aras;

			this._load(commonData);

			var columnGroup;
			var property;
			var j;
			var contentStyleString;
			var headerStyleString;
			var i;
			var columnGroupStyleString;

			createStyle().sheet.insertRule(
				'#' + this._connectId + ' td { border-color:' + borderColor + ' }',
				0
			);

			createStyle().sheet.insertRule(
				'#' +
					this._connectId +
					' th.lowHeader { ' +
					CMF.Utils.getStyleString(defaultHealderStyle) +
					' }',
				0
			);
			createStyle().sheet.insertRule(
				'#' +
					this._connectId +
					' th.band { ' +
					CMF.Utils.getStyleString(defaultColumnGroupsStyle) +
					' }',
				0
			);

			var topColumnGroups = commonData.columnGroupCollection.filter(function (
				element
			) {
				return element.level === 2;
			});
			for (i = 0; i < topColumnGroups.length; i++) {
				columnGroup = topColumnGroups[i];

				for (j in columnGroup.properties) {
					property = columnGroup.properties[j];

					contentStyleString = CMF.Utils.getStyleString(property.contentStyle);
					if (contentStyleString) {
						createStyle().sheet.insertRule(
							'#' +
								this._connectId +
								' td.' +
								dojoFieldConst +
								'-' +
								property.id +
								' { ' +
								contentStyleString +
								' }',
							0
						);
					}

					headerStyleString = CMF.Utils.getStyleString(property.headerStyle);
					if (headerStyleString) {
						createStyle().sheet.insertRule(
							'#' +
								this._connectId +
								' th.' +
								dojoFieldConst +
								'-' +
								property.id +
								' { ' +
								headerStyleString +
								' }',
							0
						);
					}
				}
			}

			for (i = 0; i < commonData.columnGroupCollection.length; i++) {
				columnGroup = commonData.columnGroupCollection[i];
				columnGroupStyleString = CMF.Utils.getStyleString(
					columnGroup.columnGroupStyle
				);
				if (columnGroupStyleString) {
					createStyle().sheet.insertRule(
						'#' +
							this._connectId +
							' th.' +
							dojoFieldConst +
							'-' +
							columnGroup.id +
							' { ' +
							columnGroupStyleString +
							' }',
						0
					);
				}
			}
		},

		eventBinder: function () {
			//disable browser's menu, e.g., on RMB click.
			this._grid.domNode.addEventListener(
				'contextmenu',
				function (menuEvent) {
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			//Menus
			this._cellMenu._menu.selector = 'td.dgrid-cell';
			this._cellMenu._menu.bindDomNode(this._grid.domNode);

			this._headerMenu._menu.selector = 'th.dgrid-cell';
			this._headerMenu._menu.bindDomNode(this._grid.domNode);

			//Events
			var self = this;

			this._grid.on('td.dgrid-cell:dblclick', function (pointerEvent) {
				var editingCell = self._grid.cell(pointerEvent);
				self._grid.editFocusedCell(editingCell);
			});

			this._grid.on('td.dgrid-cell:dgrid-cellfocusin', function (event) {
				if (event.cell.element.isEmpty) {
					return;
				}
				self.onCellSelected(
					event.cell.row.id,
					event.cell.element.nodeId,
					event.cell.element.cellId
				);
			});

			this._grid.on('click', function () {
				popup.close(self._headerMenu._menu);
				popup.close(self._cellMenu._menu);
			});

			this._grid.on('dgrid-columnresize', function (e) {
				var column = e.grid.columns[e.columnId];
				var columnStore = e.grid.columnStore;
				columnStore.setColumnWidth(column.columnName, e.width);
			});

			this._cellMenu._menu.on('keydown', function (event) {
				// see IR-03693 (if we press esc focus will be lost)
				if (event && event.keyCode === keys.ESCAPE) {
					self.selectCell(self._selectedRowId, self.selectedCellId);
				}
			});
		},

		reload: function (commonData, dataStore) {
			this._grid.cellEditor.hide();
			this.dataStore = dataStore;
			this._load(commonData);
		},

		_load: function (commonData) {
			var columnStore = new ColumnStore(commonData.viewId);
			this.createGridStore(commonData);
			var ComplexGrid = declare([
				OnDemandGrid,
				KeyboardExtention,
				ColumnResizer,
				CompoundColumns,
				QpGridExtension
			]);
			var headers = createHeaders(
				columnStore,
				commonData.columnGroupCollection
			);

			if (this._grid !== null) {
				this._cellMenu._menu.unBindDomNode(this._grid.domNode);
				this._headerMenu._menu.unBindDomNode(this._grid.domNode);

				this._grid.cmfTooltips.destroy();

				var gridContainer = document.createElement('div');
				gridContainer.setAttribute('id', this._connectId);
				this._grid.domNode.parentNode.appendChild(gridContainer);
				this._grid.destroy();
			}

			this._grid = new ComplexGrid(
				{
					columns: headers,
					collection: this._gridStore.getMemStore(),
					qpGrid: this,
					columnStore: columnStore,
					aras: this._aras
				},
				this._connectId
			);

			this._grid.startup();
			this.eventBinder();
			restoreCollpasing(this);
		},

		createGridStore: function (commonData) {
			GridStore.setData(commonData);
			this._gridStore = GridStore;
		},

		collapseColumnGroup: function (columnId) {
			var gridColumn;
			var self = this;
			var handler;

			this._grid.columnStore.collapseColumnGroup(columnId);

			this._collapseStyleSheets[columnId] = [];
			this._collapseEventHandlers[columnId] = [];

			var collapseStyleSheets = this._collapseStyleSheets[columnId];
			var collapseHandlers = this._collapseEventHandlers[columnId];

			function setCollapsed(column) {
				var style = createStyle();
				var styleSheet = style.sheet;

				collapseStyleSheets.push(style);

				styleSheet.insertRule(
					'#' +
						self._connectId +
						' .' +
						dojoFieldConst +
						'-' +
						column.field +
						' { width: 10px;}',
					0
				);

				styleSheet.insertRule(
					'#' +
						self._connectId +
						' td.' +
						dojoFieldConst +
						'-' +
						column.field +
						' span' +
						' { display: none;}',
					0
				);

				styleSheet.insertRule(
					'#' +
						self._connectId +
						' th.' +
						dojoFieldConst +
						'-' +
						column.field +
						' span' +
						' { display: none;}',
					0
				);

				styleSheet.insertRule('div.dijitTooltipFocusNode { padding: 0px;}', 0);

				if (column.parentColumn) {
					styleSheet.insertRule(
						'#' +
							self._connectId +
							' th.' +
							dojoFieldConst +
							'-' +
							column.parentColumn.field +
							' span' +
							' { display: none;}',
						0
					);
				}

				handler = self._grid.on(
					'td.' + dojoFieldConst + '-' + column.field + ':mouseover',
					function (pointerEvent) {
						var editingCell = self._grid.cell(pointerEvent);
						column.type = 'Textarea';
						self._grid.cellEditor.show(editingCell, null, true);
					}
				);
				collapseHandlers.push(handler);

				handler = self._grid.on(
					'td.' + dojoFieldConst + '-' + column.field + ':mouseout',
					function () {
						self._grid.cellEditor.hide();
					}
				);
				collapseHandlers.push(handler);
			}

			for (var i in this._grid.columns) {
				gridColumn = this._grid.columns[i];
				if (
					gridColumn.parentColumn &&
					gridColumn.parentColumn.id === columnId
				) {
					setCollapsed(gridColumn);
					gridColumn.resizable = false;
				}
			}

			this._grid.renderHeader();
			this._grid.resize();
		},

		editFocusedCell: function () {
			var row = this._grid.row(this._selectedRowId);
			var editingCell = this._grid.cellByCellId(row, this.selectedCellId);

			this._grid.editFocusedCell(editingCell);
		},

		expandColumnGroup: function (columnId) {
			var collapseStyleSheets = this._collapseStyleSheets[columnId];
			var collapseHandlers = this._collapseEventHandlers[columnId];
			var column;

			this._grid.columnStore.expandColumnGroup(columnId);

			for (var i = 0; i < collapseStyleSheets.length; i++) {
				document.head.removeChild(collapseStyleSheets[i]);
			}

			for (i = 0; i < collapseHandlers.length; i++) {
				collapseHandlers[i].remove();
			}

			this._collapseStyleSheets[columnId] = undefined;
			this._collapseEventHandlers[columnId] = undefined;

			for (i in this._grid.columns) {
				column = this._grid.columns[i];
				if (column.parentColumn && column.parentColumn.id === columnId) {
					column.resizable = true;
				}
			}

			this._grid.renderHeader();
			this._grid.resize();
		},

		isCollapsed: function (columnId) {
			return (
				this._collapseStyleSheets[columnId] &&
				this._collapseStyleSheets[columnId].length !== 0
			);
		},

		selectCell: function (rowId, cellId, isMultiselect, isToUnselect) {
			this.selectedCellId = cellId;
			this._selectedRowId = rowId;
			this._grid.selectCell(rowId, cellId, isMultiselect, isToUnselect);
		},

		addRow: function (row, sourceId) {
			this._gridStore.addItem(row, sourceId);
		},

		updateRow: function (row) {
			this._gridStore.updateItem(row);
		},

		updateCell: function (row, sourceItemModel) {
			this._grid.updateCell(row, sourceItemModel);
		},

		insertCells: function (updatedRow) {
			this._grid.craftyUpdateRow(updatedRow);
		},

		deleteCells: function (updatedRow) {
			this._grid.craftyUpdateRow(updatedRow);
		},

		redrawRow: function (row) {
			this._grid.craftyUpdateRow(row);
		},

		deleteRow: function (rowId) {
			this._gridStore.deleteItem(rowId);
		},

		getColumnGroupCollection: function () {
			return this._gridStore.getColumnGroupCollection();
		},

		getRowId: function (cellElement) {
			return this._grid.row(cellElement).id;
		},

		openCellMenu: function (target) {
			this._cellMenu.open(target);
		},

		getColumns: function () {
			return this._grid.columns;
		},

		findAll: function (searchExpression, isOnlyToClear) {
			var subRowFieldsToClear =
				this._grid.findObj && this._grid.findObj.subRowFields;
			var isSearchRequired = !isOnlyToClear && searchExpression;
			var i;

			// refresh rows from previous search
			this._grid.findObj = null;

			if (subRowFieldsToClear) {
				var refreshedRows = {};

				for (i = 0; i < subRowFieldsToClear.length; i++) {
					if (!refreshedRows[subRowFieldsToClear[i].rowId]) {
						this._refreshRow(subRowFieldsToClear[i].rowId);

						refreshedRows[subRowFieldsToClear[i].rowId] = true;
					}
				}
			}

			if (isSearchRequired) {
				var storeData = this._gridStore.getMemStore().data;
				var matchResult;
				var isRowRefreshed;
				var row;
				var column;
				var columnId;
				var subRow;
				var subRowField;
				var formattedValue;
				var searchController;
				var j;
				var k;
				var l;

				this._grid.findObj = searchController = {
					regExp: new RegExp(escapeRegExp(searchExpression), 'gi'),
					subRowFields: [],
					foundMatches: [],
					activeIndex: -1,
					currentOffset: null,
					currentRowId: null,
					currentFieldId: null
				};

				for (i = 0; i < storeData.length; i++) {
					row = storeData[i];
					isRowRefreshed = false;

					for (j = 0; j < row.subrs.length; j++) {
						subRow = row.subrs[j];

						for (k = 0; k < this._grid.columnIdsOrdered.length; k++) {
							columnId = this._grid.columnIdsOrdered[k];
							column = this._grid.columns[columnId];
							subRowField = subRow[column.field];

							if (subRowField && subRowField.value) {
								formattedValue = column.formatter
									? column.formatter(subRowField.value)
									: subRowField.value;

								if (formattedValue) {
									matchResult = formattedValue.match(searchController.regExp);

									if (matchResult && matchResult.length) {
										for (l = 0; l < matchResult.length; l++) {
											searchController.foundMatches.push({
												rowFieldIndex: searchController.subRowFields.length,
												matchIndex: l
											});
										}

										searchController.subRowFields.push({
											field: subRowField,
											rowId: row.id,
											formatter: column.formatter
										});

										if (this.isCollapsed(column.parentColumn.id)) {
											this.expandColumnGroup(column.parentColumn.id);
										}

										if (!isRowRefreshed) {
											this.updateRow(row);
											isRowRefreshed = true;
										}
									}
								}
							}
						}
					}
				}

				return searchController.foundMatches.length;
			}

			return 0;
		},

		findNext: function (isUp, targetMatchIndex) {
			var searchController = this._grid.findObj;
			var matchCount = searchController.foundMatches.length;

			if (matchCount && searchController.activeIndex !== targetMatchIndex) {
				var newActiveIndex =
					searchController.activeIndex !== null
						? Math.max(0, Math.min(targetMatchIndex, matchCount))
						: 0;
				var matchInfo = searchController.foundMatches[newActiveIndex];
				var rowField = searchController.subRowFields[matchInfo.rowFieldIndex];
				var formattedValue = rowField.formatter
					? rowField.formatter(rowField.field.value)
					: rowField.field.value;
				var previousRowId = searchController.currentRowId;
				var substringPosition = null;
				var stringMatchIndex = 0;
				var searchResult;

				// finding searchValue position in fieldValue
				searchController.regExp.lastIndex = 0;

				while (
					(searchResult = searchController.regExp.exec(formattedValue)) !== null
				) {
					if (stringMatchIndex == matchInfo.matchIndex) {
						substringPosition = searchResult.index;
						break;
					}

					stringMatchIndex++;
				}

				searchController.activeIndex = newActiveIndex;
				searchController.currentRowId = rowField.rowId;
				searchController.currentFieldId = rowField.field.id;
				searchController.currentOffset = substringPosition;

				// cleanup previously selected match
				if (previousRowId && previousRowId != rowField.rowId) {
					this._refreshRow(previousRowId);
				}

				this._refreshRow(searchController.currentRowId);
				this.onCellSelected(
					rowField.rowId,
					rowField.field.nodeId,
					rowField.field.id
				);
			}
		},

		_refreshRow: function (rowId) {
			var row = this._gridStore.getItem(rowId);
			if (row) {
				this.updateRow(row);
			}
		},

		getCellItem: function (cellId) {
			return this.dataStore.getPropertyElement(cellId);
		},

		isEditMode: function () {
			return window.parent.isEditMode;
		},

		isRowExist: function (id) {
			return this._grid.isRowExist(id);
		},

		//Events
		onCellSelected: function (rowId, nodeId, cellId) {},

		onCellUpdated: function (rowId, nodeId, cellId, value) {}
	});
});
