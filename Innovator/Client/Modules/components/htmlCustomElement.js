// @flow
class HTMLCustomElement extends HTMLElement {
	constructor(self: HTMLCustomElement) {
		// $FlowFixMe
		const selfIns: HTMLCustomElement = super(self);
		selfIns.init();
		return selfIns;
	}

	init(): void {}
}

export default HTMLCustomElement;
