// (c) Copyright by Aras Corporation, 2004-2013.

function findInstanceFrame() {
	for (var i = 0; i < frames.length; i++) {
		if (frames[i].frameElement.id == 'instance') {
			return frames[i];
		}
	}
	return null;
}

function findCurrentRelationshipsTab() {
	if (viewMode == 'tab view' && !window.hideTabs) {
		var relationshipsFrame =
			document.frames && document.frames['relationships'];
		var currentTabFrame = relationshipsFrame
			? relationshipsFrame.iframesCollection[relationshipsFrame.currTabID]
			: null;

		return currentTabFrame ? currentTabFrame.contentWindow : null;
	}

	return null;
}

function isPasteCommandAvailable(
	itemNode,
	relatedItemTypeName,
	relationshipTypeName
) {
	var isTemp = aras.isTempEx(itemNode),
		isLockedByUser = aras.isLockedByUser(itemNode),
		proceedCheck =
			!aras.clipboard.isEmpty() &&
			(isTemp || isLockedByUser) &&
			!isFunctionDisabled(itemTypeName, 'Paste');

	if (proceedCheck) {
		proceedCheck = aras.isLCNCompatibleWithIT(itemTypeID);

		if (proceedCheck) {
			if (relatedItemTypeName || relationshipTypeName) {
				var clipboardData = aras.clipboard.paste(),
					isMatchFound = false,
					clipboardItem,
					i;

				for (i = 0; i < clipboardData.length; i++) {
					clipboardItem = clipboardData[i];

					if (
						clipboardItem.related_itemtype === relatedItemTypeName ||
						clipboardItem.relationship_itemtype === relationshipTypeName
					) {
						isMatchFound = true;
						break;
					}
				}

				return isMatchFound;
			}
		}
	}

	return false;
}

/*
addRowToItemsGrid is used in User defined Methods
*/
function addRowToProvidedItemsGrid(itemsGrid, item) {
	if (!itemsGrid || !item) {
		return false;
	}

	if (itemsGrid.itemTypeName != itemTypeName) {
		return false;
	}
	itemsGrid.updateRow(item);
	return true;
}

function updateProvidedItemsGrid(
	itemsGrid,
	updatedItem,
	deleteRowWithChangedId
) {
	if (!itemsGrid || !updatedItem) {
		return false;
	}

	if (itemTypeName === 'ItemType' && itemID === itemsGrid.itemTypeID) {
		aras.makeItemsGridBlank();
		return true;
	}

	const grid = itemsGrid.grid;
	const updatedID = updatedItem.getAttribute('id');

	deleteRowWithChangedId =
		deleteRowWithChangedId === undefined
			? true
			: Boolean(deleteRowWithChangedId);

	if (!deleteRowWithChangedId && grid.getRowIndex(updatedID) === -1) {
		return true;
	}

	const wasSelected = grid.getSelectedItemIds().indexOf(itemID) > -1;

	if (deleteRowWithChangedId && updatedID !== itemID) {
		itemsGrid.deleteRow(item);
	}

	if (itemsGrid.ItemTypeGrid) {
		itemsGrid.ItemTypeGrid.updateItem(item, updatedItem);
	}
	itemsGrid.updateRow(updatedItem);

	if (wasSelected) {
		if (updatedID === itemID) {
			itemsGrid.onSelectItem(itemID);
		} else {
			const currSel = grid.getSelectedId();
			itemsGrid.onSelectItem(currSel);
		}
	}
	return true;
}

function deleteRowFromProvidedItemsGrid(itemsGrid, rowID) {
	if (itemsGrid) {
		var grid = itemsGrid.grid;
		var selID = grid.getSelectedItemIds(';');
		if (selID == rowID) {
			var prevSelRow = grid.getRowIndex(selID);
			grid.deleteRow(selID);
			var rowsInGrid = grid.getRowCount();
			if (rowsInGrid > 0 && prevSelRow > -1) {
				if (prevSelRow < rowsInGrid) {
					selID = grid.getRowId(prevSelRow);
				} else {
					selID = grid.getRowId(rowsInGrid - 1);
				}

				grid.setSelectedRow(selID, false, true);
				itemsGrid.onSelectItem(selID);
			} else {
				//if(rowsInGrid>0)
				itemsGrid.setupGrid(false);
			}
		} else if (grid.getRowIndex(rowID) != -1) {
			grid.deleteRow(rowID);
			var selID = grid.getSelectedItemIds(';').split(';')[0];
			if (selID) {
				itemsGrid.onSelectItem(selID);
			}
		}
	}
}

