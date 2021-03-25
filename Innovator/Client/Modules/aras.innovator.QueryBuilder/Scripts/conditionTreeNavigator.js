define(['dojo/_base/declare'], function (declare) {
	return declare('ConditionTreeNavigator', null, {
		constructor: function () {},

		accept: function (conditionNode, visitor) {
			if (!conditionNode) {
				visitor.visitNull();
				return;
			}
			switch (conditionNode.type) {
				case 'constant':
				case 'propertyItem':
				case 'property': {
					visitor.visitPropertyOrConstant(conditionNode);
					return;
				}
				case 'root':
				case 'condition': {
					this.accept(
						conditionNode.children && conditionNode.children[0],
						visitor
					);
					return;
				}
				case 'binaryExpression': {
					switch (conditionNode.name) {
						case 'eq': {
							visitor.visitBinaryOperator(conditionNode, '=');
							return;
						}
						case 'ne': {
							visitor.visitBinaryOperator(conditionNode, '!=');
							return;
						}
						case 'lt': {
							visitor.visitBinaryOperator(conditionNode, '<');
							return;
						}
						case 'le': {
							visitor.visitBinaryOperator(conditionNode, '<=');
							return;
						}
						case 'gt': {
							visitor.visitBinaryOperator(conditionNode, '>');
							return;
						}
						case 'ge': {
							visitor.visitBinaryOperator(conditionNode, '>=');
							return;
						}
						case 'like': {
							visitor.visitBinaryOperator(conditionNode, 'like');
							return;
						}
					}
					break;
				}
				case 'unaryExpression': {
					visitor.visitUnaryOperator(conditionNode);
					return;
				}
				case 'existsExpression': {
					visitor.visitExists(conditionNode);
					return;
				}
				case 'max': {
					visitor.visitMax(conditionNode);
					return;
				}
				case 'min': {
					visitor.visitMin(conditionNode);
					return;
				}
				case 'count': {
					visitor.visitCount(conditionNode);
					return;
				}
				case 'method_call': {
					visitor.visitMethodCall(conditionNode);
					return;
				}
				case 'params': {
					visitor.visitParams(conditionNode);
					return;
				}
				case 'expression': {
					if (conditionNode.name == 'not') {
						visitor.visitUnaryOperator(conditionNode);
						return;
					}
					visitor.visitBinaryOperator(conditionNode, conditionNode.name);
					return;
				}
			}
		}
	});
});
