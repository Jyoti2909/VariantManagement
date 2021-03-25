/*jslint nomen: true */
/*global define*/
define([
	'dojo/_base/config',
	'dojo/date/stamp',
	'dojo/store/Memory',
	'dojo/dom-class',
	'dojo/_base/event',
	'dojo/_base/connect',
	'dojo/aspect',
	'./ContextMenu',
	'dijit/popup'
], function (
	config,
	DateIso,
	Memory,
	domClass,
	event,
	connect,
	aspect,
	ContextMenu,
	popup
) {
	'use strict';
	return {
		initTextDirection: function (gridDomNode, direction) {
			gridDomNode.setAttribute(
				'class',
				'languageDirection_' +
					direction +
					' ' +
					gridDomNode.getAttribute('class')
			);
		},

		getXML: function (grid, useValues, withSubRows) {
			var getGridAttributesXML = function () {
				var xml = '';
				if (grid.isEditable()) {
					xml += "editable='true' ";
				}
				return xml;
			};

			var getHeaderRowAttributesXML = function (style) {
				var xml = '';
				for (var i = 0; i < style.length; i++) {
					var st = style[i].split(':');
					//TODO: it seems that such style of seting fonts should be replaced setting only one field font - but perhaps our, e.g., xsl uses them
					if (st[0] == 'font-family') {
						xml += " font-family='" + st[1] + "'";
					}
					if (style['font-size']) {
						xml += " font-size='" + st[1] + "'";
					}
					if (st[0] == 'font-style') {
						xml += " font-style='" + st[1] + "'";
					}
					if (st[0] == 'font-weight') {
						xml += " font-weight='" + st[1] + "'";
					}
					if (st[0] == 'background-color') {
						xml += " bgColor='" + st[1] + "'";
					}
					if (st[0] == 'color') {
						xml += " textColor='" + st[1] + "'";
					}
					if (st[0] == 'text-align') {
						xml += " align='" + st[1].substr(0, 1) + "'";
					}
				}
				return xml;
			};

			var getColumnAttributesXML = function (column) {
				let xml = '';
				xml += " width='" + parseInt(column.width) + "'";
				//TODO: here mistake: edit can be like FilterComboBox, null, but should be EDIT, COMBO:0...
				if (!column.sort) {
					xml += " sort='NOSORT'";
				} else if ('NUMERIC' === column.sort) {
					xml += " sort='NUMERIC'";
				} else if ('DATE' === column.sort) {
					xml += " sort='DATE'";
				}
				if (column.locale) {
					xml += " locale='" + column.locale + "'";
				}
				const columnOrder = grid._grid.settings.indexHead.indexOf(column.field);
				xml +=
					" order='" +
					(columnOrder < 0 ? column.layoutIndex : columnOrder) +
					"'";
				if (column.bginvert) {
					xml += " bgInvert='" + column.bginvert + "'";
				}
				if (column.hidden) {
					xml += ' resizable="' + !column.hidden + '"';
				}
				if (column.columnCssStyles) {
					const textAlign = column.columnCssStyles['text-align'];
					//do not use st[1].substr(0, 1) instead of st[1], because, e.g., exportToExcel require full names
					xml += " align='" + textAlign + "'";
				}

				return xml;
			};

			var getGridHeadXML = function () {
				let headXml = '<thead>';
				let columnXml = '<columns>';
				const headMap = grid._grid.head;

				grid.grid_Experimental.order.forEach(function (columnName) {
					const cell = headMap.get(columnName);
					headXml += "<th align='c'>";
					headXml += ' ' === cell.label ? '' : encodeHTML(cell.label);
					headXml += '</th>';

					columnXml += '<column' + getColumnAttributesXML(cell) + ' />';
				});
				headXml += '</thead>';
				columnXml += '</columns>';
				return headXml + columnXml;
			};

			var getRowAttributesXML = function (rowId) {
				var xml = '';
				xml += " id='" + rowId + "'";
				if (rowId) {
					xml += " action='" + rowId + "'";
				}
				if (grid._grid.settings.selectedRows.includes(rowId)) {
					xml += " selected='true'";
				}
				if (grid.rowHeight) {
					xml += " height='" + grid.rowHeight + "'";
				}
				return xml;
			};

			var getCellAttributesXML = function (cell) {
				var xml = '',
					font = cell.getFont(),
					bgColor = cell.getBgColor(),
					textColor = cell.getTextColor();

				if (font) {
					xml += ' font="' + font + '"';
				}
				if (bgColor) {
					xml += ' bgColor="' + bgColor.replace(/!important/, '') + '"';
				}
				if (textColor) {
					xml += ' textColor="' + textColor + '"';
				}

				return xml;
			};

			var encodeHTML = function (html) {
				if (typeof html == 'string') {
					return html
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;')
						.replace(/'/g, '&apos;');
				}
				return html;
			};

			const shouldUseRawValueForOfficeApplication = function (cell) {
				const headId = grid.grid_Experimental.order[cell.getColumnIndex()];
				const cellDataType = grid._grid.head.get(headId, 'dataType');

				const preservedDataTypes = ['date', 'color list'];

				return preservedDataTypes.includes(cellDataType);
			};

			var getCellXML = function (cell) {
				const valueForOfficeApplication = shouldUseRawValueForOfficeApplication(
					cell
				)
					? cell.getValue()
					: cell.getText();

				const xml =
					'<td' +
					getCellAttributesXML(cell) +
					'>' +
					encodeHTML(valueForOfficeApplication) +
					'</td>';
				return xml;
			};

			var getRowXml = function (rowId) {
				var xml = '<tr' + getRowAttributesXML(rowId) + '>',
					i,
					cell,
					colsCount = grid.GetColumnCount();

				for (i = 0; i < colsCount; i++) {
					cell = grid.cells_Experimental(rowId, i, true);
					xml += getCellXML(cell);
				}

				//TODO: add logic of userdata

				//TODO: add logic of withSubRows, blocked by implementation of getChildItemsId
				//if (withSubRows && this.getChildItemsId) {
				//}

				xml += '</tr>';
				return xml;
			};

			var gridXml = '<table ',
				rows = [],
				i;

			//TODO: code below is partial copy of getVisibleItemIDs() to fill rows array, but avoid excessive join-split logic.
			//Should be reviewed after introducing the new grid intead of dojo grid.
			for (i = 0; i < grid.getRowCount(); i++) {
				rows.push(grid.getRowId(i));
			}

			var rowsCount = rows.length;

			gridXml += getGridAttributesXML() + '>';
			gridXml += getGridHeadXML();
			for (i = 0; i < rowsCount; i++) {
				gridXml += getRowXml(rows[i]);
			}
			gridXml += '</table>';
			return gridXml;
		},

		inputRow: function (grid) {
			var setters = {
					value: function (index, value) {
						var field =
							'string' === typeof index
								? index
								: this.grid.grid_Experimental.order[index];
						if (grid._grid.head.get(field, 'searchType') === 'multiValueList') {
							value = value.length > 0 ? value.split(',') : [];
						}
						this.grid._grid.head.set(field, value, 'searchValue');
					},
					disabled: function (index, value) {
						const field =
							'string' === typeof index
								? index
								: this.grid.grid_Experimental.order[index];
						const fieldObject = this.grid._grid.head.get(field);
						const defaultSearchType = fieldObject._defaultSearchType;
						let searchType = fieldObject.searchType;
						if (value) {
							if (!defaultSearchType) {
								this.grid._grid.head.set(
									field,
									fieldObject.searchType,
									'_defaultSearchType'
								);
							}
							searchType = 'disabled';
						} else if (defaultSearchType) {
							searchType = defaultSearchType;
						}
						this.grid._grid.head.set(field, searchType, 'searchType');
					},
					comboList: function (index, values, labels) {
						var field =
								'string' === typeof index
									? index
									: this.grid.nameColumns[index],
							obj = this.grid.inputRowCollections[field],
							data = [],
							i;

						if ('dijit.form.FilteringSelect' === obj.declaredClass) {
							labels = labels || values;
							for (i = 0; i < values.length; i += 1) {
								data.push({ name: values[i], id: labels[i] });
							}
							obj.set('store', new Memory({ data: data }));
						}
					},
					visible: function (value) {
						this.grid.showInputRow_Experimental(value);
					}
				},
				getters = {
					value: function (index) {
						var field =
							'string' === typeof index
								? index
								: this.grid.grid_Experimental.order[index];
						var value = grid._grid.head.get(field, 'searchValue');
						if (Array.isArray(value)) {
							value = value.join(',');
						}
						return value;
					},
					disabled: function (index) {
						const field =
							'string' === typeof index
								? index
								: this.grid.grid_Experimental.order[index];
						return this.grid._grid.head.get(field, 'searchType') === 'disabled';
					},
					visible: function () {
						return this.grid.isInputRowVisible_Experimental();
					}
				};

			return {
				grid: grid,

				set: function (index, key, value) {
					if (2 === arguments.length && getters[index]) {
						setters[index].call(this, key);
						return;
					}
					var field =
							'string' === typeof index
								? index
								: this.grid.grid_Experimental.order[index],
						args;

					if (setters[key] && field) {
						args = Array.prototype.slice.call(arguments, 2);
						args.splice(0, 0, index);
						setters[key].apply(this, args);
					} else {
						throw (
							"Grid message: can't call setter " +
							key +
							' in inputRow with value ' +
							value +
							', column ' +
							index
						);
					}
				},

				get: function (index, key) {
					if (1 === arguments.length && getters[index]) {
						return getters[index].call(this);
					}

					var field =
						'string' === typeof index
							? index
							: this.grid.grid_Experimental.order[index];

					if (getters[key] && field) {
						return getters[key].call(this, field);
					}
					throw (
						"Grid message: can't call getter " +
						key +
						' in inputRow, column ' +
						index
					);
				}
			};
		},

		items: function (grid) {
			// grid = gridPublicContainer or TreeGridPublicContainer
			const gridComponent = grid._grid;
			const getItemFromStore = function (headId, rowId) {
				const linkProperty = gridComponent.head.get(headId, 'linkProperty');
				if (linkProperty) {
					rowId = gridComponent.rows.get(rowId, linkProperty);
				}

				return gridComponent.rows._store.get(rowId);
			};

			const store = function () {
				return grid._store || grid.grid_Experimental.store;
			};

			const setters = {
				value: function (item, field, value) {
					const name = gridComponent.head.get(field, 'name') || field;
					item[name] = value;
					// This hack must be removed in major update.
					// After updating the "Increment Sequence Number" method
					if (window.RelType_Nm === 'Part BOM' && field === 'sort_order_D') {
						const storeActions = aras.getMainWindow().store.boundActionCreators;
						storeActions.changeItem(window.RelType_Nm, item.id, {
							[name]: `${value}`
						});
					}
				}
			};

			const getters = {
				value: function (item, field) {
					const propertyName = gridComponent.head.get(field, 'name') || field;
					return item[propertyName];
				},
				id: function (item) {
					return item.id;
				}
			};

			return {
				grid: grid.grid_Experimental,

				onNew: function (id) {
					//this is event call when add new row in grid
				},

				isDirty: function (id) {
					var item = store()._getItemByIdentity(id);
					if (item > -1) {
						return store().isDirty(item);
					}
				},

				add: function (item) {
					if (this.grid.edit.isEditing()) {
						this.grid.edit.apply();
					}
					this.grid.beginUpdate();
					store().newItem(item);
					store().save();
					this.grid.endUpdate();
				},

				remove: function (id) {
					var item = store()._getItemByIdentity(id);
					if (item) {
						store().deleteItem(item);
					}
				},

				getAllId: function () {
					return gridComponent.settings.indexRows;
				},

				is: function (id) {
					return gridComponent.rows.has(id);
				},

				set: function (id, key, value) {
					const item = getItemFromStore(value, id);
					const setter = setters[key];
					if (setter && item) {
						const args = Array.prototype.slice.call(arguments, 2);
						args.splice(0, 0, item);
						setter.apply(this, args);
					}
				},

				get: function (id, key, field) {
					let item = null;
					if ('id' === key) {
						const rowId = gridComponent.settings.indexRows[id];
						item = gridComponent.rows._store.get(rowId);
					} else {
						item = getItemFromStore(field, id);
					}
					if (getters[key] && item) {
						return getters[key].call(this, item, field);
					}
				}
			};
		},

		columns: function (grid) {
			// grid = arasDataGrid or arasTreeGrid
			var setters = {
					editable: function (index, value) {
						this.grid.getCell(index).editable = value;
					},
					editType: function (index, type) {
						this.grid.getCell(index).editableType = type;
					},
					comboList: function (index, list, lables) {
						this.grid.getCell(index).options = list;
						this.grid.getCell(index).optionsLables = lables;
					},
					formatter: function (index, func) {
						this.grid.getCell(index).formatter = func;
					}
				},
				getters = {
					editable: function (index) {
						return this.grid.getCell(index).editable;
					},
					index: function (index) {
						return index;
					},
					name: function (index) {
						return this.grid.nameColumns[index];
					},
					count: function () {
						return this.grid.order.length;
					},
					width: function (index) {
						var cell = this.grid.getCell(index);
						return cell.unitWidth || cell.width;
					}
				};

			return {
				grid: grid,

				set: function (field, key, value) {
					var index =
							'string' === typeof field
								? this.grid.nameColumns.indexOf(field)
								: this.grid.order[field],
						args;
					if (setters[key] && index > -1) {
						args = Array.prototype.slice.call(arguments, 2);
						args.splice(0, 0, index);
						setters[key].apply(this, args);
					}
				},

				get: function (field, key) {
					if (1 === arguments.length && getters[field]) {
						return getters[field].call(this);
					}

					const index =
						'string' === typeof field ? this.grid.order.indexOf(field) : field;
					if (getters[key] && index > -1) {
						return getters[key].call(this, index);
					}
				}
			};
		},

		edit: function (grid) {
			// grid = arasDataGrid or arasTreeGrid

			return {
				grid: grid,

				setErrorMessage: function (message) {
					if (this.grid.edit.isEditing()) {
						var editorWidget = this.grid.edit.info.cell.widget;

						if (editorWidget) {
							editorWidget.invalidMessage = message;
							editorWidget.focus();
							return true;
						}
					}
					return false;
				},

				set: function (id, field) {
					var columnIndex =
							'string' === typeof field
								? this.grid.nameColumns.indexOf(field)
								: this.grid.order[field],
						cell = this.grid.getCell(columnIndex),
						item = this.grid.store._getItemByIdentity(id),
						index = item ? this.grid.getItemIndex(item) : -1;
					this.grid.focus.setFocusCell(cell, index);
					this.grid.edit.setEditCell(cell, index);
				}
			};
		},

		focus: function (grid) {
			// grid = arasDataGrid or arasTreeGrid
			function getGridInfo() {
				const gridModule = grid.parentContainer._grid;
				return {
					focusedCell: gridModule.settings.focusedCell,
					rows: gridModule.settings.indexRows,
					heads: gridModule.settings.indexHead
				};
			}

			return {
				grid: grid,

				isLastCell: function () {
					const gridInfo = getGridInfo();

					const lastRowId = gridInfo.rows[gridInfo.rows.length - 1];
					const lastHeadId = gridInfo.heads[gridInfo.heads.length - 1];

					return (
						gridInfo.focusedCell &&
						lastRowId === gridInfo.focusedCell.rowId &&
						lastHeadId === gridInfo.focusedCell.headId
					);
				},

				isFirstCell: function () {
					const gridInfo = getGridInfo();

					const firstRowId = gridInfo.rows[0];
					const firstHeadId = gridInfo.heads[0];

					return (
						gridInfo.focusedCell &&
						firstRowId === gridInfo.focusedCell.rowId &&
						firstHeadId === gridInfo.focusedCell.headId
					);
				}
			};
		},

		selection: function (grid) {
			// grid = arasDataGrid or arasTreeGrid

			var setters = {
					multi: function (value) {
						this.grid._grid.view.defaultSettings.multiSelect = value;
					},
					none: function (value) {
						this.grid._grid.view.defaultSettings.multiSelect = false;
					}
				},
				getters = {
					id: function () {
						return this.grid._grid.settings.selectedRows[0] || '';
					},
					index: function () {
						return this.grid._grid.settings.indexRows.indexOf(
							this._grid.settings.selectedRows[0] || ''
						);
					},
					ids: function () {
						return this.grid._grid.settings.selectedRows.slice();
					}
				};

			return {
				grid: grid,

				clear: function () {
					this.grid._grid.settings.selectedRows = [];
				},

				set: function (key, value) {
					if (setters[key]) {
						var args = Array.prototype.slice.call(arguments, 1);
						setters[key].apply(this, args);
					} else {
						throw "Grid message: can't call getter " + key + ' in Selection';
					}
				},

				get: function (key) {
					if (getters[key]) {
						return getters[key].call(this);
					}
					throw "Grid message: can't call getter " + key + ' in Selection';
				}
			};
		},

		events: {
			onRowDblClick: function (headId, rowId, e) {
				this.gridDoubleClick(
					rowId,
					this._grid.settings.indexHead.indexOf(headId),
					e.ctrlKey || e.metaKey
				);
			},

			onSelected: function (event) {
				var rowIndex = event.detail.index;
				var rowId = this._grid.settings.indexRows[rowIndex];
				this.gridRowSelect(rowId, this._grid.view.defaultSettings.multiSelect);
			},

			onHeaderEvent: function (cellName, e) {
				if (e.type == 'contextmenu') {
					this.grid_Experimental.headerMenu = this.headerContexMenu_Experimental.menu;

					var rowId = 'header_row';
					e.rowIndex = '-1';
					this.headerContexMenu_Experimental.rowId = rowId;
					var columnIndex = this.grid_Experimental.order.indexOf(cellName);

					this.grid_Experimental.onHeaderCellContextMenu(e);
					this.headerContexMenu_Experimental.columnIndex = columnIndex;

					this.headerContexMenu_Experimental.show({
						x: e.clientX,
						y: e.clientY
					});
					e.preventDefault();
				}
			},

			onRowClick: function (headId, rowId, event) {
				// Ctrl+click/shift remove row from selection and toolbar didn't updated
				if (this._grid.settings.selectedRows.indexOf(rowId) > -1) {
					this.gridClick(rowId, this.GetColumnIndex(headId));
				}
			},

			onStartEdit: function (e) {
				const focusedCell = this._grid.settings.focusedCell;
				if (!focusedCell || !focusedCell.editing) {
					return;
				}
				this.onStartEdit_Experimental(focusedCell.rowId, focusedCell.headId);
			},

			onApplyCellEdit: function (e) {
				const value = e.detail.value;
				const rowId = e.detail.rowId;
				const field = e.detail.headId;
				this.onApplyEdit_Experimental(rowId, field, value);
			},

			onCancelEdit: function () {
				const rowId = this._grid.settings.focusedCell.rowId;
				this.onCancelEdit_Experimental(rowId);
			},

			onStartSearch: function () {
				this.onStartSearch_Experimental();
			},

			onBlur: function () {
				this.edit._applyStarted = true;
				this.edit.apply();
			}
		},

		// grid DnD functionality
		dnd: function (gridContainer) {
			var dndModule = {
				gridContainer: gridContainer,
				gridWidget: gridContainer.grid_Experimental,
				gridView: null,
				dragContainer: null,
				dragSourceRowNode: null,
				dragTargetRowId: null,
				dragStarted: false,
				isDragPending: false,
				startPoint: null,
				dropPoint: null,
				dragDelay: 10,
				visibleColumnsCount: 4,
				ctrlKeyState: false,
				_isMacOs: /mac/i.test(navigator.platform),
				styling: {
					containerNode: 'dndDragNodeContainer',
					avatarNode: 'dndDragAvatar',
					sourceNode: 'dndDragSource',
					placeholderNode: 'dndDragPlaceholder'
				},
				onMouseDownRowIndex: null,

				init: function () {
					aspect.after(
						this.gridWidget,
						'buildViews',
						function () {
							this.gridView = this.gridWidget.views.views[0];
							this.attachDnDEventListeners();
						}.bind(this)
					);
				},

				// method used to attach mouse event listeners to current gridView
				attachDnDEventListeners: function () {
					connect.connect(
						this.gridView.contentNode,
						'mousedown',
						this,
						this.processDnDEvent
					);
					connect.connect(
						this.gridView.scrollboxNode,
						'mouseup',
						this,
						this.processDnDEvent
					);
					connect.connect(
						this.gridView.scrollboxNode,
						'mouseenter',
						this,
						this.processDnDEvent
					);
					connect.connect(
						this.gridView.scrollboxNode,
						'mousemove',
						this,
						this.processDnDEvent
					);
					connect.connect(
						this.gridView.scrollboxNode,
						'mouseleave',
						this,
						this.processDnDEvent
					);
					connect.connect(
						this.gridView.scrollboxNode,
						'keydown',
						this,
						this.processDnDEvent
					);
					connect.connect(
						this.gridView.scrollboxNode,
						'keyup',
						this,
						this.processDnDEvent
					);
				},

				createDragContainer: function () {
					this.dragContainer = {
						containerNode: document.createElement('div'),
						avatarNode: document.createElement('div'),
						sourceNode: document.createElement('div'),
						placeholderNode: document.createElement('div')
					};

					this.dragContainer.containerNode.appendChild(
						this.dragContainer.avatarNode
					);
					this.dragContainer.containerNode.appendChild(
						this.dragContainer.sourceNode
					);
					document.body.appendChild(this.dragContainer.containerNode);

					// apply node styles
					this.dragContainer.sourceNode.innerHTML = this.cleanupCssStyles(
						this.dragSourceRowNode.outerHTML
					);

					this.dragContainer.containerNode.className = this.styling.containerNode;
					this.dragContainer.avatarNode.className = this.styling.avatarNode;
					this.dragContainer.sourceNode.className = this.styling.sourceNode;
					this.dragContainer.placeholderNode.className = this.styling.placeholderNode;
					this.dragContainer.placeholderNode.style.width =
						this.getRowContentWidth(this.dragSourceRowNode) + 'px';

					var sourceWidth = 0,
						columnIndex = 0,
						columnsToAdd = this.visibleColumnsCount,
						layoutCell;

					while (
						columnsToAdd &&
						columnIndex < this.gridWidget.layout.cellCount
					) {
						layoutCell = this.gridWidget.layout.cells[columnIndex];

						if (!layoutCell.hidden) {
							sourceWidth += parseInt(layoutCell.width);
							columnsToAdd--;
						}

						columnIndex++;
					}

					this.dragContainer.sourceNode.style.width = sourceWidth + 'px';
					this.drawAvatar();
				},

				drawAvatar: function () {
					if (this.dragContainer) {
						this.dragContainer.avatarNode.innerHTML = this.ctrlKeyState
							? 'Copying'
							: 'Moving';
					}
				},

				getRowContentWidth: function (rowNode) {
					var contentWidth = 0,
						i;

					for (i = 0; i < rowNode.childNodes.length; i++) {
						contentWidth += rowNode.childNodes[i].offsetWidth;
					}

					return contentWidth;
				},

				repositionDragContainer: function (mouseX, mouseY) {
					if (this.dragContainer) {
						var containerNode = this.dragContainer.containerNode;

						containerNode.style.left = mouseX + 40 + 'px';
						containerNode.style.top =
							parseInt(mouseY - containerNode.offsetHeight / 2) + 'px';
					}
				},

				cleanupCssStyles: function (nodeHtml) {
					return nodeHtml.replace(
						/dojoxGridRowSelected|dojoxGridRowOver|dojoxGridCellFocus/g,
						''
					);
				},

				destroyDragContainer: function () {
					if (this.dragContainer) {
						var placeholderParent = this.dragContainer.placeholderNode
							.parentNode;

						if (placeholderParent) {
							this.gridView.contentNode.style.height =
								this.gridView.contentNode.offsetHeight -
								this.dragContainer.placeholderNode.offsetHeight +
								'px';
							placeholderParent.removeChild(this.dragContainer.placeholderNode);
						}

						document.body.removeChild(this.dragContainer.containerNode);
						this.dragContainer = null;
					}
				},

				searchDropTarget: function (e) {
					if (e.rowIndex >= 0) {
						var targetRowIndex = e.rowIndex,
							targetRowNode = this.gridView.rowNodes[targetRowIndex],
							parentNode = targetRowNode.parentNode,
							targetRowRectangle = targetRowNode.getBoundingClientRect(),
							middleY = parseInt(
								targetRowRectangle.top + targetRowRectangle.height / 2
							),
							placeholderAttached = this.dragContainer.placeholderNode
								.parentNode,
							targetRowId;

						if (e.pageY < middleY) {
							if (e.rowIndex > 0) {
								targetRowIndex = targetRowIndex - 1;
							} else {
								targetRowIndex = -1;
							}
						}

						targetRowId =
							targetRowIndex === -1
								? ''
								: this.gridContainer.getRowId(targetRowIndex);

						if (
							this.dragTargetRowId === null ||
							this.dragTargetRowId !== targetRowId
						) {
							if (targetRowIndex == -1) {
								this.dragTargetRowId = '';
							} else {
								this.dragTargetRowId = targetRowId;
							}

							if (targetRowIndex + 1 < this.gridWidget.rowCount) {
								parentNode.insertBefore(
									this.dragContainer.placeholderNode,
									this.gridView.rowNodes[targetRowIndex + 1]
								);
							} else {
								parentNode.appendChild(this.dragContainer.placeholderNode);
							}
						}

						// if placeholder was just added to contentNode, then adjust contentNode height
						if (!placeholderAttached) {
							this.gridView.contentNode.style.height =
								this.gridView.contentNode.scrollHeight + 'px';
						}

						//this.dragContainer.avatarNode.style.backgroundColor = "#1f6d42";
						return true;
					} else {
						//this.dragContainer.avatarNode.style.backgroundColor = "#b83b1d";
						return false;
					}
				},

				processDnDEvent: function (e) {
					switch (e.type) {
						case 'mouseup':
							this.gridView.content.decorateEvent(e);
							this.onMouseUp(e);
							break;
						case 'mousedown':
							this.gridView.content.decorateEvent(e);
							this.onMouseDown(e);
							break;
						case 'mousemove':
							this.gridView.content.decorateEvent(e);
							this.onMouseMove(e);
							break;
						//mouseout
						case 'mouseout':
						case 'mouseleave':
							this.onMouseLeave(e);
							break;
						case 'keydown':
							this.onKeyDown(e);
							break;
						case 'keyup':
							this.onKeyUp(e);
							break;
					}
				},

				canStartDrag: function (e) {
					if (this.isDragPending) {
						if (
							Math.abs(e.pageX - this.startPoint.x) > this.dragDelay ||
							Math.abs(e.pageY - this.startPoint.y) > this.dragDelay
						) {
							this.gridContainer.setSelectedRow(
								this.gridContainer.getRowId(this.onMouseDownRowIndex),
								true,
								false
							);
							return this.gridContainer.canDragDrop_Experimental(e);
						}
					}

					return false;
				},

				beginDrag: function () {
					this.createDragContainer();
					this.isDragPending = false;
					this.dragStarted = true;

					// execute onDragStart_Experimental event handler
					if (this.gridContainer.onDragStart_Experimental) {
						this.gridContainer.onDragStart_Experimental();
					}
				},

				endDrag: function (dropAllowed, e) {
					if (this.dragStarted) {
						this.destroyDragContainer();
						this.dragStarted = false;

						if (dropAllowed) {
							// execute onDragDrop_Experimental event handler
							if (this.gridContainer.onDragDrop_Experimental) {
								this.gridContainer.onDragDrop_Experimental(
									this.dragTargetRowId,
									this.ctrlKeyState
								);
							}
						}
					}

					this.isDragPending = false;
				},

				onMouseDown: function (e) {
					if (e.button === 0 && e.rowIndex >= 0) {
						if (
							this.gridContainer.isEditable() &&
							!this.gridWidget.edit.isEditing()
						) {
							this.dragSourceRowNode = e.rowNode;
							this.startPoint = { x: e.pageX, y: e.pageY };
							this.onMouseDownRowIndex = e.rowIndex;
							this.isDragPending = true;
						}
					}
				},

				onMouseUp: function (e) {
					this.dropPoint = { x: e.pageX, y: e.pageY };
					this.endDrag(true, e);
				},

				onMouseMove: function (e) {
					if (this.dragStarted) {
						this.repositionDragContainer(e.pageX, e.pageY);
						this.searchDropTarget(e);
					} else if (this.canStartDrag(e)) {
						this.beginDrag();

						this.refreshCtrlState(e);
						this.repositionDragContainer(e.pageX, e.pageY);
					}
				},

				onMouseLeave: function (e) {
					this.endDrag(false);
				},

				onKeyDown: function (e) {
					if (this.dragStarted) {
						switch (e.keyCode) {
							case 27:
								// if escape pressed, then stop dragging
								this.endDrag(false);
								break;
							case 17:
								this.refreshCtrlState(e);
								break;
						}
					}
				},

				onKeyUp: function (e) {
					if (this.dragStarted) {
						switch (e.keyCode) {
							case 17:
								this.refreshCtrlState(e);
								break;
						}
					}
				},

				refreshCtrlState: function (e) {
					var isCtrlPressed = this._isMacOs ? e.metaKey : e.ctrlKey;

					if (isCtrlPressed !== this.ctrlKeyState) {
						this.ctrlKeyState = isCtrlPressed;

						if (this.dragStarted) {
							this.drawAvatar();
						}
					}
				}
			};

			dndModule.init();
			return dndModule;
		},

		redline: function (grid) {
			return {
				gridContainer: grid,
				isInitialized: false,
				compareColumnList: [],
				baselineStore: new Map(),
				baselineIndexRows: [],
				redLineDiff: new Map(),
				isRedlineActive: false,

				plugin: {
					getCellMetadata: function (cellMetaData, headId, rowId) {
						if (!grid.redline_Experimental.isRedlineActive) {
							return cellMetaData;
						}
						return Object.assign(cellMetaData, {
							isRedlineEnabled: grid.redline_Experimental.isRedlineActive,
							getBaseValue: grid.redline_Experimental.getBaseValue.bind(
								grid.redline_Experimental
							),
							getBaseItemByCurrentItemId: grid.redline_Experimental.getBaseItemByCurrentItemId.bind(
								grid.redline_Experimental
							)
						});
					},
					getCellType: function (result, headId, rowId) {
						if (!grid.redline_Experimental.isRedlineActive) {
							return result;
						}
						const baseValue = grid.redline_Experimental.getBaseValue(
							headId,
							rowId
						);
						if (baseValue || (result === 'boolean' && baseValue === false)) {
							result = 'redline_' + result;
						}
						return result;
					},
					getRowClasses: function (result, rowId) {
						if (!grid.redline_Experimental.isRedlineActive) {
							return result;
						}
						if (grid.redline_Experimental.isNewRow(rowId)) {
							result += ' aras-redline_new';
						}
						if (grid.redline_Experimental.isDeletedRow(rowId)) {
							result += ' aras-redline_deleted';
						}
						return result;
					},
					getEditorType: function (result) {
						if (!grid.redline_Experimental.isRedlineActive) {
							return result;
						}
						return result.replace(/^redline_/, '');
					}
				},

				getBaseItemByCurrentItemId: function (rowId, propertyName) {
					const baselineIndex = this.redLineDiff.get(rowId).baselineIndex;
					const baseLineId = this.baselineIndexRows[baselineIndex];
					return this._getItem(baseLineId, propertyName, this.baselineStore);
				},

				addGridColumnsToCompareList: function () {
					this.compareColumnList = grid.grid_Experimental.order.slice();
				},

				clearCompareList: function () {
					this.compareColumnList.length = 0;
				},

				enableRedlineMode: function (doEnabled) {
					if (this.isRedlineActive != doEnabled) {
						this.isRedlineActive = doEnabled;
						if (!this.isRedlineActive) {
							this.clearGridStore();
						}
					}
				},

				initialize: function () {
					if (!this.isInitialized) {
						// some initialization, before using redline functionality
						const self = this;
						Object.defineProperty(this.gridContainer, 'EnableDiffMode', {
							get: function () {
								return self.isRedlineActive;
							},
							set: function (doEnabled) {
								self.enableRedlineMode(doEnabled);
							}
						});

						this.isInitialized = true;
						window.Grid.formatters.extend(this.formatters);
					}
				},

				removeColumnFromCompareList: function (columnName) {
					const columnIndex = this.compareColumnList.indexOf(columnName);

					if (columnIndex != -1) {
						this.compareColumnList.splice(columnIndex, 1);
					}
				},

				_deleteItemFromStore: function (itemId) {
					const relatedId = grid._grid.rows.get(itemId, 'related_id');
					if (relatedId) {
						grid._grid.rows.delete(relatedId);
					}
					grid._grid.rows.delete(itemId);
				},

				clearGridStore: function () {
					this.redLineDiff.forEach(function (value, key) {
						if (value.rowStatus === 'deleted') {
							this._deleteItemFromStore(key);
						}
					}, this);
					this.redLineDiff = new Map();
				},

				loadBaselineXML: function (baseLine) {
					this.baselineStore = baseLine.rowsMap;
					this.baselineIndexRows = baseLine.indexRows;
					this.clearCompareList();
				},

				_getItem: function (id, columnName, store) {
					let item = store.get(id);
					const linkProperty = grid._grid.head.get(columnName, 'linkProperty');
					if (linkProperty && item[linkProperty]) {
						id = item[linkProperty];
						item = store.get(id);
					}
					return item;
				},

				_generateRedlineDiff: function () {
					this.redLineDiff.forEach(function (value, key) {
						if (value.rowStatus === 'edited') {
							this._compareValuesInLine(key);
						}
					}, this);
				},

				_compareValuesInLine: function (rowId) {
					const store = grid._grid.rows._store;
					const baseLineStore = this.baselineStore;
					const redLineItemDiff = this.redLineDiff.get(rowId);
					const baseLineId = this.baselineIndexRows[
						redLineItemDiff.baselineIndex
					];
					const compareColumnList = this.compareColumnList;
					compareColumnList.forEach(function (columnName) {
						const propName = grid._grid.head.get(columnName, 'name');
						const currentItem = this._getItem(rowId, columnName, store);
						const baseLineItem = this._getItem(
							baseLineId,
							columnName,
							baseLineStore
						);
						if (currentItem[propName] !== baseLineItem[propName]) {
							const itemId = currentItem.id;
							const redlineDiffForItem = this.redLineDiff.get(itemId);
							const value = baseLineItem[propName];
							if (redlineDiffForItem) {
								redlineDiffForItem.diff[columnName] = value;
								return;
							}

							const newRedlineDiff = {
								baselineIndex: redLineItemDiff.baselineIndex,
								diff: {}
							};
							newRedlineDiff.diff[columnName] = value;
							this.redLineDiff.set(itemId, newRedlineDiff);
						}
					}, this);
				},

				_addItemToStore: function (itemId) {
					const currentItem = this.baselineStore.get(itemId);
					if (currentItem.related_id) {
						const relatedItem = this.baselineStore.get(currentItem.related_id);
						grid._grid.rows._store.set(currentItem.related_id, relatedItem);
					}
					grid._grid.rows.set(itemId, currentItem);
				},

				getBaseValue: function (headId, rowId) {
					const redLineItemDiff = this.redLineDiff.get(rowId);
					if (!redLineItemDiff || !redLineItemDiff.diff) {
						return;
					}
					return redLineItemDiff.diff[headId];
				},

				isNewRow: function (rowId) {
					return !this.redLineDiff.get(rowId);
				},

				isDeletedRow: function (rowId) {
					const redLineItemDiff = this.redLineDiff.get(rowId) || {};
					return redLineItemDiff.rowStatus === 'deleted';
				},

				refreshRedlineView: function () {
					this.clearGridStore();
					const baselineLength = this.baselineIndexRows.length;
					if (baselineLength) {
						const indexRows = grid._grid.settings.indexRows;
						const indexRowsLength = indexRows.length;
						const matchesArray = [];
						const currentMatchIndexes = new Array(indexRowsLength);
						const baselineMatchIndexes = new Array(baselineLength);
						let mismatchCount = parseInt(this.compareColumnList.length / 2 + 1);
						let minMatchCount;
						let bestMatchIndex;
						let bestMatchValue;

						mismatchCount = mismatchCount > 5 ? 5 : mismatchCount;
						minMatchCount = this.compareColumnList.length - mismatchCount;
						for (let i = 0; i < baselineLength; i++) {
							matchesArray.push(
								this._compareBaselineRow(this.baselineIndexRows[i])
							);
						}

						for (let i = 0; i < indexRowsLength; i++) {
							bestMatchValue = 0;
							for (let j = 0; j < baselineLength; j++) {
								if (matchesArray[j][i] > bestMatchValue) {
									bestMatchIndex = j;
									bestMatchValue = matchesArray[j][i];
								}
							}

							if (bestMatchValue > minMatchCount) {
								for (let j = 0; j < indexRowsLength; j++) {
									matchesArray[bestMatchIndex][j] = 0;
								}
								currentMatchIndexes[i] = bestMatchIndex;
								baselineMatchIndexes[bestMatchIndex] = i;
							}
						}

						indexRows.forEach(function (key, i) {
							if (currentMatchIndexes[i] !== undefined) {
								this.redLineDiff.set(key, {
									rowStatus: 'edited',
									baselineIndex: currentMatchIndexes[i],
									diff: {}
								});
							}
						}, this);

						this.baselineIndexRows.forEach(function (itemId, i) {
							if (baselineMatchIndexes[i] === undefined) {
								this._addItemToStore(itemId);
								this.redLineDiff.set(itemId, { rowStatus: 'deleted' });
							}
						}, this);
					}
					this._generateRedlineDiff();
				},

				_compareBaselineRow: function (baseLineIndexRow) {
					const store = grid._grid.rows._store;
					const baseLineStore = this.baselineStore;
					const compareColumnList = this.compareColumnList;
					const indexRows = grid._grid.settings.indexRows;
					const getItem = this._getItem.bind(this);

					return indexRows.map(function (id) {
						return compareColumnList.reduce(function (res, columnName) {
							const propName = grid._grid.head.get(columnName, 'name');
							const currentItem = getItem(id, columnName, store);
							const baseLineItem = getItem(
								baseLineIndexRow,
								columnName,
								baseLineStore
							);
							if (
								currentItem[propName] === baseLineItem[propName] ||
								(currentItem[propName] === null &&
									baseLineItem[propName] === undefined)
							) {
								res++;
							}
							return res;
						}, 0);
					});
				},

				formatters: {
					redline_string: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						return {
							children: [
								{
									tag: 'span',
									children: [value]
								},
								{
									tag: 'span',
									className: 'aras-redline__text',
									children: [baseValue]
								}
							]
						};
					},
					redline_color: window.Grid.formatters.color,
					redline_boolean: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters.boolean;
						const currentRes = formatter(headId, rowId, value, grid, metadata);
						const baseRes = formatter(headId, rowId, baseValue, grid, metadata);
						const checkbox = baseRes.children[0];
						checkbox.className += ' aras-redline__checkbox';
						currentRes.children.push(checkbox);
						return currentRes;
					},
					'redline_color list': function (
						headId,
						rowId,
						value,
						grid,
						metadata
					) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters['color list'];
						const options = metadata.options || metadata.list || [];
						const result = options.find(function (option) {
							return option.value.toString() === baseValue;
						});
						const label = result ? result.label || result.value : value;
						const currentRes = formatter(headId, rowId, value, grid, metadata);
						const baseColor = {
							tag: 'span',
							className: 'aras-redline__text',
							children: [label]
						};
						currentRes.children.push(baseColor);
						return currentRes;
					},
					redline_float: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters.float;
						const currentRes = formatter(headId, rowId, value, grid, metadata)
							.children;
						const baseRes = formatter(headId, rowId, baseValue, grid, metadata)
							.children;
						return {
							children: [
								{
									tag: 'span',
									children: currentRes
								},
								{
									tag: 'span',
									className: 'aras-redline__text',
									children: baseRes
								}
							]
						};
					},
					redline_date: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters.date;
						const currentRes = formatter(headId, rowId, value, grid, metadata)
							.children;
						const baseRes = formatter(headId, rowId, baseValue, grid, metadata)
							.children;
						return {
							children: [
								{
									tag: 'span',
									children: currentRes
								},
								{
									tag: 'span',
									className: 'aras-redline__text',
									children: baseRes
								}
							]
						};
					},
					redline_md5: window.Grid.formatters.md5,
					redline_text: function (headId, rowId, value, grid, metadata) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_image: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters.image;
						const currentRes = formatter(headId, rowId, value, grid, metadata);
						const baseRes = formatter(headId, rowId, baseValue, grid, metadata);
						return {
							children: [
								{
									tag: 'div',
									className: 'aras-redline__container',
									children: [
										{
											tag: 'span',
											children: currentRes.children
										},
										{
											tag: 'span',
											className: 'aras-redline__image',
											children: [
												baseRes.children[0],
												{
													tag: 'span',
													className: 'aras-redline__line'
												}
											]
										}
									]
								}
							],
							className: currentRes.className
						};
					},
					redline_decimal: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters.decimal;
						const currentRes = formatter(headId, rowId, value, grid, metadata)
							.children;
						const baseRes = formatter(headId, rowId, baseValue, grid, metadata)
							.children;
						return {
							children: [
								{
									tag: 'span',
									children: currentRes
								},
								{
									tag: 'span',
									className: 'aras-redline__text',
									children: baseRes
								}
							]
						};
					},
					redline_integer: function (headId, rowId, value, grid, metadata) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_sequence: function (headId, rowId, value, grid, metadata) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_list: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters.list;
						const currentRes = formatter(headId, rowId, value, grid, metadata);
						const baseRes = formatter(headId, rowId, baseValue, grid, metadata);
						return {
							className: currentRes.className,
							children: [
								{
									tag: 'span',
									children: currentRes.children
								},
								{
									tag: 'span',
									className: 'aras-redline__text',
									children: baseRes.children
								}
							]
						};
					},
					'redline_filter list': function (
						headId,
						rowId,
						value,
						grid,
						metadata
					) {
						return window.Grid.formatters.redline_list(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					'redline_formatted text': function (
						headId,
						rowId,
						value,
						grid,
						metadata
					) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_item: function (headId, rowId, value, grid, metadata) {
						const formatter = window.Grid.formatters.item;
						const currentRes = formatter(headId, rowId, value, grid, metadata);

						const baseValue = metadata.getBaseValue(headId, rowId);
						if (!baseValue) {
							return currentRes;
						}
						const baseItem = metadata.getBaseItemByCurrentItemId(rowId, headId);
						const propertyName = grid.head.get(headId, 'name') || headId;
						const itemName =
							baseItem[propertyName + '@aras.keyed_name'] || value;

						return {
							children: [
								{
									tag: 'span',
									children: currentRes.children
								},
								{
									tag: 'span',
									className: 'aras-redline__text',
									children: [itemName]
								}
							]
						};
					},
					redline_federated: function (headId, rowId, value, grid, metadata) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_mv_list: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters.mv_list;
						const currentRes = formatter(headId, rowId, value, grid, metadata)
							.children;
						const baseRes = formatter(headId, rowId, baseValue, grid, metadata)
							.children;
						return {
							children: [
								{
									tag: 'span',
									children: currentRes
								},
								{
									tag: 'span',
									className: 'aras-redline__text',
									children: baseRes
								}
							]
						};
					},
					redline_global_version: function (
						headId,
						rowId,
						value,
						grid,
						metadata
					) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_ml_string: function (headId, rowId, value, grid, metadata) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_ubigint: function (headId, rowId, value, grid, metadata) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_classification: function (
						headId,
						rowId,
						value,
						grid,
						metadata
					) {
						return window.Grid.formatters.redline_string(
							headId,
							rowId,
							value,
							grid,
							metadata
						);
					},
					redline_file: function (headId, rowId, value, grid, metadata) {
						const baseValue = metadata.getBaseValue(headId, rowId);
						const formatter = window.Grid.formatters.file;
						if (!value || !baseValue) {
							return formatter(headId, rowId, value, grid, metadata);
						}
						const currentRes = formatter(headId, rowId, value, grid, metadata);

						const baseItem = metadata.getBaseItemByCurrentItemId(rowId, headId);
						const propertyName = grid.head.get(headId, 'name') || headId;
						const fileName =
							baseItem[propertyName + '@aras.keyed_name'] || value;
						return {
							children: [
								{
									tag: 'div',
									className: 'aras-redline__container',
									children: [
										{
											tag: 'span',
											children: currentRes.children
										},
										{
											tag: 'span',
											className: 'aras-redline__text',
											children: [fileName]
										}
									]
								}
							]
						};
					}
				}
			};
		},

		fileManager: function (grid) {
			return {
				open: function (headId, rowId, fileId) {
					const dialogParams = {
						aras: aras,
						fileId: fileId,
						editable:
							grid._grid.view.defaultSettings.editable &&
							grid._grid.checkEditAvailability(headId, rowId),
						onchange: function (newFile) {
							onWidgetApplyEdit(rowId, headId, newFile);
						},
						type: 'ManageFileProperty',
						title: 'Manage File'
					};
					if (window.FilesCache && window.FilesCache[dialogParams.fileId]) {
						dialogParams.fileNode = FilesCache[dialogParams.fileId];
						dialogParams.cleanup = window.onFileNullableCheck(rowId, headId);
					}
					aras
						.getMostTopWindowWithAras()
						.ArasModules.Dialog.show('iframe', dialogParams);
				}
			};
		},

		GetColumnIndex: function (grid, columnName) {
			var index = grid.grid_Experimental.order.indexOf(columnName);
			return index === -1 ? undefined : index;
		},

		getUserData_Gm: function (store, rowId, keyOptional) {
			if (rowId === null || rowId === undefined) {
				throw new Error("The 'rowId' value cannot be null or undefined.");
			}
			var item = store._getItemByIdentity(rowId);
			if (!item) {
				return;
			}

			var key =
				keyOptional !== undefined && keyOptional !== null
					? keyOptional
					: 'key7aa8b83dArasAnyConst';
			return item.userData$Gm && item.userData$Gm[key];
		},

		setUserData_Gm: function (store, rowId, keyOrValue, value) {
			if (rowId === null || rowId === undefined) {
				throw new Error("The 'rowId' value cannot be null or undefined.");
			}
			var item = store._getItemByIdentity(rowId);
			if (!item) {
				return;
			}
			if (!item.userData$Gm) {
				item.userData$Gm = [];
			}

			if (value !== undefined) {
				item.userData$Gm[keyOrValue] = value;
			} else {
				var key = 'key7aa8b83dArasAnyConst';
				item.userData$Gm[key] = keyOrValue;
			}
		},

		moveRowUpDownForPublicGrid: function (grid, rowId, isUp) {
			var index = grid.getRowIndex(rowId),
				arrayOfAllItems = grid.grid_Experimental.store._arrayOfAllItems,
				arrayOfTopLevelItems =
					grid.grid_Experimental.store._arrayOfTopLevelItems,
				increment = isUp ? -1 : 1,
				rowAbove = arrayOfAllItems[index + increment],
				row = arrayOfAllItems[index];

			if (!row || !rowAbove) {
				return;
			}

			var itemNumPropName = grid.grid_Experimental.store._itemNumPropName,
				rowAboveNumProp = rowAbove[itemNumPropName];

			rowAbove[itemNumPropName] = row[itemNumPropName];
			row[itemNumPropName] = rowAboveNumProp;

			arrayOfTopLevelItems[index + increment] = arrayOfAllItems[
				index + increment
			] = row;
			arrayOfTopLevelItems[index] = arrayOfAllItems[index] = rowAbove;
			grid.grid_Experimental._refresh();
		}
	};
});
