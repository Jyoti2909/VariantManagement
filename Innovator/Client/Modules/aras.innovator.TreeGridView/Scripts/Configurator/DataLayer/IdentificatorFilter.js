define(function () {
	'use strict';
	var IdentificatorFilter = (function () {
		function IdentificatorFilter(cryptohashFunction) {
			this._cryptohashFunction = cryptohashFunction;
		}
		IdentificatorFilter.prototype.apply = function (branch) {
			var self = this;
			branch.visit(function (graphNode) {
				self._traversalPerNode(graphNode, branch);
			});
		};
		IdentificatorFilter.prototype._traversalPerNode = function (
			graphNode,
			branch
		) {
			var arr = [];
			var currentUniqueId = graphNode.queryItemRefId
				? graphNode.queryItemRefId
				: graphNode.treeRowRefId;
			var currentHash = this._cryptohashFunction(currentUniqueId).toString();
			var currentNode = graphNode;
			while (true) {
				var parentNode = branch.getParentNode(currentNode.id);
				if (!parentNode) {
					break;
				}
				var uniqueId = parentNode.queryItemRefId
					? parentNode.queryItemRefId
					: parentNode.treeRowRefId;
				var resultString = currentHash + uniqueId;
				currentHash = this._cryptohashFunction(resultString).toString();
				currentNode = parentNode;
			}
			graphNode.uniqueIdentificator = currentHash;
		};
		return IdentificatorFilter;
	})();
	return IdentificatorFilter;
});
