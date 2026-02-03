
/**
 * Google Apps Script for Production Parameter Monitor
 * To deploy: 
 * 1. Open Google Sheet -> Extensions -> Apps Script
 * 2. Paste this code and Save.
 * 3. Deploy -> New Deployment -> Web App
 * 4. Execute as: Me, Who has access: Anyone
 */

function doGet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // Get first sheet
    
    // Explicitly fetch up to Column Y (Index 24)
    var lastRow = sheet.getLastRow();
    var range = sheet.getRange(1, 1, lastRow, 25); // 25 columns (A to Y)
    var data = range.getValues();
    
    // Convert to JSON and return
    var output = JSON.stringify(data);
    
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
