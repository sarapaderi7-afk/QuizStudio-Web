const subjects=[
["Economia e gestione imprese","economia.json"],
["Psicologia del lavoro e delle organizzazioni","psicologia.json"],
["Diritto del lavoro","diritto_lavoro.json"],
["Diritto penale PA","diritto_penale_pa.json"],
["Fondamenti di spagnolo","fondamenti_spagnolo.json"],
["Psicologia sociale","psicologia_sociale.json"],
["Sociologia dei processi culturali e comunicativi","sociologia_processi_culturali_comunicativi.json"]
];
let state={subject:null,questions:[],index:0,answered:false,score:0};
const $=id=>document.getElementById(id);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function renderSubjects(){$("subjects").innerHTML=subjects.map((s,i)=>`<button class="subject" data-i="${i}"><strong>${s[0]}</strong><span>Apri quiz</span></button>`).join("");document.querySelectorAll(".subject").forEach(b=>b.onclick=()=>start(+b.dataset.i))}
async function start(i){$("home").hidden=true;$("quiz").hidden=false;$("title").textContent=subjects[i][0];$("progress").textContent="Caricamento…";state={subject:i,questions:[],index:0,answered:false,score:0};try{const r=await fetch("domande/"+subjects[i][1]);if(!r.ok)throw Error();state.questions=shuffle(await r.json().then(x=>x.slice()));show()}catch(e){$("question").textContent="Impossibile caricare le domande.";$("progress").textContent="";}}
function show(){const q=state.questions[state.index];state.answered=false;$("progress").textContent=`${state.index+1} / ${state.questions.length}`;$("question").textContent=q.domanda;$("feedback").textContent="";$("next").disabled=true;$("finish").hidden=true;$("answers").innerHTML=["A","B","C","D"].map(k=>`<button data-k="${k}">${k}. ${q[k]}</button>`).join("");document.querySelectorAll("#answers button").forEach(b=>b.onclick=()=>answer(b.dataset.k))}
function answer(k){if(state.answered)return;state.answered=true;const q=state.questions[state.index];document.querySelectorAll("#answers button").forEach(b=>{b.disabled=true;if(b.dataset.k===q.corretta)b.classList.add("correct");if(b.dataset.k===k&&k!==q.corretta)b.classList.add("wrong")});if(k===q.corretta){state.score++;$("feedback").textContent="✓ Corretta";}else{$("feedback").textContent=`✗ Errata — risposta corretta: ${q.corretta}`;}if(state.index===state.questions.length-1){$("finish").hidden=false}else{$("next").disabled=false}}
$("next").onclick=()=>{state.index++;show()};$("finish").onclick=()=>{alert(`Test terminato: ${state.score} / ${state.questions.length}`);backHome()};$("back").onclick=backHome;function backHome(){$("quiz").hidden=true;$("home").hidden=false}renderSubjects();