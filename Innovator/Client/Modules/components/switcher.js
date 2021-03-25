const SWITCHER_CLASS = 'aras-switcher';
const SWITCHER_PANE_CLASS = SWITCHER_CLASS + '-pane';
const ACTIVE_PANE_CLASS = SWITCHER_PANE_CLASS + '_active';
const SWITCHER_PANE_ID_ATTRIBUTE = 'switcher-pane-id';

export default class Switcher extends HyperHTMLElement {
	_mutationObserver = null;
	_renderingPromise = null;

	static get observedAttributes() {
		return ['active-pane-id'];
	}

	created() {
		this.classList.add(SWITCHER_CLASS);

		this._mutationObserver = new MutationObserver(() => {
			this.render();
		});
	}

	connectedCallback() {
		if (!this.activePaneId && this.firstElementChild) {
			this.activePaneId = this.firstElementChild.getAttribute(
				SWITCHER_PANE_ID_ATTRIBUTE
			);
		}

		this._mutationObserver.observe(this, {
			childList: true
		});

		this.render();
	}

	disconnectedCallback() {
		if (this._mutationObserver) {
			this._mutationObserver.disconnect();
		}
	}

	attributeChangedCallback() {
		this.render();
	}

	async render() {
		if (this._renderingPromise) {
			return this._renderingPromise;
		}

		this._renderingPromise = Promise.resolve();
		await this._renderingPromise;
		const children = Array.from(this.children);
		children.forEach((paneElement) => {
			const paneId = paneElement.getAttribute(SWITCHER_PANE_ID_ATTRIBUTE);
			const isActivePane = paneId === this.activePaneId;

			paneElement.classList.add(SWITCHER_PANE_CLASS);
			paneElement.classList.toggle(ACTIVE_PANE_CLASS, isActivePane);

			if (isActivePane) {
				paneElement.removeAttribute('aria-hidden');
			} else {
				paneElement.setAttribute('aria-hidden', 'true');
			}
		});
		this._renderingPromise = null;
	}
}
