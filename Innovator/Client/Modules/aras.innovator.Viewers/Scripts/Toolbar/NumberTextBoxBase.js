dojo.setObject(
	'ValidationResult',
	dojo.declare(null, {
		isValid: false,
		validatedValue: null
	})
);

dojo.setObject(
	'VC.Toolbar.NumberTextBoxBase',
	dojo.declare(VC.Toolbar.TextBoxBase, {
		minValue: 1,
		maxValue: 1000000,
		previousValue: '',

		constructor: function () {
			Object.defineProperty(this, 'currentValue', {
				get: function () {
					var returnedValue = '';

					if (this.value !== '') {
						returnedValue = +this.getFormatValue();
					}

					return returnedValue;
				},
				set: function (value) {
					var validationResult = this.validate(value);
					this.setFormatValue(validationResult.validatedValue);
					this.previousValue = validationResult.validatedValue;
				}
			});
		},

		validate: function (value) {
			var validationResult = new ValidationResult();
			var numberRegexp = new RegExp('^(-?\\d+\\.?\\d*).*$');

			var match = value.toString().match(numberRegexp);

			if (match !== null) {
				validationResult.validatedValue = Math.round(+match[1]);

				if (validationResult.validatedValue < this.minValue) {
					validationResult.validatedValue = this.minValue;
				} else if (validationResult.validatedValue > this.maxValue) {
					validationResult.validatedValue = this.maxValue;
				}
			} else {
				validationResult.validatedValue = this.previousValue;
			}

			validationResult.isValid = true;
			return validationResult;
		},

		_onTextChange: function (e) {
			var charOrCode = e.charCode || e.keyCode;

			if (charOrCode === VC.Utils.Enums.AffectedKey.ENTER) {
				var validationResult = this.validate(this.value);

				this.value = validationResult.validatedValue;
				this.previousValue = this.value;
				this.textbox.blur();
				this.onChange();
			}
		},

		_onTextBoxFocus: function (e) {
			this.value = this.getFormatValue();
			this.textbox.selectionStart = 0;
			this.textbox.selectionEnd = this.value.length;
		},

		_onTextBoxBlur: function (e) {
			var validationResult = this.validate(this.value);

			this.setFormatValue(validationResult.validatedValue);
		},

		getFormatValue: function () {
			var returnedValue = this.value;

			if (returnedValue !== '' && this.textFormat !== null) {
				var regexValue = '(.*?)';
				var regexTextFormat = this.textFormat.Format(regexValue);
				var regex = new RegExp(regexTextFormat);

				execResult = regex.exec(returnedValue);
				returnedValue = execResult ? execResult[1] : returnedValue;
			}

			return returnedValue;
		},

		setFormatValue: function (value) {
			if (this.textFormat !== null) {
				value = this.textFormat.Format(value);
			}

			this.value = value;
		}
	})
);
