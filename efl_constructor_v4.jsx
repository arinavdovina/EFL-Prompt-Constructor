import { useState, useRef } from "react";

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
  cream:     "#F7F2EA",
  parchment: "#EDE5D4",
  sand:      "#D9CCBA",
  tan:       "#BFA98C",
  rust:      "#C0491A",
  rustDark:  "#8C3210",
  rustDeep:  "#5C1E08",
  rustLight: "#F5E0D6",
  rustMid:   "#E8B89E",
  coal:      "#2A1F14",
  charcoal:  "#4A3728",
  muted:     "#7A6450",
  faint:     "#9E8872",
  white:     "#FFFFFF",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SYSTEM_A = {
  id:"A", label:"System A",
  title:"Teaching Material Generator",
  subtitle:"Finished artifacts students see & interact with",
  accent: P.rust, accentLight: P.rustLight, accentMid: P.rustMid,
  badge:"Материалы для студента",
  categories:[
    { id:"fake_media",   label:"Fake Media",         icon:"ti-news",         desc:"Newspaper, blog, social posts, SMS, reviews…",
      types:["Newspaper article","Magazine article","Online news page","Blog post","Forum thread","Social media post","Instagram post","LinkedIn post","X/Twitter post","Email","Text message conversation","Online review","Discussion comments","Advertisement","Public announcement"] },
    { id:"worksheet",    label:"Visual Worksheet",   icon:"ti-layout-grid",  desc:"One-page print-ready educational materials",
      types:["Worksheet","Vocabulary sheet","Grammar sheet","Speaking sheet","Roleplay card","Task sheet","Infographic","Learning handout","Board game page"] },
    { id:"poster",       label:"Educational Poster", icon:"ti-layout-board", desc:"Visual learning posters for classroom display",
      types:["Grammar poster","Vocabulary poster","Pronunciation poster","Process poster","Classroom poster"] },
    { id:"visual_story", label:"Visual Story",       icon:"ti-photo",        desc:"Image-based storytelling & sequencing materials",
      types:["Comic strip","Picture sequence","Visual story","Mystery scene","Storytelling prompt"] },
    { id:"real_doc",     label:"Real-Life Document", icon:"ti-id",           desc:"Authentic-looking documents for real-world tasks",
      types:["Ticket","Boarding pass","Menu","Receipt","Invoice","LinkedIn profile","CV","Job description","Medical form","Application form","Schedule","Timetable"] },
  ],
};

const SYSTEM_B = {
  id:"B", label:"System B",
  title:"Workbook Generator",
  subtitle:"Complete learning packages students work through",
  accent: P.rustDark, accentLight:"#F0E4DA", accentMid:"#D4A88C",
  badge:"Учебные пакеты",
  categories:[
    { id:"full_lesson",        label:"Full Lesson Workbook", icon:"ti-book",         desc:"Warm-up → Presentation → Practice → Production → HW", types:["Full Lesson Workbook"] },
    { id:"authentic_material", label:"Authentic Material",   icon:"ti-file-text",    desc:"Article / video / podcast → complete task sequence",  types:["Authentic Material Workbook"] },
    { id:"vocabulary",         label:"Vocabulary Workbook",  icon:"ti-abc",          desc:"Notice → Understand → Practice → Retrieve → Use",     types:["Vocabulary Workbook"] },
    { id:"grammar",            label:"Grammar Workbook",     icon:"ti-writing",      desc:"Discover → Clarify → Practice → Communicate",         types:["Grammar Workbook"] },
    { id:"speaking",           label:"Speaking Workbook",    icon:"ti-speakerphone", desc:"Prepare → Discuss → Negotiate → Reflect",             types:["Speaking Workbook"] },
    { id:"business",           label:"Business English",     icon:"ti-briefcase",    desc:"Tailored to profession, industry & communication",     types:["Business English Workbook"] },
    { id:"exam",               label:"Exam Workbook",        icon:"ti-certificate",  desc:"Aligned to IELTS, TOEFL, Cambridge, OET, etc.",        types:["Exam Workbook"] },
    { id:"error_correction",   label:"Error Correction",     icon:"ti-bug",          desc:"Student sample → analysis → targeted practice",       types:["Error Correction Workbook"] },
  ],
};

