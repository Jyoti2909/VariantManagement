define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Originator'
], function (declare, Originator) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.ViewModelSelection',
		Originator,
		{
			_viewmodel: null,
			_selectedHash: null,

			constructor: function (args) {
				this._viewmodel = args.viewmodel;
				this._selectedHash = { previous: [], current: [] };
			},

			CreateMemento: function (/*Object*/ args) {},

			SetMemento: function (/*Object*/ args) {},

			Reset: function () {
				this._selectedHash = { previous: [], current: [] };
				this._viewmodel.fireSelectionChangeEvent();
			},

			Set: function (/*WrappedObject[]*/ targetElements) {
				var currentSelection = this._selectedHash.current.slice();
				var newSelection = [];
				var selectionChanged = false;
				var selectedElement;
				var i;

				targetElements = targetElements
					? Array.isArray(targetElements)
						? targetElements
						: [targetElements]
					: [];

				for (i = 0; i < targetElements.length; i++) {
					selectedElement = this._viewmodel.GetAncestorOrSelfElement(
						targetElements[i]
					);

					if (selectedElement) {
						newSelection.push(selectedElement);
					}
				}

				// check that selection was changed
				if (newSelection.length == currentSelection.length) {
					var elementIndex;

					for (i = 0; i < newSelection.length; i++) {
						selectedElement = newSelection[i];
						elementIndex = currentSelection.indexOf(newSelection[i]);

						if (elementIndex == -1) {
							selectionChanged = true;
							break;
						} else {
							currentSelection.splice(elementIndex, 1);
						}
					}
				} else {
					selectionChanged = true;
				}

				// fire event only when selection was changed
				if (selectionChanged) {
					this._selectedHash.previous = this._selectedHash.current;
					this._selectedHash.current = newSelection;

					this._viewmodel.fireSelectionChangeEvent();
				}
			},

			GetCurrent: function () {
				return this._selectedHash.current;
			},

			GetPrevious: function () {
				return this._selectedHash.previous;
			},

			Refresh: function () {
				var isSelectionChanged = false;
				var currentSelection = this._selectedHash.current;
				var selectedElement;
				var elementId;
				var foundElement;
				var parentElement;
				var uidPath;
				var i;

				for (i = 0; i < currentSelection.length; i++) {
					selectedElement = currentSelection[i];
					elementId = selectedElement.Id();

					if (!this._viewmodel.GetElementById(elementId)) {
						isSelectionChanged = true;
						parentElement = selectedElement.Parent;
						uidPath = [selectedElement.Uid()];

						while (parentElement) {
							uidPath.push(parentElement.Uid());
							parentElement = parentElement.Parent;
						}
						uidPath.reverse();

						foundElement = this._viewmodel.findElementByUidPath(uidPath);
						if (foundElement) {
							currentSelection[i] = foundElement;
						} else {
							currentSelection.splice(i, 1);
						}
					}
				}

				this._viewmodel.fireSelectionChangeEvent();
			}
		}
	);
});
