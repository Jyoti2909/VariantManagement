function onAddForumClick() {
	const dHeight = aras.Browser.isIe() ? 190 : 180;

	const createForumDialog = window.parent.ArasModules.Dialog.show('iframe', {
		title: aras.getResource('', 'ssvc.forum.dialog.create_new_forum'),
		aras: aras,
		dialogWidth: 300,
		dialogHeight: dHeight,
		resizable: false,
		content: '../Modules/aras.innovator.SSVC/Views/CreateForum.html'
	});
	createForumDialog.promise.then(function (data) {
		initializeTree();
	});
}

function createDefaultFroumsForUser() {
	const createForums = aras.newIOMItem('User', 'VC_CreateDefaultForums');
	createForums.setID(aras.getUserID());
	const createResult = createForums.apply();
	if (createResult.isError()) {
		aras.AlertError(createResult.getErrorString(), null, null, window);
		return false;
	}
	return true;
}

// todo in s12: remove the method
function createPrivateForumMessageGroupForForum(forumId, aliasIdentity) {
	const userId = aras.getUserID();
	const createPrivateForumMessageGroup = aras.newIOMItem(
		'Method',
		'VC_CreateUserMessageGroup'
	);
	createPrivateForumMessageGroup.setProperty(
		'group_type',
		'UserPrivateMessages'
	);
	createPrivateForumMessageGroup.setProperty('user_id', userId);
	createPrivateForumMessageGroup.setProperty('source_id', forumId);
	createPrivateForumMessageGroup.setProperty('alias_identity', aliasIdentity);
	const result = createPrivateForumMessageGroup.apply();
	if (result.isError()) {
		aras.AlertError(result.getErrorString(), null, null, window);
		return false;
	}
	return true;
}

function getForumsForUser() {
	return aras.newIOMItem('User', 'VC_GetForumsForUser').apply();
}

function showPopup(e, popup) {
	let element = e.target;
	let y = 0;
	let x = 0;
	while (element.offsetParent) {
		y += element.offsetTop;
		x += element.offsetLeft;
		element = element.offsetParent;
	}
	y += e.target.offsetHeight + 1;
	const parentWithScroll = e.target.closest('.dijitTreeContainer');
	if (parentWithScroll) {
		y -= parentWithScroll.scrollTop;
	}
	x += e.target.offsetWidth;
	x = document.body.offsetWidth - x;
	popup.show(x, y, true);
}

function onCreateForumClick() {
	forumsHelper.addForumEditableRow().then(function (args) {
		let request;
		if (args.action === 'new') {
			request = {
				Item: {
					owned_by_id: aras.getIsAliasIdentityIDForLoggedUser(),
					name: args.newForumLabel,
					label: args.newForumLabel,
					forum_type: 'Regular',
					description: '',
					Relationships: {
						Item: [
							{
								shared_with_id: aras.getIsAliasIdentityIDForLoggedUser(),
								'@attrs': {
									isNew: '1',
									isTemp: '1',
									type: 'ForumSharedWith',
									action: 'add',
									id: aras.generateNewGUID()
								}
							},
							{
								want_view_id: aras.getIsAliasIdentityIDForLoggedUser(),
								'@attrs': {
									isNew: '1',
									isTemp: '1',
									type: 'ForumWantViewBy',
									action: 'add',
									id: aras.generateNewGUID()
								}
							}
						]
					},
					'@attrs': {
						isNew: '1',
						isTemp: '1',
						type: 'Forum',
						action: 'add',
						id: args.rowID
					}
				}
			};
		}
		return ArasModules.soap(ArasModules.jsonToXml(request), { async: true })
			.then(function () {
				initializeTree();
			})
			.catch(function (xhr) {
				const faultCode = xhr.responseXML.selectSingleNode('//*/faultcode');
				if (
					faultCode &&
					faultCode.textContent.indexOf('PropertiesAreNotUniqueException') != -1
				) {
					aras.AlertError(
						'Forum with name "' + args.newForumLabel + '" already exists'
					);
					initializeTree();
				}
			});
	});
}

