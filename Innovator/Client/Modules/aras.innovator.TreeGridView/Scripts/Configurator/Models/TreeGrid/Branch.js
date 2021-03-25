define([
	'TreeGridView/Scripts/Configurator/Models/TreeGrid/GraphNode',
	'TreeGridView/Scripts/Configurator/Models/TreeGrid/GraphLink'
], function (GraphNode, GraphLink) {
	'use strict';
	var Branch = (function () {
		function Branch() {
			this._nodes = [];
			this._links = [];
		}
		Branch.prototype.getRootNode = function () {
			function filter(currentNode) {
				return function (obj) {
					return obj.childNodeId === currentNode.id;
				};
			}
			for (var i = 0; i < this._nodes.length; i++) {
				var currentNode = this._nodes[i];
				var resArray = this._links.filter(filter(currentNode));
				if (resArray.length === 0) {
					return currentNode;
				}
			}
		};
		Branch.prototype.getNodeById = function (id) {
			var resArray = this._nodes.filter(function (obj) {
				return obj.id === id;
			});
			if (resArray.length > 0) {
				return resArray[0];
			}
		};
		Branch.prototype.getChildNodes = function (node) {
			if (!node || node.isRecursiveNode) {
				return [];
			}
			var linkArray = this._links.filter(function (obj) {
				return obj.parentNodeId === node.id;
			});
			linkArray.sort(function (a, b) {
				return a.sortOrder - b.sortOrder;
			});
			var res = [];
			for (var i = 0; i < linkArray.length; i++) {
				var childNode = this.getNodeById(linkArray[i].childNodeId);
				res.push(childNode);
			}
			return res;
		};
		Branch.prototype.getRecursiveNodeOn = function (recursiveNodeFrom) {
			var current = recursiveNodeFrom;
			while (true) {
				var parent = this.getParentNode(current.id);
				if (!parent) {
					break;
				}
				if (recursiveNodeFrom.queryItemRefId === parent.queryItemRefId) {
					return parent;
				} else {
					current = parent;
				}
			}
		};
		Branch.prototype.getAllRecursiveNodes = function () {
			return this._nodes.filter(function (obj) {
				return obj.isRecursiveNode;
			});
		};
		Branch.prototype.getParentNode = function (nodeId) {
			var res = this._links.filter(function (obj) {
				return obj.childNodeId === nodeId;
			});
			if (res.length > 0) {
				return this.getNodeById(res[0].parentNodeId);
			}
		};
		Branch.prototype.getRecursiveLink = function (parentNodeId) {
			var res = this._links.filter(function (obj) {
				return obj.isRecursive && obj.childNodeId === parentNodeId;
			});
			if (res.length > 0) {
				return res[0];
			}
		};
		Branch.prototype.getLinkByChildNode = function (childNodeId) {
			var resArray = this._links.filter(function (obj) {
				return obj.childNodeId === childNodeId;
			});
			if (resArray.length > 0) {
				return resArray[0];
			}
		};
		Branch.prototype.getChildLinks = function (parentNodeId) {
			return this._links.filter(function (obj) {
				return obj.parentNodeId === parentNodeId;
			});
		};
		Branch.prototype.getCopyOfNode = function (node) {
			var res = new GraphNode();
			res.id = node.id;
			res.queryItemRefId = node.queryItemRefId;
			res.queryItemAlias = node.queryItemAlias;
			res.treeRowRefId = node.treeRowRefId;
			res.recursionNodeMapped = node.recursionNodeMapped;
			res.isRecursiveNode = node.isRecursiveNode;
			res.isJoined = node.isJoined;
			return res;
		};
		Branch.prototype.getJoinedNodes = function (mainJoinNode) {
			var res = [];
			var self = this;
			function recursion(parentNode) {
				var childNodes = self.getChildNodes(parentNode);
				for (var i = 0; i < childNodes.length; i++) {
					if (childNodes[i].isJoined) {
						res.push(childNodes[i]);
						recursion(childNodes[i]);
					}
				}
			}
			if (mainJoinNode) {
				recursion(mainJoinNode);
			}
			return res;
		};
		Branch.prototype.copyFromBranch = function (
			fromBranch,
			fromNode,
			sourceNode
		) {
			var linkOnFromNode = fromBranch.getLinkByChildNode(fromNode.id);
			if (linkOnFromNode) {
				var link = new GraphLink();
				link.childNodeId = linkOnFromNode.childNodeId;
				link.queryReferenceId = linkOnFromNode.queryReferenceId;
				link.isRecursive = linkOnFromNode.isRecursive;
				link.sortOrder = linkOnFromNode.sortOrder;
				link.parentNodeId = sourceNode.id;
				this._links.push(link);
				var node = this.getCopyOfNode(fromNode);
				this._nodes.push(node);
				var children = fromBranch.getChildNodes(fromNode);
				for (var i = 0; i < children.length; i++) {
					this.copyFromBranch(fromBranch, children[i], node);
				}
			}
		};
		Branch.prototype.getNewOrExistGraphNode = function (
			treeRowRefId,
			queryItemRefId,
			queryItemAlias
		) {
			if (!treeRowRefId) {
				var existNode = this.findNodeByQueryItemRefId(queryItemRefId);
				if (existNode) {
					return existNode;
				} else {
					return this._insertEmptyGraphNode(
						treeRowRefId,
						queryItemRefId,
						queryItemAlias
					);
				}
			}
			var node = this.getNodeByRowRefId(treeRowRefId);
			if (node) {
				return node;
			} else {
				return this._insertEmptyGraphNode(
					treeRowRefId,
					queryItemRefId,
					queryItemAlias
				);
			}
		};
		Branch.prototype.createNewNode = function (
			treeRowRefId,
			queryItemRefId,
			queryItemAlias
		) {
			return this._insertEmptyGraphNode(
				treeRowRefId,
				queryItemRefId,
				queryItemAlias
			);
		};
		Branch.prototype.getNodeByRowRefId = function (treeRowRefId) {
			var array = this._nodes.filter(function (obj) {
				return obj.treeRowRefId === treeRowRefId;
			});
			if (array.length > 0) {
				return array[0];
			}
		};
		Branch.prototype.createRecursiveNode = function (
			treeRowRefId,
			queryItemRefId,
			queryItemAlias
		) {
			var node = this._insertEmptyGraphNode(
				treeRowRefId,
				queryItemRefId,
				queryItemAlias
			);
			node.isRecursiveNode = true;
			return node;
		};
		Branch.prototype.createNode = function (
			treeRowRefId,
			queryItemRefId,
			queryItemAlias
		) {
			return this._insertEmptyGraphNode(
				treeRowRefId,
				queryItemRefId,
				queryItemAlias
			);
		};
		Branch.prototype.findNodeByQueryItemRefId = function (queryItemRefId) {
			var array = this._nodes.filter(function (obj) {
				return obj.queryItemRefId === queryItemRefId;
			});
			if (array.length > 0) {
				return array[0];
			}
		};
		Branch.prototype.getNodeByUniqueIdentificator = function (id) {
			var array = this._nodes.filter(function (obj) {
				return obj.uniqueIdentificator === id;
			});
			if (array.length > 0) {
				return array[0];
			}
		};
		Branch.prototype._insertEmptyGraphNode = function (
			treeRowRefId,
			queryItemRefId,
			queryItemAlias
		) {
			var newNode = new GraphNode();
			newNode.id = aras.generateNewGUID();
			newNode.treeRowRefId = treeRowRefId;
			newNode.queryItemRefId = queryItemRefId;
			newNode.queryItemAlias = queryItemAlias;
			newNode.isJoined = false;
			this._nodes.push(newNode);
			return newNode;
		};
		Branch.prototype.addGraphLink = function (graphLink) {
			this._links.push(graphLink);
		};
		Branch.prototype.visit = function (visitor) {
			var rootNode = this.getRootNode();
			if (rootNode) {
				visitor(rootNode);
				this._traverseBranch(rootNode, visitor);
			}
		};
		Branch.prototype._traverseBranch = function (rootNode, visitor) {
			var _this = this;
			var childNodes = this.getChildNodes(rootNode);
			childNodes.forEach(function (node) {
				visitor(node);
				_this._traverseBranch(node, visitor);
			});
		};
		return Branch;
	})();
	return Branch;
});
