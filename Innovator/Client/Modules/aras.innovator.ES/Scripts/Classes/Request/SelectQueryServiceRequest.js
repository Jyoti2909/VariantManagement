define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'ES/Scripts/Classes/Request/ServiceRequestBase',
	'ES/Scripts/Classes/Facet',
	'ES/Scripts/Classes/Utils'
], function (declare, lang, ServiceRequestBase, Facet, Utils) {
	return declare('ES.SelectQueryServiceRequest', ServiceRequestBase, {
		/**
		 * Query text typed by user
		 */
		queryText: '',

		/**
		 * Start offset
		 */
		start: 0,

		/**
		 * Max count of rows that can be returned in response
		 */
		rows: 10,

		_requestFacets: [],

		_queryFacets: [],

		_resultFacets: [],

		_topFacets: new Map(),

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});

			this._requestFacets = [];
			this._queryFacets = [];
			this._topFacets = args.topFacets;
		},

		/**
		 * Build query item according to search parameters
		 *
		 * @private
		 */
		_buildQueryItem: function () {
			var self = this;

			this._queryItm = this._arasObj.newIOMItem('ItemType', 'ES_Search');
			this._queryItm.setProperty('query_text', this.queryText);
			this._queryItm.setProperty('start', this.start);
			this._queryItm.setProperty('rows', this.rows);
			if (this._requestFacets.length > 0) {
				this._queryItm.setProperty(
					'result_facets',
					this._requestFacets.toString()
				);
			}

			var facetNames = new Set();
			var hasDuplicatedFacetName = this._queryFacets.some(function (facet) {
				if (facet.isAnyOptionSelected() || self._requestFacets.length > 0) {
					if (facetNames.has(facet.name)) {
						return true;
					}

					var facetItm = self._arasObj.newIOMItem('Facet');
					facetItm.setProperty('solr_name', facet.solrName);
					facetItm.setProperty('name', facet.name);
					facetItm.setProperty(
						'indexed_types',
						facet
							.getIndexedTypes()
							.map((indexedType) => indexedType.name)
							.join(',')
					);
					if (self._requestFacets[0] === facet.name) {
						facetItm.setProperty('max_count', '-1');
					}
					facetNames.add(facet.name);

					var facetValues = facet.getOptions();
					facetValues.forEach(function (facetValue) {
						if (facetValue.isSelected) {
							var facetValueItm = self._arasObj.newIOMItem('FacetValue');
							facetValueItm.setProperty('value', facetValue.name);
							facetValueItm.setProperty('is_selected', '1');

							facetItm.addRelationship(facetValueItm);
						}
					});

					self._queryItm.addRelationship(facetItm);
				}
			});

			/**
			 * If options of both facets that have same name but different label is set
			 * it is expected to get no results, as they cannot have intersection.
			 * That is why it does not make sense to send a request as we receive invalid
			 * result that contain items for both facets.
			 */
			if (hasDuplicatedFacetName) {
				this._queryItm = null;
			}
		},

		_onAfterSuccessRun: function () {
			this._setResultFacets();
		},

		/**
		 * Sets new request facet
		 *
		 * @param {string} facetName Name of request facet
		 */
		setRequestFacet: function (facetName) {
			this._requestFacets.push(facetName);
		},

		/**
		 * Sets query facets
		 *
		 * @param {object} queryFacet Query facet object
		 */
		setQueryFacet: function (queryFacet) {
			this._queryFacets.push(queryFacet);
		},

		/**
		 * Returns total count of rows
		 *
		 * @returns {int}
		 */
		getTotalRows: function () {
			var totalRows = 0;

			if (this._isResponseEmpty() || this.isError()) {
				return totalRows;
			}

			totalRows = +this._responseItm.getProperty('result_count', '0');

			return totalRows;
		},

		/**
		 * Returns all documents from response
		 *
		 * @returns {Object[]} Documents
		 */
		getResultItems: function () {
			var self = this;
			var resultItems = [];

			if (this._isResponseEmpty() || this.isError()) {
				return resultItems;
			}

			var itms = this._responseItm.getItemsByXPath(
				'Relationships/Item[@type="ResultItem" and @is_found="1"]'
			);
			this._utils.iterateThroughItemsCollection(itms, function (itm) {
				var resultItem = self._buildResultItem(itm);
				resultItems.push(resultItem);
			});

			return resultItems;
		},

		/**
		 * Build result item object base on specified itm
		 *
		 * @param {object} itm Source item with data
		 * @returns {object}
		 * @private
		 */
		_buildResultItem: function (itm) {
			var self = this;
			var resultItem = {};

			var id = this._getItemProperty(itm, 'id', '');
			var type = this._getItemProperty(itm, 'aes_doc_type', '');
			var isFound = itm.getAttribute('is_found') === '1';

			resultItem.configurations = {
				iconPath: itm.getProperty('itemtype_icon', ''),
				itemTypeColor: itm.getProperty('itemtype_color', ''),
				itemTypeSingularLabel: itm.getProperty('itemtype_singular_label', '')
			};

			resultItem.fields = {
				title: this._utils.replaceSelection(
					this._utils.escapeHtml(itm.getProperty('title_field', ''))
				),
				additionalInfo: this._utils.replaceSelection(
					this._utils.escapeHtml(itm.getProperty('additional_info_field', ''))
				),
				subtitle: this._utils.replaceSelection(
					this._utils.escapeHtml(itm.getProperty('subtitle_field', ''))
				)
			};

			resultItem.properties = {};
			var propertyItms = itm.getItemsByXPath(
				'Relationships/Item[@type="Property"]'
			);
			this._utils.iterateThroughItemsCollection(propertyItms, function (
				propertyItm
			) {
				var name = propertyItm.getProperty('name', '');
				var type = propertyItm.getProperty('value_type', '');
				var title = self._utils.encode(propertyItm.getProperty('label', ''));
				var value = self._utils.encode(propertyItm.getProperty('value', ''));
				var isUI = propertyItm.getProperty('is_ui', '0');
				var label = value;

				if (type === 'date') {
					//Set formatted date as label
					label = self._utils.convertDateToLocalDateString(value);
				}

				if (name === 'file_size') {
					//Set formatted file size as label
					label = self._utils.convertBytesToSize(parseInt(value || '0'));
				}

				if (name !== 'keyed_name' && name.indexOf('keyed_name') !== -1) {
					//Find and update related property
					var prop =
						resultItem.properties[
							name.substring(0, name.indexOf('keyed_name') - 1)
						];
					if (!self._utils.isNullOrUndefined(prop)) {
						prop.label = value;
					}

					return;
				}

				resultItem.properties[name] = {
					type: type,
					title: title,
					value: value,
					label: label,
					isUI: isUI === '1'
				};
			});

			resultItem.highlights = this._getHighlights(id);
			if (isFound) {
				resultItem.subItems = this._getSubItems(itm);
			}

			/**
			 * Get property
			 *
			 * @param {string} name Name of the property
			 * @param {string} attribute Attribute: type, title, value, label
			 * @returns {string}
			 */
			resultItem.getProperty = function (name, attribute) {
				var res = '';

				if (this.properties[name] !== undefined) {
					var propertyObject = this.properties[name];

					switch (attribute) {
						case 'type':
							res = propertyObject.type;
							break;
						case 'title':
							res = propertyObject.title;
							break;
						case 'value':
							res = propertyObject.value;
							break;
						case 'label':
							res = propertyObject.label;
							break;
						case 'is_ui':
							res = propertyObject.isUI;
							break;
						default:
							res = propertyObject[attribute];
					}
				}

				return res;
			};

			return resultItem;
		},

		/**
		 * Get highlights of item with specified id
		 *
		 * @param {string} id Id of item
		 * @returns {Array}
		 * @private
		 */
		_getHighlights: function (id) {
			var self = this;
			var highlights = [];

			if (this._isResponseEmpty() || this.isError()) {
				return highlights;
			}

			var highlightItms = this._responseItm.getItemsByXPath(
				"Relationships/Item[@type='Highlight' and id='{0}']".replace('{0}', id)
			);
			this._utils.iterateThroughItemsCollection(highlightItms, function (
				highlightItm
			) {
				var propertyItms = highlightItm.getItemsByXPath(
					"Relationships/Item[@type='Property']"
				);
				self._utils.iterateThroughItemsCollection(propertyItms, function (
					propertyItm
				) {
					var propertyName = propertyItm.getProperty('name', '');
					var content = '';

					if (
						propertyName !== 'keyed_name' &&
						propertyName.indexOf('keyed_name') !== -1
					) {
						propertyName = propertyName.substring(
							0,
							propertyName.indexOf('keyed_name') - 1
						);
					}

					var propertyItms = propertyItm.getItemsByXPath(
						"Relationships/Item[@type='Property']"
					);
					self._utils.iterateThroughItemsCollection(propertyItms, function (
						propertyItm
					) {
						content += propertyItm.getProperty('value', '') + ' ';
					});

					highlights.push({
						name: propertyName,
						content: content
					});
				});
			});

			return highlights;
		},

		/**
		 * Get sub items of any level for specified item
		 *
		 * @param {object} itm Item
		 * @return {object[]}
		 * @private
		 */
		_getSubItems: function (itm) {
			var self = this;
			var subItems = [];

			if (this._isResponseEmpty() || this.isError()) {
				return subItems;
			}

			var id = this._getItemProperty(itm, 'id', '');
			var rootIds = this._getItemProperty(itm, 'aes_root_ids', '').split(',');

			//Remove id
			while (rootIds.indexOf(id) !== -1) {
				rootIds.splice(rootIds.indexOf(id), 1);
			}

			if (rootIds.length === 0) {
				return subItems;
			}

			var subItms = this._responseItm.getItemsByXPath(
				lang.replace(
					'Relationships/Item[@type="ResultItem" and @is_found="0" and Relationships/Item[@type="Property" and name="id" and ({0})]]',
					[
						rootIds
							.map(function (rootId) {
								return 'value="{0}"'.replace('{0}', rootId);
							})
							.join(' or ')
					]
				)
			);
			this._utils.iterateThroughItemsCollection(subItms, function (subItm) {
				subItems.push(self._buildResultItem(subItm));
			});

			return subItems;
		},

		/**
		 * Get value of property by it's name
		 *
		 * @param {object} sourceItm Source item
		 * @param {string} property Property name
		 * @param {string} defaultValue Default value if property is not specified
		 * @private
		 */
		_getItemProperty: function (sourceItm, property, defaultValue) {
			var res = defaultValue || '';

			var propertyItms = sourceItm.getItemsByXPath(
				"Relationships/Item[@type='Property' and name='{0}']".replace(
					'{0}',
					property
				)
			);
			if (propertyItms.getItemCount() === 1) {
				var propertyItm = propertyItms.getItemByIndex(0);

				var valueType = propertyItm.getProperty('value_type', '');
				if (valueType !== 'array') {
					res = propertyItm.getProperty('value', defaultValue);
				} else {
					var arr = [];

					var arrayPropertyItms = propertyItm.getItemsByXPath(
						"Relationships/Item[@type='Property']"
					);
					var count = arrayPropertyItms.getItemCount();
					for (var i = 0; i < count; i++) {
						var arrayPropertyItm = arrayPropertyItms.getItemByIndex(i);

						arr.push(arrayPropertyItm.getProperty('value', ''));
					}

					if (arr.length > 0) {
						res = arr.join(',');
					}
				}
			}

			return res;
		},

		/**
		 * Returns all facets from response
		 *
		 * @returns {Object[]} Facets
		 */
		getResultFacets: function () {
			return this._resultFacets;
		},

		/**
		 * Set result facets from response
		 */
		_setResultFacets: function () {
			var resultFacets = [];

			if (this._isResponseEmpty() || this.isError()) {
				this._resultFacets = resultFacets;
				return;
			}

			var searchWithinLabel = this._utils.getResourceValueByKey(
				'filters.search_within'
			);

			var resultFacetItms = this._responseItm.getItemsByXPath(
				'Relationships/Item[@type="Facet"]'
			);
			for (var i = 0; i < resultFacetItms.getItemCount(); i++) {
				var j;
				var resultFacetItm = resultFacetItms.getItemByIndex(i);

				var resultFacetName = resultFacetItm.getProperty('name', '');
				var resultFacetSolrName = resultFacetItm.getProperty('solr_name', '');
				var resultFacetLabel =
					resultFacetName === 'aes_root_types'
						? searchWithinLabel
						: resultFacetItm.getProperty('label', '');
				var queryFacet = this._getQueryFacet(resultFacetSolrName);
				var isQueryFacetFound = !this._utils.isNullOrUndefined(queryFacet);
				var topFacetData = this._topFacets.get(resultFacetName);

				var facet = new Facet();
				facet.id = i;
				facet.name = resultFacetName;
				facet.solrName = resultFacetSolrName;
				facet.title = resultFacetLabel;
				facet.isTop = !this._utils.isNullOrUndefined(topFacetData);
				if (facet.isTop) {
					facet.order = topFacetData.order;
					facet.title = topFacetData.label;
				}

				//Get item property to determine type
				var type = '';
				var propertyItms = this._responseItm.getItemsByXPath(
					'(Relationships/Item[@type="ResultItem"]/Relationships/Item[@type="Property" and name="{0}"])[1]'.replace(
						'{0}',
						resultFacetName
					)
				);
				if (propertyItms.getItemCount() === 1) {
					type = propertyItms.getProperty('value_type', '');
				}

				var optionItms = resultFacetItm.getItemsByXPath(
					'Relationships/Item[@type="Property"]'
				);
				for (j = 0; j < optionItms.getItemCount(); j++) {
					var optionItm = optionItms.getItemByIndex(j);

					var name = optionItm.getProperty('name', '');
					var label = optionItm.getProperty('label', '');
					label = label === '' ? name : label;
					label = this._utils.encode(label);
					var count = optionItm.getProperty('value', '');

					var isSelected = false;
					if (isQueryFacetFound) {
						isSelected = queryFacet.isOptionSelected(name);
					}

					facet.addOption(name, label, count, isSelected);
				}

				var indexedTypeItms = resultFacetItm.getItemsByXPath(
					'Relationships/Item[@type="IndexedType"]'
				);
				for (j = 0; j < indexedTypeItms.getItemCount(); j++) {
					var indexedTypeItm = indexedTypeItms.getItemByIndex(j);

					var itName = indexedTypeItm.getProperty('name', '');
					var itLabel = indexedTypeItm.getProperty('label', '');
					var itLabelPlural = indexedTypeItm.getProperty('label_plural', '');
					var itIconPath = indexedTypeItm.getProperty('icon', '');

					facet.addIndexedType(itName, itLabel, itLabelPlural, itIconPath);
				}

				if (optionItms.getItemCount() > 0) {
					resultFacets.push(facet);
				}
			}

			this._resultFacets = this._sortFacets(resultFacets);
		},

		/**
		 * Sort facets
		 *
		 * @param {object[]} facets Array of facets
		 * @private
		 */
		_sortFacets: function (facets) {
			return facets.sort(
				function (facetA, facetB) {
					var isFacetASelected = facetA.isAnyOptionSelected();
					var isFacetBSelected = facetB.isAnyOptionSelected();

					if (isFacetASelected && !isFacetBSelected) {
						return -1;
					} else if (!isFacetASelected && isFacetBSelected) {
						return 1;
					} else {
						if (facetA.isTop && !facetB.isTop) {
							return -1;
						} else if (!facetA.isTop && facetB.isTop) {
							return 1;
						} else if (facetA.isTop && facetB.isTop) {
							if (facetA.order - facetB.order === 0) {
								return facetA.title.toLowerCase() < facetB.title.toLowerCase()
									? -1
									: 1;
							}
							return facetA.order - facetB.order > 0 ? 1 : -1;
						} else if (!facetA.isTop && !facetB.isTop) {
							return facetA.title.toLowerCase() < facetB.title.toLowerCase()
								? -1
								: 1;
						}
					}
				}.bind(this)
			);
		},

		/**
		 * Returns all facets from request
		 *
		 * @returns {Object[]} Facets
		 */
		getQueryFacets: function () {
			return this._queryFacets;
		},

		/**
		 * Returns true if response is empty
		 *
		 * @returns {boolean}
		 * @private
		 */
		_isResponseEmpty: function () {
			return this._utils.isNullOrUndefined(this._responseItm);
		},

		_getQueryFacet: function (name) {
			var res = null;

			for (var i = 0; i < this._queryFacets.length; i++) {
				var queryFacet = this._queryFacets[i];

				if (queryFacet.solrName === name) {
					res = queryFacet;
					break;
				}
			}

			return res;
		},

		removeQueryFacet: function (facet) {
			if (this._utils.isNullOrUndefined(facet)) {
				return;
			}

			for (var i = 0; i < this._queryFacets.length; i++) {
				var queryFacet = this._queryFacets[i];
				if (queryFacet.solrName === facet.solrName) {
					this._queryFacets.splice(i, 1);
				}
			}
		},

		updateQueryFacet: function (facet) {
			if (this._utils.isNullOrUndefined(facet)) {
				return;
			}

			var isFound = false;
			for (var i = 0; i < this._queryFacets.length; i++) {
				var queryFacet = this._queryFacets[i];
				if (
					queryFacet.solrName === facet.solrName &&
					queryFacet.title === facet.title
				) {
					if (queryFacet._options.length !== facet._options.length) {
						var options = queryFacet.getOptions();
						for (var j = 0; j < options.length; j++) {
							var queryFacetOption = options[j];
							var facetOption = facet.getOption(queryFacetOption.name);
							if (this._utils.isNullOrUndefined(facetOption)) {
								facet.addOption(
									queryFacetOption.name,
									queryFacetOption.label,
									queryFacetOption.count,
									queryFacetOption.isSelected
								);
							}
						}
					}

					if (!facet.isAnyOptionSelected()) {
						this._queryFacets.splice(i, 1);
					} else {
						this._queryFacets[i] = facet;
					}

					isFound = true;
					break;
				}
			}

			if (!isFound && facet.isAnyOptionSelected()) {
				this._queryFacets.push(facet);
			}
		},

		resetQueryFacets: function () {
			this._queryFacets = [];
		},

		restoreDefaultQueryFacets: function () {
			var facetCurrentSolrName = 'ai_d_b_is_current';
			var isCurrentFacet = this._getQueryFacet(facetCurrentSolrName);

			if (isCurrentFacet === null) {
				var facetCurrentTopFacetData = this._topFacets.get('is_current');

				isCurrentFacet = new Facet();
				isCurrentFacet.solrName = facetCurrentSolrName;
				isCurrentFacet.title = this._utils.getResourceValueByKey(
					'filters.facet_current'
				);
				isCurrentFacet.name = 'is_current';
				isCurrentFacet.addOption('true', 'true', 0, true);
				isCurrentFacet.isTop = !this._utils.isNullOrUndefined(
					facetCurrentTopFacetData
				);
				if (isCurrentFacet.isTop) {
					isCurrentFacet.order = facetCurrentTopFacetData.order;
					isCurrentFacet.title = facetCurrentTopFacetData.label;
				}
			} else {
				var options = isCurrentFacet.getOptions();
				for (var i = 0; i < options.length; i++) {
					var option = options[i];
					if (option.name === 'true') {
						option.isSelected = true;
					}
				}
			}
			this.updateQueryFacet(isCurrentFacet);
		}
	});
});
