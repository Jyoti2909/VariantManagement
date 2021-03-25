VC.Utils.Page.LoadModules([
	'Controls/mtButton',
	'Toolbar/BasicPallete',
	'Controls/ColorPallete',
	'Interfaces/IColor',
	'Interfaces/ISize'
]);

require(['dojo/_base/declare', 'dojo/dom-construct'], function (
	declare,
	domConstruct
) {
	var strokeWidth = 'small';
	var lineColor = null;

	return dojo.setObject(
		'VC.Widgets.ScribblePalleteDialog',
		dojo.declare(
			[VC.Toolbar.BasicPallete, VC.Interfaces.ISize, VC.Interfaces.IColor],
			{
				dialogName: 'scribblePalette',

				constructor: function () {
					this.name = this.dialogName;
				},

				onSelectColor: function () {},

				postCreate: function () {
					this.inherited(arguments);

					this.btnScribble.onClick = dojo.partial(
						dojo.hitch(this, this._btnScribbleClick),
						this.btnScribble
					);
					this.btnSelect.onClick = dojo.partial(
						dojo.hitch(this, this._btnSelectClick),
						this.btnSelect
					);
					this.smallScribbleButton.onClick = dojo.partial(
						dojo.hitch(this, this._btnSmallScribbleClick),
						this.smallScribbleButton
					);
					this.mediumScribbleButton.onClick = dojo.partial(
						dojo.hitch(this, this._btnMediumScribbleClick),
						this.mediumScribbleButton
					);
					this.largeScribbleButton.onClick = dojo.partial(
						dojo.hitch(this, this._btnLargeScribbleClick),
						this.largeScribbleButton
					);

					this.colorPallete.selectColor = dojo.hitch(this, this._selectColor);

					Object.defineProperty(this, 'color', {
						get: function () {
							return this.colorPallete.value;
						},

						set: function (val) {
							lineColor = val;
							this.colorPallete.setColor(val);
						}
					});

					Object.defineProperty(this, 'size', {
						get: function () {
							return strokeWidth;
						},

						set: function (val) {
							strokeWidth = val;
						}
					});
				},

				btnScribbleClick: function () {},
				btnSelectClick: function () {},
				smallScribbleButtonClick: function () {},
				mediumScribbleButtonClick: function () {},
				largeScribbleButtonClick: function () {},

				btnDrawPressed: function () {
					this._btnScribbleClick(this.btnScribble);
					switch (strokeWidth) {
						case this.sizes.small:
							this._btnSmallScribbleClick(this.smallScribbleButton);
							break;
						case this.sizes.medium:
							this._btnMediumScribbleClick(this.mediumScribbleButton);
							break;
						case this.sizes.large:
							this._btnLargeScribbleClick(this.largeScribbleButton);
							break;
						default:
							this._btnSmallScribbleClick(this.smallScribbleButton);
					}

					if (lineColor === null || lineColor === '') {
						this.colorPallete.setColor(this.colorPallete.defaultcolor);
					}
				},

				btnSelectPressed: function () {
					this._btnSelectClick(this.btnSelect);
				},

				assignElementStatesTo: function (targetPalette) {
					this.inherited(arguments);
					this.btnScribble.SetPressedState(false);
					this.btnSelect.SetPressedState(this.btnSelect.IsPressed);
					this.assignColorTo(targetPalette);
					this.assignSizeTo(targetPalette);
				},

				resetModeButtonsStates: function () {
					this._resetManagingButtons();
				},

				setDrawButtonStates: function () {
					this._resetManagingButtons();
					this.btnScribble.SetPressedState(true);
				},

				_btnScribbleClick: function (button) {
					this._resetManagingButtons();
					button.SetPressedState(true);
					this.currentMode = VC.Utils.Enums.PalleteMode.draw;

					this.btnScribbleClick(arguments);
				},

				_btnSelectClick: function (button) {
					this._resetManagingButtons();
					button.SetPressedState(true);
					this.currentMode = VC.Utils.Enums.PalleteMode.select;

					this.btnSelectClick(arguments);
				},

				_btnSmallScribbleClick: function (button) {
					this.size = this.sizes.small;
					this._resetSizeButtons();
					button.SetPressedState(true);

					this.smallScribbleButtonClick(arguments);
				},

				_btnMediumScribbleClick: function (button) {
					this.size = this.sizes.medium;
					this._resetSizeButtons();
					button.SetPressedState(true);

					this.mediumScribbleButtonClick(arguments);
				},

				_btnLargeScribbleClick: function (button) {
					this.size = this.sizes.large;
					this._resetSizeButtons();
					button.SetPressedState(true);

					this.largeScribbleButtonClick(arguments);
				},

				_selectColor: function () {
					this.onSelectColor(arguments);
				},

				_resetManagingButtons: function () {
					this.btnScribble.SetPressedState(false);
					this.btnSelect.SetPressedState(false);
				},

				_resetSizeButtons: function () {
					this.smallScribbleButton.SetPressedState(false);
					this.mediumScribbleButton.SetPressedState(false);
					this.largeScribbleButton.SetPressedState(false);
				}
			}
		)
	);
});
