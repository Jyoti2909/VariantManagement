// eslint-disable-next-line no-unused-vars
import Nav from '../components/nav/nav';
import Sidebar from '../components/sidebar';
import ContextMenu from '../components/contextMenu';
// eslint-disable-next-line no-unused-vars
import NavigationPanelTabs from './NavigationPanelTabs';
import utils from '../core/utils';
import { contentTabId } from './sidebarDataConverter';
import secondaryMenu from './secondaryMenu';
import SvgManager from '../core/SvgManager';
import getResource from '../core/resources';
import itemTypeMetadata from '../../Modules/metadata/itemType';

const icons = {
	back: '../images/BackFull.svg',
	close: '../images/Close.svg',
	defaultItemType: '../images/DefaultItemType.svg',
	search: '../images/ExecuteSearch.svg',
	open: '../images/OpenInTab.svg',
	pinned: '../images/PinnedOn.svg',
	savedSearch: '../images/SavedSearchOverlay.svg',
	unpinned: '../images/PinnedOff.svg'
};

SvgManager.enqueue(Object.values(icons));

const disabledRowHighlightingClass =
	'aras-navigation-panel_row-highlighting-disabled';

const dashboardProperties = ['startPage', 'on_click_handler', 'formId'];
const isDashboard = (item) =>
	dashboardProperties.some((property) => item[property]) || !item.itemTypeId;

function navFormatter(nav, item) {
	const itemValue = item.value;
	if (itemValue.children) {
		return null;
	}

	const isDashboardItem = isDashboard(itemValue);
	if (itemValue.itemTypeId || isDashboardItem) {
		const leafTemplate = nav.templates.getDefaultTemplate(item);
		const nodeClassList = isDashboardItem
			? 'aras-nav-leaf-ico'
			: 'aras-button aras-button_c aras-nav-leaf-ico';
		const nodeIconUrl = isDashboardItem ? icons.open : icons.search;

		leafTemplate.push(
			Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				nodeClassList,
				ArasModules.SvgManager.createInfernoVNode(nodeIconUrl),
				utils.infernoFlags.unknownChildren
			)
		);

		return leafTemplate;
	}

	return null;
}

function getFavoriteCategories(itemTypeName, options) {
	const favoritesFilterCriteria = (favoriteItem) => {
		return (
			favoriteItem.quickAccessFlag === '1' &&
			favoriteItem.contextType === itemTypeName
		);
	};
	const favoriteSearches = window.favorites.getDataMap(
		'Search',
		favoritesFilterCriteria
	);
	const favoriteItems = window.favorites.getDataMap(
		'Item',
		favoritesFilterCriteria
	);

	const favoriteCategories = [];
	if (favoriteSearches.size) {
		const label = getResource(
			'navigation_panel.secondary_menu.favorite_searches'
		);
		favoriteCategories.push({
			icon: options.icon,
			overlayIcons: [icons.savedSearch],
			unpinIcon: icons.close,
			label,
			items: Array.from(favoriteSearches.values())
		});
	}
	if (favoriteItems.size) {
		favoriteCategories.push({
			icon: options.icon,
			label: options.pluralLabel,
			items: Array.from(favoriteItems.values())
		});
	}
	return favoriteCategories;
}

async function getItemTypeData(itemTypeId) {
	const itemType = await itemTypeMetadata.getItemType(itemTypeId, 'id');
	const itemTypeName = itemType.name;
	const singularLabel = itemType.label || itemTypeName;
	const propertiesWithKeyedName = itemTypeMetadata.getKeyedNameConfiguration(
		itemType
	);
	const canAdd = itemTypeMetadata.isAllowToAdd(itemType);
	const openForbidden = window.isFunctionDisabled(itemTypeName, 'Open');
	const isQuickSearchDisabled =
		openForbidden || !propertiesWithKeyedName.length;

	return { canAdd, isQuickSearchDisabled, itemTypeName, singularLabel };
}

export default class NavigationPanel extends Sidebar {
	nav = document.createElement('aras-nav');
	tabs = document.createElement('aras-navigation-panel-tabs');
	state = {
		secondaryMenuItemTypeId: null,
		secondaryMenuData: null
	};

	togglePin(pinned) {
		super.togglePin(pinned);
		this.render();
	}

	toggleVisibility(visible) {
		super.toggleVisibility(visible);
		const splitter = this.nextElementSibling;
		const isVisible = this.isVisible;
		splitter.classList.toggle('aras-hide', !isVisible);
		if (isVisible && this.isPinned) {
			setTimeout(() => {
				this.focus();
			});
		}
	}

