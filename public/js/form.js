const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
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

init();