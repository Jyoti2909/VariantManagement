function initializeDirtyItemsList(container) {
	container.onButtonClick = function (btn) {
		const cmdID = btn.getId();
		container.processCommand(cmdID);
	};

	container.processCommand = function (cmdID) {
		const selectedIDs = grid.getSelectedItemIds();

		if (cmdID === 'save') {
			if (selectedIDs.length === 0) {
				topWnd.aras.AlertError(
					topWnd.aras.getResource('', 'dirtyitemslist.select_an_item_first')
				);
				return true;
			}

			processMultipleItems(selectedIDs);

			setTimeout(function () {
				processCommand('refresh');
			}, 1);
		} else if (cmdID === 'view' && !topWnd.arasTabs) {
			selectedIDs.forEach(function (itemId) {
				const item = topWnd.aras.itemsCache.getItemByXPath(
					"/Innovator/Items/Item[@id='" +
						itemId +
						"' and (@isDirty='1' or @isTemp='1' or .//Item/@isDirty='1' or .//Item/@isTemp='1')]"
				);

				topWnd.aras.uiShowItemEx(item, topWnd.aras.viewMode);
			});
			return true;
		} else if (cmdID === 'save_all') {
			processMultipleItems(
				Object.keys(allItems),
				'dirtyitemslist.failed_to_save_the'
			);

			setTimeout(function () {
				processCommand('refresh');
			}, 1);
		} else if (cmdID === 'refresh') {
			container.emptyGrid();
			container.populateGrid();
		} else if (cmdID === 'return') {
			dialogArguments.dialog.close();
		} else if (cmdID === 'logout') {
			topWnd.aras.setCommonPropertyValue('exitInProgress', true);
			topWnd.onLogoutCommand();
		}

		function processMultipleItems(itemIDs, errorMessage) {
			/*
			In this case we need to create chain of dialogs, when saving multiple items.
			Because saveItemEx doesn't return any error (it fires deep inside) we cant create chain simply, so
			on every iteration we check for dialog node, and add event listener for closing current displayed error.
			*/
			let errorChain;
			for (let i = 0; i < itemIDs.length; i++) {
				const itemID = itemIDs[i];
				if (errorChain) {
					errorChain.then(processItem.bind(this, itemID));
				} else {
					errorChain = processItem(itemID);
				}
			}

			function processItem(itemID) {
				const item = topWnd.aras.itemsCache.getItemByXPath(
					"/Innovator/Items/Item[@id='" +
						itemID +
						"' and (@isDirty='1' or @isTemp='1' or .//Item/@isDirty='1' or .//Item/@isTemp='1')]"
				);
				const saveItemResult = item && topWnd.aras.saveItemEx(item, false);
				if (saveItemResult) {
					aras.setItemEditStateEx(saveItemResult, true);
					if (aras.uiFindWindowEx(itemID)) {
						aras.uiReShowItemEx(itemID, saveItemResult);
					}
					return Promise.resolve();
				}

				const promise = new Promise(function (resolve) {
					const errorDialog = topWnd.document.querySelectorAll('dialog')[1];
					errorDialog.addEventListener('close', resolve);
				});
				if (errorMessage) {
					return promise.then(
						topWnd.aras.AlertError.bind(
							topWnd.aras,
							topWnd.aras.getResource(
								'',
								errorMessage,
								topWnd.aras.getKeyedNameEx(item)
							)
						)
					);
				} else {
					return promise;
				}
			}
		}
	};

	container.emptyGrid = function () {
		grid.RemoveAllRows();
		allItems = {};
	};

	container.populateGrid = function () {
		const items = topWnd.aras.getDirtyItems();

		const itemsGrid = [];
		for (let i = 0, item; (item = items[i]); i++) {
			if (!item.getAttribute('action')) continue;

			const itemID = item.getAttribute('id');
			const type = item.getAttribute('type');
			const currentItemType = topWnd.aras.getItemTypeForClient(type);

			const itemTypeLabel = currentItemType.getProperty('label') || type;
			const openIcon = currentItemType.getProperty(
				'open_icon',
				defaultItemTypeIcon
			);

			allItems[itemID] = 1;

			itemsGrid.push({
				uniqueId: itemID,
				number: i + 1,
				img: '../cbin/' + openIcon,
				type: itemTypeLabel,
				keyed_name: topWnd.aras.getKeyedNameEx(item)
			});
		}
		grid.setArrayData_Experimental(itemsGrid);
	};

	container.onDoubleClick = function (rowID) {
		container.processCommand('view');
	};
}
