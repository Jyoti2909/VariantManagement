define(['dojo/_base/declare', 'ES/Scripts/Classes/Crawlers/Crawler'], function (
	declare,
	Crawler
) {
	return declare('ES.ESItemCrawler', Crawler, {
		constructor: function (arasObj) {
			this._arasObj = arasObj;

			this.crawlerThreads = [1, 100];
			this.crawlerPaging = [1, 100];
			this.crawlerPeriod = 5;
			this.crawlerType = 'ESItemCrawler';

			var crawlerParameters = [];
			crawlerParameters.push('^ItemTypes:((\\*)|("\\*")|');
			crawlerParameters.push(
				'(-?(([a-zA-Z](\\w*| +\\w+)*))(,([a-zA-Z](\\w*| +\\w+)*))*)|'
			);
			crawlerParameters.push(
				'(-?"(([a-zA-Z](\\w*| +\\w+)*))(,([a-zA-Z](\\w*| +\\w+)*))*"))$'
			);

			this.crawlerParametersRegEx = new RegExp(crawlerParameters.join(''), 'g');
		}
	});
});
