/* global define, CMF */
define(['dojo/_base/declare', 'dojo/_base/connect', './MenuItem'], function (
	declare,
	connect,
	MenuItemObject
) {
	return declare('MenuHelper', null, {
		constructor: function () {},

		createCandidateMenu: function (
			treeMenu,
			stuctureMapping,
			docElementTypes,
			selectedTreeItem,
			controller
		) {
			var acceptCallback = function () {
				selectedTreeItem.isCandidate = false;
				var changes = stuctureMapping.run(docElementTypes);
				controller.onChange('accept candidate', {
					element: selectedTreeItem,
					changes: changes
				});
			};

			var acceptMenuItem = new MenuItemObject(
				{ label: CMF.Utils.getResource('menu_accept') },
				acceptCallback
			);
			treeMenu.add(acceptMenuItem);
		},

		addAddMenu: function (docElemType, subMenu, treeMenu) {
			var label =
				CMF.Utils.getResource('menu_add') +
				(docElemType.elementTypeLabel || docElemType.name);
			if (subMenu.hasSubMenu()) {
				treeMenu.addSubMenu(subMenu, label, docElemType.iconPath);
			} else {
				treeMenu.addFirstItemOfMenu(subMenu, label, docElemType.iconPath);
			}
		},

		addAllAcceptMenu: function (dataStore, treeMenu, controller) {
			var allCandidates = dataStore.getAllCandidates();
			if (allCandidates.length > 0) {
				var menuItem = new MenuItemObject({
					label: CMF.Utils.getResource('menu_accept_all_candidates')
				});
				menuItem.onClick = function () {
					while (allCandidates.length > 0) {
						controller.onChange('accept all candidates', {
							allCandidates: allCandidates
						});
						allCandidates = dataStore.getAllCandidates();
					}
				};
				treeMenu.add(menuItem);
			}
		},

		addMenuItem: function (subMenu, label, iconPath, onClick, onClickParams) {
			var menuItem = new MenuItemObject({
				label: label,
				iconPath: iconPath,
				onClickParams: onClickParams
			});
			menuItem.onClick = onClick;
			subMenu.add(menuItem);
		}
	});
});
