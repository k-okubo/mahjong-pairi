
function simulate_average_tsumo_length() {
	let s = 0;
	let p = [];
	let n = 500000;

	for (let i = 0; i < 136; i++) {
		p.push(0);
	}

	for (let i = 0; i < n; i++) {
		let haiyama = [
			// 1  2  3  4  5  6  7  8  9
			[  4, 4, 4, 4, 4, 4, 4, 4, 4  ],  // m
			[  4, 4, 4, 4, 4, 4, 4, 4, 4  ],  // p
			[  4, 4, 4, 4, 4, 4, 4, 4, 4  ],  // s
			[  0, 0, 0, 2, 4, 4, 4        ],  // z
		];

		// 他家への配牌
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 13; j++) {
				let pai = paiset_random_select(haiyama);
				haiyama[pai.color][pai.rank] -= 1;
			}
		}

		let turn = 1;
		while (true) {
			if (paiset_count(haiyama) <= 0) {
				break;
			}

			let pai = paiset_random_select(haiyama);
			haiyama[pai.color][pai.rank] -= 1;

			if (pai.color == 0 && pai.rank == 1) {
				break;
			}
			if (pai.color == 0 && pai.rank == 4) {
				break;
			}

			turn++;

			// 他家のツモ
			if (paiset_count(haiyama) > 3) {
				for (let i = 0; i < 3; i++) {
					let pai = paiset_random_select(haiyama);
					haiyama[pai.color][pai.rank] -= 1;
				}
			} else {
				break;
			}
		}

		s += turn;
		p[turn - 1] += 1;
	}

	let c = 0;
	for (let i = 0; i < p.length; i++) {
		let x = p[i];
		p[i] = (x + c) / n;
		c += x;
	}

	console.group("simulate_average_tsumo_length");
	console.log("平均ツモ数", s / n);
	console.log(p);
	console.groupEnd("simulate_average_tsumo_length");
}


function fact(n) {
	let val = 1;

	while (n > 1) {
		val *= n;
		n -= 1;
	}

	return val;
}

function permut(n, k) {
	let val = 1;

	for (let i = 0; i < k; i++) {
		val *= n - i;
	}

	return val;
}

function combin(n, k) {
	let val = 1;

	for (let i = 1; i <= k; i++) {
		val = (n - i + 1) * val / i;
	}

	return val;
}

function combinb(n, k) {
	n = BigInt(n);
	k = BigInt(k);
	let val = BigInt(1);

	for (let i = BigInt(1); i <= k; i++) {
		val = (n - i + BigInt(1)) * val / i;
	}

	return val;
}


function gcd(a, b) {
	if (b == 0) {
		return a;
	} else {
		return gcd(b, a % b);
	}
}

function qnum(n) {
	return { a: BigInt (n), b: BigInt(1), };
}

function qadd(x, y) {
	let a = x.a * y.b + x.b * y.a;
	let b = x.b * y.b;
	let c = gcd(a, b);

	return { a: a / c, b: b / c };
}

function qmul(x, a) {
	a = BigInt(a);
	let c = gcd(a, x.b);
	return { a: x.a * a / c, b: x.b / c };
}

function qdiv(x, b) {
	b = BigInt(b);
	let c = gcd(x.a, b);
	return { a: x.a / c, b: x.b * b / c };
}

function calc_expected_tsumo_sotokanchan() {
	let total_p = 0;
	let expval = 0;
	let n = 122;
	let k = 12;
	let total_qp = qnum(0);
	let qexpval = qnum(0);

	// 13 の形から 2 を引くか, 4 を引いたあとに 5 を引けばアガリ
	for (let t = 0; t < n; t++) {
		for (let a = 0; a <= 4; a++) {  // a: 4を引いた枚数
			for (let b = 0; b <= 4; b++) {  // b: 5を引いた枚数
				if (t < a + b) {
					continue;
				}
				if (t - (a + b) > n - k) {
					continue;
				}

				// 2を引く
				let p = combin(4, 0) * combin(4, a) * combin(4, b) * combin(n - k, t - (a + b)) / combin(n, t) / combin(a + b, a) * (4 / (n - t));
				let qp = qdiv(qmul(qdiv(qdiv(qnum(combinb(4, 0) * combinb(4, a) * combinb(4, b) * combinb(n - k, t - (a + b))), combinb(n, t)), combinb(a + b, a)), 4), n - t);

				if (a >= 1) {
					// 4を引いたあとに5を引く
					p += combin(4, 0) * combin(4, a) * combin(4, b) * combin(n - k, t - (a + b)) / combin(n, t) / combin(a + b, b) * ((4 - b) / (n - t));
					qp = qadd(qp, qdiv(qmul(qdiv(qdiv(qnum(combinb(4, 0) * combinb(4, a) * combinb(4, b) * combinb(n - k, t - (a + b))), combinb(n, t)), combinb(a + b, b)), 4 - b), n - t))
				}

				total_p += p;
				expval += p * (t + 1);
				total_qp = qadd(total_qp, qp);
				qexpval = qadd(qexpval, qmul(qp, t + 1));
			}
		}
	}

	console.log("calc_expected_tsumo_sotokanchan: total_p:", total_p, "expval:", expval);
	// n=123
	// (124*31*2371) / (2*3*3*5*5*7*11*13)

	// n=112
	// (113*31*2371) / (2*3*3*5*5*7*11*13)

	// n=22
	// (23*31*2371) / (2*3*3*5*5*7*11*13)

	// n=22, 嵌2が3枚
	// (23*67*397) / (2*2*2*3*3*5*5*7*11)

	// n=22, b<=3
	// (23*7817) / (2*2*2*3*5*5*7*11)

}

