require(['dojox/xml/parser'], function (parser) {
	function setParent(el, newParent) {
		newParent.appendChild(el);
	}

	dojo.declare('Container', VC.SVG.Shape, {
		NodeType: 'svg',
		Marker: null,

		ActionMode: null,

		SelectedElements: null,
		CurrentObject: null,

		selectionRect: null,

		OnDrawingEnd: null,
		OnSelectingEnd: null,
		OnSelectingStart: null,

		CurrentDrawableElement: null,
		Properties: null,
		isDrawing: false,

		Actions: {
			Selecting: 'selecting',
			Moving: 'moving',
			Drawing: 'drawing',
			None: 'none'
		},

		AffectedKey: {
			SHIFT: 16,
			CTRL: 17,
			ENTER: 13,
			ALT: 18,
			ESCAPE: 27,
			DEL: 46
		},

		hasModifiedKey: false,
		mouseDownHandler: null,
		mouseUpHandler: null,
		constructor: function () {
			this.Class = 'Container';

			this.ActionMode = this.Actions.None;
			this.SelectedElements = [];
			this.SelectedPoint = null;

			this._createMarker();
			this.mouseDownHandler = dojo.partial(this.OnMouseDown, this);
			this.mouseUpHandler = dojo.partial(this.OnMouseUp, this);
			this.AttachMouseEvents();
			VC.Utils.Page.AddEvent(
				this.Node,
				'mousemove',
				dojo.partial(this.OnMouseMove, this)
			);
			VC.Utils.Page.AddEvent(
				document,
				'keydown',
				dojo.partial(this.OnKeyDown, this)
			);
			VC.Utils.Page.AddEvent(
				this.Node,
				'mouseleave',
				dojo.partial(this.OnMouseLeave, this)
			);
		},

		//this methods adding and removing event listener but not fix bug related to moving document by mouse because pointerEvents not supported in IE9.
		AttachMouseEvents: function () {
			VC.Utils.Page.AddEvent(this.Node, 'mousedown', this.mouseDownHandler);
			VC.Utils.Page.AddEvent(this.Node, 'mouseup', this.mouseUpHandler);
		},

		DetachMouseEvents: function () {
			VC.Utils.Page.RemoveEvent(this.Node, 'mousedown', this.mouseDownHandler);
			VC.Utils.Page.RemoveEvent(this.Node, 'mouseup', this.mouseUpHandler);
		},

		OnMouseDown: function (callElement) {
			// IR-042712 "FF45: Scribble draws incorrect lines"
			// In the FF45 in some case offsetX or offsetY give minimum values.
			var offsetX;
			var offsetY;
			if (VC.Utils.isFirefox()) {
				offsetX = arguments[1].layerX;
				offsetY = arguments[1].layerY;
			} else {
				offsetX = arguments[1].offsetX;
				offsetY = arguments[1].offsetY;
			}

			callElement.isDrawing = true;
			callElement.SelectedPoint = { x: offsetX, y: offsetY };
			callElement.hasModifiedKey =
				arguments[1].ctrlKey || arguments[1].shiftKey;

			if (callElement.ActionMode === callElement.Actions.Drawing) {
				callElement._restartDrawing();

				callElement.CurrentObject = new callElement.CurrentDrawableElement();
				callElement.CurrentObject.AddProperties(callElement.Properties);
				callElement.CurrentObject.OnSelect = dojo.hitch(
					callElement,
					callElement.onSelectElementHandler
				);
				callElement.addChild(callElement.CurrentObject);

				callElement.CurrentObject.Draw(
					callElement.SelectedPoint.x,
					callElement.SelectedPoint.y,
					offsetX,
					offsetY,
					arguments[1].shiftKey
				);
				return;
			} else {
				if (offsetX === 0 && offsetY === 0) {
					return;
				}
				if (callElement._getChildByPoint(callElement.SelectedPoint) === null) {
					if (callElement.selectionRect !== null) {
						callElement._destroyCurrentGroupSelection();
					}
					callElement.ActionMode = callElement.Actions.Selecting;

					if (callElement.OnSelectingStart) {
						callElement.OnSelectingStart();
					}

					if (!callElement.hasModifiedKey) {
						callElement.deselectAll();
					}
					callElement._createCurrentGroupSelection();
					return;
				}
				callElement.ActionMode = callElement.Actions.Moving;
			}
		},

		OnMouseUp: function (callElement) {
			if (callElement.ActionMode === callElement.Actions.Drawing) {
				if (callElement.OnDrawingEnd) {
					callElement.OnDrawingEnd();
				}
				if (callElement.CurrentObject && !callElement.CurrentObject.isValid()) {
					callElement.remove(callElement.CurrentObject);
				}
			}
			callElement.isDrawing = false;
			callElement._restartDrawing();
			callElement.SelectedPoint = null;

			if (
				callElement.ActionMode === callElement.Actions.Moving &&
				callElement.SelectedElements.length === 1
			) {
				callElement.CurrentObject = null;
			}

			if (
				callElement.selectionRect !== null &&
				callElement.ActionMode === callElement.Actions.Selecting
			) {
				if (callElement.OnSelectingEnd) {
					callElement.OnSelectingEnd();
				}

				callElement._setCurrentGroupSelection();

				if (callElement.SelectedElements.length === 0) {
					callElement._destroyCurrentGroupSelection();
					return;
				}

				callElement.ActionMode = callElement.Actions.Moving;

				callElement.CurrentObject = callElement.selectionRect;

				callElement._destroyCurrentGroupSelection();
			}
		},

		OnMouseMove: function (callElement) {
			var offsetX;
			var offsetY;
			var shiftKey;

			// IR-042712 "FF45: Scribble draws incorrect lines"
			// In the FF45 in some case offsetX or offsetY give minimum values.
			if (VC.Utils.isFirefox()) {
				offsetX = arguments[1].layerX;
				offsetY = arguments[1].layerY;
			} else {
				offsetX = arguments[1].offsetX;
				offsetY = arguments[1].offsetY;
			}
			shiftKey = arguments[1].shiftKey;

			if (callElement.SelectedPoint === null) {
				return;
			}

			if (callElement.ActionMode === callElement.Actions.Selecting) {
				if (callElement.selectionRect !== null) {
					callElement.selectionRect.Draw(
						callElement.SelectedPoint.x,
						callElement.SelectedPoint.y,
						offsetX,
						offsetY,
						false
					);
				}
			}
			if (
				callElement.ActionMode === callElement.Actions.Moving &&
				callElement.CurrentObject
			) {
				callElement.CurrentObject.Cursor = VC.SVG.ActiveElement.Cursors.Move;
				callElement.CurrentObject.selectedPoint = callElement.SelectedPoint;
				callElement.CurrentObject.Move(offsetX, offsetY, shiftKey);
			}
			if (
				callElement.ActionMode === callElement.Actions.Drawing &&
				callElement.CurrentObject
			) {
				callElement.CurrentObject.Draw(
					callElement.SelectedPoint.x,
					callElement.SelectedPoint.y,
					offsetX,
					offsetY,
					shiftKey
				);
			}
		},

		OnKeyDown: function (callElement) {
			if (arguments[1].keyCode === callElement.AffectedKey.DEL) {
				callElement.removeSelected();
			}
		},

		OnMouseLeave: function (callElement) {
			if (callElement.isDrawing) {
				callElement.OnMouseUp(callElement);
			}
		},

		OnStartDrawing: function () {},
		onSelectElementHandler: function () {
			var selectedPoint = arguments[0][0].selectedPoint;
			var element = this._getSelectedElement(selectedPoint);
			var event = arguments[0][1];

			if (element === null) {
				element = this._getChildByPoint(selectedPoint);
			}

			if (element && this.ActionMode !== this.Actions.Drawing) {
				if (event.ctrlKey || event.shiftKey) {
					if (element.isSelected) {
						this.deselect(this.SelectedElements.indexOf(element));
					} else {
						this.select(element);
					}
				} else {
					this.selectOnly(element);
				}
			}
		},

		_restartDrawing: function () {
			if (this.ActionMode === this.Actions.Drawing) {
				if (this.CurrentObject !== null) {
					this.CurrentObject.Deselect();
					this.CurrentObject = null;
				}
			}
		},

		_moveSelectedElements: function (x, y) {},

		_getChildByPoint: function (point) {
			var index = -1;
			var minDistance;
			for (var i = 0; i < this.Childs.length; i++) {
				try {
					var startX = this.Childs[i].Node.getBBox().x;
					var startY = this.Childs[i].Node.getBBox().y;
					var endX = startX + this.Childs[i].Node.getBBox().width;
					var endY = startY + this.Childs[i].Node.getBBox().height;

					if (
						point.x >= startX &&
						point.x <= endX &&
						point.y >= startY &&
						point.y <= endY
					) {
						var distance = this.Childs[i].getDistance(point.x, point.y);
						if (distance) {
							if (!minDistance) {
								minDistance = distance;
							}

							if (minDistance >= distance) {
								minDistance = distance;
								index = i;
							}
						}
					}
				} catch (e) {
					// Bug 1078743 - svg getBBox() on text elements returns wrong rectangle data  https://bugzilla.mozilla.org/show_bug.cgi?id=1078743
					// IR-029162 "SSVC. Impossible to select mapkup inside bounding box of another"(only in FF)
					continue;
				}
			}
			if (index === -1) {
				return null;
			} else {
				return this.Childs[index];
			}
		},

		// returns selectedElement if specified point belongs to one of contoured tops
		_getSelectedElement: function (point) {
			var returnedElement = null;
			var tops = null;

			for (var i = 0; i < this.SelectedElements.length; i++) {
				tops = this.SelectedElements[i].Tops;

				for (var j = 0; j < tops.length; j++) {
					var doesPointBelong = tops[j].doesPointBelong(point);

					if (doesPointBelong) {
						returnedElement = this.SelectedElements[i];
						break;
					}
				}
			}

			return returnedElement;
		},

		_selectChilds: function (point) {
			this.select(this._getChildByPoint(point));
		},

		_selectChildsByPoint: function (point) {
			for (var i = 0; i < this.Childs.length; i++) {
				try {
					var startX = this.Childs[i].Node.getBBox().x;
					var startY = this.Childs[i].Node.getBBox().y;
					var endX = startX + this.Childs[i].Node.getBBox().width;
					var endY = startY + this.Childs[i].Node.getBBox().height;
					if (
						startX > point.x &&
						point.x + point.width > endX &&
						startY > point.y &&
						point.y + point.height > endY
					) {
						if (this.Childs[i].isSelected) {
							this.deselect(this.SelectedElements.indexOf(this.Childs[i]));
						} else {
							this.select(this.Childs[i]);
						}
					}
				} catch (e) {
					continue;
				}
			}
		},

		_createCurrentGroupSelection: function () {
			this.selectionRect = new VC.SVG.ActiveElement();
			this.selectionRect.AddProperties({
				strokeWidth: 0,
				lineColor: 'transparent',
				strokeDash: 'none'
			});
			this.addChild(this.selectionRect);
			this.CurrentObject = this.selectionRect;
		},

		_setCurrentGroupSelection: function () {
			try {
				this._selectChildsByPoint(this.selectionRect.Node.getBBox());
			} catch (e) {}
		},

		_destroyCurrentGroupSelection: function () {
			try {
				this.Node.removeChild(this.selectionRect.Node);
			} catch (e) {
				console.log(e.description);
			}
			this.selectionRect = null;
		},

		_createMarker: function () {
			this.Marker = new VC.SVG.Marker('Triangle', 'M 0 0 L 20 10 L 0 20 z');
			this.Marker.update(0, 10, 8, 6);

			this.Node.appendChild(this.Marker.defs);
		},

		selectAll: function () {
			this.SelectedElements = [];

			for (var i = 0; i < this.Childs.length; i++) {
				this.SelectedElements.push(this.Childs[i]);
				this.Childs[i].Select();
			}
		},

		selectOnly: function (element) {
			this.deselectAll();

			this.select(element);
		},

		selectOnlyCurrent: function () {
			this.SelectedElements = [];
			for (var i = 0; i < this.Childs.length; i++) {
				if (this.CurrentObject.ID === this.Childs[i].ID) {
					this.select(this.Childs[i]);
					continue;
				}
				this.Childs[i].Deselect();
			}
		},

		select: function (element) {
			if (element) {
				element.Select();
				this.CurrentObject = element;
				this.SelectedElements.push(element);
			}
		},

		deselect: function (index) {
			this.SelectedElements[index].Deselect();
			this.SelectedElements.splice(index, 1);
		},

		deselectAll: function () {
			while (this.SelectedElements.length !== 0) {
				this.deselect(0);
			}
		},

		removeSelected: function () {
			while (this.SelectedElements.length !== 0) {
				this.remove(this.SelectedElements[0]);
				this.deselect(0);
			}
		},

		remove: function (element) {
			for (var j in this.Childs) {
				if (this.Childs[j].ID === element.ID) {
					if (!this.Childs[j].parentNode) {
						this.Childs[j].parentNode = this.Node;
					}
					if (!this.Childs[j].isEditMode) {
						this.Childs[j].Delete();
						this.Childs.splice(j, 1);
					}
				}
			}
		},

		getSelected: function () {
			for (var i = 0; i < this.Childs.length; i++) {
				if (
					this.Childs[i].SelectMode === VC.SVG.ActiveElement.SelectMode.Selected
				) {
					this.SelectedElements.push(this.Childs[i]);
				}
			}
		},

		getSelectionBox: function () {
			if (this.selectionRect) {
				return this.selectionRect.Node.getBBox();
			}

			return null;
		},

		Scale: function (factorX, factorY) {
			for (var i = 0; i < this.Childs.length; i++) {
				this.Childs[i].ScaleX(factorX);
				this.Childs[i].ScaleY(factorY);
			}
		},

		GetOuterXml: function () {
			return this.getXml();
		},

		/// params: VC.SVG.ActiveElement
		StartDrawing: function (drawableElement, drawingProperties) {
			this.ActionMode = this.Actions.Drawing;
			this.CurrentDrawableElement = drawableElement;
			this.Properties = drawingProperties;

			this.deselectAll();
		},

		/// params: VC.SVG.ActiveElement
		StartMoving: function (movableElement) {
			this.getSelected();
			this.ActionMode = this.Actions.Moving;
		},

		StartSelecting: function () {
			this.ActionMode = this.Actions.Moving;
		},

		DestroyActions: function () {
			this.CurrentObject = null;
			this.ActionMode = this.Actions.None;
		},

		GetXml: function (element) {
			if (!element || element === null) {
				element = this;
			}

			var outerXml = element.GetOuterXml();

			var childsXml = '';
			for (var i = 0; i < this.Childs.length; i++) {
				try {
					var childNode = element.Childs[i].GetOuterXml();
					outerXml.appendChild(childNode);
				} catch (e) {
					console.error(e.message);
					continue;
				}
			}
			return outerXml;
		},

		ApplyXml: function (xmlstr) {
			var xml = parser.parse(xmlstr);
			this.applyXml(xml.documentElement);
			for (var i = 0; i < xml.documentElement.childNodes.length; i++) {
				if (xml.documentElement.childNodes[i].nodeName === '#text') {
					continue;
				}
				var child = VC.SVG.ActiveElement.XmlDeserialize(
					xml.documentElement.childNodes[i]
				);
				if (child) {
					this.addChild(child);
				}
			}

			this.deselectAll();
		},

		removeChilds: function () {
			for (var j in this.Childs) {
				this.Childs[j].Delete();
				this.Childs.splice(j, 1);
			}
			this.Childs = [];
		},

		detectSVGBoundingRect: function () {
			var svgChilds = this.Childs;

			if (!svgChilds || svgChilds.length <= 0) {
				return;
			}

			var left = svgChilds[0].X;
			var top = svgChilds[0].Y;
			var right = svgChilds[0].X + svgChilds[0].OX;
			var bottom = svgChilds[0].Y + svgChilds[0].OY;

			for (var i = 1; i < svgChilds.length; i++) {
				left = Math.min(left, svgChilds[i].X);
				top = Math.min(top, svgChilds[i].Y);
				right = Math.max(right, svgChilds[i].X + svgChilds[i].OX);
				bottom = Math.max(bottom, svgChilds[i].Y + svgChilds[i].OY);
			}

			var res = {
				left: left,
				top: top,
				width: right - left,
				height: bottom - top
			};

			return res;
		}
	});

	return dojo.setObject('VC.SVG.Container', Container);
});
