import { useState, useEffect, useContext, createContext, useRef } from "react";

// ─── CONFIG SUPABASE ──────────────────────────────────────────────────────────
const SURL = "https://nfpnhyvuwpzezwbmxtgd.supabase.co";
const SKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcG5oeXZ1d3B6ZXp3Ym14dGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODU5NTAsImV4cCI6MjA5NjE2MTk1MH0.u9ptkVSXwgT75m9WgRLsUnygEJGYK4ESyv6jBUeNtO4";
const H = { "apikey": SKEY, "Authorization": `Bearer ${SKEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };

// ─── OFFLINE QUEUE ───────────────────────────────────────────────────────────
const QUEUE_KEY = "angy_offline_queue";
const getQueue = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; } };
const saveQueue = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
const addToQueue = (op) => { const q = getQueue(); q.push({...op, _id: Date.now()}); saveQueue(q); };

// ─── LOCAL CACHE ─────────────────────────────────────────────────────────────
const getLocal = (t) => { try { return JSON.parse(localStorage.getItem("angy_cache_"+t)) || []; } catch { return []; } };
const saveLocal = (t, data) => localStorage.setItem("angy_cache_"+t, JSON.stringify(data));

// ─── SYNC QUEUE WITH SUPABASE ────────────────────────────────────────────────
const syncQueue = async () => {
  const q = getQueue();
  if (!q.length) return;
  const remaining = [];
  for (const op of q) {
    try {
      if (op.type === "add") {
        const r = await fetch(`${SURL}/rest/v1/${op.table}`, { method: "POST", headers: H, body: JSON.stringify(op.data) });
        if (!r.ok) { remaining.push(op); }
      } else if (op.type === "del") {
        await fetch(`${SURL}/rest/v1/${op.table}?id=eq.${op.id}`, { method: "DELETE", headers: H });
      } else if (op.type === "patch") {
        await fetch(`${SURL}/rest/v1/${op.table}?id=eq.${op.id}`, { method: "PATCH", headers: H, body: JSON.stringify(op.data) });
      }
    } catch { remaining.push(op); }
  }
  saveQueue(remaining);
  return remaining.length === 0;
};

const db = {
  get: async (t) => {
    try {
      const r = await fetch(`${SURL}/rest/v1/${t}?order=created_at.desc&limit=500`, { headers: H });
      if (r.ok) { const data = await r.json(); saveLocal(t, data); return data; }
    } catch {}
    // Offline: return cached data
    return getLocal(t);
  },
  add: async (t, d) => {
    try {
      const r = await fetch(`${SURL}/rest/v1/${t}`, { method: "POST", headers: H, body: JSON.stringify(d) });
      if (r.ok) {
        const j = await r.json();
        const item = Array.isArray(j) ? j[0] : j;
        // Update local cache
        const cached = getLocal(t);
        saveLocal(t, [item, ...cached]);
        return item;
      }
    } catch {}
    // Offline: save to queue and return temp item
    const tempItem = { ...d, id: "temp_"+Date.now(), _offline: true };
    addToQueue({ type: "add", table: t, data: d });
    const cached = getLocal(t);
    saveLocal(t, [tempItem, ...cached]);
    return tempItem;
  },
  del: async (t, id) => {
    try { await fetch(`${SURL}/rest/v1/${t}?id=eq.${id}`, { method: "DELETE", headers: H }); }
    catch { addToQueue({ type: "del", table: t, id }); }
    const cached = getLocal(t);
    saveLocal(t, cached.filter(x => x.id !== id));
  },
  patch: async (t, id, d) => {
    try { await fetch(`${SURL}/rest/v1/${t}?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(d) }); }
    catch { addToQueue({ type: "patch", table: t, id, data: d }); }
    const cached = getLocal(t);
    saveLocal(t, cached.map(x => x.id === id ? {...x, ...d} : x));
  },
};

// ─── THEME ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext();
const LIGHT = { bg:"#F2F2F7", card:"#FFFFFF", text:"#1C1C1E", textMuted:"#8E8E93", border:"#E5E5EA", toggleBg:"#F2F2F7", nav:"#FFFFFF", input:"#FFFFFF" };
const DARK  = { bg:"#1C1C1E", card:"#2C2C2E", text:"#FFFFFF", textMuted:"#8E8E93", border:"#3A3A3C", toggleBg:"#3A3A3C", nav:"#2C2C2E", input:"#3A3A3C" };

