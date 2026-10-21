import {db,configured,esc} from "/assets/js/app.js";
import {collection,getDocs,query,where} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const el=document.getElementById("cal");let ev=[],d=new Date(),M=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
function draw(){const y=d.getFullYear(),m=d.getMonth(),s=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate();let c="";
 for(let i=0;i<s;i++)c+="<div></div>";
 for(let i=1;i<=n;i++){const e=ev.filter(x=>{const t=x.tanggal.toDate();return t.getFullYear()==y&&t.getMonth()==m&&t.getDate()==i});c+=`<div class="day${e.length?" on":""}"><b>${i}</b>${e.map(x=>`<a href="/detail/?c=acara&id=${x.id}">${esc(x.judul)}</a>`).join("")}</div>`}
 el.innerHTML=`<div class="calh"><button class="btn" id="pm" aria-label="Bulan sebelumnya">Sebelumnya</button><h2>${M[m]} ${y}</h2><button class="btn" id="nm" aria-label="Bulan berikutnya">Berikutnya</button></div><div class="cal">${["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(x=>"<i>"+x+"</i>").join("")}${c}</div>`;
 $("pm").onclick=()=>{d=new Date(y,m-1,1);draw()};$("nm").onclick=()=>{d=new Date(y,m+1,1);draw()}}
function $(i){return document.getElementById(i)}
(async()=>{if(configured)try{ev=(await getDocs(query(collection(db,"acara"),where("status","==","published")))).docs.map(x=>({id:x.id,...x.data()})).filter(x=>x.tanggal?.toDate)}catch{}draw()})();
