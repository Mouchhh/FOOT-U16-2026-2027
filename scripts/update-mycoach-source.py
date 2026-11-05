"""Archive the supplied HTML verbatim and isolate its original script without autostart."""
from pathlib import Path
import re,hashlib,json,sys
source=Path(sys.argv[1]);raw=source.read_bytes();html=raw.decode()
script=re.search(r'<script\b[^>]*>([\s\S]*?)</script\s*>',html,re.I)[1]
marker="if (typeof EXOS !== 'undefined') renderBundle"
assert marker in script
core=script[:script.index(marker)]
archive=Path('assets/exercises/mycoach-original.html')
old=Path('assets/exercises/mycoach-original-v1.html')
if not old.exists():old.write_bytes(archive.read_bytes())
archive.write_bytes(raw)
Path('supplied-mycoach-engine.js').write_text('// Original MyCoach exercise data and functions, untouched; standalone page autostart omitted.\nwindow.suppliedMyCoachExerciseEngine=(()=>{\n'+core+"\nreturn {exercises:EXOS,viewsOf,adapt,buildExerciseModel,createBoard,renderFiche,materialOf,seriesOf,moments:FICHE_MOMENTS};\n})();\n")
assert re.search(r'<style[^>]*>([\s\S]*?)</style>',html,re.I)[1].encode()==Path('supplied-mycoach-base.css').read_bytes()
manifest=json.loads(Path('docs/mycoach-source.json').read_text());manifest.update(file=source.name,sha256=hashlib.sha256(raw).hexdigest(),previousSha256=hashlib.sha256(old.read_bytes()).hexdigest(),exercises=1000,existingMyCoachPreserved=249,addedExercises=751,totalExercises=1084)
Path('docs/mycoach-source.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
