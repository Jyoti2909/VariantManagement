define([
	'dojo/_base/declare',
	'Aras/Client/Controls/Experimental/DataGrid',
	'Aras/Client/Controls/Experimental/GridModulesWrapper',
	'dojo/data/ItemFileWriteStore',
	'Aras/Client/Controls/Public/CellWrapper',
	'Aras/Client/Controls/Experimental/ContextMenuWrapper'
], function (declare, DataGrid, GridModules, ItemFileWriteStore, Cell) {
	var privateProps = {};

	return declare('Aras.Client.Controls.Public.GridContainerWrapper', null, {
		//don't add property here without "_Experimental" - it will be shown as field in documentation, properties are defined in constructor using defineProperties
		grid_Experimental: null,
		contexMenu_Experimental: null,
		headerContexMenu_Experimental: null,

		constructor: function (args) {
			/// <summary>
			/// Container for grid control.
			/// </summary>

			this.propsId_Experimental =
				args && args.connectId ? args.connectId : 'gridTD';
			var counter = 1;
			while (privateProps[this.propsId_Experimental]) {
				this.propsId_Experimental = args.connectId + counter;
				counter = counter + 1;
			}

			var self = this;
			for (var ar in args) {
				this[ar] = args[ar];
			}

			privateProps[this.propsId_Experimental] = {
				_listsById: [],
				ColumnDraggable: true,
				Editable: false,
				rowHeight: 26,

				_sortManager_Experimental: {
					sortProps: [],
					propertyById: {},
					comparatorMap: {}
				},
				_bgColor_Experimental: null,
				_bgInvert_Experimental: true,
				_borderGColor_Experimental: null,
				_delimeter_Experimental: '$',
				_font_Experimental: null,
				_newRowsCounter: 0,
				_externalCellManagers: {},
				_updateTimer: null
				//don't use "," after the last property all over the file, e.g, here because documentation will not be built
			};

			this.getAllItemIDs = this.getAllItemIds;
			this.getSelectedItemIds = this.getSelectedItemIDs;
			this.getSelectedId = this.getSelectedID;
			this.getXML = this.getXml;

			for (var method in this) {
				if (typeof this[method] === 'function') {
					var methodName = method.substr(0, 1).toUpperCase() + method.substr(1);
					this[methodName] = this[method];
				}
			}

			var store = this._newStore_Experimental();
			var defaultRowHeight = 26;
			var style = (args ? args.style : null) || 'height: 100%;';
			var dataGridOptions = {
				store: store,
				rowHeight: defaultRowHeight,
				columnReordering:
					privateProps[this.propsId_Experimental].ColumnDraggable,
				style: style
			};
			if (args && args.id) {
				dataGridOptions.id = args.id;
			}

			this.connectId_Experimental =
				args && args.connectId ? args.connectId : 'gridTD';
			var gridNode;
			if (args && args.connectNode) {
				gridNode = args.connectNode;
			} else {
				gridNode = document.getElementById(this.connectId_Experimental);
			}
			const freezableColumns = args ? args.freezableColumns : false;
			this._grid = new Grid(gridNode, { freezableColumns: freezableColumns });

			this.grid_Experimental = new DataGrid(dataGridOptions);

			//Create a context menu and bind that to "top" level grid node.
			//This way we may prevent bubbling of oncontextmenu event from lower level parts of grid.
			this.contexMenu_Experimental = new ContextMenuWrapper(document.body);

			this.headerContexMenu_Experimental = new ContextMenuWrapper(
				document.body,
				true
			);

			this.grid_Experimental.headerMenu = this.headerContexMenu_Experimental.menu;

			this.grid_Experimental.startup();
			this.items_Experimental = GridModules.items(this);
			this.columns_Experimental = GridModules.columns(this.grid_Experimental);
			this.inputRow = GridModules.inputRow(this);
			this.edit_Experimental = GridModules.edit(this.grid_Experimental);
			this.selection_Experimental = GridModules.selection(this);
			this.focus_Experimental = GridModules.focus(this.grid_Experimental);
			this.redline_Experimental = GridModules.redline(this);
			this.redline_Experimental.initialize();
			this.grid_Experimental.parentContainer = this;
			this.fileManager = GridModules.fileManager(this);

			//temporary commented out because of dojo.arasContext is undefined
			GridModules.initTextDirection(
				this.grid_Experimental.domNode,
				dojoConfig.arasContext.languageDirection
			);

			// Connect to Grid Events
			var object = this;

			this.grid_Experimental.canEdit = function (inCell, indexRow) {
				if (
					inCell.externalWidget &&
					inCell.externalWidget.functionalFlags.edit
				) {
					return false;
				} else {
					var rowId = object.grid_Experimental.store.getIdentity(
						object.grid_Experimental.getItem(indexRow)
					);
					return object.canEdit_Experimental(rowId, inCell.field);
				}
			};

			this.contexMenu_Experimental.menu.on('click', function (command, e) {
				var rowID = self.contexMenu_Experimental.rowId;
				var columnIndex = self.contexMenu_Experimental.columnIndex;

				self.contexMenu_Experimental.rowId = null;
				self.contexMenu_Experimental.columnIndex = null;

				if (this.customClickHandler) {
					this.customClickHandler(rowId, columnIndex);
				}

				self.gridMenuClick(command, rowID, columnIndex);
				self.contexMenu_Experimental.onItemClick(command, rowID, columnIndex);
			});
			this.headerContexMenu_Experimental.menu.on('click', function (
				command,
				e
			) {
				var rowID = self.headerContexMenu_Experimental.rowId;
				var columnIndex = self.headerContexMenu_Experimental.columnIndex;

				self.headerContexMenu_Experimental.rowId = null;
				self.headerContexMenu_Experimental.columnIndex = null;

				if (this.customClickHandler) {
					this.customClickHandler(rowId, columnIndex);
				}

				self.gridHeaderMenuClick_Experimental(command, rowID, columnIndex);
				self.headerContexMenu_Experimental.onItemClick(
					command,
					rowID,
					columnIndex
				);
			});

			//The 'onHeaderEvent' event handler is needed for binding header context menu after the 'HeaderCellContextMenu' event

			this._grid.on('selectRow', GridModules.events.onSelected.bind(this));
			this._grid.on(
				'contextmenu',
				GridModules.events.onHeaderEvent.bind(this),
				'head'
			);
			this._grid.on(
				'mousedown',
				GridModules.events.onRowClick.bind(this),
				'cell'
			);
			this._grid.on('search', function () {
				doSearch();
				if (window.pagination) {
					pagination.showMoreButton();
				}
			});
			this._grid.on('focusCell', GridModules.events.onStartEdit.bind(this));
			this._grid.on('applyEdit', GridModules.events.onApplyCellEdit.bind(this));

			this._grid.on('cancelEdit', GridModules.events.onCancelEdit.bind(this));

			this.grid_Experimental.onBlur = GridModules.events.onBlur;
			this.grid_Experimental.validateCell = this.validateCell_Experimental;

			//+++ replace standard sorting
			this.grid_Experimental.getSortProps = function () {
				return privateProps[object.propsId_Experimental]
					._sortManager_Experimental.sortProps;
			};

			this.grid_Experimental.setSortIndex = function (columnIndex, asc) {
				var sortManager =
						privateProps[object.propsId_Experimental]._sortManager_Experimental,
					sortProperties = sortManager.sortProps,
					isDefaultPrevented = false,
					i;

				if (columnIndex !== undefined) {
					var sortByDiscending = this.prepareColumnForSort(columnIndex, asc);

					isDefaultPrevented = this.onSort_Dg(
						columnIndex,
						!sortByDiscending,
						sortManager.ctrlKey
					);
				}

				if (sortProperties.length && !isDefaultPrevented) {
					var selectedItems = this.selection.getSelected();

					this.selection.clear();
					this.sort();
					this.update();

					for (i = 0; i < selectedItems.length; i++) {
						this.selection.addToSelection(selectedItems[i]);
					}
				}
			};

			this.grid_Experimental.prepareColumnForSort = function (
				columnIndex,
				asc,
				forceCtrl
			) {
				var sortManager =
						privateProps[object.propsId_Experimental]._sortManager_Experimental,
					sortProperties = sortManager.sortProps,
					i,
					sortByDiscending;
				if (columnIndex !== undefined) {
					var columnId = this.nameColumns[columnIndex];
					var existingProperty = sortManager.propertyById[columnId];
					sortByDiscending =
						asc !== undefined
							? !asc
							: existingProperty
							? !existingProperty.descending
							: false;

					if (!sortProperties.length) {
						sortProperties.push({
							attribute: '_newRowMarker',
							descending: false
						});
						sortProperties.push({ attribute: 'uniqueId', descending: false });
					}

					if (!sortManager.ctrlKey && !forceCtrl) {
						sortProperties.splice(1, sortProperties.length - 2, {
							attribute: columnId,
							descending: sortByDiscending
						});
					} else {
						if (existingProperty) {
							existingProperty.descending = sortByDiscending;
						} else {
							sortProperties.splice(sortProperties.length - 1, 0, {
								attribute: columnId,
								descending: sortByDiscending
							});
						}
					}

					sortManager.propertyById = {};
					for (i = 1; i < sortProperties.length - 1; i++) {
						sortManager.propertyById[sortProperties[i].attribute] =
							sortProperties[i];
					}

					if (!sortManager.comparatorMap[columnId]) {
						sortManager.comparatorMap[columnId] = function (a, b) {
							var r = -1;
							if (a === null) {
								a = undefined;
							}
							if (b === null) {
								b = undefined;
							}
							if (a == b) {
								r = 0;
							} else {
								if (typeof a == 'string') {
									a = a.toUpperCase();
								}
								if (typeof b == 'string') {
									b = b.toUpperCase();
								}
								if (a > b || a === null) {
									r = 1;
								}
							}
							return r; //int {-1,0,1}
						};
					}
				}
				return sortByDiscending;
			};

			this.grid_Experimental.getColumnHeaderHtml = function (
				columnName,
				sortProperty
			) {
				if (/^\s+$/.test(columnName)) {
					columnName = ' ';
				}

				var dojoxGridSortNode = document.createElement('div');
				dojoxGridSortNode.className = 'dojoxGridSortNode';
				if (sortProperty) {
					dojoxGridSortNode.className += !sortProperty.descending
						? ' dojoxGridSortUp'
						: ' dojoxGridSortDown';

					var dojoxGridArrowButtonChar = document.createElement('div');
					dojoxGridArrowButtonChar.className = 'dojoxGridArrowButtonChar';
					dojoxGridArrowButtonChar.textContent = !sortProperty.descending
						? '&#9650;'
						: '&#9660;';

					var dojoxGridColCaption = document.createElement('div');
					dojoxGridColCaption.className = 'dojoxGridColCaption';
					dojoxGridColCaption.textContent = columnName;

					var dojoxGridArrowButtonNode = document.createElement('span');
					dojoxGridArrowButtonNode.className = 'dojoxGridArrowButtonNode';
					dojoxGridArrowButtonNode.setAttribute('role', 'presentation');

					dojoxGridColCaption.appendChild(dojoxGridArrowButtonNode);
					dojoxGridSortNode.appendChild(dojoxGridArrowButtonChar);
					dojoxGridSortNode.appendChild(dojoxGridColCaption);
					return dojoxGridSortNode.outerHTML;
				} else {
					dojoxGridSortNode.textContent = columnName;
					return dojoxGridSortNode.outerHTML;
				}
			};
		},

		// public events
		gridLinkClick: function GridContainerPublicgrid_ExperimentalLinkClick(
			link
		) {
			/// <summary>
			/// Called when any Hyperlink in grid is clicked.
			/// </summary>
			/// <param name="link" type="string"></param>
		},

		gridMenuClick: function GridContainerPublicgrid_ExperimentalMenuClick(
			menuItem,
			rowId,
			columnIndex
		) {
			//TODO: columnIndex parameter doesn't work
			/// <summary>
			/// Occurs when a menu item is clicked.
			/// </summary>
			/// <param name="menuItem" type="string"></param>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
		},

		gridMenuInit: function GridContainerPublicgrid_ExperimentalMenuInit(
			rowId,
			columnIndex
		) {
			//TODO: now always returns true
			/// <summary>
			/// Occurs before menu is shown.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>bool</returns>
			return true;
		},

		gridClick: function GridContainerPublicgrid_ExperimentalClick(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// Occurs when the mouse pointer is over the grid cell and a mouse button is pressed.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
		},

		gridDoubleClick: function GridContainerPublicgrid_ExperimentalDoubleClick(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// Occurs when any item in grid is double clicked.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
		},

		gridKeyPress: function GridContainerPublicgrid_ExperimentalKeyPress(key) {
			//TODO: should return object
			/// <summary>
			/// Occurs when a key is pressed.
			/// </summary>
			/// <param name="key" type="[Object, KeyboardEvent]"></param>
			/// <returns>object</returns>
		},

		gridXmlLoaded: function GridContainerPublicgrid_ExperimentalXmlLoaded() {
			/// <summary>
			/// Occurs when XML content is loaded and parsed.
			/// </summary>
		},

		gridRowSelect: function GridContainerPublicgrid_ExperimentalRowSelect(
			rowId,
			multi
		) {
			//TODO: parameter multi doesn't work
			/// <summary>
			/// Occurs before any row becomes selected.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="multi" type="bool"></param>
		},

		gridEditCell: function GridContainerPublicgrid_ExperimentalEditCell(
			type,
			rowId,
			columnIndex
		) {
			//TODO: should return object
			//TODO: 10 - Tab key pressed, 21 - Enter key pressed (perhaps now user won't click Enter because Enter in .NET finishes editing of cell and start editing of the cell below, but in .js Enter just finishes editing. So we can implement this if it need to change onEnter event in .js)
			/// <summary>
			/// Calls when cell edit state is changed.
			/// </summary>
			/// <param name="type" type="int">
			/// 0 - before the cell is edited;
			/// 1 - the cell value is changed, only for checkboxes
			/// 2 - the cell edit is finished.
			/// </param>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>object</returns>
		},

		gridSelectCell: function GridContainerPublicgrid_ExperimentalSelectCell(
			cell
		) {
			/// <summary>
			/// Occurs when a cell is selected in UI.
			/// </summary>
			/// <param name="cell" type="Aras.Client.Controls.Public.Cell"></param>
		},

		gridSort: function GridContainerPublicgrid_ExperimentalSort(
			columnIndex,
			asc,
			savedOrder
		) {
			/// <summary>
			/// Occurs when column is sorted.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="asc" type="bool"></param>
			/// <param name="savedOrder" type="bool"></param>
		},

		addRow: function GridContainerPublic_addRow() {
			throw new Error('addRow: Not supported function for InfernoGrid.');
		},

		addXMLRows: function GridContainerPublic_addXMLRows() {
			throw new Error('addXMLRows: Not supported function for InfernoGrid.');
		},

		cells: function GridContainerPublic_cells(rowId, columnIndex) {
			//TODO: "Special row ids: "header_row", "input_row"." doesn't work.
			/// <summary>
			/// Get cell object to manipulate directly with its properties. Special row ids: "header_row", "input_row".
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>Aras.Client.Controls.Public.Cell</returns>
			return this.cells_Experimental(rowId, columnIndex, false);
		},

		cells_Experimental: function GridContainerPublic_cells_Experimental(
			rowId,
			columnIndex,
			skipMethodNamingConventionForPerformance
		) {
			var cell = null,
				thatGrid = this._grid;
			const self = this;
			if ('input_row' === rowId) {
				var sBarCellFunc = function () {
					const columnName = self.grid_Experimental.order[columnIndex];
					const internalIndex = thatGrid.settings.indexHead.indexOf(columnName);
					return thatGrid.dom.querySelector(
						'[data-index="' + internalIndex + '"].aras-grid-search-row-cell'
					);
				};
				cell = new Cell(
					this,
					sBarCellFunc,
					null,
					columnIndex,
					this,
					skipMethodNamingConventionForPerformance
				);
				cell.isInputRow_Experimental = true;
			} else {
				var item = this._grid.rows.get(rowId);
				if (item) {
					var cellNodFunc = function () {
						const columnName = self.grid_Experimental.order[columnIndex];
						const headIndex = thatGrid.settings.indexHead.indexOf(columnName);
						const firstVisibleHeadIndex = parseInt(
							thatGrid.dom.querySelector('.aras-grid-head-cell:first-child')
								.dataset.index
						);
						const frozenColumns = thatGrid.settings.frozenColumns;
						const domCellIndex =
							headIndex -
							firstVisibleHeadIndex +
							(frozenColumns && headIndex > frozenColumns ? 0 : 1); // '+ 1' for nth-child
						const rowIndex = thatGrid.settings.indexRows.indexOf(rowId);
						const cellSelector =
							'.aras-grid-row[data-index="' +
							rowIndex +
							'"] .aras-grid-row-cell:nth-child(' +
							domCellIndex +
							')';
						return thatGrid.dom.querySelector(cellSelector);
					};
					cell = new Cell(
						this,
						cellNodFunc,
						item,
						columnIndex,
						this,
						skipMethodNamingConventionForPerformance
					);
					var columnName = this.grid_Experimental.order[columnIndex];
					var columnSortVal = this._grid.head.get(columnName, 'sort');
					if ('DATE' === columnSortVal) {
						cell.sortDate_Experimental = true;
					} else if ('NUMERIC' === columnSortVal) {
						cell.sortNumber_Experimental = true;
					}
				}
			}
			return cell;
		},

		cellIsCheckbox: function GridContainerPublic_cellIsCheckbox(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// Returns true if this cell contains a checkbox.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>bool</returns>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			return cell.isCheckbox();
		},

		cells2: function GridContainerPublic_cells2(rowIdInt, columnIndex) {
			/// <summary>
			/// Get cell object to manipulate directly with its properties.
			/// </summary>
			/// <param name="rowIdInt" type="int"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>Aras.Client.Controls.Public.Cell</returns>
			return this.cells(this.getRowId(rowIdInt), columnIndex);
		},

		selectAll: function GridContainerPublic_selectAll() {
			throw new Error('selectAll: Not supported function for InfernoGrid.');
		},

		cellWasChanged: function GridContainerPublic_cellWasChanged(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// Returns true if cell's value was changed by user during the last editing of this cell, false otherwise.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>bool</returns>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			return cell.wasChanged();
		},

		clear: function GridContainerPublic_clear() {
			//TODO: perhaps we can just remove grid or set style display none.
		},

		copyRowContent: function GridContainerPublic_copyRowContent(fromID, toID) {
			//TODO:
		},

		deleteColumn: function GridContainerPublic_deleteColumn(index) {
			//TODO
		},

		deleteRow: function GridContainerPublic_deleteRow(rowId) {
			/// <summary>
			/// Deletes a row with the specified id.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			this.deleteRow_Experimental(rowId);
		},

		deleteSelectedItem: function GridContainerPublic_deleteSelectedItem() {
			//TODO: "issue focus" - for multiple selection - .js delete all selected, but .net delete only focused.
			/// <summary>
			/// Deletes the selected row.
			/// </summary>
			var ids = this.getSelectedItemIds('|').split('|');
			for (var i = 0; i < ids.length; i++) {
				this.deleteRow_Experimental(ids[i]);
			}
		},

		deselect: function GridContainerPublic_deselect() {
			//TODO: "issue focus" focus isn't lost on .js, but lost on .net
			/// <summary>
			/// Deselect all selected rows.
			/// </summary>
			this.selection_Experimental.clear();
		},

		disableSortingByColumn: function GridContainerPublic_disableSortingByColumn() {
			//TODO: need to validate. It seems that doesn't work in both .NET and .js.
			this.columns_Experimental = -1;
		},

		disable: function GridContainerPublic_disable() {
			/// <summary>
			/// Disables grid
			/// </summary>
			this.grid_Experimental.domNode.style.zIndex = -1;
		},

		editCell: function GridContainerPublic_editCell(rowId, columnIndex) {
			/// <summary>
			/// Move focus to this cell and switch it to the editable mode.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			this.edit_Experimental.set(rowId, columnIndex);
		},

		editCellX: function GridContainerPublic_editCellX(cell) {
			//TODO
		},

		enable: function GridContainerPublic_enable() {
			/// <summary>
			/// Enables grid
			/// </summary>
			this.grid_Experimental.domNode.style.zIndex = '';
		},

		enablePopup: function GridContainerPublic_enablePopup(val) {
			//TODO
			//this realization when setting false makes error on clicking right click on the grid
			//don't know how to make work in .net
			//this.grid_Experimental.contexMenu = val ? new ContextMenu(this.grid_Experimental.grid_Experimental.domNode) : null;
		},

		getAction: function GridContainerPublic_getAction(id) {
			//TODO
		},

		getAllItemIds: function GridContainerPublic_getAllItemIds(separator) {
			/// <summary>
			/// Returns a list of all rows ids separated by the specified separator.
			/// </summary>
			/// <param name="separator" type="string"></param>
			/// <returns>string</returns>
			var arr = this.items_Experimental.getAllId();
			return arr.join(separator || '');
		},

		getCellHeight: function GridContainerPublic_getCellHeight(id, col) {
			//TODO:
			//var cell = this.cells_Experimental(id, col, true);
			//if (!cell._cell) {
			//	return 0;
			//}
			//return cell.cellNod.clientHeight;
		},

		getCellValue: function GridContainerPublic_getCellValue(
			rowId,
			columnIndex
		) {
			/// <summary>
			/// A shortcut to get this cell value.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <returns></returns>
			return this.getCellValue_Experimental(rowId, columnIndex);
		},

		getCellX: function GridContainerPublic_getCellX(id, col) {
			//TODO: see in cell.js. Work validated and it's the same as in cell.js (wrong).
			//var cell = this.cells_Experimental(id, col, true);
			//if (!cell._cell) {
			//	return 0;
			//}
			//var bound = cell.getBounds();
			//return bound.x;
		},

		getCellXY: function GridContainerPublic_getCellXY(id, col) {
			//TODO: see getCellX, not validated
			//var cell = this.cells_Experimental(id, col, true);
			//if (!cell._cell) {
			//	return "0,0";
			//}
			//var bound = cell.getBounds();
			//return bound.x + "," + bound.y;
		},

		getCellY: function GridContainerPublic_getCellY(id, col) {
			//TODO: see getCellX, not validated
			//var cell = this.cells_Experimental(id, col, true);
			//if (!cell._cell) {
			//	return 0;
			//}
			//var bound = cell.getBounds();
			//return bound.y;
		},

		getColumnAt: function GridContainerPublic_getColumnAt(x) {
			//TODO
		},

		getColumnCount: function GridContainerPublic_getColumnCount() {
			/// <summary>
			/// Get column count.
			/// </summary>
			/// <returns>int</returns>
			return this.getColumnCount_Experimental();
		},

		getColumnOrder: function GridContainerPublic_getColumnOrder(columnIndex) {
			/// <summary>
			/// Get this column order.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>int</returns>
			return this.getColumnOrder_Experimental(columnIndex);
		},

		getColWidth: function GridContainerPublic_getColWidth(columnIndex) {
			//TODO: "issue order" - e.g., if it's written in InitXml under tag columns tag column with order = 2, after that column with order = 1 and
			//TODO: try to get value by col (col number), we will recieve results for different columns in .NET and .js.
			/// <summary>
			/// Get this column width.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>int</returns>
			return this.getColWidth_Experimental(columnIndex);
		},

		getColWidths: function GridContainerPublic_getColWidths() {
			/// <summary>
			/// Gets all columns widths divided by ;
			/// </summary>
			/// <returns>string</returns>
			return this.getColWidths_Experimental();
		},

		getCombo: function GridContainerPublic_getCombo() {
			//TODO
		},

		getCurRow: function GridContainerPublic_getCurRow() {
			//TODO: "issue focus" if selected two then .js gets first selected, but .net return focused.
			//different selection models: .net - user selected first row, click shift (but the same beh. with ctrl) and selected second. Focused is first.
			//.js - user selected first row, click shift (but the same beh. with ctrl) and selected second. Focused is the second.
			/// <summary>
			/// Get row number for currently selected row.
			/// </summary>
			/// <returns>int</returns>
			var res = -1,
				selectedId = this.getSelectedId_Experimental();
			if (selectedId) {
				res = this.getRowIndex_Experimental(selectedId);
			}
			return res;
		},

		getHeader: function GridContainerPublic_getHeader() {
			/// <summary>
			/// Not implemented now.
			/// </summary>
			/// <returns>string</returns>
			return '';
		},

		getHeaderCol: function GridContainerPublic_getHeaderCol(columnIndex) {
			//TODO: see "issue order"
			/// <summary>
			/// Returns column header label.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>string</returns>
			var colName = this.grid_Experimental.order[columnIndex];
			return this._grid.head.get(colName, 'label');
		},

		getHeaderIndex: function GridContainerPublic_getHeaderIndex(label) {
			//TODO: see "issue order"
			/// <summary>
			/// For Automation. Gets header index. Returns -1 if no such header
			/// </summary>
			/// <param name="label" type="string"></param>
			/// <returns>int</returns>
			var headers = this.grid_Experimental.layout.cells;
			if (label) {
				for (var i = 0; i < headers.length; i++) {
					if (headers[i].name === label) {
						return i;
					}
				}
			}
			return -1;
		},

		getHorAligns: function GridContainerPublic_getHorAligns() {
			//TODO
		},

		getMenu: function GridContainerPublic_getMenu() {
			//TODO: important, need to implement menuPublic.js?
			/// <summary>
			/// Gets pointer to grid context menu.
			/// </summary>
			/// <returns></returns>
			return this.getMenu_Experimental();
		},

		getRowAt: function GridContainerPublic_getRowAt() {
			//TODO
		},

		getRowsNum: function GridContainerPublic_getRowsNum() {
			/// <summary>
			/// Returns the total number of rows in the table.
			/// </summary>
			/// <returns>int</returns>
			return this.getRowCount();
		},

		getRowCount: function GridContainerPublic_getRowCount() {
			/// <summary>
			/// Gets the number of rows actually contained in the table.
			/// </summary>
			/// <returns>int</returns>
			return this.getRowCount_Experimental();
		},

		getRowId: function GridContainerPublic_getRowId(rowIndex) {
			/// <summary>
			/// Get row ID by row index (zero based, from "top" to "bottom").
			/// </summary>
			/// <param name="rowIndex" type="int"></param>
			/// <returns>string</returns>
			return grid._grid.settings.indexRows[rowIndex] || '';
		},

		getRowIndex: function GridContainerPublic_getRowIndex(rowId) {
			/// <summary>
			/// Returns sequential index of this row.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <returns></returns>
			return this.getRowIndex_Experimental(rowId);
		},

		getSelectedCell: function GridContainerPublic_getSelectedCell() {
			//TODO: "issue order"
			/// <summary>
			/// Returns selected cell
			/// </summary>
			/// <returns>Aras.Client.Controls.Public.Cell</returns>
			const gridSettings = this._grid.settings;
			let focusedCell = gridSettings.focusedCell;
			if (!focusedCell) {
				focusedCell = {
					rowId: window.currSelRowId,
					headId: gridSettings.indexHead[window.currSelCol]
				};
			}
			return this.cells(
				focusedCell.rowId,
				gridSettings.indexHead.indexOf(focusedCell.headId)
			);
		},

		getSelectedID: function GridContainerPublic_getSelectedID() {
			//TODO: "issue focus" when several rows are selected .js get the first selected, but .net get focused.
			/// <summary>
			/// Returns the id of the selected row.
			/// </summary>
			/// <returns>string</returns>
			return this.getSelectedId_Experimental();
		},

		getSelectedItemIDs: function GridContainerPublic_getSelectedItemIDs(
			separator
		) {
			//TODO: order of row Ids in .js and .NET can be different in the results
			/// <summary>
			/// Returns a list of selected rows' ids separated by specified separator.
			/// </summary>
			/// <param name="separator" type="string"></param>
			/// <returns>string</returns>
			return this.getSelectedItemIDs_Experimental(separator);
		},

		getUserControlInfo: function GridContainerPublic_getUserControlInfo() {
			//TODO
		},

		getUserData: function GridContainerPublic_getUserData(rowId, keyOptional) {
			/// <summary>
			/// Get extra row data stored by USERDATAn parameter for this row (or by SetUserData method).
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="keyOptional" type="object">Optional</param>
			/// <returns>string</returns>
			return this.getUserData_Experimental(rowId, keyOptional);
		},

		getUserDataX: function GridContainerPublic_getUserDataX(id, key) {
			//TODO
		},

		getVisibleItemIDs: function GridContainerPublic_getVisibleItemIDs(
			separator
		) {
			/// <summary>
			/// Returns a list of all currently visible rows ids separated by specified separator.
			/// </summary>
			/// <param name="separator" type="string"></param>
			/// <returns>string</returns>
			var arr = [],
				gr = this.grid_Experimental;
			for (var i = 0; i < this.getRowCount(); i++) {
				arr.push(gr.store.getIdentity(gr.getItem(i)));
			}
			return arr.join(separator || '');
		},

		getXml: function GridContainerPublic_getXml(useValues) {
			//TODO: didn't validate every tag. useValues doesn't work
			//TODO: cannot fully validate because getXml of .net doesn't work for my example.
			//TODO: If user call SetEditType we change layout for cell. Perhaps it need to return it in getXml.

			return GridModules.getXML(this, useValues);
		},

		initXMLRows: function GridContainerPublic_initXMLRows() {
			throw new Error('initXMLRows: Not supported function for InfernoGrid.');
		},

		insertRowAt: function GridContainerPublic_insertRowAt(
			index,
			newID,
			text,
			action
		) {
			//TODO
		},

		loadBaselineXml: function GridContainerPublic_loadBaselineXml(init) {
			//don't know how to validate, need to see deeper, perhaps need to see AddColumnToDiffView and simular methods.
			/// <summary>
			/// Load base XML for comparation
			/// </summary>
			/// <param name="init" type="string">init XML for comparation with current grid</param>
			this.loadBaselineXML_Experimental(init);
		},

		addColumnToDiffView: function GridContainerPublic_addColumnToDiffView(
			name
		) {
			//TODO
		},

		addAllColumnsToDiffView: function GridContainerPublic_addAllColumnsToDiffView() {
			/// <summary>
			/// Add all columns to difference list.
			/// Columns in difference list will be checked in redline voew mode.
			/// </summary>
			this.redline_Experimental.addGridColumnsToCompareList();
		},

		removeColumnFromDiffView: function GridContainerPublic_removeColumnFromDiffView(
			name
		) {
			/// <summary>
			/// Remove column from difference list by name.
			/// Columns in difference list will be checked in redline voew mode.
			/// </summary>
			/// <param name="name" type="string">name</param>
			this.redline_Experimental.removeColumnFromCompareList(name);
		},

		removeAllColumnsFromDiffView: function GridContainerPublic_removeAllColumnsFromDiffView() {
			//TODO
		},

		setColumnVisible: function GridContainerPublic_setColumnVisible(
			columnIndex,
			visible,
			columnWidth
		) {
			//TODO: see "issue order"
			/// <summary>
			/// Sets column visible
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="visible" type="bool"></param>
			/// <param name="columnWidth" type="int"></param>
			this.setColumnVisible_Experimental(columnIndex, visible, columnWidth);
		},

		isColumnVisible: function GridContainerPublic_isColumnVisible(columnIndex) {
			//TODO: see "issue order"
			/// <summary>
			/// Gets value that indicates whether the column is visible or hidden.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			return this.isColumnVisible_Experimental(columnIndex);
		},

		setEditable: function GridContainerPublic_setEditable(value) {
			/// <summary>
			/// Enable/Disable cell editing at runtime.
			/// </summary>
			/// <param name="value" type="bool"></param>
			this.setEditable_Experimental(value);
		},

		isEditable: function GridContainerPublic_isEditable() {
			/// <summary>
			/// Returns true if cell editing is enabled.
			/// </summary>
			/// <returns>bool</returns>
			return this._grid.dom.classList.contains('aras-grid_edit-mode');
		},

		isInputRowVisible: function GridContainerPublic_isInputRowVisible() {
			/// <summary>
			/// Returns true when input row is visible
			/// </summary>
			/// <returns>bool</returns>
			return this.isInputRowVisible_Experimental();
		},

		isItemExists: function GridContainerPublic_isItemExists(rowId) {
			/// <summary>
			/// Returns true if the row with specified id exists in the table, otherwise false.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <returns>bool</returns>
			return this.items_Experimental.is(rowId);
		},

		isMultiselect: function GridContainerPublic_isMultiselect() {
			/// <summary>
			/// Returns true if multiselect is enabled.
			/// </summary>
			/// <returns>bool</returns>
			return this.grid_Experimental.get('selectionMode') === 'extended';
		},

		loadCheckboxIcons: function GridContainerPublic_loadCheckboxIcons(
			image0,
			image1
		) {
			//TODO
		},

		loadSortIcons: function GridContainerPublic_loadSortIcons(image0, image1) {
			//TODO
		},

		menu: function GridContainerPublic_menu() {
			/// <summary>
			/// Get popup menu object to manipulate directly with its properties.
			/// </summary>
			/// <returns></returns>
			return this.getMenu();
		},

		menuAdd: function GridContainerPublic_menuAdd(text, image) {
			//TODO: parameter image is not implemented
			//doesn't work in .net, so in .net need to see deeper to compare, but works in the code below
			//we use text as id of menu, but in .Net it's auto-increment number.
			/// <summary>
			/// Adds a ToolStripItem that displays the specified image and text to the collection.
			/// </summary>
			/// <param name="text" type="string"></param>
			/// <param name="image" type="string"></param>
			var menu = this.menu();
			if (menu) {
				menu.add(text, text);
			}
		},

		menuAddSeparator: function GridContainerPublic_menuAddSeparator() {
			/// <summary>
			/// Adds a menu separator. Now adds separator like "-".
			/// </summary>
			var menu = this.menu();
			if (menu) {
				menu.addSeparator();
			}
		},

		menuRemoveAll: function GridContainerPublic_menuRemoveAll() {
			/// <summary>
			/// Removes all MenuItem objects from the menu item collection.
			/// </summary>
			var menu = this.menu();
			if (menu) {
				menu.removeAll();
			}
		},

		menuSetEnabled: function GridContainerPublic_menuSetEnabled(text, flag) {
			//we use text as id of menu, but in .Net it's auto-increment number. So .js has text as first parameter, but .Net has pos (int type)
			/// <summary>
			///  Gets or sets a value indicating whether the menu item is enabled.
			/// </summary>
			/// <param name="text" type="string"></param>
			/// <param name="flag" type="bool"></param>
			var menu = this.menu();
			if (menu) {
				var it = menu.collectionMenu[pos];
				if (it) {
					it.setEnabled(flag);
				}
			}
		},

		moveRowDown: function GridContainerPublic_moveRowDown(rowId) {
			/// <summary>
			/// Moves the specified row down in the table.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			GridModules.moveRowUpDownForPublicGrid(this, rowId, false);
		},

		moveRowUp: function GridContainerPublic_moveRowUp(rowId) {
			/// <summary>
			/// Moves the specified row up in the table.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			GridModules.moveRowUpDownForPublicGrid(this, rowId, true);
		},

		removeAllRows: function GridContainerPublic_removeAllRows() {
			/// <summary>
			/// Remove all rows from grid.
			/// </summary>
			this.removeAllRows_Experimental();
		},

		requestFocus: function GridContainerPublic_requestFocus(columnIndex) {
			/// <summary>
			/// Sets input focus to the control.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			this.requestFocus_Experimental(columnIndex);
		},

		scrollToColumn: function GridContainerPublic_scrollToColumn(index) {
			//TODO
		},

		setAction: function GridContainerPublic_setAction(id, action) {
			//TODO
		},

		setCellCombo: function GridContainerPublic_setCellCombo(
			rowId,
			columnIndex,
			labels,
			values
		) {
			/// <summary>
			/// Set comboBox for specified cell.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="labels"></param>
			/// <param name="values"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setCombo(labels, values);
		},

		setCellFont: function GridContainerPublic_setCellFont(
			rowId,
			columnIndex,
			value
		) {
			/// <summary>
			/// Sets fort for specified cell.
			/// Value is in the following formats:
			/// Name-style-size, style:{bold,italic,bolditalic}
			/// [examples: Courier-bold-12]
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="value" type="string"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setFont(value);
		},

		setCellLink: function GridContainerPublic_setCellLink(
			rowId,
			columnIndex,
			value
		) {
			/// <summary>
			/// Sets link for specified cell.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="value" type="string"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setLink(value);
		},

		setCellTextColor: function GridContainerPublic_setCellTextColor(
			rowId,
			columnIndex,
			value
		) {
			/// <summary>
			/// Sets text color in specified cell.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="value" type="string"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setTextColor(value);
		},

		setRowBgColor: function GridContainerPublic_setRowBgColor(id, val) {
			//TODO
		},

		setCellValue: function GridContainerPublic_setCellValue(
			rowId,
			columnIndex,
			value
		) {
			/// <summary>
			/// A shortcut to set this cell value.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			/// <param name="value" type="string"></param>
			var cell = this.cells_Experimental(rowId, columnIndex, true);
			cell.setValue(value);
		},

		setColumnCount: function GridContainerPublic_setColumnCount(val) {
			//TODO
		},

		getColumnIndex: function GridContainerPublic_getColumnIndex(columnName) {
			//TODO: see "issue order"
			//TODO: "issue colname" it returns column index for .js when colname is not specified. But return -1 in .net.
			/// <summary>
			/// Gets column index by column name.
			/// </summary>
			/// <param name="columnName" type="string"></param>
			/// <returns>
			/// int. Column position in grid; otherwise -1 returned.
			/// </returns>
			var result = this.getColumnIndex_Experimental(columnName);
			//don't use, e.g., if (result) ..., result can be 0 and it's truly value for this case.
			return result !== undefined ? result : -1;
		},

		getColumnName: function GridContainerPublic_getColumnName(columnIndex) {
			//TODO: see "issue order"
			//TODO: "issue colname" it returns column name for .js when colname is not specified. But return undefined in .net.
			/// <summary>
			/// Gets column name by column index.
			/// </summary>
			/// <param name="columnIndex" type="int"></param>
			/// <returns>string</returns>
			return this.grid_Experimental.order[columnIndex] || '';
		},

		getLogicalColumnOrder: function GridContainerPublic_getLogicalColumnOrder() {
			//TODO: "issue colname" it returns column name for .js when colname is not specified. But return undefined in .net.
			/// <summary>
			/// Gets all column names divided by ; and in order they are shown in grid.
			/// </summary>
			/// <returns>string</returns>
			return this.getLogicalColumnOrder_Experimental();
		},

		setColumnOrder: function GridContainerPublic_setColumnOrder(col, newPos) {
			//TODO
		},

		setColumnProperties: function GridContainerPublic_setColumnProperties(
			s,
			columnIndex
		) {
			//TODO: checks only COMBO in string. If true then it sets Combo and listId = 0 always.
			/// <summary>
			/// A comma delimited list of name/value pairs to configures the column by setting its type and other properties.
			/// type={FIELD|COMBO|NOEDIT}, list={integer}, sortable={yes|no}, sorttype={string|numeric|date|ubigint}, inputformat={format_string}, locale={locale_string}
			/// Property name is case sensitive.
			/// Type NOEDIT means this column's cells will be non-editable.
			/// Type FIELD means cells will be editable with input field as edit widget.
			/// Type COMBO means cells will be editable with combobox as edit widget.
			/// For type=COMBO also specify the LISTn property to Initialize combobox.
			/// For type=COMBO also specify the LISTn property to Initialize combobox.
			/// You also can Initialize combobox at runtime using ONEDITCELL event handler.
			/// There is also a possibility to insert checkbox in cell. See TEXTn parameter description.
			/// example 1: type=COMBO,list=1,sortable=no
			/// example 2: sorttype=date, inputformat={dd/MM/yy, hh:mm:ss},locale=enUS
			/// </summary>
			/// <param name="s" type="string"></param>
			/// <param name="columnIndex" type="int"></param>
			this.setColumnProperties_Experimental(s, columnIndex);
		},

		setColWidth: function GridContainerPublic_setColWidth(col, width) {
			//TODO
		},

		setComboList: function GridContainerPublic_setComboList(s, i) {
			//TODO
		},

		setCursor: function GridContainerPublic_setCursor(c) {
			//TODO
		},

		setHeader: function GridContainerPublic_setHeader(value) {
			//TODO
		},

		setHeaderCol: function GridContainerPublic_setHeaderCol(i, val) {
			//TODO
		},

		setHorAligns: function GridContainerPublic_setHorAligns(value) {
			//TODO
		},

		setInitWidths: function GridContainerPublic_setInitWidths(value) {
			//TODO
		},

		setInitWidthsP: function GridContainerPublic_setInitWidthsP(
			widths_in_pixels
		) {
			//TODO
		},

		setMultiselect: function GridContainerPublic_setMultiselect(value) {
			/// <summary>
			/// Enable/Disable multiselect at runtime.
			/// </summary>
			/// <param name="value" type="string"></param>
			this.setMultiselect_Experimental(value);
		},

		setPaintEnabled: function GridContainerPublic_setPaintEnabled(b) {
			//TODO
		},

		setRowTextBold: function GridContainerPublic_setRowTextBold(b) {
			//TODO
		},

		setRowTextNormal: function GridContainerPublic_setRowTextNormal(b) {
			//TODO
		},

		setSelectedRow: function GridContainerPublic_setSelectedRow(
			rowId,
			multi,
			show
		) {
			//TODO: validate parameter show. All rest works.
			/// <summary>
			/// Set selected row at runtime. If multi == false new row becomes the only selected row. If
			/// multi == true new row becomes the selected and all previously selected rows stay selected
			/// also. You should use next trick to Deselect all rows:
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="multi" type="bool"></param>
			/// <param name="show" type="bool">Optional. Scrolls row to visible area if true.</param>
			this.setSelectedRow_Experimental(rowId, multi, show);
		},

		setUserData: function (rowId, keyOrValue, value) {
			/// <summary>
			/// To set row level data. You can use this method to store some extra data or flags.
			/// </summary>
			/// <param name="rowId" type="string"></param>
			/// <param name="keyOrValue" type="string">key is optional, so it can be specified value here</param>
			/// <param name="value" type="string">set if key is passed in keyOrValue, but not value</param>
			this.setUserData_Experimental(rowId, keyOrValue, value);
		},

		setUserDataX: function GridContainerPublic_setUserDataX(id, key, userData) {
			//TODO
		},

		showContent: function GridContainerPublic_showContent() {
			//TODO
		},

		showInputRow: function GridContainerPublic_showInputRow(bool) {
			/// <summary>
			/// Display input row it true; otherwise, input row will be hidden.
			/// </summary>
			/// <param name="bool" type="bool"></param>
			this.showInputRow_Experimental(bool);
		},

		showRow: function GridContainerPublic_showRow(rowID) {
			//TODO
		},

		sort: function GridContainerPublic_sort() {
			this._grid.sort();
		},

		sortEx: function GridContainerPublic_sortEx(col, asc) {
			//TODO
		},

		stretchColumnWidths: function GridContainerPublic_stretchColumnWidths() {
			//TODO
		},

		turnEditOff: function GridContainerPublic_turnEditOff() {
			/// <summary>
			/// Direction to lost focus from grid cell.
			/// </summary>
			this.turnEditOff_Experimental();
		},

		setUserDragData: function GridContainerPublic_setUserDragData(dragData) {
			//TODO
		},

		// experimental events

		onStartEdit_Experimental: function (rowId, column) {
			//Event fired when editing is started for a given grid rowID
			this.gridEditCell(0, rowId, column);
		},

		onApplyEdit_Experimental: function (rowId, column, value) {
			//Event fired when editing is finish for a given grid rowID and value
			var type = 'boolean' === typeof value ? 1 : 2;
			this.gridEditCell(type, rowId, this.getColumnIndex(column));
		},

		onCancelEdit_Experimental: function (rowId) {
			const currentColumnIndex = this._grid.settings.indexHead.indexOf(
				this._grid.settings.focusedCell.headId
			);
			this.gridEditCell(2, rowId, currentColumnIndex);
		},

		canEdit_Experimental: function (rowId, column) {
			//Event fired when check edit cell;
			return this.grid_Experimental._canEdit;
		},

		onStartSearch_Experimental: function (rowId, column) {
			//Event fired when click arrow inputHelper in edit mode cell;
		},

		onInputHelperShow_Experimental: function (rowId, column) {
			//Event fired when click arrow inputHelper in edit mode cell;
		},

		validateCell_Experimental: function (rowId, column, value) {
			//Event fired when start and finish edit cell;
			return true;
		},

		gridHeaderMenuClick_Experimental: function (command, rowID, columnIndex) {
			//This event start when click on header contex menu;
		},

		eventInputRow_Experimental: function (mode, rowID, col) {
			//event run when focus, blur and press key on input row
		},

		// experimental methods
		_newStore_Experimental: function (items) {
			items = items || [];
			var store = new ItemFileWriteStore({
				data: { identifier: 'uniqueId', items: items }
			});
			if (items.uniqueId) {
				this.items_Experimental.onNew(items.uniqueId);
			}
			store.comparatorMap =
				privateProps[
					this.propsId_Experimental
				]._sortManager_Experimental.comparatorMap;
			return store;
		},

		setArrayData_Experimental: function () {
			throw new Error(
				'setArrayData_Experimental: Not supported function for InfernoGrid.'
			);
		},

		_addRowImplementation_Experimental: function () {
			throw new Error(
				'_addRowImplementation_Experimental: Not supported function for InfernoGrid.'
			);
		},

		addXMLRows_Experimental: function () {
			throw new Error(
				'addXMLRows_Experimental: Not supported function for InfernoGrid.'
			);
		},

		loadBaselineXML_Experimental: function (xml) {
			this.redline_Experimental.loadBaselineXML(xml);
		},

		refreshRedlineView_Experimental: function () {
			this.redline_Experimental.refreshRedlineView();
		},

		isRedlineRow_Experimental: function (rowId) {
			return this.redline_Experimental.isDeletedRow(rowId);
		},

		deleteRow_Experimental: function (id) {
			this._grid.rows.delete(id);
		},

		removeSelectedRows_Experimental: function () {
			this.grid_Experimental.removeSelectedRows();
		},

		getCellValue_Experimental: function (id, col) {
			return this.cells_Experimental(id, col, true).getValue();
		},

		getColumnCount_Experimental: function () {
			return this._grid.head._store.size;
		},

		getColumnName_Experimental: function (columnIdx) {
			return this.grid_Experimental.nameColumns[columnIdx];
		},

		getColumnOrder_Experimental: function (col) {
			return col > this.GetColumnCount()
				? -1
				: this.grid_Experimental.order[col];
		},

		getColWidth_Experimental: function (columnIndex) {
			var colName = this.grid_Experimental.order[columnIndex];
			var colWidth = this._grid.head.get(colName, 'width');
			var isColumnVisible = this.isColumnVisible(columnIndex);
			return isColumnVisible ? colWidth : 0;
		},

		getColWidths_Experimental: function () {
			return this.getLogicalColumnOrder_Experimental()
				.split(';')
				.map(
					function (colName) {
						const colWidth = this._grid.head.get(colName, 'width');
						const isColumnVisible = this.isColumnVisible(
							this.grid_Experimental.order.indexOf(colName)
						);
						return isColumnVisible ? colWidth : 0;
					}.bind(this)
				)
				.join(';');
		},

		getLogicalColumnOrder_Experimental: function () {
			const indexHead = this._grid.settings.indexHead;
			let index = 0;
			return this.grid_Experimental.order
				.reduce(
					function (result, value, indexOrder) {
						if (value === indexHead[index]) {
							result.push(value);
							index++;
						} else if (!this.isColumnVisible(indexOrder)) {
							result.push(value);
						}
						if (this.grid_Experimental.order.length - 1 === indexOrder) {
							for (let i = index; i < indexHead.length; i++) {
								result.push(indexHead[i]);
							}
						}
						return result;
					}.bind(this),
					[]
				)
				.join(';');
		},

		getMenu_Experimental: function () {
			return this.contexMenu_Experimental;
		},

		getHeaderMenu_Experimental: function () {
			return this.headerContexMenu_Experimental;
		},

		getRowCount_Experimental: function () {
			return this._grid.settings.indexRows.length;
		},

		getRowIndex_Experimental: function (rowID) {
			return this._grid.settings.indexRows.indexOf(rowID);
		},

		getSelectedId_Experimental: function () {
			return this._grid.settings.selectedRows[0] || '';
		},

		getUserData_Experimental: function (rowId, keyOptional) {
			return GridModules.getUserData_Gm(
				this.grid_Experimental.store,
				rowId,
				keyOptional
			);
		},

		setUserData_Experimental: function (rowId, keyOrValue, value) {
			GridModules.setUserData_Gm(
				this.grid_Experimental.store,
				rowId,
				keyOrValue,
				value
			);
		},

		getSelectedItemIDs_Experimental: function (delim) {
			var result = this._grid.settings.selectedRows.slice();
			return delim ? result.join(delim) : result;
		},

		initXML_Experimental: function () {
			throw new Error(
				'initXML_Experimental: Not supported function for InfernoGrid. Try to use window.cuiGrid'
			);
		},

		initXML: function GridContainerPublic_initXML() {
			throw new Error('initXML: Not supported function for InfernoGrid.');
		},

		initXMLRows_Experimental: function () {
			throw new Error(
				'initXMLRows_Experimental: Not supported function for InfernoGrid. Try to use window.adaptGridRowsFromXml'
			);
		},

		cellFormatHandler_Experimental: function () {
			throw new Error(
				'cellFormatHandler_Experimental: Not supported function for InfernoGrid.'
			);
		},

		isColumnVisible_Experimental: function (col) {
			return (
				this._grid.settings.indexHead.indexOf(
					this.grid_Experimental.order[col]
				) > -1
			);
		},

		isEditable_Experimental: function () {
			return privateProps[this.propsId_Experimental].Editable;
		},

		isInputRowVisible_Experimental: function () {
			return this._grid.view.defaultSettings.search;
		},

		removeAllRows_Experimental: function () {
			this.turnEditOff();
			this._grid.rows = new Map();
			this._grid.settings.indexRows = [];
			this._grid.settings.selectedRows = [];
		},

		requestFocus_Experimental: function (columnIndex) {
			if (!columnIndex) {
				return;
			}

			const headId = this.grid_Experimental.order[columnIndex];
			this._grid.settings.focusedCell = {
				headId: headId,
				rowId: this.getSelectedID() || 'searchRow'
			};
		},

		setColumnProperties_Experimental: function (type, index) {
			this.grid_Experimental.layout.cells[
				this.grid_Experimental.order[index]
			].editableType = type.indexOf('COMBO') > 0 ? 'COMBO:0' : 'FIELD';
		},

		setEditable_Experimental: function (bool) {
			if (this._grid.dom.classList.contains('aras-grid_edit-mode') !== bool) {
				this._grid.settings.indexHead.forEach(
					function (headId) {
						this._grid.head.set(headId, bool, 'editable');
					}.bind(this)
				);
				this._grid.dom.classList.toggle('aras-grid_edit-mode', bool);
			}
		},

		setColumnVisible_Experimental: function (col, bool, width) {
			var field = this.grid_Experimental.order[col];
			var indexHeadIndex = this._grid.settings.indexHead.indexOf(field);
			if (bool && indexHeadIndex === -1) {
				this._grid.head.set(field, width, 'width');
				this._grid.settings.indexHead = this.grid_Experimental.order.filter(
					function (field) {
						return !!this._grid.head.get(field, 'width');
					},
					this
				);
			} else if (!bool && indexHeadIndex > -1) {
				this._grid.settings.indexHead.splice(indexHeadIndex, 1);
				this._grid.head.set(field, 0, 'width');
			}
		},

		setMultiselect_Experimental: function (value) {
			this.selection_Experimental.set('multi', value);
		},

		setNoRowSelect_Experimental: function (value) {
			this.selection_Experimental.set('none', value);
		},

		setSelectedRow_Experimental: function (rowID, multi, show) {
			if (this.getRowIndex(rowID) === -1) {
				return;
			}
			if (multi) {
				if (this._grid.settings.selectedRows.indexOf(rowID) === -1) {
					this._grid.settings.selectedRows.push(rowID);
				}
			} else {
				this._grid.settings.selectedRows = [rowID];
			}
			if (show) {
				this._grid.settings.focusedCell = {
					headId: this._grid.settings.indexHead[0],
					rowId: rowID,
					editing: false
				};
			}
			this._grid.render();
		},

		showInputRow_Experimental: function (bool) {
			if (this._grid.view.defaultSettings.search !== bool) {
				this._grid.view.defaultSettings.search = bool;
				this._grid.render();
			}
		},

		turnEditOff_Experimental: function () {
			const focusedCell = this._grid.settings.focusedCell;
			if (focusedCell && focusedCell.editing) {
				if (focusedCell.valid === false) {
					this._grid.cancelEdit();
				} else {
					this._grid.settings.focusedCell = null;
				}
			}
		},

		destroy_Experimental: function () {
			this.contexMenu_Experimental.menu.destroyRecursive(false);
			this.headerContexMenu_Experimental.menu.destroyRecursive(false);
			this.grid_Experimental.destroyRecursive(false);
			this.grid_Experimental = 'destroyed, please call constructor';
		},

		getColumnIndex_Experimental: function (columnName) {
			return GridModules.GetColumnIndex(this, columnName);
		},

		setColumnTypeManager_Experimental: function (
			columnTypeName,
			managerWidget
		) {
			if (columnTypeName) {
				privateProps[this.propsId_Experimental]._externalCellManagers[
					columnTypeName
				] = managerWidget;
			}
		},

		getListsById_Experimental: function () {
			return privateProps[this.propsId_Experimental]._listsById;
		},

		dropNewRowMarkers: function () {
			var newRowsCount =
				privateProps[this.propsId_Experimental]._newRowsCounter;

			if (newRowsCount) {
				var gridStore = this.grid_Experimental.store,
					storeItem,
					i;

				for (i = 0; i < gridStore._arrayOfTopLevelItems.length; i++) {
					storeItem = gridStore._arrayOfTopLevelItems[i];
					gridStore.setValue(storeItem, '_newRowMarker', 0);
				}

				privateProps[this.propsId_Experimental]._newRowsCounter = 0;
			}
		}
		//don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
