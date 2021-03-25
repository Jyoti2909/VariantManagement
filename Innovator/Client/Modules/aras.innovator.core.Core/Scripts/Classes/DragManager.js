var DragAndDrop;
(function (DragAndDrop) {
	var DragManager = (function () {
		function DragManager(win) {
			if (typeof win === 'undefined') {
				win = window;
			}
			this.win = win;
			this.childs = [];
			this.dropboxes = [];
			this.dragHelper = new DragAndDrop.DragEventHelper(win);
			this.onDragHandler = this.onDragHandler.bind(this);
			this.dragHelper.addDragEnterListener(this.onDragHandler);
			this.dragHelper.addDragLeaveListener(this.onDragHandler);

			this.eventAggregator = new DragEventAggregator();
			this.onGlobalDragEnterHandler = this.onGlobalDragEnterHandler.bind(this);
			this.onGlobalDragLeaveHandler = this.onGlobalDragLeaveHandler.bind(this);
			this.eventAggregator.addDragEnterListener(this.onGlobalDragEnterHandler);
			this.eventAggregator.addDragLeaveListener(this.onGlobalDragLeaveHandler);

			try {
				if (win.parent.dragManager) {
					this.parent = win.parent.dragManager;
					this.parent.addChildManager(this);
				}
			} catch (ex) {
				this.parent = null;
			}
		}
		DragManager.prototype.deinit = function () {
			if (this.parent) {
				this.parent.removeChildManager(this);
				this.parent = null;
			}
			this.dragHelper.removeListeners();
			this.dragHelper = null;
			this.eventAggregator.removeListeners();
			this.eventAggregator = null;
		};

		DragManager.prototype.addDropbox = function (dropbox) {
			this.dropboxes.push(dropbox);
		};

		DragManager.prototype.removeDropbox = function (dropbox) {
			var index = this.dropboxes.indexOf(dropbox);
			if (index > -1) {
				this.dropboxes.splice(index, 1);
			}
		};

		DragManager.prototype.addChildManager = function (child) {
			this.childs.push(child);
		};

		DragManager.prototype.removeChildManager = function (child) {
			var index = this.childs.indexOf(child);
			if (index > -1) {
				this.childs.splice(index, 1);
			}
		};

		DragManager.prototype.onDragHandler = function (e) {
			var topManager = this.findTopManager();
			topManager.eventAggregator.onDrag(e);
		};

		DragManager.prototype.onGlobalDragEnterHandler = function (e) {
			var maxLevels = [];
			this.childs.forEach(function (child) {
				var levels = [];
				child.dropboxes.forEach(function (dropbox) {
					if (dropbox.dropPriority > 0) {
						levels.push(dropbox.dropPriority);
					}
				});
				if (levels.length > 0) {
					var maxLevel = Math.max.apply(null, levels);
					if (maxLevel) {
						maxLevels.push(maxLevel);
					}
				}
			});
			this.traverseManagers(function (manager) {
				var maxPriority = Math.max.apply(null, maxLevels);
				manager.dropboxes.forEach(function (dropbox) {
					if (maxLevels.length > 0) {
						if (dropbox.dropPriority === maxPriority) {
							dropbox.onDragBrowserEnter(e);
						}
					} else {
						dropbox.onDragBrowserEnter(e);
					}
				});
			});
		};

		DragManager.prototype.onGlobalDragLeaveHandler = function (e) {
			this.traverseManagers(function (manager) {
				manager.dropboxes.forEach(function (dropbox) {
					dropbox.onDragBrowserLeave(e);
				});
			});
		};

		DragManager.prototype.traverseManagers = function (callback) {
			callback(this);
			this.childs.forEach(function (child) {
				try {
					child.traverseManagers(callback);
				} catch (ex) {
					console.error(ex);
				}
			});
		};

		DragManager.prototype.findTopManager = function () {
			var topManager = this;
			var parent = this.parent;
			while (parent) {
				topManager = parent;
				parent = topManager.parent;
			}
			return topManager;
		};
		return DragManager;
	})();
	DragAndDrop.DragManager = DragManager;

	var DragEventAggregator = (function () {
		function DragEventAggregator() {
			this.status = 0;
			this.dragEnterHandlers = [];
			this.dragLeaveHandlers = [];
		}
		DragEventAggregator.prototype.addDragEnterListener = function (handler) {
			this.dragEnterHandlers.push(handler);
		};

		DragEventAggregator.prototype.addDragLeaveListener = function (handler) {
			this.dragLeaveHandlers.push(handler);
		};

		DragEventAggregator.prototype.removeListeners = function () {
			this.dragEnterHandlers = [];
			this.dragLeaveHandlers = [];
		};

		DragEventAggregator.prototype.onDrag = function (e) {
			switch (e.type) {
				case 'dragenter':
					this.onDragEnter(e);
					break;
				case 'dragleave':
					this.onDragLeave(e);
					break;
				case 'drop':
					this.onDrop(e);
					break;
				default:
					break;
			}
		};

		DragEventAggregator.prototype.onDragEnter = function (e) {
			if (this.status === 0) {
				this.dragEnterHandlers.forEach(function (handler) {
					handler(e);
				});
			}
			this.status++;
		};

		DragEventAggregator.prototype.onDragLeave = function (e) {
			this.status--;
			if (this.status <= 0) {
				this.status = 0;
				this.dragLeaveHandlers.forEach(function (handler) {
					handler(e);
				});
			}
		};

		DragEventAggregator.prototype.onDrop = function (e) {
			this.status = 0;
			this.dragLeaveHandlers.forEach(function (handler) {
				handler(e);
			});
		};
		return DragEventAggregator;
	})();
	DragAndDrop.DragEventAggregator = DragEventAggregator;
})(DragAndDrop || (DragAndDrop = {}));

window.dragManager = window.dragManager || new DragAndDrop.DragManager(window);
window.addEventListener('beforeunload', function () {
	if (window.dragManager) {
		window.dragManager.deinit();
		delete window.dragManager;
	}
});
