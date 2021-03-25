define(['dojo/_base/declare'], function (declare) {
	return declare(
		'Aras.Client.Controls.EffectivityExpression.ExpressionSerializer',
		null,
		{
			renderUtils: null,
			_scope: null,
			_scopeId: null,
			aras: null,

			constructor: function (args) {
				this.renderUtils = args.renderUtils;
				this._scopeId = args.scopeId;
				this.aras = args.aras;

				this._initScope();
			},

			serializeExpressionDataToXml: function (expressionData) {
				var serializedValue = '';

				if (expressionData) {
					var expressionValue;
					var i;

					expressionData = Array.isArray(expressionData)
						? expressionData
						: [expressionData];
					expressionData = expressionData.filter(function (dataItem) {
						return (
							dataItem &&
							(typeof dataItem !== 'object' || dataItem.type !== 'whitespace')
						);
					});

					if (expressionData.length === 4) {
						expressionValue = this._serializeExpressionToXml(expressionData[1]);
						serializedValue += this.renderUtils.wrapInTag(
							expressionValue,
							'CONDITION'
						);

						expressionValue = this._serializeExpressionToXml(expressionData[3]);
						serializedValue += this.renderUtils.wrapInTag(
							expressionValue,
							'CONSEQUENCE'
						);

						serializedValue = this.renderUtils.wrapInTag(
							serializedValue,
							'IMPLICATION'
						);
					} else {
						for (i = 0; i < expressionData.length; i++) {
							serializedValue += this._serializeExpressionToXml(
								expressionData[i]
							);
						}
					}
					serializedValue = this.renderUtils.wrapInTag(
						serializedValue,
						'expression'
					);
				}

				return serializedValue;
			},

			_serializeExpressionToXml: function (expressionData) {
				var expressionXml = '';
				switch (expressionData.type) {
					case 'BinaryExpression':
						var variableName = expressionData.leftOperand.text;
						var variable = this._getVariableByName(variableName);
						var namedConstant = this._getNamedConstantByName(
							variableName,
							expressionData.rightOperand.text
						);

						expressionXml += this.renderUtils.wrapInTag('', 'variable', {
							id: variable.id
						});
						expressionXml += this.renderUtils.wrapInTag('', 'named-constant', {
							id: namedConstant.id
						});
						expressionXml = this.renderUtils.wrapInTag(expressionXml, 'EQ');
						break;
					case 'LogicExpression':
					case 'MacroExpression':
						var expressionParts = expressionData.children;

						for (let i = 0; i < expressionParts.length; i++) {
							expressionXml += this._serializeExpressionToXml(
								expressionParts[i]
							);
						}

						expressionXml = this.renderUtils.wrapInTag(
							expressionXml,
							expressionData.op,
							expressionData.brackets ? { brackets: true } : undefined
						);
						break;
					case 'MoreLessExpression':
					case 'StringExpression':
						expressionXml = this._parseMoreLessEqualExpression(expressionData);
						break;
				}

				return expressionXml;
			},

			_parseMoreLessEqualExpression: function (expressionData) {
				var tagName;
				switch (expressionData.op) {
					case '>=':
						tagName = 'GE';
						break;
					case '<=':
						tagName = 'LE';
						break;
					case '=':
						tagName = 'EQ';
						break;
					default:
						return;
				}

				var variableName = expressionData.leftOperand.text;
				var variable = this._getVariableByName(variableName);
				var expressionXml = this.renderUtils.wrapInTag('', 'variable', {
					id: variable.id
				});

				let rightOperandValue = expressionData.rightOperand.text;
				let datatype = variable.datatype.toLowerCase();
				if (datatype === 'datetime') {
					rightOperandValue = this._convertDateToNeutralFormat(
						rightOperandValue
					);
				}

				expressionXml += this.renderUtils.wrapInTag(
					rightOperandValue,
					'constant',
					{ type: datatype }
				);
				return this.renderUtils.wrapInTag(expressionXml, tagName);
			},

			_expressionPropositionFormDeserializer: function (term) {
				const namedConstantId = term.namedConstantId;
				const variableId = term.variableId;
				const variable = this._getVariableById(variableId);
				const variableName =
					variable && variable.name ? variable.name : variableId;

				let variableValue;
				if (namedConstantId) {
					const namedConstant = this._getNamedConstantById(
						variableId,
						namedConstantId
					);
					variableValue =
						namedConstant && namedConstant.name
							? namedConstant.name
							: namedConstantId;
				} else {
					variableValue =
						term.rightOperandType.toLowerCase() === 'datetime'
							? this._convertDateFromNeutralFormat(term.rightOperandValue)
							: term.rightOperandValue;
				}

				return (
					this._addBracketsIfNeeded(variableName) +
					' ' +
					(term.operator || '=') +
					' ' +
					this._addBracketsIfNeeded(variableValue)
				);
			},

			deserializeExpressionToString: function (definitionPropertyValue) {
				var deserializedValue = '';

				if (definitionPropertyValue) {
					let expressionNode = this._getExpressionNode(definitionPropertyValue);

					if (expressionNode && expressionNode.firstChild) {
						let rootNode = expressionNode.firstChild;

						if (
							this._compareNodeNameWithStringCaseInsensitive(
								rootNode,
								'IMPLICATION'
							)
						) {
							var conditionNode = rootNode.firstChild;
							var consequenceNode = conditionNode.nextSibling;
							deserializedValue =
								'IF ' +
								this._deserializeExpressionNodeToString(
									conditionNode.firstChild,
									null
								);
							deserializedValue +=
								' THEN ' +
								this._deserializeExpressionNodeToString(
									consequenceNode.firstChild,
									null
								);
						} else {
							deserializedValue = this._deserializeExpressionNodeToString(
								rootNode,
								null
							);
						}
					}
				}

				return deserializedValue;
			},

			_deserializeExpressionNodeToString: function (targetNode, parentNode) {
				var deserializedValue = '';

				if (targetNode) {
					var nodeName = targetNode.nodeName.toUpperCase();
					var currentChildNode;
					var innerExpressionValues;

					switch (nodeName) {
						case 'EQ':
						case 'LE':
						case 'GE':
							deserializedValue = this._deserializeEqualMoreLess(
								targetNode,
								parentNode,
								nodeName
							);
							break;
						case 'NOT':
							deserializedValue +=
								nodeName +
								' ' +
								this._deserializeExpressionNodeToString(
									targetNode.firstChild,
									targetNode
								);
							break;
						case 'EXACTLY-ONE':
						case 'AT-LEAST-ONE':
						case 'AT-MOST-ONE':
							currentChildNode = targetNode.firstChild;
							innerExpressionValues = [];

							while (currentChildNode) {
								innerExpressionValues.push(
									this._deserializeExpressionNodeToString(
										currentChildNode,
										targetNode
									)
								);
								currentChildNode = currentChildNode.nextSibling;
							}

							deserializedValue +=
								nodeName + ' (' + innerExpressionValues.join(' | ') + ')';
							break;
						case 'AND':
						case 'OR':
							var innerExpression;

							currentChildNode = targetNode.firstChild;
							innerExpressionValues = [];

							while (currentChildNode) {
								innerExpressionValues.push(
									this._deserializeExpressionNodeToString(
										currentChildNode,
										targetNode
									)
								);
								currentChildNode = currentChildNode.nextSibling;
							}

							innerExpression = innerExpressionValues.join(
								' ' + nodeName + ' '
							);
							deserializedValue += parentNode
								? '(' + innerExpression + ')'
								: innerExpression;
							break;
					}
				}

				return deserializedValue;
			},

			_deserializeEqualMoreLess: function (targetNode, parentNode, nodeName) {
				const variable = targetNode.firstChild;
				const variableId = variable.getAttribute('id');
				const valueNode = targetNode.lastChild;

				const term = { variableId: variableId };
				switch (nodeName) {
					case 'EQ':
						if (valueNode.nodeName.toLowerCase() == 'constant') {
							term.rightOperandValue = valueNode.text;
							term.rightOperandType = valueNode.getAttribute('type');
						} else {
							term.namedConstantId = valueNode.getAttribute('id');
						}
						term.operator = '=';
						break;
					case 'GE':
						term.rightOperandValue = valueNode.text;
						term.rightOperandType = valueNode.getAttribute('type');
						term.operator = '>=';
						break;
					case 'LE':
						term.rightOperandValue = valueNode.text;
						term.rightOperandType = valueNode.getAttribute('type');
						term.operator = '<=';
						break;
					default:
						return;
				}

				const optionDeserializedValue = this._expressionPropositionFormDeserializer(
					term
				);
				return parentNode &&
					this._compareNodeNameWithStringCaseInsensitive(parentNode, 'NOT')
					? '(' + optionDeserializedValue + ')'
					: optionDeserializedValue;
			},

			_addBracketsIfNeeded: function (expressionUnit) {
				const specialSymbolsRegExp = /^[a-zA-Z0-9]+$/;

				return !specialSymbolsRegExp.test(expressionUnit)
					? '[' + expressionUnit + ']'
					: expressionUnit;
			},

			_getExpressionNode: function (xmlString) {
				let expressionDocument = new XmlDocument();
				const isXmlLoadedSuccessfully = expressionDocument.loadXML(
					xmlString.replace(/\r?\n|\t/g, '')
				);
				return isXmlLoadedSuccessfully &&
					this._compareNodeNameWithStringCaseInsensitive(
						expressionDocument.documentElement,
						'EXPRESSION'
					)
					? expressionDocument.documentElement
					: null;
			},

			_convertDateToNeutralFormat: function (date) {
				return this.aras
					.convertToNeutral(date, 'date', 'short_date')
					.replace('T00:00:00', '');
			},

			_convertDateFromNeutralFormat: function (date) {
				return this.aras.convertFromNeutral(date, 'date', 'short_date');
			},

			_getVariableByName: function (variableName) {
				return this._scope.variables[variableName];
			},

			_getVariableById: function (variableId) {
				if (!this._scope) {
					return;
				}

				const variables = this._scope.variables;
				const variableNames = Object.keys(variables);
				const variableNamesCount = variableNames.length;

				for (let varIndex = 0; varIndex < variableNamesCount; varIndex++) {
					const variableName = variableNames[varIndex];
					const variable = variables[variableName];
					if (variable.id === variableId) {
						return variable;
					}
				}
			},

			_getNamedConstantById: function (variableId, namedConstantId) {
				const variable = this._getVariableById(variableId);
				if (!variable) {
					return;
				}

				const namedConstants = variable.namedConstants;
				const namedConstantNames = Object.keys(namedConstants);
				const namedConstantNamesCount = namedConstantNames.length;

				for (let ncIndex = 0; ncIndex < namedConstantNamesCount; ncIndex++) {
					const namedConstantName = namedConstantNames[ncIndex];
					const namedConstant = namedConstants[namedConstantName];
					if (namedConstant.id === namedConstantId) {
						return namedConstant;
					}
				}
			},

			_getNamedConstantByName: function (variableName, namedConstantName) {
				var variable = this._scope.variables[variableName];
				return variable.namedConstants[namedConstantName];
			},

			getScope: function () {
				return this._scope;
			},

			_initScope: function () {
				if (this._scopeId) {
					var effScope = this.aras.newIOMItem('effs_scope', 'get');
					effScope.setID(this._scopeId);
					effScope.setAttribute('select', 'builder_method(name)');
					effScope = effScope.apply();
					if (effScope.isError()) {
						this.aras.AlertError(effScope);
						return;
					}

					var builderMethod = effScope.getPropertyItem('builder_method');
					var scopeItem = this.aras.newIOMItem(
						'Method',
						'cfg_GetScopeStructure'
					);
					var targetScope = this.aras.newIOMItem(
						'Method',
						builderMethod.getProperty('name')
					);
					targetScope.setID(this._scopeId);
					scopeItem.setID(this._scopeId);
					scopeItem.setPropertyItem('targetScope', targetScope);
					scopeItem.setProperty(
						'output_buider_method',
						'effs_ScopeOutputBuilderMethod'
					);
					scopeItem = scopeItem.apply();

					if (scopeItem.isError()) {
						this.aras.AlertError(scopeItem);
					}
					this._scope = this._parseScopeToObject(scopeItem);
				}
			},

			_parseScopeToObject: function (scopeItem) {
				var scope = {
					id: scopeItem.getID(),
					name: scopeItem.getProperty('name'),
					variables: {}
				};
				var variables = scopeItem.getRelationships('Variable');
				var variablesCount = variables.getItemCount();
				for (var varIndex = 0; varIndex < variablesCount; varIndex++) {
					var variable = variables.getItemByIndex(varIndex);
					var variableId = variable.getID();
					var variableName = variable.getProperty('name');
					var variableDataType = variable.getProperty('datatype', '');
					var variableObj = {
						id: variableId,
						name: variableName,
						namedConstants: {},
						datatype: variableDataType
					};

					var namedConstants = variable.getRelationships();
					var namedConstantsCount = namedConstants.getItemCount();
					for (var ncIndex = 0; ncIndex < namedConstantsCount; ncIndex++) {
						var namedConstant = namedConstants.getItemByIndex(ncIndex);
						var namedConstantId = namedConstant.getID();
						var namedConstantName = namedConstant.getProperty('name');
						variableObj.namedConstants[namedConstantName] = {
							id: namedConstantId,
							name: namedConstantName
						};
					}

					scope.variables[variableName] = variableObj;
				}

				return scope;
			},

			_compareNodeNameWithStringCaseInsensitive: function (node, name) {
				return node.nodeName.toUpperCase() === name.toUpperCase();
			}
		}
	);
});