// ─── LOGO ─────────────────────────────────────────────────────────────────────
const Logo = ({ size=40 }) => {
  const { dark } = useContext(ThemeCtx);
  const tc = dark ? "#fff" : "#1C1C1E";
  const scale = size / 100;
  const W = Math.round(420 * scale);
  return (
    <svg height={size} width={W} viewBox="0 0 420 100" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1400FF"/><stop offset="100%" stopColor="#0066FF"/></linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#CC0000"/><stop offset="100%" stopColor="#FF2200"/></linearGradient>
      </defs>
      <rect x="10" y="15" width="12" height="70" rx="3" fill="url(#lg1)"/>
      <rect x="10" y="73" width="58" height="12" rx="3" fill="url(#lg1)"/>
      <rect x="398" y="15" width="12" height="52" rx="3" fill="url(#lg2)"/>
      <rect x="350" y="15" width="60" height="12" rx="3" fill="url(#lg2)"/>
      {[["A",50],["N",90],["G",130],["Y",170]].map(([l,cx])=>(
        <g key={l}><circle cx={cx} cy="50" r="22" fill={dark?"#2C2C2E":"white"} stroke={tc} strokeWidth="2.5"/><text x={cx} y="57" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="20" fill={tc}>{l}</text></g>
      ))}
      <text x="208" y="60" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="32" fill={tc}>Company</text>
    </svg>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, err }) => (
  <div style={{ position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background:err?"#FF453A":"#30D158", color:"#fff", padding:"12px 24px", borderRadius:99, fontWeight:700, fontSize:14, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", whiteSpace:"nowrap" }}>{msg}</div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const USERS = [
  { id:1, nom:"Ange Admin",  email:"admin@angy.com",      mdp:"angy2024",    role:"admin" },
  { id:2, nom:"Vendeur",     email:"vendeur@angy.com",    mdp:"vendeur2024", role:"vendeur" },
  { id:3, nom:"Comptable",   email:"comptable@angy.com",  mdp:"compta2024",  role:"comptable" }
];
const Login = ({ onLogin }) => {
  const { theme } = useContext(ThemeCtx);
  const [email,setEmail] = useState(""); const [mdp,setMdp] = useState(""); const [err,setErr] = useState("");
  const connect = () => { const u=USERS.find(u=>u.email===email.trim()&&u.mdp===mdp); if(u){localStorage.setItem("angy_user",JSON.stringify(u));onLogin(u);}else setErr("Email ou mot de passe incorrect"); };
  const s = { width:"100%", boxSizing:"border-box", padding:"12px 14px", borderRadius:12, border:`1px solid ${theme.border}`, background:theme.input, color:theme.text, fontSize:15, fontFamily:"inherit", outline:"none" };
  return (
    <div style={{ minHeight:"100vh", background:theme.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:theme.card, borderRadius:24, padding:36, width:"100%", maxWidth:400, border:`1px solid ${theme.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}><Logo size={44}/></div>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:6, color:theme.text }}>Connexion</div>
        <div style={{ fontSize:13, color:theme.textMuted, marginBottom:24 }}>Accédez à votre espace de gestion</div>
        {err&&<div style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", color:"#FF453A", padding:"10px 14px", borderRadius:10, marginBottom:14, fontSize:13 }}>{err}</div>}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{...s, marginBottom:12}}/>
        <input value={mdp} onChange={e=>setMdp(e.target.value)} placeholder="Mot de passe" type="password" onKeyDown={e=>e.key==="Enter"&&connect()} style={{...s, marginBottom:20}}/>
        <button onClick={connect} style={{ width:"100%", padding:"13px", borderRadius:12, background:"#0A84FF", color:"#fff", border:"none", fontWeight:700, fontSize:16, cursor:"pointer", fontFamily:"inherit" }}>Se connecter</button>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ stock, ventes, factures, depenses }) => {
  const { theme, dark } = useContext(ThemeCtx);
  const ca = ventes.reduce((s,v)=>s+Number(v.prix_vente)*Number(v.qte||1),0);
  const dep = depenses.reduce((s,d)=>s+Number(d.montant),0);
  const benefice = ca - dep;
  const marge = ca>0?Math.round((benefice/ca)*100):0;
  const stockBas = stock.filter(p=>Number(p.qte)<=Number(p.seuil||3));
  const today = new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});

  // CA mensuel
  const moisCA = {};
  ventes.forEach(v=>{ const m=v.date?v.date.slice(0,7):new Date(v.created_at).toISOString().slice(0,7); moisCA[m]=(moisCA[m]||0)+Number(v.prix_vente)*Number(v.qte||1); });
  const moisList = Object.entries(moisCA).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);
  const maxCA = Math.max(...moisList.map(([,v])=>v),1);
  const dernierMois = moisList[moisList.length-1];
  const avantDernier = moisList[moisList.length-2];
  const evol = avantDernier?Math.round(((dernierMois?.[1]||0)-(avantDernier?.[1]||0))/(avantDernier?.[1]||1)*100):0;

  // Top produits
  const parProduit = {};
  ventes.forEach(v=>{ if(!parProduit[v.produit])parProduit[v.produit]={qte:0,ca:0}; parProduit[v.produit].qte+=Number(v.qte||1); parProduit[v.produit].ca+=Number(v.prix_vente)*Number(v.qte||1); });
  const topProduits = Object.entries(parProduit).sort((a,b)=>b[1].ca-a[1].ca).slice(0,4);

  // Dernières ventes
  const dernieresVentes = [...ventes].slice(0,5);

  const MOIS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  return (
    <div style={{padding:"20px 16px",maxWidth:1200,margin:"0 auto"}}>

      {/* HEADER DASHBOARD */}
      <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:26,fontWeight:900,color:theme.text}}>Bonjour Ange 👋</div>
          <div style={{fontSize:13,color:theme.textMuted,marginTop:4,textTransform:"capitalize"}}>{today}</div>
        </div>
        {evol!==0&&(
          <div style={{background:evol>=0?"rgba(48,209,88,0.12)":"rgba(255,69,58,0.12)",border:`1px solid ${evol>=0?"rgba(48,209,88,0.3)":"rgba(255,69,58,0.3)"}`,borderRadius:12,padding:"10px 16px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>{evol>=0?"📈":"📉"}</span>
            <div>
              <div style={{fontSize:11,color:theme.textMuted}}>vs mois dernier</div>
              <div style={{fontWeight:800,color:evol>=0?"#30D158":"#FF453A",fontSize:16}}>{evol>=0?"+":""}{evol}%</div>
            </div>
          </div>
        )}
      </div>

      {/* CARTES PRINCIPALES — ligne 1 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
        {/* CA */}
        <div style={{background:"linear-gradient(135deg,#1400FF,#0066FF)",borderRadius:20,padding:"20px 18px",color:"#fff",gridColumn:"span 1",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,background:"rgba(255,255,255,0.08)",borderRadius:"50%"}}/>
          <div style={{position:"absolute",right:20,bottom:-30,width:80,height:80,background:"rgba(255,255,255,0.06)",borderRadius:"50%"}}/>
          <div style={{fontSize:13,fontWeight:600,opacity:0.85,marginBottom:8}}>💰 Chiffre d'affaires</div>
          <div style={{fontSize:26,fontWeight:900,marginBottom:4}}>{ca.toLocaleString("fr-FR")}</div>
          <div style={{fontSize:12,opacity:0.75}}>FCFA · {ventes.length} vente{ventes.length>1?"s":""}</div>
        </div>
        {/* BÉNÉFICE */}
        <div style={{background:benefice>=0?"linear-gradient(135deg,#1DB954,#30D158)":"linear-gradient(135deg,#CC0000,#FF453A)",borderRadius:20,padding:"20px 18px",color:"#fff",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,background:"rgba(255,255,255,0.08)",borderRadius:"50%"}}/>
          <div style={{fontSize:13,fontWeight:600,opacity:0.85,marginBottom:8}}>📈 Bénéfice net</div>
          <div style={{fontSize:26,fontWeight:900,marginBottom:4}}>{benefice.toLocaleString("fr-FR")}</div>
          <div style={{fontSize:12,opacity:0.75}}>FCFA · Marge {marge}%</div>
        </div>
        {/* DÉPENSES */}
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:20,padding:"20px 18px"}}>
          <div style={{fontSize:13,fontWeight:600,color:theme.textMuted,marginBottom:8}}>📤 Dépenses</div>
          <div style={{fontSize:26,fontWeight:900,color:"#FF453A",marginBottom:4}}>{dep.toLocaleString("fr-FR")}</div>
          <div style={{fontSize:12,color:theme.textMuted}}>FCFA total</div>
        </div>
      </div>

      {/* CARTES SECONDAIRES */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
        {[
          {icon:"🛒",label:"Ventes",value:ventes.length,color:"#0A84FF",sub:"transactions"},
          {icon:"📦",label:"Produits en stock",value:stock.length,color:"#BF5AF2",sub:"références"},
          {icon:"⚠️",label:"Stock bas",value:stockBas.length,color:stockBas.length>0?"#FF9F0A":"#30D158",sub:stockBas.length>0?"à réapprovisionner":"Tout va bien"},
        ].map(c=>(
          <div key={c.label} style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:20,padding:"18px 16px",display:"flex",gap:14,alignItems:"center"}}>
            <div style={{width:48,height:48,borderRadius:14,background:`${c.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{c.icon}</div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:c.color}}>{c.value}</div>
              <div style={{fontSize:12,color:theme.textMuted,marginTop:1}}>{c.label}</div>
              <div style={{fontSize:10,color:c.color,fontWeight:600,marginTop:2}}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* GRAPHIQUE + TOP PRODUITS */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:20}}>

        {/* GRAPHIQUE */}
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:20,padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontSize:15,fontWeight:800,color:theme.text}}>📈 CA mensuel</div>
            {dernierMois&&<div style={{fontSize:12,color:theme.textMuted}}>{(dernierMois[1]/1000).toFixed(0)}k ce mois</div>}
          </div>
          {moisList.length===0?(
            <div style={{textAlign:"center",padding:"2rem",color:theme.textMuted,fontSize:13}}>Aucune vente pour le moment</div>
          ):(
            <div style={{display:"flex",gap:8,alignItems:"flex-end",height:160,paddingBottom:4}}>
              {moisList.map(([m,v],i)=>{
                const isLast = i===moisList.length-1;
                const h = Math.round((v/maxCA)*130);
                const mNum = parseInt(m.slice(5))-1;
                return (
                  <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <div style={{fontSize:10,color:isLast?"#0A84FF":theme.textMuted,fontWeight:isLast?800:400}}>{(v/1000).toFixed(0)}k</div>
                    <div style={{width:"100%",background:isLast?"#0A84FF":dark?"rgba(10,132,255,0.3)":"rgba(10,132,255,0.15)",borderRadius:"8px 8px 0 0",height:`${h}px`,minHeight:4,transition:"height 0.3s"}}/>
                    <div style={{fontSize:10,color:isLast?"#0A84FF":theme.textMuted,fontWeight:isLast?700:400}}>{MOIS_FR[mNum]}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOP PRODUITS */}
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:20,padding:20}}>
          <div style={{fontSize:15,fontWeight:800,color:theme.text,marginBottom:16}}>🏆 Top produits</div>
          {topProduits.length===0?(
            <div style={{textAlign:"center",padding:"2rem",color:theme.textMuted,fontSize:13}}>Aucune vente</div>
          ):(
            topProduits.map(([nom,data],i)=>(
              <div key={nom} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:14}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"🏅"}</span>
                    <span style={{fontSize:12,fontWeight:700,color:theme.text}}>{nom.length>16?nom.slice(0,16)+"…":nom}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:"#0A84FF"}}>{data.qte} vte{data.qte>1?"s":""}</span>
                </div>
                <div style={{height:5,background:theme.toggleBg,borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.round((data.ca/(topProduits[0]?.[1]?.ca||1))*100)}%`,background:i===0?"linear-gradient(90deg,#1400FF,#0066FF)":"#0A84FF",borderRadius:99,opacity:1-i*0.15}}/>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DERNIÈRES VENTES + STOCK BAS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* DERNIÈRES VENTES */}
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:20,padding:20}}>
          <div style={{fontSize:15,fontWeight:800,color:theme.text,marginBottom:16}}>🛒 Dernières ventes</div>
          {dernieresVentes.length===0?(
            <div style={{textAlign:"center",padding:"2rem",color:theme.textMuted,fontSize:13}}>Aucune vente pour le moment</div>
          ):(
            dernieresVentes.map((v,i)=>(
              <div key={v.id||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<dernieresVentes.length-1?`1px solid ${theme.border}`:"none"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:theme.text}}>{v.produit}</div>
                  <div style={{fontSize:11,color:theme.textMuted,marginTop:2}}>{v.date} · {v.client||"—"}</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:"#30D158"}}>{(Number(v.prix_vente)*Number(v.qte||1)).toLocaleString("fr-FR")} F</div>
              </div>
            ))
          )}
        </div>

        {/* STOCK BAS */}
        <div style={{background:stockBas.length>0?"rgba(255,159,10,0.06)":theme.card,border:`1px solid ${stockBas.length>0?"rgba(255,159,10,0.3)":theme.border}`,borderRadius:20,padding:20}}>
          <div style={{fontSize:15,fontWeight:800,color:stockBas.length>0?"#FF9F0A":theme.text,marginBottom:16}}>⚠️ Stock à réapprovisionner</div>
          {stockBas.length===0?(
            <div style={{textAlign:"center",padding:"2rem"}}>
              <div style={{fontSize:40,marginBottom:8}}>✅</div>
              <div style={{fontSize:13,color:"#30D158",fontWeight:600}}>Tout votre stock est OK !</div>
            </div>
          ):(
            stockBas.map((p,i)=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<stockBas.length-1?`1px solid rgba(255,159,10,0.2)`:"none"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:theme.text}}>{p.nom}</div>
                  <div style={{fontSize:11,color:theme.textMuted,marginTop:2}}>{p.cat}</div>
                </div>
                <div style={{background:"rgba(255,69,58,0.12)",border:"1px solid rgba(255,69,58,0.3)",borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:800,color:"#FF453A"}}>{p.qte} restant{p.qte>1?"s":""}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── STOCK ────────────────────────────────────────────────────────────────────
const Stock = ({ stock, setStock, showToast, role }) => {
  const { theme } = useContext(ThemeCtx);
  const [cats,setCats] = useState(()=>{ try{return JSON.parse(localStorage.getItem("angy_cats"))||CATS_DEFAUT;}catch{return CATS_DEFAUT;} });
  const [newCat,setNewCat] = useState("");
  const [showCats,setShowCats] = useState(false);
  const [form,setForm] = useState({ nom:"", cat:cats[0]||"iPhones", qte:"", prix_achat:"", prix_vente:"", seuil:"3" });
  const [search,setSearch] = useState(""); const [loading,setLoading] = useState(false);

  const saveCats = (newCats) => { setCats(newCats); localStorage.setItem("angy_cats",JSON.stringify(newCats)); };
  const ajouterCat = () => {
    if(!newCat.trim()) return;
    if(cats.includes(newCat.trim())) return showToast("Catégorie déjà existante",true);
    saveCats([...cats,newCat.trim()]);
    setNewCat(""); showToast("✅ Catégorie ajoutée !");
  };
  const supprimerCat = (c) => {
    if(CATS_DEFAUT.includes(c)) return showToast("Impossible de supprimer une catégorie par défaut",true);
    saveCats(cats.filter(x=>x!==c));
  };
  const inp = { boxSizing:"border-box", padding:"10px 12px", borderRadius:10, border:`1px solid ${theme.border}`, background:theme.input, color:theme.text, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" };
  const filtres = stock.filter(p=>p.nom?.toLowerCase().includes(search.toLowerCase()));
  const ajouter = async () => {
    if(!form.nom||!form.prix_vente) return showToast("Nom et prix obligatoires",true);
    setLoading(true);
    const data = { nom:form.nom, cat:form.cat, qte:Number(form.qte)||0, prix_achat:Number(form.prix_achat)||0, prix_vente:Number(form.prix_vente), seuil:Number(form.seuil)||3 };
    const p = await db.add("stock",data);
    if(p){ setStock(prev=>[p,...prev]); showToast("✅ Produit ajouté !"); setForm({ nom:"", cat:cats[0], qte:"", prix_achat:"", prix_vente:"", seuil:"3" }); }
    else showToast("Erreur connexion",true);
    setLoading(false);
  };
  const supprimer = async (id) => { if(!window.confirm("Supprimer ?")) return; await db.del("stock",id); setStock(prev=>prev.filter(p=>p.id!==id)); showToast("Supprimé"); };
  const majQte = async (id,delta) => {
    const p=stock.find(x=>x.id===id); if(!p) return;
    const q=Math.max(0,Number(p.qte)+delta);
    await db.patch("stock",id,{qte:q});
    setStock(prev=>prev.map(x=>x.id===id?{...x,qte:q}:x));
  };
  return (
    <div style={{ padding:"20px 16px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:22, fontWeight:800, color:theme.text }}>📦 Stock</div>
        {role==="admin"&&(
          <button onClick={()=>setShowCats(!showCats)} style={{ background:showCats?"rgba(191,90,242,0.15)":"transparent", color:"#BF5AF2", border:"1px solid rgba(191,90,242,0.3)", padding:"9px 16px", borderRadius:10, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            🏷️ Gérer les catégories
          </button>
        )}
      </div>

      {/* PANEL CATÉGORIES */}
      {showCats&&role==="admin"&&(
        <div style={{ background:"rgba(191,90,242,0.08)", border:"1px solid rgba(191,90,242,0.25)", borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#BF5AF2", marginBottom:12 }}>🏷️ Gérer les catégories</div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ajouterCat()}
              placeholder="Nouvelle catégorie... Ex: PlayStation, Drones"
              style={{ flex:1, boxSizing:"border-box", padding:"10px 12px", borderRadius:10, border:`1px solid ${theme.border}`, background:theme.input, color:theme.text, fontSize:13, fontFamily:"inherit", outline:"none" }}/>
            <button onClick={ajouterCat} style={{ padding:"10px 18px", borderRadius:10, background:"#BF5AF2", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✅ Ajouter</button>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {cats.map(c=>(
              <div key={c} style={{ display:"flex", alignItems:"center", gap:6, background:theme.toggleBg, border:`1px solid ${theme.border}`, borderRadius:99, padding:"6px 12px" }}>
                <span style={{ fontSize:13, fontWeight:600, color:theme.text }}>{c}</span>
                {!CATS_DEFAUT.includes(c)&&(
                  <button onClick={()=>supprimerCat(c)} style={{ background:"none", border:"none", color:"#FF453A", cursor:"pointer", fontSize:14, padding:"0 2px", lineHeight:1 }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {(role==="admin"||role==="vendeur")&&(
        <div style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:theme.text, marginBottom:14 }}>+ Ajouter un produit</div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Nom *</label><input style={inp} value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="iPhone 15 128Go"/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Catégorie</label><select style={inp} value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Quantité</label><input type="number" style={inp} value={form.qte} onChange={e=>setForm(f=>({...f,qte:e.target.value}))} placeholder="0"/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Prix achat</label><input type="number" style={inp} value={form.prix_achat} onChange={e=>setForm(f=>({...f,prix_achat:e.target.value}))}/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Prix vente *</label><input type="number" style={inp} value={form.prix_vente} onChange={e=>setForm(f=>({...f,prix_vente:e.target.value}))}/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Seuil alerte</label><input type="number" style={inp} value={form.seuil} onChange={e=>setForm(f=>({...f,seuil:e.target.value}))}/></div>
            <button onClick={ajouter} disabled={loading} style={{ padding:"10px 18px", borderRadius:10, background:"#0A84FF", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>{loading?"⏳":"✅"}</button>
          </div>
        </div>
      )}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{...inp, marginBottom:14, padding:"11px 14px", fontSize:14}}/>
      <div style={{ display:"grid", gap:8 }}>
        {filtres.length===0&&<div style={{ textAlign:"center", padding:"3rem", color:theme.textMuted }}>Aucun produit</div>}
        {filtres.map(p=>(
          <div key={p.id} style={{ background:theme.card, border:`1px solid ${Number(p.qte)<=Number(p.seuil||3)?"rgba(255,159,10,0.5)":theme.border}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:theme.text }}>{p.nom}</div>
              <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>{p.cat} · Achat: {Number(p.prix_achat).toLocaleString("fr-FR")} F · Vente: {Number(p.prix_vente).toLocaleString("fr-FR")} F</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={()=>majQte(p.id,-1)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${theme.border}`, background:theme.toggleBg, color:theme.text, cursor:"pointer", fontWeight:700, fontSize:16 }}>−</button>
              <span style={{ fontWeight:800, fontSize:18, color:Number(p.qte)<=Number(p.seuil||3)?"#FF9F0A":theme.text, minWidth:28, textAlign:"center" }}>{p.qte}</span>
              <button onClick={()=>majQte(p.id,1)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${theme.border}`, background:theme.toggleBg, color:theme.text, cursor:"pointer", fontWeight:700, fontSize:16 }}>+</button>
            </div>
            {(role==="admin"||role==="vendeur")&&<button onClick={()=>supprimer(p.id)} style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", color:"#FF453A", padding:"7px 12px", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>🗑</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── VENTES ───────────────────────────────────────────────────────────────────
const Ventes = ({ ventes, setVentes, stock, showToast, role, onVenteAdded }) => {
  const { theme } = useContext(ThemeCtx);
  const [form,setForm] = useState({ produit:"", cat:"", qte:"1", prix_vente:"", date:new Date().toISOString().slice(0,10), client:"" });
  const [loading,setLoading] = useState(false);
  const inp = { boxSizing:"border-box", padding:"10px 12px", borderRadius:10, border:`1px solid ${theme.border}`, background:theme.input, color:theme.text, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" };
  const total = ventes.reduce((s,v)=>s+Number(v.prix_vente)*Number(v.qte||1),0);
  const ajouter = async () => {
    if(!form.produit||!form.prix_vente) return showToast("Produit et prix obligatoires",true);
    setLoading(true);
    const data = { produit:form.produit, cat:form.cat, qte:Number(form.qte)||1, prix_vente:Number(form.prix_vente), date:form.date, client:form.client||"—" };
    const v = await db.add("ventes",data);
    if(v){ setVentes(prev=>[v,...prev]); showToast("✅ Vente enregistrée !"); setForm({ produit:"", cat:"", qte:"1", prix_vente:"", date:new Date().toISOString().slice(0,10), client:"" }); if(onVenteAdded) onVenteAdded(v); }
    else showToast("Erreur connexion",true);
    setLoading(false);
  };
  const supprimer = async (id) => { if(!window.confirm("Supprimer ?")) return; await db.del("ventes",id); setVentes(prev=>prev.filter(v=>v.id!==id)); showToast("Supprimé"); };
  const exportCSV = () => {
    const rows = ventes.map(v=>[v.date,v.produit,v.qte||1,v.prix_vente,Number(v.prix_vente)*Number(v.qte||1),v.client||"—"].join(","));
    const csv = ["Date,Produit,Qté,Prix,Total,Client",...rows].join("\n");
    const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv"})); a.download="ventes.csv"; a.click();
  };
  return (
    <div style={{ padding:"20px 16px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:22, fontWeight:800, color:theme.text }}>🛒 Ventes</div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ background:"rgba(48,209,88,0.1)", border:"1px solid rgba(48,209,88,0.3)", borderRadius:12, padding:"10px 18px", fontWeight:700, color:"#30D158" }}>CA: {total.toLocaleString("fr-FR")} F</div>
          <button onClick={exportCSV} style={{ background:theme.toggleBg, border:`1px solid ${theme.border}`, color:theme.text, padding:"9px 16px", borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600 }}>📥 CSV</button>
        </div>
      </div>
      {(role==="admin"||role==="vendeur")&&(
        <div style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:theme.text, marginBottom:14 }}>+ Nouvelle vente</div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Produit *</label>
              <select style={inp} value={form.produit} onChange={e=>{ const p=stock.find(x=>x.nom===e.target.value); setForm(f=>({...f,produit:e.target.value,cat:p?.cat||"",prix_vente:p?String(p.prix_vente):f.prix_vente})); }}>
                <option value="">-- Choisir --</option>{stock.map(p=><option key={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Qté</label><input type="number" style={inp} value={form.qte} onChange={e=>setForm(f=>({...f,qte:e.target.value}))} min="1"/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Prix vente *</label><input type="number" style={inp} value={form.prix_vente} onChange={e=>setForm(f=>({...f,prix_vente:e.target.value}))}/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Date</label><input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Client</label><input style={inp} value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} placeholder="Optionnel"/></div>
            <button onClick={ajouter} disabled={loading} style={{ padding:"10px 18px", borderRadius:10, background:"#30D158", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{loading?"⏳":"✅"}</button>
          </div>
        </div>
      )}
      <div style={{ display:"grid", gap:8 }}>
        {ventes.length===0&&<div style={{ textAlign:"center", padding:"3rem", color:theme.textMuted }}>Aucune vente</div>}
        {ventes.map(v=>(
          <div key={v.id} style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:theme.text }}>{v.produit}</div><div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>{v.date} · Qté: {v.qte||1} · {v.client||"—"}</div></div>
            <div style={{ fontWeight:800, fontSize:16, color:"#30D158" }}>{(Number(v.prix_vente)*Number(v.qte||1)).toLocaleString("fr-FR")} F</div>
            {role==="admin"&&<button onClick={()=>supprimer(v.id)} style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", color:"#FF453A", padding:"7px 12px", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>🗑</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DEPENSES ─────────────────────────────────────────────────────────────────
const Depenses = ({ depenses, setDepenses, setStock, showToast, role }) => {
  const { theme } = useContext(ThemeCtx);
  const [form,setForm] = useState({ titre:"", cat:"Achat stock", montant:"", date:new Date().toISOString().slice(0,10), note:"", ajouterStock:false, stockNom:"", stockQte:"1", stockPrixVente:"" });
  const [loading,setLoading] = useState(false);
  const CATS = ["Achat stock","Transport","Loyer","Marketing","Salaires","Autre"];
  const inp = { boxSizing:"border-box", padding:"10px 12px", borderRadius:10, border:`1px solid ${theme.border}`, background:theme.input, color:theme.text, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" };
  const total = depenses.reduce((s,d)=>s+Number(d.montant),0);
  const ajouter = async () => {
    if(!form.titre||!form.montant) return showToast("Titre et montant obligatoires",true);
    setLoading(true);
    const d = await db.add("depenses",{ titre:form.titre, cat:form.cat, montant:Number(form.montant), date:form.date, note:form.note });
    if(d){
      setDepenses(prev=>[d,...prev]);
      // Si option stock cochée → ajouter aussi dans le stock
      if(form.ajouterStock && form.stockNom) {
        const existing = setStock ? null : null; // check handled below
        const stockData = { nom:form.stockNom||form.titre, cat:"iPhones", qte:Number(form.stockQte)||1, prix_achat:Number(form.montant)/Math.max(Number(form.stockQte),1), prix_vente:Number(form.stockPrixVente)||0, seuil:3 };
        const newP = await db.add("stock", stockData);
        if(newP && setStock){ setStock(prev=>[newP,...prev]); showToast("✅ Dépense + Stock ajoutés !"); }
        else showToast("✅ Dépense ajoutée — stock non synchronisé",true);
      } else {
        showToast("✅ Dépense ajoutée !");
      }
      setForm({ titre:"", cat:"Achat stock", montant:"", date:new Date().toISOString().slice(0,10), note:"", ajouterStock:false, stockNom:"", stockQte:"1", stockPrixVente:"" });
    } else showToast("Erreur",true);
    setLoading(false);
  };
  const supprimer = async (id) => { if(!window.confirm("Supprimer ?")) return; await db.del("depenses",id); setDepenses(prev=>prev.filter(d=>d.id!==id)); showToast("Supprimé"); };
  return (
    <div style={{ padding:"20px 16px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:22, fontWeight:800, color:theme.text }}>📤 Dépenses</div>
        <div style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", borderRadius:12, padding:"10px 18px", fontWeight:700, color:"#FF453A" }}>Total: {total.toLocaleString("fr-FR")} F</div>
      </div>
      {(role==="admin"||role==="comptable")&&(
        <div style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:theme.text, marginBottom:14 }}>+ Nouvelle dépense</div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Titre *</label><input style={inp} value={form.titre} onChange={e=>setForm(f=>({...f,titre:e.target.value}))} placeholder="Ex: Achat stock"/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Catégorie</label><select style={inp} value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Montant *</label><input type="number" style={inp} value={form.montant} onChange={e=>setForm(f=>({...f,montant:e.target.value}))}/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Date</label><input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <button onClick={ajouter} disabled={loading} style={{ padding:"10px 18px", borderRadius:10, background:"#FF453A", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{loading?"⏳":"✅"}</button>
          </div>

          {/* Option ajout stock */}
          <div style={{ marginTop:12, padding:"12px 14px", background:"rgba(10,132,255,0.06)", border:`1px solid rgba(10,132,255,0.2)`, borderRadius:12 }}>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
              <input type="checkbox" checked={form.ajouterStock} onChange={e=>setForm(f=>({...f,ajouterStock:e.target.checked}))} style={{ width:18, height:18, cursor:"pointer" }}/>
              <span style={{ fontSize:13, fontWeight:700, color:"#0A84FF" }}>📦 Ajouter aussi dans le Stock</span>
            </label>
            {form.ajouterStock&&(
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10, marginTop:12 }}>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Nom du produit</label><input style={inp} value={form.stockNom} onChange={e=>setForm(f=>({...f,stockNom:e.target.value}))} placeholder={form.titre||"Ex: iPhone 15 128Go"}/></div>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Quantité</label><input type="number" style={inp} value={form.stockQte} onChange={e=>setForm(f=>({...f,stockQte:e.target.value}))} min="1"/></div>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Prix de vente</label><input type="number" style={inp} value={form.stockPrixVente} onChange={e=>setForm(f=>({...f,stockPrixVente:e.target.value}))} placeholder="Ex: 300000"/></div>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ display:"grid", gap:8 }}>
        {depenses.length===0&&<div style={{ textAlign:"center", padding:"3rem", color:theme.textMuted }}>Aucune dépense</div>}
        {depenses.map(d=>(
          <div key={d.id} style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:theme.text }}>{d.titre}</div><div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>{d.cat} · {d.date}</div></div>
            <div style={{ fontWeight:800, fontSize:16, color:"#FF453A" }}>−{Number(d.montant).toLocaleString("fr-FR")} F</div>
            {role==="admin"&&<button onClick={()=>supprimer(d.id)} style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", color:"#FF453A", padding:"7px 12px", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>🗑</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── FACTURES ─────────────────────────────────────────────────────────────────
const Factures = ({ factures, setFactures, stock, showToast, role, ventePrefill, setVentePrefill }) => {
  const { theme } = useContext(ThemeCtx);
  const [form,setForm] = useState({ client:"", telephone:"", lignes:[{produit:"",qte:1,prix:"",imei:"",couleur:"",stockage:"",etat:"Neuf"}], date:new Date().toISOString().slice(0,10), paiement:"Espèces", note:"" });
  const [loading,setLoading] = useState(false);
  const [showDetails,setShowDetails] = useState({});

  // Pré-remplir depuis une vente
  useEffect(()=>{
    if(ventePrefill){
      setForm(f=>({...f, client:ventePrefill.client||"", lignes:[{produit:ventePrefill.produit||"",qte:ventePrefill.qte||1,prix:String(ventePrefill.prix_vente||""),imei:"",couleur:"",stockage:"",etat:"Neuf"}], date:ventePrefill.date||f.date }));
      setVentePrefill(null);
    }
  },[ventePrefill]);

  const inp = { boxSizing:"border-box", padding:"10px 12px", borderRadius:10, border:`1px solid ${theme.border}`, background:theme.input, color:theme.text, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" };
  const total = form.lignes.reduce((s,l)=>s+Number(l.prix||0)*Number(l.qte||1),0);

  const ajouter = async () => {
    if(!form.client) return showToast("Nom client obligatoire",true);
    setLoading(true);
    const num = "FAC-"+Date.now().toString().slice(-6);
    const f = await db.add("factures",{ numero:num, client:form.client, telephone:form.telephone, date:form.date, lignes:JSON.stringify(form.lignes), total, paiement:form.paiement, note:form.note });
    if(f){ setFactures(prev=>[f,...prev]); showToast("✅ Facture créée !"); setForm({ client:"", telephone:"", lignes:[{produit:"",qte:1,prix:"",imei:"",couleur:"",stockage:"",etat:"Neuf"}], date:new Date().toISOString().slice(0,10), paiement:"Espèces", note:"" }); }
    else showToast("Erreur",true);
    setLoading(false);
  };

  const supprimer = async (id) => { if(!window.confirm("Supprimer ?")) return; await db.del("factures",id); setFactures(prev=>prev.filter(f=>f.id!==id)); showToast("Supprimé"); };

  const imprimer = (f) => {
    const lignes = JSON.parse(f.lignes||"[]");
    const html = `<html><head><title>${f.numero}</title><style>
      body{font-family:Arial,sans-serif;padding:40px;max-width:750px;margin:0 auto;color:#1C1C1E}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px}
      h1{color:#1400FF;margin:0;font-size:28px}
      .badge{background:#1400FF;color:white;padding:6px 14px;border-radius:99px;font-size:12px;font-weight:700}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th{background:#1400FF;color:white;padding:10px;text-align:left;font-size:13px}
      td{padding:10px;border-bottom:1px solid #eee;font-size:13px}
      .detail{font-size:11px;color:#888;margin-top:3px}
      .total{font-size:20px;font-weight:bold;margin-top:20px;text-align:right;color:#1400FF}
      .footer{margin-top:40px;font-size:11px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:16px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;padding:16px;background:#f8f8f8;border-radius:10px}
      .info-item label{font-size:11px;color:#888;display:block}
      .info-item span{font-size:14px;font-weight:600}
    </style></head><body>
      <div class="header">
        <div><h1>ANGY COMPANY</h1><p style="margin:4px 0;color:#666">Dakar, Sénégal · +221 78 116 32 86<br/>angycompany25@gmail.com</p></div>
        <div><div class="badge">FACTURE</div><div style="font-size:13px;margin-top:8px;color:#666">${f.numero}<br/>${f.date}</div></div>
      </div>
      <div class="info-grid">
        <div class="info-item"><label>Client</label><span>${f.client}</span></div>
        <div class="info-item"><label>Téléphone</label><span>${f.telephone||"—"}</span></div>
        <div class="info-item"><label>Mode de paiement</label><span>${f.paiement}</span></div>
        <div class="info-item"><label>Date</label><span>${f.date}</span></div>
      </div>
      <table>
        <tr><th>Produit</th><th>Détails</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr>
        ${lignes.map(l=>`<tr>
          <td><strong>${l.produit}</strong></td>
          <td><div class="detail">${[l.imei?"IMEI: "+l.imei:"",l.couleur?"Couleur: "+l.couleur:"",l.stockage||"",l.etat||""].filter(Boolean).join(" · ")||"—"}</div></td>
          <td>${l.qte}</td>
          <td>${Number(l.prix).toLocaleString("fr-FR")} F</td>
          <td><strong>${(Number(l.prix)*Number(l.qte)).toLocaleString("fr-FR")} F</strong></td>
        </tr>`).join("")}
      </table>
      <div class="total">Total : ${Number(f.total).toLocaleString("fr-FR")} FCFA</div>
      ${f.note?`<p style="margin-top:16px;font-size:13px;color:#666"><b>Note :</b> ${f.note}</p>`:""}
      <div class="footer">Merci pour votre confiance — ANGY COMPANY · Dakar, Sénégal<br/>Ce document tient lieu de facture</div>
    </body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close(); w.print();
  };

  return (
    <div style={{ padding:"20px 16px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ fontSize:22, fontWeight:800, color:theme.text, marginBottom:20 }}>🧾 Factures</div>

      {(role==="admin"||role==="vendeur")&&(
        <div style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:theme.text, marginBottom:14 }}>+ Nouvelle facture</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:14 }}>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Client *</label><input style={inp} value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} placeholder="Nom du client"/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Téléphone</label><input style={inp} value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))}/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Date</label><input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Paiement</label>
              <select style={inp} value={form.paiement} onChange={e=>setForm(f=>({...f,paiement:e.target.value}))}>
                {["Espèces","Wave","Orange Money","Free Money","Virement"].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* LIGNES PRODUITS */}
          {form.lignes.map((l,i)=>(
            <div key={i} style={{ background:theme.toggleBg, border:`1px solid ${theme.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:8, marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Produit</label>
                  <select style={inp} value={l.produit} onChange={e=>{ const p=stock.find(x=>x.nom===e.target.value); const nl=[...form.lignes]; nl[i]={...nl[i],produit:e.target.value,prix:p?String(p.prix_vente):nl[i].prix}; setForm(f=>({...f,lignes:nl})); }}>
                    <option value="">-- Choisir --</option>{stock.map(p=><option key={p.id}>{p.nom}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Qté</label><input type="number" style={inp} value={l.qte} min="1" onChange={e=>{ const nl=[...form.lignes]; nl[i]={...nl[i],qte:Number(e.target.value)}; setForm(f=>({...f,lignes:nl})); }}/></div>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Prix vente</label><input type="number" style={inp} value={l.prix} onChange={e=>{ const nl=[...form.lignes]; nl[i]={...nl[i],prix:e.target.value}; setForm(f=>({...f,lignes:nl})); }}/></div>
                <button onClick={()=>setForm(f=>({...f,lignes:f.lignes.filter((_,j)=>j!==i)}))} style={{ padding:"10px", borderRadius:10, background:"rgba(255,69,58,0.1)", color:"#FF453A", border:"none", cursor:"pointer", fontWeight:700, alignSelf:"flex-end" }}>✕</button>
              </div>
              {/* DÉTAILS PRODUIT */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>📱 IMEI</label><input style={inp} value={l.imei||""} onChange={e=>{ const nl=[...form.lignes]; nl[i]={...nl[i],imei:e.target.value}; setForm(f=>({...f,lignes:nl})); }} placeholder="Ex: 352999001234567"/></div>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>🎨 Couleur</label><input style={inp} value={l.couleur||""} onChange={e=>{ const nl=[...form.lignes]; nl[i]={...nl[i],couleur:e.target.value}; setForm(f=>({...f,lignes:nl})); }} placeholder="Ex: Noir"/></div>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>💾 Stockage</label><input style={inp} value={l.stockage||""} onChange={e=>{ const nl=[...form.lignes]; nl[i]={...nl[i],stockage:e.target.value}; setForm(f=>({...f,lignes:nl})); }} placeholder="Ex: 128Go"/></div>
                <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>✨ État</label>
                  <select style={inp} value={l.etat||"Neuf"} onChange={e=>{ const nl=[...form.lignes]; nl[i]={...nl[i],etat:e.target.value}; setForm(f=>({...f,lignes:nl})); }}>
                    {["Neuf","Comme neuf","Très bon état","Bon état","Occasion"].map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
            <button onClick={()=>setForm(f=>({...f,lignes:[...f.lignes,{produit:"",qte:1,prix:"",imei:"",couleur:"",stockage:"",etat:"Neuf"}]}))} style={{ padding:"8px 16px", borderRadius:9, background:"rgba(10,132,255,0.1)", color:"#0A84FF", border:"1px solid rgba(10,132,255,0.3)", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600 }}>+ Ajouter une ligne</button>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontWeight:700, color:theme.text, fontSize:15 }}>Total : {total.toLocaleString("fr-FR")} FCFA</span>
              <button onClick={ajouter} disabled={loading} style={{ padding:"10px 20px", borderRadius:10, background:"#0A84FF", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>{loading?"⏳":"✅ Créer la facture"}</button>
            </div>
          </div>

          {/* Note */}
          <div style={{ marginTop:12 }}>
            <input style={inp} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Note (optionnel) — Ex: Garantie 3 mois"/>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gap:8 }}>
        {factures.length===0&&<div style={{ textAlign:"center", padding:"3rem", color:theme.textMuted }}>Aucune facture</div>}
        {factures.map(f=>(
          <div key={f.id} style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:theme.text }}>{f.numero} — {f.client}</div><div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>{f.date} · {f.paiement}</div></div>
            <div style={{ fontWeight:800, fontSize:16, color:"#0A84FF" }}>{Number(f.total).toLocaleString("fr-FR")} F</div>
            <button onClick={()=>imprimer(f)} style={{ background:"rgba(10,132,255,0.1)", border:"1px solid rgba(10,132,255,0.3)", color:"#0A84FF", padding:"7px 12px", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>🖨 Imprimer</button>
            {role==="admin"&&<button onClick={()=>supprimer(f.id)} style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", color:"#FF453A", padding:"7px 12px", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>🗑</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

// CATALOGUE PRIX
const PRIX_DEFAUT = [
  {id:1,modele:"iPhone XR",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"64 Go",p:90000},{s:"128 Go",p:100000},{s:"256 Go",p:120000}]},
  {id:2,modele:"iPhone 11",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"64 Go",p:115000},{s:"128 Go",p:120000},{s:"256 Go",p:130000}]},
  {id:3,modele:"iPhone 11 Pro",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"64 Go",p:150000},{s:"256 Go",p:165000},{s:"512 Go",p:170000}]},
  {id:4,modele:"iPhone 11 Pro Max",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"64 Go",p:165000},{s:"256 Go",p:175000},{s:"512 Go",p:190000}]},
  {id:5,modele:"iPhone 12",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"64 Go",p:140000},{s:"128 Go",p:160000},{s:"256 Go",p:180000}]},
  {id:6,modele:"iPhone 12 Pro",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:185000},{s:"256 Go",p:195000}]},
  {id:7,modele:"iPhone 12 Pro Max",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:230000},{s:"256 Go",p:250000}]},
  {id:8,modele:"iPhone 13",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:190000},{s:"256 Go",p:210000}]},
  {id:9,modele:"iPhone 13 Pro",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:240000},{s:"256 Go",p:260000}]},
  {id:10,modele:"iPhone 13 Pro Max",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:290000},{s:"256 Go",p:310000},{s:"512 Go",p:340000},{s:"1 To",p:360000}]},
  {id:11,modele:"iPhone 14",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:250000},{s:"256 Go",p:260000}]},
  {id:12,modele:"iPhone 14 Pro",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:290000},{s:"256 Go",p:310000}]},
  {id:13,modele:"iPhone 14 Pro Max",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:370000},{s:"256 Go",p:390000},{s:"512 Go",p:410000}]},
  {id:14,modele:"iPhone 15",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:290000},{s:"256 Go",p:310000}]},
  {id:15,modele:"iPhone 15 Pro",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:370000},{s:"256 Go",p:390000}]},
  {id:16,modele:"iPhone 15 Pro Max",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"256 Go",p:430000},{s:"512 Go",p:450000}]},
  {id:17,modele:"iPhone 16",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"128 Go",p:380000},{s:"256 Go",p:400000}]},
  {id:18,modele:"iPhone 16 Pro",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"256 Go",p:450000},{s:"512 Go",p:470000},{s:"1 To",p:490000}]},
  {id:19,modele:"iPhone 16 Pro Max",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"256 Go",p:540000},{s:"512 Go",p:560000},{s:"1 To",p:580000}]},
  {id:20,modele:"iPhone 17",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"256 Go",p:510000},{s:"512 Go",p:550000}]},
  {id:21,modele:"iPhone 17 Air",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"256 Go",p:590000}]},
  {id:22,modele:"iPhone 17 Pro",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"256 Go",p:660000},{s:"512 Go",p:690000},{s:"1 To",p:720000}]},
  {id:23,modele:"iPhone 17 Pro Max",photo:"",description:"",cat:"iPhones",disponible:true,prix:[{s:"256 Go",p:780000},{s:"512 Go",p:830000},{s:"1 To",p:870000}]}
];

