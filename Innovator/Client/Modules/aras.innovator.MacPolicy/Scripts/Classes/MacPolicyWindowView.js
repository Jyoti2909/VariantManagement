ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.MacPolicy/MacPolicyWindowView',
	function (DefaultItemWindowView) {
		function MacPolicyWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		MacPolicyWindowView.prototype = new DefaultItemWindowView();

		MacPolicyWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.MacPolicy/macPolicyView';
		};
		return MacPolicyWindowView;
	}
);
