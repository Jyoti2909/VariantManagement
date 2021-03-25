// (c) Copyright by Aras Corporation, 2004-2013.

/*
 *   Aras Object used to expose the Client Side API for the Innovator Server.
 *
 */

/*
global Aras variables: to (set/get) these variables use aras.(set/get)Variable
TearOff
DEBUG
*/

var system_progressbar1_gif = '../images/Progress.gif';

/**
 * Constructor for the Aras object.
 * @constructor
 * @param {Aras} parent
 */
function Aras(parent) {
	if (parent) {
		this.parentArasObj = parent;
		for (var prop in parent) {
			if (
				prop != 'privateProperties' &&
				prop != 'parentArasObj' &&
				prop != 'modalDialogHelper' &&
				prop != 'shortcutsHelperFactory' &&
				prop != 'CriteriaConverter' &&
				!Aras.prototype[prop]
			) {
				this[prop] = parent[prop];
			}
		}
		this.IomInnovator = this.newIOMInnovator();
	} else {
		var innovatorWindow = window; // !!! wrong, but temporary work
		this.Enums = Enums;
		this.commonProperties = new ArasCommonProperties();
		this.SetupURLs(this._getStartURL());
		this.varsStorage = null;
		this.vault = null;
		this.itemsCache = new ClientCache(this);
		this.windowsByName = [];
		this.preferenceCategoryGuid = 'B0D45DA3B9CE4196A9FEB1D7AD3E4870';
		this.mainWindowName = innovatorWindow.name;
		if (!this.mainWindowName) {
			var d = new Date();
			innovatorWindow.name =
				'innovator_' +
				d.getHours() +
				'h' +
				d.getMinutes() +
				'm' +
				d.getSeconds() +
				's';
			this.mainWindowName = innovatorWindow.name;
		}
		this.maxNestedLevel = 3; //constant to prevent recurrsion of nested forms (zero based)
		this.newFieldIndex = 0; //variable used in formtool to generate new field name
		this.sGridsSetups = {};
		this.rels2gridXSL = {};
		this.clipboard = new Clipboard(this);
		this.VaultServerURLCache = {};
		this.translationXMLNsURI = 'http://www.aras.com/I18N';
		this.translationXMLNdPrefix = 'i18n';

		this.IomFactory = null;
		this.IomInnovator = null;
		this.MetadataCache = null;
		this.metadataCacheCategotries = {};
		this.metadataCacheCategotries.variables =
			'824E7AB9B52446e58E05FC47A7507B21';
		this.user = ArasCore.user;
		this.OAuthServerDiscovery = OAuthServerDiscovery;
		this.OAuthClient = OAuthClient;
		this.tabsTitles = {};
	}

	fileSystemAccess.init(parent || this);
	this.vault = new Vault(fileSystemAccess);
	this.utils = new Utils();
	this.modalDialogHelper = new ModalDialogHelper(this.getScriptsURL());
	this.privateProperties = new ArasPrivateProperties(this);
	this.controlsFactoryHelper = new ClientControlsFactoryHelper();
	this.shortcutsHelperFactory = new ShortcutsHelperFactory();
	this.exportToOfficeHelper = new ExportToOfficeHelper({
		aras: this
	});

	var critConverter;
	var self = this;
	Object.defineProperty(this, 'CriteriaConverter', {
		get: function () {
			if (!critConverter) {
				var clientUrl = new ClientUrlsUtility(
					self.commonProperties.BaseURL
				).getBaseUrlWithoutSalt();
				critConverter = new CriteriaConverter(clientUrl, self);
			}
			return critConverter;
		}
	});
}

/**
 * Object to store common for all Aras objects properties
 * @constructor
 */
function ArasCommonProperties() {
	this.formsCacheById = {};
	this.userDom = Aras.prototype.createXMLDocument();
	this.userDom.loadXML('<Empty/>');
	this.userID = '';
	this.loginName = '';
	this.password = '';
	this.database = '';
	this.identityList = '';
	this.scriptsURL = '';
	this.baseURL = '';
	this.serverBaseURL = '';
	this.oauthServerUrl = '';
	this.user_type = '';
	this.idsBeingProcessed = {};
	this.clientRevision = '';
	this.IsSSVCLicenseOk = false;
	this.userReportServiceBaseUrl = '';
	this.cmfCopyBuffer = null;
	this.validateXmlCache = [];
	this.criteriaConverterCache = {};
}

/**
 * Object to store private properties of each of Aras objects
 * @constructor
 * @param {Aras} owner
 */
function ArasPrivateProperties(owner) {
	this.soap = new SOAP(owner);
}

Aras.prototype.showColorDialog = function Aras_showColorDialog(oldColor) {
	var reg = new RegExp('^#?(([a-fA-F0-9]){3}){1,2}$');
	if (!reg.test(oldColor)) {
		oldColor = '#ffffff';
	}
	//summary: show ColorDalog.html as modal window and allows to choose the color
	var options = {
		dialogHeight: 212,
		dialogWidth: 560,
		oldColor: oldColor,
		aras: this,
		content: 'colorDialog.html'
	};

	return window.ArasModules.Dialog.show('iframe', options).promise;
};

Aras.prototype.getOpenedWindowsCount = function Aras_GetOpenedWindowsCount(
	closeAllDuringLooping
) {
	var winCount = 0;
	for (var wn in this.windowsByName) {
		var wnd = this.windowsByName[wn];
		if (typeof wnd == 'function') {
			continue;
		}

		if (this.isWindowClosed(wnd)) {
			this.deletePropertyFromObject(this.windowsByName, wn);
		} else {
			winCount++;
			if (closeAllDuringLooping) {
				wnd.logout_confirmed = true;
				wnd.close();
			}
		}
	}
	return winCount;
};

Aras.prototype.getCommonPropertyValue = function Aras_getCommonPropertyValue(
	propertyName,
	propertyDescription
) {
	return this.CommonPropertyValue('get', propertyName, propertyDescription);
};

Aras.prototype.setCommonPropertyValue = function Aras_setCommonPropertyValue(
	propertyName,
	propertyValue,
	propertyDescription
) {
	return this.CommonPropertyValue(
		'set',
		propertyName,
		propertyValue,
		propertyDescription
	);
};

Aras.prototype.CommonPropertyValue = function Aras_CommonPropertyValue(
	action,
	propertyName,
	propertyValue,
	propertyDescription
) {
	var res;
	if (action == 'get') {
		res = this.commonProperties[propertyName];
	} else {
		this.commonProperties[propertyName] = propertyValue;
	}

	return res;
};

/**
 * Adds id to a list of ids which are being processed in async operation.
 * Parameters are item id and operation description.
 * @param {string} id
 * @param {string} operationDescription
 */
Aras.prototype.addIdBeingProcessed = function Aras_addIdBeingProcessed(
	id,
	operationDescription
) {
	this.commonProperties.idsBeingProcessed[id] = operationDescription;
};

/**
 * Removes id from a list of ids which are being processed in async operation.
 * @param {string} id
 */
Aras.prototype.removeIdBeingProcessed = function Aras_removeIdBeingProcessed(
	id
) {
	this.deletePropertyFromObject(this.commonProperties.idsBeingProcessed, id);
};

/**
 * Checks if id is being processed in async operation.
 * @param {string} id
 * @returns {boolean}
 */
Aras.prototype.isIdBeingProcessed = function Aras_isIdBeingProcessed(id) {
	return this.commonProperties.idsBeingProcessed[id] !== undefined;
};

/**
 * User item representing the user logged in is a special item
 * and thus is stored in the separate DOM.
 * @returns {boolean|Object}
 */
Aras.prototype.getLoggedUserItem = function Aras_getLoggedUserItem() {
	var item = this.commonProperties.userDom.selectSingleNode(
		"Innovator/Item[@type='User']"
	);
	if (!item) {
		var res = this.getMainWindow().arasMainWindowInfo.getUserResult;
		if (res.getFaultCode() != 0) {
			if (this.DEBUG) {
				this.AlertError(
					this.getResource(
						'',
						'aras_object.fault_loading',
						typeName,
						res.getFaultCode()
					)
				);
			}
			return false;
		}

		var newItem = res.results.selectSingleNode(this.XPathResult('/Item'));
		if (!newItem) {
			this.AlertError(this.getResource('', 'aras_object.user_not_found'));
		} else {
			this.commonProperties.userDom.loadXML(
				'<Innovator>' + newItem.xml + '</Innovator>'
			);
			item = this.commonProperties.userDom.selectSingleNode(
				"Innovator/Item[@type='User']"
			);
		}
	}
	return item;
};

Aras.prototype.getIsAliasIdentityIDForLoggedUser = function Aras_getIsAliasIdentityIDForLoggedUser() {
	return this.user.identityId;
};

Aras.prototype.getLoginName = function Aras_getLoginName() {
	return this.user.loginName;
};

Aras.prototype.getAuthenticationType = function Aras_getAuthenticationType() {
	return this.user.authenticationType;
};

Aras.prototype.isLocalAuthenticationType = function Aras_isLocalAuthenticationType() {
	return this.getAuthenticationType() === 'local';
};

/**
 * @returns {"admin"|"user"} return "admin" if logged user has Administrators or SuperUser Identity
 * otherwise return "user"
 */
Aras.prototype.getUserType = function Aras_getUserType() {
	return this.user.type;
};

Aras.prototype.isAdminUser = function Aras_isAdminUser() {
	return this.getUserType() === 'admin';
};

Aras.prototype.setUserType = function Aras_setUserType(usertype) {
	this.commonProperties.user_type = usertype;
};

Aras.prototype.setLoginName = function Aras_setLoginName(loginName) {
	this.commonProperties.loginName = loginName;
};

Aras.prototype.getUserReportServiceBaseUrl = function Aras_getUserReportServiceBaseUrl() {
	return this.commonProperties.userReportServiceBaseUrl;
};

Aras.prototype.setUserReportServiceBaseUrl = function Aras_setUserReportServiceBaseUrl(
	url
) {
	this.commonProperties.userReportServiceBaseUrl = url;
};

Aras.prototype.SetupURLs = function Aras_SetupURLs(startURL, options) {
	options = options || {};

	startURL = startURL || this._getStartURL();

	const scriptsURL = startURL.replace(/(^.+scripts\/)(.+)/i, '$1');
	this.commonProperties.scriptsURL = scriptsURL;
	this.scriptsURL = scriptsURL;

	const baseURL = scriptsURL.replace(/\/scripts\/$|\/reports\/$/i, '');
	this.commonProperties.BaseURL = baseURL;

	this.commonProperties.serverBaseURL =
		options.serverBaseURL || baseURL.replace(/\/client(\/.*)?$/i, '/Server/');

	const clientBaseURL =
		new ClientUrlsUtility(baseURL).getBaseUrlWithoutSalt() + '/';
	this.commonProperties.innovatorBaseURL = clientBaseURL.replace(
		/\/client\/$/i,
		'/'
	);
};

Aras.prototype._getStartURL = function Aras_getStartURL() {
	const baseTags = document.getElementsByTagName('base');
	if (baseTags.length) {
		return baseTags[0].href;
	}

	return window.location.href;
};

Aras.prototype.getServerBaseURL = function Aras_getServerBaseURL() {
	return this.commonProperties.serverBaseURL;
};

Aras.prototype.getScriptsURL = function Aras_getScriptsURL(additionalPath) {
	var res = this._pathCombine(this.commonProperties.scriptsURL, additionalPath);
	return res;
};

Aras.prototype.getServerURL = function Aras_getServerURL() {
	var res =
		this.getCommonPropertyValue('serverBaseURL', 'Innovator server base URL') +
		'InnovatorServer.aspx';
	return res;
};

Aras.prototype.getBaseURL = function Aras_getBaseURL(additionalPath) {
	var res = this._pathCombine(this.commonProperties.BaseURL, additionalPath);
	return res;
};

Aras.prototype.getInnovatorUrl = function Aras_getInnovatorUrl() {
	return this.commonProperties.innovatorBaseURL;
};

Aras.prototype._pathCombine = function Aras_pathCombine() {
	if (!arguments || !arguments.length) {
		return;
	}
	if (
		arguments.length === 1 ||
		(arguments.length === 2 && arguments[1] === undefined)
	) {
		return arguments[0]; //minor optimization
	}
	var curr,
		prev = arguments[0],
		res = [];
	if (prev) {
		res.push(prev);
	}
	for (var i = 1; i < arguments.length; i++) {
		prev = arguments[i - 1];
		curr = arguments[i];
		if (!prev || !curr) {
			continue;
		}
		if (
			(prev.indexOf('/', prev.length - 1) > 0 && curr.substr(0, 1) === '/') ||
			(prev.indexOf('\\', prev.length - 1) > 0 && curr.substr(0, 1) === '\\')
		) {
			curr = curr.substr(1);
		}
		res.push(curr);
	}
	return res.join('');
};

/**
 * @param {string} resourceFileNm
 * @param {string} [parentUrl4XmlFolder]
 * @param {string} [resourceId]
 * @returns {string}
 */
Aras.prototype.getI18NXMLResource = function Aras_getI18NXMLResource(
	resourceFileNm,
	parentUrl4XmlFolder,
	resourceId
) {
	if (!resourceFileNm) {
		return '';
	}
	if (!parentUrl4XmlFolder) {
		parentUrl4XmlFolder = this.getBaseURL();
	}
	if (parentUrl4XmlFolder.substr(parentUrl4XmlFolder.length - 1, 1) != '/') {
		parentUrl4XmlFolder += '/';
	}
	var Cache = this.getCacheObject();
	var langCd = this.getIomSessionContext().GetLanguageCode();
	var fullLocalizedUrl =
		parentUrl4XmlFolder +
		'xml' +
		(langCd ? '.' + langCd : '') +
		'/' +
		resourceFileNm;
	var fullEnglishUrl = parentUrl4XmlFolder + 'xml' + '/' + resourceFileNm;
	if (resourceId === undefined) {
		resourceId = fullLocalizedUrl;
	}
	if (langCd == 'en') {
		return fullEnglishUrl;
	}
	if (Cache.XmlResourcesUrls[resourceId]) {
		return Cache.XmlResourcesUrls[resourceId];
	}

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('HEAD', fullLocalizedUrl, false);
	xmlhttp.send('');
	if (xmlhttp.status == 404 || xmlhttp.statusText == 'Not Found') {
		Cache.XmlResourcesUrls[resourceId] = fullEnglishUrl;
	} else {
		Cache.XmlResourcesUrls[resourceId] = fullLocalizedUrl;
	}

	return Cache.XmlResourcesUrls[resourceId];
};

Aras.prototype.getTopHelpUrl = function Aras_getTopHelpUrl() {
	var topHelpVariable = this.getItemFromServerByName(
		'Variable',
		'TopHelpUrl',
		'value'
	);
	var topHelpUrl;
	if (topHelpVariable) {
		topHelpUrl = topHelpVariable.getProperty('value');
	}
	if (!topHelpUrl) {
		topHelpUrl = this.getBaseURL() + '/WebHelp/';
	}

	return topHelpUrl;
};

Aras.prototype.getUserID = function Aras_getUserID() {
	return this.user.id;
};

Aras.prototype.setUserID = function Aras_setUserID(userID) {
	this.commonProperties.userID = userID;
};

Aras.prototype.getDatabase = function Aras_getDatabase() {
	return this.user.database;
};

Aras.prototype.setDatabase = function Aras_setDatabase(database) {
	this.commonProperties.database = database;
};

Aras.prototype.getIdentityList = function Aras_getIdentityList() {
	return this.commonProperties.identityList;
};

Aras.prototype.setIdentityList = function Aras_setIdentityList(identityList) {
	this.commonProperties.identityList = identityList;
};

Aras.prototype.setVarsStorage = function Aras_setVarsStorage(varsStorage) {
	this.varsStorage = new VarsStorageClass();
};

Aras.prototype.getSelectCriteria = function Aras_getSelectCriteria(
	itemTypeId,
	isForRelationshipsGrid,
	xProperties
) {
	if (!itemTypeId) {
		return '';
	}

	var currItemType = this.getItemTypeForClient(itemTypeId, 'id');
	if (!currItemType || currItemType.isError()) {
		return '';
	}

	currItemType = currItemType.node;
	var itTypeName = this.getItemProperty(currItemType, 'name');
	var isVersionable =
		this.getItemProperty(currItemType, 'is_versionable') == '1';
	var isRelationshipType =
		this.getItemProperty(currItemType, 'is_relationship') == '1';

	if (isForRelationshipsGrid == undefined) {
		isForRelationshipsGrid = false;
	}

	var key = this.MetadataCache.CreateCacheKey(
		'getSelectCriteria',
		itemTypeId,
		isForRelationshipsGrid
	);
	if (xProperties) {
		const self = this;

		const flatXPropertyIdList = (function getFlatXPropertyIdList(xProps) {
			return Object.keys(xProps).reduce(function (result, key) {
				if (key !== 'related') {
					return result.concat(
						xProps[key].map(function (xProp) {
							return self.getItemProperty(xProp, 'id');
						})
					);
				} else {
					return result.concat(getFlatXPropertyIdList(xProps.related));
				}
			}, []);
		})(xProperties);

		if (flatXPropertyIdList.length > 0) {
			const xPropKey = ArasModules.cryptohash.MD5(
				flatXPropertyIdList.sort().join(',')
			);
			key.push(xPropKey + '');
		}
	}
	if (isForRelationshipsGrid && isRelationshipType) {
		var relType = this.getRelationshipType(
			this.getRelationshipTypeId(itTypeName)
		);
		if (relType && !relType.isError()) {
			var related_id = relType.getProperty('related_id');
			if (related_id) {
				key.push(related_id);
			}
		}
	}

	var cachedResult = this.MetadataCache.GetItem(key);
	if (!cachedResult) {
		var selectAttr = '';

		var visiblePropsItms = currItemType.selectNodes(
			this.getVisiblePropertiesXPath(itTypeName, isForRelationshipsGrid)
		);
		for (var i = 0; i < visiblePropsItms.length; i++) {
			var propertyNd = visiblePropsItms[i];
			var propName = this.getItemProperty(propertyNd, 'name');
			if (selectAttr != '') {
				selectAttr += ',';
			}
			selectAttr += propName;
			if (this.getItemProperty(propertyNd, 'data_type') == 'foreign') {
				var dataSourceId = this.getItemProperty(propertyNd, 'data_source');
				var dataSourceItem = currItemType.selectSingleNode(
					'Relationships/Item[@type="Property" and @id="' + dataSourceId + '"]'
				);
				selectAttr += ',' + this.getItemProperty(dataSourceItem, 'name');
			}
		}

		if (selectAttr == '') {
			selectAttr = 'id';
		}

		selectAttr +=
			',config_id,created_by_id,created_on,modified_by_id,modified_on,locked_by_id,major_rev,css,current_state,keyed_name';

		if (isRelationshipType) {
			var relType = this.getRelationshipType(
				this.getRelationshipTypeId(itTypeName)
			);
			if (relType && !relType.isError()) {
				var relatedTypeId = relType.getProperty('related_id');
				if (relatedTypeId) {
					selectAttr +=
						',related_id(' +
						this.getSelectCriteria(
							relatedTypeId,
							isForRelationshipsGrid,
							xProperties ? xProperties.related : null
						) +
						')';
				}
			}
		}

		if (isVersionable) {
			selectAttr +=
				',new_version,generation,release_date,effective_date,is_current';
		}
		if (isRelationshipType) {
			selectAttr += ',source_id';
		}

		var hasThumbnail = currItemType.selectSingleNode(
			'Relationships/Item[@type="Property"]/name[text()="thumbnail"]'
		);
		if (hasThumbnail) {
			selectAttr += ',thumbnail';
		}

		if (xProperties) {
			xProperties[itemTypeId].forEach(function (xPropNode) {
				selectAttr += ',' + this.getItemProperty(xPropNode, 'name');
			}, this);
		}

		this.MetadataCache.SetItem(key, selectAttr);
		return selectAttr;
	} else {
		return cachedResult;
	}
};

Aras.prototype.getSearchMode = function Aras_getSearchMode(searchModeId) {
	return this.getSearchModes(searchModeId)[0];
};

/**
 * @param {string} searchModeId
 * @returns {Array} Array of all SearchMode items or with particular item if {searchModeId} was passed
 */
Aras.prototype.getSearchModes = function Aras_getSearchModes(searchModeId) {
	const searchModesResult = this.MetadataCache.GetSearchModes();

	if (searchModeId) {
		const foundNode = searchModesResult.selectSingleNode(
			'Item[@id="' + searchModeId + '"]'
		);
		return foundNode ? [foundNode] : [];
	}

	const itemNodesList = searchModesResult.selectNodes('Item');
	return Array.from(itemNodesList);
};

Aras.prototype.getUpdatedSavedSearchesXml = function Aras_getUpdatedSavedSearchesXml() {
	const specialID4SavedSearches_global = '56E808C94358462EAA90870A2B81AD96';
	const searchesCollection = this.MetadataCache.GetItemsById(
		specialID4SavedSearches_global
	);
	let savedSearchesXml = '';
	searchesCollection.forEach(function (savedSearch) {
		savedSearch = savedSearch.content;
		if (savedSearch && savedSearch.getAttribute('action')) {
			savedSearch.setAttribute('doGetItem', '0');
			savedSearchesXml += savedSearch.xml;
		}
	});

	return savedSearchesXml;
};

Aras.prototype.getSavedSearches = function Aras_getSavedSearches(
	itemTypeName,
	location,
	autoSavedOnly,
	savedSearchId2Return
) {
	var result = [];
	var specialID4SavedSearches_global = '56E808C94358462EAA90870A2B81AD96';
	var specialID4SavedSearches = this.getCommonPropertyValue(
		'SavedSearchesSpecialID_' + itemTypeName
	);
	if (!specialID4SavedSearches) {
		specialID4SavedSearches = calcMD5(
			'SavedSearchesSpecialID_' + itemTypeName
		).toUpperCase();
		this.setCommonPropertyValue(
			'SavedSearchesSpecialID_' + itemTypeName,
			specialID4SavedSearches
		);
	}
	var tmpArr;
	if (savedSearchId2Return) {
		tmpArr = this.MetadataCache.GetItemsById(savedSearchId2Return);
	} else {
		tmpArr = this.MetadataCache.GetItemsById(specialID4SavedSearches);
	}
	if (tmpArr.length < 1) {
		var qry = this.newIOMItem('SavedSearch', 'get');
		if (savedSearchId2Return) {
			qry.setAttribute('id', savedSearchId2Return);
		} else {
			if (location !== 'ProjectTree') {
				qry.setProperty('itname', itemTypeName);
			} else {
				qry.setProperty('location', 'ProjectTree');
				qry.setAttribute('orderBy', 'label');
			}
		}
		qry.setProperty('owned_by_id', this.getIdentityList());
		qry.setPropertyCondition('owned_by_id', 'in');
		var res = qry.apply();
		if (res.isEmpty()) {
			var key = this.MetadataCache.CreateCacheKey(
				'getSavedSearches',
				'Just A Stub When No Saved Searches',
				specialID4SavedSearches,
				specialID4SavedSearches_global
			);
			var cacheCont = this.IomFactory.CreateCacheableContainer('', '');
			this.MetadataCache.SetItem(key, cacheCont);
			return result;
		}

		if (res.isError()) {
			this.AlertError(res);
			return result;
		}
		var allSearches = this.getSearchModes();
		var items = res.getItemsByXPath(this.XPathResult('/Item'));
		var itemsCount = items.getItemCount();
		for (var i = 0; i < itemsCount; i++) {
			var itm = items.getItemByIndex(i);
			var key = this.MetadataCache.CreateCacheKey(
				'getSavedSearches',
				itm.getAttribute('id'),
				specialID4SavedSearches,
				specialID4SavedSearches_global
			);
			for (var j = 0; j < allSearches.length; j++) {
				key.push(allSearches[j].getAttribute('id'));
			}
			var cacheCont = this.IomFactory.CreateCacheableContainer(
				itm.node,
				itm.node
			);
			this.MetadataCache.SetItem(key, cacheCont);
		}
	}
	tmpArr = this.MetadataCache.GetItemsById(specialID4SavedSearches);
	for (var i = 0; i < tmpArr.length; i++) {
		var f1 = true;
		var f2 = true;
		var f3 = true;
		var f4 = true;
		var itm = tmpArr[i].content;
		if (itm) {
			if (
				itemTypeName &&
				this.getItemProperty(itm, 'itname') != itemTypeName &&
				itemTypeName !== 'ProjectTreeSalt_klj43'
			) {
				f1 = false;
			}

			if (location && this.getItemProperty(itm, 'location') != location) {
				f2 = false;
			}
			if (autoSavedOnly && this.getItemProperty(itm, 'auto_saved') != '1') {
				f3 = false;
			}
			if (
				savedSearchId2Return &&
				itm.getAttribute('id') != savedSearchId2Return
			) {
				f4 = false;
			}
			if (f1 && f2 && f3 && f4) {
				result.push(itm);
			}
		}
	}
	return result;
};

Aras.prototype.getVariable = function Aras_getVariable(varName) {
	try {
		if (!this.varsStorage) {
			return '';
		}

		return this.varsStorage.getVariable(varName);
	} catch (excep) {
		return '';
	}
};

Aras.prototype.resetUserPreferences = function Aras_resetUserPreferences() {
	this.MetadataCache.RemoveById(this.preferenceCategoryGuid);
	this.varsStorage = new VarsStorageClass();
};

Aras.prototype.setVariable = function Aras_setVariable(varName, varValue) {
	if (!this.varsStorage) {
		return 1;
	}

	try {
		if (this.getVariable(varName) != varValue) {
			var pp = this.varsStorage.setVariable(varName, varValue);

			params = {};
			params.varName = varName;
			params.varValue = varValue;
			this.fireEvent('VariableChanged', params);
		}
	} catch (excep) {
		return 2;
	}

	return 0;
};

Aras.prototype.removeVariable = function Aras_removeVariable(varName) {
	if (!this.varsStorage) {
		return 2;
	}

	return this.setVariable(varName, null);
};

/**
 * @param {string} nameForNewWindow
 * @param {string} [url] location of new document if window with nameForNewWindow hasn't defined. Created for IR-008617 "One Window (Main) Service report gives Access Denied"
 * @returns {Window}
 */
