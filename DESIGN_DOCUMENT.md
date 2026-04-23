# Suzhou Dialect — Expanded Design Document
**For: `index.html` — Engineers' Implementation Blueprint**
*Version 1.1 — April 2026*

---

## 0. How to Read This Document

This document specifies every section of the expanded page — layout, content, data, interactions, and component contracts. Each section is numbered to match the final DOM order. Sections marked **[EXISTS]** are already in the current `index.html`; sections marked **[NEW]** must be built. Sections marked **[EXPAND]** exist but require significant new content.

Where applicable, the exact CSS class names from the existing design system are referenced. New components follow the same naming conventions.

---

## 1. Design System Reference

### 1.1 CSS Custom Properties (no changes)

```css
--bg:           #F7F4EF   /* warm off-white page background */
--text-primary: #1C1C1C
--text-secondary: #6B6B6B
--accent:       #5B8A7D   /* teal-green — primary brand color */
--accent-light: #8AADA7
--dark-bg:      #1A1E1D   /* near-black — landing, closing, mobile nav */
--divider:      #D4CFC8
--warm-text:    #E8E3DA   /* text on dark backgrounds */
--muted-label:  #8A9E99
--amber:        #C4954A   /* warning, tech badges */
--white:        #FFFFFF
--font-zh:      "Noto Serif SC", "Source Han Serif SC", serif
--font-en:      "Inter", "Helvetica Neue", sans-serif
```

### 1.2 New CSS Custom Properties to Add

```css
--danger:       #C0392B   /* conflict, failure indicators */
--purple:       #9B59B6   /* policy badges */
--blue:         #2980B9   /* community badges */
--green:        #27AE60   /* success/positive states */
--track-a-bg:   #F2F4F7
--track-b-bg:   #F7F4EF
```

### 1.3 Typography Scale

| Class | Font | Size | Weight | Use |
|---|---|---|---|---|
| `.a-eyebrow` | Inter | 11px | 700 | Section label, uppercase, 0.15em tracking |
| `.a-header-lg` | Inter | 28px | 600 | Major section titles |
| `.a-header-md` | Inter | 22px | 600 | Subsection titles |
| `.a-header-sm` | Inter | 18px | 600 | Component titles |
| `.a-body` | Inter | 16px | 400 | Primary body text |
| `.a-body-sm` | Inter | 14px | 400 | Secondary body, captions |
| `.b-eyebrow` | Noto Serif SC | 13px | 400 | ZH section label, 0.12em tracking |
| `.section-header-zh` | Noto Serif SC | 28px | 500 | ZH major section titles |
| `.section-header-zh-sm` | Noto Serif SC | 22px | 500 | ZH subsection titles |

### 1.4 Badge System

| Class | Background | Color | Use |
|---|---|---|---|
| `.tl-badge.policy` | `#F3EAF9` | `#9B59B6` | Government policy events |
| `.tl-badge.tech` | `#FBF3E7` | `var(--amber)` | Technology milestones |
| `.tl-badge.community` | `#EAF2FB` | `#2980B9` | Community projects |
| `.tl-badge.research` | `#EAF3F1` | `var(--accent)` | Academic/research |
| `.tl-badge.danger` | `#FDECEA` | `#C0392B` | Failure/decline events |

### 1.5 Language-Aware Visibility Pattern

All bilingual sections follow this convention:
- ZH content: `class="lang-zh"` → hidden when `body.show-en`
- EN content: `class="lang-en"` → hidden when `body.show-zh`
- Shared content: no lang class → always visible

CSS rule (already exists, extend to new sections):
```css
body.show-en .lang-zh { display: none; }
body.show-zh .lang-en { display: none; }
```

---

## 2. Page Structure — DOM Order

```
#lang-toggle                          [EXISTS] fixed top-right
#landing                              [EXISTS] dark hero
#who-should-care                      [BUILT] audience entry-point section
#background-video                     [NEW → see §3.5] full-width video primer
#split-transition                     [EXISTS] gradient band
#main-content                         [EXISTS] 2-col split
  #track-b (ZH)
    B1  Personal Stakes               [EXISTS]
    B2  Three Generations             [EXISTS]
    B2b Linguistic Portrait           [EXPAND → see §5]
    B2c Phonology Deep-Dive           [NEW → see §6]
    B3  Why Teaching Doesn't Work     [EXISTS]
    B3b Wicked Problem Paradigm       [EXISTS]
    B4  CTAs                          [EXISTS]
  #track-a (EN)
    A1  The Contradiction             [EXISTS]
    A1b Linguistic Portrait           [EXPAND → see §5]
    A1c Phonology Deep-Dive           [NEW → see §6]
    A2  Wicked Problem Mapping        [EXPAND → see §9]
    A2b Wicked Problem Paradigm       [EXISTS]
    A2c Stakeholder Conflict Map      [NEW → see §10]
    A3  Dot Visualization             [EXISTS]
    A3b Technology Landscape          [NEW → see §11]
    A4  CTAs                          [EXISTS]
#timeline                             [EXPAND → see §12]
#demographic-viz                      [NEW → see §7]
#cases                                [NEW → see §13]
#solutions-matrix                     [NEW → see §14]
#takehome                             [EXISTS]
#portals                              [EXISTS]
#closing                              [EXISTS]
#mobile-nav                           [EXISTS]
```

---

## 3. Landing Section `#landing` [EXISTS — minor tweak]

**No structural changes.** One addition: after the scroll indicator, append a hidden `<audio>` element for the real landing audio:

```html
<audio id="landing-audio" preload="none">
  <!-- src to be supplied by content team: a ~6 second Suzhou dialect clip
       of the phrase "侬来白相" (nóng lái bá siang — "come have fun") -->
  <source src="audio/landing-phrase.mp3" type="audio/mpeg">
</audio>
```

**JS contract:** The existing `waveformWrapper` click handler should attempt to play `#landing-audio`. If audio is unavailable (404 / user denies permission), fall back to the existing animated waveform silently. No error UI shown to user.

---

## 3.5 Background Video Section `#background-video` [NEW]

**Placement:** Between `#landing` and `#split-transition` — after the dark hero, before the bilingual content begins.

**Rationale:** The page currently opens with a waveform animation and immediately descends into linguistic terminology. Readers — particularly those without prior familiarity with Suzhounese — have no sensory anchor. The professor is right: a short video provides the "why should I care" emotional foundation *before* the analytical content. Hearing Suzhounese spoken, seeing the canal streets and a Pingtan performer mid-phrase, costs the reader 2 minutes and pays back comprehension of everything that follows.

### 3.5.1 Section Layout

