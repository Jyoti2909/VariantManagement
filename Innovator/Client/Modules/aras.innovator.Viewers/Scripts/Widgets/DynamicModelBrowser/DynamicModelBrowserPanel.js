VC.Utils.Page.LoadWidgets([
	'ModelBrowser/ModelBrowserPanel',
	'DynamicModelBrowser/ModelTab',
	'ModelBrowser/ViewsTab'
]);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Widgets.DynamicModelBrowserPanel',
		declare([VC.Widgets.ModelBrowserPanel], {
			minSize: 320,
			defaultWidth: 320,

			constructor: function (args) {
				args.id = 'dynamicModelBrowserPanel';
			},

			createTabs: function (args) {
				const modelTabArgs = {
					tgvdId: args.tgvdId,
					rootItemId: args.rootItemId
				};

				this.modelTab = new VC.DynamicModelBrowser.Tabs.ModelTab(modelTabArgs);
				this.viewsTab = new VC.ModelBrowser.Tabs.ViewsTab({});
			}
		})
	);
});
