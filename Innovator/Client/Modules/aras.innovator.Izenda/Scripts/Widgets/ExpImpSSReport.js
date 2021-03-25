require([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dojo/query',
	'dojo/text!Izenda/Views/Widgets/ExpImpForm.html'
], function (declare, domConstruct, query, exportFormTemplate) {
	return declare('Aras.Client.Izenda.ExpImpSSReport', null, {
		constructor: function (args) {
			this.args = args;
			this.tgtSelector = "div[id='" + this.args.id + "'] ";

			var dom = document.getElementById(this.args.id);
			if (!dom) {
				dom = domConstruct.create(
					'div',
					{
						id: this.args.id,
						style: 'display: none',
						innerHTML: format(
							exportFormTemplate,
							this.args.arasObj.getInnovatorUrl() +
								'/SelfServiceReporting/rs2.aspx?access_token=' +
								this.args.arasObj.OAuthClient.getToken(),
							this.args.id + '_form'
						)
					},
					document.getElementById(this.args.parentNode),
					'first'
				);
			}

			var self = this;
			document
				.querySelector(this.tgtSelector + "input[name='IMPORT_REPORTS']")
				.addEventListener(
					'change',
					function () {
						self.setForm('IMPORT_REPORTS', '');
					},
					false
				);
		},

		exportReports: function (itemIds) {
			///<summary>Bind this to Export UI control (e.g., toolbar button)</summary>
			this.resetForm();
			this.setForm('EXPORT_REPORTS', itemIds);
		},

		resetForm: function () {
			document.getElementById(this.args.id + '_form').reset();
		},

		importReports: function () {
			///<summary>Bind this to Import UI control (e.g., toolbar button)</summary>
			this.resetForm();
			document
				.querySelector(this.tgtSelector + "input[name='IMPORT_REPORTS']")
				.click();
		},

		setForm: function (op, itemIds) {
			var srcForm = document.getElementById('aspnetForm');
			var tgtForm = document.querySelector(this.tgtSelector + 'form');
			var tgtFormElem = document.getElementById(this.args.id + '_form');
			document.querySelector(
				this.tgtSelector + "input[name='ITEMIDS']"
			).value = itemIds;
			document.querySelector(this.tgtSelector + "input[name='OP']").value = op;
			tgtFormElem.submit(); // tgtForm.submit() fails
		}
	});
});