```html
<section id="background-video" aria-label="Background: what is Suzhounese?">
  <div class="bgvid-inner">

    <!-- Left: video player -->
    <div class="bgvid-player-col">
      <div class="bgvid-player-wrapper">
        <video
          id="bgvid-player"
          class="bgvid-video"
          poster="video/background-poster.jpg"
          preload="none"
          playsinline
          aria-label="Background video: Suzhounese — the language and its world"
        >
          <source src="video/background.mp4" type="video/mp4">
          <track
            kind="subtitles" srclang="en" label="English"
            src="video/background-en.vtt" default>
          <track
            kind="subtitles" srclang="zh" label="中文"
            src="video/background-zh.vtt">
        </video>

        <!-- Custom play overlay (hidden once played) -->
        <div class="bgvid-overlay" id="bgvid-overlay" role="button"
             tabindex="0" aria-label="Play video"
             onclick="playBgVid()" onkeydown="if(event.key==='Enter')playBgVid()">
          <div class="bgvid-play-btn" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke="white" stroke-width="1.5" opacity="0.7"/>
              <polygon points="19,14 38,24 19,34" fill="white"/>
            </svg>
          </div>
          <p class="bgvid-overlay-label lang-en">Watch: 2 min background</p>
          <p class="bgvid-overlay-label lang-zh" style="font-family:var(--font-zh);">观看：2分钟背景介绍</p>
        </div>

        <!-- Duration badge -->
        <div class="bgvid-duration" aria-hidden="true">2:30</div>
      </div>
    </div>

    <!-- Right: text orientation -->
    <div class="bgvid-text-col">
      <p class="a-eyebrow lang-en">BEFORE YOU READ</p>
      <p class="b-eyebrow lang-zh">阅读前，先听一听</p>

      <h2 class="bgvid-title lang-en">What does Suzhounese sound like?</h2>
      <h2 class="bgvid-title-zh lang-zh">苏州话是什么声音？</h2>

      <p class="bgvid-desc lang-en">
        A two-minute primer. You'll hear the dialect spoken naturally by a native
        speaker, see the Pingtan performance tradition it anchors, and understand
        — before the linguistics — why people who grew up with this language
        describe its loss as something that cannot be undone.
      </p>
      <p class="bgvid-desc-zh lang-zh" style="font-family:var(--font-zh);">
        两分钟入门。你将听到母语者自然说话的声音，看到苏州话所承载的评弹表演传统，在进入语言学分析之前，先感受到——为什么从小听着这门语言长大的人，都说它的消失是一件无法弥补的事。
      </p>

      <!-- Chapter markers — static list matching video timestamps -->
      <ul class="bgvid-chapters" aria-label="Video chapters">
        <li class="bgvid-chapter" data-time="0">
          <span class="bgvid-chapter-time">0:00</span>
          <span class="bgvid-chapter-label lang-en">The sound of Suzhounese</span>
          <span class="bgvid-chapter-label lang-zh" style="font-family:var(--font-zh);">苏州话的声音</span>
        </li>
        <li class="bgvid-chapter" data-time="40">
          <span class="bgvid-chapter-time">0:40</span>
          <span class="bgvid-chapter-label lang-en">Pingtan: the art form that depends on it</span>
          <span class="bgvid-chapter-label lang-zh" style="font-family:var(--font-zh);">评弹：依赖苏州话而存在的艺术</span>
        </li>
        <li class="bgvid-chapter" data-time="95">
          <span class="bgvid-chapter-time">1:35</span>
          <span class="bgvid-chapter-label lang-en">Three generations, one sentence</span>
          <span class="bgvid-chapter-label lang-zh" style="font-family:var(--font-zh);">三代人，一句话</span>
        </li>
        <li class="bgvid-chapter" data-time="140">
          <span class="bgvid-chapter-time">2:20</span>
          <span class="bgvid-chapter-label lang-en">What disappears with the language</span>
          <span class="bgvid-chapter-label lang-zh" style="font-family:var(--font-zh);">语言消失，带走的是什么</span>
        </li>
      </ul>

      <p class="bgvid-skip lang-en">
        <button class="btn-text-en" onclick="document.getElementById('split-transition').scrollIntoView({behavior:'smooth'})">
          Skip to the article ↓
        </button>
      </p>
      <p class="bgvid-skip lang-zh">
        <button class="btn-text-zh" onclick="document.getElementById('split-transition').scrollIntoView({behavior:'smooth'})">
          直接跳到正文 ↓
        </button>
      </p>
    </div>

  </div>
</section>
```

### 3.5.2 Styles

```css
/* ============================================================
   BACKGROUND VIDEO SECTION
============================================================ */
#background-video {
  background: var(--dark-bg);
  padding: 0;                     /* flush against landing */
  border-bottom: 1px solid #2C3330;
}

.bgvid-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 56px 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}

/* Player column */
.bgvid-player-col { position: relative; }

.bgvid-player-wrapper {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #0D1110;
  aspect-ratio: 16 / 9;           /* maintains ratio before video loads */
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

.bgvid-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bgvid-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  background: rgba(10,14,13,0.45);
  transition: background 0.25s;
}

.bgvid-overlay:hover { background: rgba(10,14,13,0.25); }

.bgvid-overlay.hidden { display: none; }

.bgvid-play-btn {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.bgvid-overlay:hover .bgvid-play-btn { transform: scale(1.1); }

.bgvid-overlay-label {
  font-family: var(--font-en);
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.06em;
}

.bgvid-duration {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-family: var(--font-en);
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  background: rgba(0,0,0,0.5);
  padding: 2px 6px;
  border-radius: 3px;
  pointer-events: none;
}

/* Text column */
.bgvid-title {
  font-family: var(--font-en);
  font-size: 26px;
  font-weight: 600;
  color: var(--warm-text);
  line-height: 1.3;
  margin-bottom: 16px;
}

.bgvid-title-zh {
  font-family: var(--font-zh);
  font-size: 24px;
  font-weight: 500;
  color: var(--warm-text);
  line-height: 1.6;
  margin-bottom: 16px;
}

.bgvid-desc {
  font-family: var(--font-en);
  font-size: 15px;
  color: #A8B8B4;
  line-height: 1.8;
  margin-bottom: 28px;
}

.bgvid-desc-zh {
  font-size: 15px;
  color: #A8B8B4;
  line-height: 1.9;
  margin-bottom: 28px;
}

/* Chapter markers */
.bgvid-chapters {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 24px;
}

.bgvid-chapter {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s;
}

.bgvid-chapter:hover { background: rgba(91,138,125,0.15); }

.bgvid-chapter-time {
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: var(--muted-label);
  flex-shrink: 0;
  width: 32px;
}

.bgvid-chapter-label {
  font-family: var(--font-en);
  font-size: 13px;
  color: #A8B8B4;
  line-height: 1.5;
  transition: color 0.15s;
}

.bgvid-chapter:hover .bgvid-chapter-label { color: var(--accent-light); }

.bgvid-chapter.active .bgvid-chapter-time { color: var(--accent); }
.bgvid-chapter.active .bgvid-chapter-label { color: var(--warm-text); font-weight: 500; }

.bgvid-skip { margin-top: 4px; }

/* Responsive */
@media (max-width: 900px) {
  .bgvid-inner {
    grid-template-columns: 1fr;
    padding: 40px 20px;
    gap: 32px;
  }
}
```

### 3.5.3 JavaScript Contract

```javascript
function playBgVid() {
  const video   = document.getElementById('bgvid-player');
  const overlay = document.getElementById('bgvid-overlay');
  video.play();
  overlay.classList.add('hidden');
}

// Chapter click-to-seek
document.querySelectorAll('.bgvid-chapter').forEach(ch => {
  ch.addEventListener('click', () => {
    const video = document.getElementById('bgvid-player');
    video.currentTime = parseFloat(ch.dataset.time);
    if (video.paused) playBgVid();
  });
});

// Active chapter highlight as video plays
const bgvid = document.getElementById('bgvid-player');
const chapters = [...document.querySelectorAll('.bgvid-chapter')];
const chapterTimes = chapters.map(c => parseFloat(c.dataset.time));

bgvid?.addEventListener('timeupdate', () => {
  const t = bgvid.currentTime;
  // Find the last chapter whose timestamp is <= current time
  let active = 0;
  chapterTimes.forEach((ts, i) => { if (t >= ts) active = i; });
  chapters.forEach((c, i) => c.classList.toggle('active', i === active));
});
```

### 3.5.4 Video Content Brief (for content team)

**Duration:** 2:30–2:45. Do not exceed 3 minutes.

**Structure:**

| Timestamp | Shot | Audio |
|---|---|---|
| 0:00–0:10 | Aerial or canal-level shot of Pingjiang Historic District at dawn | Ambient sound: water, distant voices |
| 0:10–0:40 | Close-up of elderly woman speaking Suzhounese naturally (market or home setting) | Her voice, no narration. Subtitles only. |
| 0:40–1:15 | Pingtan performer (female, traditional dress) playing pipa, singing | Live performance audio. Subtitle: "Pingtan — a 400-year-old art form. It can only be performed in Suzhounese." |
| 1:15–1:35 | Three-panel split or sequential cuts: grandmother → parent → child, each asked to say the same phrase ("侬来白相" / "come visit") | Shows the generational degradation in real time |
| 1:35–2:10 | Street scenes: market (dialect audible), office building lobby (Mandarin audible). No narration. | Ambient audio contrast |
| 2:10–2:30 | Return to the opening canal shot. One line of title card. | Narration or title card: "When a language disappears, it takes its world with it." / ZH: "一门语言消失，它带走的是一整个世界。" |

