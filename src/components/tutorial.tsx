"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  RotateCcw,
  X,
} from "lucide-react";
import {
  LANDING_TUTORIAL,
  WORKSPACE_TUTORIAL,
  parseTutorialProgress,
  spotlightBox,
  tutorialPanelPosition,
  tutorialStorageKey,
  type TourBox,
  type TutorialLanguage,
  type TutorialMode,
  type TutorialProgress,
} from "@/lib/tutorial";

const TutorialContext = createContext<(() => void) | null>(null);

export function TutorialButton({
  className = "btn btn-secondary",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const open = useContext(TutorialContext);
  return (
    <button
      type="button"
      className={className}
      onClick={() => open?.()}
      data-tour="tutorial-launcher"
    >
      <CircleHelp size={17} />
      {children || "Tutorial"}
    </button>
  );
}

export function TutorialProvider({
  mode,
  userId,
  member = false,
  loading = false,
  children,
}: {
  mode: TutorialMode;
  userId?: string;
  member?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const steps = mode === "workspace" ? WORKSPACE_TUTORIAL : LANDING_TUTORIAL;
  const storageKey = tutorialStorageKey(mode, userId);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [language, setLanguage] = useState<TutorialLanguage>("en");
  const [complete, setComplete] = useState(false);
  const [geometry, setGeometry] = useState<{
    box: TourBox | null;
    width: number;
    height: number;
    panelHeight: number;
  }>({ box: null, width: 1024, height: 768, panelHeight: 350 });
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const labelId = useId();
  const maskId = useId().replaceAll(":", "");
  const step = steps[index];
  const roman = language === "roman";

  const save = useCallback(
    (
      nextIndex: number,
      nextLanguage: TutorialLanguage,
      status: TutorialProgress["status"],
    ) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            version: 1,
            index: nextIndex,
            language: nextLanguage,
            status,
          }),
        );
      } catch {
        /* The guide also works without browser storage. */
      }
    },
    [storageKey],
  );

  const open = useCallback(
    (restart = false) => {
      if (mode === "landing" && member) {
        router.push("/today?tour=start");
        return;
      }
      let stored: TutorialProgress | null = null;
      try {
        stored = parseTutorialProgress(
          localStorage.getItem(storageKey),
          steps.length,
        );
      } catch {
        /* Private browsing can disable storage. */
      }
      const nextIndex =
        !restart && stored?.status === "in_progress" ? stored.index : 0;
      const nextLanguage = stored?.language || "en";
      opener.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setIndex(nextIndex);
      setLanguage(nextLanguage);
      setComplete(false);
      setActive(true);
      save(nextIndex, nextLanguage, "in_progress");
    },
    [mode, member, router, storageKey, steps.length, save],
  );

  function close() {
    save(index, language, complete ? "completed" : "skipped");
    setActive(false);
    requestAnimationFrame(
      () =>
        opener.current?.isConnected &&
        opener.current.focus({ preventScroll: true }),
    );
  }
  function next() {
    if (index === steps.length - 1) {
      setComplete(true);
      save(index, language, "completed");
    } else {
      setIndex(index + 1);
      save(index + 1, language, "in_progress");
    }
  }
  function back() {
    if (index > 0) {
      setIndex(index - 1);
      save(index - 1, language, "in_progress");
    }
  }
  function restart() {
    setIndex(0);
    setComplete(false);
    save(0, language, "in_progress");
  }

  useEffect(() => {
    if (
      mode !== "workspace" ||
      new URLSearchParams(window.location.search).get("tour") !== "start"
    )
      return;
    const frame = requestAnimationFrame(() => {
      open(true);
      router.replace(pathname, { scroll: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, open, pathname, router]);

  useEffect(() => {
    if (active && !complete && pathname !== step.path)
      router.push(step.path, { scroll: false });
  }, [active, complete, pathname, step.path, router]);

  useEffect(() => {
    if (!active) return;
    const modal = dialog.current;
    modal?.showModal();
    return () => {
      modal?.close();
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let scrolled: Element | null = null;
    const measure = () => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      let target: HTMLElement | undefined;
      const find = (name: string) =>
        Array.from(
          document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`),
        ).find(
          (node) =>
            node.getBoundingClientRect().width > 0 &&
            node.getBoundingClientRect().height > 0,
        );
      if (!complete && pathname === step.path && !loading)
        target =
          find(step.target) ||
          (step.fallback ? find(step.fallback) : undefined);
      if (target && scrolled !== target) {
        scrolled = target;
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "instant",
        });
      }
      const box = target
        ? spotlightBox(target.getBoundingClientRect(), viewport)
        : null;
      const value = {
        box,
        ...viewport,
        panelHeight: panel.current?.getBoundingClientRect().height || 350,
      };
      setGeometry((previous) =>
        JSON.stringify(previous) === JSON.stringify(value) ? previous : value,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new MutationObserver(schedule);
    const root = document.querySelector(`[data-tour-root="${mode}"]`);
    if (root)
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"],
      });
    const resize = new ResizeObserver(schedule);
    if (root) resize.observe(root);
    if (panel.current) resize.observe(panel.current);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    schedule();
    const focusFrame = requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [active, complete, pathname, step, loading, language, mode]);

  const pending = !complete && (pathname !== step.path || loading);
  const box = pending || complete ? null : geometry.box;
  const position = tutorialPanelPosition(box, geometry, {
    width: complete ? 420 : 370,
    height: geometry.panelHeight,
  });

  return (
    <TutorialContext.Provider value={() => open()}>
      {children}
      {active &&
        createPortal(
          <dialog
            ref={dialog}
            className="tutorial-dialog"
            aria-labelledby={labelId}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onKeyDown={(event) => {
              if (
                (event.target as HTMLElement).closest(
                  "select,input,textarea",
                ) ||
                complete
              )
                return;
              if (event.key === "ArrowRight" && !pending) {
                event.preventDefault();
                next();
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                back();
              }
            }}
          >
            <svg
              className="tutorial-shade"
              aria-hidden="true"
              width="100%"
              height="100%"
            >
              <defs>
                <mask id={maskId}>
                  <rect width="100%" height="100%" fill="white" />
                  {box && (
                    <rect
                      {...{
                        x: box.left,
                        y: box.top,
                        width: box.width,
                        height: box.height,
                      }}
                      rx="12"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="#102a23"
                fillOpacity=".67"
                mask={`url(#${maskId})`}
              />
            </svg>
            {box && (
              <div
                className="tutorial-spotlight"
                style={box}
                aria-hidden="true"
              />
            )}
            <section
              ref={panel}
              className={`tutorial-panel ${complete ? "tutorial-complete" : ""}`}
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
                maxHeight: geometry.height - 24,
              }}
            >
              <div className="tutorial-toolbar">
                <span>
                  {complete
                    ? "ALL SET"
                    : `${mode === "landing" ? "PRODUCT TOUR" : "YOUR WORKSPACE"} · ${index + 1} / ${steps.length}`}
                </span>
                <button
                  className="tutorial-close"
                  onClick={close}
                  aria-label={
                    complete ? "Close tutorial" : "Skip all and close tutorial"
                  }
                >
                  <X size={18} />
                </button>
              </div>
              {complete ? (
                <>
                  <span className="tutorial-done-icon">
                    <Check size={25} />
                  </span>
                  <h2 ref={heading} id={labelId} tabIndex={-1}>
                    {roman ? "Ab aapki baari." : "You’re ready to begin."}
                  </h2>
                  <p>
                    {roman
                      ? "Ek opportunity add karein aur apni pehli conversation shuru karein. Tutorial button se kabhi bhi wapas aa sakte hain."
                      : "Add an opportunity and start your first conversation. You can come back to this guide from the Tutorial button anytime."}
                  </p>
                  <div className="tutorial-complete-actions">
                    {mode === "landing" ? (
                      <Link
                        className="btn btn-primary"
                        href="/signup"
                        onClick={close}
                      >
                        Create your account <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <button className="btn btn-primary" onClick={close}>
                        Back to my workspace <ArrowRight size={16} />
                      </button>
                    )}
                    <button className="tutorial-text-button" onClick={restart}>
                      <RotateCcw size={14} />
                      {roman ? "Dobara dekhein" : "Replay tour"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <progress
                    className="tutorial-progress"
                    value={index + 1}
                    max={steps.length}
                    aria-label={`Tutorial step ${index + 1} of ${steps.length}`}
                  />
                  <label className="tutorial-language">
                    Guide language
                    <select
                      value={language}
                      onChange={(event) => {
                        const value = event.target.value as TutorialLanguage;
                        setLanguage(value);
                        save(index, value, "in_progress");
                      }}
                    >
                      <option value="en">English</option>
                      <option value="roman">Roman Urdu</option>
                    </select>
                  </label>
                  <h2 ref={heading} id={labelId} tabIndex={-1}>
                    {step.title}
                  </h2>
                  <p lang={roman ? "ur-Latn" : "en"}>
                    {roman ? step.roman : step.description}
                  </p>
                  {pending && (
                    <span className="tutorial-loading" role="status">
                      Opening the next section…
                    </span>
                  )}
                  <div className="tutorial-navigation">
                    <button
                      className="tutorial-back"
                      onClick={back}
                      disabled={index === 0}
                    >
                      <ArrowLeft size={15} />
                      {roman ? "Peechay" : "Back"}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={next}
                      disabled={pending}
                    >
                      {index === steps.length - 1
                        ? roman
                          ? "Mukammal"
                          : "Finish"
                        : roman
                          ? "Agay"
                          : "Next"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="tutorial-skip">
                    <button onClick={next}>
                      {roman ? "Yeh step chhorein" : "Skip step"}
                    </button>
                    <button onClick={close}>
                      {roman ? "Sab skip karein" : "Skip all"}
                    </button>
                    {index > 0 && (
                      <button onClick={restart} aria-label="Restart tutorial">
                        <RotateCcw size={14} />
                        Restart
                      </button>
                    )}
                  </div>
                </>
              )}
            </section>
          </dialog>,
          document.body,
        )}
    </TutorialContext.Provider>
  );
}
