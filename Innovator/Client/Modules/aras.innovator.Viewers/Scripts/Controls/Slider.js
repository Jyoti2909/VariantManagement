require([
	'dojo/_base/declare',
	'dijit/form/HorizontalSlider',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/on'
], dojo.hitch(this, function (
	declare,
	HorizontalSlider,
	_WidgetsInTemplateMixin,
	on
) {
	return dojo.setObject(
		'VC.Widgets.Slider',
		declare([HorizontalSlider, _WidgetsInTemplateMixin], {
			style: 'width: 150px;',
			showButtons: false,
			minimum: 0,
			maximum: 100,
			discreteValues: 101,
			intermediateChanges: true,
			styleClassArray: null,

			constructor: function (styleClassArray) {
				this.id = 'Slider' + VC.Utils.getTimestampString();

				if (styleClassArray) {
					this.styleClassArray = styleClassArray;
				}

				Object.defineProperty(this, 'width', {
					set: function (value) {
						this.domNode.style.width = value + 'px';
					}
				});
			},

			postCreate: function () {
				this.inherited(arguments);

				for (var styleClass in this.styleClassArray) {
					dojo.addClass(this.domNode, this.styleClassArray[styleClass]);
				}

				on(this, 'change', dojo.hitch(this, this._changePosition));
			},

			changePosition: function () {},

			_changePosition: function () {
				this.changePosition();
			}
		})
	);
}));
