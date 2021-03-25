function convert() {
	var iomItem = getIomItem();
	if (
		!aras.checkItem(iomItem.node, aras.getMostTopWindowWithAras(window)) ||
		!testUniqueProperties()
	) {
		return;
	}

	if (!testClassification()) {
		aras.AlertError(
			this.aras.getResource(
				'../Modules/aras.innovator.TDF',
				'action.makeexternal_wrong_type_error',
				window.dissallowedClassifications.join(', ')
			)
		);
		return;
	}

	dialogArguments.dialog.close({ isConvertClicked: true });
}

function getIomItem() {
	//use itemMock for unit tests because 'item' cannot be mocked.
	return typeof item !== 'object' || !item.getType ? itemMock : item;
}

function testUniqueProperties() {
	var iomItem = getIomItem();
	var itemType = iomItem.getType();
	var itemTypeFromClient = aras.getItemTypeForClient(itemType, 'name');
	var keyedProperties = itemTypeFromClient.getItemsByXPath(
		'Relationships/Item[@type="Property" and is_keyed="1"]'
	);
	var keyedPropertiesLength = keyedProperties.getItemCount();
	var keyedProperty;
	var keyedPropertyName;
	var keyedPropertyValue;
	var keyedPropertyLabel;
	var i;
	var itemQuery = aras.newIOMItem(itemType, 'get');
	var errorMessageDetails = '';

	for (i = 0; i < keyedPropertiesLength; i++) {
		keyedProperty = keyedProperties.getItemByIndex(i);
		keyedPropertyName = keyedProperty.getProperty('name');
		keyedPropertyLabel = keyedProperty.getProperty('label');
		keyedPropertyValue = iomItem.getProperty(keyedPropertyName);
		errorMessageDetails += i !== 0 ? ', ' : '';
		errorMessageDetails += keyedPropertyLabel + " '" + keyedPropertyValue + "'";
		itemQuery.setProperty(keyedPropertyName, keyedPropertyValue);
	}

	if (!itemQuery.apply().isEmpty()) {
		this.aras.AlertError(
			this.aras.getResource(
				'../Modules/aras.innovator.TDF',
				'action.not_unique_error',
				itemType,
				errorMessageDetails
			)
		);
		return false;
	}

	return true;
}

function testClassification() {
	var iomItem = getIomItem();
	var classification = iomItem.getProperty('classification');
	var isAllowedClassification;

	if (!classification) {
		return true;
	}

	isAllowedClassification =
		window.dissallowedClassifications.indexOf(classification) === -1;
	return isAllowedClassification;
}

function processCommand(cmdId) {
	switch (cmdId) {
		case 'convert_to_external':
			convert();
			break;
	}
}
