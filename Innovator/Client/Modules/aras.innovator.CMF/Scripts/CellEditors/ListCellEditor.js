/* global define */
define([
	'dojo/dom-geometry',
	'dojo/dom-style',
	'dijit/Viewport',
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	'dgrid/Grid',
	'dgrid/extensions/ColumnResizer',
	'dgrid/Keyboard',
	'dgrid/Selection',
	'CMF/Scripts/PublicApi/PropertyItem',
	'CMF/Scripts/PublicApi/Element'
], function (
	domGeometry,
	domStyle,
	Viewport,
	declare,
	TooltipDialog,
	on,
	keys,
	CellEditorBase,
	Grid,
	ColumnResizer,
	Keyboard,
	Selection,
	PropertyItem,
	Element
) {
	var inputId = 'listCellEditorInput';
	var aras = parent.aras;
	var valueToReturn;

	return declare(CellEditorBase, {
		show: function (cell, onCellEditorClosed, isViewMode) {
			if (this.tooltipDialog) {
				//in IE 11 if to open popup and its scroller appears
				//(not enough space to show it, then scroller will not be hidden until user will close the page, not the tooltip)
				//it's a workaround to get rid of this for large by Y editors
				this.tooltipDialog.destroy();
			}
			this.tooltipDialog = new TooltipDialog({ id: 'listCellEditor' });

			//TODO: make Grid selectable by arrows, fix events
			var methodName = cell.column.editorDataSourceMethod;
			var dataSourceReturn;
			var i;
			var header1Field;
			var header2Field;
			var header1DataValue;
			var header2DataValue;
			var dataFromList;
			var listValues;
			var data;
			var gridWidth;
			var extraColumnWidth;
			var defaultColumnWidth;
			var column;
			var columns;
			var grid;
			var rowsElements;
			var cellValue;
			var row;
			var cellElementToFocus;
			var self;

			if (methodName) {
				var dataStore = cell.column.grid.qpGrid.dataStore;
				var tableItem = dataStore.getPropertyElement(cell.element.cellId);
				var treeItem = dataStore.getDocElement(tableItem.treeItemId);
				var element = new Element(treeItem, dataStore);
				var propertyItem = new PropertyItem(tableItem, element);
				dataSourceReturn = aras.evalMethod(methodName, '', {
					propertyItem: propertyItem
				});
				header1Field = dataSourceReturn.columns[0].field;
			} else {
				header1Field = aras.generateNewGUID();
				header2Field = aras.generateNewGUID();

				dataSourceReturn = {
					columns: [
						{
							field: header1Field,
							label: cell.column.editorHeader1,
							width:
								cell.column.editorHeader1Width &&
								parseInt(cell.column.editorHeader1Width, 10)
						},
						{
							field: header2Field,
							label: cell.column.editorHeader2,
							width:
								cell.column.editorHeader2Width &&
								parseInt(cell.column.editorHeader2Width, 10)
						}
					],
					data: []
				};

				listValues = aras.getListValues(cell.column.editorDataSourceList);
				for (i = 0; i < listValues.length; i++) {
					header1DataValue = aras.getItemProperty(listValues[i], 'value');
					header2DataValue = aras.getItemProperty(listValues[i], 'label');
					dataFromList = {};
					dataFromList[header1Field] = header1DataValue;
					dataFromList[header2Field] = header2DataValue;
					dataSourceReturn.data.push(dataFromList);
				}
			}

			data = dataSourceReturn.data;
			gridWidth = 0;
			//grid has some additional width because of, e.g., borders. So we need to add some extra pixels to sum of widths of the columns.
			//So, the width of columns will be changed - a bit bigger then it was specified (sideeffect)
			extraColumnWidth = 0;
			defaultColumnWidth = 120;
			columns = [];

			for (i = 0; i < dataSourceReturn.columns.length; i++) {
				//take only required values from columns - not to expand all dojo API (perhaps in future there will be no dojo Dgrid here)
				column = {
					field: dataSourceReturn.columns[i].field,
					label: dataSourceReturn.columns[i].label,
					width: dataSourceReturn.columns[i].width || defaultColumnWidth,
					resizable: false,
					sortable: false
				};
				gridWidth += column.width + extraColumnWidth;
				columns.push(column);
			}

			gridWidth++;

			window.listCellEditorNamespace = {
				//ColumnResizer is required to support width property of columns array.
				CustomGrid: declare([Grid, Selection, Keyboard, ColumnResizer]),
				columns: columns
			};

			this.tooltipDialog.set(
				'content',
				"<span style='float: right; color: #3668b1; font-family: Tahoma,​Arial,​Helvetica,​sans-serif; " +
					"font-size: 12px; margin-bottom: 4px; margin-right: 4px; text-decoration: underline' onclick='window.listCellEditorNamespace.onSelectedValue()'>" +
					aras.getResource('', 'common.clear') +
					'</span>' +
					"<div style='clear: right; width: " +
					gridWidth +
					"px; height: auto;' data-dojo-id='listCellEditorNamespace.grid' data-dojo-type='listCellEditorNamespace.CustomGrid' id='" +
					inputId +
					"' data-dojo-props='columns: window.listCellEditorNamespace.columns, selectionMode: \"single\"' />"
			);

			grid = window.listCellEditorNamespace.grid;

			this.inherited(arguments); //popup.open

			grid.resize();
			rowsElements = grid.renderArray(data);

			//disable browser's menu, e.g., on RMB click.
			grid.domNode.parentElement.parentElement.parentElement.addEventListener(
				'contextmenu',
				function (menuEvent) {
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			grid.focus();

			cellValue = cell.element.textContent;
			grid.clearSelection();
			if (cellValue) {
				for (i = 0; i < rowsElements.length; i++) {
					row = grid.row(rowsElements[i]);
					if (
						row.data[header1Field] === cellValue ||
						(row.data[header1Field] &&
							row.data[header1Field].toString() === cellValue)
					) {
						break;
					}
				}
				grid.select(row);
				cellElementToFocus = grid.cell(row.element, grid.columns[0].id).element;
				grid._focusOnNode(cellElementToFocus, false, null);
			} else {
				//select first row
				row = grid.row(rowsElements[0]);
				grid.select(row);
			}

			self = this;
			valueToReturn = row.data[header1Field] || '';

			window.listCellEditorNamespace.onSelectedValue = function (event) {
				valueToReturn = event ? grid.row(event).data[header1Field] : '';
				onCellEditorClosed();
			};

			grid.keyMap[keys.ENTER] = window.listCellEditorNamespace.onSelectedValue;
			grid.keyMap[keys.ESCAPE] = function () {
				onCellEditorClosed(true);
			};
			grid.keyMap[keys.TAB] = function (event) {
				valueToReturn = event ? grid.row(event).data[header1Field] : '';
				onCellEditorClosed(false, true);
			};

			var handler = grid.on(
				'.dgrid-row:click',
				window.listCellEditorNamespace.onSelectedValue
			);
			this.handlers.push(handler);

			var tooltipContainerStyle = window.getComputedStyle(
				document.querySelector('#listCellEditor .dijitTooltipContainer')
			);
			var tooltipContainerActualHeight = parseInt(tooltipContainerStyle.height);

			handler = on(window, 'resize', function (e) {
				self.resizeHandler(
					isViewMode,
					self.tooltipDialog,
					cell,
					tooltipContainerActualHeight
				);
			});
			this.handlers.push(handler);
			this.resizeHandler(
				isViewMode,
				this.tooltipDialog,
				cell,
				tooltipContainerActualHeight
			);
		},

		resizeHandler: function (
			isViewMode,
			tooltipDialog,
			cell,
			tooltipContainerActualHeight
		) {
			var wrapper = tooltipDialog._popupWrapper;
			var node = tooltipDialog.domNode;
			var around = isViewMode ? cell.element : cell.element.firstChild;

			if (!wrapper || !node) {
				return;
			}

			var viewport = Viewport.getEffectiveBox(this.ownerDocument);
			var aroundPos = around
				? domGeometry.position(around, false)
				: { y: args.y - (args.padding || 0), h: (args.padding || 0) * 2 };
			var maxHeight = Math.floor(
				Math.max(aroundPos.y, viewport.h - (aroundPos.y + aroundPos.h))
			);
			maxHeight -= 45; //45px - rough height of bottom status bar and scroll

			var toolTipHeight =
				tooltipContainerActualHeight < maxHeight ? 'auto' : maxHeight + 'px';

			domStyle.set(tooltipDialog.containerNode, {
				overflowY: 'auto',
				height: toolTipHeight
			});
		},

		getValue: function () {
			return valueToReturn;
		}
	});
});
