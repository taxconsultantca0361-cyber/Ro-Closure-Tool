const fs = require('fs');
const path = require('path');
const base = __dirname;

function mkdirp(p) {
  p.split(path.sep).reduce(function(current, part) {
    if (!part) return path.sep;
    const next = current ? path.join(current, part) : part;
    try { fs.mkdirSync(next); } catch(e) { if (e.code !== 'EEXIST') throw e; }
    return next;
  }, '');
}

function write(rel, content) {
  const fullPath = path.join(base, rel);
  mkdirp(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', rel);
}

// ══════════════════════════════════════════════════════════════════════
// LOGIN.HTML
// ══════════════════════════════════════════════════════════════════════
write('public/login.html', `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>RO Closure Tool – Login</title>
<link rel="stylesheet" href="/css/styles.css">
<style>
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1e3a5f 0%,#2a4f80 100%);}
.login-card{background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:2.5rem 2rem;width:100%;max-width:400px;}
.login-logo{text-align:center;margin-bottom:2rem;}
.login-logo h1{font-size:1.6rem;color:#1e3a5f;font-weight:700;}
.login-logo p{color:#6b7280;font-size:.88rem;margin-top:.25rem;}
.form-group{margin-bottom:1.2rem;}
.form-group label{display:block;font-size:.85rem;font-weight:600;color:#374151;margin-bottom:.4rem;}
.form-group input{width:100%;padding:.65rem .85rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:.95rem;transition:border-color .2s;outline:none;}
.form-group input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12);}
.btn-login{width:100%;padding:.75rem;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;transition:background .2s;margin-top:.5rem;cursor:pointer;}
.btn-login:hover{background:#2a4f80;}
.error-msg{background:#fee2e2;color:#dc2626;padding:.6rem .85rem;border-radius:6px;font-size:.85rem;margin-bottom:1rem;display:none;}
</style>
</head>
<body>
<div class="login-card">
  <div class="login-logo">
    <h1>&#128197; RO Closure Tool</h1>
    <p>Monthly Closure Management System</p>
  </div>
  <div class="error-msg" id="errMsg"></div>
  <form id="loginForm">
    <div class="form-group">
      <label>Username</label>
      <input type="text" id="username" placeholder="Enter username" autocomplete="username" required>
    </div>
    <div class="form-group">
      <label>Password</label>
      <input type="password" id="password" placeholder="Enter password" autocomplete="current-password" required>
    </div>
    <button type="submit" class="btn-login" id="loginBtn">Login</button>
  </form>
</div>
<script src="/js/login.js"></script>
</body>
</html>`);

// ══════════════════════════════════════════════════════════════════════
// ADMIN.HTML
// ══════════════════════════════════════════════════════════════════════
write('public/admin.html', `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Admin – RO Closure Tool</title>
<link rel="stylesheet" href="/css/styles.css">
</head>
<body>
<header class="topbar">
  <div class="container topbar-inner">
    <div class="topbar-brand">&#128197; RO Closure Tool</div>
    <div class="topbar-right">
      <span id="adminName" class="topbar-user"></span>
      <span class="topbar-role">Admin</span>
      <button class="btn btn-sm btn-outline-light" onclick="logout()">Logout</button>
    </div>
  </div>
</header>
<div class="container page-content">
  <div class="tabs">
    <button class="tab-btn active" data-tab="dashboard">&#128200; Dashboard</button>
    <button class="tab-btn" data-tab="accountants">&#128100; Accountants</button>
    <button class="tab-btn" data-tab="ros">&#127978; RO Management</button>
    <button class="tab-btn" data-tab="queries">&#10003; General Queries</button>
    <button class="tab-btn" data-tab="reports">&#128202; Reports</button>
  </div>

  <div class="tab-content active" id="tab-dashboard">
    <div class="card">
      <div class="card-header flex-between">
        <h2>Monthly Closure Status</h2>
        <div class="flex gap-sm align-center">
          <select id="dashMonth" class="input-sm"></select>
          <select id="dashYear" class="input-sm"></select>
          <button class="btn btn-primary btn-sm" onclick="loadDashboard()">Refresh</button>
        </div>
      </div>
      <div class="card-body">
        <div class="summary-cards" id="summaryCards"></div>
        <div id="dashboardTable" style="overflow-x:auto;margin-top:1rem"></div>
      </div>
    </div>
  </div>

  <div class="tab-content" id="tab-accountants">
    <div class="card">
      <div class="card-header flex-between">
        <h2>Accountants</h2>
        <button class="btn btn-primary btn-sm" onclick="openAddAccountant()">+ Add Accountant</button>
      </div>
      <div class="card-body" style="overflow-x:auto">
        <table class="table" id="accountantsTable">
          <thead><tr><th>#</th><th>Name</th><th>Username</th><th>ROs</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="tab-content" id="tab-ros">
    <div class="card">
      <div class="card-header flex-between">
        <h2>RO Management</h2>
        <button class="btn btn-primary btn-sm" onclick="openAddRO()">+ Add RO</button>
      </div>
      <div class="card-body">
        <input type="text" id="roSearch" class="input-sm" placeholder="Search by name, state, accountant..." oninput="filterROs()" style="width:100%;max-width:350px;margin-bottom:1rem">
        <div style="overflow-x:auto">
          <table class="table" id="rosTable">
            <thead><tr><th>#</th><th>RO Name</th><th>State</th><th>Accountant</th><th>Items</th><th>Actions</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div class="tab-content" id="tab-queries">
    <div class="card">
      <div class="card-header flex-between">
        <h2>General Checklist Queries</h2>
        <button class="btn btn-primary btn-sm" onclick="openAddQuery()">+ Add Query</button>
      </div>
      <div class="card-body">
        <p class="text-muted" style="margin-bottom:1rem">These queries apply to <strong>ALL ROs</strong> for every monthly closure. Add/remove as needed.</p>
        <div style="overflow-x:auto">
          <table class="table" id="queriesTable">
            <thead><tr><th>Order</th><th>Query Text</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div class="tab-content" id="tab-reports">
    <div class="card">
      <div class="card-header flex-between">
        <h2>Monthly Report</h2>
        <div class="flex gap-sm align-center">
          <select id="repMonth" class="input-sm"></select>
          <select id="repYear" class="input-sm"></select>
          <button class="btn btn-primary btn-sm" onclick="loadReport()">Generate</button>
          <button class="btn btn-sm btn-outline" onclick="window.print()">&#128438; Print</button>
        </div>
      </div>
      <div class="card-body" id="reportContent">
        <p class="text-muted">Select a month and click Generate.</p>
      </div>
    </div>
    <div class="card" style="margin-top:1.5rem">
      <div class="card-header flex-between">
        <h2>12-Month Performance Analysis</h2>
        <select id="perfAccountant" class="input-sm" onchange="loadPerformance()">
          <option value="">-- Select Accountant --</option>
        </select>
      </div>
      <div class="card-body" id="perfContent">
        <canvas id="perfChart" style="width:100%;max-height:220px"></canvas>
      </div>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modal" onclick="closeModalOverlay(event)">
  <div class="modal-box" id="modalBox">
    <div class="modal-header">
      <h3 id="modalTitle"></h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body" id="modalBody"></div>
  </div>
</div>

<div id="toast" class="toast"></div>
<script src="/js/admin.js"></script>
</body>
</html>`);

// ══════════════════════════════════════════════════════════════════════
// ACCOUNTANT.HTML
// ══════════════════════════════════════════════════════════════════════
write('public/accountant.html', `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>My ROs – RO Closure Tool</title>
<link rel="stylesheet" href="/css/styles.css">
</head>
<body>
<header class="topbar">
  <div class="container topbar-inner">
    <div class="topbar-brand">&#128197; RO Closure Tool</div>
    <div class="topbar-right">
      <span id="accName" class="topbar-user"></span>
      <button class="btn btn-sm btn-outline-light" onclick="logout()">Logout</button>
    </div>
  </div>
</header>
<div class="container page-content">
  <div class="card">
    <div class="card-header flex-between">
      <div>
        <h2>My Assigned ROs</h2>
        <p class="text-muted" id="progressText" style="margin-top:.25rem"></p>
      </div>
      <div class="flex gap-sm align-center">
        <label class="text-muted" style="font-size:.85rem">Period:</label>
        <select id="accMonth" class="input-sm" onchange="loadROs()"></select>
        <select id="accYear" class="input-sm" onchange="loadROs()"></select>
      </div>
    </div>
    <div class="card-body">
      <div class="ro-grid" id="roGrid"><div class="loading-spinner"></div></div>
    </div>
  </div>
</div>
<div id="toast" class="toast"></div>
<script src="/js/accountant.js"></script>
</body>
</html>`);

// ══════════════════════════════════════════════════════════════════════
// FORM.HTML
// ══════════════════════════════════════════════════════════════════════
write('public/form.html', `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Closure Form – RO Closure Tool</title>
<link rel="stylesheet" href="/css/styles.css">
<style>
.form-topbar{position:sticky;top:0;z-index:100;background:#1e3a5f;color:#fff;padding:.75rem 0;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.form-topbar-inner{display:flex;align-items:center;gap:1rem;}
.form-back{color:#fff;opacity:.8;font-size:1.4rem;text-decoration:none;line-height:1;}
.form-back:hover{opacity:1;text-decoration:none;}
.form-title h2{font-size:1.05rem;font-weight:700;margin:0;}
.form-title p{font-size:.78rem;opacity:.75;margin:0;}
.form-title{flex:1;}
.prog-wrap{background:rgba(255,255,255,.2);border-radius:99px;height:8px;width:140px;min-width:80px;}
.prog-fill{background:#4ade80;border-radius:99px;height:8px;transition:width .3s;}
.prog-label{font-size:.8rem;opacity:.9;white-space:nowrap;}
.form-section{margin-bottom:1.5rem;}
.section-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;padding:.5rem 1.25rem;background:#f3f4f6;border-left:3px solid #2563eb;}
.form-item{padding:1rem 1.25rem;border-bottom:1px solid #f3f4f6;display:flex;align-items:flex-start;gap:1rem;transition:background .15s;}
.form-item:last-child{border-bottom:none;}
.form-item.unanswered{background:#fff8f0;border-left:3px solid #d97706;}
.form-item.ans-yes{border-left:3px solid #16a34a;}
.form-item.ans-no{border-left:3px solid #dc2626;background:#fff8f8;}
.form-item.ans-na{border-left:3px solid #9ca3af;}
.item-num{width:1.8rem;min-width:1.8rem;height:1.8rem;border-radius:50%;background:#e5e7eb;font-size:.72rem;font-weight:700;display:flex;align-items:center;justify-content:center;color:#4b5563;margin-top:.1rem;transition:background .2s,color .2s;}
.item-num.done{background:#16a34a;color:#fff;}
.item-content{flex:1;}
.item-name{font-weight:600;font-size:.92rem;margin-bottom:.6rem;}
.type-badge{font-size:.68rem;font-weight:600;padding:.1rem .45rem;border-radius:99px;margin-left:.4rem;vertical-align:middle;}
.tb-bank{background:#dbeafe;color:#1d4ed8;}
.tb-loan{background:#fce7f3;color:#9d174d;}
.tb-general{background:#f0fdf4;color:#166534;}
.radio-group{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem;}
.radio-opt{display:none;}
.radio-lbl{padding:.32rem .9rem;border-radius:99px;border:1.5px solid #d1d5db;font-size:.83rem;font-weight:600;cursor:pointer;transition:all .15s;}
.radio-lbl:hover{border-color:#2563eb;color:#2563eb;}
.radio-opt:checked + .radio-lbl.lbl-yes{background:#16a34a;color:#fff;border-color:#16a34a;}
.radio-opt:checked + .radio-lbl.lbl-no{background:#dc2626;color:#fff;border-color:#dc2626;}
.radio-opt:checked + .radio-lbl.lbl-na{background:#6b7280;color:#fff;border-color:#6b7280;}
.radio-opt:checked + .radio-lbl.lbl-yes:hover,.radio-opt:checked + .radio-lbl.lbl-no:hover,.radio-opt:checked + .radio-lbl.lbl-na:hover{color:#fff;}
.remark-lbl{font-size:.76rem;color:#6b7280;margin-bottom:.25rem;display:block;}
.remark-ta{width:100%;padding:.45rem .7rem;border:1.5px solid #d1d5db;border-radius:6px;font-size:.84rem;resize:vertical;min-height:54px;transition:border-color .2s;font-family:inherit;}
.remark-ta:focus{outline:none;border-color:#2563eb;}
.remark-ta.req-remark{border-color:#dc2626;background:#fff5f5;}
.sticky-bar{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e5e7eb;padding:.65rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;z-index:100;box-shadow:0 -2px 10px rgba(0,0,0,.08);}
.sub-banner{background:#dcfce7;border:1.5px solid #16a34a;color:#166534;padding:.85rem 1.25rem;border-radius:8px;margin-bottom:1.25rem;font-weight:600;}
.form-body{padding-bottom:5rem;padding-top:1.25rem;}
</style>
</head>
<body>
<div class="form-topbar">
  <div class="container form-topbar-inner">
    <a href="/accountant" class="form-back" title="Back">&#8592;</a>
    <div class="form-title">
      <h2 id="fROName">Loading...</h2>
      <p id="fSubtitle"></p>
    </div>
    <div class="prog-wrap"><div class="prog-fill" id="progBar" style="width:0%"></div></div>
    <span class="prog-label" id="progLabel">0/0</span>
  </div>
</div>
<div class="container form-body">
  <div id="subBanner" class="sub-banner" style="display:none">
    &#10004;&#65039; This closure has been submitted successfully. Read-only view.
    <div style="font-size:.8rem;font-weight:400;margin-top:.2rem" id="subAt"></div>
  </div>
  <div id="formContent"></div>
</div>
<div class="sticky-bar" id="stickyBar">
  <span style="font-size:.84rem;color:#6b7280" id="barProgress"></span>
  <div style="display:flex;gap:.75rem">
    <button class="btn btn-outline btn-sm" onclick="saveDraft()">Save Progress</button>
    <button class="btn btn-primary" id="submitBtn" onclick="submitClosure()">&#10003; Submit Closure</button>
  </div>
</div>
<div id="toast" class="toast"></div>
<script src="/js/form.js"></script>
</body>
</html>`);

// ══════════════════════════════════════════════════════════════════════
// JS: login.js
// ══════════════════════════════════════════════════════════════════════
write('public/js/login.js', `document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('errMsg');
  btn.textContent = 'Logging in...'; btn.disabled = true; err.style.display = 'none';
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    window.location.href = data.role === 'admin' ? '/admin' : '/accountant';
  } catch(e) {
    err.textContent = e.message; err.style.display = 'block';
    btn.textContent = 'Login'; btn.disabled = false;
  }
});`);

// ══════════════════════════════════════════════════════════════════════
// JS: accountant.js
// ══════════════════════════════════════════════════════════════════════
write('public/js/accountant.js', `const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

async function init() {
  const me = await api('/api/auth/me').catch(() => null);
  if (!me) { location.href='/'; return; }
  if (me.role === 'admin') { location.href='/admin'; return; }
  document.getElementById('accName').textContent = me.name;
  const now = new Date();
  const mSel = document.getElementById('accMonth');
  const ySel = document.getElementById('accYear');
  MN.forEach((m,i) => { const o=document.createElement('option'); o.value=i+1; o.textContent=m; if(i+1===now.getMonth()+1) o.selected=true; mSel.appendChild(o); });
  for(let y=now.getFullYear(); y>=now.getFullYear()-2; y--) { const o=document.createElement('option'); o.value=y; o.textContent=y; if(y===now.getFullYear()) o.selected=true; ySel.appendChild(o); }
  loadROs();
}

async function loadROs() {
  const m = document.getElementById('accMonth').value;
  const y = document.getElementById('accYear').value;
  const g = document.getElementById('roGrid');
  g.innerHTML = '<div class="loading-spinner"></div>';
  try {
    const ros = await api('/api/accountant/ros?month='+m+'&year='+y);
    const sub = ros.filter(r=>r.status==='submitted').length;
    const draft = ros.filter(r=>r.status==='draft').length;
    document.getElementById('progressText').textContent = MN[m-1]+' '+y+' — '+sub+'/'+ros.length+' submitted'+(draft?' | '+draft+' in progress':'');
    if (!ros.length) { g.innerHTML='<p class="text-muted" style="padding:1.5rem">No ROs assigned.</p>'; return; }
    g.innerHTML = ros.map(ro => {
      const sc = ro.status==='submitted' ? 'ro-card-submitted' : ro.status==='draft' ? 'ro-card-draft' : 'ro-card-pending';
      const icon = ro.status==='submitted' ? '&#10004;' : ro.status==='draft' ? '&#9201;' : '&#9679;';
      const lbl = ro.status==='submitted' ? 'Submitted' : ro.status==='draft' ? 'In Progress' : 'Not Started';
      const sub2 = ro.submitted_at ? '<div class="roc-time">'+ro.submitted_at+'</div>' : '';
      return '<a href="/form?ro_id='+ro.id+'&month='+m+'&year='+y+'" class="ro-card '+sc+'">' +
        '<div class="roc-name">'+ro.ro_name+'</div>' +
        '<div class="roc-state">'+( ro.state||'')+'</div>' +
        '<div class="roc-status">'+icon+' '+lbl+'</div>'+sub2+'</a>';
    }).join('');
  } catch(e) { g.innerHTML='<p style="color:red;padding:1rem">'+e.message+'</p>'; }
}

async function logout() { await fetch('/api/auth/logout',{method:'POST'}); location.href='/'; }

async function api(url) {
  const r = await fetch(url);
  if (r.status===401) { location.href='/'; throw new Error('Unauthorized'); }
  const d = await r.json();
  if (!r.ok) throw new Error(d.error||'Error');
  return d;
}

init();`);

// ══════════════════════════════════════════════════════════════════════
// JS: form.js
// ══════════════════════════════════════════════════════════════════════
write('public/js/form.js', `const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const P = new URLSearchParams(location.search);
const roId = P.get('ro_id'), month = P.get('month'), year = P.get('year');
let CD = null, submitted = false, saveTimer = null;

async function init() {
  if (!roId||!month||!year) { location.href='/accountant'; return; }
  try {
    CD = await api('/api/accountant/closure/'+roId+'/'+month+'/'+year);
    submitted = CD.closure.status === 'submitted';
    render();
  } catch(e) { document.getElementById('formContent').innerHTML='<p style="color:red;padding:2rem">'+e.message+'</p>'; }
}

function render() {
  const {ro,closure,banks,loans,queries,answerMap} = CD;
  document.getElementById('fROName').textContent = ro.ro_name;
  document.getElementById('fSubtitle').textContent = (ro.state||'')+' | '+MN[month-1]+' '+year+(submitted?' | SUBMITTED':'');
  if (submitted) {
    document.getElementById('subBanner').style.display='block';
    document.getElementById('subAt').textContent = 'Submitted at: '+closure.submitted_at;
    document.getElementById('stickyBar').style.display='none';
  }
  let html='', n=0;
  function section(items, type, title, badgeClass, badgeLabel) {
    if (!items.length) return '';
    let s = '<div class="card form-section"><div class="section-title">'+title+' ('+items.length+')</div>';
    items.forEach(it => {
      n++;
      const key = type+'_'+it.id;
      const ans = answerMap[key]||{};
      s += renderItem(n, it.id, type, type==='query'?it.query_text:it.item_name, badgeClass, badgeLabel, ans);
    });
    return s+'</div>';
  }
  html += section(banks,'bank','&#127974; Bank Accounts','tb-bank','Bank');
  html += section(loans,'loan','&#128179; Loans & Finance','tb-loan','Loan');
  html += section(queries,'query','&#9989; General Checklist','tb-general','Checklist');
  document.getElementById('formContent').innerHTML = html;
  updateProgress();
  if (!submitted) attachListeners();
}

function renderItem(num, itemId, itemType, name, badgeClass, badgeLabel, ans) {
  const dis = submitted?'disabled':'';
  const hasAns = !!ans.answer;
  const ac = hasAns ? 'ans-'+ans.answer.toLowerCase() : 'unanswered';
  const nc = hasAns ? 'done' : '';
  const rid = itemType+'_'+itemId;
  const yc=ans.answer==='YES'?'checked':'', nc2=ans.answer==='NO'?'checked':'', nac=ans.answer==='NA'?'checked':'';
  const rr = ans.answer==='NO'?'req-remark':'';
  return '<div class="form-item '+ac+'" id="item-'+rid+'">'+
    '<div class="item-num '+nc+'">'+num+'</div>'+
    '<div class="item-content">'+
    '<div class="item-name">'+name+' <span class="type-badge '+badgeClass+'">'+badgeLabel+'</span></div>'+
    '<div class="radio-group">'+
    '<input type="radio" class="radio-opt" name="'+rid+'" id="'+rid+'_YES" value="YES" '+yc+' '+dis+'>'+
    '<label class="radio-lbl lbl-yes" for="'+rid+'_YES">YES</label>'+
    '<input type="radio" class="radio-opt" name="'+rid+'" id="'+rid+'_NO" value="NO" '+nc2+' '+dis+'>'+
    '<label class="radio-lbl lbl-no" for="'+rid+'_NO">NO</label>'+
    '<input type="radio" class="radio-opt" name="'+rid+'" id="'+rid+'_NA" value="NA" '+nac+' '+dis+'>'+
    '<label class="radio-lbl lbl-na" for="'+rid+'_NA">NA</label>'+
    '</div>'+
    '<span class="remark-lbl">Remarks'+(ans.answer==='NO'?' <strong style="color:#dc2626">(Required for NO)</strong>':'')+'</span>'+
    '<textarea class="remark-ta '+rr+'" id="rem-'+rid+'" placeholder="Add remarks if needed..." '+dis+'>'+((ans.remark||''))+'</textarea>'+
    '</div></div>';
}

function attachListeners() {
  document.querySelectorAll('.radio-opt').forEach(r => {
    r.addEventListener('change', function() {
      const parts = this.name.split('_');
      const iType=parts[0], iId=parts[1], ans=this.value, rid=this.name;
      const remEl=document.getElementById('rem-'+rid);
      const itemEl=document.getElementById('item-'+rid);
      itemEl.className='form-item ans-'+ans.toLowerCase();
      itemEl.querySelector('.item-num').className='item-num done';
      remEl.className='remark-ta'+(ans==='NO'?' req-remark':'');
      const remLbl = remEl.previousElementSibling;
      remLbl.innerHTML='Remarks'+(ans==='NO'?' <strong style="color:#dc2626">(Required for NO)</strong>':'');
      updateProgress();
      autoSave(iType, iId, ans, remEl.value);
    });
  });
  document.querySelectorAll('.remark-ta').forEach(ta => {
    ta.addEventListener('input', function() {
      const rid=this.id.replace('rem-','');
      clearTimeout(saveTimer);
      saveTimer=setTimeout(()=>{
        const chk=document.querySelector('input[name="'+rid+'"]:checked');
        if(chk) { const p=rid.split('_'); autoSave(p[0],p[1],chk.value,this.value); }
      }, 700);
    });
  });
}

function updateProgress() {
  const names=new Set(), answered=new Set();
  document.querySelectorAll('.radio-opt').forEach(r=>names.add(r.name));
  document.querySelectorAll('.radio-opt:checked').forEach(r=>answered.add(r.name));
  const tot=names.size, done=answered.size;
  const pct=tot>0?Math.round(done/tot*100):0;
  document.getElementById('progBar').style.width=pct+'%';
  document.getElementById('progLabel').textContent=done+'/'+tot;
  document.getElementById('barProgress').textContent=done+' of '+tot+' answered ('+pct+'%)';
}

async function autoSave(iType, iId, answer, remark) {
  try {
    await fetch('/api/accountant/closure/'+roId+'/'+month+'/'+year+'/answer',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({item_type:iType, item_id:parseInt(iId), answer, remark:remark||''})
    });
  } catch(e) {}
}

function saveDraft() { showToast('Progress saved!','success'); }

async function submitClosure() {
  const names=new Set(), answered=new Set();
  document.querySelectorAll('.radio-opt').forEach(r=>names.add(r.name));
  document.querySelectorAll('.radio-opt:checked').forEach(r=>answered.add(r.name));
  const missing=[...names].filter(n=>!answered.has(n));
  if (missing.length) {
    let first=null;
    missing.forEach(rid=>{ const el=document.getElementById('item-'+rid); if(el){el.classList.add('unanswered'); if(!first)first=el;} });
    if(first) first.scrollIntoView({behavior:'smooth',block:'center'});
    showToast(missing.length+' question(s) unanswered!','error'); return;
  }
  let badRem=false;
  document.querySelectorAll('.radio-opt:checked').forEach(r=>{
    if(r.value==='NO'){const ta=document.getElementById('rem-'+r.name); if(ta&&!ta.value.trim()){ta.classList.add('req-remark');badRem=true;}}
  });
  if(badRem){showToast('Remarks required for all NO answers.','error');return;}
  const btn=document.getElementById('submitBtn');
  btn.textContent='Submitting...'; btn.disabled=true;
  try {
    const res=await fetch('/api/accountant/closure/'+roId+'/'+month+'/'+year+'/submit',{method:'POST'});
    const d=await res.json();
    if(!res.ok) throw new Error(d.error||'Submit failed');
    showToast('Submitted successfully!','success');
    setTimeout(()=>location.href='/accountant',1500);
  } catch(e) { showToast(e.message,'error'); btn.textContent='Submit Closure'; btn.disabled=false; }
}

function showToast(msg,type) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show '+(type||'');
  clearTimeout(t._t); t._t=setTimeout(()=>t.className='toast',3500);
}

async function api(url) {
  const r=await fetch(url);
  if(r.status===401){location.href='/';throw new Error('Unauthorized');}
  const d=await r.json();
  if(!r.ok) throw new Error(d.error||'Error');
  return d;
}

init();`);

// ══════════════════════════════════════════════════════════════════════
// JS: admin.js
// ══════════════════════════════════════════════════════════════════════
write('public/js/admin.js', `const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
let allROs=[], allAcc=[];

async function init() {
  const me = await api('/api/auth/me').catch(()=>null);
  if(!me||me.role!=='admin'){location.href='/';return;}
  document.getElementById('adminName').textContent=me.name;
  const now=new Date();
  ['dashMonth','repMonth'].forEach(id=>{
    const s=document.getElementById(id);
    MN.forEach((m,i)=>{const o=document.createElement('option');o.value=i+1;o.textContent=m;if(i+1===now.getMonth()+1)o.selected=true;s.appendChild(o);});
  });
  ['dashYear','repYear'].forEach(id=>{
    const s=document.getElementById(id);
    for(let y=now.getFullYear();y>=now.getFullYear()-3;y--){const o=document.createElement('option');o.value=y;o.textContent=y;if(y===now.getFullYear())o.selected=true;s.appendChild(o);}
  });
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
      if(btn.dataset.tab==='accountants') loadAccountants();
      if(btn.dataset.tab==='ros') loadROsTab();
      if(btn.dataset.tab==='queries') loadQueries();
      if(btn.dataset.tab==='reports') loadAccForPerf();
    });
  });
  loadDashboard();
}

// ── Dashboard ─────────────────────────────────────────────────────────
async function loadDashboard() {
  const m=document.getElementById('dashMonth').value, y=document.getElementById('dashYear').value;
  const sc=document.getElementById('summaryCards'), dt=document.getElementById('dashboardTable');
  sc.innerHTML=dt.innerHTML='<div class="loading-spinner"></div>';
  try {
    const d=await api('/api/admin/dashboard/'+m+'/'+y);
    sc.innerHTML=[['Total ROs',d.summary.total,''],['Submitted',d.summary.submitted,'success'],['In Progress',d.summary.draft,'warning'],['Not Started',d.summary.pending,'danger']]
      .map(([l,v,c])=>'<div class="sum-card '+(c?'sum-card-'+c:'')+'"><div class="sc-val">'+v+'</div><div class="sc-lbl">'+l+'</div></div>').join('');
    const byAcc={};
    d.accountants.forEach(a=>{byAcc[a.id]={acc:a,ros:[]};});
    d.ros.forEach(r=>{if(byAcc[r.accountant_id])byAcc[r.accountant_id].ros.push(r);});
    let html='<table class="table"><thead><tr><th>Accountant</th><th>Progress</th><th>RO Status (click to view)</th></tr></thead><tbody>';
    Object.values(byAcc).forEach(({acc,ros})=>{
      if(!ros.length) return;
      const sub=ros.filter(r=>r.status==='submitted').length;
      const pct=ros.length?Math.round(sub/ros.length*100):0;
      html+='<tr><td><strong>'+acc.name+'</strong><br><small class="text-muted">'+ros.length+' ROs</small></td>';
      html+='<td><div style="background:#e5e7eb;border-radius:99px;height:8px;width:120px"><div style="background:#16a34a;border-radius:99px;height:8px;width:'+pct+'%"></div></div><small>'+sub+'/'+ros.length+'</small></td>';
      html+='<td>'+ros.map(ro=>{
        const bc=ro.status==='submitted'?'badge-success':ro.status==='draft'?'badge-warning':'badge-danger';
        const click=ro.closure_id?' style="cursor:pointer" onclick="viewClosure('+ro.closure_id+')" title="Click to view"':'';
        return '<span class="badge '+bc+'"'+click+'>'+ro.ro_name+'</span> ';
      }).join('')+'</td></tr>';
    });
    html+='</tbody></table>';
    dt.innerHTML=html;
  } catch(e){dt.innerHTML='<p style="color:red">'+e.message+'</p>';}
}

// ── Accountants ────────────────────────────────────────────────────────
async function loadAccountants() {
  allAcc=await api('/api/admin/accountants');
  const tb=document.querySelector('#accountantsTable tbody');
  tb.innerHTML=allAcc.map((a,i)=>'<tr>'+
    '<td>'+(i+1)+'</td><td><strong>'+a.name+'</strong></td><td>'+a.username+'</td><td>'+a.ro_count+'</td>'+
    '<td><span class="badge '+(a.is_active?'badge-success':'badge-danger')+'">'+(a.is_active?'Active':'Inactive')+'</span></td>'+
    '<td class="act-btns">'+
    '<button class="btn btn-xs btn-outline" onclick="editAcc('+a.id+')">Edit</button> '+
    '<button class="btn btn-xs btn-outline" onclick="chgPass('+a.id+',\''+a.name+'\')">Password</button> '+
    '<button class="btn btn-xs btn-danger" onclick="delAcc('+a.id+',\''+a.name+'\')">Delete</button>'+
    '</td></tr>'
  ).join('');
}

function openAddAccountant(){
  modal('Add Accountant',
    fg('Full Name','newAccName','e.g. JOHN DOE')+fg('Username','newAccUser','e.g. john')+fg('Password','newAccPass','Password','password')+
    '<button class="btn btn-primary" onclick="saveNewAcc()">Add</button>');
}
async function saveNewAcc(){
  const n=gv('newAccName'),u=gv('newAccUser').toLowerCase(),p=gv('newAccPass');
  if(!n||!u||!p)return toast('All fields required','error');
  try{await post('/api/admin/accountants',{name:n.toUpperCase(),username:u,password:p});toast('Added!','success');closeModal();loadAccountants();}
  catch(e){toast(e.message,'error');}
}
function editAcc(id){
  const a=allAcc.find(x=>x.id===id);if(!a)return;
  modal('Edit: '+a.name,
    fgv('Full Name','eName',a.name)+fgv('Username','eUser',a.username)+
    '<div class="form-group"><label>Status</label><select class="form-control" id="eActive"><option value="1"'+(a.is_active?' selected':'')+'>Active</option><option value="0"'+(!a.is_active?' selected':'')+'>Inactive</option></select></div>'+
    '<button class="btn btn-primary" onclick="saveEditAcc('+id+')">Save</button>');
}
async function saveEditAcc(id){
  try{await put('/api/admin/accountants/'+id,{name:gv('eName').toUpperCase(),username:gv('eUser').toLowerCase(),is_active:parseInt(gv('eActive'))});toast('Updated!','success');closeModal();loadAccountants();}
  catch(e){toast(e.message,'error');}
}
function chgPass(id,name){
  modal('Change Password: '+name,'<div class="form-group"><label>New Password</label><input type="password" class="form-control" id="nPass" placeholder="Enter new password"></div><button class="btn btn-primary" onclick="savePass('+id+')">Set Password</button>');
}
async function savePass(id){
  const p=gv('nPass');if(!p)return toast('Password required','error');
  try{await put('/api/admin/accountants/'+id,{password:p});toast('Password changed!','success');closeModal();}
  catch(e){toast(e.message,'error');}
}
async function delAcc(id,name){
  if(!confirm('Deactivate accountant: '+name+'?'))return;
  try{await del('/api/admin/accountants/'+id);toast('Deactivated.','success');loadAccountants();}
  catch(e){toast(e.message,'error');}
}

// ── ROs ────────────────────────────────────────────────────────────────
async function loadROsTab(){
  if(!allAcc.length) allAcc=await api('/api/admin/accountants');
  allROs=await api('/api/admin/ros');
  renderROTable(allROs);
}
function renderROTable(list){
  const tb=document.querySelector('#rosTable tbody');
  tb.innerHTML=list.map((r,i)=>'<tr>'+
    '<td>'+(i+1)+'</td><td><strong>'+r.ro_name+'</strong></td><td>'+(r.state||'-')+'</td>'+
    '<td>'+(r.accountant_name||'<em>Unassigned</em>')+'</td><td>'+r.item_count+'</td>'+
    '<td class="act-btns">'+
    '<button class="btn btn-xs btn-outline" onclick="editRO('+r.id+')">Edit</button> '+
    '<button class="btn btn-xs btn-outline" onclick="manageItems('+r.id+',\''+r.ro_name+'\')">Items</button> '+
    '<button class="btn btn-xs btn-danger" onclick="delRO('+r.id+',\''+r.ro_name+'\')">Delete</button>'+
    '</td></tr>'
  ).join('');
}
function filterROs(){
  const q=document.getElementById('roSearch').value.toLowerCase();
  renderROTable(allROs.filter(r=>r.ro_name.toLowerCase().includes(q)||(r.accountant_name||'').toLowerCase().includes(q)||(r.state||'').toLowerCase().includes(q)));
}
function openAddRO(){
  const opts=allAcc.map(a=>'<option value="'+a.id+'">'+a.name+'</option>').join('');
  modal('Add New RO',
    fg('RO Name','nRON','e.g. ABC FUELS')+fg('State','nROS','e.g. ASSAM')+
    '<div class="form-group"><label>Accountant</label><select class="form-control" id="nROA"><option value="">-- Select --</option>'+opts+'</select></div>'+
    '<button class="btn btn-primary" onclick="saveNewRO()">Add RO</button>');
}
async function saveNewRO(){
  const n=gv('nRON'),s=gv('nROS'),a=gv('nROA');
  if(!n||!a)return toast('RO name and accountant required','error');
  try{await post('/api/admin/ros',{ro_name:n.toUpperCase(),state:s,accountant_id:a});toast('RO added!','success');closeModal();loadROsTab();}
  catch(e){toast(e.message,'error');}
}
function editRO(id){
  const r=allROs.find(x=>x.id===id);if(!r)return;
  const opts=allAcc.map(a=>'<option value="'+a.id+'"'+(a.id===r.accountant_id?' selected':'')+'>'+a.name+'</option>').join('');
  modal('Edit RO: '+r.ro_name,
    fgv('RO Name','eRON',r.ro_name)+fgv('State','eROS',r.state||'')+
    '<div class="form-group"><label>Accountant</label><select class="form-control" id="eROA"><option value="">Unassigned</option>'+opts+'</select></div>'+
    '<button class="btn btn-primary" onclick="saveEditRO('+id+')">Save</button>');
}
async function saveEditRO(id){
  try{await put('/api/admin/ros/'+id,{ro_name:gv('eRON').toUpperCase(),state:gv('eROS'),accountant_id:gv('eROA')||null});toast('Updated!','success');closeModal();loadROsTab();}
  catch(e){toast(e.message,'error');}
}
async function manageItems(roId,roName){
  const items=await api('/api/admin/ros/'+roId+'/items');
  const banks=items.filter(i=>i.item_type==='bank'), loans=items.filter(i=>i.item_type==='loan');
  function rows(list){
    if(!list.length) return '<p class="text-muted">None</p>';
    return list.map(it=>'<div style="display:flex;align-items:center;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid #f3f4f6"><span>'+it.item_name+'</span>'+
      '<button class="btn btn-xs btn-danger" onclick="delItem('+roId+','+it.id+',\''+roName+'\')">Remove</button></div>').join('');
  }
  modal('Items: '+roName,
    '<h4 style="margin-bottom:.5rem">&#127974; Banks</h4>'+rows(banks)+
    '<h4 style="margin:.9rem 0 .5rem">&#128179; Loans</h4>'+rows(loans)+
    '<hr style="margin:.9rem 0"><div style="display:flex;gap:.5rem;align-items:center">'+
    '<input class="form-control" id="nItemN" placeholder="Item name" style="flex:1">'+
    '<select class="form-control" id="nItemT" style="width:100px"><option value="bank">Bank</option><option value="loan">Loan</option></select>'+
    '<button class="btn btn-primary btn-sm" onclick="addItem('+roId+',\''+roName+'\')">Add</button></div>');
}
async function addItem(roId,roName){
  const n=gv('nItemN'),t=gv('nItemT');if(!n)return toast('Name required','error');
  try{await post('/api/admin/ros/'+roId+'/items',{item_name:n,item_type:t});toast('Added!','success');manageItems(roId,roName);loadROsTab();}
  catch(e){toast(e.message,'error');}
}
async function delItem(roId,itemId,roName){
  if(!confirm('Remove this item?'))return;
  try{await del('/api/admin/ros/'+roId+'/items/'+itemId);toast('Removed.','success');manageItems(roId,roName);loadROsTab();}
  catch(e){toast(e.message,'error');}
}
async function delRO(id,name){
  if(!confirm('Delete RO: '+name+'?'))return;
  try{await del('/api/admin/ros/'+id);toast('Deleted.','success');loadROsTab();}
  catch(e){toast(e.message,'error');}
}

// ── Queries ─────────────────────────────────────────────────────────────
async function loadQueries(){
  const qs=await api('/api/admin/queries');
  document.querySelector('#queriesTable tbody').innerHTML=qs.map((q,i)=>'<tr'+(q.is_active?'':' style="opacity:.5"')+'>'+
    '<td><button class="btn btn-xs btn-outline" onclick="mvQ('+q.id+','+(q.display_order-1)+')">&#8593;</button> '+
    '<button class="btn btn-xs btn-outline" onclick="mvQ('+q.id+','+(q.display_order+1)+')">&#8595;</button> '+
    '<small>'+q.display_order+'</small></td>'+
    '<td>'+q.query_text+'</td>'+
    '<td><span class="badge '+(q.is_active?'badge-success':'badge-danger')+'">'+(q.is_active?'Active':'Inactive')+'</span></td>'+
    '<td class="act-btns">'+
    '<button class="btn btn-xs btn-outline" onclick="tglQ('+q.id+','+q.is_active+')">'+(q.is_active?'Disable':'Enable')+'</button> '+
    '<button class="btn btn-xs btn-danger" onclick="delQ('+q.id+')">Delete</button></td></tr>'
  ).join('');
}
function openAddQuery(){
  modal('Add General Query','<div class="form-group"><label>Query Text</label><input class="form-control" id="nQT" placeholder="e.g. BALANCE SHEET TALLY"></div><button class="btn btn-primary" onclick="saveQ()">Add</button>');
}
async function saveQ(){
  const t=gv('nQT');if(!t)return toast('Text required','error');
  try{await post('/api/admin/queries',{query_text:t.toUpperCase()});toast('Added!','success');closeModal();loadQueries();}
  catch(e){toast(e.message,'error');}
}
async function mvQ(id,ord){try{await put('/api/admin/queries/'+id,{display_order:ord});loadQueries();}catch(e){toast(e.message,'error');}}
async function tglQ(id,cur){try{await put('/api/admin/queries/'+id,{is_active:cur?0:1});toast('Updated!','success');loadQueries();}catch(e){toast(e.message,'error');}}
async function delQ(id){if(!confirm('Delete query?'))return;try{await del('/api/admin/queries/'+id);toast('Deleted.','success');loadQueries();}catch(e){toast(e.message,'error');}}

// ── Reports ──────────────────────────────────────────────────────────────
async function loadReport(){
  const m=document.getElementById('repMonth').value, y=document.getElementById('repYear').value;
  const c=document.getElementById('reportContent');
  c.innerHTML='<div class="loading-spinner"></div>';
  try{
    const d=await api('/api/admin/reports/'+m+'/'+y);
    if(!d.length){c.innerHTML='<p class="text-muted">No submitted closures for '+MN[m-1]+' '+y+'.</p>';return;}
    let h='<h3 style="margin-bottom:1rem">Report: '+MN[m-1]+' '+y+'</h3>';
    h+='<div style="overflow-x:auto"><table class="table"><thead><tr><th>#</th><th>RO Name</th><th>State</th><th>Accountant</th><th>Submitted At</th><th>YES</th><th>NO</th><th>NA</th><th>Total</th><th></th></tr></thead><tbody>';
    d.forEach((c2,i)=>{
      h+='<tr><td>'+(i+1)+'</td><td><strong>'+c2.ro_name+'</strong></td><td>'+(c2.state||'-')+'</td><td>'+c2.accountant_name+'</td><td style="white-space:nowrap;font-size:.82rem">'+c2.submitted_at+'</td>'+
        '<td><span class="badge badge-success">'+c2.yes_count+'</span></td>'+
        '<td><span class="badge badge-danger">'+c2.no_count+'</span></td>'+
        '<td><span class="badge">'+c2.na_count+'</span></td>'+
        '<td>'+c2.total_answers+'</td>'+
        '<td><button class="btn btn-xs btn-outline" onclick="viewClosure('+c2.id+')">View</button></td></tr>';
    });
    h+='</tbody></table></div>';
    c.innerHTML=h;
  } catch(e){c.innerHTML='<p style="color:red">'+e.message+'</p>';}
}

async function viewClosure(cid){
  try{
    const d=await api('/api/admin/closure/'+cid+'/detail');
    const {closure,banks,loans,queries,answerMap}=d;
    let h='<div style="font-size:.85rem"><p><strong>RO:</strong> '+closure.ro_name+' | <strong>Period:</strong> '+MN[closure.month-1]+' '+closure.year+'</p>'+
      '<p><strong>Accountant:</strong> '+closure.accountant_name+' | <strong>Submitted:</strong> '+(closure.submitted_at||'Not submitted')+'</p>';
    function tbl(items,type,title){
      if(!items.length) return '';
      let s='<h4 style="margin:1rem 0 .5rem">'+title+'</h4><div style="overflow-x:auto"><table class="table table-sm"><thead><tr><th>Item</th><th>Answer</th><th>Remarks</th><th>Time</th></tr></thead><tbody>';
      items.forEach(it=>{
        const ans=answerMap[type+'_'+it.id]||{};
        const bc=ans.answer==='YES'?'badge-success':ans.answer==='NO'?'badge-danger':'badge';
        s+='<tr><td>'+(type==='query'?it.query_text:it.item_name)+'</td>'+
          '<td><span class="badge '+bc+'">'+(ans.answer||'—')+'</span></td>'+
          '<td>'+(ans.remark||'—')+'</td>'+
          '<td style="font-size:.72rem;white-space:nowrap">'+(ans.answered_at||'')+'</td></tr>';
      });
      return s+'</tbody></table></div>';
    }
    h+=tbl(banks,'bank','&#127974; Bank Accounts');
    h+=tbl(loans,'loan','&#128179; Loans');
    h+=tbl(queries,'query','&#9989; General Checklist');
    h+='</div>';
    modal('Closure: '+closure.ro_name+' — '+MN[closure.month-1]+' '+closure.year, h);
  }catch(e){toast(e.message,'error');}
}

async function loadAccForPerf(){
  if(!allAcc.length) allAcc=await api('/api/admin/accountants');
  const s=document.getElementById('perfAccountant');
  allAcc.forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.name;s.appendChild(o);});
}

async function loadPerformance(){
  const id=document.getElementById('perfAccountant').value;
  if(!id) return;
  const c=document.getElementById('perfContent');
  try{
    const d=await api('/api/admin/performance/'+id);
    const perf=[...d.performance].reverse();
    c.innerHTML='<canvas id="perfChart" style="width:100%;max-height:220px"></canvas>';
    if(!perf.length){c.innerHTML+='<p class="text-muted">No data.</p>';return;}
    const cv=document.getElementById('perfChart');
    cv.width=cv.parentElement.offsetWidth||700;
    cv.height=220;
    const ctx=cv.getContext('2d');
    const W=cv.width,H=cv.height,pad={t:25,r:20,b:50,l:40};
    const cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
    const total=d.total_ros||1;
    const bW=Math.min(50,cW/perf.length-6);
    ctx.font='11px system-ui';
    ctx.fillStyle='#374151';
    // Y axis label
    ctx.textAlign='right';
    for(let v=0;v<=total;v+=Math.max(1,Math.floor(total/5))){
      const y=pad.t+cH-(v/total)*cH;
      ctx.fillStyle='#9ca3af';
      ctx.fillText(v,pad.l-5,y+4);
      ctx.strokeStyle='#f3f4f6';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    }
    perf.forEach((p,i)=>{
      const x=pad.l+(i+0.5)*(cW/perf.length);
      const subH=(p.submitted/total)*cH;
      const y=pad.t+cH-subH;
      ctx.fillStyle='#2563eb';
      ctx.fillRect(x-bW/2,y,bW,subH);
      ctx.fillStyle='#374151';ctx.textAlign='center';
      ctx.fillText(p.submitted+'/'+total,x,y-5);
      ctx.fillStyle='#6b7280';
      ctx.fillText(MN[p.month-1].slice(0,3)+' '+String(p.year).slice(2),x,H-pad.b+16);
    });
    ctx.strokeStyle='#d1d5db';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(pad.l,pad.t+cH);ctx.lineTo(W-pad.r,pad.t+cH);ctx.stroke();
  }catch(e){toast(e.message,'error');}
}

// ── Modal ──────────────────────────────────────────────────────────────
function modal(title,body){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').innerHTML=body;
  document.getElementById('modal').classList.add('active');
}
function closeModal(){document.getElementById('modal').classList.remove('active');}
function closeModalOverlay(e){if(e.target===document.getElementById('modal'))closeModal();}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

// ── Utils ──────────────────────────────────────────────────────────────
function gv(id){const e=document.getElementById(id);return e?e.value:'';}
function fg(lbl,id,ph,type='text'){return'<div class="form-group"><label>'+lbl+'</label><input type="'+type+'" class="form-control" id="'+id+'" placeholder="'+ph+'"></div>';}
function fgv(lbl,id,val){return'<div class="form-group"><label>'+lbl+'</label><input class="form-control" id="'+id+'" value="'+val+'"></div>';}
function toast(msg,type){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type||'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='toast',3500);}
async function logout(){await fetch('/api/auth/logout',{method:'POST'});location.href='/';}
async function api(url){const r=await fetch(url);if(r.status===401){location.href='/';throw new Error('Unauthorized');}const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');return d;}
async function post(url,b){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');return d;}
async function put(url,b){const r=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');return d;}
async function del(url){const r=await fetch(url,{method:'DELETE'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');return d;}

init();`);

// ══════════════════════════════════════════════════════════════════════
// CSS ADDITIONS (append to styles.css)
// ══════════════════════════════════════════════════════════════════════
const cssAdditions = `
/* ── Topbar ─────────────────────────────────────────────────── */
.topbar{background:var(--primary);color:#fff;padding:.6rem 0;box-shadow:var(--shadow);}
.topbar-inner{display:flex;align-items:center;justify-content:space-between;}
.topbar-brand{font-size:1.1rem;font-weight:700;letter-spacing:-.01em;}
.topbar-right{display:flex;align-items:center;gap:.75rem;}
.topbar-user{font-size:.88rem;opacity:.9;}
.topbar-role{font-size:.72rem;background:rgba(255,255,255,.15);padding:.15rem .5rem;border-radius:99px;}
.btn-outline-light{background:transparent;border:1.5px solid rgba(255,255,255,.5);color:#fff;padding:.3rem .75rem;border-radius:6px;font-size:.82rem;font-weight:600;}
.btn-outline-light:hover{background:rgba(255,255,255,.1);}

/* ── Tabs ───────────────────────────────────────────────────── */
.tabs{display:flex;gap:.25rem;margin-bottom:1.25rem;background:#fff;padding:.4rem;border-radius:var(--radius);box-shadow:var(--shadow-sm);flex-wrap:wrap;}
.tab-btn{padding:.45rem 1rem;border:none;background:transparent;border-radius:6px;font-size:.88rem;font-weight:500;color:var(--gray-600);cursor:pointer;transition:all .15s;}
.tab-btn:hover{background:var(--gray-100);color:var(--gray-800);}
.tab-btn.active{background:var(--primary);color:#fff;font-weight:600;}
.tab-content{display:none;}
.tab-content.active{display:block;}

/* ── Cards ──────────────────────────────────────────────────── */
.card{background:#fff;border-radius:var(--radius-lg);box-shadow:var(--shadow);overflow:hidden;}
.card-header{padding:1rem 1.25rem;border-bottom:1px solid var(--gray-100);}
.card-header h2{font-size:1.05rem;font-weight:700;color:var(--gray-800);}
.card-body{padding:1.25rem;}
.mt-1{margin-top:1.5rem;}

/* ── Summary Cards ──────────────────────────────────────────── */
.summary-cards{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;}
.sum-card{flex:1;min-width:120px;padding:1rem;background:var(--gray-50);border-radius:var(--radius);text-align:center;border:1.5px solid var(--gray-200);}
.sum-card-success{background:var(--success-light);border-color:#86efac;}
.sum-card-warning{background:var(--warning-light);border-color:#fcd34d;}
.sum-card-danger{background:var(--danger-light);border-color:#fca5a5;}
.sc-val{font-size:1.8rem;font-weight:800;color:var(--gray-800);}
.sc-lbl{font-size:.78rem;color:var(--gray-600);margin-top:.15rem;font-weight:500;}

/* ── Buttons ─────────────────────────────────────────────────── */
.btn{display:inline-flex;align-items:center;gap:.35rem;padding:.45rem 1rem;border-radius:6px;border:none;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .15s;}
.btn-primary{background:var(--accent);color:#fff;}
.btn-primary:hover{background:var(--accent-light);}
.btn-outline{background:transparent;border:1.5px solid var(--gray-300);color:var(--gray-700);}
.btn-outline:hover{border-color:var(--accent);color:var(--accent);}
.btn-danger{background:transparent;border:1.5px solid #fca5a5;color:var(--danger);}
.btn-danger:hover{background:var(--danger);color:#fff;border-color:var(--danger);}
.btn-sm{padding:.3rem .7rem;font-size:.82rem;}
.btn-xs{padding:.2rem .55rem;font-size:.75rem;}

/* ── Tables ──────────────────────────────────────────────────── */
.table{width:100%;border-collapse:collapse;font-size:.88rem;}
.table th{text-align:left;padding:.6rem .75rem;background:var(--gray-50);color:var(--gray-600);font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border-bottom:1.5px solid var(--gray-200);}
.table td{padding:.6rem .75rem;border-bottom:1px solid var(--gray-100);vertical-align:middle;}
.table tr:hover td{background:var(--gray-50);}
.table-sm th,.table-sm td{padding:.4rem .6rem;font-size:.82rem;}
.act-btns{white-space:nowrap;display:flex;gap:.35rem;}

/* ── Badges ──────────────────────────────────────────────────── */
.badge{display:inline-block;padding:.18rem .55rem;border-radius:99px;font-size:.72rem;font-weight:700;background:var(--gray-200);color:var(--gray-700);}
.badge-success{background:var(--success-light);color:#166534;}
.badge-warning{background:var(--warning-light);color:#92400e;}
.badge-danger{background:var(--danger-light);color:#991b1b;}

/* ── Forms ───────────────────────────────────────────────────── */
.form-group{margin-bottom:1rem;}
.form-group label{display:block;font-size:.82rem;font-weight:600;color:var(--gray-700);margin-bottom:.35rem;}
.form-control,.input-sm{border:1.5px solid var(--gray-300);border-radius:6px;padding:.45rem .75rem;font-size:.88rem;width:100%;outline:none;transition:border-color .2s;}
.form-control:focus,.input-sm:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.1);}
.input-sm{width:auto;}

/* ── RO Grid ─────────────────────────────────────────────────── */
.ro-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;}
.ro-card{display:block;padding:1rem;border-radius:var(--radius);border:2px solid var(--gray-200);background:#fff;text-decoration:none;color:var(--gray-800);transition:all .15s;cursor:pointer;}
.ro-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-md);text-decoration:none;}
.roc-name{font-weight:700;font-size:.95rem;margin-bottom:.2rem;}
.roc-state{font-size:.75rem;color:var(--gray-500);margin-bottom:.5rem;}
.roc-status{font-size:.8rem;font-weight:600;}
.roc-time{font-size:.7rem;color:var(--gray-400);margin-top:.3rem;}
.ro-card-submitted{border-color:#86efac;background:#f0fdf4;}
.ro-card-submitted .roc-status{color:var(--success);}
.ro-card-draft{border-color:#fcd34d;background:#fffbeb;}
.ro-card-draft .roc-status{color:var(--warning);}
.ro-card-pending{border-color:#fca5a5;background:#fff8f8;}
.ro-card-pending .roc-status{color:var(--danger);}

/* ── Dashboard RO Badges ─────────────────────────────────────── */
.ro-badge{display:inline-block;padding:.18rem .55rem;border-radius:4px;font-size:.72rem;font-weight:600;margin:.15rem .1rem;}

/* ── Modal ───────────────────────────────────────────────────── */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;padding:2rem;overflow-y:auto;align-items:flex-start;justify-content:center;}
.modal-overlay.active{display:flex;}
.modal-box{background:#fff;border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);width:100%;max-width:700px;max-height:90vh;overflow-y:auto;margin:auto;}
.modal-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid var(--gray-100);position:sticky;top:0;background:#fff;z-index:1;}
.modal-header h3{font-size:1rem;font-weight:700;margin:0;}
.modal-close{background:none;border:none;font-size:1.4rem;color:var(--gray-400);cursor:pointer;line-height:1;padding:.1rem;}
.modal-close:hover{color:var(--gray-700);}
.modal-body{padding:1.25rem;}

/* ── Toast ───────────────────────────────────────────────────── */
.toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(2rem);background:var(--gray-800);color:#fff;padding:.6rem 1.25rem;border-radius:8px;font-size:.88rem;font-weight:500;opacity:0;transition:all .3s;z-index:9999;pointer-events:none;white-space:nowrap;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.toast.success{background:var(--success);}
.toast.error{background:var(--danger);}

/* ── Misc ────────────────────────────────────────────────────── */
.flex{display:flex;}
.flex-between{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;}
.align-center{align-items:center;}
.gap-sm{gap:.5rem;}
.text-muted{color:var(--gray-500);font-size:.85rem;}
.mb-1{margin-bottom:.5rem;}
.loading-spinner{width:36px;height:36px;border:3px solid var(--gray-200);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite;margin:2rem auto;}
@keyframes spin{to{transform:rotate(360deg);}}
.row-inactive{opacity:.6;}
.search-bar{margin-bottom:1rem;}

/* ── Print ───────────────────────────────────────────────────── */
@media print{
  .topbar,.tabs,.btn,.modal-overlay,.toast{display:none!important;}
  .card{box-shadow:none;border:1px solid #ddd;}
  body{background:#fff;}
}
`;

// Append to existing CSS
const existingCSS = fs.readFileSync(path.join(base,'public/css/styles.css'),'utf8');
if (!existingCSS.includes('.topbar{')) {
  fs.appendFileSync(path.join(base,'public/css/styles.css'), cssAdditions, 'utf8');
  console.log('Updated: public/css/styles.css');
}

// ══════════════════════════════════════════════════════════════════════
// start.bat
// ══════════════════════════════════════════════════════════════════════
write('start.bat', `@echo off
title RO Closure Tool
echo.
echo  =============================================
echo   RO Monthly Closure Tool
echo  =============================================
echo   Admin:       admin / admin123
echo   Accountants: [username] / changeme
echo  =============================================
echo.
cd /d "%~dp0"
if not exist node_modules (
    echo Installing dependencies (first time, please wait)...
    npm install
    echo.
)
echo Starting server at http://localhost:3000
echo Press Ctrl+C to stop.
echo.
start "" http://localhost:3000
node server.js
pause`);

// ══════════════════════════════════════════════════════════════════════
// README.txt
// ══════════════════════════════════════════════════════════════════════
write('README.txt', `RO CLOSURE TOOL — Quick Start
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
`);

console.log('\nAll files created! Run: npm install && node server.js');
