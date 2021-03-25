define([
	'dojo',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/parser',
	'dojo/io-query',
	'dijit/popup',
	'ES/Scripts/Classes/Utils',
	'ES/Scripts/Classes/Request/SelectQueryServiceRequest',
	'ES/Scripts/Controls/ActiveFilterChips',
	'ES/Scripts/Controls/SearchPanel',
	'ES/Scripts/Controls/FiltersPanel',
	'ES/Scripts/Controls/ResultPanel',
	'ES/Scripts/Controls/Pagination'
], function (
	dojo,
	declare,
	lang,
	parser,
	ioQuery,
	popup,
	Utils,
	SelectQueryServiceRequest,
	ActiveFilterChips,
	SearchPanel,
	FiltersPanel,
	ResultPanel,
	Pagination
) {
	return declare(null, {
		_arasObj: null,
		_utils: null,

		_wasExecuted: false,

		_isPageChange: false,

		_topFacets: new Map(),

		//Requests
		_selectQueryServiceRequest: null,
		_pageChangeServiceRequest: null,

		//Widgets
		_activeFilterChipsWidget: null,
		_searchPanelWidget: null,
		_filtersPanelWidget: null,
		_resultsPanelWidget: null,
		_paginationPanelWidget: null,

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});

			//Show container
			var layoutContainer = document.getElementById('layoutContainer');
			this._utils.setNodeVisibility(layoutContainer, true);

			//Parse layout
			parser.parse();

			/*---------------------------------------------------------------------------------------------*/
			//Init configurations for search

			var resItm = this._arasObj.newIOMItem(
				'Method',
				'ES_InitSearchConfigurations'
			);
			resItm.apply();

			this._topFacets = this._utils.getTopFacets();

			/*---------------------------------------------------------------------------------------------*/
			//Create new request object

			this._selectQueryServiceRequest = new SelectQueryServiceRequest({
				arasObj: this._arasObj,
				topFacets: this._topFacets
			});
			this._selectQueryServiceRequest.restoreDefaultQueryFacets();

			/*---------------------------------------------------------------------------------------------*/
			//Create new request object for page changes
			this._pageChangeServiceRequest = new SelectQueryServiceRequest({
				arasObj: this._arasObj,
				topFacets: this._topFacets
			});

			/*---------------------------------------------------------------------------------------------*/
			//Show search toolbar

			this._searchPanelWidget = new SearchPanel({
				arasObj: this._arasObj,
				onSearch: this._onSearch.bind(this)
			});

			var mainPageSearchContainer = dojo.byId('searchContainer');
			if (!this._utils.isNullOrUndefined(mainPageSearchContainer)) {
				this._searchPanelWidget.placeAt(mainPageSearchContainer);
			}
			this._searchPanelWidget.startup();

			/*---------------------------------------------------------------------------------------------*/
			//Show filters

			this._filtersPanelWidget = new FiltersPanel({
				arasObj: this._arasObj,
				onFiltersApply: this._onFiltersApply.bind(this),
				onFiltersReset: this._onFiltersReset.bind(this),
				onFilterReset: this._onFilterReset.bind(this),
				onFiltersChange: this._onFiltersChange.bind(this),
				onFilterLoadOptions: this._onFilterLoadOptions.bind(this)
			});

			var mainPageFiltersContainer = dojo.byId('filtersContainer');
			if (!this._utils.isNullOrUndefined(mainPageFiltersContainer)) {
				this._filtersPanelWidget.placeAt(mainPageFiltersContainer);
			}
			this._filtersPanelWidget.startup();

			/*---------------------------------------------------------------------------------------------*/
			//Show results

			this._resultsPanelWidget = new ResultPanel({
				arasObj: this._arasObj
			});

			var mainPageResultsContainer = dojo.byId('resultsContainer');
			if (!this._utils.isNullOrUndefined(mainPageResultsContainer)) {
				this._resultsPanelWidget.placeAt(mainPageResultsContainer);
			}
			this._resultsPanelWidget.startup();

			/*---------------------------------------------------------------------------------------------*/
			//Show active filter chips
			this._activeFilterChipsWidget = new ActiveFilterChips({
				arasObj: this._arasObj,
				topFacets: this._topFacets,
				onChipsChange: this._onChipsChange.bind(this),
				onChipsToggle: this._onChipsToggle.bind(this)
			});
			this._showActiveFilterChips();

			/*---------------------------------------------------------------------------------------------*/
			//Show pagination panel
			this._paginationPanelWidget = new Pagination({
				onPageChange: this._onPageChange.bind(this)
			});
			this._paginationPanelWidget.attach(dojo.byId('paginatorContainer'));

			/*---------------------------------------------------------------------------------------------*/
			//Perform search if have parameter

			var queryObject = ioQuery.queryToObject(window.location.search.slice(1));

			if (!this._utils.isNullOrUndefined(queryObject.q)) {
				this._searchPanelWidget.setQueryText(queryObject.q);

				this._onSearch();
			} else {
				this._initBlankSearch();
			}

			var tabTitle = this._getTitle();
			this._utils.updateTabTitle(tabTitle);

			/*---------------------------------------------------------------------------------------------*/
			//Event listeners

			document.addEventListener('keyup', this._onDocumentKeyUp.bind(this));
			document.body.addEventListener('click', this._closePopup.bind(this));
		},

		/**
		 * Refresh search page layout
		 */
		_refreshLayout: function () {
			dijit.byId('layoutContainer').resize();
		},

		/**
		 * Init blank search state
		 *
		 * If an Enterprise Search is executed without any query
		 * terms entered in the field, a Blank search is run.
		 */
		_initBlankSearch: function () {
			var topFacets = this._loadTopFacets();
			var isAnyOptionSelected = false;

			if (topFacets.length > 0) {
				topFacets.forEach(
					function (facet) {
						isAnyOptionSelected =
							isAnyOptionSelected || facet.isAnyOptionSelected();
						this._selectQueryServiceRequest.updateQueryFacet(facet);
					}.bind(this)
				);

				this._filtersPanelWidget.items = topFacets;
				this._filtersPanelWidget.update();

				this._utils.setNodeDisabledState(
					this._filtersPanelWidget.filtersPanelApplyAllButton,
					false
				);
				this._utils.setNodeDisabledState(
					this._filtersPanelWidget.filtersPanelClearAllButton,
					!isAnyOptionSelected
				);
			}
		},

		/**
		 * Load Top Facets
		 *
		 * @returns {Facet[]} List of Top Facets
		 */
		_loadTopFacets: function () {
			if (this._topFacets.size === 0) {
				return [];
			}

			var selectQueryServiceRequestFacet = new SelectQueryServiceRequest({
				arasObj: this._arasObj,
				topFacets: this._topFacets
			});

			selectQueryServiceRequestFacet.rows = 0;
			this._topFacets.forEach(function (value, key) {
				selectQueryServiceRequestFacet.setRequestFacet(key);
			});
			selectQueryServiceRequestFacet.restoreDefaultQueryFacets();
			selectQueryServiceRequestFacet.run();

			return selectQueryServiceRequestFacet.getResultFacets();
		},

		/**
		 * Perform search
		 *
		 * @private
		 */
		_search: function () {
			this._utils.toggleSpinner(
				true,
				function () {
					try {
						this._sendRequest();
						this._update();
						if (!this._isPageChange) {
							this._updatePageChangeServiceRequest();
						}
						this._wasExecuted = true;
					} catch (ex) {
						this._arasObj.AlertError(ex.message);
					} finally {
						this._isPageChange = false;
						this._utils.toggleSpinner(false, null);
					}
				}.bind(this)
			);
		},

		/**
		 * Update UI
		 *
		 * @private
		 */
		_update: function () {
			var serviceRequest = this._isPageChange
				? this._pageChangeServiceRequest
				: this._selectQueryServiceRequest;
			var rows = serviceRequest.rows;
			var start = serviceRequest.start;
			var totalRows = serviceRequest.getTotalRows();
			var resultItems = serviceRequest.getResultItems();

			if (!this._isPageChange) {
				var requestFacets = serviceRequest.getQueryFacets();
				var requestFacetsClone = requestFacets.map(function (facet) {
					return dojo.clone(facet);
				});
				var resultFacets = serviceRequest.getResultFacets();
				var composedFacets = this._composeFilterFacets(
					requestFacets,
					resultFacets
				);

				//Update active filter chips
				this._activeFilterChipsWidget.facets = composedFacets;
				this._activeFilterChipsWidget.update();

				//Update filters panel
				this._filtersPanelWidget.items = composedFacets;
				this._filtersPanelWidget.initialFacets = requestFacetsClone;
				this._filtersPanelWidget.update();
			}

			//Update results panel
			this._resultsPanelWidget.items = resultItems;
			this._resultsPanelWidget.update();

			// Update pagination panel
			this._paginationPanelWidget.update(
				totalRows,
				Math.ceil(start / rows) + 1
			);

			// Show active filter chips
			this._showActiveFilterChips();
		},

		/**
		 * Sync page change service request with select query service request
		 *
		 * @private
		 */
		_updatePageChangeServiceRequest: function () {
			this._pageChangeServiceRequest.start = 0;
			this._pageChangeServiceRequest.rows = this._selectQueryServiceRequest.rows;
			this._pageChangeServiceRequest.queryText = this._selectQueryServiceRequest.queryText;
			this._pageChangeServiceRequest.resetQueryFacets();
			this._selectQueryServiceRequest.getQueryFacets().forEach(
				function (queryFacet) {
					this._pageChangeServiceRequest.setQueryFacet(lang.clone(queryFacet));
				}.bind(this)
			);
		},

		/**
		 * Send request to server
		 *
		 * @private
		 */
		_sendRequest: function () {
			var serviceRequest = this._isPageChange
				? this._pageChangeServiceRequest
				: this._selectQueryServiceRequest;
			var rows = this._paginationPanelWidget.getPageSize();
			var start =
				this._isPageChange && serviceRequest.rows === rows
					? this._paginationPanelWidget.getOffset()
					: 0;

			if (this._isPageChange) {
				serviceRequest.start = start;
			} else {
				serviceRequest.queryText = this._searchPanelWidget.getQueryText();
			}
			serviceRequest.rows = rows;
			serviceRequest.run();
		},

		/**
		 * Get tab title base on search query text
		 *
		 * @private
		 */
		_getTitle: function () {
			return this._utils.getResourceValueByKey('tab.title');
		},

		/**
		 * Composes list of facets for filters panel
		 *
		 * @private
		 * @param {object[]} requestFacets List of request facets
		 * @param {object[]} resultFacets List of result facets
		 * @returns {object[]} List of filter facets
		 */
		_composeFilterFacets: function (requestFacets, resultFacets) {
			var filterFacets = lang.clone(resultFacets);

			requestFacets.forEach(function (requestFacet) {
				var filterFacet = null;

				filterFacets.some(function (facet) {
					if (
						facet.name === requestFacet.name &&
						facet.title === requestFacet.title
					) {
						filterFacet = facet;
						return true;
					}
				});
				if (!filterFacet) {
					var facet = lang.clone(requestFacet);
					facet.clearOptions();
					requestFacet.getOptions().forEach(function (opt) {
						if (opt.isSelected) {
							facet.addOption(opt.name, opt.label, 0, true);
						}
					});
					filterFacets.push(facet);
				} else {
					var filterFacetOptionsMap = filterFacet
						.getOptions()
						.reduce(function (map, opt) {
							map[opt.name] = opt;
							return map;
						}, {});
					requestFacet.getOptions().forEach(function (opt) {
						if (
							opt.isSelected &&
							!filterFacetOptionsMap.hasOwnProperty(opt.name)
						) {
							filterFacet.addOption(opt.name, opt.label, 0, true);
						}
					});
				}
			});

			return filterFacets;
		},

		/**
		 * Closes any opened popup
		 *
		 * @param {object} ev Event object
		 * @param {boolean} forceClose Should popup be closed despite event target
		 */
		_closePopup: function (ev, forceClose) {
			var isForceClose = this._utils.isNullOrUndefined(forceClose)
				? false
				: forceClose;
			var topPopup = popup.getTopPopup();

			if (
				!this._utils.isNullOrUndefined(topPopup) &&
				!topPopup.widget._destroyed
			) {
				if (isForceClose) {
					topPopup.onCancel();
				} else {
					var isEventInPopup = topPopup.widget.domNode.contains(ev.target);

					if (!isEventInPopup) {
						// If click was outside of popup - close it
						topPopup.onCancel();
					}
				}
			}
		},

		/**
		 * Show active filter chips widget
		 *
		 * @private
		 */
		_showActiveFilterChips: function () {
			if (this._activeFilterChipsWidget.isExpanded()) {
				this._activeFilterChipsWidget.placeAt(
					this._resultsPanelWidget,
					'first'
				);
			} else {
				this._activeFilterChipsWidget.placeAt(this._searchPanelWidget, 'last');
			}

			this._refreshLayout();
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		_onSearch: function () {
			this._search();
		},

		_onDocumentKeyUp: function (ev) {
			switch (ev.key) {
				case 'Esc': // fix for IE
				case 'Escape':
					this._closePopup(ev, true);
					break;
				case 'Enter':
					var isActionable =
						ev.target.getAttribute('data-action') !== 'ignored';

					if (isActionable) {
						this._closePopup(ev, true);
						this._onSearch();
					}
			}
		},

		_onFiltersApply: function () {
			this._search();
		},

		_onPageChange: function () {
			var pageSize = this._paginationPanelWidget.getPageSize();
			var offset = this._paginationPanelWidget.getOffset();
			var prevPageSize = this._pageChangeServiceRequest.rows;
			var prevOffset = this._pageChangeServiceRequest.start;

			if (
				(prevPageSize !== pageSize || prevOffset !== offset) &&
				this._wasExecuted
			) {
				this._isPageChange = true;
				this._search();
			}
		},

		_onFiltersReset: function () {
			this._selectQueryServiceRequest.resetQueryFacets();

			this._search();
		},

		_onFilterReset: function (facet) {
			this._selectQueryServiceRequest.removeQueryFacet(facet);

			this._search();
		},

		_onFilterLoadOptions: function (facet) {
			var selectQueryServiceRequestFacet = new SelectQueryServiceRequest({
				arasObj: this._arasObj,
				topFacets: this._topFacets
			});
			selectQueryServiceRequestFacet.rows = 0;
			selectQueryServiceRequestFacet.start = 0;
			selectQueryServiceRequestFacet.queryText = this._selectQueryServiceRequest.queryText;

			selectQueryServiceRequestFacet.setRequestFacet(facet.name);
			var initialFacets = this._filtersPanelWidget.initialFacets;
			for (var i = 0; i < initialFacets.length; i++) {
				if (initialFacets[i].isAnyOptionSelected()) {
					selectQueryServiceRequestFacet.setQueryFacet(initialFacets[i]);
				}
			}
			selectQueryServiceRequestFacet.updateQueryFacet(facet);
			selectQueryServiceRequestFacet.run();

			/**
			 * There can be several facets in response for those facets that have the
			 * same name but different labels. That is why we should find the facet
			 * that matches with requested facet by label.
			 */
			var newFacet = selectQueryServiceRequestFacet
				.getResultFacets()
				.find(function (resultFacet) {
					return resultFacet.title === facet.title;
				});
			if (!this._utils.isNullOrUndefined(newFacet)) {
				return newFacet;
			}
			return facet;
		},

		_onFiltersChange: function (filters) {
			var self = this;

			filters.forEach(function (filter) {
				self._selectQueryServiceRequest.updateQueryFacet(filter);
			});

			var currentQueryFacets = this._selectQueryServiceRequest.getQueryFacets();
			var areSameFacetsSelected = this._utils.compareFacets(
				this._filtersPanelWidget.initialFacets,
				currentQueryFacets
			);

			this._utils.setNodeDisabledState(
				this._filtersPanelWidget.filtersPanelApplyAllButton,
				this._wasExecuted && areSameFacetsSelected
			);
			this._utils.setNodeDisabledState(
				this._filtersPanelWidget.filtersPanelClearAllButton,
				currentQueryFacets.length === 0
			);
		},

		_onChipsChange: function (chips) {
			var self = this;

			chips.forEach(function (chip) {
				self._selectQueryServiceRequest.updateQueryFacet(chip);
			});

			this._search();
		},

		_onChipsToggle: function () {
			this._showActiveFilterChips();
		}
	});
});
