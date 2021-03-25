require(['dojox/xml/parser'], function (parser) {
	return dojo.setObject('VC.MarkupPage', function (width, height) {
		var container = new VC.SVG.Container();
		container.X = 0;
		container.OX = width;
		container.Y = 0;
		container.OY = height;

		var drawableSettings = [];

		Object.defineProperty(this, 'container', {
			get: function () {
				return container;
			},
			set: function (val) {
				console.error('MarkupPage.container property is read only ');
			}
		});

		Object.defineProperty(this, 'childs', {
			get: function () {
				return container.Childs;
			},
			set: function (val) {
				console.error('MarkupPage.childs property is read only ');
			}
		});

		Object.defineProperty(this, 'width', {
			get: function () {
				return container.OX;
			},
			set: function (val) {
				container.OX = val;
			}
		});

		Object.defineProperty(this, 'height', {
			get: function () {
				return container.OY;
			},
			set: function (val) {
				container.OY = val;
			}
		});

		Object.defineProperty(this, 'clientX', {
			get: function () {
				return container.X;
			},
			set: function (val) {
				container.X = val;
			}
		});

		Object.defineProperty(this, 'clientY', {
			get: function () {
				return container.Y;
			},
			set: function (val) {
				container.Y = val;
			}
		});

		Object.defineProperty(this, 'position', {
			get: function () {
				return {
					left: container.Node.style.left.replace('px', ''),
					right: container.Node.style.right.replace('px', ''),
					top: container.Node.style.top.replace('px', ''),
					bottom: container.Node.style.bottom.replace('px', ''),
					width: container.Node.style.width.replace('px', ''),
					height: container.Node.style.height.replace('px', '')
				};
			},
			set: function (val) {
				if (val.left) {
					container.Node.style.left = val.left;
				}
				if (val.right) {
					container.Node.style.right = val.right;
				}
				if (val.top) {
					container.Node.style.top = val.top;
				}
				if (val.bottom) {
					container.Node.style.bottom = val.bottom;
				}
				if (val.width) {
					container.Node.style.width = val.width;
				}
				if (val.height) {
					container.Node.style.height = val.height;
				}
			}
		});

		Object.defineProperty(this, 'isHasChilds', {
			get: function () {
				if (container.Childs.length > 0) {
					return true;
				}
				return false;
			}
		});

		Object.defineProperty(this, 'currentElement', {
			get: function () {
				return container.CurrentObject;
			}
		});

		this.dispose = function () {
			var element = document.getElementById(container.Node.id);
			element.parentNode.removeChild(element);

			var textElements = document.getElementsByClassName('EditableTextArea');
			for (index = textElements.length - 1; index >= 0; index--) {
				textElements[index].parentNode.removeChild(textElements[index]);
			}
		};

		this.rebase = function (newBoundRect) {
			container.X = newBoundRect.x;
			container.OX = newBoundRect.width;
			container.Y = newBoundRect.y;
			container.OY = newBoundRect.height;
		};

		this.placeAt = function (parent) {
			parent.appendChild(container.Node);
		};

		this.setSize = function (width, heigth) {
			container.OX = width;
			container.OY = heigth;
		};

		this.removeAt = function (parent) {
			container.removeChilds();
			try {
				parent.removeChild(container.Node);
			} catch (e) {
				container.Node.parentNode.removeChild(container.Node);
			}
		};

		this.scale = function (factorX, factorY) {
			container.Scale(factorX, factorY);
		};

		this.setDrawableSettings = function (settings) {
			for (var i in settings) {
				drawableSettings[i] = settings[i];
			}
		};

		this.removeDrawableSettings = function () {
			drawableSettings = [];
		};

		this.startDrawing = function (elementClass) {
			container.StartDrawing(elementClass, drawableSettings);
		};

		this.startEditing = function () {
			container.StartMoving();
		};

		this.startSelecting = function () {
			container.StartSelecting();
		};

		this.applyXML = function (xml) {
			container.ApplyXml(xml);
		};

		this.getXML = function () {
			return container.GetXml();
		};

		this.getInnerXML = function () {
			return parser.innerXML(container.Node);
		};

		this.getSelectionBox = function () {
			return container.getSelectionBox();
		};

		this.deleteSelected = function () {
			container.removeSelected();
		};

		this.hasNotations = function () {
			for (var i = 0; i < this.childs.length; i++) {
				if (
					this.childs[i].Node.viewportElement !== null &&
					this.childs[i].SelectMode !== 'contoured'
				) {
					return true;
				}
			}
			return false;
		};

		this.removeAllNotations = function () {
			this.container.removeChilds();
		};

		this.detectBoundingRect = function () {
			return container.detectSVGBoundingRect();
		};
	});
});
