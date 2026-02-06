
"use strict";

const SHANTEN_AGARI = -1;
const SHANTEN_TENPAI = 0;
const INVALID_SHANTEN = 15;
const INVALID_NPARTS = -1;

const NPARTS_POINT_MASK       = 0x00000f;
const NPARTS_BLOCKS_MASK      = 0x000070;
const NPARTS_HEADS_MASK       = 0x000700;
const NPARTS_TOITSUBACK_MASK  = 0x003000;
const NPARTS_MENTSUBACK_MASK  = 0x030000;
const NPARTS_MENTOIBACK_MASK  = 0x300000;

const NPARTS_POINT_I       = 0x000001;
const NPARTS_BLOCKS_I      = 0x000010;
const NPARTS_HEADS_I       = 0x000100;
const NPARTS_TOITSUBACK_I  = 0x001000;
const NPARTS_MENTSUBACK_I  = 0x010000;
const NPARTS_MENTOIBACK_I  = 0x100000;

const NPARTS_BLOCKS_SHIFT      =  4;
const NPARTS_HEADS_SHIFT       =  8;
const NPARTS_TOITSUBACK_SHIFT  = 12;
const NPARTS_MENTSUBACK_SHIFT  = 16;
const NPARTS_MENTOIBACK_SHIFT  = 20;


function mahjong_pai(color, rank) {
    return {
        color: color,
        rank: rank,
    };
}

function foreach_pai(f) {
    for (let color = 0; color < 3; color++) {
        for (let rank = 0; rank < 9; rank++) {
            f(color, rank);
        }
    }
    for (let rank = 0; rank < 7; rank++) {
        f(3, rank);
    }
}

function paiset_zero() {
    return [
        // 1  2  3  4  5  6  7  8  9
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // m
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // p
        [  0, 0, 0, 0, 0, 0, 0, 0, 0  ],  // s
        [  0, 0, 0, 0, 0, 0, 0        ],  // z
    ];
};

function foreach_paiset(paiset, f) {
    for (let color = 0; color < 4; color++) {
        let suit = paiset[color];
        let n = suit.length;
        for (let rank = 0; rank < n; rank++) {
            if (suit[rank] > 0) {
                f(color, rank);
            }
        }
    }
}

function paiset_count(paiset) {
    let num = 0;

    for (let color = 0; color < 4; color++) {
        let suit = paiset[color];
        let n = suit.length;
        for (let rank = 0; rank < n; rank++) {
            num += suit[rank];
        }
    }

    return num;
}

function paiset_copy(paiset) {
    return [
        paiset[0].slice(),
        paiset[1].slice(),
        paiset[2].slice(),
        paiset[3].slice(),
    ];
}

function pailist_to_paiset(pailist) {
    let paiset = paiset_zero();

    let n = pailist.length;
    for (let i = 0; i < n; i++) {
        let pai = pailist[i];
        paiset[pai.color][pai.rank] += 1;
    }

    return paiset;
}

function octpaiset_zero() {
    return [
        0o000000000,
        0o000000000,
        0o000000000,
        0o000000000,
    ];
}

function foreach_octpaiset(octpaiset, f) {
    for (let color = 0; color < 4; color++) {
        let octsuit = octpaiset[color];
        let rank = 0;
        while (octsuit !== 0) {
            if ((octsuit & 0o7) !== 0) {
                f(color, rank);
            }
            octsuit >>= 3;
            rank++;
        }
    }
}

function octpaiset_count(octpaiset) {
    let num = 0;

    for (let color = 0; color < 4; color++) {
        let octsuit = octpaiset[color];
        while (octsuit !== 0) {
            num += octsuit & 0o7;
            octsuit >>= 3;
        }
    }

    return num;
}

function paiset_to_octpaiset(paiset) {
    let octpaiset = octpaiset_zero();

    for (let color = 0; color < 4; color++) {
        let octsuit = 0;

        let suit = paiset[color];
        let n = suit.length;
        for (let rank = 0; rank < n; rank++) {
            octsuit |= (suit[rank] & 0o7) << rank * 3;
        }

        octpaiset[color] = octsuit;
    }

    return octpaiset;
}

