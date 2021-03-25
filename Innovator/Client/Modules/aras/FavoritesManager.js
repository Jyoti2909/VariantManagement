const soapConfig = {
	method: 'ApplyMethod',
	async: true
};
const cacheFavoriteItems = (dataMap, favoriteItemJson) => {
	const favoriteItems = JSON.parse(favoriteItemJson);
	favoriteItems.forEach((favoriteItem) => {
		if (favoriteItem.id) {
			dataMap.set(favoriteItem.id, favoriteItem);
		}
	});
};
const sortFavoriteItems = ({ label = '' }, a) =>
	label.localeCompare(a.label || '');
const refreshUIComponents = () => {
	window.mainLayout.navigationPanel.render();
};
const sendSoap = (ArasModules, action, favorite) => {
	const item = { ...favorite };
	if (item.savedSearchItemAml) {
		item.savedSearchItem = ArasModules.xmlToJson(item.savedSearchItemAml);
		delete item.savedSearchItemAml;
	}

	if (item.additionalData) {
		item.additionalData = JSON.stringify(item.additionalData);
	}

	const requestXml = ArasModules.jsonToXml({
		Item: {
			'@attrs': {
				type: 'Method',
				action
			},
			...item
		}
	});

	return ArasModules.soap(requestXml, soapConfig);
};
const errorHandler = (ArasModules, error) => {
	const faultObj = ArasModules.aml.faultToJSON(error.responseXML);
	return ArasModules.notify(faultObj.faultstring, { type: 'error' });
};

function checkPendingRequest(item, pendingRequests) {
	for (const [, pendingItem] of pendingRequests) {
		if (
			item.category === pendingItem.category &&
			item.label === pendingItem.label &&
			item.contextType === pendingItem.contextType &&
			item.additional_data?.id === pendingItem.additional_data?.id
		) {
			return true;
		}
	}
	return false;
}

class FavoritesManager {
	#pendingRequests;

	constructor(ArasModules, arasMainWindowInfo) {
		this.ArasModules = ArasModules;
		this.data = new Map();
		this.pendingItems = new WeakMap();
		this.#pendingRequests = new Map();

		cacheFavoriteItems(this.data, arasMainWindowInfo.favoriteItems);
		cacheFavoriteItems(this.data, arasMainWindowInfo.favoriteItemTypes);
		cacheFavoriteItems(this.data, arasMainWindowInfo.favoriteSearches);
	}

	async add(category, favoriteData) {
		if (!category) {
			return null;
		}

		const item = {
			...favoriteData,
			category
		};
		const storedItem = {
			...item,
			additional_data: item.additionalData || {}
		};
		delete storedItem.additionalData;

		if (checkPendingRequest(storedItem, this.#pendingRequests)) {
			return null;
		}
		const pendingId = Symbol('pendingId');
		this.#pendingRequests.set(pendingId, storedItem);

		const soapRequest = sendSoap(ArasModules, 'Fav_AddFavoriteItem', item);

		const tempId = Symbol('favoriteId');
		this.data.set(tempId, storedItem);

		if (favoriteData) {
			this.pendingItems.set(favoriteData, tempId);
		}
		refreshUIComponents();

		let favorite;
		try {
			const soapResult = await soapRequest;
			favorite = JSON.parse(soapResult.text);
			this.data.set(favorite.id, favorite);
		} catch (error) {
			favorite = null;
			errorHandler(this.ArasModules, error);
		} finally {
			this.data.delete(tempId);
			this.#pendingRequests.delete(pendingId);
			refreshUIComponents();
		}

		return favorite;
	}
	async delete(favoriteId) {
		if (!favoriteId) {
			return false;
		}

		const item = this.data.get(favoriteId);
		if (!item) {
			return true;
		}

		if (checkPendingRequest(item, this.#pendingRequests)) {
			return false;
		}
		const pendingId = Symbol('pendingId');
		this.#pendingRequests.set(pendingId, item);

		const soapRequest = sendSoap(ArasModules, 'Fav_DeleteFavoriteItem', {
			id: favoriteId
		});
		this.data.delete(favoriteId);
		refreshUIComponents();

		try {
			await soapRequest;
			return true;
		} catch (error) {
			errorHandler(this.ArasModules, error);
			this.data.set(favoriteId, item);
			refreshUIComponents();
			return false;
		} finally {
			this.#pendingRequests.delete(pendingId);
		}
	}
	async removeFromQuickAccess(favoriteId) {
		if (!favoriteId) {
			return null;
		}

		const storedFavoriteItem = this.data.get(favoriteId);
		if (storedFavoriteItem && storedFavoriteItem.quickAccessFlag === '0') {
			return null;
		}

		const soapRequest = this.ArasModules.soap(
			`<Item type="Favorite" action="edit" id="${favoriteId}">
				<quick_access_flag>0</quick_access_flag>
			</Item>`,
			{ async: true }
		);
		const updatedFavoriteItem = {
			...storedFavoriteItem,
			quickAccessFlag: '0'
		};
		this.data.set(favoriteId, updatedFavoriteItem);
		refreshUIComponents();

		try {
			await soapRequest;
			return updatedFavoriteItem;
		} catch (error) {
			errorHandler(this.ArasModules, error);
			this.data.set(favoriteId, storedFavoriteItem);
			refreshUIComponents();
			return null;
		}
	}
	get(favoriteId) {
		if (!favoriteId) {
			return null;
		}

		return this.data.get(favoriteId) || null;
	}
	getDataMap(favoriteCategory, filterCriteria = null) {
		if (!favoriteCategory) {
			return this.data;
		}

		const filter = (favoriteItem) => {
			if (favoriteItem.category !== favoriteCategory) {
				return false;
			}

			return filterCriteria ? filterCriteria(favoriteItem) : true;
		};

		const filteredItems = [];
		this.data.forEach((favoriteItem) => {
			if (filter(favoriteItem)) {
				filteredItems.push(favoriteItem);
			}
		});

		const resultMap = new Map();
		filteredItems.sort(sortFavoriteItems).forEach((favoriteItem) => {
			resultMap.set(favoriteItem.id, favoriteItem);
		});

		return resultMap;
	}
}

export default FavoritesManager;
