using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Steps;
using DeploymentProcedure.Steps.Base;
using DeploymentProcedure.Utility;
using System;
using System.Xml;
using System.Xml.Serialization;

namespace DeploymentProcedure.Serialization
{
	internal class InstanceXmlSerializer
	{
		private readonly XmlSerializer _xmlSerializer;

		internal InstanceXmlSerializer(Type type)
		{
			_xmlSerializer = new XmlSerializer(type, CreateInstanceOverrides());
		}

		public object Deserialize(XmlReader xmlReader)
		{
			return _xmlSerializer.Deserialize(xmlReader);
		}

		private XmlAttributeOverrides CreateInstanceOverrides()
		{
			XmlAttributeOverrides overrides = new XmlAttributeOverrides();

			XmlAttributes componentsAttributes = new XmlAttributes();
			componentsAttributes.XmlArray = new XmlArrayAttribute("components");
			foreach (Type componentSubtype in SerializationHelper.GetAllSubtypes(typeof(Component)))
			{
				componentsAttributes.XmlArrayItems.Add(new XmlArrayItemAttribute(componentSubtype));
			}

			XmlAttributes stepsAttributes = new XmlAttributes();
			foreach (Type stepSubtype in SerializationHelper.GetAllSubtypes(typeof(BaseStep)))
			{
				stepsAttributes.XmlElements.Add(new XmlElementAttribute(stepSubtype));
			}

			XmlAttributes connectorsAttributes = new XmlAttributes();
			foreach (Type connectorSubtype in SerializationHelper.GetAllSubtypes(typeof(BaseConnector)))
			{
				connectorsAttributes.XmlElements.Add(new XmlElementAttribute(connectorSubtype));
			}

			overrides.Add(typeof(Instance), "Components", componentsAttributes);
			overrides.Add(typeof(Instance), "Steps", stepsAttributes);
			overrides.Add(typeof(LinkStep), "Connectors", connectorsAttributes);

			return overrides;
		}
	}
}
