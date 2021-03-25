import {
	contentTabId,
	getSidebarData,
	updateLockedStatus
} from '../NavigationPanel/sidebarDataConverter';
import HeaderTabsContainer from './HeaderTabsContainer';
import cuiContextMenu from '../cui/cuiContextMenu';
import CuiLayout from '../cui/layouts/CuiLayout';
import cuiMethods from '../cui/cuiMethods';
import cuiToc from '../cui/cuiToc';
import cuiToolbar from '../cui/cuiToolbar';
import ContextMenu from '../components/contextMenu';
import mainWindowActions from './MainWindowCuiActions';
import cuiBackgroundPage from '../cui/cuiBackgroundPage';
import itemTypeMetadata from '../metadata/itemType';

const tocContextMenuLocation = 'PopupMenuMainWindowTOC';

export default class MainWindowCuiLayout extends CuiLayout {
	_initBackgroundPromise = null;
	_initTocPromise = null;
	backgroundPage = document.getElementById('backgroundPage');
	deferredLocations = ['PopupMenuSecondaryMenu'];
	navigationPanel = document.getElementById('navigationPanel');
	tabsContainer = null;
	actions = mainWindowActions(this.setState.bind(this));
	initialState = {
		splitScreen: {
			dockTabs: [],
			mainTabs: []
		},
		navigationPanel: {
			isVisible: false
		}
	};

	async init() {
		this.initializePropsAndState();

		this.tabsContainer = new HeaderTabsContainer(
			document.getElementById('dock-tab'),
			document.getElementById('main-tab'),
			{
				actions: this.actions
			}
		);

		sessionStorage.setItem('defaultDState', 'defaultDState');

		const initHeader = this._initializeHeader();
		const initBackgroundPage = this._initializeBackgroundPage();
		const initToc = this._initializeToc();
		const initContextMenu = this._initializeContextMenu(tocContextMenuLocation);
		const initHeaderTabsContextMenu = this._initializeHeaderTabsContextMenu();
		this._preloadDeferredLocations();

		const headerControl = await initHeader;
		this._registerHeaderHandlers(headerControl);

		await initToc;
		window.selectStartPage();
		this._registerTocHandlers();

		const contextMenu = await initContextMenu;
		this._registerNavPanelHandlers(contextMenu);
		this._setupNavPanel();

		await this._initializeSidebar();
		this._registerSidebarHandlers();

		const headerTabsContextMenu = await initHeaderTabsContextMenu;
		this._registerHeaderTabsContextMenuHandlers(headerTabsContextMenu);

		await initBackgroundPage;
		this._registerBackgroundPageHandlers();
	}

	getHeaderOptions() {
		return {
			...this.options,
			splitScreen: this.state.splitScreen,
			navigationPanel: this.state.navigationPanel,
			toggleSplitScreenMode: () => this.tabsContainer.toggleSplitScreenMode()
		};
	}

	updateLayout(oldProps, oldState) {
		this.renderHeader(oldState);
		this._updateBackgroundPage(oldState);
	}

	renderHeader(oldState) {
		this.updateHeaderOptions(this.getHeaderOptions());
		if (oldState.splitScreen !== this.state.splitScreen) {
			const oldSplitScreen = oldState.splitScreen;
			const newSplitScreen = this.state.splitScreen;
			if (
				oldSplitScreen.dockTabs.length + newSplitScreen.dockTabs.length === 1 ||
				oldSplitScreen.mainTabs.length + newSplitScreen.mainTabs.length === 1
			) {
				this.observer.notify('SplitScreen');
			}
		}
		if (oldState.navigationPanel !== this.state.navigationPanel) {
			this.observer.notify('NavigationPanelVisibility');
		}
	}

	async updateCuiLayoutOnItemChange(itemTypeName) {
		const itemType = await itemTypeMetadata.getItemType(
			'CuiDependency',
			'name'
		);
		const morphaes = itemType['Morphae'] ?? [];
		const needToCuiUpgrade = morphaes.some((morphae) => {
			const morphaeName = morphae['related_id@aras.name'];
			return morphaeName === itemTypeName;
		});
		if (needToCuiUpgrade) {
			this.observer.notify('reInitByCUIDependencies');
		}
	}

	async _initializeBackgroundPage(options = {}) {
		if (this._initBackgroundPromise) {
			return this._initBackgroundPromise;
		}

		this._initBackgroundPromise = cuiBackgroundPage(
			this.backgroundPage,
			'TOC',
			{ ...this.options, ...options }
		);
		await this._initBackgroundPromise;
		this._initBackgroundPromise = null;
	}

	_initializeContextMenu(location) {
		return cuiContextMenu(this.navigationPanel.popupMenu, location, {
			...this.options,
			isDashboard: () => true
		});
	}

	_initializeHeaderTabsContextMenu() {
		return cuiContextMenu(new ContextMenu(), 'HeaderTabsContextMenu', {
			...this.options,
			tabs: []
		});
	}

