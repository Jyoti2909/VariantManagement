/** ==================================================================== 
 * jsPDF Text plugin
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

(function (jsPDFAPI) {
	'use strict';
	/*jslint browser:true */
	/*global document: false, jsPDF */

	// Graphics

	var tempDrawColor, tempLineWidth, tempAlpha, tempFillColor, tempDashPattern, tempFontSize, tempTextColor;

	var isEmpty = function (obj) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop))
				return false;
		}
		return true;
	};
	var getSize = function (array) {
		var contentString = "";
		for (var i = 0; i < array.length; i++) {
			contentString += array[i];
		}
		return contentString.length + array.length; // size string + (1(/n)  * array.length)
	};
	var initPdfResource = function (that) {
		var extPdf = that.internal.collections.pdfobject = {};
		var extGStates = that.internal.collections.extGStates = {};
		for (var i = 0; i < 9; i++) {
			extGStates["CA0" + (i + 1)] = { "opacity": ((i + 1) / 10).toFixed(1) };
		}
		extGStates.CA10 = { "opacity": 1 };

		that.internal.events.subscribe("putXobjectDict", function () {

			var extPdfRsr = that.internal.collections.pdfobject;
			var extGStates = that.internal.collections.extGStates;
			var out = that.internal.write;

			if (!isEmpty(extPdfRsr)) {
				for (var XPdf in extPdfRsr) {
					if (extPdfRsr.hasOwnProperty(XPdf)) {
						out("/" + XPdf + " " + extPdfRsr[XPdf].objectNumber + " 0 R");
					}
				}
			}

			if (!isEmpty(extGStates)) {
				out(">>");
				out("/ExtGState");
				out("<<");
				for (var gsKey in extGStates) {
					if (extGStates.hasOwnProperty(gsKey)) {
						out("/" + gsKey + " " + extGStates[gsKey].objectNumber + " 0 R");
					}
				}
			}

		});
		that.internal.events.subscribe("putResources", function () {

			var out = that.internal.write;
			var extPdfRsr = that.internal.collections.pdfobject;
			var extGsStates = that.internal.collections.extGStates;
			var putExtPdfRsr = function (pdfRsr, self) {
				pdfRsr.objectNumber = self.internal.newObject();
				var selfOut = self.internal.write;
				var tempRsr = [];
				for (var ind = 0; ind < pdfRsr.innerPdf.length; ind++) {
					tempRsr[ind] = pdfRsr.innerPdf[ind];
				}
				selfOut("% XObject Resource");
				selfOut("<<");
				selfOut(tempRsr[0]);
				tempRsr.shift();
				selfOut("  /Subtype /Form");
				selfOut("  /Type /XObject");
				selfOut("  /Resources << /ProcSet [/PDF] >>");
				selfOut("  /Length " + getSize(tempRsr));
				selfOut(">>");
				selfOut("stream");
				for (var i = 0; i < tempRsr.length; i++) {
					selfOut(tempRsr[i]);
				}
				selfOut("endstream");
				selfOut("endobj");
			};
			var putExtGState = function (extGState, self) {
				extGState.objectNumber = self.internal.newObject();
				var out = self.internal.write;
				out('<<');
				out('/CA ' + extGState.opacity);
				out('/ca ' + extGState.opacity);
				out('/Type /ExtGState ');
				out('>>');
				out('endobj');
			};

			for (var pdfkey in extPdfRsr) {
				if (extPdfRsr.hasOwnProperty(pdfkey)) {
					putExtPdfRsr(extPdfRsr[pdfkey], that);
				}
			}

			for (var extGState in extGStates) {
				if (extGStates.hasOwnProperty(extGState)) {
					putExtGState(extGStates[extGState], that);
				}
			}

		});
	};
	var checkAndInitPdfRes = function (self) {
		if (!self.internal.collections.extGStates && !self.internal.collections.pdfobject) {
			initPdfResource(self);
		}
	};

	// Public API
	jsPDFAPI.setClipRect = function (x, y, w, h, backgroundColor) {
		var out = this.internal.write;
		var pageHeight = this.internal.pageSize.height;
		var backColor = backgroundColor ? backgroundColor : '1.0 1.0 1.0 rg';
		var f2 = function (number) {
			return number.toFixed(2);
		};
		out(backColor); // set color background
		out([
			f2(x),
			f2((pageHeight - y)),
			f2(w),
			f2(-h),
			're'
		].join(' '));
		out('W');
		out('f');
	};

	jsPDFAPI.saveGC = function () {
		this.internal.write('q');
	};

	jsPDFAPI.restoreGC = function () {
		this.internal.write('Q');
	};

	jsPDFAPI.drawExtResource = function (x, y, name, outArray, scale) {
		var out = this.internal.write;
		var pageHeight = this.internal.pageSize.height;
		if (outArray) {
			for (var i = 0; i < outArray.length; i++) {
				out(outArray[i]);
			}
		} else {
			if (typeof scale == 'undefined') {
				out("q 1 0 0 -1 " + x + " " + (pageHeight - y) + " cm /" + name + " Do Q");
			} else {
				var scaleFactor = scale / 100;
				out("q " + scaleFactor + " 0 0 -" + scaleFactor + " " + x + " " + (pageHeight - y) + " cm /" + name + " Do Q");
			}
		}
		return this;
	};

	jsPDFAPI.pdfResourceExist = function (name) {
		return this.internal.collections.pdfobject && this.internal.collections.pdfobject[name] !== undefined;
	};

	jsPDFAPI.setLineDash = function (dashArray, dashPhase) {
		if (dashArray === undefined) {
			this.internal.write("[] 0 d");
		} else {
			this.internal.write("[" + dashArray + "]" + dashPhase + " d");
		}
		return this;
	};

	jsPDFAPI.setActiveGsState = function (name) {
		checkAndInitPdfRes(this);
		this.internal.write("/" + name + " gs");
		return this;
	};

	jsPDFAPI.putExtPfdResource = function (name, extPdfContent) {
		checkAndInitPdfRes(this);
		var extPdf = {};
		var xPdfObjArray = this.internal.collections.pdfobject;
		xPdfObjArray[name] = extPdf;
		extPdf.innerPdf = extPdfContent;
		return this;
	};

	jsPDFAPI.DirectOUT = function (stringValue) {
		if (stringValue) {
			this.internal.write(stringValue);
		}
	};

	jsPDFAPI.setDrawColorCachable = function (r, g, b) {
		var dcolor = r + g + b;
		if (tempDrawColor === dcolor) {
			return;
		}
		tempDrawColor = dcolor;
		this.setDrawColor(r, g, b);

	};

	jsPDFAPI.setLineWidthCachable = function (width) {
		if (tempLineWidth === width) {
			return;
		}
		tempLineWidth = width;
		this.setLineWidth(width);
	};

	jsPDFAPI.setFillColorCachable = function (r, g, b) {
		var fcolor = r + g + b;
		if (tempFillColor === fcolor) {
			return;
		}
		tempFillColor = fcolor;
		this.setFillColor(r, g, b);
	};

	jsPDFAPI.setAlphaCachable = function (alpha) {
		if (tempAlpha === alpha) {
			return;
		}
		tempAlpha = alpha;
		this.setActiveGsState(alpha);
	};

	jsPDFAPI.setDashStyleCachable = function (dashArray, dashPhase) {
		var pattern = dashArray + dashPhase;
		if (tempDashPattern === pattern) {
			return;
		}
		tempDashPattern = pattern;
		this.setLineDash(dashArray, dashPhase);
	};

	jsPDFAPI.clearGraphicsCache = function () {
		tempDrawColor = tempLineWidth = tempAlpha = tempFillColor = tempDashPattern = "";
	};

	jsPDFAPI.setFontSizeCachable = function (size) {
		if (tempFontSize === size) {
			return;
		}
		tempFontSize = size;
		this.setFontSize(size);
	};

	jsPDFAPI.setTextColorCachable = function (r, g, b) {
		var color = r + g + b;
		if (tempTextColor === color) {
			return;
		}
		tempTextColor = color;
		this.setTextColor(r, g, b);
	};

	jsPDFAPI.setCtmForAllPages = function () {
		var pages = this.internal.pages,
			pageW = this.internal.pageSize.width,
			pageH = this.internal.pageSize.height,
			saveGc = "q",
			pageCtm = "q 1 0 0 1 20 -20 cm ",
			setBkgColor = "1.0 1.0 1.0 rg",
			pageClipRect = "0 " + (pageH) + " " + (pageW - 40) + " " + (-(pageH - 40)) + " re",
			clip = "W f",
			restorGc = "Q";
		for (var n = 1; n < pages.length; n++) {
			pages[n].unshift(clip);
			pages[n].unshift(pageClipRect);
			pages[n].unshift(setBkgColor);
			pages[n].unshift(saveGc);
			pages[n].unshift(pageCtm);
			pages[n].push(restorGc);
			pages[n].push(restorGc);
		}
	};



}(jsPDF.API));
