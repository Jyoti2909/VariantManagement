/**
 * Global object which contains general controls and helpers.
 * The object doesn't contain any business logic
 *
 * @namespace ArasModules
 */
const rowSettings = {
	className: 'aras-splitter_vertical',
	sizeParam: 'width',
	offsetParam: 'offsetWidth',
	positionCoordinateParam: 'left',
	ghostMoveParam: 'translateX',
	mouseEventCoordinateParam: 'clientX',
	minSizeParam: 'min-width',
	flexSizeParam: 'flexBasis',
	gridTemplateParam: 'grid-template-columns',
	gridSplitterStartParam: 'grid-column-start'
};
const columnSettings = {
	className: 'aras-splitter_horizontal',
	sizeParam: 'height',
	offsetParam: 'offsetHeight',
	positionCoordinateParam: 'top',
	ghostMoveParam: 'translateY',
	mouseEventCoordinateParam: 'clientY',
	minSizeParam: 'min-height',
	flexSizeParam: 'height',
	gridTemplateParam: 'grid-template-rows',
	gridSplitterStartParam: 'grid-row-start'
};
const DEFAULT_BLOCK_MIN_SIZE = 100;
const DRAGGABLE_CLASS_NAME = 'aras-splitter_draggable';
// CURSOR_OFFSET need for set cursor upon ':before' element of splitter ghost
const CURSOR_OFFSET = 3;

/**
 * @private
 * @param {DOMElement} element - DOM element (one of the siblings)
 * @param {String} prop - prop to return
 * @return {String}, return prop value inline or computed
 */
const getStyleProperty = function (element, prop) {
	if (element && prop) {
		const inlineStyle = element.style.getPropertyValue(prop);
		return inlineStyle
			? inlineStyle
			: window.getComputedStyle(element).getPropertyValue(prop);
	}
};

/**
 * @private
 * @param {DOMElement} element - DOM element
 * @return {Boolean}, return true if element has flex grow
 */
const hasFlexGrow = (element) =>
	!!Number(getStyleProperty(element, 'flex-grow'));

/**
 * @private
 * @param {DOMElement} element - DOM element (one of the siblings)
 * @param {Object} settings - settings object
 * @return {Number}, return element's minSize according to the settings
 */
const getElementMinSize = function (element, settings) {
	return (
		parseInt(getStyleProperty(element, settings.minSizeParam)) ||
		DEFAULT_BLOCK_MIN_SIZE
	);
};

/**
 * Get sibling of splitter element, that have fixed width or height and do not have "flex-grow" property.
 * If container has two growing siblings or none, function returns undefined
 *
 * @private
 * @param {DOMElement} element - splitter DOM element
 * @return {DOMElement}, return splitter sibling, that do not have "flex-grow" property
 */
const getFixedSibling = function (element) {
	const prevSiblingGrow = hasFlexGrow(element.previousElementSibling);
	const nextSiblingGrow = hasFlexGrow(element.nextElementSibling);

	if (prevSiblingGrow && nextSiblingGrow) {
		return;
	} else if (nextSiblingGrow) {
		return element.previousElementSibling;
	}
	return element.nextElementSibling;
};

/**
 * Get coordinates of extreme positions of splitter.
 * These coordinates are used to ensure that current splitter does not extend beyond adjacent splitters when blocks are resized.
 *
 * @private
 * @param {DOMElement} element - splitter DOM element
 * @param {Number} splitterCoordinate - splitter coordinate
 * @param {Number} minPrevSize - minimal size of previous sibling of passed element
 * @param {Number} minNextSize - maximum size of next sibling of passed element
 * @return {null|Object}, return object that contains max and min extreme positions for splitter and transform for this positions;
 * return null when previous or next sibling of splitter has height/width as 0 to use default logic of moving splitter
 */
const getCoordinatesSplitterExtremePositions = function (
	element,
	splitterCoordinate,
	minPrevSize,
	minNextSize
) {
	const { offsetParam } = element.settings;

	const prevElementSize = element.previousElementSibling[offsetParam];
	const nextElementSize = element.nextElementSibling[offsetParam];

	if (prevElementSize === 0 || nextElementSize === 0) {
		return null;
	}

	const minExtremePosition = splitterCoordinate - prevElementSize;
	const maxExtremePosition = splitterCoordinate + nextElementSize;

	const transformForMinExtremePosition = minPrevSize - prevElementSize;
	const transformForMaxExtremePosition = nextElementSize - minNextSize;

	return {
		maxExtremePosition,
		minExtremePosition,
		transformForMinExtremePosition,
		transformForMaxExtremePosition
	};
};

