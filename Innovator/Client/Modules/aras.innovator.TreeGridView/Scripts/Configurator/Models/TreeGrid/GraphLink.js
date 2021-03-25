define(function () {
	'use strict';
	var GraphLink = (function () {
		function GraphLink() {}
		Object.defineProperty(GraphLink.prototype, 'parentNodeId', {
			get: function () {
				return this._parentId;
			},
			set: function (parentId) {
				this._parentId = parentId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphLink.prototype, 'childNodeId', {
			get: function () {
				return this._childNodeId;
			},
			set: function (childNodeId) {
				this._childNodeId = childNodeId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphLink.prototype, 'queryReferenceId', {
			get: function () {
				return this._queryReferenceId;
			},
			set: function (queryReferenceId) {
				this._queryReferenceId = queryReferenceId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphLink.prototype, 'isRecursive', {
			get: function () {
				return this._isRecursive;
			},
			set: function (isRecursive) {
				this._isRecursive = isRecursive;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(GraphLink.prototype, 'sortOrder', {
			get: function () {
				return this._sortOrder;
			},
			set: function (sortOrder) {
				this._sortOrder = sortOrder;
			},
			enumerable: true,
			configurable: true
		});
		return GraphLink;
	})();
	return GraphLink;
});
