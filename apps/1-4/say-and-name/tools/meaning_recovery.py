"""Conservative spelling equivalence and authored pronunciation recovery helpers."""
import re
from meaning_speech_qa import normalize

def spoken_text(row, authored):
 text=authored.get(row['id'],row['text'])
 if normalize(text)!=normalize(row['text']):raise ValueError('Pronunciation hint changed words: '+row['id'])
 return text

def speech_chunks(text, segmented=False):
 if not segmented:return [text]
 # Authored commas mark phrase boundaries. Never cut or drop a word.
 phrases=[x.strip() for x in re.split(r'[،,;؛]',text) if x.strip()]
 if len(phrases)==1 and len(text.split())>8:
  words=text.split();middle=len(words)//2
  phrases=[' '.join(words[:middle]),' '.join(words[middle:])]
 if normalize(' '.join(phrases))!=normalize(text):raise ValueError('Chunking changed words')
 return phrases
