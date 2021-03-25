define(function () {
	'use strict';
	var TreeRowDefinition = (function () {
		function TreeRowDefinition(item) {
			if (!item) {
				return;
			}
			this._id = item.getAttribute('id');
			this._refId = item.getProperty('ref_id');
			this._queryItemRefId = item.getProperty('query_item_ref_id');
		}
		Object.defineProperty(TreeRowDefinition.prototype, 'id', {
			get: function () {
				return this._id;
			},
			set: function (id) {
				this._id = id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowDefinition.prototype, 'queryItemRefId', {
			get: function () {
				return this._queryItemRefId;
			},
			set: function (queryItemRefId) {
				this._queryItemRefId = queryItemRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowDefinition.prototype, 'refId', {
			get: function () {
				return this._refId;
			},
			set: function (refId) {
				this._refId = refId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowDefinition.prototype, 'hasRecursionLink', {
			get: function () {
				return this._hasRecursionLink;
			},
			set: function (hasRecursion) {
				this._hasRecursionLink = hasRecursion;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowDefinition.prototype, 'recursionOn', {
			get: function () {
				return this._recursionOn;
			},
			set: function (recursionOn) {
				this._recursionOn = recursionOn;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowDefinition.prototype, 'isGroup', {
			get: function () {
				return this.queryItemRefId ? false : true;
			},
			enumerable: true,
			configurable: true
		});
		TreeRowDefinition.prototype.serializeToItem = function (item) {
			if (item) {
				item.setAttribute('id', this._id);
				item.setProperty('ref_id', this._refId);
				item.setProperty('query_item_ref_id', this._queryItemRefId);
			}
			return item;
		};
		return TreeRowDefinition;
	})();
	return TreeRowDefinition;
});
