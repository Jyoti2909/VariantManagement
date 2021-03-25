// @flow
const sidebarCssClass = 'aras-sidebar';
const rightSidebarCssClass = sidebarCssClass + '_right';
const hiddenCssClass = sidebarCssClass + '_hidden';
const pinnedCssClass = sidebarCssClass + '_pinned';

export default class Sidebar extends HyperHTMLElement {
	toggleVisibility(visible: ?boolean) {
		const isVisible = this.isVisible;
		const args = [hiddenCssClass];
		if (visible !== undefined) {
			args.push(!visible);
		}
		this.classList.toggle(...args);
		if (isVisible && !visible) {
			this.dispatchEvent(new CustomEvent('sidebarClose', { bubbles: true }));
		} else if (!isVisible && (visible || visible === undefined)) {
			if (!this.isPinned) {
				const onTransitionEnd = (event: TransitionEvent) => {
					const target: ?Element = (event.target: any);
					if (target === this) {
						this.focus();
					}
				};
				this.addEventListener('transitionend', onTransitionEnd, { once: true });
			}
			this.dispatchEvent(new CustomEvent('sidebarShow', { bubbles: true }));
		}
	}

	get isPinned() {
		return this.classList.contains(pinnedCssClass);
	}

	get isVisible() {
		return !this.classList.contains(hiddenCssClass);
	}

	togglePin(pinned: boolean) {
		const args = [pinnedCssClass];
		if (pinned !== undefined) {
			args.push(pinned);
		}
		this.classList.toggle(...args);
		if (this.isPinned) {
			this.removeEventListener('focusout', this._focusOutHandler);
		} else {
			this.addEventListener('focusout', this._focusOutHandler);
		}

		this.dispatchEvent(
			new CustomEvent('sidebarPin', {
				bubbles: true,
				detail: {
					state: this.isPinned
				}
			})
		);
	}

	connectedCallback() {
		this.classList.add(sidebarCssClass, hiddenCssClass);
		if (this.hasAttribute('right')) {
			this.classList.add(rightSidebarCssClass);
		}
		this.setAttribute('tabindex', '0');
		this.addEventListener('focusout', this._focusOutHandler);
	}

	closeIfNotAcitive(element: ?Element) {
		if (!this._isElementInSidebar(element)) {
			this.toggleVisibility(false);
		}
	}

	_focusOutHandler(event: FocusEvent) {
		const element: ?Element = (event.relatedTarget: any);
		this.closeIfNotAcitive(element);
	}

	_isElementInSidebar(element: ?Element) {
		return element && this.contains(element);
	}
}
