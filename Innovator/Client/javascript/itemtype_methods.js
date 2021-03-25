// © Copyright by Aras Corporation, 2004-2008.

/*
 *   The ItemType methods extension for the Aras Object.
 *
 */

/*-- getItemTypeProperties
 *
 *   Method to get the properties for the ItemType
 *   itemType = the itemType
 *
 */
Aras.prototype.getItemTypeProperties = function (itemType) {
	if (!itemType) {
		return;
	}
	with (this) {
		return itemType.selectNodes('Relationships/Item[@type="Property"]');
	}
};

Aras.prototype.rebuildView = function (viewId) {
	if (!viewId) {
		this.AlertError(
			this.getResource('', 'itemtype_methods.view_to_rebuild_not_specified'),
			'',
			''
		);
		return false;
	}

	with (this) {
		var statusId = showStatusMessage(
			'status',
			this.getResource('', 'itemtype_methods.rebuilding_view'),
			'../images/Progress.gif'
		);
		var res = soapSend(
			'RebuildView',
			'<Item type="View" id="' + viewId + '" />'
		);
		clearStatusMessage(statusId);
		if (res.getFaultCode() != 0) {
			this.AlertError(res);
			return false;
		}

		var formNd = res.results.selectSingleNode('//Item[@type="Form"]');
		if (!formNd) {
			return false;
		}

		var oldView = itemsCache.getItemByXPath(
			'/Innovator/Items/Item[@type="ItemType"]/Relationships/Item[@type="View" and @id="' +
				viewId +
				'"]'
		);
		itemsCache.addItem(formNd);

		var formId = formNd.getAttribute('id');
		var newView = getItem(
			'View',
			'related_id/Item/@id="' + formId + '"',
			'<related_id>' + formId + '</related_id>',
			0
		);

		if (oldView) {
			oldView.parentNode.replaceChild(newView, oldView);
		}
		if (uiFindWindowEx(viewId)) {
			uiReShowItemEx(viewId, newView);
		}
	}
	return true;
};

Aras.prototype.isPolymorphic = function (itemType) {
	var implementationType = this.getItemProperty(
		itemType,
		'implementation_type'
	);
	return implementationType == 'polymorphic';
};

Aras.prototype.getMorphaeList = function (itemType) {
	var morphae = itemType.selectNodes(
		"Relationships/Item[@type='Morphae']/related_id/Item"
	);
	return _fillItemTypeList(morphae, this);
};

Aras.prototype.getPolymorphicsWhereUsedAsPolySource = function (itemTypeId) {
	var polyItems = this.applyItem(
		"<Item type='ItemType' action='get' select='id, name, label'>" +
			'<Relationships>' +
			"<Item type='Morphae' action='get' select='id'>" +
			'<related_id>' +
			itemTypeId +
			'</related_id>' +
			'</Item>' +
			'</Relationships>' +
			'</Item>'
	);
	if (polyItems) {
		var tmpDoc = this.createXMLDocument();
		tmpDoc.loadXML(polyItems);
		polyItems = tmpDoc.selectNodes("Result/Item[@type='ItemType']");
	} else {
		return [];
	}
	return _fillItemTypeList(polyItems, this);
};

function _fillItemTypeList(nodes, aras) {
	var result = [];
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		var id = node.getAttribute('id');
		var name = aras.getItemProperty(node, 'name');
		var label = aras.getItemProperty(node, 'label');
		if (label === null || label === '') {
			label = name;
		}
		result.push({ id: id, name: name, label: label });
	}
	return result;
}
