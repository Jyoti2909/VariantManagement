// (c) Copyright by Aras Corporation, 2004-2009.
/*----------------------------------------
 * FileName: soap_object.js
 *
 * Purpose:
 * Provide a way to comminucate with InnovatorServer using SOAP messages
 *
 */

/// <summary>
/// For internal use only.
/// Stores a set of Soap related constants.
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
var SoapConstants = {};

/// <summary>
/// URI to SOAP 1.1 schema
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.SoapEnvUri = 'http://schemas.xmlsoap.org/soap/envelope/';

/// <summary>
/// Namespace used to return SOAP messages.
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.SoapNamespace = 'SOAP-ENV';

/// <summary>
/// Opening tags Envelope, Body
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.EnvelopeBodyStart =
	'<' +
	SoapConstants.SoapNamespace +
	':Envelope xmlns:' +
	SoapConstants.SoapNamespace +
	'="' +
	SoapConstants.SoapEnvUri +
	'"><' +
	SoapConstants.SoapNamespace +
	':Body>';

/// <summary>
///
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.EnvelopeBodyEnd =
	'</' +
	SoapConstants.SoapNamespace +
	':Body></' +
	SoapConstants.SoapNamespace +
	':Envelope>';

/// <summary>
/// Opening tags Envelope, Body, Fault
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.EnvelopeBodyFaultStart =
	SoapConstants.EnvelopeBodyStart +
	'<' +
	SoapConstants.SoapNamespace +
	':Fault>';

/// <summary>
///
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.EnvelopeBodyFaultEnd =
	'</' +
	SoapConstants.SoapNamespace +
	':Fault>' +
	SoapConstants.EnvelopeBodyEnd;

/// <summary>
/// Check of namespace to be used in XPath
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.SoapNamespaceCheck =
	"namespace-uri()='" + SoapConstants.SoapEnvUri + "' or namespace-uri()=''";

/// <summary>
/// XPath for Envelope
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.EnvelopeXPath =
	"*[local-name()='Envelope' and (" + SoapConstants.SoapNamespaceCheck + ')]';

/// <summary>
/// XPath for Body
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.BodyXPath =
	"*[local-name()='Body' and (" + SoapConstants.SoapNamespaceCheck + ')]';

/// <summary>
/// XPath for Fault
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.FaultXPath =
	"*[local-name()='Fault' and (" + SoapConstants.SoapNamespaceCheck + ')]';

/// <summary>
/// XPath for Envelope/Body
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.EnvelopeBodyXPath =
	SoapConstants.EnvelopeXPath + '/' + SoapConstants.BodyXPath;

/// <summary>
/// XPath for Envelope/Body/Fault
/// </summary>
/// <remarks>
/// </remarks>
/// <history>
/// </history>
SoapConstants.EnvelopeBodyFaultXPath =
	SoapConstants.EnvelopeBodyXPath + '/' + SoapConstants.FaultXPath;

/*
SoapController is designed to manage asynchronous soap requests.
Contains:
callback - function which is called when request is finished
The parameter is passed to constructor.
stop     - readonly parameter. Function which can be used to abort request
*/
function SoapController(callback) {
	this.isInvalid = false;
	this.callback = callback;
	this.stop = null;
}

//marks soap controller instance as invalid. For example when callback is no longer valid (for example when window is closed)
//this will prevent script errors.
SoapController.prototype.markInvalid = function SoapController_markInvalid() {
	this.isInvalid = true;
};

function SOAP(parent) {
	this.parent = parent; //parent aras object
	if (parent.getCurrentLoginName()) {
		ArasModules.soap(null, {
			url: parent.getServerURL(),
			method: 'ApplyItem',
			headers: parent.getHttpHeadersForSoapMessage()
		});
	}
}

