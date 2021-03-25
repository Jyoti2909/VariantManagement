(function () {
	const pathToResource = '../Modules/aras.innovator.ExtendedClassification/';

	const xClassSearchFilters = {
		ALL: {
			value: 'ALL',
			get label() {
				if (!this._label) {
					this._label = aras.getResource(
						pathToResource,
						'xClassSearchControl.filter.all'
					);
				}
				return this._label;
			},
			filter: function () {
				const filteredXClasses = [];
				xClassSearchControl.allXClasses.forEach(function (xClass, id) {
					filteredXClasses.push(id);
				});
				if (
					(xClassSearchControl.xClasses &&
						xClassSearchControl.xClasses.size > 0) ||
					(xClassSearchControl.relationshipXClasses &&
						xClassSearchControl.relationshipXClasses.size > 0)
				) {
					filteredXClasses.unshift('any_classification');
				}
				return filteredXClasses;
			}
		},
		ACTIVE_FILTERS: {
			value: 'ACTIVE_FILTERS',
			get label() {
				if (!this._label) {
					this._label = aras.getResource(
						pathToResource,
						'xClassSearchControl.filter.active_filters'
					);
				}
				return this._label;
			},
			get filterPanelLabel() {
				if (!this._filterPanelLabel) {
					this._filterPanelLabel = aras.getResource(
						pathToResource,
						'xClassSearchControl.filter.panel.active_filters'
					);
				}
				return this._filterPanelLabel;
			},
			filter: function () {
				const filteredXClasses = [];
				xClassSearchControl.allXClasses.forEach(function (xClass, id) {
					if (xClass.isFiltered) {
						filteredXClasses.push(id);
					}
				});
				return filteredXClasses;
			}
		},
		ACTIVE_SEARCHES: {
			value: 'ACTIVE_SEARCHES',
			get label() {
				if (!this._label) {
					this._label = aras.getResource(
						pathToResource,
						'xClassSearchControl.filter.active_searches'
					);
				}
				return this._label;
			},
			get filterPanelLabel() {
				if (!this._filterPanelLabel) {
					this._filterPanelLabel = aras.getResource(
						pathToResource,
						'xClassSearchControl.filter.panel.active_searches'
					);
				}
				return this._filterPanelLabel;
			},
			filter: function () {
				const filteredXClasses = [];
				xClassSearchControl.allXClasses.forEach(function (xClass, id) {
					if (
						xClass.checkbox.state !== XClassSearchCheckbox.States.STATE_DEFAULT
					) {
						filteredXClasses.push(id);
					}
				});
				return filteredXClasses;
			}
		},
		ALL_ACTIVE: {
			value: 'ALL_ACTIVE',
			get label() {
				if (!this._label) {
					this._label = aras.getResource(
						pathToResource,
						'xClassSearchControl.filter.all_active'
					);
				}
				return this._label;
			},
			get filterPanelLabel() {
				if (!this._filterPanelLabel) {
					this._filterPanelLabel = aras.getResource(
						pathToResource,
						'xClassSearchControl.filter.panel.all_active'
					);
				}
				return this._filterPanelLabel;
			},
			filter: function () {
				const filteredXClasses = [];
				xClassSearchControl.allXClasses.forEach(function (xClass, id) {
					if (
						xClass.isFiltered === true ||
						xClass.checkbox.state !== XClassSearchCheckbox.States.STATE_DEFAULT
					) {
						filteredXClasses.push(id);
					}
				});
				return filteredXClasses;
			}
		}
	};
	xClassSearchFilters.getFilterByValue = function (value) {
		const filter = Object.keys(this).find(function (filter) {
			return this[filter].value === value;
		}, this);
		return this[filter];
	};
	Object.defineProperty(xClassSearchFilters, 'getFilterByValue', {
		enumerable: false
	});

	window.xClassSearchFilters = xClassSearchFilters;
})();
