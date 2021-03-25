// © Copyright by Aras Corporation, 2004-2012.

/*
 *   The item extended methods extension for the Aras Object.
 *   methods in this file use xml nodes as parameters
 */

/// <reference path="soap_object.js" />

Aras.prototype.isNew = function (itemNd) {
	if (!this.isTempEx(itemNd)) {
		return false;
	}
	return 'add' == itemNd.getAttribute('action');
};

Aras.prototype.isTempEx = function (itemNd) {
	if (!itemNd) {
		return undefined;
	}
	return itemNd.getAttribute('isTemp') == '1';
};

Aras.prototype.isDirtyEx = function (itemNd) {
	if (!itemNd) {
		return undefined;
	}
	return (
		itemNd.selectSingleNode('descendant-or-self::Item[@isDirty="1"]') !== null
	);
};

Aras.prototype.isEditStateEx = function (itemNd) {
	if (!itemNd) {
		return false;
	}

	const itemTypeName = itemNd.getAttribute('type');
	let hasLocalChanges;

	if (window.ignoreUpdateItemTypes.includes(itemTypeName)) {
		hasLocalChanges = itemNd.getAttribute('isEditState') === '1';
	} else {
		const state = this.getMainWindow().store.getState();
		const itemID = itemNd.getAttribute('id');
		hasLocalChanges =
			state.localChanges &&
			state.localChanges[itemTypeName] &&
			state.localChanges[itemTypeName][itemID]
				? true
				: false;
	}

	return this.isTempEx(itemNd) || hasLocalChanges;
};

Aras.prototype.setItemEditStateEx = function (itemNd, state) {
	if (!itemNd) {
		return;
	}

	const itemNodeId = itemNd.getAttribute('id');

	const newItemEditState = state ? '1' : '0';
	const itemInCache = this.getFromCache(itemNodeId);
	itemNd.setAttribute('isEditState', newItemEditState);

	if (itemInCache && itemInCache !== itemNd) {
		itemInCache.setAttribute('isEditState', newItemEditState);
	}

	if (state) {
		window.aras
			.getMainWindow()
			.store.boundActionCreators.createItemLocalChangesRecord(
				itemNd.getAttribute('type'),
				itemNodeId
			);
	}
};

Aras.prototype.isLocked = function Aras_isLocked(itemNd) {
	if (this.isTempEx(itemNd)) {
		return false;
	}
	return '' !== this.getItemProperty(itemNd, 'locked_by_id');
};

Aras.prototype.isLockedByUser = function Aras_isLockedByUser(itemNd) {
	if (this.isTempEx(itemNd)) {
		return false;
	}

	var locked_by_id = this.getItemProperty(itemNd, 'locked_by_id');
	return locked_by_id == this.getCurrentUserID();
};

/*-- copyItemEx
 *
 *   Method to copy an item
 *   itemNd = item to be cloned
 *
 */
Aras.prototype.copyItemEx = function (itemNd, action, do_add) {
	if (!itemNd) {
		return false;
	}
	if (!action) {
		action = 'copyAsNew';
	}
	if (do_add === undefined || do_add === null) {
		do_add = true;
	}

	var itemTypeName = itemNd.getAttribute('type');
	var bodyStr =
		'<Item type="' + itemTypeName + '" id="' + itemNd.getAttribute('id') + '" ';
	if (itemTypeName.search(/^ItemType$|^RelationshipType$|^User$/) === 0) {
		bodyStr += ' action="copy" ';
	} else {
		bodyStr += ' action="' + action + '" ';
	}
	if (!do_add) {
		bodyStr += ' do_add="0" ';
	}
	bodyStr += ' />';

	var res = null;

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'common.copying_item'),
		system_progressbar1_gif
	);
	res = this.soapSend('ApplyItem', bodyStr);
	this.clearStatusMessage(statusId);

	var faultCode = res.getFaultCode();
	if (faultCode !== 0 && faultCode !== '0') {
		this.AlertError(res);
		return null;
	}

	var itemCopy = res.results.selectSingleNode('//Item');
	return itemCopy;
};

//+++++ saving item +++++
Aras.prototype.checkItemType = function (itemNd, win) {
	var isTaskOrItsChildCache;
	function isDataSourceSpecified(arasObj) {
		var isTaskOrItsChild =
			itemNd &&
			(arasObj.getItemProperty(itemNd, 'name') == 'InBasket Task' ||
				itemNd.selectSingleNode("../../../../../Item[name='InBasket Task']"));
		if (!isTaskOrItsChild) {
			if (isTaskOrItsChildCache === undefined) {
				var tmpRes = arasObj.applyItem(
					"<Item type='Morphae' action='get' select='id'>" +
						"<source_id><Item type='ItemType'><keyed_name>InBasket Task</keyed_name></Item></source_id>" +
						'<related_id>' +
						itemNd.getAttribute('id') +
						'</related_id>' +
						'</Item>'
				);
				if (tmpRes) {
					var tmpDoc = arasObj.createXMLDocument();
					tmpDoc.loadXML(tmpRes);
					tmpRes = tmpDoc.selectSingleNode('//Item') ? true : false;
				} else {
					tmpRes = false;
				}
				isTaskOrItsChildCache = tmpRes;
			}
			isTaskOrItsChild = isTaskOrItsChildCache;
		}

		if (
			!propDs &&
			propName != 'related_id' &&
			propName != 'source_id' &&
			!isTaskOrItsChild
		) {
			arasObj.AlertError(
				arasObj.getResource(
					'',
					'item_methods_ex.property_data_source_not_specified',
					propKeyedName
				)
			);
			return false;
		} else {
			return true;
		}
	}

	var name = this.getItemProperty(itemNd, 'name');
	if (name === '') {
		this.AlertError(
			this.getResource('', 'item_methods_ex.item_type_name_cannot_be_blank'),
			'',
			'',
			win
		);
		return false;
	}

	var property,
		propKeyedName,
		propDt,
		propName,
		propDs,
		tmpStoredLength,
		storedLength,
		pattern;

	var properties = itemNd.selectNodes(
		'Relationships/Item[@type="Property" and (not(@action) or (@action!="delete" and @action!="purge"))]'
	);
	var i;
	for (i = 0; i < properties.length; i++) {
		property = properties[i];
		propKeyedName = this.getKeyedNameEx(property);

		propName = this.getItemProperty(property, 'name');
		if (!propName) {
			this.AlertError(
				this.getResource(
					'',
					'item_methods_ex.item_type_has_property_with_no_name',
					this.getItemProperty(itemNd, 'label')
				),
				win
			);
			return false;
		}

		propDt = this.getItemProperty(property, 'data_type');
		propDs = this.getItemProperty(property, 'data_source');

		if (propDt == 'string' || propDt == 'ml_string' || propDt == 'mv_list') {
			tmpStoredLength = this.getItemProperty(property, 'stored_length');
			storedLength = parseInt(tmpStoredLength);

			if (isNaN(storedLength)) {
				this.AlertError(
					this.getResource(
						'',
						'item_methods_ex.length_of_property_not_specified',
						propKeyedName
					),
					'',
					'',
					win
				);
				return false;
			} else if (storedLength <= 0) {
				this.AlertError(
					this.getResource(
						'',
						'item_methods_ex.length_of_property_invalid',
						propKeyedName,
						tmpStoredLength
					),
					'',
					'',
					win
				);
				return false;
			}

			if ('mv_list' == propDt && !isDataSourceSpecified(this)) {
				return false;
			}
		} else if (
			(propDt == 'item' ||
				propDt == 'list' ||
				propDt == 'filter list' ||
				propDt == 'color list' ||
				propDt == 'sequence' ||
				propDt == 'foreign') &&
			!isDataSourceSpecified(this)
		) {
			return false;
		} else if (propDt == 'filter list') {
			if (!isDataSourceSpecified(this)) {
				return false;
			}

			pattern = this.getItemProperty(property, 'pattern');
			if (!pattern) {
				this.AlertError(
					this.getResource(
						'',
						'item_methods_ex.fliter_list_property_has_to_have_pattern',
						propKeyedName
					),
					'',
					'',
					win
				);
				return false;
			}

			var tmpNd_1 = itemNd.selectSingleNode(
				'Relationships/Item[@type="Property" and name="' +
					pattern +
					'" and (not(@action) or (@action!="delete" and @action!="purge"))]'
			);
			if (!tmpNd_1) {
				this.AlertError(
					this.getResource(
						'',
						'item_methods_ex.filter_list_property_has_wrong_pattern',
						propKeyedName,
						pattern
					),
					win
				);
				return false;
			} else if (
				this.getItemProperty(tmpNd_1, 'name') ==
				this.getItemProperty(property, 'name')
			) {
				this.AlertError(
					this.getResource(
						'',
						'item_methods_ex.property_for_pattern_cannot_property_itself',
						propKeyedName
					),
					'',
					'',
					win
				);
				return false;
			}
		}
	}
	var discussionTemplates = itemNd.selectNodes(
		'Relationships/Item[@type="DiscussionTemplate" and (not(@action) or (@action!="delete" and @action!="purge"))]'
	);
	if (discussionTemplates.length > 0) {
		var isRootClassificationExists = false;
		for (i = 0; i < discussionTemplates.length; i++) {
			var discussionTemplate = discussionTemplates[i];
			if (this.getItemProperty(discussionTemplate, 'class_path') === '') {
				isRootClassificationExists = true;
			}
		}
		if (!isRootClassificationExists) {
			this.AlertError(
				this.getResource(
					'',
					'item_methods_ex.item_type_should_have_discussiontemplate_for_root_class_path',
					propKeyedName,
					pattern
				),
				win
			);
			return isRootClassificationExists;
		}
	}

	return true;
};

