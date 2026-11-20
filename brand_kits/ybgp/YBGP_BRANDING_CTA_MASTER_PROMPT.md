# YBGP Branding, Contact Details & Website CTA — Master Implementation Instructions

Use this file as the standing implementation brief whenever you build, extend, redesign, demonstrate, or audit a website that is being created, presented, or delivered by **YBGP**.

This standard applies to:
- Production/client websites.
- Demo websites, concept websites, sample projects, prototypes, and portfolio demonstrations.
- Internal project previews intended to demonstrate a working YBGP solution.

**Do not ask the user to repeat the YBGP branding, contact details, WhatsApp wording, or destination details.** Read this file and implement the applicable elements automatically, unless the user explicitly opts out.

## 1. Official YBGP brand assets and identity

- Official logo: `assets/ybgp-logo.png`.
- Visual reference: `assets/reference-banner.png`.
- Website: `https://ybgp.in`
- Instagram: `https://www.instagram.com/ybgp.consulting/`

Use the supplied official YBGP logo. Do not redraw, retype, approximate, recolor, crop, stretch, or recreate it. Preserve its original proportions and colors. The screenshot is layout/style guidance; do not use the screenshot itself as the production logo.

## 2. Standard YBGP attribution banner

Add a compact, fixed-position attribution/CTA banner at the bottom of the viewport, inspired by the supplied reference:

- Primary line: **Looking to grow your business?**
- Supporting line: **Designed and developed by YBGP**
- Entire banner (text and logo) links to `https://ybgp.in`, opens in a new tab, and uses `rel="noopener noreferrer"`.
- Deep-green rounded container, white text, and official logo on a clean white rounded plate on desktop.
- First line bold; second line regular and slightly softer.
- Balanced spacing, subtle shadow, and polished finish.
- Responsive desktop/mobile sizing, sensible side gutters, and safe-area support.
- Avoid covering page content, sticky navigation, chat widgets, checkout controls, cookie notices, or other fixed elements. Add bottom clearance where needed.
- Keep it visually secondary to the site's main conversion actions.

This banner is required on all intended public pages of production, demo, and concept websites created by YBGP. Do not add it to the YBGP corporate website itself by default; add it to `ybgp.in` only when explicitly requested.

## 3. YBGP contact details — preserve exactly

Use these as the canonical YBGP contact details whenever a YBGP contact section, footer, contact page, project information panel, or relevant call-to-action is included:

- **Mobile / WhatsApp:** `+91 83681 43892` (display format may be `8368143892`)
- **Website:** `https://ybgp.in`
- **Email:** `ybgp.consulting@gmail.com`
- **Instagram:** `@ybgp.consulting` — link to `https://www.instagram.com/ybgp.consulting/`
- **WhatsApp click-to-chat base:** `https://wa.me/918368143892`

Do not invent alternative phone numbers, email addresses, social handles, or contact URLs. Use the supplied details consistently. Do not expose contact details in a visually intrusive way; follow the website's design system.

## 4. WhatsApp project enquiry CTA — dynamic project name

Where the website has a contact area, project enquiry action, demo/concept showcase, or relevant CTA, provide a WhatsApp enquiry link using the canonical number and a URL-encoded prefilled message.

Use this message template:

`Hey YBGP, I'm interested in your [PROJECT NAME] project and I want something like this for my business too. Can I get more information about it?`

### Project-name substitution rule

- Replace `[PROJECT NAME]` with the actual working project/product/website name by default.
- The asterisk `*` in the user's original instruction means **the default working project name**, not a literal asterisk.
- For a demo or concept project, use the demo/concept's displayed project name.
- If the project has no established name, use its current repository/project name as the fallback.
- Never leave `[PROJECT NAME]`, `*`, or another unresolved placeholder in the live WhatsApp URL.
- Do not ask the user for the project name if it is already evident from the repository, project configuration, site title, or current task.
- Keep the message natural and professional. Preserve the intent: the visitor likes the demonstrated project and wants to discuss a similar solution for their own business.

Construct the link using proper URL encoding, for example:

`https://wa.me/918368143892?text=Hey%20YBGP%2C%20I%27m%20interested%20in%20your%20PROJECT%20NAME%20project%20and%20I%20want%20something%20like%20this%20for%20my%20business%20too.%20Can%20I%20get%20more%20information%20about%20it%3F`

The example is illustrative: encode the actual project name safely in code using the framework's URL-encoding utility rather than manually concatenating untrusted text.

Suggested CTA labels:
- `Discuss a Similar Project`
- `Interested in a Project Like This?`
- `Enquire on WhatsApp`

Use a WhatsApp icon only if the project already has an icon library or a suitable existing asset. Do not add a new dependency just for the icon.

## 5. Contact presentation guidance

