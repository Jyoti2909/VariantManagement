// © Copyright by Aras Corporation, 2013.

Licensing.ActionType = {
	Activate: 0,
	Update: 1,
	Deactivate: 2
};

function Licensing(aras) {
	this.arasObject = aras;
	this.actionNamespace = aras.arasService.actionNamespace;
	this.iServiceName = aras.arasService.serviceName;
	this.url = aras.arasService.serviceUrl;
	this.wnd = window;
	this.error = {};
	this.state = '';

	this._getFeatureLicenseSecureId = function (featureLicenseId) {
		if (featureLicenseId) {
			let qry = this.arasObject.newIOMItem('Feature License', 'get');
			qry.setID(featureLicenseId);
			qry.setAttribute('select', 'secure_id');
			qry = qry.apply();
			if (!qry.isError() && qry.getItemCount() === 1) {
				return qry.getProperty('secure_id');
			}
		}
		return '';
	};

	this._validateActivationKey = function (activationKey) {
		if (!activationKey) {
			// eslint-disable-next-line new-cap
			this.arasObject.AlertError(
				this.arasObject.getResource('', 'licensing.activation_key_is_empty'),
				'',
				'',
				this.wnd
			);
			return false;
		}
		return true;
	};

	this._getNonFailedDoc = function (arasObject, result) {
		if (!result) {
			this.error = {};
			return false;
		} else if (result.search(/<DOCTYPE/) !== -1) {
			this.error = {
				details: arasObject.getResource('', 'licensing.not_found')
			};
			return false;
		}

		const doc = arasObject.createXMLDocument();
		doc.loadXML(result);
		if (doc.selectSingleNode('//faultstring')) {
			this.error = { details: doc.selectSingleNode('//faultstring').text };
			return false;
		}
		return doc;
	};

	this._checkErrors = function (arasObject, result) {
		const doc = this._getNonFailedDoc(arasObject, result);
		if (!doc) {
			return doc;
		}
		const query = arasObject.newIOMInnovator().newItem();
		query.loadAML(doc.firstChild.text || '<Empty/>');
		const envelopeNd = query.dom.selectSingleNode(
			"//*[local-name()='Envelope']"
		);
		if (envelopeNd) {
			query.loadAML(envelopeNd.xml);
		}
		if (query.isError()) {
			this.error = { alert: true, query: query };
			return false;
		}
		return query;
	};

	this._showErrorPage = function (win, activationKey) {
		const error = this.error;

		this.error = null;
		const mainWindow = this.arasObject.getMainWindow();
		if (error && error.customError) {
			this._ShowActivateErrorDialog(error.details, error.title);
		} else if (error && error.alert) {
			// eslint-disable-next-line new-cap
			this.arasObject.AlertError(error.query);
		} else if (error) {
			let result = this._getRequiredServerInfo();
			if (activationKey) {
				result += '<activation_key>' + activationKey + '</activation_key>';
			}

			mainWindow.ArasCore.Dialogs.activationError(result);
		} else {
			return;
		}

		if (win) {
			win.close();
		}
	};

	this._callMethodOnLicensingService = function (
		methodName,
		paramName,
		paramValue
	) {
		// don't used soap because request body isn't XML
		const xhr = new XMLHttpRequest();
		const url =
			this.arasObject.getServerBaseURL() + 'Licensing.asmx/' + methodName;
		xhr.open('POST', url, false);

		const additionalHeaders = this.arasObject.getHttpHeadersForSoapMessage(
			methodName
		);
		Object.keys(additionalHeaders).forEach(function (header) {
			xhr.setRequestHeader(header, additionalHeaders[header]);
		});

		xhr.setRequestHeader(
			'Content-type',
			'application/x-www-form-urlencoded; charset=utf-8'
		);

		xhr.withCredentials = true;

		const body = paramName + '=' + encodeURIComponent(paramValue);
		xhr.send(body);

		if (xhr.status !== 200) {
			this._errorCallback(xhr.statusText, xhr.responseText);
			return false;
		}
		return true;
	};

	this._getFrameworkLicenseKey = function () {
		const serverInfo = this._getRequiredServerInfo();
		if (serverInfo) {
			const frameworkLicenseKey = serverInfo.match(
				/<framework_license_key[^>]*>([^<]+)<\/framework_license_key>/
			)[1];
			return frameworkLicenseKey ? frameworkLicenseKey : '';
		}

		return '';
	};

	this._getRequiredServerInfo = function () {
		let result;
		const self = this;
		ArasModules.soap('', {
			url: this.arasObject.getServerBaseURL() + 'Licensing.asmx/',
			appendMethodToURL: true,
			async: false,
			method: 'GetServerInfo',
			methodNm: this.actionNamespace,
			restMethod: 'POST'
		}).then(
			function (responseText) {
				result = responseText;
			},
			function (rq) {
				result = self._errorCallback(rq.statusText, rq.responseText);
			}
		);
		if (!result) {
			return '';
		}

		const doc = this.arasObject.createXMLDocument();
		doc.loadXML(result);
		return doc.documentElement ? doc.documentElement.text : '';
	};

	this._displayFeatureRequirementsForms = function (
		getMetaInfoResult,
		activationKey,
		featureLicenseId,
		action
	) {
		let self = this;
		function showFeatureRequirementDialog(params) {
			const aras = params.aras;
			const container = getLicenseActionContainer(self, activationKey);
			if (container) {
				const postData = container;
				let queryParameters = '';
				queryParameters = appendParameter(
					queryParameters,
					'actionName=' + params.action
				);
				queryParameters = appendParameter(
					queryParameters,
					'activationKey=' + params.activationKey
				);
				const topWndAras = aras.getMostTopWindowWithAras(window).aras;
				const formUrl =
					'VirtualGetLicenseForm' +
					(queryParameters ? '?' + queryParameters : '');
				const postUrl =
					topWndAras.getBaseURL() +
					'/Modules/aras.innovator.core.License/PostLicenseForm';
				// eslint-disable-next-line new-cap
				const xmlHttp = topWndAras.XmlHttpRequestManager.CreateRequest();
				xmlHttp.open('POST', postUrl, false);
				xmlHttp.setRequestHeader(
					'Content-Type',
					'application/json; charset=utf-8'
				);
				xmlHttp.send(
					JSON.stringify({
						actionName: params.action,
						activationKey: params.activationKey,
						postData: postData
					})
				);
				return formUrl;
			} else {
				// false
				return container;
			}

			function getLicenseActionContainer(context) {
				let result = false;
				const requestBody =
					'' +
					'<data>' +
					'<parameterData>' +
					'<version>' +
					aras.commonProperties.clientRevision +
					'</version>' +
					'</parameterData>' +
					'</data>';
				try {
					const method = 'GetLicenseActionContainer';
					const methodNm = context.actionNamespace;
					let requestResponse;
					ArasModules.soap(requestBody, {
						url: context.url,
						async: false,
						method: method,
						methodNm: methodNm,
						SOAPAction: methodNm + context.iServiceName + '/' + method,
						headers: {}
					}).then(
						function (responseText) {
							requestResponse = responseText;
						},
						function (req) {
							const dialogErrorCallback = context._GenerateActivateErrorCallback(
								context.arasObject.getResource(
									'',
									'licensing.could_not_load_feature_requirements'
								),
								activationKey
							);
							dialogErrorCallback(req.statusText, req.responseText, req.status);
						}
					);

					const doc = aras.createXMLDocument();
					doc.loadXML(requestResponse);
					const envelope = doc.selectSingleNode("//*[local-name()='Envelope']");
					if (envelope) {
						result = envelope.text;
					}
				} finally {
					// eslint-disable-next-line no-unsafe-finally
					return result;
				}
			}

			function appendParameter(param, value) {
				if (param !== '') {
					param += '&';
				}
				param += value;
				return param;
			}
		}

		const query = this._checkErrors(this.arasObject, getMetaInfoResult);
		if (!query) {
			this._showErrorPage(null, activationKey);
			return false;
		}

		const params = this.arasObject.newObject();
		params.aras = this.arasObject;
		const formArray = [];
		const itemTypeArray = [];
		const instanceArray = [];
		const listArray = [];
		let width = 350;
		let height = 150;
		const forms = query.getItemsByXPath("/AML/Item[@type='Form']");
		const formsCount = forms.getItemCount();
		if (formsCount === 0) {
			if (action !== Licensing.ActionType.Deactivate) {
				return featureLicenseId
					? // eslint-disable-next-line new-cap
					  this.Update(featureLicenseId)
					: // eslint-disable-next-line new-cap
					  this.Activate(activationKey);
			}
			// eslint-disable-next-line new-cap
			return this.Deactivate(featureLicenseId);
		} else {
			for (let i = 0; i < formsCount; i++) {
				const formItem = forms.getItemByIndex(i);

				const w = parseInt(formItem.getProperty('width'));
				const h = parseInt(formItem.getProperty('height'));
				width = w > width ? w : width;
				height = h > height ? h : height;

				formArray.push(formItem);
				listArray.push(query.getItemsByXPath("/AML/Item[@type='List']"));
				itemTypeArray.push(
					query.getItemsByXPath(
						"/AML/Item[@type='ItemType' and name='" +
							formItem.getProperty('name') +
							"']"
					)
				);
				instanceArray[i] = query.getItemsByXPath(
					"/AML/Item[@type='" + formItem.getProperty('name') + "']"
				);
			}

			height = parseInt(height) + 66;
			params.licensingObject = this;
			params.forms = formArray;
			params.itemTypes = itemTypeArray;
			params.listArray = listArray;
			params.instances = instanceArray;
			params.activationKey = activationKey;
			params.featureLicenseId = featureLicenseId;
			params.action = action;
			self = this;
			params.dialogWidth = width;
			params.dialogHeight = height;
			const formUrl = showFeatureRequirementDialog(params);
			if (formUrl) {
				params.content = formUrl;
				const mainWindow = this.arasObject.getMainWindow();
				mainWindow.ArasModules.Dialog.show('iframe', params);
			} else {
				return false;
			}
		}
		return true;
	};

	this._getMetaInfoFromArasService = function (
		action,
		activationKey,
		featureLicenseId
	) {
		let methodName;
		let callbackMethod;
		let parameterName = 'featureLicenseSecureId';
		let parameterValue = this._getFeatureLicenseSecureId(featureLicenseId);

		if (Licensing.ActionType.Activate === action) {
			parameterName = 'activationKey';
			parameterValue = activationKey;
			methodName = 'GetMetaInfoForActivate';
			callbackMethod = this._GenerateActivateErrorCallback(null, activationKey);
		} else if (Licensing.ActionType.Update === action) {
			methodName = 'GetMetaInfoForUpdate';
		} else if (Licensing.ActionType.Deactivate === action) {
			methodName = 'GetMetaInfoForDeactivate';
		}

		let metaInfoResult;

		const methodNamespace = this.actionNamespace;
		const requestBody =
			'<' + parameterName + '>' + parameterValue + '</' + parameterName + '>';

		ArasModules.soap(requestBody, {
			url: this.url,
			async: false,
			method: methodName,
			methodNm: methodNamespace,
			SOAPAction: methodNamespace + this.iServiceName + '/' + methodName,
			headers: {}
		}).then(
			function (responseText) {
				metaInfoResult = responseText;
			},
			function (req) {
				callbackMethod(req.statusText, req.responseText, req.status);
			}
		);
		this._displayFeatureRequirementsForms(
			metaInfoResult,
			activationKey,
			featureLicenseId,
			action
		);
	};

	this._getFeatureLicenseByLicenseData = function (encryptedFeatureLicense) {
		const qry = this.arasObject.newIOMItem('Feature License', 'get');
		if (encryptedFeatureLicense && encryptedFeatureLicense.length > 3999) {
			encryptedFeatureLicense =
				encryptedFeatureLicense.substring(0, 3999) + '%';
		}
		qry.setProperty('license_data', encryptedFeatureLicense);
		return qry.apply();
	};

	this._prepareLicenseRequestBody = function (
		propertyName,
		propertyValue,
		additionalData
	) {
		const serverInfo = this._getRequiredServerInfo();
		additionalData = additionalData ? additionalData : '<additonal_data />';
		const result =
			'' +
			'<' +
			propertyName +
			'>' +
			propertyValue +
			'</' +
			propertyName +
			'>' +
			'<data>' +
			'	<FeatureLicense>' +
			serverInfo +
			additionalData +
			'	</FeatureLicense>' +
			'</data>';
		return result;
	};

	this._getFeatureTreeFromInnovatorServer = function () {
		const method = 'GetFeatureTree';
		const methodNm = this.actionNamespace;
		const self = this;
		let res;

		ArasModules.soap('', {
			url: this.arasObject.getServerBaseURL() + 'Licensing.asmx/GetFeatureTree',
			async: false,
			method: method,
			methodNm: methodNm,
			SOAPAction: methodNm + this.iServiceName + '/' + method,
			headers: this.arasObject.getHttpHeadersForSoapMessage()
		}).then(
			function (result) {
				res = result;
			},
			function (req) {
				self._errorCallback(req.statusText, req.responseText, req.status);
			}
		);

		return res;
	};

	this._errorCallback = function (errorMessage, technicalMessage, stackTrace) {
		technicalMessage = !technicalMessage ? '' : technicalMessage;
		stackTrace = !stackTrace ? technicalMessage : stackTrace;
		// eslint-disable-next-line new-cap
		this.arasObject.AlertError(errorMessage, technicalMessage, stackTrace);
		return false;
	};

	this._GetResponseFaultstring = function (responseText) {
		const doc = this.arasObject.createXMLDocument();
		doc.loadXML(responseText);

		let errorDetails = '';

		if (doc.selectSingleNode('//faultstring')) {
			errorDetails = doc.selectSingleNode('//faultstring').text;
		}
		return errorDetails;
	};

	this._GenerateActivateErrorCallback = function (messagePrefix) {
		let prefix = messagePrefix;
		if (!prefix) {
			prefix = '';
		}
		return function (statusText, responseText, status) {
			if (status !== 404) {
				const errorDetails = this._GetResponseFaultstring(responseText);
				this._ShowActivateErrorDialog(prefix + errorDetails);
			}
		}.bind(this);
	};

	this._ShowActivateErrorDialog = function (
		message,
		title = aras.getResource('', 'licensing.activation_error_title')
	) {
		const mainWindow = aras.getMainWindow();
		const customization = { title };

		const oldEmailText = 'Aras (licenses@aras.com)';
		const emailTag = '{LICENSES_EMAIL}';
		if (message.includes(oldEmailText)) {
			message = message.replace(oldEmailText, emailTag);
		}
		if (message.includes(emailTag)) {
			customization.messageCustomizator = (messageNode) => {
				const messageParts = message.split(emailTag);
				const messageBeforeLink = messageParts[0];
				const messageAfterLink = messageParts[1];
				const emailLinkNode = HyperHTMLElement.hyper`<a class="aras-link_a" href="mailto:licenses@aras.com" target="_blank">licenses@aras.com</a>`;

				HyperHTMLElement.hyper(messageNode)`
					${messageBeforeLink}${emailLinkNode}${messageAfterLink}
				`;
			};
		}

		return mainWindow.ArasModules.Dialog.alert(message, { customization });
	};
}

