define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'ES/Scripts/Classes/Utils',
	'ES/Scripts/Controls/FilterItem',
	'dojo/text!./../../Views/Templates/FiltersPanel.html'
], function (
	declare,
	lang,
	_WidgetBase,
	_TemplatedMixin,
	Utils,
	FilterItem,
	FiltersPanelTemplate
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		_arasObj: null,
		_utils: null,

		_onClearAll: null,
		_onFiltersApply: null,
		_onFiltersChange: null,
		_onFiltersReset: null,
		_onFilterReset: null,
		_onFilterLoadOptions: null,
		_onFiltersPanelTextBoxDelay: 250,
		_onFiltersPanelTextBoxDelayTimer: null,

		//Labels
		_moreLabel: '',
		_clearTooltip: '',
		_selectAllTooltip: '',
		_sortAlphaModeTooltip: '',
		_sortFreqModeTooltip: '',
		_filtersExpandAll: '',
		_filtersCollapseAll: '',
		_showAllLabel: '',
		_filteredBySelectedLabel: '',
		_filteredByKeywordLabel: '',

		_hasScroll: false,

		items: [],
		widgets: [],
		initialFacets: [],

		itemsWithHiddenCount: ['aes_root_types'],

		templateString: '',

		baseClass: 'resultItem',
		massExpandControlStates: {
			expanded: 'expanded',
			collapsed: 'collapsed',
			intermediate: 'intermediate'
		},

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});
			this._onFiltersApply = args.onFiltersApply;
			this._onFiltersChange = args.onFiltersChange;
			this._onFiltersReset = args.onFiltersReset;
			this._onFilterReset = args.onFilterReset;
			this._onFilterLoadOptions = args.onFilterLoadOptions;

			//Initialize labels
			let filtersLabel = this._utils.getResourceValueByKey('filters.filters');
			let filtersPlaceholder = this._utils.getResourceValueByKey(
				'filters.placeholder'
			);
			let clearAllLabel = this._utils.getResourceValueByKey(
				'filters.clear_all'
			);
			let applyLabel = this._utils.getResourceValueByKey('filters.apply');

			this._moreLabel = this._utils.getResourceValueByKey('filters.more');
			this._clearTooltip = this._utils.getResourceValueByKey('filters.clear');
			this._selectAllTooltip = this._utils.getResourceValueByKey(
				'filters.select_all'
			);
			this._sortAlphaModeTooltip = this._utils.getResourceValueByKey(
				'filters.sort_alpha_mode'
			);
			this._sortFreqModeTooltip = this._utils.getResourceValueByKey(
				'filters.sort_freq_mode'
			);
			this._filtersExpandAll = this._utils.getResourceValueByKey(
				'filters.filters_expand_all'
			);
			this._filtersCollapseAll = this._utils.getResourceValueByKey(
				'filters.filters_collapse_all'
			);
			this._showAllLabel = this._utils.getResourceValueByKey(
				'filters.show_all'
			);
			this._filteredBySelectedLabel = this._utils.getResourceValueByKey(
				'filters.filtered_by_selected'
			);
			this._filteredByKeywordLabel = this._utils.getResourceValueByKey(
				'filters.filtered_by_keyword'
			);

			this.templateString = lang.replace(FiltersPanelTemplate, [
				filtersLabel,
				filtersPlaceholder,
				clearAllLabel,
				applyLabel,
				this._filtersCollapseAll
			]);
		},

		/**
		 * Update widget
		 */
		update: function () {
			//Destroy old widgets
			this.widgets.forEach(function (widget) {
				widget.destroy();
			});
			this.widgets = [];

			//Create new widgets
			let docFragment = document.createDocumentFragment();
			this.items.forEach((item) => {
				let widget = new FilterItem({
					arasObj: this._arasObj,
					item: item,
					disableScroll: this._disableScroll.bind(this),
					onFilterChange: this._onFilterChangeEventHandler.bind(this),
					updateMassExpandControl: this._updateMassExpandControl.bind(this),
					onFilterReset: this._onFilterReset,
					onFilterLoadOptions: this._onFilterLoadOptions,
					clearTooltip: this._clearTooltip,
					moreLabel: this._moreLabel,
					selectAllTooltip: this._selectAllTooltip,
					sortAlphaModeTooltip: this._sortAlphaModeTooltip,
					sortFreqModeTooltip: this._sortFreqModeTooltip,
					showAllLabel: this._showAllLabel,
					filteredBySelectedLabel: this._filteredBySelectedLabel,
					filteredByKeywordLabel: this._filteredByKeywordLabel,
					topFilter: item.isTop,
					showCounts: this.itemsWithHiddenCount.indexOf(item.name) === -1
				});
				docFragment.appendChild(widget.domNode);

				this.widgets.push(widget);
			});

			this._filtersPanelOptionsContainer.appendChild(docFragment);
			this._filtersPanelOptionsContainer.scrollTop = 0;

			this._utils.setNodeDisabledState(this.filtersPanelApplyAllButton, true);
			this._utils.setNodeDisabledState(
				this.filtersPanelClearAllButton,
				this.initialFacets.length === 0
			);

			this._hasScroll =
				this._filtersPanelOptionsContainer.scrollHeight >
				this._filtersPanelOptionsContainer.clientHeight;

			this.filtersPanelTextBox.value = '';
			this._updateMassExpandControl();
		},

		/**
		 * Disables/enables filter's panel scroll
		 *
		 * @param {boolean} disable Should scroll be disabled
		 * @private
		 */
		_disableScroll: function (disable) {
			this._utils.switchClassByCondition(
				this.domNode,
				this._hasScroll && disable,
				'noScroll'
			);
		},

		/**
		 * Updates state of 'Mass Expand' control based on visible filters states
		 *
		 * @private
		 */
		_updateMassExpandControl: function () {
			let visibleFilters = this.widgets.filter((w) => w.isVisible());

			if (visibleFilters.length === 0) {
				this._filtersPanelMassExpandButton.setAttribute('disabled', 'disabled');
				return;
			}

			let visibleExpandedFilters = visibleFilters.filter((w) => w.isExpanded());

			let state = this.massExpandControlStates.intermediate;
			if (visibleExpandedFilters.length === 0) {
				state = this.massExpandControlStates.collapsed;
			} else if (visibleExpandedFilters.length === visibleFilters.length) {
				state = this.massExpandControlStates.expanded;
			}

			this._filtersPanelMassExpandButton.title =
				state === this.massExpandControlStates.collapsed
					? this._filtersExpandAll
					: this._filtersCollapseAll;

			this._filtersPanelMassExpandButton.removeAttribute('disabled');
			this._filtersPanelMassExpandImage.setAttribute('data-state', state);
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		/**
		 * 'Mass Expand' control click event handler
		 *
		 * @private
		 */
		_onFiltersPanelToolbarMassExpandClickEventHandler: function () {
			let areAllVisibleFacetsCollapsed =
				this._filtersPanelMassExpandImage.getAttribute('data-state') ===
				this.massExpandControlStates.collapsed;

			this.widgets.forEach((w) => w.setExpanded(areAllVisibleFacetsCollapsed));

			this._updateMassExpandControl();
		},

		_onFilterChangeEventHandler: function (filter) {
			if (!this._utils.isNullOrUndefined(this._onFiltersChange)) {
				this._onFiltersChange([filter]);
			}
		},

		_onFiltersPanelClearAllButtonClickEventHandler: function () {
			if (!this._utils.isNullOrUndefined(this._onFiltersReset)) {
				this._onFiltersReset();
			}
		},

		_onFiltersPanelApplyAllButtonClickEventHandler: function () {
			if (!this._utils.isNullOrUndefined(this._onFiltersApply)) {
				this._onFiltersApply();
			}
		},

		_onFiltersPanelTextBoxKeyPressEventHandler: function () {
			let searchText = this.filtersPanelTextBox.value.toLowerCase();
			let handler = (searchText) => {
				this.widgets.forEach((widget) => {
					let isWidgetVisible = true;
					if (searchText !== '') {
						isWidgetVisible =
							widget.item.title.toLowerCase().indexOf(searchText) !== -1;
					}
					this._utils.setNodeVisibility(widget.domNode, isWidgetVisible);
				});

				this._updateMassExpandControl();
			};

			this._onFiltersPanelTextBoxDelayTimer = this._utils.execWithDelay(
				handler.bind(this, searchText),
				this._onFiltersPanelTextBoxDelay,
				this._onFiltersPanelTextBoxDelayTimer
			);
		}
	});
});
