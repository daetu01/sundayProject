"use client";

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform
} from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent
} from "react";

type WindowId =
  | "main"
  | "detail"
  | "compose"
  | "insights"
  | "quicklook"
  | "spotlight";

type Post = {
  id: number;
  author: string;
  handle: string;
  time: string;
  image: string;
  caption: string;
  calories: string;
  macros: string;
  likes: number;
  comments: number;
};

type ContextMenuState = {
  x: number;
  y: number;
  postId: number;
} | null;

type MainWindowState = {
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  minimizing: boolean;
  fullscreen: boolean;
  storedFrame: { x: number; y: number; width: number; height: number } | null;
};

type FloatingWindowState = {
  x: number;
  y: number;
};

type SpotlightResult = {
  id: string;
  title: string;
  subtitle: string;
  calories: string;
  macros: string;
  image: string;
  source: "history" | "database";
  postId?: number;
};

const menuItems = [
  { label: "Home", badge: "08" },
  { label: "Meal Log", badge: "24" },
  { label: "Friends", badge: "12" },
  { label: "Challenges", badge: "03" },
  { label: "Insights", badge: "AI" }
] as const;

const stats = [
  { label: "Today", value: "1,540 kcal" },
  { label: "Protein", value: "118 g" },
  { label: "Water", value: "2.1 L" }
];

const activityRings = [
  {
    key: "calories",
    label: "Calories",
    value: 1540,
    goal: 1800,
    color: "#ff5f57",
    glow: "rgba(255,95,87,0.34)"
  },
  {
    key: "carbs",
    label: "Carbs",
    value: 162,
    goal: 220,
    color: "#34d399",
    glow: "rgba(52,211,153,0.3)"
  },
  {
    key: "protein",
    label: "Protein",
    value: 118,
    goal: 110,
    color: "#67e8f9",
    glow: "rgba(103,232,249,0.45)"
  }
];

const weeklyWeights = [
  { day: "Mon", weight: 66.4 },
  { day: "Tue", weight: 66.1 },
  { day: "Wed", weight: 65.9 },
  { day: "Thu", weight: 65.7 },
  { day: "Fri", weight: 65.6 },
  { day: "Sat", weight: 65.4 },
  { day: "Sun", weight: 65.3 }
];

const dockApps = [
  { id: "feed", label: "Feed", symbol: "F", running: true },
  { id: "compose", label: "Write", symbol: "+", running: false },
  { id: "insights", label: "Charts", symbol: "I", running: false },
  { id: "reminder", label: "Alerts", symbol: "!", running: true },
  { id: "quicklook", label: "Preview", symbol: "Q", running: false }
] as const;

const initialPosts = [
  {
    id: 1,
    author: "Sena Kim",
    handle: "@greenplate",
    time: "12 min ago",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    caption:
      "점심은 퀴노아 샐러드와 구운 연어로 가볍게. 상큼한 시트러스 드레싱 덕분에 질리지 않고 먹기 좋았어요.",
    calories: "520 kcal",
    macros: "P 36g  C 42g  F 18g",
    likes: 128,
    comments: 18
  },
  {
    id: 2,
    author: "Jiwon Park",
    handle: "@fitfork",
    time: "48 min ago",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    caption:
      "아침은 베리 오트볼. 당은 낮추고 포만감은 오래 가게 견과류랑 그릭요거트를 추가했어요.",
    calories: "410 kcal",
    macros: "P 21g  C 51g  F 12g",
    likes: 94,
    comments: 11
  },
  {
    id: 3,
    author: "Minho Lee",
    handle: "@mealframe",
    time: "1 hr ago",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
    caption:
      "저녁은 닭가슴살 스테이크와 로스트 베지. 심플하지만 칼로리 계산이 쉬워서 루틴 식단으로 자주 먹습니다.",
    calories: "630 kcal",
    macros: "P 47g  C 34g  F 24g",
    likes: 176,
    comments: 24
  }
] satisfies Post[];

