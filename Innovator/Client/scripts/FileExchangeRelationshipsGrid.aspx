<% Response.WriteFile("relationshipsGrid.html")%>
<script type="text/javascript">
	function updateToolbar2() {
		setControlVisible("related_option", false);
		setControlEnabled("new", true);
		setControlEnabled("pick_replace", false);
		setControlVisible("checkin", false);
		setControlVisible("checkout", false);
		setControlVisible("checkin_related", false);
		setControlVisible("checkout_related", false);
		replaceFlag = false;
	}
	window.addEventListener("load", updateToolbar2, false);

	function isCheckOutPossible(relFiles, ItemCanBeLockedByUser, ItemIsLockedByUser) {
		return false;
	}

	function computeCorrectControlState1(controlName, arg1, relFiles, relatedFiles) {
		return false;
	}

	function newRelationship(showSearchDialog, relatedNd) {
		var relatedIT_ID = top.aras.getItemProperty(RelType_Nd, "related_id");

		if (top.aras.getItemProperty(RelatedItemType_Nd, "name") == "File") {
			var methodArgs = {};
			methodArgs.RelType_Nm = RelType_Nm;
			methodArgs.item = item;
			return top.aras.evalItemMethod("FE_AddFilesToPackage", "", methodArgs).then(function(res) {
				var RelType_ID = top.aras.getRelationshipTypeId(RelType_Nm);
				if (!res || res.length === 0) {
					return false;
				}
				var type = top.aras.getItemTypeName(relatedIT_ID);
				preloadItems2(type, res);

				// get standart permission for file
				var query = new Item("Permission", "get");
				query.setProperty("name", "FileInPackage");
				query = query.apply();
				if (query.isError()) {
					this.AlertError(query.getErrorString());
					return;
				}
				var permissionId = query.getID();

				for (var i = 0; i < res.length; i++) {
					var itmID = res[i].id;
					itm = top.aras.getItemById(type, itmID, 0);
					if (!itm) {
						return;
					}
					itm.setAttribute("action", "get");
					top.aras.setItemProperty(itm, "permission_id", permissionId);
					if (!itm) {
						continue;
					}
					var relNd = top.aras.newRelationship(RelType_ID, item, false, window, itm);
					top.aras.setItemProperty(relNd, "parental_type", res[i].parental_type);
					top.aras.setItemProperty(relNd, "parental_id", res[i].parental_id);
					top.aras.setItemProperty(relNd, "parental_property", res[i].parental_property);
					addRow(relNd, relNd.selectSingleNode("related_id/Item"), false);
				}
				return res;
			});
		} else {
			return new Promise(function(resolve) {resolve(null)});
		}
	}

	function preloadItems2(type, resArray) {
		var arrayId = [];
		for (var i = 0; i < resArray.length; i++) {
			arrayId.push(resArray[i].id)
		}
		preloadItems(type, arrayId);
	}
</script>