define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.TechDoc.ViewModel.Typeable', null, {
		_registeredTypes: null,

		constructor: function (args) {
			this._registeredTypes = {};
		},

		registerType: function (typeName) {
			this._registeredTypes[typeName] = true;
		},

		is: function (typeName) {
			return Boolean(this._registeredTypes[typeName]);
		},

		getTypes: function () {
			return Object.keys(this._registeredTypes);
		}
	});
});
