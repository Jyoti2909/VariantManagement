define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom-construct',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'ES/Scripts/Controls/ActiveFilterChip',
	'ES/Scripts/Constants',
	'ES/Scripts/Classes/Utils',
	'dojo/text!./../../Views/Templates/ActiveFilterChips.html',
	'dojo/text!./../../Views/Templates/ActiveFilterTitle.html'
], function (
	declare,
	lang,
	domConstruct,
	_WidgetBase,
	_TemplatedMixin,
	ActiveFilterChip,
	Constants,
	Utils,
	activeFilterChipsTemplate,
	activeFilterTitleTemplate
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		_arasObj: null,
		_constants: null,
		_utils: null,

		facets: [],
		widgets: [],

		_isExpanded: false,

		_topFacets: null,
		_onChipsChange: null,
		_onChipsToggle: null,

		_showMoreText: '',
		_showLessText: '',

		templateString: '',

		/**
		 * Active Filter Chips constructor
		 *
		 * @param {Object} args arguments
		 * @param {Function} args.onChipsChange Callback that is called on chips change
		 * @param {Function} args.onChipsToggle Callback that is called on expand or collapse
		 */
		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._constants = new Constants();
			this._utils = new Utils({
				arasObj: this._arasObj
			});

			this._topFacets = args.topFacets || new Map();
			this._onChipsChange = args.onChipsChange;
			this._onChipsToggle = args.onChipsToggle;

			this._showMoreText = this._utils.getResourceValueByKey(
				'buttons.show_more'
			);
			this._showLessText = this._utils.getResourceValueByKey(
				'buttons.show_less'
			);

			this.templateString = lang.replace(activeFilterChipsTemplate, [
				this._showMoreText
			]);

			window.addEventListener('resize', this._refresh.bind(this));
		},

		/**
		 * Whether widget is expanded
		 *
		 * @returns {boolean}
		 */
		isExpanded: function () {
			return this._isExpanded;
		},

		/**
		 * Update widget chips
		 */
		update: function () {
			var self = this;

			// Destroy old chip widgets
			this.widgets.forEach(function (widget) {
				widget.destroy();
			});
			this._activeFilterChipsContainer.innerHTML = '';
			this.widgets = [];

			// Create new chip widgets
			var docFragment = document.createDocumentFragment();
			this.facets.forEach(
				function (facet, index) {
					if (facet.isAnyOptionSelected()) {
						var options =
							this._constants.alphabeticallySortedFacets.indexOf(facet.name) ===
							-1
								? facet.getSortedOptionsByFrequency(
										this._constants.sortOrders.descending
								  )
								: facet.getSortedOptionsByAlphabet(
										this._constants.sortOrders.ascending
								  );

						// Add additional space before next filter group
						if (index > 0 && docFragment.children.length > 0) {
							docFragment.lastChild.classList.add('beforeNextGroup');
						}

						// Append filter group title
						docFragment.appendChild(
							this._createFilterTitleElement(
								facet.title,
								this._topFacets.has(facet.name)
							)
						);

						// Append filter option chip
						options.forEach(function (option) {
							if (option.isSelected) {
								var widget = new ActiveFilterChip({
									arasObj: self._arasObj,
									filterIndex: index,
									filterOptionName: option.name,
									filterOptionLabel: option.label,
									onRemoveFilterChip: self._onRemoveFilterChipEventHandler.bind(
										self
									)
								});
								docFragment.appendChild(widget.domNode);

								self.widgets.push(widget);
							}
						});
					}
				}.bind(this)
			);
			this._activeFilterChipsContainer.appendChild(docFragment);

			this._refresh();
		},

		/**
		 * Create filter title label
		 *
		 * @param {string} title Filter title
		 * @param {boolean} isTop Whether filter is Top
		 */
		_createFilterTitleElement: function (title, isTop) {
			var templateStr = lang.replace(activeFilterTitleTemplate, [
				isTop ? ' top' : '',
				title
			]);

			return domConstruct.toDom(templateStr);
		},

		/**
		 * Refresh widget appearance
		 *
		 * @private
		 */
		_refresh: function () {
			if (this._isExpanded) {
				this._collapse();
				if (this._isOverflowed()) {
					this._expand();
				}
			} else {
				this._adjustToolbarHeight();
			}

			this._utils.setNodeVisibility(
				this._toggleChipsButton,
				this._isExpanded || this._isOverflowed()
			);
		},

		/**
		 * Whether chips do not fit on the single line
		 *
		 * @private
		 * @returns {boolean}
		 */
		_isOverflowed: function () {
			return (
				this._activeFilterChipsContainer.scrollHeight - 5 >
				this._activeFilterChipsContainer.clientHeight
			);
		},

		/**
		 * Expand widget
		 *
		 * @private
		 */
		_expand: function () {
			this._isExpanded = true;
			this._toggleChipsButton.classList.add('expanded');
			this._toggleChipsButton.title = this._showLessText;
			this._adjustToolbarHeight();

			if (!this._utils.isNullOrUndefined(this._onChipsToggle)) {
				this._onChipsToggle();
			}
		},

		/**
		 * Collapse widget
		 *
		 * @private
		 */
		_collapse: function () {
			this._isExpanded = false;
			this._toggleChipsButton.classList.remove('expanded');
			this._toggleChipsButton.title = this._showMoreText;
			this._adjustToolbarHeight();

			if (!this._utils.isNullOrUndefined(this._onChipsToggle)) {
				this._onChipsToggle();
			}
		},

		/**
		 * Adjust active filter chips toolbar depending on content
		 *
		 * @private
		 */
		_adjustToolbarHeight: function () {
			var toolbarHeight = 0;
			var chipHeight = 32;
			var chipMargin = 4;

			if (this._isExpanded) {
				var scrollHeight = this._activeFilterChipsContainer.scrollHeight;
				toolbarHeight = scrollHeight - chipMargin * 2;
			} else if (this.widgets.length > 0) {
				toolbarHeight = chipHeight;
			}

			this._activeFilterChipsToolbar.style.height = toolbarHeight + 'px';
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		/**
		 * Toggle button click event handler
		 *
		 * @private
		 */
		_onToggleButtonClickEventHandler: function () {
			if (this._isExpanded) {
				this._collapse();
			} else {
				this._expand();
			}
		},

		/**
		 * Remove chip event handler
		 *
		 * @private
		 * @param {number} filterIndex
		 * @param {string} filterOptionName
		 */
		_onRemoveFilterChipEventHandler: function (filterIndex, filterOptionName) {
			//Deselect filter option
			var facet = this.facets[filterIndex];

			if (!this._utils.isNullOrUndefined(facet)) {
				var option = facet.getOption(filterOptionName);

				if (!this._utils.isNullOrUndefined(option)) {
					option.isSelected = false;
				}
			}

			if (!this._utils.isNullOrUndefined(this._onChipsChange)) {
				this._onChipsChange([facet]);
			}
		}
	});
});
