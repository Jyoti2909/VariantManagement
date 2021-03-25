VC.Utils.Page.LoadModules(['Controls/mtButton', 'Widgets/Dialog']);

require(['dojo/_base/declare', 'dojo/_base/lang'], function (declare, lang) {
	return dojo.setObject(
		'VC.Widgets.MeasureDialog',
		declare([VC.Widgets.Dialog], {
			dialogName: 'measure',

			postCreate: function () {
				this.inherited(arguments);

				VC.Utils.addClass(
					this.paneContent,
					VC.Utils.Constants.cssClasses.onlyButtons
				);
				this.btnMeasurePointToPoint.onClick = dojo.partial(
					dojo.hitch(this, this._measurePointToPointClick),
					this.btnMeasurePointToPoint
				);
				this.btnMeasureAngleBetweenFaces.onClick = dojo.partial(
					dojo.hitch(this, this._measureAngleBetweenFacesClick),
					this.btnMeasureAngleBetweenFaces
				);
				this.btnDeleteAll.onClick = dojo.partial(
					dojo.hitch(this, this._deleteAllClick),
					this.btnDeleteAll
				);
				this.btnMeasureEdges.onClick = dojo.partial(
					dojo.hitch(this, this._measureEdgesClick),
					this.btnMeasureEdges
				);
				this.btnMeasureDistanceBetweenFaces.onClick = dojo.partial(
					dojo.hitch(this, this._measureDistanceBetweenFacesClick),
					this.btnMeasureDistanceBetweenFaces
				);

				this.btnDeleteAll.IsDisable = true;
			},

			onMeasurePointToPointClick: function () {},
			onMeasureEdgesClick: function () {},
			onMeasureAngleBetweenFacesClick: function () {},
			onMeasureDistanceBetweenFacesClick: function () {},
			onDeleteAllClick: function () {},

			_measurePointToPointClick: function () {
				this._resetButtonsState();
				this.btnMeasurePointToPoint.SetPressedState(true);

				this.onMeasurePointToPointClick();
			},

			_measureEdgesClick: function () {
				this._resetButtonsState();
				this.btnMeasureEdges.SetPressedState(true);

				this.onMeasureEdgesClick();
			},

			_measureAngleBetweenFacesClick: function () {
				this._resetButtonsState();
				this.btnMeasureAngleBetweenFaces.SetPressedState(true);

				this.onMeasureAngleBetweenFacesClick();
			},

			_measureDistanceBetweenFacesClick: function () {
				this._resetButtonsState();
				this.btnMeasureDistanceBetweenFaces.SetPressedState(true);

				this.onMeasureDistanceBetweenFacesClick();
			},

			_deleteAllClick: function () {
				this.onDeleteAllClick();

				this.btnDeleteAll.Disable();
			},

			_resetButtonsState: function () {
				this.btnMeasurePointToPoint.SetPressedState(false);
				this.btnMeasureAngleBetweenFaces.SetPressedState(false);
				this.btnDeleteAll.SetPressedState(false);
				this.btnMeasureEdges.SetPressedState(false);
				this.btnMeasureDistanceBetweenFaces.SetPressedState(false);
			},

			disableButtons: function () {
				this.btnMeasureAngleBetweenFaces.Disable();
				this.btnMeasureEdges.Disable();
				this.btnMeasureDistanceBetweenFaces.Disable();
				this.btnMeasurePointToPoint.Disable();
				this.btnDeleteAll.Disable();
			},

			enableButtons: function (existMeasurements) {
				this.btnMeasureAngleBetweenFaces.Enable();
				this.btnMeasureEdges.Enable();
				this.btnMeasureDistanceBetweenFaces.Enable();
				this.btnMeasurePointToPoint.Enable();
				if (existMeasurements && existMeasurements > 0) {
					this.btnDeleteAll.Enable();
				}
			}
		})
	);
});
