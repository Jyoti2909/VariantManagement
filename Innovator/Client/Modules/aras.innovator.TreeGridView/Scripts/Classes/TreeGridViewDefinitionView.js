ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.TreeGridView/TreeGridViewDefinitionView',
	function (DefaultItemWindowView) {
		function TreeGridViewDefinitionView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		TreeGridViewDefinitionView.prototype = new DefaultItemWindowView();

		TreeGridViewDefinitionView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.TreeGridView/TreeGridViewConfiguratorView';
		};

		return TreeGridViewDefinitionView;
	}
);
