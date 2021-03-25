dojo.setObject(
	'VC.Interfaces.ISize',
	(function () {
		return dojo.declare('ISize', null, {
			_currentSize: null,
			defaultsize: null,
			sizes: {
				small: 'small',
				medium: 'medium',
				large: 'large'
			},

			constructor: function () {
				Object.defineProperty(this, 'size', {
					configurable: true,
					get: function () {
						return this._currentSize;
					},

					set: function (value) {
						throw new Error('ISize: set size must be overloaded');
					}
				});
			},

			assignSizeTo: function (targetPalette) {
				if (targetPalette) {
					targetPalette.size = this.size;
				}
			}
		});
	})()
);
