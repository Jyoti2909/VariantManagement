// === varibles section =======
var treeGrid = null,
	gridApplet = null,
	viewShare = projectView.share;

var expandingMode = 'none';

var openedItems = [];
var treeDOM; // XML Tree
// +++ ER-000785
var filterApplied = false;
var isFilterCriteriaInputted = false;
// --- ER-000785
var isSavedSearchRunning = false;
var isSavedSearchSetInOnXmlLoaded = false;
// === end of varibles section =======

// Following listener was absent in current PM code and previous version
window.addEventListener('DOMContentLoaded', function() {
	ArasModules.soap(null, {async: true, method: 'ApplyItem', url: aras.getServerURL(), headers: aras.getHttpHeadersForSoapMessage('ApplyItem')});
});

function attachTreePanelEventListeners() {
	projectView.addEventListener(window, 'onProjectItemChanged', onProjectItemChanged, 'treePanel');
	projectView.addEventListener(window, 'onItemChanged', onRowItemChanged, 'treePanel');
	projectView.addEventListener(window, 'onItemPropertyChanged', onRowItemPropertyChanged, 'treePanel');
	projectView.addEventListener(window, 'onEditModeChanged', onProjectEditModeChanged, 'treePanel');
	projectView.addEventListener(window, 'onPanelDestroy', onGridPanelDestroyed, 'treePanel');
} //attachTreePanelEventListeners()

function onProjectItemMoved() {
	onSelectItemChanged();

	const gridSettings = treeGrid._grid.settings;
	const selectedRows = gridSettings.selectedRows;
	treeGrid.scrollToRow(selectedRows[selectedRows.length - 1]);

	return ProjectPlan.initActNums().then(function() {
		initPredecessors(treeGrid._grid.rows);
		projectView.raiseEvent('onItemChanged');
		return treeGrid._grid.render();
	});
}

function onProjectItemChanged(itemId, changeAction) {
	switch (changeAction) {
		case 'add':
			treeGrid._grid.dom.dispatchEvent(
				new CustomEvent('addItem', {
					detail: {
						itemId: itemId,
						headId: 'treeNode'
					}
				})
			);
			onProjectItemMoved();
			break;
		case 'modechange':
			if (isFilterCriteriaInputted) {
				setFlagsAndExecuteFilterOrClearFilter();
			}
			break;
		default:
			reInitTree();
			break;
	}
}

function onRowItemPropertyChanged(itemId, propertyName, propertyValue) {
	const changedItem = viewShare.functions.getItemNodeById(itemId);
	const headId = getGridHeadIdByPropertyName(propertyName);

	return validateCell(itemId, headId, aras.getItemProperty(changedItem, propertyName))
		.then(function(newValue) {
			setCellValue(itemId, headId, newValue);
		});
}
// IR-040260 "Predecessor suffix removed on edit Activity2"
function onRowItemChanged(itemId, oldValues) {
	updateGridRowFromItem(itemId, oldValues);
	// End IR-040260 fix
}

function onProjectEditModeChanged(newMode) {
	treeGrid.setEditable(newMode === 'edit');
	reInitTree(true).then(function() {
		projectView.raiseEvent('onProjectItemChanged', undefined, viewShare.properties.wbsId, 'modechange');
	});
}

function onGridPanelDestroyed() {
	viewShare.controls.treeGrid = undefined;
}

function loadTreeGrid() {
	var gridContainerId = 'gridContainer';

	var gridOptions = {
		search: true,
		draggableColumns: false,
		editable: viewShare.properties.isEditMode
	};

	treeGrid = new TreeGridContainer(gridContainerId, gridOptions, {
		parseXml: parseXML,
		gridItemEvents: gridItemEvents,
		canCut: canCut,
		canEdit: canEditCell,
		validateCell: validateCell,
		preValidateCell: preValidateCell,
		gridXmlLoaded: onXmlLoaded,
		onGetChildren: onGetChildren,
		onApplyEdit: onApplyEdit,
		onSelectItemChanged: onSelectItemChanged,
		gridLinkClick: onLinkClick,
		gridMenuInit: onGridMenuInit,
		gridMenuClick: onGridMenuClick,
		onInputHelperShow: onInputHelperShow,
		onStartEdit: onStartEdit,
		onStartSearch: setFlagsAndExecuteFilterOrClearFilter,
		onDragDrop: onDragDrop,
		canDragDrop: canDragDrop
	});
	gridApplet = treeGrid;
	viewShare.controls.treeGrid = treeGrid;
	onLoadGridHandler();
}

function onLoadGridHandler() {
	attachTreePanelEventListeners();
	initGlobalVariables();
}

function restoreColumnsWidthsFromPreference() {
	const relTypeId = (new URLSearchParams(location.search)).get('relTypeID');
	treeGrid._grid.on('resizeHead', function() {
		aras.setPreferenceItemProperties('Core_RelGridLayout', relTypeId, {
			col_widths: treeGrid.getColWidths(),
			col_order: treeGrid._grid.settings.indexHead.join(';')
		});
	});

	const colWidths = aras.getPreferenceItemProperty('Core_RelGridLayout', relTypeId, 'col_widths');
	const colOrder = aras.getPreferenceItemProperty('Core_RelGridLayout', relTypeId, 'col_order');
	if (!colWidths || !colOrder) {
		return;
	}

	const widthsArray = colWidths.split(';');
	const orderArray = colOrder.split(';');
	const widthsArraylength = widthsArray.length;
	const treeGridOrderArray = treeGrid._grid.settings.indexHead;

	if ((widthsArraylength !== orderArray.length) || (treeGridOrderArray.length !== widthsArraylength)) {
		return;
	}

	orderArray.forEach(function(columnName, index) {
		const width = parseInt(widthsArray[index], 10);
		if (!isNaN(width)) {
			treeGrid._grid.head.set(columnName, width, 'width');
		}
	});

	treeGrid._grid.render();
}

function reInitTree(editModeChanged) {
	controlTurnEditOff();
	initGlobalVariables();
	treeGrid.disabledRows.clear();

	var prevWbs;
	if (editModeChanged) {
		prevWbs = viewShare.properties.wbs.xml;
	}

	return initRootWBS()
		.then(ProjectPlan.initActNums.bind(ProjectPlan))
		.then(function() {
			let isInit = true;
			if (editModeChanged) {
				isInit = prevWbs !== viewShare.properties.wbs.xml;
			}

			if (isInit) {
				if (expandingMode === 'expand') {
					const wbses = viewShare.properties.wbs.selectNodes('descendant-or-self::Item[@type="WBS Element"][not(@action="delete")]');

					openedItems = [];
					for (let i = 0; i < wbses.length; i++) {
						const expandItemId = wbses[i].getAttribute('id');
						openedItems.push(expandItemId);
					}
					expandingMode = 'none';
				} else {
					openedItems = treeGrid.getOpenedItems();
				}

				initTree(true, editModeChanged);
			} else {
				onXmlLoaded();
				treeGrid._grid.render();
			}
		});
}

