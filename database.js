// Pure JavaScript JSON file database — works with Node.js 6+
var fs = require('fs');
var path = require('path');
var bcrypt = require('bcryptjs');

var dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
try { fs.mkdirSync(dataDir); } catch(e) { if (e.code !== 'EEXIST') throw e; }

var DB_FILE = path.join(dataDir, 'closure.json');

var _state = null;

function load() {
  if (_state) return _state;
  try {
    _state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    // Migrations: add new tables if missing
    if (!_state.settings) { _state.settings = []; save(); }
  } catch(e) {
    _state = {
      accountants: [], ros: [], ro_items: [],
      general_queries: [], closures: [], closure_answers: [],
      settings: [], seq: {}
    };
    save();
  }
  return _state;
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(_state, null, 2));
}

function nextId(tbl) {
  var s = load();
  if (!s.seq[tbl]) s.seq[tbl] = 0;
  s.seq[tbl]++;
  return s.seq[tbl];
}

function nowStr() {
  var d = new Date();
  function p(n) { return n < 10 ? '0' + n : String(n); }
  return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) + ' ' +
    p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

// ─── Generic table helpers ────────────────────────────────────────────────────
function match(row, filter) {
  if (!filter) return true;
  if (typeof filter === 'function') return filter(row);
  return Object.keys(filter).every(function(k) { return row[k] === filter[k]; });
}

var db = {
  // Get full state (for direct access)
  state: function() { return load(); },
  save: save,
  now: nowStr,

  // ── accountants ─────────────────────────────────────────────────────────────
  accountants: {
    all: function(filter) { return load().accountants.filter(function(r) { return match(r, filter); }); },
    one: function(filter) { var s = load().accountants.filter(function(r) { return match(r, filter); }); return s[0] || null; },
    insert: function(data) {
      var s = load();
      data.id = nextId('accountants');
      data.created_at = nowStr();
      s.accountants.push(data);
      save();
      return data;
    },
    update: function(filter, changes) {
      var s = load();
      s.accountants.forEach(function(r) {
        if (match(r, filter)) Object.keys(changes).forEach(function(k) { r[k] = changes[k]; });
      });
      save();
    }
  },

  // ── ros ──────────────────────────────────────────────────────────────────────
  ros: {
    all: function(filter) { return load().ros.filter(function(r) { return match(r, filter); }); },
    one: function(filter) { var s = load().ros.filter(function(r) { return match(r, filter); }); return s[0] || null; },
    insert: function(data) {
      var s = load();
      data.id = nextId('ros');
      data.created_at = nowStr();
      if (data.is_active === undefined) data.is_active = 1;
      s.ros.push(data);
      save();
      return data;
    },
    update: function(filter, changes) {
      var s = load();
      s.ros.forEach(function(r) {
        if (match(r, filter)) Object.keys(changes).forEach(function(k) { r[k] = changes[k]; });
      });
      save();
    }
  },

  // ── ro_items ─────────────────────────────────────────────────────────────────
  ro_items: {
    all: function(filter) { return load().ro_items.filter(function(r) { return match(r, filter); }); },
    one: function(filter) { var s = load().ro_items.filter(function(r) { return match(r, filter); }); return s[0] || null; },
    insert: function(data) {
      var s = load();
      data.id = nextId('ro_items');
      if (data.is_active === undefined) data.is_active = 1;
      if (data.display_order === undefined) data.display_order = data.id;
      s.ro_items.push(data);
      save();
      return data;
    },
    update: function(filter, changes) {
      var s = load();
      s.ro_items.forEach(function(r) {
        if (match(r, filter)) Object.keys(changes).forEach(function(k) { r[k] = changes[k]; });
      });
      save();
    }
  },

  // ── general_queries ──────────────────────────────────────────────────────────
  general_queries: {
    all: function(filter) { return load().general_queries.filter(function(r) { return match(r, filter); }); },
    one: function(filter) { var s = load().general_queries.filter(function(r) { return match(r, filter); }); return s[0] || null; },
    insert: function(data) {
      var s = load();
      data.id = nextId('general_queries');
      data.created_at = nowStr();
      if (data.is_active === undefined) data.is_active = 1;
      s.general_queries.push(data);
      save();
      return data;
    },
    update: function(filter, changes) {
      var s = load();
      s.general_queries.forEach(function(r) {
        if (match(r, filter)) Object.keys(changes).forEach(function(k) { r[k] = changes[k]; });
      });
      save();
    }
  },

  // ── closures ─────────────────────────────────────────────────────────────────
  closures: {
    all: function(filter) { return load().closures.filter(function(r) { return match(r, filter); }); },
    one: function(filter) { var s = load().closures.filter(function(r) { return match(r, filter); }); return s[0] || null; },
    insert: function(data) {
      var s = load();
      data.id = nextId('closures');
      data.created_at = nowStr();
      if (!data.status) data.status = 'draft';
      s.closures.push(data);
      save();
      return data;
    },
    update: function(filter, changes) {
      var s = load();
      s.closures.forEach(function(r) {
        if (match(r, filter)) Object.keys(changes).forEach(function(k) { r[k] = changes[k]; });
      });
      save();
    }
  },

  // ── settings ─────────────────────────────────────────────────────────────────
  settings: {
    all: function(filter) { return load().settings.filter(function(r) { return match(r, filter); }); },
    one: function(filter) { var s = load().settings.filter(function(r) { return match(r, filter); }); return s[0] || null; },
    insert: function(data) {
      var s = load(); data.id = nextId('settings'); data.created_at = nowStr();
      s.settings.push(data); save(); return data;
    },
    update: function(filter, changes) {
      var s = load();
      s.settings.forEach(function(r) { if (match(r, filter)) Object.keys(changes).forEach(function(k) { r[k] = changes[k]; }); });
      save();
    }
  },

  // ── closure_answers ───────────────────────────────────────────────────────────
  closure_answers: {
    all: function(filter) { return load().closure_answers.filter(function(r) { return match(r, filter); }); },
    one: function(filter) { var s = load().closure_answers.filter(function(r) { return match(r, filter); }); return s[0] || null; },
    insert: function(data) {
      var s = load();
      data.id = nextId('closure_answers');
      data.answered_at = nowStr();
      s.closure_answers.push(data);
      save();
      return data;
    },
    update: function(filter, changes) {
      var s = load();
      s.closure_answers.forEach(function(r) {
        if (match(r, filter)) {
          Object.keys(changes).forEach(function(k) { r[k] = changes[k]; });
          r.answered_at = nowStr();
        }
      });
      save();
    }
  }
};

