VC.Utils.Page.LoadWidgets(['ModelBrowser/ModelTab', 'ModelBrowser/ViewsTab']);

require([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/_base/lang',
	'Aras/Client/Controls/Experimental/SimpleTabbar',
	'dijit/layout/ContentPane',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!../Views/ModelBrowserPanelTemplate.html'
], function (
	declare,
	connect,
	lang,
	simpleTabbar,
	ContentPane,
	_WidgetBase,
	_TemplatedMixin,
	template
) {
	return dojo.setObject(
		'VC.Widgets.ModelBrowserPanel',
		declare([ContentPane, _WidgetBase, _TemplatedMixin], {
			templateString: '',
			isOpened: null,
			defaultWidth: 300,
			minSize: 110,
			onAfterShow: function () {},
			onAfterHide: function () {},

			tabContainer: null,
			modelTab: null,
			viewsTab: null,

			constructor: function (args) {
				Object.defineProperty(this, 'width', {
					get: function () {
						return this.domNode.offsetWidth;
					}
				});

				args = args || {};
				args.id = 'modelBrowserPanel';
				this.templateString = template;
				this.class = 'ModelBrowserPanel';
				this.region = 'left';
				this.splitter = true;
				this.style = 'width:' + this.defaultWidth + 'px';
				this.createTabs(args);
			},

			createTabs: function (args) {
				this.modelTab = new VC.ModelBrowser.Tabs.ModelTab({
					cadId: args.cadId,
					resolution: args.resolution
				});
				this.viewsTab = new VC.ModelBrowser.Tabs.ViewsTab({});
			},

			show: function () {
				var tabsBarHeight = '32px'; //32px Model/Views tabs height. Used to calculate a height of tab container
				this.domNode.style.display = '';
				this.domNode.style.top = VC.Widgets.Moveable.topLimiter + 'px';
				this.domNode.style.left = 0;
				this.isOpened = true;
				this.onAfterShow();
				this.tabContainer.domNode.style.width = '100%';
				this.tabContainer.domNode.style.height =
					'calc(100% - ' + tabsBarHeight + ')';
				this.tabContainer.resize();
			},

			hide: function () {
				this.domNode.style.display = 'none';
				this.isOpened = false;
				this.onAfterHide();
			},

			disable: function () {
				this.domNode.style.opacity = '0.2';
				this.domNode.style.pointerEvents = 'none';
			},

			enable: function () {
				this.domNode.style.opacity = '1';
				this.domNode.style.pointerEvents = 'auto';
			},

			postCreate: function () {
				this.inherited(arguments);
				this.hide();

				var self = this;

				clientControlsFactory.createControl(
					'Aras.Client.Controls.Experimental.SimpleTabbar',
					{},
					function (control) {
						self.tabContainer = control;
						self.domNode.appendChild(self.tabContainer.domNode);

						self.addTab(self.modelTab);
						self.addTab(self.viewsTab);
						self.modelTab.startup();
						self.tabContainer.selectTab(self.modelTab.tabID);

						clientControlsFactory.on(self.tabContainer, {
							onClick: lang.hitch(self, self.tabbarClick)
						});
					}
				);
			},

			tabbarClick: function (tabId) {
				var isModelTabSelected = tabId === this.modelTab.tabID;

				this.modelTab.setTabVisibility(isModelTabSelected);
				this.viewsTab.setTabVisibility(!isModelTabSelected);
			},

			addTab: function (tab) {
				var self = this;

				this.tabContainer.addChild(tab);
				connect.connect(tab, 'onShow', function () {
					self.tabContainer.onClick(this.tabID);
				});
				this.tabContainer.tabs.addTab(tab.tabID);
				this.tabContainer.tabs.setTabContent(tab.tabID, { label: tab.title });
			}
		})
	);
});
