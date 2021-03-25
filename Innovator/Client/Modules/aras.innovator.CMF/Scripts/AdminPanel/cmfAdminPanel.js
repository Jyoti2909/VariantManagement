window.viewMode = '';
window.viewType = 'formtool';
window.currContentTypeNode = window.item;

const baseSetEditMode = window.setEditMode;
window.setEditMode = function (reloadRelationshipQueryString) {
	const result = baseSetEditMode(reloadRelationshipQueryString);

	reload();

	return result;
};

const baseSetViewMode = window.setViewMode;
window.setViewMode = function () {
	const result = baseSetViewMode();

	reload();

	return result;
};

function checkViewNodeOnUpdate(viewNode) {
	var needStopRemove = false;
	var baseView = viewNode.selectSingleNode('related_id/Item');
	if (baseView) {
		var baseViewAction = baseView.getAttribute('action');
		if (baseViewAction) {
			if (baseViewAction === 'update') {
				baseView.setAttribute('action', 'edit');
			}
			needStopRemove = true;
		}
	} else {
		return false;
	}
	var viewElements = baseView.selectNodes('Relationships/Item');
	for (var m = 0; m < viewElements.length; m++) {
		if (viewElements[m].getAttribute('action') === 'update') {
			viewElements[m].setAttribute('action', 'edit');
			needStopRemove = true;
		} else {
			var elementGroups = viewElements[m].selectNodes(
				"related_id/Item[@action and @type='cmf_TabularViewHeaderRow']"
			);
			if (elementGroups.length > 0) {
				needStopRemove = true;
				if (viewElements[m].getAttribute('action') !== 'add') {
					viewElements[m].setAttribute('action', 'edit');
				}
				for (var i = 0; i < elementGroups.length; i++) {
					if (elementGroups[i].getAttribute('action') === 'update') {
						elementGroups[i].setAttribute('action', 'edit');
					}
				}
			}
		}
	}
	return needStopRemove;
}

function clearRelationshipsPane() {
	var viewModes = ['edit', 'view'];
	for (var itemTypeName in relationshipCache.cache) {
		if (relationshipCache.cache[itemTypeName]) {
			for (var j = 0; j < viewModes.length; j++) {
				var relByViewMode = relationshipCache.cache[itemTypeName][viewModes[j]];
				if (relByViewMode) {
					for (var frameId in relByViewMode.contentWindow.iframesCollection) {
						var iframe = relByViewMode.contentWindow.iframesCollection[frameId];
						if (
							iframe &&
							iframe.contentWindow.unRegisterTopMenuEventsHandlers
						) {
							iframe.contentWindow.unRegisterTopMenuEventsHandlers();
						}
					}
				}
			}
		}
	}

	var relationshipPane = document.getElementById('relationshipsPane');
	if (relationshipPane) {
		while (relationshipPane.firstChild) {
			relationshipPane.removeChild(relationshipPane.firstChild);
		}
	}
	initRelationshipCache('relationshipsPane');
}

function loadCmfAdminPanel() {
	reload();
}

function hideFormAndGrid() {
	var formContainer = document.getElementById(
		CMF.ItemForm.formsCache.defaultContainerId
	);
	CMF.ItemForm.hideAllItemForms(formContainer);

	var gridContainer = document.getElementById(
		relationshipCache.defaultContainerId
	);
	hideAllRelationshipsGrid(gridContainer);
}

function updateTreeNodeLabel(value, id) {
	if (tree) {
		var treeElement = tree.getTreeElementById(id);
		if (treeElement) {
			treeElement.element.name = value;
			tree.updateTreeLabel(treeElement);
		}
	}
}

