const SPLIT_CSS_CLASS = 'content-block_split';
const ACTIVE_TABBAR_CSS_CLASS = 'content-block__main-tabs_active';
const DOCK_FRAME_CSS_CLASS = 'content-block__iframe_dock';

export default class HeaderTabsContainer {
	dockHeaderTabs;
	undockHeaderTabs;
	#requestId;
	#activeTabbar;
	constructor(dockHeaderTabs, undockHeaderTabs, options = {}) {
		this.dockHeaderTabs = dockHeaderTabs;
		this.undockHeaderTabs = undockHeaderTabs;

		this.undockHeaderTabs.addEventListener('focusin', (event) => {
			this._setActiveTabbar(this.undockHeaderTabs);
		});
		this.dockHeaderTabs.addEventListener('focusin', (event) => {
			this._setActiveTabbar(this.dockHeaderTabs);
		});
		this.dockHeaderTabs.addEventListener('select', (event) => {
			if (!event.detail.id) {
				this.updateTabbarsStyle();
				this._setActiveTabbar(this.undockHeaderTabs);
			}
		});
		this.undockHeaderTabs.addEventListener('select', (event) => {
			if (!event.detail.id && this.dockHeaderTabs.data.size > 0) {
				this._setActiveTabbar(this.dockHeaderTabs);
			}
		});

		this.undockHeaderTabs.options.updateTabState =
			options.actions.updateUndockedTabs;
		this.dockHeaderTabs.options.updateTabState =
			options.actions.updateDockedTabs;
	}
	on(eventType, callback) {
		const removeDockHandler = this.dockHeaderTabs.on(
			eventType,
			(tabId, event) => callback(this.dockHeaderTabs, tabId, event)
		);
		const removeUndockHandler = this.undockHeaderTabs.on(
			eventType,
			(tabId, event) => callback(this.undockHeaderTabs, tabId, event)
		);
		return () => {
			removeDockHandler();
			removeUndockHandler();
		};
	}
	attachContextMenu(contextMenu) {
		if (!contextMenu) {
			return;
		}

		const tabsHandlers = {
			dockTab: (id) => this.dockTab(id),
			undockTab: (id) => this.undockTab(id),
			isDockedTab: (id) => this.isDockedTab(id)
		};
		this.on('contextmenu', (tabbar, tabId, event) => {
			event.preventDefault();
			const currentTarget = tabbar.data.get(tabId);

			contextMenu.show(
				{ x: event.clientX, y: event.clientY },
				{
					tabs: [...tabbar.tabs],
					currentTarget: { ...currentTarget, id: tabId },
					closeTab: (id) => tabbar.removeTab(id),
					closeTabs: (ids) => tabbar.closeTabs(ids),
					closeOtherTabs: (id) => tabbar.closeOtherTabs(id),
					openInTearOff: (id) => tabbar.clickOpenInTearOff(id),
					...tabsHandlers
				}
			);
		});
	}
	isDockedTab(tabId) {
		return this.dockHeaderTabs.tabs.includes(tabId);
	}
	_moveTab(tabId, tabbarFrom, tabbarTo, position) {
		const data = tabbarFrom.ejectTab(tabId);
		data.parentTab = null;
		tabbarTo.addTab(tabId, data, position);
		const frame = document.getElementById(tabId);
		frame.classList.toggle(
			DOCK_FRAME_CSS_CLASS,
			tabbarTo === this.dockHeaderTabs
		);
	}
	dockTab(tabId) {
		this._moveTab(tabId, this.undockHeaderTabs, this.dockHeaderTabs);
		this.updateTabbar(tabId, this.dockHeaderTabs);
	}
	undockTab(tabId) {
		if (this.dockHeaderTabs.tabs.length === 1) {
			this.exitSplitscreen();
			return;
		}
		this._moveTab(tabId, this.dockHeaderTabs, this.undockHeaderTabs);
		this.updateTabbar(tabId, this.undockHeaderTabs);
	}
	updateTabbarsStyle() {
		const isNeedSplit = this.dockHeaderTabs.data.size > 0;
		const tabsParentElement = this.dockHeaderTabs.parentElement;
		tabsParentElement.classList.toggle(SPLIT_CSS_CLASS, isNeedSplit);

		const splitter = tabsParentElement.querySelector('aras-splitter');
		const splitterWidth = splitter.offsetWidth;
		if (splitterWidth === 0 && isNeedSplit) {
			throw new Error(
				'The width of the splitter cannot be zero if split screen mode is enabled'
			);
		}

		const splitterColumnWidth = `${splitterWidth}px`;
		const startColumnSize = `calc(50% - ${splitterWidth / 2}px)`;
		const splitColumnStyle = `${startColumnSize} ${splitterColumnWidth} ${startColumnSize}`;

		const shouldUpdateStyles = !(
			isNeedSplit && tabsParentElement.style['grid-template-columns']
		);

		if (shouldUpdateStyles) {
			tabsParentElement.style['grid-template-columns'] = isNeedSplit
				? splitColumnStyle
				: null;
		}
	}
	updateActiveTabbarObserver() {
		const isNeedSplit = this.dockHeaderTabs.data.size > 0;
		if (isNeedSplit) {
			this.startActiveTabbarObserver();
		} else {
			this.stopActiveTabbarObserver();
		}
	}
	updateTabbar(tabId, tabbar) {
		tabbar.selectTab(tabId);
		this._setActiveTabbar(tabbar);
		this.updateTabbarsStyle();
		this.updateActiveTabbarObserver();
	}
	startActiveTabbarObserver() {
		if (this.#requestId) {
			return;
		}

		this.#requestId = requestAnimationFrame(this._checkActiveTabbar.bind(this));
	}
	stopActiveTabbarObserver() {
		cancelAnimationFrame(this.#requestId);
		this.#requestId = null;
	}
	_checkActiveTabbar() {
		setTimeout(() => {
			if (!this.#requestId) {
				return;
			}

			this.#requestId = requestAnimationFrame(
				this._checkActiveTabbar.bind(this)
			);
		}, 200);

		const activeElement = document.activeElement;
		const activeElementTagName = activeElement && activeElement.tagName;

		if (activeElementTagName === 'IFRAME') {
			const tabbar = this.getTabbarByTabId(activeElement.id);
			if (tabbar) {
				this._setActiveTabbar(tabbar);
			}
		}
	}
	_setActiveTabbar(tabbar) {
		if (this.#activeTabbar === tabbar) {
			return;
		}
		this.#activeTabbar = tabbar;
		const isDockTabbarActive = tabbar === this.dockHeaderTabs;
		this.dockHeaderTabs.classList.toggle(
			ACTIVE_TABBAR_CSS_CLASS,
			isDockTabbarActive
		);
		this.undockHeaderTabs.classList.toggle(
			ACTIVE_TABBAR_CSS_CLASS,
			!isDockTabbarActive
		);
	}
	getTabbarByTabId(tabId) {
		if (this.dockHeaderTabs.tabs.includes(tabId)) {
			return this.dockHeaderTabs;
		}

		if (this.undockHeaderTabs.tabs.includes(tabId)) {
			return this.undockHeaderTabs;
		}

		return null;
	}
	isExistAnyTabs() {
		const dockHeaderTabsExist = !!this.dockHeaderTabs.tabs.length;
		const undockHeaderTabsExist = !!this.undockHeaderTabs.tabs.length;

		return dockHeaderTabsExist || undockHeaderTabsExist;
	}
	getSearchGridTabs(id) {
		return [
			...this.dockHeaderTabs.getSearchGridTabs(id),
			...this.undockHeaderTabs.getSearchGridTabs(id)
		];
	}
	openPage(url, itemTypeId, icon, label) {
		if (!url) {
			return null;
		}
		const itemTypeName = aras.getItemTypeName(itemTypeId) || '';
		const openedPageTabId = this.dockHeaderTabs.tabs.find(
			(tab) => tab.indexOf('page_' + itemTypeName + '_' + url) !== -1
		);

		if (openedPageTabId) {
			this.dockHeaderTabs.selectTab(openedPageTabId);
			return;
		}

		return this.undockHeaderTabs.openPage(url, itemTypeId, icon, label);
	}
	openForm(formId, icon, label) {
		if (!formId) {
			return null;
		}
		const formName = aras.MetadataCache.GetFormName(formId);
		const openedFormTabId = this.dockHeaderTabs.tabs.find(
			(tab) => tab.indexOf('form_' + formId + formName + '_') !== -1
		);

		if (openedFormTabId) {
			this.dockHeaderTabs.selectTab(openedFormTabId);
			return;
		}

		return this.undockHeaderTabs.openForm(formId, icon, label);
	}
	toggleSplitScreenMode() {
		const isSplitScreenModeEnabled = this.dockHeaderTabs.tabs.length > 0;
		if (isSplitScreenModeEnabled) {
			this.exitSplitscreen();
		} else {
			const selectedTab = this.undockHeaderTabs.selectedTab;
			this.dockTab(selectedTab);
		}
	}
	exitSplitscreen() {
		const selectedTab = this.#activeTabbar.selectedTab;
		const dockHeaderTabs = [...this.dockHeaderTabs.tabs];
		dockHeaderTabs.forEach((tabId, index) => {
			this._moveTab(tabId, this.dockHeaderTabs, this.undockHeaderTabs, index);
		});
		this.updateTabbar(selectedTab, this.undockHeaderTabs);
	}
}
