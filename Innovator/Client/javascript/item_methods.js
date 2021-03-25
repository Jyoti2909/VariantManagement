// © Copyright by Aras Corporation, 2004-2011.

/*
 *   The item methods extension for the Aras Object.
 *   most of methods in this file use itemID and itemTypeName as parameters
 */

/*-- newFileItem
 *
 *   Method to create a new item of ItemType File
 *   fileNameOrObject = the name of the file or FileObject
 *
 */
Aras.prototype.newFileItem = function Aras_newFileItem(fileNameOrObject) {
	var brief_fileName = '';
	if (typeof fileNameOrObject === 'string') {
		var parts = fileNameOrObject.split(/[\\\/]/);
		brief_fileName = parts[parts.length - 1];
	} else {
		brief_fileName = fileNameOrObject.name;
	}

	var item = this.createXmlElement('Item');
	item.setAttribute('type', 'File');

	item.setAttribute('id', this.generateNewGUID());
	item.setAttribute('action', 'add');
	item.setAttribute('loaded', '1');
	item.setAttribute('levels', '1');
	item.setAttribute('isTemp', '1');

	this.setItemProperty(item, 'filename', brief_fileName);
	this.setItemProperty(item, 'keyed_name', brief_fileName);
	if (typeof fileNameOrObject === 'string') {
		this.setItemProperty(
			item,
			'checkedout_path',
			fileNameOrObject.substring(
				0,
				fileNameOrObject.length - brief_fileName.length - 1
			)
		);
	} else {
		this.setItemProperty(item, 'checkedout_path', '');
		aras.vault.addFileToList(item.getAttribute('id'), fileNameOrObject);
	}
	var fileSize = aras.vault.getFileSize(fileNameOrObject);
	this.setItemProperty(item, 'file_size', fileSize);

	var locatedItemId = this.getRelationshipTypeId('Located');
	if (!locatedItemId) {
		this.AlertError(
			this.getResource('', 'item_methods.located_item_type_not_exist')
		);
		return null;
	}

	var locatedItem = this.newRelationship(
		locatedItemId,
		item,
		false,
		null,
		null
	);
	var vaultServerID = this.getVaultServerID();
	if (vaultServerID == '') {
		this.AlertError(
			this.getResource('', 'item_methods.no_defualt_vault_sever'),
			window
		);
		return null;
	}
	this.setItemProperty(locatedItem, 'related_id', vaultServerID);
	return item;
};

/*-- newItem
 *
 *   Method to create a new item
 *   itemTypeName = the name of the ItemType
 *
 */
Aras.prototype.newItem = function Aras_newItem(
	itemTypeName,
	itemTypeNdOrSpecialArg,
	inArgs
) {
	var self = this;
	function newItem_internal(arasObj, filePath) {
		var item = null;
		var typeId = itemType.getAttribute('id');
		if (itemTypeName == 'Workflow Map') {
			item = arasObj.newWorkflowMap();
			item.setAttribute('typeId', typeId);
			return item;
		}

		if (itemTypeName === 'File') {
			const fileName = itemTypeNdOrSpecialArg;

			if (!fileName) {
				throw new TypeError(
					'When creating an item of type File, the second argument (file name or file object) is required.'
				);
			}

			item = arasObj.newFileItem(fileName);
			item.setAttribute('typeId', typeId);
			return item;
		}

		item = self.createXmlElement('Item');
		item.setAttribute('type', itemTypeName);

		item.setAttribute('id', arasObj.GUIDManager.GetGUID());
		item.setAttribute('action', 'add');
		item.setAttribute('loaded', '1');
		item.setAttribute('levels', '1');
		item.setAttribute('isTemp', '1');
		item.setAttribute('typeId', typeId);

		var properties = itemType.selectNodes(
			'Relationships/Item[@type="Property" and default_value and not(default_value[@is_null="1"])]'
		);

		for (var i = 0; i < properties.length; i++) {
			var property = properties[i];
			var propertyName = arasObj.getItemProperty(property, 'name');
			var dataType = arasObj.getItemProperty(property, 'data_type');
			var defaultValue = arasObj.getItemProperty(property, 'default_value');
			if (dataType == 'item') {
				var dataSource = property.selectSingleNode('data_source');
				if (dataSource) {
					dataSource = dataSource.getAttribute('name');
				}
				if (dataSource) {
					defaultValue = arasObj.getItemById(dataSource, defaultValue, 0);
				}
			}
			arasObj.setItemProperty(
				item,
				propertyName,
				defaultValue,
				undefined,
				itemType
			);
		}

		if (itemTypeName == 'Life Cycle Map') {
			var stateTypeID = arasObj.getRelationshipTypeId('Life Cycle State');
			var newState = arasObj.newRelationship(stateTypeID, item);
			arasObj.setItemProperty(newState, 'name', 'Start');
			arasObj.setItemProperty(
				newState,
				'image',
				'../images/LifeCycleState.svg'
			);
			arasObj.setItemProperty(item, 'start_state', newState.getAttribute('id'));
		} else if (itemTypeName == 'Form') {
			arasObj.setItemProperty(item, 'stylesheet', '../styles/default.css');
			var relTypeID = arasObj.getRelationshipTypeId('Body');
			var bodyRel = arasObj.newRelationship(relTypeID, item);
		} else if (itemTypeName == 'Project Template') {
			const rootWBS = arasObj.newItem('WBS Element');
			arasObj.setItemProperty(rootWBS, 'name', 'New Element');
			arasObj.setItemProperty(rootWBS, 'is_top', '1');
			arasObj.setItemProperty(rootWBS, 'wbs_index', '0');
			arasObj.setItemProperty(item, 'wbs_id', rootWBS);
		}

		return item;
	}

	var isItemTypeSpecified =
		itemTypeNdOrSpecialArg && itemTypeNdOrSpecialArg.xml;
	var itemType = isItemTypeSpecified
		? itemTypeNdOrSpecialArg
		: this.getItemTypeForClient(itemTypeName).node;
	if (!itemType) {
		this.AlertError(
			this.getResource('', 'ui_methods_ex.item_type_not_found', itemTypeName)
		);
		return false;
	}

	if (this.isPolymorphic(itemType)) {
		const srcItemTypeId = this.getItemProperty(itemType, 'id');
		const selectionDialog = window.ArasCore.Dialogs.polySources(srcItemTypeId);
		return selectionDialog.then((newTypeName) => {
			if (!newTypeName) {
				return null;
			}

			const newItemNode = this.newItem(newTypeName);
			this.itemsCache.addItem(newItemNode);
			return newItemNode;
		});
	}

	var onBeforeNewEv = itemType.selectNodes(
		'//Item[client_event="OnBeforeNew"]/related_id/Item'
	);
	var onAfterNewEv = itemType.selectNodes(
		'//Item[client_event="OnAfterNew"]/related_id/Item'
	);
	var onNewEv = itemType.selectSingleNode(
		'//Item[client_event="OnNew"]/related_id/Item'
	);

	var res;
	var xml = "<Item type='" + itemTypeName + "'/>";

	if (onBeforeNewEv.length) {
		for (var i = 0; i < onBeforeNewEv.length; i++) {
			try {
				res = this.evalMethod(
					this.getItemProperty(onBeforeNewEv[i], 'name'),
					xml
				);
			} catch (exp) {
				this.AlertError(
					this.getResource('', 'item_methods.event_handler_failed'),
					this.getResource(
						'',
						'item_methods.event_handler_failed_with_message',
						exp.description
					),
					this.getResource('', 'common.client_side_err')
				);
				return null;
			}
			if (res === false) {
				return null;
			}
		}
	}
	if (onNewEv) {
		res = this.evalMethod(this.getItemProperty(onNewEv, 'name'), xml, inArgs);
		if (res) {
			res = res.node;
		}
		if (!res) {
			return null;
		}
	} else {
		res = newItem_internal(this);
	}

	if (onAfterNewEv.length && res) {
		for (var i = 0; i < onAfterNewEv.length; i++) {
			try {
				res = this.evalMethod(
					this.getItemProperty(onAfterNewEv[i], 'name'),
					res.xml
				);
			} catch (exp) {
				this.AlertError(
					this.getResource('', 'item_methods.event_handler_failed'),
					this.getResource(
						'',
						'item_methods.event_handler_failed_with_message',
						exp.description
					),
					this.getResource('', 'common.client_side_err')
				);
				return null;
			}

			if (res) {
				res = res.node;
			}
			if (!res) {
				return null;
			}
		}
	}

	if (onNewEv) {
		for (var name in this.windowsByName) {
			try {
				var win = this.windowsByName[name];
				if (win && win.onRefresh) {
					win.onRefresh();
				}
			} catch (excep) {}
		}
	}

	this.getMainWindow().store.boundActionCreators.createItemLocalChangesRecord(
		itemTypeName,
		res.getAttribute('id')
	);

	return res;
};

/*
 * this function add item to packageDefinition
 */
