// jscs: disable requireCamelCaseOrUpperCaseIdentifiers
const ruleItemTypeName = 'vm_Rule';

var aras = parent.aras;
var isUIControlsCreated = false;
var viewsController = parent.viewsController;
var viewContext = {
	controls: {},
	layoutControls: {},
	data: {
		dataModel: null,
		aggregatedDataModel: null,
		familyDataStore: null,
		ruleStructureValidator: null,
		scopeItemNode: null,
		optionItemsHash: null,
		groupOptionsHash: {principal: {}, constrained: {}},
		groupedItemsCache: null
	},
	modules: {},
	eventListeners: {},
	ruleGridLayout: null,
	editorGridLayout: null,
	editorColumnLayout: 'fixed',
	editorColumnFixedWidth: 50,
	customSelection: {},
	customSelectedCell: [] 
};
var treeEventListeners = [];
var synchronizer;
var viewEditMode;

viewContext.data.ruleStructureValidator = {
	validate: function(targetRuleItem) {
		if (targetRuleItem) {
			var expressionTree;
			var principalCheckPassed;
			var constrainedCheckPassed;

			expressionTree = targetRuleItem.getExpressionTree();

			if (expressionTree) {
				principalCheckPassed = this.checkPrincipal(expressionTree);

				if (principalCheckPassed) {
					constrainedCheckPassed = this.checkConstrained(expressionTree);
				}

				return principalCheckPassed && constrainedCheckPassed;
			}
		}
	},

	checkPrincipal: function(expressionTree) {
		var conditionExpressionNode = expressionTree && expressionTree.condition;
		if (conditionExpressionNode) {
			var eqOperand = conditionExpressionNode.operands[0];
			return this.eqExpressionCheck(eqOperand);
		}

		return false;
	},

	checkConstrained: function(expressionTree) {
		var consequenceExpressionNode = expressionTree && expressionTree.consequence;
		var consequenceOperand = consequenceExpressionNode && consequenceExpressionNode.operands[0];

		return this.checkConsequenceExpression(consequenceOperand);
	},

	checkConsequenceExpression: function(consequenceExpression) {
		var checkPassed = true;

		if (consequenceExpression) {
			var expressionOperands = consequenceExpression.operands;

			switch (consequenceExpression.operator) {
				case 'NOT':
					checkPassed = this.checkConsequenceExpression(expressionOperands[0]);
					break;
				case 'AND':
					checkPassed = this.andExpressionCheck(consequenceExpression);
					break;
				case 'OR':
					checkPassed = this.orExpressionCheck(consequenceExpression);
					break;
				case 'EQ':
					checkPassed = this.eqExpressionCheck(consequenceExpression);
					break;
			}
		}

		return checkPassed;
	},

	andExpressionCheck: function(andExpression) {
		if (andExpression) {
			var expressionOperands = andExpression.operands;
			var familyIdHash = {};
			var subExpressionCheck;
			var currentOperand;
			var i;

			for (i = 0; i < expressionOperands.length; i++) {
				currentOperand = expressionOperands[i];

				if (currentOperand.type === 'operation') {
					switch (currentOperand.operator) {
						case 'OR':
							subExpressionCheck = this.orExpressionCheck(currentOperand);
							break;
						case 'EQ':
							subExpressionCheck = this.eqExpressionCheck(currentOperand);
							break;
						default:
							return false;
					}
					if (!subExpressionCheck || familyIdHash[currentOperand.familyId]) {
						return false;
					} else {
						familyIdHash[currentOperand.familyId] = true;
					}
				}
			}
		}

		return true;
	},

	orExpressionCheck: function(orExpression) {
		if (orExpression) {
			var expressionOperands = orExpression.operands;
			var optionItemsHash = viewContext.data.optionItemsHash;
			var optionHashInfo;
			var commonFamilyId;
			var i;

			for (i = 0; i < expressionOperands.length; i++) {
				var isCheckPassed = this.eqExpressionCheck(expressionOperands[i]);
				if (!isCheckPassed) {
					return false;
				}
				optionHashInfo = optionItemsHash[expressionOperands[i].itemId + expressionOperands[i].familyId];

				if (optionHashInfo) {
					if (!commonFamilyId) {
						commonFamilyId = optionHashInfo.familyId;
					} else if (optionHashInfo.familyId !== commonFamilyId) {
						return false;
					}
				} else {
					return false;
				}
			}

			orExpression.familyId = commonFamilyId;
		}

		return true;
	},

	eqExpressionCheck: function(eqExpression) {
		if (eqExpression && eqExpression.operands && eqExpression.operands.length) {
			for (var i = 0; i < eqExpression.operands.length; i++) {
				switch (eqExpression.operands[i].type) {
					case 'variable':
						eqExpression.familyId = eqExpression.operands[i].itemId;
						break;
					case 'named-constant':
						eqExpression.itemId = eqExpression.operands[i].itemId;
						break;
					default:
						return false;
				}
			}
		}
		var optionItemsHash = viewContext.data.optionItemsHash;
		// return true only if there are 2 nodes in EQ expression with not null ids: 'variable' and 'named-constant'
		// and there are in database family and option with such ids
		return Boolean(eqExpression.familyId && eqExpression.itemId && optionItemsHash[eqExpression.itemId + eqExpression.familyId]);
	}
};

function filterValidRuleItems() {
	var dataModel = viewContext.data.dataModel;
	var ruleValidator = viewContext.data.ruleStructureValidator;
	var ruleModelItems = dataModel.getItemsByParameters({itemType: ruleItemTypeName});

	viewContext.data.validRuleItems = ruleModelItems.filter(ruleValidator.validate.bind(ruleValidator));
}

function prepareOptionItemsHash() {
	var aggregatedDataModel = viewContext.data.aggregatedDataModel;
	var optionModelItems = aggregatedDataModel.getItemsByParameters({itemType: 'NamedConstant'});
	var optionItemsHash = {};
	var modelItem;

	for (var i = 0; i < optionModelItems.length; i++) {
		modelItem = optionModelItems[i];

		optionItemsHash[modelItem.itemId + modelItem.parent.itemId] = {
			familyId: modelItem.parent.itemId,
			modelItem: modelItem
		};
	}

	viewContext.data.optionItemsHash = optionItemsHash;
}

function reloadRuleGridData() {
	var validRuleItems = viewContext.data.validRuleItems.slice();
	var gridItems;

	validRuleItems.sort(ruleGridItemSorter);

	gridItems = createRuleGridItems(validRuleItems, viewContext.ruleGridLayout);
	viewContext.controls.ruleGrid.setArrayData_Experimental(gridItems);
}

function ruleGridItemSorter(firstItem, secondItem) {
	var firstCompareIndex = getRuleItemCompareIndex(firstItem);
	var secondCompareIndex = getRuleItemCompareIndex(secondItem);

	return firstCompareIndex - secondCompareIndex;
}

function getRuleItemCompareIndex(ruleItem) {
	if (ruleItem.isActive) {
		return 0;
	} else if (ruleItem.isNew() || ruleItem.isModified()) {
		return 1;
	}

	return 2;
}

function createRuleGridItems(ruleModelItems, gridControlLayout) {
	var gridItems = [];

	ruleModelItems = ruleModelItems ? (Array.isArray(ruleModelItems) ? ruleModelItems : [ruleModelItems]) : [];

	if (ruleModelItems.length) {
		var currentRuleItem;
		var propertyName;
		var propertyValue;
		var newGridItem;
		var itemNode;
		var i;
		var j;

		for (i = 0; i < ruleModelItems.length; i++) {
			currentRuleItem = ruleModelItems[i];
			itemNode = currentRuleItem.node;

			newGridItem = {
				uniqueId: currentRuleItem.id,
				itemId: currentRuleItem.itemId,
				_itemAction: itemNode.getAttribute('action'),
				definition: aras.getItemProperty(itemNode, 'definition')
			};

			for (j = 1; j < gridControlLayout.length; j++) {
				propertyName = gridControlLayout[j].field;
				propertyValue = aras.getItemProperty(itemNode, propertyName);

				newGridItem[propertyName] = propertyValue;
			}
			if (!newGridItem.string_notation) {
				newGridItem.string_notation = currentRuleItem.deserializeExpressionToString({optionDeserializer: optionExpressionDeserializer});
			}
			gridItems.push(newGridItem);
		}
	}

	return gridItems;
}

function reloadEditorGridLayout() {
	var gridLayout = createEditorGridLayout({cellWidthType: viewContext.editorColumnLayout});
	var tableEditor = viewContext.controls.tableEditor;

	viewContext.editorGridLayout = gridLayout;

	tableEditor.selectedIntersection = null;
	tableEditor.setLayout_Experimental(gridLayout);
}

function setEditorGridLayout() {
	// Set the new layout befor rendering it.
	const gridLayout = createEditorGridLayout({ cellWidthType: viewContext.editorColumnLayout });
	viewContext.editorGridLayout = gridLayout;
}

function createEditorCellHint(conjunctionType, principalItemName, constrainedItemName) {
	switch (conjunctionType)  {
		case 'include':
			return 'If ' + principalItemName + ' THEN ' + constrainedItemName;
		case 'exclude':
			return 'If ' + principalItemName + ' THEN NOT ' + constrainedItemName;
		case 'disabled':
			return 'Items cannot be combined';
		case 'multiple':
			return 'Items combined several times';
		default:
			return '';
	}
}

function tableEditorFixedCellRenderer(storeValue, rowIndex, columnDescriptor) {
	var cellHTML = '';
	var renderUtils = viewContext.modules.RenderUtils;
	var storeItem = columnDescriptor.grid.getItem(rowIndex);
	var gridStore = columnDescriptor.grid.store;
	var firstGroupItem = gridStore.getValue(storeItem, '_firstGroupItem');

	if (firstGroupItem) {
		var modelItem = gridStore.getValue(storeItem, '_modelItem');
		var itemName = modelItem.parent.getItemProperty('name');

		cellHTML += renderUtils.HTML.wrapInTag(itemName, 'div', {class: 'firstGroupItemName', title: itemName});
	}

	cellHTML += renderUtils.HTML.wrapInTag(storeValue, 'span', {title: storeValue});

	return cellHTML;
}

function tableEditorCellRenderer(rowIndex, columnDescriptor, parent, columnIndex) {
	// modified this function to render the cell but under the group column. also attached hover events
	var cellHTML = '';
	var renderUtils = viewContext.modules.RenderUtils;
	const grid = parent.grid;
	const columnId = parent.field;
	const storeItem = grid.getItem(rowIndex);
	const gridStore = grid.store;
	var intersectionInfo = gridStore.getValue(storeItem, columnDescriptor.field) || {};
	var conjunctionType = intersectionInfo.conjunctionType;
	var selectionStatus = intersectionInfo.selected;
	var commonCssClasses = ' ' + (selectionStatus ? (selectionStatus === 'selected' ? ' selectedStatusCell' : ' unselectedStatusCell') : '');
	var constrainedItemName = gridStore.getValue(storeItem, '_constrainedOption');
	var cellHint = createEditorCellHint(conjunctionType, columnDescriptor.name, constrainedItemName);

	let tagAttributes = {
		class: 'statusCell ',
		id: 'column-' + columnId + "-" + columnIndex,
		onmouseover: 'onEditorGridCellDivMouseOver(this)',
		onmouseout: 'onEditorGridCellDivMouseOut(this)'
	}

	if (intersectionInfo.ruleDeleted) {
		commonCssClasses += ' deletedItem';
	}
	if (columnDescriptor && columnDescriptor._lastGroupItem) {
		tagAttributes.class += ' lastStatusDivCell';
	}
	
	switch (conjunctionType) {
		case 'include':
			cellHTML += renderUtils.HTML.wrapInTag('I', 'div', {class: commonCssClasses + ' includeStatus', title: cellHint});
			break;
		case 'exclude':
			cellHTML += renderUtils.HTML.wrapInTag('E', 'div', {class: commonCssClasses + ' excludeStatus', title: cellHint});
			break;
		case 'multiple':
			cellHTML += renderUtils.HTML.wrapInTag('M', 'div', {class: commonCssClasses + ' multipleStatus', title: cellHint});
			break;
		case 'disabled':
			cellHTML += renderUtils.HTML.wrapInTag('\u00A0', 'div', {class: commonCssClasses + ' disabledStatus', title: cellHint});
			break;
		default:
			cellHTML += renderUtils.HTML.wrapInTag('\u00A0', 'div', { class: commonCssClasses + ' emptyStatus', title: cellHint });
			break;
	}
	cellHTML = renderUtils.HTML.wrapInTag(cellHTML, 'div', tagAttributes);
	return cellHTML;
}

