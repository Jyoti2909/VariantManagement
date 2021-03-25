define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, ActionBase, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.Action.ShowDocumentViewDialogAction',
		ActionBase,
		{
			documentViewDisabledList: {},

			Execute: function (documentViewSettings) {
				var optionalContent = this._viewmodel.OptionalContent();
				var param = {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.documentview'
					),
					formId: 'A2B85A1A84944C1683058AF2DB55EC0D', // tp_DocumentView Form
					aras: this.aras,
					documentViewSettings: documentViewSettings || {},
					isEditMode: true,
					optionFamilies: optionalContent.OptionFamilies(),
					rootOptionFamilies: optionalContent.RootOptionFamilies(),
					usedOptionFamilies: optionalContent.UsedOptionFamilies(),
					dialogWidth: 430,
					dialogHeight: 600,
					content: 'ShowFormAsADialog.html'
				};

				this.actionsHelper.topWindow.ArasModules.Dialog.show(
					'iframe',
					param
				).promise.then(
					function (result) {
						if (result) {
							this.documentView = null;

							documentViewSettings.raiseEvent(
								'onSettingsChanged',
								documentViewSettings
							);
						}
					}.bind(this)
				);
			},

			filterEnable: function () {
				var filter = toolbar.getItem('tp_filtering');
				var optionalContent = this._viewmodel.OptionalContent();
				if (filter.getEnabled()) {
					if (!this.documentView) {
						this.documentView = optionalContent.DocumentView();
						optionalContent.DocumentView({});
					} else {
						optionalContent.DocumentView(this.documentView);
						this.documentView = null;
					}
					optionalContent.DisplayPreference(
						optionalContent.DisplayPreference()
					);
				}
			}
		}
	);
});
