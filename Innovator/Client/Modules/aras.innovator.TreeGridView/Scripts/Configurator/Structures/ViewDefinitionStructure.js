define([
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/ColumnDefinition',
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/ColumnMapping',
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/TreeGridViewDefinition',
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/TreeRowDefinition',
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/TreeRowReference',
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/ReferenceTypeEnum',
	'TreeGridView/Scripts/Configurator/Models/Common/ItemInfo'
], function (
	ColumnDefinition,
	ColumnMapping,
	TreeGridViewDefinition,
	TreeRowDefinition,
	TreeRowReference,
	REFERENCE_TYPE_ENUM,
	ItemInfo
) {
	'use strict';
	var ViewDefinitionStructure = (function () {
		function ViewDefinitionStructure(item, aras, bulderMethodInfo) {
			this._treeRowDictionary = {};
			this._treeRowReferences = [];
			this._columnDefenitions = [];
			this._columnMapping = [];
			this._item = item;
			this._aras = aras;
			this._defaultBuilderMethod = bulderMethodInfo;
			this.init();
		}
		ViewDefinitionStructure.prototype.getRootTreeRows = function () {
			var res = [];
			var rootLinks = this._treeRowReferences.filter(function (obj) {
				return !obj.parentRefId;
			});
			for (var i = 0; i < rootLinks.length; i++) {
				var treeRow = this._treeRowDictionary[rootLinks[i].childRefId];
				if (treeRow) {
					res.push(treeRow);
				}
			}
			return res;
		};
		ViewDefinitionStructure.prototype.getRootReferences = function () {
			return this._treeRowReferences.filter(function (obj) {
				return !obj.parentRefId;
			});
		};
		ViewDefinitionStructure.prototype.getChildrenTreeRow = function (treeRow) {
			var references = [];
			for (var i = 0; i < this._treeRowReferences.length; i++) {
				if (
					this._treeRowReferences[i].parentRefId === treeRow.refId &&
					!this._treeRowReferences[i].isRecursiveRef
				) {
					references.push(this._treeRowReferences[i]);
				}
			}
			references.sort(function (a, b) {
				return a.viewOrder - b.viewOrder;
			});
			var result = [];
			for (var j = 0; j < references.length; j++) {
				var childTreeRow = this._treeRowDictionary[references[j].childRefId];
				if (childTreeRow) {
					result.push(childTreeRow);
				}
			}
			return result;
		};
		ViewDefinitionStructure.prototype.getLowLevelRows = function () {
			var res = [];
			function byRefId(treeRow) {
				return function (obj) {
					return !obj._isRecursiveRef && obj.parentRefId === treeRow.refId;
				};
			}
			for (var treeRowId in this._treeRowDictionary) {
				var treeRow = this._treeRowDictionary[treeRowId];
				var array = this._treeRowReferences.filter(byRefId(treeRow));
				if (array.length === 0) {
					res.push(treeRow);
				}
			}
			return res;
		};
		ViewDefinitionStructure.prototype.getTreeRowByRefId = function (refId) {
			return this._treeRowDictionary[refId];
		};
		ViewDefinitionStructure.prototype.getReferenceByChild = function (
			childRefId
		) {
			var array = this._treeRowReferences.filter(function (obj) {
				return !obj.isRecursiveRef && obj.childRefId === childRefId;
			});
			if (array.length > 0) {
				return array[0];
			}
		};
		ViewDefinitionStructure.prototype.getLowLevelReferences = function () {
			var res = [];
			function byParent(refId) {
				return function (reference) {
					return !reference._isRecursiveRef && reference.parentRefId === refId;
				};
			}
			for (var treeRowId in this._treeRowDictionary) {
				var treeRow = this._treeRowDictionary[treeRowId];
				var outcomingReferences = this._treeRowReferences.filter(
					byParent(treeRow.refId)
				);
				if (outcomingReferences.length === 0 || treeRow.hasRecursionLink) {
					var incomingReference = this.getReferenceByChild(treeRow.refId);
					if (incomingReference && incomingReference.parentRefId) {
						res.push(incomingReference);
					}
				}
			}
			return res;
		};
		ViewDefinitionStructure.prototype.getTreeGridViewDefinitionInfo = function () {
			return this._treeGridViewDefinition;
		};
		ViewDefinitionStructure.prototype.getColumnDefinitionById = function (id) {
			var resArray = this._columnDefenitions.filter(function (item) {
				return item.id === id;
			});
			if (resArray.length > 0) {
				return resArray[0];
			} else {
				return null;
			}
		};
		ViewDefinitionStructure.prototype.getAllColumnDefinitions = function () {
			return this._columnDefenitions.sort(function (a, b) {
				return a.positionOrder - b.positionOrder;
			});
		};
		ViewDefinitionStructure.prototype.getTreeRowById = function (id) {
			for (var treeRowId in this._treeRowDictionary) {
				var treeRow = this._treeRowDictionary[treeRowId];
				if (treeRow && treeRow.id === id) {
					return treeRow;
				}
			}
		};
		ViewDefinitionStructure.prototype.getTreeRowsByQueryItemRefId = function (
			queryItemRefId
		) {
			var res = [];
			for (var treeRowId in this._treeRowDictionary) {
				var treeRow = this._treeRowDictionary[treeRowId];
				if (treeRow && treeRow.queryItemRefId === queryItemRefId) {
					res.push(treeRow);
				}
			}
			return res;
		};
		ViewDefinitionStructure.prototype.getColumnMappingById = function (id) {
			var resArray = this._columnMapping.filter(function (item) {
				return item.id === id;
			});
			if (resArray.length > 0) {
				return resArray[0];
			} else {
				return null;
			}
		};
		ViewDefinitionStructure.prototype.getColumnMapping = function (
			columnId,
			rowId
		) {
			var self = this;
			var resArray = this._columnMapping.filter(function (item) {
				if (item.sourceId === columnId) {
					var treeRow = self._treeRowDictionary[item.treeRowRefId];
					if (treeRow && treeRow.id === rowId) {
						return true;
					}
				}
				return false;
			});
			if (resArray.length > 0) {
				return resArray[0];
			} else {
				return null;
			}
		};
		ViewDefinitionStructure.prototype.getColumnsMappingForTreeRow = function (
			rowRefId
		) {
			return this._columnMapping.filter(function (obj) {
				return obj.treeRowRefId === rowRefId;
			});
		};
		/**
		 * Create new ColumnDefinition. All properties except id and name are null or default.
		 */
		ViewDefinitionStructure.prototype.createColumnDefinition = function () {
			var column = new ColumnDefinition(null);
			column.id = this._aras.generateNewGUID();
			column.name = this._aras.generateNewGUID();
			if (this._defaultBuilderMethod) {
				column.builderMethod = new ItemInfo(
					this._defaultBuilderMethod.id,
					this._defaultBuilderMethod.itemTypeName
				);
			}
			return column;
		};
		ViewDefinitionStructure.prototype.insertColumnDefinition = function (
			afterColumn,
			newColumn
		) {
			newColumn.positionOrder = this._findInsertPosition(afterColumn.id);
			this._reorderColumns(newColumn);
			this._insertColumnDefinition(newColumn);
			return newColumn;
		};
		ViewDefinitionStructure.prototype.getRowDefinitionSortOrder = function (
			rowDefenitionRefId
		) {
			var resArray = this._treeRowReferences.filter(function (obj) {
				return obj.childRefId === rowDefenitionRefId;
			});
			if (resArray.length > 0) {
				return resArray[0].viewOrder;
			} else {
				return 128;
			}
		};
		ViewDefinitionStructure.prototype.getParentRowDefinition = function (
			rowDefenitionRefId
		) {
			var resArray = this._treeRowReferences.filter(function (obj) {
				return !obj.isRecursiveRef && obj.childRefId === rowDefenitionRefId;
			});
			if (resArray.length > 0) {
				var parentRefId = resArray[0].parentRefId;
				if (parentRefId) {
					return this._treeRowDictionary[parentRefId];
				}
			}
		};
		ViewDefinitionStructure.prototype._reorderColumns = function (newColumn) {
			var allColumns = this.getAllColumnDefinitions();
			for (var i = 0; i < allColumns.length; i++) {
				var currentColumn = allColumns[i];
				if (currentColumn.positionOrder >= newColumn.positionOrder) {
					currentColumn.positionOrder += 1;
					this.updateColumnDefinition(currentColumn);
				}
			}
		};
		ViewDefinitionStructure.prototype._findInsertPosition = function (
			columnAfterId
		) {
			var allColumns = this.getAllColumnDefinitions();
			if (allColumns.length > 0) {
				var firstColumn = allColumns[0];
				var lastColumn = allColumns[allColumns.length - 1];
				var insertPosition = lastColumn.positionOrder + 1;
				for (var i = 0; i < allColumns.length; i++) {
					if (allColumns[i].id === columnAfterId) {
						insertPosition = allColumns[i].positionOrder + 1;
						break;
					}
				}
				return insertPosition;
			}
			return 0;
		};
		ViewDefinitionStructure.prototype._insertColumnDefinition = function (
			column
		) {
			this._startUpdateItem();
			var newItem = this._aras.IomInnovator.newItem(
				'rb_ColumnDefinition',
				'add'
			);
			column.serializeToItem(newItem);
			this._item.addRelationship(newItem);
			this._columnDefenitions.push(column);
		};
		ViewDefinitionStructure.prototype.updateColumnDefinition = function (
			column
		) {
			var columnDefinition = this.getColumnDefItem(column.id);
			if (columnDefinition) {
				this._startUpdateItem();
				this._setUpdateAction(columnDefinition);
				column.serializeToItem(columnDefinition);
			}
		};
		ViewDefinitionStructure.prototype.removeColumnDefinition = function (
			columnId
		) {
			var column = this.getColumnDefinitionById(columnId);
			if (column) {
				var columnItem = this.getColumnDefItem(column.id);
				if (columnItem) {
					this._startUpdateItem();
					this._setDeleteAction(columnItem);
				}
				this._columnDefenitions = this._columnDefenitions.filter(function (
					obj
				) {
					return obj.id !== column.id;
				});
				this._resortColumnDefinitions();
			}
		};
		ViewDefinitionStructure.prototype.createTreeRowDefinition = function (
			queryItemRefId
		) {
			var treeRowDefinition = new TreeRowDefinition(null);
			treeRowDefinition.id = this._aras.generateNewGUID();
			treeRowDefinition.queryItemRefId = queryItemRefId;
			treeRowDefinition.refId = this._aras.generateNewGUID();
			this._insertTreeRowDefinitionIntoItem(treeRowDefinition);
			this._treeRowDictionary[treeRowDefinition.refId] = treeRowDefinition;
			return treeRowDefinition;
		};
		ViewDefinitionStructure.prototype.insertTreeRowBetween = function (
			sourceRow,
			parentRow,
			childRow,
			sortOrder
		) {
			var existingReference = this._getExistingReference(
				parentRow.refId,
				childRow.refId
			);
			if (existingReference) {
				var parentRef = this._createTreeRowReference(
					parentRow.refId,
					sourceRow.refId,
					sortOrder
				);
				this._treeRowReferences.push(parentRef);
				this._insertTreeRowReferenceIntoItem(parentRef);
				var childRef = this._createTreeRowReference(
					sourceRow.refId,
					childRow.refId,
					existingReference.viewOrder
				);
				this._treeRowReferences.push(childRef);
				this._insertTreeRowReferenceIntoItem(childRef);
				this._removeTreeRowReference(existingReference.id);
			}
		};
		ViewDefinitionStructure.prototype.insertTreeRowAfter = function (
			treeRowDefinition,
			parentRefId,
			viewOrder
		) {
			var parentRef = this._createTreeRowReference(
				parentRefId,
				treeRowDefinition.refId,
				viewOrder
			);
			this._treeRowReferences.push(parentRef);
			this._insertTreeRowReferenceIntoItem(parentRef);
		};
		ViewDefinitionStructure.prototype.removeTreeRowDefinition = function (
			treeRowDefinitionId
		) {
			var treeRowDef = this.getTreeRowById(treeRowDefinitionId);
			var columnMappings = this.getColumnsMappingForTreeRow(treeRowDef.refId);
			for (var i = 0; i < columnMappings.length; i++) {
				this.removeColumnMapping(columnMappings[i]);
			}
			this._removeTreeRowDefinition(treeRowDefinitionId);
		};
		ViewDefinitionStructure.prototype.insertTreeRowBefore = function (
			treeRowDefinition,
			childRefId,
			viewOrder
		) {
			var parentRef = this._createTreeRowReference(
				treeRowDefinition.refId,
				childRefId,
				viewOrder
			);
			this._treeRowReferences.push(parentRef);
			this._insertTreeRowReferenceIntoItem(parentRef);
		};
		ViewDefinitionStructure.prototype.createColumnMapping = function (
			treeRowRefId,
			columnId
		) {
			var mapping = new ColumnMapping(null);
			mapping.id = this._aras.generateNewGUID();
			mapping.treeRowRefId = treeRowRefId;
			mapping.sourceId = columnId;
			this._columnMapping.push(mapping);
			this._insertColumnMappingIntoItem(mapping);
			return mapping;
		};
		ViewDefinitionStructure.prototype.updateColumnMapping = function (
			columnMapping
		) {
			var columnMappingNode = this._getColumnMappingItem(columnMapping.id);
			if (columnMappingNode) {
				this._startUpdateItem();
				this._setUpdateAction(columnMappingNode);
				columnMapping.serializeToItem(columnMappingNode);
				var columnDefinition = this.getColumnDefItem(columnMapping.sourceId);
				this._setUpdateAction(columnDefinition);
			}
		};
		ViewDefinitionStructure.prototype.getTreeRowReference = function (
			parentRefId,
			childRefId
		) {
			var res = this._treeRowReferences.filter(function (obj) {
				return obj.childRefId === childRefId && obj.parentRefId === parentRefId;
			});
			if (res.length > 0) {
				return res[0];
			}
		};
		ViewDefinitionStructure.prototype.getRecursiveReferenceOn = function (
			rowRefId
		) {
			return this._treeRowReferences.filter(function (obj) {
				return obj.isRecursiveRef && obj.childRefId === rowRefId;
			});
		};
		ViewDefinitionStructure.prototype.getRecursiveReferenceFrom = function (
			rowRefId
		) {
			var res = this._treeRowReferences.filter(function (obj) {
				return obj.isRecursiveRef && obj.parentRefId === rowRefId;
			});
			if (res.length > 0) {
				return res[0];
			}
		};
		ViewDefinitionStructure.prototype.getRecursiveReference = function (
			parentRefId,
			childRefId
		) {
			var res = this._treeRowReferences.filter(function (obj) {
				return (
					obj.isRecursiveRef &&
					obj.parentRefId === parentRefId &&
					obj.childRefId === childRefId
				);
			});
			if (res.length > 0) {
				return res[0];
			}
		};
		ViewDefinitionStructure.prototype.removeColumnMapping = function (
			columnMapping
		) {
			var columnMappingNode = this._getColumnMappingItem(columnMapping.id);
			if (columnMappingNode) {
				this._startUpdateItem();
				this._setDeleteAction(columnMappingNode);
				var columnDefinition = this.getColumnDefItem(columnMapping.sourceId);
				this._setUpdateAction(columnDefinition);
				this._columnMapping = this._columnMapping.filter(function (obj) {
					return obj.id !== columnMapping.id;
				});
			}
		};
		ViewDefinitionStructure.prototype._checkRecursionNodes = function () {
			var roots = this.getRootTreeRows();
			var usedRowsDictionary = {};
			for (var i = 0; i < roots.length; i++) {
				var currentRow = roots[i];
				usedRowsDictionary[currentRow.refId] = currentRow;
				this._checkOnRecursion(currentRow.refId, usedRowsDictionary);
			}
		};
		ViewDefinitionStructure.prototype._checkOnRecursion = function (
			parentRowRefId,
			usedRowsDictionary
		) {
			var childReferences = this._getRowReferenceByParent(parentRowRefId);
			for (var j = 0; j < childReferences.length; j++) {
				var childRefId = childReferences[j].childRefId;
				if (usedRowsDictionary[childRefId]) {
					childReferences[j].isRecursiveRef = true;
					var row = this._treeRowDictionary[parentRowRefId];
					row.hasRecursionLink = true;
					row.recursionOn = childRefId;
				} else {
					usedRowsDictionary[childRefId] = true;
					this._checkOnRecursion(childRefId, usedRowsDictionary);
				}
			}
		};
		ViewDefinitionStructure.prototype.getChildRowReferences = function (
			parentRefId
		) {
			return this._getRowReferenceByParent(parentRefId);
		};
		ViewDefinitionStructure.prototype._getRowReferenceByParent = function (
			parentRefId
		) {
			var references = this._treeRowReferences.filter(function (obj) {
				return obj.parentRefId === parentRefId;
			});
			return references.sort(function (a, b) {
				return a.viewOrder - b.viewOrder;
			});
		};
		ViewDefinitionStructure.prototype.removeTreeRowReference = function (
			referenceId
		) {
			this._removeTreeRowReference(referenceId);
		};
		ViewDefinitionStructure.prototype._removeTreeRowDefinition = function (
			treeRowId
		) {
			var treeRowDef = this.getTreeRowById(treeRowId);
			this._startUpdateItem();
			var treeRowItem = this._getTreeRowDefItem(treeRowId);
			if (treeRowItem) {
				this._setDeleteAction(treeRowItem);
			}
			delete this._treeRowDictionary[treeRowDef.refId];
		};
		ViewDefinitionStructure.prototype._getParentReference = function (
			treeRowDef
		) {
			var parentRefArray = this._treeRowReferences.filter(function (obj) {
				return obj.childRefId === treeRowDef.refId;
			});
			if (parentRefArray.length > 0) {
				return parentRefArray[0];
			}
		};
		ViewDefinitionStructure.prototype._updateChildTreeRowReference = function (
			parentReference,
			treeRowRefId
		) {
			var childRefArray = this._treeRowReferences.filter(function (obj) {
				return obj.parentRefId === treeRowRefId;
			});
			for (var i = 0; i < childRefArray.length; i++) {
				var currentRef = childRefArray[i];
				currentRef.parentRefId = parentReference
					? parentReference.parentRefId
					: null;
				this._updateTreeRowReference(currentRef);
			}
		};
		ViewDefinitionStructure.prototype._removeTreeRowReference = function (
			referenceId
		) {
			var referenceItem = this._getRowReferenceItem(referenceId);
			if (referenceItem) {
				this._startUpdateItem();
				this._setDeleteAction(referenceItem);
				this._treeRowReferences = this._treeRowReferences.filter(function (
					obj
				) {
					return obj.id !== referenceId;
				});
			}
		};
		ViewDefinitionStructure.prototype._getRowReferenceItem = function (id) {
			var referenceNodes = this._item.getRelationships('rb_TreeRowReference');
			for (var i = 0; i < referenceNodes.getItemCount(); i++) {
				var reference = referenceNodes.getItemByIndex(i);
				if (reference.getID() === id) {
					return reference;
				}
			}
		};
		ViewDefinitionStructure.prototype._getExistingReference = function (
			parentRefId,
			childRefId
		) {
			if (parentRefId && childRefId) {
				var resArray = this._treeRowReferences.filter(function (item) {
					return (
						item.childRefId === childRefId && item.parentRefId === parentRefId
					);
				});
				if (resArray.length > 0) {
					return resArray[0];
				}
			}
		};
		ViewDefinitionStructure.prototype.createTreeRowReference = function (
			parentRefId,
			childRefId,
			viewOrder
		) {
			var ref = this._createTreeRowReference(
				parentRefId,
				childRefId,
				viewOrder
			);
			this._treeRowReferences.push(ref);
			this._insertTreeRowReferenceIntoItem(ref);
			return ref;
		};
		ViewDefinitionStructure.prototype._createTreeRowReference = function (
			parentRefId,
			childRefId,
			viewOrder
		) {
			var treeRowReference = new TreeRowReference(null);
			treeRowReference.id = this._aras.generateNewGUID();
			treeRowReference.parentRefId = parentRefId;
			treeRowReference.childRefId = childRefId;
			treeRowReference.viewOrder = viewOrder;
			treeRowReference.referenceType = REFERENCE_TYPE_ENUM.CHILD;
			return treeRowReference;
		};
		ViewDefinitionStructure.prototype._insertTreeRowReferenceIntoItem = function (
			treeRowReference
		) {
			this._startUpdateItem();
			var newItem = this._aras.IomInnovator.newItem(
				'rb_TreeRowReference',
				'add'
			);
			treeRowReference.serializeToItem(newItem);
			this._item.addRelationship(newItem);
		};
		ViewDefinitionStructure.prototype.updateTreeRowReference = function (
			treeRowReference
		) {
			this._updateTreeRowReference(treeRowReference);
		};
		ViewDefinitionStructure.prototype.updateTreeRowDefinition = function (
			treeRowDefinition
		) {
			this._startUpdateItem();
			var treeRowRefItem = this._getTreeRowDefItem(treeRowDefinition.id);
			this._setUpdateAction(treeRowRefItem);
			treeRowDefinition.serializeToItem(treeRowRefItem);
		};
		ViewDefinitionStructure.prototype._updateTreeRowReference = function (
			treeRowReference
		) {
			this._startUpdateItem();
			var treeRowRefItem = this._getRowReferenceItem(treeRowReference.id);
			this._setUpdateAction(treeRowRefItem);
			treeRowReference.serializeToItem(treeRowRefItem);
		};
		ViewDefinitionStructure.prototype._insertTreeRowDefinitionIntoItem = function (
			treeRowDefinition
		) {
			this._startUpdateItem();
			var newItem = this._aras.IomInnovator.newItem(
				'rb_TreeRowDefinition',
				'add'
			);
			treeRowDefinition.serializeToItem(newItem);
			this._item.addRelationship(newItem);
		};
		ViewDefinitionStructure.prototype._insertColumnMappingIntoItem = function (
			columnMapping
		) {
			this._startUpdateItem();
			var newItem = this._aras.IomInnovator.newItem('rb_ColumnMapping', 'add');
			columnMapping.serializeToItem(newItem);
			var columnDefNode = this.getColumnDefItem(columnMapping.sourceId);
			this._setUpdateAction(columnDefNode);
			columnDefNode.addRelationship(newItem);
		};
		ViewDefinitionStructure.prototype._getColumnMappingItem = function (
			columnMappingId
		) {
			var xPath =
				"Relationships/Item[@type='rb_ColumnDefinition']/Relationships/Item[@id='" +
				columnMappingId +
				"']";
			var items = this._item.getItemsByXPath(xPath);
			if (items.getItemCount() === 1) {
				return items.getItemByIndex(0);
			}
		};
		ViewDefinitionStructure.prototype._resortColumnDefinitions = function () {
			var allColumns = this.getAllColumnDefinitions();
			for (var i = 0; i < allColumns.length; i++) {
				var currentColumn = allColumns[i];
				if (currentColumn.positionOrder != i) {
					currentColumn.positionOrder = i;
					this.updateColumnDefinition(currentColumn);
				}
			}
		};
		ViewDefinitionStructure.prototype.renameColumnDefinition = function (
			columnDefinition,
			updatedItem
		) {
			var sourceItem = this.getColumnDefItem(columnDefinition.id);
			var headerProperty = 'header';
			var languages = this._aras
				.getLanguagesResultNd()
				.selectNodes("Item[@type='Language']");
			for (var i = 0, j = languages.length; i < j; i++) {
				var languageCode = this._aras.getItemProperty(languages[i], 'code');
				var langNodeValue = this._aras.getNodeTranslationElement(
					updatedItem,
					headerProperty,
					languageCode,
					null,
					undefined
				);
				if (langNodeValue !== null) {
					this._aras.setNodeTranslationElement(
						sourceItem.node,
						headerProperty,
						langNodeValue,
						languageCode
					);
				}
			}
			var headerNodeValue = this._aras.getItemProperty(
				updatedItem,
				headerProperty,
				''
			);
			columnDefinition.header = headerNodeValue;
			this.updateColumnDefinition(columnDefinition);
		};
		ViewDefinitionStructure.prototype.getColumnDefItem = function (id) {
			var columnDefNodes = this._item.getRelationships('rb_ColumnDefinition');
			for (var i = 0; i < columnDefNodes.getItemCount(); i++) {
				var columnDefinition = columnDefNodes.getItemByIndex(i);
				if (columnDefinition.getID() === id) {
					return columnDefinition;
				}
			}
		};
		ViewDefinitionStructure.prototype._getTreeRowDefItem = function (rowDefId) {
			var rowDefNodes = this._item.getRelationships('rb_TreeRowDefinition');
			for (var i = 0; i < rowDefNodes.getItemCount(); i++) {
				var rowDef = rowDefNodes.getItemByIndex(i);
				if (rowDef.getID() === rowDefId) {
					return rowDef;
				}
			}
		};
		ViewDefinitionStructure.prototype.init = function () {
			this._treeGridViewDefinition = new TreeGridViewDefinition(this._item);
			var treeRowReferenceNodes = this._item.getRelationships(
				'rb_TreeRowReference'
			);
			for (var i = 0; i < treeRowReferenceNodes.getItemCount(); i++) {
				var refItem = treeRowReferenceNodes.getItemByIndex(i);
				if (refItem.getAttribute('action') !== 'delete') {
					var queryReference = new TreeRowReference(refItem);
					if (queryReference.id) {
						this._treeRowReferences.push(queryReference);
					}
				}
			}
			var treeRowDefNodes = this._item.getRelationships('rb_TreeRowDefinition');
			for (var j = 0; j < treeRowDefNodes.getItemCount(); j++) {
				var rowItem = treeRowDefNodes.getItemByIndex(j);
				if (rowItem.getAttribute('action') !== 'delete') {
					var treeRow = new TreeRowDefinition(
						treeRowDefNodes.getItemByIndex(j)
					);
					if (treeRow.refId) {
						this._treeRowDictionary[treeRow.refId] = treeRow;
					}
				}
			}
			this.initColumnDefinition(this._item);
			this._checkRecursionNodes();
		};
		ViewDefinitionStructure.prototype.initColumnDefinition = function (item) {
			var columnDefNodes = item.getRelationships('rb_ColumnDefinition');
			for (var i = 0; i < columnDefNodes.getItemCount(); i++) {
				var columnDefinition = columnDefNodes.getItemByIndex(i);
				if (columnDefinition.getAttribute('action') !== 'delete') {
					var columnDef = new ColumnDefinition(columnDefinition);
					this._columnDefenitions.push(columnDef);
					this.initColumnMapping(columnDefinition);
				}
			}
		};
		ViewDefinitionStructure.prototype.initColumnMapping = function (item) {
			var columnMappingNodes = item.getRelationships('rb_ColumnMapping');
			for (var i = 0; i < columnMappingNodes.getItemCount(); i++) {
				var columnMappingItem = columnMappingNodes.getItemByIndex(i);
				if (columnMappingItem.getAttribute('action') !== 'delete') {
					var columnMapping = new ColumnMapping(columnMappingItem);
					if (columnMapping.sourceId) {
						this._columnMapping.push(columnMapping);
					}
				}
			}
		};
		ViewDefinitionStructure.prototype._startUpdateItem = function () {
			this._item.setAction('update');
			this._item.setAttribute('isDirty', '1');
		};
		ViewDefinitionStructure.prototype._setUpdateAction = function (item) {
			var action = item.getAttribute('action');
			if (action !== 'add' && action !== 'delete') {
				item.setAction('edit');
			}
		};
		ViewDefinitionStructure.prototype._setDeleteAction = function (item) {
			var action = item.getAttribute('action');
			if (action === 'add') {
				item.node.parentNode.removeChild(item.node);
			} else {
				item.setAction('delete');
			}
		};
		return ViewDefinitionStructure;
	})();
	return ViewDefinitionStructure;
});