function updateTabularViewColumn(value, id) {
	if (tree) {
		var treeElement = tree.getTreeElementById(id);
		if (treeElement) {
			treeElement.element.name = treeElement.element.sortOrder + ': ' + value;
			tree.updateTreeLabel(treeElement);
		}

		// check on client errors
		var errors = aras.clientItemValidation(
			'cmf_TabularViewColumn',
			treeElement.node,
			false
		);
		if (errors.length > 0) {
			var message = '';
			for (var i = 0; i < errors.length; i++) {
				message = message + errors[i].message + '</br>';
			}
			treeElement.addWarning('clientValidation', message);
		} else {
			treeElement.removeWarning('clientValidation');
		}
		dataStore.checkOnEmptyLinks();
		tree.setWarningIcon(treeElement, treeElement.getWarning());
	}
}

function onAdditionalPropertyChanged(propertyId) {
	var treeElementModel = dataStore.getElementById(propertyId);
	dataStore.checkOnEmptyLinks();
	tree.setWarningIcon(treeElementModel, treeElementModel.getWarning());
}

var tree;
var treeMenu;
var synchronizer;
var dataStore;

let reloadPromise = null;
function reload() {
	if (reloadPromise) {
		return reloadPromise;
	}

	clearRelationshipsPane();

	var selectedItemId = 'root';
	if (tree) {
		if (tree.lastSelectedId) {
			selectedItemId = tree.lastSelectedId;
		}
		destroyTree();
	}
	require([
		'dojo/_base/connect',
		'../Modules/aras.innovator.CMF/Scripts/AdminPanel/AdminEnum.js',
		'../Modules/aras.innovator.CMF/Scripts/AdminPanel/AdminTree.js',
		'../Modules/aras.innovator.CMF/Scripts/AdminPanel/AdminDataLoader.js',
		'../Modules/aras.innovator.CMF/Scripts/AdminPanel/AdminTreeMenu.js',
		'../Modules/aras.innovator.CMF/Scripts/AdminPanel/AdminSynchronizer.js'
	], function (
		connect,
		AdminEnum,
		AdminTree,
		AdminDataLoader,
		AdminTreeMenu,
		AdminSynchronizer
	) {
		var treeNode = document.getElementById('divTree');
		if (!treeNode) {
			var editorPane = document.getElementById('editorPane');
			treeNode = document.createElement('div');
			treeNode.id = 'divTree';
			treeNode.style.display = 'none';
			editorPane.appendChild(treeNode);
		}

		var dataLoader = new AdminDataLoader();
		dataStore = dataLoader.load(item);
		tree = new AdminTree('divTree', {
			store: dataStore,
			readOnly: !isEditMode
		});
		treeMenu = new AdminTreeMenu(tree, dataStore);
		synchronizer = new AdminSynchronizer(null, tree, treeMenu, dataStore);

		reloadPromise = tree.selectItem(selectedItemId).then(() => {
			reloadPromise = null;
		});
		treeNode.style.display = '';
	});
}

function showTreeElement(element) {
	if (element.node) {
		currContentTypeNode = element.node;
		CMF.ItemForm.showItemForm(
			element.dataType,
			isEditMode ? 'edit' : 'view',
			element.node,
			onPropertyFieldChanged
		);
		showRelationshipGrid(
			element.dataType,
			isEditMode ? 'edit' : 'view',
			element.node
		);
	}
}

function reShowCurrentForm() {
	var element = tree.tree.selectedItem.element;
	CMF.ItemForm.showItemForm(
		element.dataType,
		isEditMode ? 'edit' : 'view',
		element.node,
		onPropertyFieldChanged
	);
}

function destroyTree() {
	// Completely delete every node from the dijit.Tree
	tree.tree._itemNodesMap = {};
	tree.tree.rootNode.state = 'UNCHECKED';
	if (tree.tree.model.root) {
		tree.tree.model.root.children = null;
	}

	// Destroy the widget
	tree.treeStore.clear();
	tree.treeStore = null;
	tree.tree.rootNode.destroyRecursive();
	tree.tree.destroy();
}

