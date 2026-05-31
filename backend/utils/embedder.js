/**
 * Text embedder — Node.js compatible.
 *
 * Strategy (tries in order, falls back gracefully):
 *   1. HuggingFace Inference API  (Xenova/all-MiniLM-L6-v2, 384-dim)
 *   2. OpenAI API                 (text-embedding-3-small, 1536-dim)
 *   3. Pure TF-IDF local embed    (deterministic, no external calls)
 *
 * Environment variables:
 *   HF_TOKEN        — HuggingFace API token
 *   OPENAI_API_KEY  — OpenAI API key (overrides HF if set)
 *   EMBEDDING_DIM   — override output dimension (default 384)
 */

const { cleanText } = require('./textCleaner');

// ─── Vocabulary for local TF-IDF fallback ───────────────────────────────────
// Education-domain vocabulary — ~700 words covering academic, admission, fees,
// placement, infrastructure, and general English. Keys map to fixed indices.
const VOCAB = [
  'absent','academic','account','admission','advising','alert','allow','almost','also',
  'amount','announcement','annual','answer','antiragging','appeal','apply','appointment',
  'assignment','attendance','auth','available','await','backlog','balance','bank','basic',
  'bench','benefit','best','better','blackboard','board','book','branch','break','brief',
  'bring','budget','build','bus','business','cabin','cafeteria','calendar','campus',
  'cancel','carve','case','cash','center','central','certain','certificate','challenges',
  'chaos','charge','chat','check','chief','choice','choose','chunk','claim','class',
  'clear','click','close','code','collect','college','come','common','company','compensate',
  'compile','complete','compute','condition','conference','connect','consider','contact',
  'content','continue','contract','contribution','convert','convincing','cook','copy',
  'correct','cost','council','course','cover','craft','crash','create','credit','critical',
  'crowd','curious','current','curriculum','custom','cycle','daily','damage','danger',
  'date','daughter','dean','deal','debate','decide','decision','declare','decrease',
  'deduct','degree','delay','deliver','demand','deny','department','depend','depth',
  'describe','design','detail','dev','develop','die','difference','difficult','digital',
  'direct','direction','disagree','disaster','discipline','discuss','disease','disk',
  'dispatch','display','distance','district','divide','doctor','document','dollar',
  'doubt','download','draft','draw','dream','drink','drive','drop','due','dues','dull',
  'during','dynamic','each','earn','easily','economic','economy','edge','edit','education',
  'effect','effort','either','elect','electric','electronic','elegant','element','else',
  'emergency','emotion','employ','employee','employer','empty','enable','encounter',
  'encourage','end','enemy','energy','engage','engine','engineering','enormous','enough',
  'enrollment','ensure','enter','entire','entity','entry','envelope','environment','equal',
  'equipment','error','escape','essay','establish','estimate','ethical','event',
  'eventually','every','evidence','exact','examine','example','exam','excellent',
  'exception','excess','exchange','excite','exclude','excuse','execute','exercise',
  'exist','expand','expect','expense','experience','experiment','expert','expire',
  'explain','explore','export','expose','express','extend','extra','extraordinary',
  'extreme','fabric','faculty','fair','fall','false','familiar','family','famous',
  'fantastic','fare','fast','fat','fatal','father','fault','favor','fee','feedback',
  'feed','feel','fellow','female','festival','fewer','field','fight','figure','file',
  'fill','film','final','finance','financial','find','fine','fingerprint','finger',
  'finish','fire','firm','first','fish','fitness','fit','fix','flag','flat','flight',
  'float','flood','floor','flow','flower','focus','folder','follow','food','fool',
  'foot','force','foreign','forest','forget','form','format','former','formula',
  'forth','forum','forward','foster','found','foundation','founder','fraction',
  'fragment','frame','framework','free','freeze','friend','front','full','fully',
  'fund','fundamental','future','gain','game','gap','garage','garden','gate','gather',
  'gauge','general','generate','generation','generous','get','girl','give','glad',
  'global','glory','go','goal','god','goes','golden','gone','good','govern','government',
  'grade','graduate','grant','graphic','grasp','grass','grateful','great','green',
  'greet','grief','gross','ground','group','grow','growth','guard','guess','guest',
  'guide','guilty','guitar','habit','hack','hair','half','hall','hand','handle','hang',
  'happen','happy','hard','harm','hash','hate','have','head','heal','health','hear',
  'heard','heart','heat','heaven','heavy','height','hell','help','here','hesitate',
  'hidden','hierarchy','high','highlight','highly','hike','hill','hint','hire',
  'historic','history','hold','hole','holiday','home','homework','honest','honor',
  'hope','horizon','host','hostel','hour','house','household','however','huge','human',
  'humble','humor','hundred','hungry','hurry','hurt','husband','idea','ideal','identify',
  'idle','ignore','illegal','illness','illustrate','image','imagine','immediate',
  'immense','impact','implement','imply','import','important','impose','impossible',
  'impress','improve','impulse','include','increase','indeed','independence','index',
  'indicate','indirect','industry','inevitable','infection','inflation','influence',
  'inform','initial','injury','inner','innocent','innovation','input','inquiry',
  'insert','inside','insist','inspect','inspire','install','instance','instant',
  'instead','institute','instruction','instructor','insurance','integer','integral',
  'intellectual','intelligence','intense','intent','interact','interest','interior',
  'internal','international','internet','interpret','interval','interview','into',
  'introduce','invitation','involve','iron','island','isolate','issue','item','jacket',
  'jail','jazz','join','joint','joke','journal','judge','juice','jump','junior','just',
  'justice','keep','key','kick','kill','kind','king','kitchen','knife','know',
  'knowledge','label','labor','lack','ladder','lake','land','language','laptop',
  'large','largely','last','late','later','latest','latter','laugh','launch','law',
  'lawyer','layout','lazy','lead','leader','leading','leaf','learn','leave','lecture',
  'left','legal','legend','lend','length','less','lesson','letter','level','liberal',
  'library','license','life','lift','light','like','likely','limit','line','link',
  'list','listen','literacy','literature','little','live','lively','living','load',
  'loan','local','location','lock','log','logic','lonely','long','look','loop',
  'loose','lord','lose','loss','lost','loud','love','lovely','lower','loyal','luck',
  'lucky','lunch','machine','macro','made','magic','magnet','main','mainly','maintain',
  'major','make','maker','manage','management','manager','manner','many','map',
  'margin','mark','market','marketing','marriage','mass','massive','master','match',
  'material','math','matter','mature','maximum','maybe','meal','mean','measure',
  'medical','medium','meet','meeting','member','membership','memo','mention','mentor',
  'menu','merchant','message','metal','method','middle','might','migrate','mild',
  'mile','military','milk','million','mind','mine','mineral','minimum','minor',
  'minute','mirror','mission','mistake','mixed','mob','mode','model','moderate',
  'modern','modest','modify','module','moment','money','monitor','month','monthly',
  'moral','more','moreover','morning','mother','motion','motor','mount','mountain',
  'mouse','mouth','move','movement','much','multiple','murder','muscle','music',
  'must','mutual','mystery','name','narrative','narrow','nasty','national','nation',
  'native','natural','nature','near','nearly','neat','necessary','need','negative',
  'negotiate','negotiation','neighbor','neither','nerve','nest','network','neutral',
  'never','nevertheless','new','news','newspaper','next','nice','night','nine',
  'noble','nobody','node','noise','nominal','none','nonetheless','normal','normally',
  'north','northern','nose','notable','note','nothing','notice','notion','novel',
  'now','nowadays','nowhere','nuclear','null','number','numeric','numerous','nurse',
  'object','objective','observe','obtain','obvious','occasion','occupation','occur',
  'ocean','off','offer','office','officer','official','often','okay','old','once',
  'ongoing','online','only','onto','open','operate','operating','operation',
  'operational','operator','opinion','opponent','opportunity','oppose','opposite',
  'opposition','optical','optimal','option','order','ordinary','organic','organization',
  'organize','orientation','origin','original','other','otherwise','ought','outcome',
  'outdoor','outer','output','outside','overall','overcome','overlook','overseas',
  'owner','package','pain','paint','pair','palace','panel','panic','paper','parallel',
  'parent','park','parking','part','participate','particular','partly','partner',
  'party','pass','passage','passenger','passion','passive','password','patch','patent',
  'path','patient','pattern','pause','pay','payment','peace','peaceful','peak',
  'penalty','pending','pension','people','percentage','perception','perfect',
  'perform','performance','perhaps','period','permanent','permission','permit',
  'person','personal','perspective','phase','philosophy','phone','photo','phrase',
  'physical','physics','pick','picture','piece','pilot','pin','pink','pioneer',
  'pipeline','pitch','place','plain','plan','plane','planet','planning','plant',
  'platform','play','player','please','pleasure','plenty','plot','plug','plus',
  'pocket','poem','poet','poetry','point','poison','police','policy','political',
  'politics','poll','pollution','pool','poor','population','port','position',
  'positive','possess','possibility','possible','poster','pot','potential',
  'potentially','pound','power','powerful','practical','practice','praise',
  'prescription','present','presentation','preserve','president','press','pressure',
  'prevent','previous','price','pricing','pride','priest','primarily','primary',
  'prime','principal','principle','print','printer','printing','prior','priority',
  'prison','prisoner','privacy','private','prize','probably','problem','procedure',
  'proceed','process','processing','processor','produce','producer','product',
  'production','productivity','profession','professional','professor','profile',
  'profit','profound','program','programme','progress','project','promote','prompt',
  'proof','proper','property','proposal','propose','proposed','prospect','protect',
  'protection','protein','protest','proud','prove','provide','provider','province',
  'provincial','provision','psychological','psychology','public','publication',
  'publicity','publicly','publish','publisher','pull','pulse','pump','punishment',
  'purchase','pure','purple','purpose','pursue','pursuit','push','puzzle','qualify',
  'quality','quantity','quantum','quarter','query','question','quick','quickly',
  'quiet','quite','quote','race','racial','radical','radio','rage','railway','rain',
  'raise','random','range','rank','rapid','rapidly','rare','rarely','rather','ratio',
  'reach','react','reaction','reader','readily','reading','ready','real','reality',
  'realize','really','reason','reasonable','receive','recent','recently','reception',
  'recipe','recipient','recognition','recognize','recommend','recommendation','record',
  'recover','reduce','reduction','referee','reference','reflect','reflection','reform',
  'refugee','refuse','regard','regarding','regardless','regime','region','regional',
  'register','registration','regret','regular','regulate','regulation','regulatory',
  'reject','relate','related','relation','relationship','relative','relax','release',
  'relevant','relief','religion','religious','reluctant','rely','remain','remaining',
  'remark','remedy','remember','remind','remote','removal','remove','repeat',
  'repeatedly','replace','reply','report','represent','representation','representative',
  'republic','reputation','request','require','requirement','rescue','research',
  'researcher','reservation','reserve','residence','resident','residential','resign',
  'resist','resistance','resolution','resolve','resort','resource','respect','respond',
  'respondent','response','responsibility','responsible','rest','restaurant',
  'restoration','restore','restriction','result','retain','retire','retirement',
  'retrieve','return','reveal','revenue','reverse','review','revolution','reward',
  'rhetoric','rice','rich','ride','right','ring','rise','risk','rival','river','road',
  'robot','rock','role','roll','romantic','roof','room','root','rope','rough',
  'roughly','round','routine','route','royal','rubber','ruin','rule','ruler','rural',
  'rush','sacred','sad','sadly','safe','safety','salary','sale','sales','sample',
  'sanction','satellite','satisfaction','satisfy','saturday','save','saving','scale',
  'scandal','scared','scenario','scene','schedule','scheme','scholar','scholarship',
  'school','science','scientific','scientist','scope','score','screen','script',
  'search','season','seat','second','secondary','secret','secretary','section',
  'sector','secure','security','seed','seek','segment','select','selection','self',
  'semester','seminar','senate','senator','send','senior','sense','sensitive',
  'sentence','separate','sequence','series','serious','seriously','servant','serve',
  'server','service','session','setting','settle','settlement','severe','shade',
  'shadow','shake','shame','shape','share','shared','sharp','sheet','shelf','shell',
  'shelter','shift','shine','ship','shirt','shock','shoot','shop','shopping','shore',
  'short','shortly','shot','should','shoulder','shout','show','shower','shut',
  'sibling','sick','side','sight','signal','signature','significance','significant',
  'significantly','silence','silent','silver','similar','similarly','simple',
  'simplify','simply','simulate','simulation','simultaneous','since','sincere',
  'single','sink','sister','site','situation','skill','skin','slave','slavery',
  'sleep','slice','slide','slight','slightly','slip','slope','slow','slowly','small',
  'smart','smell','smile','smoke','smooth','snap','snow','social','society','software',
  'soil','solar','soldier','solid','solution','solve','some','somebody','somehow',
  'someone','something','sometimes','somewhat','somewhere','song','soon','sophisticated',
  'sorry','sort','sought','soul','sound','source','south','southern','space',
  'spanish','spare','speak','speaker','special','specialist','species','specific',
  'specify','specimen','spectrum','speech','speed','spell','spend','spending',
  'sphere','spirit','spiritual','split','sponsor','sport','spot','spread','spring',
  'squad','square','stable','staff','stage','stair','stake','stand','standard',
  'standing','star','start','state','statement','station','status','stay','steady',
  'steal','steam','steel','steep','step','stick','still','stock','stomach','stone',
  'stop','storage','store','storm','story','straight','strain','strand','strange',
  'stranger','strategic','strategy','stream','street','strength','stress','stretch',
  'strict','strictly','strike','string','strip','stroke','strong','strongly',
  'structure','student','studio','study','stuff','stumble','stunning','style',
  'subject','submit','subsequent','subsequently','substance','substantial',
  'substantially','substitute','subtle','suburb','succeed','success','successful',
  'successfully','such','suck','sudden','suddenly','suffer','sufficient','suggest',
  'suggestion','suicide','suit','suitable','suite','summer','summit','super','superb',
  'superior','supplement','supply','support','supporter','suppose','supposed',
  'supreme','sure','surely','surface','surgeon','surgery','surplus','surprise',
  'surprised','surprising','surprisingly','surround','survey','survival','survive',
  'suspect','suspend','suspicion','sustainable','swear','sweep','sweet','swim',
  'symbol','symbolic','symptom','system','table','tablet','tactic','tail','take',
  'talent','talented','talk','tall','tank','tape','target','task','taste','tax',
  'taxi','teacher','teaching','team','tear','technical','technique','technology',
  'teenager','telephone','television','tell','temperature','template','temporal',
  'temporary','tenant','tend','tendency','tension','tent','term','terminal','terms',
  'terrible','territory','terror','terrorism','test','testify','testimony','testing',
  'text','texture','than','thank','thanks','that','theater','their','them','theme',
  'themselves','then','theory','therapy','there','thereafter','thereby','therefore',
  'these','thesis','they','thick','thing','think','thinking','this','thorough',
  'thoroughly','those','though','thought','thousand','thread','threat','threaten',
  'three','threshold','thrive','throat','through','throughout','throw','thrust',
  'thumb','thus','ticket','tie','tighter','till','timeline','timing','tiny','tissue',
  'title','today','together','tomorrow','tone','tonight','tool','tooth','topic',
  'total','totally','touch','tough','tour','tourism','tourist','tournament','toward',
  'towards','town','trace','track','trade','trader','tradition','traditional',
  'traffic','tragedy','trail','train','trainer','training','transcript','transfer',
  'transform','transformation','transition','translate','translation','transmission',
  'transmit','transport','transportation','trap','travel','traveler','tray','treasure',
  'treasury','treat','treatment','treaty','tree','tremendous','trend','trial','tribe',
  'trick','trigger','trim','trip','troop','trouble','troubled','truck','true','truly',
  'trust','truth','try','tuition','tumor','tune','tunnel','turn','turnout','tutor',
  'tutorial','twice','twist','type','typical','typically','ugly','ultimate',
  'ultimately','unable','uncertainty','uncle','under','undergo','underlying',
  'undermine','understand','understanding','undertake','unemployment','unexpected',
  'unfair','unfold','unfortunately','uniform','union','unique','unit','unite',
  'united','unity','universal','universe','university','unknown','unless','unlike',
  'unlikely','until','unusual','update','upon','upper','upset','urban','urge',
  'useful','user','usual','usually','utility','utilize','vacation','vaccine',
  'vacuum','vague','valid','valley','valuable','value','van','variation','variety',
  'various','vast','vehicle','venture','venue','verb','verdict','verify','version',
  'versus','very','vessel','veteran','victim','victory','video','view','viewer',
  'village','violate','violation','violence','violent','virtual','virtually',
  'virtue','virus','visible','vision','visit','visitor','visual','vital','vivid',
  'vocabulary','voice','volume','voluntary','volunteer','vote','voter','vs',
  'vulnerable','wage','wait','wake','walk','wall','wander','want','war','warm',
  'warn','warning','wash','waste','watch','water','wave','way','weak','weakness',
  'wealth','wealthy','weapon','wear','weather','web','website','wedding','week',
  'weekend','weekly','weigh','weight','weird','welcome','welfare','well','west',
  'western','what','whatever','wheat','wheel','when','whenever','where','whereas',
  'wherever','whether','which','while','whisper','white','who','whoever','whole',
  'whom','whose','why','wide','widely','wife','wild','will','willing','wind',
  'window','wine','wing','winner','winter','wire','wisdom','wise','wish','with',
  'withdraw','within','without','witness','wolf','woman','wonder','wonderful',
  'wood','wooden','word','work','worker','working','workout','workplace','workshop',
  'world','worried','worry','worth','would','wound','wrap','write','writer',
  'writing','written','wrong','yard','yeah','year','yell','yellow','yes',
  'yesterday','yet','yield','you','young','your','yourself','youth','zone',
];

