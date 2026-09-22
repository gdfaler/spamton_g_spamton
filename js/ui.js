// All canvas drawing helpers live here, kept separate from game logic/state.
SG.UI = (function () {
  const Util = SG.Util;
  const FONT = '"Courier New", monospace';

  function wrapText(ctx, text, maxWidth) {
    const paragraphs = text.split('\n');
    const lines = [];
    paragraphs.forEach(p => {
      const words = p.split(' ');
      let line = '';
      words.forEach(word => {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      });
      lines.push(line);
    });
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground(ctx, w, h, t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    // faint scanline / starfield flavor
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ff5bd1';
    for (let i = 0; i < 18; i++) {
      const x = (i * 137 + t * 12) % w;
      const y = (i * 71) % h;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  function drawDialogueBox(ctx, w, h, speaker, text, complete, hasMore, showSkip) {
    const boxX = 40, boxY = h - 200, boxW = w - 80, boxH = 160;
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    roundRect(ctx, boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffe14d';
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillText(speaker, boxX + 24, boxY + 34);

    ctx.fillStyle = '#fff';
    ctx.font = '19px ' + FONT;
    const lines = wrapText(ctx, text, boxW - 48);
    lines.forEach((line, i) => {
      ctx.fillText(line, boxX + 24, boxY + 70 + i * 26);
    });

    if (complete) {
      const pulse = Math.sin(performance.now() / 180) * 4;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const ax = boxX + boxW - 34, ay = boxY + boxH - 24 + pulse * 0.3;
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + 14, ay);
      ctx.lineTo(ax + 7, ay + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSkipButton(ctx, w, h, hover) {
    const bw = 150, bh = 40, x = w - bw - 24, y = 24;
    ctx.save();
    ctx.fillStyle = hover ? '#ffe14d' : '#000';
    ctx.strokeStyle = '#ffe14d';
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, bw, bh, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hover ? '#000' : '#ffe14d';
    ctx.font = 'bold 16px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SKIP INTRO ▶', x + bw / 2, y + bh / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
    return { x, y, w: bw, h: bh };
  }

  function drawBossHPBar(ctx, boss, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#ffe14d';
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillText(boss.name, x, y - 12);
    ctx.fillStyle = '#3a0030';
    ctx.fillRect(x, y, w, h);
    const ratio = boss.hpRatio();
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, '#ff3355');
    grad.addColorStop(1, '#ff5bd1');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w * ratio, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '13px ' + FONT;
    ctx.fillText(boss.phaseName(), x, y + h + 18);
    ctx.restore();
  }

  function drawPartyBar(ctx, x, y, w, h, hp, maxHp, name, invincible) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px ' + FONT;
    ctx.fillText(name, x, y - 10);
    ctx.font = '14px ' + FONT;
    ctx.fillText('LV 1', x + 90, y - 10);

    const barX = x + 150;
    ctx.fillStyle = '#3a0000';
    ctx.fillRect(barX, y - 22, w, h);
    const ratio = Util.clamp(hp / maxHp, 0, 1);
    ctx.fillStyle = ratio > 0.3 ? '#ffe14d' : '#ff3355';
    if (invincible && Math.floor(performance.now() / 80) % 2 === 0) {
      ctx.fillStyle = '#fff';
    }
    ctx.fillRect(barX, y - 22, w * ratio, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, y - 22, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = '14px ' + FONT;
    ctx.fillText(`${Math.ceil(hp)} / ${maxHp}`, barX + w + 14, y - 6);
    ctx.restore();
  }

  function drawMenu(ctx, x, y, w, h, options, selected, enabledMap) {
    const gap = 12;
    const bw = (w - gap * (options.length - 1)) / options.length;
    const rects = [];
    options.forEach((opt, i) => {
      const bx = x + i * (bw + gap);
      const isSel = i === selected;
      const isEnabled = !enabledMap || enabledMap[opt] !== false;
      ctx.save();
      ctx.fillStyle = isSel ? '#ffe14d' : '#000';
      ctx.strokeStyle = isEnabled ? '#fff' : '#555';
      ctx.lineWidth = 3;
      roundRect(ctx, bx, y, bw, h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isSel ? '#000' : (isEnabled ? '#fff' : '#555');
      ctx.font = 'bold 20px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt, bx + bw / 2, y + h / 2 + 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
      rects.push({ x: bx, y, w: bw, h, label: opt, enabled: isEnabled });
    });
    return rects;
  }

  function drawList(ctx, x, y, w, itemH, items, selected, enabledMap) {
    const rects = [];
    items.forEach((label, i) => {
      const iy = y + i * (itemH + 8);
      const isSel = i === selected;
      const isEnabled = !enabledMap || enabledMap[label] !== false;
      ctx.save();
      ctx.fillStyle = isSel ? '#ffe14d' : '#000';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      roundRect(ctx, x, iy, w, itemH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isSel ? '#000' : (isEnabled ? '#fff' : '#666');
      ctx.font = '17px ' + FONT;
      ctx.fillText(label, x + 16, iy + itemH / 2 + 6);
      ctx.restore();
      rects.push({ x, y: iy, w, h: itemH, label, enabled: isEnabled });
    });
    return rects;
  }

  function drawBattleBox(ctx, box, shake) {
    ctx.save();
    if (shake) {
      ctx.translate(Util.rand(-shake, shake), Util.rand(-shake, shake));
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }

  function drawHeart(ctx, heart) {
    if (heart.isInvincible() && Math.floor(heart.flash * 20) % 2 === 0) return;
    ctx.save();
    ctx.translate(heart.x, heart.y);
    ctx.fillStyle = heart.color;
    ctx.beginPath();
    const s = heart.r * 1.6;
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(s, -s * 0.4, s * 0.5, -s, 0, -s * 0.25);
    ctx.bezierCurveTo(-s * 0.5, -s, -s, -s * 0.4, 0, s * 0.35);
    ctx.fill();
    ctx.restore();
  }

  function drawBullet(ctx, b) {
    ctx.save();
    if (b.shape === 'circle') {
      ctx.translate(b.x, b.y);
      if (b.type === 'cursor') {
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.r * 1.6, 0);
        ctx.lineTo(-b.r, b.r);
        ctx.lineTo(-b.r * 0.4, 0);
        ctx.lineTo(-b.r, -b.r);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.92;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.restore();
  }

  // Procedurally drawn stand-in "boss art" — an original geometric puppet
  // design (not a reproduction of any copyrighted sprite) that reacts to
  // hit-flash and phase-based glitching.
  function drawBoss(ctx, boss, cx, cy, t, hitFlash, glitchy) {
    ctx.save();
    if (glitchy) {
      ctx.translate(Util.rand(-4, 4), Util.rand(-3, 3));
    }
    const bob = Math.sin(t * 2) * 6;
    cy += bob;

    // strings
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 40, cy - 120);
      ctx.lineTo(cx + i * 18, cy - 40);
      ctx.stroke();
    }

    ctx.fillStyle = hitFlash > 0 ? '#fff' : '#1a0d2e';
    // body (rounded box)
    roundRect(ctx, cx - 55, cy - 40, 110, 90, 14);
    ctx.fill();
    ctx.strokeStyle = '#ff5bd1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // bowtie
    ctx.fillStyle = hitFlash > 0 ? '#fff' : '#ffe14d';
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 40);
    ctx.lineTo(cx, cy + 52);
    ctx.lineTo(cx - 14, cy + 64);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 14, cy + 40);
    ctx.lineTo(cx, cy + 52);
    ctx.lineTo(cx + 14, cy + 64);
    ctx.closePath();
    ctx.fill();

    // hat (triangle)
    ctx.fillStyle = hitFlash > 0 ? '#fff' : '#0d0620';
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy - 40);
    ctx.lineTo(cx + 60, cy - 40);
    ctx.lineTo(cx, cy - 130);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ff5bd1';
    ctx.stroke();

    // face
    const eyeColor = hitFlash > 0 ? '#f00' : '#5bffea';
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = glitchy ? Util.rand(4, 16) : 8;
    const blink = Math.sin(t * 3) > 0.96 ? 0.2 : 1;
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy - 5, 9, 9 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 20, cy - 5, 9, 9 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // jagged mouth
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 22);
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(cx - 24 + (i + 1) * 8, cy + 22 + (i % 2 === 0 ? 8 : -8));
    }
    ctx.stroke();

    // arms (thin puppet limbs)
    ctx.strokeStyle = '#ff5bd1';
    ctx.lineWidth = 5;
    const armSwing = Math.sin(t * 4) * 20;
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 10);
    ctx.lineTo(cx - 95, cy + 20 + armSwing * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 55, cy - 10);
    ctx.lineTo(cx + 95, cy + 20 - armSwing * 0.3);
    ctx.stroke();

    ctx.restore();
  }

  function drawFightBar(ctx, x, y, w, h, pos, targetX, targetW) {
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffe14d';
    ctx.fillRect(x + targetX, y, targetW, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + pos - 3, y - 6, 6, h + 12);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function drawCenteredTitle(ctx, w, y, text, size, color) {
    ctx.save();
    ctx.fillStyle = color || '#fff';
    ctx.font = `bold ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, y);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  return {
    FONT, wrapText, roundRect, drawBackground, drawDialogueBox, drawSkipButton,
    drawBossHPBar, drawPartyBar, drawMenu, drawList, drawBattleBox, drawHeart,
    drawBullet, drawBoss, drawFightBar, drawCenteredTitle
  };
})();
