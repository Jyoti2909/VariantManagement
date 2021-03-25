define(['dojo/_base/declare', './ItemPropertyEditorBase'], function (
	declare,
	ItemPropertyEditorBase
) {
	return declare(ItemPropertyEditorBase, {
		value: false,
		_resultType: null,

		constructor: function (initialParameters) {
			editorParameters = initialParameters.editorParameters || {};

			this._resultType = editorParameters.resultType || 'bool';
		},

		_buildEditControlTemplate: function (editorParameters) {
			const initialValue = this._parseValue(
				(editorParameters && editorParameters.value) || false
			);
			const checkboxTemplate = this.wrapInTag('', 'input', {
				class: 'aras-checkbox__input',
				type: 'checkbox',
				checked: initialValue || undefined,
				controlNode: 'valueInput'
			});
			const checkboxButtonTemplate = this.wrapInTag('', 'span', {
				class: 'aras-checkbox__check-button'
			});
			const checkboxValueTemplate = this.wrapInTag('', 'span', {
				class: 'aras-checkbox__value',
				controlNode: 'valueLabel'
			});

			return this.wrapInTag(
				checkboxTemplate + checkboxButtonTemplate + checkboxValueTemplate,
				'label',
				{
					class: 'aras-checkbox'
				}
			);
		},

		_attachDomEventListeners: function () {
			this.inherited(arguments);

			if (this.domNode) {
				const valueInputNode = this.controlNodes.valueInput;

				this._attachDomEventListener(
					valueInputNode,
					'change',
					this._onValueChanged.bind(this)
				);
			}
		},

		_onValueChanged: function () {
			this.setValue(this.controlNodes.valueInput.checked);
		},

		_parseValue: function (targetValue) {
			if (typeof targetValue === 'string') {
				targetValue = targetValue.toLowerCase();
				return targetValue === 'true' || targetValue === '1';
			}

			return Boolean(targetValue);
		},

		_updateValueLabel: function () {
			const stringValue = this.value.toString();
			this.controlNodes.valueLabel.textContent =
				stringValue.charAt(0).toUpperCase() + stringValue.substr(1);
		},

		_onBeforeShow: function (showParameters) {
			this.inherited(arguments);
			this._updateValueLabel();
		},

		_onAfterShow: function (showParameters) {
			this.inherited(arguments);
			this.controlNodes.editorNode.focus();
		},

		setValue: function (newValue) {
			newValue = this._parseValue(newValue);

			if (newValue !== this.value) {
				this.value = newValue;
				this.controlNodes.valueInput.checked = newValue;

				this._updateValueLabel();
			}
		},

		getValue: function () {
			switch (this._resultType) {
				case 'int':
					return this.value ? 1 : 0;
				case 'string':
					return this.value.toString();
				case 'intstring':
					return this.value ? '1' : '0';
				default:
					return this.value;
			}
		}
	});
});