Aras.prototype.checkItemForErrors = function Aras_checkItemForErrors(
	itemNd,
	exclusion,
	itemType,
	breakOnFirstError,
	emptyPropertyWithDefaultValueCallback
) {
	var resultErrors = [];

	var propNd, reqId, isRequired, reqName, reqDataType, itemPropVal, defVal;

	var typeOfItem = itemNd.getAttribute('type');
	if (!typeOfItem) {
		return resultErrors;
	}

	itemType = itemType ? itemType : this.getItemTypeDictionary(typeOfItem).node;
	if (!itemType) {
		return resultErrors;
	}

	var propertiesXpath =
		'Relationships/Item[@type="Property" and (is_required="1" or data_type="string")' +
		(exclusion ? ' and name!="' + exclusion + '"' : '') +
		']';
	var requirements = itemType.selectNodes(propertiesXpath);
	for (var i = 0; i < requirements.length; i++) {
		propNd = requirements[i];
		reqId = propNd.getAttribute('id');
		reqName = this.getItemProperty(propNd, 'name');
		reqDataType = this.getItemProperty(propNd, 'data_type');
		isRequired = this.getItemProperty(propNd, 'is_required') == '1';

		if (!reqName) {
			var noNameError = this.getResource(
				'',
				'item_methods_ex.item_type_has_property_with_no_name',
				this.getItemProperty(itemType, 'label')
			);
			resultErrors.push({ message: noNameError });
			if (breakOnFirstError) {
				return resultErrors;
			}
		}

		var proplabel = this.getItemProperty(propNd, 'label');
		if (!proplabel) {
			proplabel = this.getItemProperty(propNd, 'keyed_name');
		}
		if (!proplabel) {
			proplabel = '';
		}

		itemPropVal = this.getItemProperty(itemNd, reqName);
		if (isRequired && itemPropVal === '') {
			defVal = this.getItemProperty(propNd, 'default_value');
			if (defVal) {
				if (
					emptyPropertyWithDefaultValueCallback &&
					typeof emptyPropertyWithDefaultValueCallback === 'function'
				) {
					var callbackResult = emptyPropertyWithDefaultValueCallback(
						itemNd,
						reqName,
						proplabel,
						defVal
					);
					if (!callbackResult.result) {
						if (callbackResult.message) {
							resultErrors.push({ message: callbackResult.message });
						} else {
							resultErrors.push({});
						}
						if (breakOnFirstError) {
							return resultErrors;
						}
					}
				}
				continue;
			} else if (
				!this.isPropFilledOnServer(reqName) &&
				(reqDataType != 'md5' ||
					itemNd.getAttribute('action') == 'add' ||
					itemNd.selectSingleNode(reqName))
			) {
				var fieldRequiredError = this.getResource(
					'',
					'item_methods_ex.field_required_provide_value',
					proplabel
				);
				resultErrors.push({ message: fieldRequiredError });
				if (breakOnFirstError) {
					return resultErrors;
				}
			}
		}

		if (reqDataType == 'string') {
			var storedLength = parseInt(
				this.getItemProperty(propNd, 'stored_length')
			);
			if (!isNaN(storedLength) && itemPropVal.length - storedLength > 0) {
				var maxLengthError = this.getResource(
					'',
					'item_methods_ex.maximum_length_characters_for_property',
					proplabel,
					storedLength,
					itemPropVal.length
				);
				resultErrors.push({ message: maxLengthError });
				if (breakOnFirstError) {
					return resultErrors;
				}
			}
		}
	}

	return resultErrors;
};

Aras.prototype.checkItem = function Aras_checkItem(
	itemNd,
	win,
	exclusion,
	itemType
) {
	var self = this;
	var defaultFieldCheckCallback = function (
		itemNode,
		reqName,
		proplabel,
		defVal
	) {
		var ask = self.confirm(
			self.getResource(
				'',
				'item_methods_ex.field_required_default_will_be_used',
				proplabel,
				defVal
			)
		);
		if (ask) {
			self.setItemProperty(itemNode, reqName, defVal);
		}
		return { result: ask, message: '' };
	};

	var errors = this.checkItemForErrors(
		itemNd,
		exclusion,
		itemType,
		true,
		defaultFieldCheckCallback
	);
	if (errors.length > 0) {
		if (errors[0].message) {
			this.AlertError(errors[0].message);
		}
	}
	return errors.length === 0;
};

Aras.prototype.prepareItem4Save = function Aras_prepareItem4Save(itemNd) {
	var itemTypeName = itemNd.getAttribute('type');
	var itemID, item, items, items2;
	var i, j, parentNd;

	itemID = itemNd.getAttribute('id');
	items = itemNd.selectNodes('.//Item[@id="' + itemID + '"]');

	for (i = 0; i < items.length; i++) {
		item = items[i];
		parentNd = item.parentNode;
		parentNd.removeChild(item);
		parentNd.text = itemID;
	}

	items = itemNd.selectNodes('.//Item[@action="delete"]');
	for (i = 0; i < items.length; i++) {
		item = items[i];
		var childs = item.selectNodes('*[count(descendant::Item[@action])=0]');
		for (j = 0; j < childs.length; j++) {
			var childItem = childs[j];
			item.removeChild(childItem);
		}
	}

	items = itemNd.selectNodes('.//Item');
	for (i = 0; i < items.length; i++) {
		item = items[i];
		itemID = item.getAttribute('id');
		items2 = itemNd.selectNodes(
			'.//Item[@id="' + itemID + '"][@data_type != "foreign"]'
		);
		for (j = 1; j < items2.length; j++) {
			item = items2[j];
			parentNd = item.parentNode;
			parentNd.removeChild(item);
			parentNd.text = itemID;
		}
	}

	items = itemNd.selectNodes('.//Item[not(@action) and not(.//Item/@action)]');
	for (i = 0; i < items.length; i++) {
		items[i].setAttribute('action', 'get');
	}

	items = itemNd.selectNodes(
		'.//Item[@action="get" and (not(.//Item) or not(.//Item/@action!="get"))]'
	);
	for (i = 0; i < items.length; i++) {
		item = items[i];
		itemID = item.getAttribute('id');
		parentNd = item.parentNode;

		if (parentNd.nodeName == 'Relationships') {
			parentNd.removeChild(item);
		} else {
			if (itemID) {
				parentNd.removeChild(item);
				parentNd.text = itemID;
			}
		}
	}

	items = itemNd.selectNodes('.//Item[@action="get"]');
	for (i = 0; i < items.length; i++) {
		items[i].setAttribute('action', 'skip');
	}
};
const cacheDateInfo = {
	IT: new Set([
		'ItemType',
		'Property',
		'Grid Event',
		'View',
		'TOC View',
		'Item Action',
		'Item Report',
		'Client Event',
		'Morphae',
		'RelationshipType',
		'Relationship View',
		'Relationship Grid Event',
		'Can Add',
		'History Template',
		'History Template Action',
		'History Action',
		'ItemType_xPropertyDefinition',
		'xPropertyDefinition'
	]),
	RT: new Set([
		'ItemType',
		'RelationshipType',
		'Relationship View',
		'Relationship Grid Event'
	]),
	list: new Set(['List', 'Value', 'Filter Value']),
	form: new Set([
		'Form',
		'Form Event',
		'Method',
		'Body',
		'Field',
		'Field Event',
		'Property',
		'List',
		'ItemType'
	]),
	cui: new Set([
		'globalpresentationconfiguration',
		'itpresentationconfiguration',
		'presentationconfiguration',
		'presentationcommandbarsection',
		'commandbarsection',
		'commandbarsectionitem',
		'commandbaritem',
		'report',
		'action',
		'method'
	]),
	presentationConfiguration: new Set([
		'presentationconfiguration',
		'presentationcommandbarsection'
	]),
	xClassification: new Set([
		'xClassificationTree',
		'xClass',
		'xClass_xPropertyDefinition',
		'xPropertyDefinition',
		'xClassificationTree_ItemType'
	]),
	cuiControls: new Set([
		'cui_WindowSection',
		'cui_Control',
		'ItemType',
		'RelationshipType'
	])
};

