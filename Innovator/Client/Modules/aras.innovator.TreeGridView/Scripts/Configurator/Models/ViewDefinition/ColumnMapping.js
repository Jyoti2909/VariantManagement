define([
	'TreeGridView/Scripts/Configurator/Models/Common/ItemInfo',
	'./JsonTemplate'
], function (ItemInfo, JsonTemplate) {
	'use strict';
	var ColumnMapping = (function () {
		function ColumnMapping(item) {
			if (!item) {
				return;
			}
			this._id = item.getAttribute('id');
			this._sourceId = item.getProperty('source_id');
			this._treeRowRefId = item.getProperty('tree_row_ref_id');
			this._template = JsonTemplate.parse(item.getProperty('template'));
			this._cellViewType = item.getProperty('cell_view_type');
			this.dataTemplate = item.getProperty('data_template');
			var builderMethodId = item.getProperty('builder_method');
			if (builderMethodId) {
				this._builderMethod = new ItemInfo(builderMethodId, 'Method');
			}
		}
		Object.defineProperty(ColumnMapping.prototype, 'id', {
			get: function () {
				return this._id;
			},
			set: function (id) {
				this._id = id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnMapping.prototype, 'builderMethod', {
			get: function () {
				return this._builderMethod;
			},
			set: function (builderMethod) {
				this._builderMethod = builderMethod;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnMapping.prototype, 'cellViewType', {
			get: function () {
				return this._cellViewType || 'Text';
			},
			set: function (cellViewType) {
				this._cellViewType = cellViewType;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnMapping.prototype, 'treeRowRefId', {
			get: function () {
				return this._treeRowRefId;
			},
			set: function (treeRowRefId) {
				this._treeRowRefId = treeRowRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnMapping.prototype, 'sourceId', {
			get: function () {
				return this._sourceId;
			},
			set: function (sourceId) {
				this._sourceId = sourceId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnMapping.prototype, 'template', {
			get: function () {
				return this._template;
			},
			set: function (template) {
				this._template = template;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(ColumnMapping.prototype, 'dataTemplate', {
			enumerable: true,
			writable: true
		});
		ColumnMapping.prototype.getTemplateText = function () {
			var template;
			if (typeof this.template === 'string') {
				template = this.template;
			} else if ('text_template' in this.template) {
				template = this.template['text_template'];
			} else {
				template = '';
			}
			return template;
		};
		ColumnMapping.prototype.getListValueTemplate = function () {
			var template;
			var listValueTemplateFieldName = 'list_value_template';
			if (typeof this.template === 'string') {
				template = this.template;
			} else if (listValueTemplateFieldName in this.template) {
				template = this.template[listValueTemplateFieldName];
			} else {
				template = '';
			}
			return template;
		};
		ColumnMapping.prototype.getTemplateIcon = function () {
			var template = '';

			if ('icon' in this.template) {
				template = this.template.icon;
			}

			return template;
		};
		ColumnMapping.prototype.getIconFromTemplate = function () {
			if (typeof this.template !== 'string') {
				return this.template.icon;
			}
		};
		ColumnMapping.prototype.serializeToItem = function (item) {
			if (item) {
				item.setAttribute('id', this._id);
				item.setProperty('tree_row_ref_id', this._treeRowRefId);
				item.setProperty('template', JsonTemplate.serialize(this._template));
				item.setProperty('cell_view_type', this._cellViewType);
				item.setProperty('source_id', this._sourceId);
				if (this._builderMethod) {
					item.setProperty('builder_method', this._builderMethod.id);
					item.setPropertyAttribute('builder_method', 'type', 'Method');
				} else {
					item.setPropertyAttribute('builder_method', 'type', 'Method');
					item.setPropertyAttribute('builder_method', 'is_null', '1');
				}
				item.setProperty('data_template', this.dataTemplate);
			}
			return item;
		};
		return ColumnMapping;
	})();
	return ColumnMapping;
});
