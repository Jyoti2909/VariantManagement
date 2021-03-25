dojo.setObject(
	'VC.Interfaces.IColor',
	(function () {
		return dojo.declare('IColor', null, {
			_currentColor: null,
			defaultcolor: null,

			onSelectColor: function () {},

			constructor: function () {
				Object.defineProperty(this, 'color', {
					configurable: true,
					get: function () {
						return this._currentColor;
					},

					set: function (value) {
						throw new Error('IColor: set color must be overloaded');
					}
				});
			},

			assignColorTo: function (targetPalette) {
				if (targetPalette) {
					targetPalette.color = this.color;
				}
			}
		});
	})()
);
