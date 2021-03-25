function BaseRelationshipsGrid() {}

BaseRelationshipsGrid.prototype.gridMenuInit = function (
	rowID,
	col,
	extensionArgs
) {
	//Project solution based on contextMenu method
	if (window.onMenuCreate) {
		return window.onMenuCreate(rowID, col);
	}
	popupMenuRowId = rowID;
	popupMenuCol = col;
	if (isPopupDisabled) {
		return false;
	}

	var inArgs = {};
	inArgs.grid = grid;
	inArgs.propsArr = propsArr;
	inArgs.CONTROLS_STATE_ARRAY = CONTROLS_STATE_ARRAY;
	inArgs.RELATED_IT_NAME = RELATED_IT_NAME;
	inArgs.RELATED_IT_LABEL = RELATED_IT_LABEL;
	inArgs.RelType_Nd = RelType_Nd;
	inArgs.RelType_Nm = RelType_Nm;
	inArgs.RelType_Lbl = RelType_Lbl;
	inArgs.DescByItemType_Nd = DescByItemType_Nd;
	inArgs.RelatedItemType_Nd = RelatedItemType_Nd;
	inArgs.rowID = rowID;
	inArgs.col = col;
	inArgs.item = item;
	inArgs.itemType = DescByItemType_Nd;
	inArgs.onSelectItem = onSelectItem;
	inArgs.updateControls = updateControls;
	inArgs.hasRelatedItem = hasRelatedItem;
	inArgs.computeCorrectControlState = computeCorrectControlState;
	inArgs.isSpecialItemType = isSpecialItemType;
	inArgs.isWorkflowTool = isWorkflowTool;
	inArgs.isFunctionDisabled = isFunctionDisabled;
	inArgs.getPasteFlg = getPasteFlg;
	inArgs.getUnlockFlg = getUnlockFlg;
	inArgs.relationshipTypeActions = relationshipTypeActions;
	inArgs.relationshipActions = relationshipActions;

	if (extensionArgs) {
		Object.assign(inArgs, extensionArgs);
	}
	if (toolbar) {
		return cui.fillPopupMenu(
			'PopupMenuRelationshipGrid',
			grid.getMenu_Experimental(),
			inArgs
		);
	}
};

BaseRelationshipsGrid.prototype.getToolbarXml = function () {
	if (WorkFlowProc != '1') {
		return aras.getI18NXMLResource('relationshipsGrid_toolbar.xml');
	} else {
		return aras.getI18NXMLResource('relationshipsGrid_toolbaforInstanceWf.xml');
	}
};

BaseRelationshipsGrid.prototype.loadToolbar = function (toolbarXml) {
	toolbar.loadXml(toolbarXml || this.getToolbarXml());
	toolbar.show();
	toolbar.showLabels(
		aras.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_show_labels'
		) === 'true'
	);
	initToolbar();
};

