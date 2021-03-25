define(function () {
	'use strict';
	var JsonTemplate = (function () {
		function JsonTemplate() {}
		JsonTemplate.serialize = function (template) {
			var rawTemplate = JSON.stringify(template);
			return rawTemplate;
		};
		JsonTemplate.parse = function (rawTemplate) {
			if (!rawTemplate) {
				return rawTemplate;
			}
			var template;
			try {
				template = JSON.parse(rawTemplate);
			} catch (e) {
				if (!(e instanceof SyntaxError)) {
					throw e;
				}
				template = rawTemplate;
			}
			return template;
		};
		return JsonTemplate;
	})();
	return JsonTemplate;
});
