define([
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/dom-construct',
	'dojo/dom-attr',
	'dijit/layout/ContentPane'
], function (declare, array, Dom, DomAttr, ContentPane) {
	return declare(
		'Aras.Client.Controls.Experimental.StatusBarItem',
		ContentPane,
		{
			aras: null,
			item: null,
			itemId: null,
			index: null,
			defaultImage: null,
			defaultText: null,
			type: null,
			width: null,
			fontFamily: 'Arial',
			fontSize: 8,
			fontBold: 'normal',
			fontItalic: '',
			message_template: null,
			_imageNode: null,
			span: null,
			imageBase: '',
			imageWidth: '16px',
			imageHeight: '16px',
			imageMarginTop: '5px',
			imageMarginLeft: '4px',

			constructor: function (args) {
				//Store item node and aras object
				for (var item in args) {
					if (args.hasOwnProperty(item)) {
						this[item] = args[item];
					}
				}
			},

			getFont: function (font) {
				if (font) {
					if (font.getAttribute('bold') == '1') {
						this.fontBold = 'bold';
					}
					if (font.getAttribute('size')) {
						this.fontSize = font.getAttribute('size');
					}
					if (font.getAttribute('italic') == '1') {
						this.fontItalic = 'italic';
					}
					if (font.getAttribute('family')) {
						this.fontFamily = font.getAttribute('family');
					}
				}
			},

			getValue: function (item) {
				var itemValue = item.getAttribute('value');
				switch (this.itemId) {
					case 'server':
						if (itemValue == '{HOST}') {
							itemValue = location.host;
						}
						break;
					case 'database':
						if (itemValue == '{DATABASE}') {
							itemValue = this.aras.getDatabase();
						}
						break;
				}

				return itemValue ? itemValue : '&nbsp;';
			},

			buildRendering: function () {
				this.inherited(arguments);

				this.itemId = this.item.getAttribute('id');
				this.index = this.item.getAttribute('index');
				this.width = this.item.getAttribute('width');
				this.type = this.item.getAttribute('type');
				this.defaultText = this.getValue(this.item);

				// Process Children
				array.forEach(
					this.item.childNodes,
					function (childNode) {
						if ('1' == childNode.nodeType) {
							var childNodeName = childNode.nodeName;
							if ('font' == childNodeName) {
								this.getFont(childNode);
							} else if ('url' == childNodeName) {
								this.defaultImage = childNode.childNodes[0].nodeValue;
								if (childNode.attributes.length > 0) {
									this.imageAttr = childNode.attributes;
								}
							} else if ('message' == childNodeName) {
								this.message_template = childNode.getAttribute('template');
							}
						}
					},
					this
				);

				DomAttr.set(this, {
					id: this.itemId,
					style: 'padding: 0; width:' + this.width + ';'
				});
				this.span = Dom.create('span');
				this.span.setAttribute('class', 'status-column');
				Dom.place(this.span, this.domNode, 'first');

				this.ClearStatus();
			},

			ClearStatus: function () {
				this.SetText(this.defaultText);
				this.SetImage(this.defaultImage);
			},

			SetDefaultMessage: function (text, imagepath) {
				this.defaultText = text;
				this.defaultImage = imagepath;
				this.ClearStatus();
			},

			SetImage: function (imagepath, imageposition) {
				if (imagepath) {
					imagepath = (this.imageBase ? this.imageBase : '') + imagepath;
					var align;
					var position;
					if (imageposition == 'right') {
						position = 'last';
						align = { align: 'top' };
					} else {
						position = 'first';
						align = { align: 'left' };
					}

					if (!this._imageNode) {
						this._imageNode = Dom.create(
							'img',
							Object.assign({ src: imagepath }, align)
						);
						Dom.place(this._imageNode, this.domNode, position);
					} else {
						DomAttr.set(
							this._imageNode,
							Object.assign({ src: imagepath, style: '' }, align)
						);
						Dom.place(this._imageNode, this.domNode, position);
					}
				} else if (this._imageNode) {
					DomAttr.set(this._imageNode, { style: 'display: none' });
				}
				if (this._imageNode) {
					if (this.imageAttr) {
						this._imageNode.style.maxWidth = this.imageAttr.getNamedItem(
							'width'
						).text;
						this._imageNode.style.maxHeight = this.imageAttr.getNamedItem(
							'height'
						).text;
					} else {
						this._imageNode.style.maxWidth = this.imageWidth;
						this._imageNode.style.maxHeight = this.imageHeight;
					}
					this._imageNode.style.marginTop = this.imageMarginTop;
					this._imageNode.style.marginLeft = this.imageMarginLeft;
					this.span.style.width =
						imageposition == 'right'
							? 'auto'
							: parseInt(this.domNode.offsetWidth) -
							  parseInt(this._imageNode.offsetWidth) -
							  5 +
							  'px'; //margin-left
				}
			},

			SetText: function (text) {
				this.span.innerHTML = text;
			},

			SetStatus: function (text, imagepath, imageposition) {
				this.SetText(text);
				this.SetImage(
					'default' == imagepath ? this.defaultImage : imagepath,
					imageposition
				);
			}
		}
	);
});
