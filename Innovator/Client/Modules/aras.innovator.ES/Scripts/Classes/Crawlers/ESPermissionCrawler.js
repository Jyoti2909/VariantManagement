define(['dojo/_base/declare', 'ES/Scripts/Classes/Crawlers/Crawler'], function (
	declare,
	Crawler
) {
	return declare('ES.ESPermissionCrawler', Crawler, {
		constructor: function (arasObj) {
			this._arasObj = arasObj;

			this.crawlerThreads = [1, 100];
			this.crawlerPaging = [1, 500];
			this.crawlerPeriod = 5;
			this.crawlerType = 'ESPermissionCrawler';

			var crawlerParameters = [];
			crawlerParameters.push('^ItemTypes:((\\*)|("\\*")|');
			crawlerParameters.push(
				'(-?(([a-zA-Z](\\w*| +\\w+)*))(,([a-zA-Z](\\w*| +\\w+)*))*)|'
			);
			crawlerParameters.push(
				'(-?"(([a-zA-Z](\\w*| +\\w+)*))(,([a-zA-Z](\\w*| +\\w+)*))*"))'
			);
			crawlerParameters.push(
				'(;[a-zA-Z]+:((\\*)|("\\*")|(-?(\\w+|\\d+(\\.\\d+)?)(,(\\w+|\\d+(\\.\\d+)?))*)|'
			);
			crawlerParameters.push(
				'(-?"((\\w+(\\w*| +\\w+)*)|(\\d+(\\.\\d+)?))(,(\\w+(\\w*| +\\w+)*)|(\\d+(\\.\\d+)?))*")))*$'
			);

			this.crawlerParametersRegEx = new RegExp(crawlerParameters.join(''), 'g');
		}
	});
});
