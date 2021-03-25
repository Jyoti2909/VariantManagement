export default function login() {
	return Promise.all([
		window.deepLinking.beforeInitializeLoginForm(),
		aras.OAuthServerDiscovery.discover(aras.getServerBaseURL())
	])
		.then(function (result) {
			const deepLinkingResult = result[0];
			if (deepLinkingResult.startItemHandled === true) {
				return;
			}
			const oauthServerConfiguration = result[1];
			const clientBaseUrl =
				new window.ClientUrlsUtility(
					aras.getBaseURL()
				).getBaseUrlWithoutSalt() + '/';
			return aras.OAuthClient.init(
				window.oauthClientId,
				clientBaseUrl,
				oauthServerConfiguration
			)
				.then(function () {
					const navigatedFromRedirectCallbackKey =
						'OAuth:NavigatedFromRedirectCallback';
					const params = new URLSearchParams(
						location.search.substr(1, location.search.length)
					);
					const options = {
						prompt: params.get('prompt'),
						database: params.get('db'),
						authentication_type: params.get('auth'),
						state: {
							returnUrl: location.href
						}
					};

					if (options.prompt === '') {
						options.prompt = 'select_account';
					}

					if (sessionStorage[navigatedFromRedirectCallbackKey] === 'true') {
						// Deteleting prompt field to avoid cyclic navigation to login page
						// after redirection from OAuth server after authorization
						delete options.prompt;
						sessionStorage.removeItem(navigatedFromRedirectCallbackKey);
					}
					return aras.OAuthClient.login(options);
				})
				.then(function (result) {
					if (result.status == 'logged-in') {
						return aras.login().then(function () {
							window.onSuccessfulLogin();
						});
					}
				});
		})
		.catch(function (err) {
			return aras.AlertError(err).then(function () {
				if (aras.OAuthClient.isLogged()) {
					const url = new URL(window.location.href);
					url.searchParams.delete('StartItem');
					let returnUrl = url.toString();

					if (
						err instanceof SOAPResults &&
						err.getFaultString() === 'Invalid user name.' &&
						!url.searchParams.has('prompt')
					) {
						if (returnUrl.includes('?')) {
							returnUrl += '&prompt';
						} else {
							returnUrl += '?prompt';
						}
					}

					return aras.OAuthClient.logout({
						state: {
							returnUrl: returnUrl
						}
					});
				}
			});
		});
}
