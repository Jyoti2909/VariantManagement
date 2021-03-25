// (c) Copyright by Aras Corporation, 2004-2013.
var currQryItem;
var currItemType = null;
var itemTypeID = '';
var itemTypeName = '';
var itemTypeLabel = '';
var visiblePropNds;
var userMethodColumnCfgs = {}; //to support OnSearchDialog grid event
var searchLocation = '';

var xmlReadyFlag = false;
var promiseCountResult;
const INPUT_ROW_ID = 'input_row';

function initPage(isPopup) {
	var criteriaName;
	var criteriaValue;

	if (itemTypeID) {
		//itemTypeID has higher priority because of poly items
		criteriaName = 'id';
		criteriaValue = itemTypeID;
	} else if (itemTypeName) {
		criteriaName = 'name';
		criteriaValue = itemTypeName;
	} else {
		aras.AlertError(
			aras.getResource(
				'',
				'search.neither_input_item_type_name_nor_id_specified'
			)
		);
		if (isPopup) {
			window.close();
		}
		return false;
	}

	var iomItemType = aras.getItemTypeForClient(criteriaValue, criteriaName);
	if (iomItemType.isError()) {
		if (isPopup) {
			window.close();
		}
		return false;
	}

	currItemType = iomItemType.node;
	itemTypeID = currItemType.getAttribute('id');
	itemTypeName = aras.getItemProperty(currItemType, 'name');
	itemTypeLabel = aras.getItemProperty(currItemType, 'label');
	if (!itemTypeLabel) {
		itemTypeLabel = itemTypeName;
	}

	currQryItem = aras.newQryItem(itemTypeName);

	visiblePropNds = [];

	visiblePropNds = aras.getvisiblePropsForItemType(currItemType);
	aras.uiInitItemsGridSetups(currItemType, visiblePropNds);
}

function updatePagination() {
	pagination.updateControlsStateByDefault();
	const isAppend =
		aras.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_append_items'
		) === 'true';
	if (!isAppend) {
		return Promise.resolve();
	}

	const nextButtonState = pagination.getItem('pagination_next_button').disabled;
	pagination.setItemEnabled('pagination_prev_button', false);
	pagination.setItemEnabled(
		'pagination_next_button',
		!nextButtonState && pagination.itemsCount !== pagination.totalResults
	);

	return pagination.render();
}

function doSearch() {
	if (searchContainer) {
		searchContainer.runSearch();
	} else {
		setTimeout(function () {
			doSearch();
		}, 50);
	}
}

function onSelectItem() {}

function cacheValue(value, cacheKey) {
	if (value && !currentSearchMode.getCacheItem(cacheKey)) {
		currentSearchMode.setCacheItem(cacheKey, value);
	}
}

function setupPageNumber(anyItem) {
	if (!anyItem) {
		anyItem = currQryItem.getResponseDOM().selectSingleNode('//Item');
	}
	let pagemax = -1;
	let itemmax;
	const itemsWithNoAccesCount = currQryItem
		.getResponse()
		.getMessageValue('items_with_no_access_count');
	if (itemsWithNoAccesCount) {
		currentSearchMode.setCacheItem(
			'itemsWithNoAccessCount',
			parseInt(itemsWithNoAccesCount)
		);
	}
	if (!anyItem) {
		return;
	}

	const pagesize = currQryItem.getPageSize();
	if (pagesize === '-1') {
		pagemax = 1;
		itemmax = currQryItem
			.getResultDOM()
			.selectNodes('/' + SoapConstants.EnvelopeBodyXPath + '/Result/Item')
			.length;
	} else {
		pagemax = anyItem.getAttribute('pagemax');
		itemmax = anyItem.getAttribute('itemmax');
	}
	currentSearchMode.setCacheItem(
		'criteriesHash',
		ArasModules.utils.hashFromString(currQryItem.getCriteriesString())
	);
	cacheValue(itemmax, 'itemmax');
	cacheValue(pagemax, 'pagemax');
}

