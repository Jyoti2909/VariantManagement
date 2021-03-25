function getClassStructureItems(propertyName) {
	let classStructureItems = null;
	const foreignClassificationProperty = ArasModules.xml.selectSingleNode(
		document.itemType,
		'Relationships/Item[@type="Property" and name="' +
			propertyName +
			'" ' +
			'and data_type="foreign" and foreign_property[@keyed_name="classification"]]'
	);

	if (!foreignClassificationProperty) {
		const currentItemType = window.document.itemType;
		classStructureItems = aras.getItemProperty(
			currentItemType,
			'class_structure'
		);
	} else {
		const realProperty = aras.getRealPropertyForForeignProperty(
			foreignClassificationProperty
		);
		const foreignItemTypeId = aras.getItemProperty(realProperty, 'source_id');
		const foreignItemType = aras.MetadataCache.GetItemType(
			foreignItemTypeId,
			'id'
		);
		const item = ArasModules.xml.selectSingleNode(
			foreignItemType.results,
			'.//Result/Item'
		);
		classStructureItems = aras.getItemProperty(item, 'class_structure');
	}

	return window.ArasModules.xmlToJson(classStructureItems);
}
