define([
	'dojo/_base/declare',
	'SSVC/Scripts/UserSelect',
	'SSVC/Scripts/Utils'
], function (declare, UserSelect, ssvcUtils) {
	return declare(UserSelect, {
		popupTitle: ssvcUtils.GetResource('share_with_title'),
		requestXmlTemplate: null,
		identityRoles: {},

		constructor: function () {
			const aliasIdentityId = aras.getIsAliasIdentityIDForLoggedUser();
			this.requestXmlTemplate =
				'<Item type="Identity" action="get" select="name, is_alias, id" maxRecords="15">' +
				'<name condition="like">%{userNameSnippet}%</name>' +
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

			const listNodeHtmlTemplate =
				'<img src="{{avatarSrc}}" class="identity-avatar"/>' +
				'<span class="identity-name">{{identityName}}{{identityRole}}</span>';

			this.listNodeTemplate = new dojox.dtl.Template(listNodeHtmlTemplate);
		},

		postCreate: function () {
			this.inherited(arguments);
			this.domNode.classList.add('shareWithIdentity');
			this.domNode.classList.add('justShown');
		},

		sendRequest: function () {
			return ArasModules.soap(this.getRequestXml(), { async: true });
		},

		getListItemData: function (identityItem) {
			const identityIcon = this.getIdentityIconUrl(identityItem);
			const identityId = identityItem.getAttribute('id');
			let identityRole = this.identityRoles[identityId];
			identityRole = identityRole ? ' (' + identityRole + ')' : '';

			return {
				avatarSrc: identityIcon,
				identityName: aras.getItemProperty(identityItem, 'name'),
				identityRole: identityRole
			};
		},

		getRequestXml: function () {
			return this.requestXmlTemplate.replace(
				'{userNameSnippet}',
				this.nameField.value
			);
		},

		getIdentityIconUrl: function (identityItem) {
			const imagesFolderUrl = aras.getBaseURL() + '/../images/';

			const identityId =
				identityItem.getAttribute('data-id') || identityItem.getAttribute('id');
			let iconName;
			if (identityId === 'A73B655731924CD0B027E4F4D5FCC0A9') {
				//worldId
				iconName = 'World.svg';
			} else {
				const isAlias =
					(identityItem.getAttribute('data-is_alias') ||
						aras.getItemProperty(identityItem, 'is_alias')) === '1';
				iconName = isAlias ? 'User.svg' : 'Group.svg';
			}

			return imagesFolderUrl + iconName;
		},

		handleReceivedItemsData: function (itemsData) {
			this.inherited(arguments);
		},

		addItemToList: function (data) {
			const listItemData = this.getListItemData(data);

			const forumBlock = document.createElement('div');
			forumBlock.className = 'popupSelect-listItem followForum-listItem';

			forumBlock.innerHTML = this.listNodeTemplate.render(
				new dojox.dtl.Context(listItemData)
			);
			forumBlock.setAttribute('name', aras.getItemProperty(data, 'name'));
			forumBlock.setAttribute(
				'data-is_alias',
				aras.getItemProperty(data, 'is_alias')
			);
			return forumBlock;
		},

		setPredefinedIdentities: function (predefinedIdentities) {
			this.predefinedItemNodes = [];
			this.identityRoles = {};
			let defaultItem;
			for (let i = 0; i < predefinedIdentities.length; i++) {
				const identityItem = predefinedIdentities[i];
				const identityId = identityItem.getAttribute('id');
				const visibilityRole = aras.getItemProperty(
					identityItem,
					'visibility_role'
				);
				if (this.identityRoles[identityId]) {
					this.identityRoles[identityId] += ', ' + visibilityRole;
				} else {
					this.identityRoles[identityId] = visibilityRole;
					this.predefinedItemNodes.push(identityItem);
				}

				// default identity or World. Default has a higher priority.
				if (
					visibilityRole.toLowerCase() === 'default' ||
					(!defaultItem && identityId === 'A73B655731924CD0B027E4F4D5FCC0A9')
				) {
					defaultItem = identityItem;
				}
			}

			this.onItemSelected(defaultItem);
		},

		onItemSelected: function (selectedItem) {
			this.hide();
		},

		processItem: function (index) {
			const item = this.itemsList.childNodes[index];
			if (item) {
				this.onItemSelected(item);
			}
		},
		show: function () {
			this.inherited(arguments);
			if (this.predefinedItemNodes && this.predefinedItemNodes.length) {
				this.handleReceivedItemsData(this.predefinedItemNodes);
			}
		},

		postListFill: function () {},
		checkFollowState: function () {}
	});
});
