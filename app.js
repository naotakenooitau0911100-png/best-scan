// =====================================
// BEST Scan Ver1
// app.js
// 楽天JAN検索 → GAS在庫登録
// =====================================

// -------------------------------------
// GAS API
// -------------------------------------

const API_URL =
    "https://script.google.com/macros/s/AKfycbzw4EnwTKAj7_NDQV_qUL0UTXjoi3UiYc5iHUL4HapBFTABhmKdXW-RxWSNw3AYSz99/exec";

// -------------------------------------
// 楽天API
// -------------------------------------

const RAKUTEN_API_URL =
    "https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801";

// -------------------------------------
// 楽天認証
// -------------------------------------

const RAKUTEN_APP_ID =
    "3646974f-f5d8-42ca-ac9e-baa64e85e179";

const RAKUTEN_ACCESS_KEY =
    "pk_p2ATD3EG1jv3hM1l7mmoHfBmCI3fF1denIRIYG5EL9M";

// -------------------------------------
// スキャナー
// -------------------------------------

let scanner = null;

// -------------------------------------
// 現在の商品
// -------------------------------------

let currentItem = {
    jan: "",
    maker: "",
    name: ""
};

// -------------------------------------
// HTML
// -------------------------------------

const janEl =
    document.getElementById("jan");

const makerEl =
    document.getElementById("maker");

const nameEl =
    document.getElementById("name");

const messageEl =
    document.getElementById("message");

const startBtn =
    document.getElementById("startBtn");

const stopBtn =
    document.getElementById("stopBtn");

const saveBtn =
    document.getElementById("saveBtn");

// -------------------------------------
// ボタン
// -------------------------------------

startBtn.addEventListener(
    "click",
    startScan
);

stopBtn.addEventListener(
    "click",
    stopScan
);

saveBtn.addEventListener(
    "click",
    saveCurrent
);

// =====================================
// カメラ起動
// =====================================

async function startScan() {

    if (scanner) {
        return;
    }

    messageEl.textContent =
        "カメラを起動しています...";

    try {

        scanner =
            new Html5Qrcode("reader");

        await scanner.start(

            {
                facingMode:
                    "environment"
            },

            {
                fps: 10,

                qrbox: {
                    width: 280,
                    height: 140
                }
            },

            async function(decodedText) {

                if (!decodedText) {
                    return;
                }

                // ---------------------------------
                // JANセット
                // ---------------------------------

                currentItem = {

                    jan:
                        String(decodedText)
                            .trim(),

                    maker: "",

                    name: ""

                };

                janEl.textContent =
                    currentItem.jan;

                makerEl.textContent =
                    "楽天検索中...";

                nameEl.textContent =
                    "楽天検索中...";

                messageEl.textContent =
                    "JAN読み取り完了";

                // ---------------------------------
                // カメラ停止
                // ---------------------------------

                await stopScan();

                // ---------------------------------
                // 楽天検索
                // ---------------------------------

                await searchRakuten(
                    currentItem.jan
                );

            },

            function() {
                // 読み取り失敗は無視
            }

        );

        messageEl.textContent =
            "バーコードを読み取ってください";

    }

    catch (error) {

        console.error(error);

        messageEl.textContent =
            "❌ カメラを起動できませんでした";

        try {

            if (scanner) {
                await scanner.clear();
            }

        }

        catch (e) {}

        scanner = null;

    }

}

// =====================================
// カメラ停止
// =====================================

async function stopScan() {

    if (!scanner) {
        return;
    }

    try {

        await scanner.stop();

    }

    catch (e) {

        console.log(e);

    }

    try {

        await scanner.clear();

    }

    catch (e) {

        console.log(e);

    }

    scanner = null;

}

// =====================================
// 楽天検索
// JSONP方式
// =====================================

function searchRakuten(jan) {

    return new Promise(function(resolve) {

        messageEl.textContent =
            "楽天で商品情報を検索しています...";

        // ---------------------------------
        // 12桁の場合は0を追加したJANも試す
        // ---------------------------------

        const codes = [jan];

        if (/^\d{12}$/.test(jan)) {

            codes.push(
                "0" + jan
            );

        }

        searchRakutenCode(
            codes,
            0,
            resolve
        );

    });

}

// =====================================
// 楽天検索本体
// =====================================

