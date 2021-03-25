VC.Utils.Page.LoadModules([
	'Widgets/Dialog',
	'Controls/Slider',
	'Controls/mtButton',
	'Controls/ColorPallete',
	'Interfaces/IColor'
]);

require(['dojo/_base/declare'], function (declare) {
	var isAlighnEnabled;

	return dojo.setObject(
		'VC.Widgets.ComparePalleteDialog',
		declare([VC.Interfaces.IColor, VC.Widgets.Dialog], {
			dialogName: 'comparePallete',

			onReset: function () {},
			onDragAndDrop: function () {},
			onRefresh: function () {},
			onDisplayFile1: function () {},
			onDisplayFile2: function () {},
			onDisplayBothFiles: function () {},
			onDisplayDiffView: function () {},
			onChangeTolerance: function () {},
			onSelectColor: function () {},

			postCreate: function () {
				this.inherited(arguments);

				this.btnAlignPointToPoint.onClick = dojo.hitch(
					this,
					this._dragAndDropClick
				);
				this.btnRefresh.onClick = dojo.hitch(this, this._refreshClick);
				this.btnRollback.onClick = dojo.hitch(this, this._resetClick);
				this.btnDisplayFile1.onClick = dojo.hitch(this, this._displayFile1);
				this.btnDisplayFile2.onClick = dojo.hitch(this, this._displayFile2);
				this.btnDisplayBothFiles.onClick = dojo.hitch(
					this,
					this._displayBothFiles
				);
				this.btnDisplayBothFiles.SetPressedState(true);
				this.btnDifferenceView.onClick = dojo.hitch(
					this,
					this._displayDiffView
				);
				this.sliderTolerance.minimum = 5;
				this.sliderTolerance.maximum = 255;
				this.sliderTolerance.discreteValues = 50;
				this.sliderTolerance.intermediateChanges = false;
				this.sliderTolerance.changePosition = dojo.hitch(
					this,
					this._changeTolerance
				);
				this.palleteDifferenceColor.selectColor = dojo.hitch(
					this,
					this._selectDifferenceColor
				);

				Object.defineProperty(this, 'tolerance', {
					get: function () {
						return this.sliderTolerance.value;
					},
					set: function (value) {
						this.sliderTolerance.value = value;
						this.sliderTolerance.set('value', value);
					}
				});

				Object.defineProperty(this, 'color', {
					get: function () {
						return this.palleteDifferenceColor.value;
					},

					set: function (val) {
						this.palleteDifferenceColor.setColor(val);
					}
				});

				Object.defineProperty(this, 'isDraggingEnabled', {
					get: function () {
						return isAlighnEnabled;
					},
					set: function (val) {
						isAlighnEnabled = val;
					}
				});

				this.onClose = dojo.hitch(this, function () {
					this.isDraggingEnabled = false;
					this.btnAlignPointToPoint.SetPressedState(this.isDraggingEnabled);

					this.onDragAndDrop();
				});

				this.sliderTolerance.style = 'width: 124px';
				this.sliderTolerance.domNode.style.width = '124px';
				this.tolerance = 125;
				VC.Utils.addClass(this.titleBar, 'Pallete');
			},

			_dragAndDropClick: function () {
				this.isDraggingEnabled = !this.isDraggingEnabled;
				this.btnAlignPointToPoint.SetPressedState(this.isDraggingEnabled);

				this.onDragAndDrop();
			},

			_refreshClick: function () {
				this.onRefresh();
			},

			_resetClick: function () {
				this.onReset();
			},

			_displayFile1: function () {
				this._resetButtonStates();
				this.btnAlignPointToPoint.Disable();
				this.btnDisplayFile1.SetPressedState(true);
				this.onDisplayFile1();
			},

			_displayFile2: function () {
				this._resetButtonStates();
				this.btnAlignPointToPoint.Disable();
				this.btnDisplayFile2.SetPressedState(true);
				this.onDisplayFile2();
			},

			_displayBothFiles: function () {
				this._resetButtonStatesWithoutFirstRow();
				this.btnAlignPointToPoint.Enable();
				this.btnAlignPointToPoint.SetPressedState(this.isDraggingEnabled);
				this.btnDisplayBothFiles.SetPressedState(true);
				this.onDisplayBothFiles();
			},

			_displayDiffView: function () {
				this._resetButtonStatesWithoutFirstRow();
				this.btnAlignPointToPoint.Enable();
				this._toggleDifferenceView();
				this.onDisplayDiffView();
			},

			_changeTolerance: function () {
				this.onChangeTolerance();
			},

			_selectDifferenceColor: function () {
				this.onSelectColor();
			},

			_resetButtonStates: function () {
				this.btnRollback.SetPressedState(false);
				this.btnRefresh.SetPressedState(false);
				this._resetButtonStatesWithoutFirstRow();
			},

			_resetButtonStatesWithoutFirstRow: function () {
				this.btnDisplayFile1.SetPressedState(false);
				this.btnDisplayFile2.SetPressedState(false);
				this.btnDisplayBothFiles.SetPressedState(false);
				this._resetDifferenceViewButtonStates();
			},

			_resetDifferenceViewButtonStates: function () {
				this.btnDifferenceView.SetPressedState(false);

				var elements = document.getElementsByClassName('CompareToggle');

				for (var i = 0; i < elements.length; i++) {
					elements[i].visible(false);
				}
			},

			_toggleDifferenceView: function () {
				var elements = document.getElementsByClassName('CompareToggle');

				if (this.btnDifferenceView.IsPressed) {
					for (var i = 0; i < elements.length; i++) {
						elements[i].visible(false);
					}

					this.btnDifferenceView.SetPressedState(false);
				} else {
					for (var j = 0; j < elements.length; j++) {
						elements[j].visible(true);
					}

					this.btnDifferenceView.SetPressedState(true);
				}
			}
		})
	);
});
