/*
 * $Id: base64.js,v 2.15 2014/04/05 12:58:57 dankogai Exp dankogai $
 *
 *  Licensed under the MIT license.
 *    http://opensource.org/licenses/mit-license
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */

//!important, keep ; before to avoid Uncaught TypeError: {(intermediate value)(intermediate value)(intermediate value)(intermediate value)} is not a function
;(function(global) {
	'use strict';
	// existing version for noConflict()
	var _Base64 = global.Base64;
	var version = "2.1.9";
	// if node.js, we use Buffer
	var buffer;
	if (typeof module !== 'undefined' && module.exports) {
		try {
			buffer = require('buffer').Buffer;
		} catch (err) { }
	}
	// constants
	var b64chars
			= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	var b64tab = function(bin) {
		var t = {};
		for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
		return t;
	}(b64chars);
	var fromCharCode = String.fromCharCode;
	// encoder stuff
	var cb_utob = function(c) {
		if (c.length < 2) {
			var cc = c.charCodeAt(0);
			return cc < 0x80 ? c
					: cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
													+ fromCharCode(0x80 | (cc & 0x3f)))
					: (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
						 + fromCharCode(0x80 | ((cc >>> 6) & 0x3f))
						 + fromCharCode(0x80 | (cc & 0x3f)));
		} else {
			var cc = 0x10000
					+ (c.charCodeAt(0) - 0xD800) * 0x400
					+ (c.charCodeAt(1) - 0xDC00);
			return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
							+ fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
							+ fromCharCode(0x80 | ((cc >>> 6) & 0x3f))
							+ fromCharCode(0x80 | (cc & 0x3f)));
		}
	};
	var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
	var utob = function(u) {
		return u.replace(re_utob, cb_utob);
	};
	var cb_encode = function(ccc) {
		var padlen = [0, 2, 1][ccc.length % 3],
		ord = ccc.charCodeAt(0) << 16
				| ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
				| ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
		chars = [
				b64chars.charAt(ord >>> 18),
				b64chars.charAt((ord >>> 12) & 63),
				padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
				padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
		];
		return chars.join('');
	};
	var btoaiz = global.btoaiz ? function(b) {
		return global.btoaiz(b);
	} : function (b) {
		return unescape(encodeURIComponent(b)).replace(/[\s\S]{1,3}/g, cb_encode);
	};
	var _encode = buffer ? function(u) {
		return (u.constructor === buffer.constructor ? u : new buffer(u))
		.toString('base64')
	}
	: function(u) { return btoaiz(utob(u)) }
	;
	var encode = function(u, urisafe) {
		return !urisafe
				? _encode(String(u))
				: _encode(String(u)).replace(/[+\/]/g, function(m0) {
					return m0 == '+' ? '-' : '_';
				}).replace(/=/g, '');
	};
	var encodeURI = function(u) { return encode(u, true) };
	// decoder stuff
	var re_btou = new RegExp([
			'[\xC0-\xDF][\x80-\xBF]',
			'[\xE0-\xEF][\x80-\xBF]{2}',
			'[\xF0-\xF7][\x80-\xBF]{3}'
	].join('|'), 'g');
	var cb_btou = function(cccc) {
		switch (cccc.length) {
			case 4:
				var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
						| ((0x3f & cccc.charCodeAt(1)) << 12)
						| ((0x3f & cccc.charCodeAt(2)) << 6)
						| (0x3f & cccc.charCodeAt(3)),
				offset = cp - 0x10000;
				return (fromCharCode((offset >>> 10) + 0xD800)
								+ fromCharCode((offset & 0x3FF) + 0xDC00));
			case 3:
				return fromCharCode(
						((0x0f & cccc.charCodeAt(0)) << 12)
								| ((0x3f & cccc.charCodeAt(1)) << 6)
								| (0x3f & cccc.charCodeAt(2))
				);
			default:
				return fromCharCode(
						((0x1f & cccc.charCodeAt(0)) << 6)
								| (0x3f & cccc.charCodeAt(1))
				);
		}
	};
	var btou = function(b) {
		return b.replace(re_btou, cb_btou);
	};
	var cb_decode = function(cccc) {
		var len = cccc.length,
		padlen = len % 4,
		n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
				| (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
				| (len > 2 ? b64tab[cccc.charAt(2)] << 6 : 0)
				| (len > 3 ? b64tab[cccc.charAt(3)] : 0),
		chars = [
				fromCharCode(n >>> 16),
				fromCharCode((n >>> 8) & 0xff),
				fromCharCode(n & 0xff)
		];
		chars.length -= [0, 0, 2, 1][padlen];
		return chars.join('');
	};
	var atobiz = global.atobiz ? function(a) {
		return global.atobiz(a);
	} : function (a) {
		return decodeURIComponent(escape(a.replace(/[\s\S]{1,4}/g, cb_decode)));
	};
	var _decode = buffer ? function(a) {
		return (a.constructor === buffer.constructor
						? a : new buffer(a, 'base64')).toString();
	}
	: function(a) { return btou(atobiz(a)) };
	var decode = function(a) {
		return _decode(
				String(a).replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
						.replace(/[^A-Za-z0-9\+\/]/g, '')
		);
	};
	var noConflict = function() {
		var Base64 = global.Base64;
		global.Base64 = _Base64;
		return Base64;
	};
	// export Base64
	global.Base64 = {
		VERSION: version,
		atobiz: atobiz,
		btoaiz: btoaiz,
		fromBase64: decode,
		toBase64: encode,
		utob: utob,
		encode: encode,
		encodeURI: encodeURI,
		btou: btou,
		decode: decode,
		noConflict: noConflict
	};
	// if ES5 is available, make Base64.extendString() available
	if (typeof Object.defineProperty === 'function') {
		var noEnum = function(v) {
			return { value: v, enumerable: false, writable: true, configurable: true };
		};
		global.Base64.extendString = function() {
			Object.defineProperty(
					String.prototype, 'fromBase64', noEnum(function() {
						return decode(this)
					}));
			Object.defineProperty(
					String.prototype, 'toBase64', noEnum(function(urisafe) {
						return encode(this, urisafe)
					}));
			Object.defineProperty(
					String.prototype, 'toBase64URI', noEnum(function() {
						return encode(this, true)
					}));
		};
	}
	// that's it!
	if (global['Meteor']) {
		Base64 = global.Base64; // for normal export in Meteor.js
	}

	if (!global.atobiz)
		global.atobiz = atobiz;
	if (!global.btoaiz)
		global.btoaiz = btoaiz;
})(this);