Licensing.prototype.GetLicenseAgreement = function LicensingGetLicenseAgreement(
	activationKey
) {
	const requestBody = this._prepareLicenseRequestBody(
		'activationKey',
		activationKey
	);

	const method = 'GetLicenseAgreement';
	const methodNm = this.actionNamespace;
	const self = this;
	let requestResponse;
	ArasModules.soap(requestBody, {
		url: this.url,
		async: false,
		method: method,
		methodNm: methodNm,
		SOAPAction: methodNm + this.iServiceName + '/' + method,
		headers: {}
	}).then(
		function (responseText) {
			requestResponse = responseText;
		},
		function (req) {
			self._GenerateActivateErrorCallback(null, activationKey)(
				req.statusText,
				req.responseText,
				req.status
			);
		}
	);

	return this._checkErrors(this.arasObject, requestResponse);
};

Licensing.prototype.Activate = function LicensingActivate(
	activationKey,
	additionalData,
	additionalOptions
) {
	if (!this._validateActivationKey(activationKey)) {
		return false;
	}

	const requestBody = this._prepareLicenseRequestBody(
		'activationKey',
		activationKey,
		additionalData
	);

	const method = 'Activate';
	const methodNm = this.actionNamespace;
	const self = this;
	let requestResponse;

	ArasModules.soap(requestBody, {
		url: this.url,
		async: false,
		method: method,
		methodNm: methodNm,
		SOAPAction: methodNm + this.iServiceName + '/' + method,
		headers: {}
	}).then(
		function (responseText) {
			requestResponse = responseText;
		},
		function (req) {
			self._GenerateActivateErrorCallback(null, activationKey)(
				req.statusText,
				req.responseText,
				req.status
			);
		}
	);

	if (!requestResponse) {
		return false;
	}

	const query = this._checkErrors(this.arasObject, requestResponse);
	if (!query) {
		this._showErrorPage(additionalOptions ? additionalOptions.win : null);
		return false;
	}

	if (additionalOptions) {
		additionalOptions.featureAction = 'activate';
	}

	// eslint-disable-next-line new-cap
	return this.ImportFeatureLicense(query.getResult(), additionalOptions);
};

