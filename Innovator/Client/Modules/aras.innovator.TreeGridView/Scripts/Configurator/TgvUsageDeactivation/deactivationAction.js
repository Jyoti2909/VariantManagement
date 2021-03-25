define(['dojo/_base/declare'], function (declare) {
	return declare(
		'TreeGridView.Configurator.TgvUsageDeactivation.deactivationAction',
		[],
		{
			deactivate: function (tgvItem) {
				ArasModules.Dialog.show('iframe', {
					title: aras.getResource(
						'../Modules/aras.innovator.TreeGridView',
						'title_deactivate_dialog'
					),
					tgvNode: tgvItem.node,
					aras: aras,
					dialogWidth: 450,
					dialogHeight: 380,
					content:
						'../Modules/aras.innovator.TreeGridView/Scripts/Configurator/TgvUsageDeactivation/deactivationForm.html'
				});
			}
		}
	);
});
