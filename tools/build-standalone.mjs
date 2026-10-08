// Gera UM arquivo HTML so (fontes, CSS, JS, imagem e video embutidos) para mandar ao cliente por e-mail/WhatsApp/pen drive.
// Uso (depois de rodar tools\build.ps1):  node tools/build-standalone.mjs [video.mp4]
// Padrao do video: assets/media/hero-fundo-720.mp4. Saida: entrega/tractia-previa-cliente.html (fora do git).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(root, p));
const uri = (p, mime) => `data:${mime};base64,${rd(p).toString('base64')}`;
const videoRel = process.argv[2] || 'assets/media/hero-fundo-720.mp4';

let html = rd('index.html').toString('utf8');

// fontes (CSS inline ja aponta para assets/fonts) e preloads
html = html.replace(/<link rel="preload"[^>]*assets\/fonts[^>]*>\s*/g, '');
html = html.replace(/url\('assets\/fonts\/([^']+\.woff2)'\)/g, (_, f) => `url('${uri('assets/fonts/' + f, 'font/woff2')}')`);

// JS dentro do HTML (escapa o fechamento de script)
html = html.replace(/<script defer src="assets\/app\.min\.js[^"]*"><\/script>/, () => {
  const js = rd('assets/app.min.js').toString('utf8').replace(/<\/script/gi, '<\/script');
  return `<script>${js}</script>`;
});

// imagem e video do fundo (o mesmo arquivo serve para desktop e celular)
html = html.replace('src="assets/media/hero-fundo.jpg"', () => `src="${uri('assets/media/hero-fundo.jpg', 'image/jpeg')}"`);
const vuri = uri(videoRel, 'video/mp4');
html = html.replace(/data-hd="[^"]*"/, () => `data-hd="${vuri}"`).replace(/\s*data-sd="[^"]*"/, '');

// favicon embutido; remove o que depende de outros arquivos
html = html.replace(/<link rel="icon" href="favicon\.svg"[^>]*>/, () => `<link rel="icon" href="${uri('favicon.svg', 'image/svg+xml')}" type="image/svg+xml">`);
html = html.replace(/<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*(?:favicon-32\.png|apple-touch-icon\.png|site\.webmanifest)[^>]*>\s*/g, '');

const left = [...html.matchAll(/(?:src|href)="(?!data:|https?:|#|mailto:|tel:)([^"]+)"/g)].map((m) => m[1]);
const out = path.join(root, 'entrega');
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'tractia-previa-cliente.html');
fs.writeFileSync(file, html);
console.log('ok', (fs.statSync(file).size / 1048576).toFixed(2) + ' MB', file);
if (left.length) console.log('referencias externas restantes:', left.join(', '));
