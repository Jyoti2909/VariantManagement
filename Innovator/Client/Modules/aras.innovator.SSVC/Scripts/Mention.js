define(['require', 'SSVC/Scripts/Mention/TributeWrapper'], function (
	require,
	TributeWrapper
) {
	const mentionControl = {
		requestXmlTemplate: null,
		listNodeTemplate: null,
		attachedNode: null,
		userSelect: null,
		debounceTimeoutId: null,
		abortRequests: null,
		debounceDelay: 500,

		init: function (nodeContainer) {
			const self = this;
			require(['./UserSelect'], function (UserSelect) {
				self.userSelect = new UserSelect({ params: {} });
				const tributeWrapper = new TributeWrapper();
				tributeWrapper.getInstance(
					{
						menuContainer: undefined,

						values: function (text, callback) {
							self
								.remoteSearch(text)
								.then(function (data) {
									if (data) {
										const items = data.selectNodes('Item');
										const res = [];
										for (let i = 0; i < items.length; i++) {
											const login = aras.getItemProperty(
												items[i],
												'login_name',
												''
											);
											const keyedName = aras.getItemProperty(
												items[i],
												'keyed_name',
												''
											);
											const userId = aras.getItemProperty(items[i], 'id', '');
											let key = '';
											let value = '';
											if (keyedName === userId) {
												key = login; // we should use login, instead of guide (keyed_name)
												value = login;
											} else {
												key = keyedName + ' ' + login;
												value = keyedName;
											}

											res.push({
												key: key, // key for searching
												value: value, // value which will be inserted after select like @username
												id: userId,
												sourceItem: items[i]
											});
										}
										callback(res);
									}
								})
								.catch(function () {
									callback([]);
								});
						},
						selectTemplate: function (item) {
							// item.original values have already escaped, so we don't need any processing.
							return (
								'<span contenteditable="false" class="userRef" user_id="' +
								item.original.id +
								'" userName="' +
								item.original.value +
								'">@<a onclick="return false;" ' +
								'href="" style="text-decoration:underline" class="user-mention-link"  user_id="' +
								item.original.id +
								'" >' +
								item.original.value +
								'</a></span>'
							);
						},

						allowSpaces: true,
						replaceTextSuffix: '',
						trigger: '@',

						menuItemTemplate: function (item) {
							const menuItem = self.addItemToList(item.original.sourceItem);
							return menuItem.outerHTML;
						}
					},
					nodeContainer
				);
			});
		},

		addItemToList: function (userdata) {
			const userData = {
				avatarSrc: aras.getBaseURL() + '/images/DefaultAvatar.svg',
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

			userBlock.innerHTML = this.userSelect.listNodeTemplate.render(
				new dojox.dtl.Context(userData)
			);
			return userBlock;
		},

		remoteSearch: function (text) {
			const self = this;
			return new Promise(function (resolve) {
				clearTimeout(self.debounceTimeoutId);
				self.debounceTimeoutId = setTimeout(
					self.remoteSearchDelayed(text, resolve),
					self.debounceDelay
				);
			});
		},

		remoteSearchDelayed: function (text, resolve) {
			const self = this;
			this.userSelect.nameField.value = text;

			if (this.abortRequests) {
				this.abortRequests();
			}

			const usersRequestPromise = this.userSelect.sendRequest();

			const inputPromise = new Promise(function (resolve, reject) {
				self.abortRequests = function () {
					resolve();
					self.abortRequests = null;
				};
			});

			inputPromise.then(function () {
				usersRequestPromise.abort();
			});

			resolve(Promise.race([inputPromise, usersRequestPromise]));
		}
	};

	return mentionControl;
});
