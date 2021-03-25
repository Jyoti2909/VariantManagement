define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'./ExcelDataGrid',
	'./ContextMenu',
	'./GridModules',
	'dojo/data/ItemFileWriteStore',
	'./TypeEditCell',
	'dojo/aspect',
	'dijit/popup',
	'./ExcelCell',
	'dojo/_base/sniff',
	'./ExcelFocusManager',
	'./ExcelView',
	'./Selector',
	'dojo/dom'
], function (
	declare,
	connect,
	ExcelDataGrid,
	ContextMenu,
	GridModules,
	ItemFileWriteStore,
	TypeEditCell,
	aspect,
	popup,
	ExcelCell,
	has,
	ExcelFocusManager,
	ExcelView,
	Selector,
	domSelect
) {
	return declare('Aras.Client.Controls.Experimental.ExcelGridContainer', null, {
		_editable: false,
		_grid: null,
		_contexMenu: null,
		_connectId: null,
		_items: null,
		_externalCellManagers: {},

		constructor: function (args) {
			var self = this;
			this._connectId = args.connectId;

			this._store = this._newStore();

			// _ViewManager.normalizeRowNodeHeights() method doesn't work if grid.rowHeight is not undefined or 0
			var dataGridOptions = {
				store: this._store,
				rowHeight: 0,
				columnReordering: false,
				style: 'height: 100%;',
				plugins: { selector: true },
				class: 'arasExcelDataGrid',
				validateCell: args.validateCell
			};

			this._grid = new Aras.Client.Controls.Experimental.ExcelDataGrid(
				dataGridOptions
			);
			this._grid.parentContainer = this;
			GridModules.initClearData(this._grid);

			var selector = this._grid.pluginMgr.getPlugin('Selector');
			selector.setupConfig({
				row: 'disabled',
				col: 'disabled',
				cell: 'single'
			});

			//Create a context menu and bind that to top_level grid node.
			//This way we may prevent bubbling of oncontextmenu event from lower level parts of grid.
			this._contexMenu = new ContextMenu(this._grid.domNode);
			connect.connect(this._contexMenu, 'onItemClick', this, function (
				command,
				rowID,
				columnIndex
			) {
				this.gridMenuClick(command, rowID, columnIndex);
			});
			document.getElementById(this._connectId).appendChild(this._grid.domNode);
			this._grid.startup();

			this._items = GridModules.items(this);

			//temporary commented out because of dojo.arasContext is undefined
			GridModules.initTextDirection(
				this._grid.domNode,
				dojoConfig.arasContext.languageDirection
			);

			function editCellAdapter(mode, storeRowIndex, storeCellIndex) {
				var rowId = self._grid.map.getRowIdByStoreRowIndexAndStoreCellIndex(
					storeRowIndex,
					storeCellIndex
				);
				var col = self._grid.map.getColumnIndexByStoreRowIndexAndStoreCellIndex(
					storeRowIndex,
					storeCellIndex
				);
				return self.gridEditCell(mode, rowId, col);
			}

			function selectCellAdapter(type, startPoint, endPoint, selected) {
				var rowId = self._grid.map.getRowIdByStoreRowIndexAndStoreCellIndex(
					startPoint.row,
					startPoint.cell
				);
				var col = self._grid.map.getColumnIndexByStoreRowIndexAndStoreCellIndex(
					startPoint.row,
					startPoint.cell
				);
				var cell = self.cells(rowId, col);
				self.gridSelectCell(cell);
			}

			var eventResize = connect.connect(
				window,
				'onresize',
				this._grid,
				'resize'
			);
			connect.connect(this, 'destroy', function () {
				connect.disconnect(eventResize);
			});

			connect.connect(
				this._grid,
				'onRowContextMenu',
				this,
				this.events.onRowContextMenu
			);
			connect.connect(
				this._grid,
				'gridLinkClick',
				this,
				GridModules.events.gridLinkClick
			);
			connect.connect(this._grid, 'canEditExcel', function (
				inRowIndex,
				inCellIndex
			) {
				return editCellAdapter(0, inRowIndex, inCellIndex);
			});
			connect.connect(this._grid, 'onApplyCellEditExcel', function (
				value,
				inRowIndex,
				inCellIndex
			) {
				editCellAdapter(2, inRowIndex, inCellIndex);
			});
			connect.connect(this._grid, 'onCancelEdit', function (inRowIndex) {
				editCellAdapter(2, this.edit.info.rowIndex, this.edit.info.cellIndex);
			});
			connect.connect(this._grid, 'onEndSelect', function (
				type,
				startPoint,
				endPoint,
				selected
			) {
				selectCellAdapter(type, startPoint, endPoint, selected);
			});
			aspect.before(
				this._grid,
				'dokeydown',
				GridModules.events.dokeydown.bind(this)
			);
			connect.connect(
				this._grid,
				'onInputHelperShow',
				this,
				GridModules.events.onInputHelperShow
			);
			this._grid.onBlur = GridModules.events.onBlur;
			aspect.before(
				this._grid,
				'onBlur',
				function () {
					this.gridBeforeBlur();
				}.bind(this)
			);
			aspect.after(this._grid, 'buildViews', function () {
				//todo: private "_getHeaderContent" method is overwritten here.
				//copy of _getHeaderContent native method
				this.views.views[0]._getHeaderContent = function (inCell) {
					var n = inCell.name || inCell.grid.getCellName(inCell);
					if (/^\s+$/.test(n)) {
						n = '&nbsp;'; //otherwise arrow styles will be messed up
					}
					var ret = ['<div class="dojoxGridSortNode'];
					var propInfo = inCell.index != inCell.grid.getSortIndex();
					if (propInfo) {
						ret.push('">');
					} else {
						ret = ret.concat([
							' ',
							'"><div class="dojoxGridArrowButtonChar">',
							inCell.grid.sortInfo > 0 ? '&#9650;' : '&#9660;',
							'</div>',
							'<div class="dojoxGridColCaption">'
						]);
					}
					ret = ret.concat([n, '</div></div>']);
					return ret.join('');
				};
			});
			this._grid.focus = new ExcelFocusManager(this._grid);

			this._grid._events.onCellClick = function (e) {
				this._click[0] = this._click[1];
				this._click[1] = e;
				var focusRowIndex, focusCellIndex;
				focusRowIndex = this.focus.rowIndex;
				focusCellIndex = this.focus.cellIndex;
				if (!this.edit.isEditCell(e.rowIndex, e.cellIndex)) {
					if (this.edit.isEditing()) {
						this.edit.apply();
					}

					this.focus.setFocusIndex(e.rowIndex, e.cellIndex);
					if (e.rowIndex == focusRowIndex && e.cellIndex == focusCellIndex) {
						this.edit.setEditCellExcel(e.rowIndex, e.cellIndex);
					}
				}
				if (this._click.length > 1 && this._click[0] == null) {
					this._click.shift();
				}
				if (e.target.isCheckBox) {
					var rowId = this.map.getRowIdByStoreRowIndexAndStoreCellIndex(
							e.rowIndex,
							e.cellIndex
						),
						columnIndex = this.map.getColumnIndexByStoreRowIndexAndStoreCellIndex(
							e.rowIndex,
							e.cellIndex
						),
						excelCell = self.cells(rowId, columnIndex),
						value = !excelCell.isChecked();

					excelCell.setChecked(value);
					this.onApplyCellEditExcel(value, e.rowIndex, e.cellIndex);
				}
				this.focus.contentMouseEvent(e);
			};

			this._grid._events.onCellDblClick = function (e) {
				if (this.pluginMgr.isFixedCell(e.cell)) {
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

				this.focus.setFocusIndex(event.rowIndex, event.cellIndex);
				this.edit.setEditCellExcel(event.rowIndex, event.cellIndex);
			};
		},

		_getView: function () {
			return this._grid.views.views[0];
		},

		_getCellNode: function (rowIndex, cellIndex) {
			return this._getView().getCellNode(rowIndex, cellIndex);
		},

		_getCol: function (rowIndex, cellIndex) {
			var cellNode = this._getCellNode(rowIndex, cellIndex);
			var colIndex = cellNode.getAttribute('col');
			return this._grid.layout.cells[colIndex];
		},

		gridEditCell: function (mode, id, col) {},

		gridSelectCell: function (cell) {},

		onInputHelperShow: function (rowId, column) {
			//Event fired when click arrow inputHelper in edit mode cell;
		},

		gridLinkClick: function (link) {
			//event when click on link
		},

		gridMenuClick: function (command, rowID, columnIndex) {
			//This event start when click on contex menu;
		},

		gridMenuInit: function (rowID, columnIndex) {
			//This event start when right click on row;
			return true;
		},

		gridClick: function (rowID, column) {
			//This event start click on row;
		},

		gridDoubleClick: function (rowID) {
			//This event start double click on row;
		},

		gridKeyPress: function (keyEvent) {
			//This event starts when any key pressed in grid
		},

		gridXmlLoaded: function (isSuccess) {
			//This event start after initXML function;
		},

		gridBeforeBlur: function () {
			//Event starts before this._grid.onBlur-event fires
		},

		_newStore: function (items) {
			items = items || [];
			var store = new ItemFileWriteStore({
				data: { identifier: 'uniqueId', items: items }
			});
			aspect.after(
				store,
				'onNew',
				function (item) {
					this._items.onNew(store.getIdentity(item));
				}.bind(this),
				true
			);
			return store;
		},

		_addXMLRows: function (xml, levels) {
			var dom = new XmlDocument(),
				tableNode,
				rootItems;

			dom.loadXML(xml);
			tableNode = dom.selectSingleNode('./table');
			rootItems = tableNode.selectNodes('./Item[not(@pid)]');
			// Save all Item Nodes to grid's store
			this._grid.store.allItemNodes = tableNode.selectNodes('./Item');

			if (rootItems.length) {
				var rowIndex = 0,
					storeRowIndex = 0,
					cellIndex,
					self = this;

				this._grid.map.clear();
				this._grid.beginUpdate();
				dojo.forEach(
					rootItems,
					function (rootItem) {
						function addRowRec(parentItem, rowId, columnIndex, levelIndex) {
							var parentItemId = parentItem.getAttribute('id');
							var properties = parentItem.selectNodes('./prop');
							var rootItemId = rootItem.getAttribute('id');
							for (var j = 0; j < levels[levelIndex]; j++) {
								if (j >= properties.length) {
									parentItem.appendChild(
										parentItem.ownerDocument.createElement('prop')
									);
								}
								self._grid.map.addCell(
									rowIndex,
									columnIndex,
									cellIndex,
									parentItemId
								);
								cellIndex++;
								columnIndex++;
							}

							if (levelIndex + 1 < levels.length) {
								var childItems =
									parentItemId === undefined
										? undefined
										: tableNode.selectNodes(
												'./Item[@pid="' + parentItemId + '"]'
										  );
								if (childItems && childItems.length > 0) {
									for (var i = 0; i < childItems.length; i++) {
										tableNode.removeChild(childItems[i]);
										parentItem.appendChild(childItems[i]);
										if (i !== 0) {
											rowIndex++;
											self._grid.map.addRow(
												rowIndex,
												storeRowIndex,
												rootItemId
											);
											addRowRec(
												childItems[i],
												childItems[i].getAttribute('id'),
												columnIndex,
												levelIndex + 1
											);
										} else {
											addRowRec(
												childItems[i],
												rowId,
												columnIndex,
												levelIndex + 1
											);
										}
									}
								} else {
									var childItem = parentItem.ownerDocument.createElement(
										'Item'
									);
									parentItem.appendChild(childItem);
									addRowRec(childItem, rowId, columnIndex, levelIndex + 1);
								}
							} else {
								self._grid.map.setRowId(rowIndex, rowId);
							}
						}

						cellIndex = 0;
						var rootItemId = rootItem.getAttribute('id');
						self._grid.map.addRow(rowIndex, storeRowIndex, rootItemId);
						addRowRec(rootItem, rootItemId, 0, 0);
						rowIndex++;
						storeRowIndex++;

						var newRow = { uniqueId: rootItemId, rowItemXML: rootItem.xml };

						if (!this._store._getItemByIdentity(newRow.uniqueId)) {
							if (
								typeof this._store._pending._newItems[newRow.uniqueId] !==
								'undefined'
							) {
								delete this._store._pending._newItems[newRow.uniqueId];
								delete this._store._pending._deletedItems[newRow.uniqueId];
								delete this._store._pending._modifiedItems[newRow.uniqueId];
							}
							this._store.newItem(newRow);
						}
					},
					this
				);

				this._grid.store.save();
				this._grid.endUpdate();
			}

			this.gridXmlLoaded(true);
		},

		cells: function (rowId, columnIndex) {
			var cell = null,
				view = this._grid.views.views[0],
				storeRowId = this._grid.map.getStoreRowIdByRowId(rowId),
				item = this._store._getItemByIdentity(storeRowId);

			if (item) {
				var column = this._grid.order
						? this._grid.order[columnIndex]
						: columnIndex,
					storeCellIndex = this._grid.map.getStoreCellIndexByRowIdAndColumnIndex(
						rowId,
						columnIndex
					),
					cellNode = this._getCellNode(
						this._grid.getItemIndex(item),
						storeCellIndex
					),
					columnSortVal = this._grid.layout.cells[column].sort;

				if (cellNode) {
					cell = new ExcelCell(
						this._grid,
						function () {
							return cellNode;
						},
						item,
						column,
						this,
						undefined,
						storeCellIndex
					);
					if ('DATE' === columnSortVal) {
						cell.sortDate_Experimental = true;
					} else if ('NUMERIC' === columnSortVal) {
						cell.sortNumber_Experimental = true;
					}
				}
			}
			return cell;
		},

		cells2: function (rowIndex, columnIndex) {
			// temporary fix, remove this if later.
			if (rowIndex === undefined || columnIndex === undefined) {
				return undefined;
			}
			var rowId = this._grid.map.getRowId(rowIndex);
			return rowId ? this.cells(rowId, columnIndex) : undefined;
		},

		editCellX: function (cell) {
			var rowId, cellIndex, columnIndex, rowIndex, storeRowIndex;
			rowId = cell.getRowId();
			columnIndex = cell.getColumnIndex();
			storeRowIndex = this._grid.map.getStoreRowIndexByRowId(rowId);
			cellIndex = this._grid.map.getStoreCellIndexByRowIdAndColumnIndex(
				rowId,
				columnIndex
			);

			this.setCurCell(rowId, columnIndex);
			this._grid.edit.setEditCellExcel(storeRowIndex, cellIndex);
		},

		updateRow: function (rowId) {
			var storeRowIndex = this._grid.map.getStoreRowIndexByRowId(rowId);
			// used this method, because this._grid.updateRow is related with "updating" flag
			this._grid.views.views[0].updateRow(storeRowIndex);
		},

		clearCurCell: function () {
			this._grid.clearSelection();
		},

		getColumnCount: function () {
			return this._grid.layout.cellCount;
		},

		getColWidth: function (columnIndex) {
			var cell = this._grid.layout.cells[columnIndex];
			return parseInt(cell.unitWidth || cell.width, 10);
		},

		getEditable: function () {
			return this._editable;
		},

		getMenu: function () {
			return this._contexMenu;
		},

		getRowsNum: function () {
			return this._grid.map.getRowCount();
		},

		getRowIndex: function (rowId) {
			return this._grid.map.getRowIndexByRowId(rowId);
		},

		getSelectedId: function () {
			var storeRowIndex;
			var storeCellIndex;
			storeRowIndex = this._grid.focus.rowIndex;
			storeCellIndex = this._grid.focus.cellIndex;
			cellNode = this._getCellNode(storeRowIndex, storeCellIndex);
			if (cellNode) {
				return this._grid.map.getItemIdByStoreRowIndexAndStoreCellIndex(
					storeRowIndex,
					storeCellIndex
				);
			}
			return null;
		},

		getCurCell: function () {
			var storeRowIndex,
				storeCellIndex,
				storeRowId,
				item,
				cellNode,
				columnIndex;

			storeRowIndex = this._grid.focus.rowIndex;
			storeCellIndex = this._grid.focus.cellIndex;
			cellNode = this._getCellNode(storeRowIndex, storeCellIndex);
			if (cellNode) {
				columnIndex = parseInt(cellNode.getAttribute('col'));
				storeRowId = this._grid.map.getStoreRowIdByStoreRowIndex(storeRowIndex);
				item = this._store._getItemByIdentity(storeRowId);

				return new ExcelCell(
					this._grid,
					function () {
						return cellNode;
					},
					item,
					columnIndex,
					this,
					undefined,
					storeCellIndex
				);
			}

			return null;
		},

		setCurCell: function (rowId, columnIndex) {
			var storeRowIndex = this._grid.map.getStoreRowIndexByRowId(rowId),
				cellIndex = this._grid.map.getStoreCellIndexByRowIdAndColumnIndex(
					rowId,
					columnIndex
				);

			this._grid.selectCell(storeRowIndex, columnIndex, cellIndex);
		},

		reloadData: function (xml) {
			this.turnEditOff();
			this.initXML(xml);
		},

		initXML: function (xml) {
			this._grid.order = [];
			var nameColumns = [];
			var i;
			var dom = new XmlDocument();
			dom.loadXML(xml);

			var tableNd = dom.selectSingleNode('./table');
			var thNodes = tableNd.selectNodes('thead/th');
			var columnNodes = tableNd.selectNodes('columns/column');

			this._editable = 'true' == tableNd.getAttribute('editable');
			var levels = [];
			var levelsStrArray = tableNd.getAttribute('levels').split('|');
			for (i = 0; i < levelsStrArray.length; i++) {
				levels[i] = parseInt(levelsStrArray[i], 10);
			}

			var imageStyle =
				'margin-right: 4px; height: auto; width: auto; max-width: 20px; max-height: 20px;';
			var imgLables = [
				"<span style='padding: 0 22px;'>" +
					aras.getResource('', 'itemsgrid.locked_criteria_ppm.clear_criteria') +
					'</span>',
				"<img src='" +
					dojo.baseUrl +
					"../../images/LockedByMe.svg' align='left' style='" +
					imageStyle +
					"' />" +
					aras.getResource('', 'itemsgrid.locked_criteria_ppm.locked_by_me'),
				"<img src='" +
					dojo.baseUrl +
					"../../images/LockedByOthers.svg' align='left' style='" +
					imageStyle +
					"' />" +
					aras.getResource(
						'',
						'itemsgrid.locked_criteria_ppm.locked_by_others'
					),
				"<img src='" +
					dojo.baseUrl +
					"../../images/LockedByAnyone.svg' align='left' style='" +
					imageStyle +
					"' />" +
					aras.getResource('', 'itemsgrid.locked_criteria_ppm.locked_by_anyone')
			];

			var imgValues = [
				'',
				"<img src='" +
					dojo.baseUrl +
					"../../images/LockedByMe.svg' style='" +
					imageStyle +
					"' />",
				"<img src='" +
					dojo.baseUrl +
					"../../images/LockedByOthers.svg' style='" +
					imageStyle +
					"' />",
				"<img src='" +
					dojo.baseUrl +
					"../../images/LockedByAnyone.svg' style='" +
					imageStyle +
					"' />"
			];

			if (thNodes.length == columnNodes.length) {
				var comboReg = /COMBO:(\d*)/;
				var mvListReg = /MV_LIST:(\d*)/;
				var viewObj = {
					type: 'Aras.Client.Controls.Experimental.ExcelView',
					cells: []
				};
				for (i = 0; i < thNodes.length; i++) {
					var currentTh = thNodes[i];
					var currentColumn = columnNodes[i];

					var alignRow = GridModules.getAlign_Gm(
						currentColumn.getAttribute('align')
					);
					var alignHead = GridModules.getAlign_Gm(
						currentTh.getAttribute('align')
					);
					var editable = currentColumn.getAttribute('edit');
					var colWidth = currentColumn.getAttribute('width');
					var inputFormat = currentColumn.getAttribute('inputformat');
					var order = parseInt(currentColumn.getAttribute('order'), 10);
					var dataSourceName = currentColumn.getAttribute('dataSourceName');
					var id = currentColumn.getAttribute('colname') || currentTh.text;
					colWidth += colWidth.indexOf('%') > -1 ? '' : 'px';
					var options = [],
						optionsLables = [],
						editableOption;

					if (comboReg.test(editable) || mvListReg.test(editable)) {
						var idList = comboReg.test(editable)
							? editable.match(comboReg)[1]
							: editable.match(mvListReg)[1];
						var list = dom.selectSingleNode('./table/list[@id=' + idList + ']');
						if (list) {
							editable = comboReg.test(editable)
								? 'FilterComboBox'
								: 'CheckedMultiSelect';
							editableOption = {};
							for (var j = 0; j < list.childNodes.length; j++) {
								var val = list.childNodes[j].getAttribute('value');
								var lab = list.childNodes[j].getAttribute('label');
								optionsLables.push(lab || val);
								options.push(val);
								if (editableOption[val] === undefined) {
									//first value is only taken into account
									editableOption[val] = lab;
								}
							}
						}
					}
					if ('L' == id) {
						options = imgValues;
						optionsLables = imgLables;
						editable = 'dropDownButton';
					}

					var cellClass = editable === 'InputHelper' ? 'InputHelper' : '';

					viewObj.cells[order] = {
						name: '' === currentTh.text ? ' ' : currentTh.text,
						field: id,
						styles: alignRow,
						headerStyles: alignHead,
						cellType: Aras.Client.Controls.Experimental.TypeEditCell,
						options: options,
						formatter: GridModules.formatter,
						optionsLables: optionsLables,
						editable:
							this._editable && currentColumn.getAttribute('edit') !== 'NOEDIT',
						editableType: editable,
						editableOption: editableOption,
						sort: currentColumn.getAttribute('sort'),
						inputformat: inputFormat
							? inputFormat.replace(/tt/g, 'a').replace(/dddd/g, 'EEEE')
							: undefined,
						locale: currentColumn.getAttribute('locale'),
						layoutIndex: i,
						width: colWidth,
						classes: cellClass,
						dataSourceName: dataSourceName,
						externalWidget: this._externalCellManagers[editable] || null,
						_formatNode: function (inDatum, inRowIndex) {
							if (this._formatPending) {
								this._formatPending = false;
								// make cell selectable
								if (!this._stopConstruction) {
									if (!has('ie')) {
										domSelect.setSelectable(this.grid.domNode, true);
									}

									var rowIndex = this.grid.edit.info.rowIndex,
										cellIndex = this.grid.edit.info.cellIndex,
										cellNode = this.view.getCellNode(rowIndex, cellIndex);

									if (cellNode) {
										this.formatNode(cellNode.firstChild, inDatum, inRowIndex);
										this.itemId = this.grid.map.getRowIdByStoreRowIndexAndStoreCellIndex(
											rowIndex,
											cellIndex
										);
									}
								}
							}
						}
					};
					nameColumns[order] = id;
					this._grid.order.push(order);
					if (currentColumn.getAttribute('width') == '0') {
						viewObj.cells[order].hidden = true;
					}
				}

				this.removeAllRows();
				this._grid.nameColumns = nameColumns;
				this._grid.set('structure', viewObj);

				var cells = this._grid.layout.cells,
					gridOrder = this._grid.order,
					cell;
				for (var k = 0; k < cells.length; k++) {
					cell = cells[k];
					cell.layoutIndex = viewObj.cells[k].layoutIndex;
				}

				this._addXMLRows(xml, levels);
			}
		},

		isEditable: function () {
			return this._editable;
		},

		isEditing: function () {
			return this._grid.edit.isEditing();
		},

		removeAllRows: function () {
			this._grid.selection.clear();
			if (this._grid.store) {
				this._grid.setStore();
				this._store = this._newStore();
				this._grid.setStore(this._store);
			}
		},

		requestFocus: function () {
			setTimeout(this.focus.bind(this), 10);
		},

		focus: function () {
			this._grid.focus.focusGrid();
		},

		setEditable: function (bool) {
			if (this._editable != bool) {
				for (var i = 0; i < this._grid.layout.cellCount; i++) {
					this._grid.layout.cells[i].editable =
						bool && this._grid.layout.cells[i].editableType !== 'NOEDIT';
				}
				this._editable = bool;
			}
		},

		setColumnProperty: function (columnIndex, propertyName, propertyValue) {
			if (typeof propertyName == 'string') {
				var layoutCell = this._grid.layout.cells[columnIndex];
				layoutCell[propertyName] = propertyValue;
			}
		},

		turnEditOff: function () {
			var editManager = this._grid.edit;
			if (editManager.isEditing()) {
				if (editManager._isValidInput()) {
					editManager.apply();
				} else {
					editManager.cancel();
				}
			}
		},

		setErrorMessage: function (value) {
			if (this._grid.edit.isEditing()) {
				this._grid.edit.info.cell.widget.invalidMessage = value;
			}
		},

		destroy: function () {
			this._contexMenu.menu.destroyRecursive(false);
			this._grid.destroyRecursive(false);
			this._grid = 'destroyed, please call constructor';
		},

		getColumnIndex: function (columnName) {
			var i;
			for (i = 0; i < this._grid.nameColumns.length; i++) {
				if (columnName === this._grid.nameColumns[i]) {
					return i;
				}
			}
		},

		getItemId: function (rowId, columnIndex) {
			var itemId = this._grid.map.getItemId(rowId, columnIndex);
			return itemId ? itemId : '';
		},

		getParentId: function () {
			var storeRowIndex;
			var storeCellIndex;
			storeRowIndex = this._grid.focus.rowIndex;
			storeCellIndex = this._grid.focus.cellIndex;
			cellNode = this._getCellNode(storeRowIndex, storeCellIndex);
			if (cellNode) {
				return this._grid.map.getParentItemIdByStoreRowIndexAndStoreCellIndex(
					storeRowIndex,
					storeCellIndex
				);
			}
			return null;
		},

		getXML: function () {
			// Get all Item Nodes from grid's store
			const allItemNodes = this._grid.store.allItemNodes;
			let allItemsXMLString = '';

			for (let i = 0; i < allItemNodes.length; i++) {
				// Decode XML string
				allItemsXMLString += ArasModules.xml.unescape(allItemNodes[i].xml);
			}

			return '<Items>' + allItemsXMLString + '</Items>';
		},

		events: {
			onRowContextMenu: function (e) {
				if (this._grid.edit.isEditing()) {
					this._grid.edit.apply();
				}
				//TODO: eliminate this code duplication. Duplicates onHeaderEvent code.
				var isMenuInited = false;
				if (e.cell) {
					var rowIndex = e.rowIndex,
						rowId = this._grid.store.getIdentity(this._grid.getItem(rowIndex)),
						columnIndex = e.cell.layoutIndex;

					isMenuInited = this.gridMenuInit(rowId, columnIndex);
					this._contexMenu.rowId = rowId;
					this._contexMenu.columnIndex = columnIndex;
					this._grid.focus.setFocusIndex(rowIndex, e.cellIndex);
				}

				if (!isMenuInited) {
					e.preventDefault();
					e.stopPropagation();
				}
			}
		},

		setColumnTypeManager_Experimental: function (
			columnTypeName,
			managerWidget
		) {
			if (columnTypeName) {
				this._externalCellManagers[columnTypeName] = managerWidget;
			}
		}
	});
});