function searchRakutenCode(
    codes,
    index,
    resolve
) {

    if (index >= codes.length) {

        makerEl.textContent =
            "未取得";

        nameEl.textContent =
            "未取得";

        messageEl.textContent =
            "❌ 楽天に商品情報がありません";

        resolve(false);

        return;
    }

    const productCode =
        codes[index];

    // ---------------------------------
    // JSONPコールバック名
    // ---------------------------------

    const callbackName =
        "BESTScanRakutenCallback";

    // ---------------------------------
    // 既存script削除
    // ---------------------------------

    const oldScript =
        document.getElementById(
            "rakuten-api-script"
        );

    if (oldScript) {
        oldScript.remove();
    }

    // ---------------------------------
    // JSONPコールバック
    // ---------------------------------

    window[callbackName] =
        function(data) {

            console.log(
                "楽天API response:",
                data
            );

            // ---------------------------------
            // 商品なし
            // ---------------------------------

            if (
                !data ||
                !data.items ||
                data.items.length === 0
            ) {

                searchRakutenCode(
                    codes,
                    index + 1,
                    resolve
                );

                return;
            }

            // ---------------------------------
            // 商品取得
            // ---------------------------------

            const product =
                data.items[0];

            const maker =
                String(
                    product.makerNameFormal ||
                    product.makerName ||
                    product.brandName ||
                    ""
                ).trim();

            const name =
                String(
                    product.productName ||
                    ""
                ).trim();

            // ---------------------------------
            // 画面表示
            // ---------------------------------

            currentItem.maker =
                maker;

            currentItem.name =
                name;

            makerEl.textContent =
                maker || "未取得";

            nameEl.textContent =
                name || "未取得";

            if (!maker && !name) {

                messageEl.textContent =
                    "❌ 商品情報を取得できませんでした";

                resolve(false);

                return;
            }

            // ---------------------------------
            // GASへ保存
            // ---------------------------------

            saveCurrent()
                .then(function() {

                    resolve(true);

                });

        };

    // ---------------------------------
    // URL
    // ---------------------------------

    const params = {

        applicationId:
            RAKUTEN_APP_ID,

        accessKey:
            RAKUTEN_ACCESS_KEY,

        format:
            "json",

        formatVersion:
            "2",

        productCode:
            productCode,

        hits:
            "1",

        callback:
            callbackName

    };

    const query =
        Object.keys(params)
            .map(function(key) {

                return (
                    encodeURIComponent(key) +
                    "=" +
                    encodeURIComponent(
                        params[key]
                    )
                );

            })
            .join("&");

    // ---------------------------------
    // script生成
    // ---------------------------------

    const script =
        document.createElement(
            "script"
        );

    script.id =
        "rakuten-api-script";

    script.src =
        RAKUTEN_API_URL +
        "?" +
        query;

    script.onerror =
        function() {

            console.error(
                "楽天API読み込みエラー"
            );

            searchRakutenCode(
                codes,
                index + 1,
                resolve
            );

        };

    // ---------------------------------
    // タイムアウト
    // ---------------------------------

    const timeout =
        setTimeout(
            function() {

                if (
                    document.getElementById(
                        "rakuten-api-script"
                    )
                ) {

                    document
                        .getElementById(
                            "rakuten-api-script"
                        )
                        .remove();

                }

                console.error(
                    "楽天APIタイムアウト"
                );

                searchRakutenCode(
                    codes,
                    index + 1,
                    resolve
                );

            },
            10000
        );

    // ---------------------------------
    // script追加
    // ---------------------------------

    document.body.appendChild(
        script
    );

}

// =====================================
// GASへ保存
// =====================================

async function saveCurrent() {

    if (!currentItem.jan) {

        alert(
            "先にバーコードを読み取ってください"
        );

        return;

    }

    messageEl.textContent =
        "スプレッドシートへ保存しています...";

    try {

        const response =
            await fetch(
                API_URL,
                {

                    method: "POST",

                    redirect: "follow",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify(
                            currentItem
                        )

                }
            );

        const json =
            await response.json();

        console.log(
            "GAS response:",
            json
        );

        // ---------------------------------
        // 新規
        // ---------------------------------

        if (
            json.status ===
            "created"
        ) {

            messageEl.textContent =
                "✅ 新規登録しました（数量 1）";

            return;

        }

        // ---------------------------------
        // 更新
        // ---------------------------------

        if (
            json.status ===
            "updated"
        ) {

            messageEl.textContent =
                "✅ 数量を更新しました（" +
                json.quantity +
                "）";

            return;

        }

        // ---------------------------------
        // エラー
        // ---------------------------------

        messageEl.textContent =
            "❌ エラー：" +
            (
                json.message ||
                "保存に失敗しました"
            );

    }

    catch (error) {

        console.error(error);

        messageEl.textContent =
            "❌ 保存通信エラー：" +
            error.message;

    }

}

// =====================================
// 初期化
// =====================================

janEl.textContent =
    "---";

makerEl.textContent =
    "---";

nameEl.textContent =
    "---";

messageEl.textContent =
    "";