Licensing.prototype.Update = function (
	featureLicenseId,
	additionalData,
	additionalOptions
) {
	const featureLicenseSecureId = this._getFeatureLicenseSecureId(
		featureLicenseId
	);
	const requestBody = this._prepareLicenseRequestBody(
		'featureLicenseSecureId',
		featureLicenseSecureId,
		additionalData
	);

	const method = 'Update';
	const methodNm = this.actionNamespace;
	let requestResponse;

	ArasModules.soap(requestBody, {
		url: this.url,
		async: false,
		method: method,
		methodNm: methodNm,
		SOAPAction: methodNm + this.iServiceName + '/' + method,
		headers: {}
	}).then(function (responseText) {
		requestResponse = responseText;
	});

	const query = this._checkErrors(this.arasObject, requestResponse);
	if (!query) {
		this._showErrorPage(additionalOptions ? additionalOptions.win : null);
		return false;
	}

	if (additionalOptions) {
		additionalOptions.win.close();
	}

	const title = this.arasObject.getResource(
		'',
		'licensing.success_update_title'
	);
	const message = this.arasObject.getResource(
		'',
		'licensing.feature_successfully_updated'
	);
	const options = {
		type: 'success',
		customization: { title }
	};
	ArasModules.Dialog.alert(message, options);

	return true;
};

