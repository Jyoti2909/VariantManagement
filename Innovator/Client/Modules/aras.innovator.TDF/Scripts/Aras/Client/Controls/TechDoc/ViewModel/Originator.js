define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.TechDoc.ViewModel.Originator', null, {
		constructor: function (args) {},

		CreateMemento: function (/*Object*/ args) {
			throw new Error('Override CreateMemento method');
		},

		SetMemento: function (/*Object*/ args) {
			throw new Error('Override SetMemento method');
		}
	});
});
