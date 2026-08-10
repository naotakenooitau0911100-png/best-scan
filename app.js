// =====================================
// BEST Scan Ver1
// ZXing Browser Edition
// Part1
// =====================================

const API_URL = "https://script.google.com/macros/s/AKfycbzw4EnwTKAj7_NDQV_qUL0UTXjoi3UiYc5iHUL4HapBFTABhmKdXW-RxWSNw3AYSz99/exec";

let codeReader = null;
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

document.getElementById("startBtn").addEventListener("click", startScan);
document.getElementById("stopBtn").addEventListener("click", stopScan);
document.getElementById("saveBtn").addEventListener("click", saveCurrent);

async function startScan() {

    if (codeReader) return;

    messageEl.textContent = "カメラ起動中...";

    try {

        codeReader = new ZXingBrowser.BrowserMultiFormatReader();

        const devices = await ZXingBrowser.BrowserCodeReader.listVideoInputDevices();

        if (!devices.length) {
            throw new Error("カメラが見つかりません");
        }

        console.table(devices);

        // 背面カメラ優先
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

        await codeReader.decodeFromVideoDevice(

            device.deviceId,

            video,

            (result, err) => {

                if (result) {

                    onScanSuccess(result.getText());

                }

            }

        );

        messageEl.textContent = "バーコードを読み取ってください";

    } catch (e) {

        console.error(e);

        alert(e.message);

        messageEl.textContent = e.message;

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

    messageEl.textContent = "JAN読取完了";

    await stopScan();

    await saveCurrent();

}

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

            messageEl.textContent = "✅ 数量 " + json.quantity;

        } else {

            messageEl.textContent = "❌ " + json.message;

        }

    } catch (err) {

        console.error(err);

        messageEl.textContent = "通信エラー";

    }

    setTimeout(() => {

        resetScreen();

        startScan();

    }, 1500);

}

function resetScreen() {

    currentItem = {
        jan: "",
        maker: "",
        name: ""
    };

    janEl.textContent = "---";
    makerEl.textContent = "---";
    nameEl.textContent = "---";

}
