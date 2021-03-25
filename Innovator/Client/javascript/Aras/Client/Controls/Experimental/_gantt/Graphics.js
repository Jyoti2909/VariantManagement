/*jslint plusplus: true*/
/*global dojo, define, dijit*/
define([], function () {
	'use strict';

	var Graphics = {};

	Graphics.Colors = {
		White: '#FFFFFF',
		DarkGray: '#A9A9A9',
		LightGray: '#D3D3D3',
		Blue: '#0000EE',
		Black: '#000000',
		fromHexToRGBA: function (hex, opacity) {
			hex = hex.replace('#', '');
			var r = parseInt(hex.substring(0, 2), 16),
				g = parseInt(hex.substring(2, 4), 16),
				b = parseInt(hex.substring(4, 6), 16),
				result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
			return result;
		}
	};

	Graphics.Font = function (family, size, bolt, italic) {
		this.family = family;
		this.size = size;
		this.isBolt = bolt;
		this.isItalic = italic;
	};
	return Graphics;
});
