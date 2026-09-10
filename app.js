
const DEFAULT_DATA = {"version": 1, "settings": {"fullDayMinutes": 450, "expiryMonths": 3}, "earned": [{"id": "e1", "date": "2026-05-07", "minutes": 60, "note": "Helping ML w/ E and Flow E2E testing"}, {"id": "e2", "date": "2026-05-08", "minutes": 60, "note": "QFTs"}, {"id": "e3", "date": "2026-05-12", "minutes": 60, "note": "QFTs"}, {"id": "e4", "date": "2026-05-16", "minutes": 240, "note": "Saturday work – time in lieu"}, {"id": "e5", "date": "2026-05-19", "minutes": 60, "note": "QFTs"}, {"id": "e6", "date": "2026-06-02", "minutes": 60, "note": "QFTs"}, {"id": "e7", "date": "2026-06-03", "minutes": 60, "note": "QFTs"}, {"id": "e8", "date": "2026-06-06", "minutes": 240, "note": "Saturday work – time in lieu"}, {"id": "e9", "date": "2026-06-08", "minutes": 60, "note": "QFTs"}, {"id": "e10", "date": "2026-06-09", "minutes": 60, "note": "QFTs"}, {"id": "e11", "date": "2026-06-10", "minutes": 60, "note": "QFTs"}, {"id": "e12", "date": "2026-06-11", "minutes": 60, "note": "Helping ML w/ Flow E2E evidence"}, {"id": "e13", "date": "2026-06-16", "minutes": 60, "note": "QFTs"}, {"id": "e14", "date": "2026-06-18", "minutes": 60, "note": "QFTs"}, {"id": "e15", "date": "2026-07-07", "minutes": 60, "note": "QFTs"}, {"id": "e16", "date": "2026-07-08", "minutes": 60, "note": "QFTs"}, {"id": "e17", "date": "2026-07-11", "minutes": 240, "note": "Saturday work – QFTs / time in lieu"}, {"id": "e18", "date": "2026-07-17", "minutes": 60, "note": "QFTs"}, {"id": "e19", "date": "2026-08-25", "minutes": 60, "note": "QFTs"}, {"id": "e20", "date": "2026-08-27", "minutes": 60, "note": "QFTs"}, {"id": "e21", "date": "2026-09-08", "minutes": 60, "note": "QFTs"}], "taken": [{"id": "t1", "date": "2026-07-21", "minutes": 450, "status": "Approved", "note": "Full TOIL day"}, {"id": "t2", "date": "2026-07-22", "minutes": 450, "status": "Approved", "note": "Full TOIL day"}, {"id": "t3", "date": "2026-08-18", "minutes": 450, "status": "Rejected", "note": "Time Owing request"}, {"id": "t4", "date": "2026-09-02", "minutes": 450, "status": "Rejected", "note": "Time Owing request"}, {"id": "t5", "date": "2026-09-07", "minutes": 270, "status": "Approved", "note": "Phased return day"}, {"id": "t6", "date": "2026-12-24", "minutes": 450, "status": "Requested", "note": "Day Off from this shithole"}], "overtime": [{"id": "o1", "date": "2026-05-16", "minutes": 240, "type": "Saturday enhancement", "status": "To submit", "note": "30% additional"}, {"id": "o2", "date": "2026-06-06", "minutes": 240, "type": "Saturday enhancement", "status": "To submit", "note": "30% additional"}, {"id": "o3", "date": "2026-06-12", "minutes": 30, "type": "Paid overtime", "status": "Logged", "note": "AS overtime"}, {"id": "o4", "date": "2026-07-11", "minutes": 240, "type": "Saturday enhancement", "status": "To submit", "note": "30% additional – QFTs"}]};
const KEY = 'toil_tracker_v1';

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function loadData(){
  const raw = localStorage.getItem(KEY);
  if(!raw){ localStorage.setItem(KEY, JSON.stringify(DEFAULT_DATA)); return clone(DEFAULT_DATA); }
  try{ return JSON.parse(raw); }catch(e){ return clone(DEFAULT_DATA); }
}
let data = loadData();
function save(){ localStorage.setItem(KEY, JSON.stringify(data)); renderAll(); }

