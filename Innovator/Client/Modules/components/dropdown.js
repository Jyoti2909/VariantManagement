const defaults = {
	pos: 'bottom-left',
	closeOnClick: false
};
const OPENED_CLASS_NAME = 'aras-dropdown_opened';

const getDropdownSize = function (element) {
	element.style.visibility = 'hidden';
	const size = {
		width: element.offsetWidth,
		height: element.offsetHeight
	};
	element.style.visibility = '';

	return size;
};

const udpatePositionOfDropdownBoxElement = (element, dropdownPosition) => {
	if (element.tagName.toLowerCase() === 'aras-menu') {
		let horizontalAlignmentSide = null;
		if (dropdownPosition.endsWith('left')) {
			horizontalAlignmentSide = 'left';
		} else if (dropdownPosition.endsWith('right')) {
			horizontalAlignmentSide = 'right';
		}

		element.calcSubmenuPosition(element, {
			preventGreedyVerticalExpansion: true,
			horizontalAlignmentSide
		});
	}
};

const updatePositionOfDroprownBox = function (parentProps, dropdownBox) {
	const elmRect = dropdownBox.getBoundingClientRect();
	const elementBottom = dropdownBox.offsetHeight + parentProps.offsetTop;
	const docElement = document.documentElement;
	const docSize = {
		width: docElement.clientWidth,
		height: docElement.clientHeight
	};

	if (elmRect.right > docSize.width) {
		dropdownBox.style.left =
			parseInt(dropdownBox.style.left) - (elmRect.right - docSize.width) + 'px';
	}
	if (elementBottom > parentProps.height) {
		dropdownBox.style.top =
			parseInt(dropdownBox.style.top) -
			(elementBottom - parentProps.height) +
			'px';
	}
	if (elmRect.left < 0) {
		dropdownBox.style.left =
			parseInt(dropdownBox.style.left) + Math.abs(elmRect.left) + 'px';
	}
	if (parentProps.offsetTop < 0) {
		dropdownBox.style.top =
			parseInt(dropdownBox.style.top) + Math.abs(parentProps.offsetTop) + 'px';
	}
};

const getSourcePosition = function (pos, dropdownSize, buttonSize) {
	switch (pos) {
		case 'bottom-left':
			return { top: 0 + buttonSize.height, left: 0 };
		case 'bottom-right':
			return {
				top: 0 + buttonSize.height,
				left: 0 + buttonSize.width - dropdownSize.width
			};
		case 'bottom-center':
			return {
				top: 0 + buttonSize.height,
				left: 0 + buttonSize.width / 2 - dropdownSize.width / 2
			};
		case 'top-left':
			return { top: 0 - dropdownSize.height, left: 0 };
		case 'top-right':
			return {
				top: 0 - dropdownSize.height,
				left: 0 + buttonSize.width - dropdownSize.width
			};
		case 'top-center':
			return {
				top: 0 - dropdownSize.height,
				left: 0 + buttonSize.width / 2 - dropdownSize.width / 2
			};
		case 'left-top':
			return { top: 0, left: 0 - dropdownSize.width };
		case 'left-bottom':
			return {
				top: 0 + buttonSize.height - dropdownSize.height,
				left: 0 - dropdownSize.width
			};
		case 'left-center':
			return {
				top: 0 + buttonSize.height / 2 - dropdownSize.height / 2,
				left: 0 - dropdownSize.width
			};
		case 'right-top':
			return { top: 0, left: 0 + buttonSize.width };
		case 'right-bottom':
			return {
				top: 0 + buttonSize.height - dropdownSize.height,
				left: 0 + buttonSize.width
			};
		case 'right-center':
			return {
				top: 0 + buttonSize.height / 2 - dropdownSize.height / 2,
				left: 0 + buttonSize.width
			};
	}
};

const getOffsetParentProps = function (container, offsetTop) {
	offsetTop += container.offsetTop;
	const offsetParent = container.offsetParent;
	if (!offsetParent) {
		const docElement = document.documentElement;
		return {
			offsetTop: offsetTop,
			width: docElement.clientWidth,
			height: docElement.clientHeight
		};
	}

	const elementOverflow = getComputedStyle(offsetParent).overflow;
	if (elementOverflow === 'hidden') {
		return {
			offsetTop: offsetTop,
			width: offsetParent.clientWidth,
			height: offsetParent.clientHeight
		};
	}

	return getOffsetParentProps(offsetParent, offsetTop);
};

