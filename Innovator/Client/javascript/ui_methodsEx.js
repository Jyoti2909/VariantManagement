// (c) Copyright by Aras Corporation, 2004-2013.
Aras.prototype.uiRegWindowEx = function ArasUiRegWindowEx(itemID, win) {
	/*-- uiRegWindowEx
	 *
	 *  registers window as Innovator window.
	 *  All Innovator windows get events notifications.
	 *  All Innovator windows are closed when main window is closed.
	 *
	 */

	if (!itemID || !win) {
		return false;
	}

	var winName = this.mainWindowName + '_' + itemID;
	this.windowsByName[winName] = win;

	return true;
};

Aras.prototype.uiUnregWindowEx = function ArasUiUnregWindowEx(itemID) {
	/*-- uiUnregWindowEx
	 *
	 *  unregisters window as Innovator window (should be called when item window is closed).
	 *  All Innovator windows get events notifications.
	 *  All Innovator windows are closed when main window is closed.
	 *
	 */

	if (!itemID) {
		return false;
	}

	var winName = this.mainWindowName + '_' + itemID;
	this.deletePropertyFromObject(this.windowsByName, winName);

	return true;
};

Aras.prototype.uiFindWindowEx = function ArasUiFindWindowEx(itemID) {
	/*-- uiUnregWindowEx
	 *
	 *  finds registered Innovator window.
	 *
	 */

	if (!itemID) {
		return null;
	}

	var winName = this.mainWindowName + '_' + itemID;
	var res = null;
	try {
		res = this.windowsByName[winName];
		if (res === undefined) {
			res = null;
		}
	} catch (excep) {}

	if (res && this.isWindowClosed(res)) {
		this.uiUnregWindowEx(itemID);
		return null;
	}

	if (
		res &&
		res.itemTypeName === 'mpp_ProcessPlan' &&
		window.itemTypeName === 'mpp_ProcessPlan'
	) {
		const doesItemExist = this.itemsCache.getItemByXPath(
			'//Item[type="mpp_ProcessPlan" and id="' + itemID + '"]'
		);
		if (!doesItemExist) {
			const originalAddEventListener = res.addEventListener;
			res.addEventListener = function (type, listener, options) {
				if (type === 'unload') {
					const wrappedListener = function (event) {
						setTimeout(function () {
							listener(event);
						}, 0);
					};
					originalAddEventListener.call(res, type, wrappedListener, options);
					return;
				}
				originalAddEventListener.call(res, type, listener, options);
			};
			const restorePromise = Promise.resolve().then(function () {
				res.addEventListener = originalAddEventListener;
			});
		}
	}

	return res;
};

Aras.prototype.uiFindWindowEx2 = function (itemNd) {
	var itemID = itemNd.getAttribute('id');
	var win = this.uiFindWindowEx(itemID);
	if (!win) {
		try {
			var parentItemNd = itemNd.selectSingleNode('../../../..');
			if (parentItemNd && parentItemNd.nodeType != 9) {
				var pid = parentItemNd.getAttribute('id');
				win = this.uiFindWindowEx(pid);
			}
		} catch (exc1) {}
	}
	if (!win) {
		win = window;
	}
	return win;
};

Aras.prototype.uiOpenWindowEx = function ArasUiOpenWindowEx(
	itemID,
	params,
	alertErrorWin
) {
	if (!itemID) {
		return null;
	}
	if (params === undefined) {
		params = '';
	}

	var topWindow = this.getMostTopWindowWithAras(window);
	var isMainWindow = topWindow.name === this.mainWindowName;
	var mainArasObject = this.getMainArasObject();
	var isMainArasObject = this === mainArasObject;
	if (!topWindow.opener && !isMainArasObject) {
		return mainArasObject.uiOpenWindowEx(itemID, params);
	}

	if (
		!isMainWindow &&
		topWindow.opener &&
		!this.isWindowClosed(topWindow.opener)
	) {
		var wnd = topWindow.opener.aras.uiOpenWindowEx(
			itemID,
			params,
			this.getCurrentWindow()
		);
		if (!wnd.opener && topWindow.opener) {
			wnd.opener = topWindow.opener;
		}

		return wnd;
	} else {
		var winName = this.mainWindowName + '_' + itemID;
		var win = null;

		if (params.indexOf('isOpenInTearOff=true') > -1) {
			win = topWindow.open('about:blank', winName, params);
		} else {
			var isUnfocused = params.indexOf('isUnfocused=true') > -1;
			win = arasTabs.open('about:blank', winName, isUnfocused);
		}

		if (!win) {
			this.AlertError(
				this.getResource(
					'',
					'ui_methods_ex.innovator_failed_to_open_new_window'
				),
				alertErrorWin,
				''
			);
		}

		if (win) {
			try {
				//substitute opener for the new window
				if (
					topWindow.opener &&
					!this.isWindowClosed(topWindow.opener) &&
					topWindow.opener.name == this.mainWindowName
				) {
					//according to CVS commits this is fix for IR-001690 "Toolbar does not load" (read background).
					//Something to workaround google popup blocker.
					win.opener = topWindow.opener;
				}
			} catch (excep) {
				/* security exception may occur */
			}
		}

		return win;
	}
};

Aras.prototype.uiCloseWindowEx = function (itemID) {
	if (!itemID) {
		return false;
	}

	var win = this.uiFindWindowEx(itemID);
	if (win) {
		win.close();
	}

	return true;
};

/*
 * uiGetFormID4ItemEx - function to get id of form correspondent to the item (itemNd) and mode
 *                  (result depends on current user)
 *
 * parameters:
 * itemNd   - xml node of item to find correspondent form
 * formType - string, representing mode: 'add', 'view', 'edit' or 'print'
 */
Aras.prototype.uiGetFormID4ItemEx = function ArasUiGetFormID4ItemEx(
	itemNd,
	formType
) {
	function findMaxPriorityFormID(itemType, roles, formType) {
		var i;
		var arasObj = self;
		var returnNodes;

		function getFormNodesForRoles(formNodes, roles) {
			const validReturnIds = [];
			for (let m = 0; m < formNodes.length; m++) {
				const viewNode = formNodes[m].parentNode.parentNode;
				if (roles.indexOf(arasObj.getItemProperty(viewNode, 'role')) >= 0) {
					validReturnIds.push(viewNode.getAttribute('id'));
				}
			}
			const strReturnIds = "(@id='" + validReturnIds.join("' or @id='") + "')";
			return itemType.selectNodes(
				"Relationships/Item[@type='View' and " +
					strReturnIds +
					"]/related_id/Item[@type='Form']"
			);
		}

		var tryGetClassificationFormWithoutFormType = function () {
			xp =
				"Relationships/Item[@type='View' and not(type='complete') and not(type='preview')][not(form_classification[@is_null='1'])]/related_id/Item[@type='Form']";
			const nodes = itemType.selectNodes(xp);
			return getFormNodesForRoles(nodes, roles);
		};

		if (typeof roles == 'string') {
			var tmpRoles = roles;
			roles = [];
			roles.push(tmpRoles);
		}

		if (classification) {
			var xp =
				"Relationships/Item[@type='View' and type='" +
				formType +
				"'][not(form_classification[@is_null='1'])]/related_id/Item[@type='Form']";
			var formIds = [];
			var nodes = itemType.selectNodes(xp);
			nodes = getFormNodesForRoles(nodes, roles);
			var tmpNds =
				nodes.length > 0 ? nodes : tryGetClassificationFormWithoutFormType();
			if (tmpNds.length > 0) {
				for (i = 0; i < tmpNds.length; i++) {
					var formClassification = tmpNds[
						i
					].parentNode.parentNode.selectSingleNode('form_classification').text;
					if (arasObj.areClassPathsEqual(formClassification, classification)) {
						formIds.push(tmpNds[i].getAttribute('id'));
					}
				}
			} else {
				returnNodes = null;
			}

			if (formIds.length > 0) {
				var additionalXp = "[@id='" + formIds.join("' or @id='") + "']";
				xp += additionalXp;
				returnNodes = itemType.selectNodes(xp);
			}
		}
		if (!(returnNodes && returnNodes.length !== 0)) {
			returnNodes = itemType.selectNodes(
				"Relationships/Item[@type='View' and string(form_classification)='' and type='" +
					formType +
					"']/related_id/Item[@type='Form']"
			);
			returnNodes = getFormNodesForRoles(returnNodes, roles);
		}

		var formNds = returnNodes;
		if (formNds.length === 0) {
			return '';
		}

		var currForm = formNds[0];
		var currPriority = arasObj.getItemProperty(
			formNds[0].selectSingleNode('../..'),
			'display_priority'
		);
		if (currPriority === '') {
			currPriority = Number.POSITIVE_INFINITY;
		}

		for (i = 1; i < formNds.length; i++) {
			var priority = arasObj.getItemProperty(
				formNds[i].selectSingleNode('../..'),
				'display_priority'
			);
			if (priority === '') {
				priority = Number.POSITIVE_INFINITY;
			}

			if (currPriority > priority) {
				currPriority = priority;
				currForm = formNds[i];
			}
		}

		return currForm.getAttribute('id');
	}

	function findMaxPriorityFormIDForItemType(anItemType, formType) {
		var array = [identityId, userIdentities, worldIdentityId];
		for (var i = 0; i < array.length; i++) {
			var identity = array[i];
			var res = findMaxPriorityFormID(anItemType, identity, formType);
			if (res) {
				return res;
			}

			if (formType !== 'default' && formType !== 'complete') {
				res = findMaxPriorityFormID(anItemType, identity, 'default');
				if (res) {
					return res;
				}
			}
		}

		return undefined;
	}

	if (!itemNd) {
		return '';
	}
	if (
		!formType ||
		formType.search(
			/^default$|^add$|^view$|^edit$|^print|^preview$|^search|^complete$/
		) == -1
	) {
		return '';
	}

	var worldIdentityId = 'A73B655731924CD0B027E4F4D5FCC0A9';
	var userIdentities = this.getIdentityList().split(',');
	if (userIdentities.length === 0) {
		return '';
	} else {
		var index = userIdentities.indexOf(worldIdentityId);
		if (index > -1) {
			userIdentities.splice(index, 1);
		}
	}

	const identityId = this.getIsAliasIdentityIDForLoggedUser();

	if (!identityId) {
		return '';
	}

	var itemTypeName = itemNd.getAttribute('type');
	var itemTypeNd = this.getItemTypeNodeForClient(itemTypeName, 'name');
	var classification;
	var classificationNode = itemNd.selectSingleNode('classification');
	if (classificationNode) {
		classification = classificationNode.text;
	}

	var self = this;

	var formID = findMaxPriorityFormIDForItemType(itemTypeNd, formType);
	if (
		!formID &&
		this.getItemProperty(itemTypeNd, 'implementation_type') == 'polymorphic'
	) {
		var itemtypeId = this.getItemProperty(itemNd, 'itemtype');
		if (itemtypeId) {
			itemTypeNd = this.getItemTypeNodeForClient(itemtypeId, 'id');
			if (itemTypeNd) {
				formID = findMaxPriorityFormIDForItemType(itemTypeNd, formType);
			}
		}
	}

	return formID;
};

