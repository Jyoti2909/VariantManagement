// © Copyright by Aras Corporation, 2004-2007.

/*-- newWorkflowMap
 *
 *   Method to create a new workflow map
 *
 */
Aras.prototype.newWorkflowMap = function () {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.creating_workflow_map'),
		'../images/Progress.gif'
	);
	var res = this.soapSend(
		'ApplyItem',
		'<Item type="Method" action="New Workflow Map"/>'
	);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}

	var item = res.results.selectSingleNode(this.XPathResult('/Item'));
	item.setAttribute('levels', 2);
	item.setAttribute('loaded', '1');
	item.setAttribute('isTemp', '1');
	var itemID = item.getAttribute('id');
	return item;
};

/*-- initiateWorkflow
 *
 *   Method to initiate a new workflow process
 *   workflowMapID   = the id for the Workflow Map to be used as a template
 *   item           = the item for which new workflow process should be created
 *
 */
Aras.prototype.initiateWorkflow = function (workflowMapID, item) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.initiating_workflow'),
		'../images/Progress.gif'
	);

	var body =
		'<WorkflowMap>' +
		workflowMapID +
		'</WorkflowMap>' +
		'<Item type="' +
		item.getAttribute('type') +
		'" id="' +
		item.getAttribute('id') +
		'" />';

	var res = this.soapSend('InitiateWorkflow', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}

	var process = res.results.selectSingleNode('//Item');
	process.setAttribute('levels', '1');
	process.setAttribute('loaded', '1');

	var workflow = this.newRelationship(
		this.getItemFromServerByName('RelationshipType', 'Workflow', 'id').getID(),
		item
	);
	var relatedId = workflow.selectSingleNode('related_id');
	relatedId.replaceChild(
		process.cloneNode(true),
		relatedId.selectSingleNode('Item')
	);
	this.setNodeElement(
		workflow,
		'source_type',
		this.getItemFromServerByName(
			'ItemType',
			item.getAttribute('type'),
			'id'
		).getID()
	);
	return true;
};

/*-- startWorkflow
 *
 *   Method to start the workflow process
 *   workflowProcess  = the workflow process that should be started
 *
 */
Aras.prototype.startWorkflow = function (workflowProcess) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.starting_workflow_process'),
		'../images/Progress.gif'
	);
	var body =
		'<Item type="Workflow Process" id="' +
		workflowProcess.getAttribute('id') +
		'" action="StartWorkflow"/>';
	var res = this.soapSend('ApplyItem', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}

	var result = res.results.selectSingleNode(this.XPathResult());
	if (result.text !== 'Ok') {
		return false;
	} else {
		return true;
	}
};

/*-- stopWorkflow
 *
 *   Method to stop the workflow process
 *   workflowProcess  = the workflow process that should be stopped
 *
 */
Aras.prototype.stopWorkflow = function (workflowProcess) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.starting_workflow_process'),
		'../images/Progress.gif'
	);
	var body =
		'<Item type="Workflow Process" id="' +
		workflowProcess.getAttribute('id') +
		'" action="StopWorkflow" />';
	var res = this.soapSend('ApplyItem', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}

	var result = res.results.selectSingleNode(this.XPathResult());
	if (result.text !== 'Ok') {
		return false;
	} else {
		return true;
	}
};

/*-- activateActivity
 *
 *   Method to activate the activity
 *   activity  = the activity to be activated
 *
 */
Aras.prototype.activateActivity = function (activity) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.activating_activity'),
		'../images/Progress.gif'
	);
	var body =
		'<Item type="Activity" id="' +
		activity.getAttribute('id') +
		'" action="ActivateActivity" />';
	var res = this.soapSend('ApplyItem', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}

	var result = res.results.selectSingleNode(this.XPathResult());
	if (result.text !== 'Ok') {
		return false;
	} else {
		return true;
	}
};

/*-- evaluateActivity
 *
 *   Method to close the activity
 *   activity  = the activity to be closed
 *   path      = path that should be followed
 *
 */
Aras.prototype.evaluateActivity = function (body) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.closing_activity'),
		'../images/Progress.gif'
	);
	var res = this.soapSend('EvaluateActivity', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}

	var result = res.results.selectSingleNode(this.XPathResult());
	if (result.text !== 'Ok') {
		return false;
	} else {
		return true;
	}
};

