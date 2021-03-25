define([
	'dojo/_base/declare',
	'Vendors/peg-0.10.0.min',
	'./InputGroup'
], function (declare, pegjs, BaseInputGroup) {
	return declare('TemplatedEditor.GrammarInputGroup', [BaseInputGroup], {
		valueParser: null,
		_parseData: null,
		_savedCaretPosition: 0,
		_intellisenseLexem: null,
		_intellisenseSlicedLexemLength: null,

		constructor: function (ownerEditor, groupDescriptor) {},

		_constructorInitProperties: function (ownerEditor, groupDescriptor) {
			this.inherited(arguments);

			this._parseData = {
				lexems: [{ type: 'inputEnd', text: '' }],
				expression: null,
				exception: null
			};

			if (groupDescriptor.grammaText) {
				this.valueParser = pegjs.generate(groupDescriptor.grammaText, {
					allowedStartRules: ['ExpressionAnalysis', 'LexemAnalysis']
				});
			} else if (groupDescriptor.grammarFile) {
				require(['dojo/text!' + groupDescriptor.grammarFile], function (
					grammarFileContent
				) {
					this.valueParser = pegjs.generate(grammarFileContent, {
						allowedStartRules: ['ExpressionAnalysis', 'LexemAnalysis']
					});
				}.bind(this));
			}
		},

		setParserProperty: function (propertyName, propertyValue) {
			if (propertyName) {
				this.valueParser[propertyName] = propertyValue;
			}
		},

		isEditable: function () {
			return this.owner.isEditable();
		},

		getParsedExpression: function () {
			return (this._parseData && this._parseData.expression) || [];
		},

		_getRenderContentNodeAttributes: function () {
			var nodeAttributes = this.inherited(arguments);

			if (this.isEditable()) {
				nodeAttributes.contenteditable = true;
			}

			return nodeAttributes;
		},

		_getRenderCssClasses: function () {
			var cssClasses = this.inherited(arguments);

			cssClasses.push('grammarInputGroup');
			return cssClasses;
		},

		_prepareValueForDom: function (contentValue) {
			var parseData = this._parseData;
			var parsedLexems = parseData.lexems || [];
			var resultValue = '';

			if (parsedLexems.length) {
				var lastValidSymbolIndex = parseData.exception
					? parseData.exception.location.start.offset - 1
					: this._value.length;
				var lastValidLexemIndex = lastValidSymbolIndex
					? this._getLexemIndex(
							this._getLexemByCursorPosition(lastValidSymbolIndex)
					  )
					: -1;
				var descriptorLexemStyles = this._descriptor.lexemStyles || {};
				var descriptorStyle;
				var lexemCssClasses;
				var lexemDescriptor;
				var lexemText;
				var i;

				for (i = 0; i < parsedLexems.length; i++) {
					lexemDescriptor = parsedLexems[i];
					lexemText = lexemDescriptor.text.replace(/\s/g, '\u2000');

					if (lexemText) {
						descriptorStyle = descriptorLexemStyles[lexemDescriptor.type] || {};

						lexemCssClasses =
							'Lexem' + (lastValidLexemIndex < i ? ' InvalidLexem' : '');
						lexemCssClasses += ' ' + lexemDescriptor.type;
						lexemCssClasses += descriptorStyle.cssClass
							? ' ' + descriptorStyle.cssClass
							: '';

						resultValue += this.renderUtils.HTML.wrapInTag(lexemText, 'span', {
							class: lexemCssClasses
						});
					}
				}
			}

			// 'inputEnd' dom node should be created to be used during context menu anchor position calculation
			resultValue += this.renderUtils.HTML.wrapInTag('', 'span', {
				class: 'InputEnd'
			});

			return resultValue;
		},

		focus: function (requiredCursorPosition) {
			var valueLength = this._value ? this._value.length : 0;

			this.inherited(arguments);

			if (valueLength) {
				var cursorPosition = valueLength;

				if (requiredCursorPosition !== undefined) {
					switch (typeof requiredCursorPosition) {
						case 'string':
							cursorPosition =
								requiredCursorPosition === 'end' ? valueLength : 0;
							break;
						case 'number':
							cursorPosition = Math.min(requiredCursorPosition, valueLength);
							break;
						default:
							break;
					}
				}

				this._setCursorPosition(cursorPosition);
			}
		},

		onFocusHandler: function () {
			this._savedCaretPosition = this._getCursorPosition();
			this.inherited(arguments);
		},

		onBlurHandler: function (blurEvent) {
			this.inherited(arguments);
		},

		getState: function () {
			if (this.isFocused()) {
				return { cursorPosition: this._savedCaretPosition };
			}
		},

		restoreState: function (stateInfo) {
			if (stateInfo) {
				if (stateInfo.cursorPosition) {
					this._setCursorPosition(stateInfo.cursorPosition);
				}
			}
		},

		_getCursorPosition: function () {
			var windowSelection = window.getSelection();
			var nomalizedPosition = 0;

			if (windowSelection.rangeCount) {
				var selectionRange = windowSelection.getRangeAt(0);
				var selectedNode = selectionRange.startContainer;
				var currentChild;

				if (selectedNode === this.contentNode) {
					var childNodes = selectedNode.childNodes;

					currentChild =
						childNodes.length &&
						selectionRange.startOffset &&
						selectedNode.childNodes[selectionRange.startOffset - 1];
				} else {
					nomalizedPosition -= selectedNode.textContent.length;
					while (
						selectedNode.parentNode &&
						selectedNode.parentNode.nodeName.toUpperCase() !== 'DIV'
					) {
						selectedNode = selectedNode.parentNode;
					}
					nomalizedPosition +=
						selectedNode.textContent.length + selectionRange.startOffset;
					currentChild = selectedNode.previousSibling;
				}

				while (currentChild) {
					nomalizedPosition += currentChild.textContent.length;
					currentChild = currentChild.previousSibling;
				}
			}

			return nomalizedPosition;
		},

		_setCursorPosition: function (cursorPosition) {
			var childNode = this.contentNode.firstChild;

			if (childNode) {
				var textNode = childNode.firstChild;
				var currentLength = 0;

				while (
					childNode &&
					currentLength + childNode.textContent.length < cursorPosition
				) {
					currentLength += childNode.textContent.length;
					childNode = childNode.nextSibling;

					if (childNode) {
						textNode = childNode.firstChild;
					}
				}

				if (textNode) {
					var ownerDocument = this.domNode.ownerDocument;
					var windowSelection = window.getSelection();
					var newRange = ownerDocument.createRange();

					newRange.setStart(textNode, cursorPosition - currentLength);
					newRange.setEnd(textNode, cursorPosition - currentLength);

					try {
						windowSelection.removeAllRanges();
					} catch (ex) {}

					windowSelection.addRange(newRange);
					this._savedCaretPosition = cursorPosition;
				}
			}
		},

		_parseValue: function (inputValue, optionalParameters) {
			var parseData = {
				lexems: [],
				expression: null,
				exception: null
			};

			optionalParameters = optionalParameters || {};

			if (this.valueParser) {
				if (!optionalParameters.skipLexemAnalysis) {
					var lemexList = this.valueParser.parse(inputValue, {
						startRule: 'LexemAnalysis'
					});

					lemexList.push({ type: 'inputEnd', text: '' });
					parseData.lexems = this._normalizeLexemList(lemexList);
					this._normalizeLexemValues(parseData.lexems);

					inputValue = this._getValueFromLexems(parseData.lexems);
				}

				try {
					parseData.expression = this.valueParser.parse(inputValue, {
						startRule: 'ExpressionAnalysis'
					});
				} catch (parseError) {
					parseData.exception = this._normalizeParseException(parseError);
				}
			} else {
				parseData.lexems = [this._value];
			}

			return parseData;
		},

		_normalizeLexemList: function (lexemList, normalizedList) {
			var currentLexem;
			var i;

			normalizedList = normalizedList || [];

			for (i = 0; i < lexemList.length; i++) {
				currentLexem = lexemList[i];

				if (Array.isArray(currentLexem)) {
					this._normalizeLexemList(currentLexem, normalizedList);
				} else {
					normalizedList.push(currentLexem);
				}
			}

			return normalizedList;
		},

		_normalizeLexemValues: function (lexemList) {
			if (lexemList && lexemList.length) {
				var currentLexem;
				var lexemValueCollection;
				var lowerCaseValue;
				var normalizedValue;
				var valuesHash;
				var i;

				for (i = 0; i < lexemList.length; i++) {
					currentLexem = lexemList[i];

					switch (currentLexem.type) {
						case 'inputEnd':
						case 'whitespace':
						case 'unknown':
							break;
						default:
							lowerCaseValue = currentLexem.text.toLowerCase();
							lexemValueCollection =
								this.valueParser.getValueCollectionByRuleName(
									currentLexem.type
								) || [];

							valuesHash = this._getCollectionValuesHash(lexemValueCollection);
							normalizedValue = valuesHash[lowerCaseValue];

							if (normalizedValue && lowerCaseValue !== normalizedValue) {
								currentLexem.text = normalizedValue;
							}
							break;
					}
				}
			}
		},

		_getCollectionValuesHash: function (targetCollection) {
			var valuesHash = {};
			var optionValue;
			var optionKey;
			var i;

			targetCollection = Array.isArray(targetCollection)
				? targetCollection
				: Object.keys(targetCollection);

			for (i = 0; i < targetCollection.length; i++) {
				optionValue = targetCollection[i];
				optionKey = optionValue.toLowerCase();

				valuesHash[optionKey] = optionValue;
			}

			return valuesHash;
		},

		_normalizeParseException: function (parseException) {
			if (parseException) {
				var expectedParts = parseException.expected;
				var normalizedException = {
					expected: [],
					message: 'Expected ',
					location: parseException.location
				};
				var expectedPartDescriptor;
				var expectedOptions = [];
				var expectedExpressionPartNames = {};
				var expressionPartName;
				var delimiterIndex;
				var additionalInfo;
				var i;
				var j;

				if (!expectedParts) {
					try {
						var customInfo = JSON.parse(parseException.message);

						parseException.customInfo = customInfo;
						parseException.message = customInfo.message;

						expectedParts = customInfo.expected;
					} catch (jsonException) {}
				}

				expectedParts = expectedParts || [];

				for (i = 0; i < expectedParts.length; i++) {
					expectedPartDescriptor = expectedParts[i];

					if (typeof expectedPartDescriptor === 'object') {
						switch (expectedPartDescriptor.type) {
							case 'other':
								delimiterIndex = expectedPartDescriptor.description.indexOf(
									'|'
								);
								additionalInfo =
									delimiterIndex > -1
										? expectedPartDescriptor.description.substr(
												delimiterIndex + 1
										  )
										: '';

								if (additionalInfo) {
									expressionPartName = expectedPartDescriptor.description.substr(
										0,
										delimiterIndex
									);

									if (!expectedExpressionPartNames[expressionPartName]) {
										expectedExpressionPartNames[expressionPartName] = true;

										try {
											additionalInfo = JSON.parse(additionalInfo);

											if (additionalInfo.options) {
												for (j = 0; j < additionalInfo.options.length; j++) {
													normalizedException.expected.push(
														additionalInfo.options[j]
													);
												}
											}
										} catch (jsonException) {
											normalizedException.expected.push(additionalInfo);
										}
									}
								} else {
									var ruleName = expectedPartDescriptor.description;

									expressionPartName = ruleName;

									if (!expectedExpressionPartNames[expressionPartName]) {
										var valueCollection =
											this.valueParser.getValueCollectionByRuleName(ruleName) ||
											[];

										valueCollection = Array.isArray(valueCollection)
											? valueCollection
											: Object.keys(valueCollection);
										expectedExpressionPartNames[expressionPartName] = true;

										for (j = 0; j < valueCollection.length; j++) {
											normalizedException.expected.push(valueCollection[j]);
										}
									}
								}
								break;
							case 'literal':
								expressionPartName = expectedPartDescriptor.text;

								if (!expectedExpressionPartNames[expressionPartName]) {
									expectedExpressionPartNames[expressionPartName] = true;
									normalizedException.expected.push(expressionPartName);
								}
								break;
							default:
								break;
						}
					} else {
						expressionPartName = expectedParts[i];

						if (!expectedExpressionPartNames[expressionPartName]) {
							expectedExpressionPartNames[expressionPartName] = true;
							normalizedException.expected.push(expressionPartName);
						}
					}
				}

				normalizedException.message += Object.keys(
					expectedExpressionPartNames
				).join(', ');

				return normalizedException;
			}
		},

		setValue: function (newValue, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (newValue !== this._value || optionalParameters.forceChange) {
				this._parseData = this._parseValue(newValue);
				this._value = this._getValueFromLexems();

				this._refreshContentNode();

				if (!optionalParameters.suppressChangeEvent) {
					this.onValueChanged();
				}
			}
		},

		_saveCaretPosition: function () {
			var currentPosition = this._getCursorPosition();

			if (this._savedCaretPosition !== currentPosition) {
				this._savedCaretPosition = currentPosition;
				this.raiseEvent('onInvalidateIntellisense', this);
			}
		},

		_refreshContentNode: function () {
			var isCursorRestoreRequired = this.isFocused();

			this.inherited(arguments);

			if (isCursorRestoreRequired) {
				this._setCursorPosition(
					Math.min(this._savedCaretPosition, this._value.length)
				);
			}
		},

		attachDomEventListeners: function (targetDomNode) {
			this.inherited(arguments);

			if (targetDomNode) {
				this._attachDomEventListener(
					targetDomNode,
					'click',
					function (mouseEvent) {
						this._saveCaretPosition();
					}.bind(this)
				);

				this._attachDomEventListener(
					targetDomNode,
					'keyup',
					function (keyEvent) {
						if (this.isFocused()) {
							this._savedCaretPosition = this._getCursorPosition();
						}

						this.setValue(this._getValueFromDom());
					}.bind(this)
				);

				this._attachDomEventListener(
					targetDomNode,
					'keyup',
					function (keyEvent) {
						switch (keyEvent.keyCode) {
							case 37:
							case 39:
								this._saveCaretPosition();
								break;
							default:
								break;
						}
					}.bind(this)
				);
			}
		},

		onValueChanged: function () {
			this.inherited(arguments);
			this.toggleCssClasses('emptyGroup', this._value ? false : true);
		},

		validateInput: function () {
			var oldApprovedValue = this._approvedValue;
			var isInputValid = this.isInputValid();

			this.toggleCssClasses('invalidInput', !isInputValid);

			if (oldApprovedValue !== this._approvedValue) {
				this.raiseEvent('onValueEntered', this);
			}
		},

		isInputValid: function () {
			var parseData = this._parseData;

			this.errorString = '';

			if (!this._value || !parseData.exception) {
				this._approvedValue = this._value;
			} else {
				var unknowLexems = this._getLexemsByType('unknown');

				if (unknowLexems.length) {
					this.errorString += 'Unknown lexems: ' + unknowLexems.join(', ');
				}

				this.errorString +=
					(this.errorString ? '. ' : '') + parseData.exception.message;
				return false;
			}

			return true;
		},

		_getLexemsByType: function (lexemType) {
			var lexemList = this._parseData.lexems || [];
			var foundLexems = [];
			var currentLexem;
			var i;

			for (i = 0; i < lexemList.length; i++) {
				currentLexem = lexemList[i];

				if (currentLexem.type == lexemType) {
					foundLexems.push(currentLexem.text);
				}
			}

			return foundLexems;
		},

		_getLexemCount: function () {
			var parseData = this._parseData;

			return parseData ? parseData.lexems.length : 0;
		},

		applyIntellisenseValue: function (selectedValue, intellisenseContext) {
			if (intellisenseContext) {
				var cursorPosition = intellisenseContext.cursorPosition;
				var targetLexem =
					intellisenseContext.targetLexem ||
					this._getLexemByCursorPosition(cursorPosition);

				if (targetLexem) {
					var lexemIndex = this._getLexemIndex(targetLexem);

					if (targetLexem.type == 'whitespace') {
						var startPosition = this._getLexemStartPosition(targetLexem);
						var lexemText = targetLexem.text;
						var lexemCursorPosition = cursorPosition - startPosition;

						if (lexemCursorPosition) {
							targetLexem.text =
								lexemText.substr(0, lexemCursorPosition) +
								selectedValue +
								lexemText.substr(lexemCursorPosition);
							lexemIndex += 1;
						} else {
							targetLexem.text = selectedValue + lexemText;
						}
					} else {
						if (intellisenseContext.replaceLength) {
							targetLexem.text =
								selectedValue +
								targetLexem.text.substr(intellisenseContext.replaceLength);
						} else {
							targetLexem.text = selectedValue;
						}
					}

					this._intellisenseSuppressed = true;
					this.setValue(this._getValueFromLexems());
					this._intellisenseSuppressed = false;

					if (intellisenseContext.replaceLength) {
						this._setCursorPosition(
							cursorPosition +
								(selectedValue.length - intellisenseContext.replaceLength)
						);
					} else {
						if (intellisenseContext.numberOfAddedLexemes) {
							lexemIndex += intellisenseContext.numberOfAddedLexemes;
						}
						this._setCursorToLexem(lexemIndex);
					}
				} else {
					this.setValue(this._getValueFromLexems() + selectedValue);
					this._setCursorToLexem(this._getLastLexem());
				}
			} else {
				this.setValue(selectedValue);
			}
		},

		_getLastLexem: function () {
			var lexemList = this._parseData.lexems || [];

			return lexemList.length && lexemList[lexemList.length - 1];
		},

		_getLexemStartPosition: function (targetLexem) {
			if (targetLexem !== undefined) {
				var lexemList = this._parseData.lexems;
				var lexemIndex =
					typeof targetLexem == 'object'
						? this._getLexemIndex(targetLexem)
						: targetLexem;
				var resultPosition = 0;

				for (i = 0; i < lexemIndex; i++) {
					resultPosition += lexemList[i].text.length;
				}

				return resultPosition;
			}

			return -1;
		},

		_getLexemEndPosition: function (targetLexem) {
			if (targetLexem !== undefined) {
				targetLexem =
					typeof targetLexem == 'object'
						? targetLexem
						: this._parseData.lexems[targetLexem];

				return (
					this._getLexemStartPosition(targetLexem) + targetLexem.text.length
				);
			}

			return -1;
		},

		_setCursorToLexem: function (targetLexem) {
			var lexemEndPosition = this._getLexemEndPosition(targetLexem);

			this._setCursorPosition(lexemEndPosition);
		},

		_getValueFromLexems: function (lexemList) {
			var resultValue = '';
			var i;

			lexemList = lexemList || this._parseData.lexems;

			for (i = 0; i < lexemList.length; i++) {
				resultValue += lexemList[i].text;
			}

			return resultValue;
		},

		getIntelliSenseContext: function () {
			var lexemIndex = this._getLexemIndex(
				this._getLexemByCursorPosition(this._savedCaretPosition)
			);

			return {
				cursorPosition: this._savedCaretPosition,
				domNode:
					lexemIndex > -1 ? this.contentNode.childNodes[lexemIndex] : null,
				targetLexem: this._intellisenseLexem,
				replaceLength: this._intellisenseSlicedLexemLength
			};
		},

		getOptionsFromExpected: function (expectedInput) {
			var resultOptions = [];
			var expectedDescriptor;
			var delimiterIndex;
			var additionalInfo;
			var i;
			var j;

			expectedInput = expectedInput || [];

			for (i = 0; i < expectedInput.length; i++) {
				expectedDescriptor = expectedInput[i];

				if (typeof expectedDescriptor === 'object') {
					switch (expectedDescriptor.type) {
						case 'other':
							delimiterIndex = expectedDescriptor.description.indexOf('|');
							additionalInfo =
								delimiterIndex > -1
									? expectedDescriptor.description.substr(delimiterIndex + 1)
									: '';

							if (additionalInfo) {
								try {
									additionalInfo = JSON.parse(additionalInfo);

									if (additionalInfo.options) {
										for (j = 0; j < additionalInfo.options.length; j++) {
											resultOptions.push(additionalInfo.options[j]);
										}
									}
								} catch (parseException) {
									resultOptions.push(additionalInfo);
								}
							}
							break;
						case 'literal':
							resultOptions.push(expectedDescriptor.text);
							break;
						default:
							break;
					}
				} else {
					resultOptions.push(expectedInput[i]);
				}
			}

			return resultOptions;
		},

		_getLexemByCursorPosition: function (cursorPosition) {
			var lexemList = this._parseData.lexems || [];
			var valueLength = this._value.length;
			var currentPosition = 0;
			var lexemDescriptor;
			var i;

			if (cursorPosition > valueLength) {
				return lexemList[lexemList.length - 1];
			} else {
				cursorPosition =
					cursorPosition > valueLength ? valueLength : cursorPosition;

				for (i = 0; i < lexemList.length; i++) {
					lexemDescriptor = lexemList[i];

					if (
						currentPosition == cursorPosition ||
						currentPosition + lexemDescriptor.text.length > cursorPosition
					) {
						return lexemDescriptor;
					} else {
						currentPosition += lexemDescriptor.text.length;
					}
				}
			}
		},

		_getLexemIndex: function (lexemDescriptor) {
			var lexemList = this._parseData.lexems;

			return lexemList.indexOf(lexemDescriptor);
		},

		_escapeRegExpSymbols: function (inputValue) {
			return inputValue && inputValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		},

		getIntelliSenseOptions: function (allOptions) {
			var cursorLexem = this._getLexemByCursorPosition(
				this._savedCaretPosition
			);
			var previousPositionLexem =
				this._savedCaretPosition > 0
					? this._getLexemByCursorPosition(this._savedCaretPosition - 1)
					: null;
			var isIntermediatePosition =
				previousPositionLexem && previousPositionLexem !== cursorLexem;
			var currentValuePart = this._value.substr(0, this._savedCaretPosition);
			var parseData = this._parseValue(currentValuePart, {
				skipLexemAnalysis: true
			});
			var parseException = parseData.exception;
			var isValidLexem =
				!parseException ||
				this._getLexemEndPosition(cursorLexem) <=
					parseException.location.start.offset;
			var resultOptions = [];
			var expectedOptions = [];
			var slicedLexemLength;
			var errorLexem;
			var errorLexemIndex;
			var optionDescriptor;
			var selectedValue;
			var currentOption;
			var checkRegExp;
			var i;

			if (cursorLexem.type == 'inputEnd' && !isValidLexem) {
				cursorLexem = previousPositionLexem;
			}

			if (parseException) {
				errorLexem = this._getLexemByCursorPosition(
					parseException.location.start.offset
				);
				errorLexemIndex = this._getLexemIndex(errorLexem);

				if (
					parseException.location.start.offset < this._savedCaretPosition &&
					this._savedCaretPosition == this._getLexemStartPosition(cursorLexem)
				) {
					if (previousPositionLexem == errorLexem) {
						cursorLexem = errorLexem;
					}
				}

				if (errorLexemIndex >= this._getLexemIndex(cursorLexem)) {
					if (cursorLexem !== errorLexem || cursorLexem.type === 'whitespace') {
						for (i = 0; i < parseException.expected.length; i++) {
							currentOption = parseException.expected[i];
							expectedOptions.push(currentOption);
						}
					} else if (
						cursorLexem.type === 'unknown' ||
						cursorLexem.type === 'inputEnd'
					) {
						var cursorSlicedValue = cursorLexem.text.substr(
							0,
							this._savedCaretPosition -
								this._getLexemStartPosition(cursorLexem)
						);

						checkRegExp =
							cursorSlicedValue &&
							new RegExp(
								'^' + this._escapeRegExpSymbols(cursorSlicedValue) + '.+',
								'i'
							);

						for (i = 0; i < parseException.expected.length; i++) {
							currentOption = parseException.expected[i];

							if (!checkRegExp || checkRegExp.test(currentOption)) {
								expectedOptions.push(currentOption);
							}
						}

						if (cursorSlicedValue.length < cursorLexem.text.length) {
							slicedLexemLength = cursorSlicedValue.length;
						}
					}
				}
			}

			if (
				cursorLexem.type === 'inputEnd' &&
				previousPositionLexem &&
				(previousPositionLexem.type === 'FamilyName' ||
					previousPositionLexem.type === 'ValidOptionName')
			) {
				checkRegExp = new RegExp(
					'^' + this._escapeRegExpSymbols(previousPositionLexem.text) + '.+',
					'i'
				);
				var lexemOptions = this.valueParser.getValueCollectionByRuleName(
					previousPositionLexem.type
				);

				var optionOnClickFunction = function () {
					var intelliSenseContext = this.owner.intelliSenseMenu
						.intellisenseContext;
					intelliSenseContext.groupContext.targetLexem = previousPositionLexem;
				};
				for (currentOption in lexemOptions) {
					if (checkRegExp.test(currentOption)) {
						expectedOptions.push({
							text: currentOption,
							onClick: optionOnClickFunction.bind(this)
						});
					}
				}
			}

			if (
				allOptions &&
				!expectedOptions.length &&
				(!parseException || errorLexemIndex >= this._getLexemIndex(cursorLexem))
			) {
				var cursorLexemType = cursorLexem.type;

				if (cursorLexemType == 'whitespace' && isIntermediatePosition) {
					cursorLexem = previousPositionLexem;
					cursorLexemType = previousPositionLexem.type;
				}

				if (isValidLexem) {
					selectedValue = cursorLexem.text;
				}

				expectedOptions = this.valueParser.getValueCollectionByRuleName(
					cursorLexemType
				);
			}

			expectedOptions = expectedOptions
				? Array.isArray(expectedOptions)
					? expectedOptions
					: Object.keys(expectedOptions)
				: [];

			if (expectedOptions.length) {
				for (i = 0; i < expectedOptions.length; i++) {
					currentOption = expectedOptions[i];
					optionDescriptor = {
						id: i + 1,
						name:
							typeof currentOption == 'object'
								? currentOption.text
								: currentOption,
						onClick: currentOption.onClick
					};

					if (selectedValue === optionDescriptor.name) {
						resultOptions.selectedItemId = i + 1;
						resultOptions.unshift(optionDescriptor);
					} else {
						resultOptions.push(optionDescriptor);
					}
				}

				this._intellisenseLexem = cursorLexem;
				this._intellisenseSlicedLexemLength = slicedLexemLength;
			}

			return resultOptions;
		}
	});
});
