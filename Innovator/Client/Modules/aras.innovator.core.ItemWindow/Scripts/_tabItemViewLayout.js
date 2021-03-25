function getViewersTabs() {
	return dijit.byId('viewers');
}

function getDiscussionPanel() {
	return dijit.byId('discussion');
}

function getSidebar() {
	return dijit.byId('sidebar');
}

function getRightPlaceHolder() {
	return document.getElementById('rightSidebarContentPane');
}

function getViewManager() {
	return window.viewManager;
}

function getItem() {
	return item;
}

function setItem(value) {
	window.item = value;
	window.itemID = value.getAttribute('id');
}

function getIOMItem() {
	var iomItem = aras.newIOMItem();
	var itemNode = getItem();
	iomItem.dom = itemNode.ownerDocument;
	iomItem.node = itemNode;

	return iomItem;
}

function updateRootItem(itemNd, reloadRelationshipQueryString) {
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
		setEditMode(reloadRelationshipQueryString);
	} else {
		isEditMode = wasLocked;
		setViewMode();
	}

	if (window.frameElement) {
		const currentTabID = this.frameElement.id;
		const newTabID = aras.mainWindowName + '_' + itemID;

		if (currentTabID !== newTabID) {
			const tabsContainer = aras.getMainWindow().mainLayout.tabsContainer;
			const tabbar = tabsContainer.getTabbarByTabId(currentTabID);
			tabbar.updateTabInformation(currentTabID, newTabID);
		}
	}

	if (window.isSSVCEnabled) {
		dispatchCommandBarChangedEvent();
		loadSSVCData(window.cuiViewersTabsControl);
	}
}

function setEditMode(reloadRelationshipQueryString) {
	var prevMode = isEditMode;
	isEditMode = true;
	var formNd = aras.uiGetForm4ItemEx(item, 'edit');
	let fieldNds = [];
	if (formNd) {
		var bodyNd = formNd.selectSingleNode('Relationships/Item[@type="Body"]');
		fieldNds = bodyNd.selectNodes(
			'Relationships/Item[@type="Field" and (not(@action) or (@action!="delete" and @action!="purge"))]'
		);
	}

	var fieldsHash = [];
	var formFrame = document.getElementById('instance');

	if (formFrame) {
		var fieldNd;
		var fieldId;
		var setExpHandler;
		var i;

		for (i = 0; i < fieldNds.length; i++) {
			fieldNd = fieldNds[i];
			fieldId = fieldNd.getAttribute('id');
			setExpHandler =
				formFrame.contentWindow['expression_' + fieldId + '_setExpression'];

			if (setExpHandler) {
				setExpHandler(isEditMode);
			}
		}
	}
	var titleNode = document.getElementsByTagName('title');
	if (titleNode && titleNode[0]) {
		titleNode[0].innerHTML = aras.getResource(
			'',
			'ui_methods_ex.itemtype_label_item_keyed_name',
			itemTypeLabel,
			aras.getKeyedNameEx(item)
		);
	}

	if (isTearOff) {
		if (
			document.getElementById('tearoff_menu') &&
			document.getElementById('tearoff_menu').contentWindow.setEditMode
		) {
			document.getElementById('tearoff_menu').contentWindow.setEditMode();
		}
	}

	if (formFrame) {
		var addFormID = aras.uiGetFormID4ItemEx(item, 'add');
		var editFormID = aras.uiGetFormID4ItemEx(item, 'edit');
		var viewFormID = aras.uiGetFormID4ItemEx(item, 'view');
		var prevFormID = formFrame.contentWindow.document.formID;

		if (item.getAttribute('action') == 'add') {
			if (prevFormID != addFormID) {
				aras.uiShowItemInFrameEx(formFrame.contentWindow, item, 'add', 0);
			} else if (formFrame.contentWindow.document.forms.MainDataForm) {
				aras.uiPopulateFormWithItemEx(
					formFrame.contentWindow.document.forms.MainDataForm,
					item,
					itemType,
					true
				);
			}
		} else if (
			(prevMode != isEditMode && editFormID != viewFormID) ||
			editFormID != prevFormID ||
			!editFormID
		) {
			aras.uiShowItemInFrameEx(formFrame.contentWindow, item, 'edit', 0);
		} else if (
			formFrame.contentWindow.document.getElementById('MainDataForm')
		) {
			aras.uiPopulateFormWithItemEx(
				formFrame.contentWindow.document.forms.MainDataForm,
				item,
				itemType,
				true
			);
		}
	}

	const relationshipsControl = window.relationshipsControl;
	if (!relationshipsControl) {
		return;
	}

	if (
		reloadRelationshipQueryString &&
		relationshipsControl.relTabbar &&
		!relationshipsControl.relTabbar.isRelationshipTab() &&
		!relationshipsControl.relTabbar.isTgvTab()
	) {
		relationshipsControl.reload(reloadRelationshipQueryString);
	} else {
		relationshipsControl.setEditMode();
	}
}