// Precomputed IDF weights (static — assume 10k docs)
const DOC_COUNT = 10000;
const VOCAB_IDF = Object.fromEntries(VOCAB.map((w, i) => [w, Math.log(DOC_COUNT / 1.5)]));
const VOCAB_INDEX = Object.fromEntries(VOCAB.map((w, i) => [w, i]));
const DIM = 384;

// ─── Local TF-IDF embedder ───────────────────────────────────────────────────

function localEmbed(text) {
  const cleaned = cleanText(text).toLowerCase();
  const tokens = cleaned.split(/\W+/).filter(t => t.length > 1);

  const tfidf = {};
  for (const tok of tokens) tfidf[tok] = (tfidf[tok] || 0) + 1;
  const maxFreq = Math.max(...Object.values(tfidf), 1);
  const idf = Math.log(DOC_COUNT / 1.5); // flat IDF for unknown words

  const vec = new Float32Array(DIM);
  let norm = 0;
  for (const tok in tfidf) {
    const v = (tfidf[tok] / maxFreq) * idf;
    // Map token to a consistent index via simple hash (avoid collisions from VOCAB coverage gaps)
    let hash = 0;
    for (let i = 0; i < tok.length; i++) hash = ((hash << 5) - hash + tok.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % DIM;
    vec[idx] += v;
    norm += v * v;
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < DIM; i++) vec[i] /= norm;

  return Array.from(vec);
}

// ─── OpenAI embedder ─────────────────────────────────────────────────────────

async function openAIEmbed(text) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await client.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return resp.data[0].embedding;
}

