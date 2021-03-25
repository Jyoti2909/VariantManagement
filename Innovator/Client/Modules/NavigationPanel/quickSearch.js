import ItemProperty from '../components/itemProperty';
import SvgManager from '../core/SvgManager';
import getResource from '../core/resources';

const icons = {
	quickSearch: '../images/QuickSearch.svg'
};

SvgManager.enqueue(Object.values(icons));

class QuickSearch extends ItemProperty {
	#pressEnterTimeout = null;
	#selectedItemIndex = -1;

	initialize() {
		super.initialize();
		this.quickSearchLocalizationLabel = getResource(
			'navigation_panel.secondary_menu.quick_search_placeholder'
		);
	}
	focus() {
		this.state.refs.input?.focus();
	}

	clear() {
		this.setState({
			value: '',
			list: []
		});
	}

	connectedCallback() {
		super.connectedCallback();
		this.classList.add('aras-quick-search');
	}

	_onInputFocusoutHandler(e) {
		const value = this.state.value;
		const predictedValue = this.state.predictedValue;

		this.setState({
			oldLabel: this.state.label,
			value: predictedValue || value
		});

		super._onInputFocusoutHandler(e);
	}

	getSelectedItem() {
		if (!this.state.label) {
			return;
		}
		const list = this.state.list;
		const label = this.state.label.toUpperCase();

		return (
			list[this.#selectedItemIndex] ??
			list.find((item) => item.label.toUpperCase() === label)
		);
	}

	_onItemClickHandler(e) {
		const li = e.target.closest('li');
		this.#selectedItemIndex = [].indexOf.call(li.parentElement.children, li);

		super._onItemClickHandler(e);
	}

	_onKeyDownHandler(e) {
		if (e.key === 'Enter') {
			if (this.#pressEnterTimeout) {
				return;
			}

			this.#selectedItemIndex = this.state.focusedIndex;
			if (this.state.requestTimeoutID) {
				this.#pressEnterTimeout = setTimeout(async () => {
					await this.state.requestPromise;

					this.#pressEnterTimeout = null;
					if (!this.state.list.length) {
						return;
					}
					super._onKeyDownHandler(e);
				}, this.state.typingDelay);
			} else {
				this.state.refs.input.dispatchEvent(
					new CustomEvent('change', { bubbles: true })
				);
			}

			e.preventDefault();
			return;
		}

		super._onKeyDownHandler(e);
	}

	_getButtonTemplate() {
		return null;
	}

	_getInputTemplate() {
		const input = super._getInputTemplate();
		input.className = 'aras-input aras-quick-search__input';
		input.attrs.placeholder = getResource(
			'navigation_panel.secondary_menu.quick_search_placeholder'
		);

		input.attrs.placeholder = this.quickSearchLocalizationLabel;
		input.attrs['aria-label'] = this.quickSearchLocalizationLabel;
		return input;
	}

	_getIconContainerTemplate() {
		const icons = super._getIconContainerTemplate();

		icons.children = icons.children.map((icon) => {
			if (icon.className.includes('aras-spinner')) {
				icon.className += ' aras-quick-search__spinner';
			}
			return icon;
		});

		return icons;
	}

	getTemplate() {
		const template = super.getTemplate();
		const icon = SvgManager.createInfernoVNode(icons.quickSearch, {
			class: 'aras-input-icon',
			alt: this.quickSearchLocalizationLabel
		});

		template.className += ' aras-input-icon-wrapper';
		if (this.state.disabled) {
			template.className += ' aras-icon_grayscale';
		}
		template.children.push(icon);
		return template;
	}
}

const name = 'aras-quick-search';
if (!customElements.get(name)) {
	customElements.define(name, QuickSearch);
}

export default QuickSearch;
