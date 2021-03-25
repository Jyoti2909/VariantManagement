define([], function () {
	return {
		initTemplate: function (navInstance) {
			return function (navInstance) {
				const infernoFlags = ArasModules.utils.infernoFlags;
				const rootNodeClass = 'aras-nav';
				const nodeClass = 'aras-nav__child';
				const selectedNodeClass = 'aras-nav__child aras-nav__child_selected';

				const templates = {
					root: function Root() {
						const rootNodes = [];
						navInstance.roots.forEach(function (root) {
							const rootNode = navInstance.data.get(root);
							rootNodes.push(
								Inferno.createComponentVNode(
									infernoFlags.componentFunction,
									templates.node,
									{
										nodeKey: root,
										value: rootNode
									}
								)
							);
						});
						return Inferno.createVNode(
							Inferno.getFlagsForElementVnode('ul'),
							'ul',
							rootNodeClass,
							rootNodes,
							infernoFlags.hasNonKeyedChildren
						);
					},
					node: function Node(item) {
						const isSelected = navInstance.selectedItemKey === item.nodeKey;
						const className = isSelected ? selectedNodeClass : nodeClass;
						const liProps = {
							'data-key': item.nodeKey
						};

						const template = templates._getDefaultTemplate(item);

						return Inferno.createVNode(
							Inferno.getFlagsForElementVnode('li'),
							'li',
							className,
							template,
							infernoFlags.hasNonKeyedChildren,
							liProps
						);
					},
					_getDefaultTemplate: function (item) {
						const imgNode = Inferno.createVNode(
							Inferno.getFlagsForElementVnode('img'),
							'img',
							null,
							null,
							infernoFlags.hasInvalidChildren,
							{
								src: item.value.icon
							}
						);
						const labelNode = Inferno.createVNode(
							Inferno.getFlagsForElementVnode('span'),
							'span',
							null,
							Inferno.createTextVNode(item.value.label),
							infernoFlags.hasVNodeChildren
						);
						return [imgNode, labelNode];
					}
				};

				return templates;
			};
		}
	};
});
