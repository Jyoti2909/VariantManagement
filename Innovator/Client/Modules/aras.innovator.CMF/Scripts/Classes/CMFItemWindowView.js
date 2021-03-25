ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.CMF/CMFItemWindowView',
	function (DefaultItemWindowView) {
		function CMFItemWindowView(inDom, inArgs) {
			DefaultItemWindowView.call(this, inDom, inArgs);
		}

		CMFItemWindowView.prototype = new DefaultItemWindowView();

		CMFItemWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.CMF/CMFContainerView';
		};

		CMFItemWindowView.prototype.getWindowArguments = function () {
			var baseArgs = DefaultItemWindowView.prototype.getWindowArguments.call(
				this
			);
			baseArgs.reserveSpaceForSidebar = true;
			return baseArgs;
		};

		return CMFItemWindowView;
	}
);