function initTree(reInit, reloadXSLT) {
	const treeGrid = viewShare.controls.treeGrid;

	if (!viewShare.properties.wbs) {
		aras.AlertError(aras.getResource('project', 'project_tree.wbs_not_initialized'));
		return;
	}

	var xsltString = uniCache.xsltWbs,
		xsltBranchString,
		branchDOM = aras.createXMLDocument(),
		treeXML;

	branchDOM.loadXML(viewShare.properties.wbs.xml);

	if (!xsltString || reloadXSLT) {
		resXslt = generateXSLT(ProjectPlan.projectItemType, ProjectPlan.columns);

		xsltString = resXslt.xsltWbs;
		xsltBranchString = resXslt.xsltWbsBranch;
		uniCache.xsltWbs = xsltString;
		uniCache.xsltWbsBranch = xsltBranchString;
	}

	const widthsString = treeGrid.getColWidths();
	if (widthsString) {
		var gridColumnWidths = widthsString.split(';');
		var tmpXsltDom = aras.createXMLDocument();
		var xsltColumnNodes, i;

		tmpXsltDom.loadXML(xsltString);
		xsltColumnNodes = tmpXsltDom.selectNodes('//columns/column');

		for (i = 0; i < xsltColumnNodes.length; i++) {
			xsltColumnNodes[i].setAttribute('width', gridColumnWidths[parseInt(xsltColumnNodes[i].getAttribute('order'))]);
		}

		xsltString = tmpXsltDom.xml;
	}

	treeXML = aras.applyXsltString(branchDOM, xsltString);
	treeDOM = aras.createXMLDocument();
	treeDOM.loadXML(treeXML);

	addListItemsToTableData(treeDOM.documentElement);

	var domXml = treeDOM.xml;
	if (domXml) {
		treeGrid.InitXML(domXml, openedItems, reInit);
		initPredecessors(treeGrid._grid.rows);
	} else {
		aras.AlertError(aras.getResource('project', 'project_tree.trying_initialize_tree_applet_by_not_xml'));
	}
}

///Filling of list in table.
//Param node: Xml node with table data
function addListItemsToTableData(node) {
	var listNodes = node.selectNodes('/table/list');
	for (var i = 0; i < listNodes.length; i++) {
		var list = listNodes[i];
		var listName = list.getAttribute('name');
		var listID = listName ? aras.getItemByName('List', listName, 0, '', 'name').getAttribute('id') : list.getAttribute('sourceid');
		var valsArr = aras.getListValues(listID);

		listItem = treeDOM.createElement('listitem');
		listItem.setAttribute('value', '');
		listItem.setAttribute('label', '');
		list.appendChild(listItem);

		for (var j = 0; j < valsArr.length; j++) {
			listItem = treeDOM.createElement('listitem');
			listItem.setAttribute('value', aras.getItemProperty(valsArr[j], 'value'));
			listItem.setAttribute('label', aras.getItemProperty(valsArr[j], 'label'));
			list.appendChild(listItem);
		}
	}
}

function processStatusFields(xmlDOM) {
	return;
	// not implemented yet - need spec update
}

function onXmlLoaded() {
	if (!isSavedSearchRunning) {
		//e.g, it can happen after save/refresh, it needs to set SavedSearch to Empty line
		var toolbarItem = viewShare.controls.activeToolbar.getItem('saved_search_project_tree');
		if (toolbarItem) {
			var savedSearchIdProject = toolbarItem.getSelectedItem();
			if (savedSearchIdProject !== 'emptySavedSearchProject') {
				isSavedSearchSetInOnXmlLoaded = true;
				toolbarItem.setSelected('emptySavedSearchProject');
				return;
			}
		}
	}

	updateMenuActionsState();

	if (viewShare.properties.cutSelectedItemsBuffer) {
		var rowIdsArrayToMarkGray = [];
		for (let i = 0; i < viewShare.properties.cutSelectedItemsBuffer.length; i++) {
			rowIdsArrayToMarkGray.push(viewShare.properties.cutSelectedItemsBuffer[i].getAttribute('id'));
		}
		markGray(rowIdsArrayToMarkGray);
	} else {
		treeGrid._cutSelectedItemsBuffer.clear();
	}
}

function onGetChildren(rowId) {
	treeGrid.disabledRows.add(rowId);
	updateMenuActionsState();
	return asyncQueryBranch(rowId, 1, true).then(function(treeBranch) {
		treeGrid.disabledRows.delete(rowId);
		updateMenuActionsState();
		if (!treeBranch) {
			return;
		}

		const openingItem = getItemNodeById(rowId, false, 'WBS Element');
		aras.mergeItem(openingItem, treeBranch);
		const rowsMap = makeBranch(openingItem, rowId);
		if (!rowsMap) {
			return;
		}

		rowsMap.delete(rowId);
		initPredecessors(rowsMap, true);

		if (treeGrid._cutSelectedItemsBuffer.has(rowId)) {
			rowsMap.forEach(function(newRow, newRowId) {
				treeGrid._cutSelectedItemsBuffer.add(newRowId);
			});
		}

		return rowsMap;
	});
}

function makeBranch(node, rowId) {
	const ArasXML = ArasModules.xml;
	const branchDOM = ArasXML.parseString(node.xml);
	const treeXML = aras.applyXsltString(branchDOM, uniCache.xsltWbsBranch);
	const tmpDOM = ArasXML.parseString(treeXML);
	const treeTR = treeDOM.selectSingleNode("//tr[@id='" + rowId + "']");
	if (!treeTR) {
		aras.AlertError(aras.getResource('project', 'project_tree.situation_inadmissible_can_not_find_TR', rowId));
		return;
	}

	const treeTRChildren = ArasXML.selectNodes(tmpDOM, './tr/tr');
	if (treeTRChildren.length) {
		treeTRChildren.forEach(function(tr) {
			treeTR.appendChild(tr);
		});

		const rowsData = treeGrid.addXMLRows('<table>' + treeTR.xml + '</table>');
		return rowsData.rows;
	}
}

