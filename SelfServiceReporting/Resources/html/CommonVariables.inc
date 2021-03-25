			<input type="hidden" name="CLIENTURL" value="<% = string.IsNullOrEmpty(Request["CLIENTURL"]) ? Server.HtmlEncode(InnovatorPage.InnovatorClientUrl.ToString()) : Server.HtmlEncode(Request["CLIENTURL"]) %>" />

			<input type="hidden" name="<% = Server.HtmlEncode(Config.ItemIdParamName) %>" value="<% = Server.HtmlEncode(Config.GetHttpVariable(Config.ItemIdParamName)) %>" />
			<input type="hidden" id="item_type_mode" name="<% = Server.HtmlEncode(Config.ItemTypeModeParamName) %>" value="<% = Server.HtmlEncode(((Driver)Izenda.AdHoc.AdHocContext.Driver).CheckAllowedItemTypeMode()) %>" />
