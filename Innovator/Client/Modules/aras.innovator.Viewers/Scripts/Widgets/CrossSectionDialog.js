VC.Utils.Page.LoadModules([
	'Widgets/Dialog',
	'Controls/mtButton',
	'Controls/Checkbox'
]);

require(['dojo/_base/declare', 'dojo/_base/lang'], function (declare, lang) {
	return dojo.setObject(
		'VC.Widgets.CrossSectionDialog',
		declare([VC.Widgets.Dialog], {
			dialogName: 'crossSection',
			planeButtons: [],
			initialCappingGeometryState: null,

			constructor: function (args) {
				args = args || {};

				this.initialCappingGeometryState = VC.Utils.isNotNullOrUndefined(
					args.cappingGeometryState
				)
					? args.cappingGeometryState
					: false;
			},

			postCreate: function () {
				this.inherited(arguments);
				this.planeButtons = [
					this.xButton,
					this.yButton,
					this.zButton,
					this.pButton
				];

				this.xButton.onClick = dojo.partial(
					lang.hitch(this, this._xButtonClick),
					this.xButton
				);
				this.yButton.onClick = dojo.partial(
					lang.hitch(this, this._yButtonClick),
					this.yButton
				);
				this.zButton.onClick = dojo.partial(
					lang.hitch(this, this._zButtonClick),
					this.zButton
				);
				this.pButton.onClick = dojo.partial(
					lang.hitch(this, this._pButtonClick),
					this.pButton
				);
				this.ixButton.onClick = dojo.partial(
					lang.hitch(this, this._ixButtonClick),
					this.ixButton
				);
				this.iyButton.onClick = dojo.partial(
					lang.hitch(this, this._iyButtonClick),
					this.iyButton
				);
				this.izButton.onClick = dojo.partial(
					lang.hitch(this, this._izButtonClick),
					this.izButton
				);
				this.ipButton.onClick = dojo.partial(
					lang.hitch(this, this._ipButtonClick),
					this.ipButton
				);
				this.tcpsButton.onClick = dojo.partial(
					lang.hitch(this, this._toggleCuttingPlaneSection),
					this.tcpsButton
				);
				this.tcpvButton.onClick = dojo.partial(
					lang.hitch(this, this._toggleCuttingPlaneVisibility),
					this.tcpvButton
				);

				this._initCappingGeometryCheckboxState(
					this.initialCappingGeometryState
				);
				this.checkboxСappingGeometry.onChange = dojo.partial(
					lang.hitch(this, this._showCappingGeometry),
					this.checkboxСappingGeometry
				);
				this.zButton.SetPressedState(true);
				this.ixButton.IsDisable = true;
				this.iyButton.IsDisable = true;
				this.ipButton.IsDisable = true;
				this.tcpsButton.IsDisable = true;

				VC.Utils.addClass(this.paneContent, 'CrossSectionDialogContainer');
			},

			onXButtonClick: function () {},
			onYButtonClick: function () {},
			onZButtonClick: function () {},
			onPButtonClick: function () {},
			onIXButtonClick: function () {},
			onIYButtonClick: function () {},
			onIZButtonClick: function () {},
			onIPButtonClick: function () {},
			onShowCappingGeometry: function () {},
			onToggleCuttingPlaneVisibility: function () {},
			onToggleCuttingPlaneSection: function () {},
			onSetCuttingPlaneVisibility: function () {},
			onSetCuttingPlaneSectionMode: function () {},
			onResetCuttingPlanes: function () {},
			onHasSelectedFace: function () {
				return false;
			},

			hasActivatedPlanes: function () {
				return (
					this.xButton.IsPressed ||
					this.yButton.IsPressed ||
					this.zButton.IsPressed
				);
			},

			setButtonsAvailability: function (button, iButton) {
				if (button.IsPressed) {
					iButton.Enable();
				} else {
					iButton.Disable();
					iButton.SetPressedState(false);
				}

				var pressedButtons = this.planeButtons.filter(function (obj) {
					return obj.IsPressed === true;
				});

				if (pressedButtons.length > 0) {
					this.tcpvButton.Enable();
				} else {
					this.tcpvButton.Disable();
					this.tcpvButton.SetPressedState(false);
					this.onSetCuttingPlaneVisibility(true);
				}

				if (pressedButtons.length > 1) {
					this.tcpsButton.Enable();
				} else {
					this.tcpsButton.Disable();
					this.tcpsButton.SetPressedState(false);
					this.onSetCuttingPlaneSectionMode(true);
				}
			},

			_initCappingGeometryCheckboxState: function () {
				if (this.initialCappingGeometryState) {
					this.checkboxСappingGeometry.check();
				} else {
					this.checkboxСappingGeometry.uncheck();
				}
			},

			_xButtonClick: function (button) {
				button.SetPressedState(!button.IsPressed);
				this.setButtonsAvailability(button, this.ixButton);
				this.onXButtonClick(arguments);
			},

			_yButtonClick: function (button) {
				button.SetPressedState(!button.IsPressed);
				this.setButtonsAvailability(button, this.iyButton);

				this.onYButtonClick(arguments);
			},

			_zButtonClick: function (button) {
				button.SetPressedState(!button.IsPressed);
				this.setButtonsAvailability(button, this.izButton);

				this.onZButtonClick(arguments);
			},

			_pButtonClick: function (button) {
				if (button.IsPressed || this.onHasSelectedFace()) {
					button.SetPressedState(!button.IsPressed);
					this.setButtonsAvailability(button, this.ipButton);

					this.onPButtonClick(arguments);
				}
			},

			_ixButtonClick: function (button) {
				button.SetPressedState(!button.IsPressed);

				this.onIXButtonClick(arguments);
			},

			_iyButtonClick: function (button) {
				button.SetPressedState(!button.IsPressed);

				this.onIYButtonClick(arguments);
			},

			_izButtonClick: function (button) {
				button.SetPressedState(!button.IsPressed);

				this.onIZButtonClick(arguments);
			},

			_ipButtonClick: function (button) {
				button.SetPressedState(!button.IsPressed);

				this.onIPButtonClick(arguments);
			},

			_showCappingGeometry: function (checkbox) {
				this.onShowCappingGeometry(checkbox.isChecked);
			},

			_toggleCuttingPlaneVisibility: function (button) {
				button.SetPressedState(!button.IsPressed);

				this.onToggleCuttingPlaneVisibility();
			},

			_toggleCuttingPlaneSection: function (button) {
				button.SetPressedState(!button.IsPressed);

				this.onToggleCuttingPlaneSection();
			},

			resetDialogContentState: function () {
				this.xButton.SetPressedState(false);
				this.yButton.SetPressedState(false);
				this.zButton.SetPressedState(false);
				this.pButton.SetPressedState(false);
				this.ixButton.SetPressedState(false);
				this.iyButton.SetPressedState(false);
				this.izButton.SetPressedState(false);
				this.ipButton.SetPressedState(false);
				this.tcpsButton.SetPressedState(false);
				this.tcpvButton.SetPressedState(false);
				this.ixButton.Disable();
				this.iyButton.Disable();
				this.izButton.Disable();
				this.ipButton.Disable();
				this.tcpsButton.Disable();

				this.onResetCuttingPlanes();
			}
		})
	);
});
