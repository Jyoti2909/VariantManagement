VC.Utils.Page.LoadModules(['Widgets/Dialog', 'Controls/Slider']);

require([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/mouse',
	'dojo/on'
], function (declare, lang, mouse, on) {
	return dojo.setObject(
		'VC.Widgets.ExplodedDialog',
		declare([VC.Widgets.Dialog], {
			dialogName: 'exploded',

			postCreate: function () {
				this.inherited(arguments);
				this.slider.changePosition = lang.hitch(
					this,
					this._changeSliderPosition
				);

				var self = this;
				on(this.dialogContainer, mouse.leave, function (e) {
					self.emitMouseEventOnDialogContainer(self.dialogContainer, 'mouseup');
					self.emitMouseEventOnDialogContainer(
						self.dialogContainer,
						'pointerup'
					); //IE 11 Specific event
				});

				this.slider.width = 218;
				VC.Utils.addClass(this.paneContent, 'ExplodedDialogContainer');

				Object.defineProperty(this, 'sliderValue', {
					get: function () {
						return this.slider.value;
					},
					set: function (value) {
						this.slider.value = value;
						this.slider.set('value', value);
					}
				});
			},

			emitMouseEventOnDialogContainer: function (element, eventName) {
				on.emit(element, eventName, {
					bubbles: true,
					cancelable: true,
					button: 0
				});
			},

			changeSliderPosition: function () {},

			_changeSliderPosition: function () {
				this.changeSliderPosition(arguments);
			}
		})
	);
});
