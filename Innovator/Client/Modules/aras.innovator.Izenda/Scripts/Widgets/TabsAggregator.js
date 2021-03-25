require([], function () {
	var tabsAggregator = {
		tabsList: {},
		templateString: '<div></div>',
		innovatorTabsPostfix: '_InnovatorTab',
		tabsContainerId: '',
		tabsDictionary: [
			'ItemTypes',
			'Properties',
			'Summary',
			'Chart',
			'Chart2',
			'Gauge',
			'Misc',
			'Style',
			'Filters',
			'Preview'
		],
		activeTab: null,

		getActiveTab: function () {
			return tabsAggregator.activeTab;
		},

		getTab: function (tabName) {
			return tabsAggregator.tabsList[tabName];
		},

		selectTab: function (idx) {
			if (tabsAggregator.tabsList[tabsAggregator.tabsDictionary[idx]]) {
				if (
					tabsAggregator.tabsList[tabsAggregator.tabsDictionary[idx]].onSelect
				) {
					tabsAggregator.activeTab =
						tabsAggregator.tabsList[tabsAggregator.tabsDictionary[idx]];
					tabsAggregator.tabsList[
						tabsAggregator.tabsDictionary[idx]
					].onSelect();
					tabsAggregator.tabsList[
						tabsAggregator.tabsDictionary[idx]
					].onResize();
				}
			}
		},

		addTab: function (tab, metadata) {
			tabsAggregator.tabsList[tab.name] = tab;
			tabsAggregator.createTabContainerIfNotExists(
				tabsAggregator.tabsDictionary[
					tabsAggregator.tabsDictionary.indexOf(tab.name)
				]
			);
			tab.placeAt(
				document.getElementById(tab.name + tabsAggregator.innovatorTabsPostfix)
			);
			tabsAggregator.tabsList[tab.name].init(
				(this.metaData && this.metaData[tab.name]) ||
					Izenda.Utils.getDefaultMetadataObject()
			);
		},

		createTabContainerIfNotExists: function (tabName) {
			var idx = tabsAggregator.tabsDictionary.indexOf(tabName);
			var isTabExists = document.getElementById(
				tabName + tabsAggregator.innovatorTabsPostfix
			);
			if (!isTabExists) {
				var innovatorTabContainer = document.createElement('div');
				innovatorTabContainer.id =
					tabName + tabsAggregator.innovatorTabsPostfix;
				var izendaTabContainer = document.getElementById(
					tabsAggregator.tabsContainerId
				).childNodes[idx];
				var insertedEl = izendaTabContainer.insertBefore(
					innovatorTabContainer,
					izendaTabContainer.childNodes[0]
				);
			}
		},

		getMetaData: function () {
			var tabsMetadata = {};
			var keys = Object.keys(this.tabsList);
			for (var i = 0; i < keys.length; i++) {
				var tab = this.tabsList[keys[i]];
				tabsMetadata[tab.name] = tab.getMetaData();
			}

			return encodeURIComponent(JSON.stringify(tabsMetadata));
		}
	};

	dojo.setObject('Izenda.UI.Widgets.TabsAggregator', tabsAggregator);
});
