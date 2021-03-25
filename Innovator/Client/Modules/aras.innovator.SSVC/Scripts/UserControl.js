define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!SSVC/Views/UserControl.html',
	'SSVC/Scripts/Utils'
], function (declare, _WidgetBase, _TemplatedMixin, template, ssvcUtils) {
	const UserControl = declare([_WidgetBase, _TemplatedMixin], {
		container: null,
		templateString: template,
		CompanyLabel: ssvcUtils.GetResource('uc_company'),
		EmailLabel: ssvcUtils.GetResource('uc_email'),
		TelephoneLabel: ssvcUtils.GetResource('uc_telephone'),
		userCache: {},

		constructor: function (aras) {
			this.aras = aras;
		},

		draw: function (container) {
			this.container = container;
			this.placeAt(this.container);
		},

		show: function (displayStyle) {
			if (!displayStyle) {
				displayStyle = 'inline';
			}
			this.container.style.display = displayStyle;
		},

		hide: function () {
			this.container.style.display = 'none';
		},

		getUserInfo: function (userId) {
			if (!userId) {
				return;
			}
			const user = this.aras.newIOMItem('User', 'get');
			user.setID(userId);
			const userItem = user.apply();
			if (!userItem) {
				this.aras.AlertError(
					this.aras.getResource('', 'ssvc.secure_message.failed_get_user') +
						userItem.getErrorString(),
					null,
					null,
					window
				);
				return null;
			} else if (userItem.isEmpty()) {
				return {
					id: userId,
					displayName: this.aras.getResource(
						'',
						'common.restricted_property_warning'
					),
					companyName: '',
					email: '',
					telephone: '',
					pictureId: undefined,
					picture: undefined,
					isRestricted: true
				};
			} else {
				const name = userItem.getProperty('first_name', '');
				const surname = userItem.getProperty('last_name', '');
				const imgUrl = userItem.getProperty('picture', '');
				let pictureId;
				let picture;
				if (imgUrl) {
					if (imgUrl.indexOf('vault:///?fileId=') != -1) {
						pictureId = imgUrl
							.substring(imgUrl.indexOf('fileId='))
							.replace('fileId=', '');
					} else {
						picture = '../../' + imgUrl;
					}
				}
				this.userCache[userId] = {
					id: userId,
					displayName: userItem.getProperty(
						name || surname ? 'keyed_name' : 'login_name',
						''
					),
					companyName: userItem.getProperty('company_name', ''),
					email: userItem.getProperty('email', ''),
					telephone: userItem.getProperty('telephone', ''),
					pictureId: pictureId,
					picture: picture,
					isRestricted: false
				};
				return this.userCache[userId];
			}
		},

		setUser: function (userId) {
			const user = this.userCache[userId] || this.getUserInfo(userId);
			this.UserNameNode.textContent = user.displayName;
			this.UserNameNode.classList.toggle('Restricted', user.isRestricted);
			this.CompanyNode.textContent = user.companyName;
			this.EmailNode.href = 'mailto:' + user.email;

			this.EmailNode.textContent = user.email;
			this.TelephoneNode.textContent = user.telephone;

			user.picture =
				user.picture ||
				(user.pictureId
					? this.aras.IomInnovator.getFileUrl(
							user.pictureId,
							this.aras.Enums.UrlType.SecurityToken
					  )
					: this.aras.getScriptsURL() + '../Images/DefaultAvatar.svg');
			this.UserAvatarDiv.style.backgroundImage = "url('{0}')".Format(
				user.picture
			);
		},

		postCreate: function () {
			this.inherited(arguments);
			this.UserAvatarNode.addEventListener(
				'load',
				this['UserAvatarNode_OnLoad'].bind(this)
			);
		},

		UserAvatarNode_OnLoad: function () {
			if (this.UserAvatarNode.naturalWidth > 125) {
				this.UserAvatarNode.style.height = '100%';
				this.UserAvatarNode.style.width = '100%';
				if (this.UserAvatarNode.clientHeight > 125) {
					this.UserAvatarNode.style.height = '120px';
				}
			} else {
				this.UserAvatarNode.style.height =
					this.UserAvatarNode.naturalHeight + 'px';
				this.UserAvatarNode.style.width =
					this.UserAvatarNode.naturalWidth + 'px';
			}
		}
	});
	dojo.setObject('SSVC.UI.UserControl', UserControl);

	return UserControl;
});