export default class Dropdown extends HyperHTMLElement {
	constructor(props) {
		super(props);
		this.boundBlurHandler = this.blurEventHandler.bind(this);
		this.buttonNode = null;
		this.dropdownBox = null;
		this.initialized = false;
	}
	connectedCallback() {
		if (!this.initialized) {
			const pos = this.getAttribute('position') || defaults.pos;
			const closeOnClick = this.hasAttribute('closeonclick');
			this.currentSettings = Object.assign({}, defaults, { pos, closeOnClick });

			this.addEventListener(
				'click',
				this.handleDropdownContentClick.bind(this)
			);
			this.addEventListener('keydown', this.handleKeydown);
			// Using 'mousedown' event instead of 'click' event need, because 'blur' event triggers before the 'click' event
			// and closes dropdown, after that 'click' event triggered and opens dropdown again
			this.addEventListener('mousedown', this.toggleDropdown.bind(this));
			this.initialized = true;
		}
	}
	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case 'closeonclick':
				this.currentSettings = Object.assign(
					{},
					defaults,
					this.currentSettings,
					{ closeOnClick: newValue === '' }
				);
				break;
			case 'position':
				if (newValue) {
					this.currentSettings = Object.assign(
						{},
						defaults,
						this.currentSettings,
						{ pos: newValue }
					);
				}
				break;
		}
	}
	static get observedAttributes() {
		return ['closeonclick', 'position'];
	}
	recalculateButtonSize() {
		if (this.buttonNode) {
			this.buttonSize = {
				width: this.buttonNode.offsetWidth,
				height: this.buttonNode.offsetHeight
			};
		}
	}
	toggleDropdown(e) {
		const targetButton = e.target.closest('[dropdown-button]');
		const container = targetButton && targetButton.closest('aras-dropdown');
		const dropdownBox = container && container.querySelector('.aras-dropdown');
		if (
			!targetButton ||
			!dropdownBox ||
			container !== this ||
			targetButton.hasAttribute('disabled') ||
			targetButton.getAttribute('aria-disabled') === 'true'
		) {
			return;
		}

		if (!this.dropdownBox || this.dropdownBox !== dropdownBox) {
			this.dropdownBox = dropdownBox;
			this.dropdownBox.tabIndex = 0;
		}
		if (!this.buttonNode || this.buttonNode !== targetButton) {
			this.buttonNode = targetButton;
			this.recalculateButtonSize();
		}

		const parentProps = getOffsetParentProps(this, 0);
		this.dropdownBox.style.maxHeight = 'none';
		this.dropdownBox.style.overflowY = 'visible';
		this.dropdownBox.classList.toggle(OPENED_CLASS_NAME);

		if (this.dropdownBox.classList.contains(OPENED_CLASS_NAME)) {
			this.dispatchCustomEvent('dropdownbeforeopen');
			const dropdownSize = getDropdownSize(this.dropdownBox);
			const sourcePosition = getSourcePosition(
				this.currentSettings.pos,
				dropdownSize,
				this.buttonSize
			);
			const leftPos = sourcePosition.left + 'px';
			const topPos = sourcePosition.top + 'px';
			if (parentProps.height < this.dropdownBox.clientHeight) {
				this.dropdownBox.style.maxHeight = parentProps.height + 'px';
				this.dropdownBox.style.overflowY = 'auto';
			}
			if (
				this.dropdownBox.style.left !== leftPos ||
				this.dropdownBox.style.top !== topPos
			) {
				this.dropdownBox.style.left = leftPos;
				this.dropdownBox.style.top = topPos;
			}
			parentProps.offsetTop += this.dropdownBox.offsetTop;
			updatePositionOfDroprownBox(parentProps, this.dropdownBox);
			udpatePositionOfDropdownBoxElement(
				this.dropdownBox,
				this.currentSettings.pos
			);

			this.dropdownBox.addEventListener('blur', this.boundBlurHandler, true);
			this.dispatchCustomEvent('dropdownopened');
			this.setAttribute('open', '');
			this.buttonNode.setAttribute('aria-expanded', 'true');
			// need timeout here to make sure that button click lifecyrcle is end and after that make focus on dropdown
			setTimeout(() => {
				this.dropdownBox.focus();
			}, 0);
		} else {
			this.removeAttribute('open');
			this.buttonNode.focus();
		}
	}
	dispatchCustomEvent(type) {
		const evt = new CustomEvent(type, { bubbles: true, cancelable: true });
		this.dropdownBox.dispatchEvent(evt);
	}

	blurEventHandler(e) {
		const isDropdownContentBecameFocused =
			this.dropdownBox.contains(e.relatedTarget) ||
			this.dropdownBox.contains(document.activeElement);
		if (!isDropdownContentBecameFocused) {
			this.closeDropdown();
		}
	}

	closeDropdown() {
		this.dropdownBox.removeEventListener('blur', this.boundBlurHandler, true);
		this.dropdownBox.classList.remove(OPENED_CLASS_NAME);
		this.dropdownBox.blur();
		this.dispatchCustomEvent('dropdownclosed');
		this.buttonNode.removeAttribute('aria-expanded');
		this.removeAttribute('open');
		document.body.focus();
	}

	handleDropdownContentClick(e) {
		if (e.target.closest('[dropdown-button]') || e.target === this) {
			return;
		}

		const isContainerClicked = e.target === this.dropdownBox;

		const listNode = e.target.closest('li[data-index]');
		const isParentListNodeClicked =
			listNode && listNode.classList.contains('aras-list__parent');

		if (
			this.currentSettings.closeOnClick &&
			!isContainerClicked &&
			!isParentListNodeClicked
		) {
			this.closeDropdown();
		}
	}
	handleKeydown(e) {
		switch (e.code) {
			case 'Escape':
			case e.altKey && 'ArrowUp':
				if (this.hasAttribute('open')) {
					this.closeDropdown();
					this.buttonNode.focus();
				}
				break;
			case 'Enter':
			case 'NumpadEnter':
			case 'Space':
			case e.altKey && 'ArrowDown':
				if (
					e.target.closest('[dropdown-button]') &&
					!this.hasAttribute('open')
				) {
					this.toggleDropdown(e);
					// :active state doesn't remove from button https://bugs.chromium.org/p/chromium/issues/detail?id=973035&can=2&q=973035
					e.preventDefault();
				}
				break;
		}
	}
}
