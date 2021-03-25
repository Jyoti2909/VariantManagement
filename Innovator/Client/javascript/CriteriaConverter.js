function CriteriaConverter(clientUrl, arasObject) {
	this.ClientUrl = clientUrl + '/ClientHelper.asmx/Convert';
	this._aras = arasObject;
}

CriteriaConverter.prototype = {
	AdvancedToAml: function CriteriaConverter$AdvancedToAml(
		criteria,
		operation,
		nodeName
	) {
		var modeName = 'AdvancedToAml';
		var obj = {
			argsCollection: [
				{ __type: 'NameValue', Name: 'action', Value: 'AdvancedToAml' },
				{ __type: 'NameValue', Name: 'criteria', Value: criteria },
				{ __type: 'NameValue', Name: 'nodeName', Value: nodeName },
				{ __type: 'NameValue', Name: 'operation', Value: operation }
			]
		};
		return this._getCriteriaResponse(obj, modeName);
	},
	AmlToSimple: function CriteriaConverter$AmlToSimple(data) {
		return this._amlToMode('AmlToSimple', data);
	},
	AmlToAdvanced: function CriteriaConverter$AmlToAdvanced(data) {
		return this._amlToMode('AmlToAdvanced', data);
	},
	ClientUrl: '',
	_soapSend: function CriteriaConverter$SoapSend(methodName, content) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open('POST', this.ClientUrl + '?rnd=' + Math.random(), false);
		xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
		xmlhttp.send(content);

		var responseText = xmlhttp.responseText;
		var evalMethod = window.eval;
		result = evalMethod('(' + responseText + ')');

		if (typeof result.d === 'undefined') {
			throw result.Message || 'Bad CriteriaConverter result.';
		} else {
			return result.d;
		}
	},
	_amlToMode: function CriteriaConverter$AmlToMode(modeName, data) {
		var obj = {
			argsCollection: [
				{ __type: 'NameValue', Name: 'action', Value: modeName },
				{ __type: 'NameValue', Name: 'data', Value: data }
			]
		};

		// check if we can minimize aml
		var objKey = data;
		if (data.indexOf('></Item>') > 0) {
			objKey = data.replace('></Item>', '/>');
		}
		return this._getCriteriaResponse(obj, modeName, objKey);
	},
	_getCriteriaResponse: function (obj, modeName, objKey) {
		var objJson = JSON.stringify(obj);
		var key = objKey || objJson;
		var response = this._findCriteriaResponseInCache(modeName, key);
		if (response === undefined) {
			response = this._soapSend(modeName, objJson);
			this._setCriteriaResponseIntoCache(modeName, key, response);
		}
		return response;
	},

	_findCriteriaResponseInCache: function (modeName, key) {
		if (!this._aras.commonProperties.criteriaConverterCache[modeName]) {
			this._aras.commonProperties.criteriaConverterCache[
				modeName
			] = this._aras.newArray();
			return;
		}

		var responseInCache = this._aras.commonProperties.criteriaConverterCache[
			modeName
		].filter(function (obj) {
			return obj.key === key;
		});
		if (responseInCache.length === 1) {
			return responseInCache[0].value;
		}
	},

	_setCriteriaResponseIntoCache: function (modeName, key, response) {
		var maxCacheResponseCount = 100;
		var cacheObject = this._aras.newObject();
		cacheObject.key = key;
		cacheObject.value = response;
		var currentCachedResponseCount = this._aras.commonProperties
			.criteriaConverterCache[modeName].length;
		if (currentCachedResponseCount > maxCacheResponseCount) {
			// we limit the size of the cache by maxCacheResponseCount
			this._aras.commonProperties.criteriaConverterCache[modeName].shift();
		}
		this._aras.commonProperties.criteriaConverterCache[modeName].push(
			cacheObject
		);
	}
};
