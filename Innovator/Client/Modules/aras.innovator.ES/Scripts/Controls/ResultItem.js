define([
	'dojo',
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/_base/lang',
	'ES/Scripts/Classes/Utils',
	'dojo/text!./../../Views/Templates/ResultItem.html',
	'dojo/text!./../../Views/Templates/ResultItemHighlight.html',
	'dojo/text!./../../Views/Templates/ResultFileHighlight.html',
	'dojo/text!./../../Views/Templates/SubResultItem.html',
	'dojo/text!./../../Views/Templates/ResultItemUIProperty.html'
], function (
	dojo,
	declare,
	_WidgetBase,
	_TemplatedMixin,
	lang,
	Utils,
	resultItemTemplate,
	resultItemHighlightTemplate,
	resultFileHighlightTemplate,
	subResultItemTemplate,
	resultItemUIPropertyTemplate
) {
	return declare([_WidgetBase, _TemplatedMixin], {
		_arasObj: null,
		_utils: null,

		_item: null,

		_modifiedInfoTextResource: null,
		_propertiesTextResource: null,
		_currentTextResource: null,
		_notCurrentTextResource: null,
		_showDetailsTextResource: null,
		_hideDetailsTextResource: null,
		_moreTextResource: null,
		_lessTextResource: null,

		templateString: '',
		baseClass: 'resultItem',
		collapsedClass: 'childItemsContainerCollapsed',
		detailsClass: 'detailsPanelVisible',

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});
			this._item = args.item;
			this._modifiedInfoTextResource = args.modifiedInfoTextResource;
			this._propertiesTextResource = args.propertiesTextResource;
			this._currentTextResource = args.currentTextResource;
			this._notCurrentTextResource = args.notCurrentTextResource;
			this._showDetailsTextResource = args.showDetailsTextResource;
			this._hideDetailsTextResource = args.hideDetailsTextResource;
			this._moreTextResource = args.moreTextResource;
			this._lessTextResource = args.lessTextResource;

			let templateProperties = {};
			templateProperties.iconPath = this._utils.getImageUrl(
				this._item.configurations.iconPath
			);
			templateProperties.itemTypeColor = this._item.configurations.itemTypeColor;
			templateProperties.type = this._item.getProperty('aes_doc_type', 'value');
			templateProperties.id = this._item.getProperty('id', 'value');
			templateProperties.keyedName = this._item.fields.title;
			templateProperties.subTitle = this._item.fields.subtitle;
			templateProperties.propertiesLabel = this._propertiesTextResource;
			templateProperties.highlightsMarkup = this._getHighlightsMarkup(
				this._item
			);
			templateProperties.childItemsMarkup = this._getChildItemsMarkup(
				this._item
			);
			templateProperties.moreTextResource = this._moreTextResource;

			// Details panel template properties
			templateProperties.toggleDetailsButtonTooltip = this._showDetailsTextResource;
			templateProperties.itemType = this._item.configurations.itemTypeSingularLabel;
			templateProperties.itemStateMarkup = this._item.fields.additionalInfo;
			templateProperties.modifiedMessage = lang.replace(
				this._modifiedInfoTextResource,
				[
					this._utils.convertDateToCustomFormat(
						this._item.getProperty('modified_on', 'value')
					),
					this._item.getProperty('modified_by_id', 'label')
				]
			);
			let propsMarkup = '';
			let uiPropNames = Object.keys(this._item.properties).filter(
				(propName) => {
					return this._item.getProperty(propName, 'is_ui');
				}
			);
			let sortedUiPropNames = uiPropNames.sort((a, b) => {
				let titleA = this._item.getProperty(a, 'title');
				let titleB = this._item.getProperty(b, 'title');
				return titleA.localeCompare(titleB, undefined, { numeric: true });
			});
			sortedUiPropNames.forEach((propName) => {
				propsMarkup += lang.replace(resultItemUIPropertyTemplate, {
					title: this._item.getProperty(propName, 'title'),
					value: this._item.getProperty(propName, 'label')
				});
			});
			templateProperties.propsMarkup = propsMarkup;

			this.templateString = lang
				.replace(resultItemTemplate, templateProperties)
				.replace(/\${/g, '&#36;&#123;');
		},

		postCreate: function () {
			if (this._item.subItems.length > 1) {
				//We need to hide some elements and display 'More' link
				this.childItemsContainer.classList.add(this.collapsedClass);
				this.moreLinkContainer.classList.remove('hidden');
			}
		},

		/**
		 * Get HTML markup of highlights
		 *
		 * @param {object} item
		 * @returns {string}
		 * @private
		 */
		_getHighlightsMarkup: function (item) {
			let markup = '';

			item.highlights.forEach((highlight) => {
				let highlightContent = this._prepareHighlightContent(highlight.content);
				let propertyTitle = item.getProperty(highlight.name, 'title');
				let propertyLabel =
					propertyTitle !== '' ? propertyTitle : highlight.name;

				if (item.getProperty('aes_doc_type', 'value') !== 'File') {
					markup += lang.replace(resultItemHighlightTemplate, [
						propertyLabel,
						highlightContent
					]);
				} else {
					if (propertyLabel === 'content') {
						markup += lang.replace(resultFileHighlightTemplate, [
							highlightContent
						]);
					}
				}
			});

			return markup;
		},

		/**
		 * Get HTML markup of child items
		 *
		 * @param {object} item
		 * @returns {string}
		 * @private
		 */
		_getChildItemsMarkup: function (item) {
			let markup = '';

			item.subItems.forEach((childItem) => {
				markup += lang.replace(subResultItemTemplate, {
					title: childItem.fields.title,
					subTitle: childItem.fields.subtitle,
					id: childItem.getProperty('id', 'value'),
					type: childItem.getProperty('aes_doc_type', 'value'),
					highlightsMarkup: this._getHighlightsMarkup(childItem),
					iconPath: this._utils.getImageUrl(childItem.configurations.iconPath),
					itemStateMarkup: childItem.fields.additionalInfo
				});
			});

			return markup;
		},

		/**
		 * Prepare highlight content:
		 *  - escape special HTML characters
		 *  - replace pre and post highlight strings with &lt;b&gt; and &lt;/b&gt;
		 *
		 * @param {string} highlightContent Content of highlight
		 * @returns {string}
		 * @private
		 */
		_prepareHighlightContent: function (highlightContent) {
			let res = this._utils.escapeHtml(highlightContent);

			return this._utils.replaceSelection(res);
		},

		/*------------------------------------------------------------------------------------------------------------*/
		//Event handlers

		_onResultItemClickEventHandler: function (ev) {
			let itemTypeName = ev.currentTarget.getAttribute('data-item-type') || '';
			let itemId = ev.currentTarget.getAttribute('data-item-id') || '';

			if (itemTypeName === 'File') {
				let fileUrl = this._arasObj.IomInnovator.getFileUrl(
					itemId,
					this.arasObj.Enums.UrlType.SecurityToken
				);
				let wnd = window.open('', '_blank');

				wnd.opener = null;
				wnd.location = fileUrl;
			} else {
				if (itemTypeName !== '' && itemId !== '') {
					this._arasObj.uiShowItem(itemTypeName, itemId);
				}
			}
		},

		_onMoreLinkClickEventHandler: function () {
			let hasClass = this.childItemsContainer.classList.contains(
				this.collapsedClass
			);

			this._utils.toggleClass(this.childItemsContainer, this.collapsedClass);
			this.moreLinkContainer.innerText = hasClass
				? this._lessTextResource
				: this._moreTextResource;
		},

		_onToggleDetailsButtonClickEventHandler: function () {
			let hasClass = this._resultItemContainer.classList.contains(
				this.detailsClass
			);

			this._utils.toggleClass(this._resultItemContainer, this.detailsClass);
			this._toggleDetailsButton.title = hasClass
				? this._showDetailsTextResource
				: this._hideDetailsTextResource;
		}
	});
});
