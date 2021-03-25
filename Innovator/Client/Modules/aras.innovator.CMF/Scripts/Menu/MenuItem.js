define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/MenuItem'
], function (declare, connect, MenuItem) {
	return declare(null, {
		_menuItem: null,
		itemObject: null,

		constructor: function (itemObject, onClick) {
			this.itemObject = itemObject;

			this._menuItem = new MenuItem(itemObject);

			var self = this;
			connect.connect(this._menuItem, 'onClick', function () {
				if (onClick) {
					onClick(self.itemObject);
				} else {
					self.onClick(self.itemObject);
				}
			});
		},

		onClick: function (itemObject) {}
	});
});