function octpaiset_to_pailist(octpaiset) {
    let pailist = [];

    for (let color = 0; color < 4; color++) {
        let octsuit = octpaiset[color];
        let rank = 0;
        while (octsuit !== 0) {
            while ((octsuit & 0o7) !== 0) {
                pailist.push(mahjong_pai(color, rank));
                octsuit -= 1;
            }
            octsuit >>= 3;
            rank++;
        }
    }

    return pailist;
}

function paiset_to_haiyama(paiset) {
    return {
        paiset: paiset_copy(paiset),
    };
}

function haiyama_copy(haiyama) {
    return {
        paiset: paiset_copy(haiyama.paiset),
    };
}

function haiyama_add(haiyama, color, rank, num) {
    haiyama.paiset[color][rank] += num;
}

function haiyama_get(haiyama, color, rank) {
    return haiyama.paiset[color][rank];
}

function tehai_max_length(max_nmentsu) {
    return max_nmentsu * 3 + 1;
}

function tehai_max_length_with_tsumo(max_nmentsu) {
    return max_nmentsu * 3 + 2;
}

function paiset_to_tehai(paiset, max_nmentsu) {
    return {
        octpaiset: paiset_to_octpaiset(paiset),
        max_nmentsu: max_nmentsu,
        shanten: INVALID_SHANTEN,
        nparts: [ INVALID_NPARTS, INVALID_NPARTS, INVALID_NPARTS, INVALID_NPARTS ],
        forward: [ undefined, undefined, undefined, undefined ],
        ukeire: [ undefined, undefined, undefined, undefined ],
        nparts_cache: [ new Map(), new Map(), new Map(), new Map() ],
        forward_cache: [ new Map(), new Map(), new Map(), new Map() ],
    };
}

function tehai_add(tehai, color, rank, num) {
    tehai.octpaiset[color] += num << rank * 3;

    tehai.shanten = INVALID_SHANTEN;
    tehai.nparts[color] = INVALID_NPARTS;
    tehai.forward[color] = undefined;
    tehai.ukeire[color] = undefined;
}

function shanten_number(tehai) {
    if (tehai.shanten < INVALID_SHANTEN) {
        return tehai.shanten;
    }

    cache_nparts(tehai);

    let nparts = tehai.nparts;
    let nparts_sum = nparts[0] + nparts[1] + nparts[2] + nparts[3];
    let max_nmentsu = tehai.max_nmentsu;

    let shanten = max_nmentsu * 2 - nparts_to_point(nparts_sum, max_nmentsu);
    tehai.shanten = shanten;

    return shanten;
}

function cache_nparts(tehai) {
    let octpaiset = tehai.octpaiset;
    let nparts = tehai.nparts;

    for (let color = 0; color < 3; color++) {
        if (nparts[color] === INVALID_NPARTS) {
            let octsuit = octpaiset[color];
            octsuit = remove_koritsuhai(octsuit);

            let cache = tehai.nparts_cache[color];
            let data = cache.get(octsuit);
            if (data === undefined) {
                data = count_nparts_suhai(octsuit);
                cache.set(octsuit, data);
            }

            nparts[color] = data;
        }
    }

    if (nparts[3] === INVALID_NPARTS) {
        nparts[3] = count_nparts_jihai(octpaiset[3]);
    }
}

function nparts_to_point(nparts, max_nmentsu) {
    let point = nparts & NPARTS_POINT_MASK;
    let blocks = (nparts & NPARTS_BLOCKS_MASK) >> NPARTS_BLOCKS_SHIFT;

    if (blocks > max_nmentsu) {
        let heads = nparts & NPARTS_HEADS_MASK;
        let toitsu_back = nparts & NPARTS_TOITSUBACK_MASK;
        let mentsu_back = nparts & NPARTS_MENTSUBACK_MASK;
        let mentoi_back = nparts & NPARTS_MENTOIBACK_MASK;

        if (blocks > max_nmentsu + 2) {
            if (mentoi_back !== 0) {
                point -= 1;
                blocks -= 2;
            } else if (mentsu_back !== 0) {
                point -= 1;
                blocks -= 2;
                heads -= NPARTS_HEADS_I;
            }
        }

        point -= blocks - max_nmentsu;

        if (heads !== 0 || (toitsu_back !== 0 && blocks !== max_nmentsu + 1)) {
            point += 1;
        }
    }

    return point;
}

