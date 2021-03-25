/* global define */
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/Menu',
	'QB/Scripts/qbTreeEnum',
	'dijit/MenuItem',
	'dijit/PopupMenuItem',
	'dijit/MenuSeparator'
], function (
	declare,
	connect,
	DijitMenu,
	QbTreeEnum,
	DigitMenuItem,
	DigitPopupMenuItem,
	DigitMenuSeparator
) {
	return declare(null, {
		treeMenu: null,
		systemEnums: new QbTreeEnum(),

		constructor: function () {
			this.treeMenu = new DijitMenu({
				targetNodeIds: ['tree']
			});
			this.treeMenu.startup();
		},

		onOpenMenu: function (selectedTreeElement) {
			this.removeAll();
			if (!selectedTreeElement.isRecursion) {
				this.generateGeneralMenu(selectedTreeElement);
			} else {
				this.generateRecursionMenu(selectedTreeElement);
			}
		},

		generateGeneralMenu: function (selectedTreeElement) {
			var self = this;

			if (isEditMode) {
				const addMenuItem = this.getAddMenuItem(selectedTreeElement);
				if (addMenuItem) {
					this.treeMenu.addChild(addMenuItem);
				}
				this.treeMenu.addChild(this.getManageMenuItem(selectedTreeElement));
				this.treeMenu.addChild(
					new DigitMenuItem({
						label: aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'action.changename'
						),
						onClick: function () {
							self.onChangeNameHandler(selectedTreeElement);
						}
					})
				);

				const reuseMenuItem = this.getReuseMenuItem(selectedTreeElement);
				if (reuseMenuItem) {
					this.treeMenu.addChild(reuseMenuItem);
				}

				this.treeMenu.addChild(new DigitMenuSeparator());
				this.treeMenu.addChild(
					new DigitMenuItem({
						label: aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'execution.start'
						),
						onClick: function () {
							self.startExecuteAction(selectedTreeElement);
						}
					})
				);

				if (selectedTreeElement.id !== 'root') {
					this.treeMenu.addChild(new DigitMenuSeparator());
					this.treeMenu.addChild(
						new DigitMenuItem({
							label: aras.getResource(
								'../Modules/aras.innovator.QueryBuilder/',
								'action.removeitem'
							),
							onClick: function () {
								self.onRemoveItemHandler(selectedTreeElement);
							}
						})
					);
				}
			} else {
				this.treeMenu.addChild(
					new DigitMenuItem({
						label: aras.getResource(
							'../Modules/aras.innovator.QueryBuilder/',
							'execution.start'
						),
						onClick: function () {
							self.startExecuteAction(selectedTreeElement);
						}
					})
				);
			}
		},

		generateRecursionMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.QueryBuilder/',
						'action.removeitem'
					),
					onClick: function () {
						self.onRemoveItemHandler(selectedTreeElement);
					}
				})
			);
		},

		getSubMenu: function (subItems, resourseKey, eventHandler) {
			var subMenu = new DijitMenu();
			subItems.forEach(function (subItem) {
				var subMenuItem = new DigitMenuItem({
					type: subItem,
					label: aras.getResource(
						'../Modules/aras.innovator.QueryBuilder/',
						resourseKey + '.' + subItem
					),
					onClick: eventHandler
				});
				subMenu.addChild(subMenuItem);
			});
			return subMenu;
		},

		getAddMenuItem: function (selectedTreeElement) {
			var self = this;

			var resourseKey = 'action.add';
			var subItems = ['property', 'relationship', 'whereused'];
			var subMenu = this.getSubMenu(subItems, resourseKey, function () {
				self.onAddHandler(selectedTreeElement, this.type);
			});

			var addMenuItem = new DigitPopupMenuItem({
				label: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					resourseKey
				),
				popup: subMenu
			});
			return addMenuItem;
		},

		getManageMenuItem: function (selectedTreeElement) {
			var self = this;

			var resourseKey = 'action.manage';
			var subItems = ['selectedprops', 'condition', 'sortorder'];
			var subMenu = this.getSubMenu(subItems, resourseKey, function () {
				self.onManageHandler(selectedTreeElement, this.type);
			});

			var manageMenuItem = new DigitPopupMenuItem({
				label: aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					resourseKey
				),
				popup: subMenu
			});
			return manageMenuItem;
		},

		removeAll: function () {
			var items = this.treeMenu.getChildren();

			for (var i = 0; i < items.length; i++) {
				this.treeMenu.removeChild(items[i]);
			}
		},

		getReuseMenuItem: function (selectedTreeElement) {
			if (selectedTreeElement.id !== 'root') {
				var self = this;
				return new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.QueryBuilder/',
						'action.reuse'
					),
					onClick: function () {
						self.onReuse(selectedTreeElement);
					}
				});
			}
		},

		onAddHandler: function (sourceTreeElement, type) {},

		onManageHandler: function (sourceTreeElement, type) {},

		onChangeNameHandler: function (sourceTreeElement) {},

		onRemoveItemHandler: function (sourceTreeElement) {},

		onReuse: function (sourceTreeElement) {
			window.tree.reuseQueryElementDefinition(sourceTreeElement);
		},

		startExecuteAction: function (sourceTreeElement) {
			window.tree.startExecuteAction(sourceTreeElement);
		}
	});
});
