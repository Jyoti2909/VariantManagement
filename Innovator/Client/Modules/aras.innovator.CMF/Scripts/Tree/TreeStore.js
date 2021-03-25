/* global define */
define(['dojo/dom', 'dojo/json', 'dojo/store/Memory'], function (
	dom,
	json,
	Memory
) {
	return {
		parsedData: {},
		memStore: null,
		dataStore: null,
		format: null,

		constructor: function (aras) {
			format = aras.getDotNetDatePattern('short_date');
		},

		getMemStore: function () {
			return this.memStore;
		},

		loadItems: function (data, dataStore) {
			this.setData(data, dataStore);
		},

		setData: function (data, dataStore) {
			this.parsedData = data;
			this.memStore = new Memory({
				id: 'id',
				data: [this.parsedData],

				getChildren: function (element) {
					return dataStore.getDocElementChildren(element, true);
				},
				getTreeItem: function (id) {
					return dataStore.getDocElement(id);
				},

				getFirstChild: function (element) {
					return element.childrenIds.length > 0
						? this.getTreeItem(element.childrenIds[0])
						: null;
				},

				getParent: function (element) {
					return element.id === 'root'
						? null
						: this.getTreeItem(element.parentId);
				},

				getItemChain: function (id) {
					var item = this.getTreeItem(id);
					var currentItem = item;
					var chain = [];
					while (currentItem.id !== 'root') {
						chain.push(currentItem.id);
						currentItem = this.getTreeItem(currentItem.parentId);
					}
					chain = chain.reverse();
					return chain;
				},

				findRootNode: function (id) {
					return dataStore.getDocElementChild(id, data, true);
				},

				getAllTableItems: function () {
					var stack = [];
					var res = [];
					var rootNode = data;
					var rootChildren = dataStore.getDocElementChildren(rootNode);
					for (var i = 0; i < rootChildren.length; i++) {
						var rootRow = rootChildren[i];
						stack.push(rootRow);
						while (stack.length > 0) {
							var item = stack.pop();
							var itemChildren = dataStore.getDocElementChildren(item);
							if (itemChildren.length > 0) {
								for (var j = 0; j < itemChildren.length; j++) {
									stack.push(itemChildren[j]);
								}
							}
							var propertyElements = dataStore.getPropertyElements(item);
							for (var k = 0; k < propertyElements.length; k++) {
								res.push(propertyElements[k]);
							}
						}
					}
					return res;
				},

				createNewTreeItem: function (
					parentElement,
					boundItemId,
					isValidateExistence,
					docElemTypeId,
					beforeInsertItem,
					copy
				) {
					return dataStore.createDocElement(
						parentElement,
						boundItemId,
						isValidateExistence,
						docElemTypeId,
						beforeInsertItem,
						copy
					);
				},

				insertTreeItem: function (sourceElement, element) {
					dataStore.insertDocElement(sourceElement, element);
				},

				removeTreeItem: function (parentNode, deletedNode) {
					dataStore.removeDocElement(parentNode, deletedNode);
				},

				mayHaveChildren: function (element) {
					if (element.childrenIds.length > 0) {
						var visibleChildren = this.getChildren(element);
						return visibleChildren.length > 0;
					}
					return false;
				},

				getPreviousSibling: function (element) {
					return dataStore.findPreviousSibling(element);
				},

				getNextChild: function (newNode) {
					return dataStore.findNextElement(newNode);
				},

				getDataStore: function () {
					return dataStore;
				},

				getPropertyElements: function (element) {
					return dataStore.getPropertyElements(element, true);
				},

				getPropertyElementIdForEdit: function (element) {
					var visibleTableItems = this.getPropertyElements(element);

					for (var i = 0; i < visibleTableItems.length; i++) {
						if (visibleTableItems[i].property.editorType) {
							return visibleTableItems[i].id;
						}
					}

					return visibleTableItems[0].id;
				},

				getTreeNodeLabel: function (element) {
					var label = '';
					var visibleTableItems = this.getPropertyElements(element);
					if (visibleTableItems.length > 0) {
						var firstProperty = visibleTableItems[0];

						label = this.formatter(firstProperty.value, firstProperty.property);
						if (label) {
							if (label.length > 15) {
								label = label.substring(0, 15) + '...';
							}
						} else {
							label = '';
						}
					}
					return label;
				},

				formatter: function (value, property) {
					if (!value) {
						return '';
					}
					if (!property) {
						return value;
					}
					if (property.dataType === 'date') {
						return this.convertFromNeutral(value, property.datePattern);
					}
					return value;
				},

				convertFromNeutral: function (value, datePattern) {
					var format = this.format;
					if (!value) {
						return '';
					}
					if (datePattern !== null && datePattern !== '') {
						format = parent.aras.getDotNetDatePattern(datePattern);
					}
					return parent.aras.convertFromNeutral(value, 'date', format);
				},

				recalculateSortOrder: function (parentNode, docElemId) {
					return dataStore.recalculateSortOrder(parentNode, docElemId);
				}
			});
		}
	};
});
