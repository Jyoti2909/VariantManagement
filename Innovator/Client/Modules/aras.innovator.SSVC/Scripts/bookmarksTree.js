///BaseLeaf
function BaseLeaf(rowId) {
	/// <summary>
	/// Base class for Items in Grid
	/// </summary>
	/// <param name="rowId">Id of item in TOC.</param>
	this.rowId = rowId;
}

BaseLeaf.prototype.onClick = function BaseLeafOnClick() {
	/// <summary>
	/// onClick function should contains a logic for onClick action
	/// </summary>
};

BaseLeaf.prototype.select = function BaseLeafSelect() {
	/// <summary>
	/// Select function should contains a logic for select action
	/// if user calls onClick function manually
	/// </summary>
};

BaseLeaf.prototype.onMouseOver = function BaseLeafOnMouseOver() {};

BaseLeaf.prototype.isUserOwner = function BaseLeafIsUserOwner(type, id) {
	const userIdentity = aras.getIsAliasIdentityIDForLoggedUser();
	const item = getItem(type, id);
	if (item.isError()) {
		aras.AlertError(item.getErrorString());
		return;
	}
	const ownerId = item.getProperty('owned_by_id');
	if (ownerId === userIdentity) {
		return true;
	} else {
		return false;
	}

	function getItem(type, id) {
		const item = aras.newIOMItem(type, 'get');
		item.setID(id);
		return item.apply();
	}
};
///BaseLeaf

///TocCategory
function TocCategory(rowId) {
	this.rowId = rowId;
	this.itemTypeName = 'TocCategory';
}

TocCategory.prototype = new BaseLeaf();

TocCategory.prototype.onClick = function TocCategoryOnClick() {
	const args = {
		itemID: this.rowId,
		itemTypeName: this.itemTypeName,
		item: aras.newIOMItem('', 'get')
	};
	eventManager.fireEvent('onTreeItemSelect', args);
};

TocCategory.prototype.onContextMenuCreate = function TocCategoryOnContextMenuCreate() {
	return false;
};
///TocCategory

///Forum
var _forumOwners = {};

function Forum(rowId) {
	this.itemTypeName = 'Forum';
	this.rowId = rowId;
}

Forum.prototype = new BaseLeaf();

Forum.prototype.onMouseOver = function ForumOnMouseOver(ownerId) {
	return getUserByIdentityId(ownerId);

	function getUserByIdentityId(id) {
		if (!_forumOwners[id]) {
			const user = aras.newIOMItem('User', 'get');
			const alias = aras.newIOMItem('Alias', 'get');
			alias.setProperty('related_id', id);
			user.addRelationship(alias);
			_forumOwners[id] = user.apply();
		}
		return _forumOwners[id];
	}
};

Forum.prototype.onClick = function ForumOnClick(withFilters) {
	if (!this.item) {
		this.item = aras.newIOMItem(this.itemTypeName, 'get');
		this.item.setID(this.rowId);
	}
	const args = {
		itemID: this.rowId,
		itemTypeName: this.itemTypeName,
		item: this.item
	};
	if (withFilters) {
		eventManager.fireEvent('onTreeItemReload', args);
	} else {
		eventManager.fireEvent('onTreeItemSelect', args);
	}
};

Forum.prototype.onContextMenuCreate = function ForumOnContextMenuCreate() {
	if (this.rowId === 'allmessages') {
		return false;
	}
	const isOwner = this.isUserOwner(this.itemTypeName, this.rowId);
	const enableShare = aras.isAdminUser() || isOwner;
	const menu = treeControl.contextMenu;
	menu.setHide('setAsDefault', false);
	menu.setHide('rename', !isOwner);
	menu.setHide('remove', !canUnsubscribe(this.rowId));
	menu.setHide('share', !enableShare);
	menu.setHide('open', true);
	return true;

	function canUnsubscribe(id) {
		const forum = getForum(id);
		const mustView = forum.getProperty('must_view_by', '');
		if (mustView) {
			const identitiesIds = getUserIdentitiesIdsArray();
			const mustIds = mustView.split('|');
			for (let i = 0, count = mustIds.length; i < count; i++) {
				if (identitiesIds.indexOf(mustIds[i]) !== -1) {
					return false;
				}
			}
		}
		return true;
	}

	function getUserIdentitiesIdsArray() {
		let userIdentities = aras.newIOMItem('User', 'VC_GetAllUserIdentities');
		userIdentities.setID(aras.getUserID());
		userIdentities = userIdentities.apply();
		if (userIdentities.isError()) {
			return [];
		} else {
			const result = userIdentities.getResult();
			return result.split('|');
		}
	}

	function getForum(id) {
		const forum = aras.newIOMItem('Forum', 'get');
		forum.setAttribute('select', 'must_view_by');
		forum.setID(id);
		return forum.apply();
	}
};

