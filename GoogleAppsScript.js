/**
 * Google Apps Script for Production Parameter Monitor
 * Updated to handle strict MIME type checking and CORS correctly.
 */

function doGet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // Get first sheet
    
    // Explicitly fetch up to Column Y (Index 24)
    var lastRow = sheet.getLastRow();
    var range = sheet.getRange(1, 1, lastRow, 25); // 25 columns (A to Y)
    var data = range.getValues();
    
    // Convert to JSON
    var output = JSON.stringify(data);
    
    // Explicitly set MIME type to JSON using ContentService
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    var errorOutput = JSON.stringify({
      error: "Server Error",
      message: err.message,
      stack: err.stack
    });
    
    return ContentService.createTextOutput(errorOutput)
      .setMimeType(ContentService.MimeType.JSON);
  }
}