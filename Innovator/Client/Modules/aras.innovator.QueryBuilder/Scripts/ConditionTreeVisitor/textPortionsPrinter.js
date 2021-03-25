/* global define */
define([
	'dojo/_base/declare',
	'QB/Scripts/ConditionTreeVisitor/baseVisitor'
], function (declare, BaseVisitor) {
	return declare('TextPortionsPrinter', [BaseVisitor], {
		constructor: function () {
			this._textPortionsBuffer = [];
		},

		_startNewPortion: function () {
			this._textPortionsBuffer.push({
				text: '',
				isInvalid: this._isInvalidPropertyVisitingInProgress
			});
		},

		_pushText: function (text) {
			this.inherited(arguments);

			if (this._textPortionsBuffer.length === 0) {
				this._startNewPortion();
			}
			var lastPortion = this._textPortionsBuffer[
				this._textPortionsBuffer.length - 1
			];
			if (this._isInvalidPropertyVisitingInProgress !== lastPortion.isInvalid) {
				this._startNewPortion();
				lastPortion = this._textPortionsBuffer[
					this._textPortionsBuffer.length - 1
				];
			}
			lastPortion.text += text;
		},

		visitPropertyOrConstant: function (conditionNode) {
			var oldValue = this._isInvalidPropertyVisitingInProgress;
			this._isInvalidPropertyVisitingInProgress =
				conditionNode.isPropertyInvalid;
			this.inherited(arguments);
			//reset to old value to mark as invalid only property text portion
			this._isInvalidPropertyVisitingInProgress = oldValue;
		},

		printTextPortions: function (portionHandler) {
			this._textPortionsBuffer.forEach(function (portion) {
				portionHandler(portion.text, portion.isInvalid);
			});
		}
	});
});
