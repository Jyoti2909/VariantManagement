import navTemplates from './navTemplates';
import HTMLCustomElement from '../htmlCustomElement';

function getPrevIndex(nav, item) {
	if (item.children && nav.expandedItemsKeys.has(item.id)) {
		const nextItemId = item.children[item.children.length - 1];
		return getPrevIndex(nav, nav.dataStore.items.get(nextItemId));
	}
	return item.id;
}
function getNextIndex(nav, item) {
	const element = nav.querySelector(
		`[data-key="${item.id.replace('\\', '\\\\')}"]`
	);
	const nextSibling = element.nextElementSibling;
	if (nextSibling) {
		return nextSibling.dataset.key;
	}
	const parentElement = element.parentElement.closest('li.aras-nav__parent');
	if (parentElement) {
		return getNextIndex(
			nav,
			nav.dataStore.items.get(parentElement.dataset.key)
		);
	}
	return null;
}
function processArrowKey(nav, key) {
	const currentItemId = nav.focusedItemKey || nav.selectedItemKey;
	if (!currentItemId) {
		return Array.from(nav.dataStore.roots)[0];
	}

	const items = nav.dataStore.items;
	const currentElement = nav.querySelector(
		`[data-key="${currentItemId.replace('\\', '\\\\')}"]`
	);
	const currentItem = items.get(currentItemId);
	const parentElement = currentElement.parentElement.closest(
		'li.aras-nav__parent'
	);
	const parentId = parentElement && parentElement.dataset.key;

	let nextFocusedId;
	switch (key) {
		case 'ArrowUp': {
			const prevElement = currentElement.previousElementSibling;
			if (prevElement) {
				const prevId = prevElement.dataset.key;
				nextFocusedId = getPrevIndex(nav, items.get(prevId));
			} else {
				nextFocusedId = parentId || currentItemId;
			}
			break;
		}
		case 'ArrowDown': {
			if (nav.expandedItemsKeys.has(currentItemId)) {
				nextFocusedId = currentItem.children[0];
				break;
			}
			const nextElement = currentElement.nextElementSibling;
			if (nextElement) {
				nextFocusedId = nextElement.dataset.key;
			} else {
				nextFocusedId =
					getNextIndex(nav, items.get(parentId || currentItemId)) ||
					currentItemId;
			}
			break;
		}
		case 'ArrowLeft':
			if (nav.expandedItemsKeys.has(currentItemId)) {
				nav.collapse(currentItemId);
				return;
			}
			nextFocusedId = parentId;
			break;
		case 'ArrowRight': {
			const children = currentItem.children;
			if (children) {
				if (nav.expandedItemsKeys.has(currentItemId)) {
					nextFocusedId = children[0];
				} else {
					nav.expand(currentItemId);
					return;
				}
			}
			break;
		}
	}

	return nextFocusedId;
}

class Nav extends HTMLCustomElement {
	init() {
		this.dom = this;
		this._renderingPromise = null;
		this._lastAnimation = null;
		this.dataStore = {
			roots: null, // <Set>
			items: null // <Map>
		};
		this.focusedItemKey = null;
		this.selectedItemKey = null;
		this.expandedItemsKeys = new Set();
		this.filteredItems = null;
		this.expandOnButton = false;
		this.modifier = '';
		this.templates = navTemplates(this);

		this.dom.addEventListener('click', (event) => {
			let isExpandButton = false;
			const itemKey = this._getKeyByDomElement(event.target);
			if (this.expandOnButton) {
				const expandButton = this.dom.querySelector(
					'li[data-key="' + itemKey + '"] > div > .aras-nav__icon > span'
				);
				isExpandButton = event.target === expandButton;
			}

			if (!this.expandOnButton || isExpandButton) {
				this._toggleItemExpansion(itemKey);
			}

			if (event.target.closest('div > span:first-child') !== event.target) {
				this.select(itemKey);
			}
		});
		this.dom.addEventListener('keydown', (e) => this._keyboardHandler(e));
	}

	set data(itemsMap) {
		this.dataStore.items = itemsMap;
		this.expandedItemsKeys.clear();
		this.selectedItemKey = null;
		this.render();
	}

	get data() {
		return this.dataStore.items;
	}

	set roots(rootsSet) {
		this.dataStore.roots = rootsSet;
		this.render();
	}

