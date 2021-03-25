function ToolbarItemWrapper(args) {
	if (typeof arasDocumentationHelper !== 'undefined') {
		arasDocumentationHelper.registerProperties({});
		arasDocumentationHelper.registerEvents('');
		return;
	}

	const item = args.item;
	const toolbar = args.toolbar;
	this._widget = {
		get domNode() {
			const toolbarNode = toolbar._toolbar.dom;
			return toolbarNode.querySelector('span[data-id="' + item.id + '"]');
		},
		get: function (prop) {
			if (prop === 'style') {
				return this.domNode.style.cssText;
			}

			return item[prop];
		},
		set: function (prop, value) {
			if (prop === 'style') {
				this.domNode.style.cssText += value;
			} else {
				item[prop] = value;
			}
		},
		setPlaceholder: function () {}
	};
	this._item_Experimental = item;
	this._toolbar = toolbar;
	for (var method in this) {
		if (typeof this[method] === 'function') {
			var methodName = method.substr(0, 1).toUpperCase() + method.substr(1);
			this[methodName] = this[method];
		}
	}
}

ToolbarItemWrapper.prototype = {
	_item_Experimental: null,

	getId: function () {
		return this._item_Experimental.id;
	},

	getState: function () {
		if (
			'toggleButton' == this._item_Experimental.type ||
			'checkedMenuItem' == this._item_Experimental.type ||
			'radioButtonMenuItem' == this._item_Experimental.type
		) {
			return this._item_Experimental.get.checked;
		}
	},

	setState: function (isPushed) {
		if (
			'toggleButton' == this._item_Experimental.type ||
			'checkedMenuItem' == this._item_Experimental.type ||
			'radioButtonMenuItem' == this._item_Experimental.type
		) {
			this._item_Experimental.checked = isPushed;
		}
	},

	setEnabled: function (bool) {
		if (this._item_Experimental.disabled !== bool) {
			return;
		}
		this._item_Experimental.disabled = !bool;
		var itemId = this._item_Experimental.id;
		var toolbarComponent = this._toolbar._toolbar;
		toolbarComponent.data.set(
			itemId,
			Object.assign({}, this._item_Experimental)
		);
		this._toolbar.refreshToolbar_Experimental();
	},

	getEnabled: function () {
		return !this._item_Experimental.disabled;
	},

	setItemVisible: function (itemId, isVisible) {
		isVisible = isVisible === undefined || isVisible;
		if ('dijit.form.DropDownButton' === this._item_Experimental.declaredClass) {
			var menu = this._item_Experimental.get('dropDown');
			var items = menu.getChildren();
			for (var i = 0; i < items.length; i += 1) {
				if (items[i].popup !== undefined) {
					var popupItems = items[i].popup.getChildren();
					for (var j = 0; j < popupItems.length; j += 1) {
						if (itemId == popupItems[j].id) {
							popupItems[j].domNode.style.display = isVisible ? '' : 'none';
						}
					}
				}
				if (itemId == items[i].id) {
					items[i].domNode.style.display = isVisible ? '' : 'none';
				}
			}
		}
	},

	getSelectedIndex: function () {
		if (
			'select' === this._item_Experimental.type ||
			'htmlSelector' === this._item_Experimental.type
		) {
			var options = this._item_Experimental.options;
			var selectedId = this._item_Experimental.value;
			var index = -1;
			for (var i = 0; i < options.length; i++) {
				if (options[i].value == selectedId) {
					index = i;
					break;
				}
			}
			return index;
		}
	},

	removeAll: function () {
		var toolbarComponent = this._toolbar._toolbar;
		if (
			'select' === this._item_Experimental.type ||
			'htmlSelector' === this._item_Experimental.type
		) {
			this._item_Experimental.options = [];
			toolbarComponent.render();
		} else if ('dropdownButton' === this._item_Experimental.type) {
			this._item_Experimental.options = [];
			var itemId = this._item_Experimental.id;
			toolbarComponent.data.set(
				itemId,
				Object.assign({}, this._item_Experimental)
			);
			toolbarComponent.render();
		}
	},

	addSeparator: function () {
		if (
			'select' === this._item_Experimental.type ||
			'htmlSelector' === this._item_Experimental.type
		) {
			this._item_Experimental.options.push({ type: 'separator' });
		}
	},

	add: function (id, label, checked) {
		var toolbarComponent = this._toolbar._toolbar;
		const itemId = this._item_Experimental.id;
		if (
			'select' === this._item_Experimental.type ||
			'htmlSelector' === this._item_Experimental.type
		) {
			const newItem = Object.assign({}, this._item_Experimental);
			newItem.options = newItem.options.concat([{ value: id, label: label }]);
			toolbarComponent.data.set(itemId, newItem);
			this._item_Experimental = newItem;
			toolbarComponent.render();
		} else if ('dropdownButton' === this._item_Experimental.type) {
			this._item_Experimental.options.push({ value: id, label: label });
			toolbarComponent.data.set(
				itemId,
				Object.assign({}, this._item_Experimental)
			);
			toolbarComponent.render();
		}
	},

	getSelectedItem: function () {
		if (
			'select' === this._item_Experimental.type ||
			'htmlSelector' === this._item_Experimental.type
		) {
			return this._item_Experimental.value;
		}
	},

	setSelected: function (id) {
		if ('select' == this._item_Experimental.type) {
			this._item_Experimental.value = id;
			var itemId = this._item_Experimental.id;
			var toolbarComponent = this._toolbar._toolbar;
			toolbarComponent.data.set(
				itemId,
				Object.assign({}, this._item_Experimental)
			);
			this._toolbar.refreshToolbar_Experimental();
		}
	},

	getItem: function (id) {
		if (
			'select' == this._item_Experimental.type ||
			'htmlSelector' === this._item_Experimental.type
		) {
			return this._item_Experimental.options[id].label;
		} else if (
			'dijit.form.DropDownButton' === this._item_Experimental.declaredClass
		) {
			var menu = this._item_Experimental.get('dropDown');
			var menuChilds = menu.getChildren();
			var childItem;
			var i;

			for (i = 0; i < menuChilds.length; i++) {
				childItem = menuChilds[i];

				if (childItem.id == id) {
					return new Aras.Client.Controls.Public.ToolbarItem({
						item: childItem
					});
				}
			}
		}
	},

	remove: function (name) {
		if ('select' == this._item_Experimental.type) {
			var options = this._item_Experimental.options;
			var index = options.findIndex(function (option) {
				return name === option.value;
			});
			if (index === -1) {
				return;
			}
			options.splice(index, 1);
			if (name === this._item_Experimental.value) {
				this._item_Experimental.value = options.length ? options[0].value : '';
			}
		}
	},

	getItemCount: function () {
		if (
			'select' == this._item_Experimental.type ||
			'htmlSelector' === this._item_Experimental.type ||
			'dropdownButton' === this._item_Experimental.type
		) {
			return this._item_Experimental.options.length;
		}
	},

	setText: function (value) {
		this._item_Experimental.value = value;
		var itemId = this._item_Experimental.id;
		var toolbarComponent = this._toolbar._toolbar;
		toolbarComponent.data.set(
			itemId,
			Object.assign({}, this._item_Experimental)
		);
		this._toolbar.refreshToolbar_Experimental();
	},

	getText: function () {
		return this._item_Experimental.value;
	},

	setLabel: function (value, position) {
		var itemWidget = this._item_Experimental;
		if (
			'Aras.Client.Controls.Experimental._toolBar.AdvancedTextBox' ===
			itemWidget.declaredClass
		) {
			if (position === 'right') {
				itemWidget.setLabelAfter(value);
			} else if (position === 'left') {
				itemWidget.setLabelBefore(value);
			}
		} else {
			var textLabelNode = itemWidget.textLabel;
			if (textLabelNode) {
				textLabelNode.innerHTML = value;
			} else {
				var topWindow = window.TopWindowHelper.getMostTopWindowWithAras();
				var errorName = topWindow.aras.getResource(
					'',
					'toolbar.set_label_method_unsupported'
				);
				throw new Error(1, errorName);
			}
		}
	},

	getBounds: function () {
		var item = this._item_Experimental.domNode;
		var bounds = {
			top: item.offsetTop - item.parentElement.offsetTop,
			left: item.offsetLeft - item.parentElement.offsetLeft,
			width: item.offsetWidth,
			height: item.offsetHeight
		};
		return bounds;
	},

	enable: function () {
		this.setEnabled(true);
	},

	disable: function () {
		this.setEnabled(false);
	}
};
