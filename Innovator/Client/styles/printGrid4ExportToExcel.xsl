<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:p="urn:ExportBook" xmlns:msxsl="urn:schemas-microsoft-com:xslt" xmlns:usr="urn:the-xml-files:xslt" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
	<xsl:variable name="prefix" select="/table/@workSheet"/>
	<xsl:variable name="tableColumns" select="/table/columns/column" />
	<xsl:variable name="locked_by_id_column_order" >
		<xsl:choose>
			<xsl:when test="string(/table/thead/th[position()=1])=''">
				<xsl:value-of select="number($tableColumns[position()=1]/@order)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:number value="NaN" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:template match="@* | node()">
		<xsl:copy>
			<xsl:apply-templates select="@* | node()"/>
		</xsl:copy>
	</xsl:template>
	<!-- match the root and produce the requisite root Excel Xml stuff -->
	<xsl:template match="/">
		<ss:Workbook>
			<ss:Styles>
				<xsl:if test="count(/table/tr/td[@sort='DATE']) > 0">
					<ss:Style ss:ID="dateStyle">
						<ss:Borders>
							<ss:Border ss:Position="Left" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
							<ss:Border ss:Position="Top" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
							<ss:Border ss:Position="Right" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
							<ss:Border ss:Position="Bottom" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
						</ss:Borders>
						<ss:NumberFormat ss:Format="Short Date"/>
					</ss:Style>
				</xsl:if>
				<xsl:apply-templates mode="style" select="/table/thead" />
				<xsl:apply-templates mode="style" select="/table/columns" />
				<xsl:apply-templates mode="style" select="/table/tr" />
			</ss:Styles>
			<ss:Worksheet>
				<xsl:attribute name="ss:Name">
					<xsl:choose>
						<xsl:when test="string($prefix) != ''">
							<xsl:value-of select="$prefix"/>
						</xsl:when>
						<xsl:otherwise>Innovator</xsl:otherwise>
					</xsl:choose>
				</xsl:attribute>
				<xsl:apply-templates />
			</ss:Worksheet>
		</ss:Workbook>
	</xsl:template>
	<xsl:template match="thead" mode="style">
		<xsl:variable name="theadNode" select="self::node()" />
		<xsl:for-each select="$tableColumns">
			<xsl:sort select="@order" order="ascending" data-type="number"/>
			<xsl:variable name="original_position">
				<xsl:number/>
			</xsl:variable>
			<xsl:if test="boolean(@width > 0)">
				<xsl:apply-templates select="$theadNode/th[position() = $original_position]" mode="style">
					<xsl:with-param name="position">
						<xsl:value-of select="position()"/>
					</xsl:with-param>
				</xsl:apply-templates>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="th" mode="style">
		<xsl:param name="position" />
		<xsl:if test="$position != number($locked_by_id_column_order + 1)">
			<ss:Style ss:ID="{concat($prefix, 'Th', $position)}">
				<ss:Interior ss:Pattern="Solid">
					<xsl:attribute name="ss:Color">
						<xsl:choose>
							<xsl:when test="@bgColor">
								<xsl:value-of select="@bgColor"/>
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="string('#d4d0c8')"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:attribute>
				</ss:Interior>
				<ss:Alignment ss:Vertical="Top">
					<xsl:attribute name="ss:Horizontal">
						<xsl:choose>
							<xsl:when test="@align='l'">Left</xsl:when>
							<xsl:when test="@align='r'">Right</xsl:when>
							<xsl:when test="@align='c'">Center</xsl:when>
							<xsl:otherwise>Center</xsl:otherwise>
						</xsl:choose>
					</xsl:attribute>
				</ss:Alignment>
				<ss:Borders>
					<ss:Border ss:Position="Left" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Top" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Right" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Bottom" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
				</ss:Borders>
			</ss:Style>
		</xsl:if>
	</xsl:template>
	<xsl:template match="tr" mode="style">
		<xsl:variable name="trNode" select="self::node()" />
		<xsl:variable name="row_position" select="position()" />
		<xsl:for-each select="$tableColumns">
			<xsl:sort select="@order" order="ascending" data-type="number"/>
			<xsl:variable name="original_position">
				<xsl:number/>
			</xsl:variable>
			<xsl:if test="boolean(@width > 0)">
				<xsl:apply-templates select="$trNode/td[position() = $original_position]" mode="style">
					<xsl:with-param name="position">
						<xsl:value-of select="position()"/>
					</xsl:with-param>
					<xsl:with-param name="sortType">
						<xsl:value-of select="@sort"/>
					</xsl:with-param>
					<xsl:with-param name="row_position">
						<xsl:value-of select="$row_position"/>
					</xsl:with-param>
				</xsl:apply-templates>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="td" mode="style">
		<xsl:param name="row_position" />
		<xsl:param name="position" />
		<xsl:param name="sortType" />
		<xsl:if test="$position != number($locked_by_id_column_order + 1) and @bgColor">
			<ss:Style ss:ID="{concat($prefix, 'r', $row_position, 'c', $position)}">
				<ss:Interior ss:Pattern="Solid" ss:Color="{@bgColor}" />
				<ss:Borders>
					<ss:Border ss:Position="Left" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Top" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Right" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Bottom" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
				</ss:Borders>
				<ss:NumberFormat>
					<xsl:attribute name="ss:Format">
						<xsl:choose>
							<xsl:when test="$sortType='DATE'">Short Date</xsl:when>
							<xsl:otherwise>General</xsl:otherwise>
						</xsl:choose>
					</xsl:attribute>
				</ss:NumberFormat>
			</ss:Style>
		</xsl:if>
	</xsl:template>
	<xsl:template match="columns" mode="style">
		<xsl:apply-templates select="column" mode="style">
			<xsl:sort order="ascending" data-type="number" select="@order"/>
		</xsl:apply-templates>
	</xsl:template>
	<xsl:template match="column" mode="style">
		<xsl:if test="position() != number($locked_by_id_column_order + 1) and boolean(@width > 0)">
			<ss:Style ss:ID="{concat($prefix, 'Col', position())}">
				<ss:Alignment ss:Vertical="Top">
					<xsl:if test="@align">
						<xsl:attribute name="ss:Horizontal">
							<xsl:choose>
								<xsl:when test="@align='l'">Left</xsl:when>
								<xsl:when test="@align='r'">Right</xsl:when>
								<xsl:when test="@align='c'">Center</xsl:when>
								<xsl:otherwise>Center</xsl:otherwise>
							</xsl:choose>
						</xsl:attribute>
					</xsl:if>
				</ss:Alignment>
				<ss:NumberFormat>
					<xsl:attribute name="ss:Format">
						<xsl:choose>
							<xsl:when test="@sort='DATE'">Short Date</xsl:when>
							<xsl:otherwise>General</xsl:otherwise>
						</xsl:choose>
					</xsl:attribute>
				</ss:NumberFormat>
				<ss:Borders>
					<ss:Border ss:Position="Left" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Top" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Right" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
					<ss:Border ss:Position="Bottom" ss:Color="Black" ss:LineStyle="Continuous" ss:Weight="1"/>
				</ss:Borders>
			</ss:Style>
		</xsl:if>
	</xsl:template >
	<xsl:template match="table">
		<ss:Table>
			<xsl:apply-templates select="columns" />
			<xsl:apply-templates select="thead" />
			<xsl:apply-templates select="tr" />
		</ss:Table>
	</xsl:template>
	<xsl:template match="columns">
		<xsl:for-each select="column">
			<xsl:sort select="@order" order="ascending" data-type="number"/>
			<xsl:variable name="original_position">
				<xsl:number/>
			</xsl:variable>
			<xsl:if test="@order != number($locked_by_id_column_order) and boolean(@width > 0)">
				<ss:Column ss:Width="{@width}" ss:StyleID="{concat($prefix, 'Col', position())}" />
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="thead">
		<ss:Row>
			<xsl:variable name="theadNode" select="self::node()" />
			<xsl:for-each select="$tableColumns">
				<xsl:sort select="@order" order="ascending" data-type="number"/>
				<xsl:variable name="original_position">
					<xsl:number/>
				</xsl:variable>
				<xsl:if test="boolean(@width > 0)">
					<xsl:apply-templates select="$theadNode/th[position() = $original_position]">
						<xsl:with-param name="position">
							<xsl:value-of select="position()"/>
						</xsl:with-param>
					</xsl:apply-templates>
				</xsl:if>
			</xsl:for-each>
		</ss:Row>
	</xsl:template>
	<xsl:template match="th">
		<xsl:param name="position" />
		<xsl:if test="$position != number($locked_by_id_column_order + 1)">
			<ss:Cell ss:StyleID="{concat($prefix, 'Th', $position)}">
				<ss:Data ss:Type="String">
					<xsl:apply-templates />
				</ss:Data>
			</ss:Cell>
		</xsl:if>
	</xsl:template>
	<xsl:template match="tr">
		<xsl:variable name="row_position" select="position()" />
		<ss:Row>
			<xsl:variable name="trNode" select="self::node()" />
			<xsl:for-each select="$tableColumns">
				<xsl:sort select="@order" order="ascending" data-type="number"/>
				<xsl:variable name="original_position">
					<xsl:number />
				</xsl:variable>
				<xsl:variable name="pos">
					<xsl:value-of select="position()" />
				</xsl:variable>
				<xsl:if test="boolean(@width > 0) and $pos != number($locked_by_id_column_order + 1)">
					<xsl:apply-templates select="$trNode/td[position() = $original_position]">
						<xsl:with-param name="position">
							<xsl:value-of select="position()" />
						</xsl:with-param>
						<xsl:with-param name="sortType">
							<xsl:value-of select="@sort" />
						</xsl:with-param>
						<xsl:with-param name="row_position">
							<xsl:value-of select="$row_position"/>
						</xsl:with-param>
					</xsl:apply-templates>
				</xsl:if>
			</xsl:for-each>
		</ss:Row>
	</xsl:template>
	<xsl:template match="td">
		<xsl:param name="row_position" />
		<xsl:param name="position" />
		<xsl:param name="sortType" />
		<xsl:variable name="nodeVal" select="."/>
		<row_pos>
			<xsl:value-of select="$row_position"/>
		</row_pos>
		<ss:Cell>
			<xsl:if test="@sort='DATE'">
				<xsl:attribute name="ss:StyleID">dateStyle</xsl:attribute>
			</xsl:if>
			<xsl:if test="@bgColor">
				<xsl:attribute name="ss:StyleID">
					<xsl:value-of select="concat($prefix, 'r', $row_position, 'c', $position)" />
				</xsl:attribute>
			</xsl:if>
			<ss:Data>
				<xsl:choose>
					<xsl:when test="$nodeVal = ''">
						<xsl:attribute name="ss:Type">String</xsl:attribute>
					</xsl:when>
					<xsl:when test=".='&lt;checkbox state=&quot;0&quot;/&gt;'">
						<xsl:attribute name="ss:Type">Boolean</xsl:attribute>
						<xsl:value-of select="string('0')"/>
					</xsl:when>
					<xsl:when test=".='&lt;checkbox state=&quot;1&quot;/&gt;'">
						<xsl:attribute name="ss:Type">Boolean</xsl:attribute>
						<xsl:value-of select="string('1')"/>
					</xsl:when>
					<xsl:when test="starts-with(.,'&lt;img')">
						<xsl:attribute name="ss:Type">String</xsl:attribute>
					</xsl:when>
					<xsl:when test="@sort='DATE' or $sortType='DATE'">
						<xsl:attribute name="ss:Type">DateTime</xsl:attribute>
						<xsl:if test="$nodeVal != ''">
							<xsl:value-of select="concat(.,'.000')"/>
						</xsl:if>
					</xsl:when>
					<xsl:when test="@sort='NUMERIC' or $sortType='NUMERIC'">
						<xsl:attribute name="ss:Type">Number</xsl:attribute>
						<xsl:value-of select="$nodeVal"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:attribute name="ss:Type">String</xsl:attribute>
						<xsl:value-of select="$nodeVal"/>
					</xsl:otherwise>
				</xsl:choose>
			</ss:Data>
		</ss:Cell>
	</xsl:template>
</xsl:stylesheet>