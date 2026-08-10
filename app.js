
const API_URL="https://script.google.com/macros/s/AKfycbzw4EnwTKAj7_NDQV_qUL0UTXjoi3UiYc5iHUL4HapBFTABhmKdXW-RxWSNw3AYSz99/exec";
const janEl=document.getElementById("jan");
const makerEl=document.getElementById("maker");
const nameEl=document.getElementById("name");
const msg=document.getElementById("message");
document.getElementById("startBtn").onclick=startScan;
document.getElementById("stopBtn").onclick=stopScan;
document.getElementById("saveBtn").onclick=saveCurrent;
async function startScan(){
 if(scanner) return;
 scanner=new Html5Qrcode("reader");
 await scanner.start({facingMode:{exact:"environment"}},{fps:10,qrbox:250},
 async(code)=>{
   currentItem.jan=code;
   janEl.textContent=code;
   makerEl.textContent="-";
   nameEl.textContent="-";
   msg.textContent="読み取り完了";
   await stopScan();
 });
}
async function stopScan(){
 if(!scanner) return;
 try{await scanner.stop();await scanner.clear();}catch(e){}
 scanner=null;
}
async function saveCurrent(){
 if(!currentItem.jan){alert("先にスキャンしてください");return;}
 const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(currentItem)});
 const j=await r.json();
 msg.textContent=JSON.stringify(j);
}
