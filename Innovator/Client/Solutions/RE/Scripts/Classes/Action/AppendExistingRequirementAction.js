define([
	'dojo/_base/declare',
	'RE/Scripts/Classes/Action/BaseRequirementAction'
],
function(declare, BaseRequirementAction) {
	return declare('Aras.Client.Controls.RM.Action.AppendExistingRequirementAction', BaseRequirementAction, {
		Execute: function(args) {
			this._viewmodel.SuspendInvalidation();

			var selectedItem = this._viewmodel._getClassifiedParentElement(args.selectedItem);
			if (!args.isNew) {
				this._updateDocumentExternalReferences(args.content);
			}
			var wrappedObject = this._viewmodel.CreateElement('element', {origin: args.content});
			wrappedObject.origin.setAttribute('isDirty', '1');
			var childList;

			if (selectedItem) {
				childList = selectedItem.Parent.ChildItems();
				childList.insertAt(childList.index(selectedItem) + 1, wrappedObject);
			} else {
				childList = this._viewmodel.Dom().ChildItems();
				childList.add(wrappedObject);
			}

			this._viewmodel.focusElement(wrappedObject, true);
			this._viewmodel.ResumeInvalidation();
		}
	});
});
