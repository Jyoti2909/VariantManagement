define(['dojo/_base/declare', 'ES/Scripts/Classes/Crawlers/Crawler'], function (
	declare,
	Crawler
) {
	return declare('ES.ESFileCrawler', Crawler, {
		constructor: function (arasObj) {
			this._arasObj = arasObj;

			this.crawlerThreads = [1, 100];
			this.crawlerPaging = [1, 100];
			this.crawlerPeriod = 5;
			this.crawlerType = 'ESFileCrawler';

			var crawlerParameters = [];
			crawlerParameters.push(
				'^Types:((([a-zA-Z0-9_]+)(,[a-zA-Z0-9_]+)*)|("([^",:*?<>|;/\\\\]+)(,[^",:*?<>|;/\\\\]+)*"));'
			);
			crawlerParameters.push(
				'Vaults:((\\*)|("\\*")|(([a-zA-Z0-9_]+)(,[a-zA-Z0-9_]+)*)|("([^",;]+)(,([^",;]+))*"))$'
			);

			this.crawlerParametersRegEx = new RegExp(crawlerParameters.join(''), 'g');
		}
	});
});