//------------------------------------------------------------------------------------------------

function TaskExistenceRequest(taskId) {
  var requestString = 'wscmd=taskexists&wsarg0=' + taskId;
  AjaxRequest('./rs.aspx', requestString, TaskExistenceResult, null, 'taskexistencerequest' + taskId);
}

function TaskExistenceResult(returnObj, id) {
	if (id.indexOf('taskexistencerequest') != 0) {
		setTimeout(function() { TaskExistenceRequest(returnObj.AdditionalData[0]); }, 2000);
		return;
	}
	var taskId = id.substring(20);
	var activeTaskIndex = responseServer.CurrentlyActiveExportTasks.indexOf(taskId);
	if (activeTaskIndex >= 0) {
		responseServer.CurrentlyActiveExportTasks.splice(activeTaskIndex, 1);
		responseServer.CurrentlyActiveExportUrls.splice(activeTaskIndex, 1);
	}
	if (returnObj != undefined && returnObj != null && returnObj.Value != null) {
		if (returnObj.Value == 'true' && returnObj.AdditionalData != undefined && returnObj.AdditionalData.length > 0 && returnObj.AdditionalData[0] == taskId) {
			if (returnObj.AdditionalData.length == 1) {
				setTimeout(function() { TaskExistenceRequest(returnObj.AdditionalData[0]); }, 2000);
				return;
			}
			else {
				ReportingServices.showOk(returnObj.AdditionalData.length > 2
					? returnObj.AdditionalData[2]
					: 'Response canceled: ' + returnObj.AdditionalData[1]);
					return;
			}
		}
	}
	ReportingServices.hideTip();
}

