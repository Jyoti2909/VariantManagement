var frameArguments;
var arasPropView;
var availableProperties;
var titleText;
var queryItem;
var initialProperties = {};

var findPropertiesXPath =
	"Relationships/Item[@type='qry_QueryItemSelectProperty' and not(@action='delete')]";

function start(args) {
	// fill form with args
	init(args);

	switch (frameArguments.evType) {
		case 'click':
			editSelectedProperties();
			break;
		case 'hover':
			showSelectedProperties();
			break;
	}
}

function onCloseDialog() {
	if (frameArguments.evType == 'click') {
		var propName;
		var isDirty = false;
		var relationshipsNd = queryItem.node.selectSingleNode('Relationships');

		var selects = document.getElementsByClassName('sys_f_select');
		// except last select
		for (var i = 0; i < selects.length - 1; i++) {
			var select = selects[i];
			propName = select.options[select.selectedIndex].value;
			if (
				!relationshipsNd ||
				!relationshipsNd.selectSingleNode(
					"Item[@type='qry_QueryItemSelectProperty' and property_name='" +
						propName +
						"']"
				)
			) {
				var newProperty = queryItem.createRelationship(
					'qry_QueryItemSelectProperty',
					'add'
				);
				newProperty.setProperty('property_name', propName);
				isDirty = true;
			} else {
				delete initialProperties[propName];
			}
		}
		for (propName in initialProperties) {
			var propNd = relationshipsNd.selectSingleNode(
				"Item[@type='qry_QueryItemSelectProperty' and property_name='" +
					propName +
					"']"
			);
			if (propNd.getAttribute('isNew') === '1') {
				relationshipsNd.removeChild(propNd);
			} else {
				propNd.setAttribute('action', 'delete');
			}
			isDirty = true;
		}
		if (isDirty) {
			queryItem.setAttribute('isDirty', '1');
		}
		if (frameArguments.closeCallback) {
			frameArguments.closeCallback();
		}
		return queryItem;
	}
}

function init(args) {
	frameArguments = args;
	arasPropView = args.aras;
	titleText = arasPropView.getResource(
		'../Modules/aras.innovator.QueryBuilder/',
		'action.manage.selectedprops_title'
	);
	availableProperties = frameArguments.currentElement.properties;

	queryItem = arasPropView.newIOMItem();
	queryItem.dom = frameArguments.currentElement.node.ownerDocument;
	queryItem.node = frameArguments.currentElement.node;
}

function showSelectedProperties() {
	var showPropertiesEl = document.getElementById('showProperties');
	createNewElement(showPropertiesEl, 'span', 'title', titleText);

	var parentElement = document.createElement('ul');
	showPropertiesEl.appendChild(parentElement);

	var propertyNds = queryItem.node.selectNodes(findPropertiesXPath);
	for (var i = 0; i < propertyNds.length; i++) {
		var propertyName = arasPropView.getItemProperty(
			propertyNds[i],
			'property_name'
		);
		var property = getPropertyByName(propertyName, availableProperties) || {
			name: propertyName,
			label: propertyName,
			className: 'showProperties__property_deleted'
		};

		createNewElement(parentElement, 'li', property.className, property.label);
	}

	showPropertiesEl.style.display = 'block';
}

function getPropertyByName(name, properties) {
	return properties.find(function (property) {
		return property.name === name;
	});
}

function isOnlySingleProperty(customConfig) {
	return customConfig && customConfig.isLimitToSelectOnlySingleProperty;
}

function editSelectedProperties() {
	var editPropertiesEl = document.getElementById('editProperties');
	createNewElement(editPropertiesEl, 'span', 'title', titleText);

	var propertyNds = queryItem.node.selectNodes(findPropertiesXPath);
	for (var i = 0; i < propertyNds.length; i++) {
		var propertyName = arasPropView.getItemProperty(
			propertyNds[i],
			'property_name'
		);
		var property = getPropertyByName(propertyName, availableProperties) || {
			name: propertyName,
			label: propertyName
		};
		initialProperties[property.name] = property;
		createNewDropdownElement(property, editPropertiesEl);
	}
	createNewDropdownElement(
		null,
		editPropertiesEl,
		isOnlySingleProperty(frameArguments.customizationConfig) &&
			!!propertyNds.length
	);

	editPropertiesEl.style.display = 'block';
}