/*
 * uiGetRelationshipView4ItemTypeEx - function to get Relationship View of ItemType
 *                  (result depends on current user)
 *
 * parameters:
 * itemType   - xml node of ItemType
 */
Aras.prototype.uiGetRelationshipView4ItemTypeEx = function ArasUiGetRelationshipView4ItemTypeEx(
	itemType
) {
	if (!itemType) {
		return null;
	}

	var userIdentities = this.getIdentityList().split(',');
	if (userIdentities.length === 0) {
		return null;
	}

	const identityId = this.getIsAliasIdentityIDForLoggedUser();

	if (!identityId) {
		return null;
	}

	var res = itemType.selectSingleNode(
		"Relationships/Item[@type='Relationship View' and (related_id/Item/@id='" +
			identityId +
			"' or related_id='" +
			identityId +
			"')]"
	);
	if (!res) {
		for (var i = 0; i < userIdentities.length; i++) {
			res = itemType.selectSingleNode(
				"Relationships/Item[@type='Relationship View' and (related_id/Item/@id='" +
					userIdentities[i] +
					"' or related_id='" +
					userIdentities[i] +
					"')]"
			);
			if (res) {
				break;
			}
		}
	}

	return res;
};

/*
 * uiGetTOCView4ItemTypeEx - function to get TOC View of ItemType
 *                  (result depends on current user)
 *
 * parameters:
 * itemType   - xml node of ItemType
 */
Aras.prototype.uiGetTOCView4ItemTypeEx = function ArasUiGetTOCView4ItemTypeEx(
	itemType
) {
	if (!itemType) {
		return null;
	}

	var userIdentities = this.getIdentityList().split(',');
	if (userIdentities.length === 0) {
		return null;
	}
	const identityId = this.getIsAliasIdentityIDForLoggedUser();

	if (!identityId) {
		return null;
	}

	var res = itemType.selectSingleNode(
		"Relationships/Item[@type='TOC View' and (related_id/Item/@id='" +
			identityId +
			"' or related_id='" +
			identityId +
			"')]"
	);
	if (!res) {
		for (var i = 0; i < userIdentities.length; i++) {
			res = itemType.selectSingleNode(
				"Relationships/Item[@type='TOC View' and (related_id/Item/@id='" +
					userIdentities[i] +
					"' or related_id='" +
					userIdentities[i] +
					"')]"
			);
			if (res) {
				break;
			}
		}
	}

	return res;
};

/*
 * uiGetForm4ItemEx - function to get form xml node correspondent to the item (itemNd) and mode
 *                  (result depends on current user)
 *
 * parameters:
 * itemNd   - xml node of item to find correspondent form
 * formType - string, representing mode: 'add', 'view', 'edit' or 'print'
 */
Aras.prototype.uiGetForm4ItemEx = function (itemNd, formType) {
	if (!itemNd) {
		return null;
	}
	if (
		!formType ||
		formType.search(
			/^default$|^add$|^view$|^edit$|^preview$|^print$|^search|^complete$/
		) == -1
	) {
		return null;
	}
	var formID = this.uiGetFormID4ItemEx(itemNd, formType);
	var formNd = formID ? this.getFormForDisplay(formID).node : null;
	return formNd;
};

/*
 * uiShowItemEx
 *
 * parameters:
 * 1) itemNd          - item to be shown
 * 2) viewMode        - 'tab view' or 'openFile'
 * 3) isOpenInTearOff - true or false
 */
Aras.prototype.uiShowItemEx = function ArasUiShowItemEx(
	itemNd,
	viewMode,
	isOpenInTearOff,
	isUnfocused
) {
	function onShowItem(inDom, inArgs) {
		var itemTypeName = inDom.getAttribute('type');
		var itemType = this.getItemTypeNodeForClient(itemTypeName);
		var onShowItemEv = itemType.selectNodes(
			"Relationships/Item[@type='Client Event' and client_event='OnShowItem']/related_id/Item"
		);

		try {
			if (onShowItemEv.length) {
				return this.evalMethod(
					this.getItemProperty(onShowItemEv[0], 'name'),
					inDom,
					inArgs
				);
			} else {
				return this.evalMethod('OnShowItemDefault', inDom, inArgs);
			}
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
			return false;
		}
	}

	if (!itemNd) {
		return false;
	}
	if (itemNd.getAttribute('discover_only') === '1') {
		this.AlertError(
			this.getResource('', 'ui_methods_ex.discover_only_item_cannot_be_opened'),
			'',
			''
		);
		return false;
	}
	const itemTypeName = itemNd.getAttribute('type');
	viewMode = viewMode || 'tab view';
	let asyncResult = onShowItem.call(this, itemNd, {
		viewMode: viewMode,
		isOpenInTearOff: isOpenInTearOff,
		isUnfocused: isUnfocused
	});

	if (!asyncResult) {
		asyncResult = Promise.resolve();
	}

	return asyncResult;
};

Aras.prototype.uiOpenEmptyWindowEx = function ArasUiOpenEmptyWindowEx(itemNd) {
	var itemID = itemNd.getAttribute('id');
	var win = this.uiFindAndSetFocusWindowEx(itemID);
	if (win !== null) {
		return true;
	}

	win = this.uiOpenWindowEx(itemID, 'scrollbars=no,resizable=yes,status=yes');
	if (!win) {
		return false;
	}
	this.uiRegWindowEx(itemID, win);
	return true;
};

Aras.prototype.uiFindAndSetFocusWindowEx = function ArasUiFindAndSetFocusWindowEx(
	itemID
) {
	var win = this.uiFindWindowEx(itemID);
	if (win) {
		if (win.opener === undefined) {
			this.uiUnregWindowEx(itemID);
			win = null;
		} else {
			this.browserHelper.setFocus(win);
		}
	} else {
		win = null;
	}

	return win;
};

/**
 * @param {string} oldItemID - old id of item to be shown
 * @param {object} itemNd - item to be shown //usually itemId==oldItemId
 * @param {string} [viewMode=tab view] - "tab view" or "openFile"
 */
Aras.prototype.uiReShowItemEx = function ArasUiReShowItemEx(
	oldItemID,
	itemNd,
	viewMode
) {
	if (!oldItemID) {
		return false;
	}
	if (!itemNd) {
		return false;
	}
	viewMode = viewMode || 'tab view';
	var win = this.uiFindWindowEx(oldItemID);
	if (!win || this.isWindowClosed(win)) {
		return this.uiShowItemEx(itemNd, viewMode);
	}

	var itemWin;
	if (win.getItem) {
		itemWin = win.getItem();
	} else {
		itemWin = win.item;
	}
	var itemID = itemNd.getAttribute('id');
	var itemTypeName = itemNd.getAttribute('type');
	if (itemTypeName == 'File' && viewMode == 'openFile') {
		return this.uiShowItemEx(itemNd, viewMode);
	}
	var isReloadFrm = false;
	var oldFormId = this.uiGetFormID4ItemEx(
		itemWin,
		win.isEditMode ? 'edit' : 'view'
	);
	var newFormId = this.uiGetFormID4ItemEx(
		itemNd,
		win.isEditMode ? 'edit' : 'view'
	);
	if (!newFormId) {
		var doc =
			win.frames.instance.document || win.frames.instance.contentDocument;
		doc.open();
		doc.write(
			'<html><body><center>' +
				this.getResource(
					'',
					'ui_methods_ex.form_not_specified_for_you',
					win.isEditMode ? 'edit' : 'view'
				) +
				'</center></body></html>'
		);
		doc.close();
		this.RefillWindow(itemNd, win, isReloadFrm);
		return;
	}
	if (oldItemID != itemID) {
		this.uiUnregWindowEx(oldItemID);
		this.uiRegWindowEx(itemID, win);

		isReloadFrm = true;
		if (newFormId != oldFormId) {
			if (win.name != 'work') {
				win.close();
				isReloadFrm = false;
			}
		}
	}

	this.RefillWindow(itemNd, win, isReloadFrm);

	if (win.updateMenu) {
		win.updateMenu();
	}
};

