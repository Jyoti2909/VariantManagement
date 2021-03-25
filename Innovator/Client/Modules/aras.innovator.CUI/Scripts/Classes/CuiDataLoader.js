var CuiDataLoader = (function () {
	var blankText = { text: '' };
	const dataCache = {};

	function CuiDataLoader() {
		this.utils = new CuiUtils();
	}

	function isPresentableItem(itemTypeId) {
		if (!itemTypeId) {
			return false;
		}
		var item = aras.getItemTypeForClient('PresentableItems', 'name');
		var morphaeList = aras.getMorphaeList(item.node);
		return morphaeList.some(function (item) {
			return item.id === itemTypeId;
		});
	}

	CuiDataLoader.prototype.getCommandBarDependencies = function (
		locationName,
		contextItem
	) {
		///<summary>
		///Accepts same context params as GetCommandBarItems.
		///Calls client GetCommandBarDependencies method that returns bool indicating is corresponding configurable
		///  UI dependent of missing context params (now serves only itemID skipping for caching)
		///</summary>
		return aras.evalMethod(
			'GetCommandBarDependencies',
			'',
			this.getRequestParams(locationName, contextItem)
		);
	};

	// do not use null, use '' for (server method/cache) params; todo: causes trapped exc. e.g., on TWMM
	CuiDataLoader.prototype.getRequestParams = function (
		locationName,
		contextItem
	) {
		///<summary>
		///For cache request and related dependency check
		///</summary>
		var classification =
			contextItem['item_classification'] ||
			(contextItem.item && contextItem.item.nodeType === 1
				? (
						contextItem.item.selectSingleNode('Item/classification') ||
						blankText
				  ).text
				: '');
		var itemTypeId = contextItem.itemType
			? contextItem.itemType.getAttribute('id')
			: '';
		return {
			item_id: isPresentableItem(itemTypeId) ? contextItem.itemID : '',
			item_type_id: itemTypeId,
			location_name: locationName,
			item_classification: classification
		};
	};

	CuiDataLoader.prototype.loadCommandBar = function (
		locationName,
		contextItem,
		contextParams
	) {
		///<summary>
		///Loads on server, then applies client builder methods. Doesn't use cache if config is item dependent
		///</summary>
		/// <param name='locationName'></param>
		/// <param name='contextParams'>Object with context-specific properties</param>
		///<returns>CommandBarItem(s)</returns>
		var res;
		this.loadCommandBarImplementation(
			locationName,
			contextItem,
			false,
			contextParams
		).then(function (items) {
			res = items;
		});
		return res;
	};

	CuiDataLoader.prototype.loadCommandBarAsync = function (
		locationName,
		contextItem
	) {
		return this.loadCommandBarImplementation(locationName, contextItem, true);
	};

	CuiDataLoader.prototype.loadCommandBarImplementation = function (
		locationName,
		contextItem,
		async,
		contextParams
	) {
		var getConfigurableUiItemIsDependent = function (contextItem) {
			var items = aras.newIOMItem('Method', 'GetCommandBarItems');
			if (contextItem.itemID) {
				items.setProperty('item_id', contextItem.itemID);
			}
			if (contextItem.itemType) {
				items.setProperty(
					'item_type_id',
					contextItem.itemType.getAttribute('id')
				);
			}
			items.setProperty('location_name', locationName);
			if (contextItem.item) {
				items.setProperty(
					'item_classification',
					(
						contextItem.item.selectSingleNode('Item/classification') ||
						blankText
					).text
				);
			}
			items = items.apply();
			return items.dom;
		};

		contextItem = contextItem || this.utils.getDefaultContextItem();
		var requestParams = this.getRequestParams(locationName, contextItem);
		var isItemDependent = this.getCommandBarDependencies(
			locationName,
			contextItem
		);

		return (function () {
			var items;
			if (async) {
				const requestParamsKey =
					requestParams.item_type_id +
					requestParams.location_name +
					requestParams.item_classification +
					requestParams.item_id;
				dataCache[requestParamsKey] =
					dataCache[requestParamsKey] ||
					new Promise(function (resolve) {
						if (!isItemDependent) {
							aras.MetadataCache.GetConfigurableUiAsync(requestParams).then(
								function (cuiItems) {
									items = cuiItems.getResult();
									resolve(items);
								}
							);
						} else {
							items = getConfigurableUiItemIsDependent(contextItem);
							resolve(items);
						}
					}).then(function (items) {
						dataCache[requestParamsKey] = undefined;
						return items;
					});
				return dataCache[requestParamsKey];
			} else {
				return new ArasModules.SyncPromise(function (resolve) {
					if (!isItemDependent) {
						var cuiItems = aras.MetadataCache.GetConfigurableUi(requestParams);
						items = cuiItems.getResult();
					} else {
						items = getConfigurableUiItemIsDependent(contextItem);
					}
					resolve(items);
				});
			}
		})().then(
			function (items) {
				return this.applyClientBuilders(items, contextItem, contextParams);
			}.bind(this)
		);
	};

	CuiDataLoader.prototype.applyClientBuilders = function (
		itemsNode,
		contextItem,
		contextParams
	) {
		var i;
		// find & apply client builder method
		// may be necessary for builder method
		Object.defineProperty(contextItem, 'cui_items', {
			get: function () {
				var iomItem = aras.IomInnovator.newItem();
				if (itemsNode) {
					iomItem.loadAML(itemsNode.xml);
				} else {
					iomItem.loadAML('<AML/>');
				}
				return iomItem;
			},
			enumerable: true
		});

		var hasClientBuilderMethod = false;
		var barSectionsDict = {};

		var itemsArray = [];
		items = itemsNode.selectNodes('Item|AML/Item|//Result/Item');
		var itemsCount = items.length;

		// stage 1
		for (i = 0; i < itemsCount; ++i) {
			var item = items[i];
			var isCBarSection = item.getAttribute('type') == 'CommandBarSection';
			barSectionsDict[i] = isCBarSection;

			if (isCBarSection) {
				hasClientBuilderMethod = true;
			}
		}

		if (!hasClientBuilderMethod) {
			return items;
		}

		var itemsArr = [];

		// stage 2
		for (i = 0; i < itemsCount; ++i) {
			if (!barSectionsDict[i]) {
				itemsArr.push(items[i]);
			}
		}
		// stage 3
		for (i = 0; i < itemsCount; ++i) {
			if (barSectionsDict[i]) {
				var getBuildMethodKeyedName;
				var builderMethod = items[i].selectSingleNode('builder_method');
				getBuildMethodKeyedName = builderMethod
					? builderMethod.getAttribute('keyed_name')
					: null;
				var sectionItems;
				if (items) {
					sectionItems = this.utils.evalCommandBarItemMethod(
						getBuildMethodKeyedName,
						contextItem,
						null,
						contextParams
					);
				}
				if (this.utils.noItems(sectionItems)) {
					continue;
				}

				// Convert IOM item to XML nodes list
				// XML-document is created in the context of the current window
				// faster than IOM items from main window

				doc = XmlDocument();
				doc.loadXML(sectionItems.dom.xml);
				sectionItems = doc.selectNodes('//Item');

				for (var m = 0; m < sectionItems.length; ++m) {
					var control = sectionItems[m];
					if (!control.getAttribute('type')) {
						continue;
					}
					var index = -1;
					var k;
					var sortOrder = control.selectSingleNode('sort_order'); // if NaN for undefined, will be just added
					sortOrder = sortOrder ? sortOrder.text : null;
					sortOrder = parseInt(sortOrder);
					var id = control.getAttribute('id');
					var action = control.selectSingleNode('action');
					action = action ? action.text : 'Add';
					switch (action) {
						case 'ClearAll':
							itemsArr = [];
							break;
						case 'Remove':
							for (k = itemsArr.length - 1; k >= 0; --k) {
								if (itemsArr[k].getAttribute('id') === id) {
									itemsArr.splice(k, 1);
									break;
								}
							}
							break;
						case 'Replace':
							for (k = 0; k < itemsArr.length; ++k) {
								var alternate = control.selectSingleNode('alternate');
								alternate = alternate ? alternate.text : null;
								if (itemsArr[k].getAttribute('id') === alternate) {
									itemsArr[k] = control;
								}
							}
							break;
						case 'Add':
							for (k = 0; k < itemsArr.length; ++k) {
								var itemSortOrder = itemsArr[k].selectSingleNode('sort_order');
								itemSortOrder = itemSortOrder ? itemSortOrder.text : null;
								if (itemSortOrder > sortOrder) {
									index = k;
									break;
								}
							}

							if (index > -1) {
								itemsArr.splice(index, 0, control);
							} else {
								itemsArr.push(control);
							}
							break;
						default:
							break;
					}
				}
			}
		}

		if (itemsArr.length === 0) {
			return aras.IomInnovator.newError('No items found');
		}

		return itemsArr;
	};

	return CuiDataLoader;
})();