	get roots() {
		return this.dataStore.roots;
	}

	get expanded() {
		return this.expandedItemsKeys;
	}

	get selected() {
		return this.selectedItemKey;
	}

	async _keyboardHandler(e) {
		if (e.target.nodeName === 'INPUT') {
			return;
		}
		const key = e.code;
		let indexToSelect;
		switch (key) {
			case 'ArrowUp':
			case 'ArrowLeft':
			case 'ArrowDown':
			case 'ArrowRight':
				indexToSelect = processArrowKey(this, key);
				break;
			case 'Enter':
			case 'NumpadEnter':
			case 'Space': {
				key === 'Space' && e.preventDefault();
				const item = this.dataStore.items.get(this.focusedItemKey);
				if (item && item.children) {
					const isExpanded = this.expandedItemsKeys.has(item.id);
					this[isExpanded ? 'collapse' : 'expand'](item.id);
				}
				return;
			}
			case 'Home':
				indexToSelect = Array.from(this.dataStore.roots)[0];
				break;
			case 'End': {
				indexToSelect = Array.from(this.dataStore.roots).slice(-1)[0];
				while (this.expandedItemsKeys.has(indexToSelect)) {
					const item = this.dataStore.items.get(indexToSelect);
					indexToSelect = item.children
						? item.children.slice(-1)[0]
						: indexToSelect;
				}
				break;
			}
			case 'NumpadMultiply': {
				if (!this.focusedItemKey) {
					return;
				}
				let itemsToExpand = [];
				if (this.dataStore.roots.has(this.focusedItemKey)) {
					itemsToExpand = this.dataStore.roots;
				} else {
					const element = this.querySelector(
						`[data-key="${this.focusedItemKey}"]`
					);
					const parent = element.parentElement.closest('li.aras-nav__parent');
					if (parent) {
						itemsToExpand = this.dataStore.items.get(parent.dataset.key)
							.children;
					}
				}
				itemsToExpand.forEach((itemId) => {
					this.expandedItemsKeys.add(itemId);
				});
				this.render();
				break;
			}
		}

		if (indexToSelect) {
			const nextElement =
				this.querySelector(
					`[data-key="${indexToSelect.replace('\\', '\\\\')}"] > div`
				) ||
				this.querySelector(
					`[data-key="${indexToSelect.replace('\\', '\\\\')}"]`
				);
			if (nextElement) {
				this.focusedItemKey = indexToSelect;
				await this.render();
				nextElement.focus();
			}
		}
	}

	connectedCallback(options) {
		this.render();
	}

	focus() {
		if (this.firstElementChild) {
			if (this.firstElementChild.setActive) {
				// IE11 workaround: focus method leads to implicit to scrollIntoView call
				// we don't need to change the scroll position, so setActive is used instead
				try {
					// 'Invalid function' exception can be thrown if target node is hidden
					this.firstElementChild.setActive();
				} catch {
					// continue regardless of error
				}
			} else {
				this.firstElementChild.focus();
			}
		}
	}

	select(targetItemKey) {
		this.selectedItemKey = this.focusedItemKey = this.dataStore.items.has(
			targetItemKey
		)
			? targetItemKey
			: null;
		return this.render();
	}

	render() {
		if (this._renderingPromise) {
			return this._renderingPromise;
		}

		const self = this;
		this._renderingPromise = new Promise(function (resolve, reject) {
			setTimeout(function () {
				self._renderingPromise = null;
				self._render();
				if (self._lastAnimation) {
					self._lastAnimation.fn.call(self, self._lastAnimation.target);
					self._lastAnimation = null;
				}
				resolve();
			}, 0);
		});
		return this._renderingPromise;
	}

	_render() {
		if (!this.dataStore.roots || !this.dataStore.items) {
			return;
		}
		const rootNode = this.templates.root();
		Inferno.render(rootNode, this.dom);
	}

	expand(targetItemKey, expandParents) {
		if (!this.dataStore.items.has(targetItemKey)) {
			return this.render();
		}
		const targetItem = this.dataStore.items.get(targetItemKey);
		if (targetItem.children) {
			this.expandedItemsKeys.add(targetItemKey);
		}
		if (expandParents) {
			this._expandParents(targetItemKey);
		}
		const domNode = this.dom.querySelector(
			"[data-key='" + targetItemKey.replace('\\', '\\\\') + "']"
		);
		if (domNode) {
			this._animate(this._animateNodeExpand, domNode);
		}
		return this.render();
	}