Aras.prototype.getActionTargetWindow = function Aras_getActionTargetWindow(
	nameForNewWindow,
	url
) {
	var win = this.commonProperties.actionTargetWindow;

	if (win) {
		try {
			//IR-007415 "Status Bar/Indicator never ceases"
			//Check win.document to avoid access denied error
			if (!this.isWindowClosed(win) && win.document) {
				win = win;
			} else {
				win = null;
			}
		} catch (excep) {
			win = null;
		}
	}

	if (!win) {
		var width = 710; // This is a printable page width.
		var height = screen.availHeight / 2;
		var x = (screen.availHeight - height) / 2;
		var y = (screen.availWidth - width) / 2;
		var args =
			'scrollbars=yes,resizable=yes,status,width=' +
			width +
			',height=' +
			height +
			',left=' +
			y +
			',top=' +
			x;
		var loc = url != undefined ? url : this.getScriptsURL() + 'blank.html';
		win = window.open(loc, '', args);
		win.document.title = nameForNewWindow;

		this.setActionTargetWindow(win);
	}

	return win;
};

Aras.prototype.setActionTargetWindow = function Aras_setActionTargetWindow(
	win
) {
	this.commonProperties.actionTargetWindow = win;
};

Aras.prototype._selectStatusBar = function Aras_selectStatusBar(
	status,
	statusbar
) {
	try {
		if (!statusbar) {
			statusbar = function () {
				const topWnd = this.getMostTopWindowWithAras(window);
				if (topWnd.statusbar) {
					return topWnd.statusbar;
				}

				if (topWnd.document.frames && topWnd.document.frames['statusbar']) {
					const statusbar = topWnd.document.frames['statusbar'];
					return statusbar;
				}
				const iframes = document.getElementsByTagName('iframe');
				let tmpFrames;
				for (let i = 0; i < iframes.length; i++) {
					tmpFrames =
						iframes[i] && iframes[i].contentWindow
							? iframes[i].contentWindow.document.frames
							: null;
					if (tmpFrames && tmpFrames['statusbar']) {
						return tmpFrames['statusbar'];
					}
				}
			}.call(this);
		}

		if (statusbar) {
			if (
				statusbar.declaredClass ===
				'Aras.Client.Controls.Experimental.StatusBar'
			) {
				return status && !!statusbar.listBar[status] ? statusbar : false;
			} else if (statusbar.declaredClass === 'Aras.Client.Frames.StatusBar') {
				return status && statusbar.containsStatusBarCell(status)
					? statusbar
					: false;
			} else {
				return false;
			}
		}

		return false;
	} catch (excep) {
		return false;
	}
};

Aras.prototype.showStatusMessage = function Aras_showStatusMessage(
	id,
	text,
	imgURL,
	imgPosition
) {
	const statusbar = this._selectStatusBar(id);
	if (statusbar) {
		return statusbar.setStatus(id, text, imgURL, imgPosition);
	}
	return false;
};

Aras.prototype.clearStatusMessage = function Aras_clearStatusMessage(
	messageID
) {
	const statusbar = this._selectStatusBar(messageID);
	if (statusbar) {
		return statusbar.clearStatus(messageID);
	}
	return false;
};

Aras.prototype.setDefaultMessage = function Aras_setDefaultMessage(
	id,
	infoOrText,
	imgURL
) {
	var info;
	if (imgURL != undefined) {
		info = {};
		info.text = infoOrText;
		info.imgURL = imgURL;
	} else {
		info = infoOrText;
	}

	const statusbar = this._selectStatusBar(id);
	if (this.getMostTopWindowWithAras(window).isTearOff && statusbar) {
		return statusbar.setDefaultMessage(id, info);
	}
	return false;
};

Aras.prototype.setStatus = function Aras_setStatus(text, image) {
	return this.showStatusMessage('status', text, image);
};

Aras.prototype.setStatusEx = function Aras_setStatusEx(text, id, image) {
	return this.showStatusMessage(id, text, image);
};

/**
 * Method to set the clear status bar value.
 */
Aras.prototype.clearStatus = function ArasObject_clearStatus(statID) {
	return this.clearStatusMessage(statID);
};

/**
 * Returns set of "header name" -> "header value" pairs. The headers are used to send request to server.
 * @param {string} [soapAction]
 * @returns {Object} set of "header name" -> "header value" pairs. The headers are used to send request to server.
 */
Aras.prototype.getHttpHeadersForSoapMessage = function Aras_getHttpHeadersForSoapMessage(
	soapAction
) {
	const res = {};
	if (soapAction) {
		res['SOAPAction'] = soapAction;
	}

	//+++ setup HTTP_LOCALE and HTTP_TIMEZONE_NAME headers
	res['LOCALE'] = this.getCommonPropertyValue('systemInfo_CurrentLocale');
	res['TIMEZONE_NAME'] = this.getCommonPropertyValue(
		'systemInfo_CurrentTimeZoneName'
	);
	//--- setup HTTP_LOCALE and HTTP_TIMEZONE_NAME headers

	Object.assign(res, this.OAuthClient.getAuthorizationHeader());

	return res;
};

Aras.prototype.soapSend = function Aras_soapSend(
	methodName,
	xmlBody,
	url,
	saveChanges,
	soapController
) {
	return this.privateProperties.soap.send(
		methodName,
		xmlBody,
		url,
		saveChanges,
		soapController
	);
};

/*
 * For internal use only
 */
Aras.prototype.getEmptySoapResult = function Aras_getEmptySoapResult() {
	return new SOAPResults(this, '');
};

/**
 * Returns login name to communicate with Server (logged user login name)
 * @returns {string} login name of current user
 */
Aras.prototype.getCurrentLoginName = function Aras_getCurrentLoginName() {
	return this.getLoginName();
};

/**
 * Returns User id to communicate with Server (logged user id)
 * @returns {string} User ID
 */
Aras.prototype.getCurrentUserID = function Aras_getCurrentUserID() {
	return this.getUserID();
};

Aras.prototype.login = function Aras_login() {
	this.setVarsStorage();
	return this.user.login();
};

/**
 * Method to logoff the Innovator Server and close the session.
 */
Aras.prototype.logout = function () {
	let asyncLogoffRequestResult;
	this.setCommonPropertyValue('ignoreSessionTimeoutInSoapSend', true);

	if (this.getUserID()) {
		const logoutItemRequestXml =
			'' +
			'<Item type="Method" action="LogOff">' +
			this.getUnlockEditStateItemsXml() +
			this.getUpdatedSavedSearchesXml() +
			this.getUpdatedPreferenceItemsXml() +
			'</Item>';
		if (this.Browser.isKeepaliveOptionSupported()) {
			const isContentSizeLessThan64Kb =
				new Blob([logoutItemRequestXml]).size < 1024 * 64;
			const isBrowserChromeWithVersionLessThan81 =
				this.Browser.isCh() && this.Browser.getMajorVersionNumber() < 81;
			asyncLogoffRequestResult = window.fetch(this.getServerURL(), {
				headers: this.getHttpHeadersForSoapMessage('ApplyMethod'),
				credentials: 'include',
				body: logoutItemRequestXml,
				// Chrome does not support fetch requests with "keepalive" option if any header exists until v81:
				// https://bugs.chromium.org/p/chromium/issues/detail?id=835821
				// Also accordiong to fetch specification(https://fetch.spec.whatwg.org/) browsers should
				// throw error on fetch request with keepalive option when body size is larger than 64kb,
				// so in case when there was a lot of preferences and auto saved search changes
				// request size becomes larger than 64kb and request fails.
				// As a hot fix for I-011663 keepalive is set to false on large requests in order to avoid
				// errors but it is required to minify request size in future and get rid of this fix
				keepalive:
					!isBrowserChromeWithVersionLessThan81 && isContentSizeLessThan64Kb,
				method: 'POST',
				mode: 'cors'
			});
		} else {
			this.soapSend('ApplyMethod', logoutItemRequestXml);
		}

		this.commonProperties.userID = null;
		this.commonProperties.login;
		this.commonProperties.loginName = '';
		this.commonProperties.password = '';
		this.commonProperties.database = '';
		this.commonProperties.identityList = '';
	}
	this.setCommonPropertyValue('ignoreSessionTimeoutInSoapSend', undefined);

	return asyncLogoffRequestResult || Promise.resolve();
};

Aras.prototype.getVisiblePropertiesXPath = function Aras_getVisiblePropertiesXPath(
	itemTypeName,
	getForRelshipGrid
) {
	var xpath;
	var isHidden = 'is_hidden' + (getForRelshipGrid ? '2' : '');
	if (this.isAdminUser() && itemTypeName == 'ItemType') {
		xpath =
			'Relationships/Item[@type="Property" and (not(' +
			isHidden +
			') or ' +
			isHidden +
			'="0" or name="label")]';
	} else {
		xpath =
			'Relationships/Item[@type="Property" and (not(' +
			isHidden +
			') or ' +
			isHidden +
			'="0")]';
	}

	return xpath;
};

Aras.prototype.XPathResult = function Aras_XPathResult(str) {
	var path = '//Result';
	if (str == undefined) {
		return path;
	}
	if (!str) {
		return path;
	}
	if (str == '') {
		return path;
	}
	return path + str;
};

Aras.prototype.XPathFault = function Aras_XPathResult(str) {
	var path = SoapConstants.EnvelopeBodyFaultXPath;
	if (str == undefined) {
		return path;
	}
	if (!str) {
		return path;
	}
	if (str == '') {
		return path;
	}
	return path + str;
};

Aras.prototype.XPathMessage = function Aras_XPathMessage(str) {
	var path = '//Message';
	if (str == undefined) {
		return path;
	}
	if (!str) {
		return path;
	}
	if (str == '') {
		return path;
	}
	return path + str;
};

/**
 * Check if xmldom (soap message) contains Message
 * @param {Object} xmlDom xml document with soap message
 */
Aras.prototype.hasMessage = function Aras_hasMessage(xmlDom) {
	return xmlDom.selectSingleNode(this.XPathMessage()) != null;
};

/**
 * @param {Object} xmlDom xml document with soap message
 */
Aras.prototype.getMessageNode = function Aras_getMessageNode(xmlDom) {
	return xmlDom.selectSingleNode(this.XPathMessage());
};

/**
 * Method to generate a new ID by getting it from the server
 * @returns {string}
 */
Aras.prototype.generateNewGUID = function Aras_generateNewGUID() {
	return this.IomInnovator.getNewID();
};

/**
 * Method to test ID value to be temporary.
 *
 * @param {string} id ID to test.
 * @returns {boolean} is ID temporary.
 */
Aras.prototype.isTempID = function Aras_isTempID(id) {
	if (id.substring(0, 6) === 'ms__id') {
		return true;
	} else {
		var item = this.itemsCache.getItem(id);
		if (!item) {
			return false;
		}
		return item.getAttribute('isTemp') === '1';
	}
};

/**
 * Method to transform a dom using the XSLT style sheet passed as string.
 */
Aras.prototype.applyXsltString = function (domObj, xslStr) {
	var xsl = this.createXMLDocument();
	xsl.loadXML(xslStr);
	return domObj.transformNode(xsl);
};

/**
 * Method to transform a dom using the XSLT style sheet passed as a URL.
 */
Aras.prototype.applyXsltFile = function (domObj, xslFile) {
	var xsl = this.createXMLDocument();
	var xmlhttp = this.XmlHttpRequestManager.CreateRequest();
	xmlhttp.open('GET', xslFile, false);
	xmlhttp.send(null);
	xsl.loadXML(xmlhttp.responseText);
	return domObj.transformNode(xsl);
};

/**
 * Method to evaluate the JavaScript code in the Aras object space.
 */
Aras.prototype.evalJavaScript = function Aras_evalJavaScript(jsCode) {
	eval('with(this){' + jsCode + '}');
};

/**
 * Method to print the frame
 * @param {Object} frame the frame object
 */
Aras.prototype.printFrame = function Aras_printFrame(frame) {
	frame.focus();
	frame.print();
};

/**
 * Method to evaluate JavaScript stored as a Method item on the client side.
 * @param {string|Object} methodNameOrNd the name or id of the Method item or Method Node
 * @param {Object} XMLinput inDom or XML string that is loaded into the _top.inDom
 * @param {Object} inArgs arguments for method(can not be changed the object in evalMethod)
 */
Aras.prototype.evalMethod = function Aras_evalMethod(
	methodNameOrNd,
	XMLinput,
	inArgs
) {
	var isXmlNode = typeof XMLinput === 'object' ? true : false;
	var methodNd, methodName;
	if (typeof methodNameOrNd === 'object') {
		methodName = this.getItemProperty(methodNameOrNd, 'name');
		methodNd = methodNameOrNd;
	} else {
		methodName = methodNameOrNd;
		var propNames;
		if (/^[0-9a-f]{32}$/i.test(methodName)) {
			propNames = ['id', 'name'];
		} else {
			propNames = ['name', 'id'];
		}
		for (var i in propNames) {
			methodNd = this.MetadataCache.GetClientMethodNd(methodName, propNames[i]);
			if (methodNd) {
				break;
			}
		}
	}

	if (!methodNd) {
		this.AlertError(
			this.getResource('', 'aras_object.error_in_evalmethod', methodName),
			'',
			''
		);
		return;
	}

	var methodCode = this.getItemProperty(methodNd, 'method_code');
	var methodNameUpper = methodName.toUpperCase();
	if ('ONCREATENEWPROJECT' === methodNameUpper) {
		var mixedFlag = '/* METHOD WAS MIXED DYNAMICALLY BY ARAS OBJECT */\n\n\n\n',
			oldSubString = 'var callbacks = {',
			newSubString =
				'var callbacks = {\n' +
				'onload: function (dialog) {\n' +
				'	var windowToFocus = dialog.content.contentWindow;\n' +
				'	aras.browserHelper.setFocus(windowToFocus);\n' +
				'},';

		if (-1 === methodCode.indexOf(mixedFlag)) {
			methodCode = mixedFlag + methodCode.replace(oldSubString, newSubString);
			methodCode = mixedFlag + methodCode.replace(/\btop.aras\b/g, 'aras');
		}
	} else {
		var methodNamesWithTopAras = [
			'AFTERPROJECTUPDATECLIENT',
			'PM_CALL_SERVER_SIDE_SCHEDULE',
			'PROJECT_CREATEPROJFROMTEMPLATE',
			'PROJECT_CREATEPROJECTFROMPROJECT',
			'PROJECT_CREATETEMPLATEFROMPROJ',
			'PROJECT_CREATETEMPLATEFROMTEMPL',
			'PROJECT_SHOWGANTTCHART'
		];
		if (methodNamesWithTopAras.indexOf(methodNameUpper) !== -1) {
			methodCode = methodCode.replace(/\btop.aras\b/g, 'aras');
		}
	}

	var inDom;
	if (isXmlNode) {
		inDom = XMLinput.ownerDocument;
	} else {
		inDom = this.createXMLDocument();
		inDom.loadXML(XMLinput);
	}
	var self = this;

	function evalMethod_work() {
		var item = self.newIOMItem();
		var itemNode;

		item.dom = inDom;

		if (isXmlNode) {
			itemNode = XMLinput;
		} else {
			itemNode = item.dom.selectSingleNode('//Item');
		}

		if (itemNode) {
			item.node = itemNode;
		} else {
			item.node = undefined;
		}

		item.setThisMethodImplementation(new Function('inDom, inArgs', methodCode));

		return item.thisMethod(item.node, inArgs);
	}

	MethodCompatibilityMode(
		this.commonProperties.serverVersion,
		this.commonProperties.clientRevision,
		this
	);
	if (!this.DEBUG) {
		try {
			return evalMethod_work();
		} catch (excep) {
			this.AlertError(
				this.getResource('', 'aras_object.method_failed', methodName),
				this.getResource(
					'',
					'aras_object.aras_object',
					excep.number,
					excep.description || excep.message
				),
				this.getResource('', 'common.client_side_err')
			);
			return;
		}
	} else {
		return evalMethod_work();
	}
};

/**
 * AlertError
 * @param {string} errorMessage client-facing error message
 * @param {string} technicalErrorMessage the technical error message
 * @param {string} stackTrace the stack trace
 * @param {Object} options the object with settings
 */
Aras.prototype.AlertError = function Aras_AlertError(
	errorMessage,
	technicalErrorMessage,
	stackTrace,
	options
) {
	var winOptions = options && options.window ? options.window : null;
	var win = this.getMostTopWindowWithAras(winOptions || window);

	if (errorMessage && typeof errorMessage !== 'string') {
		if (
			errorMessage.getFaultCode &&
			errorMessage.getFaultCode() ===
				'SOAP-ENV:Server.Authentication.SessionTimeout'
		) {
			// To avoid multiple alerts with the same SessionTimeout error we just return resolved promise.
			// Dialog for handling this error will be shown from SOAP.handleSessionTimeout called by
			// sessionSoap module on SessionTimeout errors.
			return Promise.resolve();
		}
		if (SOAPResults.prototype.isPrototypeOf(errorMessage)) {
			return win.ArasModules.Dialog.alert('', {
				type: 'soap',
				data: errorMessage
			});
		} else if (errorMessage.isError) {
			return win.ArasModules.Dialog.alert('', {
				type: 'iom',
				data: errorMessage
			});
		}
	}

	if (
		(typeof technicalErrorMessage === 'string' &&
			technicalErrorMessage.length > 0) ||
		(typeof stackTrace === 'string' && stackTrace.length > 0)
	) {
		return win.ArasModules.Dialog.alert(errorMessage, {
			type: 'stack',
			technicalMessage: technicalErrorMessage,
			stackTrace: stackTrace
		});
	}

	return win.ArasModules.Dialog.alert(errorMessage, {
		type: 'error'
	});
};

Aras.prototype.AlertSuccess = function Aras_AlertSuccess(msg, argwin) {
	if (
		this.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_successmessage_type'
		) === 'Dialog'
	) {
		ArasModules.Dialog.alert(msg, {
			type: 'success'
		});
	} else {
		var timeClose = parseInt(
			this.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_popupmessage_timeout'
			)
		);
		const notify = this.getNotifyByContext(window);
		notify(msg, {
			timeout: timeClose || 5000,
			type: 'success'
		});
	}
};

Aras.prototype.AlertWarning = function Aras_AlertSuccess(msg) {
	ArasModules.Dialog.alert(msg, {
		type: 'warning'
	});
};

Aras.prototype.AlertAboutSession = function Aras_AlertAboutSession() {
	var formNd = this.getItemByName('Form', 'MySession', 0);
	if (formNd) {
		var width = this.getItemProperty(formNd, 'width') || 500;
		var height = this.getItemProperty(formNd, 'height') || 320;
		var param = {
			title: 'About My Session',
			formId: formNd.getAttribute('id'),
			aras: this,
			dialogWidth: width,
			dialogHeight: height,
			content: 'ShowFormAsADialog.html'
		};
		var win = this.getMostTopWindowWithAras(window);
		(win.main || win).ArasModules.Dialog.show('iframe', param);
	}
};

Aras.prototype.AlertAbout = function Aras_AlertAbout() {
	ArasCore.Dialogs.about(aras.aboutData);
};

Aras.prototype.AlertInternal_1 = function Aras_AlertInternal_1(argwin) {
	var win = window;
	if (argwin && !this.isWindowClosed(argwin)) {
		win = argwin;
	}

	var doc = null;
	try {
		doc = win.document;
	} catch (excep) {}

	var actEl = null;
	if (doc) {
		actEl = doc.activeElement;
	}

	if (actEl && actEl.tagName == 'FRAMESET') {
		var frms = doc.getElementsByTagName('FRAME');
		if (frms.length > 0) {
			actEl = frms[0];
		}
	}

	try {
		if (actEl) {
			actEl.focus();
		}
	} catch (excep) {}
	try {
		win.focus();
	} catch (excep) {}

	return win;
};

/**
 * Displays a confirmation dialog box which contains a message and OK and Cancel buttons.
 * @param {string} message Message to display in a dialog.
 * @param {Window} ownerWindow parent window for the dialog.
 * @returns {boolean} true - if a user clicked the OK button. false - if a user clicked Cancel button.
 */
Aras.prototype.confirm = function Aras_confirm(message, ownerWindow) {
	return window.confirm(message);
};

Aras.prototype.prompt = function Aras_prompt(label, defaultValue, argwin) {
	if (this.getCommonPropertyValue('exitWithoutSavingInProgress')) {
		return;
	}

	const topWnd = this.getMostTopWindowWithAras(argwin || window);
	return topWnd.ArasModules.Dialog.prompt(label, { defaultValue });
};

/**
 * Method to evaluate JavaScript stored as a Method item on the client side.
 * @param {string} methodName the name of the Method item
 * @param {Object} itemDom the item dom
 * @param {Object} [addArgs] Object with any additional parameters.
 */
Aras.prototype.evalItemMethod = function Aras_evalItemMethod(
	methodName,
	itemNode,
	addArgs
) {
	var methodNd = this.MetadataCache.GetClientMethodNd(methodName, 'name');
	if (!methodNd) {
		this.AlertError(
			this.getResource('', 'aras_object.erroe_eval_item_method', methodName),
			'',
			''
		);
		return;
	}

	var methodCode = this.getItemProperty(methodNd, 'method_code'),
		methodNameUpper = methodName.toUpperCase();

	var methodNamesWithTopAras = [
		'AFTERPROJECTUPDATECLIENT',
		'PM_CALL_SERVER_SIDE_SCHEDULE',
		'PROJECT_CREATEPROJFROMTEMPLATE',
		'PROJECT_CREATEPROJECTFROMPROJECT',
		'PROJECT_CREATETEMPLATEFROMPROJ',
		'PROJECT_CREATETEMPLATEFROMTEMPL',
		'PROJECT_SHOWGANTTCHART',
		'PROJECT_CFGSEARCHDIALOG4ASSGNMTS',
		'PROJECTTIMEREPORT'
	];
	if (methodNamesWithTopAras.indexOf(methodNameUpper) !== -1) {
		methodCode = methodCode.replace(/\btop.aras\b/g, 'aras');
		var methodNamesWithTop = ['PROJECT_CFGSEARCHDIALOG4ASSGNMTS'];
		if (methodNamesWithTop.indexOf(methodNameUpper)) {
			methodCode = methodCode.replace(
				/\btop\b/g,
				'aras.getMostTopWindowWithAras(window)'
			);
		}
	}

	var self = this;

	function evalItemMethod_work() {
		var item = self.newIOMItem();
		if (itemNode) {
			item.dom = itemNode.ownerDocument;
			item.node = itemNode;
		}
		item.setThisMethodImplementation(
			new Function('inDom', 'inArgs', methodCode)
		);

		return item.thisMethod(item.node, addArgs);
	}

	MethodCompatibilityMode(
		this.commonProperties.serverVersion,
		this.commonProperties.clientRevision,
		this
	);
	if (!this.DEBUG) {
		try {
			return evalItemMethod_work();
		} catch (excep) {
			this.AlertError(
				this.getResource('', 'aras_object.method_failed', methodName),
				this.getResource(
					'',
					'aras_object.aras_object',
					excep.number,
					excep.description
				),
				this.getResource('', 'common.client_side_err')
			);
			return;
		}
	} else {
		return evalItemMethod_work();
	}
};

/**
 * Method to invoke an Innovator Method on the server side.
 * @param {string} action the server action to be performed
 * @param {string} body the message body for the action
 */
Aras.prototype.applyMethod = function Aras_applyMethod(action, body) {
	var res = this.soapSend(
		'ApplyMethod',
		'<Item type="Method" action="' + action + '">' + body + '</Item>'
	);
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return false;
	}
	return res.getResultsBody();
};

/**
 * Method to invoke an action on an item on the server side.
 * @param {string} action the the server action to be performed, which is the Innovator Method name
 * @param {string} type the ItemType name
 * @param {string} body the message body for the action
 */
Aras.prototype.applyItemMethod = function (action, type, body) {
	var res = this.soapSend(
		'ApplyItem',
		'<Item type="' + type + '" action="' + action + '">' + body + '</Item>'
	);

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return false;
	}
	return res.getResultsBody();
};

/**
 * Method to apply an item on the server side.
 * @param {string} body the message body for the item
 */
Aras.prototype.applyAML = function (body) {
	var res = this.soapSend('ApplyAML', body);
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return false;
	}
	return res.getResultsBody();
};

/**
 * Method to compile VB or C# code on the server side to check syntax.
 * @param body the method item xml
 */
Aras.prototype.compileMethod = function (body) {
	var res = this.soapSend('CompileMethod', body);
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return '';
	}
	return res.getResultsBody();
};

/**
 * Method to apply an item on the server side.
 * @param body the message body for the item
 */
Aras.prototype.applyItem = function Aras_applyItem(body) {
	var res = this.soapSend('ApplyItem', body);
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return '';
	}
	return res.getResultsBody();
};

Aras.prototype.canInvokeAction = function Aras_canInvokeActionImpl(actionId) {
	var canInvokeAction = true;
	if (actionId) {
		// Request to Server should be changed to request to Cache in further implementations.
		var action = this.newIOMItem('Action', 'get');
		action.setID(actionId);
		action.setAttribute('select', 'can_execute, location');
		action = action.apply();
		if (action.isError()) {
			this.AlertError(action);
			return false;
		}

		var canExecuteMethodName = action.getPropertyAttribute(
			'can_execute',
			'keyed_name'
		);
		var location = action.getProperty('location');
		canInvokeAction = this.canInvokeActionImpl(canExecuteMethodName, location);
	}
	return canInvokeAction;
};

Aras.prototype.canInvokeActionImpl = function Aras_canInvokeActionImpl(
	methodName,
	location
) {
	var canInvokeAction = true;
	if (methodName) {
		if (location === 'client') {
			// Result of 'this.evalMethod' can be value of any type (integer, string, boolean and etc.).
			// For compatibility with "location === 'server'" logic:
			// if value string 'true' or boolean true, canInvokeAction = true, in all other cases canInvokeAction = false
			var evalResult = this.evalMethod(methodName);
			//evalResult can be 'undefined'.
			if (!evalResult || evalResult.toString() != 'true') {
				canInvokeAction = false;
			}
		} else if (location === 'server') {
			var canInvoketem = this.newIOMItem('Action', methodName);
			canInvoketem = canInvoketem.apply();
			if (canInvoketem.isError() || canInvoketem.getResult() != 'true') {
				canInvokeAction = false;
			}
		}
	}

	return canInvokeAction;
};

