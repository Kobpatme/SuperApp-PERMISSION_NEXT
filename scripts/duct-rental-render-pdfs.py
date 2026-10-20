"""Render synthetic PDF evidence and unchanged Source references for visual QA."""
from pathlib import Path
import argparse
import subprocess
from PIL import Image, ImageOps, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('--poppler-bin', required=True)
args = parser.parse_args()
evidence = Path('docs/quality/duct-rental')
rendered = evidence / 'closure-pdf-render'
rendered.mkdir(parents=True, exist_ok=True)
images = []
for name, first, last in [('nt-form', 1, 5), ('nt-form-signed', 4, 4), ('nt-form-chosen-date', 4, 4), ('summary', 1, 1), ('nt-duct-rental-blank', 1, 1), ('nt-duct-rental-example-copy', 1, 1)]:
    source = evidence / (name + '.pdf') if name in ['nt-form', 'nt-form-signed', 'nt-form-chosen-date', 'summary'] else Path('src/modules/duct-rental/assets') / (name + '.pdf')
    subprocess.run([str(Path(args.poppler_bin) / 'pdftoppm.exe'), '-png', '-r', '100', '-f', str(first), '-l', str(last), str(source), str(rendered / name)], check=True)
    images.extend(sorted(rendered.glob(name + '-*.png')))
sheet = Image.new('RGB', (1200, 4 * 460), 'white')
draw = ImageDraw.Draw(sheet)
for index, path in enumerate(images):
    preview = ImageOps.contain(Image.open(path).convert('RGB'), (390, 425))
    x, y = (index % 3) * 400, (index // 3) * 460
    sheet.paste(preview, (x + (400-preview.width)//2, y+25))
    draw.text((x+5, y+5), path.name, fill='black')
sheet.save(rendered / 'contact-sheet.png')
print(f'Rendered {len(images)} synthetic/reference pages for visual inspection')
