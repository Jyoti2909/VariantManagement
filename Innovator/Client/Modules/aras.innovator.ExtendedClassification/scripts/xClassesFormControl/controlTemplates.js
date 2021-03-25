(function (wnd) {
	function XControlTemplates(navInstance) {
		const infernoFlags = ArasModules.utils.infernoFlags;
		const templates = NavTemplates(navInstance);
		const parentNodeClass = 'aras-nav__parent';
		const parentExpandedNodeClass =
			'aras-nav__parent aras-nav__parent_expanded';
		const childNodeClass = 'aras-nav__child';

		templates.node = function Node(dataItem) {
			return dataItem.value.children
				? Inferno.createComponentVNode(
						infernoFlags.componentFunction,
						templates.parentNode,
						dataItem
				  )
				: Inferno.createComponentVNode(
						infernoFlags.componentFunction,
						templates.labeledElement,
						dataItem
				  );
		};

		templates.childNode = function (item) {
			var type = FormFieldsTemplates[item.data.type]
				? item.data.type
				: 'string';
			return FormFieldsTemplates[type](item);
		};

		templates.labeledElement = function (item) {
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('li'),
				'li',
				item.value.li.className || childNodeClass,
				[
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('div'),
						'div',
						null,
						Inferno.createTextVNode(item.value.field.data.label),
						infernoFlags.hasVNodeChildren,
						item.value.labelContainer.attrs
					),
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('div'),
						'div',
						null,
						Inferno.createComponentVNode(
							infernoFlags.componentFunction,
							templates.childNode,
							item.value.field
						),
						infernoFlags.hasVNodeChildren,
						item.value.fieldContainer.attrs
					),
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('div'),
						'div',
						'aras-icon-vertical-ellipsis',
						null,
						infernoFlags.hasInvalidChildren,
						item.value.field.data.readonly
							? { style: 'visibility: hidden' }
							: null
					)
				],
				infernoFlags.hasNonKeyedChildren,
				item.value.li.attrs
			);
		};

		templates.parentNode = function ParentNode(item) {
			var children = item.value.children;
			var ulOfChildren = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('ul'),
				'ul',
				null,
				children.map(function (childKey) {
					return Inferno.createComponentVNode(
						infernoFlags.componentFunction,
						templates.node,
						{
							nodeKey: childKey,
							value: navInstance.data.get(childKey)
						}
					);
				}),
				infernoFlags.hasNonKeyedChildren
			);

			var divLabel = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('div'),
				'div',
				null,
				[
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('div'),
						'div',
						'aras-nav__icon',
						Inferno.createVNode(
							Inferno.getFlagsForElementVnode('span'),
							'span'
						),
						infernoFlags.hasVNodeChildren
					), //arrow
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('span'),
						'span',
						null,
						Inferno.createTextVNode(item.value.label),
						infernoFlags.hasVNodeChildren
					),
					Inferno.createVNode(
						Inferno.getFlagsForElementVnode('span'),
						'span',
						'aras-field-xclasses__delete-cross'
					)
				],
				infernoFlags.hasNonKeyedChildren
			);

			var isExpanded = navInstance.expandedItemsKeys.has(item.nodeKey);
			var classNames = isExpanded ? parentExpandedNodeClass : parentNodeClass;
			classNames += item.value.removed
				? ' aras-field-xclasses__xclass-block_disabled'
				: '';
			var liProps = {
				'data-key': item.nodeKey
			};
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('li'),
				'li',
				classNames,
				[divLabel, ulOfChildren],
				infernoFlags.hasNonKeyedChildren,
				liProps
			);
		};

		return templates;
	}

	wnd.XControlTemplates = XControlTemplates;
})(window);
