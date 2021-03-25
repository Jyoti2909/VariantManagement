var baseItemLeftTree;
var selectionRightTree; // Aras Tree instances
var djOn;
var djMainTreeItem;
var djQuery;
var djStyle; // Dojo constructors
var djUiSqlBridge; // Dojo instances
var arasObj;
var toolbar;
var NodeType = {
	Root: -1,
	Relationship: 0,
	ItemProperty: 1,
	ParentRelationship: 2,
	ParentItemProperty: 3,
	ListProperty: 6
};
var JoinRule = {
	Root: -1,
	Relationship: 0,
	ItemProperty: 1,
	ParentRelationship: 2,
	ParentItemProperty: 3,
	RelationshipTarget: 4,
	ParentRelationshipTarget: 5,
	ListProperty: 6
};
loadDojo();

jq$(document).ready(function () {
	const clientData = parseExtensionFromItem();
	//Client data could be empty during new Report creation
	if (clientData) {
		const rawSelectedItemTypes = clientData.SelectedItemTypes;
		clientReportSetData.metaData = clientData.InnovatorReportMetadata;
		clientReportSetData.ItemTypeMode = clientData.ItemTypeMode;
		var xmlDoc = ArasModules.xml.parseString(rawSelectedItemTypes);

		//If SelectedItemTypes is damaged we can edit properties,
		//name of report and other but can not add new propertis.
		//Also, report with damaged Extension is ok for view.
		if (ArasModules.xml.getError(xmlDoc).errorCode === 0) {
			clientReportSetData.SelectedItemTypes = Izenda.Utils.selectedItemTypeLocalization(
				xmlDoc.documentElement,
				getLocalizedLabelByItemId
			);
		}
	}

	var jqSwitchToStandard = jq$(
		format('#{0}_jtc_toStandard', reportDesignerContainerId())
	);
	if (jqSwitchToStandard.length) {
		if (getItemTypeMode() !== 'itm_advanced') {
			addInnovator();
		} else {
			addAllItemTypeModesStuff();
		}
	} else {
		switchToAdvanced();
	}
	// work with images: show image using its link
	var reportDiv = jq$(
		'#ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_Adhocreportdesigner1_Preview_ReportsDiv'
	)[0];
	// Create an observer instance
	// Necessary to watch when report html appears
	Izenda.Utils.createReportTableMutationObserver(reportDiv);
});

/**
 * Trying to parse extension field from report item to get raw ItemTypeMode,
 * InnovatorReportMetadata (metadata for tabsAggregator) and SelectedItemTypes.
 *
 * @returns {Object|null} return clientData if parsing of the extension is successfully
 */
function parseExtensionFromItem() {
	var ssrItem = window.parent.item;
	if (!ssrItem) {
		return;
	}

	var node = ArasModules.xml.selectSingleNode(ssrItem, 'extension');
	if (node) {
		var extension = ArasModules.xml.getText(node);
		if (extension) {
			return ArasModules.xmlToJson(extension).ReportSetExtension.ClientData;
		}
	}
}

function isEditUrl() {
	return location.href.toLowerCase().indexOf('rn=') > -1;
}

function getItemTypeMode() {
	var val = document.getElementById('item_type_mode').value;
	if (val) {
		return val;
	}
	return clientReportSetData.ItemTypeMode;
}

