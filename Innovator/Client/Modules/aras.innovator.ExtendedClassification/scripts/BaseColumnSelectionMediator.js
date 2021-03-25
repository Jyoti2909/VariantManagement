function BaseColumnSelectionMediator(xClassBarNode) {
	this.xClassBarWrapper = new XClassBar(itemTypeName, xClassBarNode);
	this._onComponentDidMount = this._onComponentDidMount.bind(this);
}

BaseColumnSelectionMediator.prototype.cuiToolbarFormatter = function (
	item,
	options
) {
	const infernoFlags = ArasModules.utils.infernoFlags;
	const columnSelectNode = Inferno.createVNode(
		Inferno.getFlagsForElementVnode('div'),
		'div',
		'column-select-block hidden',
		null,
		infernoFlags.hasInvalidChildren,
		{
			id: 'column_select_block'
		}
	);
	const columnSelectDropdownBox = Inferno.createVNode(
		Inferno.getFlagsForElementVnode('div'),
		'div',
		'aras-dropdown',
		columnSelectNode,
		infernoFlags.hasVNodeChildren
	);
	const contentNodes = [];
	if (item.image) {
		const iconNode = ArasModules.SvgManager.createInfernoVNode(item.image);

		iconNode.className = 'aras-button__icon';
		contentNodes.push(iconNode);
	}
	contentNodes.push(
		Inferno.createVNode(
			Inferno.getFlagsForElementVnode('span'),
			'span',
			'aras-button__menu-arrow',
			null,
			infernoFlags.hasInvalidChildren
		)
	);
	const buttonNodeAttributes = {
		title: item.tooltip_template,
		disabled: item.disabled,
		'dropdown-button': '',
		tabindex: options.focused ? '0' : '-1',
		'aria-haspopup': 'dialog'
	};
	const buttonNode = Inferno.createVNode(
		Inferno.getFlagsForElementVnode('button'),
		'button',
		'aras-button',
		contentNodes,
		infernoFlags.unknownChildren,
		buttonNodeAttributes
	);
	return Inferno.createVNode(
		Inferno.getFlagsForElementVnode('aras-dropdown'),
		'aras-dropdown',
		'column-select-dropdown aras-dropdown-container',
		[buttonNode, columnSelectDropdownBox],
		infernoFlags.hasNonKeyedChildren,
		{
			'data-id': item.id
		},
		null,
		this._onComponentDidMount
	);
};

BaseColumnSelectionMediator.prototype._onComponentDidMount = function (
	columnSelectContainer
) {
	if (!columnSelectContainer) {
		return;
	}
	columnSelectionControl.attachTo(
		document.getElementById('column_select_block')
	);
	columnSelectContainer.addEventListener(
		'dropdownbeforeopen',
		this.columnSelectionOnBeforeOpen.bind(this)
	);
	columnSelectContainer.addEventListener(
		'dropdownclosed',
		this.apply.bind(this)
	);
	const dropdownNode = columnSelectContainer.querySelector('.aras-dropdown');
	dropdownNode.setAttribute('role', 'dialog');
	dropdownNode.setAttribute(
		'aria-label',
		aras.getResource('', 'refine_dialog.aria_label')
	);
};

BaseColumnSelectionMediator.prototype.columnSelectionOnBeforeOpen = function () {
	const data = this.getDataForColumnSelection(itemTypeName, visiblePropNds);
	columnSelectionControl.node.classList.remove('hidden');
	columnSelectionControl.initTree(itemTypeName, data.columns, data.xClassList);
	const currentSearchQueryItem = aras.newIOMItem();
	currentSearchQueryItem.loadAML(searchContainer._getSearchQueryAML());
	xClassSearchWrapper.initData(
		itemTypeName,
		data.xClassList,
		currentSearchQueryItem.node,
		currentSearchMode.supportXClassSearch
	);
	xClassSearchWrapper.updateColumnSelection();
	xClassSearchWrapper.toggle();
};

BaseColumnSelectionMediator.prototype.clearSearch = function () {
	this.xClassBarWrapper.setQueryText();
	xClassSearchWrapper.xClassSearchControl.clearXClassSearchCriteria(
		currQryItem.item
	);
	searchContainer._updateAutoSavedSearch(currQryItem.item.xml);
	searchContainer._setAml(currQryItem.item.xml);
};

BaseColumnSelectionMediator.prototype.closeColumnSelectionWindow = function () {
	if (window.columnSelectionControl && columnSelectionControl.node) {
		columnSelectionControl.node.classList.add('hidden');
	}
};

BaseColumnSelectionMediator.prototype.closeXClassBarWindow = function () {
	if (this.xClassBarWrapper && this.xClassBarWrapper.container) {
		this.xClassBarWrapper.container.classList.add('hidden');
	}
};

BaseColumnSelectionMediator.prototype.updateXClassBar = function () {
	this.xClassBarWrapper.updateXClassBar(grid.getSelectedId());
};

BaseColumnSelectionMediator.prototype.getDataForColumnSelection = function (
	itemTypeName,
	propsNds
) {
	const xClassList = xPropertiesUtils.getXClassificationTreesForItemType(
		aras.getItemTypeId(itemTypeName)
	);
	return {
		columns: this.getColumns(propsNds),
		xClassList: xClassList
	};
};

BaseColumnSelectionMediator.prototype.apply = function () {
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
		}
	}
	if (columnSelectionControl.isDirty) {
		const columns = columnSelectionControl.getCheckedColumns();
		const columnIdToColumn = {};
		columnSelectionControl.columns.forEach(function (column) {
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

BaseColumnSelectionMediator.prototype.getColumns = function (propNds) {
	const colOrderArr = grid.getLogicalColumnOrder().split(';');
	const propertyItems = {};
	let propsToShow = [];

	if (propNds) {
		for (let i = 0; i < propNds.length; i++) {
			const propertyName = aras.getItemProperty(propNds[i], 'name');
			propertyItems[propertyName] = propNds[i];
		}
	}

	for (let i = 0; i < colOrderArr.length; i++) {
		let isValidProperty = false;
		let hidden = grid.getColWidth(i) == 0 ? true : false;
		let propertyLabel = '';
		let propertyWidth = 100;
		let columnName = grid.GetColumnName(i);
		let propertyName;
		let propertyId;
		let propSortOrder;

		if (columnName === 'L') {
			propertyLabel = aras.getResource('', 'common.claimed');
			propertyWidth = 32;
			isValidProperty = true;
		} else {
			propertyName = columnName.substr(0, columnName.length - 2);
			const propertyItem = propertyItems[propertyName];
			if (propertyItem) {
				const tempWidth = parseInt(
					aras.getItemProperty(propertyItem, 'column_width')
				);
				propSortOrder = parseInt(
					aras.getItemProperty(propertyItem, 'sort_order')
				);

				propertyLabel =
					aras.getItemProperty(propertyItem, 'label') || propertyName;
				propertyId = aras.getItemProperty(propertyItem, 'id');

				if (!isNaN(tempWidth)) {
					propertyWidth = tempWidth;
				}
				isValidProperty = true;
			}
		}
		if (!isValidProperty) {
			continue;
		}
		propsToShow.push({
			colNumber: i,
			propSortOrder: propSortOrder || 0,
			name: propertyName,
			label: propertyLabel,
			width: propertyWidth,
			hidden: hidden,
			propertyId: propertyId
		});
	}
	return propsToShow;
};
