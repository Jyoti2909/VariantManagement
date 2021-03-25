/* jshint ignore:start */
define(['dojo/_base/declare', './DataModel'], function (declare, DataModel) {
	var dataModel = new DataModel();

	return declare(null, {
		constructor: function () {},

		updateDocElementTypes: function (globalData, view, propertyTypeList) {
			var spreadsheetColumns = view.spreadsheetColumns;
			var spreadsheetTree = view.spreadsheetTree;
			for (var j = 0; j < globalData.docElementTypes.length; j++) {
				var currentElementType = globalData.docElementTypes[j];
				var propertyCount = 0;
				for (var k = 0; k < currentElementType.properties.length; k++) {
					var currentProperty = currentElementType.properties[k];
					var column = spreadsheetColumns.filter(function (element) {
						return (
							element.propertyId === currentProperty.id ||
							element.additPropertyId === currentProperty.id
						);
					});
					if (column.length > 0) {
						var viewColumn = column[0];
						currentProperty.additPropertyId = viewColumn.additPropertyId;
						currentProperty.display = true;
						currentProperty.isAdditional =
							viewColumn.additPropertyId === currentProperty.id;
						currentProperty.dataType = currentProperty.dataType;
						currentProperty.editorType = viewColumn.editorType;
						currentProperty.editorDataSourceList =
							viewColumn.editorDataSourceList;
						currentProperty.editorDataSourceMethod =
							viewColumn.editorDataSourceMethod;
						currentProperty.editorUseBoth = viewColumn.editorUseBoth;
						currentProperty.editorHeader1 = viewColumn.editorHeader1;
						currentProperty.editorHeader1Width = viewColumn.editorHeader1Width;
						currentProperty.editorHeader2 = viewColumn.editorHeader2;
						currentProperty.editorHeader2Width = viewColumn.editorHeader2Width;
						currentProperty.datePattern = viewColumn.datePattern;
						currentProperty.label = viewColumn.label;
						currentProperty.columnOrder = viewColumn.columnOrder;
						currentProperty.initialWidth = viewColumn.initialWidth;
						currentProperty.additSourcePropertyId =
							viewColumn.additSourcePropertyId;
						currentElementType.groupId = this.getGroupId(
							currentElementType,
							currentProperty,
							viewColumn,
							globalData,
							spreadsheetColumns
						);
						propertyCount++;
					} else {
						currentProperty.display = false;
					}
				}

				currentElementType.properties.sort(function (a, b) {
					if (a.columnOrder > b.columnOrder) {
						return 1;
					}
					if (a.columnOrder < b.columnOrder) {
						return -1;
					}
					return 0;
				});

				var docTypeViewProperties = spreadsheetTree[currentElementType.id];
				currentElementType.visible = propertyCount > 0 ? true : false;
				if (propertyCount > 0) {
					var visibleProperties = currentElementType.properties.filter(
						function (element) {
							return element.display;
						}
					);
					currentElementType.sortOrder = visibleProperties[0].columnOrder;
					currentElementType.isAdditional = visibleProperties[0].isAdditional;
				}
				currentElementType.iconPath = docTypeViewProperties
					? docTypeViewProperties.icon
					: null;
				currentElementType.elementTypeLabel = docTypeViewProperties
					? docTypeViewProperties.elementTypeLabel
					: null;
			}
			view.groupElementTypes = this.getGroupColumnCollection(
				globalData,
				propertyTypeList
			);
		},

		generatePropertyTypeList: function (docElementTypes) {
			var propertyTypeList = [];
			for (var i = 0; i < docElementTypes.length; i++) {
				for (var j = 0; j < docElementTypes[i].properties.length; j++) {
					propertyTypeList[docElementTypes[i].properties[j].id] =
						docElementTypes[i].properties[j];
				}
			}
			return propertyTypeList;
		},

		getGroupId: function (
			currentElementType,
			currentProperty,
			viewColumn,
			globalData,
			spreadsheetColumns
		) {
			if (currentProperty.isAdditional) {
				var res = spreadsheetColumns.filter(function (element) {
					return element.id === viewColumn.additSourcePropertyId;
				});
				if (res.length > 0) {
					var sourceElemenentType = globalData.docElementTypes.filter(function (
						element
					) {
						return (
							element.properties.filter(function (property) {
								return property.id === res[0].propertyId;
							}).length > 0
						);
					});
					if (sourceElemenentType.length > 0) {
						return sourceElemenentType[0].id;
					}
				}
			}
			return currentElementType.groupId || currentElementType.id;
		},

		getGroupColumnCollection: function (globalData, propertyTypeList) {
			var groupElementTypes = this.generateGroupColumnCollection(globalData);

			for (var j = 0; j < groupElementTypes.length; j++) {
				var currentElementType = groupElementTypes[j];
				if (currentElementType.children.length === 1) {
					currentElementType.children[0].groupPropertyIds =
						currentElementType.children[0].propertyIds;
					continue;
				}
				var properties = [];
				for (var k = 0; k < currentElementType.propertyIds.length; k++) {
					properties.push(propertyTypeList[currentElementType.propertyIds[k]]);
				}

				properties.sort(function (a, b) {
					if (a.columnOrder > b.columnOrder) {
						return 1;
					}
					if (a.columnOrder < b.columnOrder) {
						return -1;
					}
					return 0;
				});

				for (var i = 0; i < currentElementType.children.length; i++) {
					var curDocElementType = currentElementType.children[i];
					curDocElementType.groupPropertyIds = [];
					for (var index in properties) {
						if (
							curDocElementType.propertyIds.indexOf(properties[index].id) >= 0
						) {
							curDocElementType.groupPropertyIds.push(properties[index].id);
						} else {
							if (!properties[index].additSourcePropertyId) {
								curDocElementType.groupPropertyIds.push(properties[index].id);
							}
						}
					}
				}
			}
			return groupElementTypes;
		},

		generateGroupColumnCollection: function (globalData) {
			var groupElementTypes = [];
			var visibleElements = globalData.docElementTypes.filter(function (
				element
			) {
				return element.visible === true;
			});
			for (var i = 0; i < visibleElements.length; i++) {
				var currentElement = visibleElements[i];
				var visibleProperties = currentElement.properties.filter(function (
					element
				) {
					return element.display === true;
				});
				var propIds = visibleProperties.map(function (prop) {
					return prop.id;
				});
				var groupElementType;

				var existGroupElementType = groupElementTypes.filter(function (
					element
				) {
					return element.id === currentElement.groupId;
				});
				if (existGroupElementType.length > 0) {
					groupElementType = existGroupElementType[0];
				} else {
					groupElementType = new dataModel.GroupDocElementType();
				}

				groupElementType.id = currentElement.groupId;
				if (currentElement.groupId === currentElement.id) {
					groupElementType.children.push(currentElement);
					groupElementType.sortOrder = currentElement.sortOrder;
					groupElementType.propertyIds = groupElementType.propertyIds.concat(
						propIds
					);
				} else {
					groupElementType.children.push(currentElement);
					groupElementType.propertyIds = groupElementType.propertyIds.concat(
						propIds
					);
				}

				if (existGroupElementType.length <= 0) {
					groupElementTypes.push(groupElementType);
				}
			}
			return groupElementTypes;
		},

		getColumnGroupCollection: function (propertyTypeList, spreadsheetView) {
			var i;
			var columnGroupCollection = [];
			for (i = 0; i < spreadsheetView.spreadsheetColumnGroups.length; i++) {
				var columnGroup = new dataModel.ColumnGroupElement();
				columnGroup.id = spreadsheetView.spreadsheetColumnGroups[i].id;
				columnGroup.label = spreadsheetView.spreadsheetColumnGroups[i].label;
				columnGroup.columnIds =
					spreadsheetView.spreadsheetColumnGroups[i].columnIds;
				columnGroup.level = spreadsheetView.spreadsheetColumnGroups[i].level;

				if (spreadsheetView.spreadsheetColumnGroups[i].styleId) {
					var columnGroupStyle =
						spreadsheetView.cmfStyles[
							spreadsheetView.spreadsheetColumnGroups[i].styleId
						];
					if (columnGroupStyle) {
						columnGroup.columnGroupStyle = columnGroupStyle;
					}
				}
				for (
					var j = 0;
					j < spreadsheetView.spreadsheetColumnGroups[i].columnIds.length;
					j++
				) {
					var column = spreadsheetView.spreadsheetColumns.filter(function (
						element
					) {
						return (
							element.id ===
							spreadsheetView.spreadsheetColumnGroups[i].columnIds[j]
						);
					});
					if (column.length > 0) {
						columnGroup.addProperty(propertyTypeList[column[0].propertyId]);
					}
				}

				columnGroupCollection.push(columnGroup);
			}
			if (spreadsheetView.spreadsheetColumnGroups.length === 0) {
				var emptyColumnGroup = new dataModel.ColumnGroupElement();
				emptyColumnGroup.label = '';
				emptyColumnGroup.isEmpty = true;
				var emptyColumnIds = [];
				for (var k = 0; k < spreadsheetView.spreadsheetColumns.length; k++) {
					emptyColumnIds.push(spreadsheetView.spreadsheetColumns[k].id);
					emptyColumnGroup.addProperty(
						propertyTypeList[spreadsheetView.spreadsheetColumns[k].propertyId]
					);
				}
				emptyColumnGroup.columnIds = emptyColumnIds;
				emptyColumnGroup.level = 2;
				columnGroupCollection.push(emptyColumnGroup);
			}

			for (i = 0; i < spreadsheetView.spreadsheetColumns.length; i++) {
				var currentColumn = spreadsheetView.spreadsheetColumns[i];
				var property = propertyTypeList[currentColumn.propertyId];
				if (property) {
					if (currentColumn.contentStyleId) {
						var contentStyle =
							spreadsheetView.cmfStyles[currentColumn.contentStyleId];
						if (contentStyle) {
							property.contentStyle = contentStyle;
						}
					}

					if (currentColumn.headerStyleId) {
						var headerStyle =
							spreadsheetView.cmfStyles[currentColumn.headerStyleId];
						if (headerStyle) {
							property.headerStyle = headerStyle;
						}
					}
				}
			}

			return columnGroupCollection;
		},

		updateTree: function (globalData, spreadsheetView) {
			var rootItem = globalData.rootItem;
			rootItem.labelMethodName = spreadsheetView.labelMethodName;
		},

		transformToSpreadsheet: function (globalData, spreadSheetViewId) {
			var spreadsheetView = globalData.viewsData.filter(function (element) {
				return element.id === spreadSheetViewId;
			});
			if (spreadsheetView.length > 0) {
				var curSpreadsheetView = spreadsheetView[0];
				var propertyTypeList = this.generatePropertyTypeList(
					globalData.docElementTypes
				);
				this.updateDocElementTypes(
					globalData,
					curSpreadsheetView,
					propertyTypeList
				);
				this.updateTree(globalData, curSpreadsheetView);
				globalData.currentColumnGroupCollection = this.getColumnGroupCollection(
					propertyTypeList,
					curSpreadsheetView
				);

				var docElementComparer = function (a, b) {
					if (a.sortOrder > b.sortOrder) {
						return 1;
					} else if (a.sortOrder < b.sortOrder) {
						return -1;
					}
					if (a.visible && !b.visible) {
						return -1;
					}
					if (!a.visible && b.visible) {
						return 1;
					}
					if (!a.visible && !b.visible) {
						return 0;
					}
					if (a.isAdditional && !b.isAdditional) {
						return 1;
					}
					if (!a.isAdditional && b.isAdditional) {
						return -1;
					}
					return 0;
				};

				globalData.docElementTypes.sort(docElementComparer);
				for (var i = 0; i < globalData.docElementTypes.length; i++) {
					var docElement = globalData.docElementTypes[i];
					docElement.children.sort(docElementComparer);
				}
				return globalData;
			}
		}
	});
});
/* jshint ignore:end */
