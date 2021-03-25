<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:strip-space elements="*"/>
	<xsl:template match="Root">
		<table>
			<xsl:apply-templates select="ModelFile"/>
		</table>
	</xsl:template>

	<xsl:template match="ModelFile">
		<xsl:apply-templates select="ProductOccurence[@Root = 'true']">
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="ProductOccurence">
		<xsl:apply-templates select="Attributes">
			<xsl:with-param name="id" select="@Id"/>
			<xsl:with-param name="itemName" select="@Name"/>
			<xsl:with-param name="children" select="@Children"/>
			<xsl:with-param name="instanceNodeId" select="@InstanceRef"/>
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="Attributes">
		<xsl:param name="id"/>
		<xsl:param name="itemName"/>
		<xsl:param name="children"/>
		<xsl:param name="instanceNodeId"/>
		<xsl:variable name="itemId" select="Attr[@Name = 'ItemId']/@Value"/>
		<xsl:variable name="docNumber" select="Attr[@Name = 'DocNumber']/@Value"/>
		<xsl:variable name="parentProcId" select="Attr[@Name = 'ParentProcId']/@Value"/>
		<xsl:variable name="icon">
			<xsl:text>../../../images/CAD.svg</xsl:text>
		</xsl:variable>

		<xsl:variable name="refId">
			<xsl:choose>
				<xsl:when test="$instanceNodeId != ''">
					<xsl:value-of select="$instanceNodeId"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$id"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<tr id="{$refId}" icon0="{$icon}" icon1="{$icon}">
			<userdata key="itemId" value="{$itemId}"/>
			<userdata key="itemName" value="{$itemName}"/>
			<userdata key="parentProcId" value="{$parentProcId}"/>
			<userdata key="originId" value="{$id}"/>
			<td>
				<xsl:value-of select="$docNumber"/>
			</td>
			<xsl:call-template name="tokenize">
				<xsl:with-param name="text" select="$children"/>
			</xsl:call-template>
		</tr>
	</xsl:template>

	<xsl:template name="tokenize">
		<xsl:param name="text" select="."/>
		<xsl:param name="sep" select="' '"/>
		<xsl:choose>
			<xsl:when test="not(contains($text, $sep))">
				<xsl:variable name="childId" select="normalize-space($text)"/>
				<xsl:apply-templates select="//ProductOccurence[@Id=$childId]"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:variable name="childId" select="normalize-space(substring-before($text, $sep))"/>
				<xsl:apply-templates select="//ProductOccurence[@Id = $childId]"/>
				<xsl:call-template name="tokenize">
					<xsl:with-param name="text" select="substring-after($text, $sep)"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>
