define(['dojo/_base/declare'], function (declare) {
	return declare(null, {
		_foundMathes: null,
		_searchContext: null,
		_uniqueIdCounter: { count: 0 },

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this._foundMathes = [];
		},

		_initializeSearchContext: function (searchValue) {
			this._searchContext = {
				searchValue: searchValue
			};

			return this._searchContext;
		},

		_getUniqueMatchId: function () {
			return this._uniqueIdCounter.count++;
		},

		runSearch: function (searchValue, targetSources) {
			this.cleanup();

			if (searchValue && targetSources) {
				var searchSource;
				var currentSource;
				var matchesInfo;
				var i;

				targetSources = Array.isArray(targetSources)
					? targetSources
					: [targetSources];
				this._initializeSearchContext(searchValue);

				for (i = 0; i < targetSources.length; i++) {
					currentSource = targetSources[i];
					matchesInfo = this._scanSource(currentSource);
					matchesInfo = matchesInfo
						? Array.isArray(matchesInfo)
							? matchesInfo
							: [targetSources]
						: [];

					for (j = 0; j < matchesInfo.length; j++) {
						this._foundMathes.push({
							id: this._getUniqueMatchId(),
							source: currentSource,
							matchInfo: matchesInfo[j]
						});
					}
				}
			}

			return this._foundMathes.length > 0;
		},

		_scanSource: function (searchSource) {
			// search logic should be placed here
		},

		getMatchesCount: function () {
			return this._foundMathes.length;
		},

		getMatchByIndex: function (matchIndex) {
			return (
				matchIndex >= 0 &&
				matchIndex < this._foundMathes.length &&
				this._foundMathes[matchIndex]
			);
		},

		getAllMatches: function () {
			return this._foundMathes.slice();
		},

		cleanup: function () {
			this._foundMathes = [];
			this._searchContext = null;
		}
	});
});
