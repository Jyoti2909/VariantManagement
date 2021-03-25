// (c) Copyright by Aras Corporation, 2008-2009.

function SearchMode(searchContainer, aras) {
	/// <summary>
	/// This class provides interface and some basic functionality to create search modes.
	/// To create your own search mode inherit from SearchMode class and implement required UI.
	/// </summary>
	/// <remarks>
	/// <p>
	/// Innovator client sends AML requests to server to get data.
	/// End users may not know about AML. They'd like to use some user friendly UI.
	/// </p>
	/// <p>
	/// <h2 class="heading">Important</h2>
	/// The only purpose of any Search Mode is build AML query.
	/// That also provides some UI to do this.
	/// It is important to understand that Search Mode doesn't send the built AML query to server.
	/// </p>
	/// </remarks>
	/// <param name="searchContainer" type="Aras.Client.JS.SearchContainer" mayBeNull="false">
	/// Instance of Aras.Client.JS.SearchContainer class.
	/// </param>
	/// <param name="aras" type="Aras">
	/// Instance of Aras class
	/// </param>
	/// <example>
	/// <code language="JavaScript">
	///   function MySearchMode()
	///   {
	///   }
	///   MySearchMode.prototype = new SearchMode();
	///
	///   //your own onStartSearchMode implementation
	///   MySearchMode.prototype.onStartSearchMode = function MySearchMode_onStartSearchMode(sContainer)
	///   {
	///     // Call base onStartSearchMode method.
	///     SearchMode.prototype.onStartSearchMode.call(this, sContainer);
	///
	///     if (this.toolbar &amp;&amp; this.toolbar.IsButtonVisible("add_criteria"))
	///       toolbar.HideItem("add_criteria");
	///   }
	///
	///   //...
	///
	///   searchMode = new MySearchMode();// this is obligatory line. searchMode is predefined global variable.
	/// </code>
	/// </example>

	// ************************************* Privileged SearchMode members *************************************
	this._initCurrentQueryItem = function () {
		this.currQryItem = this.aras.newQryItem(this.searchContainer.itemTypeName);
		this.currQryItem.setPage(1);
	};

	this._getDatePattern = function (query_type) {
		var propName;
		switch (query_type) {
			case 'Released':
				propName = 'release_date';
				break;
			case 'Effective':
				propName = 'effective_date';
				break;
			case 'Latest':
				break;
			default:
				propName = 'modified_on';
				break;
		}

		var currItemType = this.aras.getItemTypeDictionary(
			this.currQryItem.itemTypeName
		).node;
		var ptrn = this.aras.getItemProperty(
			currItemType.selectSingleNode(
				"Relationships/Item[@type='Property' and name='" + propName + "']"
			),
			'pattern'
		);
		if (!ptrn) {
			ptrn = 'short_date_time';
		}
		return this.aras.getDotNetDatePattern(ptrn);
	};

	this._getStartEndOfDay = function (r, isEnd) {
		r = this.aras.convertToNeutral(
			r,
			'date',
			this.aras.getDotNetDatePattern('short_date_time')
		);
		r =
			r.substr(0, 4) +
			'-' +
			r.substr(5, 2) +
			'-' +
			r.substr(8, 2) +
			(!isEnd ? 'T00:00:00' : 'T23:59:59');
		return r;
	};

	this._createItemByXPath = function (itemXPath) {
		const isAppend =
			this.aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_append_items'
			) === 'true';

		const tags = this._parseXPath(itemXPath);
		let currentNode = null;
		tags.forEach((tagInfo, index, array) => {
			const tagName = tagInfo.tag;
			const itemType =
				tagName === 'Item' && tagInfo.attributes && tagInfo.attributes.type
					? tagInfo.attributes.type
					: '';
			let xPath = `${tagName}${itemType ? "[@type='" + itemType + "']" : ''}`;

			let tagNode = currentNode
				? currentNode.selectSingleNode(xPath)
				: this.currQryItem.dom.selectSingleNode(xPath);

			if (!tagNode) {
				const newNode = currentNode.ownerDocument.createElement(tagName);

				if (tagName === 'Item') {
					if (itemType) {
						newNode.setAttribute('type', itemType);
					}

					const isCurrentState = itemType === 'Life Cycle State';
					if (!isCurrentState) {
						newNode.setAttribute('action', 'get');
					}
				}

				currentNode = currentNode.appendChild(newNode);
			} else {
				if (isAppend && array.length > 0 && index === array.length - 1) {
					currentNode = tagNode.parentNode.appendChild(
						tagNode.cloneNode(false)
					);
				} else {
					currentNode = tagNode;
				}
			}
		});

		return currentNode;
	};

	this._parseXPath = function (xpath) {
		var resArr = [];
		if (!xpath) {
			return resArr;
		}

		var arr = xpath.split('/');
		var re = /Item(?:\[[^\[\]]*\])*\[@type=['"]([\w ]+)["']\](?:\[[^\[\]]*\])*/; //Item tag with @type criteria
		var re2 = /([^\[\]]+)(?:\[[^\[\]]*\])*(?:\[[^\[\]]*\])*/; //tag name with criteria

		for (var i = 0; i < arr.length; i++) {
			var t = arr[i];
			if (t == '.') {
				continue;
			}
			if (t == '..') {
				resArr.pop();
				continue;
			}

			var e = {};
			if (re.test(t)) {
				e.tag = 'Item';
				e.attributes = {};
				e.attributes.type = RegExp.$1;
			} else if (re2.test(t)) {
				e.tag = RegExp.$1;
			} else {
				e.tag = t;
			}

			resArr.push(e);
		}

		return resArr;
	};

	this._setPaginationValuesToCurrQryItem = function () {
		if (!this.pagination) {
			return;
		}

		const pageSizeValue = this.pagination.pageSize;
		const maxResultsValue = this.pagination.maxResults;
		const isValidPaginationInputs =
			pageSizeValue !== null && maxResultsValue !== null;
		if (!isValidPaginationInputs) {
			return;
		}

		const setPageSize = function (newPageSize, currentQueryPageSize) {
			this.setPageSize(newPageSize);

			newPageSize = newPageSize ? newPageSize.toString() : '';
			if (
				('' === newPageSize && '-1' !== currentQueryPageSize) ||
				currentQueryPageSize !== newPageSize
			) {
				return false;
			}
			return true;
		}.bind(this);

		const setMaxResults = function (newMaxResults, currentQueryMaxResults) {
			if (this.pagination.getItem('pagination_max_results').hidden) {
				return true;
			}

			this.setMaxRecords(newMaxResults);

			newMaxResults = newMaxResults ? newMaxResults.toString() : '';
			if ('' === newMaxResults && '-1' === currentQueryMaxResults) {
			} else if (currentQueryMaxResults !== newMaxResults) {
				return false;
			}
			return true;
		}.bind(this);

		const currentPageNumber = this.pagination.currentPageNumber;
		const updatePageNumberAfterSetPageSize = setPageSize(
			pageSizeValue,
			this.getPageSize()
		);
		const updatePageNumberAfterSetMaxResults = setMaxResults(
			maxResultsValue,
			this.getMaxRecords()
		);

		if (
			updatePageNumberAfterSetPageSize &&
			updatePageNumberAfterSetMaxResults
		) {
			this.setPageNumber(currentPageNumber);
		} else {
			this.setPageNumber(1);
			this.pagination.itemsCount = 0;
			this.pagination.showMoreButton();
		}
	};
	this._setQueryControlsValuesToCurrQryItem = function () {
		if (!window.layout || !window.layout.state) {
			return true;
		}
		const state = window.layout.state;

		if (state.query.type === undefined) {
			return true;
		}

		const queryType = state.query.type;
		if (queryType === 'Current') {
			this.currQryItem.removeItemAttribute('queryType');
			this.currQryItem.removeItemAttribute('queryDate');
		} else {
			this.currQryItem.setItemAttribute('queryType', queryType);

			const date =
				state.query.date || this.aras.parse2NeutralEndOfDayStr(new Date());
			if (!new Date(date).valueOf()) {
				this.aras.AlertError(
					this.aras.getResource('', 'search.please_enter_valid_as_of_date')
				);
				return false;
			}

			this.currQryItem.setItemAttribute('queryDate', date);
		}

		return true;
	};
	// ************************************* End of SearchMode SearchContainer members *************************************

	if (arguments.length === 0) {
		return;
	}

	this.aras = aras;
	this.searchContainer = searchContainer;
	this.grid = searchContainer.getGrid();
	this.pagination = searchContainer.pagination;
	this.searchToolbar = searchContainer.searchToolbar;
	this.id = '';
	this.name = '';
	this.complexity = 0;
	this.amlValidator = null;
	this.domToValidateXML = this.aras.createXMLDocument();
	this._initCurrentQueryItem();
	this.cache = {};
}

