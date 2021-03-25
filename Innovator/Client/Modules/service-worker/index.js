// eslint-disable-next-line no-unused-vars
const runServiceWorker = (self) => {
	const searchViewFiles = [
		'scripts/itemsGrid.html',
		'javascript/include.aspx?classes=common.css',
		'javascript/include.aspx?classes=ExtendedClassification.css',
		'javascript/include.aspx?classes=ArasModules',
		'jsBundles/cui.js',
		'javascript/include.aspx?classes=/dojo.js',
		'javascript/include.aspx?classes=ScriptSet2',
		'javascript/include.aspx?classes=ScriptSet6',
		'javascript/include.aspx?classes=Dependencies,MainGridFactory,ToolbarWrapper,ColumnSelectionFactory,ModulesHelper',
		'javascript/include.aspx?files=ItemsGridAsyncSoap,ItemsGridAsyncController,itemsGridCommands',
		'javascript/Aras/Client/Controls/Public/GridContainer.js',
		'javascript/Aras/Client/Controls/Experimental/DataGrid.js',
		'javascript/Aras/Client/Controls/Experimental/GridModules.js',
		'javascript/Aras/Client/Controls/Experimental/TypeEditCell.js',
		'javascript/Aras/Client/Controls/Experimental/ContextMenu.js',
		'javascript/Aras/Client/Controls/Public/Cell.js',
		'javascript/Aras/Client/Controls/Experimental/MenuItem.js',
		'javascript/Aras/Client/Controls/Experimental/_grid/CheckedMultiSelect.js',
		'javascript/Aras/Client/Controls/Experimental/ExternalCellWidget/FilePropertyManager.js',
		'javascript/Aras/Client/Controls/Public/GridContainerWrapper.js',
		'javascript/Aras/Client/Controls/Experimental/GridModulesWrapper.js',
		'javascript/Aras/Client/Controls/Public/CellWrapper.js',
		'javascript/Aras/Client/Controls/Experimental/ContextMenuWrapper.js'
	];
	const itemViewFiles = [
		'Modules/aras.innovator.core.ItemWindow/Scripts/Classes/DefaultItemWindowView.js',
		'Modules/aras.innovator.core.ItemWindow/Scripts/Classes/DefaultItemWindowCreator.js',
		'Modules/aras.innovator.core.ItemWindow/cuiTabItemView',
		'Modules/aras.innovator.core.ItemWindow/Scripts/_cuiLayout.js',
		'javascript/include.aspx?classes=ArasModules,ScriptSet1,TearOffMenuControllerNoCUI,pageReturnBlocker',
		'javascript/include.aspx?classes=ItemViewWrappers,arasInnovatorCUI',
		'Modules/aras.innovator.core.EffectivityServices/Scripts/ExtendRelationshipsControlAndCuiWindowHandlers.js',
		'javascript/include.aspx?classes=tearoffWindow',
		'Modules/aras.innovator.core.Controls/Scripts/Controls/Tab.js',
		'javascript/Aras/Client/Controls/Experimental/LazyLoaderBase.js',
		'javascript/Aras/Client/Frames/TearOffMenu.js',
		'scripts/relationshipsInfernoGrid.html',
		'javascript/include.aspx?classes=RelationshipsGridFactory',
		'javascript/include.aspx?files=TopWindowHelper,relationshipsGridFunctions&classes=DragAndDrop,ScriptSet2,ScriptSet6,ToolbarWrapper,ModulesHelper',
		'Modules/aras.innovator.core.Controls/Scripts/Controls/RelationshipsGrid/styleRelationshipsGrid.js',
		'javascript/include.aspx?classes=ColumnSelectionFactory,arasInnovatorCUI',
		'javascript/include.aspx?classes=ArasModules,ItemProperty&files=TopWindowHelper',
		'Modules/aras/field.js',
		'javascript/include.aspx?classes=/dojo.js,ComponentFieldClassStructureHelper',
		'styles/innovatorForm.css',
		'styles/default.css',
		'javascript/include.aspx?classes=formInstance',
		'scripts/searchDialog.html',
		'javascript/dialog.js',
		'javascript/include.aspx?classes=ArasModules,ScriptSet1,ScriptSet6&files=TopWindowHelper,xPropertiesUtils,searchDialog',
		'scripts/dateDialog.html',
		'scripts/ShowFormInFrame.html'
	];

	const ignoreSearchPaths = ['.html', 'cuiTabItemView'];

	const { getState, setState } = (() => {
		let state = {};
		const setState = (value) => (state = { ...state, ...value });
		const getState = () => state;
		return { getState, setState };
	})();

	const applyRequestParams = (url, params, isJSON = true) => {
		const { database, lang, user } = getState();
		const defaultParams = { database, lang, user };
		if (isJSON) {
			defaultParams.accept = 'json';
		}

		const requestParams = { ...defaultParams, ...params };
		for (const [key, value] of Object.entries(requestParams)) {
			url.searchParams.set(key, value);
		}

		url.searchParams.sort();
		return url;
	};

	const createRequest = (action, options = {}) => {
		const { headers: defaultHeaders, metadataURL } = getState();
		const {
			body,
			headers: requestHeaders,
			isJSON = true,
			method = 'GET',
			params
		} = options;
		const headers = { ...defaultHeaders, ...requestHeaders };
		if (isJSON) {
			headers.Accept = 'application/json';
		}

		const url = new URL(`${metadataURL}/${action}`);
		applyRequestParams(url, params, isJSON);
		return new Request(url.toString(), { body, headers, method });
	};

	const getAvailableItemTypeIds = (tocData) => {
		const addItemType = (itemTypeIds, item) => {
			const additionalData = item.additional_data;
			if (
				!additionalData ||
				!additionalData.itemTypeId ||
				additionalData.startPage ||
				additionalData.formId ||
				item['on_click_handler']
			) {
				return itemTypeIds;
			}

			itemTypeIds.add(additionalData.itemTypeId);
			return itemTypeIds;
		};
		return tocData.reduce((itemTypeIds, item) => {
			addItemType(itemTypeIds, item);
			if (item.data) {
				return item.data.reduce(addItemType, itemTypeIds);
			}

			return itemTypeIds;
		}, new Set());
	};

	const getConfigurableUi = async (location, options) => {
		const {
			itemTypeId = '',
			classification = '',
			isJSON = true,
			method = 'GET',
			body = null
		} = options;
		const id = `item_type_id=${itemTypeId}&location_name=${location}&item_classification=${classification}`;
		const { cuiDate: date } = getState();
		const params = { id, date };
		const requestOptions = { params, isJSON, method, body };
		const request = createRequest('GetConfigurableUi', requestOptions);
		return fetch(request);
	};

	const getMatchOptions = (request) => {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const ignoreSearch = ignoreSearchPaths.some((path) =>
			pathname.endsWith(path)
		);
		return { ignoreSearch };
	};

	const updateMetadataRequestInCache = async (request, response) => {
		const { metadataCacheVersion } = getState();
		const cache = await caches.open(metadataCacheVersion);
		await cache.delete(request, { ignoreSearch: true });
		await cache.put(request, response.clone());
	};

	const getMetadata = async (action, dateName, isJSON) => {
		const { metadataDates } = getState();
		const { [dateName]: date } = metadataDates;
		const params = { date };
		const options = { params, isJSON };
		const request = createRequest(action, options);
		const response = await fetch(request);

		await updateMetadataRequestInCache(request, response);

		return response;
	};

	const getMetadataDate = async (...args) => {
		const response = await getMetadata(...args);
		return response.json();
	};

	const getResponseFromCache = async (request) => {
		const {
			cacheVersion,
			metadataCacheVersion,
			metadataURL,
			scope
		} = getState();
		const url = request.url;
		const options = getMatchOptions(request);

		if (url.includes(metadataURL)) {
			const cache = await caches.open(metadataCacheVersion);
			return cache.match(request, options);
		}

		if (url.includes(scope)) {
			const cache = await caches.open(cacheVersion);
			return cache.match(request, options);
		}

		return null;
	};

	const getResponse = async (request) => {
		const response = await getResponseFromCache(request);
		if (response) {
			return response;
		}

		return fetch(request);
	};

	const loadCuiForSearchAndItemView = async (itemTypeIds) => {
		const [prevWindowSectionsMetadata] = await getPrevMetadataResponse(
			'GetWindowsSectionControlsMetadata'
		);
		const [cuiControlsMetadata] = await getMetadataDate(
			'GetWindowsSectionControlsMetadata',
			'ConfigurableUIControls'
		);
		const { modified_on: prevCuiControlsDate } =
			prevWindowSectionsMetadata || {};
		const { modified_on: cuiControlsDate } = cuiControlsMetadata;
		if (cuiControlsDate !== prevCuiControlsDate) {
			const searchViewPreloadPromise = loadCUIWindowsSections(
				'SearchView',
				itemTypeIds,
				cuiControlsDate
			);
			const itemViewPreloadPromise = loadCUIWindowsSections(
				'ItemView',
				itemTypeIds,
				cuiControlsDate
			);
			await Promise.all([searchViewPreloadPromise, itemViewPreloadPromise]);
		}

		const { cuiDate, prevCuiDate } = getState();
		if (cuiDate !== prevCuiDate) {
			const locationsToItemTypeIdsMap = await getLocationsToPreload();
			locationsToItemTypeIdsMap.set('PopupMenuItemGrid', itemTypeIds);
			locationsToItemTypeIdsMap.set('ItemWindowSidebar', itemTypeIds);

			await loadCuiForItemTypesByLocation(locationsToItemTypeIdsMap, cuiDate);
		}
	};

	const loadCUIWindowsSections = async (location, itemTypeIds, date) => {
		const method = 'POST';
		const body = JSON.stringify([...itemTypeIds]);
		const params = {
			id: `item_type_id=&location_name=${location}&item_classification=`
		};
		const requestOptions = { body, method, params };
		const request = createRequest('GetWindowsSectionControls', requestOptions);
		const response = await fetch(request);
		const cuiControls = await response.json();

		await saveRequestsToCache(
			location,
			'GetWindowsSectionControls',
			cuiControls,
			date
		);
	};

	const loadCuiForItemTypesByLocation = async (
		locationsToItemTypeIdsMap,
		date
	) => {
		const method = 'POST';
		const locations = [...locationsToItemTypeIdsMap.keys()];
		const promises = locations.map(async (location) => {
			const classification = '%all_grouped_by_classification%';
			const itemTypeIds = locationsToItemTypeIdsMap.get(location);
			const body = JSON.stringify([...itemTypeIds]);
			const options = { method, body, classification };
			const configurableUiResponse = await getConfigurableUi(location, options);
			const commandBars = await configurableUiResponse.json();

			await saveRequestsToCache(
				location,
				'GetConfigurableUi',
				commandBars,
				date
			);
		});

		return Promise.all(promises);
	};

	const getLocationsToPreload = async () => {
		const locationsMap = new Map();
		const { metadataCacheVersion } = getState();
		const cache = await caches.open(metadataCacheVersion);
		const cacheKeys = await cache.keys();
		const windowSectionControlRequests = cacheKeys.filter((request) =>
			request.url.includes('GetWindowsSectionControls?')
		);
		const promises = windowSectionControlRequests.map(
			async (windowSectionRequest) => {
				const url = new URL(windowSectionRequest.url);
				const searchParams = new URLSearchParams(url.searchParams.get('id'));
				const itemTypeId = searchParams.get('item_type_id');
				const windowSectionResponse = await cache.match(windowSectionRequest);
				const windowSectionControls = await windowSectionResponse.json();
				windowSectionControls.forEach((control) => {
					const location = control['location@keyed_name'];
					if (location) {
						const itemTypeIds = locationsMap.get(location) || [];
						locationsMap.set(location, [...itemTypeIds, itemTypeId]);
					}
				});
			}
		);

		await Promise.all(promises);

		return locationsMap;
	};

	const saveRequestsToCache = async (location, action, cuiData, date) => {
		const { metadataCacheVersion } = getState();
		const cache = await caches.open(metadataCacheVersion);
		const promises = Object.entries(cuiData).map(async ([itemTypeId, body]) => {
			const params = {
				id: `item_type_id=${itemTypeId}&location_name=${location}&item_classification=`,
				date
			};
			const requestOptions = { params };
			const request = createRequest(action, requestOptions);
			const bodyStr = JSON.stringify(body);
			const response = new Response(bodyStr);
			await cache.put(request, response);
		});

		await Promise.all(promises);
	};

	const loadAdditionalMetadataDates = () => {
		const metadataActions = [
			{
				action: 'GetListsMetadata',
				dateName: 'List'
			},
			{
				action: 'GetFormsMetadata',
				dateName: 'Form'
			},
			{
				action: 'GetContentTypeByDocumentItemTypeMetadata',
				dateName: 'ContentTypeByDocumentItemType'
			},
			{
				action: 'GetLifeCycleStates',
				dateName: 'LifeCycleStates'
			},
			{
				action: 'GetSearchModes',
				dateName: 'GetLastModifiedSearchModeDate'
			},
			{
				action: 'GetRelationshipTypesMetadata',
				dateName: 'RelationshipType'
			}
		];
		const promises = metadataActions.map(({ action, dateName }) => {
			const isJSON = action === 'GetLifeCycleStates';
			return getMetadata(action, dateName, isJSON);
		});

		return Promise.all(promises);
	};

	const loadItemTypes = async (itemTypeIds) => {
		const body = JSON.stringify(itemTypeIds);
		const method = 'POST';
		const requestOptions = { body, method };
		const request = createRequest('GetItemType', requestOptions);
		const response = await fetch(request);
		const json = await response.json();
		return json.value || [];
	};

	const getPrevMetadataResponse = async (metadataEndpoint) => {
		const { metadataCacheVersion } = getState();
		const cache = await caches.open(metadataCacheVersion);
		const prevMetadataRequest = createRequest(metadataEndpoint);
		const response = await cache.match(prevMetadataRequest, {
			ignoreSearch: true
		});
		return response ? response.json() : [];
	};

	const getPrevItemTypesMetadata = async () => {
		const prevItemTypeMetadata = await getPrevMetadataResponse(
			'GetItemTypesMetadata'
		);
		return prevItemTypeMetadata.reduce((itemTypeDates, itemType) => {
			const { id, modified_on: date } = itemType;
			itemTypeDates.set(id, date);
			return itemTypeDates;
		}, new Map());
	};

	const loadItemTypeMetadata = async (itemTypeIds) => {
		const prevItemTypeDates = await getPrevItemTypesMetadata();
		const itemTypesMetadata = await getMetadataDate(
			'GetItemTypesMetadata',
			'ItemType'
		);
		const updatedItemTypeDates = itemTypesMetadata.reduce(
			(itemTypeDates, itemType) => {
				const { id, modified_on: date } = itemType;
				if (itemTypeIds.has(id)) {
					const prevDate = prevItemTypeDates.get(id);

					if (prevDate !== date) {
						itemTypeDates.set(id, date);
					}
				}

				return itemTypeDates;
			},
			new Map()
		);

		return { updatedItemTypeDates, prevItemTypeDates };
	};

	const loadMainWindowCUI = async () => {
		const [prevCuiMetadata] = await getPrevMetadataResponse(
			'GetConfigurableUiMetadata'
		);
		const [cuiMetadata] = await getMetadataDate(
			'GetConfigurableUiMetadata',
			'ConfigurableUI'
		);
		const { modified_on: cuiDate } = cuiMetadata;
		const { modified_on: prevCuiDate } = prevCuiMetadata || {};
		setState({ cuiDate, prevCuiDate });
		const tocPromise = loadTOC();
		await loadMainWindowCUISections();
		const toc = await tocPromise;
		return getAvailableItemTypeIds(toc);
	};

	const loadMainWindowCUISections = () => {
		const locations = [
			'MainWindowShortcuts',
			'MainWindowHeader',
			'PopupMenuMainWindowTOC',
			'HeaderTabsContextMenu',
			'PopupMenuSecondaryMenu'
		];
		const classification = '%all_grouped_by_classification%';
		const promises = locations.map((location) => {
			const isJSON = location !== 'MainWindowShortcuts';
			const options = { classification, isJSON };
			return getConfigurableUi(location, options);
		});
		return Promise.all(promises);
	};

	const createItemTypeRequest = (id, date) => {
		const params = { id, date };
		const requestOptions = { params };
		return createRequest('GetItemType', requestOptions);
	};

	const loadMissingItemTypes = async (
		updatedItemTypeDates,
		prevItemTypeDates
	) => {
		if (updatedItemTypeDates.size === 0) {
			return;
		}

		const { metadataCacheVersion } = getState();
		const itemTypeIds = updatedItemTypeDates.keys();
		const itemTypes = await loadItemTypes([...itemTypeIds]);
		const promises = itemTypes.map(async (itemType) => {
			const cache = await caches.open(metadataCacheVersion);
			const { id } = itemType;
			const date = updatedItemTypeDates.get(id);
			const prevDate = prevItemTypeDates.get(id);
			const request = createItemTypeRequest(id, date);
			if (prevDate) {
				const prevRequest = createItemTypeRequest(id, prevDate);
				cache.delete(prevRequest);
			}
			const body = JSON.stringify(itemType);
			const response = new Response(body);
			return cache.put(request, response);
		});
		await Promise.all(promises);
	};

	const loadTOC = async () => {
		const classification = '%all_grouped_by_classification%';
		const options = { classification };
		const response = await getConfigurableUi('TOC', options);
		return response.json();
	};

	const preloadFiles = async (files) => {
		const { cacheVersion, salt } = getState();
		const relativePath = salt ? `./${salt}/` : './';
		const filesWithSalt = files.map((file) => `${relativePath}${file}`);
		const cache = await caches.open(cacheVersion);
		try {
			await cache.addAll(filesWithSalt);
		} catch (error) {
			console.error(error);
		}
	};

	const setCacheVersion = () => {
		const { salt, scope } = getState();
		const cacheVersion = `${scope}${salt}`;
		setState({ cacheVersion, salt });
	};

	const dropFilesCacheIfNeeded = async () => {
		const { cacheVersion } = getState();
		const keys = await caches.keys();

		keys.forEach((cacheKey) => {
			const isStaticFilesCacheKey = cacheKey.includes('X-salt');
			const isCurrentKey = cacheKey === cacheVersion;

			if (isStaticFilesCacheKey && !isCurrentKey) {
				caches.delete(cacheKey);
			}
		});
	};

	const setMetadataCacheVersion = () => {
		const { database, lang, scope, user } = getState();
		const metadataCacheVersion = `${scope}${database}/${user}/${lang}`;
		setState({ metadataCacheVersion });
	};

	const setScope = () => {
		const scopeUrl = new URL(self.registration.scope);
		const scope = scopeUrl.pathname;
		setState({ scope });
	};

	const validateRequest = (request) => {
		const { method } = request;
		if (method !== 'GET') {
			return false;
		}

		return true;
	};

	const sendEndOfLoadNotification = async () => {
		const clients = await self.clients.matchAll();
		clients.forEach((client) =>
			client.postMessage({ type: 'LOADING_FINISHED' })
		);
	};

	self.addEventListener('message', async (event) => {
		const { type, payload = {} } = event.data;
		setState(payload);

		switch (type) {
			case 'AUTHENTICATE':
				setMetadataCacheVersion();
				break;
			case 'LOAD_METADATA': {
				const metadataPromise = getMetadata(
					'GetAllClientMethods',
					'GetAllClientMethodsMetadata',
					false
				);
				const itemTypeIds = await loadMainWindowCUI();
				const {
					updatedItemTypeDates,
					prevItemTypeDates
				} = await loadItemTypeMetadata(itemTypeIds);
				const itemTypesPromise = loadMissingItemTypes(
					updatedItemTypeDates,
					prevItemTypeDates
				);
				const additionalMetadataPromise = loadAdditionalMetadataDates();
				await preloadFiles(searchViewFiles);
				const filesPromise = preloadFiles(itemViewFiles);
				await loadCuiForSearchAndItemView(itemTypeIds);
				await Promise.all([
					metadataPromise,
					additionalMetadataPromise,
					itemTypesPromise,
					filesPromise
				]);
				await sendEndOfLoadNotification();
				break;
			}
			case 'UPDATE_SALT':
				setScope();
				setCacheVersion();
				dropFilesCacheIfNeeded();
				break;
		}
	});

	self.addEventListener('fetch', (event) => {
		const { request } = event;
		const validRequest = validateRequest(request);
		if (!validRequest) {
			return;
		}

		const responsePromise = getResponse(request);
		event.respondWith(responsePromise);
	});
};