function ClearDependenciesInMetadataCache(aras, itemNd) {
	const xPropertyContainerItemIT = '2073428E99384916938E3519AF1C0A44';

	const items = itemNd.selectNodes('descendant-or-self::Item');
	Array.prototype.forEach.call(items, function (item) {
		const tmpId = item.getAttribute('id');
		const action = item.getAttribute('action');
		if (tmpId && action && action !== 'get') {
			aras.MetadataCache.RemoveItemById(tmpId);
		}
	});

	const srcId = aras.getItemProperty(itemNd, 'source_id');
	if (srcId) {
		aras.MetadataCache.RemoveItemById(srcId);
	}
	//calling new method to clear metadata dates in Cache if Item has certain type
	const typeName = itemNd.getAttribute('type');

	if (cacheDateInfo.IT.has(typeName)) {
		aras.MetadataCache.DeleteITDatesFromCache(); // if saving IT - remove all IT dates from cache, form dates can stay
	}

	if (cacheDateInfo.RT.has(typeName)) {
		aras.MetadataCache.DeleteRTDatesFromCache();
	}

	if (typeName === 'Identity') {
		aras.MetadataCache.DeleteITDatesFromCache();
		aras.MetadataCache.DeleteIdentityDatesFromCache();
	}

	//If node isn't not part of ItemType, but List - remove List dates from cache
	if (cacheDateInfo.list.has(typeName)) {
		aras.MetadataCache.DeleteListDatesFromCache();
	}

	//If node isn't not part of ItemType nor List but Form - remove Form and IT dates from cache
	//hack: When new ItemType is being created server creates for it new form using "Create Form for ItemType" server method.
	//To update form cache ItemType variant is being added.
	if (cacheDateInfo.form.has(typeName)) {
		aras.MetadataCache.DeleteFormDatesFromCache();
		aras.MetadataCache.DeleteITDatesFromCache(); //remove IT dates on saving Form, since it affects IT
		aras.MetadataCache.DeleteClientMethodDatesFromCache();
		aras.MetadataCache.DeleteAllClientMethodsDatesFromCache();

		aras.MetadataCache.RemoveItemById(xPropertyContainerItemIT);
	}

	//If node is searchMode, remove SearchMode dates from cache
	if (typeName === 'SearchMode') {
		aras.MetadataCache.DeleteSearchModeDatesFromCache();
	}

	if (['Life Cycle Map', 'Life Cycle State'].includes(typeName)) {
		aras.MetadataCache.DeleteLifeCycleStatesDatesFromCache();
	}

	if (cacheDateInfo.cui.has(typeName.toLowerCase())) {
		aras.MetadataCache.DeleteConfigurableUiDatesFromCache();
	}

	if (cacheDateInfo.presentationConfiguration.has(typeName.toLowerCase())) {
		aras.MetadataCache.DeletePresentationConfigurationDatesFromCache();
	}

	if (typeName === 'CommandBarSection') {
		aras.MetadataCache.DeleteCommandBarSectionDatesFromCache();
	}
	if (typeName === 'ItemType' || typeName === 'cmf_ContentType') {
		aras.MetadataCache.DeleteContentTypeByDocumentItemTypeDatesFromCache();
		aras.MetadataCache.DeleteITDatesFromCache(); //remove IT dates on saving ContentType, since it affects a lot of IT
	}
	if (cacheDateInfo.xClassification.has(typeName)) {
		aras.MetadataCache.DeleteXClassificationTreesDates();
		aras.MetadataCache.DeleteITDatesFromCache();
		if (typeName === 'xClassificationTree') {
			const xItemTypes =
				aras.getItemRelationshipsEx(itemNd, 'xClassificationTree_ItemType') ||
				[];

			Array.prototype.forEach.call(xItemTypes, function (item) {
				const itemType = item.selectSingleNode('related_id/Item');
				aras.MetadataCache.RemoveItemById(aras.getItemProperty(itemType, 'id'));
			});
		}

		aras.MetadataCache.RemoveItemById(xPropertyContainerItemIT);
	}

	if (cacheDateInfo.cuiControls.has(typeName)) {
		aras.MetadataCache.DeleteConfigurableUiControlsDatesFromCache();
	}
}

Aras.prototype.calcMD5 = function (s) {
	return calcMD5(s);
};

(function () {
	function _sendFilesWithVaultAppletBefore(
		itemNd,
		statusMsg,
		XPath2ReturnedNd
	) {
		var win = this.uiFindWindowEx2(itemNd);
		if (!XPath2ReturnedNd) {
			XPath2ReturnedNd = this.XPathResult('/Item');
		}

		var vaultServerURL = this.getVaultServerURL();
		var vaultServerID = this.getVaultServerID();
		if (vaultServerURL === '' || vaultServerID === '') {
			this.AlertError(
				this.getResource('', 'item_methods_ex.vault_sever_not_specified'),
				'',
				'',
				win
			);
			return null;
		}

		var vaultApplet = this.vault;
		vaultApplet.clearClientData();
		vaultApplet.clearFileList();

		var headers = this.getHttpHeadersForSoapMessage('ApplyItem');
		headers['VAULTID'] = vaultServerID;
		for (var hName in headers) {
			vaultApplet.setClientData(hName, headers[hName]);
		}

		var fileNds = itemNd.selectNodes(
			'descendant-or-self::Item[@type="File" and (@action="add" or @action="update")]'
		);
		for (var i = 0; i < fileNds.length; i++) {
			var fileNd = fileNds[i];
			var fileID = fileNd.getAttribute('id');

			if (fileID) {
				var fileRels = fileNd.selectSingleNode('Relationships');
				if (!fileRels) {
					fileRels = this.createXmlElement('Relationships', fileNd);
				} else {
					var all_located = fileRels.selectNodes("Item[@type='Located']");
					// If file has more than one 'Located' then remove all of them except the
					// one that points to the default vault of the current user.
					// NOTE: it's a FUNDAMENTAL Innovator's approach - file is always
					//       submitted to the default vault of the current user. If this
					//       concept will be changed in the future then this code must be modified.
					var lcount = all_located.length;
					for (var j = 0; j < lcount; j++) {
						var located = all_located[j];
						var rNd = located.selectSingleNode('related_id');
						if (!rNd) {
							fileRels.removeChild(located);
						} else {
							var rvId = '';
							var rItemNd = rNd.selectSingleNode("Item[@type='Vault']");
							if (rItemNd) {
								rvId = rItemNd.getAttribute('id');
							} else {
								rvId = rNd.text;
							}

							if (rvId != vaultServerID) {
								fileRels.removeChild(located);
							}
						}
					}
				}

				var fileLocated = fileRels.selectSingleNode("Item[@type='Located']");
				if (!fileLocated) {
					fileLocated = this.createXmlElement('Item', fileRels);
					fileLocated.setAttribute('type', 'Located');
				}
				if (!fileLocated.getAttribute('action')) {
					var newLocatedAction = '';
					if (fileNd.getAttribute('action') == 'add') {
						newLocatedAction = 'add';
					} else {
						newLocatedAction = 'merge';
					}
					fileLocated.setAttribute('action', newLocatedAction);
				}

				// When file could have only one 'Located' we used on Located the condition 'where="1=1"' which essentially meant
				// "add if none or replace any existing Located on the File". With ability of a file to reside in multiple
				// vaults (i.e. item of type 'File' might have several 'Located' relationships) the behavior is "add Located
				// if file is not there yet; update the Located if the file already in the vault". This is achieved by
				// specifying on 'Located' condition 'where="related_id='{vault id}'"'. Note that additional condition
				// 'source_id={file id}' will be added on server when the sub-AML <Item type='Located' ...> is processed.
				if (
					!fileLocated.getAttribute('id') &&
					!fileLocated.getAttribute('where')
				) {
					fileLocated.setAttribute(
						'where',
						"related_id='" +
							vaultServerID +
							"'" /*"AND source_id='"+fileID+"'"*/
					);
				}
				this.setItemProperty(fileLocated, 'related_id', vaultServerID);
			}

			//code related to export/import functionality. server_id == donor_id.
			var server_id = this.getItemProperty(fileNd, 'server_id');
			if (server_id === '') {
				//this File is not exported thus check physical file.
				var checkedout_path = this.getItemProperty(fileNd, 'checkedout_path');
				var filename = this.getItemProperty(fileNd, 'filename');
				var FilePath;

				var itemId = this.getItemProperty(fileNd, 'id');
				var isFileSelected = false;
				if (this.getItemProperty(fileNd, 'file_size')) {
					isFileSelected = true;
				}

				if (!isFileSelected || !filename) {
					FilePath = vaultApplet.selectFile();
					if (!FilePath) {
						return null;
					}

					var parts = FilePath.split(/[\\\/]/);
					filename = parts[parts.length - 1];
					this.setItemProperty(fileNd, 'filename', filename);
				} else {
					if (checkedout_path) {
						if (0 === checkedout_path.indexOf('/')) {
							FilePath = checkedout_path + '/' + filename;
						} else {
							FilePath = checkedout_path + '\\' + filename;
						}
					} else {
						FilePath = aras.vault.vault.associatedFileList[itemId];
					}
				}

				this.setItemProperty(
					fileNd,
					'checksum',
					vaultApplet.getFileChecksum(FilePath)
				);
				this.setItemProperty(
					fileNd,
					'file_size',
					vaultApplet.getFileSize(FilePath)
				);

				vaultApplet.addFileToList(fileID, FilePath);
			}
		}

		var statusId = this.showStatusMessage(
			'status',
			statusMsg,
			system_progressbar1_gif
		);
		var XMLdata =
			SoapConstants.EnvelopeBodyStart +
			'<ApplyItem>' +
			itemNd.xml +
			'</ApplyItem>' +
			SoapConstants.EnvelopeBodyEnd;

		vaultApplet.setClientData('XMLdata', XMLdata);

		return {
			vaultServerURL: vaultServerURL,
			vaultApplet: vaultApplet,
			statusId: statusId,
			win: win
		};
	}

	function _sendFilesWithVaultAppletAfter(params, XPath2ReturnedNd, boolRes) {
		if (!XPath2ReturnedNd) {
			XPath2ReturnedNd = this.XPathResult('/Item');
		}

		this.clearStatusMessage(params.statusId);

		var resXML = params.vaultApplet.getResponse();
		if (!boolRes || !resXML) {
			this.AlertError(
				this.getResource(
					'',
					'item_methods_ex.failed_upload_file',
					params.vaultServerURL
				),
				'',
				'',
				params.win
			);
			if (!boolRes) {
				resXML += params.vaultApplet.getLastError();
			}
			this.AlertError(
				this.getResource('', 'item_methods_ex.internal_error_occured'),
				boolRes + '\n' + resXML,
				this.getResource('', 'common.client_side_err'),
				params.win
			);
			return null;
		}

		var soapRes = new SOAPResults(this, resXML);

		var faultCode = soapRes.getFaultCode();
		if (faultCode !== 0 && faultCode !== '0') {
			//because user can has just add access and no get access
			this.AlertError(soapRes, params.win);
			return null;
		}

		var resDom = soapRes.results;
		if (this.hasMessage(resDom)) {
			// check for message
			this.refreshWindows(this.getMessageNode(resDom), resDom);
		}
		return resDom.selectSingleNode(XPath2ReturnedNd);
	}

	Aras.prototype.sendFilesWithVaultApplet = function Aras_sendFilesWithVaultApplet(
		itemNd,
		statusMsg,
		XPath2ReturnedNd
	) {
		/*----------------------------------------
		 * sendFilesWithVaultApplet
		 *
		 * Purpose:
		 * This function is for iternal use only. DO NOT use in User Methods
		 * Checks physical files.
		 * Sets headers and send physical files to Vault
		 *
		 * Arguments:
		 * itemNd    - xml node to be processed
		 * statusMsg - string to show in status bar while files being uploaded
		 * XPath2ReturnedNd = xpath to select returned node. Default: aras.XPathResult('/Item')
		 */
		var params = _sendFilesWithVaultAppletBefore.call(
			this,
			itemNd,
			statusMsg,
			XPath2ReturnedNd
		);
		if (!params) {
			return params;
		}
		var boolRes = params.vaultApplet.sendFiles(params.vaultServerURL);
		return _sendFilesWithVaultAppletAfter.call(
			this,
			params,
			XPath2ReturnedNd,
			boolRes
		);
	};

	Aras.prototype.sendFilesWithVaultAppletAsync = function Aras_sendFilesWithVaultAppletAsync(
		itemNd,
		statusMsg,
		XPath2ReturnedNd
	) {
		var params = _sendFilesWithVaultAppletBefore.call(
			this,
			itemNd,
			statusMsg,
			XPath2ReturnedNd
		);
		if (!params) {
			return Promise.resolve(params);
		}
		return params.vaultApplet.vault.sendFilesAsync(params.vaultServerURL).then(
			function (boolRes) {
				return _sendFilesWithVaultAppletAfter.call(
					this,
					params,
					XPath2ReturnedNd,
					boolRes
				);
			}.bind(this)
		);
	};
})();

