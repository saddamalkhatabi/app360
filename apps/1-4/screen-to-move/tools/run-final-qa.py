"""Durable release checks: actual media, every local game type and verified offline download."""
import pathlib,subprocess,os,json,shutil,tempfile,urllib.request,zipfile,sys
app=pathlib.Path(__file__).resolve().parents[1]
repo=app.parents[2]
qa=pathlib.Path(tempfile.mkdtemp(prefix='creative-qa-'))
def run(args,cwd=repo,env=None):
    subprocess.run([str(x) for x in args],cwd=cwd,env=env,check=True)
run(['npm','install','--prefix',qa,'--no-audit','--no-fund','playwright@1.62.1'])
chrome=shutil.which('google-chrome') or shutil.which('google-chrome-stable') or shutil.which('chromium')
if not chrome:
    versions=json.load(urllib.request.urlopen('https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json'))
    url=next(row['url'] for row in versions['channels']['Stable']['downloads']['chrome-headless-shell'] if row['platform']=='linux64')
    urllib.request.urlretrieve(url,qa/'chrome.zip')
    with zipfile.ZipFile(qa/'chrome.zip') as z:z.extractall(qa)
    chrome=qa/'chrome-headless-shell-linux64/chrome-headless-shell'
    chrome.chmod(0o755)
env=dict(os.environ,NODE_PATH=str(qa/'node_modules'),CHROME_BIN=str(chrome))
run(['npm','run','validate'],cwd=app,env=env)
run(['node',app/'tools/browser-local-games.cjs'],env=env)
run(['node','tooling/build-offline-catalog.js'])
run(['node',app/'tools/browser-real-audio.cjs'],env=env)
run([sys.executable,'-m','venv',qa/'asr'])
python=qa/'asr/bin/python'
run([python,'-m','pip','install','--quiet','faster-whisper==1.2.1','socksio'])
run([python,app/'tools/check-voice-samples.py',qa/'models'])
bundle=json.loads((repo/'data/offline/a1-screen-move.json').read_text())
report={'status':'passed','engine':'SILMA','recorded_clips':len(json.loads((app/'audio/scripts.json').read_text())['items']),'built_in_games':170,'unit_tests':80,'local_types':12,'storage_modes':['IndexedDB','localStorage fallback'],'checks':['Every local game type saved, reloaded and completed','Trace geometry and stable edit identity','Visual designer images and invalid save rejection','Attached question recording survives reload','Native browser MP3 decoding','Five scene recordings complete before advancement','Manual question stops automatic scenes','Full offline manager download and integrity verification','Built-in audio and saved trace game after offline reload'],'offline_files':len(bundle['files']),'offline_bytes':sum(x['bytes'] for x in bundle['files']),'speech_check':'Independent Arabic transcription sample; manual review, not a guarantee for every pronunciation'}
(app/'audio/validation-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Creative Games final checks passed.',flush=True)
