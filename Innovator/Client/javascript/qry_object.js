// © Copyright by Aras Corporation, 2004-2007.

function QryItem(arasObj, itemTypeName) {
	this.arasObj = arasObj;
	this.dom = arasObj.createXMLDocument();
	if (itemTypeName) {
		this.itemTypeName = itemTypeName;
	}

	this.initQry(this.itemTypeName);
}

QryItem.prototype.dom = null;
QryItem.prototype.item = null;
QryItem.prototype.itemTypeName = '';
QryItem.prototype.response = null;
QryItem.prototype.result = null;

/*
 */
QryItem.prototype.initQry = function QryItemInitQry(
	itemTypeName,
	preservePrevResults
) {
	if (preservePrevResults === undefined) {
		preservePrevResults = false;
	}

	this.itemTypeName = itemTypeName;
	this.dom.loadXML('<Item type="' + this.itemTypeName + '" action="get" />');
	this.item = this.dom.documentElement;

	if (!preservePrevResults) {
		var topWnd = this.arasObj.getMostTopWindowWithAras(window);
		this.response = new topWnd.SOAPResults(
			this.arasObj,
			SoapConstants.EnvelopeBodyStart +
				'<Result />' +
				SoapConstants.EnvelopeBodyEnd
		);
		this.result = this.response.getResult();
	}
};

QryItem.prototype.setItemType = function QryItemSetItemType(itemTypeName) {
	if (this.itemTypeName == itemTypeName) {
		return;
	}
	this.initQry(itemTypeName, false);
};

/*
 */
QryItem.prototype.setCriteria = function QryItemSetCriteria(
	propertyName,
	value,
	condition
) {
	if (condition === undefined) {
		condition = 'eq';
	}

	var criteria = this.item.selectSingleNode(propertyName);
	if (!criteria) {
		criteria = this.dom.createElement(propertyName);
		this.item.appendChild(criteria);
	}

	criteria.text = value;
	criteria.setAttribute('condition', condition);
};

QryItem.prototype.setCriteriaAml = function QryItemSetCriteria(criteriaAML) {
	const domToAml = this.arasObj.createXMLDocument();
	domToAml.loadXML(criteriaAML);
	this.item.appendChild(domToAml.documentElement);
};

QryItem.prototype.setCriteriaForMlString = function QryItemSetCriteriaForMlString(
	criteriaNode,
	condition
) {
	if (condition === undefined) {
		condition = 'eq';
	}
	if (!criteriaNode) {
		return;
	}

	var propertyName = criteriaNode.nodeName;
	var prefix = criteriaNode.prefix;
	var value = criteriaNode.text;
	var language = criteriaNode.getAttribute('xml:lang');
	var xpath = propertyName;

	if (prefix == 'i18n') {
		xpath =
			"//*[local-name() = '" +
			propertyName +
			"' and namespace-uri()='" +
			this.arasObj.translationXMLNsURI +
			"' and @xml:lang='" +
			language +
			"']";
	}

	var criteriaNd = this.item.selectSingleNode(xpath);
	if (!criteriaNd) {
		criteriaNd = this.dom.documentElement.appendChild(
			criteriaNode.cloneNode(false)
		);
	}

	criteriaNd.text = value;
	criteriaNd.setAttribute('condition', condition);
};

QryItem.prototype.setPropertyCriteria = function QryItemSetPropertyCriteria(
	propertyName,
	critName,
	value,
	condition,
	typeOfItem
) {
	if (condition === undefined) {
		condition = 'eq';
	}

	const isCurrentState = propertyName === 'current_state';
	var criteria = this.item.selectSingleNode(propertyName);
	if (!criteria) {
		criteria = this.dom.createElement(propertyName);
		this.item.appendChild(criteria);
	}

	var itm = criteria.selectSingleNode('Item');
	if (!itm) {
		itm = this.dom.createElement('Item');
		criteria.text = '';
		criteria.appendChild(itm);
	}
	if (typeOfItem) {
		itm.setAttribute('type', typeOfItem);
	}
	if (!isCurrentState) {
		itm.setAttribute('action', 'get');
	}

	if (value instanceof Element) {
		itm.appendChild(value);
	} else {
		criteria = itm.selectSingleNode(critName);
		if (!criteria) {
			criteria = this.dom.createElement(critName);
			itm.appendChild(criteria);
		}
		criteria.text = value;
	}
	if (!isCurrentState) {
		criteria.setAttribute('condition', condition);
	}
};

