
"use strict";


function octp2str(octpaiset) {
    let result = [];
    for (let color = 0; color < 4; color++) {
        result.push(
            ((octpaiset[color] & 0o777000000) >> 18).toString(8).padStart(3, "0").replace(/0/g, ".") + " " +
            ((octpaiset[color] & 0o000777000) >> 9).toString(8).padStart(3, "0").replace(/0/g, ".") + " " +
            ((octpaiset[color] & 0o000000777) >> 0).toString(8).padStart(3, "0").replace(/0/g, "."),
        );
    }
    return result;
}

function assert_equals(text, exp, act, ...data) {
    console.assert(exp == act, text, "exp", exp, "act", act, ...data);
}

function test_basic_func() {
    let paiset = paiset_zero();
    foreach_pai((color, rank) => {
        paiset[color][rank] = (rank + color) % 5;
    });

    assert_equals("paiset_count", 72, paiset_count(paiset), paiset);

    let octpaiset = paiset_to_octpaiset(paiset);
    assert_equals("octpaiset", 0o321043210, octpaiset[0]);
    assert_equals("octpaiset", 0o432104321, octpaiset[1]);
    assert_equals("octpaiset", 0o043210432, octpaiset[2]);
    assert_equals("octpaiset",   0o4321043, octpaiset[3]);

    assert_equals("octpaiset_count", 72, octpaiset_count(octpaiset), octpaiset);
}

function assert_shanten(exp, paiset) {
    let point = shanten_number(paiset_to_tehai(paiset, 4));
    assert_equals("shanten", exp, point, paiset);
}

function test_shanten() {
    assert_shanten(3, [
        // 1  2  3  4  5  6  7  8  9
        [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // m
        [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
        [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
        [  0, 3, 0, 0, 0, 0, 0       ],  // z
    ]);

    assert_shanten(2, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 0, 1, 2, 1, 0, 1, 0, 0  ],  // m
        [  1, 0, 1, 2, 1, 0, 1, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  0, 2, 0, 0, 0, 0, 0        ],  // z
    ]);

    assert_shanten(3, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 0, 1, 2, 1, 0, 1, 0, 0 ],  // m
        [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
        [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // s
        [  0, 0, 0, 0, 0, 0, 0       ],  // z
    ]);

    assert_shanten(3, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 0, 1, 2, 1, 0, 1, 0, 0 ],  // m
        [  0, 1, 0, 2, 0, 1, 0, 0, 0 ],  // p
        [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // s
        [  0, 0, 0, 0, 0, 0, 0       ],  // z
    ]);

    assert_shanten(2, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 0, 1, 2, 1, 0, 2, 1, 0 ],  // m
        [  1, 1, 0, 0, 0, 0, 0, 1, 1 ],  // p
        [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
        [  0, 0, 0, 0, 0, 0, 0       ],  // z
    ]);

    assert_shanten(2, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 0, 2, 2, 1, 1, 0, 1, 0 ],  // m
        [  1, 1, 0, 0, 0, 0, 0, 1, 1 ],  // p
        [  1, 1, 0, 0, 0, 0, 0, 0, 0 ],  // s
        [  0, 0, 0, 0, 0, 0, 0       ],  // z
    ]);

    // 刻子と見るか対子とみるか
    {
        // 刻子と見るべきパターン
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 3, 1, 0, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 1, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 3, 0, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 1, 0, 0, 0, 0       ],  // z
        ]);

        // 対子と見るべきパターン
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 3, 1, 1, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 1, 1, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 3, 1, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 1, 1, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 1, 3, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 1, 1, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(1, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 4, 2, 2, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 1, 0, 0, 0, 0, 0       ],  // z
        ]);
    }

    // 順子と見るかどうか
    {
        // 刻子と見るべきパターン
        assert_shanten(1, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 3, 1, 1, 1, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 1, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(1, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 1, 1, 3, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 1, 0, 0, 0, 0       ],  // z
        ]);

        // 刻子と見るべきパターン
        assert_shanten(1, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 3, 3, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 0, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(1, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 3, 1, 3, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 0, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(1, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 3, 3, 1, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 0, 0, 0, 0, 0       ],  // z
        ]);

        // 刻子と見るべきパターン
        assert_shanten(1, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 3, 1, 1, 1, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 0, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(1, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 1, 1, 3, 1, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 2, 0, 0, 0, 0, 0       ],  // z
        ]);
    }

    // 対子と見るかどうか
    {
        // 対子と見るべきパターン
        assert_shanten(3, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 2, 1, 0, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // s
            [  0, 1, 1, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(3, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 2, 0, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // s
            [  0, 1, 1, 0, 0, 0, 0       ],  // z
        ]);

        // 対子と見るべきパターン
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 2, 1, 1, 1, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 1, 1, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 1, 1, 2, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 1, 1, 0, 0, 0, 0       ],  // z
        ]);

        // 対子と見ないべきパターン
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 2, 1, 1, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  2, 1, 0, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 2, 1, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  2, 1, 0, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 1, 2, 0, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  2, 1, 0, 0, 0, 0, 0       ],  // z
        ]);

    }

    // ターツが重なった部分を対子とみるかどうか
    {
        // 対子と見るべきパターン
        assert_shanten(3, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 0, 1, 0, 2, 0, 1, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // s
            [  1, 0, 0, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(2, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 2, 1, 1, 1, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 1, 1, 0, 0, 0, 0, 0, 0 ],  // s
            [  1, 0, 0, 0, 0, 0, 0       ],  // z
        ]);
        assert_shanten(3, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 2, 0, 1, 0, 0, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  0, 3, 0, 1, 1, 0, 0       ],  // z
        ]);

        // ターツx2と見るべきパターン
        assert_shanten(4, [
            // 1  2  3  4  5  6  7  8  9
            [  0, 0, 1, 0, 2, 0, 1, 0, 0 ],  // m
            [  0, 1, 1, 0, 0, 1, 1, 0, 0 ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0 ],  // s
            [  1, 1, 1, 1, 1, 0, 0       ],  // z
        ]);
    }
}

