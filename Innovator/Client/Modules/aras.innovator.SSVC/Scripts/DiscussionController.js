///BaseController
window.BaseController = function (aras, itemType, itemId) {
	this.aras = aras;
	this.itemType = itemType;
	this.itemId = itemId;
	this.item = null;
	this.itemsForAggregation = null;
};

//returns innovator Item with secure messages
BaseController.prototype.getSecureMessages = function BaseControllerGetSecureMessages(
	filter
) {
	if (!this.itemsForAggregation) {
		const messagesItm = this.aras.newIOMItem(
			'Method',
			'VC_GetItemsForAggregation'
		);
		const relItem = this.aras.newIOMItem(this.itemType);
		relItem.setID(this.itemId);
		messagesItm.setPropertyItem('Relationships', relItem);
		this.itemsForAggregation = messagesItm.apply();
	}
	return SSVC.ArasHelper.getSecureMessages(this.itemsForAggregation, filter);
};

BaseController.prototype.sendMarkupMessage = function BaseControllerSendMarkupMessage(
	message,
	fileData,
	visibleToIdentity
) {
	const args = fileData;
	args.classification = 'Markup';
	args.comments = message;
	args.visibleToIdentity = visibleToIdentity;
	args.itemId = this.itemId;
	args.itemTypeName = this.itemType;
	return SSVC.ArasHelper.newSecureMessage(args);
};

BaseController.prototype.sendMarkupReply = function BaseControllerSendMarkupReply(
	message,
	replyToId,
	fileData,
	visibleToIdentity
) {
	fileData.replyToId = replyToId;
	const messageItem = this.sendMarkupMessage(
		message,
		fileData,
		visibleToIdentity
	);
	messageItem.buildStructure();
	return messageItem;
};

BaseController.prototype.sendMessage = function BaseControllerSendMessage(
	message,
	visibleToIdentity
) {
	const args = {
		comments: message,
		visibleToIdentity: visibleToIdentity,
		itemId: this.itemId,
		itemTypeName: this.itemType
	};
	const secureMessage = SSVC.ArasHelper.newSecureMessage(args);
	if (!secureMessage.isError()) {
		return secureMessage;
	}
};

BaseController.prototype.sendReply = function BaseControllerSendMessage(
	itemTypeName,
	itemId,
	replyToId,
	message,
	visibleToIdentity
) {
	const args = {
		comments: message,
		visibleToIdentity: visibleToIdentity,
		replyToId: replyToId,
		itemTypeName: itemTypeName,
		itemId: itemId
	};
	const messageItem = new SSVC.ArasHelper.newSecureMessage(args);
	messageItem.buildStructure();
	return messageItem;
};

BaseController.prototype.getItem = function BaseControllerGetItem() {
	if (!this.item) {
		let item = this.aras.newIOMItem(this.itemType, 'get');
		item.setID(this.itemId);
		item = item.apply();
		if (!item.isError()) {
			this.item = item;
		}
	}
	return this.item;
};

///BaseController

///ForumController
function ForumController(aras, itemType, itemId) {
	this.aras = aras;
	this.itemType = itemType;
	this.itemId = itemId;
}

ForumController.prototype = new BaseController();

ForumController.prototype.getSecureMessages = function ForumControllerGetSecureMessages(
	filter
) {
	let messages = this.aras.newIOMItem(this.itemType, 'VC_GetForumMessages');
	messages.setID(this.itemId);
	if (filter) {
		messages.setPropertyItem('filter', filter);
	}
	messages = messages.apply();
	const itms = new SSVC.ArasHelper.newSecureMessageShell(messages);
	return itms;
};

///ForumController

///ForumMessageGroupController
function ForumMessageGroupController(aras, itemType, itemId) {
	this.aras = aras;
	this.itemType = itemType;
	this.itemId = itemId;
}

ForumMessageGroupController.prototype = new BaseController();
ForumMessageGroupController.prototype.sendMessage = function () {};

ForumMessageGroupController.prototype.getSecureMessages = function ForumMessageGroupControllerGetSecureMessages(
	filter
) {
	function getAllSecureMessages(aras, itemType, userId, filter) {
		const result = aras.newIOMItem(itemType, 'VC_GetAllMessagesForUser');
		result.setID(userId);
		if (filter) {
			result.setPropertyItem('filter', filter);
		}
		return result.apply();
	}
	function getSecureMessagesForFMG(aras, itemType, itemId, filter) {
		const result = aras.newIOMItem(itemType, 'VC_GetFMGMessages');
		result.setID(itemId);
		if (filter) {
			result.setPropertyItem('filter', filter);
		}
		return result.apply();
	}

	let messages;
	if (this.itemId === 'allmessages') {
		messages = getAllSecureMessages(
			this.aras,
			this.itemType,
			this.aras.getUserID(),
			filter
		);
	} else {
		messages = getSecureMessagesForFMG(
			this.aras,
			this.itemType,
			this.itemId,
			filter
		);
	}

	return new SSVC.ArasHelper.newSecureMessageShell(messages);
};

function ForumSearchController(aras, itemType, itemId) {
	this.aras = aras;
	this.itemType = itemType;
	this.itemId = itemId;
}
ForumSearchController.prototype = new BaseController();
ForumSearchController.prototype.sendMessage = function () {};
ForumSearchController.prototype.getSecureMessages = function (filter) {
	const forumSearch = this.aras.newIOMItem(
		this.itemType,
		'VC_GetForumSearchItems'
	);
	forumSearch.setID(this.itemId);
	return SSVC.ArasHelper.getSecureMessages(forumSearch.apply(), filter);
};

function TocCategoryController(aras, itemType, itemId) {
	this.aras = aras;
	this.itemType = itemType;
	this.itemId = itemId;
}
TocCategoryController.prototype = new BaseController();
TocCategoryController.prototype.getSecureMessages = function () {};
