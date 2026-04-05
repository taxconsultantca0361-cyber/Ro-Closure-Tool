# RO Monthly Closure Tool

A web-based tool for managing monthly closure submissions across all Regional Offices (ROs).
Accountants fill closure forms online; admin tracks, reviews, approves, and analyses performance.

---

## Folder Structure

```
Ro Closure tool/
├── server.js              — Main Node.js server (all API routes)
├── database.js            — JSON file database engine
├── package.json           — Node.js dependencies
├── ngrok.exe              — Tunnel tool for remote/internet access
├── start.bat              — Start server for LOCAL use only
├── start-with-internet.bat— Start server + ngrok for REMOTE accountants
├── .gitignore             — Git ignore rules (excludes data/ and node_modules/)
├── data/
│   └── closure.json       — ALL data (accountants, ROs, closures, answers)
│                            BACK THIS UP REGULARLY
├── node_modules/          — Installed dependencies (do not edit)
└── public/
    ├── login.html         — Login page
    ├── admin.html         — Admin dashboard
    ├── accountant.html    — Accountant RO list
    ├── form.html          — Closure form (per RO per month)
    ├── css/styles.css     — All styling
    └── js/
        ├── admin-fixed.js — Admin page logic
        ├── accountant.js  — Accountant page logic
        ├── form.js        — Closure form logic
        └── login.js       — Login page logic
```

---

## How to Start

### For LOCAL use only (you on your own computer)
Double-click **`start.bat`**
- Opens at: http://localhost:3000

### For REMOTE accountants (internet access)
Double-click **`start-with-internet.bat`**
- Starts the server AND ngrok tunnel
- Your permanent URL: **https://anastacia-polite-emmalynn.ngrok-free.dev**
- Share this URL with all accountants — it never changes
- Keep the window open while accountants are working
- **Your PC must stay ON and not sleep**

### To Stop
Close the CMD window (or press Ctrl+C)

---

## Login Credentials

| User | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| ADITI | `aditi` | `changeme` |
| AMARJEET | `amarjeet` | `changeme` |
| AMIT | `amit` | `changeme` |
| DILIP | `dilip` | `changeme` |
| JYOTI | `jyoti` | `changeme` |
| KAJAL | `kajal` | `changeme` |
| PRATIK | `pratik` | `changeme` |
| PRITHWI | `prithwi` | `changeme` |
| RADHA | `radha` | `changeme` |
| RONAK | `ronak` | `changeme` |
| RUHI | `ruhi` | `changeme` |
| PUJA | `puja` | `changeme` |
| SWEETY | `sweety` | `changeme` |
| SWETA | `sweta` | `changeme` |
| VIPUL | `vipul` | `changeme` |
| YOGESH | `yogesh` | `changeme` |

> Change accountant passwords via Admin → Accountants → Password button.

---

## Admin Guide

### Dashboard Tab
- Select **Month + Year** → click **Refresh** to see all RO status
- Color-coded badges: Green = Submitted, Yellow = In Progress, Red = Not Started
- Click any green/yellow badge to **view the full closure detail**
- **Performer of Month** button — ranked leaderboard (fair metric: completion rate)

### Submission Deadline Management (bottom of Dashboard)
1. Select the **Month** and **Year**
2. The date auto-fills to the 7th of the following month (change if needed)
3. Click **Save Deadline**
4. Accountants immediately see a countdown banner on their page

### Accountants Tab
- **+ Add Accountant** — create new login
- **Edit** — change name or username
- **Password** — reset password
- **Delete** — deactivates the account (data is preserved)

### RO Management Tab
- **+ Add RO** — add a new RO and assign to accountant
- **Edit** — rename, change state, reassign to different accountant
- **Items** — manage bank accounts and loans for each RO
- **Delete** — removes RO from system

### General Queries Tab
- These checklist items appear on **every RO's closure form**
- Add, remove, reorder, enable/disable as needed

### Reports Tab
- Select Month + Year → **Generate** to see all submitted closures
- Status column: Pending / Approved / Rejected
- **View** — see full closure detail with all answers
  - **Approve** — marks closure as verified
  - **Reject & Return** — sends back to accountant with your note
  - **Reopen** — allows resubmission at any time
- **Reopen** button next to each row (quick access)
- **Print** button for hard copy

### 12-Month Performance Chart
- Select an accountant to see their submission history as a bar chart

---

## Accountant Guide

1. Open the URL shared by admin
2. Login with your username and password
3. Select the **Month** and **Year**
4. You will see all your assigned ROs as cards:
   - **Red** = Not started
   - **Yellow** = In progress
   - **Green** = Submitted
   - **Yellow with warning** = Needs Revision (check admin note in red)
5. Click any card to open its closure form
6. For each bank account, loan, and checklist item — select **YES / NO / NA**
   - If you select NO, a remarks box appears (fill it in)
   - Answers save automatically as you click
7. Click **Submit** when all items are answered
8. To correct a mistake after submitting — click **Cancel Submission** on the card, then reopen and resubmit

---

## Performer of Month — How It's Calculated

Since accountants manage different numbers of ROs (3 to 9), a simple count is unfair.
The metric used is **Completion Rate = submitted ÷ assigned × 100%**

- PRITHWI submits 3/3 = **100%** → ranks above someone who submits 8/9 = 89%
- Tiebreaker: average days before the deadline submitted (rewards early submission)
- The accountant with the highest completion rate wins Performer of Month

---

## Data Backup

All data is stored in a single file: **`data/closure.json`**

**Back this up regularly** — copy it to a USB drive or email it to yourself.
If the file is lost, all closure history is gone.

Suggested backup schedule: After each monthly submission window closes (around 8th of each month).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| CMD window closes immediately | Run `start.bat` again; check Node.js is installed |
| Accountants can't open URL | Make sure `start-with-internet.bat` is running and the CMD window is open |
| URL not working | Re-run `start-with-internet.bat` to restart ngrok |
| "Invalid credentials" on login | Check username spelling (all lowercase). Use admin → Password to reset |
| Forgot admin password | Edit `data/closure.json`, find admin entry, contact IT to reset |
| Form buttons not working | Press Ctrl+Shift+R (hard refresh) in browser to clear cache |
| Port 3000 already in use | The BAT file kills the old process automatically. If it fails, restart your PC |

---

## Technical Notes (for IT reference)

- **Runtime:** Node.js v18+ required
- **Port:** 3000 (local), tunneled via ngrok free plan
- **Database:** Single JSON file (`data/closure.json`) — no SQL, no external DB
- **Sessions:** 8-hour login sessions
- **ngrok domain:** `anastacia-polite-emmalynn.ngrok-free.dev` (permanent, free)
- **GitHub repo:** https://github.com/taxconsultantca0361-cyber/Ro-Closure-Tool

To install dependencies (first time or after re-download):
```
cd "Ro Closure tool"
"C:\Program Files\nodejs\node.exe" -e "require('child_process').execSync('npm install', {stdio:'inherit'})"
```
