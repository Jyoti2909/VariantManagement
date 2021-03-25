// © Copyright by Aras Corporation, 2004-2012.

// Must be initialized on the page search been added.
var searchContainer = null;
var currentSearchMode = null;
var fromImplementationItemTypeName = undefined;

function SearchContainer(
	itemTypeName,
	gridInfo,
	menuInfo,
	searchLocation,
	searchPlaceholder,
	requiredProperties,
	searchToolbar
) {
	/// <summary>
	///   Mission of the SearchContainer class is to simplify adding search mechanism to any page in the Innovator.
	///   To use search at the page, a new instance of the class must be created.
	///   Class operates by Aras.Client.JS.SearchMode objects.
	/// </summary>
	/// <example>
	///   <code language="html">
	///<![CDATA[<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
	///<html>
	///<head>
	///  <title></title>
	///  <link rel="stylesheet" type="text/css" href="../styles/default.css" />
	///
	///  <script type="text/javascript" src="../javascript/include.aspx?classes=ScriptSet6"></script>
	///
	///</head>
	///<body>
	///
	///  <script type="text/javascript">
	///    onload = function onload_handler()
	///    {
	///      searchContainer = new SearchContainer(itemTypeName, grid, "My Search Location", searchPlaceholder);
	///      searchContainer.initSearchModesInToolbar();
	///      searchContainer.initSavedSearchesInToolbar();
	///      searchContainer.showAutoSavedSearchMode();
	///    }
	///  </script>
	///
	///  <table id="main_table" border="0" style="width: 100%; height: 100%; table-layout: fixed;"
	///    cellspacing="0" cellpadding="0">
	///    <tr style="height: 28px;">
	///      <td>
	///        <object id="toolbar">
	///        </object>
	///      </td>
	///    </tr>
	///    <tr id="searchPlaceholder" style="display: none; height: 0px;">
	///    </tr>
	///    <!-- IE has bug not allowing to set rows height in % when standards turned on. //
	///    tr_IE_fix_bug_with_height - special style from styles\default.css that helps to
	///    solve this problem.
	///    -->
	///    <tr class="tr_IE_fix_bug_with_height">
	///      <td>
	///        <object id="grid">
	///        </object>
	///      </td>
	///    </tr>
	///  </table>
	///</body>
	///</html>]]>
	/// </code>
	/// </example>
	/// <summary locid="M:J#Aras.Client.JS.SearchContainer.#ctor">
	/// This is summary for constructor.
	/// </summary>
	/// <param locid="M:J#Aras.Client.JS.InnovatorClient.#ctor" name="itemTypeName" type="string" mayBeNull="true">
	///   Name of the ItemType which items you want to search for.
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.InnovatorClient.#ctor" name="toolbar" mayBeNull="true" type="BaseComponent">
	///   Toolbar that will be used to operate by search.
	///   Instance of the Aras.Client.Controls.Toolbar. Must be loaded before passing into SearchContainer.
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.InnovatorClient.#ctor" name="grid" mayBeNull="true" type="BaseComponent">
	///   Grid to display search results. Also can be used by search mode for generating query (like "Simple" search mode do).
	///   Instance of the Aras.Client.Controls.GridContainer. Must be loaded before passing into SearchContainer.
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.InnovatorClient.#ctor" name="menu" mayBeNull="true" type="BaseComponent">
	///   Menu to operate by search.
	///   Instance of the Aras.Client.Controls.MainMenu. Must be loaded before passing into SearchContainer.
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.InnovatorClient.#ctor" name="searchLocation" type="string" mayBeNull="false">
	///   Name of the place where search will be used.
	///   This parameter has sence because search behaviour can be different in different search locations.
	///   See "SearchLocations" list for all possible search location values.
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.InnovatorClient.#ctor" name="searchPlaceholder" type="Object" mayBeNull="false">
	///   Object at the page which will contain search modes.
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.InnovatorClient.#ctor" name="requiredProperties" type="Object" mayBeNull="true">
	///   Name:Value collection of properties that must be applied to every quiery.
	/// </param>

	if (arguments.length === 0) {
		return;
	}

	this.itemTypeName = itemTypeName;

	function getObject(info) {
		return info && info.object && info.dojoOfObject ? info.object : info;
	}
	function getDojo(info) {
		return info && info.object && info.dojoOfObject
			? info.dojoOfObject
			: window.dojo;
	}

	this.grid = getObject(gridInfo);
	this._gridDojo = getDojo(gridInfo);

	this.searchToolbar = searchToolbar;

	this.searchLocation = searchLocation;
	this.searchPlaceholder = searchPlaceholder;
	this.requiredProperties = requiredProperties;
	this.defaultSearchProperties = new Object();
	this.redlineController = null;
	var tmpXmlDocument = aras.createXMLDocument();
	this.searchParameterizedHelper = new SearchParameterizedHelper(
		tmpXmlDocument
	);
	this.itemTypeCache = {};

	if (this.searchPlaceholder) {
		var newChildElementMustBeCreated = true;
		this.searchPlaceholderCell = null;
		if (this.searchPlaceholder.childNodes.length > 0) {
			for (var i = 0; i < this.searchPlaceholder.childNodes.length; i++) {
				if (
					this.searchPlaceholder.childNodes[i].id == 'searchPlaceholderCell'
				) {
					this.searchPlaceholderCell = this.searchPlaceholder.childNodes[i];
					newChildElementMustBeCreated = false;
					break;
				}
			}
		}

		if (newChildElementMustBeCreated) {
			var searchPlaceholderNodeName = this.searchPlaceholder.nodeName.toUpperCase();
			if (
				'TR' == searchPlaceholderNodeName ||
				'DIV' == searchPlaceholderNodeName
			) {
				this.searchPlaceholderCell = this.searchPlaceholder.appendChild(
					this.searchPlaceholder.ownerDocument.createElement(
						searchPlaceholderNodeName == 'TR' ? 'td' : 'div'
					)
				);
				this.searchPlaceholderCell.id = 'searchPlaceholderCell';
			} else {
				this.searchPlaceholderCell = searchPlaceholder;
			}
		}
	}

	// ************************************* Private SearchContainer members *************************************
	var getCriteriaFromAutoSavedSearch = false;
	var onSearchDialogUpdatesQueryExplicitly = false;

	// Variable will store last selected value in SavedSearch comboBox.
	// If user select new savedSearch and it's not compatible with current searchMode, user can cancel switching.
	// Variable will be used to return previously selected search.

	const searchCollection = {};
	var currentSearchFrame = null;

	function getSearchModeInstance(searchItemId, searchModeId, searchContainer) {
		if (!searchCollection[searchItemId]) {
			const searchModeItem = aras.getSearchMode(searchModeId);
			const newSearchModeName = aras.getItemProperty(searchModeItem, 'name');
			const newSearchModeLabel = aras.getItemProperty(searchModeItem, 'label');

			dojo.eval(aras.getItemProperty(searchModeItem, 'search_handler'));
			const newSearchMode = new window[newSearchModeName](
				searchContainer,
				aras
			);
			newSearchMode.id = searchModeId;
			newSearchMode.name = newSearchModeName;
			newSearchMode.label = newSearchModeLabel || newSearchModeName;
			searchCollection[searchItemId] = newSearchMode;
		}
		return { id: searchItemId, searchMode: searchCollection[searchItemId] };
	}

	function showIncompatibleAMLPromptDialog(message, showClearAllButton = true) {
		const win = aras.getMostTopWindowWithAras(window);
		const options = {
			title: aras.getResource('', 'search.warning')
		};
		if (showClearAllButton) {
			options.additionalButton = [
				{
					text: aras.getResource('', 'common.clear_all'),
					actionName: 'clear'
				}
			];
			options.buttonsOrdering = ['ok', 'clear', 'cancel'];
		}

		return win.ArasModules.Dialog.confirm(message, options);
	}

	function gridSortEventHandler(columnIdx, asc, ctrl) {
		if (aras.getVariable('SortPages') !== 'true') {
			return false;
		}
		var orderByValue = this.grid_Experimental
			.getSortProps()
			.filter(function (sortProperty) {
				return (
					sortProperty.attribute !== '_newRowMarker' &&
					sortProperty.attribute !== 'uniqueId'
				);
			})
			.map(function (sortProperty) {
				var columnIndex = this.grid_Experimental.parentContainer.getColumnIndex(
					sortProperty.attribute
				);
				var itemTypePropertyNode = searchContainer.getPropertyDefinitionByColumnIndex(
					columnIndex
				);
				var sortDirection = sortProperty.descending ? 'DESC' : 'ASC';

				return {
					name: aras.getItemProperty(itemTypePropertyNode, 'name'),
					sortDirection: sortDirection
				};
			}, this)
			.map(function (property) {
				return property.name + ' ' + property.sortDirection;
			})
			.join(', ');
		currentSearchMode.setOrderBy(orderByValue);
		searchContainer.runSearch();

		return true;
	}

	function notifyCuiLayout(eventType) {
		if (window.layout) {
			window.layout.observer.notify(eventType);
		}
	}
	// ************************************* Private SearchContainer members *************************************

	// ************************************* Privileged SearchContainer members *************************************
	this._applyRequiredProperties = function (searchAml) {
		if (!this.requiredProperties) {
			return searchAml;
		}

		var query = aras.newQryItem(this.itemTypeName);
		query.loadXML(searchAml);

		var useWildcards =
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_use_wildcards'
			) == 'true';
		for (var propName in this.requiredProperties) {
			var criteria = this.requiredProperties[propName];
			query.setCriteria(
				propName,
				criteria,
				useWildcards && /[%|*]/.test(criteria) ? 'like' : 'eq'
			);
		}

		return query.dom.xml;
	};

	this._applyDefaultSearchProperties = function (searchAml) {
		if (!this.defaultSearchProperties) {
			return searchAml;
		}

		var currItemType = this._getCurrentItemType();
		if (!currItemType) {
			return searchAml;
		}

		var query = aras.newQryItem(this.itemTypeName);
		query.loadXML(searchAml);

		var useWildcards =
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_use_wildcards'
			) == 'true';

		for (var propName in this.defaultSearchProperties) {
			var propNd = null;
			var propDT = '';
			var propDS = '';
			if (currItemType) {
				propNd = currItemType.selectSingleNode(
					"Relationships/Item[@type='Property' and name='" + propName + "']"
				);
			}

			if (propNd) {
				propDT = aras.getItemProperty(propNd, 'data_type');
				propDS = aras.getItemPropertyAttribute(propNd, 'data_source', 'name');
			}

			var criteria = this.defaultSearchProperties[propName];
			var condition = useWildcards && /[%|*]/.test(criteria) ? 'like' : 'eq';

			var criteriaProp = query.item.selectSingleNode(propName);
			if (!criteriaProp || userMethodColumnCfgs[propName].isFilterFixed) {
				if ('item' == propDT) {
					query.setPropertyCriteria(
						propName,
						'keyed_name',
						criteria,
						condition,
						propDS
					);
				} else {
					query.setCriteria(propName, criteria, condition);
				}
			}
		}

		this.defaultSearchProperties = {};
		return query.dom.xml;
	};

	this._saveSearch = function () {
		/// <summary>
		/// Allows to save current search criteria into SavedSearch.
		/// </summary>
		/// <remarks>
		/// There are two types of SavedSearches : shared (created by administrators and available to everybody) and identity-based(available to a particular identity).
		/// Administrator are able to create\modify all searches in the system;
		/// all other users are able to create\modify only searches which are assigned to their identity with is_alias=true.
		/// This method shows dialog allowing to input label for SavedSearch and specify type of it - shared or identity-based.
		/// </remarks>
		const formNd = aras.getItemByName('Form', 'SavedSearch Save Dialog', 0);
		const favorites = aras.getMainWindow().favorites;
		const pendingItems = favorites.pendingItems;

		if (!formNd) {
			return Promise.resolve();
		}

		const param = {
			aras: aras,
			title: aras.getResource('', 'search.favorite_search_title'),
			formId: formNd.getAttribute('id'),
			item: this._createNewSavedSearch(
				false,
				currentSearchMode.getAml(),
				currentSearchMode.id
			),
			dialogWidth: aras.getItemProperty(formNd, 'width') || 500,
			dialogHeight: aras.getItemProperty(formNd, 'height') || 150,
			content: 'ShowFormAsADialog.html'
		};

		const win = aras.getMostTopWindowWithAras(window);
		return win.ArasModules.Dialog.show('iframe', param)
			.promise.then(
				function (resultItem) {
					if (!resultItem) {
						return;
					}

					const savedSearchId = aras.getItemProperty(resultItem, 'id');
					const favoriteItem = {
						contextType: this.itemTypeName,
						label: aras.getItemProperty(resultItem, 'label'),
						quickAccess: aras.getItemProperty(resultItem, 'show_on_toc'),
						additionalData: {
							id: savedSearchId,
							location: aras.getItemProperty(resultItem, 'location'),
							search_mode: aras.getItemProperty(resultItem, 'search_mode')
						},
						mustViewById: aras.getItemProperty(resultItem, 'owned_by_id'),
						ownedBy: aras.getItemProperty(resultItem, 'owned_by_id'),
						savedSearchItemAml: resultItem.xml
					};
					const request = favorites.add('Search', favoriteItem);
					const tempId = pendingItems.get(favoriteItem);

					if (window.layout) {
						this.setFavorite(favorites.get(tempId), true);
					}

					return request;
				}.bind(this)
			)
			.then(
				function (favoriteItem) {
					if (!favoriteItem) {
						this.setFavorite(null, true);
						return;
					}

					this._updateAutoSavedSearch();
					aras.MetadataCache.RemoveItemById('56E808C94358462EAA90870A2B81AD96');
					if (window.layout) {
						this.setFavorite(favoriteItem, true);
					}
				}.bind(this)
			);
	};

	this._deleteSearch = function () {
		/// <summary>
		/// Deletes current SavedSearch displayed by SearchContainer.
		/// </summary>
		/// <remarks>
		/// Administrator are able to delete all searches in the system;
		/// all other users are able to delete only searches which are assigned to their identity with is_alias=true.
		/// </remarks>
		const currentFavoriteItem = this.currentFavoriteItem;
		if (!currentFavoriteItem) {
			return Promise.resolve();
		}

		const savedSearchLabel =
			currentFavoriteItem.label || aras.getResource('', 'common.no_label');

		const topWindow = aras.getMostTopWindowWithAras(window);
		const confirmDialogMessage = aras.getResource(
			'',
			'favorites.confirm_delete',
			savedSearchLabel
		);
		return topWindow.ArasModules.Dialog.confirm(confirmDialogMessage)
			.then(
				function (dialogResult) {
					if (dialogResult !== 'ok') {
						return;
					}

					// If user clicks “Yes” on it the currently selected saved search is deleted,
					// the drop-down list of saved searches is updated; search criteria (if shown in UI) is cleared
					// and the drop-down list shows that no saved search is currently selected (i.e. displays empty string).
					const request = aras
						.getMainWindow()
						.favorites.delete(currentFavoriteItem.id);

					if (window.layout) {
						this.setFavorite(null, true);
					}
					return request;
				}.bind(this)
			)
			.then(
				function (deleteResult) {
					if (!deleteResult) {
						this.setFavorite(currentFavoriteItem, true);
						return;
					}

					aras.MetadataCache.RemoveItemById(currentFavoriteItem.id);
					currentSearchMode.clearSearchCriteria();

					this._updateAutoSavedSearch();
				}.bind(this)
			)
			.catch(function (error) {
				const errorItem = this.aras.newIOMItem();
				errorItem.loadAML(error.responseText);
				return this.ArasModules.Dialog.alert(errorItem.getErrorString());
			});
	};

	this.setFavorite = function (favoriteItemObject, isSkipRunSearch) {
		const additionalData =
			(favoriteItemObject && favoriteItemObject.additional_data) || {};
		const savedSearchId = additionalData.id || null;
		this.currentSavedSearchId = savedSearchId;
		this.currentFavoriteItem = favoriteItemObject || null;
		notifyCuiLayout('SelectFavorite');
		if (!isSkipRunSearch) {
			this.runSearch();
		}
	};

	this.applyFavoriteSearch = function (favoriteItemObject) {
		if (!favoriteItemObject) {
			this.setFavorite(favoriteItemObject, true);
			return;
		}

		const additionalData = favoriteItemObject.additional_data || {};
		let criteriaToShow =
			additionalData.criteria ||
			"<Item type='" + this.itemTypeName + "' action='get'/>";
		const searchModeToShow = aras.getSearchMode(additionalData.search_mode);
		const searchModeToShowId = additionalData.search_mode;

		if (!searchModeToShowId) {
			return;
		}

		if (currentSearchMode.name === 'NoUI') {
			this._updateAutoSavedSearch(criteriaToShow);
			this._setAml(criteriaToShow);
			this.setFavorite(favoriteItemObject);
			return;
		}

		this.getCriteriaFromAutoSavedSearch = false;

		// If selected saved search has the same mode as the search mode currently set in UI then the selected search is rendered in UI.
		if (searchModeToShowId === currentSearchMode.id) {
			let switchToNewMode = 'ok';
			const callback = function (swichMode) {
				switchToNewMode = swichMode || switchToNewMode;
				if ('ok' === switchToNewMode || 'clear' === switchToNewMode) {
					if ('clear' === switchToNewMode) {
						currentSearchMode.clearSearchCriteria();
						criteriaToShow = currentSearchMode.getAml();
					}

					this._setAml(criteriaToShow);
					this._updateAutoSavedSearch(criteriaToShow);
				}
				this.setFavorite(favoriteItemObject, 'ok' !== switchToNewMode);
			}.bind(this);
			const testResult = currentSearchMode.testAmlForCompatibility(
				criteriaToShow
			);
			if (currentSearchMode.name === 'Simple' && !testResult) {
				const dialogMessage = aras.getResource(
					'',
					'search_container.aml_is_not_compatible_with_simple_search_mode'
				);
				const showClearAllButton = false;

				showIncompatibleAMLPromptDialog(dialogMessage, showClearAllButton).then(
					(result) => {
						if (result === 'ok') {
							this.showSearchMode('BEF4CDA54AA74362A2C40BD530D4D9DD'); //Id of AML search mode
							this.applyFavoriteSearch(favoriteItemObject);
						}
					}
				);
				return;
			}
			if (!testResult) {
				switchToNewMode = 'cancel';
				if (!currentSearchMode.isValidAML) {
					const dialogMessage = aras.getResource(
						'',
						'search_container.aml_is_not_compatible_with_new_search_mode',
						currentSearchMode.label
					);
					showIncompatibleAMLPromptDialog(dialogMessage).then(callback);
				} else {
					callback();
				}
			} else {
				callback();
			}
			return;
		}
		if (currentSearchMode.testAmlForCompatibility(criteriaToShow)) {
			this._updateAutoSavedSearch(criteriaToShow);
			this._setAml(criteriaToShow);
			this.setFavorite(favoriteItemObject);
			return;
		}
		if (currentSearchMode.isValidAML) {
			return;
		}

		const currentSearchModeItem = aras.getSearchMode(currentSearchMode.id);
		const curModeLabel = aras.getItemProperty(currentSearchModeItem, 'label');
		const newModeLabel = aras.getItemProperty(searchModeToShow, 'label');
		const dialogMessage = aras.getResource(
			'',
			'search_container.aml_is_not_compatible_with_new_search_mode2',
			curModeLabel,
			newModeLabel
		);
		const showClearAllButton = false;

		showIncompatibleAMLPromptDialog(dialogMessage, showClearAllButton).then(
			(result) => {
				if (result !== 'ok') {
					notifyCuiLayout('SelectFavorite');
					return;
				}

				this.getCriteriaFromAutoSavedSearch = true;
				this._updateAutoSavedSearch(criteriaToShow);
				if (this._ignoreAutoSavedSearch) {
					currentSearchMode.currQryItem.loadXML(criteriaToShow);
					this.getCriteriaFromAutoSavedSearch = false;
				}
				this.showSearchMode(searchModeToShowId);
				this.setFavorite(favoriteItemObject);
			}
		);
	};

	this._setAml = function (criteriaToShow) {
		criteriaToShow = this._applyDefaultSearchProperties(criteriaToShow);
		currentSearchMode.setAml(criteriaToShow);
		currentSearchMode.setSelect(
			aras.getSelectCriteria(
				getCurrentItemTypeId(),
				this.searchLocation == 'Relationships Grid',
				this.getVisibleXProps()
			)
		);
	};

	function getCurrentItemTypeId() {
		return aras.getItemTypeId(itemTypeName);
	}

	this._transformAml = function (searchAML, indent) {
		/// <summary>
		/// Causes child elements to be indented.
		/// </summary>
		/// <param name="searchAML">AML to indent.</param>
		tmpXmlDocument.loadXML(searchAML);

		var stylesheet = aras.createXMLDocument();
		stylesheet.loadXML(
			'<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">' +
				'  <xsl:output method="xml" indent="' +
				(indent ? 'yes' : 'no') +
				'" omit-xml-declaration="yes"/>' +
				(indent ? '  ' : '  <xsl:strip-space elements="*" />') +
				'  <xsl:template match="*">' +
				'    <xsl:copy>' +
				'      <xsl:copy-of select="@*"/>' +
				'      <xsl:apply-templates/>' +
				'    </xsl:copy>' +
				'  </xsl:template>' +
				'  <xsl:template match="comment()|processing-instruction()">' +
				'    <xsl:copy/>' +
				'  </xsl:template>' +
				'</xsl:stylesheet>'
		);

		return tmpXmlDocument.transformNode(stylesheet);
	};

	this._onSearchDialog = function SearchContainer_private_onSearchDialog(
		searchQueryAML
	) {
		const resItem = this._fireSearchEvents(searchQueryAML);
		searchQueryAML = resItem.item.xml;

		if (this._onSearchDialogEventMustBeInvoked()) {
			let searchModeToShow = '';
			if (resItem.item.getAttribute('idlist')) {
				searchModeToShow = 'NoUI';
				this.forceAutoSearch = true;
			} else {
				searchModeToShow = this.defaultSearchMode;
			}

			if (resItem.item.getAttribute('searchMode')) {
				searchModeToShow = resItem.item.getAttribute('searchMode');
			}

			const sMode = this._getSearchModeByName(searchModeToShow);
			if (sMode) {
				var sModeId = aras.getItemProperty(sMode, 'id');
				if (sModeId != currentSearchMode.id) {
					this._updateAutoSavedSearch(searchQueryAML);
					this._onSearchModeChange(sModeId, true, resItem);
					return;
				}

				currentSearchMode.onSearchDialogUpdatesQueryExplicitly = onSearchDialogUpdatesQueryExplicitly;
				currentSearchMode.userMethodColumnCfgs = userMethodColumnCfgs;
			}
			if (searchQueryAML) {
				this._updateAutoSavedSearch(searchQueryAML);
				this._setAml(searchQueryAML);
			}
		}
	};

	this._onDefaultSearch = function SearchContainer_private_onDefaultSearch() {
		let searchQueryAML = this._getSearchQueryAML();
		var resItem = this._fireSearchEvents(searchQueryAML);
		if (resItem.item) {
			searchQueryAML = resItem.item.xml;
		}

		if (searchQueryAML) {
			if (this._getSearchQueryAML() !== searchQueryAML) {
				this._updateAutoSavedSearch(searchQueryAML);
				this._setAml(searchQueryAML);
			}
		}
	};

	this._getSearchQueryAML = function SearchContainer_private_getSearchQueryAML(
		searchEventsResult
	) {
		var searchQueryAML;
		var re = new RegExp('^' + getCurrentItemTypeId() + '-');
		if (searchEventsResult) {
			searchQueryAML = searchEventsResult.item.xml;
		} else if (
			currentSearchMode &&
			currentSearchFrame &&
			currentSearchFrame.id.search(re) != -1 &&
			!this.getCriteriaFromAutoSavedSearch
		) {
			searchQueryAML = currentSearchMode.getAml();
		} else {
			var autoSavedSearch = this._getAutoSavedSearch();
			if (autoSavedSearch) {
				searchQueryAML = aras.getItemProperty(autoSavedSearch, 'criteria');
			} else {
				searchQueryAML = this._getDefaultSearchQueryAML();
			}
		}
		return searchQueryAML;
	};

	this._onSearchModeChange = function SearchContainer_private_onSearchModeChange(
		searchModeId,
		isRecursiveCall,
		searchEventsResult
	) {
		if (
			this.redlineController &&
			this.redlineController.IsRedlineCanBeDisable()
		) {
			this.redlineController.DisableRedline();
		}

		var newFrameId = getCurrentItemTypeId() + '-' + searchModeId;
		if (currentSearchFrame && currentSearchFrame.id == newFrameId) {
			return;
		}
		var newSearchIFrame = getSearchModeInstance(newFrameId, searchModeId, this);
		var newSearchMode = newSearchIFrame.searchMode;
		var searchQueryAML = this._getSearchQueryAML(searchEventsResult);
		var callback = function (swichMode) {
			var switchToNewMode = swichMode;
			if (switchToNewMode == 'ok' || switchToNewMode == 'clear') {
				// Continue – convert whatever is possible but drop conditions that could not be converted;
				// Clear – switch to Simple mode but clear all currently set conditions.

				// In AML search mode we need to indent AML, to make it readable for user.
				var amlSearchMode = this._getSearchModeByName('Aml');
				searchQueryAML = this._transformAml(
					searchQueryAML,
					amlSearchMode &&
						aras.getItemProperty(amlSearchMode, 'id') == searchModeId
				);

				// If switch to new search mode accepted, call onEndSearchMode method for currently loaded search mode.
				if (currentSearchMode && currentSearchMode.onEndSearchMode) {
					currentSearchMode.onEndSearchMode();
				}

				// Hide current search modes in search container.
				if (currentSearchMode && currentSearchMode.hide) {
					currentSearchMode.hide();
					this.toggleSearchPlaceholderVisibility(true);
				} else if (currentSearchFrame && currentSearchFrame.style) {
					currentSearchFrame.style.display = 'none';
				}

				currentSearchMode = newSearchMode;
				currentSearchFrame = newSearchIFrame;
				// Show current search mode
				if (currentSearchMode.show) {
					currentSearchMode.show();
					this.toggleSearchPlaceholderVisibility(false);
				} else if (currentSearchFrame.style) {
					currentSearchFrame.style.display = '';
				}

				// Call onStartSearchMode method for new search mode. Must be initialized by searchContainer object.
				if (currentSearchMode.onStartSearchMode) {
					currentSearchMode.onStartSearchMode(this);
				}

				if (switchToNewMode == 'clear') {
					currentSearchMode.clearSearchCriteria();
					searchQueryAML = currentSearchMode.getAml();
				}

				currentSearchMode.onSearchDialogUpdatesQueryExplicitly = onSearchDialogUpdatesQueryExplicitly;
				currentSearchMode.userMethodColumnCfgs = userMethodColumnCfgs;
				this._setAml(searchQueryAML);
				if (!onSearchDialogUpdatesQueryExplicitly) {
					this._updateAutoSavedSearch(searchQueryAML);
				}
			} else if (switchToNewMode == 'cancel' || !switchToNewMode) {
				// Cancel – do not switch mode;

				/*
				If rendering of the search is not possible in the lower complexity mode then a warning dialog appears:
				“The selected search could not be shown in {xxx} mode. Would you like to switch to {yyy} search mode?”
				If user says “Yes” then UI search mode is changed and selected search is rendered in UI;
				if user says “No” then UI remains unchanged (i.e. UI still shows old search criteria).
				*/
				if (!currentSearchFrame || !currentSearchMode) {
					var simpleSearchMode = this._getSearchModeByName(
						this.defaultSearchMode
					);
					if (simpleSearchMode) {
						this.showSearchMode(aras.getItemProperty(simpleSearchMode, 'id'));
					}

					return;
				}
			}

			notifyCuiLayout('SearchStateChange');
		}.bind(this);

		// switchToNewMode can have next values:
		// Cancel – do not switch mode;
		// Continue - convert whatever is possible but drop conditions that could not be converted;
		// Clear - switch to Simple mode but clear all currently set conditions.
		if (searchQueryAML != undefined) {
			// Check AML compatibility with new search mode
			if (
				onSearchDialogUpdatesQueryExplicitly ||
				newSearchMode.testAmlForCompatibility(searchQueryAML)
			) {
				callback('ok');
			} else {
				const dialogMessage = aras.getResource(
					'',
					'search_container.aml_is_not_compatible_with_new_search_mode',
					newSearchMode.label
				);
				showIncompatibleAMLPromptDialog(dialogMessage).then(callback);
			}
		} else {
			callback('cancel');
		}
	};

	this.attachEvents = [];

	this._attachEventHandlersToControls = function () {
		var tmpDojo, connectedEvent;
		if (this.grid) {
			tmpDojo = this._gridDojo;
			connectedEvent = tmpDojo.connect(
				this.grid,
				'gridSort',
				gridSortEventHandler
			);
			this.attachEvents.push({ dojo: tmpDojo, func: connectedEvent });
		}
		if (this.pagination) {
			const runSearchEventHandler = this.runSearch.bind(this);
			this.pagination.addEventListener('runSearch', runSearchEventHandler);
			let isValidPaginationInputsPrev = true;
			const removeInputEventHandler = this.pagination.on(
				'input',
				function () {
					const isValidPaginationInputs =
						this.pagination.pageSize !== null &&
						this.pagination.maxResults !== null;
					if (isValidPaginationInputsPrev !== isValidPaginationInputs) {
						window.notifyCuiLayout('SearchStateChange');
						isValidPaginationInputsPrev = isValidPaginationInputs;
					}
				}.bind(this)
			);
			this.attachEvents.push({
				removeEventHandlers: function () {
					removeInputEventHandler();
					this.pagination.removeEventListener(
						'runSearch',
						runSearchEventHandler
					);
				}.bind(this)
			});
		}
	};

	this._removeEventHandlersFromControls = function () {
		this.attachEvents.forEach(function (attachEvent) {
			if (attachEvent.removeEventHandlers) {
				attachEvent.removeEventHandlers();
				return;
			}
			attachEvent.dojo.disconnect(attachEvent.func);
		});
		this.attachEvents = [];
	};

	this.removeIFramesCollection = function () {
		Object.keys(searchCollection).forEach(function (id) {
			const searchMode = searchCollection[id];
			if (searchMode.remove) {
				searchMode.remove();
			}
		});
	};

	this._updateAutoSavedSearch = function (searchQueryAML) {
		if (
			this._ignoreAutoSavedSearch ||
			(!searchQueryAML && !currentSearchMode)
		) {
			return;
		}

		if (this.redlineController && this.redlineController.isRedlineActive) {
			return;
		}

		var autoSavedSearch = this._getAutoSavedSearch();
		if (!autoSavedSearch) {
			return;
		}

		var setEdit = false;

		if (
			currentSearchMode &&
			currentSearchMode.id !=
				aras.getItemProperty(autoSavedSearch, 'search_mode')
		) {
			const currentSearchModeItem = aras.getSearchMode(currentSearchMode.id);
			const searchModeNode = autoSavedSearch.selectSingleNode('./search_mode');
			searchModeNode.text = currentSearchMode.id;
			searchModeNode.setAttribute(
				'keyed_name',
				aras.getKeyedNameEx(currentSearchModeItem)
			);
			searchModeNode.setAttribute('type', 'SearchMode');
			setEdit = true;
		}

		if (searchQueryAML == undefined) {
			searchQueryAML = currentSearchMode.getAml();
		}
		if (searchQueryAML != undefined) {
			if (this._onSearchDialogEventMustBeInvoked()) {
				if (onSearchDialogUpdatesQueryExplicitly) {
					var tmpQueryItm = aras.newQryItem(this.itemTypeName);
					tmpQueryItm.loadXML(searchQueryAML);
					tmpQueryItm.removeAllCriterias();
					tmpQueryItm.item.removeAttribute('idlist');
					tmpQueryItm.item.removeAttribute('disableSearchMode');
					tmpQueryItm.item.removeAttribute('searchMode');
					searchQueryAML = tmpQueryItm.item.xml;
				} else {
					tmpXmlDocument.loadXML(searchQueryAML);
					tmpXmlDocument.documentElement.removeAttribute('idlist');
					searchQueryAML = tmpXmlDocument.xml;
				}
			}

			if (aras.getItemProperty(autoSavedSearch, 'criteria') != searchQueryAML) {
				aras.setItemProperty(autoSavedSearch, 'criteria', searchQueryAML);
				setEdit = true;
			}
		}

		if (setEdit) {
			autoSavedSearch.setAttribute('action', 'edit');
		}
	};

	this._onSearchDialogEventMustBeInvoked = function () {
		if (
			this.searchLocation == 'Search Dialog' &&
			sourceItemTypeName &&
			sourcePropertyName
		) {
			var sourceItemTypeNd = aras.getItemTypeForClient(
				sourceItemTypeName,
				'name'
			);

			if (!sourceItemTypeNd || !sourceItemTypeNd.node) {
				return false;
			}

			return (
				sourceItemTypeNd.node.selectNodes(
					'Relationships/Item[@type="Property" and name="' +
						sourcePropertyName +
						'"]/' +
						'Relationships/Item[@type="Grid Event" and grid_event="onsearchdialog"]/related_id/Item[@type="Method"]'
				).length > 0
			);
		}
		return false;
	};

	this._getSearchModeByName = function (sModeName) {
		if (!sModeName) {
			return null;
		}

		var modes = aras.getSearchModes();
		if (modes) {
			for (var i = 0; i < modes.length; i++) {
				if (aras.getItemProperty(modes[i], 'name') == sModeName) {
					return modes[i];
				}
			}
		}

		return null;
	};

	this._getAutoSavedSearch = function () {
		if (this._ignoreAutoSavedSearch) {
			return null;
		}
		let autoSavedSearches = aras.getSavedSearches(
			this.itemTypeName,
			this.searchLocation,
			true
		);
		if (!autoSavedSearches.length) {
			//  If no auto_saved SavedSearch was found - create default new with
			//  auto_saved = 1
			//  owned_by_id = currently logged is_alias identity id.
			//  managed_by_id = currently logged is_alias identity id.
			//  search mode = this.defaultSearchMode
			var searchModeId;
			var sMode = this._getSearchModeByName(this.defaultSearchMode);
			if (sMode) {
				searchModeId = aras.getItemProperty(sMode, 'id');
			}
			let newSavedSearch = this._createNewSavedSearch(
				true,
				this._getDefaultSearchQueryAML(),
				searchModeId
			);
			newSavedSearch = newSavedSearch.apply();
			if (!newSavedSearch.isEmpty() && !newSavedSearch.isError()) {
				autoSavedSearches = aras.getSavedSearches(
					this.itemTypeName,
					this.searchLocation,
					true,
					newSavedSearch.getID()
				);
			} else {
				aras.AlertError(newSavedSearch, window);
			}
		}
		const autoSavedSearch = autoSavedSearches.length
			? autoSavedSearches[0]
			: null;

		return autoSavedSearch;
	};

	this._createNewSavedSearch = function SearchContainer_private_createNewSavedSearch(
		isAutoSaved,
		criteria,
		searchModeId
	) {
		/// <summary>
		/// Creates but DOESN'T save an instance of SavedSearch.
		/// </summary>
		/// <param name="isAutoSaved" type="boolean">If specified, criteria will be populated with default_search property values.</param>
		/// <param name="criteria" type="boolean">AML query to store as criteria in the created SavedSearch instance.</param>
		/// <returns type="Item" mayBeNull="false">IOM Item</returns>

		//  If no auto_saved SavedSearch was found - create default new with
		//  auto_saved = 1
		//  owned_by_id = currently logged is_alias identity id.
		//  default search mode must be this.defaultSearchMode
		var aliasIdentityId = aras.getIsAliasIdentityIDForLoggedUser();

		var item = new Item('SavedSearch', 'add');
		item.setProperty('itname', this.itemTypeName);
		item.setProperty('auto_saved', isAutoSaved ? '1' : '0');
		item.setProperty('location', this.searchLocation);
		item.setProperty('owned_by_id', aliasIdentityId);
		item.setProperty('managed_by_id', aliasIdentityId);
		item.setProperty('criteria', criteria);
		if (searchModeId) {
			item.setProperty('search_mode', searchModeId);
		}
		return item;
	};

	this._getDefaultSearchQueryAML = function () {
		/// <summary>
		/// Generates default search aml for specified itemType.
		/// </summary>
		/// <returns type="string" mayBeNull="false">Returns string like <Item type="ItemTypeName" action="get" select="..."></Item></returns>
		const currItemType = this._getCurrentItemType();
		if (!currItemType) {
			return '';
		}

		const itTypeName = aras.getItemProperty(currItemType, 'name');
		const itTypeId = aras.getItemProperty(currItemType, 'id');
		const newCriteriaItem = aras.newQryItem(itTypeName, 'get');

		newCriteriaItem.setPage(1);
		newCriteriaItem.setSelect(
			aras.getSelectCriteria(
				itTypeId,
				this.searchLocation == 'Relationships Grid',
				this.getVisibleXProps()
			)
		);

		const isAllowWildcardsWithSearch =
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_use_wildcards'
			) === 'true';
		const condition = isAllowWildcardsWithSearch ? 'like' : 'eq';

		const visiblePropsItms = currItemType.selectNodes(
			aras.getVisiblePropertiesXPath(itTypeName)
		);

		const propertysWithOnlyEqCondition = [
			'boolean',
			'list',
			'color list',
			'filter list'
		];

		for (let i = 0; i < visiblePropsItms.length; i++) {
			const popertyItem = visiblePropsItms[i];
			const propName = aras.getItemProperty(popertyItem, 'name');
			const defSearch = aras.getItemProperty(popertyItem, 'default_search');
			const propDataType = aras.getItemProperty(popertyItem, 'data_type');

			if (defSearch) {
				newCriteriaItem.setCriteria(
					propName,
					defSearch,
					propertysWithOnlyEqCondition.includes(propDataType) ? 'eq' : condition
				);
			}
		}

		return newCriteriaItem.item.xml;
	};

	this._getCurrentItemType = function () {
		var isSearchDialog = this.searchLocation == 'Search Dialog';
		var currItemType;
		if (this.itemTypeCache[this.itemTypeName]) {
			currItemType = this.itemTypeCache[this.itemTypeName];
		} else {
			currItemType = aras.getItemTypeForClient(this.itemTypeName, 'name');
			this.itemTypeCache[this.itemTypeName] = currItemType;
		}
		if (currItemType.isError()) {
			if (isSearchDialog) {
				window.close();
			}
			return null;
		}

		return currItemType.node;
	};

	this._fireSearchEvents = function (searchAML) {
		var newCriteriaItem = aras.newQryItem(this.itemTypeName);
		newCriteriaItem.loadXML(searchAML);

		if (this.searchLocation != 'Search Dialog') {
			//search events are applicable to Search Dialog only
			return newCriteriaItem;
		}

		var currItemType = this._getCurrentItemType();
		if (!currItemType) {
			return newCriteriaItem;
		}

		if (!this.requiredProperties) {
			this.requiredProperties = new Object();
		}

		if (!searchAML) {
			newCriteriaItem.loadXML(this._getSearchQueryAML());
		}

		var useWildcards =
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_use_wildcards'
			) == 'true';

		var methodArgs = new Object();
		methodArgs.itemTypeName = itemTypeName;
		methodArgs.QryItem = newCriteriaItem;
		methodArgs.windowContext = searchArguments.aras;
		methodArgs.itemContext = searchArguments.itemContext;
		methodArgs.itemSelectedID = searchArguments.itemSelectedID;
		methodArgs.fromImplementationItemTypeName = fromImplementationItemTypeName; // input argument
		methodArgs.toImplementationItemTypeName = undefined; //output argument

		var propertiesWithDefaultSearchEvent = currItemType.selectNodes(
			'Relationships/Item[@type="Property"]/' +
				'Relationships/Item[@type="Grid Event" and grid_event="default_search"]/' +
				'related_id/Item[@type="Method"]'
		);

		for (var i = 0; i < propertiesWithDefaultSearchEvent.length; i++) {
			var methodNd = propertiesWithDefaultSearchEvent[i];
			var methodName = aras.getItemProperty(methodNd, 'name');

			var propNd = methodNd.selectSingleNode('../../../..');
			var propName = aras.getItemProperty(propNd, 'name');

			methodArgs.property_name = propName;
			var defSearch = aras.evalItemMethod(
				methodName,
				newCriteriaItem.item,
				methodArgs
			);
			if (defSearch) {
				if (
					-1 === this.grid.columns_Experimental.get(propName + '_D', 'index')
				) {
					this.defaultSearchProperties[propName] = defSearch;
				} else {
					var condition =
						useWildcards && /[%|*]/.test(defSearch) ? 'like' : 'eq';
					var propDT = aras.getItemProperty(propNd, 'data_type');
					var propDS = aras.getItemPropertyAttribute(
						propNd,
						'data_source',
						'name'
					);

					if ('item' == propDT) {
						newCriteriaItem.setPropertyCriteria(
							propName,
							'keyed_name',
							defSearch,
							condition,
							propDS
						);
					} else {
						newCriteriaItem.setCriteria(propName, defSearch, condition);
					}
				}
			} else {
				newCriteriaItem.removeCriteria(propName);
			}
		}

		if (sourceItemTypeName && sourcePropertyName) {
			var sourceItemTypeNd = aras.getItemTypeForClient(
				sourceItemTypeName,
				'name'
			);
			if (sourceItemTypeNd && sourceItemTypeNd.node) {
				var propertiesWithOnSearchEvent = sourceItemTypeNd.node.selectNodes(
					'Relationships/Item[@type="Property" and name="' +
						sourcePropertyName +
						'"]/' +
						'Relationships/Item[@type="Grid Event" and grid_event="onsearchdialog"]/' +
						'related_id/Item[@type="Method"]'
				);

				for (
					var index = 0;
					index < propertiesWithOnSearchEvent.length;
					index++
				) {
					var methodNd = propertiesWithOnSearchEvent[index];
					var methodName = aras.getItemProperty(methodNd, 'name');

					var propNd = methodNd.selectSingleNode('../../../..');
					var propName = aras.getItemProperty(propNd, 'name');

					var searchAmlBeforeMethod = '';
					if (newCriteriaItem.item != null) {
						searchAmlBeforeMethod = newCriteriaItem.item.xml;
					}
					userMethodColumnCfgs = aras.evalItemMethod(
						methodName,
						newCriteriaItem.item,
						methodArgs
					);

					if (
						methodArgs.QryItem.item != null &&
						searchAmlBeforeMethod != methodArgs.QryItem.item.xml
					) {
						onSearchDialogUpdatesQueryExplicitly = true;
						if (currentSearchMode) {
							currentSearchMode.onSearchDialogUpdatesQueryExplicitly = true;
						}
						newCriteriaItem = methodArgs.QryItem;
					}

					if (
						!userMethodColumnCfgs ||
						typeof userMethodColumnCfgs != 'object'
					) {
						userMethodColumnCfgs = new Object();
					}

					var filteredPropName;
					for (filteredPropName in userMethodColumnCfgs) {
						if (!userMethodColumnCfgs[filteredPropName].filterValue) {
							userMethodColumnCfgs[filteredPropName].filterValue = '';
						}
						if (!userMethodColumnCfgs[filteredPropName].isFilterFixed) {
							userMethodColumnCfgs[filteredPropName].isFilterFixed = false;
						}
					}

					for (filteredPropName in userMethodColumnCfgs) {
						var filterValue =
							userMethodColumnCfgs[filteredPropName].filterValue;
						this.defaultSearchProperties[filteredPropName] = filterValue;

						if (filterValue) {
							var colNum = this.grid.GetColumnIndex(filteredPropName + '_D');
							if (
								colNum == -1 &&
								userMethodColumnCfgs[filteredPropName].isFilterFixed
							) {
								this.requiredProperties[filteredPropName] = filterValue;
							} else {
								var condition =
									useWildcards && /[%|*]/.test(filterValue) ? 'like' : 'eq';
								var propNd = currItemType.selectSingleNode(
									'Relationships/Item[@type="Property" and name="' +
										filteredPropName +
										'"]'
								);
								const propertyDataType = aras.getItemProperty(
									propNd,
									'data_type'
								);
								if (propNd && propertyDataType === 'item') {
									var propDS = aras.getItemPropertyAttribute(
										propNd,
										'data_source',
										'name'
									);

									if (filteredPropName === 'current_state') {
										const mainWindow = window.aras.getMainWindow();
										const criteriaAML = mainWindow.ArasCore.searchConverter.simpleToAml(
											filterValue,
											filteredPropName,
											{
												type: propertyDataType,
												condition
											}
										);

										const domToAml = aras.createXMLDocument();
										domToAml.loadXML(criteriaAML);

										filterValue = domToAml.documentElement;
									}

									newCriteriaItem.setPropertyCriteria(
										filteredPropName,
										'keyed_name',
										filterValue,
										condition,
										propDS
									);
								} else {
									newCriteriaItem.setCriteria(
										filteredPropName,
										filterValue,
										condition
									);
								}
							}
						} else {
							newCriteriaItem.removeCriteria(filteredPropName);
						}
					}
				}
			}
		}

		if (
			methodArgs.toImplementationItemTypeName &&
			methodArgs.toImplementationItemTypeName !== itemTypeName
		) {
			var implementationItemType = aras.getItemTypeForClient(
				itemTypeName,
				'name'
			).node;
			if (aras.isPolymorphic(implementationItemType)) {
				var switchToItemType =
					itemTypeName == methodArgs.toImplementationItemTypeName
						? implementationItemType
						: implementationItemType.selectSingleNode(
								"Relationships/Item[@type='Morphae']/related_id/Item[name='" +
									methodArgs.toImplementationItemTypeName +
									"']"
						  );
				if (switchToItemType) {
					var switchToItemTypeId = switchToItemType.getAttribute('id');
					window.selectedPolyItemId = switchToItemTypeId;
				} else {
					aras.AlertError(
						"ItemType '" +
							itemTypeName +
							"' doesn't contain morhae '" +
							methodArgs.toImplementationItemTypeName +
							"'"
					);
				}
			}
		}
		fromImplementationItemTypeName = itemTypeName;

		return newCriteriaItem;
	};

	this._isSearchCriteriaEmpty = function (searchAML) {
		if (!searchAML) {
			return true;
		}

		var newCriteriaItem = aras.newQryItem(this.itemTypeName);
		newCriteriaItem.loadXML(searchAML);
		return newCriteriaItem.dom.documentElement.childNodes.length == 0;
	};

	this._initSearchMode = function () {
		/// <summary>
		///   Gets searchMode from auto_saved SavedSearch and loads it into the UI.
		/// </summary>
		/// <remarks>
		///   _getAutoSavedSearch returns saved search from server or creates new one and return it if nothing was found.
		///   If autoSavedSearch is null, this indicates some problems on the server. It is necessary to stop the search initialization.
		/// </remarks>
		let searchModeId = '';
		const autoSavedSearch = this._getAutoSavedSearch();
		if (!autoSavedSearch && !this._ignoreAutoSavedSearch) {
			return;
		}

		if (autoSavedSearch && !this._onSearchDialogEventMustBeInvoked()) {
			const searchCriteria = aras.getItemProperty(autoSavedSearch, 'criteria');
			if (!this._isSearchCriteriaEmpty(searchCriteria)) {
				searchModeId = aras.getItemProperty(autoSavedSearch, 'search_mode');
				const sMode = aras.getSearchMode(searchModeId);
				if (!sMode) {
					searchModeId = '';
				}
			}
		}

		if (!searchModeId) {
			// If no SearchMode with specified id found, try to use this.defaultSearchMode search.
			const simpleSearchMode = this._getSearchModeByName(
				this.defaultSearchMode
			);
			if (simpleSearchMode) {
				searchModeId = aras.getItemProperty(simpleSearchMode, 'id');
			} else {
				// If this.defaultSearchMode search not found - use any available SearchMode.
				const modes = aras.getSearchModes();
				if (modes && modes.length > 0) {
					searchModeId = aras.getItemProperty(modes[0], 'id');
				}
			}
		}

		this.showSearchMode(searchModeId);
	};

	this._setPageSizeAndMaxResultsToPaginationFromPrefs = function () {
		const currentItemType = this._getCurrentItemType();
		const itemTypeId = aras.getItemTypeId(this.itemTypeName);
		let pageSizeValue = aras.getPreferenceItemProperty(
			'Core_ItemGridLayout',
			itemTypeId,
			'page_size',
			null
		);
		let maxResultsValue = aras.getPreferenceItemProperty(
			'Core_ItemGridLayout',
			itemTypeId,
			'max_records',
			null
		);

		if (pageSizeValue === null) {
			pageSizeValue = aras.getItemProperty(
				currentItemType,
				'default_page_size'
			);
		}
		if (maxResultsValue === null) {
			maxResultsValue = aras.getItemProperty(currentItemType, 'maxrecords');
		}

		pagination.pageSize = pageSizeValue;
		pagination.maxResults = maxResultsValue;
	};

	this._initPagination = function () {
		window.pagination = document.querySelector('aras-pagination');
		if (!window.pagination) {
			return;
		}

		pagination.getTotalResults = getAndUpdatePageSizeAndMaxRecords;
		pagination.updateControlsState = updatePagination;

		if (this.searchLocation === 'Relationships Grid') {
			if (!isToolbarUsed) {
				pagesize = ''; //otherwise User cannot see all the records
			} else if (pagesize === '' || pagesize) {
				pagination.pageSize = pagesize;
			}
			pagination.getItem('pagination_max_results').hidden = true;
			pagination.render();
		} else {
			this._setPageSizeAndMaxResultsToPaginationFromPrefs();
		}

		this.pagination = window.pagination;
	};

	this._getPropertiesDictionary = function () {
		let currItemType = this._getCurrentItemType();
		let propXPath = "Relationships/Item[@type='Property']";
		let currItemTypeId = currItemType.id;
		let currItemTypeName = aras.getItemProperty(currItemType, 'name');
		let propertiesDictionary = {};

		let nodes = currItemType.selectNodes(propXPath);
		for (let i = 0, j = nodes.length; i < j; i++) {
			propertiesDictionary[aras.getItemProperty(nodes[i], 'name')] = nodes[i];
		}

		propXPath =
			"Relationships/Item[@type='xItemTypeAllowedProperty']/related_id/Item[@type='xPropertyDefinition']";
		nodes = currItemType.selectNodes(propXPath);
		for (let i = 0, j = nodes.length; i < j; i++) {
			aras.setItemProperty(nodes[i], 'source_id', currItemTypeId, false);
			aras.setItemPropertyAttribute(
				nodes[i],
				'source_id',
				'name',
				currItemTypeName
			);
			propertiesDictionary[aras.getItemProperty(nodes[i], 'name')] = nodes[i];
		}

		return propertiesDictionary;
	};
	// ************************************* End of privileged SearchContainer members *************************************
}