function setupGrid(isGridInitXml, doNotRenderRows) {
	const isRelationshipsGrid = searchLocation === 'Relationships Grid';
	const isInfernoRelationshipGrid = !!grid._grid;
	const isMainGrid = searchLocation === 'Main Grid';
	const isSearchDialog = searchLocation === 'Search Dialog';
	const resDom = currQryItem.getResultDOM();
	if (!resDom) {
		return Promise.resolve();
	}

	let itTypeId = '';
	if (isRelationshipsGrid) {
		itTypeId = aras.getRelationshipTypeId(window['RelType_Nm']);
		syncWithClient(resDom);
		if (window.pagination) {
			pagination.itemsCount = currQryItem
				.getResultDOM()
				.selectNodes(
					'/' + SoapConstants.EnvelopeBodyXPath + '/Result/Item'
				).length;
		}
	} else {
		itTypeId = aras.getItemTypeId(itemTypeName);
		currQryItem.syncWithClient();
	}

	let gridXml = '';
	const params = aras.newObject();
	params['only_rows'] = !isGridInitXml;
	params.multiselect = isRelationshipsGrid || isMainGrid || window.multiselect;
	if (isRelationshipsGrid && !isInfernoRelationshipGrid) {
		const columnObjects = aras.uiPrepareDOM4XSLT(resDom, itTypeId, 'RT_');
		params['enable_links'] = !isEditMode;
		params.columnObjects = columnObjects;
		params.enableFileLinks = true;
		params.bgInvert = true;
		if (window['RelatedItemType_ID']) {
			params[window['RelatedItemType_ID']] = '';
		}

		const tableNd = resDom.selectSingleNode(aras.XPathResult('/table'));
		tableNd.setAttribute('editable', isEditMode ? 'true' : 'false');

		gridXml = aras.uiGenerateRelationshipsGridXML(
			resDom,
			DescByVisibleProps,
			RelatedVisibleProps,
			window['DescByItemType_ID'],
			params,
			true
		);
	}

	if (isGridInitXml) {
		if (isMainGrid || isSearchDialog) {
			const plugins = [window.cuiGridPlugins.itemTypeGridPlugin];
			if (isSearchDialog) {
				plugins.push(window.cuiGridPlugins.searchDialogGridPlugin);
			}

			const userPreferencesItem = aras.getPreferenceItem(
				'Core_ItemGridLayout',
				itemTypeID
			);
			return window
				.cuiGrid(grid._grid, {
					itemTypeId: itemTypeID,
					userPreferences: userPreferencesItem,
					gridWrapper: grid,
					plugins: plugins,
					getStateOfLayout: () => window.layout.state,
					getPropsOfLayout: () => window.layout.props
				})
				.then(function () {
					if (window.previewPane) {
						const userPreviewMode = aras.getItemProperty(
							userPreferencesItem,
							'preview_state',
							'Off'
						);
						previewPane.setType(userPreviewMode);
					}
					xmlReadyFlag = true;
				});
		}
		if (isInfernoRelationshipGrid) {
			const userPreferencesRelItem = aras.getPreferenceItem(
				'Core_RelGridLayout',
				RelType_ID
			);
			const relationshipTypeNode = aras.getRelationshipType(RelType_ID).node;
			const relationshipTypeNodeJson = ArasModules.xmlToODataJson(
				'<Result>' + relationshipTypeNode.xml + '</Result>'
			).Result;
			const itemTypeName = relationshipTypeNodeJson.name;
			const itemTypePlugins = window.cuiGridPluginsFactory(itemTypeName);
			const plugins = [
				window.cuiGridPlugins.relatedItemTypeGridPlugin,
				grid.redline_Experimental.plugin,
				...itemTypePlugins
			];

			return window
				.cuiGrid(grid._grid, {
					itemTypeId: relationshipTypeNodeJson.relationship_id,
					userPreferences: userPreferencesRelItem,
					relatedItemTypeId: relationshipTypeNodeJson.related_id,
					gridView: relationshipTypeNodeJson.grid_view,
					gridWrapper: grid,
					plugins: plugins,
					getStateOfLayout: () => window.layout.state,
					getPropsOfLayout: () => window.layout.props
				})
				.then(function () {
					grid.setEditable(isEditMode);
					xmlReadyFlag = true;
				});
		}

		if (!gridXml) {
			gridXml = aras.uiGenerateItemsGridXML(
				resDom,
				visiblePropNds,
				itTypeId,
				params
			);
		}
		grid['InitXML_Experimental'](gridXml, doNotRenderRows);
	} else {
		if (isMainGrid || isSearchDialog || isInfernoRelationshipGrid) {
			if (grid.getRowCount() > 0) {
				grid.removeAllRows();
			}

			const rowsInfo = window.adaptGridRowsFromXml(currQryItem.getResult(), {
				headMap: grid._grid.head,
				indexHead: grid._grid.settings.indexHead
			});

			const localChanges =
				window.layout &&
				window.layout.props &&
				window.layout.props.localChanges;

			if (localChanges) {
				Object.values(localChanges).forEach((localChangesForItemType) => {
					Object.entries(localChangesForItemType).forEach(
						([itemId, itemChanges]) => {
							const currentItem = rowsInfo.rowsMap.get(itemId);

							if (currentItem) {
								const adaptedRow = window.adaptGridRowFromStore(
									itemChanges,
									grid._grid.head
								);

								rowsInfo.rowsMap.set(itemId, {
									...currentItem,
									...adaptedRow
								});
							}
						}
					);
				});
			}

			grid._grid.rows._store = rowsInfo.rowsMap;
			grid._grid.settings.indexRows = rowsInfo.indexRows;
			grid._grid.render();
			grid.gridXmlLoaded(true);
		} else {
			if (grid.getRowCount() === 0) {
				grid.addXMLRows(gridXml);
			} else {
				grid['InitXMLRows_Experimental'](gridXml);
			}
		}
	}

	xmlReadyFlag = true;
	return Promise.resolve();
}

