const effs_cuiFormatters = {
	effs_label: function (item, options) {
		let labelClass = 'effs-toolbar-label';
		labelClass += item.className ? ' ' + item.className : '';
		return Inferno.createVNode(
			Inferno.getFlagsForElementVnode('span'),
			'span',
			labelClass,
			Inferno.createTextVNode(item.text),
			ArasModules.utils.infernoFlags.hasVNodeChildren
		);
	},

	effs_item_field: function (item, options) {
		const itemFieldContainerChildren = [];
		const properties = {};
		const metadata = item.metadata;

		if (metadata) {
			properties.onchange = metadata.onChangeHandler;
			properties.onclick = metadata.onClickHandler;
			properties.onkeydown = metadata.onKeyDownHandler;
		}

		const addNodeCallback = function (itemPropertyElement) {
			itemPropertyElement.setState({
				itemType: item.itemtype
			});

			if (metadata && metadata.onAddElementNodeHandler) {
				metadata.onAddElementNodeHandler(itemPropertyElement);
			}
		};

		if (item.label) {
			const labelDataItem = {
				text: item.label,
				className: item.fieldItemLabelClassName
			};
			itemFieldContainerChildren.push(
				effs_cuiFormatters.effs_label(labelDataItem)
			);
		}

		let itemFieldClass = 'effs-toolbar-item-field';
		itemFieldClass += item.fieldItemClassName
			? ' ' + item.fieldItemClassName
			: '';
		itemFieldContainerChildren.push(
			Inferno.createVNode(
				Inferno.getFlagsForElementVnode('aras-item-property'),
				'aras-item-property',
				itemFieldClass,
				null,
				ArasModules.utils.infernoFlags.hasInvalidChildren,
				properties,
				null,
				addNodeCallback
			)
		);

		return Inferno.createVNode(
			Inferno.getFlagsForElementVnode('span'),
			'span',
			item.fieldItemContainerClassName,
			itemFieldContainerChildren,
			ArasModules.utils.infernoFlags.hasNonKeyedChildren
		);
	}
};
