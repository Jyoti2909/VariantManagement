define([
	'TreeGridView/Scripts/Configurator/Models/QueryDefinition/QueryDefinitionModel',
	'TreeGridView/Scripts/Configurator/Models/QueryDefinition/QueryItemModel',
	'TreeGridView/Scripts/Configurator/Models/QueryDefinition/QueryReferenceModel'
], function (QueryDefinitionModel, QueryItemModel, QueryReferenceModel) {
	'use strict';
	var QueryDefinitionStructure = (function () {
		function QueryDefinitionStructure(item) {
			this._queryItemDictionary = {};
			this._queryReferences = [];
			this._item = item;
			this.init();
		}
		QueryDefinitionStructure.prototype.getRootQueryItem = function () {
			var rootReference = this.findRootQueryReference();
			if (rootReference) {
				if (rootReference.childRefId) {
					return this._queryItemDictionary[rootReference.childRefId];
				}
			}
		};
		QueryDefinitionStructure.prototype.getQueryItem = function (refId) {
			if (refId) {
				return this._queryItemDictionary[refId];
			}
		};
		QueryDefinitionStructure.prototype.getChildren = function (rootQueryItem) {
			var references = [];
			for (var i = 0; i < this._queryReferences.length; i++) {
				if (this._queryReferences[i].parentRefId === rootQueryItem.refId) {
					references.push(this._queryReferences[i]);
				}
			}
			references.sort(function (a, b) {
				return a.sortOrder - b.sortOrder;
			});
			var result = [];
			for (var j = 0; j < references.length; j++) {
				var queryItem = this._queryItemDictionary[references[j].childRefId];
				if (queryItem) {
					result.push(queryItem);
				}
			}
			return result;
		};
		QueryDefinitionStructure.prototype.getQueryDefinitionInfo = function () {
			return this._queryDefinition;
		};
		QueryDefinitionStructure.prototype.getQueryDefinitionSortOrder = function (
			queryDefinitionRefId
		) {
			var resArray = this._queryReferences.filter(function (obj) {
				return obj.childRefId === queryDefinitionRefId;
			});
			if (resArray.length > 0) {
				return resArray[0].sortOrder;
			} else {
				return 128;
			}
		};
		QueryDefinitionStructure.prototype.getParentQueryItem = function (
			queryItemRefId
		) {
			var resArray = this._queryReferences.filter(function (obj) {
				return !obj.isRecursiveRef && obj.childRefId === queryItemRefId;
			});
			if (resArray.length > 0) {
				var parentRefId = resArray[0].parentRefId;
				if (parentRefId) {
					return this._queryItemDictionary[parentRefId];
				}
			}
		};
		QueryDefinitionStructure.prototype.getChildReferences = function (
			parentQIRefId
		) {
			var references = this._queryReferences.filter(function (obj) {
				return obj.parentRefId === parentQIRefId;
			});
			references.sort(function (a, b) {
				return a.sortOrder - b.sortOrder;
			});
			return references;
		};
		QueryDefinitionStructure.prototype.getRecursiveReference = function (
			childRefId
		) {
			var resArray = this._queryReferences.filter(function (obj) {
				return obj.isRecursiveRef && obj.childRefId === childRefId;
			});
			if (resArray.length > 0) {
				return resArray[0];
			}
		};
		QueryDefinitionStructure.prototype.getRecursiveReferences = function (
			childRefId
		) {
			var resArray = this._queryReferences.filter(function (obj) {
				return obj.isRecursiveRef && obj.childRefId === childRefId;
			});
			if (resArray.length > 0) {
				return resArray;
			}
		};
		QueryDefinitionStructure.prototype.getReferenceByChildRefId = function (
			childRefId
		) {
			var resArray = this._queryReferences.filter(function (obj) {
				return !obj.isRecursiveRef && obj.childRefId === childRefId;
			});
			if (resArray.length > 0) {
				return resArray[0];
			}
		};
		QueryDefinitionStructure.prototype.getReferenceById = function (id) {
			var resArray = this._queryReferences.filter(function (obj) {
				return obj.id === id;
			});
			if (resArray.length > 0) {
				return resArray[0];
			}
		};
		QueryDefinitionStructure.prototype._checkRecursionNodes = function () {
			var root = this.getRootQueryItem();
			if (root) {
				var usedQIDictionary = {};
				usedQIDictionary[root.refId] = true;
				this._checkOnRecursion(root.refId, usedQIDictionary);
			}
		};
		QueryDefinitionStructure.prototype._checkOnRecursion = function (
			parentRefId,
			usedQIDictionary
		) {
			var childReferences = this._getReferenceByParent(parentRefId);
			for (var j = 0; j < childReferences.length; j++) {
				var childRefId = childReferences[j].childRefId;
				if (usedQIDictionary[childRefId]) {
					childReferences[j].isRecursiveRef = true;
					var row = this._queryItemDictionary[childRefId];
					row.hasRecursion = true;
				} else {
					usedQIDictionary[childRefId] = true;
					this._checkOnRecursion(childRefId, usedQIDictionary);
				}
			}
		};
		QueryDefinitionStructure.prototype._getReferenceByParent = function (
			parentRefId
		) {
			return this._queryReferences.filter(function (obj) {
				return obj.parentRefId === parentRefId;
			});
		};
		QueryDefinitionStructure.prototype.init = function () {
			this._queryDefinition = new QueryDefinitionModel(this._item);
			var referenceNodes = this._item.getRelationships('qry_QueryReference');
			for (var i = 0; i < referenceNodes.getItemCount(); i++) {
				var queryReference = new QueryReferenceModel(
					referenceNodes.getItemByIndex(i)
				);
				if (queryReference.id) {
					this._queryReferences.push(queryReference);
				}
			}
			var itemsNodes = this._item.getRelationships('qry_QueryItem');
			for (var j = 0; j < itemsNodes.getItemCount(); j++) {
				var queryItem = new QueryItemModel(itemsNodes.getItemByIndex(j));
				if (queryItem.refId) {
					this._queryItemDictionary[queryItem.refId] = queryItem;
				}
			}
			this._checkRecursionNodes();
		};
		QueryDefinitionStructure.prototype.findRootQueryReference = function () {
			for (var i = 0; i < this._queryReferences.length; i++) {
				if (!this._queryReferences[i].parentRefId) {
					return this._queryReferences[i];
				}
			}
		};
		return QueryDefinitionStructure;
	})();
	return QueryDefinitionStructure;
});
