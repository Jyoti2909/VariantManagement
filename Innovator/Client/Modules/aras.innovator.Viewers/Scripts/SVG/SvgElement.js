dojo.setObject(
	'VC.SVG.ActiveElement',
	(function () {
		dojo.declare('ActiveElement', VC.SVG.Group, {
			Contour: null,
			InnerElement: null,
			Frame: null,
			SelectMode: null,
			SelectOptions: {
				None: 'none',
				Selected: 'selected',
				Contoured: 'contoured'
			},
			Tops: null,
			InnerXml: '',
			MinSize: 5,

			selectedTop: null,
			selectedPoint: null,

			startSelect: false,

			OnSelect: null,

			constructor: function () {
				this.Tops = [];
				this._addInnerElement();
				this._addSelection();
				this._arrangeGroupNode();

				this.SelectMode = this.SelectOptions.None;

				VC.Utils.Page.AddEvent(
					this.Node,
					'mousedown',
					dojo.partial(this.OnMouseDown, this)
				);
				VC.Utils.Page.AddEvent(
					this.Node,
					'dblclick',
					dojo.partial(this.OnMouseDblClick, this)
				);

				VC.Utils.Page.AddEvent(
					this.Node,
					'mouseover',
					dojo.partial(this.OnMouseOver, this)
				);

				Object.defineProperty(this, 'isEditMode', {
					configurable: true,
					get: function () {
						return false;
					}
				});
			},

			OnMouseDblClick: function (callElement) {},

			OnTopMouseUp: function (callElement) {
				callElement.selectedTop = null;
			},

			OnTopMouseDown: function (callElement) {
				callElement.selectedTop = arguments[1];
			},

			OnMouseDown: function (callElement, event) {
				// IR-043762 "SSVCV. Selection markup incorrectly works in FF"
				// In the FF45 in some case offsetX or offsetY give minimum values.
				var offsetX;
				var offsetY;
				if (VC.Utils.isIE11() || VC.Utils.isEdge()) {
					offsetX = event.offsetX;
					offsetY = event.offsetY;
				} else {
					offsetX = event.layerX;
					offsetY = event.layerY;
				}
				callElement.selectedPoint = { x: offsetX, y: offsetY };
				if (callElement.OnSelect) {
					callElement.OnSelect(arguments);
				}
			},

			_arrangeInnerElements: function () {
				this.InnerElement.update(this.X, this.Y, this.OX, this.OY);
				if (this.Contour !== null) {
					this.Contour.update(this.X, this.Y, this.OX, this.OY);
				}
			},

			_addInnerElement: function () {
				this.InnerElement = new VC.SVG.Rectangle();
			},

			_arrangeGroupNode: function () {
				this.addChild(this.InnerElement);
				if (this.Contour !== null) {
					this.addChild(this.Contour);
				}
				this.addChild(this.Frame);
				this._addSelectionTops();
			},

			_addSelection: function () {
				this.Frame = new VC.SVG.Rectangle();
				this.Frame.Class = 'Frame';

				if (this.Contour === null) {
					this.Contour = VC.SVG.Shape.Clone(this.InnerElement);
					this.Contour.Class = 'Contour';
					this.Contour.ID += '_Contour';
				}
			},

			_addSelectionTops: function () {
				for (var el in VC.SVG.ActiveElement.ResizingTops) {
					var top = new VC.SVG.Circle();
					top.Class = 'Top';
					top.Name = el;
					top.Number = VC.SVG.ActiveElement.ResizingTops[el];

					VC.Utils.Page.AddEvent(
						top.Node,
						'mousedown',
						dojo.partial(this.OnTopMouseDown, this, top.Number)
					);
					VC.Utils.Page.AddEvent(
						top.Node,
						'mouseup',
						dojo.partial(this.OnTopMouseUp, this)
					);

					this.Tops.push(top);
					this.Node.appendChild(top.Node);
				}
				this._setCursorAttrForTops();
			},

			_setCursorAttrForTops: function () {
				this.Tops[0].Node.setAttribute('cursor', 'nw-resize');
				this.Tops[1].Node.setAttribute('cursor', 'w-resize');
				this.Tops[2].Node.setAttribute('cursor', 'sw-resize');
				this.Tops[3].Node.setAttribute('cursor', 'ne-resize');
				this.Tops[4].Node.setAttribute('cursor', 'e-resize');
				this.Tops[5].Node.setAttribute('cursor', 'se-resize');
				this.Tops[6].Node.setAttribute('cursor', 'n-resize');
				this.Tops[7].Node.setAttribute('cursor', 's-resize');
			},

			_arrangeTops: function () {
				//todo: temporary cap
				var topRadius = VC.SVG.Shape.GetProperty('top');
				topRadius = 3;

				this.Tops[0].update(this.Frame.X, this.Frame.Y, topRadius);
				this.Tops[1].update(
					this.Frame.X,
					this.Frame.Y + this.Frame.OY / 2,
					topRadius
				);
				this.Tops[2].update(
					this.Frame.X,
					this.Frame.Y + this.Frame.OY,
					topRadius
				);
				this.Tops[3].update(
					this.Frame.X + this.Frame.OX,
					this.Frame.Y,
					topRadius
				);
				this.Tops[4].update(
					this.Frame.X + this.Frame.OX,
					this.Frame.Y + this.Frame.OY / 2,
					topRadius
				);
				this.Tops[5].update(
					this.Frame.X + this.Frame.OX,
					this.Frame.Y + this.Frame.OY,
					topRadius
				);
				this.Tops[6].update(
					this.Frame.X + this.Frame.OX / 2,
					this.Frame.Y,
					topRadius
				);
				this.Tops[7].update(
					this.Frame.X + this.Frame.OX / 2,
					this.Frame.Y + this.Frame.OY,
					topRadius
				);
			},

			_showContour: function () {
				this.Contour.Visible = true;
			},

			_hideContour: function () {
				this.Contour.Visible = false;
			},

			_showTops: function () {
				this._arrangeTops();
				for (var el in this.Tops) {
					this.Tops[el].Visible = true;
				}
			},

			_hideTops: function () {
				for (var el in this.Tops) {
					this.Tops[el].Visible = false;
				}
			},

			_showSelection: function () {
				this.Frame.Transparent = false;
				this._showTops();
			},

			_hideSelection: function () {
				this.Frame.Transparent = true;
				this._hideTops();
			},

			_showInnerElement: function () {
				this.InnerElement.Visible = true;
				this._setInnerXml();
			},

			_hideInnerElement: function () {
				this.InnerElement.Visible = false;
			},

			_refreshSelection: function () {
				var lineWidth = this.InnerElement.LineWidth
					? this.InnerElement.LineWidth
					: 2;
				this.Frame.update(
					this.X - lineWidth,
					this.Y - lineWidth,
					this.OX + lineWidth * 2,
					this.OY + lineWidth * 2
				);
				switch (this.SelectMode) {
					case this.SelectOptions.Contoured:
						this._showContour();
						this._hideInnerElement();
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

			_move: function (x, y, selectedPoint) {
				return;
			},

			_resize: function (x, y, shiftKey) {
				function setValuesForLeft() {
					var currX = newx;
					newx = x;
					var diff = currX - x;
					if (shiftKey) {
						diff = diff * 2;
					}
					newox += diff;
				}
				function setValuesForRight() {
					var currX = newx + newox;
					var diff = currX - x;
					if (shiftKey) {
						newx += diff;
						diff = diff * 2;
					}
					newox -= diff;
				}
				function setValuesForTop() {
					var currY = newy;
					newy = y;
					var diff = currY - y;
					if (shiftKey) {
						diff = diff * 2;
					}
					newoy += diff;
				}
				function setValuesForBottom() {
					var currY = newy + newoy;
					var diff = currY - y;
					if (shiftKey) {
						newy += diff;
						diff = diff * 2;
					}
					newoy -= diff;
				}

				if (!this.selectedTop) {
					return;
				}

				var newx = this.X;
				var newy = this.Y;
				var newox = this.OX;
				var newoy = this.OY;
				switch (this.selectedTop) {
					case VC.SVG.ActiveElement.ResizingSides.LEFT:
						setValuesForLeft();
						break;
					case VC.SVG.ActiveElement.ResizingSides.RIGHT:
						setValuesForRight();
						break;
					case VC.SVG.ActiveElement.ResizingSides.TOP:
						setValuesForTop();
						break;
					case VC.SVG.ActiveElement.ResizingSides.BOTTOM:
						setValuesForBottom();
						break;
					case VC.SVG.ActiveElement.ResizingSides.LEFT_TOP:
						setValuesForLeft();
						setValuesForTop();
						break;
					case VC.SVG.ActiveElement.ResizingSides.LEFT_BOTTOM:
						setValuesForLeft();
						setValuesForBottom();
						break;
					case VC.SVG.ActiveElement.ResizingSides.RIGHT_TOP:
						setValuesForRight();
						setValuesForTop();
						break;
					case VC.SVG.ActiveElement.ResizingSides.RIGHT_BOTTOM:
						setValuesForRight();
						setValuesForBottom();
						break;
				}

				if (newox <= this.MinSize || newoy <= this.MinSize) {
					return;
				}
				this.update(newx, newy, newox, newoy);
			},

			_getRectSpace: function (startX, startY, currX, currY) {
				var ox = currX - startX;
				var oy = currY - startY;
				var x;
				var y;
				var side;

				if (ox < 0 && oy < 0) {
					ox = Math.abs(ox);
					oy = Math.abs(oy);
					x = startX - ox;
					y = startY - oy;
					side = 3;
				} else if (ox < 0 && oy >= 0) {
					ox = Math.abs(ox);
					x = startX - ox;
					y = startY;
					side = 4;
				} else if (ox >= 0 && oy < 0) {
					oy = Math.abs(oy);
					x = startX;
					y = startY - oy;
					side = 2;
				} else {
					x = startX;
					y = startY;
					side = 1;
				}

				return { x: x, y: y, ox: ox, oy: oy, side: side };
			},

			_setInnerXml: function () {
				this.InnerXml = this.InnerElement.getXml().xml;
			},

			GetOuterXml: function () {
				var element = this.InnerElement;
				var outerXml = element.getXml();
				if (element.NodeType == 'g') {
					for (var i = 0; i < element.Childs.length; i++) {
						try {
							var childNode = element.Childs[i].getXml();
							outerXml.appendChild(childNode);
						} catch (e) {
							console.error(e.message);
							continue;
						}
					}
				}

				return outerXml;
			},

			getDistance: function (x, y) {
				var distances = [];
				distances.push(
					Math.sqrt(Math.pow(this.X - x, 2) + Math.pow(this.Y - y, 2))
				);
				distances.push(
					Math.sqrt(Math.pow(this.X + this.OX - x, 2) + Math.pow(this.Y - y, 2))
				);
				distances.push(
					Math.sqrt(
						Math.pow(this.X + this.OX - x, 2) +
							Math.pow(this.Y + this.OY - y, 2)
					)
				);
				distances.push(
					Math.sqrt(Math.pow(this.X - x, 2) + Math.pow(this.Y + this.OY - y, 2))
				);

				return Math.min.apply(Math, distances);
			},

			isValid: function () {
				if (this.OX < this.MinSize || this.OY < this.MinSize) {
					return false;
				}
				return true;
			},

			restoreCoo: function (xmlNode) {
				// override for any shape
				this.X = +xmlNode.getAttribute(this.InnerElement.axis.x);
				this.Y = +xmlNode.getAttribute(this.InnerElement.axis.y);
				this.OX = +xmlNode.getAttribute(this.InnerElement.axis.ox);
				this.OY = +xmlNode.getAttribute(this.InnerElement.axis.oy);
			},

			SetXml: function (xmldoc) {
				this.InnerElement.applyXml(xmldoc);
				this.restoreCoo(xmldoc);
				this.SelectMode = this.SelectOptions.None;
				this.Refresh();
			},

			Fill: function (rgb) {
				this.InnerElement.Background = rgb;
			},

			SetLineProperties: function (width, color, dash) {
				this.InnerElement.LineColor = color;
				this.InnerElement.LineDash = dash;
				this.InnerElement.LineWidth = width;
			},

			AddProperties: function (properties) {
				this.FontSize = properties.fontSize ? properties.fontSize : '';
				this.LineColor = properties.lineColor ? properties.lineColor : '';
				if (properties.strokeWidth) {
					this.SetLineProperties(
						properties.strokeWidth,
						properties.lineColor,
						properties.strokeDash
					);
				}
				if (properties.background) {
					this.Fill(properties.background);
				}
			},

			Refresh: function () {
				this.update(this.X, this.Y, this.OX, this.OY);
				this._arrangeInnerElements();
				this._refreshSelection();
			},

			Move: function (x, y, shiftKey) {
				if (this.selectedTop === null) {
					this._move(x, y);
				} else {
					this._resize(x, y, shiftKey);
				}
				this.Refresh();
			},

			Draw: function (startX, startY, currX, currY, shiftKey) {
				this.SelectMode = this.SelectOptions.Contoured;

				var rectCoordinates = this._getRectSpace(startX, startY, currX, currY);
				if (shiftKey) {
					if (rectCoordinates.ox > rectCoordinates.oy) {
						rectCoordinates.oy = rectCoordinates.ox;
					} else {
						rectCoordinates.ox = rectCoordinates.oy;
					}
				}
				this.X = rectCoordinates.x;
				this.Y = rectCoordinates.y;
				this.OX = rectCoordinates.ox;
				this.OY = rectCoordinates.oy;
				this.Refresh();
			},

			Select: function () {
				this.SelectMode = this.SelectOptions.Selected;
				this.isSelected = true;

				this.moveElementToContainerEnd();
				this.Refresh();
			},

			Deselect: function () {
				this.SelectMode = this.SelectOptions.None;
				this.Cursor = VC.SVG.ActiveElement.Cursors.Default;
				this.isSelected = false;
				this.Refresh();
			},

			ScaleX: function (factor) {
				if (factor <= 0) {
					return;
				}
				this.X *= factor;
				this.OX *= factor;
				this.Refresh();
			},

			ScaleY: function (factor) {
				if (factor <= 0) {
					return;
				}
				this.Y *= factor;
				this.OY *= factor;
				this.Refresh();
			},

			Delete: function () {
				if (this.Node.parentNode) {
					this.Node.parentNode.removeChild(this.Node);
				}
			},

			moveElementToContainerEnd: function () {
				var parent = this.Node.parentNode;
				var children = parent.childNodes;
				var currentIndexInContainer = Array.prototype.indexOf.call(
					children,
					this.Node
				);
				var lastIndexInContainer = children.length - 1;

				if (currentIndexInContainer !== lastIndexInContainer) {
					this.Node.parentNode.appendChild(this.Node);
				}
			}
		});

		ActiveElement.XmlDeserialize = function (xmlDoc) {
			var obj = VC.SVG.ActiveElement.CreateElementByTag(
				xmlDoc.nodeName,
				xmlDoc.getAttribute('complextype')
			);
			obj.SetXml(xmlDoc);
			return obj;
		};

		ActiveElement.CreateElementByTag = function (tagName, complextype) {
			switch (tagName) {
				case VC.SVG.ActiveElement.ShapeType.ELLIPSE:
					return new VC.SVG.ActiveEllipseElement();
				case VC.SVG.ActiveElement.ShapeType.LINE:
					return new VC.SVG.ActiveLineElement();
				case VC.SVG.ActiveElement.ShapeType.SCRIBBLE:
					return new VC.SVG.ActiveScribbleElement();
				case VC.SVG.ActiveElement.ShapeType.COMPLEX:
					if (complextype == VC.SVG.ActiveElement.ShapeType.LABEL) {
						return new VC.SVG.ActiveLabelElement();
					}
					break;
				default:
					return new VC.SVG.ActiveElement();
			}
		};

		ActiveElement.SelectMode = {
			None: 0,
			Selected: 1,
			Contoured: 2
		};

		ActiveElement.ResizingSides = {
			// Selected area tops:
			//  1........7........4
			//  .                 .
			//  .                 .
			//  2                 5
			//  .                 .
			//  .                 .
			//  3........8........6
			LEFT: +2,
			RIGHT: +5,
			TOP: +7,
			BOTTOM: +8,
			LEFT_TOP: +1,
			RIGHT_TOP: +4,
			LEFT_BOTTOM: +3,
			RIGHT_BOTTOM: +6
		};

		ActiveElement.ResizingTops = {
			TopLeft: 1,
			MiddleLeft: 2,
			BottomLeft: 3,
			TopRight: 4,
			MiddleRight: 5,
			BottomRight: 6,
			TopMiddle: 7,
			BottomMiddle: 8
		};

		ActiveElement.ShapeType = {
			ELLIPSE: 'ellipse',
			RECT: 'rect',
			LINE: 'line',
			LABEL: 'label',
			SCRIBBLE: 'polyline',
			COMPLEX: 'g'
		};

		ActiveElement.AxisList = {
			ForLine: { x: 'x1', y: 'y1', ox: 'x2', oy: 'y2' },
			ForRectangle: { x: 'x', y: 'y', ox: 'width', oy: 'height' },
			ForEllipse: { x: 'cx', y: 'cy', ox: 'rx', oy: 'ry' },
			ForCircle: { x: 'cx', y: 'cy', ox: 'r', oy: 'r' },
			ForText: { x: 'x', y: 'y', ox: 'width', oy: 'height' },
			ForMarker: { x: 'refX', y: 'refY', ox: 'markerWidth', oy: 'markerHeight' }
		};

		ActiveElement.Cursors = {
			Move: 'move',
			Default: 'default'
		};

		return ActiveElement;
	})()
);
