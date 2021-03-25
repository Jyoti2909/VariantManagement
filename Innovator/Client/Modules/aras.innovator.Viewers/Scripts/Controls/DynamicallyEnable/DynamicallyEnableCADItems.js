define(['dojo/_base/declare'], function (declare) {
	return declare('VC.DynamicallyEnableCADItems', null, {
		constructor: function () {},

		executeAction: function (context) {
			const innovator = aras.newIOMInnovator();
			const cadItemTypeName = 'CAD';
			const manualVersioningPropertyName = 'manual_versioning';
			const nativeFilePropertyName = 'native_file';
			const cadId = context.getID();

			let cadItemType = innovator.newItem('ItemType', 'get');
			cadItemType.setAttribute('select', manualVersioningPropertyName);
			cadItemType.setProperty('name', cadItemTypeName);
			cadItemType = cadItemType.apply();

			if (!cadItemType.isError()) {
				const versioning = cadItemType.getProperty(
					manualVersioningPropertyName
				);
				if (versioning == 1) {
					let cadItem = innovator.newItem(cadItemTypeName, 'get');
					cadItem.setID(cadId);
					cadItem.setAttribute('select', nativeFilePropertyName);
					cadItem = cadItem.apply();
					if (!cadItem.isError()) {
						const parameter =
							'<file_id>' +
							cadItem.getProperty(nativeFilePropertyName) +
							'</file_id>';
						const results = innovator.applyMethod(
							'CreateCADtoDynamicEnabledTask',
							parameter
						);
						if (results.isError()) {
							aras.AlertError(results);
						}
					}
				} else {
					const warningText = aras.getResource(
						'../Modules/aras.innovator.Viewers/',
						'dynamicallyEnableWarning'
					);
					aras.AlertWarning(warningText);
				}
			}
		}
	});
});
