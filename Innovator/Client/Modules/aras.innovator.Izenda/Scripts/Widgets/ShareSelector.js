require([
	'dojo/_base/declare',
	'dojo/on',
	'dojo/query',
	'dojo/dom-class'
], function (declare, djOn, query, domClass) {
	dojo.setObject(
		'Izenda.UI.Widgets.ShareSelector',
		declare(null, {
			constructor: function (args) {
				this.args = args;
				this.iframe = document.getElementById('identitiesGrid');
				var aras = parent.aras;
				var listValues = aras.getListValues(
					aras.getListId('User Report Access'),
					false
				);
				var select = document.getElementById('worldPermissions');
				var controlsDisabled = false;
				Array.prototype.forEach.call(listValues, function (type) {
					select.add(
						new Option(
							aras.getItemProperty(type, 'label'),
							aras.getItemProperty(type, 'value')
						)
					);
				});
				var rel = parent.item.selectSingleNode('./Relationships');
				if (rel) {
					parent.item.removeChild(rel);
				}

				if (this.args.isEditMode()) {
					var sharedWith = aras.soapSend(
						'ApplyItem',
						"<Item type='SelfServiceReportSharedWith' " +
							"select='related_id,access_rights' action='get' related_expand='0'><source_id>" +
							parent.item.getAttribute('id') +
							'</source_id></Item>'
					);
					if (sharedWith.isFault()) {
						setDefaultOption();
					} else {
						var result = sharedWith.getResult();
						window.sharedWithRelationship = result;

						if (
							result.childNodes.length === 1 &&
							aras.getItemProperty(result.childNodes[0], 'related_id') ===
								'A73B655731924CD0B027E4F4D5FCC0A9'
						) {
							document.getElementById('sWorld').checked = true;
							select.disabled = false;
							//todo
							select.value = aras.getItemProperty(
								result.childNodes[0],
								'access_rights'
							);
						} else {
							document.getElementById('sIds').checked = true;
							this.iframe.style.display = '';
							this.iframe.src =
								this.args.clientUrl +
								'/Modules/aras.innovator.Izenda/Views/ShareWithGrid.html';
						}
					}
				} else {
					setDefaultOption();
				}

				var ssrItem = parent.item;
				var creatorId = aras.getItemProperty(ssrItem, 'created_by_id');
				var ownerId = aras.getItemProperty(ssrItem, 'owned_by_id');
				var currentUserId = aras.getCurrentUserID();
				var userIdentityList = aras.getIdentityList();
				if (
					creatorId != currentUserId &&
					userIdentityList.indexOf(ownerId) < 0 &&
					!aras.isAdminUser()
				) {
					var shareRadioContainer = document.getElementById(
						'shareRadioContainer'
					);
					shareRadioContainer.setAttribute('disabled', 'true');
					var radioArr = query("input[type='radio']", this.args.widgetDom);
					if (radioArr) {
						for (var i = 0; i < radioArr.length; i++) {
							radioArr[i].setAttribute('disabled', 'true');
						}
					}
					controlsDisabled = true;
				}

				if (!controlsDisabled) {
					djOn(
						query("input[type='radio']", this.args.widgetDom),
						'change',
						this.onRadioClick.bind(this)
					);
					djOn(
						query('select', this.args.widgetDom),
						'change',
						this.OnWorldPermissionsChange.bind(this)
					);
				}

				function setDefaultOption() {
					document.getElementById('sMyself').checked = true;
				}
			},

			resize: function () {
				if (
					this.iframe.contentWindow &&
					this.iframe.contentWindow.identityGridControl
				) {
					this.iframe.contentWindow.identityGridControl[
						'grid_Experimental'
					].resize();
				}
			},

			addWorldIdentity: function () {
				var aras = parent.aras;
				var select = document.getElementById('worldPermissions');
				var RelTypeId = aras.getRelationshipTypeId(
					'SelfServiceReportSharedWith'
				);
				var world = aras.newRelationship(
					RelTypeId,
					parent.item,
					false,
					null,
					null
				);
				aras.setItemProperty(
					world,
					'related_id',
					'A73B655731924CD0B027E4F4D5FCC0A9'
				);
				aras.setItemPropertyAttribute(
					world,
					'related_id',
					'keyed_name',
					'World'
				);
				aras.setItemProperty(
					world,
					'access_rights',
					select.options[select.selectedIndex].value
				);
			},

			removeAllIdentities: function () {
				var RelTypeId = parent.aras.getRelationshipTypeId(
					'SelfServiceReportSharedWith'
				);
				var rel = parent.item.selectSingleNode('./Relationships');
				if (rel) {
					for (var i = 0; i < rel.childNodes.length; i++) {
						var node = rel.childNodes[i];
						if (node.getAttribute('type') !== 'SelfServiceReportSharedWith') {
							continue;
						}
						if (node.getAttribute('action') === 'add') {
							rel.removeChild(node);
							i--;
						}
					}
				}
				rel = window.sharedWithRelationship;
				if (rel) {
					for (j = 0; j < rel.childNodes.length; j++) {
						var nodeChild = rel.childNodes[j];
						if (nodeChild.getAttribute('action') === 'delete') {
							continue;
						} else {
							nodeChild.setAttribute('action', 'delete');
							var item = parent.aras.newRelationship(
								RelTypeId,
								parent.item,
								false,
								null,
								null
							);
							item.setAttribute('action', 'delete');
							item.setAttribute('id', nodeChild.getAttribute('id'));
							parent.aras.setItemProperty(item, 'access_rights', 'viewonly');
						}
					}
				}
			},

			onRadioClick: function (button, keepIds) {
				var isWorld = button.target.id === 'sWorld';
				var select = document.getElementById('worldPermissions');
				select.disabled = !isWorld;

				if (button.target.id === 'sIds') {
					this.iframe.style.display = '';
					this.iframe.src =
						this.args.clientUrl +
						'/Modules/aras.innovator.Izenda/Views/ShareWithGrid.html';
				} else {
					this.iframe.style.display = 'none';
					this.removeAllIdentities();
					if (isWorld) {
						this.addWorldIdentity();
					}
				}
			},

			OnWorldPermissionsChange: function () {
				var world = parent.item.selectSingleNode(
					"./Relationships/Item[@type='SelfServiceReportSharedWith' and " +
						"related_id/text()='A73B655731924CD0B027E4F4D5FCC0A9']"
				);
				if (world) {
					var select = document.getElementById('worldPermissions');
					parent.aras.setItemProperty(
						world,
						'access_rights',
						select.options[select.selectedIndex].value
					);
				} else {
					this.removeAllIdentities();
					this.addWorldIdentity();
				}
			}
		})
	);
});
