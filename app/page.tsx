"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

const BRUSH_SIZES = [4, 8, 14, 20];
const COLOR_PRESETS = ["#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#4B0082", "#EE82EE"];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [strokeColor, setStrokeColor] = useState(COLOR_PRESETS[0]);
  const [guess, setGuess] = useState("准备好让 AI 来猜了吗？");
  const [confidence, setConfidence] = useState(0);
  const [isGuessing, setIsGuessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isCounting, setIsCounting] = useState(false);

  const isGuessingRef = useRef(false);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    isGuessingRef.current = isGuessing;
  }, [isGuessing]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const dpi = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const canvasStyle = useMemo(() => ({
    width: "100%",
    height: "100%",
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;

    if (!canvas || !wrapper) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = Math.max(width * dpi, 300 * dpi);
      canvas.height = Math.max(height * dpi, 260 * dpi);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpi, dpi);
      context.lineJoin = "round";
      context.lineCap = "round";
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [dpi]);

  useEffect(() => {
    if (!isCounting) {
      return;
    }

    if (timeLeft <= 0) {
      setIsCounting(false);
      setGuess("时间到！现在可以让 AI 来猜了。");
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isCounting, timeLeft]);

  const getContext = () => canvasRef.current?.getContext("2d");

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) {
      return;
    }

    if (!isCounting && timeLeft > 0) {
      setIsCounting(true);
      setGuess("计时开始，抓紧 20 秒画完！");
    }

    const rect = canvas.getBoundingClientRect();
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    setIsDrawing(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }

    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    context.strokeStyle = strokeColor;
    context.lineWidth = brushSize;
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    setGuess("画完之后点击‘AI 猜测’吧。");
    setConfidence(0);
    setTimeLeft(20);
    setIsCounting(false);
  };

  const sendGuess = useCallback(async (options?: { readonly stopCountdown?: boolean }) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (isGuessingRef.current) {
      return;
    }

    setIsGuessing(true);

    if (options?.stopCountdown !== false) {
      setIsCounting(false);
    }

    setGuess("Gemini 正在观察你的作品...");

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const response = await fetch("/api/guess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: dataUrl }),
      });

      const result = await response.json();
      setGuess(result.guess || "没有得到明确答案。再画清晰一点试试？");
      setConfidence(result.confidence ?? 0);
    } catch (error) {
      setGuess("请求失败，请稍后再试。");
      setConfidence(0);
    } finally {
      setIsGuessing(false);
    }
  }, []);

  useEffect(() => {
    if (!isCounting) {
      return;
    }

    const interval = window.setInterval(() => {
      if (timeLeftRef.current <= 0) {
        return;
      }

      void sendGuess({ stopCountdown: false });
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isCounting, sendGuess]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>AI 你画我猜</p>
        <div>
          <h1>把灵感画在画布上</h1>
          <p>倒计时 20 秒完成你的作品。</p>
        </div>
        <div className={styles.headerCard}>
          <p className={styles.cardLabel}>AI 猜测</p>
          <p className={styles.cardGuess}>{guess}</p>
          <div className={styles.cardMeta}>
            <span>置信度 {Math.round(confidence * 100)}%</span>
            <span className={styles.cardDot}>•</span>
            <span>模式：单人</span>
          </div>
          <div className={styles.timerMeta}>
            <span>倒计时</span>
            <span className={styles.timerValue}>{timeLeft}s</span>
            <span className={styles.timerState}>{isCounting ? "进行中" : "未开始"}</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.canvasPanel}>
          <div className={styles.canvasHeader}>
            <div>
              <h2>画布</h2>
              <p>用手写板或鼠标绘制你的创意。</p>
            </div>
            <div className={styles.canvasButtons}>
              <button className={styles.secondaryButton} onClick={clearCanvas}>
                清空
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  void sendGuess();
                }}
                disabled={isGuessing || (isCounting && timeLeft > 0)}
              >
                {isGuessing ? "AI 思考中..." : "AI 猜测"}
              </button>
            </div>
          </div>

          <div ref={wrapperRef} className={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              style={canvasStyle}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>

          <div className={styles.tools}>
            <div className={styles.toolBlock}>
              <span>笔刷</span>
              <div className={styles.toolRow}>
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size}
                    className={size === brushSize ? styles.toolButtonActive : styles.toolButton}
                    onClick={() => setBrushSize(size)}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.toolBlock}>
              <span>颜色</span>
              <div className={styles.colorRow}>
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    className={styles.colorSwatch}
                    style={{ backgroundColor: color, outline: color === strokeColor ? "2px solid #111" : "none" }}
                    onClick={() => setStrokeColor(color)}
                    aria-label={`选择颜色 ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.panelCard}>
            <h3>玩法提示</h3>
            <ul>
              <li>画一个具体物体或场景。</li>
              <li>尽量用简洁线条。</li>
              <li>画完点击 AI 猜测。</li>
            </ul>
          </div>
          <div className={styles.panelCard}>
            <h3>状态</h3>
            <div className={styles.statusList}>
              <div>
                <p className={styles.statusLabel}>笔刷</p>
                <p>{brushSize}px</p>
              </div>
              <div>
                <p className={styles.statusLabel}>颜色</p>
                <p>{strokeColor}</p>
              </div>
              <div>
                <p className={styles.statusLabel}>识别结果</p>
                <p>{guess}</p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
