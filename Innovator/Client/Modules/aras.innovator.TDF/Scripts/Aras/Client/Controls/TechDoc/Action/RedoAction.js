define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(ActionBase, {
		Execute: function () {
			this._viewmodel.QueueChanges().Redo();

			this.OnExecuted();
		}
	});
});
