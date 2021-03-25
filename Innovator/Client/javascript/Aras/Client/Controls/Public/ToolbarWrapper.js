/**
 * @class ToolbarWrapper
 * @param {object} args
 * @param {HTMLElement} args.connectNode ~ dom node to which new toolbar would be attached
 * @param {string} [args.connectId] ~ in case connectNode was not provided, node with such id would be used as connectNode
 * @param {boolean} [args.useCompatToolbar] ~ force usage of CompatToolbar(S11-version) over Toolbar(S12-version)
 */

function ToolbarWrapper(args) {
	this.hiddenItems = [];
	this._toolbar = null;
	this._toolbarArgs = args;
	this.toolBarsNode = [];

	if (typeof arasDocumentationHelper !== 'undefined') {
		arasDocumentationHelper.registerProperties({});
		arasDocumentationHelper.registerEvents(
			'onClick, onChange, onDropDownItemClick, onKeyDown'
		);
		return;
	}
	this.controlLegacy = this;
	for (var method in this) {
		if (typeof this[method] === 'function') {
			if (method == 'getItem') {
				var yetMethodName = 'getElement';
				this[yetMethodName] = this[method];
			}
			var methodName = method.substr(0, 1).toUpperCase() + method.substr(1);
			this[methodName] = this[method];
		}
	}
}

