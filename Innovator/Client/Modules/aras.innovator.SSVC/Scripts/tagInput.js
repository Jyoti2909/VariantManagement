define(['dojo/_base/declare', 'dijit/_WidgetBase'], function (
	declare,
	_WidgetBase
) {
	return declare([_WidgetBase], {
		model: {},
		disableCssClassName: 'tag-container-disabled',
		constructor: function (inputParams) {
			const input = inputParams.contextNode;
			const tagNodeHtmlTemplate =
				'	<span>{{identityName}}</span>' +
				'	<a class="tag-delete-btn">&times;</a>';
			this.tagNodeTemplate = new dojox.dtl.Template(tagNodeHtmlTemplate);

			this.view = document.createElement('div');
			this.view.className = 'taginputContainer';
			this.view.appendChild(document.createElement('ul'));

			input.parentNode.replaceChild(this.view, input);
			this.view.appendChild(input);

			const self = this;
			this.view.addEventListener('click', function (e) {
				if (!self.view.classList.contains(self.disableCssClassName)) {
					if (e.target.matches('.tag-delete-btn')) {
						const tagNode = e.target.closest('li');
						self.removeTag(tagNode.getAttribute('data-id'));
					} else if (e.target.matches('.taginputContainer')) {
						input.focus();
					}
				}
			});
			input.addEventListener('keydown', function (e) {
				if (self.isInputDisabled() || e.which === 13) {
					e.preventDefault();
				}
			});
		},
		addTag: function (tagData) {
			const id = tagData.id;
			const name = tagData.name;

			this.model[id] = name;

			const tagNode = document.createElement('li');
			const templateData = {
				identityName: name
			};
			tagNode.innerHTML = this.tagNodeTemplate.render(
				new dojox.dtl.Context(templateData)
			);
			tagNode.setAttribute('data-id', id);

			this.view.firstChild.appendChild(tagNode);
		},
		removeTag: function (id) {
			const tag = this.view.firstChild.querySelector(
				'li[data-id="' + id + '"]'
			);
			if (tag) {
				delete this.model[id];
				tag.parentNode.removeChild(tag);
			}
		},
		isInputDisabled: function () {
			return this.view.classList.contains(this.disableCssClassName);
		},
		toggleEnabledState: function (enabled) {
			if (enabled === undefined) {
				enabled = true;
			}
			this.view.classList.toggle(this.disableCssClassName, !enabled);
		},
		getSelectedIds: function () {
			return Object.keys(this.model);
		}
	});
});
