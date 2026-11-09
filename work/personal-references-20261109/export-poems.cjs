const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'../..');
const {transformSync}=require(path.join(root,'studio/remotion/node_modules/esbuild'));
const file=path.join(root,'studio/remotion/src/personal-iqbal/poetry-data.ts');
const {code}=transformSync(fs.readFileSync(file,'utf8'),{loader:'ts',format:'cjs'});
const Module=require('module');const mod=new Module(file);mod._compile(code,file);
fs.writeFileSync(path.join(__dirname,'poems.json'),JSON.stringify(mod.exports.poems,null,2)+'\n');
