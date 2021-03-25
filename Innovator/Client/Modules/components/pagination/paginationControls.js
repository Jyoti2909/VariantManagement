import SvgManager from '../../core/SvgManager';

const images = {
	maxResults: '../images/MaxResults.svg',
	more: '../images/More.svg',
	pageSize: '../images/PageSize.svg'
};

SvgManager.enqueue(Object.values(images));

const paginationControls = new Map();
paginationControls.set('pagination_prev_button', {
	type: 'button',
	id: 'pagination_prev_button',
	label: 'Prev',
	cssClass: 'aras-pagination__prev-button',
	disabled: true,
	tooltip_template: 'Previous Page'
});
paginationControls.set('pagination_next_button', {
	type: 'button',
	id: 'pagination_next_button',
	label: 'Next',
	cssClass: 'aras-pagination__next-button',
	disabled: true,
	tooltip_template: 'Next Page'
});
paginationControls.set('pagination_status_node', {
	type: 'pageStatusNode',
	id: 'pagination_status_node',
	currentPageNumber: 1,
	disabled: true
});
paginationControls.set('pagination_status_separator', {
	type: 'separator',
	id: 'pagination_status_separator',
	hidden: true
});
paginationControls.set('pagination_total_results_status_node', {
	type: 'totalResultStatusNode',
	id: 'pagination_total_results_status_node'
});
paginationControls.set('pagination_more_button', {
	type: 'button',
	id: 'pagination_more_button',
	image: images.more,
	disabled: true,
	tooltip_template: 'Show Total Pages and Results',
	cssClass: 'aras-icon_grayscale'
});
paginationControls.set('pagination_separator', {
	type: 'separator',
	id: 'pagination_separator'
});
paginationControls.set('pagination_page_size', {
	type: 'textbox',
	id: 'pagination_page_size',
	value: '',
	size: '6.667',
	image: images.pageSize,
	tooltip_template: 'Results per Page',
	validationMessageResource: 'pagination.invalid_value'
});
paginationControls.set('pagination_max_results', {
	type: 'textbox',
	id: 'pagination_max_results',
	value: '',
	size: '6.667',
	image: images.maxResults,
	tooltip_template: 'Maximum Results',
	validationMessageResource: 'pagination.invalid_value'
});
paginationControls.set('pagination_max_reached', {
	type: 'text',
	id: 'pagination_max_reached',
	hidden: true,
	label: 'Max Reached',
	tooltip_template: 'Max Reached'
});

const paginationControlsIds = [
	'pagination_prev_button',
	'pagination_next_button',
	'pagination_status_node',
	'pagination_status_separator',
	'pagination_total_results_status_node',
	'pagination_more_button',
	'pagination_separator',
	'pagination_page_size',
	'pagination_max_results',
	'pagination_max_reached'
];

export { paginationControls, paginationControlsIds };
