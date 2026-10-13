from silma_phonics_engine import util
for text in ["بَ.", "بِ.", "بُ.", "أَبْ.", "أَبَّ.", "بَنْ."]:
 assert util.normalize_last_word(text)==text, text
 assert not util.text_has_tashkeel(text)
print("PASS authored final vowels preserved; implicit tashkeel speed boost disabled")
