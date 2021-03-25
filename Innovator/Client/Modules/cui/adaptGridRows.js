const itemDataTypes = ['item', 'file', 'claim by', 'current_state'];

const valueParsers = {
	float: (value) => (value ? parseFloat(value) : null),
	integer: (value) => (value ? parseInt(value) : null),
	boolean: (value) => Boolean(Number(value))
};

export function adaptGridRowFromStore(rowItem, headMap) {
	const copyItem = { ...rowItem };
	headMap._store.forEach((head) => {
		if (rowItem[head.name]) {
			const dataType = head.dataType;
			const parser = valueParsers[dataType];

			copyItem[head.name] = parser
				? parser(rowItem[head.name])
				: rowItem[head.name];
		}
	});
	return copyItem;
}

export function adaptGridRowsFromXml(resultNode, options = {}) {
	const items = ArasModules.xmlToODataJsonAsCollection(resultNode);
	const headMap = options.headMap;
	const indexRows = [];
	const linkPropertyToBeProcessed = options.linkPropertyToBeProcessed;

	const rowsMap = items.reduce((map, item) => {
		let currentItem;
		const clonedItem = { ...item };
		const uniqueId = clonedItem.id;

		options.indexHead.forEach((columnName) => {
			const dataType = headMap.get(columnName, 'dataType');
			const linkProperty = headMap.get(columnName, 'linkProperty');
			const propertyName = headMap.get(columnName, 'name') || columnName;
			const linkPropertyValue = clonedItem[linkProperty];

			currentItem = linkProperty
				? map.get(linkPropertyValue) || linkPropertyValue || {}
				: clonedItem;

			if (linkPropertyToBeProcessed) {
				if (linkProperty === linkPropertyToBeProcessed) {
					currentItem = clonedItem;
				} else {
					return;
				}
			}

			let propertyValue = currentItem[propertyName];
			const isLinkedProperty = map.has(propertyValue);
			if (
				(itemDataTypes.includes(dataType) &&
					propertyValue &&
					typeof propertyValue === 'object') ||
				isLinkedProperty
			) {
				if (isLinkedProperty) {
					propertyValue = map.get(propertyValue);
				}
				map.set(propertyValue.id, propertyValue);

				const action = propertyValue['@aras.action'];
				const discoverOnly = propertyValue['@aras.discover_only'];

				currentItem[`${propertyName}`] = propertyValue.id;
				if (action) {
					currentItem[`${propertyName}@aras.action`] = action;
				}
				if (discoverOnly) {
					currentItem[`${propertyName}@aras.discover_only`] = discoverOnly;
				}

				if (!currentItem[`${propertyName}@aras.type`]) {
					currentItem[`${propertyName}@aras.type`] =
						propertyValue['id@aras.type'] || dataType;
				}
				if (!currentItem[`${propertyName}@aras.keyed_name`]) {
					currentItem[`${propertyName}@aras.keyed_name`] =
						propertyValue.keyed_name || propertyValue['id@aras.keyed_name'];
				}
			}

			const parser = valueParsers[dataType];
			if (parser) {
				currentItem[propertyName] = parser(propertyValue);
			}

			const currentItemId = currentItem.id;
			if (linkProperty && currentItemId) {
				map.set(currentItemId, currentItem);
				clonedItem[linkProperty] = currentItemId;
			}
		});

		indexRows.push(uniqueId);
		return map.set(uniqueId, clonedItem);
	}, new Map());

	return {
		rowsMap,
		indexRows
	};
}
