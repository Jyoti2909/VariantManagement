using Aras.IOM;
using System;
using System.Configuration;
using SAP.Middleware.Connector;
using System.Collections.Generic;
using Aras.Ark.Common;

namespace SAPTransfer
{
	class ARASTOSAPTransfer
	{
		public static RfcDestination destination;
		public static HttpServerConnection connection;
		static void Main(string[] args)
		{
			connection = IomFactory.CreateHttpServerConnection(ConfigurationManager.AppSettings.Get("url"), ConfigurationManager.AppSettings.Get("database"), ConfigurationManager.AppSettings.Get("user"), ConfigurationManager.AppSettings.Get("password"));
			Item loginResult = connection.Login();

			if (!loginResult.isError())
			{
				TransferToSAP();
			}
		}
		public static void TransferToSAP()
		{
			Innovator inn = IomFactory.CreateInnovator(connection);

			Item pendingQueryItem = inn.newItem("GAG_SAPTransferLog", "get");
			pendingQueryItem.setProperty("gag_sap_status", "Pending");
			Item results = pendingQueryItem.apply();

			Item failedQueryItem = inn.newItem("GAG_SAPTransferLog", "get");
			failedQueryItem.setProperty("gag_sap_status", "Failed");
			Item failedresult = failedQueryItem.apply();

			if (results.isEmpty())
			{
				results = failedresult;
			}
			else if (!failedresult.isEmpty())
			{
				results.appendItem(failedresult);
			}

			if (!results.isError())
				foreach (Item logItem in results.Enumerate())
				{
					DateTime thisDayStart = DateTime.Now;
					string nowStart = thisDayStart.ToString("yyyy-MM-ddTHH:mm:ss");
					logItem.setAction("edit");
					logItem.setProperty("gag_start_date", nowStart);

					string result = CheckSAPConnection();
					if (result.Equals("Connection Successful"))
					{
						string materialID = logItem.getProperty("gag_material_number");
						Item materialPart = inn.getItemById("Part", materialID);
						string materialStatus = CheckMaterial(materialPart);
						if (materialStatus == "Failure")
						{
							CreateMaterial(materialPart, logItem);
						}
						else
						{
							string bomStatus = CheckBOM(materialPart);
							if (!string.IsNullOrEmpty(bomStatus))
								CreateBOM(materialPart, logItem);
						}
					}
					else
					{
						FillLogItem(logItem, $"ERROR!. {result}", "Failed");
					}
				}
		}
		public static string CheckSAPConnection()
		{
			Innovator innovator = IomFactory.CreateInnovator(connection);
			string result;

			Item queryPart = innovator.newItem("GAG_SAPInterfaceSettings", "get");
			queryPart.setProperty("gag_active", "Yes");
			Item queryResult = queryPart.apply();
			if (queryResult.isEmpty())
			{
				result = "No SAP Connection Found. Contact Admin";
				return result;
			}
			try
			{
				Item sapResult = queryResult.getItemByIndex(0);
				RfcConfigParameters parameters = new RfcConfigParameters
				{
					[RfcConfigParameters.Name] = sapResult.getProperty("gag_name"),
					[RfcConfigParameters.User] = ConfigurationManager.AppSettings.Get("userSAP"),
					[RfcConfigParameters.Password] = ConfigurationManager.AppSettings.Get("passwordSAP"),
					[RfcConfigParameters.PeakConnectionsLimit] = sapResult.getProperty("gag_peak_connection_limit"),
					[RfcConfigParameters.ConnectionIdleTimeout] = sapResult.getProperty("gag_connection_idle_time_out"),
					[RfcConfigParameters.Language] = sapResult.getProperty("gag_language"),
					[RfcConfigParameters.AppServerHost] = sapResult.getProperty("gag_app_server_host"),
					[RfcConfigParameters.SystemNumber] = sapResult.getProperty("gag_system_number"),
					[RfcConfigParameters.Client] = sapResult.getProperty("gag_client")
				};
				destination = RfcDestinationManager.GetDestination(parameters);
				RfcSessionManager.BeginContext(destination);
				destination.Ping();

				result = "Connection Successful";
				return result;
			}
			catch (RfcLogonException)
			{
				result = "SAP Log-In Failed";
				return result;
			}
			catch (RfcCommunicationException)
			{
				result = "SAP Server Connection Error";
				return result;
			}
		}

