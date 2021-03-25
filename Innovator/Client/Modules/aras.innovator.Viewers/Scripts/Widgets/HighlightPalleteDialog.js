VC.Utils.Page.LoadModules([
	'Controls/mtButton',
	'Toolbar/BasicPallete',
	'Controls/ColorPallete',
	'Interfaces/IColor'
]);

require(['dojo/_base/declare'], function (declare) {
	var backgroundColor = null;

	return dojo.setObject(
		'VC.Widgets.HighlightPalleteDialog',
		dojo.declare([VC.Toolbar.BasicPallete, VC.Interfaces.IColor], {
			dialogName: 'highlightPalette',

			constructor: function () {
				this.name = this.dialogName;
			},

			postCreate: function () {
				this.inherited(arguments);

				this.btnHighlight.onClick = dojo.partial(
					dojo.hitch(this, this._btnHighlightClick),
					this.btnHighlight
				);
				this.btnSelect.onClick = dojo.partial(
					dojo.hitch(this, this._btnSelectClick),
					this.btnSelect
				);
				this.colorPallete.selectColor = dojo.hitch(this, this._selectColor);

				Object.defineProperty(this, 'color', {
					get: function () {
						return this.colorPallete.value;
					},

					set: function (val) {
						backgroundColor = val;
						this.colorPallete.setColor(val);
					}
				});
				Object.defineProperty(this, 'rgbaColor', {
					get: function () {
						return VC.Utils.convertHexToRGBA(this.colorPallete.value, '0.5');
					}
				});
			},

			btnHighlightClick: function () {},
			btnSelectClick: function () {},
			onSelectColor: function () {},

			btnDrawPressed: function () {
				this._btnHighlightClick(this.btnHighlight);

				if (backgroundColor === null || backgroundColor === '') {
					this.colorPallete.setColor(this.colorPallete.defaultcolor);
				}
			},

			btnSelectPressed: function () {
				this._btnSelectClick(this.btnSelect);
			},

			_btnHighlightClick: function (button) {
				this._resetManagingButtonsState();
				button.SetPressedState(true);
				this.currentMode = VC.Utils.Enums.PalleteMode.draw;

				this.btnHighlightClick(arguments);
			},

			_btnSelectClick: function (button) {
				this._resetManagingButtonsState();
				button.SetPressedState(true);
				this.currentMode = VC.Utils.Enums.PalleteMode.select;

				this.btnSelectClick(arguments);
			},

			_selectColor: function () {
				this.onSelectColor(arguments);
			},

			_resetManagingButtonsState: function () {
				this.btnHighlight.SetPressedState(false);
				this.btnSelect.SetPressedState(false);
			},

			assignElementStatesTo: function (targetPalette) {
				this.inherited(arguments);
				this.btnHighlight.SetPressedState(false);
				this.btnSelect.SetPressedState(this.btnSelect.IsPressed);
				this.assignColorTo(targetPalette);
			},

			resetModeButtonsStates: function () {
				this._resetManagingButtonsState();
			},

			setDrawButtonStates: function () {
				this._resetManagingButtonsState();
				this.btnHighlight.SetPressedState(true);
			}
		})
	);
});