SearchContainer.prototype.initSearchContainer = function SearchContainer_initSearchContainer(
	ignoreAutoSavedSearch
) {
	/// <summary>
	/// Initialize search container.
	/// </summary>
	/// <param name="ignoreAutoSavedSearch">Flag for ignoring autoSavedSearch criterias and searchMode.</param>
	this._ignoreAutoSavedSearch = ignoreAutoSavedSearch;
	this.propertiesDictionary = this._getPropertiesDictionary();
	this._initPagination();
	this._initSearchMode();
	if (this._onSearchDialogEventMustBeInvoked()) {
		this._onSearchDialog();
	} else {
		this._onDefaultSearch();
	}
};

SearchContainer.prototype.defaultSearchMode = 'Simple';
SearchContainer.prototype.forceAutoSearch = false;

SearchContainer.prototype.getGrid = function SearchContainer_getGrid() {
	/// <summary>
	/// Gets grid object used to display search results.
	/// </summary>
	/// <returns type="Aras.Client.Controls.GridContainer" mayBeNull="true">TreeTable instance used by search.</returns>
	return this.grid;
};

SearchContainer.prototype.getMenu = function SearchContainer_getMenu() {
	/// <summary>
	/// Gets menu object containing search control objects.
	/// </summary>
	/// <returns type="Aras.Client.Controls.MainMenu" mayBeNull="true">MainMenu instance used by search.</returns>
	return;
};