function createEmptyResultDom() {
	var resDom = aras.createXMLDocument();
	resDom.loadXML(
		SoapConstants.EnvelopeBodyStart +
			'<Result/>' +
			SoapConstants.EnvelopeBodyEnd
	);
	return resDom;
}

onbeforeunload = function onbeforeunloadHandler() {
	window.isOnBeforeUnload = true;

	if (searchContainer) {
		searchContainer.onEndSearchContainer();
	}

	if (window.onDeinitialize) {
		window.onDeinitialize();
	}

	saveSetups();

	window.isOnBeforeUnload = false;
};

function saveSetups() {
	const isRelationshipsGrid = searchLocation === 'Relationships Grid';
	if (!xmlReadyFlag) {
		return;
	}

	const itemId = isRelationshipsGrid
		? aras.getRelationshipTypeId(window['RelType_Nm'])
		: window.itemTypeID;
	const preferenceItemName = isRelationshipsGrid
		? 'Core_RelGridLayout'
		: 'Core_ItemGridLayout';

	const commandbarPresent =
		document.querySelector('#relationship-toolbars .aras-commandbar') !== null;

	if (
		searchLocation === 'Main Grid' ||
		searchLocation === 'Search Dialog' ||
		(isRelationshipsGrid &&
			cuiToolbarsRequired &&
			cuiToolbarsRequired() &&
			commandbarPresent)
	) {
		const itemPrefernce = aras.getPreferenceItem(preferenceItemName, itemId);

		// Action attribute deleted so that preferences that have already been saved aren't saved again during logout.
		itemPrefernce.removeAttribute('action');
		return;
	}

	const varsHash = {};
	const isRedlineActive =
		window.grid && grid.redline_Experimental.isRedlineActive;

	const pageSize = pagination.pageSize;
	if (pageSize || pageSize === 0) {
		varsHash['page_size'] = pageSize || '';
	}

	varsHash['redline_view'] = isRedlineActive ? '1' : '0';
	varsHash['col_widths'] = window.grid.GetColWidths();
	varsHash['col_order'] = window.grid.getLogicalColumnOrder();
	if (window.grid._grid) {
		varsHash.frozen_columns = window.grid._grid.settings.frozenColumns.toString();
	}

	aras.setPreferenceItemProperties(preferenceItemName, itemId, varsHash);
}

function onLink(itemTypeName, itemID) {
	aras.uiShowItem(itemTypeName, itemID);
}