- On demo/concept/portfolio projects, make it clear that YBGP created or developed the demonstration and offer the WhatsApp CTA to discuss a similar project.
- Include the supplied contact details in an appropriate contact/footer area when such an area exists or is being built.
- Do not force all contact details into the compact bottom attribution banner. Keep the banner close to the supplied reference; place phone, email, Instagram, and the project-specific WhatsApp enquiry CTA in a contact section, footer, or dedicated compact contact panel.
- The WhatsApp project enquiry CTA should be prominent enough to find but should not compete with the demo site's own primary product/business conversion flow.
- Do not claim that the demo business itself is operated by YBGP. Distinguish the demo brand from the YBGP developer/consultant attribution.

## 6. Implementation rules

1. **Inspect before editing.** Identify the framework, routing/layout structure, existing global components, asset conventions, CSS approach, and fixed/sticky UI.
2. Preserve the existing project. Do not replace the starter project, rewrite unrelated files, change the tech stack, or overwrite existing assets.
3. Reuse the shared global layout/shell so the banner appears on every intended public page, including nested routes—not just the homepage.
4. Create reusable components (for example, `YbgpBrandingCta` and `YbgpContactLinks`) and mount them once at the shared layout level where appropriate.
5. Copy the supplied logo into the project's established public/static asset directory using a clear filename such as `ybgp-logo.png`. Keep the source asset intact. If already present, reuse it.
6. Keep contact details, banner copy, destination, and WhatsApp message template in one clearly defined component/configuration location so they can be updated centrally.
7. Generate the WhatsApp message from the actual project name and URL-encode it safely.
8. Do not add the banner/contact CTA to admin dashboards, authentication screens, internal tools, embedded widgets, print views, or third-party/white-label areas unless those are part of the intended public demo/client website.
9. Do not add the banner to `ybgp.in` itself by default. This requirement is for websites created/delivered by YBGP; add it to the YBGP corporate website only when explicitly asked.
10. For SPAs, ensure the banner persists across client-side route changes without flicker or duplicate instances.
11. For SSR/static generation/framework apps, implement in an idiomatic, hydration-safe way.
12. Do not introduce dependencies for these small components.
13. Do not remove or modify existing branding, footer content, consent controls, or site features to make room. Resolve conflicts with minimal targeted changes.
14. Do not add tracking pixels, analytics events, forms, popups, or extra marketing claims unless requested.

## 7. Visual starting point

Adapt these values to the existing design system while preserving the reference composition:

- Container: deep green close to `#062F22` / `#082F23`, white text, 18–22px rounded corners.
- Desktop width: `min(calc(100% - 32px), 980px)`, centered.
- Desktop bottom offset: approximately 16px plus safe-area inset.
- Desktop padding: approximately 14–16px 20px.
- Logo plate: white background, 14px rounded corners; logo contained with `object-fit: contain`.
- Desktop logo width: approximately 120–130px.
- Mobile: width `calc(100% - 24px)`, tighter padding and gaps; logo width approximately 88–104px.
- First line: 15–16px desktop / 13–14px mobile; supporting line: 13–14px desktop / 11–12px mobile.
- Use project tokens/CSS variables where possible.
- Respect `prefers-reduced-motion`; avoid animation by default.

## 8. Accessibility and behavior

- Entire attribution banner is a semantic, keyboard-accessible link.
- WhatsApp CTA is a real link to the generated `wa.me` URL.
- Email uses `mailto:ybgp.consulting@gmail.com`.
- Phone uses `tel:+918368143892`; WhatsApp uses `https://wa.me/918368143892`.
- Instagram links to the canonical profile URL.
- Provide visible keyboard focus and sufficient contrast.
- Use meaningful logo alternative text, or empty alt when adjacent text already conveys the same information.
- Ensure no focus trap and no obstruction of keyboard navigation.

## 9. Verification checklist

After implementation, verify and report:

- [ ] Banner appears on all intended public routes, including a nested route.
- [ ] Banner appears once per page and is absent from excluded/internal areas.
- [ ] Banner and logo open `https://ybgp.in` in a new tab.
- [ ] Supplied official logo is used without distortion.
- [ ] Desktop and mobile layouts have no overflow.
- [ ] Banner does not hide important content or fixed controls.
- [ ] Contact details match this file exactly.
- [ ] Phone, email, Instagram, and WhatsApp links work.
- [ ] WhatsApp message contains the actual working project name, not `*` or an unresolved placeholder.
- [ ] WhatsApp message is URL-encoded correctly and opens the intended number.
- [ ] The requirement is also implemented for demo/concept projects.
- [ ] Existing site functionality, branding, routing, and build remain intact.
- [ ] Relevant build/lint/tests pass, or pre-existing failures are identified.

## 10. Agent operating instruction

Start by auditing the existing project and finding the smallest safe integration point. Then implement this YBGP branding/contact standard without unrelated redesigns. Do not ask the user to repeat details already present in this file. If the supplied logo/reference assets are unavailable in the agent's workspace, ask for them rather than recreating the logo. Finish with a concise summary of changed files, routes checked, generated WhatsApp message/project name, and verification results.