Forum.prototype.setAsDefault = function ForumSetAsDefault() {
	const menuActions = new TreeMenuActions(aras);
	menuActions.setAsDefault(this.itemTypeName, this.rowId);
};

Forum.prototype.remove = function ForumRemove() {
	const menuActions = new TreeMenuActions(aras);
	menuActions.unsubscribe(aras.getUserID(), this.rowId);
	initializeTree();
	selectStartPage();
};

Forum.prototype.rename = function ForumRename() {
	forumsHelper.renameForum(this.rowId);
};

Forum.prototype.share = function ForumShare() {
	const menuActions = new TreeMenuActions(aras);
	const forumId = this.rowId;
	menuActions.share(
		this.rowId,
		'../Modules/aras.innovator.SSVC/Views/SelectShare.html'
	);
};

Forum.prototype.open = function ForumOpen() {
	return false;
};
///Forum

///ForumMessageGroup
function ForumMessageGroup(rowId) {
	this.itemTypeName = 'ForumMessageGroup';
	this.rowId = rowId;
}

ForumMessageGroup.prototype = new Forum();

ForumMessageGroup.prototype.canRemove = function ForumMessageGroupCanRemove(
	userId,
	fmgId
) {
	if (fmgId === 'allmessages') {
		return false;
	}
	const fmg = getItem(this.itemTypeName, fmgId);
	if (fmg.isError()) {
		aras.AlertError(fmg.getErrorString());
		return false;
	}
	const userCriteriaId = fmg.getProperty('user_criteria_id');
	if (userCriteriaId && userCriteriaId === userId) {
		return false;
	}
	return true;

	function getItem(type, fmgId) {
		const item = aras.newIOMItem(type, 'get');
		item.setID(fmgId);
		return item.apply();
	}
};

ForumMessageGroup.prototype.onContextMenuCreate = function ForumMessageGroupOnContextMenuCreate() {
	const menu = treeControl.contextMenu;
	const canRemove = this.canRemove(aras.getUserID(), this.rowId);
	menu.setHide('setAsDefault', false);
	menu.setHide('rename', true);
	menu.setHide('remove', !canRemove);
	menu.setHide('share', true);
	menu.setHide('open', true);
	return true;
};

ForumMessageGroup.prototype.share = function ForumMessageGroupShare() {
	return false;
};
ForumMessageGroup.prototype.onMouseOver = function ForumMessageGroupOnMouseOver() {};

ForumMessageGroup.prototype.remove = function ForumMessageGroupRemove() {
	let forumMessageGroup = aras.newIOMItem('ForumMessageGroup', 'delete');
	forumMessageGroup.setID(this.rowId);
	forumMessageGroup = forumMessageGroup.apply();
	if (forumMessageGroup.isError()) {
		aras.AlertError(forumMessageGroup);
		return;
	}

	initializeTree();
	selectStartPage();
};

///ForumMessageGroup

///ForumItem
function ForumItem(rowId) {
	this.itemTypeName = 'ForumItem';
	this.rowId = rowId;
}

ForumItem.prototype = new ForumMessageGroup();

ForumItem.prototype.onContextMenuCreate = function ForumItemOnContextMenuCreate() {
	const forumItem = this.getForumItem(
		this.itemTypeName,
		this.rowId,
		'source_id(forum_type)'
	);
	if (forumItem.isError()) {
		return;
	}
	const myBookmarkForum = forumItem.getItemsByXPath(
		"//Item/source_id/Item[@type='Forum'][forum_type='MyBookmarks']"
	);
	const menu = treeControl.contextMenu;
	menu.setHide('setAsDefault', !myBookmarkForum.node);
	menu.setHide('remove', false);
	menu.setHide('rename', true);
	menu.setHide('share', true);
	menu.setHide('open', false);
	return true;
};

