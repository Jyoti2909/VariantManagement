define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement'
], function (declare, XmlSchemaElement) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras.ArasListItemXmlSchemaElement',
		XmlSchemaElement,
		{
			_listObject: null,

			constructor: function (args) {
				this.registerType('ArasListItemXmlSchemaElement');
			},

			List: function () {
				this._listObject =
					this._listObject || this._GetAncestorList(this.Parent);
				return this._listObject;
			},

			_GetAncestorList: function (/*WrappedObject*/ wrappedObject) {
				if (wrappedObject) {
					return wrappedObject.is('ArasListXmlSchemaElement')
						? wrappedObject
						: this._GetAncestorList(wrappedObject.Parent);
				}

				return null;
			},

			processNotificationEvent: function (
				/*NotificationFlag*/ notificationMessage
			) {
				this.inherited(arguments);

				if (
					notificationMessage.event ==
					this.NotificationMessageType.VisibilityChanged
				) {
					var parentList = this.List();
					var parentInvalidationRequired = false;
					var parentElement = notificationMessage.sender
						? notificationMessage.sender.Parent
						: null;

					while (parentElement) {
						if (parentElement === parentList) {
							parentInvalidationRequired = true;
							break;
						}
						parentElement = parentElement.Parent;
					}

					if (parentInvalidationRequired) {
						parentList.NotifyChanged();
					}
				}
			},

			registerDocumentElement: function () {
				this.inherited(arguments);
				this.updateParentList();
			},

			unregisterDocumentElement: function () {
				this.inherited(arguments);
				this.updateParentList();
			},

			updateParentList: function () {
				var parentList = this.List();

				if (parentList && !parentList.isRegistering) {
					parentList.NotifyChanged();
				}
			}
		}
	);
});
