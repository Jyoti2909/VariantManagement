define(function () {
	'use strict';
	var QueryDefinitionModel = (function () {
		function QueryDefinitionModel(item) {
			this._id = item.getAttribute('id');
			this._name = item.getProperty('name');
		}
		Object.defineProperty(QueryDefinitionModel.prototype, 'id', {
			get: function () {
				return this._id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryDefinitionModel.prototype, 'name', {
			get: function () {
				return this._name;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(QueryDefinitionModel.prototype, 'rootQueryItemId', {
			get: function () {
				return this._rootQueryItemId;
			},
			enumerable: true,
			configurable: true
		});
		return QueryDefinitionModel;
	})();
	return QueryDefinitionModel;
});
