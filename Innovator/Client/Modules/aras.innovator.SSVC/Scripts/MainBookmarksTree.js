var treeControl;
var eventManager;
var myForumId;
var followedUsersIDs;
var followedForumsIDs;

window.onload = function onLoadHandler() {
	eventManager = ssvcEventsManager;

	document.getElementById('myBookmarksLabel').textContent = aras.getResource(
		'',
		'ssvc.my_bookmarks'
	);
	document
		.getElementById('searchBox')
		.setAttribute(
			'placeholder',
			aras.getResource('', 'ssvc.forum.searchBookmarks')
		);
	setupTree();

	const startBookmarkId = window.QueryString('startBookmarkId').toString();
	selectStartPage(startBookmarkId);

	treeControl._tree.containerNode.addEventListener('click', function (e) {
		if (
			e &&
			e.target &&
			!e.target.matches('.treeButton.treeButton-followPeople')
		) {
			SelectUserObj.hide();
		}
		if (
			e &&
			e.target &&
			!e.target.matches('.treeButton.treeButton-followForum')
		) {
			SelectForumObj.hide();
		}
	});

	// Overriding tree dndController onClickPress method which prevent mouse left button actions
	// Overriding of this method allow to do something before tree process event
	const nativeOnClickPress = treeControl._tree.dndController.onClickPress.bind(
		treeControl._tree.dndController
	);
	treeControl._tree.dndController.onClickPress = function (e) {
		if (
			e.target.closest('.ssvc-forumName-textbox') ||
			e.target.closest('.TocCategory')
		) {
			e.stopPropagation();
		} else {
			nativeOnClickPress(e);
		}
	};

	// Removing tree dndController event handler which prevent text selection
	treeControl._tree.dndController.events[4][1].remove();
	require(['dojo/on'], function (on) {
		on(treeControl._tree.domNode, 'dragstart, selectstart', function (e) {
			if (e.target && e.target.closest) {
				if (e.target.closest('.ssvc-forumName-textbox')) {
					e.stopPropagation();
					return;
				}
			}
			e.preventDefault();
		});
	});
	function setupTree() {
		createTreeControl(loadTreeData);
		setupTreeTooltip();

		require(['dojo/on'], function (on) {
			on(
				document.getElementById('refreshTree'),
				'click',
				initializeTree.bind(this, null)
			);
		});
		const callback = initializeTree.bind(this, null);
		aras.getMainWindow().addEventListener('bookmarksDataChanged', callback);
		window.addEventListener('unload', function () {
			aras
				.getMainWindow()
				.removeEventListener('bookmarksDataChanged', callback);
		});

		function setupTreeTooltip() {
			require([
				'dijit/Tooltip',
				'dijit/registry',
				'dojo/query!css2',
				'dojo/domReady!'
			], function (Tooltip, registry) {
				new Tooltip({
					connectId: 'treeContainer',
					selector: '.dijitTreeNode .dijitTreeRow .dijitTreeContent .dijitIcon',
					position: ['before', 'below'],
					getContent: function (matchNode) {
						const treeNode = getTreeNodeParent(matchNode);
						if (!treeNode) {
							return;
						}
						const node = registry.byNode(treeNode);

						if (node && node.item) {
							const item = node.item;
							const className = item.userdata.className;
							if (className !== 'Forum') {
								return;
							}
							const treeItem = createInstance(className, item.id);
							if (treeItem) {
								const owner = treeItem.onMouseOver(
									item.userdata['owned_by_id']
								);
								if (owner && !owner.isError()) {
									let name = owner.getProperty('keyed_name');
									if (name === owner.getID()) {
										name = owner.getProperty('login_name');
									}
									return aras.getResource(
										'',
										'ssvc.my_bookmarks.tooltip.owned_by',
										name
									);
								}
							}
						}

						function getTreeNodeParent(node) {
							let current = node;
							while (doMoveOn(current)) {
								current = current.parentNode;
							}
							if (!current || current === document) {
								return false;
							}
							return current;

							function doMoveOn(node) {
								if (!node || node === document) {
									return false;
								}
								if (!node.className) {
									return true;
								} else if (node.className.indexOf('dijitTreeNode') === -1) {
									return true;
								} else {
									return false;
								}
							}
						}
					}
				});
			});
		}

		function setupContextMenu(/*control*/ tree) {
			const menuItems = [
				{
					id: 'setAsDefault',
					name: window.aras.getResource(
						'',
						'ssvc.my_bookmarks.context_menu.set_as_default'
					)
				},
				{ id: 'rename', name: 'Rename' },
				{
					id: 'remove',
					name: window.aras.getResource(
						'',
						'ssvc.my_bookmarks.context_menu.remove'
					)
				},
				{
					id: 'share',
					name: window.aras.getResource(
						'',
						'ssvc.my_bookmarks.context_menu.share'
					)
				},
				{
					id: 'open',
					name: window.aras.getResource(
						'',
						'ssvc.my_bookmarks.context_menu.open'
					)
				}
			];
			tree.contextMenu.addRange(menuItems);
		}

		function loadTreeData(tree) {
			initializeTree(tree);
			setupContextMenu(tree);
		}

		function createTreeControl(callback) {
			require(['Aras/Client/Controls/Experimental/Tree']);
			clientControlsFactory.createControl(
				'Aras.Client.Controls.Experimental.Tree',
				{
					id: 'bookmarkTree',
					IconPath: '../cbin/',
					allowEmptyIcon: true
				},
				function (control) {
					const treeApplet = control;
					const container = document.getElementById('treeContainer');
					container.appendChild(treeApplet._tree.domNode);

					clientControlsFactory.on(treeApplet, {
						menuInit: onMenuInit,
						menuClick: onMenuClick,
						itemSelect: onItemSelect
					});
					treeApplet._tree.getRowClass = function (item) {
						if (item.userdata && item.userdata.className === 'ForumSearch') {
							return 'TreeSearch';
						}
						if (item.userdata && item.userdata.className) {
							return item.userdata.className;
						}
					};
					if (callback) {
						treeControl = treeApplet;
						callback(treeApplet);
					}
				}
			);
		}
	}
};