**Tone:** Documentary. Warm, not mournful. The goal is wonder and attachment, not guilt.

**Subtitles:** All Suzhounese speech must be subtitled in both English and Chinese. Provide `.vtt` files in both languages. File naming: `video/background-en.vtt`, `video/background-zh.vtt`.

**Poster image:** A still from the Pingjiang canal shot. File: `video/background-poster.jpg`. Minimum 1280×720px.

**Fallback:** If video is unavailable (e.g., offline, unsupported), the section collapses gracefully — the `.bgvid-player-wrapper` shows only the poster image with no play button, and a `<noscript>`-adjacent text fallback reads: "Video unavailable. Continue to the article below."

```html
<!-- Add inside .bgvid-player-wrapper, after the <video> element -->
<div class="bgvid-no-video" id="bgvid-fallback" style="display:none;">
  <p class="lang-en" style="color:var(--muted-label);font-size:13px;text-align:center;padding:20px;">
    Video unavailable — continue to the article below.
  </p>
  <p class="lang-zh" style="font-family:var(--font-zh);color:var(--muted-label);font-size:13px;text-align:center;padding:20px;">
    视频暂时无法加载——请继续阅读正文。
  </p>
</div>
```

```javascript
// Detect video load failure
document.getElementById('bgvid-player')
  ?.addEventListener('error', () => {
    document.getElementById('bgvid-overlay').style.display  = 'none';
    document.getElementById('bgvid-fallback').style.display = 'flex';
  });
```

---

## 4. Main Content Split `#main-content` [EXISTS]

The 1fr 1px 1fr grid and all existing sections are preserved exactly as-is. New Track B and Track A sections are **appended** in the order shown in §2, before the existing B4/A4 CTA sections.

---

## 5. Linguistic Portrait Expansion [EXPAND — B2b / A1b]

### 5.1 Current State
Three feature cards: Tone System, Tone Sandhi, Voiced Consonants.

### 5.2 Expansion: Add Two Cards

Add to the existing `.feature-cards` grid (making it 5 cards total — grid auto-wraps to 3+2):

#### Card 4 — Vowel Inventory (ZH: 元音系统 / EN: Vowel Inventory)

**EN content:**
- Title: "Richer Vowels than Mandarin"
- Body: "Suzhounese includes rounded front mid vowels like /ø/ — sounds absent from Mandarin entirely. These are the same vowel sounds found in French 'feu' or German 'schön'."
- Visual: A small phonetic vowel chart (SVG) showing IPA vowel space. Mark /ø/ and /y/ in teal. Mark Mandarin-only vowels in grey. See §5.3 for SVG spec.

**ZH content:**
- Title: "比普通话更丰富的元音系统"
- Body: "苏州话包含普通话中完全没有的圆唇前中元音，如/ø/，与法语"feu"中的发音相似，展现了吴语保留古汉语特征的独特性。"

#### Card 5 — Connection to Literary Heritage (ZH: 文学传承 / EN: Literary Heritage)

**EN content:**
- Title: "Foundation of Two UNESCO Arts"
- Body: "Kunqu opera (UNESCO 2001) and Pingtan storytelling were built on Suzhou phonology. Wei Liangfu explicitly chose Suzhou accent as Kunqu's phonological standard in the Ming dynasty."
- Tags (using existing `.cause-tag` style): `Kunqu 昆曲` · `Pingtan 评弹` · `UNESCO 2001`

**ZH content:**
- Title: "昆曲与评弹的音韵根基"
- Body: "明代音乐家魏良辅以苏州方言腔调为基础创制了昆山腔，成为昆曲的标准音。评弹至今必须用苏州话演出——换了语言，艺术便不复存在。"
- Tags: `昆曲` · `评弹` · `非物质文化遗产`

### 5.3 Vowel Chart SVG Spec

The SVG is a simplified IPA vowel trapezoid, 120×80px.

```
Corners: top-left = front-high, top-right = back-high
         bottom-left = front-low, bottom-right = back-low

Vowels to plot (approximate x,y in SVG coords):
  /i/  (front-high)    → x:10, y:10    fill: #C8D8D5 (Mandarin has this)
  /y/  (front-high, rounded) → x:10, y:22   fill: #5B8A7D (Wu-distinctive)
  /u/  (back-high)     → x:110, y:10   fill: #C8D8D5
  /e/  (front-mid)     → x:15, y:45    fill: #C8D8D5
  /ø/  (front-mid, rounded) → x:15, y:57   fill: #5B8A7D (Wu-distinctive)
  /o/  (back-mid)      → x:105, y:45   fill: #C8D8D5
  /a/  (front-low)     → x:20, y:75    fill: #C8D8D5

Legend: teal circle = Wu-distinctive; grey = shared with Mandarin
```

Render as inline SVG within the feature card. No JS required.

---

## 6. Phonology Deep-Dive Section [NEW — B2c / A1c]

**Placement:** Immediately after the Linguistic Portrait section, still within `#track-b` and `#track-a` respectively.

**Purpose:** Give readers who want more phonological depth a structured, scannable presentation of all major features. This is the "go deeper" section for curious users; it should be collapsible.

### 6.1 Layout

```html
<section class="track-b-section phonology-section" id="phonology-zh">
  <details class="phonology-details">
    <summary class="phonology-summary">
      <span class="b-eyebrow">深度解析</span>
      <span class="section-header-zh-sm">苏州话的完整音系</span>
      <span class="expand-icon">▼</span>
    </summary>
    <!-- content -->
  </details>
</section>
```

The `<details>/<summary>` approach gives free collapse behavior with zero JS.

### 6.2 Tone Chart Subsection

**Component: `.tone-full-chart`**

A 2-row grid displaying all 7 tones as mini SVG contour diagrams.

```
Layout: 4 columns × 2 rows (first 4 tones + then 3 remaining)
Each cell:
  - SVG (40×40px) showing pitch contour as a bezier curve
  - Tone name in ZH (阴平/阳平/阴上/阳上/阴去/阳去/入声)
  - Tone number (T1–T7)
  - Example character in ZH
  - Register badge: "HIGH" (teal) or "LOW" (grey)
```

**SVG Contour Specs (approximate pitch level 1=low, 5=high):**

| Tone | Name ZH | Name EN | Contour | Phonation |
|---|---|---|---|---|
| T1 | 阴平 | Yin Ping | 44 (high level) | Modal |
| T2 | 阳平 | Yang Ping | 224 (low rising) | Breathy |
| T3 | 阴上 | Yin Shang | 52 (high falling) | Modal |
| T4 | 阳上 | Yang Shang | 231 (low dipping) | Breathy |
| T5 | 阴去 | Yin Qu | 412 (mid falling) | Modal |
| T6 | 阳去 | Yang Qu | 11 (low level) | Breathy |
| T7 | 入声 | Ru Sheng | 5ʔ (high checked) | Modal + glottal stop |

Draw each contour as a polyline within a 5-line staff (like musical notation). Use `stroke: var(--accent)` for high-register tones, `stroke: #8AADA7` for low-register.

### 6.3 Voiced Consonants Comparison Table

**Component: `.voiced-comparison-table`**

```
A 3-column table comparing:
Col 1: Consonant type
Col 2: Suzhounese (has it) — teal checkmark + IPA symbol
Col 3: Mandarin (lacks it) — grey ✗

Rows:
  Voiced stops:     /b/ /d/ /g/
  Voiced fricatives: /v/ /z/ /ʑ/ /ɦ/
  Voiced affricates: /dz/ /dʑ/

Footer note: "These are inherited from Middle Chinese (中古汉语),
lost in Mandarin ~900 years ago."
```

### 6.4 Sandhi Domain Visualizer

**Component: `.sandhi-chain`**

An animated (CSS-only, no JS) illustration of how the first syllable's tone propagates through a phrase.

```
Three phrases, each shown as a chain of syllable boxes:
  Phrase 1: 苏州话 (3 syllables) — show tone propagation from T1 onset
  Phrase 2: 你好吗 (3 syllables) — show tone propagation from T2 onset
  Phrase 3: 来吃饭 (3 syllables) — show tone propagation from T6 onset

Each syllable box:
  - Character
  - Isolated tone (small, grey)
  - Arrow → (indicating tone influence direction)
  - Realized tone in context (teal, bold)

Static representation is acceptable; animation is a stretch goal.
```