SearchContainer.prototype.getStyleAttribute = function SearchContainer_getStyleAttribute(
	strAttributeName
) {
	/// <summary>
	/// Retrieves the value of the specified Style attribute of the SearchContainer.
	/// </summary>
	/// <param name="strAttributeName">Name of the attribute.</param>
	/// <returns>
	/// Variant that returns a String, number, or Boolean value as defined by the attribute.
	/// If the attribute is not present, this method returns null.
	/// </returns>
	this.searchPlaceholder.style.getAttribute(strAttributeName, attributeValue);
};

SearchContainer.prototype.toggleSearchPlaceholderVisibility = function SearchContainer_toggleSearchPlaceholderVisibility(
	isHidden
) {
	if (
		!this.searchPlaceholder ||
		!this.searchPlaceholder.classList.contains('aras-search-placeholder')
	) {
		return;
	}

	this.searchPlaceholder.classList.toggle(
		'aras-search-placeholder_hidden',
		isHidden
	);
};

SearchContainer.prototype.setStyleAttribute = function SearchContainer_setStyleAttribute(
	strAttributeName,
	attributeValue
) {
	/// <summary>
	/// Sets the value of the specified CSS attribute on the DOM element associated with <see cref="SearchContainer"/>.
	/// </summary>
	/// <remarks>
	///   Can be used to set height, visibility, etc. attributes.
	/// </remarks>
	/// <param name="strAttributeName">Name of the attribute.</param>
	/// <param name="attributeValue">Variant that specifies the string, number, or Boolean to assign to the attribute.</param>
	if (strAttributeName != 'height') {
		this.searchPlaceholder.style[strAttributeName] = attributeValue;
	}

	if (this.searchPlaceholderCell) {
		this.searchPlaceholderCell.style[strAttributeName] = attributeValue;
	}

	if (
		strAttributeName == 'height' &&
		typeof this.grid.RefreshHeight == 'function'
	) {
		this.grid.RefreshHeight();
	}
};

