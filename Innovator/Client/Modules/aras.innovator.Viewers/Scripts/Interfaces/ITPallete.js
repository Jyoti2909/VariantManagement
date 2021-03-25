dojo.setObject(
	'VC.Interfaces.ITPallete',
	(function () {
		return dojo.declare('ITPallete', null, {
			show: function () {
				throw new Error('ITPallete: show must be overloaded');
			},

			hide: function () {
				throw new Error('ITPallete: hide must be overloaded');
			}
		});
	})()
);
