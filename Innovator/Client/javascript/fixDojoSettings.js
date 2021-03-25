var dojoConfig;
var fixDojoSettings = function () {
	var aras = window.aras;
	var win = window;
	while (!aras && win.parent !== win) {
		win = win.parent;
		aras = win.aras;
	}
	if (aras) {
		dojoConfig = {};

		//"en-us" is default locale
		dojoConfig.locale = aras.IomInnovator
			? aras.getSessionContextLocale().toLowerCase()
			: 'en-us';

		dojoConfig.arasContext = (function (aras) {
			return {
				languageDirection: aras.getLanguageDirection(),
				resources: aras.getResources('core', [
					'itemsgrid.locked_criteria_ppm.clear_criteria',
					'itemsgrid.locked_criteria_ppm.locked_by_me',
					'itemsgrid.locked_criteria_ppm.locked_by_others',
					'itemsgrid.locked_criteria_ppm.locked_by_anyone',
					'grid.rows_must_have_unique_ids',
					'common.restricted_property_warning'
				]),
				browser: {
					isIe: aras.Browser.isIe(),
					majorVersion: aras.Browser.getMajorVersionNumber()
				},
				adjustIconUrl: function (iconurl) {
					if (iconurl && iconurl.toLowerCase().indexOf('./http') != -1) {
						// jshint ignore:line
						iconurl = iconurl.substr(2);
					}
					if (
						iconurl &&
						iconurl.toLowerCase().indexOf('vault:///?fileid=') != -1
					) {
						// jshint ignore:line
						var fileId = iconurl.substr(iconurl.length - 32);
						iconurl = aras.IomInnovator.getFileUrl(
							fileId,
							aras.Enums.UrlType.SecurityToken
						);
					}
					return iconurl;
				},
				converter: {
					convertToNeutral: aras.convertToNeutral.bind(aras),
					convertFromNeutral: aras.convertFromNeutral.bind(aras)
				}
			};
		})(aras);

		dojoConfig.packages = [
			{
				name: 'SSVC',
				location: '../../Modules/aras.innovator.SSVC'
			},
			{
				name: 'Izenda',
				location: '../../Modules/aras.innovator.Izenda'
			},
			{
				name: 'Controls',
				location: '../../Modules/aras.innovator.core.Controls/Scripts/Controls'
			},
			{
				name: 'Viewers',
				location: '../../Modules/aras.innovator.Viewers/Scripts/Controls'
			},
			{
				name: 'CMF',
				location: '../../Modules/aras.innovator.CMF'
			},
			{
				name: 'ES',
				location: '../../Modules/aras.innovator.ES'
			},
			{
				name: 'EffectivityServices',
				location: '../../Modules/aras.innovator.core.EffectivityServices'
			},
			{
				name: 'ExtendedClassification',
				location: '../../Modules/aras.innovator.ExtendedClassification'
			},
			{
				name: 'Configurator',
				location: '../../Modules/aras.innovator.Configurator'
			},
			{
				name: 'Modules',
				location: '../../Modules'
			},
			{
				name: 'QB',
				location: '../../Modules/aras.innovator.QueryBuilder'
			},
			{
				name: 'TreeGridView',
				location: '../../Modules/aras.innovator.TreeGridView'
			},
			{
				name: 'GraphView',
				location: '../../Modules/aras.innovator.GraphView'
			},
			{
				// currently is needed for AceEditor, can be deleted if editor will be moved into other folder (e.g. Modules or vendors)
				name: 'ClientScripts',
				location: '../../scripts'
			},
			{
				name: 'TDF',
				location: '../../Modules/aras.innovator.TDF'
			},
			{
				name: 'MacPolicy',
				location: '../../Modules/aras.innovator.MacPolicy'
			},
			{
				name: 'MassPromote',
				location: '../../Modules/aras.innovator.MassPromote'
			},
			{
				name: 'Vendors',
				location: '../../vendors'
			},
			{
				name: 'DomainAccessControl',
				location: '../../Modules/aras.innovator.DomainAccessControl'
			},
			{
				name: 'Printing',
				location: '../../Modules/aras.innovator.Printing'
			}
		];
	} else {
		throw new Error('aras is not found');
	}
};
fixDojoSettings();
