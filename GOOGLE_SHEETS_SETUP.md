# 📊 VVLF Form - Google Sheets & Excel Live Sync Integration Guide

This guide explains how to connect your **VVLF Student Application Form** backend directly to a **Live Google Sheet** and stream live data into **Microsoft Excel**.

---

## ⚡ How It Works

1. **Applicant Submits Form** → The backend receives the submission.
2. **Instant Sync** → The backend automatically triggers the **Google Apps Script Webhook**.
3. **Live Google Sheet Update** → A new formatted row is appended in real time.
4. **Live Excel Sync** → Microsoft Excel pulls from the live Google Sheet automatically or can be linked via Power Query / Data Feed.

---

## 🛠️ Step 1: Create the Google Sheet & Apps Script (2 Minutes)

1. Open [Google Sheets](https://sheets.google.com) and click **Blank Spreadsheet**.
2. Rename the sheet to: **`VVLF Student Applications`**.
3. In the top menu, click **Extensions** → **Apps Script**.
4. In the Apps Script editor, delete any starter code in `Code.gs`.
5. Open [`google_apps_script.js`](file:///C:/Users/user/.gemini/antigravity-ide/scratch/vvlf-form/google_apps_script.js) in this project, copy all the code, and paste it into the Apps Script editor.
6. Click the **Save** (💾 disk icon) button.

---

## 🚀 Step 2: Deploy as a Web App

1. In the top right corner of Apps Script, click **Deploy** → **New deployment**.
2. Click the **gear icon (⚙️)** next to "Select type" and choose **Web app**.
3. Fill in the fields:
   * **Description**: `VVLF Form Webhook`
   * **Execute as**: `Me (your Google email)`
   * **Who has access**: `Anyone` *(Crucial so your backend can send submissions without complex OAuth setup)*
4. Click **Deploy**.
5. Click **Authorize access** and choose your Google account (click *Advanced* → *Go to VVLF Form Webhook (unsafe)* if Google displays a warning, then click *Allow*).
6. Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 🔗 Step 3: Add the Webhook URL to `.env`

Open your [`.env`](file:///C:/Users/user/.gemini/antigravity-ide/scratch/vvlf-form/.env) file and add your URL:

```env
GOOGLE_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
```

---

## 📈 Step 4: Connecting Live to Microsoft Excel

You can connect your live Google Sheet to Microsoft Excel in two ways:

### Method A: Live Power Query Data Connection in Excel (Recommended)
1. In your Google Sheet, go to **File** → **Share** → **Publish to web**.
2. Under "Link", choose **Entire Document** (or Sheet 1) and format **Comma-separated values (.csv)**. Click **Publish**.
3. Copy the generated CSV link.
4. Open **Microsoft Excel** (Desktop or Office 365).
5. Go to the **Data** tab → **From Web** (or *Get Data* → *From Other Sources* → *From Web*).
6. Paste the CSV URL and click **OK** / **Load**.
7. In Excel, set **Data** → **Refresh All** (or set automatic refresh interval every 5 minutes in Connection Properties). Every time a form is submitted, Excel updates!

### Method B: Direct Export
1. In Google Sheets, click **File** → **Download** → **Microsoft Excel (.xlsx)** whenever you want a snapshot file.

---

## 📝 Columns Captured in the Live Spreadsheet

| # | Column Header | Description |
|---|---|---|
| 1 | **Submission Time (IST)** | Formatted Indian Standard Time timestamp |
| 2 | **Full Name** | Applicant's name |
| 3 | **College / University** | College name |
| 4 | **Department / Branch** | Branch (e.g., CSE, ECE) |
| 5 | **Current Year** | 1st, 2nd, 3rd, or 4th Year |
| 6 | **WhatsApp Number** | Mobile contact |
| 7 | **Email Address** | Email contact |
| 8 | **Chosen Track** | Design & Visuals, Tech & Web, Video & Media, etc. |
| 9 | **Tools & Capabilities** | Selected tools (comma-separated) |
| 10 | **Focus / Working Approach**| Response to track-specific prompt |
| 11 | **Portfolio / Project Link**| Provided URL or N/A |
| 12 | **Primary Goal** | Chosen goal / learning outcome |
| 13 | **Workstation Access** | Personal laptop or campus system |
| 14 | **Consent Confirmed** | Yes / No confirmation |
