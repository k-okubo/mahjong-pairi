
"use strict";

if (false) {
    var console = {
        log: () => {},
        debug: () => {},
    };
}

const IMAGES_DIR = "./images/";
const JS_DIR = "./js/";

let gstat = {
    max_nmentsu: 4,
    haiyama_template: undefined,
    haiyama_current: undefined,
    tehai_pailist: [],
    sutehai_list: [],
    selected_sutehai_index: -1,
};


function init_haiyama() {
    gstat.haiyama_template = paiset_zero();
    foreach_pai((color, rank) => {
        gstat.haiyama_template[color][rank] = 4;
    });

    gstat.haiyama_current = paiset_copy(gstat.haiyama_template);
}

function reset_tehai() {
    gstat.haiyama_current = paiset_copy(gstat.haiyama_template);
    gstat.tehai_pailist = [];
    gstat.sutehai_list = [];
    gstat.selected_sutehai_index = -1;
}

function practice_mode() {
    return document.getElementById("practice-mode").checked;
}

function set_practice_mode(enable) {
    let checkbox = document.getElementById("practice-mode");
    let before = checkbox.checked;

    if (enable != before) {
        checkbox.checked = enable;
        changed_practice_mode_checkbox();
    }
}

function history_view_mode() {
    return gstat.selected_sutehai_index >= 0;
}

function clicked_tehai_clear_button() {
    console.debug("clicked_tehai_clear_button");

    reset_tehai();

    refresh_haiyama_view();
    refresh_tehai_view();
    refresh_sutehai_view();
    hide_nanikiru_view();
}

function clicked_tehai_tsumo_button() {
    console.debug("clicked_tehai_tsumo_button");

    if (gstat.tehai_pailist.length < max_tehai_length()) {
        tsumo_random();
        refresh_haiyama_view();
        refresh_tehai_view();
    }
}

function clicked_tehai_sort_button() {
    console.debug("clicked_tehai_sort_button");

    let tsumo_pai = undefined;
    if ((history_view_mode() || practice_mode()) && gstat.tehai_pailist.length == max_tehai_length()) {
        tsumo_pai = gstat.tehai_pailist.pop();
    }

    gstat.tehai_pailist.sort((a, b) => {
        if (a.color < b.color) {
            return -1;
        }
        if (a.color > b.color) {
            return 1;
        }
        return a.rank - b.rank;
    });

    if (tsumo_pai != undefined) {
        gstat.tehai_pailist.push(tsumo_pai);
    }

    refresh_tehai_view();
}

function clicked_haiyama_color_onoff(color, num) {
    console.debug("clicked_haiyama_color_onoff", color, num);

    let n = (color == 3) ? 7 : 9;
    for (let rank = 0; rank < n; rank++) {
        gstat.haiyama_template[color][rank] = num;
        gstat.haiyama_current[color][rank] = num;
    }

    for (let i = 0; i < gstat.tehai_pailist.length; i++) {
        let pai = gstat.tehai_pailist[i];
        if (pai.color == color && gstat.haiyama_current[pai.color][pai.rank] > 0) {
            gstat.haiyama_current[pai.color][pai.rank] -= 1;
        }
    }

    for (let i = 0; i < gstat.sutehai_list.length && (gstat.selected_sutehai_index < 0 || i < gstat.selected_sutehai_index); i++) {
        let pai = gstat.sutehai_list[i].dahai;
        if (pai != undefined && pai.color == color && gstat.haiyama_current[pai.color][pai.rank] > 0) {
            gstat.haiyama_current[pai.color][pai.rank] -= 1;
        }
    }

    refresh_haiyama_view();
    refresh_tehai_view();
}

function clicked_haiyama_pai(color, rank) {
    console.debug("clicked_haiyama_pai", color, rank);

    if (gstat.tehai_pailist.length < max_tehai_length() && gstat.haiyama_current[color][rank] > 0) {
        gstat.haiyama_current[color][rank] -= 1;
        gstat.tehai_pailist.push(mahjong_pai(color, rank));

        refresh_haiyama_view();
        refresh_tehai_view();
    }
}

function changed_max_nmentsu_radio(n) {
    console.debug("changed_max_nmentsu_radio", n);

    gstat.max_nmentsu = n;
    reset_tehai();

    set_practice_mode(false);

    refresh_haiyama_view();
    refresh_tehai_view();
    refresh_sutehai_view();
    hide_nanikiru_view();
}

