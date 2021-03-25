define([
	'dojo/_base/declare',
	'dojo/aspect',
	'dijit/MenuSeparator',
	'dijit/PopupMenuItem',
	'dijit/MenuItem'
], function (declare, aspect, MenuSeparator, PopupMenuItem, MenuItem) {
	return declare(
		'Aras.Client.Controls.Experimental.PopupMenuItem',
		[PopupMenuItem],
		{
			_item: false,

			constructor: function (_item) {
				this._item = _item;
			},

			Add: function (id, label) {
				var item = new MenuItem({ id: id, label: label });
				aspect.after(item, 'onClick', function (e) {
					this.getParent().eventClick(this.id);
				});
				this._item.popup.addChild(item);
			},

			setItemVisible: function (itemId, isVisible) {
				var items = this._item.popup.getChildren(),
					i;
				isVisible = isVisible === undefined || isVisible;
				for (i = 0; i < items.length; i += 1) {
					if (itemId == items[i].id) {
						items[i].domNode.style.display = isVisible ? '' : 'none';
					}
				}
			}
		}
	);
});