QryItem.prototype.setRelationshipCriteria = function QryItemSetRelationshipCriteria(
	relType,
	propertyName,
	value,
	condition
) {
	if (condition === undefined) {
		condition = 'eq';
	}

	var rels = this.item.selectSingleNode('Relationships');
	if (!rels) {
		rels = this.dom.createElement('Relationships');
		this.item.appendChild(rels);
	}

	var itm = rels.selectSingleNode('Item[@type="' + relType + '"]');
	if (!itm) {
		itm = this.dom.createElement('Item');
		rels.appendChild(itm);
		itm.setAttribute('type', relType);
		itm.setAttribute('action', 'get');
	}

	var criteria = itm.selectSingleNode(propertyName);
	if (!criteria) {
		criteria = this.dom.createElement(propertyName);
		itm.appendChild(criteria);
	}

	criteria.text = value;
	criteria.setAttribute('condition', condition);
};

QryItem.prototype.setRelationshipPropertyCriteria = function QryItemSetRelationshipPropertyCriteria(
	relType,
	propertyName,
	critName,
	value,
	condition
) {
	if (condition === undefined) {
		condition = 'eq';
	}

	var rels = this.item.selectSingleNode('Relationships');
	if (!rels) {
		rels = this.dom.createElement('Relationships');
		this.item.appendChild(rels);
	}

	var itm = rels.selectSingleNode('Item[@type="' + relType + '"]');
	if (!itm) {
		itm = this.dom.createElement('Item');
		rels.appendChild(itm);
		itm.setAttribute('type', relType);
		itm.setAttribute('action', 'get');
	}

	var tmpCrit = itm.selectSingleNode(propertyName);
	if (!tmpCrit) {
		tmpCrit = this.dom.createElement(propertyName);
		itm.appendChild(tmpCrit);
	}

	itm = tmpCrit.selectSingleNode('Item');
	if (!itm) {
		itm = this.dom.createElement('Item');
		tmpCrit.appendChild(itm);
	}

	var criteria = itm.selectSingleNode(critName);
	if (!criteria) {
		criteria = this.dom.createElement(critName);
		itm.appendChild(criteria);
	}

	criteria.text = value;
	criteria.setAttribute('condition', condition);
};

QryItem.prototype.getCriteriesString = function () {
	return !this.item.childNodes.length
		? ''
		: Array.prototype.map
				.call(this.item.childNodes, function (el) {
					return el.xml ? el.xml.trim() : '';
				})
				.sort()
				.join('');
};

QryItem.prototype.setRelationshipSearchOnly = function (relType) {
	var itm = this.item.selectSingleNode(
		'Relationships/Item[@type="' + relType + '"]'
	);
	if (itm) {
		itm.setAttribute('search_only', 'yes');
	}
};

QryItem.prototype.setOrderBy = function (orderBy) {
	this.item.setAttribute('order_by', orderBy);
};

QryItem.prototype.setMaxGeneration = function (maxGeneration) {
	var flag = maxGeneration ? '1' : '0';
	this.item.setAttribute('max_generation', flag);
};

QryItem.prototype.setLevels = function (levels) {
	this.item.setAttribute('levels', levels);
};

QryItem.prototype.getSelect = function () {
	return this.item.getAttribute('select');
};

QryItem.prototype.setSelect = function (select) {
	this.item.setAttribute('select', select);
};

QryItem.prototype.setConfigPath = function (configPath) {
	this.item.setAttribute('config_path', configPath);
};

QryItem.prototype.setPage = function (page) {
	this.item.setAttribute('page', page);
};

QryItem.prototype.getPage = function (page) {
	page = this.item.getAttribute('page');
	if (page === null) {
		page = '';
	}
	return page;
};