		public static void CreateMaterial(Item materialPart, Item logItem)
		{
			IRfcFunction material = destination.Repository.CreateFunction("BAPI_MATERIAL_SAVEDATA");
			IRfcStructure headDataStructure = material.GetStructure("HEADDATA");
			string sapMaterialType = materialPart.getProperty("gag_sap_material_type");
			string materialNumber = materialPart.getProperty("item_number");
			string revision = materialPart.getProperty("major_rev");
			string materialNum = materialNumber + "-" + revision;
			string standardDesignation = materialPart.getProperty("gag_standard_designation");
			string dimensionStandard = materialPart.getProperty("gag_dimension_standard");
			string basicMaterial = materialPart.getProperty("gag_material");
			string gagtheoreticalWeight = materialPart.getProperty("gag_theoretical_weight");
			string gagmeasuredWeight = materialPart.getProperty("gag_measured_weight");
			decimal theoreticalWeight;
			if (string.IsNullOrEmpty(gagtheoreticalWeight))
			{
				theoreticalWeight = 0;
			}
			else
			{
				theoreticalWeight = decimal.Parse(gagtheoreticalWeight);
			}

			decimal measuredWeight;
			if (string.IsNullOrEmpty(gagmeasuredWeight))
			{
				measuredWeight = 0;
			}
			else
			{
				measuredWeight = decimal.Parse(gagmeasuredWeight);
			}

			string sapUOM = "";
			string sapUOMX = "";
			string arasUOM = materialPart.getProperty("gag_sap_unit_of_measure");
			if (arasUOM == "Pc")
			{
				sapUOM = "ST";
				sapUOMX = "PCE";
			}
			else if (arasUOM == "kg")
			{
				sapUOM = "KG";
				sapUOMX = "KGM";
			}
			else if (arasUOM == "m2")
			{
				sapUOM = "M2";
				sapUOMX = "MTK";
			}
			else if (arasUOM == "lm")
			{
				sapUOM = "LM";
				sapUOMX = "MTR";
			}
			else if (arasUOM == "m")
			{
				sapUOM = "M";
				sapUOMX = "MTR";
			}
			decimal weight = (measuredWeight != 0) ? measuredWeight : theoreticalWeight;

			headDataStructure.SetValue("material", materialNum);
			headDataStructure.SetValue("ind_sector", "M");
			headDataStructure.SetValue("matl_type", sapMaterialType);

			headDataStructure = material.GetStructure("CLIENTDATA");
			headDataStructure.SetValue("base_uom", sapUOM);
			headDataStructure.SetValue("base_uom_iso", sapUOMX);
			headDataStructure.SetValue("NET_WEIGHT", weight);
			headDataStructure.SetValue("UNIT_OF_WT_ISO", "KGM");
			headDataStructure.SetValue("UNIT_OF_WT", "KG");
			headDataStructure.SetValue("CAD_ID", "X");
			headDataStructure.SetValue("STD_DESCR", standardDesignation);
			headDataStructure.SetValue("SIZE_DIM", dimensionStandard);
			headDataStructure.SetValue("BASIC_MATL", basicMaterial);

			headDataStructure = material.GetStructure("CLIENTDATAX");
			headDataStructure.SetValue("base_uom", "X");
			headDataStructure.SetValue("base_uom_iso", "X");
			headDataStructure.SetValue("NET_WEIGHT", "X");
			headDataStructure.SetValue("UNIT_OF_WT_ISO", "X");
			headDataStructure.SetValue("UNIT_OF_WT", "X");
			headDataStructure.SetValue("CAD_ID", "X");
			headDataStructure.SetValue("STD_DESCR", "X");
			headDataStructure.SetValue("SIZE_DIM", "X");
			headDataStructure.SetValue("BASIC_MATL", "X");

			IRfcTable materialdescription = material.GetTable("MATERIALDESCRIPTION");
			string englishDescription = materialPart.getProperty("name");
			string germanDescription = materialPart.getProperty("gag_name_ge");
			string italianDescription = materialPart.getProperty("gag_name_it");
			string frenchDescription = materialPart.getProperty("gag_name_fr");
			string portugueseDescription = materialPart.getProperty("gag_name_pt");
			string turkishDescription = materialPart.getProperty("gag_name_tr");
			string spanishDescription = materialPart.getProperty("gag_name_es");
			IDictionary<string, string> descriptions = new Dictionary<string, string>
			{
				{ "EN", englishDescription },
				{ "DE", germanDescription },
				{ "IT", italianDescription },
				{ "FR", frenchDescription },
				{ "S", spanishDescription },
				{ "PT", portugueseDescription },
				{ "TR", turkishDescription },
			};
			foreach (KeyValuePair<string, string> description in descriptions)
			{
				if (!string.IsNullOrEmpty(description.Value))
				{
					materialdescription.Append();
					materialdescription.SetValue("LANGU", description.Key);
					materialdescription.SetValue("MATL_DESC", description.Value);
				}
			}

			material.Invoke(destination);

			IRfcStructure returnMessage = material.GetStructure("RETURN");
			string messageOutput = returnMessage.GetString("MESSAGE");

			IRfcFunction materialCommitFunction = destination.Repository.CreateFunction("BAPI_TRANSACTION_COMMIT");
			materialCommitFunction.Invoke(destination);

			if (messageOutput.Contains("created"))
			{
				CreateBOM(materialPart, logItem);
			}
			else
			{
				FillLogItem(logItem, $"Material NOT Created. {messageOutput}", "Failed");
			}

			connection.Logout();
		}

