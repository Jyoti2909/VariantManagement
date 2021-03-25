import {
	processAndOperatorKey,
	processOrOperatorKeys
} from './operatorProcessors';
import { applyProcessedOperatorResult, convertValue } from './converterUtils';
import searchAmlToJson from './baseConverter';

export default async function searchAmlToSimple(aml) {
	const baseJson = searchAmlToJson(aml);
	if (baseJson['@invalid']) {
		return baseJson;
	}
	const converted = await toSimple(baseJson);
	return converted;
}

async function toSimple(json, itemType = null) {
	const result = {};
	const keys = Object.keys(json);
	const itemTypeName = json['@rootType'] || itemType;
	const itemTypeData = await aras.MetadataCacheJson.GetItemType(
		itemTypeName,
		'name'
	);
	const itemTypeProps = itemTypeData.Property;

	result['@rootType'] = itemTypeName;
	for (const key of keys) {
		if (key.includes('@')) {
			continue;
		}

		const keyData = json[key];

		if (key === 'AND') {
			const dataToProcess = !Array.isArray(keyData) ? [keyData] : keyData;

			for (const propData of dataToProcess) {
				const processed = processAndOperatorKey(itemTypeProps, propData);
				applyProcessedOperatorResult(result, processed, key, propData);
			}
			continue;
		}

		if (key === 'OR') {
			const dataToProcess = !Array.isArray(keyData) ? [keyData] : keyData;

			for (const propData of dataToProcess) {
				const processed = processOrOperatorKeys(itemTypeProps, propData);
				applyProcessedOperatorResult(result, processed, key, propData);
			}
			continue;
		}

		if (key === 'NOT') {
			result[key] = keyData;
			result['@invalid'] = true;
			continue;
		}

		if (!/\//gm.test(key)) {
			const converted = convertValue(key, keyData, itemTypeProps);
			result[key] = converted.value;
			if (converted.invalid) {
				result['@invalid'] = true;
			}
		} else {
			result[key] = keyData;
			result['@invalid'] = true;
		}
	}

	return result;
}
