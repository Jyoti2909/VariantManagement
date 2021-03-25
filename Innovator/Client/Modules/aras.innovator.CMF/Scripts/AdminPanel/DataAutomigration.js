/* global define */
define(['dojo/_base/declare'], function (declare) {
	return declare('DataAutomigration', [], {
		constructor: function () {},

		// copy from ConvertElementToProperties method
		convertElementToProperty: function (element) {
			var warningText = aras.getResource(
				'../Modules/aras.innovator.CMF/',
				'cmf_automigration_dataloss_warning'
			);
			if (!aras.confirm(warningText)) {
				return false;
			}

			var innovator = aras.newIOMInnovator();

			var itemCopy = innovator.newItem('cmf_ContentType', '');
			itemCopy.setID(item.getAttribute('id'));
			itemCopy.setAttribute('method_action', 'ConvertElementToProperties');
			itemCopy.setProperty('element_id', element.id);

			var response = itemCopy.apply('cmf_SchemaDefinitionHandler');
			if (response.isError()) {
				aras.AlertError(response);
				return false;
			}
			return true;
		},

		// copy from cmf_ConvertPropertyToElement method
		convertToElementType: function (property) {
			var innovator = aras.newIOMInnovator();
			var itemCopy = innovator.newItem('cmf_ContentType', '');
			itemCopy.setID(item.getAttribute('id'));
			itemCopy.setAttribute('method_action', 'ConvertPropertyToElement');
			itemCopy.setProperty('property_id', property.id);
			itemCopy.setProperty('element_id', property.elementTypeId);

			var response = itemCopy.apply('cmf_SchemaDefinitionHandler');
			if (response.isError()) {
				aras.AlertError(response);
				return false;
			}
			return true;
		},

		// copy from cmf_ChangeParentElement method
		changeParent: function (property) {
			var warningText = aras.getResource(
				'../Modules/aras.innovator.CMF/',
				'cmf_automigration_dataloss_warning'
			);
			if (!aras.confirm(warningText)) {
				return false;
			}
			var params = {};
			params.aras = aras;
			params.itemtypeName = 'cmf_ElementType';
			params.multiselect = false;
			params.propertyId = property.id;
			params.elementId = property.elementTypeId;
			params.type = 'SearchDialog';
			params.contentTypeId = item.getAttribute('id');

			return window.ArasModules.MaximazableDialog.show(
				'iframe',
				params
			).promise.then(function (dlgRes) {
				if (!dlgRes) {
					return false;
				}
				return changeParentElement(dlgRes, params);
			});

			function changeParentElement(res, params) {
				var innovator = aras.newIOMInnovator();
				var itemCopy = innovator.newItem('cmf_ContentType', '');
				itemCopy.setID(params.contentTypeId);
				itemCopy.setAttribute('method_action', 'ChangePropertyParent');
				itemCopy.setProperty('property_id', params.propertyId);
				itemCopy.setProperty('old_parent', params.elementId);
				itemCopy.setProperty('new_parent', res.itemID);

				var response = itemCopy.apply('cmf_SchemaDefinitionHandler');
				if (response.isError()) {
					aras.AlertError(response);
					return false;
				}

				return true;
			}
		}
	});
});