function clicked_tehai_haipai_button() {
    console.debug("clicked_tehai_haipai_button");

    let history_view_mode_on = history_view_mode();
    reset_tehai();

    let n = max_tehai_length();
    for (let i = 0; i < n; i++) {
        tsumo_random();
    }

    if (history_view_mode_on) {
        set_practice_mode(true);
    }

    refresh_haiyama_view();
    refresh_tehai_view();
    refresh_sutehai_view();
    hide_nanikiru_view();
}

function changed_practice_mode_checkbox() {
    console.debug("changed_practice_mode_checkbox");

    let practice_mode_on = practice_mode();
    if (practice_mode_on) {
        console.log("enter practice mode");

        let n = max_tehai_length();
        for (let i = gstat.tehai_pailist.length; i < n; i++) {
            tsumo_random();
        }
    }

    let clear_button = document.getElementById("tehai-clear");
    if (practice_mode_on) {
        clear_button.disabled = true;

        if (history_view_mode()) {
            // 参照中以降の history を削除して practice mode 再開
            gstat.sutehai_list.splice(gstat.selected_sutehai_index);
            gstat.selected_sutehai_index = -1;
            console.log("exit history mode", gstat.sutehai_list);
        }
    } else {
        clear_button.disabled = false;
        console.log("exit practice mode");
    }

    refresh_haiyama_view();
    refresh_tehai_view();
    refresh_sutehai_view();
}

function clicked_tehai_pai(index) {
    console.debug("clicked_tehai_pai", index);

    if (index >= gstat.tehai_pailist.length) {
        return;
    }

    let pai = gstat.tehai_pailist[index];

    if (practice_mode()) {
        if (gstat.tehai_pailist.length == max_tehai_length()) {
            push_dahai_history(pai);
            gstat.tehai_pailist.splice(index, 1);
            console.log("sutehai history", gstat.sutehai_list);

            refresh_haiyama_view();
            refresh_tehai_view();
            refresh_sutehai_view();
        }
    } else {
        gstat.tehai_pailist.splice(index, 1);
        gstat.haiyama_current[pai.color][pai.rank] += 1;

        refresh_haiyama_view();
        refresh_tehai_view();
    }
}

function clicked_sutehai_pai(index) {
    console.debug("clicked_sutehai_pai", index);

    if (index >= gstat.sutehai_list.length) {
        return;
    }

    // history mode に入る前に現在の状態を保存しておく
    if (gstat.selected_sutehai_index < 0) {
        push_current_status_to_history();
        console.log("enter history mode", gstat.sutehai_list);
    }

    let hist = gstat.sutehai_list[index];
    gstat.haiyama_current = paiset_copy(hist.haiyama_current);
    gstat.haiyama_template = paiset_copy(hist.haiyama_template);
    gstat.tehai_pailist = hist.pailist.slice();

    if (index == gstat.sutehai_list.length - 1) {
        // history mode に入る前に保存してた状態に戻ったので history mode を終了する
        gstat.selected_sutehai_index = -1;
        gstat.sutehai_list.pop();
        console.log("exit history mode", gstat.sutehai_list);

        set_practice_mode(true);
    } else {
        gstat.selected_sutehai_index = index;
        set_practice_mode(false);
    }

    refresh_haiyama_view();
    refresh_tehai_view();
    refresh_sutehai_view();

    if (hist.nanikiru != undefined) {
        console.log("score history", hist.nanikiru);
        show_nanikiru(hist.nanikiru);
    } else {
        hide_nanikiru_view();
    }
}

async function clicked_show_nanikiru_button() {
    console.debug("clicked_show_nanikiru_button");

    let nanikiru_button = document.getElementById("show-nanikiru");
    if (nanikiru_button.classList.contains("loading")) {
        return;
    }

    nanikiru_button.classList.add("loading");

    let nanikiru = await calc_nanikiru(gstat.haiyama_current, gstat.tehai_pailist);
    show_nanikiru(nanikiru);
    nanikiru_button.classList.remove("loading");
}

function clicked_nanikiru_record(choice, event) {
    console.debug("clicked_nanikiru_record", choice, event);
    show_yukouhai_popup(choice, event.pageX, event.pageY);
}

