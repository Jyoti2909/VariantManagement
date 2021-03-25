using Aras.IOM;

namespace Aras.Common
{
	[System.Diagnostics.CodeAnalysis.SuppressMessage("Return type is not CLS-compliant", "CS3002")]
	[System.Diagnostics.CodeAnalysis.SuppressMessage("Argument type is not CLS-compliant", "CS3001")]
	public interface IBaseDataAccessLayer
	{
		Item NewResult(string data);

		Item NewError(string error);

		Item NewItem();

		Item NewItem(string type);

		Item NewItem(string type, string action);

		Item NewItemWithoutAttribute();

		Item NewItemWithoutAttribute(string type);

		Item NewItemWithoutAttribute(string type, string action);

		Item ApplyItem(Item item);

		Item ApplyAml(string aml);

		Item ApplySql(string sql);

		Item ApplyMethod(string methodName, string body);

		string GetNewId();

		string GetCurrentUserId();

		Item UnlockItem(Item item);

		Item PromoteItem(Item item, string state, string comments);

		IServerConnection GetConnection();

		Item ApplyAmlWithGrantIdentity(string aml, string identityName);
		Item ApplyItemWithGrantIdentity(Item item, string identityName);

		string GetErrorMessage(string userMessageName);

		string GetErrorMessage(string userMessageName, params object[] parameters);
		Item InstantiateWorkflow(Item item, string workflowMapId);
	}
}