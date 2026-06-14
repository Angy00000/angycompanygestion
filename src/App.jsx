import { useState, useEffect, useContext, createContext } from "react";

// ─── CONFIG SUPABASE ──────────────────────────────────────────────────────────
const SURL = "https://nfpnhyvuwpzezwbmxtgd.supabase.co";
const SKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcG5oeXZ1d3B6ZXp3Ym14dGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODU5NTAsImV4cCI6MjA5NjE2MTk1MH0.u9ptkVSXwgT75m9WgRLsUnygEJGYK4ESyv6jBUeNtO4";
const H = {
  "apikey": SKEY,
  "Authorization": `Bearer ${SKEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

// ─── DB FUNCTIONS ─────────────────────────────────────────────────────────────
const db = {
  get: async (table) => {
    const r = await fetch(`${SURL}/rest/v1/${table}?order=created_at.desc&limit=500`, { headers: H });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  },
  add: async (table, data) => {
    const r = await fetch(`${SURL}/rest/v1/${table}`, { method: "POST", headers: H, body: JSON.stringify(data) });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  },
  del: async (table, id) => {
    await fetch(`${SURL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: H });
  },
  patch: async (table, id, data) => {
    await fetch(`${SURL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(data) });
  }
};

// ─── THEME ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext();
const LIGHT = { bg: "#F2F2F7", card: "#FFFFFF", text: "#1C1C1E", textMuted: "#8E8E93", border: "#E5E5EA", toggleBg: "#F2F2F7", nav: "#FFFFFF", input: "#FFFFFF" };
const DARK  = { bg: "#1C1C1E", card: "#2C2C2E", text: "#FFFFFF", textMuted: "#8E8E93", border: "#3A3A3C", toggleBg: "#3A3A3C", nav: "#2C2C2E", input: "#3A3A3C" };

// ─── LOGO ─────────────────────────────────────────────────────────────────────
const Logo = ({ size = 40 }) => {
  const scale = size / 100;
  const W = Math.round(420 * scale);
  const { dark } = useContext(ThemeCtx);
  const tc = dark ? "#fff" : "#1C1C1E";
  return (
    <svg height={size} width={W} viewBox="0 0 420 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1400FF"/><stop offset="100%" stopColor="#0066FF"/></linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#CC0000"/><stop offset="100%" stopColor="#FF2200"/></linearGradient>
      </defs>
      <rect x="10" y="15" width="12" height="70" rx="3" fill="url(#lg1)"/>
      <rect x="10" y="73" width="58" height="12" rx="3" fill="url(#lg1)"/>
      <rect x="398" y="15" width="12" height="52" rx="3" fill="url(#lg2)"/>
      <rect x="350" y="15" width="60" height="12" rx="3" fill="url(#lg2)"/>
      {[["A",50],["N",90],["G",130],["Y",170]].map(([l,cx])=>(
        <g key={l}>
          <circle cx={cx} cy="50" r="22" fill={dark?"#2C2C2E":"white"} stroke={tc} strokeWidth="2.5"/>
          <text x={cx} y="57" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="20" fill={tc}>{l}</text>
        </g>
      ))}
      <text x="208" y="60" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="32" fill={tc}>Company</text>
    </svg>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const USERS = [
  { id: 1, nom: "Ange Admin", email: "admin@angy.com", mdp: "angy2024", role: "admin" },
  { id: 2, nom: "Vendeur", email: "vendeur@angy.com", mdp: "vendeur2024", role: "vendeur" },
  { id: 3, nom: "Comptable", email: "comptable@angy.com", mdp: "compta2024", role: "comptable" },
];

const Login = ({ onLogin }) => {
  const { theme } = useContext(ThemeCtx);
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [err, setErr] = useState("");
  const connect = () => {
    const u = USERS.find(u => u.email === email.trim() && u.mdp === mdp);
    if (u) { localStorage.setItem("angy_user", JSON.stringify(u)); onLogin(u); }
    else setErr("Email ou mot de passe incorrect");
  };
  return (
    <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: theme.card, borderRadius: 24, padding: 36, width: "100%", maxWidth: 400, border: `1px solid ${theme.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><Logo size={44} /></div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: theme.text }}>Connexion</div>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 24 }}>Accédez à votre espace de gestion</div>
        {err && <div style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)", color: "#FF453A", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{err}</div>}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: 15, fontFamily: "inherit", outline: "none", marginBottom: 12 }} />
        <input value={mdp} onChange={e => setMdp(e.target.value)} placeholder="Mot de passe" type="password"
          onKeyDown={e => e.key === "Enter" && connect()}
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: 15, fontFamily: "inherit", outline: "none", marginBottom: 20 }} />
        <button onClick={connect} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "#0A84FF", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
          Se connecter
        </button>
      </div>
    </div>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, err }) => (
  <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: err ? "#FF453A" : "#30D158", color: "#fff", padding: "12px 24px", borderRadius: 99, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
    {msg}
  </div>
);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ stock, ventes, factures, depenses }) => {
  const { theme } = useContext(ThemeCtx);
  const ca = ventes.reduce((s, v) => s + (Number(v.prix_vente) * Number(v.qte || 1)), 0);
  const dep = depenses.reduce((s, d) => s + Number(d.montant), 0);
  const benefice = ca - dep;
  const stockBas = stock.filter(p => Number(p.qte) <= Number(p.seuil || 3));
  const moisCA = {};
  ventes.forEach(v => {
    const m = v.date ? v.date.slice(0, 7) : new Date(v.created_at).toISOString().slice(0, 7);
    moisCA[m] = (moisCA[m] || 0) + Number(v.prix_vente) * Number(v.qte || 1);
  });
  const moisList = Object.entries(moisCA).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const maxCA = Math.max(...moisList.map(([, v]) => v), 1);
  const cards = [
    { label: "Chiffre d'affaires", value: ca.toLocaleString("fr-FR") + " F", color: "#30D158", icon: "💰" },
    { label: "Dépenses", value: dep.toLocaleString("fr-FR") + " F", color: "#FF453A", icon: "📤" },
    { label: "Bénéfice net", value: benefice.toLocaleString("fr-FR") + " F", color: benefice >= 0 ? "#30D158" : "#FF453A", icon: "📈" },
    { label: "Ventes", value: ventes.length, color: "#0A84FF", icon: "🛒" },
    { label: "Produits en stock", value: stock.length, color: "#BF5AF2", icon: "📦" },
    { label: "Stock bas", value: stockBas.length, color: "#FF9F0A", icon: "⚠️" },
  ];
  return (
    <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 4 }}>📊 Dashboard</div>
      <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>Vue d'ensemble de votre activité</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "16px 14px" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>
      {moisList.length > 0 && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 16 }}>📈 Chiffre d'affaires mensuel</div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 140 }}>
            {moisList.map(([m, v]) => (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600 }}>{(v / 1000).toFixed(0)}k</div>
                <div style={{ width: "100%", background: "#0A84FF", borderRadius: "6px 6px 0 0", height: `${Math.round((v / maxCA) * 110)}px`, minHeight: 4 }} />
                <div style={{ fontSize: 10, color: theme.textMuted }}>{m.slice(5)}/{m.slice(0, 4).slice(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {stockBas.length > 0 && (
        <div style={{ background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.3)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontWeight: 700, color: "#FF9F0A", marginBottom: 10 }}>⚠️ Stock bas — à réapprovisionner</div>
          {stockBas.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${theme.border}`, fontSize: 13, color: theme.text }}>
              <span>{p.nom}</span>
              <span style={{ color: "#FF453A", fontWeight: 700 }}>{p.qte} unité(s)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── STOCK ────────────────────────────────────────────────────────────────────
const Stock = ({ stock, setStock, showToast, role }) => {
  const { theme } = useContext(ThemeCtx);
  const [form, setForm] = useState({ nom: "", cat: "iPhones", qte: "", prix_achat: "", prix_vente: "", seuil: "3" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const CATS = ["iPhones", "Samsung", "Tablettes", "Accessoires", "Ordinateurs", "Autre"];
  const inp = { boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };
  const filtres = stock.filter(p => p.nom?.toLowerCase().includes(search.toLowerCase()));
  const ajouter = async () => {
    if (!form.nom || !form.prix_vente) return showToast("Nom et prix de vente obligatoires", true);
    setLoading(true);
    const data = { nom: form.nom, cat: form.cat, qte: Number(form.qte) || 0, prix_achat: Number(form.prix_achat) || 0, prix_vente: Number(form.prix_vente), seuil: Number(form.seuil) || 3 };
    const newP = await db.add("stock", data);
    if (newP) { setStock(prev => [newP, ...prev]); showToast("✅ Produit ajouté !"); setForm({ nom: "", cat: "iPhones", qte: "", prix_achat: "", prix_vente: "", seuil: "3" }); }
    else showToast("Erreur — vérifiez votre connexion", true);
    setLoading(false);
  };
  const supprimer = async (id) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    await db.del("stock", id);
    setStock(prev => prev.filter(p => p.id !== id));
    showToast("Supprimé");
  };
  const majQte = async (id, delta) => {
    const p = stock.find(x => x.id === id);
    if (!p) return;
    const newQte = Math.max(0, Number(p.qte) + delta);
    await db.patch("stock", id, { qte: newQte });
    setStock(prev => prev.map(x => x.id === id ? { ...x, qte: newQte } : x));
  };
  return (
    <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 20 }}>📦 Stock</div>
      {(role === "admin" || role === "vendeur") && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 14 }}>+ Ajouter un produit</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Nom *</label><input style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: iPhone 15 128Go"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Catégorie</label><select style={inp} value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Quantité</label><input type="number" style={inp} value={form.qte} onChange={e => setForm(f => ({ ...f, qte: e.target.value }))} placeholder="0"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Prix achat</label><input type="number" style={inp} value={form.prix_achat} onChange={e => setForm(f => ({ ...f, prix_achat: e.target.value }))} placeholder="0"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Prix vente *</label><input type="number" style={inp} value={form.prix_vente} onChange={e => setForm(f => ({ ...f, prix_vente: e.target.value }))} placeholder="0"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Seuil alerte</label><input type="number" style={inp} value={form.seuil} onChange={e => setForm(f => ({ ...f, seuil: e.target.value }))} placeholder="3"/></div>
            <button onClick={ajouter} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, background: "#0A84FF", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, whiteSpace: "nowrap" }}>
              {loading ? "⏳" : "✅ Ajouter"}
            </button>
          </div>
        </div>
      )}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher un produit..."
        style={{ ...inp, marginBottom: 14, padding: "11px 14px", fontSize: 14 }} />
      <div style={{ display: "grid", gap: 8 }}>
        {filtres.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: theme.textMuted }}>Aucun produit en stock</div>}
        {filtres.map(p => (
          <div key={p.id} style={{ background: theme.card, border: `1px solid ${Number(p.qte) <= Number(p.seuil || 3) ? "rgba(255,159,10,0.5)" : theme.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{p.nom}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>{p.cat} · Achat: {Number(p.prix_achat).toLocaleString("fr-FR")} F · Vente: {Number(p.prix_vente).toLocaleString("fr-FR")} F</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => majQte(p.id, -1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.toggleBg, color: theme.text, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>−</button>
              <span style={{ fontWeight: 800, fontSize: 18, color: Number(p.qte) <= Number(p.seuil || 3) ? "#FF9F0A" : theme.text, minWidth: 28, textAlign: "center" }}>{p.qte}</span>
              <button onClick={() => majQte(p.id, 1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.toggleBg, color: theme.text, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
            </div>
            {(role === "admin" || role === "vendeur") && (
              <button onClick={() => supprimer(p.id)} style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)", color: "#FF453A", padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>🗑</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── VENTES ───────────────────────────────────────────────────────────────────
const Ventes = ({ ventes, setVentes, stock, showToast, role }) => {
  const { theme } = useContext(ThemeCtx);
  const [form, setForm] = useState({ produit: "", cat: "", qte: "1", prix_vente: "", date: new Date().toISOString().slice(0, 10), client: "" });
  const [loading, setLoading] = useState(false);
  const inp = { boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };
  const ajouter = async () => {
    if (!form.produit || !form.prix_vente) return showToast("Produit et prix obligatoires", true);
    setLoading(true);
    const data = { produit: form.produit, cat: form.cat, qte: Number(form.qte) || 1, prix_vente: Number(form.prix_vente), date: form.date, client: form.client || "—" };
    const newV = await db.add("ventes", data);
    if (newV) { setVentes(prev => [newV, ...prev]); showToast("✅ Vente enregistrée !"); setForm({ produit: "", cat: "", qte: "1", prix_vente: "", date: new Date().toISOString().slice(0, 10), client: "" }); }
    else showToast("Erreur — vérifiez votre connexion", true);
    setLoading(false);
  };
  const supprimer = async (id) => {
    if (!window.confirm("Supprimer cette vente ?")) return;
    await db.del("ventes", id);
    setVentes(prev => prev.filter(v => v.id !== id));
    showToast("Supprimé");
  };
  const total = ventes.reduce((s, v) => s + Number(v.prix_vente) * Number(v.qte || 1), 0);
  return (
    <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>🛒 Ventes</div>
        <div style={{ background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.3)", borderRadius: 12, padding: "10px 18px", fontWeight: 700, color: "#30D158" }}>
          CA Total : {total.toLocaleString("fr-FR")} FCFA
        </div>
      </div>
      {(role === "admin" || role === "vendeur") && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 14 }}>+ Nouvelle vente</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Produit *</label>
              <select style={inp} value={form.produit} onChange={e => {
                const p = stock.find(x => x.nom === e.target.value);
                setForm(f => ({ ...f, produit: e.target.value, cat: p?.cat || "", prix_vente: p ? String(p.prix_vente) : "" }));
              }}>
                <option value="">-- Choisir --</option>
                {stock.map(p => <option key={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Qté</label><input type="number" style={inp} value={form.qte} onChange={e => setForm(f => ({ ...f, qte: e.target.value }))} min="1"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Prix vente *</label><input type="number" style={inp} value={form.prix_vente} onChange={e => setForm(f => ({ ...f, prix_vente: e.target.value }))}/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Date</label><input type="date" style={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Client</label><input style={inp} value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Optionnel"/></div>
            <button onClick={ajouter} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, background: "#30D158", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, whiteSpace: "nowrap" }}>
              {loading ? "⏳" : "✅ Ajouter"}
            </button>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {ventes.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: theme.textMuted }}>Aucune vente enregistrée</div>}
        {ventes.map(v => (
          <div key={v.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{v.produit}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
                {v.date} · Qté: {v.qte || 1} · Client: {v.client || "—"}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#30D158" }}>{(Number(v.prix_vente) * Number(v.qte || 1)).toLocaleString("fr-FR")} F</div>
            {role === "admin" && (
              <button onClick={() => supprimer(v.id)} style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)", color: "#FF453A", padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>🗑</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DEPENSES ─────────────────────────────────────────────────────────────────
const Depenses = ({ depenses, setDepenses, showToast, role }) => {
  const { theme } = useContext(ThemeCtx);
  const [form, setForm] = useState({ titre: "", cat: "Achat stock", montant: "", date: new Date().toISOString().slice(0, 10), note: "" });
  const [loading, setLoading] = useState(false);
  const CATS = ["Achat stock", "Transport", "Loyer", "Marketing", "Salaires", "Autre"];
  const inp = { boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };
  const ajouter = async () => {
    if (!form.titre || !form.montant) return showToast("Titre et montant obligatoires", true);
    setLoading(true);
    const data = { titre: form.titre, cat: form.cat, montant: Number(form.montant), date: form.date, note: form.note };
    const newD = await db.add("depenses", data);
    if (newD) { setDepenses(prev => [newD, ...prev]); showToast("✅ Dépense ajoutée !"); setForm({ titre: "", cat: "Achat stock", montant: "", date: new Date().toISOString().slice(0, 10), note: "" }); }
    else showToast("Erreur", true);
    setLoading(false);
  };
  const supprimer = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    await db.del("depenses", id);
    setDepenses(prev => prev.filter(d => d.id !== id));
    showToast("Supprimé");
  };
  const total = depenses.reduce((s, d) => s + Number(d.montant), 0);
  return (
    <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>📤 Dépenses</div>
        <div style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)", borderRadius: 12, padding: "10px 18px", fontWeight: 700, color: "#FF453A" }}>
          Total : {total.toLocaleString("fr-FR")} FCFA
        </div>
      </div>
      {(role === "admin" || role === "comptable") && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 14 }}>+ Nouvelle dépense</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Titre *</label><input style={inp} value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ex: Achat iPhone 15"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Catégorie</label><select style={inp} value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Montant *</label><input type="number" style={inp} value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Date</label><input type="date" style={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}/></div>
            <button onClick={ajouter} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, background: "#FF453A", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
              {loading ? "⏳" : "✅"}
            </button>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {depenses.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: theme.textMuted }}>Aucune dépense</div>}
        {depenses.map(d => (
          <div key={d.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{d.titre}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>{d.cat} · {d.date}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#FF453A" }}>−{Number(d.montant).toLocaleString("fr-FR")} F</div>
            {role === "admin" && (
              <button onClick={() => supprimer(d.id)} style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)", color: "#FF453A", padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>🗑</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── FACTURES ─────────────────────────────────────────────────────────────────
const Factures = ({ factures, setFactures, stock, showToast, role }) => {
  const { theme } = useContext(ThemeCtx);
  const [form, setForm] = useState({ client: "", telephone: "", lignes: [{ produit: "", qte: 1, prix: "" }], date: new Date().toISOString().slice(0, 10), paiement: "Espèces" });
  const [loading, setLoading] = useState(false);
  const inp = { boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };
  const total = form.lignes.reduce((s, l) => s + Number(l.prix || 0) * Number(l.qte || 1), 0);
  const ajouter = async () => {
    if (!form.client) return showToast("Nom client obligatoire", true);
    setLoading(true);
    const num = "FAC-" + Date.now().toString().slice(-6);
    const data = { numero: num, client: form.client, telephone: form.telephone, date: form.date, lignes: JSON.stringify(form.lignes), total, paiement: form.paiement };
    const newF = await db.add("factures", data);
    if (newF) {
      setFactures(prev => [newF, ...prev]);
      showToast("✅ Facture créée !");
      setForm({ client: "", telephone: "", lignes: [{ produit: "", qte: 1, prix: "" }], date: new Date().toISOString().slice(0, 10), paiement: "Espèces" });
    } else showToast("Erreur", true);
    setLoading(false);
  };
  const supprimer = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    await db.del("factures", id);
    setFactures(prev => prev.filter(f => f.id !== id));
    showToast("Supprimé");
  };
  const imprimer = (f) => {
    const lignes = JSON.parse(f.lignes || "[]");
    const html = `<html><head><title>Facture ${f.numero}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto}h1{color:#1400FF}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}.total{font-size:18px;font-weight:bold;margin-top:20px;text-align:right}</style></head><body>
      <h1>ANGY COMPANY</h1>
      <p>Dakar, Sénégal · +221 78 116 32 86</p>
      <hr/>
      <h2>Facture ${f.numero}</h2>
      <p><strong>Client :</strong> ${f.client}<br/><strong>Téléphone :</strong> ${f.telephone || "—"}<br/><strong>Date :</strong> ${f.date}<br/><strong>Paiement :</strong> ${f.paiement}</p>
      <table><tr><th>Produit</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr>
      ${lignes.map(l => `<tr><td>${l.produit}</td><td>${l.qte}</td><td>${Number(l.prix).toLocaleString("fr-FR")} F</td><td>${(Number(l.prix) * Number(l.qte)).toLocaleString("fr-FR")} F</td></tr>`).join("")}
      </table>
      <div class="total">Total : ${Number(f.total).toLocaleString("fr-FR")} FCFA</div>
      <p style="margin-top:40px;font-size:12px;color:#888">Merci pour votre confiance — ANGY COMPANY</p>
      </body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.print();
  };
  return (
    <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 20 }}>🧾 Factures</div>
      {(role === "admin" || role === "vendeur") && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 14 }}>+ Nouvelle facture</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Client *</label><input style={inp} value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Nom du client"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Téléphone</label><input style={inp} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Date</label><input type="date" style={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Paiement</label>
              <select style={inp} value={form.paiement} onChange={e => setForm(f => ({ ...f, paiement: e.target.value }))}>
                {["Espèces", "Wave", "Orange Money", "Free Money", "Virement"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {form.lignes.map((l, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
              <select style={inp} value={l.produit} onChange={e => {
                const p = stock.find(x => x.nom === e.target.value);
                const nl = [...form.lignes]; nl[i] = { ...nl[i], produit: e.target.value, prix: p ? String(p.prix_vente) : nl[i].prix };
                setForm(f => ({ ...f, lignes: nl }));
              }}>
                <option value="">-- Produit --</option>
                {stock.map(p => <option key={p.id}>{p.nom}</option>)}
              </select>
              <input type="number" style={inp} value={l.qte} min="1" onChange={e => { const nl = [...form.lignes]; nl[i] = { ...nl[i], qte: Number(e.target.value) }; setForm(f => ({ ...f, lignes: nl })); }} placeholder="Qté"/>
              <input type="number" style={inp} value={l.prix} onChange={e => { const nl = [...form.lignes]; nl[i] = { ...nl[i], prix: e.target.value }; setForm(f => ({ ...f, lignes: nl })); }} placeholder="Prix"/>
              <button onClick={() => setForm(f => ({ ...f, lignes: f.lignes.filter((_, j) => j !== i) }))} style={{ padding: "10px", borderRadius: 10, background: "rgba(255,69,58,0.1)", color: "#FF453A", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <button onClick={() => setForm(f => ({ ...f, lignes: [...f.lignes, { produit: "", qte: 1, prix: "" }] }))} style={{ padding: "8px 16px", borderRadius: 9, background: "rgba(10,132,255,0.1)", color: "#0A84FF", border: "1px solid rgba(10,132,255,0.3)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>+ Ligne</button>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: theme.text }}>Total : {total.toLocaleString("fr-FR")} FCFA</span>
              <button onClick={ajouter} disabled={loading} style={{ padding: "10px 20px", borderRadius: 10, background: "#0A84FF", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {loading ? "⏳" : "✅ Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {factures.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: theme.textMuted }}>Aucune facture</div>}
        {factures.map(f => (
          <div key={f.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{f.numero} — {f.client}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>{f.date} · {f.paiement}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#0A84FF" }}>{Number(f.total).toLocaleString("fr-FR")} F</div>
            <button onClick={() => imprimer(f)} style={{ background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.3)", color: "#0A84FF", padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>🖨 Imprimer</button>
            {role === "admin" && (
              <button onClick={() => supprimer(f.id)} style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)", color: "#FF453A", padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>🗑</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CRM ─────────────────────────────────────────────────────────────────────
const CRM = ({ showToast }) => {
  const { theme } = useContext(ThemeCtx);
  const SKEY2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcG5oeXZ1d3B6ZXp3Ym14dGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODU5NTAsImV4cCI6MjA5NjE2MTk1MH0.u9ptkVSXwgT75m9WgRLsUnygEJGYK4ESyv6jBUeNtO4";
  const H2 = { "apikey": SKEY2, "Authorization": `Bearer ${SKEY2}`, "Content-Type": "application/json", "Prefer": "return=representation" };
  const STATUTS = ["Nouveau", "En discussion", "Devis envoyé", "Vendu", "Perdu"];
  const SC = { "Nouveau": { bg: "rgba(10,132,255,0.15)", color: "#0A84FF", icon: "🆕" }, "En discussion": { bg: "rgba(255,159,10,0.15)", color: "#FF9F0A", icon: "💬" }, "Devis envoyé": { bg: "rgba(191,90,242,0.15)", color: "#BF5AF2", icon: "📋" }, "Vendu": { bg: "rgba(48,209,88,0.15)", color: "#30D158", icon: "✅" }, "Perdu": { bg: "rgba(255,69,58,0.15)", color: "#FF453A", icon: "❌" } };
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nom: "", telephone: "", produit: "iPhone", source: "WhatsApp", statut: "Nouveau", notes: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [saving, setSaving] = useState(false);
  const inp = { boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };

  useEffect(() => {
    fetch(`${SURL}/rest/v1/prospects?order=created_at.desc&limit=500`, { headers: H2 })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setProspects(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const ajouter = async () => {
    if (!form.nom || !form.telephone) return showToast("Nom et téléphone obligatoires", true);
    setSaving(true);
    const data = { ...form, historique: JSON.stringify([{ date: new Date().toLocaleDateString("fr-FR"), action: "Créé" }]) };
    const r = await fetch(`${SURL}/rest/v1/prospects`, { method: "POST", headers: H2, body: JSON.stringify(data) });
    if (r.ok) {
      const [p] = await r.json();
      setProspects(prev => [p, ...prev]);
      showToast("✅ Prospect ajouté !");
      setForm({ nom: "", telephone: "", produit: "iPhone", source: "WhatsApp", statut: "Nouveau", notes: "" });
      setShowAdd(false);
    } else showToast("Erreur", true);
    setSaving(false);
  };

  const majStatut = async (id, statut) => {
    await fetch(`${SURL}/rest/v1/prospects?id=eq.${id}`, { method: "PATCH", headers: H2, body: JSON.stringify({ statut }) });
    setProspects(p => p.map(x => x.id === id ? { ...x, statut } : x));
    setModal(prev => prev ? { ...prev, statut } : prev);
  };

  const supprimer = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    await fetch(`${SURL}/rest/v1/prospects?id=eq.${id}`, { method: "DELETE", headers: H2 });
    setProspects(p => p.filter(x => x.id !== id));
    setModal(null);
    showToast("Supprimé");
  };

  const filtres = prospects.filter(p => {
    const mf = filtre === "tous" || p.statut === filtre;
    const ms = !search || p.nom?.toLowerCase().includes(search.toLowerCase()) || p.telephone?.includes(search);
    return mf && ms;
  });

  const TEMPLATES = [
    { label: "👋 Premier contact", msg: (p) => `Bonjour ${p?.nom || "[Nom]"} ! 😊\n\nMerci de nous avoir contacté chez ANGY COMPANY.\n\nJe suis Ange, votre conseiller. Quel produit vous intéresse ?\n\nAngy Company — +221 78 116 32 86` },
    { label: "🔔 Relance J+2", msg: (p) => `Bonjour ${p?.nom || "[Nom]"} ! 😊\n\nJe voulais savoir si vous êtes toujours intéressé ?\n\nStock disponible cette semaine !\n\n📞 +221 78 116 32 86` },
    { label: "🔥 Promo flash", msg: (p) => `Bonjour ${p?.nom || "[Nom]"} ! 🔥\n\nOffre spéciale cette semaine chez ANGY COMPANY !\n\n✅ Authentique · 🚚 Livraison Dakar\n💳 Wave · Orange Money · Espèces\n\n📞 +221 78 116 32 86` },
  ];

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>🎯 CRM — Prospects</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: "#0A84FF", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Nouveau prospect
        </button>
      </div>
      {showAdd && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Nom *</label><input style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Mamadou"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Téléphone *</label><input style={inp} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="+221 XX XXX XX XX"/></div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Produit</label>
              <select style={inp} value={form.produit} onChange={e => setForm(f => ({ ...f, produit: e.target.value }))}>
                {["iPhone", "MacBook", "iPad", "Samsung", "Autre"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Source</label>
              <select style={inp} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                {["WhatsApp", "Facebook", "TikTok", "Instagram", "Bouche à oreille", "Autre"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>Notes</label><input style={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optionnel"/></div>
            <button onClick={ajouter} disabled={saving} style={{ padding: "10px 18px", borderRadius: 10, background: "#0A84FF", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {saving ? "⏳" : "✅"}
            </button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{ ...inp, flex: 1, minWidth: 150 }} />
        {["tous", ...STATUTS].map(s => (
          <button key={s} onClick={() => setFiltre(s)} style={{ padding: "7px 12px", borderRadius: 9, border: `1px solid ${filtre === s ? "#0A84FF" : theme.border}`, background: filtre === s ? "rgba(10,132,255,0.15)" : "transparent", color: filtre === s ? "#0A84FF" : theme.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>
            {s === "tous" ? "Tous" : s}
          </button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: "3rem", color: theme.textMuted }}>⏳ Chargement...</div> : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtres.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: theme.textMuted }}>Aucun prospect</div>}
          {filtres.map(p => {
            const sc = SC[p.statut] || SC["Nouveau"];
            return (
              <div key={p.id} onClick={() => setModal(p)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{p.nom}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>📞 {p.telephone} · {p.produit} · {p.source}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 99, background: sc.bg, color: sc.color }}>{sc.icon} {p.statut}</span>
              </div>
            );
          })}
        </div>
      )}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: theme.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: theme.text }}>{modal.nom}</div>
                <div style={{ fontSize: 13, color: theme.textMuted }}>📞 {modal.telephone} · {modal.produit}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: theme.textMuted }}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Statut</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUTS.map(s => { const sc = SC[s]; return (
                  <button key={s} onClick={() => majStatut(modal.id, s)} style={{ padding: "6px 12px", borderRadius: 99, border: `1px solid ${modal.statut === s ? sc.color : theme.border}`, background: modal.statut === s ? sc.bg : "transparent", color: modal.statut === s ? sc.color : theme.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>
                    {sc.icon} {s}
                  </button>
                ); })}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase" }}>📲 Messages WhatsApp rapides</div>
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => window.open(`https://wa.me/${modal.telephone?.replace(/[\s+]/g, "")}?text=${encodeURIComponent(t.msg(modal))}`, "_blank")}
                  style={{ display: "block", width: "100%", marginBottom: 6, padding: "9px 12px", borderRadius: 10, background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, textAlign: "left" }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <a href={`https://wa.me/${modal.telephone?.replace(/[\s+]/g, "")}`} target="_blank" rel="noreferrer"
                style={{ display: "block", textAlign: "center", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366", padding: "11px", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                💬 WhatsApp
              </a>
              <button onClick={() => supprimer(modal.id)} style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)", color: "#FF453A", padding: "11px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                🗑 Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── APP PRINCIPALE ───────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = dark ? DARK : LIGHT;
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("angy_user")); } catch { return null; } });
  const [page, setPage] = useState("dashboard");
  const [stock, setStock] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([db.get("stock"), db.get("ventes"), db.get("factures"), db.get("depenses")])
      .then(([s, v, f, d]) => {
        setStock(s); setVentes(v); setFactures(f); setDepenses(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const logout = () => { localStorage.removeItem("angy_user"); setUser(null); window.location.reload(); };

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "stock", label: "Stock", icon: "📦", roles: ["admin", "vendeur"] },
    { id: "ventes", label: "Ventes", icon: "🛒", roles: ["admin", "vendeur"] },
    { id: "factures", label: "Factures", icon: "🧾", roles: ["admin", "vendeur"] },
    { id: "depenses", label: "Dépenses", icon: "📤", roles: ["admin", "comptable"] },
    { id: "crm", label: "CRM", icon: "🎯", roles: ["admin", "vendeur"] },
  ].filter(n => !n.roles || n.roles.includes(user?.role));

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d), theme }}>
      {!user ? <Login onLogin={u => setUser(u)} /> : (
        <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          {/* HEADER */}
          <div style={{ background: theme.nav, borderBottom: `1px solid ${theme.border}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
            <Logo size={40} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>{user?.nom}</span>
              <button onClick={() => setDark(d => !d)} style={{ background: theme.toggleBg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16 }}>{dark ? "☀️" : "🌙"}</button>
              <button onClick={logout} style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.3)", color: "#FF453A", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>Déconnexion</button>
            </div>
          </div>
          {/* NAV */}
          <div style={{ background: theme.nav, borderBottom: `1px solid ${theme.border}`, padding: "0 16px", display: "flex", gap: 4, overflowX: "auto" }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)}
                style={{ padding: "12px 16px", border: "none", background: "transparent", color: page === n.id ? "#0A84FF" : theme.textMuted, fontWeight: page === n.id ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", borderBottom: page === n.id ? "2px solid #0A84FF" : "2px solid transparent", whiteSpace: "nowrap" }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>
          {/* CONTENT */}
          <div>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: theme.textMuted }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div><div>Chargement...</div></div>
              </div>
            ) : (
              <>
                {page === "dashboard" && <Dashboard stock={stock} ventes={ventes} factures={factures} depenses={depenses} />}
                {page === "stock" && <Stock stock={stock} setStock={setStock} showToast={showToast} role={user?.role} />}
                {page === "ventes" && <Ventes ventes={ventes} setVentes={setVentes} stock={stock} showToast={showToast} role={user?.role} />}
                {page === "factures" && <Factures factures={factures} setFactures={setFactures} stock={stock} showToast={showToast} role={user?.role} />}
                {page === "depenses" && <Depenses depenses={depenses} setDepenses={setDepenses} showToast={showToast} role={user?.role} />}
                {page === "crm" && <CRM showToast={showToast} />}
              </>
            )}
          </div>
          {toast && <Toast msg={toast.msg} err={toast.err} />}
        </div>
      )}
    </ThemeCtx.Provider>
  );
}
