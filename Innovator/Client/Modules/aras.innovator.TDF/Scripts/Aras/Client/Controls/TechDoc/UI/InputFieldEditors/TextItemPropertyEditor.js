define(['dojo/_base/declare', './StringItemPropertyEditor'], function (
	declare,
	StringItemPropertyEditor
) {
	return declare(StringItemPropertyEditor, {
		constructor: function (initialParameters) {},

		_buildEditControlTemplate: function (editorParameters) {
			const initialValue = (editorParameters && editorParameters.value) || '';

			return this.wrapInTag('', 'textarea', {
				class: 'aras-input',
				value: initialValue,
				controlNode: 'valueInput'
			});
		},

		_onEditorKeyDown: function (keyEvent) {
			const keyCode = keyEvent.which || keyEvent.keyCode;

			switch (keyCode) {
				case 13:
					if (keyEvent.shiftKey) {
						keyEvent.stopPropagation();
					}
					break;
				default:
					this.inherited(arguments);
			}
		}
	});
});