/**
 * Invoke the Method associated with an action.
 * @param {string} action the the Action item
 * @param {string} itemTypeID
 * @param {string} thisSelectedItemID
 */
Aras.prototype.invokeAction = function Aras_invokeAction(
	action,
	itemTypeID,
	thisSelectedItemID
) {
	var self = this;
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'aras_object.invoking_action'),
		system_progressbar1_gif
	);
	var name = this.getItemProperty(action, 'name');
	var actionType = this.getItemProperty(action, 'type');
	var target = this.getItemProperty(action, 'target');
	var location = this.getItemProperty(action, 'location');
	var body = this.getItemProperty(action, 'body');
	var onCompleteMethodName = this.getItemPropertyAttribute(
		action,
		'on_complete',
		'keyed_name'
	);
	var itemTypeName = null;

	if (itemTypeID != undefined && itemTypeID) {
		itemTypeName = this.getItemTypeName(itemTypeID);
	}

	var methodName = this.getItemPropertyAttribute(
		action,
		'method',
		'keyed_name'
	);
	var results;
	var selectedItem;

	if (actionType == 'item') {
		var item_query = this.getItemProperty(action, 'item_query');
		var xslt =
			"<xsl:stylesheet xmlns:xsl='http://www.w3.org/1999/XSL/Transform' version='1.0'>" +
			"<xsl:output method='xml' omit-xml-declaration='yes' standalone='yes' indent='yes'/>" +
			"<xsl:template match='/'>" +
			'<xsl:apply-templates/></xsl:template>' +
			"<xsl:template match='Item'>" +
			item_query +
			'</xsl:template>' +
			'</xsl:stylesheet>';
		var itemDom = this.createXMLDocument();
		var doApplyQuery = false;

		// IR-016631 "InvokeAction works wrong."
		selectedItem = this.itemsCache.getItemByXPath(
			"//Item[@id='" +
				thisSelectedItemID +
				"' and (@isDirty='1' or @isTemp='1')]"
		);

		// if item isn't dirty and isn't temp
		if (!selectedItem) {
			// retrieve item from server
			selectedItem = this.getItemById(itemTypeName, thisSelectedItemID, 0);

			// seems, item was deleted
			if (!selectedItem) {
				this.AlertError(
					this.getResource(
						'',
						'aras_object.item_not_found',
						itemTypeName,
						thisSelectedItemID
					)
				);
				return;
			}

			if (item_query != '') {
				itemDom.loadXML(selectedItem.xml);
				doApplyQuery = true;
			}
		}

		//request selectedItem from server via item_query transformation
		if (doApplyQuery) {
			// if item_query is invalid string(__is_new__ for example), then this request do not return anything and value from cache will be used.
			var query = this.applyXsltString(itemDom, xslt);
			if (query) {
				var result = this.soapSend('ApplyItem', query);
				//if nothing was received, then use item from cache or if it is not existed in cache use temp item.
				if (result.getFaultCode() != 0) {
					selectedItem = itemDom.documentElement;
				} else {
					var resultItem = result.getResult().selectSingleNode('Item');
					this.mergeItem(selectedItem, resultItem);
				}
			}
		}

		if (location == 'server') {
			var inDom = this.createXMLDocument();
			inDom.loadXML(selectedItem.xml);
			var inItem = inDom.selectSingleNode('//Item');
			inItem.setAttribute('action', methodName);
			var res = this.soapSend('ApplyItem', inItem.xml);
			if (res.getFaultCode() != 0) {
				this.AlertError(res);
				this.clearStatusMessage(statusId);
				return false;
			}
			results = res.getResultsBody();
		} else if (location == 'client') {
			var selectedItemXmlBeforeAction = selectedItem.xml;
			var itemWasChangedDurinAction = false;

			results = this.evalItemMethod(methodName, selectedItem, null);

			if (selectedItem) {
				itemWasChangedDurinAction =
					selectedItemXmlBeforeAction !== selectedItem.xml;

				if (itemWasChangedDurinAction && this.isLocked(selectedItem)) {
					selectedItem.setAttribute('isDirty', '1');
					this.uiReShowItemEx(thisSelectedItemID, selectedItem);
				}
			}
		}

		if (onCompleteMethodName) {
			var methodArgs = {};
			methodArgs.results = results;
			results = this.evalItemMethod(
				onCompleteMethodName,
				selectedItem,
				methodArgs
			);
		}
	} else if (actionType == 'itemtype' || actionType == 'generic') {
		if (location == 'server') {
			if (body != '' && actionType == 'itemtype') {
				results = this.applyItemMethod(methodName, itemTypeName, body);
			} else if (body != '' && actionType == 'generic') {
				results = this.applyMethod(methodName, body);
			} else {
				if (body == '') {
					body = '<id>' + thisSelectedItemID + '</id>';
				}
				results = this.applyMethod(methodName, body);
			}
		} else if (location == 'client') {
			var methodNode = this.MetadataCache.GetClientMethodNd(methodName, 'name');
			results = this.evalMethod(methodName, body, methodNode);
			if (onCompleteMethodName) {
				var methodArgs = {};
				methodArgs.results = results;
				results = this.evalItemMethod(onCompleteMethodName, body, methodArgs);
			}
		}
	}

	var doc;

	if (location == 'server') {
		var subst = this.createXMLDocument();
		subst.loadXML(results);

		if (subst.documentElement) {
			var content = subst.documentElement.text;
		} else {
			var content = '';
		}
		subst = null;
	} else {
		var content = results;
	}

	var tabsObj = this.getMainWindow().arasTabs;
	var close =
		'var close = function(callback) { \
					if (!callback) { \
						const tabId = this.frameElement.id; \
						const tabbar = tabsContainer.getTabbarByTabId(tabId); \
						tabbar.removeTab(tabId); \
					} else { \
						callback(true); \
					} \
				};';

	var focus =
		'var nativeFocus = window.focus; \
			var focus = function() { \
						const tabId = this.frameElement.id; \
						const tabbar = tabsContainer.getTabbarByTabId(tabId); \
						tabbar.selectTab(tabId); \
					};';

	var createScript = function (win) {
		var script = win.document.createElement('script');
		script.textContent =
			'var tabsContainer = window.parent.aras.getMainWindow().mainLayout.tabsContainer;';
		script.textContent += close;
		script.textContent += focus;
		win.document.body.appendChild(script);
	};

	var openContentInTab = function (mode) {
		var winName =
			self.mainWindowName + '_' + self.getItemProperty(action, 'id');
		var win;
		mode = mode || 'window';

		if (mode === 'window') {
			winName = winName + '_' + Date.now();
		}

		var mainWindowDoc = self.getMainWindow().document;
		var frame = mainWindowDoc.getElementById(winName);

		if (!frame) {
			win = tabsObj.open(aras.getScriptsURL() + 'blank.html', winName);
			tabsObj.updateTitleTab(winName, {
				label: name,
				image: '../images/TabDefault.svg'
			});
		} else {
			win = frame.contentWindow;
			win.focus();
		}

		// if content is very large doc.write(content) falls with errors(out of memory, example)
		// so write content by parts
		var contentLength = 250000;
		var cycles = Math.ceil(content.length / contentLength);
		for (var i = 0; i < cycles; i++) {
			win.document.write(
				content.substring(i * contentLength, (i + 1) * contentLength)
			);
		}
		win.document.write('<br />');
		win.document.body.style.background = '#fff';

		if (!win.tabsContainer) {
			createScript(win);
		}
	};

	switch (target) {
		case 'window':
		case 'main':
			if (tabsObj) {
				openContentInTab('window');
				break;
			}

			var width = 710; // This is a printable page width.
			var height = screen.height / 2;
			var x = (screen.height - height) / 2;
			var y = (screen.width - width) / 2;
			var args =
				'scrollbars=yes,resizable=yes,status,width=' +
				width +
				',height=' +
				height +
				',left=' +
				y +
				',top=' +
				x;
			var win = open('', '', args);
			win.focus();
			doc = win.document.open();
			doc.write(content);
			doc.close();
			doc.title = name;
			break;
		case 'none':
			break;
		case 'one window':
			if (tabsObj) {
				openContentInTab('one window');
				break;
			}

			var targetWindow = this.getActionTargetWindow(name);
			doc = targetWindow.document;
			// if content is very large doc.write(content) falls with errors(out of memory, example)
			// so write content by parts
			var contentLength = 250000;
			var cycles = Math.ceil(content.length / contentLength);
			for (var i = 0; i < cycles; i++) {
				doc.write(
					content.substring(i * contentLength, (i + 1) * contentLength)
				);
			}
			doc.write('<br />');
			break;
	}
	this.clearStatusMessage(statusId);
};

Aras.prototype.runReport = function Aras_runReport(report, itemTypeID, item) {
	if (!report) {
		this.AlertError(
			this.getResource('', 'aras_object.failed_get_report'),
			'',
			''
		);
		return;
	}

	var report_location = this.getItemProperty(report, 'location');
	var self = this;
	var results;

	if (report_location == 'client') {
		var result = this.runClientReport(report, itemTypeID, item);
		if (result.then) {
			result.then(processResults);
		} else {
			processResults(result);
		}
	} else if (report_location == 'server') {
		results = this.runServerReport(report, itemTypeID, item);
		var tmpDom = this.createXMLDocument();
		if (results) {
			tmpDom.loadXML(results);
			results = tmpDom.documentElement.text;
		}
		processResults(results);
	} else if (report_location == 'service') {
		var url =
			this.getServerBaseURL() +
			'RSGateway.aspx?irs:Report=' +
			this.getItemProperty(report, 'name');
		var report_query = this.getItemProperty(report, 'report_query');
		if (report_query) {
			var xslt =
				'' +
				"<?xml version='1.0' encoding='utf-8'?>" +
				"<xsl:stylesheet xmlns:xsl='http://www.w3.org/1999/XSL/Transform' version='1.0'>" +
				"	<xsl:output method='xml' omit-xml-declaration='yes' standalone='yes' indent='yes'/>" +
				"	<xsl:template match='/'><xsl:apply-templates/></xsl:template>" +
				"	<xsl:template match='Item'><result>" +
				report_query +
				'</result></xsl:template>' +
				'</xsl:stylesheet>';
			var itemDom = this.createXMLDocument();
			if (item) {
				itemDom.loadXML(item.xml);
			} else {
				var typeName;
				if (itemTypeID) {
					typeName = this.getItemTypeName(itemTypeID);
					itemDom.loadXML("<Item type='" + typeName + "' id=''/>");
					item = true;
				}
			}

			var qryString = report_query;
			if (item) {
				qryString = this.applyXsltString(itemDom, xslt);
				if (qryString) {
					tmpDom = this.createXMLDocument();
					tmpDom.loadXML(qryString);
					qryString = tmpDom.documentElement.text;
				}
			}
			if (qryString) {
				url += '&' + qryString;
			}
		}
		processResults(results);
	}

	function processResults(results) {
		if (typeof results === 'undefined') {
			results = '';
		} else if (typeof results !== 'string') {
			results = results.toString();
		}
		// Transformation for vault-images
		var substr = 'vault:///?fileid=';
		var fileIdpos = results.toLowerCase().indexOf(substr);
		while (fileIdpos != -1) {
			var vaultUrl = results.substring(
				fileIdpos,
				fileIdpos + substr.length + 32
			);
			fileIdpos += substr.length;
			var fileId = vaultUrl.replace(/vault:\/\/\/\?fileid\=/i, '');
			var vaultUrlwithToken = self.IomInnovator.getFileUrl(
				fileId,
				self.Enums.UrlType.SecurityToken
			);
			results = results.replace(vaultUrl, vaultUrlwithToken);
			var fileIdpos = results.toLowerCase().indexOf(substr, fileIdpos + 32);
		}

		// Add element <base> in result for correct loading picture.
		function isBaseTagInHead(results) {
			const head = results.match(/<head[^]*?>[^]*?<\/head>/i);
			if (head) {
				const searchBaseTagRegExp = /<head[^]*?>[^]*?<base[^]*?>[^]*?<\/head>/i;
				return searchBaseTagRegExp.test(head[0]);
			}
		}
		if (!isBaseTagInHead(results)) {
			var base = '<base href="' + self.getScriptsURL() + '"></base>';
			results = results.replace(/<(head[^]*?)\/>/i, '<$1></head>');
			results = results.replace(
				/(<head[^]*?>)([^]*?<\/head>)/i,
				'$1' + base + '$2'
			);
			if (!isBaseTagInHead(results)) {
				results = results.replace(
					/<html[^]*?>/i,
					'$0' + '<head>' + base + '</head>'
				);
			}
		}
		//Chrome new window blocked non event user action
		setTimeout(function () {
			self.targetReport(report, report_location, url, results);
		}, 0);
	}
};

Aras.prototype.targetReport = function (
	report,
	report_location,
	url,
	results,
	doReturnWindow
) {
	var target = this.getItemProperty(report, 'target') || 'window';
	var doc = null;
	var self = this;
	var tabsObj = this.getMainWindow().arasTabs;

	var close =
		'var close = function(callback) { \
					if (!callback) { \
						const tabId = this.frameElement.id; \
						const tabbar = tabsContainer.getTabbarByTabId(tabId); \
						tabbar.removeTab(tabId); \
					} else { \
						callback(true); \
					} \
				};';

	var focus =
		'var nativeFocus = window.focus; \
		var focus = function() { \
					const tabId = this.frameElement.id; \
					const tabbar = tabsContainer.getTabbarByTabId(tabId); \
					tabbar.selectTab(tabId); \
				};';

	var createScript = function (win) {
		var script = win.document.createElement('script');
		script.textContent =
			'var tabsContainer = window.parent.aras.getMainWindow().mainLayout.tabsContainer;';
		script.textContent += 'window.opener = window.parent;';
		script.textContent += close;
		script.textContent += focus;
		win.document.body.appendChild(script);
	};

	var openReportInTab = function (mode, report_location, url) {
		var winName =
			self.mainWindowName + '_' + self.getItemProperty(report, 'id');
		var win;
		mode = mode || 'tab';

		if (mode === 'tab' && report_location !== 'service') {
			winName = winName + '_' + Date.now();
		}

		var mainWindowDoc = self.getMainWindow().document;
		var frame = mainWindowDoc.getElementById(winName);

		if (!frame) {
			win = tabsObj.open(url || aras.getScriptsURL() + 'blank.html', winName);
			tabsObj.updateTitleTab(winName, {
				label: self.getItemProperty(report, 'name'),
				image: '../images/TabDefault.svg'
			});
		} else {
			win = frame.contentWindow;
			win.focus();
		}

		if (report_location !== 'service') {
			win.document.write(results);
			win.document.write('<br>');
			win.document.body.style.background = '#fff';
		}

		if (!win.tabsContainer) {
			url
				? win.frameElement.addEventListener(
						'load',
						createScript.bind(null, win)
				  )
				: createScript(win);
		}

		return win;
	};

	var reportItemType = report.getAttribute('type');
	var isSsrsReport =
		report_location === 'service' && reportItemType === 'Report';
	var isIe11 = window.MSInputMethodContext && document.documentMode;
	if (target == 'window' || target == 'main') {
		if (tabsObj && !(isIe11 && isSsrsReport)) {
			return openReportInTab('tab', report_location, url);
		}

		var width = 800, // This is a printable page width.
			height = screen.availHeight / 2,
			x = (screen.availHeight - height) / 2,
			y = (screen.availWidth - width) / 2,
			args =
				'scrollbars=yes,resizable=yes,status=yes,width=' +
				width +
				',height=' +
				height +
				',left=' +
				y +
				',top=' +
				x;

		if (report_location == 'service') {
			var win = open(url, '', args);
			if (doReturnWindow) {
				return win;
			}
			return;
		}

		var win = open('', '', args);
		doc = win.document.open();
		var name = this.getItemProperty(report, 'label');
		if (!name) {
			name = this.getItemProperty(report, 'name');
		}
		name = this.getResource('', 'aras_object.report_with_label', name);
		doc.write(results);
		doc.close();
		win.document.title = name;
		if (doReturnWindow) {
			return win;
		}
	} else if (target == 'none') {
		return;
	} else if (target == 'one window') {
		if (tabsObj && !(isIe11 && isSsrsReport)) {
			return openReportInTab('one tab', report_location, url);
		}

		var targetWindow;

		if (report_location == 'service') {
			targetWindow = this.getActionTargetWindow(name, url);
			return;
		}

		targetWindow = this.getActionTargetWindow(name);
		doc = targetWindow.document;
		doc.write(results);
		doc.write('<br>');
	}
};

/**
 * Invoke the Method associated with a report.
 * @param report the the Report item
 * @param itemTypeID is ignored
 */
Aras.prototype.runClientReport = function Aras_runClientReport(
	report,
	itemTypeID,
	item
) {
	if (!report) {
		this.AlertError(
			this.getResource('', 'aras_object.failed_get_report'),
			'',
			''
		);
		return;
	}

	var results = '';
	var selectedItem = item;

	report = this.getItemFromServer(
		'Report',
		report.getAttribute('id'),
		'label,name,description,report_query,target,type,xsl_stylesheet,location,method(name,method_type,method_code)'
	).node;

	var reportType = this.getItemProperty(report, 'type');
	var methodName = this.getItemPropertyAttribute(
		report,
		'method',
		'keyed_name'
	);

	if (methodName) {
		results =
			reportType == 'item'
				? this.evalItemMethod(methodName, selectedItem)
				: this.evalMethod(methodName, '');
	} else {
		var report_query = this.getItemProperty(report, 'report_query');

		if (!report_query) {
			if (reportType == 'item') {
				report_query =
					"<Item typeId='{@typeId}' id='{@id}' action='get' levels='1'/>";
			} else if (reportType == 'itemtype') {
				report_query = "<Item typeId='{@typeId}' action='get'/>";
			} else if (reportType == 'generic') {
				report_query = '';
			}
		}

		if (report_query) {
			var xslt =
				"<xsl:stylesheet xmlns:xsl='http://www.w3.org/1999/XSL/Transform' version='1.0'>" +
				"<xsl:output method='xml' omit-xml-declaration='yes' standalone='yes' indent='yes'/>" +
				"	<xsl:template match='/'>" +
				'		<xsl:apply-templates/>' +
				'	</xsl:template>' +
				"	<xsl:template match='Item'>" +
				report_query +
				'</xsl:template>' +
				'</xsl:stylesheet>';
			var itemDom = this.createXMLDocument();

			if (item) {
				itemDom.loadXML(item.xml);
			}

			var query = this.applyXsltString(itemDom, xslt);
			if (query) {
				results = this.applyItem(query);
			} else {
				results = this.applyItem(report_query);
			}

			var xsl_stylesheet = this.getItemProperty(report, 'xsl_stylesheet');
			if (xsl_stylesheet) {
				var xslt_stylesheetDOM = this.createXMLDocument();
				xslt_stylesheetDOM.loadXML(xsl_stylesheet);

				var toolLogicNode = xslt_stylesheetDOM.selectSingleNode(
					'//script[@userData="Tool Logic"]'
				);
				if (toolLogicNode) {
					toolLogicNode.parentNode.removeChild(toolLogicNode);
				}

				xsl_stylesheet = xslt_stylesheetDOM.xml;

				var res = this.createXMLDocument();
				res.loadXML(results);

				if (reportType == 'item') {
					res.loadXML('<Result>' + results + '</Result>');
				} else {
					res.loadXML(results);
				}

				results = this.applyXsltString(res, xsl_stylesheet);
			}
		}
	}

	return results;
};

Aras.prototype.runServerReport = function Aras_runServerReport(
	report,
	itemTypeID,
	item
) {
	if (!report) {
		this.AlertError(
			this.getResource('', 'aras_object.failed_get_report'),
			'',
			''
		);
		return;
	}

	var report_name = this.getItemProperty(report, 'name');

	var AML = '';
	if (item) {
		var item_copy = item.cloneNode(true);
		if (itemTypeID) {
			item_copy.setAttribute('typeId', itemTypeID);
		}
		AML = item_copy.xml;
	} else if (itemTypeID) {
		AML = "<Item typeId='" + itemTypeID + "'/>";
	}

	var body =
		'<report_name>' + report_name + '</report_name><AML>' + AML + '</AML>';
	var results = this.applyMethod('Run Report', body);

	return results;
};

/**
 * Method to set the value of an element on the node
 * and set action attribute on the node, if it is absent.
 * The item is the node and the property is the element.
 * @param {*} srcNode the item object
 * @param {string} element the property to set
 * @param {*} value the value for the property
 * @param {boolean} [apply_the_change_to_all_found=true] flag to signal if the change must be common or local
 * @param {string} [action='update'] action attribute to be set on the node. By default, if action is not defined
 * and node action attribute != 'add' or != 'create' we set action 'update'
 */
Aras.prototype.setNodeElementWithAction = function Aras_setNodeElementWithAction(
	srcNode,
	element,
	value,
	apply_the_change_to_all_found,
	action
) {
	this.setNodeElement(srcNode, element, value, apply_the_change_to_all_found);

	if (
		!srcNode.getAttribute('action') ||
		(srcNode.getAttribute('action') != 'add' &&
			srcNode.getAttribute('action') != 'create')
	) {
		if (action) {
			srcNode.setAttribute('action', action);
		} else {
			srcNode.setAttribute('action', 'update');
		}
	}
};

/**
 * Method to set the value of an element on the node.
 * The item is the node and the property is the element.
 * @param {*} srcNode the item object
 * @param {string} propertyName the property to set
 * @param {*} value the value for the property
 * @param {boolean} [applyTheChangeToAllFound=true] flag to signal if the change must be common or local
 * @param {*} [itemTypeNd=undefined] node representing itemType of srcNode
 * @return {boolean} always true.
 */
Aras.prototype.setNodeElement = Aras.prototype.setItemProperty = function Aras_setItemProperty(
	srcNode,
	propertyName,
	value,
	applyTheChangeToAllFound,
	itemTypeNd
) {
	if (applyTheChangeToAllFound === undefined) {
		// Important. This flag takes a huge non-obvious role, when we change related item from
		// relationships grid - setItemProperty is invoked for the item which is placed:
		// ItemsCache::['/Item[source_item_id]/Relationships[relationships_item_id]/related_id/Item[related_item_id]']
		// this flag would cause change not only for that item, but also for the item with the same id stored on the first level of cache
		applyTheChangeToAllFound = true;
	}

	const propertyValue = value === null || value === undefined ? '' : value;

	let skipSourceNode = false;
	var propertyValueWasTransfered = false;

	const srcItemType = srcNode.getAttribute('type');
	const srcId = srcNode.getAttribute('id');
	const isItemProperty =
		getPropertyDataType(this, srcItemType, propertyName, itemTypeNd) === 'item';

	if (applyTheChangeToAllFound) {
		const nodes = this.itemsCache.getItemsByXPath(
			"//Item[@id='" + srcId + "']"
		);
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node === srcNode) {
				skipSourceNode = true;
			}
			_setItemProperty(this, node, propertyName, propertyValue);
		}
	}

	if (!skipSourceNode) {
		_setItemProperty(this, srcNode, propertyName, propertyValue);
	}

	const nodesToBeMarkedAsDirty = srcNode.selectNodes('ancestor-or-self::Item');
	for (let i = 0; i < nodesToBeMarkedAsDirty.length; i++) {
		const node = nodesToBeMarkedAsDirty[i];
		if (this.isLockedByUser(node)) {
			node.setAttribute('isDirty', '1');
		}
	}

	if (srcItemType && srcNode.getAttribute('action') !== 'skip') {
		const store = this.getMainWindow().store;
		let storeValue = {
			[propertyName]: propertyValue
		};

		if (isItemProperty && typeof propertyValue === 'object') {
			storeValue = {
				[propertyName]: propertyValue.getAttribute('id'),
				[`${propertyName}@aras.type`]: propertyValue.getAttribute('type'),
				[`${propertyName}@aras.keyed_name`]: this.getItemProperty(
					propertyValue,
					'keyed_name'
				)
			};
		}

		store.boundActionCreators.changeItem(srcItemType, srcId, storeValue);
	}

	return true;

	function isEmptyElement(xmlElem) {
		if (xmlElem) {
			if (xmlElem.hasChildNodes() || xmlElem.attributes.length !== 0) {
				return false;
			}
		}
		return true;
	}

	function getPropertyDataType(
		arasObj,
		itemTypeName,
		propertyName,
		itemTypeNode
	) {
		if (!itemTypeName && !itemTypeNode) {
			return '';
		}

		const itemType = itemTypeNode
			? itemTypeNode
			: arasObj.getItemTypeForClient(itemTypeName).node;
		if (!itemType) {
			return '';
		}

		const dataType = itemType.selectSingleNode(
			'Relationships/Item[@type="Property"][name="' +
				propertyName +
				'"]/data_type'
		);
		if (dataType) {
			return dataType.text;
		}

		return '';
	}

	function _setItemProperty(arasObj, node, propertyName, propertyValue) {
		var elm = node.selectSingleNode(propertyName);
		if (!elm) {
			elm = node.appendChild(node.ownerDocument.createElement(propertyName));
		}
		if (elm.getAttribute('is_null') !== '') {
			elm.removeAttribute('is_null');
		}

		const elementWasEmpty = isEmptyElement(elm);

		let itemType = '';
		var valueIsNode;
		if (propertyValue.xml == undefined) {
			valueIsNode = false;
			elm.text = propertyValue;
		} else {
			valueIsNode = true;
			elm.text = '';

			var value2use = propertyValue;

			//check if we insert node into itself
			itemType = propertyValue.getAttribute('type');
			const itemId = propertyValue.getAttribute('id');
			const propertyValueClones = value2use.selectNodes(
				"ancestor-or-self::Item[@type='" +
					itemType +
					"' and @id='" +
					itemId +
					"']"
			);
			var isACopyOfParent = false;
			for (var i = 0; i < propertyValueClones.length; i++) {
				if (propertyValue == propertyValueClones[i]) {
					isACopyOfParent = true;
					break;
				}
			}

			if (isACopyOfParent || propertyValueWasTransfered) {
				value2use = value2use.cloneNode(true);
			}

			propertyValueWasTransfered = true;
			elm.appendChild(value2use);
		}

		const updateKeyedName =
			elm.getAttribute('keyed_name') !== null ||
			(elementWasEmpty && srcItemType && isItemProperty);

		if (updateKeyedName) {
			var newKeyedName;
			if (valueIsNode) {
				newKeyedName = arasObj.getKeyedNameEx(propertyValue);
			} else {
				var propertyItemType = elm.getAttribute('type');
				if (propertyItemType == null) {
					propertyItemType = '';
				}
				newKeyedName = arasObj.getKeyedName(propertyValue, propertyItemType);
			}

			elm.setAttribute('keyed_name', newKeyedName);

			elm.removeAttribute('discover_only');
			if (propertyValue) {
				var cachedItem = null;
				if (itemType == 'ItemType') {
					cachedItem = arasObj.getItemTypeDictionary(
						valueIsNode ? propertyValue.getAttribute('id') : propertyValue,
						'id'
					);
					if (cachedItem && cachedItem.node) {
						cachedItem = cachedItem.node;
					}
				} else {
					cachedItem = arasObj.itemsCache.getItem(
						valueIsNode ? propertyValue.getAttribute('id') : propertyValue
					);
				}

				if (cachedItem && cachedItem.getAttribute('discover_only') == '1') {
					elm.setAttribute('discover_only', '1');
				}
			}

			if (valueIsNode) {
				const oldKeyedName = arasObj.getItemProperty(
					propertyValue,
					'keyed_name'
				);
				if (!oldKeyedName && newKeyedName) {
					arasObj.setItemProperty(
						propertyValue,
						'keyed_name',
						newKeyedName,
						false
					);
				}
			}
		}

		const lastModifiedOn = Date.now();
		node.setAttribute('LastModifiedOn', lastModifiedOn);
	}
};