Aras.prototype.clientItemValidation = function Aras_clientItemValidation(
	itemTypeName,
	itemNd,
	breakOnFirstError,
	emptyPropertyCb
) {
	const checkForErrors = function (itemNode, exclusive) {
		return this.checkItemForErrors(
			itemNode,
			exclusive,
			null,
			breakOnFirstError,
			emptyPropertyCb
		);
	}.bind(this);
	const xPath =
		"Relationships//Item[(@isDirty='1' or @isTemp='1') and not(@action='skip')]";
	const itemErrors = (itemTypeName && checkForErrors(itemNd, null)) || [];

	if (breakOnFirstError) {
		if (itemErrors.length > 0) {
			return itemErrors;
		}

		let relationshipErrors = [];
		ArasModules.xml.selectNodes(itemNd, xPath).some(function (node) {
			relationshipErrors = checkForErrors(node, 'source_id');
			return relationshipErrors.length > 0;
		});

		return relationshipErrors;
	}

	const nodes = ArasModules.xml
		.selectNodes(itemNd, xPath)
		.flatMap(function (node) {
			return checkForErrors(node, 'source_id');
		});

	return itemErrors.concat(nodes);
};

(function () {
	function _saveItemExBefore(itemNd, confirmSuccess, doVersion) {
		if (!itemNd) {
			return null;
		}
		if (confirmSuccess === undefined || confirmSuccess === null) {
			confirmSuccess = true;
		}
		if (doVersion === undefined || doVersion === null) {
			doVersion = false;
		}

		var itemTypeName = itemNd.getAttribute('type');

		var win = this.uiFindWindowEx2(itemNd);

		//special checks for the item of ItemType type
		if (itemTypeName == 'ItemType' && !this.checkItemType(itemNd, win)) {
			return null;
		}

		var self = this;
		var defaultFieldCheckCallback = function (
			itemNode,
			reqName,
			proplabel,
			defVal
		) {
			var ask = self.confirm(
				self.getResource(
					'',
					'item_methods_ex.field_required_default_will_be_used',
					proplabel,
					defVal
				)
			);
			if (ask) {
				self.setItemProperty(itemNode, reqName, defVal);
			}
			return { result: ask, message: '' };
		};

		var validationErrors = this.clientItemValidation(
			itemTypeName,
			itemNd,
			true,
			defaultFieldCheckCallback
		);
		if (validationErrors.length > 0) {
			if (validationErrors[0].message) {
				this.AlertError(validationErrors[0].message);
			}
			return null;
		}

		var backupCopy = itemNd;
		var oldParent = backupCopy.parentNode;
		itemNd = itemNd.cloneNode(true);
		this.prepareItem4Save(itemNd);

		var isTemp = this.isTempEx(itemNd);

		if (isTemp) {
			itemNd.setAttribute('action', 'add');

			const lockedByIdNode = itemNd.ownerDocument.createElement('locked_by_id');
			lockedByIdNode.text = this.getCurrentUserID();
			itemNd.appendChild(lockedByIdNode);

			if (itemTypeName == 'RelationshipType') {
				if (!itemNd.selectSingleNode('relationship_id/Item')) {
					var rsItemNode = itemNd.selectSingleNode('relationship_id');
					if (rsItemNode) {
						var rs = this.getItemById('', rsItemNode.text, 0);
						if (rs) {
							rsItemNode.text = '';
							rsItemNode.appendChild(rs.cloneNode(true));
						}
					}
				}

				var tmp001 = itemNd.selectSingleNode('relationship_id/Item');
				if (tmp001 && this.getItemProperty(tmp001, 'name') === '') {
					this.setItemProperty(
						tmp001,
						'name',
						this.getItemProperty(itemNd, 'name')
					);
				}
			}
		} else if (doVersion) {
			itemNd.setAttribute('action', 'version');
		} else {
			itemNd.setAttribute('action', 'update');
		}

		var tempArray = [];
		this.doCacheUpdate(true, itemNd, tempArray);

		var statusMsg = '';
		if (isTemp) {
			statusMsg = this.getResource('', 'item_methods_ex.adding', itemTypeName);
		} else if (doVersion) {
			statusMsg = this.getResource(
				'',
				'item_methods_ex.versioning',
				itemTypeName
			);
		} else {
			statusMsg = this.getResource(
				'',
				'item_methods_ex.updating',
				itemTypeName
			);
		}

		return {
			confirmSuccess: confirmSuccess,
			itemTypeName: itemTypeName,
			backupCopy: backupCopy,
			statusMsg: statusMsg,
			oldParent: oldParent,
			tempArray: tempArray,
			itemNd: itemNd,
			win: win
		};
	}

	function _saveItemAfter(res, params) {
		if (!res) {
			return null;
		}

		var itemTypeName = params.itemTypeName;
		var win = params.win;
		var oldParent = params.oldParent;
		var backupCopy = params.backupCopy;
		var tempArray = params.tempArray;
		var confirmSuccess = params.confirmSuccess;
		var itemNd = params.itemNd;
		var itemID = itemNd.getAttribute('id');
		const itemTypeNode = this.getItemTypeForClient(itemTypeName, 'name').node;
		const isVersionableIT =
			this.getItemProperty(itemTypeNode, 'is_versionable') === '1';

		res.setAttribute('levels', '0');
		res.setAttribute('isEditState', this.isEditStateEx(backupCopy) ? '1' : '0');

		var newID = res.getAttribute('id');
		this.updateInCacheEx(backupCopy, res);
		var topWindow;

		if (win && win.isTearOff) {
			if (win.updateItemsGrid) {
				win.updateItemsGrid(res);
			}

			topWindow = window.opener
				? this.getMostTopWindowWithAras(window.opener)
				: null;
			if (topWindow && topWindow.main) {
				if (itemTypeName === 'ItemType') {
					topWindow.updateTree(itemID.split(';'));
				} else if (
					itemTypeName === 'SelfServiceReport' &&
					topWindow.main.work.itemTypeName === 'MyReports'
				) {
					topWindow.main.work.updateReports();
				}
			}
		} else {
			topWindow = this.getMostTopWindowWithAras(window);
			if (itemTypeName == 'ItemType') {
				topWindow.updateTree(itemID.split(';'));
			}
		}

		if (itemTypeName == 'RelationshipType') {
			var relationship_id = this.getItemProperty(itemNd, 'relationship_id');
			if (relationship_id) {
				this.removeFromCache(relationship_id);
			}
		} else if (itemTypeName == 'ItemType') {
			var oldItemTypeName = !this.isTempEx(itemNd)
				? this.getItemTypeName(itemID)
				: null;
			var item_name = oldItemTypeName
				? oldItemTypeName
				: this.getItemProperty(itemNd, 'name');
			this.deletePropertyFromObject(this.sGridsSetups, item_name);
		}

		if (oldParent) {
			var tmpRes = oldParent.selectSingleNode('Item[@id="' + newID + '"]');
			if (
				tmpRes === null &&
				newID != itemID &&
				oldParent.selectSingleNode('Item[@id="' + itemID + '"]') !== null
			) {
				//possible when related item is versionable and relationship behavior is fixed
				//when relationship still points to previous generation.
				tmpRes = this.getFromCache(newID);
				this.updateInCacheEx(tmpRes, res);
				res = this.getFromCache(newID);
			} else {
				res = tmpRes;
			}
		} else {
			res = this.getFromCache(newID);
		}

		if (!res) {
			return null;
		}

		this.doCacheUpdate(false, itemNd, tempArray);

		ClearDependenciesInMetadataCache(this, itemNd);
		if (confirmSuccess) {
			var keyed_name = this.getKeyedNameEx(res);
			if (keyed_name && '' !== keyed_name) {
				this.AlertSuccess(
					this.getResource(
						'',
						'item_methods_ex.item_saved_successfully',
						"'" + keyed_name + "' "
					),
					win
				);
			} else {
				this.AlertSuccess(
					this.getResource('', 'item_methods_ex.item_saved_successfully', ''),
					win
				);
			}
		}
		params = this.newObject();
		params.itemID = itemID;
		params.itemNd = res;
		this.fireEvent('ItemSave', params);

		const storeActions = this.getMainWindow().store.boundActionCreators;

		storeActions[
			isVersionableIT
				? 'deleteItemLocalChangesRecord'
				: 'resetItemLocalChangesRecord'
		](itemTypeName, itemNd.getAttribute('id'));

		if (isVersionableIT) {
			this.fireEvent('ItemVersion', {
				itemPreviousVersion: backupCopy,
				itemLastVersion: res
			});
			storeActions.createItemLocalChangesRecord(itemTypeName, newID);
		}

		return res;
	}

	function getItemsGridContainer(itemTypeId) {
		const topWin = aras.getMainWindow();
		return topWin.mainLayout.tabsContainer.getSearchGridTabs(
			itemTypeId || window.itemType.getAttribute('id')
		);
	}

	/*-- saveItemEx
	 *
	 *   Method to save an item
	 *   id = the id for the item to be saved
	 *
	 */
	Aras.prototype.saveItemEx = function Aras_saveItemEx(
		itemNd,
		confirmSuccess,
		doVersion
	) {
		var params = _saveItemExBefore.call(
			this,
			itemNd,
			confirmSuccess,
			doVersion
		);
		if (!params) {
			return params;
		}
		var res = this.applyItemWithFilesCheck(
			params.itemNd,
			params.win,
			params.statusMsg,
			this.XPathResult('/Item')
		);
		return _saveItemAfter.call(this, res, params);
	};

	Aras.prototype.saveItemExAsync = function Aras_saveItemExAsync(
		itemNd,
		confirmSuccess,
		doVersion,
		isGridUpdate
	) {
		var params = _saveItemExBefore.call(
			this,
			itemNd,
			confirmSuccess,
			doVersion
		);
		if (!params) {
			return Promise.resolve(params);
		}
		return this.applyItemWithFilesCheckAsync(
			params.itemNd,
			params.win,
			params.statusMsg,
			this.XPathResult('/Item'),
			isGridUpdate
		).then(
			function (res) {
				return _saveItemAfter.call(this, res, params);
			}.bind(this)
		);
	};

	Aras.prototype.decorateForMultipleGrids = function Aras_decorateForMultipleGrids(
		fn
	) {
		const decoratedFunction = function (itemNode) {
			const initialArguments = Array.from(arguments);
			const currentItem = typeof itemNode === 'string'
				? window.item
				: itemNode;
			const itemTypeId =currentItem.getAttribute('typeId');
			let itemsGrids = getItemsGridContainer(itemTypeId);
			const typeName = currentItem.getAttribute('type');
			const classification = currentItem.getElementsByTagName('classification')[0];
			if (typeName === 'Part' && classification && classification.text.startsWith('Mechanical Part/')) {
				const extraItemsGrids = getItemsGridContainer('29BCCBE62FDC4589AB67871B19864578');
				if (extraItemsGrids && extraItemsGrids.length) {
					itemsGrids = itemsGrids.concat(extraItemsGrids);
				}
			}

			itemsGrids.forEach(function (itemsGrid) {
				const extendedArguments = initialArguments.slice(0);
				extendedArguments.unshift(itemsGrid);
				fn.apply(null, extendedArguments);
			});
		};
		return decoratedFunction;
	};
})();