	collapse(targetItemKey) {
		this.expandedItemsKeys.delete(targetItemKey);
		const domNode = this.dom.querySelector(
			"[data-key='" + targetItemKey.replace('\\', '\\\\') + "']"
		);
		this._animate(this._animateNodeCollapse, domNode);
		return this.render();
	}

	on(eventType, callback) {
		const self = this;
		const handler = function (event) {
			const isArrow = event.target.closest('.aras-nav__icon') === event.target;
			const targetElementKey = self._getKeyByDomElement(event.target);
			if (!isArrow && targetElementKey !== null) {
				callback(targetElementKey, event);
			}
		};
		this.dom.addEventListener(eventType, handler);

		return function () {
			self.dom.removeEventListener(eventType, handler);
		};
	}

	_expandParents(targetItemKey) {
		const self = this;
		let previousFoundKey = targetItemKey;
		const compare = function (childKey) {
			return childKey === previousFoundKey;
		};
		let lastFoundKey = targetItemKey;
		const fn = function (value, key) {
			if (value.children && value.children.some(compare)) {
				lastFoundKey = key;
				self.expandedItemsKeys.add(key);
			}
		};
		do {
			previousFoundKey = lastFoundKey;
			self.dataStore.items.forEach(fn);
		} while (previousFoundKey !== lastFoundKey);
	}

	_animate(animationFn, target) {
		this._lastAnimation = {
			fn: animationFn,
			target: target
		};
	}

	_scroll(targetNode, targetHeight) {
		const navNode = this.dom;
		const navHeight = navNode.clientHeight;
		const isTargetNodeSmallerThanNav = navHeight >= targetNode.clientHeight;
		const bottomHeight = navHeight + navNode.scrollTop - targetNode.offsetTop;
		const diff = targetNode.clientHeight - bottomHeight;

		if (isTargetNodeSmallerThanNav) {
			if (diff > 0) {
				const options = { block: 'end', behavior: 'smooth' };
				targetNode.scrollIntoView(options);
			}
		} else {
			targetNode.scrollIntoView({ block: 'start', behavior: 'smooth' });
		}
	}

	_animateNodeExpand(targetNode) {
		const listElement = targetNode.lastChild;
		if (listElement && listElement.tagName === 'UL') {
			const targetHeight = listElement.clientHeight;
			listElement.style.height = 0;

			// hack - It is necessary to use offsetHeight to cancel optimization by the browser.
			// The browser may ignore the first assignment listElement.style.height
			isNaN(listElement.offsetHeight);

			const afterTransition = (event) => {
				this._scroll(targetNode, targetHeight);
				listElement.removeAttribute('style');
				listElement.removeEventListener('transitionend', afterTransition);
				event.stopPropagation();
			};
			listElement.addEventListener('transitionend', afterTransition);
			listElement.style.height = targetHeight + 'px';
		}
	}

	_animateNodeCollapse(targetNode) {
		const listElement = targetNode.lastChild;
		if (listElement && listElement.tagName === 'UL') {
			listElement.style.display = 'block';
			listElement.style.height = 'auto';
			const currentHeight = listElement.clientHeight;
			listElement.style.height = currentHeight + 'px';

			// hack - It is necessary to use offsetHeight to cancel optimization by the browser.
			// The browser may ignore the first assignment listElement.style.height
			isNaN(listElement.offsetHeight);

			const afterTransition = function (event) {
				listElement.removeAttribute('style');
				listElement.removeEventListener('transitionend', afterTransition);
			};
			listElement.addEventListener('transitionend', afterTransition);
			listElement.style.height = 0;
		}
	}

	_toggleItemExpansion(targetItemKey) {
		if (this.expandedItemsKeys.has(targetItemKey)) {
			this.collapse(targetItemKey);
		} else {
			this.expand(targetItemKey);
		}
	}

	_getKeyByDomElement(element) {
		if (element.tagName === 'UL') {
			return null;
		}
		const targetElement = element.closest('li');
		if (targetElement && targetElement.dataset) {
			return targetElement.dataset.key;
		}
		return null;
	}

	formatter() {
		return null;
	}
}

export default Nav;
