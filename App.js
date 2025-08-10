// Service Pro 360 — core app
// tiny helpers
const $ = s => document.querySelector(s);
const uid = () => 'id-' + Math.random().toString(36).slice(2) + '-' + Date.now();
const fmt = d => new Date(d).toLocaleDateString();

// minimal IndexedDB wrapper
const db = (() => {
  const DB='sp360-db', VER=1; let _db;
  function open(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VER);
    r.onupgradeneeded=e=>{const d=e.target.result;
      if(!d.objectStoreNames.contains('customers')) d.createObjectStore('customers',{keyPath:'id'});
      if(!d.objectStoreNames.contains('jobs')) d.createObjectStore('jobs',{keyPath:'id'});
      if(!d.objectStoreNames.contains('invoices')) d.createObjectStore('invoices',{keyPath:'id'});
      if(!d.objectStoreNames.contains('settings')) d.createObjectStore('settings',{keyPath:'key'});
    }; r.onsuccess=e=>{_db=e.target.result;res(_db)}; r.onerror=rej;});}
  async function store(n,m='readonly'){if(!_db) await open(); return _db.transaction(n,m).objectStore(n);}
  async function all(n){const s=await store(n); return await new Promise((r,j)=>{const q=s.getAll(); q.onsuccess=()=>r(q.result); q.onerror=j;});}
  async function get(n,k){const s=await store(n); return await new Promise((r,j)=>{const q=s.get(k); q.onsuccess=()=>r(q.result); q.onerror=j;});}
  async function put(n,v){const s=await store(n,'readwrite'); return await new Promise((r,j)=>{const q=s.put(v); q.onsuccess=()=>r(q.result); q.onerror=j;});}
  async function del(n,k){const s=await store(n,'readwrite'); return await new Promise((r,j)=>{const q=s.delete(k); q.onsuccess=()=>r(true); q.onerror=j;});}
  return {all,get,put,del};
})();

// i18n
const t = {
  en:{dashboard:'Dashboard',customers:'Customers',jobs:'Jobs',invoices:'Invoices',settings:'Settings',addCustomer:'Add Customer',name:'Name',email:'Email',phone:'Phone',address:'Address',notes:'Notes',save:'Save',delete:'Delete',scheduleJob:'Schedule Job',serviceEvery4:'Service every 4 months',nextService:'Next service',gps:'Capture GPS',complete:'Complete',pending:'Pending',createInvoice:'Create Invoice',language:'Language',brand:'Brand',countyEmail:'County email',sendToCounty:'Send to County',countyMsg:'Attach PDF invoice from Files if needed.',export:'Export JSON',import:'Import JSON',chooseFile:'Choose file',installButton:'Install',installPrompt:'Install prompt shown.'},
  es:{dashboard:'Panel',customers:'Clientes',jobs:'Trabajos',invoices:'Facturas',settings:'Ajustes',addCustomer:'Agregar cliente',name:'Nombre',email:'Correo',phone:'Teléfono',address:'Dirección',notes:'Notas',save:'Guardar',delete:'Eliminar',scheduleJob:'Programar trabajo',serviceEvery4:'Servicio cada 4 meses',nextService:'Próximo servicio',gps:'Capturar GPS',complete:'Completado',pending:'Pendiente',createInvoice:'Crear factura',language:'Idioma',brand:'Marca',countyEmail:'Correo del condado',sendToCounty:'Enviar al condado',countyMsg:'Adjunte PDF desde Archivos si es necesario.',export:'Exportar JSON',import:'Importar JSON',chooseFile:'Elegir archivo',installButton:'Instalar',installPrompt:'Solicitud de instalación mostrada.'}
};
let lang = localStorage.getItem('sp360-lang') || 'en';
document.getElementById('lang').value = lang;
document.getElementById('lang').addEventListener('change',()=>{lang=document.getElementById('lang').value;localStorage.setItem('sp360-lang',lang);render();});

// PWA install
let deferredPrompt;
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;});
document.getElementById('btn-install').textContent = t[lang].installButton;
document.getElementById('btn-install').addEventListener('click', async ()=>{
  if(deferredPrompt){deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; alert(t[lang].installPrompt);}
  else alert('Use browser menu → Add to Home screen');
});