function updateMenuState() {
	clearTimeout(updateMenuState_tmt);
	menuFrame = isTearOff
		? window.tearOffMenuController
			? window.tearOffMenuController
			: null
		: mainWnd.menu;

	if (!menuFrame || !menuFrame.menuFrameReady) {
		updateMenuState_tmt = setTimeout('updateMenuState()', 100);
		return;
	}
	const layout = window.layout;
	if (layout) {
		const defaultOptions = getDefaultOptions(
			window.itemID,
			window.itemTypeName
		);
		layout.options = Object.assign(layout.options, defaultOptions);
		layout.observer.notify('UpdateTearOffWindowState');
		return;
	}

	var val =
		aras.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_show_labels'
		) == 'true';
	menuFrame.setControlState('show_text', val);

	if (menuFrame.toolbarApplet) {
		menuFrame.toolbarApplet.showLabels(val);
	}

	var isTemp = aras.isTempEx(item);
	var isDirty = aras.isDirtyEx(item);
	var isNew = aras.isNew(item);
	var locked_by = aras.getItemProperty(item, 'locked_by_id');
	var ItemCanBeLockedByUser = aras.uiItemCanBeLockedByUser(
		item,
		isRelationshipIT,
		use_src_accessIT
	);
	var ItemIsLockedByUser = aras.isLockedByUser(item);

	var newFlg = can_addFlg;
	var openFlg = !isTemp && itemTypeName == 'File';
	var saveFlg =
		((isTemp && !isDependentIT) || locked_by == aras.getCurrentUserID()) &&
		!isFunctionDisabled(itemTypeName, 'Save');
	var saveAsFlg = !isTemp && !isFunctionDisabled(itemTypeName, 'Save As');
	var purgeFlg = locked_by == '' && !isFunctionDisabled(itemTypeName, 'Delete');
	var lockFlg = ItemCanBeLockedByUser;
	var unlockFlg = ItemIsLockedByUser;
	var undoFlg = !isTemp && isDirty;
	var revisionFlg = !isTemp && isVersionableIT;
	var discussionFlg = !!(window.isSSVCEnabled && !isNew);

	var copy2clipboardFlg =
		aras.getItemProperty(itemType, 'is_relationship') == '1' &&
		aras.getItemProperty(itemType, 'is_dependent') != '1' &&
		!isFunctionDisabled(itemTypeName, 'Copy');
	var relationshipsTab = findCurrentRelationshipsTab();
	var relatedItemTypeName = relationshipsTab
		? relationshipsTab.relatedItemTypeName
		: '';
	var relationshipTypeName = relationshipsTab
		? relationshipsTab.relationshipTypeName
		: '';
	var pasteFlg = isPasteCommandAvailable(
		item,
		relatedItemTypeName,
		relationshipTypeName
	);
	var pasteSpecialFlg =
		!aras.clipboard.isEmpty() &&
		(isTemp || ItemIsLockedByUser) &&
		!isFunctionDisabled(itemTypeName, 'Paste Special');
	var showClipboardFlg = !aras.clipboard.isEmpty();
	var promoteFlg = lockFlg && !isFunctionDisabled(itemTypeName, 'Promote');
	menuFrame.setControlEnabled('new', newFlg);
	menuFrame.setControlEnabled('open', openFlg);
	menuFrame.setControlEnabled('download', openFlg);
	menuFrame.setControlEnabled('view', false);
	menuFrame.setControlEnabled('edit', false);
	menuFrame.setControlEnabled('save', saveFlg);
	menuFrame.setControlEnabled('saveAs', saveAsFlg);
	menuFrame.setControlEnabled('save_unlock_close', saveFlg);
	menuFrame.setControlEnabled('purge', purgeFlg && isVersionableIT);
	menuFrame.setControlEnabled('delete', purgeFlg);
	menuFrame.setControlEnabled('print', true);
	menuFrame.setControlEnabled('lock', lockFlg);
	menuFrame.setControlEnabled('unlock', unlockFlg);
	menuFrame.setControlEnabled('undo', undoFlg);
	menuFrame.setControlEnabled('promote', promoteFlg);
	menuFrame.setControlEnabled('revisions', revisionFlg);
	menuFrame.setControlEnabled('copy2clipboard', copy2clipboardFlg);
	menuFrame.setControlEnabled('paste', pasteFlg);
	menuFrame.setControlEnabled('paste_special', pasteSpecialFlg);
	menuFrame.setControlEnabled('show_clipboard', showClipboardFlg);
	menuFrame.setControlEnabled('ssvc_discussion_button', discussionFlg);

	if (isTearOff) {
		menuFrame.setControlEnabled('saveANDexit', saveFlg);
		menuFrame.setControlEnabled('close', true);
		menuFrame.setEnableAccessMenu(isEditMode);
	}

	var topWindow = aras.getMostTopWindowWithAras(window);
	if (topWindow.cui) {
		topWindow.cui.callInitHandlers('UpdateTearOffWindowState');
	}
}

function registerCommandEventHandler(
	handlerOwnerWindow,
	handlerF,
	BeforeOrAfter,
	commandName,
	options
) {
	if (!handlerOwnerWindow || !handlerF || !BeforeOrAfter || !commandName) {
		return;
	}
	if (BeforeOrAfter != 'before' && BeforeOrAfter != 'after') {
		return;
	}

	var key = BeforeOrAfter + commandName;
	var handlersInfoArr = commandEventHandlers[key];
	if (!handlersInfoArr) {
		handlersInfoArr = new Array();
		commandEventHandlers[key] = handlersInfoArr;
	}

	var len = handlersInfoArr.push({
		window: handlerOwnerWindow,
		handler: handlerF,
		options: options
	});

	key += ':' + String(len - 1);

	return key;
}

function unregisterCommandEventHandler(key) {
	if (!key) {
		return;
	}

	var re = /^(.+):(\d+)$/;
	if (!re.test(key)) {
		return;
	}

	var k1 = RegExp.$1;
	var k2 = RegExp.$2;

	var handlersInfoArr = commandEventHandlers[k1];
	if (!handlersInfoArr) {
		return;
	}

	aras.deletePropertyFromObject(handlersInfoArr, k2);
}

function executeUserCommandHandler(hId) {
	var retValue = false; //indicates: no faults exist
	var handlersInfoArr = commandEventHandlers[hId];
	if (!handlersInfoArr) {
		return retValue;
	}

	for (var i = 0; i < handlersInfoArr.length; i++) {
		var handlerInfo = handlersInfoArr[i];
		if (!handlerInfo) {
			continue;
		}

		var win = handlerInfo.window;
		var h = handlerInfo.handler;
		if (!win || aras.isWindowClosed(win)) {
			handlersInfoArr[i] = null;
			continue;
		}

		try {
			if (
				handlerInfo.options &&
				(handlerInfo.options &
					ExecuteUserCommandHandlerOptions.EvalWinHandler) !=
					0
			) {
				retValue = eval('win.' + h + '()'); // IR-031317 h.apply(win) & direct call failed with 'Cannot execute freed script'
			} else {
				retValue = h();
			}
		} catch (excep) {
			retValue = 'Exception in handler ' + hId + ', number ' + i + '.';
		}

		if (retValue && typeof retValue == 'string') {
			break;
		}
	}
	return retValue;
}

