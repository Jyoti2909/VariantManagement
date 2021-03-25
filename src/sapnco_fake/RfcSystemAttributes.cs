using System.Text;

namespace SAP.Middleware.Connector
{
  public class RfcSystemAttributes
  {
    internal string sysID;
    internal string client;
    internal string user;
    internal string language;
    internal string isoLanguage;
    internal string partnerHost;
    internal string ownHost;
    internal string sysNr;
    internal string partnerRelease;
    internal string kernelRelease;
    internal string release;
    internal int partnerReleaseNumber;
    internal int codePage;
    internal int partnerCodePage;
    internal string destination;
    internal char partnerType = '3';
    internal char rfcRole = 'C';

    internal RfcSystemAttributes()
    {
    }

    public string SystemID => this.sysID ?? "";

    public string Client => this.client ?? "";

    public string User => this.user ?? "";

    public string Language => this.language ?? "";

    public string ISOLanguage => this.isoLanguage ?? "";

    public string PartnerHost => this.partnerHost ?? "";

    public string HostName => this.ownHost ?? "";

    public string Destination => this.destination ?? "";

    public string SystemNumber => this.sysNr ?? "";

    public int PartnerReleaseNumber => this.partnerReleaseNumber;

    public string PartnerRelease => this.partnerRelease ?? "";

    public string KernelRelease => this.kernelRelease ?? "";

    public string Release => this.release ?? "";

    public int CodePage => this.codePage;

    public int PartnerCodePage => this.partnerCodePage;

    public char PartnerType => this.partnerType;

    public char RfcRole => this.rfcRole;
  }
}
