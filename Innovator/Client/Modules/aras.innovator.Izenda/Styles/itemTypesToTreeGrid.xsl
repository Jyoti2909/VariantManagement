<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl">
	<xsl:output method="xml" indent="yes" omit-xml-declaration="yes"/>
	<xsl:template match="text()|@*"/>

	<xsl:template match="/">
		<result>
			<xsl:apply-templates select="Result/Item/Relationships/Item">
				<xsl:sort select="concat(label,name,data_source/Item/label,data_source/Item/name)"></xsl:sort>
			</xsl:apply-templates>
		</result>
	</xsl:template>

	<xsl:template match="Result/Item/Relationships/Item[@type='Property']">
		<xsl:if test="data_type[text() = 'item'] and data_source/node()/*">
			<xsl:variable name="_data_source_name">
				<xsl:choose>
					<xsl:when test="data_source/Item/label != ''">
						<xsl:value-of select="data_source/Item/label"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="data_source/Item/name"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>

			<xsl:call-template name="Properties">
				<xsl:with-param name="nodeType" select="1" />
				<xsl:with-param name="itemTypeId" select="data_source/Item/id" />
				<xsl:with-param name="data_source_name" select="$_data_source_name" />
			</xsl:call-template>
		</xsl:if>
		
		<xsl:if test="data_type[text() = 'list'] and data_source[text() != '']">
			<xsl:call-template name="Properties">
				<xsl:with-param name="nodeType" select="6" />
				<xsl:with-param name="itemTypeId" select="'8651DCAB4D714EF6AA747BB8F50719BA'" />
				<xsl:with-param name="data_source_name" select="data_source/@keyed_name" />
			</xsl:call-template>
		</xsl:if>
	</xsl:template>

	<xsl:template name="Properties">
		<xsl:param name="nodeType" />
		<xsl:param name="itemTypeId" />
		<xsl:param name="data_source_name" />

		<xsl:variable name="node_id" select="concat('$baseType', '/ItemTypes/', name)"/>
		<xsl:variable name="icon" select="'/images/checkbox-unchecked.svg'"/>
		<tr level="0" id="{$node_id}" icon0="{$icon}" icon1="{$icon}">
			<userdata key="className" value="tree-base-item-type-prop" />
			<userdata key="nodeType" value="{$nodeType}" />
			<userdata key="guid" value="" />
			<userdata key="format" value="rich" />
			<userdata key="itemTypeId" value="{$itemTypeId}" />
			<xsl:element name="userdata">
				<xsl:attribute name="key">columnName</xsl:attribute>
				<xsl:attribute name="value">
					<xsl:value-of select="name"/>
				</xsl:attribute>
			</xsl:element>

			<xsl:variable name="prop_name">
				<xsl:choose>
					<xsl:when test="label != ''">
						<xsl:value-of select="label"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="name"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>

			<userdata key="propName" value="{$prop_name}" />

			<td align="left">
				<img class="lefttree_reltypeicon" src="%InnovatorClientUrl%/images/ItemProperty.svg"/>
				<span>
					<xsl:value-of select="concat($prop_name, ' (', $data_source_name, ')')"/>
				</span>
			</td>
		</tr>
	</xsl:template>
</xsl:stylesheet>