const CEFR      = ["A1","A2","B1","B2","C1","C2"];
const DURATIONS = ["30 min","45 min","60 min","75 min","90 min","120 min"];
const FORMATS   = ["Online (video call)","In-person","Hybrid","Self-study"];
const SKILLS    = ["Speaking","Listening","Reading","Writing","Grammar","Vocabulary","Pronunciation"];
const LANGUAGES = ["Russian","Chinese","Spanish","Arabic","French","German","Japanese","Korean","Portuguese","Turkish","Hindi","Other"];
const EXAMS     = ["IELTS","TOEFL","Cambridge B2 First","Cambridge C1 Advanced","Cambridge C2 Proficiency","OET","TOEIC","PTE Academic","DELE","DELF"];

const MASTER_SYSTEM = `You are a senior instructional designer, prompt engineer, and educational content architect specializing in English language teaching (ELT).

Your ONLY job is to output a single, fully engineered prompt that a teacher will paste into any LLM to receive a complete, ready-to-use educational product in ONE response — no follow-up clarifications needed.

ABSOLUTE RULES:
1. Output ONLY the final prompt. No preamble. No "Here is your prompt:". No explanation. No markdown fences around the whole thing.
2. The prompt you write must be self-contained, over-specified, and leave zero ambiguity for the executing LLM.
3. Think like a senior prompt engineer: identify every gap in the teacher's input and fill it with best-practice pedagogical defaults.
4. The prompt must produce a product that requires zero editing before classroom use.

YOUR PROMPT MUST ALWAYS INCLUDE THESE SECTIONS:

## ROLE
Assign the executing LLM a precise expert identity.

## CONTEXT
All learner details: age, CEFR level, native language, profession, interests, goals, known strengths, weaknesses.

## OBJECTIVE
A single, measurable, explicit instruction of exactly what to produce.

## PEDAGOGICAL REQUIREMENTS
- Communicative approach, TBL where appropriate
- Personalization to student interests/profession/goals
- Retrieval practice, spaced repetition, meaningful interaction
- Authentic language use, no mechanical drills without communicative purpose
- No excessive grammar explanation; focus on use over analysis
- CEFR-appropriate lexis, syntax, and task difficulty throughout

## OUTPUT FORMAT
Exact section structure with headings, subsections, labels, and timing where applicable.

## SELF-CHECK
Require the executing LLM to silently verify before outputting, then output the final product without showing the self-check.`;

function buildUserMessage({ system, category, subtype, fields }) {
  const L = [];
  L.push(`SYSTEM: ${system === "A" ? "System A — Teaching Material Generator" : "System B — Workbook Generator"}`);
  L.push(`CATEGORY: ${category}`);
  if (subtype) L.push(`SPECIFIC TYPE: ${subtype}`);
  L.push("","=== LEARNER PROFILE ===");
  if (fields.studentName)   L.push(`Name: ${fields.studentName}`);
  if (fields.age)            L.push(`Age: ${fields.age}`);
  if (fields.cefr)           L.push(`CEFR Level: ${fields.cefr}`);
  if (fields.nativeLanguage) L.push(`L1: ${fields.nativeLanguage}`);
  if (fields.profession)     L.push(`Profession/Background: ${fields.profession}`);
  if (fields.interests)      L.push(`Interests: ${fields.interests}`);
  if (fields.goals)          L.push(`Learning Goals: ${fields.goals}`);
  if (fields.strengths)      L.push(`Strengths: ${fields.strengths}`);
  if (fields.weaknesses)     L.push(`Weaknesses: ${fields.weaknesses}`);
  L.push("","=== LESSON/TASK CONTEXT ===");
  if (fields.topic)          L.push(`Topic/Theme: ${fields.topic}`);
  if (fields.duration)       L.push(`Duration: ${fields.duration}`);
  if (fields.lessonFormat)   L.push(`Format: ${fields.lessonFormat}`);
  L.push(`Session type: ${fields.groupType === "group" ? "Group lesson" : "1-to-1 lesson"}`);
  if (fields.skills?.length > 0) L.push(`Skills Focus: ${fields.skills.join(", ")}`);
  if (fields.languageGoals)  L.push(`Language Goals: ${fields.languageGoals}`);
  if (system === "A" && fields.authenticityNotes) L.push(`Authenticity Requirements: ${fields.authenticityNotes}`);
  if (system === "B") {
    if (fields.examTarget)   L.push(`Exam Target: ${fields.examTarget}`);
    if (fields.sourceText)   L.push(`Source Material/Student Sample:\n${fields.sourceText}`);
  }
  if (fields.additionalNotes) { L.push("","=== ADDITIONAL NOTES ===", fields.additionalNotes); }
  L.push("","Generate the expert prompt now.");
  return L.join("\n");
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const inp = {
  width:"100%", boxSizing:"border-box", padding:"10px 14px", fontSize:13,
  borderRadius:8, border:`1.5px solid ${P.sand}`,
  background: P.white, color: P.coal, outline:"none", fontFamily:"inherit",
  transition:"border-color 0.15s",
};
const Inp = (props) => <input style={inp} {...props}
  onFocus={e=>e.target.style.borderColor=P.rust}
  onBlur={e=>e.target.style.borderColor=P.sand}
/>;
const TA = ({rows=2,...p}) => <textarea rows={rows} style={{...inp,resize:"vertical",lineHeight:1.6}} {...p}
  onFocus={e=>e.target.style.borderColor=P.rust}
  onBlur={e=>e.target.style.borderColor=P.sand}
/>;
const Sel = ({options, placeholder="— выбрать —",...p}) => (
  <select style={{...inp, color: p.value ? P.coal : P.faint}} {...p}>
    <option value="">{placeholder}</option>
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);
const FL = ({label,children,col=1,hint}) => (
  <div style={{gridColumn:`span ${col}`}}>
    {label && <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:P.muted,marginBottom:5}}>{label}</div>}
    {children}
    {hint && <div style={{fontSize:11,color:P.faint,marginTop:3}}>{hint}</div>}
  </div>
);
const Tag = ({label,selected,accent,onClick}) => (
  <button onClick={onClick} style={{
    padding:"5px 14px", fontSize:12, borderRadius:20, cursor:"pointer",
    border: selected ? `1.5px solid ${accent}` : `1.5px solid ${P.sand}`,
    background: selected ? accent : P.white,
    color: selected ? P.white : P.charcoal,
    fontWeight: selected ? 600 : 400,
    transition:"all 0.13s",
  }}>{label}</button>
);

