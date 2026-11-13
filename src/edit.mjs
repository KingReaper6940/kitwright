import {clone,LIMITS} from './model.mjs';
function next(rows,prefix){const used=new Set(rows.map(r=>r.id));let n=1;while(used.has(prefix+n))n++;return prefix+n;}
export function editDraft(project,action){
 const p=structuredClone(project);
 if(action.type==='add-part'){if(p.parts.length>=LIMITS.parts)throw Error('Maximum 40 parts.');let n=1;while(p.parts.some(x=>x.code==='PART-'+n))n++;p.parts.push({id:next(p.parts,'p'),code:'PART-'+n,name:'New part',stock:0,reserved:0,location:''});}
 else if(action.type==='add-kit'){if(p.kits.length>=LIMITS.kits)throw Error('Maximum eight kits.');p.kits.push({id:next(p.kits,'k'),name:'New kit',quantity:0});}
 else if(action.type==='add-line'){if(p.lines.length>=LIMITS.lines)throw Error('Maximum 100 recipe lines.');const pairs=new Set(p.lines.map(l=>JSON.stringify([l.kitId,l.partId])));let pair;for(const k of p.kits)for(const part of p.parts)if(!pair&&!pairs.has(JSON.stringify([k.id,part.id])))pair=[k.id,part.id];if(!pair)throw Error('Add a part and kit, or create an unused kit/part pair first.');p.lines.push({id:next(p.lines,'l'),kitId:pair[0],partId:pair[1],units:1});}
 else if(action.type==='remove-part'){if(p.lines.some(l=>l.partId===action.id))throw Error('Remove this part from all recipe lines before deleting it.');p.parts=p.parts.filter(x=>x.id!==action.id);}
 else if(action.type==='remove-kit'){p.kits=p.kits.filter(x=>x.id!==action.id);p.lines=p.lines.filter(x=>x.kitId!==action.id);}
 else if(action.type==='remove-line')p.lines=p.lines.filter(x=>x.id!==action.id);
 else throw Error('Unknown editor action.');
 return p;
}
export function history(initial){let current=clone(initial),past=[],future=[];return {get value(){return structuredClone(current)},get canUndo(){return !!past.length},get canRedo(){return !!future.length},commit(p){const q=clone(p);if(JSON.stringify(q)===JSON.stringify(current))return false;past.push(current);past=past.slice(-25);future=[];current=q;return true},undo(){if(!past.length)return false;future.push(current);current=past.pop();return true},redo(){if(!future.length)return false;past.push(current);past=past.slice(-25);current=future.pop();return true}}}
