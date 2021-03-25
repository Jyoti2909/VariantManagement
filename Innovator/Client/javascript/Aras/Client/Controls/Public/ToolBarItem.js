define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/DropDownMenu',
	'dijit/MenuItem',
	'Aras/Client/Controls/Experimental/PopupMenuItem',
	'dijit/CheckedMenuItem',
	'dijit/RadioMenuItem'
], function (
	declare,
	connect,
	DropDownMenu,
	MenuItem,
	PopupMenuItem,
	CheckedMenuItem,
	RadioMenuItem
) {
	return declare('Aras.Client.Controls.Public.ToolbarItem', null, {
		//don't add property here without "_Experimental" - it will be shown as field in documentation, properties are defined in constructor using defineProperties
		_item_Experimental: null,
		_saltTbi_Experimental: null,

		constructor: function (args) {
			/// <summary>
			/// Is returned, e.g., by method "getItem" of "Toolbar"
			/// </summary>
			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties({});
				arasDocumentationHelper.registerEvents('');
				return;
			}

			this._item_Experimental = args.item;
			this._saltTbi_Experimental = args.saltTbi_Experimental;
			for (var method in this) {
				if (typeof this[method] === 'function') {
					var methodName = method.substr(0, 1).toUpperCase() + method.substr(1);
					this[methodName] = this[method];
				}
			}
		},

		getId: function () {
			/// <summary>
			/// Gets the identifier of the Toolbar object.
			/// </summary>
			/// <returns>string, Return unique identifier of component.</returns>
			return this._item_Experimental
				.get('id')
				.replace(this._saltTbi_Experimental, '');
		},

		getState: function () {
			/// <summary>
			/// Gets the state of push button.
			/// </summary>
			/// <returns>bool, true if button is pushed.</returns>
			if (
				'Aras.Client.Controls.Experimental._toolBar.ToggleButton' ==
					this._item_Experimental.declaredClass ||
				'dijit.CheckedMenuItem' == this._item_Experimental.declaredClass ||
				'dijit.RadioButtonMenuItem' == this._item_Experimental.declaredClass
			) {
				return this._item_Experimental.get('checked');
			}
		},

		setState: function (isPushed) {
			/// <summary>
			/// Sets the state of push button.
			/// </summary>
			/// <param name="isPushed" type="bool">New state of push button.</param>
			if (
				'Aras.Client.Controls.Experimental._toolBar.ToggleButton' ==
					this._item_Experimental.declaredClass ||
				'dijit.CheckedMenuItem' == this._item_Experimental.declaredClass ||
				'dijit.RadioButtonMenuItem' == this._item_Experimental.declaredClass
			) {
				return this._item_Experimental.set('checked', isPushed);
			}
		},

		setEnabled: function (bool) {
			/// <summary>
			/// Enables or disables this component, depending on the value of the
			/// parameter. An enabled component can respond to user input and generate events.
			/// Components are enabled initially by default. Works for Buttons.
			/// </summary>
			/// <param name="bool" type="bool">If true, this component is enabled; otherwise this component is disabled.</param>
			if (
				'Aras.Client.Controls.Experimental._toolBar.Button' ===
					this._item_Experimental.declaredClass ||
				'Aras.Client.Controls.Experimental._toolBar.ToggleButton' ===
					this._item_Experimental.declaredClass
			) {
				this._item_Experimental.iconNode.firstChild.setAttribute(
					'class',
					bool ? '' : 'grayImage'
				);
			}
			this._item_Experimental.set('disabled', !bool);
		},

		getEnabled: function () {
			/// <summary>
			/// get enabled.
			/// </summary>
			/// <returns>bool</returns>
			return !this._item_Experimental.get('disabled');
		},

		setItemVisible: function (itemId, isVisible) {
			isVisible = isVisible === undefined || isVisible;
			if (
				'dijit.form.DropDownButton' === this._item_Experimental.declaredClass
			) {
				//todo: setItemVisible is not recursive. Should be fixed together with removing of unusued properties functionality of fieldTools.html
				var menu = this._item_Experimental.get('dropDown'),
					items = menu.getChildren();
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
			/// <summary>
			/// Gets the index specifying the currently selected item. Works for ComboBox.
			/// </summary>
			/// <returns>int</returns>
			if (
				'dijit.form.Select' == this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				var options = this._item_Experimental.getOptions();
				var selectedId = this._item_Experimental.get('value');
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
			/// <summary>
			/// Removes all items from the component. Works for ComboBox or DropDownButton.
			/// </summary>
			if (
				'dijit.form.Select' === this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				this._item_Experimental.removeOption(this._item_Experimental.options);
			} else if (
				'dijit.form.DropDownButton' === this._item_Experimental.declaredClass
			) {
				var menu = this._item_Experimental.get('dropDown'),
					items = menu.getChildren();
				for (var i = 0; i < items.length; i += 1) {
					menu.removeChild(items[i]);
					items[i].destroyRecursive(true);
				}
			}
		},

		addSeparator: function () {
			/// <summary>
			/// Inserts separator into ComboBox
			/// </summary>
			if (
				'dijit.form.Select' == this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				this._item_Experimental.addOption({ type: 'separator' });
			}
		},

		add: function (id, label, checked) {
			//TODO: image for DropDownButton, the third parameter
			/// <summary>
			/// Adds an item that displays the specified text to the collection. Works for ComboBox and DropDownButton.
			/// </summary>
			/// <param name="id" type="string"></param>
			/// <param name="label" type="string"></param>
			if (
				'dijit.form.Select' === this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				this._item_Experimental.addOption({ value: id, label: label });
			} else if (
				'dijit.form.DropDownButton' === this._item_Experimental.declaredClass
			) {
				if (id == label) {
					var pSubMenu = new DropDownMenu({
						eventClick: this._item_Experimental.dropDown.eventClick
					});
					var popupItem = new PopupMenuItem({
						id: id,
						label: label,
						popup: pSubMenu
					});

					this._item_Experimental.dropDown.addChild(popupItem);
					return popupItem;
				} else {
					var menuItem;

					if (checked !== undefined) {
						if (this._item_Experimental.dropDown.isSingleCheck) {
							menuItem = new RadioMenuItem({
								id: id,
								label: label,
								checked: Boolean(checked),
								group: this._item_Experimental.id + 'group'
							});
						} else {
							menuItem = new CheckedMenuItem({
								id: id,
								label: label,
								checked: Boolean(checked)
							});
						}
					} else {
						menuItem = new MenuItem({ id: id, label: label });
					}

					connect.connect(menuItem, 'onClick', function (e) {
						this.getParent().eventClick(this.id);
					});
					this._item_Experimental.dropDown.addChild(menuItem);
				}
			}
		},

		getSelectedItem: function () {
			/// <summary>
			/// Gets currently selected item in the ComboBox.
			/// </summary>
			/// <returns>string</returns>
			if (
				'dijit.form.Select' == this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				return this._item_Experimental.value;
			}
		},

		setSelected: function (id) {
			/// <summary>
			/// Gets currently selected item in the ComboBox.
			/// </summary>
			/// <param name="id" type="string"></param>
			if (
				'dijit.form.Select' == this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				return this._item_Experimental.set('value', id);
			}
		},

		getItem: function (id) {
			/// <summary>
			/// Gets an string representing of the item with specified index from
			/// the collection of the items contained in this ComboBox.
			/// </summary>
			/// <param name="id" type="string"></param>
			/// <returns>string</returns>
			if (
				'dijit.form.Select' == this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				return this._item_Experimental.options[id].label;
			} else if (
				'dijit.form.DropDownButton' === this._item_Experimental.declaredClass
			) {
				var menu = this._item_Experimental.get('dropDown'),
					menuChilds = menu.getChildren(),
					childItem,
					i;

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
			/// <summary>
			/// Remove specified item from ComboBox.
			/// </summary>
			/// <param name="name" type="string"></param>
			if (
				'dijit.form.Select' == this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				for (var i = 0; i < this._item_Experimental.options.length; i++) {
					if (name == this._item_Experimental.options[i].label) {
						this._item_Experimental.removeOption(i);
						break;
					}
				}
			}
		},

		getItemCount: function () {
			/// <summary>
			/// Gets the number of items in the collection. Works for ComboBox and DropDownButton.
			/// </summary>
			/// <returns>int</returns>
			if (
				'dijit.form.Select' == this._item_Experimental.declaredClass ||
				'Controls.AdvancedToolBarSelect' ===
					this._item_Experimental.declaredClass
			) {
				return this._item_Experimental.options.length;
			} else if (
				'dijit.form.DropDownButton' == this._item_Experimental.declaredClass
			) {
				var menu = this._item_Experimental.get('dropDown');
				return menu.getChildren().length;
			}
		},

		setText: function (value) {
			/// <summary>
			/// Sets the text to be displayed in the textBox.
			/// </summary>
			/// <param name="value" type="string"></param>
			if (
				'Aras.Client.Controls.Experimental._toolBar.AdvancedTextBox' ==
				this._item_Experimental.declaredClass
			) {
				this._item_Experimental.set('value', value);
			}
		},

		getText: function () {
			/// <summary>
			/// Gets the text displayed in textBox.
			/// </summary>
			/// <returns>string</returns>
			if (
				'Aras.Client.Controls.Experimental._toolBar.AdvancedTextBox' ==
				this._item_Experimental.declaredClass
			) {
				return this._item_Experimental.get('value');
			}
		},

		setLabel: function (value, position) {
			/// <summary>
			/// Sets the label of the element (that's displayed after/before the element).
			/// </summary>
			/// <param name="value" type="string"></param>
			var itemWidget = this._item_Experimental;
			if (
				'Aras.Client.Controls.Experimental._toolBar.AdvancedTextBox' ===
				itemWidget.declaredClass
			) {
				if (position === 'right') {
					itemWidget.setLabelAfter(value);
				} else if (position === 'left') {
					//left by default
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
			/// <summary>
			/// Gets the size and location of the item.
			/// </summary>
			/// <returns>object</returns>
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
			/// <summary>
			/// Enable the component.
			/// </summary>
			this.setEnabled(true);
		},

		disable: function () {
			/// <summary>
			/// Disable the component.
			/// </summary>
			this.setEnabled(false);
		}
		//don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
