const CATEGORIES = {
  expense: ["Food & dining","Transport","Shopping","Bills & utilities","Entertainment","Health","Education","Travel","Groceries","Other"],
  income: ["Salary","Freelance","Business","Investment","Gift","Other"]
};
const CATEGORY_META = {
  "Food & dining":["fa-utensils","#f0a34a"],"Transport":["fa-car","#5e9bea"],"Shopping":["fa-bag-shopping","#a58ae8"],
  "Bills & utilities":["fa-bolt","#e5bb55"],"Entertainment":["fa-film","#e47f9b"],"Health":["fa-heart-pulse","#e87979"],
  "Education":["fa-graduation-cap","#57b89b"],"Travel":["fa-plane","#5dabbc"],"Groceries":["fa-basket-shopping","#85b66a"],
  "Other":["fa-ellipsis","#9aa5b8"],"Salary":["fa-briefcase","#21a77c"],"Freelance":["fa-laptop","#5e9bea"],
  "Business":["fa-store","#a58ae8"],"Investment":["fa-chart-line","#d7a448"],"Gift":["fa-gift","#e47f9b"]
};
const STORE_KEY = "spendwise_data_v1"; // legacy key, used for one-time migration
const PROFILES_KEY = "spendwise_profiles_v1";
const ACTIVE_PROFILE_KEY = "spendwise_active_profile_v1";
const THEME_KEY = "spendwise_theme";
const CURRENCY_CODES = ["INR","USD","EUR","GBP","AED","CAD","AUD"];
// Local-time date helpers. Converting dates to UTC strings shifts the date/month by a day for anyone
// ahead of UTC (e.g. IST, roughly 12:00-5:30 AM), which breaks month grouping in the charts.
const pad2 = n => String(n).padStart(2,"0");
const localISO = (d=new Date()) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const todayISO = () => localISO();
const currentMonthKey = () => localISO().slice(0,7);
const monthKeysBack = count => { const now=new Date(), keys=[]; for(let i=count-1;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); keys.push(`${d.getFullYear()}-${pad2(d.getMonth()+1)}`) } return keys; };
const reportingCurrency = () => document.getElementById("reportCurrency")?.value || "INR";
const currencySymbol = code => ({INR:"₹",USD:"$",EUR:"€",GBP:"£",AED:"د.إ",CAD:"CA$",AUD:"A$"}[code] || code+" ");
const money = (n, code=reportingCurrency()) => new Intl.NumberFormat("en-IN",{style:"currency",currency:CURRENCY_CODES.includes(code)?code:"INR",maximumFractionDigits:2}).format(Number(n)||0);
const amountForTransaction = t => money(t.amount,t.currency||"INR");
const selectedCurrencyTransactions = (list=data.transactions) => list.filter(t=>(t.currency||"INR")===reportingCurrency());
const uid = () => "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const prettyDate = s => s ? new Date(s+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const monthKey = s => (s||"").slice(0,7);
const monthName = key => new Date(key+"-01T00:00:00").toLocaleDateString("en-IN",{month:"short",year:"2-digit"});
const safe = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defaultData = () => ({transactions:[],budgets:[],goals:[],recurring:[],demoLoaded:false,baseCurrency:"INR"});
let profiles = loadProfiles(), activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY) || profiles[0]?.id, data = (profiles.find(p=>p.id===activeProfileId)?.data) || defaultData(), cashChart=null, catChart=null, analyticsCatChart=null, analyticsFlowChart=null, toastTimer;
function loadProfiles(){
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILES_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return saved.map(p=>({...p,data:{...defaultData(),...(p.data||{})}}));
  } catch {}
  // Migrate data from the first single-workspace version so existing entries are preserved.
  let legacy = defaultData();
  try { legacy = {...defaultData(), ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}")}; } catch {}
  const initial = {id:uid(),name:"My Workspace",email:"Personal account",data:legacy};
  localStorage.setItem(PROFILES_KEY, JSON.stringify([initial]));
  localStorage.setItem(ACTIVE_PROFILE_KEY, initial.id);
  return [initial];
}
function activeProfile(){return profiles.find(p=>p.id===activeProfileId) || profiles[0]}
function persistProfiles(){localStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));localStorage.setItem(ACTIVE_PROFILE_KEY,activeProfileId)}
function saveData(){const p=activeProfile();if(p)p.data=data;persistProfiles();renderAll()}
function toast(msg){const el=document.getElementById("toast");document.getElementById("toastText").textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400)}
function categoryIcon(cat){return CATEGORY_META[cat]?.[0]||"fa-circle"}
function categoryColor(cat){return CATEGORY_META[cat]?.[1]||"#9aa5b8"}
function fillCategorySelect(select,kind="expense",includeAll=false){select.innerHTML=(includeAll?'<option value="all">All categories</option>':"")+CATEGORIES[kind].map(c=>`<option value="${safe(c)}">${safe(c)}</option>`).join("")}
function allCategories(){return [...new Set([...CATEGORIES.expense,...CATEGORIES.income])]}
function totals(list=data.transactions){list=selectedCurrencyTransactions(list);const income=list.filter(t=>t.type==="income").reduce((a,t)=>a+Number(t.amount),0);const expense=list.filter(t=>t.type==="expense").reduce((a,t)=>a+Number(t.amount),0);return {income,expense,balance:income-expense,savings:income?((income-expense)/income)*100:0}}
function monthTransactions(key){return selectedCurrencyTransactions(data.transactions).filter(t=>monthKey(t.date)===key)}
function expenseByCategory(list){const out={};list.filter(t=>t.type==="expense").forEach(t=>out[t.category]=(out[t.category]||0)+Number(t.amount));return out}
function renderAll(){renderDashboard();renderTransactions();renderAnalytics();renderBudgets();renderGoals();renderRecurring();renderProfileIdentity()}
function renderDashboard(){
 const t=totals();document.getElementById("totalBalance").textContent=money(t.balance);document.getElementById("totalIncome").textContent=money(t.income);document.getElementById("totalExpense").textContent=money(t.expense);document.getElementById("savingsRate").textContent=`${Math.max(0,t.savings).toFixed(1)}%`;
 const month=currentMonthKey(), monthList=monthTransactions(month), cats=expenseByCategory(monthList), catTotal=Object.values(cats).reduce((a,b)=>a+b,0);
 document.getElementById("donutTotal").textContent=money(catTotal);
 drawDoughnut("categoryChart",cats,catChart,c=>catChart=c);
 document.getElementById("categoryLegend").innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([c,v])=>`<div class="legend-item"><span class="legend-dot" style="background:${categoryColor(c)}"></span>${safe(c)}<strong>${Math.round(catTotal?v/catTotal*100:0)}%</strong></div>`).join("")||'<span class="muted">No expenses this month yet.</span>';
 drawCashflow();
 const recent=[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
 document.getElementById("recentTransactions").innerHTML=recent.map(transactionRow).join("")||'<div class="empty-state"><i class="fa-solid fa-receipt"></i><strong>No transactions yet</strong><span>Add your first transaction to populate the dashboard.</span></div>';
 const budgets=data.budgets.filter(b=>(b.currency||"INR")===reportingCurrency()).slice(0,4);document.getElementById("budgetPreview").innerHTML=budgets.map(b=>{const spent=monthList.filter(t=>t.type==="expense"&&t.category===b.category).reduce((a,t)=>a+Number(t.amount),0);const pct=Math.min(100,spent/b.amount*100);return `<div class="budget-preview-item"><div class="budget-preview-top"><strong>${safe(b.category)}</strong><span>${money(spent,reportingCurrency())} / ${money(b.amount,b.currency||"INR")}</span></div><div class="progress-track"><div class="progress-fill ${pct>=100?"danger":pct>=80?"warning":""}" style="width:${pct}%"></div></div></div>`}).join("")||'<div class="empty-state"><span>No budgets created yet.</span></div>';
}
function transactionRow(t){return `<div class="transaction-row"><div class="transaction-main"><span class="category-icon"><i class="fa-solid ${categoryIcon(t.category)}"></i></span><div><strong>${safe(t.title)}</strong><small>${safe(t.category)} · ${prettyDate(t.date)}</small></div></div><div class="transaction-amount ${t.type}">${t.type==="income"?"+":"−"}${amountForTransaction(t)}</div></div>`}
function drawDoughnut(id,cats,old,setter){const canvas=document.getElementById(id);if(!canvas)return;if(old)old.destroy();const labels=Object.keys(cats),values=Object.values(cats);const chart=new Chart(canvas,{type:"doughnut",data:{labels,datasets:[{data:values,backgroundColor:labels.map(categoryColor),borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:"73%",plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${money(c.raw)}`}}}}});setter(chart)}
function drawCashflow(){const count=Number(document.getElementById("cashflowRange")?.value||6),keys=monthKeysBack(count);const income=keys.map(k=>totals(monthTransactions(k)).income),expense=keys.map(k=>totals(monthTransactions(k)).expense);if(cashChart)cashChart.destroy();cashChart=new Chart(document.getElementById("cashflowChart"),{type:"bar",data:{labels:keys.map(monthName),datasets:[{label:"Income",data:income,backgroundColor:"#24b58a",borderRadius:5,barPercentage:.55},{label:"Expenses",data:expense,backgroundColor:"#8d83f1",borderRadius:5,barPercentage:.55}]},options:chartOptions(true)})}
function chartOptions(legend=false){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:legend,position:"bottom",labels:{color:getComputedStyle(document.body).getPropertyValue("--muted"),usePointStyle:true,boxWidth:7,font:{size:10}}}},scales:{x:{grid:{display:false},ticks:{color:getComputedStyle(document.body).getPropertyValue("--muted"),font:{size:9}},border:{display:false}},y:{grid:{color:getComputedStyle(document.body).getPropertyValue("--line")},ticks:{color:getComputedStyle(document.body).getPropertyValue("--muted"),font:{size:9},callback:v=>currencySymbol(reportingCurrency())+v},border:{display:false}}}}}
function renderTransactions(){
 const search=(document.getElementById("transactionSearch")?.value||"").toLowerCase(),type=document.getElementById("typeFilter")?.value||"all",cat=document.getElementById("categoryFilter")?.value||"all",sort=document.getElementById("sortFilter")?.value||"newest";
 let list=data.transactions.filter(t=>(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)&&(`${t.title} ${t.category} ${t.note||""}`).toLowerCase().includes(search));
 list.sort((a,b)=>sort==="oldest"?a.date.localeCompare(b.date):sort==="highest"?b.amount-a.amount:sort==="lowest"?a.amount-b.amount:b.date.localeCompare(a.date));
 document.getElementById("transactionSummary").textContent=`Showing ${list.length} of ${data.transactions.length} transactions`;
 document.getElementById("transactionTable").innerHTML=list.map(t=>`<tr><td>${safe(t.title)}${t.note?`<div class="muted" style="font-size:9px;font-weight:400;margin-top:3px">${safe(t.note)}</div>`:""}</td><td><span class="legend-item"><span class="legend-dot" style="background:${categoryColor(t.category)}"></span>${safe(t.category)}</span></td><td>${prettyDate(t.date)}</td><td><span class="type-pill ${t.type}">${t.type}</span></td><td class="align-right" style="font-weight:700;color:${t.type==="income"?"var(--green)":"var(--text)"}">${t.type==="income"?"+":"−"}${amountForTransaction(t)}</td><td><div class="row-actions"><button class="mini-action edit-transaction" data-id="${t.id}" title="Edit"><i class="fa-solid fa-pen"></i></button><button class="mini-action delete-transaction" data-id="${t.id}" title="Delete"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join("");
 document.getElementById("transactionEmpty").classList.toggle("hidden",list.length>0);
 const cf=document.getElementById("categoryFilter");const current=cf.value;cf.innerHTML='<option value="all">All categories</option>'+allCategories().map(c=>`<option>${safe(c)}</option>`).join("");cf.value=current;
}
function renderAnalytics(){const period=document.getElementById("analyticsPeriod")?.value||"month";const list=period==="all"?selectedCurrencyTransactions():monthTransactions(currentMonthKey());const t=totals(list);document.getElementById("analyticsIncome").textContent=money(t.income);document.getElementById("analyticsExpense").textContent=money(t.expense);document.getElementById("analyticsSavings").textContent=money(t.balance);const cats=expenseByCategory(list);
 if(analyticsCatChart)analyticsCatChart.destroy();analyticsCatChart=new Chart(document.getElementById("analyticsCategoryChart"),{type:"bar",data:{labels:Object.keys(cats),datasets:[{data:Object.values(cats),backgroundColor:Object.keys(cats).map(categoryColor),borderRadius:6}]},options:(()=>{const base=chartOptions(false);return {...base,indexAxis:"y",plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>money(c.raw)}}},scales:{x:base.scales.y,y:base.scales.x}}})()});
 const keys=monthKeysBack(6);if(analyticsFlowChart)analyticsFlowChart.destroy();analyticsFlowChart=new Chart(document.getElementById("analyticsFlowChart"),{type:"line",data:{labels:keys.map(monthName),datasets:[{label:"Income",data:keys.map(k=>totals(monthTransactions(k)).income),borderColor:"#24b58a",backgroundColor:"rgba(36,181,138,.1)",fill:true,tension:.35},{label:"Expenses",data:keys.map(k=>totals(monthTransactions(k)).expense),borderColor:"#8d83f1",backgroundColor:"rgba(141,131,241,.08)",fill:true,tension:.35}]},options:chartOptions(true)});
 const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];document.getElementById("spendingInsight").textContent=top?`Your highest spending category ${period==="all"?"overall":"this month"} is ${top[0]} at ${money(top[1])}. ${t.income>0?`Your savings rate for this period is ${Math.max(0,t.savings).toFixed(1)}%.`:"Add income records to calculate a savings rate."}`:"Add expense transactions to generate a spending insight."}
function renderBudgets(){const key=currentMonthKey(),monthList=monthTransactions(key),spent=monthList.filter(t=>t.type==="expense").reduce((a,t)=>a+Number(t.amount),0),totalLimit=data.budgets.filter(b=>(b.currency||"INR")===reportingCurrency()).reduce((a,b)=>a+Number(b.amount),0);document.getElementById("budgetOverview").innerHTML=`<div class="overview-tile"><span>Total monthly limits</span><strong>${money(totalLimit)}</strong></div><div class="overview-tile"><span>Spent this month</span><strong>${money(spent)}</strong></div><div class="overview-tile"><span>Remaining budget</span><strong>${money(totalLimit-spent)}</strong></div>`;
 document.getElementById("budgetGrid").innerHTML=data.budgets.filter(b=>(b.currency||"INR")===reportingCurrency()).map(b=>{const used=monthList.filter(t=>t.type==="expense"&&t.category===b.category).reduce((a,t)=>a+Number(t.amount),0),pct=used/b.amount*100;return `<article class="budget-card"><div class="budget-card-top"><div class="budget-name"><span class="category-icon"><i class="fa-solid ${categoryIcon(b.category)}"></i></span>${safe(b.category)}</div><div class="row-actions"><button class="mini-action edit-budget" data-id="${b.id}"><i class="fa-solid fa-pen"></i></button><button class="mini-action delete-budget" data-id="${b.id}"><i class="fa-solid fa-trash"></i></button></div></div><div class="budget-amount">${money(used,reportingCurrency())} <span class="muted" style="font-size:11px;font-weight:500">/ ${money(b.amount,b.currency||"INR")}</span></div><div class="budget-sub">${Math.max(0,b.amount-used)>=0?money(Math.max(0,b.amount-used))+" remaining":money(used-b.amount)+" over budget"}</div><div class="progress-track"><div class="progress-fill ${pct>=100?"danger":pct>=80?"warning":""}" style="width:${Math.min(100,pct)}%"></div></div><div class="budget-card-foot"><span>${Math.round(pct)}% used</span><span>${pct>=100?"Limit exceeded":pct>=80?"Approaching limit":"On track"}</span></div></article>`}).join("");document.getElementById("budgetEmpty").classList.toggle("hidden",data.budgets.length>0)}
function renderGoals(){document.getElementById("goalGrid").innerHTML=data.goals.map(g=>{const pct=Math.min(100,g.saved/g.target*100);return `<article class="goal-card"><div class="goal-card-top"><span class="category-icon"><i class="fa-solid fa-bullseye"></i></span><div class="row-actions"><button class="mini-action add-to-goal" data-id="${g.id}" title="Add savings"><i class="fa-solid fa-plus"></i></button><button class="mini-action edit-goal" data-id="${g.id}" title="Edit"><i class="fa-solid fa-pen"></i></button><button class="mini-action delete-goal" data-id="${g.id}" title="Delete"><i class="fa-solid fa-trash"></i></button></div></div><h3>${safe(g.name)}</h3><p>${g.date?"Target date: "+prettyDate(g.date):"No target date set"}</p><div class="goal-progress"><div class="goal-progress-top"><span>${money(g.saved,g.currency||"INR")} saved</span><strong>${Math.round(pct)}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="budget-card-foot"><span>Target: ${money(g.target,g.currency||"INR")}</span><span>${money(Math.max(0,g.target-g.saved),g.currency||"INR")} to go</span></div></div></article>`}).join("");document.getElementById("goalEmpty").classList.toggle("hidden",data.goals.length>0)}
function renderRecurring(){document.getElementById("recurringTable").innerHTML=data.recurring.map(r=>`<tr><td>${safe(r.name)}</td><td>${safe(r.category)}</td><td>${safe(r.frequency)}</td><td>${prettyDate(r.date)}</td><td class="align-right" style="font-weight:700">${money(r.amount,r.currency||"INR")}</td><td><div class="row-actions"><button class="mini-action delete-recurring" data-id="${r.id}"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join("");document.getElementById("recurringEmpty").classList.toggle("hidden",data.recurring.length>0)}

function initials(name){return (name||"SW").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"SW"}
function renderProfileIdentity(){
  const p=activeProfile(); if(!p)return;
  const currencySelect=document.getElementById("reportCurrency");if(currencySelect)currencySelect.value=p.data?.baseCurrency||"INR";
  const row=document.querySelector(".profile-row");
  if(row){row.querySelector(".avatar").textContent=initials(p.name);row.querySelector("div:nth-child(2) strong").textContent=p.name;row.querySelector("div:nth-child(2) small").textContent=p.email||"Local profile"}
}
function openProfileModal(){
  const p=activeProfile();document.getElementById("profileModalBackdrop").classList.remove("hidden");
  document.getElementById("profileFormMode").value="edit";
  document.getElementById("profileModalTitle").textContent="Manage profiles";
  document.getElementById("profileNameInput").value=p?.name||"";
  document.getElementById("profileEmailInput").value=p?.email||"";
  document.getElementById("saveProfileBtn").innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save profile';
  document.getElementById("cancelNewProfile").classList.add("hidden");
  renderProfileList();
}
function renderProfileList(){
  document.getElementById("profileList").innerHTML=profiles.map(p=>`<div class="profile-list-item ${p.id===activeProfileId?"current":""}">
    <div class="profile-list-avatar">${safe(initials(p.name))}</div>
    <div class="profile-list-info"><strong>${safe(p.name)}</strong><small>${safe(p.email||"Local profile")}</small></div>
    ${p.id===activeProfileId?'<span class="active-profile-tag">Active</span>':`<button class="secondary-button switch-profile" data-id="${p.id}">Switch</button>`}
    ${profiles.length>1?`<button class="mini-action remove-profile" data-id="${p.id}" title="Delete profile"><i class="fa-solid fa-trash"></i></button>`:""}
  </div>`).join("");
}
function startNewProfile(){
  document.getElementById("profileFormMode").value="new";
  document.getElementById("profileModalTitle").textContent="Create local profile";
  document.getElementById("profileNameInput").value="";
  document.getElementById("profileEmailInput").value="";
  document.getElementById("saveProfileBtn").innerHTML='<i class="fa-solid fa-plus"></i> Create profile';
  document.getElementById("cancelNewProfile").classList.remove("hidden");
  document.getElementById("profileNameInput").focus();
}
function closeProfileModal(){document.getElementById("profileModalBackdrop").classList.add("hidden")}
function switchProfile(id){
  const next=profiles.find(p=>p.id===id);if(!next)return;
  activeProfileId=id;data={...defaultData(),...(next.data||{})};persistProfiles();closeProfileModal();renderAll();switchView("dashboard");toast(`Switched to ${next.name}`);
}

function switchView(view){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));const titles={dashboard:"Overview",import:"Import statement",transactions:"Transactions",analytics:"Financial insights",budgets:"Budgets",goals:"Savings goals",recurring:"Recurring",settings:"Settings & data"};document.getElementById("pageTitle").textContent=titles[view]||"Overview";document.getElementById("sidebar").classList.remove("open");if(view==="analytics")renderAnalytics()}
function openTransactionModal(t=null){document.getElementById("modalBackdrop").classList.remove("hidden");document.getElementById("modalTitle").textContent=t?"Edit transaction":"Add transaction";document.getElementById("editId").value=t?.id||"";document.getElementById("transactionTitle").value=t?.title||"";document.getElementById("transactionAmount").value=t?.amount||"";document.getElementById("transactionCurrency").value=t?.currency||reportingCurrency();document.getElementById("transactionDate").value=t?.date||todayISO();document.getElementById("transactionNote").value=t?.note||"";document.getElementById("transactionType").value=t?.type||"expense";setSegment(t?.type||"expense");fillCategorySelect(document.getElementById("transactionCategory"),t?.type||"expense");document.getElementById("transactionCategory").value=t?.category||CATEGORIES[t?.type||"expense"][0];}
function closeModal(){document.getElementById("modalBackdrop").classList.add("hidden")}
function setSegment(kind){document.getElementById("transactionType").value=kind;document.querySelectorAll(".segment").forEach(b=>b.classList.toggle("active",b.dataset.kind===kind));const sel=document.getElementById("transactionCategory"),old=sel.value;fillCategorySelect(sel,kind);if(CATEGORIES[kind].includes(old))sel.value=old}
function openBudgetModal(b=null){document.getElementById("budgetModalBackdrop").classList.remove("hidden");document.getElementById("budgetModalTitle").textContent=b?"Edit budget":"Create budget";document.getElementById("budgetEditId").value=b?.id||"";fillCategorySelect(document.getElementById("budgetCategory"),"expense");document.getElementById("budgetCategory").value=b?.category||CATEGORIES.expense[0];document.getElementById("budgetAmount").value=b?.amount||""}
function openGoalModal(g=null){document.getElementById("goalModalBackdrop").classList.remove("hidden");document.getElementById("goalModalTitle").textContent=g?"Edit savings goal":"Create savings goal";document.getElementById("goalEditId").value=g?.id||"";document.getElementById("goalName").value=g?.name||"";document.getElementById("goalTarget").value=g?.target||"";document.getElementById("goalSaved").value=g?.saved||0;document.getElementById("goalDate").value=g?.date||""}
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function exportCSV(){const rows=[["Title","Type","Category","Amount","Currency","Date","Note"],...data.transactions.map(t=>[t.title,t.type,t.category,t.amount,t.currency||"INR",t.date,t.note||""])];const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");download("spendwise-transactions.csv",csv,"text/csv");toast("CSV exported")}

let pendingCsv = null;
function parseCSV(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){cell+='"';i++}
    else if(ch==='"'){quoted=!quoted}
    else if(ch===","&&!quoted){row.push(cell);cell=""}
    else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&next==="\n")i++;row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);row=[];cell=""}
    else cell+=ch;
  }
  if(cell.length||row.length){row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row)}
  if(!rows.length)return {headers:[],records:[]};
  const headers=rows[0].map((h,i)=>h.trim()||`Column ${i+1}`);
  return {headers,records:rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||"").trim()])))};
}
function guessColumn(headers,patterns){return headers.find(h=>patterns.some(p=>p.test(h)))||""}
function normalizeDate(value){
  if(!value)return "";
  const s=String(value).trim();
  if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)){const [y,m,d]=s.split("-");return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`}
  const d=new Date(s);if(!Number.isNaN(d.getTime()))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);if(m){let y=Number(m[3]);if(y<100)y+=2000;return `${y}-${String(Number(m[2])).padStart(2,"0")}-${String(Number(m[1])).padStart(2,"0")}`}
  return "";
}
function parseAmount(v){if(v===undefined||v===null)return 0;const n=Number(String(v).replace(/[₹$€£,\s]/g,"").replace(/[()]/g,""));return Number.isFinite(n)?Math.abs(n):0}
function guessCategory(description,type){
  const s=String(description||"").toLowerCase();
  const rules=[
    ["Food & dining",/swiggy|zomato|restaurant|cafe|food|domino|pizza|mcdonald|starbucks/],
    ["Transport",/uber|ola|rapido|metro|petrol|fuel|parking|irctc|bus|cab/],
    ["Shopping",/amazon|flipkart|myntra|shopping|mall|retail/],
    ["Bills & utilities",/electricity|water bill|gas bill|mobile recharge|broadband|internet bill/],
    ["Entertainment",/netflix|spotify|prime video|hotstar|movie|cinema|bookmyshow/],
    ["Health",/pharmacy|medical|hospital|clinic|apollo|medicine/],
    ["Education",/college|university|course|udemy|coursera|books|education/],
    ["Travel",/hotel|airline|flight|makemytrip|goibibo|booking.com/],
    ["Groceries",/grocery|supermarket|dmart|bigbasket|blinkit|zepto/]
  ];
  for(const [category,regex] of rules)if(regex.test(s))return category;
  if(type==="income"){if(/salary|payroll/.test(s))return "Salary";if(/freelance|consult/.test(s))return "Freelance";if(/interest|dividend|investment/.test(s))return "Investment"}
  return "Other";
}
function csvMappingOptions(id,headers,selected,allowBlank=false){
  const el=document.getElementById(id);el.innerHTML=(allowBlank?'<option value="">Not used</option>':"")+headers.map(h=>`<option value="${safe(h)}">${safe(h)}</option>`).join("");el.value=selected||"";
}
function selectedCsvMapping(){return {date:document.getElementById("mapDate").value,description:document.getElementById("mapDescription").value,amount:document.getElementById("mapAmount").value,debit:document.getElementById("mapDebit").value,credit:document.getElementById("mapCredit").value,currency:document.getElementById("mapCurrency").value,type:document.getElementById("mapType").value}}
function buildCsvPreview(){
  if(!pendingCsv)return [];
  const m=selectedCsvMapping();
  return pendingCsv.records.map((r,index)=>{
    const date=normalizeDate(r[m.date]),description=r[m.description]||"Imported transaction";
    let amount=0,type="expense";
    if(m.amount){const raw=String(r[m.amount]||"");amount=parseAmount(raw);type=/^-/.test(raw.trim())||/^\(.*\)$/.test(raw.trim())?"expense":"income";if(/debit|withdraw|expense/i.test(m.amount))type="expense";if(/credit|deposit|income/i.test(m.amount))type="income"}
    else {const debit=parseAmount(r[m.debit]),credit=parseAmount(r[m.credit]);if(credit>0){amount=credit;type="income"}else{amount=debit;type="expense"}}
    const currencyRaw=m.currency?(r[m.currency]||"").trim().toUpperCase():"";
    const currencyAliases={"₹":"INR","RS":"INR","RS.":"INR","INR":"INR","$":"USD","US$":"USD","USD":"USD","€":"EUR","EUR":"EUR","£":"GBP","GBP":"GBP","AED":"AED","CAD":"CAD","AUD":"AUD"};
    const currency=currencyAliases[currencyRaw]||reportingCurrency();
    if(m.type){const typeValue=String(r[m.type]||"").toLowerCase();if(/credit|income|deposit|received|cr/.test(typeValue))type="income";else if(/debit|expense|withdraw|paid|dr/.test(typeValue))type="expense";}
    return {id:uid(),date, title:description.slice(0,80),type,amount,currency,category:guessCategory(description,type),source:"import",sourceRow:index+2};
  }).filter(t=>t.date&&t.amount>0);
}
function refreshCsvPreview(){
  const list=buildCsvPreview(),known=new Set(data.transactions.map(t=>`${t.date}|${t.title.toLowerCase()}|${t.amount}|${t.currency||"INR"}`));
  const duplicates=list.filter(t=>known.has(`${t.date}|${t.title.toLowerCase()}|${t.amount}|${t.currency}`)).length;
  document.getElementById("importSummary").textContent=`${list.length} valid transactions detected from ${pendingCsv.records.length} rows`;
  document.getElementById("importDuplicateNote").textContent=duplicates?`${duplicates} possible duplicates will be skipped.`:"Possible duplicates will be checked before importing.";
  document.getElementById("importPreviewRows").innerHTML=list.slice(0,12).map(t=>`<tr><td>${prettyDate(t.date)}</td><td>${safe(t.title)}</td><td><span class="type-pill ${t.type}">${t.type}</span></td><td>${safe(t.category)}</td><td class="align-right">${money(t.amount,t.currency)}</td><td>${t.currency}</td></tr>`).join("")||'<tr><td colspan="6">No valid transactions detected. Check your column mapping.</td></tr>';
  document.getElementById("confirmImport").disabled=!list.length;
}
function handleCsvFile(file){
  if(!file)return;if(!file.name.toLowerCase().endsWith(".csv")){alert("Please choose a CSV file.");return}
  const reader=new FileReader();reader.onload=()=>{
    try{
      const parsed=parseCSV(reader.result);if(!parsed.headers.length||!parsed.records.length)throw Error("The CSV appears to be empty.");
      pendingCsv=parsed;
      const h=parsed.headers;
      csvMappingOptions("mapDate",h,guessColumn(h,[/date/i,/posted/i,/transaction time/i]));
      csvMappingOptions("mapDescription",h,guessColumn(h,[/description/i,/narration/i,/merchant/i,/details/i,/particular/i,/name/i]));
      csvMappingOptions("mapAmount",h,guessColumn(h,[/^amount$/i,/transaction amount/i]),true);
      csvMappingOptions("mapDebit",h,guessColumn(h,[/debit/i,/withdrawal/i,/paid out/i]),true);
      csvMappingOptions("mapCredit",h,guessColumn(h,[/credit/i,/deposit/i,/paid in/i]),true);
      csvMappingOptions("mapCurrency",h,guessColumn(h,[/currency/i,/ccy/i]),true);
      csvMappingOptions("mapType",h,guessColumn(h,[/^type$/i,/transaction type/i,/dr.?cr/i,/credit.?debit/i]),true);
      if(!document.getElementById("mapDate").value)document.getElementById("mapDate").selectedIndex=0;
      if(!document.getElementById("mapDescription").value)document.getElementById("mapDescription").selectedIndex=0;
      document.getElementById("importPreviewPanel").classList.remove("hidden");refreshCsvPreview();
      document.getElementById("importPreviewPanel").scrollIntoView({behavior:"smooth",block:"start"});
    }catch(err){alert(err.message||"Unable to read this CSV file.")}
  };reader.readAsText(file);
}
function confirmCsvImport(){
  const list=buildCsvPreview();if(!list.length)return;
  const existing=new Set(data.transactions.map(t=>`${t.date}|${t.title.toLowerCase()}|${t.amount}|${t.currency||"INR"}`));
  const fresh=list.filter(t=>{const key=`${t.date}|${t.title.toLowerCase()}|${t.amount}|${t.currency}`;if(existing.has(key))return false;existing.add(key);return true});
  data.transactions.push(...fresh);saveData();pendingCsv=null;document.getElementById("importPreviewPanel").classList.add("hidden");document.getElementById("csvFileInput").value="";toast(`${fresh.length} transactions imported`);switchView("transactions");
}
function sampleCsvDownload(){
  const rows=[["Date","Description","Debit","Credit","Currency"],["2026-11-02","Swiggy order","420","","INR"],["2026-11-03","Monthly salary","","45000","INR"],["2026-11-05","Uber ride","185","","INR"],["2026-11-07","Netflix subscription","649","","INR"],["2026-11-10","Online purchase","1299","","INR"]];
  download("spendwise-sample-statement.csv",rows.map(r=>r.join(",")).join("\n"),"text/csv");
}
function loadDemoData(){
  if(data.transactions.some(t=>t.source==="demo")){toast("Demo transactions are already loaded");return}
  const today=new Date();
  const samples=[
    ["Monthly salary","Salary",45000,"income",-1],["Freelance project","Freelance",8500,"income",-12],
    ["Grocery shopping","Groceries",1850,"expense",-1],["Swiggy dinner","Food & dining",420,"expense",-2],
    ["Metro recharge","Transport",600,"expense",-3],["Electricity bill","Bills & utilities",1450,"expense",-5],
    ["Amazon purchase","Shopping",2199,"expense",-7],["Netflix subscription","Entertainment",649,"expense",-9],
    ["Pharmacy","Health",380,"expense",-11],["College books","Education",950,"expense",-14],
    ["Cafe with friends","Food & dining",560,"expense",-17],["Uber ride","Transport",230,"expense",-19],
    ["Weekend groceries","Groceries",1320,"expense",-23],["Movie tickets","Entertainment",720,"expense",-27],
    ["Monthly salary","Salary",45000,"income",-32],["Restaurant dinner","Food & dining",1100,"expense",-36],
    ["Internet bill","Bills & utilities",899,"expense",-39],["Shopping","Shopping",1750,"expense",-42],
    ["Cab rides","Transport",510,"expense",-47],["Freelance payment","Freelance",5000,"income",-51]
  ];
  const curr=reportingCurrency();
  for(const [title,category,amount,type,offset] of samples){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+offset);data.transactions.push({id:uid(),title,category,amount,type,currency:curr,date:localISO(d),source:"demo"})}
  data.demoLoaded=true;saveData();toast("Realistic demo transactions added");
}
function clearDemoData(){
  const count=data.transactions.filter(t=>t.source==="demo").length;if(!count){toast("No demo records to clear");return}
  if(confirm(`Remove ${count} demo transactions? Your manually added and imported records will remain.`)){data.transactions=data.transactions.filter(t=>t.source!=="demo");data.demoLoaded=false;saveData();toast("Demo data cleared")}
}

