define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/Tree',
	'./MainTreeModel',
	'./ContextMenu',
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/keys',
	'dojo/_base/event',
	'dojo/dom-style'
], function (
	declare,
	connect,
	Tree,
	MainTreeModel,
	ContextMenu,
	array,
	lang,
	keys,
	event,
	domStyle
) {
	var TreeNode = declare('', [dijit._TreeNode], {
		// Overridden from dojo
		_setIndentAttr: function (indent) {
			var newIndent = 0;
			for (var key in this.tree.model._items) {
				if (
					this.item.userdata &&
					this.item.userdata.itName &&
					this.tree.model._items[key].id == this.item.userdata.itName &&
					this.tree.model._items[key].openIcon != '../cbin/'
				) {
					newIndent = 8;
					break;
				}
			}
			var pixels =
				Math.max(indent, 0) * this.tree._nodePixelIndent + newIndent + 'px';

			domStyle.set(this.domNode, 'backgroundPosition', pixels + ' 0px');
			domStyle.set(
				this.rowNode,
				this.isLeftToRight() ? 'paddingLeft' : 'paddingRight',
				pixels
			);

			array.forEach(this.getChildren(), function (child) {
				child.set('indent', indent + 1);
			});

			this._set('indent', indent);
		},
		_setLabelAttr: { node: 'labelNode', type: 'innerHTML' }
	});

	return declare('Aras.Client.Controls.Experimental.Tree', null, {
		xml: null,

		_model: null,
		_tree: null,
		contextMenu: null,
		IconPath: null,

		constructor: function (args, connectId) {
			this.IconPath = args.IconPath;
			this._model = new MainTreeModel(this.IconPath);
			this.contextMenuCallback = args.contextMenuCallback;

			this._tree = new Tree({
				model: this._model,
				showRoot: false,
				persist: !!args.persist,
				id: args.id,
				getIconStyle: function (item, opened) {
					var customStyle =
						args.getIconStyle && args.getIconStyle(item, opened);
					if (customStyle) {
						return customStyle;
					}

					var iconurl = opened ? item.openIcon : item.closedIcon;
					if (iconurl) {
						iconurl = dojoConfig.arasContext.adjustIconUrl(iconurl);
						var isZeroSize = args.allowEmptyIcon && iconurl == '../cbin/';
						var size = isZeroSize ? '0px' : '22px';
						var backgroundImage = 'url(' + iconurl + ')',
							tmpIcon,
							i;
						if (!isZeroSize && item.iconsMultiple) {
							for (i = 0; i < item.iconsMultiple.length; i++) {
								tmpIcon = dojoConfig.arasContext.adjustIconUrl(
									item.iconsMultiple[i]
								);
								tmpIcon = 'url(' + tmpIcon + ')';
								backgroundImage = tmpIcon + ',' + backgroundImage;
							}
						}
						return {
							backgroundImage: backgroundImage,
							backgroundSize: '22px 22px',
							backgroundPosition: 'center center',
							height: size,
							width: size
						};
					}
				},
				// Overridden from dojo
				_createTreeNode: function (/*Object*/ args) {
					// summary:
					//		creates a TreeNode
					// description:
					//		Developers can override this method to define their own TreeNode class;
					//		However it will probably be removed in a future release in favor of a way
					//		of just specifying a widget for the label, rather than one that contains
					//		the children too.

					return new TreeNode(args);
				}
			});

			this._tree.dndController.singular = true;
			if (lang.isString(connectId)) {
				document.getElementById(connectId).appendChild(this._tree.domNode);
			} else if (connectId) {
				connectId.appendChild(this._tree.domNode);
			}
			this._tree.startup();

			connect.connect(this._tree, 'onOpen', this, this._processOnOpen);
			connect.connect(this._tree, 'onClose', this, this._processOnClose);
			connect.connect(this._tree, 'onClick', this, function (item) {
				var action = item.action || [],
					arg0 = action[0] || '',
					arg1 = action[1] || '',
					arg2 = action[2] || '';
				this.itemSelect(item.id, false, item.userdata);
				this.itemClick(arg0, arg1, arg2, item.id);
			});
			connect.connect(this._tree, 'onDblClick', this, function (item) {
				this.itemDoubleClick(item.id);
			});
			var closeContextMenu = lang.hitch(this, function () {
				dijit.popup.close(this.contextMenu.menu);
			});
			connect.connect(
				this._tree.domNode,
				'contextmenu',
				this,
				this.contextMenuCallback
					? this.contextMenuCallback.bind(this, event, closeContextMenu)
					: function (evt) {
							var aWidget = dijit.getEnclosingWidget(evt.target),
								id = aWidget && aWidget.item ? aWidget.getIdentity() : '',
								item = this._model.fetchItemByIdentity(id),
								mouseButtonWasClicked = evt.pageX && evt.pageY;

							if (item) {
								if (
									!(
										this._tree.selectedItem &&
										this._tree.selectedItem.id === item.id
									)
								) {
									this.selectItem(item.id);
									this.itemSelect(item.id, false);
								}
								this.contextMenu.rowId = item.id;
								if (
									mouseButtonWasClicked &&
									this.menuInit(item.id, aWidget.item.userdata)
								) {
									connect.connect(
										this.contextMenu.menu,
										'onBlur',
										closeContextMenu
									);
									dijit.popup.open({
										popup: this.contextMenu.menu,
										parent: this._tree,
										x: evt.pageX,
										y: evt.pageY
									});
									this.contextMenu.menu.domNode.focus();
								} else {
									closeContextMenu();
								}
							}
							event.stop(evt);
					  }
			);

			this.contextMenu = new ContextMenu(this._tree.domNode, true);
			connect.connect(this.contextMenu, 'onItemClick', this, function (
				cmdID,
				rowID
			) {
				this.menuClick(cmdID, rowID);
				closeContextMenu();
			});
			connect.connect(this.contextMenu.menu, 'onKeyPress', function (evt) {
				if (keys.ESCAPE === evt.keyCode) {
					closeContextMenu();
				}
			});
		},

		_processOnOpen: function (item, node) {
			// Set Item to Open
			item.open = true;

			// Trigger Event
			this.TreeGridOpenNode(item.id);
		},

		_processOnClose: function (item, node) {
			// Set Item to Open
			item.open = false;

			// Trigger Event
			this.TreeGridCloseNode(item.id);
		},

		TreeGridOpenNode: function (rowID) {},

		TreeGridCloseNode: function (rowID) {},

		GridXmlLoaded: function (isSuccess) {},

		menuInit: function (rowId, userdata) {
			//this event fire when rigth click on item
		},

		menuClick: function (cmdID, rowID) {
			//this event fire when click on contextMenu
		},

		itemSelect: function (rowID, multi, userdata) {
			//this event fire when select item
		},

		itemClick: function (arg0, arg1, arg2, rowId) {
			// summary: this event fires when item click
		},

		itemDoubleClick: function (rowId) {
			//summary: this event fires when item double click
		},

		GetRootItemsCount: function () {
			return this._tree ? grid._items[0].children.length : 0;
		},

		SetRowHasChildren: function (RowID) {
			throw 'SetRowHasChildren: Not Implemented';
		},

		InsertNewChild: function (parent_id, new_id, text, action, icon0, icon1) {
			throw 'InsertNewChild: Not Implemented';
		},

		InsertNewNext: function (parent_id, new_id, text, action, icon0, icon1) {
			throw 'InsertNewNext: Not Implemented';
		},

		InsertRoot: function (new_id, text, action, icon0, icon1) {
			throw 'InsertRoot: Not Implemented';
		},

		AddRow: function (new_id, text, action) {
			throw 'AddRow: Not Implemented';
		},

		IsRowBold: function (rowID) {
			throw 'IsRowBold: Not Implemented';
		},

		SetRowIcons: function (id, icon1, icon2) {
			throw 'SetRowIcons: Not Implemented';
		},

		GetCheckedItemIds: function (separator, _parent, all) {
			throw 'GetCheckedItemIds: Not Implemented';
		},

		SetChecked: function (id, value_Renamed, child) {
			throw 'SetChecked: Not Implemented';
		},

		IsChecked: function (id) {
			throw 'IsChecked: Not Implemented';
		},

		GetParentId: function (id) {
			var thisitem = this._model.fetchItemByIdentity(id);

			if (thisitem) {
				var allItems = this._model._items;
				for (var i = 0; i < allItems.length; i++) {
					if (-1 < allItems[i].children.indexOf(thisitem)) {
						return allItems[i].id;
					}
				}
			}
		},

		getParentId: function (id) {
			return this.GetParentId(id);
		},

		GetChildId: function (id) {
			throw 'GetChildId: Not Implemented';
		},

		GetPrevId: function (id) {
			throw 'GetPrevId: Not Implemented';
		},

		GetNextId: function (id) {
			throw 'GetNextId: Not Implemented';
		},

		OpenItem: function (id) {
			// Get Item
			var thisitem = this._model.fetchItemByIdentity(id);

			if (thisitem) {
				// Select Item in Tree
				var itemNode = this._tree._itemNodesMap[thisitem.id];

				var element = itemNode[0].domNode;

				// TODO: Reimplement without calling such event
				var evt = { target: element };
				evt.preventDefault = evt.stopPropagation = function () {};

				this._tree._onClick(itemNode[0], evt);
			}
		},

		openItem: function (id) {
			return this.OpenItem(id);
		},

		CloseItem: function (id) {
			throw 'CloseItem: Not Implemented';
		},

		UpdateItem: function (id) {
			throw 'UpdateItem: Not Implemented';
		},

		GetOpenedItems: function (d) {
			var openItems = [];
			array.forEach(
				this._model.items,
				function (item) {
					if (item.open === true) {
						openItems.push(item.id);
					}
				},
				this
			);

			return openItems.join(d);
		},

		getOpenedItems: function (d) {
			return this.GetOpenedItems(d);
		},

		GetAllExpandedItems: function () {
			throw 'GetAllExpandedItems: Not Implemented';
		},

		GetAllItems: function () {
			return this._model._items;
		},

		GetChildItemsCount: function (id) {
			throw 'GetChildItemsCount: Not Implemented';
		},

		GetChildItemsId: function (id, all, separator) {
			throw 'GetChildItemsId: Not Implemented';
		},

		InitXML: function (doc) {
			// Load XML into Tree Model
			var ret = this._model.setXML(doc);

			// Trigger Event to show XML Loaded
			this.GridXmlLoaded(ret);
		},

		initXML: function (doc) {
			this.InitXML(doc);
		},

		GetXml: function (useValues, withSubRows) {
			throw 'GetXml: Not Implemented';
		},

		PasteRow: function (id, pid, after) {
			throw 'PasteRow: Not Implemented';
		},

		GetLevel: function (id) {
			throw 'GetLevel: Not Implemented';
		},

		FindRowByLabel: function (label) {
			throw 'FindRowByLabel: Not Implemented';
		},

		HideRow: function (id) {
			var row = treeControl._tree.getNodesByItem(id)[0];
			if (row) {
				row.domNode.style.display = 'none';
			}
		},

		ShowRow: function (id) {
			var row = treeControl._tree.getNodesByItem(id)[0];
			if (row) {
				row.domNode.style.display = '';
			}
		},

		ExpandAll: function () {
			this._tree.expandAll();
		},

		CollapseAll: function () {
			this._tree.collapseAll();
		},

		getSelectedId: function () {
			return this._tree.selectedItem ? this._tree.selectedItem.id : null;
		},

		IsItemExists: function (id) {
			var thisitem = this._model.fetchItemByIdentity(id);

			if (thisitem == null) {
				return false;
			} else {
				return true;
			}
		},

		isItemExists: function (id) {
			return this.IsItemExists(id);
		},

		GetUserData: function (id, key) {
			var thisitem = this._model.fetchItemByIdentity(id);

			if (thisitem == null) {
				return null;
			} else {
				if (thisitem.userdata == null) {
					return null;
				} else {
					return thisitem.userdata[key];
				}
			}
		},

		selectItem: function (rowID) {
			if (this._tree.selectedItem && this._tree.selectedItem.id === rowID) {
				return;
			}
			var _getAncestorsAndSelf = function (childRowId, _chain) {
					_chain = _chain || [];
					_chain.unshift(this._model.fetchItemByIdentity(childRowId));
					var parentRowId = this.getParentId(childRowId);
					if (parentRowId) {
						_getAncestorsAndSelf.call(this, parentRowId, _chain);
					}
					return _chain;
				},
				ancestorsAndSelf = _getAncestorsAndSelf.call(this, rowID);
			this._tree.set('path', ancestorsAndSelf);
		},

		deselect: function () {
			this._tree.dndController.selectNone();
		},

		reload: function (newXml) {
			this._tree.dndController.selectNone();
			// Close the store (So that the store will do a new fetch()).
			if (this._tree.model.store) {
				this._tree.model.store.clearOnClose = true;
				this._tree.model.store.close();
			}

			// Completely delete every node from the dijit.Tree
			this._tree._itemNodesMap = {};
			this._tree.rootNode.state = 'UNCHECKED';
			if (this._tree.model.root) {
				this._tree.model.root.children = null;
			}

			// Destroy the widget
			this._tree.rootNode.destroyRecursive();

			// Recreate the model, (with the model again)
			this.InitXML(newXml);

			// Rebuild the tree
			this._tree.postMixInProperties();
			this._tree._load();
		}
	});
});
