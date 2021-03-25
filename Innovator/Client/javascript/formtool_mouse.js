// (c) Copyright by Aras Corporation, 2004-2011.

//Field that is currently grabbed, or null.
var fieldGrabbed = null;
//X coordinate of mousedown relative to the left border of the field.
var dx = 0;
//Y coordinate of mousedown relative to the top border of the field.
var dy = 0;
//
var prevPosition;
//
var highlightedSpanShortID = '';
//True if field is resizing, otherwise - false;
var isResizing = false;
//Change x coordinate when scrolling window.
var movingDX = 3;
//Change y coordinate when scrolling window.
var movingDY = 3;

var bodyElement =
	document.compatMode == 'CSS1Compat'
		? document.documentElement
		: document.body;
bodyElement.style.height = bodyElement.offsetHeight - 28;
bodyElement.style.width = bodyElement.offsetWidth - 28;

//Returns span container for given element.
function getSpan(elm) {
	if (!elm) {
		return null;
	}
	if (elm.id.search(/^\w{32}span/) === 0) {
		return elm;
	}
	return getSpan(elm.parentElement);
}

//Add cover table for current element.
function createCoverTable(currentElement) {
	removeCoverTable();

	var tableEl = document.createElement('table');
	var tbodyEl = document.createElement('tbody');
	var trEl = document.createElement('tr');
	var tdEl = document.createElement('td');

	tableEl.appendChild(tbodyEl);
	tbodyEl.appendChild(trEl);
	trEl.appendChild(tdEl);

	tableEl.setAttribute('id', 'coverTable', false);
	tableEl.style.border = '1px dashed black';
	tableEl.setAttribute('width', currentElement.offsetWidth, false);
	tableEl.setAttribute('height', currentElement.offsetHeight, false);
	tableEl.style.position = 'absolute';
	tableEl.style.top = currentElement.offsetTop + 'px';
	tableEl.style.left = currentElement.offsetLeft + 'px';

	document.forms[0].appendChild(tableEl);
	if (tableEl.setCapture) {
		tableEl.setCapture();
	}
}

// Remove cover table from form.
function removeCoverTable() {
	var tableEl = document.getElementById('coverTable');
	if (tableEl !== null) {
		if (tableEl.releaseCapture) {
			tableEl.releaseCapture();
		}
		document.forms[0].removeChild(tableEl);
	}
}

function onloadHandler() {
	//Need to set focus to window to handle onblur event correctly.
	window.focus();
}

function onmouseoverHandler(event) {
	event = event ? event : window.event;
	var fields = parent.fieldGrid;
	var elm = event.srcElement ? event.srcElement : event.target;
	if (!elm || !fields) {
		return false;
	}

	if (elm.tagName == 'SELECT') {
		elm.disabled = true;
	}

	if (fieldGrabbed) {
		return false;
	}
	if (event.button % 2 == 1) {
		return false;
	}

	var spanElem = getSpan(elm);
	if (!spanElem) {
		if (highlightedSpanShortID != fields.currFldID) {
			fields.unSelectField(highlightedSpanShortID);
			highlightedSpanShortID = '';
		}
		return false;
	} else {
		var spanElemID = spanElem.id;
		spanElemID = spanElemID.substring(0, spanElemID.lastIndexOf('span'));
		if (highlightedSpanShortID != spanElemID) {
			if (
				highlightedSpanShortID &&
				highlightedSpanShortID != fields.currFldID
			) {
				fields.unSelectField(highlightedSpanShortID);
			}

			highlightedSpanShortID = spanElemID;
			if (highlightedSpanShortID != fields.currFldID) {
				fields.selectField(highlightedSpanShortID, 'blue');
			} else {
				fields.selectField(highlightedSpanShortID, 'black');
			}
		}

		elm.style.cursor = event.altKey ? 'se-resize' : 'pointer';
	}

	return false;
}

function onmouseoutHandler(event) {
	event = event ? event : window.event;
	var elm = event.srcElement ? event.srcElement : event.target;
	if (elm && elm.tagName == 'SELECT') {
		elm.disabled = false;
	}
}