Aras.prototype.RefillWindow = function ArasRefillWindow(
	itemNd,
	win,
	isReloadFrm
) {
	var itemWin;
	if (win.getItem) {
		itemWin = win.getItem();
	} else {
		itemWin = win.item;
	}

	if (
		itemWin &&
		'update' == itemWin.getAttribute('action') &&
		itemWin.getAttribute('id') != itemNd.getAttribute('id')
	) {
		isReloadFrm = true;
	}

	var itemID = itemNd.getAttribute('id');
	var typeID = itemNd.getAttribute('typeId');
	var itemTypeName = this.getItemTypeName(typeID);
	var winName = this.mainWindowName + '_' + itemID;
	win.name = winName;
	if (win.setItem) {
		win.setItem(itemNd);
	} else {
		win.item = itemNd;
		win.itemID = itemID;
	}
	var itemTypeNd = this.getItemTypeNodeForClient(itemTypeName);
	win.itemType = itemTypeNd;
	var newIsEditMode =
		this.isTempEx(itemNd) || (this.isLockedByUser(itemNd) && win.isEditMode);
	win.isTearOff = true;
	win.itemTypeName = itemTypeName;
	if (win.updateRootItem) {
		if (!win.isEditModeUnchangeable) {
			win.isEditMode = newIsEditMode;
		}
		var queryString;
		if (isReloadFrm && win.relationships) {
			var openTab = win.relationships.relTabbar.GetSelectedTab();
			queryString = {
				db: this.getDatabase(),
				ITName: itemTypeName,
				relTypeID: openTab,
				itemID: itemID,
				editMode: win.isEditMode ? 1 : 0,
				tabbar: '1',
				toolbar: '1',
				where: 'tabview'
			};
		}
		win.updateRootItem(itemNd, queryString);
	} else {
		this.AlertError(
			this.getResource(
				'',
				'ui_methods_ex.function_update_root_item_not_implemented'
			),
			'',
			'',
			win
		);
	}
	if (
		win.document.getElementById('edit') &&
		win.document.getElementById('form_frame')
	) {
		this.uiShowItemInFrameEx(
			win.getElementById('form_frame'),
			win.item,
			win.isEditMode ? 'edit' : 'view'
		);
	}
};

Aras.prototype.uiPopulatePropertiesOnWindow = function ArasUiPopulatePropertiesOnWindow(
	hostWindow,
	itemNd,
	itemTypeNd,
	formNd,
	isEditMode,
	mode,
	userChangeHandler
) {
	var itemID;
	var itemTypeName;

	var itemTypeID;
	var iomItem;
	var formID = formNd.getAttribute('id');

	var winParams = {};

	winParams.aras = this;
	winParams.viewMode = mode;
	winParams.isEditMode = isEditMode;

	winParams.formID = formID;
	winParams.formNd = formNd;

	//uiShowItemInFrameEx method where current method is called calculate itemTypeNd from itemNd, it is not possible to have itemNd wihtout itemTypeNd calculated
	if (itemNd && itemTypeNd) {
		itemID = itemNd.getAttribute('id');

		iomItem = this.newIOMItem();
		iomItem.dom = itemNd.ownerDocument;
		iomItem.node = itemNd;

		winParams.item = itemNd;
		winParams.itemNd = itemNd;

		winParams.thisItem = iomItem;

		//In case of SearchMode form (for example search by criteria @{0}) itemNd exist, but it is query AML which doesn't have id at all, make sure that isTemp in that case
		//set to true
		winParams.itemID = itemID;
		winParams.isTemp = this.isTempEx(itemNd);
	}

	//method uiDrawFormEx is not require to have itemNd populated, for example on Form editor. But itemTypeNd in this case should be populated (it will be used to populate list on forms fields)
	if (itemTypeNd) {
		itemTypeID = itemTypeNd.getAttribute('id');
		itemTypeName = this.getItemProperty(itemTypeNd, 'name');

		winParams.itemTypeID = itemTypeID;
		winParams.itemType = itemTypeNd;
		winParams.itemTypeNd = itemTypeNd;
		winParams.itemTypeName = itemTypeName;
	}

	if (userChangeHandler) {
		winParams.userChangeHandler = userChangeHandler;
	}

	//it is assuming that there is no racing conditions for two or more forms opened in the same time. First form will be loaded, then second form will erase windowArgumentsExchange and setup it again.
	//In case of error it will be required to fix more than just creating something like hostWindow._<%form_id%>_params,
	//because it can be situation when two items with the same form is opened simulteneously from the same origin window.
	//It will be required to pass some guid to the window, but it is not allowed to add it to query string, due to cache issues.
	//It will be requried to use window.name property which is set up as <iframe name> or window.open('url', name)
	hostWindow.eval(
		'window.windowArgumentsExchange = window.windowArgumentsExchange || {};'
	);
	hostWindow.windowArgumentsExchange['_' + formID + '_params'] = winParams;
};

/*
 * uiShowItemInFrameEx
 * frame
 * itemNd
 * formType - 'add', 'view', 'edit', 'default', 'edit_form' (also this parameter defines mode to open item)
 * formNd4Display - if specified then this form is used to display the item
 */
Aras.prototype.uiShowItemInFrameEx = function (
	frame,
	itemNd,
	formType,
	nestedLevel,
	formNd4Display,
	itemTypeNd4Form,
	userChangeHandler,
	listItems
) {
	if (!frame) {
		return false;
	}
	if (!itemNd && !formNd4Display) {
		return false;
	}
	if (formType === undefined) {
		formType = 'view';
	}
	if (nestedLevel === undefined) {
		nestedLevel = 0;
	}

	var itemTypeName;
	var itemTypeNd;
	var itemTypeLabel;

	if (itemTypeNd4Form) {
		itemTypeNd = itemTypeNd4Form;
		itemTypeName = this.getItemProperty(itemTypeNd4Form, 'name');
	} else if (itemNd) {
		itemTypeName = itemNd.getAttribute('type');
		itemTypeNd = this.getItemTypeNodeForClient(itemTypeName);
	}

	if (itemTypeNd) {
		itemTypeLabel = this.getItemProperty(itemTypeNd, 'label');
		if (!itemTypeLabel) {
			itemTypeLabel = itemTypeName;
		}
	}

	var isEditMode =
		formType == 'edit' ||
		formType == 'search' ||
		formType == 'add' ||
		formType == 'edit_form';

	//in IE document.frameid returns a window which is passed into method, it has all required proeprties, such as .parent
	//in FF document.frameid returns a dom element, which doesn't have .parent property it is contained on frame.contentWindow
	//current method is called with two possible cases when dom element is passed or when window object is passed
	if (frame.contentWindow) {
		frame = frame.contentWindow;
	}

	frame.parent.nestedLevel = nestedLevel;

	var formNd = formNd4Display
		? formNd4Display
		: this.uiGetForm4ItemEx(
				itemNd,
				formType != 'edit_form' ? formType : 'edit'
		  );
	if (!formNd) {
		frame.document.open();
		frame.document.write(
			'<html><body><center>' +
				this.getResource(
					'',
					'ui_methods_ex.form_not_specified_for_you',
					formType
				) +
				'</center></body></html>'
		);
		frame.document.close();
		try {
			if (frame.parent.updateMenuState) {
				frame.parent.updateMenuState();
			}
		} catch (excep) {}
		return false;
	}

	if (nestedLevel <= this.maxNestedLevel) {
		this.uiPopulatePropertiesOnWindow(
			frame.parent,
			itemNd,
			itemTypeNd,
			formNd,
			isEditMode,
			formType,
			userChangeHandler
		);
		var request = this.uiDrawFormEx(formNd, formType, itemTypeNd, listItems);
		frame.location = request;

		if (itemNd) {
			var formName = this.getItemProperty(formNd, 'name');
			this.saveUICommandHistoryIfNeed(itemTypeNd, itemNd, 'view', formName);
		}
	} else {
		frame.document.open();
		frame.document.write(
			this.getResource(
				'',
				'ui_methods_ex.itemtype_label_item_is_here',
				itemTypeLabel,
				this.getKeyedNameEx(itemNd)
			)
		);
		frame.document.close();
	}
};

