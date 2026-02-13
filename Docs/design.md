🎨 Design System First
Color Palette (Dark Mode — keeping your dark theme)

Background: #141412 — warm near-black, not pure black
Surface: #1E1D1A — cards, panels
Border: #2E2C28 — all dividers, dashed zones
Text Primary: #F0EDE8 — warm white, never pure #FFFFFF
Text Secondary: #7A7570 — muted, earthy
Accent: #C4714A — terracotta, used very sparingly (one element per page max)
Accent hover: #B05E38

Typography

Headings: Playfair Display or Lora (serif) — pull from Google Fonts
Body + UI: Inter at 400/500 — clean, neutral
Monospace (filenames, chunks, timestamps): JetBrains Mono at small sizes


🏠 Home Page
Nav — Remove the filled purple active pill. Instead: active link gets a simple terracotta #C4714A underline, 2px. No background. Logo: drop the purple gradient square icon, replace with a plain ◆ character in terracotta.
Hero — This is the biggest change:

Remove ALL gradient text. Headline is plain #F0EDE8 in Playfair Display, ~72px, normal weight, left-aligned (not centered)
Remove the subtitle paragraph — too wordy. Replace with one short italic line in Lora: "Ask questions. Get cited answers."
Two buttons: Primary Ask a Question — terracotta background, no border radius beyond 4px. Secondary System Status — transparent, just #2E2C28 border, text in #7A7570
No gradient, no glow, no animated text

3-Step Section — Remove the cards entirely. Replace with a horizontal timeline:

A thin 1px horizontal line in #2E2C28 connecting three points
Each point: a small circle with just the number, terracotta stroke
Label below in Playfair Display italic, description in small Inter
No background panels, no border radius, no icons


📄 Documents Page
Upload Zone — Strip the navy fill completely. Just a 1px dashed #2E2C28 rectangle on transparent background. Center text: Drop files here in #7A7570. No folder emoji.
Document List — Instead of rounded dark cards, use simple borderless rows separated by 1px dividers (#2E2C28). Filename in Inter 500 #F0EDE8, date + chunks inline in #7A7570 mono. Delete becomes a small × in #7A7570 that turns terracotta on hover.
Ask a Question — Input is a clean underline-only field (no box/border-radius), just a 1px bottom border in #2E2C28. The Ask → button is just the text in terracotta with an arrow, no background.
Answer Block — Plain text in #F0EDE8, no box around it. Sources listed as footnote-style: ¹ AI_NOTES.md · High in small mono, stacked, no cards.

⚙️ Status Page
Header — Same left-aligned Playfair Display heading. Remove the big green checkbox emoji.
Overall Status — One line: ● All Systems Operational where ● is terracotta. Timestamp in small mono below. No large card wrapping this.
Service Cards — Replace the 3 big dark cards with a simple 3-row table: columns for Service | Status | Latency. Thin 1px row dividers. Status shown as ● Healthy with a muted green dot. No icons, no rounded cards, no background fills.
Refresh Button — Ghost button, just bordered, bottom-centered.

🔑 Key Rules to Follow in Code

No rounded-xl or rounded-2xl anywhere — max rounded (4px)
No bg-gradient-* anywhere
No purple (#7C3AED etc.) anywhere — replace every instance with terracotta or neutral
Generous padding — sections need breathing room (py-24 minimum)
Left-align everything — centered text only for the timeline labels
Whitespace is the design