// ======================================
// BEST Scan Ver1
// app.js Part1
// ======================================

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

// =========================
// カメラ起動
// =========================
async function startScan() {

    if (scanner) return;

    messageEl.textContent = "カメラを起動しています...";

    try {

        scanner = new Html5Qrcode("reader");

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
            throw new Error("カメラが見つかりません");
        }

        // 初回だけ確認用（完成後は削除）
        alert(JSON.stringify(cameras, null, 2));

        // メインカメラ(1x)を優先
        let camera = cameras.find(c => {
            const label = (c.label || "").toLowerCase();

            return (
                label.includes("back camera") ||
                label === "back camera"
            );
        });

        // Telephotoを除外
        if (!camera) {
            camera = cameras.find(c => {
                const label = (c.label || "").toLowerCase();

                return (
                    (label.includes("back") ||
                     label.includes("rear") ||
                     label.includes("wide")) &&
                    !label.includes("tele") &&
                    !label.includes("ultra")
                );
            });
        }

        // 最後の保険
        if (!camera) {
            camera = cameras.find(c =>
                (c.label || "").toLowerCase().includes("back")
            );
        }

        if (!camera) {
            camera = cameras[cameras.length - 1];
        }

      await scanner.start(
    camera.id,
    {
        fps: 10,
        qrbox: 250
    },
    onScanSuccess
);
        messageEl.textContent = "バーコードを読み取ってください";

    } catch (err) {

        console.error(err);

        alert(err.message);

        messageEl.textContent = err.message;

        scanner = null;

    }

}

// =========================
// カメラ停止
// =========================
async function stopScan() {

    if (!scanner) return;

    try {

        await scanner.stop();
        await scanner.clear();

    } catch (e) {
        console.log(e);
    }

    scanner = null;

}
// =========================
// バーコード読取成功
// =========================
async function onScanSuccess(decodedText) {

    // 二重読取防止
    if (currentItem.jan === decodedText) return;

    currentItem = {
        jan: decodedText,
        maker: "",
        name: ""
    };

    janEl.textContent = decodedText;
    makerEl.textContent = "検索中...";
    nameEl.textContent = "検索中...";

    messageEl.textContent = "JANコード読取完了";

    // カメラ停止
    await stopScan();

    // 商品検索
    await searchJan(decodedText);

}

// =========================
// JAN検索（仮）
// =========================
async function searchJan(jan) {

    try {

        // ここは次でAPI接続
        currentItem.maker = "";
        currentItem.name = "";

        makerEl.textContent = "取得予定";
        nameEl.textContent = "取得予定";

        // 自動保存
        await saveCurrent();

    } catch (err) {

        console.error(err);

        makerEl.textContent = "取得失敗";
        nameEl.textContent = "取得失敗";

    }

}

// =========================
// GAS保存
// =========================
async function saveCurrent() {

    if (!currentItem.jan) return;

    messageEl.textContent = "保存しています...";

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

        if (json.status === "created") {

            messageEl.textContent = "✅ 新規登録しました";

        } else if (json.status === "updated") {

            messageEl.textContent =
                "✅ 数量：" + json.quantity;

        } else {

            messageEl.textContent =
                "❌ " + json.message;

        }

    } catch (err) {

        console.error(err);

        messageEl.textContent =
            "通信エラー";

    }

    // 2秒後に次のスキャン開始
    setTimeout(() => {

        currentItem = {
            jan: "",
            maker: "",
            name: ""
        };

        janEl.textContent = "---";
        makerEl.textContent = "---";
        nameEl.textContent = "---";

        startScan();

    }, 2000);

}
