define([
	'dojo',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojox/html/entities',
	'dojo/io-query',
	'ES/Scripts/Constants'
], function (dojo, declare, lang, entities, ioQuery, Constants) {
	return declare('ES.Utils', null, {
		_arasObj: null,

		_constants: null,

		_btnOkText: null,
		_btnCancelText: null,

		constructor: function (args) {
			this._arasObj = args.arasObj;

			this._constants = new Constants();

			this._btnOkText = this._arasObj.getResource('', 'common.ok');
			this._btnCancelText = this._arasObj.getResource('', 'common.cancel');
		},

		/**
		 * Returns true if parameter is null or undefined, otherwise false.
		 *
		 * @param {Object} obj Some variable
		 * @returns {boolean}
		 */
		isNullOrUndefined: function (obj) {
			return typeof obj === 'undefined' || obj === null;
		},

		/**
		 * Iterate through collection of innovator items
		 *
		 * @param {Array} itms Collection of items
		 * @param {Function} callback Callback
		 */
		iterateThroughItemsCollection: function (itms, callback) {
			if (itms.isError()) {
				return;
			}

			var itemCount = itms.getItemCount();
			for (var i = 0; i < itemCount; i++) {
				var itm = itms.getItemByIndex(i);

				callback(itm);
			}
		},

		/**
		 * Get image url
		 *
		 * @param {string} path Relative path or vault url
		 * @returns {string}
		 */
		getImageUrl: function (path) {
			var imageUrl = '';

			if (path === '') {
				return imageUrl;
			}

			if (!this.isNullOrUndefined(path) && path !== '') {
				if (path.indexOf('vault:///?fileId') === -1) {
					//It's a relative path
					imageUrl = this._arasObj.getBaseURL() + '/' + path;
				} else {
					//It's a vault url
					var fileId = path.replace(/vault:\/\/\/\?fileid\=/i, '');
					imageUrl = this._arasObj.IomInnovator.getFileUrl(
						fileId,
						this._arasObj.Enums.UrlType.SecurityToken
					);
				}
			}

			return imageUrl;
		},

		/**
		 * Convert Solr dates to local date format
		 *
		 * @param {string} date
		 * @returns {string}
		 */
		convertDateToLocalDateString: function (date) {
			var res = '';

			if (date === '') {
				return res;
			}

			res = this._arasObj.convertFromNeutral(date, 'date', 'short_date');

			return res;
		},

		/**
		 * Convert Solr dates to 'MM DD, YYYY' format
		 *
		 * @param {string} date
		 * @returns {string}
		 */
		convertDateToCustomFormat: function (date) {
			var res = '';

			if (date === '') {
				return res;
			}

			var monthShortNames = [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec'
			];

			var dateObj = new Date(date);
			var currentDay = dateObj.getDate();
			var currentMonthShortName = monthShortNames[dateObj.getMonth()];
			var currentYear = dateObj.getFullYear();

			res = lang.replace('{0} {1}, {2}', [
				currentMonthShortName,
				currentDay,
				currentYear
			]);

			return res;
		},

		/**
		 * Convert file size from bytes to user friendly format
		 *
		 * @param {number} byteLength
		 * @returns {string}
		 */
		convertBytesToSize: function (byteLength) {
			if (byteLength) {
				var sizeUnits = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
				var i = Math.floor(Math.log(byteLength) / Math.log(1024));

				return (byteLength / Math.pow(1024, i)).toFixed(1) + ' ' + sizeUnits[i];
			} else {
				return '0 Bytes';
			}
		},

		/**
		 * Convert date to Aras Innovator neutral format
		 *
		 * @param {Date} dt Date object
		 * @returns {string}
		 */
		convertDateToNeutralFormat: function (dt) {
			var dateString = dt.getFullYear() + '-';
			dateString += this.pad(dt.getMonth() + 1) + '-';
			dateString += this.pad(dt.getDate()) + 'T';
			dateString += this.pad(dt.getHours()) + ':';
			dateString += this.pad(dt.getMinutes()) + ':';
			dateString += this.pad(dt.getSeconds());

			return dateString;
		},

		/**
		 * Add zero to number if it's less than 10 (e.g. 1 => '01')
		 *
		 * @param {int} x Number
		 * @returns {string}
		 */
		pad: function (x) {
			return x < 10 ? '0' + x : '' + x;
		},

		/**
		 * Set visibility of specified HTML node
		 *
		 * @param {object} nd HTML node
		 * @param {boolean} visible Is visible?
		 */
		setNodeVisibility: function (nd, visible) {
			if (!this.isNullOrUndefined(nd)) {
				if (visible) {
					nd.classList.remove('hidden');
				} else {
					nd.classList.add('hidden');
				}
			}
		},

		/**
		 * Get xml resource by key
		 *
		 * @param {string|string[]} resourceKey Resource key(s)
		 * @returns {string|string[]} Returns corresponding string based on active locale. If method was called with array
		 * of resource keys - array with corresponding strings will be returned
		 */
		getResourceValueByKey: function (resourceKey) {
			var resultDom = this._arasObj.createXMLDocument();
			resultDom.load(
				this._arasObj.getI18NXMLResource(
					'ui_resources.xml',
					this._arasObj.getScriptsURL() + '../Modules/aras.innovator.ES/'
				)
			);

			if (!Array.isArray(resourceKey)) {
				resourceKey = [resourceKey];
			}

			var result = resourceKey.map(
				function (resourceKey) {
					var resourceNode = resultDom.selectSingleNode(
						'ui_resources/resource[@key="{0}"]'.replace('{0}', resourceKey)
					);
					return this.isNullOrUndefined(resourceNode)
						? ''
						: resourceNode.getAttribute('value');
				}.bind(this)
			);

			return result.length === 1 ? result[0] : result;
		},

		/**
		 * Get state of 'Aras.EnterpriseSearch' feature (true if activated, false otherwise)
		 *
		 * @returns {boolean}
		 */
		isFeatureActivated: function () {
			var itm = this._arasObj.newIOMItem('ItemType', 'ES_CheckFeature');
			itm = itm.apply();

			return !itm.isError();
		},

		/**
		 * Encode special symbols in string
		 *
		 * @param {string} str
		 * @returns {string}
		 */
		encode: function (str) {
			return entities.encode(str);
		},

		/**
		 * Get parent window
		 *
		 * @returns {object}
		 */
		getTopWindow: function () {
			return this._arasObj.getMostTopWindowWithAras(window);
		},

		/**
		 * Toggle spinner on ES main window
		 *
		 * @param {boolean} state Spinner state
		 * @param {Function} callback Callback function that will be executed after turning on ES spinner
		 * @returns {boolean}
		 */
		toggleSpinner: function (state, callback) {
			var spinner = document.getElementById('searchSpinner');

			if (!spinner) {
				return false;
			}

			this.setNodeVisibility(spinner, state);

			if (callback && state) {
				if (window.webkitRequestAnimationFrame) {
					setTimeout(callback, 1000 / 60);
				} else {
					window.requestAnimationFrame(callback);
				}
			}

			return true;
		},

		/**
		 * Truncate string to specified length
		 *
		 * @param {string} sourceString String which should be truncated
		 * @param {int} maxLength Max length of result string
		 * @returns {string}
		 */
		truncateString: function (sourceString, maxLength) {
			if (this.isNullOrUndefined(sourceString) || maxLength <= 0) {
				return sourceString;
			}

			var truncatedString = sourceString;
			if (truncatedString.length > maxLength) {
				truncatedString = truncatedString.substring(0, maxLength).concat('...');
			}

			return truncatedString;
		},

		/**
		 * Open non-item window with specified parameters
		 *
		 * @param {object} queryParams object with query params
		 * @param {string} [queryParams.query] string that will be used as search query
		 */
		openNewSearchTab: function (queryParams) {
			if (!queryParams) {
				queryParams = {};
			}

			var queryObject = {
				q: queryParams.query || ''
			};

			var queryString = ioQuery.objectToQuery(queryObject);

			var url = this._constants.mainPageURL;
			if (queryObject.q !== '') {
				url += '?' + queryString;
			}

			const arasTabsObj = this._arasObj.getMainWindow().arasTabs;

			const winName = 'es_' + Date.now();
			arasTabsObj.open(url, winName, false);
		},

		/**
		 * Sets new title for tab
		 *
		 * @param {string} newTitle string that must be set as new tab title
		 * @returns {boolean} returns true is title was successfully set. false otherwise
		 */
		updateTabTitle: function (newTitle) {
			if (typeof newTitle === 'string') {
				const tabId = window.name;
				const arasTabsObj = this._arasObj
					.getMainWindow()
					.mainLayout.tabsContainer.getTabbarByTabId(tabId);

				if (!this.isNullOrUndefined(arasTabsObj)) {
					arasTabsObj.updateTitleTab(tabId, {
						label: newTitle,
						image: '../images/EnterpriseSearch.svg'
					});
					return true;
				}
			}
			return false;
		},

		/**
		 * Runs callback function with specified time delay
		 *
		 * @param {function} callback function that must be executed after some delay
		 * @param {number} delay number that defines time delay
		 * @param {null|number} delayTimer timeout timer to work with
		 * @returns {number} returns positive integer value which identifies the timer created by the call to setTimeout();
		 * returns -1 if method was called with incorrect arguments
		 */
		execWithDelay: function (callback, delay, delayTimer) {
			if (!this.isNullOrUndefined(callback) && delay >= 0) {
				if (!this.isNullOrUndefined(delayTimer)) {
					clearTimeout(delayTimer);
				}

				return setTimeout(function () {
					callback();
				}, delay);
			}
			return -1;
		},

		/**
		 * Compares objects with array of facets
		 *
		 * @param {array} initialFacets Array of facets with which page has been initialized
		 * @param {array} currentFacets Array of currently selected facets
		 * @returns {boolean} Returns true arrays of facets are equal. Returns false otherwise
		 */
		compareFacets: function (initialFacets, currentFacets) {
			// If there is difference in selected facets count
			if (initialFacets.length !== currentFacets.length) {
				return false;
			}

			for (var i = 0; i < initialFacets.length; i++) {
				var isCurrentFacetWasFound = false;
				var initialFacet = initialFacets[i];

				for (var j = 0; j < currentFacets.length; j++) {
					var currentFacet = currentFacets[j];

					if (initialFacet.solrName !== currentFacet.solrName) {
						continue;
					}

					isCurrentFacetWasFound = true;

					// Here we assume that initial facet was found in current facets and compare state of both facets
					var isInitialFacetSelected = initialFacet.isAnyOptionSelected();
					var isCurrentFacetSelected = currentFacet.isAnyOptionSelected();
					if (isInitialFacetSelected !== isCurrentFacetSelected) {
						return false;
					}

					// Now we need to compare options
					// Use 'getOptions' method to be sure that options have same ordering
					var initialFacetOptions = initialFacet.getOptions();
					var currentFacetOptions = currentFacet.getOptions();

					var initialFacetSelectedOptions = initialFacetOptions.filter(
						function (option) {
							return option.isSelected;
						}
					);

					var currentFacetSelectedOptions = currentFacetOptions.filter(
						function (option) {
							return option.isSelected;
						}
					);

					if (
						initialFacetSelectedOptions.length !==
						currentFacetSelectedOptions.length
					) {
						return false;
					}

					for (var k = 0; k < initialFacetOptions.length; k++) {
						if (
							initialFacetOptions[k].isSelected !==
							currentFacetOptions[k].isSelected
						) {
							return false;
						}
					}
				}

				if (!isCurrentFacetWasFound) {
					return false;
				}
			}

			return true;
		},

		/**
		 * Sets/removes 'disabled' attribute to/from the DOM element
		 *
		 * @param {object} element DOM element
		 * @param {boolean} disabled Should element be disabled
		 */
		setNodeDisabledState: function (element, disabled) {
			if (!this.isNullOrUndefined(element)) {
				if (disabled) {
					element.setAttribute('disabled', 'disabled');
				} else {
					element.removeAttribute('disabled');
				}
			}
		},

		/**
		 * Returns Map of Top facets for current identity
		 *
		 * @returns {Map} Map of Top facets
		 */
		getTopFacets: function () {
			var res = new Map();
			var ES_SettingsItm = this._arasObj.getPreferenceItem('ES_Settings');
			var ES_SettingsId = this._arasObj.getItemProperty(ES_SettingsItm, 'id');
			var topFacetItms = this._arasObj.IomInnovator.applyAML(
				this._constants.topFacetsRequestAML.replace('{0}', ES_SettingsId)
			);

			// if current identity does not have default facets yet - we need to get them from World identity
			if (topFacetItms.getItemCount() === 0) {
				topFacetItms = this._arasObj.IomInnovator.applyAML(
					this._constants.defaultTopFacetsRequestAML
				);
				topFacetItms = topFacetItms.getItemsByXPath(
					"//Item[@type='ES_SettingsTopFacets']"
				);
			}

			var topFacetItmsCount = topFacetItms.getItemCount();
			for (var i = 0; i < topFacetItmsCount; i++) {
				var topFacetItm = topFacetItms.getItemByIndex(i);
				var propertyLabel = topFacetItm.getProperty('property_label', '');
				var propertyName = topFacetItm.getProperty('property_name', '');
				var sortOrder = topFacetItm.getProperty('sort_order', 0);

				res.set(propertyName, {
					label: propertyLabel,
					order: +sortOrder
				});
			}

			return res;
		},

		/**
		 * Applies/removes CSS class to/from the DOM element based on the condition
		 *
		 * @param {object} element DOM element
		 * @param {boolean} condition If condition is true - CSS class will be added to the DOM element, removed otherwise
		 * @param {string} cssClass CSS class name
		 */
		switchClassByCondition: function (element, condition, cssClass) {
			if (condition) {
				element.classList.add(cssClass);
			} else {
				element.classList.remove(cssClass);
			}
		},

		/**
		 * Toggles CSS class on DOM element
		 *
		 * @param {object} element DOM element
		 * @param {string} cssClass CSS class name
		 */
		toggleClass: function (element, cssClass) {
			var hasClass = element.classList.contains(cssClass);

			this.switchClassByCondition(element, !hasClass, cssClass);
		},

		/**
		 * Swaps CSS class from between two DOM elements
		 *
		 * @param {object} element1 DOM element
		 * @param {object} element2 DOM element
		 * @param {string} cssClass CSS class name
		 */
		swapClass: function (element1, element2, cssClass) {
			if (element1.classList.contains(cssClass)) {
				element1.classList.remove(cssClass);
				element2.classList.add(cssClass);
			} else {
				element2.classList.remove(cssClass);
				element1.classList.add(cssClass);
			}
		},

		/**
		 * Returns width of current browser scroll bar
		 *
		 * @return {number} width of current browser scroll bar
		 */
		getBrowserScrollWidth: function () {
			return this._arasObj.Browser.isEdge() ? 16 : 17;
		},

		/**
		 * Replaces node's content with string that corresponds to active language
		 *
		 * @param {object} node DOM node
		 */
		processMultilingualNodes: function (node) {
			if (this.isNullOrUndefined(node)) {
				node = document;
			}

			var multilingualNodes = node.querySelectorAll('[data-ml]');
			for (var i = 0; i < multilingualNodes.length; i++) {
				var multilingualNode = multilingualNodes[i];
				var multilingualNodeKey = multilingualNode.getAttribute('data-ml');

				multilingualNode.innerText = this.getResourceValueByKey(
					multilingualNodeKey
				);
			}
		},

		/**
		 * Show confirm dialog
		 *
		 * @param {string} message Dialog message
		 * @returns {Promise<boolean>} Promise with result value: OK - true, Cancel - false
		 */
		showConfirmDialog: function (message) {
			var param = {
				buttons: {
					btnOK: this._btnOkText,
					btnCancel: this._btnCancelText
				},
				defaultButton: 'btnCancel',
				message: message,
				aras: this._arasObj,
				dialogWidth: 300,
				dialogHeight: 150,
				center: true,
				content: 'groupChgsDialog.html'
			};
			var win = this._arasObj.getMostTopWindowWithAras(window);
			var dialog = (win.main || win).ArasModules.Dialog.show('iframe', param);

			return dialog.promise.then(function (result) {
				return result === 'btnOK';
			});
		},

		replaceSelection: function (htmlMarkup) {
			return htmlMarkup
				.replace(/\[es_start_selection]/g, '<b class="esHighlight">')
				.replace(/\[es_end_selection]/g, '</b>');
		},

		/**
		 * Escape HTML special characters
		 *
		 * @param {string} htmlMarkup HTML markup
		 * @returns {string}
		 */
		escapeHtml: function (htmlMarkup) {
			return htmlMarkup
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		},

		/**
		 * Unescape HTML special characters
		 *
		 * @param {string} htmlText HTML text
		 * @returns {string}
		 */
		unescapeHtml: function (htmlText) {
			return htmlText
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#039;/g, "'");
		}
	});
});