//contains true when validation succeded and false when failed.
SearchMode.prototype.isValidAML = true;
//contains true when search mode supports xClass search
SearchMode.prototype.supportXClassSearch = false;

SearchMode.prototype.xClassSearchCriteriaXPath =
	'./*[(translate(local-name(), "and", "AND")="AND" or translate(local-name(), "or", "OR")="OR"' +
	' or translate(local-name(), "not", "NOT")="NOT") and @xClassSearchCriteria="1"]';

SearchMode.prototype.onStartSearchMode = function SearchModeOnStartSearchMode() {
	/// <summary>
	/// Method called when the search mode loaded into SearchContainer.
	/// </summary>
	/// <remarks>
	/// Can be used to perform search mode UI initialization.
	/// </remarks>
};

SearchMode.prototype.onEndSearchMode = function SearchModeOnEndSearchMode() {
	/// <summary>
	/// Method called on SearchContainer dispose or when SearchContainer hides current search mode and shows another.
	/// </summary>
	/// <remarks>The purpose of this method is to perform some actions on SearchMode remove/dispose.</remarks>
	this.searchContainer.setStyleAttribute('display', 'none');
};

SearchMode.prototype.testAmlForCompatibility = function SearchModeTestAmlForCompatibility(
	searchAml
) {
	/// <summary>
	/// Tests AML for compatibility with current search mode.
	/// </summary>
	/// <remarks>
	/// Compatibility means that AML can be successfully parsed and displayed by search mode.
	/// </remarks>
	/// <param name="searchAml" type="string" mayBeNull="true">
	/// AML to test for compatibility.
	/// </param>
	/// <returns type="boolean">true if AML is compatible with current search mode, otherwise false.</returns>
	this.domToValidateXML.loadXML(searchAml);
	if (this.domToValidateXML.parseError.errorCode !== 0) {
		this.aras.AlertError(
			this.aras.getResource('', 'common.an_internal_error_has_occured'),
			this.aras.getResource(
				'',
				'search.bad_xml',
				this.domToValidateXML.parseError.reason
			),
			this.aras.getResource('', 'common.client_side_err')
		);
		this.isValidAML = true;
		return false;
	}

	if (this.amlValidator && this.generateValidationInfo) {
		var xmlSchemaCache = null;
		var currItemType = this.aras.getItemTypeDictionary(
			this.currQryItem.itemTypeName
		);
		var key = this.aras.MetadataCache.CreateCacheKey(
			'testAmlForCompatibility_xmlSchemaCache',
			this.name,
			currItemType.getId(),
			this.searchContainer.searchLocation,
			this.aras.getVariable('SortPages') == 'true'
		);
		var cachedResult = this.aras.MetadataCache.GetItem(key);

		if (!cachedResult) {
			var validationInfoObject = this.generateValidationInfo();
			var xsdSchema = this.amlValidator.generateSchema(validationInfoObject);
			xmlSchemaCache = xsdSchema;
			var resultToCache = this.aras.IomFactory.CreateCacheableContainer(
				xsdSchema,
				currItemType.node
			);
			this.aras.MetadataCache.SetItem(key, resultToCache);
		} else {
			xmlSchemaCache = cachedResult.Content();
		}
		this.isValidAML = this.amlValidator.validate(searchAml, xmlSchemaCache);
		if (!this.isValidAML) {
			return this.isValidAML;
		}
	}

	return true;
};

