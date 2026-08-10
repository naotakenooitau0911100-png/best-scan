// BEST Scan Ver1 - 楽天JAN検索 + 在庫登録

const API_URL = "https://script.google.com/macros/s/AKfycbzw4EnwTKAj7_NDQV_qUL0UTXjoi3UiYc5iHUL4HapBFTABhmKdXW-RxWSNw3AYSz99/exec";

let scanner = null;

let currentItem = {
    jan: "",
    maker: "",
    name: ""
};

const janEl = document.getElementById("jan");
const makerEl = document.getElementById("maker");
const nameEl = document.getElementById("name");
const messageEl = document.getElementById("message");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const saveBtn = document.getElementById("saveBtn");

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);
saveBtn.addEventListener("click", saveCurrent);

async function startScan() {
    if (scanner) return;

    messageEl.textContent = "カメラを起動しています...";

    try {
        scanner = new Html5Qrcode("reader");

        await scanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: {
                    width: 280,
                    height: 140
                }
            },
            async (decodedText) => {
                if (!decodedText) return;

                currentItem = {
                    jan: String(decodedText).trim(),
                    maker: "",
                    name: ""
                };

                janEl.textContent = currentItem.jan;
                makerEl.textContent = "楽天検索中...";
                nameEl.textContent = "楽天検索中...";
                messageEl.textContent = "JAN読み取り完了";

                await stopScan();
                await saveCurrent();
            },
            () => {}
        );

        messageEl.textContent = "バーコードを読み取ってください";

    } catch (error) {
        console.error(error);
        messageEl.textContent = "カメラを起動できませんでした";

        try {
            if (scanner) await scanner.clear();
        } catch (e) {}

        scanner = null;
    }
}

async function stopScan() {
    if (!scanner) return;

    try {
        await scanner.stop();
    } catch (e) {
        console.log(e);
    }

    try {
        await scanner.clear();
    } catch (e) {
        console.log(e);
    }

    scanner = null;
}

async function saveCurrent() {
    if (!currentItem.jan) {
        alert("先にバーコードを読み取ってください");
        return;
    }

    messageEl.textContent = "楽天で商品情報を検索しています...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            redirect: "follow",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(currentItem)
        });

        const json = await response.json();

        if (json.maker) {
            currentItem.maker = json.maker;
            makerEl.textContent = json.maker;
        } else {
            makerEl.textContent = "未取得";
        }

        if (json.name) {
            currentItem.name = json.name;
            nameEl.textContent = json.name;
        } else {
            nameEl.textContent = "未取得";
        }

        if (json.status === "created") {
            messageEl.textContent = "✅ 新規登録しました（数量 1）";
        } else if (json.status === "updated") {
            messageEl.textContent =
                "✅ 数量を更新しました（" + json.quantity + "）";
        } else {
            messageEl.textContent =
                "❌ エラー：" + (json.message || "保存に失敗しました");
        }

    } catch (error) {
        console.error(error);
        messageEl.textContent = "❌ 通信エラー：" + error.message;
    }
}
