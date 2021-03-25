ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.core.ItemWindow/DerivedRelationshipWindowView',
	function (DefaultItemWindowView) {
		function DerivedRelationshipWindowView(inDom, inArgs) {
			this.inDom = inDom;
			this.inArgs = inArgs;
		}

		DerivedRelationshipWindowView.prototype = new DefaultItemWindowView();

		DerivedRelationshipWindowView.prototype.getViewUrl = function () {
			return '/Modules/aras.innovator.core.ItemWindow/derivedRelationshipView';
		};

		return DerivedRelationshipWindowView;
	}
);