SearchContainer.prototype.getRequiredProperties = function SearchContainer_getRequiredProperties() {
	/// <summary>
	/// Gets requiredProperties object for SearchContainer.
	/// </summary>
	/// <returns type="Object">Object representing key/value collection of XPath to properties and values.</returns>
	return this.requiredProperties;
};

SearchContainer.prototype.setRequiredProperties = function SearchContainer_setRequiredProperties(
	requiredPropertiesObject
) {
	/// <summary>
	/// Sets requiredProperties object for SearchContainer.
	/// </summary>
	/// <remarks>
	/// In some cases SearchMode must return query containing immutable properties/values.
	/// This method allows user to specify such immutable criterias.
	/// </remarks>
	/// <example>
	/// <code language="JavaScript">
	/// <![CDATA[
	///   var reqProperties = new Object();
	///   reqProperties["source_id/Item[@type='MySourceItem']/name"] = 'my_item_name';
	///   reqProperties["related_id/Item[@type='MyRelatedItem']/label"] = 'related_item_label';
	///   searchContainer.setRequiredProperties(reqProperties);
	///   // In this case SearchMode.getAml() method will always return query containing next aml:
	///   // ....
	///   // <source_id>
	///   //  <Item type='MySourceItem'>
	///   //    <name>my_item_name</name>
	///   //  </Item>
	///   // </source_id>
	///   // <related_id>
	///   //  <Item type='MyRelatedItem'>
	///   //    <label>related_item_label</label>
	///   //  </Item>
	///   // </related_id>
	///   // ....
	/// ]]>
	/// </code>
	/// </example>
	/// <param name="requiredPropertiesObject">Object representing key/value collection of XPath to properties and values.</param>
	this.requiredProperties = requiredPropertiesObject;
};

