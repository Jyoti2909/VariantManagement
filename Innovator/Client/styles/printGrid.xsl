<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" xmlns:regexp="http://exslt.org/regular-expressions" xmlns:aras="http://ww.aras-corp.com" xmlns:usr="urn:the-xml-files:xslt" version="1.0">
	<xsl:output method="html" omit-xml-declaration="yes" standalone="yes" indent="yes" encoding="utf-8" media-type="text/html; charset=utf-8"/>

	<msxsl:script language="JScript" implements-prefix="usr"><![CDATA[
		var blankImgSrc = '../imagesLegacy/1x1.gif';
		function getImgSrc(imgHTML) {
			if (imgHTML.length != 1) return '';
			imgHTML = imgHTML[0].text;
			var imgSrc = '';
			if (imgHTML.search(/<img +src="/)==0) {
				imgSrc = imgHTML.substring(imgHTML.indexOf('"')+1, imgHTML.lastIndexOf('"'));
			}
			else {
				imgSrc = imgHTML.substring(imgHTML.indexOf("'")+1, imgHTML.lastIndexOf("'"));
			}
			//<img=...>
			if (imgHTML.search(/<img\s*=/) == 0) {
				imgSrc = imgHTML.substring(imgHTML.indexOf("=")+1, imgHTML.lastIndexOf(">"));
			}
			return (imgSrc == '') ? blankImgSrc : imgSrc;
		}
	]]></msxsl:script>

	<xsl:variable name="font" select="//table/@font" />
	<xsl:template match="/">
		<html>
			<head>
				<title>Search Results</title>

				<link rel="stylesheet" type="text/css" href="../styles/default.css" />
				<style type="text/css">
					@import "../javascript/dijit/themes/claro/claro.css";
					@import "../../javascript/include.aspx?classes=common.css";
					body{
						overflow: auto;
						margin:0px;
						padding:0px;
					}
					table {
						<xsl:if test="$font">
							font-family:<xsl:value-of select="$font"/>;
						</xsl:if>
						border-width: 1px;
						border-style: solid none none solid;
						margin: 0px;
						padding: 0px;
						margin-left:auto;
						margin-right:auto;
					}
					th {
						background-color: #EEEEEE;
						font-size: 9pt;
						font-family: <xsl:if test="$font">font-family:<xsl:value-of select="$font"/>,</xsl:if>arial, helvetica, sans-serif;
						border-width: 0px 1px 3px 0px;
						border-style: none solid solid none;
						border-color: #000000;
					}
					td {
						background-color: #FFFFFF;
						font-size: 8pt;
						font-family: <xsl:if test="$font">font-family:<xsl:value-of select="$font"/>,</xsl:if>arial, helvetica, sans-serif;
						border-width: 1px;
						border-style: none solid solid none;
						border-color: #000000;
					}
					img {
						max-width: 15px;
						max-height: 15px;
					}
				</style>
				<script type="text/javascript" src="../javascript/include.aspx?classes=/dojo.js" data-dojo-config="isDebug: false, parseOnLoad: false, baseUrl:'../javascript/dojo'"></script>
				<script type="text/javascript" src="../javascript/printGrid.js"></script>
				<script type="text/javascript">
					var itemTypeName = "<xsl:value-of select='/printGrid/itemTypeName' />";
					var columnsArr = [];
				</script>
			</head>
			<body class="claro" oncontextmenu = "settingsHelper.populateContextMenu(window.contextMenu, event);">
				<xsl:apply-templates select="/printGrid/table" />
				<script type="text/javascript">
					document.addEventListener("DOMContentLoaded", function onload_handler() {
						var contentTable = document.getElementById("contentTable");
						window.settingsHelper = new SettingsHelper(contentTable, columnsArr);
						clientControlsFactory.createControl("dijit.Menu", {contextMenuForWindow: true}, function(control) {
							window.contextMenu = control;
						});
					});
				</script>
			</body>
		</html>
	</xsl:template>
	<xsl:template match="table">
		<table id="contentTable" align="center" border="0" cellpadding="4" cellspacing="0" title="You may use context menu to setup table">
			<xsl:apply-templates select="thead" />
			<xsl:apply-templates select="tr" />
		</table>
	</xsl:template>
	<xsl:template match="thead">
		<xsl:for-each select="th">
			<xsl:sort order="ascending" data-type="number" select="position()" />
			<col>
				<xsl:attribute name="id">
					<xsl:value-of select="position()-1"/>
				</xsl:attribute>
			</col>
		</xsl:for-each>
		<xsl:apply-templates select="th">
			<xsl:sort order="ascending" data-type="number" select="/table/columns/@order" />
		</xsl:apply-templates>
	</xsl:template>
	<xsl:template match="th">
		<xsl:variable name="pos" select="position()" />
		<th>
			<xsl:attribute name="id">
				<xsl:value-of select="$pos - 1"/>
			</xsl:attribute>
			<xsl:attribute name="style">
				background-color:<xsl:value-of select="@bgColor"/>;
			</xsl:attribute>
			<xsl:attribute name="nowrap">1</xsl:attribute>
			<xsl:attribute name="align">
				<xsl:choose>
					<xsl:when test="@align='l'">left</xsl:when>
					<xsl:when test="@align='r'">right</xsl:when>
					<xsl:when test="@align='c'">center</xsl:when>
				</xsl:choose>
			</xsl:attribute>
			<xsl:value-of select="." />
			<img src="../imagesLegacy/1x1.gif"/>
		</th>
		<script type="text/javascript">
			var col = new Object();
			col.id = '<xsl:value-of select="$pos - 1"/>';
			col.label =  '<xsl:value-of select="."/>';
			col.visible = true;
			columnsArr.push(col);
		</script>
	</xsl:template>
	<xsl:template match="tr">
		<tr>
			<xsl:apply-templates select="td" >
				<xsl:sort order="ascending" data-type="number" select="/table/columns/@order" />
			</xsl:apply-templates>
		</tr>
	</xsl:template>
	<xsl:template match="td">
		<td nowrap="1">
			<xsl:attribute name="id">
				<xsl:value-of select="position()-1"/>
			</xsl:attribute>
			<xsl:attribute name="align">
				<xsl:choose>
					<xsl:when test="@align='l'">left</xsl:when>
					<xsl:when test="@align='r'">right</xsl:when>
					<xsl:when test="@align='c'">center</xsl:when>
					<xsl:otherwise>left</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="string(.)='&lt;checkbox state=&quot;0&quot;/&gt;'">No</xsl:when>
				<xsl:when test="string(.)='&lt;checkbox state=&quot;1&quot;/&gt;'">Yes</xsl:when>
				<xsl:otherwise>
					<xsl:variable name="imgSrc">
						<xsl:choose>
						<xsl:when test="starts-with(string(.),'&lt;img')">
							<xsl:variable name="singleQuot"  select='"&apos;"' />
							<xsl:variable name="imgRegExp" select="concat(concat('&lt;img.+?src\s*=\s*[&quot;', $singleQuot), concat(concat('](.*?)[&quot;',$singleQuot),'].+?&gt;'))" />
							<xsl:choose>
								<xsl:when test="function-available('regexp:match')">
										<xsl:for-each select="regexp:match(./text(), $imgRegExp, '')">
										<xsl:if test="position()=last()">
											<xsl:variable name="srcValue" select="./text()" />
											<xsl:choose>
												<xsl:when test="$srcValue != ''">
													<xsl:value-of select="$srcValue" />
												</xsl:when>
												<xsl:otherwise>../imagesLegacy/1x1.gif</xsl:otherwise>
											</xsl:choose>
										</xsl:if>
									</xsl:for-each>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="usr:getImgSrc(.)"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:otherwise>../imagesLegacy/1x1.gif</xsl:otherwise>
						</xsl:choose>
					</xsl:variable>
					 <xsl:if test="not(starts-with(., '&lt;img'))">
						<xsl:value-of select="." />
					</xsl:if>
					<img>
						<xsl:attribute name="src">
							<xsl:value-of select="$imgSrc"/>
						</xsl:attribute>
					</img>
				</xsl:otherwise>
			</xsl:choose>
		</td>
	</xsl:template>
</xsl:stylesheet>