/**
 * Make splitter from received element. Splitter component is based on flex html tags.
 *
 * @function
 * @memberof ArasModules
 * @param {DOMElement} element - DOM element, that needs to be made as splitter
 * @param {Object} options
 * @param {boolean} [options.flexible] options.flexible - enable/disable flexible behavior
 * @return {boolean} true, if splitter has been made
 */

export default class Splitter extends HyperHTMLElement {
	settings = {};
	#fixedSibling;
	#prevIsFixed;
	#minPrevSize;
	#minNextSize;
	#minFixedSize;
	#areBothSiblingsFixed;

	static get booleanAttributes() {
		return ['flexible'];
	}

	static get observedAttributes() {
		return ['direction'];
	}

	_validate() {
		const displayType = getStyleProperty(this.parentNode, 'display');
		const supportedDisplayTypes = ['flex', 'inline-flex', 'grid'];
		if (!supportedDisplayTypes.includes(displayType)) {
			return false;
		}

		if (displayType !== 'grid') {
			const direction = getStyleProperty(this.parentNode, 'flex-direction');
			if (!direction.startsWith('row') && !direction.startsWith('column')) {
				return false;
			}
		}
		return this.flexible || this.#fixedSibling;
	}

	_initializeSettings() {
		const displayType = getStyleProperty(this.parentNode, 'display');

		if (displayType === 'grid') {
			this.settings =
				this.direction === 'column' ? columnSettings : rowSettings;
		} else {
			const isColumn = getStyleProperty(
				this.parentNode,
				'flex-direction'
			).startsWith('column');

			this.settings = isColumn ? columnSettings : rowSettings;
		}
	}

	_setSiblingsParams() {
		const children = Array.from(this.parentNode.children);
		children.forEach((child) => {
			if (hasFlexGrow(child)) {
				const param = this.flexible ? 'flexBasis' : this.settings.flexSizeParam;
				child.style[param] = '0';
			}
		});
	}

