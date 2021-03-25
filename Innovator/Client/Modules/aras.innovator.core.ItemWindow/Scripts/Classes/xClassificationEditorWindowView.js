ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.ItemWindow/xClassificationEditorWindowView',
	function (DefaultItemWindowView) {
		function xClassificationEditorWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		xClassificationEditorWindowView.prototype = new DefaultItemWindowView();

		xClassificationEditorWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.core.ItemWindow/xClassificationEditorView';
		};

		return xClassificationEditorWindowView;
	}
);