function onDependencyChanged(context, result) {
	if (!isEditMode) {
		return;
	}

	var computedPropertyNode = context.selectSingleNode(
		"Relationships/Item[@type='cmf_ComputedProperty' and not(@action='delete')]"
	);

	if (result.length === 0 && !computedPropertyNode) {
		return;
	}

	if (result.length === 1 && result[0] === 'empty' && !computedPropertyNode) {
		return;
	}
	var dependencyDictionary = {};
	if (!computedPropertyNode) {
		computedPropertyNode = createComputedPropertyNode(context);
		insertComputedPropertyNodeToContext(context, computedPropertyNode);
	} else {
		var dependencies = computedPropertyNode.selectNodes(
			"Relationships/Item[@type='cmf_ComputedPropertyDependency' and not(@action='delete')]/related_id"
		);

		for (var m = 0; m < dependencies.length; m++) {
			dependencyDictionary[dependencies[m].text] = true;
		}

		removeComputedPropertyDependency(context, dependencies, result);
	}

	for (var j = 0; j < result.length; j++) {
		var relatedPropertyTypeId = result[j];
		if (relatedPropertyTypeId === 'empty') {
			continue;
		}
		if (!dependencyDictionary[relatedPropertyTypeId]) {
			addComputedPropertyDependency(
				context,
				computedPropertyNode,
				relatedPropertyTypeId
			);
		}
	}
}

function createComputedPropertyNode(context) {
	var computedPropertyItem = aras.IomInnovator.newItem(
		'cmf_ComputedProperty',
		'add'
	);
	computedPropertyItem.setAttribute('id', aras.generateNewGUID());
	computedPropertyItem.setProperty(
		'on_client_compute_method',
		aras.getItemProperty(context, 'ui_computed_property')
	);
	return computedPropertyItem.node;
}

function insertComputedPropertyNodeToContext(context, computedPropertyNode) {
	var relationshipNode = context.selectSingleNode('Relationships');
	if (!relationshipNode) {
		relationshipNode = context.ownerDocument.createElement('Relationships');
		context.appendChild(relationshipNode);
	}
	relationshipNode.appendChild(computedPropertyNode);
}

function removeComputedPropertyDependency(context, dependencies, result) {
	var needRemove = [];
	for (var i = 0; i < dependencies.length; i++) {
		var dependencyId = dependencies[i].text;
		if (result.indexOf(dependencyId) === -1) {
			// cmf_ComputedPropertyDependency
			var propertyDependency = dependencies[i].parentNode;
			if (propertyDependency.getAttribute('action') === 'add') {
				needRemove.push(propertyDependency);
			} else {
				propertyDependency.setAttribute('action', 'delete');
				if (context.getAttribute('action') !== 'add') {
					context.setAttribute('action', 'update');
				}
			}
		}
	}

	for (var k = 0; k < needRemove.length; k++) {
		needRemove[k].parentNode.removeChild(needRemove[k]);
	}
}

function addComputedPropertyDependency(
	context,
	computedPropertyNode,
	relatedPropertyTypeId
) {
	var dependency = aras.IomInnovator.newItem(
		'cmf_ComputedPropertyDependency',
		'add'
	);
	dependency.setAttribute('id', aras.generateNewGUID());
	dependency.setProperty('source_id', computedPropertyNode.getAttribute('id'));
	dependency.setProperty('related_id', relatedPropertyTypeId);
	//dependency.setPropertyAttribute('related_id', 'keyed_name', srcElement.value);
	dependency.setPropertyAttribute('related_id', 'type', 'cmf_PropertyType');

	var relNode = computedPropertyNode.selectSingleNode('Relationships');
	if (!relNode) {
		relNode = computedPropertyNode.ownerDocument.createElement('Relationships');
		computedPropertyNode.appendChild(relNode);
	}
	relNode.appendChild(dependency.node);
	if (context.getAttribute('action') !== 'add') {
		context.setAttribute('action', 'update');
	}
}

