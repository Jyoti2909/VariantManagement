define([
	'Vendors/peg-0.10.0.min',
	'MacPolicy/Scripts/Configurator/Cache/IdentitiesCache',
	'MacPolicy/Scripts/Configurator/Cache/xClassesCache',
	'MacPolicy/Scripts/Configurator/ParsingError'
], function (pegjs, IdentitiesCache, XClassesCache, ParsingError) {
	'use strict';
	const namespaceRegExp = /^MacPolicy\./;
	const addNamespaceToMethodName = function (name) {
		if (name.match(namespaceRegExp)) {
			return name;
		}
		return 'MacPolicy.' + name;
	};
	const identitiesCache = new IdentitiesCache();
	const xClassesCache = new XClassesCache();

	const tranfsormIdentityNameToId = function (argument) {
		const identity = identitiesCache.getIdentityByName(argument.value);
		if (identity) {
			argument.value = argument.label = identity.id;
		} else {
			const message = aras.getResource(
				'../Modules/aras.innovator.MacPolicy/',
				'condition_editor.invalid_method_argument',
				'Identity',
				argument.value
			);
			throw new ParsingError(message, argument.location);
		}
	};
	const tranfsormIdentityIdToName = function (argument) {
		const identity = identitiesCache.getIdentityById(argument.value);
		if (identity) {
			argument.value = argument.label =
				"'" + identity.name.replace(/'/g, "\\'") + "'";
		}
	};

	const tranfsormXClassNameToId = function (argument) {
		const xClass = xClassesCache.getXClassByName(argument.value);
		if (xClass) {
			argument.value = argument.label = xClass.id;
		} else {
			const message = aras.getResource(
				'../Modules/aras.innovator.MacPolicy/',
				'condition_editor.invalid_method_argument',
				'xClass',
				argument.value
			);
			throw new ParsingError(message, argument.location);
		}
	};
	const tranfsormXClassIdToName = function (argument) {
		const xClass = xClassesCache.getXClassById(argument.value);
		if (xClass) {
			argument.value = argument.label = "'" + xClass.fullName + "'";
		}
	};

	const addNamespaceToMethodNameVisitor = pegjs.compiler.visitor.build({
		expression: function (node) {
			node.children.forEach(addNamespaceToMethodNameVisitor);
		},
		condition: function (node) {
			node.children.forEach(addNamespaceToMethodNameVisitor);
		},
		binaryExpression: function (node) {
			node.children.forEach(addNamespaceToMethodNameVisitor);
		},
		unaryExpression: function (node) {
			node.children.forEach(addNamespaceToMethodNameVisitor);
		},
		method_call: function (node) {
			node.children.forEach(addNamespaceToMethodNameVisitor);
		},
		method_name: function (node) {
			node.label = node.value = addNamespaceToMethodName(node.value);
		},
		params: function (node) {
			node.children.forEach(addNamespaceToMethodNameVisitor);
		},
		param: function (node) {
			node.children.forEach(addNamespaceToMethodNameVisitor);
		},
		propertyItem: function () {},
		property: function () {},
		constant: function () {}
	});

	const removeNamespaceFromMethodNameVisitor = pegjs.compiler.visitor.build({
		expression: function (node) {
			node.children.forEach(removeNamespaceFromMethodNameVisitor);
		},
		condition: function (node) {
			node.children.forEach(removeNamespaceFromMethodNameVisitor);
		},
		binaryExpression: function (node) {
			node.children.forEach(removeNamespaceFromMethodNameVisitor);
		},
		unaryExpression: function (node) {
			node.children.forEach(removeNamespaceFromMethodNameVisitor);
		},
		method_call: function (node) {
			node.children.forEach(removeNamespaceFromMethodNameVisitor);
		},
		method_name: function (node) {
			node.label = node.value = node.value.replace(namespaceRegExp, '');
		},
		params: function (node) {
			node.children.forEach(removeNamespaceFromMethodNameVisitor);
		},
		param: function (node) {
			node.children.forEach(removeNamespaceFromMethodNameVisitor);
		},
		propertyItem: function () {},
		property: function () {},
		constant: function () {}
	});

	const identityNameToIdTranfsormVisitor = pegjs.compiler.visitor.build({
		expression: function (node) {
			node.children.forEach(identityNameToIdTranfsormVisitor);
		},
		condition: function (node) {
			node.children.forEach(identityNameToIdTranfsormVisitor);
		},
		binaryExpression: function (node) {
			node.children.forEach(identityNameToIdTranfsormVisitor);
		},
		unaryExpression: function (node) {
			node.children.forEach(identityNameToIdTranfsormVisitor);
		},
		method_call: function (node) {
			const isMemberOfMethod = function (methodCall) {
				const methodName = methodCall.children.find(function (child) {
					return child.name === 'method_name';
				});

				return (
					addNamespaceToMethodName(methodName.value) ===
					'MacPolicy.CurrentUser.IsMemberOf'
				);
			};

			const hasConstantParam = function (methodCall) {
				const params = methodCall.children.find(function (child) {
					return child.name === 'params';
				});

				return params.children.every(function (param) {
					return param.children.every(function (child) {
						return child.type === 'constant';
					});
				});
			};

			if (isMemberOfMethod(node) && hasConstantParam(node)) {
				node.children.forEach(identityNameToIdTranfsormVisitor);
			}
		},
		params: function (node) {
			node.children.forEach(identityNameToIdTranfsormVisitor);
		},
		param: function (node) {
			node.children.forEach(tranfsormIdentityNameToId);
		},
		method_name: function () {},
		propertyItem: function () {},
		property: function () {},
		constant: function () {}
	});

	const identityIdToNameTranfsormVisitor = pegjs.compiler.visitor.build({
		expression: function (node) {
			node.children.forEach(identityIdToNameTranfsormVisitor);
		},
		condition: function (node) {
			node.children.forEach(identityIdToNameTranfsormVisitor);
		},
		binaryExpression: function (node) {
			node.children.forEach(identityIdToNameTranfsormVisitor);
		},
		unaryExpression: function (node) {
			node.children.forEach(identityIdToNameTranfsormVisitor);
		},
		method_call: function (node) {
			const isMemberOfMethod = function (methodCall) {
				const methodName = methodCall.children.find(function (child) {
					return child.name === 'method_name';
				});

				return (
					addNamespaceToMethodName(methodName.value) ===
					'MacPolicy.CurrentUser.IsMemberOf'
				);
			};

			const hasConstantParam = function (methodCall) {
				const params = methodCall.children.find(function (child) {
					return child.name === 'params';
				});

				return params.children.every(function (param) {
					return param.children.every(function (child) {
						return child.type === 'constant';
					});
				});
			};

			if (isMemberOfMethod(node) && hasConstantParam(node)) {
				node.children.forEach(identityIdToNameTranfsormVisitor);
			}
		},
		params: function (node) {
			node.children.forEach(identityIdToNameTranfsormVisitor);
		},
		param: function (node) {
			node.children.forEach(tranfsormIdentityIdToName);
		},
		method_name: function () {},
		propertyItem: function () {},
		property: function () {},
		constant: function () {}
	});

	const xClassNameToIdTranfsormVisitor = pegjs.compiler.visitor.build({
		expression: function (node) {
			node.children.forEach(xClassNameToIdTranfsormVisitor);
		},
		condition: function (node) {
			node.children.forEach(xClassNameToIdTranfsormVisitor);
		},
		binaryExpression: function (node) {
			node.children.forEach(xClassNameToIdTranfsormVisitor);
		},
		unaryExpression: function (node) {
			node.children.forEach(xClassNameToIdTranfsormVisitor);
		},
		method_call: function (node) {
			const isClassifiedByXClassMethod = node.children.some(function (child) {
				if (child.name === 'method_name') {
					return (
						addNamespaceToMethodName(child.value) ===
							'MacPolicy.CurrentUser.IsClassifiedByXClass' ||
						addNamespaceToMethodName(child.value) ===
							'MacPolicy.CurrentItem.IsClassifiedByXClass'
					);
				}
			});
			if (isClassifiedByXClassMethod) {
				node.children.forEach(xClassNameToIdTranfsormVisitor);
			}
		},
		params: function (node) {
			node.children.forEach(xClassNameToIdTranfsormVisitor);
		},
		param: function (node) {
			node.children.forEach(tranfsormXClassNameToId);
		},
		method_name: function () {},
		propertyItem: function () {},
		property: function () {},
		constant: function () {}
	});

	const xClassIdToNameTranfsormVisitor = pegjs.compiler.visitor.build({
		expression: function (node) {
			node.children.forEach(xClassIdToNameTranfsormVisitor);
		},
		condition: function (node) {
			node.children.forEach(xClassIdToNameTranfsormVisitor);
		},
		binaryExpression: function (node) {
			node.children.forEach(xClassIdToNameTranfsormVisitor);
		},
		unaryExpression: function (node) {
			node.children.forEach(xClassIdToNameTranfsormVisitor);
		},
		method_call: function (node) {
			const isClassifiedByXClassMethod = node.children.some(function (child) {
				if (child.name === 'method_name') {
					return (
						addNamespaceToMethodName(child.value) ===
							'MacPolicy.CurrentUser.IsClassifiedByXClass' ||
						addNamespaceToMethodName(child.value) ===
							'MacPolicy.CurrentItem.IsClassifiedByXClass'
					);
				}
			});
			if (isClassifiedByXClassMethod) {
				node.children.forEach(xClassIdToNameTranfsormVisitor);
			}
		},
		params: function (node) {
			node.children.forEach(xClassIdToNameTranfsormVisitor);
		},
		param: function (node) {
			node.children.forEach(tranfsormXClassIdToName);
		},
		method_name: function () {},
		propertyItem: function () {},
		property: function () {},
		constant: function () {}
	});

	const macConditionVisitors = {
		addNamespaceToMethodNameVisitor: addNamespaceToMethodNameVisitor,
		identityNameToIdTranfsormVisitor: identityNameToIdTranfsormVisitor,
		xClassNameToIdTranfsormVisitor: xClassNameToIdTranfsormVisitor,
		removeNamespaceFromMethodNameVisitor: removeNamespaceFromMethodNameVisitor,
		identityIdToNameTranfsormVisitor: identityIdToNameTranfsormVisitor,
		xClassIdToNameTranfsormVisitor: xClassIdToNameTranfsormVisitor
	};
	return macConditionVisitors;
});
