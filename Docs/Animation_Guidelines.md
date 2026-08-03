# Animation Guidelines

## Portfolio v2.0

> **Purpose**
>
> This document defines the motion language for the portfolio.
> Animations should reinforce hierarchy, communicate state changes, and
> create a polished experience without distracting from the content.

---

# 1. Motion Philosophy

Motion should be:

- Purposeful
- Fast
- Subtle
- Consistent
- Accessible

Animations should never exist purely for decoration.

---

# 2. Motion Principles

- Motion communicates state.
- Every interaction should provide feedback.
- Prefer opacity and transforms.
- Avoid animating layout-heavy properties.
- Respect `prefers-reduced-motion`.

---

# 3. Animation Stack

Library:

- Framer Motion

CSS Transitions:

- Hover states
- Color transitions
- Border transitions

Avoid mixing multiple animation libraries.

---

# 4. Timing Tokens

Fast: 150ms

Standard: 250ms

Slow: 350ms

Page transitions: 300--450ms

Hover: 150ms

---

# 5. Easing

Default: - easeOut

Interactive: - easeInOut

Entrance: - cubic-bezier(0.16,1,0.3,1)

Maintain identical easing across the project.

---

# 6. Page Load

Initial load:

1.  Navbar fades in.
2.  Hero content slides upward with fade.
3.  CTA buttons appear.
4.  GitHub graph fades.
5.  Current Activity card appears last.

Delay between hero children: 40--80ms.

---

# 7. Scroll Reveal

Each homepage section:

- Hidden initially
- Reveal once when entering viewport
- Fade + slight upward movement

Do not repeatedly animate while scrolling.

---

# 8. Navbar

On scroll:

- Add blur
- Slight shadow
- Background opacity transition

Active item:

- Accent color
- Underline/indicator transition

Mobile drawer:

- Slide from side
- Fade backdrop
- Close smoothly

---

# 9. Hero

Avatar: - Fade + scale (0.96 → 1)

Headline: - Fade + translateY

Bio: - Fade

Buttons: - Stagger reveal

Social icons: - Fade with small delay

---

# 10. Featured Projects

This is the most animated section.

Project selection:

On click:

- Fade out current details
- Replace iframe source
- Fade in new details
- Animate active card indicator

Never reload the page.

Keep transition under 300ms.

---

# 11. YouTube Player

Do not animate iframe aggressively.

Animate container only.

Maintain aspect ratio.

Prevent layout shift.

---

# 12. Project Cards

Hover:

- TranslateY(-2px)
- Border emphasis
- Shadow increase

Selected:

- Accent border
- Active indicator
- Elevated appearance

---

# 13. Blog Cards

Hover:

- Lift slightly
- Shadow increase
- Title accent transition

---

# 14. Tech Stack Marquee

Continuous infinite animation.

Alternate direction by row.

Pause on hover.

Resume smoothly.

No visible jump when looping.

---

# 15. Buttons

Hover:

- Background transition
- Border transition
- Icon shift (optional)

Pressed:

- Slight scale (0.98)

Disabled:

- Reduced opacity

---

# 16. Links

Hover:

- Color transition
- Underline animation (optional)

External link icons:

- Slight movement

---

# 17. Theme Toggle

Animate:

- Icon rotation
- Crossfade between sun/moon

Duration: 200ms.

---

# 18. Contact Section

CTA buttons:

- Hover lift
- Icon transition

Social icons:

- Fade color transition

---

# 19. Loading States

Skeletons:

- Soft shimmer

Loading indicators:

- Minimal

Avoid infinite flashy loaders.

---

# 20. Error States

Fade in.

Avoid shake animations unless input validation requires it.

---

# 21. Responsive Motion

Mobile:

Reduce travel distance.

Reduce stagger.

Maintain responsiveness.

---

# 22. Accessibility

If `prefers-reduced-motion` is enabled:

- Disable stagger
- Disable marquee movement
- Remove large transitions
- Keep instant but understandable feedback

---

# 23. Performance Rules

Animate only:

- opacity
- transform

Avoid animating:

- width
- height
- top
- left
- box-shadow continuously

Use GPU-friendly transforms.

---

# 24. Motion Matrix

Component Entrance Hover Exit

---

Navbar Fade Background None
Hero Fade + Slide None None
Project Card Fade Lift Fade
Blog Card Fade Lift Fade
Button Fade Color/Lift None
Badge Fade Lift None
Dialog Scale + Fade \- Fade

---

# 25. Acceptance Criteria

- Motion feels consistent across all pages.
- No animation blocks interaction.
- Animations maintain 60 FPS on modern devices.
- Reduced-motion users receive an accessible experience.
- Featured Projects transitions are smooth and seamless.
- Marquee loops continuously without visible seams.
- Motion enhances usability instead of distracting from content.
