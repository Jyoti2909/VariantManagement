/*
Used by MainGridFactory.js
*/
function ItemGrid() {
	ItemGrid.superclass.constructor();
}

inherit(ItemGrid, BaseItemTypeGrid);

ItemGrid.prototype.setMenuState = function ItemGrid_setMenuState(rowId, col) {
	if (!window.currQryItem) {
		return;
	}

	const queryItem = window.currQryItem.getResult();
	const itemNode =
		queryItem.selectSingleNode(`Item[@id="${rowId}"]`) ||
		aras.getFromCache(rowId);

	if (!itemNode || !window.currItemType) {
		return;
	}

	let buttonStates = {
		'com.aras.innovator.cui_default.pmig_Save As': false,
		'com.aras.innovator.cui_default.pmig_Version': false,
		'com.aras.innovator.cui_default.pmig_Properties': false
	};
	const selectedItemIds = grid.getSelectedItemIds();
	const isOnlyOneItemSelected = selectedItemIds.length === 1;

	if (isOnlyOneItemSelected) {
		const isSaveAsVisible =
			!isFunctionDisabled(window.itemTypeName, 'Save As') &&
			window['can_addFlg'];
		const isVersionVisible =
			!isFunctionDisabled(window.itemTypeName, 'Version') &&
			window.isManualyVersionableIT &&
			!aras.isTempEx(itemNode) &&
			(!aras.getItemProperty(itemNode, 'locked_by_id') ||
				aras.isLockedByUser(itemNode));

		buttonStates = {
			'com.aras.innovator.cui_default.pmig_Save As': isSaveAsVisible,
			'com.aras.innovator.cui_default.pmig_Version': isVersionVisible,
			'com.aras.innovator.cui_default.pmig_Properties': true
		};
	}

	Object.assign(window.popupMenuState, buttonStates);
};

ItemGrid.prototype.onLockCommand = function ItemGrid_onLockCommand(itemIDs) {
	if (aras.isPolymorphic(currItemType)) {
		aras.AlertError(
			aras.getResource('', 'itemsgrid.poly_item_cannot_be_locked_from_location')
		);
		return false;
	}
	return ItemGrid.superclass.onLockCommand(itemIDs);
};

ItemGrid.prototype.onUnlockCommand = function ItemGrid_onUnlockCommand(
	itemIDs
) {
	if (aras.isPolymorphic(currItemType)) {
		aras.AlertError(
			aras.getResource(
				'',
				'itemsgrid.poly_item_cannot_be_unlocked_from_location'
			)
		);
		return false;
	}
	return ItemGrid.superclass.onUnlockCommand(itemIDs);
};

ItemGrid.prototype.onEditCommand = function ItemGrid_onEditCommand(itemId) {
	if (aras.isPolymorphic(currItemType)) {
		aras.AlertError(
			aras.getResource(
				'',
				'itemsgrid.polyitem_cannot_be_edited_from_the_location'
			)
		);
		return false;
	}

	if (!itemId) {
		aras.AlertError(
			aras.getResource('', 'itemsgrid.select_item_type_first', itemTypeLabel)
		);
		return false;
	}

	if (execInTearOffWin(itemId, 'edit')) {
		return true;
	}

	if (itemTypeName === 'SelfServiceReport') {
		var existingWnd = aras.uiFindAndSetFocusWindowEx(aras.SsrEditorWindowId);
		if (existingWnd) {
			return existingWnd.showMultipleReportsError(itemId);
		}
	}

	var itemNode = aras.getItemById(itemTypeName, itemId, 0, undefined, '*'),
		notLocked;

	if (!itemNode) {
		if (itemTypeName == 'Form') {
			itemNode = aras.getItemFromServer(itemTypeName, itemId, 'locked_by_id')
				.node;
		}

		if (!itemNode) {
			aras.AlertError(
				aras.getResource('', 'itemsgrid.failed2get_itemtype', itemTypeLabel)
			);
			return false;
		}
	}

	notLocked =
		!aras.isTempEx(itemNode) &&
		aras.getItemProperty(itemNode, 'locked_by_id') == '';
	if (notLocked) {
		if (!aras.lockItemEx(itemNode)) {
			return false;
		}

		itemNode = aras.getItemById(itemTypeName, itemId, 0);
		onSelectItem(itemId);
	}

	aras.uiShowItemEx(
		itemNode,
		aras.getPreferenceItemProperty('Core_GlobalLayout', null, 'core_view_mode')
	);
};

ItemGrid.prototype.onDoubleClick = function ItemGrid_onDoubleClick(
	itemId,
	altMode
) {
	const isDiscover = grid._grid.rows.get(itemId, '@aras.discover_only');
	if (!isDiscover || !isFunctionDisabled(itemTypeName, 'DoubleClick')) {
		aras.uiShowItem(itemTypeName, itemId, null, altMode);
	}
};

ItemGrid.prototype.onClick = function ItemGrid_onClick(itemId) {
	previewPane.showFormByItemId(itemId, itemTypeName);
};

ItemGrid.prototype.onMassPromote = function ItemGrid_onMassPromote(itemIds) {
	if (typeof itemIds === 'undefined' || itemIds === null) {
		return;
	}

	var newItemNd = aras.newItem('mpo_MassPromotion');
	aras.itemsCache.addItem(newItemNd);

	aras.setItemProperty(newItemNd, 'promote_type', window.itemTypeName);
	var relationships = newItemNd.ownerDocument.createElement('Relationships');
	var queryItems = currQryItem.getResult();

	for (var i = 0; i < itemIds.length; i++) {
		var selectedItem = aras.getFromCache(itemIds[i]);
		if (!selectedItem) {
			var itemId = itemIds[i];
			var query = 'Item[@id="' + itemId + '"]';
			selectedItem = queryItems.selectSingleNode(query);
		}
		if (selectedItem) {
			var cloned = selectedItem.cloneNode(true);
			relationships.appendChild(cloned);
		}
	}
	newItemNd.appendChild(relationships);

	aras.uiShowItemEx(newItemNd, 'new');
};
