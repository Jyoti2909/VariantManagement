/*jslint sloppy: true, nomen: true*/
/*global dojo, define, document, window*/
define(['dojo/_base/declare', 'dojo/dom-construct'], function (declare, Dom) {
	return declare(
		'Aras.Client.Controls.Experimental._toolBar._ToolbarButtonMixin',
		null,
		{
			constructor: function (args) {
				this._imageSrc = args.imageSrc;
				this._imageClass = args.imageClass;
				this._imageStyle = args.imageStyle;
			},

			postCreate: function (args) {
				this.inherited(arguments);
				this.iconNode.style.display = 'inline-block';

				const imageNode = Dom.create(
					'img',
					{ class: this._imageClass, src: this._imageSrc },
					this.iconNode
				);
				setStyles(imageNode, this._imageStyle);

				function setStyles(imageNode, imageStyle) {
					// removeAttribute() needed for IE, because it's add unnecessary attributes 'width' and 'height', when image loaded from cache.
					imageNode.removeAttribute('width');
					imageNode.removeAttribute('height');
					if (imageStyle.width != 'auto') {
						imageNode.style.width = imageStyle.width;
					} else {
						imageNode.style.maxWidth = imageStyle.maxWidth;
					}
					if (imageStyle.height != 'auto') {
						imageNode.style.height = imageStyle.height;
					} else {
						imageNode.style.maxHeight = imageStyle.maxHeight;
					}
					if (imageStyle.display == 'none') {
						imageNode.style.display = imageStyle.display;
					}
				}

				this.containerNode.style.verticalAlign = 'middle';
			}
		}
	);
});
