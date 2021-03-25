define([], function () {
	'use strict';
	var PDfResources = function (pageH, pageW) {
		// private
		var Wbs = [];
		Wbs.push('  /BBox [0 0 64 64]');
		Wbs.push('1 0 0 -1 0 64 cm');
		Wbs.push('0 0 64 64 re');
		Wbs.push('W n');
		Wbs.push('1 0 0 1 0 0 cm');
		Wbs.push('4 M');
		Wbs.push('q');
		Wbs.push('q');
		Wbs.push('0.92941 0.78431 0.49412 rg');
		Wbs.push('5 16.001 m');
		Wbs.push('59 16.001 l');
		Wbs.push('59 54.002 l');
		Wbs.push('5 54.002 l');
		Wbs.push('5 16.001 l');
		Wbs.push('h');
		Wbs.push('f');
		Wbs.push('Q');
		Wbs.push('q');
		Wbs.push('0.92941 0.78431 0.49412 rg');
		Wbs.push('5 10.03 m');
		Wbs.push('7 10.03 l');
		Wbs.push('9 10.03 l');
		Wbs.push('11 10.03 l');
		Wbs.push('13 10.03 l');
		Wbs.push('15.001 10.03 l');
		Wbs.push('17 10.03 l');
		Wbs.push('19.833 9.808 21.004 10.76 21 14.015 c');
		Wbs.push('21 16.007 l');
		Wbs.push('21 18 l');
		Wbs.push('5 18 l');
		Wbs.push('5 10.03 l');
		Wbs.push('h');
		Wbs.push('f');
		Wbs.push('Q');
		Wbs.push('Q');
		Wbs.push('q');
		Wbs.push('0.7071 -0.7071 0.7071 0.7071 -15.3762 32.8787 cm');
		Wbs.push('0.46275 0.6549 0.59216 rg');
		Wbs.push('21.393 24.393 m');
		Wbs.push('42.606 24.393 l');
		Wbs.push('42.606 45.606 l');
		Wbs.push('21.393 45.606 l');
		Wbs.push('h');
		Wbs.push('f');
		Wbs.push('Q');

		var Activ = [];
		Activ.push('  /BBox [0 0 64 64]');
		Activ.push('1 0 0 -1 0 64 cm');
		Activ.push('0 0 64 64 re');
		Activ.push('W n');
		Activ.push('1 0 0 1 0 0 cm');
		Activ.push('4 M');
		Activ.push('q');
		Activ.push('1 0 0 1 0 -924.3622 cm');
		Activ.push('q');
		Activ.push('-0.7071 0.7071 -0.7071 -0.7071 730.8713 1609.99 cm');
		Activ.push('0.46275 0.6549 0.59216 rg');
		Activ.push('12.908 937.27 m');
		Activ.push('51.091 937.27 l');
		Activ.push('51.091 975.453 l');
		Activ.push('12.908 975.453 l');
		Activ.push('h');
		Activ.push('f');
		Activ.push('Q');
		Activ.push('Q');

		var Mil = [];
		Mil.push('  /BBox [0 0 64 64]');
		Mil.push('1 0 0 -1 0 64 cm');
		Mil.push('0 0 64 64 re');
		Mil.push('W n');
		Mil.push('1 0 0 1 0 0 cm');
		Mil.push('4 M');
		Mil.push('q');
		Mil.push('1 0 0 1 0 -924.3622 cm');
		Mil.push('q');
		Mil.push('0 0.44706 0.77647 rg');
		Mil.push('50 983.362 m');
		Mil.push('14 983.362 l');
		Mil.push('32 955.362 l');
		Mil.push('50 983.362 l');
		Mil.push('h');
		Mil.push('f');
		Mil.push('Q');
		Mil.push('q');
		Mil.push('0 0.44706 0.77647 rg');
		Mil.push('50 929.362 m');
		Mil.push('14 929.362 l');
		Mil.push('32 957.362 l');
		Mil.push('50 929.362 l');
		Mil.push('h');
		Mil.push('f');
		Mil.push('Q');
		Mil.push('Q');

		var Dlv = [];
		Dlv.push('  /BBox [0 0 64 64]');
		Dlv.push('1 0 0 -1 0 64 cm');
		Dlv.push('0 0 64 64 re');
		Dlv.push('W n');
		Dlv.push('1 0 0 1 0 0 cm');
		Dlv.push('4 M');
		Dlv.push('q');
		Dlv.push('0.90588 0.55686 0.27451 rg');
		Dlv.push('59 49 m');
		Dlv.push('21.186 49 l');
		Dlv.push('5 32 l');
		Dlv.push('21.186 15 l');
		Dlv.push('59 15 l');
		Dlv.push('59 49 l');
		Dlv.push('h');
		Dlv.push('f');
		Dlv.push('Q');

		var getTimeGridXObj = function () {
			var hStep = 20, // todo: get steps value from ganttchart
				vStep = 20,
				drawColor = '0.61 0.61 0.61 RG',
				tGrd = [],
				hLineCount = Math.ceil(pageH / hStep),
				vLineCount = Math.ceil(pageW / vStep);
			tGrd.push('  /BBox [0 0 ' + pageW + ' ' + pageH + ']');
			tGrd.push('1 0 0 1 0 0 cm');
			tGrd.push(drawColor);
			tGrd.push('0.5 w');
			tGrd.push('[1 1]1 d');
			for (var i = 0; i < vLineCount; i++) {
				tGrd.push((i * vStep).toFixed(2).toString() + ' ' + pageH + ' m ');
				tGrd.push((i * vStep).toFixed(2).toString() + ' ' + '0 l S');
				tGrd.push('S');
			}
			for (var j = 0; j < hLineCount; j++) {
				tGrd.push('0 ' + (pageH - j * hStep).toFixed(2).toString() + ' m');
				tGrd.push(
					pageW + ' ' + (pageH - j * hStep).toFixed(2).toString() + ' l S'
				);
				tGrd.push('S');
			}
			tGrd.push('[]0 d');
			return tGrd;
		};

		var getHLineGrid = function () {
			var hStep = 20,
				drawColor = '0.61 0.61 0.61 RG',
				tGrd = [],
				hLineCount = Math.ceil(pageH / hStep);
			tGrd.push('  /BBox [0 0 ' + pageW + ' ' + pageH + ']');
			tGrd.push('1 0 0 1 0 0 cm');
			tGrd.push(drawColor);
			tGrd.push('0.5 w');
			tGrd.push('[1 1]1 d');
			for (var j = 0; j < hLineCount; j++) {
				tGrd.push('0 ' + (pageH - j * hStep).toFixed(2).toString() + ' m');
				tGrd.push(
					pageW + ' ' + (pageH - j * hStep).toFixed(2).toString() + ' l S'
				);
				tGrd.push('S');
			}
			tGrd.push('[]0 d');
			return tGrd;
		};

		var getVLineGrid = function () {
			var vStep = 20,
				drawColor = '0.61 0.61 0.61 RG',
				tGrd = [],
				vLineCount = Math.ceil(pageW / vStep);
			tGrd.push('  /BBox [0 0 ' + pageW + ' ' + pageH + ']');
			tGrd.push('1 0 0 1 0 0 cm');
			tGrd.push(drawColor);
			tGrd.push('0.5 w');
			tGrd.push('[1 1]1 d');
			for (var i = 0; i < vLineCount; i++) {
				tGrd.push((i * vStep).toFixed(2).toString() + ' ' + pageH + ' m ');
				tGrd.push((i * vStep).toFixed(2).toString() + ' ' + '0 l S');
				tGrd.push('S');
			}
			tGrd.push('[]0 d');
			return tGrd;
		};

		var pdfIcons = {
			Wbs: Wbs,
			Activ: Activ,
			Mil: Mil,
			Dlv: Dlv,
			tGrd: getTimeGridXObj(),
			vLnG: getVLineGrid(),
			hLng: getHLineGrid()
		};

		var icons = {
			PDF: pdfIcons,
			base64: ''
		};

		return {
			// public
			// type : pdf svg base64 etc
			// icon : icon name
			getIcon: function (type, icon) {
				return icons[type] && icons[type][icon] ? icons[type][icon] : false;
			}
		};
	};
	return PDfResources;
});
