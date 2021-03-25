var SelectRelationshipViewModel = (function () {
	function SelectRelationshipViewModel() {
		var _this = this;
		this.relationships = [
			{ title: 'BOM', itemType: 'Part', enable: true },
			{ title: 'Document', itemType: 'Document', enable: false },
			{ title: 'CAD', itemType: 'CAD', enable: false }
		];
		this.applyCommand = {
			canExecute: function () {
				return !!_this.activeRelationship && _this.activeRelationship.enable;
			},
			execute: function () {
				if (this.canExecute()) {
					var itemTypeName = _this.activeRelationship.itemType;
					closeWindow(itemTypeName);
				}
			}
		};
	}
	return SelectRelationshipViewModel;
})();
