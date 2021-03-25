define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/CopyElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/RemoveElementAction'
], function (declare, ActionBase, CopyElementAction, RemoveElementAction) {
	return declare(
		'Aras.Client.Controls.TechDoc.Action.CutElementAction',
		ActionBase,
		{
			_copyElementAction: null,
			_removeElementAction: null,

			constructor: function (args) {
				this._copyElementAction = new CopyElementAction(args);
				this._removeElementAction = new RemoveElementAction(args);
			},

			Execute: function (/*Object*/ args) {
				var selectedItems = args.selectedItems;
				var isCheckRequired = Boolean(args.checkAccess);
				var executionAllowed = true;

				if (isCheckRequired) {
					var availableActions = this.actionsHelper.GetActionsMenuModel(
						selectedItems
					);
					var viewAction;
					var i;

					executionAllowed = false;

					for (i = 0; i < availableActions.length; i++) {
						viewAction = availableActions[i];

						if (viewAction.id == 'cutelement') {
							executionAllowed = true;
							break;
						}
					}
				}

				if (executionAllowed) {
					this.actionsHelper.executeAction('copyelement', args);
					this.actionsHelper.executeAction('removeelement', {
						selectedItems: selectedItems
					});
				}
			}
		}
	);
});