function onBeforeCommandRun(commandName) {
	return executeUserCommandHandler('before' + commandName);
}

function onAfterCommandRun(commandName) {
	return executeUserCommandHandler('after' + commandName);
}

function onNewCommand() {
	// Calling uiNewItemEx for Project itemtype creates dialog in main window.
	// aras.utils.setFocus not working in chrome for parent window.
	// We need use window.open with empty url as 1-st argument and name of exits window as 2-nd argument. If window name is empty we need set temporary name.
	// window.open change opener property of opened window. After window.open calling we set old params to target window.
	// window.open must be called with context of the current window.
	if (itemTypeName === 'Project' && aras.Browser.isCh()) {
		var aWindow = aras.getMostTopWindowWithAras(window).opener;
		var lastOpener = aWindow.opener,
			lastName = aWindow.name;
		if (!aWindow.name) {
			aWindow.name = aras.generateNewGUID();
		}
		window.open('', aWindow.name);
		aWindow.opener = lastOpener;
		aWindow.name = lastName;
	}
	var newItm = aras.uiNewItemEx(itemTypeName);
	if (newItm) {
		addRowToItemsGrid(newItm);
	}
	return !!newItm;
}

function onViewCommand() {
	return true;
}

function onEditCommand() {
	onBeforeCommandRun('edit');
	if (aras.isTempEx(item)) {
		return true;
	}

	var isLockedByUser = aras.isLockedByUser(item);

	if (!isLockedByUser && this.onLockCommand) {
		this.onLockCommand({ setEditMode: true });
	} else {
		window.setEditMode();
		aras.setItemEditStateEx(item, true);
	}
	onAfterCommandRun('edit');

	return true;
}

function onPurgeCommand(silentMode) {
	return onPurgeDeleteCommand('purge', silentMode);
}

function onDeleteCommand(silentMode) {
	return onPurgeDeleteCommand('delete', silentMode);
}

function onPurgeDeleteCommand(command, silentMode) {
	var delRes = false;
	if (command == 'purge') {
		delRes = aras.purgeItemEx(item, silentMode);
	} else {
		delRes = aras.deleteItemEx(item, silentMode);
	}

	var openerMainWindow = openerMainWnd;
	if (delRes && openerMainWindow.main) {
		deleteRowFromItemsGrid(itemID);

		if (itemTypeName == 'ItemType') {
			if (window.isTearOff) {
				if (openerMainWindow.updateTree) {
					openerMainWindow.updateTree(itemID.split(';'));
				}
			} else if (mainWnd.main) {
				mainWnd.updateTree(itemID.split(';'));
			}
		}

		if (window.isTearOff) {
			if (itemTypeName == 'Action' || itemTypeName == 'Report') {
				openerMainWindow.mainLayout.updateCuiLayoutOnItemChange(itemTypeName);
			}
			window.close(null, true);
		} else {
			mainWnd.work.location.replace(
				'itemsGrid.html?itemtypeID=' + window.itemType.getAttribute('id')
			);
		}
	}

	return { result: delRes ? 'Deleted' : 'Canceled' };
}

function onLockCommand(lockOptions) {
	lockOptions = lockOptions || { setEditMode: !window.layout };

	var res = aras.lockItemEx(item);
	if (!res) {
		return true;
	}

	if (lockOptions.setEditMode) {
		isEditMode = true;
		aras.setItemEditStateEx(res, true);
	}
	aras.uiReShowItemEx(itemID, res, viewMode);
	return true;
}

function onUnlockCommand(saveChanges, options) {
	options = options || {};

	var msg = onBeforeCommandRun('unlock');
	if (msg && typeof msg == 'string') {
		aras.AlertError(msg);
		return false;
	}

	const relationshipsItems =
		"Relationships/Item[@action='update' or @action='add' or @action='delete']";
	const relationshipsRelatedItems =
		"Relationships/Item/related_id/Item[@action='update' or @action='add' or @isEditState='1']";
	const editedRelationshipItems = ArasModules.xml.selectNodes(
		item,
		`${relationshipsItems}|${relationshipsRelatedItems}`
	);
	const editedRelatedItems = ArasModules.xml.selectNodes(
		item,
		relationshipsRelatedItems
	);
	const resultItem = aras.unlockItemEx(item, saveChanges);
	if (!resultItem) {
		return false;
	}

	onAfterCommandRun('unlock');

	const requestAml = editedRelatedItems.reduce((prevValue, currentItem) => {
		let iomRelatedItem = aras.newIOMItem(
			currentItem.getAttribute('type'),
			'get'
		);
		iomRelatedItem.setAttribute('id', currentItem.getAttribute('id'));
		return prevValue + iomRelatedItem.node.xml;
	}, '');
	if (requestAml) {
		const newItemIdResult = aras
			.soapSend('ApplyAML', '<AML>' + requestAml + '</AML>')
			.getResult();

		const resetedRelatedItems = ArasModules.xml.selectNodes(
			newItemIdResult,
			'Item'
		);
		resetedRelatedItems.forEach((item) => {
			aras.updateInCache(item);
		});
	}

	const store = aras.getMainWindow().store;

	editedRelationshipItems.forEach(function (item) {
		store.boundActionCreators.deleteItemLocalChangesRecord(
			item.getAttribute('type'),
			item.getAttribute('id')
		);
	});

	isEditMode = false;

	if (!options.skipReshow && itemTypeName !== 'SelfServiceReport') {
		aras.uiReShowItemEx(itemID, resultItem, viewMode);
	}

	return true;
}

