define([
	'dojo/_base/declare',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable'
], function (declare, Eventable) {
	return declare('Aras.Client.Controls.TechDoc.Action.ActionBase', Eventable, {
		aras: null,
		actionsHelper: null,
		_viewmodel: null,

		constructor: function (args) {
			this.actionsHelper = args.actionsHelper;
			this._viewmodel = this.actionsHelper.viewmodel;
			this.aras = this.actionsHelper.aras;
		},

		Execute: function (/*Object*/ args) {
			this.OnExecuted();
		},

		OnExecuted: function () {
			const eventOutArguments = ['Executed', this].concat(
				Array.from(arguments)
			);
			this.raiseEvent.apply(this, eventOutArguments);
		},

		Validate: function (/*Object*/ args) {
			return true;
		}
	});
});
