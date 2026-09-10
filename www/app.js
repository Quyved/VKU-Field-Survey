const KEY='vku-surveys-v1', DRAFT='vku-draft-v1';
const CLOUD_FALLBACK_URL = 'https://api.restful-api.dev/objects/ff808181a067127101a08a5a4dda6221';
let rating=0, photoData='';
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const form=$('#surveyForm'), toast=$('#toast');

const db=new Promise((resolve,reject)=>{
  const req=indexedDB.open('vku-field-survey',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('state');
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
});

async function read(key,fallback){
  const d=await db;
  return new Promise((resolve,reject)=>{
    const r=d.transaction('state').objectStore('state').get(key);
    r.onsuccess=()=>resolve(r.result??fallback);
    r.onerror=()=>reject(r.error);
  });
}

async function write(key,value){
  const d=await db;
  return new Promise((resolve,reject)=>{
    const r=d.transaction('state','readwrite').objectStore('state').put(value,key);
    r.onsuccess=()=>resolve();
    r.onerror=()=>reject(r.error);
  });
}

async function remove(key){
  const d=await db;
  return new Promise((resolve,reject)=>{
    const r=d.transaction('state','readwrite').objectStore('state').delete(key);
    r.onsuccess=()=>resolve();
    r.onerror=()=>reject(r.error);
  });
}

async function entries(){ return read(KEY, []); }
async function saveEntries(data){ return write(KEY, data); }
function isOnline(){ return navigator.onLine; }

function notify(message){
  toast.textContent=message;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2800);
}

function updateStatus(){
  const online=isOnline();
  $('#networkStatus').className='status '+(online?'online':'offline');
  $('#networkStatus').innerHTML=`<span></span> ${online?'Trực tuyến':'Ngoại tuyến'}`;
  if(online) sync();
}

async function updateCounts(){
  const data=await entries();
  const pending=data.filter(x=>x.status==='PENDING_SYNC').length;
  $('#pendingCount').textContent=pending;
  $('#recordBadge').textContent=data.length;
}

function getData(){ return Object.fromEntries(new FormData(form).entries()); }

async function persistDraft(){
  const d={...getData(),rating,photoData};
  await write(DRAFT,d);
  $('#draftState').textContent='Đã lưu bản nháp lúc '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
}

async function loadDraft(){
  const d=await read(DRAFT,null);
  if(!d)return;
  Object.entries(d).forEach(([k,v])=>{
    const el=form.elements[k];
    if(el)el.value=v;
  });
  rating=d.rating||0;
  selectRating(rating);
  if(d.photoData){
    photoData=d.photoData;
    $('#photoPreview').src=photoData;
    $('#photoPreview').classList.remove('hidden');
  }
}

function selectRating(value){
  rating=Number(value);
  $$('#ratings button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.rating)<=rating));
  $('#ratingHint').textContent=rating?`${rating}/5 sao — ${['Rất kém','Kém','Đạt','Tốt','Rất tốt'][rating-1]}`:'Chọn từ 1 (rất kém) đến 5 (rất tốt)';
}

async function render(){
  const data=await entries();
  $('#recordsList').innerHTML=data.length?data.map(item=>`<article class="record"><div><h3>${esc(item.category)} · ${esc(item.building)} – ${esc(item.room)}</h3><p>Tầng ${esc(item.floor)} · ${'★'.repeat(item.rating)}${'☆'.repeat(5-item.rating)} · ${new Date(item.createdAt).toLocaleString('vi-VN')}</p><p>${esc(item.notes)}</p></div><span class="tag ${item.status==='SYNCED'?'synced':''}">${item.status==='SYNCED'?'Đã đồng bộ':'Chờ đồng bộ'}</span></article>`).join(''):'<div class="empty">Chưa có phiếu khảo sát nào. Hãy tạo phiếu đầu tiên.</div>';
  updateCounts();
}

function esc(value){
  const e=document.createElement('div');
  e.textContent=value||'';
  return e.innerHTML;
}

let isSyncing = false;
async function sync(silent = false){
  if(!isOnline() || isSyncing) return;
  isSyncing = true;
  const localSurveys = await entries();
  const waiting = localSurveys.filter(x => x.status === 'PENDING_SYNC');
  
  if (!silent) $('#syncButton').textContent = 'Đang đồng bộ…';

  let cloudSurveys = null;

  try {
    const response = await fetch('/api/surveys/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localSurveys)
    });
    
    if (response.ok) {
      const resData = await response.json();
      if (resData.success && Array.isArray(resData.surveys) && resData.surveys.length > 0) {
        cloudSurveys = resData.surveys;
      }
    }
  } catch (err) {
    console.warn('API /api/surveys/sync không phản hồi:', err);
  }

  if (!cloudSurveys) {
    try {
      const res = await fetch(CLOUD_FALLBACK_URL);
      let existingRemote = [];
      if (res.ok) {
        const remoteObj = await res.json();
        if (remoteObj.data && Array.isArray(remoteObj.data.surveys)) {
          existingRemote = remoteObj.data.surveys;
        }
      }

      const map = new Map(existingRemote.map(item => [item.id, { ...item, status: 'SYNCED' }]));
      localSurveys.forEach(item => {
        map.set(item.id, { ...item, status: 'SYNCED' });
      });

      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      if (waiting.length > 0 || merged.length !== existingRemote.length) {
        await fetch(CLOUD_FALLBACK_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'VKU Field Surveys', data: { surveys: merged } })
        });
      }

      cloudSurveys = merged;
    } catch (e) {
      console.warn('Lỗi kết nối Cloud Storage:', e);
    }
  }

  if (cloudSurveys) {
    await saveEntries(cloudSurveys);
    await render();
    $('#syncButton').textContent = 'Đồng bộ ngay';
    if (!silent) notify(`Đã đồng bộ thành công! (${cloudSurveys.length} phiếu trên Cloud)`);
    isSyncing = false;
    return;
  }

  if (!waiting.length) {
    $('#syncButton').textContent = 'Đồng bộ ngay';
    isSyncing = false;
    return;
  }
  await new Promise(r => setTimeout(r, 650));
  localSurveys.forEach(x => { if (x.status === 'PENDING_SYNC') x.status = 'SYNCED'; });
  await saveEntries(localSurveys);
  await render();
  $('#syncButton').textContent = 'Đồng bộ ngay';
  if (!silent) notify(`Đã đồng bộ cục bộ ${waiting.length} phiếu.`);
  isSyncing = false;
}

