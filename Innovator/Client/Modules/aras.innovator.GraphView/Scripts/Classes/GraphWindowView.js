ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.GraphView/GraphWindowView',
	function (DefaultItemWindowView) {
		function GraphWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		GraphWindowView.prototype = new DefaultItemWindowView();

		GraphWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.GraphView/GraphView';
		};

		GraphWindowView.prototype.getWindowUrl = function () {
			return (
				aras.getBaseURL() +
				this.getViewUrl() +
				'?gvdId=' +
				encodeURI(this.inArgs.gvdId)
			);
		};

		return GraphWindowView;
	}
);