Licensing.prototype.Deactivate = function (
	featureLicenseId,
	additionalData,
	additionalOptions
) {
	const featureLicenseSecureId = this._getFeatureLicenseSecureId(
		featureLicenseId
	);
	const requestBody = this._prepareLicenseRequestBody(
		'featureLicenseSecureId',
		featureLicenseSecureId,
		additionalData
	);

	const method = 'Deactivate';
	const methodNm = this.actionNamespace;
	let requestResponse;

	ArasModules.soap(requestBody, {
		url: this.url,
		async: false,
		method: method,
		methodNm: methodNm,
		SOAPAction: methodNm + this.iServiceName + '/' + method,
		headers: {}
	}).then(function (responseText) {
		requestResponse = responseText;
	});

	const query = this._checkErrors(this.arasObject, requestResponse);
	if (!query) {
		this._showErrorPage(additionalOptions ? additionalOptions.win : null);
		return false;
	}

	this.arasObject.deleteItem('Feature License', featureLicenseId, true);

	return true;
};

Licensing.prototype.showState = function LicensingShowState() {
	if (this.state) {
		// eslint-disable-next-line new-cap
		this.arasObject.AlertSuccess(this.state, window);
		this.state = null;
	}
};

Licensing.prototype.UpdateFeatureTreeUI = function LicensingUpdateFeatureTreeUI() {
	try {
		// eslint-disable-next-line new-cap
		if (!this.UpdateFeatureTree()) {
			this._showErrorPage();
			return false;
		}
	} finally {
		this.showState();
	}
	return true;
};

