define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer'
], function (declare, XmlSchemaElementRenderer) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasItemXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			constructor: function (initialArguments) {
				this.ResourceString(
					'newItemVersionExists',
					'../Modules/aras.innovator.TDF',
					'rendering.newitemversionexists'
				);
				this.ResourceString(
					'itemPlaceholder',
					'../Modules/aras.innovator.TDF',
					'rendering.itemplaceholder'
				);
			},

			prepareElementState: function (schemaElement, parentState) {
				const resultState = this.inherited(arguments);

				if (schemaElement && schemaElement.isItemModified) {
					resultState.isItemModified = schemaElement.isItemModified();
				}

				return resultState;
			},

			RenderItem: function (schemaElement) {
				return '';
			},

			RenderInnerElement: function (schemaElement, elementState) {
				var itemContent;

				if (!elementState.isEmpty) {
					if (!elementState.isBlocked) {
						itemContent = this.RenderItem(schemaElement);
					} else {
						return this.ResourceString('contentIsBlocked');
					}
				} else {
					itemContent =
						'<div class="ArasElementPlaceholder">' +
						this.ResourceString('itemPlaceholder') +
						'</div>';
				}

				return itemContent;
			},

			GetTreeName: function (schemaElement, elementState) {
				var isUpdatable = elementState.isUpdatable;
				var namePostfix = isUpdatable
					? this.wrapInTag(
							' [' +
								schemaElement.getReferenceProperty('majorVersion') +
								'.' +
								schemaElement.getReferenceProperty('minorVersion') +
								']',
							'span',
							{ style: 'font-size:smaller;' }
					  )
					: '';
				var elementName = elementState.isBlocked
					? 'Item is blocked'
					: schemaElement.nodeName;
				var treeName = this.wrapInTag(elementName + namePostfix, 'span', {
					class: 'ArasXmlSchemaElementTypeNode',
					title: isUpdatable ? this.ResourceString('newItemVersionExists') : ''
				});

				return treeName;
			},

			GetTreeType: function (schemaElement, elementState) {
				return 'ArasItemXmlSchemaElementTreeNode';
			},

			GetTreeStyle: function (schemaElement, elementState) {
				var treeStyle = this.inherited(arguments);

				if (!elementState.isEmpty && !elementState.isBlocked) {
					var itemTypeId = schemaElement.ItemTypeId();
					var itemTypeIomItem = this._aras.getItemTypeForClient(
						itemTypeId,
						'id'
					);
					var iconUrl =
						itemTypeIomItem.getProperty('open_icon') ||
						'../../images/DefaultItemType.svg';

					if (iconUrl.toLowerCase().indexOf('vault:///?fileid=') != -1) {
						var fileId = iconUrl.substr(iconUrl.length - 32);
						iconUrl = this._aras.IomInnovator.getFileUrl(
							fileId,
							this._aras.Enums.UrlType.SecurityToken
						);
					} else {
						iconUrl = this._aras.getScriptsURL() + iconUrl;
					}

					treeStyle.backgroundImage = 'url("' + iconUrl + '")';
				}

				return treeStyle;
			},

			getStatusMarksContent: function (schemaElement, elementState) {
				if (schemaElement) {
					let marksContent = '';
					let markCount = 0;

					if (elementState && elementState.isBlocked) {
						marksContent += this.wrapInTag('', 'img', {
							src: '../../images/Blocked.svg',
							class: 'ConditionMark'
						});
						markCount++;
					}

					if (schemaElement.Condition() !== '{}') {
						marksContent += this.wrapInTag('', 'img', {
							src: '../../images/ConditionsApplied.svg',
							class: 'ConditionMark',
							style: markCount ? 'right:' + markCount * 20 + 'px;' : undefined
						});
						markCount++;
					}

					if (elementState.isItemModified) {
						marksContent += this.wrapInTag('', 'img', {
							src: '../../images/Edit.svg',
							class: 'ConditionMark ItemModifiedMark',
							style: markCount ? 'right:' + markCount * 20 + 'px;' : undefined
						});
						markCount++;
					}

					return marksContent;
				}
			}
		}
	);
});
