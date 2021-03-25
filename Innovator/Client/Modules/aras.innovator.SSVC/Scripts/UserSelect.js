define([
	'dojo/_base/declare',
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojox/dtl',
	'dojox/dtl/Context',
	'dojo/text!SSVC/Views/UserSelect.html',
	'SSVC/Scripts/Utils'
], function (
	declare,
	on,
	_WidgetBase,
	_TemplatedMixin,
	dtl,
	Context,
	template,
	ssvcUtils
) {
	let inputTimeoutID = null;
	let inputPromise = null;
	let abortRequests = null;
	let lastNameValue = '';

	var eventHandlersHelper = {
		normalizePopupPosition: function (popup) {
			const treeScrolableElement = document.querySelector(
				'#bookmarkTree .dijitTreeContainer'
			);
			if (
				popup.domNode.offsetTop + popup.domNode.offsetHeight >=
				popup.domNode.parentElement.offsetHeight
			) {
				popup.domNode.style.top = '';
				popup.domNode.style.bottom = '0';
			} else {
				popup.domNode.style.bottom = '';
			}
		},

		usersListMouseOver: function (e) {
			const targetUserBlock = e.target.closest('.popupSelect-listItem');
			const relatedTargetUserBlock = e.relatedTarget
				? e.relatedTarget.closest('.popupSelect-listItem')
				: null;
			if (targetUserBlock === relatedTargetUserBlock) {
				return;
			}

			if (!targetUserBlock) {
				this.selectItem();
				return;
			}

			this.selectItem(+targetUserBlock.getAttribute('data-list-index'));
			targetUserBlock.classList.toggle('popupSelect-listItem-selected', true);
		},

		popupKeyUp: function (e) {
			let newIndex;
			switch (e.keyCode) {
				case 38:
					// UP Arrow key was pressed
					this.selectItem(this.getNextListItemIndex(true), true);
					break;
				case 40:
					// DOWN Arrow key was pressed
					this.selectItem(this.getNextListItemIndex(), true);
					break;
				case 13:
					// Enter key was pressed
					if (this.currentItemIndex > -1) {
						this.processItem(this.currentItemIndex);
					}
					break;
				case 27:
					// Escape key was pressed
					this.hide();
					break;
			}
			e.preventDefault();
			e.stopPropagation();
		},

		nameFieldKeyDown: function (e) {
			// prevents default keydown actions on input for UP/DOWN arrows to
			// fix text cursor during list navigation
			if (e.keyCode === 38 || e.keyCode === 40) {
				e.preventDefault();
			}
		},

		popupMouseClick: function (e) {
			if (e.target.closest('.popupSelect-listItem')) {
				this.processItem(this.currentItemIndex);
			}
			this.nameField.focus();
		},

		inputTimeoutHandler: function () {
			if (!this.nameField.value) {
				return;
			}

			if (abortRequests) {
				abortRequests();
			}

			const usersRequestPromise = this.sendRequest();

			inputPromise = new Promise(function (resolve, reject) {
				abortRequests = function () {
					resolve();
					abortRequests = null;
				};
			});

			inputPromise.then(function () {
				usersRequestPromise.abort();
			});
			const self = this;
			Promise.race([inputPromise, usersRequestPromise])
				.then(function (data) {
					if (data) {
						self.handleReceivedItemsData(data.selectNodes('Item'));
					}
				})
				.catch(function () {
					self.clearUsersList();
				});
		},

		nameFieldKeyup: function (e) {
			if (this.nameField.value === lastNameValue) {
				return;
			}
			lastNameValue = this.nameField.value;
			if (abortRequests) {
				abortRequests();
			}

			if (this.nameField.value) {
				clearTimeout(inputTimeoutID);
				inputTimeoutID = setTimeout(
					eventHandlersHelper.inputTimeoutHandler.bind(this),
					500
				);
			} else {
				this.clearUsersList();
			}
		},

		getImagesUrls: function (fileIDs) {
			const getTokens = function (fileIDs) {
				let xmlhttp;
				const promise = new Promise(function (resolve, reject) {
					let body = '{"parameters":[';
					for (let i = 0; i < fileIDs.length; i++) {
						body +=
							'{"__type":"FileDownloadParameters","fileId":"' +
							fileIDs[i] +
							'", "dbName": "' +
							aras.getDatabase() +
							'"},';
					}
					body = body.slice(0, body.length - 1) + ']}';
					const innovatorUrl = aras.getServerBaseURL();
					let url =
						innovatorUrl + 'AuthenticationBroker.asmx/GetFilesDownloadTokens';
					xmlhttp = new XMLHttpRequest();
					url = url + '?rnd=' + Math.random(); // to be ensure non-cached version
					xmlhttp.open('POST', url, true);
					const headers = aras.getHttpHeadersForSoapMessage(
						'GetFilesDownloadTokens'
					);
					for (let hName in headers) {
						xmlhttp.setRequestHeader(hName, headers[hName]);
					}
					xmlhttp.setRequestHeader('content-type', 'application/json');

					xmlhttp.withCredentials = true;

					xmlhttp.onload = function () {
						if (xmlhttp.status === 200) {
							const res = JSON.parse(xmlhttp.responseText);
							if (res && res.d) {
								resolve(res.d);
							} else {
								reject();
							}
						}
					};
					xmlhttp.onerror = function () {
						reject();
					};

					xmlhttp.send(body);
				});

				promise.abort = function () {
					xmlhttp.abort();
				};

				return promise;
			};
			const getFileUrls = function (fileIDs) {
				const requestTemplate = {
					Item: {
						Relationships: {
							Item: {
								related_id: {
									Item: {
										'@attrs': {
											type: 'Vault',
											select: 'id,vault_url',
											action: 'get'
										}
									}
								},
								'@attrs': {
									type: 'Located',
									select: 'id,related_id,file_version',
									action: 'get'
								}
							}
						},
						id: {
							'@attrs': {
								condition: 'in'
							},
							'@value': fileIDs.toString()
						},
						'@attrs': {
							type: 'File',
							action: 'get',
							select: 'id,filename'
						}
					}
				};
				const promise = ArasModules.soap(
					ArasModules.jsonToXml(requestTemplate),
					{ async: true }
				);
				const result = promise.then(function (result) {
					const files = result.selectNodes('Item');
					const resultArray = [];
					for (let i = 0; i < files.length; i++) {
						const file = files[i];
						const related = file.selectSingleNode(
							'Relationships/Item[@type="Item"]'
						);
						const vault = file.selectSingleNode(
							'Relationships/Item/related_id/Item[@type="Vault"]'
						);
						let url = aras.getItemProperty(vault, 'vault_url');
						url += '?dbName=' + aras.getDatabase();
						const fileId = aras.getItemProperty(file, 'id');
						url += '&fileId=' + fileId;
						url += '&fileName=' + aras.getItemProperty(file, 'filename');
						url += '&vaultId=' + aras.getItemProperty(vault, 'id');
						resultArray[fileIDs.indexOf(fileId)] = url;
					}
					return resultArray;
				});

				result.abort = promise.abort;

				return result;
			};

			const getFileUrlsPromise = getFileUrls(fileIDs);
			const getTokensPromise = getTokens(fileIDs);

			inputPromise.then(function () {
				getFileUrlsPromise.abort();
				getTokensPromise.abort();
			});

			const requestsPromise = Promise.all([
				getFileUrlsPromise,
				getTokensPromise
			]).then(function (result) {
				if (result[0].length != result[1].length) {
					return Promise.reject();
				}
				const urlsArray = [];
				for (let i = 0; i < result[0].length; i++) {
					urlsArray[i] = result[0][i] + '&token=' + result[1][i];
				}
				return urlsArray;
			});
			return Promise.race([inputPromise, requestsPromise]);
		},

		refreshItemsImages: function (popup) {
			const imgIds = Object.keys(popup.needRefreshIds);
			if (imgIds.length === 0) {
				return;
			}
			this.getImagesUrls(imgIds).then(function (res) {
				if (res) {
					for (let i = 0; i < res.length; i++) {
						const imgId = imgIds[i];
						for (let j = 0; j < popup.needRefreshIds[imgId].length; j++) {
							popup.itemsList.childNodes[
								popup.needRefreshIds[imgId][j]
							].querySelector('.followUsers-avatar').src = res[i];
						}
					}
				}
			});
		}
	};

	return declare('SSVC.UI.UserSelect', [_WidgetBase, _TemplatedMixin], {
		templateString: template,
		currentItemIndex: -1,
		popupTitle: ssvcUtils.GetResource('follow_people_title'),
		defaultAvatarPath: '../../../images/DefaultAvatar.svg',
		followIconPath: '../../../images/Following.svg',
		constructor: function () {
			const listNodeHtmlTemplate =
				'	<img src="{{avatarSrc}}" class="followUsers-avatar"/>' +
				'	<div class="followUsers-userInfoCell">' +
				'			<span class="followUsers-userName">{{userName}}</span>' +
				'			<span class="followUsers-userLogin">{{userLogin}}</span>' +
				'			<span class="followUsers-companyName">{{companyName}}</span>' +
				'	</div>';

			this.listNodeTemplate = new dtl.Template(listNodeHtmlTemplate);
		},

		postCreate: function () {
			this.setHandlers();
		},

		setHandlers: function () {
			const self = this;

			this.nameField.addEventListener(
				'keyup',
				eventHandlersHelper.nameFieldKeyup.bind(this)
			);

			this.nameField.addEventListener(
				'keydown',
				eventHandlersHelper.nameFieldKeyDown
			);

			this.domNode.addEventListener(
				'click',
				eventHandlersHelper.popupMouseClick.bind(this)
			);

			this.domNode.addEventListener(
				'keyup',
				eventHandlersHelper.popupKeyUp.bind(this)
			);

			this.itemsList.addEventListener('mouseleave', function (e) {
				self.selectItem();
			});

			this.itemsList.addEventListener(
				'mouseover',
				eventHandlersHelper.usersListMouseOver.bind(this)
			);
		},

		sendRequest: function () {
			const requestData = {
				Item: {
					id: {
						'@attrs': {
							condition: 'not like'
						},
						'@value': aras.getUserID()
					},
					or: {
						and: {
							keyed_name: {
								'@attrs': {
									condition: 'like'
								},
								'@value': '%' + this.nameField.value + '%'
							},
							and: {
								first_name: {
									'@attrs': {
										condition: 'is not null'
									}
								},
								last_name: {
									'@attrs': {
										condition: 'is not null'
									}
								}
							}
						},
						login_name: {
							'@attrs': {
								condition: 'like'
							},
							'@value': '%' + this.nameField.value + '%'
						}
					},
					'@attrs': {
						type: 'User',
						action: 'get',
						select: 'keyed_name, login_name, company_name, picture, id',
						maxRecords: '15'
					}
				}
			};
			return ArasModules.soap(ArasModules.jsonToXml(requestData), {
				async: true
			});
		},

		handleReceivedItemsData: function (items) {
			const self = this;
			this.showUsersList();
			this.clearUsersList();
			const docFragment = document.createDocumentFragment();
			this.needRefreshIds = {};
			this.currentItemIndex = -1;
			for (let i = 0; i < items.length; i++) {
				const itemListNode = this.addItemToList(items[i]);
				docFragment.appendChild(itemListNode);
				const id = aras.getItemProperty(items[i], 'id');
				if (this.checkFollowState(id)) {
					itemListNode.classList.toggle('followed', true);
					const followImg = document.createElement('img');
					followImg.src = this.followIconPath;
					followImg.className = 'followUsers-follow-icon';
					itemListNode.appendChild(followImg);
				}
				itemListNode.setAttribute('data-list-index', i);
				itemListNode.setAttribute(
					'data-id',
					aras.getItemProperty(items[i], 'id')
				);

				const picture = aras.getItemProperty(items[i], 'picture');
				if (picture) {
					const picId = picture.replace('vault:///?fileId=', '');
					this.needRefreshIds[picId] = this.needRefreshIds[picId] || [];
					this.needRefreshIds[picId].push(i);
				}
			}

			this.itemsList.appendChild(docFragment);
			this.postListFill();
			this.checkScrollExisting();
		},

		addItemToList: function (userdata) {
			const userData = {
				avatarSrc: this.defaultAvatarPath,
				userName: aras.getItemProperty(userdata, 'keyed_name', ''),
				userLogin: aras.getItemProperty(userdata, 'login_name', ''),
				companyName: aras.getItemProperty(userdata, 'company_name', '')
			};

			if (userData.userName === aras.getItemProperty(userdata, 'id', '')) {
				userData.userName = aras.getItemProperty(userdata, 'login_name', '');
			}

			const userBlock = document.createElement('div');
			userBlock.className = 'popupSelect-listItem followUsers-listItem';

			if (!userData.companyName) {
				userBlock.className += ' followUsers-listItem-noCompany';
			}

			userBlock.innerHTML = this.listNodeTemplate.render(new Context(userData));
			return userBlock;
		},

		checkFollowState: function (id) {
			return followedUsersIDs[id] ? true : false;
		},

		postListFill: function () {
			Array.prototype.forEach.call(this.itemsList.childNodes, function (elt) {
				const loginWidth = elt.querySelector('.followUsers-userLogin')
					.offsetWidth;
				const userName = elt.querySelector('.followUsers-userName');

				// 1px for IE9 to prevent word wrapping
				userName.style.maxWidth = userName.offsetWidth + 1 + 'px';
				userName.style.width = 'calc(100% - ' + loginWidth + 'px - 4px)';
			});
			eventHandlersHelper.refreshItemsImages(this);
		},

		checkScrollExisting: function () {
			this.itemsList.classList.toggle(
				'popupSelect-itemsList-scrollable',
				this.itemsList.scrollHeight > this.itemsList.offsetHeight
			);
		},

		clearUsersList: function () {
			while (this.itemsList.firstChild) {
				this.itemsList.removeChild(this.itemsList.firstChild);
			}
			this.currentItemIndex = -1;
		},

		clearNameField: function () {
			this.nameField.value = '';
			lastNameValue = '';
		},

		checkListItemVisiblity: function (index) {
			const node = this.itemsList.childNodes[index];
			const parentNode = node.parentElement;

			// we need check that list element is within the visible list area
			if (node.offsetTop - parentNode.offsetTop < parentNode.scrollTop) {
				// list item is above the upper border of the list area
				// we need to scroll list up to the upper border of the list element
				parentNode.scrollTop = node.offsetTop - parentNode.offsetTop;
			} else if (
				node.offsetTop - parentNode.offsetTop + node.offsetHeight >
				parentNode.scrollTop + parentNode.clientHeight
			) {
				// list item is below the bottom border of the list area
				// we need to scroll list down to the lower border of the list element
				parentNode.scrollTop =
					node.offsetTop -
					parentNode.offsetTop +
					node.offsetHeight -
					parentNode.clientHeight;
			}
		},

		selectItem: function (index, scroll) {
			if (this.currentItemIndex !== -1) {
				this.itemsList.childNodes[this.currentItemIndex].classList.toggle(
					'popupSelect-listItem-selected',
					false
				);
			}

			if (index >= 0) {
				this.itemsList.childNodes[index].classList.toggle(
					'popupSelect-listItem-selected',
					true
				);
				if (scroll) {
					this.checkListItemVisiblity(index);
				}
				this.currentItemIndex = index;
			} else {
				this.currentItemIndex = -1;
			}
		},

		show: function (x, y, anchorToRight) {
			this.domNode.style.bottom = '';
			this.clearUsersList();
			this.hideUsersList();
			this.clearNameField();
			if (x && !anchorToRight) {
				this.domNode.style.left = x + 'px';
			} else if (x && anchorToRight) {
				this.domNode.style.right = x + 'px';
			}
			if (y) {
				this.domNode.style.top = y + 'px';
			}
			this.domNode.style.display = '';
			const self = this;

			// timeout to call focus after popup displayed
			setTimeout(function () {
				self.nameField.focus();
			}, 0);

			var documentClickHandler = function (e) {
				if (!e.target.closest('.popupSelect')) {
					self.hide();
					document.removeEventListener('click', documentClickHandler);
				}
			};

			document.addEventListener('click', documentClickHandler);
			eventHandlersHelper.normalizePopupPosition(this);
		},

		hide: function () {
			this.domNode.style.display = 'none';
		},

		showUsersList: function () {
			this.itemsList.style.display = '';
			eventHandlersHelper.normalizePopupPosition(this);
		},

		hideUsersList: function () {
			this.itemsList.style.display = 'none';
		},

		getNextListItemIndex: function (reverseDirection) {
			let index;
			let reverseBound;
			let forwardBound;
			let limitBound;
			let incrementValue;
			const listLength = this.itemsList.childNodes.length;
			if (listLength === 0) {
				return -1;
			}

			if (reverseDirection) {
				limitBound = -1;
				reverseBound = listLength - 1;
				forwardBound = 0;
				incrementValue = -1;
			} else {
				limitBound = listLength;
				reverseBound = 0;
				forwardBound = listLength - 1;
				incrementValue = 1;
			}

			if (
				reverseDirection
					? this.currentItemIndex > forwardBound
					: this.currentItemIndex < forwardBound
			) {
				index = this.currentItemIndex + incrementValue;
			} else {
				index = reverseBound;
			}

			while (index !== this.currentItemIndex) {
				if (!this.itemsList.childNodes[index].classList.contains('followed')) {
					return index;
				}
				index += incrementValue;
				if (index === limitBound && this.currentItemIndex !== -1) {
					index = reverseBound;
				} else if (index === limitBound && this.currentItemIndex === -1) {
					return -1;
				}
			}

			return index;
		},

		processItem: function (index) {
			const item = this.itemsList.childNodes[index];

			if (item.classList.contains('followed')) {
				// user already in follow list
				return;
			}
			let newGroup = aras.newIOMItem('Method', 'VC_CreateUserMessageGroup');
			newGroup.setProperty('source_id', myForumId);
			newGroup.setProperty('user_id', item.getAttribute('data-id', ''));
			newGroup.setProperty('group_type', 'UserMessages');
			newGroup = newGroup.apply();
			if (newGroup.isError()) {
				aras.AlertError(newGroup.getErrorString(), null, null, window);
			}
			this.hide();
			initializeTree();
			selectBookmark(treeControl.getSelectedId());
		}
	});
});
