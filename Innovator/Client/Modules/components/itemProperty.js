import xml from '../core/Xml';
import FilterList from './filterList';
import BaseTypeahead from './baseTypeahead';
import { sessionSoap } from '../core/SessionSoap';

class ItemProperty extends FilterList {
	initialize() {
		BaseTypeahead.prototype.initialize.call(this);
		this.state.maxItemsCount = 5;
		this.state.typingDelay = 500;
		Object.defineProperty(this.state, 'value', {
			get: function () {
				return this.predictedValue !== null ? this.predictedValue : this.label;
			},
			set: function (val) {
				this.label = val;
				this.oldLabel = val;
			}
		});
	}

	showDialogHandler() {}

	_onKeyDownHandler(e) {
		super._onKeyDownHandler(e);

		if (e.key === 'F2') {
			this.showDialogHandler();
		}
	}

	_getCurrentInputValue() {
		return this.state.label || '';
	}

	_getButtonTemplate() {
		return {
			tag: 'button',
			attrs: {
				disabled: this.state.disabled,
				tabIndex: -1,
				'aria-hidden': true
			},
			events: {
				onclick: this.showDialogHandler
			},
			className:
				'aras-filter-list__button aras-btn aras-filter-list__button_ellipsis',
			ref: function (node) {
				this.state.refs.button = node;
			}.bind(this)
		};
	}

	_getAutocompleteLabel() {
		const list = this.state.list;
		const predictedValue = this.state.predictedValue;

		if (!list) {
			return;
		}

		const item = list.find(function (item) {
			return item.label === predictedValue;
		});

		return item ? item.label || item.value : '';
	}

	_getInputTemplate() {
		const input = FilterList.prototype._getInputTemplate.call(this);
		input.events = Object.assign(input.events, {
			onchange: function (e) {
				if (!(e instanceof CustomEvent)) {
					e.stopPropagation();
					return;
				}

				const value = this.state.value;
				const predictedValue = this.state.predictedValue;

				this.setState({
					value: predictedValue || value
				});

				if (this.state.validation) {
					this.setState({
						invalid: !this.validate()
					});
				}
			}.bind(this)
		});

		return input;
	}

	_getIconContainerTemplate() {
		const icons = BaseTypeahead.prototype._getIconContainerTemplate.call(this);
		icons.children.push({
			tag: 'span',
			className: 'aras-filter-list-icon aras-spinner',
			attrs: {
				style: {
					display: this.state.abortRequest ? 'block' : 'none'
				}
			}
		});

		return icons;
	}

	_onInputHandler(e) {
		if (this.state.requestTimeoutID) {
			clearTimeout(this.state.requestTimeoutID);
		}

		if (this.state.abortRequest) {
			this.state.abortRequest();
			this.state.abortRequest = null;
		}

		if (!e.target.value) {
			Object.assign(this.state, {
				abortRequest: null,
				requestTimeoutID: null,
				list: []
			});
		} else {
			this.state.requestTimeoutID = setTimeout(() => {
				const inputPromise = new Promise((resolve) => {
					this.setState({
						abortRequest: resolve
					});
				});
				const requestPromise = this.request();

				inputPromise.then(() => {
					requestPromise.abort();
				});

				this.state.requestPromise = Promise.race([inputPromise, requestPromise])
					.then((data) => {
						this.setState({
							abortRequest: null,
							requestTimeoutID: null
						});

						if (!data) {
							return;
						}

						const items = xml.selectNodes(data, 'Item');
						this.setState({
							list: items.map(function (item) {
								const keyNode = xml.selectSingleNode(item, 'keyed_name');
								const keyNodeId = xml.getText(xml.selectSingleNode(item, 'id'));
								const keyNodeValue = xml.getText(keyNode);
								return {
									label: keyNodeValue,
									value: keyNodeValue,
									itemId: keyNodeId
								};
							})
						});
					})
					.catch((err) => {
						this.setState({
							abortRequest: null,
							requestTimeoutID: null
						});

						if (!(err instanceof XMLHttpRequest) || err.status !== 200) {
							return Promise.reject(err);
						} else {
							this.setState({
								list: []
							});
							if (this.state.validation) {
								this.setState({
									invalid: true
								});
							}
						}
					});
			}, this.state.typingDelay);
		}

		FilterList.prototype._onInputHandler.call(this, e);
	}

	_checkShown() {
		return (
			FilterList.prototype._checkShown.call(this) &&
			!this.state.requestTimeoutID
		);
	}

	inputValidate() {
		return true;
	}

	validate() {
		const item = aras.uiGetItemByKeyedName(
			this.state.itemType,
			this.state.value,
			true
		);
		return !!item || this.state.value === '';
	}

	request() {
		const itemType = this.state.itemType;
		const maxCount = this.state.maxItemsCount;
		const label = this.state.label;

		const req =
			'<Item type="' +
			itemType +
			'" select="keyed_name" maxRecords="' +
			maxCount +
			'" action="get">' +
			'<keyed_name condition="like">' +
			label +
			'*</keyed_name>' +
			'</Item>';

		return sessionSoap(req, { async: true });
	}

	attributeChangedCallback(attr, oldValue, newValue) {
		if (attr === 'itemtype') {
			attr = 'itemType';
		}

		super.attributeChangedCallback(attr, oldValue, newValue);
	}
}

ItemProperty.observedAttributes = FilterList.observedAttributes.concat([
	'itemtype'
]);

export default ItemProperty;
