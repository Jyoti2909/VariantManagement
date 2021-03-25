function CheckedMultiSelect() {
	this.containerElement = null;
	this.options = null;
	this.checkedValues = null;
	this.checkedLabels = null;
	// set global action variables
	this.active = false;
	this.action = 'open';
	this.state = 'closed';
	this.aras = window.aras;
}

CheckedMultiSelect.prototype.addClass = function CheckedMultiSelectAddClass(
	object,
	className
) {
	var re = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g');
	if (re.test(object.className)) {
		return;
	}
	object.className = (object.className + ' ' + className)
		.replace(/\s+/g, ' ')
		.replace(/(^ | $)/g, '');
};

CheckedMultiSelect.prototype.removeClass = function CheckedMultiSelectRemoveClass(
	object,
	className
) {
	var re = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g');
	object.className = object.className
		.replace(re, '$1')
		.replace(/\s+/g, ' ')
		.replace(/(^ | $)/g, '');
};

CheckedMultiSelect.prototype.init = function CheckedMultiSelectInit(
	container,
	xml,
	options
) {
	this.containerElement = container;
	if (!options) {
		this.options = {
			boxes: 'input[type=checkbox]', // checkbox selector
			labels: 'label', // label selector
			containerClass: 'sys_f_div_select', // element container CSS class
			selectLabelClass: 'sys_f_span_select', // selectLabel CSS class
			listClass: 'ul_select', // list CSS class
			elementOfListClass: 'li_select', // li CSS class
			spanActiveClass: 'active', // select open CSS class
			itemSelectedClass: 'selected', // list item selected CSS class
			// list item hover CSS class - usually we would use CSS :hover pseudo class, but we need this for keyboard navigation functionality
			itemHoverClass: 'hover'
		};
	}
	if (this.containerElement) {
		if (xml) {
			this.initXML(xml);
		}
	}
};

