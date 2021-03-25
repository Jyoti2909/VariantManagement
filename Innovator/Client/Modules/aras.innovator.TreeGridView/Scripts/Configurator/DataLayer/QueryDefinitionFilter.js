define([
	'TreeGridView/Scripts/Configurator/Models/TreeGrid/GraphLink'
], function (GraphLink) {
	'use strict';
	var QueryDefinitionFilter = (function () {
		function QueryDefinitionFilter(viewDefinition, queryDefinition) {
			this._queryDefinition = queryDefinition;
			this._viewDefinition = viewDefinition;
		}
		QueryDefinitionFilter.prototype.applyQueryDefinitionFilter = function (
			branch
		) {
			var rootQI = this._queryDefinition.getRootQueryItem();
			var rootNode;
			if (rootQI) {
				rootNode = branch.getRootNode();
				if (rootNode) {
					if (rootQI.refId === rootNode.queryItemRefId) {
						this._mergeQueryDefinitionAndExistBranch(
							rootQI.refId,
							rootNode,
							branch
						);
					}
				} else {
					rootNode = branch.createNode(undefined, rootQI.refId, rootQI.alias);
					this._createCandidateBranch(rootQI.refId, rootNode, branch);
				}
			}
		};
		QueryDefinitionFilter.prototype._mergeQueryDefinitionAndExistBranch = function (
			rootQIRefId,
			rootNode,
			branch
		) {
			var childQueryReferences = this._queryDefinition.getChildReferences(
				rootQIRefId
			);
			var rootQueryItem = this._queryDefinition.getQueryItem(rootQIRefId);
			var existNodes = branch.getChildNodes(rootNode);
			var existQueryItemRefIds = existNodes.map(function (obj) {
				if (obj.queryItemRefId) {
					return obj.queryItemRefId;
				}
			});
			function getNodeByQueryItem(queryItemRefId) {
				var byQueryItem = existNodes.filter(function (obj) {
					return obj.queryItemRefId === queryItemRefId;
				});
				if (byQueryItem.length > 0) {
					return byQueryItem[0];
				}
			}
			var sortOrder = 128;
			for (var i = 0; i < childQueryReferences.length; i++) {
				var queryItemRefId = childQueryReferences[i].childRefId;
				if (existQueryItemRefIds.indexOf(queryItemRefId) < 0) {
					// insert
					this._insertCandidateNode(
						childQueryReferences[i],
						branch,
						rootNode,
						sortOrder
					);
				} else {
					var existNode = getNodeByQueryItem(queryItemRefId);
					this._mergeQueryDefinitionAndExistBranch(
						queryItemRefId,
						existNode,
						branch
					);
				}
				sortOrder += 128;
			}
		};
		QueryDefinitionFilter.prototype._insertCandidateNode = function (
			childQueryReference,
			branch,
			rootNode,
			sortOrder
		) {
			var childQueryItem = this._queryDefinition.getQueryItem(
				childQueryReference.childRefId
			);
			var candidateNode = branch.createNode(
				undefined,
				childQueryItem.refId,
				childQueryItem.alias
			);
			if (childQueryReference.isRecursiveRef) {
				candidateNode.isRecursiveNode = true;
				candidateNode.recursionNodeMapped = false;
			}
			var link = this._insertChildGraphNode(
				childQueryReference,
				rootNode,
				candidateNode,
				branch,
				sortOrder
			);
			if (childQueryReference.isRecursiveRef) {
				link.isRecursive = true;
			}
			this._createCandidateBranch(
				candidateNode.queryItemRefId,
				candidateNode,
				branch
			);
		};
		QueryDefinitionFilter.prototype._createCandidateBranch = function (
			queryItemRefId,
			rootNode,
			branch
		) {
			var childQueryReferences = this._queryDefinition.getChildReferences(
				queryItemRefId
			);
			var sortOrder = 128;
			for (var i = 0; i < childQueryReferences.length; i++) {
				var childNode = this._createChildGraphNode(
					childQueryReferences[i],
					branch
				);
				var link = this._insertChildGraphNode(
					childQueryReferences[i],
					rootNode,
					childNode,
					branch,
					sortOrder
				);
				if (childQueryReferences[i].isRecursiveRef) {
					link.isRecursive = true;
					childNode.isRecursiveNode = true;
					childNode.recursionNodeMapped = false;
				} else {
					this._createCandidateBranch(
						childNode.queryItemRefId,
						childNode,
						branch
					);
				}
				sortOrder += 128;
			}
		};
		QueryDefinitionFilter.prototype._createChildGraphNode = function (
			queryReference,
			branch
		) {
			var childQueryItem = this._queryDefinition.getQueryItem(
				queryReference.childRefId
			);
			var childNode = branch.createNode(
				undefined,
				childQueryItem.refId,
				childQueryItem.alias
			);
			return childNode;
		};
		QueryDefinitionFilter.prototype._insertChildGraphNode = function (
			queryReference,
			parentNode,
			childNode,
			branch,
			sortOrder
		) {
			var link = new GraphLink();
			link.queryReferenceId = queryReference.id;
			link.parentNodeId = parentNode.id;
			link.childNodeId = childNode.id;
			link.sortOrder = sortOrder;
			branch.addGraphLink(link);
			return link;
		};
		return QueryDefinitionFilter;
	})();
	return QueryDefinitionFilter;
});
