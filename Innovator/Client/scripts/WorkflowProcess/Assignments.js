//Assigments object
function Assignments(relshipsNd) {
	this.itemsArray = new Array();
	this.RelationshipsNd = relshipsNd;
	if (relshipsNd) {
		var assignmentNds = this.RelationshipsNd.selectNodes(
			"Item[@type='Activity Assignment']"
		);
		var tmpAssignment;
		for (var i = 0; i < assignmentNds.length; i++) {
			tmpAssignment = new Assignment(assignmentNds[i]);
			this.itemsArray.push(tmpAssignment);
		}
	}

	this.selectedAssignment = null;
	this.grid = grid;
}

Assignments.prototype.RelationshipsNd;
Assignments.prototype.selectedAssignment;
Assignments.prototype.hasError;
Assignments.prototype.itemsArray;
Assignments.prototype.grid;

Assignments.prototype.fillGrid = function Assignments_fillGrid() {
	if (!this.grid) return;

	var rowsNum = this.grid.getRowCount();
	var rowId = '';
	for (var i = rowsNum - 1; i >= 0; i--) {
		rowId = this.grid.getRowId(i);

		if (rowId) {
			this.grid.deleteRow(rowId);
		}
	}

	if (!this.RelationshipsNd) return;
	for (var i = 0; i < this.itemsArray.length; i++) {
		this.itemsArray[i].addRow2Grid(this.grid);
	}
};
Assignments.prototype.selectAssignment = function Assignments_selectAssignment(
	id,
	colNumber
) {
	if (!id) {
		this.selectedAssignment = null;
		return;
	} else {
		for (var i = 0; i < this.itemsArray.length; i++) {
			if (this.itemsArray[i].id == id)
				this.selectedAssignment = this.itemsArray[i];
		}
	}

	if (this.selectedAssignment) {
		this.selectedAssignment.curColNumber = colNumber;
	}
};
Assignments.prototype.addAssignment = function Assignments_addAssignment(
	newAssignment
) {
	this.itemsArray.push(newAssignment);
};

Assignments.prototype.getAssignment = function Assignments_getSelectedAssignment(
	id
) {
	var res = null;
	for (var i = 0; i < this.itemsArray.length; i++) {
		if (this.itemsArray[i].id == id) res = this.itemsArray[i];
	}

	return res;
};

Assignments.prototype.removeAssignment = function Assignments_removeAssignment(
	id
) {
	if (this.RelationshipsNd) {
		var nd2del = this.RelationshipsNd.selectSingleNode(
			"Item[@id='" + id + "']"
		);
		if (nd2del) {
			nd2del.parentNode.removeChild(nd2del);
		}
	}

	var j = -1;
	for (var i = 0; i < this.itemsArray.length; i++) {
		if (this.itemsArray[i].id == id) {
			j = i;
		}
	}

	if (j > -1) {
		this.itemsArray.splice(j, 1);
	}
};