		public static string CheckMaterialsInBOM(Item materialPart)
		{
			Item relationships = materialPart.getRelationships("Part BOM");
			bool materialExist = false;
			foreach (Item partRel in relationships.Enumerate())
			{
				Item part = partRel.getRelatedItem();
				string partNumber = part.getProperty("item_number");
				string partRevision = part.getProperty("major_rev");
				string materialNumber = partNumber + "-" + partRevision;

				IRfcFunction documentCheckMaterial = destination.Repository.CreateFunction("BAPI_MATERIAL_GET_DETAIL");
				documentCheckMaterial.SetValue("MATERIAL", materialNumber);
				documentCheckMaterial.Invoke(destination);

				IRfcStructure returnMsg = documentCheckMaterial.GetStructure("RETURN");
				string messageOutput = returnMsg.GetString("TYPE");
				if (messageOutput == "S")
				{
					materialExist = false;
				}
				else
				{
					materialExist = true;
					break;
				}
			}

			return materialExist ? "Failure" : "Success";
		}

		public static void CreateBOM(Item materialPart, Item logItem)
		{
			materialPart.fetchRelationships("Part BOM");
			Item relationships = materialPart.getRelationships("Part BOM");
			if (relationships.getItemCount() > 0)
			{
				string bomMaterialStatus = CheckMaterialsInBOM(materialPart);
				if (bomMaterialStatus == "Success")
				{
					string changeNumber = materialPart.getProperty("gag_change_num");
					string materialNumber = materialPart.getProperty("item_number") + "-" + materialPart.getProperty("major_rev");
					int count = relationships.getItemCount();

					IRfcFunction CreateBOMBapi = destination.Repository.CreateFunction("CSAP_MAT_BOM_CREATE");
					CreateBOMBapi.SetValue("MATERIAL", materialNumber);
					CreateBOMBapi.SetValue("BOM_USAGE", "2");
					CreateBOMBapi.SetValue("CHANGE_NO", changeNumber);
					CreateBOMBapi.SetValue("FL_COMMIT_AND_WAIT", "X");
					CreateBOMBapi.SetValue("FL_DEFAULT_VALUES", "X");

					IRfcStructure headDataStruct = CreateBOMBapi.GetStructure("I_STKO");
					headDataStruct.SetValue("BASE_QUAN", "1");
					headDataStruct.SetValue("BOM_STATUS", "2");
					headDataStruct.SetValue("BASE_UNIT", "PC");

					for (int i = 0; i < count; i++)
					{
						Item partRelationship = relationships.getItemByIndex(i);
						Item part = partRelationship.getRelatedItem();
						string partNo = part.getProperty("item_number");
						string partRevision = part.getProperty("major_rev");
						string partNumber = partNo + "-" + partRevision;
						string quantity = partRelationship.getProperty("quantity");
						IRfcTable BOMItems = CreateBOMBapi.GetTable("T_STPO");
						BOMItems.Append();
						BOMItems.SetValue("ITEM_CATEG", "L");
						BOMItems.SetValue("ITEM_NO", "00" + (i + 1) * 10);
						BOMItems.SetValue("COMPONENT", partNumber);
						BOMItems.SetValue("COMP_QTY", quantity);
					}

					CreateBOMBapi.Invoke(destination);
					string msgOutput = CreateBOMBapi.GetString("BOM_NO");

					IRfcFunction rfcCommitFunction = destination.Repository.CreateFunction("BAPI_TRANSACTION_COMMIT");
					rfcCommitFunction.Invoke(destination);

					if (string.IsNullOrEmpty(msgOutput))
					{
						FillLogItem(logItem, "BOM not Created", "Failed");
					}
					else
					{
						FillLogItem(logItem, string.Empty, "Completed");
					}
				}
				else
				{
					FillLogItem(logItem, "Component Material does not exist in SAP", "Failed");
				}
			}
			else
			{
				FillLogItem(logItem, string.Empty, "Completed");
			}
		}