	_registerHeaderTabsContextMenuHandlers(contextMenu) {
		this.tabsContainer.attachContextMenu(contextMenu);
	}

	async _initializeHeader() {
		const toolbarComponent = document.getElementById('headerCommandsBar');
		const headerCuiToolbar = await cuiToolbar(
			toolbarComponent,
			'MainWindowHeader',
			this.getHeaderOptions()
		);
		this.updateHeaderOptions = headerCuiToolbar.updateOptions;
		toolbarComponent.firstChild.classList.add('aras-header');

		return toolbarComponent;
	}

	_initializeSidebar() {
		const tabs = this.navigationPanel.tabs;
		const navData = this.navigationPanel.nav.data;
		const favoriteItemTypes = window.favorites.getDataMap('ItemType');
		const sidebarData = getSidebarData(favoriteItemTypes, navData);
		sidebarData.forEach((item, id) => {
			tabs.addTab(id, item);
		});
		tabs.selectTab(contentTabId);

		return tabs.render();
	}

	async _initializeToc() {
		if (this._initTocPromise) {
			return this._initTocPromise;
		}

		const nav = this.navigationPanel.nav;
		this._initTocPromise = cuiToc(nav, 'TOC', this.options);

		await this._initTocPromise;
		this._initTocPromise = null;

		return this._initTocPromise;
	}

	_setupNavPanel() {
		const isTocPinned =
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_toc_pinned'
			) === '1';

		if (isTocPinned) {
			this.navigationPanel.togglePin(true);
			this.navigationPanel.toggleVisibility(true);
		}
	}

	_registerBackgroundPageHandlers() {
		this.observer.subscribe(async (event) => {
			if (event !== 'UpdateTOC') {
				return;
			}

			await this._initializeBackgroundPage();
			this._toggleBackgroundPage(this.state.splitScreen);
		});
	}

	_registerNavPanelHandlers(contextMenu) {
		let activeLocation = tocContextMenuLocation;
		const contextMenus = {
			[activeLocation]: contextMenu
		};
		this.navigationPanel.addEventListener(
			'navigationPanelContextMenu',
			async (event) => {
				const { x, y, location, ...detail } = event.detail;
				const itemTypeName = detail.itemTypeName;
				const itemTypePromise = itemTypeMetadata.getItemType(
					itemTypeName,
					'name'
				);

				if (activeLocation !== location) {
					activeLocation = location;
					contextMenus[location] = await this._initializeContextMenu(location);
				}

				const favorites = window.favorites;
				const itemType = await itemTypePromise;
				const options = {
					...detail,
					favorites,
					itemType
				};
				contextMenus[location].show({ x, y }, options);
			}
		);
		this.navigationPanel.addEventListener('sidebarPin', (event) => {
			const { state } = event.detail;
			aras.setPreferenceItemProperties('Core_GlobalLayout', null, {
				core_toc_pinned: Number(state)
			});
		});
		this.navigationPanel.addEventListener('sidebarClose', () => {
			this.actions.navigationPanel.updateVisibility(false);
		});
		this.navigationPanel.addEventListener('sidebarShow', () => {
			this.actions.navigationPanel.updateVisibility(true);
		});
	}

	_registerHeaderHandlers(headerControl) {
		this.observer.subscribe((event) => {
			switch (event) {
				case 'reInitByCUIDependencies':
					this._initializeHeader();
					break;
				case 'UpdateNotifications':
				case 'UpdatePreferences':
				case 'SplitScreen':
				case 'NavigationPanelVisibility':
					cuiMethods.reinitControlItems(
						headerControl,
						event,
						this.getHeaderOptions()
					);
					break;
			}
		});
		aras.registerEventHandler('PreferenceValueChanged', window, () => {
			this.observer.notify('UpdatePreferences');
		});
	}

	_registerSidebarHandlers() {
		this.observer.subscribe(async (event) => {
			if (event !== 'UpdateTOC') {
				return;
			}

			await this._initializeToc();
			const nav = this.navigationPanel.nav;
			const tabs = this.navigationPanel.tabs;
			updateLockedStatus(tabs.data, nav.data);
			tabs.render();
		});
	}

	_registerTocHandlers() {
		this.observer.subscribe(async (event) => {
			if (event !== 'UpdateTOC') {
				return;
			}

			aras.MetadataCache.DeleteConfigurableUiDatesFromCache();
			await this._initializeToc();
			this.navigationPanel.resetState();
		});
	}

	async _toggleBackgroundPage({ dockTabs, mainTabs }) {
		const hidden = dockTabs.length > 0 || mainTabs.length > 0;
		if (hidden) {
			await this._initBackgroundPromise;
			HyperHTMLElement.bind(this.backgroundPage)``;
		} else {
			await this._initializeBackgroundPage({ renderOnly: true });
		}
	}

	_updateBackgroundPage(oldState) {
		const splitScreenState = this.state.splitScreen;
		if (splitScreenState === oldState.splitScreen) {
			return;
		}

		this._toggleBackgroundPage(splitScreenState);
	}
}
