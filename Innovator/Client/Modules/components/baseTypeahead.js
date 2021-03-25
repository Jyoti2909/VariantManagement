import utils from '../core/utils';
import HTMLCustomElement from './htmlCustomElement';
import getTooltipPosition from './tooltipUtils';

class BaseTypeahead extends HTMLCustomElement {
	init() {
		this.initialize();
	}

	initialize() {
		this.state = Object.assign({
			list: [],
			label: null,
			_value: null,
			shown: false,
			focus: false,
			validation: false,
			invalid: false,
			oldLabel: null,
			refs: {},
			dom: this
		});
	}

	get value() {
		return this.getAttribute('value');
	}

	set value(newValue) {
		this.setAttribute('value', newValue);
	}

	get disabled() {
		return this.hasAttribute('disabled');
	}

	set disabled(value) {
		value
			? this.setAttribute('disabled', '')
			: this.removeAttribute('disabled');
	}

	setState(next) {
		this.state = Object.assign(this.state || {}, next);
		this.render();
	}

	_onInputHandler(e) {
		const newLabel = e.target.value;
		const prevLabel =
			this.state.label === null
				? this._getCurrentInputValue()
				: this.state.label;
		const oldLabel = this.state.oldLabel;

		this.setState({
			oldLabel: oldLabel === null ? prevLabel : oldLabel,
			label: newLabel,
			focus: true,
			shown: newLabel !== ''
		});

		this.dispatchEvent(new CustomEvent('input', { bubbles: true }));
	}

	_onInputFocusoutHandler(e) {
		if (e.relatedTarget === this.state.refs.dropdown) {
			e.preventDefault();
			e.stopPropagation();
			this.setFocus();
			return;
		}

		const label = this.state.label;
		const oldLabel = this.state.oldLabel;

		if (label !== oldLabel) {
			this.state.refs.input.dispatchEvent(
				new CustomEvent('change', { bubbles: true })
			);
		}

		this.setState({
			shown: false,
			focus: false,
			oldLabel: null,
			focusedIndex: -1
		});
	}

	_onButtonClickHandler(e) {
		this.setState({
			shown: !this.state.shown,
			focus: true
		});
		e.preventDefault();
	}

	_setPosition() {
		const parentNode = this._findParent();
		const parentNodeOffsets = parentNode.getBoundingClientRect();
		const inputHeight = this.state.refs.input.clientHeight + 1;
		const containerOffsets = this.state.dom.getBoundingClientRect();
		const topOffset = containerOffsets.top - parentNodeOffsets.top;
		const bottomOffset = parentNode.clientHeight - topOffset - inputHeight;
		const greatestOffset = Math.max(bottomOffset, topOffset);
		const calculatedDropdownHeight = this._getDropdownHeight() + 2; // 2px is a border heights above and below list
		const dropdownHeight = Math.min(calculatedDropdownHeight, greatestOffset);
		const down = bottomOffset >= dropdownHeight || bottomOffset >= topOffset;

		this.state.maxDropdownHeight = dropdownHeight;
		return `${down ? inputHeight : -dropdownHeight}px`;
	}

	_getDropdownHeight() {
		return 0;
	}

	_checkShown() {
		return this.state.shown;
	}

	_getInputTemplate() {
		const label = this._getCurrentInputValue();

		return {
			tag: 'input',
			className: 'aras-filter-list__input aras-form-input',
			attrs: {
				'aria-autocomplete': 'both',
				value: label,
				autocomplete: 'off',
				disabled: this.state.disabled,
				readOnly: this.state.readonly
			},
			events: {
				oninput: this._onInputHandler.bind(this)
			},
			ref: function (node) {
				this.state.refs.input = node;
			}.bind(this)
		};
	}

	_getCurrentInputValue() {
		return this.state.label || '';
	}

	_getButtonTemplate() {
		return {
			tag: 'button',
			attrs: {
				disabled: this.state.disabled || this.state.readonly,
				tabIndex: -1,
				'aria-hidden': true
			},
			className:
				'aras-filter-list__button aras-btn aras-icon-arrow aras-icon-arrow_down',
			events: {
				onmousedown: this._onButtonClickHandler.bind(this)
			},
			ref: function (node) {
				this.state.refs.button = node;
			}.bind(this)
		};
	}

	_getIconContainerTemplate() {
		return {
			tag: 'div',
			className: 'aras-filter-list__icon-container',
			children: [
				{
					tag: 'span',
					className: 'aras-filter-list-icon aras-icon-error',
					attrs: {
						style: {
							display: this.state.invalid ? 'flex' : 'none'
						}
					}
				}
			]
		};
	}

