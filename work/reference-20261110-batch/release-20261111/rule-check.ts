import fs from 'node:fs';
import assert from 'node:assert/strict';
import {matchRule} from '/Users/hammad/.codex/worktrees/higgs-advisor-guides/withhammad-rebuild/src/lib/instagram/dm-rules';
const out='/Users/hammad/withhammad-video-pipeline/work/reference-20261110-batch/release-20261111';
const base=JSON.parse(fs.readFileSync(`${out}/pr21-deployed-rules.json`,'utf8'));
const next=JSON.parse(fs.readFileSync('src/content/dm-rules.json','utf8'));
assert.deepEqual({...next,rules:next.rules.filter((r:{keyword:string})=>r.keyword!=='FABLE')},base);
for(const key of ['HIGGS','ADVISOR','FABLE']){
 const rules=key==='FABLE'?next.rules:base.rules;
 assert.equal(matchRule(`Please send ${key.toLowerCase()}!`,undefined,rules)?.keyword,key);
 assert.equal(matchRule(`pre${key}post`,undefined,rules),null);
}
const proof={existingRulesPreserved:true,newRules:1,keyword:'FABLE',positiveCaseInsensitive:true,negativeSubstring:true,deployedHiggsAdvisorMatches:true,customerEventsSent:0};
fs.writeFileSync(`${out}/rules-validation.json`,JSON.stringify(proof,null,2)+'\n');console.log(proof);