function StartTimer(doc) {
  if (doc.readyState == 'complete' || doc.readyState == 'interactive') {
  	ReportingServices.hideTip();
    return;
  }
  setTimeout(function() { StartTimer(doc); }, 500);
}

AdHoc.ResponseServer = function (url, timeOut) {
    this.ResponseServerUrl = url;
    this.TimeOut = null;
    if (timeOut != null)
        this.TimeOut = timeOut * 1000;
}

AdHoc.ResourcesProvider = function (url, timeOut) {
	this.ResourcesProviderUrl = url;
	this.TimeOut = null;
	if (timeOut != null)
		this.TimeOut = timeOut * 1000;
}

AdHoc.ResponseServer.InnerCallback = function(callbackFunction, url, xmlHttpRequest, arg, additionalData)
{
	if (!xmlHttpRequest || xmlHttpRequest.readyState!=4)
		return;
	if (callbackFunction!=null)
		callbackFunction(url, xmlHttpRequest, arg, additionalData);
}
	
AdHoc.ResponseServer.CreateXmlHttpRequest = function()
{
	var result;
	if(typeof(XMLHttpRequest)!='undefined')
	{
		result = new XMLHttpRequest();
	}
	else
	{
		var versions = [
		"Msxml2.XMLHTTP.7.0",
		"Msxml2.XMLHTTP.6.0",
		"Msxml2.XMLHTTP.5.0",
		"Msxml2.XMLHTTP.4.0",
		"MSXML2.XMLHTTP.3.0",
		"MSXML2.XMLHTTP",
		"Microsoft.XMLHTTP"];
		var request = null;
		for (var i=0; i<versions.length; i++)
		{
			try
			{
				result =  new ActiveXObject(versions[i]);
				if (request)
					break;
			}
			catch (e) {}
		}
	}
	if (this.TimeOut != null)
		result.timeout = TimeOut;
	return result;
}

AdHoc.ResponseServer.BeforeSubmitHandlers = new Array();
AdHoc.ResponseServer.AfterSubmitHandlers = new Array();

AdHoc.ResponseServer.RegisterBeforeSubmitHandler = function(handler) {
	if (AdHoc.ResponseServer.BeforeSubmitHandlers!=null) {
		var handlers = AdHoc.ResponseServer.BeforeSubmitHandlers;
		var contains = false;
		for (var i=0;i<handlers.length;i++)
			if (handlers[i] == handler)
				contains = true;
		if (!contains) handlers.push(handler);
	}
}
	
AdHoc.ResponseServer.RegisterAfterSubmitHandler = function(handler) {
	if (AdHoc.ResponseServer.AfterSubmitHandlers!=null) {
		var handlers = AdHoc.ResponseServer.AfterSubmitHandlers;
		var contains = false;
		for (var i=0;i<handlers.length;i++)
			if (handlers[i] == handler)
				contains = true;
		if (!contains) handlers.push(handler);
	}
}

AdHoc.ResponseServer.UnregisterAllSubmitHandlers = function() {
	if (AdHoc.ResponseServer.AfterSubmitHandlers!=null) {
		AdHoc.ResponseServer.AfterSubmitHandlers = new Array();
	}
	if (AdHoc.ResponseServer.BeforeSubmitHandlers!=null) {
		AdHoc.ResponseServer.BeforeSubmitHandlers = new Array();
	}
}
	
AdHoc.ResponseServer.CallBeforeSubmitHandlers = function() {
	if (AdHoc.ResponseServer.BeforeSubmitHandlers != null) {
		var handlers = AdHoc.ResponseServer.BeforeSubmitHandlers;
		for (var i  = 0; i < handlers.length; i++)
		{
			if (typeof(handlers[i])=="function")
				handlers[i]();
			else
				eval(handlers[i]);
		}
		return true;
	}
	return false;
}
	
