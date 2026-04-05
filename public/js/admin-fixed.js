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
  initDeadlineMgmt();
  loadDashboard();
}

// ── Dashboard ─────────────────────────────────────────────────────────
async function loadDashboard() {
  const m=document.getElementById('dashMonth').value, y=document.getElementById('dashYear').value;
  const sc=document.getElementById('summaryCards'), dt=document.getElementById('dashboardTable');
  const db2=document.getElementById('deadlineBar');
  sc.innerHTML=dt.innerHTML='<div class="loading-spinner"></div>';
  db2.innerHTML='';
  try {
    const [d, dlRes] = await Promise.all([
      api('/api/admin/dashboard/'+m+'/'+y),
      api('/api/admin/settings/deadline/'+m+'/'+y).catch(()=>({deadline:null}))
    ]);
    sc.innerHTML=[['Total ROs',d.summary.total,''],['Submitted',d.summary.submitted,'success'],['In Progress',d.summary.draft,'warning'],['Not Started',d.summary.pending,'danger']]
      .map(([l,v,c])=>'<div class="sum-card '+(c?'sum-card-'+c:'')+'"><div class="sc-val">'+v+'</div><div class="sc-lbl">'+l+'</div></div>').join('');

    // Deadline bar
    const dl=dlRes.deadline;
    let dlHtml='<div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:.6rem 1rem">';
    if(dl){
      const dlDate=new Date(dl+'T23:59:59');
      const now=new Date();
      const diff=Math.ceil((dlDate-now)/(1000*60*60*24));
      const isPast=diff<0;
      dlHtml+='<span style="font-weight:600">&#128197; Deadline:</span> <span style="color:'+(isPast?'#dc2626':'#16a34a')+';font-weight:600">'+dl+(isPast?' <span style="background:#fee2e2;color:#dc2626;padding:.1rem .4rem;border-radius:4px;font-size:.78rem">CLOSED</span>':' <span style="background:#dcfce7;color:#16a34a;padding:.1rem .4rem;border-radius:4px;font-size:.78rem">'+diff+' day'+(diff===1?'':'s')+' left</span>')+'</span>';
    } else {
      dlHtml+='<span style="color:#9ca3af">&#128197; No deadline set for '+MN[m-1]+' '+y+'</span>';
    }
    dlHtml+='<a href="#dlMgmtSection" class="btn btn-xs btn-outline" style="margin-left:auto">'+(dl?'&#9998; Change':'+ Set')+' Deadline</a>';
    dlHtml+='<button class="btn btn-xs btn-outline" onclick="showPerformer('+m+','+y+')" style="background:#fef9c3;border-color:#fbbf24">&#127942; Performer of Month</button>';
    dlHtml+='</div>';
    db2.innerHTML=dlHtml;

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

// ── Deadline Management Section ────────────────────────────────────────
function initDeadlineMgmt() {
  const now = new Date();
  const mSel = document.getElementById('dlMgmtMonth');
  const ySel = document.getElementById('dlMgmtYear');
  if(!mSel || !ySel) return;
  MN.forEach((m,i)=>{const o=document.createElement('option');o.value=i+1;o.textContent=m;if(i+1===now.getMonth()+1)o.selected=true;mSel.appendChild(o);});
  for(let y=now.getFullYear()+1;y>=now.getFullYear()-2;y--){const o=document.createElement('option');o.value=y;o.textContent=y;if(y===now.getFullYear())o.selected=true;ySel.appendChild(o);}
  loadDeadlineMgmt();
}

async function loadDeadlineMgmt() {
  const m = document.getElementById('dlMgmtMonth')?.value;
  const y = document.getElementById('dlMgmtYear')?.value;
  const statusEl = document.getElementById('dlMgmtStatus');
  const dateEl = document.getElementById('dlMgmtDate');
  if(!m||!y||!statusEl||!dateEl) return;
  try {
    const d = await api('/api/admin/settings/deadline/'+m+'/'+y);
    if(d.deadline) {
      dateEl.value = d.deadline;
      const dlDate = new Date(d.deadline+'T23:59:59');
      const now = new Date();
      const diff = Math.ceil((dlDate-now)/(1000*60*60*24));
      const isPast = diff < 0;
      statusEl.innerHTML = '<div style="padding:.4rem .75rem;border-radius:6px;font-size:.85rem;display:inline-block;background:'+(isPast?'#fee2e2':'#dcfce7')+';color:'+(isPast?'#dc2626':'#15803d')+'">Current deadline: <strong>'+d.deadline+'</strong> '+(isPast?'(Closed)':'('+diff+' days remaining)')+'</div>';
    } else {
      dateEl.value = '';
      statusEl.innerHTML = '<div style="padding:.4rem .75rem;border-radius:6px;font-size:.85rem;display:inline-block;background:#f3f4f6;color:#6b7280">No deadline set for '+MN[m-1]+' '+y+'</div>';
      // Pre-fill default: 7th of next month
      const nm = parseInt(m)===12?1:parseInt(m)+1;
      const ny = parseInt(m)===12?parseInt(y)+1:parseInt(y);
      dateEl.value = ny+'-'+String(nm).padStart(2,'0')+'-07';
    }
  } catch(e) { statusEl.innerHTML=''; }
}

async function saveDeadlineMgmt() {
  const m = document.getElementById('dlMgmtMonth').value;
  const y = document.getElementById('dlMgmtYear').value;
  const d = document.getElementById('dlMgmtDate').value;
  if(!d) return toast('Select a deadline date','error');
  try {
    await post('/api/admin/settings/deadline',{month:parseInt(m),year:parseInt(y),date:d});
    toast('Deadline saved for '+MN[m-1]+' '+y+'!','success');
    loadDeadlineMgmt();
    loadDashboard();
  } catch(e) { toast(e.message,'error'); }
}

async function clearDeadlineMgmt() {
  const m = document.getElementById('dlMgmtMonth').value;
  const y = document.getElementById('dlMgmtYear').value;
  try {
    await post('/api/admin/settings/deadline',{month:parseInt(m),year:parseInt(y),date:''});
    toast('Deadline cleared for '+MN[m-1]+' '+y,'success');
    loadDeadlineMgmt();
    loadDashboard();
  } catch(e) { toast(e.message,'error'); }
}

function setDeadlineModal(m,y){
  const now=new Date();
  // Default: 7th of next month
  const defMonth=m==12?1:m+1;
  const defYear=m==12?y+1:y;
  const defDate=defYear+'-'+String(defMonth).padStart(2,'0')+'-07';
  modal('Set Submission Deadline — '+MN[m-1]+' '+y,
    '<p class="text-muted" style="margin-bottom:.75rem">Accountants must submit reports by this date. Typically 3rd–7th of the following month.</p>'+
    '<div class="form-group"><label>Deadline Date</label><input type="date" class="form-control" id="dlDate" value="'+defDate+'"></div>'+
    '<div style="display:flex;gap:.5rem">'+
    '<button class="btn btn-primary" onclick="saveDeadline('+m+','+y+')">Save Deadline</button>'+
    '<button class="btn btn-outline" onclick="clearDeadline('+m+','+y+')">Clear</button></div>');
}
async function saveDeadline(m,y){
  const d=gv('dlDate');if(!d)return toast('Select a date','error');
  try{await post('/api/admin/settings/deadline',{month:m,year:y,date:d});toast('Deadline saved!','success');closeModal();loadDashboard();}
  catch(e){toast(e.message,'error');}
}
async function clearDeadline(m,y){
  try{await post('/api/admin/settings/deadline',{month:m,year:y,date:''});toast('Deadline cleared.','success');closeModal();loadDashboard();}
  catch(e){toast(e.message,'error');}
}

async function showPerformer(m,y){
  try{
    const d=await api('/api/admin/performer/'+m+'/'+y);
    const {rankings,deadline}=d;
    if(!rankings.length){modal('Performer of Month','<p class="text-muted">No data available.</p>');return;}
    const medals=['&#127942;','&#129353;','&#129354;'];
    const topName=rankings[0].name;
    let h='<div style="background:linear-gradient(135deg,#fef9c3,#fde68a);border-radius:10px;padding:1rem;margin-bottom:1rem;text-align:center">';
    h+='<div style="font-size:2rem">&#127942;</div>';
    h+='<div style="font-size:1.15rem;font-weight:700;color:#92400e">Performer of the Month</div>';
    h+='<div style="font-size:1.5rem;font-weight:800;color:#78350f;margin:.25rem 0">'+topName+'</div>';
    h+='<div style="font-size:.85rem;color:#a16207">'+rankings[0].submitted+'/'+rankings[0].total_ros+' ROs completed ('+rankings[0].completion_rate+'%)</div>';
    h+='</div>';
    h+='<p style="font-size:.78rem;color:#6b7280;margin-bottom:.5rem">&#128203; Ranked by <strong>Completion Rate</strong> (submitted ÷ assigned). Tiebreaker: average days before deadline. This metric is fair regardless of how many ROs each accountant manages.</p>';
    if(!deadline)h+='<p style="font-size:.78rem;color:#f59e0b;margin-bottom:.5rem">&#9888; No deadline set — on-time bonus not applied. <a href="#" onclick="closeModal()" style="color:#2563eb">Set a deadline</a> for accurate ranking.</p>';
    h+='<div style="overflow-x:auto"><table class="table table-sm"><thead><tr><th>#</th><th>Accountant</th><th>Assigned</th><th>Submitted</th><th>Completion Rate</th>'+(deadline?'<th>Avg Days Early</th>':'')+'</tr></thead><tbody>';
    rankings.forEach((r,i)=>{
      const medal=i<3?medals[i]:'';
      const hl=i===0?' style="background:#fefce8"':'';
      h+='<tr'+hl+'><td>'+(medal||i+1)+'</td><td><strong>'+r.name+'</strong></td><td>'+r.total_ros+'</td>'+
        '<td>'+r.submitted+'</td>'+
        '<td><div style="background:#e5e7eb;border-radius:99px;height:6px;width:80px;display:inline-block;vertical-align:middle"><div style="background:'+(r.completion_rate===100?'#16a34a':r.completion_rate>=70?'#2563eb':'#dc2626')+';border-radius:99px;height:6px;width:'+r.completion_rate+'%"></div></div> <strong>'+r.completion_rate+'%</strong></td>'+
        (deadline?'<td>'+r.avg_days_early+'d</td>':'')+'</tr>';
    });
    h+='</tbody></table></div>';
    modal('&#127942; Performer of Month — '+MN[m-1]+' '+y, h);
  }catch(e){toast(e.message,'error');}
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
    h+='<div style="overflow-x:auto"><table class="table"><thead><tr><th>#</th><th>RO Name</th><th>State</th><th>Accountant</th><th>Submitted At</th><th>YES</th><th>NO</th><th>NA</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    d.forEach((c2,i)=>{
      const aa=c2.admin_action;
      const statusBadge=aa==='approved'?'<span class="badge badge-success">&#10004; Approved</span>':aa==='rejected'?'<span class="badge badge-danger">&#10006; Rejected</span>':'<span class="badge badge-warning">Pending Review</span>';
      const revCount=c2.resubmit_count>0?'<br><small class="text-muted">Resubmitted '+c2.resubmit_count+'x</small>':'';
      h+='<tr><td>'+(i+1)+'</td><td><strong>'+c2.ro_name+'</strong></td><td>'+(c2.state||'-')+'</td><td>'+c2.accountant_name+'</td><td style="white-space:nowrap;font-size:.82rem">'+c2.submitted_at+'</td>'+
        '<td><span class="badge badge-success">'+c2.yes_count+'</span></td>'+
        '<td><span class="badge badge-danger">'+c2.no_count+'</span></td>'+
        '<td><span class="badge">'+c2.na_count+'</span></td>'+
        '<td>'+statusBadge+revCount+'</td>'+
        '<td class="act-btns"><button class="btn btn-xs btn-outline" onclick="viewClosure('+c2.id+')">View</button>'+(aa!=='approved'?'<button class="btn btn-xs btn-outline" onclick="reopenClose('+c2.id+')" title="Allow resubmission" style="margin-left:.25rem">Reopen</button>':'')+'</td></tr>';
    });
    h+='</tbody></table></div>';
    c.innerHTML=h;
  } catch(e){c.innerHTML='<p style="color:red">'+e.message+'</p>';}
}

