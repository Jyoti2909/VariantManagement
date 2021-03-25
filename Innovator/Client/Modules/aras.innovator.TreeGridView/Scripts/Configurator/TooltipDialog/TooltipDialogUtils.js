define(['dojo/_base/declare', './TooltipDialog'], function (
	declare,
	TooltipDialog
) {
	var tooltipDialog;
	return declare(
		'TreeGridView.Configurator.TooltipDialog.TooltipDialogUtils',
		null,
		{
			aras: null,
			topWindow: null,
			tooltipDialog: null,
			resourceCache: null,

			constructor: function (args) {
				this.aras = args.aras;
				this.topWindow = this.aras.getMostTopWindowWithAras(window);
				if (!tooltipDialog) {
					tooltipDialog = new TooltipDialog({ aras: this.aras });
				}
			},

			getCurrentTooltipDialog: function () {
				return this.topWindow.currentRbTooltipDialog;
			},

			showTooltipDialog: function (
				targetItemNode,
				tooltipDialogArguments,
				optionalParameters
			) {
				optionalParameters = optionalParameters || {};

				var formNode = this._getFormNode(
					targetItemNode,
					optionalParameters.formType,
					optionalParameters.formId
				);
				var height = this.aras.getItemProperty(formNode, 'height');
				var width = this.aras.getItemProperty(formNode, 'width');
				var itemTypeNd = this.aras.getItemTypeDictionary(
					targetItemNode.getAttribute('type')
				).node;
				var request;

				this.aras.uiPopulatePropertiesOnWindow(
					window,
					targetItemNode,
					itemTypeNd,
					formNode,
					true
				);
				request = this.aras.uiDrawFormEx(
					formNode,
					optionalParameters.formType || 'add',
					itemTypeNd
				);
				this.topWindow.currentRbTooltipDialog = tooltipDialog;
				tooltipDialog.showDialog(
					tooltipDialogArguments,
					request,
					optionalParameters.callbacks,
					height,
					width
				);
			},

			_getFormNode: function (targetItemNode, formType, formIdPar) {
				if (targetItemNode) {
					var formId =
						formIdPar ||
						this.aras.uiGetFormID4ItemEx(targetItemNode, formType || 'add');

					if (formId) {
						// get corresponded form
						var formDisplay = this.aras.getFormForDisplay(formId);
						return formDisplay && formDisplay.node;
					}
				}
			}
		}
	);
});
