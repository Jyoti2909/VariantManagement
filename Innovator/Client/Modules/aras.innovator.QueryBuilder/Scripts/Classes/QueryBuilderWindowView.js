ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.QueryBuilder/QueryBuilderWindowView',
	function (DefaultItemWindowView) {
		function QueryBuilderWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		QueryBuilderWindowView.prototype = new DefaultItemWindowView();

		QueryBuilderWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.QueryBuilder/queryBuilderView';
		};

		return QueryBuilderWindowView;
	}
);
