
const DEFAULT_DATA = {"version": 6, "settings": {"fullDayMinutes": 450, "expiryMonths": 3}, "earned": [{"id": "e1", "date": "2026-05-07", "minutes": 60, "note": "Helping ML w/ E and Flow E2E testing"}, {"id": "e2", "date": "2026-05-08", "minutes": 60, "note": "QFTs"}, {"id": "e3", "date": "2026-05-12", "minutes": 60, "note": "QFTs"}, {"id": "e4", "date": "2026-05-16", "minutes": 240, "note": "Saturday work – time in lieu"}, {"id": "e5", "date": "2026-05-19", "minutes": 60, "note": "QFTs"}, {"id": "e6", "date": "2026-06-02", "minutes": 60, "note": "QFTs"}, {"id": "e7", "date": "2026-06-03", "minutes": 60, "note": "QFTs"}, {"id": "e8", "date": "2026-06-06", "minutes": 240, "note": "Saturday work – time in lieu"}, {"id": "e9", "date": "2026-06-08", "minutes": 60, "note": "QFTs"}, {"id": "e10", "date": "2026-06-09", "minutes": 60, "note": "QFTs"}, {"id": "e11", "date": "2026-06-10", "minutes": 60, "note": "QFTs"}, {"id": "e12", "date": "2026-06-11", "minutes": 60, "note": "Helping ML w/ Flow E2E evidence"}, {"id": "e13", "date": "2026-06-16", "minutes": 60, "note": "QFTs"}, {"id": "e14", "date": "2026-06-18", "minutes": 60, "note": "QFTs"}, {"id": "e15", "date": "2026-07-07", "minutes": 60, "note": "QFTs"}, {"id": "e16", "date": "2026-07-08", "minutes": 60, "note": "QFTs"}, {"id": "e17", "date": "2026-07-11", "minutes": 240, "note": "Saturday work – QFTs / time in lieu"}, {"id": "e18", "date": "2026-07-17", "minutes": 60, "note": "QFTs"}, {"id": "e19", "date": "2026-08-25", "minutes": 60, "note": "QFTs"}, {"id": "e20", "date": "2026-08-27", "minutes": 60, "note": "QFTs"}, {"id": "e21", "date": "2026-09-08", "minutes": 60, "note": "QFTs"}], "taken": [{"id": "t1", "date": "2026-07-21", "minutes": 450, "status": "Approved", "note": "Full TOIL day"}, {"id": "t2", "date": "2026-07-22", "minutes": 450, "status": "Approved", "note": "Full TOIL day"}, {"id": "t3", "date": "2026-08-18", "minutes": 450, "status": "Rejected", "note": "Time Owing request"}, {"id": "t4", "date": "2026-09-02", "minutes": 450, "status": "Rejected", "note": "Time Owing request"}, {"id": "t5", "date": "2026-09-07", "minutes": 270, "status": "Approved", "note": "Phased return day"}, {"id": "t7", "date": "2026-09-18", "minutes": 30, "status": "Requested", "note": "Half an hour TOIL"}, {"id": "t6", "date": "2026-12-24", "minutes": 450, "status": "Requested", "note": "Day Off from this shithole"}], "overtime": [{"id": "o1", "date": "2026-05-16", "minutes": 240, "type": "Saturday enhancement", "status": "To submit", "note": "30% additional"}, {"id": "o2", "date": "2026-06-06", "minutes": 240, "type": "Saturday enhancement", "status": "To submit", "note": "30% additional"}, {"id": "o3", "date": "2026-06-12", "minutes": 30, "type": "Paid overtime", "status": "Logged", "note": "AS overtime"}, {"id": "o4", "date": "2026-07-11", "minutes": 240, "type": "Saturday enhancement", "status": "To submit", "note": "30% additional – QFTs"}]};
const KEY = 'toil_tracker_v1';
let data;
let editingTakenId = null;

