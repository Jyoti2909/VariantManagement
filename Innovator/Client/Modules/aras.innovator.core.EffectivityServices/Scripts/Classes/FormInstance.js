/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define([
	'dojo/_base/declare',
	'Aras/Client/Controls/Experimental/FormInstance'
], function (declare, FormInstance) {
	return declare(
		'Aras.Client.Controls.EffectivityExpression.FormInstance',
		[FormInstance],
		{
			showItemInFrame: function () {
				var args = this.args;
				var arasObj = args.aras;
				var isNew = args.isNew;
				var item = args.item;
				var isEditMode = args.isEditMode;
				var url = args.url;

				var formFrame = document.createElement('iframe');
				formFrame.setAttribute('id', 'instance');
				formFrame.setAttribute('frameborder', '0');
				formFrame.setAttribute('width', '100%');
				formFrame.setAttribute('height', '100%');
				this.domNode.appendChild(formFrame);

				var formType = isNew ? 'add' : isEditMode ? 'edit' : 'view';
				var formNode = arasObj.uiGetForm4ItemEx(item, formType);

				this._setPropertyTypeIdNode(formNode, 'definition');
				this._setPropertyTypeIdNode(formNode, 'effs_scope_id');

				if (isNew) {
					arasObj.uiShowItemInFrameEx(
						formFrame.contentWindow,
						item,
						formType,
						0,
						formNode
					);
				} else {
					arasObj.uiShowItemInFrameEx(
						formFrame.contentWindow,
						item,
						formType,
						0,
						formNode
					);
				}

				var that = this;

				formFrame.onload = function () {
					that.onloaded();
					window.returnBlockerHelper.attachBlocker(formFrame.contentWindow);
				};
			},

			_setPropertyTypeIdNode: function (formNode, propertyName) {
				var itemTypeProperty = itemType.selectSingleNode(
					'Relationships/Item[name="' + propertyName + '"]'
				);
				if (itemTypeProperty) {
					var formField = formNode.selectSingleNode(
						'Relationships/Item/Relationships/Item[name="' + propertyName + '"]'
					);
					if (formField) {
						var propertyTypeId = itemTypeProperty.getAttribute('id');

						var oldPropertyTypeIdNode = formField.selectSingleNode(
							'propertytype_id'
						);
						ArasModules.xml.setText(oldPropertyTypeIdNode, propertyTypeId);
					}
				}
			}
		}
	);
});
