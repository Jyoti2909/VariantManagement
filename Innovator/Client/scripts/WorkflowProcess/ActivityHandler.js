// ActivityHandler object
function ActivityHandler(selectActiveActFlag) {
	if (!parent.item || !parent.item.xml) return;

	var curWflProcess = parent.item;
	if (
		parent.item.getAttribute('isDirty') != '1' &&
		!parent.item.getAttribute('action')
	) {
		//if no action is specified then reload Workflow Process data from server
		var aml =
			'' +
			'<AML>' +
			"<Item type='Workflow Process' action='get' id='" +
			parent.itemID +
			"'>" +
			'<Relationships>' +
			"<Item type='Workflow Process Activity' action='get' select='related_id'>" +
			'<related_id>' +
			"<Item type='Activity' action='get' select='name, label, state, escalate_to, role, expected_duration, message, managed_by_id'>" +
			"<cloned_as condition='is null'/>" +
			'<Relationships>' +
			"<Item type='Activity Assignment' action='get' select='related_id(keyed_name),is_required,for_all_members,voting_weight,escalate_to'/>" +
			'</Relationships>' +
			'</Item>' +
			'</related_id>' +
			'</Item>' +
			'</Relationships>' +
			'</Item>' +
			'</AML>';

		var q = aras.newIOMItem();
		q.loadAML(aml);
		var r = q.apply();

		if (!r.isError()) {
			parent.item.text = ''; //clear "old" data
			aras.mergeItem(parent.item, r.node); //merge new data
		}

		q = undefined;
		r = undefined;
	}

	this.actArray = new Array();
	var actNds = curWflProcess.selectNodes(
		".//Relationships/Item[@type='Workflow Process Activity']/related_id/Item[@type='Activity']"
	);
	for (var i = 0; i < actNds.length; i++) {
		var tmpAct = new Activity(actNds[i]);
		if (tmpAct && !tmpAct.hasError) {
			this.actArray.push(tmpAct);
		}
	}

	this.fillListOfActivities();
	if (selectActiveActFlag) {
		var activeActID = null;
		for (var i = 0; i < this.actArray.length; i++) {
			var is_active = aras.getItemProperty(this.actArray[i].node, 'state');
			if (is_active == 'Active') activeActID = this.actArray[i].id;
		}
		if (activeActID) this.selectActivity(activeActID);
	} else {
		this.selectedActivity = null;
	}
}

ActivityHandler.prototype.actArray;
ActivityHandler.prototype.selectedActivity;

ActivityHandler.prototype.handleActivity = function ActivityHandler_handleActivity(
	actId
) {
	var act = null;
	for (var i = 0; i < this.actArray.length; i++) {
		if (this.actArray[i] && this.actArray[i].id == actId) {
			act = this.actArray[i];
			break;
		}
	}

	if (!act) {
		var tmpNd = aras.getItemById('Activity', actId, 0);
		act = new Activity(tmpNd);
		if (act && !act.hasError) {
			this.actArray.push(act);
		} else {
			aras.AlertError('Activity with id=' + actId + ' not found.');
			return;
		}
	}
	this.selectedActivity = act;
	act.showInForm();
};

ActivityHandler.prototype.fillListOfActivities = function ActivityHandler_fillListOfActivities() {
	function addActToList(index, value, label, targetDropDown) {
		var oOption = targetDropDown.options[index]
			? targetDropDown.options[index]
			: document.createElement('OPTION');
		if (!targetDropDown.options[index]) {
			targetDropDown.options.add(oOption);
		}

		var textPropName = aras.browserHelper.getTextContentPropertyName();
		oOption[textPropName] = label;
		oOption.value = value;
		oOption.id = value;
	}

	var targetDropDown = document.getElementById('listOfActivities');
	if (targetDropDown) {
		for (var i = 0; i < this.actArray.length; i++) {
			addActToList(
				i,
				this.actArray[i].id,
				this.actArray[i].name,
				targetDropDown
			);
		}
	}
};
ActivityHandler.prototype.selectActivity = function ActivityHandler_selectActivity(
	id
) {
	for (var i = 0; i < this.actArray.length; i++) {
		if (this.actArray[i].id == id) {
			this.selectedActivity = this.actArray[i];
		}
	}

	if (this.selectedActivity) {
		this.selectedActivity.showInForm();
	}
};
