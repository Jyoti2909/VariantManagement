define([
	'dojo/data/ItemFileWriteStore',
	'dojox/grid/LazyTreeGridStoreModel',
	'./LazyTreeGridSubclass',
	'./EventsWrapper'
], function (
	ItemFileWriteStore,
	LazyTreeGridStoreModel,
	LazyTreeGridSubclass,
	EventsWrapper
) {
	var _isArray = Array.isArray;

	/*
		args: {
			xmlItemPath,
			xmlChildrenPath (""),
			idAttr ("id"),
			childrenAttr ("children"),
			useFakeExpandos (false),
			imageUrlAttr ("imageUrl"),
			imageClassName (""),
			noImageClassName (""),
			imagesRelPath (""),
			dontHighlightOddRows (false),
			dontShowRowBorders (false),
			structure ([]),
			itemsArray ([]),
			noHeader (false),
			parentId,
			parseXmlNodeCustomly,
			loadItemData (set by default as _loadItemData),
			fetchChildren,
			cachedRowsCount (100),
			expandAllByDefault (false),
			rowsUpdateEnabled (true),
			eventListeners,
			multipleSelection (false),
			fetchChildrenOnExpandAll (true)
		}
	*/
	var _LazyTreeGridWrapper = function (args) {
		/* Private API */
		var _control = null,
			_events = null,
			_store = null,
			_store__storeRefPropName = '',
			_store__rootItemPropName = '',
			_store__itemNumPropName = '',
			_xmlItemPath = args.xmlItemPath,
			_xmlChildrenPath = args.xmlChildrenPath + '/' + _xmlItemPath,
			_idAttr = args.idAttr || 'id',
			_childrenAttr = args.childrenAttr || 'children',
			_fakeChildrenValue = !!args.useFakeExpandos,
			_imageUrlAttr = args.imageUrlAttr || 'imageUrl',
			_rowsUpdateEnabled = false !== args.rowsUpdateEnabled,
			_newStore = function (itemsArray) {
				_store = new ItemFileWriteStore({
					data: {
						identifier: _idAttr,
						items: itemsArray || []
					}
				});
				_store__storeRefPropName = _store._storeRefPropName;
				_store__rootItemPropName = _store._rootItemPropName;
				_store__itemNumPropName = _store._itemNumPropName;
				return _store;
			},
			_newModel = function (itemsArray) {
				return new LazyTreeGridStoreModel({
					deferItemLoadingUntilExpand: true,
					childrenAttrs: [_childrenAttr],
					store: _newStore(itemsArray)
				});
			},
			_loadItemData =
				args.loadItemData ||
				function (itemId, itemData) {
					var item = _store._itemsByIdentity[itemId],
						propName,
						propValue;
					for (propName in itemData) {
						propValue = itemData[propName];
						if (propValue) {
							item[propName] = [propValue];
						} else if (!item[propName]) {
							item[propName] = [];
						}
					}
				},
			_initControl = function (wrapperArgs) {
				var controlDomNode, controlParentDomNode;
				_control = new LazyTreeGridSubclass({
					idAttr: _idAttr,
					childrenAttr: _childrenAttr,
					imageUrlAttr: _imageUrlAttr,
					imageClassName: wrapperArgs.imageClassName,
					noImageClassName: wrapperArgs.noImageClassName,
					imagesRelPath: wrapperArgs.imagesRelPath,
					dontHighlightOddRows: wrapperArgs.dontHighlightOddRows,
					dontShowRowBorders: wrapperArgs.dontShowRowBorders,
					structure: wrapperArgs.structure || [],
					treeModel: _newModel(wrapperArgs.itemsArray),
					loadItemData: _loadItemData,
					fetchChildren: wrapperArgs.fetchChildren,
					cachedRowsCount: wrapperArgs.cachedRowsCount,
					expandAllByDefault: wrapperArgs.expandAllByDefault,
					rowsUpdateEnabled: wrapperArgs.rowsUpdateEnabled,
					multipleSelection: wrapperArgs.multipleSelection,
					fetchChildrenOnExpandAll: wrapperArgs.fetchChildrenOnExpandAll
				});

				_events = new EventsWrapper(_control, wrapperArgs.eventListeners);

				if (wrapperArgs.noHeader) {
					_control.removeHeaderRow();
				}
				if (wrapperArgs.parentId) {
					controlDomNode = _control.domNode;
					controlDomNode.style.height = '100%';
					controlParentDomNode = document.getElementById(wrapperArgs.parentId);
					controlParentDomNode.appendChild(controlDomNode);
					window.addEventListener(
						'resize',
						function () {
							_control.resize();
						},
						false
					);
				}
				_control.startup();
			},
			_addReferenceToMap = function (refItem, parentItem, attribute) {
				/* this function code represents dojo.data.ItemFileWriteStore._addReferenceToMap-method code changed for better performance */
				var parentId = parentItem[_idAttr][0],
					references =
						refItem[_store._reverseRefMap] ||
						(refItem[_store._reverseRefMap] = {}),
					itemRef = references[parentId] || (references[parentId] = {});
				itemRef[attribute] = true;
			},
			_newRootItem = function (object) {
				/* this function code represents dojo.data.ItemFileWriteStore.newItem-method code changed for better performance */
				var id = object[_idAttr],
					newItem = {},
					propName,
					propValue,
					propValueCount,
					i;

				if (_store._saveInProgress) {
					throw new Error('assertion failed in ItemFileWriteStore');
				}
				if (!_store._loadFinished) {
					_store._forceLoad();
				}
				if ('undefined' !== typeof _store._pending._newItems[id]) {
					delete _store._pending._newItems[id];
					delete _store._pending._deletedItems[id];
					delete _store._pending._modifiedItems[id];
				}

				newItem[_store__storeRefPropName] = _store;
				newItem[_store__itemNumPropName] = _store._arrayOfAllItems.length;
				newItem[_idAttr] = [id];
				newItem[_childrenAttr] = [];
				newItem[_store__rootItemPropName] = true;
				_store._arrayOfTopLevelItems[
					_store._arrayOfTopLevelItems.length
				] = _store._pending._newItems[id] = _store._itemsByIdentity[
					id
				] = _store._arrayOfAllItems[_store._arrayOfAllItems.length] = newItem;

				for (propName in object) {
					propValue = object[propName];
					if (!(propValue instanceof Array)) {
						propValue = [propValue];
					}
					newItem[propName] = propValue;
					propValueCount = propValue.length;
					for (i = 0; i < propValueCount; i++) {
						if (_store.isItem(propValue[i])) {
							_addReferenceToMap(propValue[i], newItem, propName);
						}
					}
				}

				_control._onNew(newItem, null);

				return newItem;
			},
			_newRootItems = function (objects) {
				var objectsCount = objects.length,
					newItems = [],
					i,
					object,
					id,
					newItem,
					propName,
					propValue,
					propValueCount,
					j;

				for (i = 0; i < objectsCount; i++) {
					object = objects[i];
					id = object[_idAttr];

					if (_store._saveInProgress) {
						throw new Error('assertion failed in ItemFileWriteStore');
					}
					if (!_store._loadFinished) {
						_store._forceLoad();
					}
					if ('undefined' !== typeof _store._pending._newItems[id]) {
						delete _store._pending._newItems[id];
						delete _store._pending._deletedItems[id];
						delete _store._pending._modifiedItems[id];
					}

					newItem = {};
					newItem[_store__storeRefPropName] = _store;
					newItem[_store__itemNumPropName] = _store._arrayOfAllItems.length;
					newItem[_idAttr] = [id];
					newItem[_childrenAttr] = [];
					newItem[_store__rootItemPropName] = true;

					_store._arrayOfTopLevelItems[
						_store._arrayOfTopLevelItems.length
					] = _store._pending._newItems[id] = _store._itemsByIdentity[
						id
					] = _store._arrayOfAllItems[_store._arrayOfAllItems.length] = newItem;

					for (propName in object) {
						propValue = object[propName];
						if (!(propValue instanceof Array)) {
							propValue = [propValue];
						}
						newItem[propName] = propValue;
						propValueCount = propValue.length;
						for (j = 0; j < propValueCount; j++) {
							if (_store.isItem(propValue[j])) {
								_addReferenceToMap(propValue[j], newItem, propName);
							}
						}
					}
					newItems[newItems.length] = newItem;
				}
				_control._onNewRange(newItems, null);
			},
			_newItem = function (id, object, parentItem) {
				/* this function code represents dojo.data.ItemFileWriteStore.newItem-method code changed for better performance */
				var newItem = {},
					parentChildren =
						parentItem[_childrenAttr] || (parentItem[_childrenAttr] = []),
					propName,
					propValue,
					propValueCount,
					i,
					parentInfo;
				if (true === parentChildren[0]) {
					parentChildren = parentItem[_childrenAttr] = [];
				}

				if (_store._saveInProgress) {
					throw new Error('assertion failed in ItemFileWriteStore');
				}
				if (!_store._loadFinished) {
					_store._forceLoad();
				}
				if ('undefined' !== typeof _store._pending._newItems[id]) {
					delete _store._pending._newItems[id];
					delete _store._pending._deletedItems[id];
					delete _store._pending._modifiedItems[id];
				}

				newItem[_store__storeRefPropName] = _store;
				newItem[_store__itemNumPropName] = _store._arrayOfAllItems.length;
				newItem[_idAttr] = [id];
				parentChildren[parentChildren.length] = _store._pending._newItems[
					id
				] = _store._itemsByIdentity[id] = _store._arrayOfAllItems[
					_store._arrayOfAllItems.length
				] = newItem;
				_addReferenceToMap(newItem, parentItem, _childrenAttr);

				for (propName in object) {
					propValue = object[propName];
					if (!(propValue instanceof Array)) {
						propValue = [propValue];
					}
					newItem[propName] = propValue;
					propValueCount = propValue.length;
					for (i = 0; i < propValueCount; i++) {
						if (_store.isItem(propValue[i])) {
							_addReferenceToMap(propValue[i], newItem, propName);
						}
					}
				}

				parentInfo = {
					item: parentItem,
					attribute: _childrenAttr,
					newValue: parentChildren
				};
				_control._onNew(newItem, parentInfo);

				return newItem;
			},
			_newItems = function (objects, parentItem) {
				var parentChildren =
						parentItem[_childrenAttr] || (parentItem[_childrenAttr] = []),
					objectsCount = objects.length,
					_storePendingNewItems = _store._pending._newItems,
					_storePendingDeletedItems = _store._pending._deletedItems,
					_storePendingModifiedItems = _store._pending._modifiedItems,
					newItems = [],
					object,
					id,
					newItem,
					propName,
					propValue,
					propValueCount,
					i,
					j;

				if (true === parentChildren[0]) {
					parentChildren = parentItem[_childrenAttr] = [];
				}
				if (_store._saveInProgress) {
					throw new Error('assertion failed in ItemFileWriteStore');
				}
				if (!_store._loadFinished) {
					_store._forceLoad();
				}

				for (i = 0; i < objectsCount; i++) {
					object = objects[i];
					id = object[_idAttr];

					if ('undefined' !== typeof _storePendingNewItems[id]) {
						delete _storePendingNewItems[id];
						delete _storePendingDeletedItems[id];
						delete _storePendingModifiedItems[id];
					}

					newItem = {};
					newItem[_store__storeRefPropName] = _store;
					newItem[_store__itemNumPropName] = _store._arrayOfAllItems.length;
					newItem[_idAttr] = [id];

					parentChildren[parentChildren.length] = _storePendingNewItems[
						id
					] = _store._itemsByIdentity[id] = _store._arrayOfAllItems[
						_store._arrayOfAllItems.length
					] = newItem;
					_addReferenceToMap(newItem, parentItem, _childrenAttr);

					for (propName in object) {
						propValue = object[propName];
						if (!(propValue instanceof Array)) {
							propValue = [propValue];
						}
						newItem[propName] = propValue;
						propValueCount = propValue.length;
						for (j = 0; j < propValueCount; j++) {
							if (_store.isItem(propValue[j])) {
								_addReferenceToMap(propValue[j], newItem, propName);
							}
						}
					}
					newItems[newItems.length] = newItem;
				}

				_control._onNewRange(newItems, {
					item: parentItem,
					attribute: _childrenAttr,
					newValue: parentChildren
				});
			},
			_addItemFromObject = function (object, parentItem) {
				var id = object[_idAttr],
					emptyObject = {},
					item;

				_control.deferItemDataLoading(object);
				emptyObject[_idAttr] = id;
				emptyObject[_childrenAttr] = _fakeChildrenValue || [];
				item = _newItem(id, emptyObject, parentItem);
				return item;
			},
			//non-recursive method
			_addItemsFromObjects = function (objects, parentItem) {
				var objectsCount = objects.length,
					emptyObjects = [],
					i,
					object,
					emptyObject;

				for (i = 0; i < objectsCount; i++) {
					object = objects[i];

					emptyObject = {};
					emptyObject[_idAttr] = object[_idAttr];
					emptyObject[_childrenAttr] = _fakeChildrenValue || [];

					emptyObjects[emptyObjects.length] = emptyObject;

					_control.deferItemDataLoading(object);
				}
				_newItems(emptyObjects, parentItem);
			},
			_parseXmlNodeCustomly = args.parseXmlNodeCustomly,
			_parseXmlNodeToObject,
			_getXmlNodeChildren;

		_parseXmlNodeToObject = function (xmlNode) {
			var object = _parseXmlNodeCustomly(xmlNode);
			object[_childrenAttr] = _getXmlNodeChildren(xmlNode);
			return object;
		};

		_getXmlNodeChildren = function (xmlNode) {
			var childrenXmlNodes = xmlNode.selectNodes(_xmlChildrenPath),
				childrenXmlNodesCount = childrenXmlNodes.length,
				children = [],
				childObject,
				i;
			for (i = 0; i < childrenXmlNodesCount; i++) {
				childObject = _parseXmlNodeToObject(childrenXmlNodes[i]);
				children.push(childObject);
			}
			return children;
		};

		var _addItemFromXmlNode = function (xmlNode, parentItem) {
				var object = _parseXmlNodeToObject(xmlNode),
					id = object[_idAttr],
					childrenXmlNodes = xmlNode.selectNodes(_xmlChildrenPath),
					childrenXmlNodesCount = childrenXmlNodes.length,
					emptyObject = {},
					item,
					childrenCount,
					i;
				_control.deferItemDataLoading(object);
				emptyObject[_idAttr] = id;
				emptyObject[_childrenAttr] = _fakeChildrenValue || [];
				item = _newItem(id, emptyObject, parentItem);
				for (i = 0; i < childrenXmlNodesCount; i++) {
					_addItemFromXmlNode(childrenXmlNodes[i], item);
				}
				return item;
			},
			_removeItem = function (item) {
				var children = item[_childrenAttr],
					childrenCount,
					i;
				if (children && true !== children[0]) {
					childrenCount = children.length;
					for (i = 0; i < childrenCount; i++) {
						_removeItem(children[i]);
					}
				}
				_store.deleteItem(item);
				_control.removeExtraData(item[_idAttr][0]);
			},
			_getRowIndex = function (id) {
				var rowsByIndex = _control._by_idx,
					rowsByIndexCount = rowsByIndex.length,
					i;
				for (i = 0; i < rowsByIndexCount; i++) {
					if (id === rowsByIndex[i].idty) {
						return i;
					}
				}
				return -1;
			};

		if (!_xmlItemPath || !_parseXmlNodeCustomly) {
			throw new Error(
				'Not all required arguments were passed to LazyTreeGridWrapper-constructor!'
			);
		}

		_initControl(args);

		/* Public API */
		return {
			getItem: function (id) {
				return _store._itemsByIdentity[id];
			},

			getValue: function (id, propName, getValueAsArray) {
				var item = _store._itemsByIdentity[id];
				return getValueAsArray ? item[propName] : item[propName][0];
			},

			getSelectedId: function () {
				var selectedItem = _control.selection.getFirstSelected();
				return selectedItem && selectedItem[_idAttr][0];
			},

			getSelectedIds: function () {
				var selectedItems = _control.selection.getSelected(),
					selectedItemsCount = selectedItems.length,
					selectedIds = [],
					i;
				for (i = 0; i < selectedItemsCount; i++) {
					selectedIds.push(selectedItems[i][_idAttr][0]);
				}
				return selectedIds;
			},

			setValue: function (
				id,
				propName,
				propValue,
				setValueAsArray,
				skipRowUpdating
			) {
				var item = _store._itemsByIdentity[id],
					rowIndex;
				item[propName] =
					setValueAsArray && _isArray(propValue) ? propValue : [propValue];
				if (_rowsUpdateEnabled && !skipRowUpdating) {
					rowIndex = _getRowIndex(id);
					_control.updateRow(rowIndex);
				}
			},

			enableFakeExpandosUsing: function (value) {
				_fakeChildrenValue = false !== value;
			},

			addObject: function (object, parentId) {
				if (parentId) {
					_addItemFromObject(object, _store._itemsByIdentity[parentId]);
				} else {
					_newRootItem(object);
				}
			},

			addObjects: function (objects, parentId) {
				if (parentId) {
					_addItemsFromObjects(objects, _store._itemsByIdentity[parentId]);
				} else {
					_newRootItems(objects);
				}
			},

			addRootXmlNode: function (xmlNode) {
				var object = _parseXmlNodeToObject(xmlNode);
				_newRootItem(object);
			},

			addXmlNode: function (xmlNode, parentId) {
				var parentItem = _store._itemsByIdentity[parentId];
				_addItemFromXmlNode(xmlNode, parentItem);
			},

			removeItem: function (id) {
				_removeItem(_store._itemsByIdentity[id]);
				_store.save();
			},

			removeAllItems: function () {
				_control.setModel(_newModel());
			},

			setOpenState: function (itemId, state, withChildren) {
				_control.setOpenState(itemId, state, withChildren);
			},

			selectRow: function (itemId) {
				var rowIndex = _getRowIndex(itemId);
				_control.selection.select(rowIndex);
			},

			expandAll: function () {
				_control.toggleAll(true);
			},

			collapseAll: function () {
				_control.toggleAll(false);
			},

			refresh: function () {
				_control._refresh();
			},

			setUpdateEnabled: function (enable, updateRightNow) {
				_control.setUpdateEnabled(enable, updateRightNow);
			},

			setEditCell: function (id, cellIndex) {
				var cell = _control.layout.cells[cellIndex],
					rowIndex = _getRowIndex(id);
				_control.edit.setEditCell(cell, rowIndex);
			},

			setEditable: function (value) {
				_control.editable = false !== value;
			},

			setChildrenFetchingExecuter: function (executer) {
				_control.fetchChildren = executer;
			},

			sortChildren: function (itemId, childrenIdsOrder) {
				_control.sortChildren(itemId, childrenIdsOrder);
			}
		};
	};

	return dojo.declare('LazyTreeGridWrapper', null, {
		constructor: function (args) {
			var publicAPI = _LazyTreeGridWrapper.call(this, args || {}),
				propName;
			for (propName in publicAPI) {
				this[propName] = publicAPI[propName];
			}
		}
	});
});
