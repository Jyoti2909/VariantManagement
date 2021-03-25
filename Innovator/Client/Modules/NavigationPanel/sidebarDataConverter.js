import SvgManager from '../core/SvgManager';

const icons = {
	navContents: '../images/NavContents.svg'
};

SvgManager.enqueue(Object.values(icons));

export const contentTabId = 'content-tab';

const contentTab = {
	id: contentTabId,
	image: icons.navContents,
	cssClass: 'aras-navigation-panel-tabs__content-tab'
};

function getItemTypeIds(dataMap) {
	const itemTypeIds = new Set();
	dataMap.forEach(({ formId, itemTypeId, startPage }) => {
		if (!itemTypeId || formId || startPage) {
			return;
		}
		itemTypeIds.add(itemTypeId);
	});
	return itemTypeIds;
}

export function updateLockedStatus(favorites, dataMap) {
	const itemTypeIds = getItemTypeIds(dataMap);
	favorites.forEach((item, id) => {
		if (!item.itemTypeId) {
			return;
		}

		const locked = !itemTypeIds.has(item.itemTypeId);
		if (locked !== item.locked) {
			favorites.set(id, { ...item, locked });
		}
	});
}

export function getSidebarData(favorites, dataMap) {
	const sidebarData = new Map();
	sidebarData.set(contentTab.id, {
		...contentTab,
		tooltip_template: aras.getResource('', 'common.contents')
	});

	const itemTypeIds = getItemTypeIds(dataMap);
	favorites.forEach((item) => {
		const additionalData = item.additional_data || {};
		const favoriteItem = {
			...item,
			...additionalData,
			locked: !itemTypeIds.has(additionalData.itemTypeId),
			parentTab: contentTabId,
			tooltip_template: additionalData.label
		};
		delete favoriteItem.label;
		sidebarData.set(favoriteItem.id, favoriteItem);
	});

	return sidebarData;
}
