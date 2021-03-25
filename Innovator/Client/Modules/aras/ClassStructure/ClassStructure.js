import Nav from '../../components/nav/nav';
import utils from '../../core/utils';
import SvgManager from '../../core/SvgManager';

const infernoFlags = utils.infernoFlags;
const keyPressHandler = (event) => {
	if (event.key === 'Enter') {
		const evt = new CustomEvent('focusout', {
			bubbles: true,
			cancelable: true
		});
		event.target.dispatchEvent(evt);
	}
};

const refInputNode = (dom) => {
	if (!dom) {
		return;
	}

	dom.select();
};

class ClassStructure extends Nav {
	init() {
		super.init();
		this.modifier = 'tree';
		this.expandOnButton = true;
	}

	deleteItem(deleteItemId, parentItemId) {
		const parent = this.data.get(parentItemId);
		const deleteItem = this.data.get(deleteItemId);
		if (!parent || !deleteItem) {
			return;
		}

		const removeItem = (deleteItem) => {
			(deleteItem.children || [])
				.map((id) => {
					return this.data.get(id);
				})
				.forEach(removeItem);

			this.data.delete(deleteItem.itemId);
		};

		parent.children.splice(parent.children.indexOf(deleteItemId), 1);
		if (parent.children.length === 0) {
			parent.children = null;
		}

		removeItem(deleteItem);
		this.render();
	}

	filter(pattern) {
		if (!pattern || !(pattern = pattern.trim().toUpperCase())) {
			this.filteredItems = null;
			return;
		}

		this.filteredItems = new Set();

		const parseWildcards = (path, expression) => {
			const keys = expression.split('%');
			return keys.every((key) => {
				if (key === '') {
					return true;
				}
				const matchedIndex = path.indexOf(key);
				if (matchedIndex < 0) {
					return false;
				}
				path = path.substr(matchedIndex + key.length);
				return true;
			});
		};

		const testExpression = (path, expression) => {
			let result = false;
			const _path = path.toUpperCase();

			if (expression.indexOf('/') >= 0) {
				const expKeys = expression.split('/');
				const pathKeys = _path.split('/');
				result = pathKeys.some((pathKey, pathIdx) => {
					return expKeys.every((expKey, expIdx) => {
						return parseWildcards(pathKeys[pathIdx + expIdx] || '', expKey);
					});
				});
			} else {
				result = parseWildcards(_path, expression);
			}
			return result;
		};

		const filterRecursive = (itemId, expression, path) => {
			const item = this.data.get(itemId);
			path += '/' + item.label;
			let isVisible = false;
			const childItems = item.children;
			if (childItems) {
				childItems.forEach((id) => {
					if (filterRecursive(id, expression, path)) {
						isVisible = true;
					}
				});
			} else {
				isVisible = testExpression(path, expression);
			}

			if (isVisible) {
				this.filteredItems.add(itemId);
				this.expandedItemsKeys.add(itemId);
			}

			return isVisible;
		};

		filterRecursive(this.getRootItem().itemId, pattern, '');
		this.render();
	}

	sortBranch(itemId, isAscSort) {
		const structureData = this.data;
		const selectedItem = structureData.get(itemId);
		const childItems = selectedItem.children;

		if (!childItems || childItems.length === 0) {
			return;
		}

		const sortHandler = (firstItemId, secondItemId) => {
			const firstLabel = structureData.get(firstItemId).label.toUpperCase();
			const secondLabel = structureData.get(secondItemId).label.toUpperCase();
			if (firstLabel === secondLabel) {
				return 0;
			}

			const condition = isAscSort
				? firstLabel > secondLabel
				: firstLabel < secondLabel;

			return condition ? 1 : -1;
		};

		selectedItem.children = childItems.sort(sortHandler);
		this.render();
	}

	sortTree(isAscSort) {
		const sortRecursive = (parentId) => {
			this.sortBranch(parentId, isAscSort);
			const children = this.data.get(parentId).children || [];
			children.forEach(sortRecursive);
		};

		sortRecursive(this.getRootItem().itemId);
		this.render();
	}

	expandPath(expandClassPath) {
		if (!expandClassPath) {
			return;
		}

		const classPathElements = expandClassPath.split('/');
		const rootItem = this.getRootItem();

		const expandRecursive = (children, index) => {
			if (index >= classPathElements.length) {
				return true;
			}

			children.forEach((itemIndex) => {
				const item = this.data.get(itemIndex);
				if (item.label === classPathElements[index]) {
					if (expandRecursive(item.children, index + 1)) {
						this.select(itemIndex);
					} else {
						this.expandedItemsKeys.add(itemIndex);
					}
				}
			});

			return false;
		};

		this.expandedItemsKeys.add(rootItem.itemId);
		expandRecursive(rootItem.children, 0);
	}

	expandTree() {
		this.data.forEach((item, index) => {
			if (!item.children || item.children.length === 0) {
				return;
			}
			this.expandedItemsKeys.add(index);
		});
		this.render();
	}

	collapseTree() {
		this.expandedItemsKeys.clear();
		this.render();
	}

	getRootItem() {
		let rootId = '';
		this.roots.forEach((id) => {
			rootId = id;
		});
		return this.data.get(rootId);
	}

	formatter(nodeInfo) {
		const item = nodeInfo.value;
		const levelpadNode = !item.children
			? Inferno.createVNode(
					Inferno.getFlagsForElementVnode('span'),
					'span',
					'aras-nav__tree-levelpad'
			  )
			: Inferno.createTextVNode('');

		if (this.editedItemKey !== nodeInfo.nodeKey) {
			if (this.editedItemKey) {
				return null;
			}

			return [
				levelpadNode,
				SvgManager.createInfernoVNode(item.icon) || Inferno.createTextVNode(''),
				Inferno.createVNode(
					Inferno.getFlagsForElementVnode('span'),
					'span',
					item.enabled ? '' : 'aras-nav-item_disabled',
					Inferno.createTextVNode(item.label),
					infernoFlags.hasVNodeChildren
				)
			];
		}

		const imageNode = SvgManager.createInfernoVNode(item.icon);
		const inputNode = Inferno.createVNode(
			Inferno.getFlagsForElementVnode('input'),
			'input',
			'aras-nav-input',
			null,
			utils.hasInvalidChildren,
			{
				type: 'text',
				defaultValue: item.label,
				onKeyPress: keyPressHandler
			},
			null,
			refInputNode
		);

		return [levelpadNode, imageNode || Inferno.createTextVNode(''), inputNode];
	}
}

export default ClassStructure;
