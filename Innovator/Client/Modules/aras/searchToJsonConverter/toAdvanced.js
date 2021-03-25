import { processOrOperatorKeys } from './operatorProcessors';
import {
	applyProcessedOperatorResult,
	convertValue,
	processComplexKey
} from './converterUtils';
import searchAmlToJson from './baseConverter';

export default async function searchAmlToAdvanced(aml) {
	const baseJson = searchAmlToJson(aml);
	if (baseJson['@invalid']) {
		return baseJson;
	}
	const converted = await toAdvanced(baseJson);
	return converted;
}

async function toAdvanced(json, itemType = null) {
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
			result[key] = keyData;
			result['@invalid'] = true;
			continue;
		}

		if (key === 'OR') {
			const dataToProcess = !Array.isArray(keyData) ? [keyData] : keyData;

			for (const propData of dataToProcess) {
				const propDataKey = Object.keys(propData)[0];

				if (/\//gm.test(propDataKey)) {
					const pathKeys = propDataKey.split('/');
					if (pathKeys.length > 3) {
						result['@invalid'] = true;
						break;
					}

					const propKey = pathKeys.pop();
					const itemType = pathKeys.pop();
					const itemTypeData = await aras.MetadataCacheJson.GetItemType(
						itemType,
						'name'
					);
					const _itemTypeProps = itemTypeData.Property;
					const _propData = {
						[propKey]: propData[propDataKey]
					};

					const processed = processOrOperatorKeys(
						_itemTypeProps,
						_propData,
						true
					);
					if (!processed.invalid) {
						Object.assign(result, { [propDataKey]: processed.value[propKey] });
					} else {
						if (!result[key]) {
							result[key] = propData;
						} else {
							if (!Array.isArray(result[key])) {
								result[key] = [result[key]];
							}
							result[key].push(propData);
						}
						result['@invalid'] = true;
					}
				} else {
					const processed = processOrOperatorKeys(
						itemTypeProps,
						propData,
						true
					);
					applyProcessedOperatorResult(result, processed, key, propData);
				}
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
			continue;
		} else {
			const pathKeys = key.split('/');
			if (pathKeys.length > 3) {
				result['@invalid'] = true;
				continue;
			}
			const converted = await processComplexKey(key, keyData);
			Object.assign(result, converted.value);
			if (converted.invalid) {
				result['@invalid'] = true;
			}
			continue;
		}
	}

	return result;
}
