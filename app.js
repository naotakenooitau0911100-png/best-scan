const API_URL = "https://script.google.com/macros/s/AKfycbzw4EnwTKAj7_NDQV_qUL0UTXjoi3UiYc5iHUL4HapBFTABhmKdXW-RxWSNw3AYSz99/exec";

let scanner = null;

const janEl = document.getElementById("jan");
const makerEl = document.getElementById("maker");
const nameEl = document.getElementById("name");
const messageEl = document.getElementById("message");

document.getElementById("startBtn").addEventListener("click", startScan);
document.getElementById("stopBtn").addEventListener("click", stopScan);
document.getElementById("saveBtn").addEventListener("click", saveCurrent);

let currentItem = {
  jan: "",
  maker: "",
  name: ""
};

async function startScan() {

  if (scanner) return;

  scanner = new Html5Qrcode("reader");

  await scanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 120 }
    },
    onScanSuccess
  );

}

async function stopScan() {

  if (!scanner) return;

  await scanner.stop();
  await scanner.clear();

  scanner = null;

}

async function onScanSuccess(decodedText) {

  currentItem.jan = decodedText;

  janEl.textContent = decodedText;

  // 商品検索は次段階で接続
  currentItem.maker = "";
  currentItem.name = "";

  makerEl.textContent = "(取得待ち)";
  nameEl.textContent = "(取得待ち)";

  messageEl.textContent = "読み取り完了";

  stopScan();

}

async function saveCurrent() {

  if (!currentItem.jan) {

    alert("先にバーコードを読み取ってください");

    return;

  }

  const res = await fetch(API_URL, {

    method: "POST",

    redirect: "follow",

    headers: {

      "Content-Type":"text/plain;charset=utf-8"

    },

    body: JSON.stringify(currentItem)

  });

  const json = await res.json();

  if(json.status==="created"){

      messageEl.textContent="新規登録しました";

  }else if(json.status==="updated"){

      messageEl.textContent="数量を更新しました（"+json.quantity+"）";

  }else{

      messageEl.textContent="エラー："+json.message;

  }

}
