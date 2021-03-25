using System;
using System.Xml;
using Aras.IOM;
using Aras.Server.Core;
using Aras.Server.Security;
using Permissions = Aras.Server.Security.Permissions;

namespace Aras.Common
{
	public abstract class BaseDataAccessLayer : IBaseDataAccessLayer
	{
		protected Innovator Innovator { get; }

		protected CallContext CallContext { get; }

		protected BaseDataAccessLayer(Innovator innovator, CallContext callContext)
		{
			this.Innovator = innovator;
			this.CallContext = callContext;
		}

		public Item NewResult(string data)
		{
			return Innovator.newResult(data);
		}

		public Item NewError(string error)
		{
			return Innovator.newError(error);
		}

		public Item NewItem()
		{
			return Innovator.newItem();
		}

		public Item NewItem(string type)
		{
			return Innovator.newItem(type);
		}

		public Item NewItem(string type, string action)
		{
			return Innovator.newItem(type, action);
		}

		public Item NewItemWithoutAttribute()
		{
			Item newItem = NewItem();
			newItem = RemoveUselessAttributes(newItem);

			return newItem;
		}

		public Item NewItemWithoutAttribute(string type)
		{
			Item newItem = NewItem(type);
			newItem = RemoveUselessAttributes(newItem);

			return newItem;
		}

		public Item NewItemWithoutAttribute(string type, string action)
		{
			Item newItem = NewItem(type, action);
			newItem = RemoveUselessAttributes(newItem);

			return newItem;
		}

		public Item ApplyItem(Item item)
		{
			return TryCall(item.apply);
		}

		public Item ApplyAml(string aml)
		{
			return TryCall(() => Innovator.applyAML(aml));
		}

		public Item ApplySql(string sql)
		{
			return TryCall(() => Innovator.applySQL(sql));
		}

		public Item ApplyMethod(string methodName, string body)
		{
			return TryCall(() => Innovator.applyMethod(methodName, body));
		}

		public string GetNewId()
		{
			return Innovator.getNewID();
		}

		public string GetCurrentUserId()
		{
			return Innovator.getUserID();
		}

		public Item UnlockItem(Item item)
		{
			return item.unlockItem();
		}

		public Item PromoteItem(Item item, string state, string comments)
		{
			return item.promote(state, comments);
		}

		public IServerConnection GetConnection()
		{
			return Innovator.getConnection();
		}

		public Item ApplyAmlWithGrantIdentity(string aml, string identityName)
		{
			return ApplyWithGrantIdentity(identityName, () => ApplyAml(aml));
		}

		public Item ApplyItemWithGrantIdentity(Item item, string identityName)
		{
			return ApplyWithGrantIdentity(identityName, item.apply);
		}

		private Item ApplyWithGrantIdentity(string identityName, Func<Item> func)
		{
			Identity identityForGrant = Identity.GetByName(identityName);
			bool permissionWasGranted = false;
			try
			{
				permissionWasGranted = Permissions.GrantIdentity(identityForGrant);
				return TryCall(func);
			}
			finally
			{
				if (permissionWasGranted)
				{
					Permissions.RevokeIdentity(identityForGrant);
				}
			}
		}

		public string GetErrorMessage(string userMessageName)
		{
			return CallContext.ErrorLookup.Lookup(userMessageName);
		}

		public string GetErrorMessage(string userMessageName, params object[] parameters)
		{
			return CallContext.ErrorLookup.Lookup(userMessageName, parameters);
		}

		public Item InstantiateWorkflow(Item item, string workflowMapId)
		{
			return item.instantiateWorkflow(workflowMapId);
		}

		private static Item RemoveUselessAttributes(Item item)
		{
			item.removeAttribute("isNew");
			item.removeAttribute("isTemp");

			return item;
		}

		private Item TryCall(Func<Item> targetFunction)
		{
			try
			{
				return targetFunction();
			}
			catch (InnovatorServerException e)
			{
				XmlDocument faultDocument = Innovator.newXMLDocument();
				e.ToSoapFault(faultDocument);

				Item errorItem = NewItem();
				errorItem.loadAML(faultDocument.OuterXml);

				return errorItem;
			}
		}
	}
}