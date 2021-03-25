import getDrInfoByQueryDefinition from './getDrInfoByQueryDefinition';
import consts from './Constants';
import { adaptGridRowsFromXml } from '../../../cui/adaptGridRows';

const getExistingOrCreateNewDr = function (attrDefinition) {
	const drId = aras.getItemProperty(
		attrDefinition,
		consts.itemTypes.attrDefinition.properties.drRelationshipId
	);
	return drId ? getExistingDr(attrDefinition, drId) : createNewDr();
};

const createNewDr = function () {
	const drRelationship = aras.newItem(
		consts.itemTypes.drRelationship.itemTypeName
	);
	aras.setItemProperty(
		drRelationship,
		consts.itemTypes.drRelationship.properties.name,
		drRelationship.id
	);

	return drRelationship;
};

const getExistingDr = function (attrDefinition, drId) {
	let drRelationship = attrDefinition.selectSingleNode(
		`${consts.itemTypes.attrDefinition.properties.drRelationshipId}/Item[@type='${consts.itemTypes.drRelationship.itemTypeName}']`
	);
	if (drRelationship === null) {
		drRelationship = aras.getItemById(
			consts.itemTypes.drRelationship.itemTypeName,
			drId
		);
	}

	setActionIfNotSpecified(drRelationship, 'edit');

	return drRelationship;
};

const updateItemProperties = function (item, propertiesMap) {
	propertiesMap.forEach((val, key) => {
		aras.setItemProperty(item, key, val);
	});
};

const updateItemPropertyAttributes = function (item, property, attributeMap) {
	attributeMap.forEach((val, key) => {
		aras.setItemPropertyAttribute(item, property, key, val);
	});
};

const setActionIfNotSpecified = function (item, action) {
	if (!item.hasAttribute('action')) {
		item.setAttribute('action', action);
	}
};

const updateGrid = function (gridComponent, itemXml) {
	if (!gridComponent) {
		return;
	}

	const rowsInfo = adaptGridRowsFromXml('<Result>' + itemXml + '</Result>', {
		headMap: gridComponent.head,
		indexHead: gridComponent.settings.indexHead
	});
	rowsInfo.rowsMap.forEach(function (row, key) {
		gridComponent.rows.set(key, row);
	});
};

const applyQueryDefinitionToAttrDefinition = function (
	attrDefinition,
	queryDefinition,
	gridComponent
) {
	if (!queryDefinition) {
		return;
	}

	const appliedToId = aras.getItemProperty(
		attrDefinition,
		consts.itemTypes.attrDefinition.properties.definedOnItemtypeId
	);

	const drInfo = getDrInfoByQueryDefinition(queryDefinition);
	const drRelationship = getExistingOrCreateNewDr(attrDefinition);

	updateItemProperties(
		drRelationship,
		new Map([
			[
				consts.itemTypes.drRelationship.properties.departureItemTypeId,
				appliedToId
			],
			[
				consts.itemTypes.drRelationship.properties.destinationItemTypeId,
				drInfo.destinationItemTypeId
			],
			[
				consts.itemTypes.drRelationship.properties.implementationQuery,
				drInfo.implementationQuery
			]
		])
	);

	updateItemProperties(
		attrDefinition,
		new Map([
			[
				consts.itemTypes.attrDefinition.properties.drRelationshipId,
				drRelationship
			],
			[
				consts.itemTypes.attrDefinition.properties.leafItem,
				drInfo.destinationItemTypeId
			],
			[
				consts.itemTypes.attrDefinition.properties.propertyName,
				drInfo.targetProperty
			]
		])
	);

	updateItemPropertyAttributes(
		attrDefinition,
		consts.itemTypes.attrDefinition.properties.leafItem,
		new Map([
			[
				consts.itemPropertiesAttributes.keyedName,
				drInfo.destinationItemTypeName
			]
		])
	);
	attrDefinition.setAttribute('isDirty', '1');
	setActionIfNotSpecified(attrDefinition, 'update');

	updateGrid(gridComponent, attrDefinition.xml);
};

export default applyQueryDefinitionToAttrDefinition;
