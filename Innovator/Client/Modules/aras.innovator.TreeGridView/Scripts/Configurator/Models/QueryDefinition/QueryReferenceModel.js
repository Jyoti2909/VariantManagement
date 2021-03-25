define(function () {
	'use strict';
	var QueryReferenceModel = (function () {
		function QueryReferenceModel(item) {
			this._id = item.getAttribute('id');
			this._refId = item.getProperty('ref_id');
			this._childRefId = item.getProperty('child_ref_id');
			this._parentRefId = item.getProperty('parent_ref_id');
			this._sortOrder = parseInt(item.getProperty('sort_order'), 10);
			this._isReferencingQueryReference =
				item.getAttribute('is_referencing_item') === '1';
		}
		Object.defineProperty(QueryReferenceModel.prototype, 'isRoot', {
			get: function () {
				return this._childRefId && !this.parentRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryReferenceModel.prototype, 'id', {
			get: function () {
				return this._id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryReferenceModel.prototype, 'parentRefId', {
			get: function () {
				return this._parentRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryReferenceModel.prototype, 'childRefId', {
			get: function () {
				return this._childRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryReferenceModel.prototype, 'refId', {
			get: function () {
				return this._refId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryReferenceModel.prototype, 'sortOrder', {
			get: function () {
				return this._sortOrder;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryReferenceModel.prototype, 'isRecursiveRef', {
			get: function () {
				return this._isRecursiveRef;
			},
			set: function (isRecursiveRef) {
				this._isRecursiveRef = isRecursiveRef;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(
			QueryReferenceModel.prototype,
			'isReferencingQueryReference',
			{
				get: function () {
					return this._isReferencingQueryReference;
				},
				enumerable: true,
				configurable: true
			}
		);
		return QueryReferenceModel;
	})();
	return QueryReferenceModel;
});