function onmousedownHandler(event) {
	event = event || window.event;
	var fields = parent.fieldGrid;
	var elm = event.srcElement || event.target;
	var spanElem = getSpan(elm);
	if (!spanElem || !fields) {
		return true;
	}
	window.focus();

	var fieldID = spanElem.id.substr(0, 32);
	fields.grid.setSelectedRow(fieldID, false, true);
	//sync XmlHttpRequest of fields.onSelectGridRow eats onmouseup event in FF (known bug of FF). setTimeout is a workaround.
	window.setTimeout(function () {
		fields.onSelectGridRow(fieldID, 1, false);
	}, 0);

	if (event.altKey) {
		isResizing = true;
	}

	fieldGrabbed = spanElem;
	//Change cursor styles
	if (isResizing) {
		fieldGrabbed.style.cursor = 'se-resize';
	} else {
		fieldGrabbed.style.cursor = 'move';
		bodyElement.style.cursor = 'move';
	}

	if (fieldGrabbed.style.position != 'absolute') {
		prevPosition = fieldGrabbed.style.position;
		fieldGrabbed.style.position = 'absolute';
	} else {
		prevPosition = undefined;
	}

	dx = event.clientX - fieldGrabbed.offsetLeft + bodyElement.scrollLeft;
	dy = event.clientY - fieldGrabbed.offsetTop + bodyElement.scrollTop;

	createCoverTable(fieldGrabbed);
	return false;
}

function onmouseupHandler() {
	if (!fieldGrabbed) {
		return false;
	}

	var fields = parent.fieldGrid;
	var tabs = parent.document.getElementById('tabs').contentWindow;
	var properties = parent.document.getElementById('properties').contentWindow;
	//Change cursor styles
	fieldGrabbed.style.cursor = 'pointer';
	bodyElement.style.cursor = 'default';

	if (prevPosition) {
		fieldGrabbed.style.position = prevPosition;
	}

	var fieldWasChanged = false;
	var currFldNode = fields.currFldNode;
	if (isResizing) {
		var oldWidth = aras.getNodeElement(currFldNode, 'width');
		var oldHeight = aras.getNodeElement(currFldNode, 'height');
		var newWidth = fieldGrabbed.style.posWidth - 2;
		var newHeight = fieldGrabbed.style.posHeight - 2;

		fieldWasChanged = newWidth != oldWidth || newHeight != oldHeight;

		if (fieldWasChanged) {
			aras.setNodeElement(currFldNode, 'width', newWidth);
			aras.setNodeElement(currFldNode, 'height', newHeight);
		}
		isResizing = false;
	} else {
		var oldX = aras.getNodeElement(currFldNode, 'x');
		var oldY = aras.getNodeElement(currFldNode, 'y');
		var newX = parseInt(fieldGrabbed.style.left, 10);
		var newY = parseInt(fieldGrabbed.style.top, 10);

		var snap = parent.parent.snap;
		if (snap > 1) {
			newX = Math.round(newX / snap) * snap;
			newY = Math.round(newY / snap) * snap;
			fieldGrabbed.style.left = newX + 'px';
			fieldGrabbed.style.top = newY + 'px';
		}

		// +1 is used because of function selectField has code: spanElem.style.posLeft -= 1; spanElem.style.posTop -= 1;
		fieldWasChanged = oldX != newX + 1 || oldY != newY + 1;
		if (fieldWasChanged) {
			aras.setNodeElement(currFldNode, 'x', newX);
			aras.setNodeElement(currFldNode, 'y', newY);
		}
	}

	if (fieldWasChanged) {
		if (
			currFldNode.getAttribute('action') != 'add' &&
			currFldNode.getAttribute('action') != 'create'
		) {
			currFldNode.setAttribute('action', 'update');
		}

		var currTabID = tabs.currTabID;

		if (
			currTabID.search(/^field/) === 0 &&
			currTabID != aras.getRelationshipTypeId('Field Event')
		) {
			aras.uiPopulateFormWithItemEx(
				properties.document.forms.MainDataForm,
				currFldNode,
				properties.document.itemType,
				parent.isEditMode
			);
		}
	}

	if (fieldWasChanged) {
		tabs.handleFormChange(null, null, true, false);
	}

	removeCoverTable();
	fieldGrabbed = null;
	return false;
}

