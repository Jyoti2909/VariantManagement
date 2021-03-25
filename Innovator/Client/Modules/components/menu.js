import HTMLCustomElement from './htmlCustomElement';
import SvgManager from '../core/SvgManager';
import trimSeparators from './trimSeparators';

const iconClass = 'aras-list-item__icon';
const itemClassName = 'aras-list-item';
const parentClass = 'aras-list__parent';
const focusedClass = itemClassName + '_focused';
const expandedClass = itemClassName + '_expanded';
const disabledClass = itemClassName + '_disabled';
const arrowedClass = itemClassName + '_arrowed';
const iconedClass = itemClassName + '_iconed';
const labelClass = itemClassName + '__label';
const shortcutClass = itemClassName + '__shortcut';
const containerClass = itemClassName + '__container';
const submenuContainerClass = itemClassName + '__submenu-container';
const invisibleShortcutClass = shortcutClass + '_invisible';
const arrowClass = itemClassName + '__arrow';
const hiddenArrowClass = arrowClass + '_hidden';

function getNextItem(childArray, data) {
	return childArray.find(function (nextId) {
		const item = data.get(nextId);
		return item.type !== 'separator' && !item.hidden;
	});
}

export default class Menu extends HTMLCustomElement {
	init() {
		this.state = {
			data: new Map(),
			roots: [],
			expandedItems: [],
			focusedItems: []
		};
	}
	setState(next) {
		this.state = { ...(this.state || {}), ...next };
		this.render();
	}
	connectedCallback() {
		if (!this.initialized) {
			this.addEventListener('focusout', this.focusoutHandler);
			this.addEventListener('keydown', this.keyboardHandler);
			this.initialized = true;
		}
	}
	applyData(data, roots) {
		this.setState({
			data: data || this.state.data,
			roots: roots || this.state.roots
		});
	}
	blur() {
		const itemWithFocus = this.state.focusedItems.slice(-1)[0];
		if (itemWithFocus) {
			this.querySelector(`[data-index="${itemWithFocus}"]`).blur();
		}
		super.blur();
	}
	focusoutHandler(e) {
		const isChildNodeFocused =
			e.relatedTarget && this.contains(e.relatedTarget);
		if (!isChildNodeFocused) {
			this.resetList();
		}
	}
	resetList() {
		this.setState({
			focusedItems: [],
			expandedItems: []
		});
	}
	keyboardHandler(e) {
		const key = e.code;

		if (
			![
				'ArrowUp',
				'ArrowDown',
				'ArrowLeft',
				'ArrowRight',
				'Enter',
				'NumpadEnter',
				'Space'
			].includes(key) ||
			!this.state.roots.length
		) {
			return;
		}

		const currentItemId = this.state.focusedItems.slice(-1)[0];
		const parentId = this.state.expandedItems[
			this.state.expandedItems.length - 1
		];
		let nextItemId;
		const nextState = {
			focusedItems: [...this.state.focusedItems],
			expandedItems: [...this.state.expandedItems]
		};

		if (
			['ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'NumpadEnter'].includes(
				key
			) &&
			!currentItemId
		) {
			return;
		}

		switch (key) {
			case 'ArrowUp':
			case 'ArrowDown': {
				e.preventDefault();
				if (!currentItemId) {
					nextItemId = getNextItem(
						key === 'ArrowUp'
							? [...this.state.roots].reverse()
							: this.state.roots,
						this.state.data
					);
					nextState.focusedItems.push(nextItemId);
					break;
				}

				const children =
					(this.state.data.get(parentId) || {}).children || this.state.roots;
				const nextItems =
					key === 'ArrowUp'
						? children.slice(0, children.indexOf(currentItemId)).reverse()
						: children.slice(children.indexOf(currentItemId) + 1);
				nextItemId =
					getNextItem(nextItems, this.state.data) ||
					getNextItem(
						key === 'ArrowUp' ? [...children].reverse() : children,
						this.state.data
					);
				nextState.focusedItems.pop();
				nextState.focusedItems.push(nextItemId);
				break;
			}
			case 'ArrowLeft': {
				e.preventDefault();
				if (parentId) {
					nextState.expandedItems.pop();
					nextState.focusedItems.pop();
					nextItemId = parentId;
				}
				break;
			}
			case 'ArrowRight': {
				e.preventDefault();
				const data = this.state.data.get(currentItemId);
				if (data.children && !data.disabled) {
					this.calcSubmenuPosition(e.target);
					nextItemId = getNextItem(data.children, this.state.data);
					nextState.expandedItems.push(currentItemId);
					nextState.focusedItems.push(nextItemId);
				}
				break;
			}
			case 'Enter':
			case 'NumpadEnter':
			case 'Space': {
				const data = this.state.data.get(currentItemId);
				if (data.disabled) {
					return;
				}
				if (data.children) {
					this.calcSubmenuPosition(e.target);
					nextItemId = getNextItem(data.children, this.state.data);
					nextState.expandedItems.push(currentItemId);
					nextState.focusedItems.push(nextItemId);
					break;
				}
				this.querySelector(`[data-index="${currentItemId}"]`).dispatchEvent(
					new CustomEvent('click', { bubbles: true })
				);
				this.resetList();
				return;
			}
		}

		this.setState(nextState);
		if (nextItemId) {
			this.querySelector(`[data-index="${nextItemId}"]`).focus();
		}
	}
	mouseEnterHandler(e) {
		const li = e.target.closest('li');
		if (!li) {
			return;
		}

		const itemId = li.dataset.index;
		const prevItemId = this.state.focusedItems[
			this.state.focusedItems.length - 1
		];
		const newState = {
			focusedItems: [...this.state.focusedItems],
			expandedItems: [...this.state.expandedItems]
		};
		const currentItem = this.state.data.get(itemId);
		const prevItem = this.state.data.get(prevItemId);
		if (currentItem.type !== 'separator') {
			if (prevItem) {
				if (prevItem.children) {
					if (!prevItem.children.includes(itemId)) {
						newState.expandedItems.pop();
						newState.focusedItems.pop();
					}
				} else {
					newState.focusedItems.pop();
				}
			}
			if (currentItem.children) {
				newState.expandedItems.push(itemId);
			}
			newState.focusedItems.push(itemId);
		}

		this.setState(newState);
	}
	mouseLeaveHandler = () => {
		const newState = {
			focusedItems: [...this.state.focusedItems],
			expandedItems: [...this.state.expandedItems]
		};

		const focusedItemId = this.state.focusedItems[
			this.state.focusedItems.length - 1
		];
		newState.focusedItems.pop();
		if (this.state.expandedItems.includes(focusedItemId)) {
			newState.expandedItems.pop();
		}

		this.setState(newState);
	};
	calcSubmenuPosition(parentMenuItem, options = {}) {
		const BORDER_WIDTH = 1;
		const SYNTHETIC_FRAME_PADDING = 4;
		const SCROLLBAR_WIDTH = 17;

		const submenuContainer = parentMenuItem.querySelector(
			'div.aras-list-item__submenu-container'
		);
		const submenuList = submenuContainer.querySelector('ul.aras-list');
		const isRootMenu = parentMenuItem.tagName === 'ARAS-MENU';
		const parentMenuNode = isRootMenu
			? parentMenuItem
			: parentMenuItem.closest('ul.aras-list');

		submenuContainer.style.top = 'auto';
		submenuContainer.style.bottom = 'auto';
		submenuContainer.style.right = 'auto';
		submenuContainer.style.left = 'auto';
		submenuContainer.style.width = 'auto';
		submenuList.style.maxHeight = 'none';

		const docWidth = document.documentElement.clientWidth;
		const docHeight = document.documentElement.clientHeight;
		const parentMenuItemRect = parentMenuItem.getBoundingClientRect();
		const parentMenuRect = parentMenuNode.getBoundingClientRect();

		const availableSpaceToTheTop = parentMenuItemRect.bottom;
		const availableSpaceToTheBottom = docHeight - parentMenuItemRect.top;

		// save width before we maxHeight is set, because FF won't add extra space for scrollbar causing overflow-x
		const submenuWidth = submenuContainer.offsetWidth;
		const submenuHeight = submenuContainer.clientHeight;
		const isNotEnoughVerticalSpace =
			submenuHeight > availableSpaceToTheBottom &&
			submenuHeight > availableSpaceToTheTop;
		let isScrollInSubmenuRequired = isNotEnoughVerticalSpace;

		const borderWidthOfParentMenu = BORDER_WIDTH;
		const showMenuToTopAlignmentPosition =
			parentMenuRect.bottom -
			parentMenuItemRect.bottom -
			(isRootMenu ? 0 : borderWidthOfParentMenu);
		const showMenuToBottomAlignmentPosition =
			parentMenuItemRect.top -
			parentMenuRect.top -
			(isRootMenu ? 0 : borderWidthOfParentMenu);

		if (isNotEnoughVerticalSpace) {
			const borderOfSubmenuContainer = BORDER_WIDTH;
			if (options.preventGreedyVerticalExpansion) {
				const directionBasedConfig = {
					bottom: {
						maxHeight:
							availableSpaceToTheBottom -
							SYNTHETIC_FRAME_PADDING -
							2 * borderOfSubmenuContainer,
						alignmentSide: 'top',
						alignmentSideOffset: showMenuToBottomAlignmentPosition,
						autoSide: 'bottom'
					},
					top: {
						maxHeight:
							availableSpaceToTheTop -
							SYNTHETIC_FRAME_PADDING -
							2 * borderOfSubmenuContainer,
						alignmentSide: 'bottom',
						alignmentSideOffset: showMenuToTopAlignmentPosition,
						autoSide: 'top'
					}
				};

				const preferredMenuDirection =
					availableSpaceToTheBottom > availableSpaceToTheTop ? 'bottom' : 'top';
				const verticalAlignmentConfig =
					directionBasedConfig[preferredMenuDirection];

				submenuList.style.maxHeight = verticalAlignmentConfig.maxHeight + 'px';

				submenuContainer.style[verticalAlignmentConfig.autoSide] = 'auto';
				submenuContainer.style[verticalAlignmentConfig.alignmentSide] =
					verticalAlignmentConfig.alignmentSideOffset + 'px';
			} else {
				const maxAvailableVerticalSpace =
					docHeight -
					2 * SYNTHETIC_FRAME_PADDING -
					2 * borderOfSubmenuContainer;

				if (submenuHeight > maxAvailableVerticalSpace) {
					submenuList.style.maxHeight = maxAvailableVerticalSpace + 'px';
				} else {
					isScrollInSubmenuRequired = false;
				}

				const stickToBottomCoordinate =
					docHeight - parentMenuRect.bottom - SYNTHETIC_FRAME_PADDING;
				submenuContainer.style.bottom = -stickToBottomCoordinate + 'px';
			}
		} else {
			const isEnoughSpaceForSubmenuBelow =
				availableSpaceToTheBottom > submenuHeight;

			submenuContainer.style.top = isEnoughSpaceForSubmenuBelow
				? showMenuToBottomAlignmentPosition + 'px'
				: 'auto';
			submenuContainer.style.bottom = isEnoughSpaceForSubmenuBelow
				? 'auto'
				: showMenuToTopAlignmentPosition + 'px';
		}

		const submenuContainerWidth =
			submenuWidth + (isScrollInSubmenuRequired ? SCROLLBAR_WIDTH : 0);
		if (isScrollInSubmenuRequired) {
			submenuContainer.style.width = submenuWidth + SCROLLBAR_WIDTH + 'px';
		}

		const availableSpaceToTheRight = docWidth - parentMenuRect.right;
		const availableSpaceToTheLeft = parentMenuRect.left;

		if (
			availableSpaceToTheRight > submenuContainerWidth &&
			options.horizontalAlignmentSide !== 'right'
		) {
			submenuContainer.style.left = '100%';
			return;
		} else if (
			availableSpaceToTheLeft > submenuContainerWidth &&
			options.horizontalAlignmentSide !== 'left'
		) {
			submenuContainer.style.right = '100%';
			return;
		}

		if (options.horizontalAlignmentSide) {
			const stickingConfig = {
				left: {
					delta: submenuContainerWidth - (docWidth - parentMenuRect.right),
					side: 'left'
				},
				right: {
					delta: submenuContainerWidth - parentMenuRect.left,
					side: 'right'
				}
			};
			const { side, delta } = stickingConfig[options.horizontalAlignmentSide];
			submenuContainer.style[side] = -delta + 'px';
			return;
		}

		const isRightLargerThanLeft =
			availableSpaceToTheLeft < availableSpaceToTheRight;
		const horizontalAlignmentConfig = isRightLargerThanLeft
			? {
					delta: submenuContainerWidth - availableSpaceToTheRight,
					alignmentSide: 'left',
					autoSide: 'right'
			  }
			: {
					delta: submenuContainerWidth - availableSpaceToTheLeft,
					alignmentSide: 'right',
					autoSide: 'left'
			  };

		submenuContainer.style[horizontalAlignmentConfig.autoSide] = 'auto';
		submenuContainer.style[horizontalAlignmentConfig.alignmentSide] =
			'calc(100% - ' + horizontalAlignmentConfig.delta + 'px)';
	}
	eventHandler = (e) => {
		const li = e.target.closest('li');

		if (!li) {
			e.stopPropagation();
			return;
		}

		const item = this.state.data.get(li.dataset.index);
		if (item.disabled || item.type === 'separator') {
			e.stopPropagation();
		}
	};
	on(event, callback) {
		const handler = (e) => {
			const li = e.target.closest('li');
			const elementId = li && li.dataset.index;
			callback(elementId, e);

			if (elementId && !this.state.data.get(elementId).children) {
				li.blur();
			}
		};
		this.addEventListener(event, handler);
		return () => {
			this.removeEventListener(event, handler);
		};
	}
	renderRecursive = (data, roots = []) => {
		const focusedItem = this.state.focusedItems[
			this.state.focusedItems.length - 1
		];
		const iconsRequired = roots.some((element) => {
			const item = data.get(element);
			return Boolean(item.icon || item.image);
		});

		const checkedRequired = roots.some((element) => {
			const item = data.get(element);
			return item.checked !== undefined || item.type === 'checkbox';
		});

		const arrowsRequired = roots.some((element) => {
			const item = data.get(element);
			return item.children || item.type === 'menu';
		});

		const shortcutsInfo = roots.reduce(
			(result, id) => {
				const currentShortcut = data.get(id).shortcut;
				if (!currentShortcut) {
					return result;
				}

				if (!result.shortcutsRequired) {
					result.shortcutsRequired = true;
				}

				if (currentShortcut.length > result.longestShortcut.length) {
					result.longestShortcut = currentShortcut;
				}

				return result;
			},
			{
				shortcutsRequired: false,
				longestShortcut: ''
			}
		);

		roots = trimSeparators(data, roots);
		const items = roots.reduce((acc, id) => {
			const item = data.get(id);
			if (item.hidden) {
				return acc;
			}

			const childItems = item.children;
			const isSeparator = item.type === 'separator';
			const isMenu = childItems || item.type === 'menu';
			const isExpanded = this.state.expandedItems.includes(id);
			const isFocused = this.state.focusedItems.includes(id);
			const classList = [itemClassName];
			let childList = [];
			if (!isSeparator) {
				const formattedNode = this.formatter(id, item);
				if (formattedNode === null) {
					childList = [
						<span className={labelClass}>
							{item.label || aras.getResource('', 'common.no_label')}
						</span>
					];
				} else {
					childList = [].concat(formattedNode);
				}
			}
			if (isFocused) {
				classList.push(focusedClass);
			}

			if (item.disabled) {
				classList.push(disabledClass);
			}
			if (isSeparator) {
				classList.push('separator');
			}
			if (shortcutsInfo.shortcutsRequired && item.label) {
				childList = childList.concat(
					<span
						className={`${shortcutClass} ${
							!item.shortcut ? invisibleShortcutClass : ''
						}`}
					>
						{item.shortcut || shortcutsInfo.longestShortcut}
					</span>
				);
			}
			if (arrowsRequired && !isSeparator) {
				const additionalArrowClass = isMenu ? '' : hiddenArrowClass;
				const className = `${arrowClass} ${additionalArrowClass}`;
				const arrowNode = <span className={className} />;
				childList = childList.concat(arrowNode);
				classList.push(arrowedClass);
			}
			if (iconsRequired || checkedRequired) {
				classList.push(iconedClass);
				let iconNode = SvgManager.createInfernoVNode(item.icon || item.image);
				if (!iconNode) {
					iconNode = <span />;
				}
				iconNode.className = `${iconClass} ${
					item.checked ? 'aras-icon-checked' : ''
				}`;
				childList.unshift(iconNode);
			}

			const props = {
				'data-index': id,
				tabIndex: focusedItem === id ? '0' : '-1',
				onMouseEnter: (e) => this.mouseEnterHandler(e)
			};

			if (isMenu) {
				const menuItemContentNodes = childList;
				const menuItem = (
					<div class={containerClass}>{menuItemContentNodes}</div>
				);

				childList = [menuItem];

				const submenuList = this.renderRecursive(data, childItems);
				if (submenuList) {
					const submenuListWrapper = (
						<div class={submenuContainerClass}>{submenuList}</div>
					);
					childList = childList.concat(submenuListWrapper);

					if (!item.disabled) {
						props.onMouseEnter = (e) => {
							this.calcSubmenuPosition(e.target);
							this.mouseEnterHandler(e);
						};
					}
					if (isExpanded) {
						classList.push(expandedClass);
					}
				} else if (!item.disabled) {
					classList.push(disabledClass);
				}

				classList.push(parentClass);
			}

			props.className = classList.join(' ');

			if (item.cssStyle) {
				props.style = item.cssStyle;
			}
			if (item.disabled) {
				props['aria-disabled'] = 'true';
			}
			if (!childItems) {
				props.role = isSeparator ? 'separator' : 'menuitem';
			} else {
				props['aria-haspopup'] = 'true';
				props['aria-expanded'] = isExpanded ? 'true' : 'false';
			}

			acc.push(
				<li key={id} {...props}>
					{childList}
				</li>
			);
			return acc;
		}, []);

		if (!items.length) {
			return null;
		}

		return (
			<ul
				className="aras-list"
				role="menu"
				onclick={this.eventHandler}
				onmousedown={this.eventHandler}
				onmouseleave={this.mouseLeaveHandler}
			>
				{items}
			</ul>
		);
	};

	render() {
		const menu = this.renderRecursive(this.state.data, this.state.roots);
		const wrappedMenu = menu ? (
			<div class={submenuContainerClass}>{menu}</div>
		) : null;
		Inferno.render(wrappedMenu, this);
	}

	formatter() {
		return null;
	}
}
