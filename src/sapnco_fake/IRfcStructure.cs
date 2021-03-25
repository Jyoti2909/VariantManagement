using System.Collections;
using System.Collections.Generic;

namespace SAP.Middleware.Connector
{
  public interface IRfcStructure : ICollection, IEnumerable
  {
    void MoveCorrespondingTo(IRfcStructure target);

    string GetValue(string name);

    void SetValue(string propertyName, object value);

    string GetString(string propertyName);
  }
}