### 6.5 EN Track Mirror

The English track version (`#phonology-en`, inside `#track-a`) mirrors the above with all text in English. Same components, same SVG specs. The `<details>` summary reads:
- Eyebrow: "DEEP DIVE"
- Header: "The Complete Phonological System"

---

## 7. Demographic Visualization Section [NEW — standalone full-width]

**Placement:** After `#main-content`, before `#timeline`.
**ID:** `#demographic-viz`
**Background:** `var(--bg)` (same as page)

### 7.1 Section Header

```html
<div class="section-header-band">
  <div class="lang-zh">
    <span class="timeline-heading-zh">语言衰退</span>
    <h2 class="timeline-title-zh">数字告诉我们什么</h2>
  </div>
  <div class="lang-en">
    <span class="timeline-heading">THE NUMBERS</span>
    <h2 class="timeline-title-en">What the Data Shows</h2>
  </div>
</div>
```

### 7.2 Fluency Decline Chart

**Component: `.decline-chart`**

A pure CSS bar chart (no JS library, no canvas). Four vertical bars representing four data points.

```
Data:
  1984: ~95%   bar-color: var(--accent)     full height
  2008: ~8%    bar-color: var(--accent-light)
  2014: ~4%    bar-color: #B8CEC8
  2024: ~2.2%  bar-color: #D8E4E2          nearly empty

Layout:
  - Container: max-width 600px, margin: 0 auto
  - Each bar: fixed width 80px, variable height (percentage of 200px max)
  - Year label below bar
  - Percentage label above bar
  - Baseline axis line in var(--divider)

Annotation arrows (CSS absolute positioning):
  → Between 1984 and 2008: "One generation. 95% → 8%."
  → Between 2008 and 2024: "Now: ~2% of teenagers"

ZH annotations:
  → "一代人。95% → 8%。"
  → "如今：仅约2%的青少年能流利使用苏州话"
```

### 7.3 Domain Attrition Heatmap

**Purpose:** Show that the dialect retreats domain-by-domain, not uniformly.

**Component: `.domain-heatmap`**

A grid where rows = speaker generations (三代 / 二代 / 新生代), columns = life domains.

```
Columns (domains):
  家庭 / Home
  菜市场 / Market
  邻居 / Neighbors
  工作场所 / Workplace
  学校 / School
  网络 / Digital

Color scale:
  #5B8A7D  = Frequent use (dark teal)
  #8AADA7  = Occasional use
  #B8CEC8  = Rare use
  #E4EAF0  = Essentially absent

Data (approximate, based on research):

              Home    Market  Neighbors  Work    School  Digital
Gen 1 (60+)  ████    ████    ████       ██      ░       ░
Gen 2 (30s)  ██      ███     ██         ░       ░       ░
Gen 3 (teens) ░       ░       ░          ░       ░       ░

Legend: 4-stop color scale + caption
```

HTML structure:
```html
<div class="domain-heatmap">
  <div class="heatmap-header">
    <div class="heatmap-corner"></div>
    <div class="heatmap-col-label lang-zh">家庭</div>
    <div class="heatmap-col-label lang-zh">菜市场</div>
    <!-- etc -->
    <div class="heatmap-col-label lang-en">Home</div>
    <!-- etc -->
  </div>
  <div class="heatmap-row">
    <div class="heatmap-row-label lang-zh">长辈 (60+)</div>
    <div class="heatmap-cell" data-level="4" title="Frequent use"></div>
    <!-- etc -->
  </div>
  <!-- rows for Gen 2, Gen 3 -->
</div>
```

CSS: `data-level` attribute drives background-color via attribute selectors:
```css
.heatmap-cell[data-level="4"] { background: var(--accent); }
.heatmap-cell[data-level="3"] { background: var(--accent-light); }
.heatmap-cell[data-level="2"] { background: #B8CEC8; }
.heatmap-cell[data-level="1"] { background: #D8E4E2; }
.heatmap-cell[data-level="0"] { background: #EDEAE4; border: 1px solid var(--divider); }
```

### 7.4 Geographic Note (Text Component)

A text callout beneath the charts noting:
- EN: "By 2012, migrants outnumbered native Suzhou residents. The dialect's geographic 'home' now belongs to a minority."
- ZH: "2012年起，外来人口数量已超过苏州本地户籍人口。方言在自己的'故乡'成了少数。"

**Component:** `.stat-callout` — centered box, `border-left: 4px solid var(--amber)`, italic, max-width 560px.

---

## 8. Timeline Section `#timeline` [EXPAND]

### 8.1 Current State
Vertical timeline with entries. Both ZH/EN language versions. Category badges: policy, tech, community, research.

### 8.2 New Entries to Add

Add in chronological order within the existing timeline structure. Use the existing `.tl-item` component.

#### New Entry: 1956 [policy]
- **Label EN:** "Putonghua Declared National Standard"
- **Label ZH:** "普通话正式确立为国家标准语言"
- **Desc EN:** "The PRC government designates Beijing pronunciation as national standard. Mandatory use in schools and broadcasting begins. Suzhou dialect begins its institutional marginalization."
- **Desc ZH:** "中华人民共和国政府将北京话定为全国推广的普通话。学校和广播中开始强制使用普通话，苏州话的制度性衰退从此开始。"
- **Badge:** policy

#### New Entry: 1969 [research]
- **Label EN:** "First Proto-Wu Reconstruction (Ballard)"
- **Label ZH:** "吴语原始语音的首次重构"
- **Desc EN:** "William Harvey Ballard publishes the first academic reconstruction of Proto-Wu, establishing Suzhou as a central reference point for Wu linguistic history."
- **Desc ZH:** "威廉·哈维·巴拉德发表首个吴语原始音系重构，苏州话成为吴语历史语言学的核心参照。"
- **Badge:** research

#### New Entry: 1973 [research]
- **Label EN:** "Rittel & Webber: 'Wicked Problems' Framework"
- **Label ZH:** "里特尔与韦伯提出"棘手难题"理论框架"
- **Desc EN:** "Policy Sciences journal publishes the seminal framework that will, decades later, explain precisely why dialect preservation resists solution."
- **Desc ZH:** "《政策科学》杂志发表奠基性论文，为数十年后我们理解方言保护困境提供了精准的理论框架。"
- **Badge:** research

#### New Entry: 1984 [research] (milestone)
- **Label EN:** "Peak: ~95% of Suzhou Youth Speak the Dialect"
- **Label ZH:** "高峰：约95%的苏州青少年能流利使用苏州话"
- **Desc EN:** "Last documented baseline before accelerated decline. Within one generation, this figure will fall to 8%."
- **Desc ZH:** "语言衰退加速前的最后一次文献记录基线。一代人之内，这一比例将跌至8%。"
- **Badge:** research (use `.tl-item.milestone`)

#### New Entry: 2001 [policy] (milestone)
- **Label EN:** "Kunqu Opera: UNESCO Masterpiece"
- **Label ZH:** "昆曲列入联合国教科文组织非遗名录"
- **Desc EN:** "UNESCO recognizes Kunqu as 'Masterpiece of the Oral and Intangible Heritage of Humanity.' The art form's phonological dependence on Suzhou dialect is formally acknowledged internationally."
- **Desc ZH:** "联合国教科文组织将昆曲列为"人类口述和非物质遗产代表作"，昆曲在音韵上对苏州话的依赖首次获得国际正式认可。"
- **Badge:** policy (milestone)

#### New Entry: 2006–2007 [research]
- **Label EN:** "Linguistic Atlas of Chinese Dialects: 930 Sites"
- **Label ZH:** "《中国语言地图集》：930个调查点"
- **Desc EN:** "The most comprehensive dialect survey in Chinese history. Wu varieties surveyed across 3 volumes with 510 maps. Produces baseline data that all subsequent preservation work references."
- **Desc ZH:** "中国历史上最全面的方言调查，吴语以510幅方言地图记录于三卷本中，成为后续保护工作的核心参照数据。"
- **Badge:** research

