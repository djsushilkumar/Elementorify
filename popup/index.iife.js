document.addEventListener("DOMContentLoaded",()=>{const a=document.getElementById("btn-inspect"),s=document.getElementById("vp-desktop"),i=document.getElementById("vp-tablet"),c=document.getElementById("vp-mobile"),o=document.getElementById("element-details");async function l(){return(await chrome.tabs.query({active:!0,lastFocusedWindow:!0}))[0]||(await chrome.tabs.query({active:!0,currentWindow:!0}))[0]}a==null||a.addEventListener("click",async()=>{const e=await l();if(!(e!=null&&e.id))return;const t=e.id;try{await chrome.tabs.sendMessage(t,{action:"enableCaptureData",tabId:t})}catch{try{await chrome.scripting.executeScript({target:{tabId:t},files:["content-ui/index.iife.js"]}),await chrome.tabs.sendMessage(t,{action:"enableCaptureData",tabId:t})}catch(m){console.error("Script injection failed:",m),alert("Cannot inspect on this page (Chrome restricts extensions on chrome:// pages and store pages).")}}finally{window.close()}});async function r(e,t){const n=await l();n!=null&&n.id&&(e===0?chrome.runtime.sendMessage({action:"restoreViewport",tabId:n.id}):chrome.runtime.sendMessage({action:"setViewport",tabId:n.id,data:{width:e,height:t,deviceScaleFactor:1,mobile:e<600}}))}s==null||s.addEventListener("click",()=>r(0,0)),i==null||i.addEventListener("click",()=>r(768,1024)),c==null||c.addEventListener("click",()=>r(375,812));function d(e){if(o){if(!e){o.innerHTML=`
        <div class="empty-state">
          No element selected yet.<br>Click "Inspect & Pick Element" above.
        </div>
      `;return}o.innerHTML=`
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
    `}}chrome.storage.local.get(["lastClickedElementData"],e=>{d(e.lastClickedElementData)}),chrome.runtime.onMessage.addListener(e=>{e.action==="updatePopup"&&d(e.data)})});