SearchMode.prototype.setAml = function SearchModeSetAml(searchAML) {
	/// <summary>
	/// Initializes search mode with AML.
	/// </summary>
	/// <param name="searchAML" type="string" mayBeNull="true">AML to initialize search mode.</param>
	if (
		!SearchMode.prototype.testAmlForCompatibility.call(this, searchAML) &&
		this.isValidAML
	) {
		return false;
	}

	this.currQryItem.loadXML(searchAML);
	this.currQryItem.setType(this.searchContainer.itemTypeName);
};

SearchMode.prototype.clearSearchCriteria = function SearchModeClearSearchCriteria() {
	/// <summary>
	/// Removes all criterias from current query item.
	/// </summary>
	/// <remarks>
	/// Removes all items criterias and where attribute. Value for select attribute will be reset to default.Required property values will be applied to query.
	/// </remarks>

	this.currQryItem.removeAllCriterias();
	this.currQryItem.removeItemAttribute('where');
	this.currQryItem.removeItemAttribute('order_by');

	if (this.grid && this.grid.isInputRowVisible()) {
		this.grid.SetPaintEnabled(false);
		for (var i = 0, j = this.grid.GetColumnCount(); i < j; i++) {
			var cell = this.grid.cells('input_row', i);
			if (cell.isEditable()) {
				cell.SetValue('');
			}
		}
		this.grid.SetPaintEnabled(true);
	}
};