function createNewDropdownElement(property, parentElement, isHidden) {
	var containerDiv = createNewElement(
		parentElement,
		'div',
		'container_select_prop'
	);
	if (isHidden) {
		containerDiv.style.display = 'none';
	}

	parentElement = containerDiv;

	parentElement = createNewElement(parentElement, 'div', 'sys_f_div_select');
	var selectElement = createNewElement(parentElement, 'select', 'sys_f_select');
	newElement = createNewElement(parentElement, 'span', 'sys_f_span_select');

	fillSelect(property, selectElement);

	if (property) {
		showDeleteImg(containerDiv);
	}
}

function fillSelect(selectedProperty, select) {
	var selectedIndex = null,
		selectedPropName;
	if (!selectedProperty) {
		selectedIndex = 0;
		addPlaceholderOption(select);
	} else {
		selectedPropName = selectedProperty.name;
	}
	const propertyDataType =
		frameArguments && frameArguments.customizationConfig
			? frameArguments.customizationConfig.propertyDataType
			: null;
	const properties =
		propertyDataType != null
			? this.availableProperties.filter(
					(prop) =>
						prop.dataType.toLowerCase() === propertyDataType.toLowerCase()
			  )
			: this.availableProperties;
	for (var i = 0; i < properties.length; i++) {
		var property = properties[i];
		select.add(new Option(property.label, property.name));
		if (selectedIndex === null && selectedPropName === property.name) {
			selectedIndex = i;
		}
	}
	if (selectedProperty && selectedIndex === null) {
		select.add(new Option(selectedProperty.label, selectedProperty.name));
		selectedIndex = i;
	}
	select.selectedIndex = selectedIndex;
	this.onChangeSelect.call(select, null, true);
	select.addEventListener('change', this.onChangeSelect);
}

function onChangeSelect(ev, keepPlaceholder) {
	var spanSelect = this.parentNode.querySelector('.sys_f_span_select');
	spanSelect.textContent = this.options[this.selectedIndex].textContent;

	if (!keepPlaceholder && spanSelect.classList.contains('placeholder')) {
		showDeleteImg(this.parentNode.parentNode);
		spanSelect.classList.remove('placeholder');
		var editPropertiesEl = document.getElementById('editProperties');
		createNewDropdownElement(
			null,
			editPropertiesEl,
			isOnlySingleProperty(frameArguments.customizationConfig)
		);
	}
}

function addPlaceholderOption(select) {
	var option = document.createElement('option');
	option.setAttribute('value', '');
	option.setAttribute('disabled', '');
	option.setAttribute('selected', '');
	option.textContent = arasPropView.getResource(
		'../Modules/aras.innovator.QueryBuilder/',
		'action.manage.add_property'
	);
	select.appendChild(option);
	select.parentNode
		.querySelector('.sys_f_span_select')
		.classList.add('placeholder');
}

function showDeleteImg(parentElement) {
	var imgElement = document.createElement('img');
	imgElement.style.cursor = 'pointer';
	imgElement.setAttribute('border', '0');
	imgElement.setAttribute(
		'src',
		arasPropView.getBaseURL() + '/images/Delete.svg'
	);
	imgElement.onclick = onDeleteHandler;
	parentElement.appendChild(imgElement);
}

function onDeleteHandler() {
	var editPropertiesEl = document.getElementById('editProperties');
	editPropertiesEl.removeChild(this.parentNode);

	if (isOnlySingleProperty(frameArguments.customizationConfig)) {
		let containerDivElements = document.getElementsByClassName(
			'container_select_prop'
		);
		if (containerDivElements && containerDivElements[0]) {
			containerDivElements[0].style.display = '';
		}
	}
}

function createNewElement(parentElement, elementName, className, textContent) {
	var newElement = document.createElement(elementName);
	if (className) {
		newElement.className = className;
	}
	if (textContent) {
		newElement.textContent = textContent;
	}
	parentElement.appendChild(newElement);
	return newElement;
}
