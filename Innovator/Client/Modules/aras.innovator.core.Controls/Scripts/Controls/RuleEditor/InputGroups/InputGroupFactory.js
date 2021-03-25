define([
	'dojo/_base/declare',
	'./InputGroup',
	'./StaticInputGroup',
	'./SelectInputGroup',
	'./MultiSelectInputGroup',
	'./GrammarInputGroup'
], function (
	declare,
	BaseInputGroup,
	StaticInputGroup,
	SelectInputGroup,
	MultiSelectInputGroup,
	GrammarInputGroup
) {
	return declare('TemplatedEditor.InputGroupFactory', [], {
		owner: null,

		constructor: function (ownerEditor) {
			this.owner = ownerEditor;
		},

		createGroup: function (groupDescriptor) {
			var groupConstructor;

			switch (groupDescriptor && groupDescriptor.type) {
				case 'static':
					groupConstructor = StaticInputGroup;
					break;
				case 'select':
					groupConstructor = SelectInputGroup;
					break;
				case 'multiselect':
					groupConstructor = MultiSelectInputGroup;
					break;
				case 'grammar':
					groupConstructor = GrammarInputGroup;
					break;
				default:
					groupConstructor = BaseInputGroup;
					break;
			}

			// jscs: disable
			return new groupConstructor(this.owner, groupDescriptor);
			// jscs: enable
		}
	});
});
