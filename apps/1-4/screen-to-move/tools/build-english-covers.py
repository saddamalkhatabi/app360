"""Localize the established vector covers without changing their illustrations."""
import json,pathlib,re,textwrap,xml.etree.ElementTree as ET
root=pathlib.Path(__file__).resolve().parents[1]
dictionary=json.loads((root/'i18n-data-v21.js').read_text().removeprefix('window.CreativeEnglish=').strip().removesuffix(';'))
def norm(t):return re.sub('[.!؟،,:;]+$','',re.sub(r'\s+',' ',re.sub('[\u064b-\u065f\u0670ـ]','',t))).strip()
def translate(t):
 if not re.search('[\u0600-\u06ff]',t):return t
 assert norm(t) in dictionary,t
 return dictionary[norm(t)]
ET.register_namespace('','http://www.w3.org/2000/svg')
target=root/'assets/game-covers-en';target.mkdir(exist_ok=True)
for source in (root/'assets/game-covers').glob('G*.svg'):
 tree=ET.parse(source);svg=tree.getroot();width=float(svg.attrib['viewBox'].split()[2])
 for node in svg.iter():
  for attribute in ['aria-label','title']:
   if attribute in node.attrib:node.attrib[attribute]=translate(node.attrib[attribute])
  if node.tag.endswith('text') and node.text and re.search('[\u0600-\u06ff]',node.text):
   value=translate(node.text);node.set('direction','ltr');size=float(node.attrib.get('font-size','17'));max_chars=int(width*.86/(size*.56));lines=textwrap.wrap(value,width=max_chars)
   if len(lines)>1:
    # Use the space above the existing title baseline; illustration and topic stay in place.
    if len(lines)>2:size=max(12,size*2/len(lines));node.set('font-size',str(round(size,1)));lines=textwrap.wrap(value,width=int(width*.86/(size*.56)))
    baseline=float(node.attrib['y']);node.set('y',str(round(baseline-(len(lines)-1)*size*1.1,1)));node.text=None
    for i,line in enumerate(lines):
     child=ET.SubElement(node,'{http://www.w3.org/2000/svg}tspan',{'x':node.attrib['x'],'dy':'0' if i==0 else str(round(size*1.1,1))});child.text=line
   else:node.text=value
 output=ET.tostring(svg,encoding='unicode');assert not re.search('[\u0600-\u06ff]',output),source
 (target/source.name).write_text(output+'\n')
print('Generated',len(list(target.glob('G*.svg'))),'English vector covers.')
