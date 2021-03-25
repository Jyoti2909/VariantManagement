var AsyncCachedMainWindowInfoProvider = (function () {
	function AsyncCachedMainWindowInfoProvider() {}
	AsyncCachedMainWindowInfoProvider.prototype.getResultNode = function (
		queryType
	) {
		if (!this.cachedResult) {
			throw new Error('Invalid operation. Call fetch() before.');
		}
		return this.cachedResult;
	};
	AsyncCachedMainWindowInfoProvider.prototype.fetch = function () {
		var _this = this;
		var soapConfig = {
			method: 'ApplyItem',
			async: true
		};
		return ArasModules.soap(
			"<Item type='Method' action='GetArasMainWindowInfo'><query_type>all</query_type></Item>",
			soapConfig
		).then(function (x) {
			_this.cachedResult = x;
			return _this;
		});
	};
	return AsyncCachedMainWindowInfoProvider;
})();