AdHoc.ResponseServer.CallAfterSubmitHandlers = function() {
	if (AdHoc.ResponseServer.AfterSubmitHandlers != null) {
		var handlers = AdHoc.ResponseServer.AfterSubmitHandlers;
		for (var i  = 0; i < handlers.length; i++)
			if (typeof(handlers[i])=="function")
				handlers[i](true);
			else
				eval(handlers[i]);
		return true;
	}
	return false;
}

function GenerateGuid() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function AddEventListener(e, o, callback) {
	if (o["addEventListener"])
		o.addEventListener(e, callback, false);
	else if (o["attachEvent"])
		o.attachEvent("on" + e, callback);
}

AdHoc.ResponseServer.prototype =
{
	XmlHttpFormSubmit: function (form) {
		if (typeof blockNetworkActivity != 'undefined' && blockNetworkActivity)
			return;
    AdHoc.ResponseServer.CallBeforeSubmitHandlers();
    var data = Form.serialize(form);
    var url = form.action;

	const urlWithParams = extendUrlWithSSRParams(url, true);
	url = urlWithParams.url + '?' + urlWithParams.params + '&hideall=true';

    var xmlHttpRequest = AdHoc.ResponseServer.CreateXmlHttpRequest();
	xmlHttpRequest.open("POST", url, false);
	xmlHttpRequest.setRequestHeader(urlWithParams.authorizationHeaderName, urlWithParams.authorizationHeaderValue);
    xmlHttpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttpRequest.send(data);
    AdHoc.ResponseServer.CallAfterSubmitHandlers();
  },

  RequestData: function (url, callbackFunction, async, formId, arg, RequestData, additionalData) {
  	if (typeof blockNetworkActivity != 'undefined' && blockNetworkActivity)
  		return;
    if (async == null)
      async = true;
    if (formId != null) {
      var form = document.getElementById(formId);
      if (form != null)
        this.XmlHttpFormSubmit(form);
    }
    //var fullUrl = this.responseServerUrl + url;	
    var xmlHttpRequest = AdHoc.ResponseServer.CreateXmlHttpRequest();
    var originalUrl = url;
    if (async)
    	xmlHttpRequest.onreadystatechange = function () { AdHoc.ResponseServer.InnerCallback(callbackFunction, originalUrl, xmlHttpRequest, arg, additionalData); };
    else
    	xmlHttpRequest.onreadystatechange = function () { };

    /*var sepInd = url.indexOf("?");
    if (sepInd >= 0) {
      var urlParams = url.substr(sepInd + 1);
      url = url.substr(0, sepInd);
    }*/

	const urlWithParams = extendUrlWithSSRParams(url, true);

	xmlHttpRequest.open("POST", urlWithParams.url, async);
	xmlHttpRequest.setRequestHeader(urlWithParams.authorizationHeaderName, urlWithParams.authorizationHeaderValue);
    xmlHttpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlHttpRequest.send(urlWithParams.params);
    if (!async) {
      AdHoc.ResponseServer.InnerCallback(callbackFunction, urlWithParams.url, xmlHttpRequest, arg, additionalData);
      return xmlHttpRequest.responseText;
    }
  },

  RequestDataOnData: function (url, callbackFunction, async, formId, arg, RequestData, additionalData, commandData) {
  	if (typeof blockNetworkActivity != 'undefined' && blockNetworkActivity)
  		return;
    if (async == null)
      async = true;
    if (formId != null) {
      var form = document.getElementById(formId);
      if (form != null)
        this.XmlHttpFormSubmit(form);
    }
    //var fullUrl = this.responseServerUrl + url;	
    var xmlHttpRequest = AdHoc.ResponseServer.CreateXmlHttpRequest();
    if (async)
      xmlHttpRequest.onreadystatechange = function() { AdHoc.ResponseServer.InnerCallback(callbackFunction, url, xmlHttpRequest, arg, additionalData); };
    else
    	xmlHttpRequest.onreadystatechange = function () { };

	const urlWithParams = extendUrlWithSSRParams(url, true);
	url = urlWithParams.url + '?' + urlWithParams.params;

	xmlHttpRequest.open("POST", url, async);
	xmlHttpRequest.setRequestHeader(urlWithParams.authorizationHeaderName, urlWithParams.authorizationHeaderValue);
    xmlHttpRequest.send(commandData);
    if (!async) {
      AdHoc.ResponseServer.InnerCallback(callbackFunction, url, xmlHttpRequest, arg, additionalData);
      return xmlHttpRequest.responseText;
    }
  },

  SwitchDatasourcesMode: function (urlParams, mode, formClientID)
  {
    var afterRequestCallback = function (url, xmlHttpRequest)
    {
      if (xmlHttpRequest.responseText != 'OK')
        alert(xmlHttpRequest.responseText);
      else
      {
        var m = document.getElementById('JTCS_DataSourceTabModeHF');
        if (m != null)
          m.value = mode;
        theForm.onsubmit = function () {
          for (i = 0; i < theForm.length; i++) {
            if (theForm[i].getAttribute('htmlallowed') == 'true')
              if (theForm[i].value)
                theForm[i].value = theForm[i].value.escapeHtml();
          }
          return true;
        }
        __doPostBack(this.id, '');
      }
    }
    theForm.hidden = true;
    ReportingServices.showLoading({ title: jsResources.Loading });
    responseServer.RequestData(responseServer.ResponseServerUrl + urlParams, afterRequestCallback, true, formClientID);
  },

  ExecuteCommand: function(command, params, async, callBackFunction, arg, additionalData) {
    var url = this.ResponseServerUrl + "cmd=" + command + "&" + params;
    this.RequestData(url, callBackFunction, async, null, arg, null, additionalData);
  },

  ExecuteCommandOnData: function(command, params, async, callBackFunction, arg, additionalData, commandData) {
    var url = this.ResponseServerUrl + "cmd=" + command + "&" + params;
    this.RequestDataOnData(url, callBackFunction, async, null, arg, null, additionalData, commandData);
  },

  OpenUrl: function (url, formId, frameName, rsUrl, returnWindow) {
		const urlWithParams = extendUrlWithSSRParams(url);
		url = urlWithParams.url + '?' + urlWithParams.params;

		if (typeof utility != 'undefined') {
			var query = utility.queryString();
			if (query && query.rn)
  			url += "&refrn=" + query.rn;
		}

		if (responseServer.CurrentlyActiveExportUrls.indexOf(url) >= 0)
			return;

		if (formId != null) {
			var form = document.getElementById(formId);
			if (form != null)
				responseServer.XmlHttpFormSubmit(form);
		}

		responseServer.CurrentlyActiveExportUrls.push(url);
		responseServer.CurrentlyActiveExportTasks.push('print');

		var newWindow = window.open(url, frameName);
		AddEventListener('load', newWindow, function () {
			if (newWindow.location.href != 'about:blank') {
				var activeUrlIndex = responseServer.CurrentlyActiveExportUrls.indexOf(url);
				if (activeUrlIndex >= 0) {
					responseServer.CurrentlyActiveExportTasks.splice(activeUrlIndex, 1);
					responseServer.CurrentlyActiveExportUrls.splice(activeUrlIndex, 1);
				}
			}
		});
		if (returnWindow)
			return newWindow;
	},

	OpenUrlWithModalDialog: function(url, formId, frameName) {
		ReportingServices.showLoading();
		if (formId != null) {
			var form = document.getElementById(formId);
			if (form != null)
				responseServer.XmlHttpFormSubmit(form);
		}

		const urlWithParams = extendUrlWithSSRParams(url);
		url = urlWithParams.url + '?' + urlWithParams.params;

		if (typeof utility != 'undefined') {
			var query = utility.queryString();
			if (query && query.rn)
				url += "&refrn=" + query.rn;
		}

		var wnd = window.open(url, frameName);
		StartTimer(wnd.document);
	},

	OpenUrlWithModalDialogNewCustomRsUrl: function (url, formId, frameName) {
		var openUrlWithModalDialogInternal = function (url, formId, frameName)
		{
			ReportingServices.showLoading({
				tipStyle: "background-color: #eee; display: table; border-collapse: separate; border-spacing: 8px;",
				containerStyle: "background-color: #fff; border: solid #AAAAAA 1px; text-align: center; vertical-align: middle; color: #1D5987; font: 14pt verdana; display: table-cell;",
				width: 160, height: 100
			});
			if (formId != null) {
				var form = document.getElementById(formId);
				if (form != null) {
					responseServer.XmlHttpFormSubmit(form);
				}
			}

			const urlWithParams = extendUrlWithSSRParams(url);
			url = urlWithParams.url + '?' + urlWithParams.params;

			var taskId = GenerateGuid();
			responseServer.CurrentlyActiveExportUrls.push(url);
			responseServer.CurrentlyActiveExportTasks.push(taskId);

			if (typeof utility != 'undefined') {
				var query = utility.queryString();
				if (query && query.rn)
					url += "&refrn=" + query.rn;
			}

			window.open(url + '&taskId=' + taskId, frameName);
			setTimeout(function () { TaskExistenceRequest(taskId); }, 1000);
		}
		var showBulkCsvUnsupportedFormatWarning = function() {
			var warningElement = document.createElement('div');
			warningElement.align = "left";
			warningElement.innerHTML =
				"<div>" + jsResources.CsvBulkUnsupportFormatsWarning + "</div>" +
				"<label style = 'display : inline-block; padding-top : 10px;'><input type='checkbox'>" + jsResources.DoNotShowThisDialogAgain + "</label>";
			var warningContext = utility.defaults({
					buttons: [
						{
							value: jsResources.OK,
							onclick: function () {
								var doNotShowAgain = warningElement.querySelector('input');
								if (doNotShowAgain && doNotShowAgain.checked) {
									var date = new Date;
									date.setDate(date.getDate() + 365);
									var cookieOptions = { expires: date }
									AdHoc.Utility.SetCookie("izendaHideCsvBulkUnsupportedFormatWarning",
										"true",
										cookieOptions);
								}
								openUrlWithModalDialogInternal(url, formId, frameName);
							}
						},
						{ value: jsResources.Cancel, onclick: function () { return; } }
					],
					callback: function () { openUrlWithModalDialogInternal(url, formId, frameName) },
					showCaption: true,
					title: jsResources.Warning,
					containerStyle: "padding: 7px; margin: 0; font-family: Verdana; font-size: 12px; white-space: pre-wrap; height : 70",
					maxWidth: 500
				},
				null,
				true);


			ReportingServices.showModal(warningElement, warningContext);

		}
		var bulkCsvWithUnsupportedFormats = function(url, formId) {
			if (url.indexOf("output=BULKCSV") === -1) return false;

			var form = document.getElementById(formId);
			if (form != null) {
				if (typeof sc_tables != 'undefined' && sc_tables) {
					var selectedFormats = new Array();
					for (var tableId in sc_tables) {
						selectedFormats = selectedFormats.concat(SC_GetSelectedFormats(tableId));
					}
					var groupFormats = ["PercentOfGroupWithRounding", "PercentOfGroup", "Gauge", "GaugeVariable", "GaugeDashboard"];
					var selectedGroupFormats = groupFormats.filter(function (n) {
						return selectedFormats.indexOf(n) !== -1;
					});
					if (selectedGroupFormats.length > 0) {
						return true;
					}
				}
			} else if (nrvConfig && nrvConfig.HasAggregateFormats) {
				return true;
			}
			return false;

		}

		if (responseServer.CurrentlyActiveExportUrls.indexOf(url) >= 0)
			return;
		var isBulkCsvWithUnsupportedFormats = bulkCsvWithUnsupportedFormats(url, formId);
		var hideCsvWarning = AdHoc.Utility.GetCookie("izendaHideCsvBulkUnsupportedFormatWarning");
		if (isBulkCsvWithUnsupportedFormats && !hideCsvWarning) {
			showBulkCsvUnsupportedFormatWarning();
			return;
		}
		openUrlWithModalDialogInternal(url, formId, frameName);
	},

	OpenUrlWithModalDialogNew: function(url, formId, frameName) {
		responseServer.OpenUrlWithModalDialogNewCustomRsUrl(url, formId, frameName);
	},

	CurrentlyActiveExportUrls: [],
	CurrentlyActiveExportTasks: []
}

