"""Fetch the free pinned geometry/animation sources for the personal motion sample."""
import subprocess, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
W=ROOT/'work/personal-iqbal-3d';V=W/'vendor';V.mkdir(parents=True,exist_ok=True)
repos=[('mpfb2','https://github.com/makehumancommunity/mpfb2.git','6ff1eb358f6c1959ced77e79e6dd2406d9a71f49'),('quaternius-walk','https://github.com/J-Ponzo/gltf-universal-animation-library.git','e24c23cf2a1323488a3faa226ea7ea21f644b73e')]
for name,url,rev in repos:
    p=V/name
    if not p.exists():subprocess.run(['git','clone',url,str(p)],check=True)
    subprocess.run(['git','-C',str(p),'checkout','--detach',rev],check=True)
out=W/'assets';out.mkdir(exist_ok=True)
for name,lic in [('makehuman_system_assets','cc0'),('shirts02','ccby')]:
    filename=f'{name}_{lic}.zip';zpath=V/filename
    if not zpath.exists():
        subprocess.run(['curl','-fL','--retry','2','-o',str(zpath),f'https://files.makehumancommunity.org/asset_packs/{name}/{filename}'],check=True)
    with zipfile.ZipFile(zpath) as archive:
        for item in archive.infolist():
            if not (out/item.filename).resolve().is_relative_to(out.resolve()):raise ValueError(item.filename)
        archive.extractall(out)
    print('Ready:',name)