function onEditorGridCellDivMouseOver(event) {
	// mouse over event
	let columnId = document.getElementById(event.id.replace('column', 'header'));
	columnId.classList.add('currentSelection');
	viewContext.customSelection.cells = [event.id];
}

function onEditorGridCellDivMouseOut(event) {
	// mouse out event
	let columnId = document.getElementById(event.id.replace('column', 'header'));
	columnId.classList.remove('currentSelection');
}

function tableEditorGroupCellRenderer(storeValue, rowIndex, columnDescriptor) {
	// custome group column descriptor for editor table.
	let cellHTML = '';
	const renderUtils = viewContext.modules.RenderUtils;
	columnDescriptor.children.forEach((itemDescriptor, index) => {
		cellHTML += tableEditorCellRenderer(rowIndex, itemDescriptor, columnDescriptor, index);
	})
	cellHTML = renderUtils.HTML.wrapInTag(cellHTML, 'div', { class: 'groupSubCell', title: columnDescriptor.name });
	return cellHTML;
}
function getRuleItemsByIntersectionInfo(intersectionInfo, ruleModelItems) {
	var foundItems = [];

	intersectionInfo = intersectionInfo || {};
	ruleModelItems = ruleModelItems || [];

	if ((intersectionInfo.principalOption || intersectionInfo.constrainedOption) && ruleModelItems.length) {
		var isExcludeConjunctionType = intersectionInfo.conjunctionType === 'exclude';
		var modelItem;
		var isCheckPassed;
		var i;

		for (i = 0; i < ruleModelItems.length; i++) {
			modelItem = ruleModelItems[i];

			if (modelItem.isExcludeExpression() === isExcludeConjunctionType) {
				isCheckPassed = (!intersectionInfo.principalOption || modelItem.hasConditionOption(intersectionInfo.principalOption)) &&
					(!intersectionInfo.constrainedOption || modelItem.hasConsequenceOption(intersectionInfo.constrainedOption));

				if (isCheckPassed) {
					foundItems.push(modelItem);
				}
			}
		}
	}

	return foundItems;
}

function reloadEditorGridData() {
	var editorGrid = viewContext.controls.tableEditor;
	var aggregatedDataModel = viewContext.data.aggregatedDataModel;
	var constrainedOptions = aggregatedDataModel.getItemsByParameters({group: 'constrained', itemType: 'NamedConstant'});
	var gridItems = [];
	var i;

	if (constrainedOptions.length) {
		var gridLayout = viewContext.editorGridLayout;
		var intersectionPairs = getOptionsIntersectionPairs(viewContext.data.activeRuleItems);
		var intersectionHash = {};
		var separateViewDescriptors;
		var isFirstOption;
		var modelItem;
		var parentModelItem;
		var previousModelItem;
		var columnDescriptor;
		var hashedInfo;
		var intersectionInfo;
		var itemIntersectionHash;
		var familyId;
		var j;
		var k;

		for (i = 0; i < intersectionPairs.length; i++) {
			intersectionInfo = intersectionPairs[i];
			itemIntersectionHash = intersectionHash[intersectionInfo.leftOption] || (intersectionHash[intersectionInfo.leftOption] = {});
			hashedInfo = itemIntersectionHash[intersectionInfo.rightOption + intersectionInfo.rightFamily];

			if (hashedInfo) {
				hashedInfo.conjunctionType = 'multiple';
				hashedInfo.ruleId = Array.isArray(hashedInfo.ruleId) ? hashedInfo.ruleId : [hashedInfo.ruleId];
				hashedInfo.ruleId.push(intersectionInfo.ruleId);
			} else {
				itemIntersectionHash[intersectionInfo.rightOption + intersectionInfo.rightFamily] = {
					conjunctionType: intersectionInfo.operation,
					ruleId: intersectionInfo.ruleId,
					ruleDeleted: intersectionInfo.ruleDeleted,
					_type: 'intersectionInfo'
				};
			}
		}

		for (i = 0; i < constrainedOptions.length; i++) {
			previousModelItem = modelItem;
			modelItem = constrainedOptions[i];
			parentModelItem = modelItem.parent;

			// if current option family differs from previous, then set special property on previous grid item
			if (familyId && familyId !== parentModelItem.itemId) {
				newGridItem._lastGroupItem = previousModelItem.parent.getItemProperty('name');
			}

			isFirstOption = !familyId || newGridItem._lastGroupItem;
			familyId = parentModelItem.itemId;

			newGridItem = {
				uniqueId: modelItem.id,
				_constrainedOption: modelItem.getItemProperty('name'),
				_firstGroupItem: isFirstOption,
				_modelItem: modelItem,
				_isHighlighted: false
			};

			for (j = 0; j < gridLayout.length; j++) {
				separateViewDescriptors = gridLayout[j].cells ? gridLayout[j].cells[0] : [separateViewDescriptors];

				for (k = 0; k < separateViewDescriptors.length; k++) {
					columnDescriptor = separateViewDescriptors[k];

					if (!columnDescriptor.fixed) {

						columnDescriptor.children.forEach(itemDescriptor => {
							propertyName = itemDescriptor.field;
							intersectionInfo = intersectionHash[propertyName];

							if (propertyName === modelItem.itemId) {
								newGridItem[propertyName] = { conjunctionType: 'disabled', _type: 'intersectionInfo' };
							} else {
								newGridItem[propertyName] = (intersectionInfo && intersectionInfo[modelItem.itemId + modelItem.parent.itemId]) || '';
							}
						});
					}
				}
			}

			gridItems.push(newGridItem);
		}

		newGridItem._lastGroupItem = parentModelItem.getItemProperty('name');
	}

	editorGrid.setArrayData_Experimental(gridItems);

	if (gridItems.length) {
		var gridViews = editorGrid.grid_Experimental.views.views;

		for (i = 0; i < gridViews.length; i++) {
			gridViews[i].adaptHeight();
		}
	}
}

function reloadFamilyTreeData() {
	var familyTree = viewContext.controls.familyTree;

	familyTree.refreshData(viewContext.data.familyDataStore, true);
}

loadView = function(newScopeItemNode) {
	var shareData = viewsController.shareData;
	var viewData = viewContext.data;

	viewData.dataModel = viewsController.shareData.scopeDataModel;
	viewData.aggregatedDataModel = viewsController.shareData.aggregatedDataModel;
	synchronizer = shareData.synchronizer;

	if (!isUIControlsCreated) {
		setEditState(viewsController.isViewEditable());

		initViewDataContainers(newScopeItemNode);
		createUIControls(newScopeItemNode);
	} else {
		reloadView(newScopeItemNode);
	}

	attachDataModelEventListeners();
	clearDataModelSelection();
};

function clearDataModelSelection() {
	var dataModel = viewContext.data.dataModel;

	dataModel.setSelection([], {forceSelection: true});
}

function unloadView() {
	var aggregatedDataModel = viewsController.shareData.aggregatedDataModel;

	viewContext.groupedItemsCache = aggregatedDataModel.getGroupedItemsCache();
	removeDataModelEventListeners();
}

function setEditState(editState) {
	editState = Boolean(editState);

	if (editState !== viewEditMode) {
		viewEditMode = editState;

		if (isUIControlsCreated) {
		}
	}
}

function reloadView(scopeItemNode) {
	setEditState(viewsController.isViewEditable());

	if (isUIControlsCreated) {
		initViewDataContainers(scopeItemNode);

		reloadFamilyTreeData();
		reloadRuleGridData();
		reloadEditorGridLayout();
		reloadEditorGridData();

		updateViewToolbarState();
		updateDataModelSelection();
	}
}

function initViewDataContainers(scopeItemNode) {
	var dataLoader = synchronizer.dataLoader;
	var viewData = viewContext.data;
	var viewModules = viewContext.modules;
	var dataStore;

	dataLoader.requestSampleRelationshipData(['vm_VariabilityItemRule']);

	viewData.scopeItemNode = scopeItemNode;
	viewData.dataModel.setScopeItem(scopeItemNode);

	if (!aras.isTempEx(scopeItemNode)) {
		viewData.aggregatedDataModel.loadSampleData(scopeItemNode.getAttribute('id'));
	}

	if (viewContext.groupedItemsCache) {
		viewData.aggregatedDataModel.restoreGroupedItems(viewContext.groupedItemsCache);
		viewContext.groupedItemsCache = null;
	}

	prepareOptionItemsHash();

	// loading and keep link to dataStoreModule
	if (!isUIControlsCreated) {
		require(['Modules/aras.innovator.VariantManagementSample/Scripts/scopeRules/dataStore'],
			function(DataStoreModule) {
				viewModules.DataStore = DataStoreModule;
			});
	}

	// creating each time new dataStore instance, in order to not overwrite previous items (used for expand state restoration in familiesTree)
	dataStore = new viewModules.DataStore({aras: aras});
	dataStore.treeModelCollection = viewData.aggregatedDataModel.getItemsByParameters({itemType: 'Variable'}).sort(dataStore.itemSorter);

	// registering modelItems in dataStore
	dataStore.treeModelCollection.map(function(modelItem) {
		var childItems = [modelItem].concat(modelItem.getChildren(true));
		var i;

		for (i = 0; i < childItems.length; i++) {
			dataStore.registerItem(childItems[i]);
		}
	});

	viewData.familyDataStore = dataStore;

	filterValidRuleItems();
	filterActiveRuleItems();
}

function getOptionsIntersectionPairs(ruleModelItems) {
	var intersectionPairs = [];
	var ruleIntersectionPairs;
	var i;
	var j;

	ruleModelItems = ruleModelItems || [];

	for (i = 0; i < ruleModelItems.length; i++) {
		ruleIntersectionPairs = getRuleIntersectionPairs(ruleModelItems[i]);

		for (j = 0; j < ruleIntersectionPairs.length; j++) {
			intersectionPairs.push(ruleIntersectionPairs[j]);
		}
	}

	return intersectionPairs;
}

function getRuleIntersectionPairs(ruleModelItem)  {
	const intersectionPairs = [];

	if (ruleModelItem) {
		const optionsOperation = ruleModelItem.isExcludeExpression() ? 'exclude' : 'include';
		const conditionOptions = ruleModelItem.getConditionOptions();
		const consequenceOptions = ruleModelItem.getConsequenceExpressionNodes('named-constant');
		const ruleItemId = ruleModelItem.id;
		const isItemDeleted = ruleModelItem.isDeleted();
		const variableOperandFinder = operand => operand.type === 'variable';

		for (let i = 0; i < conditionOptions.length; i++) {
			const conditionOptionId = conditionOptions[i];

			for (let j = 0; j < consequenceOptions.length; j++) {
				const consequenceOption = consequenceOptions[j];
				const consequenceFeature = consequenceOption.parent.operands.find(variableOperandFinder);

				intersectionPairs.push({
					leftOption: conditionOptionId,
					rightOption: consequenceOption.itemId,
					rightFamily: consequenceFeature.itemId,
					operation: optionsOperation,
					ruleId: ruleItemId,
					ruleDeleted: isItemDeleted
				});
			}
		}
	}

	return intersectionPairs;
}

function renderFamilyListCellHTML(storeValue, rowIndex, level, layoutCell) {
	var modelItem = storeValue;
	var htmlRenderUtils = viewContext.modules.RenderUtils.HTML;
	var propertyValue = modelItem.getItemProperty('name');
	var cellHTML = htmlRenderUtils.wrapInTag(propertyValue, 'span', {class: 'NameElementNamePart', title: propertyValue});
	var groupsCount = this.getCheckGroupsCount();
	return htmlRenderUtils.wrapInTag(cellHTML, 'div', {class: 'CellTextContent', style: 'left:' + (level * 28 + 45) + 'px;right:' + groupsCount * 25 + 'px;'}) +
		this._renderGroupButtons(storeValue);
}

