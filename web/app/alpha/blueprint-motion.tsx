"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

/* =========================================================
   Blueprint Motion Components
   - 背景パララックス（製図道具シルエット）
   - スクロール連動 reveal
   - スティッキー寸法線
   ========================================================= */

/** ───── 背景パララックス（製図道具シルエット） ─────
 *  Hero 周辺に巨大な SVG をふわっと配置 → スクロールで drift
 */
export function BlueprintParallaxBg() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // 各レイヤーごとに異なる速度
  const yCompass = useTransform(scrollY, [0, 1500], [0, reduce ? 0 : -260]);
  const yProtractor = useTransform(scrollY, [0, 1500], [0, reduce ? 0 : -380]);
  const yTriangle = useTransform(scrollY, [0, 1500], [0, reduce ? 0 : -180]);
  const rotateCompass = useTransform(scrollY, [0, 2000], [0, reduce ? 0 : 30]);
  const opacityFade = useTransform(scrollY, [0, 800, 1400], [0.22, 0.14, 0.06]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[160vh] overflow-hidden">
      {/* レイヤー1: コンパス（左下） */}
      <motion.svg
        viewBox="0 0 400 400"
        className="absolute -left-32 top-[40vh] w-[40vw] max-w-[520px]"
        style={{ y: yCompass, rotate: rotateCompass, opacity: opacityFade }}
        aria-hidden
      >
        <g stroke="#0B3D91" strokeWidth="1.5" fill="none">
          {/* コンパス本体 */}
          <line x1="200" y1="40" x2="120" y2="320" />
          <line x1="200" y1="40" x2="280" y2="320" />
          <circle cx="200" cy="40" r="12" fill="#0B3D91" />
          <circle cx="200" cy="40" r="6" fill="#F4F1E8" />
          {/* 描いた円弧 */}
          <path d="M 80 320 A 200 200 0 0 1 320 320" strokeDasharray="3 6" />
          {/* 寸法注釈 */}
          <text x="200" y="380" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#0B3D91">
            R=200
          </text>
        </g>
      </motion.svg>

      {/* レイヤー2: 分度器（右上） */}
      <motion.svg
        viewBox="0 0 500 280"
        className="absolute -right-20 top-[15vh] w-[42vw] max-w-[560px]"
        style={{ y: yProtractor, opacity: opacityFade }}
        aria-hidden
      >
        <g stroke="#0B3D91" strokeWidth="1.5" fill="none">
          <path d="M 50 250 A 200 200 0 0 1 450 250 Z" />
          {/* 目盛 */}
          {Array.from({ length: 19 }, (_, i) => {
            const angle = (180 / 18) * i;
            const rad = (angle * Math.PI) / 180;
            const x1 = 250 - 200 * Math.cos(rad);
            const y1 = 250 - 200 * Math.sin(rad);
            const x2 = 250 - 188 * Math.cos(rad);
            const y2 = 250 - 188 * Math.sin(rad);
            const major = i % 3 === 0;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                strokeWidth={major ? 1.6 : 0.8}
              />
            );
          })}
          {/* 中心線 */}
          <line x1="250" y1="250" x2="250" y2="70" strokeDasharray="3 4" />
          <circle cx="250" cy="250" r="4" fill="#0B3D91" />
        </g>
      </motion.svg>

      {/* レイヤー3: 三角定規（中央寄り、下） */}
      <motion.svg
        viewBox="0 0 600 600"
        className="absolute left-1/2 top-[80vh] w-[60vw] max-w-[680px] -translate-x-1/2"
        style={{ y: yTriangle, opacity: opacityFade }}
        aria-hidden
      >
        <g stroke="#0B3D91" strokeWidth="1.5" fill="none">
          {/* 30-60-90 三角定規 */}
          <polygon points="100,500 500,500 500,160" />
          <polygon points="100,500 500,500 500,160" strokeWidth="0.6" />
          {/* 内側の刳り抜き */}
          <polygon points="180,460 460,460 460,220" strokeWidth="0.8" strokeDasharray="2 3" />
          {/* 寸法線 */}
          <line x1="100" y1="540" x2="500" y2="540" />
          <line x1="100" y1="535" x2="100" y2="545" strokeWidth="2" />
          <line x1="500" y1="535" x2="500" y2="545" strokeWidth="2" />
          <text x="300" y="565" textAnchor="middle" fontFamily="monospace" fontSize="13" fill="#0B3D91">
            400 mm
          </text>
        </g>
      </motion.svg>
    </div>
  );
}

/** ───── スクロールで現れるラッパー
 *  下から上に静かに浮き上がる + opacity
 *  デコレーション系（重い fadeUp に頼らない、控えめ）
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** ───── 寸法線が左から右に伸びるアニメーション ───── */
export function DimensionLine({ delay = 0, maxWidth = 180 }: { delay?: number; maxWidth?: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex-1" style={{ maxWidth }}>
      <motion.div
        className="bp-dim"
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={reduce ? undefined : { scaleX: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 0.9, delay, ease: [0.65, 0, 0.35, 1] }}
        style={{ transformOrigin: "left" }}
      />
    </div>
  );
}

/** ───── スクロール進捗インジケータ（右端の縦寸法線がスクロールに合わせて伸びる） ───── */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  if (reduce) return null;
  return (
    <div
      className="hidden lg:block fixed right-5 top-20 bottom-20 w-px z-20"
      style={{ background: "rgba(11, 61, 145, 0.15)" }}
      aria-hidden
    >
      <motion.div
        className="w-full"
        style={{ height, background: "#0B3D91" }}
      />
      {/* マーカー (現在位置) */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "#FF6B35", marginTop: -4 }}
        />
      </motion.div>
    </div>
  );
}

/** ───── スクロール連動の SEC 番号アイドル
 *  画面内に入ったら大きく登場 → 縮小して定位置
 */
export function SectionHeader({
  num,
  meta,
}: {
  num: string;
  meta: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  return (
    <div ref={ref} className="flex items-center gap-3 mb-10">
      <motion.span
        className="bp-num"
        initial={reduce ? false : { scale: 1.6, opacity: 0 }}
        whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.55, ease: [0.34, 1.3, 0.64, 1] }}
      >
        {num}
      </motion.span>
      <DimensionLine />
      <motion.span
        className="font-mono text-[10px] tracking-widest opacity-60 hidden sm:inline"
        style={{ color: "#0B3D91" }}
        initial={reduce ? false : { opacity: 0, x: 8 }}
        whileInView={reduce ? undefined : { opacity: 0.6, x: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {meta}
      </motion.span>
    </div>
  );
}

/** ───── BETA スタンプ（インパクト出現） ───── */
export function BetaStamp() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="hidden md:block absolute -right-2 top-12 z-10"
      initial={reduce ? false : { opacity: 0, rotate: -28, scale: 2.4 }}
      animate={reduce ? undefined : { opacity: 0.88, rotate: -8, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.34, 1.3, 0.64, 1] }}
    >
      <div className="bp-stamp" style={{ animation: "none" }}>BETA</div>
    </motion.div>
  );
}

/** ───── マウスフォロー（ヒーロー領域内で軽い光点） ───── */
export function HeroSpotlight() {
  // CSS-only で軽量に: 配置だけ、JS なし
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        background:
          "radial-gradient(circle at 80% 30%, rgba(255,107,53,0.08), transparent 40%), radial-gradient(circle at 20% 70%, rgba(11,61,145,0.06), transparent 50%)",
      }}
      aria-hidden
    />
  );
}