function assert_distance(exp, paiset, precision = 4) {
    let haiyama_paiset = paiset_zero();
    foreach_pai((color, rank) => {
        haiyama_paiset[color][rank] = 4 - paiset[color][rank];
    });

    let tehai = paiset_to_tehai(paiset, 4);
    let haiyama = paiset_to_haiyama(haiyama_paiset);
    let shanten = shanten_number(tehai);
    let score = evaluate_tehai_13(haiyama, tehai, Math.max(-1, shanten - 2), 1, 1.0);

    let radix = 10 ** precision;

    assert_equals("distance", Math.round(exp * radix) / radix, Math.round(score.distance * radix) / radix, paiset);
}

function test_distance() {
    // 両面待ち聴牌
    assert_distance(13.7778, [
        // 1  2  3  4  5  6  7  8  9
        [  0, 0, 1, 1, 0, 0, 0, 0, 0  ],  // m
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  3, 3, 3, 2, 0, 0, 0        ],  // z
    ]);

    // 辺張待ち聴牌
    assert_distance(24.8000, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 1, 0, 0, 0, 0, 0, 0, 0  ],  // m
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  3, 3, 3, 2, 0, 0, 0        ],  // z
    ]);

    // 外嵌張待ち聴牌
    assert_distance(20.2333, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 0, 1, 0, 0, 0, 0, 0, 0  ],  // m
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  3, 3, 3, 2, 0, 0, 0        ],  // z
    ], 1);

    // 対子3つの1向聴
    assert_distance(38.9714, [
        // 1  2  3  4  5  6  7  8  9
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // m
        [  1, 1, 1, 0, 0, 0, 1, 1, 1  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  2, 2, 2, 0, 0, 0, 1        ],  // z
    ]);

    // 対子5つの2向聴
    assert_distance(27.3766, [
        // 1  2  3  4  5  6  7  8  9
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // m
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  3, 2, 2, 2, 2, 2, 0        ],  // z
    ]);

    // 完全1シャンテン
    assert_distance(19.0265, [
        // 1  2  3  4  5  6  7  8  9
        [  0, 2, 1, 0, 0, 0, 0, 0, 0  ],  // m
        [  0, 1, 1, 0, 0, 0, 0, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  0, 3, 3, 2, 0, 0, 0        ],  // z
    ]);

    // 辺張+両面+シャンポンの1シャンテン
    assert_distance(28.0418, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 1, 0, 0, 0, 2, 1, 0, 0  ],  // m
        [  1, 1, 1, 0, 0, 0, 0, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  0, 3, 0, 2, 0, 0, 0        ],  // z
    ]);

    // 外嵌張のある1シャンテン
    assert_distance(23.8425, [
        // 1  2  3  4  5  6  7  8  9
        [  1, 0, 1, 0, 0, 0, 0, 0, 0  ],  // m
        [  0, 2, 1, 0, 0, 0, 0, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  0, 3, 3, 2, 0, 0, 0        ],  // z
    ], 1);
}

