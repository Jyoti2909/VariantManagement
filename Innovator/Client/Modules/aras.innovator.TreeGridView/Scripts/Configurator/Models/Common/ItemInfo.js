define(function () {
	'use strict';
	var ItemInfo = (function () {
		function ItemInfo(id, itemTypeName) {
			this._id = id;
			this._itemTypeName = itemTypeName;
		}
		Object.defineProperty(ItemInfo.prototype, 'id', {
			get: function () {
				return this._id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ItemInfo.prototype, 'itemTypeName', {
			get: function () {
				return this._itemTypeName;
			},
			enumerable: true,
			configurable: true
		});
		return ItemInfo;
	})();
	return ItemInfo;
});
