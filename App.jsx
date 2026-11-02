import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Heart, PawPrint, Droplets, Utensils, MapPin, Clock3, ShieldCheck, Plus, LogOut, RefreshCw, ExternalLink } from 'lucide-react'
import { isConfigured, supabase } from './supabase'

const fmt = value => value ? new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : 'Henüz kayıt yok'
function elapsed(value) {
  if (!value) return 'Henüz bildirilmedi'
  const mins = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins} dakika önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} saat ${mins % 60} dakika önce`
  const days = Math.floor(hours / 24)
  return `${days} gün ${hours % 24} saat önce`
}
function freshness(value) {
  if (!value) return { label: 'Henüz kayıt yok', cls: 'unknown' }
  const hours = (Date.now() - new Date(value).getTime()) / 3600000
  if (hours < 6) return { label: 'Yeni bildirildi', cls: 'fresh' }
  if (hours < 24) return { label: 'Kontrol önerilir', cls: 'medium' }
  return { label: 'Uzun süredir bildirim yok', cls: 'stale' }
}
function SetupNotice() {
  return <div className="setup"><strong>Kurulum gerekiyor</strong><p>Site arayüzü hazır. Canlı kayıtların çalışması için Supabase projesi oluşturup SQL dosyasını çalıştırın ve <code>.env</code> dosyasını doldurun. Kurulum adımları README.md içinde.</p></div>
}
function Header() {
  return <header className="topbar"><Link to="/" className="brand"><span className="brand-icon"><PawPrint size={23}/></span><span>PATİMATİK<small>Bir kap mama, bir kap su</small></span></Link><nav><a href="#nasil-calisir">Nasıl çalışır?</a><Link to="/yonetim">Yönetim</Link></nav></header>
}
function StationCard({ station }) {
  const food = freshness(station.last_food_at), water = freshness(station.last_water_at)
  return <Link className="station-card" to={`/nokta/${station.slug}`}>
    <div className="station-head"><span className="station-pin"><MapPin size={16}/></span><span className="tag">PATİMATİK NOKTASI</span></div>
    <h3>{station.name}</h3><p className="muted">{station.address || 'Konum bilgisi yakında eklenecek'}</p>
    <div className="mini-status"><span className={`dot ${food.cls}`}/><span>Mama: {food.label}</span></div>
    <div className="mini-status"><span className={`dot ${water.cls}`}/><span>Su: {water.label}</span></div>
    <span className="card-link">Noktayı görüntüle <ExternalLink size={15}/></span>
  </Link>
}
function Home() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    let active = true
    const load = async () => {
      const { data, error } = await supabase.from('stations').select('*').eq('is_active', true).order('created_at', { ascending: false })
      if (!active) return
      if (error) setError(error.message); else setStations(data || [])
      setLoading(false)
    }
    load()
    const channel = supabase.channel('home-stations').on('postgres_changes', { event: '*', schema: 'public', table: 'stations' }, load).subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [])
  return <><section className="hero"><div className="hero-copy"><span className="eyebrow"><Heart size={15}/> İYİLİK KÜÇÜK BİR ADIMLA BAŞLAR</span><h1>Bir kap mama,<br/><em>bir kap umut.</em></h1><p>Patimatik noktalarına mama veya su bıraktığında QR kodu okut, bildiriminle iyiliğin devam etsin. Herkes hangi noktada ne zaman destek verildiğini görebilsin.</p><a className="primary-btn" href="#noktalar">Yakınımdaki noktaları gör <PawPrint size={17}/></a><div className="hero-note"><ShieldCheck size={16}/> Bildirimler topluluk desteğiyle güncellenir.</div></div><div className="hero-art"><div className="sun"/><div className="art-circle"><PawPrint size={118} strokeWidth={1.25}/></div><div className="floating-bowl"><span>🐾</span><b>İyilik paylaşınca çoğalır</b></div><span className="spark s1">✳</span><span className="spark s2">✦</span></div></section>
  <section className="section" id="noktalar"><div className="section-title"><div><span className="eyebrow">TOPLULUK HARİTASI</span><h2>Patimatik noktaları</h2><p className="muted">Bir noktayı seçerek son mama ve su bildirimlerini görüntüleyebilirsin.</p></div><span className="count">{stations.length} aktif nokta</span></div>
  {!isConfigured ? <SetupNotice/> : loading ? <div className="loading">Noktalar yükleniyor…</div> : error ? <div className="setup">Veriler alınamadı: {error}</div> : stations.length ? <div className="station-grid">{stations.map(s => <StationCard key={s.id} station={s}/>)}</div> : <div className="empty"><PawPrint size={32}/><h3>İlk Patimatik noktasını bekliyoruz</h3><p>Yönetim panelinden ilk istasyonunuzu ekleyebilirsiniz.</p></div>}</section>
  <section className="how" id="nasil-calisir"><div className="section-title"><div><span className="eyebrow">3 KOLAY ADIM</span><h2>Nasıl çalışır?</h2></div></div><div className="steps"><div><b>01</b><span className="step-icon"><QrIcon/></span><h3>QR kodu okut</h3><p>Patimatik üzerindeki kod seni doğru noktaya götürür.</p></div><div><b>02</b><span className="step-icon"><Utensils/></span><h3>Bildirim bırak</h3><p>Mama veya su koyduğun butona dokun.</p></div><div><b>03</b><span className="step-icon"><Heart/></span><h3>İyiliği görünür kıl</h3><p>Son bildirim saati herkes için anında güncellenir.</p></div></div></section>
  <footer><div className="brand"><span className="brand-icon"><PawPrint/></span><span>PATİMATİK<small>Üsküdar Üniversitesi öğrenci projesi</small></span></div><p>Patili dostlarımız için birlikte. 🐾</p></footer></>
}
function QrIcon(){return <span className="qr-symbol">▦</span>}
function StationPage() {
  const { slug } = useParams()
  const [station, setStation] = useState(null), [busy, setBusy] = useState(''), [message, setMessage] = useState(''), [tick, setTick] = useState(0)
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id) }, [])
  useEffect(() => {
    if (!isConfigured) return
    let active = true
    const load = async () => { const { data } = await supabase.from('stations').select('*').eq('slug', slug).eq('is_active', true).maybeSingle(); if (active) setStation(data) }
    load()
    const channel = supabase.channel(`station-${slug}`).on('postgres_changes', { event: '*', schema: 'public', table: 'stations', filter: `slug=eq.${slug}` }, load).subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [slug])
  async function report(kind) {
    if (!station || busy) return
    setBusy(kind); setMessage('')
    const { error } = await supabase.from('refill_events').insert({ station_id: station.id, kind })
    setBusy('')
    if (error) setMessage('Bildirim kaydedilemedi. Lütfen tekrar deneyin.')
    else setMessage(kind === 'food' ? 'Mama bildirimin alındı, teşekkürler! 🐾' : 'Su bildirimin alındı, teşekkürler! 💧')
  }
  if (!isConfigured) return <main className="narrow"><SetupNotice/></main>
  if (!station) return <main className="narrow"><div className="empty"><PawPrint/><h2>{'Patimatik noktası bulunamadı'}</h2><p>Bağlantıyı kontrol edip tekrar deneyin.</p><Link to="/" className="text-link">Ana sayfaya dön</Link></div></main>
  const food = freshness(station.last_food_at), water = freshness(station.last_water_at)
  return <main className="narrow"><Link to="/" className="back">← Tüm noktalar</Link><div className="detail-card"><span className="eyebrow">PATİMATİK NOKTASI</span><h1>{station.name}</h1><p className="muted"><MapPin size={16}/> {station.address || 'Adres bilgisi eklenmemiş'}</p>{station.description && <p>{station.description}</p>}<div className="status-panel"><div className="status-row"><span className="status-icon food"><Utensils/></span><div className="status-info"><b>Mama durumu</b><strong className={food.cls}>{food.label}</strong><small>Son mama bildirimi: {fmt(station.last_food_at)}</small><small>{elapsed(station.last_food_at)}</small></div></div><div className="status-row"><span className="status-icon water"><Droplets/></span><div className="status-info"><b>Su durumu</b><strong className={water.cls}>{water.label}</strong><small>Son su bildirimi: {fmt(station.last_water_at)}</small><small>{elapsed(station.last_water_at)}</small></div></div></div><p className="prompt">Bu noktaya mama veya su bıraktıysan bildirerek başkalarının da güncel durumu görmesine yardımcı ol.</p><div className="report-buttons"><button className="food-btn" disabled={!!busy} onClick={() => report('food')}><Utensils size={19}/>{busy === 'food' ? 'Kaydediliyor…' : 'Mama bıraktım'}</button><button className="water-btn" disabled={!!busy} onClick={() => report('water')}><Droplets size={19}/>{busy === 'water' ? 'Kaydediliyor…' : 'Su koydum'}</button></div>{message && <div className="notice">{message}</div>}<div className="disclaimer"><Clock3 size={15}/> Durum, kullanıcıların bildirimlerine göre güncellenir. Fiziksel kontrol yerine geçmez.</div></div></main>
}
function Admin() {
  const [session, setSession] = useState(null), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [stations, setStations] = useState([])
  const [form, setForm] = useState({ name: '', address: '', description: '' }), [notice, setNotice] = useState('')
  const [origin, setOrigin] = useState(window.location.origin)
  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => listener.subscription.unsubscribe()
  }, [])
  useEffect(() => { if (session) loadStations() }, [session])
  async function loadStations() { const { data, error } = await supabase.from('stations').select('*').order('created_at', { ascending: false }); if (error) setNotice(error.message); else setStations(data || []) }
  async function login(e) { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setNotice('Giriş başarısız. E-posta ve şifreyi kontrol edin.'); else setNotice('') }
  async function addStation(e) {
    e.preventDefault()
    const slug = `${form.name.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${Math.random().toString(36).slice(2,6)}`
    const { error } = await supabase.from('stations').insert({ ...form, slug })
    if (error) setNotice(`Nokta eklenemedi: ${error.message}`)
    else { setForm({ name: '', address: '', description: '' }); setNotice('Yeni Patimatik noktası eklendi.'); loadStations() }
  }
  async function toggle(station) { const { error } = await supabase.from('stations').update({ is_active: !station.is_active }).eq('id', station.id); if (error) setNotice(error.message); else loadStations() }
  if (!isConfigured) return <main className="narrow"><SetupNotice/></main>
  return <main className="admin"><div className="admin-head"><div><span className="eyebrow">PATİMATİK</span><h1>Yönetim paneli</h1><p className="muted">Noktaları ve QR kodlarını buradan yönetin.</p></div>{session && <button className="ghost-btn" onClick={() => supabase.auth.signOut()}><LogOut size={16}/> Çıkış</button>}</div>
  {!session ? <form className="login-card" onSubmit={login}><h2>Yönetici girişi</h2><label>E-posta<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Şifre<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary-btn" type="submit">Giriş yap</button><p className="muted small">Yönetici hesabı Supabase panelinden oluşturulmalıdır. Kurulum rehberine bakın.</p></form> : <><form className="add-card" onSubmit={addStation}><h2><Plus size={20}/> Yeni Patimatik noktası</h2><div className="form-grid"><label>Nokta adı<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Örn. Üniversite ana giriş" required/></label><label>Adres / konum<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Üsküdar, İstanbul"/></label></div><label>Açıklama<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Nokta hakkında kısa bilgi"/></label><button className="primary-btn" type="submit">Noktayı oluştur</button></form><div className="admin-list-head"><h2>Kayıtlı noktalar ({stations.length})</h2><button className="ghost-btn" onClick={loadStations}><RefreshCw size={15}/> Yenile</button></div><div className="admin-grid">{stations.map(s => <div className="admin-station" key={s.id}><div><b>{s.name}</b><p className="muted small">{s.address}</p><span className={`tag ${s.is_active ? 'active-tag' : 'off-tag'}`}>{s.is_active ? 'Aktif' : 'Pasif'}</span></div><div className="qr-wrap"><QRCodeSVG value={`${origin}/nokta/${s.slug}`} size={104}/><small>QR kodu yazdırın</small><button className="text-link" onClick={()=>window.open(`/nokta/${s.slug}`, '_blank')}>Sayfayı aç</button></div><button className="ghost-btn" onClick={()=>toggle(s)}>{s.is_active ? 'Pasife al' : 'Aktifleştir'}</button></div>)}</div></>}
  {notice && <div className="notice">{notice}</div>}</main>
}
export default function App() {
  return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/nokta/:slug" element={<StationPage/>}/><Route path="/yonetim" element={<Admin/>}/><Route path="*" element={<main className="narrow"><div className="empty"><h2>Sayfa bulunamadı</h2><Link to="/">Ana sayfaya dön</Link></div></main>}/></Routes></>
}