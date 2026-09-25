# Google Sheets Setup Guide
## AI Student Toolkit — Task 5: Google Sheets Live Backend

This guide walks you through connecting a real Google Sheet to the AI Student Toolkit using Google Apps Script as a simple JSON API.

---

## 1. Google Sheet Structure

Create a new Google Sheet with these **exact column headers** in row 1:

| A  | B    | C       | D     | E          |
|----|------|---------|-------|------------|
| ID | Name | Subject | Marks | Attendance |

Then add some sample rows:

| 1 | Rahul Sharma | Artificial Intelligence | 85 | 92 |
| 2 | Priya Mehta  | DBMS                    | 78 | 88 |
| 3 | Aman Gupta   | Computer Networks       | 91 | 95 |

---

## 2. Apps Script Code

1. In your Google Sheet, click **Extensions → Apps Script**.
2. Delete the default `function myFunction() {}` code.
3. Paste the entire script below:

```javascript
// ============================================================
//  AI Student Toolkit — Google Sheets Apps Script API
//  Supports: GET (fetch all rows) and POST (add a new row)
//  Deploy as: Web App → Execute as Me → Access: Anyone
// ============================================================

const SHEET_NAME = 'Sheet1'; // Change if your sheet tab is named differently

// ── GET handler — returns all rows as JSON ────────────────────
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ success: false, message: 'Sheet not found. Check SHEET_NAME.' });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      // Only headers, no data rows
      return jsonResponse({ success: true, data: [] });
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase()); // e.g. ['id','name','subject','marks','attendance']
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    }).filter(row => row.name && String(row.name).trim() !== ''); // skip blank rows

    return jsonResponse({ success: true, data: rows });

  } catch (err) {
    return jsonResponse({ success: false, message: 'Error reading sheet: ' + err.message });
  }
}

// ── POST handler — appends a new row ─────────────────────────
function doPost(e) {
  try {
    // Apps Script POST body comes via e.postData.contents
    const body = JSON.parse(e.postData.contents);

    // Validate required fields
    if (!body.name || String(body.name).trim() === '') {
      return jsonResponse({ success: false, message: 'Name is required.' });
    }
    if (!body.subject || String(body.subject).trim() === '') {
      return jsonResponse({ success: false, message: 'Subject is required.' });
    }

    const marks      = parseFloat(body.marks);
    const attendance = parseFloat(body.attendance);

    if (isNaN(marks) || marks < 0 || marks > 100) {
      return jsonResponse({ success: false, message: 'Marks must be a number between 0 and 100.' });
    }
    if (isNaN(attendance) || attendance < 0 || attendance > 100) {
      return jsonResponse({ success: false, message: 'Attendance must be a number between 0 and 100.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ success: false, message: 'Sheet not found. Check SHEET_NAME.' });
    }

    // Get next ID (last row ID + 1)
    const lastRow = sheet.getLastRow();
    const newId = lastRow >= 2
      ? (sheet.getRange(lastRow, 1).getValue() || 0) + 1
      : 1;

    // Append the new row: ID | Name | Subject | Marks | Attendance
    sheet.appendRow([
      newId,
      String(body.name).trim(),
      String(body.subject).trim(),
      marks,
      attendance
    ]);

    return jsonResponse({ success: true, message: 'Record added successfully.', id: newId });

  } catch (err) {
    return jsonResponse({ success: false, message: 'Error adding record: ' + err.message });
  }
}

// ── Helper: return CORS-enabled JSON response ─────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 3. Deploy the Apps Script

1. In the Apps Script editor, click **Deploy** (top-right) → **New deployment**.
2. Click the gear icon next to **Select type** → choose **Web app**.
3. Fill in the settings:
   - **Description**: `Student Records API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. If prompted, click **Authorize access** and follow the Google sign-in flow.
6. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxx/exec
   ```

> ⚠️ **Important**: Every time you edit the Apps Script code, you must create a **New deployment** (not re-deploy the existing one) to publish the changes.

---

## 4. Connect in AI Student Toolkit

1. Open the AI Student Toolkit in your browser (`http://localhost:8080`).
2. Click **Google Sheets** in the sidebar.
3. Paste the Web App URL into the **Google Apps Script Web App URL** field.
4. Click **Connect**.
5. The toolkit will test the connection and load your sheet data.

---

## 5. Testing the API Manually

**GET — fetch all records:**
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
Open this URL in a browser. You should see JSON like:
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Rahul Sharma", "subject": "Artificial Intelligence", "marks": 85, "attendance": 92 }
  ]
}
```

**POST — add a record (use Postman or curl):**
```bash
curl -L -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"name":"Tanisqa Raj","subject":"Machine Learning","marks":90,"attendance":95}'
```
Expected response:
```json
{ "success": true, "message": "Record added successfully.", "id": 9 }
```

---

## 6. Demo Mode

If you have not configured a Web App URL, the module runs in **Demo Mode**:
- Shows clearly labelled sample data.
- Add Record works locally (not saved to a real sheet).
- All UI features (search, filter, stats, AI Insights) work normally.
- A yellow banner at the top says "Demo Mode — Showing sample data."

Once you paste a real URL and click Connect, the banner changes to "Live Google Sheets."

---

## 7. AI Insights

- Click **AI Insights** on the Google Sheets page.
- The fetched records are sent to the existing AI backend (`/api/ai` → `google-sheets-insights`).
- The AI returns a markdown analysis covering class overview, performance, attendance, and observations.
- If the AI API is unavailable, an "AI Insights unavailable" message is shown — your sheet data is unaffected.

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| "Unable to connect" | Check that the URL ends in `/exec`, not `/dev`. |
| Data not updating after POST | Click the **Refresh** button to reload from the sheet. |
| Blank table after connecting | Add rows to your Google Sheet (the script requires at least one data row below the headers). |
| "Sheet not found" error | Change `SHEET_NAME` in the Apps Script to match your actual tab name (default is `Sheet1`). |
| POST not saving data | Make sure you created a **New deployment** after pasting the script. Editing code without redeploying has no effect on the live URL. |
| Google asks for authorization | Click "Authorize access", sign in with your Google account, and allow the requested permissions. This is expected on first deploy. |
| CORS error in browser console | This should not happen when Apps Script is deployed with "Anyone" access. If it does, re-deploy as a **new** deployment. |

---

## 9. Security Notes

- Anyone who has the Web App URL can read and write data to your sheet.
- Do **not** store sensitive personal information (Aadhaar, phone numbers, etc.) in the demo sheet.
- This setup is intended for **educational demonstration** only.
- Your AI API key is never exposed in frontend JavaScript — it stays in the `.env` file on the server.
- The Web App URL itself does not reveal your API key.

---

## 10. Column Reference

Your Google Sheet must have these headers in **row 1** (case-insensitive):

| Column | Header | Type | Example |
|--------|--------|------|---------|
| A | ID | Number | 1 |
| B | Name | Text | Rahul Sharma |
| C | Subject | Text | Artificial Intelligence |
| D | Marks | Number (0–100) | 85 |
| E | Attendance | Number (0–100) | 92 |

The Apps Script reads the first row as headers and converts all subsequent rows into JSON objects automatically.