/**
 * Method to get the value of an element on the node.
 * The item is the node and the property is the element.
 * @param {*} node the item object
 * @param {string} element the property to set
 * @param {string} [defaultVal]
 */
Aras.prototype.getItemProperty = Aras.prototype.getNodeElement = function (
	node,
	element,
	defaultVal
) {
	if (!node) {
		return;
	}
	var value;
	if (node.nodeName == 'Item' && element == 'id') {
		value = node.getAttribute('id');
	} else {
		var tmpNd = ArasModules.xml.selectSingleNode(node, element);
		if (tmpNd) {
			var tmpNd2 = ArasModules.xml.selectSingleNode(tmpNd, 'Item');
			if (tmpNd2) {
				value = tmpNd2.getAttribute('id');
			} else {
				value = tmpNd.text;
			}
		} else {
			value = defaultVal === undefined ? '' : defaultVal;
		}
	}
	return value;
};

Aras.prototype.setNodeTranslationElement = Aras.prototype.setItemTranslation = function Aras_setItemTranslation(
	srcNode,
	mlPropNm,
	value,
	lang
) {
	var pNd;
	this.getItemTranslation(srcNode, mlPropNm, lang, null, function (foundNode) {
		pNd = foundNode;
	});

	if (!pNd) {
		pNd = this.browserHelper.createTranslationNode(
			srcNode,
			mlPropNm,
			this.translationXMLNsURI,
			this.translationXMLNdPrefix
		);
		pNd = srcNode.appendChild(pNd);
		pNd.setAttribute('xml:lang', lang);
	}

	if (value === null || value === undefined) {
		value = '';
		pNd.setAttribute('is_null', '1');
	}
	pNd.text = value;
};

Aras.prototype.getNodeTranslationElement = Aras.prototype.getItemTranslation = function Aras_getItemTranslation(
	srcNode,
	mlPropNm,
	lang,
	defaultVal,
	foundNodeCb
) {
	var pNd = this.browserHelper.getNodeTranslationElement(
		srcNode,
		mlPropNm,
		this.translationXMLNsURI,
		lang
	);
	if (foundNodeCb) {
		foundNodeCb(pNd);
	}
	if (!pNd) {
		return defaultVal === undefined ? '' : defaultVal;
	}
	return pNd.text;
};

Aras.prototype.setNodeTranslationElementAttribute = Aras.prototype.setItemTranslationAttribute = function Aras_setItemTranslationAttribute(
	srcNode,
	mlPropNm,
	lang,
	attribute,
	value
) {
	this.getItemTranslation(srcNode, mlPropNm, lang, null, function (foundNode) {
		if (foundNode) {
			foundNode.setAttribute(attribute, value);
		}
	});
};

Aras.prototype.getNodeTranslationElementAttribute = Aras.prototype.getItemTranslationAttribute = function Aras_getItemTranslationAttribute(
	srcNode,
	mlPropNm,
	lang,
	attribute,
	defaultVal
) {
	var r;
	this.getItemTranslation(srcNode, mlPropNm, lang, null, function (foundNode) {
		if (foundNode) {
			r = foundNode.getAttribute(attribute);
		}
	});

	if (r === undefined) {
		r = defaultVal === undefined ? '' : defaultVal;
	}
	return r;
};

Aras.prototype.removeItemTranslation = function Aras_removeItemTranslation(
	srcNode,
	mlPropNm,
	lang
) {
	this.getItemTranslation(srcNode, mlPropNm, lang, null, function (foundNode) {
		if (foundNode) {
			srcNode.removeChild(foundNode);
		}
	});
};

Aras.prototype.removeNodeTranslationElementAttribute = Aras.prototype.removeItemTranslationAttribute = function Aras_setItemTranslationAttribute(
	srcNode,
	mlPropNm,
	lang,
	attribute
) {
	this.getItemTranslation(srcNode, mlPropNm, lang, null, function (foundNode) {
		if (foundNode) {
			foundNode.removeAttribute(attribute);
		}
	});
};

Aras.prototype.getItemPropertyTranslations = function Aras_getItemPropertyTranslations(
	item,
	property
) {
	const self = this;
	const sessionLanguageCode = self.getSessionContextLanguageCode();
	const languagesResultNode = self.getLanguagesResultNd();
	const languages = ArasModules.xml.selectNodes(
		languagesResultNode,
		'Item[@type="Language"]'
	);
	const getTranslatedProperty = function (translatedItem, languageCode) {
		if (sessionLanguageCode === languageCode) {
			return self.getItemProperty(translatedItem, property);
		}

		return self.getItemTranslation(
			translatedItem,
			property,
			languageCode,
			null
		);
	};
	const getTranslatedItem = function () {
		if (self.isNew(item)) {
			return Promise.resolve(item);
		}

		const isLoaded = languages.every(function (languageNode) {
			const languageCode = self.getItemProperty(languageNode, 'code');

			return getTranslatedProperty(item, languageCode) !== null;
		});
		if (isLoaded) {
			return Promise.resolve(item);
		}

		const type = item.getAttribute('type');
		const id = item.getAttribute('id');

		return ArasModules.soap(
			'<Item type="' +
				type +
				'" id="' +
				id +
				'" select="' +
				property +
				'" action="get" related_expand="0" language="*" />',
			{ async: true }
		).then(function (soapResult) {
			const translatedItem = ArasModules.xml.selectSingleNode(
				soapResult,
				'Item'
			);

			languages.forEach(function (languageNode) {
				const languageCode = self.getItemProperty(languageNode, 'code');
				const translatedValue = getTranslatedProperty(
					translatedItem,
					languageCode
				);

				self.setItemTranslation(item, property, translatedValue, languageCode);
			});

			return translatedItem;
		});
	};

	return getTranslatedItem().then(function (translatedItem) {
		return languages.map(function (languageNode) {
			const languageCode = self.getItemProperty(languageNode, 'code');
			const languageName = self.getItemProperty(languageNode, 'name');
			const value = getTranslatedProperty(translatedItem, languageCode);

			return {
				code: languageCode,
				name: languageName,
				value: value
			};
		});
	});
};

Aras.prototype.setItemPropertyTranslations = function Aras_getItemPropertyTranslations(
	item,
	property,
	translations,
	applyChanges2All
) {
	if (!translations || !translations.length) {
		return null;
	}

	const self = this;
	const sessionLanguageCode = this.getSessionContextLanguageCode();

	translations.forEach(function (translation) {
		const languageCode = translation.code;
		const value = translation.value;

		self.setItemTranslation(item, property, value || null, languageCode);

		if (languageCode === sessionLanguageCode) {
			self.setItemProperty(item, property, value, applyChanges2All);
		}
	});

	return item;
};

/**
 * Method to set the value of an attribute on an element on the node.
 * The item is the node and the property is the element.
 * @param node the item object
 * @param {string} element the property to set
 * @param {string} attribute the name of the attribute
 * @param {string} value the value for the attribute
 */
Aras.prototype.setNodeElementAttribute = Aras.prototype.setItemPropertyAttribute = function (
	node,
	element,
	attribute,
	value
) {
	if (!node) {
		return;
	}
	var elm = node.selectSingleNode(element);
	if (elm) {
		elm.setAttribute(attribute, value);
	} else {
		this.newNodeElementAttribute(node, element, attribute, value);
	}
};

/**
 * Method to get the value of an attribute on an element on the node.
 * The item is the node and the property is the element.
 * @param node the item object
 * @param {string} element the property to get
 * @param {string } attribute the name of the attribute
 */
Aras.prototype.getNodeElementAttribute = Aras.prototype.getItemPropertyAttribute = function (
	node,
	element,
	attribute
) {
	if (!node) {
		return null;
	}
	var value = null;
	var elm = node.selectSingleNode(element);
	if (!elm) {
		return null;
	} else {
		value = elm.getAttribute(attribute);
	}
	return value;
};

Aras.prototype.removeNodeElementAttribute = Aras.prototype.removeItemPropertyAttribute = function (
	node,
	element,
	attribute
) {
	var elm = node.selectSingleNode(element);
	if (elm) {
		elm.removeAttribute(attribute);
	}
};

/**
 * Method to create a new element (property) for the item node and set the value of an attribute on an element on the node.
 * The item is the node and the property is the element.
 * @param node the item object
 * @param {string} element the property to set
 * @param {string} attribute the name of the attribute
 * @param {string} value the value for the attribute
 */
Aras.prototype.newNodeElementAttribute = Aras.prototype.newItemPropertyAttribute = function (
	node,
	element,
	attribute,
	value
) {
	var elm = this.createXmlElement(element, node);
	elm.setAttribute(attribute, value);
	return elm;
};

/**
 * Method to get the text value for an element by XPath.
 * @param {string} xpath the APath to the element
 * @param node the optional node otherwise use the global dom
 */
Aras.prototype.getValueByXPath = function (xpath, node) {
	if (arguments.length < 2) {
		var node = this.dom;
	}
	if (!node.selectSingleNode(xpath)) {
		return;
	}
	return node.selectSingleNode(xpath).text;
};

/**
 * Method to load a ItemType by Form ID
 * @param {string} id the id for the Form item
 * @param {boolean} [ignoreFault=false]
 */
Aras.prototype.getItemTypeByFormID = function (id, ignoreFault) {
	if (ignoreFault == undefined) {
		ignoreFault = false;
	}
	var res = this.soapSend('GetItemTypeByFormID', '<Item id="' + id + '" />');

	if (res.getFaultCode() != 0) {
		if (!ignoreFault) {
			this.AlertError(res);
		}
		return false;
	}

	var itemTypeID = res.results.selectSingleNode('//Item').getAttribute('id');
	return this.getItemTypeDictionary(itemTypeID, 'id').node;
};

/**
 * Method to set the users working directory
 * @param {string} id the id for the user
 * @param {string} workingDir the working directory
 */
Aras.prototype.setUserWorkingDirectory = function (id, workingDir) {
	var elm = this.createXmlElement('Item');
	elm.setAttribute('id', id);
	elm.setAttribute('workingDir', workingDir);
	var res = this.soapSend('SetUserWorkingDirectory', elm.xml);
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return false;
	}
};

/**
 * Method to get the next value from a sequence item
 * @param {string} id the id for the sequence (optional if seqName is used)
 * @param {string} seqName the sequence name (optional is the id is used)
 */
Aras.prototype.getNextSequence = function (id, seqName) {
	if (id == undefined) {
		id = '';
	}

	var body = '<Item';
	if (id != '') {
		body += ' id="' + id + '"';
	}
	body += '>';
	if (seqName != undefined) {
		body += '<name>' + seqName + '</name>';
	}
	body += '</Item>';

	var res = this.soapSend('GetNextSequence', body);
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return false;
	}

	return res.results.selectSingleNode(this.XPathResult()).text;
};

/**
 * Method to get list of identity IDs for those current user is a member.
 * The list is a string and has following format:
 * identityID,identityID,...,identityID
 */
Aras.prototype.buildIdentityList = function Aras_buildIdentityList(
	identityListSoapResults
) {
	if (identityListSoapResults.getFaultCode() != 0) {
		this.AlertError(identityListSoapResults);
		this.setIdentityList('');
	} else {
		this.setIdentityList(
			identityListSoapResults.results.selectSingleNode(this.XPathResult()).text
		);
	}
	return this.getIdentityList();
};

Aras.prototype.applySortOrder = function Aras_applySortOrder(
	relationshipsArray
) {
	//this method is for internal purposes only.
	var arasObj = this;
	function sortOrderComparer(nd1, nd2) {
		var sortOrder1 = parseInt(arasObj.getItemProperty(nd1, 'sort_order'));
		if (isNaN(sortOrder1)) {
			return 1;
		}

		var sortOrder2 = parseInt(arasObj.getItemProperty(nd2, 'sort_order'));
		if (isNaN(sortOrder2)) {
			return -1;
		}

		if (sortOrder1 > sortOrder2) {
			return 1;
		} else if (sortOrder1 == sortOrder2) {
			return 0;
		}
		return -1;
	}

	//relationshipsArray.sort(sortOrderComparer); doesn't work sometimes with error "Object doesn't support this property or method".
	//in debugger I see that relationshipsArray.sort is defined but call relationshipsArray.sort() throws the exception

	//work around:
	var tmpArray = [];
	for (var i = 0; i < relationshipsArray.length; i++) {
		tmpArray.push(relationshipsArray[i]);
	}

	tmpArray.sort(sortOrderComparer);

	for (var i = 0; i < relationshipsArray.length; i++) {
		relationshipsArray[i] = tmpArray[i];
	}

	tmpArray = null;
};

Aras.prototype.getSeveralListsValues = function Aras_getSeveralListsValues(
	listsArray,
	is_bgrequest,
	readyResponseIfNeed
) {
	//this method is for internal purposes only.
	var res = {};
	var listIds = [];
	var filterListIds = [];
	var listsArrayCopy = [];
	var typesArray = {};

	for (var i = 0; i < listsArray.length; i++) {
		var listDescr = listsArray[i];
		var listId = listDescr.id;
		var relType = listDescr.relType;
		typesArray[listId] = relType;

		if (is_bgrequest && !readyResponseIfNeed) {
			var listDescrCopy = { id: listId, relType: relType };
			listsArrayCopy.push(listDescrCopy);
		}
		var key = this.MetadataCache.CreateCacheKey(
			'getSeveralListsValues-' + relType,
			listId
		);
		if (!this.MetadataCache.GetItem(key)) {
			if (relType == 'Value') {
				listIds.push(listId);
			} else if (relType == 'Filter Value') {
				filterListIds.push(listId);
			}
		}
	}

	var response = readyResponseIfNeed;
	if (listIds.length != 0 || filterListIds.length != 0) {
		if (!response) {
			response = this.MetadataCache.GetList(listIds, filterListIds);
		}

		if (response.getFaultCode() != 0) {
			return res;
		}

		var items = response.results.selectNodes(this.XPathResult('/Item'));
		for (var i = 0; i < items.length; i++) {
			var listNd = items[i];
			var id = this.getItemProperty(listNd, 'id');
			var key = this.MetadataCache.CreateCacheKey(
				'getSeveralListsValues-' + typesArray[id],
				id
			);
			this.MetadataCache.SetItem(key, listNd);
		}
	}

	for (var i = 0; i < listsArray.length; i++) {
		var valuesArr = [];
		var listDescr = listsArray[i];
		var listId = listDescr.id;
		var key = this.MetadataCache.CreateCacheKey(
			'getSeveralListsValues-' + typesArray[listId],
			listId
		);
		var listNode = this.MetadataCache.GetItem(key);
		if (listNode) {
			var values = listNode.selectNodes('Relationships/Item');
			for (var j = 0; j < values.length; j++) {
				valuesArr.push(values[j]);
			}

			this.applySortOrder(valuesArr);

			res[listNode.getAttribute('id')] = valuesArr;
		}
	}

	// 1) add stubs for not found lists
	// 2) mark lists as requested in the session for preloading in future sessions
	for (var i = 0; i < listsArray.length; i++) {
		var listDescr = listsArray[i];
		var listId = listDescr.id;
		var relType = listDescr.relType;
		if (res[listId] === undefined) {
			res[listId] = [];
		}
	}

	return res;
};

Aras.prototype.getListValues_implementation = function Aras_getListValues_implementation(
	listID,
	relType,
	is_bgrequest
) {
	//this method is for internal purposes only.
	var listsArray = [];
	var listDescr = {};
	listDescr.id = listID;
	listDescr.relType = relType;
	listsArray.push(listDescr);

	var res = this.getSeveralListsValues(listsArray, is_bgrequest);

	return res[listID];
};

/**
 * Method to get the Values for a List item
 * @param {string} listId the id for the List
 * @param {boolean} is_bgrequest
 */
Aras.prototype.getListValues = function Aras_getListValues(
	listID,
	is_bgrequest
) {
	return this.getListValues_implementation(listID, 'Value', is_bgrequest);
};

/**
 * Method to get the Filter Value for a List item
 * @param {string} listID the id for the List
 * @param {boolean} is_bgrequest
 */
Aras.prototype.getListFilterValues = function Aras_getListFilterValues(
	listID,
	is_bgrequest
) {
	return this.getListValues_implementation(
		listID,
		'Filter Value',
		is_bgrequest
	);
};

/**
 * Method to clear the server cache
 */
Aras.prototype.clearCache = function () {
	var res = this.soapSend('ClearCache', '<Item />');
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return false;
	}
	return true;
};

/**
 * Method to get the style for the item
 * @param item dom object for the item
 */
