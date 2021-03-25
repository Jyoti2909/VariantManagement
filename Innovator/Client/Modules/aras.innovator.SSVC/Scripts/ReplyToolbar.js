define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!SSVC/Views/ReplyToolbar.html',
	'SSVC/Scripts/Mention',
	'SSVC/Scripts/Mention/MessageContentConverter',
	'SSVC/Scripts/Utils'
], function (
	declare,
	lang,
	on,
	_WidgetBase,
	_TemplatedMixin,
	template,
	Mention,
	MessageContentConverter,
	ssvcUtils
) {
	return dojo.setObject(
		'SSVC.UI.ReplyToolbar',
		declare([_WidgetBase, _TemplatedMixin], {
			templateString: template,
			ReplyToolbarText: ssvcUtils.GetResource('reply_tb_def_comment'),
			textContainerClass: 'ssvc-toolbar-addComment-area',
			textContainer: null,

			constructor: function (textContainerClass) {
				this.textContainerClass = textContainerClass;
			},

			postCreate: function () {
				this.textContainer = this.domNode.getElementsByClassName(
					this.textContainerClass
				)[0];
				Mention.init(this.textContainer);
				this.own(
					on(this.btReplyNode, 'click', lang.hitch(this, 'onReplyButtonClick'))
				);
			},

			showMarkupCheckbox: function () {
				const includeImageDiv = this.ftIncludeImage;
				const includeImageChk = this.ftIncludeImageChk;

				includeImageDiv.style.display = 'block';
				includeImageChk.checked = true;
				this.btReplyNode.disabled = false;
			},

			hideMarkupCheckbox: function () {
				const includeImageDiv = this.ftIncludeImage;
				const includeImageChk = this.ftIncludeImageChk;

				includeImageDiv.style.display = 'none';
				includeImageChk.checked = false;
				this.changeCommentBtnState();
			},

			changeCommentBtnState: function () {
				const target = this.domNode;
				target.querySelector('input.btn').disabled = !(
					this.textContainer.textContent ||
					target.querySelector('input.arasCheckboxOrRadio').checked
				);
			},

			doIncludeImage: function () {
				return this.ftIncludeImageChk.checked;
			},

			disableSendBtn: function () {
				this.btReplyNode.disabled = true;
			},

			GetMessageText: function () {
				const contentConverter = new MessageContentConverter();
				const text = contentConverter.parseFromHtml(this.textContainer, '');
				return text;
			},

			clearMessageText: function () {
				this.textContainer.innerHTML = '';
			},

			setVisibility: function (newVisibility) {
				this.domNode.style.display = newVisibility;
			},

			getVisibility: function () {
				return this.domNode.style.display;
			},

			onReplyButtonClick: function (args) {}
		})
	);
});
