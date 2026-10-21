import {auth,db,configured,esc} from "/assets/js/app.js";
import {doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const P=new URLSearchParams(location.search),c=P.get("c"),id=P.get("id"),el=document.getElementById("d"),$=i=>document.getElementById(i);
const OK=["halaman","proker","acara","pengumuman","artikel","projek","pencapaian","albumFoto","resources"];
const meta=(n,v,p)=>{let m=document.querySelector(`meta[${p?"property":"name"}="${n}"]`);if(!m){m=document.createElement("meta");m.setAttribute(p?"property":"name",n);document.head.append(m)}m.content=v};
const nf=()=>{$("t").textContent="Konten tidak ditemukan";el.innerHTML='<div class="empty">Konten ini tidak tersedia atau belum diterbitkan. <a href="/">Kembali ke beranda</a>.</div>'};
(async()=>{if(!configured||!OK.includes(c)||!id)return nf();let x;try{const s=await getDoc(doc(db,c,id));if(!s.exists())return nf();x=s.data()}catch{return nf()}
 const t=x.seoJudul||x.judul||x.nama,ds=x.seoDeskripsi||x.ringkasan||"";document.title=t+" | HIMIT";meta("description",ds);meta("og:title",t,1);meta("og:description",ds,1);if(x.gambar)meta("og:image",x.gambar,1);
 const l=document.createElement("link");l.rel="canonical";l.href=location.origin+"/detail/?c="+c+"&id="+id;document.head.append(l);
 if(c=="artikel"){const j=document.createElement("script");j.type="application/ld+json";j.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:t,description:ds,author:x.penulis||"HIMIT",image:x.gambar,datePublished:x.tanggal?.toDate?.().toISOString()});document.head.append(j)}
 $("t").textContent=x.judul||x.nama;$("sub").textContent=[x.kategori,x.penulis,x.tanggal?.toDate?.().toLocaleDateString("id-ID",{dateStyle:"long"})].filter(Boolean).join(", ");
 let h=(x.gambar?`<img src="${esc(x.gambar)}" alt="" style="max-width:100%;height:auto;margin-bottom:1.5rem">`:"")+esc(x.isi||x.deskripsi||x.ringkasan||"").split(/\n\n+/).map(p=>"<p>"+p+"</p>").join("");
 if(x.lokasi)h+=`<p><strong>Lokasi:</strong> ${esc(x.lokasi)}</p>`;
 if(c=="acara")h+='<button class="btn dark" id="reg">Daftar kegiatan</button><p class="msg" id="rm" role="status"></p>';el.innerHTML=h;
 $("reg")?.addEventListener("click",async()=>{const u=auth.currentUser,m=$("rm");if(!u)return location.href="/login/";if(!u.emailVerified){m.className="msg err";return m.textContent="Verifikasi email Anda terlebih dahulu."}
  try{await setDoc(doc(db,"pendaftaran",u.uid+"_"+id),{uid:u.uid,acaraId:id,judul:x.judul,status:"terdaftar",dibuat:serverTimestamp()});m.className="msg ok";m.textContent="Pendaftaran berhasil."}catch{m.className="msg err";m.textContent="Anda sudah terdaftar atau pendaftaran ditutup."}})})();
