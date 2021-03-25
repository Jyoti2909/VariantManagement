define(['dijit/Menu', 'dijit/MenuItem', 'dijit/PopupMenuItem'], function (
	dijit_Menu,
	dijit_MenuItem,
	dijit_PopupMenuItem
) {
	var _MenuItem = dojo.declare('_MenuItem', dijit_MenuItem, {
			constructor: function (args) {
				this.structureItem = args.structureItem;
				this.cmdId = args.cmdId;
				this.label = args.label;
				if (args.isEnabled !== undefined) {
					this.disabled = !args.isEnabled;
				}
			},
			onClick: function () {
				this.onClickHandler(this.cmdId, this.structureItem);
			},
			removeAll: function () {}
		}),
		_Menu = dojo.declare('_Menu', dijit_Menu, {
			constructor: function () {
				this._items = [];
			},
			addItem: function (
				itemClass,
				cmdId,
				label,
				image,
				isEnabled,
				structureItem,
				onMenuItemClick
			) {
				var menuItem = new itemClass({
					label: label,
					cmdId: cmdId,
					isEnabled: isEnabled,
					structureItem: structureItem,
					onClickHandler: onMenuItemClick
				});
				this.addChild(menuItem);
				this._items.push(menuItem);
				return menuItem;
			},
			removeAll: function () {
				var items = this._items,
					itemsCount = this._items.length,
					i;
				for (i = 0; i < itemsCount; i++) {
					items[i].removeAll();
					this.removeChild(items[i]);
				}
				this._items = [];
			}
		}),
		_PopupMenuItem = dojo.declare('_PopupMenuItem', dijit_PopupMenuItem, {
			constructor: function (args) {
				this.structureItem = args.structureItem;
				this.onClickHandler = args.onClickHandler;
				this.cmdId = args.cmdId;
				this.disabled = !args.isEnabled;
				this.popup = new _Menu();
				this.iconClass = 'dijitEditorIconTabIndent';
			},
			add: function (cmdId, label, image, isEnabled) {
				return this.popup.addItem(
					_MenuItem,
					cmdId,
					label,
					image,
					isEnabled,
					this.structureItem,
					this.onClickHandler
				);
			},
			removeAll: function () {
				this.popup.removeAll();
			}
		});

	var _StructureMenu = function (args) {
		var _onMenuItemClick = args.onMenuItemClick || function () {},
			_menu = new _Menu(),
			_structureItem = null;

		return {
			init: function (structureItem) {
				_menu.removeAll();
				_structureItem = structureItem;
			},

			show: function (params) {
				/*
					params: {
						node: event.target (or another targeted DOM-element),
						x: event.pageX,
						y: event.pageY
					}
				*/
				_menu._scheduleOpen(params.node, null, {
					x: params.x,
					y: params.y
				});
			},

			add: function (cmdId, label, image, isEnabled) {
				return _menu.addItem(
					_MenuItem,
					cmdId,
					label,
					image,
					isEnabled,
					_structureItem,
					_onMenuItemClick
				);
			},

			addDropDownMenu: function (cmdId, label, image, isEnabled) {
				return _menu.addItem(
					_PopupMenuItem,
					cmdId,
					label,
					image,
					isEnabled,
					_structureItem,
					_onMenuItemClick
				);
			},

			removeAll: function () {
				_menu.removeAll();
			}
		};
	};

	return dojo.declare('Aras.Client.Controls.Experimental.StructureMenu', null, {
		constructor: function (args) {
			var publicAPI = _StructureMenu.call(this, args),
				propName;
			for (propName in publicAPI) {
				this[propName] = publicAPI[propName];
			}
		}
	});
});
