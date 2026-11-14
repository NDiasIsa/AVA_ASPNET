"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pacote de onda gaussiano. Clicar mede a posição: a função colapsa no ponto clicado e volta
 * a se espalhar, com a largura crescendo como na evolução livre de uma partícula.
 */
export function FuncaoOnda() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [medida, setMedida] = useState<number | null>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cores = getComputedStyle(el);
    const psi = cores.getPropertyValue("--psi").trim() || "#63e3e6";
    const foton = cores.getPropertyValue("--foton").trim() || "#ffb648";

    const SIGMA_MIN = 0.012;
    const SIGMA_REPOUSO = 0.13;
    let centro = 0.68;
    let alvo = 0.68;
    let sigma = SIGMA_REPOUSO;
    let brilho = 0;
    let fase = 0;
    let quadro = 0;
    let largura = 0;
    let altura = 0;

    const medir = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = r.width;
      altura = r.height;
      el.width = Math.round(r.width * dpr);
      el.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const desenhar = () => {
      ctx.clearRect(0, 0, largura, altura);
      const eixo = altura * 0.66;
      const amplitude = altura * 0.5 * Math.min(1, Math.sqrt(0.05 / sigma));
      const k = 62;
      const passo = 2;

      ctx.strokeStyle = "rgba(164,180,255,.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, eixo);
      ctx.lineTo(largura, eixo);
      ctx.stroke();

      // Densidade de probabilidade |ψ|²
      const gradiente = ctx.createLinearGradient(0, eixo - amplitude, 0, eixo);
      gradiente.addColorStop(0, `${foton}cc`);
      gradiente.addColorStop(1, `${foton}00`);
      ctx.fillStyle = gradiente;
      ctx.beginPath();
      ctx.moveTo(0, eixo);
      for (let px = 0; px <= largura; px += passo) {
        const x = px / largura;
        const envelope = Math.exp(-((x - centro) ** 2) / (2 * sigma ** 2));
        ctx.lineTo(px, eixo - envelope * envelope * amplitude);
      }
      ctx.lineTo(largura, eixo);
      ctx.closePath();
      ctx.fill();

      // Parte real de ψ
      ctx.strokeStyle = psi;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let px = 0; px <= largura; px += passo) {
        const x = px / largura;
        const envelope = Math.exp(-((x - centro) ** 2) / (2 * sigma ** 2));
        const y = eixo - envelope * Math.cos(k * (x - centro) - fase) * amplitude * 0.62;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      if (brilho > 0.01) {
        const raio = 8 + (1 - brilho) * altura * 0.5;
        ctx.strokeStyle = `${foton}${Math.round(brilho * 255).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centro * largura, eixo, raio, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const animar = () => {
      fase += 0.045;
      centro += (alvo - centro) * 0.04;
      sigma += (SIGMA_REPOUSO - sigma) * 0.012;
      brilho *= 0.95;
      desenhar();
      quadro = requestAnimationFrame(animar);
    };

    const aoClicar = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      centro = x;
      alvo = x;
      sigma = SIGMA_MIN;
      brilho = 1;
      setMedida(x);
      if (calmo) desenhar();
    };

    const observador = new ResizeObserver(() => {
      medir();
      desenhar();
    });
    observador.observe(el);
    el.addEventListener("pointerdown", aoClicar);
    medir();

    // Com movimento reduzido, a imagem é estática e só muda a cada medição.
    const visibilidade = new IntersectionObserver(([entrada]) => {
      cancelAnimationFrame(quadro);
      if (entrada.isIntersecting && !calmo) quadro = requestAnimationFrame(animar);
    });
    visibilidade.observe(el);
    if (calmo) desenhar();

    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
      visibilidade.disconnect();
      el.removeEventListener("pointerdown", aoClicar);
    };
  }, []);

  return (
    <div className="onda">
      <canvas ref={canvas} aria-label="Função de onda de uma partícula. Clique para medir a posição." role="img" />
      <p className="onda-legenda" aria-live="polite">
        {medida === null
          ? "Clique na onda para medir a posição da partícula."
          : `Partícula encontrada em x = ${medida.toFixed(2)}. Agora a função volta a se espalhar.`}
      </p>
    </div>
  );
}
