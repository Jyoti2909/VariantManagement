define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/Menu',
	'dijit/PopupMenuItem',
	'dojo/domReady!'
], function (declare, connect, Menu, PopupMenuItem) {
	return declare('CmfMenu', null, {
		_menu: null,

		constructor: function (styleCssString) {
			this._menu = new Menu({ style: styleCssString });

			//disable browser's menu, e.g., on RMB click.
			this._menu.domNode.addEventListener(
				'contextmenu',
				function (menuEvent) {
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			var self = this;
			connect.connect(this._menu, '_openMyself', function (obj) {
				self.onOpenMenu(obj.target);
			});
		},

		add: function (menuItem) {
			this._menu.addChild(menuItem._menuItem);
		},

		addFirstItemOfMenu: function (menu, label, iconPath) {
			var dojoMenuItem = menu._menu.getChildren()[0];
			dojoMenuItem.set('label', label);
			dojoMenuItem.iconClass = 'cmfMenuItemIcon';
			dojoMenuItem.iconNode.classList.add('cmfMenuItemIcon');
			dojoMenuItem.iconNode.classList.remove('dijitNoIcon');
			if (iconPath) {
				dojoMenuItem.iconNode.style.backgroundImage =
					"url('" + dojo.baseUrl + '../' + iconPath + "')";
			}
			return this._menu.addChild(dojoMenuItem);
		},

		addSubMenu: function (subMenuWithItems, label, iconPath) {
			//menu is optional and required if need to add the 3-rd level of menu item
			var popupMenuItem = new PopupMenuItem({
				label: label,
				popup: subMenuWithItems._menu,
				iconClass: iconPath ? 'cmfMenuItemIcon' : undefined
			});

			if (iconPath) {
				popupMenuItem.iconNode.style.backgroundImage =
					"url('" + dojo.baseUrl + '../' + iconPath + "')";
			}

			this._menu.addChild(popupMenuItem);
		},

		removeAll: function () {
			var items = this._menu.getChildren();

			for (var i = 0; i < items.length; i++) {
				this._menu.removeChild(items[i]);
			}
		},

		open: function (target) {
			this._menu._scheduleOpen(null, null, null, target);
		},

		onOpenMenu: function (target) {},

		isShowingNow: function () {
			return this._menu.isShowingNow;
		},

		hasSubMenu: function () {
			return this._menu.getChildren().length > 1 || this._menu.hasSubMenu;
		},

		focus: function () {
			return this._menu.focus();
		}
	});
});
