"""Create a static inspection copy using the actual PNG posters of embedded videos.

LibreOffice PDF conversion may omit media posters; this copy contains plain pictures.
The source PPTX, its videos and its playback controls are never changed.
"""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as ET

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
if args.source.resolve() == args.output.resolve():
    parser.error('Use a separate output file to preserve the animated presentation.')
ns = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
with ZipFile(args.source) as source, ZipFile(args.output, 'w', ZIP_DEFLATED) as output:
    for item in source.infolist():
        data = source.read(item.filename)
        if item.filename.startswith('ppt/slides/slide') and item.filename.endswith('.xml'):
            root = ET.fromstring(data, ET.XMLParser(resolve_entities=False, no_network=True))
            changed = False
            for pic in root.findall('.//p:pic', ns):
                if pic.find('.//a:videoFile', ns) is None:
                    continue
                properties = pic.find('p:nvPicPr/p:nvPr', ns)
                for child in list(properties):
                    properties.remove(child)
                for link in pic.findall('.//a:hlinkClick', ns):
                    link.getparent().remove(link)
                changed = True
            if changed:
                for timing in root.findall('p:timing', ns):
                    root.remove(timing)
                data = ET.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
        output.writestr(item, data)
