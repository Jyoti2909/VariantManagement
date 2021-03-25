((window) => {
	'use strict';

	const getIconNode = (metadata) => {
		if (!metadata || !metadata.iconUrl) {
			return null;
		}

		const img = {
			tag: 'img',
			attrs: {
				src: metadata.iconUrl
			}
		};

		if (metadata.iconStyle) {
			img.style = metadata.iconStyle;
		}

		img.className = metadata.iconClass || 'dynamicTreeGridIcon';

		return img;
	};

	const getTextNode = (value, metadata) => {
		const text = {
			tag: 'span',
			children: [value]
		};

		if (metadata && metadata.textStyle) {
			text.style = metadata.textStyle;
		}

		if (metadata && metadata.textClass) {
			text.className = metadata.textClass;
		}

		return text;
	};

	window.Grid.formatters.dynamicTreeGrid_iconText = (
		columnName,
		rowId,
		value,
		grid,
		metadata
	) => {
		const iconText = {
			children: [getIconNode(metadata), getTextNode(value, metadata)]
		};

		if (metadata && metadata.cellStyle) {
			iconText.style = metadata.cellStyle;
		}

		if (metadata && metadata.cellClass) {
			iconText.className = metadata.cellClass;
		}

		return iconText;
	};
})(window);
