using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SAP.Middleware.Connector
{
	public class MockRfcStructure : IRfcStructure
	{
		public int Count => throw new NotImplementedException();

		public object SyncRoot => throw new NotImplementedException();

		public bool IsSynchronized => throw new NotImplementedException();

		public void CopyTo(Array array, int index)
		{
			throw new NotImplementedException();
		}

		public string GetValue(string name)
		{
			return name;
		}

		public void MoveCorrespondingTo(IRfcStructure target)
		{
		}

		public void SetValue(string propertyName, object value)
		{
		}

		public string GetString(string propertyName)
		{
			switch (propertyName)
			{
				case "TYPE":
					return "S";
				case "STATUS":
					return "01";
				default:
					return string.Empty;
			}
		}

		IEnumerator IEnumerable.GetEnumerator()
		{
			return Enumerable.Empty<string>().GetEnumerator();
		}
	}
}