Aras.prototype.doCacheUpdate = function Aras_doCacheUpdate(
	prepare,
	itemNd,
	tempArray
) {
	var nodes;
	var i;
	if (prepare) {
		nodes = itemNd.selectNodes(
			'descendant-or-self::Item[@id and (@action="add" or @action="create")]'
		);
		for (i = 0; i < nodes.length; i++) {
			tempArray.push([
				nodes[i].getAttribute('id'),
				nodes[i].getAttribute('type')
			]);
		}
	} else {
		for (i = 0; i < tempArray.length; i++) {
			nodes = this.itemsCache.getItemsByXPath(
				'/Innovator/Items//Item[@id="' +
					tempArray[i][0] +
					'" and (@action="add" or @action="create")]'
			);
			for (var o = 0; o < nodes.length; o++) {
				nodes[o].setAttribute('action', 'skip');
				nodes[o].removeAttribute('isTemp');
				nodes[o].removeAttribute('isDirty');
			}
			if (i === 0) {
				continue;
			}
			var itemID = tempArray[i][0];
		}
	}
};

Aras.prototype.downloadFile = function ArasDownloadFile(fileNd, preferredName) {
	var fileURL = this.getFileURLEx(fileNd);
	if (!fileURL) {
		this.AlertError(
			this.getResource('', 'item_methods_ex.failed_download_file_url_empty')
		);
		return false;
	}

	if (preferredName) {
		this.vault.setLocalFileName(preferredName);
	}
	var isSucceeded = this.vault.downloadFile(fileURL);
	if (!isSucceeded) {
		this.AlertError(
			this.getResource('', 'item_methods_ex.failed_download_file')
		);
		return false;
	}
	return true;
};

// === lockItemEx ====
// Method to lock the item passing the item object
// itemNode = the item
// ===================
Aras.prototype.lockItemEx = function Aras_lockItemEx(itemNode) {
	var ownerWindow = this.uiFindWindowEx2(itemNode),
		itemID = itemNode.getAttribute('id'),
		itemTypeName = itemNode.getAttribute('type'),
		itemType = this.getItemTypeDictionary(itemTypeName),
		isRelationship = this.getItemProperty(itemType.node, 'is_relationship'),
		isPolyItem = this.isPolymorphic(itemType.node);

	if (isRelationship == '1' && this.isDirtyEx(itemNode)) {
		var sourceNd = itemNode.selectSingleNode('../..');

		if (sourceNd && this.isDirtyEx(sourceNd)) {
			const itLabel =
				this.getItemProperty(itemType.node, 'label') ||
				this.getItemProperty(itemType.node, 'name');
			const message = this.getResource(
				'',
				'item_methods_ex.locking_it_lose_changes',
				itLabel
			);

			if (!window.confirm(message)) {
				return null;
			}
		}
	}

	var statusId = this.showStatusMessage(
			'status',
			this.getResource('', 'common.locking_item_type', itemTypeName),
			system_progressbar1_gif
		),
		bodyStr =
			"<Item type='" +
			(!isPolyItem
				? itemTypeName
				: this.getItemTypeName(this.getItemProperty(itemNode, 'itemtype'))) +
			"' id='" +
			itemID +
			"' action='lock' />",
		requestResult = this.soapSend('ApplyItem', bodyStr),
		returnedItem;

	this.clearStatusMessage(statusId);

	var faultCode = requestResult.getFaultCode();
	if (faultCode !== 0 && faultCode !== '0') {
		this.AlertError(requestResult, ownerWindow);
		return null;
	}

	returnedItem = requestResult.results.selectSingleNode(
		this.XPathResult('/Item')
	);
	if (returnedItem) {
		var oldParent = itemNode.parentNode;

		returnedItem.setAttribute('loadedPartialy', '0');
		this.updateInCacheEx(itemNode, returnedItem);

		if (oldParent) {
			itemNode =
				oldParent.selectSingleNode('Item[@id="' + itemID + '"]') ||
				oldParent.selectSingleNode('Item');
		} else {
			itemNode = this.getFromCache(itemID);
		}

		this.fireEvent('ItemLock', {
			itemID: itemNode.getAttribute('id'),
			itemNd: itemNode,
			newLockedValue: this.isLocked(itemNode)
		});
		return itemNode;
	} else {
		this.AlertError(
			this.getResource(
				'',
				'item_methods_ex.failed_get_item_type_from_sever',
				itemTypeName
			),
			'',
			'',
			ownerWindow
		);
		return null;
	}
};