	focus() {
		if (!this.state.secondaryMenuItemTypeId) {
			return super.focus();
		}

		const quickSearch = this.querySelector(
			'.aras-secondary-menu__quick-search:not([disabled])'
		);

		if (quickSearch) {
			quickSearch.focus();
		} else {
			const navHeader = this.querySelector('.aras-navigation-panel__header');
			navHeader.focus();
		}
	}

	render() {
		this.state.secondaryMenuData = this._getSecondaryMenuData();
		const secondaryMenuData = this.state.secondaryMenuData;
		const contentsTitle = secondaryMenuData
			? secondaryMenuData.pluralLabel
			: getResource('common.contents');

		const pinIcon = this.isPinned ? icons.pinned : icons.unpinned;
		const pinIconNode = SvgManager.createHyperHTMLNode(pinIcon, {
			class: 'aras-button__icon'
		});
		const backTitle = getResource(
			'navigation_panel.secondary_menu.back_to_contents'
		);
		this.html`
		<div class="aras-navigation-panel__header" tabindex="0" aria-label="${contentsTitle}">
			<button
				class="${'aras-button aras-button_c ' + (secondaryMenuData ? '' : 'aras-hide')}"
				onclick="${() => this._hideSecondaryMenu()}"
				title="${backTitle}"
			>
				${ArasModules.SvgManager.createHyperHTMLNode(icons.back, {
					class: 'aras-button__icon'
				})}
			</button>
			${ArasModules.SvgManager.createHyperHTMLNode(secondaryMenuData?.icon, {
				class: 'aras-navigation-panel__header-icon'
			})}
			<span class="aras-navigation-panel__header-title">
				${contentsTitle}
			</span>
			<span
				class="aras-navigation-panel__pin-icon aras-button aras-button_c"
				onclick="${() => this.togglePin()}"
			>
				${pinIconNode}
			</span>
		</div>
		${this.nav}
		${secondaryMenu(this)}
		${this.tabs}`;
	}

	connectedCallback() {
		super.connectedCallback();
		this.classList.add('aras-navigation-panel', disabledRowHighlightingClass);
		this.setAttribute('role', 'navigation');
		this.popupMenu = new ContextMenu();
		this._initContextMenuHandlers();
		this._initContextMenuListeners();
		const observer = new MutationObserver((mutations) => {
			const navPanel = mutations[0].target;
			const panelWidth = navPanel.style.width;
			navPanel.nextElementSibling.style.left = panelWidth;
		});

		observer.observe(this, {
			attributes: true,
			attributeFilter: ['style']
		});
		this.render();
	}

	created() {
		this._initTOC();
		this._initTabs();
	}

	resetState() {
		this.state.secondaryMenuData = null;
		this.render();
	}

	_initContextMenuHandlers() {
		const sidebarTabs = this.tabs;
		const contextMenuMethods = {
			pinItemType: (id, tabData) => sidebarTabs.addTab(id, tabData),
			unpinItemType: (id) => {
				const tabsData = sidebarTabs.data;
				const removedTab = tabsData.get(id);
				sidebarTabs.removeTab(id);
				return removedTab;
			},
			getItemTypeByItemTypeId: (itemTypeId) => {
				let tabId;
				const tabsData = sidebarTabs.data;
				tabsData.forEach((data, id) => {
					if (data.itemTypeId === itemTypeId) {
						tabId = id;
					}
				});
				return tabsData.get(tabId);
			},
			isDashboard,
			openSearch: (...args) => window.arasTabs.openSearch(...args)
		};
		const dispatchContextMenuEvent = (location, event, options) => {
			event.preventDefault();
			const detail = {
				location,
				x: event.clientX,
				y: event.clientY,
				...options
			};
			const cuiEvent = new CustomEvent('navigationPanelContextMenu', {
				detail
			});
			this.dispatchEvent(cuiEvent);
		};
		sidebarTabs.on('contextmenu', (itemKey, event) => {
			const currentTarget = sidebarTabs.data.get(itemKey);
			const itemTypeName = currentTarget.contextType;
			const options = {
				currentTarget,
				itemTypeName,
				...contextMenuMethods
			};
			dispatchContextMenuEvent('PopupMenuMainWindowTOC', event, options);
		});
		const nav = this.nav;
		nav.on('contextmenu', (itemKey, event) => {
			nav.select(itemKey);
			const currentTarget = nav.data.get(itemKey);
			const itemTypeId = currentTarget.itemTypeId;
			const itemTypeName = itemTypeMetadata.getItemTypeName(itemTypeId);
			const options = {
				currentTarget,
				itemTypeName,
				...contextMenuMethods
			};
			dispatchContextMenuEvent('PopupMenuMainWindowTOC', event, options);
		});
		this._favoritesContextMenuHandler = (event) => {
			const favoriteItemRow = event.target.closest('.aras-nav__child');
			if (!favoriteItemRow) {
				return;
			}

			favoriteItemRow.classList.add('aras-nav__child_selected');
			const unselectHighlightedItem = () => {
				favoriteItemRow.classList.remove('aras-nav__child_selected');
				this.popupMenu.dom.removeEventListener(
					'contextMenuClose',
					unselectHighlightedItem
				);
			};
			this.popupMenu.dom.addEventListener(
				'contextMenuClose',
				unselectHighlightedItem
			);

			const favoriteId = favoriteItemRow.dataset.id;
			const currentTarget = window.favorites.get(favoriteId);
			const itemTypeName = currentTarget.contextType;
			const options = {
				currentTarget,
				itemTypeName
			};
			dispatchContextMenuEvent('PopupMenuSecondaryMenu', event, options);
		};
	}

