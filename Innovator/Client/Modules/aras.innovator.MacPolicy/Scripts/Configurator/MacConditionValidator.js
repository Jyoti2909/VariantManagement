define([
	'MacPolicy/Scripts/Configurator/MacCondition',
	'MacPolicy/Scripts/Configurator/MacConditionParser',
	'MacPolicy/Scripts/Configurator/ParsingError'
], function (macCondition, macConditionParser, ParsingError) {
	'use strict';
	const macConditionValidator = {};

	macConditionValidator.possibleMethods = [
		{
			name: 'MacPolicy.CurrentItem.HasUserVisibilityPolicyAccess',
			args: []
		},
		{
			name: 'MacPolicy.CurrentUser.IsMemberOf',
			args: [
				{
					type: ['constant', 'property']
				}
			]
		},
		{
			name: 'MacPolicy.CurrentUser.IsXPropertyDefined',
			args: [
				{
					type: ['constant']
				}
			]
		},
		{
			name: 'MacPolicy.CurrentUser.IsClassifiedByXClass',
			args: [
				{
					type: ['constant']
				}
			]
		},
		{
			name: 'MacPolicy.CurrentItem.IsXPropertyDefined',
			args: [
				{
					type: ['constant']
				}
			]
		},
		{
			name: 'MacPolicy.CurrentItem.IsClassifiedByXClass',
			args: [
				{
					type: ['constant']
				}
			]
		},
		{
			name: 'MacPolicy.String.Contains',
			args: [
				{
					type: ['constant', 'property']
				},
				{
					type: ['constant', 'property']
				}
			]
		},
		{
			name: 'MacPolicy.Collection.Overlaps',
			args: [
				{
					type: ['property']
				},
				{
					type: ['property']
				}
			]
		},
		{
			name: 'MacPolicy.Collection.Contains',
			args: [
				{
					type: ['property', 'property']
				},
				{
					type: ['property', 'constant']
				}
			]
		},
		{
			name: 'MacPolicy.Collection.IsEmpty',
			args: [
				{
					type: ['property']
				}
			]
		}
	];

	function checkIdentifier(branch) {
		if (branch.name === 'property') {
			if (branch.value === 'CurrentUser' || branch.value === 'CurrentItem') {
				const message = aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'condition_editor.invalid_property_name',
					branch.value
				);
				throw new ParsingError(message, branch.location);
			}
		}
		if (branch.children) {
			branch.children.forEach(function (child) {
				checkIdentifier(child);
			});
		}
	}
	macConditionValidator.validate = function (
		conditionXml,
		items,
		conditionsTree
	) {
		try {
			const result = macConditionParser.parse(conditionXml);
			checkIdentifier(result);
			macCondition.transformAstBeforeSave(result);
			conditionsTree.fillUnknown(result, items, this.possibleMethods);
			conditionsTree.synchronize(result);
			const condition = conditionsTree.toXml();
			return {
				isSuccess: true,
				condition: condition.xml
			};
		} catch (e) {
			return {
				isSuccess: false,
				error: e
			};
		}
	};
	return macConditionValidator;
});
