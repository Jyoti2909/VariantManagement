/* global define */
define([
	'dojo/_base/declare',
	'./BooleanCellEditor',
	'./ComboCellEditor',
	'./DateCellEditor',
	'./ListCellEditor',
	'./StringCellEditor',
	'./TextareaCellEditor',
	'./ImageCellEditor',
	'./FileCellEditor',
	'./IntegerCellEditor',
	'./FloatCellEditor'
], function (
	declare,
	BooleanCellEditor,
	ComboCellEditor,
	DateCellEditor,
	ListCellEditor,
	StringCellEditor,
	TextareaCellEditor,
	ImageCellEditor,
	FileCellEditor,
	IntegerCellEditor,
	FloatCellEditor
) {
	return declare(null, {
		_booleanCellEditor: null,
		_comboCellEditor: null,
		_dateCellEditor: null,
		_listCellEditor: null,
		_stringCellEditor: null,
		_textareaCellEditor: null,
		_imageCellEditor: null,
		_fileCellEditor: null,
		_integerCellEditor: null,
		_floatCellEditor: null,

		_active: null,

		constructor: function (aras) {
			this._booleanCellEditor = new BooleanCellEditor();
			this._comboCellEditor = new ComboCellEditor();
			this._dateCellEditor = new DateCellEditor(aras);
			this._listCellEditor = new ListCellEditor();
			this._stringCellEditor = new StringCellEditor();
			this._textareaCellEditor = new TextareaCellEditor();
			this._imageCellEditor = new ImageCellEditor();
			this._fileCellEditor = new FileCellEditor();
			this._integerCellEditor = new IntegerCellEditor();
			this._floatCellEditor = new FloatCellEditor(aras);
		},

		show: function (cell, onCellEditorClosed, isViewMode) {
			if (isViewMode) {
				this._active = this._textareaCellEditor;
			} else {
				var editorType = (cell.column.editorType || '').toLowerCase();
				if (editorType === 'property default') {
					var dataType = (cell.column.dataType || '').toLowerCase();
					switch (dataType) {
						case 'boolean':
							this._active = this._booleanCellEditor;
							break;
						case 'date':
							this._active = this._dateCellEditor;
							break;
						case 'string':
						//double aren't in requirements, so it was left without validators/convertors. To remove or to add validators in future.
						case 'double':
							this._active = this._stringCellEditor;
							break;
						case 'integer':
							this._active = this._integerCellEditor;
							break;
						case 'text':
							this._active = this._textareaCellEditor;
							break;
						case 'image':
							this._active = this._imageCellEditor;
							break;
						case 'file':
							this._active = null;
							//this._active = this._fileCellEditor;
							break;
						case 'float':
							this._active = this._floatCellEditor;
							break;
						default:
							this._active = null;
							break;
					}
				} else {
					switch (editorType) {
						case 'unbound combo':
							this._active = this._comboCellEditor;
							break;
						case 'bound list':
							this._active = this._listCellEditor;
							break;
						default:
							this._active = null;
							break;
					}
				}
			}

			if (this._active) {
				this._active.isHidden = false;
				this._active.show(cell, onCellEditorClosed, isViewMode);
			}

			if (this._active && this._active.tooltipDialog) {
				var handler = this._active.tooltipDialog.on(
					'blur',
					function () {
						if (
							onCellEditorClosed &&
							this._active.hideOnBlur &&
							!this._active.isHidden
						) {
							onCellEditorClosed();
							this._active.isHidden = true;
						}
					}.bind(this)
				);
				this._active.handlers.push(handler);
			}
		},

		hide: function () {
			if (this._active) {
				this._active.hide();
				this._active.isHidden = true;
			}
		},

		isHidden: function () {
			if (this._active) {
				return this._active.isHidden;
			}
			return false;
		},

		getFormatter: function (dataType) {
			if (!dataType) {
				return null;
			}

			var formatter;
			switch (dataType.toLowerCase()) {
				case 'boolean':
					formatter = this._booleanCellEditor.formatter;
					break;
				case 'date':
					formatter = this._dateCellEditor.formatter;
					break;
			}

			return formatter;
		},

		isValueValid: function () {
			if (!this._active) {
				return false;
			}
			return this._active.isValueValid ? this._active.isValueValid() : true;
		},

		getValue: function () {
			return this._active.getValue();
		}
	});
});
