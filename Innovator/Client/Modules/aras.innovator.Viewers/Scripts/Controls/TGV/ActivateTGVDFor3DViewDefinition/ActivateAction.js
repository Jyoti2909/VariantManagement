define(['dojo/_base/declare'], function (declare) {
	return declare('VC.ThreeDTreeGridView.ActivateAction', null, {
		constructor: function () {},

		activate: function (context) {
			const innovator = aras.newIOMInnovator();
			const itemTypeName = 'CAD';
			const tgvDefinitionId = context.getProperty('id', '');
			const tgvDefinitionName = context.getProperty('keyed_name', '');
			const getIdParameters = '<tgvd_id>' + tgvDefinitionId + '</tgvd_id>';
			const fileSelectorTemplateIdMethodResult = innovator.applyMethod(
				'dpn_GetFileSelectorTemplateId',
				getIdParameters
			);
			const fileSelectorTemplateId = fileSelectorTemplateIdMethodResult.getResult();

			if (fileSelectorTemplateId !== '') {
				const isActivatedTGVD = aras.evalMethod('dpn_IsActivatedTGVD', '', {
					fileSelectorTemplateId: fileSelectorTemplateId
				});

				if (isActivatedTGVD) {
					const alreadyAssignedMessageTemplate = aras.getResource(
						'../Modules/aras.innovator.Viewers',
						'alreadyAssignedMessage'
					);
					const alreadyAssignedMessage = alreadyAssignedMessageTemplate
						.replace('{0}', tgvDefinitionName)
						.replace('{1}', itemTypeName);

					aras.AlertWarning(alreadyAssignedMessage);
					return;
				}

				const activateParameters =
					'<file_selector_template_id>' +
					fileSelectorTemplateId +
					'</file_selector_template_id>' +
					'<tgvd_id>' +
					tgvDefinitionId +
					'</tgvd_id>';
				const results = innovator.applyMethod(
					'dpn_ActivateTGVDFor3DViewDefinit',
					activateParameters
				);

				if (results.isError()) {
					aras.AlertError(results);
				} else {
					const successMessageTemplate = aras.getResource(
						'../Modules/aras.innovator.Viewers',
						'successfulAssignmentMessage'
					);
					const successMessage = successMessageTemplate
						.replace('{0}', tgvDefinitionName)
						.replace('{1}', itemTypeName);

					aras.AlertSuccess(successMessage);
				}
			}
		}
	});
});
