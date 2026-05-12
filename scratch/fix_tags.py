import os
import re

def fix_html_tags(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fix opening tags that should be <a> but are <button
    content = re.sub(r'<button([^>]*class="[^"]*text-red-600[^"]*")>', r'<a\1 href="../../auth/logout.php">', content)
    
    # Fix closing tags: if a line starts with <button, ensure it ends with </button> eventually
    # This is tricky with regex. Let's do a stateful fix.
    
    lines = content.split('\n')
    new_lines = []
    in_button = False
    in_a = False
    
    for line in lines:
        stripped = line.strip()
        
        # Check for opening tags
        if '<button' in line:
            in_button = True
            in_a = False
        elif '<a' in line:
            in_a = True
            in_button = False
            
        # Check for closing tags
        if '</a>' in line:
            if in_button:
                line = line.replace('</a>', '</button>')
                in_button = False
            elif in_a:
                in_a = False
        elif '</button>' in line:
            if in_a:
                line = line.replace('</button>', '</a>')
                in_a = False
            elif in_button:
                in_button = False
                
        new_lines.append(line)
        
    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))

files = [
    '/home/aniiporangbaik/development/projects/Burgerlicious/public/pages/menu_management.html',
    '/home/aniiporangbaik/development/projects/Burgerlicious/public/pages/order_queue.html',
    '/home/aniiporangbaik/development/projects/Burgerlicious/public/pages/analytics.html',
    '/home/aniiporangbaik/development/projects/Burgerlicious/public/pages/promo_management.html'
]

for file in files:
    fix_html_tags(file)
    print(f"Fixed {file}")
