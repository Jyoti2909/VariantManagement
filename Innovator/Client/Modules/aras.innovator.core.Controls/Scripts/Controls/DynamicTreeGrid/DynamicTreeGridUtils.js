(function (window, document) {
	'use strict';

	const canvas = document.createElement('canvas');

	window.DynamicTreeGridUtils = {
		isBoolean: function (value) {
			return typeof value === 'boolean';
		},

		isString: function (value) {
			return typeof value === 'string' || value instanceof String;
		},

		removeArrayElementByValue: function (array, value) {
			const index = array.indexOf(value);
			if (index !== -1) {
				array.splice(index, 1);
			}
		},

		measureTextWidth: function (text, dom) {
			const style = window.getComputedStyle(dom);
			const font = style.fontSize + ' ' + style.fontFamily;
			const context = canvas.getContext('2d');
			context.font = font;
			return Math.round(context.measureText(text).width);
		},

		dispatchEvent: function (dom, eventName, detail) {
			dom.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
		}
	};
})(window, document);
