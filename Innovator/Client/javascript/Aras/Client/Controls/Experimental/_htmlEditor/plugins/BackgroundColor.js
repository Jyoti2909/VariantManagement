//>>built
define([
	'require',
	'dojo/colors', // colors.fromRgb
	'dojo/_base/declare', // declare
	'dojo/_base/lang',
	'dijit/_editor/_Plugin',
	'dijit/form/DropDownButton',
	'dojo/_base/window',
	'dijit/_editor/selection',
	'dojo/aspect'
	//"dijit/ColorPalette"
], function (
	require,
	colors,
	declare,
	lang,
	_Plugin,
	DropDownButton,
	win,
	selectionapi,
	aspect
) {
	/*=====
	var _Plugin = dijit._editor._Plugin;
	=====*/

	// module:
	//		Aras/Client/Controls/_htmlEditor/plugins/BackgroundColor
	// summary:
	//		This plugin provides dropdown color pickers for setting body/td background color

	var BackgroundColor = declare(_Plugin, {
		// summary:
		//		This plugin provides dropdown color pickers for setting body/td background color
		//

		// Override _Plugin.buttonClass to use DropDownButton (with ColorPalette) to control this plugin
		constructor: function (args) {
			this.inherited(arguments);
			this.targetNode = null;
		},
		setEditor: function (args) {
			this.inherited(arguments);
			var self = this;
		},
		buttonClass: DropDownButton,

		// useDefaultCommand: Boolean
		//		False as we do not use the default editor command/click behavior.
		useDefaultCommand: false,

		label: 'Body/Cell background',

		_initButton: function () {
			this.inherited(arguments);
			// Setup to lazy load ColorPalette first time the button is clicked

			var self = this;
			this.button.setLabel('Body/Cell Background');
			this.button.loadDropDown = function (callback) {
				require(['dijit/ColorPalette'], lang.hitch(this, function (
					ColorPalette
				) {
					this.dropDown = new ColorPalette({
						value: self.value,
						onChange: function (color) {
							self.editor.editNode.parentNode.focus();
							var targetNode = win.withGlobal(
								self.editor.window,
								'getAncestorElement',
								selectionapi,
								['body', 'td']
							);
							targetNode.style.backgroundColor = color;
						}
					});
					callback();
				}));
			};
		},

		updateState: function () {
			// summary:
			//		Overrides _Plugin.updateState().  This updates the ColorPalette
			//		to show the color of the currently selected body/td node.
			// tags:
			//		protected
			var _e = this.editor;
			var _c = this.command;
			if (!_e || !_e.isLoaded || !_c.length) {
				return;
			}

			var value;
			if (this.button) {
				var disabled = this.get('disabled');
				this.button.set('disabled', disabled);
				if (disabled) {
					return;
				}

				var targetNode = win.withGlobal(
					this.editor.window,
					'getAncestorElement',
					selectionapi,
					['body', 'td']
				);
				if (targetNode) {
					value = targetNode.style.backgroundColor;
				} else {
					value = '';
				}
			}
			if (value === '') {
				value = '#ffffff';
			}

			if (typeof value == 'string') {
				//if RGB value, convert to hex value
				if (value.indexOf('rgb') > -1) {
					value = colors.fromRgb(value).toHex();
				}
			} else {
				//it's an integer(IE returns an MS access #)
				value =
					((value & 0x0000ff) << 16) |
					(value & 0x00ff00) |
					((value & 0xff0000) >>> 16);
				value = value.toString(16);
				value = '#000000'.slice(0, 7 - value.length) + value;
			}

			this.value = value;

			var dropDown = this.button.dropDown;
			if (dropDown && value !== dropDown.get('value')) {
				dropDown.set('value', value, false);
			}
		}
	});

	// Register this plugin.
	_Plugin.registry.backgroundColor = function () {
		return new BackgroundColor({ command: 'backgroundColor' });
	};
	return BackgroundColor;
});