// IR-040260 "Predecessor suffix removed on edit Activity2"
function updateGridRowFromItem(itemId, oldValues) {
	// End IR-040260 fix
	if (itemId) {
		var itemNode = viewShare.functions.getItemNodeById(itemId),
			itemType = itemNode.getAttribute('type'),
			itemPropertyValue,
			columnIndex,
			fieldName;

		var newRow = treeGrid._grid.rows.get(itemId) || {};
		for (fieldName in viewShare.properties.fld) {
			columnIndex = viewShare.properties.fld[fieldName];
			var headId = treeGrid.columnsOrder[columnIndex];
			itemPropertyValue = getCellValue(itemNode, columnIndex);

			if (itemPropertyValue.link) {
				newRow[headId + 'link'] = itemPropertyValue.link;
			}
			// IR-040260 "Predecessor suffix removed on edit Activity2"
			//condition to fix IR-045182 "PM: Error when view a file in attach column"
			if (oldValues !== undefined) {
				//End(except closing french bracket beneath) of IR-045182
				if (oldValues[fieldName] === itemPropertyValue.retVal) {
					continue;
				}
			}

			newRow[headId] = itemPropertyValue.retVal;
		}

		if (itemType === 'Activity2') {
			var hasAssignments = itemNode.selectSingleNode("Relationships/Item[@type='Activity2 Assignment' and string(@action)!='delete']");
			newRow.hasAssignments = !!hasAssignments;
		}

		treeGrid._grid.rows.set(itemId, newRow);
	}
}

function getGridHeadIdByPropertyName(propertyName) {
	switch (propertyName) {
		case 'name':
			return 'treeNode';
		case 'date_start_sched':
			return 'planStart';
		case 'date_due_sched':
			return 'planFinish';
		case 'expected_duration':
			return 'duration';
		case 'deliv_type':
			return 'delivType';
		case 'deliv_required':
			return 'delivRequired';
		case 'is_required':
			return 'required';
		case 'managed_by_id':
			return 'leader';
		case 'percent_compl':
			return 'status';
		case 'work_est':
			return 'hours';
		case 'lead_role':
			return 'role';
		default:
			return '';
	}
}

function getPropertyNameByGridHeadId(headId) {
	switch (headId) {
		case 'treeNode':
			return 'name';
		case 'planStart':
			return 'date_start_sched';
		case 'planFinish':
			return 'date_due_sched';
		case 'duration':
			return 'expected_duration';
		case 'delivType':
			return 'deliv_type';
		case 'delivRequired':
			return 'deliv_required';
		case 'required':
			return 'is_required';
		case 'leader':
			return 'managed_by_id';
		case 'status':
			return 'percent_compl';
		case 'hours':
			return 'work_est';
		case 'role':
			return 'lead_role';
		default:
			return '';
	}
}