function createUIControls(scopeItemNode, additionalArguments) {
	require([
		'dojo/layout',
		'dojo/parser',
		'dojo/_base/connect',
		'dojo/aspect',
		'Modules/aras.innovator.VariantManagementSample/Scripts/tableRuleEditor/groupTreeGridAdapter',
		'Controls/Common/RenderUtils'
	], function(layoutBundle, parser, connect, aspect, TreeGridAdapter, RenderUtils) {
		var viewControls = viewContext.controls;
		var viewData = viewContext.data;
		var treeControl;

		additionalArguments = additionalArguments || {};
		viewContext.modules.RenderUtils = RenderUtils;

		parser.parse();

		// toolbar creation
		clientControlsFactory.createControl('Aras.Client.Controls.Public.ToolBar', {
				id: 'tableEditorViewToolbar',
				connectId: 'viewToolbar',
				style: 'overflow: hidden;'
			},
			function(control) {
				gridToolbar = control;
				gridToolbar.loadXml(aras.getI18NXMLResource('tableruleeditor_toolbar.xml'));

				clientControlsFactory.on(gridToolbar, {
					'onClick': onEditorToolbarButtonClick
				});

				gridToolbar.show();
			});

		treeControl = new TreeGridAdapter({connectId: 'familyTree', dataStore: viewData.familyDataStore, modeData: {
			groups: {
				principal: {
					label: 'Principal',
					// style: 'background-color: #9AB9E3; color: #3F5069;',
					style: 'background-color: #80C1CF; color: #3F5069;',
					symbol: 'P'
				},
				constrained: {
					label: 'Constrained',
					//style: 'background-color: #EDB88E; color: #5E5B31;',
					//style: 'background-color: #FAE9B6; color: #5E5B31;',
					style: 'background-color: #FAF4C5; color: #5E5B31;',
					symbol: 'C'
				}
			}
		}});
		treeControl.renderCellHTML = renderFamilyListCellHTML;
		treeControl._createTree();
		treeEventListeners.push(connect.connect(treeControl, 'onExecuteAction', onExecuteGridAction));
		viewControls.familyTree = treeControl;

		// ruleGrid control creation
		clientControlsFactory.createControl('Aras.Client.Controls.Public.GridContainer', {connectId: 'ruleGrid'}, function(gridControl) {
			gridControl.setMultiselect(true);
			viewContext.ruleGridLayout = createRuleGridLayout(ruleItemTypeName);

			clientControlsFactory.on(gridControl, {
				'gridClick': onRuleGridRowSelect,
				'gridMenuInit': onRuleGridMenuInit,
				'gridMenuClick': onRuleGridMenuClick,
				'onApplyEdit_Experimental': onRuleGridApplyEdit,
				'canEdit_Experimental': onRuleGridCanEdit
			});

			clientControlsFactory.on(gridControl.grid_Experimental, {
				'onStyleRow': function(gridRow) {
					var storeItem = this.getItem(gridRow.index);

					if (storeItem) {
						var dataModel = viewContext.data.dataModel;
						var modelItemId = storeItem.uniqueId[0];
						var modelItem = dataModel.getItemById(modelItemId);

						gridRow.customClasses += modelItem.isActive ? '' : ' gridRowNotEditable';
					}
				}
			});

			// jscs: disable
			gridControl.setLayout_Experimental(viewContext.ruleGridLayout);
			gridControl.columns_Experimental.set('_itemAction', 'formatter', function(storeValue, rowIndex, columnDescriptor) {
				var dataModel = viewContext.data.dataModel;
				var renderUtils = viewContext.modules.RenderUtils;
				var storeItem = this.grid.getItem(rowIndex);
				var ruleModelItem = dataModel.getItemById(storeItem.uniqueId[0]);
				var cellHTML = '';

				if (ruleModelItem && !ruleModelItem.isItemValid()) {
					cellHTML += renderUtils.HTML.wrapInTag('!', 'div', {
						class: 'errorMessage',
						title: ruleModelItem.getErrorString()
					});
				}

				cellHTML += storeValue ? renderUtils.HTML.wrapInTag('', 'div', {class: 'itemActionIcon ' + storeValue}) : '';

				return cellHTML;
			});
			// jscs: enable

			viewControls.ruleGrid = gridControl;
			reloadRuleGridData();
		});

		// editorGrid control creation
		clientControlsFactory.createControl('Aras.Client.Controls.Public.GridContainer', {connectId: 'tableEditor'}, function(gridControl) {
			// jscs: disable
			var gridWidget = gridControl.grid_Experimental;

			gridControl.rowHeight = 34;
			gridWidget.setSortIndex = function() {};

			gridControl.getListsById_Experimental = null;

			// customization of getColumnHeaderHtml method
			gridWidget._originGetSortProps = gridWidget.getSortProps;
			gridWidget.getSortProps = function() {
				var sortProps = this._originGetSortProps();

				return sortProps.length ? sortProps : null;
			};

			gridWidget._originGetColumnHeaderHtml = function (columnName, sortProperty) {
				let headerCellHtml = '';
				const renderUtils = viewContext.modules.RenderUtils.HTML;
				headerCellHtml = renderUtils.wrapInTag(columnName, 'span', { class: 'subheader-text subheader-text_vertical' });
				return headerCellHtml
			}
			gridWidget.getColumnHeaderHtml = function(columnName, sortProperty) {
				var headerCellHtml = '';

				if (columnName === '_constrainedOption') {
					headerCellHtml = renderEditorLegend();
				} else {
					var columnDescriptor = this.getColumnDescriptorByName(columnName);
					var renderUtils = viewContext.modules.RenderUtils.HTML;

					if (columnDescriptor._firstGroupItem) {
						var modelItem = columnDescriptor._modelItem;
						var itemName = modelItem.parent.getItemProperty('name');

						headerCellHtml += renderUtils.wrapInTag(columnDescriptor.name, 'div', { class: 'firstGroupItemName', title: itemName });
					}

					columnDescriptor.children.forEach((i, index) => {
						headerCellHtml += renderUtils.wrapInTag(this._originGetColumnHeaderHtml(i.name, sortProperty), 'div', { class: 'subheader-container subheader-container_vertical', title: i.name, id: "header-" + columnDescriptor.field + "-" + index });
					});
					headerCellHtml = renderUtils.wrapInTag(headerCellHtml, 'div', { class: 'subheaders'})
				}

				return headerCellHtml;
			};

			aspect.after(gridWidget, 'buildViews', function() {
				// default method attaches modified '_getHeaderContent' only to first view, here we copy this method to other views
				var gridViews = this.views.views;
				var i;

				for (i = 1; i < gridViews.length; i++) {
					gridViews[i]._getHeaderContent = gridViews[0]._getHeaderContent;
					connect.connect(gridViews[i], 'doscroll', onEditorScroll);
				}
			});

			// customization of getRowIndex method
			gridControl._getRowIndexFromStore = function(rowId) {
				var gridWidget = this.grid_Experimental;
				var gridStore = gridWidget.store;
				var storeItem = gridStore._itemsByIdentity[rowId];

				return gridStore._arrayOfAllItems.indexOf(storeItem);
			};

			// customization of setLayout_Experimental method
			gridControl.setLayout_Experimental = function(fieldDescriptors) {
				var descriptorsByName = {};
				var gridWidget = this.grid_Experimental;
				var columnCounter = 0;
				var separateViewDescriptors;
				var currentDescriptor;
				var i;
				var j;

				gridWidget.order = [];
				gridWidget.nameColumns = [];

				for (i = 0; i < fieldDescriptors.length; i++) {
					currentDescriptor = fieldDescriptors[i];

					if (currentDescriptor.cells) {
						separateViewDescriptors = currentDescriptor.cells[0];

						for (j = 0; j < separateViewDescriptors.length; j++) {
							currentDescriptor = separateViewDescriptors[j];

							descriptorsByName[currentDescriptor.name] = currentDescriptor;
							gridWidget.nameColumns.push(currentDescriptor.field);
							gridWidget.order.push(columnCounter++);
						}
					} else {
						descriptorsByName[currentDescriptor.name] = currentDescriptor;
						gridWidget.nameColumns.push(currentDescriptor.field);
						gridWidget.order.push(columnCounter++);
					}
				}

				gridWidget._columnDescriptorsByName = descriptorsByName;
				gridWidget.selection.clear();
				gridWidget.set('structure', fieldDescriptors);
			};

			gridWidget.getFocusedView = function() {
				var gridViews = this.views.views;
				var currentView;
				var i;

				for (i = 0; i < gridViews.length; i++) {
					currentView = gridViews[i];

					if (currentView.focused) {
						return currentView;
					}
				}
			};

			// add new getColumnDescriptorByName method
			gridWidget.getColumnDescriptorByName = function(columnName) {
				return this._columnDescriptorsByName[columnName];
			};

			clientControlsFactory.on(gridControl, {
				'gridMenuInit': onEditorGridMenuInit,
				'gridMenuClick': onEditorGridMenuClick,
				'gridHeaderMenuClick_Experimental': onEditorGridMenuClick,
				'gridSelectCell': onEditorGridSelectCell,
				'gridDoubleClick': onEditorGridDoubleClick
			});

			clientControlsFactory.on(gridWidget, {
				'onCellMouseOver': onEditorGridCellMouseOver,
				'onStyleRow': function(gridRow) {
					var storeItem = this.getItem(gridRow.index);

					if (storeItem) {
						var isLastOption = this.store.getValue(storeItem, '_lastGroupItem');
						var isHighlighted = this.store.getValue(storeItem, '_isHighlighted');

						if (isLastOption) {
							gridRow.customClasses += ' gridRowGroupSplitter';
						}

						if (isHighlighted) {
							gridRow.customClasses += ' highlightedRow';
						}
					}
				},
				'resize': onEditorResizeHandler
			});
			// jscs: enable

			viewControls.tableEditor = gridControl;
		});

		viewContext.layoutControls = {
			viewBorderContainer: dijit.byId('viewBorderContainer'),
			sideBorderContainer: dijit.byId('sideControlsContainer'),
			familyListContainer: dijit.byId('familyTreeContainer'),
			ruleListContainer: dijit.byId('ruleGridContainer'),
			tableEditorContainer: dijit.byId('tableEditorContainer'),
			ruleTextRepresentation: dijit.byId('ruleTextRepresentation')
		};

		window.addEventListener('beforeunload', onBeforeUnload);

		updateViewToolbarState();
		viewContext.layoutControls.viewBorderContainer.domNode.style.visibility = 'visible';
		isUIControlsCreated = true;
	});
}

function attachDataModelEventListeners() {
	var eventListeners = viewContext.eventListeners.dataModel || (viewContext.eventListeners.dataModel = []);
	var dataModel = viewContext.data.dataModel;
	var aggregatedDataModel = viewContext.data.aggregatedDataModel;
	var ruleGrid = viewContext.controls.ruleGrid;
	var tableEditor = viewContext.controls.tableEditor;

	// ruleGrid event listeners
	eventListeners.push(dataModel.addEventListener(ruleGrid, ruleGrid, 'onSelectionChanged', onRuleGridDataModelSelectionChanged));
	eventListeners.push(dataModel.addEventListener(ruleGrid, ruleGrid, 'onNewItem', onRuleGridDataModelNewItem));
	eventListeners.push(dataModel.addEventListener(ruleGrid, ruleGrid, 'onDeleteItem', onRuleGridDataModelDeleteItem));
	eventListeners.push(dataModel.addEventListener(ruleGrid, ruleGrid, 'onChangeItem', onRuleGridModelDataItemChangeHandler));

	// tableEditor event listeners
	eventListeners.push(dataModel.addEventListener(tableEditor, tableEditor, 'onSelectionChanged', onEditorDataModelSelectionChanged));
	eventListeners.push(dataModel.addEventListener(tableEditor, tableEditor, 'onDeleteItem', onEditorDataModelDeleteItem));
	eventListeners.push(dataModel.addEventListener(tableEditor, tableEditor, 'onSelectIntersectionPair', onEditorDataModelIntersectionSelect));

	// window event listeners
	eventListeners.push(dataModel.addEventListener(window, window, 'onSelectionChanged', onViewDataModelSelectionChanged));
	eventListeners.push(dataModel.addEventListener(window, window, 'onNewItem', onDataModelNewItem));
	eventListeners.push(dataModel.addEventListener(window, window, 'onDeleteItem', onDataModelDeleteItem));
	eventListeners.push(dataModel.addEventListener(window, window, 'onChangeItem', onDataModelChangeItem));

	eventListeners.push(aggregatedDataModel.addEventListener(window, window, 'onItemGroupChanged', onItemGroupChangeHandler));
	eventListeners.push(dataModel.addEventListener(window, window, 'onSelectIntersectionPair', onRepresentationDataModelIntersectionSelect));
}

function removeDataModelEventListeners() {
	var eventListeners = viewContext.eventListeners.dataModel || [];

	for (i = 0; i < eventListeners.length; i++) {
		eventListeners[i].remove();
	}
}