function clicked_popup_background() {
    console.log("clicked_popup_background");
    hide_popup();
}

function max_tehai_length() {
    return tehai_max_length_with_tsumo(gstat.max_nmentsu);
}

function tsumo_random() {
    if (gstat.tehai_pailist.length < max_tehai_length()) {
        let pai = paiset_random_select(gstat.haiyama_current);

        if (pai != null) {
            gstat.haiyama_current[pai.color][pai.rank] -= 1;
            gstat.tehai_pailist.push(pai);
        }
    }
}

function push_current_status_to_history() {
    gstat.sutehai_list.push({
        haiyama_current: paiset_copy(gstat.haiyama_current),
        haiyama_template: paiset_copy(gstat.haiyama_template),
        pailist: gstat.tehai_pailist.slice(),
        dahai: undefined,
        nanikiru: undefined,
    });
}

async function push_dahai_history(pai) {
    let history = {
        haiyama_current: paiset_copy(gstat.haiyama_current),
        haiyama_template: paiset_copy(gstat.haiyama_template),
        pailist: gstat.tehai_pailist.slice(),
        dahai: pai,
        nanikiru: undefined,
    };
    gstat.sutehai_list.push(history);

    let nanikiru = await calc_nanikiru(history.haiyama_current, history.pailist);
    history.nanikiru = nanikiru;
    refresh_sutehai_view();
}

const calc_nanikiru = function() {
    let running_promise = Promise.resolve();

    return (haiyama_paiset, tehai_pailist) => {
        let tehai_paiset = pailist_to_paiset(tehai_pailist);
        let tehai = paiset_to_tehai(tehai_paiset, gstat.max_nmentsu);
        let haiyama = paiset_to_haiyama(haiyama_paiset);
        console.log("ready to calc score", tehai_paiset);

        // queueing
        running_promise = running_promise.then(() => {
            return calc_nanikiru_background(haiyama, tehai);
        }).then((nanikiru) => {
            nanikiru.choices.forEach((choice) => {
                choice.score.distance = Math.round(choice.score.distance * 10) / 10
            });

            console.log("score", nanikiru);
            return nanikiru;
        });

        return running_promise;
    }
}();

async function calc_nanikiru_background(haiyama, tehai) {
    let current_shanten = shanten_number(tehai);
    let shanten_to = nanikiru_param_shanten_to(current_shanten);
    let henka_num = nanikiru_param_henka_num(current_shanten);
    let coef_tenpai = 0.25;

    let nanikiru = {
        shanten_to: shanten_to,
        coef_tenpai: coef_tenpai,
        choices: [],
    };
    let promises = [];

    let with_tsumo = octpaiset_count(tehai.octpaiset) == tehai_max_length_with_tsumo(tehai.max_nmentsu);
    if (with_tsumo) {
        foreach_octpaiset(tehai.octpaiset, (color, rank) => {
            tehai_add(tehai, color, rank, -1);

            let dahai = mahjong_pai(color, rank);
            let temodori = shanten_number(tehai) != current_shanten;
            let remaining_henka = temodori ? henka_num - 1 : henka_num;

            promises.push(kick_evaluation_worker(dahai, haiyama, tehai, shanten_to, remaining_henka, coef_tenpai).then((score) => {
                nanikiru.choices.push({
                    dahai: dahai,
                    score: score,
                });
            }));

            tehai_add(tehai, color, rank, 1);
        });
    }

    if (!with_tsumo || current_shanten == SHANTEN_AGARI) {
        let dahai = null;
        promises.push(kick_evaluation_worker(dahai, haiyama, tehai, shanten_to, henka_num, coef_tenpai).then((score) => {
            nanikiru.choices.push({
                dahai: dahai,
                score: score,
            });
        }));
    }

    await Promise.all(promises);
    sort_nanikiru(nanikiru);

    if (nanikiru.choices[0].score.shanten != current_shanten) {
        let dahai_hint = nanikiru.choices[0].dahai;
        console.log("requeue with hint", dahai_hint);

        nanikiru.choices.forEach((choice) => {
            if (choice.score.shanten == current_shanten) {
                tehai_add(tehai, choice.dahai.color, choice.dahai.rank, -1);

                promises.push(kick_evaluation_worker(choice.dahai, haiyama, tehai, shanten_to, henka_num - 1, coef_tenpai, dahai_hint).then((score) => {
                    if (score.distance < choice.score.distance) {
                        choice.score = score;
                    }
                }));

                tehai_add(tehai, choice.dahai.color, choice.dahai.rank, 1);
            }
        });

        await Promise.all(promises);
        sort_nanikiru(nanikiru);
    }

    return nanikiru;
}

