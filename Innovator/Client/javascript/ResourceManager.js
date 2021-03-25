'use strict';

function ResourceManager(solution, resourceName, languageCodeOrAcceptLanguage) {
	/// <summary>
	///	 ResourceManager class provides access to culture-specific resources stored in xml.
	/// </summary>
	/// <remarks>
	///  The ResourceManager class looks up culture-specific resources and provides resource fallback when a localized resource does not exist.
	///  Using the methods of ResourceManager, a caller can access the resources for a particular culture using the getString and getFormatedString
	///  methods. By default, these methods return the resource for the culture determined by the cultural settings passed in constructor. If
	///  CultureInfo object is undefined or null, system settings are used (see Aras.Client.JS.CultureInfo.getCulture for more information).
	/// </remarks>
	/// <summary locid="M:J#Aras.Client.JS.ResourceManager.#ctor">
	///   Initializes a new instance of the ResourceManager class that looks up resources contained in file derived
	///   from the specified culture name using the given Solution.
	/// </summary>
	/// <param locid="M:J#Aras.Client.JS.ResourceManager.#ctor" name="solution" type="Aras.Client.JS.Solution" mayBeNull="false">
	///	 Solution object for which resources are needed.
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.ResourceManager.#ctor" name="resourceName" type="string" mayBeNull="false">
	///	 The name of the resource file. For example, the resource name for the resource file "xml.fr/ui_resources.xml" is "ui_resources.xml".
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.ResourceManager.#ctor" name="culture" mayBeNull="true" type="Aras.Client.JS.CultureInfo">
	///	 Specifies the CultureInfo object that represents the culture for which the resource is localized.
	///  If the resource is not localized for this culture, the CultureInfo is obtained using the system's CurrentCulture.
	/// </param>
	var _solution = solution;
	var _resourceName = resourceName;

	var _language =
		(languageCodeOrAcceptLanguage || undefined) &&
		languageCodeOrAcceptLanguage.substr(0, 2);

	var _resourceConfigFileName = 'resource.config.xml';

	this.getResourceName = function ResourceManagerGetResourceName() {
		return _resourceName;
	};

	this.getConfigFileName = function ResourceManagerGetConfigFileName() {
		return _resourceConfigFileName;
	};

	this.getSolution = function ResourceManagerGetSolution() {
		return _solution;
	};

	this.getCultureName = function ResourceManagerGetCultureName() {
		return _language;
	};
}
/**
	variable ResourceManager$xmldocscache is stored in window.__staticVariablesStorage.
	And represents a cache of key-value pairs, where
	key is absolute url of resource and value - resource's xmlDocument.
**/
ResourceManager.prototype._getCache = function ResourceManagerGetCache() {
	var keyName = 'ResourceManager$xmldocscache';
	var res = window.__staticVariablesStorage[keyName];
	if (!res) {
		res = window.__staticVariablesStorage.setNewObject(keyName);
	}

	return res;
};

ResourceManager.prototype._getXmlDocument = function ResourceManagerGetXmlDocument(
	url
) {
	var cache = this._getCache();

	var res = cache[url];
	if (res) {
		return res;
	}

	res = ArasModules.xml.parseFile(url);
	if (res.xml) {
		cache[url] = res;
		return res;
	}

	return null;
};

ResourceManager.prototype._getI18NResourcePath = function ResourceManagerGetI18NResourcePath(
	supportedCultureList
) {
	var locale = this.getCultureName();
	var parentUrl = this.getSolution().getBaseURL();
	if (parentUrl[parentUrl.length - 1] != '/') {
		parentUrl += '/';
	}

	var defaultUrl = parentUrl + 'xml/' + this.getResourceName();
	var localizedUrl =
		parentUrl +
		'xml' +
		(locale ? '.' + locale : '') +
		'/' +
		this.getResourceName();

	if (supportedCultureList !== null) {
		var culture = this._getCultureAttribute(supportedCultureList);
		if (culture == 'neutral') {
			return defaultUrl;
		}
	}

	return this._getLocalCulturePath(localizedUrl, defaultUrl);
};

ResourceManager.prototype._getCultureAttribute = function ResourceManagerGetCultureAttribute(
	supportedCultureList
) {
	var locale = this.getCultureName();
	var defaultCultureKey = 'neutral';
	var localCulture = supportedCultureList.selectSingleNode(
		"/*/*/resource[@culture='" + locale + "']"
	);
	if (!localCulture) {
		var defaultCulture = supportedCultureList.selectSingleNode(
			"/*/*/resource[@culture='" + defaultCultureKey + "']"
		);
		return defaultCulture ? defaultCulture.getAttribute('culture') : '';
	}
	return localCulture.getAttribute('culture');
};

