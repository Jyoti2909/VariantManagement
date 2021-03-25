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
	var fontSize = 'medium';
	var lineColor = null;

	return dojo.setObject(
		'VC.Widgets.LabelPalleteDialog',
		dojo.declare(
			[VC.Toolbar.BasicPallete, VC.Interfaces.ISize, VC.Interfaces.IColor],
			{
				dialogName: 'labelPalette',

				constructor: function () {
					this.name = this.dialogName;
				},

				postCreate: function () {
					this.inherited(arguments);

					this.btnLabel.onClick = dojo.partial(
						dojo.hitch(this, this._btnLabelClick),
						this.btnLabel
					);
					this.btnSelect.onClick = dojo.partial(
						dojo.hitch(this, this._btnSelectClick),
						this.btnSelect
					);
					this.smallLabelButton.onClick = dojo.partial(
						dojo.hitch(this, this._btnSmallLabelClick),
						this.smallLabelButton
					);
					this.mediumLabelButton.onClick = dojo.partial(
						dojo.hitch(this, this._btnMediumLabelClick),
						this.mediumLabelButton
					);
					this.largeLabelButton.onClick = dojo.partial(
						dojo.hitch(this, this._btnLargeLabelClick),
						this.largeLabelButton
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
							return fontSize;
						},

						set: function (val) {
							fontSize = val;
						}
					});
				},

				btnLabelClick: function () {},
				btnSelectClick: function () {},
				smallLabelButtonClick: function () {},
				mediumLabelButtonClick: function () {},
				largeLabelButtonClick: function () {},
				onSelectColor: function () {},

				btnDrawPressed: function () {
					this._btnLabelClick(this.btnLabel);

					switch (fontSize) {
						case this.sizes.small:
							this._btnSmallLabelClick(this.smallLabelButton);
							break;
						case this.sizes.medium:
							this._btnMediumLabelClick(this.mediumLabelButton);
							break;
						case this.sizes.large:
							this._btnLargeLabelClick(this.largeLabelButton);
							break;
						default:
							this._btnMediumLabelClick(this.mediumLabelButton);
					}

					if (lineColor === null || lineColor === '') {
						this.colorPallete.setColor(this.colorPallete.defaultcolor);
					}
				},

				btnSelectPressed: function () {
					this._btnSelectClick(this.selectButton);
				},

				assignElementStatesTo: function (targetPalette) {
					this.inherited(arguments);
					this.btnLabel.SetPressedState(false);
					this.btnSelect.SetPressedState(this.btnSelect.IsPressed);
					this.assignColorTo(targetPalette);
					this.assignSizeTo(targetPalette);
				},

				resetModeButtonsStates: function () {
					this._resetManagingButtons();
				},

				setDrawButtonStates: function () {
					this._resetManagingButtons();
					this.btnLabel.SetPressedState(true);
				},

				_btnLabelClick: function (button) {
					this._resetManagingButtons();
					button.SetPressedState(true);
					this.currentMode = VC.Utils.Enums.PalleteMode.draw;

					this.btnLabelClick(arguments);
				},

				_btnSelectClick: function (button) {
					this._resetManagingButtons();
					button.SetPressedState(true);
					this.currentMode = VC.Utils.Enums.PalleteMode.select;

					this.btnSelectClick(arguments);
				},

				_btnSmallLabelClick: function (button) {
					this.size = this.sizes.small;
					this._resetSizeButtons();
					button.SetPressedState(true);

					this.smallLabelButtonClick(arguments);
				},

				_btnMediumLabelClick: function (button) {
					this.size = this.sizes.medium;
					this._resetSizeButtons();
					button.SetPressedState(true);

					this.mediumLabelButtonClick(arguments);
				},

				_btnLargeLabelClick: function (button) {
					this.size = this.sizes.large;
					this._resetSizeButtons();
					button.SetPressedState(true);

					this.largeLabelButtonClick(arguments);
				},

				_selectColor: function () {
					this.onSelectColor(arguments);
				},

				_resetManagingButtons: function () {
					this.btnLabel.SetPressedState(false);
					this.btnSelect.SetPressedState(false);
				},

				_resetSizeButtons: function () {
					this.smallLabelButton.SetPressedState(false);
					this.mediumLabelButton.SetPressedState(false);
					this.largeLabelButton.SetPressedState(false);
				}
			}
		)
	);
});