SearchMode.prototype.getAml = function SearchModeGetAml() {
	/// <summary>
	/// Gets AML generated by search mode.
	/// </summary>
	/// <returns type="string">AML built by Search Mode.</returns>
	this._setPaginationValuesToCurrQryItem();

	const doc = XmlDocument();
	const useWildcards =
		this.aras.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_use_wildcards'
		) === 'true';
	let value;
	let criteria;
	let requiredPropertiesString = '';

	for (let propName in this.searchContainer.requiredProperties) {
		criteria = this.currQryItem.item.selectSingleNode(propName);
		if (!criteria) {
			value = this.searchContainer.requiredProperties[propName];
			criteria = doc.createElement(propName);
			criteria.text = value;
			criteria.setAttribute(
				'condition',
				useWildcards && /[%|*]/.test(value) ? 'like' : 'eq'
			);
			requiredPropertiesString += criteria.xml;
		}
	}
	if (
		ArasModules.utils.hashFromString(
			this.currQryItem.getCriteriesString() + requiredPropertiesString
		) !== this.getCacheItem('criteriesHash')
	) {
		this.removeCacheItem('itemmax');
		this.removeCacheItem('pagemax');
		this.removeCacheItem('criteriesHash');
		this.removeCacheItem('itemsWithNoAccessCount');
	}
	if (
		(this.getCacheItem('itemmax') && this.getCacheItem('pagemax')) ||
		this.searchContainer._isNoCountModeForCurrentItemType()
	) {
		this.setReturnMode('itemsOnly');
	} else {
		this.setReturnMode('countAndItems');
	}
	if (!this._setQueryControlsValuesToCurrQryItem()) {
		return;
	}

	return this.currQryItem.item.xml;
};

SearchMode.prototype.getPageNumber = function SearchModeGetPageNumber() {
	/// <summary>
	/// Gets page attribute for current query item.
	/// </summary>
	/// <returns type="Number" integer="true">Current page set in criteria. -1 will be returned if nothing specified.</returns>
	var page = this.currQryItem.getPage();
	if (!page) {
		page = -1;
	}
	return page;
};

