define([
	'TreeGridView/Scripts/Configurator/Structures/QueryDefinitionStructure',
	'TreeGridView/Scripts/Configurator/Structures/ViewDefinitionStructure',
	'TreeGridView/Scripts/Configurator/Models/Common/ItemInfo'
], function (QueryDefinitionStructure, ViewDefinitionStructure, ItemInfo) {
	'use strict';
	var DataStructureFactory = (function () {
		function DataStructureFactory(aras, item) {
			this._aras = aras;
			this._item = item;
		}
		Object.defineProperty(DataStructureFactory.prototype, 'queryDefinition', {
			get: function () {
				return this._queryDefinition;
			},
			enumerable: true,
			configurable: true
		});
		DataStructureFactory.prototype.initQueryDefinition = function () {
			var queryDefinitionItem = this.loadQueryDefinitionItem(
				this._aras.getItemProperty(this._item, 'query_definition')
			);
			this._queryDefinition = new QueryDefinitionStructure(queryDefinitionItem);
			return this._queryDefinition;
		};
		DataStructureFactory.prototype.initViewDefinition = function () {
			var viewDefinition = this.loadTreeGridViewDefinitionItem(
				this._item,
				true
			);
			var iomItem = this._aras.newIOMItem(undefined);
			iomItem.dom = this._item.ownerDocument;
			iomItem.node = this._item;
			var defaultBuilderMethod = this._initDefaultBuilderMethod();
			this._viewDefinition = new ViewDefinitionStructure(
				iomItem,
				this._aras,
				defaultBuilderMethod
			);
			return this._viewDefinition;
		};
		DataStructureFactory.prototype.loadQueryDefinitionItem = function (
			queryDefinitionId
		) {
			var item = this._aras.IomInnovator.newItem(
				'qry_QueryDefinition',
				'qry_SetIsReferencingItem'
			);
			item.setProperty('is_to_get_item_from_server', '1');
			item.setAttribute('id', queryDefinitionId);
			var queryItemRelationship = this._aras.IomInnovator.newItem(
				'qry_QueryItem',
				'get'
			);
			var queryReferenceRelationship = this._aras.IomInnovator.newItem(
				'qry_QueryReference',
				'get'
			);
			item.addRelationship(queryItemRelationship);
			item.addRelationship(queryReferenceRelationship);
			return item.apply();
		};
		DataStructureFactory.prototype.loadTreeGridViewDefinitionItem = function (
			node,
			ovverideExistingData
		) {
			if (!this._aras.isDirtyEx(node)) {
				var columnMapping =
					'<Relationships>' +
					'<Item type="rb_ColumnMapping" action="get" />' +
					'</Relationships>';
				this._aras.getItemRelationshipsEx(
					node,
					'rb_TreeRowReference',
					undefined,
					undefined,
					undefined,
					ovverideExistingData
				);
				this._aras.getItemRelationshipsEx(
					node,
					'rb_ColumnDefinition',
					undefined,
					undefined,
					columnMapping,
					ovverideExistingData
				);
				this._aras.getItemRelationshipsEx(
					node,
					'rb_TreeRowDefinition',
					undefined,
					undefined,
					undefined,
					ovverideExistingData
				);
			}
			return node;
		};
		DataStructureFactory.prototype._initDefaultBuilderMethod = function () {
			var item = this._aras.IomInnovator.newItem('Method', 'get');
			item.setAttribute('select', 'id');
			item.setProperty('keyed_name', 'rb_DefaultColumnBuilderMethod');
			var res = item.apply();
			if (res && !res.isError()) {
				var id = res.getAttribute('id');
				if (id) {
					return new ItemInfo(id, 'Method');
				}
			}
		};
		return DataStructureFactory;
	})();
	return DataStructureFactory;
});
