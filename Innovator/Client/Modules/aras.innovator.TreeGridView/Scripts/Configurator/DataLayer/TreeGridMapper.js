define(function () {
	'use strict';
	var TreeGridMapper = (function () {
		function TreeGridMapper(viewDefinition, queryDefinition, branch) {
			this._queryDefinition = queryDefinition;
			this._viewDefinition = viewDefinition;
			this._currentBranch = branch;
		}
		TreeGridMapper.prototype.mapTreeRow = function (graphNodeId) {
			if (graphNodeId) {
				var graphNode = this._currentBranch.getNodeById(graphNodeId);
				if (graphNode.isRecursiveNode) {
					this._mapRecursiveNode(graphNode);
				} else {
					var parentTreeRow = this._getParentTreeRowDefinition(graphNodeId);
					var childTreeRows = this._getChildTreeRows(graphNodeId);
					if (parentTreeRow && childTreeRows.length > 0) {
						this._mapNodeBetween(
							parentTreeRow,
							childTreeRows,
							graphNode,
							this._currentBranch
						);
					}
					if (parentTreeRow && childTreeRows.length === 0) {
						this._mapNodeWithoutChildren(graphNode, parentTreeRow);
					}
					if (!parentTreeRow && childTreeRows.length > 0) {
						this._mapNodeAfter(childTreeRows, graphNode, this._currentBranch);
					}
					if (!parentTreeRow && childTreeRows.length === 0) {
						var rootRow = this._viewDefinition.createTreeRowDefinition(
							graphNode.queryItemRefId
						);
						graphNode.treeRowRefId = rootRow.refId;
						this._createRootReference(rootRow, graphNode, this._currentBranch);
					}
				}
			}
		};
		TreeGridMapper.prototype._mapNodeWithoutChildren = function (
			graphNode,
			parentTreeRow
		) {
			var newNode = this._viewDefinition.createTreeRowDefinition(
				graphNode.queryItemRefId
			);
			var parentExist = this._getParentExistNode(graphNode);
			graphNode.treeRowRefId = newNode.refId;
			this._reorderNodes(
				parentExist,
				this._currentBranch,
				graphNode,
				newNode,
				parentTreeRow
			);
		};
		TreeGridMapper.prototype._mapRecursiveNode = function (graphNode) {
			var recursiveLink = this._currentBranch.getRecursiveLink(graphNode.id);
			if (recursiveLink) {
				var recursiveNodeOn = this._currentBranch.getRecursiveNodeOn(graphNode);
				if (recursiveNodeOn && recursiveNodeOn.isCandidate) {
					// when we try mapped recursion node and base recursion node hasn't mapped yet
					this.mapTreeRow(recursiveNodeOn.id);
				}
			}
			var parentTreeRow = this._getParentTreeRowDefinition(graphNode.id);
			if (parentTreeRow) {
				if (recursiveLink) {
					this._createRecursiveReference(parentTreeRow, recursiveLink);
				}
			}
		};
		TreeGridMapper.prototype._createRecursiveReference = function (
			parentTreeRow,
			recursiveLink
		) {
			var recursiveQueryReference = this._queryDefinition.getReferenceById(
				recursiveLink.queryReferenceId
			);
			var recursiveRow = this._getParentTreeRowByQueryItemRefId(
				recursiveQueryReference.childRefId,
				parentTreeRow
			);
			if (recursiveRow) {
				var ref = this._viewDefinition.createTreeRowReference(
					parentTreeRow.refId,
					recursiveRow.refId,
					recursiveLink.sortOrder
				);
				ref.isRecursiveRef = true;
				parentTreeRow.hasRecursionLink = true;
				parentTreeRow.recursionOn = recursiveRow.refId;
			}
		};
		TreeGridMapper.prototype._getParentExistNode = function (currentNode) {
			while (currentNode) {
				var parentNode = this._currentBranch.getParentNode(currentNode.id);
				if (parentNode && !parentNode.isCandidate) {
					return parentNode;
				}
				currentNode = parentNode;
			}
		};
		TreeGridMapper.prototype._getParentTreeRowDefinition = function (
			graphNodeId
		) {
			while (true) {
				var parentLink = this._currentBranch.getLinkByChildNode(graphNodeId);
				if (!parentLink) {
					break;
				} else {
					var parentNode = this._currentBranch.getNodeById(
						parentLink.parentNodeId
					);
					if (parentNode) {
						if (parentNode.treeRowRefId) {
							return this._viewDefinition.getTreeRowByRefId(
								parentNode.treeRowRefId
							);
						} else {
							graphNodeId = parentNode.id;
						}
					} else {
						break;
					}
				}
			}
		};
		TreeGridMapper.prototype._mapNodeBetween = function (
			parentTreeRow,
			childTreeRows,
			graphNode,
			branch
		) {
			var newNode = this._viewDefinition.createTreeRowDefinition(
				graphNode.queryItemRefId
			);
			graphNode.treeRowRefId = newNode.refId;
			var parentNode = this._getParentExistNode(graphNode);
			this._reorderNodes(parentNode, branch, graphNode, newNode, parentTreeRow);
			var childSortOrder = 128;
			for (var i = 0; i < childTreeRows.length; i++) {
				var reference = this._viewDefinition.getTreeRowReference(
					parentTreeRow.refId,
					childTreeRows[i].refId
				);
				if (reference && reference.parentRefId === parentTreeRow.refId) {
					var newChildReference = this._viewDefinition.createTreeRowReference(
						newNode.refId,
						childTreeRows[i].refId,
						childSortOrder
					);
					if (reference.isRecursiveRef) {
						newChildReference.isRecursiveRef = true;
						newNode.hasRecursionLink = true;
						newNode.recursionOn = parentTreeRow.recursionOn;
						parentTreeRow.recursionOn = undefined;
						parentTreeRow.hasRecursionLink = false;
					}
					this._viewDefinition.removeTreeRowReference(reference.id);
					childSortOrder += 128;
				}
			}
		};
		TreeGridMapper.prototype._getChildTreeRows = function (graphNodeId) {
			var childRows = [];
			var childLinks = this._currentBranch.getChildLinks(graphNodeId);
			for (var i = 0; i < childLinks.length; i++) {
				var childNode = this._currentBranch.getNodeById(
					childLinks[i].childNodeId
				);
				if (childNode) {
					if (!childNode.isCandidate) {
						var treeRowDef = this._viewDefinition.getTreeRowByRefId(
							childNode.treeRowRefId
						);
						if (treeRowDef) {
							childRows.push(treeRowDef);
						}
					} else {
						var lowLevelChildRows = this._getChildTreeRows(childNode.id);
						childRows = childRows.concat(lowLevelChildRows);
					}
				}
			}
			return childRows;
		};
		TreeGridMapper.prototype._mapNodeAfter = function (
			childTreeRows,
			graphNode,
			branch
		) {
			var newTreeRow = this._viewDefinition.createTreeRowDefinition(
				graphNode.queryItemRefId
			);
			graphNode.treeRowRefId = newTreeRow.refId;
			var sortOrder = 128;
			for (var i = 0; i < childTreeRows.length; i++) {
				var rootReference = this._viewDefinition.getReferenceByChild(
					childTreeRows[i].refId
				);
				this._viewDefinition.removeTreeRowReference(rootReference.id);
				this._viewDefinition.createTreeRowReference(
					newTreeRow.refId,
					childTreeRows[i].refId,
					sortOrder
				);
				sortOrder += 128;
			}
			this._createRootReference(newTreeRow, graphNode, branch);
		};
		TreeGridMapper.prototype._createRootReference = function (
			newTreeRow,
			graphNode,
			branch
		) {
			var rootQueryItem = this._queryDefinition.getRootQueryItem();
			if (rootQueryItem.refId !== newTreeRow.queryItemRefId) {
				this._reorderRootRows(branch, graphNode, newTreeRow);
			} else {
				// newNode connect with Root Query Item
				this._viewDefinition.createTreeRowReference(
					undefined,
					newTreeRow.refId,
					128
				);
			}
		};
		TreeGridMapper.prototype._reorderRootRows = function (
			branch,
			mappedNode,
			newTreeRow
		) {
			var rootNode = branch.getRootNode();
			this._reorderNodes(rootNode, branch, mappedNode, newTreeRow, undefined);
		};
		TreeGridMapper.prototype._reorderNodes = function (
			rootNode,
			branch,
			mappedNode,
			newTreeRow,
			parentTreeRow
		) {
			var lastSortOrder = 0;
			var mappedNodeWasFound = false;
			var self = this;
			function recursion(parentNode) {
				var childNodes = branch.getChildNodes(parentNode);
				for (var i = 0; i < childNodes.length; i++) {
					if (childNodes[i].id === mappedNode.id) {
						lastSortOrder += 128;
						self._viewDefinition.createTreeRowReference(
							parentTreeRow ? parentTreeRow.refId : undefined,
							newTreeRow.refId,
							lastSortOrder
						);
						mappedNodeWasFound = true;
						continue;
					}
					if (childNodes[i].isCandidate) {
						recursion(childNodes[i]);
					} else {
						var rowReference;
						if (mappedNodeWasFound) {
							rowReference = self._viewDefinition.getReferenceByChild(
								childNodes[i].treeRowRefId
							);
							lastSortOrder += 128;
							rowReference.viewOrder = lastSortOrder;
							self._viewDefinition.updateTreeRowReference(rowReference);
						} else {
							lastSortOrder += 128;
						}
					}
				}
			}
			recursion(rootNode);
		};
		TreeGridMapper.prototype._getParentTreeRowByQueryItemRefId = function (
			queryItemRefId,
			startRow
		) {
			while (true) {
				if (startRow.queryItemRefId === queryItemRefId) {
					return startRow;
				} else {
					startRow = this._viewDefinition.getParentRowDefinition(
						startRow.refId
					);
					if (!startRow) {
						break;
					}
				}
			}
		};
		TreeGridMapper.prototype.unmapTreeRow = function (graphNodeId) {
			if (graphNodeId) {
				var graphNode = this._currentBranch.getNodeById(graphNodeId);
				var rootNode = this._currentBranch.getRootNode();
				this._removeRecursionIfExist(graphNode);
				if (graphNode === rootNode) {
					this._unmapRootTreeRow(graphNode);
					return;
				}
				if (graphNode.isRecursiveNode) {
					this._unmapRecursiveNode(graphNode);
				} else {
					var parentTreeRow = this._viewDefinition.getParentRowDefinition(
						graphNode.treeRowRefId
					);
					var unmapedRowHasChildren =
						this._viewDefinition.getChildRowReferences(graphNode.treeRowRefId)
							.length > 0;
					if (parentTreeRow && unmapedRowHasChildren) {
						var childReferences = this._viewDefinition.getChildRowReferences(
							parentTreeRow.refId
						);
						this._unmapNodeBetween(parentTreeRow, graphNode, childReferences);
					}
					if (parentTreeRow && !unmapedRowHasChildren) {
						this._removeTreeRow(graphNode.treeRowRefId);
						this._reorderTreeRows(parentTreeRow);
					}
					if (!parentTreeRow && unmapedRowHasChildren) {
						var rootReferences = this._viewDefinition.getRootReferences();
						this._unmapNodeBetween(parentTreeRow, graphNode, rootReferences);
					}
					if (!parentTreeRow && !unmapedRowHasChildren) {
						this._removeTreeRow(graphNode.treeRowRefId);
						this._reorderTreeRows(parentTreeRow);
					}
				}
			}
		};
		TreeGridMapper.prototype._reorderTreeRows = function (parentTreeRow) {
			var childRowReferences;
			if (parentTreeRow) {
				childRowReferences = this._viewDefinition.getChildRowReferences(
					parentTreeRow.refId
				);
			} else {
				childRowReferences = this._viewDefinition.getRootReferences();
			}
			var sortOrder = 128;
			for (var i = 0; i < childRowReferences.length; i++) {
				var reference = childRowReferences[i];
				if (reference.viewOrder !== sortOrder) {
					reference.viewOrder = sortOrder;
					this._viewDefinition.updateTreeRowReference(reference);
				}
				sortOrder += 128;
			}
		};
		TreeGridMapper.prototype._removeRecursionIfExist = function (graphNode) {
			if (!graphNode.isRecursiveNode) {
				var recursiveRefArray = this._viewDefinition.getRecursiveReferenceOn(
					graphNode.treeRowRefId
				);
				for (var i = 0; i < recursiveRefArray.length; i++) {
					var recursiveRef = recursiveRefArray[i];
					var recursiveRow = this._viewDefinition.getTreeRowByRefId(
						recursiveRef.parentRefId
					);
					recursiveRow.hasRecursionLink = false;
					recursiveRow.recursionOn = null;
					this._viewDefinition.removeTreeRowReference(recursiveRef.id);
					this._reorderTreeRows(recursiveRow);
				}
			}
		};
		TreeGridMapper.prototype._unmapRootTreeRow = function (graphNode) {
			var childrenOfRoot = this._viewDefinition.getChildRowReferences(
				graphNode.treeRowRefId
			);
			for (var i = 0; i < childrenOfRoot.length; i++) {
				childrenOfRoot[i].parentRefId = undefined;
				this._viewDefinition.updateTreeRowReference(childrenOfRoot[i]);
			}
			this._removeTreeRow(graphNode.treeRowRefId);
		};
		TreeGridMapper.prototype._removeTreeRow = function (treeRowRefId) {
			var treeRow = this._viewDefinition.getTreeRowByRefId(treeRowRefId);
			var parentReference = this._viewDefinition.getReferenceByChild(
				treeRow.refId
			);
			this._viewDefinition.removeTreeRowReference(parentReference.id);
			this._viewDefinition.removeTreeRowDefinition(treeRow.id);
		};
		TreeGridMapper.prototype._unmapRecursiveNode = function (graphNode) {
			var parentTreeRow = this._getParentTreeRowDefinition(graphNode.id);
			if (parentTreeRow && parentTreeRow.hasRecursionLink) {
				var recursiveRef = this._viewDefinition.getRecursiveReferenceFrom(
					parentTreeRow.refId
				);
				if (recursiveRef) {
					parentTreeRow.hasRecursionLink = false;
					parentTreeRow.recursionOn = null;
					this._viewDefinition.removeTreeRowReference(recursiveRef.id);
				}
				this._reorderTreeRows(parentTreeRow);
			}
		};
		TreeGridMapper.prototype._unmapNodeBetween = function (
			parentTreeRow,
			unmapNode,
			childReferences
		) {
			var lastSortOrder = 0;
			var unmappedNodeWasFound = false;
			for (var k = 0; k < childReferences.length; k++) {
				if (childReferences[k].childRefId === unmapNode.treeRowRefId) {
					lastSortOrder = this._updateChildRows(
						unmapNode.treeRowRefId,
						lastSortOrder,
						parentTreeRow
					);
					var unmappedTreeRow = this._viewDefinition.getTreeRowByRefId(
						unmapNode.treeRowRefId
					);
					if (unmappedTreeRow.hasRecursionLink) {
						parentTreeRow.hasRecursionLink = true;
						parentTreeRow.recursionOn = unmappedTreeRow.recursionOn;
					}
					this._viewDefinition.removeTreeRowReference(childReferences[k].id);
					this._viewDefinition.removeTreeRowDefinition(unmappedTreeRow.id);
					unmappedNodeWasFound = true;
					continue;
				} else {
					lastSortOrder += 128;
					if (unmappedNodeWasFound) {
						childReferences[k].parentRefId = parentTreeRow
							? parentTreeRow.refId
							: undefined;
						childReferences[k].viewOrder = lastSortOrder;
						this._viewDefinition.updateTreeRowReference(childReferences[k]);
					}
				}
			}
		};
		TreeGridMapper.prototype._updateChildRows = function (
			parentRowRefId,
			lastSortOrder,
			rootTreeRow
		) {
			var childrenOfUnmappedRow = this._viewDefinition.getChildRowReferences(
				parentRowRefId
			);
			for (var m = 0; m < childrenOfUnmappedRow.length; m++) {
				lastSortOrder += 128;
				childrenOfUnmappedRow[m].parentRefId = rootTreeRow
					? rootTreeRow.refId
					: undefined;
				childrenOfUnmappedRow[m].viewOrder = lastSortOrder;
				var existedRecursiveReference = this._viewDefinition.getRecursiveReference(
					childrenOfUnmappedRow[m].parentRefId,
					childrenOfUnmappedRow[m].childRefId
				);
				if (existedRecursiveReference) {
					this._viewDefinition.removeTreeRowReference(
						childrenOfUnmappedRow[m].id
					);
				} else {
					this._viewDefinition.updateTreeRowReference(childrenOfUnmappedRow[m]);
				}
			}
			return lastSortOrder;
		};
		return TreeGridMapper;
	})();
	return TreeGridMapper;
});
