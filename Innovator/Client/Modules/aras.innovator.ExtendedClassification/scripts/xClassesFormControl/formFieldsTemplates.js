(function (wnd) {
	var infernoFlags = ArasModules.utils.infernoFlags;
	var formFieldsTemplates = {
		string: function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('input'),
				'input',
				null,
				null,
				infernoFlags.hasInvalidChildren,
				Object.assign({}, item.attrs, {
					type: 'text'
				}),
				null,
				item.refs
			);
		},
		text: function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('textarea'),
				'textarea',
				null,
				null,
				infernoFlags.hasInvalidChildren,
				Object.assign({}, item.attrs),
				null,
				item.refs
			);
		},
		list: function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('aras-filter-list'),
				'aras-filter-list',
				null,
				null,
				infernoFlags.hasInvalidChildren,
				{ 'aria-labelledby': item.attrs['aria-labelledby'] },
				null,
				item.refs
			);
		},
		boolean: function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('label'),
				'label',
				'aras-form-boolean',
				[
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('input'),
						'input',
						null,
						null,
						infernoFlags.hasInvalidChildren,
						Object.assign({}, item.attrs, {
							type: 'checkbox'
						}),
						null,
						item.refs
					),
					Inferno.createVNode(Inferno.getFlagsForElementVnode('span'), 'span')
				],
				infernoFlags.hasNonKeyedChildren
			);
		},
		color: function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('div'),
				'div',
				'color-input',
				null,
				infernoFlags.hasInvalidChildren,
				Object.assign({}, item.attrs)
			);
		},
		'color list': function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('select'),
				'select',
				'color-list',
				item.data.values.map(function (value) {
					var options = {
						selected: value.value === item.data.value,
						style: 'background-color: ' + (value.value || '#FFFFFF'),
						value: value.value
					};

					return Inferno.createVNode(
						Inferno.getFlagsForElementVnode('option'),
						'option',
						null,
						Inferno.createTextVNode(value.label),
						infernoFlags.hasVNodeChildren,
						options
					);
				}),
				infernoFlags.hasNonKeyedChildren,
				Object.assign({}, item.attrs),
				null,
				item.refs
			);
		},
		date: function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('div'),
				'div',
				'aras-form-date',
				[
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('input'),
						'input',
						null,
						null,
						infernoFlags.hasInvalidChildren,
						Object.assign({}, item.attrs, {
							type: 'text'
						}),
						null,
						item.refs
					),
					Inferno.createVNode(Inferno.getFlagsForElementVnode('span'), 'span')
				],
				infernoFlags.hasNonKeyedChildren
			);
		},
		mv_list: function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('select'),
				'select',
				null,
				item.data.values.map(function (value) {
					var options = {
						selected: item.data.selectedOptions.has(value.value),
						value: value.value
					};
					return Inferno.createVNode(
						Inferno.getFlagsForElementVnode('option'),
						'option',
						null,
						Inferno.createTextVNode(value.label),
						infernoFlags.hasVNodeChildren,
						options
					);
				}),
				infernoFlags.hasNonKeyedChildren,
				Object.assign({ multiple: '1' }, item.attrs),
				null,
				item.refs
			);
		},
		restricted: function () {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('div'),
				'div',
				null,
				[
					Inferno.createVNode(Inferno.getFlagsForElementVnode('span'), 'span'),
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('span'),
						'span',
						'aras-field-xclasses__restricted_field',
						Inferno.createTextVNode(
							aras.getResource('', 'common.restricted_property_warning')
						),
						infernoFlags.hasVNodeChildren
					)
				],
				infernoFlags.hasNonKeyedChildren
			);
		},
		item: function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('div'),
				'div',
				null,
				[
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('span'),
						'span',
						'sys_item_link aras-field-xclasses__item_link',
						Inferno.createTextVNode(item.data.value),
						infernoFlags.hasVNodeChildren,
						{
							id: item.data.id + '_span'
						}
					),
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('aras-item-property'),
						'aras-item-property',
						'aras-field-xclasses__item-input-wrapper',
						null,
						infernoFlags.hasInvalidChildren,
						{ 'aria-labelledby': item.attrs['aria-labelledby'] },
						null,
						item.refs
					)
				],
				infernoFlags.hasNonKeyedChildren
			);
		}
	};

	wnd.FormFieldsTemplates = formFieldsTemplates;
})(window);