SOAP.prototype.send = function SOAP_send(
	methodName,
	bodyStr,
	url,
	saveChanges,
	soapController
) {
	/*----------------------------------------
	 * send
	 *
	 * Purpose:
	 * send xml to InovatorServer and return result.
	 * returns SOAPResults object
	 *
	 * Arguments:
	 * methodName - string with Innovator Server method name (ApplyItem, GetItem, ...)
	 * bodyStr    - xml string to send
	 * url        - url of Innovator Server (by default url is built from this.parent.baseURL)
	 *
	 * soapController - an instance of SoapController
	 */
	var self = this;
	var arasableObj = this.parent;
	if (!arasableObj || methodName === undefined) {
		return null;
	}
	if (
		!arasableObj.getCommonPropertyValue('ignoreSessionTimeoutInSoapSend') &&
		arasableObj.getCommonPropertyValue('exitWithoutSavingInProgress')
	) {
		return new SOAPResults(
			arasableObj,
			getFaultXml('The session is closed.'),
			saveChanges
		);
	}

	var options = { method: methodName };
	if (url) {
		options.url = url;
	}

	var methodXmlns = '';
	if (methodName.indexOf('/') !== -1) {
		methodXmlns = methodName.substring(0, methodName.lastIndexOf('/'));
		methodName = methodName.substring(
			methodName.lastIndexOf('/') + 1,
			methodName.length
		);
	}
	if (methodXmlns) {
		options.methodNm = methodXmlns;
	}
	var soapStr = removeUnchangedPermission(bodyStr || '');

	var async = !!(soapController && soapController.callback);
	options.async = async;
	var promise = ArasModules.soap(soapStr, options);
	if (async) {
		soapController.stop = promise.abort;
	}
	var result;
	promise
		.then(function (resultNode) {
			var text;
			if (resultNode.ownerDocument) {
				var doc = resultNode.ownerDocument;
				text = doc.xml || new XMLSerializer().serializeToString(doc);
			} else {
				text = resultNode;
			}
			var finalRetVal = new SOAPResults(arasableObj, text, saveChanges);
			if (methodName && methodName.toLowerCase() === 'validateuser') {
				arasableObj.setCommonPropertyValue('ValidateUserXmlResult', text);
			}
			if (async) {
				if (!soapController.isInvalid) {
					soapController.callback(finalRetVal);
				}
				return;
			}
			result = finalRetVal;
		})
		.catch(function (xhr) {
			var res = new SOAPResults(arasableObj, xhr.responseText, saveChanges);
			if (async) {
				if (!soapController.isInvalid) {
					soapController.callback(res);
				}
				return;
			}
			result = res;
		});
	return result;

	//function region >>>>>>>>>>>>>>>>>>
	function removeUnchangedPermission(bodyStr) {
		//select all permission_id nodes with attribute origPermission where origPermission
		if (!bodyStr) {
			return bodyStr;
		}
		var workDom = new XmlDocument();
		workDom.loadXML(bodyStr);

		var permissionNodes = workDom.selectNodes(
			"//descendant-or-self::node()[local-name(.) = 'permission_id' and not(child::Item) and @origPermission]"
		);
		if (permissionNodes && permissionNodes.length > 0) {
			for (var i = 0; i < permissionNodes.length; i++) {
				if (
					permissionNodes[i].getAttribute('origPermission') ==
					permissionNodes[i].text
				) {
					var parent = permissionNodes[i].parentNode;
					parent.removeChild(permissionNodes[i]);
				} else {
					permissionNodes[i].removeAttribute('origPermission');
				}
			}
			return workDom.xml;
		}
		return bodyStr;
	}

	function getFaultXml(descr) {
		var faultRetVal =
			SoapConstants.EnvelopeBodyFaultStart +
			'<faultcode>' +
			SoapConstants.SoapNamespace +
			':Server</faultcode><detail>' +
			descr +
			'</detail>' +
			SoapConstants.EnvelopeBodyFaultEnd;
		return faultRetVal;
	}
};

