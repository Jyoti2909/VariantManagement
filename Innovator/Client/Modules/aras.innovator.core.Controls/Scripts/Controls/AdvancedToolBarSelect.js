define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'Aras/Client/Controls/Experimental/_toolBar/ToolBarSelect',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin'
], function (declare, connect, ToolbarSelect, _WidgetBase, _TemplatedMixin) {
	return declare(
		'Controls.AdvancedToolBarSelect',
		[_WidgetBase, _TemplatedMixin],
		{
			_toolbarSelect: null,
			baseClass: 'advancedToolBarSelect',

			constructor: function () {
				this.inherited(arguments);

				Object.defineProperty(this, 'value', {
					get: this._getValueAttr,
					set: this._setValueAttr
				});

				Object.defineProperty(this, 'options', {
					get: this.getOptions
				});

				this._toolbarSelect = new ToolbarSelect(arguments);

				connect.connect(
					this._toolbarSelect,
					'onChange',
					function () {
						this.onChange();
					}.bind(this)
				);
			},

			onChange: function (el) {
				/// <summary>
				/// Occurs when the_toolbarSelect SelectedIndex property has changed.
				/// </summary>
				/// <param name="el" type="Aras.Client.Controls.Public.ToolbarItem"></param>
			},

			templateString:
				'<div>' +
				'<label data-dojo-attach-point="LabelBefore"></label>' +
				'<label data-dojo-attach-point="LabelAfter"></label>' +
				'</div>',

			postCreate: function () {
				this.inherited(arguments);
				this.domNode.insertBefore(this._toolbarSelect.domNode, this.LabelAfter);
			},

			setLabelAfter: function (value) {
				this.LabelAfter.innerHTML = value;
			},

			setLabelBefore: function (value) {
				this.LabelBefore.innerHTML = value;
			},

			addOption: function (option) {
				this._toolbarSelect.addOption(option);
			},

			removeOption: function (valueOrIdx) {
				this._toolbarSelect.removeOption(valueOrIdx);
			},

			updateOption: function (newOption) {
				this._toolbarSelect.updateOption(newOption);
			},

			getOptions: function () {
				return this._toolbarSelect.getOptions();
			},

			_getValueAttr: function () {
				return this._toolbarSelect.value;
			},

			_setValueAttr: function (value) {
				this._toolbarSelect.set('value', value);
			},

			_setDisabledAttr: function (value) {
				if (value.toString() === 'true') {
					this.domNode.setAttribute('disabled', value);
				} else {
					this.domNode.removeAttribute('disabled');
				}
				this._toolbarSelect.set('disabled', value);
			},

			_getDisabledAttr: function () {
				return this._toolbarSelect.get('disabled');
			}
		}
	);
});
