"""Export generated five-scene photography into the site's existing PNG layout.

Input JSON: ordered {id, title, path} records for approved generated masters.
Only trims exterior whitespace/blue generated headers, resizes and encodes;
scene content is authored with image generation, never drawn by this script.
"""
import argparse, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

p=argparse.ArgumentParser();p.add_argument('input');a=p.parse_args()
root=Path(__file__).resolve().parents[1]
rows=json.loads(Path(a.input).read_text())
out=root/'storyboards/islamic';out.mkdir(parents=True,exist_ok=True)
assets={};report=[]
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
for row in rows:
    image=Image.open(row['path']).convert('RGB');pixels=np.array(image)
    # Locate the full-width blue title band and the photographic bottom edge.
    blue=(pixels[:,:,2]>pixels[:,:,0]*1.12)&(pixels[:,:,1]>pixels[:,:,0]*1.06)&(pixels[:,:,2]>180)
    bands=np.where((blue.mean(1)>.55)&(np.arange(image.height)<image.height*.4))[0]
    assert len(bands),row['id']
    top=int(bands[-1])+8
    nonwhite=(pixels.min(2)<235).mean(1)
    bottom=int(np.where(nonwhite>.4)[0][-1])+1
    assert .45*image.height < bottom-top < .9*image.height,row['id']
    content_top=int(np.where(nonwhite>.4)[0][0])
    board=image.crop((0,content_top,image.width,bottom)).resize((1402,355),Image.Resampling.LANCZOS)
    photos=image.crop((0,top,image.width,bottom)).resize((1402,297),Image.Resampling.LANCZOS)
    png=out/(row['id']+'.png')
    board.quantize(colors=256,method=Image.Quantize.MEDIANCUT).save(png,optimize=True)
    frames=[]
    for n in range(5):
        # Scene 1 is on the right, scene 5 on the left, just like existing boards.
        col=4-n;left=round(col*1402/5)+4;right=round((col+1)*1402/5)-4
        frame=photos.crop((left,0,right,297))
        # Some generated title pills slightly overlap the centre panel's top edge.
        # Trim only that title strip; numbered photo badges occupy much less width.
        rgb=np.array(frame).astype(float)
        title_blue=(rgb[:,:,2]>180)&(rgb[:,:,0]<100)&(rgb[:,:,1]>120)
        header_rows=np.where(title_blue[:35].mean(1)>.6)[0]
        trim=int(header_rows[-1])+3 if len(header_rows) else 0
        frame=frame.crop((0,trim,frame.width,frame.height)).resize((280,297),Image.Resampling.LANCZOS)
        frame_path=out/(row['id']+'-'+str(n+1)+'.webp')
        frame.save(frame_path,format='WEBP',quality=82,method=6)
        frames.append(frame_path.relative_to(root).as_posix())
    assets[row['id']]={'storyboard':png.relative_to(root).as_posix(),'frames':frames}
    report.append({'id':row['id'],'source_size':image.size,'source_photo_bounds':[top,bottom],'png_bytes':png.stat().st_size})
(root/'routine-photo-assets-v1.js').write_text('window.APP360_ROUTINE_PHOTO_ASSETS = '+json.dumps(assets,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps(report,indent=2))
print('Exported',len(rows),'PNG storyboards and',len(rows)*5,'WebP frames')
