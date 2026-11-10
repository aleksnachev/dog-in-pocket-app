#!/usr/bin/env python3
"""PDF за купувача: QR код + линк към приложението + как се инсталира.

Употреба:
  python3 scripts/make-access-pdf.py [https://idezo.eu/<папка>/]
По подразбиране адресът е https://idezo.eu/<RELEASE_SLUG>/.
Изисква: pip install qrcode ; Playwright с Chromium (за отпечатване в PDF).
"""
import io, os, subprocess, sys, html
import qrcode
import qrcode.image.svg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug = open(os.path.join(ROOT, 'RELEASE_SLUG')).read().strip()
base = open(os.path.join(ROOT, 'RELEASE_BASE')).read().strip().rstrip('/') if os.path.exists(os.path.join(ROOT, 'RELEASE_BASE')) else 'https://idezo.eu'
URL = sys.argv[1] if len(sys.argv) > 1 else f'{base}/{slug}/'
OUT_DIR = os.path.join(ROOT, 'dist')
os.makedirs(OUT_DIR, exist_ok=True)

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=1)
qr.add_data(URL)
qr.make(fit=True)
buf = io.BytesIO()
qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(buf)
svg = buf.getvalue().decode('utf-8')
svg = svg[svg.index('<svg'):]  # без XML декларацията

logo = '''<svg viewBox="0 0 512 512" width="64" height="64"><rect width="512" height="512" rx="112" fill="#d9682b"/><g fill="#fff"><ellipse cx="166" cy="236" rx="34" ry="42"/><ellipse cx="226" cy="178" rx="34" ry="44"/><ellipse cx="300" cy="178" rx="34" ry="44"/><ellipse cx="356" cy="236" rx="34" ry="42"/><path d="M176 360c0-58 38-102 86-102s86 44 86 102c0 34-38 50-86 50s-86-16-86-50z"/></g></svg>'''

