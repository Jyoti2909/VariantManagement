namespace SAP.Middleware.Connector
{
  public interface IRfcParameter : IRfcElement
  {
    RfcParameterMetadata Metadata { get; }

    bool Active { get; set; }

    string DefaultValue { get; }
  }
}
