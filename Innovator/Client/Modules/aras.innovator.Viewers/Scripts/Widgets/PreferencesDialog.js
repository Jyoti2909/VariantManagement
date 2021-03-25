VC.Utils.Page.LoadModules([
	'Controls/RadioButton',
	'Controls/SimplifiedNumberTextBox',
	'Widgets/Dialog'
]);
require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Widgets.PreferencesDialog',
		dojo.declare([VC.Widgets.Dialog], {
			dialogName: 'preferences',
			isFireOnChangeScalingValueEvent: false,

			onChangeScalingValue: function () {},
			onSelectDefaultResolution: function () {},
			onSelectCustomResolution: function () {},

			constructor: function () {
				Object.defineProperty(this, 'scaling', {
					get: function () {
						return this.scale.value;
					},
					set: function (value) {
						this.scale.value = value;
					}
				});
			},

			postCreate: function () {
				this.inherited(arguments);

				this.scale.NumberTextbox.setAttribute('tabIndex', '-1');
				this.scale.onChange = dojo.hitch(this, this._onChangeScalingValue);
				this.defaultResolution.onChange = dojo.hitch(
					this,
					this._onSelectDefaultResolution
				);
				this.customResolution.onChange = dojo.hitch(
					this,
					this._onSelectCustomResolution
				);

				VC.Utils.addClass(this.paneContent, 'PreferencesDialogContainer');

				this.defaultResolution.isChecked = true;
				this.scale.allowEmptyValue = false;
				this.hideScale();
			},

			_onChangeScalingValue: function () {
				var self = this;
				this.isFireOnChangeScalingValueEvent = true;
				// IR-048108 SSVC: Scale isn't changed when select system default resolution
				// This is workaround of this issue:
				// Change of DPI happens when we click on radiobuttons, when we press "Enter" on the text field and when the text field losts focus.
				// When the cursor in the text field and we click on the "Use system default" radiobutton then change of DPI happens twice times in a row.
				// Any change of DPI triggers scale's change.
				// Since scale can be changed only one time per 500 milliseconds, second change dont works.
				setTimeout(function () {
					if (self.isFireOnChangeScalingValueEvent) {
						self.onChangeScalingValue();
					}
				}, 100);
			},

			_onSelectDefaultResolution: function () {
				this.isFireOnChangeScalingValueEvent = false;
				this.onSelectDefaultResolution();
				this.hideScale();
			},

			_onSelectCustomResolution: function () {
				this.onSelectCustomResolution();
				this.showScale();
			},

			showScale: function () {
				this.scale.enable();
			},

			hideScale: function () {
				this.scale.disable();
			}
		})
	);
});