function nanikiru_param_shanten_to(shanten) {
    if (shanten >= 5) {
        return shanten - 2;
    } else {
        return Math.min(shanten, Math.max(shanten - 3, SHANTEN_AGARI));
    }
}

function nanikiru_param_henka_num(shanten) {
    if (shanten <= 1) {
        return 3;
    } else if (shanten <= 2) {
        return 2;
    } else {
        return 1;
    }
}

function sort_nanikiru(nanikiru) {
    nanikiru.choices.sort((a, b) => {
        if (a.score.distance !== b.score.distance) {
            return a.score.distance - b.score.distance;
        } else {
            return b.score.ukeire.num - a.score.ukeire.num;
        }
    });
}

const kick_evaluation_worker = function() {
    let idle_workers = [];

    return function(dahai, haiyama, tehai, shanten_to, remaining_henka, coef_tenpai, dahai_hint = null) {
        let worker = get_idle_worker();

        let promise = worker.postMessage({
            dahai: dahai,
            haiyama: haiyama,
            tehai: tehai,
            shanten_to: shanten_to,
            remaining_henka: remaining_henka,
            coef_tenpai: coef_tenpai,
            dahai_hint: dahai_hint,
        });

        promise.then(() => {
            idle_workers.push(worker);
        });

        return promise;
    }

    function get_idle_worker() {
        if (idle_workers.length == 0) {
            return new PromiseWorker(new Worker(JS_DIR + "evaluation_worker.js"));
        } else {
            return idle_workers.pop();
        }
    }
}();

class PromiseWorker {
    constructor(worker) {
        this.worker = worker;
        this.resolvers = new Map();
        this.last_id = 1;

        worker.onmessage = (e) => {
            let id = e.data.id;
            let response = e.data.body;

            let resolve = this.resolvers.get(id);
            this.resolvers.delete(id);

            resolve(response);
        }
    }

    postMessage(message) {
        return new Promise((resolve, reject) => {
            let id = this.last_id++;
            this.resolvers.set(id, resolve);

            this.worker.postMessage({
                id: id,
                body: message,
            });
        });
    }

    terminate() {
        this.worker.terminate();
    }
}

function create_haiyama_view() {
    let container = document.getElementById("haiyama-container");
    container.innerHTML = "";

    let table = document.createElement('table');
    container.appendChild(table);

    for (let color = 0; color < 4; color++) {
        let tr = document.createElement('tr');
        table.appendChild(tr);

        for (let rank = 0; rank < 9; rank++) {
            let td = document.createElement('td');
            tr.appendChild(td);

            if (color < 3 || rank < 7) {
                let img_area = document.createElement('div');
                td.appendChild(img_area);
                img_area.classList.add("haiyama-img-area");
                {
                    let img = document.createElement('img');
                    img.src = paiimg_m(color, rank);
                    img.alt = painame(color, rank);
                    img.classList.add("pai-haiyama");
                    img.addEventListener("click", function(event) {
                        clicked_haiyama_pai(color, rank);
                    });

                    img_area.appendChild(img);
                }

                let num_area = document.createElement('div');
                td.appendChild(num_area);
                num_area.classList.add("haiyama-num-area");
                {
                    let num_span = document.createElement('span');
                    num_span.id = "haiyama-num-" + painame(color, rank);
                    num_span.textContent = "4/4";

                    num_area.appendChild(num_span);
                }

            } else if (color == 3 && rank == 7) {
                let dummy = document.createElement('div');
                td.appendChild(dummy);
                dummy.classList.add("dummy-img-pai-haiyama");

                let num_area = document.createElement('div');
                td.appendChild(num_area);
                num_area.classList.add("haiyama-num-area");
                {
                    let num_span = document.createElement('span');
                    num_span.id = "haiyama-num-total";
                    num_span.textContent = "4/4";

                    num_area.appendChild(num_span);
                }
            }
        }

        // 牌山操作インタフェース
        {
            let td = document.createElement('td');
            tr.appendChild(td);

            let wrap = document.createElement('div');
            wrap.classList.add("haiyama-control-area");
            td.appendChild(wrap);

            let div = document.createElement('div');
            wrap.appendChild(div);

            let on_button = document.createElement('button');
            on_button.id = "haiyama-color-on-" + color;
            on_button.textContent = "＋";
            on_button.style.display = "none";
            div.appendChild(on_button);

            let off_button = document.createElement('button');
            off_button.id = "haiyama-color-off-" + color;
            off_button.textContent = "－";
            div.appendChild(off_button);

            on_button.addEventListener("click", function(event) {
                clicked_haiyama_color_onoff(color, 4);

                on_button.style.display = "none";
                off_button.style.display = "inline";
            });

            off_button.addEventListener("click", function(event) {
                clicked_haiyama_color_onoff(color, 0);

                on_button.style.display = "inline";
                off_button.style.display = "none";
            });
        }
    }
}

