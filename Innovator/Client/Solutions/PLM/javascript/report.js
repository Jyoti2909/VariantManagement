function printReport(win) {
	win.document.close();
	win.print();
}

function fillReportGenetarionTime() {
	if (!parent.ArasModules) {
		return;
	}
	const currentDate = new Date();
	const date = parent.ArasModules.intl.date.format(
		currentDate,
		'shortDateTime'
	);
	const targetElements = document.getElementsByClassName(
		'report_generation_time'
	);
	if (targetElements.length < 1) {
		return;
	}
	for (let i = 0; i < targetElements.length; i++) {
		const targetElement = targetElements[i];
		if (targetElement.innerText === '') {
			targetElement.innerText = 'Generated on: ' + date;
		}
	}
}

fillReportGenetarionTime();
