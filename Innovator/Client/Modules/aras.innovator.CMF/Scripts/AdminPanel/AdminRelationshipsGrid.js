var aras = parent.aras;
var currIFrameId = '';
var LocationSearches = {};
var relationships = this;

var isEditMode = QueryString('editMode').toString() == '1';
var itemID = QueryString('itemID').toString();
var itemTypeName = QueryString('ITName').toString();
var item = null;
var iframesCollection = null;
var tabbars = {};
var tabbar = null;
var currentItemId = null;

onload = function () {
	initRelTabbar();
};

function initIframesCollection(currIFrameId) {
	if (!iframesCollection) {
		iframesCollection = new Object(); // jshint ignore:line
	}

	for (var iframeID in iframesCollection) {
		if (!currIFrameId || iframeID != currIFrameId) {
			if (iframesCollection[iframeID].contentWindow.onbeforeunload) {
				iframesCollection[iframeID].contentWindow.onbeforeunload();
			}
			iframesCollection[iframeID].src = '../blank.html';
			aras.deletePropertyFromObject(iframesCollection, iframeID);
		}
	}
}

function initItem() {
	item = parent.currContentTypeNode;
}

function initializeTabbars(typesArray) {
	var exclude = [
		'cmf_ElementType',
		'cmf_ElementBinding',
		'cmf_ElementBinging',
		'cmf_ContentTypeView',
		'cmf_ContentTypeExportRel',
		'cmf_PropertyType',
		'cmf_ComputedProperty',
		'cmf_TabularViewTree',
		'cmf_TabularViewHeaderRows',
		'cmf_TabularViewColumn',
		'cmf_AdditionalPropertyType'
	];
	for (var i = 0; i < typesArray.length; i++) {
		var tmpTabbar = [];
		var tabsRoot = parent.aras.uiGenerateRelationshipsTabbar(
			typesArray[i],
			parent.aras.getItemTypeId(typesArray[i])
		);
		var tabNds = tabsRoot.selectNodes('/tabbar/tab');
		var index = 0;

		for (var j = 0; j < tabNds.length; j++) {
			var tab = tabNds[j];
			var typeName = tab.getAttribute('type_name');
			if (exclude.indexOf(typeName) >= 0) {
				continue;
			}
			if (tab.getAttribute('id') !== 'Parameters') {
				tmpTabbar[index] = {
					type_name: tab.getAttribute('type_name'),
					label: tab.getAttribute('label'),
					id: tab.getAttribute('id')
				};
				index++;
			}
		}

		tabbars[typesArray[i]] = tmpTabbar;
	}
}

function getIFrameSrc(tabID) {
	var db = aras.getDatabase();
	var where = QueryString('where').toString();
	var toolbar = QueryString('toolbar').toString();
	var editMode = isEditMode ? 1 : 0;
	var itemType = aras.getRelationshipType(tabID);
	if (!itemType) {
		return '../blank.html';
	}

	var RelationshipView = aras.uiGetRelationshipView4ItemTypeEx(itemType.node);
	var url = '';
	var parameters = '';

	if (RelationshipView) {
		url = aras.getItemProperty(RelationshipView, 'start_page');
		parameters = aras.getItemProperty(RelationshipView, 'parameters');
	}

	if (url === '') {
		url = aras.getScriptsURL() + 'relationshipsInfernoGrid.html';
	}

	if (parameters === '') {
		parameters =
			"'db='+db+'&ITName='+itemTypeName+'&itemID='+itemID+'&relTypeID='+tabID+'&editMode='+editMode+'&toolbar='+toolbar+'&where='+where";
	}

	var parametersRes = '';
	try {
		parametersRes = eval(parameters); // jshint ignore:line
	} catch (excep) {
		aras.AlertError(
			aras.getResource('', 'workflowrelships.params_arent_valid', parameters)
		);
		return '../blank.html';
	}

	LocationSearches[tabID] = parametersRes;
	return url;
}

