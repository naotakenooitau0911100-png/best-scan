// =====================================
// BEST Scan
// app.js
// 楽天 商品価格ナビ → 楽天市場 fallback
// =====================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbzw4EnwTKAj7_NDQV_qUL0UTXjoi3UiYc5iHUL4HapBFTABhmKdXW-RxWSNw3AYSz99/exec";

// 楽天 商品価格ナビ製品検索API
const RAKUTEN_PRODUCT_API =
    "https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801";

// 楽天市場 商品検索API
const RAKUTEN_ITEM_API =
    "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

// 楽天認証
const RAKUTEN_APP_ID =
    "3646974f-f5d8-42ca-ac9e-baa64e85e179";

const RAKUTEN_ACCESS_KEY =
    "pk_p2ATD3EG1jv3hM1l7mmoHfBmCI3fF1denIRIYG5EL9M";

let scanner = null;

let currentItem = {
    jan: "",
    maker: "",
    name: ""
};

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
                    "検索中...";

                nameEl.textContent =
                    "検索中...";

                messageEl.textContent =
                    "JAN読み取り完了";

                await stopScan();

                await findProduct(
                    currentItem.jan
                );

            },

            function() {}

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

        } catch (e) {}

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


// =====================================
// 商品検索メイン
// =====================================

async function findProduct(jan) {

    messageEl.textContent =
        "楽天 商品価格ナビを検索中...";

    // ---------------------------------
    // ① 商品価格ナビ
    // ---------------------------------

    try {

        const product =
            await rakutenProductSearch(jan);

        if (product) {

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

            if (maker || name) {

                currentItem.maker =
                    maker;

                currentItem.name =
                    name;

                makerEl.textContent =
                    maker || "未取得";

                nameEl.textContent =
                    name || "未取得";

                messageEl.textContent =
                    "楽天 商品価格ナビから取得しました";

                await saveCurrent();

                return;
            }
        }

    } catch (error) {

        console.log(
            "商品価格ナビ検索失敗:",
            error
        );
    }


    // ---------------------------------
    // ② 楽天市場 fallback
    // ---------------------------------

    messageEl.textContent =
        "楽天市場の商品を検索中...";

    try {

        const item =
            await rakutenItemSearch(jan);

        if (item) {

            const name =
                String(
                    item.itemName ||
                    ""
                ).trim();

            const maker =
                guessMaker(name);

            if (name) {

                currentItem.maker =
                    maker;

                currentItem.name =
                    name;

                makerEl.textContent =
                    maker || "未取得";

                nameEl.textContent =
                    name;

                messageEl.textContent =
                    "楽天市場から商品情報を取得しました";

                await saveCurrent();

                return;
            }
        }

    } catch (error) {

        console.log(
            "楽天市場検索失敗:",
            error
        );
    }


    // ---------------------------------
    // ③ 見つからない
    // ---------------------------------

    makerEl.textContent =
        "未取得";

    nameEl.textContent =
        "未取得";

    messageEl.textContent =
        "❌ 楽天に商品情報がありません";
}


// =====================================
// 商品価格ナビ検索
// =====================================

function rakutenProductSearch(jan) {

    return new Promise(function(resolve, reject) {

        const codes = [jan];

        if (/^\d{12}$/.test(jan)) {

            codes.push(
                "0" + jan
            );
        }

        rakutenProductSearchCode(
            codes,
            0,
            resolve,
            reject
        );
    });
}


// =====================================
// 商品価格ナビ検索本体
// =====================================

function rakutenProductSearchCode(
    codes,
    index,
    resolve,
    reject
) {

    if (index >= codes.length) {

        resolve(null);

        return;
    }

    const callbackName =
        "BESTProductCallback_" +
        Date.now();

    const script =
        document.createElement("script");

    script.id =
        "rakuten-product-script";

    let finished = false;

    const cleanup =
        function() {

            if (script.parentNode) {
                script.parentNode.removeChild(
                    script
                );
            }

            try {
                delete window[callbackName];
            } catch (e) {}
        };

    window[callbackName] =
        function(data) {

            if (finished) {
                return;
            }

            finished = true;

            clearTimeout(timeout);

            cleanup();

            if (
                data &&
                data.items &&
                data.items.length > 0
            ) {

                resolve(
                    data.items[0]
                );

                return;
            }

            rakutenProductSearchCode(
                codes,
                index + 1,
                resolve,
                reject
            );
        };

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
            codes[index],

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

    script.src =
        RAKUTEN_PRODUCT_API +
        "?" +
        query;

    script.onerror =
        function() {

            if (finished) {
                return;
            }

            finished = true;

            clearTimeout(timeout);

            cleanup();

            rakutenProductSearchCode(
                codes,
                index + 1,
                resolve,
                reject
            );
        };

    const timeout =
        setTimeout(
            function() {

                if (finished) {
                    return;
                }

                finished = true;

                cleanup();

                rakutenProductSearchCode(
                    codes,
                    index + 1,
                    resolve,
                    reject
                );

            },
            8000
        );

    document.body.appendChild(
        script
    );
}


