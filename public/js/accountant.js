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

  // Load deadline for this period
  loadDeadlineBanner(m, y);

  try {
    const ros = await api('/api/accountant/ros?month='+m+'&year='+y);
    const sub = ros.filter(r=>r.status==='submitted').length;
    const draft = ros.filter(r=>r.status==='draft').length;
    const approved = ros.filter(r=>r.admin_action==='approved').length;
    let pt = MN[m-1]+' '+y+' — '+sub+'/'+ros.length+' submitted';
    if(draft) pt += ' | '+draft+' in progress';
    if(approved) pt += ' | '+approved+' approved';
    document.getElementById('progressText').textContent = pt;
    if (!ros.length) { g.innerHTML='<p class="text-muted" style="padding:1.5rem">No ROs assigned.</p>'; return; }
    g.innerHTML = ros.map(ro => {
      // Determine display state
      let sc, icon, lbl, extra='', cancelBtn='';

      if(ro.admin_action==='approved'){
        sc='ro-card-submitted'; icon='&#9989;'; lbl='Approved';
        extra='<div class="roc-time" style="color:#15803d">&#10004; Verified by admin</div>';
      } else if(ro.admin_action==='rejected'){
        // Rejected = back to draft with a note
        sc='ro-card-draft'; icon='&#9888;'; lbl='Needs Revision';
        extra='<div class="roc-time" style="color:#dc2626;font-weight:600">Admin note: '+(ro.admin_note||'Please revise and resubmit')+'</div>';
      } else if(ro.status==='submitted'){
        sc='ro-card-submitted'; icon='&#10004;'; lbl='Submitted';
        extra=ro.submitted_at?'<div class="roc-time">'+ro.submitted_at+'</div>':'';
        cancelBtn='<div style="margin-top:.4rem"><button class="btn btn-xs" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;font-size:.72rem" onclick="cancelSubmission(event,'+ro.id+','+m+','+y+')">&#10006; Cancel Submission</button></div>';
      } else if(ro.status==='draft'){
        sc='ro-card-draft'; icon='&#9201;'; lbl='In Progress';
        if(ro.resubmit_count>0) extra='<div class="roc-time">Resubmission #'+ro.resubmit_count+'</div>';
      } else {
        sc='ro-card-pending'; icon='&#9679;'; lbl='Not Started';
      }

      return '<div style="position:relative">'+
        '<a href="/form?ro_id='+ro.id+'&month='+m+'&year='+y+'" class="ro-card '+sc+'">' +
        '<div class="roc-name">'+ro.ro_name+'</div>' +
        '<div class="roc-state">'+(ro.state||'')+'</div>' +
        '<div class="roc-status">'+icon+' '+lbl+'</div>'+extra+'</a>'+
        cancelBtn+'</div>';
    }).join('');
  } catch(e) { g.innerHTML='<p style="color:red;padding:1rem">'+e.message+'</p>'; }
}

async function loadDeadlineBanner(m, y) {
  const banner = document.getElementById('deadlineBanner');
  if(!banner) return;
  try {
    const r = await fetch('/api/admin/settings/deadline/'+m+'/'+y);
    if(!r.ok){ banner.innerHTML=''; return; }
    const data = await r.json();
    const dl = data.deadline;
    if(!dl){ banner.innerHTML=''; return; }
    const dlDate = new Date(dl+'T23:59:59');
    const now = new Date();
    const diff = Math.ceil((dlDate - now) / (1000*60*60*24));
    const isPast = diff < 0;
    const isUrgent = !isPast && diff <= 2;
    const bg = isPast ? '#fee2e2' : isUrgent ? '#fff7ed' : '#f0fdf4';
    const border = isPast ? '#fca5a5' : isUrgent ? '#fed7aa' : '#86efac';
    const color = isPast ? '#dc2626' : isUrgent ? '#ea580c' : '#15803d';
    const msg = isPast
      ? 'Submission deadline was '+dl+'. Please contact admin if you missed it.'
      : diff===0
        ? 'Deadline is TODAY ('+dl+'). Submit immediately!'
        : 'Submit by '+dl+' ('+diff+' day'+(diff===1?'':'s')+' remaining)';
    banner.innerHTML='<div style="background:'+bg+';border:1px solid '+border+';border-radius:8px;padding:.6rem 1rem;margin-bottom:.75rem;color:'+color+';display:flex;align-items:center;gap:.5rem">'+
      '<span style="font-size:1.1rem">'+(isPast?'&#9888;':isUrgent?'&#9201;':'&#128197;')+'</span>'+
      '<span><strong>Submission Deadline:</strong> '+msg+'</span></div>';
  } catch(e){ if(banner) banner.innerHTML=''; }
}

async function cancelSubmission(e, roId, month, year) {
  e.preventDefault();
  e.stopPropagation();
  if(!confirm('Cancel your submission for this RO? You can then edit and resubmit.\n\nNote: You will need to resubmit before the deadline.')) return;
  try {
    const r = await fetch('/api/accountant/closure/'+roId+'/'+month+'/'+year+'/cancel', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
    const d = await r.json();
    if(!r.ok) { alert(d.error||'Failed to cancel'); return; }
    toast('Submission cancelled. You can now edit and resubmit.', 'success');
    loadROs();
  } catch(e) { alert('Error: '+e.message); }
}

async function logout() { await fetch('/api/auth/logout',{method:'POST'}); location.href='/'; }

function toast(msg,type){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type||'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='toast',3500);}

async function api(url) {
  const r = await fetch(url);
  if (r.status===401) { location.href='/'; throw new Error('Unauthorized'); }
  const d = await r.json();
  if (!r.ok) throw new Error(d.error||'Error');
  return d;
}

init();
