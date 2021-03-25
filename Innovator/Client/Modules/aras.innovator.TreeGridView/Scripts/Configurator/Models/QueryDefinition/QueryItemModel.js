define([
	'TreeGridView/Scripts/Configurator/Models/Common/ItemTypeInfo'
], function (ItemTypeInfo) {
	'use strict';
	var QueryItemModel = (function () {
		function QueryItemModel(item) {
			this._id = item.getAttribute('id');
			this._refId = item.getProperty('ref_id');
			this._alias = item.getProperty('alias');
			var itemTypeId = item.getProperty('item_type');
			var itemTypeName = item.getPropertyAttribute('item_type', 'name');
			this._itemType = new ItemTypeInfo(itemTypeId, itemTypeName);
		}
		Object.defineProperty(QueryItemModel.prototype, 'id', {
			get: function () {
				return this._id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryItemModel.prototype, 'alias', {
			get: function () {
				return this._alias;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryItemModel.prototype, 'refId', {
			get: function () {
				return this._refId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryItemModel.prototype, 'itemType', {
			get: function () {
				return this._itemType;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryItemModel.prototype, 'hasRecursion', {
			get: function () {
				return this._hasRecursion;
			},
			set: function (hasRecursion) {
				this._hasRecursion = hasRecursion;
			},
			enumerable: true,
			configurable: true
		});
		return QueryItemModel;
	})();
	return QueryItemModel;
});