function applyCellEditCommon(rowId, field) {
	if (INPUT_ROW_ID === rowId) {
		currentSearchMode.setPageNumber(1);

		const grid = this;
		const columnIndex = this.GetColumnIndex(field);
		const inputCell = this['grid_Experimental'].inputRowCollections[field] || {
			get: function () {},
			focus: function () {
				grid._grid.settings.focusedCell = { rowId: 'searchRow', headId: field };
				grid._oldSearchHeadId = field;
			}
		};
		const criteria = this.inputRow.get(field, 'value');
		const useWildcards =
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_use_wildcards'
			) == 'true';
		const condition = useWildcards ? 'like' : 'eq';

		const propDef = searchContainer.getPropertyDefinitionByColumnIndex(
			columnIndex
		);
		const propXpath = searchContainer.getPropertyXPathByColumnIndex(
			columnIndex
		);

		if (
			currentSearchMode.setSearchCriteria(
				propDef,
				propXpath,
				criteria,
				condition
			)
		) {
			inputCell._lastValueReported = inputCell.get('value');
		} else {
			inputCell._lastValueReported = '';
			if (aras.confirm(aras.getResource('', 'search.invalid_criteria'))) {
				inputCell.focus();
			} else {
				currentSearchMode.currQryItem.removeSearchCriteria(propXpath);
				this.inputRow.set(field, 'value', '');
			}
		}
	}
}

async function getAndUpdatePageSizeAndMaxRecords() {
	currentSearchMode.removeCacheItem('itemmax');
	currentSearchMode.removeCacheItem('pagemax');
	currentSearchMode.removeCacheItem('criteriesHash');
	const pagesize = currQryItem.getPageSize();
	const maxRecords = currQryItem.getMaxRecords();
	const queryType = currQryItem.item.getAttribute('queryType');
	const item = aras.newIOMItem(currQryItem.itemTypeName, 'get');
	item.setAttribute('returnMode', 'countOnly');
	item.setAttribute('select', 'id');
	item.setAttribute('pagesize', pagesize);
	if (maxRecords) {
		item.setAttribute('maxRecords', maxRecords);
	}
	if (queryType) {
		item.setAttribute('queryType', queryType);

		const queryDate = currQryItem.item.getAttribute('queryDate');
		if (queryDate) {
			item.setAttribute('queryDate', queryDate);
		}
	}
	const criteries = currQryItem.dom.selectNodes('/Item/*');
	for (let i = 0; i < criteries.length; i++) {
		item.dom.firstChild.appendChild(criteries[i].cloneNode(true));
	}
	promiseCountResult = ArasModules.soap(item.node.xml, {
		method: 'ApplyItem',
		async: true
	});
	const resultNode = await promiseCountResult;
	const itemmax = parseAnswerGetCount(resultNode.ownerDocument || resultNode);
	const itemsWithNoAccessCount = currentSearchMode.getCacheItem(
		'itemsWithNoAccessCount'
	);

	if (itemsWithNoAccessCount > 0) {
		showPermissionsLimitedNotification();
	}

	return itemmax;
}

function parseAnswerGetCount(res) {
	promiseCountResult = null;
	if (aras.hasFault(res)) {
		aras.AlertError(res);
		return;
	}
	res = aras.getMessageNode(res);
	const itemmax = res
		.selectSingleNode('event[@name="itemmax"]')
		.getAttribute('value');
	const pagemax = res
		.selectSingleNode('event[@name="pagemax"]')
		.getAttribute('value');
	currentSearchMode.setCacheItem(
		'criteriesHash',
		ArasModules.utils.hashFromString(currQryItem.getCriteriesString())
	);
	currentSearchMode.setCacheItem('itemmax', itemmax);
	currentSearchMode.setCacheItem('pagemax', pagemax);
	currentSearchMode.setCacheItem(
		'itemsWithNoAccessCount',
		parseInt(
			res
				.selectSingleNode('event[@name="items_with_no_access_count"]')
				.getAttribute('value')
		)
	);
	return itemmax;
}

function showPermissionsLimitedNotification() {
	const notify = aras.getNotifyByContext(window);
	notify(aras.getResource('', 'search.permissions_limited_suffix'));
}
