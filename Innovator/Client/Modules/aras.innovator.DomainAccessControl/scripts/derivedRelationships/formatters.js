Grid.formatters.getIcon = function (headId, rowId, value, grid) {
	const attrs = {};
	const row = grid.rows.get(rowId);
	const indexHead = grid.settings.indexHead;

	if (~grid.roots.indexOf(rowId) && indexHead[0] === 'alias') {
		attrs.colspan = indexHead.length;
	}
	return {
		attrs: attrs,
		className: row.isReferencingItem
			? 'aras-grid-row-cell__referencing-glyph'
			: '',
		children: [
			{
				tag: 'img',
				className: 'aras-grid-row-cell__icon',
				attrs: {
					src: row.icon
				}
			},
			{
				tag: 'span',
				children: [value]
			}
		]
	};
};
Grid.formatters.hideCell = function (headId, rowId, value, grid) {
	const attrs = {};

	if (grid.settings.indexHead[0] === 'alias') {
		attrs.style = 'display: none;';
	}

	return {
		attrs: attrs
	};
};