Licensing.prototype.UpdateFeatureTree = function LicensingUpdateFeatureTree(
	callback
) {
	const self = this;
	const getResponse = function (responseText) {
		const arasObject = self.arasObject;
		if (!responseText) {
			self.error = {
				customError: true,
				details: arasObject.getResource(
					'',
					'licensing.update_feature_tree_service_not_available'
				),
				title: arasObject.getResource(
					'',
					'licensing.update_feature_tree_service_not_available_title'
				)
			};
			if (callback) {
				callback();
			}
			return false;
		} else if (!self._getNonFailedDoc(arasObject, responseText)) {
			self.state = arasObject.getResource(
				'',
				'licensing.feature_tree_failed_updated_featureTree'
			);
			if (callback) {
				callback();
			}
			return false;
		}

		const doc = arasObject.createXMLDocument();
		doc.loadXML(responseText);
		const featureTreeText = doc.documentElement ? doc.documentElement.text : '';

		let bResult = self._callMethodOnLicensingService(
			'UpdateFeatureTree',
			'encryptedFeatureTree',
			featureTreeText
		);
		bResult = !!bResult;
		self.state = bResult
			? arasObject.getResource(
					'',
					'licensing.feature_tree_successfully_updated'
			  )
			: arasObject.getResource(
					'',
					'licensing.feature_tree_failed_updated_featureTree'
			  );

		if (callback) {
			callback(bResult);
		}

		return bResult;
	};

	const data =
		'<frameworkLicenseKey>' +
		this._getFrameworkLicenseKey() +
		'</frameworkLicenseKey>';
	const method = 'GetFeatureTree';
	const methodNm = this.actionNamespace;
	let getFeatureTreeResult;

	ArasModules.soap(data, {
		async: !!callback,
		url: this.url,
		method: method,
		methodNm: methodNm,
		SOAPAction: methodNm + this.iServiceName + '/' + method,
		headers: {}
	}).then(
		function (result) {
			if (callback) {
				getResponse(result);
			} else {
				getFeatureTreeResult = result;
			}
		},
		function () {
			self.state = self.arasObject.getResource(
				'',
				'licensing.feature_tree_failed_updated_featureTree'
			);

			if (callback) {
				callback();
			}
		}
	);

	if (!callback) {
		return getResponse(getFeatureTreeResult);
	}
};

