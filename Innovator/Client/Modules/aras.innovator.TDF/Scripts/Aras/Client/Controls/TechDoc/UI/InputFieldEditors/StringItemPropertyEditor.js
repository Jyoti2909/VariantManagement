define(['dojo/_base/declare', './ItemPropertyEditorBase'], function (
	declare,
	ItemPropertyEditorBase
) {
	return declare(ItemPropertyEditorBase, {
		constructor: function (initialParameters) {},

		_buildEditControlTemplate: function (editorParameters) {
			const initialValue = (editorParameters && editorParameters.value) || '';

			return this.wrapInTag('', 'input', {
				class: 'aras-input',
				type: 'text',
				value: initialValue,
				controlNode: 'valueInput'
			});
		},

		_attachDomEventListeners: function () {
			this.inherited(arguments);

			if (this.domNode) {
				const valueInputNode = this.controlNodes.valueInput;

				this._attachDomEventListener(
					valueInputNode,
					'blur',
					this._onValueChanged.bind(this)
				);
			}
		},

		_onValueChanged: function () {
			if (this._isShown && !this._isHideForbidden) {
				this.setValue(this.controlNodes.valueInput.value);
			}
		},

		_onAfterShow: function (showParameters) {
			this.inherited(arguments);

			// Focus of the input should be performed after it becomes visible
			const valueInputNode = this.controlNodes.valueInput;
			valueInputNode.focus();
		},

		_onValueInvalid: function (invalidValue, validationInfo) {
			this._isHideForbidden = true;

			this._showConfirmationDialog(validationInfo.errorMessage).then(
				function (confirmationResult) {
					if (confirmationResult === 'btnYes') {
						this.controlNodes.valueInput.focus();
					} else {
						this.dropValue();
					}

					this._isHideForbidden = false;
				}.bind(this)
			);
		},

		_onEditorKeyDown: function (keyEvent) {
			const keyCode = keyEvent.which || keyEvent.keyCode;

			switch (keyCode) {
				case 13:
					this._onValueChanged();
					break;
			}

			this.inherited(arguments);
		},

		setValue: function (newValue) {
			const isValueSet = this.inherited(arguments);

			if (isValueSet) {
				const inputNode = this.controlNodes.valueInput;
				inputNode.value = newValue;
			}
		}
	});
});