// === unlockItemEx ====
// Method to unlock the item passing the item object
// itemNode = the item
// =====================
Aras.prototype.unlockItemEx = function Aras_unlockItemEx(
	itemNode,
	saveChanges
) {
	var itemTypeName = itemNode.getAttribute('type'),
		ownerWindow = this.uiFindWindowEx2(itemNode);

	if (this.isTempEx(itemNode)) {
		this.AlertError(
			this.getResource(
				'',
				'item_methods_ex.failed_unlock_item_type',
				itemTypeName
			),
			'',
			'',
			ownerWindow
		);
		return null;
	}

	var itemType = this.getItemTypeDictionary(itemTypeName),
		isPolyItem =
			itemType && itemType.node ? this.isPolymorphic(itemType.node) : false;

	if (saveChanges === undefined) {
		var isDirty = this.isDirtyEx(itemNode);

		if (isDirty) {
			let returnedValue = 'btnCancel';
			if (
				window.confirm(
					this.getResource(
						'',
						'item_methods_ex.save_your_changes',
						itemTypeName,
						this.getKeyedNameEx(itemNode)
					)
				)
			) {
				returnedValue = 'btnSaveAndUnlock';
			} else if (
				window.confirm(
					this.getResource(
						'',
						'item_methods_ex.unlocking_discard_your_changes',
						itemTypeName,
						this.getKeyedNameEx(itemNode)
					)
				)
			) {
				returnedValue = 'btnYes';
			}

			if (returnedValue === 'btnCancel') {
				return null;
			}

			saveChanges = returnedValue !== 'btnYes';
		}
	}

	if (saveChanges) {
		itemNode = this.saveItemEx(itemNode);

		if (!itemNode) {
			return null;
		}
		if (itemTypeName === 'Preference') {
			const mainWindow = aras.getMainWindow();
			mainWindow.mainLayout.observer.notify('UpdatePreferences');
		}
	}

	var statusId = this.showStatusMessage(
			'status',
			this.getResource('', 'item_methods_ex.unlocking_itemtype', itemTypeName),
			system_progressbar1_gif
		),
		itemId = itemNode.getAttribute('id'),
		lockedById = itemNode.selectSingleNode('locked_by_id[not(@is_null="1")]'),
		queryResult;

	if (!lockedById) {
		queryResult = this.soapSend(
			'ApplyItem',
			"<Item type='" + itemTypeName + "' id='" + itemId + "' action='get' />"
		);
	} else {
		queryResult = this.soapSend(
			'ApplyItem',
			"<Item type='" +
				(!isPolyItem
					? itemTypeName
					: this.getItemTypeName(this.getItemProperty(itemNode, 'itemtype'))) +
				"' id='" +
				itemId +
				"' action='unlock' />",
			'',
			saveChanges
		);
	}
	this.clearStatusMessage(statusId);

	if (!queryResult.getFaultCode()) {
		var resultItem = queryResult.results.selectSingleNode(
				this.XPathResult('/Item')
			),
			newResult;

		if (resultItem) {
			resultItem.setAttribute('loadedPartialy', '0');

			var oldParent = itemNode.parentNode;
			this.updateInCacheEx(itemNode, resultItem);
			this.updateFilesInCache(resultItem);

			newResult = oldParent
				? oldParent.selectSingleNode('Item[@id="' + itemId + '"]')
				: this.getFromCache(itemId);
			resultItem = newResult || resultItem;

			this.fireEvent('ItemLock', {
				itemID: resultItem.getAttribute('id'),
				itemNd: resultItem,
				newLockedValue: this.isLocked(resultItem)
			});

			if (this.isEditStateEx(itemNode)) {
				this.getMainWindow().store.boundActionCreators.deleteItemLocalChangesRecord(
					resultItem.getAttribute('type'),
					resultItem.getAttribute('id')
				);
			}

			return resultItem;
		} else {
			this.AlertError(
				this.getResource(
					'',
					'item_methods_ex.failed_get_item_type_from_server',
					itemTypeName
				),
				'',
				'',
				ownerWindow
			);
			return null;
		}
	} else {
		this.AlertError(queryResult, ownerWindow);
		return null;
	}
};

Aras.prototype.updateFilesInCache = function Aras_updateFilesInCache(itemNd) {
	var itemTypeName = itemNd.getAttribute('type'),
		isDiscoverOnly = itemNd.getAttribute('discover_only') == '1';

	if (itemTypeName != 'File' && !isDiscoverOnly) {
		var itemType = this.getItemTypeForClient(itemTypeName).node,
			fileProperties = this.getPropertiesOfTypeFile(itemType),
			propertyName,
			fileId,
			fileNode,
			queryItem,
			queryResult,
			i;

		for (i = 0; i < fileProperties.length; i++) {
			propertyName = this.getItemProperty(fileProperties[i], 'name');
			fileId = this.getItemProperty(itemNd, propertyName);

			if (fileId) {
				this.removeFromCache(fileId);

				queryItem = new this.getMostTopWindowWithAras(window).Item();
				queryItem.setType('File');
				queryItem.setAction('get');
				queryItem.setID(fileId);
				queryItem.setAttribute(
					'select',
					'filename,file_size,file_type,checkedout_path,comments,checksum,label,mimetype'
				);
				queryResult = queryItem.apply();

				if (queryResult.isEmpty()) {
				} else {
					if (!queryResult.isError()) {
						fileNode = queryResult.getItemByIndex(0).node;
						this.updateInCache(fileNode);
					} else {
						this.AlertError(queryResult);
						return;
					}
				}
			}
		}
	}
};

Aras.prototype.purgeItemEx = function Aras_purgeItemEx(itemNd, silentMode) {
	/*-- purgeItem
	 *
	 *   Method to delete the latest version of the item (or the item if it's not versionable)
	 *   itemNd -
	 *   silentMode - flag to know if user confirmation is NOT needed
	 *
	 */
	return this.PurgeAndDeleteItem_CommonPartEx(itemNd, silentMode, 'purge');
};

Aras.prototype.deleteItemEx = function Aras_deleteItemEx(itemNd, silentMode) {
	/*-- deleteItem
	 *
	 *   Method to delete all versions of the item
	 *   itemNd -
	 *   silentMode - flag to know if user confirmation is NOT needed
	 *
	 */
	return this.PurgeAndDeleteItem_CommonPartEx(itemNd, silentMode, 'delete');
};

Aras.prototype.PurgeAndDeleteItem_CommonPartEx = function Aras_PurgeAndDeleteItem_CommonPartEx(
	itemNd,
	silentMode,
	purgeORdelete
) {
	/*-- PurgeAndDeleteItem_CommonPartEx
	 *
	 *   This method is for ***internal purposes only***.
	 *
	 */

	if (silentMode === undefined) {
		silentMode = false;
	}

	var ItemId = itemNd.getAttribute('id');
	var ItemTypeName = itemNd.getAttribute('type');

	//prepare
	if (
		!silentMode &&
		!this.Confirm_PurgeAndDeleteItem(
			ItemId,
			this.getKeyedNameEx(itemNd),
			purgeORdelete
		)
	) {
		return false;
	}

	var DeletedItemTypeName;
	var relationship_id;
	if (!this.isTempEx(itemNd)) {
		//save some information
		if (ItemTypeName == 'ItemType') {
			if (this.getItemProperty(itemNd, 'is_relationship') == '1') {
				relationship_id = ItemId;
			}
			DeletedItemTypeName = this.getItemProperty(itemNd, 'name');
		} else if (ItemTypeName == 'RelationshipType') {
			relationship_id = this.getItemProperty(itemNd, 'relationship_id');
			DeletedItemTypeName = this.getItemProperty(itemNd, 'name');
		}

		//delete
		if (
			!this.SendSoap_PurgeAndDeleteItem(ItemTypeName, ItemId, purgeORdelete)
		) {
			return false;
		}
	} else {
		const actions = this.getMainWindow().store.boundActionCreators;
		const updatedChildItems = ArasModules.xml.selectNodes(
			itemNd,
			"Relationships/descendant-or-self::Item[@action!='skip' and (@isTemp='1' or @isDirty='1' or @isEditState='1')]"
		);
		actions.deleteItemLocalChangesRecord(ItemTypeName, ItemId);
		updatedChildItems.forEach(function (item) {
			actions.deleteItemLocalChangesRecord(
				item.getAttribute('type'),
				item.getAttribute('id')
			);
		});
	}

	this.fireEvent('ItemDelete', {
		itemID: ItemId,
		itemTypeName: ItemTypeName
	});

	itemNd.setAttribute('action', 'skip');

	//remove node from parent
	var tmpNd = itemNd.parentNode;
	if (tmpNd) {
		tmpNd.removeChild(itemNd);
	}

	//delete all dependent stuff
	this.RemoveGarbage_PurgeAndDeleteItem(
		ItemTypeName,
		ItemId,
		DeletedItemTypeName,
		relationship_id
	);
	ClearDependenciesInMetadataCache(this, itemNd);

	return true;
};

