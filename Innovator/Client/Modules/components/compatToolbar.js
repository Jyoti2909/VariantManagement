import { toolbarTemplates } from './compatToolbarTemplates';

const DROPDOWN_CLASS = 'aras-compat-toolbar__dropdown';
const DROPDOWN_LIST_CONTAINER_CLASS = 'aras-dropdown';
const DROPDOWN_OPENED_LIST_CONTAINER_CLASS = 'aras-dropdown_opened';
const DROPDOWN_BUTTON_CLASS = 'aras-compat-toolbar__dropdown-button';

function CompatToolbar(dom, options) {
	this.dom = dom;
	this.templates = null;
	this.dataset = new Map();
	this.detectedForceRender = new Map();
	this._nodesInfo = new WeakMap();
	this._leftContainerItems = [];
	this._rightContainerItems = [];
	this._dropdownItems = [];
	this._isToolbarLabeled = false;
	this._doUpdateNodesInfo = true;
	this._layoutInfo = {
		dropdownButtonWidth: 0,
		separatorWidth: 3,
		totalWidth: 0,
		leftContainerWidth: 0,
		rightContainerWidth: 0
	};
	this._renderingPromise = null;
	this._init(options);
}

CompatToolbar.prototype = {
	_init: function (options) {
		options = options || {};
		const self = this;
		this.templates = toolbarTemplates(options.customTemplates);
		this._isToolbarLabeled = options.isToolbarLabeled || false;
		this._resizeHandler = function () {
			self._updateItemsPosition();
			self.render();
		};
		window.addEventListener('resize', this._resizeHandler);
	},
	render: function () {
		if (this._renderingPromise) {
			return this._renderingPromise;
		}
		const self = this;
		this._renderingPromise = Promise.resolve().then(function () {
			let root;
			self.dataset.forEach(function (item, key) {
				const oldItem = self.detectedForceRender.get(key);
				if (
					!oldItem ||
					((item.type === 'select' || item.type === 'htmlSelector') &&
						item.options !== oldItem.options)
				) {
					self._doUpdateNodesInfo = true;
					self.detectedForceRender.set(key, item);
				}
			});
			if (self._doUpdateNodesInfo) {
				self._doUpdateNodesInfo = false;
				root = self.templates.root(self._getVnodeProperties(true));
				Inferno.render(root, self.dom);
				const layoutInfo = self._layoutInfo;
				const containers = self.dom.querySelectorAll(
					'.aras-compat-toolbar__container'
				);
				layoutInfo.leftContainerWidth = containers[0].clientWidth;
				layoutInfo.rightContainerWidth = containers[1].clientWidth;
				layoutInfo.totalWidth =
					layoutInfo.leftContainerWidth + layoutInfo.rightContainerWidth;
				self._updateItemsPosition();
			}

			root = self.templates.root(self._getVnodeProperties(false));
			Inferno.render(root, self.dom);
			self._renderingPromise = null;
		});
		return this._renderingPromise;
	},
	set labeled(newValue) {
		if (this.dom.firstChild) {
			this.dom.firstChild.classList.toggle(
				'aras-compat-toolbar_labeled',
				newValue
			);
		}
		this._isToolbarLabeled = newValue;
		this._doUpdateNodesInfo = true;
		this.render();
	},
	get labeled() {
		return this._isToolbarLabeled;
	},
	set data(dataMap) {
		const self = this;
		this.dataset = dataMap;
		this._doUpdateNodesInfo = true;
		this._rightContainerItems = [];
		this._leftContainerItems = [];
		this.detectedForceRender = new Map();
		this.dataset.forEach(function (value, key) {
			if (value.right) {
				self._rightContainerItems.push(key);
			} else {
				self._leftContainerItems.push(key);
			}
		});
		this.render();
	},
	get data() {
		return this.dataset;
	},
	set container(newContainerItems) {
		this._doUpdateNodesInfo = true;
		this._leftContainerItems = newContainerItems;
		this.render();
	},
	get container() {
		return this._leftContainerItems;
	},
	set rightContainer(newContainerItems) {
		this._doUpdateNodesInfo = true;
		this._rightContainerItems = newContainerItems;
		this.render();
	},
	get rightContainer() {
		return this._rightContainerItems;
	},
	on: function (eventType, callback) {
		const self = this;
		const handler = function (event) {
			const targetItemId = self._getIdByDomElement(event.target);
			const item = self.data.get(targetItemId);
			if (
				event.type === 'click' &&
				item &&
				item.type === 'button' &&
				item.disabled
			) {
				return;
			}
			if (targetItemId) {
				callback(targetItemId, event);
			}
		};
		this.dom.addEventListener(eventType, handler);
		return function () {
			self.dom.removeEventListener(eventType, handler);
		};
	},
	closeDropdown: function () {
		const dropdown = this.dom.querySelector(
			'.' + DROPDOWN_LIST_CONTAINER_CLASS
		);
		dropdown.classList.remove(DROPDOWN_OPENED_LIST_CONTAINER_CLASS);
	},
	destroy: function () {
		this.dom.parentNode.removeChild(this.dom);
		window.removeEventListener('resize', this._resizeHandler);
	},
	_trimSeparators: function (arr) {
		if (!arr.length) {
			return arr;
		}
		let startIndex = 0;
		let lastIndex = arr.length;
		let startIndexFound = false;
		let lastIndexFound = false;
		for (let i = 0; i < arr.length; i++) {
			if (!startIndexFound) {
				if (this.data.get(arr[i]).type === 'separator') {
					startIndex = i;
				} else {
					startIndexFound = true;
				}
			}
			if (!lastIndexFound) {
				if (this.data.get(arr[arr.length - 1 - i]).type === 'separator') {
					lastIndex = arr.length - 1 - i;
				} else {
					lastIndexFound = true;
				}
			}
		}
		return arr.slice(startIndex, lastIndex);
	},
	_getIdByDomElement: function (element) {
		const targetNodeSelector = '[data-id]';
		const targetNode = element.closest(targetNodeSelector);
		return targetNode ? targetNode.dataset.id : null;
	},
	_getVnodeProperties: function (isPreRender) {
		const self = this;
		const dropdownNode = self.dom.querySelector(
			'.' + DROPDOWN_CLASS + ' .' + DROPDOWN_LIST_CONTAINER_CLASS + ''
		);
		const dropdownStyle = dropdownNode
			? 'top:' +
			  dropdownNode.style.top +
			  ';left: ' +
			  dropdownNode.style.left +
			  ';'
			: false;
		const filterDropdownItems = function (itemId) {
			return !self._dropdownItems.some(function (id) {
				return id === itemId;
			});
		};

		return {
			leftContainerItems: isPreRender
				? self._leftContainerItems
				: self._trimSeparators(
						self._leftContainerItems.filter(filterDropdownItems)
				  ),
			rightContainerItems: isPreRender
				? self._rightContainerItems
				: self._trimSeparators(
						self._rightContainerItems.filter(filterDropdownItems)
				  ),
			dropdownItems: isPreRender ? undefined : self._dropdownItems,
			toolbar: this,
			options: {
				dropdownRefCallback: function (node) {
					if (node) {
						self._layoutInfo.dropdownButtonWidth = node.querySelector(
							'.' + DROPDOWN_BUTTON_CLASS
						).clientWidth;
					}
				},
				isToolbarLabeled: self._isToolbarLabeled,
				forceOpenDropdown: dropdownNode
					? dropdownNode.classList.contains(
							DROPDOWN_OPENED_LIST_CONTAINER_CLASS
					  )
					: false,
				dropdownStyle: dropdownStyle,
				forceUpdateItems: isPreRender ? true : undefined
			}
		};
	},
	_updateItemsPosition: function () {
		const self = this;
		const toolbarWidth = self.dom.clientWidth - 2; // padding
		let widthAvailable = toolbarWidth - self._layoutInfo.dropdownButtonWidth;
		const placeItem = function (itemId, index, arr) {
			const item = self.data.get(itemId);
			if (item.type === 'separator') {
				widthAvailable -= self._layoutInfo.separatorWidth;
				return;
			}
			const nodeWidth = self._nodesInfo.get(item).width;
			if (widthAvailable >= nodeWidth) {
				widthAvailable -= nodeWidth;
			} else {
				widthAvailable = -1;
				self._dropdownItems.push(item.id);
			}
		};
		self._dropdownItems = [];
		if (toolbarWidth <= self._layoutInfo.totalWidth) {
			if (
				toolbarWidth >
				self._layoutInfo.leftContainerWidth +
					self._layoutInfo.dropdownButtonWidth
			) {
				widthAvailable -= self._layoutInfo.leftContainerWidth;
				self._rightContainerItems.forEach(placeItem);
				return;
			}
			self._leftContainerItems.forEach(placeItem);
			self._rightContainerItems.forEach(function (itemId) {
				const item = self.data.get(itemId);
				if (item.type !== 'separator') {
					self._dropdownItems.push(item.id);
				}
			});
		}
	}
};

export default CompatToolbar;