Aras.prototype.getItemStyles = function (item) {
	if (!item) {
		return null;
	}

	var css = this.getItemProperty(item, 'css');
	if (css == '') {
		return null;
	}

	var res = {};
	var styles = css.split('\n');
	var styleTmplt = new RegExp(/^\.(\w)+(\s)*\{(\w|\s|\:|\-|\#|\;)*\}$/);

	for (var i = 0; i < styles.length; i++) {
		var style = styles[i];
		if (!styleTmplt.test(style)) {
			continue;
		}

		var tmp = style.split('{');
		var styleNm = tmp[0].substr(1).replace(/\s/g, '');

		var propertiesStr = tmp[1].substr(0, tmp[1].length - 1);
		var properties = propertiesStr.split(';');
		var styleObj = {};

		for (var j = 0; j < properties.length; j++) {
			tmp = properties[j].split(':');
			if (tmp.length == 2) {
				var propNm = tmp[0].replace(/\s/g, '');
				var propVl = tmp[1].replace(/\s/g, '');
				if (propNm) {
					styleObj[propNm] = propVl;
				}
			}
		}

		res[styleNm] = styleObj;
	}

	return res;
};

/**
 * Method to to apply the item style to teh grid cell
 * @param cell the grid cell object
 * @param {Object} style the style for the cell
 * @param {boolean} setBg boolean to set the background for the cell
 */
Aras.prototype.applyCellStyle = function (cell, style, setBg) {
	if (style['color']) {
		cell.setTextColor(style['color']);
	}
	if (setBg && style['background-color']) {
		cell.setBgColor_Experimental(style['background-color']);
	}
	if (style['font-family']) {
		var font = style['font-family'].split(',')[0];
		if (style['font-size']) {
			font += '-' + style['font-size'].split('p')[0];
		}
		cell.setFont(font);
	}
	if (style['font-weight'] && style['font-weight'] == 'bold') {
		cell.setTextBold();
	}
};

Aras.prototype.preserveTags = function (str) {
	if (str == undefined) {
		return;
	}

	if (str == '') {
		return str;
	}

	str = str.replace(/&/g, '&amp;');
	str = str.replace(/</g, '&lt;');
	str = str.replace(/>/g, '&gt;');

	return str;
};

Aras.prototype.escapeXMLAttribute = function (strIn) {
	if (strIn == undefined) {
		return;
	}

	if (strIn == '') {
		return strIn;
	}

	strIn = strIn.replace(/&/g, '&amp;');
	strIn = strIn.replace(/</g, '&lt;');
	strIn = strIn.replace(/>/g, '&gt;');
	strIn = strIn.replace(/"/g, '&quot;');
	strIn = strIn.replace(/'/g, '&apos;');

	return strIn;
};

/**
 * Returns a pointer to the main Aras object (from the main window)
 */
Aras.prototype.findMainArasObject = function Aras_findMainArasObject() {
	var isMainWindow = this.getMainWindow().name == this.mainWindowName;

	if (!isMainWindow) {
		if (this.parentArasObj) {
			return this.parentArasObj.findMainArasObject();
		} else {
			var topWnd = this.getMostTopWindowWithAras(window);
			if (
				topWnd.opener &&
				!this.isWindowClosed(topWnd.opener) &&
				topWnd.opener.topWnd.aras
			) {
				return topWnd.opener.topWnd.aras.findMainArasObject();
			}
		}
	}

	return this;
};

/**
 * Register Handler for event by win
 * see fireEvent description for details
 */
Aras.prototype.registerEventHandler = function Aras_registerEventHandler(
	eventName,
	win,
	handler
) {
	var EvHandlers;

	var topWnd = this.getMostTopWindowWithAras();

	try {
		EvHandlers = topWnd['Event Handlers'];
	} catch (excep) {
		return false;
	}

	if (!EvHandlers) {
		topWnd.eval("window['Event Handlers'] = {};");
		EvHandlers = topWnd['Event Handlers'];
	}

	if (!EvHandlers[eventName]) {
		topWnd.eval("window['Event Handlers']['" + eventName + "'] = [];");
	}

	EvHandlers[eventName].push(handler);

	return true;
};

/**
 * UnRegister Handler for event by win
 */
Aras.prototype.unregisterEventHandler = function Aras_unregisterEventHandler(
	eventName,
	win,
	handler
) {
	var EvHandlers;

	var topWnd = this.getMostTopWindowWithAras();

	try {
		EvHandlers = topWnd['Event Handlers'];
	} catch (excep) {
		return false;
	}

	if (!EvHandlers) {
		return true;
	}

	var handlersArr = EvHandlers[eventName];
	if (!handlersArr) {
		return true;
	}

	for (var i = 0; i < handlersArr.length; i++) {
		if (handlersArr[i] == handler) {
			handlersArr.splice(i, 1);
			return true;
		}
	}

	return false;
};

/**
 * fires event in all windows
 * supported events:
 * "VariableChanged": {varName, varValue}
 * "ItemLock": {itemID, itemNd, newLockedValue}
 * "ItemSave": {itemID, itemNd}
 * "ItemVersion": {itemPreviousVersion, itemLastVersion}
 * @param {string} eventName
 * @param params
 */
Aras.prototype.fireEvent = function Aras_fireEvent(eventName, params) {
	var mainAras = this.findMainArasObject();
	if (this != mainAras) {
		return mainAras.fireEvent(eventName, params);
	}

	if (!eventName) {
		return false;
	}

	var topWindow = this.getMostTopWindowWithAras(window);

	for (var winId in this.windowsByName) {
		if (!this.windowsByName.hasOwnProperty(winId)) {
			continue;
		}

		var win = null;
		try {
			win = this.windowsByName[winId];
			if (this.isWindowClosed(win)) {
				continue;
			}
			if (this.getMostTopWindowWithAras(win) == topWindow) {
				continue;
			}
		} catch (excep) {
			continue;
		}

		var EvHandlers = null;
		try {
			EvHandlers = this.getMostTopWindowWithAras(win)['Event Handlers'];
			if (!EvHandlers) {
				continue;
			}
		} catch (excep) {
			continue;
		}

		var handlersArr = EvHandlers[eventName];
		if (!handlersArr) {
			continue;
		}

		for (var i = 0; i < handlersArr.length; i++) {
			try {
				handlersArr[i](params);
			} catch (excep) {}
		}
	}

	var EvHandlers = topWindow['Event Handlers'] || {};
	var handlersArr = EvHandlers[eventName] || [];

	var handlers2Remove = [];

	for (var i = 0; i < handlersArr.length; i++) {
		var f = handlersArr[i];
		try {
			f(params);
		} catch (e) {
			// it's IE error code that means that a context of the method (handlersArr[i]) has already been freed and the method cannot be executed. Usually it would happen if window/iframe in which this method was
			// initialized was destroyed/closed. It would be better unregister such handlers after its window/iframe was destroyed/closed so that this error isn't occur at all.
			var resourceHasBeenFreedExceptionNumberInIE = -2146823277; // "Can't execute code from a freed script" IE error
			if (
				e.number == resourceHasBeenFreedExceptionNumberInIE ||
				this.Browser.isCh()
			) {
				// temporary fix for issue IR-039156 "No save after remove row from BOM tab".
				// The problem is that in Chrome browser "Can't execute code from a freed script" error hasn't a particular number/code so there is no possibility
				// to understand that exactly this error has occured. So as a temp fix all errors in Chrome will not be thrown as an exception.
				// todo In Innovator 12 we must remove this part of code (isCh() if) and make unregistering of 'ItemSaveListener' eventHandler on 'unload' event from Solutions/PLM/Import/Form/Part MultiLevel BOM.xml
				handlers2Remove.push(f);
			} else {
				throw e;
			}
		}
	}

	for (var i = handlers2Remove.length - 1; i >= 0; i--) {
		this.unregisterEventHandler(eventName, topWindow, handlers2Remove[i]);
	}

	const mainWindow = this.getMainWindow();
	if (mainWindow !== topWindow) {
		const mainWindowEventHandlers = mainWindow['Event Handlers'] || {};
		const currentEventHandlers = mainWindowEventHandlers[eventName] || [];
		currentEventHandlers.forEach((handler) => {
			try {
				handler(params);
			} catch (excep) {}
		});
	}
};

Aras.prototype.getCurrentWindow = function Aras_getCurrentWindow() {
	return window;
};

Aras.prototype.getMainWindow = function Aras_getMainWindow() {
	try {
		var mainWindow = this.getCommonPropertyValue('mainWindow');
		if (mainWindow) {
			return mainWindow;
		}

		var topWindowWithAras = this.getMostTopWindowWithAras(window);
		var isMainWindow = topWindowWithAras.name == this.mainWindowName;
		if (isMainWindow) {
			return topWindowWithAras;
		}

		//this function is to avoid explicit "top" usage
		function getTopWindow(windowObj) {
			var win = windowObj ? windowObj : window;
			while (win !== win.parent) {
				//We should not care about any cross-domain case since "main window" case is not considered here
				win = win.parent;
			}
			return win;
		}

		var topWnd = getTopWindow(),
			topWnd2;
		if (topWnd.opener && !this.isWindowClosed(topWnd.opener)) {
			topWnd2 = this.getMostTopWindowWithAras(topWnd.opener);
			topWnd2 = this.isWindowClosed(topWnd2) ? null : topWnd2;
		}
		if (!topWnd2) {
			topWnd2 = this.getMostTopWindowWithAras(topWnd.dialogOpener);
			topWnd2 = this.isWindowClosed(topWnd2) ? null : topWnd2;
		}

		return topWnd2 ? topWnd2.aras.getMainWindow() : topWnd;
	} catch (excep) {
		return null;
	}
};

Aras.prototype.getMainArasObject = function Aras_getMainArasObject() {
	var res = null;

	var mainWnd = this.getMainWindow();
	if (mainWnd && !this.isWindowClosed(mainWnd)) {
		res = mainWnd.aras;
	}

	return res;
};

Aras.prototype.newQryItem = function Aras_newQryItem(itemTypeName) {
	var mainArasObj = this.getMainArasObject();

	if (mainArasObj && mainArasObj != this) {
		return mainArasObj.newQryItem(itemTypeName);
	} else {
		var topWnd = this.getMostTopWindowWithAras(window);
		return new topWnd.QryItem(topWnd.aras, itemTypeName);
	}
};

Aras.prototype.newObject = function Aras_newObject() {
	var mainArasObj = this.getMainArasObject();

	if (mainArasObj && mainArasObj != this) {
		return mainArasObj.newObject();
	} else {
		return {};
	}
};
Aras.prototype.deletePropertyFromObject = function Aras_deletePropertyFromObject(
	obj,
	key
) {
	if (key in obj) {
		return delete obj[key];
	}
	return true;
};

Aras.prototype.newIOMItem = function Aras_newIOMItem(itemTypeName, action) {
	return this.IomInnovator.newItem(itemTypeName, action);
};

Aras.prototype.newIOMInnovator = function Aras_newIOMInnovator(contextAras) {
	var mainArasObj = this.getMainArasObject();
	if (mainArasObj && mainArasObj != this) {
		return mainArasObj.newIOMInnovator(this);
	} else {
		//It's important to pass InnovatorServerConnector constructor by *contextAras* instead of *mainArasObj* so that IE could properly work with files selected by a user.
		//A problem is that in IE we have no access to files created by any other window.
		//So reading/sending/saving of the files must be performed in a context of the window created the files
		//because for each new window there is a new Vault object (that is contained in own arasObject) and this Vault object works with files of the window.
		//Note: previously each instance of InnovatorServerConnector was passed only by *mainArasObj*.
		var connector = new Aras.IOM.InnovatorServerConnector(contextAras || this);
		return this.IomFactory.CreateInnovator(connector);
	}
};

Aras.prototype.newArray = function Aras_newArray() {
	var mainArasObj = this.getMainArasObject();

	if (mainArasObj && mainArasObj != this) {
		var str2eval = '';
		for (var i = 0; i < arguments.length; i++) {
			str2eval += 'args[' + i + '],';
		}
		if (str2eval != '') {
			str2eval = str2eval.substr(0, str2eval.length - 1);
		}
		str2eval = 'return mainArasObj.newArray(' + str2eval + ');';

		var f = new Function('mainArasObj', 'args', str2eval);
		return f(mainArasObj, arguments);
	} else {
		var res;
		if (arguments.length == 1) {
			res = new Array(arguments[0]);
		} else {
			res = [];
			for (var i = 0; i < arguments.length; i++) {
				res.push(arguments[i]);
			}
		}

		res.concat = function newArray_concat() {
			var resArr = [];
			for (var i = 0; i < this.length; i++) {
				resArr[i] = this[i];
			}

			for (var i = 0; i < arguments.length; i++) {
				if (arguments[i].pop) {
					for (var j = 0; j < arguments[i].length; j++) {
						resArr.push(arguments[i][j]);
					}
				} else {
					resArr.push(arguments[i]);
				}
			}

			return resArr;
		};

		return res;
	}
};

Aras.prototype.getFileItemTypeID = function Aras_getFileItemTypeID() {
	return this.getItemTypeId('File');
};

Aras.prototype.cloneForm = function Aras_cloneForm(formID, newFormName) {
	if (!formID || !newFormName) {
		return false;
	}

	var bodyStr =
		'<Item type="Form" id="' +
		formID +
		'" newFormName="' +
		newFormName +
		'" do_lock="true" />';
	var res = null;

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'aras_object.copying_form'),
		system_progressbar1_gif
	);
	res = this.soapSend('CloneForm', bodyStr);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		var win = this.uiFindWindowEx(formID);
		if (!win) {
			win = window;
		}
		this.AlertError(res, win);
		return false;
	}

	return true;
};

/**
 * Return Vault Server url for current User
 * @returns {string}
 */
Aras.prototype.getVaultServerURL = function Aras_getVaultServerURL() {
	var vaultServerID = this.getVaultServerID();
	if (!vaultServerID) {
		return '';
	}

	if (this.vaultServerURL != undefined) {
		return this.vaultServerURL;
	}

	var vaultNd =
		this.itemsCache.getItem(vaultServerID) ||
		this.getItemById('Vault', vaultServerID, 0, '', 'vault_url,name');
	if (!vaultNd) {
		return '';
	}

	var vaultServerURL = this.getItemProperty(vaultNd, 'vault_url');
	this.VaultServerURL = this.TransformVaultServerURL(vaultServerURL);
	return this.VaultServerURL;
};

Aras.prototype.TransformVaultServerURL = function Aras_TransformVaultServerURL(
	url
) {
	var xform_url = this.VaultServerURLCache[url];
	if (xform_url != undefined) {
		return xform_url;
	}

	var res = this.soapSend('TransformVaultServerURL', '<url>' + url + '</url>');

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return url;
	}

	var rb = res.getResult();
	xform_url = rb.text;

	var vaultBaseUrl = xform_url + '/..';

	this.VaultServerURLCache[url] = xform_url;
	return xform_url;
};

/**
 * Get Vault Server ID for current User
 * @returns {string} id of Vault Server
 */
Aras.prototype.getVaultServerID = function Aras_getVaultServerID() {
	return this.user.userInfo.defaultVault;
};

/**
 * Create Xml Element. If parent variable exist, add element as child
 * @param {string} elName element name to be created
 * @param {} parent parent element
 * @returns {}
 */
Aras.prototype.createXmlElement = function (elName, parent) {
	var doc = this.createXMLDocument();
	var element = doc.createElement(elName);
	if (parent) {
		parent.appendChild(element);
	}
	return element;
};

/**
 * provide simple way to create xml documents without specifing needed attributes each time
 */
Aras.prototype.createXMLDocument = function Aras_createXMLDocument() {
	var mainArasObj = this.getMainArasObject();

	if (mainArasObj && mainArasObj != this) {
		return mainArasObj.createXMLDocument();
	} else {
		return new XmlDocument();
	}
};

/**
 * check if xmldom (soap message) contains Fault
 * @param xmlDom xml document with soap message
 * @param {boolean} ignoreZeroFault ignore zero faultcode or not
 * @returns {boolean}
 */
Aras.prototype.hasFault = function Aras_hasFault(xmlDom, ignoreZeroFault) {
	if (ignoreZeroFault) {
		return xmlDom.selectSingleNode(this.XPathFault("[faultcode!='0']")) != null;
	} else {
		return xmlDom.selectSingleNode(this.XPathFault()) != null;
	}
};

/**
 * get text with fault details
 * @param xmlDom xml document with soap message
 * @returns {string}
 */
Aras.prototype.getFaultDetails = function Aras_getFaultDetails(xmlDom) {
	var fdNd = xmlDom.selectSingleNode(this.XPathFault('/detail'));

	if (fdNd == null) {
		return '';
	} else {
		return fdNd.text;
	}
};

/**
 * Get text with faultstring
 * @param xmlDom xml document with soap message
 * @returns {string}
 */
Aras.prototype.getFaultString = function Aras_getFaultString(xmlDom) {
	var fdNd = xmlDom.selectSingleNode(this.XPathFault('/faultstring'));

	if (fdNd == null) {
		return '';
	} else {
		return fdNd.text;
	}
};

/**
 * get text with faultactor (contains stack trace)
 * @param xmlDom xml document with soap message
 * @returns {string}
 */
Aras.prototype.getFaultActor = function Aras_getFaultActor(xmlDom) {
	var fdNd = xmlDom.selectSingleNode(
		this.XPathFault('/detail/legacy_faultactor')
	);

	if (fdNd == null) {
		return '';
	} else {
		return fdNd.text;
	}
};

Aras.prototype.isInCache = function Aras_isInCache(itemID) {
	return this.itemsCache.hasItem(itemID);
};

Aras.prototype.addToCache = function Aras_addToCache(item) {
	if (!item) {
		return new CacheResponse(
			false,
			this.getResource('', 'aras_object.nothing_to_add'),
			item
		);
	}

	var itemID = item.getAttribute('id');
	if (this.isInCache(itemID)) {
		return new CacheResponse(
			false,
			this.getResource('', 'aras_object.already_in_cache'),
			this.getFromCache(itemID)
		);
	}

	this.itemsCache.addItem(item);
	return new CacheResponse(true, '', this.getFromCache(itemID));
};

Aras.prototype.updateInCache = function Aras_updateInCache(item) {
	if (!item) {
		return new CacheResponse(
			false,
			this.getResource('', 'aras_object.nothing_to_update'),
			item
		);
	}

	var itemID = item.getAttribute('id');
	this.itemsCache.updateItem(item);
	return new CacheResponse(true, '', this.getFromCache(itemID));
};

Aras.prototype.updateInCacheEx = function Aras_updateInCacheEx(oldItm, newItm) {
	if (!oldItm) {
		return this.addToCache(newItm);
	}
	if (!newItm) {
		return new CacheResponse(
			false,
			this.getResource('', 'aras_object.nothing_to_update'),
			newItm
		);
	}

	var itemID = newItm.getAttribute('id');
	this.itemsCache.updateItemEx(oldItm, newItm);
	return new CacheResponse(true, '', this.getFromCache(itemID));
};

Aras.prototype.removeFromCache = function Aras_removeFromCache(item) {
	if (!item) {
		return new CacheResponse(
			false,
			this.getResource('', 'aras_object.nothing_to_remove'),
			item
		);
	}

	var paramType = typeof item;
	var itemID;
	if (paramType == 'string') {
		itemID = item;
	} else if (paramType == 'object') {
		itemID = item.getAttribute('id');
	}

	if (this.isInCache(itemID)) {
		this.itemsCache.deleteItem(itemID);
	}

	return new CacheResponse(true, '', null);
};

Aras.prototype.getFromCache = function getFromCache(itemID) {
	if (!itemID) {
		return null;
	} else {
		return this.itemsCache.getItem(itemID);
	}
};

Aras.prototype.isPropFilledOnServer = function isPropFilledOnServer(propName) {
	if (!propName) {
		return false;
	}

	var props = '^permission_id$|^created_on$|^created_by_id$|^config_id$';
	return propName.search(props) != -1;
};

Aras.prototype.generateExceptionDetails = function Aras_generateExceptionDetails(
	err,
	func
) {
	var resXMLDOM = this.createXMLDocument();

	resXMLDOM.loadXML('<Exception />');

	var callStackCounter = 0;
	var callStack = null;

	function addChNode(pNode, chName, chValue) {
		var tmp = pNode.appendChild(resXMLDOM.createElement(chName));
		if (chValue != '') {
			tmp.text = chValue;
		}
		return tmp;
	}

	function getFunctionName(func) {
		if (!func) {
			return this.getResource('', 'aras_object.incorrect_parameter');
		}
		if (typeof func != 'function') {
			return this.getResource('', 'aras_object.not_function');
		}

		var funcDef = func.toString();
		funcDef = funcDef.replace(/\/\*([^\*\/]|\*[^\/]|\/)*\*\//g, '');
		funcDef = funcDef.replace(/^\s\/\/.*$/gm, '');

		/^function([^\(]*)/.exec(funcDef);
		var funcName = RegExp.$1;
		funcName = funcName.replace(/\s/g, '');

		return funcName;
	}

	function addCallStackEntry(aCaller) {
		var funcName;
		var funcBody;

		if (aCaller) {
			funcName = getFunctionName(aCaller);
			funcBody = aCaller.toString();
		} else {
			funcName = 'global code';
			funcBody = 'unknown';
		}

		var fNd = addChNode(callStack, 'function', '');
		fNd.setAttribute('name', funcName);
		fNd.setAttribute('order', callStackCounter);

		var callArgsNd = addChNode(fNd, 'call_arguments', '');
		if (aCaller) {
			for (var i = 0; i < aCaller.arguments.length; i++) {
				var argVal = aCaller.arguments[i];
				var argType = 'string';

				if (argVal != undefined) {
					if (argVal.xml != undefined) {
						argType = 'xml';
						argVal = argVal.xml;
					}
				}

				var argNd = addChNode(callArgsNd, 'argument', argVal);
				argNd.setAttribute('order', i);
				argNd.setAttribute('type', argType);
			}
		}

		addChNode(fNd, 'body', funcBody);

		callStackCounter++;
	}

	var root = resXMLDOM.documentElement;
	try {
		addChNode(root, 'number', err.number);
		addChNode(root, 'message', err.message);

		var aCaller = func;
		callStack = addChNode(root, 'call_stack', '');

		while (aCaller) {
			addCallStackEntry(aCaller);
			aCaller = aCaller.caller;
			if (aCaller.caller.length) {
				break;
			}
		}
		addCallStackEntry(aCaller);
	} catch (ex2) {
		root.text = ex2.message;
	}

	return resXMLDOM.xml;
};

Aras.prototype.copyRelationship = function Aras_copyRelationship(
	relationshipType,
	relationshipID
) {
	var relResult = this.getItemById(
		relationshipType,
		relationshipID,
		0,
		undefined
	);
	var sourceType = this.getItemPropertyAttribute(
		relResult,
		'source_id',
		'type'
	);
	var sourceID = this.getItemProperty(relResult, 'source_id');
	var sourceKeyedName = this.getItemPropertyAttribute(
		relResult,
		'source_id',
		'keyed_name'
	);

	var relatedItem = this.getRelatedItem(relResult);

	var relatedType = '';
	var relatedID = '';
	var relatedKeyedName = '';

	if (
		!relatedItem ||
		(relatedItem && '1' == relatedItem.getAttribute('is_polymorphic'))
	) {
		var relType = this.getRelationshipType(
			this.getRelationshipTypeId(relationshipType)
		);
		if (!relType || relType.isError()) {
			return;
		}

		relatedType = this.getItemPropertyAttribute(
			relType.node,
			'related_id',
			'name'
		);
		relatedKeyedName = this.getItemPropertyAttribute(
			relType.node,
			'related_id',
			'keyed_name'
		);
	} else {
		relatedID = relatedItem.getAttribute('id');
		relatedType = relatedItem.getAttribute('type');
		relatedKeyedName = this.getItemProperty(relatedItem, 'keyed_name');
	}

	var clipboardItem = this.newObject();
	clipboardItem.source_id = sourceID;
	clipboardItem.source_itemtype = sourceType;
	clipboardItem.source_keyedname = sourceKeyedName;
	clipboardItem.relationship_id = relationshipID;
	clipboardItem.relationship_itemtype = relationshipType;
	clipboardItem.related_id = relatedID;
	clipboardItem.related_itemtype = relatedType;
	clipboardItem.related_keyedname = relatedKeyedName;

	return clipboardItem;
};

Aras.prototype.pasteRelationship = function Aras_pasteRelationship(
	parentItem,
	clipboardItem,
	as_is,
	as_new,
	targetRelationshipTN,
	targetRelatedTN,
	showConfirmDlg
) {
	var self = this;

	function getProperties4ItemType(itemTypeName) {
		if (!itemTypeName) {
			return;
		}

		var qryItem = new Item('ItemType', 'get');
		qryItem.setAttribute('select', 'name');
		qryItem.setAttribute('page', 1);
		qryItem.setAttribute('pagesize', 9999);
		qryItem.setProperty('name', itemTypeName);

		var relationshipItem = new Item();
		relationshipItem.setType('Property');
		relationshipItem.setAction('get');
		relationshipItem.setAttribute('select', 'name,data_type');
		qryItem.addRelationship(relationshipItem);

		var results = qryItem.apply();
		if (results.isError()) {
			self.AlertError(result);
			return;
		}

		return results.getRelationships('Property');
	}

	function setRelated(targetItem) {
		if (relatedType && relatedType !== 'File') {
			var relatedItemType = self.getItemTypeForClient(relatedType, 'name');
			if (relatedItemType.getProperty('is_dependent') == '1') {
				as_new = true;
			}

			if (as_new == true) {
				var queryItemRelated = new Item();
				queryItemRelated.setType(relatedType);
				queryItemRelated.setID(relatedID);
				queryItemRelated.setAttribute('do_add', '0');
				queryItemRelated.setAttribute('do_lock', '0');
				queryItemRelated.setAction('copy');
				var newRelatedItem = queryItemRelated.apply();
				if (newRelatedItem.isError()) {
					self.AlertError(
						self.getResource(
							'',
							'aras_object.failed_copy_related_item',
							newRelatedItem.getErrorDetail()
						),
						newRelatedItem.getErrorString(),
						newRelatedItem.getErrorSource()
					);
					return false;
				}
				targetItem.setRelatedItem(newRelatedItem);
			}
		}
	}

	if (as_is == undefined || as_new == undefined) {
		var qryItem4RelationshipType = new Item();
		qryItem4RelationshipType.setType('RelationshipType');
		qryItem4RelationshipType.setProperty('name', relationshipType);
		qryItem4RelationshipType.setAction('get');
		qryItem4RelationshipType.setAttribute(
			'select',
			'copy_permissions, create_related'
		);
		var RelNode = qryItem4RelationshipType.apply();
		if (as_is == undefined) {
			as_is = RelNode.getProperty('copy_permissions') == '1';
		}
		if (as_new == undefined) {
			as_new = RelNode.getProperty('create_related') == '1';
		}
	}

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'aras_object.pasting_in_progress'),
		system_progressbar1_gif
	);
	if (!clipboardItem) {
		return;
	}

	var relationshipType = clipboardItem.relationship_itemtype;
	var relationshipID = clipboardItem.relationship_id;
	var relatedID = clipboardItem.related_id;
	var relatedType = clipboardItem.related_itemtype;

	if (relationshipType == targetRelationshipTN) {
		var qryItem4CopyRelationship = new Item();
		qryItem4CopyRelationship.setType(relationshipType);
		qryItem4CopyRelationship.setID(relationshipID);
		qryItem4CopyRelationship.setAction('copy');
		qryItem4CopyRelationship.setAttribute('do_add', '0');
		qryItem4CopyRelationship.setAttribute('do_lock', '0');

		var newRelationship = qryItem4CopyRelationship.apply();
		if (newRelationship.isError()) {
			this.AlertError(
				this.getResource(
					'',
					'aras_object.copy_operation_failed',
					newRelationship.getErrorDetail()
				),
				newRelationship.getErrorString(),
				newRelationship.getErrorSource()
			);
			this.clearStatusMessage(statusId);
			return false;
		}
		newRelationship.removeProperty('source_id');
		const newRelationshipId = newRelationship.getAttribute('id');
		newRelationship.setProperty('id', newRelationshipId);
		newRelationship.setProperty('config_id', newRelationshipId);

		if (
			newRelationship.getType() == 'Property' &&
			newRelationship.getProperty('data_type') == 'foreign'
		) {
			newRelationship.removeProperty('data_source');
			newRelationship.removeProperty('foreign_property');
		}

		setRelated(newRelationship);

		if (!parentItem.selectSingleNode('Relationships')) {
			parentItem.appendChild(
				parentItem.ownerDocument.createElement('Relationships')
			);
		}
		var res = parentItem
			.selectSingleNode('Relationships')
			.appendChild(newRelationship.node.cloneNode(true));
		this.clearStatusMessage(statusId);
		parentItem.setAttribute('isDirty', '1');
		return res;
	}
	var topWnd = this.getMostTopWindowWithAras(window);
	var item = new topWnd.Item(relationshipType, 'get');
	item.setID(relationshipID);
	var sourceItem = item.apply();

	if (sourceItem.getAttribute('isNew') == '1') {
		this.AlertError(
			this.getResource('', 'aras_object.failed_get_source_item'),
			'',
			''
		);
		this.clearStatusMessage(statusId);
		return false;
	}
	sourceRelationshipTN = sourceItem.getType();

	var targetItem = new Item();
	targetItem.setType(sourceRelationshipTN);
	targetItem.setAttribute('typeId', sourceItem.getAttribute('typeId'));

	if (targetRelationshipTN == undefined) {
		targetRelationshipTN = sourceRelationshipTN;
	}

	if (sourceRelationshipTN != targetRelationshipTN) {
		if ((!targetRelatedTN && !relatedType) || targetRelatedTN == relatedType) {
			if (showConfirmDlg) {
				var convert = this.confirm(
					this.getResource(
						'',
						'aras_object.you_attempting_paste_different_relationship_types',
						sourceRelationshipTN,
						targetRelationshipTN
					)
				);
				if (!convert) {
					this.clearStatusMessage(statusId);
					return this.getResource('', 'aras_object.user_abort');
				}
			}
			targetItem.setType(targetRelationshipTN);
		} else {
			this.clearStatusMessage(statusId);
			return false;
		}
	}

	targetItem.setNewID();
	targetItem.setAction('add');
	targetItem.setAttribute('isTemp', '1');
	parentItem.setAttribute('isDirty', '1');

	var sourceProperties = getProperties4ItemType(sourceRelationshipTN);
	var targetProperties = getProperties4ItemType(targetRelationshipTN);

	var srcCount = sourceProperties.getItemCount();
	var trgCount = targetProperties.getItemCount();

	var sysProperties =
		'^id$|' +
		'^created_by_id$|' +
		'^created_on$|' +
		'^modified_by_id$|' +
		'^modified_on$|' +
		'^classification$|' +
		'^keyed_name$|' +
		'^current_state$|' +
		'^state$|' +
		'^locked_by_id$|' +
		'^is_current$|' +
		'^major_rev$|' +
		'^minor_rev$|' +
		'^is_released$|' +
		'^not_lockable$|' +
		'^css$|' +
		'^source_id$|' +
		'^behavior$|' +
		'^sort_order$|' +
		'^config_id$|' +
		'^new_version$|' +
		'^generation$|' +
		'^managed_by_id$|' +
		'^owned_by_id$|' +
		'^history_id$|' +
		'^relationship_id$';

	if (as_is != true) {
		sysProperties += '|^permission_id$';
	}

	var regSysProperties = new RegExp(sysProperties, 'ig');
	for (var i = 0; i < srcCount; i++) {
		var sourceProperty = sourceProperties.getItemByIndex(i);
		var srcPropertyName = sourceProperty.getProperty('name');
		var srcPropertyDataType = sourceProperty.getProperty('data_type');

		if (srcPropertyName.search(regSysProperties) != -1) {
			continue;
		}

		for (var j = 0; j < trgCount; ++j) {
			var targetProperty = targetProperties.getItemByIndex(j);
			var trgPropertyName = targetProperty.getProperty('name');
			var trgPropertyDataType = targetProperty.getProperty('data_type');

			if (
				srcPropertyName == trgPropertyName &&
				srcPropertyDataType == trgPropertyDataType
			) {
				var item = sourceItem.getPropertyItem(srcPropertyName);
				if (!item) {
					var value = sourceItem.getProperty(srcPropertyName);
					targetItem.setProperty(srcPropertyName, value);
				} else {
					targetItem.setPropertyItem(srcPropertyName, item);
				}
				break;
			}
		}
	}
	setRelated(targetItem);
	if (!parentItem.selectSingleNode('Relationships')) {
		parentItem.appendChild(
			parentItem.ownerDocument.createElement('Relationships')
		);
	}
	var res = parentItem
		.selectSingleNode('Relationships')
		.appendChild(targetItem.node.cloneNode(true));
	this.clearStatusMessage(statusId);
	return res;
};

Aras.prototype.isLCNCompatibleWithRT = function Aras_isLastCopyNodeCompatibleWithRelationshipType(
	targetRelatedTN
) {
	var sourceRelatedTN = this.clipboard.getLastCopyRelatedItemTypeName();
	if (!sourceRelatedTN && !targetRelatedTN) {
		return true;
	}
	if (sourceRelatedTN == targetRelatedTN) {
		return true;
	}
	return false;
};

Aras.prototype.isLCNCompatibleWithRTOnly = function Aras_isLastCopyNodeCompatibleWithRelationshipTypeOnly(
	targetRelationshipTN
) {
	var sourceRelationshipTN = this.clipboard.getLastCopyRTName();
	if (!sourceRelationshipTN && !targetRelationshipTN) {
		return true;
	}
	if (sourceRelationshipTN == targetRelationshipTN) {
		return true;
	}
	return false;
};

Aras.prototype.isLCNCompatibleWithIT = function Aras_isLastCopyNodeCompatibleWithItemType(
	itemTypeID
) {
	var clipboardItem = this.clipboard.getLastCopyItem();
	return this.isClItemCompatibleWithIT(clipboardItem, itemTypeID);
};

Aras.prototype.isClItemCompatibleWithIT = function Aras_IsClipboardItemCompatibleWithItemType(
	clipboardItem,
	itemTypeID
) {
	var RelationshipTypeName = clipboardItem.relationship_itemtype;

	if (!RelationshipTypeName || !itemTypeID) {
		return false;
	}

	return this.getRelationshipTypeId(RelationshipTypeName) != '';
};

Aras.prototype.isClItemCompatibleWithRT = function Aras_IsClipboardItemCompatibleWithRelationshipType(
	clipboardItem,
	targetRelatedTN
) {
	var sourceRelatedTN = clipboardItem.related_itemtype;
	if (!sourceRelatedTN && !targetRelatedTN) {
		return true;
	}
	if (sourceRelatedTN == targetRelatedTN) {
		return true;
	}
	return false;
};

/**
 * Returns the Active and Pending tasks for the user (Workflow Activities, Project Activities, FMEA Action Items).
 * The users tasks are those assigned to an Identity for which the user is a Member
 * @param {string} inBasketViewMode
 * @param {number} workflowTasks boolean AML value. 1 or 0
 * @param {number} projectTasks boolean AML value. 1 or 0
 * @param {number} actionTasks boolean AML value. 1 or 0
 * @returns {}
 */
Aras.prototype.getAssignedTasks = function (
	inBasketViewMode,
	workflowTasks,
	projectTasks,
	actionTasks
) {
	var body =
		'<params><inBasketViewMode>' + inBasketViewMode + '</inBasketViewMode>';
	body += '<workflowTasks>' + workflowTasks + '</workflowTasks>';
	body += '<projectTasks>' + projectTasks + '</projectTasks>';
	body += '<actionTasks>' + actionTasks + '</actionTasks></params>';
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.getting_user_activities'),
		system_progressbar1_gif
	);
	var res = this.soapSend('GetAssignedTasks', body);

	if (statusId != -1) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return false;
	}

	var r = res.getResult().selectSingleNode('./Item').text;
	var s1 = r.indexOf('<thead>');
	var s2 = r.indexOf('</thead>', s1);
	if (r && s1 > -1 && s2 > -1) {
		var s =
			'<thead>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.locked_column_nm') +
			']]></th>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.type_column_nm') +
			']]></th>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.workflow_project_column_nm') +
			']]></th>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.activity_name_column_nm') +
			']]></th>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.status_column_nm') +
			']]></th>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.start_date_column_nm') +
			']]></th>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.end_date_column_nm') +
			']]></th>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.instrucations_column_nm') +
			']]></th>' +
			'<th><![CDATA[' +
			this.getResource('', 'inbasket.assigned_to_column_nm') +
			']]></th>' +
			'</thead>';
		r = r.substr(0, s1) + s + r.substr(s2 + 8);
	}
	return r;
};

