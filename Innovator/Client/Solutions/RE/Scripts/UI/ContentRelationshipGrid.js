function initializeContentRelationshipsGrid(container) { // eslint-disable-line no-unused-vars
	const topWindow = container.aras.getMostTopWindowWithAras(container);

	const baseUpdateRelWithInfoFromSearch = container.updateRelationshipsWithInformationFromSearch;
	const baseUpdateRow = container.updateRow;

	const baseClaimBy = container.Grid.formatters['claim by'];
	container.Grid.formatters['claim by'] = function(headId, rowId, value, grid, metadata) {
		const rowInfo = grid.rows._store.get(rowId);
		return rowInfo['@aras.isDirtyContent'] ?
			container.Grid.formatters.img(headId, rowId, '../../../../images/Edit.svg', grid) :
			baseClaimBy(headId, rowId, value, grid, metadata);
	};

	const refreshContentGrid = function() {
		const searchContainer = container.searchContainer;
		if (searchContainer && searchContainer.runSearch) {
			searchContainer.runSearch();
		}
	};

	const fireEvent = function(name, optionalParams) {
		const evnt = topWindow.document.createEvent('Event');
		evnt.initEvent(name, true, false);
		Object.assign(evnt, optionalParams || {});
		topWindow.document.dispatchEvent(evnt);
	};

	topWindow.document.addEventListener('refreshContentGrid', refreshContentGrid, false);

	container.updateRelationshipsWithInformationFromSearch = function() {
		const tabId = topWindow.dijit.byId('viewers').getCurrentTabId();
		if (tabId === 'formTab') {
			baseUpdateRelWithInfoFromSearch.apply(container, arguments);
		};
		fireEvent('setItemWithRelationships');
	};

	container.updateRow = function(relationshipNode, relatedNode) {
		baseUpdateRow.apply(container, arguments);

		if (relatedNode) {
			if (!relatedNode.getAttribute('isNew')) {
				fireEvent('RelationshipsUpdateRow', {
					requirementToReplaceId: relatedNode.selectSingleNode('config_id').text,
					requirementId: relatedNode.getAttribute('id'),
					eventType: 'update'
				});
			}
		} else {
			const relationshipId = relationshipNode.getAttribute('id');
			const relationshipToDelete = container.item.selectSingleNode('Relationships/Item[@id="' + relationshipId + '"]');
			relationshipToDelete.parentNode.removeChild(relationshipToDelete);

			const chapter = container.aras.getItemProperty(relationshipNode, 'chapter');
			const reqId = container.techDocContainer.domNode.contentWindow.structuredDocument.GetReqIdBySectionNumber(chapter);

			fireEvent('RelationshipsUpdateRow', {
				reqsId: {
					currentReq: reqId
				},
				eventType: 'delete'
			});

			refreshContentGrid();
		}
	};
}
