using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SAP.Middleware.Connector
{
	public class MockRfcFunction : IRfcFunction
	{
		public IRfcParameter this[int index] => throw new NotImplementedException();

		public IRfcParameter this[string name] => throw new NotImplementedException();

		public RfcFunctionMetadata Metadata => throw new NotImplementedException();

		public RfcAbapClassException.Mode AbapClassExceptionMode { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

		public int Count => throw new NotImplementedException();

		public object SyncRoot => throw new NotImplementedException();

		public bool IsSynchronized => throw new NotImplementedException();

		public void CopyTo(Array array, int index)
		{
			throw new NotImplementedException();
		}

		public IEnumerator<IRfcParameter> GetEnumerator()
		{
			return null;
		}

		public string GetString(string propertyName)
		{
			return string.Empty;
		}

		public IRfcStructure GetStructure(string name)
		{
			return new MockRfcStructure();
		}

		public IRfcTable GetTable(string name)
		{
			return new MockRfcTable();
		}

		public void Invoke(RfcDestination destination)
		{
		}

		public bool IsParameterActive(int index)
		{
			return true;
		}

		public bool IsParameterActive(string name)
		{
			return true;
		}

		public void SetParameterActive(int index, bool active)
		{
		}

		public void SetParameterActive(string name, bool active)
		{
		}

		public void SetValue(string name, string value)
		{
		}

		IEnumerator IEnumerable.GetEnumerator()
		{
			return GetEnumerator();
		}
	}
}