ResourceManager.prototype._getLocalCulturePath = function ResourceManagerGetLocalCulturePath(
	localizedUrl,
	defaultUrl
) {
	var localizedResourceExists = this._getFileExist(localizedUrl);

	if (localizedResourceExists) {
		return localizedUrl;
	} else {
		return defaultUrl;
	}
};

ResourceManager.prototype._getFileExist = function ResourceManagerGetFileExist(
	url
) {
	var cache = this._getCache();
	var cachePostfix = '_exist';
	var key = url + cachePostfix;
	var res = cache[key];
	if (res === undefined) {
		res = WebFile.Exists(url);
		cache[key] = res;
	} else {
		res = cache[key];
	}

	return res;
};

ResourceManager.prototype._getResourceConfigurationCulture = function ResourceManagerGetResourceConfigurationCulture() {
	var locale = this.getCultureName();
	var parentUrl = this.getSolution().getBaseURL();
	if (parentUrl[parentUrl.length - 1] != '/') {
		parentUrl += '/';
	}

	var configUrl = parentUrl + 'xml/' + this.getConfigFileName();
	var doc = this._tryGetResourceConfig(configUrl);

	return doc;
};

ResourceManager.prototype._tryGetResourceConfig = function ResourceManagerTryGetResourceConfigFromCache(
	url
) {
	var cache = this._getCache();

	var resourceConfigFileExists = this._getFileExist(url);
	if (!resourceConfigFileExists) {
		return null;
	}

	var cachePostfix = '_config';
	var cacheKey = url + cachePostfix;

	if (cache[cacheKey]) {
		return cache[cacheKey];
	} else {
		var doc = this._getXmlDocument(url);
		cache[cacheKey] = doc;
		return doc;
	}
};

ResourceManager.prototype.getString = function ResourceManagerGetString(key) {
	/// <summary locid="M:J#Aras.Client.JS.ResourceManager.getString">
	///  Searches for localized resource by unique key and returns it's value.
	/// </summary>
	/// <param locid="M:J#Aras.Client.JS.ResourceManager.getString" name="key" type="string" mayBeNull="false">
	///	 The unique id of the resource to get.
	/// </param>
	/// <returns type="string">Gets the value of the resource localized for the specified culture.</returns>
	/// <remarks>
	///  If the resource has not been localized for that culture, the resource that is returned is localized
	///  for a best match. Otherwise, error message will be returned.
	/// </remarks>
	key = XmlUtils.escapeXPathStringCriteria(key);

	var supportedCultureList = this._getResourceConfigurationCulture();
	var path = this._getI18NResourcePath(supportedCultureList);
	var doc = this._getXmlDocument(path);
	if (!doc) {
		return 'Error loading ' + path + ' .';
	}

	var nd = doc.selectSingleNode('/*/resource[@key=' + key + ']');
	if (!nd) {
		return 'Resource with key="' + key + '" is not found in "' + path + '".';
	}

	return nd.getAttribute('value');
};

ResourceManager.prototype.getFormatedString = function ResourceManagerGetFormatedString(
	key,
	params
) {
	/// <summary locid="M:J#Aras.Client.JS.ResourceManager.getFormatedString">
	///  Returns culture name. If culture parameter in cunstructor wasn't specified, then CultureInfo.CurrentCulture's name is taken.
	/// </summary>
	/// <param locid="M:J#Aras.Client.JS.ResourceManager.getFormatedString" name="key" type="string" mayBeNull="false">
	///	 The unique id of the resource to get.
	/// </param>
	/// <param locid="M:J#Aras.Client.JS.ResourceManager.getFormatedString" name="params" type="Object" mayBeNull="false">
	///	 Parameters to insert in resource's placeholders, i.e. resource "Tree error: ({0}) {1}" expects array of two parameters passed.
	/// </param>
	/// <returns type="string">Gets the value of the resource localized for the specified culture.</returns>
	/// <remarks>
	///  If the resource has not been localized for that culture, the resource that is returned is localized
	///  for a best match. Otherwise, error message will be returned.
	/// </remarks>

	var val = this.getString(key);
	if (arguments) {
		for (var i = 0; i < arguments.length; i++) {
			var re = new RegExp('\\{' + i + '\\}', 'g');
			val = val.replace(re, arguments[i + 1]);
		}
	}

	return val;
};
/*@cc_on
@if (@register_classes == 1)
Type.registerNamespace("Aras");
Type.registerNamespace("Aras.Client");
Type.registerNamespace("Aras.Client.JS");

Aras.Client.JS.ResourceManager = ResourceManager;
Aras.Client.JS.ResourceManager.registerClass("Aras.Client.JS.ResourceManager");
@end
@*/
