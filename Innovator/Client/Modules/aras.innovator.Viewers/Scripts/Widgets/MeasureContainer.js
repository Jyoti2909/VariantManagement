VC.Utils.Page.LoadModules(['MarkupPage']);
VC.Utils.Page.LoadWidgets(['MeasureLabel']);

require(['dojo/_base/declare', 'dojo/dom-geometry'], function (
	declare,
	domGeometry
) {
	return dojo.setObject(
		'VC.Widgets.MeasureContainer',
		declare(null, {
			svgPage: null,
			svgPageContainer: null,
			startPoint: null,
			endPoint: null,
			startPointText: 'A',
			endPointText: 'B',
			measureMessageTemplate:
				'MEASUREMENT\r\nDistance = {0} (X={1}, Y={2})\r\nUnits: {3}  Scale: {4}',
			measureSettings: { fontSize: 14.7, lineColor: 'red' },
			pdfPageMargin: 2,

			onStartPointChange: function () {},
			onEndPointChange: function () {},

			constructor: function (frameDocument) {
				this.svgPageContainer = document.createElement('div');
				this.svgPageContainer.id = 'MeasurePointsContainer';
				this.svgPage = new VC.MarkupPage(500, 500);
				this.svgPage.placeAt(this.svgPageContainer);
				this.svgPage.container.OnDrawingEnd = dojo.hitch(
					this,
					this.getCurrentElement
				);
			},

			placeAt: function (frameDocument) {
				var documentViewer = frameDocument.getElementById('DocumentViewer');
				documentViewer.style.position = 'relative';
				documentViewer.appendChild(this.svgPageContainer);

				this.resizeSvgPage(frameDocument);
			},

			resizeSvgPage: function (frameDocument) {
				this.svgPageContainer.style.display = 'none';

				var outerContainer = frameDocument.getElementById('DocumentViewer');
				var targetContainer = frameDocument.getElementById('viewer');
				var position = domGeometry.position(targetContainer, true);
				var targetContainerWidth = position.w - 2 * this.pdfPageMargin;
				var targetContainerHeight = position.h - 2 * this.pdfPageMargin;
				var targetTop =
					position.y > 0 ? position.y + this.pdfPageMargin : this.pdfPageMargin;
				var targetLeft =
					position.x > 0 ? position.x + this.pdfPageMargin : this.pdfPageMargin;
				var prevWidth = this.svgPage.width;
				var prevHeight = this.svgPage.height;

				this.svgPageContainer.style.top = targetTop + 'px';
				this.svgPageContainer.style.left = targetLeft + 'px';
				this.svgPageContainer.style.width = targetContainerWidth + 'px';
				this.svgPageContainer.style.height = targetContainerHeight + 'px';

				this.svgPage.position = {
					width: targetContainerWidth + 'px',
					height: targetContainerHeight + 'px',
					left: '0px',
					top: '0px'
				};

				this.svgPage.clientX = 0;
				this.svgPage.clientY = 0;
				this.svgPage.width = targetContainerWidth;
				this.svgPage.height = targetContainerHeight;

				if (
					this.svgPage.isHasChilds &&
					this.svgPage.width !== prevWidth &&
					this.svgPage.height !== prevHeight
				) {
					this.svgPage.scale(
						this.svgPage.width / prevWidth,
						this.svgPage.height / prevHeight
					);
				}

				this.svgPageContainer.style.display = 'block';
			},

			setStartPoint: function () {
				var self = this;

				this.svgPage.currentElement.SetText(
					this.svgPage.currentElement,
					this.startPointText
				);
				this.startPoint = this.svgPage.currentElement;

				var startX = this.startPoint.startX;
				var startY = this.startPoint.startY;

				this.onStartPointChange(startX, startY);

				if (this.endPoint !== null) {
					this.stopDrawing();
				}
			},

			setEndPoint: function () {
				var self = this;
				this.svgPage.currentElement.SetText(
					this.svgPage.currentElement,
					this.endPointText
				);
				this.endPoint = this.svgPage.currentElement;

				var startX = this.endPoint.startX;
				var startY = this.endPoint.startY;

				this.onEndPointChange(startX, startY);

				if (this.startPoint !== null) {
					this.stopDrawing();
				}
			},

			setClickThrough: function () {
				this.svgPageContainer.style.pointerEvents = 'none';
				this.svgPage.container.DetachMouseEvents();
			},

			expelClickThrough: function () {
				this.svgPageContainer.style.pointerEvents = 'auto';
				this.svgPage.container.DetachMouseEvents();
				this.svgPage.container.AttachMouseEvents();
			},

			startDrawing: function () {
				if (this.startPoint === null || this.endPoint === null) {
					this.svgPage.startDrawing(VC.SVG.MeasureLabel);
					this.svgPage.setDrawableSettings(this.measureSettings);
					this.svgPageContainer.style.display = 'block';
					this.expelClickThrough();
				}
			},

			stopDrawing: function () {
				this.setClickThrough();
			},

			getCurrentElement: function () {
				if (this.svgPage.currentElement !== null) {
					if (this.startPoint === null) {
						this.setStartPoint();
					} else if (this.endPoint === null) {
						this.setEndPoint();
					}
				}
			},

			getStartPoint: function () {
				return this.startPoint;
			},

			getEndPoint: function () {
				return this.endPoint;
			},

			clearStartPoint: function () {
				if (this.startPoint !== null) {
					this.startPoint._hideInnerElement();
					this.svgPage.container.remove(this.startPoint);
					this.startPoint = null;
				}

				this.startDrawing();
			},

			clearEndPoint: function () {
				if (this.endPoint !== null) {
					this.endPoint._hideInnerElement();
					this.svgPage.container.remove(this.endPoint);
					this.endPoint = null;
				}

				this.startDrawing();
			},

			clearAll: function () {
				this.svgPage.container.AttachMouseEvents();
				if (this.startPoint !== null) {
					this.svgPage.container.remove(this.startPoint);
					this.startPoint = null;
				}
				if (this.endPoint !== null) {
					this.svgPage.container.remove(this.endPoint);
					this.endPoint = null;
				}
				this.stopDrawing();
			}
		})
	);
});
