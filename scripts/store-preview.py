"""Render store artwork HTML using the real popup markup and fictional names."""
from pathlib import Path
from html import escape
import re

root = Path(__file__).resolve().parent.parent
popup = (root / "popup.html").read_text()
popup = re.sub(r'\s*<script[^>]*>.*?</script>', '', popup, flags=re.S)
popup = popup.replace('<head>', '<head><base href="../">')
popup = popup.replace('Finding participants…', '6 participants')
popup = popup.replace('Reading the current call…', 'Your order is ready. Copy it into the meeting chat.')
popup = popup.replace(' disabled', '')
message = 'Speaking order:\n1. Alex Chen\n2. Priya Sharma\n3. Sam Taylor\n4. Morgan Lee\n5. Noah Martin\n6. Jamie Wilson\n\nPlease take your turn in this order.'
popup = popup.replace('aria-describedby="message-help"></textarea>', f'aria-describedby="message-help">{escape(message)}</textarea>')
output = root / "store"
output.mkdir(exist_ok=True)
(output / "preview.html").write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><title>Meet Speaking Order — store screenshot</title>
<style>*{box-sizing:border-box}body{margin:0;width:1280px;height:800px;background:#eaf0e4;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18332e;overflow:hidden}main{height:100%;display:flex;align-items:center;gap:95px;padding:65px 105px}.copy{width:460px}.label{font-size:13px;letter-spacing:2px;font-weight:650;color:#54704e}h1{font-size:66px;line-height:1.06;letter-spacing:-3px;margin:24px 0}p{font-size:21px;line-height:1.5;color:#5d705c}.steps{font-size:17px;line-height:2.1;margin:30px 0;color:#284d38}.note{font-size:12px;margin-top:38px}iframe{width:392px;height:650px;border:1px solid #d1dcc9;border-radius:18px;box-shadow:0 22px 55px #29422720;background:#f6f7f2;flex-shrink:0}</style>
<main><section class="copy"><div class="label">MEET SPEAKING ORDER</div><h1>A turn for<br>everyone.</h1><p>Shuffle your Google Meet participants<br>into a ready-to-copy speaking order.</p><div class="steps">01 &nbsp; Open the extension<br>02 &nbsp; Review or reshuffle<br>03 &nbsp; Copy and paste into chat</div><p class="note">Local processing · No tracking · Example names shown</p></section><iframe title="Extension popup preview" srcdoc="''' + escape(popup, quote=True) + '''"></iframe></main></html>''')
(output / "promo.html").write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><title>Meet Speaking Order — promotional tile</title><style>*{box-sizing:border-box}body{margin:0;width:440px;height:280px;background:#244e39;color:#e0efcd;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}main{height:100%;display:flex;align-items:center;gap:26px;padding:35px}img{width:105px;height:105px}h1{font-size:29px;letter-spacing:-1px;line-height:1.1;margin:0 0 14px}p{font-size:13px;line-height:1.6;color:#c2d6b5;margin:0}</style><main><img src="../icons/128.png" alt="Shuffle icon"><section><h1>Meet<br>Speaking Order</h1><p>A little shuffle.<br>A turn for everyone.</p></section></main></html>''')
print("Created store/preview.html and store/promo.html")
