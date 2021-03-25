dojo.setObject(
	'VC.Interfaces.IButton',
	(function () {
		return dojo.declare('IButton', null, {
			id: null,
			name: null,
			IsDisable: false,
			IsPressed: false,
			placeholder: null,

			onClick: function () {},
			onSelect: function () {},

			enable: function (/*bool*/ flag) {
				throw new Error('IButton: enable must be overloaded');
			},

			select: function () {
				throw new Error('IButton: select must be overloaded');
			},

			deselect: function () {
				throw new Error('IButton: deselect must be overloaded');
			},

			SetPressedState: function () {
				throw new Error('IButton: SetPressedState must be overloaded');
			},

			assignStateTo: function (targetButton) {
				if (targetButton) {
					targetButton.enable(!this.IsDisable);
				}
			}
		});
	})()
);