Aras.prototype.addItemToPackageDef = function (strArrOfId, itemTypeName) {
	//check if items selected in grid
	if (strArrOfId.length < 1) {
		return;
	}
	var ArasObj = this;
	var arrayOfPacakge = [];
	var packArray = null;
	var countOfPacks = 0;
	var itemTypeLabel = '';
	var itemTypeId = this.getItemTypeId(itemTypeName);

	// We need to replace id with config_id.
	var copyOfIds = new Array();
	for (var i = 0; i < strArrOfId.length; i++) {
		copyOfIds.push("'" + strArrOfId[i] + "'");
	}

	var aml =
		"<Item type='" +
		itemTypeName +
		"' action='get' select='config_id'><id condition='in'>" +
		copyOfIds.join(',') +
		'</id></Item>';
	var res = this.soapSend('ApplyItem', aml);
	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return;
	}
	res = res.getResultsBody();
	var result = this.createXMLDocument();
	result.loadXML(res);

	if (result.selectNodes('./Result').length === 1) {
		result = result.selectSingleNode('./Result');
	}
	for (var i = 0; i < result.selectNodes('./Item').length; i++) {
		strArrOfId[i] = result.selectSingleNode(
			"./Item[id='" + strArrOfId[i] + "']/config_id"
		).text;
	}

	//check if PackageDefinition exist
	var packageDefId = this.getItemTypeId('PackageDefinition');
	if (!packageDefId) {
		ArasObj.AlertError(
			this.getResource(
				'',
				'item_methods.unable_get_package_definition_item_type'
			)
		);
		return;
	}

	//getting the label of ItemType
	var itemType = this.getItemTypeForClient(itemTypeName);
	if (itemType) {
		//IR-014145 'Problem report with 'Add To Package Definition'' fix: we need only "en" label.
		var qyItemWithEnLbl = new this.getMostTopWindowWithAras(window).Item();
		qyItemWithEnLbl.setAction('get');
		qyItemWithEnLbl.setType('ItemType');
		qyItemWithEnLbl.setProperty('name', itemTypeName);
		qyItemWithEnLbl.setAttribute('select', '*');
		qyItemWithEnLbl.setAttribute('language', 'en');
		resItemWithEnLbl = qyItemWithEnLbl.apply();
		itemTypeLabel = resItemWithEnLbl.getProperty('label', undefined, 'en');

		if (itemTypeLabel === undefined) {
			itemTypeLabel = itemTypeName;
		}
	} else {
		ArasObj.AlertError(
			this.getResource('', 'item_methods.unable_get_item_type', itemTypeName),
			ArasObj.getFaultString(qry.dom),
			ArasObj.getFaultActor(qry.dom)
		);
		return;
	}

	//query all packages existing in DBO
	getAllpackages();

	function ApplyItemInternal(action, type, attr, props) {
		var query = new ArasObj.getMostTopWindowWithAras(window).Item();
		query.setAction(action);
		query.setType(type);
		query.setAttribute('doGetItem', 0);

		f(attr, true);
		f(props);

		function f(arr, isAttr) {
			if (arr && arr.length != 0) {
				for (var i = 0; i < arr.length; i++) {
					var tmp = arr[i].split('|');
					if (isAttr) {
						query.setAttribute(tmp[0], tmp[1]);
					} else {
						query.setProperty(tmp[0], tmp[1]);
					}
				}
			}
		}
		return query.apply();
	}

	/*
	 * this function request all packages
	 */
	function getAllpackages() {
		packArray = ApplyItemInternal(
			'get',
			'PackageDefinition',
			new Array('select|name, id'),
			new Array('is_current|1')
		);
		countOfPacks = packArray.getItemCount();
	}

	/***
	 * Add selected itemtype to package
	 * @param strSelectedPack name of package
	 */
	function addItemsToPackage(strSelectedPack) {
		// Get id of PackageDefinition
		var strIdOfPackNode = packArray.dom.selectSingleNode(
			".//Result/Item[name='" + strSelectedPack + "']/id"
		);

		// If user didn't checked any package
		if (!strIdOfPackNode) {
			return;
		}

		var strIdOfPack = strIdOfPackNode.text;

		// Get id of PackageGroup
		var qry = ApplyItemInternal(
			'get',
			'PackageGroup',
			new Array('select|id'),
			new Array('source_id|' + strIdOfPack, 'name|' + itemTypeLabel)
		);
		// In case group not exist create new one
		if (qry.isError()) {
			qry = ApplyItemInternal(
				'add',
				'PackageGroup',
				null,
				new Array('source_id|' + strIdOfPack, 'name|' + itemTypeLabel)
			);
			if (qry.isError()) {
				ArasObj.AlertError(
					ArasObj.getResource(
						'',
						'item_methods.unable_add_group',
						itemTypeLabel
					),
					ArasObj.getFaultString(qry.dom),
					ArasObj.getFaultActor(qry.dom)
				);
				return;
			}
		}
		var strIdOfGroup = qry.getAttribute('id');
		var bWasError = false;

		for (var i = 0; i < strArrOfId.length; i++) {
			var strKeyedName = ArasObj.getKeyedName(strArrOfId[i], itemTypeName);
			qry = ApplyItemInternal(
				'get',
				'PackageElement',
				new Array('select|id'),
				new Array('source_id|' + strIdOfGroup, 'element_id|' + strArrOfId[i])
			);
			if (qry.isError()) {
				qry = ApplyItemInternal(
					'add',
					'PackageElement',
					null,
					new Array(
						'source_id|' + strIdOfGroup,
						'element_id|' + strArrOfId[i],
						'name|' + strKeyedName,
						'element_type|' + itemTypeName
					)
				);
				if (qry.isError()) {
					bWasError = true;
					ArasObj.AlertError(
						ArasObj.getResource(
							'',
							'item_methods.unable_add_item',
							strKeyedName
						),
						ArasObj.getFaultString(qry.dom),
						ArasObj.getFaultActor(qry.dom)
					);
				}
			} else {
				bWasError = true;
				ArasObj.AlertError(
					ArasObj.getResource(
						'',
						'item_methods.item_already_exsist_in_package',
						strKeyedName,
						strSelectedPack
					)
				);
			}
		}

		if (!bWasError) {
			if (strArrOfId.length > 1) {
				ArasObj.AlertSuccess(
					ArasObj.getResource('', 'item_methods.items_added_successfully')
				);
			} else {
				ArasObj.AlertSuccess(
					ArasObj.getResource('', 'item_methods.item_added_successfully')
				);
			}
		}
	}

	/*
	 *param strNameOfPack   - name of new package to be created
	 *param strArrdependOns - array of package names to be depended by new package
	 */
	function createPackage(strNameOfPack, strArrdependOns) {
		qry = ArasObj.getItemFromServerByName(
			'PackageDefinition',
			strNameOfPack,
			'id'
		);
		if (qry && !qry.isError()) {
			ArasObj.AlertError(
				ArasObj.getResource(
					'',
					'item_methods.package_with_such_name_already_exist'
				)
			);
			return false;
		} else {
			qry = ApplyItemInternal(
				'add',
				'PackageDefinition',
				null,
				new Array('name|' + strNameOfPack)
			);
			if (qry.isError()) {
				ArasObj.AlertError(
					ArasObj.getResource(
						'',
						'item_methods.unable_add_package_with_name',
						strNameOfPack
					),
					ArasObj.getFaultString(qry.dom),
					ArasObj.getFaultActor(qry.dom)
				);
				return false;
			}

			var strIdOfpack = qry.node.getAttribute('id');
			for (var i = 0; i < strArrdependOns.length; i++) {
				qry = ApplyItemInternal(
					'add',
					'PackageDependsOn',
					null,
					new Array('name|' + strArrdependOns[i], 'source_id|' + strIdOfpack)
				);
				if (qry.isError()) {
					ArasObj.AlertError(
						ArasObj.getResource(
							'',
							'item_methods.Unable to add dependency',
							strArrdependOns[i]
						),
						ArasObj.getFaultString(qry.dom),
						ArasObj.getFaultActor(qry.dom)
					);
					return false;
				}
			}
		}
		return true;
	}

	for (var i = 0; i < packArray.getItemCount(); i++) {
		var packItem = packArray.getItemByIndex(i);
		var propName = packItem.getProperty('name');
		arrayOfPacakge.push(propName);
	}
	var topWindow = this.getMostTopWindowWithAras(window);
	topWindow.ArasCore.Dialogs.selectPackageDefinition(arrayOfPacakge).then(
		function (packageName) {
			if (!packageName) {
				return;
			}
			if (packageName === 'create new') {
				return topWindow.ArasCore.Dialogs.createNewPackage(arrayOfPacakge).then(
					function (objectNewPack) {
						if (objectNewPack && objectNewPack.packageName) {
							var bResult = createPackage(
								objectNewPack.packageName,
								objectNewPack.dependency
							);
							if (bResult) {
								getAllpackages();
								addItemsToPackage(objectNewPack.packageName);
							}
						}
					}
				);
			}
			addItemsToPackage(packageName);
		}
	);
};

/*-- newRelationship
 *
 *   Method to create a new Relationship for an item
 *   relTypeId = the RelatinshpType id
 *   srcItem   = the source item in the relationship (may be null:i.e. when created with mainMenu)
 *   searchDialog = true or false : if search dialog to be displayed
 *   wnd =  the window from which the dialog is opened
 *
 */
