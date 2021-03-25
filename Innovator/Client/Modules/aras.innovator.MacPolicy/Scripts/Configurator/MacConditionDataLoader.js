define(['dojo/_base/declare', 'QB/Scripts/qbDataLoader'], function (
	declare,
	qbDataLoader
) {
	let itemAvailablePropertiesCache = {};
	return declare([qbDataLoader], {
		constructor: function () {
			this.invalidateCache();
		},

		setIsReferencingItemFromServer: function (qryDefinitionItem) {
			this.isReferencingByReferenceRefId = {};
			const queryReferenceItems = qryDefinitionItem.getRelationships(
				'qry_QueryReference'
			);
			const queryReferenceItemsCount = queryReferenceItems.getItemCount();
			for (let i = 0; i < queryReferenceItemsCount; i++) {
				const queryReferenceItem = queryReferenceItems.getItemByIndex(i);
				if (queryReferenceItem.getAttribute('is_referencing_item') === '1') {
					this.isReferencingByReferenceRefId[
						queryReferenceItem.getProperty('ref_id')
					] = true;
				}
			}
		},

		getReferencePredicate: function () {
			return {
				isComplexPredicate: true
			};
		},

		loadMetaData: function () {},

		invalidateCache: function () {
			itemAvailablePropertiesCache = {};
		},

		getItemAvailableProperties: function (node) {
			let qryItem = aras.newIOMItem();
			qryItem.loadAML(node.xml);
			const refId = qryItem.getProperty('ref_id');
			let properties = [];
			if (!itemAvailablePropertiesCache[refId]) {
				qryItem = qryItem.apply('mp_GetAvailableProperties');
				if (qryItem.isError()) {
					aras.AlertError(qryItem);
					return;
				}
				for (let i = 0; i < qryItem.getItemCount(); i++) {
					const availableProperty = qryItem.getItemByIndex(i);
					const propertyName = availableProperty.getProperty('name');
					properties.push({
						name: propertyName,
						label: availableProperty.getProperty('label'),
						dataType: availableProperty.getProperty('data_type')
					});
				}
				itemAvailablePropertiesCache[refId] = properties;
			} else {
				properties = itemAvailablePropertiesCache[refId];
			}
			return properties;
		}
	});
});
