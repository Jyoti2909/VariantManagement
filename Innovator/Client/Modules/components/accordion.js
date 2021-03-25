import accordionCSS from '../../styles/less/components/accordion.less';
import tooltipCSS from '../../styles/less/core/tooltip.less';
import getResource from '../core/resources';

const { wire } = HyperHTMLElement;
const accordionStylesheet = new CSSStyleSheet();
const tooltipStylesheet = new CSSStyleSheet();
tooltipStylesheet.replaceSync(tooltipCSS);
accordionStylesheet.replaceSync(accordionCSS);

export default class Accordion extends HyperHTMLElement {
	static get booleanAttributes() {
		return ['collapsed'];
	}

	static get observedAttributes() {
		return ['maximized'];
	}

	_keyboardHandler(e) {
		const key = e.code;
		if (key === 'Enter' || key === 'Space') {
			// Prevent scrolling, when 'Space' key is pressed, as it's a native browser's behavior
			e.preventDefault();
			this.toggle();
		}
	}

	created() {
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [
			tooltipStylesheet,
			accordionStylesheet
		];
		this.classList.add('aras-accordion');
		this.setAttribute('role', 'presentation');
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback() {
		this.render();
	}

	collapse() {
		return this.toggle(true);
	}

	expand() {
		return this.toggle(false);
	}

	render() {
		this.classList.toggle('aras-accordion_collapsed', this.collapsed);
		const maximized = this.maximized === 'true';
		const toggleButton = this._getToggleButton(maximized);
		const maximizeButton = this._getMaximizeButton(maximized);

		this.html`
			<div class="aras-accordion__header">
				${toggleButton}
				<slot name="header" ></slot>
				${maximizeButton}
			</div>
			<div
				class="aras-accordion__content"
				role="region"
				aria-hidden="${this.collapsed}"
			>
				<slot />
			</div>
		`;
	}

	_getMaximizeButton(maximized) {
		if (this.maximized === null) {
			return null;
		}

		const maximizeButtonInfo = maximized
			? {
					className: 'aras-acc-a-button_maximized',
					iconClassName: 'aras-icon-minimize',
					tooltip: getResource('accordion.restore')
			  }
			: {
					className: '',
					iconClassName: 'aras-icon-maximize',
					tooltip: getResource('accordion.maximize')
			  };

		return wire()`
		<button
			class="aras-acc-a-button ${maximizeButtonInfo.className}"
			aria-label="${maximizeButtonInfo.tooltip}"
			onclick="${() => this._maximize()}"
		>
			<div class="aras-tooltip" data-tooltip="${
				maximizeButtonInfo.tooltip
			}" data-tooltip-pos="down" role="tooltip">
				<div class="aras-acc-a-button-icon ${maximizeButtonInfo.iconClassName}"></div>
			</div>
		</button>
	`;
	}

	_getToggleButton(maximized) {
		if (maximized) {
			return null;
		}

		const direction = this.collapsed ? 'down' : 'up';
		const iconClassName = `aras-icon-arrow aras-icon-arrow_${direction}`;
		const className = `aras-accordion__toggle-button ${iconClassName}`;
		const ariaLabel = getResource('aria_label.ItemView.AccordionButton');

		return wire()`
			<span
				class="${className}"
				onclick="${() => this.toggle()}"
				onkeydown="${(e) => this._keyboardHandler(e)}"
				role="button"
				aria-expanded="${!this.collapsed}"
				aria-label="${ariaLabel}"
				tabIndex="0"
			/>
		`;
	}

	_maximize() {
		if (this.maximized === 'true') {
			this.maximized = 'false';
		} else {
			this.maximized = 'true';
		}

		const detail = { maximized: this.maximized };
		const options = {
			bubbles: true,
			detail
		};
		const event = new CustomEvent('accordionMaximize', options);
		this.dispatchEvent(event);
	}

	toggle(shouldCollapse) {
		return new Promise((resolve) => {
			const accordionContent = this.shadowRoot.querySelector(
				'.aras-accordion__content'
			);
			const handler = (event) => {
				if (event.target !== accordionContent) {
					return;
				}

				this.collapsed = shouldCollapse;
				accordionContent.style.height = '';
				this.dispatchEvent(
					new CustomEvent('accordionToggle', {
						bubbles: true
					})
				);
				accordionContent.removeEventListener('transitionend', handler);
				resolve();
			};

			shouldCollapse =
				typeof shouldCollapse === 'boolean' ? shouldCollapse : !this.collapsed;

			accordionContent.addEventListener('transitionend', handler);

			if (shouldCollapse) {
				accordionContent.style.height = accordionContent.offsetHeight + 'px';
				accordionContent.offsetHeight; // Should reflow
				accordionContent.style.height = '0';
				return;
			}

			this.classList.remove('aras-accordion_collapsed');
			const contentHeight = accordionContent.offsetHeight;

			accordionContent.style.height = '0';
			accordionContent.offsetHeight;
			accordionContent.style.height = contentHeight + 'px';
		});
	}
}
