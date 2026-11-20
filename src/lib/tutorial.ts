import { FOLLOWUP_1_DAYS, FOLLOWUP_2_DAYS } from "./config";
export type TutorialMode = "landing" | "workspace";
export type TutorialLanguage = "en" | "roman";
export type TutorialStep = {
  id: string;
  path: string;
  target: string;
  title: string;
  description: string;
  roman: string;
  fallback?: string;
};
const step = (
  id: string,
  path: string,
  target: string,
  title: string,
  description: string,
  roman: string,
  fallback?: string,
): TutorialStep => ({ id, path, target, title, description, roman, fallback });
export const WORKSPACE_TUTORIAL: TutorialStep[] = [
  step(
    "today",
    "/today",
    "today-overview",
    "Start with Today",
    "This is your daily starting point. It brings the applications, conversations, and follow-ups that need your attention into one place.",
    "Yeh aapka daily starting point hai. Yahan applications, conversations aur due follow-ups ek jagah milenge.",
    "nav-today",
  ),
  step(
    "add",
    "/today",
    "today-add",
    "Add an opportunity",
    "Use Add application to save a company, role, job link, application date, and hiring contact. You can fill in notes and interview progress as things move forward.",
    "Add application se company, role, job link, date aur contact save karein. Baad mein notes aur interview progress update kar sakte hain.",
    "nav-today",
  ),
  step(
    "stats",
    "/today",
    "today-stats",
    "See your search at a glance",
    "These totals show your applications, replies, interviews, and rejections. They use records from your own account.",
    "Yeh totals aapki applications, replies, interviews aur rejections dikhate hain. Sirf aapke account ka data count hota hai.",
    "nav-today",
  ),
  step(
    "goals",
    "/today",
    "daily-goals",
    "Keep a steady daily pace",
    "Track applications, direct outreach, follow-ups, and network actions against your own daily targets. You can adjust the targets in Daily activity.",
    "Applications, direct outreach, follow-ups aur networking ke daily targets yahan nazar aate hain. Targets Daily activity page se change hote hain.",
    "nav-today",
  ),
  step(
    "first-message",
    "/today",
    "queue-first_message",
    "Message nahi kiya",
    "A contact appears here when you have saved their name but have not marked a message as sent. Open Write message, personalize and copy the text, send it yourself, then mark it messaged.",
    "Contact ka naam save ho aur message sent mark na hua ho to woh yahan aayega. Write message kholo, text edit/copy karo, khud send karo, phir Mark messaged dabao.",
    "nav-today",
  ),
  step(
    "followup-one",
    "/today",
    "queue-followup1",
    "Your first follow-up",
    `A first follow-up becomes due ${FOLLOWUP_1_DAYS} calendar days after your message. The badge shows how late it is. Mark it done only after you send it.`,
    `Pehle message ke ${FOLLOWUP_1_DAYS} din baad follow-up due hota hai. Badge overdue din dikhata hai. Send karne ke baad hi done mark karein.`,
    "nav-today",
  ),
  step(
    "followup-two",
    "/today",
    "queue-followup2",
    "One last check-in",
    `The second follow-up becomes due ${FOLLOWUP_2_DAYS} calendar days after the first. Replied or later stages, Rejected, Ghosted, and Withdrawn applications leave the follow-up queues. Use Reply aaya when they answer, or Chhor do to stop chasing someone. Empty queues simply mean nothing is due.`,
    `Pehle follow-up ke ${FOLLOWUP_2_DAYS} din baad doosra due hota hai. Reply aane ke baad wale status, Rejected, Ghosted aur Withdrawn follow-up queues se nikal jate hain. Jawab aaye to Reply aaya dabayein, kisi ko chhorna ho to Chhor do. Khali section ka matlab abhi kuch due nahi.`,
    "nav-today",
  ),
  step(
    "import",
    "/applications",
    "applications-import",
    "Bring your existing tracker",
    "Import an Excel workbook or CSV. Review applications, contacts, interview notes, daily logs, and likely duplicates before confirming. Nothing is imported during this tutorial.",
    "Excel workbook ya CSV import karein. Confirm karne se pehle records, interview notes, daily logs aur duplicates ka preview milega. Tutorial khud koi data import nahi karta.",
    "nav-applications",
  ),
  step(
    "filters",
    "/applications",
    "applications-filters",
    "Find the right opportunity",
    "Search by company, role, contact, location, or notes. Narrow the list by status, work type, and source. Clear the filters to see everything again.",
    "Company, role, contact, location ya notes se search karein. Status, work type aur source ke filters lagayein; clear karne se sab records wapas dikhte hain.",
    "nav-applications",
  ),
  step(
    "board",
    "/applications",
    "applications-view",
    "Table or board: your choice",
    "Use Table for details and Board for a visual pipeline. A status dropdown moves an opportunity between stages. Export CSV downloads the applications matching your filters.",
    "Details ke liye Table aur visual pipeline ke liye Board use karein. Status dropdown se stage badalta hai. Export CSV aapki filtered applications download karta hai.",
    "nav-applications",
  ),
  step(
    "records",
    "/applications",
    "applications-list",
    "Keep the full story",
    "Click a company or pencil to edit its details. Screening, Interview, and Result retain earlier progress when the current status changes. The trash button asks for confirmation before deleting.",
    "Company ya pencil par click karke details edit karein. Screening, Interview aur Result purani progress sambhal ke rakhte hain. Delete se pehle confirmation aati hai.",
    "nav-applications",
  ),
  step(
    "contacts",
    "/contacts",
    "contacts-list",
    "Build your outreach list",
    "Keep founders, recruiters, and other contacts here, including people you reach out to without a job posting. Save why you targeted them, their profile, replies, and message draft.",
    "Founders, recruiters aur doosre outreach contacts yahan save karein, chahe job post na bhi ho. Profile, reach out karne ki wajah, reply aur message draft sab yahan rehta hai.",
    "nav-contacts",
  ),
  step(
    "outreach",
    "/contacts",
    "contacts-overview",
    "Follow through on conversations",
    "Add a contact from this page. The message icon opens a draft you can copy and send. Mark it sent afterward; the next-action column and Today will surface its follow-ups.",
    "Yahan se contact add hota hai. Message icon se draft kholo aur copy karke send karo. Uske baad sent mark karein; follow-ups next-action column aur Today par aa jayenge.",
    "nav-contacts",
  ),
  step(
    "interviews",
    "/interviews",
    "interviews-journal",
    "Turn interviews into useful notes",
    "Log the stage, date, questions, your answer, mistakes, corrected answers, and a preparation action. You can link an application. Update its application status separately when the hiring process changes.",
    "Interview ki date, stage, questions, apna answer, mistakes, correct answers aur next preparation action likhein. Application link bhi kar sakte hain. Hiring status application mein alag update karein.",
    "nav-interviews",
  ),
  step(
    "daily-targets",
    "/activity",
    "activity-controls",
    "Choose your own targets",
    "Targets changes the daily goals. Log activity records work you did outside the tracker, including network actions and hiring outcomes. A target of zero turns that goal off.",
    "Targets se daily goals change karein. Log activity mein tracker ke bahar ki networking aur hiring outcomes record karein. Kisi target ko 0 karne se woh goal off ho jata hai.",
    "nav-activity",
  ),
  step(
    "daily-history",
    "/activity",
    "activity-history",
    "Automatic counts, editable totals",
    "Applications, outreach messages, and follow-ups are counted from their dates. A saved manual total replaces that metric's automatic count for the day. A blank uses the automatic count; zero deliberately means zero.",
    "Application, outreach aur follow-up ki dates se counts bante hain. Manual total us din ka automatic count replace karta hai. Blank rakhein to auto count use hoga; 0 likhein to total zero hoga.",
    "nav-activity",
  ),
  step(
    "funnel",
    "/funnel",
    "funnel-report",
    "Understand where things progress",
    "Follow the application funnel from applications to replies, screenings, interviews, and offers. The seven-day chart shows your recent actions. Outreach has its own response rate.",
    "Applications se replies, screening, interviews aur offers tak progress dekhein. Seven-day chart recent actions dikhata hai. Outreach ka response rate alag hota hai.",
    "nav-funnel",
  ),
  step(
    "sources",
    "/funnel",
    "funnel-sources",
    "See which sources work for you",
    "Compare sources using your applied applications, replies, interviews, offers, and response rates. Keeping Source updated on every application makes this report more useful.",
    "Sources ko applications, replies, interviews, offers aur response rate se compare karein. Har application ka Source update rakhne se yeh report zyada useful hogi.",
    "nav-funnel",
  ),
  step(
    "templates",
    "/templates",
    "templates-library",
    "Keep useful words ready",
    "Templates are grouped into first message, follow-up 1, and follow-up 2. {name} becomes the contact's first name; {company} and {role} use the application details.",
    "Templates first message, follow-up 1 aur follow-up 2 mein grouped hain. {name} contact ka first name banta hai; {company} aur {role} application se fill hote hain.",
    "nav-templates",
  ),
  step(
    "template-edit",
    "/templates",
    "templates-create",
    "Make the messages sound like you",
    "Create multiple templates for a step, or edit and delete existing ones. In Today's message drawer, choose a template, edit the personalized text, and copy it. Copying does not send or mark a message as done.",
    "Har step ke multiple templates bana, edit ya delete kar sakte hain. Today ke message drawer mein template choose karke personalized text edit aur copy karein. Copy se message send ya done mark nahi hota.",
    "nav-templates",
  ),
  step(
    "privacy",
    "/today",
    "account-profile",
    "Your own private workspace",
    "The signed-in account owns its applications, contacts, notes, activity, and templates. Use the logout icon when you are finished, especially on a shared device.",
    "Signed-in account ki applications, contacts, notes, activity aur templates usi account ke hain. Kaam ke baad logout karein, khaas taur par shared device par.",
    "nav-today",
  ),
  step(
    "replay",
    "/today",
    "tutorial-launcher",
    "You can always come back",
    "This Tutorial button is available throughout the app. Replay whenever you need it. Next continues, Skip step moves on, and Skip all or Escape closes the tour. Your records are never changed by the tutorial.",
    "Tutorial button poori app mein available hai. Zaroorat par dobara chala sakte hain. Next agay le jata hai, Skip step current step chhorta hai, aur Skip all ya Escape tour band karta hai. Tutorial aapka data change nahi karta.",
    "nav-today",
  ),
];
export const LANDING_TUTORIAL: TutorialStep[] = [
  step(
    "welcome",
    "/",
    "landing-hero",
    "A clearer next step",
    "Career Pipeline brings applications, outreach, follow-ups, interview notes, and daily progress into one private workspace. This preview uses sample content.",
    "Career Pipeline applications, outreach, follow-ups, interview notes aur daily progress ko ek private workspace mein rakhta hai. Is preview mein sample content hai.",
  ),
  step(
    "preview",
    "/",
    "landing-preview",
    "Start with what needs attention",
    `Today separates contacts you haven't messaged, follow-up 1 after ${FOLLOWUP_1_DAYS} days, and follow-up 2 after ${FOLLOWUP_2_DAYS} more days. Open a message, personalize it, copy it, send it yourself, and mark it done.`,
    `Today un contacts ko dikhata hai jinhein message nahi kiya, ${FOLLOWUP_1_DAYS} din baad pehla follow-up aur uske ${FOLLOWUP_2_DAYS} din baad doosra. Message edit/copy karke khud send karein, phir done mark karein.`,
  ),
  step(
    "applications",
    "/",
    "landing-applications",
    "Keep every opportunity organized",
    "Add applications manually or import Excel/CSV with a preview and duplicate checks. Search and filter the records, switch between table and board, and update the status as you progress.",
    "Application manually add karein ya preview aur duplicate checks ke saath Excel/CSV import karein. Search/filter, table/board view aur status updates sab available hain.",
  ),
  step(
    "outreach",
    "/",
    "landing-contacts",
    "Make room for outreach",
    "Track people you contact outside a job posting. Keep their profile, why you targeted them, your draft, replies, and follow-up dates together.",
    "Job posting ke baghair ki hui outreach bhi track karein. Contact ki profile, reach out karne ki wajah, draft, reply aur follow-up dates ek jagah rakhein.",
  ),
  step(
    "interviews",
    "/",
    "landing-interviews",
    "Learn from each interview",
    "Save questions, what happened, what to improve, corrected answers, and a preparation action before the next conversation.",
    "Interview questions, kya hua, kya improve karna hai, correct answers aur agle interview ki preparation action save karein.",
  ),
  step(
    "activity",
    "/",
    "landing-activity",
    "Pick a daily pace",
    "Set targets for applications, outreach, follow-ups, and network actions. Automatic counts and editable daily totals keep the picture useful.",
    "Applications, outreach, follow-ups aur networking ke targets set karein. Automatic counts aur editable daily totals se progress clear rahegi.",
  ),
  step(
    "funnel",
    "/",
    "landing-funnel",
    "See what is working",
    "Your funnel shows how applications progress toward offers. Source reporting compares the channels that bring replies and interviews.",
    "Funnel applications se offers tak ki progress dikhata hai. Source report batati hai kin channels se replies aur interviews aa rahe hain.",
  ),
  step(
    "templates",
    "/",
    "landing-templates",
    "Start with a useful draft",
    "Save reusable first messages and follow-ups. Names, companies, and roles fill in from your application. Edit the text before copying it.",
    "First message aur follow-ups ke reusable templates save karein. Name, company aur role application se fill hote hain. Copy se pehle text edit kar sakte hain.",
  ),
  step(
    "privacy",
    "/",
    "landing-privacy",
    "A workspace for your account",
    "Sign up with email and password and confirm your email. Each account has its own tracker, records, goals, and templates.",
    "Email/password se signup karein aur email confirm karein. Har account ka apna tracker, records, goals aur templates hote hain.",
  ),
  step(
    "start",
    "/",
    "landing-start",
    "Ready to try it?",
    "Create your account to use the tracker. The Tutorial button inside your workspace gives you a more detailed tour of the real controls. You can skip a step or close a tour anytime.",
    "Tracker use karne ke liye account banayein. Workspace ka Tutorial button asli controls ka detailed tour deta hai. Har step skip ya poora tour kabhi bhi band kar sakte hain.",
  ),
];
export type TutorialProgress = {
  version: 1;
  index: number;
  language: TutorialLanguage;
  status: "in_progress" | "completed" | "skipped";
};
export function tutorialStorageKey(
  mode: TutorialMode,
  userId?: string,
): string {
  if (mode === "workspace" && !userId)
    throw new Error("Workspace tutorials require an account.");
  return `career-pipeline:tutorial:v1:${mode}:${mode === "workspace" ? userId : "visitor"}`;
}
export function parseTutorialProgress(
  value: string | null,
  count: number,
): TutorialProgress | null {
  try {
    const item = JSON.parse(value || "null");
    if (
      !item ||
      item.version !== 1 ||
      !Number.isInteger(item.index) ||
      item.index < 0 ||
      item.index >= count ||
      !["en", "roman"].includes(item.language) ||
      !["in_progress", "completed", "skipped"].includes(item.status)
    )
      return null;
    return item as TutorialProgress;
  } catch {
    return null;
  }
}
export type TourBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};
export type TourViewport = { width: number; height: number };
export function spotlightBox(
  rect: TourBox,
  viewport: TourViewport,
  padding = 8,
): TourBox | null {
  if (
    ![
      rect.left,
      rect.top,
      rect.width,
      rect.height,
      viewport.width,
      viewport.height,
    ].every(Number.isFinite) ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    viewport.width <= 16 ||
    viewport.height <= 16
  )
    return null;
  const clamp = (value: number, max: number) =>
    Math.max(8, Math.min(max - 8, Math.round(value)));
  const left = clamp(rect.left - padding, viewport.width),
    top = clamp(rect.top - padding, viewport.height);
  const right = clamp(rect.left + rect.width + padding, viewport.width),
    bottom = clamp(rect.top + rect.height + padding, viewport.height);
  return right > left && bottom > top
    ? { left, top, width: right - left, height: bottom - top }
    : null;
}
export function tutorialPanelPosition(
  box: TourBox | null,
  viewport: TourViewport,
  panel: { width: number; height: number },
): TourBox {
  const width = Math.max(1, Math.min(panel.width, viewport.width - 24));
  const height = Math.max(1, Math.min(panel.height, viewport.height - 24));
  const keepX = (x: number) =>
    Math.max(12, Math.min(viewport.width - width - 12, x));
  const keepY = (y: number) =>
    Math.max(12, Math.min(viewport.height - height - 12, y));
  if (!box)
    return {
      left: keepX((viewport.width - width) / 2),
      top: keepY((viewport.height - height) / 2),
      width,
      height,
    };
  if (viewport.width <= 680)
    return {
      left: 12,
      top: keepY(viewport.height - height - 12),
      width,
      height,
    };
  const gap = 20;
  let left: number;
  let top: number;
  if (box.left + box.width + gap + width <= viewport.width - 12) {
    left = box.left + box.width + gap;
    top = box.top + box.height / 2 - height / 2;
  } else if (box.left - gap - width >= 12) {
    left = box.left - gap - width;
    top = box.top + box.height / 2 - height / 2;
  } else if (box.top + box.height + gap + height <= viewport.height - 12) {
    left = box.left + box.width / 2 - width / 2;
    top = box.top + box.height + gap;
  } else if (box.top - gap - height >= 12) {
    left = box.left + box.width / 2 - width / 2;
    top = box.top - gap - height;
  } else {
    left = viewport.width - width - 20;
    top = viewport.height - height - 20;
  }
  return { left: keepX(left), top: keepY(top), width, height };
}