function onTab(tabId) {
	if (!tabId) {
		return;
	}
	var iframeId = tabId;

	if (currIFrameId === iframeId && currentItemId === itemID) {
		return;
	}

	if (iframeId !== currIFrameId) {
		var prevIFrame = currIFrameId ? iframesCollection[currIFrameId] : null;
		if (prevIFrame) {
			prevIFrame.className = 'inactiveTab';

			if (prevIFrame.contentWindow.searchContainer) {
				prevIFrame.contentWindow.searchContainer.onEndSearchContainer();
			}
		}
	}

	var newIFrame = iframesCollection[iframeId];
	if (!newIFrame) {
		var iframeSrc = getIFrameSrc(tabId);
		newIFrame = document.createElement('iframe');
		newIFrame.setAttribute('id', tabId);
		newIFrame.setAttribute('src', iframeSrc);
		newIFrame.setAttribute('frameBorder', '0');
		newIFrame.setAttribute('width', '100%');
		newIFrame.setAttribute('height', '100%');
		newIFrame.setAttribute('scrolling', 'no');
		newIFrame.style.position = 'absolute';
		newIFrame.style.display = 'block';

		iframesCollection[iframeId] = newIFrame;
		// jscs:disable
		content_area.appendChild(newIFrame);
		// jscs:enable
	} else {
		newIFrame.className = 'activeTab';
		newIFrame.contentWindow.itemID = itemID;

		newIFrame.contentWindow.onInitialize();
		newIFrame.contentWindow.initItem();
		newIFrame.contentWindow.searchContainer.requiredProperties[
			'source_id'
		] = itemID;
	}

	if (newIFrame.contentWindow.searchContainer) {
		newIFrame.contentWindow.searchContainer.onStartSearchContainer();

		if (newIFrame.contentWindow.AUTO_SEARCH_FLAG) {
			// jscs:disable
			newIFrame.contentWindow.searchContainer.grid.grid_Experimental.autoHeight = true;
			// jscs:enable
			newIFrame.contentWindow.doSearch();
		}
	}

	currIFrameId = iframeId;
	currentItemId = itemID;
}

function initRelTabbar() {
	if (QueryString('tabbar').toString() == '1') {
		clientControlsFactory.createControl(
			'Aras.Client.Controls.Experimental.SimpleTabbar',
			{ region: 'center', style: 'width: 100%; height: 100%;' },
			function (control) {
				tabbar = tabbarApplet = control;
				clientControlsFactory.on(tabbarApplet, {
					onClick: onTab
				});
				showTabbar();
			}
		);
	}
}

function onRelTabbarLoaded(tb) {
	tabbar.clear();
	for (var i = 0; i < tb.length; i++) {
		tabbar.addTab(tb[i].id, tb[i].label);
	}
}

function showTabbar() {
	var tabId;
	var selectedTab = tabbarApplet.GetSelectedTab();
	initItem();
	if (tabbar === null) {
		return;
	} //func initRelTabbar isn't yet performed

	var tmpTabbar = tabbars[itemTypeName];
	if (tmpTabbar.length > 0) {
		tabId = tmpTabbar[0].id;
		if (selectedTab != tabId) {
			onRelTabbarLoaded(tmpTabbar);
		}

		tabbar.selectTab(tabId);
		onTab(tabId);
	}
}

function reload(queryStringData) {
	itemID = queryStringData.itemID;
	itemTypeName = queryStringData.ITName;
	initItem();
	initTabbar(tabbar, queryStringData);
}

function initTabbar(tabbar, queryString) {
	var tmpTabbar = tabbars[itemTypeName];
	var tabId = tmpTabbar[0].id;
	tabbar.selectTab(tabId);
	onTab(queryString.relTypeID);
}

// start
initIframesCollection();
initItem();
initializeTabbars([itemTypeName]);