QryItem.prototype.getPageSize = function () {
	var pagesize = this.item.getAttribute('pagesize');
	if (!pagesize) {
		pagesize = '-1';
	}
	return pagesize;
};

QryItem.prototype.setPageSize = function (pageSize) {
	this.item.setAttribute('pagesize', pageSize);
};

QryItem.prototype.getMaxRecords = function () {
	var maxRecords = this.item.getAttribute('maxRecords');
	if (!maxRecords) {
		maxRecords = '-1';
	}
	return maxRecords;
};

QryItem.prototype.setMaxRecords = function (maxRecords) {
	this.item.setAttribute('maxRecords', maxRecords);
};

QryItem.prototype.setReturnMode = function (returnMode) {
	this.item.setAttribute('returnMode', returnMode);
};

QryItem.prototype.setItemID = function (id) {
	this.item.setAttribute('id', id);
};

QryItem.prototype.setType = function (itemTypeName) {
	this.item.setAttribute('type', itemTypeName);
};

QryItem.prototype.getType = function () {
	return this.item.getAttribute('type');
};

QryItem.prototype.getResponse = function () {
	return this.response;
};

QryItem.prototype.getResponseDOM = function () {
	return this.response.results;
};

QryItem.prototype.getResult = function () {
	return this.result;
};

QryItem.prototype.getResultDOM = function () {
	return this.result.ownerDocument;
};

QryItem.prototype.removeCriteria = function QryItemRemoveCriteria(
	propertyName,
	languageCode
) {
	if (!propertyName) {
		return;
	}

	var xpath = propertyName;
	if (languageCode) {
		xpath =
			"*[local-name()='" +
			propertyName +
			"' and namespace-uri()='" +
			this.arasObj.translationXMLNsURI +
			"' and @xml:lang='" +
			languageCode +
			"']";
	} else {
		xpath = propertyName;
	}

	var criteria = this.item.selectSingleNode(xpath);
	if (criteria) {
		criteria.parentNode.removeChild(criteria);
	}
};

QryItem.prototype.removePropertyCriteria = function QryItemRemovePropertyCriteria(
	propertyName,
	critName
) {
	var criteria = this.item.selectSingleNode(propertyName + '/Item/' + critName);
	var itm;
	if (criteria) {
		itm = criteria.parentNode;
		itm.removeChild(criteria);
		if (!itm.selectSingleNode('.//*[.!="Relationships"]')) {
			this.removeCriteria(propertyName);
		}
	} else {
		itm = this.item.selectSingleNode(propertyName + '/Item');
		if (!itm || !itm.selectSingleNode('.//*[.!="Relationships"]')) {
			this.removeCriteria(propertyName);
		}
	}
};

QryItem.prototype.removeRelationshipCriteria = function QryItemRemoveRelationshipCriteria(
	relType,
	propertyName
) {
	var criteria = this.item.selectSingleNode(
		'./Relationships/Item[@type="' + relType + '"]/' + propertyName
	);
	if (criteria) {
		var itm = criteria.parentNode;
		itm.removeChild(criteria);
		if (!itm.selectSingleNode('.//*[.!="Relationships"]')) {
			itm.parentNode.removeChild(itm);
		}
	}
};

QryItem.prototype.removeRelationshipPropertyCriteria = function QryItemRemoveRelationshipPropertyCriteria(
	relType,
	propertyName,
	critName
) {
	var criteria = this.item.selectSingleNode(
		'./Relationships/Item[@type="' +
			relType +
			'"]/' +
			propertyName +
			'/Item/' +
			critName
	);
	var itm;
	if (criteria) {
		itm = criteria.parentNode;
		itm.removeChild(criteria);
		if (!itm.selectSingleNode('.//*[.!="Relationships"]')) {
			var parentCrit = itm.parentNode;
			parentCrit.removeChild(itm);
			this.removeRelationshipCriteria(propertyName);
		}
	} else {
		itm = this.item.selectSingleNode(
			'./Relationships/Item[@type="' + relType + '"]/' + propertyName + '/Item'
		);
		if (!itm || !itm.selectSingleNode('.//*[.!="Relationships"]')) {
			this.removeRelationshipCriteria(relType, propertyName);
		}
	}
};

