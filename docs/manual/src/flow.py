"""Diagram alir berlajur (swimlane) dengan simbol ISO 5807, keluaran SVG."""
from html import escape

G900 = "#064a38"
G700 = "#0a785b"
G100 = "#e7f3ee"
G50 = "#f3f9f6"
INK = "#1b2420"
GOLD_F = "#fff6dc"
GOLD_S = "#a77f00"
RED = "#c0392b"

LANE_HEAD = 34
ROW_H = 64
TOP_PAD = 26


def _text(x, y, label, size=9.6, color=INK, weight=500):
    lines = label.split("\n")
    lh = size * 1.25
    y0 = y - (len(lines) - 1) * lh / 2 + size * 0.35
    out = []
    for i, t in enumerate(lines):
        out.append(f'<text x="{x:.1f}" y="{y0 + i * lh:.1f}" text-anchor="middle" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(t)}</text>')
    return "".join(out)


class Flow:
    def __init__(self, lanes, width=640, system_lane=None):
        self.lanes = lanes
        self.W = width
        self.lw = width / len(lanes)
        self.nodes = {}
        self.edges = []
        self.system_lane = system_lane if system_lane is not None else len(lanes) - 1

    def node(self, nid, lane, row, kind, label):
        cx = self.lw * lane + self.lw / 2
        cy = LANE_HEAD + TOP_PAD + row * ROW_H + 20
        w = min(self.lw - 26, 132)
        h = 38
        if kind == "decision":
            w, h = min(self.lw - 14, 136), 50
        if kind == "terminal":
            w, h = min(self.lw - 40, 104), 28
        if label.count("\n") >= 2 and kind != "decision":
            h = 48
        self.nodes[nid] = dict(cx=cx, cy=cy, w=w, h=h, kind=kind, label=label, lane=lane, row=row)

    def edge(self, a, b, label=None, out="bottom", into="top", via=None):
        self.edges.append(dict(a=a, b=b, label=label, out=out, into=into, via=via))

    # titik sambung pada sisi simpul
    def _port(self, n, side):
        if side == "bottom":
            return (n["cx"], n["cy"] + n["h"] / 2)
        if side == "top":
            return (n["cx"], n["cy"] - n["h"] / 2)
        if side == "left":
            return (n["cx"] - n["w"] / 2, n["cy"])
        return (n["cx"] + n["w"] / 2, n["cy"])

    def _shape(self, n):
        x, y, w, h = n["cx"] - n["w"] / 2, n["cy"] - n["h"] / 2, n["w"], n["h"]
        k = n["kind"]
        sys = n["lane"] == self.system_lane
        fill = G50 if sys else "#ffffff"
        s = ""
        if k == "terminal":
            s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{G700}" stroke="{G900}" stroke-width="1"/>'
            return s + _text(n["cx"], n["cy"], n["label"], 9.4, "#ffffff", 700)
        if k == "process":
            s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{fill}" stroke="{G900}" stroke-width="1.2"/>'
        elif k == "predefined":
            s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="{fill}" stroke="{G900}" stroke-width="1.2"/><line x1="{x+7}" y1="{y}" x2="{x+7}" y2="{y+h}" stroke="{G900}"/><line x1="{x+w-7}" y1="{y}" x2="{x+w-7}" y2="{y+h}" stroke="{G900}"/>'
        elif k == "decision":
            s = f'<polygon points="{n["cx"]},{y} {x+w},{n["cy"]} {n["cx"]},{y+h} {x},{n["cy"]}" fill="{GOLD_F}" stroke="{GOLD_S}" stroke-width="1.2"/>'
        elif k == "data":
            o = 9
            s = f'<polygon points="{x+o},{y} {x+w},{y} {x+w-o},{y+h} {x},{y+h}" fill="{fill}" stroke="{G900}" stroke-width="1.2"/>'
        elif k == "document":
            s = f'<path d="M{x},{y} H{x+w} V{y+h-6} Q{x+w*0.75},{y+h+4} {x+w/2},{y+h-5} T{x},{y+h-5} Z" fill="{G50 if sys else "#fff"}" stroke="{G900}" stroke-width="1.2"/>'
        elif k == "store":
            e = 5
            s = (f'<path d="M{x},{y+e} V{y+h-e} A{w/2},{e} 0 0 0 {x+w},{y+h-e} V{y+e}" fill="{G100}" stroke="{G900}" stroke-width="1.2"/>'
                 f'<ellipse cx="{n["cx"]}" cy="{y+e}" rx="{w/2}" ry="{e}" fill="{G100}" stroke="{G900}" stroke-width="1.2"/>')
        size = 8.6 if k == "decision" else 9.2
        dy = 1 if k == "decision" else 3 if k == "store" else 0
        return s + _text(n["cx"], n["cy"] + dy, n["label"], size)

    def _route(self, e):
        a, b = self.nodes[e["a"]], self.nodes[e["b"]]
        p0 = self._port(a, e["out"])
        p1 = self._port(b, e["into"])
        if e["via"]:
            pts = [p0] + [(vx if vx is not None else p0[0], vy if vy is not None else p0[1]) for vx, vy in e["via"]] + [p1]
            return pts
        if e["out"] == "bottom" and e["into"] == "top":
            if abs(p0[0] - p1[0]) < 1:
                return [p0, p1]
            ym = p1[1] - 12
            return [p0, (p0[0], ym), (p1[0], ym), p1]
        if e["out"] in ("left", "right") and e["into"] == "top":
            return [p0, (p1[0], p0[1]), p1]
        if e["out"] in ("left", "right") and e["into"] in ("left", "right") and abs(p0[1] - p1[1]) < 1:
            return [p0, p1]
        if e["out"] == "bottom" and e["into"] in ("left", "right"):
            return [p0, (p0[0], p1[1]), p1]
        return [p0, (p0[0], p1[1]), p1]

    def svg(self):
        rows = max(n["row"] for n in self.nodes.values()) + 1
        H = LANE_HEAD + TOP_PAD + rows * ROW_H + 14
        parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.W} {H}" width="100%" font-family="Inter, sans-serif">',
                 f'<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{G900}"/></marker></defs>',
                 f'<rect x="0.5" y="0.5" width="{self.W-1}" height="{H-1}" rx="6" fill="#fff" stroke="#cfdcd5"/>']
        for i, name in enumerate(self.lanes):
            x = self.lw * i
            parts.append(f'<rect x="{x+0.5}" y="{LANE_HEAD}" width="{self.lw-1}" height="{H-LANE_HEAD-1}" fill="{G50 if i % 2 == 0 else "#ffffff"}"/>')
            if i:
                parts.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}" stroke="#cfdcd5"/>')
            parts.append(f'<rect x="{x+0.5}" y="0.5" width="{self.lw-1}" height="{LANE_HEAD}" fill="{G900}"/>')
            parts.append(_text(x + self.lw / 2, LANE_HEAD / 2, name.upper(), 8.4, "#ffffff", 700))
        for e in self.edges:
            pts = self._route(e)
            d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
            parts.append(f'<path d="{d}" fill="none" stroke="{G900}" stroke-width="1.1" marker-end="url(#ah)"/>')
            if e["label"]:
                x, y = pts[0]
                yes = e["label"].lower().startswith("ya")
                col = G700 if yes else RED
                if e["out"] == "bottom":
                    lx, ly, anc = x + 5, y + 11, "start"
                elif e["out"] == "left":
                    lx, ly, anc = x - 4, y - 5, "end"
                else:
                    lx, ly, anc = x + 4, y - 5, "start"
                parts.append(f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anc}" font-size="8.4" font-weight="700" fill="{col}">{escape(e["label"])}</text>')
        for n in self.nodes.values():
            parts.append(self._shape(n))
        parts.append("</svg>")
        return "".join(parts)


def symbol(kind):
    """Satu simbol untuk Tabel notasi diagram alir"""
    f = Flow(["x"], width=150)
    f.node("s", 0, 0, kind, "")
    n = f.nodes["s"]
    n["cy"] = 26
    body = f._shape(n)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{n["cx"]-n["w"]/2-4} 0 {n["w"]+8} 52" width="110" height="40">{body}</svg>'
