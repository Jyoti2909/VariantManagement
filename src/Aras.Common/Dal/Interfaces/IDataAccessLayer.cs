using Aras.Ark.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aras.Common
{
	/// <summary>
	/// Purpose of this interface is to declare customer-specific methods to reduce conflicts with common ones
	/// </summary>
	public interface IDataAccessLayer : IBaseDataAccessLayer
	{
		string ClientIpAddress { get; }
		string GetNextSequence(string sequenceName);
	}
}
