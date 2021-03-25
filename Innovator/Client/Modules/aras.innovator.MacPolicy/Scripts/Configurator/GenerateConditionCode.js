define(['Vendors/peg-0.10.0.min'], function (pegjs) {
	let isVisitBinaryOperatorInProgress = false;
	let textBuffer;
	let lineEnd;
	let indent;
	let indentLevel;
	const defaultOptions = {
		lineEnd: '\r\n',
		indent: '\t'
	};

	function getOperationSign(sign) {
		switch (sign) {
			case 'eq': {
				return '=';
			}
			case 'ne': {
				return '!=';
			}
			case 'lt': {
				return '<';
			}
			case 'le': {
				return '<=';
			}
			case 'gt': {
				return '>';
			}
			case 'ge': {
				return '>=';
			}
			case 'like': {
				return 'LIKE';
			}
			case 'and': {
				return 'AND';
			}
			case 'or': {
				return 'OR';
			}
			case 'null': {
				return 'IS NULL';
			}
		}
	}

	function insertIndent() {
		for (let i = 0; i < indentLevel; i++) {
			textBuffer.push(indent);
		}
	}

	function isBufferEmpty() {
		return textBuffer.length === 0;
	}

	const visitor = pegjs.compiler.visitor.build({
		expression: function (node) {
			if (node.name.toUpperCase() === 'NOT') {
				textBuffer.push(node.name.toUpperCase() + ' ');
				textBuffer.push('(');
				visitor(node.children[0]);
				textBuffer.push(')');
			} else {
				for (let i = 0; i < node.children.length; i++) {
					if (
						node.children[i].type === 'expression' &&
						node.children[i].name.toUpperCase() != 'NOT'
					) {
						isVisitBinaryOperatorInProgress = true;
						textBuffer.push('(' + lineEnd);
						indentLevel++;
						insertIndent();
					}
					visitor(node.children[i]);
					if (
						node.children[i].type === 'expression' &&
						node.children[i].name.toUpperCase() != 'NOT'
					) {
						textBuffer.push(lineEnd);
						indentLevel--;
						insertIndent();
						textBuffer.push(')');
						isVisitBinaryOperatorInProgress = false;
					}
					if (node.children[i + 1]) {
						textBuffer.push(lineEnd);
						insertIndent();
						textBuffer.push(getOperationSign(node.name) + ' ');
					}
				}
			}
		},
		condition: function (node) {
			node.children.forEach(visitor);
		},
		binaryExpression: function (node) {
			const needRoundBrackets =
				!isBufferEmpty() || isVisitBinaryOperatorInProgress;
			if (needRoundBrackets) {
				textBuffer.push('(');
			}
			visitor(node.children[0]);
			textBuffer.push(' ' + getOperationSign(node.name) + ' ');
			visitor(node.children[1]);
			if (needRoundBrackets) {
				textBuffer.push(')');
			}
		},
		unaryExpression: function (node) {
			textBuffer.push('(');
			visitor(node.children[0]);
			textBuffer.push(' ' + getOperationSign(node.name) + ')');
		},
		method_call: function (node) {
			node.children.forEach(visitor);
		},
		params: function (node) {
			textBuffer.push('(');
			for (let i = 0; i < node.children.length; i++) {
				visitor(node.children[i].children[0]);
				if (i != node.children.length - 1) {
					textBuffer.push(', ');
				}
			}
			textBuffer.push(')');
		},
		param: function (node) {
			node.children.forEach(visitor);
		},
		method_name: function (node) {
			textBuffer.push(node.label);
		},
		propertyItem: function (node) {
			textBuffer.push(node.label);
		},
		property: function (node) {
			textBuffer.push(node.label);
		},
		constant: function (node) {
			textBuffer.push(node.label);
		}
	});

	return function (ast, options) {
		options = Object.assign(defaultOptions, options);
		lineEnd = options.lineEnd;
		indent = options.indent;
		indentLevel = 0;
		textBuffer = [];
		visitor(ast);
		return textBuffer.join('');
	};
});