async function viewClosure(cid){
  try{
    const d=await api('/api/admin/closure/'+cid+'/detail');
    const {closure,banks,loans,queries,answerMap}=d;
    const aa=closure.admin_action;
    let h='<div style="font-size:.85rem">';
    // Admin action banner
    if(aa==='approved') h+='<div style="background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:.5rem .75rem;margin-bottom:.75rem;color:#15803d;font-weight:600">&#10004; Approved'+(closure.admin_at?' on '+closure.admin_at:'')+(closure.admin_note?' — '+closure.admin_note:'')+'</div>';
    if(aa==='rejected') h+='<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:6px;padding:.5rem .75rem;margin-bottom:.75rem;color:#dc2626;font-weight:600">&#10006; Rejected'+(closure.admin_at?' on '+closure.admin_at:'')+(closure.admin_note?' — <em>'+closure.admin_note+'</em>':'')+'</div>';
    h+='<p><strong>RO:</strong> '+closure.ro_name+' | <strong>Period:</strong> '+MN[closure.month-1]+' '+closure.year+'</p>'+
      '<p><strong>Accountant:</strong> '+closure.accountant_name+' | <strong>Submitted:</strong> '+(closure.submitted_at||'Not submitted')+(closure.resubmit_count>0?' | <span class="badge" title="Resubmitted '+closure.resubmit_count+' time(s)">&#128260; ×'+closure.resubmit_count+'</span>':'')+'</p>';
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
    // Action buttons (only if submitted/not-yet-approved)
    if(closure.status==='submitted'||!closure.submitted_at){
      h+='<hr style="margin:1rem 0">';
      h+='<div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">';
      if(closure.status==='submitted' && aa!=='approved'){
        h+='<button class="btn btn-primary btn-sm" onclick="approveClose('+cid+')">&#10004; Approve</button>';
        h+='<button class="btn btn-sm" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5" onclick="rejectModal('+cid+')">&#10006; Reject & Return</button>';
      }
      if(aa==='approved'){
        h+='<button class="btn btn-sm btn-outline" onclick="reopenClose('+cid+')">&#128260; Reopen for Revision</button>';
      } else if(closure.status==='submitted'){
        h+='<button class="btn btn-sm btn-outline" onclick="reopenClose('+cid+')">&#128260; Allow Resubmission</button>';
      }
      h+='</div>';
    } else {
      h+='<hr style="margin:1rem 0"><div style="display:flex;gap:.5rem">';
      h+='<button class="btn btn-sm btn-outline" onclick="reopenClose('+cid+')">&#128260; Reopen for Revision</button>';
      h+='</div>';
    }
    h+='</div>';
    modal('Closure: '+closure.ro_name+' — '+MN[closure.month-1]+' '+closure.year, h);
  }catch(e){toast(e.message,'error');}
}

