define(['dojo/_base/declare', 'ES/Scripts/Classes/Crawlers/Crawler'], function (
	declare,
	Crawler
) {
	return declare('ES.ESSolrCleanerCrawler', Crawler, {
		constructor: function (arasObj) {
			this._arasObj = arasObj;

			this.crawlerThreads = [1, 1];
			this.crawlerPaging = [1, 100];
			this.crawlerPeriod = 5;
			this.crawlerType = 'ESSolrCleanerCrawler';
			this.crawlerParametersRegEx = /^$/g;
		}
	});
});
