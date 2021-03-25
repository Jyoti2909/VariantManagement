VC.Utils.Page.LoadModules(['Controls/mtButton', 'Widgets/Dialog']);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Widgets.DisplayStyleDialog',
		declare([VC.Widgets.Dialog], {
			dialogName: 'displayStyle',

			postCreate: function () {
				this.inherited(arguments);

				this.btnWireframe.onClick = dojo.partial(
					dojo.hitch(this, this._wireframeClick),
					this.btnWireframe
				);
				this.btnShaded.onClick = dojo.partial(
					dojo.hitch(this, this._shadedClick),
					this.btnShaded
				);
				this.btnHiddenLine.onClick = dojo.partial(
					dojo.hitch(this, this._hiddenLineClick),
					this.btnHiddenLine
				);
				this.btnWireframeOnShaded.onClick = dojo.partial(
					dojo.hitch(this, this._wireframeOnShadedClick),
					this.btnWireframeOnShaded
				);
			},

			onWireframeClick: function () {},
			onShadedClick: function () {},
			onHiddenLineClick: function () {},
			onWireframeOnShadedClick: function () {},

			_wireframeClick: function () {
				this._resetButtonsState();
				this.btnWireframe.SetPressedState(true);

				this.onWireframeClick();
			},

			_shadedClick: function () {
				this._resetButtonsState();
				this.btnShaded.SetPressedState(true);

				this.onShadedClick();
			},

			_hiddenLineClick: function () {
				this._resetButtonsState();
				this.btnHiddenLine.SetPressedState(true);

				this.onHiddenLineClick();
			},

			_wireframeOnShadedClick: function () {
				this._resetButtonsState();
				this.btnWireframeOnShaded.SetPressedState(true);

				this.onWireframeOnShadedClick();
			},

			_resetButtonsState: function () {
				this.btnWireframe.SetPressedState(false);
				this.btnShaded.SetPressedState(false);
				this.btnHiddenLine.SetPressedState(false);
				this.btnWireframeOnShaded.SetPressedState(false);
			}
		})
	);
});
