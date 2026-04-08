const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

let promo1Str = html.substring(html.indexOf('<!-- Promo 1 -->'), html.indexOf('<!-- Promo 2 -->'));
let promo2Str = html.substring(html.indexOf('<!-- Promo 2 -->'), html.indexOf('<!-- Promo 3 -->'));

if (promo1Str && promo2Str) {
    let p1New = promo1Str
        .replace('bg-white rounded-3xl p-3', 'bg-[#BA0000] rounded-3xl overflow-hidden flex items-center justify-center')
        .replace('<div class="overflow-hidden rounded-2xl relative">\r\n', '')
        .replace('<div class="overflow-hidden rounded-2xl relative">\n', '')
        .replace('class="w-full h-auto object-cover', 'class="w-full h-full object-cover absolute inset-0')
        .replace('                        </div>\r\n                </div>\r\n\r\n                <div class="flex flex-col', '                </div>\r\n\r\n                <div class="flex flex-col')
        .replace('                        </div>\n                </div>\n\n                <div class="flex flex-col', '                </div>\n\n                <div class="flex flex-col');
        
    p1New = p1New.replace(/<\/div>\s*<\/div>\s*$/, '\n                </div>'); 
    
    let p2New = promo2Str
        .replace('bg-white rounded-3xl p-3', 'bg-[#BA0000] rounded-3xl overflow-hidden flex items-center justify-center h-full')
        .replace('<div class="overflow-hidden rounded-2xl relative">\r\n', '')
        .replace('<div class="overflow-hidden rounded-2xl relative">\n', '')
        .replace('class="w-full h-auto object-cover', 'class="w-full h-full object-cover absolute inset-0')
        .replace(/<\/div>\s*<\/div>\s*$/, '\n                </div>\n                '); 
        
    html = html.replace(promo1Str, p1New);
    html = html.replace(promo2Str, p2New);
    
    html = html.replace(/bg-\[#BA0000\] rounded-3xl p-3/g, 'bg-[#BA0000] rounded-3xl');
    
    fs.writeFileSync('index.html', html);
    console.log('Fixed padding and styles');
} else {
    console.log('Error reading promos');
}
