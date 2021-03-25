//! IOM.ScriptSharp.debug.js
//

(function() {

////////////////////////////////////////////////////////////////////////////////
// StringComparison

window.StringComparison = function StringComparison() {
}


////////////////////////////////////////////////////////////////////////////////
// CompressionType

window.CompressionType = function CompressionType() {
}


////////////////////////////////////////////////////////////////////////////////
// RegexOptions

window.RegexOptions = function RegexOptions() {
}


////////////////////////////////////////////////////////////////////////////////
// HttpUtility

window.HttpUtility = function HttpUtility() {
}
HttpUtility.urlEncode = function HttpUtility$urlEncode(url) {
    return encodeURIComponent(url);
}


Type.registerNamespace('Aras.IOM');

////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.IServerConnection

Aras.IOM.IServerConnection = function() { };
Aras.IOM.IServerConnection.prototype = {
    CallAction : null,
    DownloadFile : null,
    getUserID : null,
    getFileUrl : null,
    getFileUrls : null,
    GetLicenseInfo : null,
    GetDatabases : null,
    DebugLog : null,
    DebugLogP : null,
    GetDatabaseName : null,
    GetFromCache : null,
    GetOperatingParameter : null,
    GetSrvContext : null,
    InsertIntoCache : null,
    GetValidateUserXmlResult : null
}
Aras.IOM.IServerConnection.registerInterface('Aras.IOM.IServerConnection');


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.FetchFileMode

Aras.IOM.FetchFileMode = function() { };
Aras.IOM.FetchFileMode.prototype = {
    normal: 0, 
    dry: 1
}
Aras.IOM.FetchFileMode.registerEnum('Aras.IOM.FetchFileMode', false);


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.UrlType

Aras.IOM.UrlType = function() { };
Aras.IOM.UrlType.prototype = {
    none: 0, 
    securityToken: 1
}
Aras.IOM.UrlType.registerEnum('Aras.IOM.UrlType', false);


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.HttpConnectionParameters

Aras.IOM.HttpConnectionParameters = function Aras_IOM_HttpConnectionParameters() {
}
Aras.IOM.HttpConnectionParameters.prototype = {
    forceWritableSession: false
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.I18NSessionContext

Aras.IOM.I18NSessionContext = function Aras_IOM_I18NSessionContext(validateUsrXmlResult) {
    this._i18NConverter = new Aras.I18NUtils._i18NConverter();
    if (String.isNullOrEmpty(validateUsrXmlResult)) {
        return;
    }
    var xmlDocument = new XmlDocument();
    var contextXmlNode;
    try {
        xmlDocument.loadXML(validateUsrXmlResult);
        contextXmlNode = xmlDocument.documentElement.selectSingleNode('/*/*/*/i18nsessioncontext');
    }
    catch ($e1) {
        contextXmlNode = null;
    }
    if (contextXmlNode == null) {
        return;
    }
    this._locale = Aras.IOM.I18NSessionContext._getContextValue(contextXmlNode, 'locale');
    this._languageCode = Aras.IOM.I18NSessionContext._getContextValue(contextXmlNode, 'language_code');
    this._languageSuffix = Aras.IOM.I18NSessionContext._getContextValue(contextXmlNode, 'language_suffix');
    this._defaultLanguageCode = Aras.IOM.I18NSessionContext._getContextValue(contextXmlNode, 'default_language_code');
    this._defaultLanguageSuffix = Aras.IOM.I18NSessionContext._getContextValue(contextXmlNode, 'default_language_suffix');
    this._timeZone = Aras.IOM.I18NSessionContext._getContextValue(contextXmlNode, 'time_zone');
    this._corporateToLocalOffset = Aras.IOM.I18NSessionContext._getIntContextValue(contextXmlNode, 'corporate_to_local_offset');
}
Aras.IOM.I18NSessionContext._getContextValue = function Aras_IOM_I18NSessionContext$_getContextValue(cntxNode, name) {
    var pnode = cntxNode.selectSingleNode(name);
    return (pnode == null || !pnode.text.trim().length) ? null : pnode.text.trim();
}
Aras.IOM.I18NSessionContext._getIntContextValue = function Aras_IOM_I18NSessionContext$_getIntContextValue(cntxNode, name) {
    var s = Aras.IOM.I18NSessionContext._getContextValue(cntxNode, name);
    var r = Number.MIN_VALUE;
    if (!String.isNullOrEmpty(s)) {
        try {
            r = parseInt(s);
        }
        catch ($e1) {
            s = null;
        }
    }
    if (String.isNullOrEmpty(s) && !String.isNullOrEmpty(name)) {
        var lwName = name.toLowerCase();
        switch (lwName) {
            case 'time_zone':
                r = -1;
                break;
            case 'corporate_to_local_offset':
                r = 0;
                break;
        }
    }
    return r;
}
Aras.IOM.I18NSessionContext.prototype = {
    _locale: null,
    _languageCode: null,
    _languageSuffix: null,
    _defaultLanguageCode: null,
    _defaultLanguageSuffix: null,
    _timeZone: null,
    _corporateToLocalOffset: 0,
    
    ConvertToNeutral: function Aras_IOM_I18NSessionContext$ConvertToNeutral(svalue, vtype, datePtrn) {
        return this._i18NConverter._convertToOrFromNeutral(svalue, vtype, true, datePtrn, this.GetLocale(), this.GetTimeZone());
    },
    
    ConvertFromNeutral: function Aras_IOM_I18NSessionContext$ConvertFromNeutral(svalue, vtype, datePtrn) {
        return this._i18NConverter._convertToOrFromNeutral(svalue, vtype, false, datePtrn, this.GetLocale(), this.GetTimeZone());
    },
    
    ConvertUtcDateTimeToNeutral: function Aras_IOM_I18NSessionContext$ConvertUtcDateTimeToNeutral(utcStr, inPattern) {
        if (utcStr == null) {
            return null;
        }
        var dt;
        var dtfi = CultureInfo.InvariantCulture.DateTimeFormat;
        if (String.isNullOrEmpty(inPattern)) {
            dt = dtfi.Parse(utcStr, null, null);
        }
        else {
            dt = dtfi.Parse(utcStr, inPattern, null);
        }
        var UTCtimestamp = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds(), dt.getMilliseconds());
        var offset = dtfi.OffsetBetweenTimeZones(dt, this.GetTimeZone(), null);
        var tzNeutralDate = new Date(UTCtimestamp + dt.getTimezoneOffset() * 60000 + offset * 60000);
        return dtfi.Format(tzNeutralDate, 'yyyy-MM-ddTHH:mm:ss', null);
    },
    
    ConvertNeutralToUtcDateTime: function Aras_IOM_I18NSessionContext$ConvertNeutralToUtcDateTime(neutralStr, outPattern) {
        if (neutralStr == null || !String.isNullOrEmpty(outPattern) && outPattern.indexOf('z') > -1) {
            return null;
        }
        var dt;
        var dtfi = CultureInfo.InvariantCulture.DateTimeFormat;
        dt = dtfi.Parse(neutralStr, null, null);
        var UTCtimestamp = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds(), dt.getMilliseconds());
        var offset = dtfi.OffsetBetweenTimeZones(dt, this.GetTimeZone(), null);
        var CalculatedUTCDate = new Date(UTCtimestamp + dt.getTimezoneOffset() * 60000 - offset * 60000);
        return dtfi.Format(CalculatedUTCDate, outPattern, null);
    },
    
    GetLocale: function Aras_IOM_I18NSessionContext$GetLocale() {
        return this._locale;
    },
    
    GetLanguageCode: function Aras_IOM_I18NSessionContext$GetLanguageCode() {
        return this._languageCode;
    },
    
    GetLanguageSuffix: function Aras_IOM_I18NSessionContext$GetLanguageSuffix() {
        return this._languageSuffix;
    },
    
    GetDefaultLanguageCode: function Aras_IOM_I18NSessionContext$GetDefaultLanguageCode() {
        return this._defaultLanguageCode;
    },
    
    GetDefaultLanguageSuffix: function Aras_IOM_I18NSessionContext$GetDefaultLanguageSuffix() {
        return this._defaultLanguageSuffix;
    },
    
    GetTimeZone: function Aras_IOM_I18NSessionContext$GetTimeZone() {
        return this._timeZone;
    },
    
    GetCorporateToLocalOffset: function Aras_IOM_I18NSessionContext$GetCorporateToLocalOffset() {
        return this._corporateToLocalOffset;
    },
    
    GetUIDatePattern: function Aras_IOM_I18NSessionContext$GetUIDatePattern(innovatorDatePattern) {
        return Aras.I18NUtils._i18NConverter._getDotNetDatePattern(innovatorDatePattern, this.GetLocale());
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM._innovatorCredentials

Aras.IOM._innovatorCredentials = function Aras_IOM__innovatorCredentials(userName, passwordOrPasswordHash) {
    this._userName = userName;
    this._passwordOrPasswordHash = passwordOrPasswordHash;
}
Aras.IOM._innovatorCredentials.prototype = {
    _passwordOrPasswordHash: null,
    _userName: null,
    
    get_userName: function Aras_IOM__innovatorCredentials$get_userName() {
        return this._userName;
    },
    
    get_passwordOrPasswordHash: function Aras_IOM__innovatorCredentials$get_passwordOrPasswordHash() {
        return this._passwordOrPasswordHash;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.InternalUtils

Aras.IOM.InternalUtils = function Aras_IOM_InternalUtils() {
}
Aras.IOM.InternalUtils.createXmlDocument = function Aras_IOM_InternalUtils$createXmlDocument() {
    var xmlDom = new XmlDocument();
    return xmlDom;
}
Aras.IOM.InternalUtils.createAndLoadXmlDocument = function Aras_IOM_InternalUtils$createAndLoadXmlDocument(xmlValue) {
    var xmlDom = new XmlDocument();
    xmlDom.loadXML(xmlValue);
    return xmlDom;
}
Aras.IOM.InternalUtils.loadXmlFromString = function Aras_IOM_InternalUtils$loadXmlFromString(xmlDocument, xmlValue) {
    xmlDocument.loadXML(xmlValue);
}
Aras.IOM.InternalUtils._getAttribute = function Aras_IOM_InternalUtils$_getAttribute(element, attributeName) {
    return (Type.safeCast(element.getAttribute(attributeName), String)) || '';
}
Aras.IOM.InternalUtils._getNodeType = function Aras_IOM_InternalUtils$_getNodeType(node) {
    var nodeType = node.nodeType;
    return nodeType;
}
Aras.IOM.InternalUtils._hasAttribute = function Aras_IOM_InternalUtils$_hasAttribute(element, attrName) {
    var res = element.selectSingleNode('./@' + attrName) != null;
    return res;
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.XmlExtension

Aras.IOM.XmlExtension = function Aras_IOM_XmlExtension() {
}
Aras.IOM.XmlExtension.getXml = function Aras_IOM_XmlExtension$getXml(node) {
    return node.xml;
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.IomFactory

Aras.IOM.IomFactory = function Aras_IOM_IomFactory() {
}
Aras.IOM.IomFactory.prototype = {
    
    CreateInnovator: function Aras_IOM_IomFactory$CreateInnovator(serverConnection) {
        return new Aras.IOM.Innovator(serverConnection);
    },
    
    CreateArrayList: function Aras_IOM_IomFactory$CreateArrayList() {
        return [];
    },
    
    CreateItemCache: function Aras_IOM_IomFactory$CreateItemCache() {
        return new Aras.IOME.ItemCache();
    },
    
    CreateCacheableContainer: function Aras_IOM_IomFactory$CreateCacheableContainer(value, dependenciesSource) {
        return new Aras.IOME.CacheableContainer(value, dependenciesSource);
    },
    
    CreateHttpServerConnection: function Aras_IOM_IomFactory$CreateHttpServerConnection(innovatorServerUrl, database, userName, password, culture, timeZone) {
        return new Aras.IOM.HttpServerConnection(innovatorServerUrl, database, userName, password, culture, timeZone);
    },
    
    CreateRestrictedHttpServerConnection: function Aras_IOM_IomFactory$CreateRestrictedHttpServerConnection(innovatorServerUrl) {
        return new Aras.IOM._restrictedHttpServerConnection(innovatorServerUrl);
    },
    
    CreateWinAuthHttpServerConnection: function Aras_IOM_IomFactory$CreateWinAuthHttpServerConnection(innovatorServerUrl, database) {
        return new Aras.IOM.WinAuthHttpServerConnection(innovatorServerUrl, database);
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.HttpServerConnection

Aras.IOM.HttpServerConnection = function Aras_IOM_HttpServerConnection(innovatorServerUrl, database, userName, password, culture, timeZone) {
    Aras.IOM.HttpServerConnection.initializeBase(this);
    if (!Aras.IOM.HttpServerConnection._passwordHashTester$1.test(password)) {
        throw new Error('Not Implemented');
    }
    this.Compression = 'none';
    if (!String.isNullOrEmpty(culture)) {
        this.set_locale(culture);
    }
    if (!String.isNullOrEmpty(timeZone)) {
        this.set_timeZoneName(timeZone);
    }
    if (!innovatorServerUrl.endsWith('InnovatorServer.aspx')) {
        innovatorServerUrl += ((!innovatorServerUrl.endsWith('/')) ? '/' : '') + 'Server/';
    }
    else if (innovatorServerUrl.endsWith('InnovatorServer.aspx')) {
        innovatorServerUrl = innovatorServerUrl.replace(new RegExp('InnovatorServer.aspx$', RegexOptions.ignoreCase), '');
    }
    this._innovatorServerBaseUrl = innovatorServerUrl;
    this._innovatorServerUrl = String.format('{0}InnovatorServer.aspx', this._innovatorServerBaseUrl);
    this._httpDatabase$1 = database;
    this._rawCredentials = new Aras.IOM._innovatorCredentials(userName, password);
}
Aras.IOM.HttpServerConnection._setProperty$1 = function Aras_IOM_HttpServerConnection$_setProperty$1(xmlElement, propName, propValue) {
    if (String.isNullOrEmpty(propValue)) {
        return;
    }
    var newElement = xmlElement.ownerDocument.createElement(propName);
    newElement.text = propValue;
    xmlElement.appendChild(newElement);
}
Aras.IOM.HttpServerConnection._setError$1 = function Aras_IOM_HttpServerConnection$_setError$1(outDom, faultCode, message, faultActor, detailNode) {
    Aras.IOM.InternalUtils.loadXmlFromString(outDom, Aras.IOM.HttpServerConnection._faultPrototype$1);
    var faultstring = outDom.selectSingleNode('//faultstring');
    faultstring.text = message;
    if (!String.isNullOrEmpty(faultCode)) {
        var faultCodeNode = outDom.selectSingleNode('//faultcode');
        faultCodeNode.text = faultCode;
    }
    if (!String.isNullOrEmpty(faultActor)) {
        var faultActorNode = outDom.selectSingleNode('//faultactor');
        faultActorNode.text = faultActor;
    }
    if (detailNode != null) {
        var oldDetailNode = outDom.selectSingleNode('//detail');
        oldDetailNode.parentNode.replaceChild(detailNode, oldDetailNode);
    }
}
Aras.IOM.HttpServerConnection.prototype = {
    _innovatorServerUrl: null,
    _innovatorServerBaseUrl: null,
    _httpDatabase$1: null,
    _logonUserDatabase$1: null,
    _validateUserXmlResult$1: null,
    _isLoggedIn$1: false,
    
    CallAction: function Aras_IOM_HttpServerConnection$CallAction(actionName, inDom, outDom) {
        this.callActionImpl(actionName, inDom, outDom, this._innovatorServerUrl, true);
    },
    
    DebugLog: function Aras_IOM_HttpServerConnection$DebugLog(reason, msg) {
        throw new Error('Not implemented');
    },
    
    DebugLogP: function Aras_IOM_HttpServerConnection$DebugLogP() {
        throw new Error('Not implemented');
    },
    
    getUserID: function Aras_IOM_HttpServerConnection$getUserID() {
        if (!this._isLoggedIn$1) {
            throw new Error('Not logged in');
        }
        if (this.cachedUserInfo != null) {
            return this.cachedUserInfo.getID();
        }
        var inDom = Aras.IOM.InternalUtils.createAndLoadXmlDocument('<Empty />');
        var outDom = Aras.IOM.InternalUtils.createAndLoadXmlDocument('<Empty />');
        this.CallAction('GetCurrentUserID', inDom, outDom);
        var result = outDom.selectSingleNode(Aras.IOM.Item.xPathResult);
        if (result != null) {
            return result.text;
        }
        throw new Error('Cannot obtain user id');
    },
    
    GetDatabaseName: function Aras_IOM_HttpServerConnection$GetDatabaseName() {
        if (!String.isNullOrEmpty(this._logonUserDatabase$1) && !String.isNullOrEmpty(this._httpDatabase$1) && !String.equals(this._logonUserDatabase$1, this._httpDatabase$1, StringComparison.ordinalIgnoreCase)) {
            throw new Error('Different databases passed.');
        }
        if (String.isNullOrEmpty(this._logonUserDatabase$1) && !String.isNullOrEmpty(this._httpDatabase$1)) {
            return this._httpDatabase$1;
        }
        if (String.isNullOrEmpty(this._logonUserDatabase$1)) {
            throw new Error('Database not found.');
        }
        return this._logonUserDatabase$1;
    },
    
    GetOperatingParameter: function Aras_IOM_HttpServerConnection$GetOperatingParameter(name, defaultvalue) {
        return defaultvalue;
    },
    
    GetSrvContext: function Aras_IOM_HttpServerConnection$GetSrvContext() {
        return (null);
    },
    
    GetValidateUserXmlResult: function Aras_IOM_HttpServerConnection$GetValidateUserXmlResult() {
        return this._validateUserXmlResult$1;
    },
    
    GetLicenseInfo: function Aras_IOM_HttpServerConnection$GetLicenseInfo(issuer, addonName) {
        var inDom = Aras.IOM.InternalUtils.createXmlDocument();
        var outDom = Aras.IOM.InternalUtils.createXmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, '<Item/>');
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty/>');
        Aras.IOM.HttpServerConnection._setProperty$1(inDom.documentElement, 'issuer', issuer);
        Aras.IOM.HttpServerConnection._setProperty$1(inDom.documentElement, 'name', addonName);
        this.callActionImpl('GetLicenseInfo', inDom, outDom, this._innovatorServerBaseUrl + 'License.aspx', true);
        return Aras.IOM.XmlExtension.getXml(outDom.documentElement);
    },
    
    _timeout$1: 0,
    
    get_Timeout: function Aras_IOM_HttpServerConnection$get_Timeout() {
        return this._timeout$1;
    },
    set_Timeout: function Aras_IOM_HttpServerConnection$set_Timeout(value) {
        if ((value < 0) && (value !== -1)) {
            throw new Error("Timeout can be only be set to 'System.Threading.Timeout.Infinite' or a value >= 0.");
        }
        this._timeout$1 = value;
        return value;
    },
    
    _readWriteTimeout$1: 0,
    
    get_ReadWriteTimeout: function Aras_IOM_HttpServerConnection$get_ReadWriteTimeout() {
        return this._readWriteTimeout$1;
    },
    set_ReadWriteTimeout: function Aras_IOM_HttpServerConnection$set_ReadWriteTimeout(value) {
        if ((value < 0) && (value !== -1)) {
            throw new Error("Timeout can be only be set to 'System.Threading.Timeout.Infinite' or a value >= 0.");
        }
        this._readWriteTimeout$1 = value;
        return value;
    },
    
    Login: function Aras_IOM_HttpServerConnection$Login() {
        var inDom = Aras.IOM.InternalUtils.createXmlDocument();
        var outDom = Aras.IOM.InternalUtils.createXmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, '<Item/>');
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty/>');
        this.CallAction('ValidateUser', inDom, outDom);
        var resultNode = outDom.selectSingleNode('//Result/id');
        if (resultNode == null) {
            return this._createErrorItem$1(outDom);
        }
        this._isLoggedIn$1 = true;
        var uresult = this.getUserInfo();
        if (uresult.isError()) {
            this._isLoggedIn$1 = false;
        }
        else {
            var logonUserDatabaseNode = outDom.selectSingleNode('//Result/database');
            if (logonUserDatabaseNode != null && !String.isNullOrEmpty(logonUserDatabaseNode.text)) {
                this._logonUserDatabase$1 = logonUserDatabaseNode.text;
            }
        }
        return uresult;
    },
    
    Logout: function Aras_IOM_HttpServerConnection$Logout(unlockOnLogout) {
        var inDom = new XmlDocument();
        var outDom = new XmlDocument();
        var skipUnlock = (unlockOnLogout) ? '0' : '1';
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, "<logoff skip_unlock='" + skipUnlock + "'/>");
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty/>');
        this.CallAction('Logoff', inDom, outDom);
        this._isLoggedIn$1 = false;
        this.cachedUserInfo = null;
    },
    
    _httpConnectionParameters$1: null,
    
    usingParameters: function Aras_IOM_HttpServerConnection$usingParameters(parameters, action) {
        this._httpConnectionParameters$1 = parameters;
        try {
            if (action != null) {
                action();
            }
        }
        finally {
            this._httpConnectionParameters$1 = null;
        }
    },
    
    _createErrorItem$1: function Aras_IOM_HttpServerConnection$_createErrorItem$1(dom) {
        var faultNode = dom.selectSingleNode(Aras.IOM.Item.xPathFault);
        var innovator = new Aras.IOM.Innovator(this);
        var errorItem;
        if (faultNode != null) {
            errorItem = innovator.newItem();
            errorItem.dom = dom;
        }
        else {
            errorItem = innovator.newError('Unknown error');
        }
        return errorItem;
    },
    
    _rawCredentials: null,
    
    get_userName: function Aras_IOM_HttpServerConnection$get_userName() {
        return this._rawCredentials.get_userName();
    },
    
    get_userPassword: function Aras_IOM_HttpServerConnection$get_userPassword() {
        return this._rawCredentials.get_passwordOrPasswordHash();
    },
    
    callActionImpl: function Aras_IOM_HttpServerConnection$callActionImpl(actionName, inDom, outDom, url, doSetHeaders) {
        var wReq = this._sendRequestInternal$1(inDom, url, actionName, doSetHeaders);
        if (wReq.status === 200) {
            try {
                Aras.IOM.InternalUtils.loadXmlFromString(outDom, wReq.responseText);
            }
            catch (ex) {
                Aras.IOM.HttpServerConnection._setError$1(outDom, null, Type.getInstanceType(ex).get_fullName() + ': ' + ex.message, null, null);
                return;
            }
        }
        else {
            Aras.IOM.HttpServerConnection._setError$1(outDom, null, 'no response from Innovator server ' + this._innovatorServerUrl, null, null);
            return;
        }
        if (actionName != null && actionName.toLowerCase() === 'validateuser') {
            this._validateUserXmlResult$1 = wReq.responseText;
            var tmpCntx = new Aras.IOM.I18NSessionContext(this._validateUserXmlResult$1);
            this.set_locale(tmpCntx.GetLocale());
            this.set_timeZoneName(tmpCntx.GetTimeZone());
        }
    },
    
    _sendRequest: function Aras_IOM_HttpServerConnection$_sendRequest(inDom, url, actionName, doSetHeaders) {
        var wReq = this._sendRequestInternal$1(inDom, url, actionName, doSetHeaders);
        return wReq;
    },
    
    _sendRequestInternal$1: function Aras_IOM_HttpServerConnection$_sendRequestInternal$1(inDom, url, actionName, doSetHeaders) {
        if (inDom == null || inDom.documentElement == null) {
            throw new Error('inDom');
        }
        if (String.isNullOrEmpty(url)) {
            throw new Error('url');
        }
        var wReq = TopWindowHelper.getMostTopWindowWithAras(window).aras.XmlHttpRequestManager.CreateRequest();
        wReq.open('POST', url, false);
        var xmlhdr = "<?xml version='1.0' encoding='utf-8' ?>";
        var data = xmlhdr + inDom.documentElement.xml;
        wReq.setRequestHeader('Content-Type', 'text/xml');
        if (doSetHeaders) {
            wReq.setRequestHeader('SOAPAction', actionName);
            wReq.setRequestHeader('AUTHUSER', this.get_userName());
            wReq.setRequestHeader('AUTHPASSWORD', this.get_userPassword());
            wReq.setRequestHeader('DATABASE', this._httpDatabase$1);
            wReq.setRequestHeader('LOCALE', this.get_locale());
            wReq.setRequestHeader('TIMEZONE_NAME', this.get_timeZoneName());
        }
        if (this._httpConnectionParameters$1 != null && this._httpConnectionParameters$1.forceWritableSession) {
            wReq.setRequestHeader('Aras-Set-HttpSessionState-Behavior', 'required');
        }
        if (wReq.timeout > 0 || wReq.timeout === -1) {
            wReq.timeout = this.get_Timeout();
            wReq.send(data);
        }
        else {
            wReq.send(data);
        }
        return wReq;
    },
    
    getFileUrl: function Aras_IOM_HttpServerConnection$getFileUrl(fileId, type) {
        if (fileId == null) {
            throw new Error('fileId');
        }
        var fileUrl = Aras.IOM.HttpServerConnection.callBaseMethod(this, 'getFileUrl', [ fileId, 0 ]);
        return fileUrl;
    },
    
    Compression: null,
    
    getFileUrls: function Aras_IOM_HttpServerConnection$getFileUrls(fileIds, type) {
        if (fileIds == null) {
            throw new Error('fileIds');
        }
        if (!fileIds.length) {
            throw new Error('List cannot be empty. Parameter name: fileIds');
        }
        var urls = Aras.IOM.HttpServerConnection.callBaseMethod(this, 'getFileUrls', [ fileIds, 0 ]);
        return [urls];
    },
    
    GetDatabases: function Aras_IOM_HttpServerConnection$GetDatabases() {
        var sb = new ss.StringBuilder(this._innovatorServerBaseUrl);
        sb.append('DBList.aspx');
        var dblistUri = sb.toString();
        var xmlhttp = TopWindowHelper.getMostTopWindowWithAras(window).aras.XmlHttpRequestManager.CreateRequest();
        xmlhttp.open('GET', dblistUri, false);
        xmlhttp.send(null);
        var resDom = new XmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(resDom, xmlhttp.responseText);
        var nodes = resDom.selectNodes('DBList/DB/@id');
        var result = new Array(nodes.length);
        for (var i = 0; i < nodes.length; i++) {
            result[i] = nodes[i].text;
        }
        return result;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.Innovator

Aras.IOM.Innovator = function Aras_IOM_Innovator(serverConnection) {
    this._i18nscH = {};
    if (serverConnection == null) {
        throw new Error('serverConnection');
    }
    this._serverConnection = serverConnection;
}
Aras.IOM.Innovator._generateGuid = function Aras_IOM_Innovator$_generateGuid() {
    return TopWindowHelper.getMostTopWindowWithAras(window).aras.GUIDManager.GetGUID();;
}
Aras.IOM.Innovator.scalcMD5 = function Aras_IOM_Innovator$scalcMD5(val) {
    return calcMD5(val);
}
Aras.IOM.Innovator.prototype = {
    _serverConnection: null,
    
    applyAML: function Aras_IOM_Innovator$applyAML(AML) {
        var inDom = this.newXMLDocument();
        var outDom = this.newXMLDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, AML);
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty />');
        this._serverConnection.CallAction('ApplyAML', inDom, outDom);
        return this._createItemFromDom(outDom);
    },
    
    applyMethod: function Aras_IOM_Innovator$applyMethod(methodName, body) {
        var inDom = this.newXMLDocument();
        var outDom = this.newXMLDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, "<Item type='Method'>" + body + '</Item>');
        inDom.documentElement.setAttribute('action', methodName);
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty />');
        this._serverConnection.CallAction('ApplyMethod', inDom, outDom);
        return this._createItemFromDom(outDom);
    },
    
    _createItemFromDom: function Aras_IOM_Innovator$_createItemFromDom(dom) {
        var response = Aras.IOM.Item._createItem(this._serverConnection, '', '', 'simple');
        if (dom.selectSingleNode(Aras.IOM.Item.xPathFault) != null) {
            response.dom = dom;
        }
        else {
            response.loadAML(Aras.IOM.XmlExtension.getXml(dom));
        }
        return response;
    },
    
    newXMLDocument: function Aras_IOM_Innovator$newXMLDocument() {
        return Aras.IOM.InternalUtils.createXmlDocument();
    },
    
    getConnection: function Aras_IOM_Innovator$getConnection() {
        return this._serverConnection;
    },
    
    getI18NSessionContext: function Aras_IOM_Innovator$getI18NSessionContext() {
        var xml = this._serverConnection.GetValidateUserXmlResult();
        if (String.isNullOrEmpty(xml)) {
            xml = '';
        }
        if (Object.keyExists(this._i18nscH, xml)) {
            return this._i18nscH[xml];
        }
        var sessionContext;
        sessionContext = new Aras.IOM.I18NSessionContext(xml);
        this._i18nscH[xml] = sessionContext;
        return sessionContext;
    },
    
    getNewID: function Aras_IOM_Innovator$getNewID() {
        return Aras.IOM.Innovator._generateGuid();
    },
    
    getNextSequence: function Aras_IOM_Innovator$getNextSequence(sequenceName) {
        var inDom = this.newXMLDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, '<Item><name/></Item>');
        var node = inDom.selectSingleNode('Item/name');
        if (node != null) {
            node.text = sequenceName;
        }
        var outDom = this.newXMLDocument();
        this._serverConnection.CallAction('GetNextSequence', inDom, outDom);
        var seq = outDom.selectSingleNode(Aras.IOM.Item.xPathResult);
        return (seq == null) ? null : seq.text;
    },
    
    newItem: function Aras_IOM_Innovator$newItem(itemTypeName, action) {
        if (ss.isNullOrUndefined(action)) {
            if (ss.isNullOrUndefined(itemTypeName)) {
                return Aras.IOM.Item._createItem(this._serverConnection, null, null, 'full');
            }
            else {
                return Aras.IOM.Item._createItem(this._serverConnection, itemTypeName, null, 'full');
            }
        }
        return Aras.IOM.Item._createItem(this._serverConnection, itemTypeName, action, 'full');
    },
    
    getUserID: function Aras_IOM_Innovator$getUserID() {
        return this._serverConnection.getUserID();
    },
    
    getItemById: function Aras_IOM_Innovator$getItemById(itemTypeName, id) {
        if (itemTypeName == null || !itemTypeName.trim().length) {
            throw new Error('Item type must be specified');
        }
        if (id == null || !id.trim().length) {
            throw new Error('ID must be specified');
        }
        var inDom = this.newXMLDocument();
        var outDom = this.newXMLDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, "<Item type='" + itemTypeName + "' id='" + id + "' />");
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty />');
        this._serverConnection.CallAction('GetItem', inDom, outDom);
        var result = this._createItemFromDom(outDom);
        return (result.isError() && result.getErrorCode() === '0') ? null : result;
    },
    
    getItemByKeyedName: function Aras_IOM_Innovator$getItemByKeyedName(itemTypeName, keyedName) {
        if (itemTypeName == null || !itemTypeName.trim().length) {
            throw new Error('Item type must be specified');
        }
        if (keyedName == null || !keyedName.trim().length) {
            throw new Error('Keyed name must be specified');
        }
        var inDom = this.newXMLDocument();
        var outDom = this.newXMLDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, "<Item type='" + itemTypeName + "'><keyed_name/></Item>");
        inDom.documentElement.selectSingleNode('//keyed_name').text = keyedName;
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty />');
        this._serverConnection.CallAction('GetItem', inDom, outDom);
        var result = this._createItemFromDom(outDom);
        return (result.isError() && result.getErrorCode() === '0') ? null : result;
    },
    
    getUserAliases: function Aras_IOM_Innovator$getUserAliases() {
        var item = Aras.IOM.Item._createItem(this._serverConnection, 'Alias', null, 'full');
        item.setProperty('source_id', this.getUserID(), null);
        var aliases = item.apply('get');
        var items = aliases.dom.selectNodes(Aras.IOM.Item.xPathResult + "/Item[@type='Alias']/related_id/Item[@type='Identity']");
        var aliasesArray = new Array(items.length);
        for (var i = 0; i < items.length; i++) {
            var identityID = Aras.IOM.InternalUtils._getAttribute(items[i], 'id');
            if (!identityID) {
                return '';
            }
            aliasesArray[i] = identityID;
        }
        return aliasesArray.join(',');
    },
    
    getFileUrl: function Aras_IOM_Innovator$getFileUrl(fileId, type) {
        return this._serverConnection.getFileUrl(fileId, type);
    },
    
    getFileUrls: function Aras_IOM_Innovator$getFileUrls(fileIds, type) {
        return this._serverConnection.getFileUrls(fileIds, type);
    },
    
    newError: function Aras_IOM_Innovator$newError(explanation) {
        var item = Aras.IOM.Item._createItem(this._serverConnection, '', '', 'full');
        var xml = Aras.SoapConstants._soap._envelopeBodyStart + '<' + 'SOAP-ENV' + ':Fault>\r\n\t\t\t<faultcode>1</faultcode>\r\n\t\t\t<faultactor></faultactor>\r\n\t\t\t</' + 'SOAP-ENV' + ':Fault>' + Aras.SoapConstants._soap._envelopeBodyEnd;
        var dom = Aras.IOM.InternalUtils.createXmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(dom, xml);
        var fnode = dom.selectSingleNode(Aras.SoapConstants._soap._envelopeBodyFaultXPath);
        var dnode = fnode.appendChild(dom.createElement('faultstring'));
        dnode.text = explanation;
        item.dom = dom;
        return item;
    },
    
    consumeLicense: function Aras_IOM_Innovator$consumeLicense(featureName) {
        var manager = new Aras.IOME.Licensing.LicenseManager(this._serverConnection);
        return manager.consumeLicense(featureName);
    },
    
    newResult: function Aras_IOM_Innovator$newResult(resultBody) {
        var item = Aras.IOM.Item._create(this._serverConnection);
        Aras.IOM.InternalUtils.loadXmlFromString(item.dom, Aras.SoapConstants._soap._envelopeBodyStart + '<Result />' + Aras.SoapConstants._soap._envelopeBodyEnd);
        item.node = null;
        item.nodeList = null;
        var resultNd = item.dom.selectSingleNode('/' + Aras.SoapConstants._soap._envelopeBodyXPath + '/Result');
        resultNd.text = resultBody;
        var test = new XmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(test, Aras.IOM.XmlExtension.getXml(item.dom));
        return item;
    },
    
    applySQL: function Aras_IOM_Innovator$applySQL(sql) {
        return this.applySQLWithParameters(sql, null);
    },
    
    applySQLWithParameters: function Aras_IOM_Innovator$applySQLWithParameters(query, parameters) {
        var inDom = this.newXMLDocument();
        var outDom = this.newXMLDocument();
        var queryNode;
        var sqlWithOnlyParameters = '<sql>' + (parameters || '') + '</sql>';
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, sqlWithOnlyParameters);
        queryNode = inDom.createNode(1, 'Query', null);
        queryNode.text = query;
        inDom.documentElement.appendChild(queryNode);
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty />');
        this._serverConnection.CallAction('ApplySQL', inDom, outDom);
        return this._createItemFromDom(outDom);
    },
    
    getItemInDom: function Aras_IOM_Innovator$getItemInDom(dom) {
        if (dom == null) {
            return null;
        }
        var itemNode = dom.selectSingleNode('//Item');
        if (itemNode == null) {
            return null;
        }
        var item = Aras.IOM.Item._create(this._serverConnection);
        Aras.IOM.InternalUtils.loadXmlFromString(item.dom, Aras.IOM.XmlExtension.getXml(dom));
        item.node = item.dom.selectSingleNode('//Item');
        return item;
    },
    
    calcMD5: function Aras_IOM_Innovator$calcMD5(val) {
        throw new Error('Not Implemented');
    },
    
    getAssignedActivities: function Aras_IOM_Innovator$getAssignedActivities(state, userId) {
        throw new Error('Not Implemented');
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.Item

Aras.IOM.Item = function Aras_IOM_Item(serverConnection, itemTypeName, action, mode) {
    if (String.isNullOrEmpty(mode) || String.equals(mode, 'simple', StringComparison.ordinalIgnoreCase)) {
        this.dom = null;
        this.node = null;
        this.nodeList = null;
        this.serverConnection = serverConnection;
    }
    else {
        this.dom = this.newXMLDocument();
        this.node = this.dom.createElement('Item');
        this.dom.appendChild(this.node);
        this.node.setAttribute('isNew', '1');
        this.node.setAttribute('isTemp', '1');
        this.nodeList = null;
        this.serverConnection = serverConnection;
        if (itemTypeName != null && !!itemTypeName.trim().length) {
            this.setType(itemTypeName);
            if (action != null && !!action.trim().length) {
                this.setAction(action);
                if (String.equals(action, 'add', StringComparison.ordinalIgnoreCase) || String.equals(action, 'create', StringComparison.ordinalIgnoreCase)) {
                    this.setNewID();
                }
            }
        }
    }
    this._parentInnovator = new Aras.IOM.Innovator(serverConnection);
}
Aras.IOM.Item._createItem = function Aras_IOM_Item$_createItem(serverConnection, itemTypeName, action, mode) {
    if (ss.isNullOrUndefined(mode)) {
        if (ss.isNullOrUndefined(action)) {
            if (ss.isNullOrUndefined(itemTypeName)) {
                return new Aras.IOM.Item(serverConnection, '', '', 'simple');
            }
            else {
                return new Aras.IOM.Item(serverConnection, itemTypeName, '', 'simple');
            }
        }
        else {
            return new Aras.IOM.Item(serverConnection, itemTypeName, action, 'simple');
        }
    }
    return new Aras.IOM.Item(serverConnection, itemTypeName, action, mode);
}
Aras.IOM.Item._getVaultServerIdFromFile = function Aras_IOM_Item$_getVaultServerIdFromFile(fnode) {
    var locatedVaultServerNd = fnode.getItemsByXPath("Relationships/Item[@type='Located']");
    if (locatedVaultServerNd.getItemCount() === 1) {
        var newVaultServerId = '';
        locatedVaultServerNd = locatedVaultServerNd.getItemByIndex(0);
        var vitem = locatedVaultServerNd.getPropertyItem('related_id');
        if (vitem != null) {
            newVaultServerId = vitem.getID();
            if (!newVaultServerId.trim().length) {
                if (vitem.getAction() === 'get') {
                    vitem = vitem.apply();
                    if (!vitem.isError()) {
                        newVaultServerId = vitem.getID();
                    }
                }
            }
        }
        else {
            newVaultServerId = locatedVaultServerNd.getProperty('related_id');
        }
        if (!newVaultServerId.trim().length) {
            var errorMessage;
            errorMessage = String.format("Vault ID is not specified in the following AML fragment: '{0}'", Aras.IOM.XmlExtension.getXml(fnode.node));
            throw new Error(errorMessage);
        }
        return newVaultServerId;
    }
    return null;
}
Aras.IOM.Item._buildItemXPath = function Aras_IOM_Item$_buildItemXPath(inode, withoutCurrent) {
    var xpath = '';
    var i = 0;
    while (Aras.IOM.InternalUtils._getNodeType(inode) !== 9) {
        if (withoutCurrent && !i) {
            xpath = '';
        }
        else {
            xpath = String.format('/*[position()={0}]{1}', Aras.IOM.Item._findXmlElementPosition(inode), xpath);
        }
        i++;
        inode = inode.parentNode;
    }
    return xpath;
}
Aras.IOM.Item._findXmlElementPosition = function Aras_IOM_Item$_findXmlElementPosition(child) {
    var position = 0;
    var children = child.parentNode.selectNodes('./*');
    var $enum1 = ss.IEnumerator.getEnumerator(children);
    while ($enum1.moveNext()) {
        var c = $enum1.current;
        if (Aras.IOM.InternalUtils._getNodeType(c) !== 1) {
            continue;
        }
        position++;
        if (c === child) {
            break;
        }
    }
    return position;
}
Aras.IOM.Item._create = function Aras_IOM_Item$_create(serverConnection) {
    return Aras.IOM.Item._createItem(serverConnection, null, null, 'full');
}
Aras.IOM.Item.prototype = {
    
    newItem: function Aras_IOM_Item$newItem(itemTypeName, action) {
        if (ss.isNullOrUndefined(action)) {
            if (ss.isNullOrUndefined(itemTypeName)) {
                return Aras.IOM.Item._createItem(this.serverConnection, null, null, 'full');
            }
            else {
                return Aras.IOM.Item._createItem(this.serverConnection, itemTypeName, null, 'full');
            }
        }
        return Aras.IOM.Item._createItem(this.serverConnection, itemTypeName, action, 'full');
    },
    
    newInnovator: function Aras_IOM_Item$newInnovator() {
        return new Aras.IOM.Innovator(this.serverConnection);
    },
    
    serverConnection: null,
    dom: null,
    node: null,
    nodeList: null,
    
    loadAML: function Aras_IOM_Item$loadAML(AML) {
        if (this.dom == null) {
            this.dom = new XmlDocument();
        }
        try {
            Aras.IOM.InternalUtils.loadXmlFromString(this.dom, AML);
            if (!!this.dom.parseError.errorCode) {
                throw new Error('Data at the root level is invalid. ' + this.dom.parseError.reason);
            }
        }
        catch (ex) {
            this.dom = null;
            throw ex;
        }
        finally {
            this._initNodes();
        }
    },
    
    clone: function Aras_IOM_Item$clone(cloneRelationships) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var newItem = this.newItem(null, null);
        Aras.IOM.InternalUtils.loadXmlFromString(newItem.dom, Aras.IOM.XmlExtension.getXml(this.node));
        newItem.node = newItem.dom.selectSingleNode('//Item');
        newItem.setNewID();
        newItem.setAction('add');
        if (!cloneRelationships) {
            var rels = newItem.node.selectSingleNode('Relationships');
            if (rels != null) {
                rels.parentNode.removeChild(rels);
            }
        }
        else {
            var items = newItem.node.selectNodes('.//Relationships/Item');
            for (var i = 0; i < items.length; i++) {
                (items[i]).setAttribute('id', this.getNewID());
                (items[i]).setAttribute('action', 'add');
            }
        }
        return newItem;
    },
    
    _initNodes: function Aras_IOM_Item$_initNodes() {
        if (this.dom == null) {
            this.node = null;
            this.nodeList = null;
        }
        else {
            var items = this.dom.selectNodes('Item|AML/Item|//Result/Item');
            if (!items.length) {
                this.node = null;
                this.nodeList = null;
            }
            else if (items.length > 1) {
                this.node = null;
                this.nodeList = items;
            }
            else {
                this.node = items[0];
                this.nodeList = null;
            }
        }
    },
    
    _checkInternalStructure: function Aras_IOM_Item$_checkInternalStructure(mode) {
        if (this.dom == null) {
            return false;
        }
        if (!!(mode & 1)) {
            if (this.node == null || !this._isFromThisDoc(this.node)) {
                return false;
            }
        }
        if (!!(mode & 2)) {
            if (this.nodeList == null || !this.nodeList.length) {
                return false;
            }
            else {
                var $enum1 = ss.IEnumerator.getEnumerator(this.nodeList);
                while ($enum1.moveNext()) {
                    var n = $enum1.current;
                    if (!this._isFromThisDoc(n)) {
                        return false;
                    }
                }
            }
        }
        if (!!(mode & 4)) {
            if (this.node == null || this.node.nodeName !== 'Item') {
                return false;
            }
        }
        if (!!(mode & 8)) {
            if (this.nodeList == null || !this.nodeList.length) {
                return false;
            }
            else {
                var $enum2 = ss.IEnumerator.getEnumerator(this.nodeList);
                while ($enum2.moveNext()) {
                    var n = $enum2.current;
                    var name = n.nodeName;
                    if (!String.equals(name, 'Item', StringComparison.ordinalIgnoreCase)) {
                        return false;
                    }
                }
            }
        }
        if (!!(mode & 16)) {
            if (this.nodeList == null || !this.nodeList.length) {
                return false;
            }
            else if (this.nodeList.length > 1) {
                var parent = this.nodeList[0].parentNode;
                for (var i = 1; i < this.nodeList.length; i++) {
                    if (this.nodeList[i].parentNode !== parent) {
                        return false;
                    }
                }
            }
        }
        if (!!(mode & 32)) {
            if (this.node == null) {
                return false;
            }
            else {
                var name = this.node.nodeName;
                if (!String.equals(name, 'and', StringComparison.ordinalIgnoreCase) && !String.equals(name, 'or', StringComparison.ordinalIgnoreCase) && !String.equals(name, 'not', StringComparison.ordinalIgnoreCase)) {
                    return false;
                }
            }
        }
        return true;
    },
    
    newXMLDocument: function Aras_IOM_Item$newXMLDocument() {
        var xmlDom = new XmlDocument();
        return xmlDom;
    },
    
    _isFromThisDoc: function Aras_IOM_Item$_isFromThisDoc(node) {
        var dom = this.dom;
        if (node.ownerDocument !== dom) {
            return false;
        }
        var rval = false;
        while (node.parentNode != null) {
            var parent = node.parentNode;
            if (Aras.IOM.InternalUtils._getNodeType(parent) === 9) {
                rval = true;
                break;
            }
            node = parent;
        }
        return rval;
    },
    
    apply: function Aras_IOM_Item$apply(arg, argsObject) {
        var action = Type.safeCast(arg, String);
        if (action == null && arg != null) {
            argsObject = Type.safeCast(arg, Object);
        }
        this._validateItemBeforeApply(action, argsObject);
        var tmpConnection = Type.safeCast(this.serverConnection, Aras.IOM.ServerConnectionBase);
        if (tmpConnection != null && tmpConnection.get__isApplyThroughVaultServerSupported() && this._isApplyThroughVaultServerRequired()) {
            return this._applyThroughVaultServer(tmpConnection);
        }
        var outDom = this.newXMLDocument();
        var inDom = this.newXMLDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, Aras.IOM.XmlExtension.getXml(this.node));
        this.serverConnection.CallAction('ApplyItem', inDom, outDom);
        var retItem = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        retItem.dom = outDom;
        if (outDom.selectSingleNode(Aras.IOM.Item.xPathFault + '/faultcode') == null) {
            retItem._initNodes();
        }
        return retItem;
    },
    
    _validateItemBeforeApply: function Aras_IOM_Item$_validateItemBeforeApply(action, argsObject) {
        if (!this._checkInternalStructure(4)) {
            if (this.dom.selectSingleNode('a/WorkflowMap') == null) {
                throw new Error('Not a single item');
            }
        }
        if (!this._checkInternalStructure(1)) {
            throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
        }
        if (!String.isNullOrEmpty(action)) {
            this.node.setAttribute('action', action);
        }
        if ((argsObject != null) && (Object.getKeyCount(argsObject) > 0)) {
            var $enum1 = ss.IEnumerator.getEnumerator(Object.keys(argsObject));
            while ($enum1.moveNext()) {
                var key = $enum1.current;
                this.setProperty(key, argsObject[key].toString(), null);
            }
        }
    },
    
    _applyThroughVaultServer: function Aras_IOM_Item$_applyThroughVaultServer(connection, tnx) {
        var vaultServerId = this._getVaultServerId();
        var vaultUrl = this._getVaultServerUrl(vaultServerId);
        var fileList = this._getFilesContainer();
        var applyAML = '';
        if (this.node != null) {
            applyAML = Aras.IOM.XmlExtension.getXml(this.node);
        }
        else {
            for (var i = 0; i < this.nodeList.length; i++) {
                applyAML += Aras.IOM.XmlExtension.getXml(this.nodeList[i]);
            }
        }
        var responseXml = connection._CallActionThroughVaultServer('ApplyAML', fileList, applyAML, vaultUrl, vaultServerId, tnx);
        var retItem = this.newItem();
        retItem.loadAML(responseXml);
        return retItem;
    },
    
    _getUserInfo: function Aras_IOM_Item$_getUserInfo() {
        var connectionBase = this.serverConnection;
        return connectionBase.getUserInfo();
    },
    
    _getVaultServerUrl: function Aras_IOM_Item$_getVaultServerUrl(vaultServerId) {
        var connectionBase = this.serverConnection;
        return connectionBase._getVaultServerUrl(vaultServerId);
    },
    
    _getFileItemsToUpload: function Aras_IOM_Item$_getFileItemsToUpload() {
        return this.getItemsByXPath('descendant-or-self::Item[' + "@type='File' and " + "(@action='add' or @action='create') and " + "actual_filename and Relationships/Item[@type='Located']/related_id]");
    },
    
    _getFilesContainer: function Aras_IOM_Item$_getFilesContainer() {
        var files = this._getFileItemsToUpload();
        var result = {};
        for (var fileIndex = 0; fileIndex < files.getItemCount(); fileIndex++) {
            var fnode = files.getItemByIndex(fileIndex);
            var all_located = fnode.getItemsByXPath("Relationships/Item[@type='Located']");
            if (all_located.getItemCount() > 1) {
                var errorMessage;
                errorMessage = String.format("Ambigious vaults are specified on the file: '{0}'", Aras.IOM.XmlExtension.getXml(fnode.node));
                throw new Error(errorMessage);
            }
            var afpath = fnode.getProperty('actual_filename');
            if (!String.isNullOrEmpty(afpath)) {
                var fpath = afpath;
                var efi = new EasyFileInfo(TopWindowHelper.getMostTopWindowWithAras(window).aras.vault);
                fnode.setProperty('checksum', efi.getFileChecksum(fnode.getID()));
                fnode.setProperty('file_size', efi.getFileSize(fnode.getID()).toString());
                var fid = fnode.getID();
                if (String.isNullOrEmpty(fid)) {
                    var action = fnode.getAttribute('action', '').trim();
                    var errorMessage;
                    if (!String.equals(action, 'add', StringComparison.ordinalIgnoreCase) && !String.equals(action, 'create', StringComparison.ordinalIgnoreCase)) {
                        errorMessage = String.format("File ID is not set in the following AML fragment: '{0}'", Aras.IOM.XmlExtension.getXml(fnode.node));
                        throw new Error(errorMessage);
                    }
                    fid = fnode.getNewID();
                    fnode.setID(fid);
                }
                result[fid] = fpath;
            }
        }
        return result;
    },
    
    _getVaultServerId: function Aras_IOM_Item$_getVaultServerId() {
        var files = this._getFileItemsToUpload();
        var vaultServerId = null;
        for (var fileIndex = 0; fileIndex < files.getItemCount(); fileIndex++) {
            var fnode = files.getItemByIndex(fileIndex);
            var newVaultServerId = Aras.IOM.Item._getVaultServerIdFromFile(fnode);
            if (vaultServerId == null) {
                vaultServerId = newVaultServerId;
            }
            else if (vaultServerId !== newVaultServerId) {
                throw new Error("Only one Vault Server may be specified in 'Located' for all Files are submitted in the same transaction.");
            }
        }
        return vaultServerId;
    },
    
    _isApplyThroughVaultServerRequired: function Aras_IOM_Item$_isApplyThroughVaultServerRequired() {
        var fileNode = this.node.selectSingleNode('descendant-or-self::Item[' + "@type='File' and " + "(@action='add' or @action='create') and " + "actual_filename and Relationships/Item[@type='Located']/related_id]");
        return (fileNode != null);
    },
    
    getAttribute: function Aras_IOM_Item$getAttribute(attributeName, defaultValue) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (Aras.IOM.InternalUtils._hasAttribute(this.node, attributeName)) {
            return Aras.IOM.InternalUtils._getAttribute(this.node, attributeName);
        }
        else {
            return defaultValue;
        }
    },
    
    setAttribute: function Aras_IOM_Item$setAttribute(attributeName, attributeValue) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        this.node.setAttribute(attributeName, attributeValue);
    },
    
    removeAttribute: function Aras_IOM_Item$removeAttribute(attributeName) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (Aras.IOM.InternalUtils._hasAttribute(this.node, attributeName)) {
            this.node.removeAttribute(attributeName);
        }
    },
    
    getAction: function Aras_IOM_Item$getAction() {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        return this.getAttribute('action', '');
    },
    
    setAction: function Aras_IOM_Item$setAction(action) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        this.setAttribute('action', action);
    },
    
    getInnovator: function Aras_IOM_Item$getInnovator() {
        return this._parentInnovator;
    },
    
    getID: function Aras_IOM_Item$getID() {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var retValue = this.getAttribute('id', '');
        if (String.isNullOrEmpty(retValue)) {
            var id_node = this.node.selectSingleNode('id');
            if (id_node != null) {
                var condition = null;
                if (Aras.IOM.InternalUtils._hasAttribute(id_node, 'condition')) {
                    condition = Aras.IOM.InternalUtils._getAttribute(id_node, 'condition');
                }
                if (String.isNullOrEmpty(condition) || String.equals(condition, 'eq', StringComparison.ordinalIgnoreCase)) {
                    retValue = id_node.text.trim();
                }
            }
        }
        return retValue;
    },
    
    setID: function Aras_IOM_Item$setID(id) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        this.setAttribute('id', id);
        var id_node = this.node.selectSingleNode('id');
        if (id_node != null) {
            id_node.text = id;
        }
    },
    
    getType: function Aras_IOM_Item$getType() {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        return this.getAttribute('type', '');
    },
    
    setType: function Aras_IOM_Item$setType(itemTypeName) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        this.setAttribute('type', itemTypeName);
    },
    
    getProperty: function Aras_IOM_Item$getProperty(propertyName, defaultValue, lang) {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var retValue = null;
        var tmpNd = this._getPropertyForLanguage(propertyName, lang);
        if (tmpNd != null) {
            var tmpNd2 = tmpNd.selectSingleNode('Item');
            if (tmpNd2 != null) {
                var tmpItem = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
                tmpItem.dom = this.dom;
                tmpItem.node = tmpNd2;
                retValue = tmpItem.getID();
                if (String.isNullOrEmpty(retValue)) {
                    retValue = defaultValue;
                }
            }
            else {
                retValue = tmpNd.text;
                if (Aras.IOM.InternalUtils._hasAttribute(tmpNd, 'is_null') && String.isNullOrEmpty(retValue) && String.equals(Aras.IOM.InternalUtils._getAttribute(tmpNd, 'is_null'), '1', StringComparison.ordinalIgnoreCase)) {
                    retValue = defaultValue;
                }
            }
        }
        else {
            retValue = defaultValue;
        }
        return retValue;
    },
    
    setProperty: function Aras_IOM_Item$setProperty(propertyName, propertyValue, lang) {
        if (ss.isNullOrUndefined(lang)) {
            lang = null;
        }
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var tmpNd = this._getPropertyForLanguage(propertyName, lang);
        if (tmpNd == null || String.equals(this.node.nodeName, 'or', StringComparison.ordinalIgnoreCase)) {
            tmpNd = this._createElementForLanguage(propertyName, lang);
        }
        if (lang != null) {
            try {
                tmpNd.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:lang', lang);
            }
            catch ($e1) {
                tmpNd.setAttribute('xml:lang', lang);
            }
        }
        if (propertyValue == null) {
            tmpNd.setAttribute('is_null', '1');
            tmpNd.text = '';
        }
        else {
            if (Aras.IOM.InternalUtils._hasAttribute(tmpNd, 'is_null') && String.equals(Aras.IOM.InternalUtils._getAttribute(tmpNd, 'is_null'), '1', StringComparison.ordinalIgnoreCase)) {
                tmpNd.removeAttribute('is_null');
            }
            tmpNd.text = propertyValue;
        }
    },
    
    removeProperty: function Aras_IOM_Item$removeProperty(propertyName, lang) {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var tmpNd = this._getPropertyForLanguage(propertyName, lang);
        if (tmpNd != null) {
            this.node.removeChild(tmpNd);
        }
    },
    
    getPropertyCondition: function Aras_IOM_Item$getPropertyCondition(propertyName, lang) {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        return this.getPropertyAttribute(propertyName, 'condition', lang, null);
    },
    
    setPropertyCondition: function Aras_IOM_Item$setPropertyCondition(propertyName, condition, lang) {
        this.setPropertyAttribute(propertyName, 'condition', condition, lang);
    },
    
    getPropertyAttribute: function Aras_IOM_Item$getPropertyAttribute(propertyName, attributeName, defaultValue, lang) {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var tmpNd = this._getPropertyForLanguage(propertyName, lang);
        if (tmpNd == null) {
            return defaultValue;
        }
        if (Aras.IOM.InternalUtils._hasAttribute(tmpNd, attributeName)) {
            return Aras.IOM.InternalUtils._getAttribute(tmpNd, attributeName);
        }
        else {
            return defaultValue;
        }
    },
    
    setPropertyAttribute: function Aras_IOM_Item$setPropertyAttribute(propertyName, attributeName, attributeValue, lang) {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var tmpNd = this._getPropertyForLanguage(propertyName, lang);
        if (tmpNd == null) {
            tmpNd = this._createElementForLanguage(propertyName, lang);
        }
        tmpNd.setAttribute(attributeName, attributeValue);
        if (lang != null) {
            tmpNd.setAttribute('xml:lang', lang);
        }
    },
    
    removePropertyAttribute: function Aras_IOM_Item$removePropertyAttribute(propertyName, attributeName, lang) {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var tmpNd = this._getPropertyForLanguage(propertyName, lang);
        if (tmpNd != null) {
            tmpNd.removeAttribute(attributeName);
        }
    },
    
    getPropertyItem: function Aras_IOM_Item$getPropertyItem(propertyName) {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        if (propertyName == null) {
            throw new Error('propertyName');
        }
        if (String.equals(propertyName, 'id', StringComparison.ordinalIgnoreCase)) {
            return this;
        }
        else {
            var tmpNd = this.node.selectSingleNode(propertyName);
            if (tmpNd != null) {
                var tmpNd2 = tmpNd.selectSingleNode('Item');
                if (tmpNd2 != null) {
                    var item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
                    item.dom = this.dom;
                    item.node = tmpNd2;
                    return item;
                }
                else {
                    var ptype = Aras.IOM.InternalUtils._getAttribute(tmpNd, 'type');
                    if (!ptype.length) {
                        return null;
                    }
                    var item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
                    item.dom = new XmlDocument();
                    Aras.IOM.InternalUtils.loadXmlFromString(item.dom, String.format("<Item type='{0}' id='{1}'><id>{1}</id></Item>", ptype, tmpNd.text));
                    item.node = item.dom.selectSingleNode('Item');
                    return item;
                }
            }
            return null;
        }
    },
    
    setPropertyItem: function Aras_IOM_Item$setPropertyItem(propertyName, item) {
        this._appendOrReplaceItemNode(propertyName, item, true);
        return item;
    },
    
    setFileProperty: function Aras_IOM_Item$setFileProperty(propertyName, pathToFile) {
        if (String.isNullOrEmpty(propertyName)) {
            throw new Error('propertyName');
        }
        var fileItem = this.newItem('File', 'add');
        fileItem.attachPhysicalFile(pathToFile);
        fileItem.setProperty("filename", pathToFile.name, null);
        this.setPropertyItem(propertyName, fileItem);
        return fileItem;
        return null;
    },
    
    fetchFileProperty: function Aras_IOM_Item$fetchFileProperty(propertyName, targetPath, mode) {
        if (String.isNullOrEmpty(propertyName)) {
            throw new Error('propertyName');
        }
        if (String.isNullOrEmpty(targetPath)) {
            throw new Error('targetPath');
        }
        var file = this.getPropertyItem(propertyName);
        if (file != null) {
            switch (mode) {
                case 0:
                    file = file._checkoutInternal(targetPath, null, 1);
                    break;
                case 1:
                    file._getCheckedoutPath(targetPath, 1);
                    break;
                default:
                    throw new Error('Agrument "mode" is not a part of FetchFileMode enumeration.');
            }
        }
        return file;
    },
    
    fetchDefaultPropertyValues: function Aras_IOM_Item$fetchDefaultPropertyValues(overwrite_current) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var type = this._getTypeInternal();
        var request = Aras.IOM.Item._createItem(this.serverConnection, null, null, 'full');
        var aml = "<Item type='ItemType' action='get' select='id'>" + ' <name>' + type + '</name>' + ' <Relationships>' + "  <Item type='Property' action='get' select='name,default_value' />" + ' </Relationships>' + '</Item>';
        request.loadAML(aml);
        var response = request.apply(null, null);
        if (response.isError()) {
            return response;
        }
        var props = response.dom.selectNodes("//Item[@type='ItemType']/Relationships/Item[@type='Property']");
        var $enum1 = ss.IEnumerator.getEnumerator(props);
        while ($enum1.moveNext()) {
            var prop = $enum1.current;
            var pname = prop.selectSingleNode('name').text;
            var dvalnode = prop.selectSingleNode('default_value');
            var dval = (dvalnode == null) ? '' : dvalnode.text;
            if (dval.length > 0 && (overwrite_current || (!overwrite_current && this.getProperty(pname, null, null) == null))) {
                this.setProperty(pname, dval, null);
            }
        }
        return this;
    },
    
    getErrorDetail: function Aras_IOM_Item$getErrorDetail() {
        return this._getErrorDetail('detail');
    },
    
    setErrorDetail: function Aras_IOM_Item$setErrorDetail(detail) {
        this._setErrorDetail('detail', detail);
    },
    
    getErrorString: function Aras_IOM_Item$getErrorString() {
        return this._getErrorDetail('faultstring');
    },
    
    setErrorString: function Aras_IOM_Item$setErrorString(errorMessage) {
        this._setErrorDetail('faultstring', errorMessage);
    },
    
    getErrorWho: function Aras_IOM_Item$getErrorWho() {
        return this.getErrorCode();
    },
    
    getErrorCode: function Aras_IOM_Item$getErrorCode() {
        return this._getErrorDetail('faultcode');
    },
    
    getFileName: function Aras_IOM_Item$getFileName() {
        this._checkThatTypeOfItemIsFile();
        return this.getProperty('filename', '', null);
    },
    
    setErrorWho: function Aras_IOM_Item$setErrorWho(who) {
        this.setErrorCode(who);
    },
    
    setErrorCode: function Aras_IOM_Item$setErrorCode(errcode) {
        this._setErrorDetail('faultcode', errcode);
    },
    
    setFileName: function Aras_IOM_Item$setFileName(filePath) {
        this.attachPhysicalFile(filePath);
        this.setProperty("filename", filePath.name, null);
    },
    
    getErrorSource: function Aras_IOM_Item$getErrorSource() {
        return this._getErrorDetail('faultactor');
    },
    
    setErrorSource: function Aras_IOM_Item$setErrorSource(source) {
        this._setErrorDetail('faultactor', source);
    },
    
    _getErrorDetail: function Aras_IOM_Item$_getErrorDetail(errorDetailTagName) {
        var ret = '';
        if (this.dom != null) {
            var f = this.dom.selectSingleNode(Aras.IOM.Item.xPathFault + '/' + errorDetailTagName);
            if (f != null) {
                ret = f.text;
            }
        }
        return ret;
    },
    
    _setErrorDetail: function Aras_IOM_Item$_setErrorDetail(errorDetailTagName, errorDetailValue) {
        if (this.dom == null) {
            return;
        }
        var fnode = this.dom.selectSingleNode(Aras.IOM.Item.xPathFault);
        if (fnode != null) {
            var fanode = fnode.selectSingleNode(errorDetailTagName);
            if (fanode == null) {
                fanode = fnode.appendChild(this.dom.createElement(errorDetailTagName));
            }
            fanode.text = errorDetailValue;
        }
    },
    
    getResult: function Aras_IOM_Item$getResult() {
        var ret = '';
        if (this.dom != null) {
            var res = this.dom.selectSingleNode(Aras.IOM.Item.xPathResult);
            if (res != null) {
                ret = res.text;
            }
        }
        return ret;
    },
    
    email: function Aras_IOM_Item$email(emailItem, identityItem) {
        if (emailItem == null) {
            throw new Error('emailItem');
        }
        if (identityItem == null) {
            throw new Error('identityItem');
        }
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var inDom = this.newXMLDocument();
        var outDom = this.newXMLDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, Aras.IOM.XmlExtension.getXml(this.node));
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty />');
        var tempNode = inDom.selectSingleNode('//Item');
        tempNode.setAttribute('action', 'EmailItem');
        var identityNode = tempNode.appendChild(inDom.createElement('___aras_email_identity_name___'));
        identityNode.text = identityItem.getProperty('name');
        var emailNode = tempNode.appendChild(inDom.createElement('___aras_email_item___'));
        emailNode.appendChild(emailItem.node.cloneNode(true));
        this.serverConnection.CallAction('ApplyItem', inDom, outDom);
        if (outDom.selectSingleNode(Aras.IOM.Item.xPathFault + '/faultcode') != null) {
            return false;
        }
        else {
            return true;
        }
    },
    
    isNew: function Aras_IOM_Item$isNew() {
        if (!this._checkInternalStructure(4)) {
            return false;
        }
        return String.equals(this.getAttribute('isNew', ''), '1', StringComparison.ordinalIgnoreCase);
    },
    
    isRoot: function Aras_IOM_Item$isRoot() {
        if (!this._checkInternalStructure(4)) {
            return false;
        }
        var parents = this.node.selectNodes("ancestor::node()[local-name()='Item']");
        if (parents.length > 0) {
            return false;
        }
        var siblings = this.node.parentNode.selectNodes('Item');
        if (siblings.length > 1) {
            return false;
        }
        return true;
    },
    
    isCollection: function Aras_IOM_Item$isCollection() {
        if (this.isError()) {
            return false;
        }
        return (this.nodeList != null && this.node == null);
    },
    
    isLocked: function Aras_IOM_Item$isLocked() {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (this.isNew()) {
            return 0;
        }
        var locked_by_id = '';
        if (!this._hasProperty('locked_by_id')) {
            var copyOfItem = this.newItem(this.getType(), 'get');
            copyOfItem.setAttribute('select', 'locked_by_id');
            copyOfItem.setID(this.getID());
            copyOfItem = copyOfItem.apply(null, null);
            if (copyOfItem.isError()) {
                throw new Error('Server returns fault in internal query');
            }
            if (!copyOfItem._checkInternalStructure(4)) {
                throw new Error('Not a single item');
            }
            locked_by_id = copyOfItem.getProperty('locked_by_id', '', null);
        }
        else {
            locked_by_id = this.getProperty('locked_by_id', '', null);
        }
        if (String.isNullOrEmpty(locked_by_id)) {
            return 0;
        }
        else if (String.equals(locked_by_id, this.serverConnection.getUserID(), StringComparison.ordinalIgnoreCase)) {
            return 1;
        }
        else {
            return 2;
        }
    },
    
    fetchLockStatus: function Aras_IOM_Item$fetchLockStatus() {
        var id = this._getIdInternal();
        var type = this._getTypeInternal();
        var request = this.newItem(type, 'get');
        request.setAttribute('select', 'locked_by_id');
        request.setID(id);
        var response = request.apply();
        if (response.isError()) {
            return -1;
        }
        var lockedById = response.getProperty('locked_by_id', '');
        this.setProperty('locked_by_id', lockedById);
        if (String.isNullOrEmpty(lockedById)) {
            return 0;
        }
        else if (lockedById === this.serverConnection.getUserID()) {
            return 1;
        }
        else {
            return 2;
        }
    },
    
    getLockStatus: function Aras_IOM_Item$getLockStatus() {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (this.isNew()) {
            return 0;
        }
        var lockedById = this.getProperty('locked_by_id', '', null);
        if (!lockedById.length) {
            return 0;
        }
        else if (lockedById === this.serverConnection.getUserID()) {
            return 1;
        }
        else {
            return 2;
        }
    },
    
    isError: function Aras_IOM_Item$isError() {
        return (this.dom != null && this.dom.selectSingleNode(Aras.IOM.Item.xPathFault) != null);
    },
    
    isEmpty: function Aras_IOM_Item$isEmpty() {
        if (this.isError()) {
            return String.equals(this.getErrorCode(), '0', StringComparison.ordinalIgnoreCase);
        }
        else {
            return false;
        }
    },
    
    appendItem: function Aras_IOM_Item$appendItem(item) {
        if (item == null) {
            throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
        }
        var nlist_nodes;
        if (this.node != null) {
            if (!this._checkInternalStructure(4 | 1)) {
                throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
            }
            if (item.node != null) {
                if (!item._checkInternalStructure(4)) {
                    throw new Error('The argument passed to the method is not a single item');
                }
                nlist_nodes = this._moveNodeToList();
                nlist_nodes.add(this._appendItemNode(item.node));
            }
            else if (item.nodeList != null) {
                if (!item._checkInternalStructure(8)) {
                    throw new Error("Not all elements of the passed item's nodeList are &lt;Item&gt; nodes");
                }
                nlist_nodes = this._moveNodeToList();
                var $enum1 = ss.IEnumerator.getEnumerator(item.nodeList);
                while ($enum1.moveNext()) {
                    var node = $enum1.current;
                    nlist_nodes.add(this._appendItemNode(node));
                }
            }
            else {
                throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, 'passed item'));
            }
        }
        else if (this.nodeList != null) {
            if (!this._checkInternalStructure(8 | 2)) {
                throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
            }
            if (!this._checkInternalStructure(16)) {
                throw new Error("Not all nodes of 'this.nodeList' are siblings");
            }
            nlist_nodes = [];
            this._fillNodeListArray(nlist_nodes);
            if (item.node != null) {
                if (!item._checkInternalStructure(4)) {
                    throw new Error('The argument passed to the method is not a single item');
                }
                nlist_nodes.add(this._appendItemNode(item.node));
            }
            else if (item.nodeList != null) {
                if (!item._checkInternalStructure(8)) {
                    throw new Error("Not all elements of the passed item's nodeList are &lt;Item&gt; nodes");
                }
                var $enum2 = ss.IEnumerator.getEnumerator(item.nodeList);
                while ($enum2.moveNext()) {
                    var node = $enum2.current;
                    nlist_nodes.add(this._appendItemNode(node));
                }
            }
            else {
                throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, 'passed item'));
            }
        }
        else {
            throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
        }
        var restoreXPath = '';
        var $enum3 = ss.IEnumerator.getEnumerator(nlist_nodes);
        while ($enum3.moveNext()) {
            var nlelem = $enum3.current;
            if (String.isNullOrEmpty(restoreXPath)) {
                restoreXPath = Aras.IOM.Item._buildItemXPath(nlelem, true);
                restoreXPath = String.format('{0}/*[position()={1}', restoreXPath, Aras.IOM.Item._findXmlElementPosition(nlelem));
            }
            else {
                restoreXPath = String.format('{0} or position()={1}', restoreXPath, Aras.IOM.Item._findXmlElementPosition(nlelem));
            }
        }
        restoreXPath += ']';
        this.nodeList = this.dom.selectNodes(restoreXPath);
    },
    
    removeItem: function Aras_IOM_Item$removeItem(item) {
        if (!this._checkInternalStructure(2 | 8)) {
            throw new Error('Not a collection of items');
        }
        if (item == null) {
            throw new Error('item');
        }
        if (this.dom !== item.dom) {
            throw new Error(String.format("{0} and {1} must reference the same ArasXmlDocument through their 'dom' property", "'this' item", 'item passed to the method'));
        }
        var removalList = [];
        if (item._checkInternalStructure(4)) {
            var nlist = item.node.selectNodes('descendant-or-self::Item');
            var $enum1 = ss.IEnumerator.getEnumerator(nlist);
            while ($enum1.moveNext()) {
                var ntd = $enum1.current;
                removalList.add(ntd);
            }
        }
        else if (item._checkInternalStructure(8)) {
            var $enum2 = ss.IEnumerator.getEnumerator(item.nodeList);
            while ($enum2.moveNext()) {
                var n = $enum2.current;
                var nlist = n.selectNodes('descendant-or-self::Item');
                var $enum3 = ss.IEnumerator.getEnumerator(nlist);
                while ($enum3.moveNext()) {
                    var sn = $enum3.current;
                    if (!removalList.contains(sn)) {
                        removalList.add(sn);
                    }
                }
            }
        }
        else {
            throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, 'item passed to the method'));
        }
        for (var i = 0; i < removalList.length; i++) {
            var ntd = removalList[i];
            if (this.node != null && ntd === this.node) {
                this.node = null;
                break;
            }
        }
        var restoreXPath = '';
        var $enum4 = ss.IEnumerator.getEnumerator(this.nodeList);
        while ($enum4.moveNext()) {
            var nlelem = $enum4.current;
            if (!removalList.contains(nlelem)) {
                if (String.isNullOrEmpty(restoreXPath)) {
                    restoreXPath = Aras.IOM.Item._buildItemXPath(nlelem, true);
                    restoreXPath = String.format('{0}/*[position()={1}', restoreXPath, Aras.IOM.Item._findXmlElementPosition(nlelem));
                }
                else {
                    restoreXPath = String.format('{0} or position()={1}', restoreXPath, Aras.IOM.Item._findXmlElementPosition(nlelem));
                }
            }
        }
        restoreXPath += ']';
        if (restoreXPath.length > 0) {
            var restoredList = this.dom.selectNodes(restoreXPath);
            if (restoredList.length === 1) {
                this.node = restoredList[0];
                this.nodeList = null;
            }
            else {
                this.nodeList = restoredList;
                var _ms_bug_workaround = this.nodeList.length;
            }
        }
        else {
            this.nodeList = null;
        }
        for (var i = 0; i < removalList.length; i++) {
            var ntd = removalList[i];
            ntd.parentNode.removeChild(ntd);
        }
    },
    
    getItemsByXPath: function Aras_IOM_Item$getItemsByXPath(xpath) {
        if (this.dom == null) {
            throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
        }
        var nodes;
        if (this.node != null) {
            nodes = this.node.selectNodes(xpath);
        }
        else {
            nodes = this.dom.selectNodes(xpath);
        }
        var item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        item.dom = this.dom;
        var isItem = true;
        if (nodes.length === 1) {
            item.node = nodes[0];
            if (!item._checkInternalStructure(4)) {
                isItem = false;
            }
        }
        else {
            item.nodeList = nodes;
            if (item.nodeList.length > 0 && !item._checkInternalStructure(8)) {
                isItem = false;
            }
        }
        if (!isItem) {
            throw new Error(String.format("Specified XPath '{0}' doesn't resolve to &lt;Item&gt; nodes", xpath));
        }
        return item;
    },
    
    getItemCount: function Aras_IOM_Item$getItemCount() {
        if (this.dom == null) {
            return -1;
        }
        if (this.nodeList != null) {
            return this.nodeList.length;
        }
        if (this.isError()) {
            if (this.getErrorCode() === '0') {
                return 0;
            }
            else {
                return -1;
            }
        }
        else if (this.node == null) {
            return -1;
        }
        else {
            return 1;
        }
    },
    
    getItemByIndex: function Aras_IOM_Item$getItemByIndex(index) {
        if (this.nodeList == null) {
            if (!!index) {
                throw new Error('Item is not a collection');
            }
            else {
                return this;
            }
        }
        else {
            if (index > this.nodeList.length - 1 || index < 0) {
                throw new Error('IndexOutOfRangeException');
            }
            var item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
            item.dom = this.dom;
            item.node = this.nodeList[index];
            return item;
        }
    },
    
    lockItem: function Aras_IOM_Item$lockItem() {
        var id = this._getIdInternal();
        var type = this._getTypeInternal();
        var req = this.newItem(type, 'lock');
        req.setID(id);
        var response = req.apply();
        if (!response.isError()) {
            this.setProperty('locked_by_id', response.getProperty('locked_by_id', ''));
        }
        return response;
    },
    
    unlockItem: function Aras_IOM_Item$unlockItem() {
        var id = this._getIdInternal();
        var type = this._getTypeInternal();
        var req = this.newItem(type, 'unlock');
        req.setID(id);
        var response = req.apply();
        if (!response.isError()) {
            this.removeProperty('locked_by_id');
        }
        return response;
    },
    
    fetchRelationships: function Aras_IOM_Item$fetchRelationships(relationshipTypeName, selectList, orderBy) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var id = this.getID();
        if (String.isNullOrEmpty(id)) {
            throw new Error('ID is not set');
        }
        if (relationshipTypeName == null || !relationshipTypeName.trim().length) {
            throw new Error('Relationship type is not specified');
        }
        var reqAml = "<Item type='" + relationshipTypeName + "' action='get'><source_id>" + id + '</source_id></Item>';
        var request = this.newItem(null, null);
        request.loadAML(reqAml);
        if (selectList != null && selectList.trim().length > 0) {
            request.setAttribute('select', selectList);
        }
        if (orderBy != null && orderBy.trim().length > 0) {
            request.setAttribute('order_by', orderBy);
        }
        var response = request.apply();
        if (response.isError()) {
            if (response.getErrorCode() !== '0') {
                return response;
            }
        }
        else {
            var existingRels = this.node.selectNodes("Relationships/Item[@type='" + relationshipTypeName + "']");
            if (existingRels != null) {
                var $enum1 = ss.IEnumerator.getEnumerator(existingRels);
                while ($enum1.moveNext()) {
                    var erel = $enum1.current;
                    if (this.nodeList == null) {
                        erel.parentNode.removeChild(erel);
                    }
                    else {
                        var tmp = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
                        tmp.dom = this.dom;
                        tmp.node = erel;
                        this.removeItem(tmp);
                    }
                }
            }
            if (!response.isCollection()) {
                this.addRelationship(response);
            }
            else {
                for (var i = 0; i < response.getItemCount(); i++) {
                    this.addRelationship(response.getItemByIndex(i));
                }
            }
        }
        return this;
    },
    
    getRelatedItem: function Aras_IOM_Item$getRelatedItem() {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var tmpNd = this.node.selectSingleNode('related_id');
        if (tmpNd != null) {
            var item;
            var tmpNd2 = tmpNd.selectSingleNode('Item');
            if (tmpNd2 != null) {
                item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
                item.dom = this.dom;
                item.node = tmpNd2;
            }
            else {
                var rtype = Aras.IOM.InternalUtils._getAttribute(tmpNd, 'type');
                if (!rtype.length) {
                    return null;
                }
                item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
                item.dom = new XmlDocument();
                Aras.IOM.InternalUtils.loadXmlFromString(item.dom, String.format("<Item type='{0}' id='{1}'><id>{1}</id></Item>", rtype, tmpNd.text));
                item.node = item.dom.selectSingleNode('Item');
            }
            return item;
        }
        else {
            return null;
        }
    },
    
    setRelatedItem: function Aras_IOM_Item$setRelatedItem(ritem) {
        this._appendOrReplaceItemNode('related_id', ritem, false);
    },
    
    addRelationship: function Aras_IOM_Item$addRelationship(item) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (item == null) {
            throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
        }
        if (!item._checkInternalStructure(4)) {
            throw new Error('The argument passed to the method is not a single item');
        }
        var rels = this.node.selectSingleNode('Relationships');
        if (rels == null) {
            rels = this.node.appendChild(this.dom.createElement('Relationships'));
        }
        item.node = rels.appendChild(item.node.cloneNode(true));
        item.dom = this.dom;
    },
    
    getRelationships: function Aras_IOM_Item$getRelationships(itemTypeName) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var rels = null;
        if (itemTypeName == null) {
            rels = this.node.selectNodes('Relationships/Item');
        }
        else {
            rels = this.node.selectNodes("Relationships/Item[@type='" + itemTypeName + "']");
        }
        var item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        item.dom = this.dom;
        item.node = null;
        item.nodeList = rels;
        return item;
    },
    
    removeRelationship: function Aras_IOM_Item$removeRelationship(item) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (item == null) {
            throw new Error('item');
        }
        if (!item._checkInternalStructure(4)) {
            throw new Error('The argument passed to the method is not a single item');
        }
        if (this.dom !== item.dom) {
            throw new Error(String.format("{0} and {1} must reference the same ArasXmlDocument through their 'dom' property", "'this' item", 'item passed to the method'));
        }
        var parentNode = item.node.parentNode;
        if (String.equals(parentNode.nodeName, 'Relationships', StringComparison.ordinalIgnoreCase)) {
            if (this.nodeList == null) {
                parentNode.removeChild(item.node);
            }
            else {
                this.removeItem(item);
            }
        }
        else {
            throw new Error('The item pased to the method is not a relationship item.');
        }
    },
    
    getRelatedItemID: function Aras_IOM_Item$getRelatedItemID() {
        var retValue = '';
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var tmpNd = this.node.selectSingleNode('related_id');
        if (tmpNd != null) {
            var tmpNd2 = tmpNd.selectSingleNode('Item');
            if (tmpNd2 != null) {
                retValue = Aras.IOM.InternalUtils._getAttribute(tmpNd2, 'id');
                if (String.isNullOrEmpty(retValue)) {
                    tmpNd2 = tmpNd2.selectSingleNode('id');
                    if (tmpNd2 != null) {
                        retValue = tmpNd2.text;
                    }
                }
                return retValue;
            }
            else {
                retValue = tmpNd.text;
            }
        }
        return retValue;
    },
    
    getParentItem: function Aras_IOM_Item$getParentItem() {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        var pnode = this.node.selectSingleNode('ancestor::Item');
        if (pnode == null) {
            return null;
        }
        var ritem = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        ritem.dom = this.dom;
        ritem.node = pnode;
        return ritem;
    },
    
    isLogical: function Aras_IOM_Item$isLogical() {
        return this._checkInternalStructure(32);
    },
    
    newAND: function Aras_IOM_Item$newAND() {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var retItem = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        retItem.dom = this.dom;
        retItem.node = this.node.appendChild(this.dom.createElement('and'));
        return retItem;
    },
    
    newOR: function Aras_IOM_Item$newOR() {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var retItem = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        retItem.dom = this.dom;
        retItem.node = this.node.appendChild(this.dom.createElement('or'));
        return retItem;
    },
    
    newNOT: function Aras_IOM_Item$newNOT() {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var retItem = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        retItem.dom = this.dom;
        retItem.node = this.node.appendChild(this.dom.createElement('not'));
        return retItem;
    },
    
    removeLogical: function Aras_IOM_Item$removeLogical(logicalItem) {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        if (logicalItem == null) {
            throw new Error('logicalItem');
        }
        if (!logicalItem._checkInternalStructure(32)) {
            throw new Error('Passed item is not a logical item');
        }
        this.node.removeChild(logicalItem.node);
    },
    
    promote: function Aras_IOM_Item$promote(state, comments) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (state == null || !state.trim().length) {
            throw new Error("'state' is either 'null' or an empty string");
        }
        var tmpItem = this.newItem(null, null);
        tmpItem.loadAML(Aras.IOM.XmlExtension.getXml(this.node));
        tmpItem.setProperty('state', state, null);
        if (comments != null && comments.trim().length > 0) {
            tmpItem.setProperty('comments', comments, null);
        }
        return tmpItem.apply('promoteItem');
    },
    
    _moveNodeToList: function Aras_IOM_Item$_moveNodeToList() {
        var nlist_nodes = [];
        var pnode = this.node.parentNode;
        if (Aras.IOM.InternalUtils._getNodeType(pnode) === 9) {
            if (this.nodeList != null && (this.nodeList.length > 1 || this.nodeList.length === 1 && this.nodeList[0] !== this.node)) {
                throw new Error("'this.node' is not sibling to items in 'this.nodeList'");
            }
            Aras.IOM.InternalUtils.loadXmlFromString(this.dom, String.format('<AML>{0}</AML>', Aras.IOM.XmlExtension.getXml(this.dom)));
            this.nodeList = this.dom.selectNodes('/AML/Item');
            this.node = null;
            this._fillNodeListArray(nlist_nodes);
        }
        else {
            if (this.nodeList != null) {
                var $enum1 = ss.IEnumerator.getEnumerator(this.nodeList);
                while ($enum1.moveNext()) {
                    var node = $enum1.current;
                    if (node.nodeName !== 'Item') {
                        throw new Error(String.format("The following element of 'this.nodeList' is not an 'Item': {0}", Aras.IOM.XmlExtension.getXml(node)));
                    }
                    if (node.parentNode !== pnode) {
                        throw new Error("'this.node' is not sibling to items in 'this.nodeList'");
                    }
                }
                this._fillNodeListArray(nlist_nodes);
                this.node = null;
            }
            else {
                var nodeXPath = Aras.IOM.Item._buildItemXPath(this.node, false);
                this.nodeList = this.dom.selectNodes(nodeXPath);
                this.node = null;
                this._fillNodeListArray(nlist_nodes);
            }
        }
        return nlist_nodes;
    },
    
    _fillNodeListArray: function Aras_IOM_Item$_fillNodeListArray(array) {
        if (this.node != null) {
            array.add(this.node);
        }
        if (this.nodeList != null) {
            var $enum1 = ss.IEnumerator.getEnumerator(this.nodeList);
            while ($enum1.moveNext()) {
                var node = $enum1.current;
                array.add(node);
            }
        }
    },
    
    _appendItemNode: function Aras_IOM_Item$_appendItemNode(inode) {
        var parent = this.nodeList[0].parentNode;
        return parent.appendChild(inode.cloneNode(true));
    },
    
    checkout: function Aras_IOM_Item$checkout(dir) {
        return this._checkoutInternal(dir, null, 0);
    },
    
    _getCheckedoutPath: function Aras_IOM_Item$_getCheckedoutPath(targetPath, pathType) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        this._checkThatTypeOfItemIsFile();
        this._getIdInternal();
        if (this.isNew()) {
            throw new Error("The file was never stored on server ('isNew=1')");
        }
        var fname = this.getProperty('filename');
        if (String.isNullOrEmpty(fname)) {
            var request = this.newItem('File', 'get');
            request.setID(this.getID());
            request.setAttribute('select', 'filename');
            var response = request.apply();
            if (response.isError()) {
                throw new Error(response.getErrorString());
            }
            fname = response.getProperty('filename');
            this.setProperty('filename', fname, null);
        }
        var isDirectoryPath = (!pathType) || String.isNullOrEmpty(Path.getFileName(targetPath));
        if (isDirectoryPath) {
            var checkedoutPath = Path.combinePath(targetPath, fname);
            this.setProperty('checkedout_path', checkedoutPath, null);
            return checkedoutPath;
        }
        else {
            this.setProperty('checkedout_path', targetPath, null);
            return targetPath;
        }
    },
    
    _checkoutInternal: function Aras_IOM_Item$_checkoutInternal(dir, tnx, pathType) {
        var checkedout_path = this._getCheckedoutPath(dir, pathType);
        var tmpConnection = Type.safeCast(this.serverConnection, Aras.IOM.ServerConnectionBase);
        if (tmpConnection != null) {
            tmpConnection._downloadFileInternal(this, checkedout_path, true, tnx);
        }
        else {
            this.serverConnection.DownloadFile(this, checkedout_path, true);
        }
        return this;
    },
    
    setNewID: function Aras_IOM_Item$setNewID() {
        this.setID(this.getNewID());
    },
    
    getNewID: function Aras_IOM_Item$getNewID() {
        return Aras.IOM.Innovator._generateGuid();
    },
    
    _parentInnovator: null,
    
    _appendOrReplaceItemNode: function Aras_IOM_Item$_appendOrReplaceItemNode(pname, ritem, check_for_logical) {
        if (!this._checkInternalStructure(4) && (check_for_logical && !this._checkInternalStructure(32))) {
            throw new Error('Not a single item');
        }
        if (!this._checkInternalStructure(1)) {
            throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
        }
        if (!ritem._checkInternalStructure(4)) {
            throw new Error('The argument passed to the method is not a single item');
        }
        var rel = this.node.selectSingleNode(pname);
        if (rel == null) {
            rel = this.node.appendChild(this.dom.createElement(pname));
        }
        var relItem = rel.selectSingleNode('Item');
        if (relItem != null) {
            ritem.node = ritem.node.cloneNode(true);
            rel.replaceChild(ritem.node, relItem);
        }
        else {
            rel.text = '';
            ritem.node = rel.appendChild(ritem.node.cloneNode(true));
        }
        ritem.dom = this.dom;
    },
    
    _createElementForLanguage: function Aras_IOM_Item$_createElementForLanguage(pname, lang) {
        var tmp;
        if (lang != null) {
            var i18NSessionContext = this._parentInnovator.getI18NSessionContext();
            if (i18NSessionContext != null && lang !== i18NSessionContext.GetLanguageCode()) {
                tmp = this.dom.createNode(1, 'i18n' + ':' + pname, 'http://www.aras.com/I18N');
            }
            else {
                tmp = this.dom.createElement(pname);
            }
        }
        else {
            tmp = this.dom.createElement(pname);
        }
        var res = this.node.appendChild(tmp);
        return res;
    },
    
    _getPropertyForLanguage: function Aras_IOM_Item$_getPropertyForLanguage(pname, lang) {
        var xpath;
        xpath = String.format('./{0}', pname);
        if (lang != null) {
            var i18NSessionContext = this._parentInnovator.getI18NSessionContext();
            if (i18NSessionContext != null) {
                xpath = String.format((i18NSessionContext.GetLanguageCode() === lang) ? "./*[local-name()='{0}' and (namespace-uri()='{1}' or name()='{0}') and @xml:lang='{2}']" : "./*[local-name()='{0}' and namespace-uri()='{1}' and @xml:lang='{2}']", pname, 'http://www.aras.com/I18N', lang);
            }
        }
        var res;
        res = this.node.selectSingleNode(xpath);
        return res;
    },
    
    _hasProperty: function Aras_IOM_Item$_hasProperty(propertyName) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (String.equals(propertyName, 'id', StringComparison.ordinalIgnoreCase)) {
            return true;
        }
        return (this.node.selectSingleNode(propertyName) != null);
    },
    
    getLogicalChildren: function Aras_IOM_Item$getLogicalChildren() {
        if (!this._checkInternalStructure(4) && !this._checkInternalStructure(32)) {
            throw new Error('Not a single item');
        }
        var retItem = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        retItem.dom = this.dom;
        retItem.node = null;
        retItem.nodeList = this.node.selectNodes("./*[local-name()='and' or local-name()='or' or local-name()='not']");
        return retItem;
    },
    
    instantiateWorkflow: function Aras_IOM_Item$instantiateWorkflow(workflowMapID) {
        if (workflowMapID == null || !workflowMapID.trim().length) {
            throw new Error(Aras.IOM.Item._instantiateWorkflowMessage);
        }
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (this.isNew()) {
            throw new Error(Aras.IOM.Item._theItemIsANewItemErrorMessage);
        }
        var id = this._getIdInternal();
        var request = this.newItem(this.getType(), null);
        request.setAction(Aras.IOM.Item._instantiateWorkflowAction);
        request.setID(id);
        request.setProperty('WorkflowMap', workflowMapID, null);
        var response = request.apply(Aras.IOM.Item._instantiateWorkflowAction);
        if (response.isError()) {
            return response;
        }
        var wfproc = response;
        request = this.newItem('Workflow', 'add');
        request.setProperty('locked_by_id', this.serverConnection.getUserID(), null);
        request.setProperty('source_id', id, null);
        request.setProperty('related_id', wfproc.getID(), null);
        request.setProperty('source_type', this.getAttribute('typeId'), null);
        response = request.apply();
        return (response.isError()) ? response : wfproc;
    },
    
    toString: function Aras_IOM_Item$toString() {
        return Aras.IOM.XmlExtension.getXml(this.dom);
    },
    
    _thisMethodImplementation: null,
    
    setThisMethodImplementation: function Aras_IOM_Item$setThisMethodImplementation(thisMethodImplemenation) {
        this._thisMethodImplementation = thisMethodImplemenation;
    },
    
    thisMethod: function Aras_IOM_Item$thisMethod(inDom, inArgs) {
        if (this._thisMethodImplementation == null) {
            return null;
        }
        return this._thisMethodImplementation.call(this, inDom, inArgs);
    },
    
    createRelationship: function Aras_IOM_Item$createRelationship(type, action) {
        return this._createInnerItem('Relationships', type, action, false);
    },
    
    createPropertyItem: function Aras_IOM_Item$createPropertyItem(propName, type, action) {
        return this._createInnerItem(propName, type, action, true);
    },
    
    createRelatedItem: function Aras_IOM_Item$createRelatedItem(type, action) {
        return this._createInnerItem('related_id', type, action, true);
    },
    
    _createInnerItem: function Aras_IOM_Item$_createInnerItem(nodeName, type, action, doChildReplace) {
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        if (!this._checkInternalStructure(1)) {
            throw new Error(String.format(Aras.IOM.Item._wrongItemStructureException, "'this' item"));
        }
        var rels = this.node.selectSingleNode(nodeName) || this.node.appendChild(this.dom.createElement(nodeName));
        var relItem;
        if (doChildReplace) {
            relItem = rels.selectSingleNode('Item');
            if (relItem != null) {
                rels.removeChild(relItem);
            }
        }
        relItem = rels.appendChild(this.dom.createElement('Item'));
        relItem.setAttribute('isNew', '1');
        relItem.setAttribute('isTemp', '1');
        relItem.setAttribute('type', type);
        relItem.setAttribute('action', action);
        var item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
        item.dom = this.dom;
        item.node = relItem;
        return item;
    },
    
    _getDefaultVaultId: function Aras_IOM_Item$_getDefaultVaultId() {
        var userInfo = this._getUserInfo();
        if (userInfo.isError()) {
            throw new Error(userInfo.getErrorDetail());
        }
        return userInfo.getProperty('default_vault');
    },
    
    attachPhysicalFile: function Aras_IOM_Item$attachPhysicalFile(filePath, vaultServerId) {
        this._attachPhysicalFileInternal(filePath, vaultServerId);
    },
    
    _attachPhysicalFileInternal: function Aras_IOM_Item$_attachPhysicalFileInternal(filePath, vaultServerId) {
        if (ss.isNullOrUndefined(vaultServerId)) {
            vaultServerId = this._getDefaultVaultId();
        }
        if (!this._checkInternalStructure(4)) {
            throw new Error('Not a single item');
        }
        this._checkThatTypeOfItemIsFile();
        this._getIdInternal();
        if (vaultServerId == null || !vaultServerId.trim().length) {
            throw new Error('Specified vault ID is not valid');
        }
        aras.vault.addFileToList(this.getID(), arguments[0]);
        this.setProperty("actual_filename", arguments[0].name, null);
        var thisNode = this.node;
        var relships = thisNode.selectSingleNode('Relationships');
        if (relships == null) {
            relships = thisNode.appendChild(this.dom.createElement('Relationships'));
        }
        else {
            var otherLocated = relships.selectNodes("Item[@type='Located' and related_id!='" + vaultServerId + "']");
            if (otherLocated != null) {
                var $enum1 = ss.IEnumerator.getEnumerator(otherLocated);
                while ($enum1.moveNext()) {
                    var l = $enum1.current;
                    relships.removeChild(l);
                }
            }
        }
        var locatedRelship = relships.selectSingleNode("Item[@type='Located' and related_id='" + vaultServerId + "']");
        if (locatedRelship == null) {
            locatedRelship = relships.appendChild(this.dom.createElement('Item'));
            locatedRelship.setAttribute('type', 'Located');
        }
        else {
            var fv = locatedRelship.selectSingleNode('file_version');
            if (fv != null) {
                locatedRelship.removeChild(fv);
            }
        }
        if (!Aras.IOM.InternalUtils._getAttribute(locatedRelship, 'action').length) {
            if (Aras.IOM.InternalUtils._getAttribute(thisNode, 'action') === 'add') {
                locatedRelship.setAttribute('action', 'add');
            }
            else {
                locatedRelship.setAttribute('action', 'merge');
            }
        }
        if (!Aras.IOM.InternalUtils._getAttribute(locatedRelship, 'id').length && !Aras.IOM.InternalUtils._getAttribute(locatedRelship, 'where').length) {
            locatedRelship.setAttribute('where', "related_id='" + vaultServerId + "'");
        }
        var relatedVault = locatedRelship.appendChild(this.dom.createElement('related_id'));
        relatedVault.text = vaultServerId;
    },
    
    _checkThatTypeOfItemIsFile: function Aras_IOM_Item$_checkThatTypeOfItemIsFile() {
        var type = this._getTypeInternal();
        if (type !== 'File') {
            throw new Error("The item is not of type 'File'");
        }
        return type;
    },
    
    _getIdInternal: function Aras_IOM_Item$_getIdInternal() {
        var id = this.getID();
        if (String.isNullOrEmpty(id)) {
            throw new Error('Item ID is not set');
        }
        return id;
    },
    
    _getTypeInternal: function Aras_IOM_Item$_getTypeInternal() {
        var type = this.getType();
        if (String.isNullOrEmpty(type)) {
            throw new Error('Item type is not set');
        }
        return type;
    },
    
    getId: function Aras_IOM_Item$getId() {
        return this.getID();
    },
    
    applyStylesheet: function Aras_IOM_Item$applyStylesheet(xslStylesheet, type) {
        if (type == null) {
            throw new Error('type');
        }
        var xslt = new XmlDocument();
        var stype = type.trim().toLowerCase();
        if (stype === 'url') {
            var xslPath = xslStylesheet;
            xslt.load(xslPath);
            if (xslt.xml == null || !xslt.xml) {
                xslt.loadUrl(xslPath);
            }
        }
        else if (stype === 'text') {
            Aras.IOM.InternalUtils.loadXmlFromString(xslt, xslStylesheet);
        }
        var domToTransform;
        domToTransform = new XmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(domToTransform, this.dom.xml);
        return domToTransform.transformNode(xslt);
    },
    
    applyAsync: function Aras_IOM_Item$applyAsync(action, argsObject) {
        var actionName = Type.safeCast(action, String);
        if (actionName == null && action != null) {
            argsObject = Type.safeCast(action, Object);
        }
        this._validateItemBeforeApply(actionName, argsObject);
        var connection = Type.safeCast(this.serverConnection, Aras.IOM.InnovatorServerConnector);
        if (connection.get__isApplyThroughVaultServerSupported() && this._isApplyThroughVaultServerRequired()) {
            return this._applyThroughVaultServerAsync();
        }
        var inDom = this.newXMLDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, Aras.IOM.XmlExtension.getXml(this.node));
        return connection.callActionAsync('ApplyItem', inDom).then(ss.Delegate.create(this, function(resolvedItem) {
            var item = Aras.IOM.Item._createItem(this.serverConnection, null, null, null);
            item.dom = resolvedItem;
            if (item.dom.selectSingleNode(Aras.IOM.Item.xPathFault + '/faultcode') == null) {
                item._initNodes();
            }
            return item;
        }));
    },
    
    _applyThroughVaultServerAsync: function Aras_IOM_Item$_applyThroughVaultServerAsync() {
        var fileList = this._getFilesContainer();
        var aml = new ss.StringBuilder();
        if (this.node != null) {
            aml.append(Aras.IOM.XmlExtension.getXml(this.node));
        }
        else {
            for (var i = 0, count = this.nodeList.length; i < count; i++) {
                aml.append(Aras.IOM.XmlExtension.getXml(this.nodeList[i]));
            }
        }
        var vaultServerId = this._getVaultServerId();
        var vaultServerUrl = this._getVaultServerUrl(vaultServerId);
        var connection = Type.safeCast(this.serverConnection, Aras.IOM.InnovatorServerConnector);
        return connection._callActionThroughVaultServerAsync('ApplyAML', aml.toString(), fileList, vaultServerUrl, vaultServerId).then(ss.Delegate.create(this, function(fileAml) {
            var item = this.newItem();
            item.loadAML(fileAml);
            return item;
        }));
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.InnovatorServerConnector

Aras.IOM.InnovatorServerConnector = function Aras_IOM_InnovatorServerConnector(parentArasObj) {
    Aras.IOM.InnovatorServerConnector.initializeBase(this);
    this._parentArasObj$1 = parentArasObj;
    if (ss.isNullOrUndefined(this._parentArasObj$1)) {
        this._parentArasObj$1 = window.aras || parent.aras || parent.parent.aras;
    }
}
Aras.IOM.InnovatorServerConnector.createConnection = function Aras_IOM_InnovatorServerConnector$createConnection(loginName, md5Password) {
    var conn = new Aras.IOM.InnovatorServerConnector(null);
    conn.loginWithCredentials(loginName, md5Password);
    return conn;
}
Aras.IOM.InnovatorServerConnector.prototype = {
    _parentArasObj$1: null,
    
    getDatabases: function Aras_IOM_InnovatorServerConnector$getDatabases() {
        var xmlhttp = this._parentArasObj$1.XmlHttpRequestManager.CreateRequest();
        var baseUrl = this._parentArasObj$1.getServerBaseURL();
        xmlhttp.open('GET', baseUrl + 'DBList.aspx', false);
        xmlhttp.send(null);
        var resDom = new XmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(resDom, xmlhttp.responseText);
        var nodes = resDom.selectNodes('DBList/DB/@id');
        var result = new Array(nodes.length);
        for (var i = 0; i < nodes.length; i++) {
            result[i] = nodes[i].text;
        }
        return result;
    },
    
    CallAction: function Aras_IOM_InnovatorServerConnector$CallAction(actionName, inDOM, outDOM) {
        var cachedItem = null;
        var tmpNd = inDOM.documentElement;
        if (tmpNd.nodeName === 'Item') {
            var curAction = tmpNd.getAttribute('action');
            if (curAction === 'purge' || curAction === 'delete' || curAction === 'update' || curAction === 'version' || curAction === 'add') {
                var iomCache = new IOMCache(this._parentArasObj$1);
                (iomCache.apply(tmpNd)).then(function(resolve) {
                    return cachedItem = resolve;
                });
            }
        }
        if (cachedItem != null) {
            Aras.IOM.InternalUtils.loadXmlFromString(outDOM, '<Result>' + cachedItem.xml + '</Result>');
        }
        else {
            var res = this._parentArasObj$1.soapSend(actionName, inDOM.xml);
            var textResponse = res.getResponseText();
            Aras.IOM.InternalUtils.loadXmlFromString(outDOM, textResponse);
        }
    },
    
    callActionAsync: function Aras_IOM_InnovatorServerConnector$callActionAsync(actionName, inDOM) {
        var promise = Promise.resolve(null);
        var inDomNode = inDOM.documentElement;
        var action = inDomNode.getAttribute('action');
        if (inDomNode.nodeName === 'Item' && (action === 'purge' || action === 'delete' || action === 'update' || action === 'version' || action === 'add')) {
            var iomCache = new IOMCache(this._parentArasObj$1);
            promise = iomCache.apply(inDomNode, true);
        }
        return promise.then(function(resolve) {
            if (resolve != null) {
                return String.concat('<Result>', (resolve).xml, '</Result>');
            }
            return TopWindowHelper.getMostTopWindowWithAras(window).ArasModules.soap(inDOM.xml, {method: actionName, async: true});
        }).then(function(resolve) {
            return Aras.IOM.InternalUtils.createAndLoadXmlDocument((Type.canCast(resolve, String)) ? resolve : (resolve).xml);
        });
    },
    
    _callActionThroughVaultServerAsync: function Aras_IOM_InnovatorServerConnector$_callActionThroughVaultServerAsync(action, itemXml, fileList, vaultServerUrl, vaultServerId) {
        var clientDataHeaders = this._getClientHTTPHeaders(action);
        if (!ss.isNullOrUndefined(vaultServerId)) {
            clientDataHeaders.add(new Aras.Utils.HeaderClientData('VAULTID', vaultServerId));
        }
        var requestXml = String.format('{0}<AML>{1}</AML>{2}', Aras.SoapConstants._soap._envelopeBodyStart, itemXml, Aras.SoapConstants._soap._envelopeBodyEnd);
        clientDataHeaders.add(new Aras.Utils.HeaderClientData('XMLdata', requestXml));
        var uploader = new FileUpload(TopWindowHelper.getMostTopWindowWithAras(window).aras, this._transformVaultUrl(vaultServerUrl));
        return uploader.uploadFiles(fileList, clientDataHeaders, true).then(function(aml) {
            return aml;
        });
    },
    
    _addAuthHttpHeaders: function Aras_IOM_InnovatorServerConnector$_addAuthHttpHeaders(clientHttpHeaders) {
        var authorizationHeader = this._parentArasObj$1.OAuthClient.getAuthorizationHeader();
        var authorizationHeaderName = this._parentArasObj$1.OAuthClient.authorizationHeaderName;
        var authorizationHeaderValue = authorizationHeader[authorizationHeaderName];
        clientHttpHeaders.add(new Aras.Utils.HeaderClientData(authorizationHeaderName, authorizationHeaderValue));
    },
    
    debugLog: function Aras_IOM_InnovatorServerConnector$debugLog(reason, msg) {
        throw new Error('NotImplementedException');
    },
    
    debugLogP: function Aras_IOM_InnovatorServerConnector$debugLogP() {
        throw new Error('NotImplementedException');
    },
    
    getUserID: function Aras_IOM_InnovatorServerConnector$getUserID() {
        var userId = this._parentArasObj$1.getUserID();
        if (ss.isNullOrUndefined(userId)) {
            throw new Error('Not logged in');
        }
        return userId;
    },
    
    getDatabaseName: function Aras_IOM_InnovatorServerConnector$getDatabaseName() {
        return this._parentArasObj$1.getDatabase();
    },
    
    getLicenseInfo: function Aras_IOM_InnovatorServerConnector$getLicenseInfo(issuer, addon_name) {
        var inDom = new XmlDocument();
        var outDom = new XmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, '<Item/>');
        if (!String.isNullOrEmpty(issuer)) {
            var issuerElement = inDom.createElement('issuer');
            issuerElement.text = issuer;
            inDom.documentElement.appendChild(issuerElement);
        }
        if (String.isNullOrEmpty(addon_name)) {
            var keyed_nameElement = inDom.createElement('keyed_name');
            keyed_nameElement.text = addon_name;
            inDom.documentElement.appendChild(keyed_nameElement);
        }
        var baseUrl = this._parentArasObj$1.getServerBaseURL();
        var res = this._parentArasObj$1.soapSend('GetLicenseInfo', inDom.xml, baseUrl + 'License.aspx', null, null, null, null, true);
        var textResponse = res.getResponseText();
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, textResponse);
        var result_node = outDom.selectSingleNode('//Result/*');
        if (result_node == null || !result_node.xml) {
            return null;
        }
        else {
            return result_node.xml;
        }
    },
    
    getOperatingParameter: function Aras_IOM_InnovatorServerConnector$getOperatingParameter(name, defaultvalue) {
        throw new Error('NotImplementedException');
    },
    
    getSrvContext: function Aras_IOM_InnovatorServerConnector$getSrvContext() {
        throw new Error('NotImplementedException');
    },
    
    GetValidateUserXmlResult: function Aras_IOM_InnovatorServerConnector$GetValidateUserXmlResult() {
        return this._parentArasObj$1.getCommonPropertyValue('ValidateUserXmlResult');
    },
    
    getUserInfo: function Aras_IOM_InnovatorServerConnector$getUserInfo() {
        var iomFactory = this._parentArasObj$1.IomFactory;
        var userid = this.getUserID();
        var key = this._parentArasObj$1.MetadataCache.CreateCacheKey('getUserInfo', userid);
        var cacheContainer = this._parentArasObj$1.MetadataCache.GetItem(key);
        if (cacheContainer == null) {
            var item = Aras.IOM.InnovatorServerConnector.callBaseMethod(this, 'getUserInfo');
            cacheContainer = iomFactory.CreateCacheableContainer(item, userid);
            this._parentArasObj$1.MetadataCache.SetItem(key, cacheContainer);
        }
        return cacheContainer.Content();
    },
    
    getFileUrl: function Aras_IOM_InnovatorServerConnector$getFileUrl(fileId, type) {
        var baseUrl = Aras.IOM.InnovatorServerConnector.callBaseMethod(this, 'getFileUrl', [ fileId, 0 ]);
        if (type === 1) {
            var client = new AuthenticationBrokerClient();
            var token = client.GetFileDownloadToken(fileId);
            baseUrl += '&token=' + token;
        }
        return baseUrl;
    },
    
    getFileUrls: function Aras_IOM_InnovatorServerConnector$getFileUrls(fileIds, type) {
        var baseUrls = Aras.IOM.InnovatorServerConnector.callBaseMethod(this, 'getFileUrls', [ fileIds, 0 ]);
        if (type === 1) {
            var client = new AuthenticationBrokerClient();
            var tokens = client.GetFilesDownloadTokens(fileIds);
            for (var i = 0; i < fileIds.length; i++) {
                baseUrls[i] += '&token=' + tokens[i];
            }
        }
        return baseUrls;
    },
    
    getLicenseManagerWebService: function Aras_IOM_InnovatorServerConnector$getLicenseManagerWebService() {
        return new Aras.IOME.Licensing._licenseManagerWebService();
    },
    
    get_userName: function Aras_IOM_InnovatorServerConnector$get_userName() {
        return this._parentArasObj$1.getLoginName();
    },
    
    get_userPassword: function Aras_IOM_InnovatorServerConnector$get_userPassword() {
        return this._parentArasObj$1.getPassword();
    },
    
    loginDefault: function Aras_IOM_InnovatorServerConnector$loginDefault() {
        InnovatorServerTests.Test._testHelper._logOn(InnovatorServerTests.Test.ConnectionInfo._adminLoginName, InnovatorServerTests.Test.ConnectionInfo._adminPasswordHash, InnovatorServerTests.Test.ConnectionInfo._databaseAlias, InnovatorServerTests.Test.ConnectionInfo._innovatorServerUrl, '');
    },
    
    login: function Aras_IOM_InnovatorServerConnector$login() {
        this.loginDefault();
        return Aras.IOM.InnovatorServerConnector.callBaseMethod(this, 'getUserInfo');
    },
    
    loginWithCredentials: function Aras_IOM_InnovatorServerConnector$loginWithCredentials(loginName, password) {
        var isMd5Password = Aras.IOM.InnovatorServerConnector._idRegex$1.test(password);
        var hash = (isMd5Password) ? password : ArasModules.cryptohash.MD5(password).toString();
        InnovatorServerTests.Test._testHelper._logOn(loginName, hash, InnovatorServerTests.Test.ConnectionInfo._databaseAlias, InnovatorServerTests.Test.ConnectionInfo._innovatorServerUrl, '');
        return Aras.IOM.InnovatorServerConnector.callBaseMethod(this, 'getUserInfo');
    },
    
    logout: function Aras_IOM_InnovatorServerConnector$logout(unlockOnLogout) {
        this._parentArasObj$1.logout();;
    },
    
    _inn$1: null,
    
    get_innovator: function Aras_IOM_InnovatorServerConnector$get_innovator() {
        return this._inn$1 || (this._inn$1 = new Aras.IOM.IomFactory().CreateInnovator(this));
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.ServerConnectionBase

Aras.IOM.ServerConnectionBase = function Aras_IOM_ServerConnectionBase() {
    this._timeZoneName = Aras.I18NUtils.I18NSystemInfo.get__currentTimeZoneName();
}
Aras.IOM.ServerConnectionBase.prototype = {
    
    _applyThroughVaultServer: function Aras_IOM_ServerConnectionBase$_applyThroughVaultServer(itemToApply, files) {
        return null;
    },
    
    cachedUserInfo: null,
    _localeName: null,
    
    get_locale: function Aras_IOM_ServerConnectionBase$get_locale() {
        return this._localeName;
    },
    set_locale: function Aras_IOM_ServerConnectionBase$set_locale(value) {
        this._localeName = value;
        return value;
    },
    
    get_timeZoneName: function Aras_IOM_ServerConnectionBase$get_timeZoneName() {
        return this._timeZoneName;
    },
    set_timeZoneName: function Aras_IOM_ServerConnectionBase$set_timeZoneName(value) {
        this._timeZoneName = value;
        return value;
    },
    
    get__isApplyThroughVaultServerSupported: function Aras_IOM_ServerConnectionBase$get__isApplyThroughVaultServerSupported() {
        return true;
    },
    
    _getVaultServerUrl: function Aras_IOM_ServerConnectionBase$_getVaultServerUrl(vaultServerId) {
        var vaultUrl = null;
        if (!String.isNullOrEmpty(vaultServerId)) {
            var item = Aras.IOM.Item._createItem(this, 'File', null, 'full');
            var defaultVaultServerId = item._getDefaultVaultId();
            if (String.equals(defaultVaultServerId, vaultServerId, StringComparison.ordinalIgnoreCase)) {
                var userInfo = item._getUserInfo();
                vaultUrl = this._getVaultUrlFromItem(userInfo.getPropertyItem('default_vault'));
            }
            else {
                var vaultRequest = item;
                vaultRequest.loadAML("<Item type='Vault' id='" + vaultServerId + "' action='get' select='vault_url' />");
                var vaultItem = vaultRequest.apply();
                if (vaultItem.isError()) {
                    throw new Error(vaultItem.getErrorString());
                }
                vaultUrl = this._getVaultUrlFromItem(vaultItem);
            }
            if (String.isNullOrEmpty(vaultUrl)) {
                throw new Error("Failed to obtain vault URL for vault with ID='" + vaultServerId + "'");
            }
        }
        return vaultUrl;
    },
    
    _getReadVaultForFile: function Aras_IOM_ServerConnectionBase$_getReadVaultForFile(fileItem) {
        var all_located = fileItem.getRelationships('Located');
        var lcount = all_located.getItemCount();
        if (!lcount) {
            return null;
        }
        else if (lcount === 1) {
            return all_located.getItemByIndex(0).getRelatedItem();
        }
        var maxv = 0;
        var i = 0;
        for (i = 0; i < lcount; i++) {
            var located = all_located.getItemByIndex(i);
            var file_version = parseInt(located.getProperty('file_version'));
            if (file_version > maxv) {
                maxv = file_version;
            }
        }
        var sorted_located = this._getSortedLocatedList(fileItem, all_located);
        for (i = 0; i < sorted_located.length; i++) {
            var located = sorted_located[i];
            var file_version = parseInt(located.getProperty('file_version'));
            if (file_version === maxv) {
                return located.getRelatedItem();
            }
        }
        return null;
    },
    
    _getSortedLocatedList: function Aras_IOM_ServerConnectionBase$_getSortedLocatedList(fileItem, all_located) {
        var lcount = all_located.getItemCount();
        var i = 0;
        var sorted_located = [];
        var uresult = this.getUserInfo();
        if (uresult.isError()) {
            throw new Error('Error getting user info: ' + uresult.toString());
        }
        var all_rps = uresult.getRelationships('ReadPriority');
        var rpcount = all_rps.getItemCount();
        for (i = 0; i < rpcount; i++) {
            var vault = all_rps.getItemByIndex(i).getRelatedItem();
            for (var l = 0; l < lcount; l++) {
                var located = all_located.getItemByIndex(l);
                if (vault.getID() === located.getRelatedItem().getID()) {
                    sorted_located.add(located);
                    break;
                }
            }
        }
        var dvfound = false;
        var default_vault = uresult.getPropertyItem('default_vault');
        for (i = 0; i < sorted_located.length; i++) {
            if (sorted_located[i].getRelatedItem().getID() === default_vault.getID()) {
                dvfound = true;
                break;
            }
        }
        if (!dvfound) {
            for (i = 0; i < lcount; i++) {
                var located = all_located.getItemByIndex(i);
                if (default_vault.getID() === located.getRelatedItem().getID()) {
                    sorted_located.add(located);
                    break;
                }
            }
        }
        for (i = 0; i < lcount; i++) {
            var located = all_located.getItemByIndex(i);
            var vfound = false;
            for (var l = 0; l < sorted_located.length; l++) {
                if (sorted_located[l].getID() === located.getID()) {
                    vfound = true;
                    break;
                }
            }
            if (!vfound) {
                sorted_located.add(located);
            }
        }
        return sorted_located;
    },
    
    _getVaultUrlFromItem: function Aras_IOM_ServerConnectionBase$_getVaultUrlFromItem(vault) {
        return vault.getProperty('vault_url');
    },
    
    _getFileURLForVault: function Aras_IOM_ServerConnectionBase$_getFileURLForVault(fileItem, vault) {
        var vaultUrl = this._getVaultUrlFromItem(vault);
        if (String.isNullOrEmpty(vaultUrl)) {
            return null;
        }
        vaultUrl = this._transformVaultUrl(vaultUrl);
        if (vaultUrl == null) {
            return null;
        }
        var vaultId = vault.getID();
        var uri;
        var url = String.format('{0}?dbName={1}&fileId={2}&fileName={3}&vaultId={4}', vaultUrl, HttpUtility.urlEncode(this.GetDatabaseName()), HttpUtility.urlEncode(fileItem.getID()), HttpUtility.urlEncode(fileItem.getProperty('filename')), HttpUtility.urlEncode(vaultId));
        uri = url;
        return uri;
    },
    
    _transformVaultUrl: function Aras_IOM_ServerConnectionBase$_transformVaultUrl(vaultUrl) {
        var result = vaultUrl;
        if (vaultUrl.indexOf('$[') !== -1) {
            var inDom = new XmlDocument();
            var outDom = new XmlDocument();
            Aras.IOM.InternalUtils.loadXmlFromString(inDom, '<url>' + vaultUrl + '</url>');
            Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty />');
            this.CallAction('TransformVaultServerURL', inDom, outDom);
            if (outDom.selectSingleNode(Aras.IOM.Item.xPathFault) == null) {
                result = outDom.selectSingleNode(Aras.IOM.Item.xPathResult).text;
            }
        }
        return result;
    },
    
    DownloadFile: function Aras_IOM_ServerConnectionBase$DownloadFile(fileItem, fileName, overwrite) {
        this._downloadFileInternal(fileItem, fileName, overwrite, null);
    },
    
    _downloadFileInternal: function Aras_IOM_ServerConnectionBase$_downloadFileInternal(fileItem, fileName, overwrite, tnx) {
        fileItem = this._loadFileData(fileItem);
        var fileVault = this._getReadVaultForFile(fileItem);
        if (fileVault == null) {
            throw new Error('Vault location of the file is unknown');
        }
        var fileUrl = this._getFileURLForVault(fileItem, fileVault);
        var headers = this._populateHeaders(tnx, fileVault);
        var url = this.getFileUrl(fileItem.getID(), 1);
        url += '&contentDispositionAttachment=1';
        TopWindowHelper.getMostTopWindowWithAras(window).ArasModules.vault._downloadHelper(url, false); return;
        FileDownload.downloadFile(fileUrl, fileName, headers, null);
    },
    
    _populateHeaders: function Aras_IOM_ServerConnectionBase$_populateHeaders(tnx, fileVault) {
        var h = this._getClientHTTPHeaders(null);
        h.add(new Aras.Utils.HeaderClientData('VAULTID', fileVault.getID()));
        if (tnx != null && tnx._vaultId === fileVault.getID()) {
            h.add(new Aras.Utils.HeaderClientData('TRANSACTIONID', tnx._id));
        }
        return h;
    },
    
    _loadFileData: function Aras_IOM_ServerConnectionBase$_loadFileData(fileItem) {
        var fileId = fileItem.getID();
        if (fileItem.getAttribute('__aras_file_has_all_located__') !== '1') {
            var requestFile = Aras.IOM.Item._createItem(this, 'File', null, 'full');
            requestFile.loadAML("<Item type='File' action='get' select='id,filename'>" + '<Relationships>' + "<Item type='Located' select='id,related_id,file_version' action='get'>" + '<related_id>' + "<Item type='Vault' select='id,vault_url' action='get'>" + '</Item>' + '</related_id>' + '</Item>' + '</Relationships>' + '</Item>');
            requestFile.setID(fileId);
            var responseFile = requestFile.apply();
            if (responseFile.isError()) {
                throw new Error('Error getting file: ' + responseFile.getErrorString());
            }
            fileItem = responseFile;
        }
        else {
            fileItem.removeAttribute('__aras_file_has_all_located__');
        }
        return fileItem;
    },
    
    getUserInfo: function Aras_IOM_ServerConnectionBase$getUserInfo() {
        if (this.cachedUserInfo != null) {
            return this.cachedUserInfo;
        }
        var userinfo = Aras.IOM.Item._createItem(this, 'User', null, 'full');
        var uid = this.getUserID();
        var aml = "<Item type='User' action='get' select='default_vault' expand='1'><id>" + uid + '</id><Relationships>' + "<Item type='ReadPriority' action='get' select='priority, related_id' expand='1' orderBy='priority'/></Relationships></Item>";
        userinfo.loadAML(aml);
        userinfo = userinfo.apply();
        if (userinfo.isError()) {
            aml = "<Item type='User' action='get' select='default_vault' expand='1'><id>" + uid + '</id></Item>';
            userinfo.loadAML(aml);
            userinfo = userinfo.apply();
        }
        this.cachedUserInfo = userinfo;
        return userinfo;
    },
    
    GetFromCache: function Aras_IOM_ServerConnectionBase$GetFromCache(key) {
        throw new Error('Not Implemented');
    },
    
    InsertIntoCache: function Aras_IOM_ServerConnectionBase$InsertIntoCache(key, value, path) {
        throw new Error('Not Implemented');
    },
    
    getFileUrl: function Aras_IOM_ServerConnectionBase$getFileUrl(fileId, type) {
        if (fileId == null) {
            throw new Error('fileId');
        }
        return this._getFileUrlsByIds([ fileId ])[0];
    },
    
    getFileUrls: function Aras_IOM_ServerConnectionBase$getFileUrls(fileIds, type) {
        if (fileIds == null) {
            throw new Error('fileIds');
        }
        if (!fileIds.length) {
            throw new Error('List cannot be empty. Parameter name: fileIds');
        }
        if (!!type) {
            throw new Error(type.toString());
        }
        var ids = new Array(fileIds.length);
        for (var i = 0; i < fileIds.length; i++) {
            ids[i] = fileIds[i].toString();
        }
        var urls = this._getFileUrlsByIds(ids);
        return [urls];
    },
    
    _getFileUrlsByIds: function Aras_IOM_ServerConnectionBase$_getFileUrlsByIds(fileIds) {
        var requestFile = Aras.IOM.Item._createItem(this, 'File', null, 'full');
        requestFile.loadAML("<Item type='File' action='get' select='id,filename'>" + '<Relationships>' + "<Item type='Located' select='id,related_id,file_version' action='get'>" + '<related_id>' + "<Item type='Vault' select='id,vault_url' action='get'>" + '</Item>' + '</related_id>' + '</Item>' + '</Relationships>' + '</Item>');
        var allFileIds = null;
        for (var i = 0; i < fileIds.length; i++) {
            var fileId = fileIds[i];
            if (allFileIds == null) {
                allFileIds = fileId;
            }
            else {
                allFileIds += ',' + fileId;
            }
        }
        requestFile.setProperty('id', allFileIds, null);
        requestFile.setPropertyCondition('id', 'in', null);
        var responseFiles = requestFile.apply();
        if (responseFiles.isError()) {
            throw new Error('Error getting files: ' + responseFiles.getErrorString());
        }
        var fileUrls = new Array(fileIds.length);
        for (var i = 0; i < fileIds.length; i++) {
            var responseFile = responseFiles.getItemsByXPath(Aras.IOM.Item.xPathResult + '/Item[id="' + fileIds[i] + '"]');
            var fileVault = this._getReadVaultForFile(responseFile);
            if (fileVault == null) {
                throw new Error('Vault location of the file is unknown');
            }
            fileUrls[i] = this._getFileURLForVault(responseFile, fileVault);
        }
        return fileUrls;
    },
    
    _getClientHTTPHeaders: function Aras_IOM_ServerConnectionBase$_getClientHTTPHeaders(soapAction) {
        var clientData = this._getBasicHeaders(soapAction);
        this._addAuthHttpHeaders(clientData);
        return clientData;
    },
    
    _getBasicHeaders: function Aras_IOM_ServerConnectionBase$_getBasicHeaders(soapAction) {
        var clientData = [];
        if (!String.isNullOrEmpty(soapAction)) {
            clientData.add(new Aras.Utils.HeaderClientData('SOAPACTION', soapAction));
        }
        clientData.add(new Aras.Utils.HeaderClientData('LOCALE', this.get_locale()));
        clientData.add(new Aras.Utils.HeaderClientData('TIMEZONE_NAME', this.get_timeZoneName()));
        return clientData;
    },
    
    _addAuthHttpHeaders: function Aras_IOM_ServerConnectionBase$_addAuthHttpHeaders(clientHttpHeaders) {
        clientHttpHeaders.add(new Aras.Utils.HeaderClientData('AUTHUSER', this.get_userName()));
        clientHttpHeaders.add(new Aras.Utils.HeaderClientData('AUTHPASSWORD', this.get_userPassword()));
        clientHttpHeaders.add(new Aras.Utils.HeaderClientData('DATABASE', this.GetDatabaseName()));
    },
    
    _CallActionThroughVaultServer: function Aras_IOM_ServerConnectionBase$_CallActionThroughVaultServer(action, fileList, itemXml, vault_url, vaultServerId, transaction) {
        var clientData = this._getClientHTTPHeaders(action);
        if (!ss.isNullOrUndefined(vaultServerId)) {
            clientData.add(new Aras.Utils.HeaderClientData('VAULTID', vaultServerId));
        }
        if (!ss.isNullOrUndefined(transaction)) {
            clientData.add(new Aras.Utils.HeaderClientData('TRANSACTIONID', transaction._id));
        }
        var reqXml;
        reqXml = String.format('{0}<AML>{1}</AML>{2}', Aras.SoapConstants._soap._envelopeBodyStart, itemXml, Aras.SoapConstants._soap._envelopeBodyEnd);
        clientData.add(new Aras.Utils.HeaderClientData('XMLdata', reqXml));
        vault_url = this._transformVaultUrl(vault_url);
        var uploader = new FileUpload(TopWindowHelper.getMostTopWindowWithAras(window).aras, vault_url);
        var response_xml = uploader.uploadFiles(fileList, clientData);
        return response_xml;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM._restrictedHttpServerConnection

Aras.IOM._restrictedHttpServerConnection = function Aras_IOM__restrictedHttpServerConnection(innovatorServerUrl) {
    Aras.IOM._restrictedHttpServerConnection.initializeBase(this, [ innovatorServerUrl, '', '', '', '', '' ]);
}
Aras.IOM._restrictedHttpServerConnection.prototype = {
    
    getUserID: function Aras_IOM__restrictedHttpServerConnection$getUserID() {
        throw new Error('Operation not supported, create new instance of Aras.IOM.HttpServerConnection and specify db name, login and password');
    },
    
    GetDatabaseName: function Aras_IOM__restrictedHttpServerConnection$GetDatabaseName() {
        throw new Error('Operation not supported, create new instance of Aras.IOM.HttpServerConnection and specify db name, login and password');
    },
    
    GetValidateUserXmlResult: function Aras_IOM__restrictedHttpServerConnection$GetValidateUserXmlResult() {
        throw new Error('Operation not supported, create new instance of Aras.IOM.HttpServerConnection and specify db name, login and password');
    },
    
    Login: function Aras_IOM__restrictedHttpServerConnection$Login() {
        throw new Error('Operation not supported, create new instance of Aras.IOM.HttpServerConnection and specify db name, login and password');
    },
    
    Logout: function Aras_IOM__restrictedHttpServerConnection$Logout(unlockOnLogout) {
        throw new Error('Operation not supported, create new instance of Aras.IOM.HttpServerConnection and specify db name, login and password');
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.WinAuthHttpServerConnection

Aras.IOM.WinAuthHttpServerConnection = function Aras_IOM_WinAuthHttpServerConnection(innovatorServerUrl, database) {
    Aras.IOM.WinAuthHttpServerConnection.initializeBase(this, [ innovatorServerUrl, database, '', '', '', '' ]);
}
Aras.IOM.WinAuthHttpServerConnection.prototype = {
    
    Login: function Aras_IOM_WinAuthHttpServerConnection$Login() {
        var inDom = Aras.IOM.InternalUtils.createXmlDocument();
        var outDom = Aras.IOM.InternalUtils.createXmlDocument();
        Aras.IOM.InternalUtils.loadXmlFromString(inDom, '<Item/>');
        Aras.IOM.InternalUtils.loadXmlFromString(outDom, '<Empty/>');
        var splen = this._innovatorServerUrl.toLowerCase().indexOf('/server/innovatorserver.aspx');
        var waLoginUrl = this._innovatorServerUrl.substring(0, splen) + '/Client/scripts/IOMLogin.aspx';
        this.callActionImpl('', inDom, outDom, waLoginUrl, false);
        var result = outDom.selectSingleNode('//Result');
        if (result == null) {
            var errMsg = 'Failed to connect to IOMLogin.aspx. Either IOMLogin.aspx is not setup to use integrated Windows authentication or the authentication failed.';
            return new Aras.IOM.Innovator(this).newError(errMsg);
        }
        var userName = result.selectSingleNode('user').text;
        var passwordOrPasswordHash = result.selectSingleNode('password').text;
        if (!passwordOrPasswordHash.trim().length) {
            return new Aras.IOM.Innovator(this).newError("Failed to authenticate with Innovator server '" + this._innovatorServerUrl + "'. Original error: " + userName);
        }
        this._rawCredentials = new Aras.IOM._innovatorCredentials(userName, passwordOrPasswordHash);
        return Aras.IOM.WinAuthHttpServerConnection.callBaseMethod(this, 'Login');
    }
}


Type.registerNamespace('Aras.Utils');

////////////////////////////////////////////////////////////////////////////////
// Aras.Utils.IClientData

Aras.Utils.IClientData = function() { };
Aras.Utils.IClientData.prototype = {
    get_name : null
}
Aras.Utils.IClientData.registerInterface('Aras.Utils.IClientData');


////////////////////////////////////////////////////////////////////////////////
// Aras.Utils.HeaderClientData

Aras.Utils.HeaderClientData = function Aras_Utils_HeaderClientData(name, value) {
    this._name = name;
    this._value = value;
}
Aras.Utils.HeaderClientData.prototype = {
    _value: null,
    _name: null,
    
    get_value: function Aras_Utils_HeaderClientData$get_value() {
        return this._value;
    },
    
    get_name: function Aras_Utils_HeaderClientData$get_name() {
        return this._name;
    }
}


Type.registerNamespace('Aras.I18NUtils');

////////////////////////////////////////////////////////////////////////////////
// Aras.I18NUtils.Intl

Aras.I18NUtils.Intl = function Aras_I18NUtils_Intl() {
    this.number = new Aras.I18NUtils.ArasNumber();
}


////////////////////////////////////////////////////////////////////////////////
// Aras.I18NUtils.ArasNumber

Aras.I18NUtils.ArasNumber = function Aras_I18NUtils_ArasNumber() {
}
Aras.I18NUtils.ArasNumber.prototype = {
    
    parseInt: function Aras_I18NUtils_ArasNumber$parseInt(numberStr) {
        return 0;
    },
    
    parseFloat: function Aras_I18NUtils_ArasNumber$parseFloat(numberStr, maximumIntegerDigits) {
        return 0;
    },
    
    toString: function Aras_I18NUtils_ArasNumber$toString(number) {
        return '';
    },
    
    format: function Aras_I18NUtils_ArasNumber$format(number, options) {
        return '';
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.I18NUtils._i18NConverter

Aras.I18NUtils._i18NConverter = function Aras_I18NUtils__i18NConverter() {
}
Aras.I18NUtils._i18NConverter._adjustDataType = function Aras_I18NUtils__i18NConverter$_adjustDataType(dataType) {
    if (dataType == null) {
        dataType = '';
    }
    dataType = dataType.replaceAll(' ', '_');
    dataType = String.format('{0}_', dataType);
    if (dataType === 32 || dataType === 'boolean_') {
        return 32;
    }
    if (dataType === 16384 || dataType === 'color_') {
        return 16384;
    }
    if (dataType === 8192 || dataType === 'color_list_') {
        return 8192;
    }
    if (dataType === 64 || dataType === 'date_') {
        return 64;
    }
    if (dataType === 16 || dataType === 'decimal_') {
        return 16;
    }
    if (dataType === 32768 || dataType === 'federated_') {
        return 32768;
    }
    if (dataType === 4096 || dataType === 'filter_list_') {
        return 4096;
    }
    if (dataType === 8 || dataType === 'float_') {
        return 8;
    }
    if (dataType === 131072 || dataType === 'foreign_') {
        return 131072;
    }
    if (dataType === 65536 || dataType === 'formatted_text_') {
        return 65536;
    }
    if (dataType === 128 || dataType === 'image_') {
        return 128;
    }
    if (dataType === 4 || dataType === 'integer_') {
        return 4;
    }
    if (dataType === 1024 || dataType === 'item_') {
        return 1024;
    }
    if (dataType === 2048 || dataType === 'list_') {
        return 2048;
    }
    if (dataType === 256 || dataType === 'md5_') {
        return 256;
    }
    if (dataType === 262144 || dataType === 'ml_string_') {
        return 262144;
    }
    if (dataType === 512 || dataType === 'sequence_') {
        return 512;
    }
    if (dataType === 1 || dataType === 'string_') {
        return 1;
    }
    if (dataType === 2 || dataType === 'text_') {
        return 2;
    }
    return 0;
}
Aras.I18NUtils._i18NConverter._adjustDatePattern = function Aras_I18NUtils__i18NConverter$_adjustDatePattern(datePattern) {
    if (datePattern == null) {
        datePattern = '';
    }
    if (datePattern === (4) || datePattern === 'long_date') {
        return 4;
    }
    if (datePattern === (8) || datePattern === 'long_date_time') {
        return 8;
    }
    if (datePattern === (1) || datePattern === 'short_date') {
        return 1;
    }
    if (datePattern === (2) || datePattern === 'short_date_time') {
        return 2;
    }
    return 0;
}
Aras.I18NUtils._i18NConverter._getDotNetDatePattern = function Aras_I18NUtils__i18NConverter$_getDotNetDatePattern(innovatorDateFormat, locale) {
    var ci;
    try {
        ci = CultureInfo.CreateSpecificCulture(locale);
    }
    catch ($e1) {
        ci = CultureInfo.InvariantCulture;
    }
    var dtfi = ci.DateTimeFormat;
    var retVal = dtfi.ShortDatePattern;
    var innDatePattern = Aras.I18NUtils._i18NConverter._adjustDatePattern(innovatorDateFormat);
    switch (innDatePattern) {
        case 1:
            retVal = dtfi.ShortDatePattern;
            break;
        case 2:
            retVal = String.format('{0} {1}', dtfi.ShortDatePattern, dtfi.LongTimePattern);
            break;
        case 4:
            retVal = dtfi.LongDatePattern;
            break;
        case 8:
            retVal = String.format('{0} {1}', dtfi.LongDatePattern, dtfi.LongTimePattern);
            break;
        default:
            switch (innovatorDateFormat) {
                case 'long_time':
                    retVal = dtfi.LongTimePattern;
                    break;
                case 'short_time':
                    retVal = dtfi.ShortTimePattern;
                    break;
            }
            break;
    }
    return retVal;
}
Aras.I18NUtils._i18NConverter.prototype = {
    _currCultureInfo: null,
    
    get__currCultureInfo: function Aras_I18NUtils__i18NConverter$get__currCultureInfo() {
        return (this._currCultureInfo == null) ? CultureInfo.InvariantCulture : this._currCultureInfo;
    },
    set__currCultureInfo: function Aras_I18NUtils__i18NConverter$set__currCultureInfo(value) {
        this._currCultureInfo = value;
        return value;
    },
    
    _currentLocaleStr: null,
    
    get__currentLocale: function Aras_I18NUtils__i18NConverter$get__currentLocale() {
        return this._currentLocaleStr;
    },
    set__currentLocale: function Aras_I18NUtils__i18NConverter$set__currentLocale(value) {
        this._currentLocaleStr = value;
        if (this._currentLocaleStr == null) {
            this._currentLocaleStr = '';
        }
        this.set__currCultureInfo(Type.safeCast(Aras.I18NUtils._i18NConverter._locales[this._currentLocaleStr], CultureInfo));
        if (this._currCultureInfo == null) {
            try {
                this.set__currCultureInfo(CultureInfo.CreateSpecificCulture(this._currentLocaleStr));
            }
            catch ($e1) {
                this.set__currCultureInfo(CultureInfo.InvariantCulture);
                this._currentLocaleStr = this.get__currCultureInfo().Name;
            }
            Aras.I18NUtils._i18NConverter._locales[this._currentLocaleStr] = this.get__currCultureInfo();
        }
        return value;
    },
    
    _convertToOrFromNeutral: function Aras_I18NUtils__i18NConverter$_convertToOrFromNeutral(val, dataType, isTo, pattern, locale, timeZone) {
        if (val == null) {
            return null;
        }
        var retVal = val;
        var invCult = CultureInfo.InvariantCulture;
        this.set__currentLocale(locale);
        var curCult = this.get__currCultureInfo();
        var dtfi = curCult.DateTimeFormat;
        var dataTypeNumb = Aras.I18NUtils._i18NConverter._adjustDataType(dataType);
        switch (dataTypeNumb) {
            case 64:
                var innDatePattern = Aras.I18NUtils._i18NConverter._adjustDatePattern(pattern);
                if (!!innDatePattern && !String.isNullOrEmpty(pattern)) {
                    pattern = Aras.I18NUtils._i18NConverter._getDotNetDatePattern(pattern, curCult.Name);
                }
                if (isTo) {
                    var dt;
                    var doTimeZoneAdjustment = false;
                    if (String.isNullOrEmpty(pattern)) {
                        dt = dtfi.Parse(val, null, this.get__currentLocale());
                        var dt2 = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds(), dt.getMilliseconds()));
                    }
                    else {
                        dt = dtfi.Parse(val, pattern, curCult.Name);
                        if (ss.isNullOrUndefined(dt)) {
                            return null;
                        }
                        if (pattern.toLowerCase().indexOf('z') > -1) {
                            doTimeZoneAdjustment = true;
                        }
                    }
                    if (doTimeZoneAdjustment) {
                        dt = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds(), dt.getMilliseconds()));
                        var offset = dtfi.OffsetBetweenTimeZones(dt, timeZone, null);
                        dt.setTime(dt.getTime() + offset * 1000 * 60);
                    }
                    retVal = dtfi.Format(dt, 'yyyy-MM-ddTHH:mm:ss', null);
                }
                else {
                    var dt = dtfi.Parse(val, 'yyyy-MM-ddTHH:mm:ss');
                    if (ss.isNullOrUndefined(dt)) {
                        dt = dtfi.Parse(val, 'yyyy-MM-dd');
                        if (ss.isNullOrUndefined(dt)) {
                            return null;
                        }
                    }
                    retVal = dtfi.Format(dt, pattern, this.get__currentLocale());
                }
                break;
            case 16:
                if (Type.getInstanceType(val) === String && val.toLowerCase() === 'infinity') {
                    return val;
                }
                var d = ArasModules.intl.number.parseFloat(val, 0);
                if (isNaN(d)) {
                    retVal = null;
                }
                else {
                    if (isTo) {
                        retVal = ArasModules.intl.number.toString(d);
                    }
                    else {
                        var split = (!!pattern) ? pattern.split('.') : [];
                        retVal = ArasModules.intl.number.format(d, { minimumFractionDigits: (split.length === 2) ? (split[1]).length : 0 });
                    }
                }
                break;
            case 8:
                if (Type.getInstanceType(val) === String && val.toLowerCase() === 'infinity') {
                    return val;
                }
                d = ArasModules.intl.number.parseFloat(val, 0);
                if (isTo) {
                    retVal = ArasModules.intl.number.toString(d);
                }
                else {
                    retVal = ArasModules.intl.number.format(d, 0);
                }
                break;
        }
        return retVal;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.I18NUtils.I18NSystemInfo

Aras.I18NUtils.I18NSystemInfo = function Aras_I18NUtils_I18NSystemInfo() {
}
Aras.I18NUtils.I18NSystemInfo.get__currentCulture = function Aras_I18NUtils_I18NSystemInfo$get__currentCulture() {
    return ss.CultureInfo.CurrentCulture;
}
Aras.I18NUtils.I18NSystemInfo.get__currentUICulture = function Aras_I18NUtils_I18NSystemInfo$get__currentUICulture() {
    return ss.CultureInfo.CurrentCulture;
}
Aras.I18NUtils.I18NSystemInfo.get__currentTimeZoneName = function Aras_I18NUtils_I18NSystemInfo$get__currentTimeZoneName() {
    return 'Kaliningrad Standard Time';
}


Type.registerNamespace('Aras.IOME');

////////////////////////////////////////////////////////////////////////////////
// Aras.IOME.ICacheable

Aras.IOME.ICacheable = function() { };
Aras.IOME.ICacheable.prototype = {
    getGuidsItemDependsOn : null
}
Aras.IOME.ICacheable.registerInterface('Aras.IOME.ICacheable');


////////////////////////////////////////////////////////////////////////////////
// Aras.IOME.CacheableContainer

Aras.IOME.CacheableContainer = function Aras_IOME_CacheableContainer(value, dependenciesSource) {
    this.set__value(value);
    this._dependencies = Aras.IOME.CacheableContainer._getDependencies(dependenciesSource);
}
Aras.IOME.CacheableContainer._getDependencies = function Aras_IOME_CacheableContainer$_getDependencies(source) {
    var hset = {};
    Aras.IOME.ItemCache._findGuidsInValue(source, hset);
    var i = 0;
    var guids = new Array(Object.getKeyCount(hset) + 1);
    var $enum1 = ss.IEnumerator.getEnumerator(Object.keys(hset));
    while ($enum1.moveNext()) {
        var str = $enum1.current;
        guids[i] = str;
        i++;
    }
    return guids;
}
Aras.IOME.CacheableContainer.prototype = {
    
    get__value: function Aras_IOME_CacheableContainer$get__value() {
        return this.content;
    },
    set__value: function Aras_IOME_CacheableContainer$set__value(value) {
        this.content = value;
        return value;
    },
    
    _dependencies: null,
    content: null,
    
    Content: function Aras_IOME_CacheableContainer$Content() {
        return this.content;
    },
    
    getGuidsItemDependsOn: function Aras_IOME_CacheableContainer$getGuidsItemDependsOn() {
        return this._dependencies;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOME._keyComparator

Aras.IOME._keyComparator = function Aras_IOME__keyComparator() {
}
Aras.IOME._keyComparator._getDataToCompare = function Aras_IOME__keyComparator$_getDataToCompare(key) {
    var keyString = '';
    var $enum1 = ss.IEnumerator.getEnumerator(key);
    while ($enum1.moveNext()) {
        var obj = $enum1.current;
        keyString += obj.toString();
    }
    return keyString;
}
Aras.IOME._keyComparator.prototype = {
    
    compare: function Aras_IOME__keyComparator$compare(x, y) {
        if (x == null) {
            throw new Error('x');
        }
        var list = Type.safeCast(x, Array);
        if (list != null) {
            var key1 = list;
            var key2 = y;
            var key1Code = Aras.IOME._keyComparator._getDataToCompare(key1);
            var key2Code = Aras.IOME._keyComparator._getDataToCompare(key2);
            return String.compare(key1Code, key2Code, StringComparison.ordinalIgnoreCase);
        }
        var key1String = x.toString();
        var key2String = x.toString();
        return String.compare(key1String, key2String, StringComparison.ordinalIgnoreCase);
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOME.ArrayListComparer

Aras.IOME.ArrayListComparer = function Aras_IOME_ArrayListComparer() {
}
Aras.IOME.ArrayListComparer.prototype = {
    
    equals: function Aras_IOME_ArrayListComparer$equals(x, y) {
        var ax, ay;
        var j, n;
        ax = x;
        ay = y;
        n = ax.length;
        if (n < ay.length || n > ay.length) {
            return false;
        }
        for (j = 0; j < n; ++j) {
            if (ax[j] !== ay[j]) {
                return false;
            }
        }
        return true;
    },
    
    getHashCode: function Aras_IOME_ArrayListComparer$getHashCode(obj) {
        var ax = obj;
        var j, n, h;
        n = ax.length;
        h = 0;
        for (j = 0; j < n; ++j) {
            h = h ^ this._getHash(ax[j].toString());
        }
        return h;
    },
    
    _getHash: function Aras_IOME_ArrayListComparer$_getHash(str) {
        var hash = 0;
        if (!str.length) {
            return hash;
        }
        for (var index = 0; index < str.length; index++) {
            var charCode = str.charCodeAt(index);
            hash = ((hash << 5) - hash) + charCode;
            hash = hash & hash;
        }
        return hash;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOME.ItemCache

Aras.IOME.ItemCache = function Aras_IOME_ItemCache() {
    this._items = {};
    this._dependency = {};
}
Aras.IOME.ItemCache._findGuidsInValue = function Aras_IOME_ItemCache$_findGuidsInValue(value, hset) {
    if (value == null) {
        return;
    }
    if (typeof(value) === 'object') {
        if (('getAttribute' in value)) {
            Aras.IOME.ItemCache._findGuidsInValueArasXmlElement(value, hset);
            return;
        }
        if (('innerText' in value)) {
            Aras.IOME.ItemCache._findGuidsInValueArasXmlText(value, hset);
            return;
        }
    }
    var tmpITA = Type.safeCast(value, Aras.IOME.ICacheable);
    if (tmpITA != null) {
        var guids = tmpITA.getGuidsItemDependsOn();
        for (var i = 0; i < guids.length; i++) {
            if (!String.isNullOrEmpty(guids[i])) {
                hset[guids[i]] = true;
            }
        }
        return;
    }
    var tmpS = Type.safeCast(value, String);
    if (tmpS != null) {
        if (Aras.IOME.ItemCache._isGuidString(tmpS)) {
            hset[tmpS] = true;
        }
        return;
    }
    var tmpAL = Type.safeCast(value, Array);
    if (tmpAL != null) {
        var $enum1 = ss.IEnumerator.getEnumerator(tmpAL);
        while ($enum1.moveNext()) {
            var x = $enum1.current;
            Aras.IOME.ItemCache._findGuidsInValue(x, hset);
        }
        return;
    }
}
Aras.IOME.ItemCache._findGuidsInValueArasXmlElement = function Aras_IOME_ItemCache$_findGuidsInValueArasXmlElement(value, hset) {
    var id = '';
    if (value.getAttribute('id') != null) {
        id = value.getAttribute('id').toString();
        if (Aras.IOME.ItemCache._isGuidString(id)) {
            hset[id] = true;
        }
    }
    var $enum1 = ss.IEnumerator.getEnumerator(value.selectNodes('.//*/@id'));
    while ($enum1.moveNext()) {
        var tmpXN = $enum1.current;
        id = tmpXN.text;
        if (Aras.IOME.ItemCache._isGuidString(id)) {
            hset[id] = true;
        }
    }
    var $enum2 = ss.IEnumerator.getEnumerator(value.selectNodes('descendant::text()[string-length(.)=32]'));
    while ($enum2.moveNext()) {
        var tmpXN = $enum2.current;
        id = tmpXN.text;
        if (Aras.IOME.ItemCache._isGuidString(id)) {
            hset[id] = true;
        }
    }
}
Aras.IOME.ItemCache._findGuidsInValueArasXmlText = function Aras_IOME_ItemCache$_findGuidsInValueArasXmlText(value, hset) {
    var id = value.text;
    if (Aras.IOME.ItemCache._isGuidString(id)) {
        hset[id] = true;
    }
}
Aras.IOME.ItemCache._findGuidsInKey = function Aras_IOME_ItemCache$_findGuidsInKey(key, hset) {
    var $enum1 = ss.IEnumerator.getEnumerator(key);
    while ($enum1.moveNext()) {
        var x = $enum1.current;
        var sx = x;
        if (Aras.IOME.ItemCache._isGuidString(x)) {
            hset[sx] = true;
        }
    }
}
Aras.IOME.ItemCache._isGuidString = function Aras_IOME_ItemCache$_isGuidString(x) {
    var s = Type.safeCast(x, String);
    if (s != null) {
        return Aras.IOME.ItemCache._guidp.test(s);
    }
    else {
        return false;
    }
}
Aras.IOME.ItemCache._set_diff = function Aras_IOME_ItemCache$_set_diff(a, b) {
    if (!Object.getKeyCount(b)) {
        return a;
    }
    var c = {};
    var $enum1 = ss.IEnumerator.getEnumerator(Object.keys(a));
    while ($enum1.moveNext()) {
        var key = $enum1.current;
        var skey = key;
        if (!Object.keyExists(b, skey)) {
            c[skey] = a[skey];
        }
    }
    return c;
}
Aras.IOME.ItemCache._checkThatKeyIsValid = function Aras_IOME_ItemCache$_checkThatKeyIsValid(key) {
    for (var i = 0; i < key.length; i++) {
        var s = key[i];
        if (!((Type.canCast(s, String)) || (Type.canCast(s, Boolean)))) {
            Aras.IOME.ItemCache._throwIllegalDatatypeError('key', s);
        }
    }
}
Aras.IOME.ItemCache._throwIllegalDatatypeError = function Aras_IOME_ItemCache$_throwIllegalDatatypeError(paramName, x) {
    var typ = 'NULL';
    if (x != null) {
        typ = Type.getInstanceType(x).get_fullName();
    }
    var msg = typ + ' is an illegal datatype.';
    throw new Error(msg + paramName);
}
Aras.IOME.ItemCache.prototype = {
    _items: null,
    _dependency: null,
    
    ClearCache: function Aras_IOME_ItemCache$ClearCache() {
        this.clear();
    },
    
    RemoveById: function Aras_IOME_ItemCache$RemoveById(id) {
        return this.RemoveAllItems(id);
    },
    
    RemoveAllItems: function Aras_IOME_ItemCache$RemoveAllItems(itemId) {
        return this.Remove([ itemId ]);
    },
    
    Remove: function Aras_IOME_ItemCache$Remove(idlist) {
        if (idlist == null || !idlist.length) {
            return false;
        }
        var to_remove = {};
        for (var i = 0; i < idlist.length; i++) {
            var id = idlist[i];
            if (String.isNullOrEmpty(id)) {
                continue;
            }
            var depends_set = this._dependency[id];
            if (depends_set != null) {
                var keys_for_remove = [];
                var $enum1 = ss.IEnumerator.getEnumerator(Object.keys(depends_set));
                while ($enum1.moveNext()) {
                    var key = $enum1.current;
                    keys_for_remove.add(key);
                }
                to_remove[id] = keys_for_remove;
            }
        }
        if (Object.getKeyCount(to_remove) > 0) {
            var $enum2 = ss.IEnumerator.getEnumerator(Object.keys(to_remove));
            while ($enum2.moveNext()) {
                var id = $enum2.current;
                delete this._dependency[id];
                var keys_to_remove = to_remove[id];
                for (var i = 0; i < keys_to_remove.length; i++) {
                    this.removeFromHash(keys_to_remove[i]);
                }
            }
            return true;
        }
        return false;
    },
    
    removeFromHash: function Aras_IOME_ItemCache$removeFromHash(skey) {
        var key = skey;
        var keys = [];
        var splittedKeys = key.split(',');
        var $enum1 = ss.IEnumerator.getEnumerator(splittedKeys);
        while ($enum1.moveNext()) {
            var k = $enum1.current;
            keys.add(k);
        }
        if (key == null) {
            throw new Error('key');
        }
        var old_depends_set = {};
        var old_value = null;
        if (Object.keyExists(this._items, key)) {
            old_value = this._items[key];
            Aras.IOME.ItemCache._findGuidsInValue(old_value, old_depends_set);
            Aras.IOME.ItemCache._findGuidsInKey(keys, old_depends_set);
            this._sub_depends(old_depends_set, keys);
            delete this._items[key];
            return true;
        }
        else {
            return false;
        }
    },
    
    GetItem: function Aras_IOME_ItemCache$GetItem(key) {
        var skey = (key);
        return this._items[skey];
    },
    
    SetItem: function Aras_IOME_ItemCache$SetItem(key, val) {
        return this._setItem_Implementation(key, val);
    },
    
    _setItem_Implementation: function Aras_IOME_ItemCache$_setItem_Implementation(key, val) {
        var skey = (key);
        Aras.IOME.ItemCache._checkThatKeyIsValid(key);
        var new_depends_set = {};
        var old_depends_set = {};
        var to_add_depends;
        var to_sub_depends;
        var old_value = null;
        Aras.IOME.ItemCache._findGuidsInValue(val, new_depends_set);
        Aras.IOME.ItemCache._findGuidsInKey(key, new_depends_set);
        if (Object.keyExists(this._items, skey)) {
            old_value = this._items[skey];
            if (old_value === val) {
                old_value = null;
            }
            else {
                Aras.IOME.ItemCache._findGuidsInValue(old_value, old_depends_set);
                Aras.IOME.ItemCache._findGuidsInKey(key, old_depends_set);
            }
        }
        to_add_depends = Aras.IOME.ItemCache._set_diff(new_depends_set, old_depends_set);
        to_sub_depends = Aras.IOME.ItemCache._set_diff(old_depends_set, new_depends_set);
        this._add_depends(to_add_depends, key);
        this._sub_depends(to_sub_depends, key);
        this._items[skey] = val;
        if (old_value != null) {
            return true;
        }
        else {
            return false;
        }
    },
    
    _add_depends: function Aras_IOME_ItemCache$_add_depends(set, key) {
        var dset;
        var $enum1 = ss.IEnumerator.getEnumerator(Object.keys(set));
        while ($enum1.moveNext()) {
            var item_id = $enum1.current;
            dset = this._dependency[item_id] || null;
            if (dset == null) {
                dset = {};
                this._dependency[item_id] = dset;
            }
            var skey = (key);
            dset[skey] = true;
        }
    },
    
    _sub_depends: function Aras_IOME_ItemCache$_sub_depends(set, key) {
        var dset;
        var $enum1 = ss.IEnumerator.getEnumerator(Object.keys(set));
        while ($enum1.moveNext()) {
            var item_id = $enum1.current;
            var skey = (key);
            dset = this._dependency[item_id];
            if (dset != null) {
                delete dset[skey];
            }
        }
    },
    
    clear: function Aras_IOME_ItemCache$clear() {
        Object.clearKeys(this._items);
        Object.clearKeys(this._dependency);
    },
    
    keys: function Aras_IOME_ItemCache$keys() {
        return Object.keys(this._items);
    },
    
    dependencies: function Aras_IOME_ItemCache$dependencies() {
        return Object.keys(this._dependency);
    },
    
    describeKey: function Aras_IOME_ItemCache$describeKey(key) {
        if (key == null) {
            throw new Error('key');
        }
        var j, n, sum = 0;
        var elem;
        n = key.length;
        if (!n) {
            return '';
        }
        for (j = 0; j < n; ++j) {
            elem = key[j].toString();
            sum = sum + elem.length;
        }
        var sb = new ss.StringBuilder();
        for (j = 0; j < n; ++j) {
            sb.append(key[j]);
            if ((j + 1) < n) {
                sb.append(':');
            }
        }
        return sb.toString();
    },
    
    withinlocker: function Aras_IOME_ItemCache$withinlocker(fcn, arg) {
        if (fcn == null) {
            throw new Error('fcn');
        }
        var retval;
        retval = fcn(arg);
        return retval;
    },
    
    containsKey: function Aras_IOME_ItemCache$containsKey(key) {
        var skey = (key);
        return Object.keyExists(this._items, skey);
    },
    
    GetItemsById: function Aras_IOME_ItemCache$GetItemsById(id) {
        var foundKeyes = this._getKeysContainingId(id);
        var retItems = [];
        var $enum1 = ss.IEnumerator.getEnumerator(foundKeyes);
        while ($enum1.moveNext()) {
            var key = $enum1.current;
            var skey = (key);
            if (Object.keyExists(this._items, skey)) {
                retItems.add(this._items[skey]);
            }
        }
        return retItems;
    },
    
    _getKeysContainingId: function Aras_IOME_ItemCache$_getKeysContainingId(id) {
        var foundKeyes = [];
        if (!ss.isNullOrUndefined(this._dependency[id])) {
            foundKeyes.addRange(Object.keys((this._dependency[id])));
        }
        return foundKeyes;
    },
    
    _sortKeys: function Aras_IOME_ItemCache$_sortKeys(hash) {
        var keys = [];
        var $enum1 = ss.IEnumerator.getEnumerator(Object.keys(hash));
        while ($enum1.moveNext()) {
            var key = $enum1.current;
            keys.add(key);
        }
        var comparator = new Aras.IOME._keyComparator();
        keys.sort(ss.Delegate.create(comparator, comparator.compare));
        return keys;
    }
}


Type.registerNamespace('Aras.IOME.Licensing');

////////////////////////////////////////////////////////////////////////////////
// Aras.IOME.Licensing.ILicenseManagerWebService

Aras.IOME.Licensing.ILicenseManagerWebService = function() { };
Aras.IOME.Licensing.ILicenseManagerWebService.prototype = {
    consumeLicense : null,
    releaseLicense : null,
    getServerInfo : null,
    getFeatureTree : null,
    updateFeatureTree : null,
    importFeatureLicense : null
}
Aras.IOME.Licensing.ILicenseManagerWebService.registerInterface('Aras.IOME.Licensing.ILicenseManagerWebService');


////////////////////////////////////////////////////////////////////////////////
// Aras.IOME.Licensing._iLicenseManagerWebServiceFactory

Aras.IOME.Licensing._iLicenseManagerWebServiceFactory = function() { };
Aras.IOME.Licensing._iLicenseManagerWebServiceFactory.prototype = {
    getLicenseManagerWebService : null
}
Aras.IOME.Licensing._iLicenseManagerWebServiceFactory.registerInterface('Aras.IOME.Licensing._iLicenseManagerWebServiceFactory');


////////////////////////////////////////////////////////////////////////////////
// Aras.IOME.Licensing.LicenseManager

Aras.IOME.Licensing.LicenseManager = function Aras_IOME_Licensing_LicenseManager(serverConnection) {
    if (serverConnection == null) {
        throw new Error('serverConnection');
    }
    try {
        var licenseManagerWebServiceFactory = (serverConnection);
        this._licenseManagerWebService = licenseManagerWebServiceFactory.getLicenseManagerWebService();
    }
    catch ($e1) {
        throw new Error("Current implementation of Aras.IOM.IServerConnection doesn't implement Aras.IOM.ILicenseManagerWebServiceFactory");
    }
}
Aras.IOME.Licensing.LicenseManager.prototype = {
    _licenseManagerWebService: null,
    
    consumeLicense: function Aras_IOME_Licensing_LicenseManager$consumeLicense(featureName) {
        if (String.isNullOrEmpty(featureName)) {
            throw new Error('Feature name must be specified.');
        }
        return this._licenseManagerWebService.consumeLicense(featureName);
    }
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOME.Licensing._licenseManagerWebService

Aras.IOME.Licensing._licenseManagerWebService = function Aras_IOME_Licensing__licenseManagerWebService() {
    this._client = new LicenseManagerWebServiceClient();
}
Aras.IOME.Licensing._licenseManagerWebService.prototype = {
    _client: null,
    
    consumeLicense: function Aras_IOME_Licensing__licenseManagerWebService$consumeLicense(featureName) {
        return this._client.ConsumeLicense(featureName);
    },
    
    releaseLicense: function Aras_IOME_Licensing__licenseManagerWebService$releaseLicense(id) {
        throw new Error('NotImplementedException: ReleaseLicense not implemented');
    },
    
    getServerInfo: function Aras_IOME_Licensing__licenseManagerWebService$getServerInfo() {
        throw new Error('NotImplementedException: GetServerInfo not implemented');
    },
    
    getFeatureTree: function Aras_IOME_Licensing__licenseManagerWebService$getFeatureTree() {
        throw new Error('NotImplementedException: GetFeatureTree not implemented');
    },
    
    updateFeatureTree: function Aras_IOME_Licensing__licenseManagerWebService$updateFeatureTree(encryptedFeatureTree) {
        throw new Error('NotImplementedException: UpdateFeatureTree not implemented');
    },
    
    importFeatureLicense: function Aras_IOME_Licensing__licenseManagerWebService$importFeatureLicense(encryptedFeatureLicense) {
        throw new Error('NotImplementedException: ImportFeatureLicense not implemented');
    }
}


Type.registerNamespace('Aras.IOM.Vault');

////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.Vault._vaultServerTransaction

Aras.IOM.Vault._vaultServerTransaction = function Aras_IOM_Vault__vaultServerTransaction(id, vaultId, vaultUrl) {
    this._id = id;
    this._vaultId = vaultId;
    this._vaultUrl = vaultUrl;
}
Aras.IOM.Vault._vaultServerTransaction.prototype = {
    _vaultId: null,
    _vaultUrl: null,
    _id: null
}


Type.registerNamespace('Aras.SoapConstants');

////////////////////////////////////////////////////////////////////////////////
// Aras.SoapConstants._soap

Aras.SoapConstants._soap = function Aras_SoapConstants__soap() {
}


////////////////////////////////////////////////////////////////////////////////
// Aras.IOM.InnovatorUser

Aras.IOM.InnovatorUser = function Aras_IOM_InnovatorUser() {
}
Aras.IOM.InnovatorUser.get_Current = function Aras_IOM_InnovatorUser$get_Current() {
    return Aras.IOM.InnovatorUser._current || (Aras.IOM.InnovatorUser._current = new Aras.IOM.InnovatorUser());
}
Aras.IOM.InnovatorUser.prototype = {
    
    Init: function Aras_IOM_InnovatorUser$Init(userName, password, dbName, connection, context) {
        this.UserName = userName;
        this.Password = password;
        this.DatabaseName = dbName;
        this.ISConnection = connection;
        this.SessionContext = context;
    },
    
    UserName: null,
    Password: null,
    DatabaseName: null,
    ISConnection: null,
    SessionContext: null
}


StringComparison.registerClass('StringComparison');
CompressionType.registerClass('CompressionType');
RegexOptions.registerClass('RegexOptions');
HttpUtility.registerClass('HttpUtility');
Aras.IOM.HttpConnectionParameters.registerClass('Aras.IOM.HttpConnectionParameters');
Aras.IOM.I18NSessionContext.registerClass('Aras.IOM.I18NSessionContext');
Aras.IOM._innovatorCredentials.registerClass('Aras.IOM._innovatorCredentials');
Aras.IOM.InternalUtils.registerClass('Aras.IOM.InternalUtils');
Aras.IOM.XmlExtension.registerClass('Aras.IOM.XmlExtension');
Aras.IOM.IomFactory.registerClass('Aras.IOM.IomFactory');
Aras.IOM.ServerConnectionBase.registerClass('Aras.IOM.ServerConnectionBase', null, Aras.IOM.IServerConnection);
Aras.IOM.HttpServerConnection.registerClass('Aras.IOM.HttpServerConnection', Aras.IOM.ServerConnectionBase);
Aras.IOM.Innovator.registerClass('Aras.IOM.Innovator');
Aras.IOM.Item.registerClass('Aras.IOM.Item');
Aras.IOM.InnovatorServerConnector.registerClass('Aras.IOM.InnovatorServerConnector', Aras.IOM.ServerConnectionBase, Aras.IOME.Licensing._iLicenseManagerWebServiceFactory);
Aras.IOM._restrictedHttpServerConnection.registerClass('Aras.IOM._restrictedHttpServerConnection', Aras.IOM.HttpServerConnection);
Aras.IOM.WinAuthHttpServerConnection.registerClass('Aras.IOM.WinAuthHttpServerConnection', Aras.IOM.HttpServerConnection);
Aras.Utils.HeaderClientData.registerClass('Aras.Utils.HeaderClientData', null, Aras.Utils.IClientData);
Aras.I18NUtils.Intl.registerClass('Aras.I18NUtils.Intl');
Aras.I18NUtils.ArasNumber.registerClass('Aras.I18NUtils.ArasNumber');
Aras.I18NUtils._i18NConverter.registerClass('Aras.I18NUtils._i18NConverter');
Aras.I18NUtils.I18NSystemInfo.registerClass('Aras.I18NUtils.I18NSystemInfo');
Aras.IOME.CacheableContainer.registerClass('Aras.IOME.CacheableContainer', null, Aras.IOME.ICacheable);
Aras.IOME._keyComparator.registerClass('Aras.IOME._keyComparator');
Aras.IOME.ArrayListComparer.registerClass('Aras.IOME.ArrayListComparer');
Aras.IOME.ItemCache.registerClass('Aras.IOME.ItemCache');
Aras.IOME.Licensing.LicenseManager.registerClass('Aras.IOME.Licensing.LicenseManager');
Aras.IOME.Licensing._licenseManagerWebService.registerClass('Aras.IOME.Licensing._licenseManagerWebService', null, Aras.IOME.Licensing.ILicenseManagerWebService);
Aras.IOM.Vault._vaultServerTransaction.registerClass('Aras.IOM.Vault._vaultServerTransaction');
Aras.SoapConstants._soap.registerClass('Aras.SoapConstants._soap');
Aras.IOM.InnovatorUser.registerClass('Aras.IOM.InnovatorUser');
StringComparison.ordinalIgnoreCase = false;
CompressionType.deflate = 'deflate';
CompressionType.gzip = 'gzip';
CompressionType.none = 'none';
RegexOptions.compiled = '';
RegexOptions.cultureInvariant = '';
RegexOptions.ecmaScript = '';
RegexOptions.explicitCapture = '';
RegexOptions.ignoreCase = 'i';
RegexOptions.ignorePatternWhitespace = '';
RegexOptions.multiline = '';
RegexOptions.none = '';
RegexOptions.rightToLeft = '';
RegexOptions.singleline = '';
Aras.IOM.HttpServerConnection._faultPrototype$1 = Aras.SoapConstants._soap._envelopeBodyStart + '<' + 'SOAP-ENV' + ':Fault>\r\n\t<faultcode>999</faultcode>\r\n\t<faultstring>HTTP Error</faultstring>\r\n\t<faultactor>HttpServerConnection</faultactor>\r\n\t<detail>unknown error</detail>\r\n</' + 'SOAP-ENV' + ':Fault>' + Aras.SoapConstants._soap._envelopeBodyEnd;
Aras.IOM.HttpServerConnection._passwordHashTester$1 = new RegExp('^([0-9A-F]{32})|([0-9A-F]{64})$', RegexOptions.compiled + RegexOptions.ignoreCase);
Aras.IOM.Item.xPathResult = '//Result';
Aras.IOM.Item.xPathResultItem = Aras.IOM.Item.xPathResult + '/Item';
Aras.IOM.Item.xPathFault = "/*[local-name()='Envelope' and (namespace-uri()='http://schemas.xmlsoap.org/soap/envelope/' or namespace-uri()='')]/*[local-name()='Body' and (namespace-uri()='http://schemas.xmlsoap.org/soap/envelope/' or namespace-uri()='')]/*[local-name()='Fault' and (namespace-uri()='http://schemas.xmlsoap.org/soap/envelope/' or namespace-uri()='')]";
Aras.IOM.Item._instantiateWorkflowMessage = "WorkflowMap ID is either 'null' or empty string";
Aras.IOM.Item._theItemIsANewItemErrorMessage = 'The item is a new item';
Aras.IOM.Item._instantiateWorkflowAction = 'instantiateWorkflow';
Aras.IOM.Item._wrongItemStructureException = "Wrong internal structure of the {0}; e.g. item's \"dom\" is not set; or item's \"node\" doesn't " + "belong to the item's \"dom\"; or both \"node\" and \"nodeList\" are null; etc.";
Aras.IOM.InnovatorServerConnector._idRegex$1 = new RegExp('^[0-9A-F]{32}$', RegexOptions.ignoreCase);
Aras.I18NUtils._i18NConverter.datetimE_NEUTRAL_FORMAT = 'yyyy-MM-ddTHH:mm:ss';
Aras.I18NUtils._i18NConverter.datE_NEUTRAL_FORMAT = 'yyyy-MM-dd';
Aras.I18NUtils._i18NConverter.utC_TIMEZONE_NAME = null;
Aras.I18NUtils._i18NConverter._locales = {};
Aras.IOME.ItemCache._guidp = new RegExp('^[0-9A-F]{32}$', RegexOptions.compiled);
Aras.SoapConstants._soap._envelopeBodyStart = '<' + 'SOAP-ENV' + ':Envelope xmlns:' + 'SOAP-ENV' + '="' + 'http://schemas.xmlsoap.org/soap/envelope/' + '" xmlns:' + 'i18n' + '="' + 'http://www.aras.com/I18N' + '"><' + 'SOAP-ENV' + ':Body>';
Aras.SoapConstants._soap._envelopeBodyEnd = '</' + 'SOAP-ENV' + ':Body></' + 'SOAP-ENV' + ':Envelope>';
Aras.SoapConstants._soap._soapNamespaceCheck = "namespace-uri()='" + 'http://schemas.xmlsoap.org/soap/envelope/' + "' or namespace-uri()=''";
Aras.SoapConstants._soap._envelopeXPath = "*[local-name()='Envelope' and (" + Aras.SoapConstants._soap._soapNamespaceCheck + ')]';
Aras.SoapConstants._soap._bodyXPath = "*[local-name()='Body' and (" + Aras.SoapConstants._soap._soapNamespaceCheck + ')]';
Aras.SoapConstants._soap._resultXPath = "*[local-name()='Result' and (" + Aras.SoapConstants._soap._soapNamespaceCheck + ')]';
Aras.SoapConstants._soap._faultXPath = "*[local-name()='Fault' and (" + Aras.SoapConstants._soap._soapNamespaceCheck + ')]';
Aras.SoapConstants._soap._envelopeBodyXPath = Aras.SoapConstants._soap._envelopeXPath + '/' + Aras.SoapConstants._soap._bodyXPath;
Aras.SoapConstants._soap._envelopeBodyResultXPath = Aras.SoapConstants._soap._envelopeBodyXPath + '/' + Aras.SoapConstants._soap._resultXPath;
Aras.SoapConstants._soap._envelopeBodyFaultXPath = Aras.SoapConstants._soap._envelopeBodyXPath + '/' + Aras.SoapConstants._soap._faultXPath;
Aras.IOM.InnovatorUser._current = null;
})();

//! This script was generated using Script# v0.7.4.0