#### New Entry: 2008 [danger] — use new badge type
- **Label EN:** "Fluency Collapses: 95% → 8% Among Youth"
- **Label ZH:** "流利度崩塌：青少年中从95%跌至8%"
- **Desc EN:** "Research documents the sharpest intergenerational decline on record. One generation separates near-universal fluency from near-extinction among the young."
- **Desc ZH:** "研究记录了有史以来最剧烈的代际断层——仅仅一代人，苏州话便从几乎全民流利变为年轻人中几近消亡。"
- **Badge:** `.tl-badge.danger` (new badge type — see §1.4)

Add danger badge CSS:
```css
.tl-item.danger::before  { border-color: #C0392B; background: #C0392B; }
.tl-badge.danger { background: #FDECEA; color: #C0392B; }
```

#### New Entry: 2010 [community]
- **Label EN:** "Guangdong Protests: Thousands Defend Cantonese"
- **Label ZH:** "广东数千人抗议：粤语保卫战"
- **Desc EN:** "Cantonese speakers successfully resist Putonghua-only broadcasting mandate. Signals that dialect communities can exercise political agency — and that Suzhou has no comparable mobilization capacity."
- **Desc ZH:** "粤语使用者成功抵制普通话独播提案，表明方言社区可以发挥政治行动力——同时也揭示苏州话社区在这方面几乎没有类似的动员能力。"
- **Badge:** community

#### New Entry: 2015 [policy + tech]
- **Label EN:** "Ministry of Education: 10M-Entry Dialect Archive Launched"
- **Label ZH:** "教育部启动：千万条目方言档案项目"
- **Desc EN:** "China's largest government dialect documentation project. Eventually covers 123 dialects. Comprehensive but archival — does not create living transmission."
- **Desc ZH:** "中国规模最大的政府方言文献项目，最终覆盖123种方言。资料详尽，但仍属档案性质——无法直接推动语言的活态传承。"
- **Badge:** policy + tech (show both badges)

#### New Entry: 2024 [tech]
- **Label EN:** "Bailing-TTS: Dialectal Speech Synthesis"
- **Label ZH:** "百灵TTS：方言语音合成系统"
- **Desc EN:** "First publicly documented TTS system with multi-dialect Chinese support. Suzhou not included. Demonstrates both the technical feasibility and the gap that remains for Wu."
- **Desc ZH:** "首个有公开文献的多方言中文语音合成系统，但未涵盖苏州话——既展示了技术可行性，也揭示了吴语至今尚存的空白。"
- **Badge:** tech

---

## 9. Wicked Problem Mapping Table Expansion [EXPAND — A2]

### 9.1 Current State
Expandable table with 5 rows covering 5 of the 10 Rittel-Webber properties.

### 9.2 Complete 10-Row Table

Replace the current 5-row table with a 10-row version. Preserve all existing rows; add the 5 missing properties. Use the existing `.wicked-table` styles exactly.

**Existing 5 rows (keep as-is):**
1. No Definitive Formulation
2. No Stopping Rule
3. Solutions Are Good-or-Bad, Not True-or-False
4. No Immediate Test of Success
5. One-Shot Operation

**5 New Rows to Add:**

| # | Property Title | Short description (col 2) | Expanded detail (`.detail-row`) |
|---|---|---|---|
| 6 | No Enumerable Solution Set | "School curricula, media production, ASR systems, legislation, diaspora networks — the intervention space has no ceiling." | "Unlike engineering problems with discrete solution spaces, Suzhou dialect preservation has an effectively infinite set of potential interventions: curriculum reform, community centers, TTS development, tourism, WeChat campaigns, documentary film, legal protection, artist residencies, diaspora outreach, and countless combinations. No principled method exists for choosing among them or knowing when enough has been tried." |
| 7 | Essential Uniqueness | "What worked for Cantonese, Hokkien, or Gaelic may fail here. The context is not transferable." | "Suzhou dialect lacks Cantonese's institutional semi-autonomy in Hong Kong, Hokkien's diaspora networks and Taiwan curriculum mandate, Gaelic's EU-framework protections, and Ainu's ethnic-minority legal standing. Every apparently analogous success case differs on the very dimensions that determined its outcome. Imported solutions require such extensive modification that they may no longer be solutions at all." |
| 8 | Multiple Interconnected Causes | "Government policy, economic incentives, urbanization, demographic shift, and parental choice all drive decline simultaneously." | "Six causal streams operate in parallel: (1) Putonghua mandates remove institutional space for dialect; (2) labor markets reward Mandarin and English; (3) migrant demographic influx means dialect speakers are now a minority in Suzhou; (4) social attitudes equate dialect with lower status; (5) parents who speak the dialect actively choose Mandarin for their children; (6) digital platforms are structurally Mandarin-first. Each cause is sufficient to drive decline alone; they are mutually reinforcing." |
| 9 | Solutions Generate New Problems | "Every intervention reshapes the problem in unexpected ways." | "Examples: school programs → produce artificial prescriptive forms; archives → create 'frozen' canonical versions that communities feel pressure to conform to; government support → risks politicizing dialect as managed heritage; crowdsourced recordings → privacy backlash reduces community trust in digital tools; ASR development → requires large corpora which requires resources that could fund direct community programs instead. There is no clean intervention." |
| 10 | Stakeholder Disagreement | "Linguists, community members, government officials, engineers, and educators hold mutually incompatible but internally coherent views." | "Linguists prioritize phonological completeness; communities prioritize living use; government must balance dialect promotion against Putonghua policy; tech companies optimize for data and engagement; educators face curriculum constraints; artists want creative freedom. Each stakeholder's framing of the problem generates a different solution that conflicts with others'. There is no neutral vantage point from which to adjudicate." |

**Expand/collapse JS:** The existing `expandable` row click handler (toggle `.open` on the row, toggle `.visible` on the immediately following `.detail-row`) already works for the new rows with no JS changes needed. Just add `id="detail-6"` through `id="detail-10"` following the existing `detail-1` through `detail-5` pattern.

---

## 10. Stakeholder Conflict Map [NEW — inside #track-a as A2c]

**Placement:** After the wicked problem paradigm cards (A2b), before the dot visualization (A3).

**Purpose:** Give a visual, scannable representation of who wants what and why those goals conflict. This directly serves the "stakeholder disagreement" property.

### 10.1 Component: `.stakeholder-map`

Layout: A centered network diagram represented in pure HTML/CSS (no JS, no canvas).

```
Structure: hub-and-spoke layout
  Central node: "Suzhou Dialect" (teal circle, 80px diameter)
  6 stakeholder nodes surrounding it, evenly spaced
  Lines connecting center to each node

Stakeholders:
  1. Linguists (top)
  2. Community Members (top-right)
  3. Government (right)
  4. Tech Companies (bottom-right)
  5. Educators (bottom-left)
  6. Youth (left)
```

Implementation: Use CSS `position: absolute` with a `position: relative` container. The container is a fixed-size square (e.g. 400×400px on desktop, 280×280px on mobile). Each node is a circle positioned using top/left percentages.

```html
<div class="stakeholder-map-container">
  <div class="sh-center">
    <span class="lang-zh">苏州话</span>
    <span class="lang-en">Suzhou Dialect</span>
  </div>
  <div class="sh-node sh-linguist" data-pos="top">
    <div class="sh-dot"></div>
    <div class="sh-label lang-zh">语言学家</div>
    <div class="sh-label lang-en">Linguists</div>
    <div class="sh-want lang-en">"Complete documentation"</div>
    <div class="sh-want lang-zh">"完整记录"</div>
  </div>
  <!-- 5 more nodes -->
  <!-- SVG connecting lines (absolutely positioned, aria-hidden) -->
</div>
```

### 10.2 Conflict Pairs Below the Map

After the network diagram, a list of 5 specific conflict pairs using the existing `.conflict-pair` component:

