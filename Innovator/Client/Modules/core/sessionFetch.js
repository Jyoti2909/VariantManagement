export default async function fetch(requestURL, options = {}) {
	const aras = window.aras || window.opener.aras;
	const oAuthClient = aras.OAuthClient;
	const authHeaders = oAuthClient.getAuthorizationHeader();
	const headers = Object.assign({ Accept: 'application/json' }, authHeaders);

	const fetchParams = {
		method: 'GET',
		...options,
		headers: { ...options.headers, ...headers },
		credentials: 'include'
	};
	try {
		const response = await window.fetch(requestURL, fetchParams);
		const isUnauthorized =
			response.status === oAuthClient.unauthorizedStatusCode;
		if (isUnauthorized) {
			const errorObject = {
				error: {
					code: 'unauthorized_error'
				}
			};
			throw errorObject;
		}

		return response;
	} catch (errorObject) {
		const error = errorObject.error;

		if (error?.code) {
			const soap = window.SOAP || window.opener.SOAP;
			let message;

			switch (error.code) {
				case 'SOAP-ENV:Server.Authentication.SessionTimeout':
					message = aras.getResource('', 'soap_object.session_has_expired');
					break;
				case 'unauthorized_error':
					message = aras.getResource('', 'soap_object.unauthorized_error');
					break;
				default:
					return Promise.reject(errorObject);
			}
			try {
				await soap.handleSessionTimeout({
					message: message
				});

				return fetch(requestURL, options);
			} catch (e) {
				return Promise.reject(errorObject);
			}
		}
	}
}
