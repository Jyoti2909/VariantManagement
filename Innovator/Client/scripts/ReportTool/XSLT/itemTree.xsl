<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:msxsl="urn:schemas-microsoft-com:xslt"
  xmlns:aras="http://www.aras.com"
  xmlns:usr="urn:the-xml-files:xslt"
  version="1.0">

  <xsl:template match="/">
    <table
      oneditcell="onEditCell"
      onmenuinit="onMenuInit"
      onmenuclick="onMenuClick"
      ondoubleclick="onDoubleClick"
      draw_grid="true"
      treelines="1"
      editable="true"
      enableHtml="false"
      noheader="false"
			icon0="../scripts/ReportTool/images/16x16_item.gif"
			icon1="../scripts/ReportTool/images/16x16_properties.gif"
			icon2="../scripts/ReportTool/images/16x16_relationship.gif"
			icon3="../scripts/ReportTool/images/16x16_attributes.gif"
			>
      
      <thead>
        <th>Element</th>
        <th>Value</th>
      </thead>

      <columns>
        <column width="50%" edit="NOEDIT" align="left" order="0"/>
        <column width="50%" edit="NOEDIT" align="left" order="1"/>
      </columns>
      
      <list id="1">
      </list>
  
      <xsl:apply-templates select="Result"/>
      
      <xsl:apply-templates select="Item">
        <xsl:with-param name="xpath" select="''"/>
      </xsl:apply-templates>
    </table>
  </xsl:template>
  
  <xsl:template match="Result">
    <xsl:apply-templates select="Item">
      <xsl:with-param name="xpath" select="'Result'"/>
    </xsl:apply-templates>
  </xsl:template>
  
  <xsl:template match="Item">
    <xsl:param name="xpath"/>
    <tr icon0="0">
      <xsl:attribute name="id"><xsl:value-of select="$xpath"/>/<xsl:value-of select="name()"/>[@type="<xsl:value-of select="@type"/>"]</xsl:attribute>
      
      <td>Item</td>
      <td><xsl:value-of select="@type"/></td>
      
      <xsl:call-template name="properties">
        <xsl:with-param name="props" select="*"/>
        <xsl:with-param name="xpath" select="concat($xpath, '/', name())"/>
      </xsl:call-template>
    </tr>
  </xsl:template>
  
  <xsl:template name="properties">
    <xsl:param name="props"/>
    <xsl:param name="xpath"/>

    <xsl:for-each select="$props">
      <xsl:choose>
      
        <xsl:when test="name() = 'id'">
        </xsl:when>
      
        <xsl:when test="count(*) = 0">
          <tr icon0="1">
            <xsl:attribute name="id"><xsl:value-of select="$xpath"/>/<xsl:value-of select="name()"/></xsl:attribute>
            <td><xsl:value-of select="name()"/></td>
            <td><xsl:value-of select="."/></td>
          </tr>
        </xsl:when>
        
        <xsl:otherwise>
          <tr>
            <xsl:attribute name="id"><xsl:value-of select="$xpath"/>/<xsl:value-of select="name()"/></xsl:attribute>
            <xsl:choose>
              <xsl:when test="name() = 'Relationships'">
                <xsl:attribute name="icon0">2</xsl:attribute>
              </xsl:when>
              <xsl:otherwise>
                <xsl:attribute name="icon0">3</xsl:attribute>
              </xsl:otherwise>
            </xsl:choose>
            
	    <td><xsl:value-of select="name()"/></td>
	    
            <xsl:apply-templates select="Item">
              <xsl:with-param name="xpath" select="concat($xpath, '/', name())"/>
            </xsl:apply-templates>
          </tr>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="attributes">
    <xsl:param name="attrs"/>
    <xsl:param name="xpath"/>

    <xsl:for-each select="$attrs">
      <tr icon0="3">
        <xsl:attribute name="id"><xsl:value-of select="$xpath"/>/@<xsl:value-of select="name()"/></xsl:attribute>
        <td><xsl:value-of select="name()"/></td>
        <td><xsl:value-of select="."/></td>
      </tr>
    </xsl:for-each>
  </xsl:template>
  
  <xsl:template match="Relationships">
    <xsl:param name="xpath"/>

    <tr icon0="3">
      <xsl:attribute name="id"><xsl:value-of select="$xpath"/>/<xsl:value-of select="name()"/></xsl:attribute>
      <td>Relationships</td>
      <xsl:apply-templates select="Item">
        <xsl:with-param name="xpath" select="concat($xpath, '/Relationships')"/>
      </xsl:apply-templates>
    </tr>
  </xsl:template>

</xsl:stylesheet>
