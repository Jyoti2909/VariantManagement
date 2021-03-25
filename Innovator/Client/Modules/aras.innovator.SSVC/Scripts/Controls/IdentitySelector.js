define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/aspect',
	'dojo/on'
], function (declare, _WidgetBase, _TemplatedMixin, aspect, on) {
	return declare([_WidgetBase, _TemplatedMixin], {
		popupWidget: null,
		templateString:
			'<div class="identitySelector hidden">' +
			'<img class="identityIcon" data-dojo-attach-point="identityIcon">' +
			'<span class="identityName" data-dojo-attach-point="identityName"></span>' +
			'</div>',

		postCreate: function () {
			on(this.domNode, 'click', this.onButtonClick.bind(this));
		},

		initForItem: function (item) {
			this.domNode.classList.toggle('hidden', !item);

			if (item) {
				const identitiesRequest = aras.newIOMItem(
					item.getAttribute('type'),
					'VCMV_GetPredefinedIdentityList'
				);
				const propertiesToSet = [
					'classification',
					'config_id',
					'created_by_id',
					'itemtype',
					'managed_by_id',
					'owned_by_id'
				];
				propertiesToSet.forEach(function (name) {
					identitiesRequest.setProperty(name, aras.getItemProperty(item, name));
				});
				const identitiesResponse = identitiesRequest.apply();

				const isDisabled =
					identitiesResponse.dom.selectSingleNode(
						'//Item[@type="Result"]/disabled'
					).text === '1';
				if (isDisabled) {
					this.domNode.classList.add('hidden');
				} else {
					const identitiesSelector =
						'//Item[@type="Identity" and @id!="' +
						aras.getIsAliasIdentityIDForLoggedUser() +
						'"]';
					const predefinedIdentities = identitiesResponse.dom.selectNodes(
						identitiesSelector
					);
					this.popupWidget.setPredefinedIdentities(predefinedIdentities);
				}
			}
		},

		setPopupWidget: function (popupWidget) {
			this.popupWidget = popupWidget;
			aspect.after(
				this.popupWidget,
				'onItemSelected',
				this.selectItem.bind(this),
				true
			);

			function makeInactive() {
				this.domNode.classList.remove('active');
			}
			aspect.after(this.popupWidget, 'hide', makeInactive.bind(this));
		},

		onButtonClick: function (e) {
			const button = this.domNode;
			const popup = this.popupWidget;

			if (button.classList.contains('active')) {
				popup.hide();
			} else {
				const feedContainer = popup.domNode.parentNode;
				const buttonRect = button.getBoundingClientRect();
				const feedContainerRect = feedContainer.getBoundingClientRect();
				const y = buttonRect.bottom - feedContainerRect.top + 1; // the popup have to be 1px below of toggle button
				const x = feedContainerRect.right - buttonRect.right; // x - it's a distance from a right side

				popup.show(x, y, true);
				button.classList.add('active');
			}
			e.stopPropagation();
		},

		selectItem: function (identityItem) {
			this.selectedIdentityId =
				identityItem.getAttribute('data-id') || identityItem.getAttribute('id');
			this.identityIcon.src = this.popupWidget.getIdentityIconUrl(identityItem);
			this.identityName.innerHTML =
				identityItem.getAttribute('name') ||
				aras.getItemProperty(identityItem, 'name');
		}
	});
});
