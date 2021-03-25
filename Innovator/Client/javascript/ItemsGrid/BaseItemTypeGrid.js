/*
Used by MainGridFactory.js
*/

function BaseItemTypeGrid() {
	var topWindow = aras.getMostTopWindowWithAras(window);
	this.cui = topWindow.cui;
}

BaseItemTypeGrid.prototype.onInitialize = function BaseItemTypeGrid_onInitialize() {
	if (!this.cui) {
		var topWindow = aras.getMostTopWindowWithAras(window);
		this.cui = topWindow.cui;
	}

	currItemType = aras.getItemTypeDictionary(aras.getItemTypeName(itemTypeID));
	if (!currItemType || currItemType.isError()) {
		currItemType = null;
		return false;
	}

	currItemType = currItemType.node;
	this._loadingItemTypesPromise = this._loadItemTypesDefinitions(currItemType);
	varName_queryDate = 'IT_' + itemTypeID + '_queryDate';
	visiblePropNds = [];

	if (aras.getLanguageDirection() === 'rtl') {
		document.documentElement.dir = 'rtl';
	}

	itemTypeName = aras.getItemProperty(currItemType, 'name');
	itemTypeLabel = aras.getItemProperty(currItemType, 'label');
	if (!itemTypeLabel) {
		itemTypeLabel = itemTypeName;
	}

	isVersionableIT = aras.getItemProperty(currItemType, 'is_versionable') == '1';
	use_src_accessIT =
		aras.getItemProperty(currItemType, 'use_src_access') == '1';
	isManualyVersionableIT =
		isVersionableIT &&
		aras.getItemProperty(currItemType, 'manual_versioning') == '1';
	isRelationshipIT =
		aras.getItemProperty(currItemType, 'is_relationship') == '1';
	can_addFlg = aras.getPermissions('can_add', itemTypeID);

	visiblePropNds = aras.getvisiblePropsForItemType(currItemType);
	aras.uiInitItemsGridSetups(currItemType, visiblePropNds);

	var gridSetups = aras.sGridsSetups[itemTypeName];
	if (!gridSetups) {
		return false;
	}

	gridSetups.query = aras.newQryItem(itemTypeName);
	currQryItem = gridSetups.query;
	currQryItem.setPage(1);
	currQryItem.removeAllCriterias();
	this.initMenuVariables();

	return true;
};

BaseItemTypeGrid.prototype.initMenuVariables = function BaseItemTypeGrid_initMenuVariables() {
	popupMenuState = {};
};

BaseItemTypeGrid.prototype.onLockCommand = function BaseItemTypeGrid_onLockCommand(
	itemIds = grid.getSelectedItemIDs()
) {
	const realItemTypeNames = getRealItemTypeNames(itemIds);

	for (let i = 0; i < itemIds.length; i++) {
		const itemId = itemIds[i];
		const realItemTypeName = realItemTypeNames[itemId];

		if (execInTearOffWin(itemId, 'lock') || !realItemTypeName) {
			continue;
		}

		focus();

		aras.lockItem(itemId, realItemTypeName);
	}

	onSelectItem(itemIds[0]);
};

BaseItemTypeGrid.prototype.updateItem = function BaseItemTypeGrid_updateItem(
	oldItem,
	newItem
) {
	const qry = currQryItem.getResult();
	const oldItemId = oldItem.getAttribute('id');
	const newItemId = newItem.getAttribute('id');
	const isItemIdUpdated = oldItemId !== newItemId;
	const oldItemKeyedName = aras.getItemProperty(oldItem, 'keyed_name');
	const newItemKeyedName = aras.getItemProperty(newItem, 'keyed_name');
	const isKeyedNameUpdated = newItemKeyedName !== oldItemKeyedName;

	if (!qry || (!isKeyedNameUpdated && !isItemIdUpdated)) {
		return;
	}

	const type = oldItem.getAttribute('type');
	const typeId = oldItem.getAttribute('typeId');

	const polyItems = aras.getPolymorphicsWhereUsedAsPolySource(typeId);
	const typeCondition = polyItems.reduce(function (res, polyItem) {
		return res + " or @type='" + polyItem.name + "'";
	}, "@type='" + type + "'");

	const nodes = qry.selectNodes(
		'./Item/*[(' + typeCondition + ") and text()='" + oldItemId + "']"
	);

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		const idNode = node.parentNode.getAttribute('id');
		const indexColumn = grid.getColumnIndex(node.nodeName + '_D');
		if (idNode && indexColumn > -1) {
			const cell = grid.cells(idNode, indexColumn);
			if (isKeyedNameUpdated) {
				node.setAttribute('keyed_name', newItemKeyedName);
				cell.setValue(newItemKeyedName);
			}

			if (isItemIdUpdated) {
				node.text = newItemId;
				cell.setValue(newItemKeyedName);
				cell.setLink("'" + type + "','" + newItemId + "'");
			}
		}
	}
};