function clone(v){ return JSON.parse(JSON.stringify(v)); }
function pad(n){ return String(n).padStart(2,'0'); }
function todayISO(){
  const d=new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function safeMinutes(v){ const n=Number(v); return Number.isFinite(n) ? Math.max(0,Math.round(n)) : 0; }

function normalizeData(raw){
  const d=(raw && typeof raw==='object') ? raw : {};
  d.settings=(d.settings && typeof d.settings==='object') ? d.settings : {};
  d.settings.fullDayMinutes=safeMinutes(d.settings.fullDayMinutes)||450;
  d.settings.expiryMonths=Number(d.settings.expiryMonths)||3;

  d.earned=Array.isArray(d.earned)?d.earned:[];
  d.taken=Array.isArray(d.taken)?d.taken:[];
  d.overtime=Array.isArray(d.overtime)?d.overtime:[];

  d.earned=d.earned.map((x,i)=>({
    id:x.id||`e_m${i}`, date:String(x.date||todayISO()),
    minutes:safeMinutes(x.minutes), note:String(x.note||'')
  })).filter(x=>x.minutes>0);

  d.taken=d.taken.map((x,i)=>({
    id:x.id||`t_m${i}`, date:String(x.date||todayISO()),
    minutes:safeMinutes(x.minutes),
    status:['Requested','Approved','Rejected','Cancelled'].includes(x.status)?x.status:'Requested',
    note:String(x.note||'')
  })).filter(x=>x.minutes>0);

  d.overtime=d.overtime.map((x,i)=>({
    id:x.id||`o_m${i}`, date:String(x.date||todayISO()),
    minutes:safeMinutes(x.minutes), type:String(x.type||'Other'),
    status:String(x.status||'Logged'), note:String(x.note||'')
  })).filter(x=>x.minutes>0);

  return d;
}

function loadData(){
  const raw=localStorage.getItem(KEY);
  if(!raw){
    const fresh=normalizeData(clone(DEFAULT_DATA));
    localStorage.setItem(KEY,JSON.stringify(fresh));
    return fresh;
  }
  try{
    const migrated=normalizeData(JSON.parse(raw));
    localStorage.setItem(KEY,JSON.stringify(migrated));
    return migrated;
  }catch(e){
    return normalizeData(clone(DEFAULT_DATA));
  }
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(data));
  renderAll();
}

function uid(prefix){ return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function fmtDate(s){
  const d=new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime())?s:d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
}
function fmtMinutes(m){
  m=safeMinutes(m); const h=Math.floor(m/60), min=m%60;
  if(h && min) return `${h}h ${pad(min)}m`;
  if(h) return `${h}h`;
  return `${min}m`;
}
function toMinutes(h,m){ return safeMinutes((parseInt(h||0)*60)+parseInt(m||0)); }
function addMonthsISO(dateStr, months){
  const parts=String(dateStr).split('-').map(Number);
  if(parts.length!==3 || parts.some(Number.isNaN)) return dateStr;
  const [y,mo,day]=parts;
  const d=new Date(y,mo-1+months,1,12);
  const last=new Date(d.getFullYear(),d.getMonth()+1,0,12).getDate();
  d.setDate(Math.min(day,last));
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function daysBetween(aISO,bISO){
  const a=new Date(`${aISO}T12:00:00`), b=new Date(`${bISO}T12:00:00`);
  if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())) return null;
  return Math.ceil((a-b)/86400000);
}

function totalEarned(){ return data.earned.reduce((s,x)=>s+safeMinutes(x.minutes),0); }
function approvedUsed(){ return data.taken.filter(x=>x.status==='Approved').reduce((s,x)=>s+safeMinutes(x.minutes),0); }
function pendingUsed(){ return data.taken.filter(x=>x.status==='Requested').reduce((s,x)=>s+safeMinutes(x.minutes),0); }
function availableNow(){ return totalEarned()-approvedUsed(); }
function afterPending(){ return availableNow()-pendingUsed(); }

function expiryRows(){
  const rows=[...data.earned].sort((a,b)=>a.date.localeCompare(b.date));
  let approved=approvedUsed();
  let pending=pendingUsed();
  const today=todayISO();

  return rows.map(e=>{
    const earned=safeMinutes(e.minutes);
    const approvedPart=Math.min(earned,approved);
    approved-=approvedPart;

    const afterApproved=earned-approvedPart;
    const pendingPart=Math.min(afterApproved,pending);
    pending-=pendingPart;

    const free=Math.max(0,afterApproved-pendingPart);
    const useBy=addMonthsISO(e.date,data.settings.expiryMonths);
    const days=afterApproved>0?daysBetween(useBy,today):null;

    let status='Used', cls='grey';
    if(afterApproved>0 && pendingPart===afterApproved){ status='Pending'; cls='orange'; }
    else if(afterApproved>0 && pendingPart>0){ status='Part pending'; cls='orange'; }
    else if(free>0){
      if(days!==null && days<0){ status='Expired'; cls='red'; }
      else if(days!==null && days<=14){ status='Use now'; cls='red'; }
      else if(days!==null && days<=30){ status='Use soon'; cls='orange'; }
      else { status='Plenty of time'; cls='green'; }
    }

    return {...e,earned,remaining:afterApproved,pendingPart,free,useBy,days,status,cls};
  });
}

