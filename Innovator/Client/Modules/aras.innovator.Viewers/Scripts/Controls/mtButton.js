VC.Utils.Page.LoadModules(['Interfaces/IButton', 'Controls/ImgToSVGConverter']);

require([
	'dojo/_base/fx',
	'dojo/_base/lang',
	'dojo/dom-style',
	'dojo/dom-construct',
	'dojo/mouse',
	'dojo/on',
	'dijit/_WidgetBase',
	'dojo/_base/declare',
	'dojo/dom-class'
], function (
	baseFx,
	lang,
	domStyle,
	Dom,
	mouse,
	on,
	_WidgetBase,
	declare,
	domClass
) {
	return dojo.setObject(
		'VC.UI.mtButton',
		declare([_WidgetBase, VC.Interfaces.IButton], {
			IsPressed: false,
			IsDisable: false,
			name: null,
			svgNode: null,

			toolbarName: '',
			isHighlightable: true,

			constructor: function (args, srcNodeRef) {},

			postCreate: function () {
				this.inherited(arguments);

				this.own(
					on(this.domNode, 'click', lang.hitch(this, '_onClick')),
					on(this.domNode, mouse.enter, lang.hitch(this, '_highlightOn')),
					on(this.domNode, mouse.leave, lang.hitch(this, '_highlightOff'))
				);

				this.name = this.getButtonName();
				this.id = this.name + VC.Utils.getTimestampString();

				this.baseSrc = this.domNode.getElementsByTagName('img')[0].src;
				var imgToSVGConverter = new VC.UI.ImgToSVGConverter();
				imgToSVGConverter.convertImgToSVG(
					this.domNode,
					this.onAfterCreateSVG.bind(this)
				);
			},

			onAfterCreateSVG: function (svgNode) {
				this.svgNode = svgNode;
				this.enable(!this.IsDisable);
			},

			getButtonName: function () {
				var btnName = this.domNode.getAttribute('data-dojo-attach-point');
				if (btnName.indexOf('Button') !== -1) {
					btnName = btnName.replace('Button', '');
				} else if (btnName.indexOf('btn') !== -1) {
					btnName = btnName.replace('btn', '');
				}
				return btnName;
			},

			_highlightOn: function () {
				if (this.isHighlightable) {
					domClass.add(this.domNode, 'MarkupHoverButton');
				}
			},

			_highlightOff: function () {
				if (this.isHighlightable) {
					domClass.remove(this.domNode, 'MarkupHoverButton');
				}
			},

			SetPressedState: function (newState) {
				this.IsPressed = newState;

				if (this.IsPressed) {
					domClass.add(this.domNode, 'MarkupPressedButton');
				} else {
					domClass.remove(this.domNode, 'MarkupPressedButton');
				}
			},

			Disable: function () {
				this.enable(false);
			},

			Enable: function () {
				this.enable(true);
			},

			enable: function (flag) {
				// svgNode may not exist due to asynchronous creation procedure
				if (this.svgNode) {
					var node = VC.Utils.isIE() ? this.svgNode.parentNode : this.svgNode;
					if (flag) {
						VC.Utils.removeClass(node, 'grayImage');
					} else {
						VC.Utils.addClass(node, 'grayImage');
					}
				}

				this.IsDisable = !flag;
			},

			onClick: function (args) {},
			onInnerClick: function (args) {},

			_onClick: function (event) {
				if (!this.IsDisable) {
					this.onClick(event);
					this.onInnerClick();
				}
			}
		})
	);
});