SOAP.handleSessionTimeout = function (options) {
	options = options || {};

	var aras =
		TopWindowHelper.getMostTopWindowWithAras(window).aras || window.opener.aras;
	var mainWnd = aras.getMainWindow();
	if (!mainWnd) {
		return Promise.reject();
	}

	var mainAras = mainWnd.aras;
	if (mainAras._handleSessionTimeoutPromise) {
		return mainAras._handleSessionTimeoutPromise;
	}

	var win = TopWindowHelper.getMostTopWindowWithAras(window);
	var argwin = win.main || win;

	mainWnd.focus();

	const showExitWarning = async function (sessionOptions = {}) {
		const {
			message = aras.getResource('', 'soap_object.session_has_expired')
		} = sessionOptions;
		const options = {
			cancelButtonText: aras.getResource('', 'soap_object.exit_innovator'),
			cancelButtonModifier: 'aras-button_secondary',
			image: null,
			okButtonText: aras.getResource('', 'soap_object.login')
		};

		const result = await ArasModules.Dialog.confirm(message, options);
		if (result === 'ok') {
			return relogin();
		}

		aras.setCommonPropertyValue('exitWithoutSavingInProgress', true);
		if (mainWnd) {
			mainWnd.onLogoutCommand();
		}
		return Promise.reject();
	};

	const relogin = function () {
		aras.browserHelper.toggleSpinner(argwin.document, true);
		return aras.OAuthClient.relogin({
			prompt: 'login', // Force to show login form
			login_hint: aras.user.loginName,
			database: aras.user.database
			// TODO: Pass also authentication_type.
			// Currently we based on user preferences handled by OAuthServer
			// which should contain authentication_type.
			// Possible variant of implementation is
			//   authentication_type: aras.user.authenticationType?
			// for which is necessary to return authentication_type from ValidateUser response.
		})
			.then(function () {
				// Run also user.login to avoid possibility of SessionTimeout errors
				// which will case also login dialog.
				return aras.user.login();
			})
			.then(function () {
				aras.browserHelper.toggleSpinner(argwin.document, false);
			})
			.catch(function () {
				aras.browserHelper.toggleSpinner(argwin.document, false);
				return showExitWarning(options);
			});
	};

	mainAras._handleSessionTimeoutPromise = showExitWarning(options);

	const resetHandleSessionTimeoutPromise = function () {
		delete mainAras._handleSessionTimeoutPromise;
	};
	mainAras._handleSessionTimeoutPromise
		.then(resetHandleSessionTimeoutPromise)
		.catch(resetHandleSessionTimeoutPromise);
	return mainAras._handleSessionTimeoutPromise;
};

SOAP.prototype.parseResponseHeaders = function SOAP_parseResponseHeaders(
	xmlhttp,
	arasableObj
) {};

SOAP.prototype.getDateStamp = function SOAP_getDateStamp() {
	var date = new Date();
	var now = date.getFullYear() + '-';
	if (date.getMonth() < 10) {
		now += '0';
	}
	now += date.getMonth() + '-';
	if (date.getDate() < 10) {
		now += '0';
	}
	now +=
		date.getDate() +
		' ' +
		date.getHours() +
		':' +
		date.getMinutes() +
		':' +
		date.getSeconds() +
		':' +
		date.getMilliseconds();
	return now;
};

///////////////////////////////////////////////////////////////////////////////////////////
// SOAPResults

function SOAPResults(arasableObj, resultsXML, saveChanges) {
	this.arasableObj = arasableObj; //parent aras object

	if (resultsXML) {
		this.results = setOriginalPermissionID(resultsXML);
	} else {
		this.results = arasableObj.createXMLDocument();
	}

	var message = this.getMessage();
	arasableObj.refreshWindows(message, this.results, saveChanges);

	function setOriginalPermissionID(resultsXML) {
		var workDom = arasableObj.createXMLDocument();
		workDom.loadXML(resultsXML);
		//select all nodes "permission_id"
		var permissionNodes = workDom.selectNodes('//permission_id');

		if (permissionNodes && permissionNodes.length > 0) {
			for (var i = 0; i < permissionNodes.length; i++) {
				if (permissionNodes[i].selectSingleNode('./Item') === null) {
					//if it doesn't contain any child nodes - set attribute origPermission = innerText
					permissionNodes[i].setAttribute(
						'origPermission',
						permissionNodes[i].text
					);
				} else {
					//else select id of child Item node and set attribute origPermission = id
					permissionNodes[i].setAttribute(
						'origPermission',
						permissionNodes[i].selectSingleNode('./Item/@id').value
					);
				}
			}
		}
		return workDom;
	}
}

SOAPResults.prototype.__defineGetter__('resultsXML', function () {
	return this.results.xml;
});

SOAPResults.prototype.getResponseText = function () {
	return this.resultsXML;
};