SearchMode.prototype.setPageNumber = function SearchModeSetPageNumber(page) {
	/// <summary>
	/// Sets page attribute for current query item.
	/// </summary>
	/// <param name="page" type="Number" integer="true">Will have affect only if page size specified.</param>
	/// <remarks>Value should be a positive integer. In couple with page size allows arbitrary item selections.</remarks>
	/// <returns type="boolean">true if page was successfully set; false otherwise.</returns>
	if ('' === page || this.aras.isPositiveInteger(page)) {
		this.currQryItem.setPage(page);
		if (this.pagination) {
			this.pagination.currentPageNumber = page;
		}
		return true;
	} else {
		this.aras.AlertError(
			this.aras.getResource('', 'search.page_should_positive_integer'),
			'',
			'',
			window
		);
		return false;
	}
};

SearchMode.prototype.getPageSize = function SearchModeGetPageSize() {
	/// <summary>
	/// Gets pagesize attribute for current query item.
	/// </summary>
	/// <returns type="Number" integer="true">Current pagesize set in criteria. -1 will be returned if nothing specified.</returns>
	return this.currQryItem.getPageSize();
};

SearchMode.prototype.setPageSize = function SearchModeSetPageSize(pageSize) {
	/// <summary>
	/// Sets pagesize attribute for current query item.
	/// </summary>
	/// <param name="pageSize" type="Number" integer="true">Number of items per page to select.</param>
	/// <remarks>Value should be a positive integer.</remarks>
	/// <returns type="boolean">true if page size was successfully set; false otherwise.</returns>
	if (this.pagination) {
		this.currQryItem.setPageSize(pageSize || '');
		this.pagination.pageSize = pageSize;

		return true;
	}

	if ('' === pageSize || this.aras.isPositiveInteger(pageSize)) {
		this.currQryItem.setPageSize(pageSize);
		return true;
	} else {
		this.aras.AlertError(
			this.aras.getResource('', 'search.page_size_should_positive_integer'),
			'',
			'',
			window
		);
		return false;
	}
};

SearchMode.prototype.getMaxRecords = function SearchModeGetMaxRecords() {
	/// <summary>
	/// Gets maxRecords attribute for current query item.
	/// </summary>
	/// <returns type="Number" integer="true">Current maxRecords set in criteria. -1 will be returned if nothing specified.</returns>
	return this.currQryItem.getMaxRecords();
};

SearchMode.prototype.setMaxRecords = function SearchModeSetMaxRecords(
	maxRecords
) {
	/// <summary>
	/// Sets maxRecords attribute for current query item.
	/// </summary>
	/// <param name="maxRecords" type="Number" integer="true">The maximum number of items to retrieve.</param>
	/// <remarks>Value should be a positive integer.</remarks>
	/// <returns type="boolean">true if maxRecords was successfully set; false otherwise.</returns>
	if (this.pagination) {
		this.currQryItem.setMaxRecords(maxRecords || '');
		this.pagination.maxResults = maxRecords;

		return true;
	}

	if ('' === maxRecords || this.aras.isPositiveInteger(maxRecords)) {
		this.currQryItem.setMaxRecords(maxRecords);
		return true;
	} else {
		this.aras.AlertError(
			this.aras.getResource(
				'',
				'search.max_search_value_should_positive_integer'
			),
			'',
			'',
			window
		);
		return false;
	}
};

SearchMode.prototype.setReturnMode = function SearchModeSetReturnMode(
	returnMode
) {
	/// <summary>
	/// Sets returnMode attribute for current query item.
	/// </summary>
	/// <param name="returnMode" type="string">The value is considered to be a hint to the server to identify type of returned data.</param>
	this.currQryItem.setReturnMode(returnMode);
};

