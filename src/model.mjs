export const SCHEMA = 'kitwright-project-v1';
export const LIMITS = {parts:40, kits:8, lines:100, stock:999999, quantity:9999, units:9999};
export function text(value,max,name,multi=false) {
 if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)||(!multi&&/[\r\n\t]/.test(value))||[...value].some(c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff))throw Error('Invalid '+name+' (maximum '+max+' code units).');
}
export function integer(value,max,name,min=0) {if(!Number.isInteger(value)||value<min||value>max)throw Error(name+' must be a whole number '+min+'–'+max+'.');return value;}
export function parseInteger(source,max,name,min=0) {if(typeof source!=='string'||!/^(0|[1-9]\d*)$/.test(source))throw Error(name+' must be a plain whole number without leading zeros.');return integer(Number(source),max,name,min);}
function exact(obj,keys){return obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).sort().join('|')===[...keys].sort().join('|')}
function rows(value,max,name,fields){if(!Array.isArray(value)||value.length>max)throw Error('Maximum '+max+' '+name+'.');const ids=new Set();for(const row of value){if(!exact(row,fields)||typeof row.id!=='string'||!/^[A-Za-z0-9_-]{1,32}$/.test(row.id)||ids.has(row.id))throw Error('Invalid or duplicate '+name+' ID/fields.');ids.add(row.id);}return ids;}
export function validate(p){
 if(!exact(p,['schema','title','notes','parts','kits','lines'])||p.schema!==SCHEMA)throw Error('Unsupported project fields or version.');
 text(p.title,80,'title');text(p.notes,1000,'notes',true);if(!p.title.trim())throw Error('Project title is required.');
 const partIds=rows(p.parts,LIMITS.parts,'parts',['id','code','name','stock','reserved','location']),kitIds=rows(p.kits,LIMITS.kits,'kits',['id','name','quantity']);rows(p.lines,LIMITS.lines,'recipe lines',['id','kitId','partId','units']);
 const codes=new Set();for(const part of p.parts){text(part.code,32,'part code');text(part.name,80,'part name');text(part.location,64,'location');if(!part.code.trim()||!part.name.trim()||codes.has(part.code))throw Error('Part codes must be nonblank and distinct; names are required.');codes.add(part.code);integer(part.stock,LIMITS.stock,'Stock');integer(part.reserved,part.stock,'Outside-plan reserve');}
 for(const kit of p.kits){text(kit.name,80,'kit name');if(!kit.name.trim())throw Error('Kit name is required.');integer(kit.quantity,LIMITS.quantity,'Planned kits');}
 const pairs=new Set();for(const line of p.lines){if(!partIds.has(line.partId)||!kitIds.has(line.kitId))throw Error('Recipe line refers to a missing part or kit.');integer(line.units,LIMITS.units,'Units per kit',1);const pair=JSON.stringify([line.kitId,line.partId]);if(pairs.has(pair))throw Error('Each kit/part pair must have one recipe line. Combine its units explicitly.');pairs.add(pair);}
 for(const kit of p.kits)if(kit.quantity>0&&!p.lines.some(l=>l.kitId===kit.id))throw Error('Planned kit "'+kit.name+'" needs at least one recipe line.');
 return p;
}
export const blank=()=>({schema:SCHEMA,title:'Untitled kit plan',notes:'',parts:[],kits:[],lines:[]});
export const clone=p=>structuredClone(validate(p));
export function parseProject(source){if(typeof source!=='string'||source.length>300000)throw Error('Project exceeds 300,000 decoded code units.');return clone(JSON.parse(source.replace(/^\uFEFF/,'')));}
