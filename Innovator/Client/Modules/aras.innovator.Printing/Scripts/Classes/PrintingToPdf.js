/* global jsPDF, aras */
define([], function () {
	function PrintingToPdf() {}

	PrintingToPdf.prototype = {};

	var printWidth;
	var printHeight;
	var pptFactor = 0.75;
	var screenHeight = 595; //A4 ppt coming from pdf format
	var screenWidth = 842; //A4 ppt coming from pdf format
	var xOverlapping = 25;
	var yOverlapping = 25;
	var printPageNumbers = false;

	PrintingToPdf.init = function (parameters) {
		parameters = parameters || {};
		pptFactor = parameters.pptFactor || pptFactor;
		printPageNumbers = parameters.printPageNumbers || printPageNumbers;
		printWidth = parameters.printWidth;
		printHeight = parameters.printHeight;
		if (parameters.xOverlapping >= 0) {
			xOverlapping = parameters.xOverlapping;
		}
		if (parameters.yOverlapping >= 0) {
			yOverlapping = parameters.yOverlapping;
		}
	};

	PrintingToPdf.getPptFactor = function () {
		return pptFactor;
	};

	PrintingToPdf.getScreenHeight = function () {
		return screenHeight;
	};

	PrintingToPdf.getScreenWidth = function () {
		return screenWidth;
	};

	PrintingToPdf.printToPdf = function (instanceWindow, outputFileName) {
		aras.showStatusMessage(
			'status',
			'printing to pdf file',
			'../images/Progress.gif'
		);
		var base64String = '';
		var canvas;
		var html = instanceWindow.document.documentElement;
		var body = instanceWindow.document.body;
		if (aras.Browser.isIe()) {
			require([
				'../vendors/html2canvas.min.js',
				'../vendors/html2canvas.svg.min.js'
			], function (html2canvas, html2canvasSvg) {
				// html2canvas uses window.html2canvas inside itself
				window.html2canvas = html2canvas;
				window.html2canvas.svg = html2canvasSvg;
				html2canvas(instanceWindow.document.documentElement, {
					onclone: function (document) {
						// html2canvas doesn`t process inputs with image type
						// replacing inputs of image type by images
						var imageInputs = document.querySelectorAll('input[type=image]');
						Array.prototype.forEach.call(imageInputs, function (input) {
							var img = new Image();
							img.className = input.className;
							img.src = input.getAttribute('src');
							img.setAttribute('style', input.getAttribute('style'));
							img.style.position = 'absolute';
							img.style.width = getComputedStyle(input).width;
							img.style.height = getComputedStyle(input).height;
							var inputBoundingRect = input.getBoundingClientRect();
							img.style.top = inputBoundingRect.top + 'px';
							img.style.left = inputBoundingRect.left + 'px';
							img.style.margin = '0';
							if (getComputedStyle(input).direction == 'rtl') {
								input.previousElementSibling.style.marginLeft = getComputedStyle(
									img
								).width;
							}
							input.parentNode.removeChild(input);
							document.body.appendChild(img);
						});
					},
					svgRendering: true
				}).then(
					function (canvas) {
						this.createPdfFromImage(
							canvas.toDataURL(),
							instanceWindow,
							outputFileName
						);
						aras.clearStatusMessage('status');
					}.bind(this)
				);
			}.bind(this));
		} else {
			//to set styles for html and body nodes that the minimum height became 100%
			var htmlNode = instanceWindow.document.querySelector('html');
			var prevHtmlHeight = htmlNode.style.height;
			htmlNode.style.height = '100%';
			var prevBodyHeight = instanceWindow.document.body.style.minHeight;
			instanceWindow.document.body.style.minHeight = '100%';
			var finishPrinting = function () {
				htmlNode.style.height = prevHtmlHeight;
				instanceWindow.document.body.style.minHeight = prevBodyHeight;
				aras.clearStatusMessage('status');
			};
			// create canvas element and set size
			canvas = instanceWindow.document.createElement('canvas');
			// Cross browser canvas.width & canvas.height
			canvas.width = Math.max(
				body.scrollWidth,
				html.scrollWidth,
				body.offsetWidth,
				html.offsetWidth,
				body.clientWidth,
				html.clientWidth
			);
			canvas.height = Math.max(
				body.scrollHeight,
				html.scrollHeight,
				body.offsetHeight,
				html.offsetHeight,
				body.clientHeight,
				html.clientHeight
			);
			var context = canvas.getContext('2d');
			require(['Printing/Scripts/Classes/DomToSVG'], function (domToSVG) {
				domToSVG
					.toSVG(instanceWindow.document.body, canvas.width, canvas.height)
					.then(
						function (img) {
							context.drawImage(img, 0, 0);
							base64String = canvas.toDataURL('image/jpeg');
							this.createPdfFromImage(
								base64String,
								instanceWindow,
								outputFileName
							);
							finishPrinting();
						}.bind(this),
						function () {
							finishPrinting();
						}
					);
			}.bind(this));
		}
	};

	PrintingToPdf.createPdfFromImage = function (
		base64Image,
		instanceWindow,
		outputFileName
	) {
		function printing() {
			var JsPDF = jsPDF;
			var pdfDoc = new JsPDF('l', 'pt', 'a4');

			pdfDoc.page = 1;
			function addPageNumber() {
				pdfDoc.setFontSize(10);
				pdfDoc.setTextColor(150, 150, 150);
				pdfDoc.text(
					'Page ' + pdfDoc.page + ' of ' + rowCount * columnCount,
					20,
					screenHeight - 15
				);
				pdfDoc.page++;
			}

			for (var i = 0; i < rowCount; i++) {
				currentPositionX = 0;
				locationX = 0;

				if (i > 0) {
					currentPositionY = i * screenHeight;
					locationY = -currentPositionY + i * yOverlapping;
				}

				for (var j = 0; j < columnCount; j++) {
					if (j > 0) {
						currentPositionX = j * screenWidth;
						locationX = -currentPositionX + j * xOverlapping;
					}

					if (i === 0 && j === 0) {
						pdfDoc.addImage(
							base64Image,
							'PNG',
							locationX,
							locationY,
							imageWidth,
							imageHeight,
							'baseImage',
							pdfDoc['image_compression'].SLOW
						);
					} else {
						pdfDoc.addPage();
						pdfDoc.addImage(
							'baseImage',
							locationX,
							locationY,
							imageWidth,
							imageHeight
						);
					}
					if (printPageNumbers) {
						addPageNumber();
					}
				}
			}

			pdfDoc.save(outputFileName);
		}

		var html = instanceWindow.document.documentElement;
		var body = instanceWindow.document.body;
		// Cross browser imageWith & imageHeight
		var imageWidth =
			(printWidth ||
				Math.max(
					body.scrollWidth,
					html.scrollWidth,
					body.offsetWidth,
					html.offsetWidth,
					body.clientWidth,
					html.clientWidth
				)) * pptFactor;
		var imageHeight =
			(printHeight ||
				Math.max(
					body.scrollHeight,
					html.scrollHeight,
					body.offsetHeight,
					html.offsetHeight,
					body.clientHeight,
					html.clientHeight
				)) * pptFactor;
		var currentPositionX = 0;
		var currentPositionY = 0;

		var minWidthOverlappingCount = Math.floor(imageWidth / screenWidth);
		var maxPdfHorCount = Math.ceil(imageWidth / screenWidth);
		var widthOverlapping;
		if (
			imageWidth + minWidthOverlappingCount * xOverlapping >
			maxPdfHorCount * screenHeight
		) {
			widthOverlapping = minWidthOverlappingCount + 1;
		} else {
			widthOverlapping = minWidthOverlappingCount;
		}
		var columnCount = Math.ceil(
			(imageWidth + widthOverlapping * xOverlapping) / screenWidth
		);

		var minHeightOverlappingCount = Math.floor(imageHeight / screenHeight);
		var maxPdfPageCount = Math.ceil(imageHeight / screenHeight);
		var heightOverlapping;
		if (
			imageHeight + minHeightOverlappingCount * yOverlapping >
			maxPdfPageCount * screenHeight
		) {
			heightOverlapping = minHeightOverlappingCount + 1;
		} else {
			heightOverlapping = minHeightOverlappingCount;
		}
		var rowCount = Math.ceil(
			(imageHeight + heightOverlapping * yOverlapping) / screenHeight
		);
		var locationX = 0;
		var locationY = 0;

		if (typeof jsPDF === 'function') {
			printing();
		} else {
			var script = window.document.createElement('script');
			script.src =
				aras.getBaseURL() + '/Modules/aras.innovator.Printing/Scripts/jspdf.js';
			script.type = 'text/javascript';
			script.onload = function () {
				printing();
			};
			window.document.head.appendChild(script);
		}
	};

	return PrintingToPdf;
});
