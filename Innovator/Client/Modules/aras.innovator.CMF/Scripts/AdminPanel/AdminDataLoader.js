/* global define */
define([
	'dojo/_base/declare',
	'CMF/Scripts/AdminPanel/AdminDataModel',
	'CMF/Scripts/AdminPanel/AdminDataStore',
	'CMF/Scripts/AdminPanel/AdminEnum'
], function (declare, AdminDataModel, AdminDataStore, AdminEnum) {
	var dataModel = new AdminDataModel();
	var systemEnums = new AdminEnum();

	return declare('AdminDataLoader', [], {
		constructor: function () {},

		load: function (contentType) {
			this.loadMetaData(contentType);
			var dataStore = new AdminDataStore();
			this.generateContentTypeElement(contentType, dataStore);
			this.generateElementsFromAml(contentType, dataStore);
			this.generateViewsFromAml(contentType, dataStore);
			this.generateExportSettingsFromAml(contentType, dataStore);
			return dataStore;
		},

		loadMetaData: function (contentType) {
			if (!parent.aras.isDirtyEx(contentType)) {
				var body =
					'<Relationships>' +
					"<Item type='cmf_PropertyType' action='get'>" +
					'<Relationships>' +
					"<Item type='cmf_ComputedProperty' action='get'>" +
					'<Relationships>' +
					"<Item type='cmf_ComputedPropertyDependency' action='get' related_expand='0' ></Item>" +
					'</Relationships>' +
					'</Item>' +
					"<Item type='cmf_PropertyAllowedPermission' action='get' related_expand='0' select='related_id'></Item>" +
					'</Relationships>' +
					'</Item>' +
					"<Item type='cmf_ElementBinding' action='get'>" +
					'<Relationships>' +
					"<Item type='cmf_PropertyBinding' select='id, reference_type_property_id(name), property, read_only' />" +
					'</Relationships>' +
					'</Item>' +
					"<Item type='cmf_ElementAllowedPermission' action='get' related_expand='0' ></Item>" +
					'</Relationships>';

				var tabViews =
					'<related_id>' +
					'<Item type="cmf_TabularView" action="get">' +
					'<Relationships>' +
					"<Item type='cmf_TabularViewColumn' action='get'>" +
					'<Relationships>' +
					"<Item type='cmf_AdditionalPropertyType' action='get' />" +
					'</Relationships>' +
					'</Item>' +
					"<Item type='cmf_TabularViewTree' action='get' />" +
					"<Item type='cmf_TabularViewHeaderRows' action='get' />" +
					'</Relationships>' +
					'</Item>' +
					'</related_id>';

				var exportSettings =
					'<related_id>' +
					'<Item type="cmf_ContentTypeExportToExcel" action="get">' +
					'</Item>' +
					'</related_id>';

				parent.aras.getItemRelationshipsEx(
					contentType,
					'cmf_ContentTypeView',
					undefined,
					undefined,
					tabViews,
					true
				);
				parent.aras.getItemRelationshipsEx(
					contentType,
					'cmf_ElementType',
					undefined,
					undefined,
					body,
					true
				);
				parent.aras.getItemRelationshipsEx(
					contentType,
					'cmf_ContentTypeExportRel',
					undefined,
					undefined,
					exportSettings,
					true
				);
			}
		},

		generateContentTypeElement: function (contentType, dataStore) {
			var contentTypeElement = {
				id: 'root',
				name: aras.getItemProperty(contentType, 'name'),
				dataType: contentType.getAttribute('type'),
				type: systemEnums.TreeModelType.ContentType,
				node: contentType
			};
			var rootTreeElement = new dataModel.TreeElementModel();
			rootTreeElement.element = contentTypeElement;
			this.checkNodeForWarnings(contentTypeElement, rootTreeElement, true);
			dataStore.treeModelCollection.push(rootTreeElement);
		},

		generateElementsFromAml: function (xmldom, dataStore) {
			var elementFolderId = 'elementTypeFolder';
			var elementTypeFolder = {
				id: elementFolderId,
				name: 'Elements',
				type: systemEnums.TreeModelType.ElementFolder
			};
			var treeElementFolderModel = new dataModel.TreeElementModel(
				elementTypeFolder
			);
			treeElementFolderModel.parentId = 'root';
			dataStore.treeModelCollection.push(treeElementFolderModel);
			//var cmfTypeId = xmldom.getAttribute('id');
			var docElementTypes = xmldom.selectNodes(
				"Relationships/Item[@type='cmf_ElementType' and not(@action='delete')]"
			);
			for (var i = 0; i < docElementTypes.length; i++) {
				var elementTypeModel = new dataModel.ElementTypeModel();
				elementTypeModel.id = docElementTypes[i].getAttribute('id');
				elementTypeModel.name = this.getItemProperty(
					docElementTypes[i],
					'keyed_name'
				);
				elementTypeModel.parentId = this.getItemProperty(
					docElementTypes[i],
					'parent'
				);
				elementTypeModel.sortOrder = this.getSortOrderForElementType(
					docElementTypes[i]
				);
				elementTypeModel.node = docElementTypes[i];
				elementTypeModel.dataType = docElementTypes[i].getAttribute('type');
				dataStore.elementTypeDictionary[elementTypeModel.id] = elementTypeModel;

				var treeElementModel = new dataModel.TreeElementModel(elementTypeModel);
				treeElementModel.parentId = elementTypeModel.parentId
					? elementTypeModel.parentId
					: elementFolderId;
				this.checkNodeForWarnings(elementTypeModel, treeElementModel, true);
				dataStore.treeModelCollection.push(treeElementModel);
				this.generateBindings(
					docElementTypes[i].selectSingleNode(
						"Relationships/Item[@type='cmf_ElementBinding' and not(@action='delete')]"
					),
					elementTypeModel,
					dataStore
				);

				var propertyNodes = docElementTypes[i].selectNodes(
					"Relationships/Item[@type='cmf_PropertyType' and not(@action='delete')]"
				);
				this.generateProperties(propertyNodes, treeElementModel, dataStore);
			}
		},

		generateBindings: function (xml, element, dataStore) {
			if (xml) {
				var binding = new dataModel.ElementBindingModel();
				binding.id = xml.getAttribute('id');
				binding.name = 'Binding';
				var reference = xml.selectSingleNode('reference_type');
				if (reference) {
					var referenceTypeName = reference.getAttribute('name');
					if (referenceTypeName) {
						binding.name += ' - ' + referenceTypeName;
					}
				}
				binding.node = xml;
				binding.dataType = 'cmf_ElementBinding';

				dataStore.elementBindingDictionary[binding.id] = binding;

				var treeElementModel = new dataModel.TreeElementModel(binding);
				treeElementModel.parentId = element.id;
				element.elementBinding = binding;
				this.checkNodeForWarnings(binding, treeElementModel, false);
				dataStore.treeModelCollection.push(treeElementModel);
			}
		},

		getSortOrderForElementType: function (node) {
			var docElementSortOrder = this.getItemProperty(node, 'sort_order');
			if (docElementSortOrder) {
				docElementSortOrder = parseInt(docElementSortOrder);
			}
			return docElementSortOrder;
		},

		generateProperties: function (
			propertyNodes,
			treeModelForElementType,
			dataStore
		) {
			var properties = [];
			for (var j = 0; j < propertyNodes.length; j++) {
				var propertyObject = new dataModel.PropertyTypeModel();
				propertyObject.id = propertyNodes[j].getAttribute('id');
				propertyObject.name = this.getItemProperty(
					propertyNodes[j],
					'keyed_name'
				);
				if (
					!propertyObject.name &&
					propertyNodes[j].getAttribute('action') === 'add'
				) {
					propertyObject.name = this.getItemProperty(propertyNodes[j], 'name');
				}
				var sortOrder = this.getItemProperty(propertyNodes[j], 'sort_order');
				if (sortOrder) {
					propertyObject.sortOrder = parseInt(sortOrder);
				}
				propertyObject.node = propertyNodes[j];
				propertyObject.dataType = propertyNodes[j].getAttribute('type');
				propertyObject.elementTypeId = treeModelForElementType.id;
				properties.push(propertyObject);

				var uiNode = propertyObject.node.ownerDocument.createElement(
					'ui_computed_property'
				);
				propertyObject.node.appendChild(uiNode);
				var computedMethod = propertyNodes[j].selectSingleNode(
					"Relationships/Item[@type='cmf_ComputedProperty' and not(@action='delete')]" +
						'/on_client_compute_method'
				);
				if (computedMethod) {
					uiNode.setAttribute('type', 'Method');
					uiNode.setAttribute(
						'keyed_name',
						computedMethod.getAttribute('keyed_name')
					);
					uiNode.text = computedMethod.text;
				}
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

			for (var i = 0; i < properties.length; i++) {
				var treeElementModel = new dataModel.TreeElementModel();
				treeElementModel.element = properties[i];
				treeElementModel.parentId = treeModelForElementType.id;
				this.checkNodeForWarnings(properties[i], treeElementModel, false);
				dataStore.treeModelCollection.push(treeElementModel);
				dataStore.propertyTypeDictionary[properties[i].id] = properties[i];
			}
		},

		getItemProperty: function (node, property) {
			var propertyNode = node.selectSingleNode(property);
			if (propertyNode) {
				return propertyNode.text;
			} else {
				return '';
			}
		},

		generateViewsFromAml: function (xmldom, dataStore) {
			var viewFolderId = 'viewTypeFolder';
			var viewFolder = {
				id: viewFolderId,
				name: 'Views',
				type: systemEnums.TreeModelType.ViewFolder
			};
			var treeViewFolderModel = new dataModel.TreeElementModel(viewFolder);
			treeViewFolderModel.parentId = 'root';
			dataStore.treeModelCollection.push(treeViewFolderModel);

			var contentTypeViews = xmldom.selectNodes(
				"Relationships/Item[@type='cmf_ContentTypeView']"
			);
			for (var i = 0; i < contentTypeViews.length; i++) {
				var baseViewNode = contentTypeViews[i].selectSingleNode(
					'related_id/Item'
				);
				var baseViewModel = new dataModel.BaseViewModel();
				baseViewModel.id = baseViewNode.getAttribute('id');
				baseViewModel.name = this.getItemProperty(baseViewNode, 'keyed_name');
				baseViewModel.sortOrder = this.getSortOrderForElementType(
					contentTypeViews[i]
				);
				baseViewModel.node = baseViewNode;
				baseViewModel.dataType = baseViewNode.getAttribute('type');
				dataStore.baseViewDictionary[baseViewModel.id] = baseViewModel;

				var treeElementModel = new dataModel.TreeElementModel(baseViewModel);
				treeElementModel.parentId = viewFolderId;
				this.checkNodeForWarnings(baseViewModel, treeElementModel, true);
				dataStore.treeModelCollection.push(treeElementModel);

				this.generateTabularViewColumns(
					baseViewNode,
					dataStore,
					baseViewModel.id
				);
				this.generateTabularViewTree(baseViewNode, dataStore, baseViewModel.id);
				this.generateTabularViewHeaderRows(
					baseViewNode,
					dataStore,
					baseViewModel.id
				);
			}
		},

		generateTabularViewColumns: function (baseViewNode, dataStore, baseViewId) {
			var columnFolderId = 'columnFolder_' + baseViewId;
			var columnFolder = {
				id: columnFolderId,
				name: 'Columns',
				type: systemEnums.TreeModelType.ColumnFolder
			};
			var columnFolderModel = new dataModel.TreeElementModel(columnFolder);
			columnFolderModel.parentId = baseViewId;
			dataStore.treeModelCollection.push(columnFolderModel);

			var tabViewColumns = baseViewNode.selectNodes(
				"Relationships/Item[@type='cmf_TabularViewColumn']"
			);
			var columns = [];
			for (var i = 0; i < tabViewColumns.length; i++) {
				var columnObject = new dataModel.TabularViewColumn();
				columnObject.id = tabViewColumns[i].getAttribute('id');

				var sortOrder = this.getItemProperty(tabViewColumns[i], 'col_order');
				if (sortOrder) {
					columnObject.sortOrder = parseInt(sortOrder);
				}
				var label = columnObject.sortOrder ? columnObject.sortOrder : '';
				label += ': ' + this.getItemProperty(tabViewColumns[i], 'keyed_name');
				columnObject.name = label;
				columnObject.node = tabViewColumns[i];
				columnObject.dataType = tabViewColumns[i].getAttribute('type');
				columnObject.baseViewId = baseViewId;
				columns.push(columnObject);
			}

			columns.sort(function (a, b) {
				if (a.sortOrder > b.sortOrder) {
					return 1;
				}
				if (a.sortOrder < b.sortOrder) {
					return -1;
				}
				return 0;
			});

			for (var j = 0; j < columns.length; j++) {
				var treeElementModel = new dataModel.TreeElementModel();
				treeElementModel.element = columns[j];
				treeElementModel.parentId = columnFolderId;
				this.checkNodeForWarnings(columns[j], treeElementModel, false);
				dataStore.treeModelCollection.push(treeElementModel);
				dataStore.columnDictionary[columns[j].id] = columns[j];
			}
		},

		generateTabularViewTree: function (baseViewNode, dataStore, baseViewId) {
			var treeFolderId = 'treeFolder_' + baseViewId;
			var treeFolder = {
				id: treeFolderId,
				name: 'Element Nodes',
				type: systemEnums.TreeModelType.TreeFolder
			};
			var treeElementFolderModel = new dataModel.TreeElementModel(treeFolder);
			treeElementFolderModel.parentId = baseViewId;
			dataStore.treeModelCollection.push(treeElementFolderModel);

			var tabularViewTree = baseViewNode.selectNodes(
				"Relationships/Item[@type='cmf_TabularViewTree']"
			);

			for (var i = 0; i < tabularViewTree.length; i++) {
				var elementTypeModel = new dataModel.TabularViewTree();
				elementTypeModel.id = tabularViewTree[i].getAttribute('id');
				elementTypeModel.sortOrder = this.getSortOrderForElementType(
					tabularViewTree[i]
				);
				elementTypeModel.node = tabularViewTree[i];
				elementTypeModel.dataType = tabularViewTree[i].getAttribute('type');
				elementTypeModel.baseViewId = baseViewId;
				elementTypeModel.name = this.getItemProperty(
					tabularViewTree[i],
					'label'
				);
				dataStore.treeDictionary[elementTypeModel.id] = elementTypeModel;

				var treeElementModel = new dataModel.TreeElementModel(elementTypeModel);
				treeElementModel.parentId = treeFolderId;
				this.checkNodeForWarnings(elementTypeModel, treeElementModel, false);
				dataStore.treeModelCollection.push(treeElementModel);
			}
		},

		generateTabularViewHeaderRows: function (
			baseViewNode,
			dataStore,
			baseViewId
		) {
			var headerId = 'headerFolder_' + baseViewId;
			var headerFolder = {
				id: headerId,
				name: 'Additional Header Rows',
				type: systemEnums.TreeModelType.HeaderRowsFolder,
				hasHeaderRow: false
			};
			var treeElementFolderModel = new dataModel.TreeElementModel(headerFolder);
			treeElementFolderModel.parentId = baseViewId;
			dataStore.treeModelCollection.push(treeElementFolderModel);
			var tabularViewTree = baseViewNode.selectNodes(
				"Relationships/Item[@type='cmf_TabularViewHeaderRows']"
			);
			for (var i = 0; i < tabularViewTree.length; i++) {
				var related = tabularViewTree[i].selectSingleNode('related_id/Item');

				var headerModel = new dataModel.TabularViewHeaderRows();
				headerModel.id = related.getAttribute('id');
				headerModel.name = 'Header Row Level: 2';
				headerModel.sortOrder = this.getSortOrderForElementType(
					tabularViewTree[i]
				);
				headerModel.node = related;
				headerModel.dataType = related.getAttribute('type');
				headerModel.baseViewId = baseViewId;
				dataStore.headerDictionary[headerModel.id] = headerModel;
				headerFolder.hasHeaderRow = true;
				var treeElementModel = new dataModel.TreeElementModel(headerModel);
				treeElementModel.parentId = headerId;
				this.checkNodeForWarnings(headerModel, treeElementModel, false);
				dataStore.treeModelCollection.push(treeElementModel);
			}
		},

		generateExportSettingsFromAml: function (xmldom, dataStore) {
			var exportFolderId = 'ExportSettingsFolder';
			var exportFolder = {
				id: exportFolderId,
				name: 'Export Settings',
				type: systemEnums.TreeModelType.ExportFolder,
				hasRecord: false
			};
			var treeExportFolderModel = new dataModel.TreeElementModel(exportFolder);
			treeExportFolderModel.parentId = 'root';
			dataStore.treeModelCollection.push(treeExportFolderModel);

			var contentTypeExportNode = xmldom.selectNodes(
				"Relationships/Item[@type='cmf_ContentTypeExportRel']"
			);
			for (var i = 0; i < contentTypeExportNode.length; i++) {
				var relatedNode = contentTypeExportNode[i].selectSingleNode(
					'related_id/Item'
				);
				var exportModel = new dataModel.ExportSettings();
				exportModel.id = relatedNode.getAttribute('id');
				exportModel.name = 'Export Settings';
				exportModel.sortOrder = this.getSortOrderForElementType(
					contentTypeExportNode[i]
				);
				exportModel.node = relatedNode;
				exportModel.dataType = relatedNode.getAttribute('type');
				dataStore.exportDictionary[exportModel.id] = exportModel;
				exportFolder.hasRecord = true;
				var treeElementModel = new dataModel.TreeElementModel(exportModel);
				treeElementModel.parentId = exportFolderId;

				this.checkNodeForWarnings(exportModel, treeElementModel, false);
				dataStore.treeModelCollection.push(treeElementModel);
			}
		},

		clearCheckNode: function (checkCopy) {
			var rel = checkCopy.selectSingleNode('Relationships');
			if (rel) {
				checkCopy.removeChild(rel);
			}
		},

		checkNodeForWarnings: function (
			srcModel,
			treeElementModel,
			clearRelationships
		) {
			if (window.isEditMode) {
				// clone node and clear it from relationships
				var checkCopy = srcModel.node.cloneNode(true);
				if (clearRelationships) {
					this.clearCheckNode(checkCopy);
				}

				var defaultFieldCheckCallback = function (
					itemNode,
					reqName,
					proplabel,
					defVal
				) {
					return {
						result: false,
						message: aras.getResource(
							'',
							'item_methods_ex.field_required_provide_value',
							proplabel
						)
					};
				};

				// check on client errors
				var errors = aras.clientItemValidation(
					srcModel.dataType,
					checkCopy,
					false,
					defaultFieldCheckCallback
				);
				if (errors.length > 0) {
					var message = '';
					for (var i = 0; i < errors.length; i++) {
						message = message + errors[i].message + '</br>';
					}
					treeElementModel.addWarning('clientValidation', message);
				}

				if (treeElementModel.id !== 'root') {
					var isLocked = aras.isLocked(srcModel.node);
					if (isLocked) {
						if (!aras.isLockedByUser(srcModel.node)) {
							treeElementModel.addWarning(
								'lockValidation',
								aras.getResource(
									'../Modules/aras.innovator.CMF/',
									'admin_locked_by_another_user'
								)
							);
						}
					}
				}
			}
		}
	});
});