page = f'''<!doctype html><html lang="bg"><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 0; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; font-family: "Noto Sans", "DejaVu Sans", Arial, sans-serif; color: #1f2a33; background: #fff; }}
.page {{ width: 210mm; height: 296mm; overflow: hidden; padding: 12mm 15mm 10mm; display: flex; flex-direction: column; }}
.head {{ display: flex; align-items: center; gap: 14px; }}
.head h1 {{ margin: 0; font-size: 26pt; letter-spacing: -.5px; }}
.head p {{ margin: 2px 0 0; color: #4b5862; font-size: 11pt; }}
.hero {{ margin-top: 7mm; display: flex; gap: 9mm; align-items: center; background: #fbf1e9; border-radius: 6mm; padding: 6mm; }}
.qr {{ background: #fff; padding: 4mm; border-radius: 4mm; width: 56mm; height: 56mm; flex: none; }}
.qr svg {{ width: 100%; height: 100%; }}
.hero h2 {{ margin: 0 0 3mm; font-size: 17pt; color: #b8521c; }}
.hero p {{ margin: 0 0 3mm; font-size: 11pt; line-height: 1.45; }}
.link {{ display: inline-block; font-family: "DejaVu Sans Mono", monospace; font-size: 9.5pt; background: #fff; border: 1px solid #e7dfd3; border-radius: 2mm; padding: 2mm 3mm; word-break: break-all; color: #1f2a33; text-decoration: none; }}
.cols {{ display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 6mm; }}
.box {{ border: 1px solid #e7dfd3; border-radius: 4mm; padding: 5mm 5mm 3mm; }}
.box h3 {{ margin: 0 0 3mm; font-size: 13pt; }}
ol {{ margin: 0; padding-left: 5mm; font-size: 10.5pt; line-height: 1.45; }}
li {{ margin-bottom: 1.5mm; }}
.warn {{ margin-top: 5mm; background: #fde2e2; border-radius: 4mm; padding: 4mm 5mm; font-size: 10.5pt; line-height: 1.45; }}
.tips {{ margin-top: 4mm; font-size: 10pt; line-height: 1.45; }}
.tips h3 {{ margin: 0 0 2mm; font-size: 13pt; }}
.tips ul {{ margin: 0; padding-left: 5mm; }}
.foot {{ margin-top: auto; border-top: 1px solid #e7dfd3; padding-top: 4mm; font-size: 8.5pt; color: #7b8790; line-height: 1.45; }}
b {{ font-weight: 700; }}
</style></head><body><div class="page">
  <div class="head">{logo}<div><h1>Кучето в джоба</h1><p>Персонален помощник за хранене, грижи, безопасност и профилактика на вашето куче</p></div></div>

  <div class="hero">
    <div class="qr">{svg}</div>
    <div>
      <h2>Благодарим ви! Ето вашия достъп</h2>
      <p>Насочете камерата на телефона към QR кода или отворете линка:</p>
      <a class="link" href="{html.escape(URL)}">{html.escape(URL)}</a>
      <p style="margin-top:3mm">Отворете го <b>на телефона</b>, добавете го на началния екран – и го ползвате като обикновено приложение, дори <b>без интернет</b>.</p>
    </div>
  </div>

  <div class="cols">
    <div class="box"><h3>📱 iPhone (Safari)</h3><ol>
      <li>Отворете линка в <b>Safari</b>.</li>
      <li>Натиснете бутона <b>„Сподели“</b> (квадрат със стрелка нагоре).</li>
      <li>Изберете <b>„Добави към началния екран“</b> → <b>„Добави“</b>.</li>
      <li>Отворете <b>„Кучето в джоба“</b> от иконата и чак тогава въведете профила на кучето.</li>
    </ol></div>
    <div class="box"><h3>🤖 Android (Chrome)</h3><ol>
      <li>Отворете линка в <b>Chrome</b>.</li>
      <li>Натиснете <b>„Инсталирай приложението“</b> в приложението или менюто <b>⋮</b> → <b>„Инсталиране на приложението“</b>.</li>
      <li>Потвърдете – иконата ще се появи на началния екран.</li>
      <li>Отворете я и попълнете профила на кучето.</li>
    </ol></div>
  </div>

  <div class="warn"><b>Отваряте линка от Facebook, Instagram или Messenger?</b> Вградените им браузъри не могат да инсталират приложения. Натиснете <b>⋮</b> / <b>…</b> и изберете <b>„Отвори в Chrome“</b> или <b>„Отвори в Safari“</b>.</div>

  <div class="tips"><h3>Добре е да знаете</h3><ul>
    <li>Не е нужен App Store или Google Play и не се създава акаунт.</li>
    <li>Данните за кучето се пазят само на вашия телефон. Правете си <b>резервно копие</b> от „Моето куче“ → „Резервно копие“.</li>
    <li>Можете да добавите няколко кучета в едно приложение.</li>
    <li>Линкът е само за вас – моля, не го споделяйте публично.</li>
  </ul></div>

  <div class="foot">„Кучето в джоба“ дава обща информация от ветеринарни източници (FEDIAF, WSAVA, MSD Veterinary Manual, PDSA, ASPCA и др.) и не замества преглед и съвет от ветеринарен лекар. При спешност се свържете с ветеринар веднага.</div>
</div></body></html>'''

html_path = os.path.join(OUT_DIR, 'access-pdf.html')
open(html_path, 'w', encoding='utf-8').write(page)
pdf_path = os.path.join(OUT_DIR, 'Кучето-в-джоба-достъп.pdf')
js = f"""const {{ chromium }} = require('playwright');
(async () => {{ const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + {html_path!r}); await p.pdf({{ path: {pdf_path!r}, format: 'A4', printBackground: true, preferCSSPageSize: true }});
await b.close(); }})();"""
subprocess.run(['node', '-e', js], check=True, cwd=ROOT)
print('Готово:', pdf_path, '\nЛинк в QR кода:', URL)
