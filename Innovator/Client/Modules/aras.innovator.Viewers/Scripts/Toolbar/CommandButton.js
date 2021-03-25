VC.Utils.Page.LoadModules(['Interfaces/IButton', 'Toolbar/CommandControl']);
require(['dojo/dom-construct'], dojo.hitch(this, function (dom) {
	return dojo.setObject(
		'VC.Toolbar.CommandButton',
		dojo.declare(
			'CommandButton',
			[VC.Toolbar.CommandControl, VC.Interfaces.IButton],
			{
				isCancelled: false,

				onClick: function () {},

				constructor: function () {
					this.eventName = 'onClick';
					this.commandBarEventName = this.id + 'Click';
				},

				enable: function (flag) {
					this.commandBarItem.setEnabled(flag);
					this.IsDisable = !flag;

					if (flag) {
						if (this.placeholder && this.IsPressed) {
							this.placeholder.show();
						}
					} else {
						if (this.placeholder) {
							this.placeholder.hide();
						}
					}
				},

				Enable: function () {
					this.enable(true);
				},

				Disable: function () {
					this.enable(false);
				},

				select: function () {
					if (!this.IsPressed) {
						this.SetPressedState(true);

						if (this.placeholder) {
							this.placeholder.show();
						}

						if (this.onSelect) {
							this.onSelect();
						}
					}
				},

				deselect: function () {
					this.SetPressedState(false);

					if (this.placeholder) {
						this.placeholder.hide();
					}
				},

				SetPressedState: function (flag) {
					this.IsPressed = flag;

					var item = this.commandBarItem._item_Experimental;
					if (item) {
						if (flag) {
							item.domNode.classList.add('dijitToggleButtonChecked');
						} else {
							item.domNode.classList.remove('dijitToggleButtonChecked');
						}
					}
				},

				SetImage: function (image) {
					if (!image) {
						return;
					}
					var iconNode = this.commandBarItem._item_Experimental.iconNode;
					var imageClass = this.commandBarItem._item_Experimental.imageClass;
					var imageStyle = this.commandBarItem._item_Experimental.imageStyle;
					var imageNode;

					iconNode.style.display = 'inline-block';
					iconNode.innerHTML = '';

					if (
						dojoConfig.arasContext.browser.isIe &&
						dojoConfig.arasContext.browser.majorVersion >= 10
					) {
						imageNode = dom.create('div', { class: imageClass }, iconNode);
						var SVGElement = document.createElement('div');
						SVGElement.innerHTML = svgSerialize(image);
						var svgNode = SVGElement.querySelector('svg');
						svgNode.setAttribute('height', imageStyle.maxHeight);
						svgNode.setAttribute('width', imageStyle.width);
						imageNode.appendChild(svgNode);
					} else {
						imageNode = dom.create(
							'img',
							{ class: imageClass, src: image },
							iconNode
						);
					}
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

					function svgSerialize(url) {
						var response = dojo.xhr.get({ url: url, sync: true });
						var svgCode = response.results[0];
						return svgCode;
					}
				}
			}
		)
	);
}));
