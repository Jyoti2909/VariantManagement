export default {
	pageStatusNode: (item, { toolbar }) => {
		const pageSize = toolbar._prevPageSize || toolbar.pageSize;
		const totalResults = parseInt(item.totalResults) || 0;
		const totalPages =
			pageSize && totalResults ? Math.ceil(totalResults / pageSize) : 1;
		const paginationStatusLabel =
			item.totalResults || item.totalResults === 0
				? aras.getResource(
						'',
						'pagination.page_X_of_Y',
						item.currentPageNumber,
						totalPages
				  )
				: aras.getResource('', 'pagination.page', item.currentPageNumber);
		const classNode =
			'aras-pagination__status' +
			(item.disabled ? ' aras-pagination__status_disabled' : '');

		return (
			<span className={classNode} data-id={item.id} tabindex="0">
				{paginationStatusLabel}
			</span>
		);
	},
	totalResultStatusNode: (item, { toolbar }) => {
		let classNode = 'aras-pagination__status';
		if (!item.totalResults && item.totalResults !== 0) {
			classNode += ' aras-hide';
		} else if (item.disabled) {
			classNode += ' aras-pagination__status_disabled';
		}

		return (
			<span className={classNode} data-id={item.id} tabindex="0">
				{aras.getResource('', 'pagination.results', item.totalResults)}
			</span>
		);
	}
};
