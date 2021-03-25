function contextMenuCloseHanlder(conMenuInstance, type) {
	const menu = conMenuInstance.dom;
	menu.classList.remove('aras-contextMenu_opened');
	menu.dispatchEvent(
		new CustomEvent('contextMenuClose', {
			bubbles: true,
			detail: { type }
		})
	);
}

function initContextMenu(conMenuInstance, container) {
	conMenuInstance.dom = container.appendChild(
		document.createElement('aras-menu')
	);
	conMenuInstance.dom.classList.add('aras-contextMenu');
	conMenuInstance.dom.tabIndex = '-1';
	conMenuInstance.roots = [];

	conMenuInstance.dom.addEventListener('focusout', (e) => {
		const menu = conMenuInstance.dom;
		const isChildNodeFocused =
			e.relatedTarget && menu.contains(e.relatedTarget);
		if (!isChildNodeFocused) {
			contextMenuCloseHanlder(conMenuInstance, e.type);
		}
	});
	conMenuInstance.dom.addEventListener('keydown', (e) => {
		if (e.code === 'Escape' || e.keyCode === 27) {
			e.preventDefault();
			e.stopPropagation();
			contextMenuCloseHanlder(conMenuInstance, e.type);
		}
	});
}

class ContextMenu {
	constructor(container) {
		this.data = new Map();
		initContextMenu(this, container || document.body);
	}

	on(event, callback) {
		const handler = (e) => {
			const node = e.target;
			const targetNode = node.closest('li[data-index]');
			const elementId = targetNode && targetNode.dataset.index;
			callback(elementId, e, this.args);

			if (targetNode && !targetNode.classList.contains('aras-list__parent')) {
				this.dom.blur();
				contextMenuCloseHanlder(this, e.type);
			}
		};
		this.dom.addEventListener(event, handler);
		return () => {
			this.dom.removeEventListener(event, handler);
		};
	}

	show(coords, args) {
		const menu = this.dom;
		menu.applyData(this.data, this.roots);
		if (!menu.hasChildNodes()) {
			return;
		}

		this.args = args;
		menu.classList.add('aras-contextMenu_opened');
		menu.dispatchEvent(new CustomEvent('contextMenuShow', { bubbles: true }));

		const menuStyle = menu.style;
		menuStyle.top = coords.y + 'px';
		menuStyle.left = coords.x + 'px';
		menuStyle.maxHeight = '100%';
		menuStyle.right = 'auto';
		menuStyle.bottom = 'auto';

		menu.calcSubmenuPosition(menu);
		menu.focus();
	}
	applyData(data) {
		const applyRecursive = (data) => {
			const ids = Object.keys(data);
			ids.forEach((id) => {
				const item = data[id];
				if (!Object.keys(item).length) {
					this.data.set(id, { type: 'separator' });
					return;
				}
				if (item.children) {
					const children = applyRecursive.call(this, item.children);
					this.data.set(id, { ...item, children });
					return;
				}
				this.data.set(id, item);
			});
			return ids;
		};

		this.roots = applyRecursive(data);
	}
}

export default ContextMenu;