function setViewMode() {
	var prevMode = isEditMode;
	isEditMode = false;
	var formNd = aras.uiGetForm4ItemEx(item, 'edit');
	let fieldNds = [];
	if (formNd) {
		var bodyNd = formNd.selectSingleNode('Relationships/Item[@type="Body"]');
		fieldNds = bodyNd.selectNodes(
			'Relationships/Item[@type="Field" and (not(@action) or (@action!="delete" and @action!="purge"))]'
		);
	}

	var fieldsHash = [];
	var formFrame = document.getElementById('instance');

	if (formFrame) {
		var fieldNd;
		var fieldId;
		var setExpHandler;
		var i;

		for (i = 0; i < fieldNds.length; i++) {
			fieldNd = fieldNds[i];
			fieldId = fieldNd.getAttribute('id');
			setExpHandler =
				formFrame.contentWindow['expression_' + fieldId + '_setExpression'];

			if (setExpHandler) {
				setExpHandler(isEditMode);
			}
		}
	}

	document.title = aras.getResource(
		'',
		'ui_methods_ex.itemtype_label_item_keyed_name_readonly',
		itemTypeLabel,
		aras.getKeyedNameEx(item)
	);

	if (isTearOff) {
		if (
			document.getElementById('tearoff_menu') &&
			document.getElementById('tearoff_menu').contentWindow.setViewMode
		) {
			document.getElementById('tearoff_menu').contentWindow.setViewMode();
		}
	}

	if (formFrame) {
		var editFormID = aras.uiGetFormID4ItemEx(item, 'edit');
		var viewFormID = aras.uiGetFormID4ItemEx(item, 'view');
		var prevFormID = formFrame.contentWindow.document.formID;

		if (
			(prevMode != isEditMode && editFormID != viewFormID) ||
			viewFormID != prevFormID ||
			!viewFormID
		) {
			aras.uiShowItemInFrameEx(formFrame.contentWindow, item, 'view', 0);
		} else if (formFrame.contentWindow.document.forms.MainDataForm) {
			aras.uiPopulateFormWithItemEx(
				formFrame.contentWindow.document.forms.MainDataForm,
				item,
				itemType,
				false
			);
		}
	}

	const relationshipsControl = window.relationshipsControl;
	if (relationshipsControl) {
		relationshipsControl.setViewMode();
	}
}

function turnWindowReadyOn() {
	//that script will set windowReady = true and cause menuUpdate
	window.windowReady = true;
	window.updateMenuState();
}

const createViewersTabs = () => {
	const viewersTabs = document.createElement('aras-viewers-tabs');
	const itemTypeColor = aras.getItemTypeColor(window.itemTypeName, 'name');
	viewersTabs.style.background = itemTypeColor;
	viewersTabs.classList.add('aras-item-view__viewers-tabs');
	viewersTabs.addEventListener('click', sidebarClickHandler);
	return viewersTabs;
};

const dispatchCommandBarChangedEvent = () => {
	const details = {
		locationName: 'ItemWindowSidebar',
		changeType: 'loaded'
	};
	dispatchEvent(document, 'commandBarChanged', details);
};

const getCuiObserver = () => {
	const layout = window.layout;
	return layout && layout.observer;
};

const getCuiOptions = () => {
	const layout = window.layout;
	const options = layout
		? layout.options
		: window.getDefaultOptions(window.itemID, window.itemTypeName);

	return {
		files: new Map(),
		...options,
		location: 'ItemWindowSidebar'
	};
};

const initCuiItemViewTabs = async (viewersTabs) => {
	const options = getCuiOptions();
	const location = options.location;
	const control = await window.cuiItemViewTabs(viewersTabs, location, options);
	return control;
};

const initViewersTabs = async () => {
	const viewersTabs = createViewersTabs();
	const control = await initCuiItemViewTabs(viewersTabs);
	const canBeInitializaed = verifyViewersTabsInitialization(viewersTabs);
	if (!canBeInitializaed) {
		dispatchSidebarLoadedEvent();
		return null;
	}

	const borderContainer = document.getElementById('BorderContainer');
	borderContainer.prepend(viewersTabs);

	window.cuiViewersTabsControl = control;
	window.sidebar = new SidebarWrapper(viewersTabs);
	const selectPromise = selectFirstTab(viewersTabs);
	registerCuiEventHandlers(control);
	dispatchCommandBarChangedEvent();
	const ssvcPromise = loadSSVCData(control);
	await Promise.all([selectPromise, ssvcPromise]);
	dispatchSidebarLoadedEvent();
	return viewersTabs;
};

