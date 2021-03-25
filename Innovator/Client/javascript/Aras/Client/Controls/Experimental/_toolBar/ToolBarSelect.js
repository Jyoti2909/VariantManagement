/*jslint sloppy: true, nomen: true*/
/*global define, document, window*/
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/form/Select',
	'dijit/MenuItem',
	'dojo/_base/lang', // lang.hitch,
	'dijit/MenuSeparator'
], function (declare, connect, Select, MenuItem, lang, MenuSeparator) {
	return declare([Select], {
		postCreate: function (args) {
			this.inherited(arguments);
			this.measureNode = document.createElement('span');
			this.measureNode.style.position = 'absolute';
			this.measureNode.style.left = '-1000px';
			this.measureNode.style.top = '-1000px';

			var self = this,
				handle = connect.connect(this.domNode, 'DOMNodeInserted', function (
					event
				) {
					if (self.domNode.parentNode) {
						connect.disconnect(handle);
						self._updateDisplayWidth();
					}
				});
		},

		measureNode: undefined,

		templateString:
			'<table class="dijit dijitReset dijitInline dijitLeft aras_form_select "\n\tdata-dojo-attach-point="_buttonNode,tableNode,focusNode" cellspacing=\'0\' cellpadding=\'0\'\n\trole="combobox" aria-haspopup="true"\n\t>' +
			'<tbody role="presentation">' +
			'<tr role="presentation"\n\t\t>' +
			'<td class="dijitReset dijitStretch dijitButtonContents dijitButtonNode" role="presentation"\n\t\t\t>' +
			'<span class="dijitReset dijitInline dijitButtonText" style="text-align: left;" data-dojo-attach-point="containerNode,_popupStateNode"></span\n\t\t\t>' +
			'<input type="hidden" ${!nameAttrSetting} data-dojo-attach-point="valueNode" value="${value}" aria-hidden="true"\n\t\t/>' +
			'</td>' +
			'<td class="dijitReset dijitRight dijitButtonNode dijitArrowButton dijitDownArrowButton"\n\t\t\t\tdata-dojo-attach-point="titleNode" role="presentation"\n\t\t\t>' +
			'<div class="dijitReset dijitArrowButtonInner DropDownArrowButtonInner" role="presentation"></div\n\t\t\t><div class="dijitReset dijitArrowButtonChar" role="presentation">&#9660;</div\n\t\t>' +
			'</td\n\t></tr></tbody\n></table>',

		_updateDisplayWidth: function () {
			if (!this.domNode.parentNode) {
				return;
			}
			var index, textWidth;
			var displayWidth = 0;
			if (this.options.length > 0) {
				document.body.appendChild(this.measureNode);
				for (index = 0; index < this.options.length; index += 1) {
					textWidth = this._measureText(this.options[index].label).width;
					if (displayWidth < textWidth) {
						displayWidth = textWidth;
					}
				}
				document.body.removeChild(this.measureNode);
			}
			if (displayWidth !== 0) {
				this.containerNode.style.width = displayWidth + 'px';
			}
		},

		addOption: function (option) {
			this.inherited(arguments);
			this._updateDisplayWidth();
		},

		removeOption: function (valueOrIdx) {
			this.inherited(arguments);
			this._updateDisplayWidth();
		},

		updateOption: function (newOption) {
			this.inherited(arguments);
			this._updateDisplayWidth();
		},

		_measureText: function (text) {
			var result;

			this.measureNode.style.fontSize = window.getComputedStyle(
				this.containerNode
			).fontSize;
			this.measureNode.innerHTML = text;

			result = {
				width: this.measureNode.clientWidth,
				height: this.measureNode.clientHeight
			};

			return result;
		},

		_getMenuItemForOption: function (option) {
			// summary:
			//		For the given option, return the menu item that should be
			//		used to display it.  This can be overridden as needed
			// Just a regular menu option
			var item,
				click,
				self = this;
			if ('separator' !== option.type) {
				click = lang.hitch(this, '_setValueAttr', option);
				item = new MenuItem({
					option: option,
					label: option.label || this.emptyLabel,
					onClick: function () {
						var isChanged = self.getValue() !== this.option.value;
						click();
						if (!isChanged) {
							self.onChange();
						}
					},
					disabled: option.disabled || false
				});
				item.focusNode.setAttribute('role', 'listitem');
			} else {
				item = new MenuSeparator();
			}
			return item;
		}
	});
});
