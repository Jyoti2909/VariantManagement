define([
	'dojo/_base/declare',
	'dojo/aspect',
	'dojo/on',
	'dojo/dom-class',
	'dijit/Toolbar',
	'dijit/form/DropDownButton',
	'dojo/keys'
], function (declare, aspect, on, domClass, ToolBar, DropDownButton, keys) {
	return declare('Aras.Client.Controls.Experimental.ArasToolBar', ToolBar, {
		id: null,
		cssClass: 'ArasToolbar',

		constructor: function (args) {
			this.id = args.id;
			this.rightOffsetElement = args.rightOffsetElement;
			this.isFull = false;
			this._createDropDown();
		},
		_createDropDown: function () {
			this.drdButton = new DropDownButton(
				{ id: this.id + '_drdButton', showLabel: 'false' },
				this.id + '_drdButton'
			);
			this._dropDownToolBar = new ToolBar(
				{ id: this.id + '_toolbar', orientation: 'horizontal' },
				this.id + '_toolbar'
			);
		},
		buildRendering: function () {
			this.inherited(arguments);
			this.domNode.style.whiteSpace = 'nowrap';
			this.domNode.style.overflow = 'hidden';
			this._buildRenderingDropDown();
			on(window, 'resize', this._refresh.bind(this));
		},
		_buildRenderingDropDown: function () {
			this._dropDownToolBar.domNode.style.maxWidth = '250px';
			this._dropDownToolBar.updateWidth = this._updateWidth;
			//add special class from default.css
			domClass.add(this.domNode, this.cssClass);
			domClass.add(this._dropDownToolBar.domNode, this.cssClass);

			this.drdButton.iconNode.className = 'dropDownIconClass';
			this.drdButton.dropDown = this._dropDownToolBar;

			aspect.after(
				this._dropDownToolBar,
				'addChild',
				this.drdButton.closeDropDown.bind(this.drdButton)
			);
			aspect.after(
				this._dropDownToolBar,
				'removeChild',
				this.drdButton.closeDropDown.bind(this.drdButton)
			);
		},
		_updateWidth: function (action, deltaWidth) {
			if (!this.width) {
				this.width = 0;
			}
			switch (action) {
				case 'add':
					this.width += deltaWidth;
					break;
				case 'remove':
					this.width -= deltaWidth;
					break;
			}
			this.domNode.style.width = this.width + 'px';
		},
		addChild: function () {
			var node = arguments[0];
			var nodeWidth;
			if (this.isFull) {
				this.inherited(arguments);
				nodeWidth = node.domNode.offsetWidth;
				this._dropDownToolBar.updateWidth('add', nodeWidth);
				this.removeChild(node);
				node.placeAt(this._dropDownToolBar, 'last');
				return;
			}
			this.inherited(arguments);
			var clientRight = this.domNode.getBoundingClientRect().right;
			var rect = this.getChildren()[
				this.getChildren().length - 1
			].domNode.getBoundingClientRect().right;
			if (clientRight < rect) {
				if (this.getIndexOfChild(this.drdButton) === -1) {
					nodeWidth = node.domNode.offsetWidth;
					this._dropDownToolBar.updateWidth('add', nodeWidth);
					this.removeChild(node);
					node.placeAt(this._dropDownToolBar, 'last');
					this.inherited('addChild', [this.drdButton]);
					while (
						clientRight <= this.drdButton.domNode.getBoundingClientRect().right
					) {
						if (this.hasChildren() && this.getChildren().length > 1) {
							node = this.getChildren()[this.getChildren().length - 2];
							nodeWidth = node.domNode.offsetWidth;

							this._dropDownToolBar.updateWidth('add', nodeWidth);
							this.removeChild(node);
							node.placeAt(this._dropDownToolBar, 'first');
						} else {
							break;
						}
					}
				}
				this.isFull = true;
			}
		},
		_onRightArrow: function () {},
		_onLeftArrow: function () {},
		_onContainerKeydown: function (evt) {
			var func = this._keyNavCodes[evt.keyCode];
			if (func) {
				func(evt, this.focusedChild);
				this._searchString = '';
			} else if (
				evt.keyCode == keys.SPACE &&
				this._searchTimer &&
				!(evt.ctrlKey || evt.altKey || evt.metaKey)
			) {
				evt.stopImmediatePropagation(); // stop a11yclick and _HasDropdown from seeing SPACE if we're doing keyboard searching
				evt.preventDefault(); // stop IE from scrolling, and most browsers (except FF) from sending keypress
				this._keyboardSearch(evt, ' ');
			}
		},
		_refresh: function () {
			if (!this.drdButton.domNode) {
				this._createDropDown();
				this._buildRenderingDropDown();
			}

			var rect;
			var node;
			var clientRight;
			if (this.rightOffsetElement) {
				clientRight =
					this.domNode.ownerDocument.documentElement.offsetWidth -
					this.rightOffsetElement.offsetWidth;
			} else {
				clientRight = this.domNode.ownerDocument.documentElement.offsetWidth;
			}
			if (this.getIndexOfChild(this.drdButton) === -1) {
				if (this.hasChildren()) {
					node = this.getChildren()[this.getChildren().length - 1];
					rect = node.domNode.getBoundingClientRect();
					if (clientRight <= rect.right) {
						this.inherited('addChild', [this.drdButton]);
						this._refresh();
					}
				}
			} else {
				rect = this.drdButton.domNode.getBoundingClientRect();
				if (!rect.right || clientRight <= rect.right) {
					if (this.hasChildren() && this.getChildren().length > 1) {
						node = this.getChildren()[this.getChildren().length - 2];
						this._dropDownToolBar.updateWidth('add', node.domNode.offsetWidth);
						this.removeChild(node);
						node.placeAt(this._dropDownToolBar, 'first');
						this._refresh();
					}
				} else {
					if (this._dropDownToolBar.hasChildren()) {
						node = this._dropDownToolBar.getChildren()[0];
						this._dropDownToolBar.removeChild(node);
						this.removeChild(this.drdButton);
						this.inherited('addChild', [node]);
						var nodeWidth = this.getChildren()[this.getChildren().length - 1]
							.domNode.offsetWidth;
						this._dropDownToolBar.updateWidth('remove', nodeWidth);
						this.inherited('addChild', [this.drdButton]);
						rect = this.drdButton.domNode.getBoundingClientRect();
						if (!rect.right || clientRight <= rect.right) {
							this._dropDownToolBar.updateWidth('add', nodeWidth);
							this.removeChild(node);
							node.placeAt(this._dropDownToolBar, 'first');
						} else {
							this._refresh();
						}
					} else {
						this.drdButton.closeDropDown();
						this.removeChild(this.drdButton);
						this.isFull = false;
					}
				}
			}
		},

		showLabels: function (isShow) {
			var index = 0;
			var items;
			var currItem;
			items = this.getChildren().concat(this._dropDownToolBar.getChildren());
			for (index; index < items.length; index++) {
				currItem = items[index];
				if (
					('Aras.Client.Controls.Experimental._toolBar.Button' ===
						currItem.declaredClass ||
						'Aras.Client.Controls.Experimental._toolBar.ToggleButton' ===
							currItem.declaredClass) &&
					currItem._imageStyle.display != 'none'
				) {
					currItem._setShowLabelAttr(isShow);
				}
			}
			this._refresh();
		}
	});
});