SearchContainer.prototype.getPropertyDefinitionByColumnIndex = function SearchContainer_getPropertyDefinitionByColumnIndex(
	columnIdx
) {
	/// <summary>
	/// Gets definition for property corresponding to column in the grid with specified index.
	/// </summary>
	/// <remarks>
	/// Some SearchModes could use information from grid as source data for search query generation.
	/// And in some cases it will be required to know what property corresponds to the column.
	/// </remarks>
	/// <param name="columnIdx" type="Number" integer="true">Index of the column in grid.</param>
	/// <returns type="System.Xml.XmlNode">XmlNode containing property info.</returns>
	var propNd = null;

	if (!this.grid || columnIdx === undefined) {
		return null;
	}

	var columnName = this.grid.GetColumnName(columnIdx);
	var drl = columnName.substr(columnName.length - 2, columnName.length);
	var propertyName = columnName.substr(0, columnName.length - 2);
	if (columnName == 'L') {
		propertyName = 'locked_by_id';
		if (searchLocation == 'Relationships Grid') {
			drl = '_R';
		} else {
			drl = '_D';
		}
	}

	const handleXPropertyDefinition = function (
		propertyName,
		propertyXPath,
		itemTypeNd
	) {
		const propNd = itemTypeNd.selectSingleNode(propertyXPath);
		aras.setItemProperty(propNd, 'source_id', itemTypeNd.getAttribute('id'));
		aras.setItemPropertyAttribute(
			propNd,
			'source_id',
			'name',
			aras.getItemProperty(itemTypeNd, 'name')
		);
		return propNd;
	};

	var propXPath;
	var currItemType = this._getCurrentItemType();
	const isXProperty = propertyName.startsWith('xp-');
	if (isXProperty) {
		propXPath =
			"Relationships/Item[@type='xItemTypeAllowedProperty']/related_id/Item[@type='xPropertyDefinition' and name='" +
			propertyName +
			"']";
	} else {
		propXPath =
			"Relationships/Item[@type='Property' and name='" + propertyName + "']";
	}

	if (drl == '_D') {
		if (currItemType) {
			propNd = this.propertiesDictionary[propertyName];
		}
	} else if (drl == '_R') {
		var relshipTypeNd = aras.getRelationshipType(
			aras.getRelationshipTypeId(this.itemTypeName)
		);
		if (relshipTypeNd && relshipTypeNd.node) {
			var relatedId = aras.getItemProperty(relshipTypeNd.node, 'related_id');
			if (relatedId) {
				var relatedItemTypeNd = aras.getItemTypeDictionary(relatedId, 'id');
				if (relatedItemTypeNd && relatedItemTypeNd.node) {
					if (isXProperty) {
						propNd = handleXPropertyDefinition(
							propertyName,
							propXPath,
							relatedItemTypeNd.node
						);
					} else {
						propNd = relatedItemTypeNd.node.selectSingleNode(propXPath);
					}
				}
			}
		}
	}

	return propNd;
};

