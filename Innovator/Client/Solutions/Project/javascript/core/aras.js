aras.prepareItem4Save = function Aras_prepareItem4Save(itemNd) {
	var itemTypeName = itemNd.getAttribute('type');
	var itemID, item, items, items2;
	var i, j, parentNd;

	itemID = itemNd.getAttribute('id');
	items = itemNd.selectNodes('.//Item[@id="' + itemID + '"]');

	for (i = 0; i < items.length; i++) {
		item = items[i];
		parentNd = item.parentNode;
		parentNd.removeChild(item);
		parentNd.text = itemID;
	}

	items = itemNd.selectNodes('.//Item[@action="delete"]');
	for (i = 0; i < items.length; i++) {
		item = items[i];
		var childs = item.selectNodes('*[count(descendant::Item[@action])=0]');
		for (j = 0; j < childs.length; j++) {
			var childItem = childs[j];
			item.removeChild(childItem);
		}
	}

	var mapIds = new Map();
	items = itemNd.selectNodes('.//Item');
	for (i = 0; i < items.length; i++) {
		item = items[i];
		itemID = item.getAttribute('id');

		if (mapIds.has(itemID)) {
			items2 = mapIds.get(itemID).selectNodes('.//Item[@id="' + itemID + '"][@data_type != "foreign"]');
			for (j = 1; j < items2.length; j++) {
				item = items2[j];
				parentNd = item.parentNode;
				parentNd.removeChild(item);
				parentNd.text = itemID;
			}
		}

		mapIds.set(itemID, item);
	}

	items = itemNd.selectNodes('.//Item[not(@action) and not(.//Item/@action)]');
	for (i = 0; i < items.length; i++) {
		items[i].setAttribute('action', 'get');
	}

	items = itemNd.selectNodes('.//Item[@action="get" and (not(.//Item) or not(.//Item/@action!="get"))]');
	for (i = 0; i < items.length; i++) {
		item = items[i];
		itemID = item.getAttribute('id');
		parentNd = item.parentNode;

		if (parentNd.nodeName == 'Relationships') {
			parentNd.removeChild(item);
		} else {
			if (itemID) {
				parentNd.removeChild(item);
				parentNd.text = itemID;
			}
		}
	}

	items = itemNd.selectNodes('.//Item[@action="get"]');
	for (i = 0; i < items.length; i++) {
		items[i].setAttribute('action', 'skip');
	}
};