Aras.prototype.newRelationship = function (
	relTypeId,
	srcItem,
	searchDialog,
	wnd,
	relatedItem,
	relatedTypeName,
	bTestRelatedItemArg,
	bIsDoGetItemArg,
	descByTypeName
) {
	var processAddingRelationship = function (relatedItem) {
		if (descByTypeName == undefined) {
			descByTypeName = this.getItemTypeName(descByTypeId);
		}

		var descByItem = this.newItem(descByTypeName);
		this.itemsCache.addItem(descByItem);
		if (!descByItem) {
			return null;
		}

		if (relatedId != '' && !descByItem.selectSingleNode('related_id')) {
			this.createXmlElement('related_id', descByItem);
		}
		if (relatedItem) {
			if (srcItem) {
				if (relatedItem == srcItem) {
					relatedItem = srcItem.cloneNode(true);
					var relationshipsNd = relatedItem.selectSingleNode('Relationships');
					if (relationshipsNd) {
						relatedItem.removeChild(relationshipsNd);
					}
					relationshipsNd = null;
					relatedItem.setAttribute('action', 'skip');
				}
			}

			if (this.isTempID(relatedId)) {
				descByItem.selectSingleNode('related_id').appendChild(relatedItem);
			} else {
				descByItem
					.selectSingleNode('related_id')
					.appendChild(relatedItem.cloneNode(true));
			}
		}

		if (relTypeName == 'RelationshipType') {
			if (srcItem) {
				this.setItemProperty(
					descByItem,
					'source_id',
					srcItem.getAttribute('id')
				);
			}
		}

		if (srcItem) {
			if (!srcItem.selectSingleNode('Relationships')) {
				srcItem.appendChild(
					srcItem.ownerDocument.createElement('Relationships')
				);
			}

			var relationship;
			try {
				relationship = srcItem
					.selectSingleNode('Relationships')
					.appendChild(descByItem);
				//        relationship = srcItem.selectSingleNode('Relationships').appendChild(descByItem.cloneNode(true));
			} catch (excep) {
				if (excep.number == -2147467259) {
					this.AlertError(
						this.getResource('', 'item_methods.recursion_not_allowed_here'),
						wnd
					);
					return null;
				} else {
					throw excep;
				}
			}
			relationship.setAttribute('typeId', descByTypeId);
			relationship.setAttribute('action', 'add');
			relationship.setAttribute('loaded', '1');
			relationship.setAttribute('levels', '0');

			if (bIsDoGetItem) {
				relationship.setAttribute('doGetItem', '0');
			}

			this.setItemProperty(
				relationship,
				'source_id',
				srcItem.getAttribute('id')
			);

			//      descByItem.parentNode.removeChild(descByItem);
			return relationship;
		} else {
			return descByItem;
		}
	};

	var bTestRelatedItem;
	if (bTestRelatedItemArg == undefined) {
		bTestRelatedItem = false;
	} else {
		bTestRelatedItem = bTestRelatedItemArg;
	}

	var bIsDoGetItem;
	if (bIsDoGetItemArg == undefined) {
		bIsDoGetItem = false;
	} else {
		bIsDoGetItem = bIsDoGetItemArg;
	}

	var srcItemID;
	if (srcItem) {
		srcItemID = srcItem.getAttribute('id');
		if (!wnd) {
			wnd = this.uiFindWindowEx(srcItemID);
			if (!wnd) {
				wnd = window;
			}
		}
	} else if (!wnd) {
		wnd = window;
	}

	relType = this.getRelationshipType(relTypeId).node;
	var relTypeName = this.getItemProperty(relType, 'name');
	var relatedTypeId = this.getItemProperty(relType, 'related_id');
	var descByTypeId = this.getItemProperty(relType, 'relationship_id');
	var relatedId = '';

	if (relatedItem) {
		relatedId = relatedItem.getAttribute('id');
	}

	if (relatedTypeId) {
		if (relatedTypeName == undefined) {
			relatedTypeName = this.getItemTypeName(relatedTypeId);
		}

		if (searchDialog) {
			var params = {
				aras: this.getMostTopWindowWithAras(wnd).aras,
				itemtypeName: relatedTypeName,
				sourceItemTypeName:
					srcItem && srcItem.xml ? srcItem.getAttribute('type') : '',
				sourcePropertyName: 'related_id',
				type: 'SearchDialog'
			};
			wnd.ArasModules.MaximazableDialog.show('iframe', params);

			if (relatedId == undefined) {
				return null;
			}

			relatedId = relatedId.itemID;
			if (!relatedId) {
				return null;
			}

			// TODO: should be done in memory no need to call the server
			relatedItem = this.getItemFromServer(relatedTypeName, relatedId, 'id')
				.node;
		} else {
			if (relatedItem === undefined || bTestRelatedItem == true) {
				relatedItem = this.newItem(relatedTypeName, null, wnd);
				if (relatedItem && relatedItem.then) {
					return relatedItem.then(
						function (relatedItem) {
							this.itemsCache.addItem(relatedItem);
							if (!relatedItem) {
								return null;
							}
							relatedId = relatedItem.getAttribute('id');
							return processAddingRelationship.call(this, relatedItem);
						}.bind(this)
					);
				} else {
					this.itemsCache.addItem(relatedItem);
					if (!relatedItem) {
						return null;
					}
					relatedId = relatedItem.getAttribute('id');
					return processAddingRelationship.call(this, relatedItem);
				}
			}
		}
	}
	return processAddingRelationship.call(this, relatedItem);
};

/*-- copyItem
 *
 *   Method to copy an item
 *   item = item to be cloned
 *
 */
Aras.prototype.copyItem = function (itemTypeName, itemID) {
	if (itemID == undefined) {
		return null;
	}

	var itemNd = this.getItemById('', itemID, 0);
	if (itemNd) {
		return this.copyItemEx(itemNd);
	} else {
		if (itemTypeName == undefined) {
			return null;
		}

		var bodyStr = '<Item type="' + itemTypeName + '" id="' + itemID + '" ';
		if (itemTypeName.search(/^ItemType$|^RelationshipType$|^User$/) == 0) {
			bodyStr += ' action="copy" />';
		} else {
			bodyStr += ' action="copyAsNew" />';
		}

		var res = null;

		var statusId = this.showStatusMessage(
			'status',
			this.getResource('', 'common.copying_item'),
			system_progressbar1_gif
		);
		res = this.soapSend('ApplyItem', bodyStr);
		this.clearStatusMessage(statusId);

		if (res.getFaultCode() != 0) {
			var win = this.uiFindWindowEx(itemID);
			if (!win) {
				win = window;
			}
			this.AlertError(res, win);
			return null;
		}

		var itemCopy = res.results.selectSingleNode('//Item');
		return itemCopy;
	}
};

/*-- saveItem
 *
 *   Method to save an item
 *   itemID = the id for the item to be saved
 *   confirmSuccess
 */
Aras.prototype.saveItem = function (itemID, confirmSuccess) {
	if (!itemID) {
		return null;
	}
	var itemNd = this.getFromCache(itemID);
	if (!itemNd) {
		return null;
	} else {
		return this.saveItemEx(itemNd, confirmSuccess);
	}
};

/*-- addItem
 *
 *   Method to add an item
 *   itemID = the id for the item
 *
 */
Aras.prototype.addItem = function (itemID) {
	if (!itemID) {
		return false;
	}
	var itemNd = this.getItemById('', itemID, 0);
	if (!itemNd) {
		return false;
	} else {
		return this.saveItemEx(itemNd);
	}
};

/*-- updateItem
 *
 *   Method to update an item
 *   itemID = the id for the item
 *
 */
Aras.prototype.updateItem = function (itemID) {
	if (!itemID) {
		return false;
	}
	var itemNd = this.getItemById('', itemID, 0);
	if (!itemNd) {
		return false;
	} else {
		return this.saveItemEx(itemNd);
	}
};

/*-- versionItem
 *
 *   Method to version the item
 *   id = the id for the item
 *
 */
Aras.prototype.versionItem = function (itemTypeName, itemID) {
	if (!itemID) {
		return false;
	}

	const itemViewWindow = this.uiFindWindowEx(itemID);
	if (itemViewWindow) {
		itemViewWindow.close(null, true);
		if (this.uiFindWindowEx(itemID)) {
			this.AlertError(
				this.getResource('', 'item_methods.cannot_close_item_window')
			);
			return false;
		}
	}

	const itemNode = this.getItemById('', itemID, 0);
	if (!itemNode) {
		return false;
	}

	const newVersionItem = this.saveItemEx(itemNode, true, true);
	if (newVersionItem) {
		if (newVersionItem.getAttribute('isEditState') !== '1') {
			this.getMainWindow().store.boundActionCreators.deleteItemLocalChangesRecord(
				itemTypeName,
				newVersionItem.getAttribute('id')
			);
		}

		if (itemViewWindow) {
			this.uiShowItemEx(newVersionItem);
		}
	}
	return newVersionItem;
};

Aras.prototype.getAffectedItems = function (itemTypeName, itemId) {
	var res;
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.getting_affected_items'),
		system_progressbar1_gif
	);
	res = this.soapSend(
		'ApplyItem',
		"<Item type='" +
			itemTypeName +
			"' id='" +
			itemId +
			"' action='getAffectedItems'/>"
	);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return null;
	}

	return res.results.selectNodes('//Item');
}; //function getAffectedItems

