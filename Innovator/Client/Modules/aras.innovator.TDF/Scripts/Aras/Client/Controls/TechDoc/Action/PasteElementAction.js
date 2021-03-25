define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(
		'Aras.Client.Controls.TechDoc.Action.PasteElementAction',
		ActionBase,
		{
			constructor: function (args) {},

			Execute: function (/*Object*/ args) {
				var selectedItem = args.selectedItem;
				var clipboard = args.clipboard;
				var clipboardData = clipboard.getData('StructureXml');
				var action = args.action;
				var parent = selectedItem.Parent;
				var newElements = [];
				var externalProvider = this._viewmodel.OriginExternalProvider();
				var wrappedObjectFromClipboard;
				var clonedWrappedObject;
				var elementNode;
				var childList;
				var insertPosition;
				var i;

				externalProvider.Update(clipboardData.references._rootNode);
				for (i = 0; i < clipboardData.content.length; i++) {
					elementNode = clipboardData.content[i];

					wrappedObjectFromClipboard = this._viewmodel.CreateElement(
						'element',
						{ origin: elementNode }
					);
					clonedWrappedObject = wrappedObjectFromClipboard.Clone();

					newElements.push(clonedWrappedObject);
				}

				switch (action) {
					case 'into':
						childList = selectedItem.ChildItems();
						insertPosition = 0;
						break;
					case 'before':
						childList = parent.ChildItems();
						insertPosition = childList.index(selectedItem);
						break;
					case 'after':
						childList = parent.ChildItems();
						insertPosition = childList.index(selectedItem) + 1;
						break;
				}

				for (i = 0; i < newElements.length; i++) {
					childList.insertAt(insertPosition, newElements[i]);
					insertPosition++;
				}
			},

			Validate: function (/*Object*/ args) {
				var clipboard = args.clipboard;
				var clipboardData = clipboard.getData('StructureXml');
				var validationResult = {};

				if (clipboardData) {
					var selectedItem = args.selectedItem;
					var xmlSchemaHelper = this._viewmodel.Schema();
					var actions = Array.isArray(args.actions)
						? args.actions
						: [args.actions];
					var parent = selectedItem.Parent;
					var isValid = false;
					var newElements = [];
					var externalProvider = this._viewmodel.OriginExternalProvider();
					var currentAction;
					var actionName;
					var checkResult;
					var i;

					externalProvider.SetAlternativeReferences(clipboardData.references);

					for (i = 0; i < clipboardData.content.length; i++) {
						elementNode = clipboardData.content[i];

						wrappedObjectFromClipboard = this._viewmodel.CreateElement(
							'element',
							{ origin: elementNode }
						);
						clonedWrappedObject = wrappedObjectFromClipboard.Clone();

						newElements.push(clonedWrappedObject);
					}

					for (i = 0; i < actions.length; i++) {
						currentAction = actions[i];
						actionName = currentAction.value || currentAction;
						isValid = false;

						switch (actionName) {
							case 'into':
								var isExternalBlock =
									selectedItem.is('ArasBlockXmlSchemaElement') &&
									selectedItem.isExternal();

								if (!isExternalBlock) {
									checkResult = xmlSchemaHelper.TryCandidatesAt({
										context: selectedItem,
										values: newElements,
										mode: actionName
									});
									isValid = checkResult.isValid;
								}
								break;
							case 'before':
							case 'after':
								if (parent) {
									checkResult = xmlSchemaHelper.TryCandidatesAt({
										context: selectedItem,
										values: newElements,
										mode: actionName
									});
									isValid = checkResult.isValid;
								}
								break;
						}

						validationResult[actionName] = isValid;
					}

					externalProvider.ClearAlternativeReferences();
				}

				return validationResult;
			}
		}
	);
});
