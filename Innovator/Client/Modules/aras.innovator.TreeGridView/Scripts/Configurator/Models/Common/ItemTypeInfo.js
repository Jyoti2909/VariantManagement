define(function () {
	'use strict';
	var ItemTypeInfo = (function () {
		function ItemTypeInfo(id, name) {
			this._id = id;
			this._name = name;
		}
		Object.defineProperty(ItemTypeInfo.prototype, 'id', {
			get: function () {
				return this._id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ItemTypeInfo.prototype, 'name', {
			get: function () {
				return this._name;
			},
			enumerable: true,
			configurable: true
		});
		return ItemTypeInfo;
	})();
	return ItemTypeInfo;
});
