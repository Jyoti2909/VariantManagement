require([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom-construct',
	'dijit/_WidgetBase',
	'dijit/_PaletteMixin',
	'dojo/_base/Color',
	'dojo/dom-style',
	'dojo/dom-attr',
	'dojo/on',
	'dijit/focus'
], function (
	declare,
	lang,
	domConstruct,
	_WidgetBase,
	_PaletteMixin,
	Color,
	style,
	domAttr,
	on,
	focus
) {
	return dojo.setObject(
		'VC.Widgets.ColorPallete',
		dojo.declare([_WidgetBase, _PaletteMixin], {
			cellClass: 'ColorSmallButton',
			colors: null,
			defaultcolor: null,

			constructor: function (colors) {
				this.colors = colors;
			},

			dyeClass: declare(null, {
				constructor: function (button, row, col) {
					this.color = button.color;
					this.title = button.title;
				},

				getValue: function () {
					return this.color;
				},

				fillCell: function (cell, blankGif) {
					var colorButton = domConstruct.toDom('<span></span>');
					var colorOuterButton = domConstruct.toDom(
						"<span class='Outer'></span>"
					);
					style.set(colorButton, 'backgroundColor', this.color);
					domAttr.set(colorButton, 'title', this.title);

					domConstruct.place(colorButton, colorOuterButton);
					domConstruct.place(colorOuterButton, cell);

					cell.removeAttribute('title');
				}
			}),

			buildRendering: function () {
				var table = domConstruct.create('table');
				domAttr.set(table, 'cellpadding', '0');
				domAttr.set(table, 'cellspacing', '0');
				dojo.addClass(table, 'ColorPallete');

				this.domNode = this.gridNode = table;
			},

			postCreate: function () {
				this._preparePalette(this.colors, []);

				this.inherited(arguments);

				this.onChange = dojo.hitch(this, this._selectColor);
			},

			selectColor: function () {},

			setColor: function (color) {
				var cell = this._findCell(color);

				if (cell === null) {
					cell = this._cells[0];
				}

				var defaultNode = cell.node;
				var defaultColor = cell.dye.color;

				this._setCurrent(defaultNode);
				focus.focus(defaultNode);
				this._setValueAttr(defaultColor, true);
			},

			_selectColor: function () {
				this.selectColor(arguments);
			},

			_findCell: function (color) {
				var cell = null;

				for (var i = 0; i < this._cells.length; i++) {
					if (this._cells[i].dye.color == color) {
						cell = this._cells[i];
						break;
					}
				}

				return cell;
			}
		})
	);
});