const Catalogue = ({ showToast, stock=[], setStock }) => {
  const { theme } = useContext(ThemeCtx);
  const [cat,setCat] = useState(()=>{ try{ const saved=JSON.parse(localStorage.getItem("angy_catalogue")); return (saved&&saved.length>=PRIX_DEFAUT.length)?saved:PRIX_DEFAUT; }catch{return PRIX_DEFAUT;} });
  const [editing,setEditing] = useState(null);
  const [editVal,setEditVal] = useState("");
  const [editModal,setEditModal] = useState(null);
  const [search,setSearch] = useState("");
  const [filtre,setFiltre] = useState("tous");
  const [filtreType,setFiltreType] = useState("tous");
  const [showAdd,setShowAdd] = useState(false);
  const [newProd,setNewProd] = useState({modele:"",description:"",photo:"",cat:"iPhones",disponible:true,prix:[{s:"128Go",p:""}]});

  // Lien avec le stock — calcule la disponibilité réelle
  const getStockInfo = (modele) => {
    const matches = stock.filter(p=>p.nom?.toLowerCase().includes(modele?.toLowerCase().split(" ").slice(0,2).join(" ").toLowerCase()));
    const totalQte = matches.reduce((s,p)=>s+Number(p.qte),0);
    return { qteTotal:totalQte, produits:matches, dispo:totalQte>0 };
  };

  const save = (newCat) => { setCat(newCat); localStorage.setItem("angy_catalogue",JSON.stringify(newCat)); showToast("✅ Catalogue mis à jour !"); };
  const modifierPrix = (id,i,val) => { save(cat.map(p=>p.id!==id?p:{...p,prix:p.prix.map((px,j)=>j===i?{...px,p:Number(val)}:px)})); setEditing(null); };
  const toggleDispo = (id) => { save(cat.map(p=>p.id!==id?p:{...p,disponible:!p.disponible})); };
  const supprimerProduit = (id) => { if(!window.confirm("Supprimer ce produit ?")) return; save(cat.filter(p=>p.id!==id)); };

  const ajouterProduit = () => {
    if(!newProd.modele) return showToast("Nom obligatoire",true);
    const prod = {...newProd,id:Date.now(),prix:newProd.prix.filter(p=>p.s&&p.p).map(p=>({s:p.s,p:Number(p.p)}))};
    save([...cat,prod]);
    setNewProd({modele:"",description:"",photo:"",cat:"iPhones",disponible:true,prix:[{s:"128Go",p:""}]});
    setShowAdd(false);
  };

  const sauvegarderEdit = () => {
    if(!editModal) return;
    save(cat.map(p=>p.id!==editModal.id?p:editModal));
    setEditModal(null);
  };

  const copierTout = () => {
    const txt = cat
      .filter(p=>filtre==="tous"||(filtre==="dispo"&&p.disponible)||(filtre==="rupture"&&!p.disponible))
      .filter(p=>!search||p.modele.toLowerCase().includes(search.toLowerCase()))
      .map(p=>`📱 ${p.modele}${!p.disponible?" (Rupture)":""}\n${p.prix.map(px=>`  • ${px.s} → ${px.p.toLocaleString("fr-FR")} FCFA`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText("🏪 ANGY COMPANY — Liste des prix\n\n"+txt+"\n\n📞 +221 78 116 32 86\n✅ Authentiques · 🚚 Livraison Dakar");
    showToast("✅ Liste copiée — prête à envoyer !");
  };

  const exporterPDF = () => {
    const produits = cat.filter(p=>filtre==="tous"||(filtre==="dispo"&&p.disponible)||(filtre==="rupture"&&!p.disponible));
    const html = `<html><head><title>Catalogue ANGY COMPANY</title><style>
      body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1C1C1E}
      h1{color:#1400FF;font-size:28px;margin-bottom:4px}
      .subtitle{color:#888;font-size:13px;margin-bottom:30px}
      .produit{border:1px solid #eee;border-radius:12px;padding:16px;margin-bottom:14px;break-inside:avoid}
      .produit-nom{font-size:16px;font-weight:800;color:#1C1C1E;margin-bottom:4px}
      .produit-desc{font-size:12px;color:#888;margin-bottom:12px}
      .rupture{background:#FFF3F3;border-color:#FFD0D0}
      .badge-rupture{background:#FF453A;color:white;font-size:10px;padding:2px 8px;border-radius:99px;margin-left:8px}
      .prix-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
      .prix-item{background:#F5F5F7;border-radius:8px;padding:8px 10px;text-align:center}
      .prix-stockage{font-size:11px;color:#888;margin-bottom:3px}
      .prix-montant{font-size:15px;font-weight:800;color:#1400FF}
      .footer{margin-top:40px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee;padding-top:20px}
    </style></head><body>
    <h1>🏪 ANGY COMPANY</h1>
    <div class="subtitle">Catalogue des prix · Dakar, Sénégal · +221 78 116 32 86</div>
    ${produits.map(p=>`
      <div class="produit${!p.disponible?" rupture":""}">
        <div class="produit-nom">📱 ${p.modele}${!p.disponible?'<span class="badge-rupture">Rupture</span>':''}</div>
        ${p.description?`<div class="produit-desc">${p.description}</div>`:""}
        <div class="prix-grid">
          ${p.prix.map(px=>`<div class="prix-item"><div class="prix-stockage">${px.s}</div><div class="prix-montant">${px.p.toLocaleString("fr-FR")} F</div></div>`).join("")}
        </div>
      </div>
    `).join("")}
    <div class="footer">✅ Tous nos produits sont authentiques · 🚚 Livraison sur Dakar · 💳 Wave · Orange Money · Espèces<br/>ANGY COMPANY — angycompany25@gmail.com</div>
    </body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close(); w.print();
  };

  const filtres = cat
    .filter(p=>filtre==="tous"||(filtre==="dispo"&&p.disponible)||(filtre==="rupture"&&!p.disponible))
    .filter(p=>filtreType==="tous"||p.cat===filtreType)
    .filter(p=>!search||p.modele.toLowerCase().includes(search.toLowerCase()));

  const inp = {boxSizing:"border-box",padding:"10px 12px",borderRadius:10,border:`1px solid ${theme.border}`,background:theme.input,color:theme.text,fontSize:13,fontFamily:"inherit",outline:"none",width:"100%"};

  return (
    <div style={{padding:"20px 16px",maxWidth:1100,margin:"0 auto"}}>

      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:theme.text}}>💰 Catalogue des prix</div>
          <div style={{fontSize:13,color:theme.textMuted,marginTop:2}}>{cat.length} produits · {cat.filter(p=>p.disponible).length} disponibles</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={copierTout} style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.text,padding:"9px 14px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>📋 Copier WhatsApp</button>
          <button onClick={exporterPDF} style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.text,padding:"9px 14px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>📄 Exporter PDF</button>
          <button onClick={()=>save(PRIX_DEFAUT)} style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.textMuted,padding:"9px 14px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>🔄 Réinitialiser</button>
          <button onClick={()=>setShowAdd(!showAdd)} style={{background:"#0A84FF",color:"#fff",border:"none",padding:"10px 18px",borderRadius:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Ajouter produit</button>
        </div>
      </div>

      {/* AJOUTER PRODUIT */}
      {showAdd&&(
        <div style={{background:"rgba(10,132,255,0.06)",border:"1px solid rgba(10,132,255,0.2)",borderRadius:16,padding:18,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0A84FF",marginBottom:14}}>+ Nouveau produit</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:4}}>Nom du modèle *</label><input style={inp} value={newProd.modele} onChange={e=>setNewProd(f=>({...f,modele:e.target.value}))} placeholder="Ex: iPhone 18"/></div>
            <div><label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:4}}>Description</label><input style={inp} value={newProd.description} onChange={e=>setNewProd(f=>({...f,description:e.target.value}))} placeholder="Ex: Écran 6.1 · Puce A20"/></div>
            <div><label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:4}}>Type / Catégorie</label><select style={inp} value={newProd.cat} onChange={e=>setNewProd(f=>({...f,cat:e.target.value}))}>{["iPhones","Samsung","Tablettes","Accessoires","Ordinateurs","Autre"].map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:4}}>Variantes de stockage & prix</label>
            {newProd.prix.map((px,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                <input style={{...inp,width:100,flex:"none"}} value={px.s} onChange={e=>{const np=[...newProd.prix];np[i]={...np[i],s:e.target.value};setNewProd(f=>({...f,prix:np}));}} placeholder="128Go"/>
                <input type="number" style={{...inp,flex:1}} value={px.p} onChange={e=>{const np=[...newProd.prix];np[i]={...np[i],p:e.target.value};setNewProd(f=>({...f,prix:np}));}} placeholder="Prix FCFA"/>
                {newProd.prix.length>1&&<button onClick={()=>setNewProd(f=>({...f,prix:f.prix.filter((_,j)=>j!==i)}))} style={{padding:"8px 12px",borderRadius:8,background:"rgba(255,69,58,0.1)",color:"#FF453A",border:"none",cursor:"pointer",fontWeight:700}}>✕</button>}
              </div>
            ))}
            <button onClick={()=>setNewProd(f=>({...f,prix:[...f.prix,{s:"",p:""}]}))} style={{padding:"6px 14px",borderRadius:8,background:"rgba(10,132,255,0.1)",color:"#0A84FF",border:"1px solid rgba(10,132,255,0.3)",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>+ Variante</button>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:theme.text}}>
              <input type="checkbox" checked={newProd.disponible} onChange={e=>setNewProd(f=>({...f,disponible:e.target.checked}))} style={{width:16,height:16}}/>
              Disponible en stock
            </label>
            <div style={{flex:1}}/>
            <button onClick={ajouterProduit} style={{padding:"10px 20px",borderRadius:10,background:"#0A84FF",color:"#fff",border:"none",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✅ Ajouter</button>
            <button onClick={()=>setShowAdd(false)} style={{padding:"10px 16px",borderRadius:10,background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
          </div>
        </div>
      )}

      {/* RECHERCHE + FILTRES */}
      <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher un modèle..." style={{...inp,flex:1,minWidth:160}}/>
        {[["tous","Tous"],["dispo","✅ Disponibles"],["rupture","❌ Rupture"]].map(([id,l])=>(
          <button key={id} onClick={()=>setFiltre(id)} style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${filtre===id?"#0A84FF":theme.border}`,background:filtre===id?"rgba(10,132,255,0.12)":"transparent",color:filtre===id?"#0A84FF":theme.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
            {l} {id==="tous"?`(${cat.length})`:id==="dispo"?`(${cat.filter(p=>p.disponible).length})`:`(${cat.filter(p=>!p.disponible).length})`}
          </button>
        ))}
      </div>

      {/* FILTRE PAR TYPE */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:theme.textMuted,fontWeight:600,marginRight:2}}>Type :</span>
        {["tous",...[...new Set(cat.map(p=>p.cat||"Autre"))].sort()].map(t=>(
          <button key={t} onClick={()=>setFiltreType(t)} style={{padding:"6px 12px",borderRadius:99,border:`1px solid ${filtreType===t?"#FF9F0A":theme.border}`,background:filtreType===t?"rgba(255,159,10,0.12)":"transparent",color:filtreType===t?"#FF9F0A":theme.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600}}>
            {t==="tous"?"🗂 Tous":t} {t!=="tous"&&`(${cat.filter(p=>(p.cat||"Autre")===t).length})`}
          </button>
        ))}
      </div>

      <div style={{background:"rgba(255,159,10,0.08)",border:"1px solid rgba(255,159,10,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#FF9F0A"}}>
        💡 Appuyez sur un prix pour le modifier · ✏️ pour éditer le produit · 🔘 pour changer la disponibilité
      </div>

      {/* LISTE PRODUITS */}
      <div style={{display:"grid",gap:10}}>
        {filtres.length===0&&<div style={{textAlign:"center",padding:"3rem",color:theme.textMuted}}>Aucun produit trouvé</div>}
        {filtres.map(p=>{
          const si = getStockInfo(p.modele);
          const dispoDispo = si.qteTotal > 0;
          return (
          <div key={p.id} style={{background:theme.card,border:`1px solid ${dispoDispo?theme.border:"rgba(255,69,58,0.3)"}`,borderRadius:16,padding:"16px 18px",opacity:dispoDispo||p.disponible?1:0.75}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                {p.photo?(
                  <img src={p.photo} alt={p.modele} style={{width:48,height:48,objectFit:"cover",borderRadius:10,border:`1px solid ${theme.border}`}}/>
                ):(
                  <div style={{width:48,height:48,borderRadius:10,background:theme.toggleBg,border:`1px solid ${theme.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📱</div>
                )}
                <div>
                  <div style={{fontWeight:800,fontSize:16,color:theme.text}}>{p.modele}</div>
                  {p.description&&<div style={{fontSize:12,color:theme.textMuted,marginTop:2}}>{p.description}</div>}
                  {p.cat&&<div style={{display:"inline-block",fontSize:10,fontWeight:700,background:"rgba(255,159,10,0.12)",color:"#FF9F0A",border:"1px solid rgba(255,159,10,0.3)",borderRadius:99,padding:"2px 8px",marginTop:4}}>{p.cat}</div>}
                  {/* INFO STOCK LIÉ */}
                  <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                    {si.qteTotal>0?(
                      <span style={{fontSize:11,fontWeight:700,background:"rgba(48,209,88,0.12)",color:"#30D158",border:"1px solid rgba(48,209,88,0.3)",borderRadius:99,padding:"2px 8px"}}>
                        📦 {si.qteTotal} en stock
                      </span>
                    ):(
                      <span style={{fontSize:11,fontWeight:700,background:"rgba(255,69,58,0.1)",color:"#FF453A",border:"1px solid rgba(255,69,58,0.3)",borderRadius:99,padding:"2px 8px"}}>
                        ❌ Rupture de stock
                      </span>
                    )}
                    {si.produits.slice(0,2).map(sp=>(
                      <span key={sp.id} style={{fontSize:10,color:theme.textMuted,background:theme.toggleBg,border:`1px solid ${theme.border}`,borderRadius:99,padding:"2px 8px"}}>
                        {sp.nom} · {sp.qte} unité{sp.qte>1?"s":""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button onClick={()=>toggleDispo(p.id)} style={{padding:"5px 12px",borderRadius:99,border:`1px solid ${dispoDispo?"rgba(48,209,88,0.4)":"rgba(255,69,58,0.4)"}`,background:dispoDispo?"rgba(48,209,88,0.1)":"rgba(255,69,58,0.1)",color:dispoDispo?"#30D158":"#FF453A",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700}}>
                  {dispoDispo?"✅ En stock":"❌ Rupture"}
                </button>
                <button onClick={()=>setEditModal({...p,prix:[...p.prix]})} style={{padding:"6px 12px",borderRadius:9,background:theme.toggleBg,border:`1px solid ${theme.border}`,color:theme.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>✏️</button>
                <button onClick={()=>supprimerProduit(p.id)} style={{padding:"6px 10px",borderRadius:9,background:"rgba(255,69,58,0.08)",border:"1px solid rgba(255,69,58,0.2)",color:"#FF453A",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>🗑</button>
              </div>
            </div>
            {/* PRIX */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {p.prix.map((px,i)=>(
                <div key={i} style={{background:theme.toggleBg,border:`1px solid ${theme.border}`,borderRadius:10,padding:"8px 14px",minWidth:110}}>
                  <div style={{fontSize:11,color:theme.textMuted,marginBottom:4,fontWeight:600}}>{px.s}</div>
                  {editing?.id===p.id&&editing?.i===i?(
                    <div style={{display:"flex",gap:4}}>
                      <input type="number" autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter")modifierPrix(p.id,i,editVal);if(e.key==="Escape")setEditing(null);}}
                        style={{...inp,width:80,padding:"5px 8px",fontSize:13}}/>
                      <button onClick={()=>modifierPrix(p.id,i,editVal)} style={{background:"#30D158",color:"#fff",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",fontWeight:700}}>✅</button>
                    </div>
                  ):(
                    <div onClick={()=>{setEditing({id:p.id,i});setEditVal(String(px.p));}} style={{fontSize:16,fontWeight:800,color:"#30D158",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                      {px.p.toLocaleString("fr-FR")} F <span style={{fontSize:11,color:theme.textMuted}}>✏️</span>
                    </div>
                  )}
                </div>
              ))}
              <div onClick={()=>{
                const stockage=prompt("Stockage (ex: 512Go):");
                const prix=prompt("Prix en FCFA:");
                if(!stockage||!prix) return;
                save(cat.map(prod=>prod.id===p.id?{...prod,prix:[...prod.prix,{s:stockage,p:Number(prix)}]}:prod));
              }} style={{background:"rgba(10,132,255,0.05)",border:"1px dashed rgba(10,132,255,0.3)",borderRadius:10,padding:"8px 14px",minWidth:100,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <span style={{fontSize:11,color:"#0A84FF",fontWeight:600}}>+ Variante</span>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* MODAL ÉDITION COMPLÈTE */}
      {editModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
          <div style={{background:theme.card,borderRadius:20,padding:24,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",border:`1px solid ${theme.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:18,fontWeight:800,color:theme.text}}>✏️ Éditer le produit</div>
              <button onClick={()=>setEditModal(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:theme.textMuted}}>✕</button>
            </div>
            <div style={{display:"grid",gap:12}}>
              <div><label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:4}}>Nom du modèle</label><input style={inp} value={editModal.modele} onChange={e=>setEditModal(f=>({...f,modele:e.target.value}))}/></div>
              <div><label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:4}}>Description</label><input style={inp} value={editModal.description||""} onChange={e=>setEditModal(f=>({...f,description:e.target.value}))} placeholder="Ex: Écran 6.1 · Puce A19"/></div>
              <div><label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:4}}>Type / Catégorie</label><select style={inp} value={editModal.cat||"iPhones"} onChange={e=>setEditModal(f=>({...f,cat:e.target.value}))}>{["iPhones","Samsung","Tablettes","Accessoires","Ordinateurs","Autre"].map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:4}}>URL Photo (optionnel)</label><input style={inp} value={editModal.photo||""} onChange={e=>setEditModal(f=>({...f,photo:e.target.value}))} placeholder="https://..."/></div>
              <div>
                <label style={{fontSize:11,color:theme.textMuted,display:"block",marginBottom:8}}>Prix par stockage</label>
                {editModal.prix.map((px,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                    <input style={{...inp,width:100,flex:"none"}} value={px.s} onChange={e=>{const np=[...editModal.prix];np[i]={...np[i],s:e.target.value};setEditModal(f=>({...f,prix:np}));}} placeholder="128Go"/>
                    <input type="number" style={{...inp,flex:1}} value={px.p} onChange={e=>{const np=[...editModal.prix];np[i]={...np[i],p:Number(e.target.value)};setEditModal(f=>({...f,prix:np}));}} placeholder="Prix"/>
                    {editModal.prix.length>1&&<button onClick={()=>setEditModal(f=>({...f,prix:f.prix.filter((_,j)=>j!==i)}))} style={{padding:"8px 12px",borderRadius:8,background:"rgba(255,69,58,0.1)",color:"#FF453A",border:"none",cursor:"pointer",fontWeight:700}}>✕</button>}
                  </div>
                ))}
                <button onClick={()=>setEditModal(f=>({...f,prix:[...f.prix,{s:"",p:0}]}))} style={{padding:"6px 14px",borderRadius:8,background:"rgba(10,132,255,0.1)",color:"#0A84FF",border:"1px solid rgba(10,132,255,0.3)",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>+ Variante</button>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,color:theme.text}}>
                <input type="checkbox" checked={editModal.disponible} onChange={e=>setEditModal(f=>({...f,disponible:e.target.checked}))} style={{width:18,height:18}}/>
                <span style={{fontWeight:600}}>Disponible en stock</span>
              </label>
            </div>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button onClick={sauvegarderEdit} style={{flex:1,padding:"12px",borderRadius:12,background:"#0A84FF",color:"#fff",border:"none",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>✅ Sauvegarder</button>
              <button onClick={()=>setEditModal(null)} style={{flex:1,padding:"12px",borderRadius:12,background:theme.toggleBg,color:theme.text,border:`1px solid ${theme.border}`,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CRM COMPLET ──────────────────────────────────────────────────────────────
const CRM = ({ showToast }) => {
  const { theme } = useContext(ThemeCtx);
  const STATUTS = ["Nouveau","En discussion","Devis envoyé","Vendu","Perdu"];
  const SC = {
    "Nouveau":       {bg:"rgba(10,132,255,0.15)",  color:"#0A84FF",  border:"rgba(10,132,255,0.3)",  icon:"🆕"},
    "En discussion": {bg:"rgba(255,159,10,0.15)",  color:"#FF9F0A",  border:"rgba(255,159,10,0.3)",  icon:"💬"},
    "Devis envoyé":  {bg:"rgba(191,90,242,0.15)",  color:"#BF5AF2",  border:"rgba(191,90,242,0.3)",  icon:"📋"},
    "Vendu":         {bg:"rgba(48,209,88,0.15)",   color:"#30D158",  border:"rgba(48,209,88,0.3)",   icon:"✅"},
    "Perdu":         {bg:"rgba(255,69,58,0.15)",   color:"#FF453A",  border:"rgba(255,69,58,0.3)",   icon:"❌"},
  };
  const TEMPLATES = [
    {label:"👋 Premier contact",   msg:(p)=>`Bonjour ${p?.nom||"[Nom]"} ! 😊\n\nMerci de nous contacter chez ANGY COMPANY.\nJe suis Ange, votre conseiller. Quel produit vous intéresse ?\n\n📱 Stock disponible !\nAngy Company — +221 78 116 32 86`},
    {label:"🔔 Relance J+2",       msg:(p)=>`Bonjour ${p?.nom||"[Nom]"} ! 😊\n\nToujours intéressé par ${p?.produit||"notre offre"} ?\nStock disponible cette semaine !\n\n📞 +221 78 116 32 86`},
    {label:"🔥 Relance J+7",       msg:(p)=>`Bonjour ${p?.nom||"[Nom]"} ! 🔥\n\nOffre spéciale cette semaine !\n✅ Authentique · 🚚 Livraison Dakar\n💳 Wave · Orange Money · Espèces\n\n📞 +221 78 116 32 86`},
    {label:"💰 Envoi prix",        msg:(p)=>`Bonjour ${p?.nom||"[Nom]"} ! 😊\n\nNos prix :\n📱 iPhone 15 → 290 000 F\n📱 iPhone 16 → 380 000 F\n📱 iPhone 17 → 510 000 F\n📱 iPhone 17 Pro Max → 780 000 F\n\n✅ Authentiques · 🚚 Livraison Dakar\n📞 +221 78 116 32 86`},
    {label:"✅ Confirmation vente", msg:(p)=>`Bonjour ${p?.nom||"[Nom]"} ! 🎉\n\nMerci pour votre confiance !\nVotre commande est confirmée ✅\nNous vous contacterons pour la livraison.\n\n— Ange, ANGY COMPANY`},
    {label:"🚚 Livraison en cours", msg:(p)=>`Bonjour ${p?.nom||"[Nom]"} ! 🚚\n\nVotre commande est en route !\nRestez disponible svp.\n\nMerci ! 😊 — ANGY COMPANY`}
];
  const [prospects,setProspects] = useState([]);
  const [loading,setLoading] = useState(true);
  const [modal,setModal] = useState(null);
  const [vue,setVue] = useState("liste");
  const [filtre,setFiltre] = useState("tous");
  const [search,setSearch] = useState("");
  const [showAdd,setShowAdd] = useState(false);
  const [showBulk,setShowBulk] = useState(false);
  const [bulkText,setBulkText] = useState("");
  const [bulkParsed,setBulkParsed] = useState([]);
  const [bulkLoading,setBulkLoading] = useState(false);
  const [showTemplates,setShowTemplates] = useState(false);
  const [selTpl,setSelTpl] = useState(null);
  const [form,setForm] = useState({nom:"",telephone:"",produit:"iPhone",source:"WhatsApp",statut:"Nouveau",notes:""});
  const [saving,setSaving] = useState(false);
  const [noteInput,setNoteInput] = useState("");
  const [dragOver,setDragOver] = useState(null);
  const inp = { boxSizing:"border-box", padding:"10px 12px", borderRadius:10, border:`1px solid ${theme.border}`, background:theme.input, color:theme.text, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" };

  useEffect(()=>{
    fetch(`${SURL}/rest/v1/prospects?order=created_at.desc&limit=500`,{headers:H})
      .then(r=>r.ok?r.json():[]).then(d=>{setProspects(Array.isArray(d)?d:[]);setLoading(false);}).catch(()=>setLoading(false));
  },[]);

  const ajouter = async () => {
    if(!form.nom||!form.telephone) return showToast("Nom et téléphone obligatoires",true);
    setSaving(true);
    const r = await fetch(`${SURL}/rest/v1/prospects`,{method:"POST",headers:H,body:JSON.stringify({...form,historique:JSON.stringify([{date:new Date().toLocaleDateString("fr-FR"),action:"Créé"}])})});
    if(r.ok){const [p]=await r.json();setProspects(prev=>[p,...prev]);showToast("✅ Prospect ajouté !");setForm({nom:"",telephone:"",produit:"iPhone",source:"WhatsApp",statut:"Nouveau",notes:""});setShowAdd(false);}
    else showToast("Erreur",true);
    setSaving(false);
  };

  const majStatut = async (id,statut) => {
    await fetch(`${SURL}/rest/v1/prospects?id=eq.${id}`,{method:"PATCH",headers:H,body:JSON.stringify({statut})});
    setProspects(p=>p.map(x=>x.id===id?{...x,statut}:x));
    setModal(prev=>prev?{...prev,statut}:prev);
  };

  const ajouterNote = async (p) => {
    if(!noteInput.trim()) return;
    const hist = JSON.parse(p.historique||"[]");
    hist.push({date:new Date().toLocaleDateString("fr-FR"),action:"Note",note:noteInput});
    const h = JSON.stringify(hist);
    const relance = new Date(); relance.setDate(relance.getDate()+2);
    await fetch(`${SURL}/rest/v1/prospects?id=eq.${p.id}`,{method:"PATCH",headers:H,body:JSON.stringify({historique:h,prochaine_relance:relance.toISOString()})});
    setProspects(prev=>prev.map(x=>x.id===p.id?{...x,historique:h,prochaine_relance:relance.toISOString()}:x));
    setModal(prev=>({...prev,historique:h,prochaine_relance:relance.toISOString()}));
    setNoteInput(""); showToast("✅ Note ajoutée !");
  };

  const supprimer = async (id) => {
    if(!window.confirm("Supprimer ?")) return;
    await fetch(`${SURL}/rest/v1/prospects?id=eq.${id}`,{method:"DELETE",headers:H});
    setProspects(p=>p.filter(x=>x.id!==id)); setModal(null); showToast("Supprimé");
  };

  const parseBulk = (text) => {
    const lines = text.split("\n").map(l=>l.trim()).filter(l=>l.length>0);
    const parsed = lines.map(line=>{
      const m = line.match(/(\+?221[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\d{9,12})/);
      const phone = m?m[0].replace(/[\s-]/g,""):"";
      const nom = line.replace(m?m[0]:"","").replace(/[,;:|-]/g,"").trim()||"Prospect";
      return {nom,telephone:phone,produit:"iPhone",source:"WhatsApp",statut:"Nouveau"};
    }).filter(p=>p.telephone);
    setBulkParsed(parsed);
  };

  const importerTous = async () => {
    if(!bulkParsed.length) return showToast("Aucun prospect détecté",true);
    setBulkLoading(true);
    let count=0;
    for(const p of bulkParsed){
      const r = await fetch(`${SURL}/rest/v1/prospects`,{method:"POST",headers:H,body:JSON.stringify({...p,historique:JSON.stringify([{date:new Date().toLocaleDateString("fr-FR"),action:"Import masse"}])})});
      if(r.ok){const [np]=await r.json();setProspects(prev=>[np,...prev]);count++;}
      await new Promise(r=>setTimeout(r,80));
    }
    showToast(`✅ ${count} prospects importés !`);
    setBulkLoading(false); setShowBulk(false); setBulkText(""); setBulkParsed([]);
  };

  const exportCSV = () => {
    const rows = prospects.map(p=>[p.nom,p.telephone,p.produit,p.source,p.statut,new Date(p.created_at).toLocaleDateString("fr-FR")].join(","));
    const csv = ["Nom,Téléphone,Produit,Source,Statut,Date",...rows].join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv"})); a.download="prospects.csv"; a.click();
  };

  const relances = prospects.filter(p=>p.prochaine_relance&&new Date(p.prochaine_relance)<=new Date()&&!["Vendu","Perdu"].includes(p.statut));
  const filtres = prospects.filter(p=>{
    const mf=filtre==="tous"||p.statut===filtre||(filtre==="relances"&&relances.find(r=>r.id===p.id));
    const ms=!search||p.nom?.toLowerCase().includes(search.toLowerCase())||p.telephone?.includes(search);
    return mf&&ms;
  });
  const total=prospects.length, vendus=prospects.filter(p=>p.statut==="Vendu").length;
  const taux=total>0?Math.round((vendus/total)*100):0;

  return (
    <div style={{ padding:"20px 16px", maxWidth:1200, margin:"0 auto" }}>
      {/* HEADER */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:22, fontWeight:800, color:theme.text }}>🎯 CRM — Prospects</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={()=>setShowTemplates(!showTemplates)} style={{ background:"rgba(37,211,102,0.1)", color:"#25D366", border:"1px solid rgba(37,211,102,0.3)", padding:"9px 14px", borderRadius:10, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>💬 Messages</button>
          <button onClick={exportCSV} style={{ background:theme.toggleBg, border:`1px solid ${theme.border}`, color:theme.text, padding:"9px 14px", borderRadius:10, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>📥 CSV</button>
          <button onClick={()=>setShowBulk(!showBulk)} style={{ background:"rgba(191,90,242,0.1)", color:"#BF5AF2", border:"1px solid rgba(191,90,242,0.3)", padding:"9px 14px", borderRadius:10, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>📥 Import masse</button>
          <button onClick={()=>setShowAdd(!showAdd)} style={{ background:"#0A84FF", color:"#fff", border:"none", padding:"10px 20px", borderRadius:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>+ Nouveau</button>
        </div>
      </div>

      {/* FORM AJOUT */}
      {showAdd&&(
        <div style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:16, padding:18, marginBottom:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Nom *</label><input style={inp} value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Mamadou"/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Téléphone *</label><input style={inp} value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))} placeholder="+221 XX XXX XX XX"/></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Produit</label><select style={inp} value={form.produit} onChange={e=>setForm(f=>({...f,produit:e.target.value}))}>{["iPhone","MacBook","iPad","Samsung","Autre"].map(p=><option key={p}>{p}</option>)}</select></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Source</label><select style={inp} value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>{["WhatsApp","Facebook","TikTok","Instagram","Bouche à oreille","Autre"].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label style={{ fontSize:11, color:theme.textMuted, display:"block", marginBottom:4 }}>Notes</label><input style={inp} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optionnel"/></div>
            <button onClick={ajouter} disabled={saving} style={{ padding:"10px 18px", borderRadius:10, background:"#0A84FF", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{saving?"⏳":"✅"}</button>
          </div>
        </div>
      )}

      {/* IMPORT MASSE */}
      {showBulk&&(
        <div style={{ background:"rgba(191,90,242,0.08)", border:"1px solid rgba(191,90,242,0.25)", borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#BF5AF2", marginBottom:8 }}>📥 Import en masse depuis WhatsApp</div>
          <div style={{ fontSize:12, color:theme.textMuted, marginBottom:10 }}>Un contact par ligne : Mamadou +221 77 123 45 67</div>
          <textarea value={bulkText} onChange={e=>{setBulkText(e.target.value);parseBulk(e.target.value);}} placeholder={"Mamadou +221 77 123 45 67\nFatou 78 456 78 90\n..."} style={{...inp,minHeight:100,resize:"vertical",lineHeight:1.8}}/>
          {bulkParsed.length>0&&<div style={{ fontSize:12, color:"#BF5AF2", fontWeight:700, marginTop:8 }}>{bulkParsed.length} prospects détectés</div>}
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <button onClick={importerTous} disabled={bulkLoading||!bulkParsed.length} style={{ flex:1, padding:"10px", borderRadius:10, background:bulkParsed.length?"#BF5AF2":"rgba(191,90,242,0.3)", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {bulkLoading?"⏳ Import...":(`✅ Importer ${bulkParsed.length} prospects`)}
            </button>
            <button onClick={()=>{setShowBulk(false);setBulkText("");setBulkParsed([]);}} style={{ padding:"10px 20px", borderRadius:10, background:theme.toggleBg, color:theme.text, border:`1px solid ${theme.border}`, cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
          </div>
        </div>
      )}

      {/* TEMPLATES WHATSAPP */}
      {showTemplates&&(
        <div style={{ background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.25)", borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#25D366", marginBottom:12 }}>💬 Modèles de messages</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:8 }}>
            {TEMPLATES.map((t,i)=>(
              <button key={i} onClick={()=>setSelTpl(selTpl===i?null:i)} style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${selTpl===i?"#25D366":theme.border}`, background:selTpl===i?"rgba(37,211,102,0.1)":theme.toggleBg, color:selTpl===i?"#25D366":theme.text, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, textAlign:"left" }}>
                {t.label}
              </button>
            ))}
          </div>
          {selTpl!==null&&(
            <div style={{ marginTop:12, background:theme.toggleBg, borderRadius:11, padding:14, border:`1px solid ${theme.border}` }}>
              <div style={{ fontSize:13, lineHeight:1.8, whiteSpace:"pre-wrap", color:theme.text, marginBottom:10 }}>{TEMPLATES[selTpl].msg(null)}</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>{navigator.clipboard.writeText(TEMPLATES[selTpl].msg(null));showToast("✅ Copié !");}} style={{ padding:"8px 16px", borderRadius:9, background:"#25D366", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>📋 Copier</button>
                <a href={`https://wa.me/?text=${encodeURIComponent(TEMPLATES[selTpl].msg(null))}`} target="_blank" rel="noreferrer" style={{ padding:"8px 16px", borderRadius:9, background:"rgba(37,211,102,0.15)", color:"#25D366", border:"1px solid rgba(37,211,102,0.3)", fontWeight:700, fontSize:12, textDecoration:"none" }}>📲 WhatsApp</a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:10, marginBottom:16 }}>
        {[
          {label:"Total",    value:total,     color:"#0A84FF", icon:"👥", f:()=>setFiltre("tous")},
          {label:"Nouveaux", value:prospects.filter(p=>p.statut==="Nouveau").length, color:"#0A84FF", icon:"🆕", f:()=>setFiltre("Nouveau")},
          {label:"En cours", value:prospects.filter(p=>["En discussion","Devis envoyé"].includes(p.statut)).length, color:"#FF9F0A", icon:"💬", f:()=>setFiltre("En discussion")},
          {label:"Vendus",   value:vendus,    color:"#30D158", icon:"✅", f:()=>setFiltre("Vendu")},
          {label:"Taux conv.",value:taux+"%", color:"#BF5AF2", icon:"📈", f:()=>{}},
          {label:"Relances", value:relances.length, color:"#FF453A", icon:"🔔", f:()=>setFiltre("relances")},
        ].map(s=>(
          <div key={s.label} onClick={s.f} style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:14, padding:"13px 14px", cursor:"pointer" }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ALERTE RELANCES */}
      {relances.length>0&&(
        <div onClick={()=>setFiltre("relances")} style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", borderRadius:12, padding:"11px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
          <span style={{ fontSize:20 }}>🔔</span>
          <div><div style={{ fontWeight:700, color:"#FF453A", fontSize:13 }}>{relances.length} relance{relances.length>1?"s":""} à faire !</div>
          <div style={{ fontSize:11, color:theme.textMuted }}>{relances.slice(0,3).map(r=>r.nom).join(", ")}</div></div>
        </div>
      )}

      {/* VUES */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", gap:4, background:theme.toggleBg, border:`1px solid ${theme.border}`, borderRadius:10, padding:4 }}>
          {[["liste","📋 Liste"],["kanban","🗂 Kanban"]].map(([id,l])=>(
            <button key={id} onClick={()=>setVue(id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", background:vue===id?"#0A84FF":"transparent", color:vue===id?"#fff":theme.textMuted, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700 }}>{l}</button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{...inp,flex:1,minWidth:150,padding:"8px 12px"}}/>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["tous",...STATUTS,"relances"].map(s=>(
            <button key={s} onClick={()=>setFiltre(s)} style={{ padding:"6px 11px", borderRadius:9, border:`1px solid ${filtre===s?"#0A84FF":theme.border}`, background:filtre===s?"rgba(10,132,255,0.15)":"transparent", color:filtre===s?"#0A84FF":theme.textMuted, cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:600 }}>
              {s==="tous"?"Tous":s==="relances"?"🔔":s}
            </button>
          ))}
        </div>
      </div>

      {/* VUE LISTE */}
      {vue==="liste"&&(loading?<div style={{ textAlign:"center", padding:"3rem", color:theme.textMuted }}>⏳ Chargement...</div>:(
        <div style={{ display:"grid", gap:8 }}>
          {filtres.length===0&&<div style={{ textAlign:"center", padding:"3rem", color:theme.textMuted }}>Aucun prospect</div>}
          {filtres.map(p=>{
            const sc=SC[p.statut]||SC["Nouveau"];
            const rd=relances.find(r=>r.id===p.id);
            return (
              <div key={p.id} onClick={()=>{setModal(p);setNoteInput("");}} style={{ background:theme.card, border:`1px solid ${rd?"rgba(255,69,58,0.4)":theme.border}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", flexWrap:"wrap" }}>
                <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:theme.text }}>{p.nom}{rd&&<span style={{ fontSize:10, background:"rgba(255,69,58,0.15)", color:"#FF453A", border:"1px solid rgba(255,69,58,0.3)", borderRadius:99, padding:"2px 7px", marginLeft:8 }}>🔔</span>}</div>
                <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>📞 {p.telephone} · {p.produit} · {p.source}</div></div>
                <span style={{ fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:99, background:sc.bg, color:sc.color }}>{sc.icon} {p.statut}</span>
              </div>
            );
          })}
        </div>
      ))}

      {/* VUE KANBAN */}
      {vue==="kanban"&&(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,minmax(160px,1fr))", gap:12, overflowX:"auto" }}>
          {STATUTS.map(statut=>{
            const sc=SC[statut];
            const col=filtres.filter(p=>p.statut===statut);
            return (
              <div key={statut} onDragOver={e=>{e.preventDefault();setDragOver(statut);}} onDragLeave={()=>setDragOver(null)}
                onDrop={e=>{e.preventDefault();const id=Number(e.dataTransfer.getData("pid"));if(id)majStatut(id,statut);setDragOver(null);}}
                style={{ background:dragOver===statut?sc.bg:theme.card, border:`2px solid ${dragOver===statut?sc.color:theme.border}`, borderRadius:14, padding:12, minHeight:200 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:sc.color }}>{sc.icon} {statut}</div>
                  <span style={{ fontSize:11, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, borderRadius:99, padding:"2px 8px", fontWeight:700 }}>{col.length}</span>
                </div>
                {col.map(p=>(
                  <div key={p.id} draggable onDragStart={e=>e.dataTransfer.setData("pid",p.id)} onClick={()=>{setModal(p);setNoteInput("");}}
                    style={{ background:theme.toggleBg, border:`1px solid ${theme.border}`, borderRadius:10, padding:"10px 12px", cursor:"grab", marginBottom:7 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:theme.text }}>{p.nom}</div>
                    <div style={{ fontSize:11, color:theme.textMuted }}>{p.telephone}</div>
                    <div style={{ fontSize:10, color:sc.color, marginTop:4, fontWeight:600 }}>{p.produit}</div>
                  </div>
                ))}
                {col.length===0&&<div style={{ textAlign:"center", padding:"16px 0", color:theme.textMuted, fontSize:11 }}>Glissez ici</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      {modal&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
          <div style={{ background:theme.card, borderRadius:20, padding:24, width:"100%", maxWidth:500, maxHeight:"90vh", overflowY:"auto", border:`1px solid ${theme.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div><div style={{ fontWeight:800, fontSize:20, color:theme.text }}>{modal.nom}</div><div style={{ fontSize:13, color:theme.textMuted }}>📞 {modal.telephone} · {modal.produit}</div></div>
              <button onClick={()=>setModal(null)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:theme.textMuted }}>✕</button>
            </div>
            {/* Statut */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:theme.textMuted, marginBottom:8, textTransform:"uppercase" }}>Statut</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {STATUTS.map(s=>{const sc=SC[s];return(
                  <button key={s} onClick={()=>majStatut(modal.id,s)} style={{ padding:"6px 12px", borderRadius:99, border:`1px solid ${modal.statut===s?sc.color:theme.border}`, background:modal.statut===s?sc.bg:"transparent", color:modal.statut===s?sc.color:theme.textMuted, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700 }}>
                    {sc.icon} {s}
                  </button>
                );})}
              </div>
            </div>
            {/* Relances */}
            <div style={{ marginBottom:14, background:"rgba(10,132,255,0.08)", border:"1px solid rgba(10,132,255,0.2)", borderRadius:12, padding:"12px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#0A84FF", marginBottom:8 }}>🔔 PROGRAMMER UNE RELANCE</div>
              <div style={{ display:"flex", gap:8 }}>
                {[2,7,30].map(j=>(
                  <button key={j} onClick={async()=>{
                    const d=new Date(); d.setDate(d.getDate()+j);
                    await fetch(`${SURL}/rest/v1/prospects?id=eq.${modal.id}`,{method:"PATCH",headers:H,body:JSON.stringify({prochaine_relance:d.toISOString()})});
                    setProspects(p=>p.map(x=>x.id===modal.id?{...x,prochaine_relance:d.toISOString()}:x));
                    setModal(prev=>({...prev,prochaine_relance:d.toISOString()}));
                    showToast(`🔔 Relance J+${j} programmée !`);
                  }} style={{ flex:1, padding:"8px", borderRadius:9, background:"rgba(10,132,255,0.1)", border:"1px solid rgba(10,132,255,0.25)", color:"#0A84FF", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700 }}>J+{j}</button>
                ))}
              </div>
              {modal.prochaine_relance&&<div style={{ fontSize:11, color:theme.textMuted, marginTop:6 }}>📅 Prochaine: {new Date(modal.prochaine_relance).toLocaleDateString("fr-FR")}</div>}
            </div>
            {/* Note */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:theme.textMuted, marginBottom:8, textTransform:"uppercase" }}>Ajouter une note</div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ajouterNote(modal)} placeholder="Note..." style={{...inp,flex:1}}/>
                <button onClick={()=>ajouterNote(modal)} style={{ background:"#0A84FF", color:"#fff", border:"none", padding:"10px 14px", borderRadius:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>+</button>
              </div>
            </div>
            {/* Historique */}
            {JSON.parse(modal.historique||"[]").length>0&&(
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:theme.textMuted, marginBottom:8, textTransform:"uppercase" }}>Historique</div>
                {[...JSON.parse(modal.historique||"[]")].reverse().map((h,i)=>(
                  <div key={i} style={{ background:theme.toggleBg, borderRadius:9, padding:"8px 12px", marginBottom:5, display:"flex", gap:10 }}>
                    <div style={{ fontSize:10, color:theme.textMuted, flexShrink:0 }}>{h.date}</div>
                    <div><div style={{ fontSize:11, fontWeight:700, color:"#0A84FF" }}>{h.action}</div>{h.note&&<div style={{ fontSize:12, color:theme.text }}>{h.note}</div>}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Messages WhatsApp */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:theme.textMuted, marginBottom:8, textTransform:"uppercase" }}>📲 Messages WhatsApp</div>
              {TEMPLATES.map((t,i)=>(
                <button key={i} onClick={()=>window.open(`https://wa.me/${modal.telephone?.replace(/[\s+]/g,"")}?text=${encodeURIComponent(t.msg(modal))}`,"_blank")}
                  style={{ display:"block", width:"100%", marginBottom:6, padding:"9px 12px", borderRadius:10, background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.2)", color:"#25D366", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, textAlign:"left" }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <a href={`https://wa.me/${modal.telephone?.replace(/[\s+]/g,"")}`} target="_blank" rel="noreferrer" style={{ display:"block", textAlign:"center", background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.3)", color:"#25D366", padding:"11px", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none" }}>💬 WhatsApp</a>
              <button onClick={()=>supprimer(modal.id)} style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", color:"#FF453A", padding:"11px", borderRadius:12, fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>🗑 Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ANALYSE & CONSEILS
const Analyse = ({ ventes, stock, depenses, factures }) => {
  const { theme } = useContext(ThemeCtx);
  const [conseil, setConseil] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculs
  const ca = ventes.reduce((s,v)=>s+Number(v.prix_vente)*Number(v.qte||1),0);
  const dep = depenses.reduce((s,d)=>s+Number(d.montant),0);
  const benefice = ca - dep;
  const marge = ca > 0 ? Math.round((benefice/ca)*100) : 0;

  // Ventes par produit
  const parProduit = {};
  ventes.forEach(v=>{
    if(!parProduit[v.produit]) parProduit[v.produit]={nom:v.produit,qte:0,ca:0};
    parProduit[v.produit].qte += Number(v.qte||1);
    parProduit[v.produit].ca += Number(v.prix_vente)*Number(v.qte||1);
  });
  const topProduits = Object.values(parProduit).sort((a,b)=>b.ca-a.ca);
  const meilleur = topProduits[0];
  const moinsVendu = topProduits[topProduits.length-1];

  // Ventes par mois
  const parMois = {};
  ventes.forEach(v=>{
    const m = v.date?v.date.slice(0,7):new Date(v.created_at).toISOString().slice(0,7);
    if(!parMois[m]) parMois[m]={mois:m,ca:0,qte:0};
    parMois[m].ca += Number(v.prix_vente)*Number(v.qte||1);
    parMois[m].qte += Number(v.qte||1);
  });
  const moisList = Object.values(parMois).sort((a,b)=>a.mois.localeCompare(b.mois));
  const maxCA = Math.max(...moisList.map(m=>m.ca),1);
  const dernierMois = moisList[moisList.length-1];
  const avantDernierMois = moisList[moisList.length-2];
  const evolutionCA = avantDernierMois ? Math.round(((dernierMois?.ca||0)-(avantDernierMois?.ca||0))/(avantDernierMois?.ca||1)*100) : 0;

  // Ventes par catégorie
  const parCat = {};
  ventes.forEach(v=>{
    const cat = v.cat||"Autre";
    if(!parCat[cat]) parCat[cat]={cat,ca:0,qte:0};
    parCat[cat].ca += Number(v.prix_vente)*Number(v.qte||1);
    parCat[cat].qte += Number(v.qte||1);
  });
  const topCats = Object.values(parCat).sort((a,b)=>b.ca-a.ca);

  // Dépenses par catégorie
  const parDepCat = {};
  depenses.forEach(d=>{
    if(!parDepCat[d.cat]) parDepCat[d.cat]=0;
    parDepCat[d.cat] += Number(d.montant);
  });

  // Stock mort (qte=0 depuis longtemps)
  const stockMort = stock.filter(p=>Number(p.qte)===0);

  // Générer conseil IA
  const genererConseil = async () => {
    setLoading(true);
    const context = `
Tu es un conseiller business expert pour ANGY COMPANY, une boutique tech à Dakar, Sénégal.
Voici les données de l'entreprise :
- Chiffre d'affaires total : ${ca.toLocaleString("fr-FR")} FCFA
- Dépenses totales : ${dep.toLocaleString("fr-FR")} FCFA
- Bénéfice net : ${benefice.toLocaleString("fr-FR")} FCFA
- Marge : ${marge}%
- Évolution CA dernier mois : ${evolutionCA > 0 ? "+"+evolutionCA : evolutionCA}%
- Produit le plus vendu : ${meilleur?.nom||"—"} (${meilleur?.qte||0} vendus, ${meilleur?.ca?.toLocaleString("fr-FR")||0} FCFA)
- Produit le moins vendu : ${moinsVendu?.nom||"—"} (${moinsVendu?.qte||0} vendus)
- Produits à stock zéro : ${stockMort.length} (${stockMort.slice(0,3).map(p=>p.nom).join(", ")})
- Nombre total de ventes : ${ventes.length}
- Catégories les plus vendues : ${topCats.slice(0,3).map(c=>`${c.cat} (${c.ca.toLocaleString("fr-FR")} FCFA)`).join(", ")}

Donne 5 conseils très pratiques et concrets pour améliorer les ventes et la rentabilité. Sois direct, spécifique et adapté au marché sénégalais. Réponds en français, de manière claire et actionnable. Format : liste numérotée avec titre en gras.`;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          messages:[{role:"user",content:context}]
        })
      });
      const d = await r.json();
      setConseil(d.content?.[0]?.text||"Impossible de générer des conseils pour le moment.");
    } catch {
      // Conseils automatiques sans IA
      const conseils = [];
      if(marge < 20) conseils.push("⚠️ **Marge faible ("+marge+"%)** — Augmentez vos prix de vente de 10-15% ou négociez mieux vos prix d'achat.");
      if(evolutionCA < 0) conseils.push("📉 **CA en baisse ("+evolutionCA+"%)** — Relancez vos prospects inactifs dans le CRM avec une offre promotionnelle.");
      if(stockMort.length > 0) conseils.push("💀 **"+stockMort.length+" produits à stock zéro** — Réapprovisionnez en priorité : "+stockMort.slice(0,2).map(p=>p.nom).join(", ")+".");
      if(meilleur) conseils.push("🏆 **"+meilleur.nom+" est votre bestseller** — Maintenez toujours du stock et créez des promotions autour de ce modèle.");
      conseils.push("📱 **Activez les relances WhatsApp** — Contactez vos prospects J+2 et J+7, le taux de conversion double avec les relances.");
      setConseil(conseils.join("\n\n"));
    }
    setLoading(false);
  };

  const nb = (v,c) => <span style={{fontWeight:800,color:c,fontSize:18}}>{v}</span>;
  const card = (icon,label,val,color,sub) => (
    <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:"16px 14px"}}>
      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
      <div style={{fontSize:22,fontWeight:800,color}}>{val}</div>
      <div style={{fontSize:12,color:theme.textMuted,marginTop:3}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:color,marginTop:4,fontWeight:600}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{padding:"20px 16px",maxWidth:1100,margin:"0 auto"}}>
      <div style={{fontSize:22,fontWeight:800,color:theme.text,marginBottom:4}}>📊 Analyse & Conseils</div>
      <div style={{fontSize:13,color:theme.textMuted,marginBottom:20}}>Vue complète de vos performances</div>

      {/* CARTES PRINCIPALES */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24}}>
        {card("💰","Chiffre d'affaires",ca.toLocaleString("fr-FR")+" F","#30D158")}
        {card("📤","Dépenses totales",dep.toLocaleString("fr-FR")+" F","#FF453A")}
        {card("📈","Bénéfice net",benefice.toLocaleString("fr-FR")+" F",benefice>=0?"#30D158":"#FF453A")}
        {card("🎯","Marge",marge+"%",marge>30?"#30D158":marge>15?"#FF9F0A":"#FF453A",marge<20?"⚠️ Marge faible":marge>30?"✅ Excellente":"👍 Correcte")}
        {card("🛒","Nombre de ventes",ventes.length,"#0A84FF")}
        {card("📅","Évolution CA",(evolutionCA>=0?"+":"")+evolutionCA+"%",evolutionCA>=0?"#30D158":"#FF453A","vs mois précédent")}
      </div>

      {/* GRAPHIQUE MENSUEL */}
      {moisList.length>0&&(
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:20,marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:16}}>📈 Évolution mensuelle du CA</div>
          <div style={{display:"flex",gap:10,alignItems:"flex-end",height:150}}>
            {moisList.map(m=>(
              <div key={m.mois} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <div style={{fontSize:10,color:theme.textMuted,fontWeight:600}}>{(m.ca/1000).toFixed(0)}k</div>
                <div style={{width:"100%",background:m===dernierMois?"#30D158":"#0A84FF",borderRadius:"6px 6px 0 0",height:`${Math.round((m.ca/maxCA)*120)}px`,minHeight:4,opacity:m===dernierMois?1:0.7}}/>
                <div style={{fontSize:10,color:theme.textMuted}}>{m.mois.slice(5)}/{m.mois.slice(2,4)}</div>
                <div style={{fontSize:10,color:theme.textMuted}}>{m.qte} vente{m.qte>1?"s":""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP PRODUITS + CATÉGORIES */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:14}}>🏆 Top produits vendus</div>
          {topProduits.length===0&&<div style={{color:theme.textMuted,fontSize:13}}>Aucune vente</div>}
          {topProduits.slice(0,6).map((p,i)=>(
            <div key={p.nom} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:600,color:theme.text}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"  "} {p.nom}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#0A84FF"}}>{p.ca.toLocaleString("fr-FR")} F</span>
              </div>
              <div style={{height:6,background:theme.toggleBg,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round((p.ca/(topProduits[0]?.ca||1))*100)}%`,background:i===0?"#30D158":"#0A84FF",borderRadius:99}}/>
              </div>
              <div style={{fontSize:10,color:theme.textMuted,marginTop:2}}>{p.qte} vendu{p.qte>1?"s":""}</div>
            </div>
          ))}
        </div>

        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:theme.text,marginBottom:14}}>📦 Ventes par catégorie</div>
          {topCats.length===0&&<div style={{color:theme.textMuted,fontSize:13}}>Aucune vente</div>}
          {topCats.map((c,i)=>(
            <div key={c.cat} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:600,color:theme.text}}>{c.cat}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#BF5AF2"}}>{c.ca.toLocaleString("fr-FR")} F</span>
              </div>
              <div style={{height:6,background:theme.toggleBg,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round((c.ca/(topCats[0]?.ca||1))*100)}%`,background:"#BF5AF2",borderRadius:99}}/>
              </div>
              <div style={{fontSize:10,color:theme.textMuted,marginTop:2}}>{c.qte} vendu{c.qte>1?"s":""}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ALERTES */}
      <div style={{display:"grid",gap:10,marginBottom:20}}>
        {marge<20&&(
          <div style={{background:"rgba(255,69,58,0.08)",border:"1px solid rgba(255,69,58,0.3)",borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:24}}>⚠️</span>
            <div><div style={{fontWeight:700,color:"#FF453A",fontSize:13}}>Marge trop faible — {marge}%</div><div style={{fontSize:12,color:theme.textMuted}}>Augmentez vos prix de vente ou réduisez vos dépenses</div></div>
          </div>
        )}
        {evolutionCA<0&&(
          <div style={{background:"rgba(255,159,10,0.08)",border:"1px solid rgba(255,159,10,0.3)",borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:24}}>📉</span>
            <div><div style={{fontWeight:700,color:"#FF9F0A",fontSize:13}}>CA en baisse de {Math.abs(evolutionCA)}% ce mois</div><div style={{fontSize:12,color:theme.textMuted}}>Relancez vos prospects dans le CRM</div></div>
          </div>
        )}
        {stockMort.length>0&&(
          <div style={{background:"rgba(142,142,147,0.08)",border:`1px solid ${theme.border}`,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:24}}>💀</span>
            <div><div style={{fontWeight:700,color:theme.textMuted,fontSize:13}}>{stockMort.length} produit{stockMort.length>1?"s":""} à stock zéro</div><div style={{fontSize:12,color:theme.textMuted}}>{stockMort.slice(0,3).map(p=>p.nom).join(", ")}</div></div>
          </div>
        )}
        {meilleur&&(
          <div style={{background:"rgba(48,209,88,0.08)",border:"1px solid rgba(48,209,88,0.3)",borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:24}}>🏆</span>
            <div><div style={{fontWeight:700,color:"#30D158",fontSize:13}}>Bestseller : {meilleur.nom}</div><div style={{fontSize:12,color:theme.textMuted}}>{meilleur.qte} vendu{meilleur.qte>1?"s":""} · {meilleur.ca.toLocaleString("fr-FR")} FCFA de CA</div></div>
          </div>
        )}
      </div>

      {/* CONSEILS IA */}
      <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:conseil?16:0}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:theme.text}}>🤖 Conseils personnalisés</div>
            <div style={{fontSize:12,color:theme.textMuted,marginTop:2}}>Analyse IA basée sur vos données réelles</div>
          </div>
          <button onClick={genererConseil} disabled={loading} style={{background:"linear-gradient(135deg,#1400FF,#0066FF)",color:"#fff",border:"none",padding:"10px 20px",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(10,132,255,0.3)"}}>
            {loading?"⏳ Analyse...":"✨ Analyser et conseiller"}
          </button>
        </div>
        {conseil&&(
          <div style={{background:theme.toggleBg,borderRadius:12,padding:16,border:`1px solid ${theme.border}`}}>
            {conseil.split("\n\n").map((para,i)=>(
              <div key={i} style={{marginBottom:12,fontSize:13,lineHeight:1.8,color:theme.text}}
                dangerouslySetInnerHTML={{__html:para.replace(/\*\*(.*?)\*\*/g,'<strong style="color:#0A84FF">$1</strong>').replace(/^(\d+\.)/,'<span style="color:#0A84FF;font-weight:800">$1</span>')}}>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// APP PRINCIPALE
export default function App() {
  const [dark,setDark] = useState(window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = dark ? DARK : LIGHT;
  const [user,setUser] = useState(()=>{ try{return JSON.parse(localStorage.getItem("angy_user"));}catch{return null;} });
  const [page,setPage] = useState("dashboard");
  const [stock,setStock] = useState([]);
  const [ventes,setVentes] = useState([]);
  const [factures,setFactures] = useState([]);
  const [depenses,setDepenses] = useState([]);
  const [loading,setLoading] = useState(true);
  const [toast,setToast] = useState(null);
  const [ventePrefill,setVentePrefill] = useState(null);
  const [showFacturePopup,setShowFacturePopup] = useState(false);
  const [isOnline,setIsOnline] = useState(navigator.onLine);
  const [pendingSync,setPendingSync] = useState(0);

  // ─── PWA SERVICE WORKER ───────────────────────────────────────────────────
  useEffect(()=>{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js').catch(()=>{});
    }
  },[]);

  // ─── ONLINE/OFFLINE DETECTION + AUTO SYNC ────────────────────────────────
  useEffect(()=>{
    const goOnline = async () => {
      setIsOnline(true);
      const q = getQueue();
      if(q.length > 0){
        const ok = await syncQueue();
        if(ok){
          // Refresh data after sync
          const [s,v,f,d] = await Promise.all([db.get("stock"),db.get("ventes"),db.get("factures"),db.get("depenses")]);
          setStock(s); setVentes(v); setFactures(f); setDepenses(d);
          setPendingSync(0);
          showToast("✅ Synchronisation réussie !");
        }
      }
    };
    const goOffline = () => { setIsOnline(false); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  },[]);

  // Track pending items
  useEffect(()=>{ setPendingSync(getQueue().length); },[stock,ventes,depenses,factures]);

  const showToast = (msg,err=false) => { setToast({msg,err}); setTimeout(()=>setToast(null),3000); };

  useEffect(()=>{
    if(!user) return;
    setLoading(true);
    Promise.all([db.get("stock"),db.get("ventes"),db.get("factures"),db.get("depenses")])
      .then(([s,v,f,d])=>{ setStock(s); setVentes(v); setFactures(f); setDepenses(d); })
      .catch(()=>{}).finally(()=>setLoading(false));
  },[user]);

  const logout = () => { localStorage.removeItem("angy_user"); window.location.reload(); };

  const NAV = [
    {id:"dashboard", label:"Dashboard",  icon:"📊"},
    {id:"stock",     label:"Stock",      icon:"📦", roles:["admin","vendeur"]},
    {id:"ventes",    label:"Ventes",     icon:"🛒", roles:["admin","vendeur"]},
    {id:"factures",  label:"Factures",   icon:"🧾", roles:["admin","vendeur"]},
    {id:"depenses",  label:"Dépenses",   icon:"📤", roles:["admin","comptable"]},
    {id:"crm",       label:"CRM",        icon:"🎯", roles:["admin","vendeur"]},
    {id:"catalogue", label:"Catalogue",  icon:"💰", roles:["admin","vendeur"]},
    {id:"analyse",   label:"Analyse",    icon:"📊", roles:["admin","comptable"]},
  ].filter(n=>!n.roles||n.roles.includes(user?.role));

  return (
    <ThemeCtx.Provider value={{dark,toggle:()=>setDark(d=>!d),theme}}>
      {!user?<Login onLogin={u=>setUser(u)}/>:(
        <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
          {/* OFFLINE BANNER */}
          {!isOnline&&(
            <div style={{ background:"#FF9F0A", color:"#fff", padding:"8px 16px", textAlign:"center", fontSize:13, fontWeight:700 }}>
              📵 Mode hors ligne — vos données sont sauvegardées localement{pendingSync>0?` (${pendingSync} en attente)`:""}
            </div>
          )}
          {isOnline&&pendingSync>0&&(
            <div style={{ background:"#30D158", color:"#fff", padding:"6px 16px", textAlign:"center", fontSize:12, fontWeight:700 }}>
              🔄 Synchronisation en cours... {pendingSync} élément{pendingSync>1?"s":""} à envoyer
            </div>
          )}
          {/* HEADER */}
          <div style={{ background:theme.nav, borderBottom:`1px solid ${theme.border}`, padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, position:"sticky", top:0, zIndex:100 }}>
            <Logo size={40}/>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:12, color:theme.textMuted, fontWeight:600 }}>{user?.nom}</span>
              <span style={{ fontSize:16 }}>{isOnline?"🟢":"🔴"}</span>
              <button onClick={()=>setDark(d=>!d)} style={{ background:theme.toggleBg, border:`1px solid ${theme.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:16 }}>{dark?"☀️":"🌙"}</button>
              <button onClick={logout} style={{ background:"rgba(255,69,58,0.1)", border:"1px solid rgba(255,69,58,0.3)", color:"#FF453A", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>Déco</button>
            </div>
          </div>
          {/* NAV */}
          <div style={{ background:theme.nav, borderBottom:`1px solid ${theme.border}`, padding:"0 16px", display:"flex", gap:4, overflowX:"auto" }}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{ padding:"12px 16px", border:"none", background:"transparent", color:page===n.id?"#0A84FF":theme.textMuted, fontWeight:page===n.id?700:500, fontSize:13, cursor:"pointer", fontFamily:"inherit", borderBottom:page===n.id?"2px solid #0A84FF":"2px solid transparent", whiteSpace:"nowrap" }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>
          {/* CONTENT */}
          {loading?(
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", color:theme.textMuted }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:40, marginBottom:12 }}>⏳</div><div>Chargement...</div></div>
            </div>
          ):(
            <>
              {page==="dashboard" &&<Dashboard stock={stock} ventes={ventes} factures={factures} depenses={depenses}/>}
              {page==="stock"     &&<Stock     stock={stock} setStock={setStock} showToast={showToast} role={user?.role}/>}
              {page==="ventes"    &&<Ventes    ventes={ventes} setVentes={setVentes} stock={stock} showToast={showToast} role={user?.role} onVenteAdded={(v)=>{setVentePrefill(v);setShowFacturePopup(true);}}/>}
              {page==="factures"  &&<Factures  factures={factures} setFactures={setFactures} stock={stock} showToast={showToast} role={user?.role} ventePrefill={ventePrefill} setVentePrefill={setVentePrefill}/>}
              {/* POPUP CRÉER FACTURE */}
              {showFacturePopup&&(
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
                  <div style={{ background:theme.card, borderRadius:20, padding:28, maxWidth:380, width:"90%", border:`1px solid ${theme.border}`, textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>🧾</div>
                    <div style={{ fontSize:18, fontWeight:800, color:theme.text, marginBottom:8 }}>Créer une facture ?</div>
                    <div style={{ fontSize:13, color:theme.textMuted, marginBottom:24 }}>Voulez-vous créer une facture pour cette vente ? Les détails seront pré-remplis automatiquement.</div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={()=>{setShowFacturePopup(false);setPage("factures");}} style={{ flex:1, padding:"12px", borderRadius:12, background:"#0A84FF", color:"#fff", border:"none", fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>✅ Oui, créer</button>
                      <button onClick={()=>{setShowFacturePopup(false);setVentePrefill(null);}} style={{ flex:1, padding:"12px", borderRadius:12, background:theme.toggleBg, color:theme.text, border:`1px solid ${theme.border}`, fontWeight:600, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>Non merci</button>
                    </div>
                  </div>
                </div>
              )}
              {page==="depenses"  &&<Depenses  depenses={depenses} setDepenses={setDepenses} setStock={setStock} showToast={showToast} role={user?.role}/>}
              {page==="crm"       &&<CRM       showToast={showToast}/>}
              {page==="catalogue" &&<Catalogue showToast={showToast} stock={stock} setStock={setStock}/>}
              {page==="analyse"   &&<Analyse   ventes={ventes} stock={stock} depenses={depenses} factures={factures}/>}
            </>
          )}
          {toast&&<Toast msg={toast.msg} err={toast.err}/>}
        </div>
      )}
    </ThemeCtx.Provider>
  );
}