Aras.prototype.purgeItem = function Aras_purgeItem(
	itemTypeName,
	itemID,
	silentMode
) {
	/*-- purgeItem
	 *
	 *   Method to delete the latest version of the item (or the item if it's not versionable)
	 *   itemTypeName -
	 *   itemID = the id for the item
	 *   silentMode - flag to know if user confirmation is NOT needed
	 *
	 */

	return this.PurgeAndDeleteItem_CommonPart(
		itemTypeName,
		itemID,
		silentMode,
		'purge'
	);
};

Aras.prototype.deleteItem = function Aras_deleteItem(
	itemTypeName,
	itemID,
	silentMode
) {
	/*-- deleteItem
	 *
	 *   Method to delete all versions of the item
	 *   itemTypeName -
	 *   itemID = the id for the item
	 *   silentMode - flag to know if user confirmation is NOT needed
	 *
	 */

	return this.PurgeAndDeleteItem_CommonPart(
		itemTypeName,
		itemID,
		silentMode,
		'delete'
	);
};

Aras.prototype.GetOperationName_PurgeAndDeleteItem = function Aras_GetOperationName_PurgeAndDeleteItem(
	purgeORdelete
) {
	return purgeORdelete == 'delete' ? 'Deleting' : 'Purge';
};

Aras.prototype.Confirm_PurgeAndDeleteItem = function Aras_Confirm_PurgeAndDeleteItem(
	itemId,
	keyedName,
	purgeORdelete
) {
	var dialogMessageResourceKey =
		'item_methods.' +
		(purgeORdelete === 'delete' ? 'delete_confirmation' : 'purge_confirmation');
	const win = this.uiFindWindowEx(itemId) || window;
	win.focus();

	const message = this.getResource('', dialogMessageResourceKey, keyedName);
	if (window.confirm(message)) {
		return true;
	}

	return false;
};

Aras.prototype.SendSoap_PurgeAndDeleteItem = function Aras_SendSoap_PurgeAndDeleteItem(
	ItemTypeName,
	ItemId,
	purgeORdelete
) {
	/*-- SendSoap_PurgeAndDeleteItem
	 *
	 *   This method is for ***internal purposes only***.
	 *
	 */

	var Operation = this.GetOperationName_PurgeAndDeleteItem(purgeORdelete);
	var StatusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.operation_item', Operation),
		system_progressbar1_gif
	);
	var res = this.soapSend(
		'ApplyItem',
		"<Item type='" +
			ItemTypeName +
			"' id='" +
			ItemId +
			"' action='" +
			purgeORdelete +
			"' />",
		null,
		false
	);
	this.clearStatusMessage(StatusId);

	if (res.getFaultCode() != 0) {
		var win = this.uiFindWindowEx(ItemId);
		if (!win) {
			win = window;
		}

		this.AlertError(res, win);
		return false;
	}

	return true;
};

Aras.prototype.RemoveGarbage_PurgeAndDeleteItem = function Aras_RemoveGarbage_PurgeAndDeleteItem(
	ItemTypeName,
	ItemId,
	DeletedItemTypeName,
	relationship_id
) {
	/*-- RemoveGarbage_PurgeAndDeleteItem
	 *
	 *   This method is for ***internal purposes only***.
	 *
	 */
	if (ItemTypeName == 'ItemType' || ItemTypeName == 'RelationshipType') {
		if (DeletedItemTypeName) {
			//remove instances of the deleted ItemType
			this.itemsCache.deleteItems(
				"/Innovator/Items/Item[@type='" + DeletedItemTypeName + "']"
			);
			// TODO: remove mainWnd.Cache also.
		}
		if (relationship_id) {
			//remove corresponding ItemType or RelationshipType
			this.itemsCache.deleteItems(
				"/Innovator/Items/Item[@id='" + relationship_id + "']"
			);
			this.itemsCache.deleteItems(
				"/Innovator/Items/Item[@type='RelationshipType'][relationship_id='" +
					relationship_id +
					"']"
			);
		}
	}

	//find and remove all duplicates in dom
	//this helps to fix IR-006266 for example
	this.itemsCache.deleteItems("/Innovator/Items//Item[@id='" + ItemId + "']");
};

Aras.prototype.PurgeAndDeleteItem_CommonPart = function Aras_PurgeAndDeleteItem_CommonPart(
	ItemTypeName,
	ItemId,
	silentMode,
	purgeORdelete
) {
	/*-- PurgeAndDeleteItem_CommonPart
	 *
	 *   This method is for ***internal purposes only***.
	 *   Is allowed to be called only from inside aras.deleteItem and aras.purgeItem methods.
	 *
	 */
	if (silentMode === undefined) {
		silentMode = false;
	}
	var itemNd = this.itemsCache.getItem(ItemId);

	if (itemNd) {
		return this.PurgeAndDeleteItem_CommonPartEx(
			itemNd,
			silentMode,
			purgeORdelete
		);
	} else {
		//prepare
		if (!silentMode) {
			if (
				!this.Confirm_PurgeAndDeleteItem(
					ItemId,
					this.getKeyedName(ItemId),
					purgeORdelete
				)
			) {
				return false;
			}
		}

		var DeletedItemTypeName;
		var relationship_id;
		if (!this.isTempID(ItemId)) {
			//save some information
			if (ItemTypeName == 'ItemType') {
				var tmpItemTypeNd = this.getItemFromServer(
					'ItemType',
					ItemId,
					'name,is_relationship'
				);
				if (tmpItemTypeNd) {
					tmpItemTypeNd = tmpItemTypeNd.node; //because getItemFromServer returns IOM Item...
				}
				if (tmpItemTypeNd) {
					if (this.getItemProperty(tmpItemTypeNd, 'is_relationship') == '1') {
						relationship_id = ItemId;
					}
					DeletedItemTypeName = this.getItemProperty(tmpItemTypeNd, 'name');
				}
				tmpItemTypeNd = null;
			} else if (ItemTypeName == 'RelationshipType') {
				var tmpRelationshipTypeNd = this.getItemFromServer(
					'RelationshipType',
					ItemId,
					'relationship_id,name'
				);
				if (tmpRelationshipTypeNd) {
					tmpRelationshipTypeNd = tmpRelationshipTypeNd.node; //because getItemFromServer returns IOM Item...
				}
				if (tmpRelationshipTypeNd) {
					relationship_id = this.getItemProperty(
						tmpRelationshipTypeNd,
						'relationship_id'
					);
					DeletedItemTypeName = this.getItemProperty(
						tmpRelationshipTypeNd,
						'name'
					);
				}
				tmpRelationshipTypeNd = null;
			} else if (ItemTypeName == 'Preference') {
				this.deleteSavedSearchesByPreferenceIDs([ItemId]);
			}
			//delete
			if (
				!this.SendSoap_PurgeAndDeleteItem(ItemTypeName, ItemId, purgeORdelete)
			) {
				return false;
			}
		}

		//delete all dependent stuff
		if (ItemTypeName == 'ItemType' || ItemTypeName == 'RelationshipType') {
			this.RemoveGarbage_PurgeAndDeleteItem(
				ItemTypeName,
				ItemId,
				DeletedItemTypeName,
				relationship_id
			);
		}

		this.MetadataCache.RemoveItemById(ItemId);
	}

	return true;
};

Aras.prototype.deleteSavedSearchesByPreferenceIDs = function Aras_deleteSavedSearchesByPreferenceIDs(
	preferenceIDs
) {
	var idsString = "'" + preferenceIDs.join("','") + "'";

	var qry = this.newIOMItem('SavedSearch', 'get');
	qry.SetAttribute('select', 'id');
	qry.SetAttribute(
		'where',
		'[SavedSearch].owned_by_id in (SELECT identity_id FROM [Preference] WHERE id in (' +
			idsString +
			")) AND [SavedSearch].auto_saved='1'"
	);
	qry.SetProperty('auto_saved', '1');
	var res = qry.apply();

	if (!res.isEmpty() && !res.isError()) {
		var items = res.getItemsByXPath(
			this.XPathResult("/Item[@type='SavedSearch']")
		);
		for (var i = 0; i < items.getItemCount(); i++) {
			this.MetadataCache.RemoveItemById(items.getItemByIndex(i).getID());
		}

		var deleteSavedSearchesAml =
			'<AML>' +
			"	<Item type='SavedSearch' action='delete' where=\"[SavedSearch].owned_by_id in (SELECT identity_id FROM [Preference] WHERE id in (" +
			idsString +
			")) AND [SavedSearch].auto_saved='1'\">" +
			'	</Item>' +
			'</AML>';

		res = this.applyAML(deleteSavedSearchesAml);
	}
};

Aras.prototype.deletePreferences = function Aras_deletePreferences(
	preferenceIDs
) {
	this.deleteSavedSearchesByPreferenceIDs(preferenceIDs);

	this.soapSend(
		'ApplyItem',
		'<Item type="Preference" action="delete" idlist="' +
			preferenceIDs.join(',') +
			'"/>'
	);

	const preferenceMainItemID = this.getVariable('PreferenceMainItemID');
	preferenceIDs.forEach(function (preferenceId) {
		this.MetadataCache.RemoveItemById(preferenceId);
		if (preferenceId === preferenceMainItemID) {
			this.removeVariable('PreferenceMainItemID');
			const preferenceRelationshipItems = this.MetadataCache.GetItemsById(
				this.preferenceCategoryGuid
			);
			preferenceRelationshipItems.forEach(function (item) {
				const itemId = item.content.getAttribute('id');
				this.MetadataCache.RemoveItemById(itemId);
			}, this);
		}
	}, this);
};

