"""Load public SILMA weights locally without changing authored teaching vowels."""
import os,sys,types,pathlib
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1';os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
for name in ['nemo_text_processing','nemo_text_processing.text_normalization','nemo_text_processing.text_normalization.normalize','catt_tashkeel']:
 sys.modules[name]=types.ModuleType(name)
class AuthoredOnly:
 def __init__(self,*args,**kw):raise RuntimeError('Use reviewed, authored phonics; no automatic normalization or diacritization')
sys.modules['nemo_text_processing.text_normalization.normalize'].Normalizer=AuthoredOnly
sys.modules['catt_tashkeel'].CATTEncoderOnly=AuthoredOnly
import torch,torchaudio,soundfile as sf
import silma_tts.api as api
import silma_tts.infer.utils_infer as util
# The publisher applies waqf by changing a final vowel to sukun, even when
# force_tashkeel=False. That is wrong for a lesson demonstrating a final short vowel.
util.normalize_last_word=lambda text:text
# Avoid the package's implicit 30% speed increase for heavily vowelled text.
util.text_has_tashkeel=lambda text:False

def load_engine(model,vocab,vocoder,threads=8):
 torch.set_num_threads(threads)
 def read_audio(path,*args,**kw):
  x,sr=sf.read(path,dtype='float32',always_2d=True);return torch.from_numpy(x.T.copy()),sr
 torchaudio.load=read_audio
 original_load=torch.load
 def memory_load(path,*args,**kw):
  if str(path)==str(model):kw['mmap']=True
  return original_load(path,*args,**kw)
 api.cached_path=lambda url,**kw:str(model) if url.endswith('model.pt') else str(vocab) if url.endswith('vocab.txt') else (_ for _ in ()).throw(RuntimeError('Unexpected model URL'))
 torch.load=memory_load
 try:engine=api.SilmaTTS(device='cpu',enable_normalizer=False,force_tashkeel=False,vocoder_local_path=str(vocoder))
 finally:torch.load=original_load
 original_sample=engine.ema_model.sample
 def bounded(*args,**kw):
  with torch.autocast('cpu',dtype=torch.bfloat16):return original_sample(*args,**kw)
 engine.ema_model.sample=bounded
 return engine
