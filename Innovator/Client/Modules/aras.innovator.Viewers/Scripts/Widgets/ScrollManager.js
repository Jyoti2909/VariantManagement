require(['dojo/_base/declare', 'dojo/dom-construct'], function (
	declare,
	domConstruct
) {
	var verticalScrollTemplate =
		'<div id="VerticalScroll" class="Scroll Vertical">' +
		'<div class="Arrow Top"></div>' +
		'<div class="PointerContainer">' +
		'<div id="VerticalPointer" class="Pointer"></div>' +
		'</div>' +
		'<div class="Arrow Bottom"></div>' +
		'</div>';
	var horizontalScrollTemplate =
		'<div id="HorizontalScroll" class="Scroll Horizontal">' +
		'<div class="Arrow Left"></div>' +
		'<div class="PointerContainer">' +
		'<div id="HorizontalPointer" class="Pointer"></div>' +
		'</div>' +
		'<div class="Arrow Right"></div>' +
		'</div>';

	return dojo.setObject(
		'VC.Widgets.ScrollManager',
		(function () {
			declare('VC.Widgets.Scroll', null, {
				_scrollWidth: 17,
				_scrollArrowWidth: 15,
				_scrollPointerWidth: 15,
				_scrollInterval: 5,
				_isScrolling: null,
				_scrollProcessId: null,
				_startScrollPoint: null,
				_referenceLenght: null,

				domNode: null,
				pointerNode: null,
				pointerContainerNode: null,
				firstArrowNode: null,
				secondArrowNode: null,

				isActive: null,
				container: null,
				availableLenght: null,
				referencePosition: null,

				onChange: function (referencePosition) {},

				consctructor: function () {
					this._isScrolling = false;
					this.isActive = true;

					Object.defineProperty(this, 'availableLenght', {
						get: function () {
							throw new Error('Scroll: availableLenght must be overloaded');
						}
					});

					Object.defineProperty(this, 'pointerLength', {
						get: function () {
							throw new Error('Scroll: pointerLength must be overloaded');
						}
					});

					Object.defineProperty(this, 'currentPosition', {
						get: function () {
							throw new Error('Scroll: currentPosition must be overloaded');
						},

						set: function (value) {
							throw new Error('Scroll: currentPosition must be overloaded');
						}
					});

					Object.defineProperty(this, 'delta', {
						get: function () {
							throw new Error('Scroll: delta must be overloaded');
						}
					});
				},

				disable: function () {
					this.isActive = false;

					this.firstArrowNode.disable(true);
					this.secondArrowNode.disable(true);
					this.pointerNode.visible(false);
				},

				enable: function () {
					this.isActive = true;

					this.firstArrowNode.disable(false);
					this.secondArrowNode.disable(false);
					this.pointerNode.visible(true);
				},

				hide: function () {
					this.domNode.visible(false);
				},

				show: function () {
					this.domNode.visible(true);
				},

				setPosition: function (referencePosition) {
					this.referencePosition = referencePosition;
					this.currentPosition = this.referencePosition * this.delta;
				},

				_bindHandlers: function () {
					this.pointerNode.addEventListener(
						'mousedown',
						dojo.hitch(this, this._onPointerMouseDown)
					);
					document.addEventListener(
						'mousemove',
						dojo.hitch(this, this._onPointerMouseMove)
					);
					document.addEventListener(
						'mouseup',
						dojo.hitch(this, this._onPointerMouseUp)
					);
					this.firstArrowNode.addEventListener(
						'mousedown',
						dojo.hitch(this, this._onArrowDecMouseDown)
					);
					this.firstArrowNode.addEventListener(
						'mouseup',
						dojo.hitch(this, this._onArrowMouseUp)
					);
					this.secondArrowNode.addEventListener(
						'mousedown',
						dojo.hitch(this, this._onArrowIncMouseDown)
					);
					this.secondArrowNode.addEventListener(
						'mouseup',
						dojo.hitch(this, this._onArrowMouseUp)
					);
				},

				_onPointerMouseDown: function () {
					this._isScrolling = true;
				},

				_onPointerMouseUp: function () {
					this._isScrolling = false;
				},

				_onArrowIncMouseDown: function () {
					var self = this;
					self._increaseScrollPosition.apply(self);

					this._scrollProcessId = setInterval(function () {
						self._increaseScrollPosition.apply(self);
					}, 150);
					VC.Utils.addClass(arguments[0].target, 'Active');
				},

				_onArrowDecMouseDown: function () {
					var self = this;
					self._decreaseScrollPosition.apply(self);

					this._scrollProcessId = setInterval(function () {
						self._decreaseScrollPosition.apply(self);
					}, 150);
					VC.Utils.addClass(arguments[0].target, 'Active');
				},

				_onArrowMouseUp: function () {
					clearInterval(this._scrollProcessId);
					VC.Utils.removeClass(arguments[0].target, 'Active');
				},

				_increaseScrollPosition: function () {
					this.currentPosition += this._scrollInterval;
					this.referencePosition = this.currentPosition / this.delta;
					this._onChange(-this._scrollInterval / this.delta);
				},

				_decreaseScrollPosition: function () {
					this.currentPosition -= this._scrollInterval;
					this.referencePosition = this.currentPosition / this.delta;
					this._onChange(this._scrollInterval / this.delta);
				},

				_onChange: function (offset) {
					this.onChange(offset);
				},

				placeAt: function (container) {
					this.container = container;
					this.container.appendChild(this.domNode);
				}
			});

			declare('VC.Widgets.VerticalScroll', VC.Widgets.Scroll, {
				constructor: function (referenceLenght) {
					Object.defineProperty(this, 'pointerLength', {
						get: function () {
							return this.pointerNode.offsetHeight;
						}
					});

					Object.defineProperty(this, 'availableLenght', {
						get: function () {
							return (
								this.pointerContainerNode.clientHeight - this.pointerLength
							);
						}
					});

					Object.defineProperty(this, 'currentPosition', {
						get: function () {
							return parseInt(this.pointerNode.style.top.replace('px', ''));
						},

						set: function (value) {
							if (this.isActive) {
								if (value <= 0) {
									this.pointerNode.style.top = '0px';
								} else if (value >= this.availableLenght) {
									this.pointerNode.style.top = this.availableLenght + 'px';
								} else {
									this.pointerNode.style.top = value + 'px';
								}
							}
						}
					});

					Object.defineProperty(this, 'delta', {
						get: function () {
							var referenceLenght =
								this.referenceLenght === 0
									? this.availableLenght
									: this.referenceLenght;

							return this.availableLenght / referenceLenght;
						}
					});

					Object.defineProperty(this, 'referenceLenght', {
						get: function () {
							return this._referenceLenght - this.container.clientHeight;
						},

						set: function (value) {
							this._referenceLenght = value;
						}
					});

					this.referenceLenght = referenceLenght;
					this.domNode = domConstruct.toDom(verticalScrollTemplate);
				},

				placeAt: function (container) {
					this.inherited(arguments);

					this.pointerNode = document.getElementById('VerticalPointer');
					this.pointerContainerNode = this.domNode.getElementsByClassName(
						'PointerContainer'
					)[0];
					this.firstArrowNode = this.domNode.getElementsByClassName(
						'Arrow Top'
					)[0];
					this.secondArrowNode = this.domNode.getElementsByClassName(
						'Arrow Bottom'
					)[0];

					this._bindHandlers();
				},

				resize: function (referenceLenght) {
					if (referenceLenght) {
						this.referenceLenght = referenceLenght;
					}

					if (this.container.clientHeight >= this._referenceLenght) {
						this.disable();
					} else {
						this.enable();
					}
				},

				_onPointerMouseDown: function (event) {
					this.inherited(arguments);
					this._startScrollPoint = event.clientY;
				},

				_onPointerMouseMove: function (event) {
					if (this._isScrolling) {
						var offset = event.clientY - this._startScrollPoint;
						this._startScrollPoint = event.clientY;

						this._onChange(-offset / this.delta);
					}
				}
			});

			declare('VC.Widgets.HorizontalScroll', VC.Widgets.Scroll, {
				constructor: function (referenceLenght) {
					Object.defineProperty(this, 'pointerLength', {
						get: function () {
							return this.pointerNode.offsetWidth;
						}
					});

					Object.defineProperty(this, 'availableLenght', {
						get: function () {
							return this.pointerContainerNode.clientWidth - this.pointerLength;
						}
					});

					Object.defineProperty(this, 'currentPosition', {
						get: function () {
							return parseInt(this.pointerNode.style.left.replace('px', ''));
						},

						set: function (value) {
							if (this.isActive) {
								if (value <= 0) {
									this.pointerNode.style.left = '0px';
								} else if (value >= this.availableLenght) {
									this.pointerNode.style.left = this.availableLenght + 'px';
								} else {
									this.pointerNode.style.left = value + 'px';
								}
							}
						}
					});

					Object.defineProperty(this, 'delta', {
						get: function () {
							var referenceLenght =
								this.referenceLenght === 0
									? this.availableLenght
									: this.referenceLenght;

							return this.availableLenght / referenceLenght;
						}
					});

					Object.defineProperty(this, 'referenceLenght', {
						get: function () {
							return this._referenceLenght - this.container.clientWidth;
						},

						set: function (value) {
							this._referenceLenght = value;
						}
					});

					this.referenceLenght = referenceLenght;
					this.domNode = domConstruct.toDom(horizontalScrollTemplate);
				},

				placeAt: function (container) {
					this.inherited(arguments);

					this.pointerNode = document.getElementById('HorizontalPointer');
					this.pointerContainerNode = this.domNode.getElementsByClassName(
						'PointerContainer'
					)[0];
					this.firstArrowNode = this.domNode.getElementsByClassName(
						'Arrow Left'
					)[0];
					this.secondArrowNode = this.domNode.getElementsByClassName(
						'Arrow Right'
					)[0];

					this._bindHandlers();
				},

				resize: function (referenceLenght) {
					if (referenceLenght) {
						this.referenceLenght = referenceLenght;
					}

					if (this.container.clientWidth >= this._referenceLenght) {
						this.disable();
					} else {
						this.enable();
					}
				},

				_onPointerMouseDown: function (event) {
					this.inherited(arguments);
					this._startScrollPoint = event.clientX;
				},

				_onPointerMouseMove: function (event) {
					if (this._isScrolling) {
						var offset = event.clientX - this._startScrollPoint;
						this._startScrollPoint = event.clientX;

						this._onChange(-offset / this.delta);
					}
				}
			});

			return declare(null, {
				_verticalScroll: null,
				_horizontalScroll: null,

				onVerticalScroll: function () {},
				onHorizontalScroll: function () {},

				constructor: function (referenceWidth, referenceHeight) {
					this._verticalScroll = new VC.Widgets.VerticalScroll(referenceHeight);
					this._horizontalScroll = new VC.Widgets.HorizontalScroll(
						referenceWidth
					);

					this._verticalScroll.onChange = dojo.hitch(
						this,
						this._onVerticalScroll
					);
					this._horizontalScroll.onChange = dojo.hitch(
						this,
						this._onHorizontalScroll
					);

					Object.defineProperty(this, 'referenceX', {
						get: function () {
							return this._horizontalScroll.referencePosition;
						}
					});

					Object.defineProperty(this, 'referenceY', {
						get: function () {
							return this._verticalScroll.referencePosition;
						}
					});

					Object.defineProperty(this, 'referenceWidth', {
						get: function () {
							return this._horizontalScroll._referenceLenght;
						}
					});

					Object.defineProperty(this, 'referenceHeight', {
						get: function () {
							return this._verticalScroll._referenceLenght;
						}
					});
				},

				placeAt: function (container) {
					window.addEventListener('resize', dojo.hitch(this, this._onResize));

					this._verticalScroll.placeAt(container);
					this._horizontalScroll.placeAt(container);

					this._onResize();
				},

				setPosition: function (referenceX, referenceY) {
					if (
						referenceX >= 0 &&
						referenceX <= this._horizontalScroll._referenceLenght
					) {
						this._horizontalScroll.setPosition(referenceX);
					}

					if (
						referenceY >= 0 &&
						referenceY <= this._verticalScroll._referenceLenght
					) {
						this._verticalScroll.setPosition(referenceY);
					}
				},

				recalculate: function (referenceWidth, referenceHeight) {
					this._verticalScroll.resize(referenceHeight);
					this._horizontalScroll.resize(referenceWidth);
				},

				_onResize: function () {
					this._verticalScroll.resize();
					this._horizontalScroll.resize();
				},

				_onVerticalScroll: function (offset) {
					this.onVerticalScroll(0, offset);
				},

				_onHorizontalScroll: function (offset) {
					this.onHorizontalScroll(offset, 0);
				}
			});
		})()
	);
});