//-------------------------------------------------------------------------------------
var Form = {
	serialize: function(form) {
		var elements = Form.getElements(form);
		var queryComponents = new Array();
		for (var i = 0; i < elements.length; i++) {
			var queryComponent = Form.Element.serialize(elements[i]);
			if (queryComponent) {
			    queryComponents.push(queryComponent);
			}
		}

		return queryComponents.join("&");
	},

	getElements: function(form) {
		var elements = new Array();

		for (tagName in Form.Element.Serializers) {
			var tagElements = form.getElementsByTagName(tagName);
			for (var j = 0; j < tagElements.length; j++)
				elements.push(tagElements[j]);
		}
		return elements;
	},

	getInputs: function(form, typeName, name) {
		var inputs = form.getElementsByTagName('input');

		if (!typeName && !name)
			return inputs;

		var matchingInputs = new Array();
		for (var i = 0; i < inputs.length; i++) {
			var input = inputs[i];
			if ((typeName && input.type != typeName) ||
					(name && input.name != name))
				continue;
			matchingInputs.push(input);
		}

		return matchingInputs;
	}
}

Form.Element = {
	serialize: function(element) {
		var method = element.tagName.toLowerCase();
		var parameter = Form.Element.Serializers[method](element);
        var name = element.name;

		if (parameter) {
			var key = encodeURIComponent(parameter[0]);
			//if(key=="__VIEWSTATE") return;
			if (key.length == 0) return;

			//if (parameter[1].constructor != Array)
			//	parameter[1] = [parameter[1]];

			/*return parameter[1].map(function(value) {
				return key + '=' + encodeURIComponent(value);
			}).join('&');*/

			var par = parameter[1];
			if (element.getAttribute('htmlallowed') == 'true')
				par = par.escapeHtml();

			return key + '=' + encodeURIComponent(par);
		}
	},

	getValue: function(element) {
		var method = element.tagName.toLowerCase();
		var parameter = Form.Element.Serializers[method](element);

		if (parameter)
			return parameter[1];
	}
}

