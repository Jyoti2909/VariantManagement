<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
	<xsl:variable name="itemTypeIcon" select="'../images/ItemType.svg'"/>
	<xsl:variable name="fileIcon" select="'../images/FileType.svg'"/>
	<xsl:variable name="relationshipTypeIcon" select="'../images/RelationshipType.svg'"/>
	<xsl:variable name="fileItemIcon" select="'../images/File.svg'"/>
	<xsl:output method="xml" omit-xml-declaration="yes" standalone="yes" indent="yes"/>
	<xsl:template match="/">
		<table font="Arial 8" editable="false" sel_TextColor="#ffffff"  enableHTML="false" treelines="1" draw_grid="true" thinBorder="true" onRowSelect="onRowSelect" onEditCell="onEditCell" onXMLLoaded="onXmlLoaded" onMenuInit="initmenu" onMenuClick="onmenu" onKeyPressed="onKeyPressed" link_func="onLink" nosort="true">
			<thead>
				<th align="c">Configuration</th>
				<th align="c">Select</th>
			</thead>
			<columns>
				<column width="80%" order="0" align="l"/>
				<column width="20%" order="1" align="c"/>
			</columns>
			<inputrow/>
			<xsl:apply-templates />
		</table>
	</xsl:template>
	<xsl:template match="Item">
		<tr>
			<xsl:attribute name="type">
				<xsl:value-of select="@type"/>
			</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:attribute name="icon0">
				<xsl:choose>
					<xsl:when test="@type='ItemType'">
						<xsl:value-of select="$itemTypeIcon"/>
					</xsl:when>
					<xsl:when test="@type='Property'">
						<xsl:value-of select="$fileIcon"/>
					</xsl:when>
					<xsl:when test="@type='RelationshipType'">
						<xsl:value-of select="$relationshipTypeIcon"/>
					</xsl:when>
					<xsl:when test="@type='File'">
						<xsl:value-of select="$fileItemIcon"/>
					</xsl:when>
				</xsl:choose>
			</xsl:attribute>
			<xsl:attribute name="icon1">
				<xsl:choose>
					<xsl:when test="@type='ItemType'">
						<xsl:value-of select="$itemTypeIcon"/>
					</xsl:when>
					<xsl:when test="@type='Property'">
						<xsl:value-of select="$fileIcon"/>
					</xsl:when>
					<xsl:when test="@type='RelationshipType'">
						<xsl:value-of select="$relationshipTypeIcon"/>
					</xsl:when>
					<xsl:when test="@type='File'">
						<xsl:value-of select="$fileItemIcon"/>
					</xsl:when>
				</xsl:choose>
			</xsl:attribute>
			<td>
				<xsl:value-of select="name"/>
			</td>
			<td>
				<xsl:choose>
					<xsl:when test="@type='Property'">&lt;checkbox state="0"/&gt;</xsl:when>
					<xsl:when test="@type='File'">&lt;checkbox state="0"/&gt;</xsl:when>
				</xsl:choose>
			</td>
			<xsl:apply-templates select="Item"/>
			<xsl:apply-templates select="Relationships"/>
		</tr>
	</xsl:template>
	<xsl:template match="Relationships">
		<xsl:apply-templates select="Item"/>
	</xsl:template>
</xsl:stylesheet>