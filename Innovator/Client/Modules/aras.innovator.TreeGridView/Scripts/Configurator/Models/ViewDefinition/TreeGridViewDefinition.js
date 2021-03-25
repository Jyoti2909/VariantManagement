define(['TreeGridView/Scripts/Configurator/Models/Common/ItemInfo'], function (
	ItemInfo
) {
	'use strict';
	var TreeGridViewDefinition = (function () {
		function TreeGridViewDefinition(item) {
			this._id = item.getAttribute('id');
			this._name = item.getProperty('name');
			this._label = item.getProperty('label');
			var qdId = item.getProperty('query_definition');
			var qdTypeName = item.getPropertyAttribute('query_definition', 'type');
			this._queryDefinition = new ItemInfo(qdId, qdTypeName);
		}
		Object.defineProperty(TreeGridViewDefinition.prototype, 'id', {
			get: function () {
				return this._id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridViewDefinition.prototype, 'name', {
			get: function () {
				return this._name;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridViewDefinition.prototype, 'label', {
			get: function () {
				return this._label;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridViewDefinition.prototype, 'queryDefinition', {
			get: function () {
				return this._queryDefinition;
			},
			set: function (qd) {
				this._queryDefinition = qd;
			},
			enumerable: true,
			configurable: true
		});
		return TreeGridViewDefinition;
	})();
	return TreeGridViewDefinition;
});