Form.Element.Serializers = {
	input: function(element) {
		switch (element.type.toLowerCase()) {
			case 'submit':
			case 'hidden':
			case 'password':
			case 'text':
				return Form.Element.Serializers.textarea(element);
			case 'checkbox':
			case 'radio':
				return Form.Element.Serializers.inputSelector(element);
		}
		return false;
	},

	inputSelector: function(element) {
		if (element.checked)
			return [element.name, element.value];
	},

	textarea: function(element) {
		return [element.name, element.value];
	},

	select: function(element) {
		return Form.Element.Serializers[element.type == 'select-one' ?
			'selectOne' : 'selectMany'](element);
	},

	selectOne: function(element) {
		var value = '', opt, index = element.selectedIndex;
		if (index >= 0) {
			opt = element.options[index];
			value = opt.value;
			if (!value && !('value' in opt))
				value = opt.text;
		}
		return [element.name, value];
	},

	selectMany: function(element) {
		var value = new Array();
		for (var i = 0; i < element.length; i++) {
			var opt = element.options[i];
			if (opt.selected) {
				var optValue = opt.value;
				if (!optValue && !('value' in opt))
					optValue = opt.text;
				value.push(optValue);
			}
		}
		return [element.name, value];
	}
}
//---------------------------------------------------------------------------------
// Other functions
if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    }
}
//---------------------------------------------------------------------------------