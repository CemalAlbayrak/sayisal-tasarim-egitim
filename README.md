# Sayısal Tasarım Dersleri

FPGA, sinyal işleme ve haberleşme için Türkçe ders serisi. Telefonda okunmak için yazıldı; bir kez açıldıktan sonra internetsiz de çalışır.

- **Okumak:** https://cemalalbayrak.github.io/sayisal-tasarim-egitim/
- **Telefona kurmak:** sayfayı Chrome'da aç, menüden "Ana ekrana ekle".
- **İlerleme:** her dersin altındaki işaretler ve notlar yalnız o cihazda saklanır.

## Yapı

- `dersler.json`: ders listesi ve sırası (`yazildi: false` olanlar konu listesiyle görünür).
- `dersler/*.html`: her dersin metni. Formüller `<pre><code class="language-latex">` içinde yazılır, KaTeX ile çizilir.
- `sw.js`: çevrimdışı önbellek. Dersler değişince `SURUM` artırılır.
- `vendor/katex`: KaTeX 0.16.11, internetsiz çalışsın diye depoda.
- `araclar/bol.py`: ilk sürümü Claude Docs dışa aktarımından derslere bölen betik.
