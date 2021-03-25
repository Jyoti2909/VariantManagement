VC.Utils.Page.LoadModules(['Interfaces/IButton']);
VC.Utils.Page.LoadModules([
	'Controls/mtButton',
	'Interfaces/IButton',
	'Controls/ImgToSVGConverter'
]);
require([
	'dojo/_base/fx',
	'dojo/_base/lang',
	'dojo/dom-style',
	'dojo/dom-construct',
	'dojo/query',
	'dojo/mouse',
	'dojo/on',
	'dijit/_TemplatedMixin',
	'dojo/NodeList-traverse'
], dojo.hitch(this, function (
	baseFx,
	lang,
	domStyle,
	Dom,
	query,
	mouse,
	on,
	_TemplatedMixin
) {
	function _expandButton(self) {
		var buttonContainer = query('.Main.ViewerButtonContainer');

		query('.MainViewerButtonOuter').removeClass(
			VC.Utils.Constants.cssClasses.current
		);

		for (var i = 0; i < buttonContainer.length; i++) {
			domStyle.set(buttonContainer[i], 'borderBottomWidth', '1px');
		}

		dojo.addClass(self.domNode, VC.Utils.Constants.cssClasses.current);
	}

	return dojo.setObject(
		'VC.Toolbar.MainButton',
		dojo.declare('MainButton', [VC.UI.mtButton, _TemplatedMixin], {
			id: null,
			name: null,
			isHighlightable: false,
			index: null,
			svgNode: null,

			templateString:
				"<div data-dojo-attach-point='OuterViewerBtnNode' class='MainViewerButtonOuter '>" +
				"<div data-dojo-attach-point='InnerViewerBtnNode' class='Main ViewerButtonContainer'>" +
				"<img data-dojo-attach-point='InnerImgNode' class='Main ViewerButton' style='max-width: 26px; max-height: 26px;'/>" +
				'</div>' +
				'</div>',

			postCreate: function () {
				if (this.placeholder) {
					this.placeholder.placeAt(this.OuterViewerBtnNode);
				}

				on(this.InnerViewerBtnNode, 'click', lang.hitch(this, 'onClick'));

				if (this.src) {
					this.InnerImgNode.src = this.src;
				}

				var imgToSVGConverter = new VC.UI.ImgToSVGConverter();
				imgToSVGConverter.convertImgToSVG(
					this.InnerViewerBtnNode,
					this.onAfterCreateSVG.bind(this)
				);
			},

			deselect: function () {
				dojo.removeClass(this.domNode, VC.Utils.Constants.cssClasses.current);
				this.IsPressed = false;
			},

			onClick: function () {},
			onSelect: function () {},

			select: function (needOpenPlaceholder) {
				if (!this.IsPressed) {
					this.IsPressed = true;
					_expandButton(this);

					if (needOpenPlaceholder && this.placeholder) {
						this.placeholder.show();
					}

					this.onSelect();
				}
			},

			addBottomBorder: function () {
				domStyle.set(this.InnerViewerBtnNode, 'borderBottomWidth', '1px');
			},

			deleteBottomBorder: function () {
				domStyle.set(this.InnerViewerBtnNode, 'borderBottomWidth', '0');
			}
		})
	);
}));