		public static string CheckMaterial(Item materialPart)
		{
			string materialNumber = materialPart.getProperty("item_number") + "-" + materialPart.getProperty("major_rev");

			IRfcFunction documentCheckMaterial = destination.Repository.CreateFunction("BAPI_MATERIAL_GET_DETAIL");
			documentCheckMaterial.SetValue("MATERIAL", materialNumber);
			documentCheckMaterial.Invoke(destination);

			IRfcStructure returnMsg = documentCheckMaterial.GetStructure("RETURN");
			string messageOutput = returnMsg.GetString("TYPE");

			return messageOutput == "S" ? "Success" : "Failure";
		}

		public static string CheckBOM(Item materialPart)
		{
			string materialNumber = materialPart.getProperty("item_number") + "-" + materialPart.getProperty("major_rev");

			IRfcFunction materialCheckBOM = destination.Repository.CreateFunction("BAPI_MAT_BOM_EXISTENCE_CHECK");
			materialCheckBOM.SetValue("MATERIAL", materialNumber);
			materialCheckBOM.SetValue("BOMUSAGE", "2");
			materialCheckBOM.Invoke(destination);

			IRfcTable returnTable = materialCheckBOM.GetTable("RETURN");
			string returnMessage = (string)returnTable.GetValue("MESSAGE");

			return returnMessage;
		}

		public static void FillLogItem(Item logItem, string reason, string status)
		{
			DateTime thisDayEnd = DateTime.Now;
			string nowEnd = thisDayEnd.ToString("yyyy-MM-ddTHH:mm:ss");
			logItem.setProperty("gag_end_date", nowEnd);
			logItem.setProperty("gag_reason", reason);
			logItem.setProperty("gag_sap_status", status);
			logItem.apply();
		}
	}
}
