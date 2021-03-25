VC.Utils.Page.LoadWidgets(['ContextMenu/ContextMenuItem']);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Viewers.ContextMenu',
		declare(null, {
			_contextItems: {},
			_activeItemId: null,
			_viewer: {},
			_containerId: '',
			_menuElement: {},
			_contextLayer: {},
			_hiddenItems: [],

			constructor: function (containerId, viewer, hiddenItems) {
				this._contextItems = {};
				this._activeItemId = null;
				this._viewer = viewer;
				this._containerId = containerId;
				if (hiddenItems) {
					this._hiddenItems = hiddenItems;
				}
				this._initElements();
			},

			_initElements: function () {
				var self = this;
				this._menuElement = document.createElement('div');
				this._menuElement.oncontextmenu = function () {
					return false;
				};
				this._menuElement.classList.add('Contextmenu');
				this._menuElement.tabIndex = '-1';
				this._menuElement.style.position = 'absolute';
				this._menuElement.style.zIndex = '10001';
				this._menuElement.style.display = 'none';
				this._menuElement.style.outline = 'none';
				this._menuElement.ontouchmove = function (event) {
					event.preventDefault();
				};
				this._contextLayer = document.createElement('div');
				this._contextLayer.style.position = 'relative';
				this._contextLayer.style.width = '100%';
				this._contextLayer.style.height = '100%';
				this._contextLayer.style.backgroundColor = 'transparent';
				this._contextLayer.style.zIndex = '10000';
				this._contextLayer.style.display = 'none';
				this._contextLayer.oncontextmenu = function () {
					return false;
				};
				this._contextLayer.ontouchmove = function (event) {
					event.preventDefault();
				};
				this._createDefaultMenuItems();
				var container = document.getElementById(this._containerId);
				container.appendChild(this._menuElement);
				container.appendChild(this._contextLayer);
				this._menuElement.addEventListener('click', function (event) {
					self._doMenuClick(event);
				});
				this._contextLayer.addEventListener('mousedown', function (event) {
					self._onContextLayerClick(event);
				});
				this._menuElement.addEventListener('blur', function (event) {
					event.button = 0;
					self._onContextLayerClick(event);
				});
			},

			appendItem: function (itemId, label, action) {
				var item = document.createElement('div');
				item.classList.add('ContextmenuItem');
				item.innerHTML = label;
				item.id = itemId;
				this._menuElement.appendChild(item);
				var contextMenuItem = new VC.Viewers.ContextMenuItem(action, item);
				this._contextItems[itemId] = contextMenuItem;

				if (this._hiddenItems.indexOf(itemId) >= 0) {
					contextMenuItem.hide();
				}

				return contextMenuItem;
			},

			appendSeperator: function () {
				var item = document.createElement('div');
				item.classList.add('ContextmenuSeperator');
				item.style.width = '100%';
				item.style.height = '1px';
				this._menuElement.appendChild(item);
				var contextMenuItem = new VC.Viewers.ContextMenuItem(function () {},
				item);
				this._contextItems.seperator = contextMenuItem;
				return contextMenuItem;
			},

			_isMenuItemExecutable: function () {
				return (
					this._activeItemId !== null ||
					this._viewer.getSelectionManager().getResults().length > 0
				);
			},

			_createDefaultMenuItems: function () {},
			_onContextLayerClick: function (event) {},

			showElements: function (position) {
				var canvasSize = this._viewer.getView().getCanvasSize();
				var menuElement = this._menuElement;
				if (menuElement.clientHeight > canvasSize.y) {
					VC.Utils.addClass(menuElement, 'small');
				}

				this._menuElement.style.display = 'block';
				this._contextLayer.style.display = 'block';

				var menuWidth = menuElement.clientWidth;
				var menuHeight = menuElement.clientHeight;
				var positionY = position.y;
				var positionX = position.x;
				if (positionY + menuHeight > canvasSize.y) {
					positionY -= menuHeight;
				}
				if (positionX + menuWidth > canvasSize.x) {
					positionX -= menuWidth;
				}
				this._menuElement.style.top = positionY + 'px';
				this._menuElement.style.left = positionX + 'px';

				this._menuElement.focus();
			},

			hide: function () {
				this._menuElement.style.display = 'none';
				this._contextLayer.style.display = 'none';
				VC.Utils.removeClass(this._menuElement, 'small');
			},

			_doMenuClick: function (event) {
				if (VC.Utils.hasClass(event.target, 'disabled')) {
					return;
				}
				var itemId = event.target.getAttribute('id');
				var contextMenuItem = this._contextItems[itemId];
				if (contextMenuItem !== null) {
					contextMenuItem.action(this._activeItemId);
				}
				this.hide();
			},

			_isVisible: function () {
				var selectionItems = this._viewer.getSelectionManager().getResults();
				if (this._activeItemId !== null) {
					return this._viewer.getModel().getNodeVisibility(this._activeItemId);
				} else {
					return this._viewer
						.getModel()
						.getNodeVisibility(selectionItems[0].getNodeId());
				}
			}
		})
	);
});
