"""
Genera la identidad visual de Vestuario: favicon, iconos de la app y las imágenes para redes (Open Graph, X, cuadrada y
para historias). El estilo es el del pizarrón táctico: papel claro, tipografía condensada negra, puntos azules y rojos y
una jugada en trazo punteado.

Uso (desde la raíz del repo):   python scripts/brand/generate.py
Requiere Pillow. Las fuentes (Barlow Condensed en TTF) están en scripts/brand/fonts.
Escribe en public/. Los números de las medidas salen de dos espacios de diseño: ICONO (100x100) y ESCENA (600x600).
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
PUBLIC = RAIZ / "public"
FUENTES = Path(__file__).resolve().parent / "fonts"

PAPEL = (245, 243, 238)
TINTA = (10, 10, 11)
AZUL = (31, 122, 224)
ROJO = (236, 84, 78)
OSCURO = (9, 9, 11)
SS = 3  # supermuestreo para bordes suaves


def fuente(peso, px):
    return ImageFont.truetype(str(FUENTES / f"BarlowCondensed-{peso}.ttf"), int(px))


# ---------------------------------------------------------------- geometría de la jugada
def bezier(p0, p1, p2, p3, n=120):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((
            u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
        ))
    return pts


def cadena(segmentos):
    pts = []
    for s in segmentos:
        b = bezier(*s)
        pts += b if not pts else b[1:]
    return pts


def punteado(draw, pts, ancho, largo, hueco, color, escala):
    """Dibuja la polilínea en tramos (dash) de largo fijo, con puntas redondeadas."""
    largo, hueco = largo * escala, hueco * escala
    dibujando, resto = True, largo
    tramo = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        d = math.dist(a, b)
        pos = 0.0
        while d - pos > 1e-6:
            paso = min(resto, d - pos)
            f = (pos + paso) / d
            q = (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
            if dibujando:
                tramo.append(q)
            pos += paso
            resto -= paso
            if resto <= 1e-6:
                if dibujando and len(tramo) > 1:
                    draw.line(tramo, fill=color, width=int(ancho), joint="curve")
                    for p in (tramo[0], tramo[-1]):
                        r = ancho / 2
                        draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=color)
                dibujando = not dibujando
                resto = largo if dibujando else hueco
                tramo = [q] if dibujando else []
    if dibujando and len(tramo) > 1:
        draw.line(tramo, fill=color, width=int(ancho), joint="curve")


def puntos_punta(pts, ancho):
    """Vértices de la punta de flecha al final del trazo, orientada con la tangente."""
    (x0, y0), (x1, y1) = pts[-8], pts[-1]
    ang = math.atan2(y1 - y0, x1 - x0)
    cx, cy = math.cos(ang), math.sin(ang)
    largo, abre = ancho * 3.4, ancho * 1.8
    bx, by = x1 - cx * largo * 0.3, y1 - cy * largo * 0.3
    return [(x1 + cx * largo * 0.7, y1 + cy * largo * 0.7),
            (bx - cy * abre, by + cx * abre), (bx + cy * abre, by - cx * abre)]


def punta(draw, pts, ancho, color):
    draw.polygon(puntos_punta(pts, ancho), fill=color)


def punto(draw, c, r, color):
    draw.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=color)


# ---------------------------------------------------------------- icono (espacio 100x100)
ICONO_JUGADA = [((26, 76), (26, 36), (60, 84), (76, 28))]
ICONO_PUNTOS = [((52, 36), ROJO, 6.5), ((64, 70), ROJO, 6.5), ((26, 76), AZUL, 8.5)]


def icono(tam, fondo=OSCURO, radio=0.22, margen=0.0, trazo=PAPEL):
    """Icono cuadrado de `tam` px. `margen` encoge el dibujo hacia el centro (para el icono maskable)."""
    g = tam * SS
    img = Image.new("RGBA", (g, g), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if radio > 0:
        d.rounded_rectangle([0, 0, g - 1, g - 1], radius=g * radio, fill=fondo)
    else:
        d.rectangle([0, 0, g, g], fill=fondo)
    k = g / 100 * (1 - 2 * margen)
    o = g * margen

    def t(p):
        return (o + p[0] * k, o + p[1] * k)

    pts = [t(p) for p in cadena(ICONO_JUGADA)]
    ancho = 6.2 * k
    pequeno = tam <= 48
    punteado(d, pts, ancho, 8 if not pequeno else 9, 7 if not pequeno else 6.5, trazo, k)
    d.line(pts[-14:], fill=trazo, width=int(ancho))
    punta(d, pts, ancho * 1.05, trazo)
    for c, color, r in ICONO_PUNTOS:
        punto(d, t(c), r * k, color)
    return img.resize((tam, tam), Image.LANCZOS)


def icono_svg():
    """Mismo dibujo que `icono`, en SVG (favicon vectorial y pwa-icon.svg)."""
    pts = cadena(ICONO_JUGADA)
    tip, izq, der = puntos_punta(pts, 6.2 * 1.05)
    (a, b, c, e) = ICONO_JUGADA[0]
    circ = "".join(
        f'<circle cx="{p[0]}" cy="{p[1]}" r="{r}" fill="#{col[0]:02x}{col[1]:02x}{col[2]:02x}"/>'
        for p, col, r in ICONO_PUNTOS)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">'
        '<rect width="100" height="100" rx="22" fill="#09090b"/>'
        f'<path d="M{a[0]} {a[1]}C{b[0]} {b[1]} {c[0]} {c[1]} {e[0]} {e[1]}" stroke="#f5f3ee" stroke-width="6.2" '
        'stroke-linecap="round" stroke-dasharray="8 7"/>'
        f'<polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts[-14:])}" stroke="#f5f3ee" stroke-width="6.2" stroke-linecap="butt" stroke-linejoin="round"/>'
        f'<polygon points="{tip[0]:.1f},{tip[1]:.1f} {izq[0]:.1f},{izq[1]:.1f} {der[0]:.1f},{der[1]:.1f}" fill="#f5f3ee"/>'
        f'{circ}</svg>'
    )


# ---------------------------------------------------------------- escena táctica (espacio 600x600)
JUGADA = [((70, 190), (110, 300), (200, 270), (235, 345)), ((235, 345), (265, 410), (300, 430), (322, 500))]
ROJOS = [(150, 150), (60, 205), (232, 262), (420, 235), (180, 415), (338, 440), (408, 545)]
AZULES = [(120, 170), (470, 360), (300, 445)]


def escena(d, ox, oy, k, lineas=5.2):
    """Dibuja la mitad de cancha, la jugada y los jugadores. (ox, oy) es la esquina y k la escala de 600 → px."""
    def t(p):
        return (ox + p[0] * k, oy + p[1] * k)

    w = lineas * k
    # línea de mitad de cancha y círculo central
    d.line([t((-60, 150)), t((660, 150))], fill=TINTA, width=int(w))
    r = 110 * k
    c = t((300, 150))
    d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], outline=TINTA, width=int(w))
    # área grande, área chica y semicírculo
    d.rectangle([*t((90, 480)), *t((510, 700))], outline=TINTA, width=int(w))
    d.rectangle([*t((205, 560)), *t((395, 700))], outline=TINTA, width=int(w))
    a = t((300, 480))
    ra = 88 * k
    d.arc([a[0] - ra, a[1] - ra, a[0] + ra, a[1] + ra], 180, 360, fill=TINTA, width=int(w))
    # jugada punteada con punta de flecha
    pts = [t(p) for p in cadena([tuple(s) for s in JUGADA])]
    ancho = 5.4 * k
    punteado(d, pts, ancho, 15, 14, TINTA, k)
    d.line(pts[-14:], fill=TINTA, width=int(ancho))
    punta(d, pts, ancho * 1.7, TINTA)
    # jugadores
    for p in ROJOS:
        punto(d, t(p), 10 * k, ROJO)
    for p in AZULES:
        punto(d, t(p), 10 * k, AZUL)
    return t


def etiquetas(d, t, k):
    f = fuente(700, 25 * k)
    d.text(t((108, 108)), "VOS", font=f, fill=AZUL)
    d.text(t((205, 280)), "RIVAL", font=f, fill=TINTA)
    d.text(t((232, 452)), "GOL", font=f, fill=AZUL)


# ---------------------------------------------------------------- texto
def ancho_texto(f, s, sep=0):
    return sum(f.getlength(ch) + sep for ch in s) - sep


def texto(d, xy, s, f, fill, sep=0):
    x, y = xy
    if sep == 0:
        d.text((x, y), s, font=f, fill=fill)
        return
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch) + sep


def ajustar(s, peso, max_ancho, sep_rel=0.0, tope=2000):
    """Mayor tamaño de fuente con el que `s` entra en `max_ancho`."""
    px = tope
    while px > 8:
        f = fuente(peso, px)
        if ancho_texto(f, s, sep_rel * px) <= max_ancho:
            return f, sep_rel * px
        px -= 4
    return fuente(peso, 8), 0


def portada(w, h, modo, nombre, calidad=90):
    g = (w * SS, h * SS)
    img = Image.new("RGB", g, PAPEL)
    d = ImageDraw.Draw(img)
    m = 56 * SS
    if modo == "fila":
        # texto a la izquierda, jugada a la derecha
        k = h / 600 * SS * 0.92
        escena_ox = w * SS - 520 * k - 40 * SS
        t = escena(d, escena_ox, 0, k)
        etiquetas(d, t, k)
        zona = escena_ox + 50 * k - m - 30 * SS
        f1, s1 = ajustar("VESTUARIO", 800, zona * 0.62, 0.16)
        texto(d, (m, h * SS * 0.075), "VESTUARIO", fuente(800, h * SS * 0.105), AZUL, h * SS * 0.105 * 0.16)
        gran, sg = ajustar("VOS SOS", 900, zona, 0.0)
        gran2, _ = ajustar("EL DT.", 900, zona, 0.0)
        px = min(gran.size, gran2.size, h * SS * 0.36)
        fg = fuente(900, px)
        y = h * SS * 0.20
        texto(d, (m, y), "VOS SOS", fg, TINTA)
        texto(d, (m, y + px * 0.86), "EL DT.", fg, TINTA)
        fs = fuente(700, h * SS * 0.078)
        texto(d, (m + 4, y + px * 1.86), "Juego de Director Técnico de fútbol", fs, TINTA)
        fu = fuente(700, h * SS * 0.052)
        texto(d, (m + 4, h * SS - m * 0.95 - fu.size * 0.6), "VESTUARIO.COM.AR", fu, AZUL, fu.size * 0.14)
    else:
        # texto arriba y jugada abajo (cuadrada e historias)
        ancho_u = w * SS - 2 * m
        fv = fuente(800, w * SS * 0.062)
        texto(d, (m, h * SS * 0.05), "VESTUARIO", fv, AZUL, fv.size * 0.16)
        gran, _ = ajustar("VOS SOS EL DT.", 900, ancho_u, 0.0)
        y = h * SS * (0.095 if modo == "cuadrada" else 0.085)
        texto(d, (m, y), "VOS SOS EL DT.", gran, TINTA)
        fs = fuente(700, w * SS * 0.052)
        texto(d, (m + 4, y + gran.size * 0.98), "Juego de Director Técnico de fútbol", fs, TINTA)
        k = (w * SS) / 600 * (0.58 if modo == "cuadrada" else 1.12)
        top = h * SS * (0.34 if modo == "cuadrada" else 0.26)
        t = escena(d, (w * SS - 600 * k) / 2, top, k)
        etiquetas(d, t, k)
        # franja superior que tapa el círculo central si invade el texto: se vuelve a pintar papel
        fu = fuente(700, w * SS * 0.04)
        d.rectangle([0, h * SS - m * 1.7, w * SS, h * SS], fill=PAPEL)
        texto(d, (m, h * SS - m * 0.8 - fu.size * 0.6), "VESTUARIO.COM.AR", fu, AZUL, fu.size * 0.14)
    img = img.resize((w, h), Image.LANCZOS)
    destino = PUBLIC / "og" / nombre
    destino.parent.mkdir(exist_ok=True)
    img.save(destino, "JPEG", quality=calidad, optimize=True, progressive=True)
    print(f"  {destino.relative_to(RAIZ)}  {w}x{h}  {destino.stat().st_size // 1024} KB")


def main():
    PUBLIC.mkdir(exist_ok=True)
    print("Iconos")
    (PUBLIC / "favicon.svg").write_text(icono_svg(), encoding="utf-8")
    (PUBLIC / "pwa-icon.svg").write_text(icono_svg(), encoding="utf-8")
    icono(16).save(PUBLIC / "favicon-16x16.png")
    icono(32).save(PUBLIC / "favicon-32x32.png")
    icono(180, radio=0).save(PUBLIC / "apple-touch-icon.png")  # iOS redondea solo
    icono(192).save(PUBLIC / "icon-192.png")
    icono(512).save(PUBLIC / "icon-512.png")
    icono(512, radio=0, margen=0.14).save(PUBLIC / "icon-maskable-512.png")
    icono(256).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Imágenes para redes")
    portada(1200, 630, "fila", "vestuario-og.jpg")  # Facebook, WhatsApp, LinkedIn, Telegram, Discord, iMessage
    portada(1200, 600, "fila", "vestuario-x.jpg")  # X / Twitter (summary_large_image, 2:1)
    portada(1080, 1080, "cuadrada", "vestuario-cuadrada.jpg")  # Instagram feed, Threads
    portada(1080, 1920, "historia", "vestuario-historia.jpg")  # Instagram/Facebook Stories, TikTok, Reels


if __name__ == "__main__":
    main()