Licensing.prototype.ShowLicenseManagerDialog = function LicensingShowLicenseManagerDialog() {
	const params = {
		aras: this.arasObject,
		title: this.arasObject.getResource('', 'licmanager.title'),
		dialogWidth: 1000,
		dialogHeight: 420,
		resizable: true,
		center: true,
		content: 'Licensing/LicManager.html'
	};

	const mainWindow = this.arasObject.getMainWindow();
	mainWindow.ArasModules.Dialog.show('iframe', params);
};

Licensing.prototype.ActivateFeature = async function () {
	const aras = this.arasObject;
	const label = aras.getResource('', 'licensing.activation_key');
	const title = aras.getResource('', 'licensing.action_type_activate');
	const okButtonText = aras.getResource('', 'licensing.activate_button');
	const mainWindow = aras.getMainWindow();
	const showDialog = (defaultValue = null) => {
		return mainWindow.ArasModules.Dialog.prompt(label, {
			title,
			okButtonText,
			defaultValue,
			required: true,
			dialogClassModifier: 'aras-dialog-prompt_licensing'
		});
	};
	let dialogPromise = showDialog();
	let activationKey;

	do {
		activationKey = await dialogPromise;
		if (activationKey) {
			dialogPromise = showDialog(activationKey);
			this._getMetaInfoFromArasService(
				Licensing.ActionType.Activate,
				activationKey
			);
		}
	} while (activationKey);
};

