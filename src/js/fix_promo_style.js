const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The outer div for Promo 1 and 2 has this class originally:
// "group relative bg-white rounded-3xl p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full"
// AND FOR PROMO 2:
// "group relative bg-white rounded-3xl p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"

html = html.replace(/<div\s+class="group relative bg-white rounded-3xl p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer( h-full)?"([^>]*)>\s*<div\s+class="absolute(.*?)"((?:[\s\S]*?)<\/(?:div|h3|span)>)\s*<\/div>\s*<div class="overflow-hidden rounded-2xl relative">\s*<img loading="lazy" class="w-full h-auto(.*?)"\s*src="([^"]+)" alt="([^"]+)">\s*(<!-- Overlay Gradient -->\s*)?<div\s+class="absolute inset-0 bg-gradient-to-to([\s\S]*?)<\/div>/g, (match) => {
    // Too complex Regex. Let's do simple string replacements.
    return match;
});

// Let's use simple string replacements

// PROMO 1
let promo1Str = html.substring(html.indexOf('<!-- Promo 1 -->'), html.indexOf('<!-- Promo 2 -->'));
// PROMO 2
let promo2Str = html.substring(html.indexOf('<!-- Promo 2 -->'), html.indexOf('<!-- Promo 3 -->'));

if (promo1Str && promo2Str) {
    let p1New = promo1Str
        .replace('bg-white rounded-3xl p-3', 'bg-[#BA0000] rounded-3xl overflow-hidden flex items-center justify-center')
        .replace('<div class="overflow-hidden rounded-2xl relative">\r\n', '')
        .replace('<div class="overflow-hidden rounded-2xl relative">\n', '')
        .replace('class="w-full h-auto object-cover', 'class="w-full h-full object-cover absolute inset-0')
        .replace('                        </div>\r\n                </div>\r\n\r\n                <div class="flex flex-col', '                </div>\r\n\r\n                <div class="flex flex-col')
        .replace('                        </div>\n                </div>\n\n                <div class="flex flex-col', '                </div>\n\n                <div class="flex flex-col');
        
    // Specifically fix the closing tags of Promo 1
    // Promo 1 ends right before `<div class="flex flex-col gap-10 h-full">\n<!-- Promo 2 -->`
    p1New = p1New.replace(/<\/div>\s*<\/div>\s*$/, '\n                </div>'); 
    
    let p2New = promo2Str
        .replace('bg-white rounded-3xl p-3', 'bg-[#BA0000] rounded-3xl overflow-hidden flex items-center justify-center h-full') // Made it h-full too
        .replace('<div class="overflow-hidden rounded-2xl relative">\r\n', '')
        .replace('<div class="overflow-hidden rounded-2xl relative">\n', '')
        .replace('class="w-full h-auto object-cover', 'class="w-full h-full object-cover absolute inset-0')
        .replace(/<\/div>\s*<\/div>\s*$/, '\n                </div>\n                '); 
        
    html = html.replace(promo1Str, p1New);
    html = html.replace(promo2Str, p2New);
    
    // Also change Promo 3 to remove p-3 if it had it
    html = html.replace(/bg-\[#BA0000\] rounded-3xl p-3/g, 'bg-[#BA0000] rounded-3xl');
    
    fs.writeFileSync('index.html', html);
    console.log('Fixed padding and styles');
} else {
    console.log('Error reading promos');
}
