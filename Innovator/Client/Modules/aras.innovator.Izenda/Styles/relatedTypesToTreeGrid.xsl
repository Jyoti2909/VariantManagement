<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl">
	<xsl:output method="xml" indent="yes" omit-xml-declaration="yes"/>
	<xsl:template match="text()|@*"/>

	<xsl:template match="/">
		<result>
			<xsl:apply-templates select="/Result/Item">
				<xsl:sort select="concat(label,name,related_id/Item/label,related_id/Item/name)"></xsl:sort>
			</xsl:apply-templates>
		</result>
	</xsl:template>

	<xsl:template match="/Result/Item">

		<xsl:variable name="relationship_label">
			<xsl:choose>
				<xsl:when test="label != ''">
					<xsl:value-of select="label"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="name"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="related_label">
			<xsl:choose>
				<xsl:when test="related_id/Item/label != ''">
					<xsl:value-of select="related_id/Item/label"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="related_id/Item/name"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="node_id" select="concat('$baseType', '/Relationships/', relationship_id/Item/instance_data)"/>
		<tr level="0" id="{$node_id}" icon0="/images/checkbox-unchecked.svg" icon1="/images/checkbox-unchecked.svg">
			<userdata key="className" value="tree-base-item-type-prop" />
			<userdata key="format" value="rich" />
			<userdata key="nodeType" value="$nodeType" />
			<userdata key="guid" value="" />
			<xsl:element name="userdata">
				<xsl:attribute name="key">tabLabel</xsl:attribute>
				<xsl:attribute name="value">
					<xsl:value-of select="label"/>
				</xsl:attribute>
			</xsl:element>
			<xsl:element name="userdata">
				<xsl:attribute name="key">itemTypeId</xsl:attribute>
				<xsl:attribute name="value">
					<xsl:value-of select="relationship_id/Item/id"/>
				</xsl:attribute>
			</xsl:element>
			<xsl:element name="userdata">
				<xsl:attribute name="key">relatedItemTypeId</xsl:attribute>
				<xsl:attribute name="value">
					<xsl:value-of select="related_id/Item/id"/>
				</xsl:attribute>
			</xsl:element>
			<td>
				<img class="lefttree_reltypeicon" src="%InnovatorClientUrl%/images/RelationshipType.svg"/>
				<span class="relationship_href" data-itemtypeid="{relationship_id/Item/id}">
					<xsl:value-of select="$relationship_label"/>
				</span>
				<xsl:if test="$related_label != ''">
					<span class="related_href" data-itemtypeid="{related_id/Item/id}">
						(<xsl:value-of select="$related_label"/>)
					</span>
				</xsl:if>
			</td>
		</tr>

	</xsl:template>
</xsl:stylesheet>