// ─── SITE HEADER ──────────────────────────────────────────────────────────────
const SiteHeader = () => (
  <div style={{
    background: P.rustDeep,
    padding:"0 32px",
    display:"flex", alignItems:"center", justifyContent:"space-between",
    height:52, flexShrink:0,
  }}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{
        width:28,height:28,borderRadius:6,
        background:P.rust,
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        <i className="ti ti-bolt" style={{fontSize:16,color:P.white}} aria-hidden="true"/>
      </div>
      <span style={{fontSize:15,fontWeight:700,color:P.white,letterSpacing:"0.02em"}}>EFL Prompt Constructor</span>
      <div style={{width:1,height:16,background:"rgba(255,255,255,0.2)",margin:"0 8px"}}/>
      <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:"0.06em",textTransform:"uppercase"}}>Prompt Constructor</span>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:6,height:6,borderRadius:"50%",background:"#6EE7B7"}}/>
      <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>AI-powered</span>
    </div>
  </div>
);

// ─── STEP RAIL ────────────────────────────────────────────────────────────────
const StepRail = ({step, sys, onBack}) => {
  const steps = [
    {label:"Система",  icon:"ti-layout-2"},
    {label:"Категория",icon:"ti-category"},
    {label:"Детали",   icon:"ti-forms"},
    {label:"Промпт",   icon:"ti-sparkles"},
  ];
  const ac = sys === "A" ? P.rust : sys === "B" ? P.rustDark : P.rust;
  return (
    <div style={{
      background:P.white, borderBottom:`1px solid ${P.sand}`,
      padding:"0 32px", display:"flex", alignItems:"center",
      height:48, gap:0, flexShrink:0,
    }}>
      {step > 0 && (
        <button onClick={onBack} style={{
          display:"flex",alignItems:"center",gap:5,
          padding:"4px 12px 4px 6px", marginRight:16,
          borderRadius:6, border:`1px solid ${P.sand}`,
          background:"transparent", color:P.muted, fontSize:12, cursor:"pointer",
        }}>
          <i className="ti ti-arrow-left" style={{fontSize:13}} aria-hidden="true"/>
          Назад
        </button>
      )}
      <div style={{display:"flex",alignItems:"center",gap:0,flex:1}}>
        {steps.map((s,i) => {
          const done   = step > i;
          const active = step === i;
          return (
            <div key={i} style={{display:"flex",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"0 4px"}}>
                <div style={{
                  width:24,height:24,borderRadius:"50%",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11, fontWeight:700,
                  background: done ? ac : active ? P.rustLight : P.parchment,
                  color: done ? P.white : active ? ac : P.faint,
                  border: active ? `2px solid ${ac}` : "none",
                  transition:"all 0.2s",
                }}>
                  {done
                    ? <i className="ti ti-check" style={{fontSize:11}} aria-hidden="true"/>
                    : <i className={`ti ${s.icon}`} style={{fontSize:11}} aria-hidden="true"/>
                  }
                </div>
                <span style={{
                  fontSize:12,
                  color: active ? ac : done ? P.charcoal : P.faint,
                  fontWeight: active ? 700 : 400,
                  whiteSpace:"nowrap",
                }}>{s.label}</span>
              </div>
              {i < steps.length-1 && (
                <div style={{width:32,height:1,background:done?ac:P.sand,margin:"0 4px",transition:"background 0.3s"}}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0"}}>
    <div style={{flex:1,height:1,background:P.sand}}/>
    <div style={{display:"flex",gap:4}}>
      <div style={{width:4,height:4,borderRadius:"50%",background:P.rustMid}}/>
      <div style={{width:4,height:4,borderRadius:"50%",background:P.tan}}/>
      <div style={{width:4,height:4,borderRadius:"50%",background:P.rustMid}}/>
    </div>
    <div style={{flex:1,height:1,background:P.sand}}/>
  </div>
);

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
const SH = ({icon, children}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
    <div style={{width:24,height:24,borderRadius:6,background:P.rustLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <i className={`ti ${icon}`} style={{fontSize:13,color:P.rust}} aria-hidden="true"/>
    </div>
    <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:P.rust}}>{children}</span>
  </div>
);

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
const Card = ({children, style={}}) => (
  <div style={{
    background:P.white, borderRadius:14,
    border:`1px solid ${P.sand}`,
    padding:"20px 22px",
    ...style,
  }}>{children}</div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [step,   setStep]   = useState(0);
  const [sys,    setSys]    = useState(null);
  const [cat,    setCat]    = useState(null);
  const [sub,    setSub]    = useState("");
  const [fields, setFields] = useState({
    studentName:"", age:"", cefr:"", nativeLanguage:"", profession:"",
    interests:"", goals:"", strengths:"", weaknesses:"",
    topic:"", duration:"", lessonFormat:"", groupType:"individual",
    skills:[], languageGoals:"", authenticityNotes:"", examTarget:"",
    sourceText:"", additionalNotes:"",
  });
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState("");
  const [copied,   setCopied]   = useState(false);
  const [error,    setError]    = useState("");
  const topRef = useRef(null);

  const set = k => e => setFields(f=>({...f,[k]:e.target?.value??e}));
  const toggleSkill = s => setFields(f=>({...f,skills:f.skills.includes(s)?f.skills.filter(x=>x!==s):[...f.skills,s]}));

  const curSys = sys==="A"?SYSTEM_A:sys==="B"?SYSTEM_B:null;
  const curCat = curSys?.categories.find(c=>c.id===cat);
  const ac     = sys==="A"?P.rust:sys==="B"?P.rustDark:P.rust;

  const goBack = () => {
    if (step===1){setStep(0);setSys(null);}
    else if (step===2){setStep(1);setCat(null);setSub("");}
    else if (step===3){setStep(2);}
    topRef.current?.scrollIntoView({behavior:"smooth"});
  };

  const generate = async () => {
    setError(""); setLoading(true); setResult("");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:MASTER_SYSTEM,
          messages:[{role:"user",content:buildUserMessage({system:sys,category:curCat?.label,subtype:sub,fields})}],
        }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      setResult(text); setStep(3);
      setTimeout(()=>topRef.current?.scrollIntoView({behavior:"smooth"}),80);
    } catch(e){setError("Ошибка API: "+e.message);}
    finally{setLoading(false);}
  };

  const copy = () => {navigator.clipboard.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const reset = () => {setStep(0);setSys(null);setCat(null);setSub("");setResult("");setError("");};

  // ── outer layout ─────────────────────────────────────────────────────────────
  const shell = (content) => (
    <div ref={topRef} style={{
      fontFamily:"var(--font-sans)",
      background:P.cream,
      minHeight:"100vh",
      display:"flex",flexDirection:"column",
    }}>
      <SiteHeader/>
      <StepRail step={step} sys={sys} onBack={goBack}/>
      <div style={{flex:1,padding:"28px 24px",maxWidth:760,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        {content}
      </div>
      <div style={{
        background:P.rustDeep, padding:"12px 32px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexShrink:0,
      }}>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>EFL Prompt Constructor</span>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>AI-powered by Claude</span>
      </div>
    </div>
  );

  // ── STEP 0: SYSTEM SELECT ────────────────────────────────────────────────────
  if (step===0) return shell(<>
    {/* Hero */}
    <div style={{
      background:P.rustDeep, borderRadius:16,
      padding:"36px 36px 32px",
      marginBottom:24, position:"relative", overflow:"hidden",
    }}>
      {/* decorative circles */}
      <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",border:`1px solid rgba(255,255,255,0.06)`}}/>
      <div style={{position:"absolute",top:20,right:20,width:100,height:100,borderRadius:"50%",border:`1px solid rgba(255,255,255,0.06)`}}/>
      <div style={{position:"absolute",bottom:-20,left:180,width:80,height:80,borderRadius:"50%",border:`1px solid rgba(255,255,255,0.06)`}}/>
      <div style={{
        display:"inline-flex",alignItems:"center",gap:6,
        padding:"4px 12px",borderRadius:20,
        background:"rgba(255,255,255,0.1)",
        marginBottom:16,
      }}>
        <div style={{width:6,height:6,borderRadius:"50%",background:P.rustMid}}/>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:P.rustMid}}>EFL · Prompt Constructor</span>
      </div>
      <h1 style={{fontSize:28,fontWeight:700,color:P.white,margin:"0 0 10px",lineHeight:1.2,position:"relative"}}>
        EFL Prompt Constructor
      </h1>
      <p style={{fontSize:14,color:"rgba(255,255,255,0.6)",margin:"0 0 24px",lineHeight:1.6,maxWidth:480,position:"relative"}}>
        Опиши ученика — получи профессиональный промпт. Один запрос&nbsp;→ готовый материал для урока.
      </p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",position:"relative"}}>
        {["CELTA/DELTA методология","Персонализация под ученика","Готово за 60 секунд"].map(t=>(
          <div key={t} style={{
            display:"flex",alignItems:"center",gap:6,
            padding:"6px 12px",borderRadius:8,
            background:"rgba(255,255,255,0.08)",
          }}>
            <i className="ti ti-check" style={{fontSize:12,color:P.rustMid}} aria-hidden="true"/>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>{t}</span>
          </div>
        ))}
      </div>
    </div>

    {/* System cards */}
    <div style={{marginBottom:10}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:P.muted,marginBottom:14}}>
        Выберите систему
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[SYSTEM_A,SYSTEM_B].map(s=>(
          <button key={s.id}
            onClick={()=>{setSys(s.id);setStep(1);}}
            style={{
              textAlign:"left",cursor:"pointer",
              borderRadius:14, border:`2px solid ${P.sand}`,
              background:P.white, padding:"22px 20px",
              transition:"border-color 0.15s, transform 0.12s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=s.accent;e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=P.sand;e.currentTarget.style.transform="none";}}
          >
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{
                width:40,height:40,borderRadius:10,
                background:s.accentLight,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
              }}>
                <i className={s.id==="A"?"ti ti-layout-grid":"ti ti-book"} style={{fontSize:20,color:s.accent}} aria-hidden="true"/>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:s.accent}}>{s.label}</div>
                <div style={{fontSize:14,fontWeight:700,color:P.coal,marginTop:1}}>{s.title}</div>
              </div>
            </div>
            <p style={{fontSize:12,color:P.muted,margin:"0 0 14px",lineHeight:1.5}}>{s.subtitle}</p>
            <div style={{width:"100%",height:1,background:P.parchment,margin:"0 0 12px"}}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {s.categories.map(c=>(
                <span key={c.id} style={{
                  fontSize:10,padding:"3px 8px",borderRadius:10,
                  background:s.accentLight,color:s.accent,fontWeight:600,
                }}>{c.label}</span>
              ))}
            </div>
            <div style={{
              marginTop:16,display:"flex",alignItems:"center",gap:4,
              color:s.accent,fontSize:12,fontWeight:600,
            }}>
              Выбрать <i className="ti ti-arrow-right" style={{fontSize:12}} aria-hidden="true"/>
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* How it works */}
    <Card style={{marginTop:20,background:P.parchment,border:`1px solid ${P.sand}`}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:P.muted,marginBottom:14}}>Как это работает</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
        {[
          {n:"1",t:"Выбери систему",d:"Material Generator или Workbook Generator"},
          {n:"2",t:"Укажи категорию",d:"Тип материала под задачу урока"},
          {n:"3",t:"Опиши ученика",d:"Уровень, цели, профессия, интересы"},
          {n:"4",t:"Получи промпт",d:"Вставь в Claude или ChatGPT — готово"},
        ].map(({n,t,d})=>(
          <div key={n}>
            <div style={{
              width:28,height:28,borderRadius:"50%",
              background:P.rust,color:P.white,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:700,marginBottom:8,
            }}>{n}</div>
            <div style={{fontSize:12,fontWeight:600,color:P.coal,marginBottom:3}}>{t}</div>
            <div style={{fontSize:11,color:P.muted,lineHeight:1.5}}>{d}</div>
          </div>
        ))}
      </div>
    </Card>
  </>);

  // ── STEP 1: CATEGORY ─────────────────────────────────────────────────────────
  if (step===1) return shell(<>
    <div style={{marginBottom:20}}>
      <div style={{
        display:"inline-flex",alignItems:"center",gap:6,
        padding:"4px 12px",borderRadius:20,
        background:curSys.accentLight,marginBottom:12,
      }}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:ac}}>{curSys.label} · {curSys.badge}</span>
      </div>
      <h2 style={{fontSize:22,fontWeight:700,color:P.coal,margin:"0 0 4px"}}>{curSys.title}</h2>
      <p style={{fontSize:13,color:P.muted,margin:0}}>Выберите категорию материала для генерации</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {curSys.categories.map(c=>(
        <button key={c.id}
          onClick={()=>{setCat(c.id);setSub(c.types.length===1?c.types[0]:"");setStep(2);}}
          style={{
            textAlign:"left",cursor:"pointer",
            padding:"16px",borderRadius:12,
            border:`1.5px solid ${P.sand}`,background:P.white,
            transition:"border-color 0.12s,background 0.12s,transform 0.1s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=ac;e.currentTarget.style.background=curSys.accentLight;e.currentTarget.style.transform="translateY(-1px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=P.sand;e.currentTarget.style.background=P.white;e.currentTarget.style.transform="none";}}
        >
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{
              width:36,height:36,borderRadius:9,flexShrink:0,
              background:curSys.accentLight,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              <i className={`ti ${c.icon}`} style={{fontSize:18,color:ac}} aria-hidden="true"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:P.coal,marginBottom:3}}>{c.label}</div>
              <div style={{fontSize:11,color:P.muted,lineHeight:1.5}}>{c.desc}</div>
              {c.types.length > 1 && (
                <div style={{fontSize:10,color:P.faint,marginTop:5}}>{c.types.length} вариантов</div>
              )}
            </div>
            <i className="ti ti-chevron-right" style={{fontSize:14,color:P.tan,flexShrink:0,marginTop:2}} aria-hidden="true"/>
          </div>
        </button>
      ))}
    </div>
  </>);

  // ── STEP 2: FORM ─────────────────────────────────────────────────────────────
  if (step===2) return shell(<>
    {/* Form header */}
    <div style={{
      background:P.white,borderRadius:14,border:`1px solid ${P.sand}`,
      padding:"16px 20px",marginBottom:16,
      display:"flex",alignItems:"center",gap:12,
    }}>
      <div style={{
        width:42,height:42,borderRadius:10,flexShrink:0,
        background:curSys.accentLight,
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        <i className={`ti ${curCat.icon}`} style={{fontSize:21,color:ac}} aria-hidden="true"/>
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:ac,marginBottom:2}}>{curSys.label} · {curCat.label}</div>
        <div style={{fontSize:12,color:P.muted}}>{curCat.desc}</div>
      </div>
    </div>

    {/* Subtype picker */}
    {curCat.types.length > 1 && (
      <Card style={{marginBottom:16,background:curSys.accentLight,border:`1px solid ${curSys.accentMid}`}}>
        <SH icon="ti-list">{curCat.label} — тип</SH>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {curCat.types.map(t=><Tag key={t} label={t} selected={sub===t} accent={ac} onClick={()=>setSub(t)}/>)}
        </div>
      </Card>
    )}

    {/* Student profile */}
    <Card style={{marginBottom:14}}>
      <SH icon="ti-user">Профиль ученика</SH>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 16px"}}>
        <FL label="Имя ученика"><Inp value={fields.studentName} onChange={set("studentName")} placeholder="Мария (необязательно)"/></FL>
        <FL label="Возраст"><Inp type="number" value={fields.age} onChange={set("age")} placeholder="32" min="5" max="80"/></FL>
        <FL label="Уровень CEFR"><Sel options={CEFR} value={fields.cefr} onChange={set("cefr")}/></FL>
        <FL label="Родной язык"><Sel options={LANGUAGES} value={fields.nativeLanguage} onChange={set("nativeLanguage")}/></FL>
        <FL label="Профессия / сфера" col={2}><Inp value={fields.profession} onChange={set("profession")} placeholder="Менеджер по маркетингу в IT-компании"/></FL>
        <FL label="Интересы и хобби" col={2}><Inp value={fields.interests} onChange={set("interests")} placeholder="Велоспорт, true crime подкасты, кулинария"/></FL>
        <FL label="Учебные цели" col={2}><TA value={fields.goals} onChange={set("goals")} placeholder="Уверенно презентовать проекты на английском перед международными клиентами"/></FL>
        <FL label="Сильные стороны"><TA rows={2} value={fields.strengths} onChange={set("strengths")} placeholder="Хорошо слушает, широкий словарный запас"/></FL>
        <FL label="Слабые стороны"><TA rows={2} value={fields.weaknesses} onChange={set("weaknesses")} placeholder="Избегает говорения, путается в артиклях"/></FL>
      </div>
    </Card>

    {/* Lesson details */}
    <Card style={{marginBottom:14}}>
      <SH icon="ti-school">Детали урока</SH>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 16px"}}>
        <FL label="Тема / тематика" col={2}><Inp value={fields.topic} onChange={set("topic")} placeholder="Переговоры о дедлайнах, small talk, собеседование"/></FL>
        <FL label="Длительность"><Sel options={DURATIONS} value={fields.duration} onChange={set("duration")}/></FL>
        <FL label="Формат"><Sel options={FORMATS} value={fields.lessonFormat} onChange={set("lessonFormat")}/></FL>
        <FL label="Тип занятия" col={2}>
          <div style={{display:"flex",gap:8}}>
            {[["individual","1-to-1"],["group","Группа"]].map(([v,l])=>(
              <Tag key={v} label={l} selected={fields.groupType===v} accent={ac} onClick={()=>setFields(f=>({...f,groupType:v}))}/>
            ))}
          </div>
        </FL>
        <FL label="Фокус навыков" col={2}>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {SKILLS.map(s=><Tag key={s} label={s} selected={fields.skills.includes(s)} accent={ac} onClick={()=>toggleSkill(s)}/>)}
          </div>
        </FL>
        <FL label="Языковые цели" col={2}><Inp value={fields.languageGoals} onChange={set("languageGoals")} placeholder="Present perfect, фразы делового письма, вежливые просьбы"/></FL>
      </div>
    </Card>

    {/* System-A extras */}
    {sys==="A" && (
      <Card style={{marginBottom:14}}>
        <SH icon="ti-eye">Требования к аутентичности</SH>
        <TA value={fields.authenticityNotes} onChange={set("authenticityNotes")} placeholder="Стиль The Guardian, реалистичные имена и места, британский английский, ссылки на 2024 год…"/>
      </Card>
    )}

    {/* System-B extras */}
    {sys==="B" && cat==="exam" && (
      <Card style={{marginBottom:14}}>
        <SH icon="ti-certificate">Целевой экзамен</SH>
        <Sel options={EXAMS} value={fields.examTarget} onChange={set("examTarget")}/>
      </Card>
    )}
    {sys==="B" && (cat==="authentic_material"||cat==="error_correction") && (
      <Card style={{marginBottom:14}}>
        <SH icon="ti-file-text">{cat==="error_correction"?"Языковой образец ученика":"Исходный материал / транскрипт"}</SH>
        <TA rows={5} value={fields.sourceText} onChange={set("sourceText")} placeholder={cat==="error_correction"?"Вставьте сюда письменную работу или транскрипт устной речи ученика…":"Вставьте текст статьи, транскрипт или опишите видео / подкаст…"}/>
      </Card>
    )}

    {/* Notes */}
    <Card style={{marginBottom:16}}>
      <SH icon="ti-notes">Дополнительные заметки</SH>
      <TA rows={2} value={fields.additionalNotes} onChange={set("additionalNotes")} placeholder="Что было на прошлом уроке, материалы которых стоит избежать, контекст подготовки к экзамену…"/>
    </Card>

    {error && (
      <div style={{padding:"10px 14px",borderRadius:8,background:"#FCEBEB",border:"1px solid #F09595",color:"#791F1F",fontSize:13,marginBottom:14}}>
        {error}
      </div>
    )}

    <button
      onClick={generate}
      disabled={loading}
      style={{
        width:"100%", padding:"16px",
        borderRadius:12, border:"none",
        background: loading ? P.tan : ac,
        color:P.white, fontSize:15, fontWeight:700,
        letterSpacing:"0.02em", cursor:loading?"not-allowed":"pointer",
        transition:"background 0.2s, transform 0.1s",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      }}
      onMouseEnter={e=>{if(!loading)e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";}}
    >
      {loading
        ? <><i className="ti ti-loader-2" style={{fontSize:16}} aria-hidden="true"/>Создаю экспертный промпт…</>
        : <><i className="ti ti-sparkles" style={{fontSize:16}} aria-hidden="true"/>Сгенерировать экспертный промпт</>
      }
    </button>
  </>);

  // ── STEP 3: RESULT ────────────────────────────────────────────────────────────
  return shell(<>
    {/* Result header */}
    <div style={{
      background:P.rustDeep,borderRadius:14,
      padding:"20px 24px",marginBottom:16,
      display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
    }}>
      <div>
        <div style={{
          display:"inline-flex",alignItems:"center",gap:6,
          padding:"3px 10px",borderRadius:20,
          background:"rgba(255,255,255,0.12)",marginBottom:8,
        }}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#6EE7B7"}}/>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.8)"}}>Готово к использованию</span>
        </div>
        <h2 style={{fontSize:18,fontWeight:700,color:P.white,margin:"0 0 3px"}}>Ваш экспертный промпт</h2>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{curSys.label} · {curCat.label}{sub&&sub!==curCat.label?` · ${sub}`:""}</p>
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <button onClick={()=>setStep(2)} style={{padding:"7px 13px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.7)",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-edit" style={{fontSize:12}} aria-hidden="true"/>Изменить
        </button>
        <button onClick={reset} style={{padding:"7px 13px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.7)",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-refresh" style={{fontSize:12}} aria-hidden="true"/>Заново
        </button>
        <button onClick={copy} style={{
          padding:"7px 16px",fontSize:12,borderRadius:8,border:"none",
          background:copied?"#059669":P.rust,
          color:P.white,fontWeight:700,cursor:"pointer",
          transition:"background 0.2s",
          display:"flex",alignItems:"center",gap:5,
        }}>
          <i className={`ti ${copied?"ti-check":"ti-copy"}`} style={{fontSize:12}} aria-hidden="true"/>
          {copied?"Скопировано!":"Копировать промпт"}
        </button>
      </div>
    </div>

    {/* Prompt output */}
    <Card style={{marginBottom:14}}>
      <div style={{
        background:P.parchment,borderRadius:10,
        padding:"18px 20px",
        fontSize:12.5,lineHeight:1.8,color:P.coal,
        whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",
        maxHeight:460,overflowY:"auto",
        border:`1px solid ${P.sand}`,
      }}>
        {result}
      </div>
    </Card>

    {/* Tip */}
    <div style={{
      display:"flex",alignItems:"flex-start",gap:10,
      padding:"14px 16px",borderRadius:10,
      background:P.white,border:`1px solid ${P.sand}`,
    }}>
      <i className="ti ti-info-circle" style={{fontSize:16,color:P.rust,flexShrink:0,marginTop:1}} aria-hidden="true"/>
      <p style={{fontSize:12,color:P.charcoal,margin:0,lineHeight:1.6}}>
        Вставьте этот промпт в <strong>Claude</strong>, <strong>ChatGPT</strong> или любой другой LLM — и получите полный готовый учебный материал в одном ответе, без уточняющих вопросов.
      </p>
    </div>
  </>);
}
