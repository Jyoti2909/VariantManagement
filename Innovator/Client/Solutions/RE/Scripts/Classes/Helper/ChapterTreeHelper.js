define([
	'dojo/_base/declare'
],

function(declare) {
	return declare('Aras.Client.Controls.RequirementDocument.ChapterTreeHelper', null, {
		_requiredFields: null,
		aras: null,
		_requirementsHelper: null,

		constructor: function(args) {
			this.aras = args.aras;
			this._requirementsHelper = args.requirementsHelper;
		},

		_validateRequiredFields: function(requiremnet) {
			var missedFields = [];
			for (var fieldIndex = 0; fieldIndex < this._requiredFields.length; fieldIndex++) {
				var fieldName = this._requiredFields[fieldIndex];
				if (!this._requirementsHelper.getRequirementPropertyValue(requiremnet, fieldName.name)) {
					missedFields.push(fieldName.label);
				}
			}

			if (missedFields.length > 0) {
				this.aras.AlertError(this.aras.getResource('../Solutions/RE', 'req_dialog_missed_fields', missedFields.join(', ')));
				return false;
			}
			return true;
		},

		_requirementIsNotDuplicateValidation: function(newRequirement, rowsById) {
			const newRequirementId = this._requirementsHelper.getRequirementPropertyValue(newRequirement, 'config_id');
			if (rowsById.hasOwnProperty(newRequirementId)) {
				this.aras.AlertError(this.aras.getResource('../Solutions/RE', 'chaptertree_requirement_duplicate', newRequirement.getProperty('req_title')));
				return false;
			}

			return true;
		},

		_getSectionsByConfigIds: function(tree) {
			var sectionsById = {};

			var generateSectionsForOtherLevels = function(parentSection, children) {
				for (var itemIndex = 0; itemIndex < children.length; itemIndex++) {
					var childIndex = children[itemIndex];
					var row = tree.rows.get(childIndex);
					var section = parentSection + (itemIndex + 1).toString();
					sectionsById[row.reqId] = section;
					generateSectionsForOtherLevels(section + '.', row.children);
				}
			};

			var rootRow = tree.rows.get('root');
			generateSectionsForOtherLevels('', rootRow.children);

			return sectionsById;
		},

		setRequiredFields: function(requiredFields) {
			this._requiredFields = requiredFields;
		}
	});
});