function test_random_shanten_num() {
    let n = 50000;
    for (let c = 0; c < n; c++) {
        let tehai_paiset = paiset_zero();
        /*
        let tehai_paiset = [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 0, 2, 3, 2, 0, 1, 0  ],  // m
            [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
            [  0, 0, 0, 0, 0, 0, 0        ],  // z
        ];
        */

        let haiyama_paiset = paiset_zero();
        foreach_pai((color, rank) => {
            haiyama_paiset[color][rank] = 4 - tehai_paiset[color][rank];
        });

        for (let i = paiset_count(tehai_paiset); i < 14; i++) {
            let pai = paiset_random_select(haiyama_paiset);
            tehai_paiset[pai.color][pai.rank] += 1;
            haiyama_paiset[pai.color][pai.rank] -= 1;
        }
        let tehai = paiset_to_tehai(tehai_paiset, 4);

        let act = shanten_number(tehai);
        let exp = shanten_number_without_opt(tehai_paiset, 4);

        assert_equals("random shanten checking", exp, act, "paiset:", tehai_paiset);
        if (act != exp) {
            break;
        }

        // ランダムに打牌
        let dahai = paiset_random_select(tehai_paiset);
        tehai_add(tehai, dahai.color, dahai.rank, -1);
        tehai_paiset[dahai.color][dahai.rank] -= 1;

        let act2 = shanten_number(tehai);
        let exp2 = shanten_number_without_opt(tehai_paiset, 4);

        assert_equals("random shanten checking", exp2, act2, "paiset:", tehai_paiset, "da:", dahai);
        if (act2 != exp2) {
            break;
        }

        // ランダムにツモ
        let tsumo = paiset_random_select(haiyama_paiset);
        tehai_add(tehai, tsumo.color, tsumo.rank, 1);
        tehai_paiset[tsumo.color][tsumo.rank] += 1;
        haiyama_paiset[tsumo.color][tsumo.rank] -= 1;

        let act3 = shanten_number(tehai);
        let exp3 = shanten_number_without_opt(tehai_paiset, 4);

        assert_equals("random shanten checking", exp3, act3, "paiset:", tehai_paiset, "da:", dahai, "tsumo:", tsumo);
        if (act3 != exp3) {
            break;
        }
    }
}

function assert_equals_paiset(text, exp, act, ...data) {
    for (let color = 0; color < 4; color++) {
        let n = exp[color].length;
        for (let rank = 0; rank < n; rank++) {
            let exp_value = exp[color][rank];
            let act_value = act[color][rank];

            console.assert(exp_value == act_value, text, "exp", exp, "act", act, ...data);
            if (exp_value != act_value) {
                return false;
            }
        }
    }

    return true;
}

function test_random_ukeire() {
    let n = 10000;
    for (let c = 0; c < n; c++) {
        let tehai_paiset = paiset_zero();
        /*
        let tehai_paiset = [
            // 1  2  3  4  5  6  7  8  9
            [  0, 1, 0, 2, 3, 2, 0, 1, 0  ],  // m
            [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // p
            [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
            [  0, 0, 0, 0, 0, 0, 0        ],  // z
        ];
        */

        let haiyama_paiset = paiset_zero();
        foreach_pai((color, rank) => {
            haiyama_paiset[color][rank] = 4 - tehai_paiset[color][rank];
        });

        for (let i = paiset_count(tehai_paiset); i < 13; i++) {
            let pai = paiset_random_select(haiyama_paiset);
            tehai_paiset[pai.color][pai.rank] += 1;
            haiyama_paiset[pai.color][pai.rank] -= 1;
        }

        let tehai = paiset_to_tehai(tehai_paiset, 4);
        let haiyama = paiset_to_haiyama(haiyama_paiset);

        let act = pailist_to_paiset(octpaiset_to_pailist(find_ukeire(haiyama, tehai).octpaiset));
        let exp = tehai_ukeire_without_opt(tehai_paiset, haiyama_paiset, 4);

        if (!assert_equals_paiset("random ukeire checking", exp, act, "tehai:", tehai_paiset)) {
            break;
        }

        // ランダムにツモ
        let tsumo = paiset_random_select(haiyama_paiset);
        tehai_add(tehai, tsumo.color, tsumo.rank, 1);
        haiyama_add(haiyama, tsumo.color, tsumo.rank, -1);
        tehai_paiset[tsumo.color][tsumo.rank] += 1;
        haiyama_paiset[tsumo.color][tsumo.rank] -= 1;

        // ランダムに打牌
        let dahai = paiset_random_select(tehai_paiset);
        tehai_add(tehai, dahai.color, dahai.rank, -1);
        tehai_paiset[dahai.color][dahai.rank] -= 1;

        let act2 = pailist_to_paiset(octpaiset_to_pailist(find_ukeire(haiyama, tehai).octpaiset));
        let exp2 = tehai_ukeire_without_opt(tehai_paiset, haiyama_paiset, 4);

        if (!assert_equals_paiset("random ukeire checking", exp2, act2, "tehai:", tehai_paiset, "da:", dahai, "tsumo:", tsumo)) {
            break;
        }
    }
}

