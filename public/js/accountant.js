const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

init();