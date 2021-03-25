const widthCache = {};
const tooltipPaddings = 26;

let canvasElement;
let documentStyle;

export function getTextWidth(text, font) {
	if (!widthCache[text]) {
		documentStyle =
			documentStyle || window.getComputedStyle(document.documentElement);
		canvasElement = canvasElement || document.createElement('canvas');

		const context = canvasElement.getContext('2d');
		context.font =
			font || `${documentStyle.fontSize} ${documentStyle.fontFamily}`;
		const metrics = context.measureText(text);

		widthCache[text] = metrics.width;
	}
	return widthCache[text];
}

function getTooltipWidth(message) {
	return getTextWidth(message) + tooltipPaddings;
}

function getTooltipPosition(elementNode, containerNode, message) {
	const elementRectangle = elementNode.getBoundingClientRect();
	const containerRectangle = containerNode.getBoundingClientRect();
	const tooltipNodeWidth = getTooltipWidth(message);
	const leftSpace = elementRectangle.left - containerRectangle.left;
	const rightSpace = containerRectangle.right - elementRectangle.right;

	return rightSpace < tooltipNodeWidth && leftSpace >= tooltipNodeWidth
		? 'left'
		: 'right';
}

export default getTooltipPosition;
