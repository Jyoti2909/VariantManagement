import converters from './typeConverters';
import validateCondition from './conditionsValidator';

export function applyProcessedOperatorResult(result, processed, key, propData) {
	if (processed.invalid) {
		if (!result[key]) {
			result[key] = propData;
		} else {
			if (!Array.isArray(result[key])) {
				result[key] = [result[key]];
			}
			result[key].push(propData);
		}
		result['@invalid'] = true;
	} else {
		Object.assign(result, processed.value);
	}
}

export function convertValue(key, propData, itemTypeProps) {
	const itemTypeProperty = itemTypeProps.find((prop) => prop.name === key);
	if (!itemTypeProperty) {
		return { value: propData };
	}

	const result = {};
	let conversionResult;

	switch (itemTypeProperty.data_type) {
		case 'float':
		case 'decimal':
		case 'integer':
		case 'ubigint':
			conversionResult = converters.convertNumber(
				itemTypeProperty.data_type,
				propData
			);
			break;
		case 'boolean':
			conversionResult = converters.convertBoolean(propData);
			break;
		case 'date':
			conversionResult = converters.convertDate(propData);
			break;
		default:
			conversionResult = propData.condition !== '=' ? propData : propData.value;
	}

	if (conversionResult !== undefined) {
		result.value = conversionResult;
	} else {
		result.value = propData;
		result.invalid = true;
	}

	if (!validateCondition(propData.condition, itemTypeProperty)) {
		result.invalid = true;
	}

	return result;
}

export async function processComplexKey(key, keyData) {
	const result = {
		value: {}
	};
	const pathKeys = key.split('/');
	const propKey = pathKeys.pop();
	const itemType = pathKeys.pop();
	const itemTypeData = await aras.MetadataCacheJson.GetItemType(
		itemType,
		'name'
	);
	const itemTypeProps = itemTypeData.Property;
	const converted = convertValue(propKey, keyData, itemTypeProps);
	result.value[key] = converted.value;
	if (converted.invalid) {
		result.invalid = true;
	}
	return result;
}
