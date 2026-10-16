"""Eğitim dokümanının HTML dışa aktarımını derslere böler ve dersler.json üretir."""
import html
import json
import os
import re
import sys

kaynak, hedef = sys.argv[1], sys.argv[2]
src = open(kaynak, encoding="utf-8").read()

# Kişisel bilgiler: byline (tarih + ad), seans saatleri, eski takip linki.
src = re.sub(r"<p><time[^>]*>.*?</time>.*?</p>", "", src, count=1, flags=re.S)
src = re.sub(r"<li><p><strong>Seans:</strong>.*?</li>", "", src, flags=re.S)
src = re.sub(r"<li><p><strong>Takip:</strong>.*?</li>",
             "<li><p><strong>Takip:</strong> her dersin altında \"Okudum\", \"Uyguladım\", "
             "\"Sorgulandı\" işaretleri ve not alanı var. İşaretler bu cihazda saklanır.</p></li>",
             src, flags=re.S)

parcalar = re.split(r"(?=<h2[ >])", src)
bolumler = {}
for p in parcalar:
    m = re.match(r"<h2[^>]*>(.*?)</h2>", p, flags=re.S)
    if not m:
        continue
    baslik = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
    kod = baslik.split(" · ")[0].strip()
    if baslik.startswith("Nasıl"):
        kod = "giris"
    bolumler[kod] = (baslik, p)

def yaz(kod, govde):
    open(os.path.join(hedef, "dersler", kod + ".html"), "w", encoding="utf-8").write(govde)

# Yazılmamış derslerin konu listesi (müfredat tablolarından, elle).
PLAN = {
    "M4": ("Kuantalama ve sayı gösterimi", "ADC/DAC, LSB, SNR ve ENOB, ikiye tümleyen, sabit nokta, kayan nokta"),
    "M5": ("Ayrık zamanlı sistemler", "Doğrusal ve zamanla değişmeyen sistem, dürtü yanıtı, evrişim, fark denklemi, z-dönüşümü, kutup ve sıfır"),
    "M6": ("DFT ve FFT", "Çözünürlük, pencereleme, spektral sızıntı"),
    "M7": ("Süzgeç tasarımı", "Özellikler, doğrusal faz, grup gecikmesi, FIR ve IIR tasarım yöntemleri"),
    "M8": ("Çok hızlı işleme", "Seyreltme, ara değerleme, örtüşme ve hayalet görüntü"),
    "M9": ("Olasılık, gürültü ve korelasyon", "Gauss dağılımı, güç spektral yoğunluğu, beyaz gürültü, oto ve çapraz korelasyon"),
    "M10": ("Doğrusal cebir temeli", "Vektör, matris, iç çarpım, en küçük kareler"),
    "M11": ("Haberleşme temelleri", "Taban bant ve taşıyıcı bant, I/Q, PSK ve QAM, darbe şekillendirme, simgeler arası girişim, Eb/N0, BER, Shannon kapasitesi"),
    "B0": ("Altyapı", "Vivado Tcl akışı ve Makefile; Icarus/Verilator ve cocotb; depo düzeni"),
    "B1": ("Doğrulama ve sabit nokta", "Kendini kontrol eden doğrulama ortamı; SVA; Python sabit nokta modeli; doyumlu çarp-topla"),
    "B2": ("Zamanlama, CDC, hata ayıklama", "XDC kısıtları ve zamanlama raporu okuma; yanlış ve çok çevrimli yollar; Gray kodlu asenkron FIFO; ILA ve VIO"),
    "B3": ("FIR", "Doğrudan ve devrik yapı; sistolik yapı ve DSP zinciri; simetri ve ön toplayıcı; ses kodeğinde gerçek zamanlı deneme"),
    "B4": ("Çok hızlı işleme (uygulama)", "CIC ve kompanzasyon; yarı bant süzgeci; çok fazlı seyreltme ve ara değerleme"),
    "B5": ("IIR", "Biquad; DF1 ve DF2T; katsayı kuantalama ve kararlılık; sınır çevrimleri"),
    "B6": ("CORDIC ve NCO", "Döndürme ve vektör kipleri; kazanç ve çeyrek düzeltmesi; NCO ve faz kesme sahte tonları"),
    "B7": ("PS-PL", "AXI4-Lite kaydedici bloğu; AXI-Stream ve AXI DMA; kesmeler; Vitis'te çıplak metal C sürücü"),
    "B8": ("DDC/DUC zinciri", "Zinciri birleştirme; DMA ile yakalama; spektrumu PS'de çizdirme"),
    "B9": ("UVM", "SV nesneleri; UVM bileşenleri ve fazları; dizi (sequence) ve karşılaştırıcı; kapsam"),
    "B10": ("Uyarlamalı süzgeç", "LMS ve NLMS; adım boyu ve kararlılık; sabit noktada yakınsama; karıştırıcı bastırmaya bağlantı"),
    "B11": ("QPSK alıcı", "Kök yükseltilmiş kosinüs (RRC); simge zamanlama (Gardner); taşıyıcı eşzamanlama (Costas); BER ölçümü"),
    "B12": ("FFT ve OFDM", "Radix-2 FFT; Xilinx FFT IP; döngüsel önek; Schmidl-Cox eşzamanlama; pilotla kanal kestirimi ve eşitleme"),
    "B13": ("Görüntü işleme", "AXI4-Stream video; satır tamponu ve 3×3 pencere; Sobel ve Gauss; VDMA; HDMI giriş-çıkış"),
    "BP": ("Fiber hattı (paralel)", "GTX alıcı-vericisi; 8b/10b ve 64b/66b; Aurora'nın içi; IBERT ile göz diyagramı; JESD204B'ye giriş"),
}
SIRA = [("Başlangıç", ["giris"]),
        ("Temeller", ["A1", "A2", "A3"]),
        ("Matematik ve sinyal", ["M", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11"]),
        ("Aşamalar", ["B", "B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "BP"])]
TAKIPSIZ = {"giris", "M", "B"}

liste = []
for grup, kodlar in SIRA:
    for kod in kodlar:
        if kod in bolumler:
            baslik, govde = bolumler[kod]
            ad = baslik.split(" · ", 1)[1] if " · " in baslik else baslik
            if kod == "M":
                ad = "Hattın haritası"
            if kod == "B":
                ad = "Aşamaların haritası"
            yaz(kod, govde)
            liste.append({"id": kod, "grup": grup, "ad": ad, "yazildi": True, "takip": kod not in TAKIPSIZ})
        elif kod in PLAN:
            ad, konu = PLAN[kod]
            liste.append({"id": kod, "grup": grup, "ad": ad, "yazildi": False, "konu": konu, "takip": True})
        else:
            raise SystemExit("eksik bölüm: " + kod)

json.dump(liste, open(os.path.join(hedef, "dersler.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(liste), "kayıt;", sum(1 for x in liste if x["yazildi"]), "yazılmış bölüm")

# Düz metindeki f_s, t_cq gibi yazımları alt simgeye çevir (pre ve code dışında).
for ad in os.listdir(os.path.join(hedef, "dersler")):
    yol = os.path.join(hedef, "dersler", ad)
    metin = open(yol, encoding="utf-8").read()
    parca = re.split(r"(<pre>.*?</pre>|<code>.*?</code>)", metin, flags=re.S)
    for i in range(0, len(parca), 2):
        parca[i] = re.sub(r"(?<![A-Za-z0-9_])([A-Za-zτ])_([A-Za-z0-9]{1,8})(?![A-Za-z0-9_])", r"\1<sub>\2</sub>", parca[i])
    open(yol, "w", encoding="utf-8").write("".join(parca))
