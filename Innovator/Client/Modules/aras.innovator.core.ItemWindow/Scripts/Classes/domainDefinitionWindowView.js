ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.ItemWindow/DomainDefinitionWindowView',
	function (DefaultItemWindowView) {
		function DomainDefinitionWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		DomainDefinitionWindowView.prototype = new DefaultItemWindowView();

		DomainDefinitionWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.core.ItemWindow/domainDefinitionEditorView';
		};

		return DomainDefinitionWindowView;
	}
);
