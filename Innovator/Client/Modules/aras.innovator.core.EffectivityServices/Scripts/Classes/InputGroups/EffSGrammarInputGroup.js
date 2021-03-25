define([
	'dojo/_base/declare',
	'Modules/aras.innovator.core.Controls/Scripts/Controls/RuleEditor/InputGroups/GrammarInputGroup'
], function (declare, GrammarInputGroup) {
	return declare(
		'EffectivityExpressionEditor.EffSGrammarInputGroup',
		[GrammarInputGroup],
		{
			_expectedLexemType: null,

			getIntelliSenseContext: function () {
				var context = this.inherited(arguments);
				context.expectedLexemType = this._expectedLexemType;
				return context;
			},

			_normalizeParseException: function (parseException) {
				if (parseException) {
					var expectedParts = parseException.expected;
					if (
						expectedParts &&
						expectedParts[0] &&
						expectedParts[0].description == 'ValidDateTimeValue'
					) {
						var normalizedException = {
							expected: [],
							message: 'Expected ',
							location: parseException.location,
							expectedType: 'DateTime'
						};

						return normalizedException;
					}
				}

				return this.inherited(arguments);
			},

			applyIntellisenseValue: function (selectedValue, intellisenseContext) {
				const validLexems = ['(', ')', '=', '>=', '<='];
				const handleSelectedValue = validLexems.indexOf(selectedValue) === -1;
				let numberOfAddedLexemes = 0;

				if (handleSelectedValue) {
					let hasOpenedSquareBracket = false;
					let hasClosedSquareBracket = false;
					const specialCharactersRegExp = /[\s\(\)>=<]/;

					if (intellisenseContext && intellisenseContext.cursorPosition > 0) {
						let previousLexem = this._getLexemByCursorPosition(
							intellisenseContext.cursorPosition - 1
						);

						if (previousLexem.type === 'unknown') {
							if (
								intellisenseContext.replaceLength &&
								previousLexem.text.substr(
									intellisenseContext.replaceLength,
									1
								) === ']'
							) {
								hasClosedSquareBracket = true;
							}

							const previousLexemStartPosition = this._getLexemStartPosition(
								previousLexem
							);
							if (previousLexemStartPosition > 0) {
								previousLexem = this._getLexemByCursorPosition(
									previousLexemStartPosition - 1
								);
							}
						}

						if (
							previousLexem.type === 'squarebracket' &&
							previousLexem.text === '['
						) {
							hasOpenedSquareBracket = true;
						}
					}

					if (
						hasOpenedSquareBracket ||
						specialCharactersRegExp.test(selectedValue)
					) {
						selectedValue =
							(hasOpenedSquareBracket ? '' : '[') +
							selectedValue +
							(hasClosedSquareBracket ? '' : ']');
						if (!hasOpenedSquareBracket) {
							numberOfAddedLexemes++;
						}
						if (!hasClosedSquareBracket) {
							numberOfAddedLexemes++;
						}
					}
				}

				if (intellisenseContext) {
					intellisenseContext.numberOfAddedLexemes = numberOfAddedLexemes;
				}

				return this.inherited(arguments);
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
						if (
							cursorLexem !== errorLexem ||
							cursorLexem.type === 'whitespace'
						) {
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
					(previousPositionLexem.type === 'VariableName' ||
						previousPositionLexem.type === 'ValidValueName')
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
					(!parseException ||
						errorLexemIndex >= this._getLexemIndex(cursorLexem))
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

				if (
					expectedOptions.length ||
					(parseException && parseException.expectedType)
				) {
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
					this._expectedLexemType = parseException.expectedType;
				} else {
					this._expectedLexemType = '';
				}

				return resultOptions;
			}
		}
	);
});
