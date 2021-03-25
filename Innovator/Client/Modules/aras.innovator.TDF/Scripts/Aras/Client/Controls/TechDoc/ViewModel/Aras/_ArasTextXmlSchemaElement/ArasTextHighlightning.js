define(['dojo/_base/declare'], function (declare) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTextXmlSchemaElement.ArasTextHighlightning',
		null,
		{
			_ranges: null,
			_rangesById: null,
			_ownerElement: null,
			_uniqueIdCounter: { count: 1 },

			constructor: function (ownerTextElement) {
				this._ownerElement = ownerTextElement;
				this._ranges = [];
				this._rangesById = {};
			},

			_getUniqueMatchId: function () {
				return this._uniqueIdCounter.count++;
			},

			cleanupRanges: function () {
				this._ranges = [];
				this._ownerElement.NotifyChanged();
			},

			addRange: function (startPosition, endPosition, optionalParameters) {
				startPosition = parseInt(startPosition);
				endPosition = parseInt(endPosition);

				optionalParameters = optionalParameters || {};

				if (
					!isNaN(startPosition) &&
					!isNaN(endPosition) &&
					startPosition !== endPosition
				) {
					var rangeId = optionalParameters.rangeId;

					// rangeId generation if it wasn't passed
					if (rangeId === undefined) {
						do {
							rangeId = this._getUniqueMatchId();
						} while (this._rangesById[rangeId]);
					}

					if (!this._rangesById[rangeId]) {
						var newRange = {
							id: rangeId,
							start: Math.min(startPosition, endPosition),
							end: Math.max(startPosition, endPosition),
							active: Boolean(optionalParameters.active)
						};
						var isRangeExists;
						var highlightRange;
						var i;

						for (i = 0; i < this._ranges.length; i++) {
							highlightRange = this._ranges[i];

							if (
								highlightRange.start == newRange.start &&
								highlightRange.end == newRange.end
							) {
								isRangeExists = true;
								break;
							}
						}

						if (!isRangeExists) {
							this._ranges.push(newRange);
							this._rangesById[newRange.id] = newRange;

							if (!optionalParameters.suppressEvent) {
								this._ownerElement.NotifyChanged();
							}

							return true;
						}
					}
				}
			},

			removeRange: function (targetRange, optionalParameters) {
				targetRange =
					typeof targetRange === 'string'
						? this._rangesById[targetRange]
						: targetRange;
				optionalParameters = optionalParameters || {};

				if (targetRange) {
					var rangeIndex = this._ranges.indexOf(targetRange);

					if (rangeIndex > -1) {
						this._ranges.splice(rangeIndex, 1);
						delete this._rangesById[targetRange.id];

						if (!optionalParameters.suppressEvent) {
							this._ownerElement.NotifyChanged();
						}

						return true;
					}
				}
			},

			getRangesCount: function () {
				return this._ranges.length;
			},

			getAllRanges: function () {
				return this._ranges.slice();
			},

			getRangeByIndex: function (rangeIndex) {
				return rangeIndex >= 0 && rangeIndex < this._ranges.length
					? this._ranges[rangeIndex]
					: null;
			},

			getRangeById: function (rangeId) {
				return this._rangesById[rangeId];
			},

			getRangesByBounds: function (startPosition, endPosition, fullInclude) {
				var foundRanges = [];

				if (!isNaN(startPosition) && !isNaN(endPosition)) {
					var lowerBound = Math.min(startPosition, endPosition);
					var upperBound = Math.max(startPosition, endPosition);
					var currentRange;
					var isStartBefore;
					var isStartBetween;
					var isEndBetween;
					var isEndAfter;
					var i;

					for (i = 0; i < this._ranges.length; i++) {
						currentRange = this._ranges[i];

						isStartBefore = currentRange.start < lowerBound;
						isStartBetween =
							currentRange.start >= lowerBound &&
							currentRange.start <= upperBound;
						isEndBetween =
							currentRange.end >= lowerBound && currentRange.end <= upperBound;
						isEndAfter = currentRange.end > upperBound;

						if (fullInclude) {
							if (isStartBetween && isEndBetween) {
								foundRanges.push(currentRange);
							}
						} else if (
							(isStartBefore || isStartBetween) &&
							(isEndBetween || isEndAfter)
						) {
							foundRanges.push(currentRange);
						}
					}
				}

				return foundRanges;
			},

			setRangeActiveState: function (rangeId, activeState) {
				const targetRange = this.getRangeById(rangeId);

				if (targetRange) {
					targetRange.active = Boolean(activeState);
				}
			}
		}
	);
});
