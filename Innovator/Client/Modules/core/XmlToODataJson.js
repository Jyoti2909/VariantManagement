import xml from './Xml';

const systemAttributes = new Set([
	'type',
	'typeId',
	'id',
	'xmlns:i18n',
	'xml:lang',
	'is_null'
]);

const xmlToODataJson = (data, skipNullValues) => {
	const xmlDom = typeof data === 'string' ? xml.parseString(data) : data;

	return parseXml(xmlDom, skipNullValues);
};
const xmlToODataJsonAsCollection = (data, skipNullValues) => {
	const xmlDom = typeof data === 'string' ? xml.parseString(data) : data;
	const itemsNodes = xml.selectNodes(xmlDom, '//Result/Item');

	return itemsNodes.map((item) => xmlToODataJson(item, skipNullValues));
};
const parseXml = (xmlDom, skipNullValues) => {
	const resultObject = {};
	processAttributes(resultObject, xmlDom);

	xml
		.selectNodes(
			xmlDom,
			skipNullValues
				? './*[not(@is_null="1") and not(name()="Relationships")]'
				: './*[not(name()="Relationships")]'
		)
		.reduce((result, property) => {
			processProperty(result, property, skipNullValues);
			return result;
		}, resultObject);

	processRelationships(resultObject, xmlDom);

	return resultObject;
};

const processPropertyValue = (property, skipNullValues) => {
	const nestedItemNode = xml.selectSingleNode(property, './Item');
	return nestedItemNode
		? parseXml(nestedItemNode, skipNullValues)
		: xml.getText(property);
};

const processProperty = (resultObject, property, skipNullValues) => {
	let propertyValue;
	let propertyName = property.localName || property.baseName;
	const isNullAttrValue = property.getAttribute('is_null');

	processAttributes(resultObject, property);
	switch (isNullAttrValue) {
		case '0':
			resultObject[propertyName + '@aras.restricted'] = true;
			break;
		case '1':
			propertyValue = processPropertyValue(property, skipNullValues);
			resultObject[propertyName] = propertyValue || null;
			break;
		default:
			if (property.prefix === 'i18n' && property.getAttribute('xml:lang')) {
				propertyName += `@aras.lang.${property.getAttribute('xml:lang')}`;
			}
			propertyValue = processPropertyValue(property, skipNullValues);
			resultObject[propertyName] = propertyValue;
			break;
	}
};
const processRelationships = (resultObject, item, skipNullValues) => {
	xml.selectNodes(item, './Relationships/Item').forEach((relationshipItem) => {
		const relationship = parseXml(relationshipItem, skipNullValues);
		const relationshipType = relationshipItem.getAttribute('type');
		if (resultObject[relationshipType]) {
			resultObject[relationshipType].push(relationship);
		} else {
			resultObject[relationshipType] = [relationship];
		}
	});
};
const processAttributes = (resultObject, item) => {
	if (item.attributes && item.attributes.length > 0) {
		for (let i = 0; i < item.attributes.length; i++) {
			const localName = item.localName || item.baseName;
			const propertyName = localName === 'Item' ? '' : localName;
			const attr = item.attributes.item(i);
			const attrName = attr.name;
			if (attrName === 'xml:lang' && item.prefix === '') {
				resultObject[`${propertyName}@aras.lang`] = attr.value;
			} else if (attrName === 'id' && !propertyName) {
				resultObject[attrName] = attr.value;
			} else if (attrName === 'type' && propertyName) {
				resultObject[`${propertyName}@aras.${attrName}`] = attr.value;
			} else if (!systemAttributes.has(attrName)) {
				resultObject[`${propertyName}@aras.${attrName}`] = attr.value;
			}
		}
	}
};

export { xmlToODataJson, xmlToODataJsonAsCollection };