// =====================================
// 楽天市場 商品検索
// =====================================

function rakutenItemSearch(jan) {

    return new Promise(function(resolve, reject) {

        const codes = [jan];

        if (/^\d{12}$/.test(jan)) {

            codes.push(
                "0" + jan
            );
        }

        rakutenItemSearchCode(
            codes,
            0,
            resolve,
            reject
        );
    });
}


// =====================================
// 楽天市場検索本体
// =====================================

function rakutenItemSearchCode(
    codes,
    index,
    resolve,
    reject
) {

    if (index >= codes.length) {

        resolve(null);

        return;
    }

    const callbackName =
        "BESTItemCallback_" +
        Date.now();

    const script =
        document.createElement("script");

    script.id =
        "rakuten-item-script";

    let finished = false;

    const cleanup =
        function() {

            if (script.parentNode) {
                script.parentNode.removeChild(
                    script
                );
            }

            try {
                delete window[callbackName];
            } catch (e) {}
        };

    window[callbackName] =
        function(data) {

            if (finished) {
                return;
            }

            finished = true;

            clearTimeout(timeout);

            cleanup();

            if (
                data &&
                data.Items &&
                data.Items.length > 0
            ) {

                resolve(
                    data.Items[0].Item
                );

                return;
            }

            if (
                data &&
                data.items &&
                data.items.length > 0
            ) {

                resolve(
                    data.items[0]
                );

                return;
            }

            rakutenItemSearchCode(
                codes,
                index + 1,
                resolve,
                reject
            );
        };

    const params = {

        applicationId:
            RAKUTEN_APP_ID,

        accessKey:
            RAKUTEN_ACCESS_KEY,

        format:
            "json",

        formatVersion:
            "2",

        keyword:
            codes[index],

        hits:
            "10",

        field:
            "1",

        availability:
            "0",

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

    script.src =
        RAKUTEN_ITEM_API +
        "?" +
        query;

    script.onerror =
        function() {

            if (finished) {
                return;
            }

            finished = true;

            clearTimeout(timeout);

            cleanup();

            rakutenItemSearchCode(
                codes,
                index + 1,
                resolve,
                reject
            );
        };

    const timeout =
        setTimeout(
            function() {

                if (finished) {
                    return;
                }

                finished = true;

                cleanup();

                rakutenItemSearchCode(
                    codes,
                    index + 1,
                    resolve,
                    reject
                );

            },
            10000
        );

    document.body.appendChild(
        script
    );
}


// =====================================
// メーカー推定
// テニス用品用
// =====================================

function guessMaker(name) {

    const text =
        String(name || "")
            .toUpperCase();

    const makers = [

        ["YONEX", "YONEX"],

        ["ヨネックス", "YONEX"],

        ["WILSON", "Wilson"],

        ["ウイルソン", "Wilson"],

        ["BABOLAT", "Babolat"],

        ["バボラ", "Babolat"],

        ["HEAD", "HEAD"],

        ["ヘッド", "HEAD"],

        ["DUNLOP", "DUNLOP"],

        ["ダンロップ", "DUNLOP"],

        ["PRINCE", "Prince"],

        ["プリンス", "Prince"],

        ["GOSEN", "GOSEN"],

        ["ゴーセン", "GOSEN"],

        ["BRIDGESTONE", "BRIDGESTONE"],

        ["ブリヂストン", "BRIDGESTONE"],

        ["SRIXON", "SRIXON"],

        ["スリクソン", "SRIXON"],

        ["MIZUNO", "MIZUNO"],

        ["ミズノ", "MIZUNO"],

        ["ASICS", "ASICS"],

        ["アシックス", "ASICS"],

        ["ADIDAS", "adidas"],

        ["アディダス", "adidas"],

        ["NEW BALANCE", "New Balance"],

        ["ニューバランス", "New Balance"],

        ["SNAUWAERT", "SNAUWAERT"],

        ["スノワート", "SNAUWAERT"],

        ["TOALSON", "TOALSON"],

        ["トアルソン", "TOALSON"],

        ["Tecnifibre", "Tecnifibre"],

        ["テクニファイバー", "Tecnifibre"],

        ["FILA", "FILA"],

        ["フィラ", "FILA"]

    ];

    for (
        let i = 0;
        i < makers.length;
        i++
    ) {

        if (
            text.indexOf(
                makers[i][0]
            ) !== -1
        ) {

            return makers[i][1];

        }
    }

    return "";
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

    if (
        !currentItem.maker &&
        !currentItem.name
    ) {

        messageEl.textContent =
            "❌ 商品情報がないため保存できません";

        return;
    }

    messageEl.textContent =
        "スプレッドシートへ保存しています...";

    try {

        const response =
            await fetch(
                API_URL,
                {

                    method:
                        "POST",

                    redirect:
                        "follow",

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

        if (
            json.status ===
            "created"
        ) {

            messageEl.textContent =
                "✅ 新規登録しました（数量 1）";

            return;
        }

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
// 初期表示
// =====================================

janEl.textContent = "---";

makerEl.textContent = "---";

nameEl.textContent = "---";

messageEl.textContent = "";
