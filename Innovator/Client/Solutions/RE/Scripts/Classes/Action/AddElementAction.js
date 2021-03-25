define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/AddElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
],
function(declare, AddElementAction, Enums) {
	return declare('Aras.Client.Controls.RE.Action.AddElementAction', AddElementAction, {
		Execute: function(/*Object*/args) {
			const contextObject = args.context;
			const direction = args.direction;
			const newElementName = args.elementName;
			let newElement = null;
			const schemaHelper = this._viewmodel.Schema();
			const elementType = schemaHelper.GetSchemaElementType(newElementName);

			if (newElementName != 'External Content' && newElementName != '#text'
			&& (elementType & Enums.XmlSchemaElementType.Table) != Enums.XmlSchemaElementType.Table
			&& ((elementType & Enums.XmlSchemaElementType.Image) != Enums.XmlSchemaElementType.Image) &&
			((elementType & Enums.XmlSchemaElementType.Item) != Enums.XmlSchemaElementType.Item)) {
				newElement = this._viewmodel.CreateElement('element', {type: newElementName});
				if (!newElement) {
					return;
				}

				this._viewmodel.SuspendInvalidation(this._viewmodel.item);
				const isChrome = this.aras.Browser.isCh();

				newElement.origin.setAttribute('isDirty', '1');
				this._addElement(contextObject, newElement, direction);
				if (newElement.origin.firstChild && this._viewmodel.isImmutableElement(newElement.origin.firstChild)) {
					const reqId = newElement.origin.getAttribute('reqId');
					const req = this._viewmodel._getRequirementById(reqId);
					this._viewmodel._updateTitleAndNumberElement(req.node);
				}
				if (isChrome) {
					/* Chrome has bug where no selection.
					It's required to add Text Node for bugfixing in chrome,
					which gens "There is no selection..." exception
					At once appended Text Node to form Selection object,
					then removed one. */
					const textNode = document.createTextNode('');

					this.actionsHelper.editor.editNode.appendChild(textNode);
					this.actionsHelper.editor.focus();
					this.actionsHelper.editor.editNode.removeChild(textNode);
				} else {
					this.actionsHelper.editor.focus();
				}

				this._viewmodel.ResumeInvalidation();
			} else {
				this.inherited(arguments);
			}
		}
	});
});