```
Linguists vs. Community:
  "Archival completeness" vs. "Living, usable tools"

Community vs. Government:
  "Authentic transmission" vs. "Managed cultural product"

Tech Companies vs. Educators:
  "Data acquisition at scale" vs. "Classroom-appropriate pedagogy"

Government vs. Itself:
  "Putonghua mandate (法律)" vs. "Heritage preservation (政策)"

Youth vs. Parents:
  "Dialect as identity marker" vs. "Mandarin for career advantage"
```

### 10.3 ZH Track Mirror

Chinese version inside `#track-b` as B2d, using the same `.stakeholder-map-container` component but with ZH labels visible and EN labels hidden via the language-aware class pattern.

---

## 11. Technology Landscape Section [NEW — inside #track-a as A3b]

**Placement:** After the dot visualization (A3), before CTAs (A4).

**Purpose:** Give a structured view of the current digital tool ecosystem and its gaps.

### 11.1 Component: `.tech-landscape`

Layout: A status board — 4 rows (ASR / TTS / Corpus / Transcription), each showing current state for Mandarin vs. Cantonese vs. Suzhounese.

```html
<section class="a-section tech-landscape-section">
  <p class="a-eyebrow">TECHNOLOGY LANDSCAPE</p>
  <h2 class="a-header-md">Where the Tools Are — and Where They Aren't</h2>
  <p class="a-body-sm">Current state of digital language technology for Suzhounese compared to better-resourced Chinese varieties.</p>

  <div class="tech-grid">
    <div class="tech-grid-header">
      <div></div>
      <div class="tech-col-label">Mandarin</div>
      <div class="tech-col-label">Cantonese</div>
      <div class="tech-col-label">Suzhounese</div>
    </div>
    <!-- rows -->
  </div>
</section>
```

### 11.2 Tech Grid Data

Each cell gets a `.tech-cell` with a status class:

```
Status classes:
  .status-mature   → background: #EAF3F1, color: var(--accent), label: "Mature"
  .status-partial  → background: #FBF3E7, color: var(--amber),  label: "Partial"
  .status-minimal  → background: #FDECEA, color: #C0392B,       label: "Minimal"
  .status-absent   → background: #F5F5F5, color: #999,          label: "None"
```

| Row | Mandarin | Cantonese | Suzhounese |
|---|---|---|---|
| **ASR** | Mature (Qwen3-ASR, iFlytek) | Partial (SCOLAR, research systems) | None (no production system) |
| **TTS** | Mature (multiple commercial) | Partial (Ekho, research) | None |
| **Speech Corpus** | Mature (thousands of hours) | Partial (limited professional transcription) | Minimal (RASC863 Shanghai component only) |
| **Romanization Standard** | Mature (Hanyu Pinyin, ISO 7098) | Partial (Jyutping, Yale — competing) | None (ad hoc only) |

**Cell content:**
```html
<div class="tech-cell status-absent">
  <span class="tech-status-label">None</span>
  <span class="tech-status-note">No production system exists</span>
</div>
```

### 11.3 Bootstrapping Paradox Callout

After the grid, a styled callout box explaining the chicken-and-egg problem:

```html
<div class="paradox-callout">
  <div class="paradox-icon">⟳</div>
  <div class="paradox-content">
    <h3 class="paradox-title lang-en">The Bootstrapping Paradox</h3>
    <h3 class="paradox-title lang-zh">先有鸡还是先有蛋？</h3>
    <p class="paradox-body lang-en">
      Building an ASR system requires thousands of hours of transcribed speech.
      Transcribing speech at scale requires automated tools.
      The tools require the corpus to train on.
      For Suzhou dialect, neither exists — and neither can exist first.
    </p>
    <p class="paradox-body lang-zh">
      构建语音识别系统需要数千小时的转录语音。大规模转录语音需要自动化工具。工具训练需要语料库。而苏州话的语料库和工具都尚不存在——两者谁都无法先行建立。
    </p>
  </div>
</div>
```

**Styles:**
```css
.paradox-callout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: #FDECEA;
  border: 1px solid #EFC8C4;
  border-radius: 8px;
  padding: 20px 24px;
  margin-top: 24px;
}
.paradox-icon {
  font-size: 24px;
  color: #C0392B;
  flex-shrink: 0;
  padding-top: 2px;
}
.paradox-title {
  font-family: var(--font-en);
  font-size: 15px;
  font-weight: 600;
  color: #C0392B;
  margin-bottom: 6px;
}
.paradox-body {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
}
```

---

## 12. Comparative Cases Section [NEW — standalone full-width]

**Placement:** After `#demographic-viz`, before `#solutions-matrix`.
**ID:** `#cases`
**Background:** `var(--white)` (contrasts with surrounding `var(--bg)` sections)

### 12.1 Section Header

```html
<section id="cases" aria-label="Comparative cases">
  <div class="cases-inner">
    <p class="timeline-heading lang-en">COMPARATIVE CASES</p>
    <p class="timeline-heading-zh lang-zh">比较案例</p>
    <h2 class="timeline-title-en lang-en">Why Other Solutions Don't Simply Transfer</h2>
    <h2 class="timeline-title-zh lang-zh">为什么其他案例的解决方案无法直接移植</h2>
    <p class="a-body-sm lang-en">Three cases that appear instructive — and why the conditions that made them work are absent in Suzhou.</p>
    <p class="a-body-sm lang-zh" style="font-family:var(--font-zh);">三个看似有参考价值的案例——以及使其成功的条件为何在苏州并不存在。</p>
  </div>
</section>
```

### 12.2 Component: `.case-comparison-grid`

Three columns. Each column is a `.case-card`.

```
case-card structure:
  - Header band (colored): language name + emoji flag/icon
  - .case-status badge: "Better positioned" / "Wicked problem too" / "Failed"
  - .case-advantages (list)
  - .case-disadvantages (list)
  - .case-lesson (pull quote)
  - .case-transfer note: what transfers, what doesn't
```

**Card 1 — Cantonese (粤语)**

```
Header color: #EAF2FB (light blue)
Status badge: "Better Positioned, Still Wicked" (amber)

Advantages:
  ✓ ~10M speakers in HK/Macau + large diaspora
  ✓ Political semi-autonomy (Hong Kong)
  ✓ Established written convention (comics, subtitles, internet)
  ✓ SCOLAR ASR keyboard: 20,000+ users
  ✓ Strong community mobilization (2010 protests)

Disadvantages:
  ✗ ASR still behind Mandarin; 9-tone system unsolved
  ✗ Increasing Mandarin pressure post-2020
  ✗ Youth fluency declining in diaspora

Lesson EN: "Scale and political agency help — but cannot fully resolve the wicked structure."
Lesson ZH: "规模和政治自主性有所助益——但仍无法从根本上解开棘手难题的结构。"

What transfers to Suzhou: Community mobilization model; hybrid digital tools approach
What doesn't: Scale, political autonomy, written tradition, diaspora support
```

**Card 2 — Hokkien/Minnan (闽南语)**

```
Header color: #EAF3F1 (light teal)
Status badge: "Institutionally Protected, Still Declining" (research/teal)

Advantages:
  ✓ Taiwan national curriculum mandate (not elective)
  ✓ Government-published standardized character set
  ✓ Astro-HuaDian: 24-hour TV channel in Malaysia
  ✓ Large diaspora (SE Asia, Taiwan)
  ✓ Teacher training programs

Disadvantages:
  ✗ Still declining among young urban speakers
  ✗ Media consumption ≠ productive fluency
  ✗ Taiwanese Hokkien diverging from mainland varieties

Lesson EN: "Curriculum mandate + media infrastructure slows decline but does not reverse it."
Lesson ZH: "课程立法加上媒体基础设施能减缓衰退，但无法逆转。"

What transfers: School curriculum structure; community organization model
What doesn't: Taiwan's political autonomy; diaspora demographic base; media funding
```

**Card 3 — India's Three-Language Formula (失败案例)**

