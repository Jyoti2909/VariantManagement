ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.EffectivityServices/EffectivityExpressionWindowView',
	function (DefaultItemWindowView) {
		function EffectivityExpressionWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		EffectivityExpressionWindowView.prototype = new DefaultItemWindowView();

		EffectivityExpressionWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.core.EffectivityServices/EffectivityExpressionView';
		};

		return EffectivityExpressionWindowView;
	}
);