ToolbarWrapper.prototype = {
	onClick: function (el) {
		this.buttonClick(el);
	},

	buttonClick: function (el) {},

	onChange: function (el) {},

	onKeyDown: function (el, evt) {},

	onDropDownItemClick: function (text) {},

	loadXml: function (filePath) {
		var request = new XMLHttpRequest();
		var self = this;
		request.onload = function () {
			self.loadToolbarFromStr(request.responseText);
		};
		request.open('GET', filePath, false);
		request.send();
	},

	loadToolbarFromStr: function (string) {
		var dom = new XmlDocument();
		dom.loadXML(string);
		var node = dom
			.selectSingleNode('./toolbarapplet')
			.getAttribute('buttonsize')
			.split(',');
		var toolBars = dom.selectNodes('./toolbarapplet/toolbar');

		for (var j = 0; j < toolBars.length; j++) {
			this.toolBarsNode[toolBars[j].getAttribute('id')] = toolBars[j];
		}
	},

	isToolbarExist: function (id) {
		if (this.toolBarsNode[id]) {
			return true;
		}
		return false;
	},
	showToolbar: function (id) {
		var self = this;
		var elementsWithoutIdsCounter = 0;
		var toolbarWrapper =
			this._toolbarArgs.connectNode ||
			document.getElementById(this._toolbarArgs.connectId);

		var toolbar = this._toolbar;
		if (toolbar && toolbar.id == id) {
			return;
		}

		if (this.toolBarsNode[id]) {
			if (toolbar) {
				toolbar.id = id;
			} else {
				var container = document.createElement('div');
				container.className = 'toolbar-container';
				container.id = this._toolbarArgs.id;
				const ToolbarConstructor = this._toolbarArgs.useCompatToolbar
					? CompatToolbar
					: Toolbar;
				toolbar = new ToolbarConstructor(container);
				toolbar.id = id;
				toolbarWrapper.appendChild(container);

				toolbar.on('click', function (itemId, event) {
					var targetItem = toolbar.data.get(itemId);
					if (
						targetItem &&
						targetItem.type === 'button' &&
						!targetItem.disabled
					) {
						self.onClick(
							new ToolbarItemWrapper({
								item: targetItem,
								toolbar: self
							})
						);
					}
				});
				toolbar.on('aras-es-search-click', function (itemId, event) {
					var targetItem = toolbar.data.get(itemId);
					self.onClick(
						new ToolbarItemWrapper({
							item: targetItem,
							toolbar: self
						})
					);
				});
				toolbar.on('keydown', function (itemId, event) {
					var targetItem = toolbar.data.get(itemId);
					self.onKeyDown(
						new ToolbarItemWrapper({
							item: targetItem,
							toolbar: self
						})
					);
				});
			}

			var toolbarIds = [id];

			if (toolbarIds.indexOf('$EmptyClassification') === -1) {
				toolbarIds.push('$EmptyClassification');
			}

			var items = new Map();
			var imagesArr = [];
			var itemsMapHandler = function (itemNode) {
				var idItem;
				var itemType;
				var newItem;
				if ('getAttribute' in itemNode) {
					idItem = itemNode.getAttribute('id');
					elementsWithoutIdsCounter++;
					idItem = idItem ? idItem : 'emptyId_' + elementsWithoutIdsCounter;
				} else {
					return;
				}

				itemType = itemNode.getAttribute('type') || itemNode.nodeName;
				var imageSRC = itemNode.getAttribute('image') || '';
				const itemLabel = itemNode.getAttribute('label') || '';
				imagesArr.push(imageSRC);
				switch (itemType) {
					case 'button':
						newItem = {
							image: imageSRC,
							type: itemType,
							id: idItem,
							tooltip: itemNode.getAttribute('tooltip'),
							idx: itemNode.getAttribute('idx'),
							disabled: itemNode.getAttribute('disabled') === 'true',
							visible: itemNode.getAttribute('invisible') !== 'true',
							right: itemNode.getAttribute('right'),
							class: itemNode.getAttribute('class'),
							state: itemNode.getAttribute('state') ? false : null
						};
						break;
					case 'separator':
						newItem = {
							type: itemType,
							id: idItem,
							visible: true
						};
						break;
					case 'choice':
						var nodes = itemNode.selectNodes('./choiceitem');
						var options = [];
						for (i = 0; i < nodes.length; i++) {
							var node = nodes[i];
							nodeText = node.text;
							var value = node.getAttribute('id') || nodeText;
							options.push({ value: value, label: nodeText });
						}

						var selectorType = itemNode.getAttribute('is');
						newItem = {
							type: !selectorType ? 'select' : selectorType + 'Selector',
							id: idItem,
							tooltip: itemNode.getAttribute('tooltip'),
							idx: itemNode.getAttribute('idx'),
							disabled: itemNode.getAttribute('disabled') === 'true',
							visible: itemNode.getAttribute('invisible') !== 'true',
							right: itemNode.getAttribute('right'),
							options: options,
							value: options[0] ? options[0].value : '',
							label: itemLabel
						};
						break;
					case 'edit':
						newItem = {
							type: 'textbox',
							id: idItem,
							idx: itemNode.getAttribute('idx'),
							tooltip: itemNode.getAttribute('tooltip'),
							disabled: itemNode.getAttribute('disabled') === 'true',
							visible: itemNode.getAttribute('invisible') !== 'true',
							right: itemNode.getAttribute('right'),
							value: itemNode.getAttribute('text') || '',
							size: itemNode.getAttribute('size') || '',
							label: itemLabel
						};
						break;
					case 'drop_down_selector':
						var checkItemNodes = itemNode.selectNodes('./checkitem');
						var checkItemOptions = {};
						var chechedItemValue;
						for (i = 0; i < checkItemNodes.length; i++) {
							var checkItemNode = checkItemNodes[i];
							nodeText = checkItemNode.text;
							var checkItemOptionsValue =
								checkItemNode.getAttribute('id') || nodeText;
							var checked = checkItemNode.getAttribute('checked') === 'true';
							checkItemOptions[checkItemOptionsValue] = nodeText;
							chechedItemValue = checked
								? checkItemOptionsValue
								: chechedItemValue;
						}

						newItem = {
							type: 'dropdownSelector',
							id: idItem,
							tooltip: itemNode.getAttribute('tooltip'),
							disabled: itemNode.getAttribute('disabled') === 'true',
							visible: itemNode.getAttribute('invisible') !== 'true',
							right: itemNode.getAttribute('right'),
							options: checkItemOptions,
							text: itemNode.getAttribute('text') || '',
							value: chechedItemValue
						};
						break;
					case 'drop_down_button':
						var choiceNodes = itemNode.selectNodes('./choiceitem');
						var choiceOptions = [];
						for (i = 0; i < choiceNodes.length; i++) {
							var choiceNode = choiceNodes[i];
							nodeText = choiceNode.text;
							var choiceValue = choiceNode.getAttribute('id') || nodeText;
							choiceOptions.push({ value: choiceValue, label: nodeText });
						}

						newItem = {
							type: 'dropdownButton',
							id: idItem,
							tooltip: itemNode.getAttribute('tooltip'),
							disabled: itemNode.getAttribute('disabled') === 'true',
							visible: itemNode.getAttribute('invisible') !== 'true',
							right: itemNode.getAttribute('right'),
							options: choiceOptions,
							text: itemNode.getAttribute('text') || ''
						};
						break;
					case 'dropdownMenu': {
						const recursiveMenuParse = function (children, nodesMap) {
							const childrenIdArray = [];
							for (let i = 0; i < children.length; i++) {
								const childNode = children[i];

								let childIds = null;
								if (childNode.childNodes.length !== 0) {
									childIds = recursiveMenuParse(childNode.childNodes, nodesMap);
								}

								const nodeType = childNode.nodeName;
								const nodeId = childNode.getAttribute('id');
								childrenIdArray.push(nodeId);
								if (nodeType === 'separator') {
									nodesMap.set(nodeId, {
										type: nodeType
									});
									continue;
								}

								const isChecked = childNode.getAttribute('checked') === 'true';
								const isDisabled =
									childNode.getAttribute('disabled') === 'true';
								nodesMap.set(nodeId, {
									type: nodeType,
									idx: childNode.getAttribute('idx'),
									label: childNode.getAttribute('name'),
									icon: childNode.getAttribute('icon'),
									children: childIds,
									disabled: isDisabled,
									checked: nodeType === 'checkitem' ? isChecked : undefined
								});
							}

							return childrenIdArray;
						};

						const userMenuXml = window.cui.loadMenuAppletFromCommandBars(
							'MainWindowHeaderUserMenu',
							{ menuId: 'headerUserMenu' }
						);
						const doc = new XmlDocument();
						doc.loadXML(userMenuXml);
						const userMenu = doc.selectNodes('./menuapplet/menubar/menu')[0];
						window.cui.initMenuEvents(self, {
							prefix: 'com.aras.innovator.cui_default.mwh_'
						});

						const childNodes = userMenu.childNodes;
						const nodesMap = new Map();
						const childrenArray = recursiveMenuParse(childNodes, nodesMap);
						newItem = {
							type: itemType,
							id: idItem,
							right: itemNode.getAttribute('right'),
							visible: itemNode.getAttribute('invisible') !== 'true',
							disabled: itemNode.getAttribute('disabled') === 'true',
							image: itemNode.getAttribute('image'),
							tooltip: itemNode.getAttribute('tooltip'),
							class: itemNode.getAttribute('class'),
							label: itemNode.text,
							childrenItemsData: nodesMap,
							children: childrenArray
						};
						break;
					}
					default:
						var attrs = Array.prototype.slice.call(itemNode.attributes);
						newItem = {};
						attrs.forEach(function (element) {
							newItem[element.nodeName] = element.value;
						});
						newItem.id = idItem;
						newItem.type = itemType;
						newItem.visible = true;
						newItem.disabled = newItem.disabled === 'true';
						break;
				}
				items.set(idItem, newItem);
			};
			for (var j = 0; j < toolbarIds.length; j++) {
				var toolBarNode = this.toolBarsNode[toolbarIds[j]];
				if (toolBarNode) {
					var childNodes = Array.prototype.slice.call(toolBarNode.childNodes);
					childNodes.forEach(itemsMapHandler);
				}
			}
			ArasModules.SvgManager.load(imagesArr);
			toolbar.data = items;
			this._toolbar = toolbar;
			items.forEach(
				function (item) {
					if (!item.visible) {
						this.hideItem(item.id);
					}
				}.bind(this)
			);
		}
	},

	showLabels: function (isShow) {
		if (!this._toolbar || isShow === this._toolbar.labeled) {
			return;
		}
		this._toolbar.labeled = isShow;
	},

	show: function () {
		var keys = Object.keys(this.toolBarsNode);
		this.showToolbar(keys[0]);
	},

	getId: function () {
		return this._toolbar.id;
	},

	getToolbarInstance: function () {
		return this._toolbar;
	},

	getItem: function (itemId) {
		var toolbar = this._toolbar;
		var item = toolbar.data.get(itemId);
		return item ? new ToolbarItemWrapper({ item: item, toolbar: this }) : null;
	},

	showItem: function (itemId) {
		var item = this.hiddenItems[itemId];
		if (!item) {
			return;
		}

		var toolbar = this._toolbar;
		toolbar.data.get(itemId).visible = true;

		var itemsContainer = toolbar[item.containerName];
		itemsContainer.splice(item.position, 0, item.item.id);

		toolbar[item.containerName] = itemsContainer;
	},

	hideItem: function (itemId) {
		let item = this.getItem(itemId);
		item = item ? item._item_Experimental : null;
		if (!item) {
			return;
		}

		var id = item.id;
		item.visible = false;
		var toolbar = this._toolbar;

		var containerName = 'container';
		var itemsContainer = toolbar.container;
		var itemIndex = itemsContainer.indexOf(id);
		if (itemIndex === -1) {
			containerName = 'rightContainer';
			itemsContainer = toolbar.rightContainer;
			itemIndex = itemsContainer.indexOf(id);
		}
		if (itemIndex === -1) {
			return;
		}
		this.hiddenItems[id] = {
			item: item,
			position: itemIndex,
			containerName: containerName
		};

		itemsContainer.splice(itemIndex, 1);
		toolbar[containerName] = itemsContainer;
	},

	getActiveToolbar: function () {
		return this;
	},

	disable: function () {
		return this.setEnabled_Experimental(false);
	},

	enable: function () {
		return this.setEnabled_Experimental(true);
	},

	getButtonXY: function (itemId) {
		var item = this.getItem(itemId);
		if (!item) {
			return '';
		}
		var b = item.GetBounds();
		return b.left + b.width / 2 + ',' + (b.top + b.height / 2);
	},

	getButtonId: function (label) {
		var arr = this.getItemIdsAsArr_Experimental();
		for (var i = 0; i < arr.length; i++) {
			var itemLabel = this.getButtonLabelById(arr[i]);
			if (itemLabel === label) {
				var item = this.getItem(arr[i]);
				return item.getId();
			}
		}
	},

	isButtonEnabled: function (itemId) {
		var item = this.getItem(itemId);
		return item === null ? false : item.getEnabled();
	},

	getButtonLabelById: function (itemId) {
		var item = this.getItem(itemId);
		return item ? item._item_Experimental.label : '';
	},

	isButtonVisible: function (itemId) {
		return this.isItemVisible_Experimental(itemId);
	},

	getButtons: function (separator) {
		return this.getItemIds_Experimental(separator);
	},

	getItemSize: function (itemId) {
		var item = document.getElementById(itemId);
		if (item && this._toolbar) {
			while (item.parentNode && item.parentNode != this._toolbar.domNode) {
				item = item.parentNode;
			}
			return item.offsetWidth + ',' + item.offsetHeight;
		}
		return false;
	},

	getCurrentToolBarDomNode_Experimental: function () {
		return this._toolbar.dom;
	},

	refreshToolbar_Experimental: function () {
		if (this._toolbar) {
			this._toolbar.render();
		}
	},

	setEnabled_Experimental: function (isEnabled) {
		var tbi;
		var i;
		var arr = this.getItemIdsAsArr_Experimental();
		for (i in arr) {
			tbi = this.getItem(arr[i]);
			if (tbi) {
				tbi.setEnabled(isEnabled);
			}
		}
	},

	isItemVisible_Experimental: function (id) {
		var element = this.getItem(id);
		return element && element._item_Experimental
			? element._item_Experimental.visible
			: false;
	},

	getItemIdsAsArr_Experimental: function () {
		var currentToolbar = this._toolbar;
		var idList = [];

		if (currentToolbar) {
			var dropDownItems = currentToolbar._dropDownToolBar
				? currentToolbar._dropDownToolBar.getChildren()
				: [];
			var toolbarItems = currentToolbar.data;

			toolbarItems.forEach(function (item) {
				idList.push(item.id);
			});
		}

		return idList;
	},

	getItemIds_Experimental: function (separator) {
		return this.getItemIdsAsArr_Experimental().join(separator);
	}
};
