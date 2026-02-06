
"use strict";


function shanten_number_without_opt(paiset, max_nmentsu) {
	let curr = nparts_alt_zero();
	let max = nparts_alt_zero();
	count_nparts_suhai_without_opt(curr, max, paiset, 0, 0, max_nmentsu);

	return max_nmentsu * 2 - max.point;
}

function count_nparts_jihai_without_opt(curr, max, paiset, rank, max_nmentsu) {
	let suit = paiset[3];

	for (; rank < 7; rank++) {
		if (suit[rank] > 0) {
			break;
		}
	}

	if (rank >= 7) {
		if (max.point < curr.point) {
			max.point = curr.point;
		}
		return;
	}

	// 刻子
	if (suit[rank] >= 3) {
		count_nparts_jihai_without_opt( nparts_alt_add_mentsu(curr, max_nmentsu), max, paiset, rank + 1, max_nmentsu );
	}

	// 対子
	if (suit[rank] >= 2) {
		count_nparts_jihai_without_opt( nparts_alt_add_toitsu(curr, max_nmentsu), max, paiset, rank + 1, max_nmentsu );
	}

	// 浮き牌
	count_nparts_jihai_without_opt( curr, max, paiset, rank + 1, max_nmentsu );
}

function count_nparts_suhai_without_opt(curr, max, paiset, color, rank, max_nmentsu) {
	let suit = paiset[color];

	for (; rank < 9; rank++) {
		if (suit[rank] > 0) {
			break;
		}
	}

	if (rank >= 9) {
		if (color == 2) {
			count_nparts_jihai_without_opt(curr, max, paiset, 0, max_nmentsu);
		} else {
			count_nparts_suhai_without_opt(curr, max, paiset, color + 1, 0, max_nmentsu);
		}
		return;
	}

	// 刻子
	if (suit[rank] >= 3) {
		suit[rank] -= 3;
		count_nparts_suhai_without_opt( nparts_alt_add_mentsu(curr, max_nmentsu), max, paiset, color, rank, max_nmentsu );
		suit[rank] += 3;
	}

	// 対子
	if (suit[rank] >= 2) {
		suit[rank] -= 2;
		count_nparts_suhai_without_opt( nparts_alt_add_toitsu(curr, max_nmentsu), max, paiset, color, rank, max_nmentsu );
		suit[rank] += 2;
	}

	// 順子
	if (rank < 7 && suit[rank + 1] > 0 && suit[rank + 2] > 0) {
		suit[rank + 0] -= 1;
		suit[rank + 1] -= 1;
		suit[rank + 2] -= 1;

		count_nparts_suhai_without_opt( nparts_alt_add_mentsu(curr, max_nmentsu), max, paiset, color, rank, max_nmentsu );

		suit[rank + 0] += 1;
		suit[rank + 1] += 1;
		suit[rank + 2] += 1;
	}

	// 両面or辺張
	if (rank < 8 && suit[rank + 1] > 0) {
		suit[rank + 0] -= 1;
		suit[rank + 1] -= 1;
		count_nparts_suhai_without_opt( nparts_alt_add_tahtsu(curr, max_nmentsu), max, paiset, color, rank, max_nmentsu );
		suit[rank + 0] += 1;
		suit[rank + 1] += 1;
	}

	// 嵌張
	if (rank < 7 && suit[rank + 2] > 0) {
		suit[rank + 0] -= 1;
		suit[rank + 2] -= 1;
		count_nparts_suhai_without_opt( nparts_alt_add_tahtsu(curr, max_nmentsu), max, paiset, color, rank, max_nmentsu );
		suit[rank + 0] += 1;
		suit[rank + 2] += 1;
	}

	// 浮き牌
	suit[rank] -= 1;
	count_nparts_suhai_without_opt( curr, max, paiset, color, rank, max_nmentsu );
	suit[rank] += 1;
}

function nparts_alt_zero() {
	return {
		point: 0,
		blocks: 0,
		head: false,
	};
}

function nparts_alt_add_mentsu(nparts, max_nmentsu) {
	if (nparts.blocks < max_nmentsu) {
		return {
			point: nparts.point + 2,
			blocks: nparts.blocks + 1,
			head: nparts.head,
		};
	} else {
		return nparts;
	}
}

function nparts_alt_add_tahtsu(nparts, max_nmentsu) {
	if (nparts.blocks < max_nmentsu) {
		return {
			point: nparts.point + 1,
			blocks: nparts.blocks + 1,
			head: nparts.head,
		};
	} else {
		return nparts;
	}
}

function nparts_alt_add_toitsu(nparts, max_nmentsu) {
	if (!nparts.head) {
		return {
			point: nparts.point + 1,
			blocks: nparts.blocks,
			head: true,
		};
	} else {
		return nparts_alt_add_tahtsu(nparts, max_nmentsu);
	}
}

function tehai_ukeire_without_opt(tehai_paiset, haiyama, max_nmentsu) {
	let ukeire_paiset = paiset_zero();
	let shanten = shanten_number_without_opt(tehai_paiset, max_nmentsu);

	foreach_pai((color, rank) => {
		//if (haiyama[color][rank] > 0) {
		if (tehai_paiset[color][rank] < 4) {
			tehai_paiset[color][rank] += 1;

			if (shanten_number_without_opt(tehai_paiset, max_nmentsu) < shanten) {
				ukeire_paiset[color][rank] = 1;
			}

			tehai_paiset[color][rank] -= 1;
		}
	});

	return ukeire_paiset;
}