function onEditorScroll(scrollEvent) {
	var scollboxNode = scrollEvent.target;
	var topPosition = scollboxNode.scrollTop;
	var leftPosition = scollboxNode.scrollLeft;
	var editorGrid = viewContext.controls.tableEditor;
	var gridWidget = editorGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	var nameNodeHeight = 10;
	var computedStyle;
	var groupNode;
	var modelItem;

	// display current option group name for vertical(fixed column) row, if user scolls to the bottom
	groupNode = gridWidget.viewsHeaderNode.querySelector('.verticalGroupName');

	if (topPosition) {
		var rowIndex = Math.max(Math.floor((topPosition - nameNodeHeight) / gridWidget.rowHeight), 0);
		var storeItem = gridWidget.getItem(rowIndex);

		if (groupNode._originBottom === undefined) {
			computedStyle = window.getComputedStyle(groupNode);
			groupNode._originBottom = parseInt(computedStyle.bottom);
		}

		modelItem = gridWidget.store.getValue(storeItem, '_modelItem');
		groupNode.textContent = modelItem.parent.getItemProperty('name');
		groupNode.style.bottom = groupNode._originBottom + (topPosition < nameNodeHeight ? topPosition : nameNodeHeight) + 'px';
	} else {
		groupNode.style.bottom = groupNode._originBottom + 'px';
	}

	// display current option group name for horizontal(header) row, if user scolls to the left
	groupNode = gridWidget.viewsHeaderNode.querySelector('.horizontalGroupName');

	if (leftPosition) {
		var optionItemsHash = viewContext.data.optionItemsHash;
		var scrollingView = gridWidget.views.getFirstScrollingView();
		var viewColumns = scrollingView.structure.cells[0];
		var columnIndex = 0;
		var columnDescriptor = viewColumns[columnIndex];
		var headerCellNode = scrollingView.getHeaderCellNode(columnDescriptor.index);
		var currentWidth = headerCellNode.offsetWidth;

		while (currentWidth < leftPosition - nameNodeHeight) {
			columnIndex += 1;
			columnDescriptor = viewColumns[columnIndex];
			headerCellNode = scrollingView.getHeaderCellNode(columnDescriptor.index);

			currentWidth += headerCellNode.offsetWidth;
		}

		if (groupNode._originRight === undefined) {
			computedStyle = window.getComputedStyle(groupNode);
			groupNode._originRight = parseInt(computedStyle.right);
		}

		groupNode.textContent = columnDescriptor.name;
		groupNode.style.right = (groupNode._originRight + (leftPosition < nameNodeHeight ? leftPosition : nameNodeHeight)) + 'px';
	} else {
		groupNode.style.right = groupNode._originRight + 'px';
	}
}

function onEditorResizeHandler() {
	var dataModel = viewContext.data.dataModel;
	var modelSelection = dataModel.getSelection();

	if (modelSelection.length) {
		onEditorHighlightSelectedItems(modelSelection);
	}
}

function onViewDataModelSelectionChanged(selectedItems) {
	updateRuleTextRepresentation(selectedItems);
	updateViewToolbarState();
}

function updateRuleTextRepresentation(selectedItems) {
	var representationPanel = viewContext.layoutControls.ruleTextRepresentation;
	var ruleTextNode = representationPanel.domNode.querySelector('.ruleText');

	selectedItems = selectedItems ? (Array.isArray(selectedItems) ? selectedItems : [selectedItems]) : [];

	if (selectedItems.length === 1) {
		var ruleModelItem = selectedItems[0];

		representationPanel.ruleId = ruleModelItem.uniqueId;
		ruleTextNode.innerHTML = ruleModelItem.deserializeExpressionToString({optionDeserializer: optionExpressionRepresentationDeserializer});

		attachRuleTextRepresentationEventListeners(representationPanel.domNode);
	} else {
		representationPanel.ruleId = '';
		ruleTextNode.innerHTML = '';
	}
}

function attachRuleTextRepresentationEventListeners(panelNode) {
	var constrainedOptionNodes = panelNode.querySelectorAll('.constrainedOption');
	var optionNode;
	var i;

	for (i = 0; i < constrainedOptionNodes.length; i++) {
		optionNode = constrainedOptionNodes[i];
		optionNode.addEventListener('click', onRepresentationOptionNodeClick);
	}
}

function onRepresentationOptionNodeClick(clickEvent) {
	var dataModel = viewContext.data.dataModel;
	var representationPanel = viewContext.layoutControls.ruleTextRepresentation;
	var ruleModelItem = dataModel.getItemById(representationPanel.ruleId);
	var principalOptions = ruleModelItem.getConditionOptions();
	var optionDomNode = clickEvent.currentTarget;
	var constrainedOptionId = optionDomNode.getAttribute('optionId');

	selectIntersectionPair(representationPanel, {
		ruleId: representationPanel.ruleId,
		principalOptionId: principalOptions[0],
		constrainedOptionId: constrainedOptionId
	});
}

function onRuleGridCanEdit(rowId, columnName) {
	if (viewEditMode) {
		var dataModel = viewContext.data.dataModel;
		var ruleModelItem = dataModel.getItemById(rowId);

		return !ruleModelItem.isDeleted();
	}

	return false;
}

function onRuleGridApplyEdit(rowId, fieldName, propertyValue) {
	var dataModel = viewContext.data.dataModel;
	var ruleModelItem = dataModel.getItemById(rowId);

	ruleModelItem.setItemProperty(fieldName, propertyValue);
}

function onRuleGridDataModelNewItem(modelItem) {
	if (modelItem.itemType === ruleItemTypeName) {
		var filteredRules = viewContext.data.validRuleItems;
		var activeRuleItems = viewContext.data.activeRuleItems;

		filteredRules.push(modelItem);
		activeRuleItems.push(modelItem);

		reloadRuleGridData();
	}
}

function onDataModelNewItem(modelItem) {
	if (modelItem.itemType === ruleItemTypeName) {
		modelItem.setItemProperty('string_notation', modelItem.deserializeExpressionToString({optionDeserializer: optionExpressionDeserializer}));

		synchronizer.setScopeDirtyState();
	}
}

function onRuleGridDataModelDeleteItem(modelItem) {
	var itemType = modelItem.itemType;

	if (itemType === ruleItemTypeName) {
		if (modelItem.isNew()) {
			var filteredRules = viewContext.data.validRuleItems;
			var activeRules = viewContext.data.activeRuleItems;
			var ruleItemIndex = filteredRules.indexOf(modelItem);

			if (ruleItemIndex > -1) {
				filteredRules.splice(ruleItemIndex, 1);
			}

			ruleItemIndex = activeRules.indexOf(modelItem);
			if (ruleItemIndex > -1) {
				activeRules.splice(ruleItemIndex, 1);
			}

			reloadRuleGridData();
		} else {
			var ruleGrid = viewContext.controls.ruleGrid;
			var gridStore = ruleGrid.grid_Experimental.store; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
			var storeItem = gridStore._itemsByIdentity[modelItem.uniqueId];

			gridStore.setValue(storeItem, '_itemAction', 'delete');
		}
	}
}

function onDataModelDeleteItem(modelItem) {
	if (modelItem.itemType === ruleItemTypeName && !modelItem.isNew()) {
		synchronizer.setScopeDirtyState();
	}
}

function onRuleGridModelDataItemChangeHandler(modelItem, changesInfo) {
	var itemType = modelItem.itemType;

	if (itemType === ruleItemTypeName) {
		var ruleGrid = viewContext.controls.ruleGrid;
		var gridWidget = ruleGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
		var gridStore = gridWidget.store;
		var storeItem = gridStore._itemsByIdentity[modelItem.uniqueId];

		if (storeItem) {
			var attributeChanges = changesInfo.attribute;
			var propertyChanges = changesInfo.property;

			if (attributeChanges && attributeChanges.action) {
				gridStore.setValue(storeItem, '_itemAction', attributeChanges.action);
			}

			if (propertyChanges) {
				var displayedProperties = gridWidget.structure;
				var propertyNameHash = {};
				var propertyDescriptor;
				var propertyName;
				var i;

				for (i = 0; i < displayedProperties.length; i++) {
					propertyDescriptor = displayedProperties[i];
					propertyNameHash[propertyDescriptor.field] = true;
				}

				for (propertyName in propertyChanges) {
					if (propertyNameHash[propertyName]) {
						gridStore.setValue(storeItem, propertyName, propertyChanges[propertyName]);
					}
				}

				synchronizer.setScopeDirtyState();
			}
		}
	}
}

function onDataModelChangeItem(modelItem, changesInfo) {
	if (modelItem.itemType === ruleItemTypeName && changesInfo.property) {
		if (changesInfo.property.definition) {
			var dataModel = viewContext.data.dataModel;
			var selectedItems = dataModel.getSelection();

			modelItem.setItemProperty('string_notation', modelItem.deserializeExpressionToString({optionDeserializer: optionExpressionDeserializer}));

			if (selectedItems.length === 1 && selectedItems[0] === modelItem) {
				updateRuleTextRepresentation(modelItem);
			}
		}

		synchronizer.setScopeDirtyState();
	}
}

function onEditorGridDoubleClick(rowId, columnIndex) {
	if (viewEditMode) {
		var editorGrid = viewContext.controls.tableEditor;
		var gridWidget = editorGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
		var focusedGridView = editorGrid.focus_Experimental.grid.focus;

		if (focusedGridView) {
			let groupColumnDescriptor = focusedGridView.cell;
			var  normalizedColumnIndex = groupColumnDescriptor.index;

			if (rowId !== 'header_row' && !groupColumnDescriptor.fixed) {
				// get the new selected cell from the group of cells.
				const selectedCell = getMouseOverCellDivIndex() || 0;
				var gridStore = gridWidget.store;
				var storeItem = gridStore._itemsByIdentity[rowId];
				var rowIndex = gridWidget.getItemIndex(storeItem);
				let columnDescriptor = groupColumnDescriptor.children[selectedCell];
				var intersectionInfo = gridStore.getValue(storeItem, columnDescriptor.field);
				var currentConjunctionType = intersectionInfo && intersectionInfo.conjunctionType;

				if (!currentConjunctionType || (currentConjunctionType !== 'disabled' && currentConjunctionType !== 'multiple')) {
					var nextConjunctionType = intersectionInfo && intersectionInfo.ruleDeleted ? currentConjunctionType : getNextConjunctionType(currentConjunctionType);
					var ruleModelItem = setEditorCellConjunctionType(rowId, normalizedColumnIndex, nextConjunctionType);
					var dataModel = viewContext.data.dataModel;

					dataModel.setSelection(ruleModelItem);
					setEditorGridCellFocus(rowIndex, normalizedColumnIndex, selectedCell);
				}
			}
		}
	}
}

function onEditorGridSelectCell(selectedCell) {
	const selectedCellChildren = getMouseOverCellDivIndex() || 0;
	var dataModel = viewContext.data.dataModel;
	var gridWidget = this.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	var gridStore = gridWidget.store;
	var focusManager = gridWidget.focus;
	var storeItem = gridStore._arrayOfAllItems[focusManager.rowIndex];
	var modelItem = gridStore.getValue(storeItem, '_modelItem');
	let columnDescriptor;
	let intersectionInfo = {};
	var selectedRuleItems = [];
	// The intersection info of the selected cell from the group of cells.
	if (focusManager.cell.children) {
		columnDescriptor = focusManager.cell.children[selectedCellChildren];
	}
	else {
		columnDescriptor = focusManager.cell;
	}

	if (columnDescriptor) {
		intersectionInfo = gridStore.getValue(storeItem, columnDescriptor.field);
	}

	if (intersectionInfo && intersectionInfo.ruleId) {
		var ruleItemIds = Array.isArray(intersectionInfo.ruleId) ? intersectionInfo.ruleId : [intersectionInfo.ruleId];
		var ruleIdHash = {};
		var i;

		for (i = 0; i < ruleItemIds.length; i++) {
			ruleModelItem = dataModel.getItemById(ruleItemIds[i]);

			if (!ruleIdHash[ruleModelItem.uniqueId]) {
				ruleIdHash[ruleModelItem.uniqueId] = true;
				selectedRuleItems.push(ruleModelItem);
			}
		}
	}

	dataModel.setSelection(selectedRuleItems);

	this.selectedIntersection = {
		ruleId: intersectionInfo.ruleId,
		principalOptionId: columnDescriptor.field,
		constrainedOptionId: modelItem.itemId
	};

	selectIntersectionPair(this, this.selectedIntersection);
	const columnIndex = getEditorTableColumnIndexFromChildId(columnDescriptor.field)
	setEditorGridCellFocus(focusManager.rowIndex, columnIndex[0], selectedCellChildren);
}

