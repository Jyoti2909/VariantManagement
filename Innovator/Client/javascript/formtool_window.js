// (c) Copyright by Aras Corporation, 2004-2009.
function initializeFormWindowFunctions(container) {
	const baseUpdateMenuState =
		container.updateMenuState || container.parent.updateMenuState;
	container.aras = container.aras || container.parent.aras;

	container.updateProvidedItemsGrid = function (itemsGrid, updatedItem) {
		if (!updatedItem || !window.isTearOff) {
			return false;
		}
		var updatedID = updatedItem.getAttribute('id');

		if (itemsGrid.isItemsGrid) {
			if (itemsGrid.itemTypeName == itemTypeName) {
				var grid = itemsGrid.grid;
				if (grid.getRowIndex(itemID) > -1) {
					var wasSelected = grid.getSelectedItemIds().indexOf(itemID) > -1;

					if (updatedID != itemID) {
						itemsGrid.deleteRow(item);
					}
					itemsGrid.updateRow(updatedItem);

					if (wasSelected) {
						if (updatedID == itemID) {
							itemsGrid.onSelectItem(itemID);
						} else {
							var currSel = grid.getSelectedId();
							//if (currSel)
							itemsGrid.onSelectItem(currSel);
						}
					} //if (wasSelected)
				}
			}
		} //if (itemsGrid.isItemsGrid)
	};

	container.deleteProvidedItemsGrid = function (itemsGrid) {
		if (itemsGrid.isItemsGrid && itemsGrid.itemTypeName === itemTypeName) {
			const grid = itemsGrid.grid;
			if (grid.getRowIndex(itemID) > -1) {
				grid.deleteRow(itemID);
			}
		}
	};

	container.updateMenuState = function () {
		baseUpdateMenuState();
		if (
			window.isTearOff &&
			document.frames.editor &&
			document.frames.editor.refreshMenuState
		) {
			document.frames.editor.refreshMenuState();
		}
	};

	container.getEditorFrame = function () {
		return window.isTearOff ? document.frames.editor : window;
	};

	container.onPurgeCommand = function () {
		return container.onPurgeDeleteCommand('purge');
	};

	container.onDeleteCommand = function (silentMode) {
		return container.onPurgeDeleteCommand('delete', silentMode);
	};

	container.onPurgeDeleteCommand = function (command, silentMode) {
		var res = false;

		if (command == 'purge') {
			res = aras.purgeItem('Form', itemID, false);
		} else {
			res = aras.deleteItem('Form', itemID, silentMode);
			if (
				res &&
				window.item.parentNode &&
				'related_id' == window.item.parentNode.nodeName
			) {
				var relNd = window.item.parentNode.parentNode;
				aras.deleteItemEx(relNd, true);
			}
		}

		if (res) {
			if (window.isTearOff) {
				container.deleteRowFunc();
				window.close();
			} else {
				var formIT = aras.getItemFromServerByName('ItemType', 'Form', 'id');
				if (formIT) {
					work.location.replace(
						'itemsGrid.html?itemtypeID=' + formIT.getAttribute('id')
					);
				} else {
					work.location.replace('../scripts/blank.html');
				}
			}
		}

		return { result: res ? 'Deleted' : 'Canceled' };
	};

	container.onExport2OfficeCommand = function (targetAppType) {
		aras.export2Office(
			function () {
				return '';
			},
			targetAppType,
			item
		);
		return true;
	};

	container.updateItemsGrid = container.aras.decorateForMultipleGrids(
		container.updateProvidedItemsGrid
	);
	container.deleteRowFunc = container.aras.decorateForMultipleGrids(
		container.deleteProvidedItemsGrid
	);
	container.windowReady = true;
}
