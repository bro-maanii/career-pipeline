# Career Pipeline design context

A quiet light workspace with forest green actions, a slim sidebar, readable type, and red, orange, and yellow follow-up queues. Native controls and dialogs keep the interface small and accessible.

CSS tokens: `src/app/globals.css`. Icons: `lucide-react`. Layout inspiration: 21st Task List Card and Dashboard Sidebar catalog metadata, implemented with project-specific components.

The public landing page has a playful poster direction explicitly requested by the user: lavender paper, electric purple actions, acid yellow and coral accents, heavy sans headings, sticker shapes, ink outlines, and offset shadows. It keeps the fictional product preview and real workflow descriptions. Inspired by 21st Colorful Bento Grid and Bento Dashboard metadata; all implementation is project-specific. Styles and colors are scoped in `src/app/landing.css`; the private workspace retains forest green.

Landing motion uses route-loaded GSAP and ScrollTrigger: a staggered hero entrance, moving workflow ribbon, floating stickers, scroll reveals, and a rotating footer accent. A visible Motion button stops animations, and the OS reduced-motion preference produces a static page. Opening a tutorial reverts landing animations so controls stay visible and highlights stay aligned. Context cleanup runs on navigation, resize breakpoints, and motion preference changes. No pinned scrolling or scroll hijacking.

The tutorial uses a native modal dialog, an SVG spotlight, accessible native buttons, bilingual explanations, and a mobile bottom-docked panel. It highlights real workspace controls without changing records. Visitors tour labeled landing examples; signed-in users tour all seven real app sections. Local progress is keyed per user. Styles are scoped in `src/app/tutorial.css`.
