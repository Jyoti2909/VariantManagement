define(['dojo/_base/declare', 'ES/Scripts/Constants'], function (
	declare,
	Constants
) {
	return declare('ES.SelectQueryServiceRequest', null, {
		_constants: null,

		id: 0,
		name: '',
		title: '',
		_options: null,
		_areOptionsSorted: false,
		_sortMode: '',
		_sortOrder: '',
		_indexedTypes: null,

		constructor: function (args) {
			declare.safeMixin(this, args);

			this._constants = new Constants();

			this._sortMode = this._constants.sortModes.alphabetical;
			this._sortOrder = this._constants.sortOrders.ascending;

			this._options = [];
			this._indexedTypes = [];
		},

		addOption: function (value, label, count, isSelected) {
			this._options.push({
				name: value,
				label: label,
				count: count,
				visible: true,
				isSelected: isSelected
			});

			this._areOptionsSorted = false;
		},

		getOptions: function () {
			// TODO: sorting must be removed from this method
			this._sortMode = this._constants.sortModes.alphabetical;
			this._sortOrder = this._constants.sortOrders.ascending;

			if (!this._areOptionsSorted) {
				this._options.sort(this.naturalSort.bind(this));
				this._areOptionsSorted = true;
			}

			return this._options;
		},

		/**
		 * Removes all options
		 */
		clearOptions: function () {
			this._options = [];
		},

		/**
		 * Sorts properties by label and returns copy of sorted array
		 *
		 * @returns {object[]} Returns objects array of sorted properties
		 */
		getSortedOptionsByAlphabet: function (sortOrder) {
			this._sortMode = this._constants.sortModes.alphabetical;
			this._sortOrder = sortOrder;

			var optionsClone = this._options.slice();

			return optionsClone.sort(this.naturalSort.bind(this));
		},

		/**
		 * Sorts properties by count and returns copy of sorted array
		 *
		 * @returns {object[]} Returns objects array of sorted properties
		 */
		getSortedOptionsByFrequency: function (sortOrder) {
			this._sortMode = this._constants.sortModes.frequency;
			this._sortOrder = sortOrder;

			var optionsClone = this._options.slice();

			return optionsClone.sort(this.naturalSort.bind(this));
		},

		getOption: function (value) {
			var res = null;

			for (var i = 0; i < this._options.length; i++) {
				var option = this._options[i];
				if (option.name === value) {
					res = this._options[i];
					break;
				}
			}

			return res;
		},

		isOptionSelected: function (name) {
			var res = false;

			for (var i = 0; i < this._options.length; i++) {
				var option = this._options[i];
				if (option.name === name) {
					res = option.isSelected;
					break;
				}
			}

			return res;
		},

		isAnyOptionSelected: function () {
			var res = false;

			for (var i = 0; i < this._options.length; i++) {
				var option = this._options[i];
				if (option.isSelected) {
					res = true;
					break;
				}
			}

			return res;
		},

		/**
		 * Gets object that specifies facet options state
		 *
		 * @returns {object} Returns object with Boolean keys:
		 * isAnyOptionVisible - equals true if at least one option is visible, false otherwise
		 * isAnyOptionSelected - equals true if at least one option is selected, false otherwise
		 * areAllOptionsSelected - equals true if all options are selected, false otherwise
		 * isAnyVisibleOptionSelected - equals true if at least one visible option is selected, false otherwise
		 * areAllVisibleOptionsSelected - equals true if all visible options are selected, false otherwise
		 */
		getFacetOptionsState: function () {
			var res = {
				isAnyOptionVisible: true,
				isAnyOptionSelected: false,
				isAnyVisibleOptionSelected: false,
				areAllOptionsSelected: true,
				areAllVisibleOptionsSelected: true
			};

			var isAnyOptionVisible = this._options.some(function (option) {
				return option.visible;
			});

			if (this._options.length === 0 || !isAnyOptionVisible) {
				res.isAnyOptionVisible = false;
				res.areAllOptionsSelected = false;
				res.areAllVisibleOptionsSelected = false;

				return res;
			}

			for (var i = 0; i < this._options.length; i++) {
				var option = this._options[i];

				if (!res.isAnyOptionSelected) {
					res.isAnyOptionSelected = option.isSelected;
				}

				if (!res.isAnyVisibleOptionSelected && option.visible) {
					res.isAnyVisibleOptionSelected = option.isSelected;
				}

				if (res.areAllOptionsSelected) {
					res.areAllOptionsSelected = option.isSelected;
				}

				if (res.areAllVisibleOptionsSelected && option.visible) {
					res.areAllVisibleOptionsSelected = option.isSelected;
				}
			}

			return res;
		},

		naturalSort: function (a, b) {
			var aParsed = a[this._sortMode].toString().toLowerCase();
			var bParsed = b[this._sortMode].toString().toLowerCase();

			var aChunkArr = chunkify(aParsed);
			var bChunkArr = chunkify(bParsed);

			var numS = Math.max(aChunkArr.length, bChunkArr.length);
			for (var i = 0; i < numS; i++) {
				var aN = parseFloat(aChunkArr[i]);
				var bN = parseFloat(bChunkArr[i]);
				var aChunk = aN || aChunkArr[i];
				var bChunk = bN || bChunkArr[i];

				if (typeof aChunk !== typeof bChunk) {
					aChunk += '';
					bChunk += '';
				}
				if (aChunk > bChunk) {
					return this._sortOrder === this._constants.sortOrders.ascending
						? 1
						: -1;
				} else if (aChunk < bChunk) {
					return this._sortOrder === this._constants.sortOrders.ascending
						? -1
						: 1;
				} else if (this._sortMode === this._constants.sortModes.frequency) {
					var prevSortOder = this._sortOrder;
					this._sortOrder = this._constants.sortOrders.ascending;
					this._sortMode = this._constants.sortModes.alphabetical;

					var sortResult = this.naturalSort(a, b);

					this._sortOrder = prevSortOder;
					this._sortMode = this._constants.sortModes.frequency;

					return sortResult;
				}
			}
			return 0;

			function chunkify(label) {
				var re = /(-?[0-9.]+)/g;
				var nC = String.fromCharCode(0);
				var chunkArr = label.replace(re, nC + '$1' + nC).split(nC);
				chunkArr = chunkArr.filter(function (str) {
					return /\S/.test(str);
				});
				return chunkArr;
			}
		},

		/**
		 * Add related indexed type item
		 *
		 * @param {string} name Indexed type name
		 * @param {string} label Indexed type label
		 * @param {string} labelPlural Indexed type plural label
		 * @param {string} iconPath Indexed type icon path
		 */
		addIndexedType: function (name, label, labelPlural, iconPath) {
			this._indexedTypes.push({
				name: name,
				label: label,
				labelPlural: labelPlural,
				iconPath: iconPath
			});
		},

		/**
		 * Get related indexed type items
		 *
		 *	@returns {object[]} List of indexed type items
		 */
		getIndexedTypes: function () {
			return this._indexedTypes;
		}
	});
});
