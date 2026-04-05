const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
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
    '<button class="btn btn-xs btn-outline" onclick="chgPass('+a.id+')">Password</button> '+
    '<button class="btn btn-xs btn-danger" onclick="delAcc('+a.id+')">Delete</button>'+
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
function chgPass(id){
  const a=allAcc.find(x=>x.id===id);const name=a?a.name:id;
  modal('Change Password: '+name,'<div class="form-group"><label>New Password</label><input type="password" class="form-control" id="nPass" placeholder="Enter new password"></div><button class="btn btn-primary" onclick="savePass('+id+')">Set Password</button>');
}
async function savePass(id){
  const p=gv('nPass');if(!p)return toast('Password required','error');
  try{await put('/api/admin/accountants/'+id,{password:p});toast('Password changed!','success');closeModal();}
  catch(e){toast(e.message,'error');}
}
async function delAcc(id){
  const a=allAcc.find(x=>x.id===id);const name=a?a.name:id;
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
    '<button class="btn btn-xs btn-outline" onclick="manageItems('+r.id+')">Items</button> '+
    '<button class="btn btn-xs btn-danger" onclick="delRO('+r.id+')">Delete</button>'+
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
async function manageItems(roId){
  const ro=allROs.find(x=>x.id===roId);const roName=ro?ro.ro_name:roId;
  const items=await api('/api/admin/ros/'+roId+'/items');
  const banks=items.filter(i=>i.item_type==='bank'), loans=items.filter(i=>i.item_type==='loan');
  function rows(list){
    if(!list.length) return '<p class="text-muted">None</p>';
    return list.map(it=>'<div style="display:flex;align-items:center;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid #f3f4f6"><span>'+it.item_name+'</span>'+
      '<button class="btn btn-xs btn-danger" onclick="delItem('+roId+','+it.id+')">Remove</button></div>').join('');
  }
  modal('Items: '+roName,
    '<h4 style="margin-bottom:.5rem">&#127974; Banks</h4>'+rows(banks)+
    '<h4 style="margin:.9rem 0 .5rem">&#128179; Loans</h4>'+rows(loans)+
    '<hr style="margin:.9rem 0"><div style="display:flex;gap:.5rem;align-items:center">'+
    '<input class="form-control" id="nItemN" placeholder="Item name" style="flex:1">'+
    '<select class="form-control" id="nItemT" style="width:100px"><option value="bank">Bank</option><option value="loan">Loan</option></select>'+
    '<button class="btn btn-primary btn-sm" onclick="addItem('+roId+')">Add</button></div>');
}
async function addItem(roId){
  const n=gv('nItemN'),t=gv('nItemT');if(!n)return toast('Name required','error');
  try{await post('/api/admin/ros/'+roId+'/items',{item_name:n,item_type:t});toast('Added!','success');manageItems(roId);loadROsTab();}
  catch(e){toast(e.message,'error');}
}
async function delItem(roId,itemId){
  if(!confirm('Remove this item?'))return;
  try{await del('/api/admin/ros/'+roId+'/items/'+itemId);toast('Removed.','success');manageItems(roId);loadROsTab();}
  catch(e){toast(e.message,'error');}
}
async function delRO(id){
  const r=allROs.find(x=>x.id===id);const name=r?r.ro_name:id;
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

init();