	_initialize() {
		this.#prevIsFixed = this.#fixedSibling === this.previousElementSibling;
		this.#minPrevSize = getElementMinSize(
			this.previousElementSibling,
			this.settings
		);
		this.#minNextSize = getElementMinSize(
			this.nextElementSibling,
			this.settings
		);
		this.#minFixedSize = this.#prevIsFixed
			? this.#minPrevSize
			: this.#minNextSize;

		this.classList.add('aras-splitter', this.settings.className);
		this.addEventListener('mousedown', this.onmousedown);
	}

	// To prevent default render() afted node creation
	created() {}

	connectedCallback() {
		this.#fixedSibling = getFixedSibling(this);
		this.#areBothSiblingsFixed =
			!hasFlexGrow(this.previousElementSibling) &&
			!hasFlexGrow(this.nextElementSibling);
		if (!this._validate()) {
			return;
		}
		this._initializeSettings();
		this._initialize();
		this._setSiblingsParams();
		this.render();
	}

	onmousedown(e) {
		const ghost = this.querySelector('.aras-splitter-ghost');
		this.classList.add(DRAGGABLE_CLASS_NAME);

		const splitterBoundingClientRect = this.getBoundingClientRect();
		const splitterCoordinate = Math.round(
			splitterBoundingClientRect[this.settings.positionCoordinateParam]
		);

		const extremePositionsCoordinates = getCoordinatesSplitterExtremePositions(
			this,
			splitterCoordinate,
			this.#minPrevSize,
			this.#minNextSize
		);

		const mouseMoveHandler = (e) => {
			if (!this.classList.contains(DRAGGABLE_CLASS_NAME)) {
				return;
			}
			const mouseEventCoordinate =
				e[this.settings.mouseEventCoordinateParam] - CURSOR_OFFSET;
			let transform = mouseEventCoordinate - splitterCoordinate;

			if (extremePositionsCoordinates) {
				const isMovedToMinExtremePosition = transform < 0;

				if (
					isMovedToMinExtremePosition &&
					mouseEventCoordinate - this.#minPrevSize <=
						extremePositionsCoordinates.minExtremePosition
				) {
					transform =
						extremePositionsCoordinates.transformForMinExtremePosition;
				} else if (
					!isMovedToMinExtremePosition &&
					mouseEventCoordinate + this.#minNextSize >=
						extremePositionsCoordinates.maxExtremePosition
				) {
					transform =
						extremePositionsCoordinates.transformForMaxExtremePosition;
				}
			}

			ghost.style.transform = `${this.settings.ghostMoveParam}(${transform}px)`;
		};

		const mouseUpHandler = (e) => {
			if (!this.classList.contains(DRAGGABLE_CLASS_NAME)) {
				return;
			}
			this.classList.remove(DRAGGABLE_CLASS_NAME);
			let sizeOffset = parseInt(ghost.style.transform.substring(11));
			const { offsetParam } = this.settings;
			if (this.flexible) {
				const isCssGrid =
					getStyleProperty(this.parentNode, 'display') === 'grid';

				const oldPrevSize = this.previousElementSibling[offsetParam];
				const oldNextSize = this.nextElementSibling[offsetParam];

				const combinedSize = isCssGrid
					? this.parentNode[offsetParam] - this[offsetParam]
					: oldPrevSize + oldNextSize;

				const newPrevSize = Math.min(
					Math.max(oldPrevSize + sizeOffset, this.#minPrevSize),
					combinedSize - this.#minNextSize
				);
				if (isCssGrid) {
					const splitterSize = this[offsetParam];
					const prevPercent = (newPrevSize / combinedSize) * 100;

					const prevSize = `calc(${prevPercent}% - ${splitterSize / 2}px)`;
					const nextSize = `calc(${100 - prevPercent}% - ${
						splitterSize / 2
					}px)`;

					this.parentNode.style[
						this.settings.gridTemplateParam
					] = `${prevSize} ${splitterSize}px ${nextSize}`;
				} else {
					const newNextSize = combinedSize - newPrevSize;
					this.previousElementSibling.style['flex-grow'] =
						newPrevSize / newNextSize;
				}
			} else {
				const { sizeParam } = this.settings;
				const getElementNewSize = (oldElementSize, offset, minSize) => {
					const newSize = Math.max(oldElementSize + offset, minSize);
					return `${newSize}px`;
				};

				if (this.#areBothSiblingsFixed) {
					const nextElementSibling = this.nextElementSibling;
					const previousElementSibling = this.previousElementSibling;
					const oldPrevSize = previousElementSibling[offsetParam];
					const oldNextSize = nextElementSibling[offsetParam];
					const combinedSize = oldNextSize + oldPrevSize;
					let prevSiblingNewSize;
					let nextSiblingNewSize;
					if (sizeOffset < 0) {
						prevSiblingNewSize = getElementNewSize(
							oldPrevSize,
							sizeOffset,
							this.#minPrevSize
						);
						nextSiblingNewSize = `${
							combinedSize - parseFloat(prevSiblingNewSize)
						}px`;
					} else {
						nextSiblingNewSize = getElementNewSize(
							oldNextSize,
							-sizeOffset,
							this.#minNextSize
						);
						prevSiblingNewSize = `${
							combinedSize - parseFloat(nextSiblingNewSize)
						}px`;
					}
					previousElementSibling.style[sizeParam] = prevSiblingNewSize;
					nextElementSibling.style[sizeParam] = nextSiblingNewSize;
				} else {
					sizeOffset = sizeOffset * (this.#prevIsFixed ? 1 : -1);

					this.#fixedSibling.style[sizeParam] = getElementNewSize(
						this.#fixedSibling[offsetParam],
						sizeOffset,
						this.#minFixedSize
					);
				}
			}

			ghost.style.transform = '';
			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
		};

		document.addEventListener('mousemove', mouseMoveHandler);
		document.addEventListener('mouseup', mouseUpHandler);
		// preventDefault need for disable text selecting when mouse moving
		e.preventDefault();
	}

	render() {
		this.html`
			<div class="aras-splitter-ghost"></div>
		`;
	}
}

// for pre-webComponent usage compatability
export const splitter = function (splitterNode, options) {
	if (!splitterNode) {
		return false;
	}
	const parentNode = splitterNode.parentNode;
	const splitterComponent = document.createElement('aras-splitter');

	if (options) {
		Object.entries(options).forEach(([key, value]) => {
			if (value === false) {
				return;
			}
			splitterComponent.setAttribute(key, value === true ? '' : value);
		});
	}

	parentNode.replaceChild(splitterComponent, splitterNode);

	// if old splitters had any additional classes or an id
	splitterComponent.id = splitterNode.id;
	splitterComponent.classList.add(...splitterNode.classList);
};
