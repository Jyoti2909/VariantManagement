/* global define */
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	aras.getBaseURL() +
		'/Modules/aras.innovator.QueryBuilder/Scripts/qbTreeEnum.js',
	'dijit/popup',
	aras.getBaseURL() +
		'/Modules/aras.innovator.QueryBuilder/components/relatedItemManager.js'
], function (declare, connect, QbTreeEnum, popup) {
	var systemEnums = new QbTreeEnum();

	return declare(null, {
		_tree: null,
		_grid: null,
		dataStore: null,
		selectedTreeItem: null,

		constructor: function (relationshipsGrid, tree, treeMenu, dataStore) {
			connect.connect(treeMenu.treeMenu, '_openMyself', function (res) {
				if (!tree.tree.selected) {
					return;
				}
				treeMenu.onOpenMenu(tree.tree.data.get(tree.tree.selected));
			});

			connect.connect(treeMenu, 'onAddHandler', function (
				selectedTreeElement,
				type
			) {
				var relatedItemManager = new RelatedItemManager(tree, type);

				if (!tree.tree.selected) {
					return;
				}
				switch (type) {
					case 'property':
						relatedItemManager.addProperties();
						break;
					case 'relationship':
						relatedItemManager.addRelationships();
						break;
					case 'whereused':
						relatedItemManager.addWhereUsed();
				}
			});

			connect.connect(treeMenu, 'onManageHandler', function (
				selectedTreeElement,
				type
			) {
				if (!tree.tree.selected) {
					return;
				}

				var buttonName = type.replace('selectedprops', 'properties');
				buttonName = buttonName.replace('condition', 'conditions');
				buttonName = buttonName.replace('sortorder', 'sort-order');

				var buttonNode = tree.tree.htmlNodes[
					selectedTreeElement.id
				].querySelector('.query-item-controls__' + buttonName);
				var clickHandlerName = tree.getTargetButtonName(buttonNode);

				if (tree.treeButtonClickHandlers[clickHandlerName]) {
					tree.treeButtonClickHandlers[clickHandlerName](
						{ target: buttonNode },
						selectedTreeElement
					);
				}
			});

			connect.connect(treeMenu, 'onChangeNameHandler', function (
				selectedTreeElement
			) {
				tree.changeItemName(selectedTreeElement);
			});

			connect.connect(treeMenu, 'onRemoveItemHandler', function (
				selectedTreeElement
			) {
				if (
					aras.confirm(
						aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'action.removeitem_confirm',
							selectedTreeElement.name
						)
					)
				) {
					tree.removeItem(selectedTreeElement);
				}
			});

			connect.connect(tree, 'onNodeSelected', function (element) {
				popup.close(treeMenu.treeMenu);
				tree.lastSelectedId = element.id;
			});
		}
	});
});
