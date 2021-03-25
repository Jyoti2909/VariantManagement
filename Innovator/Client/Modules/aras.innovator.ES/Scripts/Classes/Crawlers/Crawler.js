define(['dojo/_base/declare'], function (declare) {
	return declare('ES.Crawler', null, {
		_arasObj: null,

		lastValidationMessage: null,

		crawlerThreads: null,
		crawlerPaging: null,
		crawlerPeriod: null,
		crawlerType: null,
		crawlerParametersRegEx: null,

		/**
		 * Validate threads value
		 *
		 * @param {string} value of crawler threads
		 * @returns {boolean}
		 */
		isValidThreads: function (value) {
			if (!this.isInRange(value, this.crawlerThreads)) {
				var rangeText =
					this.crawlerThreads[0] === this.crawlerThreads[1]
						? this.crawlerThreads[1]
						: 'in the range ' +
						  this.crawlerThreads[0] +
						  '..' +
						  this.crawlerThreads[1];
				this.lastValidationMessage =
					"For '" +
					this.crawlerType +
					"' value must be " +
					rangeText +
					'. Edit again or replace with saved value?';
				return false;
			}
			return true;
		},

		/**
		 * Validate paging value
		 *
		 * @param {string} value of crawler paging
		 * @returns {boolean}
		 */
		isValidPaging: function (value) {
			if (this.crawlerPaging.length === 0) {
				if (value !== '') {
					this.lastValidationMessage =
						"For '" +
						this.crawlerType +
						"' value must be empty. Edit again or replace with saved value?";
					return false;
				}
			} else if (
				!this.isInRange(value, this.crawlerPaging) ||
				!this._arasObj.isInteger(value)
			) {
				var rangeText =
					this.crawlerPaging[0] === this.crawlerPaging[1]
						? this.crawlerPaging[1]
						: 'in the range ' +
						  this.crawlerPaging[0] +
						  '..' +
						  this.crawlerPaging[1];
				this.lastValidationMessage =
					"For '" +
					this.crawlerType +
					"' value must be " +
					rangeText +
					'. Edit again or replace with saved value?';
				return false;
			}
			return true;
		},

		/**
		 * Validate period value
		 *
		 * @param {string} value of crawler period
		 * @returns {boolean}
		 */
		isValidPeriod: function (value) {
			if (parseInt(value) < this.crawlerPeriod) {
				this.lastValidationMessage =
					"For '" +
					this.crawlerType +
					"' value must be greater than " +
					(this.crawlerPeriod - 1) +
					'. Edit again or replace with saved value?';
				return false;
			}
			return true;
		},

		/**
		 * Validate parameters value
		 *
		 * @param {string} value of crawler parameters
		 * @returns {boolean}
		 */
		isValidParameters: function (value) {
			return this.matchRegEx(value, this.crawlerParametersRegEx);
		},

		/**
		 * Get old property value from database
		 *
		 * @param {string} itemID
		 * @param {string} propertyName
		 * @returns {string}
		 */
		getOldPropertyValue: function (itemID, propertyName) {
			var oldValue = this._arasObj.newIOMItem('ES_Crawler', 'get');
			oldValue.setAttribute('id', itemID);
			oldValue.setAttribute('select', propertyName);
			oldValue = oldValue.apply();
			if (!oldValue.isError()) {
				return oldValue.getProperty(propertyName, '');
			} else {
				return '';
			}
		},

		/**
		 * Checks is parameter in range of two numbers
		 *
		 * @param {string} number to check
		 * @param {object} array bound
		 * @returns {boolean}
		 */
		isInRange: function (number, array) {
			return array.length === 2
				? parseInt(number) >= array[0] && parseInt(number) <= array[1]
				: false;
		},

		/**
		 * Validate field matching with regEx
		 *
		 * @param {string} value
		 * @param {RegExp} regEx
		 * @returns {boolean}
		 */
		matchRegEx: function (value, regEx) {
			var regExResult = value.match(regEx);
			if (
				regExResult === null ||
				(regExResult !== null && regExResult[0] !== value)
			) {
				if (regEx.toString() === '/^$/g') {
					this.lastValidationMessage =
						'Incorrect input. Value must be empty. Edit again or replace with saved value?';
				} else {
					this.lastValidationMessage =
						"Incorrect input. Note: no space between colon and dash (in case of using it like 'not'), " +
						'colon and word and no space between commas and words on both sides. Edit again or replace with saved value?';
				}
				return false;
			}
			return true;
		}
	});
});
