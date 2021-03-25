define(['dojo/_base/declare', 'Viewers/BaseViewer'], function (
	declare,
	BaseViewer
) {
	return declare('TgvViewer', [BaseViewer], {
		startup() {
			this.inherited(arguments);
			this.domNode.classList.add('tgvViewer');
		},

		getViewerSrc() {
			const tgvdId = this.args.tgvdId;
			const startConditionProvider =
				this.args.startConditionProvider || 'ItemDefault({"id":"id"})';

			return `../Modules/aras.innovator.TreeGridView/Views/MainPage.html?tgvdId=${tgvdId}&startConditionProvider=${startConditionProvider}`;
		}
	});
});