BaseItemTypeGrid.prototype.onUnlockCommand = function BaseItemTypeGrid_onUnlockCommand(
	itemIds = grid.getSelectedItemIDs()
) {
	const realItemTypeNames = getRealItemTypeNames(itemIds);
	const topWin = aras.getMostTopWindowWithAras(window);
	const dialogParams = {
		additionalButton: [
			{
				text: aras.getResource('', 'common.discard'),
				actionName: 'discard'
			}
		],
		okButtonText: aras.getResource('', 'common.save'),
		title: aras.getResource('', 'item_methods_ex.unsaved_changes'),
		buttonsOrdering: ['ok', 'discard', 'cancel']
	};
	const unlockItem = function (itemNode, saveChanges) {
		const unlockedItem = aras.unlockItemEx(itemNode, saveChanges);

		if (!unlockedItem) {
			return;
		}
		if (
			itemNode &&
			unlockedItem.getAttribute('id') != itemNode.getAttribute('id')
		) {
			deleteRowSearchGrids(itemNode);
		}
		itemNode = unlockedItem;
		if (itemNode) {
			updateRowSearchGrids(itemNode);
		}
	};
	const processItem = function (itemNode, realItemTypeName) {
		const isDirty = aras.isDirtyEx(itemNode);

		if (isDirty) {
			const dialogMessage = aras.getResource(
				'',
				'item_methods_ex.changes_not_saved'
			);
			return topWin.ArasModules.Dialog.confirm(
				dialogMessage,
				dialogParams
			).then(function (res) {
				if (!res || res === 'cancel') {
					return;
				}
				unlockItem(itemNode, res === 'ok');
			});
		} else {
			unlockItem(itemNode, false);
		}
	};
	let dlgPromise = Promise.resolve();

	for (let i = 0; i < itemIds.length; i++) {
		const itemId = itemIds[i];
		const realItemTypeName = realItemTypeNames[itemId];

		if (execInTearOffWin(itemId, 'unlock') || !realItemTypeName) {
			continue;
		}

		focus();

		const itemNode = aras.getItemById(realItemTypeName, itemId);
		if (!itemNode) {
			aras.unlockItem(itemId, realItemTypeName);
		} else {
			dlgPromise = dlgPromise.then(
				processItem.bind(this, itemNode, realItemTypeName)
			);
		}
	}

	return dlgPromise.then(function () {
		onSelectItem(itemIds[0]);
	});
};

BaseItemTypeGrid.prototype.showError = function BaseItemTypeGrid_showError(
	error
) {
	if (error) {
		aras.AlertError(error);
	}
	return !!error;
};

BaseItemTypeGrid.prototype.onLink = function BaseItemTypeGrid_onLink(
	typeName,
	id,
	altMode
) {
	var itemType = aras.getItemTypeDictionary(typeName, 'name');
	if (itemType && !itemType.isError() && aras.isPolymorphic(itemType.node)) {
		var item = aras.getItemById(typeName, id, 0);
		if (item.getAttribute('type') === typeName) {
			var polyTypeId = aras.getItemProperty(item, 'itemtype');
			typeName = aras.getItemTypeName(polyTypeId);
			aras.removeFromCache(item);
		}
	}
	aras.uiShowItem(typeName, id, null, altMode);
};

BaseItemTypeGrid.prototype.initCuiContextMenu = async function () {
	const control = new ArasModules.ContextMenu(document.body);
	const checkForRoot = ({ type, actionType, reportType }) => {
		return (
			actionType === 'itemtype' ||
			type === 'separator' ||
			type === 'userreport' ||
			(type === 'report' && reportType === 'itemtype')
		);
	};
	const prepareNoSelectionRoots = (roots, itemId, data) => {
		const item = data.get(itemId);
		const isRoot = checkForRoot(item);
		if (isRoot) {
			roots.push(itemId);
		}
		if (item.children) {
			return item.children.reduce(
				(roots, itemId) => prepareNoSelectionRoots(roots, itemId, data),
				roots
			);
		}
		return roots;
	};
	const itemTypeNode = window.currItemType;
	const isPolymorphic = aras.isPolymorphic(itemTypeNode);
	const itemTypesDefinitions = await this._loadingItemTypesPromise;
	const itemTypes = itemTypesDefinitions.reduce((itemTypes, itemType) => {
		itemTypes[itemType.name] = itemType;
		return itemTypes;
	}, {});

	const contextMenu = await window.cuiContextMenu(
		control,
		'PopupMenuItemGrid',
		{
			favorites: aras.getMainWindow().favorites,
			itemTypeId: itemTypeID,
			itemTypeName: itemTypeName,
			itemTypes,
			item_classification: '',
			isPolymorphic,
			eventState: {},
			rows: grid._grid.rows,
			selectedRowsIds: []
		}
	);

	grid.contexMenu_Experimental = contextMenu;
	grid.contextMenuData = control.data;

	// Reports should be on the menu's toplevel in
	// case when no items in the grid are selected
	const nativeShowMethod = contextMenu.show;
	const defaultRoots = control.roots;
	const noSelectionRoots = defaultRoots.reduce(
		(roots, itemId) => prepareNoSelectionRoots(roots, itemId, control.data),
		[]
	);

	contextMenu.show = (coords, args) => {
		const rowsSelected = Boolean(args.selectedRowsIds.length);
		const roots = rowsSelected ? defaultRoots : noSelectionRoots;
		control.roots = roots;
		return nativeShowMethod(coords, args);
	};
};

