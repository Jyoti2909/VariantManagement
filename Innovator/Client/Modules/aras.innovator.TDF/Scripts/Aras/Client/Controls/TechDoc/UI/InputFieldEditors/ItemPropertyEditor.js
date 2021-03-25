define([
	'dojo/_base/declare',
	'./StringItemPropertyEditor',
	'./TextItemPropertyEditor',
	'./BooleanItemPropertyEditor',
	'./DateItemPropertyEditor'
], function (
	declare,
	StringItemPropertyEditor,
	TextItemPropertyEditor,
	BooleanItemPropertyEditor,
	DateItemPropertyEditor
) {
	return declare(null, {
		_activeDialog: null,
		_propertyEditors: null,
		aras: null,

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this.aras = initialParameters.aras;

			this._propertyEditors = {};
		},

		_buildPropertyEditor: function (editorType) {
			switch (editorType) {
				case 'string':
				case 'integer':
				case 'float':
				case 'decimal':
					return new StringItemPropertyEditor({
						owner: this,
						aras: this.aras,
						editorParameters: {
							titleLabel: true
						}
					});
				case 'text':
					return new TextItemPropertyEditor({
						owner: this,
						aras: this.aras,
						editorParameters: {
							titleLabel: true
						}
					});
				case 'boolean':
					return new BooleanItemPropertyEditor({
						owner: this,
						aras: this.aras,
						editorParameters: {
							titleLabel: true,
							resultType: 'intstring'
						}
					});
				case 'date':
					return new DateItemPropertyEditor({
						owner: this,
						aras: this.aras,
						editorParameters: {
							titleLabel: true
						}
					});
				default:
					const errorMessage = this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'itemproperty.editortypenotsupported',
						editorType
					);
					this.aras.AlertError(errorMessage);
			}
		},

		getPropertyEditor: function (editorType) {
			const editorsCache = this._propertyEditors;

			return (
				editorsCache[editorType] ||
				(editorsCache[editorType] = this._buildPropertyEditor(editorType))
			);
		},

		show: function (editorParameters) {
			editorParameters = editorParameters || {};

			this._activeDialog = this.getPropertyEditor(editorParameters.type);

			return Promise.resolve(
				this._activeDialog && this._activeDialog.show(editorParameters)
			);
		},

		hide: function () {
			if (this._activeDialog) {
				this._activeDialog.hide();
			}
		},

		isVisible: function () {
			return this._activeDialog && this._activeDialog.isVisible();
		},

		getValue: function () {
			return this._activeDialog && this._activeDialog.getValue();
		},

		setValue: function (newValue) {
			return this._activeDialog && this._activeDialog.setValue(newValue);
		}
	});
});