	_initContextMenuListeners() {
		const contextMenuDom = this.popupMenu.dom;
		contextMenuDom.addEventListener('contextMenuShow', () => {
			this.classList.remove(disabledRowHighlightingClass);
		});
		contextMenuDom.addEventListener('contextMenuClose', (e) => {
			this.classList.add(disabledRowHighlightingClass);
			if (e.detail.type === 'keydown') {
				this.focus();
				return;
			}

			if (!this.isPinned) {
				setTimeout(() => {
					this.closeIfNotAcitive(document.activeElement);
				});
			}
		});
		contextMenuDom.addEventListener('click', () => {
			this._hideIfNotPinned();
		});
	}

	_initTOC() {
		const selectTab = (dataItem) => {
			const tabs = this.tabs;
			tabs.data.forEach((tabItem, id) => {
				if (tabItem.itemTypeId === dataItem.itemTypeId) {
					tabs.selectTab(id);
				}
			});
		};
		this.nav.classList.add('aras-nav-toc');
		this.nav.formatter = navFormatter.bind(null, this.nav);
		const handler = async (itemKey, event) => {
			if (
				event.type === 'keydown' &&
				!['Enter', 'Space', 'NumpadEnter'].includes(event.code)
			) {
				return;
			}
			const dataItem = this.nav.data.get(itemKey);
			const isNewTabOpened =
				dataItem.on_click_handler ||
				dataItem.formId ||
				dataItem.startPage ||
				event.target.closest('.aras-button.aras-nav-leaf-ico');
			if (isNewTabOpened) {
				this._hideIfNotPinned();
			} else if (dataItem.itemTypeId) {
				this._showSecondaryMenu(dataItem.itemTypeId);
				selectTab(dataItem);
			}
		};
		this.nav.on('click', handler);
		this.nav.on('keydown', handler);
	}

	_initTabs() {
		this.tabs.on('select', (id) => {
			if (id === contentTabId) {
				this._hideSecondaryMenu();
				return;
			}

			const item = this.tabs.data.get(id);
			this._showSecondaryMenu(item.itemTypeId);
		});
		this.tabs.on('click', (id) => {
			if (id === contentTabId) {
				this._hideSecondaryMenu();
			}
		});
	}

	_isElementInSidebar(element) {
		return (
			super._isElementInSidebar(element) ||
			(element && this.popupMenu.dom.contains(element))
		);
	}

	_hideIfNotPinned() {
		if (!this.isPinned) {
			this.toggleVisibility(false);
			document.documentElement.focus(); // for correct work of sidebar in IE and FF
		}
	}

