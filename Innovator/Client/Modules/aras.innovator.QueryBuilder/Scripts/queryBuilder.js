function getThisItem() {
	//TODO: investigate and file IR that 'self.thisItem' is undefined in 'tabs off' mode
	return self.document.getElementById('instance').contentWindow.document
		.thisItem;
}

window.isLimitToSelectOnlySingleProperty = false; //is overridden in MacPolicyModule.
window.isToHideParametersButton = false; //is overridden in MacPolicyModule.

function showQueryBuilderEditor() {
	if (getThisItem().getAction() === 'add' && isFirstShowOfEditor) {
		setAlias();
		createQueryBuilderTree().then(function () {
			aras.RefillWindow(getThisItem().node, window, false);
		});
	}
	isFirstShowOfEditor = false;
}

function onloadHandler(propertyDataType = null) {
	generateContainer();
	loadQueryBuilder(propertyDataType);
}

function reload() {
	return createQueryBuilderTree();
}

function createQueryBuilderTree(propertyDataType) {
	if (tree) {
		destroyTree();
	}
	return new Promise(function (resolve, reject) {
		require([
			'QB/Scripts/qbTree',
			'QB/Scripts/qbDataLoader',
			qbTreeModulePath,
			'QB/Scripts/qbSynchronizer'
		], function (QbTree, QbDataLoader, QbTreeMenu, QbSynchronizer) {
			var treeNode = document.getElementById('tree');
			dataLoader = new QbDataLoader();
			dataStore = dataLoader.load(item);
			if (dataStore.treeModelCollection.length !== 0) {
				var oldNavTree = tree && tree.tree;

				tree = new QbTree(treeNode, {
					store: dataStore,
					readOnly: !isEditMode,
					loader: dataLoader,
					oldNavTree: oldNavTree,
					customizationConfig: {
						isLimitToSelectOnlySingleProperty: isLimitToSelectOnlySingleProperty,
						propertyDataType: propertyDataType
					}
				});

				initializeTreeMenu(QbTreeMenu);
				treeSyncronizer = new QbSynchronizer(null, tree, treeMenu, dataStore);
			}
			resolve();
		});
	});
}

function createToolBar() {
	var toolbarActions = {
		editParameters: function () {
			var parametersDialog = ArasModules.Dialog.show('iframe', {
				title: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'parameters_dialog_title'
				),
				aras: aras,
				dialogWidth: 651,
				dialogHeight: 400,
				content:
					aras.getBaseURL() +
					'/scripts/relationshipsGrid.html?db=' +
					aras.getDatabase() +
					'&relTypeID=' +
					aras.getRelationshipTypeId('qry_QueryParameter') +
					'&ITName=qry_QueryParameter&editMode=' +
					(isEditMode ? '1' : '0') +
					'&tabbar=1&toolbar=0' +
					'&itemID=' +
					window.parent.itemID +
					'&custom_toolbar_src=' +
					aras.getBaseURL() +
					'/Modules/aras.innovator.QueryBuilder/html/toolbar.html'
			});

			parametersDialog.dialogNode
				.querySelector('iframe')
				.addEventListener('load', function () {
					this.contentWindow.onMenuCreate = function () {
						return false;
					};
				});
		},
		operatorShowConditionText: function (btn) {
			tree.tree.showWhereUseCondition = !tree.tree.showWhereUseCondition;
			btn._item_Experimental.domNode.classList.toggle(
				'toolbar-item_pressed',
				tree.tree.showWhereUseCondition
			);
			tree.tree.render();
		},
		operatorShowJoinText: function (btn) {
			tree.tree.showJoinCondition = !tree.tree.showJoinCondition;
			btn._item_Experimental.domNode.classList.toggle(
				'toolbar-item_pressed',
				tree.tree.showJoinCondition
			);
			tree.tree.render();
		}
	};

	clientControlsFactory.createControl(
		'Aras.Client.Controls.Public.ToolBar',
		{
			id: 'top_toolbar_query',
			connectId: 'queryToolbar'
		},
		function (control) {
			clientControlsFactory.on(control, {
				onClick: function (btn) {
					var cmdID = btn.getId();
					toolbarActions[cmdID](btn);
				}
			});

			control.showLabels(
				aras.getPreferenceItemProperty(
					'Core_GlobalLayout',
					null,
					'core_show_labels'
				) === 'true'
			);
			control.loadXml(
				aras.getI18NXMLResource(
					'queryEditor_toolbar.xml',
					aras.getScriptsURL() + '../Modules/aras.innovator.QueryBuilder/'
				)
			);
			control.show();

			if (isToHideParametersButton) {
				control.hideItem('editParameters');
				control.hideItem('qb_separator');
			}

			var conditionTextBtn = control.getItem('operatorShowConditionText');
			var joinTextBtn = control.getItem('operatorShowJoinText');

			conditionTextBtn._item_Experimental.domNode.classList.add(
				'toolbar-item_pressed'
			);
			joinTextBtn._item_Experimental.domNode.classList.add(
				'toolbar-item_pressed'
			);
		}
	);
}

function loadQueryBuilder(propertyDataType) {
	createQueryBuilderTree(propertyDataType);
	createToolBar();
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

var tree;
var treeMenu;
var synchronizer;
var dataStore;
var dataLoader;
var isFirstShowOfEditor = true;
var qbTreeModulePath = 'QB/Scripts/qbTreeMenu';

function initializeTreeMenu(QbTreeMenu) {
	window.treeMenu = new QbTreeMenu();
}

function setAlias() {
	var qryDefinition = getThisItem();
	var rootQryReference = qryDefinition.getItemsByXPath(
		'Relationships/Item[@type="qry_QueryReference" and (parent_ref_id="" or not(parent_ref_id))]'
	);
	var childRefId = rootQryReference.getProperty('child_ref_id');
	var rootQryItem = qryDefinition.getItemsByXPath(
		'Relationships/Item[@type="qry_QueryItem" and ref_id="' + childRefId + '"]'
	);
	var itemTypeKeyedName = rootQryItem.getPropertyAttribute(
		'item_type',
		'keyed_name'
	);
	if (!itemTypeKeyedName) {
		rootQryItem.setProperty('alias', 'fake'); //set fake value to show error only about empty item_type, but not empty alias
		aras.checkItem(rootQryItem.node);
		rootQryItem.setProperty('alias', null);
		return false;
	} else {
		if (!rootQryItem.getProperty('alias')) {
			rootQryItem.setProperty('alias', itemTypeKeyedName);
		}
	}
	return true;
}

function destroyTree() {
	tree.treeStore.clear();
}

function generateContainer() {
	const queryBuilderEditorContainer = document.getElementById(
		'QueryBuilderEditorContainer'
	);
	if (!queryBuilderEditorContainer) {
		return;
	}
	const queryToolbar = document.createElement('div');
	queryToolbar.id = 'queryToolbar';

	const queryDefinitionContainer = document.createElement('div');
	queryDefinitionContainer.id = 'queryDefinitionContainer';

	const separator = document.createElement('div');
	separator.className = 'separator';

	const tree = document.createElement('div');
	tree.id = 'tree';

	queryDefinitionContainer.appendChild(separator);
	queryDefinitionContainer.appendChild(tree);
	queryBuilderEditorContainer.appendChild(queryToolbar);
	queryBuilderEditorContainer.appendChild(queryDefinitionContainer);
}
