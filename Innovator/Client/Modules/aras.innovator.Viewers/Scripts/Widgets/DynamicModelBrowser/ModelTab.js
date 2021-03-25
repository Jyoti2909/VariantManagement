VC.Utils.Page.LoadWidgets([
	'DynamicModelBrowser/TabBase',
	'DynamicModelBrowser/TreeNodesManager'
]);

require([
	'dojo/aspect',
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/popup',
	'dojo/dom-style'
], function (aspect, declare, connect, popup, domStyle) {
	return dojo.setObject(
		'VC.DynamicModelBrowser.Tabs.ModelTab',
		declare(
			[
				VC.DynamicModelBrowser.Tabs.TabBase,
				VC.DynamicModelBrowser.TreeNodesManager
			],
			{
				tabID: 'model',
				tgvdId: null,
				rootItemId: null,
				countTopLevelAssemblies: 1,
				tree: null,

				constructor: function (args) {
					args = args || {
						tgvdId: null,
						rootItemId: null
					};
					args.id = 'modelTab';
					this.title = VC.Utils.GetResource('modelTabTitle');
					this.tgvdId = args.tgvdId;
					this.rootItemId = args.rootItemId;
					this.content =
						'<div><div id="modelBrowserTree" class="DynamicModelBrowserTree" data-dojo-type="dijit/layout/ContentPane"></div></div>';
				},

				startup: function () {
					this.createTgvComponent();
				},

				createTgvComponent: function () {
					const url = this.constructTgvMainPageUrl();
					const tgvPage = this.createTgvPage(url);

					const modelBrowserTree = document.getElementById('modelBrowserTree');
					modelBrowserTree.appendChild(tgvPage);
				},

				constructTgvMainPageUrl: function () {
					const startConditionProviderParam =
						'startConditionProvider=parent.CustomStartConditionProvider()';
					const tgvdIdParam = 'tgvdId=' + this.tgvdId;
					const tgvUrl = aras.getBaseURL(
						'/Modules/aras.innovator.TreeGridView/Views/MainPage.html?'
					);
					const allParams = [tgvdIdParam, startConditionProviderParam].join(
						'&'
					);
					this.setTgvComponentSettings();

					return tgvUrl.concat(allParams);
				},

				setTgvComponentSettings: function () {
					var self = this;
					window.tgvMainPageCustomExtensionPath =
						'Viewers/TGV/MainPageExtension';

					window.CustomStartConditionProvider = function () {
						this.getCondition = function () {
							const idlist = [self.rootItemId];
							return {
								id: idlist
							};
						};
					};
				},

				createTgvPage: function (tgvUrl) {
					const iframe = document.createElement('iframe');
					iframe.id = 'threeDTreeGridViewer';
					iframe.width = '100%';
					iframe.height = '100%';
					iframe.frameBorder = '0';
					iframe.scrolling = 'auto';
					iframe.src = tgvUrl;
					iframe.style.position = 'absolute';
					iframe.style.top = '0';
					iframe.style.left = '0';

					return iframe;
				}
			}
		)
	);
});