// ─── HuggingFace Inference API ───────────────────────────────────────────────

async function hfEmbed(text) {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) throw new Error('HF_TOKEN not set');
  const resp = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/Xenova/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: text, options: { normalize: true } }),
    }
  );
  if (!resp.ok) throw new Error(`HF ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return Array.isArray(data) ? data : Array.isArray(data[0]) ? data[0] : data;
}

// ─── Provider resolution ─────────────────────────────────────────────────────

let _provider = null;

async function resolveProvider() {
  if (_provider) return _provider;

  if (process.env.OPENAI_API_KEY) {
    try {
      await openAIEmbed('test');
      _provider = 'openai';
      console.log('[embedder] Provider: OpenAI text-embedding-3-small (1536-dim)');
      return _provider;
    } catch (e) {
      console.warn('[embedder] OpenAI unavailable:', e.message);
    }
  }

  if (process.env.HF_TOKEN) {
    try {
      await hfEmbed('test');
      _provider = 'hf';
      console.log('[embedder] Provider: HuggingFace Inference API (384-dim)');
      return _provider;
    } catch (e) {
      console.warn('[embedder] HuggingFace unavailable:', e.message.slice(0, 120));
    }
  }

  _provider = 'local';
  console.log('[embedder] Provider: Local TF-IDF (384-dim, no external calls)');
  return _provider;
}

// ─── Public API ─────────────────────────────────────────────────────────────

async function embed(text) {
  const prov = await resolveProvider();
  if (prov === 'openai') {
    try { return await openAIEmbed(text); }
    catch (e) {
      console.warn('[embedder] OpenAI failed, falling back to local:', e.message);
      _provider = 'local';
    }
  }
  if (prov === 'hf') {
    try { return await hfEmbed(text); }
    catch (e) {
      console.warn('[embedder] HF failed, falling back to local:', e.message);
      _provider = 'local';
    }
  }
  return localEmbed(text);
}

async function warmUp() {
  await resolveProvider();
  if (_provider !== 'local') {
    try {
      await embed('warmup');
      console.log('[embedder] warm-up complete');
    } catch (e) {
      console.warn('[embedder] warm-up failed:', e.message);
    }
  }
}

module.exports = { embed, warmUp, VOCAB_INDEX, VOCAB };