const keyedNameSorter = (a, b) => {
	const keyOrder1 = a.keyOrder;
	if (isNaN(keyOrder1)) {
		return 1;
	}
	const keyOrder2 = b.keyOrder;
	if (isNaN(keyOrder2)) {
		return -1;
	}

	if (keyOrder1 === keyOrder2) {
		return 0;
	}

	return keyOrder1 < keyOrder2 ? -1 : 1;
};

Aras.prototype.getKeyedNameEx = function Aras_getKeyedNameEx(itemNd) {
	/*----------------------------------------
	 * getKeyedNameEx
	 *
	 * Purpose: build and return keyed name of an Item.
	 *
	 * Arguments:
	 * itemNd - xml node of Item to get keyed name of.
	 */

	let result = '';
	if (itemNd.nodeName !== 'Item') {
		return result;
	}

	if (!this.isDirtyEx(itemNd) && !this.isTempEx(itemNd)) {
		result = itemNd.getAttribute('keyed_name');
		if (result) {
			return result;
		}
		result = this.getItemProperty(itemNd, 'keyed_name');
		if (result) {
			return result;
		}
	}

	const itemTypeName = itemNd.getAttribute('type');
	const itemType = this.getItemTypeDictionary(itemTypeName);
	if (!itemType) {
		return result;
	}

	const itemTypeLabel = itemType.getProperty('label', '');
	const itemID = itemNd.getAttribute('id');

	if (this.isTempEx(itemNd)) {
		let itemTypeTabs = this.tabsTitles[itemTypeName];
		if (!itemTypeTabs) {
			itemTypeTabs = this.newObject();
		}

		if (!itemTypeTabs[itemID]) {
			const tabId = Object.keys(itemTypeTabs).length + 1;
			const tabTitle = `${itemTypeLabel || itemTypeName} ${tabId}`;
			itemTypeTabs[itemID] = tabTitle;
			this.tabsTitles[itemTypeName] = itemTypeTabs;
		}

		result = itemTypeTabs[itemID];
	} else {
		result = itemID;
	}

	const properties = itemType.node.selectNodes(
		'Relationships/Item[(@type="Property") and (./name[text()]) and (./keyed_name_order[text()])]'
	);
	let keyedNameChunks = [];

	properties.forEach((propertyNode) => {
		const propertyName = this.getItemProperty(propertyNode, 'name');
		const keyOrder = this.getItemProperty(propertyNode, 'keyed_name_order');
		const node = itemNd.selectSingleNode(propertyName);
		if (!node || node.childNodes.length !== 1) {
			return;
		}

		const childNode = node.firstChild;
		const propertyValue =
			childNode.nodeType === 1 ? this.getKeyedNameEx(childNode) : node.text;

		if (propertyValue === '') {
			return;
		}

		keyedNameChunks.push({
			keyOrder: parseInt(keyOrder),
			value: propertyValue
		});
	});

	if (keyedNameChunks.length > 0) {
		keyedNameChunks = keyedNameChunks.sort(keyedNameSorter);
		result = keyedNameChunks.reduce((acc, keyedNameChunk) => {
			return `${acc} ${keyedNameChunk.value}`;
		}, keyedNameChunks.shift().value);
	}

	return result;
};

Aras.prototype.getKeyedNameAttribute = function (node, element) {
	if (!node) {
		return;
	}
	var value;
	var tmpNd = node.selectSingleNode(element);
	if (tmpNd) {
		value = tmpNd.getAttribute('keyed_name');
		if (!value) {
			value = '';
		}
	} else {
		value = '';
	}
	return value;
};

/*-- getItemRelationshipsEx
 *
 *   Method to
 *
 *
 */
Aras.prototype.getItemRelationshipsEx = function (
	itemNd,
	relsName,
	pageSize,
	page,
	body,
	forceReplaceByItemFromServer
) {
	if (!(itemNd && relsName)) {
		return null;
	}
	if (pageSize === undefined || pageSize === null) {
		pageSize = '';
	}
	if (page === undefined || page === null) {
		page = '';
	}
	if (body === undefined || body === null) {
		body = '';
	}
	if (
		forceReplaceByItemFromServer === undefined ||
		forceReplaceByItemFromServer === null
	) {
		forceReplaceByItemFromServer = false;
	}

	var itemID = itemNd.getAttribute('id');
	var itemTypeName = itemNd.getAttribute('type');
	var res = null;

	if (
		!forceReplaceByItemFromServer &&
		(pageSize == -1 ||
			this.isTempID(itemID) ||
			(itemNd.getAttribute('levels') &&
				parseInt(itemNd.getAttribute('levels')) > 0))
	) {
		if (
			!isNaN(parseInt(pageSize)) &&
			parseInt(pageSize) > 0 &&
			!isNaN(parseInt(page)) &&
			parseInt(page) > -1
		) {
			res = itemNd.selectNodes(
				'Relationships/Item[@type="' + relsName + '" and @page="' + page + '"]'
			);
			if (res && res.length == pageSize) {
				return res;
			}
		} else {
			res = itemNd.selectNodes('Relationships/Item[@type="' + relsName + '"]');
			if (res && res.length > 0) {
				return res;
			}
		}
	}

	var bodyStr =
		'<Item type="' +
		itemTypeName +
		'" id="' +
		itemID +
		'" relName="' +
		relsName +
		'" action="getItemRelationships"';
	if (pageSize) {
		bodyStr += ' pageSize="' + pageSize + '"';
	}
	if (page) {
		bodyStr += ' page="' + page + '"';
	}
	if (body === '') {
		bodyStr += '/>';
	} else {
		bodyStr += '>' + body + '</Item>';
	}

	res = this.soapSend('ApplyItem', bodyStr);

	var faultCode = res.getFaultCode();
	if (faultCode !== 0 && faultCode !== '0') {
		this.AlertError(res);
		return null;
	}

	if (!itemNd.selectSingleNode('Relationships')) {
		this.createXmlElement('Relationships', itemNd);
	}

	var rels = res.results.selectNodes(
		this.XPathResult('/Item[@type="' + relsName + '"]')
	);
	var itemRels = itemNd.selectSingleNode('Relationships');
	var idsStr = '';
	for (var i = 0; i < rels.length; i++) {
		var rel = rels[i].cloneNode(true);
		var relId = rel.getAttribute('id');
		if (i > 0) {
			idsStr += ' or ';
		}
		idsStr += '@id="' + relId + '"';
		var prevRel = itemRels.selectSingleNode(
			'Item[@type="' + relsName + '" and @id="' + relId + '"]'
		);
		if (prevRel) {
			if (forceReplaceByItemFromServer) {
				// By some reason the previous implementation did not replaced existing on the node
				// relationships with the new relationships obtained from the server but rather
				// just removed some attributes on them (like "pagesize", etc.). From other side those
				// relationships that don't exist on the 'itemNd' are added to it. This is wrong as
				// the newly obtained relationships even if they already exist on 'itemNd' might have
				// some properties that are different in db from what is in the client memory.
				// NOTE: the fix will break the case when the client changes some relationship properties
				//       in memory and then calls this method expecting that these properties will stay unchanged,
				//       but: a) this method seems to be called only from getFileURLEx(..); b) if the above
				//       behavior is expected then another method is probably required which must be called
				//       something like 'mergeRelationships'.
				// by Andrey Knourenko
				itemRels.removeChild(prevRel);
			} else {
				this.mergeItem(prevRel, rel);
				continue;
			}
		}
		itemRels.appendChild(rel);
	}
	itemNd.setAttribute('levels', '0');
	if (idsStr === '') {
		return null;
	}
	res = itemRels.selectNodes(
		'Item[@type="' + relsName + '" and (' + idsStr + ')]'
	);

	return res;
};

/*-- getItemLastVersionEx
 *
 *   Method to load the latest version for the item
 *   itemTypeName = the ItemType name
 *   itemId       = the id for the item
 *
 */
Aras.prototype.getItemLastVersionEx = function (itemNd) {
	var res = this.soapSend(
		'ApplyItem',
		'<Item type="' +
			itemNd.getAttribute('type') +
			'" id="' +
			itemNd.getAttribute('id') +
			'" action="getItemLastVersion" />'
	);

	var faultCode = res.getFaultCode();
	if (faultCode !== 0 && faultCode !== '0') {
		return null;
	}

	res = res.results.selectSingleNode(this.XPathResult('/Item'));
	if (!res) {
		return null;
	}

	itemNd.parentNode.replaceChild(res, itemNd);

	return res;
}; //getItemLastVersionEx

