// Secret: firebase functions:secrets:set RESEND_API_KEY CLOUDINARY_API_SECRET ANTHROPIC_API_KEY
// Env (functions/.env): CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, MAIL_FROM
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {onDocumentUpdated}=require("firebase-functions/v2/firestore");
const admin=require("firebase-admin"),crypto=require("crypto");admin.initializeApp();
const db=admin.firestore(),ADMINS=["admin","direktur_perhubungan"],ROLES=["pengunjung","pendaftar","anggota_terverifikasi","direktur_perhubungan","admin"];
const need=r=>{if(!ADMINS.includes(r.auth?.token?.role))throw new HttpsError("permission-denied","Akses ditolak.")};
const audit=(actor,action,extra)=>db.collection("auditLogs").add({actor,action,...extra,at:admin.firestore.FieldValue.serverTimestamp()});

exports.setRole=onCall(async r=>{need(r);const{uid,role}=r.data||{};
 if(typeof uid!="string"||!ROLES.includes(role))throw new HttpsError("invalid-argument","Data tidak valid.");
 if(role=="admin"&&r.auth.token.role!="admin")throw new HttpsError("permission-denied","Hanya admin yang dapat menerbitkan role admin.");
 await admin.auth().setCustomUserClaims(uid,{role});await audit(r.auth.uid,"setRole",{target:uid,role});return{ok:true}});

exports.cloudinarySignature=onCall({secrets:["CLOUDINARY_API_SECRET"]},async r=>{need(r);
 const timestamp=Math.floor(Date.now()/1000),folder="himit",s=`folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
 return{timestamp,folder,signature:crypto.createHash("sha1").update(s).digest("hex"),apiKey:process.env.CLOUDINARY_API_KEY,cloudName:process.env.CLOUDINARY_CLOUD_NAME}});

async function mail(to,subject,html){const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.MAIL_FROM,to,subject,html})});
 await db.collection("emailLogs").add({to,subject,ok:res.ok,at:admin.firestore.FieldValue.serverTimestamp()})}

// Status permohonan berubah: sinkronkan pengguna, role, notifikasi, dan email.
exports.onMembershipChange=onDocumentUpdated({document:"membershipApplications/{id}",secrets:["RESEND_API_KEY"]},async e=>{
 const a=e.data.before.data(),b=e.data.after.data();if(a.status===b.status)return;
 await db.doc("pengguna/"+b.uid).update({statusKeanggotaan:b.status});
 if(b.status=="approved")await admin.auth().setCustomUserClaims(b.uid,{role:"anggota_terverifikasi"});
 if(b.status=="suspended"||b.status=="rejected")await admin.auth().setCustomUserClaims(b.uid,{role:"pendaftar"});
 const t=`Status keanggotaan Anda: ${b.status}`;
 await db.collection("notifikasi").add({uid:b.uid,judul:t,ringkasan:"Buka portal anggota untuk detailnya.",dibuat:admin.firestore.FieldValue.serverTimestamp()});
 try{const u=await admin.auth().getUser(b.uid);await mail(u.email,t,`<p>${t}.</p><p>Hivemind Institute of Technology</p>`)}catch(err){console.error(err)}});

exports.translateText=onCall({secrets:["ANTHROPIC_API_KEY"]},async r=>{need(r);const{text,to}=r.data||{};
 if(typeof text!="string"||text.length>8000||!["en","id"].includes(to))throw new HttpsError("invalid-argument","Data tidak valid.");
 const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},
  body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2000,system:"Terjemahkan teks pengguna. Balas hanya dengan terjemahan, tanpa komentar.",messages:[{role:"user",content:`Ke bahasa ${to=="en"?"Inggris":"Indonesia"}:\n\n${text}`}]})});
 if(!res.ok)throw new HttpsError("internal","Terjemahan gagal.");return{text:(await res.json()).content[0].text}});