function test_specified_scenario() {
}

function benchmark(text, f) {
    console.log(text + " start");
    let start = Date.now();
    f();
    let end = Date.now();
    console.log(text + " finish - " + ((end - start) / 1000) + "s");
}

function benchmark_shanten() {
    let n = 2_000_000;
    let tehai_list = [];

    for (let i = 0; i < n; i++) {
        let haiyama_paiset = paiset_zero();
        foreach_pai((color, rank) => {
            haiyama_paiset[color][rank] = 4;
        });

        let tehai_paiset = paiset_zero();
        for (let i = 0; i < 14; i++) {
            let pai = paiset_random_select(haiyama_paiset);
            tehai_paiset[pai.color][pai.rank] += 1;
            haiyama_paiset[pai.color][pai.rank] -= 1;
        }
        let tehai = paiset_to_tehai(tehai_paiset, 4);

        tehai_list.push(tehai);
    }

    benchmark("shanten benchmark", () => {
        let s = 0;
        for (let i = 0; i < n; i++) {
            let tehai = tehai_list[i];
            s += shanten_number(tehai);
        }
        console.log("average shanten", s / n);
    });
}

function benchmark_score() {
    let tehai_paiset = [
        // 1  2  3  4  5  6  7  8  9
        [  0, 1, 0, 0, 0, 1, 0, 0, 2  ],  // m
        [  1, 0, 0, 0, 1, 0, 0, 0, 0  ],  // p
        [  1, 0, 0, 0, 1, 0, 0, 0, 2  ],  // s
        [  0, 1, 1, 0, 0, 1, 0        ],  // z
    ];

    /*
    let tehai_paiset = [
        // 1  2  3  4  5  6  7  8  9
        [  0, 1, 1, 1, 1, 0, 0, 0, 0  ],  // m
        [  1, 0, 1, 1, 0, 0, 1, 0, 1  ],  // p
        [  0, 0, 0, 0, 0, 1, 2, 1, 0  ],  // s
        [  0, 0, 0, 0, 0, 0, 0        ],  // z
    ];
    */

    let haiyama_paiset = paiset_zero();
    foreach_pai((color, rank) => {
        haiyama_paiset[color][rank] = 4 - tehai_paiset[color][rank];
    });

    benchmark("score testing", () => {
        for (let i = 0; i < 1; i++) {
            let tehai = paiset_to_tehai(tehai_paiset, 4);
            let haiyama = paiset_to_haiyama(haiyama_paiset);
            let shanten = shanten_number(tehai);
            let score = evaluate_tehai_13(haiyama, tehai, shanten - 3, 1);
            console.log("score", score);
        }
    });
}

document.addEventListener("DOMContentLoaded", function(event) {
    console.group("mahjong_test");

    console.log("basic test start");
    test_basic_func();
    test_shanten();
    test_distance();
    console.log("basic test fin");

    test_specified_scenario();

    if (true) {
        benchmark("random shanten checking", () => {
            test_random_shanten_num();
            test_random_ukeire();
        });
    }

    document.getElementById("benchmark-shanten").addEventListener("click", function(event) {
        benchmark_shanten();
    });
    document.getElementById("benchmark-score").addEventListener("click", function(event) {
        benchmark_score();
    });

    console.groupEnd("mahjong_test");
});
