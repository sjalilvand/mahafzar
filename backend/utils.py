import re

def slugify(text):
    text = text.strip().lower()
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'[^a-zA-Z0-9\u0600-\u06FF\-]', '', text)
    return text
