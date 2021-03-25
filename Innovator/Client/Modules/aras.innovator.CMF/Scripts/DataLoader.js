/* jshint ignore:start */
//jscs:disable
define(['dojo/_base/declare', './DataModel'], function (declare, DataModel) {
	var dataModel = new DataModel();
	var _aras;
	var sortOrderComparer = function (a, b) {
		if (a.sortOrder > b.sortOrder) {
			return 1;
		}
		if (a.sortOrder < b.sortOrder) {
			return -1;
		}
		return 0;
	};

	function getBindingMetaData(docElementType) {
		var bindingTypes = docElementType.selectNodes(
				"Relationships/Item[@type='cmf_ElementBinding']"
			),
			bindingType,
			elemPropertyBindings,
			elemPropertyBinding,
			itemDocElPropertyId,
			itemPropertyName,
			binding = { binds: {} },
			j,
			readOnly;

		if (!bindingTypes.length) {
			return;
		}

		bindingType = bindingTypes[0];
		elemPropertyBindings = bindingType.selectNodes(
			"Relationships/Item[@type='cmf_PropertyBinding']"
		);
		binding.elemReferenceType = getItemProperty(bindingType, 'reference_type');
		binding.trackingMode = getItemProperty(bindingType, 'tracking_mode');
		binding.resolutionMode = getItemProperty(bindingType, 'resolution_mode');
		binding.newRowMode = getItemProperty(bindingType, 'new_row_mode');
		binding.mappingMethod = getItemProperty(
			bindingType,
			'structure_mapping_method'
		);
		binding.referenceRequired =
			getItemProperty(bindingType, 'reference_required') !== '0';
		binding.onCreateReference = getItemProperty(
			bindingType,
			'on_create_reference'
		);
		binding.onAfterPick = getItemProperty(bindingType, 'on_after_pick');
		binding.onApplyBinding = getItemProperty(bindingType, 'on_apply_binding');
		for (j = 0; j < elemPropertyBindings.length; j++) {
			elemPropertyBinding = elemPropertyBindings[j];
			itemDocElPropertyId = getItemProperty(elemPropertyBinding, 'property');
			readOnly = getItemProperty(elemPropertyBinding, 'read_only');
			itemPropertyName = _aras.getItemProperty(
				elemPropertyBinding.selectSingleNode('reference_type_property_id/Item'),
				'name'
			);
			binding.binds[itemDocElPropertyId] = {
				itemPropertyName: itemPropertyName,
				readOnly: readOnly === '1'
			};
		}

		return binding;
	}

	function generateSpreadSheetColumns(columnNodes) {
		var columnCollection = [];
		for (var i = 0; i < columnNodes.length; i++) {
			var columnOrder = getItemProperty(columnNodes[i], 'col_order');
			if (columnOrder) {
				columnOrder = parseInt(columnOrder);
			}
			columnCollection.push({
				id: getItemProperty(columnNodes[i], 'id'),
				propertyId: getItemProperty(columnNodes[i], 'property'),
				additPropertyId: _aras.getItemProperty(
					columnNodes[i].selectSingleNode(
						"Relationships/Item[@type='cmf_AdditionalPropertyType']"
					),
					'additional_property'
				),
				additSourcePropertyId: _aras.getItemProperty(
					columnNodes[i].selectSingleNode(
						"Relationships/Item[@type='cmf_AdditionalPropertyType']"
					),
					'source_id'
				),
				label: getItemProperty(columnNodes[i], 'header'),
				columnOrder: columnOrder,
				editorType: getItemProperty(columnNodes[i], 'classification'),
				editorDataSourceMethod: _aras.getItemProperty(
					columnNodes[i].selectSingleNode('editor_data_source_method/Item'),
					'name'
				),
				editorUseBoth: getItemProperty(columnNodes[i], 'editor_use_both'),
				editorDataSourceList: getItemProperty(
					columnNodes[i],
					'editor_data_source_list'
				),
				editorHeader1: getItemProperty(
					columnNodes[i],
					'editor_header_1_for_list_label'
				),
				editorHeader1Width: getItemProperty(
					columnNodes[i],
					'editor_header_1_width'
				),
				editorHeader2: getItemProperty(
					columnNodes[i],
					'editor_header_2_for_list_value'
				),
				editorHeader2Width: getItemProperty(
					columnNodes[i],
					'editor_header_2_width'
				),
				datePattern: getItemProperty(columnNodes[i], 'date_pattern'),
				headerStyleId: getItemProperty(columnNodes[i], 'header_style'),
				contentStyleId: getItemProperty(columnNodes[i], 'content_style'),
				initialWidth: getItemProperty(columnNodes[i], 'initial_width')
			});
		}

		columnCollection.sort(function (a, b) {
			if (a.columnOrder > b.columnOrder) {
				return 1;
			}
			if (a.columnOrder < b.columnOrder) {
				return -1;
			}
			return 0;
		});

		return columnCollection;
	}

	function generateSpreadSheetTree(treeNodes) {
		var treeCollection = [treeNodes.length];
		for (var i = 0; i < treeNodes.length; i++) {
			var docElementTypeId = getItemProperty(treeNodes[i], 'element_type');
			treeCollection[docElementTypeId] = {
				icon: getItemProperty(treeNodes[i], 'document_element_icon'),
				elementTypeLabel: getItemProperty(treeNodes[i], 'label')
			};
		}
		return treeCollection;
	}

	function generateSpreadsheetColumnGroups(
		columnGroupNode,
		spreadsheetColumns
	) {
		if (!columnGroupNode) {
			return [];
		}
		var xmldom = _aras.createXMLDocument();
		xmldom.loadXML(columnGroupNode.xml);

		var headerRow = xmldom.selectSingleNode(
			'/Item/related_id/Item[@type="cmf_TabularViewHeaderRow"]'
		);
		var level = parseInt(getItemProperty(headerRow, 'group_level'));
		var columnGroupsXml = headerRow.selectNodes(
			'./Relationships/Item[@type="cmf_TabularViewColumnGroups"]'
		);

		var columnGroups = [],
			columnGroup;

		for (var j = 0; j < columnGroupsXml.length; j++) {
			var groupNode = columnGroupsXml[j];
			columnGroup = {
				start: parseInt(getItemProperty(groupNode, 'start_column'), 10),
				end: parseInt(getItemProperty(groupNode, 'end_column'), 10),
				id: getItemProperty(groupNode, 'id'),
				label: getItemProperty(groupNode, 'label'),
				styleId: getItemProperty(groupNode, 'group_style'),
				level: level
			};
			columnGroups.push(columnGroup);
		}

		//create fake columnGroups for missed
		columnGroups.sort(function (a, b) {
			return a.start > b.start ? 1 : -1;
		});

		if (columnGroups.length && columnGroups[0].start !== 1) {
			columnGroup = {
				level: 2,
				start: 1,
				end: columnGroups[0].start - 1,
				label: ''
			};

			columnGroups.unshift(columnGroup);
		}

		//init Length because it is changed dinamically inside for.
		var columnGroupsLength = columnGroups.length;
		for (j = 0; j < columnGroupsLength; j++) {
			if (j === columnGroupsLength - 1) {
				if (columnGroups[j].end < spreadsheetColumns.length) {
					columnGroup = {
						level: 2,
						start: columnGroups[j].end + 1,
						end: spreadsheetColumns.length,
						label: ''
					};

					columnGroups.push(columnGroup);
				}
				break;
			}

			if (columnGroups[j].end + 1 !== columnGroups[j + 1].start) {
				columnGroup = {
					level: 2,
					start: columnGroups[j].end + 1,
					end: columnGroups[j + 1].start - 1,
					label: ''
				};

				columnGroups.push(columnGroup);
			}
		}

		for (j = 0; j < columnGroups.length; j++) {
			columnGroup = columnGroups[j];
			var columnIds = [];
			for (
				var k = columnGroup.start - 1;
				k < spreadsheetColumns.length && k < columnGroup.end && k >= 0;
				k++
			) {
				columnIds.push(spreadsheetColumns[k].id);
			}

			columnGroup.columnIds = columnIds;
		}

		columnGroups.sort(function (a, b) {
			return a.start > b.start ? 1 : -1;
		});

		return columnGroups;
	}

	function generateModels(
		itemNodes,
		docElements,
		tableItems,
		docElemList,
		useFullNames
	) {
		var itemTypeIdByNameCached = {};
		for (var i = 0; i < itemNodes.length; i++) {
			var itemNode = itemNodes[i];
			var type = useFullNames
				? itemNode.getAttribute('type')
				: itemNode.parentNode.getAttribute('e');
			var relationProperty = useFullNames
				? getItemProperty(itemNode, 'reference_id')
				: itemNode.getAttribute('a');
			if (relationProperty) {
				//Element
				var docElemSortOrder = useFullNames
					? getItemProperty(itemNode, 'sort_order')
					: itemNode.getAttribute('b') || '';
				if (docElemSortOrder) {
					docElemSortOrder = parseInt(docElemSortOrder);
				}
				var parentReferenceId = useFullNames
					? getItemProperty(itemNode, 'parent_reference_id')
					: itemNode.getAttribute('c') || '';
				var docElement = {
					id: itemNode.getAttribute(useFullNames ? 'id' : 'd'),
					parentRelId: parentReferenceId,
					relatedId: relationProperty,
					type: type,
					sortOrder: docElemSortOrder,
					boundItemId: useFullNames
						? getItemProperty(itemNode, 'bound_item_id')
						: itemNode.getAttribute('f') || '',
					boundItemConfigId: useFullNames
						? getItemProperty(itemNode, 'bound_item_config_id')
						: itemNode.getAttribute('g') || '',
					trackingMode: useFullNames
						? getItemProperty(itemNode, 'tracking_mode')
						: itemNode.getAttribute('h') || '',
					resolutionMode: useFullNames
						? getItemProperty(itemNode, 'resolution_mode')
						: itemNode.getAttribute('i') || '',
					propertyItems: [],
					childElements: []
				};
				docElements.push(docElement);
				docElements[relationProperty] = docElement;
				if (parentReferenceId) {
					docElements[parentReferenceId].childElements.push(docElement);
				}
			} else {
				//PropertyItem
				var cmfStyleAml = useFullNames
						? getItemProperty(itemNode, 'cmf_style')
						: itemNode.getAttribute('j'),
					style = null;

				if (cmfStyleAml) {
					style = CMF.Utils.getCmfStyleFromAml(cmfStyleAml);
				}

				var referenceId = useFullNames
					? getItemProperty(itemNode, 'element_reference_id')
					: itemNode.getAttribute('k');
				var typeId;

				if (!itemTypeIdByNameCached[type]) {
					itemTypeIdByNameCached[type] = _aras.getItemTypeId(type);
				}

				typeId = itemTypeIdByNameCached[type];
				var propertyItem = {
					id: itemNode.getAttribute(useFullNames ? 'id' : 'd'),
					value: useFullNames
						? getItemProperty(itemNode, 'value')
						: itemNode.getAttribute('l') || '',
					relatedId: referenceId,
					typeId: typeId,
					permissionId: useFullNames
						? getItemProperty(itemNode, 'permission_id')
						: itemNode.getAttribute('m') || '',
					discoverOnly:
						itemNode.getAttribute(useFullNames ? 'discover_only' : 'n') || '',
					cmfStyle: style
				};
				tableItems.push(propertyItem);
				docElements[referenceId].propertyItems.push(propertyItem);
			}
		}

		if (docElemList) {
			function addPropertyIfNeed(currentDocElement, typeId) {
				for (var i = 0; i < currentDocElement.propertyItems.length; i++) {
					if (currentDocElement.propertyItems[i].typeId == typeId) {
						return;
					}
				}

				var propertyItem = {
					id: _aras.generateNewGUID(),
					value: '',
					typeId: typeId,
					discoverOnly: '1'
				};
				currentDocElement.propertyItems.push(propertyItem);
				tableItems.push(propertyItem);
			}

			for (i = 0; i < docElemList.length; i++) {
				var docElemListName = docElemList[i].name;
				var elments = docElements.filter(function (element) {
					return element.type == docElemListName;
				});

				for (var k = 0; k < elments.length; k++) {
					for (var j = 0; j < docElemList[i].properties.length; j++) {
						addPropertyIfNeed(elments[k], docElemList[i].properties[j].typeId);
					}
				}
			}
		}
	}

	function generateStyle(xmldomResultNode) {
		var styleNode,
			styleNodes = xmldomResultNode.selectNodes(
				"Result/Item[@type='cmf_Style']"
			),
			style = {},
			i;

		for (i = 0; i < styleNodes.length; i++) {
			styleNode = styleNodes[i];
			style[styleNode.getAttribute('id')] = CMF.Utils.getCmfStyleFromAmlNode(
				styleNode
			);
		}

		return style;
	}

	function handleLoadItemsResult(
		baseDoc,
		viewsMetaData,
		resultArasNode,
		docElemList,
		itemId
	) {
		//"G" means Group of Elements and PropertyItems of the same type, "I" means Item in group, Element or PropertyItem
		var itemNodes = resultArasNode.selectNodes(
			'Result/Item/Rels_someSaltGFJHpiwy3/G/I'
		); //Rels_someSaltGFJHpiwy3 - not to have the same property
		var genStyle = generateStyle(resultArasNode);
		for (var i = 0; i < viewsMetaData.length; i++) {
			viewsMetaData[i].cmfStyles = genStyle;
			var labelMethodName = resultArasNode.selectSingleNode(
				'Result/Item[@type="Method" and @id=\'' +
					viewsMetaData[i].labelMethod +
					"']/name"
			);
			if (labelMethodName) {
				viewsMetaData[i].labelMethodName = labelMethodName.text;
			}
		}
		var docElements = [];
		var tableItems = [];
		generateModels(itemNodes, docElements, tableItems, docElemList, false);
		resultArasNode.loadXML('<TryToCleanupMemory/>');
		// addition
		var baseRelationships = baseDoc.selectSingleNode(
			'Item[@id="' + itemId + '"]/Relationships'
		);
		if (baseRelationships) {
			var baseAddItems = baseRelationships.selectNodes('Item[@action="add"]');
			generateModels(baseAddItems, docElements, tableItems, null, true);

			// removal
			var baseDeletedItems = baseRelationships.selectNodes(
				'Item[@action="delete"]'
			);
			for (var k = 0; k < baseDeletedItems.length; k++) {
				var removedItem = baseDeletedItems[k];
				docElements = docElements.filter(function (element) {
					return element.id !== removedItem.getAttribute('id');
				});
			}

			// updating
			var baseUpdateItems = baseRelationships.selectNodes(
				'Item[@action="update"]'
			);
			for (var j = 0; j < baseUpdateItems.length; j++) {
				var updatedItem = baseUpdateItems[j],
					foundTableItems = tableItems.filter(function (element) {
						return element.id === updatedItem.getAttribute('id');
					});

				if (foundTableItems.length > 0) {
					foundTableItems[0].value = getItemProperty(updatedItem, 'value');
					var cmfStyleAml = getItemProperty(updatedItem, 'cmf_style');
					if (cmfStyleAml) {
						foundTableItems[0].cmfStyle = CMF.Utils.getCmfStyleFromAml(
							cmfStyleAml
						);
					} else {
						foundTableItems[0].cmfStyle = null;
					}
				}
			}
		}
		return { elementItems: docElements, propertiesItems: tableItems };
	}

	function loadItems(
		docElemList,
		itemId,
		baseXml,
		viewsMetaData,
		itemTypeName
	) {
		var baseDoc = _aras.createXMLDocument();
		baseDoc.loadXML(baseXml);
		var currentAction = baseDoc.firstChild.getAttribute('action');
		var aml = generateAmlForItems(
			docElemList,
			itemId,
			viewsMetaData,
			currentAction,
			itemTypeName
		);
		var queryItem = new Item('Method', 'cmf_GetItemsAndOptimizeResult');
		queryItem.setProperty('amlGetQuery', aml);
		//ArasModules.soap is used to use memory less a bit, to reduce several parsing of xml in _aras.soapSend, e.g., we needn't call setOriginalPermissionID here.
		var promise = parent.ArasModules.soap(queryItem.node.xml);
		return promise.then(function (resultNode) {
			//we need to create arasXmlDocument instead of using resultNode (type of Document returned by Native XHR, e.g., in IE 11 for now it's related to ActiveXObject, perhaps so,
			//working with the resultNode, e.g., calling getProperty takes in about 10 times slower than arasXmlDocument)
			var arasDoc = _aras.createXMLDocument();
			arasDoc.loadXML(resultNode.xml);
			resultNode.ownerDocument.loadXML('<TryToCleanupMemory/>');
			return handleLoadItemsResult(
				baseDoc,
				viewsMetaData,
				arasDoc,
				docElemList,
				itemId
			);
		});
	}

	function generateStyleAml(spreadsheetViews) {
		var j,
			styles = {},
			style,
			aml = '';

		for (var i = 0; i < spreadsheetViews.length; i++) {
			for (j = 0; j < spreadsheetViews[i].spreadsheetColumns.length; j++) {
				var contentStyleId =
					spreadsheetViews[i].spreadsheetColumns[j].contentStyleId;
				var headerStyleId =
					spreadsheetViews[i].spreadsheetColumns[j].headerStyleId;
				if (contentStyleId && !styles[contentStyleId]) {
					styles[contentStyleId] = contentStyleId;
				}
				if (headerStyleId && !styles[headerStyleId]) {
					styles[headerStyleId] = headerStyleId;
				}
			}
			for (j = 0; j < spreadsheetViews[i].spreadsheetColumnGroups.length; j++) {
				var styleId = spreadsheetViews[i].spreadsheetColumnGroups[j].styleId;
				if (styleId && !styles[styleId]) {
					styles[styleId] = styleId;
				}
			}
		}

		for (style in styles) {
			aml +=
				"<Item type='cmf_Style' id='" +
				style +
				"' action='get' " +
				"select='background_color, text_color, font_family, font_size, font_style, font_weight, text_decoration, text_align'/>";
		}

		return aml;
	}

	function generateAmlForItems(
		docElemList,
		itemId,
		viewsMetaData,
		currentAction,
		docTypeName
	) {
		var i, j, k;
		var aml = '<AML>';
		if (currentAction !== 'add') {
			aml +=
				'<Item type="' +
				docTypeName +
				'" action="get" id="' +
				itemId +
				'" select="id" ><Relationships>';
			for (k = 0; k < docElemList.length; k++) {
				var docElem = docElemList[k];
				aml +=
					'<Item type="' +
					docElem.name +
					'" action="get" select="reference_id, parent_reference_id, sort_order, bound_item_id, bound_item_config_id, tracking_mode, resolution_mode" />';
				for (j = 0; j < docElem.properties.length; j++) {
					aml +=
						'<Item type="' +
						docElem.properties[j].name +
						'" action="get" select="element_reference_id, value, cmf_style, permission_id" />';
				}
			}
			aml += '</Relationships></Item>';
		}
		for (i = 0; i < viewsMetaData.length; i++) {
			if (viewsMetaData[i].labelMethod) {
				aml +=
					'<Item type="Method" id="' +
					viewsMetaData[i].labelMethod +
					'" action="get" select="name"/>';
			}
		}
		aml += generateStyleAml(viewsMetaData);
		aml += '</AML>';
		return aml;
	}

	function generateRootItems(
		docElements,
		rootItems,
		tableItems,
		rootItem,
		docElementTypes,
		dataStore
	) {
		rootItem.docElementTypes = [];
		dataStore.treeItemCollection[rootItem.id] = rootItem;
		for (var j = 0; j < rootItems.length; j++) {
			var rootDocElementType = docElementTypes[rootItems[j].id];
			if (!rootDocElementType) {
				continue;
			}
			var docElementsFiltered = docElements.filter(function (element) {
				return element.type === rootDocElementType.name;
			});
			docElementsFiltered.sort(function (a, b) {
				if (a.sortOrder > b.sortOrder) {
					return 1;
				}
				if (a.sortOrder < b.sortOrder) {
					return -1;
				}
				return 0;
			});

			for (var i = 0; i < docElementsFiltered.length; i++) {
				var currentDocElement = docElementsFiltered[i];
				//TODO: is it possible to have only one code of creating treeItem? This code is duplicated with the code in generateTreeItemsByDocElementType.
				var treeItem = new dataModel.TreeItemModel();
				treeItem.id = currentDocElement.id;
				treeItem.documentElementType = rootDocElementType;
				treeItem.documentElementTypeId = rootDocElementType.id;
				treeItem.rootItemId = currentDocElement.id;
				treeItem.parentId = 'root';
				treeItem.relatedId = currentDocElement.relatedId;
				treeItem.sortOrder = currentDocElement.sortOrder
					? currentDocElement.sortOrder
					: 128;
				//boundItem_props
				treeItem.boundItemId = currentDocElement.boundItemId;
				treeItem.boundItemConfigId = currentDocElement.boundItemConfigId;
				treeItem.boundItem = currentDocElement.boundItem;
				treeItem.trackingMode = currentDocElement.trackingMode;
				treeItem.resolutionMode = currentDocElement.resolutionMode;
				var docElementItems = currentDocElement.propertyItems;
				var propertyElements = generateTableItemsForTreeItem(
					docElementItems,
					treeItem,
					rootDocElementType
				);
				for (var k = 0; k < propertyElements.length; k++) {
					treeItem.tableItemIds.push(propertyElements[k].id);
					dataStore.tableItemCollection[propertyElements[k].id] =
						propertyElements[k];
				}

				dataStore.treeItemCollection[treeItem.id] = treeItem;
				rootItem.childrenIds.push(treeItem.id);
			}
			rootItem.docElementTypes.push(rootDocElementType);
		}
	}

	function generateTree(
		root,
		docElements,
		tableItems,
		docElementTypes,
		dataStore
	) {
		var mainStack = [];
		var rootChildren = dataStore.getDocElementChildren(root);
		for (var i = 0; i < rootChildren.length; i++) {
			var rootTreeItem = rootChildren[i];
			mainStack.push(rootTreeItem);

			while (mainStack.length > 0) {
				var currentTreeItem = mainStack.pop();

				updateTreeItem(
					currentTreeItem,
					docElements,
					rootTreeItem.id,
					tableItems,
					docElementTypes,
					dataStore
				);

				var currentChildren = dataStore.getDocElementChildren(currentTreeItem);
				for (var j = 0; j < currentChildren.length; j++) {
					mainStack.push(currentChildren[j]);
				}
			}
		}
	}

	function updateTreeItem(
		currentTreeItem,
		docElements,
		rootId,
		tableItems,
		docElementTypes,
		dataStore
	) {
		var childrenDocTypes = docElementTypes.filter(function (element) {
			return element.parentId === currentTreeItem.documentElementType.id;
		});
		var childElements = docElements[currentTreeItem.relatedId].childElements;
		for (var i = 0; i < childrenDocTypes.length; i++) {
			var currentDocElementType = docElementTypes[childrenDocTypes[i].id];
			var itemsByDocElementType = childElements.filter(function (element) {
				return element.type === currentDocElementType.name;
			});
			itemsByDocElementType.sort(function (a, b) {
				if (a.sortOrder > b.sortOrder) {
					return 1;
				}
				if (a.sortOrder < b.sortOrder) {
					return -1;
				}
				return 0;
			});
			var treeItems = generateTreeItemsByDocElementType(
				itemsByDocElementType,
				currentDocElementType,
				tableItems,
				currentTreeItem,
				rootId,
				dataStore
			);
			for (var j = 0; j < treeItems.length; j++) {
				currentTreeItem.childrenIds.push(treeItems[j].id);
				dataStore.treeItemCollection[treeItems[j].id] = treeItems[j];
			}
		}
	}

	function generateTreeItemsByDocElementType(
		docElements,
		currentDocElementType,
		tableItems,
		parentItem,
		rootId,
		dataStore
	) {
		var treeItemCollection = [];

		for (var i = 0; i < docElements.length; i++) {
			var currentDocElement = docElements[i];
			//TODO: is it possible to have only one code of creating treeItem? This code is duplicated with the code in generateRootItems.
			var treeItem = new dataModel.TreeItemModel();
			treeItem.id = currentDocElement.id;
			treeItem.documentElementType = currentDocElementType;
			treeItem.documentElementTypeId = currentDocElementType.id;
			treeItem.rootItemId = rootId;
			treeItem.parentId = parentItem.id;
			treeItem.relatedId = currentDocElement.relatedId;
			treeItem.parentRelId = currentDocElement.parentRelId;
			treeItem.sortOrder = currentDocElement.sortOrder;
			//boundItem_props
			treeItem.boundItemId = currentDocElement.boundItemId;
			treeItem.boundItemConfigId = currentDocElement.boundItemConfigId;
			treeItem.boundItem = currentDocElement.boundItem;
			treeItem.trackingMode = currentDocElement.trackingMode;
			treeItem.resolutionMode = currentDocElement.resolutionMode;

			var docElementItems = currentDocElement.propertyItems;
			var propertyElements = generateTableItemsForTreeItem(
				docElementItems,
				treeItem,
				currentDocElementType
			);

			for (var j = 0; j < propertyElements.length; j++) {
				dataStore.tableItemCollection[propertyElements[j].id] =
					propertyElements[j];
				treeItem.tableItemIds.push(propertyElements[j].id);
			}

			treeItemCollection.push(treeItem);
		}
		return treeItemCollection;
	}

	function generateTableItemsForTreeItem(
		items,
		treeItem,
		currentDocElementType
	) {
		var tableItemsCollection = [],
			currentPropertyTypeFiltered,
			currentPropertyType;
		for (var j = 0; j < items.length; j++) {
			var currentProperty = items[j];
			var tableItemModel = new dataModel.TableItemModel();
			tableItemModel.value = currentProperty.value;
			tableItemModel.tableItemId = currentProperty.id;
			tableItemModel.isEmpty = false;
			tableItemModel.treeItemId = treeItem.id;
			tableItemModel.treeItem = treeItem;
			tableItemModel.elementReferenceId = currentProperty.relatedId;
			tableItemModel.cmfStyle = currentProperty.cmfStyle || null;
			tableItemModel.permissionId = currentProperty.permissionId;
			tableItemModel.substitutionValue = currentProperty.substitutionValue;
			tableItemModel.discoverOnly = currentProperty.discoverOnly;
			currentPropertyTypeFiltered = currentDocElementType.properties.filter(
				function (element) {
					return element.typeId === currentProperty.typeId;
				}
			);

			if (currentPropertyTypeFiltered.length === 1) {
				currentPropertyType = currentPropertyTypeFiltered[0];
				tableItemModel.propertyId = currentPropertyType.id;
				tableItemModel.propertyName = currentPropertyType.name;
				tableItemModel.propertyTypeId = currentPropertyType.typeId;
				//TODO: remove all props of tableItemModel which contains in prop "property". Duplicated data.
				tableItemModel.property = currentPropertyType;
				tableItemModel.sortOrder = currentPropertyType.sortOrder;
				tableItemModel.defaultPermission =
					currentPropertyType.defaultPermission;

				if (treeItem.boundItem && currentPropertyType.bindingType) {
					tableItemModel.bindingType = currentPropertyType.bindingType;
				}
			}

			tableItemsCollection.push(tableItemModel);
		}

		tableItemsCollection.sort(function (a, b) {
			if (a.sortOrder > b.sortOrder) {
				return 1;
			}
			if (a.sortOrder < b.sortOrder) {
				return -1;
			}
			return 0;
		});

		return tableItemsCollection;
	}

	function generateDocElementTypes(docElemTypeList) {
		var rootElementType = docElemTypeList.filter(function (element) {
			return element.parentId === '';
		});
		var mainStack = [];
		var docElementTypes = [];
		if (rootElementType.length > 0) {
			var firstRootDocElementType = rootElementType[0];
			mainStack.push({ element: firstRootDocElementType });
			while (mainStack.length > 0) {
				var data = mainStack.pop();
				var currentElement = data.element;
				var parent = data.parent;

				var docElement = new dataModel.DocElementType();
				docElement.name = currentElement.name;
				docElement.id = currentElement.id;
				docElement.propertyIds = [];
				docElement.properties = currentElement.properties;
				docElement.parentId = currentElement.parentId;
				docElement.binding = currentElement.binding;
				docElement.referenceRequired = currentElement.referenceRequired;
				for (var i = 0; i < currentElement.properties.length; i++) {
					docElement.propertyIds.push(currentElement.properties[i].id);
				}
				docElementTypes[docElement.id] = docElement;
				docElementTypes.push(docElement);
				if (parent) {
					parent.children.push(docElement);
				}

				var childrenTypes = docElemTypeList.filter(function (element) {
					return element.parentId === currentElement.id;
				});
				for (var j = 0; j < childrenTypes.length; j++) {
					mainStack.push({ element: childrenTypes[j], parent: docElement });
				}
			}
		}
		return docElementTypes;
	}

	function generatePropertyTypeList(docElemTypeList) {
		var propertyTypeList = [];
		for (var i = 0; i < docElemTypeList.length; i++) {
			for (var j = 0; j < docElemTypeList[i].properties.length; j++) {
				propertyTypeList.push(docElemTypeList[i].properties[j]);
			}
		}
		return propertyTypeList;
	}

	function getItemProperty(node, property) {
		var propertyNode = node.selectSingleNode(property);
		if (propertyNode) {
			return propertyNode.text;
		} else {
			return '';
		}
	}

	///////////////////////////////////////////////////

	function getMetaData(docTypeId, views) {
		var xmldom = getMetaAml(docTypeId, views);
		var docElements = generateDocElements(xmldom);
		var viewsMetaData = [];
		for (var i = 0; i < views.length; i++) {
			var currentView = views[i];
			var columnNodes = xmldom.selectNodes(
				'Result/Item[@type="cmf_TabularView" and @id=\'' +
					currentView.id +
					'\']/Relationships/Item[@type="cmf_TabularViewColumn"]'
			);
			var treeNodes = xmldom.selectNodes(
				'Result/Item[@type="cmf_TabularView" and @id=\'' +
					currentView.id +
					'\']/Relationships/Item[@type="cmf_TabularViewTree"]'
			);
			var columnGroupNode = xmldom.selectSingleNode(
				'Result/Item[@type="cmf_TabularView" and @id=\'' +
					currentView.id +
					'\']/Relationships/Item[@type="cmf_TabularViewHeaderRows"]'
			);
			var spreadsheetNode = xmldom.selectSingleNode(
				'Result/Item[@type="cmf_TabularView" and @id=\'' + currentView.id + "']"
			);
			var spreadSheetColumns = generateSpreadSheetColumns(columnNodes);
			var spreadSheetTree = generateSpreadSheetTree(treeNodes);
			var spreadsheetColumnGroups = generateSpreadsheetColumnGroups(
				columnGroupNode,
				spreadSheetColumns
			);
			var defaultHealderStyleNode = spreadsheetNode.selectSingleNode(
				'default_header_style/Item'
			);
			var defaultColumnGroupsStyleNode = columnGroupNode
				? columnGroupNode.selectSingleNode(
						'.//Item[@type="cmf_TabularViewHeaderRow"]/header_style/Item'
				  )
				: null;

			viewsMetaData.push({
				id: currentView.id,
				labelMethod: getItemProperty(spreadsheetNode, 'tree_label_method'),
				defaultHealderStyle: CMF.Utils.getCmfStyleFromAmlNode(
					defaultHealderStyleNode
				),
				defaultColumnGroupsStyle: CMF.Utils.getCmfStyleFromAmlNode(
					defaultColumnGroupsStyleNode
				),
				gridBorderColor: getItemProperty(spreadsheetNode, 'grid_border_color'),
				spreadsheetColumns: spreadSheetColumns,
				spreadsheetTree: spreadSheetTree,
				spreadsheetColumnGroups: spreadsheetColumnGroups,
				docTypeId: currentView.docTypeId,
				itemId: currentView.itemId,
				name: currentView.name
			});
		}
		return { elementTypes: docElements, viewMetaData: viewsMetaData };
	}

	function addBoundItems(elementItems, docElementTypes) {
		var currentBind,
			elementItem,
			elementType,
			boundItem,
			boundItems,
			i,
			j,
			k,
			elementItemsFiltered,
			boundItemTypeId,
			someId, //will be config_id for float behavour or id for fixed one
			propertyNamesOfElementType,
			isBehavFloat;

		function fillBound(
			boundItems,
			boundItemTypeId,
			isBehavFloat,
			propertyNamesOfElementType
		) {
			//if we would set one request to all the items, then we cannot to use "where id in" and if any of Items was removed then we'll get nothing from the request.
			var boundItemsSomeIds = Object.keys(boundItems);
			if (!boundItemsSomeIds.length) {
				return;
			}
			var boundItemsFromDb = {},
				boundIomItemFromDb;
			var aml = '<AML>';
			var statement;
			var someIdPropertyName = isBehavFloat ? 'config_id' : 'id';

			aml += "<Item typeId='" + boundItemTypeId + "' action='get' select='";
			for (propertyName in propertyNamesOfElementType) {
				aml += propertyName + ', ';
			}
			aml += someIdPropertyName + "'";
			if (!isBehavFloat) {
				statement = " idlist='" + boundItemsSomeIds.join(', ') + "'";
				aml += statement;
			}
			aml += '>';
			if (isBehavFloat) {
				statement = CMF.Utils.getStatementForFloatBehavior(boundItemsSomeIds);
				aml += statement;
			}
			aml += '</Item>';
			aml += '</AML>';

			var item = _aras.newIOMItem();
			item.loadAML(aml);
			var result = item.apply(); //no validation isError(), because, e.g., "not found", "no perm." is Ok here.

			var boundIomItemsFromDb = result.getItemsByXPath(
				_aras.XPathResult('/Item')
			);
			var boundIomItemsFromDbCount = boundIomItemsFromDb.getItemCount();
			for (var m = 0; m < boundIomItemsFromDbCount; m++) {
				boundIomItemFromDb = boundIomItemsFromDb.getItemByIndex(m);
				var boundItemsFromDbId = boundIomItemFromDb.getProperty(
					someIdPropertyName
				);
				boundItemsFromDb[boundItemsFromDbId] = boundIomItemFromDb;
			}

			for (var someIdBoundItems in boundItems) {
				var boundItem = boundItems[someIdBoundItems];
				boundIomItemFromDb = boundItemsFromDb[someIdBoundItems];
				if (!boundIomItemFromDb) {
					boundItem.isRemovedOrNoPermissions = true;
					continue;
				}
				//idAccordingToBehav is set as 1) if fixed behavior: id of item (where item.id=boundItemId),
				//2) if float behavior: id of dbItem where item.id=dbItem.config_id and dbItem.isCurrent = true
				boundItem.idAccordingToBehav = boundIomItemFromDb.getID();
				for (propertyName in boundItem.propertyNames) {
					boundItem.propertyNames[propertyName].value =
						boundIomItemFromDb.getPropertyAttribute(
							propertyName,
							'keyed_name'
						) || boundIomItemFromDb.getProperty(propertyName);
					if (
						boundIomItemFromDb.getPropertyAttribute(propertyName, 'is_null') ===
						'0'
					) {
						boundItem.propertyNames[propertyName].isMissedReference = true;
					}
				}
			}
		}

		for (i = 0; i < docElementTypes.length; i++) {
			var fixedBoundItems = {},
				floatBoundItems = {};
			propertyNamesOfElementType = null;

			elementType = docElementTypes[i];
			if (elementType.binding) {
				elementItemsFiltered = elementItems.filter(function (element) {
					return element.type === elementType.name;
				});
				for (j = 0; j < elementItemsFiltered.length; j++) {
					elementItem = elementItemsFiltered[j];
					if (elementItem.boundItemId) {
						isBehavFloat = CMF.Utils.isBindingsBehavFloat(
							elementItem.resolutionMode
						);
						someId = isBehavFloat
							? elementItem.boundItemConfigId
							: elementItem.boundItemId;
						boundItems = isBehavFloat ? floatBoundItems : fixedBoundItems;
						boundItems[someId] =
							boundItems[someId] || CMF.Utils.createBoundItem();
						boundItem = boundItems[someId];
						boundItemTypeId = elementType.binding.elemReferenceType;

						for (k in elementType.binding.binds) {
							currentBind = elementType.binding.binds[k];
							boundItem.propertyNames[
								currentBind.itemPropertyName
							] = _aras.newObject();
						}

						//propertyNames for each boundItem should be the same here for each element Type, so, just take the first.
						//Values of propertyNames are different. (below boundItem.propertyNames[propertyName].value)
						if (!propertyNamesOfElementType) {
							propertyNamesOfElementType = boundItem.propertyNames;
						}

						elementItem.boundItem = boundItem;
					}
				}
			}
			fillBound(
				fixedBoundItems,
				boundItemTypeId,
				false,
				propertyNamesOfElementType
			);
			fillBound(
				floatBoundItems,
				boundItemTypeId,
				true,
				propertyNamesOfElementType
			);
			//fill bound
		}
	}

	function getDocTypeData(
		docElemTypeList,
		itemId,
		docElementTypes,
		baseXml,
		viewMetaData,
		dataStore,
		itemTypeName
	) {
		return loadItems(
			docElemTypeList,
			itemId,
			baseXml,
			viewMetaData,
			itemTypeName
		).then(function (data) {
			var elementItems = data.elementItems;
			var propertyItems = data.propertiesItems;

			addBoundItems(elementItems, docElementTypes);

			var rootTreeItem = new dataModel.TreeItemModel();
			rootTreeItem.id = 'root';
			rootTreeItem.labelMethodName = data.labelMethod;
			if (docElemTypeList.length > 0) {
				elementItems.sort(sortOrderComparer);
				rootTreeItem.text = docElemTypeList[0].docTypeName;
				rootTreeItem.id = 'root';
				rootTreeItem.title = docElemTypeList[0].docTypeName;
				var rootItems = docElemTypeList.filter(function (element) {
					return element.parentId === '';
				});
				if (rootItems.length > 0) {
					generateRootItems(
						elementItems,
						rootItems,
						propertyItems,
						rootTreeItem,
						docElementTypes,
						dataStore
					);
					generateTree(
						rootTreeItem,
						elementItems,
						propertyItems,
						docElementTypes,
						dataStore
					);
				}
			}
			return rootTreeItem;
		});
	}

	function generateDocElements(xmldom) {
		var docTypeName = xmldom
			.selectSingleNode("Result/Item[@type='cmf_ContentType']/linked_item_type")
			.getAttribute('name');

		var docElementTypes = xmldom.selectNodes(
			'Result/Item[@type="cmf_ContentType"]/Relationships/Item[@type="cmf_ElementType"]'
		);
		var res = [],
			i,
			binding;
		for (i = 0; i < docElementTypes.length; i++) {
			binding = getBindingMetaData(docElementTypes[i]);
			var permissions = docElementTypes[i].selectNodes(
				"Relationships/Item[@type='cmf_ElementAllowedPermission']"
			);
			var propertyNodes = docElementTypes[i].selectNodes(
				"Relationships/Item[@type='cmf_PropertyType']"
			);
			var defaultPermission = getItemProperty(
				docElementTypes[i],
				'default_permission'
			);
			var properties = generateProperties(
				propertyNodes,
				docElementTypes[i].getAttribute('id'),
				binding,
				permissions,
				defaultPermission
			);

			var docElementTypeId = docElementTypes[i].getAttribute('id');
			res.push({
				id: docElementTypeId,
				parentId: getItemProperty(docElementTypes[i], 'parent'),
				name: getItemProperty(docElementTypes[i], 'keyed_name'),
				docTypeName: docTypeName,
				properties: properties,
				defaultPermission: defaultPermission,
				binding: binding,
				referenceRequired: binding ? binding.referenceRequired : false
			});
		}
		var sortedDocElements = getSortedDocElements(res);
		return sortedDocElements;
	}

	function generateComputedProperties(propertyNode) {
		var res = [];
		var computedProperty = propertyNode.selectNodes(
			"Relationships/Item[@type='cmf_ComputedProperty']"
		);
		for (var i = 0; i < computedProperty.length; i++) {
			var computedDependency = computedProperty[i].selectNodes(
				"Relationships/Item[@type='cmf_ComputedPropertyDependency']/related_id"
			);
			var relatedProperties = [];
			for (var k = 0; k < computedDependency.length; k++) {
				var related = computedDependency[k].getAttribute('keyed_name');
				if (related) {
					relatedProperties.push(related);
				}
			}

			var computedMethod = computedProperty[i].selectSingleNode(
				'on_client_compute_method'
			);
			if (computedMethod) {
				res.push({
					method: computedMethod.getAttribute('keyed_name'),
					relatedProperties: relatedProperties
				});
			}
		}
		return res;
	}

	function generateProperties(
		propertyNodes,
		docElementTypeId,
		binding,
		permissions,
		elementDefaultPermission
	) {
		var elementPermissions = getElementAllowedPermissions(permissions);

		var properties = [];
		for (var j = 0; j < propertyNodes.length; j++) {
			var propertyPermissions = getPropertyAllowedPermissions(propertyNodes[j]);
			var currentPropertyId = propertyNodes[j].getAttribute('id');

			var propertyObject = new dataModel.DocElementProperty();
			propertyObject.id = currentPropertyId;
			propertyObject.name = getItemProperty(propertyNodes[j], 'keyed_name');
			propertyObject.dataType = getItemProperty(propertyNodes[j], 'data_type');
			var defaultPropertyPermission = getItemProperty(
				propertyNodes[j],
				'default_permission'
			);
			propertyObject.defaultPermission = defaultPropertyPermission
				? defaultPropertyPermission
				: elementDefaultPermission;
			var sortOrder = getItemProperty(propertyNodes[j], 'sort_order');
			if (sortOrder) {
				propertyObject.sortOrder = parseInt(sortOrder);
			}

			propertyObject.typeId = getItemProperty(
				propertyNodes[j],
				'generated_type'
			);
			propertyObject.documentElementId = docElementTypeId;
			propertyObject.computedProperty = generateComputedProperties(
				propertyNodes[j]
			);
			propertyObject.computedMethods = [];
			propertyObject.bindingType =
				binding && binding.binds ? binding.binds[propertyObject.id] : undefined;
			propertyObject.allowedPermission = concatPermissions(
				elementPermissions,
				propertyPermissions,
				defaultPropertyPermission
			);

			properties.push(propertyObject);
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
		return properties;
	}

	function getPropertyAllowedPermissions(propertyNode) {
		var propertyPermissionsNode = propertyNode.selectNodes(
			"Relationships/Item[@type='cmf_PropertyAllowedPermission']"
		);
		var propertyPermissions = [];
		for (var i = 0; i < propertyPermissionsNode.length; i++) {
			var permission = new dataModel.AllowedPermission();
			permission.id = propertyPermissionsNode[i].getAttribute('id');
			permission.related_id = getItemProperty(
				propertyPermissionsNode[i],
				'related_id'
			);
			var related = propertyPermissionsNode[i].selectSingleNode('related_id');
			permission.name = related.getAttribute('keyed_name');
			propertyPermissions.push(permission);
		}
		return propertyPermissions;
	}

	function getElementAllowedPermissions(permissions) {
		var elementPermissions = [];
		for (var i = 0; i < permissions.length; i++) {
			var permission = new dataModel.AllowedPermission();
			permission.id = permissions[i].getAttribute('id');
			permission.related_id = getItemProperty(permissions[i], 'related_id');
			var related = permissions[i].selectSingleNode('related_id');
			permission.name = related.getAttribute('keyed_name');
			elementPermissions.push(permission);
		}
		return elementPermissions;
	}

	function concatPermissions(
		elementPermissions,
		propertyPermissions,
		defaultPropertyPermission
	) {
		var allowedPermission;
		if (propertyPermissions.length > 0) {
			allowedPermission = propertyPermissions;
		} else {
			if (defaultPropertyPermission) {
				allowedPermission = [];
			} else {
				allowedPermission = elementPermissions;
			}
		}
		return allowedPermission;
	}

	function sortDocElementsRecursively(
		docElements,
		allSortedDocElements,
		docElementId
	) {
		var i, childElement, childElements;

		childElements = docElements.filter(function (i) {
			return i.parentId === docElementId;
		});

		for (i = 0; i < childElements.length; i++) {
			childElement = childElements[i];
			allSortedDocElements.push(childElement);
			sortDocElementsRecursively(
				docElements,
				allSortedDocElements,
				childElement.id
			);
		}
	}

	function getSortedDocElements(docElements) {
		//we need to sort metadata to prepare AML to get data such a way to have parents above their children. It's required to properly (do it after parent item was created) do
		//docElements[parentReferenceId].childElements.push(docElement); in this file.
		var sortedDocElements = [],
			i,
			rootElement,
			rootElements;

		if (!docElements || docElements.length === 0) {
			return docElements;
		}

		rootElements = docElements.filter(function (i) {
			return !i.parentId;
		});

		for (i = 0; i < rootElements.length; i++) {
			rootElement = rootElements[i];
			sortedDocElements.push(rootElement);
			sortDocElementsRecursively(
				docElements,
				sortedDocElements,
				rootElement.id
			);
		}

		return sortedDocElements;
	}

	function generateMetaAml(docTypeId, views) {
		var aml =
			'<AML>' +
			"<Item type='cmf_ContentType' id='" +
			docTypeId +
			"' action='get' select='linked_item_type'>" +
			'<Relationships>' +
			"<Item type='cmf_ElementType' action='get' select='id, keyed_name, parent, default_permission'>" +
			'<Relationships>' +
			"<Item type='cmf_PropertyType' action='get' select='id, keyed_name, sort_order, data_type, generated_type, default_permission'>" +
			'<Relationships>' +
			"<Item type='cmf_ComputedProperty' action='get' select='on_client_compute_method'>" +
			'<Relationships>' +
			"<Item type='cmf_ComputedPropertyDependency' action='get' select='related_id'></Item>" +
			'</Relationships>' +
			'</Item>' +
			"<Item type='cmf_PropertyAllowedPermission' action='get' related_expand='0' select='related_id'></Item>" +
			'</Relationships>' +
			'</Item>' +
			"<Item type='cmf_ElementBinding' action='get' select='id, reference_type, tracking_mode, new_row_mode, reference_required, structure_mapping_method, resolution_mode, on_create_reference, on_apply_binding, on_after_pick'>" +
			'<Relationships>' +
			"<Item type='cmf_PropertyBinding' select='id, reference_type_property_id(name), property, read_only' />" +
			'</Relationships>' +
			'</Item>' +
			"<Item type='cmf_ElementAllowedPermission' action='get' related_expand='0' select='related_id'></Item>" +
			'</Relationships>' +
			'</Item>' +
			'</Relationships>' +
			'</Item>';

		for (var i = 0; i < views.length; i++) {
			var currentView = views[i];
			aml +=
				"<Item type='cmf_TabularView' action='get' id='" +
				currentView.id +
				"' select='id, tree_label_method, default_header_style(*), grid_border_color(*)'>" +
				'<Relationships>' +
				"<Item type='cmf_TabularViewColumn' action='get' select='header, property, col_order, id," +
				'classification, editor_data_source_list, editor_data_source_method(name), editor_header_1_for_list_label, editor_header_1_width,' +
				" editor_header_2_for_list_value, editor_header_2_width, content_style, header_style, initial_width, date_pattern, editor_use_both'>" +
				'<Relationships>' +
				"<Item type='cmf_AdditionalPropertyType' action='get' select='additional_property' />" +
				'</Relationships>' +
				'</Item>' +
				"<Item type='cmf_TabularViewTree' action='get' select='element_type, document_element_icon, label'></Item>" +
				"<Item type='cmf_TabularViewHeaderRows' action='get' select='id, related_id'>" +
				'<related_id>' +
				"<Item type='cmf_TabularViewHeaderRow' action='get' select='group_level, header_style'>" +
				"<header_style><Item type='CMF_Style' action='get'/></header_style>" +
				'<Relationships>' +
				"<Item type='cmf_TabularViewColumnGroups' action='get' select='label, start_column, end_column, group_style'/>" +
				'</Relationships>' +
				'</Item>' +
				'</related_id>' +
				'</Item>' +
				'</Relationships></Item>';
		}
		aml += '</AML>';
		return aml;
	}

	function mapComputedProperties(propertyTypeList) {
		for (var i = 0; i < propertyTypeList.length; i++) {
			for (var j = 0; j < propertyTypeList[i].computedProperty.length; j++) {
				var computedProperty = propertyTypeList[i].computedProperty[j];

				for (var k = 0; k < computedProperty.relatedProperties.length; k++) {
					var relatedPropertyName = computedProperty.relatedProperties[k];
					var relatedProperty = propertyTypeList.filter(function (element) {
						return element.name === relatedPropertyName;
					});
					if (relatedProperty.length > 0) {
						relatedProperty[0].computedMethods.push(computedProperty.method);
					}
				}
			}
		}
	}

	function getMetaAml(docTypeId, views) {
		var aml = generateMetaAml(docTypeId, views);
		var response = _aras.applyAML(aml);
		var xmldom = _aras.createXMLDocument();
		xmldom.loadXML(response);
		return xmldom;
	}

	return declare('DataLoader', [], {
		baseXml: null,
		documentItem: null,

		constructor: function (item, aras) {
			_aras = aras;
			this.documentItem = item;
			this.baseXml = item.xml;
		},

		loadMetaData: function (views, dataStore) {
			var itemId = this.documentItem.getAttribute('id');
			var itemTypeName = this.documentItem.getAttribute('type');
			dataStore.clearMetadata();
			if (views.length > 0) {
				var docTypeId = views[0].docTypeId;
				var metaData = getMetaData(docTypeId, views);
				var docElemTypeList = metaData.elementTypes;
				var docElementTypes = generateDocElementTypes(docElemTypeList);
				return getDocTypeData(
					docElemTypeList,
					itemId,
					docElementTypes,
					this.baseXml,
					metaData.viewMetaData,
					dataStore,
					itemTypeName
				).then(function (rootItem) {
					var propertyTypeList = generatePropertyTypeList(docElementTypes);
					mapComputedProperties(propertyTypeList);
					return {
						rootItem: rootItem,
						docElementTypes: docElementTypes,
						viewsData: metaData.viewMetaData,
						docTypeId: docTypeId,
						itemId: itemId,
						propertyTypeList: propertyTypeList
					};
				});
			}
			return null;
		}
	});
});

// Code here will be ignored by JSHint.
/* jshint ignore:end */