function init(){
 document.getElementById("todayLabel").textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();document.getElementById("currentDate").textContent=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
 const theme=localStorage.getItem(THEME_KEY)||"light";document.body.classList.toggle("dark",theme==="dark");updateThemeIcon();
 document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
 document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.go)));
 document.getElementById("quickAdd").onclick=()=>openTransactionModal();document.getElementById("addTransactionPage").onclick=()=>openTransactionModal();
 document.getElementById("themeBtn").onclick=toggleTheme;document.getElementById("lightTheme").onclick=()=>setTheme("light");document.getElementById("darkTheme").onclick=()=>setTheme("dark");
 document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
 document.getElementById("reportCurrency").value=activeProfile()?.data?.baseCurrency||"INR";
 document.getElementById("reportCurrency").onchange=()=>{const p=activeProfile();if(p){p.data.baseCurrency=reportingCurrency();persistProfiles()}renderAll();toast(`Reports filtered to ${reportingCurrency()}`)};
 document.getElementById("csvFileInput").onchange=e=>handleCsvFile(e.target.files[0]);
 document.getElementById("downloadSampleCsv").onclick=sampleCsvDownload;
 ["mapDate","mapDescription","mapAmount","mapDebit","mapCredit","mapCurrency","mapType"].forEach(id=>document.getElementById(id).onchange=refreshCsvPreview);
 document.getElementById("confirmImport").onclick=confirmCsvImport;
 document.getElementById("cancelImport").onclick=()=>{pendingCsv=null;document.getElementById("importPreviewPanel").classList.add("hidden");document.getElementById("csvFileInput").value=""};
 document.getElementById("loadDemoData").onclick=loadDemoData;
 document.getElementById("clearDemoData").onclick=clearDemoData;
 document.getElementById("brandHome").onclick=e=>{e.preventDefault();switchView("dashboard");window.scrollTo({top:0,behavior:"smooth"})};
 document.getElementById("profileMenuBtn").onclick=openProfileModal;
 document.getElementById("closeProfileModal").onclick=closeProfileModal;
 document.getElementById("newProfileBtn").onclick=startNewProfile;
 document.getElementById("cancelNewProfile").onclick=openProfileModal;
 document.getElementById("profileForm").onsubmit=e=>{
   e.preventDefault();const name=document.getElementById("profileNameInput").value.trim(),email=document.getElementById("profileEmailInput").value.trim();
   if(!name)return;
   if(document.getElementById("profileFormMode").value==="new"){
     const p={id:uid(),name,email,data:{...defaultData(),baseCurrency:reportingCurrency()}};profiles.push(p);activeProfileId=p.id;data=p.data;persistProfiles();closeProfileModal();renderAll();switchView("dashboard");toast("New local profile created");
   }else{
     const p=activeProfile();p.name=name;p.email=email;persistProfiles();renderProfileIdentity();renderProfileList();toast("Profile saved on this PC");
   }
 };
 document.getElementById("profileList").onclick=e=>{
   const sw=e.target.closest(".switch-profile"),del=e.target.closest(".remove-profile");
   if(sw)switchProfile(sw.dataset.id);
   if(del){const p=profiles.find(x=>x.id===del.dataset.id);if(!p)return;if(!confirm(`Delete the local profile "${p.name}" and all data saved inside it?`))return;profiles=profiles.filter(x=>x.id!==p.id);if(activeProfileId===p.id){activeProfileId=profiles[0].id;data={...defaultData(),...(profiles[0].data||{})};}persistProfiles();renderAll();renderProfileList();toast("Profile deleted");}
 };
 document.getElementById("cashflowRange").onchange=drawCashflow;document.getElementById("analyticsPeriod").onchange=renderAnalytics;
 ["transactionSearch","typeFilter","categoryFilter","sortFilter"].forEach(id=>document.getElementById(id).addEventListener(id==="transactionSearch"?"input":"change",renderTransactions));
 document.querySelectorAll(".segment").forEach(b=>b.onclick=()=>setSegment(b.dataset.kind));
 document.getElementById("closeModal").onclick=document.getElementById("cancelModal").onclick=closeModal;
 document.getElementById("transactionForm").onsubmit=e=>{e.preventDefault();const id=document.getElementById("editId").value;const item={id:id||uid(),title:document.getElementById("transactionTitle").value.trim(),type:document.getElementById("transactionType").value,amount:Number(document.getElementById("transactionAmount").value),currency:document.getElementById("transactionCurrency").value,date:document.getElementById("transactionDate").value,category:document.getElementById("transactionCategory").value,note:document.getElementById("transactionNote").value.trim()};if(!item.title||item.amount<=0||!item.date)return;const i=data.transactions.findIndex(t=>t.id===id);if(i>=0)data.transactions[i]=item;else data.transactions.push(item);closeModal();saveData();toast(id?"Transaction updated":"Transaction added")};
 document.getElementById("transactionTable").onclick=e=>{const edit=e.target.closest(".edit-transaction"),del=e.target.closest(".delete-transaction");if(edit){const t=data.transactions.find(x=>x.id===edit.dataset.id);if(t)openTransactionModal(t)}if(del&&confirm("Delete this transaction?")){data.transactions=data.transactions.filter(x=>x.id!==del.dataset.id);saveData();toast("Transaction deleted")}};
 document.getElementById("addBudgetBtn").onclick=document.getElementById("emptyAddBudget").onclick=()=>openBudgetModal();document.getElementById("closeBudgetModal").onclick=document.getElementById("cancelBudget").onclick=()=>document.getElementById("budgetModalBackdrop").classList.add("hidden");
 document.getElementById("budgetForm").onsubmit=e=>{e.preventDefault();const id=document.getElementById("budgetEditId").value,category=document.getElementById("budgetCategory").value,amount=Number(document.getElementById("budgetAmount").value);if(data.budgets.some(b=>b.category===category&&b.id!==id)){toast("A budget already exists for this category");return}const item={id:id||uid(),category,amount,currency:reportingCurrency()};const i=data.budgets.findIndex(b=>b.id===id);if(i>=0)data.budgets[i]=item;else data.budgets.push(item);document.getElementById("budgetModalBackdrop").classList.add("hidden");saveData();toast("Budget saved")};
 document.getElementById("budgetGrid").onclick=e=>{const ed=e.target.closest(".edit-budget"),del=e.target.closest(".delete-budget");if(ed){const b=data.budgets.find(x=>x.id===ed.dataset.id);openBudgetModal(b)}if(del&&confirm("Delete this budget?")){data.budgets=data.budgets.filter(x=>x.id!==del.dataset.id);saveData();toast("Budget deleted")}};
 document.getElementById("addGoalBtn").onclick=()=>openGoalModal();document.getElementById("closeGoalModal").onclick=document.getElementById("cancelGoal").onclick=()=>document.getElementById("goalModalBackdrop").classList.add("hidden");
 document.getElementById("goalForm").onsubmit=e=>{e.preventDefault();const id=document.getElementById("goalEditId").value,item={id:id||uid(),currency:reportingCurrency(),name:document.getElementById("goalName").value.trim(),target:Number(document.getElementById("goalTarget").value),saved:Number(document.getElementById("goalSaved").value),date:document.getElementById("goalDate").value};if(item.saved>item.target){toast("Saved amount cannot exceed target");return}const i=data.goals.findIndex(g=>g.id===id);if(i>=0)data.goals[i]=item;else data.goals.push(item);document.getElementById("goalModalBackdrop").classList.add("hidden");saveData();toast("Savings goal saved")};
 document.getElementById("goalGrid").onclick=e=>{const ed=e.target.closest(".edit-goal"),del=e.target.closest(".delete-goal"),add=e.target.closest(".add-to-goal");if(ed){openGoalModal(data.goals.find(g=>g.id===ed.dataset.id))}if(del&&confirm("Delete this goal?")){data.goals=data.goals.filter(g=>g.id!==del.dataset.id);saveData();toast("Goal deleted")}if(add){const g=data.goals.find(x=>x.id===add.dataset.id),n=Number(prompt(`How much would you like to add to ${g.name}? (₹)`));if(n>0){g.saved=Math.min(g.target,g.saved+n);saveData();toast("Savings progress updated")}}};
 document.getElementById("addRecurringBtn").onclick=()=>{document.getElementById("recurringModalBackdrop").classList.remove("hidden");fillCategorySelect(document.getElementById("recurringCategory"),"expense");document.getElementById("recurringDate").value=todayISO()};
 document.getElementById("closeRecurringModal").onclick=document.getElementById("cancelRecurring").onclick=()=>document.getElementById("recurringModalBackdrop").classList.add("hidden");
 document.getElementById("recurringForm").onsubmit=e=>{e.preventDefault();data.recurring.push({id:uid(),name:document.getElementById("recurringName").value.trim(),amount:Number(document.getElementById("recurringAmount").value),currency:reportingCurrency(),frequency:document.getElementById("recurringFrequency").value,category:document.getElementById("recurringCategory").value,date:document.getElementById("recurringDate").value});document.getElementById("recurringModalBackdrop").classList.add("hidden");e.target.reset();saveData();toast("Recurring reminder added")};
 document.getElementById("recurringTable").onclick=e=>{const del=e.target.closest(".delete-recurring");if(del&&confirm("Delete this recurring reminder?")){data.recurring=data.recurring.filter(r=>r.id!==del.dataset.id);saveData();toast("Reminder deleted")}};
 document.getElementById("exportCsv").onclick=exportCSV;document.getElementById("exportJson").onclick=()=>{download("spendwise-backup.json",JSON.stringify(data,null,2),"application/json");toast("Backup downloaded")};
 document.getElementById("importJson").onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result);if(!obj||!Array.isArray(obj.transactions)||!Array.isArray(obj.budgets)||!Array.isArray(obj.goals)||!Array.isArray(obj.recurring))throw Error();if(confirm("Replace current SpendWise data with this backup?")){data=obj;saveData();toast("Backup restored")}}catch{alert("This file is not a valid SpendWise backup.")}e.target.value=""};reader.readAsText(file)};
 document.getElementById("resetData").onclick=()=>{if(confirm("This permanently clears all SpendWise data stored in this browser. Continue?")){data=defaultData();saveData();toast("Workspace reset")}};
 document.getElementById("alertsBtn").onclick=()=>{const key=currentMonthKey(),alerts=data.budgets.map(b=>{const spent=monthTransactions(key).filter(t=>t.type==="expense"&&t.category===b.category).reduce((a,t)=>a+t.amount,0);return spent>=b.amount?`${b.category} budget has been reached or exceeded.`:spent>=b.amount*.8?`${b.category} budget is over 80% used.`:null}).filter(Boolean);alert(alerts.length?alerts.join("\n"):"You're all caught up. No budget alerts right now.")};
 if(!data.demoLoaded && data.transactions.length===0 && !localStorage.getItem("spendwise_demo_prompted_v1")){localStorage.setItem("spendwise_demo_prompted_v1","1");loadDemoData();}
 renderAll();
}
function updateThemeIcon(){document.querySelector("#themeBtn i").className=document.body.classList.contains("dark")?"fa-solid fa-sun":"fa-solid fa-moon"}
function setTheme(t){document.body.classList.toggle("dark",t==="dark");localStorage.setItem(THEME_KEY,t);updateThemeIcon();renderAll();toast(`${t==="dark"?"Dark":"Light"} mode enabled`)}
function toggleTheme(){setTheme(document.body.classList.contains("dark")?"light":"dark")}
document.addEventListener("DOMContentLoaded",init);