SearchContainer.prototype.getPropertyXPathByColumnIndex = function SearchContainer_getPropertyXPathByColumnIndex(
	columnIdx
) {
	/// <summary>
	/// Gets XPath to property corresponding to the column in the grid with specified index.
	/// </summary>
	/// <remarks>
	/// Some SearchModes could use information from grid as source data for search query generation.
	/// For example "Simple" search mode works in such way.
	/// This method allows to get explicitly path to criteria in search criteria dom.
	/// </remarks>
	/// <param name="columnIdx" type="Number" integer="true">Index of the column in grid.</param>
	/// <returns type="string">XPath to the property in grid; returns undefined in case when there are no grid or columnIdx not specified.</returns>
	var XPath = undefined;

	if (!this.grid || columnIdx === undefined) {
		return undefined;
	}

	var propNd = this.getPropertyDefinitionByColumnIndex(columnIdx);
	if (propNd) {
		XPath = "Item[@type='" + this.itemTypeName + "']/";
		var columnName = this.grid.GetColumnName(columnIdx);
		var drl = columnName.substr(columnName.length - 2, columnName.length);
		var sourceTypeName = propNd
			.selectSingleNode('source_id')
			.getAttribute('name');

		if (drl == '_R' || (drl == 'L' && searchLocation == 'Relationships Grid')) {
			XPath += "related_id/Item[@type='" + sourceTypeName + "']/";
		}

		XPath += aras.getItemProperty(propNd, 'name');
	}

	return XPath;
};

