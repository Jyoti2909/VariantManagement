function RelationshipsTabbarWrapper() {
	this.tabs = document.querySelector(
		'.aras-item-view__relationship-accordion > .aras-tabs[slot="header"]'
	);
}

RelationshipsTabbarWrapper.prototype = {
	_tabs: {},
	addTab: function (tabId, label) {
		const iframe = HyperHTMLElement.wire()([
			'<div ' +
				'	class="aras-switcher-pane"' +
				'	data-rel-type-id="' +
				tabId +
				'"' +
				'	role="tabpanel"' +
				'	switcher-pane-id="' +
				tabId +
				'"' +
				'	aria-hidden="true"' +
				'>' +
				'	<iframe' +
				'		id="' +
				tabId +
				'"' +
				'		frameborder="0"' +
				'		width="100%"' +
				'		height="600"' +
				'		scrolling="no"' +
				'		src="about:blank"' +
				'	/>' +
				'</div>'
		]);
		this.tabs.switcher.appendChild(iframe);
		this.tabs.addTab(tabId, { label: label });
	},

	clear: function () {
		const tabsComponent = this.tabs;
		tabsComponent.tabs.forEach(function (tabId) {
			const relationshipFrame = document.getElementById(tabId);
			if (relationshipFrame) {
				relationshipFrame.src = 'about:blank';
			}
		});
		tabsComponent.data.clear();
		tabsComponent.tabs = [];
		tabsComponent.render();

		const switcher = tabsComponent.switcher;
		while (switcher.hasChildNodes()) {
			switcher.removeChild(switcher.firstChild);
		}
	},

	GetSelectedTab: function () {
		return this.tabs.selectedTab;
	},

	GetTabId: function (label) {
		const items = this.tabs.tabs;
		const data = this.tabs.data;
		return (
			items.find(function (tabId) {
				return data.get(tabId).label === label;
			}) || null
		);
	},

	GetTabLabel: function (tabId) {
		const tab = this.tabs.data.get(tabId);
		return tab && !tab.hidden ? tab.label : null;
	},

	getTabOrder: function (separator) {
		return this.tabs.tabs.join(separator || ',');
	},

	GetTabOrder: function (separator) {
		return this.getTabOrder(separator);
	},

	isRelationshipTab: function (tabId) {
		tabId = tabId || this.GetSelectedTab();
		const relationshipIframe = document.getElementById(tabId);
		if (!relationshipIframe) {
			return false;
		}

		return (
			relationshipIframe.src.includes('relationshipsGrid.html') ||
			relationshipIframe.src.includes('relationshipsInfernoGrid.html')
		);
	},

	isTgvTab: function (tabId) {
		tabId = tabId || this.GetSelectedTab();
		const tabIframe = document.getElementById(tabId);
		if (!tabIframe) {
			return false;
		}

		return tabIframe.src.includes('aras.innovator.TreeGridView');
	},

	MoveTab: function (tabId, newIndex) {
		const tabs = this.tabs.tabs;
		const currentIndex = tabs.indexOf(tabId);
		if (currentIndex === -1) {
			return;
		}
		tabs.splice(currentIndex, 1);
		tabs.splice(newIndex, 0, tabId);
		this.tabs.render();
	},

	onClick: function (tabId) {},

	RemoveTab: function (tabId) {
		this.tabs.removeTab(tabId);
		const relationshipFrame = document.getElementById(tabId);
		if (!relationshipFrame) {
			return;
		}
		relationshipFrame.src = 'about:blank';

		const switcher = this.tabs.switcher;
		const relationshipSwitcherPane = switcher.querySelector(
			'[switcher-pane-id="' + tabId + '"]'
		);
		switcher.removeChild(relationshipSwitcherPane);
	},

	removeTabByLabel: function (label) {
		const tabId = this.GetTabId(label);
		this.RemoveTab(tabId);
	},

	selectChild: function () {},

	selectTab: function (tabId) {
		const previousId = this.GetSelectedTab();
		if (previousId === tabId || !this.tabs.selectTab(tabId)) {
			return;
		}
		const event = new CustomEvent('select', {
			detail: {
				id: this.GetSelectedTab(),
				previousId: previousId
			}
		});
		this.tabs.dispatchEvent(event);
	},

	setTabEnabled: function (tabId, enabled) {
		this.tabs.setTabContent(tabId, { disabled: !enabled });
	},

	SetTabEnabled: function (tabID, enabled) {
		this.setTabEnabled(tabID, enabled);
	},

	SetTabOrder: function (order, separator) {
		this.tabs.tabs = order.split(separator || ',');
		return this.tabs.render();
	},

	SetTabOrderByLabel: function (tabOrder, separator) {
		this.tabs.tabs = tabOrder.split(separator || ',').map(function (label) {
			return this.GetTabId(label);
		}, this);
		return this.tabs.render();
	},

	setTabVisible: function (tabId, visible) {
		this.tabs.setTabContent(tabId, { hidden: !visible });
	},

	SetTabVisible: function (tabId, visible) {
		this.setTabVisible(tabId, visible);
	},

	_getTab: function (tabId) {
		if (!this.tabs.data.has(tabId)) {
			return null;
		}

		if (!this._tabs[tabId]) {
			const self = this;
			this._tabs[tabId] = {
				on: function (event, callback) {
					if (event === 'show') {
						this.onShow = callback;
						self.tabs.on('select', function (selectedTabId) {
							if (selectedTabId === tabId) {
								callback();
							}
						});
					}
				},
				onShow: function () {}
			};
		}

		return this._tabs[tabId];
	},

	_getHiddenTab: function (tabId) {
		const tab = this.tabs.data.get(tabId);
		return tab && tab.hidden ? tab : null;
	}
};
