import { soap, SyncPromise } from './Soap';
import { xmlToJson } from './XmlToJson';
import alertModule from '../components/alert';

const globalConfig = {};

function sessionSoap(data, options = {}) {
	if (data === null) {
		Object.assign(globalConfig, options);
		soap(data, options);
		return;
	}

	const topWnd = TopWindowHelper.getMostTopWindowWithAras(window);
	const aras = window.aras || topWnd.aras || window.opener.aras;

	if (checkIfNeedCredentials(options, aras)) {
		options.credentials = true;
	}

	const OAuthClient = aras.OAuthClient;
	const updatedHeaders = Object.assign(
		globalConfig.headers || {},
		OAuthClient.getAuthorizationHeader()
	);
	Object.assign(globalConfig, { headers: updatedHeaders });

	const config = {};
	Object.assign(config, globalConfig, options);
	const promise = soap(data, options);

	const result = promise.catch(function (request) {
		// SharePoint Integration hack
		// We need to support windows authorization on sharepoint server
		// If server side HttpRequest failed with code 401(Unauthorized) then add special header to response,
		// which tell to client, that it must redirect request to the page with integrated windows authorization
		// Other bug with XmlHttpRequest ActiveX: if in ASP.NET used Response.Redirect, then POST request transform to the GET
		// request and redirect it to new url
		if (
			request.getResponseHeader('IE.Bug.PostRequestMustRedirectedManualy') ===
			'1'
		) {
			options.url = config.url.replace(
				'InnovatorServer.aspx',
				request.getResponseHeader('IE.Bug.RedirectToUrl')
			);
			options.headers = options.headers || {};
			options.headers.IsRedirected = '1';

			return soap(data, options).catch(function (request) {
				// SharePoint Integration hack
				// Support WindowsAuthenticationPrefered type
				// When WinAuth failed, then we must to use dedicated user credentials. So send request to the page, which from we redirected before
				// And force dedicated user authentication by include new request header, which tell server side code then that winauth is failed
				if (request.status == 401) {
					options.url = config.url;
					return soap(data, options);
				}
			});
		}

		if (request.status === 200) {
			const obj = xmlToJson(
				request.responseXML.firstChild.firstChild.firstChild
			);
			if (
				obj.faultcode === 'SOAP-ENV:Server.Authentication.SessionTimeout' &&
				!topWnd.aras.getCommonPropertyValue('ignoreSessionTimeoutInSoapSend')
			) {
				const soap = window.SOAP || topWnd.SOAP || window.opener.SOAP;
				const message = aras.getResource('', 'soap_object.session_has_expired');
				const sessionPromise = soap.handleSessionTimeout({
					message: message
				});
				if (options.async) {
					return sessionPromise.then(function () {
						return sessionSoap(data, options);
					});
				}
			}
		}

		if (request.status === OAuthClient.unauthorizedStatusCode) {
			const soap = window.SOAP || topWnd.SOAP || window.opener.SOAP;
			const message = aras.getResource('', 'soap_object.unauthorized_error');
			const sessionPromise = soap.handleSessionTimeout({
				message: message
			});
			if (options.async) {
				return sessionPromise.then(function () {
					return sessionSoap(data, options);
				});
			}
			return SyncPromise.reject(generateAuthorizationFaultError(message));
		}

		return (config.async ? Promise : SyncPromise).reject(request);
	});
	result.abort = promise.abort;
	return result;
}

function alertSoapError(xhr) {
	const topWnd = TopWindowHelper.getMostTopWindowWithAras(window);
	const aras = window.aras || topWnd.aras || window.opener.aras;
	const res = new SOAPResults(aras, xhr.responseText);
	return alertModule('', {
		type: 'soap',
		data: res
	});
}

function generateAuthorizationFaultError(message) {
	const topWnd = TopWindowHelper.getMostTopWindowWithAras(window);

	const description =
		'Status: ' +
		topWnd.aras.OAuthClient.unauthorizedStatusCode +
		'. Unauthorized access';
	const errorText =
		topWnd.SoapConstants.EnvelopeBodyFaultStart +
		'<faultcode>' +
		topWnd.SoapConstants.SoapNamespace +
		':Server</faultcode><detail>' +
		description +
		'</detail>' +
		'<faultstring>' +
		message +
		'</faultstring>' +
		topWnd.SoapConstants.EnvelopeBodyFaultEnd;
	const errorResponse = {
		responseText: errorText
	};

	return errorResponse;
}

function checkIfNeedCredentials(soapRequestOptions, aras) {
	const serverUrl = aras.getServerBaseURL();
	const requestUrl = soapRequestOptions.url || globalConfig.url;

	if (!serverUrl || !requestUrl) {
		return;
	}

	// Requests to Innovator server should always be sent with cookies, so that session is available.
	return requestUrl.startsWith(serverUrl);
}

export { alertSoapError, sessionSoap };