function refresh_haiyama_view() {
    foreach_pai((color, rank) => {
        let span = document.getElementById("haiyama-num-" + painame(color, rank));
        span.innerHTML = "";

        let current = gstat.haiyama_current[color][rank];
        let template = gstat.haiyama_template[color][rank];

        span.appendChild(create_haiyama_num_text(current));
        if (template == 0) {
            span.appendChild(create_haiyama_lost_text("/"));
        } else {
            span.appendChild(create_haiyama_normal_text("/"));
        }
        span.appendChild(create_haiyama_num_text(template));
    });

    for (let color = 0; color < 4; color++) {
        let on_button = document.getElementById("haiyama-color-on-" + color);
        let off_button = document.getElementById("haiyama-color-off-" + color);

        if (gstat.haiyama_template[color][0] == 0) {
            on_button.style.display = "inline";
            off_button.style.display = "none";
        } else {
            on_button.style.display = "none";
            off_button.style.display = "inline";
        }
    }

    let span = document.getElementById("haiyama-num-total");
    span.textContent = paiset_count(gstat.haiyama_current);
}

function create_haiyama_num_text(num) {
    if (num == 0) {
        return create_haiyama_lost_text(num);
    } else if (num < 4) {
        return create_haiyama_shrinked_text(num);
    } else {
        return create_haiyama_normal_text(num);
    }
}

function create_haiyama_normal_text(text) {
    let span = document.createElement('span');
    span.textContent = text;
    return span;
}

function create_haiyama_shrinked_text(text) {
    let span = document.createElement('span');
    span.textContent = text;
    span.classList.add("haiyama-num-shrinked");
    return span;
}

function create_haiyama_lost_text(text) {
    let span = document.createElement('span');
    span.textContent = text;
    span.classList.add("haiyama-num-lost");
    return span;
}

function refresh_tehai_view() {
    let container = document.getElementById("tehai-container");
    container.innerHTML = "";

    let tehai_length = gstat.tehai_pailist.length;
    let dahai_disabled = practice_mode() && tehai_length < max_tehai_length();

    for (let i = 0; i < tehai_length; i++) {
        let pai = gstat.tehai_pailist[i];

        let img = document.createElement('img');
        container.appendChild(img);

        img.src = paiimg_m(pai.color, pai.rank);
        img.alt = painame(pai.color, pai.rank);
        img.classList.add("pai-tehai");
        img.addEventListener("click", function(event) {
            clicked_tehai_pai(i);
        });

        if (dahai_disabled) {
            img.classList.add("pai-tehai-disabled");
        }

        if (i == max_tehai_length() - 1) {
            img.classList.add("pai-tehai-tsumo");
        }
    }

    let num_label = document.getElementById("tehai-num-label");
    num_label.textContent = "" + tehai_length + "枚";

    let nanikiru_button = document.getElementById("show-nanikiru");
    if (tehai_length >= max_tehai_length() - 1) {
        nanikiru_button.disabled = false;
    } else {
        nanikiru_button.disabled = true;
    }

    let haiyama_current_num = paiset_count(gstat.haiyama_current);
    let haiyama_template_num = paiset_count(gstat.haiyama_template);

    let haipai_button = document.getElementById("tehai-haipai");
    if (haiyama_template_num >= max_tehai_length()) {
        haipai_button.disabled = false;
    } else {
        haipai_button.disabled = true;
    }

    let tsumo_button = document.getElementById("tehai-tsumo");
    if (tehai_length < max_tehai_length() && haiyama_current_num > 0) {
        tsumo_button.disabled = false;
    } else {
        tsumo_button.disabled = true;
    }

    if (dahai_disabled) {
        tsumo_button.classList.add("em-button");
    } else {
        tsumo_button.classList.remove("em-button");
    }
}

