
"use strict";


function simulate_game(strategy) {
    let shanten_d = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let agari_turn_s = 0;
    let tenpai_turn_s = 0;

    let last_logged_sec = 0;

    for (let n = 1; true; n++) {
        let game = do_one_game(strategy);

        shanten_d[game.shanten + 1] += 1;
        agari_turn_s += game.agari;
        tenpai_turn_s += game.tenpai;

        let sec = Math.floor(Date.now() / 1000);
        if (sec > last_logged_sec) {
            let shanten_s = 0;
            for (let i = 0; i < shanten_d.length; i++) {
                shanten_s += (i - 1) * shanten_d[i];
            }

            let p_waryo = shanten_d[0] / n;
            let p_tenpai = (shanten_d[0] + shanten_d[1]) / n;
            let a_shanten = shanten_s / n;
            let a_agari = agari_turn_s / n;
            let a_tenpai = tenpai_turn_s / n;

            console.log("n=" + n +
                " 和了率:" + (p_waryo * 100).toFixed(2) +
                " 聴牌率:" + (p_tenpai * 100).toFixed(2) +
                " 平均向聴:" + a_shanten.toFixed(2) +
                " 平均和了巡:" + a_agari.toFixed(4) +
                " 平均聴牌巡:" + a_tenpai.toFixed(4)
            );

            last_logged_sec = sec;
        }
    }
}

function do_one_game(f) {
    let tsumo_num = 18;

    //let tehai_paiset = paiset_zero();
    let tehai_paiset = [
        // 1  2  3  4  5  6  7  8  9
        [  0, 0, 0, 0, 0, 0, 0, 2, 0  ],  // m
        [  1, 1, 1, 1, 0, 0, 0, 0, 1  ],  // p
        [  1, 2, 0, 1, 0, 0, 0, 1, 0  ],  // s
        [  1, 1, 0, 0, 0, 0, 0        ],  // z
    ];

    let haiyama = paiset_zero();
    foreach_pai((color, rank) => {
        haiyama[color][rank] = 4 - tehai_paiset[color][rank];
    });

    tehai_paiset[3][0] -= 1;
    tsumo_num -= 1;

    let tehai_num = paiset_count(tehai_paiset);
    if (tehai_num > 13) {
        return;
    }

    let tehai = paiset_to_tehai(tehai_paiset, 4);

    // 配牌
    for (let i = tehai_num; i < 13; i++) {
        let pai = paiset_random_select(haiyama);
        haiyama[pai.color][pai.rank] -= 1;
        tehai_add(tehai, pai.color, pai.rank, 1);
    }

    let game_shanten = SHANTEN_AGARI;
    let agari_turn = 0;
    let tenpai_turn = 0;

    for (let t = 1; true; t++) {
        let tsumo = paiset_random_select(haiyama);
        haiyama[tsumo.color][tsumo.rank] -= 1;
        tehai_add(tehai, tsumo.color, tsumo.rank, 1);

        let shanten = shanten_number(tehai);

        if (t == tsumo_num) {
            game_shanten = shanten;
        }
        if (tenpai_turn == 0 && (shanten == SHANTEN_TENPAI || shanten == SHANTEN_AGARI)) {
            tenpai_turn = t;
        }
        if (shanten == SHANTEN_AGARI) {
            agari_turn = t;
            break;
        }

        let dahai = f(tehai, haiyama);
        tehai_add(tehai, dahai.color, dahai.rank, -1);
    }

    return {
        shanten: game_shanten,
        agari: agari_turn,
        tenpai: tenpai_turn,
    };
}