/*-- lockItem
 *
 *   Method to lock the item
 *   id = the id for the item
 *
 */
Aras.prototype.lockItem = function Aras_lockItem(itemID, itemTypeName) {
	if (itemID) {
		var itemNode = this.getFromCache(itemID);

		if (itemNode) {
			return this.lockItemEx(itemNode);
		} else {
			if (itemTypeName) {
				var ownerWindow = this.uiFindWindowEx(itemID) || window,
					bodyStr =
						"<Item type='" +
						itemTypeName +
						"' id='" +
						itemID +
						"' action='lock' />",
					statusId = this.showStatusMessage(
						'status',
						this.getResource('', 'common.locking_item_type', itemTypeName),
						system_progressbar1_gif
					),
					requestResult = this.soapSend('ApplyItem', bodyStr);

				this.clearStatusMessage(statusId);

				if (requestResult.getFaultCode() != 0) {
					this.AlertError(requestResult, ownerWindow);
					return null;
				}

				itemNode = requestResult.results.selectSingleNode(
					this.XPathResult('/Item')
				);
				if (itemNode) {
					this.updateInCache(itemNode);
					itemNode = this.getFromCache(itemID);

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
							'item_methods.failed_get_item_type',
							itemTypeName
						),
						this.getResource(
							'',
							'item_methods.xpathresult_of_item_returned_null'
						),
						'common.client_side_err',
						ownerWindow
					);
					return null;
				}
			} else {
				return null;
			}
		}
	}

	return false;
};

/*-- unlockItem
 *
 *   Method to unlock the item
 *   id = the id for the item
 *
 */
Aras.prototype.unlockItem = function (itemID, itemTypeName) {
	if (!itemID) {
		return null;
	}

	var itemNd = this.getFromCache(itemID);
	if (itemNd) {
		return this.unlockItemEx(itemNd);
	}
	if (!itemTypeName) {
		return null;
	}
	var win = this.uiFindWindowEx(itemID);
	if (!win) {
		win = window;
	}

	var bodyStr =
		'<Item type="' + itemTypeName + '" id="' + itemID + '" action="unlock" />';
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.unlocking_item'),
		system_progressbar1_gif
	);
	var res = this.soapSend('ApplyItem', bodyStr);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		this.AlertError(res, win);
		return null;
	}

	itemNd = res.results.selectSingleNode(this.XPathResult('/Item'));
	if (!itemNd) {
		return null;
	}

	this.updateInCache(itemNd);
	this.updateFilesInCache(itemNd);

	var params = this.newObject();
	params.itemID = itemNd.getAttribute('id');
	params.itemNd = itemNd;
	params.newLockedValue = this.isLocked(itemNd);
	this.fireEvent('ItemLock', params);

	return itemNd;
};

/*-- loadItems
 *
 *   Method to load an item or items
 *   typeName   = the ItemType name
 *   body       = the query message to get the items
 *   levels     = the levels deep for the returned item configuration
 *   pageSize   = the number of rows to return
 *   page       = the page number
 *   configPath = the RelationshipType names to include inteh item configuration returned
 *   select     = the list of properties to return
 *
 */
Aras.prototype.loadItems = function Aras_loadItems(
	typeName,
	body,
	levels,
	pageSize,
	page,
	configPath,
	select
) {
	if (typeName == undefined || typeName == '') {
		return false;
	}
	if (body == undefined) {
		body = '';
	}
	if (levels == undefined) {
		levels = 0;
	}
	if (pageSize == undefined) {
		pageSize = '';
	}
	if (page == undefined) {
		page = '';
	}
	if (configPath == undefined) {
		configPath = '';
	}
	if (select == undefined) {
		select = '';
	}
	levels = parseInt(levels);

	let attrs = '',
		innerBody = '';
	if (body != '') {
		if (body.charAt(0) != '<') {
			attrs = body;
		} else {
			innerBody = body;
		}
	}

	let soapBody =
		'<Item type="' + typeName + '" levels="' + levels + '" action="get" ';
	if (pageSize != '') {
		soapBody += 'pagesize="' + pageSize + '" ';
	}
	if (page != '') {
		soapBody += 'page="' + page + '" ';
	}
	if (configPath != '') {
		soapBody += 'config_path="' + configPath + '" ';
	}
	if (select != '') {
		soapBody += 'select="' + select + '" ';
	}
	soapBody += attrs + '>' + innerBody + '</Item>';

	let items = [];
	const itemXPathResult = this.XPathResult('/Item');
	const itemTypeNode = this.getItemTypeForClient(typeName).node;
	if (this.isPolymorphic(itemTypeNode)) {
		this.getMorphaeList(itemTypeNode).forEach(({ name }) => {
			const newBody = soapBody.replace(typeName, name);
			const result = this.soapSend('ApplyItem', newBody);
			if (result.getFaultCode() === 0) {
				const itemResult = result.results.selectNodes(itemXPathResult);
				items = items.concat(itemResult);
			}
		});

		items = items.sort((item1, item2) => {
			const firstKeyedName = this.getItemProperty(item1, 'keyed_name');
			const secondKeyedName = this.getItemProperty(item2, 'keyed_name');

			return firstKeyedName.localeCompare(secondKeyedName);
		});
	} else {
		const result = this.soapSend('ApplyItem', soapBody);

		if (result.getFaultCode() != 0) {
			if (this.DEBUG) {
				this.AlertError(
					this.getResource('', 'item_methods.fault_loading'),
					typeName,
					result.getFaultCode()
				);
			}
			return null;
		}

		items = result.results.selectNodes(this.XPathResult('/Item'));
	}

	if (configPath) {
		levels--;
	}

	return items.map((item) => {
		const currentId = item.getAttribute('id');
		item.setAttribute('levels', levels);
		this.itemsCache.updateItem(item, true);
		return this.itemsCache.getItem(currentId);
	});
};

/*-- getItem
 *
 *   Method to load an item
 *   typeName   = the ItemType name
 *   xpath      = the XPath to teh item in the dom cache
 *   body       = the query message to get the items
 *   levels     = the levels deep for the returned item configuration
 *   configPath = the RelationshipType names to include inteh item configuration returned
 *   select     = the list of properties to return
 *
 */
Aras.prototype.getItem = function (
	itemTypeName,
	xpath,
	body,
	levels,
	configPath,
	select
) {
	if (levels == undefined) {
		levels = 1;
	}
	if (typeof itemTypeName != 'string') {
		itemTypeName = '';
	}

	var typeAttr = '';
	if (xpath.indexOf('@id=') < 0) {
		/* POLYITEM: only argument with @type if xpath does not start with @id= */
		typeAttr = '[@type="' + itemTypeName + '"]';
	}

	xpath = '/Innovator/Items/Item' + typeAttr + '[' + xpath + ']';
	var node = this.itemsCache.getItemByXPath(xpath);

	var loadItemFromServer = false;

	// if node was found in cache
	if (node) {
		// if node is dirty then retreive node from cache after test for completeness
		if (this.isDirtyEx(node) || this.isTempEx(node)) {
			// if requested levels > than node levels attribute then load item from server
			if (node.getAttribute('levels') - levels < 0) {
				itemTypeName = node.getAttribute('type');
				loadItemFromServer = true;
			}
		} else {
			// if node not dirty then drop it from cache and load from server original version
			if (!itemTypeName) {
				itemTypeName = node.getAttribute('type');
			}
			loadItemFromServer = true;
		}
	} else {
		// if node not exists in cache then load item from server
		if (itemTypeName != '') {
			loadItemFromServer = true;
		}
	}

	if (loadItemFromServer) {
		const loadedItems = this.loadItems(
			itemTypeName,
			body,
			levels,
			'',
			'',
			configPath,
			select
		);

		// return result from cache when item was not received from server
		node = (loadedItems && loadedItems[0]) || node;
	}

	return node;
};

/*-- getRelatedItem
 *
 *   Method to get related item from relationship
 *   item        = relationship from which related item will be taken
 *
 */
Aras.prototype.getRelatedItem = function (item) {
	try {
		var relatedItem = item.selectSingleNode('related_id/Item');
		return relatedItem;
	} catch (excep) {
		return null;
	}
};

/*-- getItemById
 *
 *   Method to load an item by id
 *   typeName   = the ItemType name
 *   id         = the id for the item
 *   levels     = the levels deep for the returned item configuration
 *   configPath = the RelationshipType names to include inteh item configuration returned
 *   select     = the list of properties to return
 *
 */
Aras.prototype.getItemById = function (
	typeName,
	id,
	levels,
	configPath,
	select
) {
	if (id == '') {
		return null;
	}
	if (levels == undefined) {
		levels = 1;
	}
	if (configPath == undefined) {
		configPath = '';
	}
	if (select == undefined) {
		select = '';
	}

	return this.getItem(
		typeName,
		'@id="' + id + '"',
		'id="' + id + '"',
		levels,
		configPath,
		select
	);
};

