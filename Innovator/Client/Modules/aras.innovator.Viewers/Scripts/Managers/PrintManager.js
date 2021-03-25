var PrintManager = function () {
	// gets js pdf document object
	var getPDFObject = function (
		base64Image,
		imageWidth,
		imageHeight,
		pdfResultCallback
	) {
		function constructPDF() {
			var JsPDF = jsPDF;
			var pdfDoc = new JsPDF('l', 'pt', 'a4');

			for (var i = 0; i < rowCount; i++) {
				currentPositionX = 0;
				locationX = 0;

				if (i > 0) {
					currentPositionY = i * screenHeight;
					locationY = -currentPositionY + i * 25;
				}

				for (var j = 0; j < columnCount; j++) {
					if (j > 0) {
						currentPositionX = j * screenWidth;
						locationX = -currentPositionX + j * 25;
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
				}
			}

			pdfResultCallback(pdfDoc);
		}

		var pptFactor = 0.75;
		imageWidth = imageWidth * pptFactor;
		imageHeight = imageHeight * pptFactor;

		var screenWidth = 842; //A4 ppt coming from pdf format
		var screenHeight = 595; //A4 ppt coming from pdf format
		var currentPositionX = 0;
		var currentPositionY = 0;

		var minWidthOverlappingCount = Math.floor(imageWidth / screenWidth);
		var maxPdfHorCount = Math.ceil(imageWidth / screenWidth);
		var widthOverlapping;
		if (
			imageWidth + minWidthOverlappingCount * 25 >
			maxPdfHorCount * screenHeight
		) {
			widthOverlapping = minWidthOverlappingCount + 1;
		} else {
			widthOverlapping = minWidthOverlappingCount;
		}
		var columnCount = Math.ceil(
			(imageWidth + widthOverlapping * 25) / screenWidth
		);

		var minHeightOverlappingCount = Math.floor(imageHeight / screenHeight);
		var maxPdfPageCount = Math.ceil(imageHeight / screenHeight);
		var heightOverlapping;
		if (
			imageHeight + minHeightOverlappingCount * 25 >
			maxPdfPageCount * screenHeight
		) {
			heightOverlapping = minHeightOverlappingCount + 1;
		} else {
			heightOverlapping = minHeightOverlappingCount;
		}
		var rowCount = Math.ceil(
			(imageHeight + heightOverlapping * 25) / screenHeight
		);
		var locationX = 0;
		var locationY = 0;

		if (typeof jsPDF === 'function') {
			constructPDF();
		} else {
			var script = window.document.createElement('script');
			script.src =
				aras.getBaseURL() + '/Modules/aras.innovator.Printing/Scripts/jspdf.js';
			script.type = 'text/javascript';
			script.onload = function () {
				constructPDF();
			};
			window.document.head.appendChild(script);
		}
	};

	// gets url as pdf stream
	this.convertImageToPDF = function (
		base64Image,
		imageWidth,
		imageHeight,
		outputFileName,
		pdfUrlResultCallback
	) {
		getPDFObject(base64Image, imageWidth, imageHeight, function (pdfDocument) {
			var cacheKey = new Date().getTime() / 1000 + Math.random() + 'pdf';
			var request =
				aras.getBaseURL() +
				'/Modules/aras.innovator.core.Form/GetPdfFromBase64?';
			request += 'cacheKey=' + cacheKey;
			request += '&outputFileName=';
			request += '&arasCacheControl=noCache';
			var xmlHttp = aras.XmlHttpRequestManager.CreateRequest();
			xmlHttp.open(
				'POST',
				aras.getBaseURL() +
					'/Modules/aras.innovator.core.Form/PostPdfFromBase64',
				false
			);
			xmlHttp.setRequestHeader(
				'Content-type',
				'application/json; charset=utf-8'
			);
			xmlHttp.send(
				JSON.stringify({
					base64String: pdfDocument.output('datauristring'),
					cacheKey: cacheKey
				})
			);

			pdfUrlResultCallback(request);
		});
	};

	// opens pdf file in new window
	this.openPDFFile = function (pdfUrl, windowOpenedCallback) {
		const pdfWindow = window.open(
			'',
			'',
			'scrollbars=yes,resizable=yes,status=no'
		);
		pdfWindow.opener = null;
		pdfWindow.location = pdfUrl;

		if (windowOpenedCallback && !VC.Utils.isIE() && !VC.Utils.isFirefox()) {
			var head = pdfWindow.document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			var functionString = '(' + windowOpenedCallback.toString() + ')();';

			head.appendChild(script);
			script.innerHTML = functionString;
		}
	};

	// converts base64 to pdf and opens in new window and calls windowOpenedCallback
	this.openPDFFromImage = function (
		base64Image,
		imageWidth,
		imageHeight,
		outputFileName,
		windowOpenedCallback
	) {
		this.convertImageToPDF(
			base64Image,
			imageWidth,
			imageHeight,
			outputFileName,
			function (pdfUrl) {
				this.openPDFFile(pdfUrl, windowOpenedCallback);
			}.bind(this)
		);
	};

	this.printFile = function () {
		window.print();
	};
};

dojo.setObject('VC.PrintManager', new PrintManager());
