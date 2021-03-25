Grid.formatters.iconLink = function (headId, rowKey, value, grid) {
	var icon = grid.rows.get(rowKey, 'icon');
	var type = grid.rows.get(rowKey, 'type');

	return {
		className: 'aras-grid-row-cell__iconLink',
		children: [
			{
				tag: 'img',
				className: 'aras-grid-row-icon',
				attrs: {
					src: icon
				}
			},
			{
				tag: 'span',
				className: 'aras-grid-link',
				children: [
					{
						tag: 'span',
						children: [value]
					}
				]
			},
			{
				tag: 'span',
				children: [' (' + type + ')']
			}
		]
	};
};
Grid.formatters.checked = function (headId, rowId, value, grid) {
	var isDisabled =
		!grid.view.defaultSettings.editable ||
		!grid.checkEditAvailability(headId, rowId, grid);
	var applyEdit = function (e) {
		var target = e.target;
		var newValue = target.checked;
		if (!isDisabled) {
			grid.dom.dispatchEvent(
				new CustomEvent('applyCheckedItems', {
					detail: {
						headId: headId,
						rowId: target.getAttribute('data-rowId'),
						value: newValue
					}
				})
			);
		}
	}.bind(grid);
	return {
		className: 'aras-grid-row-cell__boolean',
		children: [
			{
				tag: 'label',
				className: 'aras-form-boolean',
				children: [
					{
						tag: 'input',
						attrs: {
							type: 'checkbox',
							checked: value,
							onChange: applyEdit,
							disabled: isDisabled,
							'data-rowId': rowId
						}
					},
					{
						tag: 'span'
					}
				]
			}
		]
	};
};
