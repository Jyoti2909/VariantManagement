function BaseRelationshipsGridWrapper() {}

BaseRelationshipsGridWrapper.prototype.createGridContainer = function () {
	var self = this;
	return new Promise(function (resolve) {
		clientControlsFactory.createControl(
			'Aras.Client.Controls.Public.GridContainerWrapper',
			{
				onStartSearch_Experimental: doSearch,
				canEdit_Experimental: canEditCell,
				validateCell_Experimental: validateCell,
				freezableColumns: true,
				customRowHeight: 32
			},
			function (control) {
				grid = gridApplet = control;
				grid._grid.view.defaultSettings.editable = true;
				grid.setColumnTypeManager_Experimental('File', FilePropertyManager);
				gridReady = true;

				clientControlsFactory.on(grid.grid_Experimental, {
					onHeaderCellContextMenu: function (e) {
						onRelshipsHeaderCellContextMenu(e);
						grid.headerContexMenu_Experimental.show({
							x: e.clientX,
							y: e.clientY
						});
					},
					onHeaderContextMenu: onRelshipsHeaderContextMenu,
					onRowContextMenu: function (e) {
						const selectedRow = grid.grid_Experimental.getItem(e.rowIndex);
						const rowId = grid.grid_Experimental.store.getIdentity(selectedRow);
						grid.contexMenu_Experimental.show(
							{
								x: e.clientX,
								y: e.clientY
							},
							{
								selectedRow: rowId,
								colIndex: grid.contexMenu_Experimental.columnIndex,
								favorites: aras.getMainWindow().favorites
							}
						);
					}
				});

				clientControlsFactory.on(grid, {
					gridHeaderMenuClick_Experimental: onRelshipsHeaderMenuClicked,
					gridXmlLoaded: onXmlLoaded,
					gridClick: onSelectItem,
					gridLinkClick: function (linkVal) {
						if (linkVal.length) {
							linkVal = linkVal.replace(/'/g, '');
							var typeName = linkVal.split(',')[0];
							var id = linkVal.split(',')[1];
							if (typeName === 'File') {
								aras.uiShowItem(typeName, id, undefined);
							} else {
								onLink(typeName, id);
							}
						}
					},
					onInputHelperShow_Experimental: relshipsGrid_showInputHelperDialog,
					onStartEdit_Experimental: startCellEditRG,
					onApplyEdit_Experimental: applyCellEditRG,
					onCancelEdit_Experimental: onCancelEditHandler,
					gridMenuInit: self.gridMenuInit,
					gridMenuClick: function (cmdId, rowId, col) {
						return onRelationshipPopupMenuClicked(cmdId, rowId, col);
					},
					gridKeyPress: onKeyPressed
				});

				clientControlsFactory.on(grid.items_Experimental, {
					onNew: addNewRowEvent
				});

				grid._grid.on(
					'keydown',
					function (headId, rowId, event) {
						const isTabKeyPressed = event.key === 'Tab';
						const isLastCell =
							!event.defaultPrevented && grid.focus_Experimental.isLastCell();
						if (isTabKeyPressed && !event.shiftKey && isLastCell) {
							window.processCommand('new');
							event.preventDefault();
						}
					},
					'cell'
				);

				const relationshipItemTypeId = aras.getItemProperty(
					RelType_Nd,
					'relationship_id'
				);
				const itemTypeDescriptor = aras.getItemTypeForClient(
					relationshipItemTypeId,
					'id'
				);
				window
					.cuiContextMenu(
						new ArasModules.ContextMenu(document.body),
						'ItemView.RelationshipsGridContextMenu',
						{
							itemTypeId: relationshipItemTypeId,
							itemTypeName: itemTypeDescriptor.getProperty('name'),
							item_classification: aras.getItemProperty(
								window.item,
								'classification'
							)
						}
					)
					.then(function (contextMenu) {
						grid.contexMenu_Experimental = contextMenu;
						grid._grid.on('contextmenu', window.onContextMenuHandler);
					});

				grid.headerContexMenu_Experimental = new ContextMenuWrapper(
					document.body,
					true
				);
				grid.grid_Experimental.headerMenu =
					grid.headerContexMenu_Experimental.menu;
				cui.initPopupMenu(grid.headerContexMenu_Experimental);
				clientControlsFactory.on(
					grid.headerContexMenu_Experimental,
					'onItemClick',
					function (command, rowID, columnIndex) {
						grid.gridHeaderMenuClick_Experimental(command, rowID, columnIndex);
					}
				);
				grid.headerContexMenu_Experimental.menu.on(
					'click',
					function (commandId, e) {
						const colIndex = grid.headerContexMenu_Experimental.columnIndex;
						grid.headerContexMenu_Experimental.onItemClick(
							commandId,
							'header_row',
							colIndex
						);
					}.bind(grid)
				);

				scriptInit();
				initSearch().then(function () {
					refreshGridSize();
					aras.registerEventHandler(
						'ItemLock',
						window,
						relatedItemLockListener
					);
					aras.registerEventHandler('ItemSave', window, ItemSaveListener);
					aras.registerEventHandler('ItemDelete', window, itemDeleteListener);

					resolve();
				});
			}
		);
	});
};

BaseRelationshipsGridWrapper.prototype.canEditCell = function (
	readonly,
	isEditMode,
	isDescBy,
	propInfo,
	lockedStatusStr,
	hasRelatedItem,
	isTemp,
	hasEditState,
	rowId
) {
	const isLockedByUser = lockedStatusStr === 'user';
	const isNewRelatedItem = hasRelatedItem && isTemp;
	const isRelationshipItemInEditMode = isEditMode && isDescBy;
	const isRelatedItemCell = !isDescBy;
	let isEditableRelatedItem = hasEditState;
	if (isRelatedItemCell) {
		const relatedItem = window.item.selectSingleNode(
			`Relationships/Item[@id="${rowId}"]/related_id/Item`
		);
		isEditableRelatedItem = window.layout.state.editableItems.has(
			relatedItem.id
		);
	}

	return (
		!readonly &&
		(isRelationshipItemInEditMode ||
			(isRelatedItemCell &&
				(isLockedByUser || isNewRelatedItem) &&
				isEditableRelatedItem))
	);
};

BaseRelationshipsGridWrapper.prototype.addRow = function (
	relationshipNode,
	relatedItemNode,
	markDirty
) {
	if (!relationshipNode) {
		return;
	}

	const clonedRelationship = relationshipNode.cloneNode(true);

	if (relatedItemNode) {
		aras.setItemProperty(
			clonedRelationship,
			'related_id',
			relatedItemNode,
			false
		);
	}

	const itemId = clonedRelationship.getAttribute('id');
	const rowsInfo = window.adaptGridRowsFromXml(
		'<Result>' + clonedRelationship.xml + '</Result>',
		{
			headMap: grid._grid.head,
			indexHead: grid._grid.settings.indexHead
		}
	);

	if (relatedItemNode) {
		const relatedItemId = relatedItemNode.getAttribute('id');
		const itemType = relatedItemNode.getAttribute('type');

		const localChanges =
			window.layout && window.layout.props && window.layout.props.localChanges;

		const itemChanges =
			localChanges &&
			localChanges[itemType] &&
			localChanges[itemType][relatedItemId];

		if (itemChanges) {
			const currentItem = rowsInfo.rowsMap.get(relatedItemId);
			const adaptedItem = window.adaptGridRowFromStore(
				itemChanges,
				grid._grid.head
			);

			rowsInfo.rowsMap.set(relatedItemId, {
				...currentItem,
				...adaptedItem
			});
		}
	}

	rowsInfo.rowsMap.forEach(function (row, key) {
		grid._grid.rows._store.set(key, row);
	});
	grid._grid.settings.indexRows.push(itemId);
	if (redlineController.isRedlineActive) {
		redlineController.RefreshRedlineView();
	}
	grid._grid.render();
	grid.items_Experimental.onNew(itemId);

	addRowInProgress_Number++;
	const skipImmediateUpdate = true;
	grid.gridXmlLoaded();

	//to support removeRelationship in onInsertRow event of RelationshipType
	if (!item.selectSingleNode('Relationships/Item[@id="' + itemId + '"]')) {
		grid.deleteRow(itemId, skipImmediateUpdate);
		if (editWait) {
			clearTimeout(editWait);
		}
	}
};

BaseRelationshipsGridWrapper.prototype.deleteRelationship = function () {
	const ids = grid.getSelectedItemIds();
	if (ids.length === 0) {
		aras.AlertError(
			aras.getResource('', 'relationshipsgrid.select_relship'),
			null,
			null,
			window
		);
		return false;
	}

	const applyDataToGrid = function (item) {
		const rowsInfo = window.adaptGridRowsFromXml(
			'<Result>' + item + '</Result>',
			{
				headMap: grid._grid.head,
				indexHead: grid._grid.settings.indexHead
			}
		);
		rowsInfo.rowsMap.forEach(function (row, key) {
			grid._grid.rows._store.set(key, row);
		});
		grid._grid.render();
	};

	let rowIdToSelect;
	const storeActions = aras.getMainWindow().store.boundActionCreators;
	for (let j = 0; j < ids.length; j++) {
		let relId = ids[j];

		const clItem = aras.clipboard.getItem(relId);
		if (clItem) {
			const res = aras.confirm(
				aras.getResource(
					'',
					'relationshipsgrid.delete_from_clipboard_not_future_pasting'
				)
			);
			if (!res) {
				continue;
			}
		}

		const rel = item.selectSingleNode(
			'Relationships/Item[@id="' + relId + '"]'
		);
		if (!rel) {
			grid.deleteRow(relId);
			return false;
		}

		if (!handleRowEvent('ondeleterow', relId)) {
			return false;
		}

		const act = rel.getAttribute('action');
		let deleteRowFromGrid = false;
		if (act === 'add') {
			rel.parentNode.removeChild(rel);
			deleteRowFromGrid = true;
		} else {
			rel.setAttribute('action', 'delete');
			if (!aras.isTempID(itemID)) {
				setDirtyAttribute(item);
			}

			deleteRowFromGrid = redlineController.isRedlineActive;
		}

		if (deleteRowFromGrid) {
			grid.deleteRow(relId);
			updateToolbar();
			updateControls(relId);

			storeActions.deleteItemLocalChangesRecord(
				rel.getAttribute('type'),
				relId
			);
			const relatedItem = rel.selectSingleNode(
				'/related_id/Item[@isTemp="1" or @isEditState="1"]'
			);
			if (relatedItem) {
				const relatedItemType = relatedItem.getAttribute('type');
				const relatedItemId = relatedItem.getAttribute('id');
				const isNewItem = relatedItem.getAttribute('isTemp') === '1';
				if (isNewItem) {
					storeActions.deleteItemLocalChangesRecord(
						relatedItemType,
						relatedItemId
					);
				}
			}

			if (redlineController.isRedlineActive) {
				redlineController.RefreshRedlineView();
			}
		} else {
			applyDataToGrid(rel.xml);
			rowIdToSelect = relId;
		}

		deletedRows[relId] = 1;
		if (relationships && relationships.updateTabbarState) {
			relationships.updateTabbarState(RelType_ID);
		}
	}

	if (rowIdToSelect) {
		onSelectItem(rowIdToSelect, null, false, false);
	}
};

BaseRelationshipsGridWrapper.prototype.onXmlLoaded = function () {
	if (addRowInProgress_Number === 0) {
		if (aras.getVariable('SortPages') !== 'true') {
			grid.sort();
		}
	} else {
		addRowInProgress_Number--;
	}

	if (isToolbarUsed) {
		updateToolbar();
	}

	updateDirtyRows();

	if (redlineController.isRedlineActive) {
		redlineController.RefreshRedlineView();
	}
};