// check item on error when any field on the form has been changed
function onPropertyFieldChanged(event) {
	if (event && event.contentWindow && !window.startPopulateFormWithItemEx) {
		var elementId = event.contentWindow.document.itemID;
		if (elementId) {
			var mainItemId = item.getAttribute('id');
			var treeElementModel = dataStore.getElementById(
				elementId === mainItemId ? 'root' : elementId
			);
			if (treeElementModel) {
				var checkCopy = treeElementModel.node.cloneNode(true);
				clearCheckNode(checkCopy);
				var needUpdateProperties = [];
				var defaultFieldCheckCallback = function (
					itemNode,
					reqName,
					proplabel,
					defVal
				) {
					var ask = aras.confirm(
						aras.getResource(
							'',
							'item_methods_ex.field_required_default_will_be_used',
							proplabel,
							defVal
						)
					);
					if (ask) {
						aras.setItemProperty(itemNode, reqName, defVal);
						needUpdateProperties.push({
							propertyName: reqName,
							propertyValue: defVal
						});
					}
					return {
						result: ask,
						message: !ask
							? aras.getResource(
									'',
									'item_methods_ex.field_required_provide_value',
									proplabel
							  )
							: ''
					};
				};
				var errors = aras.clientItemValidation(
					treeElementModel.node.getAttribute('type'),
					checkCopy,
					false,
					defaultFieldCheckCallback
				);

				if (errors.length > 0) {
					var message = '';
					for (var i = 0; i < errors.length; i++) {
						message = message + errors[i].message + '</br>';
					}
					treeElementModel.addWarning('clientValidation', message);
					tree.setWarningIcon(treeElementModel, treeElementModel.getWarning());
				} else {
					treeElementModel.removeWarning('clientValidation');
				}
				dataStore.checkOnEmptyLinks();
				tree.setWarningIcon(treeElementModel, treeElementModel.getWarning());

				if (needUpdateProperties.length > 0) {
					setTimeout(function () {
						// need timeout as handleItemChange called 2 times for listbox
						updateRequiredProperties(treeElementModel, needUpdateProperties);
					}, 0);
				}
			}
		}
	}
}

function updateRequiredProperties(treeElementModel, needUpdateProperties) {
	var form = CMF.ItemForm.getCachedFormWithClassification(
		treeElementModel.element.dataType,
		isEditMode ? 'edit' : 'view',
		treeElementModel.node
	);
	for (var j = 0; j < needUpdateProperties.length; j++) {
		var observerObject = form.form.contentWindow.observersHash.getElementById(
			needUpdateProperties[j].propertyName + '_system'
		);
		if (observerObject) {
			observerObject.setValue(needUpdateProperties[j].propertyValue);
		}
	}
}

// remove relationship node
function clearCheckNode(checkCopy) {
	var rel = checkCopy.selectSingleNode('Relationships');
	if (rel) {
		checkCopy.removeChild(rel);
	}
}

CMF.ItemForm.initFormsCache('forms');

/////////////////// WORK WITH RELATIONSHIPS GRID  ///////////////////
////////////////// copy from workflowRelationships.html ///////////////
function addRelationshipGridToCache(itemTypeName, formMode, form) {
	if (itemTypeName && formMode) {
		if (!relationshipCache.cache.hasOwnProperty(itemTypeName)) {
			relationshipCache.cache[itemTypeName] = {};
		}

		relationshipCache.cache[itemTypeName][formMode] = form;
	}
}

var relationshipCache = null;
function initRelationshipCache(defaultContainerId) {
	relationshipCache = {};
	relationshipCache.defaultMode = 'view';
	relationshipCache.defaultContainerId = defaultContainerId;
	relationshipCache.cache = {};
}
initRelationshipCache('relationshipsPane');