function calc_expected_tsumo_kanzen1shanten() {
	let total_p = 0;
	let expval = 0;
	let n = 123;
	let k = 8 + 8 + 4;
	let total_qp = qnum(0);
	let qexpval = qnum(0);

	// 23-778-zz の1シャンテンから
	for (let t = 0; t < n; t++) {
		let p = 0;
		let qp = qnum(0);

		for (let a = 0; a <= 8; a++) {  // a: 14を引いた枚数
			for (let b = 0; b <= 8; b++) {  // b: 69を引いた枚数
				for (let c = 0; c <= 4; c++) {  // c: シャンポンを引いた枚数
					if (t < a + b + c) {
						continue;
					}
					if (t - (a + b + c) > n - k) {
						continue;
					}

					if (a == 0 && b + c >= 1) {
						// 14待ち聴牌からのアガリ
						p += combin(8, a) * combin(8, b) * combin(4, c) * combin(n - k, t - (a + b + c)) / combin(n, t) * (8 / (n - t));
						qp = qadd(qp, qdiv(qmul(qdiv(qnum(combinb(8, a) * combinb(8, b) * combinb(4, c) * combinb(n - k, t - (a + b + c))), combinb(n, t)), 8), n - t));
					}
					if (a >= 1 && b == 0) {
						// 69待ち聴牌からのアガリ
						p += combin(8, a) * combin(8, b) * combin(4, c) * combin(n - k, t - (a + b + c)) / combin(n, t) * a / (a + c) * (8 / (n - t));
						qp = qadd(qp, qdiv(qmul(qdiv(qmul(qdiv(qnum(combinb(8, a) * combinb(8, b) * combinb(4, c) * combinb(n - k, t - (a + b + c))), combinb(n, t)), a), a + c), 8), n - t));
					}

				}
			}
		}

		total_p += p;
		expval += p * (t + 1);
		total_qp = qadd(total_qp, qp);
		qexpval = qadd(qexpval, qmul(qp, t + 1));
	}

	console.log("calc_expected_tsumo_kanzen1shanten: total_p:", total_p, "expval:", expval);
	// (2*2*29*31) / (3*3*3*7)
	// (124/21) * (1 + 20/9)
}

function calc_expected_tsumo_penchan_ryanmen1shanten() {
	let total_p = 0;
	let expval = 0;
	let n = 122;
	let k = 4 + 8 + 4;
	let total_qp = qnum(0);
	let qexpval = qnum(0);

	// 12-778-zz の1シャンテンから
	for (let t = 0; t < n; t++) {
		let p = 0;
		let qp = qnum(0);

		for (let a = 0; a <= 4; a++) {  // a: 3を引いた枚数
			for (let b = 0; b <= 8; b++) {  // b: 69を引いた枚数
				for (let c = 0; c <= 4; c++) {  // c: シャンポンを引いた枚数
					if (t < a + b + c) {
						continue;
					}
					if (t - (a + b + c) > n - k) {
						continue;
					}

					if (a == 0 && b + c >= 1) {
						// 3待ち聴牌からのアガリ
						p += combin(4, a) * combin(8, b) * combin(4, c) * combin(n - k, t - (a + b + c)) / combin(n, t) * (4 / (n - t));
						qp = qadd(qp, qdiv(qmul(qdiv(qnum(combinb(4, a) * combinb(8, b) * combinb(4, c) * combinb(n - k, t - (a + b + c))), combinb(n, t)), 4), n - t));
					}
					if (a >= 1 && b == 0) {
						// 69待ち聴牌からのアガリ
						p += combin(4, a) * combin(8, b) * combin(4, c) * combin(n - k, t - (a + b + c)) / combin(n, t) * a / (a + c) * (8 / (n - t));
						qp = qadd(qp, qdiv(qmul(qdiv(qmul(qdiv(qnum(combinb(4, a) * combinb(8, b) * combinb(4, c) * combinb(n - k, t - (a + b + c))), combinb(n, t)), a), a + c), 8), n - t));
					}

				}
			}
		}

		total_p += p;
		expval += p * (t + 1);
		total_qp = qadd(total_qp, qp);
		qexpval = qadd(qexpval, qmul(qp, t + 1));
	}

	console.log("calc_expected_tsumo_penchan_ryanmen1shanten: total_p:", total_p, "expval:", expval);
	// (2*2*31*173) / (3*3*5*17)
	// (124/17) * (1 + 4/9 + 12/5)
}

