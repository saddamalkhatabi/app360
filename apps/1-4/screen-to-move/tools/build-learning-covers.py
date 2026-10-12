import pathlib,json,html
r=pathlib.Path(__file__).resolve().parents[1];m=json.loads((r/'learning-data-v28.js').read_text().split('=',1)[1].rstrip(';\n'))
for lang in ['ar','en']:
 out=r/'assets/learning-covers'/lang;out.mkdir(parents=True,exist_ok=True)
 for g in m['games']:
  kind=g['kind'];i=g['index'];i=([0,1,2,4,5,6,11,12,23,24,19,20][i] if kind=='initial' and lang=='ar' else i);glyph=(m['arletters'][i%28] if lang=='ar' else m['enletters'][i%26]) if kind in ['same-letter','initial'] else str(i if kind!='sequence' else i+2);glyph=glyph if lang=='en' else ''.join('٠١٢٣٤٥٦٧٨٩'[int(c)] if c.isdigit() else c for c in glyph)
  title={'ar':{'same-letter':'نفس الحرف','same-number':'نفس الرقم','count':'عد الصور','initial':'حرف وصورة','sequence':'الرقم الناقص','sort-letters':'حروف وأرقام','sort-count':'عد وصنف'},'en':{'same-letter':'Match the letter','same-number':'Match the number','count':'Count pictures','initial':'Letter and picture','sequence':'Missing number','sort-letters':'Letters and numbers','sort-count':'Count and sort'}}[lang][kind]
  body='<rect width="640" height="360" rx="28" fill="#e9f7f4"/><rect x="145" y="32" width="350" height="225" rx="28" fill="#fff" stroke="#0f8f8a" stroke-width="4"/><text x="320" y="211" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="160" font-weight="bold" fill="#2563eb">'+html.escape(glyph)+'</text><circle cx="100" cy="150" r="35" fill="#facc15"/><circle cx="540" cy="150" r="35" fill="#ef4444"/><text x="320" y="317" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="36" font-weight="bold" fill="#17302f">'+title+'</text>'
  (out/(g['id']+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">'+body+'</svg>\n')