let loadSSVCPromise = null;

const loadSSVCData = async (control) => {
	if (!window.isSSVCEnabled || !control || loadSSVCPromise) {
		return loadSSVCPromise;
	}

	const dataManager = new window.SSVCDataManager(window.aras);
	window.dataManager = dataManager;
	loadSSVCPromise = dataManager.updateDataForItem(window.item);
	try {
		await loadSSVCPromise;
	} catch (e) {
		aras.AlertError(e);
		return;
	}
	const options = getCuiOptions();
	const files = dataManager.getFilesForViewing();
	control.updateOptions({ ...options, files });

	const observer = getCuiObserver();
	observer.notify('UpdateSSVCFiles');
	await asyncLoadingSSVC(dataManager);
	loadSSVCPromise = null;
};

const registerCuiEventHandlers = (control) => {
	const observer = getCuiObserver();
	control.subscribeToLayoutObserver(observer);
};

const verifyViewersTabsInitialization = (viewersTabs) => {
	const tabsCount = viewersTabs.data.size;
	if (tabsCount < 2 && !window.isSSVCEnabled) {
		return false;
	}

	return true;
};

const openViewer = (viewersTabs, viewerId) => {
	const callback = function (viewerContainer) {
		const viewers = viewerContainer.getChildren();
		const viewer = viewers.find((viewer) => {
			const frame = viewer.viewerFrame;
			if (!frame) {
				return false;
			}

			const contentWindow = frame.contentWindow;
			return !contentWindow.SSVCViewer && !contentWindow.onViewerIsReady;
		});

		if (!viewer) {
			return;
		}

		const contentWindow = viewer.viewerFrame.contentWindow;
		contentWindow.onViewerIsReady = () => {
			const { fileUrl } = contentWindow.VC.Utils.Page.GetParams();
			contentWindow.SSVCViewer.displayFile(fileUrl);
		};
	};

	viewersTabs.selectTab(viewerId, callback);
};

function sidebarClickHandler(event) {
	const listItem = event.target.closest('.aras-list-item');
	if (!listItem) {
		return;
	}

	const viewerId = listItem.dataset.index;
	const tabContainer = getViewersTabs();
	openViewer(tabContainer, viewerId);
}

function createSplitters() {
	var ssvcSplitter = document.getElementById('ssvc-splitter');
	var formSplitter = document.getElementById('form-splitter');

	document.addEventListener('mouseup', function (e) {
		var ssvcDrag =
			ssvcSplitter &&
			ssvcSplitter.classList &&
			ssvcSplitter.classList.contains('aras-splitter_draggable');
		var formDrag =
			formSplitter &&
			formSplitter.classList &&
			formSplitter.classList.contains('aras-splitter_draggable');
		if (ssvcDrag || formDrag) {
			setTimeout(function () {
				var relationshipContainer = dijit.byId('centerMiddle');
				if (relationshipContainer) {
					relationshipContainer.resize();
					dispatchEvent(window, 'resize');
				}
				windowStateObject.resizeContainer.call(windowStateObject);
			}, 0);
		}
	});
}

const dispatchEvent = (target, name, details) => {
	const event = new CustomEvent(name);
	Object.assign(event, details);
	target.dispatchEvent(event);
};

// event is used in ui_methodsEx.Aras.prototype.RefillWindow and aras.innovator.SSVC\Scripts\Feed.js
function dispatchSidebarLoadedEvent() {
	dispatchEvent(document, 'loadSideBar');
}

async function selectFirstTab(viewersTabs) {
	const isSelected = await viewersTabs.selectTab('show_form');
	if (!isSelected) {
		await viewersTabs.selectTab(viewersTabs.tabs[0]);
	}
}

async function asyncLoadingSSVC(dataManager) {
	const rightPlaceHolder = getRightPlaceHolder();

	viewManager.clearContainers({
		tabContainer: getViewersTabs()
	});
	await viewManager.fillContainers({
		dataManager,
		discussionContainer: rightPlaceHolder,
		isSSVCEnabled: !!aras.getItemProperty(item, 'config_id', ''),
		aras: aras
	});

	const viewersTabs = getViewersTabs();
	const currentTabId = viewersTabs.getCurrentTabId();
	openViewer(viewersTabs, currentTabId);
}
