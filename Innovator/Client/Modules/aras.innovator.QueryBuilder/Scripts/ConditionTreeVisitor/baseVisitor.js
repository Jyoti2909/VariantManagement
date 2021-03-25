/* global define */
define(['dojo/_base/declare'], function (declare) {
	return declare('BaseVisitor', null, {
		constructor: function (conditionTreeNavigator) {
			this._textBuffer = [];
			this._conditionTreeNavigator = conditionTreeNavigator;
		},

		_isBufferEmpty: function () {
			return this._textBuffer.length === 0;
		},

		_pushText: function (text) {
			this._textBuffer.push(text);
		},

		getText: function () {
			return this._textBuffer.join('');
		},

		visitNull: function () {},

		visitPropertyOrConstant: function (conditionNode) {
			this._pushText(conditionNode.label);
		},

		visitMethodCall: function (conditionNode) {
			this._pushText(conditionNode.children[0].value);
			this._pushText('(');
			this._conditionTreeNavigator.accept(conditionNode.children[1], this);
			this._pushText(')');
		},

		visitParams: function (conditionNode) {
			for (let i = 0; i < conditionNode.children.length; i++) {
				this._conditionTreeNavigator.accept(
					conditionNode.children[i].children[0],
					this
				);
				if (i != conditionNode.children.length - 1) {
					this._pushText(', ');
				}
			}
		},

		visitMax: function (conditionNode) {
			var text =
				(typeof tree !== 'undefined' && //note: global variable usage
					tree.getMaxConditionById(
						conditionNode.id,
						conditionNode.children[0].value
					)) ||
				conditionNode.label;
			this._pushText(text);
		},

		visitMin: function (conditionNode) {
			var text =
				(typeof tree !== 'undefined' && //note: global variable usage
					tree.getMinConditionById(
						conditionNode.id,
						conditionNode.children[0].value
					)) ||
				conditionNode.label;
			this._pushText(text);
		},

		visitCount: function (conditionNode) {
			var text =
				(typeof tree !== 'undefined' && //note: global variable usage
					tree.getCountConditionById(
						conditionNode.id,
						conditionNode.children[0].value
					)) ||
				conditionNode.label;
			this._pushText(text);
		},

		visitExists: function (conditionNode) {
			var text =
				(typeof tree !== 'undefined' && //note: global variable usage
					tree.getExistsConditionById(
						conditionNode.id,
						conditionNode.children[0].value
					)) ||
				conditionNode.label;
			this._pushText(text);
		},

		_handleBinaryOperatorDelimiter: function (conditionNode, operatorText) {
			this._pushText(' ' + operatorText.toUpperCase() + ' ');
		},

		visitBinaryOperator: function (conditionNode, operatorText) {
			var needRoundBrackets =
				!this._isBufferEmpty() || this._isVisitBinaryOperatorInProgress;
			if (needRoundBrackets) {
				this._pushText('(');
			}
			for (var i = 0; i < conditionNode.children.length; i++) {
				if (i !== 0) {
					this._handleBinaryOperatorDelimiter(conditionNode, operatorText);
				}
				this._isVisitBinaryOperatorInProgress = true;
				this._conditionTreeNavigator.accept(conditionNode.children[i], this);
				this._isVisitBinaryOperatorInProgress = false;
			}
			if (needRoundBrackets) {
				this._pushText(')');
			}
		},

		_getUnaryOperatorAttributes: function (conditionNode) {
			var prefix;
			var suffix;
			switch (conditionNode.name) {
				case 'not':
					prefix = 'NOT ';
					suffix = '';
					break;
				case 'null':
					prefix = '';
					suffix = ' IS NULL';
					break;
				default:
					break;
			}
			var needRoundBrackets = !this._isBufferEmpty();
			if (needRoundBrackets) {
				prefix = '(' + prefix;
				suffix = suffix + ')';
			}

			return {
				prefix: prefix,
				suffix: suffix
			};
		},

		visitUnaryOperator: function (conditionNode) {
			var attrs = this._getUnaryOperatorAttributes(conditionNode);
			this._pushText(attrs.prefix);
			this._conditionTreeNavigator.accept(conditionNode.children[0], this);
			this._pushText(attrs.suffix);
		}
	});
});
