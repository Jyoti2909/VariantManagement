define([
	'QB/Scripts/ConditionTreeVisitor/tooltipTextPortionsPrinter',
	'QB/Scripts/conditionTreeNavigator'
], function (TooltipTextPortionsPrinter, ConditionTreeNavigator) {
	var renderer = {};

	function makePreview(element, conditionsTree) {
		var conditionTreeNavigator = new ConditionTreeNavigator();
		var textPrinter = new TooltipTextPortionsPrinter(conditionTreeNavigator);
		conditionTreeNavigator.accept(conditionsTree.root, textPrinter);
		var infernoFlags = ArasModules.utils.infernoFlags;
		var conditionItems = [];
		textPrinter.printTextPortions(function (text, portionState) {
			var conditionClass;
			switch (portionState) {
				case 'invalid':
					conditionClass = 'errorProperty';
					break;
				case 'green':
					conditionClass = 'binaryLabel';
					break;
				default:
					break;
			}
			var newItem = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				conditionClass,
				Inferno.createTextVNode(text),
				infernoFlags.hasVNodeChildren
			);
			conditionItems.push(newItem);
		});
		var root = Inferno.createVNode(
			Inferno.getFlagsForElementVnode('span'),
			'span',
			'conditionContainer',
			conditionItems,
			infernoFlags.hasNonKeyedChildren
		);
		Inferno.render(root, element);
	}

	renderer.makePreview = makePreview;

	return renderer;
});
