define([
	'dojo/_base/declare',
	'dijit/Menu',
	'dijit/PopupMenuItem',
	'./_BaseMenu'
], function (declare, Menu, PopupMenuItem, _BaseMenu) {
	return declare('Aras.Client.Controls.Experimental.Menu', [Menu, _BaseMenu], {
		AddSubmenu: function (text, id, isEnabled, pos) {
			var menu = new Menu({});
			var popupmenu = new PopupMenuItem({
				id: id,
				label: text,
				popup: menu,
				disabled: !isEnabled
			});
			this._addChild(popupmenu, pos);
			return menu;
		},

		IsMenu: function () {
			return true;
		}
	});
});
