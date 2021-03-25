function RelationshipColumnSelectionMediator(xClassBarNode) {
	BaseColumnSelectionMediator.apply(this, arguments);
	this.xClassBarWrapper = new XClassBar(
		relatedItemTypeName,
		xClassBarNode,
		relationshipTypeName
	);
}
RelationshipColumnSelectionMediator.prototype = Object.create(
	BaseColumnSelectionMediator.prototype
);
RelationshipColumnSelectionMediator.prototype.constructor = RelationshipColumnSelectionMediator;

RelationshipColumnSelectionMediator.prototype._onComponentDidMount = function (
	columnSelectContainer
) {
	columnSelectionControl.attachTo(
		columnSelectContainer.querySelector('#column_select_block')
	);
	columnSelectContainer.addEventListener(
		'dropdownbeforeopen',
		this.columnSelectionOnBeforeOpen.bind(this)
	);
	columnSelectContainer.addEventListener(
		'dropdownclosed',
		this.apply.bind(this)
	);

	xClassSearchWrapper.xClassBarBtn.addEventListener('click', function (e) {
		refreshGridSize();
	});
};

RelationshipColumnSelectionMediator.prototype.columnSelectionOnBeforeOpen = function () {
	const dataRelatedItem = this.getDataForColumnSelection(
		relatedItemTypeName,
		RelatedVisibleProps
	);
	const dataRelationshipItem = this.getDataForColumnSelection(
		relationshipTypeName,
		DescByVisibleProps,
		true
	);
	columnSelectionControl.initTree(
		relatedItemTypeName,
		dataRelatedItem.columns,
		dataRelatedItem.xClassList,
		relationshipTypeName,
		dataRelationshipItem.columns,
		dataRelationshipItem.xClassList
	);
	const currentSearchQueryItem = aras.newIOMItem();
	currentSearchQueryItem.loadAML(searchContainer._getSearchQueryAML());
	xClassSearchWrapper.initData(
		relatedItemTypeName,
		dataRelatedItem.xClassList,
		currentSearchQueryItem.node,
		currentSearchMode.supportXClassSearch,
		relationshipTypeName,
		dataRelationshipItem.xClassList
	);
	columnSelectionControl.typeAhead.setState({
		value: columnSelectionControl.typeAhead.state.list[0].label
	});
	columnSelectionControl.selectProperty(
		columnSelectionControl.typeAhead.state.list[0].value
	);
	xClassSearchWrapper.updateColumnSelection();
	xClassSearchWrapper.toggle();
};

RelationshipColumnSelectionMediator.prototype.updateXClassBar = function () {
	const relID = grid.getSelectedId();
	const relItem = item.selectSingleNode(
		'Relationships/Item[@id="' + relID + '"]'
	);
	this.xClassBarWrapper.updateXClassBar(
		aras.getItemProperty(relItem, 'related_id'),
		relID
	);
};

RelationshipColumnSelectionMediator.prototype.apply = function () {
	if (currentSearchMode.supportXClassSearch) {
		let amlQuery = xClassSearchWrapper.xClassSearchControl.getQueryAml();
		if (amlQuery) {
			const xClassSearch = aras.newIOMItem();
			xClassSearch.loadAML(amlQuery);
			searchContainer._updateAutoSavedSearch(xClassSearch.node.xml);
			searchContainer._setAml(xClassSearch.node.xml);
		}
		if (!this.xClassBarWrapper.container.classList.contains('hidden')) {
			let xClassTextQuery = xClassSearchWrapper.xClassSearchControl.getQueryForXClassBar();
			this.xClassBarWrapper.setQueryText(xClassTextQuery);
			refreshGridSize();
		}
	}
	if (columnSelectionControl.isDirty) {
		const columns = columnSelectionControl.getCheckedColumns();
		const columnIdToColumn = {};
		columnSelectionControl.columns.forEach(function (column) {
			columnIdToColumn[column.propertyId] = column;
		});
		columnSelectionControl.relationshipsColumns.forEach(function (column) {
			columnIdToColumn[column.propertyId] = column;
		});
		columns.forEach(
			function (column) {
				grid.SetColumnVisible(
					columnIdToColumn[column.propertyId].colNumber,
					!column.hidden,
					columnIdToColumn[column.propertyId].width
				);
			}.bind(this)
		);
		const key = aras.MetadataCache.CreateCacheKey(
			'getSelectCriteria',
			itemTypeID,
			searchContainer.searchLocation == 'Relationships Grid'
		);
		aras.MetadataCache.SetItem(key);

		const newSearch = aras.newIOMItem();
		newSearch.loadAML(searchContainer._getDefaultSearchQueryAML());

		const oldSearch = aras.newIOMItem();
		oldSearch.loadAML(searchContainer._getSearchQueryAML());
		oldSearch.setAttribute('select', newSearch.getAttribute('select'));

		searchContainer._updateAutoSavedSearch(oldSearch.node.xml);
		searchContainer._setAml(oldSearch.node.xml);
		searchContainer.runSearch();
	}
};

RelationshipColumnSelectionMediator.prototype.getColumns = function (
	propNds,
	isRelationship
) {
	const colOrderArr = grid.getLogicalColumnOrder().split(';');
	const DRL = isRelationship ? 'D' : 'R';
	let propsToShow = [];
	const relationshipIdPrefix = 'R_';
	const relationshipNamePrefix = '[R]';

	const propertyItems = Array.prototype.reduce.call(
		propNds || [],
		function (res, node) {
			const name = aras.getItemProperty(node, 'name');
			res[name] = node;
			return res;
		},
		{}
	);

	return colOrderArr
		.filter(function (columnName) {
			return (
				(columnName === 'L' && !isRelationship) ||
				(columnName.endsWith(DRL) && propertyItems[columnName.slice(0, -2)])
			);
		})
		.map(function (columnName) {
			const index = grid.getColumnIndex(columnName);
			const hidden = grid.getColWidth(index) === 0;
			if (columnName === 'L' && !isRelationship) {
				return {
					colNumber: index,
					propSortOrder: 0,
					label: aras.getResource('', 'common.claimed'),
					width: 24,
					hidden: hidden,
					DRL: DRL
				};
			}

			let propertyName = columnName.slice(0, -2);
			const propertyItem = propertyItems[propertyName];
			const propertyWidth = parseInt(
				aras.getItemProperty(propertyItem, 'column_width') || 100
			);
			const propSortOrder = parseInt(
				aras.getItemProperty(propertyItem, 'sort_order') || 0
			);
			let propertyLabel = aras.getItemProperty(
				propertyItem,
				'label',
				propertyName
			);
			let propertyId = aras.getItemProperty(propertyItem, 'id');

			if (isRelationship) {
				propertyId = relationshipIdPrefix + propertyId;
				propertyName = relationshipNamePrefix + ' ' + propertyName;
				propertyLabel = relationshipNamePrefix + ' ' + propertyLabel;
			}
			return {
				colNumber: index,
				propSortOrder: propSortOrder,
				name: propertyName,
				label: propertyLabel,
				width: propertyWidth,
				hidden: hidden,
				propertyId: propertyId,
				DRL: DRL
			};
		});
};

RelationshipColumnSelectionMediator.prototype.getDataForColumnSelection = function (
	itemTypeName,
	propsNds,
	isRelationship
) {
	const xClassList = xPropertiesUtils.getXClassificationTreesForItemType(
		aras.getItemTypeId(itemTypeName)
	);
	return {
		columns: this.getColumns(propsNds, isRelationship),
		xClassList: xClassList
	};
};