function onUndoCommand() {
	if (!aras.isDirtyEx(item)) {
		aras.AlertError(aras.getResource('', 'item_window.nothing_to_undo'));
		return true;
	}

	if (!aras.confirm(aras.getResource('', 'common.undo_discard_changes'))) {
		return true;
	}
	if (!aras.isTempEx(item)) {
		aras.removeFromCache(itemID);
		var res = aras.getItemById(itemTypeName, itemID, 0);
		if (!res) {
			return true;
		}
	}

	updateItemsGrid(res);
	aras.uiReShowItemEx(itemID, res, viewMode);
	return true;
}

function onSaveCommand(options) {
	options = options || { skipReshow: false };
	if (itemTypeName == 'Report') {
		clearJavascriptInReport(item);
	}

	var msg = onBeforeCommandRun('save');
	if (msg && typeof msg == 'string') {
		aras.AlertError(msg);
		return Promise.resolve(false);
	}

	var isSpinnerNecessary =
		item.selectNodes(
			'descendant-or-self::Item[@type="File" and (@action="add" or @action="update")]'
		).length > 0;
	if (isSpinnerNecessary) {
		aras.browserHelper.toggleSpinner(document, true);
	}

	const itemConfigId = aras.getItemProperty(
		window.item,
		'config_id',
		window.item.id
	);
	const storageValue = JSON.parse(sessionStorage.getItem(itemConfigId) || '{}');

	const isSaveCommand = !ArasModules.xml.selectSingleNode(
		item,
		"Relationships/Item/related_id/Item[@isEditState='1' and (@unlock='1' or @action='unlock')]"
	);

	const editedRelatedItems = ArasModules.xml.selectNodes(
		item,
		"Relationships/Item/related_id/Item[@isEditState='1' or (@action='add' and @isTemp='1')]"
	);
	const editedRelatedItemsIds = editedRelatedItems
		.map((item) => item.getAttribute('id'))
		.join();
	const idCondition = editedRelatedItemsIds
		? `not(contains('${editedRelatedItemsIds}', @id)) and `
		: '';
	const existChangesCondition = `(@isEditState='1' or @isTemp='1' or @isDirty='1')`;
	const allEditedAndNewItems = ArasModules.xml.selectNodes(
		item,
		`descendant::Item[${idCondition}@action!='skip' and @action!='get' and ${existChangesCondition}]`
	);

	return aras.saveItemExAsync(item).then(function (res) {
		if (isSpinnerNecessary) {
			aras.browserHelper.toggleSpinner(document, false);
		}
		if (!res) {
			return false;
		}
		onAfterCommandRun('save');
		if (!options.skipReshow && itemTypeName !== 'SelfServiceReport') {
			aras.uiReShowItemEx(itemID, res, viewMode);
		} else {
			window.item = res;
			const newItemId = res.id;
			const oldItemId = window.itemID;
			if (oldItemId !== newItemId) {
				const itemWindow = aras.uiFindWindowEx(oldItemId);
				aras.uiUnregWindowEx(oldItemId);
				aras.uiRegWindowEx(newItemId, itemWindow);
				window.itemID = newItemId;
			}
		}

		let requestAml = '';
		let lastVersionItems = [];
		let relatedItemIdsToReshow = {};
		const store = aras.getMainWindow().store;
		const infoForUpdateEditableItems = [];
		editedRelatedItems.forEach(function (editedRelatedItem) {
			const isNewItem = aras.isNew(editedRelatedItem);
			const relatedItemType = editedRelatedItem.getAttribute('type');
			const relatedItemId = editedRelatedItem.getAttribute('id');
			const relatedItemConfigId = aras.getItemProperty(
				editedRelatedItem,
				'config_id',
				relatedItemId
			);
			const itemTypeItem = aras.getItemTypeForClient(relatedItemType, 'name');
			const isVersionableIT =
				aras.getItemProperty(itemTypeItem.node, 'is_versionable') === '1';
			const relatedItemWindow = aras.uiFindWindowEx(relatedItemId);
			const relationshipItemNode = editedRelatedItem.parentNode.parentNode;
			const isDeletedRelationshipItem =
				relationshipItemNode.getAttribute('action') === 'delete';

			let lastItemVersion = aras.newIOMItem(
				relatedItemType,
				isVersionableIT ? 'getItemLastVersion' : 'get'
			);
			lastItemVersion.setAttribute('id', relatedItemId);
			requestAml += lastItemVersion.node.xml;

			if (relatedItemWindow && relatedItemConfigId) {
				relatedItemIdsToReshow[relatedItemConfigId] = relatedItemId;
			}

			if (
				isSaveCommand &&
				(isVersionableIT || isDeletedRelationshipItem || isNewItem)
			) {
				const relationshipItemType = relationshipItemNode.getAttribute('type');
				infoForUpdateEditableItems.push({
					configId: relatedItemConfigId,
					itemId: relatedItemId,
					relationshipItemType,
					actionType:
						isDeletedRelationshipItem || isNewItem ? 'delete' : 'replace'
				});
			}

			store.boundActionCreators.deleteItemLocalChangesRecord(
				relatedItemType,
				relatedItemId
			);
		});

		if (requestAml !== '') {
			const newItemIdResult = aras
				.soapSend('ApplyAML', '<AML>' + requestAml + '</AML>')
				.getResult();

			lastVersionItems = lastVersionItems.concat(
				ArasModules.xml.selectNodes(newItemIdResult, 'Item')
			);
		}

		lastVersionItems.forEach(function (itemLastVersion) {
			const relatedItemId = itemLastVersion.getAttribute('id');
			const relatedItemConfigId = aras.getItemProperty(
				itemLastVersion,
				'config_id',
				relatedItemId
			);

			const relatedItemType = itemLastVersion.getAttribute('type');
			const itemTypeItem = aras.getItemTypeForClient(relatedItemType, 'name');
			const isDependentIT =
				aras.getItemProperty(itemTypeItem.node, 'is_dependent') === '1';
			const isVersionableIT =
				aras.getItemProperty(itemTypeItem.node, 'is_versionable') === '1';
			const itemPreviousVersion = editedRelatedItems.find(
				(oldItem) =>
					(aras.getItemProperty(oldItem, 'config_id') || oldItem.id) ===
					relatedItemConfigId
			);
			const isUnlockedItem =
				itemPreviousVersion.getAttribute('unlock') === '1' ||
				itemPreviousVersion.getAttribute('action') === 'unlock';

			if (isVersionableIT) {
				aras.fireEvent('ItemVersion', {
					itemPreviousVersion,
					itemLastVersion
				});
			} else if (isUnlockedItem) {
				aras.fireEvent('ItemLock', {
					itemID: itemLastVersion.getAttribute('id'),
					itemNd: itemLastVersion,
					newLockedValue: aras.isLocked(itemLastVersion)
				});
			}

			aras.updateInCache(itemLastVersion);

			aras.setItemEditStateEx(
				itemLastVersion,
				isDependentIT || isUnlockedItem
					? false
					: aras.isLockedByUser(itemLastVersion)
			);

			if (isSaveCommand) {
				infoForUpdateEditableItems
					.filter((itemInfo) => itemInfo.configId === relatedItemConfigId)
					.forEach((itemInfo) => {
						infoForUpdateEditableItems.splice(
							infoForUpdateEditableItems.indexOf(itemInfo),
							1
						);
						const editableItems =
							storageValue[itemInfo.relationshipItemType] || [];
						if (editableItems.includes(itemInfo.itemId)) {
							const args = [editableItems.indexOf(itemInfo.itemId), 1];
							if (itemInfo.actionType === 'replace') {
								args.push(relatedItemId);
							}
							editableItems.splice(...args);
						}
					});
			}

			const oldIdToReshow = relatedItemIdsToReshow[relatedItemConfigId];
			if (aras.uiFindWindowEx(oldIdToReshow)) {
				aras.uiReShowItemEx(oldIdToReshow, aras.getFromCache(relatedItemId));
			}
		});

		if (isSaveCommand) {
			Object.keys(storageValue).forEach((relationshipTypeName) => {
				const items = storageValue[relationshipTypeName];
				if (!items.length) {
					delete storageValue[relationshipTypeName];
				}
			});

			sessionStorage.setItem(itemConfigId, JSON.stringify(storageValue));
		} else {
			sessionStorage.setItem(itemConfigId, '{}');
		}

		allEditedAndNewItems.forEach(function (item) {
			const itemType = item.getAttribute('type');
			const itemId = item.getAttribute('id');
			const isEditState = item.getAttribute('isEditState') === '1';
			const itemAction = item.getAttribute('action');
			if (
				isEditState &&
				!['delete', 'unlock'].includes(itemAction) &&
				item.getAttribute('unlock') !== '1'
			) {
				store.boundActionCreators.resetItemLocalChangesRecord(itemType, itemId);
				return;
			}
			store.boundActionCreators.deleteItemLocalChangesRecord(itemType, itemId);
		});

		const topWin = aras.getMainWindow();
		const tabsContainer = topWin.mainLayout.tabsContainer;
		const tabbar = tabsContainer.getTabbarByTabId(window.name);
		if (tabbar) {
			tabbar.setTitleTabWithFrame(window);
		}

		if (itemTypeName === 'Preference') {
			topWin.mainLayout.observer.notify('UpdatePreferences');
		}
		topWin.mainLayout.updateCuiLayoutOnItemChange(itemTypeName);
		return true;
	});
}

