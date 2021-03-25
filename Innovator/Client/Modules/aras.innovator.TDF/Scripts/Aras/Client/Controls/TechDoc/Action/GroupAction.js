define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(ActionBase, {
		Execute: function (executionArguments) {
			const selectedElements =
				(executionArguments && executionArguments.selectedItems) || [];

			if (selectedElements.length) {
				const viewModel = this._viewmodel;
				const parentItem = selectedElements[0].Parent;
				const siblingElements = parentItem.ChildItems();
				const groupElement = viewModel.CreateElement('element', {
					type: 'aras:block'
				});
				const groupedChildren = groupElement.ChildItems();

				const startIndex = selectedElements.reduce(
					(minIndex, currentElement) => {
						const currentIndex = siblingElements.index(currentElement);
						return currentIndex < minIndex ? currentIndex : minIndex;
					},
					Number.MAX_VALUE
				);

				viewModel.SuspendInvalidation();

				groupedChildren.addRange(
					siblingElements.splice(startIndex, selectedElements.length)
				);
				siblingElements.insertAt(startIndex, groupElement);

				viewModel.SetSelectedItems(groupElement);
				viewModel.ResumeInvalidation();

				this.OnExecuted(groupElement);

				return groupElement;
			}
		}
	});
});
