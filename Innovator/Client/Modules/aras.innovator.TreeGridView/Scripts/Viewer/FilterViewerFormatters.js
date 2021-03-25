Grid.formatters.filterViewerIcon = function (headId, rowId, value, grid) {
	return {
		className: !grid.rows.get(rowId).isChecked
			? 'aras-grid-row-cell_disabled'
			: '',
		children: [
			{
				tag: 'img',
				className: 'aras-grid-row-cell__icon',
				attrs: {
					src: grid.rows.get(rowId, 'icon')
				}
			},
			{
				tag: 'span',
				children: [value]
			}
		]
	};
};
Grid.formatters.checked = function (headId, rowId, value, grid) {
	let className = 'aras-form-boolean';
	const row = grid.rows.get(rowId);
	const parentRow = grid.rows.get(row.parentKey);
	const isDisabled =
		!grid.view.defaultSettings.editable ||
		!grid.checkEditAvailability(headId, rowId, grid);
	const applyEdit = function (e) {
		const target = e.target;
		const newValue = target.checked;
		if (!isDisabled) {
			grid.dom.dispatchEvent(
				new CustomEvent('applyCheckedItems', {
					detail: {
						headId: headId,
						rowId: rowId,
						value: newValue
					}
				})
			);
		} else {
			e.preventDefault();
		}
	}.bind(grid);

	if (!row.isChecked) {
		className += parentRow.isChecked
			? ' aras-form-boolean_off'
			: ' aras-form-boolean_disabled';
	}
	return {
		className: 'aras-grid-row-cell__boolean',
		children: [
			{
				tag: 'label',
				className: className,
				children: [
					{
						tag: 'input',
						attrs: {
							type: 'checkbox',
							checked: value,
							disabled: isDisabled,
							onChange: applyEdit
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