function GlassPanel({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[30px] ${className}`}>
      <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.06)_22%,rgba(255,255,255,0.02)_55%,rgba(103,232,249,0.18)_100%)] p-px">
        <div className="h-full w-full rounded-[29px] bg-transparent" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function ActivityRings() {
  return (
    <GlassPanel className="bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.04))]">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white/[0.84]">Activity Rings</p>
            <p className="mt-1 text-xs text-white/[0.5]">
              Calories, carbs, protein
            </p>
          </div>
          <div className="rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/[0.46]">
            Apple Watch
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="relative h-52 w-52">
            <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
              {activityRings.map((ring, index) => {
                const radius = 84 - index * 18;
                const circumference = 2 * Math.PI * radius;
                const progress = Math.min(ring.value / ring.goal, 1);
                const isComplete = ring.value >= ring.goal;

                return (
                  <g key={ring.key}>
                    <circle
                      cx="110"
                      cy="110"
                      r={radius}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="12"
                    />
                    <motion.circle
                      cx="110"
                      cy="110"
                      r={radius}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth="12"
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: circumference }}
                      animate={{
                        strokeDashoffset: circumference * (1 - progress)
                      }}
                      transition={{
                        duration: 1.1,
                        delay: 0.14 * index,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      style={{
                        strokeDasharray: circumference,
                        filter: isComplete
                          ? `drop-shadow(0 0 10px ${ring.glow}) drop-shadow(0 0 22px ${ring.glow})`
                          : `drop-shadow(0 0 8px ${ring.glow})`
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/[0.42]">
                Move
              </p>
              <p className="mt-1 text-3xl font-semibold text-white/[0.94]">87%</p>
              <p className="mt-1 text-xs text-white/[0.52]">Goal trend steady</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {activityRings.map((ring) => {
            const percentage = Math.round((ring.value / ring.goal) * 100);
            const isComplete = ring.value >= ring.goal;

            return (
              <div
                key={ring.key}
                className="rounded-2xl border border-white/[0.1] bg-black/[0.12] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{
                        backgroundColor: ring.color,
                        boxShadow: isComplete ? `0 0 16px ${ring.glow}` : "none"
                      }}
                    />
                    <p className="text-sm font-medium text-white/[0.82]">
                      {ring.label}
                    </p>
                  </div>
                  <p className="text-sm text-white/[0.6]">
                    {ring.value} / {ring.goal}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-white/[0.44]">
                    {isComplete ? "Goal reached" : "In progress"}
                  </p>
                  <p
                    className="text-xs font-semibold"
                    style={{
                      color: isComplete ? ring.color : "rgba(255,255,255,0.68)",
                      textShadow: isComplete ? `0 0 12px ${ring.glow}` : "none"
                    }}
                  >
                    {percentage}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [hoveredPost, setHoveredPost] = useState<Post | null>(null);
  const [quickLookPost, setQuickLookPost] = useState<Post | null>(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [spotlightResults, setSpotlightResults] = useState<SpotlightResult[]>([]);
  const [spotlightActiveIndex, setSpotlightActiveIndex] = useState(0);
  const [isSpotlightLoading, setIsSpotlightLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [viewport, setViewport] = useState({ width: 1440, height: 980 });
  const [activeWindow, setActiveWindow] = useState<WindowId>("main");
  const [windowOrder, setWindowOrder] = useState<WindowId[]>([
    "main",
    "detail",
    "compose",
    "insights",
    "quicklook",
    "spotlight"
  ]);
  const [composeAuthor, setComposeAuthor] = useState("You");
  const [composeHandle, setComposeHandle] = useState("@yourplate");
  const [composeCaption, setComposeCaption] = useState("");
  const [composeCalories, setComposeCalories] = useState("");
  const [composeMacros, setComposeMacros] = useState("");
  const [composeImage, setComposeImage] = useState("");
  const [isSystemDark, setIsSystemDark] = useState(true);
  const [detailWindow, setDetailWindow] = useState<FloatingWindowState>({
    x: 140,
    y: 120
  });
  const [composeWindow, setComposeWindow] = useState<FloatingWindowState>({
    x: 220,
    y: 110
  });
  const [insightsWindow, setInsightsWindow] = useState<FloatingWindowState>({
    x: 120,
    y: 90
  });
  const [quickLookWindow, setQuickLookWindow] = useState<FloatingWindowState>({
    x: 130,
    y: 100
  });
  const [spotlightWindow, setSpotlightWindow] = useState<FloatingWindowState>({
    x: 260,
    y: 84
  });
  const [mainWindow, setMainWindow] = useState<MainWindowState>({
    x: 0,
    y: 0,
    width: 1180,
    height: 780,
    minimized: false,
    minimizing: false,
    fullscreen: false,
    storedFrame: null
  });
  const [dockMouseX, setDockMouseX] = useState<number | null>(null);
  const [bouncingDockItem, setBouncingDockItem] = useState<string | null>(null);
  const dockRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const windowDragRef = useRef<{
    id: Exclude<WindowId, "main"> | null;
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  }>({
    id: null,
    pointerX: 0,
    pointerY: 0,
    startX: 0,
    startY: 0
  });
  const dragStateRef = useRef<{
    type: "drag" | "resize" | null;
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    type: null,
    pointerX: 0,
    pointerY: 0,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0
  });

  const meshX = useMotionValue(0.5);
  const meshY = useMotionValue(0.35);
  const meshXSpring = useSpring(meshX, { stiffness: 120, damping: 20, mass: 0.9 });
  const meshYSpring = useSpring(meshY, { stiffness: 120, damping: 20, mass: 0.9 });
  const meshBackground = useMotionTemplate`
    radial-gradient(circle at ${useTransform(meshXSpring, (value) => `${value * 100}%`)} ${useTransform(
      meshYSpring,
      (value) => `${value * 100}%`
    )}, rgba(103,232,249,0.22), transparent 28%),
    radial-gradient(circle at ${useTransform(meshXSpring, (value) => `${85 - value * 28}%`)} ${useTransform(
      meshYSpring,
      (value) => `${18 + value * 42}%`
    )}, rgba(255,95,87,0.16), transparent 26%),
    radial-gradient(circle at ${useTransform(meshXSpring, (value) => `${24 + value * 36}%`)} ${useTransform(
      meshYSpring,
      (value) => `${78 - value * 18}%`
    )}, rgba(52,211,153,0.18), transparent 24%)
  `;

  const elasticScroll = useMotionValue(0);
  const elasticSpring = useSpring(elasticScroll, {
    stiffness: 130,
    damping: 24,
    mass: 0.65
  });
  const feedShift = useTransform(elasticSpring, (value) => value * -0.035);

  const playSystemClick = (frequency = 880, duration = 0.045) => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.03,
      audioContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);

    window.setTimeout(() => {
      void audioContext.close().catch(() => undefined);
    }, Math.ceil((duration + 0.05) * 1000));
  };

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short"
    });

    const updateTime = () => setCurrentTime(formatter.format(new Date()));

    updateTime();
    const interval = window.setInterval(updateTime, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (viewport.width < 1 || mainWindow.fullscreen) {
      return;
    }

    setMainWindow((current) => ({
      ...current,
      x: Math.max(
        -current.width + 220,
        Math.min(current.x, viewport.width - 180)
      ),
      y: Math.max(
        44,
        Math.min(current.y, viewport.height - 110)
      )
    }));
  }, [mainWindow.fullscreen, viewport.height, viewport.width]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) =>
      setIsSystemDark(event.matches);

    setIsSystemDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current.type || mainWindow.fullscreen) {
        if (!windowDragRef.current.id) {
          return;
        }
      }

      if (windowDragRef.current.id) {
        const deltaX = event.clientX - windowDragRef.current.pointerX;
        const deltaY = event.clientY - windowDragRef.current.pointerY;
        const nextPosition = {
          x: Math.max(
            -420,
            Math.min(windowDragRef.current.startX + deltaX, viewport.width - 140)
          ),
          y: Math.max(
            48,
            Math.min(windowDragRef.current.startY + deltaY, viewport.height - 120)
          )
        };

        if (windowDragRef.current.id === "detail") {
          setDetailWindow(nextPosition);
        } else if (windowDragRef.current.id === "compose") {
          setComposeWindow(nextPosition);
        } else if (windowDragRef.current.id === "insights") {
          setInsightsWindow(nextPosition);
        } else if (windowDragRef.current.id === "quicklook") {
          setQuickLookWindow(nextPosition);
        } else if (windowDragRef.current.id === "spotlight") {
          setSpotlightWindow(nextPosition);
        }

        return;
      }

      const deltaX = event.clientX - dragStateRef.current.pointerX;
      const deltaY = event.clientY - dragStateRef.current.pointerY;

      if (dragStateRef.current.type === "drag") {
        setMainWindow((current) => ({
          ...current,
          x: Math.max(
            -current.width + 220,
            Math.min(
              dragStateRef.current.startX + deltaX,
              viewport.width - 180
            )
          ),
          y: Math.max(
            44,
            Math.min(
              dragStateRef.current.startY + deltaY,
              viewport.height - 110
            )
          )
        }));
        return;
      }

      setMainWindow((current) => ({
        ...current,
        width: Math.max(
          920,
          Math.min(dragStateRef.current.startWidth + deltaX, viewport.width - 20)
        ),
        height: Math.max(
          640,
          Math.min(dragStateRef.current.startHeight + deltaY, viewport.height - 110)
        )
      }));
    };

    const handlePointerUp = () => {
      dragStateRef.current.type = null;
      windowDragRef.current.id = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [mainWindow.fullscreen, viewport.height, viewport.width]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        setContextMenu(null);
        setSelectedPost(null);
        setQuickLookPost(null);
        setIsSidebarOpen(false);
        setIsComposeOpen(false);
        setIsInsightsOpen(false);
        setIsSpotlightOpen(false);
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        playSystemClick(1080, 0.04);
        setIsSpotlightOpen(true);
        focusWindow("spotlight");
        return;
      }

      if (event.code === "Space" && !isTyping && hoveredPost) {
        event.preventDefault();
        playSystemClick(980, 0.04);
        setQuickLookPost((current) =>
          current?.id === hoveredPost.id ? null : hoveredPost
        );
        setActiveWindow("quicklook");
      }
    };

    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hoveredPost]);

  useEffect(() => {
    setSpotlightActiveIndex(0);
  }, [spotlightResults]);

  const feedSummary = useMemo(() => {
    const totalCalories = posts.reduce((sum, post) => {
      const value = Number.parseInt(post.calories.replace(/[^0-9]/g, ""), 10);
      return sum + value;
    }, 0);

    return {
      postCount: posts.length,
      totalCalories: `${totalCalories.toLocaleString()} kcal`
    };
  }, [posts]);

  const historySpotlightResults = useMemo<SpotlightResult[]>(() => {
    const keyword = spotlightQuery.trim().toLowerCase();

    if (!keyword) {
      return posts.slice(0, 5).map((post) => ({
        id: `history-${post.id}`,
        title: post.caption.split(".")[0] || post.caption,
        subtitle: `${post.author} · ${post.handle}`,
        calories: post.calories,
        macros: post.macros,
        image: post.image,
        source: "history",
        postId: post.id
      }));
    }

    return posts
      .filter((post) =>
        [post.author, post.handle, post.caption, post.macros]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      )
      .slice(0, 5)
      .map((post) => ({
        id: `history-${post.id}`,
        title: post.caption.split(".")[0] || post.caption,
        subtitle: `${post.author} · ${post.handle}`,
        calories: post.calories,
        macros: post.macros,
        image: post.image,
        source: "history",
        postId: post.id
      }));
  }, [posts, spotlightQuery]);

  useEffect(() => {
    if (!isSpotlightOpen) {
      return;
    }

    const query = spotlightQuery.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      if (!query) {
        setSpotlightResults(historySpotlightResults);
        setIsSpotlightLoading(false);
        return;
      }

      setIsSpotlightLoading(true);

      try {
        const response = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
            query
          )}&search_simple=1&action=process&json=1&page_size=6`,
          {
            signal: controller.signal
          }
        );
        const data = (await response.json()) as {
          products?: Array<{
            code?: string;
            product_name?: string;
            brands?: string;
            image_front_small_url?: string;
            nutriments?: {
              "energy-kcal_100g"?: number;
              proteins_100g?: number;
              carbohydrates_100g?: number;
              fat_100g?: number;
            };
          }>;
        };

        const remoteResults: SpotlightResult[] = (data.products ?? [])
          .filter((product) => product.product_name)
          .slice(0, 6)
          .map((product, index) => {
            const kcal = Math.round(product.nutriments?.["energy-kcal_100g"] ?? 120);
            const protein = Math.round(product.nutriments?.proteins_100g ?? 6);
            const carbs = Math.round(product.nutriments?.carbohydrates_100g ?? 14);
            const fat = Math.round(product.nutriments?.fat_100g ?? 4);

            return {
              id: `db-${product.code ?? index}`,
              title: product.product_name ?? "Unknown food",
              subtitle: product.brands
                ? `${product.brands} · Open Food Facts`
                : "Open Food Facts database",
              calories: `${kcal} kcal`,
              macros: `P ${protein}g  C ${carbs}g  F ${fat}g`,
              image:
                product.image_front_small_url ||
                "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80",
              source: "database"
            };
          });

        setSpotlightResults([
          ...historySpotlightResults,
          ...remoteResults.filter(
            (remote) =>
              !historySpotlightResults.some(
                (local) => local.title.toLowerCase() === remote.title.toLowerCase()
              )
          )
        ]);
      } catch {
        setSpotlightResults(historySpotlightResults);
      } finally {
        setIsSpotlightLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [historySpotlightResults, isSpotlightOpen, spotlightQuery]);

  const searchResults = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      return [];
    }

    return posts
      .filter((post) => {
        const searchableText = [post.author, post.handle, post.caption]
          .join(" ")
          .toLowerCase();
        return searchableText.includes(keyword);
      })
      .slice(0, 5);
  }, [posts, searchQuery]);

  const incrementMetric = (postId: number, metric: "likes" | "comments") => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId ? { ...post, [metric]: post[metric] + 1 } : post
      )
    );

    setSelectedPost((currentSelectedPost) =>
      currentSelectedPost && currentSelectedPost.id === postId
        ? { ...currentSelectedPost, [metric]: currentSelectedPost[metric] + 1 }
        : currentSelectedPost
    );
  };

  const clearSearch = () => setSearchQuery("");

  const resetCompose = () => {
    setComposeAuthor("You");
    setComposeHandle("@yourplate");
    setComposeCaption("");
    setComposeCalories("");
    setComposeMacros("");
    setComposeImage("");
  };

  const closeCompose = () => {
    setIsComposeOpen(false);
    resetCompose();
  };

  const handleComposeImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setComposeImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = () => {
    if (!composeCaption.trim() || !composeImage || !composeCalories.trim()) {
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      author: composeAuthor.trim() || "You",
      handle: composeHandle.trim() || "@yourplate",
      time: "Just now",
      image: composeImage,
      caption: composeCaption.trim(),
      calories: composeCalories.includes("kcal")
        ? composeCalories.trim()
        : `${composeCalories.trim()} kcal`,
      macros: composeMacros.trim() || "P 24g  C 32g  F 12g",
      likes: 0,
      comments: 0
    };

    playSystemClick(1180, 0.055);
    setPosts((currentPosts) => [newPost, ...currentPosts]);
    closeCompose();
  };

  const addSpotlightResultToToday = (result: SpotlightResult) => {
    const originalPost =
      result.source === "history" && result.postId
        ? posts.find((post) => post.id === result.postId)
        : null;

    const newPost: Post = {
      id: Date.now(),
      author: originalPost?.author ?? "Spotlight Result",
      handle: originalPost?.handle ?? "@food-db",
      time: "Just now",
      image: result.image,
      caption: originalPost?.caption ?? `${result.title}를 Spotlight 검색으로 오늘 식단에 추가했어요.`,
      calories: originalPost?.calories ?? result.calories,
      macros: originalPost?.macros ?? result.macros,
      likes: 0,
      comments: 0
    };

    playSystemClick(1220, 0.05);
    setPosts((currentPosts) => [newPost, ...currentPosts]);
    setIsSpotlightOpen(false);
    setSpotlightQuery("");
    setSpotlightResults([]);
    setHoveredPost(newPost);
  };

  const handleFeedScroll = (event: React.UIEvent<HTMLDivElement>) => {
    elasticScroll.set(event.currentTarget.scrollTop);
    setContextMenu(null);
  };

  const handleContextMenu = (
    event: ReactMouseEvent<HTMLElement>,
    postId: number
  ) => {
    event.preventDefault();
    playSystemClick(720, 0.035);
    setContextMenu({
      x: Math.min(event.clientX, viewport.width - 240),
      y: Math.min(event.clientY, viewport.height - 180),
      postId
    });
  };

  const handleDeletePost = (postId: number) => {
    playSystemClick(520, 0.05);
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
    setSelectedPost((currentSelectedPost) =>
      currentSelectedPost?.id === postId ? null : currentSelectedPost
    );
    setQuickLookPost((currentQuickLook) =>
      currentQuickLook?.id === postId ? null : currentQuickLook
    );
    setContextMenu(null);
  };

  const handleEditCalories = (postId: number) => {
    const targetPost = posts.find((post) => post.id === postId);
    if (!targetPost) {
      return;
    }

    const nextCalories = window.prompt(
      "칼로리를 수정하세요",
      targetPost.calories.replace(" kcal", "")
    );

    if (!nextCalories?.trim()) {
      setContextMenu(null);
      return;
    }

    const normalizedCalories = nextCalories.includes("kcal")
      ? nextCalories.trim()
      : `${nextCalories.trim()} kcal`;

    playSystemClick(980, 0.045);
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId ? { ...post, calories: normalizedCalories } : post
      )
    );
    setSelectedPost((currentSelectedPost) =>
      currentSelectedPost?.id === postId
        ? { ...currentSelectedPost, calories: normalizedCalories }
        : currentSelectedPost
    );
    setContextMenu(null);
  };

  const handleContextAction = (action: "view" | "edit" | "delete") => {
    if (!contextMenu) {
      return;
    }

    if (action === "view") {
      const targetPost = posts.find((post) => post.id === contextMenu.postId) ?? null;
      playSystemClick(930, 0.04);
      setSelectedPost(targetPost);
      setActiveWindow("detail");
      setContextMenu(null);
      return;
    }

    if (action === "edit") {
      handleEditCalories(contextMenu.postId);
      return;
    }

    handleDeletePost(contextMenu.postId);
  };

  const handleMenuClick = (label: string) => {
    playSystemClick(900, 0.045);

    if (label === "Insights") {
      setIsInsightsOpen(true);
      setIsSidebarOpen(false);
      setActiveWindow("insights");
      return;
    }

    if (label === "Home") {
      setMainWindow((current) => ({ ...current, minimized: false }));
      setActiveWindow("main");
    }
  };

  const handleSpotlightKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (!spotlightResults.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSpotlightActiveIndex((current) =>
        Math.min(current + 1, spotlightResults.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSpotlightActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      addSpotlightResultToToday(spotlightResults[spotlightActiveIndex]);
    }
  };

  const startMainDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (mainWindow.fullscreen) {
      return;
    }

    setActiveWindow("main");
    dragStateRef.current = {
      type: "drag",
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: mainWindow.x,
      startY: mainWindow.y,
      startWidth: mainWindow.width,
      startHeight: mainWindow.height
    };
  };

  const startMainResize = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (mainWindow.fullscreen) {
      return;
    }

    event.stopPropagation();
    setActiveWindow("main");
    dragStateRef.current = {
      type: "resize",
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: mainWindow.x,
      startY: mainWindow.y,
      startWidth: mainWindow.width,
      startHeight: mainWindow.height
    };
  };

  const focusWindow = (id: WindowId) => {
    setActiveWindow(id);
    setWindowOrder((current) => [...current.filter((item) => item !== id), id]);
  };

  const getWindowZIndex = (id: WindowId) => 20 + windowOrder.indexOf(id) * 5;

  const startFloatingDrag = (
    id: Exclude<WindowId, "main">,
    event: ReactMouseEvent<HTMLDivElement>,
    position: FloatingWindowState
  ) => {
    focusWindow(id);
    windowDragRef.current = {
      id,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: position.x,
      startY: position.y
    };
  };

  const toggleFullscreen = () => {
    playSystemClick(1040, 0.045);
    setActiveWindow("main");
    setMainWindow((current) => {
      if (current.fullscreen && current.storedFrame) {
        return {
          ...current,
          ...current.storedFrame,
          fullscreen: false,
          storedFrame: null,
          minimized: false
        };
      }

      return {
        ...current,
        x: 10,
        y: 54,
        width: viewport.width - 20,
        height: viewport.height - 138,
        minimized: false,
        fullscreen: true,
        storedFrame: {
          x: current.x,
          y: current.y,
          width: current.width,
          height: current.height
        }
      };
    });
  };

  const minimizeMainWindow = () => {
    playSystemClick(640, 0.04);
    setMainWindow((current) => ({ ...current, minimizing: true }));
    window.setTimeout(() => {
      setMainWindow((current) => ({
        ...current,
        minimized: true,
        minimizing: false
      }));
    }, 380);
  };

  const restoreMainWindow = () => {
    playSystemClick(960, 0.04);
    setMainWindow((current) => ({
      ...current,
      minimized: false,
      minimizing: false
    }));
    focusWindow("main");
  };

  const handleDockAction = (appId: (typeof dockApps)[number]["id"]) => {
    setBouncingDockItem(appId);
    window.setTimeout(() => setBouncingDockItem(null), 420);
    playSystemClick(990, 0.04);

    if (appId === "feed") {
      restoreMainWindow();
      return;
    }

    if (appId === "compose") {
      setIsComposeOpen(true);
      setActiveWindow("compose");
      return;
    }

    if (appId === "insights") {
      setIsInsightsOpen(true);
      setActiveWindow("insights");
      return;
    }

    if (appId === "quicklook" && hoveredPost) {
      setQuickLookPost(hoveredPost);
      setActiveWindow("quicklook");
    }
  };

  const getDockScale = (id: string) => {
    if (dockMouseX === null) {
      return 1;
    }

    const node = dockRefs.current[id];
    if (!node) {
      return 1;
    }

    const rect = node.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = Math.abs(dockMouseX - center);
    const falloff = Math.max(0, 1 - distance / 130);
    return 1 + falloff * 0.72;
  };

  const feedDockRect = dockRefs.current.feed?.getBoundingClientRect();
  const mainGenieX = feedDockRect
    ? feedDockRect.left - viewport.width / 2 + feedDockRect.width / 2 - 12
    : 0;
  const mainGenieY = feedDockRect
    ? feedDockRect.top - viewport.height + feedDockRect.height / 2 + 42
    : 160;

  const shellTone = isSystemDark
    ? "bg-[rgba(6,10,18,0.84)]"
    : "bg-[rgba(31,41,55,0.78)]";

  const inactiveWindowClass = "opacity-[0.78] saturate-[0.92] blur-[0.4px]";

  const sidebarContent = (
    <>
      <GlassPanel className="bg-white/10">
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#9be7ff,#c8ffcb)] text-lg font-bold text-slate-900">
              SK
            </div>
            <div>
              <h1 className="text-lg font-semibold">Sena&apos;s Board</h1>
              <p className="text-sm text-white/[0.55]">
                Calm tracking, brighter habits
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {menuItems.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{
                  scale: 1.01,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  borderColor: "rgba(255,255,255,0.18)",
                  boxShadow: "0 10px 30px rgba(125, 211, 252, 0.08)"
                }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={() => handleMenuClick(item.label)}
                className="flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-left"
              >
                <span className="text-sm font-medium text-white/80">
                  {item.label}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/[0.55]">
                  {item.badge}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="mt-5 bg-white/[0.08]">
        <div className="p-5">
          <p className="text-sm font-semibold text-white/[0.78]">Daily Snapshot</p>
          <div className="mt-4 space-y-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                  {stat.label}
                </p>
                <p className="mt-1 text-base font-semibold text-white/[0.88]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <div className="mt-5">
        <ActivityRings />
      </div>
    </>
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#09111f] text-white transition-colors duration-500"
      onMouseMove={(event) => {
        meshX.set(event.clientX / viewport.width);
        meshY.set(event.clientY / viewport.height);
      }}
    >
      <motion.div
        animate={{ opacity: isSystemDark ? 1 : 0.82 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0"
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80')"
          }}
        />
        <motion.div className="absolute inset-0" style={{ backgroundImage: meshBackground }} />
        <div className="absolute inset-0 bg-aurora backdrop-blur-[2px]" />
        <div
          className={`absolute inset-0 transition-colors duration-500 ${shellTone}`}
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[80] px-3 pt-3 sm:px-5">
        <GlassPanel className="pointer-events-auto bg-[rgba(245,247,255,0.08)]">
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <div className="flex items-center gap-3">
              <span className="font-semibold tracking-[0.18em] text-white/[0.82] mix-blend-screen">
                DIET FINDER
              </span>
              <span className="hidden text-xs text-white/[0.45] sm:block">
                macOS-inspired nutrition social board
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/[0.62] sm:text-sm">
              <span>{currentTime}</span>
              <span className="rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1">
                Today {feedSummary.totalCalories}
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="relative min-h-screen px-4 pb-36 pt-20 sm:px-6 sm:pt-24 lg:px-10">
        <AnimatePresence>
          {!mainWindow.minimized ? (
            <motion.section
              key="main-window"
              onMouseDown={() => focusWindow("main")}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{
                opacity: mainWindow.minimizing ? 0.18 : 1,
                scaleX: mainWindow.minimizing ? 0.18 : 1,
                scaleY: mainWindow.minimizing ? 0.08 : 1,
                skewX: mainWindow.minimizing ? -18 : 0,
                x: mainWindow.minimizing ? mainGenieX : mainWindow.x,
                y: mainWindow.minimizing ? mainGenieY : mainWindow.y,
                width: mainWindow.width,
                height: mainWindow.height
              }}
              exit={{ opacity: 0, y: 120, scale: 0.86 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              style={{ originX: 0.5, originY: 0, zIndex: getWindowZIndex("main") }}
              className={`absolute left-0 top-0 z-20 overflow-hidden rounded-[34px] border border-white/20 bg-white/10 shadow-glass backdrop-blur-3xl ${
                activeWindow !== "main" ? inactiveWindowClass : ""
              }`}
            >
              <div
                onMouseDown={startMainDrag}
                className="flex cursor-grab items-center justify-between border-b border-white/10 bg-white/[0.08] px-5 py-4 active:cursor-grabbing"
              >
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        playSystemClick(520, 0.04);
                        setContextMenu(null);
                      }}
                      className="h-3 w-3 rounded-full bg-[#ff5f57]"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        minimizeMainWindow();
                      }}
                      className="h-3 w-3 rounded-full bg-[#febc2e]"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFullscreen();
                      }}
                      className="h-3 w-3 rounded-full bg-[#28c840]"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-[0.2em] text-white/70">
                      DIET FINDER
                    </p>
                    <p className="text-xs text-white/[0.45]">
                      Community meals, calories, and daily habits
                    </p>
                  </div>
                </div>
                <div className="hidden rounded-full border border-white/[0.15] bg-white/10 px-4 py-2 text-sm text-white/70 md:block">
                  {isSystemDark ? "Deep Space Mode" : "Frosted Graphite"}
                </div>
              </div>

              <div className="grid h-[calc(100%-73px)] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
                <aside className="hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-5 lg:block">
                  {sidebarContent}
                </aside>

                <section className="flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
                  <motion.div
                    onScroll={handleFeedScroll}
                    className="flex-1 overflow-y-auto px-5 pb-5 pt-5 [scrollbar-width:none] sm:px-6 sm:pb-6 sm:pt-6"
                    style={{ y: feedShift }}
                  >
                    <GlassPanel className="sticky top-0 z-20 -mx-2 mb-6 bg-[rgba(10,18,34,0.42)] px-2 pb-3 pt-1 backdrop-blur-2xl">
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/50 mix-blend-screen">
                            Feed
                          </p>
                          <h2 className="mt-2 text-3xl font-semibold leading-tight text-white/95">
                            오늘의 식단 기록을 macOS 감성으로
                          </h2>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                            고화질 배경과 유리 질감 위에 식단 이미지, 캡션, 칼로리
                            정보를 정돈된 카드로 배치해 집중감 있는 SNS 피드를
                            만들었습니다.
                          </p>

                          <label className="mt-5 flex max-w-xl items-center gap-3 rounded-full border border-white/[0.14] bg-[rgba(255,255,255,0.08)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-5 w-5 text-white/[0.45]"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="11" cy="11" r="7" />
                              <path d="m20 20-3.5-3.5" />
                            </svg>
                            <input
                              value={searchQuery}
                              onChange={(event) => setSearchQuery(event.target.value)}
                              placeholder="Search meals, macros, or creators"
                              className="w-full bg-transparent text-sm text-white/[0.88] outline-none placeholder:text-white/[0.4]"
                            />
                            {searchQuery ? (
                              <button
                                type="button"
                                onClick={clearSearch}
                                className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-xs text-white/[0.64] transition hover:bg-white/[0.12]"
                              >
                                Clear
                              </button>
                            ) : (
                              <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/[0.42]">
                                Spotlight
                              </span>
                            )}
                          </label>

                          <AnimatePresence>
                            {searchResults.length > 0 ? (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 max-w-xl overflow-hidden rounded-[26px] border border-white/[0.14] bg-[rgba(11,19,36,0.88)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
                              >
                                {searchResults.map((post) => (
                                  <button
                                    key={`search-${post.id}`}
                                    type="button"
                                    onClick={() => {
                                      playSystemClick(930, 0.04);
                                      setSelectedPost(post);
                                      setActiveWindow("detail");
                                      clearSearch();
                                    }}
                                    className="flex w-full items-center gap-4 border-b border-white/[0.06] px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.06]"
                                  >
                                    <img
                                      src={post.image}
                                      alt={post.author}
                                      className="h-12 w-12 rounded-2xl object-cover"
                                    />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-white/[0.92]">
                                        {post.author}
                                      </p>
                                      <p className="mt-0.5 truncate text-xs text-white/[0.52]">
                                        {post.handle}
                                      </p>
                                      <p className="mt-1 truncate text-xs text-white/[0.68]">
                                        {post.caption}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>

                        <div className="rounded-3xl border border-cyan-100/20 bg-cyan-100/10 px-5 py-4 text-sm text-cyan-50/[0.9] shadow-[0_10px_40px_rgba(103,232,249,0.12)]">
                          {feedSummary.postCount} posts · {feedSummary.totalCalories}
                        </div>
                      </div>
                    </GlassPanel>

                    <div className="grid gap-5">
                      {posts.map((post, index) => (
                        <GlassPanel
                          key={post.id}
                          className="bg-white/[0.09] shadow-[0_18px_60px_rgba(8,15,30,0.22)]"
                        >
                          <motion.article
                            initial={{ opacity: 0, y: 26 }}
                            animate={{ opacity: 1, y: 0 }}
                            onContextMenu={(event) => handleContextMenu(event, post.id)}
                            onMouseEnter={() => setHoveredPost(post)}
                            onMouseLeave={() =>
                              setHoveredPost((current) =>
                                current?.id === post.id ? null : current
                              )
                            }
                            whileHover={{
                              y: -4,
                              scale: 1.008,
                              backgroundColor: "rgba(255,255,255,0.12)",
                              borderColor: "rgba(255,255,255,0.18)",
                              boxShadow:
                                "0 24px 70px rgba(8,15,30,0.28), 0 0 0 1px rgba(147,197,253,0.08)"
                            }}
                            whileTap={{ scale: 0.992 }}
                            transition={{
                              duration: 0.65,
                              delay: 0.2 + index * 0.12,
                              ease: [0.22, 1, 0.36, 1]
                            }}
                            className="overflow-hidden rounded-[30px] border border-white/[0.12]"
                          >
                            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                              <div className="relative min-h-[260px] overflow-hidden">
                                <motion.img
                                  src={post.image}
                                  alt={`${post.author} meal`}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  whileHover={{ scale: 1.03 }}
                                  transition={{ duration: 0.45, ease: "easeOut" }}
                                />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,9,20,0.04),rgba(4,9,20,0.4))]" />
                              </div>

                              <div className="flex flex-col justify-between p-5 sm:p-6">
                                <div>
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <h3 className="text-xl font-semibold text-white/95">
                                        {post.author}
                                      </h3>
                                      <p className="mt-1 text-sm text-white/50">
                                        {post.handle} · {post.time}
                                      </p>
                                    </div>
                                    <div className="rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1.5 text-sm font-medium text-emerald-50/[0.9] shadow-[0_0_24px_rgba(16,185,129,0.12)]">
                                      {post.calories}
                                    </div>
                                  </div>

                                  <p className="mt-5 text-sm leading-7 text-white/[0.72]">
                                    {post.caption}
                                  </p>
                                </div>

                                <div className="mt-6 flex items-center justify-between rounded-[24px] border border-white/10 bg-black/[0.15] px-4 py-3">
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-white/[0.42]">
                                      Macro Balance
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-white/[0.82]">
                                      {post.macros}
                                    </p>
                                  </div>
                                  <motion.button
                                    whileHover={{
                                      scale: 1.03,
                                      backgroundColor: "rgba(255,255,255,0.18)",
                                      borderColor: "rgba(255,255,255,0.2)",
                                      boxShadow:
                                        "0 12px 32px rgba(125,211,252,0.12), inset 0 1px 0 rgba(255,255,255,0.12)"
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => {
                                      playSystemClick();
                                      setSelectedPost(post);
                                      setActiveWindow("detail");
                                    }}
                                    className="rounded-full border border-white/[0.12] bg-white/10 px-4 py-2 text-sm text-white/[0.78]"
                                  >
                                    View Details
                                  </motion.button>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                  <motion.button
                                    whileHover={{
                                      scale: 1.02,
                                      backgroundColor: "rgba(255,255,255,0.12)",
                                      borderColor: "rgba(255,255,255,0.18)"
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ duration: 0.18 }}
                                    onClick={() => {
                                      playSystemClick(960, 0.04);
                                      incrementMetric(post.id, "likes");
                                    }}
                                    className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm text-white/[0.76]"
                                  >
                                    <svg
                                      aria-hidden="true"
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M12 21s-6.716-4.35-9.192-8.288C1.173 10.114 2.19 6.75 5.308 5.57c2.02-.764 4.151.04 5.428 1.774C12.013 5.61 14.144 4.806 16.164 5.57c3.118 1.18 4.135 4.544 2.5 7.142C18.716 16.65 12 21 12 21Z" />
                                    </svg>
                                    <span>좋아요 {post.likes}</span>
                                  </motion.button>

                                  <motion.button
                                    whileHover={{
                                      scale: 1.02,
                                      backgroundColor: "rgba(255,255,255,0.12)",
                                      borderColor: "rgba(255,255,255,0.18)"
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ duration: 0.18 }}
                                    onClick={() => {
                                      playSystemClick(760, 0.04);
                                      incrementMetric(post.id, "comments");
                                    }}
                                    className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm text-white/[0.76]"
                                  >
                                    <svg
                                      aria-hidden="true"
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M7 10h10" />
                                      <path d="M7 14h6" />
                                      <path d="M5 19.5V5.75A1.75 1.75 0 0 1 6.75 4h10.5A1.75 1.75 0 0 1 19 5.75v8.5A1.75 1.75 0 0 1 17.25 16H8.5L5 19.5Z" />
                                    </svg>
                                    <span>댓글 {post.comments}</span>
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </motion.article>
                        </GlassPanel>
                      ))}
                    </div>
                  </motion.div>
                </section>
              </div>

              <button
                type="button"
                onMouseDown={startMainResize}
                className="absolute bottom-3 right-3 h-6 w-6 cursor-se-resize rounded-full border border-white/[0.12] bg-white/[0.08]"
              />
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {contextMenu ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.16 }}
            className="absolute z-[90] w-56 overflow-hidden rounded-[20px] border border-white/[0.14] bg-[rgba(15,23,42,0.92)] shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y + 10 }}
            onClick={(event) => event.stopPropagation()}
          >
            {[
              { key: "view", label: "상세 보기" },
              { key: "edit", label: "칼로리 수정" },
              { key: "delete", label: "삭제" }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  handleContextAction(item.key as "view" | "edit" | "delete")
                }
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-white/[0.08] ${
                  item.key !== "delete" ? "border-b border-white/[0.06]" : ""
                } ${item.key === "delete" ? "text-rose-200" : "text-white/[0.84]"}`}
              >
                <span>{item.label}</span>
                <span className="text-xs text-white/[0.34]">
                  {item.key === "view"
                    ? "Enter"
                    : item.key === "edit"
                      ? "Cmd+E"
                      : "Del"}
                </span>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-[rgba(3,8,18,0.48)] backdrop-blur-md lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="h-full w-[88%] max-w-[340px] border-r border-white/[0.12] bg-[linear-gradient(180deg,rgba(19,29,50,0.95),rgba(13,22,40,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.34)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold tracking-[0.2em] text-white/[0.7]">
                  SIDEBAR
                </p>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs text-white/[0.72]"
                >
                  Close
                </motion.button>
              </div>
              {sidebarContent}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isSpotlightOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: getWindowZIndex("spotlight") + 40 }}
            className="absolute inset-0 flex items-start justify-center bg-[rgba(4,8,18,0.26)] px-4 pt-20 backdrop-blur-lg"
            onClick={() => setIsSpotlightOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: spotlightWindow.x,
                y: spotlightWindow.y
              }}
              exit={{ opacity: 0, scale: 0.97, y: 14 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onMouseDown={() => focusWindow("spotlight")}
              style={{ zIndex: getWindowZIndex("spotlight") }}
              className={`w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/[0.18] bg-[rgba(245,247,255,0.12)] shadow-[0_32px_110px_rgba(2,8,23,0.42)] backdrop-blur-3xl ${
                activeWindow !== "spotlight" ? inactiveWindowClass : ""
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                onMouseDown={(event) =>
                  startFloatingDrag("spotlight", event, spotlightWindow)
                }
                className="flex cursor-grab items-center justify-between border-b border-white/10 bg-[rgba(255,255,255,0.08)] px-5 py-4 active:cursor-grabbing"
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-[0.18em] text-white/75">
                      SPOTLIGHT
                    </p>
                    <p className="text-xs text-white/[0.46]">
                      Command + K to search meals and add them instantly
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/[0.5]">
                  Live Search
                </div>
              </div>

              <div className="p-5">
                <label className="flex items-center gap-3 rounded-[26px] border border-white/[0.14] bg-[rgba(10,18,34,0.42)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-white/[0.45]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    autoFocus
                    value={spotlightQuery}
                    onChange={(event) => setSpotlightQuery(event.target.value)}
                    onKeyDown={handleSpotlightKeyDown}
                    placeholder="Search foods, creators, or meal notes"
                    className="w-full bg-transparent text-base text-white/[0.92] outline-none placeholder:text-white/[0.36]"
                  />
                  <span className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/[0.48]">
                    {isSpotlightLoading ? "Searching" : `${spotlightResults.length} Results`}
                  </span>
                </label>

                <div className="mt-4 overflow-hidden rounded-[28px] border border-white/[0.12] bg-[rgba(7,13,24,0.28)]">
                  <div className="max-h-[420px] overflow-y-auto p-2 [scrollbar-width:none]">
                    {spotlightResults.length ? (
                      spotlightResults.map((result, index) => {
                        const isActive = index === spotlightActiveIndex;

                        return (
                          <motion.button
                            key={result.id}
                            type="button"
                            whileHover={{ scale: 1.006 }}
                            whileTap={{ scale: 0.992 }}
                            onMouseEnter={() => setSpotlightActiveIndex(index)}
                            onClick={() => addSpotlightResultToToday(result)}
                            className={`flex w-full items-center gap-4 rounded-[22px] border px-3 py-3 text-left transition ${
                              isActive
                                ? "border-cyan-200/30 bg-cyan-100/[0.12] shadow-[0_10px_34px_rgba(103,232,249,0.12)]"
                                : "border-transparent bg-transparent hover:bg-white/[0.05]"
                            }`}
                          >
                            <img
                              src={result.image}
                              alt={result.title}
                              className="h-14 w-14 rounded-[18px] object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-white/[0.92]">
                                  {result.title}
                                </p>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                                    result.source === "history"
                                      ? "bg-white/[0.08] text-white/[0.52]"
                                      : "bg-cyan-100/[0.12] text-cyan-50/[0.78]"
                                  }`}
                                >
                                  {result.source === "history" ? "History" : "Database"}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-xs text-white/[0.52]">
                                {result.subtitle}
                              </p>
                              <p className="mt-1 truncate text-xs text-white/[0.68]">
                                {result.macros}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-emerald-50/[0.9]">
                                {result.calories}
                              </p>
                              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/[0.38]">
                                Enter to add
                              </p>
                            </div>
                          </motion.button>
                        );
                      })
                    ) : (
                      <div className="flex min-h-[180px] items-center justify-center px-6 py-10 text-center text-sm text-white/[0.52]">
                        {isSpotlightLoading
                          ? "Searching public food database..."
                          : "Type a food name to search your history and the public food database."}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-white/[0.4]">
                    <span>Arrow keys to move</span>
                    <span>Enter to add to today</span>
                    <span>Esc to close</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {quickLookPost ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => focusWindow("quicklook")}
            onClick={() => setQuickLookPost(null)}
            style={{ zIndex: getWindowZIndex("quicklook") + 40 }}
            className="absolute inset-0 flex items-center justify-center bg-[rgba(4,8,18,0.45)] px-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: quickLookWindow.x,
                y: quickLookWindow.y
              }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.24 }}
              style={{ zIndex: getWindowZIndex("quicklook") }}
              className={`w-full max-w-4xl overflow-hidden rounded-[34px] border border-white/[0.18] bg-[rgba(245,247,255,0.12)] shadow-[0_30px_100px_rgba(2,8,23,0.45)] backdrop-blur-3xl ${
                activeWindow !== "quicklook" ? inactiveWindowClass : ""
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                onMouseDown={(event) =>
                  startFloatingDrag("quicklook", event, quickLookWindow)
                }
                className="cursor-grab border-b border-white/10 bg-[rgba(255,255,255,0.07)] px-5 py-3 active:cursor-grabbing"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/[0.46]">
                  Quick Look
                </p>
              </div>
              <div className="grid max-h-[min(72vh,820px)] gap-0 overflow-y-auto md:grid-cols-[1.08fr_0.92fr]">
                <div className="relative min-h-[380px]">
                  <img
                    src={quickLookPost.image}
                    alt={`${quickLookPost.author} quick look`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-5 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/55">
                      Quick Look
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white/[0.94]">
                      {quickLookPost.author}
                    </h3>
                    <p className="mt-1 text-sm text-white/[0.52]">
                      {quickLookPost.handle} · {quickLookPost.time}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/[0.12] bg-black/[0.16] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/[0.42]">
                      Meal Note
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/[0.78]">
                      {quickLookPost.caption}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-emerald-200/20 bg-emerald-200/10 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-50/[0.55]">
                        Calories
                      </p>
                      <p className="mt-2 text-xl font-semibold text-emerald-50/[0.94]">
                        {quickLookPost.calories}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-sky-200/20 bg-sky-200/10 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-sky-50/[0.55]">
                        Nutrition
                      </p>
                      <p className="mt-2 text-sm font-medium leading-6 text-sky-50/[0.9]">
                        {quickLookPost.macros}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isComposeOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: getWindowZIndex("compose") + 40 }}
            className="absolute inset-0 flex items-center justify-center bg-[rgba(4,8,18,0.45)] px-4 backdrop-blur-xl"
            onClick={closeCompose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: composeWindow.x,
                y: composeWindow.y
              }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onMouseDown={() => focusWindow("compose")}
              style={{ zIndex: getWindowZIndex("compose") }}
              className={`w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/[0.18] bg-[rgba(245,247,255,0.12)] shadow-[0_30px_100px_rgba(2,8,23,0.45)] backdrop-blur-3xl ${
                activeWindow !== "compose" ? inactiveWindowClass : ""
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                onMouseDown={(event) =>
                  startFloatingDrag("compose", event, composeWindow)
                }
                className="flex cursor-grab items-center justify-between border-b border-white/10 bg-[rgba(255,255,255,0.08)] px-5 py-4 active:cursor-grabbing"
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-[0.18em] text-white/75">
                      NEW POST
                    </p>
                    <p className="text-xs text-white/[0.46]">
                      macOS-style compose window
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.12)" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={closeCompose}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/[0.74]"
                >
                  Cancel
                </motion.button>
              </div>

              <div className="grid max-h-[min(74vh,760px)] gap-5 overflow-y-auto p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-white/[0.46]">
                      Author
                    </span>
                    <input
                      value={composeAuthor}
                      onChange={(event) => setComposeAuthor(event.target.value)}
                      className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-sm text-white/[0.88] outline-none placeholder:text-white/[0.35]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-white/[0.46]">
                      Handle
                    </span>
                    <input
                      value={composeHandle}
                      onChange={(event) => setComposeHandle(event.target.value)}
                      className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-sm text-white/[0.88] outline-none placeholder:text-white/[0.35]"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/[0.46]">
                    Photo Upload
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleComposeImage}
                    className="rounded-2xl border border-dashed border-white/[0.18] bg-white/[0.04] px-4 py-4 text-sm text-white/[0.72] file:mr-4 file:rounded-full file:border-0 file:bg-white/[0.12] file:px-4 file:py-2 file:text-sm file:text-white/[0.82]"
                  />
                </label>

                {composeImage ? (
                  <div className="overflow-hidden rounded-[28px] border border-white/[0.12]">
                    <img
                      src={composeImage}
                      alt="Post preview"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-white/[0.46]">
                      Calories
                    </span>
                    <input
                      value={composeCalories}
                      onChange={(event) => setComposeCalories(event.target.value)}
                      placeholder="e.g. 540"
                      className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-sm text-white/[0.88] outline-none placeholder:text-white/[0.35]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-white/[0.46]">
                      Macros
                    </span>
                    <input
                      value={composeMacros}
                      onChange={(event) => setComposeMacros(event.target.value)}
                      placeholder="P 30g  C 40g  F 18g"
                      className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-sm text-white/[0.88] outline-none placeholder:text-white/[0.35]"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/[0.46]">
                    Caption
                  </span>
                  <textarea
                    value={composeCaption}
                    onChange={(event) => setComposeCaption(event.target.value)}
                    rows={5}
                    placeholder="Share today's meal and how it fits your routine."
                    className="resize-none rounded-[24px] border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/[0.88] outline-none placeholder:text-white/[0.35]"
                  />
                </label>

                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.14)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeCompose}
                    className="rounded-full border border-white/[0.12] bg-white/[0.06] px-5 py-2.5 text-sm text-white/[0.74]"
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(186,230,253,0.22)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreatePost}
                    className="rounded-full border border-sky-200/[0.18] bg-sky-200/[0.14] px-5 py-2.5 text-sm font-medium text-sky-50"
                  >
                    Add Post
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isInsightsOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: getWindowZIndex("insights") + 40 }}
            className="absolute inset-0 flex items-center justify-center bg-[rgba(4,8,18,0.45)] px-4 backdrop-blur-xl"
            onClick={() => setIsInsightsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: insightsWindow.x,
                y: insightsWindow.y
              }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onMouseDown={() => focusWindow("insights")}
              style={{ zIndex: getWindowZIndex("insights") }}
              className={`w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/[0.18] bg-[rgba(245,247,255,0.12)] shadow-[0_30px_100px_rgba(2,8,23,0.45)] backdrop-blur-3xl ${
                activeWindow !== "insights" ? inactiveWindowClass : ""
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                onMouseDown={(event) =>
                  startFloatingDrag("insights", event, insightsWindow)
                }
                className="flex cursor-grab items-center justify-between border-b border-white/10 bg-[rgba(255,255,255,0.08)] px-5 py-4 active:cursor-grabbing"
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-[0.18em] text-white/75">
                      INSIGHTS
                    </p>
                    <p className="text-xs text-white/[0.46]">
                      Weekly body trend and adherence
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.12)" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsInsightsOpen(false)}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/[0.74]"
                >
                  Close
                </motion.button>
              </div>

              <div className="grid max-h-[min(76vh,820px)] gap-5 overflow-y-auto p-6 lg:grid-cols-[1.4fr_0.6fr]">
                <GlassPanel className="bg-black/[0.16]">
                  <div className="p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/[0.42]">
                          Weekly Weight Trend
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white/[0.94]">
                          66.4kg to 65.3kg
                        </h3>
                      </div>
                      <div className="rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1.5 text-sm text-emerald-50/[0.9]">
                        -1.1kg this week
                      </div>
                    </div>

                    <div className="mt-6 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyWeights}>
                          <CartesianGrid
                            stroke="rgba(255,255,255,0.08)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[64.8, 66.8]}
                            tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${value}kg`}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(15,23,42,0.9)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "16px",
                              color: "white"
                            }}
                            labelStyle={{ color: "rgba(255,255,255,0.65)" }}
                            formatter={(value: number) => [`${value} kg`, "Weight"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#67e8f9"
                            strokeWidth={3}
                            dot={{
                              r: 4,
                              fill: "#67e8f9",
                              stroke: "rgba(15,23,42,0.9)",
                              strokeWidth: 2
                            }}
                            activeDot={{
                              r: 6,
                              fill: "#a5f3fc",
                              stroke: "#67e8f9",
                              strokeWidth: 2
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </GlassPanel>

                <div className="space-y-4">
                  <GlassPanel className="bg-white/[0.07]">
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/[0.42]">
                        Momentum
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white/[0.94]">
                        93%
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/[0.6]">
                        이번 주 식단 루틴이 안정적으로 유지되고 있어요.
                      </p>
                    </div>
                  </GlassPanel>
                  <GlassPanel className="bg-white/[0.07]">
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/[0.42]">
                        Best Day
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white/[0.92]">
                        Thursday
                      </p>
                      <p className="mt-2 text-sm text-white/[0.6]">
                        목표 칼로리와 단백질을 모두 달성했어요.
                      </p>
                    </div>
                  </GlassPanel>
                  <GlassPanel className="bg-cyan-100/10 shadow-[0_10px_40px_rgba(103,232,249,0.12)]">
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-50/[0.55]">
                        Insight Note
                      </p>
                      <p className="mt-2 text-sm leading-7 text-cyan-50/[0.9]">
                        단백질 링이 목표치를 넘어서면서 회복 지표가 좋아지고 있고,
                        체중 변화도 무리 없이 완만하게 내려가고 있습니다.
                      </p>
                    </div>
                  </GlassPanel>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: getWindowZIndex("detail") + 40 }}
            className="absolute inset-0 flex items-center justify-center bg-[rgba(4,8,18,0.45)] px-4 backdrop-blur-xl"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: detailWindow.x,
                y: detailWindow.y
              }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onMouseDown={() => focusWindow("detail")}
              style={{ zIndex: getWindowZIndex("detail") }}
              className={`w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/[0.18] bg-[rgba(245,247,255,0.12)] shadow-[0_30px_100px_rgba(2,8,23,0.45)] backdrop-blur-3xl ${
                activeWindow !== "detail" ? inactiveWindowClass : ""
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                onMouseDown={(event) =>
                  startFloatingDrag("detail", event, detailWindow)
                }
                className="flex cursor-grab items-center justify-between border-b border-white/10 bg-[rgba(255,255,255,0.08)] px-5 py-4 active:cursor-grabbing"
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-[0.18em] text-white/75">
                      POST DETAILS
                    </p>
                    <p className="text-xs text-white/[0.46]">
                      Finder-style nutrition inspector
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.12)" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPost(null)}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/[0.74]"
                >
                  Close
                </motion.button>
              </div>

              <div className="grid max-h-[min(74vh,820px)] gap-0 overflow-y-auto md:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[300px]">
                  <img
                    src={selectedPost.image}
                    alt={`${selectedPost.author} meal detail`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-5 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/55">
                      Creator
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white/95">
                      {selectedPost.author}
                    </h3>
                    <p className="mt-1 text-sm text-white/50">
                      {selectedPost.handle} · {selectedPost.time}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/[0.15] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/[0.42]">
                      Meal Note
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/[0.78]">
                      {selectedPost.caption}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-emerald-200/20 bg-emerald-200/10 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-50/[0.55]">
                        Calories
                      </p>
                      <p className="mt-2 text-xl font-semibold text-emerald-50/[0.94]">
                        {selectedPost.calories}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-sky-200/20 bg-sky-200/10 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-sky-50/[0.55]">
                        Macro Split
                      </p>
                      <p className="mt-2 text-sm font-medium leading-6 text-sky-50/[0.9]">
                        {selectedPost.macros}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <motion.button
                      whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => incrementMetric(selectedPost.id, "likes")}
                      className="rounded-[22px] border border-white/[0.12] bg-white/[0.05] p-4 text-left"
                    >
                      <p className="text-xs uppercase tracking-[0.24em] text-white/[0.42]">
                        Reactions
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white/[0.9]">
                        좋아요 {selectedPost.likes}
                      </p>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => incrementMetric(selectedPost.id, "comments")}
                      className="rounded-[22px] border border-white/[0.12] bg-white/[0.05] p-4 text-left"
                    >
                      <p className="text-xs uppercase tracking-[0.24em] text-white/[0.42]">
                        Conversation
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white/[0.9]">
                        댓글 {selectedPost.comments}
                      </p>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-[85] flex justify-center px-4">
        <GlassPanel className="pointer-events-auto bg-[rgba(245,247,255,0.12)] shadow-[0_20px_70px_rgba(2,8,23,0.34)]">
          <div
            className="flex items-end gap-2 px-3 py-3"
            onMouseLeave={() => setDockMouseX(null)}
            onMouseMove={(event) => setDockMouseX(event.clientX)}
          >
            {dockApps.map((app) => {
              const scale = getDockScale(app.id);
              const isRunning =
                app.running ||
                (app.id === "compose" && isComposeOpen) ||
                (app.id === "insights" && isInsightsOpen) ||
                (app.id === "quicklook" && quickLookPost);

              return (
                <motion.button
                  key={app.id}
                  ref={(node) => {
                    dockRefs.current[app.id] = node;
                  }}
                  whileTap={{ scale: scale * 0.92 }}
                  animate={
                    bouncingDockItem === app.id
                      ? { y: [0, -18, 0], scale: [scale, scale * 1.03, scale] }
                      : { y: 0, scale }
                  }
                  transition={{
                    duration: bouncingDockItem === app.id ? 0.42 : 0.16,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  onClick={() => handleDockAction(app.id)}
                  className="relative flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/[0.16] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] text-lg font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                  title={app.label}
                >
                  <span className="mix-blend-screen">{app.symbol}</span>
                  {isRunning ? (
                    <span className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-white/80" />
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