ForumItem.prototype.remove = function ForumItemRemove() {
	const menuActions = new TreeMenuActions(aras);
	menuActions.remove(this.itemTypeName, this.rowId);
	initializeTree();
	selectStartPage();
};

ForumItem.prototype.open = function ForumItemOpen() {
	const forumItem = this.getForumItem(this.itemTypeName, this.rowId);
	if (forumItem.isError()) {
		return;
	}
	const item = this.getItemByConfigId(
		forumItem.getProperty('item_type'),
		forumItem.getProperty('item_config_id')
	);
	if (item.isError()) {
		return;
	}
	const menuActions = new TreeMenuActions(aras);
	menuActions.open(item.getType(), item.getID());
};

ForumItem.prototype.getForumItem = function ForumItemGetForumItem(
	type,
	id,
	select
) {
	const item = aras.newIOMItem(type, 'get');
	item.setID(id);
	if (select && select !== '') {
		item.setAttribute('select', select);
	}
	return item.apply();
};

ForumItem.prototype.getItemByConfigId = function ForumItemGetItemByConfigId(
	type,
	configId
) {
	let item = aras.newIOMItem(type, 'get');
	item.setProperty('config_id', configId);
	item.setProperty('is_current', '1');
	item = item.apply();
	if (item.isError() || item.getAttribute('discover_only') == '1') {
		item = this.getLatestNotCurrent(type, configId);
	}
	return item;
};

ForumItem.prototype.getLatestNotCurrent = function ForumItemGetLatestNotCurrent(
	type,
	configId
) {
	let items = aras.newIOMItem(type, 'get');
	items.setAttribute('orderBy', 'generation');
	items.setProperty('config_id', configId);
	items.setProperty('generation', '0');
	items.setPropertyCondition('generation', 'ge');
	items = items.apply();
	if (items.isError()) {
		return items;
	} else {
		let item = null;
		for (let i = 0; i < items.getItemCount(); i++) {
			item = items.getItemByIndex(i);
			if (item.getAttribute('discover_only') !== '1') {
				break;
			}
		}
		return item;
	}
};

ForumItem.prototype.onClick = function ForumItemOnClick() {
	const forumItem = this.getForumItem(this.itemTypeName, this.rowId);
	if (forumItem.isError()) {
		aras.AlertError(forumItem.getErrorString());
		return;
	}
	const itemType = forumItem.getProperty('item_type');
	const itemConfigId = forumItem.getProperty('item_config_id');
	const item = this.getItemByConfigId(itemType, itemConfigId);
	if (item.isError()) {
		aras.AlertError(item.getErrorString());
		return;
	}
	const args = {
		itemID: item.getID(),
		itemTypeName: item.getType(),
		item: item
	};
	eventManager.fireEvent('onTreeItemSelect', args);
};
///ForumItem

///ForumSearch
function ForumSearch(rowId) {
	this.itemTypeName = 'ForumSearch';
	this.rowId = rowId;
}

ForumSearch.prototype = new ForumItem();

ForumSearch.prototype.onContextMenuCreate = function ForumSearchOnContextMenuCreate() {
	const menu = treeControl.contextMenu;
	menu.setHide('setAsDefault', true);
	menu.setHide('remove', false);
	menu.setHide('share', true);
	menu.setHide('open', true);
	return true;
};

ForumSearch.prototype.setAsDefault = function ForumSearchSetAsDefault() {
	return false;
};

ForumSearch.prototype.open = function ForumSearchOpen() {
	return false;
};

ForumSearch.prototype.onClick = function ForumSearchOnClick() {
	const item = aras.newIOMItem(this.itemTypeName, 'get');
	item.setID(this.rowId);
	const args = {
		itemID: this.rowId,
		itemTypeName: this.itemTypeName,
		item: item
	};
	eventManager.fireEvent('onTreeItemSelect', args);
};
///ForumSearch
