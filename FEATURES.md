# GTA 6 News Hub — 100 Features

Status legend: ✅ implemented · 🔜 planned

A community news platform dedicated to GTA 6 — tracking release updates, trailers,
leaks, and Rockstar announcements. Launch target: **November 19, 2026**.

This file is the single source of truth for the feature scope. Features are grouped
by area. The static frontend implements client-side behaviour via vanilla JS and
`localStorage` (no backend required).

## 1. Core layout & navigation
1. ✅ Responsive top navigation bar with logo and section links
2. ✅ Sticky header that condenses on scroll
3. ✅ Mobile hamburger menu with slide-in drawer
4. ✅ Footer with sitemap, social links and legal links
5. ✅ Breadcrumb-style "back to top" floating button
6. ✅ Smooth-scroll anchor navigation between sections
7. ✅ Skip-to-content link for accessibility
8. ✅ Active-section highlight in the nav while scrolling
9. ✅ Keyboard-navigable menus (focus states, tab order)
10. ✅ 404 / empty-state messaging for missing content

## 2. Theming & personalization
11. ✅ Dark / light theme toggle
12. ✅ Theme preference persisted in localStorage
13. ✅ System-preference (prefers-color-scheme) detection on first visit
14. ✅ GTA6 neon accent color theme (pink/cyan)
15. ✅ Font-size / reading-comfort toggle (A−/A+)
16. ✅ Reduced-motion respect for animations
17. ✅ Persisted layout density (compact/comfortable)
18. ✅ Accent-color picker
19. ✅ Remember last visited section
20. ✅ "Reset preferences" control

## 3. News feed & articles
21. ✅ News feed with article cards (image, title, excerpt, date)
22. ✅ Category tags on each article (Trailer, Leak, Official, Map, Characters…)
23. ✅ Article detail view (modal/route) with full body
24. ✅ Featured / hero article spotlight
25. ✅ "Latest", "Trending" and "Official only" feed modes
26. ✅ Relative timestamps ("3 days ago")
27. ✅ Estimated reading time per article
28. ✅ Source attribution / external link per article
29. ✅ Verified vs. rumor badge on articles
30. ✅ Pagination / "load more" on the feed
31. ✅ Related articles on the detail view
32. ✅ Article author / contributor byline
33. ✅ Image lazy-loading
34. ✅ Pull/refresh "check for updates" action

## 4. Search, filter & sort
35. ✅ Live text search across titles and excerpts
36. ✅ Category filter chips (multi-select)
37. ✅ Sort by newest / oldest / most popular
38. ✅ Filter by verified/rumor
39. ✅ Search highlights matched terms
40. ✅ Empty-search results state with suggestions
41. ✅ Debounced search input
42. ✅ Persisted last search/filter state
43. ✅ Tag cloud quick-filter
44. ✅ Clear-all-filters control

## 5. Engagement (client-side)
45. ✅ Bookmark / save articles (localStorage)
46. ✅ "Saved articles" view
47. ✅ Like / upvote articles with counts
48. ✅ Local comments per article (localStorage)
49. ✅ Reply-style threaded comment input
50. ✅ Comment author name (remembered)
51. ✅ Emoji reactions on articles
52. ✅ Share buttons (copy link, X, Reddit, WhatsApp)
53. ✅ Web Share API where supported
54. ✅ Reading-progress bar on article view
55. ✅ "Mark as read" state with visual dimming
56. ✅ Recently viewed articles list

## 6. Countdown & release tracking
57. ✅ Live countdown to Nov 19, 2026 (days/hrs/min/sec)
58. ✅ Days-since-announcement counter
59. ✅ Release roadmap / timeline of key events
60. ✅ "Add to calendar" (.ics) for release date
61. ✅ Platform availability list (PS5, Xbox Series X|S, PC)
62. ✅ Pre-order info section
63. ✅ Countdown milestones ("Trailer 2 dropped!")

## 7. Media
64. ✅ Trailer gallery section (embedded video thumbnails)
65. ✅ Screenshot / wallpaper gallery with lightbox
66. ✅ Lightbox keyboard navigation (←/→/Esc)
67. ✅ Downloadable wallpapers
68. ✅ Map preview section
69. ✅ Character roster cards (Lucia, Jason, …)
70. ✅ Media filter (trailers / screenshots / art)

## 8. Community
71. ✅ Newsletter signup form with validation
72. ✅ Newsletter confirmation + persisted "subscribed" state
73. ✅ Polls / community votes with live local results
74. ✅ Rumor "credibility meter" voting
75. ✅ Discord / Reddit community link cards
76. ✅ "Submit a tip" form
77. ✅ FAQ accordion
78. ✅ Fan countdown leaderboard (most-active local stats)

## 9. PWA & offline
79. ✅ Web App Manifest (installable)
80. ✅ Service worker for offline caching
81. ✅ App icons / theme color
82. ✅ Offline fallback page
83. ✅ "Install app" prompt handling
84. ✅ Cached news available offline

## 10. Notifications & utilities
85. ✅ In-page toast notifications
86. ✅ Optional browser-notification opt-in (countdown reminders)
87. ✅ "New articles since last visit" badge
88. ✅ Cookie/consent banner (dismissible)
89. ✅ Back-to-top progress ring

## 11. Accessibility & quality
90. ✅ Semantic HTML landmarks (header/main/nav/footer)
91. ✅ ARIA labels on interactive controls
92. ✅ Color-contrast-safe palette in both themes
93. ✅ Focus-visible outlines
94. ✅ Alt text on all images
95. ✅ Keyboard-operable modals (focus trap, Esc to close)

## 12. SEO & meta
96. ✅ Descriptive meta tags + Open Graph / Twitter cards
97. ✅ Structured-data (JSON-LD) for the website/articles
98. ✅ Canonical link + favicon set
99. ✅ Sitemap-style footer + robots-friendly markup
100. ✅ Print-friendly stylesheet for articles

## 13. Comfort layer (beyond the original 100)
101. ✅ View modes — Casual / Standard / Insider (einfach / normal / experte)
102. ✅ UI language switch (DE/EN) with `navigator.language` auto-detect
103. ✅ Language / region filter in the news feed
104. ✅ Keyboard shortcuts (/ search, j/k move, o open, t theme, v view, l lang, ? help)
105. ✅ Text-to-speech "read aloud" in the article view
106. ✅ Online/offline status banner
107. ✅ Visible PWA "install app" button
108. ✅ Restore last visited section on return
109. ✅ On-demand article translation into the UI language via a self-hosted,
     LibreTranslate-compatible engine (configurable endpoint, cached, graceful
     fallback). See `TRANSLATION.md`.
110. ✅ Feed auto-translate toggle — when the translation endpoint is configured,
     a Preferences toggle enables automatic title/excerpt translation in feed cards
     (cache-first, async DOM patch, max 3 concurrent requests, DOM-connected guard).
