// =====================================
// BEST Scan Ver1
// ZXing Edition
// Part1
// =====================================

const API_URL = "https://script.google.com/macros/s/AKfycbzw4EnwTKAj7_NDQV_qUL0UTXjoi3UiYc5iHUL4HapBFTABhmKdXW-RxWSNw3AYSz99/exec";

let codeReader = null;
let selectedDeviceId = null;

let currentItem = {
    jan: "",
    maker: "",
    name: ""
};

const video = document.getElementById("reader");

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

    if (codeReader) return;

    messageEl.textContent = "カメラ起動中...";

    try {

        codeReader = new ZXing.BrowserMultiFormatReader();

        const devices = await ZXing.BrowserCodeReader.listVideoInputDevices();

        if (devices.length === 0) {
            throw new Error("カメラが見つかりません");
        }

        console.table(devices);

        let device = devices.find(d => {

            const label = (d.label || "").toLowerCase();

            return (
                label.includes("back") &&
                !label.includes("tele") &&
                !label.includes("ultra")
            );

        });

        if (!device) {

            device = devices.find(d =>
                (d.label || "").toLowerCase().includes("back")
            );

        }

        if (!device) {

            device = devices[devices.length - 1];

        }

        selectedDeviceId = device.deviceId;

        codeReader.decodeFromVideoDevice(

            selectedDeviceId,

            video,

            (result, err) => {

                if (result) {

                    onScanSuccess(result.getText());

                }

            }

        );

        messageEl.textContent = "バーコードを読み取ってください";

    } catch (err) {

        console.error(err);

        alert(err.message);

        messageEl.textContent = err.message;

        codeReader = null;

    }

}

async function stopScan() {

    if (!codeReader) return;

    codeReader.reset();

    codeReader = null;

}
// =====================================
// Part2
// =====================================

async function onScanSuccess(decodedText) {

    if (currentItem.jan === decodedText) return;

    currentItem = {
        jan: decodedText,
        maker: "",
        name: ""
    };

    janEl.textContent = decodedText;
    makerEl.textContent = "取得中...";
    nameEl.textContent = "取得中...";

    messageEl.textContent = "読み取り成功";

    await stopScan();

    await saveCurrent();

}

async function saveCurrent() {

    if (!currentItem.jan) return;

    messageEl.textContent = "保存しています...";

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            redirect: "follow",

            body: JSON.stringify(currentItem)

        });

        const json = await response.json();

        if (json.status === "created") {

            messageEl.textContent = "✅ 新規登録";

        } else if (json.status === "updated") {

            messageEl.textContent =
                "✅ 数量 " + json.quantity;

        } else {

            messageEl.textContent =
                "❌ " + json.message;

        }

    } catch (err) {

        console.error(err);

        messageEl.textContent =
            "通信エラー";

    }

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

    }, 1500);

}
// =====================================
// Part3
// JAN検索（仮実装）
// =====================================

async function searchJan(jan) {

    try {

        // 将来API接続予定
        currentItem.maker = "";
        currentItem.name = "";

        makerEl.textContent = "未取得";
        nameEl.textContent = "未取得";

    } catch (err) {

        console.error(err);

        makerEl.textContent = "取得失敗";
        nameEl.textContent = "取得失敗";

    }

}

// =====================================
// リセット
// =====================================

function resetScreen() {

    currentItem = {
        jan: "",
        maker: "",
        name: ""
    };

    janEl.textContent = "---";
    makerEl.textContent = "---";
    nameEl.textContent = "---";

    messageEl.textContent = "";

}

// =====================================
// 初期表示
// =====================================

resetScreen();
