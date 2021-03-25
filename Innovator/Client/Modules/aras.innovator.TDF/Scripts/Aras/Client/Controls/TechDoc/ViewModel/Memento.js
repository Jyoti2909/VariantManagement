define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.TechDoc.ViewModel.Memento', null, {
		_state: null,

		constructor: function (args) {
			this._state = args.state;
		},

		GetState: function () {
			return this._state;
		}
	});
});
