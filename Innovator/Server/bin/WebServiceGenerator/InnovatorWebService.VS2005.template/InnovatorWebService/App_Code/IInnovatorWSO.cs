using Aras.IOM;

namespace Aras.Tools.WebServices
{
    /// <summary>
    /// Interface that is implemented by Innovator web-service classes generated for
    /// each type defined int the web-service configuration file.
    /// </summary>
    interface IInnovatorWSO
    {
        Item ConvertToItem(Innovator innovator, string action, int levels);
    }
}