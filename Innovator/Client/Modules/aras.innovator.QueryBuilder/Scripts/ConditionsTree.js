define([
	'dojo/_base/declare',
	'QB/Scripts/conditionTreeNavigator',
	'QB/Scripts/ConditionTreeVisitor/baseVisitor'
], function (declare, ConditionTreeNavigator, BaseVisitor) {
	function wrapPropertyName(name) {
		return name && (name.indexOf(' ') > -1 || name.startsWith('xp-'))
			? '[' + name + ']'
			: name;
	}

	function findItemInSource(condition, value, arr) {
		return arr.find(function (item) {
			return item[condition] === value;
		});
	}

	function getProperyWithItem(name, dataSource, propertyPath) {
		var property;
		if (propertyPath === 'parent::Item' && dataSource.length == 2) {
			dataSource = dataSource.slice(0, 1);
		} else {
			dataSource = dataSource.slice(-1);
		}
		var item = dataSource[0];
		dataSource.find(function (item) {
			return item.properties.some(function (prop) {
				if (prop.name === name) {
					property = prop;
					return true;
				}
			});
		});
		return {
			item: item,
			property: property
		};
	}

	function parseSelectedItem(conditionNode, dataSource) {
		var nodeNameLower = conditionNode.nodeName.toLowerCase();
		switch (nodeNameLower) {
			case 'property':
				return findItemInSource(
					'name',
					conditionNode.getAttribute('name'),
					dataSource
				);
			case 'constant':
				return {
					name: conditionNode.text,
					label: "'" + conditionNode.text + "'"
				};
			case 'max':
			case 'min':
			case 'count':
			case 'exists':
				var selectedId = nodeNameLower + '(';
				var ids = '';
				for (var i = 0; i < conditionNode.childNodes.length; i++) {
					ids += conditionNode.childNodes[i].text;
				}
				selectedId += ids + ')';
				return (
					findItemInSource('id', selectedId, dataSource) || {
						id: selectedId,
						name: selectedId
					}
				);
		}
	}

	function parseConditions(currentNode, dataSource, parent) {
		var currentBranch = {};
		if (parent) {
			currentBranch.parent = parent;
		}
		if (!currentNode) {
			return currentBranch;
		}
		currentBranch.name =
			currentNode.nodeName === '#document' ? 'root' : currentNode.nodeName;

		switch (currentBranch.name.toLowerCase()) {
			case 'property': {
				currentBranch.type = 'property';
				var isQueryReferenceCondition = dataSource.every(function (item) {
					return item.properties;
				});

				var propertyName = currentNode.getAttribute('name');
				var propertyPath = currentNode.getAttribute('query_items_xpath');
				var isPropertyInvalid;
				if (isQueryReferenceCondition) {
					var propItemObject = getProperyWithItem(
						propertyName,
						dataSource,
						propertyPath
					);
					if (!propItemObject.property) {
						isPropertyInvalid = true;
						propItemObject.property = {
							label: propertyName,
							name: propertyName
						};
					}
					var accessedItemLabel = wrapPropertyName(propItemObject.item.name);
					var propertyLabel = wrapPropertyName(propItemObject.property.label);
					currentBranch.label = accessedItemLabel + '.' + propertyLabel;
					currentBranch.value = propItemObject.property.name;
					currentBranch.type = 'propertyItem';
				} else {
					var propertyObject = dataSource.find(function (p) {
						return p.id === propertyName;
					});
					if (!propertyObject) {
						isPropertyInvalid = true;
						propertyObject = {
							name: propertyName,
							id: propertyName
						};
					}
					currentBranch.label = wrapPropertyName(propertyObject.name);
					currentBranch.value = propertyObject.id;
				}
				if (isPropertyInvalid) {
					currentBranch.isPropertyInvalid = true;
				}
				break;
			}
			case 'constant': {
				currentBranch.type = 'constant';
				// numberRegExp contain description of possible integer and decimal numbers with optional exponent from peg.js grammar
				const numberRegExp = /^\d*\.?\d+(\e[+-]?\d+)?$/;
				const parameterRegExp = /^\${1}[a-zA-Z_0-9]+$/;
				if (
					!numberRegExp.test(currentNode.text) &&
					!parameterRegExp.test(currentNode.text)
				) {
					currentBranch.value = currentNode.text;
					currentBranch.label =
						"'" +
						currentBranch.value.replace(/\\/g, '\\\\').replace(/\'/g, "\\'") +
						"'";
				} else {
					currentBranch.value = currentNode.text;
					currentBranch.label = currentNode.text;
				}
				break;
			}
			case 'and':
			case 'or':
			case 'not':
				currentBranch.type = 'expression';
				break;
			case 'eq':
			case 'ne':
			case 'lt':
			case 'le':
			case 'gt':
			case 'ge':
			case 'like':
				currentBranch.type = 'binaryExpression';
				break;
			case 'params':
				currentBranch.type = 'params';
				currentBranch.children = [];
				break;
			case 'null':
				currentBranch.type = 'unaryExpression';
				break;
			case 'exists':
				currentBranch.type = 'existsExpression';
				break;
			case 'root':
				currentBranch.type = 'condition';
				break;
			case '#comment':
				return null;
			default:
				currentBranch.type = currentBranch.name;
				break;
		}
		if (
			currentBranch.type === 'property' ||
			currentBranch.type === 'propertyItem' ||
			currentBranch.type === 'constant' ||
			currentBranch.type === 'count' ||
			currentBranch.type === 'existsExpression' ||
			currentBranch.type === 'max' ||
			currentBranch.type === 'min'
		) {
			var nodeItem = parseSelectedItem(currentNode, dataSource);
			if (nodeItem) {
				currentBranch.id = nodeItem.id;
				currentBranch.label = currentBranch.label
					? currentBranch.label
					: nodeItem.name;
			}
		}

		if (currentNode.childNodes && currentNode.childNodes.length > 0) {
			currentBranch.children = [];
			for (var i = 0; i < currentNode.childNodes.length; i++) {
				if (currentNode.childNodes[i].nodeType === 3) {
					//textNode
					currentBranch.value = currentBranch.value
						? currentBranch.value
						: currentNode.childNodes[i].text;
				} else {
					var childCondition = parseConditions(
						currentNode.childNodes[i],
						dataSource,
						currentBranch
					);
					if (childCondition) {
						currentBranch.children.push(childCondition);
					}
				}
			}
		}
		return currentBranch;
	}

	function initialize(root) {
		root.children = [
			{
				name: 'condition',
				type: 'condition'
			}
		];
	}

	function ParsingError(message, location) {
		this.message = message;
		this.location = location;
	}

	return declare('ConditionsTree', null, {
		root: {},
		constructor: function () {},
		removeBranch: function (branch) {
			if (branch.parent) {
				if (branch.parent.children.length === 1) {
					branch.parent.children = null;
				} else {
					var idx = branch.parent.children.indexOf(branch);
					branch.parent.children[idx] = undefined;
				}
			}
		},
		convertToChildOfNewBranch: function (branch, type, nodeName) {
			if (branch.parent && type && nodeName) {
				var newBranch = {
					type: type,
					name: nodeName,
					children: nodeName === 'not' ? [branch] : [branch, undefined],
					parent: branch.parent
				};
				var idx = branch.parent.children.indexOf(branch);
				branch.parent.children[idx] = newBranch;
				branch.parent = newBranch;
			}
		},
		fromXml: function (xml, dataSource) {
			this.root = parseConditions(xml, dataSource);
		},
		toString: function () {
			var conditionTreeNavigator = new ConditionTreeNavigator();
			var visitor = new BaseVisitor(conditionTreeNavigator);
			conditionTreeNavigator.accept(this.root, visitor);
			var conditionStr = visitor.getText();
			return conditionStr;
		},
		toXml: function () {
			var conditionDom = new XmlDocument();
			function stringifyBranch(data, xmlBranch) {
				var node;
				node = conditionDom.createElement(data.name);
				if (data.name === 'property') {
					node.setAttribute('name', data.value);
					if (data.owner) {
						node.setAttribute('query_items_xpath', data.owner);
					}
				}
				var innerNode;
				if (data.value) {
					var isAggregate =
						data.name === 'count' ||
						data.name === 'exists' ||
						data.name === 'max' ||
						data.name === 'min';
					var isAggregateWithProperty =
						data.name === 'max' || data.name === 'min';
					if (isAggregate) {
						innerNode = node.appendChild(
							conditionDom.createElement('query_reference_path')
						);
					}
					if (data.name === 'constant') {
						if (
							data.value.length > 2 &&
							data.value[0] === data.value[data.value.length - 1] &&
							(data.value[0] === '"' || data.value[0] === "'")
						) {
							data.value = data.value.slice(1, -1);
						}
						innerNode = node;
					}
					if (data.name === 'method_name') {
						innerNode = node;
					}
					if (innerNode) {
						innerNode.appendChild(conditionDom.createTextNode(data.value));
					}
					if (isAggregateWithProperty) {
						innerNode = node.appendChild(
							conditionDom.createElement('child_property_name')
						);
						innerNode.appendChild(conditionDom.createTextNode(data.propName));
					}
				}
				xmlBranch.appendChild(node);
				if (data.children) {
					data.children.forEach(function (child) {
						stringifyBranch(child, node);
					});
				}
				return node;
			}

			if (this.root.children) {
				this.root.children.forEach(function (child) {
					stringifyBranch(child, conditionDom);
				});
			}
			return conditionDom;
		},
		fillUnknown: function (branch, conditionsDataSource, possibleMethods) {
			var value = branch.value;

			var possibleProperty;
			switch (branch.type) {
				case 'propertyItem': {
					branch.value = null;
					var accessedItem = branch.accessedItem;
					var property = branch.propertyItem;
					var findProperty = function (prop) {
						return prop.label === property;
					};
					var isFromParent = false;
					possibleProperty = conditionsDataSource.reduce(function (acc, item) {
						if (!acc && item.name === accessedItem && item.properties) {
							var resultProperty = item.properties.find(findProperty);
							if (resultProperty) {
								acc = resultProperty;
								isFromParent = item.id === conditionsDataSource[0].id;
							}
						}
						return acc;
					}, false);
					if (!possibleProperty) {
						throw new ParsingError(
							aras.getResource(
								'../Modules/aras.innovator.QueryBuilder/',
								'condition_editor.invalid_property_name',
								value
							),
							branch.location
						);
					}
					branch.label = wrapPropertyName(possibleProperty.label);
					branch.value = possibleProperty.name;
					if (isFromParent) {
						//todo: check scope
						branch.owner = 'parent::Item';
					}
					break;
				}
				case 'property': {
					possibleProperty = conditionsDataSource.find(function (el) {
						return el.name.toLowerCase() === value.toLowerCase();
					});
					if (possibleProperty) {
						branch.label = wrapPropertyName(value);
						branch.value = possibleProperty.id;
					} else {
						throw new ParsingError(
							aras.getResource(
								'../Modules/aras.innovator.QueryBuilder/',
								'condition_editor.invalid_property_name',
								value
							),
							branch.location
						);
					}
					break;
				}
				case 'method_call': {
					if (!possibleMethods) {
						possibleMethods = [];
					}
					const methodNameBranch = branch.children.find(function (el) {
						return el.name === 'method_name';
					});
					const argsBranch = branch.children.find(function (el) {
						return el.name === 'params';
					});
					const possibleMethod = possibleMethods.find(function (el) {
						return (
							el.name.toLowerCase() === methodNameBranch.value.toLowerCase()
						);
					});
					if (possibleMethod) {
						methodNameBranch.label = possibleMethod.name;
						methodNameBranch.value = possibleMethod.name;
					} else {
						throw new ParsingError(
							aras.getResource(
								'../Modules/aras.innovator.QueryBuilder/',
								'condition_editor.invalid_method_name',
								methodNameBranch.value
							),
							methodNameBranch.location
						);
					}
					if (
						!possibleMethod.args ||
						(possibleMethod.args &&
							possibleMethod.args.length !== argsBranch.children.length)
					) {
						throw new ParsingError(
							aras.getResource(
								'../Modules/aras.innovator.QueryBuilder/',
								'condition_editor.invalid_method_arguments_count'
							),
							argsBranch.location
						);
					} else {
						possibleMethod.args.forEach(function (possibleArgument, index) {
							const enteredArgument = argsBranch.children[index].children[0];
							if (
								!possibleArgument.type.some(function (type) {
									return enteredArgument.name === type;
								})
							) {
								throw new ParsingError(
									aras.getResource(
										'../Modules/aras.innovator.QueryBuilder/',
										'condition_editor.invalid_method_argument_type',
										enteredArgument.name
									),
									argsBranch.location
								);
							}
						});
					}
					break;
				}
				case 'max':
				case 'min': {
					possibleProperty = conditionsDataSource.find(function (el) {
						return (
							el.name.replace('[', '').replace(']', '').toLowerCase() ===
							branch.value.toLowerCase()
						);
					});
					branch.propName = possibleProperty.propName;
					branch.value = possibleProperty.refId;
					break;
				}
				case 'count':
				case 'exists': {
					possibleProperty = conditionsDataSource.find(function (el) {
						return el.name.toLowerCase() === branch.value.toLowerCase();
					});
					branch.value = possibleProperty.id
						.replace(branch.type + '(', '')
						.replace(')', '');
					break;
				}
			}
			if (branch.children) {
				branch.children.forEach(function (child) {
					this.fillUnknown(child, conditionsDataSource, possibleMethods);
				}, this);
			}
		},
		synchronize: function (conditionBranch) {
			if (this.root.children && this.root.children[0]) {
				this.root.children[0].children = [conditionBranch];
				conditionBranch.parent = this.root.children[0];
			} else {
				initialize(this.root);
				this.synchronize(conditionBranch);
			}
			return true;
		}
	});
});
