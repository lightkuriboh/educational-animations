# Morphological Differentiation & Anatomical Homology of Human External Genitalia

An interactive, responsive 3D biomedical web visualization educating university-level biology and medical students on embryonic organogenesis and sexual dimorphism of human external genitalia.

Demonstrates how male and female anatomical structures diverge from identical **bipotential primordial tissue** starting at **gestational Week 7**, driven by hormonal signaling (presence or absence of Dihydrotestosterone / DHT).

🌐 **Live Web Application:** [https://lightkuriboh.github.io/genitals-edu/](https://lightkuriboh.github.io/genitals-edu/)

---

## 🧬 Anatomical Homology Matrix

| Primordial Origin (Week 7) | Female Differentiation (46,XX Pathway) | Male Differentiation (46,XY Pathway) | Endocrine Mechanism |
| :--- | :--- | :--- | :--- |
| **Genital Tubercle** | Glans clitoridis, clitoral hood & corpora cavernosa | Glans penis, coronal sulcus & penile corpora | DHT stimulates rapid phallic elongation; absence maintains baseline clitoral scale. |
| **Urogenital / Urethral Folds** | Labia minora (unfused medial borders) | Ventral penile shaft, ventral raphe & spongy urethra | DHT induces proximal-to-distal medial fusion to enclose the urethra. |
| **Labioscrotal Swellings** | Labia majora & anterior/posterior commissures | Scrotal sac & scrotal raphe | DHT mediates inferomedial migration and ventral scrotal midline fusion. |
| **Urogenital Sinus / Groove** | Vestibule (urethral & vaginal orifices) | Spongy (penile) urethra & distal meatus | Folds fuse over the groove to form the tubular urethra; distal meatus opens at the glans apex. |

---

## ✨ Features & Visual Engine

- **Procedural Mathematical Mesh (Zero-GLTF Morphing):**
  - Generates coordinate modifiers dynamically without external `.gltf` / `.obj` files.
  - **3D Lithotomy Pelvic Backdrop & Opening Thighs:** Anatomically shaped lower torso in lithotomy position featuring two abducted 3D thighs, mons pubis adipose elevation, genitocrural/inguinal creases, perineal body, and puckered anal verge with procedural edge alpha fading.
  - **Textbook Anatomical Organ Profiles (Langman & Netter references):**
    - *Genital Tubercle / Phallus*: Ogive domed glans, overhanging coronal sulcus, ventral corpus spongiosum ridge, clitoral glans with dedicated clitoral hood (prepuce) cowl mesh that smoothly collapses when `hood ~ 0`.
    - *Urogenital Folds*: Blade-like mucosal labia minora with lateral flare and ruffle, converging posteriorly into the fourchette; male midline urethral zippering along the ventral shaft to the coronal sulcus.
    - *Labioscrotal Swellings*: Asymmetric rooted labia majora (`Z_ROOT = -0.40`) tapering towards the posterior commissure; male ovoid scrotal sac with median scrotal raphe sulcus and fundus notch.
    - *Urogenital Sinus*: Deepened vestibule/introitus with hymenal caruncles, dark urethral and vaginal orifice decals (`introitusHole`, `urethralSlit`), and glans apex slit meatus.
  - Smooth non-linear cubic easing transitions across the continuous developmental and arousal cycles.
- **Dual Visual Rendering Styles:**
  - **Sculpted Clay (Stylized/Tactile):** High roughness (`0.70`), soft subsurface-like ambient lighting, color-coded by embryological tissue origin.
  - **Clinical Atlas (Realistic/Medical Diagram):** Anatomic skin and mucosal tones, shared-geometry inverted-hull line-art ink contours, and depth scale ruler.
- **Interactive Controls:**
  - 0–100% interactive timeline scrubber with auto-dwell at anatomical milestones.
  - Discrete stage jump buttons with GSAP easing (`Week 7 Bipotential`, `Female Homology`, `Male Homology`).
  - Cross-stage persistent homology highlighting (pulsing emissive glow across homologous structures).
  - Physiological response simulation (vasocongestion, tumescence, and erection morphs).
  - 3D screen-projected leader lines and dynamic anatomical label badges.
  - Collapsible clinical side panel with endocrine cascade details (*SRY*, testosterone, 5α-reductase, DHT) and clinical pathology correlates (Hypospadias, AIS, 5α-RD, CAH).
  - Keyboard shortcuts (`Space` to Play/Pause, `1`/`2`/`3` for Stage jumps, `S` for Style toggle, `L` for Labels).
- **Automated Quality & Clearance Verification:**
  - Headless Node validation suite (`tools/check-clearance.mjs`) verifying organ clearance against thighs and pelvic floor across 21 developmental and arousal scenarios.

---

## 🛠️ Technology Stack

- **Core:** Pure HTML5, Vanilla JavaScript (ES6+), and Vanilla CSS (Modern dark-mode medical laboratory theme with frosted glassmorphism).
- **3D Graphics:** [Three.js (r128)](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) and `OrbitControls.js`.
- **Motion & Tweening:** [GSAP 3](https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js).
- **Modular Architecture:** Clean ES module separation for internationalization (`i18n/`), mathematical morphing profiles (`params/`, `math/`), procedural meshes (`mesh/`), and UI controllers (`ui/`), with dedicated stylesheet (`css/style.css`).
- **Zero Build Step:** Native browser ES modules running directly on GitHub Pages or any static web server without bundlers or compilers.

---

## 🚀 Running Locally

Simply open `index.html` in any modern web browser, or serve it using Python:

```bash
# Clone the repository
git clone git@github.com:lightkuriboh/educational-animations.git
cd educational-animations

# Start a local static server
python3 -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

---

## 📚 References & Medical Textbooks

- Langman, J., & Sadler, T. W. *Langman's Medical Embryology*. Wolters Kluwer.
- Moore, K. L., Persaud, T. V. N., & Torchia, M. G. *The Developing Human: Clinically Oriented Embryology*. Elsevier.
- Netter, F. H. *Atlas of Human Anatomy*. Elsevier.
