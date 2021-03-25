// @flow
import { defaultTemplates, toolbarFormatters } from './toolbarTemplates';
import trimSeparators from './trimSeparators';

export type ToolbarItemT = {
	type: string,
	disabled?: boolean,
	hidden?: boolean,
	label?: string,
	tooltip_template?: string
};

type CheckedItemT = ToolbarItemT & {
	checked: boolean,
	group_id?: string
};

type FormatterDataT = {
	focused: boolean,
	formatter: Function,
	isToolbarRole: boolean,
	item: ToolbarItemT,
	itemRefCallback: Function,
	toolbar: HTMLElement
};

type FormatterT = {
	[key: string]: (data: FormatterDataT) => React.Node
};

export default class Toolbar extends HyperHTMLElement {
	_leftContainerItems = [];
	_rightContainerItems = [];
	_renderingPromise: ?Promise<void> = null;
	_resizeObserver = new ResizeObserver(() => this.render());
	datastore: Map<string, Object> = new Map();
	templates = defaultTemplates;
	focusedItemId = null;
	/* :: expanded: boolean */
	/* :: overflow: boolean */
	/* :: role: string */
	static get booleanAttributes() {
		return ['overflow', 'expanded'];
	}
	static get observedAttributes() {
		return ['role'];
	}

	_getItemTabindex(itemId: string) {
		if (this._isToolbarRole()) {
			return itemId === this.focusedItemId ? '0' : '-1';
		}

		return this._isItemFocusable(itemId) ? '0' : '-1';
	}

	_getDisabledAttributeName() {
		return this._isToolbarRole() ? 'aria-disabled' : 'disabled';
	}

	_focusoutHandler = (event: FocusEvent) => {
		const relatedTarget = event.relatedTarget;
		if (
			this.expanded &&
			!(relatedTarget instanceof Node && this.contains(relatedTarget))
		) {
			this.expanded = false;
		}
	};

	_resizeHandler = () => {
		this.render();
	};

	static extendFormatters(formatter: FormatterT) {
		Object.assign(toolbarFormatters, formatter);
	}

	connectedCallback() {
		if (!this.role) {
			this.role = 'toolbar';
		}
		if (!this.overflow && this._isToolbarRole()) {
			this.overflow = true;
		}

		this._initKeyboardHandler();
		this._initOverflowHandlers();
		this.on('click', (parentItemId, event) =>
			this._checkedItemClickHandler(parentItemId, event)
		);
		window.addEventListener('resize', this._resizeHandler);
	}

	disconnectedCallback() {
		this._resizeObserver.unobserve(this);
		window.removeEventListener('resize', this._resizeHandler);
	}

	attributeChangedCallback(attrName: string) {
		if (attrName === 'role') {
			this._initKeyboardHandler();
		} else if (attrName === 'overflow') {
			this._initOverflowHandlers();
		}

		this.render();
	}

	_initKeyboardHandler() {
		if (this._isToolbarRole()) {
			this.addEventListener('keydown', this._keyboardEventHandler);
		} else {
			this.removeEventListener('keydown', this._keyboardEventHandler);
		}
	}

	_initOverflowHandlers() {
		if (this.overflow) {
			this._resizeObserver.observe(this);
			this.addEventListener('focusout', this._focusoutHandler);
		} else {
			this._resizeObserver.unobserve(this);
			this.removeEventListener('focusout', this._focusoutHandler);
		}
	}

	async _keyboardEventHandler(e: KeyboardEvent) {
		if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
			return;
		}
		const key: string = e.code;
		if (!['ArrowLeft', 'ArrowRight'].includes(key)) {
			return;
		}
		if (
			e.target instanceof Element &&
			this._getFocusNode() !== e.target &&
			!e.target.closest('.aras-toolbar__expand-button')
		) {
			return;
		}

		let nextItemId;
		switch (key) {
			case 'ArrowLeft':
				nextItemId = this._getPrevFocusable();
				break;
			case 'ArrowRight':
				nextItemId = this._getNextFocusable();
				break;
		}

