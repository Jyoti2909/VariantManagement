define(['dojo/_base/declare', './InputGroup'], function (
	declare,
	BaseInputGroup
) {
	return declare('TemplatedEditor.StaticInputGroup', [BaseInputGroup], {
		domNode: null,
		owner: null,

		constructor: function (ownerEditor, groupDescriptor) {},

		_getRenderCssClasses: function () {
			var cssClasses = this.inherited(arguments);

			cssClasses.push('staticGroup');
			return cssClasses;
		}
	});
});
