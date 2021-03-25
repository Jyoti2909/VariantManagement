window.Grid.formatters.effs_textIcon = function (
	headId,
	rowId,
	value,
	grid,
	metadata
) {
	const formatter = {
		tag: 'div',
		className: 'effs-aras-grid-row-cell-text-icon',
		children: [
			{
				tag: 'span',
				className: 'effs-aras-grid-row-cell-text-icon__text',
				children: [value]
			}
		]
	};

	if (metadata) {
		formatter.className +=
			' ' +
			(metadata.textIconCssClassName ||
				'effs-aras-grid-row-cell-text-icon_icon-right');

		if (metadata.iconUrl) {
			const iconNode = {
				tag: 'div',
				className:
					'effs-aras-grid-row-cell-text-icon__icon-container' +
					(metadata.iconContainerCssClassName
						? ' ' + metadata.iconContainerCssClassName
						: ''),
				events: {
					onClick: metadata.iconOnClickHandler
				},
				children: [
					{
						tag: 'img',
						className: 'effs-aras-grid-row-cell-text-icon__icon',
						attrs: {
							src: metadata.iconUrl
						}
					}
				]
			};

			formatter.children.push(iconNode);
		}
	}

	return {
		children: [formatter]
	};
};
