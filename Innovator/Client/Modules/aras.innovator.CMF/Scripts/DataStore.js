/* global define, CMF */
define(['dojo/_base/declare', 'CMF/Scripts/DataModel'], function (
	declare,
	DataModel
) {
	var modelStore = new DataModel();
	var aras;

	return declare('DataStore', [], {
		treeItemCollection: {},
		tableItemCollection: {},
		docElementTypes: {},
		docElementWrapper: null,
		groupElementTypes: null,
		propertyTypeList: null,
		propertyTypeHashTable: {},

		constructor: function (arasObj) {
			aras = arasObj;
		},

		loadData: function (serverData, spreadsheetView, propertyTypeList) {
			this.docElementTypes = serverData.docElementTypes;
			this.groupElementTypes = spreadsheetView.groupElementTypes;
			this.propertyTypeList = propertyTypeList;
			for (var i = 0; i < propertyTypeList.length; i++) {
				this.propertyTypeHashTable[propertyTypeList[i].id] =
					propertyTypeList[i];
			}
		},

		clearMetadata: function () {
			this.treeItemCollection = {};
			this.tableItemCollection = {};
		},

		getDocElements: function () {
			return this.treeItemCollection;
		},

		getDocElement: function (id) {
			return this.treeItemCollection[id];
		},

		getDocElementChildren: function (element, onlyVisible, withoutCandidates) {
			var res = [];
			if (element) {
				for (var i = 0; i < element.childrenIds.length; i++) {
					var child = this.treeItemCollection[element.childrenIds[i]];
					if (child) {
						if (child.isCandidate && withoutCandidates) {
							continue;
						}

						if (
							(onlyVisible && this.isDocElementVisible(child)) ||
							!onlyVisible
						) {
							res.push(child);
						}
					}
				}
			}
			return res;
		},

		getDocElementChild: function (id, sourceElement, onlyVisible) {
			if (sourceElement) {
				var index = sourceElement.childrenIds.indexOf(id);
				if (index >= 0) {
					var res = this.treeItemCollection[sourceElement.childrenIds[index]];
					if ((onlyVisible && this.isDocElementVisible(res)) || !onlyVisible) {
						return res;
					}
				}
			}
			return null;
		},

		isDocElementVisible: function (element) {
			var docElementType = this.getDocElementType(element);
			if (docElementType) {
				return docElementType.visible;
			} else {
				return false;
			}
		},

		getDocElementType: function (element) {
			if (element && element.documentElementTypeId) {
				return this.docElementTypes[element.documentElementTypeId];
			}
			return undefined;
		},

		createDocElement: function (
			parentElement,
			boundItemId,
			isValidateExistence,
			docElemTypeId,
			beforeInsertItem,
			copy
		) {
			var newItem = new modelStore.TreeItemModel();
			var currentDocElementType = this.docElementTypes[docElemTypeId];

			newItem.id = aras.generateNewGUID();
			newItem.parentId = parentElement.id;
			newItem.title = currentDocElementType.name; // check on remove
			newItem.rootItemId =
				parentElement.id === 'root' ? newItem.id : parentElement.rootItemId;
			newItem.relatedId = aras.generateNewGUID();
			newItem.parentRelId = parentElement.relatedId;
			newItem.documentElementType = currentDocElementType; // remove
			newItem.documentElementTypeId = currentDocElementType.id; // remove
			newItem.sortOrder = this.calculateSortOrderForDocElement(
				parentElement,
				beforeInsertItem,
				docElemTypeId
			);
			if (!newItem.sortOrder) {
				return null;
			}
			if (copy && copy.isWithBindings) {
				newItem.boundItemId = copy.boundItemId;
				newItem.boundItemConfigId = copy.boundItemConfigId;
				newItem.boundItem = copy.boundItem;
				newItem.trackingMode = copy.trackingMode;
				newItem.resolutionMode = copy.resolutionMode;
			}

			this.treeItemCollection[newItem.id] = newItem;
			for (var i = 0; i < currentDocElementType.properties.length; i++) {
				var tableItem = new modelStore.TableItemModel();
				var property = currentDocElementType.properties[i];
				tableItem.propertyId = property.id;
				tableItem.propertyName = property.name;
				tableItem.propertyTypeId = property.typeId;
				tableItem.property = property; // remove
				tableItem.id = aras.generateNewGUID();
				tableItem.treeItemId = newItem.id;
				tableItem.treeItem = this.getDocElement(newItem.id);
				tableItem.elementReferenceId = newItem.relatedId;
				tableItem.value =
					copy && copy.isWithValues
						? copy.tableItemsValues[property.id]
						: undefined;

				tableItem.cmfStyle =
					copy && copy.isWithValues
						? copy.tableItemsCmfStyles[property.id]
						: undefined;

				newItem.tableItemIds.push(tableItem.id);
				this.tableItemCollection[tableItem.id] = tableItem;
			}

			if (boundItemId) {
				var tableItems = this.getPropertyElements(newItem);
				var bindingResult = CMF.Utils.fillBindings(
					newItem,
					boundItemId,
					true,
					false,
					isValidateExistence,
					tableItems
				);
				if (!bindingResult) {
					return false;
				}
			}

			return newItem;
		},

		insertDocElement: function (sourceElement, element) {
			if (!sourceElement || !element) {
				return;
			}

			var children = this.getDocElementChildren(sourceElement);
			children.push(element);

			this.resortDocElements(sourceElement, children);
		},

		resortDocElements: function (sourceElement, children) {
			// sorting by groups
			function sort(a, b) {
				var aType = this.docElementTypes[a.documentElementTypeId];
				var bType = this.docElementTypes[b.documentElementTypeId];
				if (aType.sortOrder > bType.sortOrder) {
					return 1;
				}
				if (aType.sortOrder < bType.sortOrder) {
					return -1;
				}

				if (aType.groupId === aType.id && bType.groupId !== bType.id) {
					return -1;
				}
				if (aType.groupId !== aType.id && bType.groupId === bType.id) {
					return 1;
				}

				if (a.sortOrder > b.sortOrder) {
					return 1;
				}
				if (a.sortOrder < b.sortOrder) {
					return -1;
				}
				return 0;
			}

			children.sort(sort.bind(this));

			sourceElement.childrenIds = [];
			for (var i = 0; i < children.length; i++) {
				sourceElement.childrenIds.push(children[i].id);
			}
		},

		getDocElementChildrenByType: function (element, docTypeId, onlyVisible) {
			var allChildren = this.getDocElementChildren(element, onlyVisible);
			return allChildren.filter(function (child) {
				return child.documentElementTypeId === docTypeId;
			});
		},

		calculateSortOrderForDocElement: function (
			parentElement,
			beforeInsertItem,
			documentElemTypeId
		) {
			var currentSortOrder =
				beforeInsertItem && beforeInsertItem.sortOrder
					? beforeInsertItem.sortOrder + 1
					: 128;
			var group = this.getDocElementChildrenByType(
				parentElement,
				documentElemTypeId,
				true
			);
			if (beforeInsertItem && beforeInsertItem.sortOrder) {
				if (beforeInsertItem.documentElementTypeId !== documentElemTypeId) {
					if (group.length > 0) {
						currentSortOrder = Math.floor(group[0].sortOrder / 2);
					} else {
						currentSortOrder = 128;
					}
				} else {
					for (var k = 0; k < group.length; k++) {
						if (group[k].id === beforeInsertItem.id) {
							if (k + 1 < group.length) {
								var diff = group[k + 1].sortOrder - group[k].sortOrder;
								if (diff > 1) {
									currentSortOrder = group[k].sortOrder + Math.floor(diff / 2);
								} else {
									currentSortOrder = null;
								}
							} else {
								currentSortOrder = group[k].sortOrder + 128;
							}
							break;
						}
					}
				}
			} else {
				if (group.length > 0) {
					currentSortOrder = Math.floor(group[0].sortOrder / 2);
				} else {
					currentSortOrder = 128;
				}
			}
			return currentSortOrder;
		},

		getDocElementBeforeCurrent: function (element) {
			if (element) {
				var parentElement = this.treeItemCollection[element.parentId];
				for (var i = 0; i < parentElement.childrenIds.length; i++) {
					if (parentElement.childrenIds[i] === element.id) {
						return i === 0
							? null
							: this.treeItemCollection[parentElement.childrenIds[i - 1]];
					}
				}
			}
			return null;
		},

		removeDocElement: function (parentElement, elementToRemove) {
			if (parentElement && elementToRemove) {
				var index = parentElement.childrenIds.indexOf(elementToRemove.id);
				if (index >= 0) {
					parentElement.childrenIds.splice(index, 1);
				}
				elementToRemove.isRemoved = true;
			}
		},

		findPreviousSibling: function (element) {
			var parentElement = this.treeItemCollection[element.parentId];
			var children = this.getDocElementChildren(parentElement, true);
			var i = children.length - 1;
			while (i > 0) {
				if (children[i].id === element.id) {
					return children[i - 1];
				}
				i--;
			}
			return null;
		},

		findNextElement: function (element) {
			var parentElement = this.treeItemCollection[element.parentId];
			var children = this.getDocElementChildren(parentElement, true);
			//var children = this.getDocElementChildrenByType(parentElement, element.documentElementTypeId, true);
			for (var i = 0; i < children.length - 1; i++) {
				if (children[i].id === element.id) {
					return children[i + 1];
				}
			}
			return null;
		},

		getPropertyElement: function (id) {
			return this.tableItemCollection[id];
		},

		getPropertyElements: function (element, onlyVisible) {
			var res = [];
			for (var i = 0; i < element.tableItemIds.length; i++) {
				var propertyElementId = element.tableItemIds[i];
				var propertyElement = this.tableItemCollection[propertyElementId];
				if (propertyElement) {
					if ((onlyVisible && propertyElement.visible) || !onlyVisible) {
						res.push(propertyElement);
					}
				}
			}
			return res;
		},

		getAllDocElementsByTypeId: function (typeId) {
			var docElements = [];
			for (var treeItemId in this.treeItemCollection) {
				if (
					this.treeItemCollection[treeItemId].documentElementTypeId ===
						typeId &&
					!this.treeItemCollection[treeItemId].isRemoved
				) {
					docElements.push(this.treeItemCollection[treeItemId]);
				}
			}
			return docElements;
		},

		findAncestorDocumentElement: function (item, type) {
			var currentItem = item;
			while (currentItem && !currentItem.isRootOfTree) {
				var docElementType = this.docElementTypes[
					currentItem.documentElementTypeId
				];
				if (docElementType && docElementType.name === type) {
					return currentItem;
				}

				currentItem = this.treeItemCollection[currentItem.parentId];
			}
			return undefined;
		},

		findDescendantDocumentElements: function (item, type, showCandidate) {
			var res = [];
			var stack = [];
			var children = this.getDocElementChildren(item, false, !showCandidate);
			for (var i = 0; i < children.length; i++) {
				stack.push(children[i]);
			}

			while (stack.length > 0) {
				var child = stack.pop();
				if (child.documentElementTypeId) {
					var docElementType = this.docElementTypes[
						child.documentElementTypeId
					];
					if (docElementType.name === type) {
						res.push(child);
					}
				}

				children = this.getDocElementChildren(child, false, !showCandidate);
				for (var j = 0; j < children.length; j++) {
					stack.push(children[j]);
				}
			}

			return res;
		},

		recalculateSortOrder: function (parentElement, documentElemTypeId) {
			var group = this.getDocElementChildrenByType(
				parentElement,
				documentElemTypeId,
				true
			);
			var sortOrder = 128;
			var shift = 128;
			for (var i = 0; i < group.length; i++) {
				group[i].sortOrder = sortOrder;
				sortOrder += shift;
			}
			return group;
		},

		getPropertyType: function (id) {
			return this.propertyTypeHashTable[id];
		},

		getDocElementTypeById: function (id) {
			return this.docElementTypes[id];
		},

		getDocElementTypeByPropertyId: function (propertyId) {
			if (propertyId) {
				var property = this.propertyTypeHashTable[propertyId];
				if (property && property.documentElementId) {
					return this.docElementTypes[property.documentElementId];
				}
			}
			return undefined;
		},

		getRootDocElementTypes: function () {
			return this.docElementTypes.filter(function (element) {
				return element.parentId === '';
			});
		},

		getAllDocumentTypes: function () {
			return this.docElementTypes;
		},

		getAllTableItems: function () {
			var stack = [];
			var res = [];
			var rootNode = this.getDocElement('root');
			var rootChildren = this.getDocElementChildren(rootNode);
			for (var i = 0; i < rootChildren.length; i++) {
				var rootRow = rootChildren[i];
				stack.push(rootRow);
				while (stack.length > 0) {
					var item = stack.pop();
					var itemChildren = this.getDocElementChildren(item);
					if (itemChildren.length > 0) {
						for (var j = 0; j < itemChildren.length; j++) {
							stack.push(itemChildren[j]);
						}
					}
					var propertyElements = this.getPropertyElements(item);
					for (var k = 0; k < propertyElements.length; k++) {
						res.push(propertyElements[k]);
					}
				}
			}
			return res;
		},

		getAllCandidates: function () {
			var res = [];
			var element;
			for (var index in this.treeItemCollection) {
				// jshint ignore:line
				element = this.treeItemCollection[index];
				if (element.isCandidate && !element.isRemoved && element.isVisible()) {
					res.push(this.treeItemCollection[index]);
				}
			}
			return res;
		},

		getPropertyRootItemId: function (tableItem) {
			return this.getDocElement(tableItem.treeItemId).rootItemId;
		}
	});
});
