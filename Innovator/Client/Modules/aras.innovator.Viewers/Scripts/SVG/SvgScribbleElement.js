dojo.setObject(
	'VC.SVG.ActiveScribbleElement',
	dojo.declare('ActiveScribbleElement', VC.SVG.ActiveElement, {
		currentPoint: null,
		pointList: null,
		StartPoint: null,
		EndPoint: null,
		Curve: null,

		constructor: function () {
			this.currentPoint = 0;

			Object.defineProperty(this, 'isEditMode', {
				configurable: true,
				get: function () {
					return false;
				}
			});
		},

		Draw: function (startX, startY, currX, currY, shiftKey) {
			var lineWidth = this.Curve.LineWidth ? this.Curve.LineWidth / 2 : 2;
			this.SelectMode = this.SelectOptions.None;
			if (this.currentPoint === 0) {
				this.StartPoint.update(startX, startY, lineWidth);
				this.EndPoint.update(startX, startY, lineWidth);
				this.X = startX;
				this.Y = startY;

				this.Curve.update(this.currentPoint, startX, startY);
				this.currentPoint++;
			}

			this.Curve.setPoint(this.currentPoint, currX, currY);
			this.currentPoint++;
			if (this.Curve.pointList.length > 0) {
				this.StartPoint.update(
					this.Curve.pointList[0][0],
					this.Curve.pointList[0][1],
					lineWidth
				);
				var lastIndex = this.Curve.pointList.length - 1;
				this.EndPoint.update(
					this.Curve.pointList[lastIndex][0],
					this.Curve.pointList[lastIndex][1],
					lineWidth
				);
			}
		},

		_refreshSelection: function () {
			var lineWidth = this.Curve.LineWidth ? this.Curve.LineWidth / 2 : 2;
			this.Frame.update(
				this.X - lineWidth,
				this.Y - lineWidth,
				this.OX + lineWidth * 2,
				this.OY + lineWidth * 2
			);

			switch (this.SelectMode) {
				case this.SelectOptions.Contoured:
					return;
				case this.SelectOptions.Selected:
					this._showSelection();
					break;
				case this.SelectOptions.None:
					this._hideSelection();
					break;
			}
		},

		_move: function (x, y) {
			return;
		},

		Move: function (x, y, shiftKey) {
			return;
		},

		ScaleX: function (factor) {
			if (factor <= 0) {
				return;
			}
			for (var i in this.pointList) {
				this.pointList[i][0] *= factor;
			}

			this.Curve.update();
			var lineWidth = this.Curve.LineWidth ? this.Curve.LineWidth / 2 : 2;
			lineWidth *= factor;
			if (this.Curve.pointList.length > 0) {
				this.StartPoint.update(
					this.Curve.pointList[0][0],
					this.Curve.pointList[0][1],
					lineWidth
				);
				var lastIndex = this.Curve.pointList.length - 1;
				this.EndPoint.update(
					this.Curve.pointList[lastIndex][0],
					this.Curve.pointList[lastIndex][1],
					lineWidth
				);
			}

			this.Refresh();
		},

		ScaleY: function (factor) {
			if (factor <= 0) {
				return;
			}

			for (var i in this.pointList) {
				this.pointList[i][1] *= factor;
			}

			this.Curve.update();
			var lineWidth = this.Curve.LineWidth ? this.Curve.LineWidth / 2 : 2;
			lineWidth *= factor;
			if (this.Curve.pointList.length > 0) {
				this.StartPoint.update(
					this.Curve.pointList[0][0],
					this.Curve.pointList[0][1],
					lineWidth
				);
				var lastIndex = this.Curve.pointList.length - 1;
				this.EndPoint.update(
					this.Curve.pointList[lastIndex][0],
					this.Curve.pointList[lastIndex][1],
					lineWidth
				);
			}

			this.Curve.LineWidth = 2 * lineWidth;
			this.Refresh();
		},

		_addInnerElement: function () {
			this.InnerElement = new VC.SVG.Group();
			this.Curve = new VC.SVG.Curve();
			this.StartPoint = new VC.SVG.Circle();
			this.EndPoint = new VC.SVG.Circle();

			this.InnerElement.addChild(this.Curve);
			this.InnerElement.addChild(this.StartPoint);
			this.InnerElement.addChild(this.EndPoint);
		},

		_addSelection: function () {
			this.Frame = new VC.SVG.Rectangle();
			this.Frame.Class = 'Frame';
		},

		restoreCoo: function (xmlNode) {
			// override for any shape
		},

		getDistance: function (x, y) {
			var minDistance;
			var lineWidth = this.Curve.LineWidth === 4 ? this.Curve.LineWidth : 9;
			for (var i in this.pointList) {
				var distance = Math.sqrt(
					Math.pow(this.pointList[i][0] - x, 2) +
						Math.pow(this.pointList[i][1] - y, 2)
				);
				if (!minDistance) {
					minDistance = distance;
				}
				if (minDistance > distance) {
					minDistance = distance;
				}
			}
			if (minDistance <= lineWidth) {
				return minDistance;
			} else {
				return null;
			}
		},

		isValid: function () {
			return true;
		},

		SetLineProperties: function (width, color, dash) {
			this.Curve.LineColor = color;
			this.Curve.LineDash = dash;
			this.Curve.LineWidth = width;
			this.StartPoint.LineColor = color;
			this.EndPoint.LineColor = color;
		},

		Refresh: function () {
			this.Curve.update();

			var xArr = [];
			var yArr = [];
			if (this.pointList === null) {
				this.pointList = this.Curve.pointList;
			}
			for (var i in this.pointList) {
				xArr.push(this.pointList[i][0]);
				yArr.push(this.pointList[i][1]);
			}

			this.X = Math.min.apply(Math, xArr);
			this.Y = Math.min.apply(Math, yArr);
			this.OX = Math.max.apply(Math, xArr) - this.X;
			this.OY = Math.max.apply(Math, yArr) - this.Y;

			this._refreshSelection();
		}
	})
);
