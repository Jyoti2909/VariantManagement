/* global define */
define([
	'dojo/_base/declare',
	'./PublicApi/Factory',
	'./PublicApi/ComputeMethodResultBuilder',
	'./PublicApi/PropertyItem',
	'./PublicApi/Element'
], function (
	declare,
	Factory,
	ComputeMethodResultBuilder,
	PropertyItem,
	Element
) {
	var aras = parent.aras;
	var factory = new Factory();

	function validateStyle(cmfStyle) {
		//implemented here (not in setters of CmfStyle.js) not to hurt perfomance and to validate only when a property style was changed, but not on get.
		function isValidColor(color) {
			if (!color || (color[0] === '#' && color.length === 7)) {
				return true;
			}

			console.log(
				"Color isn't valid. Should be in Hex format and in format: '#AbcDef'"
			);
			return false;
		}

		if (!isValidColor(cmfStyle.backgroundColor)) {
			cmfStyle.backgroundColor = null;
		}

		if (!isValidColor(cmfStyle.textColor)) {
			cmfStyle.textColor = null;
		}

		if (cmfStyle.fontSize && !parseInt(cmfStyle.fontSize)) {
			console.log("fontSize isn't valid. Should be positive integer.");
			cmfStyle.fontSize = null;
		}

		if (
			cmfStyle.fontStyle &&
			cmfStyle.fontStyle !== 'normal' &&
			cmfStyle.fontStyle !== 'italic'
		) {
			console.log("fontStyle isn't valid. Should be 'normal' or 'italic'.");
			cmfStyle.fontStyle = null;
		}

		if (
			cmfStyle.fontWeight &&
			cmfStyle.fontWeight !== 'normal' &&
			cmfStyle.fontWeight !== 'bold'
		) {
			console.log("fontWeight isn't valid. Should be 'normal' or 'bold'.");
			cmfStyle.fontWeight = null;
		}

		if (
			cmfStyle.textDecoration &&
			cmfStyle.textDecoration !== 'none' &&
			cmfStyle.textDecoration !== 'underline'
		) {
			console.log(
				"textDecoration isn't valid. Should be 'none' or 'underline'."
			);
			cmfStyle.textDecoration = null;
		}

		if (
			cmfStyle.textAlign &&
			cmfStyle.textAlign !== 'left' &&
			cmfStyle.textAlign !== 'right' &&
			cmfStyle.textAlign !== 'center'
		) {
			console.log(
				"textAlign isn't valid. Should be 'left', 'right' or 'center'."
			);
			cmfStyle.textAlign = null;
		}
	}

	function getPropertyDependencyOrder(docElementTypes) {
		var propertyMap = {};
		var allRelated = [];

		function exclude(array, excludeArray) {
			return array.filter(function (arrayItem) {
				return !excludeArray.some(function (excludeItem) {
					return excludeItem === arrayItem;
				});
			});
		}

		for (
			var elementIndex = 0;
			elementIndex < docElementTypes.length;
			elementIndex++
		) {
			var properties = docElementTypes[elementIndex].properties;
			for (
				var propertyIndex = 0;
				propertyIndex < properties.length;
				propertyIndex++
			) {
				var property = properties[propertyIndex];
				var propertyName = property.name;
				for (var i = 0; i < property.computedProperty.length; i++) {
					var computedProperty = property.computedProperty[i];
					var related = computedProperty.relatedProperties;
					propertyMap[propertyName] = related;
					allRelated = allRelated.concat(exclude(related, [propertyName]));
				}
			}
		}
		var rootItems = exclude(
			Object.getOwnPropertyNames(propertyMap),
			allRelated
		);

		function buildDependencyOrder(tree, rootNodes) {
			var visited = {};
			var dependencyOrder = [];

			function visit(propertyName) {
				var related = tree[propertyName];
				visited[propertyName] = true;
				if (related) {
					var children = exclude(related, dependencyOrder);
					for (var i = 0; i < children.length; i++) {
						if (visited[children[i]]) {
							continue; //circular reference, just ignore
						}
						visit(children[i]);
					}
				}
				dependencyOrder.push(propertyName);
			}

			for (var i = 0; i < rootNodes.length; i++) {
				visit(rootNodes[i]);
			}
			return dependencyOrder;
		}

		var excludeItems = rootItems.filter(function (item) {
			var itemDependencies = propertyMap[item];
			return !(
				itemDependencies &&
				itemDependencies.length === 1 &&
				itemDependencies[0] === item
			);
		});
		return exclude(buildDependencyOrder(propertyMap, rootItems), excludeItems);
	}

	function buildTableItemsMap(allTableItems) {
		var tableItemsObject = {};
		var propertyNameMap = {};
		for (var i = 0; i < allTableItems.length; i++) {
			var tableItem = allTableItems[i];
			tableItemsObject[tableItem.id] = tableItem;
			var propertyName = tableItem.propertyName;
			var propertyMap = propertyNameMap[propertyName] || [];
			propertyMap.push(tableItem);
			propertyNameMap[propertyName] = propertyMap;
		}
		return { all: tableItemsObject, byPropertyName: propertyNameMap };
	}

	return declare('ComputedMethodHelper', [], {
		dataStore: null,

		constructor: function (dataStore) {
			this.dataStore = dataStore;
		},

		executeFromPropertyElement: function (tableItem, changedItemsObject) {
			//TODO: perhaps to remove to have less duplicated code. Can we call executeFromDocElement here?
			if (tableItem.property && tableItem.property.computedMethods.length > 0) {
				var fromComputedMethods = this.executeComputedMethods(tableItem);
				var func = function (element) {
					return element.id === currentChanged.id;
				};
				for (var i = 0; i < fromComputedMethods.changeTableItems.length; i++) {
					var currentChanged = fromComputedMethods.changeTableItems[i];
					var alreadyChanged = changedItemsObject.changeTableItems.filter(func);
					if (alreadyChanged.length < 1) {
						changedItemsObject.changeTableItems.push(currentChanged);
						var beforeChangedItem = fromComputedMethods.beforeChangedTableItems.filter(
							func
						);
						if (beforeChangedItem.length > 0) {
							changedItemsObject.beforeChangedTableItems.push(
								beforeChangedItem[0]
							);
						}
					}
				}
			}
		},

		executeComputedMethods: function (tableItem) {
			var tableItemsObject = {};
			var allTableItems = this.dataStore.getAllTableItems();
			for (var i = 0; i < allTableItems.length; i++) {
				tableItemsObject[allTableItems[i].id] = allTableItems[i];
			}

			var changeTableItems = this.executeComputedMethodWrapper(
				[tableItem],
				tableItemsObject
			);
			var changeRowIds = {};
			for (var j = 0; j < changeTableItems.changedTableItems.length; j++) {
				var changedTreeItem = this.dataStore.getDocElement(
					changeTableItems.changedTableItems[j].treeItemId
				);
				changeRowIds[changedTreeItem.rootItemId] = true;
			}

			var resObj = {
				changeTableItems: changeTableItems.changedTableItems,
				beforeChangedTableItems: changeTableItems.beforeChangedTableItems,
				changeRowIds: changeRowIds
			};
			return resObj;
		},

		executeComputedMethodWrapper: function (
			tableItemsOfSameType,
			allTableItems
		) {
			var changedTableItems = [];
			var changedTableItemsIds = {};
			var changedTableItemsForRecursion = [];
			var beforeChangedTableItems = [];
			var i;
			//TODO: it seems propertyType should contain computedMethods, a property shouldn't contain it (duplicated data for all the props of the same type).
			var computedMethods = tableItemsOfSameType[0].getComputedMethods();
			var self = this;
			var createProp = function (prop) {
				var treeItem = self.dataStore.getDocElement(prop.treeItemId);
				var elementItem = new Element(treeItem, self.dataStore);
				var propertyItem = new PropertyItem(prop, elementItem);
				return propertyItem;
			};
			for (i = 0; i < computedMethods.length; i++) {
				var markedToUpdate = {};
				var resultBuilder = new ComputeMethodResultBuilder(markedToUpdate);
				var changedPropertyItems = tableItemsOfSameType.map(createProp);

				aras.evalMethod(computedMethods[i], '', {
					changedPropertyItems: changedPropertyItems,
					resultBuilder: resultBuilder,
					factory: factory
				});
				for (var j in markedToUpdate) {
					if (!markedToUpdate.hasOwnProperty(j)) {
						continue;
					}
					var changedItem = this.updateRowNodeWithoutEvents(
						markedToUpdate[j],
						j,
						allTableItems
					);
					if (!changedItem.changedTableItem) {
						continue;
					}
					if (changedItem.changedTableItem.discoverOnly === '1') {
						continue;
					}
					if (changedTableItemsIds[changedItem.changedTableItem.id]) {
						continue;
					}

					changedTableItemsIds[changedItem.changedTableItem.id] = true;
					changedTableItems.push(changedItem.changedTableItem);
					beforeChangedTableItems.push(changedItem.beforeChangedTableItem);
				}
			}

			for (var k = 0; k < changedTableItems.length; k++) {
				var changed = changedTableItems[k];
				if (changed.getComputedMethods().length > 0) {
					//and it will allow us to calculate when recursion and when not in one rowNode (rootItem here).
					if (this.dataStore.getDocElement(changed.treeItemId)) {
						changedTableItemsForRecursion.push(changed);
					}
				}
			}

			if (changedTableItemsForRecursion.length) {
				var changedItems = this.executeComputedMethodWrapper(
					changedTableItemsForRecursion,
					allTableItems
				);

				for (i = 0; i < changedItems.changedTableItems.length; i++) {
					if (!changedTableItemsIds[changedItems.changedTableItems[i].id]) {
						changedTableItemsIds[changedItems.changedTableItems[i].id] = true;
						changedTableItems.push(changedItems.changedTableItems[i]);
						beforeChangedTableItems.push(
							changedItems.beforeChangedTableItem[i]
						);
					}
				}
			}

			return {
				changedTableItems: changedTableItems,
				beforeChangedTableItems: beforeChangedTableItems
			};
		},

		isStylesEqual: function (cmfStyle1, cmfStyle2) {
			if (!cmfStyle1 && !cmfStyle2) {
				return true;
			}

			if ((cmfStyle1 && !cmfStyle2) || (!cmfStyle1 && cmfStyle2)) {
				return false;
			}

			if (
				((cmfStyle1.backgroundColor || cmfStyle2.backgroundColor) &&
					cmfStyle1.backgroundColor !== cmfStyle2.backgroundColor) ||
				((cmfStyle1.textColor || cmfStyle2.textColor) &&
					cmfStyle1.textColor !== cmfStyle2.textColor) ||
				((cmfStyle1.fontFamily || cmfStyle2.fontFamily) &&
					cmfStyle1.fontFamily !== cmfStyle2.fontFamily) ||
				((cmfStyle1.fontSize || cmfStyle2.fontSize) &&
					cmfStyle1.fontSize !== cmfStyle2.fontSize) ||
				((cmfStyle1.fontStyle || cmfStyle2.fontStyle) &&
					cmfStyle1.fontStyle !== cmfStyle2.fontStyle) ||
				((cmfStyle1.fontWeight || cmfStyle2.fontWeight) &&
					cmfStyle1.fontWeight !== cmfStyle2.fontWeight) ||
				((cmfStyle1.textDecoration || cmfStyle2.textDecoration) &&
					cmfStyle1.textDecoration !== cmfStyle2.textDecoration) ||
				((cmfStyle1.textAlign || cmfStyle2.textAlign) &&
					cmfStyle1.textAlign !== cmfStyle2.textAlign)
			) {
				return false;
			}

			return true;
		},

		updateRowNodeWithoutEvents: function (
			updatedRow,
			updatedRowId,
			tableItemsList
		) {
			var changedTableItem = null;
			var beforeChangedTableItem = null;
			var tableItem = tableItemsList[updatedRowId];
			var isNeedUpdate = false;
			if (tableItem) {
				beforeChangedTableItem = tableItem.getCopy();
				if (updatedRow.isValueSet) {
					if (tableItem.value !== updatedRow.value) {
						tableItem.value = updatedRow.value;
						isNeedUpdate = true;
					}
				}
				if (updatedRow.isCmfStyleSet) {
					if (!this.isStylesEqual(tableItem.cmfStyle, updatedRow.cmfStyle)) {
						validateStyle(updatedRow.cmfStyle);
						tableItem.cmfStyle = updatedRow.cmfStyle;
						isNeedUpdate = true;
					}
				}
				changedTableItem = tableItem;
			}
			return isNeedUpdate
				? {
						changedTableItem: changedTableItem,
						beforeChangedTableItem: beforeChangedTableItem
				  }
				: {};
		},

		executeFromDocElement: function (element) {
			var changedTableItemsObject = {
				changeTableItems: [],
				changeRowIds: {},
				beforeChangedTableItems: []
			};
			var propertyElements = this.dataStore.getPropertyElements(element);
			for (var j = 0; j < propertyElements.length; j++) {
				var tableItem = propertyElements[j];
				if (
					tableItem.property &&
					tableItem.property.computedMethods.length > 0
				) {
					var changed = this.executeComputedMethods(tableItem);
					changedTableItemsObject.changeTableItems = changedTableItemsObject.changeTableItems.concat(
						changed.changeTableItems
					);
					changedTableItemsObject.beforeChangedTableItems = changedTableItemsObject.beforeChangedTableItems.concat(
						changed.beforeChangedTableItems
					);
					/* jshint ignore:start */
					for (var changedRowId in changed.changeRowIds) {
						changedTableItemsObject.changeRowIds[changedRowId] = true;
					}
					/* jshint ignore:end */
				}
			}
			return changedTableItemsObject;
		},

		getChangeObjectsForFullRecalculation: function () {
			var allTableItems = this.dataStore.getAllTableItems();
			var tableItemMap = buildTableItemsMap(allTableItems);
			var computedPropertyDependencyOrder = getPropertyDependencyOrder(
				this.dataStore.getAllDocumentTypes()
			);
			var tableItems = {
				propertyCalculationOrder: computedPropertyDependencyOrder,
				propertyItems: {},
				allTableItems: tableItemMap.all
			};
			for (var i = 0; i < computedPropertyDependencyOrder.length; i++) {
				var propertyName = computedPropertyDependencyOrder[i];
				var propertyTableItems =
					tableItemMap.byPropertyName[propertyName] || [];
				tableItems.propertyItems[propertyName] = propertyTableItems;
			}
			return tableItems;
		}
	});
});
