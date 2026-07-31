document.addEventListener("DOMContentLoaded",()=>{const o=document.getElementById("btn-inspect"),s=document.getElementById("vp-desktop"),n=document.getElementById("vp-tablet"),c=document.getElementById("vp-mobile"),r=document.getElementById("element-details"),d=document.querySelectorAll(".swatch");function m(e){document.body.setAttribute("data-theme",e),d.forEach(t=>{t.getAttribute("data-theme")===e?t.classList.add("active"):t.classList.remove("active")}),chrome.storage.local.set({popupTheme:e})}d.forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-theme");t&&m(t)})}),chrome.storage.local.get(["popupTheme"],e=>{e.popupTheme&&m(e.popupTheme)});async function p(){return(await chrome.tabs.query({active:!0,lastFocusedWindow:!0}))[0]||(await chrome.tabs.query({active:!0,currentWindow:!0}))[0]}o==null||o.addEventListener("click",async()=>{const e=await p();if(!(e!=null&&e.id))return;const t=e.id;try{await chrome.tabs.sendMessage(t,{action:"enableCaptureData",tabId:t})}catch{try{await chrome.scripting.executeScript({target:{tabId:t},files:["content-ui/index.iife.js"]}),await chrome.tabs.sendMessage(t,{action:"enableCaptureData",tabId:t})}catch(a){console.error("Script injection failed:",a),alert("Cannot inspect on this page (Chrome restricts extensions on chrome:// pages and store pages).")}}finally{window.close()}});function g(e){[s,n,c].forEach(t=>t==null?void 0:t.classList.remove("active")),e==null||e.classList.add("active")}async function l(e,t,i){g(i);const a=await p();a!=null&&a.id&&(e===0?chrome.runtime.sendMessage({action:"restoreViewport",tabId:a.id}):chrome.runtime.sendMessage({action:"setViewport",tabId:a.id,data:{width:e,height:t,deviceScaleFactor:1,mobile:e<600}}))}s==null||s.addEventListener("click",()=>l(0,0,s)),n==null||n.addEventListener("click",()=>l(768,1024,n)),c==null||c.addEventListener("click",()=>l(375,812,c));function u(e){if(!r)return;if(!e){r.innerHTML=`
        <div class="empty-info">
          No element captured yet.<br>Click <strong>"Inspect & Pick Element"</strong> above.
        </div>
      `;return}const t=e.tagName?`<${e.tagName.toLowerCase()}>`:"element",i=e.className?e.className.split(" ").slice(0,3).join(" "):"None",a=e.rect?`${e.rect.width}px × ${e.rect.height}px`:"Auto";r.innerHTML=`
      <div class="data-list">
        <div class="data-row">
          <span class="data-label">HTML Tag:</span>
          <span class="data-val">${t}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Classes:</span>
          <span class="data-val" title="${e.className||""}">${i}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Dimensions:</span>
          <span class="data-val">${a}</span>
        </div>
      </div>
    `}chrome.storage.local.get(["lastClickedElementData"],e=>{u(e.lastClickedElementData)}),chrome.runtime.onMessage.addListener(e=>{e.action==="updatePopup"&&u(e.data)})});