QryItem.prototype.loadXML = function QryItemLoadXml(xmlToLoad) {
	this.dom.loadXML(xmlToLoad);
	this.item = this.dom.documentElement;
};

QryItem.prototype.removeAllCriterias = function QryItemRemoveAllCriterias() {
	this.dom.replaceChild(this.item.cloneNode(false), this.dom.documentElement);
	this.item = this.dom.documentElement;
};

QryItem.prototype.execute = function QryItemExecute(
	savePrevResults,
	soapController
) {
	if (savePrevResults === undefined) {
		savePrevResults =
			this.arasObj.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_append_items'
			) == 'true';
	}
	this.savePrevResults = savePrevResults;

	var res = this.arasObj.soapSend(
		'ApplyItem',
		this.dom.xml,
		undefined,
		undefined,
		soapController
	);
	if (soapController) {
		return;
	}

	this.setResponse(res);

	return this.result;
};

QryItem.prototype.setResponse = function QryItemSetResponse(res) {
	if (res.getFaultCode().toString() !== '0') {
		this.arasObj.AlertError(res);
		this.result = undefined;
		return;
	}

	this.response = res;

	if (this.savePrevResults) {
		res = res.getResult();
		var fromServer = res.selectNodes('Item');
		for (var i = 0; i < fromServer.length; i++) {
			var oldItm = this.result.selectSingleNode(
				'Item[@id="' + fromServer[i].getAttribute('id') + '"]'
			);
			if (oldItm) {
				oldItm.parentNode.replaceChild(fromServer[i].cloneNode(true), oldItm);
			} else {
				this.result.appendChild(fromServer[i].cloneNode(true));
			}
		}
	} else {
		this.result = res.getResult();
	}
};

QryItem.prototype.syncWithClient = function QryItemSyncWithClient() {
	var res = this.getResult();
	var i;
	var prevResults = res.selectNodes('Item[@isTemp="1" or @isDirty="1"]');
	for (i = 0; i < prevResults.length; i++) {
		res.removeChild(prevResults[i]);
	}

	var clientItems = this.arasObj.itemsCache.getItemsByXPath(
		'/Innovator/Items/Item[@type="' + this.itemTypeName + '"]'
	);

	for (i = 0; i < clientItems.length; i++) {
		var clientItem = clientItems[i];
		var isTemp = clientItem.getAttribute('isTemp') == '1';
		var fromServer = res.selectSingleNode(
			'Item[@id="' + clientItem.getAttribute('id') + '"]'
		);

		if (isTemp && !fromServer) {
			res.appendChild(clientItem.cloneNode(true));
		}

		//item from client cache do not contain unsaved modifications.
		//to resolve IR-002881: Erroneous caching of the lifecycle state
		if (fromServer) {
			//if item in client cache is not locked or item from server is unlocked or locked by someone else then remove item from client cache.
			var doRemoveClientItem =
				!this.arasObj.isLockedByUser(clientItem) ||
				!this.arasObj.isLockedByUser(fromServer);
			if (doRemoveClientItem) {
				const clientItemId = clientItem.getAttribute('id');
				this.arasObj.itemsCache.deleteItem(clientItemId);
			}
		}
	}
};

QryItem.prototype.setConditionEverywhere = function (condition) {
	var conditionTags = this.item.selectNodes(
		"//*[@condition!='" + condition + "']"
	);
	for (var i = 0; i < conditionTags.length; i++) {
		conditionTags.item(i).setAttribute('condition', condition);
	}
};

QryItem.prototype.replaceConditionEverywhere = function (
	condition1,
	condition2
) {
	var conditionTags = this.item.selectNodes(
		"//*[@condition='" + condition1 + "']"
	);
	for (var i = 0; i < conditionTags.length; i++) {
		conditionTags.item(i).setAttribute('condition', condition2);
	}
};

QryItem.prototype.getBlock = function (blockName) {
	return this.dom.documentElement.selectSingleNode(blockName);
};

