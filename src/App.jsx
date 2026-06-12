import { useState, createContext, useContext, useEffect, useRef } from "react";

// ─── Config Supabase ──────────────────────────────────────────────────────────
const SUPA_URL = "https://nfpnhyvuwpzezwbmxtgd.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcG5oeXZ1d3B6ZXp3Ym14dGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODU5NTAsImV4cCI6MjA5NjE2MTk1MH0.u9ptkVSXwgT75m9WgRLsUnygEJGYK4ESyv6jBUeNtO4";

const dbHeaders = {
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// ─── Fonctions DB simples et directes ────────────────────────────────────────
const dbGet = async (t) => {
  const r = await fetch(`${SUPA_URL}/rest/v1/${t}?order=created_at.desc&limit=1000`,{headers:dbHeaders});
  if(!r.ok) return [];
  return r.json();
};

const dbAdd = async (t, d) => {
  const r = await fetch(`${SUPA_URL}/rest/v1/${t}`,{method:"POST",headers:dbHeaders,body:JSON.stringify(d)});
  if(!r.ok){ console.error("dbAdd error:", await r.text()); return [{...d,id:Date.now()}]; }
  const json = await r.json();
  return Array.isArray(json) ? json : [json];
};

const dbDel = async (t, id) => {
  await fetch(`${SUPA_URL}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:dbHeaders});
};

const dbPatch = async (t, id, d) => {
  await fetch(`${SUPA_URL}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:dbHeaders,body:JSON.stringify(d)});
};

