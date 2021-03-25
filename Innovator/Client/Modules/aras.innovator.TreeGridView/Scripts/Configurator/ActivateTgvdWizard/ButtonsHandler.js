define(['dojo/_base/declare', './GenerateLogic'], function (
	declare,
	GenerateLogic
) {
	return declare(
		'TreeGridView.Configurator.TooltipDialog.ActivateTgvdWizard.ButtonsHandler',
		[],
		{
			constructor: function () {},

			onClick: function (isNext) {
				parent.wizard.setFormWindow(window);
				if (parent.wizard.isFormWithBtnGenerate() && isNext) {
					var generateLogic = new GenerateLogic(
						parent.wizard.getWizardItem(),
						parent.wizard.getThisMethodItem()
					);
					if (
						!generateLogic.generate(parent.wizard.getStartConditionsArray())
					) {
						return;
					}
				}
				parent.wizard.show(isNext);
			},

			isCreateUsingJavaScript: function () {
				return (
					parent.wizard
						.getWizardItem()
						.getProperty('target_usage', '')
						.toLowerCase() === 'JavaScript Method'.toLowerCase()
				);
			}
		}
	);
});
