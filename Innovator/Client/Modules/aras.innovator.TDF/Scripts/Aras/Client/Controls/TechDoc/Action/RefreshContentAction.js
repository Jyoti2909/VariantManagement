define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, ActionBase, Enums) {
	return declare(ActionBase, {
		Execute: function (executionArguments) {
			const contentGenerationHelper = this._viewmodel.ContentGeneration();
			const targetElement = executionArguments.selectedElement;

			contentGenerationHelper.refreshStaticContent(targetElement);

			this.OnExecuted(targetElement);
		},

		Validate: function (executionArguments) {
			const targetElement = executionArguments.selectedElement;

			return Boolean(
				targetElement &&
					targetElement.ContentType() === Enums.ElementContentType.Static
			);
		}
	});
});
