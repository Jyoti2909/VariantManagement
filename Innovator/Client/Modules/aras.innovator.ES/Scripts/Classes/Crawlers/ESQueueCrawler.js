define(['dojo/_base/declare', 'ES/Scripts/Classes/Crawlers/Crawler'], function (
	declare,
	Crawler
) {
	return declare('ES.ESQueueCrawler', Crawler, {
		constructor: function (arasObj) {
			this._arasObj = arasObj;

			this.crawlerThreads = [1, 1];
			this.crawlerPaging = [100, 5000];
			this.crawlerPeriod = 5;
			this.crawlerType = 'ESQueueCrawler';

			var crawlerParameters = [];
			crawlerParameters.push('^ItemTypes:((\\*)|("\\*")|');
			crawlerParameters.push(
				'(-?(([a-zA-Z](\\w*| +\\w+)*))(,([a-zA-Z](\\w*| +\\w+)*))*)|'
			);
			crawlerParameters.push(
				'(-?"(([a-zA-Z](\\w*| +\\w+)*))(,([a-zA-Z](\\w*| +\\w+)*))*"))'
			);
			crawlerParameters.push(';MaxFileSize:(([1-9]\\d*)|("[1-9]\\d*"))$');

			this.crawlerParametersRegEx = new RegExp(crawlerParameters.join(''), 'g');
		}
	});
});
