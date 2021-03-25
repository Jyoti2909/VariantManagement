define(['TreeGridView/Scripts/Configurator/Models/Common/ItemInfo'], function (
	ItemInfo
) {
	'use strict';
	var ColumnDefinition = (function () {
		function ColumnDefinition(item) {
			this._width = 0;
			if (item) {
				this.init(item);
			}
		}
		Object.defineProperty(ColumnDefinition.prototype, 'id', {
			get: function () {
				return this._id;
			},
			set: function (id) {
				this._id = id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnDefinition.prototype, 'builderMethod', {
			get: function () {
				return this._builderMethod;
			},
			set: function (builderMethod) {
				this._builderMethod = builderMethod;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnDefinition.prototype, 'header', {
			get: function () {
				return this._header;
			},
			set: function (header) {
				this._header = header;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnDefinition.prototype, 'positionOrder', {
			get: function () {
				return this._positionOrder;
			},
			set: function (positionOrder) {
				this._positionOrder = positionOrder;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnDefinition.prototype, 'template', {
			get: function () {
				return this._template;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnDefinition.prototype, 'width', {
			get: function () {
				return this._width;
			},
			set: function (width) {
				this._width = width;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnDefinition.prototype, 'name', {
			get: function () {
				return this._name;
			},
			set: function (name) {
				this._name = name;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnDefinition.prototype, 'dataTempalte', {
			enumerable: true,
			writable: true
		});
		ColumnDefinition.prototype.init = function (item) {
			this._id = item.getAttribute('id');
			this._header = item.getProperty('header');
			this._name = item.getProperty('name');
			this._template = item.getProperty('template');
			var positionOrder = item.getProperty('position_order');
			if (positionOrder) {
				this._positionOrder = parseInt(positionOrder, 10);
			}
			var width = item.getProperty('width');
			if (width) {
				this._width = parseInt(width, 10);
			}
			var builderMethodId = item.getProperty('builder_method');
			if (builderMethodId) {
				this._builderMethod = new ItemInfo(builderMethodId, 'Method');
			}
			this.dataTempalte = item.getProperty('data_template');
		};
		ColumnDefinition.prototype.serializeToItem = function (item) {
			if (item) {
				item.setAttribute('id', this._id);
				item.setProperty('name', this._name);
				item.setProperty('header', this._header);
				item.setProperty('template', this._template);
				item.setProperty('position_order', this._positionOrder.toString());
				item.setProperty('width', this._width.toString());
				item.setProperty('data_template', this.dataTempalte);
				if (this.builderMethod) {
					item.setProperty('builder_method', this.builderMethod.id);
					item.setPropertyAttribute('builder_method', 'type', 'Method');
				} else {
					item.setPropertyAttribute('builder_method', 'type', 'Method');
					item.setPropertyAttribute('builder_method', 'is_null', '1');
				}
			}
			return item;
		};
		return ColumnDefinition;
	})();
	return ColumnDefinition;
});
