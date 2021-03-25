function initializeRelationshipsGridFunctions(container) {
	container.canEditCell = function (rowId, field) {
		var col = fieldsArr.indexOf(field);
		if (!propsArr[col] || propsArr[col].DRL === 'L') {
			return false;
		}

		var isDescBy = propsArr[col].DRL === 'D';

		// for the foreign properties we should show the cells in read only mode.
		if (propsArr[col].data_type === 'foreign') {
			container.checkThatItemTypePropsLoaded();
			return false;
		}

		var getItem = function (item, dlr, rowId) {
			return item.selectSingleNode(
				`Relationships/Item[@id="${rowId}"]${
					dlr === 'D' ? '' : '/related_id/Item'
				}`
			);
		};

		var itemNode = getItem(item, propsArr[col].DRL, rowId);
		// This means that no related item found.
		if (
			!isDescBy &&
			!itemNode &&
			item.selectSingleNode(`Relationships/Item[@id="${rowId}"]/related_id`)
		) {
			return false;
		} else if (!itemNode || itemNode.getAttribute('loadedPartialy') !== '0') {
			//try to load item
			container.onSelectItem(rowId, col, true, true, true);
			itemNode = getItem(item, propsArr[col].DRL, rowId);
		}

		if (
			!itemNode ||
			itemNode.getAttribute('action') === 'delete' ||
			itemNode.getAttribute('action') === 'purge'
		) {
			return false;
		}

		var RelTypeIT =
			propsArr[col].DRL === 'R' ? RelatedItemType_Nd : DescByItemType_Nd;
		if (!RelTypeIT) {
			return false;
		}

		var propNm = propsArr[col].name;
		var propNd = RelTypeIT.selectSingleNode(
			`Relationships/Item[@type="Property" and name="${propNm}"]`
		);
		if (!propNd) {
			return false;
		}

		var readonly = aras.getItemProperty(propNd, 'readonly') === '1';
		const hasEditState = aras.isEditStateEx(itemNode);
		var canEditCell = relationshipsGrid.canEditCell(
			readonly,
			isEditMode,
			isDescBy,
			propsArr[col],
			container.getLockedStatusStr(rowId),
			container.hasRelatedItem(rowId),
			aras.isTempEx(container.system_getRelatedItem(rowId)),
			hasEditState,
			rowId,
			col
		);
		var tryEditCell =
			!readonly &&
			!canEditCell &&
			isEditMode &&
			propsArr[col].DRL === 'R' &&
			RELATED_IS_DEPENDENT == true;

		if (
			'boolean' === typeof grid.items_Experimental.get(rowId, 'value', field)
		) {
			currSelCell = cell;
			currSelRowId = rowId;
			currSelCol = col;
		}

		currSelRowId = rowId;
		currSelCol = col;

		var propDT = propsArr[currSelCol].data_type;
		var cell = grid.cells(currSelRowId, currSelCol);
		var prevVal = container.systemGetValueForCurrentCell();

		currSelCell = cell;

		if (canEditCell) {
			if (!container.handleCellEvent('oneditstart', rowId, col)) {
				currSelCell = null;
				return false;
			}
		} else if (tryEditCell) {
			if (!container.handleCellEvent('oneditstart', rowId, col)) {
				currSelCell = null;
				return false;
			}

			const isItemLocked = aras.isLocked(itemNode);
			const isItemTemp = aras.isTempEx(itemNode);
			const layoutActions = window.layout && window.layout.actions;
			if (!(isItemLocked || isItemTemp)) {
				setTimeout(function () {
					var isLocked = container.lockRelatedItem(true);
					if (isLocked) {
						const editedItem = getItem(item, propsArr[col].DRL, rowId);
						aras.setItemEditStateEx(editedItem, true);
						if (layoutActions) {
							layoutActions.addItemToEditMode(editedItem.id);
						}
						editedItem.setAttribute('unlock', '0');
						setTimeout(function () {
							//todo: remove calling of two clicks
							grid.cells(rowId, col).cellNod_Experimental.click();
							grid.cells(rowId, col).cellNod_Experimental.click();
						}, 0);
					}
				}, 0);
				return false;
			} else if (isItemLocked) {
				aras.setItemEditStateEx(itemNode, true);
				if (layoutActions) {
					layoutActions.addItemToEditMode(itemNode.id);
				}
				itemNode.setAttribute('unlock', '0');
			}
			currSelCell = grid.Cells(rowId, col);
		} else {
			currSelCell = null;
			if (propDT == 'text') {
				container.showTextarea(false);
			} else if (propDT == 'formatted text') {
				container.showHTMLEditorDialog(false);
			}
			return false;
		}
		canEditCell = true;

		if (propsArr[col].data_type == 'filter list') {
			RelTypeIT = aras.getItemProperty(
				RelType_Nd,
				'R' === propsArr[col].DRL ? 'related_id' : 'relationship_id'
			);
			var filterValue = container.getFilterValue(rowId, col) || '';

			var resObj = aras.uiGetFilteredObject4Grid(
				RelTypeIT,
				propsArr[col].name,
				filterValue
			);
			if (resObj.hasError) {
				return;
			}
			grid.columns_Experimental.set(
				field,
				'comboList',
				resObj.values,
				resObj.labels
			);
		}

		var propSource_ITName = '';
		if (RelType_Nm == 'Property' && isDescBy) {
			// property type of foreign always is not required.
			if (
				propNm == 'is_required' &&
				aras.getItemProperty(itemNode, 'data_type') === 'foreign'
			) {
				return false;
			} else if (propNm == 'data_source') {
				propSource_ITName = aras.getItemProperty(itemNode, 'data_type');
				if (propSource_ITName == 'foreign') {
					setTimeout(container.showForeignPropDialog, 1);
					return false;
				} else if (propSource_ITName != 'item') {
					if (
						propSource_ITName.search(
							/^list$|^color list$|^filter list$|^mv_list$/
						) == 0
					) {
						propSource_ITName = 'List';
					}
					// else if (propSource_ITName=='item') propSource_ITName = 'ItemType';
					else if (propSource_ITName == 'sequence') {
						propSource_ITName = 'Sequence';
					} else {
						return false;
					}

					setTimeout('showDialog("' + propSource_ITName + '")', 1);
					return false;
				}
			} else if (
				propNm == 'pattern' &&
				aras.getItemProperty(itemNode, 'data_type') == 'filter list'
			) {
				var props = item.selectNodes(
					'Relationships/Item[@type="Property" and (not(@action) or (@action!="delete" and @action!="purge"))]'
				);
				var _listVals = [''];
				for (var i = 0; i < props.length; i++) {
					_listVals.push(aras.getItemProperty(props[i], 'name'));
				}

				_listVals.sort();
				grid.columns_Experimental.set(field, 'editType', 'FilterComboBox');
				grid.columns_Experimental.set(field, 'comboList', _listVals);
			} else if (propNm == 'class_path') {
				setTimeout(container.showClassPathDialog);
				return false;
			}
		}

		switch (propDT) {
			case 'item':
				if (propNm == 'source_id' && RelType_Nm == 'RelationshipType') {
					currSelCell = null;
					return false;
				}

				if (propNm == 'related_id' && RELATED_IS_DEPENDENT == true) {
					currSelCell = null;
					return false;
				}

				propSource_ITName = aras.getItemTypeName(propsArr[col].data_source);
				if (propSource_ITName == 'File') {
					return false;
				}

				grid.columns_Experimental.set(field, 'editType', 'InputHelper');
				bKEYEDNAME_INPUT_IS_IN_PROGRESS = true;
				break;
			case 'color':
				container.showColorDialog(prevVal);
				return false;
			case 'text':
				container.showTextarea(canEditCell);
				return false;
			case 'image':
				var re = /^<img src=["']([^'"]*)['"]/;
				if (re.test(prevVal)) {
					prevVal = RegExp.$1;
				}

				container.showImageDialog(prevVal);
				return false;
			case 'formatted text':
				container.showHTMLEditorDialog(canEditCell);
				return false;
			case 'sequence':
				return false;
			case 'ml_string':
				if (languagesCount > 1) {
					grid.columns_Experimental.set(
						field,
						'editType',
						'InputHelperTextBox'
					);
				}
				break;
			case 'string':
				if (
					propNm == 'classification' ||
					(propNm == 'form_classification' && RelType_Nm == 'View') ||
					(propNm == 'class_path' &&
						(RelType_Nm == 'ItemType Life Cycle' ||
							RelType_Nm == 'Can Add' ||
							RelType_Nm == 'DiscussionTemplate'))
				) {
					if (!grid._grid) {
						grid.columns_Experimental.set(
							field,
							'editType',
							'ClassificationHelper'
						);
						grid.grid_Experimental.getCell(
							cell.indexColumn_Experimental
						).classificationName = container.getClassificationArray(propNm);
					}
					break;
				}
		}

		return true;
	};

	container.validateCell = function (rowId, field, value) {
		if ('input_row' === rowId) {
			return true;
		}

		var col = fieldsArr.indexOf(field);
		var propDT = propsArr[col].data_type;
		var RelTypeIT =
			propsArr[col].DRL === 'R' ? RelatedItemType_Nd : DescByItemType_Nd;

		if ('item' === propDT) {
			var propSource_ITName = aras.getItemTypeName(propsArr[col].data_source);
			var tmpItem = aras.uiGetItemByKeyedName(propSource_ITName, value, true);
			return !(!tmpItem && value);
		} else {
			var propNd = RelTypeIT.selectSingleNode(
				'Relationships/Item[@type="Property" and name="' +
					propsArr[col].name +
					'"]'
			);
			var propertyDef = {
				data_type: propsArr[col].data_type,
				pattern: aras.getItemProperty(propNd, 'pattern'),
				is_required: aras.getItemProperty(propNd, 'is_required') === '1',
				stored_length: parseInt(aras.getItemProperty(propNd, 'stored_length'))
			};
			if (propDT == 'md5') {
				value = aras.calcMD5(value);
			}
			if (!aras.isPropertyValueValid(propertyDef, value, 'invariantLocale')) {
				grid.edit_Experimental.setErrorMessage(aras.ValidationMsg);
				return false;
			}
		}

		return true;
	};

	container.keyDownHandler = function (ev) {
		ev = ev || window.event;
		isAltKeyPressed = ev.altKey;
	};

	container.keyUpHandler = function (ev) {
		ev = ev || window.event;
		isAltKeyPressed = ev.altKey;
	};

	container.onLoadHandler = function () {
		window.addEventListener('resize', function () {
			container.refreshGridSize();
			container.resize_searchContainer();
		});

		var mutationHandler = function (mutation) {
			var target = mutation.target;
			if (
				(target.tagName == 'DIV' || target.tagName == 'IFRAME') &&
				(target.id == 'searchPlaceholder' ||
					target.id == '95A2002E5AD84B9D8B2FA50B742C5973')
			) {
				if (gridResizeHelper.repeatTimer) {
					window.clearTimeout(gridResizeHelper.repeatTimer);
					delete gridResizeHelper.repeatTimer;
				}

				gridResizeHelper.repeatTimer = window.setTimeout(function () {
					container.refreshGridSize();
				}, 0);
			}
		};

		if (window.MutationObserver) {
			var observer = new MutationObserver(function (mutations) {
				mutations.forEach(mutationHandler);
			});
			observer.observe(document.getElementById('searchPlaceholder'), {
				attributes: true
			});
		} else {
			document
				.getElementById('searchPlaceholder')
				.addEventListener('DOMAttrModified', function (event) {
					if (
						'attrChange' in event &&
						(event.attrChange == MutationEvent.MODIFICATION ||
							event.attrChange == MutationEvent.ADDITION)
					) {
						mutationHandler(event);
					}
				});
		}

		if (topWindow_Experimental.updateMenuState) {
			topWindow_Experimental.updateMenuState();
		}

		container.registerTopMenuEventsHandlers();
		window.addEventListener('beforeunload', container.onbeforeunload_handler);
	};

	container.domContentLoadingHandler = function () {
		container.initColumnSelectionBlock();
		container
			.createToolbar()
			.then(container.createFilePropertyManager)
			.then(container.createGridContainer)
			.then(container.createCuiLayout)
			.catch(function (e) {
				aras.AlertError(e);
			});
	};

	container.createToolbar = function () {
		let creationPromise;

		if (container.cuiToolbarsRequired()) {
			container.initRelatedItemOptions();
			creationPromise = Promise.resolve();
		} else {
			creationPromise = relationshipsGrid.createToolbar();
		}

		return creationPromise;
	};

	container.cuiToolbarsRequired = function () {
		// isToolbarUsed: if flag is false, then toolbar control should not be created
		// CUSTOM_TOOLBAR_SRC: if custom src passed, then old custom toolbar should be loaded (should be removed after all customizations will use cui)
		// WorkFlowProc: flag forces specific old toolbar loading, new toolbars should not be used (Workflow dialog toolbar)
		// skipCuiToolbarsCreation: flag turns off new toolbars usage (can be removed after xClassification, DAC Definitions will use cui toolbars)
		return (
			isToolbarUsed &&
			!CUSTOM_TOOLBAR_SRC &&
			WorkFlowProc !== '1' &&
			!skipCuiToolbarsCreation
		);
	};

	container.createCuiLayout = async function () {
		const containerNode = document.getElementById('relationship-toolbars');
		const isCuiToolbarRequired = container.cuiToolbarsRequired();
		if (isCuiToolbarRequired) {
			containerNode.style.display = '';
		}

		const options = container.getDefaultOptions(
			window.RelType_Nd,
			window.RelatedItemType_Nd
		);
		const parameters = [
			containerNode,
			'RelationshipsView',
			{
				columnSelectionMediator,
				...options
			}
		];
		let cuiLayout;
		if (isCuiToolbarRequired) {
			cuiLayout = new RelationshipsGridCuiLayout(...parameters);
		} else {
			cuiLayout = new RelationshipsGridWithoutToolbarCuiLayout(...parameters);
		}

		cuiLayout.grid = grid._grid;
		window.layout = cuiLayout;
		window.addEventListener('unload', () => window.layout.destroy());
		redlineController.InitRedlineControls();
		await cuiLayout.init();

		if (!isCuiToolbarRequired) {
			return;
		}

		toolbarReady = true;
		container.refreshGridSize();
	};

	container.getDefaultOptions = function (relationshipNode, relatedNode) {
		const topWnd = aras.getMostTopWindowWithAras();
		const item = topWnd.getItem ? topWnd.getItem() : topWnd.item;
		const itemClassification =
			aras.getItemProperty(item, 'classification') || '';

		const relshipOptions = {};
		const relatedOptions = {};
		if (relationshipNode) {
			relshipOptions.itemTypeName = aras.getItemProperty(
				relationshipNode,
				'name'
			);
			relshipOptions.relationshipTypeName = relshipOptions.itemTypeName;
			relshipOptions.relationshipTypeId = relationshipNode.getAttribute('id');
			relshipOptions.relationshipTypeNode = relationshipNode;
			relshipOptions.relationshipItemTypeId = aras.getItemProperty(
				relationshipNode,
				'relationship_id'
			);
			const relationshipItemType = aras.getItemTypeForClient(
				relshipOptions.relationshipItemTypeId,
				'id'
			);
			relshipOptions.relationshipItemTypeLabel =
				relationshipItemType.getProperty('label') ||
				relationshipItemType.getProperty('name');
		}

		if (relatedNode) {
			relatedOptions.relatedTypeName = aras.getItemProperty(
				relatedNode,
				'name'
			);
			relatedOptions.relatedItemTypeId = relatedNode.getAttribute('id');
			relatedOptions.relatedItemTypeNode = relatedNode;
		}

		return Object.assign(
			{ item_classification: itemClassification },
			relshipOptions,
			relatedOptions
		);
	};

	container.notifyCuiLayout = function (eventType) {
		if (window.layout) {
			window.layout.observer.notify(eventType);
		}
	};

	container.createFilePropertyManager = function () {
		return new Promise(function (resolve) {
			clientControlsFactory.createControl(
				'Aras.Client.Controls.Experimental.ExternalCellWidget.FilePropertyManager',
				{ aras: aras },
				function (control) {
					FilePropertyManager = control;

					clientControlsFactory.on(FilePropertyManager, {
						onCellEditableCheck: container.onFileEditableCheck,
						onCellNullableCheck: container.onFileNullableCheck,
						onCellEnabledCheck: container.onFileEnabledCheck,
						onApplyEdit: container.onWidgetApplyEdit
					});
					resolve();
				}
			);
		});
	};

	container.createGridContainer = function () {
		return relationshipsGrid.createGridContainer().then(function () {
			grid.grid_Experimental.focus.focusGridView = function () {};
		});
	};

	container.initColumnSelectionBlock = function () {
		const xClassBarNode = document.getElementById('xClassBarPlaceholder');
		columnSelectionMediator = ColumnSelectionMediatorFactory.CreateRelationshipMediator(
			xClassBarNode
		);
		columnSelectionControl.initResources();
		xClassSearchWrapper.initResources();
	};

	container.onFileEditableCheck = function (rowId, columnName) {
		if (isEditMode) {
			var columnIndex = fieldsArr.indexOf(columnName);
			var isPropertyCheckPassed =
				propsArr[columnIndex] && propsArr[columnIndex].data_type != 'foreign';

			if (isPropertyCheckPassed) {
				var isRelatedIdFile =
					relatedItemTypeName == 'File' &&
					propsArr[columnIndex].name == 'related_id';

				if (isRelatedIdFile) {
					return true;
				} else {
					(isRelatedItemProperty = propsArr[columnIndex].DRL == 'R'),
						(selectExpression =
							'Relationships/Item[@id="' +
							rowId +
							'"]' +
							(isRelatedItemProperty ? '/related_id/Item' : '')),
						(rowItemNode = item.selectSingleNode(selectExpression));

					if (rowItemNode) {
						// check that item can be edited by user
						var isItemEditable =
							aras.isNew(rowItemNode) ||
							!isRelatedItemProperty ||
							aras.isLockedByUser(rowItemNode);
						var itemAction = rowItemNode.getAttribute('action');
						var isItemActionAllowed =
							itemAction != 'delete' && itemAction != 'purge';

						if (isItemEditable && isItemActionAllowed) {
							// check that property is not readonly
							var relatedTypeDescriptor = isRelatedItemProperty
								? RelatedItemType_Nd
								: DescByItemType_Nd;
							var propertyName = propsArr[columnIndex].name;
							var propertyNode = relatedTypeDescriptor
								? relatedTypeDescriptor.selectSingleNode(
										'Relationships/Item[@type="Property" and name="' +
											propertyName +
											'"]'
								  )
								: null;

							if (
								!propertyNode ||
								aras.getItemProperty(propertyNode, 'readonly') === '1'
							) {
								return false;
							}

							return true;
						}
					}
				}
			}
		}

		return false;
	};

	container.onFileNullableCheck = function (rowId, columnName) {
		if (isEditMode) {
			var columnIndex = fieldsArr.indexOf(columnName);
			var isRelatedIdFile = propsArr[columnIndex]
				? relatedItemTypeName == 'File' &&
				  propsArr[columnIndex].name == 'related_id'
				: false;

			return isRelatedIdFile
				? container.hasRelatedItem(rowId) && replaceToNull
				: true;
		}
	};

	container.onFileEnabledCheck = function (rowId, columnName) {
		var columnIndex = fieldsArr.indexOf(columnName);
		var isPropertyCheckPassed = propsArr[columnIndex];

		if (propsArr[columnIndex]) {
			var isRelatedItemProperty = propsArr[columnIndex].DRL == 'R';
			var selectExpression =
				'Relationships/Item[@id="' +
				rowId +
				'"]' +
				(isRelatedItemProperty ? '/related_id/Item' : '');
			var rowItemNode = item.selectSingleNode(selectExpression);

			if (rowItemNode) {
				return rowItemNode.getAttribute('discover_only') != '1';
			}
		}
	};

	container.onWidgetApplyEdit = function (rowId, fieldName, newValue) {
		var propertyIndex = fieldsArr.indexOf(fieldName);
		var isRelatedIdFile = propsArr[propertyIndex]
			? relatedItemTypeName == 'File' &&
			  propsArr[propertyIndex].name == 'related_id'
			: false;

		if (container.handleCellEvent('oneditstart', rowId, propertyIndex)) {
			if (isRelatedIdFile) {
				if (!newValue) {
					container.removeRelatedItem(rowId);
				} else {
					container.changeRelationship(false, newValue, rowId);
				}
			} else {
				currSelCell = grid.cells(rowId, propertyIndex);
				currSelCol = propertyIndex;

				container.setupProperty(newValue, true);
			}

			container.handleCellEvent('onchangecell', rowId, propertyIndex);
			container.handleCellEvent('oneditfinish', rowId, propertyIndex);
		}
	};

	container.addNewRowEvent = function (id) {
		relationshipsGrid.addNewRowEvent(id);
	};

	container.onInitialize = function () {
		bGridStarted = true;
		if (!RelType_ID || !aras.getMainWindow()) {
			return false;
		}

		RelType_Nd = aras.getRelationshipType(RelType_ID).node;
		RelType_Nm = aras.getItemProperty(RelType_Nd, 'name');
		RelType_Lbl = aras.getItemProperty(RelType_Nd, 'label');
		if (RelType_Lbl == '') {
			RelType_Lbl = RelType_Nm;
		}

		currQryItem = aras.newQryItem(RelType_Nm);

		container.computeColWidhtOrder();

		// +++ global variables to use custom event handlers
		relatedItemTypeName = RELATED_IT_NAME;
		relationshipTypeName = RelType_Nm;
		// --- global variables to use custom event handlers

		if (
			aras.getLanguagesResultNd() &&
			aras.getLanguagesResultNd().selectNodes("Item[@type='Language']")
		) {
			languagesCount = aras
				.getLanguagesResultNd()
				.selectNodes("Item[@type='Language']").length;
		}

		if (AUTO_SEARCH_FLAG) {
			bSHOW_INPUT_ROW = !container.isSearchRowEmpty(); //search row contains some criteria
		} else {
			bSHOW_INPUT_ROW = true;
		}

		CAN_RUN_SEARCH = bSHOW_INPUT_ROW;
		return true;
	};

	container.markPopupMenuEntryExcluded = function (
		entryId,
		isExcluded,
		doResetEntryVal
	) {
		container.updateGlobalHash(
			ExcludedPopupMenuEntries,
			entryId,
			isExcluded,
			doResetEntryVal,
			true
		);
	};

	container.markPopupMenuEntryVisible = function (entryId, isVisible, doReset) {
		container.updateGlobalHash(
			ExplicitPopupMenuEntriesVisibilities,
			entryId,
			isVisible,
			doReset,
			true
		);
	};

	container.markToolbarIconEnabled = function (iconId, isEnabled, doReset) {
		container.updateGlobalHash(
			ExplicitToolbarIconsEnabling,
			iconId,
			isEnabled,
			doReset,
			true
		);
	};

	container.updateGlobalHash = function (
		hashObj,
		entryId,
		val,
		doReset,
		defaultVal
	) {
		if (doReset) {
			delete hashObj[entryId];
			return;
		}
		if (val === undefined) {
			val = defaultVal;
		}

		hashObj[entryId] = val;
	};

	container.computeColWidhtOrder = function () {
		relationshipsGrid.computeColWidhtOrder();
	};

	container.getGenerateRelationshipsGridXML = function (dom, columnObjects) {
		var params = {
			enable_links: !isEditMode,
			enableFileLinks: true,
			bgInvert: true,
			columnObjects: columnObjects
		};

		if (RelatedItemType_ID) {
			params[RelatedItemType_ID] = '';
		}

		return aras.uiGenerateRelationshipsGridXML(
			dom,
			DescByVisibleProps,
			RelatedVisibleProps,
			DescByItemType_ID,
			params,
			true
		);
	};

	container.initGrid = function () {
		if (
			!gridReady ||
			(!container.cuiToolbarsRequired() && activeToolbar == null) ||
			!aras
		) {
			setTimeout(container.initGrid, 10);
			return;
		}

		if (!item) {
			return; //this is possible in Workflow Map Editor. IR-004193
		}

		return setupGrid(true, AUTO_SEARCH_FLAG);
	};

	container.onXmlLoaded = function () {
		relationshipsGrid.onXmlLoaded();
	};

	container.updateDirtyRows = function () {
		if (
			!item ||
			!item.selectSingleNode("Relationships/Item[@action='update']")
		) {
			return;
		}

		var allRows = grid.items_Experimental.getAllId();
		if (!allRows.length) {
			var dirtyItemIDs = "id='" + allRows[0] + "'";
			var i;
			for (i = 1; i < allRows.length; i++) {
				dirtyItemIDs += " or @id='" + allRows[i] + "'";
			}

			var dirtyItems = item.selectNodes(
				'Relationships/Item[(' + dirtyItemIDs + ") and @action='update']"
			);
			for (i = 0; i < dirtyItems.length; i++) {
				var relatedNd = dirtyItems[i].selectSingleNode('related_id/Item');
				container.updateRow(dirtyItems[i], relatedNd, false, true, false);
			}
		}
	};

	container.showGridInputRow = function (b) {
		if (grid.IsInputRowVisible() == Boolean(b)) {
			return;
		}

		grid.showInputRow(b);
		bSHOW_INPUT_ROW = b;
	};

	container.isSearchRowEmpty = function () {
		return false;
	};

	container.loadToolbar = function () {
		relationshipsGrid.loadToolbar();
	};

	container.onCancelEditHandler = function () {
		currSelCell = null;
		bKEYEDNAME_INPUT_IS_IN_PROGRESS = false;
	};

	container.onBeforeSaveCommand = function () {
		if (editWait) {
			clearTimeout(editWait);
		}

		if (grid) {
			grid.turnEditOff();
		}
	};

	container.registerTopMenuEventsHandlers = function () {
		if (!topWindow_Experimental.registerCommandEventHandler) {
			setTimeout(container.registerTopMenuEventsHandlers, 200);
			return;
		}

		if (topWindow_Experimental.registerCommandEventHandler) {
			beforeSaveHandlerKey = topWindow_Experimental.registerCommandEventHandler(
				window,
				container.onBeforeSaveCommand,
				'before',
				'save'
			);
		}
	};

	container.unRegisterTopMenuEventsHandlers = function () {
		if (topWindow_Experimental.unregisterCommandEventHandler) {
			topWindow_Experimental.unregisterCommandEventHandler(
				beforeSaveHandlerKey
			);
		}
	};

	container.onbeforeunload_handler = function () {
		if (window.interval) {
			clearInterval(interval);
		}
	};

	container.onbeforeunload_handler_rg = function () {
		aras.unregisterEventHandler(
			'ItemLock',
			window,
			container.relatedItemLockListener
		);
		aras.unregisterEventHandler('ItemSave', window, container.ItemSaveListener);
		aras.unregisterEventHandler(
			'ItemDelete',
			window,
			container.itemDeleteListener
		);
		container.unRegisterTopMenuEventsHandlers();
		//--- to resolve IR-002599: Related item is not unlocked in Relationships Grid

		if (searchContainer) {
			searchContainer.onEndSearchContainer();
		}

		var res;
		if (base$onbeforeunload) {
			res = base$onbeforeunload();
		}
		if (res) {
			return res;
		}

		var tmp_handleInvalidCellValue = window._handleInvalidCellValue;
		window._handleInvalidCellValue = function onbeforeunload_handleInvalidCellValue(
			message
		) {
			if (message) {
				res = message;
			} else {
				res = aras.ValidationMsg;
			}
			return InvalidCellValueAction.ContinueEdit;
		};

		try {
			container.saveEditedData();
		} catch (e) {
			throw e;
		} finally {
			window._handleInvalidCellValue = tmp_handleInvalidCellValue;
		}

		return res;
	};

	container.RelationshipGridSearchContainer = function (
		itemTypeName,
		toolbar,
		grid,
		menu,
		searchLocation,
		searchPlaceholder,
		requiredProperties,
		pagination
	) {
		// Call base SearchContainer constructor
		SearchContainer.prototype.constructor.call(
			this,
			itemTypeName,
			grid,
			null,
			searchLocation,
			searchPlaceholder,
			requiredProperties,
			pagination
		);
	};
	container.RelationshipGridSearchContainer.prototype = new container.SearchContainer();
	container.RelationshipGridSearchContainer.prototype.defaultSearchMode =
		'NoUI';

	container.initSearch = function () {
		var relationshipsGridInfoProvider = null;
		var currentParent = window.parent;
		while (!relationshipsGridInfoProvider && currentParent) {
			if (currentParent.relationshipsGridInfoProvider) {
				// param relshipsGridId is null - in this case we use no RelationshipGrid
				relationshipsGridInfoProvider = currentParent.relationshipsGridInfoProvider.getInstance(
					null
				);
			} else {
				currentParent = currentParent.parent;
				if (currentParent == topWindow_Experimental) {
					currentParent = null;
				}
			}
		}

		if (
			!gridReady ||
			(isToolbarUsed && !container.cuiToolbarsRequired() && !toolbarReady)
		) {
			setTimeout(container.initSearch, 10);
			return;
		}

		var toolbar4SearchContainer = null;
		var toolbarIframeNode = document.getElementById(
			'toolbar_slot_custom_iframe'
		);
		if (toolbarIframeNode && toolbarIframeNode.contentWindow.toolbar) {
			toolbar4SearchContainer = {
				object: toolbarIframeNode.contentWindow.toolbar,
				dojoOfObject: toolbarIframeNode.contentWindow.dojo
			};
		} else if (isToolbarUsed) {
			toolbar4SearchContainer = toolbar;
		}

		container.initMenu();
		return container.initGrid().then(
			function () {
				itemID = item.getAttribute('id');
				var reqProps = {
					source_id: itemID
				};
				if (!searchContainer) {
					searchContainer = new container.RelationshipGridSearchContainer(
						RelType_Nm,
						toolbar4SearchContainer,
						grid,
						null,
						searchLocation,
						document.getElementById('searchPlaceholder'),
						reqProps
					);
					searchContainer.initSearchContainer();
					searchContainer.redlineController = redlineController;
				}

				if (this.frameElement && this.frameElement.className != 'inactiveTab') {
					searchContainer.onStartSearchContainer();
				}

				container.resize_searchContainer();

				currQryItem.setCriteria('source_id', itemID);
				currQryItem.setSelect(
					aras.getSelectCriteria(aras.getItemTypeId(RelType_Nm), true)
				);

				redlineInitId = setInterval(container.asyncRedlineModeInit, 10);
			}.bind(this)
		);
	};

	container.asyncRedlineModeInit = function () {
		if (
			!currentSearchMode ||
			(currentSearchMode.name === 'Advanced' &&
				!currentSearchMode.isAdvancedModeStarted)
		) {
			return;
		}

		clearInterval(redlineInitId);

		redlineController.InitRedlinePreference();

		if (redlineController.isRedlineActive) {
			redlineController.RefreshRedlineView();
		} else if (AUTO_SEARCH_FLAG) {
			if (grid._grid && aras.getVariable('SortPages') === 'true') {
				const gridComponent = grid._grid;
				currentSearchMode.setSortOrderByGridInfo(
					gridComponent.head,
					gridComponent.settings.orderBy
				);
			}

			doSearch();
		}
	};

	container.onSearchCommand = function () {
		doSearch();
	};

	container.setControlEnabled = function (ctrlName, b) {
		if (b == undefined) {
			b = true;
		} else {
			b = Boolean(b);
		}

		if (ExplicitToolbarIconsEnabling[ctrlName] !== undefined) {
			b = Boolean(ExplicitToolbarIconsEnabling[ctrlName]);
		}

		CONTROLS_STATE_ARRAY[ctrlName] = b;

		try {
			var tbi = activeToolbar.getItem(ctrlName);
			if (tbi) {
				tbi.setEnabled(b);
			}
		} catch (excep) {}
	};

	container.saveEditedData = function () {
		if (currSelCell) {
			grid.turnEditOff();
		}
	};

	container.replaceErrorHandler = function () {
		window.onerror = function () {
			return false;
		};
	};

	container.initItem = function () {
		if (relationships) {
			item = relationships.item;
			itemTypeName = relationships.itemTypeName;
		} else {
			item =
				typeof parent.document.item == 'object'
					? parent.document.item
					: parent.parent.item;
			itemTypeName = parent.itemTypeName || parent.document.itemTypeName;
		}
		itemTypeId = aras.getItemTypeId(itemTypeName);
		itemID = item.id;
	};

	container.setEditMode = function () {
		if (
			(isEditMode &&
				itemTypeName == 'ItemType' &&
				RelType_Nm == 'Property' &&
				aras.getItemProperty(item, 'name') == 'Property') ||
			(isEditMode &&
				itemTypeName == 'RelationshipType' &&
				RelType_Nm == 'Relationship Grid Event' &&
				aras.getItemProperty(item, 'name') == 'Relationship Grid Event')
		) {
			// these are special cases when we need to reinitialize the interface completely
			// due to self-definition of the opened item
			// i.e. opened or being changed item shows itself
			var newLocation = location.href.replace(/editMode=./i, 'editMode=1');
			location.replace(newLocation);
		} else {
			isEditMode = true;

			container.onInitialize();
			container.initItem();
			grid && grid.setEditable(true);
			if (searchContainer) {
				searchContainer.requiredProperties['source_id'] = item.getAttribute(
					'id'
				);
			}
			doSearch();
			if (isToolbarUsed) {
				container.updateToolbar();
			}
		}
	};

	container.setViewMode = function () {
		isEditMode = false;
		container.onInitialize();
		container.initItem();
		grid.setEditable(false);
		if (searchContainer) {
			searchContainer.requiredProperties['source_id'] = item.getAttribute('id');
		}
		doSearch();
		if (isToolbarUsed) {
			container.updateToolbar();
		}
	};

	container.initMenu = function () {
		container.setupMenu4RelationshipType();
	};

	container.setupMenu4RelationshipType = function () {
		RTActionsCount = 0;

		if (isToolbarUsed && toolbar) {
			var actionsTb = toolbar.getItem('actions_menu');
			if (actionsTb) {
				actionsTb.removeAll();
				var RTActions = relationshipTypeActions[RelType_ID];
				if (RTActions) {
					for (var menuEntry in RTActions) {
						actionsTb.Add(menuEntry, RTActions[menuEntry]);
						RTActionsCount++;
					}
				}
			}
		}
	};

	container.setupMenu4Relationship = function (add_remove) {
		if (!isToolbarUsed || !toolbar) {
			return;
		}

		var actionsTb = toolbar.getItem('actions_menu');
		if (!actionsTb) {
			return;
		}
		var currCount = actionsTb.getItemCount();

		switch (add_remove) {
			case 'add':
				if (currCount == RTActionsCount) {
					var RActions = relationshipActions[RelType_ID];
					if (RActions) {
						for (var menuEntry in RActions) {
							actionsTb.Add(menuEntry, RActions[menuEntry]);
						}
					}
				}
				break;
			case 'remove':
				if (currCount > RTActionsCount) {
					container.setupMenu4RelationshipType();
				}
				break;
			default:
				throw new Error(
					1,
					'setupMenu4Relationship: "' + add_remove + '" not supported'
				);
		}
	};

	container.onRelationshipsMenuClickItem = function (menuOptionId) {
		if (!RelType_Nd) {
			return false;
		}

		var act = aras.getItemFromServer(
			'Action',
			menuOptionId,
			'name,method(name,method_type,method_code),type,target,location,body,on_complete(name,method_type,method_code),item_query'
		);
		if (!act) {
			return false;
		}

		if (act.getProperty('type') == 'itemtype') {
			aras.invokeAction(
				act.node,
				aras.getItemProperty(RelType_Nd, 'relationship_id'),
				''
			);
		} else {
			var ids = grid.getSelectedItemIds();
			for (var i = 0; i < ids.length; i++) {
				if (ids[i] != '') {
					aras.invokeAction(
						act.node,
						aras.getItemProperty(RelType_Nd, 'relationship_id'),
						ids[i]
					);
				}
			}
		}
	};

	container.removeChoiceItem = function (name) {
		if (name == undefined) {
			return;
		}

		var tbi = activeToolbar.getItem('related_option');
		try {
			tbi.remove(name);
		} catch (e) {}

		if (tbi.getItemCount() < 2) {
			container.setControlEnabled('related_option', false);
			related_visible = false;
		} else {
			container.setControlEnabled('related_option', true);
		}
		if (tbi.getItemCount() == 0) {
			canNewFlag = false;
		}
	};

	container.getSelectedChoiceItem = function () {
		if (activeToolbar) {
			var tbi = activeToolbar.getItem('related_option');
			return tbi.getSelectedItem();
		}
		return false;
	};

	container.getChoiceItemName = function (id) {
		var tbi = activeToolbar.getItem('related_option');
		return tbi.getItem(id);
	};

	container.initRelatedItemOptions = function () {
		PickRelatedOption = activeToolbar ? container.getChoiceItemName(0) : 'pick';
		NoRelatedOption = activeToolbar
			? container.getChoiceItemName(1)
			: 'norelated';
		CreateRelatedOption = activeToolbar
			? container.getChoiceItemName(2)
			: 'create';

		const related_option = aras.getItemProperty(RelType_Nd, 'related_option');
		let opts = [];
		opts[PickRelatedOption] = false;
		opts[NoRelatedOption] = false;
		opts[CreateRelatedOption] = false;

		if (DescByItemType_Nd) {
			if (aras.getItemProperty(RelType_Nd, 'related_id') !== '') {
				if (aras.getItemProperty(RelatedItemType_Nd, 'is_dependent') === '1') {
					opts[NoRelatedOption] = true;
					opts[PickRelatedOption] = true;
				}

				switch (related_option) {
					case '1': //  Create Only
						opts[PickRelatedOption] = true;
						break;
					case '2':
						break;
					default:
						opts[CreateRelatedOption] = true;
				}
				if (aras.getItemProperty(RelType_Nd, 'related_notnull') === '1') {
					opts[NoRelatedOption] = true;
				}
			} else {
				opts[PickRelatedOption] = true;
				opts[CreateRelatedOption] = true;
			}

			if (activeToolbar) {
				for (var opt in opts) {
					if (opts[opt]) {
						container.removeChoiceItem(opt);
					}
				}
			}

			if (opts[PickRelatedOption] == true) {
				replaceFlag = false;
			}
			if (opts[NoRelatedOption] == true) {
				replaceToNull = false;
			}
		}
	};

	container.initToolbar = function () {
		activeToolbar = toolbar.getActiveToolbar();
		//issue   IR-005671  to  reduce  toolbar  when user  look  workflow  proccesses
		if (WorkFlowProc != 1) {
			container.initRelatedItemOptions();
		}

		container.initCopyPasteControls();
		redlineController.InitRedlineControls();
	};

	container.updateToolbar = function () {
		if (grid) {
			var isSelectAllEnabled = grid.getRowCount() > 0;

			container.setControlEnabled(
				'new',
				container.computeCorrectControlState('new')
			);
			container.setControlEnabled(
				'related_option',
				isEditMode && related_visible
			);
			container.setControlEnabled('select_all', isSelectAllEnabled);

			var purgeFlg = container.computeCorrectControlState('delete');
			container.setControlEnabled('delete', purgeFlg);

			replaceButtonEnabled = isEditMode && RELATED_IT_NAME != '' && replaceFlag;
			container.setControlEnabled(
				'pick_replace',
				replaceButtonEnabled &&
					purgeFlg &&
					!isFunctionDisabled(relationshipTypeName, 'Pick Replace')
			);

			if (container.isSpecialItemType()) {
				container.setControlEnabled('copy2clipboard', false);
				container.setControlEnabled('paste', false);
				container.setControlEnabled('paste_special', false);
			} else {
				container.setControlEnabled(
					'copy2clipboard',
					grid.getSelectedItemIds().length > 0 &&
						!container.isWorkflowTool() &&
						!isFunctionDisabled(relationshipTypeName, 'Copy')
				);
				container.setControlEnabled('paste', container.getPasteFlg());
				container.setControlEnabled(
					'paste_special',
					container.getPasteSpecialFlg()
				);
			}
		}

		container.notifyCuiLayout('UpdateTearOffWindowState');
	};

	container.isSpecialItemType = function () {
		return relationshipsGrid.isSpecialItemType();
	};

	container.onToolbarButtonClick = function (btn) {
		if (!grid || bKEYEDNAME_INPUT_IS_IN_PROGRESS) {
			return;
		}

		container.processCommand(btn.getId());
	};

	container.setAllControlsEnabled = function (b) {
		/* setAllControlsEnabled(b)
		enables/disables all controls in toolbar applets */
		var tbElements = [
			'new',
			'pick_replace',
			'delete',
			'lock',
			'unlock',
			'promote',
			'search',
			'show_item',
			'show_relationship',
			'copy2clipboard',
			'paste',
			'select_all'
		];

		for (var i = 0; i < tbElements.length; i++) {
			container.setControlEnabled(tbElements[i], false);
		}
	};

	container.initCopyPasteControls = function () {
		if (container.isSpecialItemType()) {
			container.setControlVisible('copy2clipboard', false);
			container.setControlVisible('paste', false);
		}
	};

	container.setControlVisible = function (id, show_it) {
		if (show_it) {
			activeToolbar.showItem(id);
		} else {
			activeToolbar.hideItem(id);
		}
	};

	container.getRelatedItem = function (rowId) {
		const relatedItem = item.selectSingleNode(
			"Relationships/Item[@id='" + rowId + "']/related_id/Item"
		);

		if (!relatedItem || aras.isEditStateEx(relatedItem)) {
			return relatedItem;
		}

		const relatedItemId = relatedItem.getAttribute('id');
		const itemInCache = aras.getFromCache(relatedItemId);
		if (itemInCache && aras.isEditStateEx(itemInCache)) {
			aras.setItemEditStateEx(relatedItem, aras.isLockedByUser(relatedItem));
			aras.updateInCache(relatedItem);
		}

		return relatedItem;
	};

	container.getLockedStatusStr = function (rowId) {
		var rNd = container.getRelatedItem(rowId);
		if (!rNd) {
			return 'no_related';
		}

		if (aras.isTempEx(rNd)) {
			return 'new';
		} else if (aras.isLockedByUser(rNd)) {
			return 'user';
		} else if (aras.isLocked(rNd)) {
			return 'alien';
		} else {
			return '';
		}
	};

	container.hasRelatedItem = function (rowId) {
		var rNd = container.getRelatedItem(rowId);
		return rNd != null;
	};

	container.system_getRelatedItem = function (rowId) {
		var rNd = item.selectSingleNode(
			"Relationships/Item[@type='" +
				RelType_Nm +
				"' and @id='" +
				rowId +
				"']/related_id/Item"
		);
		return rNd;
	};

	container.getUnlockFlg = function () {
		return relationshipsGrid.getUnlockFlg();
	};

	// IR-006855 fix
	// doRepaint flag indicates whether to cut the menu items in the Actions menu after the Item has been saved and frame reloaded:
	// if set to true, the Actions menu is purged
	container.updateControls = function (
		rowId,
		doRepaint,
		relFiles,
		relatedFiles
	) {
		return relationshipsGrid.updateControls(
			rowId,
			doRepaint,
			relFiles,
			relatedFiles
		);
	};

	container.mergeWithServerDataIfRequired = function (relationshipId) {
		var relationship = item.selectSingleNode(
			'Relationships/Item[@id="' + relationshipId + '"]'
		);
		if (!relationship) {
			aras.getItemRelationship(item, RelType_Nm, relationshipId, true);
			return;
		}

		if (
			'0' === relationship.getAttribute('loadedPartialy') ||
			'add' === relationship.getAttribute('action')
		) {
			return;
		}

		var relFromServer = aras.getItemFromServer(
			RelType_Nm,
			relationshipId,
			undefined,
			true
		);
		if (!relFromServer || !relFromServer.node) {
			relFromServer = null;
		}
		if (relFromServer) {
			aras.mergeItem(relationship, relFromServer.node);
		}

		relationship.setAttribute('loadedPartialy', '0');
		var related = relationship.selectSingleNode('related_id/Item');
		if (related) {
			related.setAttribute('loadedPartialy', '0');
		}
	};

	container.onSelectItem = function (
		rowId,
		col,
		generateEvent,
		processAllSelected,
		loadItemFromServer
	) {
		const answer = relationshipsGrid.onSelectItem(
			rowId,
			col,
			generateEvent,
			processAllSelected,
			loadItemFromServer
		);
		if (columnSelectionMediator) {
			columnSelectionMediator.updateXClassBar();
		}
		return answer;
	};

	container.computeCorrectControlState = function (
		controlName,
		arg1,
		relFiles,
		relatedFiles
	) {
		return relationshipsGrid.computeCorrectControlState(
			controlName,
			arg1,
			relFiles,
			relatedFiles
		);
	};

	container.onRelshipsHeaderMenuClicked = function (m, rowsId, col) {
		if (m == 'hideCol') {
			container.hideColumn(col);
			return;
		} else if (m == 'insertCol') {
			container.showColumn(col);
			return;
		}
	};

	container.onRelshipsHeaderCellContextMenu = function (e) {
		return topWindow_Experimental.cui.onGridHeaderContextMenu(e, grid, true);
	};

	container.onRelshipsHeaderContextMenu = function (e) {
		return topWindow_Experimental.cui.onGridHeaderContextMenu(e, grid);
	};

	container.onContextMenuHandler = function (e) {
		e.preventDefault();
		const grid = window.grid;
		let rowId = null;

		if (grid._grid) {
			const body = grid._grid.view.body;

			if (!body.contains(e.target)) {
				return;
			}

			const focusedCell = grid._grid.settings.focusedCell;
			if (focusedCell && focusedCell.valid === false) {
				grid._grid.view.activeCell.querySelector('input').focus();
				return;
			}

			if (e.button === 2 && body === e.target.parentNode) {
				grid.deselect();
				container.updateToolbar();
			} else {
				if (e.rowId) {
					rowId = e.rowId;
				} else {
					const selectedRows = grid._grid.settings.selectedRows;
					rowId = selectedRows[selectedRows.length - 1] || null;
				}
			}
		}

		grid.contexMenu_Experimental.show(
			{
				x: e.clientX,
				y: e.clientY
			},
			{
				selectedRow: rowId,
				favorites: aras.getMainWindow().favorites,
				actions: window.layout && window.layout.actions,
				editableItems: window.layout && window.layout.state.editableItems
			}
		);
	};

	// for hide item in menu. It is necessary to override the file that inherits this file
	container.computeCorrectControlState1 = function (
		controlName,
		arg1,
		relFiles,
		relatedFiles
	) {
		return computeCorrectControlState(
			controlName,
			arg1,
			relFiles,
			relatedFiles
		);
	};

	container.onRelationshipPopupMenuClicked = function (cmdId, rowId, col) {
		return container.onPopupMenuClick(cmdId, rowId, col);
	};

	container.hideColumn = function (col) {
		grid.SetColumnVisible(col, false);
	};

	container.showColumn = function (col) {
		const propsToShow = relationshipsGrid.getPropsForColumnDialog();

		if (!propsToShow.length) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.no_additional_columns'),
				null,
				null,
				window
			);
			return;
		}

		var params = {
			aras: aras,
			title: aras.getResource('', 'showcolumndlg.title'),
			propsToShow: propsToShow,
			dialogHeight: 500,
			dialogWidth: 350,
			resizable: true,
			content: 'SitePreference/showColumnDialog.html'
		};

		(
			topWindow_Experimental.main || topWindow_Experimental
		).ArasModules.Dialog.show('iframe', params).promise.then(function (resArr) {
			if (resArr) {
				for (var j = 0; j < resArr.length; j++) {
					for (var i = 0; i < propsToShow.length; i++) {
						if (propsToShow[i].label == resArr[j]) {
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
	};

	container.populateItemWithLoadedProps = function (
		itemToPopulate,
		loadedPropsItem,
		show_new_rows
	) {
		var xpath_start =
			show_new_rows == true
				? "//Item[@type='" + RelType_Nm + "' and @action='add']"
				: "//Item[@type='" + RelType_Nm + "']";
		var rships = loadedPropsItem.selectNodes(xpath_start);

		for (var j = 0; j < rships.length; j++) {
			var newItem = rships(j);
			if (show_new_rows) {
				var xpath = 'latest_result/Result';
				var sub_itemToPopulate = itemToPopulate.selectSingleNode(xpath);

				sub_itemToPopulate.appendChild(newItem.cloneNode(true));
				continue;
			}

			var relshId = newItem.getAttribute('id');
			var oldItem = itemToPopulate.selectSingleNode(
				xpath_start + "[@id='" + relshId + "']"
			);
			if (oldItem) {
				mergeProps(oldItem, newItem);
			}
		}

		function mergeProps(oldItem, newItem) {
			var newProps = newItem.selectNodes("*[local-name()!='Relationships']");
			for (var i = 0; i < newProps.length; i++) {
				var newProp = newProps[i];
				var oldProp = oldItem.selectSingleNode(newProp.nodeName);

				if (!oldProp) {
					oldItem.appendChild(newProp.cloneNode(true));
				} else {
					var oldPropItem = oldProp.selectSingleNode('Item');
					if (oldPropItem) {
						var newPropItem = newProp.selectSingleNode('Item');
						if (newPropItem) {
							mergeProps(oldPropItem, newPropItem);
						}
					}
				}
			}
		}
	};

	container.newPopulateRelationshipsGridDom = function () {
		var bodyDom = aras.createXMLDocument();
		bodyDom.loadXML('<table><itemID/><relTypeID/><type/></table>');
		bodyDom.selectSingleNode('table/itemID').text = itemID;
		bodyDom.selectSingleNode('table/relTypeID').text = RelType_ID;
		bodyDom.selectSingleNode('table/type').text = itemTypeName;
		return bodyDom;
	};

	container.onPopupMenuClick = function (mi, rowID, col) {
		//some action is called
		if (mi.search(/  $/) != -1 || mi.search(/ $/) != -1) {
			var RTActions = null;

			if (mi.search(/  $/) != -1) {
				mi = mi.substring(0, mi.length - 2);
				RTActions = relationshipActions[RelType_ID];
			} else if (mi.search(/ $/) != -1) {
				mi = mi.substring(0, mi.length - 1);
				RTActions = relationshipTypeActions[RelType_ID];
			} else {
				return false;
			}

			if (!RTActions) {
				return false;
			}

			var actID = '';
			for (var menuEntry in RTActions) {
				if (mi == RTActions[menuEntry]) {
					actID = menuEntry;
					break;
				}
			}

			if (!actID) {
				return false;
			}

			var act = aras.getItemFromServer(
				'Action',
				actID,
				'name,method(name,method_type,method_code),type,target,location,body,on_complete(name,method_type,method_code),item_query'
			);
			if (!act) {
				return false;
			}

			var actType = act.getProperty('type');
			if (actType == 'itemtype') {
				aras.invokeAction(
					act.node,
					aras.getItemProperty(RelType_Nd, 'relationship_id'),
					''
				);
			} else {
				grid.getSelectedItemIds().forEach(function (value) {
					aras.invokeAction(
						act.node,
						aras.getItemProperty(RelType_Nd, 'relationship_id'),
						value
					);
				});
			}
			return true;
		}

		container.processCommand(mi, col);
	};

	container.callbackFunction4NewCmd = function (id, bFlag) {
		var show_related = bFlag
			? aras.getItemProperty(RelType_Nd, 'new_show_related')
			: null;

		container.onSelectItem(id, 0);
		container.handleRowEvent('oninsertrow', id);
		if (show_related === '1') {
			//"show_item"
			// setTimeout to reset security context to allow window.open executing in Chrome
			setTimeout(function () {
				container.showRelatedItemById(id);
			}, 0);
		}
		if (relationships && relationships.updateTabbarState) {
			relationships.updateTabbarState(RelType_ID);
		}

		const rowId = id;
		const column = RELATED_IT_NAME === '' ? 0 : 1;
		const isSetEditableCell =
			bFlag && show_related !== '1' && grid.items_Experimental.is(rowId);
		const gridComponent = grid._grid;

		if (gridComponent) {
			grid.setSelectedRow(rowId, false, true);
			if (!isSetEditableCell) {
				return;
			}
			gridComponent.settings.focusedCell = {
				rowId: rowId,
				editing: true,
				headId: gridComponent.settings.indexHead[column]
			};
			return;
		}

		//due to async execution of setTimeout in FF we have to call this after handleRowEvent
		editWait = setTimeout(function () {
			grid.setSelectedRow(rowId, false, true);
			if (!isSetEditableCell) {
				return;
			}

			const columnCount = grid.columns_Experimental.get('count');
			for (let i = 0; i < columnCount; i++) {
				if (grid.getColumnOrder(i) === column) {
					const cell = grid.cells(rowId, i);
					const editCellInfo = grid.grid_Experimental.edit.info;
					const editCell = editCellInfo && editCellInfo.cell;
					const isEdited = editCell && editCell.itemId === rowId;
					if (!cell.isCheckbox() && !isEdited) {
						grid.edit_Experimental.set(rowId, i);
					}
					break;
				}
			}
		}, 300);
	};

	container.processCommand = function (cmdId, col) {
		relationshipsGrid.processCommand(cmdId, col);
	};

	container.onCopy2Clipboard = function () {
		relationshipsGrid.onCopy2Clipboard();
	};

	container.onPaste = function () {
		return relationshipsGrid.onPaste();
	};

	container.RedlineController = function () {
		this.isRedlineActive = false;
		this.isGridRedlinable = false;
		this.searchAmlBackup = null;
		this.searchIdBackup = null;
		this.isRedlineReady = false;
		this._releasedInitXML = null;
		this._prevReleasedDom, (this.isBaseXmlLoaded = false);

		this.InitRedlinePreference = function () {
			this.isRedlineActive =
				this.isGridRedlinable &&
				'1' ===
					aras.getPreferenceItemProperty(
						'Core_RelGridLayout',
						RelType_ID,
						'redline_view'
					);
			if (this.isRedlineActive) {
				this.TurnOffSearch();
			}
		};

		this.InitRedlineControls = function () {
			var itemType = aras.getItemTypeNodeForClient(itemTypeName, 'name');
			var isVersionable = aras.getItemProperty(itemType, 'is_versionable');

			this.isGridRedlinable = isVersionable === '1';
			container.setControlEnabled('redline', this.isGridRedlinable);
		};

		this.IsReleasedVersionExists = function () {
			var configId = aras.getItemProperty(item, 'config_id');
			if (configId) {
				var itemType = aras.getItemTypeNodeForClient(itemTypeName, 'name');
				var instanceData = aras.getItemProperty(itemType, 'instance_data');
				var response;
				var lastReleasedAml =
					"<Item type='" +
					itemTypeName +
					"' action='GetReleasedMaxGenerationRelGrid'>" +
					'<config_id>' +
					configId +
					'</config_id>' +
					'<instance_data>' +
					instanceData +
					'</instance_data>' +
					'</Item>';

				response = aras.soapSend('ApplyItem', lastReleasedAml);
				if (response.isFault()) {
					if (response.getFaultCode() != 0) {
						aras.AlertError(response, null, null, window);
					}
					return false;
				}

				topWindow_Experimental.prevReleasedDom = response;
				return true;
			} else {
				return false;
			}
		};

		this.GetLastReleasedInitXML = function () {
			var tempDom = topWindow_Experimental.prevReleasedDom.results;
			var result = tempDom.selectSingleNode(aras.XPathResult());
			var itemNode = result.selectSingleNode('Item');
			var releasedId = itemNode.getAttribute('id');
			var aml =
				"<Item type='" +
				relationshipTypeName +
				"' action='get' page='1'>" +
				" <source_id condition='like'>" +
				releasedId +
				'</source_id> ' +
				' </Item>';

			var res = aras.soapSend('ApplyItem', aml);

			if (res.getFaultCode() != 0) {
				aras.AlertError(res, null, null, window);
				window.close();
			}

			tempDom = res.isFault() ? createEmptyResultDom() : res.results;
			const isInfernoRelationshipGrid = !!grid._grid;
			if (isInfernoRelationshipGrid) {
				return window.adaptGridRowsFromXml(tempDom, {
					headMap: grid._grid.head,
					indexHead: grid._grid.settings.indexHead
				});
			}
			const columnObjects = aras.uiPrepareDOM4XSLT(tempDom, RelType_ID, 'RT_');
			return container.getGenerateRelationshipsGridXML(tempDom, columnObjects);
		};

		this.RefreshRedlineView = function () {
			if (!this.isRedlineReady) {
				this.CheckReleasedVersion();
				var itemNode = aras.getItemTypeNodeForClient(itemTypeName);
				var isVersionable = aras.getItemProperty(itemNode, 'is_versionable');

				if (isVersionable == '0' || !isVersionable) {
					alert('Type not allow versions');
					return null;
				}

				if (this._releasedInitXML) {
					if (!this.isBaseXmlLoaded) {
						grid.loadBaselineXML_Experimental(this._releasedInitXML);
						grid.AddAllColumnsToDiffView();
						grid.RemoveColumnFromDiffView('L');
						this.isBaseXmlLoaded = true;
					}

					grid.EnableDiffMode = true;
					this.isRedlineReady = true;
				}
			} else {
				grid.refreshRedlineView_Experimental();
			}

			return true;
		};

		this.CheckReleasedVersion = function () {
			if (topWindow_Experimental.window.IsReleasedVersionExists === undefined) {
				topWindow_Experimental.window.IsReleasedVersionExists = this.IsReleasedVersionExists();
			}

			if (topWindow_Experimental.window.IsReleasedVersionExists) {
				this._releasedInitXML = this.GetLastReleasedInitXML();
			}
		};

		this.ToggleRedline = function () {
			this.CheckReleasedVersion();
			if (!topWindow_Experimental.window.IsReleasedVersionExists) {
				aras.AlertError(
					aras.getResource('', 'relationshipsgrid.no_released_generation'),
					null,
					null,
					window
				);
				return;
			}

			if (!this.isRedlineActive) {
				this.EnableRedline();
			} else {
				this.DisableRedline();
			}
		};

		this.IsRedlineCanBeDisable = function () {
			return this.isRedlineActive && this.isRedlineReady;
		};

		this.EnableRedline = function () {
			this.isRedlineActive = true;
			this.TurnOffSearch();

			if (this.RefreshRedlineView() == null) {
				this.isRedlineActive = false;
				this.RestoreSearchMode();
				return;
			}
		};

		this.DisableRedline = function () {
			if (this.isRedlineReady) {
				this.isRedlineActive = false;
				this.isRedlineReady = false;

				grid.EnableDiffMode = false;
				this.RestoreSearchMode();
			}
		};

		this.TurnOffSearch = function () {
			container.setControlEnabled('search_mode', false);

			this.searchIdBackup = currentSearchMode.id;
			this.searchAmlBackup = currentSearchMode.getAml();
			searchContainer._updateAutoSavedSearch();

			if (currentSearchMode.name != 'NoUI') {
				var noUISearchMode = container.getSearchModeByName('NoUI');
				if (noUISearchMode) {
					searchContainer.showSearchMode(
						aras.getItemProperty(noUISearchMode, 'id')
					);
				}
			}

			currentSearchMode.clearSearchCriteria();
			currentSearchMode.setPageNumber(1);
			doSearch();
		};

		this.RestoreSearchMode = function () {
			if (this.searchIdBackup != null && this.searchAmlBackup != null) {
				currentSearchMode.setAml(this.searchAmlBackup);
				searchContainer.showSearchMode(this.searchIdBackup);
			}

			doSearch();
			container.setControlEnabled('search_mode', true);
		};
	};

	container.getSearchModeByName = function (sModeName) {
		if (!sModeName) {
			return null;
		}

		var modes = aras.getSearchModes();
		if (modes) {
			for (var i = 0; i < modes.length; i++) {
				if (aras.getItemProperty(modes[i], 'name') == sModeName) {
					return modes[i];
				}
			}
		}

		return null;
	};

	container.onPasteSpecial = function () {
		relationshipsGrid.onPasteSpecial();
	};

	container.relshipsGrid_showInputHelperDialog = function (rowID, column) {
		const whiteListDataType = ['ml_string', 'item', 'date'];
		const cell = grid.grid_Experimental.layout.cells[column];
		const currSelColOrder = cell ? cell.layoutIndex : column;
		const propDataType = propsArr[currSelColOrder].data_type;
		const isInputRow = rowID === 'input_row' || rowID === 'searchRow';

		if (isInputRow) {
			currSelRowId = 'input_row';
			currSelCol = column;
		}

		const propName = propsArr[currSelCol].name;

		currSelCell = grid.cells(
			isInputRow ? currSelRowId : rowID,
			currSelColOrder
		);

		if (propName === 'classification' || propName === 'class_path') {
			container.showClassificationDialog(propName);
			return;
		}

		if (
			!whiteListDataType.includes(propDataType) ||
			propName === 'current_state'
		) {
			lookUp(currSelRowId, currSelCol);
			currSelCell = null;
			grid.turnEditOff();
			return;
		}

		switch (propDataType) {
			case 'ml_string':
				container.showMLDialog();
				break;
			case 'item':
				const propSource_ITName = aras.getItemTypeName(
					propsArr[currSelColOrder].data_source
				);
				container.showDialog(propSource_ITName);
				break;
			case 'date':
				if (isInputRow) {
					lookUp(currSelRowId, currSelCol);
				} else {
					var RelTypeIT =
						propsArr[currSelColOrder].DRL === 'R'
							? RelatedItemType_Nd
							: DescByItemType_Nd;
					var propNd = RelTypeIT.selectSingleNode(
						'Relationships/Item[@type="Property" and name="' +
							propsArr[currSelColOrder].name +
							'"]'
					);
					(format = aras.getItemProperty(propNd, 'pattern')),
						(prevVal = container.systemGetValueForCurrentCell());

					format = aras.getDotNetDatePattern(format);
					container.showDateDialog(prevVal, format);
				}
				break;
		}
	};

	container.onLink = function (LinkItemType, LinkItemID) {
		if (!isEditMode) {
			aras.uiShowItem(LinkItemType, LinkItemID, undefined);
		}
	};

	container.onDoubleClick = function (rowId) {
		relationshipsGrid.onDoubleClick(rowId);
	};

	container.Synchronizer = function (relID, win, tmout) {
		this.relID = relID;
		this.win = win;
		this.rel_LastModifiedOn = -1;
		this.related_LastModifiedOn = -1;

		var relNd = item.selectSingleNode(
			"Relationships/Item[@id='" + this.relID + "']"
		);
		if (!relNd) {
			return;
		}
		var relatedNd = relNd.selectSingleNode('related_id/Item');

		this.relationshipPresence = relNd != null; //should always be true
		this.relatedPresence = relatedNd != null; //may vary
		this.lastItemEditState = aras.isEditStateEx(relatedNd);

		if (tmout == undefined) {
			tmout = 1000;
		}

		Synchronizers[relID] = this;

		this.interval = setInterval(
			'if (Synchronizers["' +
				relID +
				'"] && Synchronizers["' +
				relID +
				'"].updateData) Synchronizers["' +
				relID +
				'"].updateData();',
			tmout
		);
	};

	container.Synchronizer.prototype.getLastModified = function Synchronizer_getLastModified(
		itemNd
	) {
		var res = -1;

		var attrNm = 'LastModifiedOn';
		if (itemNd && itemNd.getAttribute(attrNm)) {
			res = parseInt(itemNd.getAttribute(attrNm));
		}
		if (isNaN(res)) {
			res = -1;
		}

		return res;
	};

	container.Synchronizer.prototype.stop = function Synchronizer_stop() {
		clearInterval(this.interval);
		delete Synchronizers[this.relID];
	};

	container.Synchronizer.prototype.updateData = function Synchronizer_updateData() {
		if (aras.isWindowClosed(this.win)) {
			this.stop();
		}

		var relNd = aras.getItemRelationship(item, RelType_Nm, this.relID, true);
		var relatedNd = null;

		if (relNd) {
			relatedNd = container.getRelatedItem(this.relID);
			if (!relatedNd) {
				var rel_id = relNd.selectSingleNode("related_id[.!='']");
				if (rel_id) {
					// related_id is ID (not an Item)
					var query =
						'<Item type="' +
						RelType_Nm +
						'" id="' +
						this.relID +
						'" select="related_id" action="get"/>';
					var res = aras.soapSend('ApplyItem', query);
					var new_rel_id = res.results.selectSingleNode(
						aras.XPathResult('/Item/related_id')
					);
					if (new_rel_id) {
						relNd.replaceChild(new_rel_id, rel_id);
						relatedNd = relNd.selectSingleNode('related_id/Item');
					}
				}
			}
		}

		//check if relationship and related are not deleted yet
		if (!relNd && this.relationshipPresence) {
			//means that relationship was deleted from it's window
			this.stop();
			grid.setSelectedRow(this.relID, false, false);
			if (grid.getSelectedItemIds().length > 0) {
				container.deleteRelationship();
			}
			return;
		}
		if (!relatedNd && this.relatedPresence) {
			//means that related was deleted from it's window
			this.stop();
			grid.setSelectedRow(this.relID, false, false);
			container.removeRelatedItem();
			return;
		}
		//check if relationship and related are not deleted yet

		var rel_LastModifiedOnValue = this.getLastModified(relNd);
		var relalted_LastModifiedOnValue = this.getLastModified(relatedNd);
		const isItemInEditState = aras.isEditStateEx(relatedNd);

		var performUpdate =
			rel_LastModifiedOnValue > this.rel_LastModifiedOn ||
			relalted_LastModifiedOnValue > this.related_LastModifiedOn ||
			this.lastItemEditState !== isItemInEditState;

		if (performUpdate) {
			this.rel_LastModifiedOn = rel_LastModifiedOnValue;
			this.related_LastModifiedOn = relalted_LastModifiedOnValue;
			this.lastItemEditState = isItemInEditState;

			container.updateRow(relNd, relatedNd, false, true);
		}
	};

	//+++ to resolve IR-002599: Related item is not unlocked in Relationships Grid
	container.relatedItemLockListener = function (params) {
		var itemID = params.itemID;
		var new_ritem = params.itemNd;

		var rels = item.selectNodes(
			"Relationships/Item[@type='" +
				RelType_Nm +
				"' and (related_id/Item/@id='" +
				itemID +
				"' or related_id='" +
				itemID +
				"')]"
		);
		var selectedRows = grid.getSelectedItemIds();
		var rowId = '';

		for (var i = 0; i < rels.length; i++) {
			var rel = rels[i];
			var relId = rel.getAttribute('id');

			if (selectedRows.indexOf(relId) > -1) {
				rowId = relId;
			}

			const oldRelatedItemNode = rel.selectSingleNode(
				'related_id/Item[@id="' + itemID + '"]'
			);

			//checking for item rewrite needlessly
			if (new_ritem !== oldRelatedItemNode) {
				oldRelatedItemNode.replaceWith(new_ritem.cloneNode(true));
			}

			container.updateRow(rel, new_ritem, false, true);
		}

		container.updateControls(rowId);
	};

	//+++ to resolve IR-005480: New related not visible in grid after selection
	container.ItemSaveListener = function (params) {
		var itemID = params.itemID;
		var new_ritem = params.itemNd;
		var new_ritemID = new_ritem.getAttribute('id');

		var isNewVersion = new_ritemID != itemID;

		var oldVersionsXPath =
			"Relationships/Item[@type='" +
			RelType_Nm +
			"' and (related_id/Item/@id='" +
			itemID +
			"' or related_id='" +
			itemID +
			"')]";
		var newVersionsXPath =
			"Relationships/Item[@type='" +
			RelType_Nm +
			"' and (related_id/Item/@id='" +
			new_ritemID +
			"' or related_id='" +
			new_ritemID +
			"')]";

		var selectedRows = grid.getSelectedItemIds();
		var rowId = '';
		var relId;
		var rel;
		var i;

		if (isNewVersion) {
			var rels2NewVers = item.selectNodes(newVersionsXPath);
			//rels2NewVers contain relationships which were updated by common save item logic
			//they already contain correct related item inside. We just need to refresh UI.

			for (i = 0; i < rels2NewVers.length; i++) {
				rel = rels2NewVers[i];
				relId = rel.getAttribute('id');

				if (selectedRows.indexOf(relId) > -1) {
					rowId = relId;
				}

				container.updateRow(rel, new_ritem, false, true);
			}
		}

		var rels = item.selectNodes(oldVersionsXPath);
		for (i = 0; i < rels.length; i++) {
			rel = rels[i];
			relId = rel.getAttribute('id');

			if (selectedRows.indexOf(relId) > -1) {
				rowId = relId;
			}

			var callUpdateRow = false;
			if (isNewVersion) {
				var replaceWithNewVersion = false;

				if (aras.isTempEx(rel)) {
					replaceWithNewVersion = true;
				} else {
					var req =
						"<Item type='" +
						RelType_Nm +
						"' select='related_id' action='get' related_expand='0' id='" +
						relId +
						"'/>";
					var res = aras.soapSend('ApplyItem', req);

					if (res.getFaultCode() == 0) {
						var related_idNd = res.results.selectSingleNode(
							aras.XPathResult('/Item/related_id')
						);
						if (related_idNd) {
							replaceWithNewVersion = new_ritemID == related_idNd.text;
						}
					}
				}

				if (replaceWithNewVersion) {
					aras.setItemProperty(rel, 'related_id', new_ritem.cloneNode(true)); //updateRow updates only UI
					callUpdateRow = true;
				}
			} else {
				callUpdateRow = true;
			}

			if (callUpdateRow) {
				container.updateRow(rel, new_ritem, false, true);
			}
		}

		//second parameter enables Actions menu purging after the Relationship grid has been reloaded
		container.updateControls(rowId, true);

		var ItemName = aras.getItemProperty(item, 'name');
		if (ItemName == 'ItemType' && itemTypeName == 'ItemType') {
			container.onInitialize();
		}
	};

	//--- to resolve IR-002599: Related item is not unlocked in Relationships Grid

	container.itemDeleteListener = (params) => {
		const { itemID, itemTypeName } = params;
		const isRelationshipItem = container.RelType_Nm === itemTypeName;
		const isExistInGrid = grid._grid.settings.indexRows.includes(itemID);
		const sourceItem = container.item;

		if (isRelationshipItem && isExistInGrid) {
			const deletedRelationshipItem = sourceItem.selectSingleNode(
				`Relationships/Item[@id="${itemID}"]`
			);
			deletedRelationshipItem.parentNode.removeChild(deletedRelationshipItem);

			grid.setSelectedRow(itemID, false, false);
			container.deleteRelationship();
			return;
		}

		let isRelatedItemType = container.RELATED_IT_NAME === itemTypeName;

		const isPolyItem = aras.isPolymorphic(container.RelatedItemType_Nd);
		if (isPolyItem) {
			const morphaeList = aras.getMorphaeList(container.RelatedItemType_Nd);
			const isPolySource = morphaeList.some(
				(morphae) => morphae.name === itemTypeName
			);
			isRelatedItemType = isPolySource;
		}

		if (!isRelatedItemType) {
			return;
		}

		const relationshipItems = sourceItem.selectNodes(
			`Relationships/Item[related_id/Item/@id="${itemID}"]`
		);
		const isRelatedItem = relationshipItems.length > 0;

		if (isRelatedItem) {
			const actions = aras.getMainWindow().store.boundActionCreators;
			relationshipItems.forEach((relationship) => {
				const relationshipType = relationship.getAttribute('type');
				const relationshipId = relationship.getAttribute('id');

				actions.changeItem(relationshipType, relationshipId, {
					related_id: null
				});
			});
		}
	};

	container.showRelatedItemById = function (relID) {
		return relationshipsGrid.showRelatedItemById(relID);
	};

	container.showRelationshipById = function (relID) {
		return relationshipsGrid.showRelationshipById(relID);
	};

	//+++++ file processing
	container.showFileFromCell = function () {
		var fileId = container.findFileId();
		if (fileId) {
			aras.uiShowItem('File', fileId);
		}
	};

	container.findFileId = function () {
		//with popupMenuRowId, popupMenuCol:
		var rel = item.selectSingleNode(
			'Relationships/Item[@id="' +
				popupMenuRowId +
				'" and (not(action) or (action!="delete" and action!="purge"))]'
		);
		if (!rel) {
			return '';
		}

		var prop = propsArr[popupMenuCol];
		if (prop.data_source != FileIT_ID_const) {
			return '';
		}

		var itm = null;
		var propDRL = prop.DRL;
		if (propDRL == 'R') {
			itm = rel.selectSingleNode('related_id/Item');
			if (!itm) {
				return '';
			}
		} else if (propDRL == 'D') {
			itm = rel;
		}

		return aras.getItemProperty(itm, prop.name);
	};
	//----- file propcessing

	container.addRelationship = function (relatedItem, relatedOption) {
		callbackFunction4NewCmd_data_bf = false;

		if (!relatedItem) {
			return false;
		}

		container.newRelationship(false, relatedItem, null, relatedOption);
	};

	function pickRelatedDialogCallback(result, relatedItemTypeId, pickReplace) {
		if (!result || (Array.isArray(result) && !result.length)) {
			window.focus();
			return;
		}

		if (pickReplace) {
			const resultItem = result.item;
			if (!resultItem) {
				if (replaceToNull) {
					container.removeRelatedItem();
				} else {
					aras
						.AlertError(
							aras.getResource(
								'',
								'relationshipsgrid.related_item_cannot_null'
							),
							null,
							null,
							window
						)
						.then(function () {
							container.changeRelationship(true);
						});
				}
			} else {
				container.changeRelationship(false, resultItem);
			}
		} else {
			const type = aras.getItemTypeName(relatedItemTypeId);
			const items = container.preloadItems(type, result) || [];
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (!item) {
					continue;
				}
				container.addRelationship(item);
			}
		}
	}

	function processAdding(
		relationshipNode,
		relatedOption,
		relationshipCallback
	) {
		if (!relationshipNode) {
			return;
		}

		callback4NewCmd = callbackFunction4NewCmd;
		const selectedChoiceOption =
			relatedOption || container.getSelectedChoiceItem();
		if (selectedChoiceOption === NoRelatedOption) {
			let relatedId = relationshipNode.selectSingleNode('related_id');
			if (relatedId) {
				const relatedItem = relatedId.selectSingleNode('Item');
				if (relatedItem) {
					relatedId.removeChild(relatedItem);
				}
			} else {
				relatedId = relationshipNode.appendChild(
					relationshipNode.ownerDocument.createElement('related_id')
				);
			}
			relatedId.setAttribute('is_null', '1');
		} else if (selectedChoiceOption === CreateRelatedOption) {
			if (RelType_Nm === 'View') {
				//The new form must be a copy of an existing which is:
				//1. associated to the root level class (or where the class is null)
				//2. where the Function is equal to "Default"
				//3. the identity is equal to "World"

				const formNode = relationshipNode.selectSingleNode(
					"related_id/Item[@type='Form']"
				);
				if (formNode) {
					const classStructure = aras.getItemProperty(item, 'class_structure');
					let addCondition = '';
					if (classStructure !== '') {
						const structDom = aras.createXMLDocument();
						structDom.loadXML(classStructure);

						const tempNode = structDom.selectSingleNode('/*');
						if (tempNode) {
							addCondition =
								" or form_classification='/" +
								tempNode.getAttribute('name') +
								"'";
						}
					}

					let formToCopy = item.selectSingleNode(
						"Relationships/Item[@type='View'][role/@keyed_name='World'][type='default']" +
							"[not(form_classification) or form_classification=''" +
							addCondition +
							"]/related_id/Item[@type='Form']"
					);

					if (formToCopy) {
						formToCopy = aras.getItemById(
							'Form',
							formToCopy.getAttribute('id'),
							1,
							'Body',
							'id'
						);
						if (formToCopy) {
							const bodyToCopy = formToCopy.selectSingleNode(
								"Relationships/Item[@type='Body']"
							);
							if (bodyToCopy) {
								const newBodyNode = aras.copyItemEx(bodyToCopy, 'copy', false);
								if (newBodyNode) {
									const nodesToDelete = newBodyNode.selectNodes('.//source_id');
									for (let i = 0; i < nodesToDelete.length; i++) {
										nodesToDelete[i].parentNode.removeChild(nodesToDelete[i]);
									}

									const oldBodyNode = formNode.selectSingleNode(
										"Relationships/Item[@type='Body']"
									);
									oldBodyNode.parentNode.replaceChild(newBodyNode, oldBodyNode);
								}
							}
						}
					}
				}
			}
		}

		if (relationshipCallback) {
			relationshipCallback(relationshipNode);
		}

		relationshipNode = item
			.selectSingleNode('Relationships')
			.appendChild(relationshipNode);

		if (!aras.isTempEx(item)) {
			container.setDirtyAttribute(item);
		}

		const relatedItem = aras.getRelatedItem(relationshipNode);
		if (relatedItem) {
			if (
				aras.isPolymorphic(RelatedItemType_Nd) &&
				!aras.getItemProperty(relatedItem, 'itemtype')
			) {
				let typeId = relatedItem.getAttribute('typeId');
				if (!typeId || typeId === '') {
					const typeName = relatedItem.getAttribute('type');
					typeId = aras.getItemTypeId(typeName);
				}
				aras.setItemProperty(relatedItem, 'itemtype', typeId);
			}
		}
		container.addRow(relationshipNode, relatedItem, false);
	}

	function addRelationshipHandler(result, actionType) {
		if (actionType === 'doubleclick') {
			const itemNode = result && result.item;
			if (itemNode) {
				const type = itemNode.getAttribute('type');
				const itemId = itemNode.getAttribute('id');
				const item = aras.getItemById(type, itemId, 0);
				container.addRelationship(item);
			}
			return false;
		}
		return true;
	}

	container.showPickRelatedDialog = function (relatedItemTypeId, pickReplace) {
		if (!relatedItemTypeId) {
			return false;
		}

		const callback = function (result) {
			return pickRelatedDialogCallback(result, relatedItemTypeId, pickReplace);
		};

		const param = {
			aras: aras,
			itemtypeID: relatedItemTypeId,
			itemContext: item,
			callback: callback
		};
		if (pickReplace) {
			param.itemSelectedID = currSelRowId;
			param.multiselect = false;

			container.mergeWithServerDataIfRequired(currSelRowId);
		} else {
			param.itemSelectedID = itemID;
			param.handler = addRelationshipHandler;
			param.multiselect = true;
		}
		param.argType = 'object';
		param.sourceItemTypeName = DescByItemType_Nd
			? aras.getItemProperty(DescByItemType_Nd, 'name')
			: '';
		param.sourcePropertyName = 'related_id';

		param.type = 'SearchDialog';
		const topWindow =
			topWindow_Experimental === aras.getMainWindow()
				? topWindow_Experimental.main
				: topWindow_Experimental;
		topWindow.ArasModules.MaximazableDialog.show('iframe', param).promise.then(
			callback
		);
	};

	container.preloadItems = function (type, resArray) {
		if (!resArray || resArray.length == 0) {
			return null;
		}

		var i;
		var itms = [];
		var idsArrayForLoad = [];
		for (i = 0; i < resArray.length; i++) {
			var resID = resArray[i];
			var item = aras.itemsCache.getItem(resID);
			if (item) {
				// if item is dirty then retreive item from cache after test for completeness
				if (aras.isDirtyEx(item) || aras.isTempEx(item)) {
					itms.push(item);
				} else {
					// if item not dirty then drop it from cache and load from server original version
					idsArrayForLoad.push("'" + resID + "'");
				}
			} else {
				// if item not exists in cache then load item from server
				idsArrayForLoad.push("'" + resID + "'");
			}
		}

		if (idsArrayForLoad.length > 0) {
			var loadedItms = aras.loadItems(
				type,
				"<id condition='in'>" + idsArrayForLoad.join(',') + '</id>'
			);
			for (i = 0; i < loadedItms.length; i++) {
				itms.push(loadedItms[i]);
			}
		}
		return itms;
	};

	container.newRelationship = function (
		showSearchDialog,
		relatedNode,
		relationshipCallback,
		relatedOption
	) {
		const relationshipTypeId = aras.getRelationshipTypeId(RelType_Nm);
		const relatedItemTypeId = aras.getItemProperty(RelType_Nd, 'related_id');

		if (showSearchDialog) {
			if (!relatedItemTypeId) {
				aras.AlertError(
					aras.getResource(
						'',
						'relationshipsgrid.related_it_not_spec',
						RelType_Nm
					),
					null,
					null,
					window
				);
				return;
			}

			//showPickRelatedDialog will indirectly call newRelationship again with showSearchDialog == false
			container.showPickRelatedDialog(relatedItemTypeId);
			return;
		}

		const processAddingWrapper = function (relationshipNode) {
			const currentRelatedNode = relationshipNode.selectSingleNode(
				'related_id/Item'
			);

			if (!relatedNode && aras.isNew(currentRelatedNode)) {
				currentRelatedNode.setAttribute('isEditState', '1');
				layout.actions.addItemToEditMode(currentRelatedNode.id);
			}

			return processAdding(
				relationshipNode,
				relatedOption,
				relationshipCallback
			);
		};

		const newRelationship = aras.newRelationship(
			relationshipTypeId,
			item,
			false,
			window,
			relatedNode
		);

		if (newRelationship && newRelationship.then) {
			newRelationship.then(processAddingWrapper);
		} else {
			processAddingWrapper(newRelationship);
		}
	};

	container.changeRelationship = function (
		showSearchDialog,
		newRelatedNode,
		targetItemId
	) {
		var relatedIT_ID = aras.getItemProperty(RelType_Nd, 'related_id');

		showSearchDialog =
			showSearchDialog !== undefined ? Boolean(showSearchDialog) : true;
		if (showSearchDialog) {
			if (!relatedIT_ID) {
				aras.AlertError(
					aras.getResource(
						'',
						'relationshipsgrid.related_it_not_spec',
						RelType_Nm
					),
					null,
					null,
					window
				);
				return;
			} else {
				container.showPickRelatedDialog(relatedIT_ID, true);
				return;
			}
		}

		if (!newRelatedNode) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.cant_change_relship'),
				null,
				null,
				window
			);
			return;
		}

		topWindow_Experimental.focus();

		var relationshipId = targetItemId || grid.getSelectedId();
		if (!relationshipId) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.select_relship'),
				null,
				null,
				window
			);
			return;
		}

		var relNd = item.selectSingleNode(
			'Relationships/Item[@id="' + relationshipId + '"]'
		);
		if (!relNd) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.no_relship_item_found'),
				null,
				null,
				window
			);
			return;
		}

		var relatedIdNode = relNd.selectSingleNode('related_id');

		const replacedItem = relatedIdNode.selectSingleNode('Item');

		let oldRelatedNodeId;

		if (replacedItem) {
			oldRelatedNodeId = replacedItem.id;
		}

		if (relatedIdNode) {
			relNd.removeChild(relatedIdNode);
			const item = relatedIdNode.selectSingleNode(
				"Item[@isEditState='1' or @isTemp='1']"
			);
			if (item) {
				const actions = aras.getMainWindow().store.boundActionCreators;
				const itemId = item.getAttribute('id');
				const itemType = item.getAttribute('type');
				actions.deleteItemLocalChangesRecord(itemType, itemId);
			}
		}

		relatedIdNode = relNd.appendChild(
			relNd.ownerDocument.createElement('related_id')
		);

		var related_id = aras.getItemProperty(newRelatedNode, 'id');

		relatedIdNode.text = '';
		if (item == newRelatedNode) {
			//case of simple recursion
			newRelatedNode = item.cloneNode(true);
			newRelatedNode.setAttribute('action', 'skip');

			var relationshipsNd = newRelatedNode.selectSingleNode('Relationships');
			if (relationshipsNd) {
				newRelatedNode.removeChild(relationshipsNd);
			}
			relationshipsNd = null;
		}
		relatedIdNode.appendChild(newRelatedNode);
		relNd.setAttribute('isDirty', '1');

		if (null != relatedIdNode.getAttribute('is_null')) {
			relatedIdNode.setAttribute('is_null', '0');
		}

		if (null == relNd.getAttribute('action')) {
			relNd.setAttribute('action', 'update');
		}

		if (
			aras.isPolymorphic(RelatedItemType_Nd) &&
			newRelatedNode &&
			!aras.getItemProperty(newRelatedNode, 'itemtype')
		) {
			aras.setItemProperty(
				newRelatedNode,
				'itemtype',
				newRelatedNode.getAttribute('typeId')
			);
		}

		if (!aras.isTempID(itemID)) {
			container.setDirtyAttribute(item);
		}

		const actions = aras.getMainWindow().store.boundActionCreators;
		actions.changeItem(relNd.getAttribute('type'), relNd.getAttribute('id'), {
			related_id: newRelatedNode.getAttribute('id'),
			['related_id@aras.type']: newRelatedNode.getAttribute('type'),
			['related_id@aras.keyed_name']: aras.getItemProperty(
				newRelatedNode,
				'keyed_name'
			)
		});

		container.updateRow(relNd, newRelatedNode, false, true);
		container.updateControls(relationshipId);

		if (relationships && relationships.updateTabbarState) {
			relationships.updateTabbarState(RelType_ID);
		}

		if (replacedItem) {
			const hasNoRelationship = [...grid._grid.rows._store.values()].every(
				(row) => row.related_id !== oldRelatedNodeId
			);

			if (hasNoRelationship) {
				grid._grid.rows._store.delete(oldRelatedNodeId);
			}
		}
	};

	container.removeRelatedItem = function (relationshipId) {
		relationshipId = relationshipId || grid.getSelectedId();

		if (!relationshipId) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.select_relship'),
				null,
				null,
				window
			);
			return false;
		}

		var relationshipNode = item.selectSingleNode(
			'Relationships/Item[@id="' + relationshipId + '"]'
		);
		if (relationshipNode) {
			var relatedId = relationshipNode.selectSingleNode('related_id');

			if (relatedId) {
				relatedItem = relatedId.selectSingleNode('Item');

				if (relatedItem) {
					relatedId.removeChild(relatedItem);
				}
			} else {
				relatedId = relationshipNode.appendChild(
					relationshipNode.ownerDocument.createElement('related_id')
				);
			}
			relatedId.setAttribute('is_null', '1');

			if (null == relationshipNode.getAttribute('action')) {
				relationshipNode.setAttribute('action', 'update');
			}

			container.updateRow(relationshipNode, null, false);

			if (relationships && relationships.updateTabbarState) {
				relationships.updateTabbarState(RelType_ID);
			}
		}
	};

	container.deleteRelationship = function () {
		relationshipsGrid.deleteRelationship();
	};

	container.unlockItems = function (itemNode, itemNum, items) {
		function nextItem() {
			if (itemNum !== items.length - 1) {
				itemNum++;
				return container.unlockItems(items[itemNum], itemNum, items);
			}
		}
		const isDirty = aras.isDirtyEx(itemNode);
		if (isDirty) {
			const dialogMessage = aras.getResource(
				'',
				'common.discard_confirmationmessage'
			);
			const dialogParams = {
				title: aras.getResource('', 'common.discard_confirmationtitle')
			};
			return topWindow_Experimental.ArasModules.Dialog.confirm(
				dialogMessage,
				dialogParams
			)
				.then(function (result) {
					if (result === 'ok') {
						aras.unlockItemEx(itemNode, false);
					}
				})
				.then(function () {
					return nextItem();
				});
		} else {
			aras.unlockItemEx(itemNode);
			return nextItem();
		}
	};

	container.lockRelatedItem = function (b) {
		var selectedIds = grid.getSelectedItemIds();
		if (selectedIds.length === 0) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.select_relship'),
				null,
				null,
				window
			);
			return false;
		}
		var idsArray = selectedIds.map(function (id) {
			return '@id="' + id + '"';
		});
		var relatedNds = item.selectNodes(
			'Relationships/Item[' + idsArray.join(' or ') + ']/related_id/Item'
		);
		let res;
		if (b) {
			res = Array.prototype.map
				.call(relatedNds, function (relatedNode) {
					return aras.lockItemEx(relatedNode);
				})
				.every(function (response) {
					return !!response;
				});
		} else {
			container.unlockItems(relatedNds[0], 0, relatedNds);
		}

		var relationshipsWithoutRelatedItem = item.selectSingleNode(
			'Relationships/Item[not(related_id) and (' + idsArray.join(' or ') + ')]'
		);
		if (relationshipsWithoutRelatedItem) {
			aras.AlertError(
				aras.getResource('', 'relationshipsgrid.related_item_not_found'),
				null,
				null,
				window
			);
			return false;
		}

		return res;
	};

	container.promoteRelationship = function () {
		return relationshipsGrid.promoteRelationship();
	};

	container.emptyGrid = function () {
		for (var i = grid.getRowsNum() - 1; i >= 0; i--) {
			grid.deleteRow(grid.getRowId(i));
		}
	};

	container.updateRelationshipsWithInformationFromSearch = function (
		itemsNodes
	) {
		if (itemsNodes.length === 0) {
			return;
		}

		//merge information stored on client with information returned from server
		const relshipsXml = aras.createXMLDocument();
		relshipsXml.loadXML('<Relationships />');

		const itemsIds = [];
		for (let i = 0; i < itemsNodes.length; i++) {
			const tmpItem = itemsNodes[i];
			itemsIds.push(tmpItem.getAttribute('id'));
			relshipsXml.documentElement.appendChild(tmpItem.cloneNode(true));
		}

		//it is expected that mergeItemRelationships is smart enough to not erase unsaved client-side modifications.
		aras.mergeItemRelationships(item, relshipsXml);

		const isNotEmptyRelatedItemTypeName = RELATED_IT_NAME !== '';
		const relatedItems = new Map();

		itemsIds.forEach(function (itemId) {
			const tmpRelationship = item.selectSingleNode(
				"Relationships/Item[@id='" + itemId + "']"
			);
			if (!tmpRelationship) {
				return;
			}

			if (tmpRelationship.getAttribute('loadedPartialy') === '0') {
				tmpRelationship.removeAttribute('loadedPartialy');
			}

			if (isNotEmptyRelatedItemTypeName) {
				const relatedItem = tmpRelationship.selectSingleNode('related_id/Item');

				if (!relatedItem) {
					return;
				}

				const loadedPartialyAttributeValue = relatedItem.getAttribute(
					'loadedPartialy'
				);
				if (loadedPartialyAttributeValue === '0') {
					relatedItem.removeAttribute('loadedPartialy');
				}

				const relatedItemId = relatedItem.getAttribute('id');
				relatedItems.set(relatedItemId, relatedItem);
			}
		});

		if (!isNotEmptyRelatedItemTypeName || !relatedItems.size) {
			return;
		}

		const xpathForEditedRelatedItems =
			"/Innovator/Items/Item[@type='" +
			RELATED_IT_NAME +
			"' and (@isTemp='1' or @isEditState='1')]";
		const cachedRelatedItems = aras.itemsCache.getItemsByXPath(
			xpathForEditedRelatedItems
		);

		const cachedRelatedItemsLength = cachedRelatedItems.length;
		for (let i = 0; i < cachedRelatedItemsLength; i++) {
			const cachedRelatedItem = cachedRelatedItems[i];
			const cachedRelatedItemId = cachedRelatedItem.getAttribute('id');
			const relatedItemToBeUpdated = relatedItems.get(cachedRelatedItemId);

			if (!relatedItemToBeUpdated) {
				continue;
			}

			const newIsEditState = aras.isLockedByUser(relatedItemToBeUpdated)
				? '1'
				: '0';
			relatedItemToBeUpdated.setAttribute('isEditState', newIsEditState);

			aras.itemsCache.updateItem(relatedItemToBeUpdated, true);

			relatedItems.delete(cachedRelatedItemId);
			if (relatedItems.size === 0) {
				return;
			}
		}
	};

	container.syncWithClient = function (resDom) {
		relationshipsGrid.syncWithClient(resDom);
	};

	container.generateXML4Relationship = function (relationshipNd) {
		//returns grid ready xml document with information about just one row
		var tmpDom = createEmptyResultDom();
		var res = tmpDom.selectSingleNode(aras.XPathResult());
		res.appendChild(relationshipNd.cloneNode(true));

		const columnObjects = aras.uiPrepareDOM4XSLT(tmpDom, RelType_ID, 'RT_');

		var grid_xml = container.getGenerateRelationshipsGridXML(
			tmpDom,
			columnObjects
		);
		tmpDom.loadXML(grid_xml);
		return tmpDom;
	};

	container.system_UpdateGridCell = function (cell, tdNd) {
		var td_textColor = tdNd.getAttribute('textColor');
		var td_link = tdNd.getAttribute('link');
		var td_bgColor = tdNd.getAttribute('bgColor');
		var td_font = tdNd.getAttribute('font');
		var td_value = tdNd.text;

		if (td_textColor) {
			try {
				cell.setTextColor(td_textColor);
			} catch (excep) {}
		}
		if (td_link) {
			cell.setLink(td_link);
		}
		if (td_bgColor) {
			try {
				cell.setBgColor_Experimental(td_bgColor);
			} catch (excep) {}
		}
		if (td_font) {
			cell.setFont(td_font);
		}

		if (cell != null) {
			cell.setValue(td_value);
		}
	};

	container.updateRow = function (
		relNd,
		relatedNd,
		markDirty,
		onlyUI,
		checkRelated
	) {
		if (!relNd) {
			return false;
		}
		if (checkRelated === undefined) {
			checkRelated = true;
		}

		const relId = relNd.getAttribute('id');

		if (checkRelated && relatedNd) {
			const related_id = relatedNd.getAttribute('id');

			const rels2update = item.selectNodes(
				'Relationships/Item' +
					"[@type='" +
					RelType_Nm +
					"' " +
					"and (related_id='" +
					related_id +
					"' or related_id/Item/@id='" +
					related_id +
					"') " +
					"and @id!='" +
					relId +
					"']"
			);

			for (let i = 0; i < rels2update.length; i++) {
				const aRel = rels2update[i];
				const relatedId = relatedNd.getAttribute('id');
				//checking for item rewrite needlessly
				if (
					relatedNd !=
					aRel.selectSingleNode('related_id/Item[@id="' + relatedId + '"]')
				) {
					aras.setItemProperty(
						aRel,
						'related_id',
						relatedNd.cloneNode(true),
						false
					);
				}
				container.updateRow(aRel, relatedNd, markDirty, onlyUI, false);
			}
		}

		const tmpNd = relNd.cloneNode(true);
		let tmpNd2 = tmpNd.selectSingleNode('related_id');
		if (tmpNd2) {
			tmpNd.removeChild(tmpNd2);
		}
		tmpNd2 = tmpNd.appendChild(
			aras.createXMLDocument().createElement('related_id')
		);
		if (relatedNd) {
			tmpNd2.appendChild(relatedNd.cloneNode(true));
		}

		if (grid._grid) {
			const rowsInfo = window.adaptGridRowsFromXml(
				'<Result>' + tmpNd.xml + '</Result>',
				{
					headMap: grid._grid.head,
					indexHead: grid._grid.settings.indexHead
				}
			);
			rowsInfo.rowsMap.forEach(function (row, key) {
				grid._grid.rows._store.set(key, row);
			});
			if (redlineController.isRedlineActive) {
				redlineController.RefreshRedlineView();
			}
			grid._grid.render();
			return;
		}

		const itemXml = container.generateXML4Relationship(tmpNd);
		const itemPropertiesXml = itemXml.selectNodes(
			"/table/tr[@id='" + relId + "']/td"
		);

		for (let i = 0; i < itemPropertiesXml.length; i++) {
			const property = itemPropertiesXml[i];
			const cell = grid.cells(relId, i);
			container.system_UpdateGridCell(cell, property);
		}
	};

	container.onKeyPressed = function (key) {
		if (!grid._grid && key.key === 'Tab' && !key.shiftKey) {
			if (grid.focus_Experimental.isLastCell()) {
				bCreateNew = true;
			}
		}
	};

	container.addRow = function (relationshipNode, relatedItemNode, markDirty) {
		relationshipsGrid.addRow(relationshipNode, relatedItemNode, markDirty);
	};

	container.applyCellEditRG = function (rowId, field, value) {
		if (rowId == 'input_row') {
			applyCellEditCommon.call(this, rowId, field, value);
			return;
		}

		var col = fieldsArr.indexOf(field);
		var res;
		if (!bKEYEDNAME_INPUT_IS_IN_PROGRESS) {
			res = container.onGridCellEdit_mode2(rowId, col);
			if (res) {
				currSelCell = null;
			}
		} else {
			container.onInputKeyedNameFinished(value, col);
		}

		if (res && bCreateNew) {
			bCreateNew = false;
			if (grid.focus_Experimental.isLastCell()) {
				container.processCommand('new');
			}
		}
	};

	container.checkThatItemTypePropsLoaded = function () {
		if (!item.getAttribute('propsLoaded')) {
			aras.getItemRelationships(
				'ItemType',
				item.getAttribute('id'),
				'Property'
			);
			item.setAttribute('propsLoaded', '1');
		}
	};

	container._handleInvalidCellValue = function (message) {
		var continueEdit;
		if (message) {
			continueEdit = aras.confirm(message);
		} else {
			continueEdit = aras.showValidationMsg();
		}

		if (continueEdit) {
			grid.requestFocus(currSelCol);
			return InvalidCellValueAction.ContinueEdit;
		} else {
			return InvalidCellValueAction.Discard;
		}
	};

	container.startCellEditRG = function (rowId, field) {
		var col = fieldsArr.indexOf(field);
		var propDT = propsArr[col].data_type;
		var cell = grid.cells(rowId, parseInt(col));

		currSelCell = cell;
		currSelRowId = rowId;
		currSelCol = col;

		if ('input_row' === rowId) {
			if (propDT == 'filter list') {
				container.checkThatItemTypePropsLoaded();

				var RelTypeIT = aras.getItemProperty(
					RelType_Nd,
					propsArr[col].DRL == 'R' ? 'related_id' : 'relationship_id'
				);
				var filterValue = container.getFilterValue(rowId, col) || '';
				var resObj = aras.uiGetFilteredObject4Grid(
					RelTypeIT,
					propsArr[col].name,
					filterValue
				);

				if (resObj.hasError) {
					return false;
				}
				grid.inputRow.set(col, 'comboList', resObj.values, resObj.labels);

				var currentCellValue = grid.GetCellValue(rowId, parseInt(col));
				if (!hasValue(resObj.values, currentCellValue)) {
					grid.inputRow.set(col, 'value', '');
				}
			} else if (propDT == 'item') {
				cell.SetInputHelperIcon('../images/Ellipsis.svg');
				cell.InputHelperEnabled = true;
			}

			if (RelType_Nm == 'Property' && propsArr[col].name == 'pattern') {
				container.checkThatItemTypePropsLoaded();

				var props = item.selectNodes(
					'Relationships/Item[@type="Property" and (not(@action) or (@action!="delete" and @action!="purge"))]'
				);
				var _listVals = [];
				_listVals.push('');
				for (var i = 0; i < props.length; i++) {
					_listVals.push(aras.getItemProperty(props[i], 'name'));
				}
				_listVals.sort();
				grid.inputRow.set(col, 'comboList', _listVals);
			}
			return;
		}

		function hasValue(array, value) {
			if (!array) {
				return;
			}

			for (var i = 0; i < array.length; i++) {
				if (array[i] == value) {
					return true;
				}
			}
			return false;
		}
	};

	container.onGridCellEdit_mode2 = function (rowId, col) {
		if ('input_row' === rowId) {
			return;
		}

		var restoreGlobalVar = container.setGlobalVariableForEditMode(rowId, col);
		try {
			var cell = grid.cells(rowId, parseInt(col));
			var RelTypeIT =
				propsArr[col].DRL === 'R' ? RelatedItemType_Nd : DescByItemType_Nd;
			if (!RelTypeIT) {
				return false;
			}

			var prevCurrSelCell = currSelCell;
			var prevCurrSelRowId = currSelRowId;
			var prevCurrSelCol = grid._grid ? col : currSelCol;
			var propNm;
			var propNd;

			for (var i = 0; i < propsArr.length; i++) {
				if (propsArr[i].data_type == 'filter list') {
					propNm = propsArr[i].name;
					propNd = RelTypeIT.selectSingleNode(
						'Relationships/Item[@type="Property" and name="' + propNm + '"]'
					);
					if (!propNd) {
						continue;
					}

					var pattern = aras.getItemProperty(propNd, 'pattern');
					if (pattern == propsArr[parseInt(col)].name) {
						var tmp1 = propsArr[col].DRL;
						var tmp2 = propsArr[col].name;
						if (tmp1 == 'D') {
							tmp1 = container.getRelationshipProperty(rowId, tmp2);
						} else {
							tmp1 = container.getRelatedItemProperty(rowId, tmp2);
						}

						const currentValueInCell = grid.cells(rowId, col).getValue();
						if (grid._grid) {
							currSelCell = grid.cells(rowId, col);
							currSelRowId = rowId;
							currSelCol = col;
							container.setupProperty(currentValueInCell);
						}

						currSelCell = grid.cells(rowId, i);
						if (currentValueInCell != tmp1) {
							currSelRowId = rowId;
							currSelCol = i;
							if (rowId == 'input_row') {
								try {
									grid.cells(rowId, i).setValue('');
								} catch (e) {}
							} else {
								container.setupProperty('');
							}
						}
					}
				}
			}

			currSelCell = prevCurrSelCell;
			currSelRowId = prevCurrSelRowId;
			currSelCol = prevCurrSelCol;

			var itm = null;
			if (propsArr[col].DRL == 'D') {
				itm = item.selectSingleNode('Relationships/Item[@id="' + rowId + '"]');
			} else if (propsArr[col].DRL == 'R') {
				itm = item.selectSingleNode(
					'Relationships/Item[@id="' + rowId + '"]/related_id/Item'
				);
			}
			if (!itm) {
				return false;
			}

			isDescBy = propsArr[col].DRL == 'D';

			var val = '';
			var visibleVal = '';

			propNm = propsArr[col].name;
			propNd = RelTypeIT.selectSingleNode(
				'Relationships/Item[@type="Property" and name="' + propNm + '"]'
			);
			if (!propNd) {
				throw zeroError;
			}

			var readonly = aras.getItemProperty(propNd, 'readonly') == '1';
			if (cell.isCheckbox()) {
				if (
					readonly ||
					!container.handleCellEvent('oneditstart', currSelRowId, currSelCol)
				) {
					cell.setChecked(cell.isChecked() ? 0 : 1);
					return true;
				} else {
					val = cell.isChecked() ? 1 : 0;
				}
			} else {
				val = cell.getValue();
			}

			var propDT = propsArr[col].data_type;
			if (propDT === 'md5') {
				val = aras.calcMD5(val);
			} else if (propDT === 'boolean') {
				val = val ? '1' : '0';
			}

			if (RelType_Nm == 'RelationshipType') {
				if (propNm == 'name') {
					var relationship_id_Nd = itm.selectSingleNode('relationship_id/Item');
					if (relationship_id_Nd) {
						aras.setItemProperty(relationship_id_Nd, 'name', val);
					}
				}
			}

			container.setupProperty(val, true);

			container.handleCellEvent('onchangecell', rowId, currSelCol);
			container.handleCellEvent('oneditfinish', rowId, currSelCol);

			return true;
		} finally {
			container.restoreGlobalVariableForEditMode(restoreGlobalVar);
		}
	};

	container.setGlobalVariableForEditMode = function (rowId, col) {
		// if we click to input row from edit cell
		// onFocus event set currSelRowId to "input_row" before onGridCellEdit_mode2
		// that is not correct. So we need emulate the behavior when rowId === currSelRowId
		var restoreGlobalVar;
		if (currSelRowId == 'input_row' && rowId !== currSelRowId) {
			restoreGlobalVar = {
				currSelRowId: currSelRowId,
				currSelCell: currSelCell,
				currSelCol: currSelCol
			};
			currSelRowId = rowId;
			currSelCell = grid.cells(rowId, col);
			currSelCol = col;
		}
		return restoreGlobalVar;
	};

	container.restoreGlobalVariableForEditMode = function (restoreGlobalVar) {
		if (restoreGlobalVar) {
			currSelRowId = restoreGlobalVar.currSelRowId;
			currSelCell = restoreGlobalVar.currSelCell;
			currSelCol = restoreGlobalVar.currSelCol;
		}
	};

	container.onInputKeyedNameFinished = function (val, col) {
		var propSource_ITName = aras.getItemTypeName(propsArr[col].data_source);
		var tmpItem = aras.uiGetItemByKeyedName(propSource_ITName, val);
		bKEYEDNAME_INPUT_IS_IN_PROGRESS = false;

		if (tmpItem) {
			var keyedName = tmpItem.selectSingleNode('keyed_name').text;
			var res = tmpItem.getAttribute('id');
			if (propsArr[currSelCol].name == 'related_id' && res != itemID) {
				var relatedItm = aras.getItemById(RELATED_IT_NAME, res, 0);
				if (!relatedItm) {
					aras.AlertError(
						aras.getResource(
							'',
							'relationshipsgrid.failed_get_related_item_id',
							RELATED_IT_NAME,
							res
						),
						null,
						null,
						window
					);
					container.setupProperty('', true);
				} else {
					container.setupProperty(relatedItm, true);
				}

				var itm = item.selectSingleNode(
					'Relationships/Item[@id="' + currSelRowId + '"]'
				);
				relatedItm = null;
				if (itm) {
					relatedItm = itm.selectSingleNode('related_id/Item');
				}
				container.updateRow(itm, relatedItm);
				if (itm) {
					container.updateControls(itm.getAttribute('id'));
				}
			} else {
				res = tmpItem.cloneNode(false);
				res.setAttribute('action', 'skip');
				res.setAttribute('keyed_name', keyedName);
				container.setupProperty(res, true);
			}
		} else {
			container.setupProperty('', true);
		}

		container.handleCellEvent('onchangecell', currSelRowId, currSelCol);
		container.handleCellEvent('oneditfinish', currSelRowId, currSelCol);
	};

	container.setupProperty = function (propertyValue, markDirty) {
		if (!currSelCell) {
			return;
		}

		const propDRL = propsArr[currSelCol].DRL;
		const propDT = propsArr[currSelCol].data_type;
		const propertyName = propsArr[currSelCol].name;
		const gridComponent = grid._grid;

		if (gridComponent && currSelRowId === 'input_row') {
			grid.inputRow.set(currSelCol, 'value', propertyValue);
			return;
		}

		rel = item.selectSingleNode(
			'Relationships/Item[@type="' +
				RelType_Nm +
				'" and @id="' +
				currSelRowId +
				'"]'
		);
		if (!rel) {
			return;
		}
		relId = currSelRowId;

		const currentItem =
			propDRL === 'D' ? rel : rel.selectSingleNode('related_id/Item');

		if (currentItem) {
			//because "related item" now not always in opened "item"
			aras.setItemProperty(currentItem, propertyName, propertyValue);

			if (propDT === 'ml_string') {
				aras.setItemPropertyAttribute(
					currentItem,
					propertyName,
					'xml:lang',
					aras.getSessionContextLanguageCode()
				);
			}

			if (markDirty) {
				container.setDirtyAttribute(item);
				container.setDirtyAttribute(rel);

				if (propDRL === 'R') {
					const relatedId = currentItem.getAttribute('id');
					const relatedItems = item.selectNodes(
						'Relationships/Item[@type="' +
							RelType_Nm +
							'"]/related_id/Item[@id="' +
							relatedId +
							'"]'
					);
					for (let i = 0; i < relatedItems.length; i++) {
						container.setDirtyAttribute(relatedItems[i]);
					}
				}

				if (topWindow_Experimental.updateItemsGrid) {
					topWindow_Experimental.updateItemsGrid(item);
					topWindow_Experimental.updateItemsGrid(currentItem, false);
				}
			}
		}

		if (gridComponent) {
			const rowsInfo = window.adaptGridRowsFromXml(
				'<Result>' + rel.xml + '</Result>',
				{
					headMap: gridComponent.head,
					indexHead: gridComponent.settings.indexHead
				}
			);
			rowsInfo.rowsMap.forEach(function (row, key) {
				if (gridComponent.rows.has(key) && row['@aras.action'] === 'skip') {
					return;
				}
				gridComponent.rows._store.set(key, row);
			});
			if (redlineController.isRedlineActive) {
				redlineController.RefreshRedlineView();
			}
			gridComponent.render();
			return;
		}

		const tmpDom = container.generateXML4Relationship(rel);
		const td = tmpDom.selectSingleNode(
			"/table/tr[@id='" +
				relId +
				"']/td[position()=" +
				(parseInt(currSelCol) + 1) +
				']'
		);
		container.system_UpdateGridCell(currSelCell, td);
	};

	////////////////////////////  +++ Dialogs +++  ////////////////////////////
	container.onAfterSpecialDialog = function (
		dialogRes,
		acceptEmptyString,
		specialCase
	) {
		if (
			(acceptEmptyString && (dialogRes == undefined || dialogRes == null)) ||
			(!acceptEmptyString && !dialogRes)
		) {
			currSelCell = null;
			grid.requestFocus(currSelCol);
			return;
		}

		if (specialCase !== undefined && dialogRes === specialCase) {
			dialogRes = '';
		}

		var prevVal = container.systemGetValueForCurrentCell();

		container.setupProperty(dialogRes, true);

		// +++ fire onchangecell and oneditfinish events
		if (prevVal !== dialogRes) {
			container.handleCellEvent('onchangecell', currSelRowId, currSelCol);
		}

		container.handleCellEvent('oneditfinish', currSelRowId, currSelCol);
		// --- fire onchangecell and oneditfinish events

		currSelCell = null;
		grid.requestFocus(currSelCol);
	};

	container.showDialog = function (IT_Name) {
		var itm = item.selectSingleNode(
			"Relationships/Item[@id='" +
				currSelRowId +
				"']" +
				(propsArr[currSelCol].DRL == 'R' ? '/related_id/Item' : '')
		);
		var curITName = itm ? itm.getAttribute('type') : '';
		var curPropName = propsArr[currSelCol].name;

		var params = {
			aras: aras,
			itemtypeName: IT_Name,
			itemContext: item,
			itemSelectedID: currSelRowId,
			sourceItemTypeName: curITName,
			sourcePropertyName: curPropName,
			multiselect: false
		};
		params.type = 'SearchDialog';
		(
			topWindow_Experimental.main || topWindow_Experimental
		).ArasModules.MaximazableDialog.show('iframe', params).promise.then(
			function (dlgRes) {
				if (dlgRes == undefined) {
					return;
				}
				if ('input_row' === currSelRowId) {
					grid.turnEditOff();
					grid.inputRow.set(currSelCol, 'value', dlgRes.keyed_name);
					if (grid._grid) {
						grid.requestFocus(currSelCol);
					}
					return;
				}
				if (dlgRes.itemID) {
					if (grid._grid) {
						grid.onStartEdit_Experimental(
							currSelRowId,
							grid.grid_Experimental.order[currSelCol]
						);
					}
					var keyedName = dlgRes.keyed_name;
					var res = dlgRes.itemID;
					if (propsArr[currSelCol].name == 'related_id' && res != itemID) {
						var relatedItm = aras.getItemById(RELATED_IT_NAME, res, 0);
						if (!relatedItm) {
							aras.AlertError(
								aras.getResource(
									'',
									'relationshipsgrid.failed_get_related_item_id',
									RELATED_IT_NAME,
									res
								),
								null,
								null,
								window
							);
							container.setupProperty('', true);
						} else {
							container.setupProperty(relatedItm, true);
						}
						var itm = item.selectSingleNode(
							'Relationships/Item[@id="' + currSelRowId + '"]'
						);
						relatedItm = null;
						if (itm) {
							relatedItm = itm.selectSingleNode('related_id/Item');
						}
						container.updateRow(itm, relatedItm);
						if (itm) {
							container.updateControls(itm.getAttribute('id'));
						}
					} else {
						res = dlgRes.item.cloneNode(false);
						res.setAttribute('action', 'skip');
						res.setAttribute('keyed_name', keyedName);
						container.setupProperty(res, true);
					}
				} else {
					container.setupProperty('', true);
				}
				bKEYEDNAME_INPUT_IS_IN_PROGRESS = false;
				container.handleCellEvent('oneditfinish', currSelRowId, currSelCol);
				currSelCell = null;
				container.handleCellEvent('onchangecell', currSelRowId, currSelCol);
			}
		);
	};

	container.showMLDialog = function () {
		let itm = item.selectSingleNode(
			"Relationships/Item[@id='" +
				currSelRowId +
				"']" +
				(propsArr[currSelCol].DRL == 'R' ? '/related_id/Item' : '')
		);
		if (!itm) {
			itm = aras.getItemTypeNodeForClient(itemTypeName);
		}
		const curPropName = propsArr[currSelCol].name;
		const oldVal = aras.getItemProperty(itm, curPropName);

		aras
			.getItemPropertyTranslations(itm, curPropName)
			.then(function (translations) {
				const topWnd = aras.getMostTopWindowWithAras(window);

				return topWnd.ArasCore.Dialogs.multiLingual(translations, {
					readOnly: !isEditMode
				});
			})
			.then(function (updatedTranslations) {
				const isUpdated = aras.setItemPropertyTranslations(
					itm,
					curPropName,
					updatedTranslations
				);
				if (!isUpdated) {
					return;
				}

				const newVal = aras.getItemProperty(itm, curPropName);
				container.setupProperty(newVal, true);

				container.handleCellEvent('oneditfinish', currSelRowId, currSelCol);
				currSelCell = null;

				if ('input_row' !== currSelRowId) {
					grid.cells(currSelRowId, currSelCol).setValue(newVal);
				} else {
					grid.inputRow.set(currSelCol, 'value', newVal);
				}

				grid.turnEditOff();
			});
	};

	container.showClassStructureDialog = function (it, dialogType, title) {
		var class_structure = aras.getItemProperty(it, 'class_structure');
		if (!class_structure) {
			class_structure = '<class id="' + aras.getItemProperty(it, 'id') + '" />';
		}

		if (item.getAttribute('type') == 'ItemType') {
			var propNds = aras.getItemRelationshipsEx(item, 'Property');
			var relshipsXml = aras.createXMLDocument();
			relshipsXml.loadXML('<Relationships />');
			if (propNds != null) {
				for (var i = 0; i < propNds.length; i++) {
					if (
						!item.selectSingleNode(
							'Relationships/Item[@id="' + propNds[i].getAttribute('id') + '"]'
						)
					) {
						relshipsXml.documentElement.appendChild(propNds[i].cloneNode(true));
					}
				}
			}

			aras.mergeItemRelationships(item, relshipsXml);
		}

		function showClassStructureDialog(callback) {
			const classStructure = class_structure.replace(
				/\benabled="0"/g,
				'enabled="1"'
			);
			var param = {
				aras: aras,
				isEditMode: isEditMode,
				class_structure: classStructure,
				dialogType: dialogType,
				title: title,
				isRootClassSelectForbidden: true,
				dialogHeight: 700,
				dialogWidth: 600,
				resizable: true,
				content: 'ClassStructureDialog.html'
			};
			var targetItem = it || item;

			if (targetItem.getAttribute('type') == 'ItemType') {
				param.itemTypeName = aras.getItemProperty(targetItem, 'name');

				if (!param.itemTypeName) {
					aras.AlertError(
						aras.getResource('', 'classstructure.itemname_cannot_be_empty'),
						'',
						'',
						window
					);
					return;
				}
			} else {
				param.itemTypeName = targetItem.getAttribute('type');
			}

			param.selectLeafOnly = !(
				itemTypeName == 'ItemType' &&
				(RelType_Nm == 'Property' ||
					RelType_Nm == 'ItemType Life Cycle' ||
					RelType_Nm == 'Can Add' ||
					RelType_Nm == 'DiscussionTemplate')
			);

			if (currSelCell != null) {
				param.expandClassPath = currSelCell.getValue();
			}
			(
				topWindow_Experimental.main || topWindow_Experimental
			).ArasModules.MaximazableDialog.show('iframe', param).promise.then(
				callback
			);
		}

		if (RelType_Nm == 'View') {
			// return (bool): True if continue needed.
			const showContinueDialog = function (message) {
				var params = {
					buttons: {
						btnYes: aras.getResource('', 'common.yes'),
						btnCancel: aras.getResource('', 'common.cancel')
					},
					dialogHeight: 300,
					dialogWidth: 400,
					center: true,
					resizable: true,
					defaultButton: 'btnCancel',
					message: message,
					aras: aras,
					content: 'groupChgsDialog.html'
				};

				(
					topWindow_Experimental.main || topWindow_Experimental
				).ArasModules.Dialog.show('iframe', params).promise.then(function () {
					if (resButton === 'btnYes') {
						showClassStructureDialog(function (res) {
							container.onAfterSpecialDialog(res, true);
						});
					}
				});
			};

			//if form_classification property is changed we should ask user for fields that would be deleted from form
			var viewItem = item.selectSingleNode(
				"Relationships/Item[@type='View' and @id='" + currSelRowId + "']"
			);

			var formNd = viewItem.selectSingleNode("related_id/Item[@type='Form']");
			if (!formNd) {
				aras.AlertError(
					aras.getResource('', 'relationshipsgrid.no_form_view'),
					null,
					null,
					window
				);
				return false;
			}

			var isTempForm = aras.isTempEx(formNd);
			var formIsComplete = isTempForm;

			if (!isTempForm) {
				// check if View relationship contains complete Form definition. The criteria is Body existence.
				var bodyNd = formNd.selectSingleNode(
					"Relationships/Item[@type='Body']"
				);
				formIsComplete = bodyNd != null;

				if (!aras.isLockedByUser(formNd) && aras.isLocked(formNd)) {
					showContinueDialog(
						aras.getResource(
							'',
							'relationshipsgrid.locked_another_user_change_view_classification'
						)
					);
					return;
				}
			}

			showClassStructureDialog(function (res) {
				if (
					res !== undefined &&
					container.systemGetValueForCurrentCell() !== res
				) {
					//++++ remove fields out of the classification of the form (formItemNd)
					var propsMayDel = aras.selectPropNdsByClassPath(res, item, true);
					var i;
					if (propsMayDel.length != 0) {
						var whereClause = '';
						for (i = 0; i < propsMayDel.length; i++) {
							whereClause +=
								"propertytype_id='" + propsMayDel[i].getAttribute('id') + "'";
							if (i != propsMayDel.length - 1) {
								whereClause += ' or ';
							}
						}

						const getCompleteForm = function () {
							if (!formIsComplete) {
								var formId = formNd.getAttribute('id');

								var requestedFormNd = aras.getItemById('Form', formId, 3);
								if (!requestedFormNd) {
									aras.AlertError(
										aras.getResource(
											'',
											'relationshipsgrid.form_defined_view_not_found'
										),
										null,
										null,
										window
									);
									return false;
								}

								aras.mergeItem(formNd, requestedFormNd);
								formIsComplete = true;
							}

							return true;
						};

						if (!getCompleteForm()) {
							container.onAfterSpecialDialog(undefined, true);
							return false;
						}

						var fieldsToDel = formNd.selectNodes(
							'Relationships/Item/Relationships/Item[' + whereClause + ']'
						);
						if (fieldsToDel.length != 0) {
							var message = aras.getResource(
								'',
								'relationshipsgrid.modifying_class_value_remove_fields'
							);
							for (i = 0; i < fieldsToDel.length; i++) {
								message +=
									'<b>' +
									aras.getItemProperty(fieldsToDel[i], 'label') +
									'</b><br>';
							}

							message += aras.getResource(
								'',
								'relationshipsgrid.continue_remove'
							);

							if (!showContinueDialog(message)) {
								container.onAfterSpecialDialog(undefined, true);
								return true;
							}

							if (!isTempForm && !aras.isLockedByUser(formNd)) {
								formNd = aras.lockItemEx(formNd);
								if (!formNd) {
									aras.AlertError(
										aras.getResource(
											'',
											'relationshipsgrid.form_cannot_be_locked'
										),
										null,
										null,
										window
									);
									container.onAfterSpecialDialog(undefined, true);
									return false;
								}

								formIsComplete = false;
								if (!getCompleteForm()) {
									container.onAfterSpecialDialog(undefined, true);
									return false;
								}
							}

							fieldsToDel = formNd.selectNodes(
								'Relationships/Item/Relationships/Item[' + whereClause + ']'
							);

							if (fieldsToDel.length > 0) {
								//delete fields
								for (i = 0; i < fieldsToDel.length; i++) {
									var fieldToDel = fieldsToDel[i];
									if (fieldToDel.getAttribute('action') == 'add') {
										fieldToDel.parentNode.removeChild(fieldsToDel[i]);
									} else {
										fieldToDel.setAttribute('action', 'delete');
									}
								}

								container.setDirtyAttribute(formNd);
							}
						}
					}
				}
				//---- remove fields out of the classification of the form (formItemNd)
				container.onAfterSpecialDialog(res, true);
			});
		} else {
			showClassStructureDialog(function (res) {
				if (grid._grid) {
					grid.onStartEdit_Experimental(
						currSelRowId,
						grid.grid_Experimental.order[currSelCol]
					);
				}
				container.onAfterSpecialDialog(res, true);
			});
		}
	};

	container.getTargetItem = function (type) {
		if (type == 'form_classification' || type == 'class_path') {
			return item;
		}

		var propDRL = propsArr[currSelCol].DRL;
		return propDRL == 'D' ? DescByItemType_Nd : RelatedItemType_Nd;
	};

	container.showClassificationDialog = function (type) {
		container.showClassStructureDialog(
			container.getTargetItem(type),
			'classification',
			'classification'
		);
	};

	container.getClassificationArray = function (type) {
		var targetItem = container.getTargetItem(type);
		var class_structure = aras.getItemProperty(targetItem, 'class_structure');
		if (!class_structure) {
			class_structure =
				'<class id="' + aras.getItemProperty(targetItem, 'id') + '" />';
		}

		function parseRecursive(item) {
			var children = [];
			item = Array.isArray(item) ? item : [item];
			var childrenLen = item.length;
			for (var i = 0; i < childrenLen; i++) {
				children.push({
					label: item[i]['@attrs'].name,
					children: item[i].class ? parseRecursive(item[i].class) : []
				});
			}
			return children;
		}

		class_structure = window.ArasModules.xmlToJson(class_structure);
		var rootItem = class_structure.class;
		return parseRecursive(rootItem.class || []);
	};

	container.showClassPathDialog = function () {
		//item is an ItemType instance in this case
		var itemLabel =
			aras.getItemProperty(item, 'label') || aras.getItemProperty(item, 'name');
		var selectedProperty = item.selectSingleNode(
			'Relationships/Item[@type="Property" and @id="' + currSelRowId + '"]'
		);
		var title = aras.getResource(
			'',
			'relationshipsgrid.class_path_prop',
			aras.getItemProperty(selectedProperty, 'name'),
			itemLabel
		);

		showClassStructureDialog(item, 'class_path', title);
	};

	container.showFileDialog2 = function () {
		var fileNd = aras.SelectFileFromPackage('FE_SelectFileFromPackage', false);
		aras.itemsCache.addItem(fileNd);

		grid.requestFocus(currSelCol);
		if (!fileNd) {
			return true;
		}

		container.onAfterSpecialDialog(fileNd, false);
	};

	container.showFileDialog = function (fileId) {
		function processAddingFile(file) {
			var fileNd = aras.newItem('File', file);
			aras.itemsCache.addItem(fileNd);

			grid.requestFocus(currSelCol);
			if (!fileNd) {
				return true;
			}

			container.onAfterSpecialDialog(fileNd, false);
		}

		aras.vault.selectFile().then(processAddingFile.bind(this));
	};

	container.showDateDialog = function (oldDate, format, event) {
		if (currSelCell) {
			var wndRect = aras.uiGetElementCoordinates(
				currSelCell.cellNod_Experimental
			);
			var params = {
				date: aras.convertFromNeutral(oldDate, 'date', format),
				format: format,
				aras: aras,
				type: 'Date',
				top: wndRect.top - wndRect.screenTop,
				left: wndRect.left - wndRect.screenLeft
			};
			var dateDialog = (
				topWindow_Experimental.main || topWindow_Experimental
			).ArasModules.Dialog.show('iframe', params);

			//Magic behaviour for IE11 caused by impossibility show modalWindow from resolved promise
			//Issue causes when calling confirm dialog with modal realization (e.g. in Solutions)
			//TODO: Remove when ModalDialogHelper will be removed completely from Innovator
			if (
				aras.Browser &&
				aras.Browser.isIe() &&
				aras.Browser.getMajorVersionNumber() === 11
			) {
				dateDialog.dialogNode.addEventListener('close', function (evt) {
					var newDate = dateDialog.returnValue;
					if (newDate !== undefined) {
						newDate = aras.convertToNeutral(newDate, 'date', format);
					}
					container.onAfterSpecialDialog(newDate, true);
				});
				return;
			}

			dateDialog.promise.then(function (newDate) {
				if (newDate !== undefined) {
					newDate = aras.convertToNeutral(newDate, 'date', format);
				}
				container.onAfterSpecialDialog(newDate, true);
			});
		}
	};

	container.showColorDialog = function (oldColor) {
		var params = {
			oldColor: oldColor,
			aras: aras,
			type: 'Color'
		};

		(
			topWindow_Experimental.main || topWindow_Experimental
		).ArasModules.Dialog.show('iframe', params).promise.then(function (
			newColor
		) {
			container.onAfterSpecialDialog(newColor, false);
		});
	};

	container.systemGetValueForCurrentCell = function () {
		var propNm = propsArr[currSelCol].name;
		var propDRL = propsArr[currSelCol].DRL;

		var res =
			propDRL == 'D'
				? container.getRelationshipProperty(currSelRowId, propNm)
				: container.getRelatedItemProperty(currSelRowId, propNm);
		return res;
	};

	container.showTextarea = function (openToEdit) {
		if (openToEdit == undefined) {
			openToEdit = false;
		}

		var params = {
			isEditMode: openToEdit,
			aras: aras,
			content: container.systemGetValueForCurrentCell(),
			type: 'Text'
		};

		(
			topWindow_Experimental.main || topWindow_Experimental
		).ArasModules.Dialog.show('iframe', params).promise.then(function (res) {
			container.onAfterSpecialDialog(res, true);
		});
	};

	container.showImageDialog = function (img) {
		img = img || '';

		var params = {
			image: img,
			aras: aras,
			type: 'ImageBrowser'
		};

		(
			topWindow_Experimental.main || topWindow_Experimental
		).ArasModules.Dialog.show('iframe', params).promise.then(function (res) {
			container.onAfterSpecialDialog(res, false, 'set_nothing');
		});
	};

	container.showHTMLEditorDialog = function (openToEdit) {
		if (!openToEdit) {
			let content = container.systemGetValueForCurrentCell();
			const options = { resizable: true, dialogHeight: 500, dialogWidth: 820 };
			content = content.replace(/\\/g, '\\\\');
			content = content.replace(/\\n/g, '\n');
			content = content.replace(/'/g, "\\'");

			options.content = "javascript: '" + content + "'"; // jshint ignore:line
			topWindow_Experimental.ArasModules.Dialog.show('iframe', options);
		} else {
			const param = {
				sHTML: container.systemGetValueForCurrentCell(),
				aras: aras,
				title: aras.getResource('', 'htmleditor.inn_formatted_text_editor'),
				type: 'HTMLEditorDialog'
			};
			topWindow_Experimental.ArasModules.Dialog.show(
				'iframe',
				param
			).promise.then(function (val) {
				container.onAfterSpecialDialog(val, true);
			});
		}
	};

	container.showForeignPropDialog = function () {
		container.checkThatItemTypePropsLoaded();
		var params = {
			title: aras.getResource(
				'',
				'foreignpropselecttree.foreign_prop_selec_tree'
			),
			aras: aras,
			item: item,
			dialogHeight: 600,
			dialogWidth: 250,
			content: 'foreignPropSelectTree.html'
		};

		(
			topWindow_Experimental.main || topWindow_Experimental
		).ArasModules.Dialog.show('iframe', params).promise.then(function (res) {
			if (res) {
				container.setRelationshipProperty(
					currSelRowId,
					'data_source',
					res.data_source
				);
				var relNd = item.selectSingleNode(
					'Relationships/Item[@type="' +
						relationshipTypeName +
						'" and @id="' +
						currSelRowId +
						'"]'
				);
				aras.setItemProperty(relNd, 'foreign_property', res.foreign_property);
			}
		});
	};
	////////////////////////////  --- Dialogs ---  ////////////////////////////

	container.handleRowEvent = function (eventName, rowId) {
		var EventName = 'row_' + eventName;
		var funcName = 'row_' + eventName + '_func';

		var retValue = container.handleEvent(
			rowEventsNames,
			rowEventsMethods_code,
			EventName,
			funcName,
			rowId
		);
		return retValue;
	};

	container.handleCellEvent = function (eventName, rowId, col) {
		var prop = propsArr[col];
		var EventName = prop.name + '_' + prop.DRL + '_' + eventName;
		var funcName = prop.name + '_' + prop.DRL + '_' + eventName + '_func';

		var retValue = container.handleEvent(
			cellEventsNames,
			cellEventsMethods_code,
			EventName,
			funcName,
			rowId,
			col
		);
		return retValue;
	};

	container.handleEvent = function (
		eventsNames,
		eventsMethods_code,
		EventName,
		funcName,
		rowId,
		col
	) {
		var retValue = true;
		var handler;
		var prop;
		// if col is defined it means cell event occurs. Else it's row event
		if (col != undefined) {
			prop = propsArr[col];
		}

		var HandlersQueue = window[funcName];
		var i;
		if (HandlersQueue == undefined) {
			var HasEvents = false;
			for (i = 0; i < eventsNames.length; i++) {
				if (eventsNames[i] == EventName) {
					HasEvents = true;
					var method_code = eventsMethods_code[i];
					try {
						if (col != undefined) {
							/* jshint -W054 */
							handler = new Function(
								'relationshipID',
								'relatedID',
								'propertyName',
								'colNumber',
								'gridApplet',
								method_code
							);
							/* jshint +W054 */
						} else {
							/* jshint -W054 */
							handler = new Function(
								'relationshipID',
								'relatedID',
								'gridApplet',
								method_code
							);
							/* jshint +W054 */
						}

						if (!window[funcName]) {
							window[funcName] = [];
						}
						window[funcName].push(handler);
					} catch (excep) {
						aras.AlertError(
							aras.getResource(
								'',
								'relationshipsgrid.internal_error_event_failed_initialize'
							),
							aras.getResource(
								'',
								'relationshipsgrid.custom_event_failed',
								EventName,
								excep.toString()
							),
							aras.getResource('', 'common.client_side_err'),
							window
						);
						return false;
					}
				}
			}

			if (HasEvents) {
				HandlersQueue = window[funcName];
			} else {
				window[funcName] = null;
			}
		}

		if (HandlersQueue) {
			for (i = 0; i < HandlersQueue.length; i++) {
				handler = HandlersQueue[i];
				var relationshipID = rowId;
				var relatedID = undefined;
				if (container.hasRelatedItem(rowId)) {
					relatedID = container.system_getRelatedItem(rowId).getAttribute('id');
				}

				try {
					if (col != undefined) {
						retValue = handler(
							relationshipID,
							relatedID,
							prop.name,
							col,
							gridApplet
						);
					} else {
						retValue = handler(relationshipID, relatedID, gridApplet);
					}
				} catch (excep) {
					aras.AlertError(
						aras.getResource('', 'relationshipsgrid.internal_err_event_failed'),
						aras.getResource(
							'',
							'relationshipsgrid.failed_with_msg',
							EventName,
							excep.toString()
						),
						aras.getResource('', 'common.client_side_err'),
						window
					);
					return false;
				}
				if (retValue === false) {
					break;
				}
			}
		}
		if (retValue === undefined) {
			retValue = true;
		}
		return retValue;
	};

	//+++ some functions for custom events handlers
	container.setRelationshipProperty = function (relID, propName, propVal) {
		for (var col = 0; col < propsArr.length; col++) {
			if (propsArr[col].DRL == 'D' && propsArr[col].name == propName) {
				break;
			}
		}
		if (col == propsArr.length) {
			return false;
		}

		var relNd = item.selectSingleNode(
			'Relationships/Item[@type="' +
				relationshipTypeName +
				'" and @id="' +
				relID +
				'"]'
		);
		if (!relNd) {
			return false;
		}

		var prevCurrSelCell = currSelCell;
		var prevCurrSelRowId = currSelRowId;
		var prevCurrSelCol = currSelCol;
		try {
			var prevVal = aras.getItemProperty(relNd, propName);

			currSelRowId = relID;
			currSelCol = col;
			currSelCell = grid.cells(relID, parseInt(col));

			container.setupProperty(propVal, true);

			if (currSelCell && propVal != prevVal) {
				container.handleCellEvent('onchangecell', currSelRowId, currSelCol);
			}
		} catch (excep) {
		} finally {
			currSelCell = prevCurrSelCell;
			currSelRowId = prevCurrSelRowId;
			currSelCol = prevCurrSelCol;
		}

		return true;
	};

	container.setRelatedItemProperty = function (relID, propName, propVal) {
		for (var col = 0; col < propsArr.length; col++) {
			if (propsArr[col].DRL == 'R' && propsArr[col].name == propName) {
				break;
			}
		}
		if (col == propsArr.length) {
			return false;
		}

		var relatedNd = item.selectSingleNode(
			'Relationships/Item[@type="' +
				relationshipTypeName +
				'" and @id="' +
				relID +
				'"]/related_id/Item'
		);
		if (!relatedNd) {
			return false;
		}

		var prevCurrSelCell = currSelCell;
		var prevCurrSelRowId = currSelRowId;
		var prevCurrSelCol = currSelCol;

		try {
			var prevVal = aras.getItemProperty(relatedNd, propName);

			currSelRowId = relID;
			currSelCol = col;
			currSelCell = grid.cells(relID, parseInt(col));

			container.setupProperty(propVal, true);

			if (currSelCell && propVal != prevVal) {
				container.handleCellEvent('onchangecell', currSelRowId, currSelCol);
			}
		} catch (excep) {
		} finally {
			currSelCell = prevCurrSelCell;
			currSelRowId = prevCurrSelRowId;
			currSelCol = prevCurrSelCol;
		}

		return true;
	};

	container.getRelationshipProperty = function (relID, propName) {
		var relNd = item.selectSingleNode(
			'Relationships/Item[@type="' +
				relationshipTypeName +
				'" and @id="' +
				relID +
				'"]'
		);
		if (!relNd) {
			return undefined;
		}

		return aras.getItemProperty(relNd, propName);
	};

	container.getRelatedItemProperty = function (relID, propName) {
		var relatedNd = item.selectSingleNode(
			'Relationships/Item[@type="' +
				relationshipTypeName +
				'" and @id="' +
				relID +
				'"]/related_id/Item'
		);
		if (!relatedNd) {
			return undefined;
		}

		return aras.getItemProperty(relatedNd, propName);
	};
	//^^^ some functions for custom events handlers

	const actionsList = [
		'add',
		'create',
		'delete',
		'purge',
		'copyAsNew',
		'update'
	];
	container.setDirtyAttribute = function (relationships_itemNd) {
		const itemAction = relationships_itemNd.getAttribute('action');
		const itemId = relationships_itemNd.getAttribute('id');

		if (!itemAction || !actionsList.includes(itemAction)) {
			relationships_itemNd.setAttribute('action', 'update');
			const itemInCache = aras.itemsCache.getItem(itemId);
			if (itemInCache) {
				itemInCache.setAttribute('action', 'update');
				itemInCache.setAttribute('isDirty', '1');
			}
		}

		if (relationships_itemNd.getAttribute('isDirty') === '1') {
			return;
		}

		relationships_itemNd.setAttribute('isDirty', '1');
		const itemItemTypeId = relationships_itemNd.getAttribute('typeId');
		aras
			.getMainWindow()
			.mainLayout.tabsContainer.getSearchGridTabs(itemItemTypeId)
			.forEach(function (searchGridWindow) {
				if (searchGridWindow.grid.getRowIndex(itemId) === -1) {
					return;
				}

				searchGridWindow.updateRow(relationships_itemNd);
			});
	};

	container.onTabSelected = function () {
		if (gridReady || scriptReady || document.readyState === 'complete') {
			if (isToolbarUsed) {
				container.updateToolbar();
			}

			if (topWindow_Experimental.updateMenuState) {
				topWindow_Experimental.updateMenuState();
			}
		}
	};

	container.getPasteFlg = function (special) {
		if (special) {
			return container.getPasteSpecialFlg();
		}
		if (topWindow_Experimental.isPasteCommandAvailable) {
			return topWindow_Experimental.isPasteCommandAvailable(
				item,
				relatedItemTypeName,
				relationshipTypeName
			);
		} else {
			return (
				!container.isWorkflowTool() &&
				!aras.clipboard.isEmpty() &&
				aras.isLCNCompatibleWithRT(RELATED_IT_NAME) &&
				container.computeCorrectControlState('new') &&
				!isFunctionDisabled(relationshipTypeName, 'Paste')
			);
		}
	};

	container.getPasteSpecialFlg = function () {
		return (
			!container.isWorkflowTool() &&
			!aras.clipboard.isEmpty() &&
			container.computeCorrectControlState('new') &&
			!isFunctionDisabled(relationshipTypeName, 'Paste Special')
		);
	};

	container.isWorkflowTool = function () {
		return parent ? parent.isWorkflowTool : false;
	};

	container.calculateSortPriority = function (gridView) {
		if (propsArr) {
			var relationshipPriority;
			var relatedItemPriority;
			var i;

			sortPriority = [];

			switch (gridView) {
				case 'left':
					//related item properties goes first
					relationshipPriority = 1;
					relatedItemPriority = 0;
					break;
				case 'intermix':
					relationshipPriority = 0;
					relatedItemPriority = 0;
					break;
				default:
					//related item properties goes last
					relationshipPriority = 0;
					relatedItemPriority = 1;
			}

			for (i = 0; i < propsArr.length; i++) {
				if (propsArr[i].order_by && propsArr[i].DRL != 'L') {
					sortPriority.push({
						colNum: grid.GetColumnIndex(
							propsArr[i].name + '_' + propsArr[i].DRL
						),
						order_by: parseInt(propsArr[i].order_by),
						priority:
							propsArr[i].DRL == 'D'
								? relationshipPriority
								: relatedItemPriority
					});
				}
			}

			sortPriority.sort(function (p1, p2) {
				var c1 = p1.priority;
				var c2 = p2.priority;

				if (c1 < c2) {
					return -1;
				} else if (c2 < c1) {
					return 1;
				} else {
					c1 = p1.order_by;
					c2 = p2.order_by;

					if (isNaN(c2)) {
						return -1;
					}
					if (isNaN(c1)) {
						return 1;
					}

					if (c1 < c2) {
						return -1;
					} else if (c2 < c1) {
						return 1;
					} else {
						return 0;
					}
				}
			});
		}
	};

	const mapHandlerForInfernoGrid = function (fieldSortPriority) {
		const columnIndex = fieldSortPriority.colNum;
		return {
			headId: grid.grid_Experimental.order[columnIndex],
			desc: false
		};
	};

	const mapHandlerForDojoGrid = function (fieldSortPriority) {
		const columnIndex = fieldSortPriority.colNum;
		if (fieldSortPriority.order_by >= 0) {
			grid.grid_Experimental.prepareColumnForSort(columnIndex, true, true);
			const headerNode = grid.grid_Experimental.layout.cells[columnIndex];
			const columnName = headerNode.name;
			const th = headerNode.getHeaderNode();
			th.innerHTML = grid.grid_Experimental.getColumnHeaderHtml(
				columnName,
				fieldSortPriority
			);
		}
	};

	container.sortRowByDefault = function () {
		if (!sortPriority) {
			return;
		}

		try {
			const isInfernoGrid = !!grid._grid;
			const mapHandler = isInfernoGrid
				? mapHandlerForInfernoGrid
				: mapHandlerForDojoGrid;
			const sortColumns = sortPriority.map(mapHandler);

			if (isInfernoGrid) {
				grid._grid.settings.orderBy = sortColumns;
			}
		} catch (e) {}
	};
	container.getFilterValue = function (rowId, col) {
		// rowId and col are for cell where filter list is supposed.
		var RelTypeIT = null;
		if (propsArr[col].DRL == 'R') {
			RelTypeIT = RelatedItemType_Nd;
		} else {
			RelTypeIT = DescByItemType_Nd;
		}

		if (!RelTypeIT) {
			return false;
		}

		var propNm = propsArr[col].name;
		var propNd = RelTypeIT.selectSingleNode(
			'Relationships/Item[@type="Property" and name="' + propNm + '"]'
		);
		if (!propNd) {
			return false;
		}

		var pattern = aras.getItemProperty(propNd, 'pattern');
		for (var i = 0; i < propsArr.length; i++) {
			if (propsArr[i].name == pattern) {
				break;
			}
		}
		if (i == propsArr.length) {
			return false;
		}

		var res = '';
		if ('input_row' === rowId) {
			res = grid.inputRow.get(i, 'value');
		} else {
			var tmp1 = propsArr[i].DRL;
			var tmp2 = propsArr[i].name;
			if (tmp1 == 'D') {
				tmp1 = container.getRelationshipProperty(rowId, tmp2);
			} else {
				tmp1 = container.getRelatedItemProperty(rowId, tmp2);
			}
			res = tmp1;
		}

		return res;
	};

	container.scriptInit = function () {
		relationshipTypeActions[RelType_ID] = {};
		relationshipActions[RelType_ID] = {};

		var i;
		var act;
		var lbl;
		var res = aras.getItemTypeNodeForClient(
			aras.getItemTypeName(DescByItemType_ID)
		);
		var nds = res.selectNodes(
			"Relationships/Item[@type='Item Action']/related_id/Item[type='itemtype' and name]"
		);
		for (i = 0; i < nds.length; i++) {
			act = nds[i];
			if (aras.isInCache(act.getAttribute('id'))) {
				act = aras.getFromCache(act.getAttribute('id'));
			}

			lbl = aras.getItemProperty(act, 'label');
			if (!lbl) {
				lbl = aras.getItemProperty(act, 'name');
			}
			relationshipTypeActions[RelType_ID][act.getAttribute('id')] = lbl;
		}

		nds = res.selectNodes(
			"Relationships/Item[@type='Item Action']/related_id/Item[type='item' and name]"
		);
		for (i = 0; i < nds.length; i++) {
			act = nds[i];
			if (aras.isInCache(act.getAttribute('id'))) {
				act = aras.getFromCache(act.getAttribute('id'));
			}
			lbl = aras.getItemProperty(act, 'label');
			if (!lbl) {
				lbl = aras.getItemProperty(act, 'name');
			}
			relationshipActions[RelType_ID][act.getAttribute('id')] = lbl;
		}

		// +++++ setup Relationship Grid Events (row events) ++++++
		res = aras.getRelationshipType(RelType_ID).node;
		nds = res.selectNodes(
			"Relationships/Item[grid_event != '' and related_id/Item/method_code != '']"
		);

		for (i = 0; i < nds.length; i++) {
			rowEventsNames[i] = 'row_' + aras.getItemProperty(nds[i], 'grid_event');
			var methodName = aras.getItemProperty(nds[i], 'related_id/Item/name');
			var methodCode = aras.getItemProperty(
				nds[i],
				'related_id/Item/method_code'
			);
			var methodNamesWithTopAras = ['PM_ACT2ASMNT_ONSELECTROW'];

			if (
				methodName &&
				methodNamesWithTopAras.indexOf(methodName.toUpperCase()) !== -1
			) {
				methodCode = methodCode.replace(/\btop.aras\b/g, 'aras');
			}

			rowEventsMethods_code[i] = methodCode;
		}
		// ^^^^^^ setup Relationship Grid Events (row events) ^^^^^^

		// ++++++ setup Grid Events (cell events) ++++++
		var critStr = '';
		for (i = 0; i < propsArr.length; i++) {
			if (propsArr[i].propID) {
				critStr += "'" + propsArr[i].propID + "',";
			}
		}

		if (critStr) {
			res = aras.getItemTypeNodeForClient(
				aras.getItemTypeName(DescByItemType_ID)
			);
			nds = res.selectNodes(
				"Relationships/Item[@type='Property']/Relationships/Item[grid_event != '' and related_id/Item/method_code != '']"
			);

			var methodNamesWithTopAras2 = [
				'PM_ACT2ASMNT_ONSELECTROW',
				'TIMERECORD ONDATECHANGE'
			];
			var methodName2;
			var methodCode2;
			var EventName;
			var parentIT_ID;
			var ev;

			for (i = 0; i < nds.length; i++) {
				ev = nds[i];
				EventName = aras.getItemProperty(ev, 'source_id/Item/name') + '_';
				parentIT_ID = aras.getItemProperty(ev, 'source_id/Item/source_id');
				EventName += parentIT_ID == DescByItemType_ID ? 'D' : 'R';
				EventName += '_' + aras.getItemProperty(ev, 'grid_event');
				cellEventsNames[i] = EventName;

				methodName2 = aras.getItemProperty(ev, 'related_id/Item/name');
				methodCode2 = aras.getItemProperty(ev, 'related_id/Item/method_code');

				if (
					methodName2 &&
					methodNamesWithTopAras2.indexOf(methodName2.toUpperCase()) !== -1
				) {
					methodCode2 = methodCode2.replace(/\btop.aras\b/g, 'aras');
				}

				cellEventsMethods_code[i] = methodCode2;
			}

			if (RelatedItemType_Nd) {
				nds = RelatedItemType_Nd.selectNodes(
					"Relationships/Item[@type='Property']/Relationships/Item[grid_event != '' and related_id/Item/method_code != '']"
				);
				var curEventsCount = cellEventsNames.length;
				for (i = 0; i < nds.length; i++) {
					ev = nds[i];
					EventName = aras.getItemProperty(ev, 'source_id/Item/name') + '_';
					parentIT_ID = aras.getItemProperty(ev, 'source_id/Item/source_id');
					EventName += parentIT_ID == DescByItemType_ID ? 'D' : 'R';
					EventName += '_' + aras.getItemProperty(ev, 'grid_event');
					cellEventsNames[i + curEventsCount] = EventName;

					methodName2 = aras.getItemProperty(ev, 'related_id/Item/name');
					methodCode2 = aras.getItemProperty(ev, 'related_id/Item/method_code');

					if (
						methodName2 &&
						methodNamesWithTopAras2.indexOf(methodName2.toUpperCase()) !== -1
					) {
						methodCode2 = methodCode2.replace(/\btop.aras\b/g, 'aras');
					}

					cellEventsMethods_code[i + curEventsCount] = methodCode2;
				}
			}
		}
		// ^^^^^^ setup Grid Events (cell events) ^^^^^^
		container.initializeDragAndDrop();
		const isRelationshipInfernoGrid = document.location.href.includes(
			'relationshipsInfernoGrid.html'
		);
		container.isScrollerEnabled =
			isRelationshipInfernoGrid &&
			window.frameElement.closest('.aras-scroller');
		scriptReady = true;
	};

	container.resize_searchContainer = function () {
		if (searchContainer) {
			var spcWidth = document.getElementById('gridTD').offsetWidth;
			searchContainer.searchPlaceholderCell.style.width = spcWidth + 'px';
		}
	};

	container.refreshGridSize = function () {
		if (grid && grid.grid_Experimental) {
			const paginationOffset = window.pagination
				? pagination.offsetHeight +
				  parseInt(getComputedStyle(pagination).marginTop)
				: 0;
			const gridContainerNode = document.getElementById('gridTD');
			const currentGridTop = gridContainerNode.offsetTop + paginationOffset;

			if (document.gridPreviousTop !== currentGridTop) {
				if (!container.isScrollerEnabled) {
					gridContainerNode.style.height =
						'calc(100% - ' + currentGridTop + 'px)';
				}
				grid.grid_Experimental.resize(true);
				document.gridPreviousTop = currentGridTop;
			}
		}
	};

	container.initializeDragAndDrop = function () {
		var isFileRelated = relatedItemTypeName === 'File';
		if (!isFileRelated) {
			if (relatedItemTypeName) {
				return;
			}
			var fileProperties = propsArr.filter(function (property) {
				return property.DRL === 'D' && property.data_source === FileIT_ID_const;
			});
			if (fileProperties.length === 1) {
				var filePropertyName = fileProperties[0].name;
			} else {
				return;
			}
		}

		var dropbox = document.getElementById('dropbox');
		var dropboxHandlers = {
			onDragBrowserEnter: function (e) {
				var isFilesDragged =
					e.dataTransfer &&
					(!e.dataTransfer.types ||
						(e.dataTransfer.types.contains
							? e.dataTransfer.types.contains('Files')
							: e.dataTransfer.types.indexOf('Files') >= 0));
				if (isFilesDragged && isEditMode) {
					// TODO: more complex checks
					const gridContainer = document.getElementById('gridTD');
					dropbox.style.height = gridContainer.offsetHeight + 'px';
					dropbox.style.width = gridContainer.offsetWidth + 'px';
					dropbox.style.top = gridContainer.offsetTop + 'px';
					dropbox.style.display = 'block';
				}
			},
			onDragBrowserLeave: function () {
				dropbox.style.display = 'none';
			},
			dropPriority: 5
		};

		dragManager.addDropbox(dropboxHandlers);

		dropbox.addEventListener('dragover', function (e) {
			e.dataTransfer.dropEffect = 'copy';
			e.preventDefault();
			e.stopPropagation();
		});

		dropbox.addEventListener('drop', function (e) {
			dropbox.style.display = 'none';
			var files = Array.prototype.slice.call(e.dataTransfer.files);

			files.forEach(function (filePath) {
				var newFile = aras.newItem('File', filePath);
				aras.itemsCache.addItem(newFile);
				container.newRelationship(
					false,
					isFileRelated ? newFile : undefined,
					function (relshipNode) {
						if (!isFileRelated) {
							aras.setItemProperty(relshipNode, filePropertyName, newFile);
						}
					}
				);
			});
		});
	};
}
