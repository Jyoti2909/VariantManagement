define(['MacPolicy/Scripts/Configurator/MacConditionEditor'], function (
	MacConditionEditor
) {
	'use strict';
	const MacPolicyDefinitionView = (function () {
		function MacPolicyDefinitionView(contextDocument) {
			this.contextDocument = contextDocument;
			this.MacConditionEditor = new MacConditionEditor();
		}
		MacPolicyDefinitionView.prototype.showEditor = function () {
			this.MacConditionEditor.load();
		};
		return MacPolicyDefinitionView;
	})();
	return MacPolicyDefinitionView;
});
