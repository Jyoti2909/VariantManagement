import consts from './Constants';
import removeNodesWithDeleteAction from './removeNodesWithDeleteAction';

const getDrInfoByQueryDefinition = function (queryDefinition) {
	queryDefinition = queryDefinition.cloneNode(true);

	removeNodesWithDeleteAction(queryDefinition);
	const destination = getDestinationQueryItem(queryDefinition);
	const targetProperty = getTargetProperty(destination);
	removeSelectedProperties(destination);
	removeExcessAttributes(queryDefinition);

	const implementationQuery = queryDefinition.xml;
	const destinationItemTypeId = aras.getItemProperty(
		destination,
		consts.itemTypes.queryItem.properties.itemType
	);
	const destinationItemTypeName = aras.getItemPropertyAttribute(
		destination,
		consts.itemTypes.queryItem.properties.itemType,
		consts.itemPropertiesAttributes.keyedName
	);

	return {
		destinationItemTypeId: destinationItemTypeId,
		destinationItemTypeName: destinationItemTypeName,
		implementationQuery: implementationQuery,
		targetProperty: targetProperty
	};
};

const getDestinationQueryItem = function (queryDefinition) {
	function getQueryReferenceByParentRefId(parentRefId) {
		if (parentRefId === undefined) {
			return;
		}

		const queryReferences = aras.getRelationships(
			queryDefinition,
			consts.itemTypes.queryReference.itemTypeName
		);
		for (let i = 0, count = queryReferences.length; i < count; i++) {
			const reference = queryReferences[i];
			if (
				aras.getItemProperty(
					reference,
					consts.itemTypes.queryReference.properties.parentRefId
				) === parentRefId
			) {
				return reference;
			}
		}
	}

	function getQueryItemByRefId(refId) {
		const queryItems = aras.getRelationships(
			queryDefinition,
			consts.itemTypes.queryItem.itemTypeName
		);
		for (let i = 0, count = queryItems.length; i < count; i++) {
			const queryItem = queryItems[i];
			if (
				aras.getItemProperty(
					queryItem,
					consts.itemTypes.queryItem.properties.refId
				) === refId
			) {
				return queryItem;
			}
		}
	}

	let destinationQueryItem = undefined;
	let queryReference = getQueryReferenceByParentRefId('');
	while (queryReference !== undefined) {
		destinationQueryItem = getQueryItemByRefId(
			aras.getItemProperty(
				queryReference,
				consts.itemTypes.queryReference.properties.childRefId
			)
		);
		queryReference = getQueryReferenceByParentRefId(
			aras.getItemProperty(
				destinationQueryItem,
				consts.itemTypes.queryItem.properties.refId
			)
		);
	}

	return destinationQueryItem;
};

const getTargetProperty = function (queryItem) {
	const properties = aras.getRelationships(
		queryItem,
		consts.itemTypes.queryItemSelectProperty.itemTypeName
	);
	if (properties.length > 1) {
		throw Error('More than one target property is selected.');
	}

	return aras.getItemProperty(
		properties[0],
		consts.itemTypes.queryItemSelectProperty.properties.propertyName
	);
};

const removeExcessAttributes = function (item) {
	const excessAttributes = ['isNew', 'isTemp', 'action', 'levels', 'isDirty'];
	excessAttributes.forEach((attr) => {
		item.removeAttribute(attr);
	});

	for (let i = 0, count = item.children.length; i < count; i++) {
		const child = item.children[i];
		removeExcessAttributes(child);
	}
};

const removeSelectedProperties = function (queryItem) {
	const selectedPropertyItems = aras.getRelationships(
		queryItem,
		consts.itemTypes.queryItemSelectProperty.itemTypeName
	);
	for (let i = 0, count = selectedPropertyItems.length; i < count; i++) {
		selectedPropertyItems[i].remove();
	}

	const relsNode = queryItem.selectSingleNode('Relationships');
	if (relsNode && relsNode.children.length === 0) {
		relsNode.remove();
	}
};

export default getDrInfoByQueryDefinition;
