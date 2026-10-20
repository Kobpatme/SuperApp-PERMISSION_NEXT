import { createHash } from 'node:crypto';
import Decimal from 'decimal.js';
import { buildOspRow, ospColumns, ospFuel } from '../src/lib/car-booking-osp.ts';

export const headers = {
 Employees: ['id','name','role'],
 Cars: ['car_id','license_plate','parking_floor','latest_mileage'],
 Bookings: ['booking_id','employee_id','employee_name','car_plate','destination','start_time','end_time','booking_status','start_mileage','mileage_on_return','actual_return_time','parking_floor','refueled','fuel_mileage','fuel_liters','fuel_amount'],
 BookingLogs: ['log_id','booking_id','log_time','log_type','location','mileage','refueled','fuel_liters','fuel_amount','note','gps_latitude','gps_longitude','gps_accuracy_meters','created_by','created_at'],
 BookingsOSP: [...ospColumns],
};
const fail = code => { throw new Error(code); };
export const normalizeEmployee = value => String(value ?? '').trim().replace(/^'+/,'').replace(/^0+/,'');
const rawEmployee = value => String(value ?? '').trim().replace(/^'+/,'');
const required = value => String(value ?? '').trim() || fail('MISSING_VALUE');
export function decimal(value, optional=false) {
 if (String(value ?? '').trim()==='') return optional ? null : fail('MISSING_NUMBER');
 const text=String(value).trim();
 if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(text)) fail('INVALID_NUMBER');
 const number=new Decimal(text.replaceAll(',',''));
 if (!number.isFinite() || number.lt(0)) fail('INVALID_NUMBER');
 return number.toFixed();
}
export function date(value, optional=false) {
 let text=String(value ?? '').trim();
 if (!text) return optional ? null : fail('MISSING_DATE');
 const thai=text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
 if (thai) { let year=Number(thai[3]); if(year>=2400)year-=543; text=`${year}-${thai[2]}-${thai[1]}T${thai[4]??'00'}:${thai[5]??'00'}:${thai[6]??'00'}`; }
 const match=text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/);
 if(!match)fail('INVALID_DATE');
 const [,y,m,d,h,min,s='00',ms='0',zone='+07:00']=match;
 const calendar=new Date(Date.UTC(+y,+m-1,+d));
 if(calendar.getUTCFullYear()!==+y || calendar.getUTCMonth()!==+m-1 || calendar.getUTCDate()!==+d || +h>23 || +min>59 || +s>59 || (zone!=='Z' && (+zone.slice(1,3)>23 || +zone.slice(4)>59)))fail('INVALID_DATE');
 const result=new Date(`${y}-${m}-${d}T${h}:${min}:${s}.${ms.padEnd(3,'0')}${zone}`);
 if(!Number.isFinite(result.getTime()))fail('INVALID_DATE');
 return result.toISOString();
}
export function boolean(value) {
 const text=String(value??'').trim().toLowerCase();
 if(['true','1'].includes(text))return true;
 if(['false','0',''].includes(text))return false;
 return fail('INVALID_BOOLEAN');
}
// RFC 4180, including embedded newlines; no password or other extra columns leave this parser.
export function parseCsv(input, sheet) {
 const text=input.replace(/^\ufeff/,''); const records=[]; let fields=[],cell='',quoted=false,closed=false,line=1,start=1;
 const push=()=>{fields.push(cell);cell='';closed=false;};
 for(let i=0;i<text.length;i++) {
  const c=text[i];
  if(quoted) { if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else{cell+=c;if(c==='\n')line++;} continue; }
  if(closed && ![',','\r','\n'].includes(c))fail('CSV_AFTER_QUOTE');
  if(c==='"'){if(cell)fail('CSV_UNEXPECTED_QUOTE');quoted=true;}
  else if(c===',')push();
  else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;push();if(fields.some(v=>v!==''))records.push({line:start,values:fields});fields=[];line++;start=line;}
  else cell+=c;
 }
 if(quoted)fail('CSV_UNCLOSED_QUOTE');
 if(cell||fields.length||closed){push();records.push({line:start,values:fields});}
 const head=records.shift()?.values.map(v=>v.trim())??[];
 if(new Set(head).size!==head.length || headers[sheet].some(v=>!head.includes(v)))fail(`CSV_HEADERS_${sheet}`);
 return records.map(record=>({line:record.line, invalid:record.values.length!==head.length, data:Object.fromEntries(headers[sheet].map(key=>[key,record.values[head.indexOf(key)]??'']))}));
}
export function stableId(kind, legacy) {
 const hex=createHash('sha256').update(`car-booking-import-v1:${kind}:${legacy}`).digest('hex');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const clean=row=>Object.fromEntries(Object.entries(row).filter(([key])=>!['line','mode'].includes(key)));
const canonical=row=>Object.fromEntries(Object.entries(clean(row)).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>[key,value instanceof Date?value.toISOString():value]));
const equal=(row,other)=>Object.entries(clean(row)).every(([key,value])=>{
 const current=other[key];
 if(current instanceof Date)return current.toISOString()===value;
 if(value===null)return current===null;
 if(typeof value==='boolean')return current===value;
 if(['latest_mileage','start_mileage','mileage_on_return','fuel_mileage','fuel_liters','fuel_amount','mileage','gps_latitude','gps_longitude','gps_accuracy_meters'].includes(key))return current!=null && new Decimal(current).eq(value);
 return String(current)===String(value);
});
export function totals(bookings,logs) {
 const months={};
 for(const booking of bookings.filter(b=>b.status==='completed')) {
  const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone:'Asia/Bangkok'}).formatToParts(new Date(booking.start_time));
  const month=parts.find(p=>p.type==='year').value+'-'+parts.find(p=>p.type==='month').value;
  const current=months[month]??{bookings:0,distance:'0',liters:'0',amount:'0'};
  const fuel=ospFuel({...booking,logs:logs.filter(l=>l.booking_id===booking.id)});
  current.bookings++;current.distance=new Decimal(current.distance).plus(new Decimal(booking.mileage_on_return).minus(booking.start_mileage)).toFixed();
  current.liters=new Decimal(current.liters).plus(fuel.liters).toFixed();current.amount=new Decimal(current.amount).plus(fuel.amount).toFixed();months[month]=current;
 }
 return Object.fromEntries(Object.entries(months).sort(([a],[b])=>a.localeCompare(b)));
}
export function planImport(files,snapshot,{mapping={},actor,accessReview}={}) {
 const sheets=Object.fromEntries(Object.keys(headers).map(name=>[name,parseCsv(files[name],name)]));
 const rejected=[]; const reject=(sheet,row,reason)=>rejected.push({sheet,line:row.line,legacy_id:String(row.data?.booking_id??row.data?.log_id??row.data?.car_id??row.data?.id??row.data?._booking_id??''),reason});
 const duplicate=(sheet,key)=>{const normalized=v=>sheet==='Cars'&&key==='car_id'&&/^\d+$/.test(v.trim())?String(Number(v)):v.trim();const counts=new Map();for(const r of sheets[sheet]){const id=normalized(r.data[key]);counts.set(id,(counts.get(id)??0)+1);}return new Set(sheets[sheet].filter(r=>counts.get(normalized(r.data[key]))>1).flatMap(r=>[r.data[key],normalized(r.data[key])]));};
 const profiles=snapshot.profiles??[];
 const resolve=raw=>{
  const override=mapping[rawEmployee(raw)];
  if(override){if(!profiles.some(p=>p.id===override))fail('INVALID_REVIEWED_MAPPING');return override;}
  const code=normalizeEmployee(raw); if(!code)fail('UNMAPPED_EMPLOYEE');
  const matched=profiles.filter(p=>normalizeEmployee(p.employee_code)===code);
  if(matched.length!==1)fail(matched.length?'AMBIGUOUS_EMPLOYEE':'UNMAPPED_EMPLOYEE');return matched[0].id;
 };
 const employees=new Map(),proposals=new Map();const employeeDuplicates=duplicate('Employees','id');
 for(const r of sheets.Employees)try{
  if(r.invalid)fail('CSV_ROW_WIDTH'); if(employeeDuplicates.has(r.data.id))fail('DUPLICATE_LEGACY_ID');
  const id=resolve(r.data.id);employees.set(rawEmployee(r.data.id),id);
  const level=r.data.role.trim().toLowerCase()==='admin'?'admin':'use';const previous=proposals.get(id);
  proposals.set(id,{user_id:id,level:previous?.level==='admin'?'admin':level,eligible:profiles.find(p=>p.id===id).status==='active'});
 }catch(error){reject('Employees',r,error.message);}
 const owner=raw=>{const id=employees.get(rawEmployee(raw));if(id)return id;const code=normalizeEmployee(raw);const matches=[...new Set([...employees].filter(([key])=>normalizeEmployee(key)===code).map(([,id])=>id))];if(matches.length===1)return matches[0];return fail('UNMAPPED_SOURCE_EMPLOYEE');};
 const rows={Cars:[],Bookings:[],BookingLogs:[]};
 const accept=(sheet,r,row)=>{
  const table={Cars:'cars',Bookings:'bookings',BookingLogs:'logs'}[sheet];
  const existing=(snapshot[table]??[]).find(b=>String(b.legacy_id)===String(row.legacy_id));
  if(existing){row.id=existing.id;if(!equal(row,existing))fail('EXISTING_RECORD_DIFFERS');}
  rows[sheet].push({...row,line:r.line,mode:existing?'unchanged':'insert'});
 };
 const carDuplicates=duplicate('Cars','car_id'),plateDuplicates=duplicate('Cars','license_plate');
 for(const r of sheets.Cars)try{
  if(r.invalid)fail('CSV_ROW_WIDTH');if(carDuplicates.has(r.data.car_id)||plateDuplicates.has(r.data.license_plate))fail('DUPLICATE_CAR');
  const legacy=required(r.data.car_id);if(!/^\d+$/.test(legacy)||+legacy>2147483647)fail('INVALID_CAR_ID');
  const row={id:stableId('car',String(+legacy)),legacy_id:+legacy,license_plate:required(r.data.license_plate),parking_floor:r.data.parking_floor.trim()||null,latest_mileage:decimal(r.data.latest_mileage),is_active:true};
  if((snapshot.cars??[]).some(c=>c.license_plate===row.license_plate&&String(c.legacy_id)!==String(row.legacy_id)))fail('EXISTING_PLATE_CONFLICT');accept('Cars',r,row);
 }catch(error){reject('Cars',r,error.message);}
 const bookingDuplicates=duplicate('Bookings','booking_id');
 for(const r of sheets.Bookings)try{
  if(r.invalid)fail('CSV_ROW_WIDTH');const d=r.data;const legacy=required(d.booking_id);if(bookingDuplicates.has(legacy))fail('DUPLICATE_LEGACY_ID');
  const car=rows.Cars.find(c=>c.license_plate===d.car_plate.trim());if(!car)fail('ORPHAN_CAR');
  const row={id:stableId('booking',legacy),legacy_id:legacy,user_id:owner(d.employee_id),employee_name:d.employee_name.trim(),car_id:car.id,destination:required(d.destination),start_time:date(d.start_time),end_time:date(d.end_time),status:d.booking_status.trim().toLowerCase(),start_mileage:decimal(d.start_mileage),mileage_on_return:decimal(d.mileage_on_return,true),actual_return_time:date(d.actual_return_time,true),parking_floor:d.parking_floor.trim()||null,refueled:boolean(d.refueled),fuel_mileage:null,fuel_liters:null,fuel_amount:null};
  if(!['booked','completed','cancelled'].includes(row.status))fail('INVALID_STATUS');
  if(row.end_time<=row.start_time || (row.actual_return_time && row.actual_return_time<row.start_time))fail('INVALID_INTERVAL');
  if(row.mileage_on_return!==null && new Decimal(row.mileage_on_return).lte(row.start_mileage))fail('INVALID_RETURN_MILEAGE');
  if(row.status==='completed' && (!row.actual_return_time || row.mileage_on_return===null || !row.parking_floor))fail('INCOMPLETE_RETURN');
  if(row.status!=='completed' && (row.actual_return_time || row.mileage_on_return!==null))fail('UNEXPECTED_RETURN');
  if(row.refueled){for(const k of ['fuel_mileage','fuel_liters','fuel_amount'])row[k]=decimal(d[k]);if(row.status!=='completed'||new Decimal(row.fuel_liters).lte(0)||new Decimal(row.fuel_amount).lte(0)||new Decimal(row.fuel_mileage).lt(row.start_mileage)||new Decimal(row.fuel_mileage).gt(row.mileage_on_return))fail('INVALID_FUEL');}
  else if(['fuel_mileage','fuel_liters','fuel_amount'].some(k=>d[k].trim()!==''&&decimal(d[k])!=='0'))fail('UNEXPECTED_FUEL');
  accept('Bookings',r,row);
 }catch(error){reject('Bookings',r,error.message);}
 // Both members of a source collision are rejected; do not choose an arbitrary winner.
 const collisions=new Set();const candidates=rows.Bookings;
 const interval=b=>[Date.parse(b.start_time),Math.min(Date.parse(b.end_time),Date.parse(b.actual_return_time??b.end_time))];
 const overlaps=(a,b)=>{if(a.status==='cancelled'||b.status==='cancelled'||a.id===b.id||!(a.car_id===b.car_id||a.user_id===b.user_id))return false;const [as,ae]=interval(a),[bs,be]=interval(b);return as<ae&&bs<be&&as<be&&bs<ae;};
 const sourceIds=new Set(candidates.map(b=>b.id));
 const combined=new Map((snapshot.bookings??[]).map(b=>[b.id,b]));for(const b of candidates)combined.set(b.id,b);
 for(const dimension of ['car_id','user_id']){
  const groups=new Map();for(const b of combined.values()){const [start,end]=interval(b);if(b.status==='cancelled'||start>=end)continue;const group=groups.get(b[dimension])??[];group.push({...b,_start:start,_end:end});groups.set(b[dimension],group);}
  for(const group of groups.values()){
   group.sort((a,b)=>a._start-b._start);let active=[];
   for(const b of group){active=active.filter(a=>a._end>b._start);for(const a of active)if(overlaps(a,b)){if(sourceIds.has(a.id))collisions.add(a.id);if(sourceIds.has(b.id))collisions.add(b.id);}active.push(b);}
  }
 }
 rows.Bookings=candidates.filter(b=>{if(!collisions.has(b.id))return true;rejected.push({sheet:'Bookings',line:b.line,legacy_id:b.legacy_id,reason:'OVERLAPPING_BOOKING'});return false;});
 const logDuplicates=duplicate('BookingLogs','log_id');
 for(const r of sheets.BookingLogs)try{
  if(r.invalid)fail('CSV_ROW_WIDTH');const d=r.data,legacy=required(d.log_id);if(logDuplicates.has(legacy))fail('DUPLICATE_LEGACY_ID');
  const b=rows.Bookings.find(b=>b.legacy_id===d.booking_id.trim());if(!b)fail('ORPHAN_BOOKING');
  const row={id:stableId('log',legacy),legacy_id:legacy,booking_id:b.id,log_time:date(d.log_time),log_type:d.log_type.trim(),location:required(d.location),mileage:decimal(d.mileage),refueled:boolean(d.refueled),fuel_liters:null,fuel_amount:null,note:d.note,gps_latitude:null,gps_longitude:null,gps_accuracy_meters:decimal(d.gps_accuracy_meters,true),created_by:owner(d.created_by),created_at:date(d.created_at)};
  if(!['overnight_stop','fuel','checkpoint','other'].includes(row.log_type))fail('INVALID_LOG_TYPE');
  if(row.log_time<b.start_time||row.log_time>(b.actual_return_time??b.end_time)||new Decimal(row.mileage).lt(b.start_mileage)||(b.mileage_on_return!==null&&new Decimal(row.mileage).gt(b.mileage_on_return)))fail('LOG_OUTSIDE_TRIP');
  if(row.log_type==='fuel'||row.refueled){row.fuel_liters=decimal(d.fuel_liters);row.fuel_amount=decimal(d.fuel_amount);if(new Decimal(row.fuel_liters).lte(0)||new Decimal(row.fuel_amount).lte(0))fail('INVALID_FUEL');}
  else if(['fuel_liters','fuel_amount'].some(k=>d[k].trim()!==''&&decimal(d[k])!=='0'))fail('UNEXPECTED_FUEL');
  if(d.gps_latitude.trim()||d.gps_longitude.trim()){const coord=(v,max)=>{if(!/^-?\d+(?:\.\d{1,7})?$/.test(v.trim()))fail('INVALID_GPS');const n=new Decimal(v);if(n.abs().gt(max))fail('INVALID_GPS');return n.toFixed();};row.gps_latitude=coord(d.gps_latitude,90);row.gps_longitude=coord(d.gps_longitude,180);}else if(row.gps_accuracy_meters!==null)fail('INVALID_GPS');
  accept('BookingLogs',r,row);
 }catch(error){reject('BookingLogs',r,error.message);}
 const completed=rows.Bookings.filter(b=>b.status==='completed').sort((a,b)=>a.start_time.localeCompare(b.start_time)||a.id.localeCompare(b.id));
 const regenerated=completed.map((b,i)=>buildOspRow({...b,license_plate:rows.Cars.find(c=>c.id===b.car_id).license_plate,logs:rows.BookingLogs.filter(l=>l.booking_id===b.id)},i+1));
 const ospComparison=sheets.BookingsOSP.map(r=>{
  const target=regenerated.find(b=>b[0]===r.data._booking_id);if(r.invalid||!target)return {line:r.line,legacy_id:r.data._booking_id,reason:r.invalid?'CSV_ROW_WIDTH':'NO_ACCEPTED_COMPLETED_BOOKING'};
  const differences=ospColumns.flatMap((key,i)=>i===1||i===12||r.data[key]===target[i]?[]:[{column:key,classification:(i===8&&r.data[key]===''&&target[4]==='0')?'LEGACY_ZERO_MILEAGE_BUG':([16,17].includes(i)&&r.data[key]===''&&target[i]!=='')?'LEGACY_FUEL_BUG':'REVIEW_DIFFERENCE'}]);
  return {line:r.line,legacy_id:r.data._booking_id,differences,duplicate:sheets.BookingsOSP.filter(other=>other.data._booking_id===r.data._booking_id).length>1};
 });
 const sourceHash=hash(Object.keys(headers).map(key=>[key,createHash('sha256').update(files[key]).digest('hex')]));
 const proposal=[...proposals.values()].sort((a,b)=>a.user_id.localeCompare(b.user_id));
 const digest=hash({version:1,sourceHash,actor,mapping,accessReview,rows:Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v.map(canonical)])),rejected,proposal});
 return {version:1,sourceHash,approval:digest,rows,rejected,accessProposals:proposal,ospComparison,regeneratedOsp:regenerated,monthly:totals(rows.Bookings,rows.BookingLogs),counts:Object.fromEntries(Object.entries(sheets).map(([key,value])=>[key,{source:value.length,accepted:rows[key]?.length??(key==='Employees'?value.length-rejected.filter(r=>r.sheet===key).length:0),rejected:rejected.filter(r=>r.sheet===key).length,insert:rows[key]?.filter(r=>r.mode==='insert').length??0,unchanged:rows[key]?.filter(r=>r.mode==='unchanged').length??0,...(key==='BookingsOSP'?{comparisonOnly:true,compared:ospComparison.length}:{})}]))};
}

export { clean };