function onRuleGridDataModelSelectionChanged(selectedItems) {
	if (!this.selectionHandling) {
		this.deselect();

		if (selectedItems.length) {
			var i;

			for (i = 0; i < selectedItems.length; i++) {
				this.setSelectedRow(selectedItems[i].id, true, true);
			}
		}
	}
}

function onEditorDataModelDeleteItem(modelItem) {
	var itemType = modelItem.itemType;

	if (itemType === ruleItemTypeName) {
		var editorGrid = viewContext.controls.tableEditor;
		var gridWidget = editorGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
		var gridStore = gridWidget.store;
		var gridStructure = gridWidget.layout.cells;
		var itemsByIdentity = gridStore._itemsByIdentity;
		var ruleModelItemId = modelItem.uniqueId;
		var isNewRule = modelItem.isNew();
		var storeItem;
		var uniqueId;
		var fieldDescriptor;
		var intersectionInfo;

		gridWidget.beginUpdate();

		for (uniqueId in itemsByIdentity) {
			storeItem = itemsByIdentity[uniqueId];

			for (i = 1; i < gridStructure.length; i++) {
				fieldDescriptor = gridStructure[i];
				if (!fieldDescriptor.fixed) {
					fieldDescriptor.children.forEach(itemDescriptor => {
						intersectionInfo = storeItem[itemDescriptor.field][0];
						if (intersectionInfo && intersectionInfo.ruleId === ruleModelItemId) {
							if (isNewRule) {
								intersectionInfo = '';
							} else {
								intersectionInfo.ruleDeleted = true;
							}

							gridStore.setValue(storeItem, itemDescriptor.field, intersectionInfo);
						}
					})
				}
			}
		}

		gridWidget.endUpdate();
	}
}

function onEditorDataModelSelectionChanged(selectedItems) {
	onEditorHighlightSelectedItems(selectedItems);
}

function onEditorHighlightSelectedItems(selectedItems) {
	var editorGrid = viewContext.controls.tableEditor;
	var gridWidget = editorGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	var gridStructure = (gridWidget.layout && gridWidget.layout.cells) || [];

	onEditorClearSelection();

	if (selectedItems.length && gridStructure.length) {
		var gridStore = gridWidget.store;
		var fixedColumnView = gridStructure[0].view;
		var itemsByIdentity = gridStore._itemsByIdentity;
		var ruleIdHash = {};
		var headerCellNodeHash = {};
		var fixedCellNodeHash = {};
		var gridView;
		var fieldDescriptor;
		var modelItem;
		var storeItem;
		var itemId;
		var intersectionInfo;
		var isFromSelectedRule;
		var rowIndex;
		var columnIndex;
		var cellNode;
		var specialCellNode;
		var idList;
		var i;
		var j;

		for (i = 0; i < selectedItems.length; i++) {
			modelItem = selectedItems[i];

			if (modelItem.itemType === ruleItemTypeName) {
				ruleIdHash[modelItem.id] = modelItem;
			}
		}

		// styling table editor header cells using rule principal options
		for (itemId in ruleIdHash) {
			modelItem = ruleIdHash[itemId];
			idList = modelItem.getConditionOptions();

			for (i = 0; i < idList.length; i++) {
				itemId = idList[i];

				if (!headerCellNodeHash[itemId]) {
					columnIndex = getEditorTableColumnIndexFromChildId(itemId);

					if (columnIndex[0] > -1) {
						fieldDescriptor = gridStructure[columnIndex[0]];
						gridView = fieldDescriptor.view;

						specialCellNode = gridView.getHeaderCellNode(columnIndex[0]);
						specialCellNode.firstElementChild.children[columnIndex[1]+1].classList.add('selectedHeaderCell');
					}

					headerCellNodeHash[itemId] = true;
				}
			}
		}

		// styling table editor cells using intersectioninfo
		for (itemId in itemsByIdentity) {
			storeItem = itemsByIdentity[itemId];
			rowIndex = gridWidget.getItemIndex(storeItem);

			for (i = 1; i < gridStructure.length; i++) {
				fieldDescriptor = gridStructure[i];
				fieldDescriptor.children.forEach((itemDescriptor,index) => {
					intersectionInfo = storeItem[itemDescriptor.field][0];
					if (intersectionInfo) {
						if (intersectionInfo.conjunctionType === 'multiple') {
							idList = intersectionInfo.ruleId;
							isFromSelectedRule = false;

							for (j = 0; j < idList.length; j++) {
								if (ruleIdHash[idList[j]]) {
									isFromSelectedRule = true;
									break;
								}
							}
						} else {
							isFromSelectedRule = ruleIdHash[intersectionInfo.ruleId];
						}

						if (isFromSelectedRule) {
							intersectionInfo.selected = 'selected';
							storeItem._isHighlighted[0] = true;
						} else {
							intersectionInfo.selected = 'unselected';
						}

						// if row currently rendered
						if (rowIndex > -1) {
							cellNode = fieldDescriptor.view.getCellNode(rowIndex, i);
							cellNode = cellNode.firstElementChild.children[index].firstElementChild;
							if (isFromSelectedRule) {
								if (!fixedCellNodeHash[itemId]) {
									specialCellNode = fixedColumnView.getRowNode(rowIndex);

									if (specialCellNode) {
										specialCellNode.classList.add('highlightedRow');
									}

									fixedCellNodeHash[itemId] = specialCellNode || true;
								}

								cellNode.classList.add('selectedStatusCell');
							} else {
								cellNode.classList.add('unselectedStatusCell');
							}
						}
					}
				})
			}
		}
	}
}

function getEditorTableColumnIndexFromChildId(itemId) {
	// function to get the index of the position of the cell in group layout structure.
	let columnIndex = -1;
	let itemPosition = -1;
	const editorGrid = viewContext.controls.tableEditor;
	const gridWidget = editorGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	const gridStructure = (gridWidget.layout && gridWidget.layout.cells) || [];
	let GroupColumnDescriptor;
	let i;

	columnIndex = editorGrid.getColumnIndex(itemId);
	if (columnIndex < 0) {
		for (i = 0; i < gridStructure.length; i++) {
			GroupColumnDescriptor = gridStructure[i]
			if (!GroupColumnDescriptor.fixed) {
				GroupColumnDescriptor.children.forEach((itemDescriptor, index) => {
					if (itemId === itemDescriptor.field) {
						columnIndex = i;
						itemPosition = index;
					}
				})
			}
		}
	}
	return [columnIndex, itemPosition];
}

function onEditorClearSelection() {
	var editorGrid = viewContext.controls.tableEditor;
	var gridWidget = editorGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers

	if (gridWidget.viewsNode) {
		var cleanupViewCssClasses = ['selectedStatusCell', 'unselectedStatusCell', 'highlightedRow'];
		var cleanupHeaderCssClasses = ['selectedHeaderCell'];
		var gridStore = gridWidget.store;
		var gridStructure = gridWidget.layout.cells;
		var itemsByIdentity = gridStore._itemsByIdentity;
		var dirtyDomNodes;
		var fieldDescriptor;
		var intersectionInfo;
		var currentCssClass;
		var storeItem;
		var itemId;
		var i;
		var j;

		for (i = 0; i < cleanupViewCssClasses.length; i++) {
			currentCssClass = cleanupViewCssClasses[i];
			dirtyDomNodes = gridWidget.viewsNode.querySelectorAll('.' + currentCssClass);

			for (j = 0; j < dirtyDomNodes.length; j++) {
				dirtyDomNodes[j].classList.remove(currentCssClass);
			}
		}

		for (i = 0; i < cleanupHeaderCssClasses.length; i++) {
			currentCssClass = cleanupHeaderCssClasses[i];
			dirtyDomNodes = gridWidget.viewsHeaderNode.querySelectorAll('.' + currentCssClass);

			for (j = 0; j < dirtyDomNodes.length; j++) {
				dirtyDomNodes[j].classList.remove(currentCssClass);
			}
		}

		for (itemId in itemsByIdentity) {
			storeItem = itemsByIdentity[itemId];

			for (i = 1; i < gridStructure.length; i++) {
				fieldDescriptor = gridStructure[i];
				if (!fieldDescriptor.fixed) {
					fieldDescriptor.children.forEach(itemDescriptor => {
						intersectionInfo = storeItem[itemDescriptor.field][0];
						if (intersectionInfo) {
							intersectionInfo.selected = '';
						}
					})
				}
				else {
					intersectionInfo = storeItem[fieldDescriptor.field][0];
					if (intersectionInfo) {
						intersectionInfo.selected = '';
					}
				}
			}

			storeItem._isHighlighted[0] = false;
		}
	}
}

function onRuleGridRowSelect(rowId, columnIndex) {
	if (!this.selectionHandling) {
		var selectedItemIds = this.getSelectedItemIds();
		var dataModel = viewContext.data.dataModel;
		var selectedModelItems = [];
		var ruleModelItem;
		var i;

		this.selectionHandling = true;

		for (i = 0; i < selectedItemIds.length; i++) {
			ruleModelItem = dataModel.getItemById(selectedItemIds[i]);

			if (ruleModelItem) {
				selectedModelItems.push(ruleModelItem);
			}
		}

		if (selectedModelItems.length) {
			dataModel.setSelection(selectedModelItems);
		}

		this.selectionHandling = false;
	}
}

function onEditorGridCellMouseOver(mouseEvent) {
	var columnDescriptor;
	let groupColumnDescriptor = mouseEvent.cell;
	const selectedCell = getMouseOverCellDivIndex() || 0;
	var storeItem = this.getItem(mouseEvent.rowIndex);
	var modelItem = this.store.getValue(storeItem, '_modelItem');
	var intersectionInfo = {};

	if (groupColumnDescriptor.children && groupColumnDescriptor.children.length) {
		columnDescriptor = groupColumnDescriptor.children[selectedCell];
	}
	else {
		columnDescriptor = groupColumnDescriptor;
	}

	if (columnDescriptor) {
		intersectionInfo = this.store.getValue(storeItem, columnDescriptor.field);
	}
 
	selectIntersectionPair(viewContext.controls.tableEditor, {
		ruleId: intersectionInfo.ruleId,
		principalOptionId: columnDescriptor.field,
		constrainedOptionId: modelItem.itemId
	});
}

function selectIntersectionPair(sourceControl, intersectionInfo) {
	var dataModel = viewContext.data.dataModel;

	dataModel.raiseEvent('onSelectIntersectionPair', sourceControl, intersectionInfo);
}

function onRuleGridMenuInit(rowId, columnIndex) {
	var ruleGrid = viewContext.controls.ruleGrid;
	var gridWidget = ruleGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	var gridStore = gridWidget.store;
	var storeItem = gridStore._itemsByIdentity[rowId];
	var menuItems = getRuleGridMenuItems(storeItem);

	if (menuItems.length) {
		var menuWidget = ruleGrid.getMenu();

		menuWidget.removeAll();
		menuWidget.addRange(menuItems);
	} else {
		return false;
	}
}

function setTableEditorColumnLayout(layoutType) {
	if (viewContext.editorColumnLayout !== layoutType) {
		viewContext.editorColumnLayout = layoutType;

		reloadEditorGridLayout();
	}
}

function onEditorGridMenuInit(rowId, columnIndex) {
	var editorGrid = viewContext.controls.tableEditor;
	var gridWidget = editorGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	var menuItems = [];
	var columnDescriptor;
	var menuWidget;

	switch (rowId) {
		case 'header_row':
			columnDescriptor = gridWidget.layout.cells[columnIndex];

			menuWidget = editorGrid.getHeaderMenu_Experimental(); // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
			menuItems.push({
				id: 'cellwidth:fixed',
				name: 'Fixed Column Width',
				checked: viewContext.editorColumnLayout === 'fixed'
			}, {
				id: 'cellwidth:flexible',
				name: 'Flexible Column Width',
				checked: viewContext.editorColumnLayout === 'flexible'
			});
			break;
		default:
			var focusedGridView = editorGrid.focus_Experimental.grid.focus;

			if (focusedGridView) {
				columnDescriptor = focusedGridView.cell;

				if (!columnDescriptor.fixed) {
					var gridStore = gridWidget.store;
					var storeItem = gridStore._itemsByIdentity[rowId];
					var selectedCell = getMouseOverCellDivIndex() || 0;
					var columnName = columnDescriptor.children[selectedCell].field;

					menuWidget = editorGrid.getMenu();
					menuItems = getEditorMenuItems(storeItem, columnName);
				}
			}
			break;
	}

	if (menuWidget && menuItems.length) {
		menuWidget.removeAll();
		menuWidget.addRange(menuItems);

		gridWidget._activeMenuParameters = {
			widget: menuWidget,
			columnIndex: columnDescriptor.index
		};

		return true;
	}

	return false;
}