function uid(prefix){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function pad(n){ return String(n).padStart(2,'0'); }
function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function fmtDate(s){ if(!s) return ''; const d=new Date(s+'T12:00:00'); return d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); }
function fmtMinutes(m){
  m=Math.round(Number(m)||0); const h=Math.floor(m/60), min=m%60;
  if(h && min) return `${h}h ${pad(min)}m`; if(h) return `${h}h`; return `${min}m`;
}
function toMinutes(h,m){ return Math.max(0, (parseInt(h||0)*60)+(parseInt(m||0))); }
function addMonthsISO(dateStr, months){
  const [y,mo,d]=dateStr.split('-').map(Number);
  const target = new Date(y, mo-1+months, 1, 12);
  const last = new Date(target.getFullYear(), target.getMonth()+1, 0, 12).getDate();
  target.setDate(Math.min(d,last));
  return `${target.getFullYear()}-${pad(target.getMonth()+1)}-${pad(target.getDate())}`;
}
function daysBetween(aISO,bISO){
  const a=new Date(aISO+'T12:00:00'), b=new Date(bISO+'T12:00:00');
  return Math.ceil((a-b)/86400000);
}
function approvedUsed(){ return data.taken.filter(x=>x.status==='Approved').reduce((s,x)=>s+x.minutes,0); }
function pendingUsed(){ return data.taken.filter(x=>x.status==='Requested').reduce((s,x)=>s+x.minutes,0); }
function totalEarned(){ return data.earned.reduce((s,x)=>s+x.minutes,0); }
function availableNow(){ return totalEarned()-approvedUsed(); }
function afterPending(){ return availableNow()-pendingUsed(); }

function expiryRows(){
  const rows=[...data.earned].sort((a,b)=>a.date.localeCompare(b.date));
  let used=approvedUsed();
  const today=todayISO();
  return rows.map(e=>{
    const consumed=Math.min(e.minutes, Math.max(0, used));
    used-=consumed;
    const remaining=e.minutes-consumed;
    const useBy=addMonthsISO(e.date,data.settings.expiryMonths||3);
    let days=remaining?daysBetween(useBy,today):null;
    let status='Used', cls='grey';
    if(remaining){
      if(days<0){status='Expired';cls='red';}
      else if(days<=14){status='Use now';cls='red';}
      else if(days<=30){status='Use soon';cls='orange';}
      else{status='Plenty of time';cls='green';}
    }
    return {...e,remaining,useBy,days,status,cls};
  });
}

function renderHome(){
  document.getElementById('availableNow').textContent=fmtMinutes(availableNow());
  document.getElementById('afterPending').textContent=fmtMinutes(afterPending());
  document.getElementById('earnedTotal').textContent=fmtMinutes(totalEarned());
  document.getElementById('approvedTotal').textContent=fmtMinutes(approvedUsed());
  document.getElementById('pendingTotal').textContent=fmtMinutes(pendingUsed());

  const live=expiryRows().filter(x=>x.remaining>0).sort((a,b)=>a.useBy.localeCompare(b.useBy));
  const n=document.getElementById('nextExpiry');
  if(live.length){
    const x=live[0];
    n.innerHTML=`<div class="item expiry ${x.cls}"><div><div class="item-title">${fmtMinutes(x.remaining)} from ${fmtDate(x.date)}</div><div class="item-meta">Use by ${fmtDate(x.useBy)}${x.days!==null?` · ${x.days} days left`:''}</div><span class="badge ${x.cls}">${x.status}</span></div><div class="amount">${fmtMinutes(x.remaining)}</div></div>`;
  } else n.innerHTML='<div class="empty">No unused earned TOIL.</div>';
}

