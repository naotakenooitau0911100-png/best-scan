const API_URL = "https://script.google.com/macros/s/AKfycbzw4EnwTKAj7_NDQV_qUL0UTXjoi3UiYc5iHUL4HapBFTABhmKdXW-RxWSNw3AYSz99/exec";

let scanner = null;

const janEl = document.getElementById("jan");
const makerEl = document.getElementById("maker");
const nameEl = document.getElementById("name");
const messageEl = document.getElementById("message");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const saveBtn = document.getElementById("saveBtn");

let currentItem = {
    jan: "",
    maker: "",
    name: ""
};

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);
saveBtn.addEventListener("click", saveCurrent);

async function startScan() {

    if (scanner) return;

    messageEl.textContent = "カメラを起動しています...";

    try {

        scanner = new Html5Qrcode("reader");

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
            alert("カメラが見つかりません");
            messageEl.textContent = "カメラが見つかりません";
            return;
        }

        // デバッグ用
        alert(JSON.stringify(cameras, null, 2));

        let cameraId = cameras[0].id;

        // メイン(1x)カメラを優先
let backCamera =
    cameras.find(c =>
        (c.label || "").toLowerCase().includes("back")
    );

// "Back Camera" が無ければ "Wide" を優先
if (!backCamera) {
    backCamera = cameras.find(c =>
        (c.label || "").toLowerCase().includes("wide")
    );
}

// Ultra Wide は最後の候補
if (!backCamera) {
    backCamera = cameras.find(c =>
        (c.label || "").toLowerCase().includes("ultra")
    );
}

// Rear はその次
if (!backCamera) {
    backCamera = cameras.find(c =>
        (c.label || "").toLowerCase().includes("rear")
    );
}

let cameraId = backCamera ? backCamera.id : cameras[0].id;
        if (backCamera) {

            cameraId = backCamera.id;

        } else if (cameras.length > 1) {

            // iPhoneは最後が背面のことが多い
            cameraId = cameras[cameras.length - 1].id;

        }

        await scanner.start(
            cameraId,
            {
                fps: 10,
                qrbox: {
                    width: 260,
                    height: 120
                },
                aspectRatio: 1.7778
            },
            onScanSuccess,
            () => {}
        );

        messageEl.textContent = "バーコードを読み取ってください";

    } catch (err) {

        console.error(err);

        alert(err.message);

        messageEl.textContent = err.message;

        scanner = null;

    }

}

async function stopScan() {

    try {

        if (!scanner) return;

        await scanner.stop();

        await scanner.clear();

    } catch (e) {

        console.log(e);

    }

    scanner = null;

}
async function onScanSuccess(decodedText) {

    currentItem.jan = decodedText;
    currentItem.maker = "";
    currentItem.name = "";

    janEl.textContent = decodedText;
    makerEl.textContent = "(取得待ち)";
    nameEl.textContent = "(取得待ち)";

    messageEl.textContent = "読み取り完了";

    await stopScan();

}

async function saveCurrent() {

    if (!currentItem.jan) {

        alert("先にバーコードを読み取ってください");

        return;

    }

    messageEl.textContent = "保存しています...";

    try {

        const res = await fetch(API_URL, {

            method: "POST",

            redirect: "follow",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify(currentItem)

        });

        const json = await res.json();

        if (json.status === "created") {

            messageEl.textContent = "✅ 新規登録しました";

        } else if (json.status === "updated") {

            messageEl.textContent =
                "✅ 数量を更新しました（" + json.quantity + "）";

        } else {

            messageEl.textContent =
                "❌ エラー：" + json.message;

        }

    } catch (err) {

        console.error(err);

        messageEl.textContent =
            "❌ 通信エラー：" + err.message;

    }

}
