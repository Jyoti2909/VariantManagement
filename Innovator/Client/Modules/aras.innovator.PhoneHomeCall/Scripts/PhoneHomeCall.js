(function (global) {
	const ArasComNotificationsEndpoint =
		'https://www.aras.com/notifications/updatecheck.asmx';

	global.PhoneHomeCall = function (aras) {
		this.aras = aras;
		this.mainWindow = this.aras.getMainWindow();
		this.ArasModules = this.mainWindow.ArasModules;
	};

	global.PhoneHomeCall.prototype.tryGetUpdateInfo = function () {
		const updateInfoResult = this.mainWindow.arasMainWindowInfo
			.getCheckUpdateInfoResult;
		if (updateInfoResult.getFaultCode() !== 0) {
			const faultString =
				'Cannot get update info: ' + updateInfoResult.getFaultString();
			return Promise.reject(new Error(faultString));
		}

		const updateNotNeededNode = updateInfoResult.results.selectSingleNode(
			'//Result/UpdateNotNeeded'
		);
		if (updateNotNeededNode) {
			// Standard case when update is not needed
			return Promise.resolve({
				status: 'noop'
			});
		}

		const encryptedPayloadNode = updateInfoResult.results.selectSingleNode(
			'//Result/encryptedPayload'
		);
		const requestData = this.ArasModules.xml.getInnerXml(encryptedPayloadNode);

		const self = this;
		return this._sendSoapRequestToArasCom('SecureGetUpdateInfo2', requestData)
			.then(function (responseText) {
				const responseXml = self.aras.createXMLDocument();
				responseXml.loadXML(responseText);

				const updateInfoResponseNode = responseXml.selectSingleNode(
					'//*[local-name()="SecureGetUpdateInfo2Response"]'
				);
				if (!updateInfoResponseNode) {
					return;
				}
				const updateInfoResult = self.ArasModules.xml.getInnerXml(
					updateInfoResponseNode
				);
				return self.ArasModules.soap(updateInfoResult, {
					async: true,
					method: 'StoreVersionFile'
				});
			})
			.then(function () {
				return Promise.resolve({
					status: 'received'
				});
			});
	};

	global.PhoneHomeCall.prototype.tryStoreStatistics = function () {
		const statisticsResult = this.mainWindow.arasMainWindowInfo
			.getStatisticsResult;
		const faultCode = statisticsResult.getFaultCode();
		if (faultCode !== 0) {
			if (faultCode === 'SOAP-ENV:Server.ItemNotFoundException') {
				// Standard case when there is no statistics to send
				return Promise.resolve({
					status: 'noop'
				});
			}
			const faultString =
				'Cannot get statistics info: ' + statisticsResult.getFaultString();
			return Promise.reject(new Error(faultString));
		}

		// `encryptedPayload` tag and its child tags formed in camel case at Server to be successfully passed
		// to WebMethod which processes requests in aras.com side and expects only params passed in camel case.
		const encryptedPayloadNode = statisticsResult.results.selectSingleNode(
			'//Result/encryptedPayload'
		);
		const requestData = this.ArasModules.xml.getInnerXml(encryptedPayloadNode);
		return this._sendSoapRequestToArasCom(
			'SecureStoreStatistics',
			requestData
		).then(function () {
			return {
				status: 'sent'
			};
		});
	};

	global.PhoneHomeCall.prototype._sendSoapRequestToArasCom = function (
		method,
		requestData
	) {
		const xmlNamespace = 'http://www.aras.com/Notifications';
		return this.ArasModules.soap(requestData, {
			async: true,
			url: this._getNotificationEndpoint(),
			method: method,
			methodNm: xmlNamespace,
			SOAPAction: xmlNamespace + '/' + method,
			headers: {} // To prevent sending all headers from globalConfig (including access token) to aras.com
		});
	};

	global.PhoneHomeCall.prototype._getNotificationEndpoint = function () {
		return ArasComNotificationsEndpoint;
	};
})(window);
