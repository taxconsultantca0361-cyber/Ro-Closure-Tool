RO CLOSURE TOOL — Quick Start
================================

SETUP (first time only):
  1. Install Node.js from https://nodejs.org (LTS version)
  2. Double-click START.BAT — it installs dependencies automatically

DAILY USAGE:
  1. Double-click START.BAT
  2. Browser opens at http://localhost:3000

LOGINS:
  Admin    : username=admin         password=admin123
  Accountants: username=[name]      password=changeme
  (e.g. vipul/changeme, ruhi/changeme, jyoti/changeme ...)

ADMIN CAPABILITIES:
  Dashboard   — See all 102 ROs closure status for any month (color coded)
  Accountants — Add/edit/delete accountants, reset passwords
  RO Mgmt     — Reassign ROs between accountants, manage bank/loan items
  Queries     — Add/remove/reorder general checklist items (apply to all ROs)
  Reports     — Monthly reports with YES/NO/NA counts, 12-month performance

ACCOUNTANT WORKFLOW:
  1. Login with username/password
  2. Select month and year
  3. Click any RO card to open its closure form
  4. Answer YES / NO / NA for each bank account, loan, and checklist item
  5. Add remarks (mandatory if answer is NO)
  6. Answers save automatically as you fill
  7. Click Submit when all questions are answered

NETWORK ACCESS (other computers on same WiFi/LAN):
  Find your IP: open Command Prompt, type: ipconfig
  Others access via: http://[YOUR-IP]:3000

DATA FILE: data/closure.db  (backup this file regularly!)
