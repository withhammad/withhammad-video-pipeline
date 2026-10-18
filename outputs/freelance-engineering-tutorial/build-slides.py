"""Build the original slide deck and narration coverage map before recording."""
from pathlib import Path
import json
OUT=Path(__file__).resolve().parent
spec=[
('01-two-models',[
('Two kinds of freelance work','compare',['Contract: join a team','Project: deliver a defined outcome']),
('The contract model','cards',['Existing engineering team','Specific capability needed','Agreed capacity and responsibilities']),
('The project model','flow',['Understand the problem','Define the scope','Build and verify the outcome']),
('A year of contract work','timeline',['One main engagement','Plan for the end date','Account for client concentration']),
('A year of project work','timeline',['Delivery','Sales and proposals','Next project']),
('Choose the right conversation','compare',['Team fit and technical experience','Business problem and clear delivery'])]),
('02-enterprise-and-buyers',[
('Why a team hires a contractor','cards',['Fill a capability gap','Add delivery capacity','Work within an existing system']),
('Examples of engineering work','grid',['Software features','Data pipelines','Deployment and monitoring','LLM integration and evaluation']),
('A document-search feature','flow',['Access-controlled documents','Retrieval and answer generation','Sources and evaluation']),
('The smaller business buyer','compare',['Repeated manual work','A usable end-to-end solution']),
('Start with a small test','flow',['Observe the current process','Use safe examples','Agree on one limited trial']),
('Speak to the buyer','compare',['Technical team: design and tests','Business owner: workflow and results'])]),
('03-business-automation',[
('Work still done by hand','grid',['Invoices','Email routing','Copying between tools','Quotations','Weekly reports','Repeated questions','Document search','Data entry','Planning']),
('Choose the simplest useful approach','cards',['Rules for predictable inputs','Integration for moving clean data','Models where interpretation helps']),
('The back-office workflow','flow',['Email / documents / questions','Rules + validation + assistance','CRM / tickets / accounting']),
('Automation or assistant?','compare',['Event starts the background process','Employee starts an on-demand task']),
('Make the boundaries visible','cards',['Draft versus send','Incomplete inputs go to review','Test failures as well as success']),
('Sell a measurable outcome','flow',['Measure the current process','Run a limited trial','Compare time and errors']),
('Delivery includes adoption','cards',['Staff can use it','Staff can spot mistakes','Staff know how to get help'])]),
('04-delivery-and-examples',[
('Delivering a background service','flow',['Trigger','Process and validate','Write result + record outcome']),
('Instructions and connections','compare',['Skill: how to perform the task','Connection: permitted data and tools']),
('Where MCP can fit','flow',['Assistant application','Defined MCP capabilities','Business data and actions']),
('Project examples: knowledge work','grid',['Broker assistant','Employee handbook assistant','Document checks']),
('Project examples: decisions','compare',['Creator analytics','AI advisory and a test plan']),
('Project examples: support','compare',['Ticket routing and draft replies','Voice intake and human handoff']),
('A proposal that can be checked','cards',['Inputs and outputs','Scope and boundaries','Acceptance checks'])]),
('05-combining-and-retainers',[
('Combining work responsibly','timeline',['Main contract','Limited project capacity','Protected delivery time']),
('Coding agents still need review','flow',['Delegate a bounded task','Inspect the result','Test before delivery']),
('Starting alongside employment','cards',['Understand obligations','Keep accounts and data separate','Start with a small scope']),
('The maintenance layer','cards',['Monitoring and updates','Defined support scope','Clear costs and responsibilities']),
('Keep new features separate','flow',['New request','Scope and estimate','Agree and test the change']),
('From services to an owned product','flow',['Repeated problem','Reusable solution','Find and support users']),
('Choose your next step','cards',['Which customer do you understand?','Capacity or a defined outcome?','How will you verify the result?'])])]
slides=[]
for chapter,entries in spec:
 paras=(OUT/'scripts'/f'{chapter}.txt').read_text().strip().split('\n\n')
 assert len(paras)==len(entries),(chapter,len(paras),len(entries))
 for n,((title,kind,items),paragraph) in enumerate(zip(entries,paras)):
  slides.append(dict(id=len(slides)+1,chapter=chapter,paragraph=n,title=title,kind=kind,items=items,narration=paragraph,anchor=' '.join(paragraph.split()[:8])))
(OUT/'slides').mkdir(exist_ok=True)
(OUT/'slides'/'slides.json').write_text(json.dumps(slides,ensure_ascii=False,indent=2)+'\n')
print('Built',len(slides),'slides with paragraph-level narration coverage')
