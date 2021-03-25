define(['dojo/_base/declare', './EffSGrammarInputGroup'], function (
	declare,
	GrammarInputGroup
) {
	return declare('EffectivityExpressionEditor.EffSInputGroupFactory', [], {
		owner: null,

		constructor: function (ownerEditor) {
			this.owner = ownerEditor;
		},

		createGroup: function (groupDescriptor) {
			// jscs: disable
			return new GrammarInputGroup(this.owner, groupDescriptor);
			// jscs: enable
		}
	});
});
