/* global define */
define([
	'dojo/_base/declare',
	'QB/Scripts/ConditionTreeVisitor/TextPortionsPrinter'
], function (declare, TextPortionsPrinter) {
	return declare('TooltipTextPortionsPrinter', [TextPortionsPrinter], {
		constructor: function () {},

		_handleBinaryOperatorDelimiter: function (conditionNode, operatorText) {
			var isSpecialOperator =
				conditionNode.name === 'and' || conditionNode.name === 'or';
			if (!isSpecialOperator) {
				return this.inherited(arguments);
			}
			this._textPortionsBuffer.push({
				text: operatorText,
				isGreen: true
			});
			this._startNewPortion();
		},

		_getUnaryOperatorAttributes: function (conditionNode) {
			var baseResult = this.inherited(arguments);
			var addNot;
			if (baseResult.prefix.indexOf('(NOT') === 0) {
				addNot = true;
				baseResult.prefix = '';
				this._textPortionsBuffer.push({
					text: '('
				});
			} else if (baseResult.prefix.indexOf('NOT') === 0) {
				addNot = true;
				baseResult.prefix = '';
			}
			if (addNot) {
				this._textPortionsBuffer.push({
					text: 'NOT',
					isGreen: true
				});
				this._startNewPortion();
			}
			return baseResult;
		},

		printTextPortions: function (portionHandler) {
			this._textPortionsBuffer.forEach(function (portion) {
				var portionState;
				if (portion.isInvalid) {
					portionState = 'invalid';
				} else if (portion.isGreen) {
					portionState = 'green';
				}
				portionHandler(portion.text, portionState);
			});
		}
	});
});
