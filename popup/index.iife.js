document.addEventListener("DOMContentLoaded",()=>{const n=document.getElementById("btn-inspect"),a=document.getElementById("vp-desktop"),s=document.getElementById("vp-tablet"),i=document.getElementById("vp-mobile"),c=document.getElementById("element-details");n==null||n.addEventListener("click",async()=>{const[e]=await chrome.tabs.query({active:!0,currentWindow:!0});e!=null&&e.id&&(chrome.tabs.sendMessage(e.id,{action:"enableCaptureData",tabId:e.id}).catch(()=>{alert("Please refresh the page or make sure you are on a valid web page.")}),window.close())});async function o(e,d){const[t]=await chrome.tabs.query({active:!0,currentWindow:!0});t!=null&&t.id&&(e===0?chrome.runtime.sendMessage({action:"restoreViewport",tabId:t.id}):chrome.runtime.sendMessage({action:"setViewport",tabId:t.id,data:{width:e,height:d,deviceScaleFactor:1,mobile:e<600}}))}a==null||a.addEventListener("click",()=>o(0,0)),s==null||s.addEventListener("click",()=>o(768,1024)),i==null||i.addEventListener("click",()=>o(375,812));function l(e){if(c){if(!e){c.innerHTML=`
        <div class="empty-state">
          No element selected yet.<br>Click "Inspect & Pick Element" above.
        </div>
      `;return}c.innerHTML=`
      <div class="element-info">
        <div class="info-row">
          <span class="info-label">Tag:</span>
          <span class="info-val">&lt;${e.tagName.toLowerCase()}&gt;</span>
        </div>
        <div class="info-row">
          <span class="info-label">Class:</span>
          <span class="info-val">${e.className||"None"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Size:</span>
          <span class="info-val">${e.rect.width}px × ${e.rect.height}px</span>
        </div>
      </div>
    `}}chrome.storage.local.get(["lastClickedElementData"],e=>{l(e.lastClickedElementData)}),chrome.runtime.onMessage.addListener(e=>{e.action==="updatePopup"&&l(e.data)})});
