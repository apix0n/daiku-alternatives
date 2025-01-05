import json
import os
import subprocess

inputdir = './anilist'
outdir = './resized'
quality = "90%"

os.makedirs(outdir, exist_ok=True)

for d in os.listdir(inputdir):
    files = os.listdir(os.path.join(inputdir, d))
    for f in files:
        if f == 'original.jpg' or f == 'original.png' or f == 'original.jpeg' or f == 'original.webp':
            os.makedirs(f'{outdir}/{d}', exist_ok=True)
            input_path = f'{inputdir}/{d}/{f}'
            output_path = f'{outdir}/{d}/'
            subprocess.run(['convert', input_path, '-resize', "500x", '-quality', quality, output_path + "large.jpg"])
            subprocess.run(['convert', input_path, '-resize', "250x", '-quality', quality, output_path + "medium.jpg"])
            subprocess.run(['convert', input_path, '-resize', "100x", '-quality', quality, output_path + "small.jpg"])

data = {}

for id in os.listdir(inputdir):
    if os.path.isdir(os.path.join(inputdir, id)):
        data[id] = {}
        try:
            covers = { os.path.splitext(file)[0]: f'../{id}/{file}' for file in os.listdir(f'{outdir}/{id}') if '.jpg' in file }
        except:
            covers = None
        with open(f'{inputdir}/{id}/infos.json', 'r') as info_file:
            info = json.load(info_file)
            title = info.get('title')
        if covers:
            data[id]["covers"] = covers
        if title:
            data[id]["title"] = title


with open(f'{outdir}/overrides.json', 'w') as f:
    f.write(json.dumps({k: data[k] for k in sorted(data, key=int)}, indent=2))