function count_nparts_jihai(octsuit) {
    let nparts = 0;

    while (octsuit !== 0) {
        switch (octsuit & 0o7) {
            case 4:
            case 3:
                // 刻子
                nparts = nparts_add_mentsu(nparts);
                break;

            case 2:
                // 対子
                nparts = nparts_add_toitsu(nparts);
                break;
        }

        octsuit >>= 3;
    }

    return nparts;
}

function remove_koritsuhai(octsuit) {
    let x = octsuit;
    let z = (x >> 6) | (x >> 3) | (x << 3) | (x << 6);
    let m = z | (z >> 1) | (z >> 2) | (x >> 1) | (x >> 2) | 0o666666666;
    return x & m;
}

function count_nparts_suhai(octsuit) {
    if (octsuit === 0) {
        return 0;
    }

    while ((octsuit & 0o7) === 0) {
        octsuit >>= 3;
    }

    let nparts = 0;
    let exists_shuntsu = ((octsuit - 0o111) & 0o444) === 0;

    switch (octsuit & 0o7) {
        case 4:
            // 刻子
            nparts = nparts_add_mentsu(count_nparts_suhai(octsuit - 0o3));

            if (!exists_shuntsu) {
                return nparts;
            }
            break;

        case 3:
            // 刻子
            nparts = nparts_add_mentsu(count_nparts_suhai(octsuit >> 3));

            if (!exists_shuntsu) {
                return nparts;
            }
            break;

        case 2:
            // 対子
            nparts = nparts_add_toitsu(count_nparts_suhai(octsuit >> 3));

            if (!exists_shuntsu) {
                return nparts;
            }
            break;
    }

    if (exists_shuntsu) {
        // 順子
        nparts = nparts_select(nparts, nparts_add_mentsu(count_nparts_suhai(octsuit - 0o111)));

        if (!( (octsuit & 0o700) >= 0o300 || ((octsuit - 0o11100) & 0o44400) === 0 )) {
            return nparts;
        }

    } else if ((octsuit & 0o070) !== 0) {
        // 両面or辺張
        nparts = nparts_select(nparts, nparts_add_tahtsu(count_nparts_suhai((octsuit - 0o011) >> 3)));

        if (!( (octsuit & 0o070) >= 0o020 )) {
            return nparts;
        }

    } else if ((octsuit & 0o700) !== 0) {
        // 嵌張
        nparts = nparts_select(nparts, nparts_add_tahtsu(count_nparts_suhai((octsuit - 0o101) >> 6)));

        if (!( (octsuit & 0o700) >= 0o200 || ((octsuit - 0o11100) & 0o44400) === 0 )) {
            return nparts;
        }
    }

    // 浮き牌
    return nparts_select(nparts, count_nparts_suhai(octsuit >> 3));
}

function nparts_add_mentsu(nparts) {
    return nparts + 2 * NPARTS_POINT_I + NPARTS_BLOCKS_I;
}

function nparts_add_toitsu(nparts) {
    return nparts + 1 * NPARTS_POINT_I + NPARTS_BLOCKS_I + NPARTS_HEADS_I;
}

function nparts_add_tahtsu(nparts) {
    return nparts + 1 * NPARTS_POINT_I + NPARTS_BLOCKS_I;
}