function renderExpiry(){
  const rows=expiryRows();
  const el=document.getElementById('expiryList');
  el.innerHTML=rows.length?rows.map(x=>`
    <div class="item expiry ${x.cls}">
      <div>
        <div class="item-title">Earned ${fmtDate(x.date)}</div>
        <div class="item-meta">Use by ${fmtDate(x.useBy)} · earned ${fmtMinutes(x.minutes)}</div>
        <span class="badge ${x.cls}">${x.status}</span>
      </div>
      <div class="amount">${fmtMinutes(x.remaining)} left</div>
    </div>`).join(''):'<div class="empty">No earned TOIL yet.</div>';
}

function statusClass(s){
  if(s==='Approved')return 'green'; if(s==='Requested')return 'orange'; if(s==='Rejected'||s==='Cancelled')return 'grey'; return 'grey';
}
function filteredHistory(){
  let all=[
    ...data.earned.map(x=>({kind:'Earned',...x})),
    ...data.taken.map(x=>({kind:'TOIL',...x}))
  ];
  const kind=document.getElementById('historyTypeFilter')?.value||'All';
  const status=document.getElementById('historyStatusFilter')?.value||'All';
  const sort=document.getElementById('historySort')?.value||'newest';
  const q=(document.getElementById('historySearch')?.value||'').trim().toLowerCase();
  if(kind!=='All') all=all.filter(x=>x.kind===kind);
  if(status!=='All') all=all.filter(x=>x.kind==='TOIL'&&x.status===status);
  if(q) all=all.filter(x=>(x.note||'').toLowerCase().includes(q)||fmtDate(x.date).toLowerCase().includes(q)||x.kind.toLowerCase().includes(q)||(x.status||'').toLowerCase().includes(q));
  all.sort((a,b)=>sort==='oldest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
  return all;
}
function renderHistory(){
  const all=filteredHistory();
  document.getElementById('historyList').innerHTML=all.length?all.map(x=>`
    <div class="item">
      <div>
        <div class="item-title">${x.kind==='Earned'?'Earned':'TOIL'} · ${fmtDate(x.date)}</div>
        <div class="item-meta">${x.note||''}</div>
        ${x.kind==='TOIL'?`<div style="margin-top:9px"><label style="display:block;margin-bottom:5px">Status</label><select onchange="updateTakenStatus('${x.id}', this.value)" style="padding:10px 12px;border-radius:12px">${['Requested','Approved','Rejected','Cancelled'].map(s=>`<option ${x.status===s?'selected':''}>${s}</option>`).join('')}</select></div>`:''}
      </div>
      <div><div class="amount">${x.kind==='Earned'?'+':'−'}${fmtMinutes(x.minutes)}</div><div class="row-actions">${x.kind==='TOIL'?`<button class="btn small ghost" onclick="editTaken('${x.id}')">Edit</button>`:''}<button class="btn small ghost" onclick="deleteEntry('${x.kind}','${x.id}')">Delete</button></div></div>
    </div>`).join(''):'<div class="empty">No entries match those filters.</div>';
}
function updateTakenStatus(id,status){const item=data.taken.find(x=>x.id===id);if(!item)return;item.status=status;save();}
window.updateTakenStatus=updateTakenStatus;
let editingTakenId=null;
function editTaken(id){
  const item=data.taken.find(x=>x.id===id);if(!item)return;
  editingTakenId=id;takeDate.value=item.date;setDuration('take',item.minutes);takeStatus.value=item.status;takeNote.value=item.note||'';
  document.getElementById('takeFormTitle').textContent='Edit TOIL entry';document.getElementById('takeSubmitBtn').textContent='Save changes';document.getElementById('cancelTakenEdit').style.display='block';showScreen('take');
}
window.editTaken=editTaken;
function cancelTakenEdit(){
  editingTakenId=null;takenForm.reset();takeDate.value=todayISO();setDuration('take',data.settings.fullDayMinutes||450);takeStatus.value='Requested';
  document.getElementById('takeFormTitle').textContent='Log TOIL request / use';document.getElementById('takeSubmitBtn').textContent='Save TOIL entry';document.getElementById('cancelTakenEdit').style.display='none';
}
window.cancelTakenEdit=cancelTakenEdit;

function renderOvertime(){
  const el=document.getElementById('overtimeList');
  const rows=[...data.overtime].sort((a,b)=>b.date.localeCompare(a.date));
  el.innerHTML=rows.length?rows.map(x=>`
    <div class="item"><div><div class="item-title">${x.type} · ${fmtDate(x.date)}</div>
    <div class="item-meta">${x.status}${x.note?' · '+x.note:''}</div></div>
    <div><div class="amount">${fmtMinutes(x.minutes)}</div>
    <div class="row-actions"><button class="btn small ghost" onclick="deleteOvertime('${x.id}')">Delete</button></div></div></div>`).join(''):'<div class="empty">No overtime logged.</div>';
}

function renderAll(){ renderHome(); renderExpiry(); renderHistory(); renderOvertime(); }

function showScreen(id){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.screen===id));
  window.scrollTo({top:0,behavior:'instant'});
}
window.showScreen=showScreen;
document.querySelectorAll('.navbtn').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));

