(() => {
"use strict";
const KEY="habitflow_v1";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,"0");
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const dateFromKey=k=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
const keyFromDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(k,n)=>{const d=dateFromKey(k);d.setDate(d.getDate()+n);return keyFromDate(d)};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);

const sampleHabits=[
 ["Wake up early","Daily Routine","⏰","daily"],["Study for 2 hours","Study","📚","daily"],["Learn C programming","Study","💻","weekdays"],["Exercise","Fitness","🏃","weekdays"],["Read a book","Personal Growth","📖","daily"],["Drink enough water","Health","💧","daily"],["Meditate","Health","🧘","daily"],["Sleep on time","Daily Routine","🌙","daily"]
];
function initial(){
 const habits=sampleHabits.map((x,i)=>({id:uid(),name:x[0],category:x[1],icon:x[2],schedule:x[3],days:x[3]==="weekdays"?[1,2,3,4,5]:[0,1,2,3,4,5,6],order:i,createdAt:Date.now()}));
 return {version:1,theme:"dark",habits,logs:{},monthView:todayKey().slice(0,7)};
}
let state;
try{state=JSON.parse(localStorage.getItem(KEY)||"null")||initial()}catch(e){state=initial()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){toast("Storage is unavailable. Export a backup.")}}
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function scheduled(h,k){const d=dateFromKey(k);return h.schedule==="daily"||h.days.includes(d.getDay())}
function logFor(k){if(!state.logs[k])state.logs[k]={done:{},note:""};return state.logs[k]}
function metrics(k){
 const hs=state.habits.filter(h=>scheduled(h,k));
 const done=hs.filter(h=>logFor(k).done[h.id]).length;
 return {total:hs.length,done,pct:hs.length?Math.round(done/hs.length*100):0}
}
function future(k){return k>todayKey()}
function isPerfect(k){const m=metrics(k);return !future(k)&&m.total>0&&m.done===m.total}
function streaks(){
 let cur=0,k=todayKey();
 if(metrics(k).total===0){k=addDays(k,-1)}
 while(k>=addDays(todayKey(),-3650)&&isPerfect(k)){cur++;k=addDays(k,-1)}
 let best=0,run=0,start=addDays(todayKey(),-3650);
 for(let i=0;i<=3650;i++){const day=addDays(start,i);if(isPerfect(day))run++;else run=0;best=Math.max(best,run)}
 return {cur,best};
}
function completedDays(){let n=0;for(let k of Object.keys(state.logs))if(isPerfect(k))n++;return n}
function greeting(){const h=new Date().getHours();return h<12?"Good morning.":h<18?"Good afternoon.":"Good evening."}
function motivation(p){if(p===100)return "Perfect day. Nicely done.";if(p>=75)return "You're in the final stretch.";if(p>=40)return "Momentum is building.";if(p>0)return "One small win at a time.";return "Start small. Your future self will notice."}

