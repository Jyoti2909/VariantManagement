var forcedFeatured = [];
var forcedExcludedProp = [];
var itemtypes;

window.onload = function onLoadHandler() {
	GetItemTypes();
	const featured = aras.getItemProperty(document.item, 'featured_itemtypes');
	if (featured) {
		forcedFeatured = prepareArray(featured.split('|'));
		populateForcedFeatured(forcedFeatured, true);
	}

	const excludedProp = aras.getItemProperty(
		document.item,
		'excluded_properties'
	);
	if (excludedProp) {
		forcedExcludedProp = prepareExcludedProperties(excludedProp);
		populateForcedExcludedProperties(forcedExcludedProp, true);
	}
};

function prepareArray(simpleArr) {
	const forced = [];
	for (let i = 0; i < simpleArr.length; i++) {
		forced.push({ id: simpleArr[i] });
	}
	return forced;
}

function convertToSimpleArr(arr) {
	const simple = [];
	for (let i = 0; i < arr.length; i++) {
		simple.push(arr[i].id);
	}
	return simple;
}

function prepareExcludedProperties(excludedProp) {
	const items = [];
	const propsNotGrouped = excludedProp.split('|');

	for (let i = 0; i < propsNotGrouped.length; i++) {
		let itemFound = false;
		const itProp = propsNotGrouped[i].split(':');
		if (items.length !== 0) {
			for (let j = 0; j < items.length; j++) {
				if (items[j].id === itProp[0]) {
					items[j].childs.push(itProp[1]);
					itemFound = true;
					break;
				}
			}
		}

		if (items.length === 0 || !itemFound) {
			items.push({ id: itProp[0], childs: [itProp[1]] });
		}
	}
	return items;
}

function GetItemTypes() {
	itemtypes = aras.newIOMItem('ItemType', 'get');
	itemtypes.setAttribute('select', 'id,name,label');
	const properties = aras.newIOMItem('Property', 'get');
	properties.setAttribute('select', 'id,name,label');
	itemtypes.addRelationship(properties);

	itemtypes = itemtypes.apply();
	if (itemtypes.isError()) {
		aras.AlertError(itemtypes.getErrorString());
	}
}

//action
function EditListContent(listType) {
	const isLockedByMe = aras.isLockedByUser(document.item);
	if (!isLockedByMe) {
		return;
	}

	switch (listType) {
		case 'featured_itemtypes':
			showDialog(listType, 'itemtypes', forcedFeatured, populateForcedFeatured);
			break;
		case 'excluded_properties':
			showDialog(
				listType,
				'properties',
				forcedExcludedProp,
				populateForcedExcludedProperties,
				'SettingsProperties'
			);
			break;
	}
}

function showDialog(type, label, forced, callback, setting) {
	const filteredItemsTypes = aras.newIOMItem();
	filteredItemsTypes.loadAML(itemtypes.dom.xml);
	const izendaSource = '../Modules/aras.innovator.Izenda/';
	const secondLabel = aras.getResource(
		izendaSource,
		'servicereporting.' + type
	);

	window.parent.ArasModules.Dialog.show('iframe', {
		title: secondLabel,
		type: type,
		labels: [
			aras.getResource(izendaSource, 'servicereporting.' + label),
			secondLabel
		],
		treeId: type + '_tree',
		setting: setting || 'SettingsItemTypes',
		forced: forced,
		items: filteredItemsTypes,
		dialogWidth: 705,
		dialogHeight: 525,
		resizable: false,
		content:
			'../Modules/aras.innovator.Izenda/Views/SettingsChoiceListTemplate.html'
	}).promise.then(callback);
}

function populateForcedFeatured(forced, notUpdate) {
	if (forced) {
		forcedFeatured = forced;
	}
	populateForcedFeaturedImplementation(
		forcedFeatured,
		notUpdate,
		'featured_itemtypes'
	);
}

function populateForcedFeaturedImplementation(forced, notUpdate, type) {
	const itemtypesDom = document.getElementById(type);
	if (itemtypesDom) {
		itemtypesDom.innerHTML = '';
		for (let i = 0; i < forced.length; i++) {
			const currentItem = itemtypes.getItemsByXPath(
				"//Item[@id='" + forced[i].id + "']"
			);
			const itm = currentItem.getItemByIndex(0);
			itemtypesDom.innerHTML +=
				'<div>' +
				(itm.getProperty('label') || itm.getProperty('name')) +
				'</div>';
		}
		if (!notUpdate) {
			aras.setItemProperty(
				document.item,
				type,
				convertToSimpleArr(forced).join('|')
			);
		}
	}
}

function populateForcedExcludedProperties(forced, notUpdate) {
	if (forced) {
		forcedExcludedProp = forced;
	}
	populateForcedExcludedPropertiesImplementation(
		forcedExcludedProp,
		notUpdate,
		'excluded_properties'
	);
}

function populateForcedExcludedPropertiesImplementation(
	forced,
	notUpdate,
	type
) {
	const propsDom = document.getElementById(type);
	if (propsDom) {
		propsDom.innerHTML = '';

		for (let i = 0; i < forced.length; i++) {
			const itId = forced[i].id;
			const currentItem = itemtypes
				.getItemsByXPath("//Item[@id='" + itId + "']")
				.getItemByIndex(0);
			let itName = currentItem.getProperty('label');
			if (!itName) {
				itName = currentItem.getProperty('name');
			}
			for (let j = 0; j < forced[i].childs.length; j++) {
				const rel = currentItem.getItemsByXPath(
					"Relationships/Item[@id='" + forced[i].childs[j] + "']"
				);
				let name = rel.getProperty('label');
				if (!name) {
					name = rel.getProperty('name');
				}
				propsDom.innerHTML += '<div>' + itName + ': ' + name + '</div>';
			}
		}

		if (!notUpdate) {
			const items = [];
			for (let i = 0; i < forced.length; i++) {
				const itId = forced[i].id;
				for (let j = 0; j < forced[i].childs.length; j++) {
					items.push(itId + ':' + forced[i].childs[j]);
				}
			}
			aras.setItemProperty(document.item, type, items.join('|'));
		}
	}
}
