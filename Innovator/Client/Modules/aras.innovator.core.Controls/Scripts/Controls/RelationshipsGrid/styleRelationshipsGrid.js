const icons = {
	claimColumn: '../images/ClaimColumn.svg'
};

window.customDojoGridStyle = {
	getColumnHeaderHtml: function (columnName, sortProperty) {
		ArasModules.SvgManager.enqueue(Object.values(icons));
		const dojoxGridSortNode = document.createElement('div');
		dojoxGridSortNode.classList.add('dojoxGridSortNode');

		const dojoxGridColCaption = document.createElement('div');
		dojoxGridColCaption.classList.add('dojoxGridColCaption');

		if (/^\s+$/.test(columnName)) {
			const span = document.createElement('span');
			span.classList.add('dojoImgClaimWrapper');
			const img = ArasModules.SvgManager.createHyperHTMLNode(
				icons.claimColumn,
				{ class: 'dojoImgClaim' }
			);
			span.appendChild(img);
			dojoxGridColCaption.appendChild(span);
		} else {
			const wrapperForTitle = document.createElement('span');
			wrapperForTitle.classList.add('aras-grid-head-cell-label-text');
			wrapperForTitle.textContent = columnName;
			dojoxGridColCaption.appendChild(wrapperForTitle);
		}

		const arrowNode = document.createElement('span');
		arrowNode.classList.add('aras-icon-long-arrow', 'aras-grid-head-cell-sort');

		const sortProps = window.grid.grid_Experimental.getSortProps();
		if (sortProperty) {
			if (sortProps.length > 3) {
				const index = sortProps.indexOf(sortProperty);
				arrowNode.textContent = index === -1 ? '' : index;
			}
			arrowNode.classList.add(
				'dojo-grid-arrow-button',
				!sortProperty.descending
					? 'aras-icon-long-arrow_up'
					: 'aras-icon-long-arrow_down'
			);
		} else {
			arrowNode.classList.add('aras-icon-long-arrow_up');
		}
		dojoxGridColCaption.appendChild(arrowNode);
		dojoxGridSortNode.appendChild(dojoxGridColCaption);

		return dojoxGridSortNode.outerHTML;
	},
	supportGridIds: ['gridTD'],
	classNames: {
		relationshipsCells: 'dojoxRelationshipCell'
	}
};