Aras.prototype._getBaseDrawingModel = function ArasGetBaseDrawingModel(
	formID,
	mode,
	itemTypeNd,
	isFormTemp,
	isFormLockedByUser,
	formLastModifiedDate,
	itemTypeLastModifiedDate,
	listItems
) {
	var itemTypeId = '';
	itemTypeLastModifiedDate = itemTypeLastModifiedDate || '';

	if (itemTypeNd) {
		itemTypeNd = itemTypeNd.cloneNode(true);
	}

	var languageCode = this.getSessionContextLanguageCode();
	formLastModifiedDate =
		formLastModifiedDate ||
		this.MetadataCache.ExtractDateFromCache(formID, 'id', 'Form');
	var database = this.getDatabase();

	if (itemTypeNd) {
		itemTypeId = itemTypeNd.getAttribute('id');
		itemTypeLastModifiedDate =
			itemTypeLastModifiedDate ||
			this.MetadataCache.ExtractDateFromCache(itemTypeId, 'id', 'ItemType');
	}

	// List info XML generating
	var getListIds = function (isFilter) {
		var listIdNds = !itemTypeNd
			? []
			: itemTypeNd.selectNodes(
					"Relationships/Item[@type='Property' and contains(string(data_type), '" +
						(isFilter ? 'filter' : 'list') +
						"')]/data_source"
			  );
		var listIds = [];
		for (var i = 0; i < listIdNds.length; i++) {
			if (listIdNds[i].text) {
				listIds.push(listIdNds[i].text);
			}
		}

		var foreignPropertys = !itemTypeNd
			? []
			: itemTypeNd.selectNodes(
					"Relationships/Item[@type='Property' and data_type='foreign']"
			  );
		for (i = 0; i < foreignPropertys.length; i++) {
			var foreinItemType = aras.getItemTypeNodeForClient(
				foreignPropertys[i].parentNode.selectSingleNode(
					"Item[@type='Property' and data_type = 'item' and " +
						"id = '" +
						foreignPropertys[i].selectSingleNode('data_source').text +
						"']/data_source"
				).text,
				'id'
			);
			var dataSourceProp = foreinItemType.selectSingleNode(
				"Relationships/Item[@type='Property' and " +
					"contains(string(data_type), '" +
					(isFilter ? 'filter' : 'list') +
					"') and " +
					"id = '" +
					foreignPropertys[i].selectSingleNode('foreign_property').text +
					"']/data_source"
			);
			if (dataSourceProp && dataSourceProp.text) {
				listIds.push(dataSourceProp.text);
			}
		}
		return listIds;
	};
	var listInfoXml;
	if (listItems) {
		listInfoXml = '<Item><Relationships>';
		for (var itemindex = 0; itemindex < listItems.getItemCount(); itemindex++) {
			listInfoXml += listItems.GetItemByIndex(itemindex).node.xml;
		}
		listInfoXml += '</Relationships></Item>';
	} else {
		var listInfo = this.MetadataCache.GetList(getListIds(false), []);
		listInfoXml =
			'<Item>' +
			listInfo.resultsXML.replace(/<(.?)Result(.?)>/g, '<$1Relationships$2>') +
			'</Item>';
	}

	var filterListInfo = this.MetadataCache.GetList([], getListIds(true));

	// Foreign items info XML generating
	var foreignInfo = {};
	var properties = !itemTypeNd
		? []
		: itemTypeNd.selectNodes(
				"Relationships/Item[@type='Property' and data_type='foreign']"
		  );
	for (var i = 0; i < properties.length; i++) {
		foreignInfo[
			properties[i].getAttribute('id')
		] = this.uiMergeForeignPropertyWithSource(properties[i]).xml;
	}

	//Remove xPropertiesInfo
	const allowedProperties = !itemTypeNd
		? []
		: ArasModules.xml.selectNodes(
				itemTypeNd,
				"Relationships/Item[@type='xItemTypeAllowedProperty']"
		  );
	allowedProperties.forEach(function (xProperty) {
		xProperty.parentNode.removeChild(xProperty);
	});

	// TODO: Create server method for resource using
	var resourceInfo = {};
	resourceInfo['ui_methods_ex.clear_file_property'] = this.getResource(
		'',
		'ui_methods_ex.clear_file_property'
	);
	resourceInfo['ui_methods_ex.scan_in_file'] = this.getResource(
		'',
		'ui_methods_ex.scan_in_file'
	);
	resourceInfo['ui_methods_ex.add_file'] = this.getResource(
		'',
		'ui_methods_ex.add_file'
	);
	resourceInfo['ui_methods_ex.check_out_file'] = this.getResource(
		'',
		'ui_methods_ex.check_out_file'
	);
	resourceInfo['ui_methods_ex.check_in_file'] = this.getResource(
		'',
		'ui_methods_ex.check_in_file'
	);
	resourceInfo['ui_methods_ex.select_an_image'] = this.getResource(
		'',
		'ui_methods_ex.select_an_image'
	);
	resourceInfo[
		'ui_methods_ex.hide_relationships_print_view'
	] = this.getResource('', 'ui_methods_ex.hide_relationships_print_view');
	resourceInfo['common.restricted_property_warning'] = this.getResource(
		'',
		'common.restricted_property_warning'
	);
	resourceInfo['file_management.select_and_upload_file'] = this.getResource(
		'',
		'file_management.select_and_upload_file'
	);
	resourceInfo['file_management.manage_file_property'] = this.getResource(
		'',
		'file_management.manage_file_property'
	);
	resourceInfo['xClassesControl.default_label'] = this.getResource(
		'../Modules/aras.innovator.ExtendedClassification/',
		'xClassesControl.default_label'
	);

	// send resources for xClassesFromControl to use localization for control in form editor
	if (mode === 'edit_form' || mode === 'view_form') {
		resourceInfo[
			'xClassesControl.edit_form.xClass_Sample_1'
		] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xClass_Sample_1'
		);
		resourceInfo[
			'xClassesControl.edit_form.xClass_Sample_2'
		] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xClass_Sample_2'
		);
		resourceInfo['xClassesControl.edit_form.xProperty_A'] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xProperty_A'
		);
		resourceInfo['xClassesControl.edit_form.xProperty_B'] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xProperty_B'
		);
		resourceInfo['xClassesControl.edit_form.xProperty_C'] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xProperty_C'
		);
		resourceInfo['xClassesControl.edit_form.xProperty_X'] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xProperty_X'
		);
		resourceInfo['xClassesControl.edit_form.xProperty_Y'] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xProperty_Y'
		);
		resourceInfo[
			'xClassesControl.edit_form.xProperty_Y.value'
		] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xProperty_Y.value'
		);
		resourceInfo['xClassesControl.edit_form.xProperty_Z'] = this.getResource(
			'../Modules/aras.innovator.ExtendedClassification/',
			'xClassesControl.edit_form.xProperty_Z'
		);
	}

	// Custom JS info XML generating
	var browserCode = '';
	if (this.Browser.isIe()) {
		browserCode = 'ie';
	} else if (this.Browser.isEdge()) {
		browserCode = 'ed';
	} else if (this.Browser.isCh()) {
		browserCode = 'ch';
	} else {
		browserCode = 'ff';
	}

	var jsInfo =
		'<js_info>' +
		'<databasehash>' +
		this.calcMD5(database) +
		'</databasehash>' +
		'<scripts_url>' +
		this.getScriptsURL() +
		'</scripts_url>' +
		'<formId>' +
		formID +
		'</formId>' +
		'<itemTypeId>' +
		itemTypeId +
		'</itemTypeId>' +
		'<itemTypeLastModifiedDate>' +
		itemTypeLastModifiedDate +
		'</itemTypeLastModifiedDate>' +
		'<languageCode>' +
		languageCode +
		'</languageCode>' +
		'<formLastModifiedDate>' +
		formLastModifiedDate +
		'</formLastModifiedDate>' +
		'<mode>' +
		mode +
		'</mode>' +
		'<isTemp>' +
		isFormTemp +
		'</isTemp>' +
		'<isLockedByUser>' +
		isFormLockedByUser +
		'</isLockedByUser>' +
		'<browserCode>' +
		browserCode +
		'</browserCode>' +
		'</js_info>';

	var langInfo = this.getLanguagesResultNd().xml;

	var baseModel = {
		JSInfo: jsInfo,
		ItemTypeInfo: itemTypeNd ? itemTypeNd.xml : '',
		AllLanguages:
			'<Item>' +
			langInfo.replace(/<(.?)Result(.?)>/g, '<$1Relationships$2>') +
			'</Item>',
		ForeignInfo: JSON.stringify(foreignInfo),
		ListInfo: listInfoXml,
		FilterListInfo:
			'<Item>' +
			filterListInfo.resultsXML.replace(
				/<(.?)Result(.?)>/g,
				'<$1Relationships$2>'
			) +
			'</Item>',
		ResourceInfo: JSON.stringify(resourceInfo)
	};

	return baseModel;
};

/*
 * uiDrawFormEx
 * doc
 * formNd
 * mode - (add, edit, view, print, view_form, edit_form, search)
 */
Aras.prototype.uiDrawFormEx = function ArasUiDrawFormEx(
	formNd,
	mode,
	itemTypeNd,
	listItems
) {
	if (!formNd || !mode) {
		return;
	}
	if (!itemTypeNd) {
		itemTypeNd = null;
	}

	var formID = formNd.getAttribute('id');
	var itemTypeId = '';
	var itemTypeLastModifiedDate = '';

	var languageCode = this.getSessionContextLanguageCode();
	var formLastModifiedDate =
		this.getItemProperty(formNd, 'modified_on') ||
		this.MetadataCache.ExtractDateFromCache(formID, 'id', 'Form');
	var database = this.getDatabase();

	if (itemTypeNd) {
		itemTypeId = itemTypeNd.getAttribute('id');
		itemTypeLastModifiedDate =
			this.getItemProperty(itemTypeNd, 'modified_on') ||
			this.MetadataCache.ExtractDateFromCache(itemTypeId, 'id', 'ItemType');
	}

	var request = this.getScriptsURL('virtualGetForm?');
	request +=
		'formId=' +
		formID +
		'&formLastModifiedDate=' +
		formLastModifiedDate +
		'&languageCode=' +
		languageCode;
	request +=
		'&itemTypeId=' +
		itemTypeId +
		'&itemTypeLastModifiedDate=' +
		itemTypeLastModifiedDate;
	request += '&databasehash=' + this.calcMD5(database) + '&mode=' + mode;

	var xmlHttp = this.XmlHttpRequestManager.CreateRequest();
	xmlHttp.open('GET', request, false);
	xmlHttp.send(null);

	// Check if form is cached in browser
	if (xmlHttp.status == 200) {
		// nothing special, browser will load the page by returned url
	} else if (xmlHttp.status == 404) {
		// If form isn't cached - we send it to server in POST
		xmlHttp = this.XmlHttpRequestManager.CreateRequest();
		xmlHttp.open(
			'POST',
			this.getBaseURL() + '/Modules/aras.innovator.core.Form/PostForm',
			false
		);
		xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

		var formModel = this._getBaseDrawingModel(
			formID,
			mode,
			itemTypeNd,
			this.isTempEx(formNd),
			this.isLockedByUser(formNd),
			formLastModifiedDate,
			itemTypeLastModifiedDate,
			listItems
		);
		formModel.FormInfo = formNd.xml;
		formModel = JSON.stringify(formModel);
		xmlHttp.send(formModel);
	}

	return request;
};