function nparts_select(a, b) {
    let a_point = a & NPARTS_POINT_MASK;
    let a_blocks = a & NPARTS_BLOCKS_MASK;
    let a_heads = a & NPARTS_HEADS_MASK;
    let b_point = b & NPARTS_POINT_MASK;
    let b_blocks = b & NPARTS_BLOCKS_MASK;
    let b_heads = b & NPARTS_HEADS_MASK;

    if (a_point > b_point) {
        if (a_point === b_point + NPARTS_POINT_I) {
            if (a_blocks === b_blocks + NPARTS_BLOCKS_I) {
                if (a_heads < b_heads) {
                    // e.g. 1335: 2搭子 vs 1対子
                    a |= NPARTS_TOITSUBACK_I;
                }
            } else if (a_blocks === b_blocks + 2 * NPARTS_BLOCKS_I) {
                if (a_heads === b_heads) {
                    // e.g. 13445778: 3搭子1対子 vs 1面子1対子
                    a |= NPARTS_MENTOIBACK_I;
                } else {
                    // e.g. 134457: 2搭子1対子 vs 1面子
                    a |= NPARTS_MENTSUBACK_I;
                }
            }
        }
        return a;
    }

    if (b_point > a_point) {
        if (b_point === a_point + NPARTS_POINT_I) {
            if (b_blocks === a_blocks + NPARTS_BLOCKS_I) {
                if (b_heads < a_heads) {
                    b |= NPARTS_TOITSUBACK_I;
                }
            } else if (b_blocks === a_blocks + 2 * NPARTS_BLOCKS_I) {
                if (b_heads === a_heads) {
                    b |= NPARTS_MENTOIBACK_I;
                } else {
                    b |= NPARTS_MENTSUBACK_I;
                }
            }
        }
        return b;
    }

    if (a_blocks < b_blocks) {
        return a;
    }
    if (b_blocks < a_blocks) {
        return b;
    }

    if (a_heads !== 0) {
        return a;
    }
    if (b_heads !== 0) {
        return b;
    }

    if ((a & NPARTS_TOITSUBACK_MASK) !== 0) {
        return a;
    }
    if ((b & NPARTS_TOITSUBACK_MASK) !== 0) {
        return b;
    }

    return a;
}

function find_ukeire(haiyama, tehai) {
    cache_nparts(tehai);
    return find_ukeire_with_cached_nparts(haiyama, tehai);
}

function find_ukeire_with_cached_nparts(haiyama, tehai, needs_octpaiset = true) {
    let ukeire_num = 0;
    let ukeire_octpaiset = needs_octpaiset ? octpaiset_zero() : null;

    let nparts = tehai.nparts;
    let nparts_sum = nparts[0] + nparts[1] + nparts[2] + nparts[3];
    let nparts_bone = nparts_sum & ~NPARTS_POINT_MASK;

    for (let color = 0; color < 4; color++) {
        let ukeire = tehai.ukeire[color];
        if (ukeire === undefined || ukeire.bone !== nparts_bone) {
            cache_forward_vectors(tehai, color);

            let ukeire_octsuit = create_ukeire_octsuit(tehai.forward[color], nparts[color], nparts_bone, tehai.max_nmentsu);
            let ukeire_num = count_haiyama_with_mask(haiyama, color, ukeire_octsuit);

            ukeire = {
                octsuit: ukeire_octsuit,
                num: ukeire_num,
                bone: nparts_bone,
            };

            tehai.ukeire[color] = ukeire;
        }

        ukeire_num += ukeire.num;
        if (needs_octpaiset) {
            ukeire_octpaiset[color] = ukeire.octsuit;
        }
    }

    return {
        num: ukeire_num,
        octpaiset: ukeire_octpaiset,
    };
}

function cache_forward_vectors(tehai, color) {
    let forward = tehai.forward;

    if (color < 3) {
        if (forward[color] === undefined) {
            let octsuit = tehai.octpaiset[color];

            let cache = tehai.forward_cache[color];
            let data = cache.get(octsuit);
            if (data === undefined) {
                data = create_forward_vectors_suhai(octsuit, tehai.nparts[color]);
                cache.set(octsuit, data);
            }

            forward[color] = data;
        }
    } else {
        if (forward[3] === undefined) {
            forward[3] = create_forward_vectors_jihai(tehai.octpaiset[3], tehai.nparts[3]);
        }
    }
}

