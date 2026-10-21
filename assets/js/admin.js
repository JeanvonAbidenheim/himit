import {auth,db,esc} from "/assets/js/app.js";
import {collection,getDocs,doc,addDoc,updateDoc,serverTimestamp,Timestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getFunctions,httpsCallable} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
const T=["nama","judul","gambar"],P=["draft","review","published","archived"];
const C={siteSettings:["nama","tagline","deskripsi","kontakEmail"],halaman:["slug","judul","isi","seoDeskripsi","status"],navigasi:["label","url","urutan","status"],divisi:["nama","deskripsi","status"],jabatan:["nama","divisi","periode","deskripsi","status"],periodeKabinet:["nama","mulai","selesai","status"],
proker:["judul","ringkasan","deskripsi","divisi","tanggal","gambar","status"],acara:["judul","ringkasan","deskripsi","tanggal","lokasi","kuota","gambar","status"],pengumuman:["judul","ringkasan","isi","audience","tanggal","status"],
artikel:["judul","ringkasan","isi","penulis","kategori","tag","tanggal","gambar","seoJudul","seoDeskripsi","status"],projek:["judul","ringkasan","deskripsi","teknologi","demoUrl","repoUrl","gambar","status"],pencapaian:["judul","ringkasan","kategori","tanggal","gambar","status"],
albumFoto:["judul","ringkasan","kategori","tanggal","gambar","status"],resources:["judul","ringkasan","kategori","url","lisensi","status"],membershipApplications:["uid","catatan","status"],collaborationRequests:["nama","email","jenis","pesan","status"],newsletterSubscribers:["email"],notifikasi:["uid","judul","ringkasan"]};
const ST={membershipApplications:["pending","under_review","approved","rejected","suspended"],collaborationRequests:["baru","diproses","selesai","archived"]};
const $=s=>document.querySelector(s),DT=["tanggal","mulai","selesai"],TA=["isi","deskripsi","ringkasan","pesan","catatan"],PS=10;
let col="proker",rows=[],page=0,editing=null;
$("#sel").innerHTML=Object.keys(C).map(k=>`<option>${k}</option>`).join("");
const opts=()=>ST[col]||P,fn=httpsCallable(getFunctions(),"cloudinarySignature");
const audit=(a,id)=>addDoc(collection(db,"auditLogs"),{actor:auth.currentUser.uid,action:a,col,docId:id,at:serverTimestamp()});
const val=(v,k)=>DT.includes(k)&&v?.toDate?v.toDate().toISOString().slice(0,10):(v??"");
async function load(){$("#state").textContent="Memuat…";$("#fs").innerHTML='<option value="">Semua</option>'+opts().map(s=>`<option>${s}</option>`).join("");
 try{rows=(await getDocs(collection(db,col))).docs.map(d=>({id:d.id,...d.data()}));page=0;draw();$("#state").textContent=rows.length?"":"Belum ada data. Pilih Tambah data."}catch(e){$("#state").textContent="Gagal memuat data. Periksa izin akun Anda."}}
function draw(){const q=$("#q").value.toLowerCase(),s=$("#fs").value,f=rows.filter(r=>(!s||r.status===s)&&JSON.stringify(r).toLowerCase().includes(q)),n=Math.max(1,Math.ceil(f.length/PS));page=Math.min(page,n-1);
 $("#tb").innerHTML=f.slice(page*PS,page*PS+PS).map(r=>`<tr><td>${esc(r.judul||r.nama||r.email||r.id)}</td><td>${esc(r.status||"")}</td><td><button data-a="e" data-id="${r.id}">Ubah</button> <button data-a="p" data-id="${r.id}">Pratinjau</button> <button data-a="x" data-id="${r.id}">Arsipkan</button></td></tr>`).join("");
 $("#pg").textContent=`Halaman ${page+1} dari ${n} (${f.length} data)`;$("#pv0").disabled=!page;$("#nx").disabled=page>=n-1}
function form(r={}){editing=r.id||null;$("#fm").innerHTML=C[col].map(k=>{const v=esc(val(r[k],k));
 if(k=="status")return`<label>Status<select name="status">${opts().map(s=>`<option${r.status==s?" selected":""}>${s}</option>`).join("")}</select></label>`;
 if(TA.includes(k))return`<label>${k}<textarea name="${k}" rows="4">${v}</textarea></label>`;
 if(k=="gambar")return`<label>Gambar (Cloudinary)<input type="file" accept="image/*" id="up"><input name="gambar" value="${v}" placeholder="URL gambar"></label>`;
 return`<label>${k}<input name="${k}" value="${v}" type="${DT.includes(k)?"date":k=="urutan"||k=="kuota"?"number":"text"}"></label>`}).join("")+'<button class="btn dark" value="save">Simpan</button> <button class="btn" value="cancel" formnovalidate>Batal</button><p class="msg" role="status"></p>';
 $("#dlg").showModal();$("#up")?.addEventListener("change",async e=>{const m=$("#fm .msg");m.textContent="Mengunggah…";try{const{data:g}=await fn({});const b=new FormData();b.append("file",e.target.files[0]);b.append("api_key",g.apiKey);b.append("timestamp",g.timestamp);b.append("signature",g.signature);b.append("folder",g.folder);
  const x=await(await fetch(`https://api.cloudinary.com/v1_1/${g.cloudName}/image/upload`,{method:"POST",body:b})).json();$("[name=gambar]").value=x.secure_url;m.textContent="Gambar terunggah."}catch{m.textContent="Unggah gagal."}})}
$("#fm").onsubmit=async e=>{if(e.submitter?.value!="save")return;e.preventDefault();const d=Object.fromEntries(new FormData($("#fm"))),m=$("#fm .msg"),k0=C[col][0];
 if(!d[k0]?.trim())return m.textContent="Kolom "+k0+" wajib diisi.";
 for(const k of DT)if(k in d)d[k]=d[k]?Timestamp.fromDate(new Date(d[k])):null;for(const k of["urutan","kuota"])if(d[k]!==undefined)d[k]=Number(d[k])||0;
 m.textContent="Menyimpan…";try{let id=editing;d.diperbarui=serverTimestamp();if(id)await updateDoc(doc(db,col,id),d);else id=(await addDoc(collection(db,col),{...d,dibuat:serverTimestamp()})).id;
  await audit(editing?"update":"create",id);$("#dlg").close();load()}catch{m.textContent="Gagal menyimpan. Periksa izin atau isian."}};
document.addEventListener("click",async e=>{const b=e.target.closest("[data-a]");if(!b)return;const r=rows.find(x=>x.id==b.dataset.id);
 if(b.dataset.a=="e")form(r);if(b.dataset.a=="p")$("#pvb").innerHTML=`<h2>${esc(r.judul||r.nama)}</h2><p>${esc(r.ringkasan||"")}</p>${esc(r.isi||r.deskripsi||"").split(/\n\n+/).map(p=>"<p>"+p+"</p>").join("")}`,$("#pv").showModal();
 if(b.dataset.a=="x"&&confirm("Arsipkan data ini? Data tidak dihapus permanen.")){try{await updateDoc(doc(db,col,r.id),{status:"archived",diperbarui:serverTimestamp()});await audit("archive",r.id);load()}catch{$("#state").textContent="Gagal mengarsipkan."}}});
$("#sel").onchange=e=>{col=e.target.value;load()};$("#q").oninput=()=>{page=0;draw()};$("#fs").onchange=()=>{page=0;draw()};$("#new").onclick=()=>form();$("#pv0").onclick=()=>{page--;draw()};$("#nx").onclick=()=>{page++;draw()};
auth.authStateReady().then(load);
