/* global define, CMF */
define(['dojo/_base/declare', 'QB/Scripts/qbTreeEnum'], function (
	declare,
	AdminEnum
) {
	var systemEnums = new AdminEnum();
	var aras = parent.aras;

	return declare('qpDataStore', [], {
		elementTypeDictionary: {},
		propertyTypeDictionary: {},
		treeModelCollection: [],

		constructor: function () {
			this.elementTypeDictionary = {};
			this.propertyTypeDictionary = {};
			this.treeModelCollection = [];
		},

		getChildren: function (element, type) {
			if (element.getType() === systemEnums.TreeModelType.RecursionItem) {
				return [];
			}
			var children = this.treeModelCollection.filter(function (item) {
				if (item.parentId === element.id) {
					if (type) {
						return item.getType() === type;
					} else {
						return true;
					}
				}
				return false;
			});
			this.resortCollection(children);
			return children;
		},

		getRootElement: function () {
			var rootElements = this.treeModelCollection.filter(function (item) {
				return item.id === 'root';
			});

			return rootElements.length > 0 ? rootElements[0] : null;
		},

		getElementById: function (id) {
			var elements = this.treeModelCollection.filter(function (item) {
				return item.id === id;
			});

			return elements.length > 0 ? elements[0] : null;
		},

		isElementHasChild: function (sourceElement, child) {
			var currentElement = child;
			if (child.id === 'root') {
				return false;
			}
			while (true) {
				var parentElement = this.getElementById(currentElement.parentId);
				if (parentElement === sourceElement) {
					return true;
				}

				if (parentElement.id === 'root') {
					return false;
				}
				currentElement = parentElement;
			}
		},

		removeElementType: function (treeElement) {
			if (!treeElement.isRecursion) {
				if (treeElement.element.node.getAttribute('action') === 'add') {
					var relationships = item.selectSingleNode('Relationships');
					relationships.removeChild(treeElement.element.node);
				} else {
					treeElement.element.node.setAttribute('action', 'delete');
				}
			}

			this.setMainItemToUpdate();
			this.removeElementTreeModel(treeElement);
		},

		resortCollection: function (collection) {
			collection.sort(function (a, b) {
				if (a.element.type === b.element.type) {
					return a.element.sortOrder - b.element.sortOrder;
				} else {
					return a.element.type - b.element.type;
				}
			});
		},

		getIconPath: function (treeElement) {
			var itemType = null;
			switch (treeElement.getType()) {
				case systemEnums.TreeModelType.RootItemType:
				case systemEnums.TreeModelType.ElementType:
				case systemEnums.TreeModelType.PropertyItem:
				case systemEnums.TreeModelType.RelatedItem:
				case systemEnums.TreeModelType.RecursionItem:
				case systemEnums.TreeModelType.WhereUsedItem:
				case systemEnums.TreeModelType.CustomJoinItem:
					itemType = aras.getItemTypeDictionary(
						treeElement.element.itemTypeId,
						'id'
					);
					break;
				case systemEnums.TreeModelType.RelationshipItem:
					return '../images/RelationshipType.svg';
				case systemEnums.TreeModelType.EmptyRootItemType:
					return '../images/DataBase.svg';
				default:
					break;
			}
			if (itemType) {
				return aras.getItemProperty(itemType.node, 'open_icon');
			}
			return '';
		},

		setActionToNode: function (node, actionValue) {
			if (node.getAttribute('action') !== 'add') {
				node.setAttribute('action', actionValue);
			}
		},

		setMainItemToUpdate: function () {
			item.setAttribute('isDirty', '1');
			this.setActionToNode(item, 'update');
		},

		removeElementTreeModel: function (treeElement) {
			for (var i = 0; i < this.treeModelCollection.length; i++) {
				if (this.treeModelCollection[i] === treeElement) {
					this.treeModelCollection.splice(i, 1);
					break;
				}
			}
		}
	});
});
