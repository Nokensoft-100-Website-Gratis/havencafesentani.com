/**
 * Haven Cafe - Menu Book Builder
 *
 * Converts the official menu PDF into web-friendly assets:
 *   images/menu-book/page-NN.webp        (1400px wide, full-screen reader)
 *   images/menu-book/page-NN-thumb.webp  (420px wide, page grid)
 *   images/menu-book/<pdf-name>.pdf      (lightweight PDF for download)
 *   js/menu-book.js                      (page titles, categories, search text)
 *
 * Usage (from the tools/ folder):
 *   npm install
 *   node build-menu.mjs ../_REVISI/haven-cafe-sentani-menu-YYYYMMDD.pdf
 *
 * If the new PDF has different pages, update PAGES below first
 * (one entry per page, in order: title, category id, extra search keywords).
 */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PAGES = [
    ['Cover & Opening Hours', 'info', 'haven cafe sentani since 2017 jam buka opening hours alamat address contact'],
    ['Kopi Hitam · Black Coffee', 'coffee', 'black coffee kopi hitam manual brew'],
    ['Kopi Susu · Basic, Flavor, Oat & Blend', 'coffee', 'milk coffee kopi susu milky'],
    ['Coffee Mocktail', 'coffee', 'coffee with a twist mocktail'],
    ['Milky Non-Coffee & Chocolate', 'noncoffee', 'non coffee susu milk cokelat coklat'],
    ['Frappé Series', 'noncoffee', 'frappe blended ice'],
    ['Tea Menu', 'fresh', 'teh tea jumbo iced tea'],
    ['Yakult Menu', 'fresh', 'yakult'],
    ['Squash & Mocktail', 'fresh', 'squash soda mocktail'],
    ['Jus · Fresh Juice', 'fresh', 'jus juice buah fruit'],
    ['Snacks · Roti Bakar, Dim Sum & Pisang', 'snacks', 'snack cemilan camilan toast'],
    ['Snacks · Kentang & Gorengan', 'snacks', 'snack cemilan camilan fries'],
    ['Healthy Salad', 'snacks', 'salad sayur healthy sehat'],
    ['Smoothie Bowl', 'snacks', 'smoothies bowl buah sehat'],
    ['Homemade Pizza', 'meals', 'pizza makanan food'],
    ['Western Specials', 'meals', 'western makanan food steak'],
    ['Western Combo, Sandwich & Wrap', 'meals', 'western burger hotdog sandwich wrap makanan food'],
    ['Rice Bowl', 'meals', 'rice bowl nasi makanan food'],
    ['Asian Cuisine · Nasi & Mie', 'meals', 'asian nasi goreng mie indomie makanan food'],
    ['Delivery Info', 'info', 'delivery ongkir antar pesan order free ongkir'],
];

const CATEGORIES = [
    { id: 'all', label: 'All Pages', icon: 'fa-book-open' },
    { id: 'coffee', label: 'Coffee', icon: 'fa-mug-hot' },
    { id: 'noncoffee', label: 'Non-Coffee', icon: 'fa-glass-water' },
    { id: 'fresh', label: 'Tea & Fresh', icon: 'fa-lemon' },
    { id: 'snacks', label: 'Snacks & Healthy', icon: 'fa-cookie-bite' },
    { id: 'meals', label: 'Main Course', icon: 'fa-utensils' },
    { id: 'info', label: 'Info & Delivery', icon: 'fa-circle-info' }
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) {
    console.error('Usage: node build-menu.mjs <path-to-menu.pdf>');
    process.exit(1);
}
const pdfName = path.basename(input);
const version = (pdfName.match(/(\d{8})/) || [, new Date().toISOString().slice(0, 10).replace(/-/g, '')])[1];
const outDir = path.join(root, 'images/menu-book');
const normalize = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(input)), verbosity: 0 }).promise;
if (doc.numPages !== PAGES.length) {
    console.error(`PDF has ${doc.numPages} pages but PAGES lists ${PAGES.length}. Update PAGES first.`);
    process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const light = await PDFDocument.create();
light.setTitle('Haven Cafe Sentani - Menu');
const pages = [];

for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 2.2 });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const png = await canvas.encode('png');

    const n = String(i).padStart(2, '0');
    await sharp(png).resize({ width: 1400 }).webp({ quality: 78 }).toFile(path.join(outDir, `page-${n}.webp`));
    await sharp(png).resize({ width: 420 }).webp({ quality: 70 }).toFile(path.join(outDir, `page-${n}-thumb.webp`));

    const jpg = await sharp(png).resize({ width: 1400 }).jpeg({ quality: 76, mozjpeg: true }).toBuffer();
    const img = await light.embedJpg(jpg);
    light.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });

    const text = (await page.getTextContent()).items.map(item => item.str).join(' ');
    const [title, cat, extra] = PAGES[i - 1];
    pages.push({ title, cat, search: normalize(`${title} ${extra} ${text}`) });
    console.log(`page ${i}/${doc.numPages}`);
}

const pdfOut = `images/menu-book/${pdfName}`;
fs.writeFileSync(path.join(root, pdfOut), await light.save());

const js = `/**
 * Haven Cafe - Menu Book Data
 * GENERATED by tools/build-menu.mjs from _REVISI/${pdfName} - do not edit by hand.
 * Menu pages: images/menu-book/page-NN.webp (+ -thumb.webp)
 */

const MENU_BOOK = {
    version: '${version}',
    pdf: '${pdfOut}',
    categories: [
${CATEGORIES.map(c => `        { id: '${c.id}', label: '${c.label}', icon: '${c.icon}' }`).join(',\n')}
    ],
    pages: [
${pages.map(p => `        ${JSON.stringify(p)}`).join(',\n')}
    ]
};
`;
fs.writeFileSync(path.join(root, 'js/menu-book.js'), js);

const size = (fs.statSync(path.join(root, pdfOut)).size / 1048576).toFixed(1);
console.log(`Done. Light PDF: ${size} MB. Update the "(x MB)" label and "Menu updated" date in index.html if they changed.`);