function setCellValue(rowId, headId, newValue) {
	const grid = treeGrid._grid;

	if (isInputRow(rowId)) {
		return grid.head.set(headId, newValue, 'searchValue');
	}

	var editItem = viewShare.functions.getItemNodeById(rowId);
	if (!editItem) {
		aras.AlertError(aras.getResource('project', 'project_tree.can_not_find_type_with_id', rowId));
		return;
	}

	editItem = getItemForEdit(editItem);

	const itemType = editItem.getAttribute('type');
	const hasAssignments = editItem.selectSingleNode("Relationships/Item[@type='Activity2 Assignment' and string(@action)!='delete']");
	let i;
	var propertyName;

	switch (headId) {
		case 'n':
			return;
		case 'treeNode':
			if (aras.getItemProperty(editItem, 'name') !== newValue) {
				aras.setItemProperty(editItem, 'name', newValue);
			}
			break;
		case 'predecessor': // for activity2
			if (itemType !== 'Activity2') return;

			var predItem;
			var predAction;
			var filterCondition = '';
			var newStoreValue = '';
			if (newValue !== '') {
				var preds = newValue.split(',');
				newValue = '';
				for (i = 0; i < preds.length; i++) {
					var predValue = preds[i];
					var pred = new Predecessor(predValue);
					var predId = getActIdByNum(pred.GetNumber());
					predItem = editItem.selectSingleNode("Relationships/Item[@type='Predecessor'][related_id='" + predId + "']");

					filterCondition += " and related_id!='" + predId + "'";

					if (!predItem) {
						var relationshipsNode =
							editItem.selectSingleNode('Relationships') || editItem.appendChild(editItem.ownerDocument.createElement('Relationships'));
						var related = editItem.ownerDocument.createElement('related_id');
						predItem = aras.newItem('Predecessor');

						related.text = predId;
						predItem.appendChild(related);
						relationshipsNode.appendChild(predItem);
					} else {
						predAction = predItem.getAttribute('action');
						if (predAction === 'delete') {
							predItem.removeAttribute('action');
						} else if (predAction !== 'add') {
							predItem = getItemForEdit(predItem);
						}
					}
					var leadLag = pred.GetLeadLag();
					aras.setItemProperty(predItem, 'lead_lag', leadLag);
					aras.setItemProperty(predItem, 'precedence_type', pred.GetPrecedenceType());
					var precedence = pred.GetPrecedenceShortType();
					if (!leadLag && precedence === 'FS') {
						precedence = '';
						predValue = predValue.slice(0, -2);
					}

					var separator = i > 0 ? ',' : '';
					newValue += separator + predValue;
					newStoreValue += separator + predId + '|' + precedence + '|' + (leadLag || ''); // 6DB23254D47A433BAEC84581F87FDCF6|FS|+2,10315EF715144B72888DA8A96168D7DC||
				}
			}

			var predItems = editItem.selectNodes("Relationships/Item[@type='Predecessor' " + filterCondition + ']');
			for (i = 0; i < predItems.length; i++) {
				predItem = predItems[i];
				predAction = predItem.getAttribute('action');

				if (predAction === 'add') {
					predItem.parentNode.removeChild(predItem);
				} else if (predAction !== 'delete') {
					predItem.setAttribute('action', 'delete');
				}
			}

			setPredecessorValue(rowId, newValue);
			newValue = newStoreValue;
			break;
		case 'status': // for activity2
			if (itemType === 'Activity2') {
				if (!hasAssignments) {
					var newColor = getStatusColor(newValue);

					treeGrid.setCellBgColor(rowId, headId, newColor);
					aras.setItemProperty(editItem, 'percent_compl', newValue);
					aras.setItemProperty(editItem, 'status', newColor.toUpperCase());
				}
			}
			break;
		case 'planStart':
		case 'planFinish':
			propertyName = getPropertyNameByGridHeadId(headId);
			aras.setItemProperty(editItem, propertyName, newValue);
			break;
		case 'duration':
			aras.setItemProperty(editItem, 'expected_duration', newValue);
			if (ProjectPlan.projectItemType === 'Project') {
				const dateStartTarget = aras.getItemProperty(editItem, 'date_start_target');
				if (dateStartTarget) {
					const dateDueTarget = incDate(dateStartTarget, newValue === '0' ? 0 : newValue - 1);
					aras.setItemProperty(editItem, 'date_due_target', dateDueTarget);
				}
			}
			break;
		case 'hours': // for activity2
			if (itemType === 'Activity2' && !hasAssignments) {
				aras.setItemProperty(editItem, 'work_est', newValue);
			}
			break;
		case 'delivType': //for Project Template : Activity2
			aras.setItemProperty(editItem, 'deliv_type', newValue);
			break;
		case 'role': // for activity2
			if (itemType === 'Activity2') {
				aras.setItemProperty(editItem, 'lead_role', newValue);

				if (newValue !== '' && viewShare.properties.projTeamElems !== null) {
					for (i = 0; i < viewShare.properties.projTeamElems.length; i++) {
						if (newValue === viewShare.properties.projTeamElems[i].role) {
							var newLeader = setLeader(editItem, viewShare.properties.projTeamElems[i].identityKeyedName);
							grid.rows.set(rowId, newLeader, 'leader');
						}
					}
				}
			}
			break;
		case 'leader':
			setLeader(editItem, newValue);
			break;
		case 'attach':
			var deliverables = getItemDeliverables(editItem);
			if (deliverables) {
				if (deliverables.length === 1) {
					var attachmentItem = deliverables[0];
					aras.setItemProperty(attachmentItem, 'keyed_name', newValue);
				}
				grid.rows.set(rowId, rowId, headId + 'link');
			}
			break;
		case 'required': //for Project Template : Activity2
		case 'delivRequired': //for Project Template : Activity2, WBS
			propertyName = headId === 'required' ? 'is_required' : 'deliv_required';
			const v = newValue ? 1 : 0;

			if (editItem.getAttribute('action') !== 'add') {
				editItem.setAttribute('action', 'edit');
			}
			aras.setItemProperty(editItem, propertyName, v);
			newValue = !!v;
			break;
		default:
			const columnIndex = getColumnIndexByHeadId(headId);
			const cellType = getItemShortType(editItem);
			const sources = ProjectPlan.columns[viewShare.properties.fldToCol[columnIndex]].sources[cellType];

			if (sources) {
				var xpath = sources.xpath,
					params = sources.params,
					fieldType = params.field_type,
					itemPropertyValue = newValue || '',
					targetItem;

				propertyName = params.name;
				xpath = xpath.substring(0, xpath.length - propertyName.length - 1) || '.'; // xpath to select item to set property
				targetItem = editItem.selectSingleNode(xpath);

				switch (fieldType) {
					case 'checkbox':
						itemPropertyValue = newValue ? 1 : 0;
						newValue = !!itemPropertyValue;
						break;
					case 'color':
						treeGrid.setCellBgColor(rowId, headId, newValue);
						newValue = '';
						break;
					case 'image':
						newValue = "<img src='" + itemPropertyValue + "' />";
						break;
					case 'item':
						if (itemPropertyValue) {
							var queryItem = new Item('', 'get'),
								queryResult;

							queryItem.removeAttribute('type');
							queryItem.setAction('get');
							queryItem.setAttribute('typeId', params['data_source']);
							queryItem.setAttribute('select', 'id');
							queryItem.setProperty('keyed_name', itemPropertyValue);
							queryResult = queryItem.apply();

							if (queryResult.isError() || queryResult.isCollection()) {
								aras.AlertError(aras.getResource('project', 'project_tree.value_invalid_for_param', itemPropertyValue, params['name']));
								setCellValue(rowId, headId, '');

								return null;
							} else {
								itemPropertyValue = queryResult.getID();
								var itemPropertyType = queryResult.getType();
								aras.setItemProperty(targetItem, propertyName, itemPropertyValue);
								aras.setItemPropertyAttribute(targetItem, propertyName, 'keyed_name', itemPropertyValue);
								aras.setItemPropertyAttribute(targetItem, propertyName, 'type', itemPropertyType);

								var link = {
									id: itemPropertyValue,
									type: itemPropertyType
								};

								grid.rows.set(rowId, JSON.stringify(link), headId + 'link');
							}
						}
						break;
				}

				if (itemPropertyValue !== null && targetItem && targetItem.getAttribute('action') !== 'delete') {
					aras.setItemProperty(targetItem, propertyName, itemPropertyValue);
				}
			}
			break;
	}

	setDirty();
	grid.rows.set(rowId, newValue, headId);

	switch (headId) {
		case 'predecessor':
			projectView.raiseEvent('onItemChanged', 'treePanel', rowId);
			break;
		default:
			const eventPropName = getPropertyNameByGridHeadId(headId);
			projectView.raiseEvent('onItemPropertyChanged', 'treePanel', rowId, eventPropName, newValue);
			break;
	}

	return true;
}

function preValidateCell(rowId, headId, value) {
	let valid = true;
	let validationMessage = '';

	switch (headId) {
		case 'duration':
		case 'hours':
			const mayBeZero = headId === 'duration';
			const parsedValue = parseInt(value);

			if (!(headId === 'hours' && value === '') && (!aras.isInteger(value) || aras.isNegativeInteger(value) || (parsedValue == 0 && !mayBeZero))) {
				valid = false;
				validationMessage = aras.getResource('project', 'project_tree.fieled_value_must_be_positive_integer', mayBeZero ? 'nonnegative' : 'positive');
			}
			break;
		case 'predecessor':
			const checkResult = checkPredecessor(rowId, value);

			if (!checkResult.isValid) {
				valid = false;
				validationMessage = checkResult.errorMessage;
			}
			break;
		case 'status':
			if (!aras.isInteger(value) || aras.isNegativeInteger(value) || parseInt(value) > 100) {
				valid = false;
				validationMessage = aras.getResource('project', 'project_tree.status_value_must_be_nonnegative_integer');
			}
			break;
	}

	return {valid: valid, validationMessage: validationMessage};
}