async function approveClose(cid){
  if(!confirm('Approve this closure?'))return;
  try{await post('/api/admin/closure/'+cid+'/approve',{});toast('Approved!','success');closeModal();loadReport();}
  catch(e){toast(e.message,'error');}
}

function rejectModal(cid){
  modal('Reject & Return to Accountant',
    '<p class="text-muted" style="margin-bottom:.75rem">This will send the closure back to the accountant for correction. They will see your note.</p>'+
    '<div class="form-group"><label>Reason / Note for Accountant <span style="color:#6b7280;font-weight:400">(required)</span></label>'+
    '<textarea class="form-control" id="rejNote" rows="3" placeholder="e.g. Bank balance mismatch in AXIS BANK, please recheck"></textarea></div>'+
    '<button class="btn btn-primary" style="background:#dc2626;border-color:#dc2626" onclick="rejectClose('+cid+')">Reject & Return</button>');
}
async function rejectClose(cid){
  const note=gv('rejNote');if(!note.trim())return toast('Please enter a reason','error');
  try{await post('/api/admin/closure/'+cid+'/reject',{note:note.trim()});toast('Rejected and returned to accountant.','success');closeModal();loadReport();}
  catch(e){toast(e.message,'error');}
}

async function reopenClose(cid){
  if(!confirm('Reopen this closure for resubmission? The accountant will be able to edit and resubmit.'))return;
  try{await post('/api/admin/closure/'+cid+'/reopen',{});toast('Reopened for resubmission.','success');closeModal();loadReport();}
  catch(e){toast(e.message,'error');}
}

async function loadAccForPerf(){
  if(!allAcc.length) allAcc=await api('/api/admin/accountants');
  const s=document.getElementById('perfAccountant');
  // Clear existing options except first
  while(s.options.length>1) s.remove(1);
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
