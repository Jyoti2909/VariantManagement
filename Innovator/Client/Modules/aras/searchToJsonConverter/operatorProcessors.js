import { convertValue } from './converterUtils';
import intl from '../../core/intl';

export function processAndOperatorKey(itemTypeProps, keyData) {
	const operatorKeys = Object.keys(keyData);
	const result = {};
	const propsBuffer = {};

	if (operatorKeys.length > 1) {
		result.invalid = true;
		return result;
	}

	const operatorKey = operatorKeys[0];

	const itemTypeProperty = itemTypeProps.find(
		(prop) => prop.name === operatorKey
	);
	if (!itemTypeProperty) {
		result.invalid = true;
		return result;
	}

	if (
		!['integer', 'float', 'decimal', 'ubigint', 'date'].includes(
			itemTypeProperty.data_type
		)
	) {
		result.invalid = true;
		return result;
	}

	const propVariants = keyData[operatorKey];
	if (propVariants.length > 2) {
		result.invalid = true;
		return result;
	}

	const allowedConditions = ['>=', '<='];
	if (
		!allowedConditions.includes(propVariants[0].condition) ||
		!allowedConditions.includes(propVariants[1].condition)
	) {
		result.invalid = true;
		return result;
	}

	const [firstValue, secondValue] =
		propVariants[0].condition === '>='
			? [propVariants[0].value, propVariants[1].value]
			: [propVariants[1].value, propVariants[0].value];

	const dataType = itemTypeProperty.data_type;
	let validationResult;
	if (dataType === 'date') {
		validationResult = validateDate(firstValue) && validateDate(secondValue);
	} else {
		validationResult =
			validateNumber(firstValue, dataType) &&
			validateNumber(secondValue, dataType);
	}
	if (!validationResult) {
		result.invalid = true;
		return result;
	}
	propsBuffer[operatorKey] = firstValue + '...' + secondValue;
	result.value = propsBuffer;

	return result;
}

export function processOrOperatorKeys(
	itemTypeProps,
	keyData,
	isAdvanced = false
) {
	const operatorKeys = Object.keys(keyData);
	const result = {};
	const propsBuffer = {};

	for (const operatorKey of operatorKeys) {
		let keyToAssign = operatorKey;

		if (['NOT', 'IN'].includes(operatorKey)) {
			result.invalid = true;
			return result;
		}
		if (operatorKey === 'AND' && isAdvanced) {
			result.invalid = true;
			return result;
		}

		const itemTypeProperty = itemTypeProps.find(
			(prop) => prop.name === operatorKey
		);
		if (!itemTypeProperty && operatorKey !== 'AND') {
			result.invalid = true;
			return result;
		}

		let propVariants = keyData[operatorKey];
		propVariants = Array.isArray(propVariants) ? propVariants : [propVariants];
		let isPropertyInvalid = false;

		const convertedPropertyValues = propVariants.map((data) => {
			if (isPropertyInvalid) {
				return;
			}
			const converted =
				operatorKey === 'AND'
					? processAndOperatorKey(itemTypeProps, data)
					: convertValue(operatorKey, data, itemTypeProps);
			if (operatorKey === 'AND' && !converted.invalid) {
				const andPropKey = Object.keys(converted.value)[0];
				keyToAssign = andPropKey;
				return converted.value[andPropKey];
			}
			if (!converted.invalid && typeof converted.value === 'string') {
				return converted.value;
			}
			isPropertyInvalid = true;
		});

		if (isPropertyInvalid) {
			result.invalid = true;
			return result;
		}

		const convertionResult = convertedPropertyValues.join('|');
		if (propsBuffer[keyToAssign]) {
			propsBuffer[keyToAssign] =
				propsBuffer[keyToAssign] + '|' + convertionResult;
		} else {
			propsBuffer[keyToAssign] = convertionResult;
		}
	}
	result.value = propsBuffer;
	return result;
}

function validateNumber(value, dataType) {
	if (value === '' || isNaN(value)) {
		return false;
	}
	if (dataType === 'ubigint' && (+value < 0 || value.includes('.'))) {
		return false;
	}
	if (dataType === 'integer' && value.includes('.')) {
		return false;
	}
	return true;
}

function validateDate(value) {
	return !!intl.date.parse(value);
}