function addInnovator() {
	/// <summary>On JQ doc. ready</summary>
	document.body.classList.add('claro', 'aras-form');
	globalJoinsLengthCounter = 0;
	overrideIzendaMethods();
	Izenda.UI.Widgets.TabsAggregator.tabsContainerId = arasObj.Browser.isIe()
		? djQuery("div[name='showHideMeInIE6'").children('div')[0].id
		: reportDesignerContainerId() + '__MultiPage';

	toolbar = new Izenda.UI.Widgets.DesignerToolbar({
		isEdit: isEditUrl(),
		djUiSqlBridge: djUiSqlBridge
	});
	var tabsContainer = djQuery('.TabStrip')[0];
	var tabsContainerParent = tabsContainer.parentElement;
	tabsContainerParent.insertBefore(toolbar.domNode, tabsContainer); // both vars above are used only here
	toolbar.init();

	var tabsAggregator = Izenda.UI.Widgets.TabsAggregator;
	window['TabStrip_OnTabActivate'] = Izenda.Utils.extendMethodWithFuncs(
		window['TabStrip_OnTabActivate'],
		saveItemTypesSelection, // check if ItemTypes is udpated, before
		function (strControlName, strTabName, tabIndex, pause) {
			tabsAggregator.selectTab(tabIndex); // additions to tabs (idx of tab), after
		}
	);

	//We must listen this method because of when a user select some function (e.g. Count, Distinct count and etc.)
	//Izenda can programmatically change a value of other selects without firing an event.
	//So we would loose some changes without listening of this method.
	window['EBC_SetSelectedIndexByValue'] = Izenda.Utils.extendMethodWithFuncs(
		window['EBC_SetSelectedIndexByValue'],
		null,
		function () {
			Izenda.Utils.selectInputOnChange.bind(arguments[0])();
		}
	);

	window['SC_ShowPivot'] = Izenda.Utils.extendMethodWithFuncs(
		window['SC_ShowPivot'],
		null,
		function () {
			djQuery(
				'select[name="ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_ExtraColumn"]'
			).forEach(function (element) {
				Izenda.Utils.selectInputOnChange.bind(element)();
			});
			djQuery(
				'select[name="ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_ExtraValue"]'
			).forEach(function (element) {
				Izenda.Utils.selectInputOnChange.bind(element)();
				// Izenda clean ExtraValue rows using partial row copy deleting precessor and loosing onclick
				const innovatorSelectVisiblePlaceholder = element.parentNode.querySelector(
					'.sys_f_span_select'
				);
				if (
					innovatorSelectVisiblePlaceholder &&
					!innovatorSelectVisiblePlaceholder.onclick
				) {
					const extraSpan = djQuery(
						'select[name="ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_ExtraColumn"]'
					)[0].parentNode.querySelector('.sys_f_span_select');
					innovatorSelectVisiblePlaceholder.onclick = extraSpan.onclick;
				}
			});
		}
	);

	/*
	EBC_CallServer = Izenda.Utils.extendMethodWithFuncs(EBC_CallServer, null, function () {
		if (arguments[0] == "CombinedColumnList" && arguments[2] === true) {
			var pathParams = arguments[1].split("&");
			pathParams.forEach(function (param, idx) {
				var paramDictionary = param.split("=");
				if (paramDictionary[0] == "filterList") {
					setTimeout(function () {
						counter++;
						console.log("counter", counter);
						//Izenda.Utils.fireCustomEvent("allItemTypesLoaded");
					}, 1);
				}
			});
		}
	});*/

	window['SC_ShowProperties'] = Izenda.Utils.extendMethodWithFuncs(
		window['SC_ShowProperties'],
		null,
		function () {
			if (arguments[0]) {
				window['ebc_mozillaEvent'] = arguments[0];
			}
			var dialogRow = window['EBC_GetRow']();
			var propsTable = dialogRow['_' + 'table' + '\\' + 'PropertiesTable'];
			if (!propsTable) {
				// IE9
				propsTable = dialogRow.parentElement.parentElement;
			}
			var popupContent = (document.getElementById(
				'dijit_layout_ContentPane_1'
			).appendChild =
				"<table align='left' class='iz-table-properties'>" +
				propsTable.innerHTML +
				'</table>');
			var inputElements = [];
			for (var i = 0; i < propsTable.rows.length; i++) {
				var row = propsTable.rows[i];
				var input = djQuery('input', row)[0];
				if (input) {
					switch (input.type) {
						case 'text':
							input.setAttribute('old-value', input.value);
							inputElements.push(input);
							break;
						case 'checkbox':
							input.setAttribute('old-value', input.checked);
							inputElements.push(input);
							break;
					}
				}
				var textarea = djQuery('textarea', row)[0];
				if (textarea) {
					inputElements.push(textarea);
					textarea.setAttribute('old-value', textarea.textContent);
				}

				var select = djQuery('select', row)[0];
				if (select) {
					inputElements.push(select);
					select.setAttribute('old-value', select.value);
				}
			}

			var containerWithButtons = document.getElementsByClassName('footer')[0];
			if (djQuery('.cancel-btn', containerWithButtons).length > 0) {
				containerWithButtons.removeChild(containerWithButtons.lastChild);
			}
			containerWithButtons.firstChild.classList.add('btn');
			containerWithButtons.firstChild.style.backgroundColor = '';
			var cancelButton = document.createElement('input');
			cancelButton.type = 'button';
			cancelButton.value = 'Cancel';
			cancelButton.classList.add('cancel-btn');
			cancelButton.classList.add('btn');
			containerWithButtons.appendChild(cancelButton);
			/* jshint ignore:start */
			djOn(containerWithButtons, '.cancel-btn:click', function (e) {
				revertChanges(inputElements);
			});
			/* jshint ignore:end */

			var dialogContainerObject = document.getElementsByClassName(
				'container'
			)[0];
			Izenda.Utils.improveCheckboxes(
				dialogContainerObject,
				'input[type=checkbox]'
			);
			Izenda.Utils.improvePopupDialog('Property Settings', function () {
				revertChanges(inputElements);
			});

			function revertChanges(inputsArray) {
				for (var i = 0; i < inputsArray.length; i++) {
					var element = inputsArray[i];
					if (element.type === 'checkbox') {
						element.checked = !(
							element.getAttribute('old-value') === 'false' ||
							element.getAttribute('old-value') === ''
						);
					} else if (element.type === 'textarea') {
						element.textContent = element.getAttribute('old-value');
					} else {
						element.value = element.getAttribute('old-value');
					}
				}
				ReportingServices.hideTip();
			}
		}
	);

	tabsAggregator.metaData = getMetaDataForTabsAggregator();
	Izenda.Utils.clientUrl = getClientUrl();

	addInovatorStep2(tabsAggregator);
}

