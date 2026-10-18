"""Read back the scheduled video and subtitle processing without changing publication."""
import json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'studio'))
from app import publish_youtube as yt
OUT=Path(__file__).resolve().parent
meta=json.loads((OUT/'publication.json').read_text())
video_id=json.loads((OUT/'youtube-upload.json').read_text())['video_id']
with yt._verified_session(yt.EXPECTED_CHANNEL_ID,None,None) as (session,identity):
    video=session.get('videos.list',yt.API+'/videos',{'part':'snippet,status,contentDetails,processingDetails','id':video_id})['items'][0]
    captions=session.get('captions.list',yt.API+'/captions',{'part':'snippet','videoId':video_id})
checks={
    'channel':video['snippet']['channelId']==yt.EXPECTED_CHANNEL_ID,
    'title':video['snippet']['title']==meta['title'],
    'description':video['snippet']['description']==meta['description'],
    'scheduled':video['status'].get('publishAt')==meta['schedule']['youtube_utc'],
    'private_until_scheduled':video['status']['privacyStatus']=='private',
    'processed':video['status']['uploadStatus']=='processed',
    'custom_thumbnail':video.get('contentDetails',{}).get('hasCustomThumbnail') is True,
    'subtitles_serving':any(c['snippet'].get('language')=='hi' and c['snippet'].get('status')=='serving' for c in captions.get('items',[]))}
result={'video_id':video_id,'url':f'https://www.youtube.com/watch?v={video_id}','checks':checks,'video':video,'captions':captions,'all_passed':all(checks.values())}
(OUT/'youtube-verification.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'video_id':video_id,'checks':checks,'all_passed':result['all_passed']}))