		if (nextItemId) {
			e.preventDefault();
			await this._focusItem(nextItemId);

			// preventDefault isn't working for 'select' in FF: https://bugzilla.mozilla.org/show_bug.cgi?id=1019630
			const targetNode = e.target;

			if (!(targetNode instanceof HTMLElement)) {
				return;
			}
			if (
				targetNode.nodeName === 'SELECT' &&
				/Firefox\/(\S+)/.test(window.navigator.userAgent)
			) {
				const originalDisplay = targetNode.style.display;
				targetNode.style.display = 'none';
				targetNode.clientHeight; // execute re-rendering of HTML engine
				targetNode.style.display = originalDisplay;
				// don't call anything below what will re-render HTML
			}
		}
	}

	_getFocusableItems(): string[] {
		return [
			...this._leftContainerItems,
			...this._rightContainerItems
		].filter((itemId) => this._isItemFocusable(itemId));
	}

	_getNextFocusable(): ?string {
		const itemsId = this._getFocusableItems();
		if (!itemsId.length) {
			return null;
		}

		return itemsId[itemsId.indexOf(this.focusedItemId) + 1] || itemsId[0];
	}

	_getPrevFocusable(): ?string {
		const itemsId = this._getFocusableItems();
		if (!itemsId.length) {
			return null;
		}

		return (
			itemsId[itemsId.indexOf(this.focusedItemId) - 1] ||
			itemsId[itemsId.length - 1]
		);
	}

	async _focusItem(itemId: ?string) {
		this.focusedItemId = itemId;
		await this.render();
		const focusNode = this._getFocusNode();
		if (!focusNode) {
			return;
		}

		if (focusNode.closest('.aras-toolbar__item_hidden')) {
			this.expanded = true;
			await this.render();
		}

		focusNode.focus();
	}

	_getFocusNode() {
		if (!this.focusedItemId) {
			return null;
		}
		const dataIdSelector = `[data-id="${this.focusedItemId}"]`;
		return this.querySelector(
			`${dataIdSelector}[tabindex="0"], ${dataIdSelector} [tabindex="0"]`
		);
	}

	_isItemFocusable(itemId: string) {
		const item = this.datastore.get(itemId);

		return (
			item &&
			!item.hidden &&
			!(item.attributes && item.attributes['aria-hidden']) &&
			item.type !== 'separator' &&
			(!item.disabled || ['button', 'dropdownMenu'].includes(item.type))
		);
	}

	async _checkedItemClickHandler(parentItemId: string, event: Event) {
		const node = event.target;
		if (!(node instanceof Element)) {
			return;
		}

		const targetNode = ((node.closest('li[data-index]'): any): ?HTMLElement);
		const parentItem = this.data.get(parentItemId);

		if (!targetNode || !parentItem) {
			return;
		}

		const dataMap = parentItem.data;
		const targetNodeIndex: string = targetNode.dataset.index;
		const targetItem: CheckedItemT = dataMap.get(targetNodeIndex);

		if (
			!targetItem.disabled &&
			(targetItem.checked !== undefined || targetItem.type === 'checkbox')
		) {
			const groupId = targetItem.group_id;
			if (groupId) {
				dataMap.forEach((item) => {
					if (item.group_id !== groupId) {
						return;
					}

					item.checked = false;
					dataMap.set(item.id, Object.assign({}, item));
				});
				targetItem.checked = true;
			} else {
				targetItem.checked = !targetItem.checked;
			}

			dataMap.set(targetNodeIndex, Object.assign({}, targetItem));
			this.data.set(parentItemId, Object.assign({}, parentItem));
			return this.render();
		}
	}

	_render(renderingOptions: ?Object) {
		if (
			this._isToolbarRole() &&
			(!this.focusedItemId || !this._isItemFocusable(this.focusedItemId))
		) {
			this.focusedItemId = this._getNextFocusable();
		}

		const options = this._getVnodeProperties(renderingOptions);
		const root = this.templates.root(options);
		Inferno.render(root, this);
	}

	render() {
		if (this._renderingPromise) {
			return this._renderingPromise;
		}
		this._renderingPromise = Promise.resolve().then(() => {
			const prerenderArguments = this.overflow
				? {
						isOverflowVisible: true,
						rightContainerOrder: -1
				  }
				: null;
			this._render(prerenderArguments);

			if (this.overflow) {
				let rightContainerOrder = this._getLastItemOnFirstRowIndex();
				if (this._hasItemsInOverflow()) {
					this._render({
						rightContainerOrder: -1,
						isOverflowVisible: true,
						isExpandButtonHidden: true
					});

					if (!this._hasItemsInOverflow()) {
						rightContainerOrder = this._getLastItemOnFirstRowIndex();
					}
				}

				this._render({ rightContainerOrder });

				if (
					!this.expanded &&
					this.firstElementChild &&
					this.offsetParent !== null
				) {
					this.style.height = this.firstElementChild.clientHeight + 'px';
				}
			}

			this._renderingPromise = null;

			if (this.expanded && !this.contains(document.activeElement)) {
				this.expanded = false;
			}
		});
		return this._renderingPromise;
	}

	set data(dataMap: Map<string, Object>) {
		const self = this;
		this.datastore = dataMap;
		this._rightContainerItems = [];
		this._leftContainerItems = [];
		this.datastore.forEach(function (value, key) {
			if (value.right) {
				self._rightContainerItems.push(key);
			} else {
				self._leftContainerItems.push(key);
			}
		});
		this.render();
	}

	get data() {
		return this.datastore;
	}

	set container(newContainerItems: string[]) {
		this._leftContainerItems = newContainerItems;
		this.render();
	}

	get container(): string[] {
		return this._leftContainerItems;
	}

	set rightContainer(newContainerItems: string[]) {
		this._rightContainerItems = newContainerItems;
		this.render();
	}

	get rightContainer(): string[] {
		return this._rightContainerItems;
	}

	on(
		eventType: string,
		callback: (itemId: string, event: Event) => void | Promise<void>
	) {
		const handler = (event: Event) => {
			const targetItemId = this._getIdByDomElement(event.target);
			const item = this.data.get(targetItemId);
			if (item && !item.disabled) {
				callback(targetItemId, event);
			}
		};
		this.addEventListener(eventType, handler);
		return () => {
			this.removeEventListener(eventType, handler);
		};
	}

	_getIdByDomElement(element: EventTarget): string {
		if (!(element instanceof Element)) {
			return '';
		}
		const targetNodeSelector = '[data-id]';
		const targetNode = ((element.closest(
			targetNodeSelector
		): any): ?HTMLElement);
		return targetNode ? targetNode.dataset.id : '';
	}

	_getVnodeProperties(renderingOptions: ?Object) {
		const leftContainerItems = trimSeparators(
			this.data,
			this._leftContainerItems
		);
		const rightContainerItems = trimSeparators(
			this.data,
			this._rightContainerItems
		);
		return {
			leftContainerItems,
			rightContainerItems,
			toolbar: this,
			options: {
				isToolbarRole: this._isToolbarRole(),
				isOverflowAllowed: this.overflow,
				isOverflowVisible: this.expanded,
				...renderingOptions
			}
		};
	}

	_isToolbarRole() {
		return this.role === 'toolbar';
	}

	_getLastItemOnFirstRowIndex() {
		const maximalFirstRowItemOffsetTop = 20;
		const lastItemOnFirstRowIndex = Array.prototype.findIndex.call(
			this.firstElementChild && this.firstElementChild.childNodes,
			(itemNode) => itemNode.offsetTop > maximalFirstRowItemOffsetTop
		);

		return lastItemOnFirstRowIndex === -1
			? this._leftContainerItems.length
			: lastItemOnFirstRowIndex - 1;
	}

	_hasItemsInOverflow() {
		return this.firstElementChild
			? this.clientHeight < this.firstElementChild.clientHeight
			: false;
	}

	_toggleToolbarExpandState = () => {
		this.expanded = !this.expanded;

		if (this.expanded) {
			this._focusItem(this.focusedItemId);
		}
	};
}
