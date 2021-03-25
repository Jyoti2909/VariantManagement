define([
	'./_lazyTreeGrid/LazyTreeGridWrapper',
	'./StructureItem',
	'./StructureMenu'
], function (LazyTreeGridWrapper, StructureItem, StructureMenu) {
	var _getTreeArgs = function (args) {
		var widgetDiv = document.getElementById(args.widgetDivId),
			parentDiv = widgetDiv.parentElement,
			parentDivId = parentDiv.getAttribute('id');

		if (!parentDivId) {
			parentDivId = 'structureTreeParent';
			parentDiv.setAttribute('id', parentDivId);
		}

		parentDiv.removeChild(widgetDiv);

		return {
			structure: [{ name: ' ', field: 'label', editable: true, width: '100%' }],
			noHeader: true,
			xmlItemPath: 'Item',
			xmlChildrenPath: 'relatedItems',
			idAttr: 'uniqueId',
			childrenAttr: 'childrens',
			useFakeExpandos: args.useFakeExpandos,
			imageUrlAttr: 'imageUrl',
			imageClassName: 'aras_lazytreegrid_icon',
			noImageClassName: 'aras_lazytreegrid_no_icon',
			imagesRelPath: '../../cbin/',
			dontHighlightOddRows: true,
			dontShowRowBorders: true,
			parentId: parentDivId,
			parseXmlNodeCustomly: StructureItem.prototype.parseXmlNode,
			eventListeners: args.eventListeners,
			fetchChildrenOnExpandAll: false
		};
	};

	var _newTree = function (args) {
		var treeArgs = _getTreeArgs(args);
		return new LazyTreeGridWrapper(treeArgs);
	};

	var _newMenu = function (widgetDivId) {
		return new StructureMenu({
			onMenuItemClick: function (commandId, structureItem) {
				dojo.publish(widgetDivId + '_OnMenuClick', [commandId, structureItem]);
			}
		});
	};

	var _Structure = function (args) {
		var _items = {},
			_hiddenItems = {},
			_childrenMap = {},
			_canEdit = false,
			_applyEditInProgress = false,
			_widgetDivId = args.id,
			_rowNodeIdPrefix = 'rowNode_',
			_eventHandler = null,
			_useFakeExpandos = false !== args.useFakeExpandos,
			_menu = _newMenu(_widgetDivId),
			_tree = _newTree({
				useFakeExpandos: _useFakeExpandos,
				widgetDivId: _widgetDivId,
				eventListeners: {
					onRowDblClick: function (itemId) {
						var structureItem = _items[itemId];
						if (structureItem && structureItem.enabled) {
							dojo.publish(_widgetDivId + '_OnDbClick', [structureItem]);
						}
					},
					onRowContextMenu: function (itemId, menuParams) {
						var structureItem = _items[itemId];
						if (structureItem && structureItem.enabled) {
							_menu.init(structureItem);
							if (_eventHandler.OnMenuShow(structureItem)) {
								_menu.show(menuParams);
							}
						}
					},
					canEdit: function (itemId) {
						return _canEdit;
					},
					onApplyEdit: function (itemId) {
						var structureItem, label, labelIsValid;
						if (!_applyEditInProgress) {
							_applyEditInProgress = true;
							structureItem = _items[itemId];
							label = _tree.getValue(itemId, 'label');
							labelIsValid = _eventHandler.OnNameEdit(2, structureItem, label);
							if (labelIsValid) {
								structureItem.label = label;
							} else {
								_tree.setValue(itemId, 'label', structureItem.label);
							}
						}
						_canEdit = false;
						_applyEditInProgress = false;
					},
					onCancelEdit: function (itemId) {
						_canEdit = false;
						_applyEditInProgress = false;
					},
					onStyleRow: function (itemId, row) {
						var structureItem = _items[itemId];
						if (structureItem.enabled) {
							if (structureItem.textColor) {
								row.customStyles += ' color: ' + structureItem.textColor + ';';
							}
						} else {
							row.customStyles += ' color: rgb(170, 170, 170);';
						}
					},
					onBuildRow: function (itemId, rowNode) {
						rowNode.style.display = _hiddenItems[itemId] ? 'none' : '';
					}
				}
			}),
			_root = null;
		var childUniqueId = 0;
		return {
			onSetItemProperty: _tree.setValue,

			setEventHandler: function (handler) {
				_eventHandler = handler;
				_tree.setChildrenFetchingExecuter(function (storeItem) {
					var structureItem = _items[storeItem.uniqueId[0]],
						strItemId = structureItem.id,
						childrenFromMap = _childrenMap[strItemId];
					if (childrenFromMap) {
						structureItem.addChildItemsFromJSON(childrenFromMap);
					} else {
						_eventHandler.OnOpenItem(structureItem);
						_childrenMap[strItemId] = structureItem.childrens;
					}
					return storeItem.childrens;
				});
			},

			generateUniqueId: function () {
				return 'id_' + childUniqueId++;
			},

			getMenu: function () {
				return _menu;
			},

			initXML: function (xmlText) {
				var xmlDoc = new XmlDocument(),
					rootXmlNode;
				xmlDoc.loadXML(xmlText);
				rootXmlNode = xmlDoc.selectSingleNode('Item');
				this._initRootItem(null, rootXmlNode);
			},

			_isItemVisible: function (itemId) {
				return !_hiddenItems[itemId];
			},

			_setItemVisibility: function (itemId, value) {
				if (value) {
					delete _hiddenItems[itemId];
				} else {
					_hiddenItems[itemId] = true;
				}
			},

			setLayout: function () {},

			enableFakeExpandosUsing: function (value) {
				_tree.enableFakeExpandosUsing(value);
			},

			_initRootItem: function (label, rootXmlNode) {
				var rootItemArgs = {
					structure: this,
					uniqueId: this.generateUniqueId(),
					label: label || null
				};

				if (_root) {
					this.removeAllItems();
				}

				_root = new StructureItem(rootItemArgs);
				_root.expand(false);

				if (rootXmlNode) {
					_tree.setUpdateEnabled(false);
					_root.initItem(rootXmlNode);
					_root.initChildrenRecursively(rootXmlNode);
					_tree.setUpdateEnabled(true, true);
				} else {
					_root.initEmptyItem();
				}

				return _root;
			},

			setRootItem: function (label) {
				return this._initRootItem(label);
			},

			getRootItem: function () {
				return _root;
			},

			getSelectedItem: function () {
				var selectedItemId = _tree.getSelectedId();
				return _items[selectedItemId];
			},

			selectItem: function (itemId) {
				_tree.selectRow(itemId);
			},

			setOpenState: function (itemId, state, withChildren) {
				_tree.setOpenState(itemId, state, withChildren);
			},

			expandAll: function () {
				_root._setExpandedStateRecursively(true, true);
				_tree.expandAll();
			},

			collapseAll: function () {
				_tree.collapseAll();
				_root._setExpandedStateRecursively(false, true);
			},

			refresh: function () {
				_tree.refresh();
			},

			editLabel: function (itemId) {
				_canEdit = true;
				_tree.setEditCell(itemId, 0);
			},

			removeAllItems: function () {
				_root = null;
				_items = {};
				_hiddenItems = {};
				_childrenMap = {};
				_tree.removeAllItems();
			},

			_addItems: function (items, parentId) {
				_tree.addObjects(items, parentId);
			},

			_addItemToCollection: function (item) {
				_items[item.uniqueId] = item;
			},

			_addItem: function (item) {
				_items[item.uniqueId] = item;

				_tree.addObject(
					{
						uniqueId: item.uniqueId,
						label: item.label,
						imageUrl: item.imageUrl
					},
					item.parent && item.parent.uniqueId
				);
			},

			_sortChildren: function (itemId, childrenIdsOrder) {
				_tree.sortChildren(itemId, childrenIdsOrder);
			},

			_removeItemFromStore: function (itemId) {
				_tree.removeItem(itemId);
			},

			_removeItemFromCollection: function (itemId) {
				delete _items[itemId];
				delete _hiddenItems[itemId];
			}
		};
	};

	return dojo.declare(
		'Aras.Client.Controls.Experimental.Structure',
		dijit._WidgetBase,
		{
			constructor: function (args) {
				var publicAPI = _Structure.call(this, args || {}),
					propName;
				for (propName in publicAPI) {
					this[propName] = publicAPI[propName];
				}
				StructureItem.prototype.generateUniqueId = this.generateUniqueId;
				StructureItem.prototype.onSetItemProperty = this.onSetItemProperty;
				dojo.publish(args.id + '_OnLoad', [{ sender: this }]);
			}
		}
	);
});
