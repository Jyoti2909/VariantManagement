const resources = new Map();

export default function getResource(key, ...replaceValues) {
	let value;
	if (resources.has(key)) {
		value = resources.get(key);
	} else {
		value = aras.getResource('core', key);
		resources.set(key, value);
	}

	return replaceValues.reduce((result, replaceValue, index) => {
		const regExp = new RegExp(`\\{${index}}`, 'g');
		return result.replace(regExp, replaceValue);
	}, value);
}
