"""Orthographic ASR comparison and measured word cues; no prompted transcription."""
import re, unicodedata

def norm(word):
    word=''.join(c for c in unicodedata.normalize('NFKD',word) if not unicodedata.combining(c))
    word=word.translate(str.maketrans({'أ':'ا','إ':'ا','آ':'ا','ٱ':'ا','ى':'ي','ة':'ه'}))
    word=re.sub(r'[^\u0621-\u063a\u0641-\u064a]','',word)
    # Standard alternative ASR spellings, without adding or deleting spoken words.
    return {'باسمك':'بسمك','ربي':'رب','ويصلحوا':'ويصلح'}.get(word,word)

def canonical(text):return ''.join(norm(x) for x in text.split())

def cues_from_words(expected,recognized):
    spans=[];pos=0
    for w in recognized:
        word=norm(w.word)
        if not word:continue
        spans.append((pos,pos+len(word),w.start,w.end));pos+=len(word)
    cues=[];pos=0
    for i,word in enumerate(expected.split()):
        end=pos+len(norm(word));overlap=[r for r in spans if r[0]<end and r[1]>pos]
        assert overlap,word
        cues.append([i,round(overlap[0][2]*1000),round(overlap[-1][3]*1000)]);pos=end
    assert all(c[2]>c[1] for c in cues)
    assert all(cues[i][1]>=cues[i-1][2]-20 for i in range(1,len(cues)))
    return cues
