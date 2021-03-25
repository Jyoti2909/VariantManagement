viewType = 'formtool';

function updateRootItem(itemNd) {
	if (!itemNd) {
		aras.AlertError('Failed to get the ' + window.itemTypeName, '', '');
		return false;
	}

	if (itemNd.getAttribute('type') != window.itemTypeName) {
		aras.AlertError(
			'Invalid ItemType specified: (' + itemNd.getAttribute('type') + ').'
		);
		return false;
	}

	itemID = itemNd.getAttribute('id');
	var wasLocked = aras.isLockedByUser(item) || aras.isTempEx(item);
	item = itemNd;

	if (isEditMode) {
		isEditMode = wasLocked;
		setEditMode();
	} else {
		isEditMode = wasLocked;
		setViewMode();
	}
}

function getItem() {
	return item;
}

function setEditMode() {
	isEditMode = true;

	var formNd = aras.uiGetForm4ItemEx(item, 'edit');
	var bodyNd = formNd.selectSingleNode('Relationships/Item[@type="Body"]');
	fieldNds = bodyNd.selectNodes(
		'Relationships/Item[@type="Field" and (not(@action) or (@action!="delete" and @action!="purge"))]'
	);
	var fieldsHash = [];

	for (var i = 0; i < fieldNds.length; i++) {
		var fieldNd = fieldNds[i];
		var fieldId = fieldNd.getAttribute('id');
		var fieldType = aras.getItemProperty(fieldNd, 'field_type');

		var frame = document.getElementById('instance');
		if (!frame) {
			continue;
		}
		var setExpHandler =
			frame.contentWindow['expression_' + fieldId + '_setExpression'];
		if (setExpHandler) {
			setExpHandler(isEditMode);
		}
	}

	document.title = aras.getResource(
		'',
		'ui_methods_ex.itemtype_label_item_keyed_name',
		itemTypeLabel,
		aras.getKeyedNameEx(item)
	);
	document.getElementById('editor').contentWindow.setEditMode();
}

function setViewMode() {
	isEditMode = false;

	var formNd = aras.uiGetForm4ItemEx(item, 'edit');
	var bodyNd = formNd.selectSingleNode('Relationships/Item[@type="Body"]');
	fieldNds = bodyNd.selectNodes(
		'Relationships/Item[@type="Field" and (not(@action) or (@action!="delete" and @action!="purge"))]'
	);
	var fieldsHash = [];

	for (var i = 0; i < fieldNds.length; i++) {
		var fieldNd = fieldNds[i];
		var fieldId = fieldNd.getAttribute('id');
		var fieldType = aras.getItemProperty(fieldNd, 'field_type');

		var frame = document.getElementById('instance');
		if (!frame) {
			continue;
		}
		var setExpHandler =
			frame.contentWindow['expression_' + fieldId + '_setExpression'];
		if (setExpHandler) {
			setExpHandler(isEditMode);
		}
	}

	document.title = aras.getResource(
		'',
		'ui_methods_ex.itemtype_label_item_keyed_name_readonly',
		itemTypeLabel,
		aras.getKeyedNameEx(item)
	);
	document.getElementById('editor').contentWindow.setViewMode();
}

onload = function () {
	const src = `FormTool/formtool.html?formID=${window.itemID}`;
	const editorFrame = document.getElementById('editor');

	editorFrame.addEventListener('load', function () {
		aras.browserHelper.toggleSpinner(document, false);
	});

	editorFrame.src = src;
};
