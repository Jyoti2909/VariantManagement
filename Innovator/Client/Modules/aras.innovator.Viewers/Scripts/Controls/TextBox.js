require([
	'dojo/_base/fx',
	'dojo/_base/lang',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dijit/form/TextBox',
	'dojo/keys',
	'dojo/dom-style',
	'dojo/on'
], dojo.hitch(this, function (
	baseFx,
	lang,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	TextBox,
	keys,
	domStyle,
	on
) {
	return dojo.setObject(
		'VC.Widgets.TextBox',
		dojo.declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			labelBefore: null,
			labelAfter: null,
			styleClassArray: null,
			size: 80,
			isTextChanged: null,

			templateString:
				'<span>' +
				"<label data-dojo-attach-point='LabelBefore' class='RightMargin'></label>" +
				"<input data-dojo-type='dijit/form/TextBox' data-dojo-attach-point='Text'/>" +
				"<label data-dojo-attach-point='LabelAfter' class='LeftMargin'></label>" +
				'</span>',
			widgetsInTemplate: true,

			constructor: function (
				labelBefore,
				labelAfter,
				size,
				styleClassArray,
				maxValue
			) {
				this.id = 'TextBox' + VC.Utils.getTimestampString();

				if (labelBefore) {
					this.labelBefore = labelBefore;
				}

				if (labelAfter) {
					this.labelAfter = labelAfter;
				}

				if (styleClassArray) {
					this.styleClassArray = styleClassArray;
				}

				if (size) {
					this.size = size;
				}

				this.isTextChanged = false;
			},

			postCreate: function () {
				for (var styleClass in this.styleClassArray) {
					dojo.addClass(this.domNode, this.styleClassArray[styleClass]);
				}

				if (this.labelBefore !== null) {
					this.LabelBefore.innerHTML = this.labelBefore;
				}

				if (this.labelAfter !== null) {
					this.LabelAfter.innerHTML = this.labelAfter;
				}

				domStyle.set(this.Text.domNode, 'width', this.size + 'px');
				on(
					this.Text.domNode,
					'keydown',
					dojo.hitch(this, function (e) {
						this._changeText(e);
					})
				);
			},

			changeText: function () {},

			_changeText: function (e) {
				var charOrCode = e.charCode || e.keyCode;

				if (charOrCode === keys.ENTER) {
					this.changeText();
					this.isTextChanged = false;
				} else {
					this.isTextChanged = true;
				}
			}
		})
	);
}));