function hideAllRelationshipsGrid(formContainer) {
	var itemFormCache;
	var form;

	for (var itemTypeName in relationshipCache.cache) {
		itemFormCache = relationshipCache.cache[itemTypeName];

		for (var modeName in itemFormCache) {
			form = itemFormCache[modeName];
			if (form && form.containerElement === formContainer) {
				form.style.display = 'none';
			}
		}
	}
}

function showRelationshipGrid(
	itemTypeName,
	formMode,
	descriptionNode,
	containerElement,
	userChangeHandler
) {
	if (relationshipCache) {
		var cachedRel = null;
		itemTypeName = itemTypeName || '';
		formMode = formMode || relationshipCache.defaultMode;
		containerElement =
			containerElement ||
			document.getElementById(relationshipCache.defaultContainerId);

		if (itemTypeName) {
			cachedRel = getRelationshipGrid(itemTypeName, formMode);

			if (!cachedRel) {
				var formId = itemTypeName + '_relationship_' + formMode;
				cachedRel = document.createElement('iframe');
				cachedRel.setAttribute('id', formId);
				cachedRel.setAttribute('frameBorder', '0');
				cachedRel.setAttribute('scrolling', 'auto');
				cachedRel.setAttribute('width', '100%');
				cachedRel.setAttribute('height', '100%');

				cachedRel.formContentLoaded = false;
				cachedRel.itemTypeName = itemTypeName;
				containerElement.appendChild(cachedRel);
				cachedRel.containerElement = containerElement;
				addRelationshipGridToCache(itemTypeName, formMode, cachedRel);
			}
			// if user send description then fill form with item properties
			if (descriptionNode) {
				propsFReady = false;
				var itemID = descriptionNode.getAttribute('id');
				if (cachedRel.formContentLoaded) {
					var tmpTabbar = cachedRel.contentWindow.tabbars[itemTypeName];
					if (tmpTabbar.length <= 0) {
						hideAllRelationshipsGrid(containerElement);
						return;
					}
					var tabId = tmpTabbar[0].id;

					var queryString = {
						db: parent.aras.getDatabase(),
						ITName: itemTypeName,
						relTypeID: tabId,
						itemID: itemID,
						editMode: isEditMode ? 1 : 0,
						tabbar: '1',
						toolbar: '1',
						where: 'tabview'
					};
					cachedRel.contentWindow.relationships.reload(queryString);

					propsFReady = true;
				} else {
					cachedRel.contentWindow.location.href =
						parent.aras.getScriptsURL() +
						'../Modules/aras.innovator.CMF/Views/CMFAdminRelationshipsGrid.html?db=' +
						parent.aras.getDatabase() +
						'&ITName=' +
						itemTypeName +
						'&itemID=' +
						itemID +
						'&editMode=' +
						(isEditMode ? 1 : 0) +
						'&tabbar=1&toolbar=1&where=formtool';

					cachedRel.onload = function () {
						var topWindow = parent.aras.getMostTopWindowWithAras();
						topWindow.ITEM_WINDOW.registerStandardShortcuts(this.contentWindow);
						if (topWindow.returnBlockerHelper) {
							topWindow.returnBlockerHelper.attachBlocker(this.contentWindow);
						}

						cachedRel.contentDocument.userChangeHandler = userChangeHandler;
						cachedRel.contentDocument.documentElement.focus();
						cachedRel.formContentLoaded = true;
						propsFReady = true;
					};
				}
			}
		}

		hideAllRelationshipsGrid(containerElement);
		if (cachedRel) {
			cachedRel.style.display = '';
		}

		return cachedRel;
	}
}

function getRelationshipGrid(itemTypeName, formMode) {
	if (relationshipCache) {
		if (relationshipCache.cache.hasOwnProperty(itemTypeName)) {
			return relationshipCache.cache[itemTypeName][formMode];
		}
	}

	return undefined;
}
///////////////// END WORK WITH RELATIONSHIPS GRID  /////////////////
