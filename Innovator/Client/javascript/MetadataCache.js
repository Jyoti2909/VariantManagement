function MetadataCache(aras, cache, useJSON) {
	var scopeVariable = {};
	scopeVariable.aras = aras;
	scopeVariable.cache = cache || aras.IomFactory.CreateItemCache();
	scopeVariable.cacheVariable = null;
	scopeVariable.preloadDates = MetadataCache.preloadDates;
	scopeVariable.useJSON = !!useJSON;
	scopeVariable.pendingRequests = new Map();

	scopeVariable.typeInfo = {
		ItemType: {
			typeKey: '3EC33FE3B3C333333E33CF3D33AC33C3',
			getDatesMethod: 'GetItemTypesMetadata',
			getMethod: 'GetItemType'
		},
		RelationshipType: {
			typeKey: '76381576909211E296CE0B586188709B',
			getDatesMethod: 'GetRelationshipTypesMetadata',
			getMethod: 'GetRelationshipType'
		},
		Form: {
			typeKey: '2EC22FE2B2C222222E22CF2D22AC22C2',
			getDatesMethod: 'GetFormsMetadata',
			getMethod: 'GetForm'
		},
		Method: {
			typeKey: '6E02B71E7A6E4FF38A9866C27837906D',
			getDatesMethod: 'GetClientMethodsMetadata',
			getMethod: 'GetClientMethod'
		},
		GetAllClientMethodsMetadata: {
			typeKey: 'F29AC97834104075AA42EE4984AEDC68',
			getDatesMethod: 'GetAllClientMethodsMetadata',
			getMethod: 'GetAllClientMethods'
		},
		List: {
			typeKey: '4EC44FE4B4C444444E44CF4D44AC44C4',
			getDatesMethod: 'GetListsMetadata',
			getMethod: 'GetList'
		},
		Identity: {
			typeKey: '36F92EC1A0CF43C1801F50510D86FEAD',
			getDatesMethod: 'GetIdentitiesMetadata',
			getMethod: 'GetIdentity'
		},
		GetLastModifiedSearchModeDate: {
			typeKey: 'BAD4F21DBF1C41B8B14BD3060FF5E8F5',
			getDatesMethod: 'GetLastModifiedSearchModeDate',
			getMethod: 'GetSearchModes'
		},
		ConfigurableUI: {
			typeKey: '64494CAB13F846A0AD19216DBC3E1980',
			getDatesMethod: 'GetConfigurableUiMetadata',
			getMethod: 'GetConfigurableUi'
		},
		ConfigurableUIControls: {
			typeKey: '8FF238D85E7948228738B963141521AB',
			getDatesMethod: 'GetWindowsSectionControlsMetadata',
			getMethod: 'GetWindowsSectionControls'
		},
		PresentationConfiguration: {
			typeKey: 'BDE98AE974C24A759AF406C526EFD1A7',
			getDatesMethod: 'GetPresentationConfigurationMetadata',
			getMethod: 'GetPresentationConfiguration'
		},
		CommandBarSection: {
			typeKey: '7962E50B66E44BCC9BEDC3ECAE899455',
			getDatesMethod: 'GetCommandBarSectionMetadata',
			getMethod: 'GetCommandBarSection'
		},
		// note that it returns zero-filled (GU)ID if there's no cmf_ContentType for given linked_document_type
		ContentTypeByDocumentItemType: {
			typeKey: 'E76EC697E76248CC8D08FE56C1DB880B',
			getDatesMethod: 'GetContentTypeByDocumentItemTypeMetadata',
			getMethod: 'GetContentTypeByDocumentItemType'
		},
		GetAllXClassificationTreesMetadata: {
			typeKey: '8626C9253E564BDB92C54891E36BC014',
			getDatesMethod: 'GetAllXClassificationTreesMetadata',
			getMethod: 'GetAllXClassificationTrees'
		},
		LifeCycleStates: {
			typeKey: '03E9AA0CD9C64E678D0B2AD478A8BF85',
			getDatesMethod: 'GetLifeCycleStatesMetadata',
			getMethod: 'GetLifeCycleStates'
		}
	};

	scopeVariable.findTypeInfoNameById = function (id) {
		var res;
		for (var prop in this.typeInfo) {
			if (this.typeInfo.hasOwnProperty(prop)) {
				if (this.typeInfo[prop].typeKey === id) {
					res = prop;
					break;
				}
			}
		}
		return res;
	};

	scopeVariable.getPreloadDate = function (name) {
		if (!this.preloadDates[name]) {
			this.updatePreloadDates();
		}
		return this.preloadDates[name];
	};

	scopeVariable._getMostTopWindowWithAras = function () {
		return window;
	};

	scopeVariable.extractDateFromCache = function (
		criteriaValue,
		criteriaType,
		itemType
	) {
		var id =
			criteriaType == 'id'
				? criteriaValue
				: this.extractIdByName(criteriaValue, itemType);
		return this.extractDateById(id, itemType);
	};

	scopeVariable.extractIdByName = function (name, itemType) {
		var key = this.createCacheKey(
			'MetadataIdsByNameInLowerCase',
			this.typeInfo[itemType].typeKey
		);
		var container = this.getItem(key);
		if (!container) {
			this.refreshMetadata(itemType);
			container = this.getItem(key);
		}
		return container ? container.content[name.toLowerCase()] : '';
	};

	scopeVariable.extractNameById = function (id, itemType) {
		var key = this.createCacheKey(
			'MetadataNamesById',
			this.typeInfo[itemType].typeKey
		);
		var container = this.getItem(key);
		if (!container) {
			this.refreshMetadata(itemType);
			container = this.getItem(key);
		}
		return container ? container.content[id] : '';
	};

	scopeVariable.extractDateById = function (id, itemType) {
		var key = this.createCacheKey(
			'MetadataDatesById',
			this.typeInfo[itemType].typeKey
		);
		var container = this.getItem(key);
		if (!container) {
			this.refreshMetadata(itemType);
			container = this.getItem(key);
		}
		var date = container ? container.content[id] : '';
		if (!date) {
			var currentTime = new Date();
			date =
				currentTime.getFullYear() +
				'-' +
				currentTime.getMonth() +
				'-' +
				currentTime.getDate() +
				'T' +
				currentTime.getHours() +
				':' +
				currentTime.getMinutes() +
				':' +
				currentTime.getSeconds() +
				'.00';
		}
		return date;
	};

	scopeVariable.refreshMetadata = function (itemType, async) {
		var methodName = this.typeInfo[itemType].getDatesMethod;
		var typeKey = this.typeInfo[itemType].typeKey;

		this.removeById(typeKey, true);
		var self = this;
		const date = this.getPreloadDate(itemType);
		const queryParameters = { date };
		let requestURL = this.generateRequestURL(methodName, queryParameters);
		if (this.useJSON) {
			const url = new URL(requestURL);
			url.searchParams.delete('accept');
			requestURL = url.toString();
		}

		return this.sendSoapInternal(
			methodName,
			requestURL,
			async ? true : false
		).then(function (res) {
			self.refreshMetadataInternal(res, typeKey);
		});
	};

	scopeVariable.refreshMetadataInternal = function (res, typeKey) {
		if (res.getFaultCode() !== 0) {
			this.aras.AlertError(res);
			return;
		}
		const text = res.getResult().text;
		if (!text) {
			return;
		}

		const metadataItems = JSON.parse(text);

		const obj = metadataItems.reduce(
			function (res, m) {
				res.MetadataIdsByNameInLowerCase[m.name.toLowerCase()] = m.id;
				res.MetadataNamesById[m.id] = m.name;
				res.MetadataDatesById[m.id] = m.modified_on;
				return res;
			},
			{
				MetadataIdsByNameInLowerCase: {},
				MetadataNamesById: {},
				MetadataDatesById: {}
			}
		);

		Object.keys(obj).forEach(function (name) {
			const key = this.createCacheKey(name, typeKey);
			const container = this.aras.IomFactory.CreateCacheableContainer(
				obj[name],
				obj[name]
			);
			this.setItem(key, container);
		}, this);
	};

	scopeVariable.getSoapFromServerOrFromCache = function (
		methodName,
		queryParameters
	) {
		var requestURL = this.generateRequestURL(methodName, queryParameters);
		var res = this.getSoapFromCache(methodName, requestURL);
		if (!res) {
			res = this.sendSoap(methodName, requestURL);
			if (res.getFaultCode() === 0) {
				this.putSoapToCache(methodName, requestURL, res);
			}
		}
		return res;
	};

	scopeVariable.getSoapFromCache = function (methodName, requestURL) {
		var key = this.createCacheKey('MetadataServiceCache', requestURL);
		var container = this.getItem(key);
		return container ? container.content : undefined;
	};

	scopeVariable.putSoapToCache = function (methodName, requestURL, content) {
		if (!sessionStorage.getItem('ArasSessionCheck')) {
			const key = this.createCacheKey('MetadataServiceCache', requestURL);
			const container = this._getMostTopWindowWithAras().aras.IomFactory.CreateCacheableContainer(
				content,
				content
			);
			this.setItem(key, container);
		}
	};

	scopeVariable.generateRequestURL = function (methodName, queryParameters) {
		const serverURL = aras.getServerBaseURL();
		const metadataURL = `${serverURL}MetaData.asmx/${methodName}`;
		const url = new URL(metadataURL);
		const searchParams = url.searchParams;
		const params = {
			database: this.aras.getDatabase(),
			user: this.aras.getCurrentLoginName(),
			lang: this.aras.getSessionContextLanguageCode(),
			...queryParameters
		};

		for (const [key, value] of Object.entries(params)) {
			searchParams.set(key, value);
		}

		if (this.useJSON) {
			searchParams.set('accept', 'json');
		}

		searchParams.sort();
		return url.toString();
	};

	scopeVariable.sendSoap = function (methodName, requestURL) {
		var finalRetVal;
		this.sendSoapInternal(methodName, requestURL, false).then(function (res) {
			finalRetVal = res;
		});
		return finalRetVal;
	};

	scopeVariable.sendSoapAsync = function (methodName, requestURL) {
		return this.sendSoapInternal(methodName, requestURL, true);
	};

	scopeVariable.sendSoapInternal = function (methodName, requestURL, async) {
		var aras = this.aras;
		var promiseFunction = function (resolve) {
			var finalRetVal;
			ArasModules.soap('', {
				url: requestURL,
				method: methodName,
				restMethod: 'GET',
				async: async
			}).then(
				function (resultNode) {
					var text;
					if (resultNode.ownerDocument) {
						var doc = resultNode.ownerDocument;
						text = doc.xml || new XMLSerializer().serializeToString(doc);
					} else {
						text = resultNode;
					}
					finalRetVal = new SOAPResults(aras, text, false);
					resolve(finalRetVal);
				},
				function (xhr) {
					finalRetVal = new SOAPResults(aras, xhr.responseText, false);
					resolve(finalRetVal);
				}
			);
		};

		var promise;
		if (!async) {
			promise = new ArasModules.SyncPromise(promiseFunction);
		} else {
			promise = new Promise(promiseFunction);
		}
		return promise;
	};

	scopeVariable.sendRequest = async function (requestURL) {
		if (this.pendingRequests.has(requestURL)) {
			return this.pendingRequests.get(requestURL);
		}

		const promise = ArasModules.fetch(requestURL);
		this.pendingRequests.set(requestURL, promise);
		await promise;

		this.pendingRequests.delete(requestURL);
		return promise;
	};

	scopeVariable.loadMetadata = async function (methodName, requestURL) {
		const cachedResponse = this.getSoapFromCache(methodName, requestURL);
		if (cachedResponse) {
			return cachedResponse.clone().json();
		}

		const response = await this.sendRequest(requestURL);
		this.putSoapToCache(methodName, requestURL, response);
		return response.clone().json();
	};

	scopeVariable.getItemType = function (criteriaValue, criteriaName) {
		const itemType = 'ItemType';
		const id =
			criteriaName == 'id'
				? criteriaValue
				: this.extractIdByName(criteriaValue, itemType);
		const date = this.extractDateById(id, itemType);
		const queryParameters = { id, date };
		const methodName = this.typeInfo.ItemType.getMethod;
		const requestURL = this.generateRequestURL(methodName, queryParameters);

		if (this.useJSON) {
			return this.loadMetadata(methodName, requestURL);
		}

		var res = this.getSoapFromCache(methodName, requestURL);
		if (!res) {
			res = this.sendSoap(methodName, requestURL);
			if (res.getFaultCode() === 0) {
				this.putSoapToCache(methodName, requestURL, res);

				var rels = res.results.selectNodes(
					this.aras.XPathResult() +
						'/Item/Relationships/Item[@type="RelationshipType"]'
				);
				for (var i = 0; i < rels.length; i++) {
					var rel = rels[i];
					var relId = this.aras.getItemProperty(rel, 'id');
					var relDate = this.extractDateById(relId, 'RelationshipType');
					const relQueryParameters = { id: relId, date: relDate };
					const relRequestURL = this.generateRequestURL(
						this.typeInfo.RelationshipType.getMethod,
						relQueryParameters
					);
					var relRes = new SOAPResults(
						this.aras,
						'<Result>' + rel.xml + '</Result>'
					);
					this.putSoapToCache(
						this.typeInfo.RelationshipType.getMethod,
						relRequestURL,
						relRes
					);
				}
			}
		}
		return res;
	};

	scopeVariable.stdGet = function (
		typeInfo,
		itemType,
		criteriaValue,
		criteriaName
	) {
		const id =
			criteriaName == 'id'
				? criteriaValue
				: this.extractIdByName(criteriaValue, itemType);
		const date = this.extractDateById(id, itemType);
		const queryParameters = { id, date };
		return this.getSoapFromServerOrFromCache(
			typeInfo.getMethod,
			queryParameters
		);
	};

	scopeVariable.getRelationshipType = function (criteriaValue, criteriaName) {
		return this.stdGet(
			this.typeInfo.RelationshipType,
			'RelationshipType',
			criteriaValue,
			criteriaName
		);
	};

	scopeVariable.getForm = function (criteriaValue, criteriaName) {
		return this.stdGet(this.typeInfo.Form, 'Form', criteriaValue, criteriaName);
	};

	scopeVariable.getClientMethod = function (criteriaValue, criteriaName) {
		var methodNd = this.getClientMethodNd(criteriaValue, criteriaName);
		if (methodNd) {
			return new SOAPResults(
				this.aras,
				'<Result>' + methodNd.xml + '</Result>'
			);
		}
		return this.stdGet(
			this.typeInfo.Method,
			'Method',
			criteriaValue,
			criteriaName
		);
	};

	scopeVariable.getClientMethodNd = function (criteriaValue, criteriaName) {
		var allMethods = this.getAllClientMethods();
		var methodId;
		if (criteriaName != 'id') {
			var idsByNames = this.getItem(
				this.createCacheKey(
					'MetadataClientMethodsIdsByNames',
					'307C85932F514F70A81B7A09376A8D6C'
				)
			);
			if (!idsByNames) {
				return;
			}
			methodId = idsByNames[criteriaValue.toLowerCase()];
		} else {
			methodId = criteriaValue;
		}
		return allMethods[methodId];
	};

	scopeVariable.getAllClientMethods = function () {
		var typeKey = this.typeInfo.GetAllClientMethodsMetadata.typeKey;
		var dateMethodName = this.typeInfo.GetAllClientMethodsMetadata
			.getDatesMethod;
		var methodName = this.typeInfo.GetAllClientMethodsMetadata.getMethod;

		var date = this.getLastModifiedItemDateFromCache(
			'MetadataLastModifiedClientMethodsDate',
			typeKey,
			dateMethodName
		);
		const queryParameters = { date };
		const requestURL = this.generateRequestURL(methodName, queryParameters);
		var res = this.getSoapFromCache(methodName, requestURL);
		if (!res) {
			res = this.sendSoap(methodName, requestURL);
			var methodDict = {};
			if (res.getFaultCode() === 0) {
				var nodes = res
					.getResult()
					.selectNodes(this.aras.XPathResult("/Item[@type='Method']"));
				if (nodes.length > 0) {
					var idsByNames = {};
					for (var i = 0; i < nodes.length; i++) {
						var id = nodes[i].getAttribute('id');
						idsByNames[
							nodes[i].selectSingleNode('name').text.toLowerCase()
						] = id;
						methodDict[id] = nodes[i];
					}
					this.putSoapToCache(methodName, requestURL, methodDict);
					var cacheKey = this.createCacheKey(
						'MetadataClientMethodsIdsByNames',
						'307C85932F514F70A81B7A09376A8D6C'
					);
					this.setItem(cacheKey, idsByNames);
				}
			}
			res = methodDict;
		}

		return res;
	};

	scopeVariable.getQueryParametersForGetCUI = function (context) {
		// date is single maximal for all CUI config, no any per id/context division
		var date = this.extractDateById(
			'83F725B93D9840E7A4B139E40DCDA8C4',
			'ConfigurableUI'
		);
		var id =
			'item_type_id=' +
			context.item_type_id +
			'&location_name=' +
			context.location_name +
			'&item_classification=' +
			context.item_classification;
		if (context.item_id) {
			id += '&item_id=' + context.item_id;
		}

		return { id, date };
	};

	scopeVariable.getQueryParametersForGetCUIControls = function (context) {
		// date is single maximal for all CUI config, no any per id/context division
		var date = this.extractDateById(
			'8FF238D85E7948228738B963141521AB',
			'ConfigurableUIControls'
		);
		var id =
			'item_type_id=' +
			context.item_type_id +
			'&location_name=' +
			context.location_name +
			'&item_classification=' +
			context.item_classification;
		if (context.item_id) {
			id += '&item_id=' + context.item_id;
		}

		return { id, date };
	};

	scopeVariable.getConfigurableUi = function (context) {
		var queryParameters = this.getQueryParametersForGetCUI(context);
		return this.getSoapFromServerOrFromCache(
			this.typeInfo.ConfigurableUI.getMethod,
			queryParameters
		);
	};

	scopeVariable.getConfigurableUiAsync = function (context) {
		const queryParameters = this.getQueryParametersForGetCUI(context);
		const methodName = this.typeInfo.ConfigurableUI.getMethod;
		const requestURL = this.generateRequestURL(methodName, queryParameters);
		if (this.useJSON) {
			return this.loadMetadata(methodName, requestURL);
		}

		const res = this.getSoapFromCache(methodName, requestURL);
		if (res) {
			return Promise.resolve(res);
		}

		return this.sendSoapAsync(methodName, requestURL).then(
			function (result) {
				if (result.getFaultCode() === 0) {
					this.putSoapToCache(methodName, requestURL, result);
				}
				return result;
			}.bind(this)
		);
	};
	scopeVariable.getConfigurableUIControls = function (requestParams) {
		const queryParameters = this.getQueryParametersForGetCUIControls(
			requestParams
		);
		const methodName = this.typeInfo.ConfigurableUIControls.getMethod;
		const requestURL = this.generateRequestURL(methodName, queryParameters);

		return this.loadMetadata(methodName, requestURL);
	};
	scopeVariable.stdGetById = function (typeInfo, itemType, id) {
		const date = this.extractDateById(id, itemType);
		const queryParameters = { id, date };
		return this.getSoapFromServerOrFromCache(
			typeInfo.getMethod,
			queryParameters
		);
	};

	scopeVariable.getPresentationConfiguration = function (id) {
		return this.stdGetById(
			this.typeInfo.PresentationConfiguration,
			'PresentationConfiguration',
			id
		);
	};

	scopeVariable.getCommandBarSection = function (id) {
		return this.stdGetById(
			this.typeInfo.CommandBarSection,
			'CommandBarSection',
			id
		);
	};

	scopeVariable.getContentTypeByDocumentItemType = function (id) {
		return this.stdGetById(
			this.typeInfo.ContentTypeByDocumentItemType,
			'ContentTypeByDocumentItemType',
			id
		);
	};

	scopeVariable._getJsonListURL = function (id, isFilterList) {
		const methodName = this.typeInfo.List.getMethod;
		const date = this.extractDateById(id, 'List');
		const valType = isFilterList ? 'filterValue' : 'value';
		const queryParameters = { id, date, valType };

		return this.generateRequestURL(methodName, queryParameters);
	};

	scopeVariable.getList = function (listIds, filterListIds) {
		//listIds - list of ids for which Value type is needed
		//filterListIds - list of ids for which Filter Value type is needed
		const methodName = this.typeInfo.List.getMethod;

		if (this.useJSON) {
			const requestListsURLs = listIds.map(function (id) {
				return this._getJsonListURL(id, false);
			}, this);
			const requestFilterListsURLs = filterListIds.map(function (id) {
				return this._getJsonListURL(id, true);
			}, this);

			const requestURLs = requestListsURLs.concat(requestFilterListsURLs);

			return Promise.all(
				requestURLs.map(function (url) {
					return this.loadMetadata(methodName, url);
				}, this)
			);
		}

		let queryParameters; //variable for request params
		let response; //variable with response to check content
		let result = '<Result>';
		let i;
		//check if list isn't empty
		if (listIds.length !== 0) {
			//for each single element in collection request for metadata to service
			for (i = 0; i < listIds.length; i++) {
				const id = listIds[i];
				const valType = 'value';
				const date = this.extractDateById(id, 'List');
				const queryParameters = { id, date, valType };
				response = this.getSoapFromServerOrFromCache(
					methodName,
					queryParameters
				);
				//if fault code was returned we return object with this fault
				if (response.getFaultCode() !== 0) {
					return response;
				}
				result += response.getResultsBody();
			}
		}
		if (filterListIds.length !== 0) {
			//for each single element in collection request for metadata to service
			for (i = 0; i < filterListIds.length; i++) {
				const id = filterListIds[i];
				const valType = 'filtervalue';
				const date = this.extractDateById(id, 'List');
				const queryParameters = { id, date, valType };
				response = this.getSoapFromServerOrFromCache(
					methodName,
					queryParameters
				);
				//if fault code was returned we return object with this fault
				if (response.getFaultCode() !== 0) {
					return response;
				}
				result += response.getResultsBody();
			}
		}
		result += '</Result>';
		result = new SOAPResults(this.aras, result);
		return result;
	};

	scopeVariable.getIdentity = function (criteriaValue, criteriaName) {
		return this.stdGet(
			this.typeInfo.Identity,
			'Identity',
			criteriaValue,
			criteriaName
		);
	};

	scopeVariable.getSearchModes = function () {
		var typeKey = this.typeInfo.GetLastModifiedSearchModeDate.typeKey;
		var dateMethodName = this.typeInfo.GetLastModifiedSearchModeDate
			.getDatesMethod;
		var methodName = this.typeInfo.GetLastModifiedSearchModeDate.getMethod;

		var date = this.getLastModifiedItemDateFromCache(
			'MetadataLastModifiedSearchModeDate',
			typeKey,
			dateMethodName
		);
		const queryParameters = { date };
		var res = this.getSoapFromServerOrFromCache(methodName, queryParameters);
		if (res.getFaultCode() !== 0) {
			this.aras.AlertError(res);
			var resIOMError = this.aras
				.newIOMInnovator()
				.newError(res.getFaultString());
			return resIOMError;
		}
		return res.getResult();
	};

	scopeVariable.getAllXClassificationTrees = function () {
		var typeKey = this.typeInfo.GetAllXClassificationTreesMetadata.typeKey;
		var dateMethodName = this.typeInfo.GetAllXClassificationTreesMetadata
			.getDatesMethod;
		var methodName = this.typeInfo.GetAllXClassificationTreesMetadata.getMethod;

		var date = this.getLastModifiedItemDateFromCache(
			'GetAllXClassificationTreesMetadata',
			typeKey,
			dateMethodName
		);
		const queryParameters = { date };
		var res = this.getSoapFromServerOrFromCache(methodName, queryParameters);
		if (res.getFaultCode() !== 0) {
			this.aras.AlertError(res);
			var resIOMError = this.aras
				.newIOMInnovator()
				.newError(res.getFaultString());
			return resIOMError;
		}
		return res.getResult();
	};

	scopeVariable.getLifeCycleStates = function () {
		const { getMethod, typeKey } = this.typeInfo.LifeCycleStates;
		const date = this.getLastModifiedItemDateFromCache(
			getMethod,
			typeKey,
			'LifeCycleStates'
		);

		const queryParameters = { date };
		const requestURL = this.generateRequestURL(getMethod, queryParameters);

		return this.loadMetadata(getMethod, requestURL);
	};

	scopeVariable.getLastModifiedItemDateFromCache = function (
		cacheKey,
		typeKey,
		dateMethodName
	) {
		var keyDateItems = this.createCacheKey(cacheKey, typeKey);
		var date = this.getItem(keyDateItems);
		if (!date) {
			date = this.getLastModifiedItemDateFromServer(dateMethodName);
			this.removeItemById(typeKey, true);
			this.setItem(keyDateItems, date);
		}
		return date;
	};

	scopeVariable.getLastModifiedItemDateFromServer = function (dateMethodName) {
		return this.getPreloadDate(dateMethodName);
	};

	scopeVariable.updatePreloadDates = function (metadataDates) {
		if (!metadataDates) {
			const mainWindow = aras.getMainWindow();
			const mainWindowInfo = mainWindow.arasMainWindowInfo;
			const allMetadataDates = mainWindowInfo.GetAllMetadataDates;
			metadataDates = ArasModules.xmlToJson(allMetadataDates);
		}

		Object.assign(this.preloadDates, metadataDates);
	};

	scopeVariable.deleteListDatesFromCache = function () {
		this.removeItemById(this.typeInfo.List.typeKey);
	};

	scopeVariable.deleteFormDatesFromCache = function () {
		this.removeItemById(this.typeInfo.Form.typeKey);
	};

	scopeVariable.deleteClientMethodDatesFromCache = function () {
		this.removeItemById(this.typeInfo.Method.typeKey);
	};

	scopeVariable.deleteAllClientMethodsDatesFromCache = function () {
		this.removeItemById(this.typeInfo.GetAllClientMethodsMetadata.typeKey);
	};

	scopeVariable.deleteITDatesFromCache = function () {
		this.removeItemById(this.typeInfo.ItemType.typeKey);
	};

	scopeVariable.deleteRTDatesFromCache = function () {
		this.removeItemById(this.typeInfo.RelationshipType.typeKey);
	};

	scopeVariable.deleteIdentityDatesFromCache = function () {
		this.removeItemById(this.typeInfo.Identity.typeKey);
	};

	scopeVariable.deleteConfigurableUiDatesFromCache = function () {
		this.removeItemById(this.typeInfo.ConfigurableUI.typeKey);
	};

	scopeVariable.deleteConfigurableUiControlsDatesFromCache = function () {
		this.removeItemById(this.typeInfo.ConfigurableUIControls.typeKey);
	};

	scopeVariable.deletePresentationConfigurationDatesFromCache = function () {
		this.removeItemById(this.typeInfo.PresentationConfiguration.typeKey);
	};

	scopeVariable.deleteCommandBarSectionDatesFromCache = function () {
		this.removeItemById(this.typeInfo.CommandBarSection.typeKey);
	};

	scopeVariable.deleteContentTypeByDocumentItemTypeDatesFromCache = function () {
		this.removeItemById(this.typeInfo.ContentTypeByDocumentItemType.typeKey);
	};

	scopeVariable.deleteSearchModeDatesFromCache = function () {
		this.removeItemById(this.typeInfo.GetLastModifiedSearchModeDate.typeKey);
	};

	scopeVariable.deleteXClassificationTreesDates = function () {
		this.removeItemById(
			this.typeInfo.GetAllXClassificationTreesMetadata.typeKey
		);
	};

	scopeVariable.deleteLifeCycleStatesDates = function () {
		this.removeItemById(this.typeInfo.LifeCycleStates.typeKey);
	};

	scopeVariable.getItem = function (key) {
		return this.cache.GetItem(key);
	};

	scopeVariable.removeById = function (id, doNotClearDate) {
		this.cache.RemoveById(id);

		if (!doNotClearDate) {
			var typeInfoName = this.findTypeInfoNameById(id);
			delete this.preloadDates[typeInfoName];
		}
	};

	scopeVariable.setItem = function (key, item) {
		this.cache.SetItem(key, item);
	};

	scopeVariable.getItemsById = function (key) {
		return this.cache.GetItemsById(key);
	};

	scopeVariable.clearCache = function () {
		this.cache.ClearCache();
		for (const date of Object.keys(this.preloadDates)) {
			delete this.preloadDates[date];
		}
		this.updatePreloadDates();
	};

	//This function accepts any number of parameters
	scopeVariable.createCacheKey = function () {
		var key = aras.IomFactory.CreateArrayList();
		for (var i = 0; i < arguments.length; i++) {
			key.add(arguments[i]);
		}
		return key;
	};

	scopeVariable.removeItemById = function (id) {
		var mainArasObj = aras.getMainArasObject();
		if (mainArasObj && mainArasObj != aras) {
			mainArasObj.MetadataCache.RemoveItemById(id);
		} else {
			this.removeById(id);
		}
	};

	return {
		GetItemType: function (criteriaValue, criteriaName) {
			return scopeVariable.getItemType(criteriaValue, criteriaName);
		},
		GetRelationshipType: function (criteriaValue, criteriaName) {
			return scopeVariable.getRelationshipType(criteriaValue, criteriaName);
		},
		GetForm: function (criteriaValue, criteriaName) {
			return scopeVariable.getForm(criteriaValue, criteriaName);
		},
		GetClientMethod: function (criteriaValue, criteriaName) {
			return scopeVariable.getClientMethod(criteriaValue, criteriaName);
		},
		GetClientMethodNd: function (criteriaValue, criteriaName) {
			return scopeVariable.getClientMethodNd(criteriaValue, criteriaName);
		},
		GetAllClientMethods: function () {
			return scopeVariable.getAllClientMethods();
		},
		GetList: function (listIds, filterListIds) {
			return scopeVariable.getList(listIds, filterListIds);
		},
		GetApplicationVersion: function () {
			var requestUrl = scopeVariable.generateRequestURL(
				'GetApplicationVersion'
			);
			return scopeVariable.sendSoap('GetApplicationVersion', requestUrl);
		},
		GetIdentity: function (criteriaValue, criteriaName) {
			return scopeVariable.getIdentity(criteriaValue, criteriaName);
		},
		GetSearchModes: function () {
			return scopeVariable.getSearchModes();
		},
		GetAllXClassificationTrees: function () {
			return scopeVariable.getAllXClassificationTrees();
		},
		GetLifeCycleStates: function () {
			return scopeVariable.getLifeCycleStates();
		},
		GetItemTypeName: function (id) {
			return scopeVariable.extractNameById(id, 'ItemType');
		},
		GetRelationshipTypeName: function (id) {
			return scopeVariable.extractNameById(id, 'RelationshipType');
		},
		GetFormName: function (id) {
			return scopeVariable.extractNameById(id, 'Form');
		},
		GetItemTypeId: function (name) {
			return scopeVariable.extractIdByName(name, 'ItemType');
		},
		GetRelationshipTypeId: function (name) {
			return scopeVariable.extractIdByName(name, 'RelationshipType');
		},
		GetFormId: function (name) {
			return scopeVariable.extractIdByName(name, 'Form');
		},
		ExtractDateFromCache: function (criteriaValue, criteriaType, itemType) {
			return scopeVariable.extractDateFromCache(
				criteriaValue,
				criteriaType,
				itemType
			);
		},
		DeleteListDatesFromCache: function () {
			return scopeVariable.deleteListDatesFromCache();
		},
		DeleteFormDatesFromCache: function () {
			return scopeVariable.deleteFormDatesFromCache();
		},
		DeleteClientMethodDatesFromCache: function () {
			return scopeVariable.deleteClientMethodDatesFromCache();
		},
		DeleteAllClientMethodsDatesFromCache: function () {
			return scopeVariable.deleteAllClientMethodsDatesFromCache();
		},
		DeleteITDatesFromCache: function () {
			return scopeVariable.deleteITDatesFromCache();
		},
		DeleteRTDatesFromCache: function () {
			return scopeVariable.deleteRTDatesFromCache();
		},
		DeleteIdentityDatesFromCache: function () {
			return scopeVariable.deleteIdentityDatesFromCache();
		},
		DeleteConfigurableUiDatesFromCache: function () {
			return scopeVariable.deleteConfigurableUiDatesFromCache();
		},
		DeleteConfigurableUiControlsDatesFromCache: function () {
			return scopeVariable.deleteConfigurableUiControlsDatesFromCache();
		},
		DeletePresentationConfigurationDatesFromCache: function () {
			return scopeVariable.deletePresentationConfigurationDatesFromCache();
		},
		DeleteCommandBarSectionDatesFromCache: function () {
			return scopeVariable.deleteCommandBarSectionDatesFromCache();
		},
		DeleteXClassificationTreesDates: function () {
			return scopeVariable.deleteXClassificationTreesDates();
		},
		DeleteContentTypeByDocumentItemTypeDatesFromCache: function () {
			return scopeVariable.deleteContentTypeByDocumentItemTypeDatesFromCache();
		},
		DeleteSearchModeDatesFromCache: function () {
			return scopeVariable.deleteSearchModeDatesFromCache();
		},
		DeleteLifeCycleStatesDatesFromCache: function () {
			return scopeVariable.deleteLifeCycleStatesDates();
		},
		GetItem: function (key) {
			return scopeVariable.getItem(key);
		},
		RemoveById: function (id) {
			return scopeVariable.removeById(id);
		},
		SetItem: function (key, item) {
			return scopeVariable.setItem(key, item);
		},
		GetItemsById: function (key) {
			return scopeVariable.getItemsById(key);
		},
		ClearCache: function () {
			return scopeVariable.clearCache();
		},
		CreateCacheKey: function () {
			return scopeVariable.createCacheKey.apply(null, arguments);
		},
		RemoveItemById: function (id) {
			return scopeVariable.removeItemById(id);
		},
		GetConfigurableUi: function (context) {
			return scopeVariable.getConfigurableUi(context);
		},
		GetConfigurableUiAsync: function (context) {
			return scopeVariable.getConfigurableUiAsync(context);
		},
		GetConfigurableUIControls: function (context) {
			return scopeVariable.getConfigurableUIControls(context);
		},
		GetPresentationConfiguration: function (id) {
			return scopeVariable.getPresentationConfiguration(id);
		},
		GetCommandBarSection: function (id) {
			return scopeVariable.getCommandBarSection(id);
		},
		GetContentTypeByDocumentItemType: function (id) {
			///<returns>Zero-filled (GU)ID if there's no cmf_ContentType for given linked_document_type</returns>
			return scopeVariable.getContentTypeByDocumentItemType(id);
		},
		RefreshMetadata: function (itemTypeName) {
			return scopeVariable.refreshMetadata(itemTypeName, true);
		},
		UpdatePreloadDates: function (metadataDates) {
			return scopeVariable.updatePreloadDates(metadataDates);
		}
	};
}

MetadataCache.preloadDates = {};