CheckedMultiSelect.prototype.initXML = function CheckedMultiSelectInitXML(xml) {
	var self = this;
	this.addClass(this.containerElement, this.options.containerClass);
	var dom = new XmlDocument();
	dom.loadXML(xml);
	var checkBoxes = dom.selectNodes('./options/checkboxes/input');
	var labels = dom.selectNodes('./options/labels/label');

	var list;

	if (checkBoxes.length == labels.length) {
		var optionsObject = getArrayOfOptionsObject(checkBoxes, labels);

		list = document.createElement('ul');
		initializeListElement(list);

		for (var i = 0, count = optionsObject.length; i < count; i++) {
			var optionObj = optionsObject[i];
			var option = document.createDocumentFragment();
			var isChecked = optionObj.inputIsChecked === 'true' ? true : false;
			var isDisabledCheckBox =
				optionObj.inputIsDisabled === 'true' ? true : false;
			var checkBoxElement = document.createElement('input');
			var labelElement = document.createElement('label');
			var elementOfList = document.createElement('li');

			this.addClass(checkBoxElement, optionObj.inputClass);
			checkBoxElement.type = optionObj.inputType;
			checkBoxElement.id = optionObj.inputId;
			checkBoxElement.checked = isChecked;
			checkBoxElement.disabled = isDisabledCheckBox;
			initializeCheckBoxElemenet(checkBoxElement);

			initializeElementOfList(elementOfList, checkBoxElement);

			labelElement.htmlFor = optionObj.labelFor;
			labelElement.innerHTML = optionObj.labelText;
			labelElement.value = optionObj.labelValue;

			option.appendChild(checkBoxElement);
			option.appendChild(labelElement);
			elementOfList.appendChild(option);
			list.appendChild(elementOfList);
		}
	}

	var span = document.createElement('span');
	initializeSpanElement(span);

	var select = document.createDocumentFragment();
	select.appendChild(span);
	select.appendChild(list);
	this.containerElement.appendChild(select);

	initializeContainerElement();
	initializeGlobalEvent();

	function getArrayOfOptionsObject(checkBoxNode, labelNode) {
		var result = [];
		for (var i = 0, count = checkBoxNode.length; i < count; i++) {
			var currentCheckBox = checkBoxNode[i];
			var currentLabel = labelNode[i];

			var ri = {
				inputClass: currentCheckBox.getAttribute('class'),
				inputType: currentCheckBox.getAttribute('type'),
				inputId: currentCheckBox.getAttribute('id'),
				inputIsChecked:
					currentCheckBox.getAttribute('checked') !== null
						? currentCheckBox.getAttribute('checked')
						: 'false',
				inputIsDisabled:
					currentCheckBox.getAttribute('disabled') !== null
						? currentCheckBox.getAttribute('disabled')
						: 'false',
				labelFor: currentLabel.getAttribute('for'),
				labelValue: currentLabel.getAttribute('value'),
				labelText: currentLabel.text
			};

			result[i] = ri;
		}
		return result;
	}

	function initializeContainerElement() {
		self.containerElement.addEventListener(
			'mouseenter',
			containerElementOnMouseEnterHandler,
			false
		);
		self.containerElement.addEventListener(
			'mouseleave',
			containerElementOnMouseLeaveHandler,
			false
		);
		self.containerElement.addEventListener(
			'click',
			containerElementOnClickHandler,
			false
		);
		self.containerElement.addEventListener(
			'selectstart',
			containerElementOnSelectStartHandler,
			false
		);
	}

	function initializeListElement(elementList) {
		elementList.style.display = 'none';
		elementList.setAttribute('class', self.options.listClass);
		elementList.addEventListener('mouseenter', listOnMouseEnterHandler, false);
		elementList.addEventListener('mouseleave', listOnMouseLeaveHandler, false);
		elementList.addEventListener(
			'selectstart',
			listOnSelectStartHandler,
			false
		);
		elementList.addEventListener('keydown', listOnKeyDownHandler, false);
		elementList.addEventListener('click', listOnClickHandler, false);
	}

	function initializeCheckBoxElemenet(elementCheckBox) {
		elementCheckBox.addEventListener('keydown', boxOnKeyDownHandler, false);
		elementCheckBox.addEventListener('keyup', boxOnKeyUpHandler, false);
	}

	function initializeElementOfList(elementOfList, elementCheckBox) {
		elementOfList.setAttribute(
			'class',
			elementCheckBox.checked
				? self.options.elementOfListClass + ' ' + self.options.itemSelectedClass
				: self.options.elementOfListClass
		);
		elementOfList.addEventListener(
			'mouseenter',
			elementOnMouseEnterHandler,
			false
		);
		elementOfList.addEventListener(
			'mousedown',
			elementOnMouseDownHandler,
			false
		);
	}

	function initializeSpanElement(elementSpan) {
		elementSpan.setAttribute('class', self.options.selectLabelClass);
		elementSpan.innerHTML = self.changeLabel(list);
		elementSpan.addEventListener(
			'mouseenter',
			elementSpanOnMouseEnterHandler,
			false
		);
	}

	function elementSpanOnMouseEnterHandler(event) {
		var span = event.target;
		span.style.cursor = 'default';
	}

	function initializeGlobalEvent() {
		window.addEventListener('mouseup', globalOnMouseUpHandler, false);
		window.addEventListener('click', globalOnClickHandler, false);
		window.addEventListener('keydown', globalOnKeyDownHandler, false);
	}

	function containerElementOnMouseEnterHandler() {
		self.action = 'open';
	}

	function containerElementOnMouseLeaveHandler() {
		self.action = 'close';
	}

	function containerElementOnClickHandler() {
		if (span.className.indexOf(self.options.spanActiveClass) !== -1) {
			self.toggleMenu('close', span, list);
		} else {
			self.toggleMenu('open', span, list);
		}
	}

	function containerElementOnSelectStartHandler(event) {
		event.preventDefault();
		event.stopPropagation();
	}

	function listOnMouseEnterHandler() {
		self.action = 'open';
	}

	function listOnMouseLeaveHandler() {
		self.action = 'close';
		self.itemHover(this, 'none');
	}

	function listOnSelectStartHandler() {
		return false;
	}

	function listOnKeyDownHandler(event) {
		if (event.key === 'Esc') {
			self.toggleMenu('close', span, this);
		} else if (event.key === 'Down' || event.key === 'Up') {
			self.itemHover(this, event.key);
		}
	}

	function listOnClickHandler(event) {
		event.preventDefault();
		event.stopPropagation();
	}

	function boxOnKeyDownHandler(event) {
		if (event.key === 'Spacebar') {
			self.active = true;
			self.changeItemState(this.parentNode, this, span);
		}
		if (self.active && (event.key === 'Down' || event.key === 'Up')) {
			self.changeItemState(this.parentNode, this, span);
		}
	}

	function boxOnKeyUpHandler(event) {
		if (event.key === 'Spacebar') {
			self.active = false;
		}
	}

	function elementOnMouseEnterHandler() {
		self.itemHover(list, this);
	}

	function elementOnMouseDownHandler(event) {
		var box = this.childNodes[0];
		if (!box.disabled) {
			self.active = true;
			self.changeItemState(this, this.childNodes[0], span);
		}
	}

	function globalOnMouseUpHandler() {
		self.active = false;
	}

	function globalOnClickHandler() {
		if (self.action === 'close') {
			self.toggleMenu('close', span, list);
		}
	}

	function globalOnKeyDownHandler(event) {
		if (event.key === 'Esc') {
			self.toggleMenu('close', span, list);
			self.itemHover(list, 'none');
		}
		if (
			self.state === 'opened' &&
			(event.key === 'down' || event.key === 'up')
		) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
};

CheckedMultiSelect.prototype.changeItemState = function CheckedMultiSelectChangeItemState(
	item,
	checkbox,
	span
) {
	if (item.className.indexOf(this.options.itemSelectedClass) !== -1) {
		this.removeClass(item, this.options.itemSelectedClass);
		checkbox.checked = false;
		checkbox.focus();
	} else {
		this.addClass(item, this.options.itemSelectedClass);
		checkbox.checked = true;
		checkbox.focus();
	}

	span.innerHTML = this.changeLabel(item.parentNode);
};

CheckedMultiSelect.prototype.changeLabel = function CheckedMultiSelectChangeLabel(
	list
) {
	var labels = '';
	var values = '';

	for (var i = 0, count = list.childNodes.length; i < count; i++) {
		if (list.childNodes[i].childNodes[0].checked) {
			labels +=
				(labels.length ? ', ' : '') +
				list.childNodes[i].childNodes[1].innerHTML;
			values +=
				(values.length ? ', ' : '') + list.childNodes[i].childNodes[1].value;
		}
	}

	this.checkedLabels = labels;
	this.checkedValues = values;
	if (labels !== '') {
		return labels;
	} else {
		return 'Select something...';
	}
};

CheckedMultiSelect.prototype.getValueOfCheckedItems = function CheckedMultiSelectGetValueOfCheckedItems() {
	if (this.checkedValues === '') {
		return null;
	} else {
		return this.checkedValues.split(', ');
	}
};

CheckedMultiSelect.prototype.getLabelOfCheckedItems = function CheckedMultiSelectGetLabelOfCheckedItems() {
	if (this.checkedLabels === '') {
		return null;
	} else {
		return this.checkedLabels.split(', ');
	}
};

CheckedMultiSelect.prototype.getElement = function CheckedMultiSelectGetElement() {
	return this.containerElement;
};

CheckedMultiSelect.prototype.itemHover = function CheckedMultiSelectItemHover(
	list,
	select
) {
	var current = list.querySelector('li.' + this.options.itemHoverClass);
	var sibling = null;

	switch (select) {
		case 'Down':
			if (current && (sibling = current.nextSibling)) {
				this.removeClass(current, this.options.itemHoverClass);
			} else {
				this.itemHover(list, 'last');
			}
			break;
		case 'Up':
			if (current && (sibling = current.previousSibling)) {
				this.removeClass(current, this.options.itemHoverClass);
			} else {
				this.itemHover(list, 'first');
			}
			break;
		case 'none':
			var liElement = list.querySelector('li.' + this.options.itemHoverClass);
			if (liElement) {
				this.removeClass(liElement, this.options.itemHoverClass);
			}
			break;
		case 'first':
			sibling = list.firstChild;
			break;
		case 'last':
			sibling = list.lastChild;
			break;
		default:
			if (current) {
				this.removeClass(current, this.options.itemHoverClass);
			}
			sibling = select;
			break;
	}

	if (sibling) {
		this.addClass(sibling, this.options.itemHoverClass);
		sibling.querySelector(this.options.boxes).focus();
	}
};

CheckedMultiSelect.prototype.toggleMenu = function CheckedMultiSelectToggleMenu(
	toggle,
	span,
	list
) {
	if (toggle === 'open') {
		this.addClass(span, this.options.spanActiveClass);
		list.style.display = '';
		this.itemHover(list, 'first');
		this.state = 'opened';
	} else {
		this.removeClass(span, this.options.spanActiveClass);
		list.style.display = 'none';
		this.action = 'open';
		this.state = 'closed';
	}
};

CheckedMultiSelect.prototype.initWrapper = function CheckedMultiSelectInitWrapper(
	fieldNd,
	propNd
) {
	if (!fieldNd) {
		return;
	}

	var sessLangDirection = this.aras.getLanguageDirection();
	var fieldLabelLangDirection = this.aras.getItemPropertyAttribute(
		fieldNd,
		'label',
		'xml:lang'
	);
	fieldLabelLangDirection = this.aras.getLanguageDirection(
		fieldLabelLangDirection ? fieldLabelLangDirection : ''
	);
	sessLangDirection = 'sys_session_lang_direction_' + sessLangDirection;
	fieldLabelLangDirection =
		'sys_label_lang_direction_' + fieldLabelLangDirection;

	var fieldType = this.aras.getItemProperty(fieldNd, 'field_type');
	var fieldID = fieldNd.getAttribute('id');
	var fieldName = this.aras.getItemProperty(fieldNd, 'name');

	var content =
		'<!-- \n\n\nbeginning of ' +
		fieldName +
		' \n-->' +
		'<div id="' +
		fieldID +
		'span" name="' +
		fieldName +
		'"\n' +
		'      class="sys_f_container ' +
		sessLangDirection +
		' ' +
		fieldLabelLangDirection +
		' ';

	content +=
		'sys_ft_' +
		fieldType.replace(/ /g, '_') +
		' ' +
		'sys_fn_' +
		fieldName.replace(/ /g, '_') +
		' ';

	content += '"\n' + '	style="';

	// +++ field style applying
	var tmpVal = this.aras.getItemProperty(fieldNd, 'positioning');
	if (tmpVal) {
		content += 'position:' + tmpVal + '; ';
	}

	tmpVal = this.aras.getItemProperty(fieldNd, 'y');
	if (tmpVal) {
		content += 'top:' + tmpVal + 'px; ';
	}

	tmpVal = this.aras.getItemProperty(fieldNd, 'x');
	if (tmpVal) {
		content += 'left:' + tmpVal + 'px; ';
	}

	tmpVal = this.aras.getItemProperty(fieldNd, 'width');
	if (tmpVal) {
		if (tmpVal.search(/\d$/) != -1) {
			tmpVal += 'px';
		}
		content += 'width:' + tmpVal + '; ';
	}

	tmpVal = this.aras.getItemProperty(fieldNd, 'height');
	if (tmpVal) {
		if (tmpVal.search(/\d$/) != -1) {
			tmpVal += 'px';
		}
		content += 'height:' + tmpVal + '; ';
	}

	tmpVal = this.aras.getItemProperty(fieldNd, 'z_index');
	if (tmpVal) {
		content += 'z-index:' + tmpVal + '; ';
	}

	if (this.aras.getItemProperty(fieldNd, 'is_visible') == '0') {
		content += 'visibility:hidden; ';
	}
	// --- field style applying

	content +=
		'"><!--\n' +
		'   --><fieldset class="sys_f_border" style="border-style: solid;border-color:#ADAA9C;';

	tmpVal = this.aras.getItemProperty(fieldNd, 'border_width');
	if (tmpVal) {
		if (tmpVal.search(/\d$/) !== -1) {
			tmpVal += 'px';
		}
		content += 'border-width:' + tmpVal + '; ';
	}

	content += '">';

	tmpVal = this.aras.getItemProperty(fieldNd, 'legend');
	if (tmpVal !== '') {
		content +=
			'<!--\n' +
			'      --><legend class="sys_f_legend">' +
			tmpVal +
			'</legend>';
	}

	var labelPosition = this.aras.getItemProperty(fieldNd, 'labelPosition');
	if (labelPosition === '') {
		labelPosition = 'left';
	}

	var firstContainerClass1; //1st class name for the first container (e.g. sys_f_label_container)
	var firstContainerClass2; //2nd class name for the first container (e.g. sys_f_label_top)
	var firstContainerClass3; //3rd class name for the first container (e.g. sys_f_empty_label_container)
	var secondContainerClass1; //the same for the second container
	var secondContainerClass2;
	var secondContainerClass3;

	var additionalLabelCssClasses = '';
	var additionalValueCssClasses = '';
	var label = this.aras.getItemProperty(fieldNd, 'label');
	if (!label) {
		additionalLabelCssClasses = 'sys_f_empty_label_container';
	}
	var textAlign = this.aras.getItemProperty(fieldNd, 'textAlign');
	if (textAlign) {
		textAlign = 'text-align:' + textAlign + ';';
	}

	var firstContainerStyle1 = '';
	var secondContainerStyle1 = '';

	switch (labelPosition) {
		case 'left':
			firstContainerClass1 = 'sys_f_label_container';
			firstContainerClass2 = 'sys_f_label_left';
			firstContainerClass3 = additionalLabelCssClasses;
			secondContainerClass1 = 'sys_f_value_container';
			secondContainerClass2 = 'sys_f_value_right';
			secondContainerClass3 = additionalValueCssClasses;
			firstContainerStyle1 = textAlign;
			break;

		case 'top':
			firstContainerClass1 = 'sys_f_label_container';
			firstContainerClass2 = 'sys_f_label_top';
			firstContainerClass3 = additionalLabelCssClasses;
			secondContainerClass1 = 'sys_f_value_container';
			secondContainerClass2 = 'sys_f_value_bottom';
			secondContainerClass3 = additionalValueCssClasses;
			firstContainerStyle1 = textAlign;
			break;

		case 'right':
			firstContainerClass1 = 'sys_f_value_container';
			firstContainerClass2 = 'sys_f_value_left';
			firstContainerClass3 = additionalValueCssClasses;
			secondContainerClass1 = 'sys_f_label_container';
			secondContainerClass2 = 'sys_f_label_right';
			secondContainerClass3 = additionalLabelCssClasses;
			secondContainerStyle1 = textAlign;
			break;

		case 'bottom':
			firstContainerClass1 = 'sys_f_value_container';
			firstContainerClass2 = 'sys_f_value_top';
			firstContainerClass3 = additionalValueCssClasses;
			secondContainerClass1 = 'sys_f_label_container';
			secondContainerClass2 = 'sys_f_label_bottom';
			secondContainerClass3 = additionalLabelCssClasses;
			secondContainerStyle1 = textAlign;
			break;
	}

	function startSecondContainer() {
		return (
			'               --><td class="' +
			secondContainerClass1 +
			' ' +
			secondContainerClass2 +
			' ' +
			secondContainerClass3 +
			'" ' +
			'style="' +
			secondContainerStyle1 +
			'"><!--\n' +
			'                  -->'
		);
	}

	function drawLabel() {
		var content = '<div class="sys_f_label" style="';
		var propertyValue;

		propertyValue = this.aras.getItemProperty(fieldNd, 'font_family');
		content += propertyValue ? 'font-family:' + propertyValue + '; ' : '';

		propertyValue = this.aras.getItemProperty(fieldNd, 'font_size');
		content += propertyValue ? 'font-size:' + propertyValue + '; ' : '';

		propertyValue = this.aras.getItemProperty(fieldNd, 'font_weight');
		content += propertyValue ? 'font-weight:' + propertyValue + '; ' : '';

		propertyValue = this.aras.getItemProperty(fieldNd, 'font_color');
		content += propertyValue ? 'color:' + propertyValue + '; ' : '';
		content += '">';

		propertyValue = this.aras.getItemProperty(fieldNd, 'label');
		content += propertyValue ? this.aras.preserveTags(propertyValue) : '';

		content += '</div>';

		return content;
	}

	content +=
		'<!--\n' +
		'      --><table cellspacing="0" cellpadding="0" class="sys_f_table"><!--\n' +
		'         --><tbody class="sys_f_tbody"><!--\n' +
		'            --><tr class="sys_f_tr"><!--\n' +
		'               --><td class="' +
		firstContainerClass1 +
		' ' +
		firstContainerClass2 +
		' ' +
		firstContainerClass3 +
		'" ' +
		'style="' +
		firstContainerStyle1 +
		'"><!--\n' +
		'                  -->';

	if (labelPosition == 'left' || labelPosition == 'top') {
		content += drawLabel(fieldNd, propNd);
		content += '<!--\n' + '               --></td><!--\n';

		if (labelPosition == 'top') {
			//append tr
			content +=
				'            --></tr><!--\n' +
				'            --><tr class="sys_f_tr"><!--\n';
		}

		content += startSecondContainer();
	} //if (labelPosition=="left" || labelPosition=="top")

	content += '<div class="sys_f_value"><!--\n' + '                     -->';

	content += '<div id="div_select_' + fieldID + '" class="sys_f_div_select"';

	content += '<!--\n' + '                  --></div>';

	if (labelPosition == 'right' || labelPosition == 'bottom') {
		content += '<!--\n' + '               --></td><!--\n';

		if (labelPosition == 'bottom') {
			//append tr
			content +=
				'            --></tr><!--\n' +
				'            --><tr class="sys_f_tr"><!--\n';
		}

		content += startSecondContainer();
		content += drawLabel(fieldNd, propNd);
	} //if (labelPosition=="right" || labelPosition=="bottom")

	content +=
		'<!--\n' +
		'               --></td><!--\n' +
		'            --></tr><!--\n' +
		'         --></tbody><!--\n' +
		'      --></table><!--\n' +
		'   --></fieldset><!--\n' +
		'--></div><!-- end of ' +
		fieldName +
		' -->'; //do not insert redundant spaces between fields. Because this may affect fields layout.

	return content;
};