function validateCell(rowId, headId, value) {
	const itemNode = viewShare.functions.getItemNodeById(rowId);
	if (!itemNode || value === undefined) {
		return Promise.reject();
	}

	if (value === '') {
		return Promise.resolve(value);
	}

	let propertyDefinition;
	const columnIndex = treeGrid.columns_Experimental.get(headId, 'index');
	const itemPropertyName = getPropertyNameByGridHeadId(headId);

	// common value validation by data_type
	if (itemPropertyName) {
		const itemType = itemNode.getAttribute('type');
		const typeDescriptor = getItemTypeDescriptor(itemType);
		const propertyNode = typeDescriptor.properties[itemPropertyName];
		const propertyDataType = aras.getItemProperty(propertyNode, 'data_type');

		if (propertyDataType === 'item') {
			const dataSourceType = aras.getItemPropertyAttribute(propertyNode, 'data_source', 'name');
			const foundItem = aras.uiGetItemByKeyedName(dataSourceType, value);

			if (!foundItem) {
				return Promise.reject(aras.getResource('project', 'project_tree.value_invalid', value));
			}
		} else {
			propertyDefinition = {data_type: propertyDataType, pattern: aras.getItemProperty(propertyNode, 'pattern')};

			if (!aras.isPropertyValueValid(propertyDefinition, value, 'invariantLocale')) {
				return Promise.reject(aras.ValidationMsg);
			}
		}
	} else {
		const row = treeGrid._grid.rows.get(rowId);
		const curColumn = ProjectPlan.columns[viewShare.properties.fldToCol[columnIndex]];
		const shortType = row.type === 'WBS Element' ? 'wbs' : row.isMilestone ? 'mil' : 'act';

		if (curColumn && shortType) {
			const columnSource = curColumn.sources[shortType];
			const columnParams = columnSource ? columnSource.params : null;

			if (columnParams) {
				propertyDefinition = {data_type: columnParams.data_type, pattern: columnParams.pattern};

				if (propertyDefinition.data_type === 'item') {
					const queryItem = new Item('', 'get');

					queryItem.removeAttribute('type');
					queryItem.setAction('get');
					queryItem.setAttribute('typeId', columnParams.data_source);
					queryItem.setAttribute('select', 'id');
					queryItem.setProperty('keyed_name', value);

					const queryResult = queryItem.apply();
					if (queryResult.isError() || queryResult.isEmpty()) {
						return Promise.reject(aras.getResource('project', 'project_tree.value_invalid', value));
					}
				} else if (!aras.isPropertyValueValid(propertyDefinition, value, 'invariantLocale')) {
					return Promise.reject(aras.ValidationMsg);
				}
			}
		}
	}

	return validateScheduleProperty(itemNode, rowId, headId, value);
}

function getColumnIndexByHeadId(headId) {
	return treeGrid._grid.head.get(headId, 'index');
}

function onApplyEdit(rowId, headId, value) {
	//!!! need to review
	var isInput = isInputRow(rowId),
		columnIndex = getColumnIndexByHeadId(headId),
		val = isInput ? treeGrid._grid.head.get(headId, 'searchValue') : treeGrid._grid.rows.get(rowId, headId),
		itemNode = !isInput ? viewShare.functions.getItemNodeById(rowId) : null,
		curColumn = ProjectPlan.columns[viewShare.properties.fldToCol[columnIndex]],
		shortType = itemNode ? getItemShortType(itemNode) : null;

	// special checks for non system columns
	if (curColumn && !curColumn.isSystem && !isInput && shortType) {
		if (onEditCellM2(rowId, headId, val) === false) {
			return false;
		}
		return;
	}

	if (!isInput && (headId === 'leader')) {
		val = setLeader(itemNode, value);
	}

	if (onEditCellM2(rowId, headId, val) === false) {
		return false;
	}
}

function onDragDrop(targetRowId, isCtrlPressed, notSameLevel) {
	const selectedItemIds = treeGrid.getSelectedItemIDs();

	if (isDropTargetValid(targetRowId, !isCtrlPressed)) {
		const onItemPasteParam = {
			clearCopyBuffer: isCtrlPressed,
			notSameLevel: notSameLevel,
			targetId: targetRowId
		};

		if (isCtrlPressed) {
			copyItem(selectedItemIds).then(function(success) {
				if (success) {
					pasteItem(onItemPasteParam);
				}
			});
		} else {
			if (cutItem(selectedItemIds, false)) {
				pasteItem(onItemPasteParam);
			}
		}
	}
}

function isDropTargetValid(targetRowId, isMove) {
	if (!targetRowId) {
		aras.AlertError(aras.getResource('project', 'project_tree.only_one_root_element_is_allowed'), null, null, mainWnd);
		return false;
	}

	var idsString = treeGrid.getSelectedItemIDs('|'),
		selectedItemIds = idsString ? idsString.split('|') : null;

	if (!selectedItemIds) {
		return false;
	}

	if (isMove) {
		var targetParentId, i;

		for (i = 0; i < selectedItemIds.length; i++) {
			if (selectedItemIds[i] === targetRowId) {
				return false;
			}
		}

		for (i = 0; i < selectedItemIds.length; i++) {
			targetParentId = treeGrid.getParentId(targetRowId);

			while (targetParentId) {
				if (targetParentId === selectedItemIds[i]) {
					aras.AlertError(aras.getResource('project', 'project_tree.wbs_element_movement_within_itself_is_not_allowed'), null, null, mainWnd);
					return false;
				}

				targetParentId = treeGrid.getParentId(targetParentId);
			}
		}
	}

	return true;
}

function canDragDrop() {
	return !isMenuItemDisabled('cut');
}

function markGray(rowIdsArray) {
	treeGrid._cutSelectedItemsBuffer.clear();
	var recursiveAdd = function(rowIdsArray) {
		rowIdsArray.forEach(function(rowId) {
			treeGrid._cutSelectedItemsBuffer.add(rowId);
			var rowChildren = treeGrid._grid.rows.get(rowId, 'children');
			if (rowChildren && rowChildren.length) {
				recursiveAdd(rowChildren);
			}
		});
	};

	recursiveAdd(rowIdsArray);
	treeGrid._grid.render();
}

function canCut() {
	var selectedItems = treeGrid.getSelectedItemIDs().reduce(function(selectedItems, itemId) {
		var item = viewShare.functions.getItemNodeById(itemId);
		if (item) {
			selectedItems.push(item);
		}

		return selectedItems;
	}, []);

	return isValidCutCopySelection(selectedItems);
}

