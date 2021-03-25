define(['dojo', 'dojo/_base/declare', 'dojo/date/locale'], function (
	dojo,
	declare,
	locale
) {
	return declare('ES.WrappedGrid', null, {
		constructor: function () {
			this._grid = null;
			this._initialized = false;
			this._columns = [];

			//Grid properties
			this.multiselect = true;
			this.editable = false;
			this.selectable = true;
		},

		//Create new instance
		createControl: function (connectId, callback) {
			var self = this;

			clientControlsFactory.createControl(
				'Aras.Client.Controls.Public.GridContainer',
				{ connectId: connectId },
				function (control) {
					self._grid = control;
					self._internalGrid = self._getInternalGrid();
					callback();
					self._initialized = true;
				}
			);
		},

		//Add new event handler
		on: function (eventName, eventHandler) {
			var control = null;
			switch (eventName) {
				case 'onCellClick':
					control = this._getInternalGrid();
					break;
				default:
					control = this.getControl();
			}
			clientControlsFactory.on(control, eventName, eventHandler);
		},

		//Get native control
		getControl: function () {
			return this._grid;
		},

		/**
		 * Get row as object by index
		 *
		 * @param {string} rowIndex Row index
		 * @returns {object} Row object
		 */
		getItem: function (rowIndex) {
			return this._internalGrid.getItem(rowIndex);
		},

		//Get grid cells
		getCells: function () {
			return this._getInternalGrid().layout.cells;
		},

		//Get column order of native control
		getColumnOrder: function (columnIndex) {
			return this.getControl().getColumnOrder(columnIndex);
		},

		//Get column index of native control
		getColumnIndex: function (columnName) {
			return this.getControl().getColumnIndex(columnName);
		},

		//Init grid
		init: function () {
			//Build grid xml
			var xml = '<table multiselect="{0}" editable="{1}" selectable="{2}">'
				.replace('{0}', this.multiselect ? 'true' : 'false')
				.replace('{1}', this.editable ? 'true' : 'false')
				.replace('{2}', this.selectable ? 'true' : 'false');

			var theadXml = '<thead>';
			var columnsXml = '<columns>';
			var order = 0;

			for (var i = 0; i < this._columns.length; i++) {
				var column = this._columns[i];

				theadXml += '<th align="c">{0}</th>'.replace('{0}', column.title);

				columnsXml += '<column width="{0}" edit="{1}" colname="{2}" align="{3}" order="{4}" />'
					.replace('{0}', column.width)
					.replace('{1}', column.type)
					.replace('{2}', column.name)
					.replace('{3}', column.align)
					.replace('{4}', order++);
			}
			theadXml += '</thead>';
			columnsXml += '</columns>';

			xml += theadXml + columnsXml;
			xml += '</table>';

			this.getControl().InitXML(xml);
		},

		//Add new column
		//type: 'TEXT', 'CHECKBOX', 'DATE', 'IMAGE'
		//align (left, center, right): 'l', 'c', 'r'
		addColumn: function (name, title, type, width, align) {
			if (this._isNullOrUndefined(name) || name === '') {
				name = ' ';
			}
			if (this._isNullOrUndefined(title) || title === '') {
				title = ' ';
			}
			if (this._isNullOrUndefined(type)) {
				type = 'TEXT';
			}
			if (this._isNullOrUndefined(width)) {
				width = 50;
			}
			if (this._isNullOrUndefined(align)) {
				align = 'l';
			}

			this._columns.push({
				name: name,
				title: title,
				width: width,
				align: align,
				type: type
			});
		},

		//Set background color in specified cell
		setCellBackgroundColor: function (column, row, color) {
			this._getCell(row, column).SetBgColor(color);
		},

		//Destroy grid
		destroy: function () {
			if (this._initialized) {
				this.getControl().destroy();
				this._initialized = false;
			}
		},

		//Set value of the specified cell
		setCellValue: function (column, row, value) {
			var realColumn = this.getCells()[column];
			var editableType = realColumn.editableType;
			var uiValue = 'undefined';

			switch (editableType) {
				case 'checkbox':
					uiValue = '<checkbox value="' + value + '" />';
					break;
				case 'date':
					if (value) {
						var date = new Date(value + 'Z'); // date will be created with current timezone shift
						date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
						uiValue = locale.format(date, {
							selector: 'date_time',
							formatLength: 'medium',
							locale: dojoConfig.locale
						});
					} else {
						uiValue = '';
					}
					break;
				case 'item':
					this._getCell(row, realColumn.layoutIndex).SetLink(
						"'" + value.type + "'" + ",'" + value.id + "'"
					);
					uiValue = value.name;
					break;
				case 'image':
					uiValue = !this._isNullOrUndefined(value)
						? "<img src='" + value + "'>"
						: '';
					break;
				case 'text':
					uiValue = value;
					break;
				default:
					break;
			}

			this._getCell(row, realColumn.layoutIndex).SetValue(uiValue);
		},

		//Get value of the specified cell
		getCellValue: function (column, row) {
			return this._getCell(row, this.getCells()[column].layoutIndex).GetValue();
		},

		//Get internal grid
		_getInternalGrid: function () {
			// jscs:disable
			return this.getControl().grid_Experimental;
			// jscs:enable
		},

		//Get the specified cell
		_getCell: function (row, column) {
			// jscs:disable
			return this.getControl().Cells_Experimental(row, column);
			// jscs:enable
		},

		//Get the specified cell, public method
		getCell: function (row, column) {
			return this._getCell(row, column);
		},

		//Get column order by name
		getColumnOrderByName: function (columnName) {
			return this._getInternalGrid().order.indexOf(
				this.getColumnOrder(this.getColumnIndex(columnName))
			);
		},

		//Get the index of specified row
		getRowIndex: function (rowId) {
			return this.getControl().GetRowIndex(rowId);
		},

		//Get column count
		getColumnCount: function () {
			return this.getControl().getColumnCount();
		},

		//Returns a list of selected rows' ids separated by specified separator
		getSelectedItemIDs: function (separator) {
			return this.getControl().getSelectedItemIDs(separator);
		},

		//Remove all grid rows
		removeAllRows: function () {
			return this.getControl().removeAllRows();
		},

		//Add the row with specified id
		addRow: function (rowId, text, skipImmediateUpdate) {
			this.getControl().AddRow(rowId, text, skipImmediateUpdate);
		},

		_isNullOrUndefined: function (variable) {
			return typeof variable === 'undefined' || variable === null;
		},

		//Get editable type of internal grid control
		_getEditableType: function (columnIndex) {
			return this._getInternalGrid().getCell(columnIndex).editableType;
		},

		//Get menu of the grid control
		getMenu: function () {
			return this.getControl().getMenu();
		},

		//Get menu of the grid control
		addMenuItem: function (id, label) {
			this.getMenu().add(id, label);
		},

		//Blur RMB menu
		blurMenu: function () {
			this.getMenu().menu._onBlur();
		},

		/**
		 * Returns cell edit type depends on parameter
		 *
		 * @return {string} edit type
		 */
		getEditType: function (editType) {
			switch (editType) {
				case 'date':
					return 'date';
				case 'boolean':
					return 'checkbox';
				case 'item':
					return 'item';
				case 'image':
					return 'image';
				default:
					return 'text';
			}
		}
	});
});
