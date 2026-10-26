import copy,json,pathlib,sys,tempfile,unittest,subprocess
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from full_praise_batches import tasks,metadata,valid,progress,REVISION
from celebration_name_batches import digest,write_json
import importlib.util
spec=importlib.util.spec_from_file_location('merger',pathlib.Path(__file__).with_name('merge-full-name-praise.py'))
merger=importlib.util.module_from_spec(spec);spec.loader.exec_module(merger)
class BatchTests(unittest.TestCase):
 def test_partitions_and_gender_text(self):
  catalog=json.loads(pathlib.Path('resources/celebration-audio/names.json').read_text())
  all_tasks=tasks(catalog);shards=[t for i in range(20) for t in tasks(catalog,i,20)]
  self.assertEqual(len(all_tasks),2084);self.assertEqual(len({t['path'] for t in shards}),2084)
  for t in all_tasks:
   self.assertEqual(t['text'].split().count('يَا'),1)
   self.assertIn('عَزِيزَتِي' if t['gender']=='f' else 'عَزِيزِي',t['text'])
 def test_hash_bound_resume_and_stale_text(self):
  with tempfile.TemporaryDirectory() as directory:
   root=pathlib.Path(directory);out=root/'out';incoming=root/'incoming';out.mkdir()
   catalog={'records':[{'id':'name-1','name':'نور','spoken_text':'نُور','gender':'girl'}]}
   write_json(out/'names.json',catalog);task=tasks(catalog)[0]
   source=incoming/task['path'];source.parent.mkdir(parents=True)
   subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','sine=frequency=440:duration=0.6','-ar','24000','-ac','1',str(source)],check=True)
   audio={**task,'revision':REVISION,'duration_ms':600,'sha256':digest(source),'auditory_review':'approved','review':{'sha256':digest(source)}}
   write_json(incoming/'reports/shard-0.json',{'revision':REVISION,'records':[{'id':'name-1','audio':audio}]})
   self.assertTrue(valid(task,audio,incoming))
   self.assertFalse(valid({**task,'text':'أحسنت يا اسم آخر'},audio,incoming))
   result=merger.merge(incoming,out);self.assertEqual(result['recorded'],1);self.assertEqual(result['pending'],3)
   current=json.loads((out/'names.json').read_text());a=current['records'][0]['praise_audio']['f']
   self.assertEqual(a['auditory_review'],'pending');self.assertNotIn('review',a)
   a['auditory_review']='approved';a['review']={'sha256':a['sha256']};write_json(out/'names.json',current)
   merger.merge(incoming,out)
   self.assertEqual(json.loads((out/'names.json').read_text())['records'][0]['praise_audio']['f']['auditory_review'],'approved')
   current['records'][0]['spoken_text']='نُورَا';write_json(out/'names.json',current)
   result=merger.merge(incoming,out);self.assertEqual(result['recorded'],0)
   self.assertEqual(digest(out/task['path']),audio['sha256'])
if __name__=='__main__':unittest.main()
