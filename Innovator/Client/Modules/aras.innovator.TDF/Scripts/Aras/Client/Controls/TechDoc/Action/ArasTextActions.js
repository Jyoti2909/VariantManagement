define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, ActionBase, Enums) {
	return declare(ActionBase, {
		Execute: function (executionArguments) {
			const cursor = this._viewmodel.Cursor();
			const ancesstorItem = cursor.commonAncestor;

			if (ancesstorItem && ancesstorItem.is('ArasTextXmlSchemaElement')) {
				const isEmphesExist = ancesstorItem.IsHasEmphes();
				const action = executionArguments.actionName;

				switch (action) {
					case 'addlink':
					case 'changelink':
					case 'testlink':
						if (isEmphesExist) {
							const textSelection = ancesstorItem.selection;
							const isSingleEmphSelected =
								textSelection.From().id === textSelection.To().id;

							if (isSingleEmphSelected) {
								const isViewOnly = action === 'testlink';
								this._showLinkEditorDialog(ancesstorItem, isViewOnly);
							}
						}
						break;
					case 'deletelink':
						if (isEmphesExist) {
							ancesstorItem.DeleteLink();
						}
						break;
					default:
						// "bold", "italic", "strike", "sub", "sup", "under"
						ancesstorItem.SetStyleForRange(action);
						break;
				}

				this.OnExecuted(action, ancesstorItem);
			}
		},

		_showLinkEditorDialog: function (textElement, isViewOnly) {
			const emphId = textElement.selection.From().id;
			const emph = textElement.GetEmphObjectById(emphId);
			const linkData = emph.Link();
			const topWindow = this.actionsHelper.topWindow;

			if (linkData.type === Enums.LinkTypes.Url && isViewOnly) {
				// if it is "url link" in "view" mode, then just show link target in new window
				topWindow.open(linkData.url);
			} else {
				// in all other cases user will see linkDialog
				const viewModel = this._viewmodel;
				const linkUrl = '../../Modules/aras.innovator.TDF/LinkEditorDialog';
				const dialogArguments = {
					aras: this.aras,
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.linkeditordialog'
					),
					thisItem: viewModel.getDocumentItem(),
					linkData: emph.Link(),
					lang: viewModel.CurrentLanguageCode(),
					dialogHeight: topWindow.innerHeight * 0.95,
					dialogWidth: topWindow.innerWidth * 0.85,
					tdfSettings: {
						contentBuilderMethod: viewModel.getDataRequestSetting(
							'contentBuilderMethod'
						)
					},
					elementsSearchList: !isViewOnly
						? this._getLinkSearchElementList().slice()
						: undefined,
					content: linkUrl + (isViewOnly ? '?viewonly=true' : '')
				};

				return topWindow.ArasModules.Dialog.show(
					'iframe',
					dialogArguments
				).promise.then(this._handleLinkEditorResult.bind(this, textElement));
			}
		},

		_handleLinkEditorResult: function (textElement, result) {
			if (!result) {
				return;
			}

			const linkType = result.linkType;
			const linkData = result.linkData;

			switch (linkType) {
				case 'external_document':
					if (linkData.elementId && linkData.blockId) {
						const currentDocumentId = this._viewmodel.getDocumentProperty('id');

						textElement.LinkingText({
							type:
								linkData.blockId === currentDocumentId
									? Enums.LinkTypes.InternalElement
									: Enums.LinkTypes.ExternalDocument,
							blockId: linkData.blockId,
							elementId: linkData.elementId,
							set: true
						});
					}
					break;
				case 'url':
					if (linkData.url) {
						textElement.LinkingText({
							type: Enums.LinkTypes.Url,
							url: linkData.url,
							set: true
						});
					}
					break;
				case 'deleteLink':
					textElement.DeleteLink();
					break;
			}
		},

		_getLinkSearchElementList: function () {
			if (!this._linkSearchElementList) {
				this._linkSearchElementList =
					this._viewmodel.Schema().GetExpectedElements(this._viewmodel.Dom())
						.insert || [];
			}

			return this._linkSearchElementList;
		}
	});
});
