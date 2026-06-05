import { useState, createContext, useContext, useEffect, useRef } from "react";

// ─── Config Supabase ──────────────────────────────────────────────────────────
const SUPA_URL = "https://nfpnhyvuwpzezwbmxtgd.supabase.co";
const SUPA_KEY = "sb_publishable_P8-5bnMCTeclywsL6zsmiA_tJADw-m1";

const dbGet    = (t) => fetch(`${SUPA_URL}/rest/v1/${t}?order=id.desc`,{headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}}).then(r=>r.json());
const dbAdd    = (t,d) => fetch(`${SUPA_URL}/rest/v1/${t}`,{method:"POST",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(d)}).then(r=>r.json());
const dbDel    = (t,id) => fetch(`${SUPA_URL}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`}});
const dbPatch  = (t,id,d) => fetch(`${SUPA_URL}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Content-Type":"application/json"},body:JSON.stringify(d)});

// ─── Thème ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext();
const useTheme = () => useContext(ThemeCtx);

const DARK = {
  bg:"#000",bgCard:"#1C1C1E",bgHeader:"rgba(0,0,0,0.92)",
  border:"rgba(255,255,255,0.08)",borderLight:"rgba(255,255,255,0.05)",
  text:"#F2F2F7",textSub:"#AEAEB2",textMuted:"#636366",textFaint:"#3A3A3C",
  input:"rgba(255,255,255,0.07)",inputBorder:"rgba(255,255,255,0.12)",
  tableHead:"rgba(255,255,255,0.03)",sel:"#1C1C1E",toggleBg:"#2C2C2E",
  shadow:"0 4px 24px rgba(0,0,0,0.5)",logoText:"white",
  badgeApp:{bg:"#1C3A27",color:"#30D158"},badgeRej:{bg:"#3A1C1C",color:"#FF453A"},badgePend:{bg:"#3A2F1C",color:"#FF9F0A"},
};
const LIGHT = {
  bg:"#F2F2F7",bgCard:"#FFFFFF",bgHeader:"rgba(255,255,255,0.92)",
  border:"rgba(0,0,0,0.08)",borderLight:"rgba(0,0,0,0.06)",
  text:"#1C1C1E",textSub:"#3A3A3C",textMuted:"#636366",textFaint:"#AEAEB2",
  input:"#FFFFFF",inputBorder:"rgba(0,0,0,0.12)",
  tableHead:"rgba(0,0,0,0.02)",sel:"#FFFFFF",toggleBg:"#E5E5EA",
  shadow:"0 4px 24px rgba(0,0,0,0.08)",logoText:"#1C1C1E",
  badgeApp:{bg:"#D4EFDD",color:"#1A7A35"},badgeRej:{bg:"#FDDEDE",color:"#C0392B"},badgePend:{bg:"#FFF3D4",color:"#B8730A"},
};

// ─── Logo SVG ─────────────────────────────────────────────────────────────────
const AngyLogo = ({height=50,forPrint=false}) => {
  const ctx = useContext(ThemeCtx);
  const dark = ctx ? ctx.dark : false;
  const textColor = forPrint ? "#1C1C1E" : (dark ? "#ffffff" : "#1C1C1E");
  return (
    <svg height={height} viewBox="0 0 420 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crochet bleu — bas gauche */}
      <rect x="10" y="20" width="12" height="65" fill="#1400FF"/>
      <rect x="10" y="73" width="60" height="12" fill="#1400FF"/>
      {/* Crochet rouge — haut droite */}
      <rect x="408" y="20" width="12" height="50" fill="#CC0000"/>
      <rect x="350" y="20" width="70" height="12" fill="#CC0000"/>
      {/* Cercles ANGY avec fond blanc et bordure noire */}
      {[["A",50],["N",90],["G",130],["Y",170]].map(([l,cx])=>(
        <g key={l}>
          <circle cx={cx} cy="50" r="22" fill="white" stroke="#1C1C1E" strokeWidth="3"/>
          <text x={cx} y="57" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="20" fill="#1C1C1E">{l}</text>
        </g>
      ))}
      {/* Company */}
      <text x="207" y="60" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="32" fill={textColor}>Company</text>
    </svg>
  );
};

// ─── Catégories par défaut ────────────────────────────────────────────────────
const DEFAULT_CAT_DEP = [
  {id:"iphones",label:"iPhones",icon:"📱",color:"#0A84FF"},
  {id:"accessoires",label:"Accessoires",icon:"🎧",color:"#30D158"},
  {id:"ordinateurs",label:"Ordinateurs",icon:"💻",color:"#FF9F0A"},
  {id:"pieces",label:"Pièces détachées",icon:"🔧",color:"#FF453A"},
  {id:"livraison",label:"Livraison",icon:"🚚",color:"#64D2FF"},
  {id:"marketing",label:"Marketing",icon:"📣",color:"#FFD60A"},
  {id:"loyer",label:"Loyer / Local",icon:"🏬",color:"#FF6B35"},
  {id:"salaires",label:"Salaires",icon:"👥",color:"#BF5AF2"},
  {id:"autre",label:"Autre",icon:"📎",color:"#8E8E93"},
];
const DEFAULT_CAT_STK = [
  {id:"iphones",label:"iPhones",icon:"📱"},
  {id:"accessoires",label:"Accessoires",icon:"🎧"},
  {id:"ordinateurs",label:"Ordinateurs",icon:"💻"},
  {id:"pieces",label:"Pièces",icon:"🔧"},
];
const COLORS = ["#0A84FF","#30D158","#FF9F0A","#FF453A","#64D2FF","#FFD60A","#FF6B35","#BF5AF2","#8E8E93","#FF2D55","#5E5CE6","#00C7BE"];
const ICONS  = ["📱","💻","🎧","🔧","📦","🚚","📣","🏬","👥","📎","🛒","💳","🖨️","🖥️","⌨️","🖱️","📷","🎮","🔋","💡"];

const xof   = n => new Intl.NumberFormat("fr-SN",{style:"currency",currency:"XOF",maximumFractionDigits:0}).format(n);
const today = () => new Date().toISOString().split("T")[0];
const getCat = (list,id) => list.find(c=>c.id===id)||list[list.length-1];
const stStyle = (s,theme) => s==="Approuvée"?theme.badgeApp:s==="Rejetée"?theme.badgeRej:theme.badgePend;

// ─── UI Components ────────────────────────────────────────────────────────────
const Badge = ({s}) => {
  const {theme}=useTheme();
  const st=stStyle(s,theme);
  return <span style={{display:"inline-block",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,background:st.bg,color:st.color}}>{s}</span>;
};
const KPI = ({label,value,sub,accent,icon}) => {
  const {theme}=useTheme();
  return (
    <div style={{background:theme.bgCard,borderRadius:16,padding:"20px 22px",border:`1px solid ${theme.border}`,position:"relative",overflow:"hidden",boxShadow:theme.shadow}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accent,borderRadius:"16px 16px 0 0"}}/>
      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
      <div style={{fontSize:12,color:theme.textMuted,fontWeight:500,marginBottom:6}}>{label}</div>
      <div style={{fontSize:24,fontWeight:800,color:accent,letterSpacing:"-0.5px"}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:theme.textFaint,marginTop:4}}>{sub}</div>}
    </div>
  );
};
const Card = ({children,style={}}) => {
  const {theme}=useTheme();
  return <div style={{background:theme.bgCard,borderRadius:16,padding:"20px 22px",border:`1px solid ${theme.border}`,boxShadow:theme.shadow,...style}}>{children}</div>;
};
const CardTitle = ({children}) => {
  const {theme}=useTheme();
  return <div style={{fontSize:12,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>{children}</div>;
};
const TableWrap = ({children}) => {
  const {theme}=useTheme();
  return <div style={{background:theme.bgCard,borderRadius:16,border:`1px solid ${theme.border}`,overflow:"hidden",boxShadow:theme.shadow}}>{children}</div>;
};
const Th = ({children}) => {
  const {theme}=useTheme();
  return <th style={{padding:"12px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:theme.textMuted,background:theme.tableHead,borderBottom:`1px solid ${theme.border}`}}>{children}</th>;
};
const Td = ({children,style={}}) => {
  const {theme}=useTheme();
  return <td style={{padding:"12px 14px",fontSize:13,verticalAlign:"middle",color:theme.text,borderBottom:`1px solid ${theme.borderLight}`,...style}}>{children}</td>;
};
const BtnPri = ({children,onClick,style={}}) => (
  <button onClick={onClick} style={{background:"#0A84FF",color:"#fff",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit",...style}}>{children}</button>
);
const BtnSec = ({children,onClick,style={}}) => {
  const {theme}=useTheme();
  return <button onClick={onClick} style={{background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,padding:"10px 18px",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit",...style}}>{children}</button>;
};
const Inp = ({label,value,onChange,type="text",placeholder=""}) => {
  const {theme}=useTheme();
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
    </div>
  );
};
const SelInput = ({label,value,onChange,options}) => {
  const {theme}=useTheme();
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>{label}</label>}
      <select value={value} onChange={onChange} style={{background:theme.sel,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
};
const SelFilter = ({value,onChange,children}) => {
  const {theme}=useTheme();
  return <select value={value} onChange={onChange} style={{background:theme.sel,border:`1px solid ${theme.border}`,borderRadius:9,padding:"8px 12px",color:theme.text,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{children}</select>;
};
const Toast = ({msg,err}) => (
  <div style={{position:"fixed",bottom:24,right:24,zIndex:999,padding:"12px 20px",borderRadius:12,
    background:err?"#3A1C1C":"#1C3A27",border:`1px solid ${err?"#FF453A":"#30D158"}`,
    color:err?"#FF453A":"#30D158",fontWeight:600,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
    {err?"❌":"✅"} {msg}
  </div>
);
const ThemeToggle = () => {
  const {dark,toggle,theme}=useTheme();
  return (
    <button onClick={toggle} style={{background:theme.toggleBg,border:"none",borderRadius:20,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:18}}>{dark?"☀️":"🌙"}</span>
      <span style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>{dark?"Clair":"Sombre"}</span>
    </button>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({depenses,stock,ventes,factures}) {
  const {theme}=useTheme();
  const totalDep=depenses.filter(d=>d.statut==="Approuvée").reduce((s,d)=>s+d.montant,0);
  const totalVentes=ventes.reduce((s,v)=>s+v.prix_vente*v.qte,0);
  const totalFactures=factures.reduce((s,f)=>s+f.total,0);
  const stockVal=stock.reduce((s,p)=>s+p.prix_achat*p.qte,0);
  const benefice=totalVentes-totalDep;
  const alertes=stock.filter(p=>p.qte<=p.seuil);
  const mois=["Jan","Fév","Mar","Avr","Mai","Jun"];
  const ventesData=[420000,680000,540000,820000,960000,Math.max(totalVentes,1)];
  const maxV=Math.max(...ventesData);
  return (
    <div>
      <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:"0 0 22px",color:theme.text}}>Tableau de bord</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        <KPI label="Chiffre d'affaires" value={xof(totalVentes)} accent="#0A84FF" icon="💰" sub={`${ventes.length} ventes`}/>
        <KPI label="Dépenses approuvées" value={xof(totalDep)} accent="#FF453A" icon="📤" sub={`${depenses.filter(d=>d.statut==="Approuvée").length} entrées`}/>
        <KPI label="Bénéfice net" value={xof(benefice)} accent={benefice>=0?"#30D158":"#FF453A"} icon="📈" sub="CA − dépenses"/>
        <KPI label="Factures émises" value={xof(totalFactures)} accent="#BF5AF2" icon="🧾" sub={`${factures.length} factures`}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        <Card>
          <CardTitle>Évolution des ventes</CardTitle>
          <div style={{display:"flex",alignItems:"flex-end",gap:10,height:130,paddingTop:10}}>
            {mois.map((m,i)=>(
              <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <div style={{fontSize:9,color:theme.textMuted}}>{Math.round(ventesData[i]/1000)}k</div>
                <div style={{width:"100%",background:i===5?"#0A84FF":"rgba(10,132,255,0.2)",height:`${Math.max(8,Math.round((ventesData[i]/maxV)*100))}px`,borderRadius:"5px 5px 0 0"}}/>
                <div style={{fontSize:11,color:i===5?"#0A84FF":theme.textMuted,fontWeight:i===5?700:400}}>{m}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>⚠️ Alertes stock ({alertes.length})</CardTitle>
          {alertes.length===0
            ?<div style={{color:"#30D158",fontSize:13,marginTop:12}}>✓ Tout le stock est OK</div>
            :alertes.map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:theme.text}}>{p.nom}</div>
                  <div style={{fontSize:11,color:theme.textMuted}}>Seuil: {p.seuil}</div>
                </div>
                <span style={{background:p.qte===0?theme.badgeRej.bg:theme.badgePend.bg,color:p.qte===0?theme.badgeRej.color:theme.badgePend.color,padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>{p.qte} unité{p.qte!==1?"s":""}</span>
              </div>
            ))
          }
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card>
          <CardTitle>Dernières factures</CardTitle>
          {factures.length===0?<div style={{color:theme.textMuted,fontSize:13}}>Aucune facture</div>:factures.slice(0,4).map(f=>(
            <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:theme.text}}>Facture #{f.numero}</div>
                <div style={{fontSize:11,color:theme.textMuted}}>{f.client} · {f.date}</div>
              </div>
              <div style={{fontWeight:700,color:"#BF5AF2",fontSize:13}}>{xof(f.total)}</div>
            </div>
          ))}
        </Card>
        <Card>
          <CardTitle>Dernières dépenses</CardTitle>
          {depenses.slice(0,4).map(d=>(
            <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:theme.text}}>{d.titre}</div>
                <div style={{fontSize:11,color:theme.textMuted}}>{d.date}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#FF453A"}}>{xof(d.montant)}</div>
                <Badge s={d.statut}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Catégories ───────────────────────────────────────────────────────────────
function Categories({catDep,setCatDep,catStk,setCatStk,showToast}) {
  const {theme}=useTheme();
  const [tab,setTab]=useState("dep");
  const [form,setForm]=useState({label:"",icon:"📱",color:"#0A84FF",where:"dep"});
  const [showForm,setShowForm]=useState(false);

  const addCat=()=>{
    if(!form.label.trim())return showToast("Nom requis",true);
    const id=form.label.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    const newCat={id,label:form.label,icon:form.icon,color:form.color};
    if(form.where==="dep"||form.where==="both"){setCatDep([...catDep,newCat]);}
    if(form.where==="stk"||form.where==="both"){setCatStk([...catStk,newCat]);}
    setForm({label:"",icon:"📱",color:"#0A84FF",where:"dep"});
    setShowForm(false);
    showToast("Catégorie ajoutée ✓");
  };

  const delCat=(id,type)=>{
    if(type==="dep")setCatDep(catDep.filter(c=>c.id!==id));
    else setCatStk(catStk.filter(c=>c.id!==id));
    showToast("Catégorie supprimée");
  };

  const cats=tab==="dep"?catDep:catStk;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Catégories</h1>
        <BtnPri onClick={()=>setShowForm(!showForm)}>{showForm?"✕ Annuler":"+ Nouvelle catégorie"}</BtnPri>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["dep","Dépenses"],["stk","Stock"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            style={{padding:"8px 20px",borderRadius:10,border:"1px solid",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit",
              borderColor:tab===v?"#0A84FF":theme.border,background:tab===v?"rgba(10,132,255,0.12)":theme.toggleBg,color:tab===v?"#0A84FF":theme.textMuted}}>
            {l}
          </button>
        ))}
      </div>

      {showForm&&(
        <Card style={{marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:14}}>Nouvelle catégorie</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <Inp label="Nom *" value={form.label} onChange={e=>setForm({...form,label:e.target.value})} placeholder="Ex: Tablettes"/>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Utiliser dans</label>
              <div style={{display:"flex",gap:8}}>
                {[["dep","📤 Dépenses"],["stk","📦 Stock"],["both","Les deux"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm({...form,where:v})}
                    style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",
                      borderColor:form.where===v?"#0A84FF":theme.border,background:form.where===v?"rgba(10,132,255,0.15)":theme.toggleBg,color:form.where===v?"#0A84FF":theme.textMuted}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Icône</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {ICONS.map(ic=>(
                  <button key={ic} onClick={()=>setForm({...form,icon:ic})}
                    style={{width:36,height:36,borderRadius:8,border:`2px solid ${form.icon===ic?"#0A84FF":theme.border}`,
                      background:form.icon===ic?"rgba(10,132,255,0.12)":theme.toggleBg,cursor:"pointer",fontSize:18}}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Couleur</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {COLORS.map(col=>(
                  <button key={col} onClick={()=>setForm({...form,color:col})}
                    style={{width:28,height:28,borderRadius:99,background:col,border:`3px solid ${form.color===col?"#fff":col}`,cursor:"pointer",boxShadow:form.color===col?"0 0 0 2px #0A84FF":"none"}}>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Aperçu</label>
              <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,background:form.color+"22",color:form.color,alignSelf:"flex-start"}}>
                {form.icon} {form.label||"Ma catégorie"}
              </span>
            </div>
          </div>
          <BtnPri onClick={addCat}>Ajouter</BtnPri>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {cats.map(c=>(
          <div key={c.id} style={{background:theme.bgCard,borderRadius:14,padding:"16px 18px",border:`1px solid ${theme.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:theme.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:40,height:40,borderRadius:10,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{c.icon}</div>
              <div>
                <div style={{fontWeight:700,color:theme.text,fontSize:14}}>{c.label}</div>
                <span style={{fontSize:11,fontWeight:600,color:c.color}}>{c.id}</span>
              </div>
            </div>
            {!DEFAULT_CAT_DEP.find(d=>d.id===c.id)&&!DEFAULT_CAT_STK.find(d=>d.id===c.id)&&(
              <button onClick={()=>delCat(c.id,tab)} style={{background:"none",border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12}}>🗑</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dépenses ─────────────────────────────────────────────────────────────────
function Depenses({depenses,setDepenses,catDep,showToast}) {
  const {theme}=useTheme();
  const [fCat,setFCat]=useState("all");
  const [fStat,setFStat]=useState("all");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({titre:"",cat:catDep[0]?.id||"iphones",montant:"",date:today(),statut:"En attente",note:""});

  const filtered=depenses.filter(d=>(fCat==="all"||d.cat===fCat)&&(fStat==="all"||d.statut===fStat));
  const total=filtered.filter(d=>d.statut==="Approuvée").reduce((s,d)=>s+d.montant,0);

  const add=async()=>{
    if(!form.titre||!form.montant)return showToast("Titre et montant requis",true);
    setLoading(true);
    try{
      const rows=await dbAdd("depenses",{titre:form.titre,cat:form.cat,montant:parseInt(form.montant),date:form.date,statut:form.statut,note:form.note});
      setDepenses([rows[0],...depenses]);
      setForm({titre:"",cat:catDep[0]?.id||"iphones",montant:"",date:today(),statut:"En attente",note:""});
      setShow(false);
      showToast("Dépense enregistrée ✓");
    }catch(e){showToast("Erreur",true);}
    setLoading(false);
  };
  const del=async(id)=>{await dbDel("depenses",id);setDepenses(depenses.filter(d=>d.id!==id));showToast("Supprimée");};
  const [editId,setEditId]=useState(null);
  const [editForm,setEditForm]=useState({});
  const chStat=async(id,statut)=>{await dbPatch("depenses",id,{statut});setDepenses(depenses.map(d=>d.id===id?{...d,statut}:d));showToast("Statut mis à jour");};
  const startEdit=(d)=>{setEditId(d.id);setEditForm({titre:d.titre,cat:d.cat,montant:d.montant,date:d.date,statut:d.statut,note:d.note||""});setShow(false);};
  const saveEdit=async()=>{
    await dbPatch("depenses",editId,{...editForm,montant:parseInt(editForm.montant)});
    setDepenses(depenses.map(d=>d.id===editId?{...d,...editForm,montant:parseInt(editForm.montant)}:d));
    setEditId(null);showToast("Dépense modifiée ✓");
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Dépenses</h1>
        <BtnPri onClick={()=>{setShow(!show);setEditId(null);}}>{show?"✕ Annuler":"+ Nouvelle dépense"}</BtnPri>
      </div>
      {show&&(
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:14}}>Nouvelle dépense</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
            <Inp label="Titre *" value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})} placeholder="Ex: iPhone lot x5"/>
            <Inp label="Montant (FCFA) *" type="number" value={form.montant} onChange={e=>setForm({...form,montant:e.target.value})} placeholder="0"/>
            <SelInput label="Catégorie" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} options={catDep.map(c=>({v:c.id,l:`${c.icon} ${c.label}`}))}/>
            <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            <SelInput label="Statut" value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})} options={["En attente","Approuvée","Rejetée"].map(s=>({v:s,l:s}))}/>
            <Inp label="Note" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Optionnel"/>
          </div>
          <BtnPri onClick={add} style={{opacity:loading?0.6:1}}>{loading?"Enregistrement...":"Enregistrer"}</BtnPri>
        </Card>
      )}
      {editId&&(
        <Card style={{marginBottom:16,borderColor:"rgba(255,159,10,0.4)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#FF9F0A",marginBottom:14}}>✏️ Modifier la dépense</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
            <Inp label="Titre *" value={editForm.titre} onChange={e=>setEditForm({...editForm,titre:e.target.value})}/>
            <Inp label="Montant (FCFA) *" type="number" value={editForm.montant} onChange={e=>setEditForm({...editForm,montant:e.target.value})}/>
            <SelInput label="Catégorie" value={editForm.cat} onChange={e=>setEditForm({...editForm,cat:e.target.value})} options={catDep.map(c=>({v:c.id,l:`${c.icon} ${c.label}`}))}/>
            <Inp label="Date" type="date" value={editForm.date} onChange={e=>setEditForm({...editForm,date:e.target.value})}/>
            <SelInput label="Statut" value={editForm.statut} onChange={e=>setEditForm({...editForm,statut:e.target.value})} options={["En attente","Approuvée","Rejetée"].map(s=>({v:s,l:s}))}/>
            <Inp label="Note" value={editForm.note} onChange={e=>setEditForm({...editForm,note:e.target.value})}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <BtnPri onClick={saveEdit}>💾 Sauvegarder</BtnPri>
            <BtnSec onClick={()=>setEditId(null)}>Annuler</BtnSec>
          </div>
        </Card>
      )}
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <SelFilter value={fCat} onChange={e=>setFCat(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {catDep.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </SelFilter>
        <SelFilter value={fStat} onChange={e=>setFStat(e.target.value)}>
          <option value="all">Tous statuts</option>
          {["En attente","Approuvée","Rejetée"].map(s=><option key={s} value={s}>{s}</option>)}
        </SelFilter>
        <div style={{marginLeft:"auto",color:theme.textMuted,fontSize:13}}>Total approuvé : <strong style={{color:"#FF453A"}}>{xof(total)}</strong></div>
      </div>
      <TableWrap>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Dépense","Catégorie","Date","Montant","Statut","Actions"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {filtered.length===0&&<tr><Td colSpan={6} style={{textAlign:"center",color:theme.textMuted,padding:"2rem"}}>Aucune dépense</Td></tr>}
            {filtered.map(d=>{
              const cat=getCat(catDep,d.cat);
              return (
                <tr key={d.id} style={{background:editId===d.id?"rgba(255,159,10,0.05)":"transparent"}}>
                  <Td><strong style={{color:theme.text}}>{d.titre}</strong>{d.note&&<div style={{fontSize:11,color:theme.textMuted}}>{d.note}</div>}</Td>
                  <Td><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:600,background:cat.color+"22",color:cat.color}}>{cat.icon} {cat.label}</span></Td>
                  <Td style={{color:theme.textMuted,fontSize:13}}>{d.date}</Td>
                  <Td style={{fontWeight:700,color:"#FF453A"}}>{xof(d.montant)}</Td>
                  <Td><Badge s={d.statut}/></Td>
                  <Td>
                    <div style={{display:"flex",gap:6}}>
                      <button style={{background:"rgba(255,159,10,0.12)",border:"1px solid #FF9F0A",color:"#FF9F0A",padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}} onClick={()=>startEdit(d)}>✏️</button>
                      {d.statut!=="Approuvée"&&<button style={{background:"none",border:"1px solid #30D158",color:"#30D158",padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}} onClick={()=>chStat(d.id,"Approuvée")}>✓</button>}
                      {d.statut!=="Rejetée"&&<button style={{background:"none",border:"1px solid #FF453A",color:"#FF453A",padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}} onClick={()=>chStat(d.id,"Rejetée")}>✕</button>}
                      <button style={{background:"none",border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onClick={()=>del(d.id)}>🗑</button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

// ─── Stock ────────────────────────────────────────────────────────────────────
function Stock({stock,setStock,ventes,setVentes,catStk,showToast}) {
  const {theme}=useTheme();
  const [showAdd,setShowAdd]=useState(false);
  const [showVente,setShowVente]=useState(null);
  const [form,setForm]=useState({nom:"",cat:catStk[0]?.id||"iphones",qte:"",prix_achat:"",prix_vente:"",seuil:""});
  const [vf,setVf]=useState({qte:"",client:"",date:today()});
  const [fCat,setFCat]=useState("all");
  const [loading,setLoading]=useState(false);
  const [editId,setEditId]=useState(null);
  const [editForm,setEditForm]=useState({});

  const filtered=stock.filter(p=>fCat==="all"||p.cat===fCat);

  const startEdit=(p)=>{setEditId(p.id);setEditForm({nom:p.nom,cat:p.cat,qte:p.qte,prix_achat:p.prix_achat,prix_vente:p.prix_vente,seuil:p.seuil});setShowAdd(false);setShowVente(null);};
  const saveEdit=async()=>{
    await dbPatch("stock",editId,{nom:editForm.nom,cat:editForm.cat,qte:parseInt(editForm.qte),prix_achat:parseInt(editForm.prix_achat),prix_vente:parseInt(editForm.prix_vente),seuil:parseInt(editForm.seuil)||0});
    setStock(stock.map(p=>p.id===editId?{...p,...editForm,qte:parseInt(editForm.qte),prix_achat:parseInt(editForm.prix_achat),prix_vente:parseInt(editForm.prix_vente),seuil:parseInt(editForm.seuil)||0}:p));
    setEditId(null);showToast("Produit modifié ✓");
  };

  const addProd=async()=>{
    if(!form.nom||!form.qte||!form.prix_achat||!form.prix_vente)return showToast("Remplissez tous les champs",true);
    setLoading(true);
    try{
      const rows=await dbAdd("stock",{nom:form.nom,cat:form.cat,qte:parseInt(form.qte),prix_achat:parseInt(form.prix_achat),prix_vente:parseInt(form.prix_vente),seuil:parseInt(form.seuil)||0});
      setStock([rows[0],...stock]);
      setForm({nom:"",cat:catStk[0]?.id||"iphones",qte:"",prix_achat:"",prix_vente:"",seuil:""});
      setShowAdd(false);
      showToast("Produit ajouté ✓");
    }catch(e){showToast("Erreur",true);}
    setLoading(false);
  };

  const vendre=async()=>{
    const p=stock.find(x=>x.id===showVente);
    if(!p||!vf.qte||parseInt(vf.qte)>p.qte)return showToast("Quantité invalide",true);
    const q=parseInt(vf.qte);
    setLoading(true);
    try{
      await dbPatch("stock",p.id,{qte:p.qte-q});
      const rows=await dbAdd("ventes",{produit:p.nom,cat:p.cat,qte:q,prix_vente:p.prix_vente,date:vf.date,client:vf.client||"—"});
      setStock(stock.map(x=>x.id===showVente?{...x,qte:x.qte-q}:x));
      setVentes([rows[0],...ventes]);
      setVf({qte:"",client:"",date:today()});
      setShowVente(null);
      showToast("Vente enregistrée ✓");
    }catch(e){showToast("Erreur",true);}
    setLoading(false);
  };

  const del=async(id)=>{await dbDel("stock",id);setStock(stock.filter(p=>p.id!==id));showToast("Supprimé");};
  const adj=async(id,delta)=>{const p=stock.find(x=>x.id===id);const nq=Math.max(0,p.qte+delta);await dbPatch("stock",id,{qte:nq});setStock(stock.map(x=>x.id===id?{...x,qte:nq}:x));};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Stock</h1>
        <BtnPri onClick={()=>setShowAdd(!showAdd)}>{showAdd?"✕ Annuler":"+ Ajouter produit"}</BtnPri>
      </div>
      {showAdd&&(
        <Card style={{marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:12}}>
            <Inp label="Nom *" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Ex: iPhone 15 Pro"/>
            <SelInput label="Catégorie" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} options={catStk.map(c=>({v:c.id,l:`${c.icon} ${c.label}`}))}/>
            <Inp label="Quantité *" type="number" value={form.qte} onChange={e=>setForm({...form,qte:e.target.value})} placeholder="0"/>
            <Inp label="Prix achat (FCFA) *" type="number" value={form.prix_achat} onChange={e=>setForm({...form,prix_achat:e.target.value})} placeholder="0"/>
            <Inp label="Prix vente (FCFA) *" type="number" value={form.prix_vente} onChange={e=>setForm({...form,prix_vente:e.target.value})} placeholder="0"/>
            <Inp label="Seuil alerte" type="number" value={form.seuil} onChange={e=>setForm({...form,seuil:e.target.value})} placeholder="3"/>
          </div>
          <BtnPri onClick={addProd} style={{opacity:loading?0.6:1}}>{loading?"Ajout...":"Ajouter au stock"}</BtnPri>
        </Card>
      )}
      {showVente!==null&&(()=>{
        const p=stock.find(x=>x.id===showVente);
        return p?(
          <Card style={{marginBottom:16,borderColor:"rgba(48,209,88,0.3)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#30D158",marginBottom:14}}>💸 Vente — {p.nom}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:12}}>
              <Inp label={`Quantité (max: ${p.qte})`} type="number" value={vf.qte} onChange={e=>setVf({...vf,qte:e.target.value})} placeholder="1"/>
              <Inp label="Client" value={vf.client} onChange={e=>setVf({...vf,client:e.target.value})} placeholder="Nom du client"/>
              <Inp label="Date" type="date" value={vf.date} onChange={e=>setVf({...vf,date:e.target.value})}/>
            </div>
            <div style={{fontSize:13,color:theme.textMuted,marginBottom:12}}>
              Prix unitaire : <strong style={{color:"#30D158"}}>{xof(p.prix_vente)}</strong>
              {vf.qte&&<> — Total : <strong style={{color:"#30D158"}}>{xof(parseInt(vf.qte||0)*p.prix_vente)}</strong></>}
            </div>
            <div style={{display:"flex",gap:10}}>
              <BtnPri onClick={vendre} style={{opacity:loading?0.6:1}}>{loading?"...":"Confirmer la vente"}</BtnPri>
              <BtnSec onClick={()=>{setShowVente(null);setVf({qte:"",client:"",date:today()});}}>Annuler</BtnSec>
            </div>
          </Card>
        ):null;
      })()}
      {editId&&(
        <Card style={{marginBottom:16,borderColor:"rgba(255,159,10,0.4)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#FF9F0A",marginBottom:14}}>✏️ Modifier le produit</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:12}}>
            <Inp label="Nom *" value={editForm.nom} onChange={e=>setEditForm({...editForm,nom:e.target.value})}/>
            <SelInput label="Catégorie" value={editForm.cat} onChange={e=>setEditForm({...editForm,cat:e.target.value})} options={catStk.map(c=>({v:c.id,l:`${c.icon} ${c.label}`}))}/>
            <Inp label="Quantité" type="number" value={editForm.qte} onChange={e=>setEditForm({...editForm,qte:e.target.value})}/>
            <Inp label="Prix achat (FCFA)" type="number" value={editForm.prix_achat} onChange={e=>setEditForm({...editForm,prix_achat:e.target.value})}/>
            <Inp label="Prix vente (FCFA)" type="number" value={editForm.prix_vente} onChange={e=>setEditForm({...editForm,prix_vente:e.target.value})}/>
            <Inp label="Seuil alerte" type="number" value={editForm.seuil} onChange={e=>setEditForm({...editForm,seuil:e.target.value})}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <BtnPri onClick={saveEdit}>💾 Sauvegarder</BtnPri>
            <BtnSec onClick={()=>setEditId(null)}>Annuler</BtnSec>
          </div>
        </Card>
      )}
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <SelFilter value={fCat} onChange={e=>setFCat(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {catStk.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </SelFilter>
        <div style={{marginLeft:"auto",fontSize:13,color:theme.textMuted}}>Valeur : <strong style={{color:"#FF9F0A"}}>{xof(stock.reduce((s,p)=>s+p.prix_achat*p.qte,0))}</strong></div>
      </div>
      <TableWrap>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Produit","Cat.","Qté","Prix achat","Prix vente","Marge","Statut","Actions"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {filtered.length===0&&<tr><Td colSpan={8} style={{textAlign:"center",color:theme.textMuted,padding:"2rem"}}>Aucun produit</Td></tr>}
            {filtered.map(p=>{
              const cat=getCat(catStk,p.cat);
              const marge=Math.round(((p.prix_vente-p.prix_achat)/p.prix_achat)*100);
              const bas=p.qte<=p.seuil;
              return (
                <tr key={p.id} style={{background:editId===p.id?"rgba(255,159,10,0.05)":"transparent"}}>
                  <Td><strong style={{color:theme.text}}>{p.nom}</strong></Td>
                  <Td style={{color:theme.textSub}}>{cat.icon} {cat.label}</Td>
                  <Td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.text,width:22,height:22,borderRadius:5,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}} onClick={()=>adj(p.id,-1)}>−</button>
                      <span style={{fontWeight:700,color:bas?"#FF453A":"#30D158",minWidth:24,textAlign:"center"}}>{p.qte}</span>
                      <button style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.text,width:22,height:22,borderRadius:5,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}} onClick={()=>adj(p.id,1)}>+</button>
                    </div>
                  </Td>
                  <Td style={{color:theme.textMuted}}>{xof(p.prix_achat)}</Td>
                  <Td style={{fontWeight:700,color:"#30D158"}}>{xof(p.prix_vente)}</Td>
                  <Td><span style={{color:"#FF9F0A",fontWeight:700}}>+{marge}%</span></Td>
                  <Td>{p.qte===0?<span style={{color:"#FF453A",fontWeight:700,fontSize:12}}>RUPTURE</span>:bas?<span style={{color:"#FF9F0A",fontWeight:700,fontSize:12}}>⚠️ BAS</span>:<span style={{color:"#30D158",fontSize:12}}>✓ OK</span>}</Td>
                  <Td>
                    <div style={{display:"flex",gap:6}}>
                      <button style={{background:"rgba(255,159,10,0.12)",border:"1px solid #FF9F0A",color:"#FF9F0A",padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}} onClick={()=>startEdit(p)}>✏️</button>
                      <button style={{background:"rgba(48,209,88,0.12)",border:"1px solid #30D158",color:"#30D158",padding:"4px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}} onClick={()=>setShowVente(p.id)}>💸 Vendre</button>
                      <button style={{background:"none",border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onClick={()=>del(p.id)}>🗑</button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

// ─── Factures ─────────────────────────────────────────────────────────────────
function Factures({factures,setFactures,stock,showToast}) {
  const {theme}=useTheme();
  const [show,setShow]=useState(false);
  const [preview,setPreview]=useState(null);
  const printRef=useRef();
  const [loading,setLoading]=useState(false);
  const [lignes,setLignes]=useState([{desc:"",qte:1,pu:0}]);
  const [form,setForm]=useState({client:"",email:"",telephone:"",adresse:"",date:today(),note:""});

  const totalLignes=lignes.reduce((s,l)=>s+l.qte*l.pu,0);
  const numFacture=()=>`FAC-${new Date().getFullYear()}-${String(factures.length+1).padStart(3,"0")}`;

  const addLigne=()=>setLignes([...lignes,{desc:"",qte:1,pu:0}]);
  const updLigne=(i,field,val)=>setLignes(lignes.map((l,idx)=>idx===i?{...l,[field]:field==="qte"||field==="pu"?Number(val):val}:l));
  const delLigne=i=>setLignes(lignes.filter((_,idx)=>idx!==i));

  const creerFacture=async()=>{
    if(!form.client||lignes.some(l=>!l.desc))return showToast("Client et descriptions requis",true);
    setLoading(true);
    try{
      const numero=numFacture();
      const data={numero,client:form.client,email:form.email,telephone:form.telephone,adresse:form.adresse,date:form.date,note:form.note,lignes:JSON.stringify(lignes),total:totalLignes};
      const rows=await dbAdd("factures",data);
      setFactures([rows[0],...factures]);
      setPreview(rows[0]);
      setShow(false);
      setForm({client:"",email:"",telephone:"",adresse:"",date:today(),note:""});
      setLignes([{desc:"",qte:1,pu:0}]);
      showToast("Facture créée ✓");
    }catch(e){showToast("Erreur: "+e.message,true);}
    setLoading(false);
  };

  const imprimer=()=>{
    const content=printRef.current.innerHTML;
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>Facture Angy Company</title><style>
      body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1C1C1E;}
      table{width:100%;border-collapse:collapse;}
      th{background:#f5f5f7;padding:10px;text-align:left;font-size:12px;}
      td{padding:10px;border-bottom:1px solid #e5e5ea;font-size:13px;}
      .total{font-size:20px;font-weight:800;color:#0A84FF;}
    </style></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  };

  const del=async(id)=>{await dbDel("factures",id);setFactures(factures.filter(f=>f.id!==id));if(preview?.id===id)setPreview(null);showToast("Supprimée");};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Factures</h1>
        <div style={{display:"flex",gap:8}}>
          {preview&&<BtnSec onClick={imprimer}>🖨️ Imprimer</BtnSec>}
          <BtnPri onClick={()=>{setShow(!show);setPreview(null);}}>{show?"✕ Annuler":"+ Nouvelle facture"}</BtnPri>
        </div>
      </div>

      {/* Formulaire nouvelle facture */}
      {show&&(
        <Card style={{marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:700,color:theme.text,marginBottom:16}}>Nouvelle facture — {numFacture()}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <Inp label="Nom du client *" value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Ex: Moussa Diallo"/>
            <Inp label="Téléphone" value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+221 77 000 00 00"/>
            <Inp label="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="client@email.com"/>
            <Inp label="Adresse" value={form.adresse} onChange={e=>setForm({...form,adresse:e.target.value})} placeholder="Dakar, Sénégal"/>
            <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            <Inp label="Note" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Merci pour votre confiance"/>
          </div>

          {/* Lignes */}
          <div style={{fontSize:13,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Articles</div>
          <div style={{marginBottom:12}}>
            {lignes.map((l,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr auto",gap:8,marginBottom:8,alignItems:"center"}}>
                <Inp value={l.desc} onChange={e=>updLigne(i,"desc",e.target.value)} placeholder="Description de l'article"/>
                <Inp type="number" value={l.qte} onChange={e=>updLigne(i,"qte",e.target.value)} placeholder="Qté"/>
                <Inp type="number" value={l.pu} onChange={e=>updLigne(i,"pu",e.target.value)} placeholder="Prix unit."/>
                <button onClick={()=>delLigne(i)} style={{background:"none",border:`1px solid ${theme.border}`,color:"#FF453A",padding:"9px 10px",borderRadius:9,cursor:"pointer",fontSize:14}}>✕</button>
              </div>
            ))}
            <button onClick={addLigne} style={{background:"none",border:`1px dashed ${theme.border}`,color:theme.textMuted,padding:"8px 16px",borderRadius:9,cursor:"pointer",fontSize:13,fontFamily:"inherit",width:"100%"}}>+ Ajouter un article</button>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:"#0A84FF"}}>Total : {xof(totalLignes)}</div>
            <BtnPri onClick={creerFacture} style={{opacity:loading?0.6:1}}>{loading?"Création...":"Créer la facture"}</BtnPri>
          </div>
        </Card>
      )}

      {/* Aperçu facture */}
      {preview&&(()=>{
        const lignesParsed=typeof preview.lignes==="string"?JSON.parse(preview.lignes):preview.lignes;
        return (
          <Card style={{marginBottom:20,border:"1px solid rgba(191,90,242,0.3)"}}>
            <div ref={printRef} style={{background:"#fff",color:"#1C1C1E",padding:"40px",borderRadius:12,fontFamily:"Arial,sans-serif"}}>
              {/* Header facture */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32,paddingBottom:24,borderBottom:"3px solid #1400FF"}}>
                <div>
                  <AngyLogo height={40} forPrint={true}/>
                  <div style={{marginTop:8,fontSize:12,color:"#636366"}}>
                    📍 Parcelles Assainies U18, Dakar<br/>
                    📞 +221 71 053 89 17
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:28,fontWeight:900,color:"#0A84FF",letterSpacing:"-1px"}}>FACTURE</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#1C1C1E"}}>#{preview.numero}</div>
                  <div style={{fontSize:13,color:"#636366",marginTop:4}}>Date : {preview.date}</div>
                </div>
              </div>

              {/* Client */}
              <div style={{marginBottom:28}}>
                <div style={{fontSize:11,fontWeight:700,color:"#636366",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Facturé à</div>
                <div style={{fontSize:16,fontWeight:700,color:"#1C1C1E"}}>{preview.client}</div>
                {preview.telephone&&<div style={{fontSize:13,color:"#636366"}}>📞 {preview.telephone}</div>}
                {preview.email&&<div style={{fontSize:13,color:"#636366"}}>✉️ {preview.email}</div>}
                {preview.adresse&&<div style={{fontSize:13,color:"#636366"}}>📍 {preview.adresse}</div>}
              </div>

              {/* Tableau articles */}
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:24}}>
                <thead>
                  <tr style={{background:"#f5f5f7"}}>
                    <th style={{padding:"10px 12px",textAlign:"left",fontSize:12,fontWeight:700,color:"#636366",textTransform:"uppercase"}}>Description</th>
                    <th style={{padding:"10px 12px",textAlign:"center",fontSize:12,fontWeight:700,color:"#636366",textTransform:"uppercase"}}>Qté</th>
                    <th style={{padding:"10px 12px",textAlign:"right",fontSize:12,fontWeight:700,color:"#636366",textTransform:"uppercase"}}>Prix unit.</th>
                    <th style={{padding:"10px 12px",textAlign:"right",fontSize:12,fontWeight:700,color:"#636366",textTransform:"uppercase"}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lignesParsed.map((l,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #e5e5ea"}}>
                      <td style={{padding:"12px",fontSize:14,color:"#1C1C1E"}}>{l.desc}</td>
                      <td style={{padding:"12px",fontSize:14,textAlign:"center",color:"#636366"}}>{l.qte}</td>
                      <td style={{padding:"12px",fontSize:14,textAlign:"right",color:"#636366"}}>{xof(l.pu)}</td>
                      <td style={{padding:"12px",fontSize:14,textAlign:"right",fontWeight:700,color:"#1C1C1E"}}>{xof(l.qte*l.pu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:24}}>
                <div style={{background:"#f5f5f7",borderRadius:12,padding:"16px 24px",textAlign:"right"}}>
                  <div style={{fontSize:13,color:"#636366",marginBottom:4}}>Total TTC</div>
                  <div style={{fontSize:28,fontWeight:900,color:"#0A84FF",letterSpacing:"-1px"}}>{xof(preview.total)}</div>
                </div>
              </div>

              {/* Note */}
              {preview.note&&<div style={{borderTop:"1px solid #e5e5ea",paddingTop:16,fontSize:13,color:"#636366",fontStyle:"italic"}}>{preview.note}</div>}

              {/* Footer */}
              <div style={{marginTop:32,paddingTop:16,borderTop:"2px solid #CC0000",textAlign:"center",fontSize:11,color:"#8E8E93"}}>
                Angy Company · Parcelles Assainies U18, Dakar · +221 71 053 89 17 · Merci pour votre confiance 🙏
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <BtnPri onClick={imprimer}>🖨️ Imprimer / Télécharger PDF</BtnPri>
              <BtnSec onClick={()=>setPreview(null)}>Fermer</BtnSec>
            </div>
          </Card>
        );
      })()}

      {/* Liste factures */}
      <TableWrap>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Numéro","Client","Date","Total","Actions"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {factures.length===0&&<tr><Td colSpan={5} style={{textAlign:"center",color:theme.textMuted,padding:"2rem"}}>Aucune facture</Td></tr>}
            {factures.map(f=>(
              <tr key={f.id}>
                <Td><strong style={{color:"#BF5AF2"}}>#{f.numero}</strong></Td>
                <Td style={{color:theme.text,fontWeight:600}}>{f.client}</Td>
                <Td style={{color:theme.textMuted,fontSize:13}}>{f.date}</Td>
                <Td style={{fontWeight:700,color:"#0A84FF"}}>{xof(f.total)}</Td>
                <Td>
                  <div style={{display:"flex",gap:6}}>
                    <button style={{background:"rgba(191,90,242,0.12)",border:"1px solid #BF5AF2",color:"#BF5AF2",padding:"4px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}} onClick={()=>setPreview(f)}>👁 Voir</button>
                    <button style={{background:"none",border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onClick={()=>del(f.id)}>🗑</button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

// ─── Bénéfices ────────────────────────────────────────────────────────────────
function Benefices({depenses,ventes,stock}) {
  const {theme}=useTheme();
  const [periode,setPeriode]=useState("all");
  const now=new Date();
  const fDate=d=>{if(periode==="all")return true;const dt=new Date(d);if(periode==="mois")return dt.getMonth()===now.getMonth()&&dt.getFullYear()===now.getFullYear();if(periode==="semaine")return(now-dt)<7*24*3600*1000;return true;};
  const vF=ventes.filter(v=>fDate(v.date));
  const dF=depenses.filter(d=>d.statut==="Approuvée"&&fDate(d.date));
  const CA=vF.reduce((s,v)=>s+v.prix_vente*v.qte,0);
  const cout=dF.reduce((s,d)=>s+d.montant,0);
  const ben=CA-cout;
  const marge=CA>0?Math.round((ben/CA)*100):0;
  const byProd={};
  vF.forEach(v=>{if(!byProd[v.produit])byProd[v.produit]={produit:v.produit,qte:0,ca:0};byProd[v.produit].qte+=v.qte;byProd[v.produit].ca+=v.prix_vente*v.qte;});
  const top=Object.values(byProd).sort((a,b)=>b.ca-a.ca);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Bénéfices & Analyse</h1>
        <div style={{display:"flex",gap:8}}>
          {[["all","Tout"],["mois","Ce mois"],["semaine","Cette semaine"]].map(([v,l])=>(
            <button key={v} onClick={()=>setPeriode(v)} style={{padding:"7px 14px",borderRadius:9,border:"1px solid",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",borderColor:periode===v?"#0A84FF":theme.border,background:periode===v?"rgba(10,132,255,0.12)":theme.toggleBg,color:periode===v?"#0A84FF":theme.textMuted}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        <KPI label="Chiffre d'affaires" value={xof(CA)} accent="#0A84FF" icon="💰" sub={`${vF.length} ventes`}/>
        <KPI label="Total dépenses" value={xof(cout)} accent="#FF453A" icon="📤" sub={`${dF.length} entrées`}/>
        <KPI label="Bénéfice net" value={xof(ben)} accent={ben>=0?"#30D158":"#FF453A"} icon={ben>=0?"📈":"📉"} sub="CA − dépenses"/>
        <KPI label="Taux de marge" value={`${marge}%`} accent="#FF9F0A" icon="%" sub="Bénéfice / CA"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card>
          <CardTitle>Top produits vendus</CardTitle>
          {top.length===0?<div style={{color:theme.textMuted,fontSize:13}}>Aucune vente</div>:top.map((p,i)=>{
            const sp=stock.find(x=>x.nom===p.produit);
            const mp=sp?Math.round(((p.ca-sp.prix_achat*p.qte)/(sp.prix_achat*p.qte))*100):null;
            return (
              <div key={p.produit} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"rgba(10,132,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#0A84FF"}}>{i+1}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:theme.text}}>{p.produit}</div>
                    <div style={{fontSize:11,color:theme.textMuted}}>×{p.qte} vendu{p.qte>1?"s":""}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:"#30D158",fontSize:13}}>{xof(p.ca)}</div>
                  {mp!==null&&<div style={{fontSize:11,color:"#FF9F0A"}}>+{mp}%</div>}
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <CardTitle>Résumé financier</CardTitle>
          {[["Chiffre d'affaires","#0A84FF",CA],["Dépenses","#FF453A",-cout],["Bénéfice net",ben>=0?"#30D158":"#FF453A",ben]].map(([l,c,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
              <div style={{fontSize:14,color:theme.textSub}}>{l}</div>
              <div style={{fontWeight:800,color:c,fontSize:16}}>{v<0?"-":""}{xof(Math.abs(v))}</div>
            </div>
          ))}
          <div style={{marginTop:16,padding:"14px",background:"rgba(10,132,255,0.08)",borderRadius:10,textAlign:"center"}}>
            <div style={{fontSize:12,color:theme.textMuted,marginBottom:4}}>Marge bénéficiaire</div>
            <div style={{fontSize:32,fontWeight:900,color:marge>=0?"#30D158":"#FF453A"}}>{marge}%</div>
          </div>
        </Card>
      </div>
      <Card>
        <CardTitle>Historique des ventes</CardTitle>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Produit","Client","Qté","Prix unit.","Total","Date"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {vF.length===0&&<tr><Td colSpan={6} style={{textAlign:"center",color:theme.textMuted,padding:"1.5rem"}}>Aucune vente</Td></tr>}
            {vF.map(v=>(
              <tr key={v.id}>
                <Td><strong style={{color:theme.text}}>{v.produit}</strong></Td>
                <Td style={{color:theme.textSub}}>{v.client}</Td>
                <Td>{v.qte}</Td>
                <Td style={{color:theme.textMuted}}>{xof(v.prix_vente)}</Td>
                <Td style={{fontWeight:700,color:"#30D158"}}>{xof(v.prix_vente*v.qte)}</Td>
                <Td style={{color:theme.textMuted,fontSize:13}}>{v.date}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,setDark]=useState(true);
  const theme=dark?DARK:LIGHT;
  const [page,setPage]=useState("dashboard");
  const [depenses,setDepenses]=useState([]);
  const [stock,setStock]=useState([]);
  const [ventes,setVentes]=useState([]);
  const [factures,setFactures]=useState([]);
  const [catDep,setCatDep]=useState(DEFAULT_CAT_DEP);
  const [catStk,setCatStk]=useState(DEFAULT_CAT_STK);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState(null);

  const showToast=(msg,err=false)=>{setToast({msg,err});setTimeout(()=>setToast(null),3000);};

  useEffect(()=>{
    (async()=>{
      try{
        const [d,s,v,f]=await Promise.all([dbGet("depenses"),dbGet("stock"),dbGet("ventes"),dbGet("factures").catch(()=>[])]);
        setDepenses(d||[]);setStock(s||[]);setVentes(v||[]);setFactures(f||[]);
      }catch(e){showToast("Erreur de connexion",true);}
      setLoading(false);
    })();
  },[]);

  const NAV=[
    {id:"dashboard",label:"Dashboard",icon:"◈"},
    {id:"depenses", label:"Dépenses",  icon:"📤"},
    {id:"stock",    label:"Stock",     icon:"📦"},
    {id:"factures", label:"Factures",  icon:"🧾"},
    {id:"benefices",label:"Bénéfices", icon:"📈"},
    {id:"categories",label:"Catégories",icon:"🏷️"},
  ];
  const alertes=stock.filter(p=>p.qte<=p.seuil).length;

  return (
    <ThemeCtx.Provider value={{dark,toggle:()=>setDark(d=>!d),theme}}>
      <div style={{minHeight:"100vh",background:theme.bg,color:theme.text,fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",transition:"background 0.25s,color 0.25s"}}>
        <header style={{background:theme.bgHeader,backdropFilter:"blur(20px)",borderBottom:`1px solid ${theme.border}`,position:"sticky",top:0,zIndex:100,boxShadow:theme.shadow,transition:"background 0.25s"}}>
          {/* Ligne 1 : Logo + Toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px"}}>
            <AngyLogo height={52}/>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:11,color:theme.textMuted}}>📍 Parcelles Assainies U18, Dakar</div>
              <ThemeToggle/>
            </div>
          </div>
          {/* Ligne 2 : Navigation */}
          <div style={{display:"flex",gap:4,padding:"0 20px 10px",flexWrap:"wrap"}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)}
                style={{padding:"6px 12px",borderRadius:10,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:600,transition:"all 0.15s",fontFamily:"inherit",
                  borderColor:page===n.id?"rgba(10,132,255,0.4)":theme.border,
                  background:page===n.id?"rgba(10,132,255,0.12)":theme.toggleBg,
                  color:page===n.id?"#0A84FF":theme.textMuted,
                  display:"flex",alignItems:"center",gap:5}}>
                {n.icon} {n.label}
                {n.id==="stock"&&alertes>0&&<span style={{background:"#FF453A",color:"#fff",borderRadius:99,padding:"1px 5px",fontSize:10,fontWeight:800}}>{alertes}</span>}
              </button>
            ))}
          </div>
        </header>

        <main style={{flex:1,padding:"28px",maxWidth:1400,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
          {loading?<div style={{textAlign:"center",padding:"60px",fontSize:32}}>⏳</div>:(
            <>
              {page==="dashboard"  &&<Dashboard   depenses={depenses} stock={stock} ventes={ventes} factures={factures}/>}
              {page==="depenses"   &&<Depenses    depenses={depenses} setDepenses={setDepenses} catDep={catDep} showToast={showToast}/>}
              {page==="stock"      &&<Stock       stock={stock} setStock={setStock} ventes={ventes} setVentes={setVentes} catStk={catStk} showToast={showToast}/>}
              {page==="factures"   &&<Factures    factures={factures} setFactures={setFactures} stock={stock} showToast={showToast}/>}
              {page==="benefices"  &&<Benefices   depenses={depenses} ventes={ventes} stock={stock}/>}
              {page==="categories" &&<Categories  catDep={catDep} setCatDep={setCatDep} catStk={catStk} setCatStk={setCatStk} showToast={showToast}/>}
            </>
          )}
        </main>

        <footer style={{textAlign:"center",padding:"14px",fontSize:11,color:theme.textFaint,borderTop:`1px solid ${theme.border}`}}>
          Angy Company · Système de gestion interne · Dakar 🇸🇳
        </footer>
        {toast&&<Toast msg={toast.msg} err={toast.err}/>}
      </div>
    </ThemeCtx.Provider>
  );
}
