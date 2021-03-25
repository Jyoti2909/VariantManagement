<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <div class="ViewerToolbarContainer">
      <div class="ToolbarBeginning">&#60;</div>
      <xsl:for-each select="viewerToolbars/{%0%}/*">
        <xsl:variable name="elementType"><xsl:value-of select="name()"></xsl:value-of></xsl:variable>
        <xsl:choose>
          <xsl:when test="name()='button'">
            <div class="ViewerButtonContainer"
                 data-dojo-attach-point="{@name}"
                 event="{@event}"
                 data-dojo-type="VC.UI.mtButton"
                 type="{$elementType}">
              <img title="{@tooltip}"
                    class="{@style}" style="max-width: 26px; max-height: 26px;"
                    src="{@src}" />
            </div>
          </xsl:when>
          <xsl:when test="name()='numbertextbox'">
            <div class="ViewerButtonContainer NumberTextBox">
              <span data-dojo-type="VC.Toolbar.BasicNumberTextBox"
                    data-dojo-attach-point="{@name}"
                    data-dojo-props="labelBefore: '{@labelbefore}', labelAfter: '{@labelafter}', additionalData: '{@additionalData}'"
                    class="{@style}"
										title="{@tooltip}"
										type="{$elementType}">.</span>
            </div>
          </xsl:when>
        </xsl:choose>
      </xsl:for-each>
    </div>
  </xsl:template>
</xsl:stylesheet>