function renderHome(){
  document.getElementById('availableNow').textContent=fmtMinutes(availableNow());
  document.getElementById('afterPending').textContent=fmtMinutes(afterPending());
  document.getElementById('earnedTotal').textContent=fmtMinutes(totalEarned());
  document.getElementById('approvedTotal').textContent=fmtMinutes(approvedUsed());
  document.getElementById('pendingTotal').textContent=fmtMinutes(pendingUsed());

  const first=expiryRows().find(x=>x.remaining>0);
  const el=document.getElementById('nextExpiry');
  if(!first){ el.innerHTML='<div class="empty">No unused earned TOIL.</div>'; return; }

  if(first.pendingPart===first.remaining){
    el.innerHTML=`<div class="item expiry orange"><div>
      <div class="item-title">${fmtMinutes(first.pendingPart)} from ${fmtDate(first.date)}</div>
      <div class="item-meta">Use by ${fmtDate(first.useBy)} · covered by pending TOIL</div>
      <span class="badge orange">Pending</span>
    </div><div class="amount">${fmtMinutes(first.pendingPart)}</div></div>`;
  } else if(first.pendingPart>0){
    el.innerHTML=`<div class="item expiry orange"><div>
      <div class="item-title">${fmtMinutes(first.remaining)} from ${fmtDate(first.date)}</div>
      <div class="item-meta">${fmtMinutes(first.pendingPart)} pending · ${fmtMinutes(first.free)} still free · use by ${fmtDate(first.useBy)}</div>
      <span class="badge orange">Part pending</span>
    </div><div class="amount">${fmtMinutes(first.free)} free</div></div>`;
  } else {
    el.innerHTML=`<div class="item expiry ${first.cls}"><div>
      <div class="item-title">${fmtMinutes(first.free)} from ${fmtDate(first.date)}</div>
      <div class="item-meta">Use by ${fmtDate(first.useBy)}${first.days===null?'':` · ${first.days} days left`}</div>
      <span class="badge ${first.cls}">${first.status}</span>
    </div><div class="amount">${fmtMinutes(first.free)}</div></div>`;
  }
}

function renderPendingHome(){
  const el=document.getElementById('pendingHomeList');
  if(!el) return;
  const rows=data.taken.filter(x=>x.status==='Requested').sort((a,b)=>a.date.localeCompare(b.date));
  el.innerHTML=rows.length?rows.map(x=>`
    <button class="pending-card" type="button" onclick="editTaken('${x.id}')">
      <div><div class="pending-title">${fmtDate(x.date)} · ${fmtMinutes(x.minutes)}</div>
      <div class="pending-note">${x.note||'Pending TOIL'}</div><span class="badge orange">Pending</span></div>
      <div class="pending-edit">Edit ›</div>
    </button>`).join(''):'<div class="empty">No pending TOIL requests.</div>';
}

function renderExpiry(){
  const el=document.getElementById('expiryList');
  if(!el) return;
  const rows=expiryRows();
  if(!rows.length){ el.innerHTML='<div class="empty">No earned TOIL yet.</div>'; return; }

  el.innerHTML=rows.map(x=>{
    let detail, amount;
    if(x.remaining===0){ detail=`Used · earned ${fmtMinutes(x.earned)}`; amount='Used'; }
    else if(x.pendingPart===x.remaining){ detail=`${fmtMinutes(x.pendingPart)} reserved by pending TOIL · use by ${fmtDate(x.useBy)}`; amount=`${fmtMinutes(x.pendingPart)} pending`; }
    else if(x.pendingPart>0){ detail=`${fmtMinutes(x.pendingPart)} pending · ${fmtMinutes(x.free)} free · use by ${fmtDate(x.useBy)}`; amount=`${fmtMinutes(x.free)} free`; }
    else { detail=`Use by ${fmtDate(x.useBy)}${x.days===null?'':` · ${x.days} days left`}`; amount=`${fmtMinutes(x.free)} free`; }

    return `<div class="item expiry ${x.cls}">
      <div><div class="item-title">Earned ${fmtDate(x.date)}</div>
      <div class="item-meta">${detail}</div><span class="badge ${x.cls}">${x.status}</span></div>
      <div class="amount">${amount}</div>
    </div>`;
  }).join('');
}

