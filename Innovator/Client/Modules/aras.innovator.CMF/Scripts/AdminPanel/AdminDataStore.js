/* global define, CMF */
define([
	'dojo/_base/declare',
	'CMF/Scripts/AdminPanel/AdminDataModel',
	'CMF/Scripts/AdminPanel/AdminEnum'
], function (declare, AdminDataModel, AdminEnum) {
	var dataModel = new AdminDataModel();
	var systemEnums = new AdminEnum();
	var aras = parent.aras;

	return declare('AdminDataStore', [], {
		elementTypeDictionary: {},
		propertyTypeDictionary: {},
		elementBindingDictionary: {},
		baseViewDictionary: {},
		columnDictionary: {},
		treeDictionary: {},
		headerDictionary: {},
		exportDictionary: {},
		treeModelCollection: [],

		constructor: function () {
			this.elementTypeDictionary = {};
			this.propertyTypeDictionary = {};
			this.baseViewDictionary = {};
			this.columnDictionary = {};
			this.treeDictionary = {};
			this.headerDictionary = {};
			this.exportDictionary = {};
			this.treeModelCollection = [];
		},

		getChildren: function (element, type) {
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

			return rootElements.length > 0 ? rootElements[0].element : null;
		},

		getElementById: function (id) {
			var elements = this.treeModelCollection.filter(function (item) {
				return item.id === id;
			});

			return elements.length > 0 ? elements[0] : null;
		},

		getNextElementBySortOrder: function (sourceElement, dictionary) {
			var minSortOrder = sourceElement ? sourceElement.sortOrder : 0;
			var resElement = null;

			for (var elementId in dictionary) {
				var currentElement = dictionary[elementId];
				if (currentElement === sourceElement) {
					continue;
				}

				if (!resElement) {
					if (currentElement.sortOrder >= minSortOrder) {
						resElement = currentElement;
					}
					continue;
				}

				if (
					currentElement.sortOrder >= minSortOrder &&
					currentElement.sortOrder < resElement.sortOrder
				) {
					resElement = currentElement;
				}
			}
			return resElement;
		},

		getTheDeepestElementFromNode: function (sourceNode) {
			if (!sourceNode || !sourceNode.element) {
				return sourceNode;
			}

			var currentElement = sourceNode;
			while (true) {
				var children = this.getChildren(
					currentElement,
					systemEnums.TreeModelType.ElementType
				);
				if (children.length > 0) {
					var deepLevelItem = children[children.length - 1];
					currentElement = deepLevelItem;
				} else {
					break;
				}
			}
			return currentElement;
		},

		getPreviousElementBySortOrder: function (beforeElement, dictionary) {
			var maxSortOrder = beforeElement ? beforeElement.sortOrder : 100000000;
			var resElement = null;

			for (var elementId in dictionary) {
				var currentElement = dictionary[elementId];

				if (!resElement) {
					if (currentElement.sortOrder < maxSortOrder) {
						resElement = currentElement;
					}
					continue;
				}

				if (
					currentElement.sortOrder < maxSortOrder &&
					currentElement.sortOrder > resElement.sortOrder
				) {
					resElement = currentElement;
				}
			}

			return resElement;
		},

		getNextPropertyBySortOrder: function (
			sourceElement,
			elementType,
			dictionary
		) {
			var minSortOrder =
				sourceElement === elementType ? 0 : sourceElement.sortOrder;
			var resElement = null;

			for (var elementId in dictionary) {
				var currentElement = dictionary[elementId];

				if (currentElement.elementTypeId !== elementType.id) {
					continue;
				}
				if (currentElement === sourceElement) {
					continue;
				}

				if (!resElement) {
					if (currentElement.sortOrder >= minSortOrder) {
						resElement = currentElement;
					}
					continue;
				}

				if (
					currentElement.sortOrder >= minSortOrder &&
					currentElement.sortOrder < resElement.sortOrder
				) {
					resElement = currentElement;
				}
			}
			return resElement;
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

		insertElementBinding: function (treeElement) {
			var newItem = this.insertElementBindingIntoAml(treeElement);

			var binding = new dataModel.ElementBindingModel();
			binding.id = newItem.getAttribute('id');
			binding.dataType = newItem.getAttribute('type');
			binding.node = newItem.node;
			binding.name = 'Binding';

			this.elementBindingDictionary[binding.id] = binding;
			var treeElementModel = new dataModel.TreeElementModel(binding);
			treeElementModel.parentId = treeElement.id;
			treeElement.element.elementBinding = binding;
			this.treeModelCollection.push(treeElementModel);
			return treeElementModel;
		},

		insertPropertyType: function (treeElement, isChild) {
			var newItem = this.insertPropertyTypeIntoAml(treeElement, isChild);

			var propertyTypeModel = new dataModel.PropertyTypeModel();
			propertyTypeModel.id = newItem.getAttribute('id');
			propertyTypeModel.sortOrder = parseInt(newItem.getProperty('sort_order'));
			propertyTypeModel.dataType = newItem.getAttribute('type');
			propertyTypeModel.node = newItem.node;

			this.propertyTypeDictionary[propertyTypeModel.id] = propertyTypeModel;

			var treeElementModel = new dataModel.TreeElementModel(propertyTypeModel);
			if (treeElement.element.type === systemEnums.TreeModelType.ElementType) {
				treeElementModel.parentId = treeElement.id;
			} else {
				treeElementModel.parentId = treeElement.parentId;
			}
			propertyTypeModel.elementTypeId = treeElementModel.parentId;
			this.treeModelCollection.push(treeElementModel);
			return treeElementModel;
		},

		insertPropertyTypeIntoAml: function (treeElement) {
			var sortOrder = this.getNewSortOrderForPropertyType(treeElement);
			var newPropertyItem = aras.IomInnovator.newItem(
				'cmf_PropertyType',
				'add'
			);
			newPropertyItem.setAttribute('id', aras.generateNewGUID());
			newPropertyItem.setProperty(
				'source_id',
				treeElement.element.type === systemEnums.TreeModelType.ElementType
					? treeElement.id
					: treeElement.parentId
			);
			newPropertyItem.setProperty('sort_order', sortOrder);
			newPropertyItem.setAttribute(
				'typeId',
				aras.getItemTypeId('cmf_PropertyType')
			);
			newPropertyItem.setProperty('related_id', '');
			newPropertyItem.setPropertyAttribute('related_id', 'is_null', '1');

			var elementType =
				treeElement.element.type === systemEnums.TreeModelType.ElementType
					? treeElement.element
					: this.elementTypeDictionary[treeElement.parentId];

			this.appendIntoRelationships(elementType.node, newPropertyItem.node);
			this.setItemRelationshipUpdate(elementType.node);
			this.setMainItemToUpdate();
			return newPropertyItem;
		},

		removePropertyType: function (propertyTreeElement) {
			if (propertyTreeElement.element.node.getAttribute('action') === 'add') {
				propertyTreeElement.element.node.parentNode.removeChild(
					propertyTreeElement.element.node
				);
			} else {
				propertyTreeElement.element.node.setAttribute('action', 'delete');
				var elementType = this.elementTypeDictionary[
					propertyTreeElement.parentId
				];
				this.setItemRelationshipUpdate(elementType.node);
			}

			this.setMainItemToUpdate();
			delete this.propertyTypeDictionary[propertyTreeElement.id];
			this.removeElementTreeModel(propertyTreeElement);
		},

		removeElementBinding: function (binding) {
			var elementType = this.elementTypeDictionary[binding.parentId];

			if (binding.element.node.getAttribute('action') === 'add') {
				//elementType.node.selectSingleNode('Relationships')
				binding.element.node.parentNode.removeChild(binding.element.node);
			} else {
				binding.element.node.setAttribute('action', 'delete');
				this.setItemRelationshipUpdate(elementType.node);
			}

			this.setMainItemToUpdate();
			delete this.elementBindingDictionary[binding.id];
			this.removeElementTreeModel(binding);
			elementType.elementBinding = null;
		},

		removeElementType: function (treeElement) {
			const relationships = item.selectSingleNode('Relationships');
			relationships.removeChild(treeElement.element.node);
			if (treeElement.element.node.getAttribute('action') !== 'add') {
				treeElement.element.node.setAttribute('action', 'delete');
				// removed cmf_ElementType item should be inserted in the end of Relationships node
				// it allows to have correct order of deleted items: child items before parent items
				relationships.appendChild(treeElement.element.node);
			}

			this.setMainItemToUpdate();
			delete this.elementTypeDictionary[treeElement.id];
			this.removeElementTreeModel(treeElement);
		},

		insertElementType: function (sourceTreeElement, isChild) {
			var newItem = this.insertElementTypeIntoAml(sourceTreeElement, isChild);

			var elementTypeModel = new dataModel.ElementTypeModel();
			elementTypeModel.id = newItem.getAttribute('id');
			elementTypeModel.parentId = newItem.getProperty('parent');
			elementTypeModel.sortOrder = parseInt(newItem.getProperty('sort_order'));
			elementTypeModel.dataType = newItem.getAttribute('type');
			elementTypeModel.node = newItem.node;
			this.elementTypeDictionary[elementTypeModel.id] = elementTypeModel;

			var treeElementModel = new dataModel.TreeElementModel(elementTypeModel);
			if (isChild && sourceTreeElement) {
				treeElementModel.parentId = sourceTreeElement.id;
			} else {
				treeElementModel.parentId = sourceTreeElement
					? sourceTreeElement.parentId
					: 'elementTypeFolder';
			}
			this.treeModelCollection.push(treeElementModel);
			return treeElementModel;
		},

		insertElementBindingIntoAml: function (sourceTreeElement) {
			var newElementBindingItem = aras.IomInnovator.newItem(
				'cmf_ElementBinding',
				'add'
			);
			newElementBindingItem.setAttribute('id', aras.generateNewGUID());
			newElementBindingItem.setProperty('source_id', sourceTreeElement.id);
			newElementBindingItem.setAttribute(
				'typeId',
				aras.getItemTypeId('cmf_ElementBinding')
			);
			newElementBindingItem.setProperty('related_id', '');
			newElementBindingItem.setPropertyAttribute('related_id', 'is_null', '1');
			newElementBindingItem.setProperty('reference_type', '');

			this.setDefaultValue(
				'cmf_ElementBinding',
				'item_delete_behavior',
				newElementBindingItem
			);
			this.setDefaultValue(
				'cmf_ElementBinding',
				'reference_required',
				newElementBindingItem
			);
			this.setDefaultValue(
				'cmf_ElementBinding',
				'resolution_mode',
				newElementBindingItem
			);
			this.setDefaultValue(
				'cmf_ElementBinding',
				'synchronization_direction',
				newElementBindingItem
			);

			this.appendIntoRelationships(
				sourceTreeElement.node,
				newElementBindingItem.node
			);
			this.setMainItemToUpdate();
			this.setItemRelationshipUpdate(sourceTreeElement.node);

			return newElementBindingItem;
		},

		insertElementTypeIntoAml: function (sourceTreeElement, isChild) {
			var sortOrder = this.getNewSortOrderForElementType(
				sourceTreeElement,
				isChild
			);
			var newElementItem = aras.IomInnovator.newItem('cmf_ElementType', 'add');
			newElementItem.setAttribute('id', aras.generateNewGUID());
			newElementItem.setProperty('source_id', item.getAttribute('id'));
			newElementItem.setProperty('sort_order', sortOrder);
			if (isChild) {
				newElementItem.setProperty(
					'parent',
					sourceTreeElement ? sourceTreeElement.id : ''
				);
			} else {
				newElementItem.setProperty(
					'parent',
					sourceTreeElement && sourceTreeElement.element
						? sourceTreeElement.element.parentId
						: ''
				);
			}
			newElementItem.setAttribute(
				'typeId',
				aras.getItemTypeId('cmf_ElementType')
			);
			newElementItem.setProperty('related_id', '');
			newElementItem.setPropertyAttribute('related_id', 'is_null', '1');
			newElementItem.setProperty('name', '');

			this.setDefaultValue(
				'cmf_ElementType',
				'default_permission',
				newElementItem
			);

			this.appendIntoRelationships(item, newElementItem.node);
			this.setMainItemToUpdate();
			return newElementItem;
		},

		getNewSortOrderForElementType: function (sourceElement) {
			var deepNode = this.getTheDeepestElementFromNode(sourceElement);
			var nextElementType = this.getNextElementBySortOrder(
				deepNode ? deepNode.element : null,
				this.elementTypeDictionary
			);
			var sourceSortOrder =
				deepNode && deepNode.element ? deepNode.element.sortOrder : 0;
			if (nextElementType) {
				var offset = Math.floor(
					(nextElementType.sortOrder - sourceSortOrder) / 2
				);
				if (offset === 0) {
					// resort
					this.resortElementTypes();
					nextElementType = this.getNextElementBySortOrder(
						deepNode ? deepNode.element : null,
						this.elementTypeDictionary
					);
					sourceSortOrder =
						deepNode && deepNode.element ? deepNode.element.sortOrder : 0;
					offset = Math.floor(
						(nextElementType.sortOrder - sourceSortOrder) / 2
					);
					return sourceSortOrder + offset;
				} else {
					var newSortOrder = sourceSortOrder + offset;
					return newSortOrder;
				}
			} else {
				return sourceSortOrder ? sourceSortOrder + 128 : 128;
			}
		},

		getNewSortOrderForReordering: function (
			beforeElement,
			sourceElement,
			asChild
		) {
			var beforeNode;
			var afterNode;

			if (asChild) {
				beforeNode = this.getTheDeepestElementFromNode(beforeElement);
				if (this.isElementHasChild(sourceElement, beforeNode)) {
					return null; // no need to change sort order
				}
				beforeNode = beforeNode ? beforeNode.element : null;
				afterNode = this.getNextElementBySortOrder(
					beforeNode,
					this.elementTypeDictionary
				);
			} else {
				beforeNode = this.getPreviousElementBySortOrder(
					beforeElement ? beforeElement.element : null,
					this.elementTypeDictionary
				);
				afterNode = beforeElement ? beforeElement.element : null;
			}

			if (sourceElement.element === beforeNode) {
				return null; // no need to change sort order
			}

			if (asChild && sourceElement.element === afterNode) {
				return null; // no need to change sort order
			}

			var afterSortOrder = afterNode ? afterNode.sortOrder : 0;
			if (afterSortOrder) {
				var beforSortOrder = beforeNode ? beforeNode.sortOrder : 0;
				var offset = Math.floor((afterSortOrder - beforSortOrder) / 2);
				if (offset === 0) {
					// resort
				} else {
					var newSortOrder = beforSortOrder + offset;
					return newSortOrder;
				}
			} else {
				return beforeNode ? beforeNode.sortOrder + 128 : 128;
			}
		},

		getNewSortOrderForPropertyType: function (sourceElement) {
			var elementType =
				sourceElement.getType() === systemEnums.TreeModelType.ElementType
					? sourceElement.element
					: this.elementTypeDictionary[sourceElement.parentId];
			var nextPropertyType = this.getNextPropertyBySortOrder(
				sourceElement.element,
				elementType,
				this.propertyTypeDictionary
			);
			var sourceSortOrder =
				sourceElement.getType() !== systemEnums.TreeModelType.ElementType
					? sourceElement.element.sortOrder
					: 0;
			if (nextPropertyType) {
				var offset = Math.floor(
					(nextPropertyType.sortOrder - sourceSortOrder) / 2
				);
				if (offset === 0) {
					// resort
				} else {
					var newSortOrder = sourceSortOrder + offset;
					return newSortOrder;
				}
			} else {
				return sourceSortOrder ? sourceSortOrder + 128 : 128;
			}
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
			var iconPath = '';
			var itemType = null;
			switch (treeElement.getType()) {
				case systemEnums.TreeModelType.ContentType:
				case systemEnums.TreeModelType.ElementType:
				case systemEnums.TreeModelType.PropertyType:
				case systemEnums.TreeModelType.ElementBindingType:
				case systemEnums.TreeModelType.TabularViewTree:
				case systemEnums.TreeModelType.TabularViewHeaderRows:
				case systemEnums.TreeModelType.TabularViewColumn:
				case systemEnums.TreeModelType.BaseView:
				case systemEnums.TreeModelType.ExportToExcelElement:
					itemType = aras.getItemTypeDictionary(treeElement.element.dataType);
					break;
				case systemEnums.TreeModelType.ElementFolder:
				case systemEnums.TreeModelType.ViewFolder:
				case systemEnums.TreeModelType.ColumnFolder:
				case systemEnums.TreeModelType.TreeFolder:
				case systemEnums.TreeModelType.HeaderRowsFolder:
				case systemEnums.TreeModelType.ExportFolder:
					iconPath = '../images/folder.svg';
					break;
				default:
					break;
			}

			if (iconPath) {
				return iconPath;
			}
			if (itemType) {
				return aras.getItemProperty(itemType.node, 'large_icon');
			}
			return '';
		},

		getMorphaeList: function (sourceId) {
			var xml =
				"<Item type='Morphae' action='get' select='related_id'>" +
				'<source_id>' +
				sourceId +
				'</source_id>' +
				'</Item>';

			var qry = new window.Item();
			qry.loadAML(xml);

			var results = qry.apply();
			if (results.isError()) {
				return;
			}

			var deliverableItemTypeList = [];
			for (var i = 0; i < results.getItemCount(); i++) {
				var res = results
					.getItemByIndex(i)
					.node.selectSingleNode('related_id/Item');
				var resId = res.getAttribute('id');
				var resName = aras.getItemProperty(res, 'name');
				var resLabel = aras.getItemProperty(res, 'label');
				deliverableItemTypeList.push({
					id: resId,
					name: resName,
					label: resLabel
				});
			}
			return deliverableItemTypeList;
		},

		insertBaseView: function (baseViewType, sourceTreeElement) {
			var baseViewItem = this.insertBaseViewIntoAml(
				baseViewType,
				sourceTreeElement
			);
			var relatedItem = baseViewItem.getRelatedItem();
			var elementTypeModel = new dataModel.BaseViewModel();
			elementTypeModel.id = relatedItem.getAttribute('id');
			elementTypeModel.sortOrder = parseInt(
				baseViewItem.getProperty('sort_order')
			);
			elementTypeModel.dataType = relatedItem.getAttribute('type');
			elementTypeModel.node = relatedItem.node;
			this.baseViewDictionary[elementTypeModel.id] = elementTypeModel;

			var treeElementModel = new dataModel.TreeElementModel(elementTypeModel);
			treeElementModel.parentId =
				sourceTreeElement.getType() === systemEnums.TreeModelType.ViewFolder
					? sourceTreeElement.id
					: sourceTreeElement.parentId;
			this.treeModelCollection.push(treeElementModel);
			this.createBaseViewFolders(treeElementModel.id);

			return treeElementModel;
		},

		createBaseViewFolders: function (baseViewId) {
			var columnFolderId = 'columnFolder_' + baseViewId;
			var columnFolder = {
				id: columnFolderId,
				name: 'Columns',
				type: systemEnums.TreeModelType.ColumnFolder
			};
			var columnFolderModel = new dataModel.TreeElementModel(columnFolder);
			columnFolderModel.parentId = baseViewId;
			this.treeModelCollection.push(columnFolderModel);
			var treeFolderId = 'treeFolder_' + baseViewId;
			var treeFolder = {
				id: treeFolderId,
				name: 'Element Nodes',
				type: systemEnums.TreeModelType.TreeFolder
			};
			var treeFolderModel = new dataModel.TreeElementModel(treeFolder);
			treeFolderModel.parentId = baseViewId;
			this.treeModelCollection.push(treeFolderModel);

			var headerId = 'headerFolder' + baseViewId;
			var headerFolder = {
				id: headerId,
				name: 'Additional Header Rows',
				type: systemEnums.TreeModelType.HeaderRowsFolder
			};
			var treeHeaderFolderModel = new dataModel.TreeElementModel(headerFolder);
			treeHeaderFolderModel.parentId = baseViewId;
			this.treeModelCollection.push(treeHeaderFolderModel);
		},

		insertBaseViewIntoAml: function (baseViewType, selectedTreeElement) {
			var sortOrder = this.getNewSortOrderForBaseView(selectedTreeElement);

			var newContentTypeView = aras.IomInnovator.newItem(
				'cmf_ContentTypeView',
				'add'
			);
			newContentTypeView.setProperty('source_id', item.getAttribute('id'));
			newContentTypeView.setProperty('related_id', '');
			newContentTypeView.setProperty('sort_order', sortOrder);
			newContentTypeView.setAttribute('id', aras.generateNewGUID());
			var related = newContentTypeView.createRelatedItem(baseViewType, 'add');
			related.setAttribute('id', aras.generateNewGUID());

			this.appendIntoRelationships(item, newContentTypeView.node);

			this.setMainItemToUpdate();
			return newContentTypeView;
		},

		getNewSortOrderForBaseView: function (sourceElement) {
			var nextPropertyType = this.getNextElementBySortOrder(
				sourceElement.getType() === systemEnums.TreeModelType.ViewFolder
					? null
					: sourceElement.element,
				this.baseViewDictionary
			);
			var sourceSortOrder =
				sourceElement.getType() !== systemEnums.TreeModelType.ViewFolder
					? sourceElement.element.sortOrder
					: 0;
			if (nextPropertyType) {
				var offset = Math.floor(
					(nextPropertyType.sortOrder - sourceSortOrder) / 2
				);
				if (offset === 0) {
					// resort
				} else {
					var newSortOrder = sourceSortOrder + offset;
					return newSortOrder;
				}
			} else {
				return sourceSortOrder ? sourceSortOrder + 128 : 128;
			}
		},

		removeView: function (treeElement) {
			var contentViewNode = treeElement.element.node.parentNode.parentNode;
			if (treeElement.element.node.getAttribute('action') === 'add') {
				var relationships = item.selectSingleNode('Relationships');
				relationships.removeChild(contentViewNode);
			} else {
				contentViewNode.setAttribute('action', 'delete');
			}

			this.setMainItemToUpdate();
			this.removeBaseViewData(treeElement);
		},

		removeBaseViewData: function (treeElement) {
			var children = this.getChildren(treeElement);
			for (var j = 0; j < children.length; j++) {
				switch (children[j].getType()) {
					case systemEnums.TreeModelType.ColumnFolder:
						this.removeAllItemsByView(this.columnDictionary, children[j]);
						break;

					case systemEnums.TreeModelType.TreeFolder:
						this.removeAllItemsByView(this.treeDictionary, children[j]);
						break;

					case systemEnums.TreeModelType.HeaderRowsFolder:
						this.removeAllItemsByView(this.headerDictionary, children[j]);
						break;
				}
			}

			delete this.baseViewDictionary[treeElement.id];
			for (var i = 0; i < this.treeModelCollection.length; i++) {
				if (this.treeModelCollection[i] === treeElement) {
					this.treeModelCollection.splice(i, 1);
					break;
				}
			}
		},

		removeAllItemsByView: function (dictionary, parentElement) {
			for (var i = 0; i < this.treeModelCollection.length; i++) {
				if (this.treeModelCollection[i].parentId === parentElement.id) {
					delete dictionary[this.treeModelCollection[i].id];
					this.treeModelCollection[i] = undefined;
				}
			}

			var j = 0;
			while (j < this.treeModelCollection.length) {
				if (this.treeModelCollection[j]) {
					j++;
				} else {
					this.treeModelCollection.splice(j, 1);
				}
			}
		},

		insertHeaderRow: function (treeElement) {
			var baseViewTreeElement = this.getElementById(treeElement.parentId);
			var newItem = this.insertHeaderRowIntoAml(baseViewTreeElement);

			var header = new dataModel.TabularViewHeaderRows();
			header.id = newItem.getAttribute('id');
			header.dataType = newItem.getAttribute('type');
			header.node = newItem.node;
			header.name = 'Header Row Level: 2';
			header.baseViewId = baseViewTreeElement.id;

			this.headerDictionary[header.id] = header;
			treeElement.element.hasHeaderRow = true;
			var treeElementModel = new dataModel.TreeElementModel(header);
			treeElementModel.parentId = treeElement.id;
			this.treeModelCollection.push(treeElementModel);
			return treeElementModel;
		},

		insertHeaderRowIntoAml: function (baseViewTreeElement) {
			var newContentTypeView = aras.IomInnovator.newItem(
				'cmf_TabularViewHeaderRows',
				'add'
			);
			newContentTypeView.setProperty(
				'source_id',
				baseViewTreeElement.node.getAttribute('id')
			);
			newContentTypeView.setAttribute('id', aras.generateNewGUID());
			var related = newContentTypeView.createRelatedItem(
				'cmf_TabularViewHeaderRow',
				'add'
			);
			related.setAttribute('id', aras.generateNewGUID());
			related.setProperty('group_level', '2');

			this.appendIntoRelationships(
				baseViewTreeElement.node,
				newContentTypeView.node
			);
			this.setActionToNode(baseViewTreeElement.node, 'edit');

			var contentTypeViewNode = baseViewTreeElement.node.parentNode.parentNode;
			this.setItemRelationshipUpdate(contentTypeViewNode);

			this.setMainItemToUpdate();
			return related;
		},

		removeHeaderRow: function (treeElement) {
			var headerRowNode = treeElement.node.parentNode.parentNode;
			if (headerRowNode.getAttribute('action') === 'add') {
				headerRowNode.parentNode.removeChild(headerRowNode);
			} else {
				headerRowNode.setAttribute('action', 'delete');
				var tabularViewNode = headerRowNode.parentNode.parentNode;
				this.setActionToNode(tabularViewNode, 'edit');

				var contentTypeNode = tabularViewNode.parentNode.parentNode;
				this.setItemRelationshipUpdate(contentTypeNode);
			}

			this.setMainItemToUpdate();

			delete this.headerDictionary[treeElement.id];
			var headerFolder = this.getElementById(treeElement.parentId);
			headerFolder.element.hasHeaderRow = false;
			this.removeElementTreeModel(treeElement);
		},

		hasEmptyLinks: function () {
			return this.checkOnEmptyLinks().length > 0;
		},

		checkOnEmptyLinks: function () {
			var res = [];
			res = res.concat(this.checkOnTabTreeElementEmptyLinks());
			res = res.concat(this.checkOnPropertyDependencyEmptyLinks());
			res = res.concat(this.checkOnTabColumnEmptyLinks());
			return res;
		},

		checkOnTabTreeElementEmptyLinks: function () {
			var res = [];
			var allTreeElements = this.treeModelCollection.filter(function (element) {
				return element.getType() === systemEnums.TreeModelType.TabularViewTree;
			});

			for (var i = 0; i < allTreeElements.length; i++) {
				var node = allTreeElements[i].node;
				if (node) {
					var element = node.selectSingleNode('element_type');
					if (element && element.text) {
						if (!this.elementTypeDictionary[element.text]) {
							allTreeElements[i].addWarning(
								'emptyLink',
								aras.getResource(
									'../Modules/aras.innovator.CMF/',
									'admin_element_not_found'
								) +
									'"<strong>' +
									element.getAttribute('keyed_name') +
									'</strong>"</br>'
							);
							res.push(allTreeElements[i]);
							continue;
						}
					}
				}
				allTreeElements[i].removeWarning('emptyLink');
			}
			return res;
		},

		checkOnBindingEmptyLinks: function () {
			var res = [];
			var allTreeElements = this.treeModelCollection.filter(function (element) {
				return (
					element.getType() === systemEnums.TreeModelType.ElementBindingType
				);
			});

			for (var i = 0; i < allTreeElements.length; i++) {
				var node = allTreeElements[i].node;
				if (node) {
					var message = '';
					var properties = node.selectNodes(
						"Relationships/Item[@type='cmf_PropertyBinding']/property"
					);
					for (var j = 0; j < properties.length; j++) {
						if (properties[j].text) {
							if (!this.propertyTypeDictionary[properties[j].text]) {
								message +=
									aras.getResource(
										'../Modules/aras.innovator.CMF/',
										'admin_property_not_found'
									) +
									'"<strong>' +
									properties[j].getAttribute('keyed_name') +
									'</strong>"</br>';
							}
						}
					}
					if (message) {
						allTreeElements[i].addWarning('emptyLink', message);
						res.push(allTreeElements[i]);
					} else {
						allTreeElements[i].removeWarning('emptyLink');
					}
				}
			}
			return res;
		},

		checkOnPropertyDependencyEmptyLinks: function () {
			var res = [];
			var allTreeElements = this.treeModelCollection.filter(function (element) {
				return element.getType() === systemEnums.TreeModelType.PropertyType;
			});

			for (var i = 0; i < allTreeElements.length; i++) {
				var node = allTreeElements[i].node;
				if (node) {
					var message = '';
					var properties = node.selectNodes(
						"Relationships/Item[@type='cmf_ComputedProperty']/" +
							"Relationships/Item[@type='cmf_ComputedPropertyDependency']/related_id"
					);
					for (var j = 0; j < properties.length; j++) {
						if (properties[j].text) {
							if (!this.propertyTypeDictionary[properties[j].text]) {
								message +=
									aras.getResource(
										'../Modules/aras.innovator.CMF/',
										'admin_property_not_found'
									) +
									'"<strong>' +
									properties[j].getAttribute('keyed_name') +
									'</strong>"</br>';
							}
						}
					}
					if (message) {
						allTreeElements[i].addWarning('emptyLink', message);
						res.push(allTreeElements[i]);
					} else {
						allTreeElements[i].removeWarning('emptyLink');
					}
				}
			}
			return res;
		},

		checkOnTabColumnEmptyLinks: function () {
			var res = [];
			var allTreeElements = this.treeModelCollection.filter(function (element) {
				return (
					element.getType() === systemEnums.TreeModelType.TabularViewColumn
				);
			});
			for (var i = 0; i < allTreeElements.length; i++) {
				var node = allTreeElements[i].node;
				if (node) {
					var element = node.selectSingleNode('property');
					var hasEmptyLink = false;
					if (element && element.text) {
						if (!this.propertyTypeDictionary[element.text]) {
							res.push(allTreeElements[i]);
							allTreeElements[i].addWarning(
								'emptyLink',
								aras.getResource(
									'../Modules/aras.innovator.CMF/',
									'admin_property_not_found'
								) +
									'"<strong>' +
									element.getAttribute('keyed_name') +
									'</strong>"</br>'
							);
							hasEmptyLink = true;
						}
					}
					var additionalProperties = node.selectNodes(
						"Relationships/Item[@type='cmf_AdditionalPropertyType' and not(@action='delete')]" +
							'/additional_property'
					);
					for (var j = 0; j < additionalProperties.length; j++) {
						var additionalPropertyId = additionalProperties[j].text;
						if (
							additionalPropertyId &&
							!this.propertyTypeDictionary[additionalPropertyId]
						) {
							res.push(allTreeElements[i]);
							allTreeElements[i].addWarning(
								'emptyLink',
								aras.getResource(
									'../Modules/aras.innovator.CMF/',
									'admin_property_not_found'
								) +
									'"<strong>' +
									additionalProperties[j].getAttribute('keyed_name') +
									'</strong>"</br>'
							);
							hasEmptyLink = true;
						}
					}
					if (hasEmptyLink) {
						continue;
					}
				}
				allTreeElements[i].removeWarning('emptyLink');
			}
			return res;
		},

		insertTabularViewTree: function (treeElement) {
			var fromFolder =
				treeElement.getType() === systemEnums.TreeModelType.TreeFolder;
			var newItem = this.insertTabularViewTreeIntoAml(treeElement, fromFolder);

			var propertyTypeModel = new dataModel.TabularViewTree();
			propertyTypeModel.id = newItem.getAttribute('id');
			propertyTypeModel.sortOrder = parseInt(newItem.getProperty('sort_order'));
			propertyTypeModel.dataType = newItem.getAttribute('type');
			propertyTypeModel.node = newItem.node;
			propertyTypeModel.baseViewId = newItem.getProperty('source_id');

			this.treeDictionary[propertyTypeModel.id] = propertyTypeModel;

			var treeElementModel = new dataModel.TreeElementModel(propertyTypeModel);
			treeElementModel.parentId = fromFolder
				? treeElement.id
				: treeElement.parentId;
			this.treeModelCollection.push(treeElementModel);
			return treeElementModel;
		},

		insertTabularViewTreeIntoAml: function (treeElement, fromFolder) {
			var folderElement = fromFolder
				? treeElement
				: this.getElementById(treeElement.parentId);
			var baseViewElement = this.getElementById(folderElement.parentId);
			var sortOrder = this.getNewSortOrderForTabularViewTree(
				treeElement,
				fromFolder
			);

			var newPropertyItem = aras.IomInnovator.newItem(
				'cmf_TabularViewTree',
				'add'
			);
			newPropertyItem.setAttribute('id', aras.generateNewGUID());
			newPropertyItem.setProperty('source_id', baseViewElement.id);
			newPropertyItem.setProperty('sort_order', sortOrder);
			newPropertyItem.setProperty('related_id', '');
			newPropertyItem.setPropertyAttribute('related_id', 'is_null', '1');

			this.appendIntoRelationships(baseViewElement.node, newPropertyItem.node);
			this.setActionToNode(baseViewElement.node, 'edit');
			var contentTypeViewNode = baseViewElement.node.parentNode.parentNode;
			this.setItemRelationshipUpdate(contentTypeViewNode);
			this.setMainItemToUpdate();
			return newPropertyItem;
		},

		getNewSortOrderForTabularViewTree: function (sourceElement, fromFolder) {
			var nextPropertyType = this.getNextElementBySortOrder(
				fromFolder ? null : sourceElement.element,
				this.treeDictionary
			);
			var sourceSortOrder = fromFolder ? 0 : sourceElement.element.sortOrder;
			if (nextPropertyType) {
				var offset = Math.floor(
					(nextPropertyType.sortOrder - sourceSortOrder) / 2
				);
				if (offset === 0) {
					// resort
				} else {
					var newSortOrder = sourceSortOrder + offset;
					return newSortOrder;
				}
			} else {
				return sourceSortOrder ? sourceSortOrder + 128 : 128;
			}
		},

		removeTabularViewTree: function (treeElement) {
			if (treeElement.node.getAttribute('action') === 'add') {
				treeElement.node.parentNode.removeChild(treeElement.node);
			} else {
				treeElement.node.setAttribute('action', 'delete');

				// update tabular view
				var baseView = treeElement.node.parentNode.parentNode;
				this.setActionToNode(baseView, 'edit');

				// update contentTypeView
				var contentTypeNode = baseView.parentNode.parentNode;
				this.setItemRelationshipUpdate(contentTypeNode);
			}

			this.setMainItemToUpdate();
			delete this.treeDictionary[treeElement.id];
			this.removeElementTreeModel(treeElement);
		},

		insertTabularColumn: function (treeElement, fromFolder) {
			var res = this.insertTabularColumnIntoAml(treeElement, fromFolder);
			var newItem = res.item;

			var propertyTypeModel = new dataModel.TabularViewColumn();
			propertyTypeModel.id = newItem.getAttribute('id');
			propertyTypeModel.sortOrder = res.sortOrder;
			propertyTypeModel.dataType = newItem.getAttribute('type');
			propertyTypeModel.node = newItem.node;
			propertyTypeModel.baseViewId = newItem.getProperty('source_id');
			propertyTypeModel.name = res.sortOrder + ': ';

			this.columnDictionary[propertyTypeModel.id] = propertyTypeModel;

			var treeElementModel = new dataModel.TreeElementModel(propertyTypeModel);
			treeElementModel.parentId = fromFolder
				? treeElement.id
				: treeElement.parentId;
			this.treeModelCollection.push(treeElementModel);
			return treeElementModel;
		},

		insertTabularColumnIntoAml: function (treeElement, fromFolder) {
			var folderElement = fromFolder
				? treeElement
				: this.getElementById(treeElement.parentId);
			var baseViewElement = this.getElementById(folderElement.parentId);
			var sortOrder = this.getNewSortOrderForTabularColumn(
				treeElement,
				fromFolder,
				folderElement
			);

			var newPropertyItem = aras.IomInnovator.newItem(
				'cmf_TabularViewColumn',
				'add'
			);
			newPropertyItem.setAttribute('id', aras.generateNewGUID());
			newPropertyItem.setProperty('source_id', baseViewElement.id);
			newPropertyItem.setProperty('related_id', '');
			newPropertyItem.setProperty('col_order', sortOrder);
			newPropertyItem.setPropertyAttribute('related_id', 'is_null', '1');
			this.setDefaultValue(
				'cmf_TabularViewColumn',
				'classification',
				newPropertyItem
			);

			this.appendIntoRelationships(baseViewElement.node, newPropertyItem.node);
			this.setActionToNode(baseViewElement.node, 'edit');

			var contentTypeViewNode = baseViewElement.node.parentNode.parentNode;
			this.setItemRelationshipUpdate(contentTypeViewNode);
			this.setMainItemToUpdate();
			return { item: newPropertyItem, sortOrder: sortOrder };
		},

		getNewSortOrderForTabularColumn: function (
			sourceElement,
			fromFolder,
			folderElement
		) {
			var allChildren = this.getChildren(folderElement);
			var insertSortOrder = fromFolder
				? 1
				: sourceElement.element.sortOrder + 1;

			for (var i = 0; i < allChildren.length; i++) {
				if (allChildren[i].element.sortOrder >= insertSortOrder) {
					this.resortTabularColumn(
						allChildren[i],
						allChildren[i].element.sortOrder + 1
					);
				}
			}

			return insertSortOrder;
		},

		resortTabularColumn: function (treeElement, newSortOrder) {
			this.setPropertyToNode(treeElement.node, 'col_order', newSortOrder);
			treeElement.element.sortOrder = newSortOrder;
			var propertyNode = treeElement.node.selectSingleNode('property');
			treeElement.element.name =
				newSortOrder +
				': ' +
				(propertyNode ? propertyNode.getAttribute('keyed_name') : '');

			// update cmf_TabularViewColumn
			this.setActionToNode(treeElement.node, 'update');

			// update cmf_TabularView
			var tabViewNode = this.getElementById(treeElement.element.baseViewId)
				.node;
			this.setActionToNode(tabViewNode, 'edit');

			// update cmf_ContentTypeView
			var contentTypeViewNode = tabViewNode.parentNode.parentNode;
			this.setActionToNode(contentTypeViewNode, 'update');

			// update relationships and main item
			this.setItemRelationshipUpdate(contentTypeViewNode);
			this.setMainItemToUpdate();
		},

		shiftTabularColumns: function (children, columnOrder) {
			for (var i = 0; i < children.length; i++) {
				if (children[i].element.sortOrder > columnOrder) {
					this.resortTabularColumn(
						children[i],
						children[i].element.sortOrder - 1
					);
				}
			}
		},

		removeTabularColumn: function (treeElement) {
			var columnOrder = treeElement.element.sortOrder;
			var parentId = treeElement.parentId;
			if (treeElement.node.getAttribute('action') === 'add') {
				treeElement.node.parentNode.removeChild(treeElement.node);
			} else {
				treeElement.node.setAttribute('action', 'delete');

				// update tabular view
				var baseView = treeElement.node.parentNode.parentNode;
				this.setActionToNode(baseView, 'edit');

				// update contentTypeView
				var contentTypeNode = baseView.parentNode.parentNode;
				this.setItemRelationshipUpdate(contentTypeNode);
			}

			this.setMainItemToUpdate();
			delete this.treeDictionary[treeElement.id];
			this.removeElementTreeModel(treeElement);

			var columnFolder = this.getElementById(parentId);
			var children = this.getChildren(columnFolder);
			this.shiftTabularColumns(children, columnOrder);
		},

		insertExportSettings: function (treeElement, exportTypeName) {
			var baseViewItem = this.insertExportSettingsIntoAml(exportTypeName);
			var relatedItem = baseViewItem.getRelatedItem();
			var elementTypeModel = new dataModel.ExportSettings();
			elementTypeModel.id = relatedItem.getAttribute('id');
			elementTypeModel.sortOrder = parseInt(
				baseViewItem.getProperty('sort_order')
			);
			elementTypeModel.dataType = relatedItem.getAttribute('type');
			elementTypeModel.node = relatedItem.node;
			elementTypeModel.name = 'Export Settings';
			this.exportDictionary[elementTypeModel.id] = elementTypeModel;

			var treeElementModel = new dataModel.TreeElementModel(elementTypeModel);
			treeElementModel.parentId = treeElement.id;
			treeElement.element.hasRecord = true;
			this.treeModelCollection.push(treeElementModel);
			return treeElementModel;
		},

		insertExportSettingsIntoAml: function (typeName) {
			var newContentTypeView = aras.IomInnovator.newItem(
				'cmf_ContentTypeExportRel',
				'add'
			);
			newContentTypeView.setProperty('source_id', item.getAttribute('id'));
			newContentTypeView.setProperty('sort_order', 128);
			newContentTypeView.setAttribute('id', aras.generateNewGUID());
			var related = newContentTypeView.createRelatedItem(typeName, 'add');
			related.setAttribute('id', aras.generateNewGUID());

			this.appendIntoRelationships(item, newContentTypeView.node);

			this.setMainItemToUpdate();
			return newContentTypeView;
		},

		insertExistingTabularColumn: function (
			sourceElement,
			beforeElement,
			parentElement
		) {
			var children = this.getChildren(parentElement);
			var sourceSortOrder = sourceElement.element.sortOrder;
			var beforeSortOrder = beforeElement
				? beforeElement.element.sortOrder
				: children[children.length - 1].element.sortOrder + 1;
			if (sourceElement.element.sortOrder < beforeSortOrder) {
				for (var k = 0; k < children.length; k++) {
					if (
						children[k].element.sortOrder > sourceSortOrder &&
						children[k].element.sortOrder < beforeSortOrder
					) {
						this.resortTabularColumn(
							children[k],
							children[k].element.sortOrder - 1
						);
					}
				}
				this.resortTabularColumn(sourceElement, beforeSortOrder - 1);
			} else {
				for (var i = 0; i < children.length; i++) {
					if (
						children[i].element.sortOrder >= beforeSortOrder &&
						children[i].element.sortOrder < sourceSortOrder
					) {
						this.resortTabularColumn(
							children[i],
							children[i].element.sortOrder + 1
						);
					}
				}
				this.resortTabularColumn(sourceElement, beforeSortOrder);
			}

			return children;
		},

		removeExportSettings: function (treeElement) {
			var contentViewNode = treeElement.element.node.parentNode.parentNode;
			if (treeElement.element.node.getAttribute('action') === 'add') {
				var relationships = item.selectSingleNode('Relationships');
				relationships.removeChild(contentViewNode);
			} else {
				contentViewNode.setAttribute('action', 'delete');
			}

			var parent = this.getElementById(treeElement.parentId);
			parent.element.hasRecord = false;
			this.setMainItemToUpdate();
			this.removeElementTreeModel(treeElement);
		},

		resortElementTypes: function () {
			var elementTypeFolder = this.getElementById('elementTypeFolder');
			var currentSortOrder = 128;
			var currentElement;

			var stack = [];
			stack.push(elementTypeFolder);

			while (stack.length > 0) {
				currentElement = stack.pop();
				if (
					currentElement.getType() !== systemEnums.TreeModelType.ElementFolder
				) {
					this.changeSortOrderForElementType(currentElement, currentSortOrder);
					currentSortOrder += 128;
				}

				var children = this.getChildren(
					currentElement,
					systemEnums.TreeModelType.ElementType
				);
				for (var i = children.length - 1; i >= 0; i--) {
					stack.push(children[i]);
				}
			}
		},

		changeSortOrderForElementType: function (elementModel, newSortOrder) {
			if (elementModel.element.sortOrder !== newSortOrder) {
				elementModel.element.sortOrder = newSortOrder;
				this.setPropertyToNode(elementModel.node, 'sort_order', newSortOrder);
				this.setItemRelationshipUpdate(elementModel.node);
			}
		},

		reorderElementType: function (
			sourceElement,
			beforeElement,
			parentElement,
			asChild
		) {
			var newSortOrder = this.getNewSortOrderForReordering(
				beforeElement,
				sourceElement,
				asChild
			);

			if (asChild) {
				var parentId = beforeElement.id;
				this.setPropertyToNode(sourceElement.node, 'parent', parentId);
				aras.removeNodeElementAttribute(
					sourceElement.node,
					'parent',
					'keyed_name'
				);
				aras.removeNodeElementAttribute(
					sourceElement.node,
					'parent',
					'is_null'
				);
				this.setItemRelationshipUpdate(sourceElement.node);
				this.setMainItemToUpdate();
				sourceElement.parentId = parentId;
				sourceElement.element.parentId = parentId;
			} else {
				if (sourceElement.parentId !== parentElement.id) {
					// replace parent
					if (
						parentElement.getType() === systemEnums.TreeModelType.ElementFolder
					) {
						this.setPropertyToNode(sourceElement.node, 'parent', '');
						aras.removeNodeElementAttribute(
							sourceElement.node,
							'parent',
							'keyed_name'
						);
						aras.setNodeElementAttribute(
							sourceElement.node,
							'parent',
							'is_null',
							'1'
						);
						sourceElement.parentId = 'elementTypeFolder';
						sourceElement.element.parentId = '';
					} else {
						this.setPropertyToNode(
							sourceElement.node,
							'parent',
							parentElement.id
						);
						aras.setNodeElementAttribute(
							sourceElement.node,
							'parent',
							'keyed_name',
							parentElement.element.name
						);
						aras.removeNodeElementAttribute(
							sourceElement.node,
							'parent',
							'is_null'
						);
						sourceElement.parentId = parentElement.id;
						sourceElement.element.parentId = parentElement.id;
					}

					this.setItemRelationshipUpdate(sourceElement.node);
					this.setMainItemToUpdate();
				}
			}

			if (newSortOrder) {
				// replace sortOrder
				this.setPropertyToNode(sourceElement.node, 'sort_order', newSortOrder);
				this.setItemRelationshipUpdate(sourceElement.node);
				this.setMainItemToUpdate();
				sourceElement.element.sortOrder = newSortOrder;
				this.resortElementTypes();
			}
		},

		checkPropertyTypeBeforeRemove: function (treeElement) {
			var dependencyXpath =
				"Relationships/Item[@type='cmf_ElementType']/Relationships/Item[@type='cmf_PropertyType']/" +
				"Relationships/Item[@type='cmf_ComputedProperty']/Relationships/" +
				"Item[@type='cmf_ComputedPropertyDependency']/related_id";
			var dependencyItems = item.selectNodes(dependencyXpath);
			for (var i = 0; i < dependencyItems.length; i++) {
				if (dependencyItems[i].text === treeElement.id) {
					return (
						"Can't remove property because it used into 'Computed Property Dependency'." +
						" You should remove 'Computed Property Dependency', save Content Type and then remove property"
					);
				}
			}
			return '';
		},

		setActionToNode: function (node, actionValue) {
			if (node.getAttribute('action') !== 'add') {
				node.setAttribute('action', actionValue);
			}
		},

		setItemRelationshipUpdate: function (node) {
			node.setAttribute('isDirty', '1');
			this.setActionToNode(node, 'update');
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
		},

		appendIntoRelationships: function (sourceNode, newNode) {
			var rel = sourceNode.selectSingleNode('Relationships');
			if (!rel) {
				rel = sourceNode.ownerDocument.createElement('Relationships');
				sourceNode.appendChild(rel);
			}
			rel.appendChild(newNode);
		},

		setDefaultValue: function (itemTypeName, propertyName, element) {
			var defPermissionNode = aras
				.getItemTypeDictionary(itemTypeName)
				.node.selectSingleNode(
					"Relationships/Item[@type='Property' and (name='" +
						propertyName +
						"')]"
				);
			var defVal = aras.getItemProperty(defPermissionNode, 'default_value');
			element.setProperty(propertyName, defVal);
		},

		setPropertyToNode: function (node, propertyName, value) {
			var propNode = node.selectSingleNode(propertyName);
			if (!propNode) {
				propNode = node.ownerDocument.createElement(propertyName);
				node.appendChild(propNode);
			}
			propNode.text = value;
		},

		getRequiredFields: function (itemTypeName) {
			var node = aras.getItemTypeDictionary(itemTypeName).node;
			var requiredProperties = node.selectNodes(
				"Relationships/Item[@type='Property' and (is_required='1')]"
			);
			var defaultProperties = [
				'config_id',
				'created_by_id',
				'created_on',
				'id',
				'permission_id'
			];
			var res = [];
			for (var i = 0; i < requiredProperties.length; i++) {
				var nameTag = requiredProperties[i].selectSingleNode('name');
				if (nameTag) {
					if (defaultProperties.indexOf(nameTag.text) < 0) {
						res.push(requiredProperties[i]);
					}
				}
			}
			return res;
		},

		hasChildrenWarnings: function (elementModel) {
			var currentElement;
			var stack = [];
			stack.push(elementModel);

			while (stack.length > 0) {
				currentElement = stack.pop();

				if (currentElement !== elementModel) {
					if (currentElement.getWarning()) {
						return true;
					}
				}

				var children = this.getChildren(currentElement);
				for (var i = children.length - 1; i >= 0; i--) {
					stack.push(children[i]);
				}
			}
			return false;
		}
	});
});