/*-- getItemUsingIdAsParameter
 *
 *   The same as getItemById. The only difference is that method load an item by id passing id like parameter,
 *   not like attribute. Created because if request item using id as attribute, server will return full item.
 *   typeName   = the ItemType name
 *   id         = the id for the item
 *   levels     = the levels deep for the returned item configuration
 *   configPath = the RelationshipType names to include inteh item configuration returned
 *   select     = the list of properties to return
 *
 */
Aras.prototype.getItemUsingIdAsParameter = function (
	typeName,
	id,
	levels,
	configPath,
	select
) {
	this.getItemById(typeName, id, levels, configPath, select);
};

Aras.prototype.getItemById$skipServerCache = function Aras_getItemById$skipServerCache(
	typeName,
	id,
	levels,
	select,
	configPath
) {
	/*-- getItemById$skipServerCache
	 *
	 *   IMPORTANT: This is internal system method. Never use it. Will be removed in future !!!
	 *
	 *   Method to load an item by id
	 *   typeName   = the ItemType name
	 *   id         = the id for the item
	 *   levels     = the levels deep for the returned item configuration
	 *   configPath = the RelationshipType names to include inteh item configuration returned
	 *   select     = the list of properties to return
	 *
	 */
	if (!id) {
		return null;
	}
	if (levels === undefined) {
		levels = 1;
	}
	if (select === undefined) {
		select = '';
	}
	if (configPath === undefined) {
		configPath = '';
	}

	return this.getItem(
		typeName,
		'@id="' + id + '"',
		'<id>' + id + '</id>',
		levels,
		configPath,
		select
	);
};

/*-- getItemByName
 *
 *   Method to load an item by name property
 *   typeName   = the ItemType name
 *   name       = the name for the item
 *   levels     = the levels deep for the returned item configuration
 *   configPath = the RelationshipType names to include inteh item configuration returned
 *   select     = the list of properties to return
 *
 */
Aras.prototype.getItemByName = function (
	typeName,
	name,
	levels,
	configPath,
	select
) {
	if (levels == undefined) {
		levels = 1;
	}
	return this.getItem(
		typeName,
		'name="' + name + '"',
		'<name>' + name + '</name>',
		levels,
		configPath,
		select
	);
};

/*-- getItemByKeyedName
 *
 *   Method to load an item by keyed_name property
 *   typeName   = the ItemType name
 *   keyed_name       = the keyed_name for the item
 *   levels     = the levels deep for the returned item configuration
 *   configPath = the RelationshipType names to include inteh item configuration returned
 *   select     = the list of properties to return
 *
 */
Aras.prototype.getItemByKeyedName = function (
	typeName,
	keyed_name,
	levels,
	configPath,
	select
) {
	if (levels == undefined) {
		levels = 0;
	}
	return this.getItem(
		typeName,
		'keyed_name="' + keyed_name + '"',
		'<keyed_name>' + keyed_name + '</keyed_name>',
		levels,
		configPath,
		select
	);
};

/*-- getRelationships
 *
 *   Method to get the Relationships for an item
 *   item     = the item
 *   typeName = the ItemType name for the Relationships
 *
 */
Aras.prototype.getRelationships = function (item, typeName) {
	if (!item) {
		return false;
	}
	return item.selectNodes('Relationships/Item[@type="' + typeName + '"]');
};

/*-- getKeyedName
 *
 *   Method to get key field values for an item
 *   id = the id for the item
 *
 */
Aras.prototype.getKeyedName = function (id, itemTypeName) {
	if (arguments.length < 2) {
		itemTypeName = '';
	}
	if (!id) {
		return '';
	}

	var item = this.itemsCache.getItem(id);
	if (!item) {
		item = this.getItemById(itemTypeName, id, 0);
	}
	if (!item && itemTypeName != '') {
		item = this.getItemFromServer(itemTypeName, id, 'keyed_name').node;
	}
	if (!item) {
		return '';
	}
	var res = this.getItemProperty(item, 'keyed_name');
	if (!res) {
		res = this.getKeyedNameEx(item);
	}
	return res;
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

Aras.prototype.sortProperties = function sortProperties(ndsCollection) {
	if (!ndsCollection) {
		return null;
	}

	var tmpArr = new Array();
	for (var i = 0; i < ndsCollection.length; i++) {
		tmpArr.push(ndsCollection[i].cloneNode(true));
	}

	var self = this;
	function sortPropertiesNodes(propNd1, propNd2) {
		var sorder1 = self.getItemProperty(propNd1, 'sort_order');
		if (sorder1 == '') {
			sorder1 = 1000000;
		}
		sorder1 = parseInt(sorder1);
		if (isNaN(sorder1)) {
			return 1;
		}
		var sorder2 = self.getItemProperty(propNd2, 'sort_order');
		if (sorder2 == '') {
			sorder2 = 1000000;
		}
		sorder2 = parseInt(sorder2);
		if (isNaN(sorder2)) {
			return -1;
		}

		if (sorder1 < sorder2) {
			return -1;
		} else if (sorder1 == sorder2) {
			sorder1 = self.getItemProperty(propNd1, 'name');
			sorder2 = self.getItemProperty(propNd2, 'name');
			if (sorder1 < sorder2) {
				return -1;
			} else if (sorder1 == sorder2) {
				return 0;
			} else {
				return 1;
			}
		} else {
			return 1;
		}
	}

	return tmpArr.sort(sortPropertiesNodes);
};

/*-- getItemAllVersions
 *
 *   Method to load all the versions of an item
 *   typeName = the ItemType name
 *   id       = the id for the item
 *
 */
Aras.prototype.getItemAllVersions = function (typeName, id) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.loading_versions', typeName),
		system_progressbar1_gif
	);
	var res = this.soapSend(
		'ApplyItem',
		'<Item type="' +
			typeName +
			'" id="' +
			id +
			'" action="getItemAllVersions" />'
	);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return null;
	}

	return res.results.selectNodes(this.XPathResult('/Item'));
};

/*-- getItemLastVersion
 *
 *   Method to load the latest version for the item
 *   itemTypeName = the ItemType name
 *   itemId       = the id for the item
 *
 */
Aras.prototype.getItemLastVersion = function (
	typeName,
	itemId,
	preventDefaultErrorMessage
) {
	var res = this.soapSend(
		'ApplyItem',
		'<Item type="' +
			typeName +
			'" id="' +
			itemId +
			'" action="getItemLastVersion" />'
	);
	if (res.getFaultCode() != 0) {
		if (!preventDefaultErrorMessage) {
			this.AlertError(res);
		}
		return null;
	}

	const itemLastVersion = res.results.selectSingleNode(
		this.XPathResult('/Item')
	);
	if (itemLastVersion) {
		this.itemsCache.updateItem(itemLastVersion, true);
	}

	return itemLastVersion;
}; //getItemLastVersion

/*-- getItemWhereUsed
 *
 *   Method to load the where used items for an item
 *   typeName = the ItemType name
 *   id       = the id for the item
 *
 */
Aras.prototype.getItemWhereUsed = function (typeName, id) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.loading_where_used'),
		system_progressbar1_gif
	);
	var res = this.soapSend(
		'ApplyItem',
		'<Item type="' + typeName + '" id="' + id + '" action="getItemWhereUsed" />'
	);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return null;
	}
	return res.results.selectSingleNode(this.XPathResult('/Item'));
};

/*-- getClassWhereUsed
 *
 *   Method to load the where class is referenced
 *   typeId = the ItemType name
 *   classId = the id of class node
 *		scanTypes = for this types dependencies will be tracked
 *		detailed = if true return detailed result, if false return count of dependencies
 *
 */
Aras.prototype.getClassWhereUsed = function (
	typeId,
	classId,
	scanTypes,
	detailed
) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'statusbar.getting_impact_data'),
		'../images/Progress.gif'
	);
	var methodAML =
		'<Item ' +
		" type='" +
		this.getItemTypeName(typeId) +
		"' " +
		" action='GetClassWhereUsed' >" +
		'<request>' +
		'<class>' +
		classId +
		'+</class>' +
		(detailed ? '<verbosity>details</verbosity>' : '') +
		(scanTypes ? '<types>' + scanTypes + '</types>' : '') +
		'</request>' +
		'</Item>';
	var res = this.applyMethod('GetClassWhereUsed', methodAML);
	this.clearStatusMessage(statusId);

	var resDom = XmlDocument();
	resDom.loadXML(res);

	return resDom;
};

/*-- getHistoryItems
 *
 *   Method to load the history items for specified item
 *   typeName = the ItemType name
 *   id       = the id for the item
 *
 */
Aras.prototype.getHistoryItems = function (typeName, id) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.loading_history'),
		system_progressbar1_gif
	);
	var res = this.soapSend(
		'ApplyItem',
		'<Item type="' + typeName + '" id="' + id + '" action="getHistoryItems" />'
	);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		return false;
	}

	var items = res.results.selectNodes(this.XPathResult('/Item'));

	items = res.results.selectNodes(this.XPathResult('/Item[@type="History"]'));
	return items;
};

/*-- getItemNextStates
 *
 *   Method to load the promote values
 *   typeName = the ItemType name
 *   id       = the id for the item
 *
 */
Aras.prototype.getItemNextStates = function (typeName, id) {
	var res = this.soapSend(
		'ApplyItem',
		'<Item type="' +
			typeName +
			'" id="' +
			id +
			'" action="getItemNextStates" />'
	);

	if (res.getFaultCode() != 0) {
		try {
			var win = this.windowsByName[id];
			this.AlertError(res, win);
		} catch (excep) {} //callee server is disappeared or ... error
		return null;
	}

	return res.getResult();
};

