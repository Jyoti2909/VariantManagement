/*global define*/
//>>built
define([
	'dojo/_base/declare', // declare
	'dojo/string',
	'dijit/_editor/_Plugin',
	'dijit/form/Button'
], function (declare, stringModule, _Plugin, Button) {
	// module:
	//		Aras/Client/Controls/_htmlEditor/plugins/ImageBrowser
	// summary:
	//		This plugin provides button for adding images through ImageBrowser
	var ImageBrowser = declare(_Plugin, {
		// summary:
		//		This plugin provides button for adding images through ImageBrowser
		//

		constructor: function (args) {
			this.inherited(arguments);
		},

		// useDefaultCommand: Boolean
		//		False as we do not use the default editor command/click behavior.
		useDefaultCommand: false,

		label: 'Insert Image',

		// Override _Plugin.buttonClass to use Button to control this plugin
		buttonClass: Button,

		_initButton: function () {
			var self = this;
			this.inherited(arguments);
			this.button.setLabel(this.label);
			this.button.onClick = function () {
				if (!self.editor.arasObj || !self.editor.arasObj.modalDialogHelper) {
					alert(
						'Image Browser cannot be shown without arasObj, arasObj.modalDialogHelper.'
					);
					return;
				}
				(
					aras.getMostTopWindowWithAras(window) || window
				).ArasModules.Dialog.show('iframe', {
					aras: self.editor.arasObj,
					type: 'ImageBrowser'
				}).promise.then(self._callback(self));
			};
		},

		_callback: function (instance) {
			return function (newImg) {
				var arasObj = instance.editor.arasObj,
					urlsDic = instance.editor.urlsDic;
				if (newImg && newImg !== 'set_nothing') {
					// replace the relative portion of the URL with an absolute protion
					// for this server.  This is to compensate for the HTML control not understanding relative URLs
					newImg = newImg.replace(/\.\./, arasObj.getBaseURL());
					// Add image to the dictionary and replace its vault url with an url with a token
					var substr = 'vault:///?fileid=';
					var fileIdpos = newImg.toLowerCase().indexOf(substr);
					if (fileIdpos === 0) {
						var vaultUrl = newImg;
						var fileId = vaultUrl.replace(/vault:\/\/\/\?fileid\=/i, '');
						var vaultUrlwithToken = arasObj.IomInnovator.getFileUrl(
							fileId,
							arasObj.Enums.UrlType.SecurityToken
						);
						vaultUrlwithToken = vaultUrlwithToken.replace(/&/g, '&amp;');
						newImg = newImg.replace(vaultUrl, vaultUrlwithToken);
						urlsDic.vaultUrls[urlsDic.Count] = vaultUrl;
						urlsDic.tempUrls[urlsDic.Count] = vaultUrlwithToken;
						urlsDic.Count++;
					}
					instance._insertImage(newImg, '', 'absmiddle');
				}
			};
		},

		_insertImage: function (url, altText, align, border, hSpace, vSpace) {
			this.editor.execCommand(
				'inserthtmlex',
				stringModule.substitute('<image ${0} ${1} ${2} ${3} ${4} ${5} />', [
					url ? 'src = "' + url + '" ' : '',
					altText ? 'alt = "' + altText + '" ' : '',
					align ? 'align = "' + align + '" ' : '',
					border ? 'border = "' + border + '" ' : '',
					hSpace ? 'hspace = "' + hSpace + '" ' : '',
					vSpace ? 'vspace = "' + vSpace + '" ' : ''
				])
			);
		},

		updateState: function () {
			if (this.button) {
				var disabled = this.get('disabled');
				this.button.set('disabled', disabled);
			}
		}
	});

	// Register this plugin.
	_Plugin.registry.imageBrowser = function () {
		return new ImageBrowser({ command: 'imageBrowser' });
	};
	return ImageBrowser;
});
