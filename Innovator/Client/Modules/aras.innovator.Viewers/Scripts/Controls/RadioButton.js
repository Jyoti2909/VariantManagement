require([
	'dojo/_base/fx',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/query'
], dojo.hitch(this, function (
	baseFx,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	query
) {
	return dojo.setObject(
		'VC.Widgets.RadioButton',
		dojo.declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			text: null,
			groupName: null,

			templateString:
				'<div class="RadioButtonContainer">' +
				'<div data-dojo-attach-point="RadioButton" class="RadioButton"></div>' +
				'<span data-dojo-attach-point="RadioButtonText" class="RadioButtonText"></span>' +
				'</div>',
			widgetsInTemplate: true,

			onChange: function () {},

			postCreate: function () {
				if (this.text !== null) {
					this.RadioButtonText.textContent = this.text;
				}

				if (this.groupName !== null) {
					this.RadioButton.setAttribute('name', this.groupName);
				}

				this.RadioButton.id = 'RadioButton' + VC.Utils.getTimestampString();
				this.RadioButton.onclick = dojo.hitch(this, this._onRadioButtonClick);

				Object.defineProperty(this, 'isChecked', {
					get: function () {
						var returnedValue = false;
						var checked = this.RadioButton.getAttribute('checked');

						if (checked && checked === 'checked') {
							returnedValue = true;
						}

						return returnedValue;
					},
					set: function (value) {
						if (value) {
							var groupedRadiobuttons = query(
								".RadioButtonContainer div.RadioButton[name='" +
									this.groupName +
									"']"
							);

							for (var i = 0; i < groupedRadiobuttons.length; i++) {
								groupedRadiobuttons[i].removeAttribute('checked');
							}

							this.check();
						} else {
							this.uncheck();
						}
					}
				});
			},

			_onRadioButtonClick: function (e) {
				this.isChecked = true;
				this.onChange();
			},

			check: function () {
				this.RadioButton.setAttribute('checked', 'checked');
			},

			uncheck: function () {
				this.RadioButton.removeAttribute('checked');
			}
		})
	);
}));