function addInovatorStep2(tabsAggregator) {
	// replace Izenda func "when all scripts are loaded", BUT BEFORE itemTypesTab init.
	window['EBC_GetRow'] = window['EBC_GetRow_'];

	// set flag if AllowNulls checkbox is changed
	function allowNullsCallback(event) {
		djUiSqlBridge.allowNullsDirty = true;
	}

	//create our Item Types tab with custom UI
	var itemTypesTab = new Izenda.UI.Tab.ItemTypes({
		name: 'ItemTypes',
		itemTypeMode: getItemTypeMode,
		continueToPropertiesFunc: continueToPropertiesCallback,
		allowNullsFunc: allowNullsCallback,
		isEditMode: isEditUrl,
		itemTypesRightTreeLoaded: djUiSqlBridge.rightSelected,
		clientUrl: Izenda.Utils.clientUrl,
		djUiSqlBridge: djUiSqlBridge,
		djMainTreeItem: djMainTreeItem
	});
	tabsAggregator.addTab(itemTypesTab);

	djStyle.set(djQuery('.layout')[0], 'display', 'block');

	tabsAggregator.createTabContainerIfNotExists('Properties');
	var propertiesTab = new Izenda.UI.Tab.Properties({
		name: 'Properties',
		rightPanelContentObj: jq$(
			'#Properties' + tabsAggregator.innovatorTabsPostfix
		)
			.parent()
			.children('table')
			.get(0),
		djUiSqlBridge: djUiSqlBridge,
		clientUrl: Izenda.Utils.clientUrl
	});
	tabsAggregator.addTab(propertiesTab);

	tabsAggregator.createTabContainerIfNotExists('Summary');
	var summaryTab = new Izenda.UI.Tab.Summary({
		name: 'Summary',
		rightPanelContentObj: jq$('#Summary' + tabsAggregator.innovatorTabsPostfix)
			.parent()
			.children('table')
			.get(0),
		djUiSqlBridge: djUiSqlBridge,
		clientUrl: Izenda.Utils.clientUrl
	});
	tabsAggregator.addTab(summaryTab);

	tabsAggregator.createTabContainerIfNotExists('Filters');
	var filtersTab = new Izenda.UI.Tab.Filters({
		name: 'Filters',
		rightPanelContentObj: jq$('#Filters' + tabsAggregator.innovatorTabsPostfix)
			.parent()
			.children('table')
			.get(0),
		djUiSqlBridge: djUiSqlBridge,
		clientUrl: Izenda.Utils.clientUrl
	});
	tabsAggregator.addTab(filtersTab);

	tabsAggregator.createTabContainerIfNotExists('Chart');
	var chartTab = new Izenda.UI.Tab.Chart({
		name: 'Chart',
		tabContent: jq$('#Chart' + tabsAggregator.innovatorTabsPostfix)
			.parent()
			.children('table')
			.get(0),
		djUiSqlBridge: djUiSqlBridge
	});
	tabsAggregator.addTab(chartTab);

	tabsAggregator.createTabContainerIfNotExists('Chart2');
	var chart2Tab = new Izenda.UI.Tab.Chart({
		name: 'Chart2',
		tabContent: jq$('#Chart2' + tabsAggregator.innovatorTabsPostfix)
			.parent()
			.children('table')
			.get(0),
		djUiSqlBridge: djUiSqlBridge
	});
	tabsAggregator.addTab(chart2Tab);

	tabsAggregator.createTabContainerIfNotExists('Gauge');
	var gaugeTab = new Izenda.UI.Tab.Gauge({
		name: 'Gauge',
		tabContent: jq$('#Gauge' + tabsAggregator.innovatorTabsPostfix)
			.parent()
			.children('table')
			.get(0),
		djUiSqlBridge: djUiSqlBridge
	});
	tabsAggregator.addTab(gaugeTab);

	tabsAggregator.createTabContainerIfNotExists('Misc');
	var miscTab = new Izenda.UI.Tab.Misc({
		arasObj: arasObj,
		clientUrl: Izenda.Utils.clientUrl,
		name: 'Misc',
		tabContent: jq$('#Misc' + tabsAggregator.innovatorTabsPostfix)
			.parent()
			.children('table')
			.get(0),
		djUiSqlBridge: djUiSqlBridge,
		isEditMode: isEditUrl
	});
	tabsAggregator.addTab(miscTab);

	tabsAggregator.createTabContainerIfNotExists('Style');
	var styleTab = new Izenda.UI.Tab.Style({
		arasObj: arasObj,
		clientUrl: Izenda.Utils.clientUrl,
		name: 'Style',
		tabContent: jq$('#Style' + tabsAggregator.innovatorTabsPostfix)
			.parent()
			.children('table')
			.get(0),
		djUiSqlBridge: djUiSqlBridge
	});
	tabsAggregator.addTab(styleTab);

	window.addEventListener('resize', function (event) {
		if (tabsAggregator.activeTab) {
			tabsAggregator.activeTab.onResize();
		}
	});

	itemTypesTab.onResize();
	propertiesTab.onResize();
	summaryTab.onResize();
	filtersTab.onResize();

	function continueToPropertiesCallback(event) {
		document.getElementById('continueBtn0').click();
		event.preventDefault(); // don't submit form
	}

	setupIzendaUi();

	addAllItemTypeModesStuff();
	djUiSqlBridge.fix2ndTableInJoins();
	if (isEditUrl()) {
		tabsAggregator.selectTab(1); //Set Properties tab
	} else {
		tabsAggregator.selectTab(0); //Set ItemTypes tab
	}
} // addInnovator

