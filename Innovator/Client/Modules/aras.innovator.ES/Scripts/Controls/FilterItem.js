define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/Tooltip',
	'dojo/_base/lang',
	'ES/Scripts/Constants',
	'ES/Scripts/Controls/FilterDialog2',
	'ES/Scripts/Classes/Utils',
	'dojo/text!./../../Views/Templates/FilterItem.html',
	'dojo/text!./../../Views/Templates/FilterOption.html',
	'dojo/text!./../../Views/Templates/FilterTooltipItem.html'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
	Tooltip,
	lang,
	Constants,
	FilterDialog2,
	Utils,
	filterItemTemplate,
	filterOptionTemplate,
	filterTooltipItemTemplate
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		_arasObj: null,
		_utils: null,
		_constants: null,

		_moreLabel: '',
		_selectAllTooltip: '',
		_sortAlphaModeTooltip: '',
		_sortFreqModeTooltip: '',
		_showAllLabel: '',
		_filteredBySelectedLabel: '',
		_filteredByKeywordLabel: '',

		_isInitiallySelected: false,

		id: '',
		item: null,
		showCounts: true,
		allItemsLoaded: false,

		_filterDialog2: null,

		_disableScroll: null,
		_onFilterChange: null,
		_onFilterReset: null,
		_onFilterLoadOptions: null,
		_updateMassExpandControl: null,

		collapsedClass: 'filterItemCollapsed',

		templateString: '',

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});
			this._constants = new Constants();

			this._moreLabel = args.moreLabel;
			this._selectAllTooltip = args.selectAllTooltip;
			this._sortAlphaModeTooltip = args.sortAlphaModeTooltip;
			this._sortFreqModeTooltip = args.sortFreqModeTooltip;
			this._showAllLabel = args.showAllLabel;
			this._filteredBySelectedLabel = args.filteredBySelectedLabel;
			this._filteredByKeywordLabel = args.filteredByKeywordLabel;

			this.item = args.item;
			this.showCounts = args.showCounts;

			this._disableScroll = args.disableScroll;
			this._onFilterChange = args.onFilterChange;
			this._onFilterReset = args.onFilterReset;
			this._onFilterLoadOptions = args.onFilterLoadOptions;
			this._updateMassExpandControl = args.updateMassExpandControl;

			this._isInitiallySelected = this.item.isAnyOptionSelected();

			this.templateString = lang.replace(filterItemTemplate, {
				filterId: this.item.id,
				moreLabel: this._moreLabel,
				filterLabel: this.item.title,
				clearTooltip: args.clearTooltip,
				orange: args.topFilter ? 'Orange' : '',
				clearVisible: this._isInitiallySelected ? '' : 'hidden',
				topFilter: args.topFilter ? 'topFilterItem' : '',
				filterOptionsMarkup: this._getFilterOptionsMarkup(),
				selectedFilter: this._isInitiallySelected ? 'selectedFilter' : ''
			});
		},

		postCreate: function () {
			let options = this.item.getOptions();

			if (
				options.length > 1 &&
				(options.length > this._constants.maxVisibleOptionsCount ||
					this._isInitiallySelected)
			) {
				//We need to show "more" link
				this._utils.setNodeVisibility(
					this.filterItemMoreOptionsLinkContainer,
					true
				);
			}

			new Tooltip({
				connectId: [this.filterItemLabel],
				label: this._getTooltipMarkup(),
				position: ['after']
			});
		},

		/**
		 * Get filter tooltip markup
		 *
		 * @private
		 */
		_getTooltipMarkup: function () {
			let maxItemTypesCount = 7;
			let indexedTypes = this.item.getIndexedTypes();

			let res = indexedTypes.slice(0, maxItemTypesCount).reduce((acc, data) => {
				return (
					acc +
					lang.replace(filterTooltipItemTemplate, {
						text: data.labelPlural,
						iconUrl: this._utils.getImageUrl(data.iconPath),
						iconAttr: ''
					})
				);
			}, '');

			if (indexedTypes.length > maxItemTypesCount) {
				res += lang.replace(filterTooltipItemTemplate, {
					text: lang.replace(
						this._utils.getResourceValueByKey('hint.item_types_count'),
						[indexedTypes.length]
					),
					iconUrl: '',
					iconAttr: 'hidden'
				});
			}

			return res;
		},

		/**
		 * Get markup for filter options
		 *
		 * @private
		 */
		_getFilterOptionsMarkup: function () {
			let renderedOptionsCount = 0;
			let iteratedOptionsCount = 0;
			let res = '';
			let options = this._getOptions();

			while (
				renderedOptionsCount < this._constants.maxVisibleOptionsCount &&
				iteratedOptionsCount < options.length
			) {
				let option = options[iteratedOptionsCount];
				let isOptionHidden = this._isInitiallySelected && !option.isSelected;

				if (!isOptionHidden) {
					res += lang.replace(filterOptionTemplate, {
						index: iteratedOptionsCount,
						name: this._utils.escapeHtml(option.name),
						label: option.label,
						count: option.count,
						state: option.isSelected ? 'checked' : '',
						visibility: this.showCounts ? 'visible' : 'hidden'
					});
					renderedOptionsCount++;
				}

				iteratedOptionsCount++;
			}

			return res;
		},

		/**
		 * Open filters dialog
		 *
		 * @param {object} ev Event object
		 * @private
		 */
		_openFilterDialog: function (ev) {
			this._filterDialog2 = new FilterDialog2({
				arasObj: this._arasObj,
				showCounts: this.showCounts,
				facet: this.item,
				selectAllTooltip: this._selectAllTooltip,
				sortAlphaModeTooltip: this._sortAlphaModeTooltip,
				sortFreqModeTooltip: this._sortFreqModeTooltip,
				showAllLabel: this._showAllLabel,
				filteredBySelectedLabel: this._filteredBySelectedLabel,
				filteredByKeywordLabel: this._filteredByKeywordLabel,
				onPopupClose: this._onPopupClose.bind(this)
			});
			this._filterDialog2.show(ev.target);
			this._disableScroll(true);
			ev.stopPropagation();
		},

		/**
		 * Updates filter item
		 *
		 * @public
		 */
		update: function () {
			let options = this._getOptions();

			for (let i = 0; i < options.length; i++) {
				let escapedName = this._utils.escapeHtml(options[i].name);
				let optionInput = this.domNode.querySelector(
					'[data-filter-option-name="' + escapedName + '"]'
				);
				if (!this._utils.isNullOrUndefined(optionInput)) {
					optionInput.checked = options[i].isSelected;
				}
			}
		},

		/**
		 * Gets sorted options depending on current facet name
		 *
		 * @private
		 */
		_getOptions: function () {
			let isAlphabeticallySortedFacet =
				this._constants.alphabeticallySortedFacets.indexOf(this.item.name) ===
				-1;

			return isAlphabeticallySortedFacet
				? this.item.getSortedOptionsByFrequency(
						this._constants.sortOrders.descending
				  )
				: this.item.getSortedOptionsByAlphabet(
						this._constants.sortOrders.ascending
				  );
		},

		/**
		 * Returns whether filter visible or not
		 *
		 * @returns {boolean}
		 * @public
		 */
		isVisible: function () {
			return this.domNode.offsetParent !== null;
		},

		/**
		 * Returns whether filter expanded or not
		 *
		 * @returns {boolean}
		 * @public
		 */
		isExpanded: function () {
			return !this.filterItemContainer.classList.contains(this.collapsedClass);
		},

		/**
		 * Sets facet to expanded or collapsed state depends on parameter
		 * Updates 'Mass Expand' control if possible
		 *
		 * @param {boolean} isExpand Should filter be expanded or not
		 * @public
		 */
		setExpanded: function (isExpand) {
			if (!this.isVisible()) {
				return;
			}

			isExpand
				? this.filterItemContainer.classList.remove(this.collapsedClass)
				: this.filterItemContainer.classList.add(this.collapsedClass);

			if (!this._utils.isNullOrUndefined(this._updateMassExpandControl)) {
				this._updateMassExpandControl();
			}
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		_onPopupClose: function () {
			if (!this._utils.isNullOrUndefined(this._onFilterChange)) {
				this._onFilterChange(this.item);
			}

			if (!this._utils.isNullOrUndefined(this._disableScroll)) {
				this._disableScroll(false);
			}

			this.update();
		},

		_onFilterExpandCollapseEventHandler: function () {
			this.setExpanded(!this.isExpanded());
		},

		_onFilterItemClearOptionsClickEventHandler: function () {
			if (!this._utils.isNullOrUndefined(this._onFilterReset)) {
				this._onFilterReset(this.item);
			}
		},

		_onFilterOptionChangeEventHandler: function (ev) {
			let selected = ev.target.checked;
			let name = this._utils.unescapeHtml(
				ev.target.getAttribute('data-filter-option-name')
			);
			let option = this.item.getOption(name);

			option.isSelected = selected;

			if (!this._utils.isNullOrUndefined(this._onFilterChange)) {
				this._onFilterChange(this.item);
			}
		},

		_onMoreLinkClickEventHandler: function (ev) {
			//Destroy old dialog
			if (!this._utils.isNullOrUndefined(this._filterDialog2)) {
				this._filterDialog2.destroy();
			}

			if (!this.allItemsLoaded) {
				this._utils.toggleSpinner(true, () => {
					try {
						if (!this._utils.isNullOrUndefined(this._onFilterLoadOptions)) {
							this.resultItem = this._onFilterLoadOptions(this.item);
						}

						let newOptions = this.resultItem.getOptions();
						this.item.getOptions().forEach(function (option) {
							option.count = 0;
						});
						for (let i = 0; i < newOptions.length; i++) {
							let newOption = newOptions[i];
							let curOption = this.item.getOption(newOption.name);
							if (this._utils.isNullOrUndefined(curOption)) {
								this.item.addOption(
									newOption.name,
									newOption.label,
									newOption.count,
									newOption.isSelected
								);
							} else {
								curOption.count = newOption.count;
							}
						}

						this.allItemsLoaded = true;
					} catch (ex) {
						this._arasObj.AlertError(ex.message);
					} finally {
						this._utils.toggleSpinner(false, null);
						this._openFilterDialog(ev);
					}
				});
			} else {
				this._openFilterDialog(ev);
			}
		}
	});
});