function historyClass(x){
  if(x.kind==='Earned') return 'history-earned';
  if(x.status==='Approved') return 'history-approved';
  if(x.status==='Requested') return 'history-requested';
  if(x.status==='Rejected') return 'history-rejected';
  return 'history-cancelled';
}

function resetHistoryFilters(){
  const sort=document.getElementById('historySort');
  const type=document.getElementById('historyTypeFilter');
  const status=document.getElementById('historyStatusFilter');
  const search=document.getElementById('historySearch');
  if(sort) sort.value='newest';
  if(type) type.value='All';
  if(status) status.value='All';
  if(search) search.value='';
}

function filteredHistory(){
  let rows=[
    ...data.earned.map(x=>({kind:'Earned',...x})),
    ...data.taken.map(x=>({kind:'TOIL',...x}))
  ];

  const sort=document.getElementById('historySort')?.value || 'newest';
  const type=document.getElementById('historyTypeFilter')?.value || 'All';
  const status=document.getElementById('historyStatusFilter')?.value || 'All';
  const q=(document.getElementById('historySearch')?.value || '').trim().toLowerCase();

  if(type!=='All') rows=rows.filter(x=>x.kind===type);
  if(status!=='All') rows=rows.filter(x=>x.kind==='TOIL' && x.status===status);
  if(q) rows=rows.filter(x =>
    fmtDate(x.date).toLowerCase().includes(q) ||
    (x.note||'').toLowerCase().includes(q) ||
    x.kind.toLowerCase().includes(q) ||
    (x.status||'').toLowerCase().includes(q)
  );

  rows.sort((a,b)=>sort==='oldest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
  return rows;
}

function renderHistory(){
  const el=document.getElementById('historyList');
  if(!el) return;
  const rows=filteredHistory();
  el.innerHTML=rows.length?rows.map(x=>`
    <div class="item history-item ${historyClass(x)} ${x.kind==='TOIL'?'tap-edit':''}" ${x.kind==='TOIL'?`onclick="editTaken('${x.id}')"`:''}>
      <div>
        <div class="item-title">${x.kind==='Earned'?'Earned':'TOIL'} · ${fmtDate(x.date)}</div>
        <div class="item-meta">${x.note||''}</div>
        ${x.kind==='TOIL'?`<span class="badge ${x.status==='Approved'?'green':x.status==='Requested'?'orange':x.status==='Rejected'?'grey':'red'}">${x.status}</span>`:''}
      </div>
      <div>
        <div class="amount">${x.kind==='Earned'?'+':'−'}${fmtMinutes(x.minutes)}</div>
        <div class="row-actions">
          ${x.kind==='TOIL'?`<button class="btn small ghost" onclick="event.stopPropagation();editTaken('${x.id}')">Edit</button>`:''}
          <button class="btn small ghost" onclick="event.stopPropagation();deleteEntry('${x.kind}','${x.id}')">Delete</button>
        </div>
      </div>
    </div>`).join(''):'<div class="empty">No entries match those filters.</div>';
}

function renderOvertime(){
  const el=document.getElementById('overtimeList');
  if(!el) return;
  const rows=[...data.overtime].sort((a,b)=>b.date.localeCompare(a.date));
  el.innerHTML=rows.length?rows.map(x=>`
    <div class="item"><div><div class="item-title">${x.type} · ${fmtDate(x.date)}</div>
    <div class="item-meta">${x.status}${x.note?' · '+x.note:''}</div></div>
    <div><div class="amount">${fmtMinutes(x.minutes)}</div>
    <div class="row-actions"><button class="btn small ghost" onclick="deleteOvertime('${x.id}')">Delete</button></div></div></div>`).join(''):'<div class="empty">No overtime logged.</div>';
}

function renderAll(){
  renderHome();
  renderPendingHome();
  renderExpiry();
  renderHistory();
  renderOvertime();
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.screen===id));
  if(id==='more') renderHistory();
  if(id==='expiry') renderExpiry();
  window.scrollTo({top:0,behavior:'instant'});
}
window.showScreen=showScreen;

function setDuration(prefix,mins){
  document.getElementById(prefix+'Hours').value=Math.floor(mins/60);
  document.getElementById(prefix+'Minutes').value=mins%60;
}
window.setDuration=setDuration;