Licensing.prototype.ImportFeatureLicense = async function (
	featureLicenseText,
	additionalOptions
) {
	if (!featureLicenseText) {
		const aras = this.arasObject;
		const label = aras.getResource('', 'licensing.feature_license_label');
		const title = aras.getResource('', 'licensing.import_feature_license');
		const okButtonText = aras.getResource('', 'licensing.import_license');
		const mainWindow = aras.getMainWindow();
		featureLicenseText = await mainWindow.ArasModules.Dialog.prompt(label, {
			title,
			okButtonText,
			required: true,
			dialogClassModifier: 'aras-dialog-prompt_licensing'
		});

		if (!featureLicenseText) {
			return;
		}
	}

	const bResult = this._callMethodOnLicensingService(
		'ImportFeatureLicense',
		'encryptedFeatureLicense',
		featureLicenseText
	);
	if (!bResult) {
		return;
	}

	if (additionalOptions) {
		additionalOptions.win.close();
	}

	const featureLicense = this._getFeatureLicenseByLicenseData(
		featureLicenseText
	);
	if (featureLicense.isError()) {
		// eslint-disable-next-line new-cap, babel/no-invalid-this
		this.arasObject.AlertError(featureLicense, this.wnd);
		return false;
	}

	const mainWindow = this.arasObject.getMainWindow();
	await mainWindow.ArasCore.Dialogs.activationSuccessful(featureLicense);
};

Licensing.prototype.PerformActionOverFeature = function LicensingPerformActionOverFeature(
	action,
	activationKey,
	featureLicenseId
) {
	if (!this._validateActivationKey(activationKey)) {
		return false;
	}
	this._getMetaInfoFromArasService(action, activationKey, featureLicenseId);
};

Licensing.prototype.ViewFeatureTree = function LicensingViewFeatureTree() {
	let featureTreeXml = this._getFeatureTreeFromInnovatorServer();
	if (!featureTreeXml) {
		return;
	}
	const doc = this.arasObject.createXMLDocument();
	doc.loadXML(featureTreeXml);

	const xmlDocument = this.arasObject.createXMLDocument();
	xmlDocument.validateOnParse = true;
	xmlDocument.loadXML(doc.childNodes[doc.childNodes.length - 1].text);

	const xslt = this.arasObject.createXMLDocument();
	xslt.load(this.arasObject.getScriptsURL() + 'Licensing/FeatureTree.xsl');

	featureTreeXml = xmlDocument.transformNode(xslt);

	const params = {
		aras: this.arasObject,
		featureTreeXml: featureTreeXml,
		title: 'Aras Feature Tree',
		dialogHeight: 620,
		dialogWidth: 500,
		resizable: true,
		center: true,
		scroll: true,
		content: 'Licensing/FeatureTree.html'
	};

	const mainWindow = this.arasObject.getMainWindow();
	mainWindow.ArasModules.Dialog.show('iframe', params);
};
