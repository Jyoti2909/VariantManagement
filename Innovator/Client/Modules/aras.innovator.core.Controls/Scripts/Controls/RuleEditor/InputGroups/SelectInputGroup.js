define(['dojo/_base/declare', './InputGroup'], function (
	declare,
	BaseInputGroup
) {
	return declare('TemplatedEditor.SelectInputGroup', [BaseInputGroup], {
		selectOptions: null,

		constructor: function (ownerEditor, groupDescriptor) {},

		_constructorInitProperties: function (ownerEditor, groupDescriptor) {
			this.inherited(arguments);

			this.selectOptions = [];
			this.addOptions(groupDescriptor.options);
		},

		addOptions: function (newOptions) {
			if (newOptions) {
				var existingValuesHash = this._getOptionValuesHash();
				var currentOption;
				var optionValue;
				var lowerCaseValue;
				var i;

				newOptions = Array.isArray(newOptions) ? newOptions : [newOptions];

				for (i = 0; i < newOptions.length; i++) {
					currentOption = newOptions[i];
					currentOption =
						typeof currentOption === 'object'
							? currentOption
							: { value: currentOption };
					optionValue = currentOption.value.toString();
					lowerCaseValue = optionValue.toLowerCase();

					if (!existingValuesHash[lowerCaseValue]) {
						this.selectOptions.push(currentOption);
						existingValuesHash[lowerCaseValue] = optionValue;
					}
				}
			}
		},

		clearOptions: function () {
			this.selectOptions = [];
		},

		_getRenderCssClasses: function () {
			var cssClasses = this.inherited(arguments);

			cssClasses.push('selectGroup');
			return cssClasses;
		},

		isEditable: function () {
			return this.owner.isEditable();
		},

		_getRenderContentNodeAttributes: function () {
			var nodeAttributes = this.inherited(arguments);

			if (this.owner.isEditable()) {
				nodeAttributes.contenteditable = true;
			}

			return nodeAttributes;
		},

		_getOptionValuesHash: function () {
			var valuesHash = {};
			var optionValue;
			var optionKey;
			var i;

			for (i = 0; i < this.selectOptions.length; i++) {
				optionValue = this.selectOptions[i].value || '';
				optionKey = optionValue.toLowerCase();

				valuesHash[optionKey] = optionValue;
			}

			return valuesHash;
		},

		_getSuitableOptions: function (inputValue, includeFullMatch) {
			var escapedValue = inputValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			var regExpTemplate =
				'^' + escapedValue + '.' + (includeFullMatch ? '*' : '+');
			var checkRegExp = escapedValue ? new RegExp(regExpTemplate, 'i') : null;
			var resultOptions = [];
			var currentOption;
			var i;

			for (i = 0; i < this.selectOptions.length; i++) {
				currentOption = this.selectOptions[i];

				if (!checkRegExp || checkRegExp.test(currentOption.value)) {
					resultOptions.push(currentOption);
				}
			}

			return resultOptions;
		},

		_refreshContentNode: function () {
			var isCursorRestoreRequired = this.isFocused();
			var oldCursorPosition;

			if (isCursorRestoreRequired) {
				oldCursorPosition = this._getCursorPosition();
			}

			this.inherited(arguments);

			if (isCursorRestoreRequired) {
				this._setCursorPosition(
					Math.min(oldCursorPosition, this._value.length)
				);
			}
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

		getState: function () {
			if (this.isFocused()) {
				return { cursorPosition: this._getCursorPosition() };
			}
		},

		restoreState: function (stateInfo) {
			if (stateInfo) {
				if (stateInfo.cursorPosition) {
					this._setCursorPosition(stateInfo.cursorPosition);
				}
			}
		},

		_getAllTextNodes: function (containerNode) {
			var nodeWalker = document.createTreeWalker(
				containerNode,
				NodeFilter.SHOW_TEXT,
				null,
				false
			);
			var textNodes = [];

			while (nodeWalker.nextNode()) {
				textNodes.push(nodeWalker.currentNode);
			}

			return textNodes;
		},

		_getCursorPosition: function () {
			var windowSelection = window.getSelection();

			if (windowSelection.rangeCount) {
				var selectionRange = windowSelection.getRangeAt(0);
				var allTextNodes = this._getAllTextNodes(this.contentNode);
				var nomalizedPosition = 0;
				var currentChild;

				for (i = 0; i < allTextNodes.length; i++) {
					currentChild = allTextNodes[i];

					if (currentChild !== selectionRange.startContainer) {
						nomalizedPosition += currentChild.textContent.length;
					} else {
						break;
					}
				}

				return nomalizedPosition + selectionRange.startOffset;
			}
		},

		_setCursorPosition: function (cursorPosition) {
			var childNode = this.contentNode.firstChild;
			var textNode = childNode.nodeType === Node.TEXT_NODE ? childNode : null;

			if (childNode) {
				var currentLength = 0;

				while (
					childNode &&
					currentLength + childNode.textContent.length < cursorPosition
				) {
					currentLength += childNode.textContent.length;
					childNode = childNode.nextSibling;

					if (childNode && childNode.nodeType === Node.TEXT_NODE) {
						textNode = childNode;
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
				}
			}
		},

		_normalizeValue: function () {
			var existingValuesHash = this._getOptionValuesHash();
			var currentValue = this._value;
			var lowerCaseValue = currentValue.toLowerCase();

			if (
				existingValuesHash[lowerCaseValue] &&
				existingValuesHash[lowerCaseValue] !== currentValue
			) {
				this._value = existingValuesHash[lowerCaseValue];
			}
		},

		setValue: function (newValue, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (newValue !== this._value || optionalParameters.forceChange) {
				this._value = newValue;
				this._normalizeValue();
				this._refreshContentNode();

				if (!optionalParameters.suppressChangeEvent) {
					this.onValueChanged();
				}
			}
		},

		attachDomEventListeners: function (targetDomNode) {
			this.inherited(arguments);

			if (targetDomNode) {
				this._attachDomEventListener(
					targetDomNode,
					'keyup',
					function (keyEvent) {
						this.setValue(this._getValueFromDom());
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
			var groupDescriptor = this._descriptor;

			this.errorString = '';

			if (groupDescriptor.inputValidation === 'onlyOptions') {
				var suitableOptions = this._getSuitableOptions(this._value, true);
				var isValid = Boolean(suitableOptions.length);

				if (isValid) {
					var existingValuesHash = this._getOptionValuesHash();
					var lowerCaseValue = this._value.toLowerCase();

					this._approvedValue = existingValuesHash[lowerCaseValue]
						? this._value
						: '';
				} else {
					this.errorString = 'Entered value is invalid';
					this._approvedValue = '';
				}

				return isValid;
			} else {
				this._approvedValue = this._value;
			}

			return true;
		},

		getIntelliSenseOptions: function (allOptions) {
			var suitableOptions = allOptions
				? this.selectOptions
				: this._getSuitableOptions(this._value);
			var resultOptions = [];
			var currentOption;
			var i;

			for (i = 0; i < suitableOptions.length; i++) {
				currentOption = suitableOptions[i];

				resultOptions.push({
					id: i + 1,
					name: currentOption.value,
					icon: currentOption.icon,
					iconClass: currentOption.iconClass
				});
			}

			return resultOptions;
		}
	});
});
