using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Aras.Ark.Common;
using Aras.IOM;
using Aras.Server.Core;

namespace Aras.Common
{
	/// <summary>
	/// Purpose of this class is to implement customer-specific methods to reduce conflicts with common ones
	/// </summary>
	public class DataAccessLayer : BaseDataAccessLayer, IDataAccessLayer
	{
		public DataAccessLayer(Innovator innovator, CallContext callContext) : base(innovator, callContext)
		{
		}

		public string ClientIpAddress => CallContext.Request.UserHostAddress != "::1" ? CallContext.Request.UserHostAddress : "127.0.0.1";

		public string GetNextSequence(string sequenceName)
		{
			return Innovator.getNextSequence(sequenceName);
		}
	}
}