```
Header color: #FDECEA (light red)
Status badge: "Failed" (danger/red)

Context: Policy aimed to mandate regional language instruction nationwide.

Why it failed:
  ✗ No community buy-in; policy seen as government imposition
  ✗ Teachers undertrained; no sustained professional development
  ✗ Parental preference for English overrode policy
  ✗ No cultural prestige created for regional languages
  ✗ No economic incentive for dialect maintenance

Lesson EN: "Policy without economic incentives, community ownership, and teacher capacity is insufficient. It may actively backfire by stigmatizing the mandate."
Lesson ZH: "没有经济激励、社区主导和师资支撑的政策是不够的，甚至可能因强制推行而产生反效果。"

What transfers: What NOT to do — mandate without infrastructure
```

### 12.3 Styles

```css
#cases { padding: 72px 0 64px; background: var(--white); border-top: 1px solid var(--divider); }
.cases-inner { max-width: 1100px; margin: 0 auto; padding: 0 40px; }
.case-comparison-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
@media (max-width: 900px) { .case-comparison-grid { grid-template-columns: 1fr; } }

.case-card { border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
.case-card-header { padding: 20px 20px 14px; }
.case-card-title { font-family: var(--font-en); font-size: 18px; font-weight: 600; color: var(--text-primary); }
.case-card-title-zh { font-family: var(--font-zh); font-size: 18px; font-weight: 500; color: var(--text-primary); }
.case-card-body { padding: 0 20px 20px; }
.case-advantage { font-size: 13px; color: var(--text-secondary); line-height: 1.65; padding: 3px 0; }
.case-advantage::before { content: "✓ "; color: var(--accent); font-weight: 700; }
.case-disadvantage { font-size: 13px; color: var(--text-secondary); line-height: 1.65; padding: 3px 0; }
.case-disadvantage::before { content: "✗ "; color: #C0392B; font-weight: 700; }
.case-lesson { font-size: 14px; font-style: italic; color: var(--text-primary); border-left: 3px solid var(--accent); padding-left: 12px; margin: 14px 0; line-height: 1.7; }
.case-transfer { font-size: 12px; color: var(--text-secondary); margin-top: 10px; background: var(--bg); border-radius: 4px; padding: 8px 12px; }
```

---

## 13. Solutions-Generate-Problems Matrix [NEW — standalone]

**Placement:** After `#cases`, before `#takehome`.
**ID:** `#solutions-matrix`
**Background:** `#EDEAE4` (same as `#takehome` — warm grey, creates visual grouping)

### 13.1 Purpose

This is one of the most intellectually dense sections — it makes Wicked Property 9 ("solutions generate new problems") visceral and concrete. Engineers should render it as a scrollable table.

### 13.2 Component: `.solutions-matrix-table`

```html
<section id="solutions-matrix" aria-label="Solutions and their secondary problems">
  <div class="solutions-inner">
    <p class="timeline-heading lang-en">WICKED PROPERTY 9</p>
    <p class="timeline-heading-zh lang-zh">棘手难题第九条</p>
    <h2 class="timeline-title-en lang-en">Every Solution Reshapes the Problem</h2>
    <h2 class="timeline-title-zh lang-zh">每一个解决方案都会带来新的问题</h2>
    <div class="solutions-table-wrapper">
      <table class="solutions-matrix-table">
        <thead>
          <tr>
            <th class="lang-en">Intervention</th>
            <th class="lang-en">Intended Benefit</th>
            <th class="lang-en">New Problem Generated</th>
            <th class="lang-zh">干预手段</th>
            <th class="lang-zh">预期效果</th>
            <th class="lang-zh">引发的新问题</th>
          </tr>
        </thead>
        <tbody>
          <!-- 7 rows — see data below -->
        </tbody>
      </table>
    </div>
  </div>
</section>
```

### 13.3 Matrix Data

| Intervention EN | Benefit EN | New Problem EN | ZH Intervention | ZH Benefit | ZH Problem |
|---|---|---|---|---|---|
| School dialect programs | Intergenerational transmission | May produce artificial, prescriptive form disconnected from living speech | 学校方言课程 | 代际传承 | 可能产生脱离活态语言的人工规范形式 |
| Government digital archive | Permanent documentation | Creates canonical "frozen" form; communities feel pressure to conform | 政府数字档案 | 永久性文献记录 | 形成"凝固"的规范形式，社区感到须以此为标准 |
| Government funding | Resources for community programs | Risks political co-optation; dialect becomes managed cultural product | 政府资助 | 为社区项目提供资源 | 存在被政治利用的风险，方言变成被管理的文化产品 |
| Community-only volunteer projects | Authentic, community-led | Excludes linguistic expertise; inconsistent quality, unsustainable | 社区志愿者项目 | 真实的社区主导 | 缺乏语言学专业支撑，质量参差不齐，难以持续 |
| ASR/TTS development | Digital tool accessibility | Requires massive corpus → diverts resources from direct community work | 语音识别/语音合成开发 | 数字工具的可及性 | 需要大规模语料库，将资源从直接社区工作中转移 |
| WeChat cashback recording | Large-scale audio collection | Privacy concerns reduce community trust in digital preservation | 微信有偿录音 | 大规模音频采集 | 隐私顾虑降低社区对数字保护工作的信任 |
| Cultural tourism (Pingtan/Kunqu) | Audience, funding, prestige | Performers adapt to tourist expectations; tradition becomes performance-for-outsiders | 文化旅游（评弹/昆曲） | 受众、资金与声誉 | 表演者迎合游客期望，传统变成对外展演 |

### 13.4 Styles

```css
#solutions-matrix { padding: 72px 0 64px; background: #EDEAE4; }
.solutions-inner { max-width: 1100px; margin: 0 auto; padding: 0 40px; }
.solutions-table-wrapper { overflow-x: auto; margin-top: 32px; }

.solutions-matrix-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.solutions-matrix-table thead th {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--text-secondary);
  padding: 10px 14px; border-bottom: 2px solid var(--divider);
  text-align: left; white-space: nowrap;
}
.solutions-matrix-table tbody tr { border-bottom: 1px solid var(--divider); }
.solutions-matrix-table tbody tr:last-child { border-bottom: none; }
.solutions-matrix-table tbody td { padding: 14px; vertical-align: top; line-height: 1.6; }
.solutions-matrix-table tbody td:nth-child(1),
.solutions-matrix-table tbody td:nth-child(4) {
  font-weight: 600; color: var(--text-primary);
}
.solutions-matrix-table tbody td:nth-child(3),
.solutions-matrix-table tbody td:nth-child(6) {
  color: #C0392B; font-style: italic;
}
.solutions-matrix-table tbody tr:nth-child(odd)  { background: rgba(255,255,255,0.5); }
.solutions-matrix-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.2); }

/* Language-aware: hide ZH columns when show-en, hide EN columns when show-zh */
body.show-en .solutions-matrix-table th:nth-child(4),
body.show-en .solutions-matrix-table th:nth-child(5),
body.show-en .solutions-matrix-table th:nth-child(6),
body.show-en .solutions-matrix-table td:nth-child(4),
body.show-en .solutions-matrix-table td:nth-child(5),
body.show-en .solutions-matrix-table td:nth-child(6) { display: none; }

body.show-zh .solutions-matrix-table th:nth-child(1),
body.show-zh .solutions-matrix-table th:nth-child(2),
body.show-zh .solutions-matrix-table th:nth-child(3),
body.show-zh .solutions-matrix-table td:nth-child(1),
body.show-zh .solutions-matrix-table td:nth-child(2),
body.show-zh .solutions-matrix-table td:nth-child(3) { display: none; }
```

---

## 14. Take-Home Section Updates `#takehome` [EXISTS — minor additions]

### 14.1 Add Fifth Point to EN Body

After the existing body text, add a new paragraph:

```html
<p class="takehome-body-en lang-en" style="margin-top: 20px;">
  What this page cannot do — and no page can — is solve the problem.
  What it can do is make the problem legible: give researchers, community members,
  policymakers, and technologists a shared vocabulary for what makes this wicked,
  and why good-faith efforts keep falling short of the goal.
</p>
```

### 14.2 Add ZH Mirror

```html
<p class="takehome-body-zh lang-zh" style="margin-top: 20px;">
  这个页面做不到——任何页面都做不到——解决这个难题。但它能做到的，是让问题变得清晰可见：为研究者、社区成员、政策制定者和技术人员提供一套共同的语言，说明这究竟是一个怎样的棘手难题，以及为什么善意的努力总是难以企及目标。
</p>
```