/*
Returns string: field type 4 specified Property
*/
Aras.prototype.uiGetFieldType4Property = function ArasUiGetFieldType4Property(
	propertyNd
) {
	var fieldtype = 'text';

	if (!propertyNd) {
		return fieldtype;
	}

	var datatype = this.getItemProperty(propertyNd, 'data_type');
	var propertyName = this.getItemProperty(propertyNd, 'name');

	if (
		datatype == 'string' ||
		datatype == 'integer' ||
		datatype == 'float' ||
		datatype == 'decimal' ||
		datatype == 'sequence'
	) {
		fieldtype = 'text';

		var storedLength = this.getItemProperty(propertyNd, 'stored_length');
		storedLength = parseInt(storedLength);

		if (!isNaN(storedLength) && storedLength > 64) {
			fieldtype = 'textarea';
		}
	} else if (datatype == 'item') {
		if (
			this.getItemProperty(propertyNd, 'data_source') ==
			this.getItemTypeId('File')
		) {
			fieldtype = 'file item';
		} else {
			fieldtype = 'item';
		}
	} else if (datatype == 'ml_string') {
		fieldtype = 'ml_string';
	} else if (datatype == 'mv_list') {
		fieldtype = 'listbox multi select';
	} else if (
		datatype == 'list' ||
		datatype == 'filter list' ||
		datatype == 'color list'
	) {
		fieldtype = 'dropdown';
	} else if (datatype == 'formatted text') {
		fieldtype = 'formatted text';
	} else if (datatype == 'boolean') {
		fieldtype = 'checkbox';
	} else if (datatype == 'date') {
		fieldtype = 'date';
	} else if (datatype == 'md5') {
		fieldtype = 'password';
	} else if (datatype == 'text') {
		fieldtype = 'textarea';
	} else if (datatype == 'HTML') {
		fieldtype = 'html';
	} else if (datatype == 'color') {
		fieldtype = 'color';
	} else if (datatype == 'image') {
		fieldtype = 'image';
	} else if (datatype == 'federated') {
		fieldtype = 'text';
	} else if (datatype == 'foreign') {
		var sourceProperty = this.getRealPropertyForForeignProperty(propertyNd);
		fieldtype = this.uiGetFieldType4Property(sourceProperty);
	} else {
		fieldtype = 'text';
	}

	if (datatype == 'string' && propertyName == 'classification') {
		fieldtype = 'class structure';
	}

	return fieldtype;
};

Aras.prototype.uiMergeForeignPropertyWithSource = function ArasUiMergeForeignPropertyWithSource(
	foreignProperty,
	returnSource
) {
	/*
	returns modified version of specified foreignProperty with some properties get from source
	Property
	*/
	if (!foreignProperty) {
		return null;
	}

	var dataType = this.getItemProperty(foreignProperty, 'data_type');
	if (dataType != 'foreign') {
		return null;
	}

	var tmpRes = foreignProperty.cloneNode(true);
	var sourcePropNd = this.getRealPropertyForForeignProperty(foreignProperty);

	if (returnSource) {
		return sourcePropNd;
	}
	var self = this;

	function copyProperty(propNm) {
		var tmpVal = self.getItemProperty(sourcePropNd, propNm);
		self.setItemProperty(tmpRes, propNm, tmpVal, false);
	}

	copyProperty('data_type');
	copyProperty('data_source');

	function copyAttribute(propNm, attrNm) {
		var tmpAttr = self.getNodeElementAttribute(sourcePropNd, propNm, attrNm);
		if (tmpAttr) {
			self.setNodeElementAttribute(tmpRes, propNm, attrNm, tmpAttr);
		}
	}

	copyAttribute('data_source', 'keyed_name');
	copyAttribute('data_source', 'type');
	copyAttribute('data_source', 'name');

	this.setItemProperty(tmpRes, 'readonly', '1', false);

	return tmpRes;
};

Aras.prototype.uiDrawFieldEx = function ArasUiDrawFieldEx(
	fieldNd,
	propNd,
	mode,
	itemTypeNd
) {
	if (!fieldNd) {
		return false;
	}

	var fieldModel = this._getBaseDrawingModel('', mode, itemTypeNd, true, true);
	fieldModel.FieldInfo = fieldNd.xml;
	fieldModel.PropInfo = propNd ? propNd.xml : '';
	fieldModel = JSON.stringify(fieldModel);

	var xmlHttp = this.XmlHttpRequestManager.CreateRequest();
	xmlHttp.open(
		'POST',
		this.getBaseURL() + '/Modules/aras.innovator.core.Form/PostField',
		false
	);
	xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	xmlHttp.send(fieldModel);

	var content;
	if (xmlHttp.status == 200) {
		if (!content) {
			content = xmlHttp.responseText;
		}
	}
	return content;
};

Aras.prototype.uiGetFilteredListEx = function (fValueNds, filter) {
	if (!fValueNds) {
		return null;
	}
	if (filter === undefined) {
		filter = '';
	}

	if (filter === '') {
		return fValueNds;
	}

	var res = [];
	for (var i = 0; i < fValueNds.length; i++) {
		if (this.getItemProperty(fValueNds[i], 'filter').search(filter) === 0) {
			res[res.length] = fValueNds[i];
		}
	}

	this.applySortOrder(res);
	return res;
};

