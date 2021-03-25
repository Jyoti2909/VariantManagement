using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Runtime.Serialization;
using System.Text;
using System.Threading;

namespace SAP.Middleware.Connector
{
	public class RfcRepository : ISerializable
	{
		public IRfcFunction CreateFunction(string name)
		{
			return new MockRfcFunction();
		}

		public void GetObjectData(SerializationInfo info, StreamingContext context)
		{
		}
	}
}
