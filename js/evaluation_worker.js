
"use strict";

if (false) {
    var console = {
        log: () => {},
        debug: () => {},
    };
}

importScripts("./mahjong.js");


onmessage = function (e) {
    let id = e.data.id;
    let request = e.data.body;

    let dahai = request.dahai;
    let haiyama = request.haiyama;
    let tehai = request.tehai;
    let shanten_to = request.shanten_to;
    let remaining_henka = request.remaining_henka;
    let coef_tenpai = request.coef_tenpai;
    let dahai_hint = request.dahai_hint;

    console.debug("evaluation worker start", { color: dahai?.color, rank: dahai?.rank, remaining_henka: remaining_henka, coef_tenpai: coef_tenpai, dahai_hint: dahai_hint });

    let score = evaluate_tehai_13(haiyama, tehai, shanten_to, remaining_henka, coef_tenpai, dahai_hint);
    postMessage({
        id: id,
        body: score,
    });

    console.debug("evaluation worker end", { color: dahai?.color, rank: dahai?.rank, shanten: score.shanten, distance: score.distance });
}
