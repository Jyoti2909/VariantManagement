(function (externalParent) {
	function QueryDefinitionModel(queryDefinitionId) {
		this._queryDefinition =
			aras.itemsCache.getItem(queryDefinitionId) ||
			aras.getItemById('qry_QueryDefinition', queryDefinitionId);
	}
	QueryDefinitionModel.prototype = {
		constructor: QueryDefinitionModel,
		getData: function () {
			if (!this._queryDefinition) {
				return Promise.resolve();
			}

			const queryDefinition = this._queryDefinition.cloneNode(true);

			queryDefinition.setAttribute('action', 'qry_SetIsReferencingItem');
			return ArasModules.soap(queryDefinition.xml, {
				async: true
			}).then(
				function (result) {
					result = ArasModules.xml.parseString(result);
					this._queryDefinition = result.selectSingleNode('/*/*/*/Item');

					const queryItems = this._queryDefinition.selectNodes(
						"Relationships/Item[@type='qry_QueryItem']"
					);
					const queryReferences = this._queryDefinition.selectNodes(
						"Relationships/Item[@type='qry_QueryReference']"
					);

					return {
						queryItems: [].slice.call(queryItems),
						queryReferences: [].slice.call(queryReferences)
					};
				}.bind(this)
			);
		},
		getIcon: function (queryReference, queryItem) {
			const itemTypeId = aras.getItemProperty(queryItem, 'item_type');
			const itemType = aras.getItemTypeForClient(itemTypeId, 'id').node;
			const filterXML = aras.getItemProperty(queryReference, 'filter_xml');
			let icon =
				aras.getItemProperty(itemType, 'open_icon') ||
				'../images/DefaultItemType.svg';

			if (filterXML) {
				const xml = aras.createXMLDocument();

				xml.loadXML(filterXML);
				const arr = [].slice.call(xml.selectNodes('/condition/eq/property'));

				if (arr && arr.length === 2) {
					let parentProperty;
					let childProperty;

					if (arr[0].getAttribute('query_items_xpath') === 'parent::Item') {
						parentProperty = arr[0].getAttribute('name');
						childProperty = arr[1].getAttribute('name');
					}
					if (arr[1].getAttribute('query_items_xpath') === 'parent::Item') {
						parentProperty = arr[1].getAttribute('name');
						childProperty = arr[0].getAttribute('name');
					}

					icon =
						(parentProperty === 'id' &&
							childProperty === 'source_id' &&
							'../images/RelationshipType.svg') ||
						icon;
				}
			}

			return aras.getScriptsURL() + icon;
		}
	};
	externalParent.QueryDefinitionModel = QueryDefinitionModel;
})(window);
