using System;
using System.Collections.Generic;
using System.Reflection;

namespace SAP.Middleware.Connector
{
	public class RfcDestination
	{
		public RfcSystemAttributes SystemAttributes => new RfcSystemAttributes();

		public void Ping()
		{

		}

		public RfcRepository Repository => new RfcRepository();
	}
}