Aras.prototype.getFormForDisplay = function Aras_getFormForDisplay(id, mode) {
	// this function is not a part of public API. please do not use it
	var criteriaName = mode == 'by-name' ? 'name' : 'id';
	var resIOMItem;
	// if form is new return form from client cache
	var formNd = this.itemsCache.getItem(id);
	if (formNd && this.isTempEx(formNd)) {
		resIOMItem = this.newIOMItem();
		resIOMItem.dom = formNd.ownerDocument;
		resIOMItem.node = formNd;
		return resIOMItem;
	}

	res = this.MetadataCache.GetForm(id, criteriaName);

	if (res.getFaultCode() != 0) {
		var resIOMError = this.newIOMInnovator().newError(res.getFaultString());
		return resIOMError;
	}

	res = res.getResult();
	resIOMItem = this.newIOMItem();
	resIOMItem.dom = res.ownerDocument;
	resIOMItem.node = res.selectSingleNode('Item');

	// Mark that the item type was requested by main thread in this session
	var ftypeName;
	try {
		ftypeName = resIOMItem.getProperty('name');
	} catch (exc) {
		ftypeName = null;
	}

	return resIOMItem;
};

Aras.prototype.clearClientMetadataCache = function Aras_resetCachedMetadataOnClient() {
	this.MetadataCache.ClearCache();
};

Aras.prototype.getCacheObject = function Aras_getCacheObject() {
	//this is private internal function
	var mainWnd = this.getMainWindow();
	var Cache = mainWnd.Cache;

	if (!Cache) {
		Cache = this.newObject();
		mainWnd.Cache = Cache;
	}

	//for now because there are places where cache is accessed directly instead of call to this function
	if (!Cache.XmlResourcesUrls) {
		Cache.XmlResourcesUrls = this.newObject();
	}
	if (!Cache.UIResources) {
		Cache.UIResources = this.newObject();
	}

	return mainWnd.Cache;
};

Aras.prototype.getItemTypeDictionaryJson = function Aras_getItemTypeDictionaryJson(
	criteriaValue,
	criteriaName
) {
	return this.MetadataCacheJson.GetItemType(criteriaValue, criteriaName);
};

/**
 * Search item by specific criteria.
 * @deprecated Use getItemTypeForClient() instead.
 * @param {string} criteriaValue Value of criteria.
 * @param {'id'|'name'} [criteriaName=name] Name of criteria for search. Can be 'id' or 'name'. 'name' by default.
 * @returns {Object}
 */
Aras.prototype.getItemTypeDictionary = function Aras_getItemTypeDictionary(
	criteriaValue,
	criteriaName
) {
	return this.getItemTypeForClient(criteriaValue, criteriaName);
};

/**
 * Search item by specific criteria.
 * @param {string} criteriaValue Value of criteria.
 * @param {'id'|'name'} [criteriaName=name] Name of criteria for search. Can be 'id' or 'name'. 'name' by default.
 * @returns {Object}
 */
Aras.prototype.getItemTypeForClient = function Aras_getItemTypeForClient(
	criteriaValue,
	criteriaName
) {
	//this function is a very specific function. please use it only if it is critical for you
	//and there is no another good way to solve your task.
	var res = this.getItemTypeForClientFromCache(criteriaValue, criteriaName);
	if (res.getFaultCode() != 0) {
		var resIOMError = this.newIOMInnovator().newError(res.getFaultString());
		return resIOMError;
	}

	res = res.getResult();
	var resIOMItem = this.newIOMItem();
	resIOMItem.dom = res.ownerDocument;
	resIOMItem.node = res.selectSingleNode('Item');
	return resIOMItem;
};

Aras.prototype.getItemTypeForClientFromCache = function Aras_getItemTypeForClientFromCache(
	criteriaValue,
	criteriaName
) {
	if (criteriaName === undefined) {
		criteriaName = 'name';
	}

	if (criteriaName !== 'name' && criteriaName !== 'id') {
		throw new Error(
			1,
			this.getResource('', 'aras_object.not_supported_criteria', criteriaName)
		);
	}

	var res = this.MetadataCache.GetItemType(criteriaValue, criteriaName);
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return res;
	}
	return res;
};

Aras.prototype.getItemTypeNodeForClient = function Aras_getItemTypeNodeForClient(
	criteriaValue,
	criteriaName
) {
	var res = this.getItemTypeForClientFromCache(criteriaValue, criteriaName);
	if (res.getFaultCode() != 0) {
		var resIOMError = this.newIOMInnovator().newError(res.getFaultString());
		return resIOMError.node;
	}
	return res.getResult().selectSingleNode('Item');
};

Aras.prototype.getItemTypeId = function Aras_getItemTypeId(name) {
	return this.MetadataCache.GetItemTypeId(name);
};

Aras.prototype.getItemTypeName = function Aras_getItemTypeName(id) {
	return this.MetadataCache.GetItemTypeName(id);
};

Aras.prototype.getRelationshipTypeId = function Aras_getRelationshipTypeId(
	name
) {
	return this.MetadataCache.GetRelationshipTypeId(name);
};

Aras.prototype.getRelationshipTypeName = function Aras_getRelationshipTypeId(
	id
) {
	return this.MetadataCache.GetRelationshipTypeName(id);
};

Aras.prototype.getListId = function Aras_getListId(name) {
	var key = this.MetadataCache.CreateCacheKey('getListId', name);
	var result = this.MetadataCache.GetItem(key);
	if (!result) {
		var value = this.getItemFromServerByName('List', name, 'name', false);
		if (!value) {
			return '';
		}

		result = value.getID();
		this.MetadataCache.SetItem(key, result);
	}

	return result;
};

Aras.prototype.getFormId = function Aras_getFormId(name) {
	return this.MetadataCache.GetFormId(name);
};

Aras.prototype.getRelationshipType = function Aras_getRelationshipType(id) {
	var res = this.MetadataCache.GetRelationshipType(id, 'id');
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
	}
	res = res.getResult();

	var resIOMItem = this.newIOMItem();
	resIOMItem.dom = res.ownerDocument;
	resIOMItem.node = res.selectSingleNode('Item');

	return resIOMItem;
};

Aras.prototype.getLanguagesResultNd = function Aras_getLanguagesResultNd() {
	var cacheKey = this.MetadataCache.CreateCacheKey(
		'getLanguagesResultNd',
		'Language'
	);
	var cachedItem = this.MetadataCache.GetItem(cacheKey);

	if (cachedItem) {
		return cachedItem.content;
	}

	var res = this.getMainWindow().arasMainWindowInfo.getLanguageResult;
	if (res.getFaultCode() != 0) {
		return null;
	}
	var langs = res.results.selectSingleNode(this.XPathResult(''));

	cachedItem = aras.IomFactory.CreateCacheableContainer(langs, langs);
	this.MetadataCache.SetItem(cacheKey, cachedItem);

	return cachedItem.content;
};

Aras.prototype.getLocalesResultNd = function Aras_getLocalesResultNd() {
	var cacheKey = this.MetadataCache.CreateCacheKey(
		'getLocalesResultNd',
		'Locale'
	);
	var cachedItem = this.MetadataCache.GetItem(cacheKey);

	if (cachedItem) {
		return cachedItem.content;
	}

	var res = this.soapSend(
		'ApplyItem',
		"<Item type='Locale' action='get' select='code, name, language'/>"
	);
	if (res.getFaultCode() != 0) {
		return null;
	}
	var langs = res.results.selectSingleNode(this.XPathResult(''));

	cachedItem = aras.IomFactory.CreateCacheableContainer(langs, langs);
	this.MetadataCache.SetItem(cacheKey, cachedItem);

	return cachedItem.content;
};

Aras.prototype.getItemFromServer = function Aras_getItemFromServer(
	itemTypeName,
	id,
	selectAttr,
	related_expand,
	language
) {
	if (!related_expand) {
		related_expand = false;
	}
	if (!selectAttr) {
		selectAttr = '';
	}
	var qry = this.getMostTopWindowWithAras(window).Item(itemTypeName, 'get');
	qry.setAttribute('related_expand', related_expand ? '1' : '0');
	qry.setAttribute('select', selectAttr);
	qry.setProperty('id', id);
	if (language) {
		qry.setAttribute('language', language);
	}

	var results = qry.apply();

	if (results.isEmpty()) {
		return false;
	}

	if (results.isError()) {
		this.AlertError(results);
		return false;
	}

	return results.getItemByIndex(0);
};

Aras.prototype.getItemFromServerByName = function Aras_getItemFromServer(
	itemTypeName,
	name,
	selectAttr,
	related_expand
) {
	if (!related_expand) {
		related_expand = false;
	}

	var qry = this.newIOMItem(itemTypeName, 'get');
	qry.setAttribute('related_expand', related_expand ? '1' : '0');
	qry.setAttribute('select', selectAttr);
	qry.setProperty('name', name);

	var results = qry.apply();

	if (results.isEmpty()) {
		return false;
	}

	if (results.isError()) {
		this.AlertError(results);
		return false;
	}

	return results.getItemByIndex(0);
};

Aras.prototype.getItemFromServerWithRels = function Aras_getItemFromServerWithRels(
	itemTypeName,
	id,
	itemSelect,
	reltypeName,
	relSelect,
	related_expand
) {
	if (!related_expand) {
		related_expand = false;
	}

	var qry = this.getMostTopWindowWithAras(window).Item(itemTypeName, 'get');
	qry.setProperty('id', id);
	qry.setAttribute('select', itemSelect);

	if (reltypeName) {
		var topWnd = this.getMostTopWindowWithAras(window);
		var rel = new topWnd.Item(reltypeName, 'get');
		rel.setAttribute('select', relSelect);
		rel.setAttribute('related_expand', related_expand ? '1' : '0');
		qry.addRelationship(rel);
	}

	var results = qry.apply();

	if (results.isEmpty()) {
		return false;
	}

	if (results.isError()) {
		this.AlertError(results);
		return false;
	}

	return results.getItemByIndex(0);
};

/**
 * @deprecated
 */
Aras.prototype.getFile = function Aras_getFile(value, fileSelect) {
	var topWnd = this.getMostTopWindowWithAras(window);
	var qry = new topWnd.Item('File', 'get');
	qry.setAttribute('select', fileSelect);
	qry.setID(value);

	var results = qry.apply();

	if (results.isEmpty()) {
		return false;
	}

	if (results.isError()) {
		this.AlertError(results);
		return false;
	}
	return results.getItemByIndex(0);
};

Aras.prototype.refreshWindows = function Aras_refreshWindows(
	message,
	results,
	saveChanges
) {
	if (saveChanges === undefined) {
		saveChanges = true;
	}

	// Skip the refresh if this is the unlock portion of the "Save, Unlock and Close" operation.
	if (!saveChanges) {
		return;
	}

	const nodeWithIDs = message.selectSingleNode("event[@name='ids_modified']");
	if (!(nodeWithIDs && results)) {
		return;
	}

	const idsModified = nodeWithIDs.getAttribute('value').split('|');

	const topWin = this.getMainWindow();

	const resultItems = Array.from(results.selectNodes('//Item[@id]'));
	resultItems.forEach(function (resultItemNode) {
		const itemNodeId = resultItemNode.getAttribute('id');
		if (idsModified.includes(itemNodeId)) {
			const itemTypeId = resultItemNode.getAttribute('typeId');
			let itemsGrids = topWin.mainLayout.tabsContainer.getSearchGridTabs(
				itemTypeId
			);
			const typeName = resultItemNode.getAttribute('type');
			const classification = resultItemNode.getElementsByTagName('classification')[0];
			if (typeName === 'Part' && classification) {
				itemsGrids = appendPartGrids(itemsGrids, classification.text)
			}
			itemsGrids.forEach(function (itemsGrid) {
				const grid = itemsGrid.grid;
				if (grid.getRowIndex(itemNodeId) === -1) {
					return;
				}
				//old item
				this.refreshItemsGrid(
					typeName,
					itemNodeId,
					resultItemNode,
					itemsGrid
				);
			}, this);
		}
	}, this);

	let doRefresh = false;
	for (let winId in this.windowsByName) {
		try {
			if (this.windowsByName.hasOwnProperty(winId)) {
				const win = this.windowsByName[winId];
				if (this.isWindowClosed(win)) {
					this.deletePropertyFromObject(this.windowsByName, winId);
					continue;
				}

				doRefresh = true;
				break;
			}
		} catch (excep) {
			continue;
		}
	}
	if (!doRefresh) {
		return;
	}

	const itemNode = results.selectSingleNode('//Item');
	let currentID = 0;
	if (itemNode) {
		currentID = itemNode.getAttribute('id');
	}

	const alreadyRefreshedWindows = {};
	const self = this;

	function refreshWindow(oldItemId, itemNd) {
		if (alreadyRefreshedWindows[oldItemId] || !self.uiFindWindowEx(oldItemId)) {
			return;
		}

		alreadyRefreshedWindows[oldItemId] = true;
		alreadyRefreshedWindows[itemNd.getAttribute('id')] = true; //just fo a case item is versionable
		self.uiReShowItemEx(oldItemId, itemNd);
	}

	const getItemsFromCache = function (ids, getQueryFn) {
		const result = new Set();
		let length = 0;
		const partitionSize = 1000;
		let partOfIds;
		const xml = ArasModules.xml;

		do {
			partOfIds = ids.slice(length, length + partitionSize);
			length += partOfIds.length;
			xml
				.selectNodes(this.itemsCache.dom, getQueryFn(partOfIds))
				.forEach(result.add.bind(result));
		} while (partOfIds.length === partitionSize);

		return result;
	}.bind(this);

	const dependency = getTypeIdDependencyForRefreshing(idsModified);
	refreshVersionableItem(dependency);

	function getTypeIdDependencyForRefreshing(idsModified) {
		const dependedNodes = getItemsFromCache(idsModified, function (ids) {
			return (
				"//Item[(@id='" +
				ids.join("' or @id='") +
				"') and string(locked_by_id)='' and config_id!='']"
			);
		});
		const typesToSkip = [
			'Life Cycle Map',
			'Form',
			'Workflow Map',
			'ItemType',
			'RelationshipType'
		];

		const result = {};
		//not locked items with id=itemID *anywhere* in the cache
		dependedNodes.forEach(function (itemFromDom) {
			const itemID = itemFromDom.getAttribute('id');
			const type = itemFromDom.getAttribute('type');
			if (currentID === itemID || typesToSkip.includes(type)) {
				return;
			}

			const configId = itemFromDom.selectSingleNode('config_id');
			if (!result[type]) {
				result[type] = new Map();
			}
			result[type].set(configId.text, itemID);
		});
		return result;
	}

	function refreshVersionableItem(dependency) {
		for (let e in dependency) {
			const element = dependency[e];
			const configIds = Array.from(element.keys()).join(',');
			const itemsToRefresh = self.loadItems(
				e,
				"<config_id condition='in'>" +
					configIds +
					'</config_id>' +
					'<is_current>1</is_current>',
				0
			);
			itemsToRefresh.forEach(function (itemNode) {
				const configId = itemNode.selectSingleNode('config_id').text;
				const id = element.get(configId);
				refreshWindow(id, itemNode);
			});
		}
	}

	const affectedNodes = getItemsFromCache(idsModified, function (ids) {
		return (
			"//Item[count(descendant::Item[@isTemp='1'])=0 and string(@isDirty)!='1' and Relationships/Item/related_id/Item[@id='" +
			ids.join("' or @id='") +
			"']]"
		);
	});

	affectedNodes.forEach(function (itemNd) {
		const id = itemNd.getAttribute('id');
		const type = itemNd.getAttribute('type');
		if (
			id === currentID ||
			type === 'Life Cycle Map' ||
			type === 'Form' ||
			type === 'Workflow Map' ||
			type === 'ItemType'
		) {
			return;
		}

		//IR-006509
		if (!this.isDirtyEx(itemNd)) {
			const related_ids = itemNd.selectNodes(
				'Relationships/Item/related_id[Item/@id="' + currentID + '"]'
			);

			for (let i_r = 0, L = related_ids.length; i_r < L; i_r++) {
				const relshipItem = related_ids[i_r].parentNode;
				const relship_id = relshipItem.getAttribute('id');
				const relship_type = relshipItem.getAttribute('type');
				const res = this.soapSend(
					'GetItem',
					'<Item type="' +
						relship_type +
						'" id="' +
						relship_id +
						'" select="related_id"/>',
					undefined,
					false
				);

				if (res.getFaultCode() !== 0) {
					continue;
				}

				const res_related_id = res
					.getResult()
					.selectSingleNode('Item/related_id/Item[@id="' + currentID + '"]');
				if (res_related_id === null) {
					continue;
				}

				//update attributes and child nodes
				for (let i_att = 0; i_att < res_related_id.attributes.length; i_att++) {
					const attr = res_related_id.attributes[i_att];
					related_ids[i_r].setAttribute(attr.nodeName, attr.nodeValue);
				}

				//it more safe than replace node. Because it is possible that there are places where reference to releated_id/Item node
				//is chached in local variable. The replacement would just break the code.
				//mergeItem does not merge attributes in its current implementation. Thus the attributes are copied with the legacy code above.
				this.mergeItem(
					relshipItem.selectSingleNode(
						'related_id/Item[@id="' + currentID + '"]'
					),
					res_related_id
				);
			}
		}

		const win = this.uiFindWindowEx(id);
		if (win !== window) {
			refreshWindow(id, itemNd);
		}
	}, this);

	function appendPartGrids(itemsGrids, classification) {
		let typeId;
		if (classification.startsWith('Mechanical Part/')) {
			typeId = '29BCCBE62FDC4589AB67871B19864578';
		} else {
			return itemsGrids;
		}

		const extraItemsGrids = topWin.mainLayout.tabsContainer.getSearchGridTabs(
			typeId
		);

		return extraItemsGrids && extraItemsGrids.length
			? itemsGrids.concat(extraItemsGrids)
			: itemsGrids;
	}
};

Aras.prototype.refreshItemsGrid = function Aras_refreshItemsGrid(
	itemTypeName,
	itemID,
	updatedItem,
	itemsGrid
) {
	if (!updatedItem || !itemsGrid || !itemsGrid.isItemsGrid) {
		return false;
	}

	const updatedID = updatedItem.getAttribute('id');

	if (itemTypeName === 'ItemType') {
		if (itemID === itemsGrid.itemTypeID) {
			itemsGrid.location.replace('../scripts/blank.html');
			return true;
		}
	}

	if (itemsGrid.itemTypeName !== itemTypeName) {
		return false;
	}

	const grid = itemsGrid.grid;
	if (grid.getRowIndex(itemID) === -1) {
		return true;
	}

	const wasSelected = grid.getSelectedItemIds().indexOf(itemID) > -1;

	if (updatedID !== itemID) {
		//hack to prevent rewrite deleteRow to use typeName and Id instead of node
		let oldItem = this.createXMLDocument();
		oldItem.loadXML("<Item type='" + itemTypeName + "' id='" + itemID + "'/>");
		oldItem = oldItem.documentElement;

		itemsGrid.deleteRow(oldItem);
	}

	itemsGrid.updateRow(updatedItem);

	if (wasSelected) {
		if (updatedID === itemID) {
			itemsGrid.onSelectItem(itemID);
		} else {
			const currSel = grid.getSelectedId();
			//if (currSel)
			itemsGrid.onSelectItem(currSel);
		}
	} //if (wasSelected)

	return true;
};

Aras.prototype.getDirtyItems = function Aras_getDirtyItems() {
	const dirtyItemsXPath =
		"/Innovator/Items/Item[@action!='' and (@isTemp='1' or @isEditState='1' or (locked_by_id='" +
		this.getUserID() +
		"' and (@isDirty='1' or .//Item/@isDirty='1' or .//Item/@isTemp='1'))) and not(@type=\"mpo_MassPromotion\")]";

	return this.itemsCache.getItemsByXPath(dirtyItemsXPath);
};

Aras.prototype.getUnlockEditStateItemsXml = function Aras_getUnlockEditStateItemsXml() {
	const dirtyItems = this.itemsCache.getItemsByXPath('/Innovator/Items/Item');
	let unlockItemsXml = '';

	if (!dirtyItems || !dirtyItems.length) {
		return unlockItemsXml;
	}

	Array.prototype.forEach.call(
		dirtyItems,
		function (item) {
			if (
				this.isLockedByUser(item) &&
				this.isEditStateEx(item) &&
				!this.isTempEx(item)
			) {
				const itemType = item.getAttribute('type');
				const itemId = item.getAttribute('id');
				unlockItemsXml +=
					'<Item type="' + itemType + '" id="' + itemId + '" action="unlock"/>';
			}
		}.bind(this)
	);

	return unlockItemsXml;
};

Aras.prototype.isDirtyItems = function Aras_isDirtyItems() {
	if (this.getCommonPropertyValue('exitWithoutSavingInProgress')) {
		return false;
	}

	return this.getDirtyItems().length > 0;
};

Aras.prototype.dirtyItemsHandler = function Aras_dirtyItemsHandler() {
	if (this.isDirtyItems()) {
		var param = {
			title: this.getResource('', 'dirtyitemslist.unsaved_items'),
			aras: this,
			dialogWidth: 400,
			dialogHeight: 500,
			content: 'dirtyItemsList.html'
		};

		return ArasModules.Dialog.show('iframe', param).promise;
	}
};