SearchContainer.prototype.showSearchMode = function SearchContainer_showSearchMode(
	searchModeId
) {
	/// <summary>
	/// Shows SearchMode in SearchContainer.
	/// </summary>
	/// <remarks>
	/// Method loads SearchMode into SearchContainer and initialize it with current search criteria.
	/// </remarks>
	/// <param name="searchModeId">Id of search mode to show.</param>
	this._onSearchModeChange(searchModeId);
};

SearchContainer.prototype.onEndSearchContainer = function SearchContainer_onEndSearchContainer() {
	/// <summary>
	/// This method have sense in case when you work with more than one SearchContainer.
	/// Method resets Search menu and removes handlers from controls for currently selected SearchContainer instance.
	/// </summary>
	this._updateAutoSavedSearch();
	this._removeEventHandlersFromControls();
};

SearchContainer.prototype.onStartSearchContainer = function SearchContainer_onStartSearchContainer() {
	/// <summary>
	/// This method have sense in case when you work with more than one SearchContainer. If you switch between them you may need to reinitilize controls.
	/// Method reinitializes Search menu and forces controls to work with currently selected SearchContainer instance.
	/// </summary>
	/// <remarks>
	/// You don't need to call this method if constructor of the SearchContainer is called.
	/// </remarks>
	this._attachEventHandlersToControls();
};