// Fonctions cache vides pour compatibilité
const loadAngyCache = () => null;
const saveAngyCache = () => {};
const updateAngyState = () => {};
const syncAngyQueue = async () => {};
const addToAngyQueue = () => {};
const isOnline = () => true;

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
  const scale = height / 100;
  const W = Math.round(420 * scale);
  return (
    <svg height={height} width={W} viewBox="0 0 420 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
      {/* Fond dégradé subtil derrière le logo */}
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1400FF"/>
          <stop offset="100%" stopColor="#0066FF"/>
        </linearGradient>
        <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CC0000"/>
          <stop offset="100%" stopColor="#FF2200"/>
        </linearGradient>
      </defs>
      {/* Crochet bleu — bas gauche */}
      <rect x="10" y="15" width="13" height="70" rx="3" fill="url(#blueGrad)"/>
      <rect x="10" y="72" width="62" height="13" rx="3" fill="url(#blueGrad)"/>
      {/* Crochet rouge — haut droite */}
      <rect x="397" y="15" width="13" height="52" rx="3" fill="url(#redGrad)"/>
      <rect x="348" y="15" width="62" height="13" rx="3" fill="url(#redGrad)"/>
      {/* Cercles ANGY */}
      {[["A",52],["N",92],["G",132],["Y",172]].map(([l,cx])=>(
        <g key={l}>
          <circle cx={cx} cy="50" r="23" fill={dark?"#1C1C2E":"white"} stroke={dark?"rgba(255,255,255,0.15)":"#1C1C1E"} strokeWidth="2.5"/>
          <text x={cx} y="58" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="21" fill={dark?"#ffffff":"#1C1C1E"}>{l}</text>
        </g>
      ))}
      {/* Company */}
      <text x="210" y="62" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="34" fill={textColor} letterSpacing="1">Company</text>
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

// ─── Export utilitaires ───────────────────────────────────────────────────────
const exportCSV = (data, filename) => {
  if(!data||data.length===0)return;
  const headers=Object.keys(data[0]);
  const rows=data.map(row=>headers.map(h=>{
    const val=row[h]===null||row[h]===undefined?"":String(row[h]);
    return `"${val.replace(/"/g,'""')}"`;
  }).join(","));
  const csv=[headers.join(","),...rows].join("\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename+".csv";
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
};

const exportExcel = (data, filename) => exportCSV(data, filename);

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
  const now=new Date();
  const moisCourant=now.toISOString().slice(0,7);
  const hier=new Date(now-86400000).toISOString().split("T")[0];
  const todayStr=now.toISOString().split("T")[0];

  // CA total
  const totalCA=factures.reduce((s,f)=>s+f.total,0);
  const totalDep=depenses.filter(d=>d.statut==="Approuvée").reduce((s,d)=>s+d.montant,0);
  const stockVal=stock.reduce((s,p)=>s+p.prix_achat*p.qte,0);
  const benefice=totalCA-totalDep;
  const marge=totalCA>0?Math.round((benefice/totalCA)*100):0;

  // CA aujourd'hui
  const caAujourdhui=factures.filter(f=>f.date===todayStr).reduce((s,f)=>s+f.total,0);
  const caHier=factures.filter(f=>f.date===hier).reduce((s,f)=>s+f.total,0);
  const caMois=factures.filter(f=>f.date?.startsWith(moisCourant)).reduce((s,f)=>s+f.total,0);

  // Mois précédent
  const moisPrec=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().slice(0,7);
  const caMoisPrec=factures.filter(f=>f.date?.startsWith(moisPrec)).reduce((s,f)=>s+f.total,0);
  const depMois=depenses.filter(d=>d.statut==="Approuvée"&&d.date?.startsWith(moisCourant)).reduce((s,d)=>s+d.montant,0);
  const depMoisPrec=depenses.filter(d=>d.statut==="Approuvée"&&d.date?.startsWith(moisPrec)).reduce((s,d)=>s+d.montant,0);
  const benMois=caMois-depMois;
  const benMoisPrec=caMoisPrec-depMoisPrec;
  const nbVentesMois=factures.filter(f=>f.date?.startsWith(moisCourant)).length;
  const nbVentesMoisPrec=factures.filter(f=>f.date?.startsWith(moisPrec)).length;

  // Calcul évolution %
  const evol=(current,previous)=>{
    if(previous===0)return current>0?100:0;
    return Math.round(((current-previous)/previous)*100);
  };
  const evolCA=evol(caMois,caMoisPrec);
  const evolBen=evol(benMois,benMoisPrec);
  const evolVentes=evol(nbVentesMois,nbVentesMoisPrec);

  // Alertes stock
  const alertes=stock.filter(p=>p.qte<=p.seuil);
  const ruptures=stock.filter(p=>p.qte===0);

  // Top produits depuis factures
  const byProd={};
  factures.forEach(f=>{
    try{
      const lignes=typeof f.lignes==="string"?JSON.parse(f.lignes):f.lignes||[];
      lignes.forEach(l=>{
        if(!l.desc)return;
        if(!byProd[l.desc])byProd[l.desc]={produit:l.desc,qte:0,ca:0};
        byProd[l.desc].qte+=l.qte||1;
        byProd[l.desc].ca+=(l.qte||1)*(l.pu||0);
      });
    }catch(e){}
  });
  const top5=Object.values(byProd).sort((a,b)=>b.ca-a.ca).slice(0,5);

  // Graphique par mois (données réelles)
  const MOIS=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const ventesParMois=MOIS.map((_,i)=>{
    const mm=String(i+1).padStart(2,"0");
    return factures.filter(f=>f.date?.slice(5,7)===mm&&f.date?.startsWith(String(now.getFullYear()))).reduce((s,f)=>s+f.total,0);
  });
  const maxV=Math.max(...ventesParMois,1);
  const moisLabels=MOIS.slice(0,now.getMonth()+1);
  const ventesLabels=ventesParMois.slice(0,now.getMonth()+1);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Tableau de bord</h1>
        <div style={{fontSize:12,color:theme.textMuted}}>{now.toLocaleDateString("fr-SN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
      </div>

      {/* KPIs principaux */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
        <KPI label="Chiffre d'affaires" value={xof(totalCA)} accent="#0A84FF" icon="💰" sub={`${factures.length} facture${factures.length!==1?"s":""}`}/>
        <KPI label="Bénéfice net" value={xof(benefice)} accent={benefice>=0?"#30D158":"#FF453A"} icon={benefice>=0?"📈":"📉"} sub={`Marge : ${marge}%`}/>
        <KPI label="Dépenses" value={xof(totalDep)} accent="#FF453A" icon="📤" sub={`${depenses.filter(d=>d.statut==="Approuvée").length} approuvées`}/>
        <KPI label="Valeur stock" value={xof(stockVal)} accent="#FF9F0A" icon="📦" sub={`${stock.length} produit${stock.length!==1?"s":""}`}/>
      </div>

      {/* Comparaison mois/mois */}
      <Card style={{marginBottom:16}}>
        <CardTitle>📈 Comparaison mois/mois</CardTitle>
        <div style={{fontSize:11,color:theme.textMuted,marginBottom:14}}>
          {new Date(now.getFullYear(),now.getMonth()-1,1).toLocaleDateString("fr-FR",{month:"long"})} → {now.toLocaleDateString("fr-FR",{month:"long"})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {label:"Chiffre d'affaires",current:caMois,previous:caMoisPrec,evol:evolCA,icon:"💰",color:"#0A84FF"},
            {label:"Bénéfice net",current:benMois,previous:benMoisPrec,evol:evolBen,icon:"📈",color:"#30D158"},
            {label:"Nb ventes",current:nbVentesMois,previous:nbVentesMoisPrec,evol:evolVentes,icon:"🧾",color:"#BF5AF2",isCount:true},
          ].map(item=>(
            <div key={item.label} style={{background:theme.bg,borderRadius:12,padding:"16px",border:`1px solid ${theme.border}`}}>
              <div style={{fontSize:12,color:theme.textMuted,marginBottom:8}}>{item.icon} {item.label}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
                <div>
                  <div style={{fontSize:11,color:theme.textFaint,marginBottom:2}}>Mois précédent</div>
                  <div style={{fontSize:14,fontWeight:600,color:theme.textSub}}>{item.isCount?item.previous:xof(item.previous)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:theme.textFaint,marginBottom:2}}>Ce mois</div>
                  <div style={{fontSize:18,fontWeight:800,color:item.color}}>{item.isCount?item.current:xof(item.current)}</div>
                </div>
              </div>
              {/* Barre de progression */}
              <div style={{height:6,background:theme.border,borderRadius:99,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",width:`${Math.min(100,item.previous>0?Math.round((item.current/Math.max(item.current,item.previous))*100):item.current>0?100:0)}%`,background:item.color,borderRadius:99,transition:"width 0.5s"}}/>
              </div>
              {/* Badge évolution */}
              <div style={{display:"inline-flex",alignItems:"center",gap:4,background:item.evol>=0?"rgba(48,209,88,0.12)":"rgba(255,69,58,0.12)",color:item.evol>=0?"#30D158":"#FF453A",padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>
                {item.evol>=0?"🔺":"🔻"} {item.evol>=0?"+":""}{item.evol}% vs mois dernier
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* KPIs secondaires */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
        <KPI label="CA aujourd'hui" value={xof(caAujourdhui)} accent="#30D158" icon="🌅" sub={caHier>0?`Hier : ${xof(caHier)}`:"Premier jour"}/>
        <KPI label="CA ce mois" value={xof(caMois)} accent="#0A84FF" icon="📅" sub={moisCourant}/>
        <KPI label="Ruptures de stock" value={ruptures.length} accent="#FF453A" icon="🚨" sub={`${alertes.length} en alerte`}/>
        <KPI label="Taux de marge" value={`${marge}%`} accent={marge>=20?"#30D158":marge>=10?"#FF9F0A":"#FF453A"} icon="%" sub="Bénéfice / CA"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        {/* Graphique réel */}
        <Card>
          <CardTitle>📊 Évolution des ventes {now.getFullYear()}</CardTitle>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:130,paddingTop:10}}>
            {moisLabels.map((m,i)=>(
              <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{fontSize:9,color:theme.textMuted}}>{ventesLabels[i]>0?Math.round(ventesLabels[i]/1000)+"k":""}</div>
                <div style={{width:"100%",background:i===moisLabels.length-1?"#0A84FF":ventesLabels[i]>0?"rgba(10,132,255,0.4)":theme.border,
                  height:`${Math.max(4,Math.round((ventesLabels[i]/maxV)*110))}px`,borderRadius:"5px 5px 0 0",transition:"height 0.3s"}}/>
                <div style={{fontSize:10,color:i===moisLabels.length-1?"#0A84FF":theme.textMuted,fontWeight:i===moisLabels.length-1?700:400}}>{m}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:`1px solid ${theme.borderLight}`}}>
            <div style={{fontSize:12,color:theme.textMuted}}>Total {now.getFullYear()}</div>
            <div style={{fontSize:13,fontWeight:700,color:"#0A84FF"}}>{xof(totalCA)}</div>
          </div>
        </Card>

        {/* Alertes stock */}
        <Card>
          <CardTitle>⚠️ Stock critique ({alertes.length})</CardTitle>
          {alertes.length===0
            ?<div style={{color:"#30D158",fontSize:13,marginTop:12}}>✓ Tout le stock est OK</div>
            :alertes.slice(0,6).map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:theme.text}}>{p.nom}</div>
                  <div style={{fontSize:10,color:theme.textMuted}}>Seuil: {p.seuil}</div>
                </div>
                <span style={{background:p.qte===0?"#3A1C1C":"#3A2F1C",color:p.qte===0?"#FF453A":"#FF9F0A",padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:700}}>
                  {p.qte===0?"RUPTURE":`${p.qte} unité${p.qte!==1?"s":""}`}
                </span>
              </div>
            ))
          }
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        {/* Top produits */}
        <Card>
          <CardTitle>🏆 Top 5 produits</CardTitle>
          {top5.length===0
            ?<div style={{color:theme.textMuted,fontSize:13}}>Aucune vente</div>
            :top5.map((p,i)=>(
              <div key={p.produit} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
                <div style={{width:22,height:22,borderRadius:6,background:"rgba(10,132,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#0A84FF",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:theme.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.produit}</div>
                  <div style={{fontSize:10,color:theme.textMuted}}>×{p.qte} vendu{p.qte>1?"s":""}</div>
                </div>
                <div style={{fontWeight:700,color:"#30D158",fontSize:12,flexShrink:0}}>{xof(p.ca)}</div>
              </div>
            ))
          }
        </Card>

        {/* Dernières factures */}
        <Card>
          <CardTitle>🧾 Dernières factures</CardTitle>
          {factures.length===0
            ?<div style={{color:theme.textMuted,fontSize:13}}>Aucune facture</div>
            :factures.slice(0,5).map(f=>(
              <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#BF5AF2"}}>#{f.numero}</div>
                  <div style={{fontSize:10,color:theme.textMuted}}>{f.client} · {f.date}</div>
                </div>
                <div style={{fontWeight:700,color:"#0A84FF",fontSize:12}}>{xof(f.total)}</div>
              </div>
            ))
          }
        </Card>

        {/* Dernières dépenses */}
        <Card>
          <CardTitle>📤 Dernières dépenses</CardTitle>
          {depenses.length===0
            ?<div style={{color:theme.textMuted,fontSize:13}}>Aucune dépense</div>
            :depenses.slice(0,5).map(d=>(
              <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${theme.borderLight}`}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:theme.text}}>{d.titre}</div>
                  <div style={{fontSize:10,color:theme.textMuted}}>{d.date}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#FF453A"}}>{xof(d.montant)}</div>
                  <Badge s={d.statut}/>
                </div>
              </div>
            ))
          }
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

// ─── Catégories qui vont dans le stock ───────────────────────────────────────
const CATS_STOCK = ["iphones","accessoires","ordinateurs","pieces"];

// ─── Dépenses ─────────────────────────────────────────────────────────────────
function Depenses({depenses,setDepenses,catDep,stock,setStock,showToast,rechercheFiltre=""}) {
  const {theme}=useTheme();
  const [fCat,setFCat]=useState("all");
  const [search,setSearch]=useState(rechercheFiltre||"");
  const [fStat,setFStat]=useState("all");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [ajouterStock,setAjouterStock]=useState(false);
  const [stockForm,setStockForm]=useState({qte:"",prix_vente:"",seuil:"3"});
  const [form,setForm]=useState({titre:"",cat:catDep[0]?.id||"iphones",montant:"",date:today(),statut:"En attente",note:""});

  const isStockCat = CATS_STOCK.includes(form.cat);

  const filtered=depenses.filter(d=>{
    const catOk=fCat==="all"||d.cat===fCat;
    const statOk=fStat==="all"||d.statut===fStat;
    const searchOk=!search||d.titre?.toLowerCase().includes(search.toLowerCase());
    return catOk&&statOk&&searchOk;
  });
  const total=filtered.filter(d=>d.statut==="Approuvée").reduce((s,d)=>s+d.montant,0);

  const add=async()=>{
    if(!form.titre||!form.montant)return showToast("Titre et montant requis",true);
    setLoading(true);
    try{
      const rows=await dbAdd("depenses",{titre:form.titre,cat:form.cat,montant:parseInt(form.montant),date:form.date,statut:form.statut,note:form.note});
      setDepenses([rows[0],...depenses]);updateAngyState("depenses",[rows[0],...depenses]);

      // Ajouter au stock si catégorie produit
      if(isStockCat && ajouterStock && stockForm.qte){
        const existant=stock.find(p=>p.nom===form.titre&&p.cat===form.cat);
        if(existant){
          const nq=existant.qte+parseInt(stockForm.qte);
          await dbPatch("stock",existant.id,{qte:nq});
          setStock(stock.map(p=>p.id===existant.id?{...p,qte:nq}:p));
          showToast("Dépense + Stock mis à jour ✓");
        } else {
          const sRows=await dbAdd("stock",{nom:form.titre,cat:form.cat,qte:parseInt(stockForm.qte),prix_achat:parseInt(form.montant/parseInt(stockForm.qte)),prix_vente:parseInt(stockForm.prix_vente)||0,seuil:parseInt(stockForm.seuil)||3});
          setStock([sRows[0],...stock]);
          showToast("Dépense + Nouveau produit en stock ✓");
        }
      } else {
        showToast("Dépense enregistrée ✓");
      }

      setForm({titre:"",cat:catDep[0]?.id||"iphones",montant:"",date:today(),statut:"En attente",note:""});
      setStockForm({qte:"",prix_vente:"",seuil:"3"});
      setAjouterStock(false);
      setShow(false);
    }catch(e){showToast("Erreur",true);}
    setLoading(false);
  };
  const del=async(id)=>{await dbDel("depenses",id);setDepenses(depenses.filter(d=>d.id!==id));updateAngyState("depenses",depenses.filter(d=>d.id!==id));showToast("Supprimée");};
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
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Dépenses ({depenses.length})</h1>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportExcel(depenses.map(d=>({Titre:d.titre,Catégorie:d.categorie||d.cat,Montant:d.montant,Date:d.date,Statut:d.statut,Note:d.note||""})),"depenses-angy")}
            style={{background:theme.toggleBg,border:`1px solid #30D158`,color:"#30D158",padding:"8px 14px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>📊 Excel</button>
          <BtnPri onClick={()=>{setShow(!show);setEditId(null);}}>{show?"✕ Annuler":"+ Nouvelle dépense"}</BtnPri>
        </div>
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
      {/* Option ajout au stock pour catégories produits */}
      {show && isStockCat && (
        <Card style={{marginBottom:16,borderColor:ajouterStock?"rgba(10,132,255,0.3)":undefined}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:ajouterStock?14:0}}
            onClick={()=>setAjouterStock(!ajouterStock)}>
            <div style={{width:20,height:20,borderRadius:6,background:ajouterStock?"#0A84FF":theme.toggleBg,border:`2px solid ${ajouterStock?"#0A84FF":theme.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {ajouterStock&&<span style={{color:"#fff",fontSize:13,fontWeight:900}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:theme.text}}>📦 Ajouter automatiquement au stock</div>
              <div style={{fontSize:11,color:theme.textMuted}}>Ce produit sera ajouté à votre inventaire</div>
            </div>
          </div>
          {ajouterStock&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <Inp label="Quantité *" type="number" value={stockForm.qte} onChange={e=>setStockForm({...stockForm,qte:e.target.value})} placeholder="Ex: 5"/>
              <Inp label="Prix de vente (FCFA)" type="number" value={stockForm.prix_vente} onChange={e=>setStockForm({...stockForm,prix_vente:e.target.value})} placeholder="Ex: 580000"/>
              <Inp label="Seuil alerte" type="number" value={stockForm.seuil} onChange={e=>setStockForm({...stockForm,seuil:e.target.value})} placeholder="3"/>
            </div>
          )}
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
function Stock({stock,setStock,ventes,setVentes,factures,setFactures,depenses,setDepenses,catStk,showToast,setPage,rechercheFiltre=""}) {
  const {theme}=useTheme();
  const [showAdd,setShowAdd]=useState(false);
  const [showVente,setShowVente]=useState(null);
  const [form,setForm]=useState({nom:"",cat:catStk[0]?.id||"iphones",qte:"",prix_achat:"",prix_vente:"",seuil:""});
  const [vf,setVf]=useState({qte:"",client:"",telephone:"",date:today(),creerFacture:true,paiement:"Espèces"});
  const [fCat,setFCat]=useState("all");
  const [search,setSearch]=useState(rechercheFiltre||"");
  const [loading,setLoading]=useState(false);
  const [editId,setEditId]=useState(null);
  const [editForm,setEditForm]=useState({});

  const [ajouterDepense,setAjouterDepense]=useState(false);

  const filtered=stock.filter(p=>{
    const catOk=fCat==="all"||p.cat===fCat;
    const searchOk=!search||p.nom?.toLowerCase().includes(search.toLowerCase());
    return catOk&&searchOk;
  });

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
      setStock([rows[0],...stock]);updateAngyState("stock",[rows[0],...stock]);

      // Créer dépense automatiquement si demandé
      if(ajouterDepense && form.prix_achat){
        const montantTotal=parseInt(form.prix_achat)*parseInt(form.qte);
        const depRows=await dbAdd("depenses",{titre:form.nom,cat:form.cat,montant:montantTotal,date:today(),statut:"En attente",note:`Achat stock x${form.qte}`});
        setDepenses([depRows[0],...depenses]);
        showToast("Produit + Dépense enregistrés ✓");
      } else {
        showToast("Produit ajouté ✓");
      }

      setForm({nom:"",cat:catStk[0]?.id||"iphones",qte:"",prix_achat:"",prix_vente:"",seuil:""});
      setAjouterDepense(false);
      setShowAdd(false);
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
      const venteRows=await dbAdd("ventes",{produit:p.nom,cat:p.cat,qte:q,prix_vente:p.prix_vente,date:vf.date,client:vf.client||"—"});
      setStock(stock.map(x=>x.id===showVente?{...x,qte:x.qte-q}:x));
      setVentes([venteRows[0],...ventes]);updateAngyState("ventes",[venteRows[0],...ventes]);

      // Créer facture automatiquement si demandé
      if(vf.creerFacture){
        const numero=`FAC-${new Date().getFullYear()}-${String(factures.length+1).padStart(3,"0")}`;
        const lignes=JSON.stringify([{desc:p.nom,cat:p.cat,qte:q,pu:p.prix_vente,details:{}}]);
        const factRows=await dbAdd("factures",{numero,client:vf.client||"—",email:"",telephone:vf.telephone||"",adresse:"",date:vf.date,note:"Merci pour votre confiance",lignes,total:q*p.prix_vente,paiement:vf.paiement||"Espèces"});
        setFactures([factRows[0],...factures]);updateAngyState("factures",[factRows[0],...factures]);
        showToast("Vente + Facture créées ✓ — Allez dans 🧾 Factures");
      } else {
        showToast("Vente enregistrée ✓");
      }

      setVf({qte:"",client:"",telephone:"",date:today(),creerFacture:true,paiement:"Espèces"});
      setShowVente(null);
    }catch(e){showToast("Erreur",true);}
    setLoading(false);
  };

  const del=async(id)=>{await dbDel("stock",id);setStock(stock.filter(p=>p.id!==id));updateAngyState("stock",stock.filter(p=>p.id!==id));showToast("Supprimé");};
  const adj=async(id,delta)=>{const p=stock.find(x=>x.id===id);const nq=Math.max(0,p.qte+delta);await dbPatch("stock",id,{qte:nq});setStock(stock.map(x=>x.id===id?{...x,qte:nq}:x));};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Stock ({stock.length})</h1>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportExcel(stock.map(p=>({Nom:p.nom,Catégorie:p.cat,Quantité:p.qte,"Prix achat":p.prix_achat,"Prix vente":p.prix_vente,"Seuil alerte":p.seuil,"Valeur stock":p.prix_achat*p.qte})),"stock-angy")}
            style={{background:theme.toggleBg,border:`1px solid #30D158`,color:"#30D158",padding:"8px 14px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>📊 Excel</button>
          <BtnPri onClick={()=>setShowAdd(!showAdd)}>{showAdd?"✕ Annuler":"+ Ajouter produit"}</BtnPri>
        </div>
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

          {/* Option enregistrer comme dépense */}
          {form.prix_achat&&form.qte&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,
              background:ajouterDepense?"rgba(255,69,58,0.08)":"rgba(255,255,255,0.04)",
              border:`1px solid ${ajouterDepense?"rgba(255,69,58,0.3)":theme.border}`,
              marginBottom:14,cursor:"pointer"}}
              onClick={()=>setAjouterDepense(!ajouterDepense)}>
              <div style={{width:20,height:20,borderRadius:6,
                background:ajouterDepense?"#FF453A":theme.toggleBg,
                border:`2px solid ${ajouterDepense?"#FF453A":theme.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {ajouterDepense&&<span style={{color:"#fff",fontSize:13,fontWeight:900}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:theme.text}}>📤 Enregistrer comme dépense</div>
                <div style={{fontSize:11,color:theme.textMuted}}>
                  Montant total : <strong style={{color:"#FF453A"}}>{xof(parseInt(form.prix_achat||0)*parseInt(form.qte||0))}</strong> sera ajouté aux dépenses
                </div>
              </div>
            </div>
          )}

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
              <Inp label="Nom du client" value={vf.client} onChange={e=>setVf({...vf,client:e.target.value})} placeholder="Nom du client"/>
              <Inp label="Téléphone client" value={vf.telephone} onChange={e=>setVf({...vf,telephone:e.target.value})} placeholder="+221 77 000 00 00"/>
              <Inp label="Date" type="date" value={vf.date} onChange={e=>setVf({...vf,date:e.target.value})}/>
            </div>
            {/* Mode de paiement */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted,display:"block",marginBottom:8}}>Mode de paiement</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {[
                  {v:"Espèces",    icon:"💵", color:"#30D158"},
                  {v:"Wave",       icon:"📱", color:"#00B9F1"},
                  {v:"Orange Money",icon:"🟠",color:"#FF6600"},
                  {v:"Free Money", icon:"🔵", color:"#0066FF"},
                  {v:"Virement",   icon:"🏦", color:"#BF5AF2"},
                  {v:"Crédit",     icon:"🔄", color:"#FF453A"},
                ].map(m=>(
                  <button key={m.v} onClick={()=>setVf({...vf,paiement:m.v})}
                    style={{padding:"7px 14px",borderRadius:10,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",
                      borderColor:vf.paiement===m.v?m.color:theme.border,
                      background:vf.paiement===m.v?m.color+"22":"transparent",
                      color:vf.paiement===m.v?m.color:theme.textMuted}}>
                    {m.icon} {m.v}
                  </button>
                ))}
              </div>
            </div>
            <div style={{fontSize:13,color:theme.textMuted,marginBottom:12}}>
              Prix unitaire : <strong style={{color:"#30D158"}}>{xof(p.prix_vente)}</strong>
              {vf.qte&&<> — Total : <strong style={{color:"#30D158"}}>{xof(parseInt(vf.qte||0)*p.prix_vente)}</strong></>}
            </div>
            {/* Option facture automatique */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:vf.creerFacture?"rgba(48,209,88,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${vf.creerFacture?"rgba(48,209,88,0.3)":theme.border}`,marginBottom:14,cursor:"pointer"}}
              onClick={()=>setVf({...vf,creerFacture:!vf.creerFacture})}>
              <div style={{width:20,height:20,borderRadius:6,background:vf.creerFacture?"#30D158":theme.toggleBg,border:`2px solid ${vf.creerFacture?"#30D158":theme.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {vf.creerFacture&&<span style={{color:"#fff",fontSize:13,fontWeight:900}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:theme.text}}>Créer une facture automatiquement</div>
                <div style={{fontSize:11,color:theme.textMuted}}>Une facture sera générée et prête à imprimer</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <BtnPri onClick={vendre} style={{opacity:loading?0.6:1}}>{loading?"...":`${vf.creerFacture?"Vendre + Facturer":"Confirmer la vente"}`}</BtnPri>
              <BtnSec onClick={()=>{setShowVente(null);setVf({qte:"",client:"",telephone:"",date:today(),creerFacture:true,paiement:"Espèces"});}}>Annuler</BtnSec>
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
      {search&&<div style={{background:"rgba(10,132,255,0.1)",border:"1px solid rgba(10,132,255,0.3)",borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:13,color:"#0A84FF",fontWeight:600}}>
        🔍 Résultats pour "{search}" · {filtered.length} produit(s) <button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#0A84FF",cursor:"pointer",fontSize:13,marginLeft:8}}>✕ Effacer</button>
      </div>}
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher un produit..."
          style={{background:theme.input,border:`1px solid ${theme.border}`,borderRadius:9,padding:"8px 12px",color:theme.text,fontSize:13,outline:"none",fontFamily:"inherit",flex:1}}/>
        <SelFilter value={fCat} onChange={e=>setFCat(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {catStk.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </SelFilter>
        <div style={{fontSize:13,color:theme.textMuted}}>Valeur : <strong style={{color:"#FF9F0A"}}>{xof(stock.reduce((s,p)=>s+p.prix_achat*p.qte,0))}</strong></div>
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

// ─── Champs spéciaux par catégorie ───────────────────────────────────────────
const CHAMPS_CAT = {
  iphones:     [{key:"imei",label:"IMEI",placeholder:"Ex: 354823110987654"},{key:"couleur",label:"Couleur",placeholder:"Ex: Noir Sidéral"},{key:"capacite",label:"Capacité",placeholder:"Ex: 256GB"},{key:"etat",label:"État",placeholder:"Ex: Neuf / Reconditionné"}],
  ordinateurs: [{key:"serie",label:"N° de série",placeholder:"Ex: C02XL0JHJGH5"},{key:"ram",label:"RAM",placeholder:"Ex: 8GB"},{key:"stockage",label:"Stockage",placeholder:"Ex: 512GB SSD"},{key:"etat",label:"État",placeholder:"Ex: Neuf"}],
  accessoires: [{key:"ref",label:"Référence",placeholder:"Ex: AP-MWP22ZM/A"},{key:"couleur",label:"Couleur",placeholder:"Ex: Blanc"}],
  pieces:      [{key:"ref",label:"Référence",placeholder:"Ex: BAT-IP13-001"},{key:"compatible",label:"Compatible avec",placeholder:"Ex: iPhone 13 / 13 Pro"}],
};

const CATS_FACTURE = [
  {id:"iphones",label:"iPhones",icon:"📱"},
  {id:"accessoires",label:"Accessoires",icon:"🎧"},
  {id:"ordinateurs",label:"Ordinateurs",icon:"💻"},
  {id:"pieces",label:"Pièces",icon:"🔧"},
];

// ─── Factures ─────────────────────────────────────────────────────────────────
function Factures({factures,setFactures,stock,showToast,clients,rechercheFiltre=""}) {
  const {theme}=useTheme();
  const [show,setShow]=useState(false);
  const [preview,setPreview]=useState(null);
  const printRef=useRef();
  const [loading,setLoading]=useState(false);
  const [lignes,setLignes]=useState([{desc:"",cat:"iphones",qte:1,pu:0,details:{}}]);
  const [form,setForm]=useState({client:"",email:"",telephone:"",adresse:"",date:today(),note:"",paiement:"Espèces"});
  const [search,setSearch]=useState(rechercheFiltre||"");

  const totalLignes=lignes.reduce((s,l)=>s+l.qte*l.pu,0);
  const numFacture=()=>`FAC-${new Date().getFullYear()}-${String(factures.length+1).padStart(3,"0")}`;

  const addLigne=()=>setLignes([...lignes,{desc:"",cat:"iphones",qte:1,pu:0,details:{}}]);

  const updLigne=(i,field,val)=>setLignes(lignes.map((l,idx)=>{
    if(idx!==i)return l;
    if(field==="cat") return {...l,cat:val,desc:"",pu:0,details:{}};
    if(field==="produit"){
      const p=stock.find(x=>x.nom===val);
      return {...l,desc:val,pu:p?p.prix_vente:l.pu};
    }
    if(field==="qte"||field==="pu") return {...l,[field]:Number(val)};
    return {...l,[field]:val};
  }));

  const updDetail=(i,key,val)=>setLignes(lignes.map((l,idx)=>idx===i?{...l,details:{...l.details,[key]:val}}:l));
  const delLigne=i=>setLignes(lignes.filter((_,idx)=>idx!==i));

  const creerFacture=async()=>{
    if(!form.client||lignes.some(l=>!l.desc))return showToast("Client et descriptions requis",true);
    setLoading(true);
    try{
      const numero=numFacture();
      const data={numero,client:form.client,email:form.email,telephone:form.telephone,adresse:form.adresse,date:form.date,note:form.note,lignes:JSON.stringify(lignes),total:totalLignes,paiement:form.paiement||"Espèces"};
      const rows=await dbAdd("factures",data);
      setFactures([rows[0],...factures]);
      setPreview(rows[0]);
      setShow(false);
      setForm({client:"",email:"",telephone:"",adresse:"",date:today(),note:""});
      setLignes([{desc:"",cat:"iphones",qte:1,pu:0,details:{}}]);
      showToast("Facture créée ✓");
    }catch(e){showToast("Erreur: "+e.message,true);}
    setLoading(false);
  };

  const imprimer=()=>{
    const content=printRef.current.innerHTML;
    // Créer un iframe invisible pour imprimer sans quitter la page
    const iframe=document.createElement("iframe");
    iframe.style.display="none";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(`<html><head><title>Facture Angy Company</title><style>
      *{box-sizing:border-box;}
      body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1C1C1E;}
      table{width:100%;border-collapse:collapse;}
      th{background:#f5f5f7;padding:10px;text-align:left;font-size:12px;font-weight:700;}
      td{padding:10px;border-bottom:1px solid #e5e5ea;font-size:13px;}
      .details{font-size:11px;color:#636366;margin-top:3px;}
    </style></head><body>${content}</body></html>`);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(()=>document.body.removeChild(iframe),1000);
  };

  const del=async(id)=>{
    // Supprimer la facture
    await dbDel("factures",id);
    setFactures(factures.filter(f=>f.id!==id));updateAngyState("factures",factures.filter(f=>f.id!==id));
    if(preview?.id===id)setPreview(null);
    showToast("Facture supprimée ✓");
  };

  // Produits par catégorie
  const produitsByCat=(cat)=>stock.filter(p=>p.cat===cat);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>Factures</h1>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportExcel(factures.map(f=>({Numéro:f.numero,Client:f.client,Téléphone:f.telephone||"",Date:f.date,Paiement:f.paiement||"Espèces",Total:f.total})),"factures-angy")}
            style={{background:theme.toggleBg,border:`1px solid #30D158`,color:"#30D158",padding:"8px 14px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>📊 Excel</button>
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

          {/* Mode de paiement */}
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:theme.textMuted,display:"block",marginBottom:8}}>Mode de paiement</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {[
                {v:"Espèces",     icon:"💵",color:"#30D158"},
                {v:"Wave",        icon:"📱",color:"#00B9F1"},
                {v:"Orange Money",icon:"🟠",color:"#FF6600"},
                {v:"Free Money",  icon:"🔵",color:"#0066FF"},
                {v:"Virement",    icon:"🏦",color:"#BF5AF2"},
                {v:"Crédit",      icon:"🔄",color:"#FF453A"},
              ].map(m=>(
                <button key={m.v} onClick={()=>setForm({...form,paiement:m.v})}
                  style={{padding:"7px 14px",borderRadius:10,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",
                    borderColor:form.paiement===m.v?m.color:theme.border,
                    background:form.paiement===m.v?m.color+"22":"transparent",
                    color:form.paiement===m.v?m.color:theme.textMuted}}>
                  {m.icon} {m.v}
                </button>
              ))}
            </div>
          </div>

          {/* Lignes articles */}
          <div style={{fontSize:13,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Articles</div>
          <div style={{marginBottom:12}}>
            {lignes.map((l,i)=>{
              const champs=CHAMPS_CAT[l.cat]||[];
              const produits=produitsByCat(l.cat);
              return (
                <div key={i} style={{background:theme.bg,borderRadius:12,padding:14,marginBottom:12,border:`1px solid ${theme.border}`}}>
                  {/* Ligne principale */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 100px auto",gap:8,marginBottom:champs.length>0?10:0,alignItems:"end"}}>
                    {/* Catégorie */}
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <label style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>Catégorie</label>
                      <select value={l.cat} onChange={e=>updLigne(i,"cat",e.target.value)}
                        style={{background:theme.sel,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>
                        {CATS_FACTURE.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                      </select>
                    </div>
                    {/* Produit */}
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <label style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>Produit</label>
                      {produits.length>0?(
                        <select value={l.desc} onChange={e=>updLigne(i,"produit",e.target.value)}
                          style={{background:theme.sel,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>
                          <option value="">-- Choisir --</option>
                          {produits.map(p=><option key={p.id} value={p.nom}>{p.nom} ({xof(p.prix_vente)})</option>)}
                        </select>
                      ):(
                        <input value={l.desc} onChange={e=>updLigne(i,"desc",e.target.value)} placeholder="Description"
                          style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                      )}
                    </div>
                    {/* Quantité */}
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <label style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>Qté</label>
                      <input type="number" value={l.qte} onChange={e=>updLigne(i,"qte",e.target.value)} min="1"
                        style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                    </div>
                    {/* Prix */}
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <label style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>Prix (FCFA)</label>
                      <input type="number" value={l.pu} onChange={e=>updLigne(i,"pu",e.target.value)}
                        style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                    </div>
                    {/* Supprimer */}
                    <button onClick={()=>delLigne(i)}
                      style={{background:"none",border:`1px solid ${theme.border}`,color:"#FF453A",padding:"8px 10px",borderRadius:8,cursor:"pointer",fontSize:14,alignSelf:"flex-end"}}>✕</button>
                  </div>

                  {/* Champs spéciaux selon catégorie */}
                  {champs.length>0&&(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
                      {champs.map(c=>(
                        <div key={c.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                          <label style={{fontSize:11,fontWeight:600,color:"#0A84FF"}}>{c.label}</label>
                          <input value={l.details[c.key]||""} onChange={e=>updDetail(i,c.key,e.target.value)} placeholder={c.placeholder}
                            style={{background:theme.input,border:"1px solid rgba(10,132,255,0.3)",borderRadius:8,padding:"7px 10px",color:theme.text,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sous-total ligne */}
                  {l.desc&&<div style={{textAlign:"right",marginTop:8,fontSize:13,fontWeight:700,color:"#30D158"}}>
                    Sous-total : {xof(l.qte*l.pu)}
                  </div>}
                </div>
              );
            })}
            <button onClick={addLigne}
              style={{background:"none",border:`1px dashed ${theme.border}`,color:theme.textMuted,padding:"10px 16px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"inherit",width:"100%"}}>
              + Ajouter un article
            </button>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:"#0A84FF"}}>Total : {xof(totalLignes)}</div>
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
              {/* Header */}
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
                <div style={{fontSize:16,fontWeight:700}}>{preview.client}</div>
                {preview.telephone&&<div style={{fontSize:13,color:"#636366"}}>📞 {preview.telephone}</div>}
                {preview.email&&<div style={{fontSize:13,color:"#636366"}}>✉️ {preview.email}</div>}
                {preview.adresse&&<div style={{fontSize:13,color:"#636366"}}>📍 {preview.adresse}</div>}
              </div>

              {/* Tableau articles */}
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:24}}>
                <thead>
                  <tr style={{background:"#f5f5f7"}}>
                    {["Description & Détails","Qté","Prix unit.","Total"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:12,fontWeight:700,color:"#636366",textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lignesParsed.map((l,i)=>{
                    const champs=CHAMPS_CAT[l.cat]||[];
                    const details=l.details||{};
                    const detailsList=champs.filter(c=>details[c.key]);
                    return (
                      <tr key={i} style={{borderBottom:"1px solid #e5e5ea"}}>
                        <td style={{padding:"12px",fontSize:14,fontWeight:600}}>
                          {l.desc}
                          {detailsList.length>0&&(
                            <div style={{marginTop:6}}>
                              {detailsList.map(c=>(
                                <div key={c.key} style={{fontSize:11,color:"#636366",marginBottom:2}}>
                                  <strong>{c.label} :</strong> {details[c.key]}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{padding:"12px",fontSize:14,textAlign:"center",color:"#636366"}}>{l.qte}</td>
                        <td style={{padding:"12px",fontSize:14,textAlign:"right",color:"#636366"}}>{xof(l.pu)}</td>
                        <td style={{padding:"12px",fontSize:14,textAlign:"right",fontWeight:700}}>{xof(l.qte*l.pu)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Total + Paiement */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
                <div style={{background:"#f5f5f7",borderRadius:12,padding:"12px 20px"}}>
                  <div style={{fontSize:12,color:"#636366",marginBottom:4}}>Mode de paiement</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#1C1C1E"}}>
                    {preview.paiement==="Wave"?"📱":preview.paiement==="Orange Money"?"🟠":preview.paiement==="Free Money"?"🔵":preview.paiement==="Virement"?"🏦":preview.paiement==="Crédit"?"🔄":"💵"} {preview.paiement||"Espèces"}
                  </div>
                </div>
                <div style={{background:"#f5f5f7",borderRadius:12,padding:"16px 24px",textAlign:"right"}}>
                  <div style={{fontSize:13,color:"#636366",marginBottom:4}}>Total TTC</div>
                  <div style={{fontSize:28,fontWeight:900,color:"#0A84FF"}}>{xof(preview.total)}</div>
                </div>
              </div>

              {preview.note&&<div style={{borderTop:"1px solid #e5e5ea",paddingTop:16,fontSize:13,color:"#636366",fontStyle:"italic"}}>{preview.note}</div>}
              <div style={{marginTop:32,paddingTop:16,borderTop:"2px solid #CC0000",textAlign:"center",fontSize:11,color:"#8E8E93"}}>
                Angy Company · Parcelles Assainies U18, Dakar · +221 71 053 89 17 · Merci pour votre confiance 🙏
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <BtnPri onClick={imprimer}>🖨️ Imprimer / PDF</BtnPri>
              <BtnSec onClick={()=>setPreview(null)}>Fermer</BtnSec>
            </div>
          </Card>
        );
      })()}

      {/* Liste factures */}
      {search&&<div style={{background:"rgba(10,132,255,0.1)",border:"1px solid rgba(10,132,255,0.3)",borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:13,color:"#0A84FF",fontWeight:600}}>
        🔍 Résultats pour "{search}" <button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#0A84FF",cursor:"pointer",fontSize:13,marginLeft:8}}>✕ Effacer</button>
      </div>}
      <TableWrap>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Numéro","Client","Date","Paiement","Total","Actions"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {factures.filter(f=>!search||(f.client?.toLowerCase().includes(search.toLowerCase())||f.numero?.toLowerCase().includes(search.toLowerCase()))).length===0&&<tr><Td colSpan={6} style={{textAlign:"center",color:theme.textMuted,padding:"2rem"}}>Aucune facture</Td></tr>}
            {factures.filter(f=>!search||(f.client?.toLowerCase().includes(search.toLowerCase())||f.numero?.toLowerCase().includes(search.toLowerCase()))).map(f=>{
              const pColor=f.paiement==="Wave"?"#00B9F1":f.paiement==="Orange Money"?"#FF6600":f.paiement==="Free Money"?"#0066FF":f.paiement==="Virement"?"#BF5AF2":f.paiement==="Crédit"?"#FF453A":"#30D158";
              return (
              <tr key={f.id}>
                <Td><strong style={{color:"#BF5AF2"}}>#{f.numero}</strong></Td>
                <Td style={{color:theme.text,fontWeight:600}}>{f.client}</Td>
                <Td style={{color:theme.textMuted,fontSize:13}}>{f.date}</Td>
                <Td><span style={{background:pColor+"22",color:pColor,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:600}}>{f.paiement||"Espèces"}</span></Td>
                <Td style={{fontWeight:700,color:"#0A84FF"}}>{xof(f.total)}</Td>
                <Td>
                  <div style={{display:"flex",gap:6}}>
                    <button style={{background:"rgba(191,90,242,0.12)",border:"1px solid #BF5AF2",color:"#BF5AF2",padding:"4px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}} onClick={()=>setPreview(f)}>👁 Voir</button>
                    <button style={{background:"none",border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onClick={()=>del(f.id)}>🗑</button>
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

// ─── Bénéfices ────────────────────────────────────────────────────────────────
function Benefices({depenses,ventes,stock,factures}) {
  const {theme}=useTheme();
  const [periode,setPeriode]=useState("all");
  const now=new Date();
  const fDate=d=>{if(periode==="all")return true;const dt=new Date(d);if(periode==="mois")return dt.getMonth()===now.getMonth()&&dt.getFullYear()===now.getFullYear();if(periode==="semaine")return(now-dt)<7*24*3600*1000;return true;};
  const fF=factures.filter(f=>fDate(f.date));
  const dF=depenses.filter(d=>d.statut==="Approuvée"&&fDate(d.date));
  const CA=fF.reduce((s,f)=>s+f.total,0);
  const cout=dF.reduce((s,d)=>s+d.montant,0);
  const ben=CA-cout;
  const marge=CA>0?Math.round((ben/CA)*100):0;
  // Top produits depuis les lignes de factures
  const byProd={};
  fF.forEach(f=>{
    try{
      const lignes=typeof f.lignes==="string"?JSON.parse(f.lignes):f.lignes||[];
      lignes.forEach(l=>{
        if(!l.desc)return;
        if(!byProd[l.desc])byProd[l.desc]={produit:l.desc,qte:0,ca:0};
        byProd[l.desc].qte+=l.qte||1;
        byProd[l.desc].ca+=(l.qte||1)*(l.pu||0);
      });
    }catch(e){}
  });
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

      {/* Bénéfice par produit */}
      <Card style={{marginBottom:14}}>
        <CardTitle>💰 Bénéfice par produit vendu</CardTitle>
        {top.length===0
          ?<div style={{color:theme.textMuted,fontSize:13}}>Aucune vente pour cette période</div>
          :<div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr>{["Produit","Qté vendue","CA","Coût achat","Bénéfice","Marge"].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:theme.textMuted,background:theme.tableHead,borderBottom:`1px solid ${theme.border}`}}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {top.map(p=>{
                  const sp=stock.find(x=>x.nom===p.produit);
                  const coutAchat=sp?sp.prix_achat*p.qte:0;
                  const beneficeProduit=p.ca-coutAchat;
                  const margeProduit=coutAchat>0?Math.round((beneficeProduit/coutAchat)*100):null;
                  return (
                    <tr key={p.produit} style={{borderBottom:`1px solid ${theme.borderLight}`}}>
                      <td style={{padding:"11px 12px",fontSize:13,fontWeight:600,color:theme.text}}>{p.produit}</td>
                      <td style={{padding:"11px 12px",fontSize:13,color:theme.textMuted,textAlign:"center"}}>{p.qte}</td>
                      <td style={{padding:"11px 12px",fontSize:13,fontWeight:700,color:"#0A84FF"}}>{xof(p.ca)}</td>
                      <td style={{padding:"11px 12px",fontSize:13,color:"#FF453A"}}>{coutAchat>0?xof(coutAchat):"—"}</td>
                      <td style={{padding:"11px 12px",fontSize:13,fontWeight:800,color:beneficeProduit>=0?"#30D158":"#FF453A"}}>{xof(beneficeProduit)}</td>
                      <td style={{padding:"11px 12px"}}>
                        {margeProduit!==null
                          ?<span style={{background:margeProduit>=0?"rgba(48,209,88,0.12)":"rgba(255,69,58,0.12)",color:margeProduit>=0?"#30D158":"#FF453A",padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>
                            {margeProduit>=0?"+":""}{margeProduit}%
                          </span>
                          :<span style={{color:theme.textMuted,fontSize:12}}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
                <tr style={{borderTop:`2px solid ${theme.border}`,background:theme.tableHead}}>
                  <td style={{padding:"11px 12px",fontSize:13,fontWeight:800,color:theme.text}}>TOTAL</td>
                  <td style={{padding:"11px 12px",fontSize:13,color:theme.textMuted,textAlign:"center"}}>{top.reduce((s,p)=>s+p.qte,0)}</td>
                  <td style={{padding:"11px 12px",fontSize:13,fontWeight:800,color:"#0A84FF"}}>{xof(CA)}</td>
                  <td style={{padding:"11px 12px",fontSize:13,fontWeight:700,color:"#FF453A"}}>{xof(top.reduce((s,p)=>{const sp=stock.find(x=>x.nom===p.produit);return s+(sp?sp.prix_achat*p.qte:0);},0))}</td>
                  <td style={{padding:"11px 12px",fontSize:14,fontWeight:900,color:ben>=0?"#30D158":"#FF453A"}}>{xof(ben)}</td>
                  <td style={{padding:"11px 12px",fontSize:14,fontWeight:800,color:"#FF9F0A"}}>{marge}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        }
      </Card>
    </div>
  );
}

// ─── Ventes ───────────────────────────────────────────────────────────────────
function Ventes({ventes,setVentes,factures,catStk,showToast}) {
  const {theme}=useTheme();
  const [fCat,setFCat]=useState("all");
  const [fPeriode,setFPeriode]=useState("all");
  const now=new Date();

  const fDate=(d)=>{
    if(fPeriode==="all")return true;
    const dt=new Date(d);
    if(fPeriode==="mois")return dt.getMonth()===now.getMonth()&&dt.getFullYear()===now.getFullYear();
    if(fPeriode==="semaine")return(now-dt)<7*24*3600*1000;
    if(fPeriode==="jour")return dt.toDateString()===now.toDateString();
    return true;
  };

  // Récupérer toutes les ventes depuis les factures
  const ventesDepuisFactures=[];
  factures.forEach(f=>{
    try{
      const lignes=typeof f.lignes==="string"?JSON.parse(f.lignes):f.lignes||[];
      lignes.forEach((l,i)=>{
        ventesDepuisFactures.push({
          id:`${f.id}-${i}`,
          produit:l.desc,
          cat:l.cat||"",
          qte:l.qte||1,
          prix_vente:l.pu||0,
          total:(l.qte||1)*(l.pu||0),
          client:f.client||"—",
          date:f.date,
          factureNum:f.numero,
          details:l.details||{},
        });
      });
    }catch(e){}
  });

  const filtered=ventesDepuisFactures.filter(v=>{
    const catOk=fCat==="all"||v.cat===fCat;
    const dateOk=fDate(v.date);
    return catOk&&dateOk;
  });

  const totalCA=filtered.reduce((s,v)=>s+v.total,0);
  const totalQte=filtered.reduce((s,v)=>s+v.qte,0);

  // Imprimer
  const imprimer=()=>{
    const iframe=document.createElement("iframe");
    iframe.style.display="none";
    document.body.appendChild(iframe);
    let rows="";
    filtered.forEach((v,i)=>{
      rows+=`<tr><td>${i+1}</td><td><strong>${v.produit}</strong></td><td>${v.client}</td><td>${v.qte}</td><td>${xof(v.prix_vente)}</td><td><strong>${xof(v.total)}</strong></td><td>${v.date}</td><td>${v.factureNum||"—"}</td></tr>`;
    });
    iframe.contentDocument.write(`<html><head><title>Ventes — Angy Company</title><style>*{box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:30px;color:#1C1C1E;}h1{font-size:18px;}table{width:100%;border-collapse:collapse;margin-top:14px;}th,td{border:1px solid #e5e5ea;padding:7px 10px;font-size:12px;text-align:left;}th{background:#f5f5f7;font-weight:700;}</style></head><body>
    <h1>Angy Company — Registre des ventes</h1>
    <p style="color:#636366;font-size:12px;">Total : ${xof(totalCA)} · ${filtered.length} vente(s) · ${totalQte} article(s)</p>
    <table><thead><tr><th>#</th><th>Produit</th><th>Client</th><th>Qté</th><th>Prix unit.</th><th>Total</th><th>Date</th><th>Facture</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="margin-top:10px;font-weight:700;">Total CA : ${xof(totalCA)}</p>
    </body></html>`);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(()=>document.body.removeChild(iframe),1000);
  };

  const getCat=(id)=>catStk.find(c=>c.id===id)||{icon:"📦",label:id||"Autre",color:"#8E8E93"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>💸 Ventes</h1>
        <button onClick={imprimer} style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"8px 16px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>🖨️ Imprimer</button>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        <KPI label="Chiffre d'affaires" value={xof(totalCA)} accent="#30D158" icon="💰" sub={`${filtered.length} vente(s)`}/>
        <KPI label="Articles vendus" value={totalQte} accent="#0A84FF" icon="📦" sub="Total quantités"/>
        <KPI label="Panier moyen" value={filtered.length>0?xof(Math.round(totalCA/filtered.length)):"—"} accent="#FF9F0A" icon="🛒" sub="Par vente"/>
      </div>

      {/* Filtres */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <select value={fCat} onChange={e=>setFCat(e.target.value)}
          style={{background:theme.sel,border:`1px solid ${theme.border}`,borderRadius:9,padding:"8px 12px",color:theme.text,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          <option value="all">Toutes catégories</option>
          {catStk.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select value={fPeriode} onChange={e=>setFPeriode(e.target.value)}
          style={{background:theme.sel,border:`1px solid ${theme.border}`,borderRadius:9,padding:"8px 12px",color:theme.text,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          <option value="all">Toute la période</option>
          <option value="jour">Aujourd'hui</option>
          <option value="semaine">Cette semaine</option>
          <option value="mois">Ce mois</option>
        </select>
        <div style={{marginLeft:"auto",color:theme.textMuted,fontSize:13}}>
          Total : <strong style={{color:"#30D158"}}>{xof(totalCA)}</strong> · {filtered.length} vente{filtered.length!==1?"s":""}
        </div>
      </div>

      {/* Tableau */}
      <div style={{background:theme.bgCard,borderRadius:16,border:`1px solid ${theme.border}`,overflow:"auto",boxShadow:theme.shadow}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>{["Produit","Catégorie","Client","Qté","Prix unit.","Total","Date","Facture"].map(h=>(
              <th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:theme.textMuted,background:theme.tableHead,borderBottom:`1px solid ${theme.border}`,whiteSpace:"nowrap"}}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={8} style={{padding:"2rem",textAlign:"center",color:theme.textMuted}}>Aucune vente</td></tr>}
            {filtered.map(v=>{
              const cat=getCat(v.cat);
              return (
                <tr key={v.id}>
                  <td style={{padding:"11px 14px",fontSize:13,color:theme.text}}><strong>{v.produit}</strong></td>
                  <td style={{padding:"11px 14px"}}>
                    <span style={{background:cat.color+"22",color:cat.color,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:600}}>{cat.icon} {cat.label}</span>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:13,color:theme.textSub}}>{v.client}</td>
                  <td style={{padding:"11px 14px",fontSize:13,color:theme.textMuted,textAlign:"center"}}>{v.qte}</td>
                  <td style={{padding:"11px 14px",fontSize:13,color:theme.textMuted}}>{xof(v.prix_vente)}</td>
                  <td style={{padding:"11px 14px",fontSize:13,fontWeight:700,color:"#30D158"}}>{xof(v.total)}</td>
                  <td style={{padding:"11px 14px",fontSize:12,color:theme.textMuted}}>{v.date}</td>
                  <td style={{padding:"11px 14px"}}><span style={{color:"#BF5AF2",fontSize:12,fontWeight:600}}>#{v.factureNum}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Devis ────────────────────────────────────────────────────────────────────
function Devis({devis,setDevis,factures,setFactures,stock,clients,showToast}) {
  const {theme}=useTheme();
  const [show,setShow]=useState(false);
  const [preview,setPreview]=useState(null);
  const printRef=useRef();
  const [lignes,setLignes]=useState([{desc:"",cat:"iphones",qte:1,pu:0}]);
  const [form,setForm]=useState({client:"",telephone:"",email:"",adresse:"",date:today(),validite:"",note:"Devis valable 30 jours",paiement:"Espèces"});

  const totalLignes=lignes.reduce((s,l)=>s+l.qte*l.pu,0);
  const numDevis=()=>`DEV-${new Date().getFullYear()}-${String(devis.length+1).padStart(3,"0")}`;

  const addLigne=()=>setLignes([...lignes,{desc:"",cat:"iphones",qte:1,pu:0}]);
  const updLigne=(i,field,val)=>setLignes(lignes.map((l,idx)=>{
    if(idx!==i)return l;
    if(field==="produit"){const p=stock.find(x=>x.nom===val);return {...l,desc:val,pu:p?p.prix_vente:l.pu};}
    if(field==="qte"||field==="pu")return {...l,[field]:Number(val)};
    return {...l,[field]:val};
  }));
  const delLigne=i=>setLignes(lignes.filter((_,idx)=>idx!==i));

  const creerDevis=async()=>{
    if(!form.client||lignes.some(l=>!l.desc))return showToast("Client et descriptions requis",true);
    const numero=numDevis();
    const rows=await dbAdd("devis",{numero,client:form.client,telephone:form.telephone,email:form.email,adresse:form.adresse,date:form.date,validite:form.validite,lignes:JSON.stringify(lignes),total:totalLignes,statut:"En attente",note:form.note,paiement:form.paiement});
    setDevis([rows[0],...devis]);updateAngyState("devis",[rows[0],...devis]);
    setLignes([{desc:"",cat:"iphones",qte:1,pu:0}]);
    setForm({client:"",telephone:"",email:"",adresse:"",date:today(),validite:"",note:"Devis valable 30 jours",paiement:"Espèces"});
    setShow(false);showToast("Devis créé ✓");
  };

  // Convertir devis en facture
  const convertirEnFacture=async(d)=>{
    const numero=`FAC-${new Date().getFullYear()}-${String(factures.length+1).padStart(3,"0")}`;
    const rows=await dbAdd("factures",{numero,client:d.client,telephone:d.telephone||"",email:d.email||"",adresse:d.adresse||"",date:today(),note:d.note||"Merci pour votre confiance",lignes:d.lignes,total:d.total,paiement:d.paiement||"Espèces"});
    setFactures([rows[0],...factures]);
    await dbPatch("devis",d.id,{statut:"Accepté"});
    setDevis(devis.map(x=>x.id===d.id?{...x,statut:"Accepté"}:x));
    setPreview(null);
    showToast(`Devis converti en facture ${numero} ✓`);
  };

  const del=async(id)=>{await dbDel("devis",id);setDevis(devis.filter(d=>d.id!==id));updateAngyState("devis",devis.filter(d=>d.id!==id));showToast("Supprimé");};

  const imprimer=()=>{
    if(!preview)return;
    const lignesParsed=typeof preview.lignes==="string"?JSON.parse(preview.lignes):preview.lignes||[];
    const iframe=document.createElement("iframe");
    iframe.style.display="none";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(`<html><head><title>Devis ${preview.numero}</title><style>
      *{box-sizing:border-box;}body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1C1C1E;}
      table{width:100%;border-collapse:collapse;}th{background:#f5f5f7;padding:10px;text-align:left;font-size:12px;font-weight:700;}
      td{padding:10px;border-bottom:1px solid #e5e5ea;font-size:13px;}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #1400FF;">
      <div><strong style="font-size:22px;color:#1400FF;">ANGY COMPANY</strong><br/><small style="color:#636366;">📍 Parcelles Assainies U18, Dakar · 📞 +221 71 053 89 17</small></div>
      <div style="text-align:right;"><strong style="font-size:18px;">DEVIS</strong><br/><strong style="color:#BF5AF2;">${preview.numero}</strong><br/><small>${preview.date}</small>${preview.validite?`<br/><small>Valide jusqu'au : ${preview.validite}</small>`:""}</div>
    </div>
    <div style="background:#f5f5f7;padding:14px;border-radius:10px;margin-bottom:24px;">
      <strong>${preview.client}</strong>${preview.telephone?`<br/>${preview.telephone}`:""}${preview.adresse?`<br/>${preview.adresse}`:""}
    </div>
    <table><thead><tr><th>Description</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead><tbody>
    ${lignesParsed.map(l=>`<tr><td><strong>${l.desc}</strong></td><td>${l.qte}</td><td>${xof(l.pu)}</td><td><strong>${xof(l.qte*l.pu)}</strong></td></tr>`).join("")}
    </tbody></table>
    <div style="text-align:right;margin-top:20px;"><strong style="font-size:22px;color:#0A84FF;">Total : ${xof(preview.total)}</strong></div>
    ${preview.note?`<div style="margin-top:20px;padding:12px;border:1px solid #e5e5ea;border-radius:8px;font-size:12px;color:#636366;">${preview.note}</div>`:""}
    <div style="margin-top:30px;text-align:center;font-size:11px;color:#8E8E93;border-top:1px solid #e5e5ea;padding-top:12px;">Angy Company · Parcelles Assainies U18, Dakar · +221 71 053 89 17</div>
    </body></html>`);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(()=>document.body.removeChild(iframe),1000);
  };

  const produitsByCat=(cat)=>stock.filter(p=>p.cat===cat);
  const statutColor=(s)=>s==="Accepté"?"#30D158":s==="Refusé"?"#FF453A":"#FF9F0A";

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>📋 Devis ({devis.length})</h1>
        <BtnPri onClick={()=>{setShow(!show);setPreview(null);}}>{show?"✕ Annuler":"+ Nouveau devis"}</BtnPri>
      </div>

      {/* Formulaire */}
      {show&&(
        <Card style={{marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:700,color:theme.text,marginBottom:16}}>Nouveau devis — {numDevis()}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <Inp label="Nom du client *" value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Ex: Moussa Diallo"/>
            <Inp label="Téléphone" value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+221 77 000 00 00"/>
            <Inp label="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="client@email.com"/>
            <Inp label="Adresse" value={form.adresse} onChange={e=>setForm({...form,adresse:e.target.value})} placeholder="Dakar, Sénégal"/>
            <Inp label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            <Inp label="Valide jusqu'au" type="date" value={form.validite} onChange={e=>setForm({...form,validite:e.target.value})}/>
            <Inp label="Note" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Devis valable 30 jours"/>
          </div>

          {/* Articles */}
          <div style={{fontSize:13,fontWeight:700,color:theme.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Articles</div>
          {lignes.map((l,i)=>(
            <div key={i} style={{background:theme.bg,borderRadius:12,padding:14,marginBottom:10,border:`1px solid ${theme.border}`}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 100px auto",gap:8,alignItems:"end"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>Catégorie</label>
                  <select value={l.cat} onChange={e=>updLigne(i,"cat",e.target.value)}
                    style={{background:theme.sel,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>
                    {CATS_FACTURE.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>Produit</label>
                  {produitsByCat(l.cat).length>0?(
                    <select value={l.desc} onChange={e=>updLigne(i,"produit",e.target.value)}
                      style={{background:theme.sel,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>
                      <option value="">-- Choisir --</option>
                      {produitsByCat(l.cat).map(p=><option key={p.id} value={p.nom}>{p.nom} ({xof(p.prix_vente)})</option>)}
                    </select>
                  ):(
                    <input value={l.desc} onChange={e=>updLigne(i,"desc",e.target.value)} placeholder="Description"
                      style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                  )}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>Qté</label>
                  <input type="number" value={l.qte} onChange={e=>updLigne(i,"qte",e.target.value)} min="1"
                    style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:11,fontWeight:600,color:theme.textMuted}}>Prix unit.</label>
                  <input type="number" value={l.pu} onChange={e=>updLigne(i,"pu",e.target.value)}
                    style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:8,padding:"8px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                </div>
                <button onClick={()=>delLigne(i)} style={{background:"none",border:`1px solid ${theme.border}`,color:"#FF453A",padding:"8px",borderRadius:8,cursor:"pointer",fontSize:14,alignSelf:"flex-end"}}>✕</button>
              </div>
            </div>
          ))}
          <button onClick={addLigne} style={{background:"none",border:`1px dashed ${theme.border}`,color:theme.textMuted,padding:"10px 16px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"inherit",width:"100%",marginBottom:16}}>+ Ajouter un article</button>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:"#0A84FF"}}>Total : {xof(totalLignes)}</div>
            <BtnPri onClick={creerDevis}>Créer le devis</BtnPri>
          </div>
        </Card>
      )}

      {/* Aperçu devis */}
      {preview&&(()=>{
        const lignesParsed=typeof preview.lignes==="string"?JSON.parse(preview.lignes):preview.lignes||[];
        return (
          <Card style={{marginBottom:20,border:"1px solid rgba(191,90,242,0.3)"}}>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <button onClick={imprimer} style={{background:"#BF5AF2",color:"#fff",border:"none",padding:"9px 18px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>🖨️ Imprimer</button>
              {preview.statut==="En attente"&&(
                <>
                  <button onClick={()=>convertirEnFacture(preview)}
                    style={{background:"#30D158",color:"#fff",border:"none",padding:"9px 18px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                    ✅ Convertir en facture
                  </button>
                  <button onClick={async()=>{await dbPatch("devis",preview.id,{statut:"Refusé"});setDevis(devis.map(x=>x.id===preview.id?{...x,statut:"Refusé"}:x));setPreview(null);showToast("Devis refusé");}}
                    style={{background:"rgba(255,69,58,0.12)",color:"#FF453A",border:"1px solid #FF453A",padding:"9px 18px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                    ✕ Refuser
                  </button>
                </>
              )}
              <BtnSec onClick={()=>setPreview(null)}>Fermer</BtnSec>
            </div>
            {/* Contenu devis */}
            <div ref={printRef} style={{background:"#fff",color:"#1C1C1E",padding:"40px",borderRadius:12,fontFamily:"Arial,sans-serif"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32,paddingBottom:24,borderBottom:"3px solid #1400FF"}}>
                <div>
                  <AngyLogo height={40} forPrint={true}/>
                  <div style={{marginTop:8,fontSize:12,color:"#636366"}}>📍 Parcelles Assainies U18, Dakar<br/>📞 +221 71 053 89 17</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"#636366",textTransform:"uppercase",letterSpacing:"0.1em"}}>Devis</div>
                  <div style={{fontSize:22,fontWeight:900,color:"#BF5AF2"}}>{preview.numero}</div>
                  <div style={{fontSize:13,color:"#636366"}}>Date : {preview.date}</div>
                  {preview.validite&&<div style={{fontSize:12,color:"#FF9F0A",fontWeight:600}}>Valide jusqu'au : {preview.validite}</div>}
                  <div style={{marginTop:6}}><span style={{background:statutColor(preview.statut)+"22",color:statutColor(preview.statut),padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>{preview.statut}</span></div>
                </div>
              </div>
              <div style={{background:"#f5f5f7",borderRadius:10,padding:"14px 18px",marginBottom:24}}>
                <div style={{fontSize:11,color:"#636366",marginBottom:4,textTransform:"uppercase"}}>Destinataire</div>
                <div style={{fontSize:16,fontWeight:700}}>{preview.client}</div>
                {preview.telephone&&<div style={{fontSize:13,color:"#636366"}}>{preview.telephone}</div>}
                {preview.adresse&&<div style={{fontSize:13,color:"#636366"}}>{preview.adresse}</div>}
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:24}}>
                <thead>
                  <tr style={{background:"#f5f5f7"}}>
                    {["Description","Qté","Prix unit.","Total"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:12,fontWeight:700,color:"#636366",textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lignesParsed.map((l,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #e5e5ea"}}>
                      <td style={{padding:"12px",fontSize:14,fontWeight:600}}>{l.desc}</td>
                      <td style={{padding:"12px",fontSize:14,textAlign:"center",color:"#636366"}}>{l.qte}</td>
                      <td style={{padding:"12px",fontSize:14,textAlign:"right",color:"#636366"}}>{xof(l.pu)}</td>
                      <td style={{padding:"12px",fontSize:14,textAlign:"right",fontWeight:700}}>{xof(l.qte*l.pu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:24}}>
                <div style={{background:"#f5f5f7",borderRadius:12,padding:"16px 24px",textAlign:"right"}}>
                  <div style={{fontSize:13,color:"#636366",marginBottom:4}}>Total TTC</div>
                  <div style={{fontSize:28,fontWeight:900,color:"#0A84FF"}}>{xof(preview.total)}</div>
                </div>
              </div>
              {preview.note&&<div style={{borderTop:"1px solid #e5e5ea",paddingTop:16,fontSize:13,color:"#636366",fontStyle:"italic"}}>{preview.note}</div>}
              <div style={{marginTop:32,paddingTop:16,borderTop:"2px solid #CC0000",textAlign:"center",fontSize:11,color:"#8E8E93"}}>
                Angy Company · Parcelles Assainies U18, Dakar · +221 71 053 89 17
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Liste devis */}
      <TableWrap>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Numéro","Client","Date","Total","Statut","Actions"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {devis.length===0&&<tr><Td colSpan={6} style={{textAlign:"center",color:theme.textMuted,padding:"2rem"}}>Aucun devis</Td></tr>}
            {devis.map(d=>(
              <tr key={d.id}>
                <Td><strong style={{color:"#BF5AF2"}}>#{d.numero}</strong></Td>
                <Td style={{color:theme.text,fontWeight:600}}>{d.client}</Td>
                <Td style={{color:theme.textMuted,fontSize:13}}>{d.date}</Td>
                <Td style={{fontWeight:700,color:"#0A84FF"}}>{xof(d.total)}</Td>
                <Td><span style={{background:statutColor(d.statut)+"22",color:statutColor(d.statut),padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:700}}>{d.statut}</span></Td>
                <Td>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setPreview(d)} style={{background:"rgba(191,90,242,0.12)",border:"1px solid #BF5AF2",color:"#BF5AF2",padding:"4px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>👁 Voir</button>
                    {d.statut==="En attente"&&<button onClick={()=>convertirEnFacture(d)} style={{background:"rgba(48,209,88,0.12)",border:"1px solid #30D158",color:"#30D158",padding:"4px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>✅ Facturer</button>}
                    <button onClick={()=>del(d.id)} style={{background:"none",border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🗑</button>
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

// ─── Clients ──────────────────────────────────────────────────────────────────
function Clients({clients,setClients,factures,showToast,rechercheFiltre=""}) {
  const {theme}=useTheme();
  const [show,setShow]=useState(false);
  const [editId,setEditId]=useState(null);
  const [search,setSearch]=useState(rechercheFiltre||"");
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState({nom:"",telephone:"",email:"",adresse:"",type:"Particulier",note:""});

  const filtered=clients.filter(c=>{
    const q=search.toLowerCase();
    return !q||(c.nom+c.telephone+(c.email||"")).toLowerCase().includes(q);
  });

  // Historique achats d'un client
  const getAchats=(clientNom)=>factures.filter(f=>f.client===clientNom);
  const getTotalAchats=(clientNom)=>getAchats(clientNom).reduce((s,f)=>s+f.total,0);

  // Top clients
  const topClients=[...clients].sort((a,b)=>getTotalAchats(b.nom)-getTotalAchats(a.nom));

  const add=async()=>{
    if(!form.nom)return showToast("Nom requis",true);
    if(editId){
      await dbPatch("clients",editId,form);
      setClients(clients.map(c=>c.id===editId?{...c,...form}:c));
      setEditId(null);showToast("Client modifié ✓");
    } else {
      const rows=await dbAdd("clients",form);
      setClients([rows[0],...clients]);updateAngyState("clients",[rows[0],...clients]);
      showToast("Client ajouté ✓");
    }
    setForm({nom:"",telephone:"",email:"",adresse:"",type:"Particulier",note:""});
    setShow(false);
  };

  const startEdit=(c)=>{setForm({nom:c.nom,telephone:c.telephone||"",email:c.email||"",adresse:c.adresse||"",type:c.type||"Particulier",note:c.note||""});setEditId(c.id);setShow(true);};
  const del=async(id)=>{await dbDel("clients",id);setClients(clients.filter(c=>c.id!==id));updateAngyState("clients",clients.filter(c=>c.id!==id));showToast("Supprimé");};

  const imprimer=()=>{
    const iframe=document.createElement("iframe");
    iframe.style.display="none";
    document.body.appendChild(iframe);
    let rows="";
    topClients.forEach((c,i)=>{
      const total=getTotalAchats(c.nom);
      const achats=getAchats(c.nom).length;
      rows+=`<tr><td>${i+1}</td><td><strong>${c.nom}</strong></td><td>${c.telephone||"—"}</td><td>${c.type}</td><td>${achats}</td><td><strong>${xof(total)}</strong></td></tr>`;
    });
    iframe.contentDocument.write(`<html><head><title>Clients — Angy Company</title><style>*{box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:30px;color:#1C1C1E;}h1{font-size:18px;}table{width:100%;border-collapse:collapse;margin-top:14px;}th,td{border:1px solid #e5e5ea;padding:7px 10px;font-size:12px;text-align:left;}th{background:#f5f5f7;font-weight:700;}</style></head><body>
    <h1>Angy Company — Liste des clients</h1>
    <p style="color:#636366;font-size:12px;">${clients.length} client(s) · ${new Date().toLocaleDateString("fr-FR")}</p>
    <table><thead><tr><th>#</th><th>Nom</th><th>Téléphone</th><th>Type</th><th>Achats</th><th>Total dépensé</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(()=>document.body.removeChild(iframe),1000);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>👥 Clients ({clients.length})</h1>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportExcel(clients.map(c=>({Nom:c.nom,Téléphone:c.telephone||"",Email:c.email||"",Adresse:c.adresse||"",Type:c.type||"Particulier","Total achats":getTotalAchats(c.nom),"Nb achats":getAchats(c.nom).length})),"clients-angy")}
            style={{background:theme.toggleBg,border:`1px solid #30D158`,color:"#30D158",padding:"8px 14px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>📊 Excel</button>
          <button onClick={imprimer} style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"8px 16px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>🖨️ Imprimer</button>
          <button onClick={()=>{setShow(!show);setEditId(null);setForm({nom:"",telephone:"",email:"",adresse:"",type:"Particulier",note:""});setSelected(null);}}
            style={{background:"#0A84FF",color:"#fff",border:"none",padding:"9px 20px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
            {show?"✕ Annuler":"+ Nouveau client"}
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {show&&(
        <div style={{background:theme.bgCard,borderRadius:16,padding:"20px 22px",border:`1px solid ${theme.border}`,marginBottom:16,boxShadow:theme.shadow}}>
          <div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:14}}>{editId?"✏️ Modifier":"Nouveau client"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
            {[["Nom *","nom","text","Nom du client"],["Téléphone","telephone","tel","+221 77 000 00 00"],["Email","email","email","client@email.com"],["Adresse","adresse","text","Dakar, Sénégal"],["Note","note","text","Optionnel"]].map(([label,key,type,placeholder])=>(
              <div key={key} style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>{label}</label>
                <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder}
                  style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              </div>
            ))}
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Type</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
                style={{background:theme.sel,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
                {["Particulier","Entreprise","Revendeur","VIP"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={add} style={{background:"#0A84FF",color:"#fff",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
              {editId?"💾 Sauvegarder":"Ajouter"}
            </button>
            {editId&&<button onClick={()=>{setEditId(null);setShow(false);}} style={{background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,padding:"10px 18px",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>Annuler</button>}
          </div>
        </div>
      )}

      {/* Fiche client détaillée */}
      {selected&&(()=>{
        const achats=getAchats(selected.nom);
        const total=getTotalAchats(selected.nom);
        return (
          <div style={{background:theme.bgCard,borderRadius:16,padding:"20px 22px",border:`1px solid #0A84FF44`,marginBottom:16,boxShadow:theme.shadow}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{width:52,height:52,borderRadius:14,background:"rgba(10,132,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>👤</div>
                <div>
                  <div style={{fontSize:18,fontWeight:800,color:theme.text}}>{selected.nom}</div>
                  <div style={{fontSize:12,color:theme.textMuted}}>{selected.type} · {selected.telephone||"—"}</div>
                  {selected.email&&<div style={{fontSize:12,color:theme.textMuted}}>{selected.email}</div>}
                </div>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:theme.textMuted,cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
              <KPI label="Total dépensé" value={xof(total)} accent="#0A84FF" icon="💰" sub={`${achats.length} achat(s)`}/>
              <KPI label="Dernier achat" value={achats[0]?.date||"—"} accent="#30D158" icon="📅" sub="Date"/>
              <KPI label="Panier moyen" value={achats.length>0?xof(Math.round(total/achats.length)):"—"} accent="#FF9F0A" icon="🛒" sub="Par achat"/>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:theme.text,marginBottom:10}}>Historique des achats</div>
            {achats.length===0
              ?<div style={{color:theme.textMuted,fontSize:13}}>Aucun achat enregistré</div>
              :<div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["N° Facture","Date","Montant"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:theme.textMuted,background:theme.tableHead,borderBottom:`1px solid ${theme.border}`}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {achats.map(f=>(
                      <tr key={f.id} style={{borderBottom:`1px solid ${theme.borderLight}`}}>
                        <td style={{padding:"8px 12px",color:"#BF5AF2",fontWeight:600}}>#{f.numero}</td>
                        <td style={{padding:"8px 12px",color:theme.textMuted,fontSize:12}}>{f.date}</td>
                        <td style={{padding:"8px 12px",fontWeight:700,color:"#0A84FF"}}>{xof(f.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </div>
        );
      })()}

      {/* Recherche */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher un client..."
        style={{width:"100%",background:theme.input,border:`1px solid ${theme.border}`,borderRadius:9,padding:"9px 14px",color:theme.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:16}}/>

      {/* Liste clients */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {filtered.length===0&&<div style={{color:theme.textMuted,fontSize:13,gridColumn:"1/-1",textAlign:"center",padding:"2rem"}}>Aucun client</div>}
        {filtered.map(c=>{
          const total=getTotalAchats(c.nom);
          const achats=getAchats(c.nom).length;
          const typeColor=c.type==="VIP"?"#FF9F0A":c.type==="Entreprise"?"#0A84FF":c.type==="Revendeur"?"#BF5AF2":"#30D158";
          return (
            <div key={c.id} style={{background:theme.bgCard,borderRadius:16,padding:"18px 20px",border:`1px solid ${theme.border}`,boxShadow:theme.shadow,cursor:"pointer"}}
              onClick={()=>setSelected(c)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"rgba(10,132,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👤</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:theme.text}}>{c.nom}</div>
                    <div style={{fontSize:11,color:theme.textMuted}}>{c.telephone||"—"}</div>
                  </div>
                </div>
                <span style={{background:typeColor+"22",color:typeColor,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:600}}>{c.type}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderTop:`1px solid ${theme.borderLight}`}}>
                <div style={{fontSize:12,color:theme.textMuted}}>{achats} achat{achats!==1?"s":""}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#0A84FF"}}>{total>0?xof(total):"Nouveau"}</div>
              </div>
              <div style={{display:"flex",gap:6,marginTop:10}}>
                <button onClick={e=>{e.stopPropagation();startEdit(c);}} style={{flex:1,background:"rgba(255,159,10,0.12)",border:"1px solid #FF9F0A",color:"#FF9F0A",padding:"6px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>✏️</button>
                <button onClick={e=>{e.stopPropagation();del(c.id);}} style={{background:"none",border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Rapports ─────────────────────────────────────────────────────────────────
function Rapports({depenses,stock,ventes,factures,catStk}) {
  const {theme}=useTheme();
  const now=new Date();
  const annee=now.getFullYear();
  const MOIS=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  // Calculs globaux
  const totalCA=factures.reduce((s,f)=>s+f.total,0);
  const totalDep=depenses.filter(d=>d.statut==="Approuvée").reduce((s,d)=>s+d.montant,0);
  const benefice=totalCA-totalDep;
  const marge=totalCA>0?Math.round((benefice/totalCA)*100):0;
  const stockVal=stock.reduce((s,p)=>s+p.prix_achat*p.qte,0);

  // Par mois
  const parMois=MOIS.map((_,i)=>{
    const mm=String(i+1).padStart(2,"0");
    const ca=factures.filter(f=>f.date?.slice(5,7)===mm&&f.date?.startsWith(String(annee))).reduce((s,f)=>s+f.total,0);
    const dep=depenses.filter(d=>d.statut==="Approuvée"&&d.date?.slice(5,7)===mm&&d.date?.startsWith(String(annee))).reduce((s,d)=>s+d.montant,0);
    return {mois:MOIS[i],ca,dep,ben:ca-dep};
  });

  // Top produits
  const byProd={};
  factures.forEach(f=>{
    try{
      const lignes=typeof f.lignes==="string"?JSON.parse(f.lignes):f.lignes||[];
      lignes.forEach(l=>{
        if(!l.desc)return;
        if(!byProd[l.desc])byProd[l.desc]={produit:l.desc,qte:0,ca:0,cat:l.cat||""};
        byProd[l.desc].qte+=l.qte||1;
        byProd[l.desc].ca+=(l.qte||1)*(l.pu||0);
      });
    }catch(e){}
  });
  const topProduits=Object.values(byProd).sort((a,b)=>b.ca-a.ca);

  // Imprimer un rapport
  const imprimer=(type)=>{
    const iframe=document.createElement("iframe");
    iframe.style.display="none";
    document.body.appendChild(iframe);
    const doc=iframe.contentDocument;
    const styles=`*{box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:30px;color:#1C1C1E;font-size:13px;}
    h1{font-size:22px;margin-bottom:4px;}h2{font-size:16px;color:#0A84FF;margin:20px 0 10px;border-bottom:2px solid #0A84FF;padding-bottom:6px;}
    h3{font-size:13px;color:#636366;margin:0 0 16px;}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    th{background:#f5f5f7;padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#636366;text-transform:uppercase;}
    td{padding:8px 10px;border-bottom:1px solid #e5e5ea;font-size:12px;}
    .total{font-weight:800;font-size:14px;}.green{color:#1A7A35;}.red{color:#C0392B;}.blue{color:#0A84FF;}
    .kpi{display:inline-block;background:#f5f5f7;border-radius:10px;padding:12px 20px;margin:0 8px 8px 0;min-width:140px;}
    .kpi-label{font-size:11px;color:#636366;margin-bottom:4px;}.kpi-value{font-size:18px;font-weight:800;}
    footer{margin-top:30px;padding-top:10px;border-top:1px solid #e5e5ea;text-align:center;font-size:11px;color:#8E8E93;}`;

    let content="";

    if(type==="financier"){
      content=`<h1>📊 Rapport Financier — Angy Company</h1>
      <h3>Année ${annee} · Généré le ${now.toLocaleDateString("fr-FR")}</h3>
      <div>
        <div class="kpi"><div class="kpi-label">Chiffre d'affaires</div><div class="kpi-value blue">${xof(totalCA)}</div></div>
        <div class="kpi"><div class="kpi-label">Dépenses</div><div class="kpi-value red">${xof(totalDep)}</div></div>
        <div class="kpi"><div class="kpi-label">Bénéfice net</div><div class="kpi-value ${benefice>=0?"green":"red"}">${xof(benefice)}</div></div>
        <div class="kpi"><div class="kpi-label">Taux de marge</div><div class="kpi-value">${marge}%</div></div>
      </div>
      <h2>Résumé mensuel ${annee}</h2>
      <table><thead><tr><th>Mois</th><th>CA</th><th>Dépenses</th><th>Bénéfice</th></tr></thead><tbody>
      ${parMois.map(m=>`<tr><td>${m.mois}</td><td class="blue">${m.ca>0?xof(m.ca):"—"}</td><td class="red">${m.dep>0?xof(m.dep):"—"}</td><td class="${m.ben>=0?"green":"red"}">${m.ca>0||m.dep>0?xof(m.ben):"—"}</td></tr>`).join("")}
      <tr><td class="total">TOTAL</td><td class="total blue">${xof(totalCA)}</td><td class="total red">${xof(totalDep)}</td><td class="total ${benefice>=0?"green":"red"}">${xof(benefice)}</td></tr>
      </tbody></table>`;
    }

    if(type==="stock"){
      const valTotale=stock.reduce((s,p)=>s+p.prix_achat*p.qte,0);
      content=`<h1>📦 Rapport de Stock — Angy Company</h1>
      <h3>Inventaire complet · ${now.toLocaleDateString("fr-FR")} · ${stock.length} produit(s)</h3>
      <div>
        <div class="kpi"><div class="kpi-label">Valeur totale stock</div><div class="kpi-value blue">${xof(valTotale)}</div></div>
        <div class="kpi"><div class="kpi-label">Produits en rupture</div><div class="kpi-value red">${stock.filter(p=>p.qte===0).length}</div></div>
        <div class="kpi"><div class="kpi-label">Produits en alerte</div><div class="kpi-value">${stock.filter(p=>p.qte>0&&p.qte<=p.seuil).length}</div></div>
      </div>
      <h2>Inventaire détaillé</h2>
      <table><thead><tr><th>Produit</th><th>Catégorie</th><th>Qté</th><th>Seuil</th><th>Prix achat</th><th>Prix vente</th><th>Valeur stock</th><th>Statut</th></tr></thead><tbody>
      ${stock.map(p=>{
        const cat=catStk.find(c=>c.id===p.cat)||{label:p.cat||"—"};
        const statut=p.qte===0?"RUPTURE":p.qte<=p.seuil?"ALERTE":"OK";
        const color=p.qte===0?"red":p.qte<=p.seuil?"":"green";
        return `<tr><td><strong>${p.nom}</strong></td><td>${cat.label}</td><td>${p.qte}</td><td>${p.seuil}</td><td>${xof(p.prix_achat)}</td><td>${xof(p.prix_vente)}</td><td>${xof(p.prix_achat*p.qte)}</td><td class="${color}">${statut}</td></tr>`;
      }).join("")}
      <tr><td class="total" colspan="6">TOTAL VALEUR STOCK</td><td class="total blue">${xof(valTotale)}</td><td></td></tr>
      </tbody></table>`;
    }

    if(type==="ventes"){
      content=`<h1>💸 Rapport des Ventes — Angy Company</h1>
      <h3>${factures.length} facture(s) · CA total : ${xof(totalCA)} · ${now.toLocaleDateString("fr-FR")}</h3>
      <h2>Top produits vendus</h2>
      <table><thead><tr><th>Produit</th><th>Qté vendue</th><th>CA généré</th><th>% du CA</th></tr></thead><tbody>
      ${topProduits.map(p=>`<tr><td><strong>${p.produit}</strong></td><td>${p.qte}</td><td class="blue">${xof(p.ca)}</td><td>${totalCA>0?Math.round((p.ca/totalCA)*100):0}%</td></tr>`).join("")}
      </tbody></table>
      <h2>Toutes les factures</h2>
      <table><thead><tr><th>#</th><th>N° Facture</th><th>Client</th><th>Date</th><th>Total</th></tr></thead><tbody>
      ${factures.map((f,i)=>`<tr><td>${i+1}</td><td class="blue">#${f.numero}</td><td>${f.client||"—"}</td><td>${f.date}</td><td class="total blue">${xof(f.total)}</td></tr>`).join("")}
      <tr><td class="total" colspan="4">TOTAL</td><td class="total blue">${xof(totalCA)}</td></tr>
      </tbody></table>`;
    }

    if(type==="depenses"){
      const parCat={};
      depenses.filter(d=>d.statut==="Approuvée").forEach(d=>{
        if(!parCat[d.categorie])parCat[d.categorie]=0;
        parCat[d.categorie]+=d.montant;
      });
      content=`<h1>📤 Rapport des Dépenses — Angy Company</h1>
      <h3>${depenses.filter(d=>d.statut==="Approuvée").length} dépense(s) approuvée(s) · Total : ${xof(totalDep)} · ${now.toLocaleDateString("fr-FR")}</h3>
      <h2>Par catégorie</h2>
      <table><thead><tr><th>Catégorie</th><th>Montant</th><th>% du total</th></tr></thead><tbody>
      ${Object.entries(parCat).sort((a,b)=>b[1]-a[1]).map(([cat,montant])=>`<tr><td>${cat}</td><td class="red">${xof(montant)}</td><td>${totalDep>0?Math.round((montant/totalDep)*100):0}%</td></tr>`).join("")}
      </tbody></table>
      <h2>Liste complète</h2>
      <table><thead><tr><th>#</th><th>Titre</th><th>Catégorie</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead><tbody>
      ${depenses.map((d,i)=>`<tr><td>${i+1}</td><td><strong>${d.titre}</strong></td><td>${d.categorie}</td><td>${d.date}</td><td class="${d.statut==="Approuvée"?"red":""}">${xof(d.montant)}</td><td>${d.statut}</td></tr>`).join("")}
      <tr><td class="total" colspan="4">TOTAL APPROUVÉ</td><td class="total red">${xof(totalDep)}</td><td></td></tr>
      </tbody></table>`;
    }

    doc.write(`<html><head><style>${styles}</style></head><body>${content}<footer>Angy Company · Parcelles Assainies U18, Dakar 🇸🇳 · Rapport officiel · ${now.toLocaleDateString("fr-FR")}</footer></body></html>`);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(()=>document.body.removeChild(iframe),1000);
  };

  return (
    <div>
      <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:"0 0 8px",color:theme.text}}>📋 Rapports</h1>
      <p style={{color:theme.textMuted,fontSize:13,marginBottom:24}}>Cliquez sur un rapport pour l'imprimer ou l'enregistrer en PDF</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {[
          {type:"financier",icon:"📊",title:"Rapport Financier",desc:"CA, dépenses, bénéfices par mois. Vue complète de la santé financière.",color:"#0A84FF",stats:`CA: ${xof(totalCA)} · Bénéfice: ${xof(benefice)}`},
          {type:"stock",icon:"📦",title:"Rapport de Stock",desc:"Inventaire complet avec valeurs, alertes et ruptures.",color:"#FF9F0A",stats:`${stock.length} produits · Valeur: ${xof(stockVal)}`},
          {type:"ventes",icon:"💸",title:"Rapport des Ventes",desc:"Top produits vendus et liste complète des factures.",color:"#30D158",stats:`${factures.length} factures · CA: ${xof(totalCA)}`},
          {type:"depenses",icon:"📤",title:"Rapport des Dépenses",desc:"Dépenses par catégorie et liste complète détaillée.",color:"#FF453A",stats:`${depenses.filter(d=>d.statut==="Approuvée").length} approuvées · ${xof(totalDep)}`},
        ].map(r=>(
          <div key={r.type} style={{background:theme.bgCard,borderRadius:20,padding:"24px",border:`1px solid ${theme.border}`,boxShadow:theme.shadow,cursor:"pointer",transition:"all 0.2s"}}
            onClick={()=>imprimer(r.type)}>
            <div style={{fontSize:40,marginBottom:14}}>{r.icon}</div>
            <div style={{fontSize:17,fontWeight:800,color:theme.text,marginBottom:8}}>{r.title}</div>
            <div style={{fontSize:13,color:theme.textMuted,marginBottom:16,lineHeight:1.5}}>{r.desc}</div>
            <div style={{fontSize:12,color:r.color,fontWeight:600,background:r.color+"15",padding:"6px 12px",borderRadius:8,marginBottom:16}}>{r.stats}</div>
            <button style={{width:"100%",background:r.color,color:"#fff",border:"none",padding:"11px",borderRadius:12,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
              🖨️ Imprimer / PDF
            </button>
          </div>
        ))}
      </div>

      {/* Rapport combiné */}
      <div style={{marginTop:20,background:theme.bgCard,borderRadius:20,padding:"24px",border:`1px solid ${theme.border}`,boxShadow:theme.shadow}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:17,fontWeight:800,color:theme.text,marginBottom:4}}>📋 Rapport Complet Angy Company</div>
            <div style={{fontSize:13,color:theme.textMuted}}>Tous les rapports en un seul document — financier, stock, ventes, dépenses</div>
          </div>
          <button onClick={()=>{["financier","stock","ventes","depenses"].forEach((t,i)=>setTimeout(()=>imprimer(t),i*500));}}
            style={{background:"linear-gradient(135deg,#0A84FF,#BF5AF2)",color:"#fff",border:"none",padding:"12px 24px",borderRadius:12,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit",whiteSpace:"nowrap"}}>
            🖨️ Tout imprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gestion Utilisateurs Angy ────────────────────────────────────────────────
function AngyUtilisateurs({showToast}) {
  const {theme}=useTheme();
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [show,setShow]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({nom:"",prenom:"",email:"",mot_de_passe:"",role:"vendeur",actif:true});

  useEffect(()=>{
    (async()=>{
      try{
        const rows=await dbGet("utilisateurs_angy");
        setUsers(rows||[]);
      }catch(e){showToast("Erreur de chargement",true);}
      setLoading(false);
    })();
  },[]);

  const ROLES=[
    {v:"admin",    l:"👑 Administrateur — Accès total"},
    {v:"vendeur",  l:"🛒 Vendeur — Stock et factures"},
    {v:"comptable",l:"💰 Comptable — Dépenses et bénéfices"},
  ];

  const roleLabel=(r)=>r==="admin"?"👑 Admin":r==="vendeur"?"🛒 Vendeur":"💰 Comptable";
  const roleColor=(r)=>r==="admin"?"#FF9F0A":r==="vendeur"?"#30D158":"#0A84FF";

  const save=async()=>{
    if(!form.nom||!form.email||(!editId&&!form.mot_de_passe))return showToast("Tous les champs requis",true);
    if(users.find(u=>u.email===form.email&&u.id!==editId))return showToast("Email déjà utilisé",true);
    if(editId){
      await dbPatch("utilisateurs_angy",editId,{nom:form.nom,prenom:form.prenom,email:form.email,mot_de_passe:form.mot_de_passe||undefined,role:form.role,actif:form.actif});
      setUsers(users.map(u=>u.id===editId?{...u,...form}:u));
      showToast("Utilisateur modifié ✓");
    } else {
      const rows=await dbAdd("utilisateurs_angy",{nom:form.nom,prenom:form.prenom,email:form.email,mot_de_passe:form.mot_de_passe,role:form.role,actif:true});
      setUsers([...users,rows[0]]);
      showToast("Utilisateur créé ✓");
    }
    setForm({nom:"",prenom:"",email:"",mot_de_passe:"",role:"vendeur",actif:true});
    setEditId(null);setShow(false);
  };

  const startEdit=(u)=>{setForm({nom:u.nom,prenom:u.prenom||"",email:u.email,mot_de_passe:"",role:u.role,actif:u.actif});setEditId(u.id);setShow(true);};

  const toggleActif=async(id,actif)=>{
    await dbPatch("utilisateurs_angy",id,{actif:!actif});
    setUsers(users.map(u=>u.id===id?{...u,actif:!actif}:u));
    showToast(actif?"Compte désactivé":"Compte activé ✓");
  };

  const del=async(id)=>{
    if(users.filter(u=>u.role==="admin").length===1&&users.find(u=>u.id===id)?.role==="admin")
      return showToast("Impossible de supprimer le dernier admin !",true);
    await dbDel("utilisateurs_angy",id);
    setUsers(users.filter(u=>u.id!==id));
    showToast("Supprimé");
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontWeight:800,fontSize:26,letterSpacing:"-0.5px",margin:0,color:theme.text}}>👥 Utilisateurs ({users.length})</h1>
        <button onClick={()=>{setShow(!show);setEditId(null);setForm({nom:"",prenom:"",email:"",mot_de_passe:"",role:"vendeur",actif:true});}}
          style={{background:"#0A84FF",color:"#fff",border:"none",padding:"9px 20px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
          {show?"✕ Annuler":"+ Nouvel utilisateur"}
        </button>
      </div>

      {show&&(
        <div style={{background:theme.bgCard,borderRadius:16,padding:"20px 22px",border:`1px solid ${theme.border}`,boxShadow:theme.shadow,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:14}}>{editId?"✏️ Modifier":"Nouvel utilisateur"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Nom *</label>
              <input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Nom de famille"
                style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Prénom</label>
              <input value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} placeholder="Prénom"
                style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Email *</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@angy.com"
                style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>{editId?"Nouveau mot de passe":"Mot de passe *"}</label>
              <input type="password" value={form.mot_de_passe} onChange={e=>setForm({...form,mot_de_passe:e.target.value})} placeholder="••••••••"
                style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Rôle</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
                style={{background:theme.sel,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"9px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
                {ROLES.map(r=><option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:"#0A84FF",color:"#fff",border:"none",padding:"10px 22px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
              {editId?"💾 Sauvegarder":"Créer le compte"}
            </button>
            {editId&&<button onClick={()=>{setEditId(null);setShow(false);}} style={{background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,padding:"10px 18px",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>Annuler</button>}
          </div>
        </div>
      )}

      {/* Liste utilisateurs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {users.map(u=>(
          <div key={u.id} style={{background:theme.bgCard,borderRadius:16,padding:"18px 20px",border:`1px solid ${u.actif?theme.border:"rgba(255,69,58,0.2)"}`,boxShadow:theme.shadow,opacity:u.actif?1:0.7}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:42,height:42,borderRadius:12,background:roleColor(u.role)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                  {u.role==="admin"?"👑":u.role==="vendeur"?"🛒":"💰"}
                </div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:theme.text}}>{u.prenom} {u.nom}</div>
                  <div style={{fontSize:12,color:theme.textMuted}}>{u.email}</div>
                </div>
              </div>
              <span style={{background:roleColor(u.role)+"22",color:roleColor(u.role),padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>{roleLabel(u.role)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`1px solid ${theme.borderLight}`,marginBottom:10}}>
              <span style={{fontSize:12,color:theme.textMuted}}>Statut</span>
              <span style={{background:u.actif?"#1C3A27":"#3A1C1C",color:u.actif?"#30D158":"#FF453A",padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>{u.actif?"✓ Actif":"✕ Inactif"}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>startEdit(u)} style={{flex:1,background:"rgba(255,159,10,0.12)",border:"1px solid #FF9F0A",color:"#FF9F0A",padding:"7px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>✏️ Modifier</button>
              <button onClick={()=>toggleActif(u.id,u.actif)} style={{flex:1,background:u.actif?"rgba(255,69,58,0.12)":"rgba(48,209,88,0.12)",border:`1px solid ${u.actif?"#FF453A":"#30D158"}`,color:u.actif?"#FF453A":"#30D158",padding:"7px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
                {u.actif?"🔒 Désactiver":"🔓 Activer"}
              </button>
              <button onClick={()=>del(u.id)} style={{background:"none",border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"7px 10px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Session ──────────────────────────────────────────────────────────────────
const ANGY_SESSION = "angy_session";
const loadAngySession = () => { try { return JSON.parse(localStorage.getItem(ANGY_SESSION)||"null"); } catch { return null; } };
const saveAngySession = (u) => localStorage.setItem(ANGY_SESSION, JSON.stringify(u));
const clearAngySession = () => localStorage.removeItem(ANGY_SESSION);

// ─── Login Screen ─────────────────────────────────────────────────────────────
function AngyLogin({onLogin}) {
  const [dark]=useState(()=>window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme=dark?DARK:LIGHT;
  const [email,setEmail]=useState("");
  const [mdp,setMdp]=useState("");
  const [erreur,setErreur]=useState("");
  const [loading,setLoading]=useState(false);

  const login=async()=>{
    setErreur("");setLoading(true);
    try{
      const res=await fetch(`${SUPA_URL}/rest/v1/utilisateurs_angy?email=eq.${encodeURIComponent(email)}&mot_de_passe=eq.${encodeURIComponent(mdp)}&actif=eq.true`,{headers:dbHeaders});
      const rows=await res.json();
      if(rows&&rows.length>0){
        saveAngySession(rows[0]);
        onLogin(rows[0]);
        window.location.reload();
      } else {
        setErreur("Email ou mot de passe incorrect");
      }
    }catch(e){
      // Hors ligne → vérifier dans le cache local
      const cached=loadAngySession();
      if(cached&&cached.email===email&&cached.mot_de_passe===mdp&&cached.actif){
        onLogin(cached);
        window.location.reload();
      } else {
        setErreur("Hors ligne — impossible de vérifier. Reconnectez-vous d'abord avec connexion.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:dark?"#000":"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'SF Pro Display','Segoe UI',sans-serif",padding:20}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <AngyLogoStatic height={60}/>
          <div style={{fontSize:14,color:dark?"#636366":"#8E8E93",marginTop:12}}>Connectez-vous pour accéder au système</div>
        </div>
        <div style={{background:dark?"#1C1C1E":"#FFFFFF",borderRadius:20,padding:28,border:`1px solid ${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}}>
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:13,fontWeight:600,color:dark?"#8E8E93":"#636366"}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="admin@angy.com"
                style={{background:dark?"rgba(255,255,255,0.07)":"#F2F2F7",border:`1px solid ${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"}`,borderRadius:10,padding:"12px 14px",color:dark?"#F2F2F7":"#1C1C1E",fontSize:15,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:13,fontWeight:600,color:dark?"#8E8E93":"#636366"}}>Mot de passe</label>
              <input type="password" value={mdp} onChange={e=>setMdp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••"
                style={{background:dark?"rgba(255,255,255,0.07)":"#F2F2F7",border:`1px solid ${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"}`,borderRadius:10,padding:"12px 14px",color:dark?"#F2F2F7":"#1C1C1E",fontSize:15,outline:"none",fontFamily:"inherit"}}/>
            </div>
          </div>
          {erreur&&<div style={{background:"#3A1C1C",color:"#FF453A",padding:"10px 14px",borderRadius:10,fontSize:13,fontWeight:600,marginBottom:14}}>❌ {erreur}</div>}
          <button onClick={login} style={{width:"100%",background:"#0A84FF",color:"#fff",border:"none",padding:"14px",borderRadius:12,fontWeight:700,cursor:"pointer",fontSize:16,fontFamily:"inherit",opacity:loading?0.7:1}}>
            {loading?"Connexion...":"Se connecter"}
          </button>
          <div style={{textAlign:"center",marginTop:14,fontSize:12,color:dark?"#3A3A3C":"#AEAEB2"}}>
            Par défaut : admin@angy.com / angy2024
          </div>
        </div>
      </div>
    </div>
  );
}

// Logo statique pour le login (sans context)
const AngyLogoStatic = ({height=60}) => (
  <svg height={height} viewBox="0 0 420 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="12" height="65" fill="#1400FF"/>
    <rect x="10" y="73" width="60" height="12" fill="#1400FF"/>
    {[["A",50],["N",90],["G",130],["Y",170]].map(([l,cx])=>(
      <g key={l}>
        <circle cx={cx} cy="50" r="22" fill="white" stroke="#1C1C1E" strokeWidth="3"/>
        <text x={cx} y="57" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="20" fill="#1C1C1E">{l}</text>
      </g>
    ))}
    <text x="207" y="60" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="32" fill="#1C1C1E">Company</text>
    <rect x="408" y="20" width="12" height="38" fill="#CC0000"/>
    <rect x="350" y="20" width="70" height="12" fill="#CC0000"/>
  </svg>
);

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,setDark]=useState(()=>window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [user,setUser]=useState(()=>loadAngySession());
  const [changeMdp,setChangeMdp]=useState(false);
  const [ancienMdp,setAncienMdp]=useState("");
  const [nouveauMdp,setNouveauMdp]=useState("");
  const [confirmMdp,setConfirmMdp]=useState("");
  const [recherche,setRecherche]=useState("");
  const [showRecherche,setShowRecherche]=useState(false);
  const [rechercheFiltre,setRechercheFiltre]=useState("");

  // Suit automatiquement le mode du téléphone/iPad
  useEffect(()=>{
    const mq=window.matchMedia("(prefers-color-scheme: dark)");
    const handler=(e)=>setDark(e.matches);
    mq.addEventListener("change",handler);
    return ()=>mq.removeEventListener("change",handler);
  },[]);

  const theme=dark?DARK:LIGHT;
  const [page,setPage]=useState("dashboard");
  const [depenses,setDepenses]=useState([]);
  const [stock,setStock]=useState([]);
  const [ventes,setVentes]=useState([]);
  const [factures,setFactures]=useState([]);
  const [clients,setClients]=useState([]);
  const [devis,setDevis]=useState([]);
  const [catDep,setCatDep]=useState(DEFAULT_CAT_DEP);
  const [catStk,setCatStk]=useState(DEFAULT_CAT_STK);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState(null);
  const [offline,setOffline]=useState(false);

  const showToast=(msg,err=false)=>{setToast({msg,err});setTimeout(()=>setToast(null),3000);};

  // ─── Chargement données depuis Supabase ──────────────────────────────────────
  useEffect(()=>{
    if(!user) return;
    setLoading(true);
    Promise.all([
      dbGet("depenses"),
      dbGet("stock"),
      dbGet("ventes"),
      dbGet("factures"),
      dbGet("clients"),
      dbGet("devis")
    ]).then(([d,s,v,f,c,dv])=>{
      setDepenses(Array.isArray(d)?d:[]);
      setStock(Array.isArray(s)?s:[]);
      setVentes(Array.isArray(v)?v:[]);
      setFactures(Array.isArray(f)?f:[]);
      setClients(Array.isArray(c)?c:[]);
      setDevis(Array.isArray(dv)?dv:[]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[user]);

  // Afficher login si pas de session
  if(!user) return (
    <ThemeCtx.Provider value={{dark,toggle:()=>setDark(d=>!d),theme}}>
      <AngyLogin onLogin={(u)=>setUser(u)}/>
    </ThemeCtx.Provider>
  );

  const isAdmin=user?.role==="admin";
  const isVendeur=user?.role==="vendeur";
  const isComptable=user?.role==="comptable";

  // Sync au retour de connexion
  useEffect(()=>{
    const handleOnline=async()=>{
      await syncAngyQueue();
      setOffline(false);
      try{
        const [d,s,v,f]=await Promise.all([
          dbGet("depenses"),dbGet("stock"),
          dbGet("ventes"),dbGet("factures").catch(()=>[])
        ]);
        const data={depenses:d||[],stock:s||[],ventes:v||[],factures:f||[]};
        setDepenses(data.depenses);setStock(data.stock);
        setVentes(data.ventes);setFactures(data.factures);
        saveAngyCache(data);
        showToast("Synchronisation terminée ✓");
      }catch(e){}
    };
    const handleOffline=()=>setOffline(true);
    window.addEventListener("online",handleOnline);
    window.addEventListener("offline",handleOffline);
    return ()=>{
      window.removeEventListener("online",handleOnline);
      window.removeEventListener("offline",handleOffline);
    };
  },[]);

  const alertes=stock.filter(p=>p.qte<=p.seuil).length;

  const NAV=[
    {id:"dashboard",  label:"Dashboard",   icon:"◈"},
    ...(isAdmin||isComptable?[{id:"depenses",label:"Dépenses",icon:"📤"}]:[]),
    ...(isAdmin||isVendeur?[{id:"stock",label:"Stock",icon:"📦",badge:alertes}]:[]),
    ...(isAdmin||isVendeur?[{id:"ventes",label:"Ventes",icon:"💸"}]:[]),
    ...(isAdmin||isVendeur||isComptable?[{id:"devis",label:"Devis",icon:"📋"}]:[]),
    ...(isAdmin||isVendeur||isComptable?[{id:"factures",label:"Factures",icon:"🧾"}]:[]),
    ...(isAdmin||isVendeur?[{id:"crm",label:"CRM",icon:"🎯"}]:[]),
    ...(isAdmin||isVendeur?[{id:"catalogue",label:"Catalogue",icon:"💰"}]:[]),
    ...(isAdmin||isComptable?[{id:"benefices",label:"Bénéfices",icon:"📈"}]:[]),
    ...(isAdmin||isComptable?[{id:"rapports",label:"Rapports",icon:"📊"}]:[]),
    ...(isAdmin?[{id:"categories",label:"Catégories",icon:"🏷️"}]:[]),
    ...(isAdmin?[{id:"utilisateurs",label:"Utilisateurs",icon:"👤"}]:[]),
  ];

  return (
    <ThemeCtx.Provider value={{dark,toggle:()=>setDark(d=>!d),theme}}>
      <div style={{minHeight:"100vh",background:theme.bg,color:theme.text,fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",transition:"background 0.25s,color 0.25s"}}>
        <header style={{background:theme.bgHeader,backdropFilter:"blur(20px)",borderBottom:`1px solid ${theme.border}`,position:"sticky",top:0,zIndex:100,boxShadow:theme.shadow,transition:"background 0.25s"}}>
          {/* Bandeau hors ligne */}
          {offline&&(
            <div style={{background:"#3A2F1C",borderBottom:"1px solid #FF9F0A",padding:"6px 20px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:13}}>📵</span>
              <span style={{fontSize:12,color:"#FF9F0A",fontWeight:600}}>
                Mode hors ligne — vous pouvez continuer à travailler.
                {loadAngyQueue().length>0&&` ${loadAngyQueue().length} action(s) en attente.`}
                {" "}Synchronisation automatique dès reconnexion.
              </span>
            </div>
          )}
          {/* Ligne 1 : Logo + Recherche + User + Toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              <AngyLogo height={48}/>
            </div>
            {/* Barre de recherche globale */}
            <div style={{flex:1,maxWidth:420,position:"relative"}}>
              <input value={recherche} onChange={e=>{setRecherche(e.target.value);setShowRecherche(e.target.value.length>1);}}
                onBlur={()=>setTimeout(()=>setShowRecherche(false),200)}
                onFocus={()=>recherche.length>1&&setShowRecherche(true)}
                placeholder="🔍 Rechercher produit, client, facture..."
                style={{width:"100%",background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:12,padding:"9px 16px",color:theme.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              {showRecherche&&(()=>{
                const q=recherche.toLowerCase();
                const results=[
                  ...stock.filter(p=>p.nom?.toLowerCase().includes(q)).map(p=>({type:"📦",titre:p.nom,sub:`${p.qte} unités · ${xof(p.prix_vente)}`,page:"stock"})),
                  ...factures.filter(f=>f.client?.toLowerCase().includes(q)||f.numero?.toLowerCase().includes(q)).map(f=>({type:"🧾",titre:`#${f.numero} — ${f.client}`,sub:`${f.date} · ${xof(f.total)}`,page:"factures"})),
                  ...depenses.filter(d=>d.titre?.toLowerCase().includes(q)).map(d=>({type:"📤",titre:d.titre,sub:`${d.date} · ${xof(d.montant)}`,page:"depenses"})),
                  ...clients.filter(c=>c.nom?.toLowerCase().includes(q)||c.telephone?.includes(q)).map(c=>({type:"👥",titre:c.nom,sub:c.telephone||"",page:"clients"})),
                ].slice(0,7);
                if(results.length===0)return <div style={{position:"absolute",top:"100%",left:0,right:0,background:theme.bgCard,border:`1px solid ${theme.border}`,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",zIndex:999,marginTop:4,padding:"14px 16px",fontSize:13,color:theme.textMuted}}>Aucun résultat</div>;
                return (
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:theme.bgCard,border:`1px solid ${theme.border}`,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",zIndex:999,marginTop:4,overflow:"hidden"}}>
                    {results.map((r,i)=>(
                      <div key={i} onClick={()=>{setPage(r.page);setRechercheFiltre(recherche);setRecherche("");setShowRecherche(false);}}
                        style={{padding:"10px 16px",cursor:"pointer",borderBottom:`1px solid ${theme.borderLight}`,display:"flex",gap:10,alignItems:"center",transition:"background 0.1s"}}>
                        <span style={{fontSize:16}}>{r.type}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:theme.text}}>{r.titre}</div>
                          <div style={{fontSize:11,color:theme.textMuted}}>{r.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:11,color:theme.textMuted}}>📍 Parcelles Assainies U18, Dakar</div>
              <div style={{fontSize:11,color:"#0A84FF",fontWeight:700,background:"rgba(10,132,255,0.12)",padding:"4px 10px",borderRadius:99}}>
                {user?.role==="admin"?"👑":user?.role==="vendeur"?"🛒":"💰"} {user?.prenom} {user?.nom}
              </div>
              <button onClick={()=>setChangeMdp(true)} style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"5px 10px",borderRadius:9,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🔑</button>
              <ThemeToggle/>
              <button onClick={()=>{clearAngySession();window.location.reload();}} style={{background:"rgba(255,69,58,0.12)",border:"1px solid #FF453A",color:"#FF453A",padding:"5px 12px",borderRadius:9,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>🚪</button>
            </div>
          </div>
          {/* Ligne 2 : Navigation */}
          <div style={{display:"flex",gap:4,padding:"0 20px 10px",flexWrap:"wrap"}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>{setPage(n.id);setRechercheFiltre("");}}
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
              {page==="depenses"   &&<Depenses    depenses={depenses} setDepenses={setDepenses} catDep={catDep} stock={stock} setStock={setStock} showToast={showToast} rechercheFiltre={rechercheFiltre}/>}
              {page==="stock"      &&<Stock       stock={stock} setStock={setStock} ventes={ventes} setVentes={setVentes} factures={factures} setFactures={setFactures} depenses={depenses} setDepenses={setDepenses} catStk={catStk} showToast={showToast} setPage={setPage} rechercheFiltre={rechercheFiltre}/>}
              {page==="ventes"     &&<Ventes      ventes={ventes} setVentes={setVentes} factures={factures} catStk={catStk} showToast={showToast}/>}
              {page==="devis"      &&<Devis       devis={devis} setDevis={setDevis} factures={factures} setFactures={setFactures} stock={stock} clients={clients} showToast={showToast}/>}
              {page==="factures"   &&<Factures    factures={factures} setFactures={setFactures} stock={stock} showToast={showToast} clients={clients} rechercheFiltre={rechercheFiltre}/>}
              {page==="clients"    &&<Clients     clients={clients} setClients={setClients} factures={factures} showToast={showToast} rechercheFiltre={rechercheFiltre}/>}
              {page==="crm"        &&<CRM         showToast={showToast}/>}
              {page==="catalogue"  &&<Catalogue   showToast={showToast}/>}
              {page==="benefices"  &&<Benefices   depenses={depenses} ventes={ventes} stock={stock} factures={factures}/>}
              {page==="rapports"   &&<Rapports    depenses={depenses} stock={stock} ventes={ventes} factures={factures} catStk={catStk}/>}
              {page==="categories" &&<Categories  catDep={catDep} setCatDep={setCatDep} catStk={catStk} setCatStk={setCatStk} showToast={showToast}/>}
              {page==="utilisateurs"&&<AngyUtilisateurs showToast={showToast}/>}
            </>
          )}
        </main>

        <footer style={{textAlign:"center",padding:"14px",fontSize:11,color:theme.textFaint,borderTop:`1px solid ${theme.border}`}}>
          Angy Company · Système de gestion interne · Dakar 🇸🇳
        </footer>
        {toast&&<Toast msg={toast.msg} err={toast.err}/>}

        {/* Modal changement mot de passe */}
        {changeMdp&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:theme.bgCard,borderRadius:20,padding:28,width:"100%",maxWidth:400,border:`1px solid ${theme.border}`}}>
              <div style={{fontSize:16,fontWeight:800,color:theme.text,marginBottom:20}}>🔑 Changer mon mot de passe</div>
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Ancien mot de passe</label>
                  <input type="password" value={ancienMdp} onChange={e=>setAncienMdp(e.target.value)} placeholder="••••••••"
                    style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"10px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Nouveau mot de passe</label>
                  <input type="password" value={nouveauMdp} onChange={e=>setNouveauMdp(e.target.value)} placeholder="••••••••"
                    style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"10px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Confirmer</label>
                  <input type="password" value={confirmMdp} onChange={e=>setConfirmMdp(e.target.value)} placeholder="••••••••"
                    style={{background:theme.input,border:`1px solid ${theme.inputBorder}`,borderRadius:9,padding:"10px 13px",color:theme.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={async()=>{
                  if(!ancienMdp||!nouveauMdp||!confirmMdp)return showToast("Tous les champs requis",true);
                  if(ancienMdp!==user.mot_de_passe)return showToast("Ancien mot de passe incorrect",true);
                  if(nouveauMdp!==confirmMdp)return showToast("Les mots de passe ne correspondent pas",true);
                  if(nouveauMdp.length<6)return showToast("Minimum 6 caractères",true);
                  await dbPatch("utilisateurs_angy",user.id,{mot_de_passe:nouveauMdp});
                  const newUser={...user,mot_de_passe:nouveauMdp};
                  setUser(newUser);saveAngySession(newUser);
                  setAncienMdp("");setNouveauMdp("");setConfirmMdp("");
                  setChangeMdp(false);showToast("Mot de passe changé ✓");
                }} style={{flex:1,background:"#0A84FF",color:"#fff",border:"none",padding:"11px",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
                  Confirmer
                </button>
                <button onClick={()=>{setChangeMdp(false);setAncienMdp("");setNouveauMdp("");setConfirmMdp("");}}
                  style={{background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,padding:"11px 18px",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeCtx.Provider>
  );
}

// ─── CRM — SUIVI DES PROSPECTS ───────────────────────────────────────────────
function CRM({showToast}) {
  const {theme} = useContext(ThemeCtx);
  const SURL = "https://nfpnhyvuwpzezwbmxtgd.supabase.co";
  const SKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcG5oeXZ1d3B6ZXp3Ym14dGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODU5NTAsImV4cCI6MjA5NjE2MTk1MH0.u9ptkVSXwgT75m9WgRLsUnygEJGYK4ESyv6jBUeNtO4";
  const H = {"apikey":SKEY,"Authorization":`Bearer ${SKEY}`,"Content-Type":"application/json","Prefer":"return=representation"};

  const STATUTS = ["Nouveau","En discussion","Devis envoyé","Vendu","Perdu"];
  const SOURCES = ["Facebook","TikTok","Instagram","WhatsApp","Bouche à oreille","Site web","Autre"];
  const PRODUITS = ["iPhone","MacBook","iPad","AirPods","Immobilier","Automobile","Autre"];
  const SC = {
    "Nouveau":       {bg:"rgba(10,132,255,0.15)",color:"#0A84FF",border:"rgba(10,132,255,0.3)",icon:"🆕"},
    "En discussion": {bg:"rgba(255,159,10,0.15)",color:"#FF9F0A",border:"rgba(255,159,10,0.3)",icon:"💬"},
    "Devis envoyé":  {bg:"rgba(191,90,242,0.15)",color:"#BF5AF2",border:"rgba(191,90,242,0.3)",icon:"📋"},
    "Vendu":         {bg:"rgba(48,209,88,0.15)", color:"#30D158",border:"rgba(48,209,88,0.3)",icon:"✅"},
    "Perdu":         {bg:"rgba(255,69,58,0.15)", color:"#FF453A",border:"rgba(255,69,58,0.3)",icon:"❌"},
  };
  const PI = {iPhone:"📱",MacBook:"💻",iPad:"📲",AirPods:"🎧",Immobilier:"🏠",Automobile:"🚗",Autre:"📦"};

  const TEMPLATES = [
    {label:"🆕 Premier contact", icon:"👋", msg:(p)=>"Bonjour "+((p&&p.nom)||"[Nom]")+" ! 😊\n\nMerci de nous avoir contacté chez ANGY COMPANY.\n\nJe suis Ange, votre conseiller tech. Quel iPhone vous intéresse ?\n\n📱 Nous avons du stock disponible !\n\nAngy Company — +221 78 116 32 86"},
    {label:"🔔 Relance J+2", icon:"📲", msg:(p)=>"Bonjour "+((p&&p.nom)||"[Nom]")+" ! 😊\n\nJe voulais savoir si vous êtes toujours intéressé par "+((p&&p.produit)||"l'iPhone")+" ?\n\nOn a du stock disponible et les prix sont toujours les mêmes.\n\n📞 +221 78 116 32 86\nAngy Company"},
    {label:"🔥 Relance J+7", icon:"⚡", msg:(p)=>"Bonjour "+((p&&p.nom)||"[Nom]")+" !\n\n🔥 Offre spéciale cette semaine chez ANGY COMPANY !\n\nStock limité — ne ratez pas cette opportunité !\n\n✅ Authentique · 🚚 Livraison Dakar\n💳 Wave · Orange Money · Espèces\n\n📞 +221 78 116 32 86"},
    {label:"💰 Envoi de prix", icon:"📋", msg:(p)=>"Bonjour "+((p&&p.nom)||"[Nom]")+" ! 😊\n\nVoici nos prix actuels :\n\n📱 iPhone 15 → 290 000 F\n📱 iPhone 16 → 380 000 F\n📱 iPhone 17 → 510 000 F\n📱 iPhone 17 Pro Max → 780 000 F\n\n✅ Tous authentiques\n🚚 Livraison Dakar\n\n📞 +221 78 116 32 86"},
    {label:"✅ Confirmation vente", icon:"🎉", msg:(p)=>"Bonjour "+((p&&p.nom)||"[Nom]")+" ! 🎉\n\nMerci pour votre confiance chez ANGY COMPANY !\n\nVotre commande est confirmée ✅\nNous vous contacterons pour la livraison.\n\nBonne utilisation ! 😊\n— Ange, ANGY COMPANY"},
    {label:"🚚 Livraison en cours", icon:"🚚", msg:(p)=>"Bonjour "+((p&&p.nom)||"[Nom]")+" ! 🚚\n\nVotre commande est en route !\nNotre livreur sera chez vous dans les prochaines heures.\n\nRestez disponible svp.\n\nMerci ! 😊 — ANGY COMPANY"},
  ];

  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vue, setVue] = useState("liste");
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({nom:"",telephone:"",ville:"Dakar",produit:"iPhone",budget:"",source:"WhatsApp",statut:"Nouveau",notes:""});
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkParsed, setBulkParsed] = useState([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [quickForm, setQuickForm] = useState({nom:"",telephone:"",produit:"iPhone",source:"WhatsApp"});
  const [showQuick, setShowQuick] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selTemplate, setSelTemplate] = useState(null);

  const parseBulk = (text) => {
    try {
      const lines = text.split("\n").map(l=>l.trim()).filter(l=>l.length>0);
      const parsed = lines.map(line=>{
        const m = line.match(/(\+?221[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|\+?7\d[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|\d{9,12})/);
        const phone = m ? m[0].replace(/[\s\-]/g,"") : "";
        const nom = line.replace(m?m[0]:"","").replace(/[,;:|\-]/g,"").trim()||"Prospect";
        return {nom,telephone:phone,produit:"iPhone",source:"WhatsApp",statut:"Nouveau"};
      }).filter(p=>p.telephone);
      setBulkParsed(parsed);
    } catch { setBulkParsed([]); }
  };

  useEffect(()=>{ charger(); },[]);

  const charger = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${SURL}/rest/v1/prospects?order=created_at.desc`,{headers:H});
      if(r.ok){ const d=await r.json(); setProspects(Array.isArray(d)?d:[]); localStorage.setItem("angy_crm",JSON.stringify(d)); }
    } catch {
      try { const c=localStorage.getItem("angy_crm"); if(c) setProspects(JSON.parse(c)); } catch { setProspects([]); }
    }
    setLoading(false);
  };

  const ajouter = async () => {
    if(!form.nom||!form.telephone) return showToast("Nom et téléphone obligatoires");
    setSaving(true);
    const data={...form,created_at:new Date().toISOString(),historique:JSON.stringify([{date:new Date().toLocaleDateString("fr-FR"),action:"Créé",note:form.notes}])};
    try {
      const r=await fetch(`${SURL}/rest/v1/prospects`,{method:"POST",headers:H,body:JSON.stringify(data)});
      if(r.ok){const [p]=await r.json();setProspects(prev=>[p,...prev]);}
    } catch { setProspects(prev=>[{...data,id:Date.now()},...prev]); }
    setModal(null);
    setForm({nom:"",telephone:"",ville:"Dakar",produit:"iPhone",budget:"",source:"WhatsApp",statut:"Nouveau",notes:""});
    showToast("✅ Prospect ajouté !"); setSaving(false);
  };

  const majStatut = async (id,statut) => {
    try { await fetch(`${SURL}/rest/v1/prospects?id=eq.${id}`,{method:"PATCH",headers:H,body:JSON.stringify({statut})}); } catch {}
    setProspects(p=>p.map(x=>x.id===id?{...x,statut}:x));
    setModal(prev=>prev&&prev.id===id?{...prev,statut}:prev);
    if(statut==="Vendu") showToast("🎉 Vente enregistrée !");
  };

  const ajouterNote = async (prospect) => {
    if(!noteInput.trim()) return;
    const hist=JSON.parse(prospect.historique||"[]");
    hist.push({date:new Date().toLocaleDateString("fr-FR"),action:"Note",note:noteInput});
    const h=JSON.stringify(hist);
    const pr=new Date(); pr.setDate(pr.getDate()+2);
    try { await fetch(`${SURL}/rest/v1/prospects?id=eq.${prospect.id}`,{method:"PATCH",headers:H,body:JSON.stringify({historique:h,prochaine_relance:pr.toISOString()})}); } catch {}
    setProspects(p=>p.map(x=>x.id===prospect.id?{...x,historique:h,prochaine_relance:pr.toISOString()}:x));
    setModal(prev=>({...prev,historique:h,prochaine_relance:pr.toISOString()}));
    setNoteInput(""); showToast("✅ Note ajoutée !");
  };

  const supprimer = async (id) => {
    if(!window.confirm("Supprimer ce prospect ?")) return;
    try { await fetch(`${SURL}/rest/v1/prospects?id=eq.${id}`,{method:"DELETE",headers:H}); } catch {}
    setProspects(p=>p.filter(x=>x.id!==id)); setModal(null); showToast("Supprimé");
  };

  const exportCSV = () => {
    const cols = ["Nom","Téléphone","Ville","Produit","Budget","Source","Statut","Date","Notes"];
    const rows = prospects.map(p=>[p.nom,p.telephone,p.ville,p.produit,p.budget,p.source,p.statut,new Date(p.created_at).toLocaleDateString("fr-FR"),p.notes||""].map(v=>'"'+(v||"").replace(/"/g,'""')+'"').join(","));
    const csv = [cols.join(","),...rows].join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="prospects.csv"; a.click();
    showToast("✅ Export CSV téléchargé !");
  };

  const importerTous = async () => {
    if(bulkParsed.length===0) return showToast("Aucun prospect à importer");
    setBulkImporting(true);
    let count=0;
    for(const p of bulkParsed){
      const data={...p,ville:"Dakar",budget:"",notes:"",created_at:new Date().toISOString(),historique:JSON.stringify([{date:new Date().toLocaleDateString("fr-FR"),action:"Import masse",note:"Importé depuis WhatsApp"}])};
      try{
        const r=await fetch(`${SURL}/rest/v1/prospects`,{method:"POST",headers:H,body:JSON.stringify(data)});
        if(r.ok){const [np]=await r.json();setProspects(prev=>[np,...prev]);count++;}
      }catch{ setProspects(prev=>[{...data,id:Date.now()+count},...prev]);count++; }
      await new Promise(r=>setTimeout(r,100));
    }
    showToast(`✅ ${count} prospects importés !`);
    setBulkImporting(false); setShowBulk(false); setBulkText(""); setBulkParsed([]);
  };

  const relances = prospects.filter(p=>p.prochaine_relance&&new Date(p.prochaine_relance)<=new Date()&&!["Vendu","Perdu"].includes(p.statut));
  const filtres = prospects.filter(p=>{
    const mf=filtre==="tous"||p.statut===filtre||(filtre==="relances"&&relances.find(r=>r.id===p.id));
    const mr=!recherche||p.nom?.toLowerCase().includes(recherche.toLowerCase())||p.telephone?.includes(recherche);
    return mf&&mr;
  });
  const total=prospects.length;
  const vendus=prospects.filter(p=>p.statut==="Vendu").length;
  const tauxConv=total>0?Math.round((vendus/total)*100):0;
  const parSource=SOURCES.reduce((acc,s)=>({...acc,[s]:prospects.filter(p=>p.source===s).length}),{});
  const parProduit=PRODUITS.reduce((acc,p)=>({...acc,[p]:prospects.filter(x=>x.produit===p).length}),{});
  const meilleurSource=Object.entries(parSource).sort((a,b)=>b[1]-a[1])[0];

  const inp={width:"100%",background:theme.toggleBg,border:`1px solid ${theme.border}`,borderRadius:10,padding:"10px 13px",color:theme.text,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const lbl={display:"block",fontSize:12,fontWeight:600,color:theme.textMuted,marginBottom:5};

  return (
    <div style={{padding:"20px 16px",maxWidth:1200,margin:"0 auto"}}>

      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:22,fontWeight:800}}>🎯 CRM — Prospects</div>
          <div style={{fontSize:13,color:theme.textMuted,marginTop:2}}>Suivez chaque prospect jusqu'à la vente</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>setShowTemplates(!showTemplates)} style={{background:showTemplates?"rgba(37,211,102,0.15)":"transparent",color:"#25D366",border:"1px solid rgba(37,211,102,0.3)",padding:"9px 16px",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            💬 Messages WhatsApp
          </button>
          <button onClick={exportCSV} style={{background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,padding:"9px 16px",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            📥 Export CSV
          </button>
          <button onClick={()=>setShowBulk(!showBulk)} style={{background:"rgba(191,90,242,0.15)",color:"#BF5AF2",border:"1px solid rgba(191,90,242,0.3)",padding:"9px 16px",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            📥 Import en masse
          </button>
          <button onClick={()=>setShowQuick(!showQuick)} style={{background:"rgba(10,132,255,0.15)",color:"#0A84FF",border:"1px solid rgba(10,132,255,0.3)",padding:"9px 16px",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            ⚡ Ajout rapide
          </button>
          <button onClick={()=>setModal("add")} style={{background:"#0A84FF",color:"#fff",border:"none",padding:"10px 20px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(10,132,255,0.3)"}}>
            + Nouveau prospect
          </button>
        </div>
      </div>

      {/* AJOUT RAPIDE */}
      {showQuick&&(
        <div style={{background:"rgba(10,132,255,0.08)",border:"1px solid rgba(10,132,255,0.25)",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0A84FF",marginBottom:12}}>⚡ Ajout rapide</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"end"}}>
            <div>
              <label style={lbl}>Nom</label>
              <input style={inp} value={quickForm.nom} onChange={e=>setQuickForm(f=>({...f,nom:e.target.value}))} placeholder="Ex: Mamadou"/>
            </div>
            <div>
              <label style={lbl}>Téléphone</label>
              <input style={inp} value={quickForm.telephone} onChange={e=>setQuickForm(f=>({...f,telephone:e.target.value}))} placeholder="+221 XX XXX XX XX"/>
            </div>
            <div>
              <label style={lbl}>Produit</label>
              <select style={inp} value={quickForm.produit} onChange={e=>setQuickForm(f=>({...f,produit:e.target.value}))}>
                {PRODUITS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={async()=>{
              if(!quickForm.nom||!quickForm.telephone) return showToast("Nom et téléphone obligatoires");
              const data={...quickForm,ville:"Dakar",budget:"",statut:"Nouveau",notes:"",created_at:new Date().toISOString(),historique:JSON.stringify([{date:new Date().toLocaleDateString("fr-FR"),action:"Créé",note:"Ajout rapide"}])};
              try{const r=await fetch(`${SURL}/rest/v1/prospects`,{method:"POST",headers:H,body:JSON.stringify(data)});if(r.ok){const [p]=await r.json();setProspects(prev=>[p,...prev]);}}catch{setProspects(prev=>[{...data,id:Date.now()},...prev]);}
              setQuickForm({nom:"",telephone:"",produit:"iPhone",source:"WhatsApp"});
              setShowQuick(false); showToast("✅ Prospect ajouté !");
            }} style={{padding:"10px 18px",borderRadius:9,background:"#0A84FF",color:"#fff",border:"none",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
              ✅ Ajouter
            </button>
          </div>
        </div>
      )}

      {/* IMPORT EN MASSE */}
      {showBulk&&(
        <div style={{background:"rgba(191,90,242,0.08)",border:"1px solid rgba(191,90,242,0.25)",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#BF5AF2",marginBottom:8}}>📥 Import en masse depuis WhatsApp</div>
          <div style={{fontSize:12,color:theme.textMuted,marginBottom:10}}>Un contact par ligne : Mamadou +221 77 123 45 67</div>
          <textarea value={bulkText} onChange={e=>{setBulkText(e.target.value);parseBulk(e.target.value);}}
            placeholder={"Mamadou Diallo +221 77 123 45 67\nFatou 78 456 78 90\n..."}
            style={{...inp,minHeight:120,resize:"vertical",lineHeight:1.8}}/>
          {bulkParsed.length>0&&(
            <div style={{marginTop:10,fontSize:12,color:"#BF5AF2",fontWeight:700}}>{bulkParsed.length} prospects détectés</div>
          )}
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={importerTous} disabled={bulkImporting||bulkParsed.length===0}
              style={{flex:1,padding:"10px",borderRadius:10,background:bulkParsed.length>0?"#BF5AF2":"rgba(191,90,242,0.3)",color:"#fff",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              {bulkImporting?"⏳ Import...":(`✅ Importer ${bulkParsed.length} prospects`)}
            </button>
            <button onClick={()=>{setShowBulk(false);setBulkText("");setBulkParsed([]);}}
              style={{padding:"10px 20px",borderRadius:10,background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* TEMPLATES WHATSAPP */}
      {showTemplates&&(
        <div style={{background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.25)",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#25D366",marginBottom:12}}>💬 Modèles de messages WhatsApp</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8,marginBottom:selTemplate!==null?12:0}}>
            {TEMPLATES.map((t,i)=>(
              <button key={i} onClick={()=>setSelTemplate(selTemplate===i?null:i)}
                style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${selTemplate===i?"#25D366":theme.border}`,background:selTemplate===i?"rgba(37,211,102,0.1)":theme.toggleBg,color:selTemplate===i?"#25D366":theme.text,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,textAlign:"left"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {selTemplate!==null&&(
            <div style={{background:theme.toggleBg,borderRadius:11,padding:14,border:`1px solid ${theme.border}`}}>
              <div style={{fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",color:theme.text,marginBottom:10}}>{TEMPLATES[selTemplate].msg(null)}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{navigator.clipboard.writeText(TEMPLATES[selTemplate].msg(null));showToast("✅ Copié !");}}
                  style={{padding:"8px 16px",borderRadius:9,background:"#25D366",color:"#fff",border:"none",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>
                  📋 Copier
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(TEMPLATES[selTemplate].msg(null))}`} target="_blank" rel="noreferrer"
                  style={{padding:"8px 16px",borderRadius:9,background:"rgba(37,211,102,0.15)",color:"#25D366",border:"1px solid rgba(37,211,102,0.3)",fontWeight:700,fontSize:12,textDecoration:"none"}}>
                  📲 Ouvrir WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10,marginBottom:18}}>
        {[
          {label:"Total",value:total,color:"#0A84FF",icon:"👥",f:()=>setFiltre("tous")},
          {label:"Nouveaux",value:prospects.filter(p=>p.statut==="Nouveau").length,color:"#0A84FF",icon:"🆕",f:()=>setFiltre("Nouveau")},
          {label:"En cours",value:prospects.filter(p=>["En discussion","Devis envoyé"].includes(p.statut)).length,color:"#FF9F0A",icon:"💬",f:()=>setFiltre("En discussion")},
          {label:"Vendus",value:vendus,color:"#30D158",icon:"✅",f:()=>setFiltre("Vendu")},
          {label:"Conv. %",value:tauxConv+"%",color:"#BF5AF2",icon:"📈",f:()=>setVue("stats")},
          {label:"Relances",value:relances.length,color:"#FF453A",icon:"🔔",f:()=>setFiltre("relances")},
        ].map(s=>(
          <div key={s.label} onClick={s.f} style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:14,padding:"13px 14px",cursor:"pointer"}}>
            <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:theme.textMuted,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ALERTE RELANCES */}
      {relances.length>0&&(
        <div onClick={()=>setFiltre("relances")} style={{background:"rgba(255,69,58,0.1)",border:"1px solid rgba(255,69,58,0.3)",borderRadius:12,padding:"11px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12,cursor:"pointer",flexWrap:"wrap"}}>
          <span style={{fontSize:20}}>🔔</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"#FF453A",fontSize:13}}>{relances.length} relance{relances.length>1?"s":""} à faire !</div>
            <div style={{fontSize:11,color:theme.textMuted}}>{relances.slice(0,3).map(r=>r.nom).join(", ")}</div>
          </div>
        </div>
      )}

      {/* VUES + FILTRES */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4,background:theme.toggleBg,border:`1px solid ${theme.border}`,borderRadius:10,padding:4}}>
          {[["liste","📋 Liste"],["kanban","🗂 Kanban"],["stats","📊 Stats"]].map(([id,l])=>(
            <button key={id} onClick={()=>setVue(id)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:vue===id?"#0A84FF":"transparent",color:vue===id?"#fff":theme.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>
              {l}
            </button>
          ))}
        </div>
        {vue!=="stats"&&(
          <>
            <input value={recherche} onChange={e=>setRecherche(e.target.value)} placeholder="🔍 Rechercher..."
              style={{...inp,width:"auto",flex:1,minWidth:150,padding:"7px 13px"}}/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[["tous","Tous"],["Nouveau","🆕"],["En discussion","💬"],["Devis envoyé","📋"],["Vendu","✅"],["Perdu","❌"],["relances","🔔"]].map(([id,l])=>(
                <button key={id} onClick={()=>setFiltre(id)} style={{padding:"6px 11px",borderRadius:9,border:`1px solid ${filtre===id?"#0A84FF":theme.border}`,background:filtre===id?"rgba(10,132,255,0.15)":"transparent",color:filtre===id?"#0A84FF":theme.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600}}>
                  {l}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* VUE LISTE */}
      {vue==="liste"&&(
        loading?<div style={{textAlign:"center",padding:"3rem",color:theme.textMuted}}>⏳ Chargement...</div>:
        filtres.length===0?<div style={{textAlign:"center",padding:"3rem",color:theme.textMuted}}><div style={{fontSize:48,marginBottom:10}}>🎯</div><div style={{fontWeight:600}}>Aucun prospect</div></div>:
        <div style={{display:"grid",gap:8}}>
          {filtres.map(p=>{
            const sc=SC[p.statut]||SC["Nouveau"];
            const rd=relances.find(r=>r.id===p.id);
            return (
              <div key={p.id} onClick={()=>{setModal(p);setNoteInput("");}}
                style={{background:theme.card,border:`1px solid ${rd?"rgba(255,69,58,0.5)":theme.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0}}>
                  <div style={{width:42,height:42,borderRadius:12,background:sc.bg,border:`1px solid ${sc.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{PI[p.produit]||"📦"}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      {p.nom}
                      {rd&&<span style={{fontSize:10,background:"rgba(255,69,58,0.15)",color:"#FF453A",border:"1px solid rgba(255,69,58,0.3)",borderRadius:99,padding:"2px 7px"}}>🔔 Relance</span>}
                    </div>
                    <div style={{fontSize:12,color:theme.textMuted,marginTop:3,display:"flex",gap:8,flexWrap:"wrap"}}>
                      <span>📞 {p.telephone}</span>
                      {p.ville&&<span>📍 {p.ville}</span>}
                      {p.budget&&<span>💰 {p.budget}</span>}
                      <span>📡 {p.source}</span>
                    </div>
                  </div>
                </div>
                <span style={{fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:99,...sc,flexShrink:0}}>{sc.icon} {p.statut}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* VUE KANBAN */}
      {vue==="kanban"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(160px,1fr))",gap:12,overflowX:"auto"}}>
          {STATUTS.map(statut=>{
            const sc=SC[statut];
            const col=prospects.filter(p=>p.statut===statut&&(!recherche||p.nom?.toLowerCase().includes(recherche.toLowerCase())));
            return (
              <div key={statut}
                onDragOver={e=>{e.preventDefault();setDragOver(statut);}}
                onDragLeave={()=>setDragOver(null)}
                onDrop={e=>{e.preventDefault();const id=Number(e.dataTransfer.getData("pid"));if(id)majStatut(id,statut);setDragOver(null);}}
                style={{background:dragOver===statut?sc.bg:theme.card,border:`2px solid ${dragOver===statut?sc.border:theme.border}`,borderRadius:14,padding:12,minHeight:200}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontWeight:700,fontSize:12,color:sc.color}}>{sc.icon} {statut}</div>
                  <span style={{fontSize:11,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,borderRadius:99,padding:"2px 8px",fontWeight:700}}>{col.length}</span>
                </div>
                {col.map(p=>(
                  <div key={p.id} draggable onDragStart={e=>e.dataTransfer.setData("pid",p.id)}
                    onClick={()=>{setModal(p);setNoteInput("");}}
                    style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,borderRadius:10,padding:"10px 12px",cursor:"grab",marginBottom:7}}>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{p.nom}</div>
                    <div style={{fontSize:11,color:theme.textMuted}}>{p.telephone}</div>
                    <div style={{fontSize:10,marginTop:4,color:sc.color,fontWeight:600}}>{PI[p.produit]} {p.produit}</div>
                  </div>
                ))}
                {col.length===0&&<div style={{textAlign:"center",padding:"16px 8px",color:theme.textMuted,fontSize:11}}>Glissez ici</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* VUE STATS */}
      {vue==="stats"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:theme.textMuted,marginBottom:16,textTransform:"uppercase"}}>Taux de conversion</div>
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:60,fontWeight:900,color:"#30D158"}}>{tauxConv}%</div>
              <div style={{fontSize:13,color:theme.textMuted,marginTop:8}}>{vendus} vendu{vendus>1?"s":""} sur {total} prospect{total>1?"s":""}</div>
            </div>
            <div style={{height:10,background:theme.toggleBg,borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${tauxConv}%`,background:"#30D158",borderRadius:99}}/>
            </div>
          </div>
          <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:theme.textMuted,marginBottom:16,textTransform:"uppercase"}}>Pipeline</div>
            {STATUTS.map(s=>{
              const n=prospects.filter(p=>p.statut===s).length;
              const pct=total>0?Math.round((n/total)*100):0;
              const sc=SC[s];
              return (
                <div key={s} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600,color:sc.color}}>{sc.icon} {s}</span>
                    <span style={{fontSize:12,fontWeight:700}}>{n} ({pct}%)</span>
                  </div>
                  <div style={{height:7,background:theme.toggleBg,borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:sc.color,borderRadius:99}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:theme.textMuted,marginBottom:16,textTransform:"uppercase"}}>Sources</div>
            {Object.entries(parSource).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).map(([s,n])=>{
              const pct=total>0?Math.round((n/total)*100):0;
              return (
                <div key={s} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600}}>{s}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#0A84FF"}}>{n} ({pct}%)</span>
                  </div>
                  <div style={{height:7,background:theme.toggleBg,borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"#0A84FF",borderRadius:99}}/>
                  </div>
                </div>
              );
            })}
            {meilleurSource&&meilleurSource[1]>0&&(
              <div style={{marginTop:10,padding:"10px 12px",background:"rgba(10,132,255,0.1)",border:"1px solid rgba(10,132,255,0.25)",borderRadius:10,fontSize:12,color:"#0A84FF"}}>
                🏆 Meilleure : <strong>{meilleurSource[0]}</strong> ({meilleurSource[1]} prospects)
              </div>
            )}
          </div>
          <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:theme.textMuted,marginBottom:16,textTransform:"uppercase"}}>Produits demandés</div>
            {Object.entries(parProduit).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).map(([p,n])=>{
              const pct=total>0?Math.round((n/total)*100):0;
              return (
                <div key={p} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600}}>{PI[p]} {p}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#BF5AF2"}}>{n} ({pct}%)</span>
                  </div>
                  <div style={{height:7,background:theme.toggleBg,borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"#BF5AF2",borderRadius:99}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL AJOUT */}
      {modal==="add"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
          <div style={{background:theme.card,borderRadius:20,padding:24,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",border:`1px solid ${theme.border}`}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:18}}>+ Nouveau prospect</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Nom complet *</label><input style={inp} value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Mamadou Diallo"/></div>
              <div><label style={lbl}>Téléphone *</label><input style={inp} value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))} placeholder="+221 XX XXX XX XX"/></div>
              <div><label style={lbl}>Ville</label><input style={inp} value={form.ville} onChange={e=>setForm(f=>({...f,ville:e.target.value}))}/></div>
              <div><label style={lbl}>Produit</label><select style={inp} value={form.produit} onChange={e=>setForm(f=>({...f,produit:e.target.value}))}>{PRODUITS.map(p=><option key={p}>{p}</option>)}</select></div>
              <div><label style={lbl}>Budget</label><input style={inp} value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))} placeholder="Ex: 400 000 FCFA"/></div>
              <div><label style={lbl}>Source</label><select style={inp} value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={lbl}>Statut</label><select style={inp} value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>{STATUTS.map(s=><option key={s}>{s}</option>)}</select></div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Notes</label><textarea style={{...inp,resize:"vertical",minHeight:65}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Détails..."/></div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={ajouter} disabled={saving} style={{flex:1,background:"#0A84FF",color:"#fff",border:"none",padding:"12px",borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>{saving?"⏳...":"✅ Enregistrer"}</button>
              <button onClick={()=>setModal(null)} style={{flex:1,background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,padding:"12px",borderRadius:12,fontWeight:600,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAIL */}
      {modal&&modal!=="add"&&(()=>{
        const sc=SC[modal.statut]||SC["Nouveau"];
        const hist=JSON.parse(modal.historique||"[]");
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
            <div style={{background:theme.card,borderRadius:20,padding:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",border:`1px solid ${theme.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontWeight:800,fontSize:20}}>{modal.nom}</div>
                  <div style={{fontSize:13,color:theme.textMuted,marginTop:3}}>📞 {modal.telephone} · 📍 {modal.ville}</div>
                </div>
                <button onClick={()=>setModal(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:theme.textMuted}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[["Produit",`${PI[modal.produit]||"📦"} ${modal.produit}`],["Budget",modal.budget||"—"],["Source",modal.source],["Ajouté",new Date(modal.created_at).toLocaleDateString("fr-FR")]].map(([k,v])=>(
                  <div key={k} style={{background:theme.toggleBg,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:theme.textMuted}}>{k}</div>
                    <div style={{fontWeight:700,fontSize:13,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:theme.textMuted,marginBottom:8,textTransform:"uppercase"}}>Statut</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {STATUTS.map(s=>{const c=SC[s];return(
                    <button key={s} onClick={()=>majStatut(modal.id,s)} style={{padding:"6px 12px",borderRadius:99,border:`1px solid ${modal.statut===s?c.border:theme.border}`,background:modal.statut===s?c.bg:"transparent",color:modal.statut===s?c.color:theme.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>
                      {c.icon} {s}
                    </button>
                  );})}
                </div>
              </div>
              <div style={{marginBottom:14,background:"rgba(10,132,255,0.08)",border:"1px solid rgba(10,132,255,0.2)",borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#0A84FF",marginBottom:8,textTransform:"uppercase"}}>🔔 Programmer une relance</div>
                <div style={{display:"flex",gap:8}}>
                  {[2,7,30].map(j=>(
                    <button key={j} onClick={()=>{
                      const d=new Date();d.setDate(d.getDate()+j);
                      fetch(`${SURL}/rest/v1/prospects?id=eq.${modal.id}`,{method:"PATCH",headers:H,body:JSON.stringify({prochaine_relance:d.toISOString()})}).catch(()=>{});
                      setProspects(p=>p.map(x=>x.id===modal.id?{...x,prochaine_relance:d.toISOString()}:x));
                      setModal(prev=>({...prev,prochaine_relance:d.toISOString()}));
                      showToast(`🔔 Relance J+${j} programmée !`);
                    }} style={{flex:1,padding:"8px",borderRadius:9,background:"rgba(10,132,255,0.1)",border:"1px solid rgba(10,132,255,0.25)",color:"#0A84FF",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>
                      J+{j}
                    </button>
                  ))}
                </div>
                {modal.prochaine_relance&&<div style={{fontSize:11,color:theme.textMuted,marginTop:6}}>📅 Prochaine : {new Date(modal.prochaine_relance).toLocaleDateString("fr-FR")}</div>}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:theme.textMuted,marginBottom:8,textTransform:"uppercase"}}>Ajouter une note</div>
                <div style={{display:"flex",gap:8}}>
                  <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Ex: Client intéressé, attend son salaire..."
                    style={{...inp,flex:1}} onKeyDown={e=>e.key==="Enter"&&ajouterNote(modal)}/>
                  <button onClick={()=>ajouterNote(modal)} style={{background:"#0A84FF",color:"#fff",border:"none",padding:"10px 14px",borderRadius:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>+</button>
                </div>
              </div>
              {hist.length>0&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:theme.textMuted,marginBottom:8,textTransform:"uppercase"}}>Historique</div>
                  {[...hist].reverse().map((h,i)=>(
                    <div key={i} style={{background:theme.toggleBg,borderRadius:9,padding:"8px 12px",marginBottom:5,display:"flex",gap:10}}>
                      <div style={{fontSize:10,color:theme.textMuted,flexShrink:0}}>{h.date}</div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#0A84FF"}}>{h.action}</div>
                        {h.note&&<div style={{fontSize:12,color:theme.text,marginTop:1}}>{h.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Messages WhatsApp rapides */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:theme.textMuted,marginBottom:8,textTransform:"uppercase"}}>📲 Messages rapides WhatsApp</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {TEMPLATES.map((t,i)=>(
                    <button key={i} onClick={()=>{
                      const url=`https://wa.me/${modal.telephone?.replace(/[\s+]/g,"")}?text=${encodeURIComponent(t.msg(modal))}`;
                      window.open(url,"_blank");
                    }} style={{padding:"9px 12px",borderRadius:10,background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.2)",color:"#25D366",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,textAlign:"left"}}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <a href={`https://wa.me/${modal.telephone?.replace(/[\s+]/g,"")}`} target="_blank" rel="noreferrer"
                  style={{display:"block",textAlign:"center",background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.3)",color:"#25D366",padding:"11px",borderRadius:12,fontWeight:700,fontSize:14,textDecoration:"none"}}>
                  💬 WhatsApp
                </a>
                <button onClick={()=>supprimer(modal.id)} style={{background:"rgba(255,69,58,0.1)",border:"1px solid rgba(255,69,58,0.3)",color:"#FF453A",padding:"11px",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                  🗑 Supprimer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


// ─── CATALOGUE DES PRIX ────────────────────────────────────────────────────────
function Catalogue({showToast}) {
  const {theme} = useContext(ThemeCtx);

  const PRIX_DEFAUT = [
    {id:1, modele:"iPhone XR",          categorie:"iPhone",  prix:[{stockage:"64Go",prix:90000},{stockage:"128Go",prix:100000},{stockage:"256Go",prix:120000}]},
    {id:2, modele:"iPhone 11",           categorie:"iPhone",  prix:[{stockage:"64Go",prix:115000},{stockage:"128Go",prix:120000},{stockage:"256Go",prix:130000}]},
    {id:3, modele:"iPhone 11 Pro",       categorie:"iPhone",  prix:[{stockage:"64Go",prix:150000},{stockage:"256Go",prix:165000},{stockage:"512Go",prix:170000}]},
    {id:4, modele:"iPhone 11 Pro Max",   categorie:"iPhone",  prix:[{stockage:"64Go",prix:165000},{stockage:"256Go",prix:175000},{stockage:"512Go",prix:190000}]},
    {id:5, modele:"iPhone 12",           categorie:"iPhone",  prix:[{stockage:"64Go",prix:140000},{stockage:"128Go",prix:160000},{stockage:"256Go",prix:180000}]},
    {id:6, modele:"iPhone 12 Pro",       categorie:"iPhone",  prix:[{stockage:"128Go",prix:185000},{stockage:"256Go",prix:195000}]},
    {id:7, modele:"iPhone 12 Pro Max",   categorie:"iPhone",  prix:[{stockage:"128Go",prix:230000},{stockage:"256Go",prix:250000}]},
    {id:8, modele:"iPhone 13",           categorie:"iPhone",  prix:[{stockage:"128Go",prix:190000},{stockage:"256Go",prix:210000}]},
    {id:9, modele:"iPhone 13 Pro",       categorie:"iPhone",  prix:[{stockage:"128Go",prix:240000},{stockage:"256Go",prix:260000}]},
    {id:10,modele:"iPhone 13 Pro Max",   categorie:"iPhone",  prix:[{stockage:"128Go",prix:290000},{stockage:"256Go",prix:310000},{stockage:"512Go",prix:340000},{stockage:"1To",prix:360000}]},
    {id:11,modele:"iPhone 14",           categorie:"iPhone",  prix:[{stockage:"128Go",prix:250000},{stockage:"256Go",prix:260000}]},
    {id:12,modele:"iPhone 14 Pro",       categorie:"iPhone",  prix:[{stockage:"128Go",prix:290000},{stockage:"256Go",prix:310000}]},
    {id:13,modele:"iPhone 14 Pro Max",   categorie:"iPhone",  prix:[{stockage:"128Go",prix:370000},{stockage:"256Go",prix:390000},{stockage:"512Go",prix:410000}]},
    {id:14,modele:"iPhone 15",           categorie:"iPhone",  prix:[{stockage:"128Go",prix:290000},{stockage:"256Go",prix:310000}]},
    {id:15,modele:"iPhone 15 Pro",       categorie:"iPhone",  prix:[{stockage:"128Go",prix:370000},{stockage:"256Go",prix:390000}]},
    {id:16,modele:"iPhone 15 Pro Max",   categorie:"iPhone",  prix:[{stockage:"256Go",prix:430000},{stockage:"512Go",prix:450000}]},
    {id:17,modele:"iPhone 16",           categorie:"iPhone",  prix:[{stockage:"128Go",prix:380000},{stockage:"256Go",prix:400000}]},
    {id:18,modele:"iPhone 16 Pro",       categorie:"iPhone",  prix:[{stockage:"256Go",prix:450000},{stockage:"512Go",prix:470000},{stockage:"1To",prix:490000}]},
    {id:19,modele:"iPhone 16 Pro Max",   categorie:"iPhone",  prix:[{stockage:"256Go",prix:540000},{stockage:"512Go",prix:560000},{stockage:"1To",prix:580000}]},
    {id:20,modele:"iPhone 17",           categorie:"iPhone",  prix:[{stockage:"256Go",prix:510000},{stockage:"512Go",prix:550000}]},
    {id:21,modele:"iPhone 17 Air",       categorie:"iPhone",  prix:[{stockage:"256Go",prix:590000}]},
    {id:22,modele:"iPhone 17 Pro",       categorie:"iPhone",  prix:[{stockage:"256Go",prix:660000},{stockage:"512Go",prix:690000},{stockage:"1To",prix:720000}]},
    {id:23,modele:"iPhone 17 Pro Max",   categorie:"iPhone",  prix:[{stockage:"256Go",prix:780000},{stockage:"512Go",prix:830000},{stockage:"1To",prix:870000}]},
  ];

  const [catalogue, setCatalogue] = useState(()=>{
    const saved = localStorage.getItem("angy_catalogue");
    return saved ? JSON.parse(saved) : PRIX_DEFAUT;
  });
  const [editing, setEditing] = useState(null); // {id, stockageIdx}
  const [editVal, setEditVal] = useState("");
  const [recherche, setRecherche] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newModele, setNewModele] = useState({modele:"",categorie:"iPhone",stockage:"128Go",prix:""});

  const sauvegarder = (newCat) => {
    setCatalogue(newCat);
    localStorage.setItem("angy_catalogue", JSON.stringify(newCat));
    showToast("✅ Prix mis à jour !");
  };

  const modifierPrix = (id, stockageIdx, nouvPrix) => {
    const newCat = catalogue.map(p => {
      if(p.id !== id) return p;
      const newPrix = [...p.prix];
      newPrix[stockageIdx] = {...newPrix[stockageIdx], prix: Number(nouvPrix)};
      return {...p, prix: newPrix};
    });
    sauvegarder(newCat);
    setEditing(null);
  };

  const ajouterModele = () => {
    if(!newModele.modele||!newModele.prix) return showToast("Modèle et prix obligatoires");
    const newProd = {
      id: Date.now(),
      modele: newModele.modele,
      categorie: newModele.categorie,
      prix: [{stockage: newModele.stockage, prix: Number(newModele.prix)}]
    };
    sauvegarder([...catalogue, newProd]);
    setNewModele({modele:"",categorie:"iPhone",stockage:"128Go",prix:""});
    setShowAdd(false);
  };

  const supprimerModele = (id) => {
    if(!window.confirm("Supprimer ce modèle ?")) return;
    sauvegarder(catalogue.filter(p=>p.id!==id));
  };

  const copierListePrix = () => {
    const txt = catalogue
      .filter(p=>p.modele.toLowerCase().includes(recherche.toLowerCase())||!recherche)
      .map(p=>`${p.modele}\n${p.prix.map(px=>`  • ${px.stockage} → ${px.prix.toLocaleString("fr-FR")} FCFA`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText(txt);
    showToast("✅ Liste des prix copiée !");
  };

  const filtres = catalogue.filter(p=>p.modele.toLowerCase().includes(recherche.toLowerCase())||!recherche);

  const inp = {background:theme.toggleBg,border:`1px solid ${theme.border}`,borderRadius:8,padding:"6px 10px",color:theme.text,fontSize:13,fontFamily:"inherit",outline:"none"};

  return (
    <div style={{padding:"20px 16px",maxWidth:1100,margin:"0 auto"}}>
      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:22,fontWeight:800}}>💰 Catalogue des prix</div>
          <div style={{fontSize:13,color:theme.textMuted,marginTop:2}}>Modifiez vos prix directement — synchronisé partout</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={copierListePrix} style={{background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,padding:"9px 16px",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            📋 Copier tous les prix
          </button>
          <button onClick={()=>sauvegarder(PRIX_DEFAUT)} style={{background:theme.toggleBg,color:theme.textMuted,border:`1px solid ${theme.border}`,padding:"9px 16px",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            🔄 Réinitialiser
          </button>
          <button onClick={()=>setShowAdd(!showAdd)} style={{background:"#0A84FF",color:"#fff",border:"none",padding:"10px 20px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
            + Ajouter modèle
          </button>
        </div>
      </div>

      {/* AJOUTER MODELE */}
      {showAdd&&(
        <div style={{background:`rgba(10,132,255,0.08)`,border:`1px solid rgba(10,132,255,0.25)`,borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0A84FF",marginBottom:12}}>+ Nouveau modèle</div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:10,alignItems:"end"}}>
            <div>
              <label style={{display:"block",fontSize:11,color:theme.textMuted,marginBottom:4,fontWeight:600}}>Nom du modèle</label>
              <input style={{...inp,width:"100%",boxSizing:"border-box"}} value={newModele.modele} onChange={e=>setNewModele(f=>({...f,modele:e.target.value}))} placeholder="Ex: iPhone 18"/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,color:theme.textMuted,marginBottom:4,fontWeight:600}}>Catégorie</label>
              <select style={{...inp,width:"100%"}} value={newModele.categorie} onChange={e=>setNewModele(f=>({...f,categorie:e.target.value}))}>
                {["iPhone","MacBook","iPad","AirPods","Autre"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,color:theme.textMuted,marginBottom:4,fontWeight:600}}>Stockage</label>
              <input style={{...inp,width:"100%",boxSizing:"border-box"}} value={newModele.stockage} onChange={e=>setNewModele(f=>({...f,stockage:e.target.value}))} placeholder="128Go"/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,color:theme.textMuted,marginBottom:4,fontWeight:600}}>Prix (FCFA)</label>
              <input type="number" style={{...inp,width:"100%",boxSizing:"border-box"}} value={newModele.prix} onChange={e=>setNewModele(f=>({...f,prix:e.target.value}))} placeholder="300000"/>
            </div>
            <button onClick={ajouterModele} style={{padding:"8px 16px",borderRadius:9,background:"#0A84FF",color:"#fff",border:"none",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
              ✅ Ajouter
            </button>
          </div>
        </div>
      )}

      {/* RECHERCHE */}
      <div style={{marginBottom:16}}>
        <input value={recherche} onChange={e=>setRecherche(e.target.value)} placeholder="🔍 Rechercher un modèle..."
          style={{...inp,width:"100%",boxSizing:"border-box",padding:"10px 14px",fontSize:14}}/>
      </div>

      {/* INFO */}
      <div style={{background:`rgba(255,159,10,0.1)`,border:`1px solid rgba(255,159,10,0.25)`,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#FF9F0A"}}>
        💡 <strong>Comment modifier un prix :</strong> Appuyez sur le prix → tapez le nouveau montant → Entrée ou ✅
      </div>

      {/* LISTE */}
      <div style={{display:"grid",gap:10}}>
        {filtres.map(p=>(
          <div key={p.id} style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:14,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:15}}>📱 {p.modele}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,color:theme.textMuted,background:theme.toggleBg,padding:"3px 9px",borderRadius:99,border:`1px solid ${theme.border}`}}>{p.categorie}</span>
                <button onClick={()=>supprimerModele(p.id)} style={{background:"none",border:"none",color:theme.textMuted,cursor:"pointer",fontSize:16,padding:"2px 6px"}}>🗑</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {p.prix.map((px,i)=>(
                <div key={i} style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,borderRadius:10,padding:"8px 12px",minWidth:120}}>
                  <div style={{fontSize:11,color:theme.textMuted,marginBottom:4,fontWeight:600}}>{px.stockage}</div>
                  {editing?.id===p.id&&editing?.idx===i ? (
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      <input type="number" autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter")modifierPrix(p.id,i,editVal);if(e.key==="Escape")setEditing(null);}}
                        style={{...inp,width:80,padding:"4px 8px",fontSize:13}}/>
                      <button onClick={()=>modifierPrix(p.id,i,editVal)} style={{background:"#30D158",color:"#fff",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,fontWeight:700}}>✅</button>
                    </div>
                  ):(
                    <div onClick={()=>{setEditing({id:p.id,idx:i});setEditVal(String(px.prix));}}
                      style={{fontSize:15,fontWeight:800,color:"#30D158",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                      {px.prix.toLocaleString("fr-FR")} F
                      <span style={{fontSize:11,color:theme.textMuted}}>✏️</span>
                    </div>
                  )}
                </div>
              ))}
              {/* Ajouter une variante */}
              <div style={{background:`rgba(10,132,255,0.05)`,border:`1px dashed rgba(10,132,255,0.3)`,borderRadius:10,padding:"8px 12px",minWidth:100,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
                onClick={()=>{
                  const stockage = prompt("Stockage (ex: 512Go):");
                  const prix = prompt("Prix en FCFA:");
                  if(!stockage||!prix) return;
                  const newCat = catalogue.map(prod=>prod.id===p.id?{...prod,prix:[...prod.prix,{stockage,prix:Number(prix)}]}:prod);
                  sauvegarder(newCat);
                }}>
                <span style={{fontSize:11,color:"#0A84FF",fontWeight:600}}>+ Variante</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
