(function(){
  var ROOMKEY="catatan-room-v1";
  var CATS={out:["Makan","Transport","Tagihan","Belanja","Hiburan","Kesehatan","Lainnya"],in:["Gaji","Bonus","Usaha","Lainnya"]};
  var tx=[],type="out",pie=null,bar=null,room="",channel=null;
  var cfg=window.APP_CONFIG||{};
  var db=(window.supabase&&cfg.SUPABASE_URL)?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  var $=function(id){return document.getElementById(id)};
  var rp=new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0});
  var bulanFmt=new Intl.DateTimeFormat("id-ID",{month:"long",year:"numeric"});
  var shortFmt=new Intl.DateTimeFormat("id-ID",{month:"short"});
  var dayFmt=new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short"});

  function cleanRoom(s){return String(s||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40)}
  function norm(r){return{id:Number(r.id),type:r.type,amt:Number(r.amt),cat:r.cat,date:String(r.date).slice(0,10),note:r.note||""}}
  function setStatus(s,t){var e=$("status");e.dataset.state=s;e.textContent=t}
  function showErr(m){$("err").textContent=m||""}
  function upsertLocal(row){var n=norm(row),i=tx.findIndex(function(x){return x.id===n.id});if(i<0)tx.push(n);else tx[i]=n}
  function fetchAll(){
    return db.from("transactions").select("id,type,amt,cat,date,note").eq("room",room).order("date",{ascending:false}).limit(1000).then(function(r){
      if(r.error){setStatus("err","Gagal memuat data");showErr(r.error.message);return}
      showErr("");tx=r.data.map(norm);render();
    });
  }
  function connect(){
    if(db&&channel){db.removeChannel(channel);channel=null}
    if(!db){setStatus("err","Supabase belum dikonfigurasi");return}
    if(!room){tx=[];render();setStatus("off","Isi kode sinkron");return}
    setStatus("wait","Menyambung\u2026");
    fetchAll();
    var f="room=eq."+room;
    channel=db.channel("tx-"+room)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"transactions",filter:f},function(p){upsertLocal(p.new);render()})
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"transactions",filter:f},function(p){upsertLocal(p.new);render()})
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"transactions"},function(p){var id=Number(p.old.id);tx=tx.filter(function(x){return x.id!==id});render()})
      .subscribe(function(s){
        if(s==="SUBSCRIBED")setStatus("on","Tersinkron");
        else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT")setStatus("err","Realtime terputus");
        else if(s==="CLOSED")setStatus("off","Terputus");
      });
  }
  function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
  function pad(n){return n<10?"0"+n:""+n}
  function ym(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)}
  function today(){var d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

  function fillCats(){
    $("kategori").innerHTML=CATS[type].map(function(c){return "<option>"+c+"</option>"}).join("");
  }
  function sum(month,t){
    return tx.filter(function(x){return x.date.slice(0,7)===month&&x.type===t}).reduce(function(a,x){return a+x.amt},0);
  }

  function render(){
    var m=$("bulan").value||ym(new Date());
    var inc=sum(m,"in"),out=sum(m,"out"),sal=inc-out;
    var parts=m.split("-"),d=new Date(+parts[0],+parts[1]-1,1);
    $("bulanLabel").textContent="Saldo "+bulanFmt.format(d);
    $("saldo").textContent=rp.format(sal).replace(/\u00a0/g,"");
    $("saldo").className="balance"+(sal<0?" neg":"");
    $("sumIn").textContent=rp.format(inc).replace(/\u00a0/g,"");
    $("sumOut").textContent=rp.format(out).replace(/\u00a0/g,"");

    var items=tx.filter(function(x){return x.date.slice(0,7)===m}).sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:b.id-a.id});
    $("list").innerHTML=items.length?items.map(function(x){
      var p=x.date.split("-"),dd=dayFmt.format(new Date(+p[0],+p[1]-1,+p[2]));
      return '<div class="item '+x.type+'"><span class="dot"></span><div class="t"><b>'+esc(x.note||x.cat)+'</b><small>'+esc(x.cat)+' &middot; '+dd+'</small></div><span class="amt">'+(x.type==="in"?"+":"-")+rp.format(x.amt).replace(/\u00a0/g,"")+'</span><button class="del" data-id="'+x.id+'" aria-label="Hapus transaksi">&times;</button></div>';
    }).join(""):'<div class="empty">Belum ada transaksi. Isi formulir untuk mencatat yang pertama.</div>';

    charts(m,d);
  }

  function charts(m,d){
    if(typeof Chart==="undefined")return;
    var ink=css("--ink"),muted=css("--muted"),line=css("--line"),cin=css("--in"),cout=css("--out");
    Chart.defaults.font.family='"Plus Jakarta Sans",system-ui,sans-serif';
    Chart.defaults.color=muted;

    // pie
    var byCat={};
    tx.forEach(function(x){if(x.type==="out"&&x.date.slice(0,7)===m)byCat[x.cat]=(byCat[x.cat]||0)+x.amt});
    var labels=Object.keys(byCat),vals=labels.map(function(k){return byCat[k]});
    var palette=["#2b59c3","#c93d52","#e0a526","#1b7f68","#8a5cc2","#2a9bb5","#8a8f98"];
    $("pieEmpty").hidden=labels.length>0;
    $("cPie").parentNode.hidden=labels.length===0;
    if(pie){pie.destroy();pie=null}
    if(labels.length){
      pie=new Chart($("cPie"),{type:"doughnut",data:{labels:labels,datasets:[{data:vals,backgroundColor:labels.map(function(l){return palette[CATS.out.indexOf(l)%palette.length]}),borderColor:css("--surface"),borderWidth:2}]},
        options:{maintainAspectRatio:false,cutout:"60%",plugins:{legend:{position:"bottom",labels:{color:ink,boxWidth:12}},tooltip:{callbacks:{label:function(c){return c.label+": "+rp.format(c.parsed).replace(/\u00a0/g,"")}}}}}});
    }

    // bar: 6 months ending at selected
    var ml=[],ia=[],oa=[];
    for(var i=5;i>=0;i--){
      var dd=new Date(d.getFullYear(),d.getMonth()-i,1),k=ym(dd);
      ml.push(shortFmt.format(dd));ia.push(sum(k,"in"));oa.push(sum(k,"out"));
    }
    if(bar){bar.destroy();bar=null}
    bar=new Chart($("cBar"),{type:"bar",data:{labels:ml,datasets:[{label:"Pemasukan",data:ia,backgroundColor:cin,borderRadius:4},{label:"Pengeluaran",data:oa,backgroundColor:cout,borderRadius:4}]},
      options:{maintainAspectRatio:false,scales:{x:{grid:{display:false},ticks:{color:muted}},y:{beginAtZero:true,grid:{color:line},ticks:{color:muted,callback:function(v){return v>=1e6?(v/1e6)+" jt":v>=1e3?(v/1e3)+" rb":v}}}},
        plugins:{legend:{position:"bottom",labels:{color:ink,boxWidth:12}},tooltip:{callbacks:{label:function(c){return c.dataset.label+": "+rp.format(c.parsed.y).replace(/\u00a0/g,"")}}}}}});
  }

  // events
  document.querySelectorAll(".seg button").forEach(function(b){
    b.addEventListener("click",function(){
      type=b.dataset.type;
      document.querySelectorAll(".seg button").forEach(function(o){o.setAttribute("aria-pressed",o===b?"true":"false")});
      fillCats();
    });
  });
  $("simpan").addEventListener("click",function(){
    if(!db){showErr("Supabase belum dikonfigurasi.");return}
    if(!room){showErr("Isi dan sambungkan kode sinkron dulu.");return}
    var amt=Math.round(Number($("jumlah").value)),date=$("tanggal").value;
    if(!amt||amt<=0){showErr("Masukkan jumlah lebih dari 0.");return}
    if(!date){showErr("Pilih tanggal transaksi.");return}
    showErr("");
    var btn=$("simpan");btn.disabled=true;
    db.from("transactions").insert({room:room,type:type,amt:amt,cat:$("kategori").value,date:date,note:$("catatan").value.trim()}).select("id,type,amt,cat,date,note").single().then(function(r){
      btn.disabled=false;
      if(r.error){showErr("Gagal menyimpan: "+r.error.message);return}
      upsertLocal(r.data);
      $("jumlah").value="";$("catatan").value="";
      $("bulan").value=date.slice(0,7);
      render();$("jumlah").focus();
    });
  });
  $("roomBtn").addEventListener("click",function(){
    var v=cleanRoom($("room").value);
    if(v.length<6){showErr("Kode sinkron minimal 6 karakter (huruf, angka, - atau _).");return}
    showErr("");room=v;$("room").value=v;
    try{localStorage.setItem(ROOMKEY,v)}catch(e){}
    connect();
  });
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&room&&db)fetchAll()});
  $("list").addEventListener("click",function(e){
    var b=e.target.closest(".del");if(!b||!db)return;
    var id=Number(b.dataset.id);
    db.from("transactions").delete().eq("id",id).eq("room",room).then(function(r){
      if(r.error){showErr("Gagal menghapus: "+r.error.message);return}
      tx=tx.filter(function(x){return x.id!==id});render();
    });
  });
  $("bulan").addEventListener("change",render);
  if(window.matchMedia)window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",render);

  fillCats();
  $("bulan").value=ym(new Date());
  $("tanggal").value=today();
  try{room=cleanRoom(localStorage.getItem(ROOMKEY)||"")}catch(e){}
  $("room").value=room;
  render();
  connect();
})();