function saveAndUnlock() {
	// IR-003016 Run Report method fails
	if (itemTypeName === 'Report') {
		clearJavascriptInReport(item);
	}

	const message = onBeforeCommandRun('save');
	if (message && typeof message === 'string') {
		aras.AlertError(message);
		return Promise.resolve(false);
	}

	const isSpinnerNecessary =
		item.selectNodes(
			'descendant-or-self::Item[@type="File" and (@action="add" or @action="update")]'
		).length > 0;
	let spinner;
	if (isSpinnerNecessary) {
		spinner = document.getElementById('dimmer_spinner');
		spinner.classList.remove('aras-hide');
	}
	const cachedDoGetItem = item.getAttribute('doGetItem');
	//to improve perfomance of save operation, because results of "get" will be discarded by "unlock" below.
	item.setAttribute('doGetItem', '1');
	return aras.saveItemExAsync(item, true, null, false).then(function (res) {
		if (isSpinnerNecessary) {
			spinner.classList.add('aras-hide');
		}
		if (!res) {
			if (cachedDoGetItem === null) {
				item.removeAttribute('doGetItem');
			} else {
				item.setAttribute('doGetItem', cachedDoGetItem);
			}
			return false;
		}

		res.setAttribute('levels', '-1'); //invalidates cached item because there was no "get"

		onAfterCommandRun('save');

		const resItemId = res.getAttribute('id');
		res = aras.getItemById$skipServerCache(
			itemTypeName,
			resItemId,
			0,
			'locked_by_id'
		);
		if (!res) {
			return false;
		}
		res.setAttribute('levels', '-1'); //invalidates cached item because there was no "get"

		res = aras.unlockItemEx(res, false);
		if (!res) {
			return false;
		}
		window.item = res;
		updateItemsGrid(res);

		const mainWindow = window.isTearOff ? openerMainWnd : mainWnd;
		if (itemTypeName === 'ItemType') {
			mainWindow.updateTree(itemID.split(';'));
		} else if (itemTypeName === 'Preference' && mainWindow.mainLayout) {
			mainWindow.mainLayout.observer.notify('UpdatePreferences');
		}
		mainWindow.mainLayout.updateCuiLayoutOnItemChange(itemTypeName);
		return true;
	});
}

