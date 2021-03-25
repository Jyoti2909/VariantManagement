import { xmlToJson } from '../../core/XmlToJson';

const operators = ['AND', 'OR', 'NOT'];
const relatedProps = ['Relationships', 'related_id'];
const conditionsMap = {
	eq: '=',
	ge: '>=',
	le: '<=',
	gt: '>',
	lt: '<',
	ne: '!='
};

export default function searchAmlToJson(aml) {
	const _json = xmlToJson(aml);
	if (_json.parsererror || _json.Item?.parsererror) {
		return {
			'@invalid': true
		};
	}
	const jsonCriteria = {};
	const rootType = _json.Item['@attrs']?.type || 'Item';
	processNode(_json.Item, jsonCriteria, rootType);
	jsonCriteria['@rootType'] = rootType;
	return jsonCriteria;
}

function processNode(node, buffer, rootType, path = '', isOperator = false) {
	const result = isOperator ? {} : buffer;

	const properties = Object.keys(node);
	for (const property of properties) {
		if (property === '@attrs') {
			continue;
		}
		const propertyValue = node[property];
		const propertyPath = path + property;

		if (property === 'current_state') {
			const label = propertyValue.Item.OR.label;
			const name = propertyValue.Item.OR.AND.name;

			const labelValue = processKey(label);
			const nameValue = processKey(name);
			result[propertyPath] = {
				value: labelValue.value || nameValue.value,
				condition: labelValue.condition || nameValue.condition
			};
			continue;
		}

		if (propertyValue.Item) {
			const tempBuffer = {};
			const _Item = Array.isArray(propertyValue.Item)
				? propertyValue.Item
				: [propertyValue.Item];
			let isRelated;
			_Item.forEach((valueOfItem) => {
				const itemAttrs = valueOfItem['@attrs'];
				const type = itemAttrs?.type || property;
				isRelated = relatedProps.includes(property);
				const nodePath = path || `${rootType}/`;
				const buffer = isOperator || !isRelated ? tempBuffer : result;
				processNode(valueOfItem, buffer, rootType, `${nodePath}${type}/`);
			});
			if (isOperator) {
				Object.assign(result, tempBuffer);
			}
			if (!isRelated) {
				const processedKey = Object.keys(tempBuffer)[0];
				if (operators.includes(processedKey)) {
					result[processedKey] = result[processedKey] || {};

					const processedValue = tempBuffer[processedKey];
					const keysOfProcessedValue = Object.keys(processedValue);

					result[processedKey][property] =
						keysOfProcessedValue.length === 1
							? processedValue[keysOfProcessedValue[0]]
							: keysOfProcessedValue.map((key) =>
									operators.includes(key)
										? { [key]: processedValue[key] }
										: processedValue[key]
							  );
				} else {
					result[property] = tempBuffer[processedKey];
				}
			}
			continue;
		}

		if (operators.includes(property)) {
			const processResult = Array.isArray(propertyValue)
				? propertyValue.map((item) =>
						processNode(item, null, rootType, path, true)
				  )
				: processNode(propertyValue, null, rootType, path, true);
			if (result[property]) {
				if (!Array.isArray(result[property])) {
					result[property] = [result[property]];
				}
				result[property].push(processResult);
			} else {
				result[property] = processResult;
			}
			continue;
		}

		if (Array.isArray(propertyValue)) {
			result[propertyPath] = propertyValue.map(processKey);
			continue;
		}

		result[propertyPath] = processKey(propertyValue);
	}
	return isOperator ? result : undefined;
}

function processKey(value) {
	const obj = {};
	obj.value = value['@value'] || '';
	obj.condition = '=';
	const valueCondition = value['@attrs']?.condition;
	if (valueCondition) {
		obj.condition = conditionsMap[valueCondition] || valueCondition;
	}
	return obj;
}