	_findParent() {
		let node = this.state.dom;
		let styles;

		do {
			node = node.parentNode;
			styles = window.getComputedStyle(node);
		} while (
			node !== document.body &&
			styles['overflow-y'] !== 'hidden' &&
			node.parentNode
		);

		return node;
	}

	_getDropdownTemplate() {
		const shown = this._checkShown();

		const displayCssClass = shown ? ' aras-dropdown_opened' : '';

		return {
			tag: 'div',
			className: 'aras-filter-list__dropdown aras-dropdown' + displayCssClass,
			attrs: {
				tabIndex: 1
			},
			children: [],
			style: {
				display: this.state.width === 'auto' || shown ? 'block' : 'none',
				top: shown ? this._setPosition() : 0,
				'max-height': this.state.maxDropdownHeight + 'px'
			},
			ref: function (node) {
				this.state.refs.dropdown = node;
			}.bind(this)
		};
	}

	_calculateWidth() {
		if (this.state.width !== 'auto') {
			return;
		}

		const buttonWidth = this.state.refs.button.offsetWidth;
		const dropdownWidth = this.state.refs.dropdown.offsetWidth;
		const width = (dropdownWidth || 0) + buttonWidth + 'px';

		if (this.state.width !== width) {
			this.state.width = width;
			this._render();
		}
	}

	getTemplate() {
		if (!this.state) {
			this.initialize();
		}

		const button = this._getButtonTemplate();
		const icons = this._getIconContainerTemplate();
		const dropdown = this._getDropdownTemplate();
		const input = this._getInputTemplate();

		const existingChildren = [input, icons, button, dropdown].filter(
			(element) => element
		);

		const wrapper = {
			tag: 'div',
			className: 'aras-filter-list aras-dropdown-container',
			children: existingChildren,
			style: {
				width: this.state.width
			}
		};

		const validation = this.state.validation;

		if (validation) {
			const tooltipMessage = aras.getResource('', 'components.value_invalid');
			if (this.state.invalid) {
				this.state.errorPosition = getTooltipPosition(
					this.state.dom,
					this._findParent(),
					tooltipMessage
				);
			}

			wrapper.className += ' aras-tooltip';
			wrapper.attrs = {
				'data-tooltip-show': this.state.invalid,
				'data-tooltip': tooltipMessage,
				'data-tooltip-pos': this.state.errorPosition
			};
		}

		return (this.format && this.format(wrapper)) || wrapper;
	}

	componentFunction(props) {
		const self = props.self;
		return utils.templateToVNode(self.getTemplate(self));
	}

	component() {
		const self = this;
		const componentFunctionFlag = utils.infernoFlags.componentFunction;
		const bindedHandler = self._onInputFocusoutHandler.bind(self);

		return Inferno.createComponentVNode(
			componentFunctionFlag,
			this.componentFunction,
			{ self: self },
			null,
			{
				onComponentDidMount: function () {
					self.state.refs.input.addEventListener('focusout', bindedHandler);
				},
				onComponentWillUnmount: function () {
					self.state.refs.input.removeEventListener('focusout', bindedHandler);
				}
			}
		);
	}

	setFocus() {
		return new Promise(
			function (resolve) {
				if (!this.state.focus) {
					resolve();
					return;
				}

				setTimeout(
					function () {
						const input = this.state.refs.input;
						if (document.activeElement === input || !this.state.focus) {
							resolve();
							return;
						}
						input.focus();

						// The code set cursor to end of input
						// Because value for input is set to attribute
						// If value for input is set from attribute then when focus() is called  that cursor will set to start of input
						const length = input.value.length;
						input.setSelectionRange(length, length);

						resolve();
					}.bind(this),
					0
				);
			}.bind(this)
		);
	}

	_render() {
		Inferno.render(this.component(), this.state.dom);
		this._calculateWidth();
		this.setAttribute('aria-expanded', this._checkShown());

		return Promise.resolve();
	}

	render() {
		return this._render().then(this.setFocus.bind(this));
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(attr, oldValue, newValue) {
		const attrName = attr === 'value' ? '_value' : attr;
		if (attr === 'disabled') {
			newValue = this.disabled;
		}
		if (this.state[attr] === newValue && this.state[attrName] === newValue) {
			return;
		}
		const changes = {};
		changes[attr] = newValue;
		this.setState(changes);
	}
}

BaseTypeahead.observedAttributes = ['value', 'label', 'disabled'];

export default BaseTypeahead;
