VC.Utils.Page.LoadWidgets(['ContextMenu/ContextMenu']);

require(['dijit/_WidgetBase', 'dojo/_base/declare'], function (
	_WidgetBase,
	declare
) {
	return dojo.setObject(
		'VC.Viewers.RightClickContextMenu',
		declare([VC.Viewers.ContextMenu], {
			constructor: function () {
				this._initEvents();
			},

			_initEvents: function () {
				var self = this;
				self._viewer.setCallbacks({
					contextMenu: function (position) {
						self.doContext(position);
					}
				});
			},

			doContext: function (position) {
				var config = new Communicator.PickConfig(
					Communicator.SelectionMask.All
				);
				this._viewer
					.getView()
					.pickFromPoint(position, config)
					.then(
						function (selectionItem) {
							this.showContext(selectionItem, position);
						}.bind(this)
					);
			},

			showContext: function (selectionItem, position) {
				var axisOverlay = 1;
				var nodeType = this._viewer
					.getModel()
					.getNodeType(selectionItem.getNodeId());
				if (
					nodeType == Communicator.NodeType.PMI ||
					nodeType == Communicator.NodeType.PMIBody ||
					selectionItem.overlayIndex() == axisOverlay
				) {
					this.setActiveItemId(null);
				} else {
					this.setActiveItemId(selectionItem.getNodeId());
				}
				this.showElements(position);
			},

			onOpenCad: function (selectedNode) {},
			onIsolate: function (selectedNode) {},
			onFitAll: function (selectedNode) {},
			onResetView: function (selectedNode) {},
			onVisibility: function (selectedNode) {},
			onHideAllOther: function (selectedNode) {},
			onDisplayAll: function (selectedNode) {},

			_onOpenCad: function (selectedNode) {
				this.onOpenCad(selectedNode);
			},

			_onIsolate: function (selectedNode) {
				this.onIsolate(selectedNode);
			},

			_onFitAll: function (selectedNode) {
				this.onFitAll(selectedNode);
			},

			_onResetView: function (selectedNode) {
				this.onResetView(selectedNode);
			},

			_onVisibility: function (selectedNode) {
				this.onVisibility(selectedNode);
			},

			_onHideAllOther: function (selectedNode) {
				this.onHideAllOther(selectedNode);
			},

			_onDisplayAll: function (selectedNode) {
				this.onDisplayAll(selectedNode);
			},

			_isMenuItemEnabled: function () {
				var selectionItems = this._viewer.getSelectionManager().getResults();

				return selectionItems.length > 0;
			},

			_createDefaultMenuItems: function () {
				var self = this;
				var openLabel = VC.Utils.GetResource('openLabel');
				this.appendItem('open', openLabel, self.open.bind(self));

				this.appendSeperator();

				var fitAllLabel = VC.Utils.GetResource('fitAllLabel');
				this.appendItem('fitAll', fitAllLabel, self.fitAll.bind(self));

				var hideLabel = VC.Utils.GetResource('hideLabel');
				this.appendItem('visibility', hideLabel, self.visibility.bind(self));

				var hideAllOtherLabel = VC.Utils.GetResource('hideAllOtherLabel');
				this.appendItem(
					'hideAllOther',
					hideAllOtherLabel,
					self.hideAllOther.bind(self)
				);

				var isolateLabel = VC.Utils.GetResource('isolateLabel');
				this.appendItem('isolate', isolateLabel, self.isolate.bind(self));

				var resetViewLabel = VC.Utils.GetResource('resetViewLabel');
				this.appendItem('resetView', resetViewLabel, self.resetView.bind(self));

				var displayAllLabel = VC.Utils.GetResource('displayAllLabel');
				this.appendItem(
					'displayAll',
					displayAllLabel,
					self.displayAll.bind(self)
				);
			},

			open: function () {
				var selectionItems = this._viewer.getSelectionManager().getResults();

				for (var i = 0; i < selectionItems.length; i++) {
					this._onOpenCad(selectionItems[i]);
				}
			},

			fitAll: function () {
				var selectionItem = this._viewer.getSelectionManager().getLast();

				this._onFitAll(selectionItem);
			},

			visibility: function () {
				var selectionItem = this._viewer.getSelectionManager().getLast();

				this._onVisibility(selectionItem);
			},

			hideAllOther: function () {
				var selectionItem = this._viewer.getSelectionManager().getLast();

				this._onHideAllOther(selectionItem);
			},

			isolate: function () {
				var selectionItem = this._viewer.getSelectionManager().getLast();

				this._onIsolate(selectionItem);
			},

			resetView: function () {
				var selectionItem = this._viewer.getSelectionManager().getLast();

				this._onResetView(selectionItem);
			},

			displayAll: function () {
				var selectionItem = this._viewer.getSelectionManager().getLast();

				this._onDisplayAll(selectionItem);
			},

			setActiveItemId: function (activeItemId) {
				var self = this;
				self._activeItemId = activeItemId;
				if (self._isMenuItemEnabled()) {
					if (self._hiddenItems.indexOf('open') < 0) {
						self._contextItems.open.show();
						self._contextItems.seperator.show();
					}
					self._contextItems.isolate.show();
					var hideLabel = VC.Utils.GetResource('hideLabel');
					var showLabel = VC.Utils.GetResource('showLabel');
					self._contextItems.visibility.setText(
						self._isVisible() ? hideLabel : showLabel
					);
					self._contextItems.visibility.show();
					self._contextItems.hideAllOther.show();
				} else {
					self._contextItems.open.hide();
					self._contextItems.seperator.hide();
					self._contextItems.isolate.hide();
					self._contextItems.visibility.hide();
					self._contextItems.hideAllOther.hide();
				}
			},

			isVisible: function () {
				return this._isVisible();
			},

			_onContextLayerClick: function (event) {
				if (event.button === 2) {
					this.doContext(new Communicator.Point2(event.offsetX, event.offsetY));
				} else {
					if (event.button === 0) {
						this.hide();
					}
				}
			}
		})
	);
});