function onDoneCommand() {
	onBeforeCommandRun('done');

	const editedRelatedItems = ArasModules.xml.selectNodes(
		item,
		"Relationships/Item/related_id/Item[@isEditState='1']"
	);
	editedRelatedItems.forEach(function (editedRelatedItem) {
		if (editedRelatedItem.hasAttribute('unlock')) {
			return;
		}

		if (!editedRelatedItem.getAttribute('action')) {
			editedRelatedItem.setAttribute('action', 'unlock');
		} else {
			editedRelatedItem.setAttribute('unlock', '1');
		}
	});

	const saveOptions = { skipReshow: itemTypeName === 're_Requirement' };

	return onSaveCommand(saveOptions).then(function (res) {
		const commandResult = res ? onUnlockCommand() : false;
		onAfterCommandRun('done');
		return commandResult;
	});
}

function onSaveUnlockAndExitCommand() {
	return saveAndUnlock().then(function (res) {
		if (window.isTearOff && res) {
			window.close();
		}
		return res;
	});
}

// IR-003016 Run Report method fails
function clearJavascriptInReport(item) {
	var tmpDOM = aras.createXMLDocument();
	var xsl_stylesheet = aras.getItemProperty(item, 'xsl_stylesheet');
	if (xsl_stylesheet != '') {
		tmpDOM.loadXML(xsl_stylesheet);
		var node = tmpDOM.selectSingleNode('//*[@implements-prefix="aras"]');
		var isModify = false;
		node = tmpDOM.selectSingleNode("//script[@userData='Tool Logic']");
		if (node) {
			node.parentNode.removeChild(node);
			isModify = true;
		}
		if (isModify) {
			aras.setItemProperty(item, 'xsl_stylesheet', tmpDOM.xml);
		}
	}
}

function onRevisionsCommand() {
	var param = new Object();
	param.aras = aras;
	param.itemID = itemID;
	param.itemTypeName = itemTypeName;

	var dlgWidth = 500;
	var itemTypeID = aras.getItemTypeId(itemTypeName);
	var colWidths = aras.getPreferenceItemProperty(
		'Core_ItemGridLayout',
		itemTypeID,
		'col_widths',
		null
	);
	if (colWidths) {
		dlgWidth = 0;
		var colWidthsArr = colWidths.split(';');
		for (var i = 0; i < colWidthsArr.length; i++) {
			dlgWidth += parseInt(colWidthsArr[i]);
		}
	}

	param.dialogWidth = dlgWidth;
	param.resizable = true;
	param.type = 'RevisionsDialog';
	param.title = aras.getResource('', 'revisiondlg.item_versions');

	window.ArasModules.Dialog.show('iframe', param);
	return true;
}

function onPromoteCommand() {
	var param = {
		item: item,
		aras: aras,
		title: aras.getResource(
			'',
			'promotedlg.propmote',
			aras.getKeyedNameEx(item)
		),
		dialogWidth: 400,
		dialogHeight: 300,
		resizable: true,
		content: 'promoteDialog.html'
	};
	var oldID = itemID;

	(mainWnd.main || mainWnd).ArasModules.Dialog.show(
		'iframe',
		param
	).promise.then(function (res) {
		if (typeof res == 'string' && res == 'null') {
			deleteRowFromItemsGrid(oldID);

			if (window.isTearOff) {
				window.close();
			} else {
				mainWnd.work.location.replace(
					'itemsGrid.html?itemtypeID=' + window.itemType.getAttribute('id')
				);
			}
			return;
		}

		if (!res) {
			return;
		}

		if (isVersionableIT) {
			itemID = res.getAttribute('id');
			if (oldID != itemID) {
				deleteRowFromItemsGrid(itemID);
				addRowToItemsGrid(res);
				if (window.isTearOff) {
					window.close();
				}
			}
		}
		if (window.isTearOff) {
			updateItemsGrid(res);
		}
		isEditMode = false;
	});
}