function canEditCell(rowId, headId, grid) {
	var columnIndex = grid.head.get(headId, 'index');
	var row = grid.rows.get(rowId);
	var curColumn = ProjectPlan.columns[viewShare.properties.fldToCol[columnIndex]];
	var itemType = row.type;
	var isMilestone = row.isMilestone;
	var shortType = itemType === 'WBS Element' ? 'wbs' : isMilestone ? 'mil' : 'act';

	if (curColumn && !curColumn.isSystem && shortType) {
		var columnSource = curColumn.sources[shortType],
			columnParams = columnSource ? columnSource.params : null;

		if (columnParams) {
			var dataType = columnParams.data_type;
			if (columnParams.readonly === '1' || dataType === 'foreign' || dataType === 'federated') {
				return false;
			}

			return true;
		}

		return false;
	}
	//---- special checks for non system columns

	if (itemType === 'WBS Element' && (headId !== 'treeNode' && headId !== 'delivRequired')) {
		return false;
	}

	if (headId === 'attach' || headId === 'n') {
		return false;
	}

	// +++ IR-005439
	if (itemType === 'Activity2') {
		var hasAsmnts = row.hasAssignments;
		var isLeadRoleFilled = row.role;

		if (
			(isMilestone && (headId === 'hours' || headId === 'duration')) ||
			(hasAsmnts && (headId === 'status' || headId === 'hours')) ||
			(headId === 'leader' && isLeadRoleFilled)
		) {
			return false;
		}
	}
	// --- IR-005439

	return true;
}

function onEditCellM2(rowId, headId, newValue) {
	if (newValue !== undefined) {
		const setResult = setCellValue(rowId, headId, newValue);

		if (headId === 'leader' && setResult === false) {
			setCellValue(rowId, headId, '');
			return false;
		}

		return true;
	}
}

function isInputRow(rowId) {
	return 'searchRow' === rowId;
}

function onStartEdit(rowId, headId, grid) {
	var columnIndex = grid.head.get(headId, 'index');
	var row = grid.rows.get(rowId);
	var cellValue = row[headId] || '';

	var curColumn = ProjectPlan.columns[viewShare.properties.fldToCol[columnIndex]];
	var itemType = row.type;
	var isMilestone = row.isMilestone;
	var shortType = itemType === 'Activity2' ? (isMilestone ? 'mil' : 'act') : 'wbs';

	if (curColumn && !curColumn.isSystem && shortType) {
		var columnSource = curColumn.sources[shortType],
			columnParams = columnSource ? columnSource.params : null;

		if (columnParams) {
			var dataType = columnParams.data_type,
				canEdit = !(dataType === 'foreign' || dataType === 'federated'),
				fieldType = columnParams.field_type;

			const cell = {
				value: cellValue,
				rowId: rowId,
				headId: headId
			};

			switch (fieldType) {
				case 'textarea':
					controlTurnEditOff();
					showTextarea(cell, canEdit);
					break;
				case 'color':
					cell.value = row.style[headId] ? row.style[headId]['background-color'] : '';
					controlTurnEditOff();
					showColorDialog(cell);
					break;
				case 'image':
					var re = /^<img src=["']([^'"]*)['"]/;

					if (re.test(cellValue)) {
						cell.value = RegExp.$1;
					}
					controlTurnEditOff();
					showImageDialog(cell);
					break;
				case 'formatted text':
					controlTurnEditOff();
					showHTMLEditorDialog(cell, canEdit);
					break;
			}
		}
	}
}

function onInputHelperShow(rowId, headId) {
	var grid = treeGrid._grid;
	var isInput = isInputRow(rowId);
	const cellValue = isInput ? grid.head.get(headId, 'searchValue') : grid.rows.get(rowId, headId);

	if (headId === 'leader') {
		controlTurnEditOff();
		searchIdentity(rowId, headId);
		return;
	}

	if (grid.getCellType(headId, rowId) === 'ArasTreeGridDateFormatter' || grid.head.get(headId, 'searchType') === 'date') {
		controlTurnEditOff();
		var format;

		if (isInput) {
			format = 'short_date';
		} else {
			format = getDateFormat(headId, grid.rows.get(rowId, 'type'))
				.replace(/([a-z])([A-Z])/g, '$1-$2')
				.toLowerCase();
		}

		return showDateDialog(rowId, headId, cellValue, format);
	}

	showSearchDialog(rowId, headId, grid);
}

function showSearchDialog(rowId, headId, grid) {
	var param = {
		aras: aras,
		itemtypeName: grid.head.get(headId, 'dataSourceName'),
		type: 'SearchDialog'
	};

	if (!isInputRow(rowId)) {
		var itemType = grid.rows.get(rowId, 'type');
		var isMilestone = grid.rows.get(rowId, 'isMilestone');
		var shortType = itemType === 'WBS Element' ? 'wbs' : isMilestone ? 'mil' : 'act';
		const curCol = ProjectPlan.columns[viewShare.properties.fldToCol[getColumnIndexByHeadId(headId)]];
		var params = curCol.sources[shortType].params;
		var itName = aras.getItemTypeName(params['data_source']);
		if (!itName) return;

		Object.assign(param, {
			itemtypeName: itName,
			sourceItemTypeName: params['itemTypeName'],
			sourcePropertyName: params['name']
		});
	}

	controlTurnEditOff();
	mainWnd.ArasModules.Dialog.show('iframe', param).promise.then(dialogCallback);

	function dialogCallback(val) {
		if (val) {
			onEditCellM2(rowId, headId, val.keyed_name);
		}
	}
}

function searchIdentity(rowId, headId) {
	var params = {
		aras: aras,
		itemtypeName: 'Identity',
		sourceItemTypeName: 'Activity2',
		sourcePropertyName: 'managed_by_id',
		type: 'SearchDialog'
	};
	var dialog = mainWnd.ArasModules.Dialog.show('iframe', params);
	dialog.promise.then(function(searchResult) {
		if (searchResult) {
			onEditCellM2(rowId, headId, searchResult.keyed_name);
		} else {
			return false;
		}
	});
}

function showTextarea(cell, openToEdit) {
	openToEdit = openToEdit === undefined ? false : openToEdit;
	var param = {aras: aras, isEditMode: openToEdit, content: cell.value, type: 'Text'};
	mainWnd.ArasModules.Dialog.show('iframe', param).promise.then(function(text) {
		onEditCellM2(cell.rowId, cell.headId, text);
	});
}