function onkeypressHandler(event) {
	event = event || window.event;
	var fields = parent.fieldGrid;
	if (!fieldGrabbed) {
		return false;
	}
	var keyCode = event.keyCode;
	if (event.which) {
		keyCode = event.which;
	}
	if (keyCode == 27) {
		var srcElement = event.srcElement ? event.srcElement : event.target;
		srcElement.style.cursor = 'se-resize';
		var fieldNd = fields.currFldNode;

		var propNd = parent.itemType
			? parent.itemType.selectSingleNode(
					'Relationships/Item[@id="' +
						aras.getNodeElement(fieldNd, 'propertytype_id') +
						'" and @type="Property"]'
			  )
			: null;
		fieldGrabbed.outerHTML = aras.uiDrawFieldEx(
			fieldNd,
			propNd,
			'edit_form',
			parent.itemType
		);
		fieldGrabbed = null;

		fields.selectField(fields.currFldID);
	}

	return false;
}

function onmousemoveHandler(event) {
	if (!fieldGrabbed) {
		return false;
	}
	event = event || window.event;

	if (isResizing) {
		//Resizing element
		//Set new element size
		fieldGrabbed.style.posWidth = event.x - fieldGrabbed.offsetLeft;
		fieldGrabbed.style.posHeight = event.y - fieldGrabbed.offsetTop;
	} else {
		//Moving element
		//Calculate new element coordinates
		var newX = bodyElement.scrollLeft + event.clientX - dx;
		var newY = bodyElement.scrollTop + event.clientY - dy;
		newX = newX > 0 ? newX : 0;
		newY = newY > 0 ? newY : 0;

		//Set new coordinates
		fieldGrabbed.style.left = newX + 'px';
		fieldGrabbed.style.top = newY + 'px';

		//Calculate scrolling
		var _movingDY = 0;
		var _movingDX = 0;

		if (newY - bodyElement.scrollTop + 20 >= bodyElement.clientHeight) {
			_movingDY = movingDY;
		}

		if (newY - bodyElement.scrollTop - 20 <= 0 && bodyElement.scrollTop > 0) {
			_movingDY = -movingDY;
		}

		if (
			newX + fieldGrabbed.offsetWidth - bodyElement.scrollLeft >=
			bodyElement.clientWidth
		) {
			_movingDX = movingDX;
		}

		if (newX - bodyElement.scrollLeft - 20 <= 0 && bodyElement.scrollLeft > 0) {
			_movingDX = -movingDX;
		}

		bodyElement.style.width =
			parseInt(bodyElement.style.width.replace('px', '')) + _movingDX;
		bodyElement.style.height =
			parseInt(bodyElement.style.height.replace('px', '')) + _movingDY;

		scrollBy(_movingDX, _movingDY);
	}

	return false;
}

//Simulate omouseup event to finish element dragging when window loses focus.
function onblurHandler() {
	if (fieldGrabbed) {
		fieldGrabbed.fireEvent('onmouseup');
	}
}

function dummyHandler() {
	return false;
}

window.onload = onloadHandler;
window.onblur = onblurHandler;

bodyElement.onmouseover = onmouseoverHandler;
bodyElement.onmouseout = onmouseoutHandler;
bodyElement.onmousedown = onmousedownHandler;
bodyElement.onmouseup = onmouseupHandler;
bodyElement.onkeypress = onkeypressHandler;
bodyElement.onmousemove = onmousemoveHandler;

bodyElement.onbeforeeditfocus = dummyHandler;
bodyElement.onselectstart = dummyHandler;
bodyElement.onclick = dummyHandler;
bodyElement.ondblclick = dummyHandler;
bodyElement.onscroll = dummyHandler;