// ─── Seed initial data (only if empty) ────────────────────────────────────────
if (load().accountants.length === 0) {
  console.log('Seeding initial data...');

  var adminHash = bcrypt.hashSync('admin123', 10);
  var defHash = bcrypt.hashSync('changeme', 10);

  db.accountants.insert({ name: 'Administrator', username: 'admin', password_hash: adminHash, role: 'admin', is_active: 1 });

  function addAcc(name) {
    var username = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return db.accountants.insert({ name: name, username: username, password_hash: defHash, role: 'accountant', is_active: 1 }).id;
  }

  function addRO(name, state, accId, banks, loans) {
    var ro = db.ros.insert({ ro_name: name, state: state, accountant_id: accId, is_active: 1 });
    var order = 1;
    (banks || []).forEach(function(b) { db.ro_items.insert({ ro_id: ro.id, item_name: b, item_type: 'bank', display_order: order++, is_active: 1 }); });
    order = 1;
    (loans || []).forEach(function(l) { db.ro_items.insert({ ro_id: ro.id, item_name: l, item_type: 'loan', display_order: order++, is_active: 1 }); });
    return ro.id;
  }

  // ── VIPUL ──────────────────────────────────────────────────────────────────
  var vipul = addAcc('VIPUL');
  addRO('NES JORABAT','MEGHALAYA',vipul,['AXIS BANK-1097','AXIS BANK','FINO BANK','HDFC BANK','SBI BANK-2647','SBI BANK-NEW TRANSPORT'],['SBI LOAN-3012','TANKER LOAN','HDFC INNOVA LOAN-6584','HOME LOAN (HDFC LOAN)-9913']);
  addRO('ARIHANT','ASSAM',vipul,['AXIS BANK','ICICI BANK-5740','ICICI BANK-5309','PNB BANK OLD-4844','PNB BANK-1599'],['TANKER LOAN','HDFC LOAN A/C NO-4831']);
  addRO('LANKA','ASSAM',vipul,['ICICI BANK-6479','ICICI BANK-1521','SBI BANK-5371'],['TANKER LOAN','HDFC LOAN-54968']);

  // ── RUHI ───────────────────────────────────────────────────────────────────
  var ruhi = addAcc('RUHI');
  addRO('CITY-2','MANIPUR',ruhi,['AXIS BANK','ICICI-7411','SBI-6315','SBI OD'],['TANKER LOAN','HDFC LOAN-0470']);
  addRO('JK REFILL','MANIPUR',ruhi,['SBI BANK-2831'],[]);
  addRO('EMOINU','MANIPUR',ruhi,['AXIS-5388','ICICI-9352','MANIPUR RURAL BANK-1182','SBI NEW-4525','ICICI OD-5639'],[]);
  addRO('AKHAM','MANIPUR',ruhi,['BOB-1461','ICICI-7425','SBI-0517'],['TANKER LOAN','TATA CAPITAL FINANCE-2626']);
  addRO('HEMA','MANIPUR',ruhi,['AXIS-9863','MANIPUR STATE COOPERATIVE-1036','SBI BANK'],[]);
  addRO('NB YASHIKOL','MANIPUR',ruhi,['HDFC BANK-9128'],[]);
  addRO('GAIZON','MANIPUR',ruhi,['MANIPUR RURAL BANK-1182','SBI-8349'],['BPCL CORPUS LOAN']);
  addRO('JIRABAM','MANIPUR',ruhi,['AXIS-2923','ICICI-5257','PNB-1954','SBI-5215','ICICI OD-128'],['TANKER LOAN','ICICI LOAN-9998','ICICI LOAN-6001','BPCL CORPUS LOAN']);
  addRO('NK ENERGY','MANIPUR',ruhi,['AXIS-3683','ICICI-1673','MANIPUR RURAL-1182'],['BPCL CORPUS LOAN']);

  // ── JYOTI ──────────────────────────────────────────────────────────────────
  var jyoti = addAcc('JYOTI');
  addRO('URIPOK','MANIPUR',jyoti,['AXIS-6963','ICICI-7063','PNB-4702','SBI-3308','ICICI EDFS'],['TANKER LOAN','ICICI LOAN-5436','ICICI LOAN-5439','ICICI LOAN-5444','ICICI LOAN-9488','ICICI LOAN-9489']);
  addRO('THOUBAL','MANIPUR',jyoti,['AXIS-7438','HDFC-0173','SBI NEW-8108','SBI EDFC-2621'],['TANKER LOAN','ICICI LOAN-1689','ICICI LOAN-1690']);
  addRO('KAOMACHA','MANIPUR',jyoti,['AXIS-9211','SBI-8117','SBI EDFS-0207'],[]);
  addRO('NH-39','MANIPUR',jyoti,['ICICI NEW-0863','SBI-2984','SBI EDFS-2189'],[]);
  addRO('24*7','MANIPUR',jyoti,['SBI-7489','SBI EDFS-4348','SBI BANK'],[]);
  addRO('CITY-3','MANIPUR',jyoti,['AXIS-6081','HDFC-2240','ICICI CURRENT-4181','IOB-1237','SBI BANK','ICICI NEW-1353','ICICI NEW OD-6373'],['TANKER LOAN','ICICI LOAN-3367','ICICI LOAN-0024','ICICI LOAN-5898','ICICI LOAN-5902']);

  // ── PRATIK ─────────────────────────────────────────────────────────────────
  var pratik = addAcc('PRATIK');
  addRO('RANGATARI','MEGHALAYA',pratik,['SBI BANK'],[]);
  addRO('RATACHERA','MEGHALAYA',pratik,['HDFC BANK','SBI BANK'],['SBI BANK LOAN']);
  addRO('MENDIPATHAR','MEGHALAYA',pratik,['SBI BANK'],[]);
  addRO('POLO HP','MEGHALAYA',pratik,['SBI BANK','SBI WILDAMARY','UBI WILDAMARY'],[]);
  addRO('POLO IOCL','MEGHALAYA',pratik,['HDFC BANK','HDFC BANK NEW','SBI BANK NEW'],[]);
  addRO('ITANAGAR','ARUNACHAL PRADESH',pratik,['BANDHAN BANK','ICICI BANK','SBI BANK'],['ICICI BANK LOAN','BPCL CORPUS FUND LOAN']);
  addRO('AK','ARUNACHAL PRADESH',pratik,['BANDHAN BANK','ICICI BANK','SBI BANK','ICICI BANK OD'],['TANKER LOAN','TATA MOTOR FINANCE']);

  // ── RADHA ──────────────────────────────────────────────────────────────────
  var radha = addAcc('RADHA');
  addRO('SHREE','ASSAM',radha,['AXIS BANK','CBI BANK','STATE BANK OF INDIA NEW'],[]);
  addRO('KAMALPUR','ASSAM',radha,['ICICI-7544','ICICI-5307','SBI NEW-7901'],[]);
  addRO('TANJ','ASSAM',radha,['CBI NEW-9287','PNB-5468'],[]);
  addRO('DULIAJAN','ASSAM',radha,['ICICI-8499','ICICI-0260','ICICI-1468'],[]);
  addRO('UMRANGSO','ASSAM',radha,['BOI BANK','PNB BANK','SBI BANK'],[]);

  // ── PUJA ───────────────────────────────────────────────────────────────────
  var puja = addAcc('PUJA');
  addRO('ASHALATA','ASSAM',puja,['ASSAM GRAMIN VIKAS BANK','AXIS BANK','PNB-4587'],[]);
  addRO('BOGAI','ASSAM',puja,['AXIS-3914','ICICI-5271','PNB BANK','PNB(UBI)BANK'],['ICICI-6076 LOAN A/C']);
  addRO('BOGAI-ADHOC','ASSAM',puja,['PNB BANK','SBI BANK'],[]);
  addRO('DHUPGURI','ASSAM',puja,['ICICI-5329','PNB-0271','SBI-9244','SBI NEW-0327'],[]);
  addRO('KHATKHATI','ASSAM',puja,['SBI-0080','UBI BANK','YES BANK'],[]);
  addRO('MANTA','ASSAM',puja,['SBI CC A/C-9051'],['SBI LOAN A/C-59195']);
  addRO('LOKHARA','ASSAM',puja,['AXIS-1253','BANDHAN-0117','HDFC-6041','HDFC-8930','PNB BANK BALIRAM SINGH'],[]);

  // ── SWEETY ─────────────────────────────────────────────────────────────────
  var sweety = addAcc('SWEETY');
  addRO('GAISAL','ASSAM',sweety,['PNB BANK','SBI BANK','SWEETA JAIN PNB-9475'],[]);
  addRO('HATWAR','ASSAM',sweety,['AXIS-0285','AXIS BANK SAVING A/C'],[]);
  addRO('ABISA','MEGHALAYA',sweety,['HDFC-8505','SBI ABISHA-5429'],[]);
  addRO('FOOTAMATI','MEGHALAYA',sweety,['SBI BANK'],[]);
  addRO('ONG','NAGALAND',sweety,['HDFC-2861','SBI BANK'],['BPCL CORPUS FUND']);
  addRO('MARCOFED','NAGALAND',sweety,['SBI BANK'],[]);

  // ── SWETA ──────────────────────────────────────────────────────────────────
  var sweta = addAcc('SWETA');
  addRO('YUNIC','ASSAM',sweta,['AXIS BANK-8329'],[]);
  addRO('KOKRAJHAR','ASSAM',sweta,['AXIS-9127','CANARA BANK-0154'],[]);
  addRO('PANERIHAT','ASSAM',sweta,['BANK OF INDIA-0111','SBI NEW'],[]);
  addRO('DAS','ASSAM',sweta,['ICICI-0015','UCO BANK','SBI-3169'],[]);
  addRO('KALITA','ASSAM',sweta,['CENTRAL BANK-1080','CENTRAL BANK OF INDIA-4367'],[]);
  addRO('ROWTA','ASSAM',sweta,['ICICI-7984','SBI-8863','SBI-9139','SBI-6771','UCO BANK'],[]);

  // ── DILIP ──────────────────────────────────────────────────────────────────
  var dilip = addAcc('DILIP');
  addRO('GORLOSA','ASSAM',dilip,['ICICI-0040'],[]);
  addRO('HOJAI','ASSAM',dilip,['HDFC BANK','SBI-7036','UBI-3236'],[]);
  addRO('LANGTING','ASSAM',dilip,['SBI-4089'],[]);
  addRO('MAHABAX','ASSAM',dilip,['PNB BANK','SBI-8459'],[]);
  addRO('DOBOKA','ASSAM',dilip,['BANDHAN-7338','PNB NEW-6897','SBI-9790'],[]);
  addRO('NOGOAN','ASSAM',dilip,['AXIS BANK','BANDHAN BANK','PNB BANK','SBI NEW-4670','SBI NEW-4583'],[]);
  addRO('THAOSEN','ASSAM',dilip,['ASSAM VIKAS GRAMIN-0019','SBI-8573'],[]);
  addRO('NFS','ASSAM',dilip,['AXIS BANK','HDFC NEW-8622'],[]);
  addRO('BARSORA','ASSAM',dilip,['AXIS','HDFC','ICICI','RIDA SBI','SBI NEW RANIKOR'],['TANKER LOAN','ICICI OD','ICICI-LVSL3642','ICICI-LVSL3643','TATA MOTOR CONT-2524']);

  // ── AMARJEET ───────────────────────────────────────────────────────────────
  var amarjeet = addAcc('AMARJEET');
  addRO('SUDAMA','MEGHALAYA',amarjeet,['SBI BANK'],[]);
  addRO('UMRAN','MEGHALAYA',amarjeet,['HDFC-1221','ICICI-0156','SBI-1075'],['BPCL CORPUS FUND LOAN']);
  addRO('HP HALDIAGANJ','MEGHALAYA',amarjeet,['SBI-8984','SBI-9453'],[]);
  addRO('HALDIAGANJ IOCL','MEGHALAYA',amarjeet,['HDFC BANK','SBI BANK'],['TANKER LOAN','HDFC LOAN MAHINDRA EV-2360']);
  addRO('18 MILE','MEGHALAYA',amarjeet,['AXIS','HDFC','HDFC BADAHUNLIN WAR','ICICI-0219','SBI BADAHUNLIN WAR-SHILLONG','SBI BADAHUNLIN WAR','SBI BANK'],['ICICI LOAN-7147']);
  addRO('22 MILE (MIDWAY)','MEGHALAYA',amarjeet,['AXIS BANK','HDFC WAR','HDFC BANK','SBI BANK'],[]);
  addRO('KRE JNGIM LINA','MEGHALAYA',amarjeet,['AXIS BANK','HDFC-6451','SBI-6642'],['SBI LOAN-1071','BPCL CORPUS LOAN']);

  // ── AMIT ───────────────────────────────────────────────────────────────────
  var amit = addAcc('AMIT');
  addRO('S M FUELLING','MEGHALAYA',amit,['SBI BANK','UCO BANK'],[]);
  addRO('WILLIAMNAGAR','MEGHALAYA',amit,['ICICI-0154','PNB BANK','SBI BANK'],['TANKER LOAN','ICICI LOAN-6419','ICICI-LVSL3774','ICICI-LVSL3775']);
  addRO('MILDA','MEGHALAYA',amit,['SBI NEW-RANIKOR','SBI BANK'],['IOCL CORPUS FUND LOAN']);
  addRO('SHANGPUNG','MEGHALAYA',amit,['HDFC BANK','SBI-POLO','SBI-SHANG','UBI BANK (JAWAI BRANCH)'],[]);
  addRO('BOLDOKA','MEGHALAYA',amit,['SBI-1552'],['BPCL CORPUS FUND LOAN']);
  addRO('ATHIYABARI','MEGHALAYA',amit,['INDIAN BANK'],[]);

  // ── RONAK ──────────────────────────────────────────────────────────────────
  var ronak = addAcc('RONAK');
  addRO('HALFLONG','ASSAM',ronak,['PNB-9600','SBI-1641'],[]);
  addRO('DUMNICHOWKI','ASSAM',ronak,['CENTRAL BANK OF INDIA','ICICI-7872','ICICI-5322','PNB BANK'],[]);
  addRO('BAGMARA','ASSAM',ronak,['ASSAM GRAMIN VIKASH-0231','BANDHAN-8208','ICICI-5306','PNB BANK'],['ICICI LOAN-7311']);
  addRO('SONTOLI','ASSAM',ronak,['AXIS BANK','GRAMIN BANK'],[]);
  addRO('SOUTH CITY','MANIPUR',ronak,['ICICI-5131','SBI-7088','ICICI OD-6849'],[]);
  addRO('MIDLAND','ARUNACHAL PRADESH',ronak,['HDFC','ICICI','ICICI OD-0781','SBI'],['TANKER LOAN','HDFC LOAN-0867']);
  addRO('LUT YOMSO','ARUNACHAL PRADESH',ronak,['HDFC','ICICI','ICICI OD'],['BPCL CORPUS FUND LOAN']);

  // ── YOGESH ─────────────────────────────────────────────────────────────────
  var yogesh = addAcc('YOGESH');
  addRO('AALO','ARUNACHAL PRADESH',yogesh,['ICICI','ICICI OD','SBI'],['TANKER LOAN','AXIS CVR-31025','AXIS CVR-50440']);
  addRO('BA','ARUNACHAL PRADESH',yogesh,['SBI BANK','SBI BANK NEW'],['TANKER LOAN','TATA MOTOR FINANCE','BPCL CORPUS FUND LOAN']);
  addRO('T.Y. ENERGY','ARUNACHAL PRADESH',yogesh,['CENTRAL BANK OF INDIA','ICICI','SBI','SBI OLD'],[]);
  addRO('NAHARLAGUN','ARUNACHAL PRADESH',yogesh,['AXIS-5327','ICICI','ICICI OD','SBI'],[]);
  addRO('PASIGHAT','ARUNACHAL PRADESH',yogesh,['PNB BANK','SBI-0408'],['SBI LOAN-3543']);
  addRO('UNILITE','ARUNACHAL PRADESH',yogesh,['HDFC BANK'],[]);
  addRO('NEMANG','ARUNACHAL PRADESH',yogesh,['SBI BANK'],['BPCL CORPUS FUND LOAN']);
  addRO('PINCHI','ARUNACHAL PRADESH',yogesh,['ICICI BANK','SBI BANK'],[]);
  addRO('SY FUELS','ARUNACHAL PRADESH',yogesh,['SBI BANK'],[]);

  // ── KAJAL ──────────────────────────────────────────────────────────────────
  var kajal = addAcc('KAJAL');
  addRO('LT BROS','MIZORAM',kajal,['PNB','SBI NEW-6605'],['TANKER LOAN','SBI LOAN-0702','HDFC LOAN-1869','ICICI TANKER LOAN-2626','ICICI TANKER LOAN-2629']);
  addRO('JMD','MIZORAM',kajal,['ICICI-5479','MIZORAM RURAL BANK','SBI'],['ICICI LOAN-6374','BPCL CORPUS FUND LOAN']);
  addRO('SIAMLIANA','MIZORAM',kajal,['ICICI-1079','MIZORAM RURAL BANK','SBI'],['TANKER LOAN','ICICI LOAN-26839','ICICI LOAN-5736','ICICI LOAN-5738','ICICI LOAN-5740','ICICI LOAN-5742','ICICI LOAN-5763','ICICI LOAN-7155','BPCL CORPUS FUND LOAN']);
  addRO('PHOEBE','MIZORAM',kajal,['SBI BANK','SBI OTHER BANK'],[]);
  addRO('FATIKCHERRA','MIZORAM',kajal,['AXIS BANK'],[]);
  addRO('SL SERVICE','MIZORAM',kajal,['ICICI BANK','SBI BANK'],['IOCL CORPUS FUND LOAN']);

  // ── ADITI ──────────────────────────────────────────────────────────────────
  var aditi = addAcc('ADITI');
  addRO('CINAMORA','ASSAM',aditi,['SBI BANK'],[]);
  addRO('GORAIMARI','ASSAM',aditi,['ASSAM GRAMIN VIKAS NEW-2783','PNB-9503','PNB NEW-0409'],[]);
  addRO('LENGPUI','MIZORAM',aditi,['SBI BANK'],[]);
  addRO('JKL FILLING S','MIZORAM',aditi,['SBI BANK'],['TANKER LOAN','HDFC LOAN-1741','ICICI TANKER LOAN-5841','ICICI TANKER LOAN-5843']);
  addRO('LALSANGLIANA','MIZORAM',aditi,['SBI BANK'],['SBI LOAN-0702']);
  addRO('K.LALANGKALIANA','MIZORAM',aditi,['SBI BANK'],[]);

  // ── PRITHWI ────────────────────────────────────────────────────────────────
  var prithwi = addAcc('PRITHWI');
  addRO('GLOBAL','ASSAM',prithwi,['SBI BANK'],[]);
  addRO('JAI MATA DI','ASSAM',prithwi,['HDFC BANK'],[]);
  addRO('ZOTE','MIZORAM',prithwi,['SBI BANK'],[]);

  // ── General Queries ────────────────────────────────────────────────────────
  var gqs = ['COMPANY','SUSPENSE CLEAR','DSR TALLY','BRANCH TALLY','MONTHLY PROVISION DONE','SHORTAGE BOOKING','ST BOOKING','LAST MONTH GST RETURN FILED','ECHO LEDGER TALLY','SWIPE CARD TALLY'];
  gqs.forEach(function(q, i) { db.general_queries.insert({ query_text: q, display_order: i + 1, is_active: 1 }); });

  console.log('Seed complete — 16 accountants, 102 ROs, 10 general queries.');
}

module.exports = db;
