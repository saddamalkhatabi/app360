"""Wait for only the matching original recording batch, never cancel its work."""
import argparse,json,os,time,urllib.request,urllib.error

URL='https://api.github.com/repos/saddamalkhatabi/app360/actions/runs/38721379759/jobs?per_page=100'

def batch_finished(jobs, part):
 wanted='record ('+str(part)+')'
 matches=[j for j in jobs if j['name']==wanted]
 if len(matches)!=1: raise ValueError('Expected exactly one original batch: '+wanted)
 return matches[0]['status']=='completed'

def main():
 p=argparse.ArgumentParser();p.add_argument('--part',required=True,type=int);p.add_argument('--once',action='store_true');a=p.parse_args()
 assert 0<=a.part<64
 failures=0
 for attempt in range(330):
  headers={'Accept':'application/vnd.github+json'}
  if os.environ.get('GH_TOKEN'):headers['Authorization']='Bearer '+os.environ['GH_TOKEN']
  try:
   with urllib.request.urlopen(urllib.request.Request(URL,headers=headers),timeout=30) as response:data=json.load(response)
   assert len(data['jobs'])==data['total_count'], 'Incomplete original jobs response'
   done=batch_finished(data['jobs'],a.part);failures=0
  except (urllib.error.URLError,TimeoutError) as error:
   failures+=1
   if failures>=5:raise
   print('Temporary status lookup error; retrying',type(error).__name__,flush=True)
   time.sleep(15);continue
  print('Original batch',a.part,'finished' if done else 'still recording',flush=True)
  if done:return 0
  if a.once:return 2
  time.sleep(60)
 raise SystemExit('Matching original batch is still active; no replacement started')

if __name__=='__main__':raise SystemExit(main())
