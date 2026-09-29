const subjects = [
  ["Economia e gestione imprese","economia.json"],
  ["Psicologia del lavoro e delle organizzazioni","psicologia.json"],
  ["Diritto del lavoro","diritto_lavoro.json"],
  ["Diritto penale PA","diritto_penale_pa.json"],
  ["Fondamenti di spagnolo","fondamenti_spagnolo.json"],
  ["Psicologia sociale","psicologia_sociale.json"],
  ["Sociologia dei processi culturali e comunicativi","sociologia_processi_culturali_comunicativi.json"]
];

const KEY = "quizStudioWeb_v1";
let store = JSON.parse(localStorage.getItem(KEY) || "{}");
let state = { subject:null, questions:[], index:0, score:0, mode:null, answered:false };

const $ = id => document.getElementById(id);
function save(){ localStorage.setItem(KEY, JSON.stringify(store)); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function subjectData(i){ const s=subjects[i]; store[s[0]] ||= {deck:[], used:[], wrong:{}}; return store[s[0]]; }

async function loadSubject(i){
  const r = await fetch("domande/" + subjects[i][1]);
  if(!r.ok) throw new Error("load");
  const data = await r.json();
  return data.map((q,n)=>({...q,id:String(q.numero ?? n+1)}));
}

function renderSubjects(){
  $("subjects").innerHTML = subjects.map((s,i)=>`
    <div class="subject-card">
      <strong>${s[0]}</strong>
      <span>${store[s[0]]?.wrong ? Object.keys(store[s[0]].wrong).length : 0} domande errate</span>
      <div class="mode-buttons">
        <button data-i="${i}" data-mode="infinite">Quiz infinito</button>
        <button data-i="${i}" data-mode="test30">Test da 30</button>
        <button data-i="${i}" data-mode="wrong">Domande errate</button>
      </div>
    </div>`).join("");
  document.querySelectorAll(".mode-buttons button").forEach(b=>b.onclick=()=>start(+b.dataset.i,b.dataset.mode));
}

async function start(i,mode){
  try{
    $("home").hidden=true; $("quiz").hidden=false;
    $("title").textContent=subjects[i][0];
    $("progress").textContent="Caricamento…";
    const all=await loadSubject(i);
    state={subject:i,questions:[],index:0,score:0,mode,answered:false};
    subjectData(i);
    if(mode==="wrong"){
      const wrong=subjectData(i).wrong;
      state.questions=shuffle(all.filter(q=>Object.prototype.hasOwnProperty.call(wrong,q.id)));
      if(!state.questions.length){ alert("Non ci sono domande errate per questa materia."); backHome(); return; }
    } else if(mode==="test30"){
      if(all.length<30){ alert("Questa materia contiene meno di 30 domande."); backHome(); return; }
      state.questions=Array.from({length:30},()=>takeFromDeck(i,all));
    } else {
      state.questions=[takeFromDeck(i,all)];
    }
    show();
  }catch(e){
    $("question").textContent="Impossibile caricare le domande.";
    $("progress").textContent="";
  }
}

function takeFromDeck(i,all){
  const d=subjectData(i);
  if(!d.deck.length){
    const used=new Set(d.used);
    const fresh=all.filter(q=>!used.has(q.id));
    d.deck=shuffle(fresh.length ? fresh.map(q=>q.id) : all.map(q=>q.id));
    if(!fresh.length) d.used=[];
  }
  const id=d.deck.shift();
  d.used.push(id);
  if(d.used.length>all.length) d.used=d.used.slice(-all.length);
  save();
  return all.find(q=>q.id===id);
}

function show(){
  const q=state.questions[state.index];
  state.answered=false;
  $("progress").textContent=state.mode==="test30"
    ? `${state.index+1} / 30`
    : state.mode==="wrong" ? `${state.index+1} / ${state.questions.length}` : `Domanda ${state.index+1}`;
  $("question").textContent=q.domanda;
  $("feedback").textContent="";
  $("next").disabled=true;
  $("finish").hidden=true;
  $("answers").innerHTML=["A","B","C","D"].map(k=>`<button data-k="${k}">${k}. ${q[k]}</button>`).join("");
  document.querySelectorAll("#answers button").forEach(b=>b.onclick=()=>answer(b.dataset.k));
}

function answer(k){
  if(state.answered)return;
  state.answered=true;
  const q=state.questions[state.index], d=subjectData(state.subject);
  const correct=k===q.corretta;
  document.querySelectorAll("#answers button").forEach(b=>{
    b.disabled=true;
    if(b.dataset.k===q.corretta)b.classList.add("correct");
    if(b.dataset.k===k && !correct)b.classList.add("wrong");
  });
  if(correct) state.score++;
  updateWrong(d,q,correct);
  $("feedback").textContent=correct ? "✓ CORRETTA" : `✗ SBAGLIATA — risposta corretta: ${q.corretta}`;
  if(state.mode==="test30"){
    if(state.index===29){$("next").disabled=false;$("next").textContent="Vedi risultato";}
    else {$("next").disabled=false;$("next").textContent="Prossima domanda";}
  } else {
    $("next").disabled=false;$("next").textContent="Prossima domanda";
  }
}

function updateWrong(d,q,correct){
  if(!correct){ d.wrong[q.id]=0; }
  else if(Object.prototype.hasOwnProperty.call(d.wrong,q.id)){
    const n=d.wrong[q.id]+1;
    if(n>=3) delete d.wrong[q.id];
    else d.wrong[q.id]=n;
  }
  save();
  const n=d.wrong[q.id];
  if(correct && n!==undefined) $("feedback").textContent=`✓ CORRETTA — ${n}/3`;
  if(!correct) $("feedback").textContent="✗ SBAGLIATA — 0/3";
}

$("next").onclick=async()=>{
  if(state.mode==="test30" && state.index===29){ showResult(); return; }
  state.index++;
  if(state.mode==="wrong"){
    const all=await loadSubject(state.subject), d=subjectData(state.subject);
    state.questions=shuffle(all.filter(q=>Object.prototype.hasOwnProperty.call(d.wrong,q.id)));
    if(!state.questions.length){alert("Non ci sono più domande errate.");backHome();return;}
    state.index=0;
  } else if(state.mode==="infinite"){
    const all=await loadSubject(state.subject);
    state.questions.push(takeFromDeck(state.subject,all));
  }
  show();
};

function showResult(){
  $("home").hidden=false; $("quiz").hidden=true;
  const score=state.score;
  const s=subjects[state.subject][0];
  $("subjects").innerHTML=`
    <div class="result-card">
      <h2>Test completato</h2>
      <div class="big-score">${score}/30</div>
      <p>Risposte corrette: ${score}<br>Risposte sbagliate: ${30-score}</p>
      <button id="again">Nuovo test da 30</button>
      <button id="backResult">Torna alle materie</button>
    </div>`;
  $("again").onclick=()=>start(state.subject,"test30");
  $("backResult").onclick=renderSubjects;
}

$("back").onclick=backHome;
function backHome(){ $("quiz").hidden=true; $("home").hidden=false; renderSubjects(); }
renderSubjects();