function onRuleGridMenuClick(commandId, rowId, columnIndex) {
	var dataModel = viewContext.data.dataModel;
	var modelItem = dataModel.getItemById(rowId);
	var selectedItems = dataModel.getSelection();
	var i;

	switch (commandId) {
		case 'deleteitem':
			for (i = 0; i < selectedItems.length; i++) {
				dataModel.deleteItemWithRelationships(selectedItems[i]);
			}

			this.deselect();
			updateViewToolbarState();
			break;
		case 'buildtable':
			buildTableForRules(selectedItems);
			break;
		case 'showintexteditor':
			viewsController.onItemLinkClicked(ruleItemTypeName, {itemId: modelItem.itemId});
			break;
		default:
			break;
	}
}

function buildTableForRules(ruleModelItems) {
	ruleModelItems = ruleModelItems ? (Array.isArray(ruleModelItems) ? ruleModelItems : [ruleModelItems]) : [];

	if (ruleModelItems.length) {
		var familyTree = viewContext.controls.familyTree;
		var aggregatedDataModel = viewContext.data.aggregatedDataModel;
		var itemGroupInfo = [];
		var groupInfo;
		var optionIds;
		var modelItem;
		var optionModelItem;
		var i;
		var j;

		clearDataModelItemGroups(aggregatedDataModel);

		for (i = 0; i < ruleModelItems.length; i++) {
			modelItem = ruleModelItems[i];

			optionIds = modelItem.getConditionOptions();
			for (j = 0; j < optionIds.length; j++) {
				itemGroupInfo.push({itemId: optionIds[j], group: 'principal'});
			}

			optionIds = modelItem.getConsequenceOptions();
			for (j = 0; j < optionIds.length; j++) {
				itemGroupInfo.push({itemId: optionIds[j], group: 'constrained'});
			}
		}

		for (i = 0; i < itemGroupInfo.length; i++) {
			groupInfo = itemGroupInfo[i];
			optionModelItem = aggregatedDataModel.getItemsByItemId(groupInfo.itemId);
			optionModelItem = optionModelItem.length && optionModelItem[0];

			if (optionModelItem && optionModelItem.setItemGroup) {
				optionModelItem.setItemGroup(groupInfo.group, {skipRecursive: true, suppressEvent: true});
				optionModelItem.parent.setItemGroup(groupInfo.group, {skipRecursive: true, suppressEvent: true});
			}
		}

		familyTree.gridWidget.render();
		onItemGroupChangeHandler();
	}
}

function getNextConjunctionType(conjunctionType) {
	switch (conjunctionType) {
		case 'include':
			return 'exclude';
		case 'exclude':
			return '';
		default:
			return 'include';
	}
}

function buildRuleExpression(conditionVariableId, conditionNamedConstantId, consequenceVariableId, consequenceNamedConstantId, conjunctionType) {
	const isExcludeExpression = conjunctionType === 'exclude';
	const expressionTemplate = '<EQ><variable id="{0}"></variable><named-constant id="{1}"></named-constant></EQ>';
	const excludeExpressionTemplate = '<NOT>' + expressionTemplate + '</NOT>';

	return '<expression>' +
				'<IMPLICATION>' +
					'<CONDITION>' + expressionTemplate.replace('{0}', conditionVariableId).replace('{1}', conditionNamedConstantId) + '</CONDITION>' +
					'<CONSEQUENCE>' +
							(isExcludeExpression ? excludeExpressionTemplate : expressionTemplate).replace('{0}', consequenceVariableId).replace('{1}', consequenceNamedConstantId) +
					'</CONSEQUENCE>' +
				'</IMPLICATION>' +
			'</expression>';
}

function setEditorCellConjunctionType(rowId, columnIndex, conjunctionType) {
	const dataModel = viewContext.data.dataModel;
	const aggregatedDataModel = viewContext.data.aggregatedDataModel;
	const tableEditor = viewContext.controls.tableEditor;
	const gridWidget = tableEditor.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	const gridStore = gridWidget.store;
	const storeItem = gridStore._itemsByIdentity[rowId];
	const groupColumnDescriptor = gridWidget.layout.cells[columnIndex];
	const selectedCell = getMouseOverCellDivIndex() || 0;
	const principalOptionModelItem = groupColumnDescriptor.children[selectedCell]._modelItem;
	const constrainedOptionModelItem = gridStore.getValue(storeItem, '_modelItem');

	const principalFeatureId = principalOptionModelItem.parent.itemId;
	const principalOptionId = principalOptionModelItem.itemId;
	const constrainedFeatureId = constrainedOptionModelItem.parent.itemId;
	const constrainedOptionId = constrainedOptionModelItem.itemId;

	let ruleModelItem;

	switch (conjunctionType) {
		case '':
			const intersectionInfo = gridStore.getValue(storeItem, principalOptionId);

			ruleModelItem = dataModel.getItemById(intersectionInfo.ruleId);

			if (ruleModelItem) {
				removeConsequenceOption(ruleModelItem, constrainedFeatureId, constrainedOptionId);
				gridStore.setValue(storeItem, principalOptionId, '');
			}
			break;
		default:
			const constrainedOption = aggregatedDataModel.getItemsByItemId(constrainedOptionId)[0];

			if (constrainedOption) {
				const oldIntersectionInfo = gridStore.getValue(storeItem, principalOptionId);

				ruleModelItem = getRuleItemsByIntersectionInfo({
					principalOption: principalOptionId,
					conjunctionType: conjunctionType
				}, viewContext.data.activeRuleItems);

				ruleModelItem = ruleModelItem.length && ruleModelItem[0];

				if (!ruleModelItem) {
					const scopeModelItem = dataModel.getItemsByParameters({itemType: 'vm_VariabilityItem'})[0];

					ruleModelItem = dataModel.createNewModelItem(ruleItemTypeName, {
						modelItemProperties: {
							isActive: true
						},
						itemProperties: {
							'definition': buildRuleExpression(principalFeatureId, principalOptionId, constrainedFeatureId, constrainedOptionId, conjunctionType)
						}
					});

					scopeModelItem.addChild(ruleModelItem);
				} else {
					if (ruleModelItem.isDeleted()) {
						ruleModelItem.setItemAttribute('action', 'edit', {forceUpdate: true});
						ruleModelItem.setItemAttributeSilent('action', 'edit', {forceUpdate: true, itemNode: ruleModelItem.getRelationshipNode()});
					}

					addConsequenceOption(ruleModelItem, constrainedFeatureId, constrainedOptionId);
				}

				if (oldIntersectionInfo && oldIntersectionInfo.ruleId !== ruleModelItem.id) {
					const oldRuleItem = dataModel.getItemById(oldIntersectionInfo.ruleId);

					removeConsequenceOption(oldRuleItem, constrainedFeatureId, constrainedOptionId);
				}

				gridStore.setValue(storeItem, principalOptionId, {
					conjunctionType: conjunctionType,
					ruleId: ruleModelItem.id,
					_type: 'intersectionInfo'
				});

				gridWidget.endUpdate();
			}
			break;
	}

	return ruleModelItem;
}

function addConsequenceOption(targetRuleItem, familyId, optionId) {
	if (targetRuleItem && optionId) {
		var expressionTree = targetRuleItem.getExpressionTree();
		var consequenceExpression = expressionTree && expressionTree.consequence;

		if (consequenceExpression) {
			var optionItemsHash = viewContext.data.optionItemsHash;
			var optionHashInfo = optionItemsHash[optionId + familyId];
			var optionExpressionNodes = targetRuleItem.getConsequenceExpressionNodes('named-constant');
			var requiredFamilyId = optionHashInfo.familyId;
			var newOptionNode = {type: 'named-constant', itemId: optionId};
			var newFamilyNode = {type: 'variable', itemId: requiredFamilyId};
			var newEQNode = {type: 'operation', parent: parentExpressionNode, operator: 'EQ', operands: [newFamilyNode, newOptionNode]};
			var isExludeRule = targetRuleItem.isExcludeExpression();
			var parentExpressionNode;
			var currentOptionNode;
			var optionNode;
			var newParentNode;
			var i;

			// searching for existing same family options
			for (i = 0; i < optionExpressionNodes.length; i++) {
				currentOptionNode = optionExpressionNodes[i];
				optionHashInfo = optionItemsHash[currentOptionNode.itemId + currentOptionNode.parent.operands[0].itemId];

				if (optionHashInfo.familyId === requiredFamilyId) {
					optionNode = currentOptionNode;
					break;
				}
			}

			// if same family option was found
			if (optionNode) {
				var eqNode = optionNode.parent;
				parentExpressionNode = eqNode.parent;

				if (parentExpressionNode) {
					switch (parentExpressionNode.operator) {
						case 'OR':
							parentExpressionNode.operands.push(newEQNode);
							newEQNode.parent = parentExpressionNode;
							break;
						default:
							var operandIndex = parentExpressionNode.operands.indexOf(eqNode);
							newParentNode = {type: 'operation', parent: parentExpressionNode, operator: 'OR', operands: [eqNode, newEQNode]};
							optionNode.parent = newParentNode;
							newEQNode.parent = newParentNode;

							parentExpressionNode.operands.splice(operandIndex, 1, newParentNode);
							break;
					}
				}
			} else {
				parentExpressionNode = consequenceExpression.operands[0];

				if (parentExpressionNode) {
					// if rule type is 'exclude', then first child of consequenceExpression will be 'NOT'
					var fixedExpressionNode = isExludeRule ? parentExpressionNode : consequenceExpression;

					parentExpressionNode = isExludeRule ? parentExpressionNode.operands[0] : parentExpressionNode;

					if (parentExpressionNode) {
						switch (parentExpressionNode.operator) {
							case 'AND':
								parentExpressionNode.operands.push(newEQNode);
								newEQNode.parent = parentExpressionNode;
								break;
							default:
								newParentNode = {type: 'operation', parent: fixedExpressionNode, operator: 'AND', operands: [parentExpressionNode, newEQNode]};
								parentExpressionNode.parent = newParentNode;
								newEQNode.parent = newParentNode;

								fixedExpressionNode.operands = [newParentNode];
								break;
						}
					} else {
						fixedExpressionNode.operands.push(newEQNode);
						newEQNode.parent = fixedExpressionNode;
					}
				} else {
					consequenceExpression.operands.push(newEQNode);
					newEQNode.parent = consequenceExpression;
				}
			}

			targetRuleItem.serializeExpression();
		}
	}
}

function removeConsequenceOption(targetRuleItem, featureId, optionId) {
	const optionExpressionNodes = targetRuleItem.getConsequenceExpressionNodes('named-constant');
	const relevantFeatureOperandFinder = operand => operand.type === 'variable' && operand.itemId === featureId;

	// searching for existing option node
	for (let i = 0; i < optionExpressionNodes.length; i++) {
		const optionNode = optionExpressionNodes[i];
		const eqNode = optionNode.parent;

		const isFeatureOptionPairFound = optionNode.itemId === optionId && eqNode.operands.some(relevantFeatureOperandFinder);

		if (isFeatureOptionPairFound) {
			const parentExpressionNode = eqNode.parent;

			switch (parentExpressionNode.operator) {
				case 'CONSEQUENCE':
				case 'NOT':
					const dataModel = viewContext.data.dataModel;

					parentExpressionNode.operands = [];
					dataModel.deleteItem(targetRuleItem);
					break;
				case 'OR':
				case 'AND':
					const relatedOperands = parentExpressionNode.operands;

					let operandIndex = relatedOperands.indexOf(eqNode);
					relatedOperands.splice(operandIndex, 1);

					if (relatedOperands.length === 1) {
						const grandParentNode = parentExpressionNode.parent;

						operandIndex = grandParentNode.operands.indexOf(parentExpressionNode);
						grandParentNode.operands.splice(operandIndex, 1, relatedOperands[0]);

						relatedOperands[0].parent = grandParentNode;
					}
					break;
				default:
					break;
			}

			targetRuleItem.serializeExpression();
			break;
		}
	}
}