function calc_expected_tsumo_sotokanchan1shanten() {
	let total_p = 0;
	let expval = 0;
	let n = 123;
	let k = 4 + 4 + 4 + 8 + 4;

	// 13-778-zz の1シャンテンから
	for (let t = 0; t < n; t++) {
		let p = 0;

		for (let k2 = 0; k2 <= 4; k2++) {
			for (let k4 = 0; k4 <= 4; k4++) {
				for (let k5 = 0; k5 <= 4; k5++) {
					for (let r = 0; r <= 8; r++) {
						for (let s = 0; s <= 4; s++) {
							if (t < k2 + k4 + k5 + r + s) {
								continue;
							}
							if (t - (k2 + k4 + k5 + r + s) > n - k) {
								continue;
							}

							let base_p = combin(4, k2) * combin(4, k4) * combin(4, k5) * combin(8, r) * combin(4, s) * combin(n - k, t - (k2 + k4 + k5 + r + s)) / combin(n, t);

							if (r + s >= 1) {
								if (k2 == 0) {
									// 2or25待ち聴牌からの2でアガリ
									p += base_p / combin(k4 + k5, k4) * 4 / (n - t);

									if (k4 >= 1) {
										// 25待ち聴牌からの5でアガリ
										p += base_p / combin(k4 + k5, k4) * (4 - k5) / (n - t);
									}
								}
							}
							if (r == 0) {
								if (k2 >= 1) {
									// 5{0,k5} 4{0,k4} 2 [245s]*
									let pattern = 0;
									for (let i = 0; i <= k5; i++) {
										for (let j = 0; j <= k4; j++) {
											pattern += fact(k2 + k4 + k5 + s - i - j - 1) / fact(k2 - 1) / fact(k4 - j) / fact(k5 - i) / fact(s);
										}
									}
									let patall = fact(k2 + k4 + k5 + s) / fact(k2) / fact(k4) / fact(k5) / fact(s);

									// 123or234が完成して69待ち聴牌からのアガリ
									p += base_p * pattern / patall * 8 / (n - t);
								}
								if (k4 >= 1 && k5 >= 1) {
									// 5{0,k5-1} 4{1,k4} 5 [245s]*
									let pattern = 0;
									for (let i = 0; i <= k5 - 1; i++) {
										for (let j = 1; j <= k4; j++) {
											pattern += fact(k2 + k4 + k5 + s - i - j - 1) / fact(k2) / fact(k4 - j) / fact(k5 - i - 1) / fact(s);
										}
									}
									let patall = fact(k2 + k4 + k5 + s) / fact(k2) / fact(k4) / fact(k5) / fact(s);

									// 345が完成して69待ち聴牌からのアガリ
									p += base_p * pattern / patall * 8 / (n - t);
								}
							}
						}
					}
				}
			}
		}

		total_p += p;
		expval += p * (t + 1);
	}

	console.log("calc_expected_tsumo_sotokanchan1shanten: total_p:", total_p, "expval:", expval);
}

document.addEventListener("DOMContentLoaded", function(event) {
	console.group("simulation");

	console.log("npk", permut(5, 2));
	console.log("nck", combin(123, 4));

	if (true) {
		//calc_expected_tsumo_sotokanchan();
		//calc_expected_tsumo_kanzen1shanten();
		calc_expected_tsumo_penchan_ryanmen1shanten();
		//calc_expected_tsumo_sotokanchan1shanten();
		//simulate_average_tsumo_length();
	}

	//setInterval(do_one_tick, 1000);
	//do_one_tick();

	console.groupEnd("simulation");
});
