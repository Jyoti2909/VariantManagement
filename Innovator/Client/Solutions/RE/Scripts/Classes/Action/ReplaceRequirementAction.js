define([
	'dojo/_base/declare',
	'RE/Scripts/Classes/Action/BaseRequirementAction'
],
function(declare, BaseRequirementAction) {
	return declare('Aras.Client.Controls.RM.Action.ReplaceRequirementAction', BaseRequirementAction, {

		constructor: function(args) {
		},

		Execute: function(args) {
			this._viewmodel.SuspendInvalidation();
			var selectedItem = args.selectedItem;

			this._updateDocumentExternalReferences(args.content);
			this._copyChapterNumber(selectedItem.origin, args.content);

			var wrappedObject = this._viewmodel.CreateElement('element', {origin: args.content});
			var childList = selectedItem.Parent.ChildItems();
			var index = childList.index(selectedItem);
			childList.splice(index, 1);
			childList.insertAt(index, wrappedObject);
			this._viewmodel.focusElement(wrappedObject, true);
			this._viewmodel.ResumeInvalidation();
		},

		_copyChapterNumber: function(sourceNode, targetNode) {
			const chapterNodeSelector = '*[local-name()="Requirement-Info"]/*[local-name()="Requirement-Chapter"]';
			const sourceChapterNode = sourceNode.selectSingleNode(chapterNodeSelector);
			const sourceNumberNode = sourceChapterNode && sourceChapterNode.firstChild;
			const targetChapterNode = targetNode.selectSingleNode(chapterNodeSelector);

			if (sourceNumberNode && targetChapterNode) {
				const copiedNumberNode = targetChapterNode.ownerDocument.importNode(sourceNumberNode, true);

				if (targetChapterNode.firstChild) {
					targetChapterNode.removeChild(targetChapterNode.firstChild);
				}

				targetChapterNode.appendChild(copiedNumberNode);
			}
		}
	});
});