function strategy_ukeire(tehai, haiyama) {
    let current_shanten = shanten_number(tehai);

    let max_ukeire_num = 0;
    let dahai_list = [];

    foreach_octpaiset(tehai.octpaiset, (color, rank) => {
        tehai_add(tehai, color, rank, -1);
        let shanten = shanten_number(tehai);
        if (shanten == current_shanten) {
            let ukeire = find_ukeire(paiset_to_haiyama(haiyama), tehai);

            if (max_ukeire_num < ukeire.num) {
                max_ukeire_num = ukeire.num;
                dahai_list = [];
            }
            if (max_ukeire_num == ukeire.num) {
                dahai_list.push(mahjong_pai(color, rank));
            }
        }
        tehai_add(tehai, color, rank, 1);
    });

    dahai_list.sort((a, b) => {
        if (a.color == 3 && b.color != 3) {
            return -1;
        }
        if (a.color != 3 && b.color == 3) {
            return 1;
        }
        if (a.color == 3) {
            return 0;
        }

        let xa = Math.abs(a.rank - 4);
        let xb = Math.abs(b.rank - 4);

        return xb - xa;
    });

    return dahai_list[0];
}

function strategy_distance_agari(tehai, haiyama_paiset) {
    let current_shanten = shanten_number(tehai);
    let haiyama = paiset_to_haiyama(haiyama_paiset);
    let shanten_to = current_shanten - 2;
    let coef_tenpai = 1.00;

    if (shanten_to < SHANTEN_AGARI) {
        shanten_to = SHANTEN_AGARI;
    }

    function start_henka_num(shanten) {
        if (shanten <= 0) {
            return 3;
        } else if (shanten <= 2) {
            return 2;
        } else {
            return 1;
        }
    }
    let henka_num = start_henka_num(current_shanten);

    let score_list = [];

    foreach_octpaiset(tehai.octpaiset, (color, rank) => {
        tehai_add(tehai, color, rank, -1);

        let shanten = shanten_number(tehai);
        let temodori = shanten !== current_shanten;
        let score = evaluate_tehai_13(haiyama, tehai, shanten_to, temodori ? henka_num - 1 : henka_num, coef_tenpai);

        score_list.push({
            pai: mahjong_pai(color, rank),
            score: score,
        });

        tehai_add(tehai, color, rank, 1);
    });

    score_list.sort((a, b) => {
        if (a.score.distance !== b.score.distance) {
            return a.score.distance - b.score.distance;
        } else {
            return b.score.ukeire.num - a.score.ukeire.num;
        }
    });

    return score_list[0].pai;
}

function strategy_distance_tenpai(tehai, haiyama_paiset) {
    let current_shanten = shanten_number(tehai);
    let haiyama = paiset_to_haiyama(haiyama_paiset);
    let shanten_to = current_shanten - 2;
    let coef_tenpai = 1.00;

    if (current_shanten == 1) {
        shanten_to = SHANTEN_TENPAI;
    }
    if (current_shanten == 0) {
        shanten_to = SHANTEN_AGARI;
    }

    function start_henka_num(shanten) {
        if (shanten <= 0) {
            return 3;
        } else if (shanten <= 2) {
            return 2;
        } else {
            return 1;
        }
    }
    let henka_num = start_henka_num(current_shanten);

    let score_list = [];

    foreach_octpaiset(tehai.octpaiset, (color, rank) => {
        tehai_add(tehai, color, rank, -1);

        let shanten = shanten_number(tehai);
        let temodori = shanten !== current_shanten;
        let score = evaluate_tehai_13(haiyama, tehai, shanten_to, temodori ? henka_num - 1 : henka_num, coef_tenpai);

        score_list.push({
            pai: mahjong_pai(color, rank),
            score: score,
        });

        tehai_add(tehai, color, rank, 1);
    });

    score_list.sort((a, b) => {
        if (a.score.distance !== b.score.distance) {
            return a.score.distance - b.score.distance;
        } else {
            return b.score.ukeire.num - a.score.ukeire.num;
        }
    });

    return score_list[0].pai;
}

function main() {
    simulate_game(strategy_ukeire);
    //simulate_game(strategy_distance_tenpai);
    //do_one_game(strategy_distance_tenpai);
}

main();