function create_forward_vectors_jihai(octsuit, nparts) {
    let point_vec = 0o444444444;
    let blocks_vec = vecfill((nparts & NPARTS_BLOCKS_MASK) >> NPARTS_BLOCKS_SHIFT);
    let heads_vec = vecfill((nparts & NPARTS_HEADS_MASK) >> NPARTS_HEADS_SHIFT);
    let flags_vec = 0;

    let one = 0o1;

    while (octsuit !== 0) {
        switch (octsuit & 0o7) {
            case 2:
                point_vec += one;
                heads_vec -= one;
                break;

            case 1:
                point_vec += one;
                blocks_vec += one;
                heads_vec += one;
                break;
        }

        octsuit >>= 3;
        one <<= 3;
    }

    return {
        point: point_vec,
        blocks: blocks_vec,
        heads: heads_vec,
        flags: flags_vec,
    };
}

function create_forward_vectors_suhai(octsuit, nparts) {
    let point_vec = 0o444444444;
    let blocks_vec = 0;
    let heads_vec = 0;
    let flags_vec = 0;

    let mask_4mai = 0o4;
    let one = 0o1;
    let vecpos = 0;

    while (one <= 0o100000000) {
        let forward_nparts = ((octsuit & mask_4mai) === 0) ? count_nparts_suhai(remove_koritsuhai(octsuit + one)) : nparts;

        let point = (forward_nparts - nparts) & NPARTS_POINT_MASK;
        let blocks = (forward_nparts & NPARTS_BLOCKS_MASK) >> NPARTS_BLOCKS_SHIFT;
        let heads = (forward_nparts & NPARTS_HEADS_MASK) >> NPARTS_HEADS_SHIFT;
        let flags = nparts_back_flags(forward_nparts);

        point_vec |= point << vecpos;
        blocks_vec |= blocks << vecpos;
        heads_vec |= heads << vecpos;
        flags_vec |= flags << vecpos;

        mask_4mai <<= 3;
        one <<= 3;
        vecpos += 3;
    }

    return {
        point: point_vec,
        blocks: blocks_vec,
        heads: heads_vec,
        flags: flags_vec,
    };
}

function nparts_back_flags(nparts) {
    let nparts_cmp_nz2bit = nparts | (nparts >> 1);

    let flags = 0;
    flags |= (nparts_cmp_nz2bit >> (NPARTS_TOITSUBACK_SHIFT - 0)) & 1;
    flags |= (nparts_cmp_nz2bit >> (NPARTS_MENTSUBACK_SHIFT - 1)) & 2;
    flags |= (nparts_cmp_nz2bit >> (NPARTS_MENTOIBACK_SHIFT - 2)) & 4;

    return flags;
}

function create_ukeire_octsuit(forward_vecs, nparts_suit, nparts_bone, max_nmentsu) {
    let base_point_vec = vecfill(nparts_to_point(nparts_bone + 4 * NPARTS_POINT_I, max_nmentsu));
    let max_nmentsu_vec = vecfill(max_nmentsu);
    let max_nmentsu_vec_p1 = max_nmentsu_vec + 0o111111111;
    let max_nmentsu_vec_p2 = max_nmentsu_vec + 0o222222222;

    let nparts_others = nparts_bone - (nparts_suit & ~NPARTS_POINT_MASK);
    let others_blocks = vecfill((nparts_others & NPARTS_BLOCKS_MASK) >> NPARTS_BLOCKS_SHIFT);
    let others_heads = vecfill((nparts_others & NPARTS_HEADS_MASK) >> NPARTS_HEADS_SHIFT);
    let others_flags = vecfill(nparts_back_flags(nparts_others));

    let point_vec = forward_vecs.point;
    let blocks_vec = forward_vecs.blocks + others_blocks;
    let heads_vec = forward_vecs.heads + others_heads;
    let flags_vec = forward_vecs.flags | others_flags;

    // mentsuback if blocks > max_nmentsu + 2
    let to2 = (veccmp_gt(blocks_vec, max_nmentsu_vec_p2) >> 2) & 0o111111111;
    let mentoi_back = to2 & (flags_vec >> 2);
    let mentsu_back = to2 & (flags_vec >> 1);
    let menback = mentoi_back | mentsu_back;
    point_vec -= menback;
    blocks_vec -= menback << 1;
    heads_vec -= ~mentoi_back & mentsu_back;

    // point -= blocks - max_nmentsu if blocks > max_nmentsu
    let tom = vecmask4(veccmp_gt(blocks_vec, max_nmentsu_vec) & 0o444444444);
    point_vec -= (blocks_vec - (max_nmentsu_vec & tom)) & tom;

    // point += 1 if (head !== 0 || (toitsu_back !== 0 && blocks !== max_nmentsu + 1)) && blocks > max_nmentsu
    let has_head = veccmp_nz(heads_vec);
    let toitsu_back = veccmp_nz(blocks_vec ^ max_nmentsu_vec_p1) & flags_vec;
    point_vec += (has_head | toitsu_back) & 0o111111111 & tom;

    // ukeire octsuit
    return point_vec - base_point_vec;
}

