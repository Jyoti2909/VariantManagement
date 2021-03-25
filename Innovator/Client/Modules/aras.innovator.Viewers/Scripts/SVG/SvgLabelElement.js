dojo.setObject(
	'VC.SVG.ActiveLabelElement',
	dojo.declare('ActiveLabelElement', VC.SVG.ActiveElement, {
		TextArea: null,
		TextElementHelper: null,
		TextAreaHeight: null,
		currX: null,
		currY: null,
		updateOptions: { all: 'all', tail: 'tail', head: 'head' },
		updateMode: 0,
		DPI: null,
		_textRows: 1,
		// For zooming of the tail
		initDeltaX: 0,
		initDeltaY: 0,
		pasteText: null,
		pasteStart: null,
		pasteEnd: null,

		constructor: function (fontSizePX) {
			this.FontSize = this._px2pt(fontSizePX);

			Object.defineProperty(this, 'isEditMode', {
				configurable: true,
				get: function () {
					return this.TextArea === document.activeElement;
				}
			});
		},

		OnTextAreaKeyPress: function (callElement) {
			callElement.checkText(callElement);
			var newWidth = callElement.TextArea.offsetWidth + callElement.Radius * 2;
			callElement.OX = newWidth;

			callElement.Refresh();

			if (
				(arguments[1].keyCode == 13 &&
					!arguments[1].ctrlKey &&
					!arguments[1].shiftKey) ||
				(arguments[1].keyCode == 13 && arguments[1].shiftKey) ||
				(arguments[1].keyCode == 13 && arguments[1].ctrlKey)
			) {
				callElement.OnTextAreaBlur(callElement);
				callElement.TextArea.blur();
				callElement.SelectMode = VC.SVG.ActiveElement.SelectMode.None;
				callElement.Refresh();
			}
		},

		OnMouseDblClick: function (callElement) {
			callElement.checkText(callElement);
			callElement.OnTextAreaFocus(callElement);
			callElement.Focus();
		},

		OnTextAreaMouseDown: function (callElement) {},

		OnTextAreaKeyUp: function (callElement) {
			var newWidth = callElement.TextArea.offsetWidth + callElement.Radius * 2;
			callElement.OX = newWidth;
			callElement.Refresh();
		},

		OnTextAreaFocus: function (callElement) {
			callElement.TextArea.style.visibility = 'visible';
			callElement.Text.Node.style.visibility = 'hidden';
			callElement.TextArea.focus();
		},

		OnTextAreaBlur: function (callElement) {
			callElement.TextArea.style.visibility = 'hidden';
			callElement.Text.Node.style.visibility = 'visible';
		},

		OnTopMouseDown: function (callElement) {
			callElement.updateMode = callElement.updateOptions.tail;
			callElement.selectedTop = arguments[1];
		},

		OnTopMouseUp: function (callElement) {},

		OnTailMouseDown: function (callElement) {
			callElement.updateMode = callElement.updateOptions.all;
		},

		OnHeadMouseDown: function (callElement) {
			callElement.updateMode = callElement.updateOptions.head;
		},

		OnInnerElementDown: function (callElement) {
			if (
				callElement.updateMode === callElement.updateOptions.tail ||
				callElement.updateMode === callElement.updateOptions.head
			) {
				arguments[1].stopPropagation();
			}
		},

		OnInputText: function (callElement) {
			var value = callElement.TextArea.value;

			if (
				callElement.pasteText &&
				value.indexOf(callElement.pasteText) !== -1
			) {
				var newValue = callElement.checkPasteText(callElement);
				var oldValue = callElement.HiddenTextArea.textContent;
				value =
					oldValue.substring(0, callElement.pasteStart) +
					newValue +
					oldValue.substring(callElement.pasteEnd, oldValue.length);
				callElement.TextArea.value = value;

				callElement.pasteText = callElement.pasteStart = callElement.pasteEnd = null;
			}

			callElement._updateTextAreaWidth(callElement, value);
			callElement.OX =
				callElement.TextArea.offsetWidth + callElement.Radius * 2;
			callElement.Refresh();
		},

		OnPasteText: function (e) {
			this.pasteText = window.clipboardData
				? window.clipboardData.getData('text')
				: e.clipboardData.getData('text/plain');
			this.pasteStart = e.currentTarget.selectionStart;
			this.pasteEnd = e.currentTarget.selectionEnd;
		},

		Draw: function (startX, startY, currX, currY, shiftKey) {
			this.OY = this.OX = (this._pt2px(this.FontSize) / 6) * 10;
			var width = this.Node.parentNode.width.baseVal.value;

			if (startY < this.OY + this.OY / 2) {
				startY = this.OY + this.OY / 2;
			}
			if (startX < this.OX / 2) {
				startX = this.OX / 2;
			}
			if (startX + this.OX / 2 > width) {
				startX = width - this.OX / 2;
			}

			this.startX = startX;
			this.startY = startY;
			this.Radius = this.OY / 2;
			this.X = +startX;
			this.Y = +startY - this.OY - this.OY / 2;

			// For zooming of the tail
			this.initDeltaX = this.X - this.startX;
			this.initDeltaY = this.Y - this.startY;
		},

		Move: function (x, y, shiftKey) {
			this.SelectMode = this.SelectOptions.Selected;
			this._move(x, y, shiftKey);

			this.Refresh();
		},

		_move: function (x, y, shiftKey) {
			if (!this.selectedPoint) {
				return;
			}

			if (this.updateMode == this.updateOptions.tail) {
				this.startX = x;
				this.startY = y;

				// For zooming of the tail
				this.initDeltaX = this.X - this.startX;
				this.initDeltaY = this.Y - this.startY;

				return;
			}
			var deltaX = x - this.selectedPoint.x;
			var deltaY = y - this.selectedPoint.y;

			this.selectedPoint.x = x;
			this.selectedPoint.y = y;
			this.X += deltaX;
			this.Y += deltaY;
			if (this.updateMode == this.updateOptions.all) {
				this.startX += deltaX;
				this.startY += deltaY;
			}

			// For zooming of the tail
			this.initDeltaX = this.X - this.startX;
			this.initDeltaY = this.Y - this.startY;
		},

		_addInnerElement: function () {
			var textLimit = 40;
			this.InnerElement = new VC.SVG.Group();

			this.InnerElement.LineWidth = 3;
			this.InnerElement.LineColor = this.LineColor ? this.LineColor : 'red';

			this.InnerRect = new VC.SVG.Rectangle();
			this.InnerRect.Background = 'white';
			this.InnerRect.Node.setAttribute('class', 'LabelRect');

			this.InnerTriangle = new VC.SVG.Triangle();
			this.InnerTriangle.Background = this.LineColor ? this.LineColor : 'red';

			VC.Utils.Page.AddEvent(
				this.InnerTriangle.Node,
				'mousedown',
				dojo.partial(this.OnTailMouseDown, this)
			);
			VC.Utils.Page.AddEvent(
				this.InnerElement.Node,
				'mousedown',
				dojo.partial(this.OnInnerElementDown, this)
			);
			VC.Utils.Page.AddEvent(
				this.InnerRect.Node,
				'mousedown',
				dojo.partial(this.OnHeadMouseDown, this)
			);
			VC.Utils.Page.AddEvent(
				this.InnerRect.Node,
				'dblclick',
				dojo.partial(this.OnTextAreaMouseDown, this)
			);
			VC.Utils.Page.AddEvent(
				this.InnerRect.Node,
				'click',
				dojo.partial(this.OnMouseDblClick, this)
			);

			this.Text = new VC.SVG.Text();
			this.Text.Node.style.whiteSpace = 'pre';
			this.Text.Node.style.pointerEvents = 'none';

			this.InnerElement.addChild(this.InnerTriangle);
			this.InnerElement.addChild(this.InnerRect);
			this.InnerElement.addChild(this.Text);

			this.TextArea = document.createElement('input');
			this.HiddenTextArea = document.createElement('span');

			document.body.appendChild(this.TextArea);
			document.body.appendChild(this.HiddenTextArea);
			this.TextArea.className = 'ResizableTextArea';
			this.HiddenTextArea.className = 'HiddenTextArea';
			this.TextArea.setAttribute('tabIndex', '-1');
			this.TextArea.setAttribute('maxlength', textLimit);
			this.TextArea.id = 'ResizableTextArea_' + VC.SVG.Shape.MakeName(6);
			this.TextArea.style.minWidth = '2px';
			this.TextArea.style.width = '2px';
			this.TextArea.style.zIndex = 10000;
			this._updateText();

			this.offset = !window.opera
				? this.TextArea.offsetHeight - this.TextArea.clientHeight
				: this.TextArea.offsetHeight +
				  parseInt(
						window
							.getComputedStyle(this.TextArea, null)
							.getPropertyValue('border-top-width')
				  );

			this.TextArea.addEventListener(
				'keypress',
				dojo.partial(this.OnTextAreaKeyPress, this)
			);
			this.TextArea.addEventListener(
				'input',
				dojo.partial(this.OnInputText, this)
			);
			this.TextArea.addEventListener(
				'paste',
				dojo.partial(dojo.hitch(this, this.OnPasteText))
			);
			this.TextArea.addEventListener(
				'keyup',
				dojo.partial(this.OnTextAreaKeyUp, this)
			);
			this.TextArea.addEventListener(
				'click',
				dojo.partial(this.OnTextAreaFocus, this)
			);
			this.TextArea.addEventListener(
				'blur',
				dojo.partial(this.OnTextAreaBlur, this)
			);
			this.TextArea.addEventListener(
				'mousedown',
				dojo.partial(this.OnTextAreaMouseDown, this)
			);

			var self = this;
			setTimeout(function () {
				self.Focus();
			}, 1);
		},

		_updateTextAreaWidth: function (callElement, value) {
			callElement.HiddenTextArea.textContent = value;
			callElement.HiddenTextArea.style.display = 'inline-block';
			callElement.TextArea.style.width =
				callElement.HiddenTextArea.clientWidth + 1 + 'px';
			callElement.HiddenTextArea.style.display = 'none';
		},

		_addSelection: function () {
			this._addSelectionTops();

			this.Frame = new VC.SVG.Group();
			this.Frame.Class = 'LabelFrame';
			this.FrameRect = new VC.SVG.Rectangle();
			this.FrameRect.Class = 'LabelFrame';
			this.FrameTriangle = new VC.SVG.Triangle();
			this.FrameTriangle.Class = 'LabelFrame';

			this.Frame.addChild(this.FrameTriangle);
			this.Frame.addChild(this.FrameRect);
		},

		_arrangeInnerElements: function () {
			this.updateHead();
			this.updateTail();
			this._updateText();
		},

		getDistance: function (x, y) {
			var distances = [];
			distances.push(
				Math.sqrt(
					Math.pow(this.InnerRect.X - x, 2) + Math.pow(this.InnerRect.Y - y, 2)
				)
			);
			distances.push(
				Math.sqrt(
					Math.pow(this.InnerRect.X + this.InnerRect.OX - x, 2) +
						Math.pow(this.InnerRect.Y - y, 2)
				)
			);
			distances.push(
				Math.sqrt(
					Math.pow(this.InnerRect.X + this.InnerRect.OX - x, 2) +
						Math.pow(this.InnerRect.Y + this.InnerRect.OY - y, 2)
				)
			);
			distances.push(
				Math.sqrt(
					Math.pow(this.InnerRect.X - x, 2) +
						Math.pow(this.InnerRect.Y + this.InnerRect.OY - y, 2)
				)
			);

			for (var i in this.InnerTriangle.pointList) {
				if (
					this.InnerTriangle.pointList[i][0] &&
					this.InnerTriangle.pointList[i][1]
				) {
					distances.push(
						Math.sqrt(
							Math.pow(this.InnerTriangle.pointList[i][0] - x, 2) +
								Math.pow(this.InnerTriangle.pointList[i][1] - y, 2)
						)
					);
				}
			}
			if (
				x >= this.InnerRect.X &&
				x <= this.InnerRect.X + this.InnerRect.OX &&
				y >= this.InnerRect.Y &&
				y <= this.InnerRect.Y + this.InnerRect.OY
			) {
				this.updateMode = this.updateOptions.head;
				this.OnTextAreaFocus(this);
			} else {
				//	 ______
				//  A\    /C	D=(Px-Ax)*(By-Ay)-(Py-Ay)*(Bx-Ax) :
				//	  \*P/			1. if D=0 - point lies on the line
				//     \/			2. if D<0 - point lies to the left of the line
				//     B			3. if D>0 - point lies to the right of the line
				var Ax = this.InnerTriangle.pointList[0][0];
				var Ay = this.InnerTriangle.pointList[0][1];
				var Bx = this.InnerTriangle.pointList[1][0];
				var By = this.InnerTriangle.pointList[1][1];
				var Cx = this.InnerTriangle.pointList[2][0];
				var Cy = this.InnerTriangle.pointList[2][1];
				if (
					(x - Ax) * (By - Ay) - (y - Ay) * (Bx - Ax) <= 0 &&
					(x - Bx) * (Cy - By) - (y - By) * (Cx - Bx) <= 0 &&
					(x - Cx) * (Ay - Cy) - (y - Cy) * (Ax - Cx) <= 0
				) {
					this.updateMode = this.updateOptions.all;
				} else {
					this.updateMode = this.updateOptions.tail;
				}
			}
			return Math.min.apply(Math, distances);
		},

		checkText: function (callElement) {
			var lineWidth = this.OY / 5;
			var width = this.Node.parentNode.width.baseVal.value;
			if (
				this.X - this.OX / 2 - lineWidth < 0 ||
				this.X + this.OX / 2 + lineWidth >= width
			) {
				callElement.TextArea.blur();
			}
		},

		checkPasteText: function (callElement) {
			var hiddenCanvas = document.createElement('canvas');
			hiddenCanvas.style.display = 'none';
			document.body.appendChild(hiddenCanvas);
			var length = 0;

			if (this.pasteText) {
				var ctx = hiddenCanvas.getContext('2d');
				var fontFamily = this.FontFamily ? this.FontFamily : 'Tahoma';
				ctx.font = this._pt2px(this.FontSize) + 'px ' + fontFamily;
				length = ctx.measureText(this.pasteText).width;
			}

			var lineWidth = this.OY / 5;
			var width = this.Node.parentNode.width.baseVal.value;
			var left = this.X - this.OX / 2;
			var rigth = this.X + this.OX / 2;

			if (left - length / 2 < 0 || rigth + length / 2 >= width) {
				var availableLength = null;
				if (left - length / 2 < 0) {
					availableLength = left * 2;
				}
				if (rigth + length / 2 >= width) {
					availableLength = (width - rigth) * 2;
				}

				var charLength = length / this.pasteText.length;
				var charCount =
					Math.floor(availableLength / charLength) +
					(this.pasteEnd - this.pasteStart);
				this.pasteText = this.pasteText.substring(0, charCount);
			}
			hiddenCanvas.parentNode.removeChild(hiddenCanvas);

			return this.pasteText;
		},

		updateHead: function () {
			this.Radius = this.OY / 2;
			var seal = 0.9;
			var lineWidth = this.OY / 10;

			this.InnerRect.LineColor = this.LineColor ? this.LineColor : 'red';
			this.InnerRect.LineDash = this.LineDash;
			this.InnerRect.LineWidth = lineWidth;

			var shiftedX = this.X - this.OX / 2;

			var rectCoordinates = this._getRectSpace(
				shiftedX,
				this.Y,
				this.startX,
				this.startY
			);
			this.Frame.update(
				rectCoordinates.x,
				rectCoordinates.y,
				rectCoordinates.ox,
				rectCoordinates.oy
			);

			this.FrameRect.setRadius(this.Radius + lineWidth * seal);
			this.FrameRect.update(
				shiftedX - (lineWidth / 2) * seal,
				this.Y - (lineWidth / 2) * seal,
				this.OX + lineWidth * seal,
				this.OY + lineWidth * seal
			);

			this.InnerRect.setRadius(this.Radius);
			this.InnerRect.update(shiftedX, this.Y, this.OX, this.OY);
		},

		computeTangentPoints: function (cirleCentr, radius, startPoint, offset) {
			var vectorA = {
				x: cirleCentr.x - startPoint.x,
				y: cirleCentr.y - startPoint.y
			};
			var lengthA = Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y);
			var x = startPoint.x;
			var y = startPoint.y;

			vectorA.x = vectorA.x / lengthA;
			vectorA.y = vectorA.y / lengthA;

			startPoint.x = startPoint.x - offset * vectorA.x;
			startPoint.y = startPoint.y - offset * vectorA.y;
			lengthA = lengthA + offset;

			var alpha = Math.asin(radius / lengthA);
			var lengthB = Math.sqrt(lengthA * lengthA - radius * radius);

			var rotateMatrix = {
				x1: Math.cos(alpha),
				y1: Math.sin(alpha),
				x2: Math.cos(alpha + Math.PI / 2),
				y2: Math.sin(alpha + Math.PI / 2)
			};
			var vectorB = {
				x: rotateMatrix.x1 * vectorA.x + rotateMatrix.x2 * vectorA.y,
				y: rotateMatrix.y1 * vectorA.x + rotateMatrix.y2 * vectorA.y
			};
			var tangentPointB = {
				x: startPoint.x + vectorB.x * lengthB,
				y: startPoint.y + vectorB.y * lengthB
			};

			rotateMatrix = {
				x1: Math.cos(-alpha),
				y1: Math.sin(-alpha),
				x2: Math.cos(-alpha + Math.PI / 2),
				y2: Math.sin(-alpha + Math.PI / 2)
			};

			var vectorC = {
				x: rotateMatrix.x1 * vectorA.x + rotateMatrix.x2 * vectorA.y,
				y: rotateMatrix.y1 * vectorA.x + rotateMatrix.y2 * vectorA.y
			};
			var tangentPointC = {
				x: startPoint.x + vectorC.x * lengthB,
				y: startPoint.y + vectorC.y * lengthB
			};

			var tangentPoints;
			if (isNaN(alpha)) {
				tangentPoints = { x1: x, y1: y, x2: x, y2: y, startX: x, startY: y };
			} else {
				tangentPoints = {
					x1: tangentPointB.x,
					y1: tangentPointB.y,
					x2: tangentPointC.x,
					y2: tangentPointC.y,
					startX: x,
					startY: y
				};
			}

			return tangentPoints;
		},

		updateTail: function () {
			var seal = 0.9;
			this.Radius = this.OY / 2;
			var lineWidth = this.OY / 10;
			var shiftedX = this.X - this.OX / 2;

			this.FrameTriangle.LineDash = this.LineDash;
			this.FrameTriangle.LineWidth = lineWidth;

			var cirleCentr = { x: shiftedX + this.OX / 2, y: this.Y + this.OY / 2 };
			var outerRadius = this.Radius + (lineWidth / 2) * seal;
			var startPoint = { x: this.startX, y: this.startY };
			var offset = lineWidth * seal;
			var tangentPoints = this.computeTangentPoints(
				cirleCentr,
				outerRadius,
				startPoint,
				offset
			);

			this.FrameTriangle.update(
				{
					x: tangentPoints.x1,
					y: tangentPoints.y1
				},
				{
					x: tangentPoints.startX,
					y: tangentPoints.startY
				},
				{
					x: tangentPoints.x2,
					y: tangentPoints.y2
				}
			);

			outerRadius = this.Radius;
			startPoint = { x: this.startX, y: this.startY };
			offset = 0.0;
			tangentPoints = this.computeTangentPoints(
				cirleCentr,
				outerRadius,
				startPoint,
				offset
			);

			this.InnerTriangle.LineColor = this.LineColor ? this.LineColor : 'red';
			this.InnerTriangle.Background = this.LineColor ? this.LineColor : 'red';
			this.InnerTriangle.update(
				{
					x: tangentPoints.x1,
					y: tangentPoints.y1
				},
				{
					x: tangentPoints.startX,
					y: tangentPoints.startY
				},
				{
					x: tangentPoints.x2,
					y: tangentPoints.y2
				}
			);
		},

		_getDPI: function () {
			if (this.DPI !== null) {
				return DPI;
			}
			var outer = document.createElement('div');
			document.body.appendChild(outer);
			outer.style.position = 'absolute';
			outer.style.width = '1in';
			var ret = outer.offsetWidth;
			outer.style.display = 'none';
			return ret;
		},

		_pt2px: function (pt) {
			var dpi = this._getDPI();
			return (+pt / 72) * dpi;
		},

		_px2pt: function (px) {
			var dpi = this._getDPI();
			return (+px * 72) / dpi;
		},

		_updateText: function () {
			var rect = this.InnerRect.Node.getBoundingClientRect();
			var fontFamily = this.FontFamily ? this.FontFamily : 'Tahoma';
			var color = '#505050';

			this.TextArea.style.color = color;
			this.TextArea.style.fontSize = this.HiddenTextArea.style.fontSize =
				this.FontSize + 'pt';
			this.TextArea.style.lineHeight = this.HiddenTextArea.style.lineHeight =
				(this.OY / 10) * 4 + 'px';
			this.TextArea.style.height = this.FontSize + 'pt';
			this.HiddenTextArea.style.height = (this.OY / 10) * 4 + 'px';
			this.TextArea.style.marginLeft = this.Radius + 2 + 'px';
			this.TextArea.style.marginTop = this.OY / 9 - 2 + 'px';
			this.TextArea.style.fontFamily = this.HiddenTextArea.style.fontFamily = fontFamily;

			this.TextArea.style.top = +rect.top + this.OY * 0.17 - 2.0 + 'px';
			this.TextArea.style.left = +rect.left + 'px';
			this.Text.Node.textContent = this.HiddenTextArea.textContent;

			this.Text.Node.setAttribute(
				'x',
				+this.InnerRect.Node.getAttribute('rx') + this.InnerRect.X
			);
			this.Text.Node.setAttribute(
				'y',
				this.InnerRect.Y + this.InnerRect.OY - this.OY / 3
			);
			this.Text.Node.setAttribute('font-family', fontFamily);

			this.Text.Node.setAttribute('stroke-width', 0);
			this.Text.Node.setAttribute('fill', color);
		},

		_arrangeGroupNode: function () {
			this.addChild(this.Frame);
			this.addChild(this.InnerElement);
			this.Node.appendChild(this.Tops[0].Node);
		},

		_addSelectionTops: function () {
			var top = new VC.SVG.Circle();
			top.Class = 'Top';
			top.Name = 'BottomMiddle';
			top.Number = 1;

			VC.Utils.Page.AddEvent(
				top.Node,
				'mousedown',
				dojo.partial(this.OnTopMouseDown, this, top.Number)
			);
			top.setAttribute('cursor', 'default');
			this.Tops.push(top);
		},

		_arrangeTops: function () {
			var topRadius = VC.SVG.Shape.GetProperty('top');
			var lineWidth = this.InnerElement.LineWidth
				? this.InnerElement.LineWidth
				: 2;
			this.Tops[0].update(this.startX, this.startY, topRadius);
		},

		_refreshSelection: function () {
			switch (this.SelectMode) {
				case this.SelectOptions.Contoured:
					this._showContour();
					this._showInnerElement();
					this._hideSelection();
					break;
				case this.SelectOptions.Selected:
					this._showSelection();
					this._showInnerElement();
					this._hideContour();
					break;
				case this.SelectOptions.None:
					this._hideContour();
					this._hideSelection();
					this._showInnerElement();
					break;
			}
		},

		_showContour: function () {},

		_hideContour: function () {},

		_showInnerElement: function () {
			this.TextArea.style.display = 'block';
		},

		_hideInnerElement: function () {
			this.TextArea.style.display = 'none';
		},

		isValid: function () {
			return true;
		},

		ScaleX: function (factor) {
			if (factor <= 0) {
				return;
			}
			var delta = this.X - this.startX;
			this.startX *= factor;

			// Zoom the tail if initial tail's length by axis X is longer than 2*OY
			this.initDeltaX *= factor;
			if (Math.abs(delta) >= this.OY * 2) {
				var newDelta = delta * factor;
				if (
					Math.abs(newDelta) < this.OY * 2 ||
					Math.abs(this.initDeltaX) < Math.abs(newDelta)
				) {
					if (newDelta < 0) {
						delta = -this.OY * 2;
					} else {
						delta = this.OY * 2;
					}
				} else {
					if (Math.abs(delta) === this.OY * 2) {
						delta = this.initDeltaX;
					} else {
						delta = newDelta;
					}
				}
			}

			this.X = this.startX + delta;

			this.Refresh();
		},

		ScaleY: function (factor) {
			if (factor <= 0) {
				return;
			}
			var delta = this.Y - this.startY;
			this.startY *= factor;

			// Zoom the tail if initial tail's length by axis Y is longer than 2*OY
			this.initDeltaY *= factor;
			if (Math.abs(delta) >= this.OY * 2) {
				var newDelta = delta * factor;
				if (
					Math.abs(newDelta) < this.OY * 2 ||
					Math.abs(this.initDeltaY) < Math.abs(newDelta)
				) {
					if (newDelta < 0) {
						delta = -this.OY * 2;
					} else {
						delta = this.OY * 2;
					}
				} else {
					if (Math.abs(delta) === this.OY * 2) {
						delta = this.initDeltaY;
					} else {
						delta = newDelta;
					}
				}
			}

			this.Y = this.startY + delta;

			this.Refresh();
		},

		GetOuterXml: function () {
			var properties = [];

			var resultXml = this.getXml();
			var tailXml = this.InnerTriangle.getXml();
			var rectXml = this.InnerRect.getXml();

			var textNode = new VC.SVG.Text();

			for (var i = 0; i < this.TextArea.attributes.length; i++) {
				textNode.Node.setAttribute(
					this.TextArea.attributes[i].name,
					this.TextArea.attributes[i].value
				);
			}

			textNode.Node.style.visibility = 'visible';
			textNode.Node.style.whiteSpace = 'pre';
			textNode.Node.setAttribute(
				'x',
				+this.InnerRect.Node.getAttribute('rx') + this.InnerRect.X
			);
			textNode.Node.setAttribute(
				'y',
				this.InnerRect.Y + this.InnerRect.OY - this.OY / 3
			);
			textNode.Node.setAttribute('xml:space', 'preserve');
			textNode.Background = '#505050';
			textNode.LineColor = 'transparent';

			textNode.Node.textContent = this.TextArea.value;

			var textXml = textNode.getXml();

			resultXml.appendChild(tailXml);
			resultXml.appendChild(rectXml);
			resultXml.appendChild(textXml);

			resultXml.setAttribute('complextype', 'label');

			return resultXml;
		},

		SetXml: function (xmldoc) {
			var innerRect = xmldoc.getElementsByTagName('rect')[0];
			var innerTriangle = xmldoc.getElementsByTagName('polygon')[0];

			this.InnerRect.applyXml(innerRect);
			this.InnerTriangle.applyXml(innerTriangle);

			this.applyXml(xmldoc);

			var textstyle = xmldoc
				.getElementsByTagName('text')[0]
				.getAttribute('style')
				.split(';');
			var styleobj = {};
			for (var i in textstyle) {
				var attribute = textstyle[i].trim().replace(':', '').split(' ');
				styleobj[attribute[0]] = attribute[1];
			}

			this.FontFamily = styleobj['font-family']
				? styleobj['font-family']
				: 'Arial';
			this.FontSize = styleobj['font-size'] ? styleobj['font-size'] : '14';
			this.TextArea.style.color = styleobj.color ? styleobj.color : 'black';

			this.TextArea.value = this.HiddenTextArea.textContent = xmldoc.getElementsByTagName(
				'text'
			)[0].textContent;

			if (this.InnerTriangle.pointList.length === 0) {
				this.InnerTriangle.getPoints();
			}

			this.startX = this.InnerTriangle.pointList[1][0];
			this.startY = this.InnerTriangle.pointList[1][1];

			this.Refresh();
		},

		Fill: function (rgb) {
			this.TextArea.style.background = rgb;
		},

		Delete: function () {
			this.TextArea.parentNode.removeChild(this.TextArea);
			this.Node.parentNode.removeChild(this.Node);
		},

		Focus: function () {
			this.OnTextAreaFocus(this);
		}
	})
);