function addAllItemTypeModesStuff() {
	window.parent.registerCommandEventHandler(
		window,
		'beforeSaveItem',
		'before',
		'save',
		1 /*ExecuteUserCommandHandlerOptions.EvalWinHandler*/
	);
	window.parent.registerCommandEventHandler(
		window,
		'afterSaveItem',
		'after',
		'save',
		1
	);

	jq$(document).on(
		'change',
		format('#{0}_sc_Column', reportDesignerContainerId()),
		djUiSqlBridge.setDirty
	);

	// not sure we still need these 2 handlers
	jq$(format("img[name = '{0}_sc_RemoveBtn']", reportDesignerContainerId())).on(
		'click',
		djUiSqlBridge.setDirty
	);
	jq$(format("img[name = '{0}_sc_MoveBtn']", reportDesignerContainerId())).on(
		'mousedown',
		djUiSqlBridge.setDirty
	);

	window['SC_HideProperties'] = Izenda.Utils.extendMethodWithFuncs(
		window['SC_HideProperties'],
		null,
		djUiSqlBridge.setDirty
	);
}

function beforeSaveItem() {}

function switchToAdvanced() {
	var jqSwitchToAdvanced = jq$(
		format('#{0}_jtcs_toAdvanced', reportDesignerContainerId())
	);
	if (jqSwitchToAdvanced.length) {
		jqSwitchToAdvanced[0].click(); // makes postback
	}
}

