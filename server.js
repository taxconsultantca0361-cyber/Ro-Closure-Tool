var express = require('express');
var session = require('express-session');
var bcrypt = require('bcryptjs');
var path = require('path');
var db = require('./database');

var app = express();
var PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));
app.use(session({
  secret: 'ro-closure-2024-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

// ─── Middleware ───────────────────────────────────────────────────────────────
function auth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
function admin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// ─── Pages ────────────────────────────────────────────────────────────────────
app.get('/', function(req,res){ res.sendFile(path.join(__dirname,'public','login.html')); });
app.get('/admin', function(req,res){ res.sendFile(path.join(__dirname,'public','admin.html')); });
app.get('/accountant', function(req,res){ res.sendFile(path.join(__dirname,'public','accountant.html')); });
app.get('/form', function(req,res){ res.sendFile(path.join(__dirname,'public','form.html')); });

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', function(req, res) {
  var u = req.body.username, p = req.body.password;
  if (!u || !p) return res.status(400).json({ error: 'Username and password required' });
  var user = db.accountants.one(function(r) { return r.username === u && r.is_active === 1; });
  if (!user || !bcrypt.compareSync(p, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });
  req.session.user = { id: user.id, name: user.name, username: user.username, role: user.role };
  res.json(req.session.user);
});

app.post('/api/auth/logout', function(req, res) {
  req.session.destroy(function() { res.json({ ok: true }); });
});

app.get('/api/auth/me', function(req, res) {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

// ─── Admin: Accountants ───────────────────────────────────────────────────────
app.get('/api/admin/accountants', admin, function(req, res) {
  var accs = db.accountants.all(function(a) { return a.role !== 'admin'; });
  var ros = db.ros.all({ is_active: 1 });
  accs = accs.map(function(a) {
    var count = ros.filter(function(r) { return r.accountant_id === a.id; }).length;
    return Object.assign({}, a, { ro_count: count });
  });
  accs.sort(function(a,b) { return a.name.localeCompare(b.name); });
  res.json(accs);
});

app.post('/api/admin/accountants', admin, function(req, res) {
  var name = req.body.name, username = req.body.username, password = req.body.password;
  if (!name || !username || !password) return res.status(400).json({ error: 'name, username, password required' });
  if (db.accountants.one({ username: username })) return res.status(400).json({ error: 'Username already exists' });
  var rec = db.accountants.insert({ name: name, username: username, password_hash: bcrypt.hashSync(password, 10), role: 'accountant', is_active: 1 });
  res.json({ id: rec.id, name: name, username: username });
});

app.put('/api/admin/accountants/:id', admin, function(req, res) {
  var id = parseInt(req.params.id);
  var a = db.accountants.one({ id: id });
  if (!a) return res.status(404).json({ error: 'Not found' });
  var changes = {};
  if (req.body.name !== undefined) changes.name = req.body.name;
  if (req.body.username !== undefined) changes.username = req.body.username;
  if (req.body.is_active !== undefined) changes.is_active = req.body.is_active;
  if (req.body.password) changes.password_hash = bcrypt.hashSync(req.body.password, 10);
  db.accountants.update({ id: id }, changes);
  res.json({ ok: true });
});

app.delete('/api/admin/accountants/:id', admin, function(req, res) {
  db.accountants.update({ id: parseInt(req.params.id) }, { is_active: 0 });
  res.json({ ok: true });
});

// ─── Admin: ROs ───────────────────────────────────────────────────────────────
app.get('/api/admin/ros', admin, function(req, res) {
  var ros = db.ros.all({ is_active: 1 });
  var items = db.ro_items.all({ is_active: 1 });
  var accs = db.accountants.all();
  var accMap = {};
  accs.forEach(function(a) { accMap[a.id] = a.name; });
  ros = ros.map(function(r) {
    var cnt = items.filter(function(i) { return i.ro_id === r.id; }).length;
    return Object.assign({}, r, { accountant_name: accMap[r.accountant_id] || null, item_count: cnt });
  });
  ros.sort(function(a,b) { return a.ro_name.localeCompare(b.ro_name); });
  res.json(ros);
});

app.post('/api/admin/ros', admin, function(req, res) {
  if (!req.body.ro_name || !req.body.accountant_id) return res.status(400).json({ error: 'ro_name, accountant_id required' });
  var ro = db.ros.insert({ ro_name: req.body.ro_name, state: req.body.state || null, accountant_id: parseInt(req.body.accountant_id), is_active: 1 });
  res.json({ id: ro.id });
});

app.put('/api/admin/ros/:id', admin, function(req, res) {
  var id = parseInt(req.params.id);
  var ro = db.ros.one({ id: id });
  if (!ro) return res.status(404).json({ error: 'Not found' });
  var changes = {};
  if (req.body.ro_name !== undefined) changes.ro_name = req.body.ro_name;
  if (req.body.state !== undefined) changes.state = req.body.state;
  if (req.body.accountant_id !== undefined) changes.accountant_id = req.body.accountant_id ? parseInt(req.body.accountant_id) : null;
  db.ros.update({ id: id }, changes);
  res.json({ ok: true });
});

app.delete('/api/admin/ros/:id', admin, function(req, res) {
  db.ros.update({ id: parseInt(req.params.id) }, { is_active: 0 });
  res.json({ ok: true });
});

// ─── Admin: RO Items ──────────────────────────────────────────────────────────
app.get('/api/admin/ros/:id/items', admin, function(req, res) {
  var id = parseInt(req.params.id);
  var items = db.ro_items.all(function(i) { return i.ro_id === id && i.is_active === 1; });
  items.sort(function(a,b) { return a.item_type.localeCompare(b.item_type) || a.display_order - b.display_order; });
  res.json(items);
});

app.post('/api/admin/ros/:id/items', admin, function(req, res) {
  var roId = parseInt(req.params.id);
  if (!req.body.item_name) return res.status(400).json({ error: 'item_name required' });
  var type = req.body.item_type || 'bank';
  var existing = db.ro_items.all(function(i) { return i.ro_id === roId && i.item_type === type && i.is_active === 1; });
  var maxOrder = existing.reduce(function(m,i) { return Math.max(m, i.display_order||0); }, 0);
  var item = db.ro_items.insert({ ro_id: roId, item_name: req.body.item_name, item_type: type, display_order: maxOrder + 1, is_active: 1 });
  res.json({ id: item.id });
});

app.delete('/api/admin/ros/:id/items/:item_id', admin, function(req, res) {
  db.ro_items.update({ id: parseInt(req.params.item_id), ro_id: parseInt(req.params.id) }, { is_active: 0 });
  res.json({ ok: true });
});

// ─── Admin: General Queries ───────────────────────────────────────────────────
app.get('/api/admin/queries', admin, function(req, res) {
  var qs = db.general_queries.all();
  qs.sort(function(a,b) { return a.display_order - b.display_order; });
  res.json(qs);
});

app.post('/api/admin/queries', admin, function(req, res) {
  if (!req.body.query_text) return res.status(400).json({ error: 'query_text required' });
  var all = db.general_queries.all();
  var maxOrder = all.reduce(function(m,q) { return Math.max(m, q.display_order||0); }, 0);
  var q = db.general_queries.insert({ query_text: req.body.query_text, display_order: maxOrder + 1, is_active: 1 });
  res.json({ id: q.id });
});

app.put('/api/admin/queries/:id', admin, function(req, res) {
  var id = parseInt(req.params.id);
  var changes = {};
  if (req.body.query_text !== undefined) changes.query_text = req.body.query_text;
  if (req.body.display_order !== undefined) changes.display_order = req.body.display_order;
  if (req.body.is_active !== undefined) changes.is_active = req.body.is_active;
  db.general_queries.update({ id: id }, changes);
  res.json({ ok: true });
});

app.delete('/api/admin/queries/:id', admin, function(req, res) {
  db.general_queries.update({ id: parseInt(req.params.id) }, { is_active: 0 });
  res.json({ ok: true });
});

// ─── Admin: Dashboard ─────────────────────────────────────────────────────────
app.get('/api/admin/dashboard/:month/:year', admin, function(req, res) {
  var month = parseInt(req.params.month), year = parseInt(req.params.year);
  var accs = db.accountants.all(function(a) { return a.role === 'accountant' && a.is_active === 1; });
  accs.sort(function(a,b) { return a.name.localeCompare(b.name); });
  var allROs = db.ros.all({ is_active: 1 });
  var closures = db.closures.all(function(c) { return c.month === month && c.year === year; });
  var closureMap = {};
  closures.forEach(function(c) { closureMap[c.ro_id] = c; });

  var ros = allROs.map(function(r) {
    var cl = closureMap[r.id];
    return Object.assign({}, r, {
      closure_id: cl ? cl.id : null,
      status: cl ? cl.status : null,
      submitted_at: cl ? cl.submitted_at : null
    });
  });

  var summary = {
    total: ros.length,
    submitted: ros.filter(function(r) { return r.status === 'submitted'; }).length,
    draft: ros.filter(function(r) { return r.status === 'draft'; }).length,
    pending: ros.filter(function(r) { return !r.status; }).length
  };

  res.json({ accountants: accs, ros: ros, summary: summary });
});

// ─── Admin: Reports ───────────────────────────────────────────────────────────
app.get('/api/admin/reports/:month/:year', admin, function(req, res) {
  var month = parseInt(req.params.month), year = parseInt(req.params.year);
  var closures = db.closures.all(function(c) { return c.month === month && c.year === year && c.status === 'submitted'; });
  var ros = db.ros.all(); var accs = db.accountants.all();
  var rosMap = {}; ros.forEach(function(r) { rosMap[r.id] = r; });
  var accMap = {}; accs.forEach(function(a) { accMap[a.id] = a.name; });
  var result = closures.map(function(cl) {
    var answers = db.closure_answers.all({ closure_id: cl.id });
    var ro = rosMap[cl.ro_id] || {};
    return {
      id: cl.id, ro_id: cl.ro_id, ro_name: ro.ro_name, state: ro.state,
      accountant_name: accMap[cl.accountant_id] || '', submitted_at: cl.submitted_at,
      admin_action: cl.admin_action || null, admin_note: cl.admin_note || null,
      admin_at: cl.admin_at || null, resubmit_count: cl.resubmit_count || 0,
      yes_count: answers.filter(function(a) { return a.answer === 'YES'; }).length,
      no_count: answers.filter(function(a) { return a.answer === 'NO'; }).length,
      na_count: answers.filter(function(a) { return a.answer === 'NA'; }).length,
      total_answers: answers.length
    };
  });
  result.sort(function(a,b) { return a.accountant_name.localeCompare(b.accountant_name) || a.ro_name.localeCompare(b.ro_name); });
  res.json(result);
});

app.get('/api/admin/closure/:closure_id/detail', admin, function(req, res) {
  var cid = parseInt(req.params.closure_id);
  var cl = db.closures.one({ id: cid });
  if (!cl) return res.status(404).json({ error: 'Not found' });
  var ro = db.ros.one({ id: cl.ro_id }) || {};
  var acc = db.accountants.one({ id: cl.accountant_id }) || {};
  var banks = db.ro_items.all(function(i) { return i.ro_id === cl.ro_id && i.item_type === 'bank' && i.is_active === 1; });
  var loans = db.ro_items.all(function(i) { return i.ro_id === cl.ro_id && i.item_type === 'loan' && i.is_active === 1; });
  var queries = db.general_queries.all({ is_active: 1 });
  var answers = db.closure_answers.all({ closure_id: cid });
  var answerMap = {};
  answers.forEach(function(a) { answerMap[a.item_type + '_' + a.item_id] = a; });
  banks.sort(function(a,b){return a.display_order-b.display_order;});
  loans.sort(function(a,b){return a.display_order-b.display_order;});
  queries.sort(function(a,b){return a.display_order-b.display_order;});
  res.json({ closure: Object.assign({}, cl, { ro_name: ro.ro_name, state: ro.state, accountant_name: acc.name }), banks: banks, loans: loans, queries: queries, answerMap: answerMap });
});

app.get('/api/admin/performance/:accountant_id', admin, function(req, res) {
  var accId = parseInt(req.params.accountant_id);
  var acc = db.accountants.one({ id: accId });
  if (!acc) return res.status(404).json({ error: 'Not found' });
  var totalROs = db.ros.all(function(r) { return r.accountant_id === accId && r.is_active === 1; }).length;
  var closures = db.closures.all({ accountant_id: accId });
  // Group by year/month
  var byPeriod = {};
  closures.forEach(function(c) {
    var key = c.year + '_' + c.month;
    if (!byPeriod[key]) byPeriod[key] = { month: c.month, year: c.year, total: 0, submitted: 0 };
    byPeriod[key].total++;
    if (c.status === 'submitted') byPeriod[key].submitted++;
  });
  var perf = Object.keys(byPeriod).map(function(k) { return byPeriod[k]; });
  perf.sort(function(a,b) { return b.year - a.year || b.month - a.month; });
  perf = perf.slice(0, 12);
  res.json({ accountant: acc, performance: perf, total_ros: totalROs });
});

// ─── Accountant: ROs ──────────────────────────────────────────────────────────
app.get('/api/accountant/ros', auth, function(req, res) {
  var month = parseInt(req.query.month), year = parseInt(req.query.year);
  var accId = req.session.user.id;
  if (!month || !year) return res.status(400).json({ error: 'month and year required' });
  var ros = db.ros.all(function(r) { return r.accountant_id === accId && r.is_active === 1; });
  var items = db.ro_items.all({ is_active: 1 });
  var closures = db.closures.all(function(c) { return c.accountant_id === accId && c.month === month && c.year === year; });
  var clMap = {};
  closures.forEach(function(c) { clMap[c.ro_id] = c; });
  ros = ros.map(function(r) {
    var cl = clMap[r.id];
    var cnt = items.filter(function(i) { return i.ro_id === r.id; }).length;
    return Object.assign({}, r, {
      closure_id: cl ? cl.id : null,
      status: cl ? cl.status : null,
      submitted_at: cl ? cl.submitted_at : null,
      admin_action: cl ? (cl.admin_action || null) : null,
      admin_note: cl ? (cl.admin_note || null) : null,
      resubmit_count: cl ? (cl.resubmit_count || 0) : 0,
      item_count: cnt
    });
  });
  ros.sort(function(a,b) { return a.ro_name.localeCompare(b.ro_name); });
  res.json(ros);
});

// ─── Accountant: Closure ──────────────────────────────────────────────────────
app.get('/api/accountant/closure/:ro_id/:month/:year', auth, function(req, res) {
  var roId = parseInt(req.params.ro_id), month = parseInt(req.params.month), year = parseInt(req.params.year);
  var accId = req.session.user.id;
  var ro = db.ros.one(function(r) { return r.id === roId && r.accountant_id === accId && r.is_active === 1; });
  if (!ro) return res.status(403).json({ error: 'Access denied' });
  var closure = db.closures.one(function(c) { return c.ro_id === roId && c.month === month && c.year === year; });
  if (!closure) closure = db.closures.insert({ ro_id: roId, accountant_id: accId, month: month, year: year, status: 'draft' });
  var banks = db.ro_items.all(function(i) { return i.ro_id === roId && i.item_type === 'bank' && i.is_active === 1; });
  var loans = db.ro_items.all(function(i) { return i.ro_id === roId && i.item_type === 'loan' && i.is_active === 1; });
  var queries = db.general_queries.all({ is_active: 1 });
  var answers = db.closure_answers.all({ closure_id: closure.id });
  var answerMap = {};
  answers.forEach(function(a) { answerMap[a.item_type + '_' + a.item_id] = a; });
  banks.sort(function(a,b){return a.display_order-b.display_order;});
  loans.sort(function(a,b){return a.display_order-b.display_order;});
  queries.sort(function(a,b){return a.display_order-b.display_order;});
  res.json({ ro: ro, closure: closure, banks: banks, loans: loans, queries: queries, answerMap: answerMap });
});

app.post('/api/accountant/closure/:ro_id/:month/:year/answer', auth, function(req, res) {
  var roId = parseInt(req.params.ro_id), month = parseInt(req.params.month), year = parseInt(req.params.year);
  var accId = req.session.user.id;
  var ro = db.ros.one(function(r) { return r.id === roId && r.accountant_id === accId && r.is_active === 1; });
  if (!ro) return res.status(403).json({ error: 'Access denied' });
  var closure = db.closures.one(function(c) { return c.ro_id === roId && c.month === month && c.year === year; });
  if (!closure) return res.status(404).json({ error: 'Closure not found' });
  if (closure.status === 'submitted') return res.status(400).json({ error: 'Already submitted' });
  var iType = req.body.item_type, iId = parseInt(req.body.item_id);
  var answer = req.body.answer, remark = req.body.remark || null;
  var existing = db.closure_answers.one(function(a) { return a.closure_id === closure.id && a.item_type === iType && a.item_id === iId; });
  if (existing) {
    db.closure_answers.update({ id: existing.id }, { answer: answer, remark: remark });
  } else {
    db.closure_answers.insert({ closure_id: closure.id, item_type: iType, item_id: iId, answer: answer, remark: remark });
  }
  res.json({ ok: true });
});

app.post('/api/accountant/closure/:ro_id/:month/:year/submit', auth, function(req, res) {
  var roId = parseInt(req.params.ro_id), month = parseInt(req.params.month), year = parseInt(req.params.year);
  var accId = req.session.user.id;
  var ro = db.ros.one(function(r) { return r.id === roId && r.accountant_id === accId && r.is_active === 1; });
  if (!ro) return res.status(403).json({ error: 'Access denied' });
  var closure = db.closures.one(function(c) { return c.ro_id === roId && c.month === month && c.year === year; });
  if (!closure) return res.status(404).json({ error: 'Closure not found' });
  if (closure.status === 'submitted') return res.status(400).json({ error: 'Already submitted' });

  var banks = db.ro_items.all(function(i) { return i.ro_id === roId && i.item_type === 'bank' && i.is_active === 1; });
  var loans = db.ro_items.all(function(i) { return i.ro_id === roId && i.item_type === 'loan' && i.is_active === 1; });
  var queries = db.general_queries.all({ is_active: 1 });
  var answers = db.closure_answers.all({ closure_id: closure.id });
  var ansMap = {};
  answers.forEach(function(a) { ansMap[a.item_type + '_' + a.item_id] = a; });

  var missing = [];
  banks.forEach(function(b) { if (!ansMap['bank_' + b.id] || !ansMap['bank_' + b.id].answer) missing.push('Bank: ' + b.item_name); });
  loans.forEach(function(l) { if (!ansMap['loan_' + l.id] || !ansMap['loan_' + l.id].answer) missing.push('Loan: ' + l.item_name); });
  queries.forEach(function(q) { if (!ansMap['query_' + q.id] || !ansMap['query_' + q.id].answer) missing.push('Query: ' + q.query_text); });

  if (missing.length > 0) return res.status(400).json({ error: 'Unanswered questions', missing: missing });

  db.closures.update({ id: closure.id }, { status: 'submitted', submitted_at: db.now(), admin_action: null, admin_note: null, admin_at: null });
  res.json({ ok: true });
});

// ─── Admin: Deadline Settings ────────────────────────────────────────────────
app.get('/api/admin/settings/deadline/:month/:year', auth, function(req, res) {
  var month = parseInt(req.params.month), year = parseInt(req.params.year);
  var s = db.settings.one({ key: 'deadline_' + year + '_' + month });
  res.json({ deadline: s ? s.value : null });
});

app.post('/api/admin/settings/deadline', admin, function(req, res) {
  var month = parseInt(req.body.month), year = parseInt(req.body.year), date = req.body.date;
  if (!month || !year || !date) return res.status(400).json({ error: 'month, year, date required' });
  var key = 'deadline_' + year + '_' + month;
  var existing = db.settings.one({ key: key });
  if (existing) db.settings.update({ key: key }, { value: date });
  else db.settings.insert({ key: key, value: date });
  res.json({ ok: true });
});

// ─── Admin: Closure Actions ──────────────────────────────────────────────────
app.post('/api/admin/closure/:closure_id/reopen', admin, function(req, res) {
  var cid = parseInt(req.params.closure_id);
  var cl = db.closures.one({ id: cid });
  if (!cl) return res.status(404).json({ error: 'Not found' });
  db.closures.update({ id: cid }, { status: 'draft', submitted_at: null, admin_action: null, admin_note: null, resubmit_count: (cl.resubmit_count || 0) + 1 });
  res.json({ ok: true });
});

app.post('/api/admin/closure/:closure_id/approve', admin, function(req, res) {
  var cid = parseInt(req.params.closure_id);
  var cl = db.closures.one({ id: cid });
  if (!cl) return res.status(404).json({ error: 'Not found' });
  if (cl.status !== 'submitted') return res.status(400).json({ error: 'Not in submitted state' });
  db.closures.update({ id: cid }, { admin_action: 'approved', admin_note: req.body.note || null, admin_at: db.now() });
  res.json({ ok: true });
});

app.post('/api/admin/closure/:closure_id/reject', admin, function(req, res) {
  var cid = parseInt(req.params.closure_id);
  var cl = db.closures.one({ id: cid });
  if (!cl) return res.status(404).json({ error: 'Not found' });
  if (cl.status !== 'submitted') return res.status(400).json({ error: 'Not in submitted state' });
  db.closures.update({ id: cid }, { status: 'draft', submitted_at: null, admin_action: 'rejected', admin_note: req.body.note || null, admin_at: db.now() });
  res.json({ ok: true });
});

// ─── Accountant: Cancel Submission ──────────────────────────────────────────
app.post('/api/accountant/closure/:ro_id/:month/:year/cancel', auth, function(req, res) {
  var roId = parseInt(req.params.ro_id), month = parseInt(req.params.month), year = parseInt(req.params.year);
  var accId = req.session.user.id;
  var ro = db.ros.one(function(r) { return r.id === roId && r.accountant_id === accId && r.is_active === 1; });
  if (!ro) return res.status(403).json({ error: 'Access denied' });
  var closure = db.closures.one(function(c) { return c.ro_id === roId && c.month === month && c.year === year; });
  if (!closure) return res.status(404).json({ error: 'Closure not found' });
  if (closure.status !== 'submitted') return res.status(400).json({ error: 'Not submitted' });
  if (closure.admin_action === 'approved') return res.status(400).json({ error: 'Already approved by admin, cannot cancel' });
  db.closures.update({ id: closure.id }, { status: 'draft', submitted_at: null, admin_action: null, admin_note: null, resubmit_count: (closure.resubmit_count || 0) + 1 });
  res.json({ ok: true });
});

// ─── Admin: Performer of Month ────────────────────────────────────────────────
app.get('/api/admin/performer/:month/:year', admin, function(req, res) {
  var month = parseInt(req.params.month), year = parseInt(req.params.year);
  var setting = db.settings.one({ key: 'deadline_' + year + '_' + month });
  var deadline = setting ? new Date(setting.value + 'T23:59:59') : null;
  var accs = db.accountants.all(function(a) { return a.role === 'accountant' && a.is_active === 1; });
  var allROs = db.ros.all({ is_active: 1 });
  var closures = db.closures.all(function(c) { return c.month === month && c.year === year; });
  var closureMap = {};
  closures.forEach(function(c) { closureMap[c.ro_id] = c; });

  var rankings = accs.map(function(acc) {
    var myROs = allROs.filter(function(r) { return r.accountant_id === acc.id; });
    var total = myROs.length;
    if (!total) return null;
    var submitted = 0, onTime = 0, totalDaysEarly = 0;
    myROs.forEach(function(ro) {
      var cl = closureMap[ro.id];
      if (cl && (cl.status === 'submitted' || cl.admin_action === 'approved')) {
        submitted++;
        if (deadline && cl.submitted_at) {
          var subDate = new Date(cl.submitted_at);
          if (subDate <= deadline) {
            onTime++;
            totalDaysEarly += (deadline - subDate) / (1000 * 60 * 60 * 24);
          }
        } else { onTime++; totalDaysEarly += 3; }
      }
    });
    var completionRate = Math.round(submitted / total * 100);
    var avgDaysEarly = onTime ? Math.round(totalDaysEarly / onTime * 10) / 10 : 0;
    return { id: acc.id, name: acc.name, total_ros: total, submitted: submitted, on_time: onTime, completion_rate: completionRate, avg_days_early: avgDaysEarly };
  }).filter(Boolean);

  rankings.sort(function(a, b) {
    if (b.completion_rate !== a.completion_rate) return b.completion_rate - a.completion_rate;
    return b.avg_days_early - a.avg_days_early;
  });
  res.json({ month: month, year: year, deadline: setting ? setting.value : null, rankings: rankings });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, function() {
  console.log('');
  console.log('  RO Closure Tool running at http://localhost:' + PORT);
  console.log('  Admin login: admin / admin123');
  console.log('  Accountant default password: changeme');
  console.log('');
});
