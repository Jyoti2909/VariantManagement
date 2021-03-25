define([
	'dojo/_base/declare',
	'dojo/_base/array',
	'./MainTreeItem',
	'dojox/xml/parser',
	'dojo/string'
], function (declare, array, MainTreeItem, DomParser, string) {
	return declare('Aras.Client.Controls.Experimental.MainTreeModel', null, {
		XML: null,

		_root: null,
		_items: null,
		_itemcnt: null,
		_dom: null,
		_iconPath: null,
		_icon0: null,
		_icon1: null,
		_firstInit: true,

		constructor: function (IconPath) {
			// Set Icon Path
			this._iconPath = IconPath || './';
			this._firstInit = true;

			// Initialise Items
			this._initItems();
		},

		_addItem: function (
			id,
			label,
			openIcon,
			closedIcon,
			userdata,
			action,
			iconsMultiple
		) {
			this._items[this._itemcnt] = new MainTreeItem(
				id,
				label,
				openIcon,
				closedIcon,
				userdata,
				action,
				iconsMultiple
			);
			this._itemcnt++;
			return this._items[this._itemcnt - 1];
		},

		_initItems: function () {
			// Reset Item Array and Count
			this._items = [];
			this._itemcnt = 0;

			// Add Root Item
			return this._addItem('root', 'Root', null, null, null);
		},

		_processTreeItem: function (root, node) {
			// Get ID
			var id = node.getAttribute('id');

			// Get Label
			var label = '';
			var userdata = null;

			array.forEach(
				node.childNodes,
				function (childnode) {
					if (childnode.nodeName == 'td') {
						// only leaf can be richs
						if (userdata && userdata.format == 'rich') {
							array.forEach(
								childnode.childNodes,
								function (contentNode) {
									label += string.trim(DomParser.innerXML(contentNode));
								},
								this
							);
						} else {
							label = DomParser.textContent(childnode);
						}
					} else if (childnode.nodeName == 'userdata') {
						if (userdata == null) {
							userdata = {};
						}

						userdata[childnode.getAttribute('key')] = childnode.getAttribute(
							'value'
						);
					}
				},
				this
			);

			// Get Icon0
			var openIcon = node.getAttribute('icon0');
			if (!openIcon) {
				// Use default Icon
				openIcon = this._icon0;
			} else {
				openIcon = this._iconPath + openIcon;
			}

			// Get Icon1
			var closedIcon = node.getAttribute('icon1');
			if (!closedIcon) {
				// Use default Icon
				closedIcon = this._icon1;
			} else {
				closedIcon = this._iconPath + closedIcon;
			}

			//Get Action
			var actionValue = node.getAttribute('action');
			var action = [];
			if (actionValue) {
				actionValue = actionValue.replace(/\'/g, '');
				action = actionValue.split(',');
			}

			var iconsMultiple = node.getAttribute('iconsMultiple');

			// Create Menu Item
			var newRowObject = this._addItem(
				id,
				label,
				openIcon,
				closedIcon,
				userdata,
				action,
				iconsMultiple
			);
			root.children.push(newRowObject);

			// Process Children
			array.forEach(
				node.childNodes,
				function (childnode) {
					if (childnode.nodeName == 'tr') {
						this._processTreeItem(newRowObject, childnode);
					}
				},
				this
			);

			// Trigger Event to show Root has changed
			this.onChildrenChange(root, root.children);
		},

		setXML: function (XML) {
			function populateChildIdToParentId(parentNode, childIdToParentId) {
				var children = parentNode.children;
				for (var i = 0; children && i < children.length; i++) {
					childIdToParentId[children[i].id] = parentNode.id;
					populateChildIdToParentId(children[i], childIdToParentId);
				}
			}
			function itemChanged(oldItem, newItem) {
				var prop;
				for (prop in oldItem) {
					if (
						'function' !== typeof oldItem[prop] &&
						'object' !== typeof oldItem[prop] &&
						newItem[prop] !== oldItem[prop]
					) {
						return true;
					}
				}
				return false;
			}

			// Initialise Items
			var oldItems = this._items;
			var root = this._initItems();

			// Store XML
			this.XML = XML;

			// Parse XML
			this._dom = DomParser.parse(this.XML);

			// Find table node
			var tableNodes = this._dom.getElementsByTagName('table');
			if (tableNodes && tableNodes.length == 1) {
				var tableNd = tableNodes[0];
				// Get default Icons
				if (tableNd.getAttribute('icon0') === '') {
					this._icon0 = null;
				} else {
					this._icon0 = this._iconPath + tableNd.getAttribute('icon0');
				}

				if (tableNd.getAttribute('icon1') === '') {
					this._icon1 = null;
				} else {
					this._icon1 = this._iconPath + tableNd.getAttribute('icon1');
				}

				// Process each Item in Table
				array.forEach(
					tableNd.childNodes,
					function (node) {
						if (node.nodeName == 'tr') {
							this._processTreeItem(root, node);
						}
					},
					this
				);
			}

			if (this._firstInit) {
				this._firstInit = false;
				//nothing to change because of it is original setXML
				return;
			}

			var i,
				j,
				oldItemIdsToParentId = {},
				newItemIdsToParentId = {};
			populateChildIdToParentId(oldItems[0], oldItemIdsToParentId);
			populateChildIdToParentId(this._items[0], newItemIdsToParentId);

			var item,
				newItems = {};
			for (i = 0; i < this._items.length; i++) {
				item = this._items[i];
				newItems[item.id] = item;
			}

			for (var step = 1; step < 3; step++) {
				var itemsSet = step == 1 ? oldItems : this._items;
				for (i = itemsSet.length - 1; i >= 0; i--) {
					var itemId = itemsSet[i].id;
					var oldParentId = oldItemIdsToParentId[itemId];
					var newParentId = newItemIdsToParentId[itemId];
					if (oldParentId === newParentId) {
						if (1 === step && itemChanged(oldItems[i], newItems[itemId])) {
							this.onChange(newItems[itemId]);
						}
					} else {
						if (step == 1) {
							this.onDelete(oldItems[i]);
						}
						var newParentItem = null,
							oldParentItem = null;

						for (var k = 0; k < this._items.length; k++) {
							item = this._items[k];
							if (!newParentItem && item.id == newParentId) {
								newParentItem = item;
							}
							if (!oldParentItem && item.id == oldParentId) {
								oldParentItem = item;
							}
						}
						if (oldParentItem) {
							this.onChildrenChange(oldParentItem, oldParentItem.children);
							this.onChange(oldParentItem, oldParentItem.children);
						}
						if (newParentItem) {
							this.onChildrenChange(newParentItem, newParentItem.children);
							this.onChange(newParentItem);
						}
					}
				}
			}

			return true;
		},

		getRoot: function (onItem) {
			// Return Root Item
			onItem(this._items[0]);
		},

		getIdentity: function (item) {
			return item.id;
		},

		getLabel: function (item) {
			return item.label;
		},

		mayHaveChildren: function (item) {
			return item.children.length > 0;
		},

		getChildren: function (parentItem, onComplete) {
			onComplete(parentItem.children);
		},

		isItem: function (something) {
			return true;
		},

		fetchItemByIdentity: function (id) {
			var ret = null;

			array.forEach(
				this._items,
				function (item) {
					if (item.id == id) {
						ret = item;
					}
				},
				this
			);
			return ret;
		},

		fetchItemByLabel: function (label) {
			var ret = null;

			array.forEach(
				this._items,
				function (item) {
					if (item.label == label) {
						ret = item;
					}
				},
				this
			);
			return ret;
		},

		onChange: function (item) {},

		onChildrenChange: function (parent, newChildrenList) {}
	});
});
