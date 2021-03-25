import intl from '../../core/intl';
import SvgManager from '../../core/SvgManager';

const gridFormatters = {
	boolean: function (headId, rowId, value, grid) {
		const applyEdit = function (e) {
			const rootRowId = grid.settings.focusedCell.rowId;
			const isDisabled =
				!grid.view.defaultSettings.editable ||
				!grid.checkEditAvailability(headId, rootRowId, grid);
			const target = e.target;
			const newValue = target.checked;
			if (!isDisabled) {
				const propName = grid.head.get(headId, 'name') || headId;
				grid.dom.dispatchEvent(
					new CustomEvent('applyEdit', {
						detail: {
							headId: headId,
							rowId: rootRowId,
							value: newValue,
							dataId: rowId,
							propName: propName
						}
					})
				);
			} else {
				e.preventDefault();
			}
		};
		return {
			className: 'aras-grid-row-cell__boolean',
			children: [
				{
					tag: 'label',
					className: 'aras-checkbox',
					children: [
						{
							tag: 'input',
							className: 'aras-checkbox__input',
							attrs: {
								type: 'checkbox',
								checked: value,
								onClick: applyEdit
							}
						},
						{
							tag: 'span',
							className: 'aras-checkbox__check-button',
							style: 'margin-right:0;'
						}
					]
				}
			]
		};
	},
	img: function (headId, rowId, value) {
		const svgVNode = SvgManager.createInfernoVNode(value);
		if (svgVNode) {
			const rowClassName = 'aras-grid-row-cell__img';
			return {
				className: rowClassName,
				children: [svgVNode]
			};
		}

		return {
			children: []
		};
	},
	link: function (headId, rowId, value, grid) {
		return {
			children: [
				{
					tag: 'span',
					className: 'aras-grid-link',
					children: [value]
				}
			]
		};
	},
	calendar: function (headId, rowId, value, grid, metadata) {
		const date = intl.date.parse(value);
		const formattedDate = date
			? intl.date.format(date, metadata ? metadata.format : undefined)
			: '';
		return {
			className: 'aras-grid-row-cell__calendar',
			children: [
				{
					tag: 'span',
					children: [formattedDate]
				}
			]
		};
	},
	select: function (headId, rowId, value, grid, metadata) {
		const options = metadata.options || metadata.list || [];
		const result = options.find(function (option) {
			return option.value.toString() === value;
		});
		const label = result ? result.label || result.value : value;
		return {
			className: 'aras-grid-row-cell__select',
			children: [
				{
					tag: 'span',
					children: [label]
				}
			]
		};
	}
};

gridFormatters.extend = function (formatters) {
	Object.assign(this, formatters);
};

export default gridFormatters;
