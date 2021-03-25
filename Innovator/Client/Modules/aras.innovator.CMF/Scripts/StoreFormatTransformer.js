/* jshint ignore:start */
define(['dojo/_base/declare', './DataModel'], function (declare, DataModel) {
	//TODO: can we remove this file and most of files for load data from .js and use C# Publishing Solution instead of them not to duplicate the code?
	//Also it can improve perfomance because all the requests we will be performed on Server Side
	var dataModel = new DataModel();
	var generatedGuids = {};

	return declare('CMF.StoreFormatTransformer', null, {
		constructor: function () {},

		manageBindingInfo: function (treeItem, tableItems) {
			var tableItem;
			var i;
			var currentBind;
			var value;
			var boundValue;

			tableItems.map(function (item) {
				//treeItem can contain not only it's tableItems, but all tableItems of its childs too.
				//e.g., calling this function for root can be not efficient, because tableItems for root is all the table Items of all the child nodes of the root.
				if (item.treeItemId === treeItem.id) {
					item.isReferenced = item.isStaleReference = item.isMissedReference = item.isNonTrackingReference = false;
				}
			});

			if (!treeItem.boundItem) {
				return;
			}

			for (i = 0; i < tableItems.length; i++) {
				tableItem = tableItems[i];
				currentBind =
					treeItem.documentElementType.binding.binds[tableItem.propertyId];
				if (!currentBind) {
					continue;
				}

				var boundItemProp =
					treeItem.boundItem.propertyNames[currentBind.itemPropertyName];
				boundValue = boundItemProp.value;
				value = tableItem.value;

				if (
					CMF.Utils.getClearBindingSettingValue(treeItem.trackingMode) ===
					'NonTracking'
				) {
					tableItem.isNonTrackingReference = true;
				} else if (
					treeItem.boundItem.isRemovedOrNoPermissions ||
					boundItemProp.isMissedReference
				) {
					tableItem.isMissedReference = true;
				} else if (tableItem.discoverOnly === '1') {
					tableItem.isNonTrackingReference = true;
				} else if (
					boundValue !== value &&
					(boundValue || boundValue === 0 || value || value === 0)
				) {
					tableItem.isStaleReference = true;
				} else {
					tableItem.isReferenced = true;
				}
			}
		},

		transformToGridRow: function (
			rootNode,
			columnGroupCollection,
			docElemTypes,
			dataStore
		) {
			// get max row count for rendering current rootNode
			rootNode.maxNodesOneType = this.findMaxRowSpanCount(rootNode, dataStore);
			// calculate table items from tree root item
			var tableItems = this.calculateTableItemsWithRowSpan(
				rootNode,
				docElemTypes,
				dataStore
			);

			this.manageBindingInfo(rootNode, tableItems);
			// generate dgrid data from tableItems
			var subrs = this.createSubRowArray(rootNode.maxNodesOneType);

			//to optimize performance
			var propertyIdToTableItems = {};
			var tmpPropertyId;
			for (var i = 0; i < tableItems.length; i++) {
				tmpPropertyId = tableItems[i].propertyId;
				if (!propertyIdToTableItems[tmpPropertyId]) {
					propertyIdToTableItems[tmpPropertyId] = [];
				}
				propertyIdToTableItems[tmpPropertyId].push(tableItems[i]);
			}

			var topColumnGroups = columnGroupCollection.filter(function (element) {
				return element.level === 2;
			});
			for (var i = 0; i < topColumnGroups.length; i++) {
				for (var j = 0; j < topColumnGroups[i].properties.length; j++) {
					var propertyId = topColumnGroups[i].properties[j].id;
					var additionalPropertyId =
						topColumnGroups[i].properties[j].additPropertyId;
					var rowIndex = 0;
					var items = propertyIdToTableItems[propertyId] || [];
					if (
						additionalPropertyId &&
						propertyIdToTableItems[additionalPropertyId]
					) {
						items = items.concat(propertyIdToTableItems[additionalPropertyId]);
					}
					for (var k = 0; k < items.length; k++) {
						var subRowObject = items[k];
						if (items[k].isEmpty) {
							subRowObject.parentNodeId = items[k].treeItemId;
							const parentTreeItem =
								dataStore.treeItemCollection[items[k].treeItem.parentId];
							subRowObject.parentIsCandidate =
								parentTreeItem && parentTreeItem.isCandidate;
						} else {
							subRowObject.nodeId = items[k].treeItemId;
						}
						if (subrs[rowIndex]) {
							subrs[rowIndex][propertyId] = subRowObject;
						}
						rowIndex += items[k].rowSpan;
					}
				}
			}
			var resObject = { subrs: subrs, id: rootNode.id };
			return resObject;
		},

		createSubRowArray: function (length) {
			var subrs = new Array(length);
			for (var l = 0; l < subrs.length; l++) {
				subrs[l] = {};
			}
			return subrs;
		},

		calculateTableItemsWithRowSpan: function (
			rootNode,
			docElemTypes,
			dataStore
		) {
			var tableItems = this.getTableItemsForCurrentNode(
				rootNode,
				docElemTypes,
				dataStore
			);
			var rootTableItems = dataStore.getPropertyElements(rootNode, true);

			var properties = docElemTypes[rootNode.documentElementType.id].properties;
			for (var i = 0; i < properties.length; i++) {
				if (properties[i].display) {
					var items = rootTableItems.filter(function (element) {
						return element.propertyId === properties[i].id;
					});
					this.calculateRowSpans(items, rootNode.maxNodesOneType, 'normal');
				}
			}

			tableItems = tableItems.concat(rootTableItems);
			return tableItems;
		},

		createEmptyTableItems: function (
			propertyId,
			maxNodesOneType,
			mergeConfiguration,
			treeItemId,
			treeItem
		) {
			var items = [];
			if (mergeConfiguration === 'normal') {
				var item = new dataModel.TableItemModel();
				item.propertyId = propertyId;
				item.rowSpan = maxNodesOneType;
				//item.id = parent.aras.generateNewGUID();
				item.id = this.createGuid();
				item.treeItemId = treeItemId;
				item.value = '';
				item.isEmpty = true;
				item.maxNodesOneType = maxNodesOneType;
				item.treeItem = treeItem;
				items.push(item);
			} else {
				for (var i = 0; i < maxNodesOneType; i++) {
					var emptyitem = new dataModel.TableItemModel();
					emptyitem.propertyId = propertyId;
					emptyitem.rowSpan = 1;
					//emptyitem.id = parent.aras.generateNewGUID();
					emptyitem.id = this.createGuid();
					emptyitem.value = '';
					emptyitem.treeItemId = treeItemId;
					emptyitem.isEmpty = true;
					emptyitem.maxNodesOneType = 1;
					emptyitem.treeItem = treeItem;
					items.push(emptyitem);
				}
			}

			return items;
		},

		createGuid: function () {
			var res = '';
			for (var i = 0; i < 8; i++) {
				res += (((1 + Math.random()) * 0x10000) | 0)
					.toString(16)
					.substring(1)
					.toUpperCase();
			}
			if (generatedGuids[res]) {
				return this.createGuid();
			}
			generatedGuids[res] = true;
			return res;
		},

		findMaxRowSpanCount: function (currentNode, dataStore) {
			var visibleChildren = dataStore.getDocElementChildren(currentNode, true);
			if (visibleChildren.length > 0) {
				var childrenNodes = [];
				var childrenStack = [];
				var maxNodes = 1;

				for (var i = visibleChildren.length - 1; i >= 0; i--) {
					childrenStack.push(visibleChildren[i]);
				}
				while (childrenStack.length > 0) {
					var node = childrenStack.pop();
					var visible = dataStore.getDocElementChildren(node, true);
					if (visible.length > 0) {
						maxNodes = this.findMaxRowSpanCount(node, dataStore);
					} else {
						maxNodes = 1;
					}

					node.maxNodesOneType = maxNodes;
					var elem = childrenNodes.filter(function (element) {
						return element.id === node.documentElementType.groupId;
					});
					if (elem.length > 0) {
						elem[0].value += maxNodes;
					} else {
						childrenNodes.push({
							id: node.documentElementType.groupId,
							value: maxNodes
						});
					}
				}

				var maxValue = Math.max.apply(
					Math,
					childrenNodes.map(function (elem) {
						return elem.value;
					})
				);
				return maxValue;
			}
			return 1;
		},

		getTableItemsForCurrentNode: function (
			currentNode,
			docElemTypes,
			dataStore
		) {
			var mergeConfiguration = 'normal';
			var rootDocElem = docElemTypes[currentNode.documentElementType.id];
			var childrenDocElementsTypes = rootDocElem.getVisibleChildren();
			var childrenDocElementTypeHashTable = {};
			for (var i = 0; i < childrenDocElementsTypes.length; i++) {
				childrenDocElementTypeHashTable[childrenDocElementsTypes[i].id] =
					childrenDocElementsTypes[i];
			}
			var groupElementTypes = [];
			for (var i = 0; i < dataStore.groupElementTypes.length; i++) {
				if (
					childrenDocElementTypeHashTable[dataStore.groupElementTypes[i].id] !==
					undefined
				) {
					groupElementTypes.push(dataStore.groupElementTypes[i]);
				}
			}
			var result = [];
			var visibleChildren = dataStore.getDocElementChildren(currentNode, true);

			for (var j = 0; j < groupElementTypes.length; j++) {
				var currentGroupElementType = groupElementTypes[j];
				var itemsByDocElem = [];
				for (var i = 0; i < visibleChildren.length; i++) {
					if (
						visibleChildren[i].documentElementType.groupId ===
						currentGroupElementType.id
					) {
						itemsByDocElem.push(visibleChildren[i]);
					}
				}

				var docElemType = docElemTypes[currentGroupElementType.id];
				if (itemsByDocElem.length === 0) {
					var emptyTreeModel = new dataModel.TreeItemModel();
					emptyTreeModel.documentElementType = docElemType;
					emptyTreeModel.documentElementTypeId = docElemType.id;
					emptyTreeModel.parentId = currentNode.id;
					itemsByDocElem.push(emptyTreeModel);
				}

				var sumMaxNodes = 0;
				for (var i = 0; i < itemsByDocElem.length; i++) {
					sumMaxNodes += itemsByDocElem[i].maxNodesOneType;
				}
				if (sumMaxNodes < currentNode.maxNodesOneType) {
					this.recalculateMaxNode(
						itemsByDocElem,
						currentNode.maxNodesOneType,
						sumMaxNodes
					);
				}

				for (var n = 0; n < itemsByDocElem.length; n++) {
					var currentItem = itemsByDocElem[n];

					var propIds =
						docElemTypes[currentItem.documentElementTypeId].groupPropertyIds;

					for (var i = 0; i < propIds.length; i++) {
						var property = dataStore.getPropertyType(propIds[i]);
						if (property.display) {
							var tableItems = this.GetTableItemsFromTreeItem(
								currentItem,
								property,
								mergeConfiguration,
								dataStore
							);
							for (var m = 0; m < tableItems.length; m++) {
								tableItems[m].isCandidate = currentItem.isCandidate;
								result.push(tableItems[m]);
							}
						}
					}

					var hasVisibleChild =
						dataStore.getDocElementChildren(currentItem, true).length > 0;
					if (
						hasVisibleChild ||
						docElemTypes[currentItem.documentElementTypeId].hasVisibleChildren()
					) {
						var returnedItems = this.getTableItemsForCurrentNode(
							currentItem,
							docElemTypes,
							dataStore
						);
						for (var k = 0; k < returnedItems.length; k++) {
							result.push(returnedItems[k]);
						}
					}
				}
			}
			return result;
		},

		GetTableItemsFromTreeItem: function (
			treeItem,
			property,
			mergeConfiguration,
			dataStore
		) {
			var propertyElements = dataStore.getPropertyElements(treeItem, true);
			var items = propertyElements.filter(function (element) {
				return element.propertyId === property.id;
			});
			this.manageBindingInfo(treeItem, items);
			if (items.length === 0) {
				// create empty cells
				items = this.createEmptyTableItems(
					property.id,
					treeItem.maxNodesOneType,
					mergeConfiguration,
					treeItem.parentId,
					treeItem
				);
			} else {
				this.calculateRowSpans(
					items,
					treeItem.maxNodesOneType,
					mergeConfiguration
				);
				if (
					mergeConfiguration !== 'normal' &&
					items.length < treeItem.maxNodesOneType
				) {
					var emptyTableItems = this.createEmptyTableItems(
						property.id,
						treeItem.maxNodesOneType - items.length,
						mergeConfiguration,
						treeItem.id,
						treeItem
					);
					for (var n = 0; n < emptyTableItems.length; n++) {
						items.push(emptyTableItems);
					}
				}
			}
			return items;
		},

		recalculateMaxNode: function (itemByDocElem, maxNodesOneType, currentSum) {
			if (itemByDocElem.length === 0) {
				return;
			}
			var currentMax = 1;
			while (true) {
				for (var i = 0; i < itemByDocElem.length; i++) {
					if (itemByDocElem[i].maxNodesOneType < currentMax) {
						itemByDocElem[i].maxNodesOneType += 1;
						currentSum++;
					}
					if (currentSum >= maxNodesOneType) {
						break;
					}
				}
				currentMax++;
				if (currentSum >= maxNodesOneType) {
					break;
				}
			}
		},

		calculateRowSpans: function (items, maxNodesOneType, mergeConfiguration) {
			var composition =
				mergeConfiguration === 'normal'
					? this.getNormalComposition(maxNodesOneType, items.length)
					: this.getSingleComposition(maxNodesOneType);

			for (var i = 0; i < items.length; i++) {
				items[i].rowSpan = composition[i];
			}
		},

		getNormalComposition: function (number, summandCount) {
			var res = [summandCount];
			var currentSummandIndex = 0;
			var currentSummandCount = summandCount;

			while (currentSummandCount > 0) {
				if (number % currentSummandCount === 0) {
					var summand = number / currentSummandCount;
					for (var i = currentSummandIndex; i < summandCount; i++) {
						res[i] = summand;
					}
					return res;
				} else {
					var firstSummand = Math.floor(number / currentSummandCount);
					res[currentSummandIndex] = firstSummand;
					currentSummandIndex++;
					currentSummandCount--;
					number -= firstSummand;
				}
			}

			return res;
		},

		getSingleComposition: function (summandCount) {
			var res = [summandCount];
			for (var i = 0; i < summandCount; i++) {
				res[i] = 1;
			}
			return res;
		}
	});
});
/* jshint ignore:end */