function showHTMLEditorDialog(cell, openToEdit) {
	if (!openToEdit) {
		var content = cell.value
			.replace(/\\/g, '\\\\')
			.replace(/\\n/g, '\n')
			.replace(/'/g, "\\'");
		mainWnd.ArasModules.Dialog.show('iframe', {resizable: true, content: "javascript: '" + content + "'"}); // jshint ignore:line
	} else {
		mainWnd.ArasModules.Dialog.show('iframe', {sHTML: cell.value, aras: aras, type: 'HTMLEditorDialog'}).promise.then(function(text) {
			onEditCellM2(cell.rowId, cell.headId, text);
	});
	}
}

function showColorDialog(cell) {
	mainWnd.ArasModules.Dialog.show('iframe', {oldColor: cell.value, aras: aras, type: 'Color'}).promise.then(function(color) {
		onEditCellM2(cell.rowId, cell.headId, color);
	});
}

function showImageDialog(cell) {
	mainWnd.ArasModules.Dialog.show('iframe', {aras: aras, image: cell.value || '', type: 'ImageBrowser'}).promise.then(function(newImage) {
		onEditCellM2(cell.rowId, cell.headId, newImage === 'set_nothing' ? '' : newImage);
	});
}

function getStatusColor(percents) {
	return '#ffffff'; //status color update is removed from client.
}

function showDateDialog(rowId, headId, oldDate, format) {
	format = aras.getDotNetDatePattern(format);
	var param = {date: aras.convertFromNeutral(oldDate, 'date', format), format: format, aras: aras, type: 'Date'};
	var dateDialog = mainWnd.ArasModules.Dialog.show('iframe', param);

	dateDialog.promise.then(function(newDate) {
		if (rowId === 'searchRow') {
			return newDate;
		}

		return validateCell(rowId, headId, newDate)
			.catch(function(error) {
				if (error) {
					return Promise.reject(error); // rethrow script errors and ignore validation rejects
				}
			});
	})
	.then(function(newDate) {
		newDate = aras.convertToNeutral(newDate, 'date', format);
		onEditCellM2(rowId, headId, newDate);
	});
}

function onUpdateMenuActions() {
	const selectedItemIds = viewShare.properties.selectedItemIds;
	const singleItemSelected = selectedItemIds.length === 1;
	if (singleItemSelected) {
		enableMenuItem('view_edit_selected_item'); // should always be enabled even in the view mode
	}

	if (!viewShare.properties.isEditMode || selectedItemIds.length === 0) {
		return;
	}

	const noDisabledRows = treeGrid.disabledRows.size === 0;
	const cutSelectedItemsBuffer = viewShare.properties.cutSelectedItemsBuffer;
	const noRootsInSelection = selectedItemIds.indexOf(viewShare.properties.wbsId) === -1;

	// here would be actions, available for sinle and multiselection
	if ((!filterApplied || !isFilterCriteriaInputted) && !cutSelectedItemsBuffer && noRootsInSelection && noDisabledRows) {
		enableMenuItem('delete_selected_item');
		enableMenuItem('cut');
		enableMenuItem('copy');
	}

	if (!singleItemSelected) {
		return;
	}

	const typeOfProject = ProjectPlan.projectItemType === 'Project';
	if (typeOfProject) {
		enableMenuItem('add_new_deliverable');
	}

	enableMenuItem('add_existing_deliverable');

	const itemId = selectedItemIds[0];
	const itemType = treeGrid._grid.rows.get(itemId, 'type');
	if (itemType !== 'WBS Element' && !cutSelectedItemsBuffer && typeOfProject) {
		enableMenuItem('open_completion_dialog');
	}

	if (filterApplied || isFilterCriteriaInputted || !noDisabledRows) {
		return;
	}

	if ((cutSelectedItemsBuffer && !treeGrid._cutSelectedItemsBuffer.has(itemId)) || viewShare.properties.copyQryBuffer) {
		enableMenuItem('paste');
	}

	if (cutSelectedItemsBuffer) {
		return;
	}

	enableMenuItem('add_wbs_element');
	enableMenuItem('add_activity');
	enableMenuItem('add_milestone');

	if (!noRootsInSelection) {
		return;
	}

	const itemNode = getItemNodeById(itemId);
	const prevSibling = getSibling(itemNode, false, true);
	const nextSibling = getSibling(itemNode, true, true);

	if (prevSibling) {
		enableMenuItem('move_up');
	}

	if (nextSibling) {
		enableMenuItem('move_down');
	}

	if (itemType === 'WBS Element') {
		enableMenuItem('indent');
		enableMenuItem('outdent');
	}
}

function onGridMenuInit() {
	const menu = treeGrid.getMenu();
	const menuItems = getMenuItems(false, true);

	menu.roots = menuItems.map(function(item) {
		return item.id || 'separator';
	});
}

function onGridMenuClick(itemId) {
	const item = toolbarControl.getItem(itemId);
	if (item) {
		onToolbarButtonClick(item);
	} else {
		onToolbarDropDownItemClick(itemId);
	}
}

function expandAll(forceReinit) {
	if (!treeIsFullyLoaded) {
		expandingMode = 'expand';
		viewShare.functions.loadFullProjectTree();
	} else if (forceReinit) {
		expandingMode = 'expand';
		reInitTree();
	} else {
		treeGrid.expandAll(true);
	}
}

function setFlagsAndExecuteFilterOrClearFilter() {
	viewShare.properties.selectedItemIds = [];
	var toolbarItem = viewShare.controls.activeToolbar.getItem('saved_search_project_tree');
	if (toolbarItem) {
		var savedSearchIdProject = toolbarItem.getSelectedItem();
		if (savedSearchIdProject !== 'emptySavedSearchProject') {
			toolbarItem.setSelected('emptySavedSearchProject');
		}
	}

	var oldFilterState = isFilterCriteriaInputted;

	setIsFilterCriteriaInputtedFlag();
	if (oldFilterState && !isFilterCriteriaInputted) {
		clearFilter(true, true);
	} else {
		if (isDirty() && isFilterCriteriaInputted) {
			aras.AlertError(aras.getResource('project', 'project_tree.save_before_search', ProjectPlan.projectItemType));
			return;
		}
		viewShare.properties.cutSelectedItemsBuffer = null;
		executeFilter();
	}
}

function savedSearchFilter(itemId) {
	return ProjectPlan.savedSearchResults.has(itemId);
}

function executeSearch(filterFn) {
	const grid = treeGrid._grid;
	const expanded = grid.settings.expanded;
	const indexTreeRows = { roots: grid.roots };

	const expandRecursive = function(itemId) {
		const children = grid.rows.get(itemId, 'children');
		if (children && children.length) {
			expanded.add(itemId);
			indexTreeRows[itemId] = children.slice();
			children.forEach(expandRecursive);
		}
	};

	const filterRecursive = function(itemId) {
		let isVisible = filterFn(itemId);
		if (isVisible) {
			expandRecursive(itemId);
			return isVisible;
		}

		const children = grid.rows.get(itemId, 'children');
		if (children && children.length) {
			children.forEach(function (rowId) {
				if (filterRecursive(rowId)) {
					expanded.add(itemId);
					if (indexTreeRows[itemId]) {
						indexTreeRows[itemId].push(rowId);
					} else {
						indexTreeRows[itemId] = [rowId];
					}
					isVisible = true;
				}
			});
		}

		return isVisible;
	};

	if (filterRecursive(indexTreeRows.roots[0])) {
		grid.settings.indexTreeRows = indexTreeRows;
		grid.actions._updateIndexRows();
		if (grid.settings.orderBy.length) {
			grid.sort();
		} else {
			grid.metadata = grid.actions._calcRowsMetadata(indexTreeRows);
		}
	} else {
		grid.settings.indexRows = [];
	}

	grid.render();
	projectView.raiseEvent('onItemChanged');
}

function executeFilter(isSavedSearch) {
	viewShare.properties.cutSelectedItemsBuffer = null;
	loadFullTreeImplementation();
	reInitTree().then(function() {
		if (isSavedSearch === true) {
			isFilterCriteriaInputted = true;
			executeSearch(savedSearchFilter);
			isSavedSearchRunning = false;
			filterApplied = true;
		} else {
			const filterConditions = computeFilterConditions();
			const columns = Object.keys(filterConditions);
			if (columns.length) {
				const simpleSearchFilter = function(itemId) {
					return columns.every(function (headId) {
						let value;
						switch (headId) {
							case 'n':
								value = getActNum(itemId);
								break;
							case 'predecessor':
								value = getPredecessorValue(itemId);
								break;
							default:
								value = treeGrid._grid.rows.get(itemId, headId);
								value = typeof value === 'boolean' ? Number(value) : value;
								break;
						}

						return filterConditions[headId].test(value);
					});
				};

				executeSearch(simpleSearchFilter);
				filterApplied = true;
			}
		}
	});
}

function setIsFilterCriteriaInputtedFlag() {
	isFilterCriteriaInputted = false;

	treeGrid._grid.head._store.forEach(function(head) {
		if (head.searchValue) {
			isFilterCriteriaInputted = true;
		}
	});
}

function computeFilterConditions() {
	const filterConditions = {};
	treeGrid._grid.head._store.forEach(function(head) {
		const searchValue = head.searchValue;
		if (searchValue) {
			filterConditions[head.field] = getFilterCondition(searchValue, head.field);
		}
	});

	return filterConditions;
}

function clearFilter(forceReinit, loadFullTree) {
	let isSavedSearchApplied = false;

	var toolbarItem = viewShare.controls.activeToolbar.getItem('saved_search_project_tree');
	if (toolbarItem) {
		var savedSearchIdProject = toolbarItem.getSelectedItem();
		if (savedSearchIdProject !== 'emptySavedSearchProject') {
			toolbarItem.setSelected('emptySavedSearchProject');
			isSavedSearchApplied = true;
		}
	}

	if (loadFullTree) {
		loadFullTreeImplementation();
	}

	const grid = treeGrid._grid;
	grid.head._store.forEach(function(head) {
		head.searchValue = '';
	});
	isFilterCriteriaInputted = false; // reset flag after searchRow clearing

	if (filterApplied || isSavedSearchApplied) {
		filterApplied = false;
		grid.roots = grid.roots.slice();
		grid.actions._updateIndexRows();
		grid.render();
		const selectedRows = grid.settings.selectedRows;
		treeGrid.scrollToRow(selectedRows[selectedRows.length - 1]);
	}
}

function ClickItemProperty(obj) {
	if (obj && obj.type && obj.id) {
		aras.uiShowItem(obj.type, obj.id);
	}
}

function onLinkClick(rowId) {
	//This expression checks  if clicked link for  item property or attach item. If rowId.indexOf(..)=-1 then  clicked attach item, else is item property.
	if (-1 !== rowId.indexOf('{')) {
		if (!viewShare.properties.isEditMode) {
			ClickItemProperty(JSON.parse(rowId));
		}
		return;
	}

	var selectedItem = viewShare.functions.getItemNodeById(rowId);
	var deliverableNodes = getItemDeliverables(selectedItem);

	if (deliverableNodes) {
		var delivNode;
		var delivId;
		var delivItem;

		if (deliverableNodes.length === 1) {
			delivNode = deliverableNodes[0];
			delivId = delivNode.getAttribute('id');
			delivItem = aras.getItemById(delivNode.getAttribute('type'), delivId, 0);

			if (delivItem) {
				delivItem = delivItem.cloneNode(true);
				delivNode.parentNode.replaceChild(delivItem, delivNode);
				delivNode = delivItem;
			}

			delivNode = aras.replacePolyItemNodeWithNativeItem(delivNode);
			aras.uiShowItemEx(delivNode, 'tab view').then(function(foundWindow) {
				var oldVals = {};
				oldVals['attach'] = getCellLabel(selectedItem, viewShare.properties.fld['attach']).retVal;
				new Synchronizer(rowId, delivNode, foundWindow);
			});
		} else if (deliverableNodes.length > 1) {
			var dialogParams = {aras: aras, deliverables: []},
				options = {dialogWidth: 400, dialogHeight: 300},
				delivName,
				i;

			for (i = 0; i < deliverableNodes.length; i++) {
				delivNode = deliverableNodes[i];
				delivId = delivNode.getAttribute('id');
				delivName = aras.getKeyedNameEx(delivNode);

				dialogParams.deliverables.push([delivId, delivName]);
			}

			var callback = function(delivId) {
				if (delivId) {
					delivNode = getItemDeliverables(selectedItem, delivId);
					delivItem = aras.getItemById(delivNode.getAttribute('type'), delivId, 0);

					if (delivItem) {
						delivItem = delivItem.cloneNode(true);
						delivNode.parentNode.replaceChild(delivItem, delivNode);
						delivNode = delivItem;
					}

					delivNode = aras.replacePolyItemNodeWithNativeItem(delivNode);
					// setTimeout to reset security context to allow window.open executing in Chrome
					aras.uiShowItemEx(delivNode, 'tab view').then(function(foundWindow) {
						new Synchronizer(rowId, delivNode, foundWindow);
					});
				}
			};
			mainWnd.ArasModules.Dialog.show(
				'iframe',
				Object.assign(
					{
						content: '../Solutions/Project/scripts/itemChoice.html'
					},
					dialogParams,
					options
				)
			).promise.then(callback);
		}
	}
}

function controlTurnEditOff() {
	if (treeGrid) {
		treeGrid.turnEditOff();
	}
}
