ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.ItemWindow/MassPromoteWindowView',
	function (DefaultItemWindowView) {
		function MassPromoteWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		MassPromoteWindowView.prototype = new DefaultItemWindowView();

		MassPromoteWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.core.ItemWindow/massPromoteView';
		};

		return MassPromoteWindowView;
	}
);
