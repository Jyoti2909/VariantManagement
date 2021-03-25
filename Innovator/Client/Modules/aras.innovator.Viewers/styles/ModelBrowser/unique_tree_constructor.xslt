<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:strip-space elements="*"/>

	<xsl:key name="kGDById" match="tr" use="concat(@id, '-', userdata[@key='parentProcId']/@value)"/>

	<xsl:template match="node()|@*">
		<xsl:apply-templates select="node()|@*"/>
	</xsl:template>

	<xsl:template match="tr[generate-id()=generate-id(key('kGDById',concat(@id, '-', userdata[@key='parentProcId']/@value))[1])]">
		<xsl:variable name="nodes">
			<xsl:for-each select="key('kGDById',concat(@id, '-', userdata[@key='parentProcId']/@value))/userdata[@key='originId']/@value">
				<xsl:if test="position() > 1">
					<xsl:text>,</xsl:text>
				</xsl:if>
				<xsl:value-of select="."/>
			</xsl:for-each>
		</xsl:variable>
		<tr id="{generate-id()}" icon0="{@icon0}" icon1="{@icon1}">
			<userdata key="itemId" value="{userdata[@key='itemId']/@value}"/>
			<userdata key="nodeIds" value="{$nodes}"/>
			<td>
				<xsl:value-of select="td"/>
			</td>
			<xsl:apply-templates/>
		</tr>
	</xsl:template>
	<xsl:template match="tr"/>

	<xsl:template match="table">
		<table>
			<xsl:apply-templates/>
		</table>
	</xsl:template>
</xsl:stylesheet>