Aras.prototype.uiPopulateFormWithItemEx = function (
	form,
	itemNd,
	itemTypeNd,
	isEditMode,
	options = {}
) {
	if (!form) {
		return false;
	}

	var doc = form.ownerDocument || form.document || form;
	if (!doc) {
		this.AlertError(
			this.getResource('', 'ui_methods_ex.failed_get_parent_document_for_form')
		);
		return false;
	}

	var formWindow = doc.parentWindow ? doc.parentWindow : doc.defaultView;
	if (doc.readyState !== 'complete') {
		formWindow.setTimeout(
			function () {
				this.uiPopulateFormWithItemEx(form, itemNd, itemTypeNd, isEditMode);
			}.bind(this),
			10
		);
		return;
	}

	doc.isFormPopulated = false;

	if (!itemNd) {
		return false;
	}

	var iomItem = new Item();
	var i;

	iomItem.dom = itemNd.ownerDocument;
	iomItem.node = itemNd;
	doc.item = itemNd;
	doc.thisItem = iomItem;
	doc.itemID = itemNd.getAttribute('id');
	doc.isTemp = itemNd.getAttribute('isTemp') == '1';

	if (isEditMode === undefined) {
		isEditMode =
			doc.isTemp ||
			this.getItemProperty(itemNd, 'locked_by_id') == this.getCurrentUserID();
	}
	doc.isEditMode = isEditMode;

	if (
		!(
			formWindow.isFormTool ||
			(formWindow.frameElement && formWindow.frameElement.isFormTool)
		)
	) {
		['fed_css', 'css'].forEach((cssPropertyName) => {
			const cssPropertyValue = this.getItemProperty(itemNd, cssPropertyName);
			if (!cssPropertyValue) {
				return;
			}

			const styleSheets = doc.styleSheets[doc.styleSheets.length - 1];
			const styleTemplate = new RegExp(
				/^\.(\w)+(\s)*\{(\w|\s|\:|\-|\#|\;)*\}$/
			); // look getItemStyles
			const styles = cssPropertyValue.split('\n');

			styles
				.filter((style) => styleTemplate.test(style))
				.forEach((style) => {
					style = style.trim();
					const cssRules = styleSheets.cssRules;
					styleSheets.insertRule(style, cssRules.length);
					styleSheets.insertRule(`input${style}`, cssRules.length);
					styleSheets.insertRule(`input[disabled]${style}`, cssRules.length);
					styleSheets.insertRule(`input[readonly]${style}`, cssRules.length);
				});
		});
	}

	if (!itemTypeNd) {
		itemTypeNd = this.getItemTypeNodeForClient(itemNd.getAttribute('type'));
		if (!itemTypeNd) {
			return false;
		}
	}

	var propNds = itemTypeNd.selectNodes(
		"Relationships/Item[@type='Property' and name!='' and " +
			"(not(@action) or (@action!='delete' and @action!='purge'))]"
	);

	if (!propNds.length) {
		itemTypeNd = this.getItemTypeNodeForClient(itemNd.getAttribute('type'));
		if (!itemTypeNd) {
			return false;
		}
		propNds = itemTypeNd.selectNodes(
			"Relationships/Item[@type='Property' and name!='' and " +
				"(not(@action) or (@action!='delete' and @action!='purge'))]"
		);
	}

	const processPropertyNode = (propNd, propDataType) => {
		let workProp;

		if (this.getItemProperty(propNd, 'data_type') === 'foreign') {
			workProp = this.uiMergeForeignPropertyWithSource(propNd, true);
			propDataType = this.getItemProperty(workProp, 'data_type');
		} else {
			workProp = propNd;
		}

		const propPtrn = this.getItemProperty(workProp, 'pattern');
		const propNm = this.getItemProperty(propNd, 'name');

		let pattern;

		switch (propDataType) {
			case 'decimal':
				pattern = this.getDecimalPattern(
					this.getItemProperty(workProp, 'prec'),
					this.getItemProperty(workProp, 'scale')
				);
				break;
			case 'date':
				pattern = this.getDotNetDatePattern(propPtrn);
				break;
			default:
				pattern = null;
		}
		const elem = formWindow.observersHash.getElementById(propNm + '_system');

		if (elem) {
			let propValue = this.getItemProperty(itemNd, propNm);
			propValue = this.convertFromNeutral(propValue, propDataType, pattern);
			if (propDataType === 'sequence' && propValue === '') {
				return;
			}

			let isFilterListPatternValueUpdated = false;
			if (propDataType === 'filter list') {
				const patternElement = formWindow.observersHash.getElementById(
					`${propPtrn}_system`
				);
				isFilterListPatternValueUpdated =
					patternElement &&
					patternElement.value !== patternElement.initialValue;
			}

			if (!options.skipInitControls || isFilterListPatternValueUpdated) {
				elem.init(propValue);
			}

			if (elem.value != propValue) {
				elem.setValue(propValue);
			} else if (propValue !== '') {
				elem.setValue('');
				elem.setValue(propValue);
			}
		}
	};

	const filterListProps = [];

	propNds.forEach((propNd) => {
		const propDataType = this.getItemProperty(propNd, 'data_type');
		if (propDataType === 'filter list') {
			filterListProps.push(propNd);
		} else {
			processPropertyNode(propNd, propDataType);
		}
	});

	filterListProps.forEach((propNd) => {
		processPropertyNode(propNd, 'filter list');
	});

	this.uiPopulateInfoTableWithItem(itemNd, doc);
	var elems = doc.getElementsByName('sys_f_restricted_msg');
	var eventObj = doc.createEvent('Event');
	var eventType = 'onhelp';
	var currElem;

	eventObj.initEvent(eventType, true, true);
	for (i = 0; i < elems.length; i++) {
		currElem = elems[i];
		if (currElem.getAttribute(eventType)) {
			currElem.addEventListener(
				eventType,
				new formWindow.Function('event', currElem.getAttribute(eventType))
			);
			currElem.removeAttribute(eventType);
		}
		currElem.dispatchEvent(eventObj);
	}

	doc.isFormPopulated = true;

	try {
		if (formWindow.parent.updateMenuState) {
			formWindow.parent.updateMenuState();
		}
	} catch (excep) {}

	//to fire onformpopulated event.
	//if onformpopulated is defined on the window which contains just populated form then we call onformpopulated();
	if (
		formWindow &&
		formWindow.onformpopulated &&
		typeof formWindow.onformpopulated == 'function'
	) {
		formWindow.onformpopulated();
	}
};

Aras.prototype.uiNewItemEx = function (itemTypeName) {
	if (!itemTypeName) {
		return null;
	}

	var newItemNd = null;

	switch (itemTypeName) {
		case 'SelfServiceReport':
			var existingWnd = this.uiFindAndSetFocusWindowEx(this.SsrEditorWindowId);
			if (existingWnd) {
				this.AlertError(
					this.getResource(
						'',
						'ui_methods_ex.create_only_one_report_at_a_time'
					).replace('{0}', existingWnd.itemID || '')
				);
				return null;
			}
			newItemNd = this.newItem(itemTypeName);
			newItemNd.setAttribute('use_custom_form', 1);
			this.itemsCache.addItem(newItemNd);
			break;
		case 'RelationshipType':
			newItemNd = this.newRelationship(
				this.getRelationshipTypeId('RelationshipType'),
				null,
				false,
				null
			);
			this.setItemProperty(newItemNd, 'related_id', null);
			break;
		default:
			newItemNd = this.newItem(itemTypeName);
			this.itemsCache.addItem(newItemNd);
			break;
	}

	if (newItemNd) {
		this.uiShowItemEx(newItemNd, 'new');
	}

	return newItemNd;
};

Aras.prototype.uiNewItemExAsync = function (itemTypeId) {
	const aras = this;
	const itemTypeName = aras.getItemTypeName(itemTypeId);

	if (itemTypeName === 'File') {
		return aras.vault.selectFile().then(function (item) {
			const fileNode = aras.newItem('File', item);
			aras.uiShowItemEx(fileNode, 'new');
			aras.itemsCache.addItem(fileNode);
		});
	}

	if (!window.showModalDialog) {
		const itemTypeNode = aras.getItemTypeForClient(itemTypeId, 'id').node;
		const isPolyItem = aras.isPolymorphic(itemTypeNode);

		if (isPolyItem) {
			return aras.newItem(itemTypeName).then(function (node) {
				if (node) {
					aras.itemsCache.addItem(node);
					aras.uiShowItemEx(node, 'new');
				}
			});
		}
	}

	return Promise.resolve(aras.uiNewItemEx(itemTypeName));
};

Aras.prototype.makeItemsGridBlank = function ArasMakeItemsGridBlank(
	saveSetups
) {
	//this method is for internal purposes only.
	if (saveSetups === undefined) {
		saveSetups = true;
	}

	var mainWindow = this.getMainWindow();
	try {
		var w = mainWindow.work;
		if (w) {
			if (w.location) {
				if (!saveSetups) {
					if (w.saveSetups) {
						w.saveSetups = function () {};
					}
				}

				if (w.searchContainer) {
					w.searchContainer.onEndSearchContainer();
				}

				w.location.replace(this.getScriptsURL() + 'blank.html');
			}
			w.isItemsGrid = false;
		}
	} catch (excep) {}

	var m;
	try {
		m = mainWindow.menu;
	} catch (ex) {}
	if (m && m.setAllControlsEnabled) {
		m.setAllControlsEnabled(false);
	}
};

Aras.prototype.uiPopulateInfoTableWithItem = function ArasUiPopulateInfoTableWithItem(
	sourceItm,
	doc,
	sendThumbnailRequestHandler,
	sendLCStateRequestHandler
) {
	var table = doc.getElementById('itemInfoTable');
	var propertyName = 'thumbnail';
	var propertyContainer = doc.getElementById(propertyName + '_row');
	if (!table) {
		return;
	}

	var itProps = table.getElementsByTagName('span');
	var itPropsIndex;
	var itProperty;
	var newItProperty;
	if (!sourceItm) {
		for (itPropsIndex = 0; itPropsIndex < itProps.length; itPropsIndex++) {
			itProperty = itProps[itPropsIndex].getAttribute('id');
			if (!itProperty) {
				continue;
			}

			newItProperty = itProperty.replace('itemProps$', '');
			if (newItProperty != itProperty) {
				doc.getElementById(itProperty).innerHTML = '<b></b>';
			}
		}

		if (propertyContainer) {
			propertyContainer.style.display = 'none';
		}

		return;
	}

	var typeName = sourceItm.getAttribute('type');
	var currItmTypeInfo = this.getItemTypeNodeForClient(typeName, 'name');
	var shortDtPtrn = this.getDotNetDatePattern('short_date');

	var self = this;

	function uiPopulateInfoTableItemPropsHelper(
		newItProperty,
		itProperty,
		currItmTypeInfo,
		sourceItm,
		propertyValue,
		doc,
		shortDtPtrn
	) {
		if (propertyValue === '') {
			var propertyInfo = currItmTypeInfo.selectSingleNode(
				"Relationships/Item[name='" + newItProperty + "']"
			);
			if (propertyInfo) {
				var propertyType = propertyInfo.selectSingleNode('data_type');
				propertyType = propertyType ? propertyType.text : '';

				switch (propertyType) {
					case 'item':
						propertyValue = sourceItm.selectSingleNode(
							newItProperty + '/@keyed_name'
						);
						propertyValue = propertyValue ? propertyValue.text : '';
						break;

					case 'date':
						propertyValue = self.convertFromNeutral(
							self.getItemProperty(sourceItm, newItProperty),
							'date',
							shortDtPtrn
						);
						break;

					default:
						propertyValue = self.getItemProperty(sourceItm, newItProperty);
						propertyValue = propertyValue ? propertyValue : '';
				}
			}
		}
		doc.getElementById(itProperty).innerHTML = propertyValue;
	}

	var uiPopulateInfoTableItemPropsHelperInvoker = function (propertyValue) {
		uiPopulateInfoTableItemPropsHelper(
			newItProperty,
			itProperty,
			currItmTypeInfo,
			sourceItm,
			propertyValue,
			doc
		);
	};

	var propertyValue;
	for (itPropsIndex = 0; itPropsIndex < itProps.length; itPropsIndex++) {
		itProperty = itProps[itPropsIndex].getAttribute('id');
		if (!itProperty) {
			continue;
		}

		newItProperty = itProperty.replace('itemProps$', '');
		propertyValue = '';

		if (newItProperty != itProperty) {
			switch (newItProperty) {
				case 'generation':
					propertyValue = this.getItemProperty(sourceItm, 'generation');
					if (propertyValue === '') {
						propertyValue = '1';
					}
					break;

				case 'state':
					var itemId = self.getItemProperty(sourceItm, 'current_state');
					this.getLCStateLabel(
						itemId,
						sendLCStateRequestHandler,
						uiPopulateInfoTableItemPropsHelperInvoker
					);
					continue;
			}
			uiPopulateInfoTableItemPropsHelper(
				newItProperty,
				itProperty,
				currItmTypeInfo,
				sourceItm,
				propertyValue,
				doc,
				shortDtPtrn
			);
		}
	}

	sendThumbnailRequestHandler =
		sendThumbnailRequestHandler ||
		function (soapBody, callback) {
			var response = this.soapSend('GetItem', soapBody);
			var itemAdditionalInfo = response.results.selectNodes('//Result/Item');
			callback(itemAdditionalInfo);
		}.bind(this);

	if (propertyContainer) {
		propertyValue = '';
		var domElement = doc.getElementById('itemProps$' + propertyName);
		var showThumbnail = function () {
			if (propertyValue) {
				if (propertyValue.toLowerCase().indexOf('vault:///?fileid=') === 0) {
					var fileId = propertyValue.replace(/vault:\/\/\/\?fileid\=/i, '');
					try {
						propertyValue = this.IomInnovator.getFileUrl(
							fileId,
							this.Enums.UrlType.SecurityToken
						);
					} catch (error) {
						if (!error.message.startsWith('Error getting files:')) {
							throw error;
						}
					}
				}

				domElement.src = propertyValue;
				propertyContainer.style.display = '';
			} else {
				domElement.src = '';
				propertyContainer.style.display = 'none';
			}
		}.bind(this);

		//immediately hide previous image
		propertyContainer.style.display = 'none';
		domElement.src = '';

		var cacheItem = this.itemsCache.getItem(sourceItm.getAttribute('id'));
		if (sourceItm.selectSingleNode(propertyName) || cacheItem) {
			propertyValue = this.getItemProperty(
				cacheItem || sourceItm,
				propertyName,
				''
			);
			showThumbnail();
		} else {
			var sourceItemId = this.getItemProperty(sourceItm, 'id');

			sendThumbnailRequestHandler(
				'<Item type="' +
					typeName +
					'" action="get" id="' +
					sourceItemId +
					'" select="' +
					propertyName +
					'"/>',
				function (itemNds) {
					if (1 === itemNds.length) {
						propertyValue = this.getItemProperty(itemNds[0], propertyName, '');
						var thumbnail = sourceItm.appendChild(
							sourceItm.ownerDocument.createElement(propertyName)
						);
						thumbnail.text = propertyValue;
						showThumbnail();
					}
				}.bind(this)
			);
		}
	}
};

Aras.prototype.uiDrawItemInfoTable = function ArasUiDrawItemInfoTable(
	itemTypeNd,
	propsHelper,
	propertiesArray
) {
	var defaultProperties = [
		'created_by_id',
		'created_on',
		'modified_by_id',
		'modified_on',
		'locked_by_id',
		'major_rev',
		'release_date',
		'effective_date',
		'generation',
		'state'
	];
	propertiesArray = propertiesArray || defaultProperties;
	propertiesArray = propertiesArray.filter(function (val) {
		return val !== '';
	});
	var resourcesObject = this.getResources(
		'core',
		propertiesArray.map(function (propertyId) {
			return 'item_info_table.' + propertyId + '_txt';
		})
	);

	var propertiesHelper = {
		properties: propertiesArray.map(function (propertyId) {
			return {
				id: propertyId,
				label: resourcesObject['item_info_table.' + propertyId + '_txt']
			};
		}),
		showThumbnails: false
	};
	Object.assign(propertiesHelper, propsHelper);

	return this.uiDrawItemInfoTableImpl(itemTypeNd, propertiesHelper);
};

Aras.prototype.uiDrawItemInfoTable4ItemsGrid = function ArasUiDrawItemInfoTable4ItemsGrid(
	itemTypeNd,
	propertiesHelper
) {
	if (!propertiesHelper) {
		propertiesHelper = {
			showThumbnails: true
		};
	}
	return this.uiDrawItemInfoTable(itemTypeNd, propertiesHelper);
};

Aras.prototype.uiDrawItemInfoTableImpl = function ArasUiDrawItemInfoTableImpl(
	itemTypeNd,
	propertiesHelper
) {
	var largeIconImg = '';
	var label = '';
	var isVersionable = false;
	if (itemTypeNd) {
		largeIconImg = this.getItemProperty(itemTypeNd, 'large_icon');

		if (largeIconImg.toLowerCase().indexOf('vault:///?fileid=') === 0) {
			var fileId = largeIconImg.replace(/vault:\/\/\/\?fileid\=/i, '');
			largeIconImg = this.IomInnovator.getFileUrl(
				fileId,
				this.Enums.UrlType.SecurityToken
			);
		}

		label =
			this.getItemProperty(itemTypeNd, 'label') ||
			this.getItemProperty(itemTypeNd, 'name');
		label = this.EscapeSpecialChars(label);
		isVersionable = this.getItemProperty(itemTypeNd, 'is_versionable') == '1';
	}

	var imgSrc = largeIconImg ? " src='" + largeIconImg + "'" : '';
	var html =
		"<div class='properties-block' style='width: 170px !important;'>" +
		"<div class='prop-header'>" +
		"<h2><span id='label_span'>" +
		label +
		'</span></h2>' +
		"<img id='large_icon_img' name='large_icon_img' hspace='20' vspace='20'" +
		imgSrc +
		" style='display: block; visibility:" +
		(largeIconImg ? 'visible' : 'hidden') +
		'; height: ' +
		(largeIconImg ? 'auto' : '30px') +
		'; width: ' +
		(largeIconImg ? 'auto' : '28px') +
		"; max-width: 45px; max-height: 45px'/>" +
		'</div>' +
		"<div id='itemInfoTable' class='prop-body'>";

	html = propertiesHelper.properties.reduce(
		function (accumulator, property) {
			var displayStyle =
				(property.id === 'release_date' || property.id === 'effective_date') &&
				!isVersionable
					? "style='display:none;'"
					: '';
			accumulator +=
				"<div id='" +
				property.id +
				"_row' " +
				displayStyle +
				" class='prop-field'>" +
				"<span class='prop-label'>" +
				this.EscapeSpecialChars(property.label) +
				'</span>' +
				"<span id='itemProps$" +
				property.id +
				"' class='prop-value'></span></div>";
			return accumulator;
		}.bind(this),
		html
	);

	if (propertiesHelper.showThumbnails) {
		var propertyName = 'thumbnail';
		var propertyNode = itemTypeNd.selectSingleNode(
			"Relationships/Item[@type='Property' and name='" +
				propertyName +
				"' and data_type='image']"
		);
		if (propertyNode) {
			html +=
				"<div class='prop-field' id='" +
				propertyName +
				"_row' style='display:none;'>" +
				"<img id='itemProps$" +
				propertyName +
				"' src='' style='max-width:150px; max-height:150px; margin-top: 5px;'/>" +
				'</div>';
		}
	}

	html += '</div></div>';
	return html;
};

Aras.prototype.uiGetItemInfoTable = function ArasUiGetItemInfoTable(
	itemTypeNd,
	itemNd,
	makeTableForItm,
	appendIdToItmTable,
	widthsHash,
	propsArr
) {
	var propertiesHelper = {
		showThumbnails: false
	};

	if (!itemNd && !makeTableForItm) {
		propsArr = [];
	} else {
		propsArr = propsArr || [
			'created_by_id',
			'created_on',
			'modified_by_id',
			'modified_on',
			'locked_by_id',
			'major_rev',
			'release_date',
			'effective_date',
			'generation',
			'state',
			'id'
		];

		if (!appendIdToItmTable && propsArr.indexOf('id') > -1) {
			propsArr.splice(propsArr.indexOf('id'), 1);
		}
	}

	return this.uiDrawItemInfoTable(itemTypeNd, propertiesHelper, propsArr);
};

//ItemTypeValue may be ItemTypeName or ItemTypeNode
Aras.prototype.saveUICommandHistoryIfNeed = function ArasSaveUICommandHistoryIfNeed(
	itemTypeValue,
	itemNd,
	uiCmd,
	formName
) {
	if (!itemNd || this.isNew(itemNd)) {
		return;
	}
	var itemTypeNode;
	var itemTypeName;

	if (typeof itemTypeValue == 'object') {
		itemTypeNode = itemTypeValue;
		itemTypeName = itemNd.getAttribute('type');
	} else if (typeof itemTypeValue == 'string') {
		itemTypeNode = this.getItemTypeNodeForClient(itemTypeValue);
		itemTypeName = itemTypeValue;
	} else {
		return;
	}

	var historyAction;
	switch (uiCmd) {
		case 'view':
			historyAction = 'FormView';
			break;
		case 'print':
			historyAction = 'FormPrint';
			break;
		default:
			return;
	}

	if (itemTypeName != 'File') {
		var historyTemplate = itemTypeNode.selectSingleNode('history_template');
		if (
			!historyTemplate ||
			!historyTemplate.selectSingleNode(
				"Item[@type='History Template']/Relationships/Item[@type='History Template Action']/related_id/Item[@type='History Action' and name='" +
					historyAction +
					"']"
			)
		) {
			return;
		}
	}

	var q = this.newIOMItem(itemTypeName, 'AddHistory');
	q.setAttribute('id', itemNd.getAttribute('id'));
	q.setProperty('action', historyAction);
	q.setProperty('form_name', formName);

	// Send synchronous request by reason of IR-037684 (IE bug 877525)
	var result = this.soapSend('ApplyItem', q.dom.xml);
	if (result.getFaultCode() != '0') {
		this.AlertError(result);
	}
};

Aras.prototype.getElementsById = function ArasGetElementsById(doc, tag, id) {
	result = [];
	var elements = doc.getElementsByTagName(tag);

	for (var i = 0, j = 0; i < elements.length; i++) {
		if (elements[i].id == id) {
			result[j++] = elements[i];
		}
	}
	return result;
};

/// <summary>
/// This function is a workaround for IE behavior of displaying liquid tables.
/// To display objects that should take all available space on the page usually we can shrink it to 100%.
/// But if there are any other elementswith fixed height on the page we can't set our object height to 100% and should calculate
/// size for it.
/// There are some constraints for markup that will use this function to resize object:
///
///	0. Object should have table as container.
///	1. Need to set height in px for object and object container both for objects with fixed height;
///	   It is need to set fixed object height and its position in container.
///	2. Need to set height in % for object and object container both for objects with relative height;
///	3. Need to set html, body height to 100% and margin and padding to 0px;
///	4. It is possible to have elements before liquid table, but not after it;
///	5. Need to resize not td, but an object in this td to avoid its blinking in IE8;
///	6. Need to set a doctype for the page.
/// </summary>
/// <example>
///   <code language="html">
///<![CDATA[<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
///<html>
///	<script type="text/javascript">
///		// Call fix function every 100ms to resize liquid container.
///		// Attach event handler that should stop calling fix function.
///		// 100ms interval choosed as most useful interval to update height
///		// without noticeable delay.
///		onload = function OnloadHandler()
///		{
///			interval = setInterval(fix, 100);
///			window.attachEvent('onbeforeunload', onbeforeunload_handler);
///		}
///
///		// For better responsibility we could call it in onresize event handler;
///		// But it is not required.
///		onresize = function OnresizeHandler()
///		{
///			fix();
///		}
///
///		// Stop fixing height before unloading page because aras object becomes
///		// unavailable and accessing to it causes error and
///		// not cleared interval could lead to memory leaks.
///		//
///		var onbeforeunload_handler = function ()
///		{
///			if (window.interval)
///			{
///				clearInterval(interval);
///			}
///		}
///
///		// Create a simple wrapper that calls fixLiquidContainerHeight
///		// passing in current document object and element that need to be resized.
///		function fix()
///		{
///			var el = document.getElementById("grid");
///			aras.fixLiquidContainerHeight(document, el);
///		}
///	</script>
///</html>]]>
/// </code>
/// </example>
Aras.prototype.fixLiquidContainerHeight = function ArasFixLiquidContainerHeight(
	doc,
	el,
	obj
) {
	if (!el || !el.parentNode || !el.parentNode.offsetParent) {
		return;
	}
	if (!obj) {
		obj = el;
	}

	var parentEl = el.parentNode;
	if (parentEl.tagName == 'TBODY') {
		var tableEl = parentEl.offsetParent;
		var containerHeight = doc.documentElement.clientHeight
			? doc.documentElement.clientHeight
			: doc.documentElement.offsetHeight;

		containerHeight -= tableEl.offsetTop;
		var newHeight = containerHeight;
		var rows = parentEl.rows;
		for (var i = 0, L = rows.length; i < L; i++) {
			var row = rows[i];
			if (row != el && row.style.display != 'none') {
				newHeight -= row.offsetHeight;
			}
		}
		newHeight = newHeight > 0 ? newHeight : 0;
		if (obj.style.pixelHeight != newHeight) {
			obj.style.height = newHeight + 'px';
		}

		newHeight = containerHeight;
		newHeight = newHeight > 0 ? newHeight : 0;
		if (tableEl.style.pixelHeight != newHeight) {
			tableEl.style.height = newHeight + 'px';
		}
	} else {
		this.fixLiquidContainerHeight(doc, parentEl, obj);
	}
};

Aras.prototype.SelectFileFromPackage = function ArasSelectFileFromPackage(
	methodName,
	isMultiselect
) {
	if (isMultiselect === undefined) {
		isMultiselect = false;
	}
	// get file from this instance
	var methodArgs = {};
	methodArgs.multiselect = isMultiselect;
	methodArgs.aras = this;
	var itemIds = this.evalItemMethod(methodName, '', methodArgs);

	if (!itemIds || itemIds.length === 0) {
		return;
	}

	query = new Item('File', 'get');
	query.setAttribute('idlist', itemIds);
	query = query.apply();
	if (query.isError()) {
		this.AlertError(query.getErrorString());
		return;
	}

	var count = query.getItemCount();
	for (var i = 0; i < count; i++) {
		var itemFile = query.getItemByIndex(i);
		itemFile.setAttribute('action', 'FE_CopyFileToContainer');
	}
	return isMultiselect ? query : query.node;
};

Aras.prototype.getElementsByClass = function ArasGetElementsByClass(
	searchClass,
	node
) {
	return node.getElementsByClassName(searchClass);
};

Aras.prototype.updateDomSelectLabel = function ArasUpdateDomSelectLabel(
	domSelect
) {
	var span = domSelect.parentNode.getElementsByTagName('span')[0];
	span.innerHTML = domSelect.options[domSelect.selectedIndex]
		? domSelect.options[domSelect.selectedIndex].text
		: '';
};

/*
 * isNeedToDisplaySSVCSidebar - function defines is it necessary to display the SSVC sidebar.
 *
 * parameters:
 * itemNd   - xml node of item to find correspondent view
 * formType - string, representing mode: 'add', 'view', 'edit' or 'print'
 */
Aras.prototype.isNeedToDisplaySSVCSidebar = function ArasIsNeedToDisplaySSVCSidebar(
	itemNd,
	formType
) {
	function findMaxPriorityView(itemType, roles, formType) {
		function getViewNodesForRoles(viewNodes, roles) {
			const validReturnIds = [];
			for (let j = 0; j < viewNodes.length; j++) {
				if (roles.indexOf(viewNodes[j].selectSingleNode('role').text) >= 0) {
					validReturnIds.push(viewNodes[j].getAttribute('id'));
				}
			}
			const strReturnIds = "(@id='" + validReturnIds.join("' or @id='") + "')";
			return itemType.selectNodes(
				"Relationships/Item[@type='View' and " + strReturnIds + ']'
			);
		}

		var tryGetClassificationViewWithoutFormType = function (classification) {
			xp =
				"Relationships/Item[@type='View'][form_classification='" +
				classification +
				"']";
			const nodes = itemType.selectNodes(xp);
			return getViewNodesForRoles(nodes, roles);
		};

		var returnNodes;
		if (typeof roles == 'string') {
			var tmpRoles = roles;
			roles = [];
			roles.push(tmpRoles);
		}

		if (classification) {
			var xp =
				"Relationships/Item[@type='View' and type='" +
				formType +
				"'][form_classification='" +
				classification +
				"']";
			let nodes = itemType.selectNodes(xp);
			nodes = getViewNodesForRoles(nodes, roles);
			returnNodes =
				nodes.length > 0
					? nodes
					: tryGetClassificationViewWithoutFormType(classification);
		}

		if (!(returnNodes && returnNodes.length !== 0)) {
			returnNodes = itemType.selectNodes(
				"Relationships/Item[@type='View' and string(form_classification)='' and type='" +
					formType +
					"']"
			);
			returnNodes = getViewNodesForRoles(returnNodes, roles);
		}

		if (returnNodes.length === 0) {
			return '';
		}

		var currView = returnNodes[0];
		var currPriority = self.getItemProperty(returnNodes[0], 'display_priority');
		if (currPriority === '') {
			currPriority = Number.POSITIVE_INFINITY;
		}

		for (var i = 1; i < returnNodes.length; i++) {
			var priority = self.getItemProperty(returnNodes[i], 'display_priority');
			if (priority === '') {
				priority = Number.POSITIVE_INFINITY;
			}

			if (currPriority > priority) {
				currPriority = priority;
				currView = returnNodes[i];
			}
		}

		return currView;
	}

	function findMaxPriorityViewForItemType(anItemType, formType) {
		var res = findMaxPriorityView(anItemType, identityId, formType);
		if (res) {
			return res;
		}

		if (formType != 'default') {
			res = findMaxPriorityView(anItemType, identityId, 'default');
			if (res) {
				return res;
			}
		}

		res = findMaxPriorityView(anItemType, userIdentities, formType);
		if (res) {
			return res;
		}

		if (formType != 'default') {
			res = findMaxPriorityView(anItemType, userIdentities, 'default');
			if (res) {
				return res;
			}
		}

		return undefined;
	}

	if (!this.commonProperties.IsSSVCLicenseOk) {
		return '';
	}

	if (!itemNd) {
		return '';
	}
	if (
		!formType ||
		formType.search(/^default$|^add$|^view$|^edit$|^print$|^search$/) == -1
	) {
		return '';
	}

	var userIdentities = this.getIdentityList().split(',');
	if (userIdentities.length === 0) {
		return '';
	}

	const identityId = this.getIsAliasIdentityIDForLoggedUser();

	if (!identityId) {
		return '';
	}

	var itemTypeName = itemNd.getAttribute('type');
	var itemTypeNd = this.getItemTypeNodeForClient(itemTypeName, 'name');
	var classification;
	var classificationNode = itemNd.selectSingleNode('classification');
	if (classificationNode) {
		classification = classificationNode.text;
	}

	var self = this;

	var view = findMaxPriorityViewForItemType(itemTypeNd, formType);
	if (
		!view &&
		this.getItemProperty(itemTypeNd, 'implementation_type') == 'polymorphic'
	) {
		var itemtypeId = this.getItemProperty(itemNd, 'itemtype');
		if (itemtypeId) {
			itemTypeNd = this.getItemTypeNodeForClient(itemtypeId, 'id');
			if (itemTypeNd) {
				view = findMaxPriorityViewForItemType(itemTypeNd, formType);
			}
		}
	}
	return !view ? false : this.getItemProperty(view, 'show_ssvc') === '1';
};

Aras.prototype.uiIsParamTabVisibleEx = function Aras_uiIsParamTabVisibleEx(
	itemNd,
	itemTypeName
) {
	var mode = '0';
	var res = false;
	if (itemNd && itemNd.xml && !itemTypeName) {
		itemTypeName = itemNd.getAttribute('type');
	}
	if (!(itemTypeName && itemNd)) return res;
	var itemTypeNd = this.getItemTypeNodeForClient(itemTypeName);
	if (!itemTypeNd || !itemTypeNd.xml) return res;
	var show_parameters_tabNd = itemTypeNd.selectSingleNode(
		'show_parameters_tab'
	);
	var show_parameters_tab = '1';
	if (show_parameters_tabNd) show_parameters_tab = show_parameters_tabNd.text;

	switch (show_parameters_tab) {
		case '0':
			break;
		case '1':
			mode = '1';
			var class_structureNd = itemTypeNd.selectSingleNode('class_structure');
			if (class_structureNd) {
				var classificationNd = itemNd.selectSingleNode('classification');
				var classification = classificationNd ? classificationNd.text : '';
				if (!this.isClassPathRoot(classification)) {
					var propsOfClassPath = this.selectPropNdsByClassPath(
						classification,
						itemTypeNd
					);
					if (propsOfClassPath && propsOfClassPath.length > 0) {
						var props = [];
						for (var i = 0; i < propsOfClassPath.length; i++) {
							var prop = propsOfClassPath[i];
							var class_path = this.getItemProperty(prop, 'class_path');
							if (!this.isClassPathRoot(class_path)) props.push(prop);
						}

						res = props.length > 0;
					}
				}
			}
			break;
		case '2':
			mode = '2';
			res = true;
			break;
	}
	return {
		mode: mode,
		show: res
	};
};

function appendParameter(param, value) {
	if (param !== '') {
		param += '&';
	}
	param += value;
	return param;
}
