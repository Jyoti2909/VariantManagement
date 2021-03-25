var ArasMainWindowInfo = (function () {
	function ArasMainWindowInfo(aras) {
		this.aras = aras;
	}

	ArasMainWindowInfo.prototype = {
		constructor: ArasMainWindowInfo,
		get getIdentityListResult() {
			return this.getSoapResult(
				'getIdentityList',
				'/*/*/*/GetIdentityListResult/*'
			);
		},
		get getUserResult() {
			return this.getSoapResult('getUser', '/*/*/*/GetUserResult/*');
		},
		get getLanguageResult() {
			return this.getSoapResult('getLanguage', '/*/*/*/GetLanguageResult/*');
		},
		get isFeatureTreeExpiredResult() {
			return this.provider
				.getResultNode('isFeatureTreeExpired')
				.selectSingleNode('/*/*/*/IsFeatureTreeExpiredResult/Result').text;
		},
		get serverVersion() {
			return this.provider
				.getResultNode('getServerVersion')
				.selectSingleNode('/*/*/*/GetServerVersionResult/Result').text;
		},
		get getCheckUpdateInfoResult() {
			return this.getSoapResult(
				'getCheckUpdateInfo',
				'/*/*/*/GetCheckUpdateInfoResult/*'
			);
		},
		get getStatisticsResult() {
			return this.getSoapResult(
				'getStatistics',
				'/*/*/*/GetStatisticsResult/*'
			);
		},
		get IsSSVCLicenseOk() {
			return (
				this.provider
					.getResultNode('IsSSVCLicenseOk')
					.selectSingleNode('/*/*/*/IsSSVCLicenseOk/Result').text === 'True'
			);
		},
		get MessageCheckInterval() {
			return this.provider
				.getResultNode('MessageCheckInterval')
				.selectSingleNode('/*/*/*/MessageCheckInterval/Result').text;
		},
		get SSVC_Preferences() {
			return this.getSoapResult(
				'SSVC_Preferences',
				'/*/*/*/SSVC_Preferences/*'
			);
		},
		get Core_GlobalLayout() {
			return this.getSoapResult(
				'CoreGlobalLayoutPreference',
				'/*/*/*/Core_GlobalLayout/*'
			);
		},
		get GetAllMetadataDates() {
			const soap = this.getSoapResult(
				'GetMetadataInfoDates',
				'/*/*/*/GetMetadataInfoDates'
			);
			return soap.results.selectSingleNode('GetMetadataInfoDates');
		},
		get SearchCountMode() {
			return this.provider
				.getResultNode('GetSearchCountMode')
				.selectSingleNode('/*/*/*/SearchCountMode/Result').text;
		},
		get Core_SearchCountModeException() {
			return this.provider
				.getResultNode('GetSearchCountModeExceptions')
				.selectSingleNode('/*/*/*/Core_SearchCountModeException/Result')
				.text.split(',');
		},
		get ES_Settings() {
			return this.getSoapResult('GetEsSettings', '/*/*/*/ES_Settings/*');
		},
		get favoriteItemTypes() {
			return this.provider
				.getResultNode('GetFavoriteItemTypes')
				.selectSingleNode('/*/*/*/FavoriteItemTypes/Result').text;
		},
		get favoriteSearches() {
			return this.provider
				.getResultNode('GetFavoriteSearches')
				.selectSingleNode('/*/*/*/FavoriteSearches/Result').text;
		},
		get favoriteItems() {
			return this.provider
				.getResultNode('GetFavoriteItems')
				.selectSingleNode('/*/*/*/FavoriteItems/Result').text;
		},
		setProvider: function (provider) {
			this.provider = provider;
		},
		getSoapResult: function (queryType, xpath) {
			if (this.provider === null) {
				throw new Error('Invalid operation. Set provider before.');
			}
			const resultNode = this.provider.getResultNode(queryType);
			const node = resultNode.selectSingleNode(xpath);
			return new SOAPResults(this.aras, node.xml);
		}
	};

	return ArasMainWindowInfo;
})();
