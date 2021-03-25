<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:msxsl="urn:schemas-microsoft-com:xslt"
  xmlns:aras="http://www.aras.com"
  xmlns:usr="urn:the-xml-files:xslt"
  version="1.0">

  <msxsl:script language="JScript" implements-prefix="usr">
  <![CDATA[
    var rowId = 0;
    function nextRowId() {
      return rowId++;
    }
  ]]>
  </msxsl:script>
  
  <xsl:template match="/">
    <table
      oneditcell="onEditCell"
      opened="true"
      openitems="true"
      expandroot="true"
      draw_grid="true"
      treelines="1"
      editable="true"
      nosort="true"
      noheader="false">
      
      <thead>
        <th>Element</th>
        <th>Value</th>
      </thead>
      
      <columns>
        <column width="65%" edit="FIELD" align="l" order="0"/>
        <column width="35%" edit="FIELD" align="l" order="1"/>
      </columns>
      
      <xsl:apply-templates select="Item"/>
    </table>
  </xsl:template>

  <xsl:template match="Item">
    <tr icon0="../images/Text.svg" icon1="../images/Text.svg" opened="true">
      <xsl:attribute name="id"><xsl:value-of select="usr:nextRowId()"/></xsl:attribute>
      
      <td><xsl:value-of select="@type"/> Item</td>
      
      <xsl:call-template name="attributes"><xsl:with-param name="attrs" select="@*"/></xsl:call-template>      
      <xsl:call-template name="properties"><xsl:with-param name="props" select="*"/></xsl:call-template>
    </tr>
  </xsl:template>
  
  <xsl:template name="properties">
    <xsl:param name="props"/>
    <xsl:for-each select="$props">
      <xsl:choose>
        <xsl:when test="count(*) = 0">
          <tr icon0="../images/UpArrow.svg" icon1="../images/UpArrow.svg" opened="true">
            <xsl:attribute name="id"><xsl:value-of select="usr:nextRowId()"/></xsl:attribute>
            <td align="left"><xsl:value-of select="name()"/></td><td align="left"><xsl:value-of select="."/></td>
          </tr>
        </xsl:when>
        <xsl:when test="Relationships">
          <xsl:apply-templates select="Relationships"/>
        </xsl:when>
        <xsl:otherwise>
          <tr icon0="../images/UpArrow.svg" icon1="../images/UpArrow.svg" opened="true">
            <xsl:attribute name="id"><xsl:value-of select="usr:nextRowId()"/></xsl:attribute>
	    <td align="left"><xsl:value-of select="name()"/></td>
            <xsl:apply-templates select="Item"/>
          </tr>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="attributes">
    <xsl:param name="attrs"/>
    <xsl:for-each select="$attrs">
      <tr icon0="../images/Properties.svg" icon1="../images/Properties.svg" opened="true">
        <xsl:attribute name="id"><xsl:value-of select="usr:nextRowId()"/></xsl:attribute>
        <td align="left"><xsl:value-of select="name()"/></td><td align="left"><xsl:value-of select="."/></td>
      </tr>
    </xsl:for-each>
  </xsl:template>
  
  <xsl:template match="Relationships">
    <tr icon0="../images/RelationshipType.svg" icon1="../images/RelationshipType.svg" opened="true">
      <xsl:attribute name="id"><xsl:value-of select="usr:nextRowId()"/></xsl:attribute>
      <td>Relationships</td>
      <xsl:apply-templates select="Item"/>
    </tr>
  </xsl:template>

</xsl:stylesheet>