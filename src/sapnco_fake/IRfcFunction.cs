using System.Collections;
using System.Collections.Generic;

namespace SAP.Middleware.Connector
{
  public interface IRfcFunction : ICollection, IEnumerable<IRfcParameter>, IEnumerable
  {
    RfcFunctionMetadata Metadata { get; }

    RfcAbapClassException.Mode AbapClassExceptionMode { get; set; }

    IRfcParameter this[int index] { get; }

    IRfcParameter this[string name] { get; }

    bool IsParameterActive(int index);

    bool IsParameterActive(string name);

    void SetParameterActive(int index, bool active);

    void SetParameterActive(string name, bool active);

    void Invoke(RfcDestination destination);

    void SetValue(string name, string value);

    IRfcTable GetTable(string name);

    IRfcStructure GetStructure(string name);

    string GetString(string propertyName);
    }
}
