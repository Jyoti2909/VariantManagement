var DragAndDrop;
(function (DragAndDrop) {
	var DragEventHelper = (function () {
		function DragEventHelper(element) {
			this.element = element;
			this.dragTimers = [];
			this.dragEnterHandlers = [];
			this.dragLeaveHandlers = [];

			this.onDragEnter = this.onDragEnter.bind(this);
			this.onDragLeave = this.onDragLeave.bind(this);
			this.onDragOver = this.onDragOver.bind(this);
			this.onDrop = this.onDrop.bind(this);
			element.addEventListener('dragenter', this.onDragEnter, false);
			element.addEventListener('dragleave', this.onDragLeave, false);
			element.addEventListener('dragover', this.onDragOver, false);
			element.addEventListener('drop', this.onDrop, false);
		}
		DragEventHelper.prototype.addDragEnterListener = function (handler) {
			this.dragEnterHandlers.push(handler);
		};

		DragEventHelper.prototype.addDragLeaveListener = function (handler) {
			this.dragLeaveHandlers.push(handler);
		};

		DragEventHelper.prototype.removeListeners = function () {
			this.dragEnterHandlers = [];
			this.dragLeaveHandlers = [];
			this.element.removeEventListener('dragenter', this.onDragEnter);
			this.element.removeEventListener('dragleave', this.onDragLeave);
			this.element.removeEventListener('dragover', this.onDragOver);
			this.element.removeEventListener('drop', this.onDrop);
		};

		DragEventHelper.prototype.onDragEnter = function (e) {
			var _this = this;
			setTimeout(function () {
				var timers = _this.dragTimers;
				_this.dragTimers = [];
				for (var i = 0; i < timers.length; i++) {
					clearTimeout(timers[i]);
				}
			}, 0);
			if (!this.dragStarted) {
				this.dragStarted = true;
				this.dragEnterHandlers.forEach(function (handler) {
					handler(e);
				});
			}
			this.stopEvent(e);
			return false;
		};

		DragEventHelper.prototype.onDragLeave = function (e) {
			var _this = this;
			var dragTimer = setTimeout(function () {
				_this.dragStarted = false;
				_this.dragLeaveHandlers.forEach(function (handler) {
					handler(e);
				});
			}, 100);
			this.dragTimers.push(dragTimer);
			this.stopEvent(e);
			return false;
		};

		DragEventHelper.prototype.onDragOver = function (e) {
			if (e.dataTransfer && e.dataTransfer.dropEffect) {
				e.dataTransfer.dropEffect = 'none';
			}
			this.stopEvent(e);
			return false;
		};

		DragEventHelper.prototype.onDrop = function (e) {
			this.dragStarted = false;
			this.dragLeaveHandlers.forEach(function (handler) {
				handler(e);
			});
			this.stopEvent(e);
			return false;
		};

		DragEventHelper.prototype.stopEvent = function (e) {
			if (e.preventDefault) {
				e.preventDefault();
			}
			if (e.stopPropagation) {
				e.stopPropagation();
			}
		};
		return DragEventHelper;
	})();
	DragAndDrop.DragEventHelper = DragEventHelper;
})(DragAndDrop || (DragAndDrop = {}));