/*-- promote
 *
 *   Method to promote an item to the next state
 *   typeName  = the ItemType name
 *   id        = the id for the item
 *   stateName = the next state name
 *
 */
Aras.prototype.promote = function Aras_promote(
	itemTypeName,
	itemID,
	stateName,
	comments
) {
	var promoteParams = {
		typeName: itemTypeName,
		id: itemID,
		stateName: stateName,
		comments: comments
	};

	return this.promoteItem_implementation(promoteParams);
};

Aras.prototype.promoteItem_implementation = function Aras_promoteItem_implementation(
	promoteParams,
	soapController
) {
	var itemTypeName = promoteParams.typeName;
	var itemID = promoteParams.id;
	var stateName = promoteParams.stateName;
	var comments = promoteParams.comments;

	var myItem = this.newIOMItem(itemTypeName, 'promoteItem');
	myItem.setID(itemID);
	myItem.setProperty('state', stateName);

	if (comments) {
		myItem.setProperty('comments', comments);
	}
	//<Item isNew="1" isTemp="1" type="Process Planner" action="promoteItem" id="5D0637227D494B0C84FA8E84221515D0"><state>Baseline</state></Item>

	var msg = itemTypeName + ' to ' + stateName;

	var xml = myItem.dom.xml;

	var async = Boolean(soapController && soapController.callback);

	this.addIdBeingProcessed(itemID, 'promotion of ' + msg);
	var msgId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.promoting', msg),
		system_progressbar1_gif
	);

	var self = this;
	var globalRes = null;
	function afterSoapSend(res) {
		if (msgId) {
			self.clearStatusMessage(msgId);
		}
		self.removeIdBeingProcessed(itemID);

		if (res.getFaultCode() != 0) {
			var win = self.uiFindWindowEx(itemID);
			if (!win) {
				win = window;
			}
			self.AlertError(res, win);
		}

		self.removeFromCache(itemID);
	}

	if (async) {
		var originalCallBack = soapController.callback;
		function afterAsyncSoapSend(soapSendRes) {
			afterSoapSend(soapSendRes);
			originalCallBack(soapSendRes);
		}

		soapController.callback = afterAsyncSoapSend;
	}

	globalRes = this.soapSend(
		'ApplyItem',
		xml,
		undefined,
		undefined,
		soapController
	);
	if (async) {
		return null;
	}

	if (globalRes) {
		afterSoapSend(globalRes);
		msgId = this.showStatusMessage(
			'status',
			this.getResource('', 'item_methods.getting_promote_result'),
			system_progressbar1_gif
		);
		globalRes = this.getItemById(itemTypeName, itemID, 0);
		this.clearStatusMessage(msgId);
		if (!globalRes) {
			globalRes = null;
		}
	}

	return globalRes;
};

Aras.prototype.getItemRelationship = function Aras_getItemRelationship(
	item,
	relTypeName,
	relID,
	useServer
) {
	if (!item || !relTypeName || !relID || useServer == undefined) {
		return null;
	}

	var res = item.selectSingleNode(
		'Relationships/Item[@type="' + relTypeName + '" and @id="' + relID + '"]'
	);
	if (res) {
		return res;
	}
	if (!useServer) {
		return null;
	}

	var itemID = item.getAttribute('id');
	var bodyStr =
		'<source_id >' + itemID + '</source_id>' + '<id >' + relID + '</id>';
	var xpath = "@id='" + relID + "' and source_id='" + itemID + "'";
	res = this.getItem(relTypeName, xpath, bodyStr, 0);

	if (res != null || res != undefined) {
		if (!item.selectSingleNode('Relationships')) {
			item.appendChild(item.ownerDocument.createElement('Relationships'));
		}
		res = res.selectSingleNode(
			'//Item[@type="' + relTypeName + '" and @id="' + relID + '"]'
		);
		if (!res) {
			return null;
		}
		res = item.selectSingleNode('Relationships').appendChild(res);
		return res;
	} else {
		return null;
	}
};

Aras.prototype.getItemRelationships = function (
	itemTypeName,
	itemId,
	relsName,
	pageSize,
	page,
	body,
	forceReplaceByItemFromServer
) {
	if (!(itemTypeName && itemId && relsName)) {
		return null;
	}
	if (pageSize == undefined) {
		pageSize = '';
	}
	if (page == undefined) {
		page = '';
	}
	if (body == undefined) {
		body = '';
	}
	if (forceReplaceByItemFromServer == undefined) {
		forceReplaceByItemFromServer = false;
	}

	var res = null;
	var itemNd = this.getItemById(itemTypeName, itemId, 0);
	if (!itemNd) {
		return null;
	}

	if (
		!forceReplaceByItemFromServer &&
		(pageSize == -1 ||
			this.isTempID(itemId) ||
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
		itemId +
		'" relName="' +
		relsName +
		'" action="getItemRelationships" ';
	if (pageSize) {
		bodyStr += ' pagesize="' + pageSize + '"';
	}
	if (page) {
		bodyStr += ' page="' + page + '"';
	}
	if (body == '') {
		bodyStr += '/>';
	} else {
		bodyStr += '>' + body + '</Item>';
	}

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.loading_relationships', itemTypeName),
		system_progressbar1_gif
	);
	var res = this.soapSend('ApplyItem', bodyStr);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
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
	var ids = new Set();
	for (var i = 0; i < rels.length; i++) {
		var rel = rels[i].cloneNode(true);
		var relId = rel.getAttribute('id');
		ids.add(relId);
		var prevRel = itemRels.selectSingleNode(
			'Item[@type="' + relsName + '" and @id="' + relId + '"]'
		);
		if (prevRel) {
			if (forceReplaceByItemFromServer == true) {
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
	if (ids.size === 0) {
		return null;
	}

	res = ArasModules.xml
		.selectNodes(itemRels, 'Item[@type="' + relsName + '"]')
		.filter(function (relNode) {
			return ids.has(relNode.getAttribute('id'));
		});

	return res;
};

Aras.prototype.resetLifeCycle = function Aras_resetLifeCycle(
	itemTypeName,
	itemID
) {
	if (!itemTypeName || !itemID) {
		return false;
	}

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.reseting_life_cycle_state'),
		system_progressbar1_gif
	);
	var bodyStr =
		'<Item type="' +
		itemTypeName +
		'" id="' +
		itemID +
		'" action="resetLifecycle"/>';
	var res = this.soapSend('ApplyItem', bodyStr);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		var win = this.uiFindWindowEx(itemID);
		if (!win) {
			win = window;
		}
		this.AlertError(res, win);
		return false;
	}

	var itemNd = res.results.selectSingleNode(this.XPathResult('/Item'));
	if (!itemNd) {
		return false;
	}

	return true;
};

Aras.prototype.setDefaultLifeCycle = function setDefaultLifeCycle(
	itemTypeName,
	itemID
) {
	if (!itemTypeName || !itemID) {
		return false;
	}

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.reseting_life_cycle_state'),
		system_progressbar1_gif
	);
	var bodyStr =
		'<Item type="' +
		itemTypeName +
		'" id="' +
		itemID +
		'" action="setDefaultLifecycle"/>';
	var res = this.soapSend('ApplyItem', bodyStr);
	this.clearStatusMessage(statusId);
	if (res.getFaultCode() != 0) {
		var win = this.uiFindWindowEx(itemID);
		if (!win) {
			win = window;
		}
		this.AlertError(res, win);
		return false;
	}
	var faultStr = res.getFaultString();
	if (faultStr != '') {
		return false;
	}
	this.removeFromCache(itemID);
	var itemNd = this.getItemById(itemTypeName, itemID, 0);
	if (!itemNd) {
		return false;
	}

	return true;
};

Aras.prototype.resetItemAccess = function (itemTypeName, itemId) {
	if (itemTypeName == undefined || itemId == undefined) {
		return false;
	}

	var itemNd = null;
	if (itemTypeName == '') {
		itemNd = this.getItemById('', itemId, 0);
		if (!itemNd) {
			return false;
		}
		itemTypeName = itemNd.getAttribute('type');
	}

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.reseting_item_access'),
		system_progressbar1_gif
	);
	var bodyStr =
		'<Item type="' +
		itemTypeName +
		'" id="' +
		itemId +
		'" action="resetItemAccess"/>';
	var res = this.soapSend('ApplyItem', bodyStr);
	this.clearStatusMessage(statusId);

	try {
		var winBN = this.windowsByName[itemId];
		if (res.getFaultCode() != 0) {
			this.AlertError(res, winBN);
			return false;
		}
	} catch (excep) {} //callee server is disappeared or ... error
	var tempRes = this.loadItems(itemTypeName, 'id="' + itemId + '"', 0);
	if (tempRes) {
		return true;
	} else {
		return false;
	}
};

Aras.prototype.resetAllItemsAccess = function (itemTypeName) {
	if (!itemTypeName) {
		return false;
	}
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.reseting_item_access'),
		system_progressbar1_gif
	);
	var bodyStr =
		'<Item type="' + itemTypeName + '" action="resetAllItemsAccess"/>';
	var res = this.soapSend('ApplyItem', bodyStr);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return false;
	}

	return true;
};