function refresh_sutehai_view() {
    let section = document.getElementById("sutehai-section");
    if (gstat.sutehai_list.length > 0 || practice_mode()) {
        section.style.display = "block";
    } else {
        section.style.display = "none";
    }

    let container = document.getElementById("sutehai-container");
    container.innerHTML = "";

    let n = gstat.sutehai_list.length;
    for (let i = 0; i < n; i++) {
        let dahai = gstat.sutehai_list[i].dahai;
        let nanikiru = gstat.sutehai_list[i].nanikiru;
        let block = document.createElement('div');
        block.classList.add("sutehai-block");
        container.appendChild(block);

        if (dahai == undefined) {
            let button = document.createElement('button');
            button.classList.add("latest-back-button");
            button.textContent = "再開";
            button.addEventListener("click", function(event) {
                clicked_sutehai_pai(i);
            });
            block.appendChild(button);

        } else {
            let img_area = document.createElement('div');
            img_area.classList.add("sutehai-img-area");
            block.appendChild(img_area);
            {
                let img = document.createElement('img');
                img.src = paiimg_m(dahai.color, dahai.rank);
                img.alt = painame(dahai.color, dahai.rank);
                img.classList.add("pai-sutehai");
                img.addEventListener("click", function(event) {
                    clicked_sutehai_pai(i);
                });

                img_area.appendChild(img);
            }

            if (gstat.selected_sutehai_index >= 0) {
                if (i == gstat.selected_sutehai_index) {
                    img_area.classList.add("sutehai-img-selected");
                }
                if (i > gstat.selected_sutehai_index) {
                    img_area.classList.add("sutehai-img-disabled");
                }
            }

            let score_area = create_sutehai_score_view(nanikiru, dahai);
            block.appendChild(score_area);

            if (i % 6 == 5) {
                let separator = document.createElement('div');
                separator.classList.add("pai-sutehai-sep");
                container.appendChild(separator);
            }
        }
    }
}

function create_sutehai_score_view(nanikiru, dahai) {
    let score_area = document.createElement('div');
    score_area.classList.add("sutehai-score-area");

    if (nanikiru == undefined) {
        return score_area;
    }

    let my_choice = undefined;
    let n = nanikiru.choices.length;
    for (let i = 0; i < n; i++) {
        let choice = nanikiru.choices[i];

        if (choice.dahai != null && choice.dahai.color == dahai.color && choice.dahai.rank == dahai.rank) {
            my_choice = choice;
        }
    }

    if (my_choice == undefined) {
        score_area.textContent = "N/F";
        return score_area;
    }

    let best_choice = nanikiru.choices[0];

    if (my_choice.score.distance == best_choice.score.distance) {
        score_area.textContent = "✓";
    } else {
        score_area.textContent = "+" + (my_choice.score.distance - best_choice.score.distance).toFixed(1);
    }

    return score_area;
}

function hide_nanikiru_view() {
    let section = document.getElementById("nanikiru-section");
    section.style.display = "none";

    let container = document.getElementById("nanikiru-container");
    container.innerHTML = "";
}

