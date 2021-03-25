define([
	'dojo/_base/declare',
	'dojo/_base/xhr',
	'dojo/_base/connect',
	'dojo/_base/array',
	'dijit/registry',
	'dijit/MenuBar',
	'dijit/PopupMenuBarItem',
	'dijit/Menu',
	'dijit/MenuItem',
	'dijit/DropDownMenu',
	'dijit/PopupMenuItem',
	'dijit/MenuSeparator',
	'Aras/Client/Controls/Experimental/MenuItem',
	'dijit/CheckedMenuItem',
	'Controls/RadioButtonMenuItem',
	'dijit/_WidgetBase'
], function (
	declare,
	xhr,
	connect,
	array,
	registry,
	MenuBar,
	PopupMenuBarItem,
	Menu,
	MenuItem,
	DropDownMenu,
	PopupMenuItem,
	MenuSeparator,
	ArasMenuItem,
	CheckedMenuItem,
	RadioButtonMenuItem,
	_WidgetBase
) {
	return declare('Aras.Client.Controls.Experimental.MainMenu', _WidgetBase, {
		ClickThrough: false,
		_defaultMenuBarId: null,
		_menubars: null,
		_mainMenu: null,
		args: null,
		activeMenuBarId: null,

		constructor: function (args) {
			this.args = args;
		},

		postCreate: function () {
			var args = this.args;
			this._menubars = [];
			if (!args.style) {
				this.domNode.style.padding = '0px';
			}
			this.setXML(args.XML, args.xmlArgType);
			this.showMenuBar(this._defaultMenuBarId);
		},

		_preApplyIcon: function (menuItem, args) {
			var itemIconUrl = menuItem.icon;
			if (!itemIconUrl) {
				return;
			}
			var iconClass; // unused now; can work as in ContextMenu.js
			var itemIconClass =
				itemIconUrl || iconClass
					? (itemIconUrl ? 'arasMenuIcon ' : '') + (iconClass || '')
					: undefined;
			if (itemIconClass) {
				args.iconClass = itemIconClass;
			}
		},

		_postApplyIcon: function (menuItem, item) {
			var itemIconUrl = menuItem.icon;
			// if "icon" parameter was passed, then explicitly set iconNode backgroundImage
			if (itemIconUrl) {
				item.iconNode.style.backgroundImage = 'url(' + itemIconUrl + ')';
			}
		},

		_addMenu: function (rootItem, parent, menuItemsDiffStatus) {
			array.forEach(
				rootItem.innerItems,
				function (menuItem) {
					var item, args;
					var idx;
					if (!menuItemsDiffStatus[menuItem.id]) {
						return;
					}
					const url = menuItem.icon || '';
					if (url.indexOf('vault:///?file') === 0) {
						const fileId = url.replace(/vault:\/\/\/\?fileid=/i, '');
						menuItem.icon = aras.IomInnovator.getFileUrl(
							fileId,
							aras.Enums.UrlType.SecurityToken
						);
					}
					switch (menuItem.nodeName) {
						case 'menu':
							var subMenu;
							if (menuItemsDiffStatus[menuItem.id].state === 'added') {
								var id = menuItem.id;
								subMenu = new Menu({ id: id + '$SubMenu' });
								args = {
									id: id,
									label: menuItem.name,
									popup: subMenu,
									disabled: 'true' == menuItem.disabled
								};
								this._preApplyIcon(menuItem, args);
								item = new PopupMenuItem(args);
								parent.addChild(item, menuItem.index);
								this._postApplyIcon(menuItem, item);
								subMenu.setAttribute('class', 'menu_dropdown');
								this._addMenu(menuItem, subMenu, menuItemsDiffStatus);
								connect.connect(subMenu, 'onItemClick', this, '_itemClicked');
								var self = this;
								connect.connect(subMenu, 'onOpen', this, function () {
									self.onOpenItem(id);
								});
								idx = menuItem.idx;
								subMenu.set('idx', idx);
							} else if (
								menuItemsDiffStatus[menuItem.id].state === 'modified'
							) {
								subMenu = this.findMenu(menuItem.id + '$SubMenu').item;
								this._addMenu(menuItem, subMenu, menuItemsDiffStatus);
							}
							break;
						case 'item':
							if (menuItemsDiffStatus[menuItem.id].state === 'added') {
								args = {
									id: menuItem.id,
									label: menuItem.name,
									icon: menuItem.icon
								};
								this._preApplyIcon(menuItem, args);
								item = new MenuItem(args, parent);
								this._postApplyIcon(menuItem, item);
								item.set('disabled', 'true' == menuItem.disabled);
								idx = menuItem.idx;
								item.set('idx', idx);
								parent.addChild(item, menuItem.index);
							}
							break;
						case 'separator':
							if (menuItemsDiffStatus[menuItem.id].state === 'added') {
								item = new MenuSeparator({ id: menuItem.id });
								idx = menuItem.idx;
								item.set('idx', idx);
								parent.addChild(item, menuItem.index);
							}
							break;
						case 'checkitem':
							if (menuItemsDiffStatus[menuItem.id].state === 'added') {
								item = new CheckedMenuItem({
									id: menuItem.id,
									label: menuItem.name,
									checked: 'true' == menuItem.checked
								});
								item.set('disabled', 'true' == menuItem.disabled);
								idx = menuItem.idx;
								item.set('idx', idx);
								parent.addChild(item, menuItem.index);
							}
							break;
						case 'radioitem':
							if (menuItemsDiffStatus[menuItem.id].state === 'added') {
								item = new RadioButtonMenuItem({
									id: menuItem.id,
									label: menuItem.name,
									checked: 'true' == menuItem.checked,
									group: menuItem.group
								});
								item.set('disabled', 'true' == menuItem.disabled);
								idx = menuItem.idx;
								item.set('idx', idx);
								parent.addChild(item, menuItem.index);
							}
							break;
					}

					if (item && menuItem.invisible == 'true') {
						item.set('style', 'display: none');
					}
				},
				this
			);
		},

		ClickAtPath: function (path) {
			throw 'Not Implemented';
		},

		findItem: function (id) {
			var item = registry.byId(id);
			return item ? new ArasMenuItem(item) : null;
		},

		findMenu: function (id) {
			return this.findItem(id);
		},

		GetButtonXY: function (id) {
			throw 'Not Implemented';
		},

		GetXML: function () {
			throw 'Not Implemented';
		},

		showMenuBar: function (id) {
			if (this.activeMenuBarId !== id) {
				var newMenuItemsToAdd = this._menubars[id];
				var menuItemsDiffStatus = this._getStraightenMenuItemsDictionary(
					newMenuItemsToAdd,
					''
				);
				var menuItemIndex;

				if (this.activeMenuBarId) {
					var itemId;
					var activeItem;
					var activeMenuItems = this._menubars[this.activeMenuBarId];
					var activeMenuItemsIdsWithPath = this._getStraightenMenuItemsDictionary(
						activeMenuItems,
						''
					);
					this._destroyOutdatedMenuItems(
						activeMenuItemsIdsWithPath,
						menuItemsDiffStatus
					);

					var notFilteredMenuItemsDiffStatus = Object.keys(menuItemsDiffStatus);
					for (
						menuItemIndex = 0;
						menuItemIndex < notFilteredMenuItemsDiffStatus.length;
						menuItemIndex++
					) {
						itemId = notFilteredMenuItemsDiffStatus[menuItemIndex];
						activeItem = activeMenuItemsIdsWithPath[itemId];
						if (
							activeItem &&
							activeItem.path === menuItemsDiffStatus[itemId].path
						) {
							menuItemsDiffStatus[itemId].state = 'unchanged';
						} else {
							menuItemsDiffStatus[itemId].state = 'added';
							var path = menuItemsDiffStatus[itemId].path.split('/');
							// last index in path belongs to "menuItemsDiffStatus[itemId]"
							path.pop();
							// First index is aleays empty because path stated from "/"
							path.shift();
							for (
								var pathSegmentIndex = path.length - 1;
								pathSegmentIndex >= 0;
								pathSegmentIndex--
							) {
								var parentId = path[pathSegmentIndex];
								var state = menuItemsDiffStatus[parentId].state;
								if (state == 'added' || state == 'modified') {
									break;
								}
								menuItemsDiffStatus[parentId].state = 'modified';
							}
						}
					}
				} else {
					// state: 'added' is a default state
					var menuItemsIds = Object.keys(menuItemsDiffStatus);
					for (
						var itemIdIndex = 0;
						itemIdIndex < menuItemsIds.length;
						itemIdIndex++
					) {
						var miId = menuItemsIds[itemIdIndex];
						menuItemsDiffStatus[miId].state = 'added';
					}
					this._mainMenu = new MenuBar({
						id: id,
						style: 'overflow: hidden;white-space: nowrap;',
						class: 'menu'
					});
					connect.connect(this._mainMenu, 'onItemClick', this, '_itemClicked');
					this.domNode.appendChild(this._mainMenu.domNode);
				}
				for (
					menuItemIndex = 0;
					menuItemIndex < newMenuItemsToAdd.length;
					menuItemIndex++
				) {
					this._loadMenuBarItem(
						newMenuItemsToAdd[menuItemIndex],
						menuItemsDiffStatus
					);
				}

				this._mainMenu.startup();
				this.onLoad();
				this.activeMenuBarId = id;
			}
		},

		_convertXmlToObject: function (xmlNodes) {
			var menuItems = [];
			var position = 0;

			for (var nodeIndex = 0; nodeIndex < xmlNodes.length; nodeIndex++) {
				var node = xmlNodes[nodeIndex];
				if (node.nodeName === '#text') {
					continue;
				}
				var menuItem = {};
				menuItem.id = node.getAttribute('id');
				menuItem.idx = node.getAttribute('idx');
				menuItem.name = node.getAttribute('name');
				menuItem.style = node.getAttribute('style');
				menuItem.class = node.getAttribute('class');
				menuItem.disabled = node.getAttribute('disabled');
				menuItem.checked = node.getAttribute('checked');
				menuItem.group = node.getAttribute('group');
				menuItem.invisible = node.getAttribute('invisible');
				menuItem.icon = node.getAttribute('icon');
				menuItem.nodeName = node.nodeName;
				menuItem.index = position++;
				menuItem.innerItems = this._convertXmlToObject(node.childNodes);
				menuItems.push(menuItem);
			}

			return menuItems;
		},

		_getStraightenMenuItemsDictionary: function (menuAsArray, path) {
			function getStraightenMenuItemsIdsWithPath(menuAsArray, path) {
				var result = [];
				for (
					var menuItemIndex = 0;
					menuItemIndex < menuAsArray.length;
					menuItemIndex++
				) {
					var menuItem = menuAsArray[menuItemIndex];
					var currentPath = path + '/' + menuItem.id;
					var current = { id: menuItem.id, path: currentPath };
					result = result.concat(
						current,
						getStraightenMenuItemsIdsWithPath(menuItem.innerItems, currentPath)
					);
				}

				return result;
			}

			var dictResult = {};
			var straightenMenuItemsIdsWithPath = getStraightenMenuItemsIdsWithPath(
				menuAsArray,
				path
			);
			for (
				var idsWithPathIndex = 0;
				idsWithPathIndex < straightenMenuItemsIdsWithPath.length;
				idsWithPathIndex++
			) {
				var current = straightenMenuItemsIdsWithPath[idsWithPathIndex];
				dictResult[current.id] = { path: current.path };
			}
			return dictResult;
		},

		_destroyOutdatedMenuItems: function (
			activeMenuItemsIdsWithPath,
			menuItemsDiffStatus
		) {
			var activeMenuItemsIds = Object.keys(activeMenuItemsIdsWithPath);
			for (
				var itemIdIndex = 0;
				itemIdIndex < activeMenuItemsIds.length;
				itemIdIndex++
			) {
				var itemId = activeMenuItemsIds[itemIdIndex];
				var itemToAdd = menuItemsDiffStatus[itemId];
				var activeItem = activeMenuItemsIdsWithPath[itemId];
				if (!itemToAdd || itemToAdd.path !== activeItem.path) {
					var menu = this.findMenu(itemId);
					if (menu) {
						menu.item.destroyRecursive(false);
					}
				}
			}
		},

		_loadMenuBarItem: function (menuItem, menuItemsDiffStatus) {
			var subMenu;
			var barItem;
			if (menuItemsDiffStatus[menuItem.id].state === 'added') {
				subMenu = new DropDownMenu({ id: menuItem.id + '$DropDownMenu' });

				barItem = new PopupMenuBarItem({
					id: menuItem.id,
					label: menuItem.name,
					popup: subMenu
				});
				var val = menuItem.style;
				if (val) {
					barItem.domNode.setAttribute(
						'style',
						barItem.domNode.getAttribute('style') + ';' + val
					);
				}
				val = menuItem.class;
				if (val) {
					val.split(' ').forEach(function (className) {
						if (className) {
							barItem.domNode.classList.add(className);
						}
					});
				}

				connect.connect(subMenu, 'onItemClick', this, '_itemClicked');
				this._mainMenu.addChild(barItem, menuItem.index);
				subMenu.setAttribute('class', 'menu_dropdown');
			} else {
				subMenu = this.findMenu(menuItem.id + '$DropDownMenu').item;
				barItem = this.findMenu(menuItem.id).item;
			}

			this._addMenu(menuItem, subMenu, menuItemsDiffStatus);
			if (0 === subMenu.getChildren().length) {
				barItem.set('disabled', true);
			}
			barItem.set('idx', menuItem.idx);
		},

		_itemClicked: function (item, evt) {
			if (!item.disabled) {
				var menuItem = new ArasMenuItem(item);
				if (
					'dijit.CheckedMenuItem' === item.declaredClass ||
					'dijit.RadioButtonMenuItem' === item.declaredClass
				) {
					this.onCheck(menuItem);
				} else {
					this.onSelect(menuItem);
				}
			}
		},

		onOpenItem: function (menuItemId) {},

		onCheck: function (menu) {
			//event when check Item menu
		},

		onSelect: function (menu) {
			//event when select Item
		},

		onShow: function () {},

		onLoad: function () {
			//event when load mainMenu
		},

		setXML: function (xmlArg, xmlArgType) {
			xmlArgType = xmlArgType || 'fileUrl';
			if (xmlArg) {
				var xmlText = '';
				switch (xmlArgType) {
					case 'fileUrl':
						var response = xhr.get({ url: xmlArg, sync: true });
						xmlArg = response.results[0];
						break;
					case 'xml':
						break;
					default:
						throw new Error('xmlArgType=' + xmlArgType + ' is not supported');
				}

				var xmldom = new XmlDocument();
				xmldom.loadXML(xmlArg);

				xmldom = xmldom.selectSingleNode('./menuapplet');
				var menuBarId = xmldom.getAttribute('show');
				if (!this._defaultMenuBarId) {
					this._defaultMenuBarId = menuBarId;
				}
				var menu = xmldom.selectNodes('./menubar');

				for (var i = 0; i < menu.length; i++) {
					var menuId =
						xmlArgType == 'fileUrl' ? menu[i].getAttribute('id') : menuBarId;
					this._menubars[menuId] = this._convertXmlToObject(
						menu[i].selectNodes('./menu')
					);
				}
			}
		},

		isMenuExist: function (menuId) {
			if (this._menubars[menuId]) {
				return true;
			}
			return false;
		},

		closePopup_Experimental: function () {
			this._mainMenu._closeChild();
		},

		getMenuBarById: function (menuBarId) {
			return this._menubars[menuBarId];
		}
	});
});
