const showItemInFrame = (frame) => {
	if (!frame) {
		return;
	}

	const formMode = window.isNew ? 'add' : window.isEditMode ? 'edit' : 'view';
	aras.uiShowItemInFrameEx(frame.contentWindow, window.item, formMode, 0);
};
export default class Form extends HyperHTMLElement {
	connectedCallback() {
		this.style.height = window.formHeight + 'px';
		this.html`
			<iframe
				id="instance" frameborder="0" width="100%" height="100%"
				onconnected="${() => this.render()}"
				onload="${(e) =>
					window.returnBlockerHelper.attachBlocker(e.target.contentWindow)}"
			></iframe>
		`;
	}

	async render() {
		if (this.renderPromise) {
			return this.renderPromise;
		}

		this.renderPromise = Promise.resolve();
		await this.renderPromise;
		showItemInFrame(this.firstElementChild);
		this.renderPromise = null;
	}
}