function count_haiyama_with_mask(haiyama, color, mask) {
    let haiyama_suit = haiyama.paiset[color];
    let num = 0;

    num += haiyama_suit[0] * (mask & 1); mask >>= 3;
    num += haiyama_suit[1] * (mask & 1); mask >>= 3;
    num += haiyama_suit[2] * (mask & 1); mask >>= 3;
    num += haiyama_suit[3] * (mask & 1); mask >>= 3;
    num += haiyama_suit[4] * (mask & 1); mask >>= 3;
    num += haiyama_suit[5] * (mask & 1); mask >>= 3;
    num += haiyama_suit[6] * (mask & 1);
    if (color < 3) {
        mask >>= 3;
        num += haiyama_suit[7] * (mask & 1); mask >>= 3;
        num += haiyama_suit[8] * (mask & 1);
    }

    return num;
}

function vecfill(x) {
    x = x | (x << 3) | (x << 6);
    x = x | (x << 9) | (x << 18);
    return x;
}

function vecmask1(x) {
    return x | x << 1 | x << 2;
}

function vecmask4(x) {
    return x | x >> 1 | x >> 2;
}

function veccmp_nz(x) {
    return x | x >> 1 | x >> 2;
}

function veccmp_gt(a, b) {
    let bitgt = a & ~b;
    let biteq = ~(a ^ b);

    let cmp = bitgt;
    cmp |= (cmp << 1) & biteq;
    cmp |= (cmp << 1) & biteq;

    return cmp;
}

function find_henka(haiyama, tehai, current_ukeire) {
    let current_shanten = shanten_number(tehai);

    let henka_num = 0;
    let henka_octpaiset = octpaiset_zero();

    for (let color = 0; color < 4; color++) {
        let retained_forward = tehai.forward[color];
        let retained_ukeire = tehai.ukeire[color];

        let suit = haiyama.paiset[color];
        let n = suit.length;
        for (let rank = 0; rank < n; rank++) {
            if (suit[rank] > 0 && (current_ukeire.octpaiset[color] & (1 << rank * 3)) === 0) {
                tehai_add(tehai, color, rank, 1);
                haiyama_add(haiyama, color, rank, -1);

                if (ukeire_num_increased(haiyama, tehai, current_shanten, current_ukeire.num, color, rank)) {
                    henka_num += haiyama_get(haiyama, color, rank) + 1;
                    henka_octpaiset[color] |= 1 << rank * 3;
                }

                tehai_add(tehai, color, rank, -1);
                haiyama_add(haiyama, color, rank, 1);
            }
        }

        tehai.forward[color] = retained_forward;
        tehai.ukeire[color] = retained_ukeire;
    }

    return {
        num: henka_num,
        octpaiset: henka_octpaiset,
    };
}

