VC.Utils.Page.LoadModules(['Widgets/Dialog', 'Toolbar/BasicToolBar']);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Toolbar.BasicPallete',
		dojo.declare([VC.Toolbar.BasicToolbar, VC.Widgets.Dialog], {
			currentMode: null,

			postCreate: function () {
				this.inherited(arguments);

				VC.Utils.addClass(
					this.paneContent,
					VC.Utils.Constants.cssClasses.onlyButtons
				);
			},

			btnDrawPressed: function () {
				throw new Error('BasicPallete: btnDrawPressed must be overloaded');
			},

			btnSelectPressed: function () {
				throw new Error('BasicPallete: btnSelectPressed must be overloaded');
			},

			resetModeButtonsStates: function () {
				throw new Error(
					'BasicPallete: resetModeButtonsStates must be overloaded'
				);
			},

			setDrawButtonStates: function myfunction() {
				throw new Error('BasicPallete: setDrawButtonStates must be overloaded');
			},

			show: function (mode) {
				this.inherited(arguments);

				switch (mode) {
					case VC.Utils.Enums.PalleteMode.draw:
						this.btnDrawPressed();
						break;

					case VC.Utils.Enums.PalleteMode.select:
						this.btnSelectPressed();
						break;
				}
			},

			hide: function () {
				this.inherited(arguments);
			},

			onCancel: function () {
				this.inherited(arguments);
				this.btnSelectPressed();
			}
		})
	);
});

VC.Toolbar.BasicPallete.Mode = { draw: 'draw', select: 'select' };
