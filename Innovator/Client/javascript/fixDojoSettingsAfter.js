(function () {
	require([
		'dojo/i18n',
		'Aras/Client/Controls/Experimental/_i18n/_i18nMixin',
		'dojo/_base/lang'
	], function (i18n, _i18nMixin, lang) {
		lang.mixin(i18n, _i18nMixin);
	});
})();