BaseRelationshipsGrid.prototype.createGridContainer = function () {
	const self = this;
	const virtualGridNode = document.createDocumentFragment();
	return new Promise(function (resolve) {
		clientControlsFactory.createControl(
			'Aras.Client.Controls.Public.GridContainer',
			{
				connectNode: virtualGridNode,
				onStartSearch_Experimental: doSearch,
				canEdit_Experimental: canEditCell,
				validateCell_Experimental: validateCell,
				customRowHeight: 32
			},
			function (control) {
				grid = gridApplet = control;
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
					onRowContextMenu: window.onContextMenuHandler
				});

				clientControlsFactory.on(grid, {
					gridHeaderMenuClick_Experimental: onRelshipsHeaderMenuClicked,
					gridDoubleClick: onDoubleClick,
					gridXmlLoaded: onXmlLoaded,
					gridClick: onSelectItem,
					gridLinkClick: function (linkVal) {
						if (linkVal.length) {
							linkVal = linkVal.replace(/'/g, '');
							var typeName = linkVal.split(',')[0];
							var id = linkVal.split(',')[1];
							onLink(typeName, id);
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

				require([
					'dojo/_base/connect',
					'Aras/Client/Controls/Experimental/ContextMenuWrapper'
				], function (connect) {
					grid._headerContextMenuHandlerId.remove();
					grid.contexMenu_Experimental.menu.destroyRecursive();
					grid.headerContexMenu_Experimental.menu.destroyRecursive();
					// this checking will be remove in future (when new context menu will be implemented).
					// now it is used to enable QA to test new context menu during implementation
					const isNewCUIContextMenuUsed = !toolbar;
					if (isNewCUIContextMenuUsed) {
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

								const gridViewNode = grid.grid_Experimental.viewsNode.querySelector(
									'.dojoxGridScrollbox'
								);
								if (gridViewNode) {
									gridViewNode.addEventListener(
										'contextmenu',
										window.onContextMenuHandler
									);
								}
							});
					} else {
						grid.contexMenu_Experimental = new ContextMenuWrapper(
							document.body
						);
						cui.initPopupMenu(grid.contexMenu_Experimental);
						connect.connect(
							grid.contexMenu_Experimental,
							'onItemClick',
							grid,
							function (command, rowID, columnIndex) {
								this.gridMenuClick(command, rowID, columnIndex);
							}
						);
						grid.contexMenu_Experimental.menu.on(
							'click',
							function (commandId, e, args) {
								grid.contexMenu_Experimental.onItemClick(
									commandId,
									args.selectedRow,
									args.colIndex
								);
							}.bind(grid)
						);
					}

					grid.headerContexMenu_Experimental = new ContextMenuWrapper(
						document.body,
						true
					);
					grid.grid_Experimental.headerMenu =
						grid.headerContexMenu_Experimental.menu;
					cui.initPopupMenu(grid.headerContexMenu_Experimental);
					connect.connect(
						grid.headerContexMenu_Experimental,
						'onItemClick',
						grid,
						function (command, rowID, columnIndex) {
							this.gridHeaderMenuClick_Experimental(
								command,
								rowID,
								columnIndex
							);
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
				});

				scriptInit();
				resolve(initSearch());
			}
		);
	}).then(function () {
		document.getElementById('gridTD').appendChild(virtualGridNode);
		// refresh method must be called only when toolbar completelly initialized

		if (toolbar && isToolbarUsed) {
			toolbar.refreshToolbar_Experimental();
		}
		refreshGridSize();
		aras.registerEventHandler('ItemLock', window, relatedItemLockListener);
		aras.registerEventHandler('ItemSave', window, ItemSaveListener);
	});
};

BaseRelationshipsGrid.prototype.createToolbar = function () {
	const control = new ToolbarWrapper({
		id: 'top_toolbar',
		connectId: 'toolbarContainer',
		useCompatToolbar: true
	});
	toolbar = control;
	document.toolbar = toolbar;

	toolbarReady = true;
	loadToolbar();
	toolbar._toolbar.on('click', function (itemId) {
		var item = toolbar.getItem(itemId);
		itemId = item.getId();
		if (
			itemId != 'search' &&
			itemId !== 'newsearch' &&
			itemId !== 'stop_search' &&
			itemId !== 'select_all'
		) {
			onToolbarButtonClick(item);
		}
		if (itemId === 'newsearch') {
			columnSelectionMediator.xClassBarWrapper.setQueryText();
		}
		if (itemId === 'search' || itemId === 'newsearch') {
			refreshGridSize();
		}
	});
	toolbar._toolbar.on('dropDownItemClick', function (itemId, event) {
		onRelationshipsMenuClickItem(event.detail.optionId);
	});

	return Promise.resolve();
};

BaseRelationshipsGrid.prototype.computeColWidhtOrder = function (
	additionalRelatedVisibleProps
) {
	DescByItemType_ID = aras.getItemProperty(RelType_Nd, 'relationship_id');
	DescByItemType_Nd = aras.getItemTypeNodeForClient(
		aras.getItemTypeName(DescByItemType_ID)
	);

	RelatedItemType_ID = aras.getItemProperty(RelType_Nd, 'related_id');
	if (RelatedItemType_ID) {
		RelatedItemType_Nd = aras.getItemTypeNodeForClient(
			aras.getItemTypeName(RelatedItemType_ID)
		);

		RELATED_IT_NAME = aras.getItemProperty(RelatedItemType_Nd, 'name');
		RELATED_IT_LABEL = aras.getItemProperty(RelatedItemType_Nd, 'label');
		if (RELATED_IT_LABEL === '') {
			RELATED_IT_LABEL = RELATED_IT_NAME;
		}
		RELATED_IS_DEPENDENT =
			aras.getItemProperty(RelatedItemType_Nd, 'is_dependent') == '1';
	}

	AUTO_SEARCH_FLAG = aras.getItemProperty(RelType_Nd, 'auto_search') == '1';
	pagesize = aras.getPreferenceItemProperty(
		'Core_RelGridLayout',
		RelType_ID,
		'page_size'
	);
	if (!pagesize) {
		pagesize = aras.getItemProperty(RelType_Nd, 'default_page_size');
	}
	MAX_OCCURS = aras.getItemProperty(RelType_Nd, 'max_occurs');
	MIN_OCCURS = aras.getItemProperty(RelType_Nd, 'min_occurs');
	if (pagesize == '0') {
		pagesize = '';
	}
	if (pagesize) {
		pagesize = parseInt(pagesize);
	}
	if (MAX_OCCURS) {
		MAX_OCCURS = parseInt(MAX_OCCURS);
	}
	if (MIN_OCCURS) {
		MIN_OCCURS = parseInt(MIN_OCCURS);
	}

	// +++ global variables to use custom event handlers
	relatedItemTypeName = RELATED_IT_NAME;
	relationshipTypeName = RelType_Nm;
	// --- global variables to use custom event handlers

	var xpath =
		"Relationships/Item[@type='Property' and (not(is_hidden2) or is_hidden2='0')]";

	DescByVisibleProps = DescByItemType_Nd
		? DescByItemType_Nd.selectNodes(xpath)
		: null;
	RelatedVisibleProps = RelatedItemType_Nd
		? RelatedItemType_Nd.selectNodes(xpath)
		: null;

	if (additionalRelatedVisibleProps) {
		RelatedVisibleProps = Array.prototype.slice
			.call(RelatedVisibleProps)
			.concat(additionalRelatedVisibleProps);
	}

	DescByVisibleProps = aras.sortProperties(DescByVisibleProps);
	RelatedVisibleProps = aras.sortProperties(RelatedVisibleProps);

	var xPropertiesXPath =
		"Relationships/Item[@type='xItemTypeAllowedProperty']/related_id/Item[@type='xPropertyDefinition']";
	if (DescByItemType_Nd) {
		DescByVisibleProps = DescByVisibleProps.concat(
			ArasModules.xml.selectNodes(DescByItemType_Nd, xPropertiesXPath)
		);
	}
	if (RelatedItemType_Nd) {
		RelatedVisibleProps = RelatedVisibleProps.concat(
			ArasModules.xml.selectNodes(RelatedItemType_Nd, xPropertiesXPath)
		);
	}

	var grid_view = aras.getItemProperty(RelType_Nd, 'grid_view');
	aras.uiInitRelationshipsGridSetups(
		RelType_ID,
		DescByVisibleProps,
		RelatedVisibleProps,
		grid_view
	);

	propsArr = [];
	fieldsArr = [];

	function addPropsFromArr(arr, DRL) {
		if (!arr) {
			return false;
		}

		for (var i = 0; i < arr.length; i++) {
			var prop = arr[i];
			var propNm = aras.getItemProperty(prop, 'name');
			var propDRL = DRL;
			var data_type = aras.getItemProperty(prop, 'data_type');
			var data_source = aras.getItemProperty(prop, 'data_source');
			var propID_val = prop.getAttribute('id');
			var order_by = aras.getItemProperty(prop, 'order_by');

			fieldsArr.push(propNm + '_' + propDRL);
			propsArr.push({
				name: propNm,
				DRL: propDRL,
				data_type: data_type,
				data_source: data_source,
				propID: propID_val,
				order_by: order_by
			});
		}
	}

	if (RelatedVisibleProps) {
		fieldsArr.push('L');
		propsArr.push({
			name: 'L',
			DRL: 'L',
			data_type: '',
			data_source: '',
			propID: '',
			order_by: ''
		});
	}

	addPropsFromArr(DescByVisibleProps, 'D');
	addPropsFromArr(RelatedVisibleProps, 'R');
};

BaseRelationshipsGrid.prototype.showRelatedItemById = function (relID) {
	var ritem = item.selectSingleNode(
		'Relationships/Item[@id="' +
			relID +
			'"]/related_id[not(@discover_only="1")]/Item'
	);
	if (!ritem || ritem.getAttribute('loadedPartialy') != '0') {
		mergeWithServerDataIfRequired(relID);
		ritem = item.selectSingleNode(
			'Relationships/Item[@id="' +
				relID +
				'"]/related_id[not(@discover_only="1")]/Item'
		);
	}
	return this.showRelatedItem(ritem, relID);
};

BaseRelationshipsGrid.prototype.showRelatedItem = function (ritem, relID) {
	if (!ritem) {
		return false;
	}

	ritem = aras.replacePolyItemNodeWithNativeItem(ritem);

	var ritemID = ritem.getAttribute('id');
	var win = aras.uiFindWindowEx(ritemID);
	if (
		win &&
		(win.fromRelationships === undefined || win.fromRelationships != itemID)
	) {
		aras.AlertError(
			aras.getResource('', 'relationshipsgrid.already_open'),
			null,
			null,
			window
		);
		return true;
	}

	aras.uiShowItemEx(ritem, 'tab view').then(function () {
		win = aras.uiFindWindowEx(ritemID);
		if (win) {
			win.fromRelationships = itemID;
			if (!grid._grid) {
				new Synchronizer(relID, win);
			}
		}
	});

	return true;
};

BaseRelationshipsGrid.prototype.showRelationshipById = function (relID) {
	const rel = item.selectSingleNode(
		'Relationships/Item[@id="' + relID + '" and not(@discover_only="1")]'
	);
	if (!rel) {
		return false;
	}
	mergeWithServerDataIfRequired(relID);

	let win = aras.uiFindWindowEx(relID);
	if (
		win &&
		(win.fromRelationships === undefined || win.fromRelationships !== itemID)
	) {
		aras.AlertError(
			aras.getResource('', 'relationshipsgrid.already_open'),
			null,
			null,
			window
		);
		return true;
	}

	aras.uiShowItemEx(rel, 'tab view').then(function () {
		win = aras.uiFindWindowEx(relID);
		if (win) {
			win.fromRelationships = itemID;
			if (!grid._grid) {
				new Synchronizer(relID, win);
			}
		}
	});

	return true;
};

BaseRelationshipsGrid.prototype.processCommand = function (cmdId, col) {
	var gridXmlCallback;
	var res;
	var id;
	switch (cmdId) {
		case 'new':
			if (propsArr.length === 0) {
				aras.AlertError(
					aras.getResource('', 'relationshipsgrid.no_visible_props'),
					null,
					null,
					window
				);
				return;
			}
			if (getSelectedChoiceItem() == PickRelatedOption) {
				setTimeout(function () {
					newRelationship(true);
				}, 1);
			} else {
				if (
					aras.getItemProperty(RelatedItemType_Nd, 'name') == 'File' &&
					getSelectedChoiceItem() == CreateRelatedOption
				) {
					if (isAltKeyPressed) {
						res = aras.SelectFileFromPackage('FE_SelectFileFromPackage', true);
						if (res && res.length !== 0) {
							for (var i = 0; i < res.getItemCount(); i++) {
								var itm = res.getItemByIndex(i);
								if (!itm) {
									continue;
								}
								addRelationship(itm.node);
							}
						}
					} else {
						topWindow_Experimental.ArasModules.vault
							.selectFile()
							.then(function (file) {
								var fileNode = aras.newItem('File', file);
								newRelationship(false, fileNode);
							});
					}
				} else {
					newRelationship(
						false,
						getSelectedChoiceItem() == NoRelatedOption ? null : undefined
					);
				}
			}
			break;
		case 'pick_replace':
			setTimeout(function () {
				changeRelationship(true);
			}, 1);
			break;
		case 'remove':
			removeRelatedItem();
			break;
		case 'delete':
			deleteRelationship();
			break;
		case 'export2Excel':
			gridXmlCallback = function () {
				return grid.getXML(true);
			};
			aras.export2Office(gridXmlCallback, cmdId);
			break;
		case 'export2Word':
			gridXmlCallback = function () {
				return grid.getXML(false);
			};
			aras.export2Office(gridXmlCallback, cmdId);
			break;
		case 'lock':
			lockRelatedItem(true);
			break;
		case 'unlock':
			lockRelatedItem(false);
			break;
		case 'search':
			onSearchCommand();
			break;
		case 'promote':
			promoteRelationship();
			break;
		case 'show_item':
			id = grid.getSelectedId();
			if (!id) {
				aras.AlertError(
					aras.getResource('', 'relationshipsgrid.select_row'),
					null,
					null,
					window
				);
				return false;
			}

			res = showRelatedItemById(id);
			if (!res) {
				aras.AlertError(
					aras.getResource(
						'',
						'relationshipsgrid.try_view',
						RELATED_IT_NAME,
						RelType_Nm
					),
					null,
					null,
					window
				);
			}
			return res;
		case 'show_relationship':
			id = grid.getSelectedId();
			if (!id) {
				aras.AlertError(
					aras.getResource('', 'relationshipsgrid.select_row'),
					null,
					null,
					window
				);
				return false;
			}
			return showRelationshipById(id);
		case 'show_file':
			showFileFromCell();
			break;
		case 'getLP':
			relGetLP();
			break;
		case 'deleteLP':
			relDeleteLP();
			break;
		case 'promote':
			relPromote();
			break;
		case 'deleteHistory':
			relDeleteHistory();
			break;
		case 'copy2clipboard':
			onCopy2Clipboard();
			break;
		case 'paste':
			onPaste();
			break;
		case 'paste_special':
			onPasteSpecial();
			break;
		case 'redline':
			redlineController.ToggleRedline();
			break;
		case 'addItem2Package':
			var relatedIds = [];
			grid.getSelectedItemIds().forEach(function (relationshipItemId) {
				relatedIds.push(
					item.selectSingleNode(
						'Relationships/Item[@id="' +
							relationshipItemId +
							'"]/related_id/Item/@id'
					).text
				);
			});
			aras.addItemToPackageDef(relatedIds, RELATED_IT_NAME);
			break;
	}
};

BaseRelationshipsGrid.prototype.onXmlLoaded = function () {
	if (addRowInProgress_Number === 0) {
		if (isGridSortingDefined) {
			grid.sort();
		} else {
			calculateSortPriority(aras.getItemProperty(RelType_Nd, 'grid_view'));
			sortRowByDefault();
			const styledGrid =
				window.customDojoGridStyle &&
				window.customDojoGridStyle.supportGridIds.indexOf(
					grid.connectId_Experimental
				) > -1;
			if (styledGrid) {
				grid.grid_Experimental.render();
			}
			isGridSortingDefined = true;
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

BaseRelationshipsGrid.prototype.onSelectItem = function (
	rowId,
	col,
	generateEvent,
	processAllSelected,
	loadItemFromServer
) {
	if (rowId == 'header_row') {
		return;
	} else if (grid.isRedlineRow_Experimental(rowId)) {
		updateControls(rowId);
		return;
	}

	var skipColSelect = false;
	if (col === undefined || col === null) {
		skipColSelect = true;
	}
	if (generateEvent === undefined) {
		generateEvent = true;
	}
	if (processAllSelected === undefined) {
		processAllSelected = true;
	}

	if (processAllSelected) {
		var ids = grid.getSelectedItemIds();
		for (var i = 0; i < ids.length; i++) {
			if (ids[i] === '' || grid.isRedlineRow_Experimental(ids[i])) {
				continue;
			}

			if (loadItemFromServer) {
				mergeWithServerDataIfRequired(ids[i]);
			}

			var aRel = item.selectSingleNode(
				"Relationships/Item[@id='" + ids[i] + "']"
			);
			if (!aRel) {
				aras.AlertError(
					aras.getResource('', 'relationshipsgrid.failed_get_item', RelType_Nm),
					null,
					null,
					window
				);
				return;
			}
		}
	}

	updateControls(rowId);

	var selectedIds = grid.getSelectedItemIds();
	if (rowId && selectedIds.indexOf(rowId) > -1) {
		if (!skipColSelect) {
			currSelCell = grid.cells(rowId, col);
			currSelCol = col;
		}
		currSelRowId = rowId;
	}

	if (generateEvent) {
		handleRowEvent('onselectrow', rowId);
	}
};

BaseRelationshipsGrid.prototype.onDoubleClick = function (rowId) {
	if (isEditMode) {
		return true;
	}

	if (computeCorrectControlState('show_item') && showRelatedItemById(rowId)) {
		return true;
	} else if (computeCorrectControlState('show_relationship')) {
		return showRelationshipById(rowId);
	}
	return false;
};

BaseRelationshipsGrid.prototype.deleteRelationship = function () {
	var ids = grid.getSelectedItemIds();
	if (ids.length === 0) {
		aras.AlertError(
			aras.getResource('', 'relationshipsgrid.select_relship'),
			null,
			null,
			window
		);
		return false;
	}

	var rowIdToSelect;
	for (var j = 0; j < ids.length; j++) {
		var relId = ids[j];
		if (!relId) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.select_relship'),
				null,
				null,
				window
			);
			return false;
		}

		var clItem = aras.clipboard.getItem(relId);
		if (clItem) {
			var res = aras.confirm(
				aras.getResource(
					'',
					'relationshipsgrid.delete_from_clipboard_not_future_pasting'
				)
			);
			if (!res) {
				continue;
			}
		}

		var rel = item.selectSingleNode('Relationships/Item[@id="' + relId + '"]');
		if (!rel) {
			grid.deleteRow(relId);
			return false;
		}

		if (!handleRowEvent('ondeleterow', relId)) {
			return false;
		}

		var act = rel.getAttribute('action');
		var deleteRowFromGrid = false;
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

			if (redlineController.isRedlineActive) {
				redlineController.RefreshRedlineView();
			}
		} else {
			for (var i = 0; i < grid.GetColumnCount(); i++) {
				var cell = grid.cells(relId, i);
				cell.setFont(deletedFont_const);
				cell.setTextColor(deletedTextColor_const);
			}

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

BaseRelationshipsGrid.prototype.syncWithClient = function (resDom) {
	const res = resDom.selectSingleNode(aras.XPathResult());
	const xpath_start = "Relationships/Item[@type='" + RelType_Nm + "' and (";

	if (!item) {
		//this is possible in Workflow Map Editor. IR-004193
		return;
	}

	//update relationships with the information returned from server
	updateRelationshipsWithInformationFromSearch(res.selectNodes('Item'));

	//update information in response from server with data modified on client side
	let items = ArasModules.xml.selectNodes(
		item,
		xpath_start +
			" (@action='delete' or @action='purge') or (@isTemp='1' or @isDirty='1') or related_id/Item[@isEditState='1'])]"
	);

	items.forEach(function (itemNode) {
		const itemId = itemNode.getAttribute('id');

		const duplicateItem = res.selectSingleNode("Item[@id='" + itemId + "']");
		if (duplicateItem) {
			res.replaceChild(itemNode.cloneNode(true), duplicateItem);
		} else if (aras.isDirtyEx(itemNode) || aras.isTempEx(itemNode)) {
			res.appendChild(itemNode.cloneNode(true));
		}
	});

	if (redlineController.isRedlineActive) {
		const relsToRemoveNodes = ArasModules.xml.selectNodes(
			res,
			"Item[@type='" +
				RelType_Nm +
				"' and (@action='delete' or @action='purge')]"
		);
		relsToRemoveNodes.forEach(function (itemNode) {
			res.removeChild(itemNode);
		});
	}

	if (RELATED_IT_NAME !== '') {
		items = ArasModules.xml.selectNodes(
			res,
			"Item[@type='" +
				RelType_Nm +
				"' " +
				" and related_id and not(related_id/Item) and related_id != '' " +
				']'
		);

		for (let i = 0; i < items.length; i++) {
			const itm = items[i];
			const relatedId = aras.getItemProperty(itm, 'related_id');

			const relatedItem = aras.getItemById(RELATED_IT_NAME, relatedId, 0);
			if (!relatedItem) {
				continue;
			}

			const itemKeyedName = aras.getKeyedNameEx(relatedItem);
			const relatedIdNode = itm.selectSingleNode('related_id');
			relatedIdNode.text = '';
			relatedIdNode.appendChild(relatedItem.cloneNode(true));
			relatedIdNode.setAttribute('keyed_name', itemKeyedName);
		}
	}
};

BaseRelationshipsGrid.prototype.addRow = function (
	relationshipNode,
	relatedItemNode,
	markDirty
) {
	if (!relationshipNode) {
		return false;
	}

	//clonedRelationship is a temporary copy of a relationship. Is used only to generate grid row xml.
	var clonedRelationship = relationshipNode.cloneNode(true);
	var sourceDom = createEmptyResultDom();
	var tmpDom = createEmptyResultDom();
	var targetNode = sourceDom.selectSingleNode(aras.XPathResult());
	var rowNode;
	var gridXml;
	var rowId;

	if (relatedItemNode) {
		aras.setItemProperty(
			clonedRelationship,
			'related_id',
			relatedItemNode.cloneNode(true),
			false
		);
	}

	targetNode.appendChild(clonedRelationship);
	const columnObjects = aras.uiPrepareDOM4XSLT(sourceDom, RelType_ID, 'RT_');

	gridXml = getGenerateRelationshipsGridXML(sourceDom, columnObjects);
	tmpDom.loadXML(gridXml);
	rowNode = tmpDom.selectSingleNode('/table/tr');
	rowNode.setAttribute('rowState', 'new');

	addRowInProgress_Number++;
	const skipImmediateUpdate = true;
	grid.addXMLRows_Experimental(
		'<table>' + rowNode.xml + '</table>',
		skipImmediateUpdate
	);

	//to support removeRelationship in onInsertRow event of RelationshipType
	rowId = rowNode.getAttribute('id');
	if (!item.selectSingleNode('Relationships/Item[@id="' + rowId + '"]')) {
		grid.deleteRow(rowId, skipImmediateUpdate);
		if (editWait) {
			clearTimeout(editWait);
		}
	}
};

BaseRelationshipsGrid.prototype.addNewRowEvent = function (id) {
	if (callback4NewCmd) {
		if (editWait) {
			clearTimeout(editWait);
		}

		callback4NewCmd(id, callbackFunction4NewCmd_data_bf);
		callbackFunction4NewCmd_data_bf = true;
		callback4NewCmd = null;
	}
};

BaseRelationshipsGrid.prototype.updateControls = function (
	rowId,
	doRepaint,
	relFiles,
	relatedFiles
) {
	var ids = grid.getSelectedItemIds();

	doRepaint = Boolean(doRepaint);
	var purgeFlag;
	if (isToolbarUsed && ids.length > 1) {
		purgeFlag = computeCorrectControlState('delete');

		setAllControlsEnabled(false);
		setControlEnabled('new', computeCorrectControlState('new'));
		setControlEnabled(
			'copy2clipboard',
			!isWorkflowTool() && !isFunctionDisabled(itemTypeName, 'Copy')
		);
		setControlEnabled('paste', getPasteFlg());
		setControlEnabled('paste_special', getPasteSpecialFlg());

		if (!purgeFlag || doRepaint) {
			setupMenu4Relationship('remove');
		} else {
			setupMenu4Relationship('add');
		}

		setControlEnabled('delete', purgeFlag);
		setControlEnabled('lock', computeCorrectControlState('lock'));
		setControlEnabled('unlock', getUnlockFlg());
		setControlEnabled('select_all', true);
		setControlEnabled('search', true);
	} else {
		var selectedItem = item.selectSingleNode(
			'Relationships/Item[@id="' + rowId + '"]'
		);
		var relatedItem = selectedItem
			? selectedItem.selectSingleNode('related_id/Item')
			: null;
		var isSelectionExists = ids.length > 0;
		purgeFlag = computeCorrectControlState('delete');
		var promoteFlg =
			selectedItem &&
			!aras.isLocked(selectedItem) &&
			!aras.isTempEx(selectedItem) &&
			!isFunctionDisabled(relationshipTypeName, 'Promote');

		if (!relatedFiles && RelatedItemType_Nd && relatedItem) {
			relatedFiles = aras.getItemsOfFileProperties(
				relatedItem,
				RelatedItemType_Nd
			);

			if (relatedFiles[0]) {
				FilesCache[relatedFiles[0].getAttribute('id')] = relatedFiles[0];
			}
		}

		if (selectedItem) {
			if (isToolbarUsed) {
				setupMenu4Relationship(purgeFlag ? 'add' : 'remove');

				setControlEnabled('delete', purgeFlag);
				setControlEnabled(
					'pick_replace',
					replaceButtonEnabled &&
						purgeFlag &&
						!isFunctionDisabled(relationshipTypeName, 'Pick Replace')
				);
				setControlEnabled(
					'lock',
					computeCorrectControlState('lock', selectedItem, null, relatedFiles)
				);
				setControlEnabled('unlock', getUnlockFlg());
				setControlEnabled('promote', promoteFlg);
				setControlEnabled('show_item', computeCorrectControlState('show_item'));
				setControlEnabled(
					'show_relationship',
					computeCorrectControlState('show_relationship')
				);
			}

			if (isSpecialItemType()) {
				setControlEnabled('copy2clipboard', false);
				setControlEnabled('paste', false);
				setControlEnabled('paste_special', false);
			} else {
				setControlEnabled(
					'copy2clipboard',
					!isWorkflowTool() &&
						isSelectionExists &&
						!isFunctionDisabled(relationshipTypeName, 'Copy')
				);
				setControlEnabled('paste', getPasteFlg());
				setControlEnabled('paste_special', getPasteSpecialFlg());
			}
		} else {
			if (isToolbarUsed) {
				setAllControlsEnabled(false);
				setControlEnabled('new', computeCorrectControlState('new'));
				setControlEnabled('search', true);

				if (grid.getRowCount() > 0) {
					setControlEnabled('select_all', true);
				}
			}

			setupMenu4Relationship('remove');
		}
	}

	if (window.notifyCuiLayout) {
		window.notifyCuiLayout('UpdateTearOffWindowState');
	}
};

BaseRelationshipsGrid.prototype.isSpecialItemType = function () {
	return (
		itemTypeName === 'Life Cycle State' ||
		itemTypeName === 'Transition EMail' ||
		itemTypeName === 'Life Cycle Transition' ||
		itemTypeName === 'State EMail'
	);
};

BaseRelationshipsGrid.prototype.getUnlockFlg = function () {
	var ids = grid.getSelectedItemIds();
	if (ids.length === 0) {
		return false;
	}

	for (var i = 0; i < ids.length; i++) {
		var rowId = ids[i];
		var locked = getLockedStatusStr(rowId);

		if (locked === 'alien' && aras.isAdminUser()) {
			//means "can unlock"
		} else if (locked !== 'user') {
			return false;
		}
	}
	return true;
};

BaseRelationshipsGrid.prototype.computeCorrectControlState = function (
	controlName,
	arg1,
	relFiles,
	relatedFiles
) {
	/*
	 IMPORTANT: If you use arg1 then ALWAYS check if arg1 was actually passed into the
	 function because some tools (for example Workflow tool) override the function and
	 perhaps don't pass the parameter.
	 */
	if (!item || !grid) {
		return false;
	}

	var selectedRowIds = grid.getSelectedItemIds();
	var isSelectionExists = selectedRowIds.length > 0;
	var isSingleSelection = selectedRowIds.length === 1;
	var i;
	var rowId;
	var relationshipNode;
	var nodeAction;
	switch (controlName) {
		case 'new':
			if (
				!isEditMode ||
				!canNewFlag ||
				isFunctionDisabled(relationshipTypeName, 'New')
			) {
				return false;
			}

			var relationshipNodes = item.selectNodes(
				"Relationships/Item[@type='" +
					RelType_Nm +
					"' " +
					"and (not(@action) or @action!='delete' and @action!='purge')]"
			);
			var nodesCount = relationshipNodes.length;

			return MAX_OCCURS === '' || nodesCount - MAX_OCCURS < 0;
		case 'delete':
			if (
				!isEditMode ||
				!isSelectionExists ||
				isFunctionDisabled(relationshipTypeName, 'Delete')
			) {
				return false;
			} else {
				for (i = 0; i < selectedRowIds.length; i++) {
					rowId = selectedRowIds[i];
					relationshipNode = item.selectSingleNode(
						"Relationships/Item[@id='" + rowId + "']"
					);

					if (!relationshipNode) {
						return false;
					} else {
						nodeAction = relationshipNode.getAttribute('action');

						if (nodeAction === 'purge' || nodeAction === 'delete') {
							return false;
						}
					}
				}
			}

			return true;
		case 'show_relationship':
			if (isSingleSelection) {
				rowId = selectedRowIds[0];
				relationshipNode = item.selectSingleNode(
					"Relationships/Item[@id='" + rowId + "' and not(@discover_only='1')]"
				);

				if (relationshipNode) {
					nodeAction = relationshipNode.getAttribute('action');

					if (nodeAction != 'purge' && nodeAction != 'delete') {
						var formID = aras.uiGetFormID4ItemEx(relationshipNode, 'view');

						return !!formID;
					}
				}
			}

			return false;
		case 'show_item':
			if (relatedItemTypeName) {
				if (isSingleSelection) {
					rowId = selectedRowIds[0];
					var relatedItem = item.selectSingleNode(
						"Relationships/Item[@id='" +
							rowId +
							"']/related_id[not(@discover_only='1')]/Item"
					);

					return Boolean(relatedItem);
				}
			}

			return false;
		case 'remove':
			return replaceToNull && isEditMode && relatedItemTypeName && arg1;
		case 'lock':
			if (isFunctionDisabled(relationshipTypeName, 'Lock')) {
				return false;
			}

			if (relatedItemTypeName === 'File') {
				return false;
			} else {
				if (!isSelectionExists) {
					return false;
				} else {
					var locked;
					for (i = 0; i < selectedRowIds.length; i++) {
						rowId = selectedRowIds[i];
						locked = getLockedStatusStr(rowId);

						if (locked) {
							return false;
						}
					}
				}

				return true;
			}
			break;
		case 'unlock':
			return (
				arg1 &&
				(aras.isLockedByUser(arg1) ||
					(aras.isLocked(arg1) && loginName.search(/^admin$|^root$/) === 0))
			);
		default:
			return true;
	}
};

BaseRelationshipsGrid.prototype.canEditCell = function (
	readonly,
	isEditMode,
	isDescBy,
	propInfo,
	lockedStatusStr,
	hasRelatedItem,
	isTemp,
	hasEditState
) {
	return (
		!readonly &&
		((isEditMode && isDescBy) ||
			(propInfo.DRL === 'R' &&
				(lockedStatusStr === 'user' || (hasRelatedItem && isTemp)) &&
				hasEditState))
	);
};

BaseRelationshipsGrid.prototype.getPropsForColumnDialog = function () {
	const propsToShow = [];
	const colOrderArr = grid.getLogicalColumnOrder().split(';');

	for (let i = 0; i < colOrderArr.length; i++) {
		if (grid.getColWidth(i) == 0) {
			let propLabel = '';
			let propName = '';
			let propWidth = 100;
			const colNm = grid.GetColumnName(i);
			if (colNm == 'L') {
				propLabel = aras.getResource('', 'common.claimed');
				propWidth = 24;
			} else {
				const propertyName = colNm.substr(0, colNm.length - 2);
				for (let j = 0; j < DescByVisibleProps.length; j++) {
					if (
						aras.getItemProperty(DescByVisibleProps[j], 'name') == propertyName
					) {
						propLabel = aras.getItemProperty(DescByVisibleProps[j], 'label');
						propName = aras.getItemProperty(DescByVisibleProps[j], 'name');
						if (propLabel == '') {
							propLabel = propertyName;
						}

						const tempWidth = parseInt(
							aras.getItemProperty(DescByVisibleProps[j], 'column_width')
						);
						if (!isNaN(tempWidth)) {
							propWidth = tempWidth;
						}
						break;
					}
				}

				if (RelatedVisibleProps) {
					for (let j = 0; j < RelatedVisibleProps.length; j++) {
						if (
							aras.getItemProperty(RelatedVisibleProps[j], 'name') ==
							propertyName
						) {
							propLabel = aras.getItemProperty(RelatedVisibleProps[j], 'label');
							propName = aras.getItemProperty(RelatedVisibleProps[j], 'name');
							if (propLabel == '') {
								propLabel = propertyName;
							}

							const tempWidth = parseInt(
								aras.getItemProperty(RelatedVisibleProps[j], 'column_width')
							);
							if (!isNaN(tempWidth)) {
								propWidth = tempWidth;
							}
							break;
						}
					}
				}
			}
			const propType = colNm.substring(colNm.length - 2, colNm.length);
			propsToShow.push({
				colNumber: i,
				label: propLabel,
				name: propName,
				width: propWidth,
				type: propType
			});
		}
	}
	return propsToShow;
};

BaseRelationshipsGrid.prototype.onCopy2Clipboard = function () {
	const itemIDs = grid.getSelectedItemIds();
	const itemArr = [];

	if (itemIDs.length > 1) {
		preloadItems(relationshipTypeName, itemIDs);
	}

	for (let i = 0; i < itemIDs.length; i++) {
		const itemID = itemIDs[i];
		const relationshipItem = item.selectSingleNode(
			'Relationships/Item[@id="' + itemID + '"]'
		);

		if (relationshipItem) {
			if (
				relationshipItem.getAttribute('isTemp') ||
				relationshipItem.getAttribute('isDirty')
			) {
				alert(aras.getResource('', 'relationshipsgrid.copy_without_saving'));
				return;
			}

			const copiedItem = aras.copyRelationship(relationshipTypeName, itemID);
			if (copiedItem) {
				itemArr.push(copiedItem);
			} else {
				aras.AlertError(
					aras.getResource('', 'relationshipsgrid.failed_get_item_id', itemID),
					null,
					null,
					window
				);
			}
		}
	}

	aras.clipboard.copy(itemArr);
	updateControls(itemIDs[0]);

	if (topWindow_Experimental.updateMenuState) {
		topWindow_Experimental.updateMenuState();
	}

	if (topWindow_Experimental.updateItemsGrid) {
		topWindow_Experimental.updateItemsGrid(item);
	}
};

BaseRelationshipsGrid.prototype.onPaste = function () {
	const relsArr = aras.clipboard.paste();
	const as_is_Flg =
		aras.getItemProperty(RelType_Nd, 'copy_permissions') === '1';
	const as_new_Flg = aras.getItemProperty(RelType_Nd, 'create_related') === '1';

	return this.onPaste_internal(relsArr, as_is_Flg, as_new_Flg);
};

BaseRelationshipsGrid.prototype.onPasteSpecial = function () {
	const params = {
		aras: aras,
		title: aras.getResource('', 'clipboardmanager.clipboard_manager'),
		itemsArr: new Array(item),
		srcItemTypeId: aras.getItemTypeId(itemTypeName),
		targetRelationshipTN: RelType_Nm,
		targetRelatedTN: RELATED_IT_NAME,
		dialogHeight: 450,
		dialogWidth: 700,
		content: 'ClipboardManager.html'
	};
	(
		topWindow_Experimental.main || topWindow_Experimental
	).ArasModules.Dialog.show('iframe', params).promise.then(
		function (res) {
			if (!res || !res.ids) {
				return false;
			}
			const clipboardItems = aras.clipboard.clItems;
			// res.ids is created in context of iframe and need to be free, that's because we copy indexes array into new array
			const ids = [].slice.call(res.ids);
			const relsArr = ids.map(function (value) {
				return clipboardItems[value];
			});
			this.onPaste_internal(relsArr, res.as_is, res.as_new);
		}.bind(this)
	);
};

BaseRelationshipsGrid.prototype.onPaste_internal = function (
	relsArr,
	pasteAsIs,
	pasteAsNew
) {
	let requestConfirmation = true;

	for (let i = 0; i < relsArr.length; i++) {
		const currentItem = relsArr[i];
		const newRelationship = aras.pasteRelationship(
			item,
			currentItem,
			pasteAsIs,
			pasteAsNew,
			RelType_Nm,
			RELATED_IT_NAME,
			requestConfirmation
		);

		if (!newRelationship) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.pasting_failed'),
				null,
				null,
				window
			);
			return false;
		}

		if (newRelationship === 'user abort') {
			return false;
		}

		if (requestConfirmation) {
			requestConfirmation = false;
		}

		const relatedItm = newRelationship.selectSingleNode('related_id/Item');
		callback4NewCmd = callbackFunction4NewCmd;
		callbackFunction4NewCmd_data_bf = false;

		addRow(newRelationship, relatedItm, false);
	}

	aras.AlertSuccess(
		aras.getResource('', 'relationshipsgrid.pasting_completed_success')
	);

	if (parent.updateItemsGrid) {
		parent.updateItemsGrid(item);
	}

	if (parent.updateMenuState) {
		parent.updateMenuState();
	}

	return true;
};

BaseRelationshipsGrid.prototype.promoteRelationship = function () {
	const relId = grid.getSelectedId();
	if (!relId) {
		aras.AlertError(
			aras.getResource('', 'relationshipsgrid.select_relship'),
			null,
			null,
			window
		);
		return false;
	}

	const rel = item.selectSingleNode('Relationships/Item[@id="' + relId + '"]');
	if (!rel) {
		return false;
	}

	const params = {
		item: rel,
		title: aras.getResource(
			'',
			'promotedlg.propmote',
			aras.getKeyedNameEx(rel)
		),
		aras: aras,
		dialogWidth: 400,
		dialogHeight: 300,
		resizable: true,
		content: 'promoteDialog.html'
	};

	(
		topWindow_Experimental.main || topWindow_Experimental
	).ArasModules.Dialog.show('iframe', params).promise.then(function (res) {
		if (typeof res === 'string' && res === 'null') {
			rel.parentNode.removeChild(rel);
			grid.deleteRow(relId);
			return;
		}
		if (res) {
			updateRow(res, res.selectSingleNode('related_id/Item'), false, true);
		}
	});
};