function editTaken(id){
  const x=data.taken.find(v=>v.id===id); if(!x) return;
  editingTakenId=id;
  takeDate.value=x.date; setDuration('take',x.minutes); takeStatus.value=x.status; takeNote.value=x.note||'';
  document.getElementById('takeFormTitle').textContent='Edit TOIL entry';
  document.getElementById('takeSubmitBtn').textContent='Save changes';
  document.getElementById('cancelTakenEdit').style.display='block';
  showScreen('take');
}
window.editTaken=editTaken;

function cancelTakenEdit(){
  editingTakenId=null;
  takenForm.reset(); takeDate.value=todayISO(); setDuration('take',data.settings.fullDayMinutes); takeStatus.value='Requested';
  document.getElementById('takeFormTitle').textContent='Log TOIL request / use';
  document.getElementById('takeSubmitBtn').textContent='Save TOIL entry';
  document.getElementById('cancelTakenEdit').style.display='none';
}
window.cancelTakenEdit=cancelTakenEdit;

function deleteEntry(kind,id){
  if(!confirm('Delete this entry?')) return;
  if(kind==='Earned') data.earned=data.earned.filter(x=>x.id!==id);
  else data.taken=data.taken.filter(x=>x.id!==id);
  save();
}
window.deleteEntry=deleteEntry;
function deleteOvertime(id){
  if(confirm('Delete this overtime entry?')){ data.overtime=data.overtime.filter(x=>x.id!==id); save(); }
}
window.deleteOvertime=deleteOvertime;

function init(){
  data=loadData();
  resetHistoryFilters();

  document.querySelectorAll('.navbtn').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));
  ['historySort','historyTypeFilter','historyStatusFilter'].forEach(id=>document.getElementById(id)?.addEventListener('change',renderHistory));
  document.getElementById('historySearch')?.addEventListener('input',renderHistory);

  earnDate.value=todayISO(); takeDate.value=todayISO(); otDate.value=todayISO();
  setDuration('earn',60); setDuration('take',data.settings.fullDayMinutes); setDuration('ot',60);

  earnedForm.addEventListener('submit',e=>{
    e.preventDefault();
    const minutes=toMinutes(earnHours.value,earnMinutes.value);
    if(!minutes) return alert('Enter some time.');
    data.earned.push({id:uid('e'),date:earnDate.value,minutes,note:earnNote.value.trim()});
    save(); e.target.reset(); earnDate.value=todayISO(); setDuration('earn',60); showScreen('home');
  });

  takenForm.addEventListener('submit',e=>{
    e.preventDefault();
    const minutes=toMinutes(takeHours.value,takeMinutes.value);
    if(!minutes) return alert('Enter some time.');
    if(editingTakenId){
      const x=data.taken.find(v=>v.id===editingTakenId);
      if(x){ x.date=takeDate.value; x.minutes=minutes; x.status=takeStatus.value; x.note=takeNote.value.trim(); }
    } else {
      data.taken.push({id:uid('t'),date:takeDate.value,minutes,status:takeStatus.value,note:takeNote.value.trim()});
    }
    save(); cancelTakenEdit(); showScreen('home');
  });

  overtimeForm.addEventListener('submit',e=>{
    e.preventDefault();
    const minutes=toMinutes(otHours.value,otMinutes.value);
    if(!minutes) return alert('Enter some time.');
    data.overtime.push({id:uid('o'),date:otDate.value,minutes,type:otType.value,status:otStatus.value,note:otNote.value.trim()});
    save(); e.target.reset(); otDate.value=todayISO(); setDuration('ot',60);
  });

  backupBtn.addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='toil-tracker-data.json'; a.click(); URL.revokeObjectURL(a.href);
  });

  restoreFile.addEventListener('change',async e=>{
    const f=e.target.files[0]; if(!f) return;
    try{
      data=normalizeData(JSON.parse(await f.text()));
      save(); resetHistoryFilters(); renderAll(); alert('Data restored.');
    }catch(err){ alert('That data file could not be read.'); }
    e.target.value='';
  });

  resetBtn.addEventListener('click',()=>{
    if(confirm('Reset the app back to the original preloaded data?')){
      data=normalizeData(clone(DEFAULT_DATA)); save(); resetHistoryFilters(); renderAll();
    }
  });

  renderAll();

  if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
}
document.addEventListener('DOMContentLoaded',init);
