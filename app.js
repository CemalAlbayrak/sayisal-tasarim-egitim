"use strict";

const ADIMLAR = [["okudum", "Okudum"], ["uyguladim", "Uyguladım"], ["sorgulandi", "Sorgulandı"]];
const ANAHTAR = "sayisal-tasarim-ilerleme";
const KONUM = "sayisal-tasarim-konum";
const icerik = document.getElementById("icerik");
let dersler = [];

function oku(anahtar) {
  try { return JSON.parse(localStorage.getItem(anahtar) || "{}"); } catch (e) { return {}; }
}
function yaz(anahtar, deger) {
  try { localStorage.setItem(anahtar, JSON.stringify(deger)); return true; } catch (e) { return false; }
}
let ilerleme = oku(ANAHTAR);

function el(etiket, ozellik, metin) {
  const e = document.createElement(etiket);
  for (const k in ozellik || {}) {
    if (k === "class") e.className = ozellik[k]; else e.setAttribute(k, ozellik[k]);
  }
  if (metin != null) e.textContent = metin;
  return e;
}
function bildir(metin) {
  const b = document.getElementById("bildirim");
  b.textContent = metin; b.hidden = false;
  clearTimeout(bildir.t); bildir.t = setTimeout(() => { b.hidden = true; }, 2600);
}
function adimSayisi(id) {
  const s = ilerleme[id] || {};
  return ADIMLAR.filter(([k]) => s[k]).length;
}
const takipli = () => dersler.filter(d => d.takip);

function liste() {
  document.title = "Sayısal Tasarım Dersleri";
  icerik.textContent = "";
  const t = takipli();
  const biten = t.filter(d => adimSayisi(d.id) === 3).length;
  const adim = t.reduce((a, d) => a + adimSayisi(d.id), 0);
  const ozet = el("div", { class: "ozet" });
  [[biten + " / " + t.length, "Biten ders"], [adim + " / " + t.length * 3, "Adım"], ["%" + Math.round(adim / (t.length * 3) * 100), "İlerleme"]]
    .forEach(([b, s]) => { const k = el("div", { class: "kutu" }); k.append(el("b", {}, b), el("span", {}, s)); ozet.append(k); });
  icerik.append(ozet);

  const sira = t.find(d => d.yazildi && adimSayisi(d.id) < 3);
  if (sira) {
    const a = el("a", { class: "siradaki", href: "#" + sira.id });
    a.append(el("small", {}, "Sıradaki ders"), el("strong", {}, sira.id), document.createTextNode(sira.ad));
    icerik.append(a);
  }

  let grup = null, ul = null;
  dersler.forEach(d => {
    if (d.grup !== grup) {
      grup = d.grup;
      icerik.append(el("h2", { class: "grup" }, grup));
      ul = el("ul", { class: "liste" });
      icerik.append(ul);
    }
    const li = el("li");
    if (d.takip && adimSayisi(d.id) === 3) li.className = "bitti";
    const a = el("a", { href: "#" + d.id });
    a.append(el("span", { class: "kod" }, d.id === "giris" ? "·" : d.id));
    const ad = el("span", { class: "ad" }, d.ad);
    if (!d.yazildi) ad.append(el("small", {}, "Henüz yazılmadı"));
    a.append(ad);
    const nokta = el("span", { class: "adim", "aria-label": adimSayisi(d.id) + " / 3 adım" });
    if (d.takip) ADIMLAR.forEach(([k]) => { const i = el("i"); if ((ilerleme[d.id] || {})[k]) i.className = "on"; nokta.append(i); });
    a.append(nokta);
    li.append(a); ul.append(li);
  });

  const araclar = el("div", { class: "araclar" });
  const gonder = el("button", { class: "dugme ana", type: "button" }, "İlerlemeyi Epoch için kopyala");
  gonder.addEventListener("click", () => kopyala(ozetMetni()));
  araclar.append(gonder);
  icerik.append(araclar);
  icerik.append(el("p", { class: "aciklama" }, "İşaretler ve notlar yalnız bu cihazda saklanır. Kopyaladığın metni sohbete yapıştır; birlikte bakarız."));
}

function ozetMetni() {
  const satirlar = ["Sayısal tasarım ilerlemesi (" + new Date().toLocaleDateString("tr-TR") + ")"];
  takipli().forEach(d => {
    const s = ilerleme[d.id];
    if (!s) return;
    const adimlar = ADIMLAR.filter(([k]) => s[k]).map(([, ad]) => ad.toLowerCase());
    const not = (s.not || "").trim();
    if (!adimlar.length && !not) return;
    satirlar.push("", d.id + " " + d.ad + ": " + (adimlar.join(", ") || "işaret yok"));
    if (not) satirlar.push("Not: " + not);
  });
  if (satirlar.length === 1) satirlar.push("", "Henüz işaret ya da not yok.");
  return satirlar.join("\n");
}

async function kopyala(metin) {
  try { await navigator.clipboard.writeText(metin); bildir("Kopyalandı. Sohbete yapıştırabilirsin."); return; } catch (e) { /* aşağıda elle seçim */ }
  let ta = document.getElementById("disa");
  if (!ta) { ta = el("textarea", { class: "disa", id: "disa", readonly: "" }); icerik.append(ta); }
  ta.value = metin; ta.focus(); ta.select();
  bildir("Kopyalanamadı; metni seçtim, elle kopyala.");
}

