import utils from '../../core/utils';
import SvgManager from '../../core/SvgManager';

function navTemplates(navInstance) {
	const infernoFlags = utils.infernoFlags;
	const rootNodeClass = 'aras-nav';
	const parentNodeClass = 'aras-nav__parent';
	const parentExpandedNodeClass = `${parentNodeClass} ${parentNodeClass}_expanded`;
	const parentSelectedNodeClass = `${parentNodeClass}_selected`;
	const childNodeClass = 'aras-nav__child';
	const childSelectedNodeClass = `${childNodeClass} ${childNodeClass}_selected`;

	const templates = {
		root: function Root() {
			const rootNodes = [];
			const modifier = navInstance.modifier;
			let idx = 0;
			navInstance.roots.forEach(function (root) {
				const rootNode = navInstance.data.get(root);
				if (navInstance.filteredItems && !navInstance.filteredItems.has(root)) {
					return;
				}
				rootNodes.push(
					Inferno.createComponentVNode(
						infernoFlags.componentFunction,
						templates.node,
						{
							nodeKey: root,
							value: rootNode,
							size: navInstance.roots.size,
							pos: ++idx,
							level: 1
						}
					)
				);
			});
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('ul'),
				'ul',
				rootNodeClass + (modifier ? ' ' + rootNodeClass + '_' + modifier : ''),
				rootNodes,
				infernoFlags.unknownChildren,
				{
					tabindex: '0',
					role: 'tree'
				}
			);
		},
		node: function Node(dataItem) {
			if (
				navInstance.filteredItems &&
				!navInstance.filteredItems.has(dataItem.nodeKey)
			) {
				return null;
			}
			return dataItem.value.children
				? Inferno.createComponentVNode(
						infernoFlags.componentFunction,
						templates.parentNode,
						dataItem
				  )
				: Inferno.createComponentVNode(
						infernoFlags.componentFunction,
						templates.childNode,
						dataItem
				  );
		},
		childNode: function ChildNode(item) {
			const isSelected = navInstance.selectedItemKey === item.nodeKey;
			const liProps = {
				'data-key': item.nodeKey,
				role: 'treeitem',
				'aria-level': item.level,
				'aria-setsize': item.size,
				'aria-posinset': item.pos,
				tabindex: navInstance.focusedItemKey === item.nodeKey ? '0' : '-1'
			};

			const template = templates._getTemplate(item);

			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('col'),
				'li',
				isSelected ? childSelectedNodeClass : childNodeClass,
				template,
				infernoFlags.unknownChildren,
				liProps
			);
		},
		parentNode: function ParentNode(item) {
			const children = item.value.children;
			const ulOfChildren = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('ul'),
				'ul',
				'aras-nav__child-container',
				children.map(function (childKey, idx) {
					return Inferno.createComponentVNode(
						infernoFlags.componentFunction,
						templates.node,
						{
							nodeKey: childKey,
							value: navInstance.data.get(childKey),
							size: children.length,
							pos: idx + 1,
							level: item.level + 1
						}
					);
				}),
				infernoFlags.unknownChildren,
				{ role: 'group' }
			);

			const template = templates._getTemplate(item);
			template.unshift(
				Inferno.createVNode(
					Inferno.getFlagsForElementVnode('div'),
					'div',
					'aras-nav__icon',
					[
						Inferno.createVNode(Inferno.getFlagsForElementVnode('span'), 'span')
					],
					infernoFlags.unknownChildren
				)
			); // arrow

			const divLabel = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('div'),
				'div',
				'aras-nav__parent-container',
				template,
				infernoFlags.unknownChildren,
				{
					tabindex: navInstance.focusedItemKey === item.nodeKey ? '0' : '-1'
				}
			);

			const isExpanded = navInstance.expandedItemsKeys.has(item.nodeKey);
			const classNames = isExpanded ? parentExpandedNodeClass : parentNodeClass;
			const liProps = {
				'data-key': item.nodeKey,
				role: 'treeitem',
				'aria-level': item.level,
				'aria-setsize': item.size,
				'aria-posinset': item.pos,
				'aria-expanded': isExpanded
			};
			return Inferno.createVNode(
				Inferno.getFlagsForElementVnode('li'),
				'li',
				navInstance.selectedItemKey === item.nodeKey
					? `${classNames} ${parentSelectedNodeClass}`
					: classNames,
				[divLabel, ulOfChildren],
				infernoFlags.unknownChildren,
				liProps
			);
		},
		_getTemplate: function (item) {
			const template = navInstance.formatter(item);

			return template || templates.getDefaultTemplate(item);
		},
		getDefaultTemplate: function (item) {
			const levelpadNode = !item.value.children
				? Inferno.createVNode(
						Inferno.getFlagsForElementVnode('span'),
						'span',
						'aras-nav__tree-levelpad'
				  )
				: null;
			const labelNode = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				'aras-nav__label',
				item.value.label,
				infernoFlags.unknownChildren
			);

			const imgNode = item.value.icon
				? SvgManager.createInfernoVNode(item.value.icon)
				: null;
			return [levelpadNode, imgNode, labelNode];
		}
	};

	return templates;
}

export default navTemplates;