function onEditorGridMenuClick(commandId, rowId, columnIndex) {
	var dataModel = viewContext.data.dataModel;
	var commandParts = commandId.split(':');
	var commandName = commandParts[0];
	var commandArgument = commandParts.length > 1 ? commandParts[1] : '';
	var gridWidget = this.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	var menuParameters = gridWidget._activeMenuParameters;

	switch (commandName) {
		case 'setconjunctiontype':
			var ruleModelItem = setEditorCellConjunctionType(rowId, menuParameters.columnIndex, commandArgument);

			dataModel.setSelection(ruleModelItem);
			break;
		case 'clearconjunctiontype':
			setEditorCellConjunctionType(rowId, menuParameters.columnIndex, '');
			break;
		case 'cellwidth':
			setTableEditorColumnLayout(commandArgument);
			break;
	}
}

function getRuleGridMenuItems(storeItem) {
	var menuItems = [];

	if (storeItem) {
		var dataModel = viewContext.data.dataModel;
		var modelItem = dataModel.getItemById(storeItem.uniqueId[0]);
		var ruleGrid = viewContext.controls.ruleGrid;
		var selectedItemIds = ruleGrid.getSelectedItemIds();
		var isSingleItem = selectedItemIds.length === 1;

		if (viewEditMode) {
			menuItems.push({id: 'deleteitem', name: 'Delete Item'});
		}

		if (selectedItemIds.length) {
			menuItems.push({id: 'buildtable', name: 'Build Table On Rules'});
		}

		if (isSingleItem) {
			menuItems.push({separator: true});
			menuItems.push({id: 'showintexteditor', name: 'Show in Text Rule Editor'});
		}
	}

	return menuItems;
}

function getEditorMenuItems(storeItem, columnName) {
	var menuItems = [];

	if (viewEditMode) {
		var gridWidget = viewContext.controls.tableEditor;
		var gridStore = gridWidget.grid_Experimental.store; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
		var intersectionInfo = gridStore.getValue(storeItem, columnName);
		var isRuleDeleted = intersectionInfo && intersectionInfo.ruleDeleted;
		var conjunctionType = intersectionInfo && intersectionInfo.conjunctionType;

		if (conjunctionType !== 'disabled' && conjunctionType !== 'multiple') {
			var conjunctionTypes = [{type: 'include', iconClass: 'includeIcon', label: 'Include'}, {type: 'exclude', iconClass: 'excludeIcon', label: 'Exclude'}];
			var i;

			for (i = 0; i < conjunctionTypes.length; i++) {
				typeDescriptor = conjunctionTypes[i];

				if (isRuleDeleted ? typeDescriptor.type === conjunctionType : typeDescriptor.type !== conjunctionType) {
					menuItems.push({
						id: 'setconjunctiontype:' + typeDescriptor.type,
						name: typeDescriptor.label,
						iconClass: 'menuItemIcon ' + (typeDescriptor.iconClass || '')
					});
				}
			}

			if (conjunctionType) {
				menuItems.push({
					id: 'clearconjunctiontype',
					name: 'Clear Status'
				});
			}
		}
	}

	return menuItems;
}

function onExecuteGridAction(actionName, actionArguments, storeItem) {
	var familyTree = viewContext.controls.familyTree;
	var gridStore = familyTree.gridWidget.store;
	var modelItem = gridStore.getValue(storeItem, 'modelItem');

	switch (actionName) {
		case 'setGroup':
			modelItem.setItemGroup(actionArguments);
			this.gridContainer.updateRenderedRows();
			break;
		case 'removeGroup':
			modelItem.removeItemGroup(actionArguments);
			this.gridContainer.updateRenderedRows();
			break;
		default:
			break;
	}
}

function filterActiveRuleItems() {
	var aggregatedDataModel = viewContext.data.aggregatedDataModel;
	var validRuleItems = viewContext.data.validRuleItems;
	var familyItems = aggregatedDataModel.getItemsByParameters({itemType: 'Variable'});
	var groupOptionsHash = {principal: {}, constrained: {}};
	var expressionTree;
	var childOptionItems;
	var conditionOperand;
	var modelItem;
	var groupHash;
	var groupName;
	var groupNames;
	var i;
	var j;
	var k;

	for (i = 0; i < familyItems.length; i++) {
		modelItem = familyItems[i];
		groupNames = modelItem.getItemGroups();

		if (groupNames.length) {
			for (j = 0; j < groupNames.length; j++) {
				groupName = groupNames[j];
				childOptionItems = modelItem.getChildrenByGroup(groupName);
				groupHash = groupOptionsHash[groupName] || (groupOptionsHash[groupName] = {});

				for (k = 0; k < childOptionItems.length; k++) {
					groupHash[childOptionItems[k].itemId + childOptionItems[k].parent.itemId] = true;
				}
			}
		}
	}

	for (i = 0; i < validRuleItems.length; i++) {
		modelItem = validRuleItems[i];
		expressionTree = modelItem.getExpressionTree();
		// get root EQ node
		var eqOperand = expressionTree.condition.operands[0];
		// get variable node
		var variableOperand = eqOperand.operands[0];
		// get named-constant node
		conditionOperand = eqOperand.operands[1];

		modelItem.isActive = Boolean(groupOptionsHash.principal[conditionOperand.itemId + variableOperand.itemId]);
	}

	viewContext.data.groupOptionsHash = groupOptionsHash;
	viewContext.data.activeRuleItems = validRuleItems.filter(function(ruleItem) {return ruleItem.isActive;});
}

function onItemGroupChangeHandler(dataKey, modelData) {
	var dataModel = viewContext.data.dataModel;
	var currentSelection = dataModel.getSelection();

	filterActiveRuleItems();

	reloadRuleGridData();
	setEditorGridLayout();
	reloadEditorGridData();
	reloadEditorGridLayout();

	if (currentSelection.length) {
		dataModel.setSelection(currentSelection, {forceSelection: true});
	}
}

function renderEditorLegend() {
	var renderUtils = viewContext.modules.RenderUtils;
	var legendItemDescriptors = {
			include: {
				description: '- Include',
				iconClass: 'includeStatus'
			},
			exclude: {
				description: '- Exclude',
				iconClass: 'excludeStatus'
			},
			disabled: {
				description: '- Disabled',
				iconClass: 'disabledStatus'
			},
			multiple: {
				description: '- Multiple',
				iconClass: 'multipleStatus'
			}
		};
	var legendHTML = '';
	var itemHTML;
	var itemDescriptor;
	var descriptorName;

	for (descriptorName in legendItemDescriptors) {
		itemDescriptor = legendItemDescriptors[descriptorName];
		itemHTML = renderUtils.HTML.wrapInTag('', 'div', {class: 'legendItemIcon ' + itemDescriptor.iconClass}) +
			renderUtils.HTML.wrapInTag(itemDescriptor.description, 'span');
		legendHTML += renderUtils.HTML.wrapInTag(itemHTML, 'div', {class: 'legendItem'});
	}

	legendHTML += renderUtils.HTML.wrapInTag('Legend', 'div', {class: 'legendIcon'});

	legendHTML += renderUtils.HTML.wrapInTag('', 'div', {class: 'verticalGroupName'});
	legendHTML += renderUtils.HTML.wrapInTag('', 'div', {class: 'horizontalGroupName'});

	legendHTML = renderUtils.HTML.wrapInTag(legendHTML, 'div', {class: 'editorLegend'});

	return '\u00A0' + legendHTML;
}

function createEditorGridLayout(optionalParameters) {
	var aggregatedDataModel = viewContext.data.aggregatedDataModel;
	var principalOptions = aggregatedDataModel.getItemsByParameters({group: 'principal', itemType: 'NamedConstant'});
	var resultLayout = [];

	optionalParameters = optionalParameters || {};

	if (principalOptions.length) {
		var cellWidthType = optionalParameters.cellWidthType || 'fixed';
		var intersectionDataColumns = [];
		var currentDescriptor;
		var parentId;
		var modelItem;
		var i;
		let groupDescriptor;

		// create fixed noscrollable column descriptor (column contains constrained options names)
		resultLayout.push({
			noscroll: true,
			cells: [[{
				field: '_constrainedOption',
				name: '_constrainedOption',
				editable: false,
				fixed: true,
				draggable: false,
				cellClasses: 'fixedCell',
				width: '120px',
				formatter: tableEditorFixedCellRenderer
			}]]
		});

		// create intersection data columns descriptors
		for (i = 0; i < principalOptions.length; i++) {
			modelItem = principalOptions[i];

			isFirstOption = !parentId || parentId !== modelItem.parent.itemId;

			if (isFirstOption) {
				parentId = isFirstOption ? modelItem.parent.itemId : parentId;

				if (currentDescriptor) {
					currentDescriptor._lastGroupItem = true;
				}
				// new design for group column descriptor.
				groupDescriptor = {
					field: parentId,
					name: modelItem.parent.getItemProperty('name'),
					draggable: true,
					styles: 'text-align: center; padding: 0px 0px !important;',
					width: cellWidthType === 'flexible' ? '100%' : getEditortGridColumnWidth(parentId, principalOptions) + 'px',
					_modelItem: modelItem.parent,
					children: [],
					_firstGroupItem: isFirstOption,
					formatter: tableEditorGroupCellRenderer
				}
			}
			currentDescriptor = {
				field: modelItem.itemId,
				name: modelItem.getItemProperty('name'),
				draggable: true,
				styles: 'text-align: center;',
				width: cellWidthType === 'flexible' ? '100%' : viewContext.editorColumnFixedWidth + 'px',
				_modelItem: modelItem,
				_firstGroupItem: isFirstOption,
				formatter: tableEditorCellRenderer
			};
			groupDescriptor.children.push(currentDescriptor)
			if (isFirstOption) {
				intersectionDataColumns.push(groupDescriptor);
			}
		}

		if (currentDescriptor) {
			currentDescriptor._lastGroupItem = true;
		}

		resultLayout.push({cells: [intersectionDataColumns]});
	}

	return resultLayout;
}

function getEditortGridColumnWidth(parentId, principalOptions) {
	// function to get the widht of the group column based on chield.
	let childCount = 0;
	let i;
	for (i = 0; i < principalOptions.length; i++) {
		if (parentId == principalOptions[i].parent.itemId) {
			childCount++;
		}
	}
	return childCount * viewContext.editorColumnFixedWidth;
}
function createRuleGridLayout(itemTypeName) {
	var ruleItemType = aras.getItemTypeDictionary(itemTypeName);
	var visibleItemTypeProperties = aras.getvisiblePropsForItemType(ruleItemType.node);
	var itemTypeId = ruleItemType.getID();
	var visiblePropertiesHash = {};
	var resultLayout = [{
		field: '_itemAction',
		name: ' ',
		width: '32px',
		styles: 'text-align: center;'
	}];
	var propertyNode;
	var columnWidths;
	var columnOrder;
	var propertyName;
	var i;

	for (i = 0; i < visibleItemTypeProperties.length; i++) {
		propertyNode = visibleItemTypeProperties[i];
		propertyName = aras.getItemProperty(propertyNode, 'name');
		visiblePropertiesHash[propertyName] = propertyNode;
	}

	aras.uiInitItemsGridSetups(ruleItemType.node, visibleItemTypeProperties);

	columnWidths = aras.getPreferenceItemProperty('Core_ItemGridLayout', itemTypeId, 'col_widths').split(';');
	columnOrder = aras.getPreferenceItemProperty('Core_ItemGridLayout', itemTypeId, 'col_order').split(';');

	if (columnOrder.length === columnWidths.length) {
		var dataType;
		var isReadonly;

		for (i = 0; i < columnOrder.length; i++) {
			propertyName = columnOrder[i];

			if (propertyName.substr(-2) === '_D') {
				propertyName = propertyName.substring(0, propertyName.length - 2);

				if (visiblePropertiesHash[propertyName]) {
					propertyNode = visiblePropertiesHash[propertyName];
					dataType = aras.getItemProperty(propertyNode, 'data_type');
					isReadonly = aras.getItemProperty(propertyNode, 'readonly') === '1';

					resultLayout.push({
						field: propertyName,
						editable: !isReadonly,
						name: propertyName === 'definition' ? 'Rule Expression' : aras.getItemProperty(propertyNode, 'label'),
						width: columnWidths[i] + 'px',
						styles: 'text-align: left;',
						headerStyles: 'text-align: center;'
					});
				}
			}
		}
	}

	return resultLayout;
}

function clearFamilyTreeSelection() {
	var familyTree = viewContext.controls.familyTree;

	clearDataModelItemGroups(viewContext.data.aggregatedDataModel);
	familyTree.gridWidget.render();
	onItemGroupChangeHandler();
}

