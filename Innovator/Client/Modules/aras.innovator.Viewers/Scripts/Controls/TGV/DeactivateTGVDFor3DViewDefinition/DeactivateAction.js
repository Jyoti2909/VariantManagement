define(['dojo/_base/declare'], function (declare) {
	return declare('VC.ThreeDTreeGridView.DeactivateAction', null, {
		constructor: function () {},

		deactivate: function (context) {
			const innovator = aras.newIOMInnovator();
			const defaultTGVDId = '3A6AC1EA2B2C41E98670E837E8858A0B';
			const tgvDefinitionId = context.getProperty('id', '');
			const tgvDefinitionName = context.getProperty('keyed_name', '');
			let body = '<tgvd_id>' + tgvDefinitionId + '</tgvd_id>';
			let fileSelectorTemplateId = innovator.applyMethod(
				'dpn_GetFileSelectorTemplateId',
				body
			);
			fileSelectorTemplateId = fileSelectorTemplateId.getResult();

			if (fileSelectorTemplateId !== '') {
				const isActivatedTGVD = aras.evalMethod('dpn_IsActivatedTGVD', '', {
					fileSelectorTemplateId: fileSelectorTemplateId
				});
				const isDefaultTGVD = tgvDefinitionId === defaultTGVDId;

				if (isDefaultTGVD) {
					const defaultRemovingMessageTemplate = aras.getResource(
						'../Modules/aras.innovator.Viewers',
						'defaultRemovingMessage'
					);
					const defaultRemovingMessage = defaultRemovingMessageTemplate.replace(
						'{0}',
						tgvDefinitionName
					);

					aras.AlertError(defaultRemovingMessage);
					return;
				}

				if (isActivatedTGVD) {
					body =
						'<file_selector_template_id>' +
						fileSelectorTemplateId +
						'</file_selector_template_id>' +
						'<tgvd_id>' +
						tgvDefinitionId +
						'</tgvd_id>';

					const results = innovator.applyMethod(
						'dpn_DeactivateTGVDFor3DVDefinit',
						body
					);

					if (results.isError()) {
						aras.AlertError(results);
					} else {
						const successMessageTemplate = aras.getResource(
							'../Modules/aras.innovator.Viewers',
							'successfulUsageRemovingMessage'
						);
						const successMessage = successMessageTemplate.replace(
							'{0}',
							tgvDefinitionName
						);

						aras.AlertSuccess(successMessage);
					}
				} else {
					const notAssignedMessageTemplate = aras.getResource(
						'../Modules/aras.innovator.Viewers',
						'notAssignedMessage'
					);
					const notAssignedMessage = notAssignedMessageTemplate.replace(
						'{0}',
						tgvDefinitionName
					);

					aras.AlertWarning(notAssignedMessage);
				}
			}
		}
	});
});