/*-- getAssignedActivities
 *
 *   Returns the Active and Pending Activity items for the user.
 *   The users Activities are those assigned to an Identity for which the user is a Member
 *
 */
Aras.prototype.getAssignedActivities = function (inBasketViewMode) {
	var body = '<inBasketViewMode>' + inBasketViewMode + '</inBasketViewMode>';
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.getting_user_activities'),
		'../images/Progress.gif'
	);
	var res = this.soapSend('GetAssignedActivities', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}
	return res.results.selectNodes(this.XPathResult('/Item'));
};

/*-- loadProcessInstance
 *
 *   Returns an applet ready XML string ofthe running workflow instance.
 *
 */
Aras.prototype.loadProcessInstance = function ArasLoadProcessInstance(
	ProcessId,
	ActivityId
) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.loading_process_map'),
		'../images/Progress.gif'
	);

	var body =
		'<Item type="Workflow Process" pid="' +
		ProcessId +
		'" aid="' +
		ActivityId +
		'"  />';
	var res = this.soapSend('LoadProcessInstance', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}
	return res.results;
};

/*-- BuildProcessReport
 *
 *   Returns an HTML string ofthe running workflow instance - sign-off History
 *
 */
Aras.prototype.BuildProcessReport = function (ProcessId) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.loading_process_statistics'),
		'../images/Progress.gif'
	);
	var body = '<Item type="Workflow Process" id="' + ProcessId + '" />';
	var res = this.soapSend('BuildProcessReport', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}
	return res.results;
};

/*-- StartDefaultWorkflow
 *
 *   Finds the Default Workflow Map for the passed itemType and instance,   and
 *   creates an instance of that Workflow and starts it.
 *
 */
Aras.prototype.StartDefaultWorkflow = function (ItemId, ItemType, ItemTypeId) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.starting_default_workflow'),
		'../images/Progress.gif'
	);
	var body =
		'<Item id="' +
		ItemId +
		'"  type="' +
		ItemType +
		'" typeId="' +
		ItemTypeId +
		'" />';
	var res = this.soapSend('StartDefaultWorkflow', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}
	return res.results;
};

/*-- StartNamedWorkflow
 *
 *   Starts an instance of a Workflow for a specified item
 *   WorkflowMap ID and the Item ID must be passed as arguments
 *
 */
Aras.prototype.StartNamedWorkflow = function (
	ItemId,
	ItemType,
	ItemTypeId,
	WorkflowMapId
) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.starting_named_workflow'),
		'../images/Progress.gif'
	);
	var body =
		'<Item id="' +
		ItemId +
		'"  type="' +
		ItemType +
		'" typeId="' +
		ItemTypeId +
		'" WorkflowMapId="' +
		WorkflowMapId +
		'" />';
	var res = this.soapSend('StartNamedWorkflow', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}
	return res.results;
};

/*-- ReAssignActivity
 *
 *   ReAssigns an Activity to a new Identity
 *   Activity ID and the Identity ID must be passed as arguments
 *
 */
Aras.prototype.ReAssignActivity = function (ActivityId, IdentityId) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.reassigning_activity'),
		'../images/Progress.gif'
	);
	var body =
		'<Item ActivityId="' + ActivityId + '"  IdentityId="' + IdentityId + '" />';
	var res = this.soapSend('ReAssignActivity', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}
	return res.results;
};

/*-- ValidateVote
 *
 *   checks either the Password or E-Signature for a user
 *   Arguments are:  MD5 encrypted string +  "password" or esignature"
 *     returns      pass   or     fail
 */
Aras.prototype.ValidateVote = function (incoming, mode) {
	var statusId = this.showStatusMessage(
		'status',
		this.getResource('', 'workflow_methods.validating_authentication'),
		'../images/Progress.gif'
	);
	var body = '<Item incoming="' + incoming + '" mode="' + mode + '" />';
	var res = this.soapSend('ValidateVote', body);
	if (statusId) {
		this.clearStatusMessage(statusId);
	}

	if (res.getFaultCode() !== 0) {
		this.AlertError(res);
		return false;
	}
	return res.results;
};