	_getSecondaryMenuData() {
		const itemTypeId = this.state.secondaryMenuItemTypeId;
		if (!itemTypeId) {
			return null;
		}

		const items = [...this.nav.data.values()];
		const item = items.find((item) => item.itemTypeId === itemTypeId);
		if (!item) {
			this._hideSecondaryMenu();
			return null;
		}

		const { icon = icons.defaultItemType, label: pluralLabel } = item;
		const itemTypeName = itemTypeMetadata.getItemTypeName(itemTypeId);
		const favoriteCategories = getFavoriteCategories(itemTypeName, {
			icon,
			pluralLabel
		});

		if (this.state.secondaryMenuData?.itemTypeId === itemTypeId) {
			return {
				...this.state.secondaryMenuData,
				favoriteCategories
			};
		}

		const loggedUserIdentity = aras.getIsAliasIdentityIDForLoggedUser();
		const secondaryMenuData = {
			canAdd: false,
			favoriteCategories,
			icon,
			itemTypeId,
			itemTypeName,
			isQuickSearchDisabled: true,
			loggedUserIdentity,
			pluralLabel,
			singularLabel: itemTypeName
		};

		this._updateSecondaryMenuData(itemTypeId);

		return secondaryMenuData;
	}

	_showSecondaryMenu(itemTypeId) {
		this.state.secondaryMenuItemTypeId = itemTypeId;
		this.render();
		this.nav.style.visibility = 'hidden';
		this.focus();
	}

	_hideSecondaryMenu() {
		this.state.secondaryMenuItemTypeId = null;
		this.tabs.selectTab(contentTabId);
		this.render();
		this.nav.style.visibility = 'visible';
		this.nav.focus();
	}

	async _updateSecondaryMenuData(itemTypeId) {
		const itemTypeData = await getItemTypeData(itemTypeId);
		if (this.state.secondaryMenuItemTypeId !== itemTypeId) {
			return;
		}

		this.state.secondaryMenuData = {
			...this.state.secondaryMenuData,
			...itemTypeData
		};
		this.render();
		this.focus();
	}

	_favoritesClick(event) {
		const favoriteItemRow = event.target.closest('.aras-nav__child');
		if (!favoriteItemRow) {
			return;
		}

		const favoriteId = favoriteItemRow.dataset.id;
		const favoriteItem = window.favorites.get(favoriteId);
		const unpinIconNode = event.target.closest(
			'.aras-button.aras-nav-leaf-ico'
		);
		if (unpinIconNode) {
			window.favorites.removeFromQuickAccess(favoriteId);
		} else if (favoriteItem.category === 'Item') {
			aras.uiShowItemLastVersion(
				favoriteItem.contextType,
				favoriteItem.additional_data.id
			);
			this._hideIfNotPinned();
		} else if (favoriteItem.category === 'Search') {
			this._searchItemType(this.state.secondaryMenuItemTypeId, favoriteId);
		}
	}

	_createNewItem(itemTypeId) {
		const item = aras.getItemTypeName(itemTypeId);
		if (item === 'GAG_MechanicalPart') {
			const formData = aras.getItemByName('Form', 'GAG_SelectClassificationDialog');
			const formId = formData.getAttribute('id');

			const tempItemForForm = aras.newIOMItem('DialogContext');

			const dialogParameters = {
				title: 'Select classification',
				formId: formId,
				aras: aras,
				item: tempItemForForm,
				itemType: tempItemForForm.getType(),
				itemTypeNd: aras.getItemTypeByFormID(formId),
				parentWindow: window,
				dialogWidth: aras.getItemProperty(formData, 'width'),
				dialogHeight: aras.getItemProperty(formData, 'height'),
				content: 'ShowFormAsADialog.html'
			};

			window.ArasModules.Dialog.show('iframe', dialogParameters).promise.then((classification) => {
				if (classification) {
					const newItem = aras.newItem;
					try {
						aras.newItem = (itemTypeName) => {
							aras.newItem = newItem;
							const args = {
								classification: classification
							};
							const result = aras.newItem(itemTypeName, null, args);
							return result;
						};
						return aras.uiNewItemExAsync(itemTypeId).then(() => {
							this._hideIfNotPinned();
						});
					}
					finally{
						aras.newItem = newItem;
					}
				}
			});
		} else {
			return aras.uiNewItemExAsync(itemTypeId).then(() => {
				this._hideIfNotPinned();
			});
		}
	}

	_searchItemType(itemTypeId, favoriteSearchId) {
		return Promise.resolve(
			window.arasTabs.openSearch(itemTypeId, favoriteSearchId)
		).then(() => {
			this._hideIfNotPinned();
		});
	}

	async _openItem(event) {
		const quickSearch = event.currentTarget;
		const selectedItem = quickSearch.getSelectedItem();
		if (!selectedItem) {
			return;
		}
		quickSearch.clear();
		await aras.uiShowItem(quickSearch.state.itemType, selectedItem.itemId);
	}
}

NavigationPanel.define('aras-navigation-panel');