var forumsHelper = {
	createNewForumRow: function () {
		return treeControl._model._addItem(
			aras.generateNewGUID(),
			'New forum',
			'../cbin/../../../images/Forum.svg',
			'../cbin/../../../images/Forum.svg',
			{
				className: 'Forum',
				owned_by_id: aras.getUserID()
			},
			[],
			false
		);
	},
	insertForumRowToList: function (forumRow) {
		const forumsTOCNode = treeControl._model.fetchItemByIdentity(
			'forumscategory'
		);
		forumsTOCNode.children.unshift(forumRow);
		treeControl._model.onChildrenChange(forumsTOCNode, forumsTOCNode.children);
	},
	expandForumsTocCategory: function () {
		const forumTOCNode = this.getForumTOCNode();
		if (forumTOCNode) {
			return treeControl._tree._expandNode(forumTOCNode);
		} else {
			return Promise.reject();
		}
	},
	getForumTOCNode: function () {
		return treeControl._tree.getNodesByItem('forumscategory')[0];
	},
	makeForumRowUnEditable: function (rowID) {
		const forumRow = treeControl._tree.getNodesByItem(rowID)[0];
		if (forumRow) {
			const forumLabel = forumRow.domNode.querySelector('.dijitTreeLabel');
			const forumTextBox = forumRow.domNode.querySelector(
				'.ssvc-forumName-textbox'
			);

			if (forumLabel && forumTextBox) {
				forumTextBox.parentNode.removeChild(forumTextBox);
				forumLabel.style.display = '';
			}
		}
	},
	makeForumRowEditable: function (rowID, action) {
		action = action || 'new';
		const self = this;
		const forumRow = treeControl._tree.getNodesByItem(rowID)[0];
		return new Promise(function (resolve, reject) {
			if (forumRow) {
				const forumLabel = forumRow.domNode.querySelector('.dijitTreeLabel');
				const forumLabelValue = forumLabel.textContent;

				const textEdit = document.createElement('input');
				textEdit.type = 'text';
				textEdit.className = 'ssvc-forumName-textbox';
				textEdit.value = forumLabelValue;

				textEdit.onclick = function (e) {
					e.stopPropagation();
					e.cancelBubble = true;
				};

				forumLabel.style.display = 'none';

				forumLabel.parentNode.appendChild(textEdit);

				// handler for Enter and Escape buttons
				textEdit.addEventListener('keydown', function (e) {
					if (e.keyCode === 13 && e.target.value !== '') {
						textEdit.onblur = null;
						processForumItem();
					}
					if (e.keyCode === 27) {
						e.target.blur();
					}
					e.stopPropagation();
					e.cancelBubble = true;
				});
				// handler for allow input text into text field
				textEdit.addEventListener('keypress', function (e) {
					e.stopPropagation();
					e.cancelBubble = true;
				});
				// handler cancel forum editing
				textEdit.onblur = function (e) {
					if (action === 'new') {
						processForumItem();
					} else {
						self.makeForumRowUnEditable(rowID);
					}
				};

				var processForumItem = function () {
					let newForumLabel = textEdit.value;
					self.makeForumRowUnEditable(rowID);
					if (
						action === 'new' ||
						(action === 'edit' && forumLabelValue !== newForumLabel)
					) {
						if (newForumLabel === '') {
							newForumLabel = forumLabelValue;
						}
						resolve({
							rowID: rowID,
							action: action,
							newForumLabel: newForumLabel
						});
					}
				};
				// timeout to make text selection and call focus after element inserting
				setTimeout(function () {
					textEdit.focus();
					textEdit.select();
				}, 0);
			} else {
				reject();
			}
		});
	},
	addForumEditableRow: function () {
		const self = this;
		return new Promise(function (resolve, reject) {
			self
				.expandForumsTocCategory()
				.then(function () {
					const forumRow = self.createNewForumRow();
					self.insertForumRowToList(forumRow);
					return self.makeForumRowEditable(forumRow.id);
				})
				.then(function (args) {
					resolve(args);
				});
		});
	},
	renameForum: function (rowID) {
		const lockUnLockRequest = {
			Item: {
				'@attrs': {
					type: 'Forum',
					id: rowID,
					action: 'lock'
				}
			}
		};
		this.makeForumRowEditable(rowID, 'edit').then(function (renameArgs) {
			return ArasModules.soap(ArasModules.jsonToXml(lockUnLockRequest), {
				async: true
			})
				.then(function () {
					const request = {
						Item: {
							label: {
								'@attrs': {
									'xml:lang': 'en'
								},
								'@value': renameArgs.newForumLabel
							},
							name: renameArgs.newForumLabel,
							'@attrs': {
								type: 'Forum',
								id: renameArgs.rowID,
								action: 'update'
							}
						}
					};
					return ArasModules.soap(ArasModules.jsonToXml(request), {
						async: true
					});
				})
				.then(function () {
					lockUnLockRequest.Item['@attrs'].action = 'unlock';
					return ArasModules.soap(ArasModules.jsonToXml(lockUnLockRequest), {
						async: true
					});
				})
				.then(function () {
					initializeTree();
				})
				.catch(function (xhr) {
					const faultcode = xhr.responseXML.selectSingleNode(
						aras.XPathFault('/faultcode')
					);
					if (
						faultcode &&
						faultcode.text.indexOf('PropertiesAreNotUniqueException') != -1
					) {
						aras.AlertError(
							'Forum with name "' +
								renameArgs.newForumLabel +
								'" already exists'
						);
						initializeTree();
					}
					lockUnLockRequest.Item['@attrs'].action = 'unlock';
					return ArasModules.soap(ArasModules.jsonToXml(lockUnLockRequest), {
						async: true
					});
				});
		});
	}
};