function initializeTree(/*control*/ tree) {
	if (!tree) {
		tree = treeControl;
	}
	const forums = setupUserForums();
	if (!forums) {
		return;
	}

	followedForumsIDs = {};
	const forumsIDs = forums.dom.selectNodes(
		'//Item[@type="Forum"][forum_type!="MyBookmarks"]/id'
	);
	for (let k = 0; k < forumsIDs.length; k++) {
		followedForumsIDs[forumsIDs[k].text] = true;
	}

	const userIDs = forums.dom.selectNodes(
		'//Relationships/Item[@type="ForumMessageGroup"][group_type="UserMessages"]/user_criteria_id'
	);
	followedUsersIDs = {};
	for (let i = 0; i < userIDs.length; i++) {
		followedUsersIDs[userIDs[i].text] = true;
	}

	const xsl = aras.createXMLDocument();
	const xmlhttp = aras.XmlHttpRequestManager.CreateRequest();
	xmlhttp.open(
		'GET',
		window.aras.getScriptsURL() +
			'../Modules/aras.innovator.SSVC/styles/bookmarksTree.xslt',
		false
	);
	xmlhttp.send(null);
	xsl.loadXML(xmlhttp.responseText);
	const currentUserIdNode = xsl.selectSingleNode(
		'//*/*[local-name()="param"][@name="CurrentUserId"]'
	);
	if (currentUserIdNode) {
		currentUserIdNode.text =
			aras.getIsAliasIdentityIDForLoggedUser() || aras.getUserID();
	}
	const treeXml = forums.dom.transformNode(xsl);
	tree.initXML(treeXml);

	function setupUserForums() {
		let forums = getForumsForUser();
		if (forums.isError()) {
			if (forums.getErrorCode() === '0') {
				if (createDefaultFroumsForUser()) {
					forums = setupUserForums();
				} else {
					return false;
				}
			} else {
				aras.AlertError(forums.getErrorString());
				return false;
			}
		} else {
			const myBookmarkForum = forums.getItemsByXPath(
				"//Item[@type='Forum'][forum_type='MyBookmarks']"
			);
			if (myBookmarkForum.getItemCount() > 0) {
				myForumId = myBookmarkForum.getID();

				// it's a temporary fix for those customers that have upgraded to SP7 (or higher version) from previous versions of Innovator (< SP7)
				// a problem is that the customers would not receive private messages for already existed users
				// so if such users exists create UserPrivateMessages Group for them
				// todo in s12: this 'if' section should be removed
				const privateForumMessageGroup = myBookmarkForum.getItemsByXPath(
					'Relationships/Item[group_type="UserPrivateMessages"]'
				);
				if (privateForumMessageGroup.getItemCount() < 1) {
					const aliasIdentity = myBookmarkForum.getProperty('owned_by_id');
					const isSucceeded = createPrivateForumMessageGroupForForum(
						myForumId,
						aliasIdentity
					);
					if (isSucceeded) {
						forums = setupUserForums();
						return forums;
					}
				}

				myBookmarkForum.setAttribute('currentUser', aras.getUserID());
			} else {
				if (createDefaultFroumsForUser()) {
					forums = setupUserForums();
				}
			}

			const forumItems = forums.getItemsByXPath(
				"//Item[@type='Forum']/Relationships/Item[@type='ForumItem']"
			);
			let itemsCount = forumItems.getItemCount();
			let itm;
			for (var i = 0; i < itemsCount; i++) {
				itm = forumItems.getItemByIndex(i);
				itm.setPropertyAttribute(
					'item_type',
					'icon',
					'../../' +
						(aras
							.getItemTypeDictionary(itm.getProperty('item_type'))
							.getProperty('open_icon', '') || '../Images/DefaultItemType.svg')
				);
			}

			const forumSearch = forums.getItemsByXPath(
				"//Item[@type='Forum']/Relationships/Item[@type='ForumSearch']/related_id/Item"
			);
			itemsCount = forumSearch.getItemCount();
			for (i = 0; i < itemsCount; i++) {
				itm = forumSearch.getItemByIndex(i);
				itm.setPropertyAttribute(
					'itname',
					'icon',
					'../../' +
						(aras
							.getItemTypeDictionary(itm.getProperty('itname'))
							.getProperty('open_icon', '') || '../Images/DefaultItemType.svg')
				);
			}
		}
		return forums;
	}
}

