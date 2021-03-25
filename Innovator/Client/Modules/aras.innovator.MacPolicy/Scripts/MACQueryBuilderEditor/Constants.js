const Constants = {
	itemTypes: {
		attrDefinition: {
			properties: {
				drRelationshipId: 'dr_relationship_id',
				definedOnItemtypeId: 'defined_on_itemtype_id',
				leafItem: 'leaf_item',
				propertyName: 'property_name'
			}
		},
		drRelationship: {
			itemTypeName: 'dr_Relationship',
			properties: {
				name: 'name',
				departureItemTypeId: 'departure_itemtype_id',
				destinationItemTypeId: 'destination_itemtype_id',
				implementationQuery: 'implementation_query'
			}
		},
		queryItem: {
			itemTypeName: 'qry_QueryItem',
			properties: {
				itemType: 'item_type',
				refId: 'ref_id'
			}
		},
		queryReference: {
			itemTypeName: 'qry_QueryReference',
			properties: {
				parentRefId: 'parent_ref_id',
				childRefId: 'child_ref_id'
			}
		},
		queryItemSelectProperty: {
			itemTypeName: 'qry_QueryItemSelectProperty',
			properties: {
				propertyName: 'property_name'
			}
		}
	},
	itemPropertiesAttributes: {
		keyedName: 'keyed_name'
	}
};

export default Constants;
