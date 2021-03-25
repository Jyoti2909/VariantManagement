using System.Collections;
using System.Collections.Generic;

namespace SAP.Middleware.Connector
{
	public interface IRfcTable : ICollection, IEnumerable
	{

		void Append(int count);

		void Insert(int count);

		void Insert(int count, int index);

		void Append();

		void Insert();

		void Clear();

		void Delete();

		void Delete(int index);

		void SetValue(string propertyName, object value);

		object GetValue(string name);
	}
}
