/**
 * Google Apps Script for Production Parameter Monitor
 * Fetches data up to Column Y (Index 24) to cover all required indices.
 */

function doGet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // Get first sheet
    
    // Fetch up to Column Y (Index 24) to capture indices 11, 13, 14 etc.
    var lastRow = sheet.getLastRow();
    var range = sheet.getRange(1, 1, lastRow, 25); // 25 columns (A to Y)
    var data = range.getValues();
    
    // Convert to JSON
    var output = JSON.stringify(data);
    
    // Set MIME type to JSON using ContentService
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