function ukeire_num_increased(haiyama, tehai, current_shanten, ukeire_num, ignore_color, ignore_rank) {
    for (let color = 0; color < 4; color++) {
        let retained_nparts = tehai.nparts[color];
        let retained_forward = tehai.forward[color];
        let retained_ukeire = tehai.ukeire[color];

        let octsuit = tehai.octpaiset[color];
        let rank = 0;
        while (octsuit !== 0) {
            if ((octsuit & 0o7) !== 0 && (color !== ignore_color || rank !== ignore_rank)) {
                tehai_add(tehai, color, rank, -1);

                let shanten = shanten_number(tehai);
                if (shanten === current_shanten) {
                    let ukeire = find_ukeire_with_cached_nparts(haiyama, tehai, false);
                    if (ukeire.num > ukeire_num) {
                        tehai_add(tehai, color, rank, 1);
                        tehai.nparts[color] = retained_nparts;
                        tehai.forward[color] = retained_forward;
                        tehai.ukeire[color] = retained_ukeire;

                        return true;
                    }
                }

                tehai_add(tehai, color, rank, 1);
            }
            octsuit >>= 3;
            rank++;
        }

        tehai.nparts[color] = retained_nparts;
        tehai.forward[color] = retained_forward;
        tehai.ukeire[color] = retained_ukeire;
    }

    return false;
}

function evaluate_tehai_14_core(haiyama, haiyama_num, tehai, current_shanten, shanten_to, remaining_henka, coef_tenpai, dahai_hint) {
    let min_distance = Infinity;

    if (dahai_hint !== null && (tehai.octpaiset[dahai_hint.color] & (0o7 << dahai_hint.rank * 3)) !== 0) {
        tehai_add(tehai, dahai_hint.color, dahai_hint.rank, -1);
        let shanten = shanten_number(tehai);
        let score = evaluate_tehai_13_core(haiyama, haiyama_num, tehai, shanten, shanten_to, remaining_henka, coef_tenpai, null);
        tehai_add(tehai, dahai_hint.color, dahai_hint.rank, 1);

        min_distance = score.distance;
    }

    for (let color = 0; color < 4; color++) {
        let retained_nparts = tehai.nparts[color];
        let retained_forward = tehai.forward[color];
        let retained_ukeire = tehai.ukeire[color];

        let octsuit = tehai.octpaiset[color];
        let rank = 0;
        while (octsuit !== 0) {
            if ((octsuit & 0o7) !== 0) {
                tehai_add(tehai, color, rank, -1);

                let shanten = shanten_number(tehai);
                if (shanten === current_shanten) {
                    let score = evaluate_tehai_13_core(haiyama, haiyama_num, tehai, shanten, shanten_to, remaining_henka, coef_tenpai, null);

                    if (min_distance > score.distance) {
                        min_distance = score.distance;
                    }
                }

                tehai_add(tehai, color, rank, 1);
            }
            octsuit >>= 3;
            rank++;
        }

        tehai.nparts[color] = retained_nparts;
        tehai.forward[color] = retained_forward;
        tehai.ukeire[color] = retained_ukeire;
    }

    return min_distance;
}