SOAPResults.prototype.getParseError = function () {
	var res;
	if (this.results.parseError.errorCode !== 0) {
		res =
			'*** Wrong SOAP message! *** ' +
			'\n\n' +
			'Error: ' +
			this.results.parseError.srcText.replace('H1', 'H3') +
			'\n' +
			'ErrorCode: ' +
			this.results.parseError.errorCode +
			'\n' +
			'Reason: ' +
			this.results.parseError.reason;
	} else {
		res = undefined;
	}

	return res;
};

SOAPResults.prototype.isFault = function SOAPResults_isFault() {
	if (this.results.parseError.errorCode !== 0) {
		return this.getParseError();
	}

	var fault = this.results.selectSingleNode(
		TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathFault()
	);
	if (fault) {
		return true;
	} else {
		return false;
	}
};

SOAPResults.prototype.getFaultCode = function () {
	if (this.results.parseError.errorCode !== 0) {
		return this.getParseError();
	}

	var faultcode = this.results.selectSingleNode(
		TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathFault(
			'/faultcode'
		)
	);
	if (faultcode) {
		return faultcode.text;
	} else {
		return 0;
	}
};

SOAPResults.prototype.getFaultString = function () {
	if (this.results.parseError.errorCode !== 0) {
		return this.getParseError();
	}

	var faultstring = this.results.selectSingleNode(
		TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathFault(
			'/faultstring'
		)
	);
	if (faultstring) {
		return faultstring.text;
	} else {
		return '';
	}
};

SOAPResults.prototype.getFaultActor = function () {
	if (this.results.parseError.errorCode !== 0) {
		return this.getParseError();
	}

	var faultactor = this.results.selectSingleNode(
		TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathFault(
			'/detail/legacy_faultactor'
		)
	);
	if (faultactor) {
		return faultactor.text;
	} else {
		return '';
	}
};

SOAPResults.prototype.getFaultDetails = function () {
	if (this.results.parseError.errorCode !== 0) {
		return this.getParseError();
	}

	var detail = this.results.selectSingleNode(
		TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathFault('/detail')
	);
	var msg = '';
	if (detail) {
		msg = detail.text; //.replace(/^.+\]/,'');
		//    msg = msg.replace(/,.+$/,'');
	}
	return msg;
};

SOAPResults.prototype.getServerMessage = function SOAPResults_getServerMessage() {
	var faultNd = this.results.selectSingleNode(
		TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathFault()
	);
	if (faultNd && faultNd.parentNode) {
		var serverMessageNd = faultNd.parentNode.selectSingleNode('server_message');
		if (serverMessageNd) {
			return serverMessageNd.xml;
		}
	}
};

SOAPResults.prototype.getResultsBody = function () {
	var res = this.getResult();
	var items = res.selectNodes('Item');
	return items.length == 1 ? items[0].xml : res.xml;
};

SOAPResults.prototype.getResult = function () {
	var res = null;
	if (this.results && this.results.documentElement) {
		res = this.results.selectSingleNode(
			TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathResult()
		);
	}

	if (!res) {
		var subst = this.arasableObj.createXMLDocument();
		subst.loadXML(
			SoapConstants.EnvelopeBodyStart +
				'<Result />' +
				SoapConstants.EnvelopeBodyEnd
		);
		res = subst.documentElement.selectSingleNode(
			TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathResult()
		);
	}

	return res;
};

SOAPResults.prototype.getMessage = function () {
	var res = null;
	if (this.results && this.results.documentElement) {
		res = this.results.selectSingleNode(
			TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathMessage()
		);
	}

	if (!res) {
		var subst = new XmlDocument();
		subst.loadXML(
			SoapConstants.EnvelopeBodyStart +
				'<Message />' +
				SoapConstants.EnvelopeBodyEnd
		);
		res = subst.documentElement.selectSingleNode(
			TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathMessage()
		);
	}

	return res;
};

SOAPResults.prototype.getMessageValue = function SOAPResults_getMessageValue(
	key
) {
	var msg;
	if (this.isFault()) {
		msg = this.results.selectSingleNode(
			TopWindowHelper.getMostTopWindowWithAras(window).aras.XPathFault(
				"/detail/message[@key='" + key + "']"
			)
		);
	} else {
		var nd = this.getMessage();
		if (nd) {
			msg = nd.selectSingleNode("event[@name='" + key + "']");
		}
	}

	return msg ? msg.getAttribute('value') : undefined;
};
