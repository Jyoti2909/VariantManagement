define(['dojo/_base/declare', './SelectInputGroup'], function (
	declare,
	SelectInputGroup
) {
	return declare('TemplatedEditor.MultiSelectInputGroup', [SelectInputGroup], {
		valueSeparator: null,
		allowDuplicates: null,
		_savedCaretPosition: null,

		constructor: function (ownerEditor, groupDescriptor) {
			this.valueSeparator =
				(groupDescriptor && groupDescriptor.valueSeparator) || ',';
			this.allowDuplicates =
				(groupDescriptor && Boolean(groupDescriptor.allowDuplicates)) || false;
		},

		_constructorInitProperties: function (ownerEditor, groupDescriptor) {
			this.inherited(arguments);

			this.valueSeparator =
				(groupDescriptor && groupDescriptor.valueSeparator) || ',';
			this.allowDuplicates =
				(groupDescriptor && Boolean(groupDescriptor.allowDuplicates)) || false;
		},

		onFocusHandler: function () {
			this._saveCaretPosition();
			this.inherited(arguments);
		},

		onBlurHandler: function (blurEvent) {
			this._savedCaretPosition = null;
			this.inherited(arguments);
		},

		_getRenderCssClasses: function () {
			var cssClasses = this.inherited(arguments);

			cssClasses.push('multiSelectGroup');
			return cssClasses;
		},

		isInputValid: function () {
			var groupDescriptor = this._descriptor;

			this.errorString = '';

			if (this._value) {
				var curentValues = this._getInputValues();
				var approvedValues = curentValues.slice();
				var isValid = true;
				var currentValue;
				var i;

				if (groupDescriptor.inputValidation === 'onlyOptions') {
					var editingValue = this._getCurrentEditingValue();
					var valuesHash = this._getOptionValuesHash();
					var suitableOptions;

					for (i = 0; i < curentValues.length; i++) {
						currentValue = (curentValues[i] || '').toLowerCase();

						if (editingValue && i === editingValue.index) {
							suitableOptions = this._getSuitableOptions(
								editingValue.value,
								true
							);

							if (!suitableOptions.length) {
								isValid = false;
							}

							if (!valuesHash[currentValue]) {
								approvedValues[i] = undefined;
							}
						} else {
							if (currentValue && !valuesHash[currentValue]) {
								isValid = isValid && false;
								approvedValues[i] = undefined;
							}
						}
					}

					if (!isValid) {
						this.errorString =
							'Entered value is invalid (' + currentValue + ')';
					}
				}

				// duplicates validation
				if (isValid && !this.allowDuplicates) {
					var curentValuesHash = {};

					for (i = 0; i < curentValues.length; i++) {
						currentValue = curentValues[i];

						if (!curentValuesHash[currentValue]) {
							curentValuesHash[currentValue] = true;
						} else {
							isValid = false;
							approvedValues[i] = undefined;
							break;
						}
					}

					if (!isValid) {
						this.errorString =
							'There are duplicate values (' + currentValue + ')';
					}
				}

				approvedValues = approvedValues.filter(function (targetValue) {
					return targetValue;
				});
				this._approvedValue = approvedValues.length
					? approvedValues.join(this.valueSeparator)
					: '';

				return isValid;
			} else {
				this._approvedValue = this._value;
			}

			return true;
		},

		isMultiValue: function () {
			return true;
		},

		_normalizeValue: function () {
			var existingValuesHash = this._getOptionValuesHash();
			var currentValues = this._getInputValues();
			var lowerCaseValue;
			var currentValue;
			var i;

			for (i = 0; i < currentValues.length; i++) {
				currentValue = currentValues[i] || '';
				lowerCaseValue = currentValue.toLowerCase();

				if (
					existingValuesHash[lowerCaseValue] &&
					existingValuesHash[lowerCaseValue] !== currentValue
				) {
					currentValues[i] = existingValuesHash[lowerCaseValue];
				}
			}

			this._value = currentValues.join(this.valueSeparator);
		},

		_getCurrentEditingValue: function () {
			if (this._focused) {
				var curentValues = this._getInputValues();

				if (curentValues.length) {
					var cursorPosition = this._getCursorPosition();

					if (cursorPosition !== undefined) {
						var separatorLength = this.valueSeparator.length;
						var editValueIndex = 0;
						var currentLength = curentValues[editValueIndex].length;

						while (
							currentLength < cursorPosition &&
							editValueIndex + 1 < curentValues.length
						) {
							editValueIndex++;
							currentLength +=
								curentValues[editValueIndex].length + separatorLength;
						}

						return {
							index: editValueIndex,
							value: curentValues[editValueIndex]
						};
					}
				} else {
					return { index: 0, value: '' };
				}
			}
		},

		_getInputValues: function () {
			return this._value ? this._value.split(this.valueSeparator) : [];
		},

		_prepareValueForDom: function (contentValue) {
			var preparedValue = this.inherited(arguments);

			return preparedValue.replace(
				new RegExp(this.valueSeparator, 'g'),
				this.valueSeparator + '<wbr>'
			);
		},

		_setCursorToValue: function (valueIndex) {
			var currentValues = this._getInputValues();
			var cursorPosition;
			var i;

			valueIndex = Math.min(valueIndex, currentValues.length);
			cursorPosition = valueIndex * this.valueSeparator.length;

			for (i = 0; i <= valueIndex; i++) {
				cursorPosition += currentValues[i].length;
			}

			this._setCursorPosition(cursorPosition);
		},

		_getCursorPosition: function () {
			var windowSelection = window.getSelection();

			if (windowSelection.rangeCount) {
				var selectionRange = windowSelection.getRangeAt(0);
				var selectedNode = selectionRange.startContainer;
				var nomalizedPosition = 0;
				var currentChild;

				if (selectedNode === this.contentNode) {
					currentChild =
						selectedNode.childNodes.length &&
						selectedNode.childNodes[selectionRange.startOffset].previousSibling;
				} else {
					currentChild = selectedNode.previousSibling;
					nomalizedPosition += selectionRange.startOffset;
				}

				while (currentChild) {
					nomalizedPosition += currentChild.textContent.length;
					currentChild = currentChild.previousSibling;
				}

				return nomalizedPosition;
			}
		},

		_saveCaretPosition: function () {
			var windowSelection = window.getSelection();

			if (windowSelection.rangeCount) {
				var selectionRange = windowSelection.getRangeAt(0);

				this._savedCaretPosition = {
					node: selectionRange.startContainer,
					position: selectionRange.startOffset
				};
			} else {
				this._savedCaretPosition = {
					node: this.contentNode,
					position: this._value.length
				};
			}
		},

		attachDomEventListeners: function (targetDomNode) {
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
						var windowSelection = window.getSelection();
						var selectionRange = windowSelection.getRangeAt(0);
						var startContainer = selectionRange.startContainer;
						var startOffset = selectionRange.startOffset;
						var newSelectionContainer;
						var newPosition;
						var textContent;

						switch (keyEvent.keyCode) {
							case 37:
								if (startContainer !== this._savedCaretPosition.node) {
									if (this._savedCaretPosition.position === 0) {
										if (startContainer === this.contentNode) {
											newSelectionContainer =
												startContainer.childNodes[startOffset - 1];
											newPosition =
												newSelectionContainer.textContent.length - 1;
										} else {
											textContent = startContainer.textContent;

											if (startOffset === textContent.length) {
												newSelectionContainer = startContainer;
												newPosition = textContent.length - 1;
											}
										}
									}
								}
								break;
							case 39:
								if (startContainer !== this._savedCaretPosition.node) {
									if (startContainer === this.contentNode) {
										newSelectionContainer =
											startContainer.childNodes[startOffset];
										newPosition = 1;
									} else {
										textContent = this._savedCaretPosition.node.textContent;

										if (
											selectionRange.startOffset === 0 &&
											this._savedCaretPosition.position === textContent.length
										) {
											newSelectionContainer = startContainer;
											newPosition = 1;
										}
									}
								}
								break;
							default:
								break;
						}

						if (newSelectionContainer) {
							var ownerDocument = this.contentNode.ownerDocument;
							var newRange = ownerDocument.createRange();

							newRange.setStart(newSelectionContainer, newPosition);
							newRange.setEnd(newSelectionContainer, newPosition);

							try {
								windowSelection.removeAllRanges();
							} catch (ex) {}

							windowSelection.addRange(newRange);
						}

						this._saveCaretPosition();
					}.bind(this)
				);
			}

			this.inherited(arguments);
		},

		applyIntellisenseValue: function (selectedValue, intellisenseContext) {
			if (intellisenseContext) {
				var editingValue = intellisenseContext;
				var currentValues = this._getInputValues();
				var newValuesCount;

				selectedValue = selectedValue
					? Array.isArray(selectedValue)
						? selectedValue
						: [selectedValue]
					: [];
				newValuesCount = selectedValue.length;
				selectedValue.unshift(editingValue.index, 1);
				Array.prototype.splice.apply(currentValues, selectedValue);

				this.setValue(currentValues.join(this.valueSeparator));
				this._setCursorToValue(editingValue.index + (newValuesCount - 1));
			} else {
				this.setValue(selectedValue);
			}
		},

		getIntelliSenseContext: function () {
			return this._getCurrentEditingValue();
		},

		getIntelliSenseOptions: function (allOptions) {
			var editingValue = this._getCurrentEditingValue();
			var resultOptions = [];

			if (editingValue) {
				var suitableOptions = allOptions
					? this.selectOptions
					: this._getSuitableOptions(editingValue.value);
				var currentValues = this._getInputValues();
				var currentValuesHash = {};
				var currentOption;
				var i;

				for (i = 0; i < currentValues.length; i++) {
					currentValuesHash[currentValues[i]] = true;
				}

				for (i = 0; i < suitableOptions.length; i++) {
					currentOption = suitableOptions[i];

					if (this.allowDuplicates || !currentValuesHash[currentOption.value]) {
						resultOptions.push({
							id: i + 1,
							name: currentOption.value,
							icon: currentOption.icon,
							iconClass: currentOption.iconClass
						});
					}
				}
			}

			return resultOptions;
		}
	});
});