function evaluate_tehai_13_core(haiyama, haiyama_num, tehai, current_shanten, shanten_to, remaining_henka, coef_tenpai, dahai_hint) {
    let has_ukeire_d2 = current_shanten > shanten_to + 1;
    let henka_allowed = remaining_henka > 0;

    let ukeire = find_ukeire_with_cached_nparts(haiyama, tehai, has_ukeire_d2 || henka_allowed);
    let henka = null;
    let yukou_num = ukeire.num;

    if (henka_allowed) {
        henka = find_henka(haiyama, tehai, ukeire);
        yukou_num += henka.num;
    }

    let score = {
        shanten: current_shanten,
        ukeire: ukeire,
        henka: henka,
        distance: 0,
        d1: 0,
        d2_ukeire: [],
        d2_henka: [],
    };

    if (current_shanten == shanten_to) {
        return score;
    }

    if (yukou_num <= 0) {
        if (current_shanten > shanten_to) {
            score.distance = Infinity;
        }
        return score;
    }

    // 有効牌を引くまでにかかる期待ツモ数
    let d1 = (haiyama_num + 1) / (yukou_num + 1);
    let d2_sum = 0;

    if (current_shanten === 0) {
        d1 *= coef_tenpai;
    }

    // 有効牌以外を引く分を牌山から減らす
    if (henka_allowed) {
        haiyama = haiyama_copy(haiyama);
        let rate = yukou_num / (yukou_num + 1);

        for (let color = 0; color < 4; color++) {
            let haiyama_suit = haiyama.paiset[color];
            let yukou_octsuit = ukeire.octpaiset[color] | henka.octpaiset[color];

            let n = haiyama_suit.length;
            for (let rank = 0; rank < n; rank++) {
                if ((yukou_octsuit & (1 << rank * 3)) === 0) {
                    haiyama_suit[rank] *= rate;
                }
            }
        }
    }

    // 受け入れ
    if (has_ukeire_d2) {
        for (let color = 0; color < 4; color++) {
            let retained_forward = tehai.forward[color];
            let retained_ukeire = tehai.ukeire[color];

            let octsuit = ukeire.octpaiset[color];
            let rank = 0;
            while (octsuit !== 0) {
                if ((octsuit & 0o7) !== 0) {
                    let num = haiyama_get(haiyama, color, rank);
                    if (num > 0) {
                        tehai_add(tehai, color, rank, 1);
                        haiyama_add(haiyama, color, rank, -1);

                        let d2 = evaluate_tehai_14_core(haiyama, haiyama_num - d1, tehai, current_shanten - 1, shanten_to, remaining_henka, coef_tenpai, dahai_hint);

                        d2_sum += d2 * num;
                        score.d2_ukeire.push({
                            color: color,
                            rank: rank,
                            d2: d2,
                            num: num,
                        });

                        tehai_add(tehai, color, rank, -1);
                        haiyama_add(haiyama, color, rank, 1);
                    }
                }
                octsuit >>= 3;
                rank++;
            }

            tehai.forward[color] = retained_forward;
            tehai.ukeire[color] = retained_ukeire;
        }
    }

    // 変化
    if (henka_allowed) {
        for (let color = 0; color < 4; color++) {
            let retained_forward = tehai.forward[color];
            let retained_ukeire = tehai.ukeire[color];

            let octsuit = henka.octpaiset[color];
            let rank = 0;
            while (octsuit !== 0) {
                if ((octsuit & 0o7) !== 0) {
                    let num = haiyama_get(haiyama, color, rank);
                    if (num > 0) {
                        tehai_add(tehai, color, rank, 1);
                        haiyama_add(haiyama, color, rank, -1);

                        let d2 = evaluate_tehai_14_core(haiyama, haiyama_num - d1, tehai, current_shanten, shanten_to, remaining_henka - 1, coef_tenpai, dahai_hint);

                        d2_sum += d2 * num;
                        score.d2_henka.push({
                            color: color,
                            rank: rank,
                            d2: d2,
                            num: num,
                        });

                        tehai_add(tehai, color, rank, -1);
                        haiyama_add(haiyama, color, rank, 1);
                    }
                }
                octsuit >>= 3;
                rank++;
            }

            tehai.forward[color] = retained_forward;
            tehai.ukeire[color] = retained_ukeire;
        }
    }

    score.d1 = d1;
    score.distance = d1 + d2_sum / yukou_num;

    return score;
}

function evaluate_tehai_13(haiyama, tehai, shanten_to, remaining_henka, coef_tenpai, dahai_hint = null) {
    let haiyama_num = paiset_count(haiyama.paiset);
    let shanten = shanten_number(tehai);
    let score = evaluate_tehai_13_core(haiyama, haiyama_num, tehai, shanten, shanten_to, remaining_henka, coef_tenpai, dahai_hint);
    return score;
}

function paiset_random_select(paiset) {
    let index = Math.floor(Math.random() * paiset_count(paiset));

    for (let color = 0; color < 4; color++) {
        let suit = paiset[color];
        let n = suit.length;
        for (let rank = 0; rank < n; rank++) {
            index -= suit[rank];
            if (index < 0) {
                return mahjong_pai(color, rank);
            }
        }
    }

    return null;
}