Aras.prototype.downloadItemFiles = function Aras_downloadItemFiles(itemNd) {
	/*
	this method is for internal use *** only ***
	*/
	if (!itemNd) {
		return false;
	}

	var itemTypeName = itemNd.getAttribute('type');
	var itemType = this.getItemTypeForClient(itemTypeName).node;
	var fileProps = this.getPropertiesOfTypeFile(itemType);

	for (var i = 0; i < fileProps.length; i++) {
		var propNm = this.getItemProperty(fileProps[i], 'name');
		var fileNd = itemNd.selectSingleNode(propNm + '/Item');
		if (!fileNd) {
			var fileID = this.getItemProperty(itemNd, propNm);
			if (!fileID) {
				continue;
			}

			fileNd = this.getItemFromServer('File', fileID, 'filename').node;
		}

		if (!fileNd) {
			continue;
		}

		this.downloadFile(fileNd);
	}

	return true;
};

Aras.prototype.promoteEx = function Aras_promoteEx(
	itemNd,
	stateName,
	comments,
	soapController
) {
	if (!itemNd) {
		return null;
	}

	var itemID = itemNd.getAttribute('id');
	var itemTypeName = itemNd.getAttribute('type');

	var promoteParams = {
		typeName: itemTypeName,
		id: itemID,
		stateName: stateName,
		comments: comments
	};

	var res = this.promoteItem_implementation(promoteParams, soapController);
	if (!res) {
		return null;
	}

	var oldParent = itemNd.parentNode;
	this.updateInCacheEx(itemNd, res);

	if (oldParent) {
		res = oldParent.selectSingleNode('Item[@id="' + itemID + '"]');
	} else {
		res = this.getFromCache(itemID);
	}

	var params = this.newObject();
	params.itemID = res.getAttribute('id');
	params.itemNd = res;
	this.fireEvent('ItemSave', params);

	return res;
};

Aras.prototype.getFileURLEx = function Aras_getFileURLEx(itemNd) {
	/*
	 * Private method that returns 'Located' pointing to the vault in which the
	 * specified file resides. The vault is selected by the following algorithm:
	 *   - if file is not stale in the default vault of the current user then return this vault
	 *   - else return the first vault in which the file is not stale
	 * NOTE: file is called 'not stale' in vault if 'Located' referencing the vault has
	 *       the maximum value of property 'file_version' among other 'Located' of the same file.
	 */
	function getLocatedForFile(aras, itemNd) {
		var fitem = aras.newIOMItem();
		fitem.loadAML(itemNd.xml);
		var all_located = fitem.getRelationships('Located');

		// First find the max 'file_version' among all 'Located' rels
		var maxv = 0;
		var lcount = all_located.getItemCount();
		var i;
		var located;
		var file_version;
		for (i = 0; i < lcount; i++) {
			located = all_located.getItemByIndex(i);
			file_version = located.getProperty('file_version') * 1;
			if (file_version > maxv) {
				maxv = file_version;
			}
		}

		var sorted_located = getSortedLocatedList(aras, fitem, all_located);

		// Now go through the sorted list and return first non-stale vault
		for (i = 0; i < sorted_located.length; i++) {
			located = sorted_located[i];
			file_version = located.getProperty('file_version') * 1;
			if (file_version == maxv) {
				return located.node;
			}
		}

		// It should never reach this point as at least one of vaults has non-stale file.
		return null;
	}

	// Build a list of 'Located' sorted by the priorities of vaults that they reference.
	// Sorting is done based on the 'ReadPriority' relationships of the current user + the
	// default vault of the user + remaining vaults.
	function getSortedLocatedList(aras, fitem, all_located) {
		var lcount = all_located.getItemCount();

		var sorted_located = [];

		// Get all required information (default vault; etc.) for the current user
		var aml =
			"<Item type='User' action='get' select='default_vault' expand='1'>" +
			'  <id>' +
			aras.getUserID() +
			'</id>' +
			'  <Relationships>' +
			"    <Item type='ReadPriority' action='get' select='priority, related_id' expand='1' orderBy='priority'/>" +
			'  </Relationships>' +
			'</Item>';

		var ureq = aras.newIOMItem();
		ureq.loadAML(aml);
		var uresult = ureq.apply();
		if (uresult.isError()) {
			throw new Error(1, uresult.getErrorString());
		}

		// Note that because the above AML has 'orderBy' the 'all_rps' collection is sorted
		// by ReadPriority.priority.
		var all_rps = uresult.getRelationships('ReadPriority');
		var rpcount = all_rps.getItemCount();
		var i;
		var l;
		var located;
		for (i = 0; i < rpcount; i++) {
			var vault = all_rps.getItemByIndex(i).getRelatedItem();
			// If the file is in the vault from the "ReadPriority" then add 'Located' that references
			// the vault to the sorted list.
			for (l = 0; l < lcount; l++) {
				located = all_located.getItemByIndex(l);
				if (vault.getID() == located.getRelatedItem().getID()) {
					sorted_located[sorted_located.length] = located;
					break;
				}
			}
		}

		// Now append the 'Located' to the default vault to the list if it's not there yet
		// (providing that the file is in the default vault).
		var dvfound = false;
		var default_vault = uresult.getPropertyItem('default_vault');
		for (i = 0; i < sorted_located.length; i++) {
			if (sorted_located[i].getRelatedItem().getID() == default_vault.getID()) {
				dvfound = true;
				break;
			}
		}
		if (!dvfound) {
			for (i = 0; i < lcount; i++) {
				located = all_located.getItemByIndex(i);
				if (default_vault.getID() == located.getRelatedItem().getID()) {
					sorted_located[sorted_located.length] = located;
					break;
				}
			}
		}

		// Finally append 'Located' to all remaining vaults that the file resides in but that are
		// not in the sorted list yet.
		for (i = 0; i < lcount; i++) {
			located = all_located.getItemByIndex(i);
			var vfound = false;
			for (l = 0; l < sorted_located.length; l++) {
				if (sorted_located[l].getID() == located.getID()) {
					vfound = true;
					break;
				}
			}
			if (!vfound) {
				sorted_located[sorted_located.length] = located;
			}
		}

		return sorted_located;
	}

	/*----------------------------------------
	 * getFileURLEx
	 *
	 * Purpose:
	 * get file URL using the following algorithm:
	 *   - take the default vault of the current user unless the file does not exist or stale in the vault
	 *   - otherwise take the first vault in which the file is not stale
	 *
	 * Arguments:
	 * itemNd - xml node of the File to be downloaded
	 *
	 */
	this.getItemRelationshipsEx(
		itemNd,
		'Located',
		undefined,
		undefined,
		undefined,
		true
	);
	var locatedNd = getLocatedForFile(this, itemNd);

	if (!locatedNd) {
		this.AlertError(
			this.getResource(
				'',
				'item_methods_ex.failed_get_file_vault_could_not_be_located'
			)
		);
		return '';
	}

	var vaultNode = locatedNd.selectSingleNode('related_id/Item[@type="Vault"]');
	var vault_id = '';
	if (!vaultNode) {
		vault_id = locatedNd.selectSingleNode('related_id').text;
		vaultNode = this.getItemById('Vault', vault_id, 0);
	} else {
		vault_id = vaultNode.getAttribute('id');
	}

	var vaultServerURL = vaultNode.selectSingleNode('vault_url').text;
	if (vaultServerURL === '') {
		return '';
	}

	vaultServerURL = this.TransformVaultServerURL(vaultServerURL);

	var fileID = itemNd.getAttribute('id');
	var fileName = this.getItemProperty(itemNd, 'filename');
	var fileURL =
		vaultServerURL +
		'?dbName=' +
		encodeURIComponent(this.getDatabase()) +
		'&fileID=' +
		encodeURIComponent(fileID) +
		'&fileName=' +
		encodeURIComponent(fileName) +
		'&vaultId=' +
		vault_id;
	return fileURL;
};

Aras.prototype.replacePolyItemNodeWithNativeItem = function Aras_replacePolyItemNodeWithNativeItem(
	ritem
) {
	if (!(ritem && ritem.parentNode)) {
		this.AlertError("Item is null or doesn't have parent item.");
		return ritem;
	}
	var typeId = ritem.getAttribute('typeId');
	var relatedItemType = this.getItemTypeForClient(typeId, 'id').node;
	if (!relatedItemType) {
		this.AlertError("Can't get type of related item.");
		return ritem;
	}

	if (this.isPolymorphic(relatedItemType)) {
		var nativeRelatedITID = this.getItemProperty(ritem, 'itemtype');
		var relatedItemNd = this.getItemTypeForClient(nativeRelatedITID, 'id').node;
		if (!relatedItemNd) {
			this.AlertError("Can't get native item type of polymorphic item.");
			return ritem;
		}
		var nativeRelated = this.getItemFromServer(
			this.getItemProperty(relatedItemNd, 'name'),
			ritem.getAttribute('id'),
			'*'
		).node;
		if (nativeRelated) {
			ritem.parentNode.replaceChild(nativeRelated, ritem);
			return nativeRelated;
		}
	}
	return ritem;
};