Aras.prototype.populateRelationshipsGrid = function Aras_populateRelationshipsGrid(
	bodyStr
) {
	if (!bodyStr) {
		return null;
	}

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.populating_relationships_grid'),
		system_progressbar1_gif
	);
	var res = this.soapSend('PopulateRelationshipsGrid', bodyStr);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
	}

	return res;
};

Aras.prototype.populateRelationshipsTables = function (bodyStr) {
	if (!bodyStr) {
		return null;
	}

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.populating_relationships_tables'),
		system_progressbar1_gif
	);
	var res = this.soapSend('PopulateRelationshipsTables', bodyStr);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return null;
	}

	return res.results.selectSingleNode('//tables');
};

Aras.prototype.getPermissions = function (
	access_type,
	itemID,
	typeID,
	typeName
) {
	if (!(access_type && itemID)) {
		return false;
	}
	if (access_type === 'can_add') {
		const itemType = this.getItemTypeForClient(itemID, 'id').node;
		if (this.getItemProperty(itemType, 'is_dependent') == '1') {
			return false;
		}
		const isRelationshipAndUseSrcAccess =
			this.getItemProperty(itemType, 'is_relationship') == '1' &&
			this.getItemProperty(itemType, 'user_src_access') == '1';
		if (isRelationshipAndUseSrcAccess) {
			return false;
		}
		const currentUserIdentityList = aras.getIdentityList();
		const isSuperUser =
			currentUserIdentityList.indexOf('6B14D33C4A7D41C188CCF2BC15BD01A3') > -1;
		if (isSuperUser) {
			return true;
		}

		const canAddIdentities = itemType.selectNodes(
			'Relationships/Item[@type="Can Add" and (can_add = "1") and (string(class_path) = "" or class_path = "/" or class_path = "*")]/related_id'
		);

		for (let i = 0; i < canAddIdentities.length; i++) {
			const canAddIdentity = canAddIdentities[i];
			if (currentUserIdentityList.indexOf(canAddIdentity.text) > -1) {
				return true;
			}
		}
		return false;
	}

	var bodyStr =
		'<Item id="' +
		itemID +
		'" access_type="' +
		access_type +
		'" action="getPermissions" ';
	if (typeID != undefined && typeID) {
		bodyStr += ' typeId="' + typeID + '"';
	}
	if (typeName != undefined && typeName) {
		bodyStr += ' type="' + typeName + '"';
	}
	bodyStr += '/>';

	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'item_methods.getting_permissions_right'),
		system_progressbar1_gif
	);
	var res = this.soapSend('ApplyItem', bodyStr);
	this.clearStatusMessage(statusId);

	if (res.getFaultCode() != 0) {
		this.AlertError(res);
		return null;
	}

	return res.getResult().text == '1';
};

Aras.prototype.getCanAddPermission = function (itemType) {
	if (!itemType) {
		return false;
	}

	const isDependent = itemType['is_dependent'] === '1';
	const isRelationship = itemType['is_relationship'] === '1';
	const hasUserSrcAccess = itemType['user_src_access'] === '1';
	const isRelationshipAndUseSrcAccess = isRelationship && hasUserSrcAccess;
	if (isDependent || isRelationshipAndUseSrcAccess) {
		return false;
	}

	const userIdentities = aras.getIdentityList();
	const isSuperUser = userIdentities.includes(
		'6B14D33C4A7D41C188CCF2BC15BD01A3'
	);
	if (isSuperUser) {
		return true;
	}

	const canAdd = itemType['Can Add'] || [];
	return canAdd.some((relationship) => {
		const canAdd = relationship['can_add'] === '1';
		const identityId = relationship['related_id@aras.id'];
		return canAdd && userIdentities.includes(identityId);
	});
};

Aras.prototype.getRealPropertyForForeignProperty = function Aras_getRealPropertyForForeignProperty(
	foreignProperty,
	currentItemType
) {
	function getPropertyByCriteria(itemType, criteriaName, criteriaValue) {
		if (null == itemType) {
			return null;
		}

		return itemType.selectSingleNode(
			"Relationships/Item[@type='Property' and " +
				criteriaName +
				"='" +
				criteriaValue +
				"']"
		);
	}

	if ('foreign' !== this.getItemProperty(foreignProperty, 'data_type')) {
		return foreignProperty;
	}

	if (null == currentItemType) {
		currentItemType = this.getItemTypeDictionary(
			this.getItemProperty(foreignProperty, 'source_id'),
			'id'
		).node;
	}

	var sourceProp = getPropertyByCriteria(
		currentItemType,
		'id',
		this.getItemProperty(foreignProperty, 'data_source')
	);
	var foreignItemType = this.getItemTypeDictionary(
		this.getItemProperty(sourceProp, 'data_source'),
		'id'
	).node;

	var result = getPropertyByCriteria(
		foreignItemType,
		'id',
		foreignProperty.selectSingleNode('foreign_property').text
	);
	if ('foreign' == this.getItemProperty(result, 'data_type')) {
		result = this.getRealPropertyForForeignProperty(result, foreignItemType);
	}

	return result;
};

Aras.prototype.getPropertiesOfTypeFile = function Aras_getPropertiesOfTypeFile(
	ItemTypeNd
) {
	/*
	this function is for internal use *** only ***.
	----
	ItemTypeNd - node of ItemType
	*/
	var FileIT_ID_const = this.getFileItemTypeID();
	var fileProps = ItemTypeNd.selectNodes(
		"Relationships/Item[@type='Property' and data_type='item' and data_source='" +
			FileIT_ID_const +
			"' " +
			"and name!='related_id' and name!='config_id']"
	);
	/*
	related_id property is ignored here to not treat related_id as a property of relationship (for checkout/checkin) (IR-006449)
	config_id property is ignored here to fix IR-006448 (to enable subsequent checkins. to do this all file instances must be locked.
	but config_id points to first generation and thus if current generation is 2 or greater checkin is not available)

	ItemType File has 2 properties of type File: id and config_id.
	This allows user to perform checkin/checkout in context of File instances.
	This looks like a logic bug, but there are solutions wich rely on this. (PLM for example)
	*/

	return fileProps;
};

/*-- applyItemWithFilesCheck
 *
 *   Method to ApplyItem. Checking "do files exist in itemNd" is called before soap send. Returns xml node.
 *   itemNd           = xml node to send in ApplyItem soap action. May contain items with type="File".
 *   win             = item window
 *   statusMsg       = message text to show in status bar. If empty then nothing is shown.
 *   XPath2ReturnedNd = xpath to select returned node. Default: aras.XPathResult('/Item')
 *
 */
Aras.prototype.applyItemWithFilesCheck = function Aras_applyItemWithFilesCheck(
	itemNd,
	win,
	statusMsg,
	XPath2ReturnedNd
) {
	if (!XPath2ReturnedNd) {
		XPath2ReturnedNd = this.XPathResult('/Item');
	}

	var res;
	var files = itemNd.selectNodes(
		'descendant-or-self::Item[@type="File" and (@action="add" or @action="update")]'
	);

	var statusId;
	if (statusMsg) {
		statusId = this.showStatusMessage(
			'status',
			statusMsg,
			system_progressbar1_gif
		);
	}
	if (files.length == 0) {
		res = this.soapSend('ApplyItem', itemNd.xml);
	} else {
		res = this.soapSend('generateNewGUID', '');
	}
	if (res.getFaultCode() != 0) {
		this.AlertError(res, win);
		res = null;
	} else {
		if (files.length == 0) {
			res = res.results.selectSingleNode(XPath2ReturnedNd);
		} else {
			res = this.sendFilesWithVaultApplet(itemNd, statusMsg, XPath2ReturnedNd);
		}
	}
	if (statusId) {
		this.clearStatusMessage(statusId);
	}
	return res;
};

Aras.prototype.applyItemWithFilesCheckAsync = function Aras_applyItemWithFilesCheckAsync(
	itemNd,
	win,
	statusMsg,
	XPath2ReturnedNd,
	isGridUpdate
) {
	if (!XPath2ReturnedNd) {
		XPath2ReturnedNd = this.XPathResult('/Item');
	}

	var res;
	var promise;
	var files = itemNd.selectNodes(
		'descendant-or-self::Item[@type="File" and (@action="add" or @action="update")]'
	);

	var statusId;
	if (statusMsg) {
		statusId = this.showStatusMessage(
			'status',
			statusMsg,
			system_progressbar1_gif
		);
	}
	if (files.length == 0) {
		res = this.soapSend('ApplyItem', itemNd.xml, '', isGridUpdate);
	} else {
		res = this.soapSend('generateNewGUID', '');
	}
	if (res.getFaultCode() != 0) {
		this.AlertError(res, win);
		promise = Promise.resolve(null);
	} else {
		if (files.length == 0) {
			promise = Promise.resolve(res.results.selectSingleNode(XPath2ReturnedNd));
		} else {
			promise = this.sendFilesWithVaultAppletAsync(
				itemNd,
				statusMsg,
				XPath2ReturnedNd
			);
		}
	}

	return promise.then(
		function (res) {
			if (statusId) {
				this.clearStatusMessage(statusId);
			}
			return res;
		}.bind(this)
	);
};