// tabs
const views=['dashboard','customers','jobs','invoices','settings'];
document.querySelectorAll('.tabbar button').forEach(b=>b.addEventListener('click',()=>{
  views.forEach(v=>document.getElementById('view-'+v).classList.add('hidden'));
  document.querySelectorAll('.tabbar button').forEach(x=>x.classList.remove('primary'));
  const tab=b.dataset.tab; document.getElementById('view-'+tab).classList.remove('hidden'); b.classList.add('primary'); render();
}));

// utils
function plus4Months(d){const x=new Date(d); x.setMonth(x.getMonth()+4); return x.toISOString();}
function getGPS(){return new Promise((res,rej)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>res({lat:p.coords.latitude,lon:p.coords.longitude,ts:Date.now()}),rej,{enableHighAccuracy:true,timeout:10000}):rej('no geolocation'));}

// main render
async function render(){
  const customers=await db.all('customers');
  const jobs=await db.all('jobs');
  const invoices=await db.all('invoices');

  // Dashboard
  document.getElementById('view-dashboard').innerHTML = `
    <div class="card"><h2>${t[lang].jobs} — ${t[lang].serviceEvery4}</h2>
      <ul class="list">
        ${jobs.slice().sort((a,b)=>new Date(a.due)-new Date(b.due)).slice(0,5).map(j=>`
          <li><strong>${j.customerName||j.customerId}</strong> • ${fmt(j.due)} • <span class="small">${t[lang][j.status]||j.status}</span></li>
        `).join('') || '<li class="small">No jobs yet.</li>'}
      </ul>
    </div>`;

  // Customers
  document.getElementById('view-customers').innerHTML = `
    <div class="card"><h2>${t[lang].addCustomer}</h2>
      <div class="row">
        <div><label>${t[lang].name}</label><input id="c-name"></div>
        <div><label>${t[lang].email}</label><input id="c-email" type="email"></div>
        <div><label>${t[lang].phone}</label><input id="c-phone"></div>
      </div>
      <div><label>${t[lang].address}</label><input id="c-address"></div>
      <div><label>${t[lang].notes}</label><textarea id="c-notes"></textarea></div>
      <button class="primary" id="btn-save-c">${t[lang].save}</button>
    </div>
    <div class="card"><h2>${t[lang].customers}</h2>
      <ul class="list">
        ${customers.map(c=>`
          <li><strong>${c.name}</strong> — ${c.phone||''}<br>
            <span class="small">${c.address||''}</span><br>
            <button data-id="${c.id}" class="btn-del-c">${t[lang].delete}</button>
            <button data-id="${c.id}" class="btn-job">${t[lang].scheduleJob}</button>
          </li>
        `).join('') || '<li class="small">No customers yet.</li>'}
      </ul>
    </div>`;
  document.getElementById('btn-save-c')?.addEventListener('click', async ()=>{
    const c={id:uid(),name:$('#c-name').value.trim(),email:$('#c-email').value.trim(),phone:$('#c-phone').value.trim(),address:$('#c-address').value.trim(),notes:$('#c-notes').value.trim(),created:new Date().toISOString()};
    if(!c.name) return alert('Name required');
    await db.put('customers',c); render();
  });
  document.querySelectorAll('.btn-del-c').forEach(b=>b.addEventListener('click', async ()=>{await db.del('customers',b.dataset.id); render();}));
  document.querySelectorAll('.btn-job').forEach(b=>b.addEventListener('click', async ()=>{
    const c = customers.find(x=>x.id===b.dataset.id) || await db.get('customers', b.dataset.id);
    const j={id:uid(),customerId:c.id,customerName:c.name,created:new Date().toISOString(),due:plus4Months(Date.now()),status:'pending',gps:null,photos:[],notes:''};
    await db.put('jobs',j); render();
  }));

  // Jobs
  document.getElementById('view-jobs').innerHTML = `
    <div class="card"><h2>${t[lang].jobs}</h2>
      <ul class="list">
        ${jobs.slice().sort((a,b)=>new Date(a.due)-new Date(b.due)).map(j=>`
          <li>
            <strong>${j.customerName||j.customerId}</strong> — ${fmt(j.due)}<br>
            <span class="small">${t[lang].notes}:</span><br>
            <textarea data-id="${j.id}" class="job-notes">${j.notes||''}</textarea>
            <div class="row">
              <button data-id="${j.id}" class="btn-gps">${t[lang].gps}</button>
              <input type="file" accept="image/*" capture="environment" data-id="${j.id}" class="job-photo">
              <button data-id="${j.id}" class="btn-done">${t[lang].complete}</button>
              <button data-id="${j.id}" class="btn-pending">${t[lang].pending}</button>
              <button data-id="${j.id}" class="btn-invoice">${t[lang].createInvoice}</button>
            </div>
            <div class="small">${j.gps?`GPS: ${j.gps.lat.toFixed(5)}, ${j.gps.lon.toFixed(5)}`:''}</div>
            ${j.photos?.length? j.photos.map(p=>`<img src="${p}" style="max-width:80px;border-radius:8px;margin-right:6px">`).join(''):''}
          </li>
        `).join('') || '<li class="small">No jobs yet.</li>'}
      </ul>
    </div>`;
  document.querySelectorAll('.job-notes').forEach(el=>el.addEventListener('change', async ()=>{
    const j = jobs.find(x=>x.id===el.dataset.id) || await db.get('jobs', el.dataset.id);
    j.notes = el.value; await db.put('jobs', j);
  }));
  document.querySelectorAll('.btn-gps').forEach(btn=>btn.addEventListener('click', async ()=>{
    try{ const j = await db.get('jobs', btn.dataset.id); j.gps = await getGPS(); await db.put('jobs', j); render(); }
    catch{ alert('GPS error'); }
  }));
  document.querySelectorAll('.job-photo').forEach(input=>input.addEventListener('change', async ()=>{
    const file = input.files[0]; if(!file) return;
    const fr = new FileReader();
    fr.onload = async ()=>{ const j = await db.get('jobs', input.dataset.id); j.photos = j.photos||[]; j.photos.push(fr.result); await db.put('jobs', j); render(); };
    fr.readAsDataURL(file);
  }));
  document.querySelectorAll('.btn-done').forEach(btn=>btn.addEventListener('click', async ()=>{ const j = await db.get('jobs', btn.dataset.id); j.status='complete'; await db.put('jobs', j); render(); }));
  document.querySelectorAll('.btn-pending').forEach(btn=>btn.addEventListener('click', async ()=>{ const j = await db.get('jobs', btn.dataset.id); j.status='pending'; await db.put('jobs', j); render(); }));
  document.querySelectorAll('.btn-invoice').forEach(btn=>btn.addEventListener('click', async ()=>{
    const j = await db.get('jobs', btn.dataset.id);
    const inv = {id:uid(), jobId:j.id, customerName:j.customerName, description:j.notes||'Service visit', amount:0, created:new Date().toISOString()};
    await db.put('invoices', inv);
    const w = window.open('','_blank');
    w.document.write(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice</title>
      <style>body{font-family:Arial;padding:24px}.box{border:1px solid #ddd;padding:16px;border-radius:8px}</style></head><body>
      <h2>Invoice</h2><div class="box"><div><b>Customer:</b> ${inv.customerName||''}</div><div><b>Job:</b> ${j.id}</div>
      <div><b>Date:</b> ${fmt(inv.created)}</div><div><b>Description:</b> ${inv.description}</div><div><b>Amount:</b> $${(inv.amount||0).toFixed(2)}</div></div>
      <p class="small">Use Print → Save as PDF.</p></body></html>`); w.document.close();
  }));

  // Invoices
  document.getElementById('view-invoices').innerHTML = `
    <div class="card"><h2>${t[lang].invoices}</h2>
      <ul class="list">
        ${invoices.map(i=>`<li><strong>${i.customerName||''}</strong> — ${fmt(i.created)} — $${(i.amount||0).toFixed(2)}<br><span class="small">Job: ${i.jobId}</span></li>`).join('') || '<li class="small">No invoices yet.</li>'}
      </ul>
    </div>`;

  // Settings
  const brand = (await db.get('settings','brand'))?.value || 'Service Pro 360 / Texas Septic Pros';
  const county = (await db.get('settings','countyEmail'))?.value || '';
  document.getElementById('view-settings').innerHTML = `
    <div class="card"><h2>${t[lang].settings}</h2>
      <div class="row">
        <div><label>${t[lang].language}</label><div>${document.getElementById('lang').value.toUpperCase()}</div></div>
        <div><label>${t[lang].brand}</label><input id="set-brand" value="${brand}"></div>
        <div><label>${t[lang].countyEmail}</label><input id="set-county" value="${county}" placeholder="county@example.gov"></div>
      </div>
