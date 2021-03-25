VC.Utils.Page.LoadWidgets(['Dialog']);
VC.Utils.Page.LoadModules(['Controls/SimplifiedNumberTextBox']);

require([
	'dojo/_base/declare',
	'dojo/text!../Views/PDFMeasureDialog.html'
], function (declare, dialogContent) {
	return dojo.setObject(
		'VC.Widgets.PDFMeasureDialog',
		declare(VC.Widgets.Dialog, {
			dialogName: 'measurement',
			_startPointX: null,
			_startPointY: null,
			_endPointX: null,
			_endPointY: null,
			startPointXNode: null,
			startPointYNode: null,
			resetXNode: null,
			resetYNode: null,
			endPointXNode: null,
			endPointYNode: null,
			differenceXNode: null,
			differenceYNode: null,
			straightLineNode: null,
			unitsPlaceHolderNode: null,
			scalePlaceHolderNode: null,
			recordMeasurementNode: null,
			resetNode: null,
			_ratio2Inch: 25.4,
			_measurementUnitsSelect: null,
			_measurementScaleInput: null,
			_scale: 1.0,

			onClearStartPoint: function () {},
			onClearEndPoint: function () {},
			onResetPoints: function () {},
			onRecordMeasurement: function () {},
			onSelectMeasurementUnit: function () {},
			onChangeScaleValue: function () {},

			constructor: function () {
				this.replaceDialogTemplate(dialogContent);
			},

			postCreate: function () {
				this.inherited(arguments);

				this.resetNode.onclick = dojo.hitch(this, this._onResetClick);
				this.resetXNode.onclick = dojo.hitch(this, this._onResetXClick);
				this.resetYNode.onclick = dojo.hitch(this, this._onResetYClick);
				this.recordMeasurementNode.onclick = dojo.hitch(
					this,
					this._onRecordMeasurementClick
				);

				this._measurementScaleInput = new VC.Widgets.SimplifiedNumberTextBox();
				this._measurementScaleInput.onChange = dojo.hitch(
					this,
					this._onChangeScaleValue
				);
				this._measurementScaleInput.allowEmptyValue = false;
				this._measurementScaleInput.allowDecimals = true;
				this.scalePlaceHolderNode.appendChild(
					this._measurementScaleInput.domNode
				);
				this._measurementScaleInput.value = this._scale;
				this._measurementScaleInput.NumberTextbox.setAttribute(
					'tabIndex',
					'-1'
				);

				VC.Utils.addClass(this.paneContent, 'PDFMeasurementDialogContainer');

				Object.defineProperty(this, 'startPointX', {
					get: function () {
						var parsedValue = parseFloat(this.startPointXNode.innerHTML);
						var returnValue = isNaN(parsedValue) ? null : parsedValue;

						return returnValue;
					},
					set: function (value) {
						this._startPointX = value;
						this.startPointXNode.innerHTML =
							value === null ? '' : value.toPrecision(3);
						this._calculateDifference();
					}
				});

				Object.defineProperty(this, 'startPointY', {
					get: function () {
						var parsedValue = parseFloat(this.startPointYNode.innerHTML);
						var returnValue = isNaN(parsedValue) ? null : parsedValue;

						return returnValue;
					},
					set: function (value) {
						this._startPointY = value;
						this.startPointYNode.innerHTML =
							value === null ? '' : value.toPrecision(3);
						this._calculateDifference();
					}
				});

				Object.defineProperty(this, 'endPointX', {
					get: function () {
						var parsedValue = parseFloat(this.endPointXNode.innerHTML);
						var returnValue = isNaN(parsedValue) ? null : parsedValue;

						return returnValue;
					},
					set: function (value) {
						this._endPointX = value;
						this.endPointXNode.innerHTML =
							value === null ? '' : value.toPrecision(3);
						this._calculateDifference();
					}
				});

				Object.defineProperty(this, 'endPointY', {
					get: function () {
						var parsedValue = parseFloat(this.endPointYNode.innerHTML);
						var returnValue = isNaN(parsedValue) ? null : parsedValue;

						return returnValue;
					},
					set: function (value) {
						this._endPointY = value;
						this.endPointYNode.innerHTML =
							value === null ? '' : value.toPrecision(3);
						this._calculateDifference();
					}
				});

				Object.defineProperty(this, 'differenceX', {
					get: function () {
						var parsedValue = parseFloat(this.differenceXNode.innerHTML);
						var returnValue = isNaN(parsedValue) ? null : parsedValue;

						return returnValue;
					},
					set: function (value) {
						this.differenceXNode.innerHTML =
							value === null ? '' : value.toPrecision(3);
					}
				});

				Object.defineProperty(this, 'differenceY', {
					get: function () {
						var parsedValue = parseFloat(this.differenceYNode.innerHTML);
						var returnValue = isNaN(parsedValue) ? null : parsedValue;

						return returnValue;
					},
					set: function (value) {
						this.differenceYNode.innerHTML =
							value === null ? '' : value.toPrecision(3);
					}
				});

				Object.defineProperty(this, 'straightLine', {
					get: function () {
						var parsedValue = parseFloat(this.straightLineNode.innerHTML);
						var returnValue = isNaN(parsedValue) ? null : parsedValue;
						return returnValue;
					},
					set: function (value) {
						this.straightLineNode.innerHTML =
							value === null ? '' : value.toPrecision(3);
					}
				});

				Object.defineProperty(this, 'ratioToInch', {
					get: function () {
						return this._ratio2Inch;
					},
					set: function (value) {
						this._ratio2Inch = value;
					}
				});

				Object.defineProperty(this, 'abbreviation', {
					get: function () {
						return this._measurementUnitsSelect.selectedAdditionalData;
					}
				});

				Object.defineProperty(this, 'scale', {
					get: function () {
						return this._measurementScaleInput.value;
					},
					set: function (value) {
						this._measurementScaleInput.value = value;
					}
				});
			},
			initMeasurementUnits: function (viewerName) {
				var dropDownData = this._getMeasurementUnits(viewerName);
				var measurementUnits = JSON.parse(dropDownData);
				var dropDownListOptions = [];
				var dropDownListOption = null;

				for (var i = 0; i < measurementUnits.length; i++) {
					dropDownListOption = {
						text: measurementUnits[i].name,
						value: measurementUnits[i].ratio,
						additionalData: measurementUnits[i].abbrev,
						selected: measurementUnits[i].isDefault === '1' ? true : false
					};
					dropDownListOptions.push(dropDownListOption);
				}

				this._measurementUnitsSelect = new VC.Widgets.DropDownList(
					dropDownListOptions
				);
				this._measurementUnitsSelect.onChange = dojo.hitch(
					this,
					this._onSelectMeasurementUnit
				);
				this.unitsPlaceHolderNode.appendChild(
					this._measurementUnitsSelect.domNode
				);
				this._measurementUnitsSelect.width = 110;
			},

			selectMeasurementUnit: function (value) {
				this._measurementUnitsSelect.selectOption(value);
			},

			_onSelectMeasurementUnit: function () {
				if (!this._measurementScaleInput.isValid) {
					return;
				}

				this._ratio2Inch = this._measurementUnitsSelect.selectedValue;

				this.onSelectMeasurementUnit();
			},

			_onChangeScaleValue: function () {
				if (this.scale !== '') {
					this.onChangeScaleValue();
					this.updateScaleTooltip();
				}
			},

			updateScaleTooltip: function () {
				var valueString = this.scale + '';
				if (valueString.length > 6) {
					this._measurementScaleInput.NumberTextbox.setAttribute(
						'title',
						this.scale
					);
				} else {
					this._measurementScaleInput.NumberTextbox.removeAttribute('title');
				}
			},

			_calculateDifference: function () {
				var calculatedFields = null;

				if (
					this.startPointX !== null &&
					this.startPointY !== null &&
					this.endPointX !== null &&
					this.endPointY !== null
				) {
					var differenceX = this._endPointX - this._startPointX;
					var differenceY = this._endPointY - this._startPointY;

					this.differenceX = differenceX;
					this.differenceY = differenceY;

					var straightLine = Math.sqrt(
						Math.pow(differenceX, 2) + Math.pow(differenceY, 2)
					);

					this.straightLine = straightLine;
					this.recordMeasurementNode.removeAttribute('disabled');

					calculatedFields = document.getElementsByClassName(
						'CalculatedFields'
					);

					for (var i = 0; i < calculatedFields.length; i++) {
						VC.Utils.removeClass(calculatedFields[i], 'Disabled');
					}
				} else {
					this.differenceX = this.differenceY = this.straightLine = null;
					this.recordMeasurementNode.setAttribute('disabled', 'disabled');

					calculatedFields = document.getElementsByClassName(
						'CalculatedFields'
					);

					for (var j = 0; j < calculatedFields.length; j++) {
						VC.Utils.addClass(calculatedFields[j], 'Disabled');
					}
				}
			},

			_getMeasurementUnits: function (viewerName) {
				var viewer = top.aras.getItemByName('Viewer', viewerName);
				var itm = top.aras.newIOMItem('Measurement Unit', 'get');
				itm.setAttribute(
					'select',
					'units, ratio_to_inch, abbreviation, is_default, viewer'
				);
				itm.setProperty('viewer', viewer.getAttribute('id'));
				itm = itm.apply();

				if (itm.isError()) {
					return null;
				}

				var unitArray = [];
				var unitCount = itm.getItemCount();
				for (var i = 0; i < unitCount; i++) {
					var curItem = itm.getItemByIndex(i);

					unitArray.push({
						name: curItem.getProperty('units'),
						ratio: curItem.getProperty('ratio_to_inch'),
						abbrev: curItem.getProperty('abbreviation'),
						isDefault: curItem.getProperty('is_default')
					});
				}

				return JSON.stringify(unitArray);
			},

			_onResetClick: function () {
				this.resetDialog();
				this.onResetPoints();
			},

			_onResetXClick: function () {
				this.startPointX = null;
				this.startPointY = null;

				this.onClearStartPoint();
			},

			_onResetYClick: function () {
				this.endPointX = null;
				this.endPointY = null;

				this.onClearEndPoint();
			},

			_onRecordMeasurementClick: function () {
				this.onRecordMeasurement();
			},

			resetDialog: function () {
				this.startPointX = null;
				this.startPointY = null;
				this.endPointX = null;
				this.endPointY = null;
			}
		})
	);
});