SearchMode.prototype.getOrderBy = function SearchModeGetOrderBy() {
	/// <summary>
	/// Gets order_by attribute for current query item.
	/// </summary>
	/// <returns type="string">Value of the order_by attribute.</returns>
	return this.currQryItem.getOrderBy();
};

SearchMode.prototype.setOrderBy = function SearchModeSetOrderBy(orderBy) {
	/// <summary>
	/// Sets order_by attribute for current query item.
	/// </summary>
	/// <param name="orderBy" type="string">
	/// You can sort query results by one or more of the properties in the returned items by using an order_by attribute.
	/// </param>
	/// <remarks>Supports the keywords ASC (ascending) and DESC (descending).</remarks>
	this.currQryItem.setOrderBy(orderBy);
	return true;
};

SearchMode.prototype.setSortOrderByGridInfo = function SearchModeSetSortOrderByGridInfo(
	head,
	orderBy
) {
	/// <summary>
	/// Sets order_by attribute for current query item.
	/// </summary>
	/// <param name="head" type="Map">
	/// Grid head info.
	/// </param>
	/// <param name="orderBy" type="array">
	/// OrderBy property from grid.
	/// </param>

	const orderByStatement = orderBy
		.map((orderInfo) => {
			const sortDirection = orderInfo.desc ? 'desc' : 'asc';
			const propertyName = head.get(orderInfo.headId, 'name');
			const dataType = head.get(orderInfo.headId, 'dataType');
			const isItem = dataType === 'item';
			const sortCriteria = isItem
				? `(keyed_name ${sortDirection})`
				: ` ${sortDirection}`;
			const nameWithDirection = `${propertyName}${sortCriteria}`;
			const linkProperty = head.get(orderInfo.headId, 'linkProperty');
			const orderByName = linkProperty
				? `${linkProperty}(${nameWithDirection})`
				: nameWithDirection;
			return orderByName;
		})
		.join();

	this.setOrderBy(orderByStatement);
};

SearchMode.prototype.getSelect = function SearchModeGetSelect() {
	/// <summary>
	/// Gets select attribute for current query item.
	/// </summary>
	/// <remarks>Select attribute contains list of item properties to select.</remarks>
	/// <returns type="string">Value of the select attribute.</returns>
	return this.currQryItem.getSelect();
};

SearchMode.prototype.setSelect = function SearchModeSetSelect(selectAttr) {
	/// <summary>
	/// Sets select attribute for current query item.
	/// </summary>
	/// <param name="selectAttr" type="string">List of properties names divided by comma.</param>
	this.currQryItem.setSelect(selectAttr);
};

SearchMode.prototype.getCacheItem = function SearchModeGetCacheItem(key) {
	/// <summary>
	/// Gets item from cache for current search mode.
	/// </summary>
	/// <param name="key" type="string">Key for access to cache item.</param>
	/// <remarks>Cache using for storage itemmax and pagemax values.</remarks>
	/// <returns type="any">Value of the cache item.</returns>
	return this.cache[key];
};

SearchMode.prototype.setCacheItem = function SearchModeSetCacheItem(
	key,
	value
) {
	/// <summary>
	/// Sets item to cache for current search mode.
	/// </summary>
	/// <param name="key" type="string">Key for access to cache item.</param>
	/// <param name="value" type="any">Value of cache item.</param>
	this.cache[key] = value;
};

SearchMode.prototype.removeCacheItem = function SearchModeRemoveCacheItem(key) {
	/// <summary>
	/// Delete item from cache for current search mode.
	/// </summary>
	/// <param name="key" type="string">Key for access to cache item.</param>
	delete this.cache[key];
};
/*@cc_on
@if (@register_classes == 1)
Type.registerNamespace("Aras");
Type.registerNamespace("Aras.Client");
Type.registerNamespace("Aras.Client.JS");

Aras.Client.JS.SearchMode = SearchMode;
Aras.Client.JS.SearchMode.registerClass("Aras.Client.JS.SearchMode");
@end
@*/