SearchContainer.prototype.runSearch = function SearchContainer_runSearch() {
	/// <summary>
	/// This method have sense in case when you work with more than one SearchContainer. If you switch between them you may need to reinitilize controls.
	/// Method reinitializes Search menu and forces controls to work with currently selected SearchContainer instance.
	/// </summary>
	/// <remarks>
	/// You don't need to call this method if constructor of the SearchContainer is called.
	/// </remarks>
	var searchAml = currentSearchMode.getAml();
	let isValidPaginationInputs = true;
	if (this.pagination) {
		const paginationControl = this.pagination;
		isValidPaginationInputs =
			paginationControl.pageSize !== null &&
			paginationControl.maxResults !== null;
	}
	if (searchAml != undefined && isValidPaginationInputs) {
		this._updateAutoSavedSearch(searchAml);
		searchAml = this._transformAml(searchAml, false);

		this.searchParameterizedHelper.replaceParametersInQuery(
			searchAml,
			null,
			function (searchAml) {
				if (searchAml != undefined) {
					searchAml = this._applyDefaultSearchProperties(searchAml);
					searchAml = this._applyRequiredProperties(searchAml);
					currQryItem.loadXML(searchAml);
					if (this.isFavoriteSearchChanged()) {
						this.applyFavoriteSearch(null);
					}
					doSearch_internal();
				}
			}.bind(this)
		);
	}
};

SearchContainer.prototype.runAutoSearch = function SearchContainer_runAutoSearch() {
	/// <summary>
	/// Determines if search should be started automatically. And if should starts the search.
	/// </summary>
	var startSearch = this.forceAutoSearch;

	if (!startSearch) {
		var currItemType = this._getCurrentItemType();
		if (currItemType) {
			startSearch = aras.getItemProperty(currItemType, 'auto_search') == '1';
		}
	}

	if (startSearch) {
		this.runSearch();
	}
};

SearchContainer.prototype._isNoCountModeForCurrentItemType = function () {
	var countModeExc = aras.getCommonPropertyValue('SearchCountModeException');
	var countModeShowCount =
		aras.getCommonPropertyValue('SearchCountMode').toLowerCase() === 'count';
	var itemId = this._getCurrentItemType().attributes.getNamedItem('id').value;
	return countModeShowCount === countModeExc.indexOf(itemId) > -1;
};

SearchContainer.prototype.getVisibleXProps = function (currItemTypeId) {
	const self = this;
	const colWidths = this.grid.getColWidths().split(';');

	let currItemType;
	if (currItemTypeId) {
		currItemType = aras.getItemTypeForClient(currItemTypeId, 'id');
		if (currItemType && !currItemType.isError()) {
			currItemType = currItemType.node;
		} else {
			return;
		}
	} else {
		currItemType = this._getCurrentItemType();
		currItemTypeId = aras.getItemProperty(currItemType, 'id');
	}

	const currItemTypeName = aras.getItemProperty(currItemType, 'name');
	const isRelationshipType =
		aras.getItemProperty(currItemType, 'is_relationship') == '1';

	const currItemTypeXProperties = this.grid
		.getLogicalColumnOrder()
		.split(';')
		.reduce(function (prev, curr, idx) {
			const propName = curr.slice(0, -2);
			if (propName.startsWith('xp-') && colWidths[idx] !== '0') {
				const propXPath =
					"Relationships/Item[@type='xItemTypeAllowedProperty' and not(inactive='1')]/related_id/Item[@type='xPropertyDefinition' and name='" +
					propName +
					"']";
				const xProp = currItemType.selectSingleNode(propXPath);
				if (xProp) prev.add(xProp);
			}
			return prev;
		}, new Set());

	const allXProperties = {};
	allXProperties[currItemTypeId] = [];
	currItemTypeXProperties.forEach(function (el) {
		allXProperties[currItemTypeId].push(el);
	});
	if (isRelationshipType) {
		const relType = aras.getRelationshipType(
			aras.getRelationshipTypeId(currItemTypeName)
		);
		if (relType && !relType.isError()) {
			const relatedTypeId = relType.getProperty('related_id');
			if (relatedTypeId) {
				allXProperties.related = this.getVisibleXProps(relatedTypeId);
			}
		}
	}
	return allXProperties;
};

SearchContainer.prototype.isFavoriteSearchChanged = function () {
	if (!this.currentFavoriteItem) {
		return false;
	}

	const getJsonCriterias = function (xml) {
		const minifiedXml = xml.replace(/>\s+</g, '><');
		const json = ArasModules.xmlToJson(minifiedXml);
		delete json.Item['@attrs'];

		return json.Item;
	}.bind(this);

	const additionalData = this.currentFavoriteItem.additional_data;
	const favoriteSearchAml = additionalData.criteria;
	const currentAppliedAml = currentSearchMode.getAml();

	return !ArasModules.utils.areEqual(
		getJsonCriterias(favoriteSearchAml),
		getJsonCriterias(currentAppliedAml)
	);
};

SearchContainer.prototype.getPolyItem = function () {
	const currItemType = this._getCurrentItemType();
	const polyItem = aras.isPolymorphic(currItemType) ? currItemType : null;
	return polyItem;
};
/*@cc_on
@if (@register_classes == 1)
Type.registerNamespace("Aras");
Type.registerNamespace("Aras.Client");
Type.registerNamespace("Aras.Client.JS");

Aras.Client.JS.SearchContainer = SearchContainer;
Aras.Client.JS.SearchContainer.registerClass("Aras.Client.JS.SearchContainer");
@end
@*/
