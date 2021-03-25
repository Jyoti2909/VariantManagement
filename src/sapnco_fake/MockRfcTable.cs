using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SAP.Middleware.Connector
{
	public class MockRfcTable : IRfcTable
	{
		public int Count => throw new NotImplementedException();

		public object SyncRoot => throw new NotImplementedException();

		public bool IsSynchronized => throw new NotImplementedException();

		public void Append(int count)
		{
		}

		public void Append()
		{
		}

		public void Clear()
		{
		}

		public void CopyTo(Array array, int index)
		{
		}

		public void Delete()
		{
		}

		public void Delete(int index)
		{
		}

		public IEnumerator GetEnumerator()
		{
			return null;
		}

		public object GetValue(string name)
		{
			return name;
		}

		public void Insert(int count)
		{
		}

		public void Insert(int count, int index)
		{
		}

		public void Insert()
		{
		}

		public void SetValue(string propertyName, object value)
		{
		}
	}
}