BaseItemTypeGrid.prototype.setMenuState = function () {};

BaseItemTypeGrid.prototype.getContextMenuEventState = function () {
	return {};
};

BaseItemTypeGrid.prototype.setContextMenuState = function () {
	grid.contextMenuData.forEach(function (item, key) {
		if (key in popupMenuState) {
			item.hidden = !popupMenuState[key];
		}
	});
};

BaseItemTypeGrid.prototype.onHeaderMenuClicked = function (
	commandId,
	rowsId,
	col
) {
	switch (commandId) {
		case 'hideCol':
			hideColumn(col);
			var columnSelectionBlock = document.getElementById('column_select_block');
			if (!columnSelectionBlock.classList.contains('hidden')) {
				var column = columnSelectionControl.columns[col];
				if (!column.hidden) {
					columnSelectionControl.toggleRowSelection(column.propertyId, true);
				}
			}
			break;
		case 'insertCol':
			showColumn(col);
			break;
	}
};

BaseItemTypeGrid.prototype._loadItemTypesDefinitions = function (itemType) {
	const loadingPromises = [
		aras.MetadataCacheJson.GetItemType(itemType.getAttribute('id'), 'id')
	];
	if (aras.isPolymorphic(itemType)) {
		aras.getMorphaeList(itemType).reduce((promises, { id }) => {
			promises.push(aras.MetadataCacheJson.GetItemType(id, 'id'));
			return promises;
		}, loadingPromises);
	}

	return Promise.all(loadingPromises);
};

// ================= Handlers for Actions AddItemsForChange (In Documents & Parts) =============================
function handlerForAddItemsForChange(cmdID) {
	var arasObj = aras;
	var itemIDs = grid.getSelectedItemIDs();

	var arr = cmdID.split(':');
	var act = arasObj.getItemFromServer(
		'Action',
		arr[1],
		'name,method(name,method_type,method_code),type,target,location,body,on_complete(name,method_type,method_code),item_query'
	);
	if (!act) {
		return;
	}

	var countStartDefaultAction = 0;
	function startDefaultAction() {
		countStartDefaultAction++;
		if (countStartDefaultAction == itemIDs.length) {
			//Start Action for last select Document(or Part). And Action show form for all selected Documents(or Parts)
			arasObj.invokeAction(act.node, arr[2], itemIDs[itemIDs.length - 1]);
		}
	}

	for (var i = 0; i < itemIDs.length; i++) {
		var itemID = itemIDs[i];
		var tempItem = aras.itemsCache.getItemByXPath(
			"//Item[@id='" + itemID + "' and (@isDirty='1' or @isTemp='1')]"
		);

		if (tempItem) {
			if (arasObj.confirm(arasObj.getResource('plm', 'changeitem.saveit'))) {
				arasObj.saveItemExAsync(tempItem).then(startDefaultAction);
			}
		} else {
			startDefaultAction();
		}
	}
}

//For Documents
window[
	'onAction:83FB72FC3E4D42B8B51BCD7F4194E527:B88C14B99EF449828C5D926E39EE8B89Command'
] = handlerForAddItemsForChange;
//For Parts
window[
	'onAction:83FB72FC3E4D42B8B51BCD7F4194E527:4F1AC04A2B484F3ABA4E20DB63808A88Command'
] = handlerForAddItemsForChange;
//For Cad
window[
	'onAction:83FB72FC3E4D42B8B51BCD7F4194E527:CCF205347C814DD1AF056875E0A880ACCommand'
] = handlerForAddItemsForChange;
// ================= Handlers for AddItemsForChange (In Documents & Parts) =============================
