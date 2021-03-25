var SyncMainWindowInfoProvider = (function () {
	function SyncMainWindowInfoProvider() {}
	SyncMainWindowInfoProvider.prototype.getResultNode = function (queryType) {
		var soapResult = aras.soapSend(
			'ApplyMethod',
			"<Item type='Method' action='GetArasMainWindowInfo'><query_type>" +
				queryType +
				'</query_type></Item>'
		);
		return soapResult.results;
	};
	return SyncMainWindowInfoProvider;
})();
