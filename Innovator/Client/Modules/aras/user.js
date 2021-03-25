(function (ArasCore) {
	const getAras = function () {
		return window.aras;
	};

	const xmlModule = ArasModules.xml;
	const storage = {};
	const faultToJSON = ArasModules.aml.faultToJSON;
	const passwordExpiredConst =
		'SOAP-ENV:Server.Authentication.PasswordIsExpired';

	function showDialog(data) {
		return ArasCore.Dialogs.changePassword('passwordExpired', { ...data });
	}

	function getPasswordPolicies(msgValue) {
		const xml = xmlModule.parseString('<res>' + msgValue + '</res>');
		const obj = ArasModules.xmlToJson(xml);
		const items = obj.res.Item;
		let variables = '<Result>';
		let methodCode = '';

		for (let i = 0, len = items.length; i < len; i++) {
			if (items[i]['@attrs'].type === 'Variable') {
				variables +=
					'<Item type="Variable" id=' +
					items[i]['@attrs'].id +
					'>' +
					'<name>' +
					items[i].name +
					'</name>' +
					'<value>' +
					items[i].value +
					'</value>' +
					'</Item>';
			} else if (items[i]['@attrs'].type === 'Method') {
				methodCode = items[i]['method_code'];
			}
		}

		variables += '</Result>';

		return {
			codeToCheckPwdPolicy: methodCode,
			varsToCheckPwdPolicy: variables
		};
	}

	const setFipsMode = function (passwordHashAlgorithm) {
		const arasObj = getAras();
		if (passwordHashAlgorithm === 'SHA256') {
			arasObj.setVariable('fips_mode', 'true');
		} else if (passwordHashAlgorithm === 'MD5') {
			arasObj.setVariable('fips_mode', null);
		}
	};

	const userMethods = {
		get id() {
			return storage.id;
		},
		get identityId() {
			return storage.identityId;
		},
		get database() {
			return storage.database;
		},
		get type() {
			return storage.type;
		},
		get loginName() {
			return storage.loginName;
		},
		get authenticationType() {
			return storage.authenticationType;
		},
		get userInfo() {
			return { ...storage };
		},
		setStorageProperty: (propertyName, propertyValue) => {
			storage[propertyName] = propertyValue;
		},
		login: function () {
			const arasObj = getAras();
			const serverUrl = arasObj.getServerURL();
			const args = {
				serverUrl: serverUrl,
				timezoneName: aras.getCommonPropertyValue(
					'systemInfo_CurrentTimeZoneName'
				)
			};

			const options = {
				url: serverUrl,
				method: 'ApplyItem',
				headers: {
					TIMEZONE_NAME: args.timezoneName
				}
			};
			ArasModules.soap(null, options);

			return userMethods
				.validate(serverUrl, args.timezoneName)
				.then(function (res) {
					const obj = ArasModules.xmlToJson(res);

					arasObj.setCommonPropertyValue(
						'ValidateUserXmlResult',
						res.parentNode.parentNode.xml
					);
					storage.loginName = obj.login_name;
					storage.database = obj.database;
					storage.authenticationType = obj.authentication_type;
					setFipsMode(obj.password_hash_algorithm);
					storage.id = obj.id;
					storage.type = obj['user_type'];
				})
				.catch(function (errorRes) {
					if (!errorRes) {
						return Promise.reject(
							arasObj.getResource(
								'',
								'aras_object.validate_user_failed_communicate_with_innovator_server'
							)
						);
					}

					let promise = null;
					const faultObj = faultToJSON(errorRes.responseXML);

					if (!faultObj) {
						return Promise.reject(
							arasObj.getResource(
								'',
								'aras_object.validate_user_wrong_innovator_sever_response'
							)
						);
					}

					const faultCode = faultObj.faultcode;

					if (faultCode === passwordExpiredConst) {
						promise = userMethods.errorHandlers.passwordExpired(faultObj, args);
					}

					return (
						promise ||
						Promise.reject(new SOAPResults(aras, errorRes.responseText))
					);
				});
		},
		validate: function (serverUrl, timezoneName) {
			const options = {
				url: serverUrl,
				method: 'ValidateUser',
				async: true,
				headers: {
					TIMEZONE_NAME: timezoneName
				}
			};

			const arasObj = getAras();
			Object.assign(
				options.headers,
				arasObj.OAuthClient.getAuthorizationHeader()
			);

			return ArasModules.soap('', options);
		},
		errorHandlers: {
			passwordExpired: function (faultObj, args) {
				const arasObj = getAras();
				const messageObj = faultObj.detail.message;
				const messages = Array.isArray(messageObj) ? messageObj : [messageObj];
				let passwordValidationInfo;
				let passwordHashAlgorithm;
				messages.forEach(function (element) {
					if ('key' in element['@attrs']) {
						if (element['@attrs'].key === 'password_validation_info') {
							passwordValidationInfo = element;
						}
						if (element['@attrs'].key === 'password_hash_algorithm') {
							passwordHashAlgorithm = element;
						}
					}
				});
				let data = {};

				if (passwordValidationInfo) {
					data = getPasswordPolicies(passwordValidationInfo['@attrs'].value);
				}

				if (passwordHashAlgorithm) {
					setFipsMode(passwordHashAlgorithm['@attrs'].value);
				}

				return showDialog(data).then(function (newPasswordHash) {
					if (newPasswordHash === undefined) {
						return Promise.reject(
							arasObj.getResource('', 'aras_object.new_password_not_set')
						);
					}

					return userMethods.login();
				});
			}
		}
	};

	ArasCore = Object.assign(ArasCore, { user: userMethods });
	window.ArasCore = window.ArasCore || ArasCore;
})(window.ArasCore || {});
