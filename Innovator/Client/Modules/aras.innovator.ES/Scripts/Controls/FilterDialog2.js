define([
	'dojo',
	'dojo/query',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/TooltipDialog',
	'dijit/popup',
	'ES/Scripts/Classes/Utils',
	'ES/Scripts/Constants',
	'dojo/text!./../../Views/Templates/FilterDialog2.html',
	'dojo/text!./../../Views/Templates/FilterDialog2FilterOption1.html'
], function (
	dojo,
	query,
	declare,
	lang,
	_WidgetBase,
	_TemplatedMixin,
	TooltipDialog,
	popup,
	Utils,
	Constants,
	filterDialog2Template,
	filterDialog2FilterOption1
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		_arasObj: null,
		_utils: null,
		_constants: null,

		_popupDialog: null,
		_tooltipDialog: null,

		_onPopupClose: null,

		facet: null,

		_domNodeOptionIndexesByName: new Map(),

		currentSortOrder: '',
		currentSortMode: '',

		firstLetterGroupId: -1,

		templateString: '',

		_filterMenuSelectedIcon: '../../../images/check.svg',
		_everythingMenuItem: 'everything_menu_item',
		_selectedMenuItem: 'selected_menu_item',
		_filterMenuItems: null,
		_filterMenuLabels: {},
		_filteredBySelectedLabel: '',
		_filteredByKeywordLabel: '',

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});
			this._constants = new Constants();

			this._filteredBySelectedLabel = args.filteredBySelectedLabel;
			this._filteredByKeywordLabel = args.filteredByKeywordLabel;

			this._filterMenuItems = [
				this._everythingMenuItem,
				this._selectedMenuItem
			];
			for (const menuItem of this._filterMenuItems) {
				this._filterMenuLabels[menuItem] = this._utils.getResourceValueByKey(
					`filters.${menuItem}`
				);
			}

			this.currentSortOrder = this._constants.sortOrders.ascending;
			this.currentSortMode = this._constants.sortModes.alphabetical;

			this.facet = args.facet;
			this.showCounts = args.showCounts;

			this._onPopupClose = args.onPopupClose;

			var firstLetterWasChanged = false;
			var filterOptionsMarkup = '';
			var prevCharacter = '';
			var countHidden = this.showCounts ? '' : 'hidden';

			var options = this.facet.getOptions();
			options.forEach(
				function (option, index) {
					var firstLetter =
						option.label === '' ? '' : option.label[0].toUpperCase();
					if (this._arasObj.isInteger(firstLetter)) {
						firstLetter = '#';
					}
					firstLetterWasChanged = firstLetter !== prevCharacter;

					filterOptionsMarkup += lang.replace(filterDialog2FilterOption1, {
						index: index,
						name: this._utils.escapeHtml(option.name),
						value: option.label,
						count: option.count,
						countHidden: countHidden,
						checked: option.isSelected ? 'checked' : '',
						firstLetter: firstLetter,
						firstLetterGroupId: firstLetterWasChanged
							? ++this.firstLetterGroupId
							: this.firstLetterGroupId
					});

					prevCharacter = firstLetter;
				}.bind(this)
			);

			this.templateString = lang.replace(filterDialog2Template, [
				filterOptionsMarkup,
				countHidden,
				args.selectAllTooltip,
				args.sortAlphaModeTooltip,
				args.sortFreqModeTooltip,
				args.showAllLabel
			]);
		},

		postCreate: function () {
			this._tooltipDialog = new TooltipDialog({
				content: this.domNode,
				class: 'filterDialog'
			});

			var options = this.facet.getOptions();
			options.forEach(
				function (option, index) {
					this._domNodeOptionIndexesByName.set(option.name, index);
				}.bind(this)
			);

			this._updateFilterMenu();
			this._filterDialog2SearchMenu.on(
				'click',
				this._onMenuItemClickHandler.bind(this)
			);
		},

		/**
		 * Show dialog
		 *
		 * @param {object|string} node DOM node or id of node for placing the pop-up
		 */
		show: function (node) {
			popup.open({
				popup: this._tooltipDialog,
				around: node,
				maxHeight: dojo.window.getBox().h,
				orient: ['after-centered', 'below'],
				onCancel: function () {
					this.hide();
				}.bind(this)
			});

			this._popupDialog = popup.getTopPopup();

			this._updateSelectAllCheckBox();
			this._updateFirstLetters();
		},

		/**
		 * Hide dialog
		 */
		hide: function () {
			this.facet.getOptions().forEach(function (option) {
				option.visible = true;
			});

			if (!this._utils.isNullOrUndefined(this._onPopupClose)) {
				this._onPopupClose(this.facet);
			}

			this._popupDialog.widget.destroyRecursive();
		},

		/**
		 * Update checkbox 'Select All'
		 *
		 * @private
		 */
		_updateSelectAllCheckBox: function () {
			var facetOptionsState = this.facet.getFacetOptionsState();
			var facetStateClass = facetOptionsState.areAllVisibleOptionsSelected
				? 'checked'
				: !facetOptionsState.isAnyVisibleOptionSelected
				? 'unchecked'
				: 'indet';

			this._filterDialog2SelectAllButton.setAttribute(
				'data-state',
				facetStateClass
			);

			if (facetOptionsState.isAnyOptionVisible) {
				this._filterDialog2SelectAllButton.removeAttribute('disabled');
				this._alphabeticalSortButton.removeAttribute('disabled');
				this._frequencySortButton.removeAttribute('disabled');
			} else {
				this._filterDialog2SelectAllButton.setAttribute('disabled', 'disabled');
				this._alphabeticalSortButton.setAttribute('disabled', 'disabled');
				this._frequencySortButton.setAttribute('disabled', 'disabled');
			}
		},

		/**
		 * Hides or shows first letters
		 *
		 * @private
		 */
		_updateFirstLetters: function () {
			for (var i = 0; i <= this.firstLetterGroupId; i++) {
				var nodesByFirstLetter = query(
					'.firstLetterGroup' + i + ':not(.hidden)',
					this.domNode
				);

				var firstOptionIndex =
					this.currentSortOrder === this._constants.sortOrders.ascending
						? 0
						: nodesByFirstLetter.length - 1;
				for (var j = 0; j < nodesByFirstLetter.length; j++) {
					var nodeByFirstLetter = nodesByFirstLetter[j];

					this._utils.switchClassByCondition(
						nodeByFirstLetter,
						j === firstOptionIndex,
						'firstLetterVisible'
					);
				}
			}
		},

		/**
		 * Filter facet options
		 *
		 * @param {(option: object) => boolean} filterFn Filter function
		 */
		_filterOptions: function (filterFn) {
			const options = this.facet.getOptions();

			options.forEach((option, index) => {
				option.visible = filterFn(option);
				this._utils.switchClassByCondition(
					this[`filterOptionContainer${index}`],
					!option.visible,
					'hidden'
				);
			});

			this._updateSelectAllCheckBox();
			this._updateFirstLetters();
		},

		/**
		 * Update filter menu items
		 *
		 * @param {string} selectedMenuItem Selected menu item id
		 */
		_updateFilterMenu: function (selectedMenuItem = this._everythingMenuItem) {
			const menuData = new Map();

			for (const menuItem of this._filterMenuItems) {
				menuData.set(menuItem, { label: this._filterMenuLabels[menuItem] });

				if (menuItem === selectedMenuItem) {
					menuData.get(menuItem)['icon'] = this._filterMenuSelectedIcon;
				}
			}

			this._filterDialog2SearchMenu.applyData(menuData, this._filterMenuItems);
		},

		/**
		 * Show filter banner
		 *
		 * @param {string} label Filter banner label
		 */
		_showFilterBanner: function (label) {
			this._filterBannerLabel.textContent = label;
			this._utils.setNodeVisibility(this._filterBanner, true);
		},

		/**
		 * Hide filter banner
		 */
		_hideFilterBanner: function () {
			this._utils.setNodeVisibility(this._filterBanner, false);
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		_onSearchTextBoxChangedEventHandler: function () {
			const textBoxValue = this._filterDialog2SearchTextBox.value;
			const optionFilterFn = (option) =>
				option.label.toLowerCase().indexOf(textBoxValue.toLowerCase()) !== -1;

			if (textBoxValue === '') {
				this._hideFilterBanner();
			} else {
				if (
					!(
						'icon' in
						this._filterDialog2SearchMenu.state.data.get(
							this._everythingMenuItem
						)
					)
				) {
					this._updateFilterMenu(this._everythingMenuItem);
				}

				this._showFilterBanner(
					lang.replace(this._filteredByKeywordLabel, [textBoxValue])
				);
			}

			this._filterOptions(optionFilterFn);
		},

		_onFilterOptionStateChangedEventHandler: function (ev) {
			var name = this._utils.unescapeHtml(
				ev.target.getAttribute('data-filter-option-name')
			);
			var option = this.facet.getOption(name);

			option.isSelected = ev.target.checked;

			this._updateSelectAllCheckBox();
		},

		_onSelectAllCheckboxClickEventHandler: function () {
			var options = this.facet.getOptions();
			var selected =
				this._filterDialog2SelectAllButton.getAttribute('data-state') !==
				'checked';

			for (var i = 0; i < options.length; i++) {
				var option = options[i];

				if (!option.visible) {
					continue;
				}

				option.isSelected = selected;
				this['filterOptionCheckBox' + i].checked = selected;
			}

			this._updateSelectAllCheckBox();
		},

		_onSortButtonsClickEventHandler: function (ev) {
			var prevSortMode = this.currentSortMode;
			var prevSortOrder = ev.currentTarget.getAttribute(
				'data-filter-control-sort-order'
			);
			var newSortMode = ev.currentTarget.getAttribute(
				'data-filter-control-sort-mode'
			);
			var options = [];

			if (prevSortMode === newSortMode) {
				this.currentSortOrder =
					prevSortOrder === this._constants.sortOrders.ascending
						? this._constants.sortOrders.descending
						: this._constants.sortOrders.ascending;
			} else {
				this.currentSortOrder =
					prevSortMode !== this._constants.sortModes.frequency
						? this._constants.sortOrders.descending
						: this._constants.sortOrders.ascending;

				this.currentSortMode = newSortMode;

				this._utils.swapClass(
					this._alphabeticalSortButton,
					this._frequencySortButton,
					'active'
				);
			}

			switch (this.currentSortMode) {
				case this._constants.sortModes.alphabetical:
					options = this.facet.getSortedOptionsByAlphabet(
						this.currentSortOrder
					);

					this._alphabeticalSortButton.setAttribute(
						'data-filter-control-sort-order',
						this.currentSortOrder
					);
					break;
				case this._constants.sortModes.frequency:
					options = this.facet.getSortedOptionsByFrequency(
						this.currentSortOrder
					);

					this._frequencySortButton.setAttribute(
						'data-filter-control-sort-order',
						this.currentSortOrder
					);
			}

			this._filterDialogContentContainer.setAttribute(
				'data-filter-sort-mode',
				this.currentSortMode
			);
			this._filterDialogContentContainer.setAttribute(
				'data-filter-sort-order',
				this.currentSortOrder
			);

			options.forEach(
				function (option, index) {
					var domNodeOptionIndex = this._domNodeOptionIndexesByName.get(
						option.name
					);
					this[
						'filterOptionContainer' + domNodeOptionIndex
					].style.order = index;
				}.bind(this)
			);

			if (this._constants.sortModes.alphabetical) {
				this._updateFirstLetters();
			}
		},

		/**
		 * Handle filter menu item click
		 *
		 * @param {string} targetMenuItem Target menu item id
		 */
		_onMenuItemClickHandler: function (targetMenuItem) {
			this._filterDialog2SearchTextBox.value = '';

			switch (targetMenuItem) {
				case this._everythingMenuItem:
					this._filterOptions(() => true);
					this._hideFilterBanner();
					break;
				case this._selectedMenuItem:
					this._filterOptions((option) => option.isSelected);
					this._showFilterBanner(this._filteredBySelectedLabel);
					break;
			}

			this._updateFilterMenu(targetMenuItem);
		},

		/**
		 * Handle 'Show All' link click
		 */
		_onShowAllClickEventHandler: function () {
			this._onMenuItemClickHandler(this._everythingMenuItem);
		}
	});
});
