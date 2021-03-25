define(function () {
	var _stubId = '$stub$';

	function _getXmlNodeProp(xmlNode, propName) {
		var result = xmlNode.getAttribute(propName),
			tempXmlNode;
		if (!result) {
			tempXmlNode = xmlNode.selectSingleNode(propName);
			if (tempXmlNode) {
				result = tempXmlNode.innerText;
			}
		}
		return result;
	}

	return dojo.declare('StructureItem', null, {
		/* +++ these methods gotta be set during Structure instance creation +++ */
		generateUniqueId: null,
		onSetItemProperty: null,
		/* --- */

		constructor: function (args) {
			var propName;
			this.structure = null;
			this.label = null;
			this.uniqueId = null;
			this.id = null;
			this.childrens = [];
			this.enabled = true;
			this.imageUrl = null;
			this.parent = null;
			this.last_child = null;
			this.child = null;
			this.prev = null;
			this.next = null;
			this.userData = {};
			this.isExpanded = false;
			this.stub = null;
			this.textColor = null;

			for (propName in args || {}) {
				this[propName] = args[propName];
			}
		},

		initEmptyItem: function () {
			this.id = this.id || '';
			this.imageUrl = this.imageUrl || '';
			this.label = this.label || '';
			this.textColor = this.textColor || '';
			this.uniqueId = this.uniqueId || this.generateUniqueId();
			this.structure._addItem(this);
		},

		initItem: function (xmlNode) {
			var icon;
			this.imageUrl =
				_getXmlNodeProp(xmlNode, 'icon') ||
				(icon = xmlNode.selectSingleNode('open_icon') && icon.innerText) ||
				'';
			this.uniqueId = this.uniqueId || this.generateUniqueId();
			this.id = _getXmlNodeProp(xmlNode, 'id') || this.uniqueId;
			this.label = _getXmlNodeProp(xmlNode, 'keyed_name');
			this.textColor = _getXmlNodeProp(xmlNode, 'textColor');
			this.userData.itemTypeName = xmlNode.getAttribute('type');
			this.structure._addItem(this);
		},

		_initItemOnly: function (xmlNode) {
			var icon;
			this.imageUrl =
				_getXmlNodeProp(xmlNode, 'icon') ||
				(icon = xmlNode.selectSingleNode('open_icon') && icon.innerText) ||
				'';
			this.uniqueId = this.uniqueId || this.generateUniqueId();
			this.id = _getXmlNodeProp(xmlNode, 'id') || this.uniqueId;
			this.label = _getXmlNodeProp(xmlNode, 'keyed_name');
			this.textColor = _getXmlNodeProp(xmlNode, 'textColor');
			this.userData.itemTypeName = xmlNode.getAttribute('type');
		},

		initChildrenRecursively: function (xmlNode) {
			var childNodes = xmlNode.selectNodes('relatedItems/Item'),
				childNodesCount = childNodes.length,
				structureObj = this.structure,
				itemsToAdd = [],
				items = [],
				i,
				childNode,
				item,
				icon;

			for (i = 0; i < childNodesCount; i++) {
				childNode = childNodes[i];
				item = this._addChildItemWithoutRefresh('');
				item._initItemOnly(childNode);
				structureObj._addItemToCollection(item);
				itemsToAdd[itemsToAdd.length] = {
					uniqueId: item.uniqueId,
					label: item.label,
					imageUrl: item.imageUrl
				};
				if ('1' !== childNode.getAttribute('loaded')) {
					item._addStub();
				}
				items[items.length] = item;
			}

			if (itemsToAdd.length) {
				structureObj._addItems(itemsToAdd, this.uniqueId);
			}

			for (i = 0; i < childNodesCount; i++) {
				items[i].initChildrenRecursively(childNodes[i]);
			}
		},

		cloneItem: function (item) {
			this.imageUrl = item.imageUrl;
			this.uniqueId = this.generateUniqueId();
			this.id = item.id;
			this.label = item.label;
			this.textColor = item.textColor;
			this.userData.itemTypeName = item.userData.itemTypeName;
			this.structure._addItem(this);
		},

		addChildItemsFromXML: function (xmlText) {
			var xmlDoc = new XmlDocument(),
				thisItemXmlNode;
			xmlDoc.loadXML(xmlText);
			thisItemXmlNode = xmlDoc.selectSingleNode('Item');
			this._addChildItemsRecursively(thisItemXmlNode);
		},

		_addChildItemsRecursively: function (parentXmlNode) {
			var xmlChildNodes = parentXmlNode.selectNodes('relatedItems/Item'),
				xmlChildNodesCount = xmlChildNodes.length,
				i,
				childXmlNode,
				item;
			for (i = 0; i < xmlChildNodesCount; i++) {
				childXmlNode = xmlChildNodes[i];
				item = this._addChildItemWithoutRefresh('');
				item.initItem(childXmlNode);
				item._addChildItemsRecursively(childXmlNode);
				if ('1' !== childXmlNode.getAttribute('loaded')) {
					item._addStub();
				}
			}
		},

		addChildItemsFromJSON: function (children) {
			var childrenCount = children.length,
				i,
				child,
				item;
			for (i = 0; i < childrenCount; i++) {
				child = children[i];
				item = this._addChildItemWithoutRefresh('');
				item.cloneItem(child);
				item._addStub();
			}
		},

		_addChildItemWithoutRefresh: function (label) {
			var lastChild = this.last_child;
			if (lastChild) {
				return lastChild._addNextItemWithoutRefresh(label);
			}
			lastChild = new StructureItem({
				structure: this.structure,
				label: label,
				parent: this
			});
			this.childrens.push((this.child = this.last_child = lastChild));
			return lastChild;
		},

		addChildItem: function (label) {
			var item = this._addChildItemWithoutRefresh(label);
			item.initEmptyItem();
			return item;
		},

		setId: function (id) {
			this.id = id || this.generateUniqueId();
		},

		setLabel: function (value) {
			this.label = value;
			this.onSetItemProperty(this.uniqueId, 'label', value);
		},

		setImageSRC: function (url) {
			if (url) {
				this.imageUrl = url;
				this.onSetItemProperty(this.uniqueId, 'imageUrl', url);
			}
		},

		setUserData: function (key, value) {
			this.userData[key] = value;
		},

		SetEnabled: function (value) {
			this.enabled = value;
		},

		setVisibility: function (value) {
			this.structure._setItemVisibility(this.uniqueId, value);
		},

		setSelected: function () {
			if (this.enabled) {
				this.structure.selectItem(this.uniqueId);
			}
		},

		_addNextItemWithoutRefresh: function (label) {
			var nextItem = new StructureItem({
				structure: this.structure,
				label: label,
				parent: this.parent,
				prev: this,
				next: this.next
			});
			this.parent.childrens.push(
				(this.parent.last_child = this.next = nextItem)
			);
			return nextItem;
		},

		_addStub: function () {
			var self = this;
			this.userData.stubID = _stubId;
			this.stub = {
				remove: function () {
					delete self.stub;
					delete self.userData[_stubId];
				}
			};
		},

		pasteNode: function (parentItem) {
			var children = this.childrens,
				childrenCount = children.length,
				structureObj = this.structure,
				i;
			parentItem.childrens[parentItem.childrens.length] = this;
			structureObj._addItem(this);
			for (i = 0; i < childrenCount; i++) {
				children[i].pasteNode(this);
			}
		},

		_removeChildrenRecursively: function (item) {
			var structureObj = this.structure,
				children = item.childrens,
				childrenCount = children.length,
				i;
			for (i = 0; i < childrenCount; i++) {
				this._removeChildrenRecursively(children[i]);
				structureObj._removeItemFromCollection(children[i].uniqueId);
			}
		},

		remove: function () {
			var parentItem = this.parent || {},
				nextItem = this.next,
				prevItem = this.prev;

			if (this === parentItem.child) {
				parentItem.child = nextItem;
			}

			if (this === parentItem.last_child) {
				parentItem.last_child = prevItem;
			}

			if (prevItem) {
				prevItem.next = nextItem;
			}

			if (nextItem) {
				nextItem.prev = prevItem;
			}

			this._removeChildrenRecursively(this);
			if (parentItem.childrens) {
				parentItem.childrens.splice(parentItem.childrens.indexOf(this), 1);
			}
			this.structure._removeItemFromStore(this.uniqueId);
		},

		hasChildren: function () {
			return 0 < this.childrens.length;
		},

		getParentItem: function () {
			return this.parent;
		},

		getChildItem: function () {
			return this.child;
		},

		getLabel: function () {
			return this.label;
		},

		getEnabled: function () {
			return this.enabled;
		},

		getVisibility: function () {
			return this.structure._isItemVisible(this.uniqueId);
		},

		_ascedingSorter: function (first, second) {
			return first.label !== second.label
				? first.label < second.label
					? 1
					: -1
				: 0;
		},

		_descedingSorter: function (first, second) {
			return first.label !== second.label
				? first.label > second.label
					? 1
					: -1
				: 0;
		},

		Sort: function (sortType) {
			var children = this.childrens,
				childrenCount = children.length,
				i,
				childrenIdsOrder;
			if (childrenCount) {
				children.sort(this[sortType ? '_ascedingSorter' : '_descedingSorter']);
				childrenIdsOrder = [children[0].uniqueId];

				this.child = children[0];
				this.lastChild = children[childrenCount - 1];
				this.lastChild.next = null;

				for (i = 1; i < childrenCount; i++) {
					child = children[i];
					prevChild = children[i - 1];
					child.prev = prevChild;
					prevChild.next = child;
					childrenIdsOrder[childrenIdsOrder.length] = child.uniqueId;
				}

				this.structure._sortChildren(this.uniqueId, childrenIdsOrder);
			}
		},

		GetNextItem: function () {
			return this.next;
		},

		_setExpandedStateRecursively: function (state, withChildren) {
			var child = withChildren && this.child;
			while (child) {
				child._setExpandedStateRecursively(state, withChildren);
				child = child.next;
			}
			this.isExpanded = state;
		},

		expand: function (withChildren) {
			this.structure.setOpenState(this.uniqueId, true, withChildren);
			this._setExpandedStateRecursively(true, withChildren);
		},

		collapse: function (withChildren) {
			this._setExpandedStateRecursively(false, withChildren);
			this.structure.setOpenState(this.uniqueId, false, withChildren);
		},

		Expand: function (withChildren) {
			this.structure.setOpenState(this.uniqueId, true, withChildren);
			this._setExpandedStateRecursively(true, withChildren);
		},

		getId: function () {
			return this.id;
		},

		getUserData: function (key) {
			return this.userData[key];
		},

		getItem: function (uniqueId) {
			var item, anotherItem;
			if (uniqueId === _stubId && this.stub) {
				return this.stub;
			}
			if (uniqueId === this.uniqueId) {
				return this;
			}
			item = this.child;
			while (item) {
				anotherItem = item.getItem(uniqueId);
				if (anotherItem) {
					return anotherItem;
				}
				item = item.next;
			}
			return null;
		},

		editLabel: function () {
			this.structure.editLabel(this.uniqueId);
		},

		parseXmlNode: function (xmlNode) {
			var openIcon = '';
			return xmlNode
				? {
						uniqueId: _getXmlNodeProp(xmlNode, 'id') || this.generateUniqueId(),
						label: _getXmlNodeProp(xmlNode, 'keyed_name'),
						imageUrl:
							_getXmlNodeProp(xmlNode, 'icon') ||
							(openIcon =
								xmlNode.selectSingleNode('open_icon') && openIcon.innerText) ||
							'',
						itemTypeName: xmlNode.getAttribute('type')
				  }
				: {
						uniqueId: this.generateUniqueId(),
						label: '',
						imageUrl: '',
						itemTypeName: ''
				  };
		}
	});
});
