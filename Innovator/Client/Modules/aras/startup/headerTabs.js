import SvgManager from '../../core/SvgManager';
import Tabs from '../../components/tabs';

const icons = {
	defaultItemType: '../images/DefaultItemType.svg',
	gridSearch: '../images/GridSearch.svg'
};

SvgManager.enqueue(Object.values(icons));

const IFRAME_CSS_CLASS = 'content-block__iframe';
const PAGE_IFRAME_CSS_CLASS = 'content-block__iframe_page';
export default class HeaderTabs extends Tabs {
	constructor(props) {
		super(props);
		this.data = new Map();
		this.tabs = [];
		this.draggableTabs = false;
		this.initialized = false;
		this.options = {};
	}
	connectedCallback() {
		if (!this.initialized) {
			this.html`
				<div class="aras-tabs aras-tabs_a aras-flex-grow">
					<span class="aras-tabs-arrow"></span>
					<div class="aras-tabs__list-container">
					</div>
					<span class="aras-tabs-arrow"></span>
				</div>
				<aras-dropdown closeonclick position="bottom-right" class="aras-dropdown-container">
					<div class="tabs-button" dropdown-button></div>
					<div class="aras-dropdown">
					</div>
				</aras-dropdown>
			`;

			const dropdownContainer = this.querySelector('.aras-dropdown-container');
			dropdownContainer.addEventListener(
				'dropdownbeforeopen',
				function () {
					this.dropdownTabRender();
				}.bind(this)
			);

			this._dropdownBox = dropdownContainer.querySelector('div.aras-dropdown');
			this._frameCssClass = IFRAME_CSS_CLASS;
			this._elem = this.firstElementChild;
			this._movable = this._elem.querySelector('div');

			this.makeScroll();
			this.makeSelectable();
			this.makeDraggable();
			this.connectKeyboard();

			this.setAttribute('role', 'tablist');
			this.setAttribute('aria-orientation', 'horizontal');

			this.initialized = true;
		}
		this.render();
	}
	openForm(formId, icon, label) {
		if (!formId) {
			return null;
		}
		const formName = aras.MetadataCache.GetFormName(formId);
		const tab = this.tabs.find(function (tab) {
			return tab.indexOf('form_' + formId + formName + '_') !== -1;
		});
		if (tab) {
			this.selectTab(tab);
			return;
		}
		const url = aras.getScriptsURL(
			'ShowFormInFrame.html?formId=' + formId + '&formType=edit&item=undefined'
		);
		const winName = 'form_' + formId + formName + '_' + Date.now();
		const win = this.open(url, winName, false, PAGE_IFRAME_CSS_CLASS);
		this.updateTitleTab(winName, { label: label, image: icon });

		return win;
	}
	openPage(url, itemTypeId, icon, label) {
		if (!url) {
			return null;
		}
		const itemTypeName = aras.getItemTypeName(itemTypeId) || '';
		const tab = this.tabs.find(function (tab) {
			return tab.indexOf('page_' + itemTypeName + '_' + url) !== -1;
		});
		if (tab) {
			this.selectTab(tab);
			return;
		}
		const winName = 'page_' + itemTypeName + '_' + url + '_' + Date.now();
		url = aras.getScriptsURL(url);
		const win = this.open(url, winName, false, PAGE_IFRAME_CSS_CLASS);
		this.updateTitleTab(winName, { label: label, image: icon });

		return win;
	}
	openSearch(itemtypeID, favoriteSearchId) {
		if (!itemtypeID) {
			return null;
		}
		const itemTypeDescriptor = aras.getItemTypeForClient(itemtypeID, 'id');
		if (itemTypeDescriptor.getItemCount() < 1) {
			return null;
		}
		const itemTypeName = itemTypeDescriptor.getProperty('name');
		const tabLabel =
			itemTypeDescriptor.getProperty('label_plural') || itemTypeName;
		const url = aras.getScriptsURL(
			'itemsGrid.html?itemtypeID=' +
				itemtypeID +
				'&itemtypeName=' +
				itemTypeName +
				(favoriteSearchId ? '&favoriteSearchId=' + favoriteSearchId : '')
		);

		const winName = 'search_' + itemtypeID + itemTypeName + '_' + Date.now();

		const win = this.open(url, winName, false);
		const frameElement = win.frameElement;

		const frameLoadHandler = function () {
			const shortcutSettings = {
				windows: [win],
				context: window
			};
			window.registerShortcutsAtMainWindowLocation(shortcutSettings);
			frameElement.removeEventListener('load', frameLoadHandler);
		};

		win.addEventListener('resize', async () => {
			window.dispatchEvent(new CustomEvent('resize'));
			await this.render();
			this.scrollIntoView(this.selectedTab);
		});

		frameElement.addEventListener('load', frameLoadHandler);

		this.updateTitleTab(winName, {
			label: tabLabel,
			image: icons.gridSearch
		});

		return win;
	}
	_hideAll() {
		this.tabs.forEach((id) => {
			const frame = document.getElementById(id);
			frame.style.opacity = 0;
			frame.style['z-index'] = '-1';
		});
	}
	ejectTab(id) {
		const data = this.data.get(id);
		super.removeTab(id);
		this.options.updateTabState && this.options.updateTabState(this.tabs);
		return data;
	}
	async selectTab(id, preventFocus) {
		if (!id) {
			this.selectedTab = null;
			return;
		}

		this._hideAll();
		const frame = document.getElementById(id);
		frame.style.opacity = 1;
		frame.style['z-index'] = 'auto';
		if (!preventFocus) {
			this.focusTab(id);
		}

		return await super.selectTab(id);
	}
	focusTab(id) {
		const frame = document.getElementById(id);
		const contentWindow = frame.contentWindow;
		if (contentWindow.nativeFocus) {
			contentWindow.nativeFocus();
		} else {
			contentWindow.focus();
		}
	}
	_getNextTabId() {
		const lastTabId = this.tabs[this.tabs.length - 1];
		if (lastTabId === this.selectedTab) {
			return this.tabs[this.tabs.length - 2] || null;
		}

		return lastTabId || null;
	}
	removeTab(id, ignorePageCloseHooks = false) {
		const frame = document.getElementById(id);
		if (!frame) {
			return Promise.resolve();
		}

		const remove = () => {
			super.removeTab(frame.id);
			this.options.updateTabState && this.options.updateTabState(this.tabs);
			const itemId = frame.id.replace(aras.mainWindowName + '_', '');
			aras.uiUnregWindowEx(itemId);
			frame.src = 'about:blank';
			frame.parentNode.removeChild(frame);
		};
		if (frame.contentWindow.close.toString().indexOf('[native code]') > -1) {
			remove();
			return Promise.resolve();
		}

		return new Promise(function (resolve) {
			frame.contentWindow.close(function (isClosed) {
				if (isClosed) {
					remove();
				}
				resolve(isClosed);
			}, ignorePageCloseHooks);
		});
	}
	async clickOpenInTearOff(id) {
		if (!id) {
			return;
		}

		const win = document.getElementById(id).contentWindow;
		if (win.windowType) {
			return await this.openNonItemWindow(win, id);
		}

		const selectItem = win.item;
		const itemId = selectItem.getAttribute('id');
		const itemType = selectItem.getAttribute('type');
		const ignorePageCloseHooks = true;

		const isClosed = await this.removeTab(id, ignorePageCloseHooks);
		if (!isClosed) {
			return;
		}

		const gettedItem = aras.getItemById(itemType, itemId);
		const openInTearOff = true;
		return await aras.uiShowItemEx(gettedItem, 'tab view', openInTearOff);
	}
	openNonItemWindow(win, id) {
		const itemId = win.itemId;
		const itemTypeName = win.itemTypeName;
		const windowType = win.windowType;
		return this.removeTab(id).then(function (isClosed) {
			if (isClosed) {
				if (windowType === 'whereUsed' || windowType === 'structureBrowser') {
					window.Dependencies.view(
						itemTypeName,
						itemId,
						windowType === 'whereUsed',
						aras,
						true
					);
				}
			}
		});
	}
	setTitleTabWithFrame(frameWindow) {
		let itemTypeName;
		let item;

		if (!frameWindow.frameElement) {
			return;
		}

		if (frameWindow.item && frameWindow.itemTypeName) {
			item = frameWindow.item;
			itemTypeName = frameWindow.itemTypeName;
		} else {
			const win = window[frameWindow.paramObjectName];
			itemTypeName = window[frameWindow.paramObjectName].itemTypeName;
			item = win.item;
		}

		const winName = frameWindow.frameElement.getAttribute('id');
		const itemTypeNd = aras.getItemTypeDictionary(itemTypeName).node;
		const itemTypeImgSrc =
			aras.getItemProperty(itemTypeNd, 'open_icon') || icons.defaultItemType;
		const keyedName = aras.getKeyedNameEx(item);
		const props = {
			label: keyedName,
			image: itemTypeImgSrc
		};
		this.updateTitleTab(winName, props);
	}
	async updateTitleTab(id, props) {
		await this.setTabContent(id, props);
		this.scrollIntoView(id);
	}
	addTab(id, options, position) {
		super.addTab(id, options, position);
		this.options.updateTabState && this.options.updateTabState(this.tabs);
	}
	open(src, winName, isUnfocused, className) {
		const iframe = document.createElement('IFRAME');
		const isFirstTab = this.tabs.length === 0;
		document.getElementById('center').appendChild(iframe);
		this.addTab(winName, { closable: true });
		if (!winName.startsWith('innovator_')) {
			const addedTab = this.data.get(winName);
			addedTab.parentTab = null;
		}
		iframe.id = winName;
		iframe.className = `${this._frameCssClass} ${className || ''}`.trim();
		iframe.src = src;
		iframe.setAttribute('role', 'tabpanel');
		if (isUnfocused && !isFirstTab) {
			iframe.style.opacity = 0;
			iframe.style['z-index'] = '-1';
		} else {
			this.selectTab(winName, isUnfocused);
		}
		const win = iframe.contentWindow;
		win.opener = window;
		win.name = iframe.name = winName;
		return win;
	}
	dropdownTabRender() {
		const select = function (event) {
			const target = event.target;
			const listTab = target.closest('li');

			if (listTab) {
				const currentSelectedTabId = this.selectedTab;
				this.selectTab(listTab.getAttribute('list-data-id'));

				this.dispatchEvent(
					new CustomEvent('select', {
						detail: {
							id: this.selectedTab,
							previousId: currentSelectedTabId
						}
					})
				);
			}
		}.bind(this);

		const items = this.tabs.map(
			function (tab) {
				const data = this.data.get(tab);
				const icon = this._getImage(data.image);
				if (icon) {
					icon.className = 'aras-list-item__icon';
				}
				const className =
					'aras-list-item aras-list-item_iconed' +
					(this.selectedTab === tab ? ' selected' : '');

				return (
					<li className={className} list-data-id={tab}>
						<span className="condition-icon aras-icon-radio" />
						{icon}
						{data.label}
					</li>
				);
			}.bind(this)
		);
		const list = (
			<ul className="aras-list" onmousedown={select}>
				{items}
			</ul>
		);
		Inferno.render(list, this._dropdownBox);
	}
	updateTabInformation(currentID, newID) {
		const index = this.tabs.indexOf(currentID);
		if (index !== -1) {
			this.tabs[index] = newID;
		}

		const dataObj = this.data.get(currentID);
		this.data.delete(currentID);
		this.data.set(newID, Object.assign({}, dataObj));

		if (currentID === this.selectedTab) {
			this.selectedTab = newID;
		}

		const frame = document.getElementById(currentID);
		frame.id = frame.name = newID;
		this.render();
	}
	getSearchGridTabs(id) {
		return this.tabs
			.filter(function (item) {
				return item.indexOf('search_' + id) > -1;
			})
			.map(function (item) {
				return window.document.getElementById(item).contentWindow;
			});
	}
	render() {
		const isTabOpen = this.tabs.length > 0;
		this.classList.toggle('content-block__main-tabs_hidden', !isTabOpen);
		return super.render();
	}
	forceCloseAllTabs() {
		this.tabs.forEach((id) => {
			this.data.delete(id);
			const frame = window.document.getElementById(id);
			const itemId = frame.id.replace(aras.mainWindowName + '_', '');
			aras.uiUnregWindowEx(itemId);
			frame.src = 'about:blank';
		});
		this.tabs = [];
	}
	async closeTabs(tabs = [...this.tabs]) {
		const editedTabs = [];
		const promisesArray = tabs.map((tabId) => {
			let isEdited = false;
			if (tabId.startsWith('innovator_')) {
				const tabWindow = window.document.getElementById(tabId).contentWindow;
				isEdited =
					tabWindow.aras &&
					(tabWindow.aras.isDirtyEx(tabWindow.item) ||
						tabWindow.aras.isTempEx(tabWindow.item));
			}

			if (isEdited) {
				editedTabs.push(tabId);
				return Promise.resolve();
			}

			return this.removeTab(tabId);
		});
		await Promise.all(promisesArray);

		for (let i = 0; i < editedTabs.length; i++) {
			const tabId = editedTabs[i];
			await this.selectTab(tabId);
			await this.removeTab(tabId);
		}

		return await this.render();
	}
	closeOtherTabs(excludedTabId) {
		const excludedTabIndex = this.tabs.indexOf(excludedTabId);
		const removableTabs = this.tabs.slice();
		removableTabs.splice(excludedTabIndex, 1);

		return this.closeTabs(removableTabs);
	}
}
