define([
	'TreeGridView/Scripts/Configurator/Models/TreeGrid/Branch',
	'TreeGridView/Scripts/Configurator/Models/TreeGrid/GraphLink',
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/ReferenceTypeEnum'
], function (Branch, GraphLink, REFERENCE_TYPE_ENUM) {
	'use strict';
	var BranchBuilder = (function () {
		function BranchBuilder(viewDefinition, queryDefinition) {
			this._queryDefinition = queryDefinition;
			this._viewDefinition = viewDefinition;
		}
		/** Method return all existing branches based on current TreeGridViewDefinition. */
		BranchBuilder.prototype.getExistingBranches = function () {
			var res = [];
			var rootQueryItem = this._queryDefinition.getRootQueryItem();
			var lowLevelRowReferences = this._viewDefinition.getLowLevelReferences();
			for (var i = 0; i < lowLevelRowReferences.length; i++) {
				var currentBranch = new Branch();
				var lowLevelTreeRowReference = lowLevelRowReferences[i];
				this._createBranchFromLowLevelRow(
					lowLevelTreeRowReference,
					rootQueryItem,
					currentBranch
				);
				var lowLevelTreeRow = this._viewDefinition.getTreeRowByRefId(
					lowLevelTreeRowReference.childRefId
				);
				if (lowLevelTreeRow.hasRecursionLink) {
					this._addRecursiveGraphNode(lowLevelTreeRow, currentBranch);
				}
				res.push(currentBranch);
			}
			/** Create branches which consist of only one row */
			var branchesWithoutReferences = this._createBranchesForRowsWithoutReferences(
				rootQueryItem
			);
			res = res.concat(branchesWithoutReferences);
			return res;
		};
		BranchBuilder.prototype._createBranchesForRowsWithoutReferences = function (
			rootQueryItem
		) {
			var res = [];
			var rootRows = this._viewDefinition.getRootTreeRows();
			for (var j = 0; j < rootRows.length; j++) {
				var currentRow = rootRows[j];
				var children = this._viewDefinition.getChildrenTreeRow(currentRow);
				if (children.length > 0 && !currentRow.hasRecursionLink) {
					continue;
				}
				var rootBranch = new Branch();
				if (currentRow.isGroup) {
					this._fillBranchBetweenGroupAndCandidate(
						currentRow,
						rootQueryItem,
						rootBranch
					);
				} else {
					if (currentRow.queryItemRefId === rootQueryItem.refId) {
						// row without reference is root of Query Definition, so no need to create candidates
						rootBranch.createNewNode(
							currentRow.refId,
							rootQueryItem.refId,
							rootQueryItem.alias
						);
					} else {
						// row without reference is row on some child level of the QueryDefinition tree
						var childQueryItem = this._queryDefinition.getQueryItem(
							currentRow.queryItemRefId
						);
						this._fillBranchFromChildToRootCandidate(
							childQueryItem,
							rootQueryItem,
							rootBranch,
							currentRow
						);
					}
				}
				if (currentRow.hasRecursionLink) {
					this._addRecursiveGraphNode(currentRow, rootBranch);
				}
				res.push(rootBranch);
			}
			return res;
		};
		BranchBuilder.prototype._fillBranchBetweenGroupAndCandidate = function (
			currentRow,
			rootQueryItem,
			rootBranch
		) {
			var link = new GraphLink();
			var groupNode = rootBranch.createNewNode(
				currentRow.refId,
				undefined,
				undefined
			);
			groupNode.isJoined = false;
			var rootNode = rootBranch.createNewNode(
				undefined,
				rootQueryItem.refId,
				rootQueryItem.alias
			);
			link.childNodeId = groupNode.id;
			link.parentNodeId = rootNode.id;
			var reference = this._viewDefinition.getReferenceByChild(
				currentRow.refId
			);
			link.sortOrder = reference.viewOrder;
			rootBranch.addGraphLink(link);
		};
		BranchBuilder.prototype._createBranchFromLowLevelRow = function (
			treeRowReference,
			rootQueryItem,
			branch
		) {
			while (true) {
				var childTreeRow = this._viewDefinition.getTreeRowByRefId(
					treeRowReference.childRefId
				);
				var parentTreeRow = this._viewDefinition.getTreeRowByRefId(
					treeRowReference.parentRefId
				);
				this._fillBranchBetweenRows(
					branch,
					treeRowReference,
					childTreeRow,
					parentTreeRow
				);
				var parentRowReference = this._viewDefinition.getReferenceByChild(
					parentTreeRow.refId
				);
				if (!parentRowReference || !parentRowReference.parentRefId) {
					if (!parentTreeRow.isGroup) {
						// create candidates between exist root row and root Query Item
						var childQueryItem = this._queryDefinition.getQueryItem(
							parentTreeRow.queryItemRefId
						);
						if (childQueryItem.refId !== rootQueryItem.refId) {
							this._fillBranchFromChildToRootCandidate(
								childQueryItem,
								rootQueryItem,
								branch,
								parentTreeRow
							);
						}
					} else {
						this._fillBranchToRootFromGroupNode(
							parentTreeRow,
							rootQueryItem,
							branch
						);
					}
					break;
				}
				treeRowReference = parentRowReference;
			}
		};
		BranchBuilder.prototype._addRecursiveGraphNode = function (
			lowLevelTreeRow,
			currentBranch
		) {
			var recursionStartNode = this._viewDefinition.getTreeRowByRefId(
				lowLevelTreeRow.recursionOn
			);
			if (!recursionStartNode || !recursionStartNode.queryItemRefId) {
				return;
			}
			var recQueryReferences = this._queryDefinition.getRecursiveReferences(
				recursionStartNode.queryItemRefId
			);
			for (let i = 0; i < recQueryReferences.length; i++) {
				const recQueryReference = recQueryReferences[i];
				var link = new GraphLink();
				link.queryReferenceId = recQueryReference.id;
				var lowLevelQueryItem = this._queryDefinition.getQueryItem(
					recQueryReference.parentRefId
				);
				this._fillBranchFromCandidateToRow(
					currentBranch,
					lowLevelTreeRow,
					lowLevelQueryItem
				);
				var parentGraphNode = currentBranch.findNodeByQueryItemRefId(
					recQueryReference.parentRefId
				);
				if (parentGraphNode) {
					var recursiveRowReference = this._viewDefinition.getRecursiveReference(
						lowLevelTreeRow.refId,
						lowLevelTreeRow.recursionOn
					);
					var childQI = this._queryDefinition.getQueryItem(
						recQueryReference.childRefId
					);
					var childGraphNode = currentBranch.createRecursiveNode(
						lowLevelTreeRow.recursionOn,
						childQI.refId,
						childQI.alias
					);
					childGraphNode.recursionNodeMapped = true;
					childGraphNode.isRecursiveNode = true;
					childGraphNode.isJoined = recursiveRowReference
						? recursiveRowReference.referenceType === REFERENCE_TYPE_ENUM.JOIN
						: false;
					link.childNodeId = childGraphNode.id;
					link.parentNodeId = parentGraphNode.id;
					link.isRecursive = true;
					link.sortOrder = this._getSortOrderForReference(recQueryReference);
					currentBranch.addGraphLink(link);
				}
			}
		};
		/** Fill branch from existing child TreeRow to RootTreeRow using candidates. */
		BranchBuilder.prototype._fillBranchFromChildToRootCandidate = function (
			childQueryItem,
			rootQueryItem,
			currentBranch,
			childTreeRow
		) {
			var childQueryReference = this._queryDefinition.getReferenceByChildRefId(
				childQueryItem.refId
			);
			var pathFromChildToParent = this._getPathFromChildToParentQueryItem(
				childQueryReference,
				rootQueryItem.refId
			);
			for (var i = 0; i < pathFromChildToParent.length; i++) {
				var curQueryReference = pathFromChildToParent[i];
				var sortOrder = curQueryReference.sortOrder;
				if (curQueryReference === childQueryReference) {
					// parent node is candidate
					var reference = this._viewDefinition.getReferenceByChild(
						childTreeRow.refId
					);
					this._fillBranchBetweenTwoNodes({
						branch: currentBranch,
						queryRef: curQueryReference,
						parentRowRefId: undefined,
						childRowRefId: childTreeRow.refId,
						sortOrder: this._getSortOrderForReference(curQueryReference),
						isJoined: false
					});
				} else {
					// two nodes are candidates
					this._fillBranchBetweenTwoNodes({
						branch: currentBranch,
						queryRef: curQueryReference,
						parentRowRefId: undefined,
						childRowRefId: undefined,
						sortOrder: this._getSortOrderForReference(curQueryReference),
						isJoined: false
					});
				}
			}
		};
		BranchBuilder.prototype._fillBranchBetweenRows = function (
			branch,
			childRowReference,
			childRow,
			parentRow
		) {
			if (!childRow.isGroup && !parentRow.isGroup) {
				var childQueryItem = this._queryDefinition.getQueryItem(
					childRow.queryItemRefId
				);
				var parentQueryItem = this._findParentQueryItem(
					childQueryItem,
					parentRow.queryItemRefId
				);
				if (childQueryItem) {
					// if valid treeRow
					var childQueryReference = this._queryDefinition.getReferenceByChildRefId(
						childQueryItem.refId
					);
					var pathFromChildToParent = this._getPathFromChildToParentQueryItem(
						childQueryReference,
						parentQueryItem.refId
					);
					this._fillBranchFromChildToParentRow(
						pathFromChildToParent,
						branch,
						childRow,
						parentRow,
						childRowReference
					);
				}
			} else {
				this._fillBranchWithGroupRow(
					branch,
					childRowReference,
					parentRow,
					childRow
				);
			}
		};
		BranchBuilder.prototype._fillBranchFromCandidateToRow = function (
			branch,
			parentRow,
			childQueryItem
		) {
			var parentQueryItem = this._findParentQueryItem(
				childQueryItem,
				parentRow.queryItemRefId
			);
			if (
				parentQueryItem &&
				childQueryItem &&
				childQueryItem !== parentQueryItem
			) {
				var childQueryReference = this._queryDefinition.getReferenceByChildRefId(
					childQueryItem.refId
				);
				var pathFromChildToParent = this._getPathFromChildToParentQueryItem(
					childQueryReference,
					parentQueryItem.refId
				);
				this._fillBranchFromChildToParentRow(
					pathFromChildToParent,
					branch,
					undefined,
					parentRow,
					undefined
				);
			}
		};
		/** Fill branch with candidates between 2 exist row (child and parent) using "pathToParentRow" */
		BranchBuilder.prototype._fillBranchFromChildToParentRow = function (
			pathToParent,
			branch,
			childRow,
			parentRow,
			childRowReference
		) {
			for (var i = 0; i < pathToParent.length; i++) {
				var curQueryReference = pathToParent[i];
				if (childRow) {
					// if we don't have candidates between two nodes
					if (
						curQueryReference.parentRefId === parentRow.queryItemRefId &&
						curQueryReference.childRefId === childRow.queryItemRefId
					) {
						this._fillBranchBetweenTwoNodes({
							branch: branch,
							queryRef: curQueryReference,
							parentRowRefId: childRowReference.parentRefId,
							childRowRefId: childRowReference.childRefId,
							sortOrder: this._getSortOrderForReference(curQueryReference),
							isJoined:
								childRowReference.referenceType === REFERENCE_TYPE_ENUM.JOIN
						});
						continue;
					}
					// if parent row is candidate and child row exist
					if (curQueryReference.childRefId === childRow.queryItemRefId) {
						this._fillBranchBetweenTwoNodes({
							branch: branch,
							queryRef: curQueryReference,
							parentRowRefId: undefined,
							childRowRefId: childRow.refId,
							sortOrder: this._getSortOrderForReference(curQueryReference),
							isJoined: false // we don't support join between candidates
						});
						continue;
					}
				}
				// if child row is candidate and parent row exist
				if (curQueryReference.parentRefId === parentRow.queryItemRefId) {
					this._fillBranchBetweenTwoNodes({
						branch: branch,
						queryRef: curQueryReference,
						parentRowRefId: parentRow.refId,
						childRowRefId: undefined,
						sortOrder: this._getSortOrderForReference(curQueryReference),
						isJoined: false // we don't support join between candidates
					});
					continue;
				}
				// if parent row is candidate and child row is candidate
				this._fillBranchBetweenTwoNodes({
					branch: branch,
					queryRef: curQueryReference,
					parentRowRefId: undefined,
					childRowRefId: undefined,
					sortOrder: this._getSortOrderForReference(curQueryReference),
					isJoined: false
				});
			}
		};
		BranchBuilder.prototype._getSortOrderForReference = function (
			queryReference
		) {
			if (queryReference.parentRefId) {
				var childReferences = this._queryDefinition.getChildReferences(
					queryReference.parentRefId
				);
				var sortOrder = 128;
				for (var i = 0; i < childReferences.length; i++) {
					if (childReferences[i].id === queryReference.id) {
						return sortOrder;
					} else {
						sortOrder += 128;
					}
				}
			}
		};
		BranchBuilder.prototype._fillBranchToRootFromGroupNode = function (
			parentTreeRow,
			rootQueryItem,
			branch
		) {
			var link = new GraphLink();
			var parentGraphNode = branch.getNewOrExistGraphNode(
				undefined,
				rootQueryItem.refId,
				rootQueryItem.alias
			);
			var childGraphNode = branch.getNewOrExistGraphNode(
				parentTreeRow.refId,
				undefined,
				undefined
			);
			childGraphNode.isJoined = false;
			link.childNodeId = childGraphNode.id;
			link.parentNodeId = parentGraphNode.id;
			link.sortOrder = this._getSortOrderForGroup(parentTreeRow);
			branch.addGraphLink(link);
		};
		/** Return array of QueryReferences which represent path from Parent to Child Query Item */
		BranchBuilder.prototype._getPathFromChildToParentQueryItem = function (
			childReference,
			parentQueryItemRefId
		) {
			var res = [];
			if (childReference) {
				res.push(childReference);
				var currentReference = childReference;
				while (currentReference.parentRefId !== parentQueryItemRefId) {
					var parentReference = this._queryDefinition.getReferenceByChildRefId(
						currentReference.parentRefId
					);
					if (parentReference) {
						res.push(parentReference);
						currentReference = parentReference;
					} else {
						break;
					}
				}
			}
			return res.reverse();
		};
		BranchBuilder.prototype._fillBranchBetweenTwoNodes = function (context) {
			var link = new GraphLink();
			link.queryReferenceId = context.queryRef.id;
			var parentQI = this._queryDefinition.getQueryItem(
				context.queryRef.parentRefId
			);
			var parentGraphNode = context.branch.getNewOrExistGraphNode(
				context.parentRowRefId,
				context.queryRef.parentRefId,
				parentQI.alias
			);
			var childQI = this._queryDefinition.getQueryItem(
				context.queryRef.childRefId
			);
			var childGraphNode = context.branch.getNewOrExistGraphNode(
				context.childRowRefId,
				context.queryRef.childRefId,
				childQI.alias
			);
			childGraphNode.isJoined = context.isJoined;
			link.childNodeId = childGraphNode.id;
			link.parentNodeId = parentGraphNode.id;
			link.sortOrder = context.sortOrder;
			context.branch.addGraphLink(link);
		};
		BranchBuilder.prototype._fillBranchWithGroupRow = function (
			branch,
			rowReference,
			parentRow,
			childRow
		) {
			if (parentRow.isGroup && !childRow.isGroup) {
				this._fillBranchFromNodeToGroup(
					parentRow,
					childRow,
					branch,
					rowReference
				);
			} else {
				var parentGraphNode;
				if (!parentRow.isGroup && childRow.isGroup) {
					// we don't support candidates between group and parent node, so no need to find candidates
					var parentQI = this._queryDefinition.getQueryItem(
						parentRow.queryItemRefId
					);
					parentGraphNode = branch.getNewOrExistGraphNode(
						rowReference.parentRefId,
						parentQI.refId,
						parentQI.alias
					);
				} else {
					// if parentRow is group node and childRow is group node too
					parentGraphNode = branch.getNewOrExistGraphNode(
						rowReference.parentRefId,
						undefined,
						undefined
					);
				}
				var link = new GraphLink();
				var childGraphNode = branch.getNewOrExistGraphNode(
					rowReference.childRefId,
					undefined,
					undefined
				);
				childGraphNode.isJoined = false;
				link.childNodeId = childGraphNode.id;
				link.parentNodeId = parentGraphNode.id;
				link.sortOrder = rowReference.viewOrder;
				branch.addGraphLink(link);
			}
		};
		BranchBuilder.prototype._getSortOrderForGroup = function (parentTreeRow) {
			var sortOrder = 128;
			var childNonGroupRow = this._getChildNonGroupRow(parentTreeRow);
			if (childNonGroupRow) {
				var rowRef = this._viewDefinition.getReferenceByChild(
					childNonGroupRow.refId
				);
				if (rowRef) {
					sortOrder = rowRef.viewOrder;
				}
			}
			return sortOrder;
		};
		BranchBuilder.prototype._fillBranchFromNodeToGroup = function (
			groupTreeRow,
			childTreeRow,
			branch,
			rowReference
		) {
			var parentNonGroupRow = this._getParentNonGroupTreeRow(groupTreeRow);
			if (parentNonGroupRow) {
				var childReference = this._queryDefinition.getReferenceByChildRefId(
					childTreeRow.queryItemRefId
				);
				var pathToParent = this._getPathFromChildToParentQueryItem(
					childReference,
					parentNonGroupRow.queryItemRefId
				);
				this._fillBranchFromNodeToGroupByPath(
					pathToParent,
					branch,
					childTreeRow,
					groupTreeRow
				);
			} else {
				// if we have root group node
				var link = new GraphLink();
				var parentGraphNode = branch.getNewOrExistGraphNode(
					groupTreeRow.refId,
					undefined,
					undefined
				);
				var childQI = this._queryDefinition.getQueryItem(
					childTreeRow.queryItemRefId
				);
				var childGraphNode = branch.getNewOrExistGraphNode(
					childTreeRow.refId,
					childQI.refId,
					childQI.alias
				);
				childGraphNode.isJoined = false;
				link.childNodeId = childGraphNode.id;
				link.parentNodeId = parentGraphNode.id;
				link.sortOrder = rowReference.viewOrder;
				branch.addGraphLink(link);
			}
		};
		BranchBuilder.prototype._getChildNonGroupRow = function (treeRow) {
			var childrenRows = this._viewDefinition.getChildrenTreeRow(treeRow);
			for (var i = 0; i < childrenRows.length; i++) {
				if (childrenRows[i].queryItemRefId) {
					return childrenRows[i];
				}
			}
			for (var j = 0; j < childrenRows.length; j++) {
				var childRow = this._getChildNonGroupRow(childrenRows[j]);
				if (childRow) {
					return childRow;
				}
			}
		};
		BranchBuilder.prototype._getParentNonGroupTreeRow = function (
			groupTreeRow
		) {
			var currentTreeRow = groupTreeRow;
			while (true) {
				var parentTreeRow = this._viewDefinition.getParentRowDefinition(
					currentTreeRow.refId
				);
				if (parentTreeRow) {
					if (parentTreeRow.queryItemRefId) {
						return parentTreeRow;
					} else {
						currentTreeRow = parentTreeRow;
					}
				} else {
					break;
				}
			}
		};
		/** Fill branch with candidates between parent Group TreeRow and child TreeRow using "pathToParentRow" */
		BranchBuilder.prototype._fillBranchFromNodeToGroupByPath = function (
			pathToParent,
			branch,
			childRow,
			groupTreeRow
		) {
			var lowLevelQI = this._queryDefinition.getQueryItem(
				childRow.queryItemRefId
			);
			var lowLevelNode = branch.getNewOrExistGraphNode(
				childRow.refId,
				lowLevelQI.refId,
				lowLevelQI.alias
			);
			for (var i = 0; i < pathToParent.length; i++) {
				var curQueryReference = pathToParent[i];
				var link = new GraphLink();
				var parentGraphNode;
				if (i === 0) {
					parentGraphNode = branch.getNewOrExistGraphNode(
						groupTreeRow.refId,
						undefined,
						undefined
					);
				} else {
					parentGraphNode = branch.getNewOrExistGraphNode(
						undefined,
						curQueryReference.parentRefId,
						undefined
					);
				}
				var childQI = this._queryDefinition.getQueryItem(
					curQueryReference.childRefId
				);
				var childGraphNode = branch.getNewOrExistGraphNode(
					undefined,
					childQI.refId,
					childQI.alias
				);
				childGraphNode.isJoined = false; // we don't support join with candidates
				link.childNodeId = childGraphNode.id;
				link.parentNodeId = parentGraphNode.id;
				link.queryReferenceId = curQueryReference.id;
				link.sortOrder = curQueryReference.sortOrder;
				branch.addGraphLink(link);
			}
		};
		BranchBuilder.prototype._findParentQueryItem = function (
			queryItem,
			queryItemRefId
		) {
			var currentQueryItem = queryItem;
			while (currentQueryItem) {
				if (currentQueryItem.refId === queryItemRefId) {
					return currentQueryItem;
				}
				currentQueryItem = this._queryDefinition.getParentQueryItem(
					currentQueryItem.refId
				);
			}
		};
		return BranchBuilder;
	})();
	return BranchBuilder;
});