function selectStartPage(startBookmarkId) {
	if (!startBookmarkId) {
		startBookmarkId = aras.getPreferenceItemProperty(
			'SSVC_Preferences',
			null,
			'default_bookmark',
			'allmessages'
		);
	}

	if (treeControl.isItemExists(startBookmarkId)) {
		selectBookmark(startBookmarkId);
	} else {
		const allTreeItems = treeControl.GetAllItems();
		if (allTreeItems.length > 0) {
			selectBookmark(allTreeItems[1].id);
		}
	}
}

function selectBookmark(/*string*/ id, withFilters) {
	if (treeControl.isItemExists(id)) {
		treeControl.openItem(treeControl.getParentId(id));
		treeControl.selectItem(id);
		onItemSelect(id, withFilters);
	} else {
		selectStartPage();
	}
}

function onMenuInit(selectedId) {
	const className = treeControl.GetUserData(selectedId, 'className');
	const treeItem = createInstance(className, selectedId);
	if (treeItem) {
		return treeItem.onContextMenuCreate();
	}
}

function onMenuClick(commandId, selectedId) {
	const className = treeControl.GetUserData(selectedId, 'className');
	const treeItem = createInstance(className, selectedId);
	if (treeItem) {
		treeItem[commandId]();
	}
}

function onItemSelect(/*string*/ selectedId, withFilters) {
	const className = treeControl.GetUserData(selectedId, 'className');
	if (className === 'TocCategory') {
		return;
	}

	const topWnd = aras.getMostTopWindowWithAras();
	if (className && className !== 'TocCategory') {
		aras.browserHelper.toggleSpinner(topWnd.document, true);
	}

	const treeItem = createInstance(className, selectedId);
	if (treeItem) {
		treeItem.onClick(withFilters);
	}
	aras.browserHelper.toggleSpinner(topWnd.document, false);
}

function createInstance(className, rowId) {
	if (className) {
		return new window[className](rowId);
	}
}

function searchAndOperate(element, regEx) {
	if (element.label.search(regEx) >= 0) {
		treeControl.ShowRow(element.id);
		return true;
	} else {
		treeControl.HideRow(element.id);
		return false;
	}
}

function operateChildren(regEx, children) {
	let isThereVisibleChildren = false;

	for (let i = 0, length = children.length; i < length; i++) {
		isThereVisibleChildren =
			searchAndOperate(children[i], regEx) || isThereVisibleChildren;
	}

	return isThereVisibleChildren;
}

function runBookmarksSearch() {
	const searchText = document.getElementById('searchBox').value;
	const regEx = new RegExp('.*' + searchText + '.*', 'i');
	const root = treeControl.GetAllItems()[0];
	const firstLevelRows = root.children;

	if (!searchText) {
		clearBookmarksSearch();
		return;
	}

	treeControl.ExpandAll();
	for (let i = 0, length = firstLevelRows.length; i < length; i++) {
		if (firstLevelRows[i].children.length === 0) {
			searchAndOperate(firstLevelRows[i], regEx);
		} else if (operateChildren(regEx, firstLevelRows[i].children)) {
			treeControl.ShowRow(firstLevelRows[i].id);
		} else {
			treeControl.HideRow(firstLevelRows[i].id);
		}
	}
}

function clearBookmarksSearch() {
	const items = treeControl.GetAllItems();

	for (let i = 0, length = items.length; i < length; i++) {
		treeControl.ShowRow(items[i].id);
	}
	treeControl.CollapseAll();
}

function handleSearchKey(event) {
	if (event.which == 13 || event.keyCode == 13) {
		//handle enter key
		runBookmarksSearch();
	}
}
