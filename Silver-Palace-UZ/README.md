# Silver Palace UZ

Statik fan-sayt. `src/template.html` — sahifalar shabloni, `build.py` — HTML sahifalarni qayta yaratish skripti, `dist/` — tayyor sayt, CSS, JavaScript va rasmlar.

## Netlify loyihasi GitHub’ga ulangan bo‘lsa

1. ZIP’ni yangi papkaga chiqar.
2. ZIP ichidagi `netlify.toml`, `dist`, `src` va boshqa fayllarni GitHub repozitoriysining ildiziga joyla.
3. Netlify’da Base directory va Build command bo‘sh, Publish directory qiymati `dist` bo‘lsin. `netlify.toml` ham shu papkani belgilaydi. `main` tarmog‘iga o‘zgarish tushgach, Deploys sahifasidagi natijani tekshir.

## Netlify’ga qo‘lda yuklash

Qo‘lda yuklash maydoniga **dist papkasini** tashla. Uni ochganda `index.html` va `_headers` bevosita ko‘rinishi kerak.

## Kompyuterda tekshirish

Windows terminalida ZIP chiqarilgan papkadan `py -m http.server 8000 --directory dist` buyrug‘ini ishga tushir. Keyin `http://localhost:8000/` manzilini och. Shablonni o‘zgartirganingdan keyin `py build.py` buyrug‘i bilan sahifalarni qayta yarat.

## Yangiliklar haqida

Yangiliklar sayt kodida saqlanadi. ChatGPT’dagi rasmiy e’lonlar kuzatuvi alohida avtomatizatsiya, ZIP orqali Netlify’ga ko‘chmaydi.
