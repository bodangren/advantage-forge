import sharp from 'sharp';

const meta = await sharp('/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1/contact-sheet.png').metadata();
console.log('contact sheet', meta.width, 'x', meta.height);