function show_nanikiru(nanikiru) {
    let section = document.getElementById("nanikiru-section");
    section.style.display = "block";

    let container = document.getElementById("nanikiru-container");
    container.innerHTML = "";

    let table = document.createElement('table');
    container.appendChild(table);

    let thead = document.createElement('thead');
    table.appendChild(thead);
    {
        let tr = document.createElement('tr');
        thead.appendChild(tr);

        let dahai = document.createElement('th');
        dahai.textContent = "打";
        tr.appendChild(dahai);

        let shanten = document.createElement('th');
        shanten.appendChild(create_hard_nowrap_text("向聴数"));
        tr.appendChild(shanten);

        let ukeire = document.createElement('th');
        ukeire.appendChild(create_hard_nowrap_text("受け入れ"));
        ukeire.colSpan = 2;
        tr.appendChild(ukeire);

        let henka = document.createElement('th');
        henka.appendChild(create_hard_nowrap_text("変化"));
        henka.colSpan = 2;
        tr.appendChild(henka);

        let distance = document.createElement('th');
        distance.appendChild(create_soft_nowrap_text(shanten_name(nanikiru.shanten_to)));
        distance.appendChild(create_soft_nowrap_text("までの距離"));
        tr.appendChild(distance);
    }

    let tbody = document.createElement('tbody');
    table.appendChild(tbody);

    let best_score = find_best_score(nanikiru);

    let n = nanikiru.choices.length;
    for (let i = 0; i < n; i++) {
        let choice = nanikiru.choices[i];

        let tr = document.createElement('tr');
        tr.addEventListener("click", function(event) {
            clicked_nanikiru_record(choice, event);
        });
        tbody.appendChild(tr);

        let dahai = document.createElement('td');
        dahai.classList.add("centering");
        if (choice.dahai != null) {
            let img = document.createElement('img');
            img.src = paiimg_s(choice.dahai.color, choice.dahai.rank);
            img.alt = painame(choice.dahai.color, choice.dahai.rank);
            img.classList.add("pai-dahai");
            dahai.appendChild(img);
        } else {
            let dummy = document.createElement('div');
            dummy.classList.add("dummy-img-pai-dahai");
            dahai.appendChild(dummy);
        }
        tr.appendChild(dahai);

        let shanten = document.createElement('td');
        shanten.appendChild(create_hard_nowrap_text(shanten_name(choice.score.shanten)));
        shanten.classList.add("centering");
        if (choice.score.shanten > best_score.shanten) {
            shanten.classList.add("score-checked");
        }
        tr.appendChild(shanten);

        let ukeire = document.createElement('td');
        ukeire.classList.add("yukouhai");
        let ukeire_pailist = octpaiset_to_pailist(choice.score.ukeire.octpaiset);
        ukeire.appendChild(create_yukou_images(ukeire_pailist));
        tr.appendChild(ukeire);

        let ukeire_maisu = document.createElement('td');
        ukeire_maisu.appendChild(create_hard_nowrap_text("" + ukeire_pailist.length + "種"));
        ukeire_maisu.appendChild(create_hard_nowrap_text("" + choice.score.ukeire.num + "枚"));
        ukeire_maisu.classList.add("numerical");
        if (choice.score.shanten == best_score.shanten && choice.score.ukeire.num >= best_score.ukeire_num) {
            ukeire_maisu.classList.add("score-best");
        }
        tr.appendChild(ukeire_maisu);

        let henka = document.createElement('td');
        henka.classList.add("yukouhai");
        let henka_maisu = document.createElement('td');
        henka_maisu.classList.add("numerical");
        if (choice.score.henka != null) {
            let henka_pailist = octpaiset_to_pailist(choice.score.henka.octpaiset);
            henka.appendChild(create_yukou_images(henka_pailist));
            henka_maisu.appendChild(create_hard_nowrap_text("" + henka_pailist.length + "種"));
            henka_maisu.appendChild(create_hard_nowrap_text("" + choice.score.henka.num + "枚"));
        }
        tr.appendChild(henka);
        tr.appendChild(henka_maisu);

        let distance = document.createElement('td');
        if (!isFinite(choice.score.distance)) {
            distance.textContent = "-";
        } else {
            distance.textContent = choice.score.distance.toFixed(1);
            if (choice.score.distance <= best_score.distance) {
                distance.classList.add("score-best");
            }
        }
        distance.classList.add("numerical");
        tr.appendChild(distance);
    }
}

function show_yukouhai_popup(choice, x, y) {
    let ukeire = document.getElementById("ukeire-container");
    ukeire.innerHTML = "";

    let ukeire_pailist = octpaiset_to_pailist(choice.score.ukeire.octpaiset);
    ukeire.appendChild(create_yukou_images(ukeire_pailist));

    let henka = document.getElementById("henka-container");
    henka.innerHTML = "";

    if (choice.score.henka != null) {
        let henka_pailist = octpaiset_to_pailist(choice.score.henka.octpaiset);
        henka.appendChild(create_yukou_images(henka_pailist));
    }

    let popup = document.getElementById("yukouhai-popup");
    popup.style.display = "block";
    popup.style.left = "50px";
    popup.style.top = (y - popup.offsetHeight - 20) + "px";

    let background = document.getElementById("popup-background");
    background.style.display = "block";
}