Aras.prototype.getPreferenceItem = function Aras_getPreferenceItem(
	prefITName,
	specificITorRTId
) {
	if (!prefITName) {
		return null;
	}

	var self = this;
	var prefKey;
	if (specificITorRTId) {
		if (prefITName == 'Core_RelGridLayout') {
			var relType = this.getRelationshipType(specificITorRTId).node;
			var itID = specificITorRTId;
			if (relType) {
				itID = this.getItemProperty(relType, 'relationship_id');
			}
			prefKey = this.MetadataCache.CreateCacheKey(
				'Preference',
				prefITName,
				specificITorRTId,
				itID,
				this.preferenceCategoryGuid
			);
		} else {
			prefKey = this.MetadataCache.CreateCacheKey(
				'Preference',
				prefITName,
				specificITorRTId,
				this.preferenceCategoryGuid
			);
		}
	} else {
		prefKey = this.MetadataCache.CreateCacheKey(
			'Preference',
			prefITName,
			this.preferenceCategoryGuid
		);
	}

	var res = this.MetadataCache.GetItem(prefKey);
	if (res) {
		return res.content;
	}

	var findCriteriaPropNm = '';
	var findCriteriaPropVal = specificITorRTId;
	switch (prefITName) {
		case 'Core_ItemGridLayout': {
			findCriteriaPropNm = 'item_type_id';
			break;
		}
		case 'Core_RelGridLayout': {
			findCriteriaPropNm = 'rel_type_id';
			break;
		}
		case 'cmf_ContentTypeGridLayout': {
			findCriteriaPropNm = 'tabular_view_id';
			break;
		}
	}

	function getPrefQueryXml(prefCondition) {
		var xml = "<Item type='Preference' action='get'>";
		xml += prefCondition;

		xml += '<Relationships>';
		xml += "<Item type='" + prefITName + "'>";

		if (findCriteriaPropNm) {
			xml +=
				'<' +
				findCriteriaPropNm +
				'>' +
				findCriteriaPropVal +
				'</' +
				findCriteriaPropNm +
				'>';
		}

		xml += '</Item>';
		xml += '</Relationships></Item>';
		return xml;
	}
	var xml = getPrefQueryXml(inner_getConditionForUser());
	var resDom = this.createXMLDocument();
	var prefMainItemID = this.getVariable('PreferenceMainItemID');
	var prefMainItemDom = this.createXMLDocument();
	var res;
	if (prefITName === 'Core_GlobalLayout') {
		res = this.getMainWindow().arasMainWindowInfo.Core_GlobalLayout;
	} else if (prefITName === 'SSVC_Preferences') {
		res = this.getMainWindow().arasMainWindowInfo.SSVC_Preferences;
	} else if (prefITName === 'ES_Settings') {
		res = this.getMainWindow().arasMainWindowInfo.ES_Settings;
	} else {
		res = this.soapSend('ApplyItem', xml);
		if (res.getFaultCode() != 0) {
			this.AlertError(res);
			return null;
		}
	}
	res = res.getResultsBody();
	if (res && res.indexOf('Item') > -1) {
		resDom.loadXML(res);
		if (!prefMainItemID) {
			prefMainItemDom.loadXML(res);
			var tmpNd = prefMainItemDom.selectSingleNode('/*/Relationships');
			if (tmpNd) {
				tmpNd.parentNode.removeChild(tmpNd);
			}
		}
	}
	if (!resDom.selectSingleNode("//Item[@type='" + prefITName + "']")) {
		xml = getPrefQueryXml(inner_getConditionForSite());
		res = this.soapSend('ApplyItem', xml);
		if (res.getFaultCode() != 0) {
			this.AlertError(res);
			return null;
		}
		var newPref = this.newItem(prefITName);
		var tmp = newPref.cloneNode(true);

		newPref = tmp;
		res = res.getResultsBody();
		if (res && res.indexOf('Item') > -1) {
			resDom.loadXML(res);
			var nds2Copy = resDom.selectNodes(
				"//Item[@type='" +
					prefITName +
					"']/*[local-name()!='source_id' and local-name()!='permission_id']"
			);
			for (var i = 0; i < nds2Copy.length; i++) {
				var newNd = newPref.selectSingleNode(nds2Copy[i].nodeName);
				if (!newNd) {
					newNd = newPref.appendChild(
						newPref.ownerDocument.createElement(nds2Copy[i].nodeName)
					);
				}
				newNd.text = nds2Copy[i].text;
			}
		}
		if (findCriteriaPropNm) {
			var tmpNd = newPref.appendChild(
				newPref.ownerDocument.createElement(findCriteriaPropNm)
			);
			tmpNd.text = findCriteriaPropVal;
		}
		resDom.loadXML(newPref.xml);
		if (!prefMainItemID) {
			var mainPref = this.newItem('Preference');
			var tmp = mainPref.cloneNode(true);

			mainPref = tmp;

			const identityId = this.getIsAliasIdentityIDForLoggedUser();

			if (!identityId) {
				return null;
			}

			this.setItemProperty(mainPref, 'identity_id', identityId);
			prefMainItemDom.loadXML(mainPref.xml);
		}
	}

	if (!prefMainItemID) {
		var mainPref = prefMainItemDom.documentElement;
		var tmpKey = this.MetadataCache.CreateCacheKey(
			'Preference',
			mainPref.getAttribute('id')
		);
		var itm = this.IomFactory.CreateCacheableContainer(mainPref, mainPref);
		this.MetadataCache.SetItem(tmpKey, itm);
		this.setVariable('PreferenceMainItemID', mainPref.getAttribute('id'));
	}

	var result = resDom.selectSingleNode("//Item[@type='" + prefITName + "']");

	var itm = this.IomFactory.CreateCacheableContainer(result, result);
	this.MetadataCache.SetItem(prefKey, itm);
	return result;

	function inner_getConditionForSite() {
		var res =
			'<identity_id>' +
			"<Item type='Identity'>" +
			'<name>World</name>' +
			'</Item>' +
			'</identity_id>';
		return res;
	}
	function inner_getConditionForUser() {
		const identityId = self.getIsAliasIdentityIDForLoggedUser();

		if (!identityId) {
			return '';
		}

		return '<identity_id>' + identityId + '</identity_id>';
	}
};

Aras.prototype.getPreferenceItemProperty = function Aras_getPreferenceItemProperty(
	prefITName,
	specificITorRTId,
	propNm,
	defaultVal
) {
	var prefItm = this.getPreferenceItem(prefITName, specificITorRTId);
	return this.getItemProperty(prefItm, propNm, defaultVal);
};

Aras.prototype.setPreferenceItemProperties = function Aras_setPreferenceItemProperties(
	prefITName,
	specificITorRTId,
	varsHash
) {
	if (!prefITName || !varsHash) {
		return false;
	}

	const preferenceNode = this.getPreferenceItem(prefITName, specificITorRTId);
	const keys = Object.keys(varsHash);
	keys.forEach(function (propertyName) {
		const varValue = varsHash[propertyName];
		let propertyNode = preferenceNode.selectSingleNode(propertyName);
		if (!propertyNode) {
			propertyNode = preferenceNode.appendChild(
				preferenceNode.ownerDocument.createElement(propertyName)
			);
		}
		if (propertyNode.text !== varValue) {
			propertyNode.text = varValue;
			this.fireEvent('PreferenceValueChanged', {
				type: prefITName,
				specificITorRTId: specificITorRTId,
				propertyName: propertyName
			});
		}
	}, this);

	if (keys.length && !preferenceNode.getAttribute('action')) {
		preferenceNode.setAttribute('action', 'update');
	}

	return true;
};

Aras.prototype._getMainPreferenceItem = function Aras_getMainPreferenceItem() {
	const preferenceMainItemID = this.getVariable('PreferenceMainItemID');
	const dependencies = preferenceMainItemID
		? this.MetadataCache.GetItemsById(preferenceMainItemID)
		: [];

	if (dependencies.length < 1) {
		return null;
	}

	return dependencies[0].content.cloneNode(true);
};

Aras.prototype._updatePreferenceNodeAttributes = function Aras_updatePreferenceNodeAttributes(
	preferenceItem
) {
	const preferenceItemAction = preferenceItem.getAttribute('action');
	if (preferenceItemAction === 'add') {
		preferenceItem.setAttribute('action', 'merge');
	} else if (!preferenceItemAction) {
		preferenceItem.setAttribute('action', 'edit');
	}

	preferenceItem.setAttribute('doGetItem', '0');
};

Aras.prototype.getUpdatedPreferenceItemsXml = function Aras_getUpdatedPreferenceItemsXml() {
	const preferencesArr = this.MetadataCache.GetItemsById(
		this.preferenceCategoryGuid
	);
	const preferenceItem = this._getMainPreferenceItem();
	if (!preferencesArr || !preferencesArr.length || !preferenceItem) {
		return '';
	}

	const relationshipsNode =
		preferenceItem.selectSingleNode('Relationships') ||
		this.createXmlElement('Relationships', preferenceItem);

	const layoutTypes = [
		'Core_GlobalLayout',
		'Core_ItemGridLayout',
		'Core_RelGridLayout'
	];
	preferencesArr.forEach(function (preference) {
		let node = preference.content;
		const nodeAction = node.getAttribute('action');
		if (nodeAction) {
			node = relationshipsNode.appendChild(node.cloneNode(true));
			const nodeType = node.getAttribute('type');
			if (layoutTypes.includes(nodeType)) {
				node.setAttribute('action', 'merge');
			}
		}
	}, this);

	this._updatePreferenceNodeAttributes(preferenceItem);
	return preferenceItem.xml;
};

Aras.prototype.getXmlPreferenceItemWithUpdatedLayoutItem = function Aras_getXmlPreferenceItemWithUpdatedLayoutItem(
	layoutPreferenceItem
) {
	const preferenceMainItem = this._getMainPreferenceItem();
	if (!preferenceMainItem || !layoutPreferenceItem) {
		return '';
	}

	const relationshipsNode =
		preferenceMainItem.selectSingleNode('Relationships') ||
		this.createXmlElement('Relationships', preferenceMainItem);

	const layoutPreferenceItemAction = layoutPreferenceItem.getAttribute(
		'action'
	);
	if (layoutPreferenceItemAction) {
		const clonedLayoutPreferenceItem = relationshipsNode.appendChild(
			layoutPreferenceItem.cloneNode(true)
		);
		clonedLayoutPreferenceItem.setAttribute('action', 'merge');
		// Action attribute deleted so that preferences that have already been saved aren't saved again during logout.
		layoutPreferenceItem.removeAttribute('action');
	}

	this._updatePreferenceNodeAttributes(preferenceMainItem);
	return preferenceMainItem.xml;
};

Aras.prototype.savePreferenceItems = function Aras_savePreferenceItems() {
	const preferencesItemXml = this.getUpdatedPreferenceItemsXml();

	if (preferencesItemXml) {
		try {
			this.soapSend('ApplyItem', preferencesItemXml);
		} catch (e) {
			return;
		}
		return true;
	}
};

Aras.prototype.mergeItemRelationships = function Aras_mergeItemRelationships(
	oldItem,
	newItem
) {
	//this method is for internal purposes only.

	var newRelationships = newItem.selectSingleNode('Relationships');
	if (newRelationships != null) {
		var oldRelationships = oldItem.selectSingleNode('Relationships');
		if (oldRelationships == null) {
			oldRelationships = oldItem.appendChild(newRelationships.cloneNode(true));
		} else if (oldRelationships.childNodes.length === 0) {
			oldItem.replaceChild(newRelationships.cloneNode(true), oldRelationships);
		} else {
			this.mergeItemsSet(oldRelationships, newRelationships);
		}
	}
};

Aras.prototype.mergeItem = function Aras_mergeItem(oldItem, newItem) {
	//this method is for internal purposes only.
	var oldId = oldItem.getAttribute('id');
	if (oldId) {
		var newId = newItem.getAttribute('id');
		if (newId && oldId !== newId) {
			return; //do not merge Items with different ids.
		}
	}

	var allPropsXpath =
		"*[local-name()!='Relationships' and namespace-uri()!='" +
		this.translationXMLNsURI +
		"']";

	var oldAction = oldItem.getAttribute('action');
	if (!oldAction) {
		oldAction = 'skip';
	}

	if (oldAction == 'delete') {
		//do not merge newItem into oldSet
	} else if (oldAction == 'add') {
		//this should never happen because getItem results cannot return not saved Item. do nothing here.
	} else if (oldAction == 'update' || oldAction == 'edit') {
		//we can add only missing properties here and merge relationships
		var newProps = newItem.selectNodes(allPropsXpath);
		for (var i = 0; i < newProps.length; i++) {
			var newProp = newProps[i];

			var propNm = newProp.nodeName;
			var oldProp = oldItem.selectSingleNode(propNm);

			if (!oldProp) {
				oldItem.appendChild(newProp.cloneNode(true));
			} else {
				var oldPropItem = oldProp.selectSingleNode('Item');
				if (oldPropItem) {
					var newPropItem = newProp.selectSingleNode('Item');
					if (newPropItem) {
						this.mergeItem(oldPropItem, newPropItem);
					}
				}
			}
		}

		mergeSpecialAttributes(oldItem, newItem);

		//merge relationships
		this.mergeItemRelationships(oldItem, newItem);
	} else if (oldAction == 'skip') {
		//all properties not containing Items can be replaced here.

		//process oldItem properies with * NO * Item inside
		var oldProps = oldItem.selectNodes(allPropsXpath + '[not(Item)]');
		for (var i = 0; i < oldProps.length; i++) {
			var oldProp = oldProps[i];

			var propNm = oldProp.nodeName;
			var newProp = newItem.selectSingleNode(propNm);

			if (newProp) {
				oldItem.replaceChild(newProp.cloneNode(true), oldProp);
			}
		}

		//process oldItem properies with Item inside
		var oldItemProps = oldItem.selectNodes(allPropsXpath + '[Item]');
		for (var i = 0; i < oldItemProps.length; i++) {
			var oldProp = oldItemProps[i];

			var propNm = oldProp.nodeName;
			var newProp = newItem.selectSingleNode(propNm);

			if (newProp) {
				var oldPropItem = oldProp.selectSingleNode('Item');
				var newPropItem = newProp.selectSingleNode('Item');
				var oldPropItemId = oldPropItem.getAttribute('id');
				if (newPropItem) {
					var newPropItemId = newPropItem.getAttribute('id');
					//id of item may be changed in case of versioning or when item is replaced with another item on server-side
					if (oldPropItemId != newPropItemId) {
						var oldItemHasUnsavedChanges = Boolean(
							oldPropItem.selectSingleNode(
								"descendant-or-self::Item[@action!='skip']"
							)
						);
						if (oldItemHasUnsavedChanges) {
							//do nothing. mergeItem will do all it's best.
						} else {
							//set the new id on "old" Item tag
							oldPropItem.setAttribute('id', newPropItemId);

							//content of "old" Item tag is useless. Remove that.
							var children = oldPropItem.selectNodes('*');
							for (var j = 0, C_L = children.length; j < C_L; j++) {
								oldPropItem.removeChild(children[j]);
							}
						}
					}
					this.mergeItem(oldPropItem, newPropItem);
				} else {
					var oldPropItemAction = oldPropItem.getAttribute('action');
					if (!oldPropItemAction) {
						oldPropItemAction = 'skip';
					}

					var newPropItemId = newProp.text;
					if (oldPropItemAction == 'skip') {
						if (newPropItemId != oldPropItemId) {
							oldItem.replaceChild(newProp.cloneNode(true), oldProp);
						}
					}
				}
			}
		}

		//process all newItem properties which are missing in oldItem
		var newProps = newItem.selectNodes(allPropsXpath);
		for (var i = 0; i < newProps.length; i++) {
			var newProp = newProps[i];

			var propNm = newProp.nodeName;
			var oldProp = oldItem.selectSingleNode(propNm);

			if (!oldProp) {
				oldItem.appendChild(newProp.cloneNode(true));
			}
		}

		mergeSpecialAttributes(oldItem, newItem);

		//merge relationships
		this.mergeItemRelationships(oldItem, newItem);
	}

	function mergeSpecialAttributes(oldItem, newItem) {
		var specialAttrNames = new Array('discover_only', 'type');
		for (var i = 0; i < specialAttrNames.length; i++) {
			if (newItem.getAttribute(specialAttrNames[i])) {
				oldItem.setAttribute(
					specialAttrNames[i],
					newItem.getAttribute(specialAttrNames[i])
				);
			}
		}
	}
};

Aras.prototype.mergeItemsSet = function Aras_mergeItemsSet(oldSet, newSet) {
	//this method is for internal purposes only.

	//both oldSet and newSet are nodes with Items inside. (oldSet and newSet normally are AML or Relationships nodes)
	var oldDoc = oldSet.ownerDocument;

	//we don't expect action attribute specified on Items from newSet
	var newItems = newSet.selectNodes('Item[not(@action)]');
	for (var i = 0; i < newItems.length; i++) {
		var newItem = newItems[i];
		var newId = newItem.getAttribute('id');
		var newType = newItem.getAttribute('type');
		var newTypeId = newItem.getAttribute('typeId');

		var oldItem = oldSet.selectSingleNode(
			'Item[@id="' + newId + '"][@type="' + newType + '"]'
		);
		if (!oldItem) {
			//
			oldItem = oldSet.appendChild(oldDoc.createElement('Item'));
			oldItem.setAttribute('id', newId);
			oldItem.setAttribute('type', newType);
			oldItem.setAttribute('typeId', newTypeId);
		}

		this.mergeItem(oldItem, newItem);
	}
};

// +++ Export to Office section +++
//this method is for internal purposes only.
Aras.prototype.export2Office = function Aras_export2Office(
	gridXmlCallback,
	toTool,
	itemNd,
	itemTypeName,
	tabName
) {
	const statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'aras_object.exporting'),
		system_progressbar1_gif
	);
	toTool = toTool && toTool.toLowerCase();

	let fileName;
	if (itemNd) {
		const itemTypeName = itemNd.getAttribute('type');
		const itemKeyedName = itemNd.selectSingleNode('keyed_name').text;
		fileName = itemTypeName + '-' + itemKeyedName;
	} else if (window.item && window.relationshipsControl) {
		const relTabs = window.relationshipsControl.relTabbar.tabs;
		const itemTypeName = window.item.getAttribute('type');
		const relationshipTabName = relTabs.data.get(relTabs.selectedTab).label;
		const itemKeyedName = window.item.selectSingleNode('keyed_name').text;
		fileName = itemTypeName + '-' + relationshipTabName + '-' + itemKeyedName;
	}

	this.clearStatusMessage(statusId);
	const gridXmlContent =
		typeof gridXmlCallback == 'function' ? gridXmlCallback() : gridXmlCallback;
	if (toTool === 'export2excel' || toTool === 'excel') {
		this.exportToOfficeHelper.exportToExcel(
			gridXmlContent,
			itemNd,
			itemTypeName,
			tabName,
			fileName
		);
	} else {
		this.exportToOfficeHelper.exportToWord(gridXmlContent, itemNd, fileName);
	}
};

//this method is for internal purposes only.
Aras.prototype.saveString2File = function ArasSaveString2File(
	contentCallback,
	extension,
	fileName
) {
	const content = contentCallback();
	this.exportToOfficeHelper.saveContentToFile(content, extension, fileName);
};
// --- Export to Office section ---

Aras.prototype.EscapeSpecialChars = function Aras_EscapeSpecialChars(str) {
	if (!this.utilDoc) {
		this.utilDoc = this.createXMLDocument();
	}
	var element_t = this.utilDoc.createElement('t');
	element_t.text = str;
	var result = element_t.xml;
	return result.substr(3, result.length - 7);
};

// value returned as xpath function concat(), ie addition quotes aren't needed
Aras.prototype.EscapeXPathStringCriteria = function Aras_EscapeXPathStringCriteria(
	str
) {
	var res = str.replace(/'/g, "',\"'\",'");
	if (res != str) {
		return "concat('" + res + "')";
	} else {
		return "'" + res + "'";
	}
};

/*
//unit tests for Aras_isPropertyValueValid function
Boolean ? value is 0 or 1. (*)
Color ? must satisfy regexp /^#[a-f0-9]{6}$|^btnface$/i. (*)
Color List ? must satisfy regexp /^#[a-f0-9]{6}$|^btnface$/i. (*)
Date ? input string must represent a date in a supported format. (*)
Decimal ? must be a number. (*)
Federated ? read-only. No check.
Filter List ? string length must be not greater than 64. (*)
Float ? must be a number. (*)
Foreign ? read-only. No check.
Formatted Text ? No check.
Image ? string length must be not greater than 128. (*)
Integer ? must be an integer number. (*)
Item ? must be an item id (32 characters from [0-9A-F] set). (*)
List ? string length must be not greater than 64. (*)
MD5 ? 32 characters from [0-9A-F] set. (*)
Sequence ? read-only. No check.
String ? check if length of inputted string is not greater than maximum permissible string length.
Verify against property pattern if specified. (*)
Text ? No check.

Where (*) means: Empty value is not permissible if property is marked as required.

Property definition:
data_type - string
pattern   - string
is_required - boolean
stored_length - integer
*/
/*common tests part* /
var allDataTypes = new Array("boolean", "color", "color list", "date", "decimal", "federated", "filter list", "float", "foreign", "formatted text", "image", "integer", "item", "list", "md5", "sequence", "string", "text");
function RunTest(testDescription, testDataArr, expectedResults)
{
var failedTests = [];
for (var i=0; i<testDataArr.length; i++)
{
var testData = testDataArr[i];
var data_type = testData.propertyDef.data_type;
var expectedRes = expectedResults[data_type.replace(/ /g, "_")];

var r = Aras_isPropertyValueValid(testData.propertyDef, testData.propertyValue);

if (r !== expectedRes)
{
failedTests.push(data_type);
}
}

var resStr = (failedTests.length == 0) ? "none" : failedTests.toString();
alert(testDescription + "\n\nFailed tests: " + resStr);
}
/**/
/*empty value tests* /
var expectedRes_EmptyValue =
{
boolean: true,
color  : true,
color_list: true,
date   : true,
decimal: true,
federated: true,
filter_list: true,
float  : true,
foreign: true,
formatted_text: true,
image  : true,
integer: true,
item   : true,
list   : true,
md5    : true,
sequence: true,
string : true,
text   : true
};

var expectedRes_EmptyValueAndIsRequired =
{
boolean: false,
color  : false,
color_list: false,
date   : false,
decimal: false,
federated: true,
filter_list: false,
float  : false,
foreign: true,
formatted_text: true,
image  : false,
integer: false,
item   : false,
list   : false,
md5    : false,
sequence: true,
string : false,
text   : true
};

var testData_EmptyValueAndIsRequired = [];
var testData_EmptyValue = [];
for (var i=0; i<allDataTypes.length; i++)
{
var propertyDef = {data_type: allDataTypes[i], is_required:true};
var testData    = {propertyDef: propertyDef, propertyValue: ""};
testData_EmptyValueAndIsRequired.push(testData);

propertyDef = {data_type: allDataTypes[i], is_required:false};
testData    = {propertyDef: propertyDef, propertyValue: ""};
testData_EmptyValue.push(testData);
}

RunTest("Empty value", testData_EmptyValue, expectedRes_EmptyValue);
RunTest("Empty value and property is required", testData_EmptyValueAndIsRequired, expectedRes_EmptyValueAndIsRequired);
/**/

Aras.prototype.isInteger = function Aras_isInteger(propertyValue) {
	return String(parseInt(propertyValue)) == propertyValue;
};

Aras.prototype.isPositiveInteger = function Aras_isPositiveInteger(
	propertyValue
) {
	return this.isInteger(propertyValue) && parseInt(propertyValue) > 0;
};

Aras.prototype.isNegativeInteger = function Aras_isPositiveInteger(
	propertyValue
) {
	return this.isInteger(propertyValue) && parseInt(propertyValue) < 0;
};

Aras.prototype.isPropertyValueValid = function Aras_isPropertyValueValid(
	propertyDef,
	propertyValue,
	inputLocale
) {
	this.ValidationMsg = '';
	var data_type = propertyDef.data_type;
	const sohCode = new RegExp(String.fromCharCode('0x01'), 'g');
	if (typeof propertyValue === 'string' && sohCode.test(propertyValue)) {
		this.ValidationMsg = this.getResource(
			'',
			'aras_object.value_property_invalid_contains_incorrect_symbols'
		);
	}

	if (propertyValue !== '') {
		switch (data_type) {
			case 'boolean':
				if (!propertyValue == '0' && !propertyValue == '1') {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property _must_be _boolean'
					);
				}
				break;
			case 'color':
			case 'color list':
				if (!/^#[a-f0-9]{6}$|^btnface$/i.test(propertyValue)) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property_invalid_contains_incorrect_symbols'
					);
				}
				break;
			case 'date':
				var dateFormat = this.getDateFormatByPattern(
						propertyDef.pattern || 'short_date'
					),
					lessStrictFormat = dateFormat,
					neutralDate,
					dotNetPattern;

				propertyValue =
					typeof propertyValue === 'string'
						? propertyValue.trim()
						: propertyValue;
				while (lessStrictFormat && !neutralDate) {
					dotNetPattern =
						this.getClippedDateFormat(lessStrictFormat) ||
						this.getDotNetDatePattern(lessStrictFormat);
					neutralDate = this.getIomSessionContext().ConvertToNeutral(
						propertyValue,
						data_type,
						dotNetPattern
					);
					lessStrictFormat = this.getLessStrictDateFormat(lessStrictFormat);
				}

				if (typeof neutralDate !== 'string') {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property_invalid_must_be_date'
					);
				}
				break;
			case 'decimal':
				var maximumIntegerDigits;
				var hasScale = typeof propertyDef.scale != 'undefined';
				if (typeof propertyDef.precision != 'undefined') {
					maximumIntegerDigits = propertyDef.precision;

					if (hasScale) {
						maximumIntegerDigits -= propertyDef.scale;
					}
				}
				if (
					Number.isNaN(
						ArasModules.intl.number.parseFloat(
							propertyValue,
							maximumIntegerDigits
						)
					)
				) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property_invalid_must_be_decimal',
						propertyDef.precision,
						hasScale
							? propertyDef.scale
							: this.getResource(
									'',
									'aras_object.value_property_invalid_must_be_decimal_any'
							  )
					);
				}
				break;
			case 'federated':
				break;
			case 'float':
				if (
					Number.isNaN(
						ArasModules.intl.number.parseFloat(
							propertyValue,
							maximumIntegerDigits
						)
					)
				) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property_invalid_must_be_float'
					);
				}
				break;
			case 'foreign':
			case 'formatted text':
				break;
			case 'image':
				if (propertyValue.length > 128) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.length_image_property_cannot_be_larger_128_symbols'
					);
				}
				break;
			case 'integer':
				if (Number.isNaN(ArasModules.intl.number.parseInt(propertyValue))) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property_invalid_must_be_integer'
					);
				}
				break;
			case 'item':
				if (
					typeof propertyValue == 'string' &&
					!/^[0-9a-f]{32}$/i.test(propertyValue)
				) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property_invalid_must_be_item_id'
					);
				}
				break;
			case 'md5':
				if (propertyDef.stored_length) {
					var pattern = new RegExp(
						'^[0-9a-f]{' + propertyDef.stored_length + '}$',
						'i'
					);
					if (!pattern.test(propertyValue)) {
						this.ValidationMsg = this.getResource(
							'',
							'aras_object.length_properties_value_canot_be_larger',
							propertyDef.stored_length
						);
					}
				} else if (!/^[0-9a-f]{32}$/i.test(propertyValue)) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property_invalid_must_be_md5'
					);
				}
				break;
			case 'sequence':
				break;
			case 'filter list':
			case 'list':
			case 'ml_string':
			case 'mv_list':
			case 'string':
				if (propertyDef.stored_length < propertyValue.length) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.length_properties_value_canot_be_larger',
						propertyDef.stored_length
					);
					break;
				}
				if (data_type == 'string' && propertyDef.pattern) {
					var re = new RegExp(propertyDef.pattern);
					if (!re.test(propertyValue)) {
						this.ValidationMsg = this.getResource(
							'',
							'aras_object.value_property_invalid_must_correspond_with_pattern',
							propertyDef.pattern
						);
						break;
					}
				}
				break;
			case 'text':
				break;
			case 'global_version':
			case 'ubigint':
				if (!/^\d{0,20}$/g.test(propertyValue)) {
					this.ValidationMsg = this.getResource(
						'',
						'aras_object.value_property_invalid_must_be_unsigned_big_integer'
					);
				} else {
					const uBigIntMaxValue = '18446744073709551615';
					const ubiValue = bigInt(propertyValue);
					if (ubiValue.isNegative() || ubiValue.greater(uBigIntMaxValue)) {
						this.ValidationMsg = this.getResource(
							'',
							'aras_object.value_property_invalid_must_be_unsigned_big_integer'
						);
					}
				}
				break;
			default:
				throw new Error(
					5,
					this.getResource(
						'',
						'aras_object.invalid_parameter_propertydef_data_type'
					)
				);
				break;
		}
	}

	if (this.ValidationMsg != '') {
		this.ValidationMsg += ' ' + this.getResource('', 'aras_object.edit_again');
	}
	return this.ValidationMsg == '';
};

