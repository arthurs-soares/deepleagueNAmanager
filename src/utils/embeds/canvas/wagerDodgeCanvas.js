const { createCanvas: createCanvasNode, loadImage: loadImageNode } = (() => {
  try { return require('canvas'); } catch (_) {}
  try { return require('@napi-rs/canvas'); } catch (_) {}
  return { createCanvas: null, loadImage: null };
})();

function getCanvasApi() {
  if (!createCanvasNode || !loadImageNode) {
    throw new Error('Canvas module not available');
  }
  return { createCanvas: createCanvasNode, loadImage: loadImageNode };
}

function drawCircularAvatar(ctx, img, x, y, size = 128) {
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x - r, y - r, size, size);
  ctx.restore();
}

function drawRedX(ctx, x, y, size = 128, color = '#ff4444', lineWidth = 8) {
  const r = size / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r, y - r);
  ctx.lineTo(x + r, y + r);
  ctx.moveTo(x + r, y - r);
  ctx.lineTo(x - r, y + r);
  ctx.stroke();
  ctx.restore();
}

function drawLabelAndName(ctx, label, name, x, yLabel, yName) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(label, x, yLabel);
  ctx.font = '16px Arial';
  ctx.fillText(name, x, yName);
  ctx.restore();
}

async function createDodgeImage(dodgerUser, opponentUser) {
  const { createCanvas, loadImage } = getCanvasApi();

  const width = 600;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#2f3136';
  ctx.fillRect(0, 0, width, height);

  // Positions and sizes
  const size = 128;
  const leftX = 150;
  const rightX = 450;
  const centerY = 150;

  // Load avatars
  const dodgerUrl = dodgerUser.displayAvatarURL({ extension: 'png', size: 128 });
  const opponentUrl = opponentUser.displayAvatarURL({ extension: 'png', size: 128 });
  const [dodgerImg, opponentImg] = await Promise.all([
    loadImage(dodgerUrl),
    loadImage(opponentUrl)
  ]);

  // Draw avatars
  drawCircularAvatar(ctx, dodgerImg, leftX, centerY, size);
  drawCircularAvatar(ctx, opponentImg, rightX, centerY, size);

  // Red X over the dodger
  drawRedX(ctx, leftX, centerY, size, '#ff4444', 8);

  // Labels and names
  drawLabelAndName(ctx, 'DODGER', dodgerUser.username, leftX, 40, 280);
  drawLabelAndName(ctx, 'OPPONENT', opponentUser.username, rightX, 40, 280);

  return canvas.toBuffer('image/png');
}

module.exports = { createDodgeImage };