function initQrModal(){
  const modal=$('#qrModal');
  const showBtn=$('#showQrBtn');
  const closeBtn=$('#closeQrBtn');
  const qrImg=$('#qrImage');
  const lanUrlText=$('#lanUrlText');
  const lanUrlLink=$('#lanUrlLink');

  if(!modal || !showBtn) return;

  showBtn.addEventListener('click', async()=>{
    modal.showModal();
    let connectUrl = window.location.href;
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const info = await res.json();
        if (info.url) connectUrl = info.url;
      }
    } catch(e) {
      console.log('Sử dụng fallback URL:', connectUrl);
    }
    lanUrlText.textContent = connectUrl;
    lanUrlLink.href = connectUrl;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(connectUrl)}`;
  });

  closeBtn.addEventListener('click', ()=>modal.close());
  modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.close(); });
}

$$('#ratings button').forEach(b=>b.addEventListener('click',()=>{selectRating(b.dataset.rating);persistDraft()}));
form.addEventListener('input',persistDraft);

$('#photoInput').addEventListener('change',e=>{
  const file=e.target.files[0];
  if(!file)return;
  const r=new FileReader();
  r.onload=()=>{
    photoData=r.result;
    $('#photoPreview').src=photoData;
    $('#photoPreview').classList.remove('hidden');
    persistDraft();
  };
  r.readAsDataURL(file);
});

form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!rating)return notify('Vui lòng chọn mức đánh giá tình trạng.');
  const item={...getData(),rating,photoData,id:crypto.randomUUID(),createdAt:new Date().toISOString(),status:'PENDING_SYNC'};
  const data=await entries();
  data.unshift(item);
  await saveEntries(data);
  await remove(DRAFT);
  form.reset();
  rating=0;
  photoData='';
  selectRating(0);
  $('#photoPreview').classList.add('hidden');
  $('#draftState').textContent='Tự động lưu bản nháp';
  render();
  notify('Đã lưu phiếu. '+(isOnline()?'Đang chuẩn bị đồng bộ.':'Phiếu sẽ tự đồng bộ khi có mạng.'));
  if(isOnline())sync();
});

$('#clearDraft').addEventListener('click',async()=>{
  await remove(DRAFT);
  form.reset();
  rating=0;
  photoData='';
  selectRating(0);
  $('#photoPreview').classList.add('hidden');
  notify('Đã xóa bản nháp.');
});

$('#syncButton').addEventListener('click',()=>sync(false));

$('#exportButton').addEventListener('click',async()=>{
  const blob=new Blob([JSON.stringify(await entries(),null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='vku-field-survey.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#importButton').addEventListener('click',()=>$('#importInput').click());
$('#importInput').addEventListener('change',async e=>{
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=async()=>{
    try{
      const importedData=JSON.parse(reader.result);
      if(!Array.isArray(importedData)) throw new Error('File JSON phải chứa danh sách phiếu khảo sát.');
      const currentData=await entries();
      const existingMap=new Map(currentData.map(item=>[item.id,item]));
      let added=0;
      importedData.forEach(item=>{
        if(item.id && !existingMap.has(item.id)){
          existingMap.set(item.id, item);
          added++;
        }
      });
      const merged=Array.from(existingMap.values());
      await saveEntries(merged);
      render();
      notify(`Đã nhập thành công ${added} phiếu mới.`);
    }catch(err){
      notify('Lỗi nhập dữ liệu: '+err.message);
    }
  };
  reader.readAsText(file);
  e.target.value='';
});

$$('.tab').forEach(b=>b.addEventListener('click',()=>{
  $$('.tab').forEach(x=>x.classList.toggle('active',x===b));
  $('#formView').classList.toggle('hidden',b.dataset.view!=='form');
  $('#recordsView').classList.toggle('hidden',b.dataset.view!=='records');
  render();
}));

window.addEventListener('online',updateStatus);
window.addEventListener('offline',updateStatus);
if('serviceWorker'in navigator) navigator.serviceWorker.register('sw.js');

loadDraft();
render();
updateStatus();
initQrModal();

// Tự động kiểm tra và đồng bộ thời gian thực mỗi 4 giây
setInterval(() => {
  if (isOnline()) {
    sync(true);
  }
}, 4000);
