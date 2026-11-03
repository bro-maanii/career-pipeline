"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Pause, Play } from "lucide-react";

const MotionContext = createContext({
  paused: false,
  reduced: false,
  toggle: () => {},
});
const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const getReducedMotion = () => window.matchMedia(reducedQuery).matches;

export function LandingMotionToggle() {
  const { paused, reduced, toggle } = useContext(MotionContext);
  const stopped = paused || reduced;
  return (
    <button
      type="button"
      className="lp-motion-toggle"
      onClick={toggle}
      disabled={reduced}
      aria-label={
        reduced
          ? "Animations disabled by your device settings"
          : stopped
            ? "Play animations"
            : "Pause animations"
      }
      title={
        reduced
          ? "Your reduced-motion preference is enabled"
          : stopped
            ? "Play animations"
            : "Pause animations"
      }
    >
      {stopped ? <Play size={14} /> : <Pause size={14} />}
      <span className="lp-motion-label">Motion {stopped ? "off" : "on"}</span>
    </button>
  );
}

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const introduced = useRef(false);
  const [paused, setPaused] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeToMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    const check = () =>
      setGuideOpen(Boolean(document.querySelector("dialog[open]")));
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    const frame = requestAnimationFrame(check);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (paused || reduced || guideOpen) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    // The landing route alone loads GSAP. All content is visible without JavaScript.
    async function animate() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      dispose = () => media.revert();
      media.add(
        {
          desktop: "(min-width: 901px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (!context.conditions?.motion) return;
          const scope = root.current!;
          const select = gsap.utils.selector(scope);
          if (!introduced.current) {
            introduced.current = true;
            gsap
              .timeline({ defaults: { ease: "power3.out" } })
              .from(select(".lp-hero-copy > .lp-eyebrow"), {
                y: 18,
                opacity: 0,
                duration: 0.5,
              })
              .from(
                select(".lp-title-line"),
                {
                  y: 65,
                  rotation: 2,
                  opacity: 0,
                  duration: 0.85,
                  stagger: 0.12,
                },
                "-=.2",
              )
              .from(
                select(
                  ".lp-hero-copy > p, .lp-hero-actions, .lp-hero-reassurance",
                ),
                { y: 22, opacity: 0, duration: 0.6, stagger: 0.1 },
                "-=.55",
              )
              .from(
                select(".lp-preview-shell"),
                { y: 60, rotation: 3, opacity: 0, duration: 0.95 },
                "-=.7",
              );
          }
          gsap.to(select(".lp-marquee-track"), {
            xPercent: -50,
            duration: 28,
            repeat: -1,
            ease: "none",
          });
          gsap.to(select(".lp-sparkle-spin"), {
            rotation: 360,
            duration: 24,
            repeat: -1,
            ease: "none",
          });
          gsap.to(select(".lp-floating-note"), {
            y: -12,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
          gsap.to(select(".lp-orbit-sticker"), {
            y: 9,
            rotation: 8,
            duration: 3.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
          scope
            .querySelectorAll<HTMLElement>(
              ".lp-feature, .lp-section-heading, .lp-how-grid > div, .lp-privacy",
            )
            .forEach((element, index) => {
              if (
                element.getBoundingClientRect().top <
                window.innerHeight * 0.92
              )
                return;
              gsap.from(element, {
                y: 45,
                rotation: element.classList.contains("lp-feature")
                  ? index % 2
                    ? 1.5
                    : -1.5
                  : 0,
                opacity: 0,
                duration: 0.75,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 94%",
                  once: true,
                },
              });
            });
          if (context.conditions.desktop) {
            gsap.fromTo(
              select(".lp-final-sparkle"),
              { rotation: -25 },
              {
                rotation: 35,
                ease: "none",
                scrollTrigger: {
                  trigger: scope.querySelector(".lp-final"),
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1,
                },
              },
            );
          }
          const hoverCleanups: (() => void)[] = [];
          if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            scope
              .querySelectorAll<HTMLElement>(".lp-button")
              .forEach((button) => {
                const hover = gsap.to(button, {
                  y: -3,
                  duration: 0.2,
                  paused: true,
                  ease: "power2.out",
                });
                const enter = () => {
                  hover.play();
                };
                const leave = () => {
                  hover.reverse();
                };
                button.addEventListener("pointerenter", enter);
                button.addEventListener("pointerleave", leave);
                hoverCleanups.push(() => {
                  button.removeEventListener("pointerenter", enter);
                  button.removeEventListener("pointerleave", leave);
                });
              });
          }
          return () => hoverCleanups.forEach((cleanup) => cleanup());
        },
        root.current,
      );
    }
    void animate().catch(() => {
      dispose?.(); /* A failed animation download leaves a complete, static page. */
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [paused, reduced, guideOpen]);

  return (
    <MotionContext.Provider
      value={{ paused, reduced, toggle: () => setPaused((value) => !value) }}
    >
      <div
        ref={root}
        className="lp"
        data-tour-root="landing"
        data-motion={paused || reduced || guideOpen ? "paused" : "playing"}
      >
        {children}
      </div>
    </MotionContext.Provider>
  );
}