function onEditorDataModelIntersectionSelect(sourceControl, intersectionInfo) {
	if (sourceControl !== this) {
		var selectedIntersection = this.selectedIntersection || {};
		var isSelectionChanged = false;
		var infoProperty;

		for (infoProperty in intersectionInfo) {
			if (selectedIntersection[infoProperty] !== intersectionInfo[infoProperty]) {
				isSelectionChanged = true;
				break;
			}
		}

		if (isSelectionChanged) {
			var aggregatedDataModel = viewContext.data.aggregatedDataModel;
			var optionModelItem = aggregatedDataModel.getItemsByItemId(intersectionInfo.constrainedOptionId);

			if (optionModelItem.length) {
				var rowIndex = this.getRowIndex(optionModelItem[0].uniqueId);
				var columnIndex = getEditorTableColumnIndexFromChildId(intersectionInfo.principalOptionId);
				var gridWidget = this.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers

				if (rowIndex === -1) {
					rowIndex = this._getRowIndexFromStore(optionModelItem[0].uniqueId);
					gridWidget.scrollToRow(rowIndex);
				}

				this.selectedIntersection = intersectionInfo;
				setEditorGridCellFocus(rowIndex, columnIndex[0], columnIndex[1]);
			}
		}
	}
}

function onRepresentationDataModelIntersectionSelect(sourceControl, intersectionInfo) {
	var representationPanel = viewContext.layoutControls.ruleTextRepresentation;

	if (representationPanel.ruleId) {
		var selectedOptionNode = representationPanel.domNode.querySelector('.selectedOption');
		var intersectionRuleIds = Array.isArray(intersectionInfo.ruleId) ? intersectionInfo.ruleId : [intersectionInfo.ruleId];
		var isRuleRepresented =  intersectionRuleIds.indexOf(representationPanel.ruleId) > -1;

		if (selectedOptionNode) {
			selectedOptionNode.classList.remove('selectedOption');
		}

		if (isRuleRepresented) {
			selectedOptionNode = representationPanel.domNode.querySelector('.constrainedOption[optionId="' + intersectionInfo.constrainedOptionId + '"]');

			if (selectedOptionNode) {
				selectedOptionNode.classList.add('selectedOption');
			}
		}
	}
}

function clearDataModelItemGroups(targetDataModel) {
	if (targetDataModel) {
		var dataModelItems = targetDataModel.getAllItems();
		var modelItem;
		var i;

		for (i = 0; i < dataModelItems.length; i++) {
			modelItem = dataModelItems[i];

			if (modelItem.getItemGroups) {
				modelItem.removeAllItemGroups({skipRecursive: true, suppressEvent: true});
			}
		}
	}
}

function onBeforeUnload() {
	window.removeEventListener('beforeunload', onBeforeUnload);
	viewContext.data.dataModel.removeEventListeners(window);
}

function stopEvent(targetEvent) {
	targetEvent.stopPropagation();
	targetEvent.preventDefault();
}

function onEditorToolbarButtonClick(targetButton) {
	var actionId = targetButton.getId();
	var dataModel = viewContext.data.dataModel;
	var layoutControl;

	switch (actionId) {
		case 'family_list':
			layoutControl = viewContext.layoutControls.familyListContainer;
			layoutControl.isVisible = !layoutControl.isVisible;

			layoutViewControls();
			break;
		case 'family_expandall':
			layoutControl = viewContext.controls.familyTree.gridWidget;

			// opacity switching is used to reduce flashing, which appears during grid expandAll/resize
			layoutControl.domNode.style.opacity = '0.01';
			layoutControl.expandAll();
			layoutControl.render();
			layoutControl.domNode.style.opacity = '1';
			break;
		case 'family_collapseall':
			layoutControl = viewContext.controls.familyTree.gridWidget;
			layoutControl.collapseAll();
			break;
		case 'clear_family_list':
			clearFamilyTreeSelection();
			break;
		case 'rule_list':
			layoutControl = viewContext.layoutControls.ruleListContainer;
			layoutControl.isVisible = !layoutControl.isVisible;

			layoutViewControls();
			break;
		case 'deleteitem':
			var selectedItems = dataModel.getSelection();
			var i;

			for (i = 0; i < selectedItems.length; i++) {
				dataModel.deleteItemWithRelationships(selectedItems[i]);
			}

			viewContext.controls.ruleGrid.deselect();
			updateViewToolbarState();
			break;
		case 'ruleexpression_panel':
			layoutControl = viewContext.layoutControls.ruleTextRepresentation;
			layoutControl.isVisible = !layoutControl.isVisible;

			layoutViewControls();
			break;
	}
}

function optionExpressionRepresentationDeserializer(familyId, optionId, optionalParameters) {
	var deserializedValue = optionExpressionDeserializer(familyId, optionId, optionalParameters);
	if (deserializedValue) {
		var renderUtils = viewContext.modules.RenderUtils.HTML;
		var groupOptionsHash = viewContext.data.groupOptionsHash;
		var optionGroup = optionalParameters.expressionBranch === 'condition' ? 'principal' : 'constrained';
		var expressionCssClasses = 'optionExpression' + (groupOptionsHash[optionGroup][optionId + familyId] ? ' ' + optionGroup + 'Option' : ' phantomOption');
		deserializedValue = renderUtils.wrapInTag(deserializedValue, 'span', {class: expressionCssClasses, optionId: optionId});
	} else {
		deserializedValue = '(Option ' + optionId + ' was not found)';
	}

	return deserializedValue;
}

function optionExpressionDeserializer(familyId, optionId) {
	var deserializedValue = '';
	var optionItemsHash = viewContext.data.optionItemsHash;
	var optionItem = optionItemsHash[optionId + familyId];
	var optionModelItem = optionItem && optionItem.modelItem;

	if (optionModelItem) {
		var familyModelItem = optionModelItem.parent;
		var familyName = familyModelItem.getItemProperty('name');
		var optionName =  optionModelItem.getItemProperty('name');
		var specialSymbolsRegExp = /^[a-zA-Z0-9]+$/;

		familyName = !specialSymbolsRegExp.test(familyName) ? '[' + familyName + ']' : familyName;
		optionName = !specialSymbolsRegExp.test(optionName) ? '[' + optionName + ']' : optionName;

		deserializedValue = familyName + ' = ' + optionName;
	}

	return deserializedValue;
}

function layoutViewControls() {
	var layoutControls = viewContext.layoutControls;
	var isFamilyListVisible = layoutControls.familyListContainer.isVisible;
	var isRuleListVisible = layoutControls.ruleListContainer.isVisible;
	var isRepresentationVisible = layoutControls.ruleTextRepresentation.isVisible;
	var isSidebarVisible = isRuleListVisible || isFamilyListVisible;
	var domNodeStyle;
	var layoutControl;

	// family list layout
	layoutControl = layoutControls.familyListContainer;
	domNodeStyle = layoutControl.domNode.style;
	domNodeStyle.display = isFamilyListVisible ? '' : 'none';

	if (isFamilyListVisible && !isRuleListVisible) {
		layoutControl._originHeight = layoutControl._originHeight || domNodeStyle.height;
		domNodeStyle.height = '100%';
	} else {
		domNodeStyle.height = layoutControl._originHeight || domNodeStyle.height;
	}

	// rule list layout
	layoutControl = layoutControls.ruleListContainer;
	domNodeStyle = layoutControl.domNode.style;
	domNodeStyle.display = layoutControl.isVisible ? '' : 'none';

	// sidebar child controls splitter
	layoutControl = layoutControls.familyListContainer._splitterWidget || layoutControls.ruleListContainer._splitterWidget;
	domNodeStyle = layoutControl.domNode.style;
	domNodeStyle.display = isFamilyListVisible && isRuleListVisible ? '' : 'none';

	// sidebar layout
	layoutControl = layoutControls.sideBorderContainer;

	if (isSidebarVisible !== layoutControl.isVisible) {
		layoutControl.isVisible = isSidebarVisible;
		layoutControl.domNode.style.display = layoutControl.isVisible ? '' : 'none';

		if (layoutControl._splitterWidget) {
			layoutControl._splitterWidget.domNode.style.display = layoutControl.isVisible ? '' : 'none';
		}
	}

	layoutControl = layoutControls.ruleTextRepresentation;
	domNodeStyle = layoutControl.domNode.style;
	domNodeStyle.display = isRepresentationVisible ? '' : 'none';

	// sidebar child controls splitter
	layoutControl = layoutControls.ruleTextRepresentation._splitterWidget || layoutControls.tableEditorContainer._splitterWidget;
	domNodeStyle = layoutControl.domNode.style;
	domNodeStyle.display = isRepresentationVisible ? '' : 'none';

	layoutControls.viewBorderContainer.layout();
}

function updateViewToolbarState() {
	var toolbarButtonIds = gridToolbar.getButtons(',').split(',');
	var dataModel = viewContext.data.dataModel;
	var buttonId;
	var buttonWidget;
	var i;
	var j;

	for (i = 0; i < toolbarButtonIds.length; i++) {
		buttonId = toolbarButtonIds[i];
		buttonWidget = gridToolbar.getItem(buttonId);

		switch (buttonId) {
			case 'deleteitem':
				var selectedItems = dataModel.getSelection();
				var isButtonEnabled = false;

				if (viewEditMode && selectedItems.length) {
					isButtonEnabled = true;

					for (j = 0; j < selectedItems.length; j++) {
						if (selectedItems[j].isDeleted()) {
							isButtonEnabled = false;
							break;
						}
					}
				}

				buttonWidget.setEnabled(isButtonEnabled);
				break;
			default:
				break;
		}
	}
}

function updateDataModelSelection() {
	var selectedModelItems = [];
	var ruleGrid = viewContext.controls.ruleGrid;
	var dataModel = viewContext.data.dataModel;

	var selectedItems = ruleGrid.grid_Experimental.selection.getSelected();

	for (var i = 0, itemCount = selectedItems.length; i < itemCount; i++) {
		var selectedItem = selectedItems[i];
		var ruleModelItem = dataModel.getItemById(selectedItem && selectedItem.uniqueId[0]);

		if (ruleModelItem) {
			selectedModelItems.push(ruleModelItem);
		}
	}

	dataModel.setSelection(selectedModelItems);
}

function getMouseOverCellDivIndex() {
	// function to get the location of the cell under mouse hover.
	if (viewContext.customSelection && viewContext.customSelection.cells) {
		let selectedCellDivId = viewContext.customSelection.cells[0];
		let selectedCellDivIndex = selectedCellDivId.split('-')[2];
		return selectedCellDivIndex;
	}
	return "";
}

function setEditorGridCellFocus(rowIndex, columnIndex, cellIndex) {
	// function to set the selected cel and highlight it.
	cellIndex = parseInt(cellIndex);
	const editorGrid = viewContext.controls.tableEditor;
	const gridWidget = editorGrid.grid_Experimental; // jscs: ignore requireCamelCaseOrUpperCaseIdentifiers
	let gridStructure = (gridWidget.layout && gridWidget.layout.cells) || [];
	let customSelectedCell = viewContext.customSelectedCell;
	//clean up old cell css
	const cleanupCssClasses = ['selectedFocusedStatusCellbackground', 'selectedFocusedStatusCellborder', 'dojoxGridCellFocus'];
	let dirtyDomNodes;
	let i;
	let j;

	for (i = 0; i < cleanupCssClasses.length; i++) {
		currentCssClass = cleanupCssClasses[i];
		dirtyDomNodes = gridWidget.viewsNode.querySelectorAll('.' + currentCssClass);

		for (j = 0; j < dirtyDomNodes.length; j++) {
			dirtyDomNodes[j].classList.remove(currentCssClass);
		}
	}

	if (rowIndex > -1 && columnIndex > 0 && cellIndex > -1) {
		let fieldDescriptor = gridStructure[columnIndex];
		const gridView = fieldDescriptor.view;
		let groupCellNode = gridView.getCellNode(rowIndex, columnIndex);
		let cellNode = groupCellNode.firstElementChild.children[cellIndex];
		cellNode.classList.add('selectedFocusedStatusCellbackground');
		cellNode.firstElementChild.classList.add('selectedFocusedStatusCellborder');

		viewContext.customSelectedCell = [rowIndex, columnIndex, cellIndex];
	}
}

document.addEventListener('switchPane', function(e) {
	switch (e.detail.action) {
		case 'activate':
			this.loadView(window.parent.item);
			break;
		case 'deactivate':
			this.unloadView();
			break;
	}
}.bind(this));
