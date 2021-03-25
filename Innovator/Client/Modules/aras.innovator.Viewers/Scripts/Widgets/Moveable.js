require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Widgets.Moveable',
		declare(null, {
			container: null,
			moveableElement: null,
			moveableInitialor: null,

			onMoveEnd: function () {},

			constructor: function (container, moveableElement, moveableInitialor) {
				this.container = container;
				this.moveableElement = moveableElement;
				this.moveableInitialor = moveableInitialor;

				this.moveDialog();
			},

			moveDialog: function () {
				var mouseOffset = null;

				function fixEvent(e) {
					e = e || window.event;

					if (e.clientX !== null) {
						var html = document.documentElement;
						var owner = this.container;

						e.pageX =
							e.clientX +
							((html && html.scrollLeft) || (owner && owner.scrollLeft) || 0) -
							(html.clientLeft || 0);
						e.pageY =
							e.clientY +
							((html && html.scrollTop) || (owner && owner.scrollTop) || 0) -
							(html.clientTop || 0);
					}

					if (!e.which && e.button) {
						e.which =
							e.button & 1 ? 1 : e.button & 2 ? 3 : e.button & 4 ? 2 : 0;
					}

					return e;
				}

				function getMouseOffset(target, e) {
					var docPos = dojo.partial(dojo.hitch(this, getPosition), target)();

					return { x: e.pageX - docPos.x, y: e.pageY - docPos.y };
				}

				function mouseUp() {
					document.onmousemove = null;
					document.onmouseup = null;
					document.ondragstart = null;
					this.container.onselectstart = null;
					this.container.style.pointerEvents = 'auto';

					this._onMoveEnd();
				}

				function mouseMove(e) {
					e = dojo.partial(dojo.hitch(this, fixEvent), e)();
					var style = this.moveableElement.style;
					style.position = 'absolute';

					this.container.style.pointerEvents = 'none';

					var dialogOffsetX = e.pageX - mouseOffset.x;
					if (
						dialogOffsetX > 0 &&
						dialogOffsetX + this.moveableElement.clientWidth <
							this.container.clientWidth
					) {
						style.left = dialogOffsetX + 'px';
					}

					if (e.pageY > 0 && e.pageY < this.container.clientHeight) {
						if (e.pageY - mouseOffset.y >= VC.Widgets.Moveable.topLimiter) {
							style.top = e.pageY - mouseOffset.y + 'px';
						}
					}

					return false;
				}

				function mouseDown(e) {
					e = dojo.partial(dojo.hitch(this, fixEvent), e)();

					if (e.which !== 1) {
						return;
					}

					mouseOffset = dojo.partial(
						dojo.hitch(this, getMouseOffset),
						this.moveableElement,
						e
					)();
					document.onmousemove = dojo.hitch(this, mouseMove);
					document.onmouseup = dojo.hitch(this, mouseUp);
					document.ondragstart = function () {
						return false;
					};
					this.container.onselectstart = function () {
						return false;
					};

					return false;
				}

				function getPosition(e) {
					var left = 0;
					var top = 0;

					while (e.offsetParent) {
						left += e.offsetLeft;
						top += e.offsetTop;
						e = e.offsetParent;
					}

					left += e.offsetLeft;
					top += e.offsetTop;

					return { x: left, y: top };
				}

				this.moveableInitialor.onmousedown = dojo.hitch(this, mouseDown);
			},

			_onMoveEnd: function () {
				this.onMoveEnd();
			}
		})
	);
});
