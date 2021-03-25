function initializeItemsGridCommandsFunctions(container) {
	container.onDeinitialize = function () {
		container.onUnregisterEventHandler();
	};

	container.onInitialize = function () {
		container.onRegisterEventHandler();
		return ItemTypeGrid.onInitialize();
	};

	container.initSearch = async function (favoriteSearchId, autoSearch) {
		setupPageNumber();
		await setupGrid(true);

		if (searchContainer) {
			searchContainer.removeIFramesCollection();
		}
		const searchToolbar = document.querySelector(
			'#searchview-toolbars .aras-commandbar'
		);
		searchContainer = new SearchContainer(
			itemTypeName,
			grid,
			null,
			searchLocation,
			document.getElementById('searchPlaceholder'),
			undefined,
			searchToolbar
		);
		searchContainer.initSearchContainer(true);
		searchContainer.onStartSearchContainer();

		if (favoriteSearchId) {
			const favoriteItem = aras.getMainWindow().favorites.get(favoriteSearchId);
			return searchContainer.applyFavoriteSearch(favoriteItem);
		}
		// run autosearch if required
		if (
			aras.getItemProperty(currItemType, 'auto_search') === '1' ||
			Boolean(autoSearch)
		) {
			return doSearch();
		}
	};

	container.initColumnSelectionBlock = function () {
		const xClassBarNode = document.getElementById('xClassBarPlaceholder');
		columnSelectionMediator = ColumnSelectionMediatorFactory.CreateBaseMediator(
			xClassBarNode
		);
		columnSelectionControl.initResources();
		xClassSearchWrapper.initResources();
	};

	container.reinitXClassBar = function () {
		const xClassBarNode = document.getElementById('xClassBarPlaceholder');
		columnSelectionMediator.xClassBarWrapper = new XClassBar(
			itemTypeName,
			xClassBarNode
		);
	};

	container.updateRowSearchGrids = function (itemNode) {
		return container.syncGrids('updateRow', itemNode);
	};

	container.deleteRowSearchGrids = function (deleteTarget) {
		if (!deleteTarget) {
			aras.uiPopulateInfoTableWithItem(null, document);
			return false;
		}
		return container.syncGrids('deleteRow', deleteTarget);
	};

	container.insertRowSearchGrids = function (itemNode) {
		return container.syncGrids('insertRow', itemNode);
	};

	container.syncGrids = function (syncFunction, itemNode) {
		if (!itemNode) {
			return false;
		}
		const topWin = aras.getMainWindow();
		const itemsGridArray = topWin.mainLayout.tabsContainer.getSearchGridTabs(
			window.itemTypeID
		);
		const changedGrids = itemsGridArray.filter(function (itemsGrid) {
			return itemsGrid[syncFunction](itemNode);
		});

		return changedGrids.length > 0;
	};

	container.onXmlLoaded = function () {
		if (addRowInProgress_Number !== 0) {
			addRowInProgress_Number--;
			if (addRowInProgress_Number === 0 && callbackF_afterAddRow) {
				callbackF_afterAddRow();
			}

			return;
		}

		if (!aras.sGridsSetups[itemTypeName]) {
			aras.sGridsSetups[itemTypeName] = {};
		}

		const gridSetup = aras.sGridsSetups[itemTypeName];
		if (!gridSetup.selectedRows) {
			gridSetup.selectedRows = [];
		}

		let rowIdToSelect = '';
		const selectedRows = gridSetup.selectedRows;
		if (grid.getRowCount() === 0) {
			container.updateInfoTableWithItem(rowIdToSelect);
			return;
		}

		const currentSelectedRows = [];

		if (selectedRows.length === 0) {
			rowIdToSelect = grid.getRowId(0);
			currentSelectedRows.push(rowIdToSelect);
		} else {
			let highestRow = 1000000;

			selectedRows.forEach((rowId) => {
				const rowIndex = grid.getRowIndex(rowId);
				if (rowIndex === -1) {
					return;
				}

				if (rowIdToSelect === '' || rowIndex < highestRow) {
					highestRow = rowIndex;
					rowIdToSelect = rowId;
				}

				currentSelectedRows.push(rowId);
				grid.setSelectedRow(rowId, true, false);
			});

			if (currentSelectedRows.length === 0) {
				rowIdToSelect = grid.getRowId(0);
				currentSelectedRows.push(rowIdToSelect);
				grid.setSelectedRow(rowIdToSelect, true, false);
			}
		}

		grid.setSelectedRow(rowIdToSelect, true, true);
		gridSetup.selectedRows = currentSelectedRows;

		container.onSelectItem(rowIdToSelect);
	};

	container.updateInfoTableWithItem = function (rowId) {
		const currentQueryItemResult = currQryItem.getResult();
		const sourceItem = currentQueryItemResult.selectSingleNode(
			'Item[@id="' + rowId + '"]'
		);

		aras.uiPopulateInfoTableWithItem(
			sourceItem,
			document,
			function (soapBody, callback) {
				asyncController.sendRequest(
					rowId,
					'updateInfoTableWithItem',
					soapBody,
					callback
				);
			},
			function (soapBody, callback) {
				asyncController.sendRequest(
					rowId,
					'requestLCStateHanlder',
					soapBody,
					callback
				);
			}
		);

		if (columnSelectionMediator) {
			columnSelectionMediator.updateXClassBar();
		}
	};

	container.onSelectItem = function (rowId, col, notupdateMenu, isGridEvent) {
		const idsArray = grid.getSelectedItemIds();
		const rowIsNotSelected = idsArray.indexOf(rowId) === -1;

		aras.sGridsSetups[itemTypeName].selectedRows = idsArray;
		const selectedRow = rowIsNotSelected ? idsArray[0] : rowId;
		container.updateInfoTableWithItem(selectedRow);
		container.onClickRow(selectedRow || rowId);

		if (rowIsNotSelected && !isGridEvent) {
			grid.setSelectedRow(rowId, true, false);
		}

		if (!notupdateMenu) {
			container.setMenuState(rowId, col);
		}

		columnSelectionMediator.updateXClassBar();
	};

	container.setMenuState = function (rowId, col) {
		ItemTypeGrid.setMenuState(rowId, col);
	};

	container.initItemMenu = function (rowId) {
		ItemTypeGrid.initItemMenu(rowId);
	};

	container.onDoubleClick = function (rowId, columnIndex, altMode) {
		ItemTypeGrid.onDoubleClick(rowId, altMode);
	};

	container.onClickRow = function (rowId) {
		if (previewPane.getType() !== 'Form') {
			return;
		}

		if (ItemTypeGrid.onClick && rowId) {
			ItemTypeGrid.onClick(rowId);
		} else {
			previewPane.clearForm();
		}
	};

	container.onHeaderCellContextMenu = function (e) {
		return topWnd.cui.onGridHeaderContextMenu(e, grid, true);
	};

	container.onHeaderContextMenu = function (e) {
		return topWnd.cui.onGridHeaderContextMenu(e, grid);
	};

	container.onContextMenu = function (e) {
		const body = this._grid.view.body;
		//contextmenu from mouse
		if (e.button === 2 && body === e.target.parentNode) {
			this._grid.settings.selectedRows = [];
			this._grid.render();
		}
		const selectedRows = this._grid.settings.selectedRows;
		if (body.contains(e.target)) {
			if (selectedRows.length) {
				const rowId = selectedRows[selectedRows.length - 1];
				container.setMenuState(rowId);
				container.onRowContextMenu.call(grid, rowId, e);
			} else {
				container.onGridAreaContextMenu.call(grid, e);
			}
		}
	};

	container.onGridAreaContextMenu = function (event) {
		window.popupMenuState = {};
		container.setMenuState && container.setMenuState();
		showMenu(event);
	};

	container.onRowContextMenu = function (rowId, e) {
		if (this.grid_Experimental.edit.isEditing()) {
			this.grid_Experimental.edit.apply();
		}
		showMenu(e, rowId);
	};

	function showMenu(e, rowId) {
		let columnIndex;
		if (rowId) {
			columnIndex = e.target.cellIndex;
			grid.contexMenu_Experimental.rowId = rowId;
			grid.contexMenu_Experimental.columnIndex = columnIndex;
		}
		grid.gridMenuInit(rowId || null, columnIndex || null);
		grid.getMenu().show(
			{
				x: e.clientX,
				y: e.clientY
			},
			{
				rowId: rowId || null,
				selectedRowsIds: grid.getSelectedItemIds(),
				eventState: ItemTypeGrid.getContextMenuEventState(),
				rows: grid._grid.rows
			}
		);
		e.preventDefault();
	}

	container.hideColumn = function (col) {
		grid.SetColumnVisible(col, false);
	};

	container.showColumn = function (col) {
		const colOrderArr = grid.getLogicalColumnOrder().split(';');
		const propsToShow = [];
		let propertyName;
		let propertyLabel;
		let propertyWidth;
		let columnName;
		let i;
		let j;

		for (i = 0; i < colOrderArr.length; i++) {
			if (grid.getColWidth(i) == 0) {
				propertyLabel = '';
				propertyWidth = 100;
				columnName = grid.GetColumnName(i);

				if (columnName === 'L') {
					propertyLabel = aras.getResource('', 'common.claimed');
					propertyWidth = 32;
				} else {
					propertyName = columnName.substr(0, columnName.length - 2);

					for (j = 0; j < visiblePropNds.length; j++) {
						if (
							aras.getItemProperty(visiblePropNds[j], 'name') == propertyName
						) {
							const tempWidth = parseInt(
								aras.getItemProperty(visiblePropNds[j], 'column_width')
							);

							propertyLabel =
								aras.getItemProperty(visiblePropNds[j], 'label') ||
								propertyName;

							if (!isNaN(tempWidth)) {
								propertyWidth = tempWidth;
							}
							break;
						}
					}
				}
				propsToShow.push({
					colNumber: i,
					label: propertyLabel,
					width: propertyWidth
				});
			}
		}

		if (propsToShow.length) {
			window.parent.ArasModules.Dialog.show('iframe', {
				title: aras.getResource('', 'showcolumndlg.title'),
				aras: aras,
				propsToShow: propsToShow,
				dialogWidth: 350,
				dialogHeight: 500,
				resizable: true,
				content: 'SitePreference/showColumnDialog.html'
			}).promise.then(function (resultArray) {
				if (resultArray) {
					for (let j = 0; j < resultArray.length; j++) {
						for (let i = 0; i < propsToShow.length; i++) {
							if (propsToShow[i].label === resultArray[j]) {
								grid.SetColumnVisible(
									propsToShow[i].colNumber,
									true,
									propsToShow[i].width
								);
								break;
							}
						}
					}
				}
			});
		} else {
			aras.AlertError(
				aras.getResource('', 'itemsgrid.no_additional_columns_available')
			);
		}
	};

	container.onLink = function (typeName, id, altMode) {
		ItemTypeGrid.onLink(typeName, id, altMode);
	};

	container.GetDatePattern = function (queryType) {
		let propertyName;
		let datePattern;

		switch (queryType) {
			case 'Released':
				propertyName = 'release_date';
				break;
			case 'Effective':
				propertyName = 'effective_date';
				break;
			default:
				propertyName = 'modified_on';
				break;
		}

		const selector =
			"Relationships/Item[@type='Property' and name='" + propertyName + "']";
		const pattern = aras.getItemProperty(
			currItemType.selectSingleNode(selector),
			'pattern'
		);
		datePattern = pattern || 'short_date_time';
		return aras.getDotNetDatePattern(datePattern);
	};

	container.execInTearOffWin = function (itemId, commandId, param) {
		if (commandId) {
			const itemWindow = aras.uiFindWindowEx(itemId);
			let execResult = null;

			if (itemWindow) {
				if (!aras.isWindowClosed(itemWindow)) {
					if (itemWindow.name != 'work') {
						const tearoff_menu = itemWindow.tearOffMenuController;

						aras.browserHelper.setFocus(itemWindow);

						if (tearoff_menu && tearoff_menu.onClickMenuItem) {
							execResult = tearoff_menu.onClickMenuItem(commandId, param);

							if (!execResult || !execResult.result) {
								execResult = true;
							}
						}
					}
				} else {
					aras.uiUnregWindowEx(itemId);
				}

				if (execResult == null) {
					execResult = true;
				}
			}

			return execResult;
		}

		return false;
	};

	container.onNewCommand = function () {
		if (itemTypeName === 'File') {
			parent.ArasModules.vault.selectFile().then(function (item) {
				const fileNode = aras.newItem('File', item);
				aras.uiShowItemEx(fileNode, 'new');
				aras.itemsCache.addItem(fileNode);
				container.insertRowSearchGrids(fileNode);
			});
		} else {
			const itemType = aras.getItemTypeForClient(itemTypeName).node;

			if (aras.isPolymorphic(itemType) && !window.showModalDialog) {
				aras.newItem(itemTypeName).then(function (node) {
					if (node) {
						aras.itemsCache.addItem(node);
						aras.uiShowItemEx(node, 'new');
						container.insertRowSearchGrids(node);
					}
				});
			} else {
				const newItem = aras.uiNewItemEx(itemTypeName);

				if (newItem) {
					container.insertRowSearchGrids(newItem);
				}
			}
		}
	};

	container.onViewCommand = function () {
		const itemId = grid.getSelectedId();

		if (itemId) {
			if (!container.execInTearOffWin(itemId, 'view')) {
				const itemNode = aras.getItemById(itemTypeName, itemId, 0);

				if (itemNode) {
					aras.uiShowItemEx(itemNode);
				} else {
					aras.AlertError(
						aras.getResource('', 'itemsgrid.failed2get_itemtype', itemTypeLabel)
					);
					return false;
				}
			}

			return true;
		} else {
			aras.AlertError(
				aras.getResource('', 'itemsgrid.select_item_type_first', itemTypeLabel)
			);
			return false;
		}
	};

	container.onEditCommand = function () {
		const itemId = grid.getSelectedId();

		return ItemTypeGrid.onEditCommand(itemId);
	};

	container.onSaveCommand = function () {
		let itemNode;
		const itemTypeName = window.itemTypeName;
		const isVersionableIT = window.isVersionableIT;
		const updateGridAfterSave = function (oldItemId, saveResult) {
			if (!saveResult || itemTypeName !== window.itemTypeName) {
				return;
			}
			let newId = oldItemId;
			if (isVersionableIT) {
				itemNode = aras.getItemLastVersion(itemTypeName, oldItemId);

				if (!itemNode) {
					return;
				}
				newId = itemNode.getAttribute('id');
			}

			itemNode = aras.getItemById(itemTypeName, newId, 0);
			if (itemNode) {
				if (isVersionableIT) {
					const oldItem = currQryItem
						.getResult()
						.selectSingleNode('Item[@id="' + oldItemId + '"]');
					container.deleteRowSearchGrids(oldItem);
				}

				if (container.updateRowSearchGrids(itemNode)) {
					container.onSelectItem(newId);
				}
			}
		};
		const itemIds = grid.getSelectedItemIds();

		if (!itemIds.length) {
			aras.AlertError(
				aras.getResource('', 'itemsgrid.select_item_type_first', itemTypeLabel)
			);
			return Promise.resolve(false);
		}

		let itemId;
		let i;
		let itemsSavingChain = Promise.resolve();
		for (i = 0; i < itemIds.length; i++) {
			itemId = itemIds[i];

			if (!container.execInTearOffWin(itemId, 'save')) {
				itemNode = aras.getItemById('', itemId, 0);

				if (itemNode && (aras.isTempEx(itemNode) || aras.isDirtyEx(itemNode))) {
					if (itemTypeName == 'Form') {
						itemNode.setAttribute('levels', 3);
					}
					itemsSavingChain = itemsSavingChain
						.then(aras.saveItemExAsync.bind(aras, itemNode))
						.then(updateGridAfterSave.bind(null, itemId));
				}
			}
		}

		itemsSavingChain.then(function () {
			if (itemTypeName !== window.itemTypeName) {
				return;
			}
			switch (itemTypeName) {
				case 'ItemType':
					topWnd.updateTree(itemIds);
					break;
				case 'Preference':
					topWnd.mainLayout.observer.notify('UpdatePreferences');
					break;
			}

			if (itemIds.length === 1) {
				aras.uiReShowItemEx(itemId, itemNode);
			}
		});
	};

	container.onPurgeCommand = function (itemIds = grid.getSelectedItemIds()) {
		return container.onPurgeDeleteCommand('purge', itemIds);
	};

	container.onDeleteCommand = function (itemIds = grid.getSelectedItemIds()) {
		return container.onPurgeDeleteCommand('delete', itemIds);
	};

	container.onPurgeDeleteCommand_executeCommand = function (
		command,
		itemId,
		itemNode,
		unselectedIds
	) {
		const res = command(itemTypeName, itemId, true);
		if (!res) {
			return;
		}

		container.deleteRowSearchGrids(itemNode);
		if (grid.getRowIndex(itemId) > -1) {
			grid.setSelectedRow(itemId, true, false);
			unselectedIds.push(itemId);
		}
	};

	container.onPurgeDeleteCommand_updateUiAfterPurgeDelete = function (
		itemIds,
		unselectedIds
	) {
		if (itemTypeName === 'ItemType') {
			topWnd.updateTree(itemIds);
		}
		topWnd.mainLayout.updateCuiLayoutOnItemChange(itemTypeName);
		if (unselectedIds.length > 0) {
			for (let i = 1; i < unselectedIds.length; i++) {
				grid.setSelectedRow(unselectedIds[i], true, false);
			}

			grid.setSelectedRow(unselectedIds[0], true, true);

			if (itemIds.length > 1) {
				container.onSelectItem(unselectedIds[0]);
			}
		} else {
			const rowCount = grid.getRowCount();
			if (rowCount > 0) {
				const rowIndex = grid.getRowIndex(itemIds[0]);
				let idToSelect = grid.getRowId(0);

				if (rowIndex > -1) {
					idToSelect =
						rowCount - 1 >= rowIndex
							? grid.getRowId(rowIndex)
							: grid.getRowId(rowCount - 1);
				}

				grid.setSelectedRow(idToSelect, false, true);
				container.onSelectItem(idToSelect);
			} else {
				setupGrid(false);
			}
		}
	};

	container.onPurgeDeleteCommand = function (commandId, itemIds) {
		if (itemIds.length === 0) {
			aras.AlertError(
				aras.getResource('', 'itemsgrid.select_item_type_first', itemTypeLabel)
			);
			return false;
		}

		// binding is necessary, otherwise context will be lost
		const targetCommand =
			commandId === 'purge'
				? aras.purgeItem.bind(aras)
				: aras.deleteItem.bind(aras);

		const clientCache = currQryItem.getResult();
		if (!clientCache) {
			return;
		}

		const unselIds = [];
		let continueExecutionSilently = false;
		let skipDialog = false;

		let indexFor = 0;
		const nextFor = function () {
			indexFor++;
			if (indexFor < itemIds.length) {
				startExecute(itemIds[indexFor], itemIds, indexFor);
			} else {
				container.onPurgeDeleteCommand_updateUiAfterPurgeDelete(
					itemIds,
					unselIds
				);
			}
		};

		var startExecute = function (itemId, array, index) {
			const itemNode = clientCache.selectSingleNode(
				'Item[@id="' + itemId + '"]'
			);
			if (!itemNode) {
				container.deleteRowSearchGrids(itemId);
				nextFor();
				return;
			}

			const tearOffAnsw = container.execInTearOffWin(itemId, commandId);
			if (tearOffAnsw) {
				if (tearOffAnsw.result === 'Deleted') {
					container.deleteRow(itemNode);
					focus();
				}
				nextFor();
				return;
			}

			if (skipDialog) {
				if (continueExecutionSilently) {
					container.onPurgeDeleteCommand_executeCommand(
						targetCommand,
						itemId,
						itemNode,
						unselIds
					);
				} else {
					grid.setSelectedRow(itemId, true, false);
					unselIds.push(itemId);
				}
				nextFor();
				return;
			}

			const isPurge = commandId === 'purge';
			const messageId = isPurge
				? 'confirm_delete.purge_message'
				: 'confirm_delete.delete_message';
			const message = aras.getResource(
				'',
				messageId,
				itemTypeLabel,
				aras.getKeyedNameEx(itemNode)
			);
			const title = aras.getResource(
				'',
				isPurge ? 'confirm_delete.purge_title' : 'confirm_delete.delete_title'
			);
			const image = '../images/Delete.svg';
			const okButtonText = aras.getResource(
				'',
				isPurge ? 'confirm_delete.purge' : 'confirm_delete.delete'
			);
			const options = {
				title,
				image,
				okButtonText,
				okButtonModifier: 'aras-button_secondary'
			};
			const isLastElement = array.length - 1 === index;
			if (!isLastElement) {
				Object.assign(options, {
					additionalButton: [
						{
							actionName: 'skip',
							buttonModifier: 'aras-button_b-primary',
							text: aras.getResource('', 'confirm_delete.skip')
						},
						{
							actionName: 'deleteAll',
							buttonModifier: 'aras-button_primary',
							text: aras.getResource(
								'',
								isPurge
									? 'confirm_delete.purge_all'
									: 'confirm_delete.delete_all'
							)
						}
					]
				});
			}

			window.parent.ArasModules.Dialog.confirm(message, options).then(function (
				res
			) {
				switch (res) {
					case 'deleteAll': {
						container.onPurgeDeleteCommand_executeCommand(
							targetCommand,
							itemId,
							itemNode,
							unselIds
						);
						skipDialog = true;
						continueExecutionSilently = true;
						break;
					}
					case 'ok': {
						container.onPurgeDeleteCommand_executeCommand(
							targetCommand,
							itemId,
							itemNode,
							unselIds
						);
						break;
					}
					case 'skip': {
						break;
					}
					default: {
						grid.setSelectedRow(itemId, true, false);
						unselIds.push(itemId);
						skipDialog = true;
					}
				}
				nextFor();
			});
		};
		startExecute(itemIds[indexFor], itemIds, indexFor);
	};

	container.onSaveAsCommand = function () {
		const itemId = grid.selection_Experimental.get('id');

		if (!itemId) {
			aras.AlertError(
				aras.getResource('', 'itemsgrid.select_item_type_first', itemTypeLabel)
			);
			return false;
		}

		const copiedItem = aras.copyItem(itemTypeName, itemId);
		if (!copiedItem) {
			return false;
		}

		const rowId = copiedItem.getAttribute('id');

		if (itemTypeName === 'ItemType') {
			topWnd.updateTree(itemId.split(';'));
		}
		grid.selection_Experimental.clear();

		window.callbackF_afterAddRow = function () {
			window.callbackF_afterAddRow = null;
			container.onSelectItem(rowId);

			if (itemTypeName !== 'File') {
				container.onEditCommand();
			}
		};

		container.insertRowSearchGrids(copiedItem);
	};

	container.onPrintCommand = function () {
		function printGrid(pdf) {
			// return array of object about header (header label, widht)
			const getHeaderData = function () {
				return this.grid._grid.settings.indexHead.map((columnName) => {
					const columnIndex = this.grid.getColumnIndex(columnName);
					return {
						label: grid.getHeaderCol(columnIndex),
						width: grid.getColWidth(columnIndex) + 'px'
					};
				});
			};

			// return array of object about search bar (search label, widget class name)
			const getSearchBarData = function () {
				return this.grid._grid.settings.indexHead.map((columnName) => {
					return {
						label: grid._grid.head.get(columnName, 'searchValue'),
						widget: 'dijit.form.TextBox'
					};
				});
			};

			const itemDataTypes = ['item', 'file'];
			// return array of objects about all rows in grid
			const getRowData = function () {
				const selectedRowIds = grid.getSelectedItemIds();
				const gridIndexHead = grid._grid.settings.indexHead;

				return grid._grid.settings.indexRows.map((rowId) => {
					const rowData = [];
					/* jshint -W083 */
					gridIndexHead.forEach((columnName) => {
						const columnIndex = grid.getColumnIndex(columnName);
						const cell = grid.cells_Experimental(rowId, columnIndex, true);
						if (!cell) {
							return;
						}

						const gridHead = grid._grid.head;
						const gridRows = grid._grid.rows;
						const dataType = gridHead.get(columnName, 'dataType');
						const propertyName = gridHead.get(columnName, 'name') || columnName;
						const isLinked =
							itemDataTypes.includes(dataType) &&
							gridRows.get(rowId, `${propertyName}@aras.discover_only`) !== '1';
						rowData.push({
							label: cell.getText(),
							link: isLinked,
							align: cell.getHorAlign(),
							style: cell.getCellStyle(),
							selected: selectedRowIds.includes(rowId)
						});
					});
					/* jshint +W083 */
					return rowData;
				});
			};

			// method calculate how many records can be print on one page of pdf document
			// depending on format paper and orientation
			const getRecordsPerPage = function (doc, format, orientation, pdf) {
				const pageFormat = doc.getPageFormat(format);
				const pageHeight = orientation === 'p' ? pageFormat[1] : pageFormat[0];
				const margin = pdf.getMargin();

				const headerHeight =
					margin +
					pdf.getHeaderHeight() +
					(grid._grid.view.defaultSettings.search
						? pdf.getSearchBarHeight()
						: 0);
				const totalRecordsHeight = pageHeight - headerHeight - margin;
				const oneRecordHeight = pdf.getRowHeight();

				const recordsPerPage = Math.floor(totalRecordsHeight / oneRecordHeight);
				return recordsPerPage;
			};

			// start of printing
			return function (jsPDF) {
				// jscs:disable
				const doc = new jsPDF('l', 'pt', 'a4', true);
				// jscs:enable
				const langDir = dojoConfig.arasContext.languageDirection;
				doc.setLangDir(langDir);
				const recordsPerPage = getRecordsPerPage(doc, 'a4', 'l', pdf);
				const pageCount = Math.ceil(grid.getRowCount() / recordsPerPage) || 1;

				// searhbar can be invisible, so we don't need to print it
				const printSearchBar = grid.isInputRowVisible();

				// print header
				const headerInfo = pdf.printHeader(getHeaderData(), doc, pageCount);
				headerInfo.printSearchBar = printSearchBar;

				// print searhBar
				if (printSearchBar) {
					pdf.printSearchBar(getSearchBarData(), headerInfo, doc, pageCount);
				}

				// print rows
				pdf.printGridData(getRowData(), headerInfo, doc, recordsPerPage);

				// save to file
				doc.save(itemTypeName ? itemTypeName + 'Grid.pdf' : 'print_result.pdf');
			};
		}
		require([
			'Printing/Scripts/Classes/JsPdfLoader',
			'Printing/Scripts/Classes/DataGridToPdf'
		], function (loader, DataGridToPdf) {
			loader.loadScripts(printGrid(DataGridToPdf), [
				'jspdf.plugin.text.js',
				'jspdf.plugin.bidi.js',
				'jspdf.plugin.graphics.js'
			]);
		});
	};

	container.getRealItemTypeNames = function (itemIdsOrId) {
		let itemIds = itemIdsOrId;
		if (typeof itemIds === 'string') {
			itemIds = [itemIds];
		}
		if (!itemIds.length) {
			throw new Error('Item ids are not specified');
		}

		if (!aras.isPolymorphic(window.currItemType)) {
			return itemIds.reduce((acc, itemId) => {
				acc[itemId] = window.itemTypeName;
				return acc;
			}, {});
		}

		const idList = itemIds.join(',');
		const response = aras.soapSend(
			'ApplyItem',
			`<Item type='${window.itemTypeName}' action='get' select='itemtype' idlist='${idList}'/>`
		);

		if (response.getFaultCode() !== 0) {
			aras.AlertError(response);
			return {};
		}

		const items = response.getResult().selectNodes('Item');

		return items.reduce((acc, itemNode) => {
			acc[itemNode.getAttribute('id')] = aras.getItemTypeName(
				aras.getItemProperty(itemNode, 'itemtype')
			);
			return acc;
		}, {});
	};

	container.onLockCommand = function (itemIDs) {
		return ItemTypeGrid.onLockCommand(itemIDs);
	};

	container.onUnlockCommand = function (itemIDs) {
		return ItemTypeGrid.onUnlockCommand(itemIDs);
	};

	container.onRevisionsCommand = function () {
		const itemId = grid.getSelectedId();

		if (!itemId) {
			aras.AlertError(
				aras.getResource('', 'itemsgrid.select_item_type_first', itemTypeLabel)
			);
			return false;
		}

		if (container.execInTearOffWin(itemId, 'revisions')) {
			return true;
		} else {
			const minDialogWidth = 500;
			const maxDialogWidth =
				document.getElementById('grid_table').offsetWidth -
				document.getElementById('itemProperties').offsetWidth;
			let width = maxDialogWidth;
			const colWidths = aras.getPreferenceItemProperty(
				'Core_ItemGridLayout',
				itemTypeID,
				'col_widths',
				null
			);
			const dialogParams = {
				aras: aras,
				itemID: itemId,
				itemTypeName: itemTypeName,
				dialogWidth:
					width < minDialogWidth
						? minDialogWidth
						: width > maxDialogWidth
						? maxDialogWidth
						: width,
				resizable: true,
				title: aras.getResource('', 'revisiondlg.item_versions'),
				type: 'RevisionsDialog'
			};

			if (colWidths) {
				const widthsArray = colWidths.split(';');
				let i;

				width = 0;
				for (i = 0; i < widthsArray.length; i++) {
					width += parseInt(widthsArray[i]);
				}
			}
			window.parent.ArasModules.Dialog.show('iframe', dialogParams);
		}
	};

	container.onUndoCommand = function () {
		const itemIDs = topWnd.work.grid.getSelectedItemIds();
		if (itemIDs.length === 0) {
			aras.AlertError(
				aras.getResource('', 'itemsgrid.select_item_type_first', itemTypeLabel)
			);
			return;
		}

		const dialogParams = {
			aras: aras,
			dialogWidth: 400,
			dialogHeight: 200,
			center: true,
			buttons: {
				btnYes: aras.getResource('', 'itemsgrid.undodlg.yes'),
				btnYes4All: aras.getResource('', 'itemsgrid.undodlg.yes4all'),
				btnSkip: aras.getResource('', 'itemsgrid.undodlg.skip'),
				btnCancel: aras.getResource('', 'itemsgrid.undodlg.cancel')
			},
			defaultButton: 'btnSkip'
		};
		let yes4All = false;
		let index = 0;
		const underCommand = function (itemId) {
			aras.removeFromCache(itemId);
			const itemNode = aras.getItemById(itemTypeName, itemId, 0);

			if (!(itemNode && container.updateRow(itemNode) === false)) {
				index++;
				nextFor();
			}
		};
		var nextFor = function () {
			if (index < itemIDs.length) {
				const itemId = itemIDs[index];
				const itemNode = aras.getFromCache(itemId);

				if (itemNode) {
					if (container.execInTearOffWin(itemId, 'undo')) {
						index++;
						nextFor();
					}

					if (!yes4All) {
						const confirmMessage = aras.getResource(
							'',
							'itemsgrid.undo_will_discard_changes',
							itemTypeLabel,
							aras.getKeyedNameEx(itemNode)
						);
						if (index === itemIDs.length - 1) {
							topWnd.aras.confirm(confirmMessage, window.parent, function (
								res
							) {
								if (res === 'btnYes') {
									underCommand(itemId);
								} else {
									container.onSelectItem(itemIDs[0]);
								}
							});
						} else {
							dialogParams.message = confirmMessage;
							dialogParams.content = 'groupChgsDialog.html';
							window.parent.ArasModules.Dialog.show(
								'iframe',
								dialogParams
							).promise.then(function (res) {
								if (res === 'btnYes4All') {
									yes4All = true;
									underCommand(itemId);
								} else if (res === 'btnYes') {
									window.setTimeout(function () {
										underCommand(itemId);
									}, 0);
								} else if (res === 'btnSkip') {
									index++;
									window.setTimeout(function () {
										nextFor();
									}, 0);
								} else {
									container.onSelectItem(itemIDs[0]);
								}
							});
						}
					} else {
						underCommand(itemId);
					}
				}
			} else {
				container.onSelectItem(itemIDs[0]);
			}
		};
		nextFor();
	};

	container.onOpenCommand = function () {
		if (itemTypeName == 'File') {
			const itemID = grid.getSelectedId();

			if (!itemID) {
				aras.AlertError(
					aras.getResource(
						'',
						'itemsgrid.select_item_type_first',
						itemTypeLabel
					)
				);
				return false;
			}

			if (container.execInTearOffWin(itemID, 'open')) {
				return true;
			} else {
				const file = aras.getItemById('File', itemID, 0);

				if (file) {
					aras.uiShowItemEx(file, 'openFile');
				}
			}
		} else {
			return false;
		}
	};

	container.onDownloadCommand = function () {
		if (itemTypeName === 'File') {
			const itemIDs = grid.getSelectedItemIds();

			if (!itemIDs || !itemIDs.length) {
				aras.AlertError(
					aras.getResource(
						'',
						'itemsgrid.select_item_type_first',
						itemTypeLabel
					)
				);
				return false;
			}

			for (let i = 0; i < itemIDs.length; i++) {
				const file = aras.getItemById('File', itemIDs[i], 0);
				if (file) {
					aras.downloadFile(file);
				}
			}

			return true;
		}
		return false;
	};

	container.onPromoteCommand = function () {
		const itemIds = grid.getSelectedItemIds();
		switch (itemIds.length) {
			case 0:
				aras.AlertError(
					aras.getResource(
						'',
						'itemsgrid.select_item_type_first',
						itemTypeLabel
					)
				);
				return;
			case 1:
				singlePromote(itemIds[0]);
				return;
			default:
				ItemTypeGrid.onMassPromote(itemIds);
		}

		function singlePromote(itemId) {
			const queryItem = currQryItem.getResult();
			let itemNode;

			itemNode =
				aras.getFromCache(itemId) ||
				queryItem.selectSingleNode('Item[@id="' + itemId + '"]');
			if (itemNode) {
				if (container.execInTearOffWin(itemId, 'promote')) {
					return;
				} else {
					window.parent.ArasModules.Dialog.show('iframe', {
						title: aras.getResource(
							'',
							'promotedlg.propmote',
							aras.getKeyedNameEx(itemNode)
						),
						item: itemNode,
						aras: aras,
						dialogHeight: 300,
						dialogWidth: 400,
						content: 'promoteDialog.html',
						resizable: true
					}).promise.then(function (res) {
						if (typeof res == 'string' && res == 'null') {
							return;
						}

						if (!res) {
							return false;
						}
						if (isVersionableIT) {
							const lastItemVersion = aras.getItemLastVersion(
								itemTypeName,
								itemId
							);
							const oldId = itemId;

							if (lastItemVersion) {
								itemId = lastItemVersion.getAttribute('id');

								if (oldId != itemId) {
									container.deleteRowSearchGrids(itemNode);
									res = lastItemVersion;
								}
							}
						}

						if (container.updateRowSearchGrids(res) !== false) {
							container.onSelectItem(itemId);
						}
					});
				}
			}
		}
	};

	container.onCopy2clipboardCommand = function () {
		const itemIds = topWnd.work.grid.getSelectedItemIds();
		const resultList = [];
		let itemId;
		let copiedItem;
		let i;

		for (i = 0; i < itemIds.length; i++) {
			itemId = itemIds[i];
			copiedItem = aras.copyRelationship(itemTypeName, itemId);

			if (copiedItem) {
				resultList.push(copiedItem);
			} else {
				aras.AlertError(
					aras.getResource(
						'',
						'itemsgrid.failed2get_itemtype_with_id',
						itemTypeLabel,
						itemId
					)
				);
			}
		}

		aras.clipboard.copy(resultList);
		container.onSelectItem(itemIDs[0]);
	};

	container.onPasteCommand = function () {
		const itemIds = topWnd.work.grid.getSelectedItemIds();
		const itemArr = aras.clipboard.paste();
		let itemNode;
		let i;
		let j;

		for (i = 0; i < itemIds.length; i++) {
			itemNode = aras.getItemById(itemTypeName, itemIds[i]);

			if (!itemNode) {
				aras.AlertError(
					aras.getResource(
						'',
						'itemsgrid.failed2get_itemtype_with_id',
						itemTypeLabel,
						itemIds[i]
					)
				);
				return;
			}

			for (j = 0; j < itemArr.length; j++) {
				if (!aras.pasteRelationship(itemNode, itemArr[j])) {
					aras.AlertError(aras.getResource('', 'itemsgrid.pasting_failed'));
					return;
				}
			}
			itemNode.setAttribute('isDirty', '1');

			if (container.updateRow(itemNode) === false) {
				return;
			}
		}

		aras.AlertSuccess(aras.getResource('', 'itemsgrid.pasting_success'));
	};

	container.onPaste_specialCommand = function () {
		const itemIds = topWnd.work.grid.getSelectedItemIds();
		const itemsList = [];
		let dialogParams;
		let result;
		let itemNode;
		let i;
		let j;

		for (i = 0; i < itemIds.length; i++) {
			itemNode = aras.getItemById(itemTypeName, itemIds[i]);

			if (!itemNode) {
				aras.AlertError(
					aras.getResource(
						'',
						'itemsgrid.failed2get_itemtype_with_id',
						itemTypeLabel,
						itemIds[i]
					)
				);
				continue;
			}

			itemsList.push(itemNode);
		}

		dialogParams = {
			title: aras.getResource('', 'clipboardmanager.clipboard_manager'),
			aras: aras,
			dialogWidth: 700,
			dialogHeight: 450,
			itemsArr: itemsList,
			srcItemTypeId: itemTypeID,
			content: 'ClipboardManager.html'
		};

		window.parent.ArasModules.Dialog.show('iframe', dialogParams).promise.then(
			function (result) {
				if (result && result.ids) {
					const clipboardItems = aras.clipboard.clItems;
					let clipboardItem;

					for (i = 0; i < result.ids.length; i++) {
						for (j = 0; j < itemsList.length; j++) {
							itemNode = itemsList[j];
							clipboardItem = clipboardItems[result.ids[i]];

							if (
								!aras.pasteRelationship(
									itemNode,
									clipboardItem,
									result.as_is,
									result.as_new
								)
							) {
								aras.AlertError(
									aras.getResource('', 'itemsgrid.pasting_failed')
								);
								return;
							}

							itemNode.setAttribute('isDirty', '1');
							if (container.updateRow(itemNode) === false) {
								return;
							}
						}
					}
					aras.AlertSuccess(aras.getResource('', 'itemsgrid.pasting_success'));
				}
				container.onSelectItem(itemIds[0]);
			}
		);
	};

	container.onShow_clipboardCommand = function () {
		const itemIds = topWnd.work.grid.getSelectedItemIds();

		window.parent.ArasModules.Dialog.show('iframe', {
			title: aras.getResource('', 'clipboardmanager.clipboard_manager'),
			aras: aras,
			content: 'ClipboardManager.html',
			dialogWidth: 700,
			dialogHeight: 450
		}).promise.then(function () {
			container.onSelectItem(itemIds[0]);
		});
	};

	container.InitPropertiesContainer = function () {
		const propertiesTr = document.getElementById('itemProperties');

		if (propertiesTr && currItemType) {
			propertiesTr.lastElementChild.innerHTML = aras.uiDrawItemInfoTable4ItemsGrid(
				currItemType,
				ItemTypeGrid.propertiesHelper
			);
		}
	};
}
