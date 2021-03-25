define([
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/ReferenceTypeEnum'
], function (REFERENCE_TYPE_ENUM) {
	'use strict';
	var CombiningModule = (function () {
		function CombiningModule(viewDefinition, queryDefinition) {
			this._queryDefinition = queryDefinition;
			this._viewDefinition = viewDefinition;
		}
		CombiningModule.prototype.combineNodes = function (joinNodeIds, branch) {
			joinNodeIds = this._getAllJoinedNode(joinNodeIds, branch);
			var startJoinNode = this._getStartJoinNode(joinNodeIds, branch);
			if (startJoinNode) {
				this._removeColumnMappingsPerRow(startJoinNode.treeRowRefId);
				var childJoinNodesIds = this._removeStartJoinNodeFromList(
					joinNodeIds,
					startJoinNode
				);
				for (var i = 0; i < childJoinNodesIds.length; i++) {
					var childGraphNode = branch.getNodeById(childJoinNodesIds[i]);
					if (childGraphNode.isRecursiveNode) {
						var parentNode = this._getParentNonCandidateNode(
							childGraphNode,
							branch
						);
						var recursiveRef = this._viewDefinition.getRecursiveReference(
							parentNode.treeRowRefId,
							childGraphNode.treeRowRefId
						);
						if (recursiveRef) {
							this._setJoinReference(recursiveRef);
							this._removeColumnMappingsPerRow(childGraphNode.treeRowRefId);
						}
					} else {
						var rowReference = this._viewDefinition.getReferenceByChild(
							childGraphNode.treeRowRefId
						);
						if (rowReference) {
							this._setJoinReference(rowReference);
							this._removeColumnMappingsPerRow(childGraphNode.treeRowRefId);
						}
					}
				}
			}
		};
		CombiningModule.prototype._getParentNonCandidateNode = function (
			childNode,
			branch
		) {
			var currentNode = childNode;
			while (true) {
				var parentNode = branch.getParentNode(currentNode.id);
				if (!parentNode) {
					break;
				}
				if (!parentNode.isCandidate) {
					return parentNode;
				} else {
					currentNode = parentNode;
				}
			}
		};
		CombiningModule.prototype._getAllJoinedNode = function (
			joinNodeIds,
			branch
		) {
			var res = [];
			for (var i = 0; i < joinNodeIds.length; i++) {
				var graphNode = branch.getNodeById(joinNodeIds[i]);
				if (!graphNode.isCandidate) {
					res.push(joinNodeIds[i]);
					var joinedNodes = branch.getJoinedNodes(graphNode);
					if (joinedNodes.length > 0) {
						for (var j = 0; j < joinedNodes.length; j++) {
							res.push(joinedNodes[j].id);
						}
					}
				}
			}
			return res;
		};
		CombiningModule.prototype.decombineNodes = function (graphNodeId, branch) {
			var graphNode = branch.getNodeById(graphNodeId);
			var joinedNodes = branch.getJoinedNodes(graphNode);
			if (joinedNodes && joinedNodes.length > 0) {
				var startJoinNode = graphNode;
				for (var i = 0; i < joinedNodes.length; i++) {
					var childGraphNode = joinedNodes[i];
					if (childGraphNode.isRecursiveNode) {
						var parentNode = this._getParentNonCandidateNode(
							childGraphNode,
							branch
						);
						var recursiveRef = this._viewDefinition.getRecursiveReference(
							parentNode.treeRowRefId,
							childGraphNode.treeRowRefId
						);
						if (recursiveRef) {
							this._setChildReference(recursiveRef);
						}
					} else {
						var rowReference = this._viewDefinition.getReferenceByChild(
							childGraphNode.treeRowRefId
						);
						if (rowReference) {
							this._setChildReference(rowReference);
						}
					}
				}
				this._removeColumnMappingsPerRow(startJoinNode.treeRowRefId);
			}
		};
		CombiningModule.prototype._removeColumnMappingsPerRow = function (
			treeRowRefId
		) {
			var allColumnDefinitions = this._viewDefinition.getAllColumnDefinitions();
			if (allColumnDefinitions.length > 0) {
				var existColumnMappings = this._viewDefinition.getColumnsMappingForTreeRow(
					treeRowRefId
				);
				for (var i = 0; i < existColumnMappings.length; i++) {
					this._viewDefinition.removeColumnMapping(existColumnMappings[i]);
				}
			}
		};
		CombiningModule.prototype._setJoinReference = function (rowReference) {
			rowReference.referenceType = REFERENCE_TYPE_ENUM.JOIN;
			this._viewDefinition.updateTreeRowReference(rowReference);
		};
		CombiningModule.prototype._setChildReference = function (rowReference) {
			rowReference.referenceType = REFERENCE_TYPE_ENUM.CHILD;
			this._viewDefinition.updateTreeRowReference(rowReference);
		};
		// Check if we can join different nodes in branch
		CombiningModule.prototype.canCombineNodes = function (joinNodeIds, branch) {
			joinNodeIds = this._getAllJoinedNode(joinNodeIds, branch);
			if (joinNodeIds.length < 2) {
				return false;
			}
			var self = this;
			var childJoinNodesIds;
			// recursive function
			function removeJoinCandidates(parentNode) {
				var childNodes = branch.getChildNodes(parentNode);
				for (var i = 0; i < childNodes.length; i++) {
					if (childNodes[i].isGroup || childNodes[i].isCandidate) {
						continue;
					}
					var indexOfChild = childJoinNodesIds.indexOf(childNodes[i].id);
					if (indexOfChild > -1) {
						childJoinNodesIds.splice(indexOfChild, 1);
						removeJoinCandidates(childNodes[i]);
					}
				}
			}
			var startJoinNode = this._getStartJoinNode(joinNodeIds, branch);
			if (startJoinNode) {
				childJoinNodesIds = this._removeStartJoinNodeFromList(
					joinNodeIds,
					startJoinNode
				);
				// traversal branch and remove nodes from collection "childJoinNodesIds" if those nodes
				// can be joined to startJoinNode
				removeJoinCandidates(startJoinNode);
				// if collection "childJoinNodesIds" is empty this mean
				// that all childJoinNodesIds can be joined to startJoinNode
				return childJoinNodesIds.length === 0;
			}
			return false;
		};
		CombiningModule.prototype._getStartJoinNode = function (
			joinNodeIds,
			branch
		) {
			var rootNode = branch.getRootNode();
			if (rootNode) {
				// find first node which contains in "joinNodeIds", it will be main join row
				var startJoinNode;
				if (joinNodeIds.indexOf(rootNode.id) > -1) {
					return rootNode;
				} else {
					return this._findStartJoinNode(rootNode, joinNodeIds, branch);
				}
			}
			return null;
		};
		CombiningModule.prototype._removeStartJoinNodeFromList = function (
			joinNodeIds,
			startJoinNode
		) {
			var index = joinNodeIds.indexOf(startJoinNode.id);
			if (index > -1) {
				joinNodeIds.splice(index, 1);
			}
			return joinNodeIds;
		};
		CombiningModule.prototype._findStartJoinNode = function (
			parentNode,
			joinNodeIds,
			branch
		) {
			var children = branch.getChildNodes(parentNode);
			for (var i = 0; i < children.length; i++) {
				if (joinNodeIds.indexOf(children[i].id) > -1) {
					return children[i];
				} else {
					var foundNode = this._findStartJoinNode(
						children[i],
						joinNodeIds,
						branch
					);
					if (foundNode) {
						return foundNode;
					}
				}
			}
		};
		CombiningModule.prototype._getOrCreateFirstColumnMappingForRow = function (
			columnId,
			rowId
		) {
			var row = this._viewDefinition.getTreeRowById(rowId);
			var columnMapping = this._viewDefinition.getColumnMapping(
				columnId,
				rowId
			);
			if (!columnMapping) {
				return this._viewDefinition.createColumnMapping(row.refId, columnId);
			} else {
				return columnMapping;
			}
		};
		return CombiningModule;
	})();
	return CombiningModule;
});