function renderDashboard(){
 const k=todayKey(),m=metrics(k),s=streaks();
 $("#todayLabel").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(new Date());
 $("#greeting").textContent=greeting();$("#motivation").textContent=motivation(m.pct);$("#dateChip").textContent=new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date());
 $("#score").textContent=m.pct;$("#progressText").textContent=`${m.pct}% complete`;$("#progressMeta").textContent=`${m.done} of ${m.total} scheduled`;
 $("#currentStreak").textContent=s.cur;$("#bestStreak").textContent=s.best;$("#completedDays").textContent=completedDays();
 $("#ring").style.strokeDashoffset=314-(314*m.pct/100);
 const cats=[...new Set(state.habits.map(h=>h.category))];const cf=$("#categoryFilter");const old=cf.value;
 cf.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join("");if(cats.includes(old))cf.value=old;
 const q=$("#habitSearch").value.toLowerCase(),cat=cf.value;
 const hs=state.habits.filter(h=>scheduled(h,k)&&h.name.toLowerCase().includes(q)&&(cat==="all"||h.category===cat)).sort((a,b)=>a.order-b.order);
 $("#habitSub").textContent=`${m.done} completed · ${Math.max(0,m.total-m.done)} remaining`;
 $("#habitList").innerHTML=hs.length?hs.map(h=>`<article class="habit ${logFor(k).done[h.id]?"done":""}" data-id="${h.id}"><button class="check" data-action="toggle" aria-label="${logFor(k).done[h.id]?"Mark incomplete":"Mark complete"}">${logFor(k).done[h.id]?"✓":""}</button><div><div class="habit-name">${esc(h.icon)} ${esc(h.name)}</div><div class="habit-meta">${esc(h.category)} · ${h.schedule==="daily"?"Every day":"Selected weekdays"}</div></div><div class="habit-actions"><button class="icon-btn" data-action="edit" title="Edit">✎</button><button class="icon-btn" data-action="delete" title="Delete">×</button></div></article>`).join(""):`<div class="empty">${m.total===0?"No habits are scheduled today. Enjoy the breathing room.":"No habits match your filter."}</div>`;
 $("#dayNote").value=logFor(k).note||"";
}
function renderHistory(){
 const k=$("#historyDate").value||todayKey();$("#historyDate").value=k;
 const d=dateFromKey(k),m=metrics(k);
 $("#selectedTitle").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(d);
 $("#selectedSummary").innerHTML=`<div><b>${m.pct}%</b><span>completion</span></div><div><b>${m.done}/${m.total}</b><span>habits</span></div>`;
 const hs=state.habits.filter(h=>scheduled(h,k)).sort((a,b)=>a.order-b.order);
 $("#selectedHabits").innerHTML=hs.length?hs.map(h=>`<div class="mini-item"><span>${esc(h.icon)} ${esc(h.name)}</span><b>${logFor(k).done[h.id]?"✓":"—"}</b></div>`).join(""):"<div class='empty'>No scheduled habits.</div>";
 $("#historyNote").value=logFor(k).note||"";
 renderCalendar();
}
function renderCalendar(){
 const base=($("#historyDate").value||todayKey()).slice(0,7),[y,mo]=base.split("-").map(Number),first=new Date(y,mo-1,1),days=new Date(y,mo,0).getDate();
 $("#monthTitle").textContent=new Intl.DateTimeFormat(undefined,{month:"long",year:"numeric"}).format(first);
 const cells=[];for(let i=0;i<first.getDay();i++)cells.push("<div></div>");
 for(let n=1;n<=days;n++){const d=new Date(y,mo-1,n),k=keyFromDate(d),m=metrics(k),level=m.pct===100?4:m.pct>=75?3:m.pct>=40?2:m.pct>0?1:0;cells.push(`<button class="cal-day ${k===$("#historyDate").value?"selected":""} ${future(k)?"future":""}" data-day="${k}" ${future(k)?"disabled":""}><span class="cal-num">${n}</span><i class="heat l${level}"></i></button>`)}
 $("#calendar").innerHTML=cells.join("");
}
function renderReports(range=Number(document.querySelector(".range-tabs button.active")?.dataset.range||7)){
 const keys=[];for(let i=range-1;i>=0;i--)keys.push(addDays(todayKey(),-i));const vals=keys.map(metrics),valid=vals.filter(x=>x.total),avg=valid.length?Math.round(valid.reduce((a,b)=>a+b.pct,0)/valid.length):0;
 $("#reportAvg").textContent=`${avg}% average`;
 drawChart(keys,vals);
 const now=new Date(),prefix=`${now.getFullYear()}-${pad(now.getMonth()+1)}`,monthKeys=keysForMonth(prefix).filter(k=>k<=todayKey()),mm=monthKeys.map(metrics),mv=mm.filter(x=>x.total),mavg=mv.length?Math.round(mv.reduce((a,b)=>a+b.pct,0)/mv.length):0,best=mv.length?Math.max(...mv.map(x=>x.pct)):0,done=mv.reduce((a,b)=>a+b.done,0);
 $("#monthReport").innerHTML=`<div class="report-row"><span>Completion</span><b>${mavg}%</b></div><div class="report-row"><span>Completed habits</span><b>${done}</b></div><div class="report-row"><span>Best day</span><b>${best}%</b></div><div class="report-row"><span>Days tracked</span><b>${mv.length}</b></div>`;
 const s=streaks();$("#consistencyReport").innerHTML=`<div class="report-row"><span>Current streak</span><b>${s.cur}d</b></div><div class="report-row"><span>Longest streak</span><b>${s.best}d</b></div><div class="report-row"><span>Perfect days</span><b>${completedDays()}</b></div>`;
}
function keysForMonth(prefix){const [y,m]=prefix.split("-").map(Number),n=new Date(y,m,0).getDate();return Array.from({length:n},(_,i)=>`${prefix}-${pad(i+1)}`)}
function drawChart(keys,vals){
 const c=$("#trendCanvas"),ctx=c.getContext("2d"),rect=c.getBoundingClientRect(),dpr=devicePixelRatio||1,w=Math.max(300,rect.width),h=240;
 c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const p={l:36,r:12,t:16,b:35},cw=w-p.l-p.r,ch=h-p.t-p.b;
 ctx.strokeStyle="rgba(255,255,255,.08)";ctx.fillStyle="#7f8a84";ctx.font="11px system-ui";
 [0,25,50,75,100].forEach(v=>{const y=p.t+ch-(v/100)*ch;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText(v+"%",4,y+4)});
 const pts=vals.map((v,i)=>[p.l+(keys.length===1?cw/2:(i/(keys.length-1))*cw),p.t+ch-(v.pct/100)*ch]);
 ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.strokeStyle="#22c55e";ctx.lineWidth=3;ctx.stroke();
 pts.forEach((q,i)=>{ctx.beginPath();ctx.arc(q[0],q[1],4,0,Math.PI*2);ctx.fillStyle=vals[i].pct===100?"#a7f3d0":"#22c55e";ctx.fill();});
 ctx.fillStyle="#7f8a84";ctx.textAlign="center";keys.forEach((k,i)=>{if(i%Math.ceil(keys.length/7)===0||i===keys.length-1)ctx.fillText(k.slice(5),pts[i][0],h-10)});ctx.textAlign="left";
 c.onmousemove=e=>{const r=c.getBoundingClientRect(),x=e.clientX-r.left;let idx=0,b=Infinity;pts.forEach((q,i)=>{const z=Math.abs(q[0]-x);if(z<b){b=z;idx=i}});const q=pts[idx];ctx.clearRect(0,0,w,h); // redraw
 drawChartStatic(ctx,w,h,keys,vals,pts,p,cw,ch);
 c.title=`${keys[idx]} · ${vals[idx].done}/${vals[idx].total} · ${vals[idx].pct}%`;
 };
}
function drawChartStatic(ctx,w,h,keys,vals,pts,p,cw,ch){
 ctx.strokeStyle="rgba(255,255,255,.08)";ctx.fillStyle="#7f8a84";ctx.font="11px system-ui";[0,25,50,75,100].forEach(v=>{const y=p.t+ch-(v/100)*ch;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText(v+"%",4,y+4)});ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.strokeStyle="#22c55e";ctx.lineWidth=3;ctx.stroke();pts.forEach((q,i)=>{ctx.beginPath();ctx.arc(q[0],q[1],4,0,Math.PI*2);ctx.fillStyle=vals[i].pct===100?"#a7f3d0":"#22c55e";ctx.fill()});ctx.fillStyle="#7f8a84";ctx.textAlign="center";keys.forEach((k,i)=>{if(i%Math.ceil(keys.length/7)===0||i===keys.length-1)ctx.fillText(k.slice(5),pts[i][0],h-10)});ctx.textAlign="left";
}
function openModal(h=null){
 $("#modalTitle").textContent=h?"Edit habit":"Add habit";$("#habitId").value=h?.id||"";$("#habitName").value=h?.name||"";$("#habitCategory").value=h?.category||"Daily Routine";$("#habitSchedule").value=h?.schedule||"daily";$("#habitIcon").value=h?.icon||"✓";
 const days=h?.days||[0,1,2,3,4,5,6];$("#weekdayPicker").innerHTML=["S","M","T","W","T","F","S"].map((x,i)=>`<label>${x}<input type="checkbox" value="${i}" ${days.includes(i)?"checked":""}></label>`).join("");$("#weekdayPicker").style.display=$("#habitSchedule").value==="daily"?"none":"grid";$("#modal").classList.add("open");$("#modal").setAttribute("aria-hidden","false");setTimeout(()=>$("#habitName").focus(),50);
}
function closeModal(){$("#modal").classList.remove("open");$("#modal").setAttribute("aria-hidden","true")}
function navigate(page){
 $$(".page").forEach(x=>x.classList.toggle("active",x.id===page+"Page"));$$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 if(page==="dashboard")renderDashboard();if(page==="history")renderHistory();if(page==="reports")renderReports();
}
function exportJSON(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`habitflow-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exported")
}
function exportCSV(){
 const rows=[["date","habit","category","scheduled","completed","completion_percent"]];
 const start=addDays(todayKey(),-365),end=todayKey();
 for(let k=start;k<=end;k=addDays(k,1)){const hs=state.habits.filter(h=>scheduled(h,k));for(const h of hs)rows.push([k,h.name,h.category,"yes",logFor(k).done[h.id]?"yes":"no",metrics(k).pct])}
 const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`habitflow-history-${todayKey()}.csv`;a.click();URL.revokeObjectURL(a.href);toast("CSV exported")
}
function importJSON(file){
 const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||!Array.isArray(x.habits)||typeof x.logs!=="object")throw Error();state=x;save();renderAll();toast("Backup restored")}catch(e){toast("Invalid backup file")}};r.readAsText(file)
}
function renderAll(){document.body.classList.toggle("light",state.theme==="light");renderDashboard();renderHistory();renderReports()}

document.addEventListener("click",e=>{
 const page=e.target.closest("[data-page]");if(page){navigate(page.dataset.page);return}
 const act=e.target.closest("[data-action]");if(act){const h=state.habits.find(x=>x.id===act.closest(".habit").dataset.id),a=act.dataset.action;if(a==="toggle"){const k=todayKey(),l=logFor(k);l.done[h.id]=!l.done[h.id];save();renderDashboard()}if(a==="edit")openModal(h);if(a==="delete"&&confirm(`Delete "${h.name}"? This cannot be undone.`)){state.habits=state.habits.filter(x=>x.id!==h.id);save();renderDashboard()}return}
 if(e.target.matches("[data-close-modal]"))closeModal();
 const day=e.target.closest("[data-day]");if(day&&!day.disabled){$("#historyDate").value=day.dataset.day;renderHistory()}
});
$("#addHabitTop").onclick=()=>openModal();$("#manageHabits").onclick=()=>openModal();
$("#modal").addEventListener("click",e=>{if(e.target.matches("[data-close-modal]"))closeModal()});
$("#habitSchedule").onchange=e=>$("#weekdayPicker").style.display=e.target.value==="daily"?"none":"grid";
$("#habitForm").onsubmit=e=>{e.preventDefault();const id=$("#habitId").value,name=$("#habitName").value.trim();if(!name)return;const schedule=$("#habitSchedule").value,days=$$("#weekdayPicker input:checked").map(x=>Number(x.value));if(schedule==="weekdays"&&!days.length){toast("Choose at least one weekday");return}if(id){const h=state.habits.find(x=>x.id===id);Object.assign(h,{name,category:$("#habitCategory").value,schedule,days:schedule==="daily"?[0,1,2,3,4,5,6]:days,icon:$("#habitIcon").value.trim()||"✓"})}else state.habits.push({id:uid(),name,category:$("#habitCategory").value,schedule,days:schedule==="daily"?[0,1,2,3,4,5,6]:days,icon:$("#habitIcon").value.trim()||"✓",order:state.habits.length,createdAt:Date.now()});save();closeModal();renderAll();toast(id?"Habit updated":"Habit added")};
$("#habitSearch").oninput=renderDashboard;$("#categoryFilter").onchange=renderDashboard;
$("#dayNote").oninput=e=>{logFor(todayKey()).note=e.target.value;save()};
$("#historyNote").oninput=e=>{logFor($("#historyDate").value).note=e.target.value;save()};
$("#historyDate").onchange=renderHistory;
$("#prevMonth").onclick=()=>{const d=dateFromKey($("#historyDate").value);d.setDate(1);d.setMonth(d.getMonth()-1);$("#historyDate").value=keyFromDate(d);renderHistory()};
$("#nextMonth").onclick=()=>{const d=dateFromKey($("#historyDate").value);d.setDate(1);d.setMonth(d.getMonth()+1);if(keyFromDate(d)>todayKey())d=dateFromKey(todayKey());$("#historyDate").value=keyFromDate(d);renderHistory()};
$$(".range-tabs button").forEach(b=>b.onclick=()=>{$$(".range-tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderReports(Number(b.dataset.range))});
$("#themeBtn").onclick=()=>{state.theme=state.theme==="light"?"dark":"light";save();renderAll()};
$("#exportJson").onclick=exportJSON;$("#exportCsv").onclick=exportCSV;$("#importJson").onclick=()=>$("#fileInput").click();$("#fileInput").onchange=e=>e.target.files[0]&&importJSON(e.target.files[0]);
$("#resetData").onclick=()=>{if(confirm("Reset all habits and history to demo data?")){state=initial();save();renderAll();toast("Demo data restored")}};
window.addEventListener("resize",()=>{if($("#reportsPage").classList.contains("active"))renderReports()});
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
renderAll();
})();