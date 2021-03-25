define(['dojo/_base/declare'], function (declare) {
	return declare('ES.Constants', null, {
		mainPageURL: '../Modules/aras.innovator.ES/Views/Main.html',
		esSettingsName: 'ES_Settings',
		worldIdentityId: 'A73B655731924CD0B027E4F4D5FCC0A9',
		topFacetsRequestAML:
			'<AML>' +
			"<Item action='get' type='ES_SettingsTopFacets' select='property_label,property_name,sort_order'>" +
			'<source_id>{0}</source_id>' +
			'</Item>' +
			'</AML>',
		defaultTopFacetsRequestAML:
			'<AML>' +
			"<Item action='get' type='Preference' levels='1' select='id'>" +
			'<identity_id>A73B655731924CD0B027E4F4D5FCC0A9</identity_id>' +
			'<Relationships>' +
			"<Item type='ES_Settings' action='get' select='id'>" +
			'<Relationships>' +
			"<Item action='get' type='ES_SettingsTopFacets' select='property_label,property_name,sort_order'></Item>" +
			'</Relationships>' +
			'</Item>' +
			'</Relationships>' +
			'</Item>' +
			'</AML>',
		defaultPageSize: 10,
		maxPageSize: 25,
		maxVisibleOptionsCount: 10,
		sortModes: {
			alphabetical: 'label',
			frequency: 'count'
		},
		sortOrders: {
			ascending: 'asc',
			descending: 'desc'
		},
		alphabeticallySortedFacets: ['aes_root_types'],
		systemProperties: [
			'classification',
			'keyed_name',
			'id',
			'created_by_id',
			'created_on',
			'modified_by_id',
			'modified_on',
			'current_state',
			'state',
			'locked_by_id',
			'is_current',
			'major_rev',
			'minor_rev',
			'is_released',
			'not_lockable',
			'css',
			'source_id',
			'related_id',
			'behavior',
			'sort_order',
			'config_id',
			'new_version',
			'generation',
			'permission_id',
			'managed_by_id',
			'owned_by_id',
			'itemtype',
			'release_date',
			'effective_date',
			'superseded_date',
			'team_id'
		]
	});
});