function formulleriCiz(kok) {
  kok.querySelectorAll("pre > code.language-latex").forEach(kod => {
    const kap = el("div", { class: "formul" });
    try { katex.render(kod.textContent, kap, { displayMode: true, throwOnError: false, strict: "ignore" }); }
    catch (e) { kap.textContent = kod.textContent; }
    kod.parentElement.replaceWith(kap);
  });
  kok.querySelectorAll("table").forEach(t => {
    const s = el("div", { class: "tablo" }); t.replaceWith(s); s.append(t);
  });
}

async function ders(id) {
  const d = dersler.find(x => x.id === id);
  if (!d) { location.hash = ""; return; }
  document.title = d.id + " · " + d.ad;
  icerik.textContent = "";
  icerik.append(el("a", { class: "geri", href: "#" }, "← Bütün dersler"));
  const govde = el("article", { class: "ders" });
  icerik.append(govde);
  if (d.yazildi) {
    try {
      const r = await fetch("dersler/" + id + ".html");
      if (!r.ok) throw new Error(r.status);
      govde.innerHTML = await r.text();
      formulleriCiz(govde);
    } catch (e) {
      govde.append(el("p", { class: "soluk" }, "Ders yüklenemedi. Bir kez internete bağlıyken aç; sonra çevrimdışı da açılır."));
    }
  } else {
    govde.append(el("h2", {}, d.id + " · " + d.ad));
    const p = el("div", { class: "plan" });
    p.append(el("p", {}, "Bu ders henüz yazılmadı. Kapsayacağı konular:"), el("p", {}, d.konu));
    govde.append(p);
  }
  if (d.takip) icerik.append(takipAlani(d));
  icerik.append(gezinti(d));
  const konum = oku(KONUM)[id];
  window.scrollTo(0, konum || 0);
  icerik.focus({ preventScroll: true });
}

function takipAlani(d) {
  const s = ilerleme[d.id] || (ilerleme[d.id] = {});
  const kap = el("section", { class: "takip" });
  kap.append(el("h3", {}, "Bu dersin durumu"));
  const isaretler = el("div", { class: "isaretler" });
  ADIMLAR.forEach(([k, ad]) => {
    const b = el("button", { class: "isaret", type: "button", "aria-pressed": String(!!s[k]) }, ad);
    b.addEventListener("click", () => {
      s[k] = !s[k]; b.setAttribute("aria-pressed", String(s[k]));
      if (!yaz(ANAHTAR, ilerleme)) bildir("Kaydedilemedi: tarayıcı depolamaya izin vermiyor.");
    });
    isaretler.append(b);
  });
  kap.append(isaretler);
  const etiket = el("label", { for: "not-" + d.id }, "Notların ve sorulara cevapların");
  const ta = el("textarea", { id: "not-" + d.id, placeholder: "Takıldığın yer, sorulara kısa cevapların" });
  ta.value = s.not || "";
  ta.addEventListener("input", () => {
    s.not = ta.value;
    clearTimeout(ta.t); ta.t = setTimeout(() => yaz(ANAHTAR, ilerleme), 500);
  });
  kap.append(etiket, ta);
  return kap;
}

function gezinti(d) {
  const i = dersler.indexOf(d);
  const nav = el("nav", { class: "gezinti" });
  const once = dersler[i - 1], sonra = dersler[i + 1];
  nav.append(once ? el("a", { href: "#" + once.id }, "← " + once.ad) : el("span"));
  nav.append(sonra ? el("a", { href: "#" + sonra.id }, sonra.ad + " →") : el("span"));
  return nav;
}

let konumZamanlayici;
window.addEventListener("scroll", () => {
  const id = location.hash.slice(1);
  if (!id) return;
  clearTimeout(konumZamanlayici);
  konumZamanlayici = setTimeout(() => { const k = oku(KONUM); k[id] = Math.round(window.scrollY); yaz(KONUM, k); }, 400);
}, { passive: true });

function yonlendir() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id) ders(id); else { liste(); window.scrollTo(0, 0); }
}

function baglanti() { document.getElementById("cevrimdisi").hidden = navigator.onLine; }
window.addEventListener("online", baglanti);
window.addEventListener("offline", baglanti);

(async () => {
  baglanti();
  try {
    const r = await fetch("dersler.json");
    dersler = await r.json();
  } catch (e) {
    icerik.textContent = "Ders listesi yüklenemedi. İlk açılışta internet gerekir.";
    return;
  }
  window.addEventListener("hashchange", yonlendir);
  yonlendir();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(kayit => {
      kayit.addEventListener("updatefound", () => {
        const yeni = kayit.installing;
        yeni && yeni.addEventListener("statechange", () => {
          if (yeni.state === "installed" && navigator.serviceWorker.controller) bildir("Yeni dersler indirildi. Sayfayı yenileyince görünür.");
        });
      });
    }).catch(() => {});
  }
})();
