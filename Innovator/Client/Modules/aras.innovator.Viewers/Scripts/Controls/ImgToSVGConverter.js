require([
	'dojo/_base/fx',
	'dojo/_base/lang',
	'dojo/dom-style',
	'dojo/dom-construct',
	'dojo/_base/declare',
	'dojo/_base/xhr'
], function (baseFx, lang, domStyle, Dom, declare, xhr) {
	return dojo.setObject(
		'VC.UI.ImgToSVGConverter',
		declare(null, {
			constructor: function () {},

			convertImgToSVG: function (domNode, onAfterCreateSVG) {
				var imageNd = domNode.getElementsByTagName('img')[0];
				var imageContainerNode;

				if (imageNd) {
					var baseSrc = imageNd.src;
					if (this.isSvg(baseSrc)) {
						imageContainerNode = this.createImageContainerNode(
							domNode,
							imageNd
						);
						this.svgSerialize(baseSrc).then(
							function (res) {
								this.acyncAttachSVG(
									res,
									imageContainerNode,
									imageNd,
									onAfterCreateSVG
								);
							}.bind(this)
						);
					}
				}
			},

			createImageContainerNode: function (domNode, imageNd) {
				var tooltip = imageNd.title;
				var className = imageNd.className;
				var imgNode = domNode.getElementsByTagName('img')[0];
				domNode
					.getElementsByTagName('img')[0]
					.parentElement.removeChild(imgNode);
				var imageContainerNode = Dom.create(
					'div',
					{ class: className },
					domNode,
					'first'
				);
				imageContainerNode.setAttribute('title', tooltip);
				return imageContainerNode;
			},

			acyncAttachSVG: function (
				res,
				imageContainerNode,
				imageNd,
				onAfterCreateSVG
			) {
				var imageStyle = imageNd.style;
				var SVGElement = document.createElement('div');
				SVGElement.innerHTML = res;
				var svgNode = SVGElement.querySelector('svg');
				svgNode.removeAttribute('height');
				svgNode.removeAttribute('width');
				imageContainerNode.appendChild(svgNode);
				onAfterCreateSVG(svgNode);
				this.setStyles(imageContainerNode, imageStyle);
			},

			isSvg: function (url) {
				return url.toLowerCase().substring(url.length - 3, url.length) == 'svg';
			},

			svgSerialize: function (url) {
				var response = xhr.get({ url: url, sync: false });
				return response.promise;
			},

			setStyles: function (imageNode, imageStyle) {
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
		})
	);
});
