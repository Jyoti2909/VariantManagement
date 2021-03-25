import intl from '../../core/intl';
import getResource from '../../core/resources';

const validators = {
	ubigint(value) {
		const validResult = {
			valid: true
		};

		const onlyPositiveNumbersResult = {
			valid: false,
			validationMessage: getResource('editors.positive_numbers_only')
		};

		value = value.trim();
		if (!value) {
			return validResult;
		}

		if (value === '-') {
			return onlyPositiveNumbersResult;
		}

		const ubiValue = !isNaN(intl.number.parseInt(value)) && bigInt(value);

		if (!ubiValue) {
			return {
				valid: false,
				validationMessage: getResource('editors.whole_numbers_only')
			};
		}

		if (value < 0) {
			return onlyPositiveNumbersResult;
		}

		const uBigIntMaxValue = '18446744073709551615';
		if (ubiValue.greater(uBigIntMaxValue)) {
			return {
				valid: false,
				validationMessage: getResource('editors.can_not_exceed')
			};
		}

		return validResult;
	},
	integer(value) {
		if (value && isNaN(intl.number.parseInt(value))) {
			return {
				valid: false,
				validationMessage: getResource('editors.whole_numbers_only')
			};
		}

		return { valid: true };
	},
	float(value, metadata = {}) {
		if (!value) {
			return { valid: true };
		}

		const float = intl.number.parseFloat(value);
		if (isNaN(float)) {
			return {
				valid: false,
				validationMessage: getResource('editors.numbers_only')
			};
		}

		const maximumIntegerDigits = metadata.precision - metadata.scale;
		if (
			!isNaN(maximumIntegerDigits) &&
			isNaN(intl.number.parseFloat(value, maximumIntegerDigits))
		) {
			return {
				valid: false,
				validationMessage: getResource(
					'editors.max_digits_before_decimal_point',
					maximumIntegerDigits
				)
			};
		}

		return { valid: true };
	},
	date(value, metadata) {
		if (
			!value ||
			aras.isPropertyValueValid(
				{
					data_type: 'date',
					pattern: metadata.format
				},
				value
			)
		) {
			return { valid: true };
		}

		return {
			valid: false,
			validationMessage: getResource('cui_grid.value_property_invalid', 'date')
		};
	}
};

export default validators;
