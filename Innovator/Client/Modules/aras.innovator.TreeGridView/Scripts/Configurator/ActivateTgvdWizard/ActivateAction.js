define(['dojo/_base/declare', './TgvWizard'], function (declare, TgvWizard) {
	return declare(
		'TreeGridView.Configurator.TooltipDialog.ActivateTgvdWizard.ActivateAction',
		[],
		{
			constructor: function () {},

			activate: function (thisMethod) {
				if (thisMethod.node.getAttribute('action') === 'add') {
					return aras.AlertError(
						aras.getResource(
							'../Modules/aras.innovator.TreeGridView',
							'tgvd_usage_error'
						)
					);
				}
				new TgvWizard(thisMethod);
			}
		}
	);
});
