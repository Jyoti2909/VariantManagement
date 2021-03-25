// Activity object
function Activity(actNd) {
	if (actNd && actNd.xml) {
		this.node = actNd;
		var id = actNd.getAttribute('id');
		if (!id) {
			this.setError('Wrong input parameter id');
			return null;
		}

		this.id = id;
		var label = aras.getItemProperty(this.node, 'label', '');
		var name;
		if (label == undefined || label == '') {
			name = aras.getItemProperty(this.node, 'name', '');
		} else {
			name = label;
		}
		this.name = name;
	} else {
		this.setError('Activity node is not specified.');
		return null;
	}

	//two arrays must have the same length
	var fieldNames = new Array(
		'managedById',
		'role',
		'status',
		'escalateTo',
		'duration',
		'message'
	);
	var propNames = new Array(
		'managed_by_id',
		'role',
		'state',
		'escalate_to',
		'expected_duration',
		'message'
	);

	this.re4ItemProps = /^managed_by_id$|^role$|^escalate_to$/; //properties having type=Item

	this.fields = new Array();
	var tmpField;
	for (var i = 0; i < fieldNames.length; i++) {
		tmpField = new Object();
		tmpField.field = document.getElementById(fieldNames[i]);
		tmpField.propName = propNames[i];
		if (tmpField.field && tmpField.propName) {
			this.fields.push(tmpField);
		}
	}

	if (!this.node.selectSingleNode('Relationships')) {
		this.node.appendChild(
			this.node.ownerDocument.createElement('Relationships')
		);
	}
	var tmpNd = this.node.selectSingleNode('Relationships');
	this.allAssignments = new Assignments(tmpNd);
	var isGridEditable = isIdentityInRole(
		aras.getUserID(),
		aras.getItemProperty(this.node, 'managed_by_id'),
		true
	);
	isGridEditable = isGridEditable
		? Boolean(
				aras.getItemProperty(parent.item, 'state') == 'Active' &&
					aras.getItemProperty(parent.item, 'locked_by_id', '') ==
						aras.getUserID() &&
					aras.getItemProperty(this.node, 'state') != 'Closed' &&
					aras.getItemProperty(this.node, 'managed_by_id', '') != ''
		  )
		: false;
	this.isGridEditable = isGridEditable;
	this.hasError = false;

	return true;
}
Activity.prototype.node;
Activity.prototype.id;
Activity.prototype.index;
Activity.prototype.name;
Activity.prototype.fields; //array of objects: .field is html field, .propName is corresponding property
Activity.prototype.re4ItemProps;
Activity.prototype.allAssignments;
Activity.prototype.errorMessage;
Activity.prototype.hasError;
Activity.prototype.isGridEditable;

Activity.prototype.setError = function Activity_setError(errMessage) {
	this.hasError = true;
	this.errorMessage = errMessage;
};

Activity.prototype.showInForm = function Activity_showInForm(errMessage) {
	if (this.hasError) return;
	for (let i = 0; i < this.fields.length; i++) {
		let tmpValue = '';
		const propName = this.fields[i].propName;
		if (propName.search(this.re4ItemProps) !== -1) {
			const tmpNd = this.node.selectSingleNode(this.fields[i].propName);
			tmpValue = tmpNd ? tmpNd.getAttribute('keyed_name') : '';
			let color = '';
			if (!tmpValue && tmpNd.getAttribute('is_null') === '0') {
				tmpValue = aras.getResource('', 'common.restricted_property_warning');
				color = restrictedTextColor;
			}
			this.fields[i].field.style.color = color;
		} else {
			tmpValue = aras.getItemProperty(this.node, this.fields[i].propName, '');
		}
		this.fields[i].field.value = tmpValue;
	}

	const targetDropDown = document.getElementById('listOfActivities');
	for (let i = 0; i < targetDropDown.options.length; i++) {
		if (targetDropDown.options[i].id === this.id) {
			targetDropDown.options[i].selected = true;
		}
	}
	aras.updateDomSelectLabel(targetDropDown);
	this.allAssignments.fillGrid();
	setEditableGridAndToolbar(this.isGridEditable);
};

Activity.prototype.addAssignment = function Activity_addAssignment(
	assignmentNd
) {
	var newAssignment = new Assignment(assignmentNd);
	if (newAssignment.hasError) {
		return null;
	}

	this.allAssignments.addAssignment(newAssignment);
	this.allAssignments.selectAssignment(newAssignment.id);
	return true;
};

Activity.prototype.addAssignmentAndFillGrid = function Activity_addAssignmentAndFillGrid(
	assignmentNd,
	targetGrid
) {
	var res = this.addAssignment(assignmentNd);
	if (!res) return null;

	this.allAssignments.selectedAssignment.addRow2Grid(targetGrid);
	return true;
};
