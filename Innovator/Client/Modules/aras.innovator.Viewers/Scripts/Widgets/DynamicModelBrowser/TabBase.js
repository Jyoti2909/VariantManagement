require(['dojo/_base/declare', 'dijit/layout/ContentPane'], function (
	declare,
	ContentPane
) {
	return dojo.setObject(
		'VC.DynamicModelBrowser.Tabs.TabBase',
		declare(ContentPane, {
			name: null,
			title: null,
			isActive: false,

			setTabVisibility: function (doVisible) {
				this.isActive = doVisible;
			}
		})
	);
});
