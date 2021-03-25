function PopulateDocByLabels(doc, aras, solution) {
	if (!doc) {
		doc = document;
	}
	if (!aras) {
		aras = parent.aras ? parent.aras : parent.parent.aras;
	}
	if (!solution) {
		solution = '';
	}

	if (!aras || !doc) {
		return;
	}

	var allElm = doc.all || document.getElementsByTagName('*');
	var k;
	var s;
	var obj;
	for (var i = 0; i < allElm.length; i++) {
		obj = allElm[i];
		if (obj && obj.attributes && obj.attributes['aras_ui_resource_key']) {
			k = obj.attributes['aras_ui_resource_key'].value;
			s = aras.getResource(solution, k);
			if (k.indexOf('_html_value', k.length - 12) > -1) {
				obj.value = s;
			} else {
				obj.innerHTML = s;
			}
		}
	}
}