function onPrintCommand() {
	function GetFormPrintPreviewNode(formNode) {
		function f() {
			// delete window border
			var topWindow = aras.getMostTopWindowWithAras(window);
			var mainDiv = topWindow.document.getElementsByClassName(
				'dijitDialogTitleBar'
			)[0];
			if (mainDiv) {
				mainDiv.parentElement.style.setProperty('border', 'none');
			}

			mainDiv = topWindow.document.getElementsByClassName(
				'dijitDialogPaneContent'
			)[0];
			if (mainDiv) {
				mainDiv.style.setProperty('border-top', 'none');
				mainDiv.style.setProperty('margin-top', '3px');
			}

			setTimeout(function () {
				if (typeof onbeforeprint$user$handler == 'function') {
					onbeforeprint$user$handler();
				}

				// printing
				require(['Printing/Scripts/Classes/PrintingToPdf'], function (pdf) {
					pdf.printToPdf(window, 'print_result.pdf');

					if (typeof onafterprint$user$handler == 'function') {
						onafterprint$user$handler();
					}
				});
			}, 300);
		}

		var fakeFormEvent = new Item('Form Event', '');
		fakeFormEvent.setID('fakeFormEvent_45A45476CCFE4836AC1F2A5AC94D75E1');
		fakeFormEvent.setProperty('form_event', 'onformpopulated');
		fakeFormEvent.setProperty('source_id', fakeFormEvent);
		var fakeFormEventMethod = new Item('Method', '');
		fakeFormEventMethod.setID(
			'fakeFormEventMethod_45A45476CCFE4836AC1F2A5AC94D75E2'
		);
		fakeFormEventMethod.setProperty('method_type', 'JavaScript');
		fakeFormEventMethod.setProperty(
			'name',
			'fakeFormEventMethod_45A45476CCFE4836AC1F2A5AC94D75E2'
		);
		fakeFormEventMethod.setProperty('method_code', f.toString() + ' f();');
		fakeFormEvent.setPropertyItem('related_id', fakeFormEventMethod);

		formNode = formNode.cloneNode(true);
		var rels = formNode.selectSingleNode('Relationships');
		rels.appendChild(rels.ownerDocument.importNode(fakeFormEvent.node, true));
		return formNode;
	}

	function showPrintForm(formNode, newItem) {
		var param = {};
		param.title = 'PrintForm';
		param.formType = 'printForm';
		param.aras = this.aras;
		param.isEditMode = false;
		param.item = new Item('tmp', 'tmp');
		param.item.loadAML(newItem.xml);
		param.formNd = GetFormPrintPreviewNode(formNode);
		param.dialogHeight = 400;
		param.dialogWidth = 800;
		param.content = 'ShowFormAsADialog.html';
		mainWnd.ArasModules.Dialog.show('iframe', param);
	}

	var fileMenu = window.document.getElementById('file_menu_dropdown');
	if (fileMenu) {
		fileMenu.style.display = 'none';
	}

	var frame = findInstanceFrame();
	var printId = aras.uiGetFormID4ItemEx(item, 'print');
	var defaultId = aras.uiGetFormID4ItemEx(item, 'default');
	var formNode = aras.uiGetForm4ItemEx(item, 'print');
	var itemTypeName = item.getAttribute('type');
	aras.saveUICommandHistoryIfNeed(
		itemTypeName,
		item,
		'print',
		new Array(aras.getItemProperty(formNode, 'name'))
	);

	if (!printId || printId === defaultId) {
		if (frame && frame.document.body.onbeforeprint) {
			var f = frame.document.body.onbeforeprint;
			f();
		}

		require(['Printing/Scripts/Classes/PrintingToPdf'], function (pdf) {
			var itLabel = aras.getItemProperty(itemType, 'label');
			if (!itLabel) {
				itLabel = aras.getItemProperty(itemType, 'name');
			}
			var itemLabel = aras.getItemProperty(item, 'keyed_name');
			if (!itemLabel) {
				itemLabel = aras.getItemProperty(item, 'id');
			}

			pdf.printToPdf(frame, itLabel + '-' + itemLabel + '.pdf');

			if (frame && frame.document.body.onafterprint) {
				var onAfterPrintEvent = frame.document.body.onafterprint;
				onAfterPrintEvent();
			}
		});
	} else {
		showPrintForm(formNode, item);
	}
	return true;
}

function onExport2OfficeCommand(targetAppType) {
	if (item) {
		var frm = document.frames['relationships']
				? document.frames['relationships'].frameElement
				: null,
			gridXmlCallback = '',
			tabName;
		if (frm) {
			frm = frm.contentWindow.iframesCollection[frm.contentWindow.currTabID];
			if (frm && frm.contentWindow.onExport2OfficeCommand) {
				frm.contentWindow.onExport2OfficeCommand(targetAppType);
				return;
			} else if (frm && frm.contentWindow.grid) {
				var isExport2Excel =
					targetAppType === 'export2Excel' || targetAppType === 'excel';
				if (isExport2Excel && document.frames['relationships'].currTabID) {
					tabName = aras.getRelationshipTypeName(
						document.frames['relationships'].currTabID
					);
				}
				gridXmlCallback = function () {
					if (frm.contentWindow.grid.getXML) {
						return frm.contentWindow.grid.getXML(isExport2Excel);
					}
					return '';
				};
			}
		}
		aras.export2Office(
			gridXmlCallback,
			targetAppType,
			item,
			itemTypeName,
			tabName
		);
	}
}

function onOpenCommand() {
	aras.uiShowItemEx(item, 'openFile');
	return true;
}

function onDownloadCommand() {
	if (itemTypeName !== 'File') {
		return false;
	}
	return aras.downloadFile(item);
}

function onRefresh() {
	onBeforeCommandRun('refresh');

	const configId = aras.getItemProperty(window.item, 'config_id');
	let isCurrentItem = aras.newIOMItem(itemTypeName, 'get');
	isCurrentItem.setProperty('config_id', configId);
	isCurrentItem = isCurrentItem.apply();
	let itemLatestVersion = isCurrentItem.node;
	const mainWindow = aras.getMainWindow();
	const tabsContainer = mainWindow.mainLayout.tabsContainer;
	const currentTabbar = tabsContainer.getTabbarByTabId(window.name);

	if (itemLatestVersion) {
		const latestItemId = itemLatestVersion.getAttribute('id');
		const latestItemWindow =
			isVersionableIT &&
			latestItemId !== itemID &&
			aras.uiFindWindowEx(latestItemId);

		if (latestItemWindow) {
			const latestItemWindowId = latestItemWindow.name;
			const latestItemWindowTabbar = tabsContainer.getTabbarByTabId(
				latestItemWindowId
			);
			if (latestItemWindowTabbar) {
				latestItemWindowTabbar.selectTab(latestItemWindowId);
			}
			if (currentTabbar) {
				currentTabbar.closeTabs([window.name]);
			}
		} else {
			const isLocked = aras.getItemProperty(itemLatestVersion, 'locked_by_id');
			const isLockedByUser = aras.isLockedByUser(itemLatestVersion);
			const isLockRequired =
				!isLocked && (isEditMode || aras.isLockedByUser(item));
			const needToSetEditMode = isEditMode && isLockedByUser;

			if (isEditMode) {
				const hasSomeDirtyItem = aras.isDirtyEx(window.item);
				const storeActions = aras.getMainWindow().store.boundActionCreators;
				const relationshipsItems =
					"Relationships/Item[@action='update' or @action='add' or @action='delete']";
				const relationshipsRelatedItems =
					"Relationships/Item/related_id/Item[@action='update' or @action='add' or @isEditState='1']";

				const editedRelationshipItems = ArasModules.xml.selectNodes(
					item,
					`${relationshipsItems}|${relationshipsRelatedItems}`
				);
				storeActions.deleteItemLocalChangesRecord(
					itemLatestVersion.getAttribute('type'),
					itemID
				);
				editedRelationshipItems.forEach(function (item) {
					const itemType = item.getAttribute('type');
					const itemId = item.getAttribute('id');
					if (hasSomeDirtyItem && aras.isTempEx(item)) {
						storeActions.deleteItemLocalChangesRecord(itemType, itemId);
						return;
					}

					const parentNode = item.parentNode;
					if (
						parentNode.nodeName === 'related_id' &&
						!aras.isNew(parentNode.parentNode)
					) {
						storeActions.resetItemLocalChangesRecord(itemType, itemId);
						return;
					}

					storeActions.deleteItemLocalChangesRecord(itemType, itemId);
				});
			}

			if (latestItemId !== itemID) {
				// if item updated to the newest version we can drop old item data
				aras.itemsCache.deleteItem(itemID);
			}

			aras.itemsCache.updateItem(itemLatestVersion, false);
			itemLatestVersion = aras.itemsCache.getItem(latestItemId);

			const previousVersionItemId = window.itemID;
			window.setItem(itemLatestVersion);

			if (isLockRequired) {
				this.onLockCommand({ setEditMode: isEditMode });
			} else if (needToSetEditMode) {
				window.setEditMode();
				aras.setItemEditStateEx(itemLatestVersion, true);
			} else {
				aras.uiReShowItemEx(previousVersionItemId, itemLatestVersion, viewMode);
			}
		}
	} else {
		aras.uiReShowItemEx(itemID, item, viewMode);
	}

	if (currentTabbar) {
		currentTabbar.setTitleTabWithFrame(window);
	}

	onAfterCommandRun('refresh');
}

