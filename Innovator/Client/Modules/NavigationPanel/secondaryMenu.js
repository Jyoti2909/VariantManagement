import getResource from '../core/resources';
import SvgManager from '../core/SvgManager';
// eslint-disable-next-line no-unused-vars
import QuickSearch from './quickSearch';

const icons = {
	search: '../images/ExecuteSearch.svg',
	createItem: '../images/CreateItem.svg'
};

SvgManager.enqueue(Object.values(icons));

const secondaryMenuClass =
	'aras-navigation-panel__secondary-menu aras-secondary-menu';
const secondaryMenuHiddenClass = 'aras-secondary-menu_hidden';

function getButtonsSection(context) {
	const secondaryMenuData = context.state.secondaryMenuData;
	if (!secondaryMenuData) {
		return null;
	}

	return HyperHTMLElement.wire(context.state, ':buttons')`
		<div class="aras-secondary-menu__buttons-container">
			<button
				class="aras-button aras-secondary-menu__create-button"
				disabled=${!secondaryMenuData.canAdd}
				onclick="${() => context._createNewItem(secondaryMenuData.itemTypeId)}"
			>
				${ArasModules.SvgManager.createHyperHTMLNode(icons.createItem, {
					class: 'aras-button__icon'
				})}
				<span class="aras-button__text">
					${aras.getResource(
						'',
						'navigation_panel.secondary_menu.create_new',
						secondaryMenuData.singularLabel
					)}
				</span>
			</button>
			<button
				class="aras-button aras-secondary-menu__search-button"
				onclick="${() => context._searchItemType(secondaryMenuData.itemTypeId)}"
			>
				${ArasModules.SvgManager.createHyperHTMLNode(icons.search, {
					class: 'aras-button__icon'
				})}
				<span class="aras-button__text">
					${aras.getResource(
						'',
						'navigation_panel.secondary_menu.search',
						secondaryMenuData.pluralLabel
					)}
				</span>
			</button>
			<aras-quick-search
				class="aras-secondary-menu__quick-search"
				itemType=${secondaryMenuData.itemTypeName}
				disabled=${secondaryMenuData.isQuickSearchDisabled}
				onchange=${(event) => context._openItem(event)}
				emptyMessage=${getResource(
					'navigation_panel.secondary_menu.quick_search_invalid_message',
					secondaryMenuData.singularLabel
				)}
			></aras-quick-search>
		</div>
	`;
}

function keyboardHandler(e) {
	const key = e.code;
	const list = e.currentTarget;

	if (['ArrowUp', 'ArrowDown'].includes(key)) {
		const currentNode =
			list.querySelector('[tabindex="0"]') || list.childNodes[0];
		const nextElement =
			key === 'ArrowUp' ? 'previousElementSibling' : 'nextElementSibling';
		const nextNode = currentNode[nextElement]
			? currentNode[nextElement]
			: currentNode;

		if (currentNode !== nextNode) {
			currentNode.tabIndex = '-1';
			nextNode.tabIndex = '0';
			nextNode.focus();
		}
	}
}

function getFavoriteCategory(categoryData, secondaryMenuData) {
	return HyperHTMLElement.wire()`
		<span class="aras-secondary-menu__favorite-category-label">${
			categoryData.label
		}</span>
		<ul class="aras-nav" role="list"
			onkeydown="${(e) => keyboardHandler(e)}">
			${categoryData.items.map((favoriteItem, idx) => {
				const label =
					favoriteItem.label || aras.getResource('', 'common.no_label');
				return HyperHTMLElement.wire(favoriteItem, ':favorite')`
						<li class="aras-nav__child" data-id="${favoriteItem.id}"
							tabindex=${idx === 0 ? '0' : '-1'}
							role="listitem">
							${ArasModules.SvgManager.createHyperHTMLNode(categoryData.icon, {
								overlayIcons: categoryData.overlayIcons
							})}
							<span class="aras-nav__label">${label}</span>
							${getUnpinFavoriteButton(favoriteItem, categoryData, secondaryMenuData)}
						</li>
					`;
			})}
		</div>
	`;
}

function getUnpinFavoriteButton(favoriteItem, categoryData, secondaryMenuData) {
	if (
		!categoryData.unpinIcon ||
		favoriteItem.ownedBy !== secondaryMenuData.loggedUserIdentity
	) {
		return null;
	}

	const tooltipString = aras.getResource(
		'',
		'navigation_panel.secondary_menu.unpin_favorite'
	);
	return HyperHTMLElement.wire(favoriteItem, ':unpinIcon')`
		<span
			class="aras-button aras-button_c aras-nav-leaf-ico"
			title="${tooltipString}"
		>
			${ArasModules.SvgManager.createHyperHTMLNode(categoryData.unpinIcon)}
		</span>`;
}

function getFavoritesSection(context) {
	const secondaryMenuData = context.state.secondaryMenuData;
	if (!secondaryMenuData || !secondaryMenuData.favoriteCategories.length) {
		return null;
	}

	return HyperHTMLElement.wire(context.state, ':favorites')`
		<div
			class="aras-secondary-menu__favorites-container"
			onclick="${(e) => context._favoritesClick(e)}"
			onkeypress="${(e) => {
				const key = e.code;
				if (['Space', 'Enter', 'NumpadEnter'].includes(key)) {
					context._favoritesClick(e);
				}
			}}"
			oncontextmenu="${(e) => context._favoritesContextMenuHandler(e)}"
		>
			${secondaryMenuData.favoriteCategories.map((categoryData) =>
				getFavoriteCategory(categoryData, secondaryMenuData)
			)}
		</div>
	`;
}

export default function (context) {
	const secondaryMenuData = context.state.secondaryMenuData;
	const className = `${secondaryMenuClass} ${
		secondaryMenuData ? '' : secondaryMenuHiddenClass
	}`;
	return HyperHTMLElement.wire(context)`
		<div class="${className}" tabindex="0">
			${getButtonsSection(context)}
			${getFavoritesSection(context)}
		</div>
	`;
}
