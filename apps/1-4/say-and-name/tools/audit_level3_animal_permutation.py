#!/usr/bin/env python3
import json
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
MAP = APP/'data'/'word-images-map.js'
MANIFEST = APP/'data'/'word-images-manifest.json'
IMG_DIR = APP/'assets'/'word-images'
OUT = APP/'data'/'level3-animal-permutation-audit.json'

LABELS = {
'ماعز':'goat','أسد':'lion','فيل':'elephant','قرد':'monkey','جمل':'camel','زرافة':'giraffe','نمر':'tiger',
'ثعلب':'fox','حمامة':'pigeon dove','نسر':'eagle','بطريق':'penguin','دلفين':'dolphin','حوت':'whale',
'سلحفاة':'turtle','أخطبوط':'octopus','قرش':'shark'
}

def load_map():
    t=MAP.read_text(encoding='utf-8').strip()
    marker='window.APP360_WORD_IMAGE_MAP='
    return json.loads(t[len(marker):-1])

def main():
    import torch
    from PIL import Image
    from scipy.optimize import linear_sum_assignment
    from transformers import CLIPModel, CLIPProcessor

    mapping=load_map()
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_word={x['word']:x for x in manifest['items']}
    words=[w for w in LABELS if w in mapping and by_word.get(w,{}).get('source')=='L3']
    if len(words)<12:
        raise SystemExit(f'Expected broad L3 animal set; got {len(words)}')

    model_id='openai/clip-vit-base-patch32'
    model=CLIPModel.from_pretrained(model_id); model.eval()
    proc=CLIPProcessor.from_pretrained(model_id)
    prompts=[f'a clear educational picture of a {LABELS[w]}, centered, no text' for w in words]
    with torch.no_grad():
        ti=proc(text=prompts,return_tensors='pt',padding=True)
        tf=model.get_text_features(**ti); tf=tf/tf.norm(dim=-1,keepdim=True)
    feats=[]
    for w in words:
        im=Image.open(IMG_DIR/mapping[w]).convert('RGB')
        with torch.no_grad():
            ii=proc(images=[im],return_tensors='pt')
            f=model.get_image_features(**ii); f=f/f.norm(dim=-1,keepdim=True)
        feats.append(f.cpu()[0]); im.close()
    imgs=torch.stack(feats)
    sims=(imgs @ tf.cpu().T).numpy()
    rows, cols = linear_sum_assignment(-sims)
    assignment={words[int(r)]:words[int(c)] for r,c in zip(rows,cols)}

    details=[]
    for i,w in enumerate(words):
        order=sims[i].argsort()[::-1]
        best=words[int(order[0])]
        assigned=assignment[w]
        details.append({
            'source_word':w,
            'file':mapping[w],
            'assigned_visual_word':assigned,
            'assigned_score':round(float(sims[i,words.index(assigned)]),5),
            'best_visual_word':best,
            'best_score':round(float(sims[i,int(order[0])]),5),
            'current_score':round(float(sims[i,i]),5),
            'gain_if_assigned':round(float(sims[i,words.index(assigned)]-sims[i,i]),5),
            'source_original':by_word[w].get('original','')
        })

    inverse={}
    for r in details:
        inverse[r['assigned_visual_word']]=r['file']

    payload={'schema_version':'1.0','model':model_id,'words':words,'rows':details,'recommended_word_to_file':inverse}
    OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(payload,ensure_ascii=False,indent=2))

if __name__=='__main__':
    main()