var tabCaptions = [
	'item_types',
	'properties',
	'summary',
	'chart',
	'chart2',
	'gauge',
	'misc',
	'style',
	'filters',
	'preview'
];
function setupIzendaUi() {
	PopulateDocByLabels(null, null, '../Modules/aras.innovator.Izenda');
	for (var i = 0; i < tabCaptions.length; ++i) {
		jq$(format('.TabStrip td.MiddlePart:eq({0})', i)).text(
			Izenda.Utils.GetResource('reportdesigner.tab_caption.' + tabCaptions[i])
		);
	}
}

function saveItemTypesSelection(callback) {
	if (djUiSqlBridge.typesDirty || djUiSqlBridge.allowNullsDirty) {
		djUiSqlBridge.applyJoins(callback);
	}
}

function getMetaDataForTabsAggregator() {
	if (clientReportSetData.metaData) {
		var meta = JSON.parse(clientReportSetData.metaData);

		Object.keys(meta).forEach(function (tabName) {
			var tab = meta[tabName];
			if (tab) {
				meta[tabName] = localizePropertiesInTab(tab);
			}
		});

		return meta;
	}
}

function getLocalizedLabelByItemId(itemTypeId, defValue) {
	var item = arasObj.getItemTypeForClient(itemTypeId, 'id');
	var name = item.getProperty('name');
	var label = item.getProperty('label');
	return label || name || defValue || '';
}

function localizePropertiesInTab(tab) {
	Object.keys(tab).forEach(function (propName) {
		if (propName === 'breadcrumbs' || !tab[propName]) {
			return;
		}

		var itemTypeObject = tab[propName];
		var itemTypeName = itemTypeObject.itemTypeName;
		var property = itemTypeObject.name;

		if (!itemTypeName || !property) {
			return;
		}

		var item = arasObj.getItemTypeForClient(itemTypeName, 'name');
		var propItem = item.getItemsByXPath(
			'Relationships/Item[@type="Property" and name="' + property + '"]'
		);

		if (propItem.getItemCount() === 0) {
			return;
		}

		propItem = propItem.getItemByIndex(0);

		var itemLabel = item.getProperty('label') || item.getProperty('name');
		var propItemLabel =
			propItem.getProperty('label') || propItem.getProperty('name');

		itemTypeObject.itemTypeLabel = itemLabel;
		itemTypeObject.propertyLabel = propItemLabel;
	});
	return tab;
}

function loadDojo() {
	/// <summary>Must be called before jQuery doc. ready</summary>
	arasObj = TopWindowHelper.getMostTopWindowWithAras(window).aras;

	require([
		'dojo/on',
		'Izenda/Scripts/UiSqlBridge',
		'Aras/Client/Controls/Experimental/MainTreeItem',
		'dojo/query',
		'dojo/dom-style'
	], function (_on, _bridge, _item, query, style) {
		djOn = _on;
		djUiSqlBridge = new _bridge({
			containerId: reportDesignerContainerId(),
			arasObj: arasObj
		});
		djMainTreeItem = _item;
		djQuery = query;
		djStyle = style;
	});
}