Aras.prototype.ValidationMsg = '';

Aras.prototype.showValidationMsg = function Aras_showValidationMsg(
	ownerWindow
) {
	return this.confirm(this.ValidationMsg, ownerWindow);
};

/**
 * Indicate whether window is closed.
 * Supposition: sometimes invoking of property window.closed launch exception "Permission denied". (After applying patch KB918899)
 */
Aras.prototype.isWindowClosed = function Aras_isWindowClosed(window) {
	return this.browserHelper && this.browserHelper.isWindowClosed(window);
};

//+++ some api for classification +++
Aras.prototype.isClassPathRoot = function Aras_isClassPathRoot(class_path) {
	return '' == class_path || !class_path;
};

Aras.prototype.areClassPathsEqual = function Aras_areClassPathsEqual(
	class_path1,
	class_path2
) {
	//return this.doesClassPath1StartWithClassPath2(class_path1, class_path2, true);
	return class_path1 == class_path2;
};

Aras.prototype.doesClassPath1StartWithClassPath2 = function Aras_doesClassPath1StartWithClassPath2(
	class_path1,
	class_path2
) {
	if (class_path2.length > class_path1.length) {
		return false;
	}

	var class_path1Elements = class_path1.split('/');
	var class_path2Elements = class_path2.split('/');

	if (class_path2Elements.length > class_path1Elements.length) {
		return false;
	}

	for (var i = 0; i < class_path2Elements.length; i++) {
		if (class_path2Elements[i] != class_path1Elements[i]) {
			return false;
		}
	}

	return true;
};

/*
Aras.prototype.fireUnitTestsForSelectPropNdsByClassPath = function Aras_fireUnitTestsForSelectPropNdsByClassPath()
{
var pNms = new Array("simple classpath", "with chars to escape", "root1", "root2", "root3", "child class path", "wrong root");
//!!!before testing remove // and the second occurence of /* in the next code line
//var cps = new Array("/test/simple Classpath", "/*/
/*with \\chars\\ \" to escape<<>>[[[[]:-))))B!!!!", "", "/*", "/test", "/test/simple Classpath/its child", "/WRONG ROOT/simple Classpath");
var checkSums = new Array(4, 4, 3, 3, 3, 5, 5);//numbers of nodes returned according to class paths stored in cps array.

if (pNms.length!=cps.length || pNms.length!=checkSums.length)
{
alert("test setup is incorrect");
return;
}
var xml = "<Item type='ItemType'><name>test</name>"+
"<Relationships>"+
"<Item type='Property'>"+
"<name>"+pNms[0]+"</name>"+
"<class_path>"+cps[0]+"</class_path>"+
"</Item>"+
"<Item type='Property'>"+
"<name>"+pNms[1]+"</name>"+
"<class_path><![CDATA["+cps[1]+"]]></class_path>"+
"</Item>"+
"<Item type='Property'>"+
"<name>"+pNms[2]+"</name>"+
"<class_path>"+cps[2]+"</class_path>"+
"</Item>"+
"<Item type='Property'>"+
"<name>"+pNms[3]+"</name>"+
"<class_path>"+cps[3]+"</class_path>"+
"</Item>"+
"<Item type='Property'>"+
"<name>"+pNms[4]+"</name>"+
"<class_path>"+cps[4]+"</class_path>"+
"</Item>"+
"<Item type='Property'>"+
"<name>"+pNms[5]+"</name>"+
"<class_path>"+cps[5]+"</class_path>"+
"</Item>"+
"<Item type='Property'>"+
"<name>"+pNms[6]+"</name>"+
"<class_path>"+cps[6]+"</class_path>"+
"</Item>"+
"</Relationships></Item>"
var d = this.createXMLDocument();
d.loadXML(xml);
var itemTypeNd = d.documentElement;
var propNds;
var res = "Result:\n";
var class_path;
for (var i=0; i<cps.length; i++)
{
class_path = cps[i];
propNds = this.selectPropNdsByClassPath(class_path, itemTypeNd);
res += "class_path="+class_path + ", result="+((propNds && propNds.length==checkSums[i]) ? "true" : "false") + "\n";
}
alert(res);
}
*/

Aras.prototype.selectPropNdsByClassPath = function Aras_selectPropNdsByClassPath(
	class_path,
	itemTypeNd,
	excludePropsWithThisClassPath,
	ignoreProps2Delete
) {
	if (!itemTypeNd || !itemTypeNd.xml) {
		return null;
	}

	var xp = "Relationships/Item[@type='Property']";
	if (ignoreProps2Delete) {
		xp += "[string(@action)!='delete' and string(@action)!='purge']";
	}
	var tmpXp =
		' starts-with(' +
		this.EscapeXPathStringCriteria(class_path) +
		', class_path)';
	if (excludePropsWithThisClassPath) {
		tmpXp = 'not(' + tmpXp + ')';
	}
	xp += '[' + tmpXp + ']';
	return itemTypeNd.selectNodes(xp);
};
//--- some api for classification ---

//+++ internal api for converting to/from neutral +++
Aras.prototype.getSessionContextLocale = function Aras_getSessionContextLocale() {
	return this.getIomSessionContext().GetLocale();
};

Aras.prototype.getIomSessionContext = function () {
	if (!this.sessionContext) {
		if (aras.getCommonPropertyValue('systemInfo_CurrentLocale')) {
			this.sessionContext = this.IomInnovator.getI18NSessionContext();
		}
	}
	return this.sessionContext || this.IomInnovator.getI18NSessionContext();
};

Aras.prototype.getSessionContextLanguageCode = function Aras_getSessionContextLanguageCode() {
	return this.getIomSessionContext().GetLanguageCode();
};

Aras.prototype.getLanguageDirection = function Aras_getLanguageDirection(
	languageCode
) {
	var direction,
		languages = this.getLanguagesResultNd(),
		currentLanguage;

	if (!languageCode) {
		languageCode = this.getSessionContextLanguageCode();
	}

	if (languageCode) {
		currentLanguage = languages.selectSingleNode(
			"Item[@type='Language' and code='" + languageCode + "']"
		);
		if (currentLanguage) {
			direction = this.getItemProperty(currentLanguage, 'direction');
		}
	}

	// default value is ltr
	if (!direction) {
		direction = 'ltr';
	}

	return direction;
};

Aras.prototype.getCorporateToLocalOffset = function Aras_getCorporateToLocalOffset() {
	var r = this.getIomSessionContext().GetCorporateToLocalOffset();
	r = parseInt(r);
	if (isNaN(r)) {
		r = 0;
	}
	return r;
};

Aras.prototype.parse2NeutralEndOfDayStr = function Aras_parse2NeutralEndOfDayStr(
	dtObj
) {
	var yyyy = String(dtObj.getFullYear());
	var h = {};
	h.MM = String('0' + (dtObj.getMonth() + 1));
	h.dd = String('0' + dtObj.getDate());
	h.hh = String('0' + dtObj.getHours());
	h.mm = String('0' + dtObj.getMinutes());
	h.ss = String('0' + dtObj.getSeconds());
	for (var k in h) {
		h[k] = h[k].substr(h[k].length - 2);
	}
	var r = yyyy + '-' + h.MM + '-' + h.dd + 'T' + h.hh + ':' + h.mm + ':' + h.ss;
	r = this.convertToNeutral(r, 'date', 'yyyy-MM-ddTHH:mm:ss');
	yyyy = r.substr(0, 4);
	h.MM = r.substr(5, 2);
	h.dd = r.substr(8, 2);
	r = yyyy + '-' + h.MM + '-' + h.dd + 'T23:59:59';
	return r;
};

Aras.prototype.getDateFormatByPattern = function Aras_getDateFormatByPattern(
	pattern
) {
	if (/_date/.test(pattern)) {
		return pattern;
	} else {
		var dateFormats = [
				'short_date',
				'short_date_time',
				'long_date',
				'long_date_time'
			],
			currentFormat,
			dotNetPattern,
			i;

		for (i = 0; i < dateFormats.length; i++) {
			currentFormat = dateFormats[i];
			dotNetPattern = this.getDotNetDatePattern(currentFormat);
			alteredPattern = dotNetPattern
				.replace(/tt/g, 'a')
				.replace(/dddd/g, 'EEEE');

			if (pattern === dotNetPattern || pattern === alteredPattern) {
				return currentFormat;
			}
		}
	}

	return undefined;
};

Aras.prototype.getClippedDateFormat = function Aras_getClippedDateFormat(
	dateFormat
) {
	switch (dateFormat) {
		case 'long_date_time|no_ampm':
			var fullFormatString = this.getDotNetDatePattern('long_date_time');
			return fullFormatString.replace(/[a|t]/g, '').trim();
		case 'short_date_time|no_ampm':
			var fullFormatString = this.getDotNetDatePattern('short_date_time');
			return fullFormatString.replace(/[a|t]/g, '').trim();
		default:
			return '';
	}
};

Aras.prototype.getLessStrictDateFormat = function Aras_getLessStrictDateFormat(
	dateFormat
) {
	switch (dateFormat) {
		case 'long_date':
			return 'short_date';
		case 'long_date_time':
			return 'long_date_time|no_ampm';
		case 'long_date_time|no_ampm':
			return 'short_date_time';
		case 'short_date_time':
			return 'short_date_time|no_ampm';
		case 'short_date_time|no_ampm':
			return 'short_date';
		default:
			return '';
	}
};

/**
 * converts localValue to neutral format if need
 */
Aras.prototype.convertToNeutral = function Aras_convertToNeutral(
	localValue,
	dataType,
	dotNetPattern
) {
	var convertedValue;

	if (localValue && typeof localValue !== 'object' && dataType) {
		switch (dataType) {
			case 'date':
				localValue =
					typeof localValue === 'string' ? localValue.trim() : localValue;
				dotNetPattern = dotNetPattern || 'short_date';
				convertedValue = this.getIomSessionContext().ConvertToNeutral(
					localValue,
					dataType,
					dotNetPattern
				);

				if (!convertedValue) {
					var dateFormat = this.getDateFormatByPattern(dotNetPattern),
						lessStrictFormat = this.getLessStrictDateFormat(dateFormat);

					while (lessStrictFormat && !convertedValue) {
						dotNetPattern =
							this.getClippedDateFormat(lessStrictFormat) ||
							this.getDotNetDatePattern(lessStrictFormat);
						convertedValue = this.getIomSessionContext().ConvertToNeutral(
							localValue,
							dataType,
							dotNetPattern
						);
						lessStrictFormat = this.getLessStrictDateFormat(lessStrictFormat);
					}
				}
				break;
			default:
				convertedValue = this.getIomSessionContext().ConvertToNeutral(
					localValue,
					dataType,
					dotNetPattern
				);
				break;
		}
	}

	return convertedValue || localValue;
};

/**
 * converts val from neutral format if need
 */
Aras.prototype.convertFromNeutral = function Aras_convertFromNeutral(
	val,
	data_type,
	dotNetPattern4Date
) {
	if (!val) {
		return val;
	}
	if (!data_type) {
		return val;
	}
	if (!dotNetPattern4Date) {
		dotNetPattern4Date = '';
	}
	if (val === null || val === undefined) {
		val = '';
	}
	if (typeof val == 'object') {
		return val;
	}

	var retVal = this.getIomSessionContext().ConvertFromNeutral(
		val,
		data_type,
		dotNetPattern4Date
	);
	if (!retVal) {
		retVal = val;
	}
	return retVal;
};

Aras.prototype.convertFromNeutralAllValues = function Aras_convertFromNeutralAllValues(
	itmNd
) {
	if (itmNd && itmNd.xml) {
		var itemTypeNd = this.getItemTypeForClient(
			itmNd.getAttribute('type'),
			'name'
		).node;
		if (itemTypeNd) {
			var xpath = "Relationships/Item[@type='Property']";
			var propNds = itemTypeNd.selectNodes(xpath);
			for (var i = 0; i < propNds.length; i++) {
				var propNm = this.getItemProperty(propNds[i], 'name');
				var v = this.getItemProperty(itmNd, propNm);
				if (v) {
					var propDataType = this.getItemProperty(propNds[i], 'data_type');
					var datePtrn = '';
					if (propDataType == 'date') {
						datePtrn = this.getDotNetDatePattern(
							this.getItemProperty(propNds[i], 'pattern')
						);
					}
					this.setItemProperty(
						itmNd,
						propNm,
						this.convertFromNeutral(v, propDataType, datePtrn),
						false
					);
				}
			}
		}
	}
};

Aras.prototype.getDotNetDatePattern = function Aras_getDotNetDatePattern(
	innovatorDatePattern
) {
	if (!innovatorDatePattern) {
		innovatorDatePattern = '';
	}
	var retVal = this.getIomSessionContext().GetUIDatePattern(
		innovatorDatePattern
	);
	return retVal;
};

Aras.prototype.getDecimalPattern = function Aras_getDecimalPattern(
	precision,
	scale
) {
	var index,
		optionalDigitCharacter = '#',
		requiredDigitCharacter = '0',
		decimalSeparatorCharacter = '.',
		integralPartPattern = '',
		fractionalPartPattern = '';

	precision = !precision || isNaN(precision) ? 38 : precision;
	scale = !scale || isNaN(scale) ? 0 : scale;

	for (index = 0; index < precision - scale - 1; index++) {
		integralPartPattern += optionalDigitCharacter;
	}
	integralPartPattern += requiredDigitCharacter;

	for (index = 0; index < scale; index++) {
		fractionalPartPattern += requiredDigitCharacter;
	}

	return fractionalPartPattern
		? integralPartPattern + decimalSeparatorCharacter + fractionalPartPattern
		: integralPartPattern;
};
//--- internal api for converting to/from neutral ---

Aras.prototype.getResource = function Aras_getResource() {
	if (arguments.length < 2) {
		return;
	}

	var solution = arguments[0];
	if (!solution) {
		solution = 'core';
	}
	solution = solution.toLowerCase();
	var key = arguments[1];
	var params2replace = [];
	for (var i = 0; i < arguments.length - 2; i++) {
		params2replace.push(arguments[i + 2]);
	}

	var Cache = this.getCacheObject();
	if (!Cache.UIResources[solution]) {
		Cache.UIResources[solution] = this.newUIResource(solution);
	}

	return Cache.UIResources[solution].getResource(key, params2replace);
};

Aras.prototype.getResources = function Aras_getResources(solution, keys) {
	var cache = this.getCacheObject();
	var res = {};

	for (var i = 0; i < keys.length; i++) {
		if (!cache.UIResources[solution]) {
			cache.UIResources[solution] = this.newUIResource(solution);
		}
		res[keys[i]] = cache.UIResources[solution].getResource(keys[i], []);
	}

	return res;
};

Aras.prototype.newUIResource = function Aras_newUIResource(solution) {
	var mainArasObj = this.getMainArasObject();

	if (mainArasObj && mainArasObj != this) {
		return mainArasObj.newUIResource(solution);
	} else {
		return new UIResource(this, solution);
	}
};

function UIResource(parentAras, solution) {
	this.parentAras = parentAras;
	this.msgsCache = parentAras.newObject();
	var parentUrl = parentAras.getBaseURL();
	if (parentUrl.substr(parentUrl.length - 1, 1) != '/') {
		parentUrl += '/';
	}
	switch (solution) {
		case 'core':
			break;
		case 'plm':
			parentUrl += 'Solutions/PLM/';
			break;
		case 'qp':
			parentUrl += 'Solutions/QP/';
			break;
		case 'project':
			parentUrl += 'Solutions/Project/';
			break;
		default:
			parentUrl += 'Solutions/' + solution + '/';
			break;
	}
	var docUrl = parentAras.getI18NXMLResource('ui_resources.xml', parentUrl);

	var xmlhttp = parentAras.XmlHttpRequestManager.CreateRequest();
	xmlhttp.open('GET', docUrl, false);
	xmlhttp.send(null);
	this.doc = parentAras.createXMLDocument();
	this.doc.loadXML(xmlhttp.responseText);
	if (!this.doc.xml) {
		this.doc = null;
	}
}

UIResource.prototype.getResource = function UIResource_getResource(
	key,
	params
) {
	key = this.parentAras.EscapeXPathStringCriteria(key);
	if (this.msgsCache[key] && (!params || params.length === 0)) {
		return this.msgsCache[key];
	}
	if (!this.doc) {
		return 'Error loading ui_resources.xml file.';
	}
	var re, val;
	if (this.msgsCache[key]) {
		val = this.msgsCache[key];
	} else {
		var nd = this.doc.selectSingleNode('/*/resource[@key=' + key + ']');
		if (!nd) {
			return 'Resource with key="' + key + '" is not found.';
		}
		val = nd.getAttribute('value');
		this.msgsCache[key] = val;
	}
	for (var i = 0; i < params.length; i++) {
		eval('re = /\\{' + i + '\\}/g');
		val = val.replace(re, params[i]);
	}

	return val;
};

Aras.prototype.getFileText = function Aras_getFileText(fileUrl) {
	require(['dojo/_base/xhr']);
	var tmp_xmlhttp = dojo.xhrGet({ url: fileUrl, sync: true });
	if (tmp_xmlhttp.ioArgs.xhr.status != 404) {
		return tmp_xmlhttp.results[0];
	}
	return;
};

Aras.prototype.getLCStateLabel = function Aras_getLCStateLabel(
	currentStateId,
	soapSendCaller,
	callback
) {
	if (!currentStateId) {
		return '';
	}
	var key = this.MetadataCache.CreateCacheKey(
		'getCurrentState',
		currentStateId
	);
	var state = this.MetadataCache.GetItem(key);

	if (state) {
		callback(state.Content());
		return;
	}

	var self = this,
		resultHanlder = function (result) {
			var xPath = '',
				state = '';

			if (result[0]) {
				result = result[0];
				xPath = './id';
			} else {
				result.results.loadXML(result.getResultsBody());
				result = result.results;
				xPath = './Item/id';
			}

			state = self.getItemProperty(result, 'label');
			if (!state) {
				var idNode = result.selectSingleNode(xPath);
				state = idNode.getAttribute('keyed_name');
			}

			var item = self.IomFactory.CreateCacheableContainer(
				state,
				currentStateId
			);
			self.MetadataCache.SetItem(key, item);
			callback(state);
		};
	soapSendCaller =
		soapSendCaller ||
		function (xmlBody, resultHanlder) {
			var result = self.soapSend('ApplyItem', xmlBody, '', false);
			resultHanlder(result);
		};

	var xmlBody =
		'<Item type="Life Cycle State" action="get" select="label" id="' +
		currentStateId +
		'"/>';
	soapSendCaller(xmlBody, resultHanlder);
};

Aras.prototype.arrayToMVListPropertyValue = function Aras_arrayToMVListPropertyValue(
	arr
) {
	var tmpArr = [];
	for (var i = 0; i < arr.length; i++) {
		tmpArr.push(arr[i].replace(/,/g, '\\,'));
	}
	return tmpArr.join(',');
};

Aras.prototype.mvListPropertyValueToArray = function Aras_mvListPropertyValueToArray(
	val
) {
	var Delimiter = ',';
	var EscapeString = '\\';
	var tmpDelim = '#';

	val = val.replace(/#/g, EscapeString + Delimiter);
	val = val.replace(/\\,/g, tmpDelim + tmpDelim);
	var tmpArr = val.split(Delimiter);

	var retArr = [];
	for (var i = 0; i < tmpArr.length; i++) {
		retArr.push(tmpArr[i].replace(/##/g, Delimiter).replace(/\\#/g, tmpDelim));
	}
	return retArr;
};

Aras.prototype.ShowContextHelp = function Aras_ShowContextHelp(itemTypeName) {
	var tophelpurl = this.getTopHelpUrl();
	if (tophelpurl) {
		if (tophelpurl.charAt(tophelpurl.length - 1) != '/') {
			tophelpurl += '/';
		}
		var currItemType = this.getItemFromServerByName(
			'ItemType',
			itemTypeName,
			'help_item,help_url'
		);
		var tmpurl =
			tophelpurl + this.getSessionContextLanguageCode() + '/index.htm';

		tophelpurl = WebFile.Exists(tmpurl) ? tmpurl : tophelpurl + 'en/index.htm';
		var urlstring = tophelpurl;
		if (currItemType) {
			var thisHelpId = currItemType.getProperty('help_item');
			var thisHelpURL = currItemType.getProperty('help_url');
			var thisHelp = this.getItemById('Help', thisHelpId, 0);
			if (thisHelpURL != undefined && thisHelpURL != '') {
				urlstring += '#' + thisHelpURL;
			} else {
				if (thisHelpId != undefined && thisHelpId != '') {
					this.uiShowItemEx(thisHelp, undefined);
					return;
				} else {
					urlstring = tophelpurl;
				}
			}
		}
		window.open(urlstring);
	}
};

Aras.prototype.UpdateFeatureTreeIfNeed = function Aras_UpdateFeatureTreeIfNeed() {
	if (this.isAdminUser()) {
		if (
			this.getMainWindow().arasMainWindowInfo.isFeatureTreeExpiredResult ===
			'True'
		) {
			var license = new Licensing(this);
			license.UpdateFeatureTree(function (isSuccess) {
				if (isSuccess) {
					license.showState();
				} else {
					license._showErrorPage();
				}
			});
		}
	}
};

/**
 * This function is a wrapper for IomInnovator.ConsumeLicense to handle exсeptions in case when LicenseService has returned "500" http response.
 * Our IOM controls are hosted in the main window and are shared between other windows. So, if tearoff window calls IomInnovator.ConsumeLicense inside of try catch block and exception is occured then it appears in the main window as script error and only after that will be handled by "catch" block of tearoff window.
 */
Aras.prototype.ConsumeLicense = function Aras_ConsumeLicense(featureName) {
	var mainArasObj = this.getMainArasObject();
	if (mainArasObj && mainArasObj != this) {
		return mainArasObj.ConsumeLicense(featureName);
	} else {
		var consumeLicenseResult = {
			isError: false,
			errorMessage: undefined,
			result: undefined
		};

		try {
			consumeLicenseResult.result = this.IomInnovator.ConsumeLicense(
				featureName
			);
		} catch (e) {
			consumeLicenseResult.isError = true;
			consumeLicenseResult.errorMessage = e.message;
		}
		return consumeLicenseResult;
	}
};

/**
 * @deprecated Use this.MetadataCache.CreateCacheKey()
 * @returns {array}
 */
Aras.prototype.CreateCacheKey = function Aras_CreateCacheKey() {
	var key = this.IomFactory.CreateArrayList();
	for (var i = 0; i < arguments.length; i++) {
		key.push(arguments[i]);
	}
	return key;
};

Aras.prototype.ValidateXml = function Aras_ValidateXml(schemas, xml) {
	var xmlBody = shapeXmlBody(schemas, xml);
	var url = this.getBaseURL() + '/HttpHandlers/XmlValidatorHandler.ashx';
	var xmlhttp = this.XmlHttpRequestManager.CreateRequest();
	// search in cache
	var responseInCache = this.commonProperties.validateXmlCache.filter(function (
		obj
	) {
		return obj.key === xmlBody;
	});

	if (responseInCache.length === 1) {
		return responseInCache[0].value;
	} else {
		xmlhttp.open('POST', url, false);
		xmlhttp.send(xmlBody);
		var resText = xmlhttp.responseText;
		var resDom = this.createXMLDocument();
		resDom.loadXML(resText);
		// we limit the size of the cache by 100
		if (this.commonProperties.validateXmlCache.length > 100) {
			this.commonProperties.validateXmlCache.shift();
		}
		var cacheObject = this.newObject();
		cacheObject.key = xmlBody;
		cacheObject.value = resDom;
		this.commonProperties.validateXmlCache.push(cacheObject);
		return resDom;
	}

	function shapeXmlBody(schemas, targetXml) {
		var xmlBody = [];
		xmlBody.push('<data>');
		for (var i = 0; i < schemas.length; i++) {
			var schema = schemas[i];
			xmlBody.push("<schema namespace='" + schema.namespace + "' >");
			xmlBody.push('<![CDATA[');
			xmlBody.push(schema.xml);
			xmlBody.push(']]>');
			xmlBody.push('</schema>');
		}
		xmlBody.push('<targetXml>');
		xmlBody.push('<![CDATA[');
		xmlBody.push(xml);
		xmlBody.push(']]>');
		xmlBody.push('</targetXml>');
		xmlBody.push('</data>');
		return xmlBody.join('');
	}
};

Aras.prototype.getMostTopWindowWithAras = function Aras_getMostTopWindowWithAras(
	windowObj
) {
	return TopWindowHelper.getMostTopWindowWithAras(windowObj);
};

Aras.prototype.SsrEditorWindowId = 'BB91CEC07FF24BE5945F2E5412752E8B';

Aras.prototype.setWindowLangAttribute = function Aras_setWindowLangAttribute(
	window
) {
	if (!window) {
		return;
	}

	const htmlNode = window.document.documentElement;
	htmlNode.lang = this.getSessionContextLanguageCode() || navigator.language;
};

Aras.prototype.setWindowTitle = function Aras_setWindowTitle(window, title) {
	if (!window) {
		return;
	}

	title = title || '';
	window.document.title = title;
	if (window.frameElement) {
		window.frameElement.title = title;
	}
};