---

## 15. Community Portals `#portals` [EXISTS — add one field]

### 15.1 Recording Form: Add Dialect Variety Selector

In both `#form-recording-zh` and `#form-recording-en`, add a `<select>` for speaker's dialect variety before the file upload:

```html
<!-- EN version -->
<select class="portal-select" name="variety" required aria-label="Dialect variety">
  <option value="" disabled selected>Select your Wu variety</option>
  <option value="suzhou-city">Suzhou City (苏州市区)</option>
  <option value="suzhou-changshu">Changshu (常熟)</option>
  <option value="suzhou-zhangjiagang">Zhangjiagang (张家港)</option>
  <option value="suzhou-kunshan">Kunshan (昆山)</option>
  <option value="suzhou-wujiang">Wujiang (吴江)</option>
  <option value="suzhou-taicang">Taicang (太仓)</option>
  <option value="shanghai">Shanghai (上海)</option>
  <option value="other-wu">Other Wu variety</option>
</select>

<!-- ZH version -->
<select class="portal-select portal-input-zh" name="variety" required aria-label="方言品种">
  <option value="" disabled selected>请选择您的吴语品种</option>
  <option value="suzhou-city">苏州市区</option>
  <option value="suzhou-changshu">常熟</option>
  <option value="suzhou-zhangjiagang">张家港</option>
  <option value="suzhou-kunshan">昆山</option>
  <option value="suzhou-wujiang">吴江</option>
  <option value="suzhou-taicang">太仓</option>
  <option value="shanghai">上海</option>
  <option value="other-wu">其他吴语</option>
</select>
```

---

## 16. Closing Footer `#closing` [EXISTS — one addition]

### 16.1 Add Source List Toggle

After the existing closing-coda, add a collapsible sources section:

```html
<div class="closing-sources">
  <button class="sources-toggle" onclick="this.nextElementSibling.classList.toggle('visible')"
          aria-expanded="false" aria-controls="sources-list">
    <span class="lang-en">Sources ↓</span>
    <span class="lang-zh">参考来源 ↓</span>
  </button>
  <div id="sources-list" class="sources-list">
    <!-- 8–10 key sources in two columns, small text -->
    <!-- See sources from the research report -->
  </div>
</div>
```

```css
.sources-toggle {
  background: none; border: 1px solid #2C3330; color: var(--muted-label);
  padding: 6px 16px; border-radius: 20px; cursor: pointer; font-size: 12px;
  font-family: var(--font-en); margin: 16px auto 0; display: block;
  transition: border-color 0.2s, color 0.2s;
}
.sources-toggle:hover { border-color: var(--accent); color: var(--accent-light); }
.sources-list { display: none; margin-top: 20px; column-count: 2; column-gap: 32px; }
.sources-list.visible { display: block; }
.sources-list a { font-size: 12px; color: var(--muted-label); display: block;
                  margin-bottom: 10px; line-height: 1.5; break-inside: avoid;
                  text-decoration: none; border-bottom: 1px solid transparent; }
.sources-list a:hover { color: var(--accent-light); border-color: var(--accent-light); }
@media (max-width: 600px) { .sources-list { column-count: 1; } }
```

---

## 17. JavaScript Additions

All new interactive elements use vanilla JS. No new dependencies. Add to the existing `<script>` block.

### 17.1 Collapsible Phonology `<details>`

The `<details>/<summary>` HTML handles collapse natively. No JS needed.

### 17.2 Stakeholder Map Hover

```javascript
// Stakeholder node hover: highlight the connecting line
document.querySelectorAll('.sh-node').forEach(node => {
  node.addEventListener('mouseenter', () => {
    const id = node.dataset.id;
    document.querySelector(`.sh-line[data-target="${id}"]`)
      ?.classList.add('sh-line-active');
  });
  node.addEventListener('mouseleave', () => {
    document.querySelectorAll('.sh-line').forEach(l => l.classList.remove('sh-line-active'));
  });
});
```

### 17.3 Sources Toggle Accessibility

```javascript
document.querySelectorAll('.sources-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
  });
});
```

### 17.4 Language Toggle Extension

The existing language toggle JS already handles `body.show-zh` / `body.show-en` classes. The new sections use `.lang-zh` / `.lang-en` classes which the existing CSS rules already hide/show. **No JS changes needed for language switching in new sections.**

---

## 18. Accessibility Requirements

All new sections must meet WCAG 2.1 AA:

| Component | Requirement |
|---|---|
| Heatmap cells | `title` attribute on each cell with plain-text description |
| SVG tone charts | `<title>` inside each SVG; `aria-label` on container |
| Stakeholder map | Full content available as text fallback below the visual for screen readers |
| Solutions matrix table | `<caption>` element; column headers with `scope="col"` |
| `<details>/<summary>` | Native HTML; no additional ARIA needed |
| Color-only information | Never rely on color alone; pair with label/icon/pattern |
| Decline chart | All data also present as a `<table>` inside a `<details>` below the chart |

---

## 19. Mobile Responsiveness

All new standalone sections (`#demographic-viz`, `#cases`, `#solutions-matrix`) follow the same breakpoint pattern as existing sections:

```css
@media (max-width: 900px) {
  .cases-inner, .solutions-inner, .cases-inner { padding: 0 20px; }
  .case-comparison-grid { grid-template-columns: 1fr; }
  .stakeholder-map-container { width: 280px; height: 280px; }
}

@media (max-width: 600px) {
  .domain-heatmap { overflow-x: auto; }       /* heatmap scrolls horizontally */
  .solutions-table-wrapper { overflow-x: auto; } /* table scrolls horizontally */
  .tech-grid { grid-template-columns: 1fr; }  /* stack tech grid */
}
```

The phonology deep-dive (`<details>` collapse) is already mobile-friendly — the `<details>` element is closed by default, keeping the mobile viewport clean.

---

## 20. Content Handoff Checklist

Items requiring content from the content team before launch:

- [ ] `video/background.mp4` — 2:30–2:45 min background video per §3.5.4 brief
- [ ] `video/background-poster.jpg` — Still from Pingjiang canal shot, min 1280×720px
- [ ] `video/background-en.vtt` — English subtitle track for background video
- [ ] `video/background-zh.vtt` — Chinese subtitle track for background video
- [ ] `audio/landing-phrase.mp3` — 6 sec Suzhounese clip of "侬来白相"
- [ ] Three audio samples for Three Generations section (existing placeholder bars)
- [ ] Precise IPA transcriptions for all tone contour labels
- [ ] Confirmed fluency data point for 2014 (~4%) — currently approximated
- [ ] Photo/illustration for the closing canvas (or keep existing waveform)
- [ ] Any additional Suzhounese example phrases for the phrase rotator (B4)
- [ ] Confirmation of exact year range for Phonemica launch (first recordings of Suzhou)

---

## 21. Implementation Order (Recommended)

Build in this sequence to maximize testability at each step:

1. **Design system additions** — Add new CSS vars, badge types, `.lang-zh`/`.lang-en` rules (§1)
2. **Timeline entries** — Low-risk additions to existing component (§8)
3. **Wicked table expansion** — 5 new rows to existing table (§9)
4. **Linguistic portrait cards** — 2 new cards to existing grid (§5)
5. **Phonology deep-dive** — New `<details>` sections; self-contained (§6)
6. **Background video section** — Build shell with placeholder poster; wire JS; ship video asset when ready (§3.5)
7. **Demographic visualization** — New standalone section (§7)
8. **Technology landscape** — New subsection inside track-a (§11)
9. **Stakeholder map** — New subsection in both tracks (§10)
10. **Comparative cases** — New standalone section (§12)
11. **Solutions matrix** — New standalone section (§13)
12. **Portal enhancement** — Add variety selector (§15)
13. **Closing sources** — Add sources toggle (§16)
14. **Take-home additions** — Add paragraphs (§14)
15. **QA pass** — Language toggle, mobile, accessibility, video fallback

---

*Document prepared April 2026. All content references sourced from the accompanying research report `suzhou_dialect_digital_preservation.md`.*
