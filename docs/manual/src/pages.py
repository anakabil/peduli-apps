import json, subprocess, os, re
D = os.path.dirname(os.path.abspath(__file__))
keys = json.load(open(f"{D}/keys.json"))
txt = subprocess.run(["pdftotext", f"{D}/body.pdf", "-"], capture_output=True, text=True).stdout.split("\f")
pages = {}
for i, t in enumerate(txt):
    t = t.replace("\n", "").replace(" ", "")
    for k in re.findall(r"QQ([A-Za-z0-9]+?)QQ", t):
        pages.setdefault(k, i + 1)
miss = [k for k in keys if k not in pages]
json.dump(pages, open(f"{D}/pages.json", "w"))
print("pages", len(txt) - 1, "found", len(pages), "missing", miss[:20])