QryItem.prototype.createConditionBlock = function (blockName) {
	var b = this.dom.createElement(blockName);
	this.item.appendChild(b);
	return b;
};

QryItem.prototype.setPropertyCriteriaInBlock = function QryItemSetPropertyCriteriaInBlock(
	block,
	propertyName,
	critName,
	value,
	condition
) {
	if (condition === undefined) {
		condition = 'eq';
	}

	if (block) {
		var criteria = block.selectSingleNode(
			propertyName + '/Item/' + critName + "[. = '" + value + "']"
		);
		if (criteria) {
			return;
		} else {
			criteria = this.dom.createElement(propertyName);
			block.appendChild(criteria);
		}

		var itm = criteria.selectSingleNode('Item');
		if (!itm) {
			itm = this.dom.createElement('Item');
			criteria.text = '';
			criteria.appendChild(itm);
		}

		criteria = itm.selectSingleNode(critName);
		if (!criteria) {
			criteria = this.dom.createElement(critName);
			itm.appendChild(criteria);
		}

		criteria.text = value;
		criteria.setAttribute('condition', condition);
	}
};
QryItem.prototype.removeSearchCriteria = function QryItemRemoveSearchCriteria(
	propXpath,
	{ extendXPath } = {}
) {
	const pathParts = propXpath.split('/');
	const propertyName = pathParts[pathParts.length - 1];
	const parentPath = pathParts.splice(0, pathParts.length - 1).join('/');
	let removeXPath = parentPath + '/' + propertyName;

	if (extendXPath) {
		removeXPath = `${parentPath}/OR/${propertyName}|${parentPath}/AND/${propertyName}|${parentPath}/OR/AND/${propertyName}|${removeXPath}`;
	}
	let nodeToRemove = this.dom.selectSingleNode(removeXPath);
	while (nodeToRemove) {
		let parentNode;
		do {
			parentNode = nodeToRemove.parentNode;
			parentNode.removeChild(nodeToRemove);
			nodeToRemove = parentNode;
		} while (
			parentNode !== this.dom.documentElement &&
			parentNode.childNodes.length === 0
		);
		nodeToRemove = this.dom.selectSingleNode(removeXPath);
	}
};

QryItem.prototype.removePropertyCriteriaFromBlock = function QryItemRemovePropertyCriteriaFromBlock(
	block,
	propertyName,
	critName
) {
	if (!block) {
		return;
	}

	var criterias = block.selectNodes(propertyName);
	for (var i = 0; i < criterias.length; i++) {
		criterias[i].parentNode.removeChild(criterias[i]);
	}
};

QryItem.prototype.addCondition2Block = function (
	block,
	propertyName,
	value,
	condition
) {
	if (condition === undefined) {
		condition = 'eq';
	}

	if (!block || !propertyName) {
		return;
	}

	var criteria = block.selectSingleNode(
		"*[local-name()='" + propertyName + "' and . = '" + value + "']"
	);
	if (criteria) {
		return;
	} else {
		criteria = this.dom.createElement(propertyName);
		block.appendChild(criteria);
	}

	criteria.text = value;
	criteria.setAttribute('condition', condition);
};

QryItem.prototype.removeCriteriaFromBlock = function (
	block,
	propertyName,
	languageCode
) {
	if (!block || !propertyName) {
		return;
	}

	var xpath = propertyName;
	if (languageCode) {
		xpath =
			"*[local-name()='" +
			propertyName +
			"' and namespace-uri()='" +
			this.arasObj.translationXMLNsURI +
			"' and @xml:lang='" +
			languageCode +
			"']";
	}

	var criterias = block.selectNodes(xpath);
	for (var i = 0; i < criterias.length; i++) {
		criterias[i].parentNode.removeChild(criterias[i]);
	}
};

QryItem.prototype.setItemAttribute = function QryItemSetItemAttribute(
	name,
	value
) {
	this.item.setAttribute(name, value);
};

QryItem.prototype.removeItemAttribute = function QryItemRemoveItemAttribute(
	name
) {
	this.item.removeAttribute(name);
};