function hide_popup() {
    let popup = document.getElementById("yukouhai-popup");
    popup.style.display = "none";

    let background = document.getElementById("popup-background");
    background.style.display = "none";
}

function create_yukou_images(pailist) {
    let span = document.createElement('span');

    if (pailist.length == 0) {
        return span;
    }

    let block = create_soft_nowrap();
    span.appendChild(block);

    let last_color = pailist[0].color;
    let n = pailist.length;
    for (let i = 0; i < n; i++) {
        let pai = pailist[i];
        if (pai.color != last_color) {
            block = create_soft_nowrap();
            span.appendChild(block);
            last_color = pai.color;
        }

        let img = document.createElement('img');
        img.src = paiimg_s(pai.color, pai.rank);
        img.alt = painame(pai.color, pai.rank);
        img.classList.add("pai-yukou");
        block.appendChild(img);
    }

    return span;
}

function create_soft_nowrap() {
    let elem = document.createElement('span');
    elem.classList.add("soft-nowrap");
    return elem;
}

function create_soft_nowrap_text(text) {
    let elem = create_soft_nowrap();
    elem.textContent = text;
    return elem;
}

function create_hard_nowrap_text(text) {
    let elem = document.createElement('span');
    elem.classList.add("hard-nowrap");
    elem.textContent = text;
    return elem;
}

function find_best_score(nanikiru) {
    let best_score = {
        shanten: INVALID_SHANTEN,
        ukeire_num: 0,
        distance: Infinity,
    };

    let n = nanikiru.choices.length;
    for (let i = 0; i < n; i++) {
        let choice = nanikiru.choices[i];

        if (best_score.shanten > choice.score.shanten) {
            best_score.shanten = choice.score.shanten;
        }
        if (best_score.distance > choice.score.distance) {
            best_score.distance = choice.score.distance;
        }
    }

    for (let i = 0; i < n; i++) {
        let choice = nanikiru.choices[i];

        if (best_score.ukeire_num < choice.score.ukeire.num && choice.score.shanten == best_score.shanten) {
            best_score.ukeire_num = choice.score.ukeire.num;
        }
    }

    return best_score;
}

function shanten_name(shanten) {
    if (shanten < 0) {
        return "和了";
    }
    if (shanten == 0) {
        return "聴牌";
    }
    return "" + shanten + "向聴";
}

function colorname(color) {
    switch (color) {
        case 0: return "m";
        case 1: return "p";
        case 2: return "s";
        case 3: return "z";
    }

    return "e";
}

function painame(color, rank) {
    return "" + (rank + 1) + colorname(color);
}

function paiimg_m(color, rank) {
    return IMAGES_DIR + "m/" + colorname(color) + (rank + 1) + ".png";
}

function paiimg_s(color, rank) {
    return IMAGES_DIR + "s/" + colorname(color) + (rank + 1) + ".png";
}

function enable_event_handlers() {
    for (let n = 2; n <= 4; n++) {
        document.getElementById("tehai-max-nmentsu-" + n).addEventListener("change", function(event) {
            changed_max_nmentsu_radio(n);
        });
    }

    document.getElementById("practice-mode").addEventListener("change", function(event) {
        changed_practice_mode_checkbox();
    });

    document.getElementById("tehai-haipai").addEventListener("click", function(event) {
        clicked_tehai_haipai_button();
    });

    document.getElementById("tehai-tsumo").addEventListener("click", function(event) {
        clicked_tehai_tsumo_button();
    });

    document.getElementById("tehai-sort").addEventListener("click", function(event) {
        clicked_tehai_sort_button();
    });

    document.getElementById("tehai-clear").addEventListener("click", function(event) {
        clicked_tehai_clear_button();
    });

    document.getElementById("show-nanikiru").addEventListener("click", function(event) {
        clicked_show_nanikiru_button();
    });

    document.getElementById("popup-background").addEventListener("click", function(event) {
        clicked_popup_background();
    });
}

document.addEventListener("DOMContentLoaded", function(event) {
    init_haiyama();
    reset_tehai();

    create_haiyama_view();
    refresh_haiyama_view();
    refresh_tehai_view();
    refresh_sutehai_view();
    hide_nanikiru_view();
    hide_popup();

    enable_event_handlers();
});