function setDuration(prefix,mins){
  document.getElementById(prefix+'Hours').value=Math.floor(mins/60);
  document.getElementById(prefix+'Minutes').value=mins%60;
}
window.setDuration=setDuration;

document.getElementById('earnedForm').addEventListener('submit',e=>{
  e.preventDefault();
  const minutes=toMinutes(earnHours.value,earnMinutes.value);
  if(!minutes) return alert('Enter some time.');
  data.earned.push({id:uid('e'),date:earnDate.value,minutes,note:earnNote.value.trim()});
  save(); e.target.reset(); earnDate.value=todayISO(); setDuration('earn',60); showScreen('home');
});
document.getElementById('takenForm').addEventListener('submit',e=>{
  e.preventDefault();
  const minutes=toMinutes(takeHours.value,takeMinutes.value);
  if(!minutes) return alert('Enter some time.');
  if(editingTakenId){
    const item=data.taken.find(x=>x.id===editingTakenId);
    if(item){item.date=takeDate.value;item.minutes=minutes;item.status=takeStatus.value;item.note=takeNote.value.trim();}
  } else {
    data.taken.push({id:uid('t'),date:takeDate.value,minutes,status:takeStatus.value,note:takeNote.value.trim()});
  }
  save();cancelTakenEdit();showScreen('home');
});
document.getElementById('overtimeForm').addEventListener('submit',e=>{
  e.preventDefault();
  const minutes=toMinutes(otHours.value,otMinutes.value);
  if(!minutes)return alert('Enter some time.');
  data.overtime.push({id:uid('o'),date:otDate.value,minutes,type:otType.value,status:otStatus.value,note:otNote.value.trim()});
  save();e.target.reset();otDate.value=todayISO();setDuration('ot',60);renderOvertime();
});

function deleteEntry(kind,id){
  if(!confirm('Delete this entry?'))return;
  if(kind==='Earned') data.earned=data.earned.filter(x=>x.id!==id);
  else data.taken=data.taken.filter(x=>x.id!==id);
  save();
}
function deleteOvertime(id){ if(confirm('Delete this overtime entry?')){data.overtime=data.overtime.filter(x=>x.id!==id);save();} }
window.deleteEntry=deleteEntry; window.deleteOvertime=deleteOvertime;

document.getElementById('backupBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='toil-tracker-data.json';a.click();URL.revokeObjectURL(a.href);
});
document.getElementById('restoreFile').addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f)return;
  try{
    const obj=JSON.parse(await f.text());
    if(!Array.isArray(obj.earned)||!Array.isArray(obj.taken)) throw new Error(); if(!Array.isArray(obj.overtime)) obj.overtime=[]; if(!obj.settings) obj.settings={fullDayMinutes:450,expiryMonths:3};
    data=obj; save(); alert('Backup restored.');
  }catch{alert('That backup file could not be read.');}
  e.target.value='';
});
document.getElementById('resetBtn').addEventListener('click',()=>{
  if(confirm('Reset the app back to the original preloaded data?')){data=clone(DEFAULT_DATA);save();}
});

['earnDate','takeDate','otDate'].forEach(id=>document.getElementById(id).value=todayISO());
setDuration('earn',60); setDuration('take',450); setDuration('ot',60);
renderAll();

if('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
