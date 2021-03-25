//Assigment object
function Assignment(itemNd) {
	if (!itemNd) {
		this.hasError = true;
		return;
	}
	this.node = itemNd;
	this.id = itemNd.getAttribute('id');
}

Assignment.prototype.node;
Assignment.prototype.hasError;
Assignment.prototype.id;
Assignment.prototype.re4ItemProps = /^related_id$|^escalate_to$/;
Assignment.prototype.re4BoolProps = /^is_required$|^for_all_members$/;
Assignment.prototype.propNames = new Array(
	'related_id',
	'is_required',
	'for_all_members',
	'voting_weight',
	'escalate_to'
);
Assignment.prototype.curColNumber;

Assignment.prototype.addRow2Grid = function Assignment_addRow2Grid(targetGrid) {
	if (!targetGrid || this.hasError) {
		return '';
	}

	let isDeleted;
	try {
		isDeleted = this.node.getAttribute('action') === 'delete' ? true : false;
	} catch (e) {}

	targetGrid.addRow(this.id, '', false);
	for (let i = 0; i < this.propNames.length; i++) {
		const curCell = targetGrid.cells(this.id, i);
		if (curCell) {
			const curPropName = this.propNames[i];
			let val = '';
			if (curPropName.search(this.re4ItemProps) !== -1) {
				let tmpNd = this.node.selectSingleNode(curPropName + '/Item');
				val = tmpNd ? aras.getItemProperty(tmpNd, 'keyed_name', '') : '';
				let color = '';
				if (!val) {
					tmpNd = this.node.selectSingleNode(curPropName);
					val = tmpNd ? tmpNd.getAttribute('keyed_name') : '';
					if (!val && tmpNd && tmpNd.getAttribute('is_null') === '0') {
						val = aras.getResource('', 'common.restricted_property_warning');
						color = restrictedTextColor;
					}
				}
				curCell.setTextColor(color);
			} else if (curPropName.search(this.re4BoolProps) !== -1) {
				let boolVal = aras.getItemProperty(this.node, curPropName, '');
				boolVal = !boolVal || boolVal === '0' ? '0' : '1';
				val = '<checkbox state="' + boolVal + '">';
			} else {
				val = aras.getItemProperty(this.node, curPropName, '');
			}

			if (val) {
				curCell.setValue(val);
			}
			if (isDeleted) {
				curCell.setFont(deletedRowFont);
			}
		}
	}
	return;
};

Assignment.prototype.getPropType = function Assignment_getPropType(colNumber) {
	var propName = this.getPropNameByColumn(colNumber);
	var res;
	if (!propName) {
		res = null;
	} else if (propName.search(this.re4ItemProps) != -1) {
		res = 'item';
	} else if (propName.search(this.re4BoolProps) != -1) {
		res = 'bool';
	} else {
		res = 'text';
	}
	return res;
};

Assignment.prototype.getPropNameByColumn = function Assignment_getPropNameByColumn(
	colNumber
) {
	switch (colNumber) {
		case 0:
			return 'related_id';
		case 1:
			return 'is_required';
		case 2:
			return 'for_all_members';
		case 3:
			return 'voting_weight';
		case 4:
			return 'escalate_to';
		default:
			return '';
	}
};

Assignment.prototype.setProperty = function Assignment_setProperty(
	colNumber,
	newValue
) {
	if (colNumber == null && this.curColNumber) {
		colNumber = this.curColNumber;
	}

	var propName = this.getPropNameByColumn(colNumber);
	if (propName.search(this.re4ItemProps) != -1) {
		var tmpItem = aras.getItemByKeyedName(
			'Identity',
			newValue,
			0,
			'',
			'keyed_name'
		);
		newValue = tmpItem ? tmpItem.getAttribute('id') : '';
	}

	var res = aras.setItemProperty(this.node, propName, newValue);
	if (this.node.getAttribute('action') != 'add')
		this.node.setAttribute('action', 'edit');

	return res;
};
