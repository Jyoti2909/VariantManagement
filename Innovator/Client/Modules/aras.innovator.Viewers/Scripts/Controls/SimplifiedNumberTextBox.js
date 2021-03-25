require([
	'dojo/_base/fx',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/keys',
	'dojo/on'
], dojo.hitch(this, function (
	baseFx,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	keys,
	on
) {
	var borders = 2;
	var integerRegExp = new RegExp('^(\\d+)$');
	var allowDecimalsRegExp = new RegExp('^(\\d+\\.?\\d*)$');

	return dojo.setObject(
		'VC.Widgets.SimplifiedNumberTextBox',
		dojo.declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			maximumValue: 1000000,
			minimumValue: 0.000001,
			width: null,
			isValid: null,
			oldValue: 1,
			allowEmptyValue: true,
			allowDecimals: false,

			templateString:
				'<span><input data-dojo-attach-point="NumberTextbox" class="TextBox" type="text"/></span>',
			widgetsInTemplate: true,

			onChange: function () {},

			constructor: function () {
				this.isValid = true;

				Object.defineProperty(this, 'minValue', {
					set: function (value) {
						this.minimumValue = value;
					}
				});

				Object.defineProperty(this, 'maxValue', {
					set: function (value) {
						this.maximumValue = value;
					}
				});

				Object.defineProperty(this, 'value', {
					get: function () {
						var returnedValue = '';

						if (this.NumberTextbox.value !== '') {
							returnedValue = +this.NumberTextbox.value;
						}

						return returnedValue;
					},
					set: function (value) {
						this._validateValue(value);

						if (this.isValid) {
							this.NumberTextbox.value = value;
						}
					}
				});
			},

			postCreate: function () {
				this.NumberTextbox.style.width = this.width - borders + 'px';

				on(
					this.NumberTextbox,
					'keyup',
					dojo.hitch(this, function (e) {
						this._onTextChange(e);
					})
				);
				on(
					this.NumberTextbox,
					'blur',
					dojo.hitch(this, function (e) {
						this._onTextBlur(e);
					})
				);
			},

			disable: function () {
				this.NumberTextbox.disable(true);
			},

			enable: function () {
				this.NumberTextbox.disable(false);
			},

			_onTextChange: function (e) {
				this._validateValue(this.NumberTextbox.value);

				var charOrCode = e.charCode || e.keyCode;
				if (charOrCode === VC.Utils.Enums.AffectedKey.ENTER) {
					this._onTextBlur(e);
				}
			},

			_onTextBlur: function (e) {
				this._validateValue(this.NumberTextbox.value);
				if (!this.isValid) {
					this.value = this.oldValue;
				} else {
					this.oldValue = this.value;
					this.onChange();
				}
			},
			_validateValue: function (value) {
				if (this.allowEmptyValue && value === '') {
					this.isValid = true;
				} else {
					var regExp = this.allowDecimals ? allowDecimalsRegExp : integerRegExp;
					var match = value.toString().match(regExp);

					if (match === null) {
						this.isValid = false;
					} else if (+value < this.minimumValue || +value > this.maximumValue) {
						this.isValid = false;
					} else {
						this.isValid = true;
					}
				}

				if (this.isValid) {
					this.NumberTextbox.style.border = '1px solid #505050';
				} else {
					this.NumberTextbox.style.border = '1px solid red';
				}
			}
		})
	);
}));
