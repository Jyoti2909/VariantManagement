define(function () {
	'use strict';
	var GraphNode = (function () {
		function GraphNode() {}
		Object.defineProperty(GraphNode.prototype, 'recursionNodeMapped', {
			get: function () {
				return this._recursionNodeMapped;
			},
			set: function (recursionNodeMapped) {
				this._recursionNodeMapped = recursionNodeMapped;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'isCandidate', {
			get: function () {
				if (this._isRecursiveNode) {
					if (this._recursionNodeMapped) {
						return false;
					} else {
						return true;
					}
				} else {
					return !this.treeRowRefId;
				}
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'isGroup', {
			get: function () {
				return this.treeRowRefId && !this.queryItemRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'id', {
			get: function () {
				return this._id;
			},
			set: function (id) {
				this._id = id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'uniqueIdentificator', {
			get: function () {
				return this._uniqueIdentificator;
			},
			set: function (id) {
				this._uniqueIdentificator = id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'treeRowRefId', {
			get: function () {
				return this._treeRowRefId;
			},
			set: function (treeRowRefId) {
				this._treeRowRefId = treeRowRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'queryItemRefId', {
			get: function () {
				return this._queryItemRefId;
			},
			set: function (queryItemRefId) {
				this._queryItemRefId = queryItemRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'queryItemAlias', {
			get: function () {
				return this._queryItemAlias;
			},
			set: function (queryItemAlias) {
				this._queryItemAlias = queryItemAlias;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'isRecursiveNode', {
			get: function () {
				return this._isRecursiveNode;
			},
			set: function (isRecursiveNode) {
				this._isRecursiveNode = isRecursiveNode;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'isJoined', {
			get: function () {
				return this._isJoined;
			},
			set: function (isJoined) {
				this._isJoined = isJoined;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'hasMappingErrors', {
			get: function () {
				return this._hasMappingErrors;
			},
			set: function (hasMappingErrors) {
				this._hasMappingErrors = hasMappingErrors;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphNode.prototype, 'validTemplates', {
			get: function () {
				return this._validTemplates;
			},
			set: function (validTemplates) {
				this._validTemplates = validTemplates;
			},
			enumerable: true,
			configurable: true
		});
		return GraphNode;
	})();
	return GraphNode;
});
