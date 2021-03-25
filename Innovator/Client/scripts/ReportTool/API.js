/*
 *
 * (c) Copyright by Aras Corporation, 2004-2008.
 *
 * Purpose: This is the API for the Report Tool.
 *
 */

var API = new Object();
// This will hold the report_query property on the Report item.
API.queryDOM = aras.createXMLDocument();

// This will hold the result of the query.
API.resultsDOM = aras.createXMLDocument();

// This will hold the xsl_stylesheet property on the Report item.
API.xslDOM = aras.createXMLDocument();

// This will hold the global CSS styles.
API.cssDOM = aras.createXMLDocument();
