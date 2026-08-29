# 📗 Live Sync Guide: OneDrive & Microsoft Excel Online

This guide explains how to connect your live **OneDrive Excel Spreadsheet** (`https://1drv.ms/x/c/d6a6de7ecb895cc2/IQBTnMmEf4U-ToxGVhUyASaAAYfNABAozRQL9DTIkSp3ZbI?e=57AZVl`) to the VVLF Form backend so every submission adds a row in real time.

---

## ⚡ Method 1: Instant Real-Time Sync via Power Automate (Recommended)

Microsoft provides **Power Automate** (free with Microsoft accounts) to instantly insert rows into any OneDrive / Excel Online workbook whenever an HTTP webhook is called.

### Step 1: Create the Table in your Excel Sheet
1. Open your Excel sheet on OneDrive.
2. Add your column headers in Row 1:
   `Submission Time`, `Full Name`, `College`, `Department`, `Current Year`, `WhatsApp`, `Email`, `Track`, `Tools`, `Focus`, `Portfolio Link`, `Primary Goal`, `Workstation`, `Consent`
3. Select your header row and row 2, then press `Ctrl + T` (or click **Insert** → **Table**) to convert it to an Excel Table. Name it `ApplicationsTable`.

---

### Step 2: Create the Power Automate Flow (2 Minutes)
1. Open [make.powerautomate.com](https://make.powerautomate.com) and sign in with the same Microsoft account that owns the Excel file.
2. Click **+ Create** → **Instant cloud flow** (or choose **Automated cloud flow**).
3. Choose the trigger: **When an HTTP request is received**.
4. In the "Request Body JSON Schema" box, paste this exact schema:

```json
{
  "type": "object",
  "properties": {
    "submittedAt": { "type": "string" },
    "fullName": { "type": "string" },
    "college": { "type": "string" },
    "department": { "type": "string" },
    "studyYear": { "type": "string" },
    "whatsapp": { "type": "string" },
    "email": { "type": "string" },
    "track": { "type": "string" },
    "tools": { "type": "string" },
    "focus": { "type": "string" },
    "portfolioLink": { "type": "string" },
    "goal": { "type": "string" },
    "workstation": { "type": "string" },
    "consent": { "type": "string" }
  }
}
```

5. Click **+ New Step** → Search for **Excel Online (OneDrive)** → select **Add a row into a table**.
6. Select your parameters:
   * **Location**: `OneDrive`
   * **Document Library**: `OneDrive`
   * **File**: Select your Excel file (`IQBTnMmEf4U-ToxGVhUyASaAAYfNABAozRQL9DTIkSp3ZbI` / your workbook file).
   * **Table**: Select `ApplicationsTable`.
   * **Map Fields**: Match each column to the dynamic fields from the trigger (`Full Name` → `fullName`, `Email` → `email`, etc.).
7. Click **Save**.
8. Click the trigger step ("When an HTTP request is received") and copy the generated **HTTP POST URL**.

---

### Step 3: Add the URL to your project [`.env`](file:///C:/Users/user/.gemini/antigravity-ide/scratch/vvlf-form/.env)

In [`.env`](file:///C:/Users/user/.gemini/antigravity-ide/scratch/vvlf-form/.env), set:
```env
EXCEL_WEBHOOK_URL="https://prod-XX.logic.azure.com:443/workflows/..."
```

Every submission will now instantly write directly to your OneDrive Excel file!

---

## 🔄 Method 2: Dual Sync (Google Sheets + Excel Live Power Query)

If you have already set up Google Apps Script (from [`GOOGLE_SHEETS_SETUP.md`](file:///C:/Users/user/.gemini/antigravity-ide/scratch/vvlf-form/GOOGLE_SHEETS_SETUP.md)):
1. In Google Sheets, go to **File** → **Share** → **Publish to web** → select **CSV** → copy link.
2. In your OneDrive Excel workbook, go to **Data** → **Get Data / From Web** → paste the CSV link.
3. Your OneDrive Excel workbook will stay continuously linked and synced.