function updateMenu() {
	if (menuFrame.populateAccessMenuLazyStart) {
		menuFrame.populateAccessMenuLazyStart();
	}
}

function onCopy2clipboardCommand() {
	if (this.menu && this.menu.copyTreeNode) {
		this.menu.copyTreeNode();
		return;
	}
	var itemArr = new Array();
	var itemID = item.getAttribute('id');
	var itemTypeName = item.getAttribute('type');
	var clItem = aras.copyRelationship(itemTypeName, itemID);
	itemArr.push(clItem);

	aras.clipboard.copy(itemArr);
	updateMenuState();
}

function onPasteCommand() {
	var relationshipFrame = findCurrentRelationshipsTab();

	if (relationshipFrame && relationshipFrame.onPaste) {
		relationshipFrame.onPaste();
	} else {
		var itemArr = aras.clipboard.paste(),
			i;

		if (itemArr.length) {
			for (i = 0; i < itemArr.length; i++) {
				var clipboardItem = itemArr[i],
					RelType_Nm = clipboardItem.relationship_itemtype,
					RelType_Nd = aras.getItemFromServerByName(
						'RelationshipType',
						RelType_Nm,
						'copy_permissions,create_related'
					).node,
					as_is = aras.getItemProperty(RelType_Nd, 'copy_permissions') == '1',
					as_new = aras.getItemProperty(RelType_Nd, 'create_related') == '1',
					relNd = aras.pasteRelationship(
						item,
						clipboardItem,
						as_is,
						as_new,
						RelType_Nm
					);

				if (!relNd) {
					aras.AlertError(aras.getResource('', 'itemsgrid.pasting_failed'));
					return;
				}
			}

			aras.AlertSuccess(aras.getResource('', 'itemsgrid.pasting_success'));
			onRefresh();
			updateItemsGrid(item);
		}
	}
}

function onPaste_specialCommand(targetRelationshipTN, targetRelatedTN) {
	var arg = {
		aras: aras,
		title: aras.getResource('', 'clipboardmanager.clipboard_manager'),
		itemsArr: [window.item],
		srcItemTypeId: itemTypeID,
		targetRelationshipTN: targetRelationshipTN,
		targetRelatedTN: targetRelatedTN,
		dialogWidth: 700,
		dialogHeight: 450,
		content: 'ClipboardManager.html'
	};
	mainWnd.ArasModules.Dialog.show('iframe', arg).promise.then(function (
		result
	) {
		if (result && result.ids) {
			var clipboardItems = aras.clipboard.clItems,
				clipboardItem,
				i;

			for (i = 0; i < result.ids.length; i++) {
				clipboardItem = clipboardItems[result.ids[i]];

				if (
					!aras.pasteRelationship(
						item,
						clipboardItem,
						result.as_is,
						result.as_new,
						targetRelationshipTN,
						targetRelatedTN
					)
				) {
					aras.AlertError(aras.getResource('', 'itemsgrid.pasting_failed'));
					return;
				}
			}
			aras.AlertSuccess(aras.getResource('', 'itemsgrid.pasting_success'));

			onRefresh();
			updateItemsGrid(item);
		}
	});
}

function onShow_clipboardCommand() {
	var arg = {
		aras: aras,
		title: aras.getResource('', 'clipboardmanager.clipboard_manager'),
		srcItemTypeId: itemTypeID,
		dialogWidth: 700,
		dialogHeight: 450,
		content: 'ClipboardManager.html'
	};
	mainWnd.ArasModules.Dialog.show('iframe', arg).promise.then(function (res) {
		if (res) {
			onRefresh();
			if (mainWnd.main && mainWnd.menu) {
				mainWnd.menu.setControlEnabled(
					'show_clipboard',
					!aras.clipboard.isEmpty()
				);
			}
		}
	});
}

function getDefaultOptions(itemId, itemTypeName) {
	const defaultItemClassification = '';
	if (!itemId) {
		return {
			item_classification: defaultItemClassification
		};
	}

	const item = window.getItem();
	const itemClassification = aras.getItemProperty(item, 'classification');
	return {
		itemId: itemId,
		itemTypeName: itemTypeName,
		item_classification: itemClassification || defaultItemClassification
	};
}
