// Isi firebaseConfig dari Firebase Console (config web bersifat publik; keamanan ada di Security Rules).
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,query,where,orderBy,limit,getDocs,doc,getDoc,setDoc,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const firebaseConfig={// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCl0SJ3v8a3tuJeClml0JMu5HfvdYGLywA",
  authDomain: "himit-6ea94.firebaseapp.com",
  projectId: "himit-6ea94",
  storageBucket: "himit-6ea94.firebasestorage.app",
  messagingSenderId: "676467965463",
  appId: "1:676467965463:web:4836501a7718d96d3e2652",
  measurementId: "G-D1TXLTZYSB"
};
const configured=!firebaseConfig.apiKey.startsWith("ISI");
let auth,db;if(configured){const a=initializeApp(firebaseConfig);auth=getAuth(a);db=getFirestore(a)}
const $=(s,r=document)=>r.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const NAV=[["/about/","Tentang"],["/organization/","Organisasi"],["/programs/","Program"],["/events/","Kegiatan"],["/publications/","Publikasi"],["/projects/","Proyek"],["/join/","Bergabung"]];
const FOOT=[["/announcements/","Pengumuman"],["/achievements/","Prestasi"],["/gallery/","Galeri"],["/resources/","Sumber Belajar"],["/collaborate/","Kerja Sama"],["/contact/","Kontak"],["/portal/","Portal Anggota"]];
function chrome(){
 const p=location.pathname;
 $("#hdr").outerHTML=`<header class="site"><a class="skip" href="#main">Lewati ke konten</a><div class="wrap"><a class="brand" href="/"><img src="/assets/images/logo.png" alt="" onerror="this.outerHTML='<span class=ph></span>'">HIMIT</a>
 <button id="menu" aria-expanded="false" aria-controls="nav">Menu</button>
 <nav class="main" id="nav" aria-label="Utama">${NAV.map(([h,t])=>`<a href="${h}"${p.startsWith(h)?' aria-current="page"':''}>${t}</a>`).join("")}<a class="btn" id="authlink" href="/login/">Masuk</a></nav></div></header>`;
 $("#ftr").outerHTML=`<footer class="site"><div class="wrap"><div class="cols"><div><h3>Hivemind Institute of Technology</h3><p>Himpunan mahasiswa yang membangun komunitas dan karya teknologi.</p></div>
 <div><h3>Jelajahi</h3>${FOOT.map(([h,t])=>`<a href="${h}">${t}</a>`).join("")}</div><div><h3>Akun</h3><a href="/login/">Masuk</a><a href="/register/">Daftar akun</a><a href="/join/">Keanggotaan</a></div></div>
 <small>&copy; ${new Date().getFullYear()} HIMIT, Hivemind Institute of Technology. Semua hak dilindungi.</small></div></footer>`;
 $("#menu").onclick=e=>{const o=$("#nav").classList.toggle("open");e.target.setAttribute("aria-expanded",o)};
}
async function load(el){
 const c=el.dataset.collection,n=+el.dataset.limit||50;
 const empty=m=>el.innerHTML=`<div class="empty">${m}</div>`;
 if(!configured)return empty("Konten belum tersedia. Hubungkan Firebase di assets/js/app.js lalu isi koleksi <code>"+esc(c)+"</code> dari dashboard admin.");
 try{
  const q=query(collection(db,c),where("status","in",["published","aktif","berjalan","selesai","dibuka"]),limit(n));
  const s=await getDocs(q);if(s.empty)return empty("Belum ada data yang dipublikasikan.");
  el.innerHTML='<div class="list">'+s.docs.map(d=>{const x=d.data(),t=x.tanggal?.toDate?.().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})||x.kategori||"";
  return `<article class="item"><time>${esc(t)}</time><div><h3><a href="/detail/?c=${c}&id=${d.id}">${esc(x.judul||x.nama||x.title)}</a></h3><p>${esc(x.ringkasan||x.deskripsi||"")}</p></div></article>`}).join("")+"</div>";
 }catch(e){empty("Data tidak dapat dimuat. Periksa koneksi lalu muat ulang halaman.")}
}
function say(f,t,k){const m=$(".msg",f);m.textContent=t;m.className="msg "+k}
const ERR={"auth/invalid-credential":"Email atau kata sandi salah.","auth/email-already-in-use":"Email ini sudah terdaftar. Gunakan menu Masuk.","auth/weak-password":"Kata sandi minimal 8 karakter."};
function forms(){
 document.querySelectorAll("form[data-act]").forEach(f=>f.onsubmit=async e=>{
  e.preventDefault();if(!configured)return say(f,"Firebase belum dikonfigurasi.","err");
  const v=Object.fromEntries(new FormData(f)),a=f.dataset.act;say(f,"Memproses…","");
  try{
   if(a=="login"){await signInWithEmailAndPassword(auth,v.email,v.password);location.href="/portal/"}
   if(a=="register"){const u=await createUserWithEmailAndPassword(auth,v.email,v.password);
    await setDoc(doc(db,"pengguna",u.user.uid),{nama:v.nama,email:v.email,statusAkun:"pendaftar",statusKeanggotaan:"none",dibuat:serverTimestamp()});
    await sendEmailVerification(u.user);say(f,"Akun dibuat. Cek email Anda untuk verifikasi.","ok")}
   if(a=="reset"){await sendPasswordResetEmail(auth,v.email);say(f,"Jika email terdaftar, tautan pemulihan telah dikirim.","ok")}
   if(a=="collab"){await addDoc(collection(db,"collaborationRequests"),{nama:v.nama,email:v.email,jenis:v.jenis,pesan:v.pesan,status:"baru",dibuat:serverTimestamp()});f.reset();say(f,"Pesan terkirim. Kami akan menindaklanjuti.","ok")}
  }catch(er){say(f,ERR[er.code]||"Terjadi kesalahan. Coba lagi.","err")}});
}
chrome();forms();document.querySelectorAll("[data-collection]").forEach(load);
if(configured)onAuthStateChanged(auth,async u=>{
 const l=$("#authlink");if(u){l.textContent="Portal";l.href="/portal/"}
 const g=document.body.dataset.guard;if(!g)return;
 if(!u)return location.replace("/login/");
 if(g=="admin"){const t=await u.getIdTokenResult();if(!["admin","direktur_perhubungan"].includes(t.claims.role))return location.replace("/portal/")}
 const d=await getDoc(doc(db,"pengguna",u.uid));const out=$("#who");if(out)out.innerHTML=`Masuk sebagai <strong>${esc(d.data()?.nama||u.email)}</strong>. Status keanggotaan: <strong>${esc(d.data()?.statusKeanggotaan||"none")}</strong>. <button class="btn dark" id="lo">Keluar</button>`;
 $("#lo")?.addEventListener("click",()=>signOut(auth).then(()=>location.href="/"));
});

export {auth,db,configured,esc};
