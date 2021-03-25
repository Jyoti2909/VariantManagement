(function () {
	const pathToResource = '../Modules/aras.innovator.ExtendedClassification/';

	const xClassSearchWrapper = {
		xClassSearchControl: xClassSearchControl,
		initResources: function () {
			this.recources = {
				headerLabel: aras.getResource(pathToResource, 'xClassSearchControl'),
				showAll: aras.getResource(pathToResource, 'classEditor.tree.show_all'),
				classFiltered: aras.getResource(
					pathToResource,
					'classEditor.tree.class_filtered'
				),
				notFound: aras.getResource(
					pathToResource,
					'xClassSearchControl.not_found'
				)
			};
		},
		initData: function (
			currentItemTypeName,
			xClassTrees,
			query,
			supportXClassSearch,
			relationshipTypeName,
			relationshipXClassTrees
		) {
			itemTypeName = currentItemTypeName;
			relationshipItemTypeName = relationshipTypeName;
			xClassSearchControl.supportXClassSearch = supportXClassSearch || false;
			xClassSearchControl.init(xClassTrees, relationshipXClassTrees);
			if (query) {
				xClassSearchControl.parseQuery(query);
			}

			if (!xClassSearchControl.currentSearchFilter) {
				xClassSearchControl.currentSearchFilter = xClassSearchFilters.ALL;
			}
			this.setFilter(xClassSearchControl.currentSearchFilter.value);

			if (!xClassSearchControl.logicState) {
				xClassSearchControl.logicState = XClassSearchCheckbox.LogicStates.AND;
			}
			this.setLogicStateHtml(xClassSearchControl.logicState);
		},
		attachTo: function (node) {
			this.node = node;
			const sideHeader = document.createElement('div');
			sideHeader.classList.add('side-header');
			sideHeader.innerHTML = '<span>' + this.recources.headerLabel + '</span>';
			this.node.appendChild(sideHeader);
			this.node.appendChild(this._getHtmlSearchPanel());
			this.node.appendChild(this._getHtmlFilteredPanel());
			this.node.appendChild(this._getHtmlNotFoundBlock());
			this.node.appendChild(this._getHtmlTreeBlock());
			xClassSearchControl.initGrid(this.treeBlock);
		},
		setFilter: function (filterValue) {
			const state = xClassSearchFilters.getFilterByValue(filterValue);
			xClassSearchControl.setSearchFilter(state);
			if (state === xClassSearchFilters.ALL) {
				this.setVisibleFilteredPanel(false);
			} else {
				this.setVisibleFilteredPanel(true);
				this.setFilteredPanelText(state.filterPanelLabel);
			}
			this.setSelectFilter(state.value);
			this.searchInput.querySelector('input[name="search"]').value = '';
		},
		setSelectFilter: function (value) {
			const select = this.node.querySelector('.search-filter');
			const prevSelectItem = select.querySelector('.selected');
			const nextSelectedItem = select.querySelector(
				'li[data-value="' + value + '"]'
			);
			if (prevSelectItem) {
				prevSelectItem.classList.remove('selected');
			}
			if (nextSelectedItem) {
				nextSelectedItem.classList.add('selected');
			}
		},
		setVisibleFilteredPanel: function (show) {
			this.filteredPanel.classList.toggle('hidden', !show);
		},
		setFilteredPanelText: function (text) {
			this.filteredPanel.firstChild.textContent = text;
		},
		updateColumnSelection: function () {
			if (
				columnSelectionControl.grid &&
				columnSelectionControl.grid.rows._store.size > 0
			) {
				const xClassesIds = xClassSearchFilters.ACTIVE_FILTERS.filter();
				const xClassesArr = [];
				const allXClasses = xClassSearchControl.allXClasses;
				xClassesIds.forEach(function (id) {
					const xClass = allXClasses.get(id);
					if (xClass) {
						xClassesArr.push(xClass);
					}
				});
				columnSelectionControl.filterByXClasses(xClassesArr);
			}
		},
		toggle: function () {
			if (!this.node) {
				return;
			}
			this.node.classList.toggle('hidden');
			xClassSearchControl.grid.render();
		},
		search: function (event) {
			const searchValue = event.target.value;
			if (!searchValue) {
				xClassSearchWrapper.setFilter('ALL');
				return;
			}
			xClassSearchControl.search(searchValue);
			this.setVisibleFilteredPanel(true);
			const label = aras.getResource(
				pathToResource,
				'xClassSearchControl.filter.panel.search_by',
				searchValue
			);
			this.setFilteredPanelText(label);
		},
		clearFilters: function () {
			xClassSearchControl.clearFilters();
		},
		showNotFound: function (show) {
			if (!this.node) {
				return;
			}
			this.notFoundBlock.classList.toggle('hidden', !show);
			this.treeBlock.classList.toggle('hidden', show);
		},
		setLogicStateHtml: function (logicState) {
			this.logicFilterBtn.className = '';
			this.logicFilterBtn.classList.add('logic-filter', logicState.class);
			xClassSearchControl.updateOrderCheckboxes();
		},
		onClickLogic: function () {
			xClassSearchControl.logicState =
				xClassSearchControl.logicState === XClassSearchCheckbox.LogicStates.AND
					? XClassSearchCheckbox.LogicStates.OR
					: XClassSearchCheckbox.LogicStates.AND;
			this.setLogicStateHtml(xClassSearchControl.logicState);
		},
		toggleXClassBar: function () {
			this.xClassBarBtn.classList.toggle('aras-compat-toolbar__toggle-button');
			columnSelectionMediator.xClassBarWrapper.toggle();
			columnSelectionMediator.updateXClassBar();
			columnSelectionMediator.xClassBarWrapper.setQueryText(
				xClassSearchControl.getQueryForXClassBar()
			);
		},
		setClickableFilters: function (canClickable) {
			if (xClassSearchControl.canClickableFilters !== canClickable) {
				xClassSearchControl.canClickableFilters = canClickable;
				this.clearFilters();
			}
		},
		_getHtmlSearchPanel: function () {
			this.searchPanel = document.createElement('div');
			this.searchPanel.classList.add('search-panel');

			this.xClassBarBtn = document.createElement('span');
			this.xClassBarBtn.classList.add('xClassBar-toggle-btn');
			this.xClassBarBtn.addEventListener(
				'click',
				xClassSearchWrapper.toggleXClassBar.bind(this)
			);
			if (
				columnSelectionMediator &&
				columnSelectionMediator.xClassBarWrapper &&
				!columnSelectionMediator.xClassBarWrapper.container.classList.contains(
					'hidden'
				)
			) {
				this.xClassBarBtn.classList.toggle(
					'aras-compat-toolbar__toggle-button'
				);
			}

			this.searchInput = document.createElement('div');
			this.searchInput.classList.add('search');
			let selectHtml =
				'<div class="dropdown-filter">' +
				'<div class="dropdown-btn"><span></span></div>' +
				'<ul class="search-filter aras-hide" tabindex="0">';
			for (let key in xClassSearchFilters) {
				const filter = xClassSearchFilters[key];
				selectHtml +=
					'<li data-value="' + filter.value + '">' + filter.label + '</li>';
			}
			selectHtml += '</ul></div>';
			this.searchInput.innerHTML =
				'<input name="search" oninput="xClassSearchWrapper.search(event)">' +
				'<span class="loupe-icon"></span>' +
				selectHtml;

			const dropdown = this.searchInput.querySelector('.dropdown-filter');
			const dropdownButton = this.searchInput.querySelector('.dropdown-btn');
			const searchFilter = this.searchInput.querySelector('.search-filter');
			searchFilter.addEventListener('blur', function () {
				searchFilter.classList.toggle('aras-hide', true);
			});
			dropdownButton.addEventListener('mousedown', function () {
				searchFilter.classList.toggle('aras-hide');
				if (!searchFilter.classList.contains('aras-hide')) {
					setTimeout(function () {
						searchFilter.focus();
					}, 0);
				}
			});
			searchFilter.addEventListener(
				'click',
				function (e) {
					const value = e.target.dataset.value;
					if (value) {
						this.setFilter(value);
						columnSelectionControl.node.parentElement.focus();
						searchFilter.classList.toggle('aras-hide', true);
					}
				}.bind(this)
			);

			this.logicFilterBtn = document.createElement('span');
			this.logicFilterBtn.classList.add('logic-filter');
			this.logicFilterBtn.addEventListener(
				'click',
				xClassSearchWrapper.onClickLogic.bind(this)
			);

			this.searchPanel.appendChild(this.xClassBarBtn);
			this.searchPanel.appendChild(this.searchInput);
			this.searchPanel.appendChild(this.logicFilterBtn);

			return this.searchPanel;
		},
		_getHtmlFilteredPanel: function () {
			this.filteredPanel = document.createElement('div');
			this.filteredPanel.classList.add('filtered', 'hidden');
			this.filteredPanel.innerHTML =
				'<span>' +
				this.recources.classFiltered +
				'</span>' +
				'<span onclick="xClassSearchWrapper.setFilter(\'' +
				xClassSearchFilters.ALL.value +
				'\')">' +
				this.recources.showAll +
				'</span>';
			return this.filteredPanel;
		},
		_getHtmlNotFoundBlock: function () {
			this.notFoundBlock = document.createElement('div');
			this.notFoundBlock.classList.add('no-result', 'hidden');
			this.notFoundBlock.innerText = this.recources.notFound;
			return this.notFoundBlock;
		},
		_getHtmlTreeBlock: function () {
			this.treeBlock = document.createElement('div');
			this.treeBlock.classList.add('tree');
			return this.treeBlock;
		}
	};

	window.xClassSearchWrapper = xClassSearchWrapper;
})();
