define([
	'dojo/_base/declare',
	'SSVC/Scripts/UserSelect',
	'SSVC/Scripts/tagInput',
	'dojo/text!SSVC/Views/ShareForumsList.html'
], function (declare, UserSelect, TagInput, template) {
	return declare(UserSelect, {
		templateString: template,
		identityIconPath: '../../../images/Group.svg',
		aliasIdentityIconPath: '../../../images/User.svg',
		constructor: function () {
			const listNodeHtmlTemplate =
				'	<img class="shareForum-identityImage" src="{{imgSource}}"/>' +
				'	<span class="shareForum-identityLabel">{{identityName}}</span>';

			this.listNodeTemplate = new dojox.dtl.Template(listNodeHtmlTemplate);
		},
		postCreate: function () {
			this.domNode.addEventListener(
				'keyup',
				function (e) {
					if (e.keyCode === 27) {
						e.stopPropagation();
					}
				},
				true
			);
			this.inherited(arguments);
			this.tagInput = new TagInput({ contextNode: this.nameField });
			Object.defineProperty(this.nameField, 'value', {
				get: function () {
					return this.textContent;
				},
				set: function (newValue) {
					this.textContent = newValue;
				},
				enumerable: true,
				configurable: true
			});
			this.toggleEnabledState = this.tagInput.toggleEnabledState.bind(
				this.tagInput
			);
		},
		sendRequest: function () {
			const aliasIdentityId = aras.getIsAliasIdentityIDForLoggedUser();
			const reqTemplate =
				'<Item type="Identity" action="get" select="keyed_name, is_alias, id" maxRecords="15">' +
				'<keyed_name condition="like">%' +
				this.nameField.value +
				'%</keyed_name>' +
				'<id condition="ne">' +
				aliasIdentityId +
				'</id>' +
				'<id condition="in">' +
				'SELECT [identity].id ' +
				'FROM innovator.[identity] ' +
				'LEFT JOIN innovator.[ALIAS] ON [ALIAS].related_id = [identity].id ' +
				'LEFT JOIN innovator.[USER] ON [ALIAS].source_id = [USER].id ' +
				"WHERE [identity].is_alias = '0' OR [USER].logon_enabled = '1'" +
				'</id>' +
				'<or>' +
				"<classification condition=\"not in\">'System','Team'</classification>" +
				'<classification condition="is null"></classification>' +
				'</or>' +
				'</Item>';

			return ArasModules.soap(reqTemplate, { async: true });
		},

		addItemToList: function (identityData) {
			const isAlias = aras.getItemProperty(identityData, 'is_alias', '');
			const templateData = {
				imgSource:
					isAlias === '0' ? this.identityIconPath : this.aliasIdentityIconPath,
				identityName: aras.getItemProperty(identityData, 'keyed_name', '')
			};
			const forumBlock = document.createElement('div');
			forumBlock.className = 'popupSelect-listItem shareForum-listItem';

			forumBlock.innerHTML = this.listNodeTemplate.render(
				new dojox.dtl.Context(templateData)
			);
			return forumBlock;
		},

		checkFollowState: function (id) {
			return this.tagInput.model[id] !== undefined;
		},
		show: function () {
			this.domNode.style.display = '';
		},
		postListFill: function () {},
		showUsersList: function () {
			this.itemsList.style.display = '';
		},
		processItem: function (index) {
			if (index > -1) {
				const item = this.itemsList.childNodes[index];
				if (item.classList.contains('followed')) {
					// identity already in shared list
					return;
				}
				const id = item.getAttribute('data-id', '');
				const name = item.querySelector('span').textContent;
				this.tagInput.addTag({ id: id, name: name });
				this.hideUsersList();
				this.clearNameField();
			}
		}
	});
});
