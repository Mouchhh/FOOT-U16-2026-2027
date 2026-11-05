"""Static review of exported PPTX geometry; not a substitute for PowerPoint playback.
Usage: python3 scripts/preview-causerie-pptx.py input.pptx /tmp/deck-preview.png
Renders shapes, pictures and text from the actual slide XML. GIFs use their first frame.
"""
import sys,zipfile,re,posixpath,io,math
from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image,ImageDraw,ImageFont
NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
SCALE=96/914400
ROOT=Path(__file__).resolve().parents[1]
def color(node,fallback='#0b192c'):
 if node is None:return fallback
 value=node.find('.//a:srgbClr',NS)
 return '#'+value.get('val') if value is not None else fallback
def font(size,bold=False,italic=False,face='Arial'):
 if face=='Montserrat':
  result=ImageFont.truetype(str(ROOT/'assets/fonts/montserrat/Montserrat-Italic.ttf'),size)
  if bold:
   try:result.set_variation_by_name('Bold Italic')
   except OSError:pass
  return result
 suffix='BoldItalic' if bold and italic else 'Bold' if bold else 'Italic' if italic else 'Regular'
 return ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-'+suffix+'.ttf',size)
def coords(shape):
 xf=shape.find('.//a:xfrm',NS)
 if xf is None:return None
 off,ext=xf.find('a:off',NS),xf.find('a:ext',NS)
 if off is None or ext is None:return None
 return [round(int(off.get(k))*SCALE) for k in ['x','y']]+[round(int(ext.get(k))*SCALE) for k in ['cx','cy']]
def wrap(draw,text,face,width):
 lines=[]
 for original in text.split('\n'):
  row=''
  for word in original.split(' '):
   if row and draw.textlength(row+' '+word,font=face)>width:lines.append(row);row=word
   else:row=(row+' '+word).strip()
  lines.append(row)
 return lines
with zipfile.ZipFile(sys.argv[1]) as z:
 slides=[]
 for path in sorted([p for p in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',p)],key=lambda p:int(re.search(r'(\d+)\.xml',p)[1])):
  xml=ET.fromstring(z.read(path));rels=ET.fromstring(z.read(posixpath.dirname(path)+'/_rels/'+posixpath.basename(path)+'.rels'))
  targets={r.get('Id'):posixpath.normpath(posixpath.join(posixpath.dirname(path),r.get('Target'))) for r in rels}
  image=Image.new('RGB',(1280,720),color(xml.find('.//p:bg',NS),'#ffffff'));draw=ImageDraw.Draw(image)
  for shape in xml.find('p:cSld/p:spTree',NS):
   box=coords(shape)
   if box is None:continue
   x,y,w,h=box
   if shape.tag.endswith('pic'):
    blip=shape.find('.//a:blip',NS);target=targets.get(blip.get('{'+NS['r']+'}embed')) if blip is not None else None
    if target and target in z.namelist():
     try:
      picture=Image.open(io.BytesIO(z.read(target))).convert('RGBA').resize((max(1,w),max(1,h)),Image.Resampling.LANCZOS);image.paste(picture,(x,y),picture)
     except Exception:pass
    continue
   props=shape.find('p:spPr',NS);fill=props.find('a:solidFill',NS) if props is not None else None
   geom=props.find('a:prstGeom',NS) if props is not None else None
   outline=props.find('a:ln/a:solidFill',NS) if props is not None else None
   bounds=(x,y,x+max(0,w),y+max(0,h));ellipse=geom is not None and geom.get('prst')=='ellipse'
   if fill is not None and fill.find('.//a:alpha',NS) is None:(draw.ellipse if ellipse else draw.rectangle)(bounds,fill=color(fill))
   if outline is not None and outline.find('.//a:alpha',NS) is None:(draw.ellipse if ellipse else draw.rectangle)(bounds,outline=color(outline),width=1)
   body=shape.find('p:txBody',NS)
   if body is None:continue
   paragraphs=[]
   for p in body.findall('a:p',NS):
    text=''.join(n.text or '' for n in p.findall('.//a:t',NS))
    rpr=p.find('.//a:rPr',NS)
    if rpr is None:rpr=p.find('.//a:defRPr',NS)
    attrs=rpr.attrib if rpr is not None else {};latin=rpr.find('a:latin',NS) if rpr is not None else None
    ppr=p.find('a:pPr',NS)
    paragraphs.append((text,attrs,latin.get('typeface') if latin is not None else 'Arial',color(rpr),ppr.get('algn','l') if ppr is not None else 'l'))
   if not paragraphs:continue
   size=round(float(paragraphs[0][1].get('sz','2000'))/100*96/72)
   for _ in range(12):
    layout=[]
    for text,attrs,face,ink,align in paragraphs:
     f=font(max(7,size),attrs.get('b')=='1',attrs.get('i')=='1',face);rows=wrap(draw,text,f,max(1,w-3));layout.append((rows,f,ink,align))
    if sum(len(rows)*(size*1.17) for rows,_,_,_ in layout)<=h+2 or size<=8:break
    size-=1
   bodypr=body.find('a:bodyPr',NS);total=sum(len(rows)*size*1.17 for rows,_,_,_ in layout)
   cursor=y+max(0,(h-total)/2) if bodypr is not None and bodypr.get('anchor')=='ctr' else y
   for rows,f,ink,align in layout:
    for row in rows:
     tw=draw.textlength(row,font=f);tx=x+max(0,(w-tw)/2) if align=='ctr' else x+max(0,w-tw) if align=='r' else x
     draw.text((tx,cursor),row,font=f,fill=ink,anchor='lt');cursor+=size*1.17
  slides.append(image)
 columns=3;rows=math.ceil(len(slides)/columns);thumb=(576,324);sheet=Image.new('RGB',(columns*600,rows*355),'#e9eef5');d=ImageDraw.Draw(sheet)
 for i,slide in enumerate(slides):
  slide.save(str(Path(sys.argv[2]).with_name('causerie-slide-'+str(i+1)+'.png')))
  x=(i%columns)*600+12;y=(i//columns)*355+8;sheet.paste(slide.resize(thumb,Image.Resampling.LANCZOS),(x,y));d.text((x,y+328),str(i+1).zfill(2),fill='#17385d')
 sheet.save(sys.argv[2]);print(sys.argv[2])
