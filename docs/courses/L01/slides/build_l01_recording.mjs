import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=process.cwd();
const deps=process.env.RUNTIME_NODE_MODULES;
const skill=process.env.SKILL_DIR;
const python=process.env.RUNTIME_PYTHON;
if(!deps||!skill||!python) throw Error('Set bundled runtime and presentation skill paths.');
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(deps,'@oai/artifact-tool/dist/artifact_tool.mjs')));
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const tmp=path.join(root,'.tmp','l01-recording-'+stamp);
await fs.mkdir(tmp,{recursive:true});
const lesson=path.join(root,'docs/courses/L01');
const handout=await fs.readFile(path.join(lesson,'阅读讲义.md'),'utf8');
const contracts=handout.split('\n').filter(s=>/^- \*\*(核心内容|演示结果|课内增量|通过标准)\*\*：/.test(s)).join('\n');
const title='以终为始：一次可验证的 AI 交付怎样完成？';
const font='Microsoft YaHei';
const C={ink:'#172C3C',teal:'#167D8D',muted:'#536774',paper:'#F7FAFB',red:'#B64440',green:'#257859',line:'#BCD2D8'};
const p=Presentation.create({slideSize:{width:1280,height:720}});
const pages=[];
function text(slide,value,x,y,w,h,size=32,color=C.ink,bold=false){
 const obj=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 obj.text=value;obj.text.style={typeface:font,fontSize:size,color,bold,autoFit:'none',verticalAlignment:'middle',insets:{top:0,bottom:0,left:0,right:0}};return obj;
}
function slide(title,note,time){
 const s=p.slides.add();s.background.fill=C.paper;
 text(s,title,64,40,1150,100,44,C.ink,true);
 text(s,String(p.slides.items.length).padStart(2,'0'),1180,44,40,26,18,C.muted);
 const n=p.slides.items.length;const section=n<=1?'':n<=2?'学习导航':n<=5?'成果定位':n<=13?'交付方法':n<=19?'工作台设计':'实践与路线';
 if(section) text(s,section,66,12,900,28,20,C.teal);
 pages.push({title,time});
 s.speakerNotes.textFrame.setText(`L01 ${title}\n课堂时间点：${time}\n${note}\n\n讲义：docs/courses/L01/阅读讲义.md\n核验日期：2026-09-05\n参考来源：https://docs.python.org/3.11/library/unittest.html\n课程合同：docs/课程大纲-Codex-FDE行动营-个人研发自动化工作台.md\n本讲由学生直接监督 Codex 建设工作台 V0.1，FlowERP 本讲状态不变。`);
 return s;
}
function lines(s,items,x=64,y=180,w=930,step=100,size=32){items.forEach((v,i)=>text(s,v,x,y+i*step,w,70,size));}
function box(s,label,x,y,w=250,h=100,color=C.teal){const o=s.shapes.add({geometry:'roundRect',position:{left:x,top:y,width:w,height:h},fill:'#FFFFFF',line:{fill:color,width:2}});o.text=label;o.text.style={typeface:font,fontSize:32,color:C.ink,bold:true,alignment:'center',verticalAlignment:'middle',insets:{top:8,bottom:8,left:8,right:8},autoFit:'none'};return o;}
function connect(s,a,b,from='right',to='left'){s.shapes.connect(a,b,{fromSide:from,toSide:to,kind:'straight',line:{fill:C.teal,width:2},tail:{type:'arrow',width:'sm',length:'sm'}});}
async function screenshot(s,file,caption){s.images.add({blob:await fs.readFile(path.join(lesson,'assets/final-deliverables',file)),contentType:'image/png',alt:caption,fit:'contain',position:{left:64,top:150,width:930,height:380}});text(s,caption,64,555,930,48,26,C.muted);}
function foot(s,value){text(s,value,64,555,930,48,28,C.teal,true);}


// Content fits above subtitles (y=612), with x<=994 below the title.
{
const s=slide(title,'主张：用 Codex 建设可复用的个人工作台，通过 FlowERP 的持续交付验证与改进它。','0:00');
s.background.fill='#102D3B';s.shapes.items[0].text='';
text(s,'L01',64,80,930,70,52,'#79D5D7',true);
text(s,'以终为始：',64,185,930,90,64,'#FFFFFF',true);
text(s,'一次可验证的 AI 交付怎样完成？',64,280,1090,80,50,'#FFFFFF',true);
text(s,'个人工作台的价值、协作与设计',64,420,930,64,34,'#B7E9E9');
text(s,'Codex + FDE 全链路 AI 编程行动营',64,540,930,46,28,'#FFFFFF');
}
{
const s=slide('本讲的四个议题','导航名称与页眉一致。尊重学员的分析能力，解释概念之间的因果与工程取舍，不逐字解释基础动作。','0:45');
lines(s,['成果定位：首先交付什么','交付方法：如何降低漏验与返工','工作台设计：哪些能力值得固化','实践与路线：本讲产物与后续演进'],64,170,930,92,35);
foot(s,'个人研发自动化工作台、Codex 与 FlowERP 的分工');
}
{
const s=slide('工作台将任务与交付依据集中管理','来源：docs/courses/L01/assets/final-deliverables/README.md。展示项目、任务和待验收结果。参考系统不是学生L01已拥有的能力。','2:00');
await screenshot(s,'workbench-overview.png','参考系统：项目、任务和验收入口');
}
{
const s=slide('FlowERP 的交付检验工作台是否有效','工作台是首要建设成果，Codex提供推理编码能力，FlowERP是伴生客户产品及验证场。回流的是具体需求、失败和交付结果。','3:00');
const a=box(s,'人与 Codex\n建设工作台',64,200,265,140),b=box(s,'个人工作台\n组织开发与检查',394,200,265,140),c=box(s,'FlowERP\n形成产品结果',724,200,265,140);connect(s,a,b);connect(s,b,c);
text(s,'需求与失败揭示能力缺口',64,405,930,60,35,C.teal,true);
text(s,'工作台改进后，再接受下一次交付检验',64,485,930,60,32);
}
{
const s=slide('案例：可用库存导出','真实产品截图作为场景输入，后续修改和运行比较为教学推演。第一行在库5预占2可用3。不要以库存讲解取代工作台主线。','4:30');
await screenshot(s,'flowerp-inventory-20260905.png','业务口径：可用库存等于在库量扣除预占量');
}
{
const s=slide('生成完成仍不足以决定交付','理解代码生成以后仍需需求确认、约束校验、业务检查与人审。价值判断应看实际漏验和返工，不预设有工具必然更快。','6:00');
lines(s,['需求是否明确到可以验收？','实际改动是否符合授权范围？','检查是否覆盖业务结果与失败场景？','结论能否对应本次任务和版本？'],64,170,930,100,35);
}
{
const s=slide('L01 先实现可追溯的任务与运行记录',`当前大纲决定V0.1增量，接手与环境检查只是准备。\n${contracts}`,'7:30');
const values=[['本讲交付','后续演进'],['项目、任务与运行记录','Codex 执行连接'],['五个操作及失败处理','统一检查与协作流程'],['需求决定与建设证据','通过工作台开发 FlowERP']];
const t=s.tables.add({rows:4,columns:2,left:64,top:170,width:930,height:360,columnWidths:[465,465],values});t.borders.assign({style:'solid',fill:C.line,width:1});
for(let r=0;r<4;r++)for(let c=0;c<2;c++){let cell=t.getCell(r,c);cell.fill=r===0?C.teal:'#FFFFFF';cell.text.style={typeface:font,fontSize:30,bold:r===0,color:r===0?'#FFFFFF':C.ink,verticalAlignment:'middle',autoFit:'none'};}
foot(s,'L04 首次通过工作台交付库存导出');
}
{
const s=slide('执行、验证与接受具有不同责任','目标流程中，工作台组织执行与复验，Codex实施，人确认需求与最终接受。实际产品结果必须纳入检查。','9:00');
const a=box(s,'人\n确认需求',64,185,265,115),b=box(s,'工作台\n组织任务',394,185,265,115),c=box(s,'Codex\n实施变更',724,185,265,115),d=box(s,'FlowERP\n产生结果',724,395,265,115),e=box(s,'工作台\n组织验证',394,395,265,115),f=box(s,'人\n审核接受',64,395,265,115);
connect(s,a,b);connect(s,b,c);connect(s,c,d,'bottom','top');connect(s,d,e,'left','right');connect(s,e,f,'left','right');foot(s,'目标流程：L01 先建立任务与结果的关联');
}
{
const s=slide('需求说明固定共同验收依据','Spec 是需求说明。此页为库存导出案例的简化合同。输入数据、字段和边界需由人向业务确认。','10:30');
lines(s,['目标：导出供销售使用的可用库存','字段：商品编号、名称、可用数量','数量验收：在库 5、预占 2，应导出 3','变更范围：库存导出相关文件'],64,170,930,96,33);foot(s,'需求说明（Spec）：确认目标、范围与验收条件');
}
{
const s=slide('改动对照揭示实现是否符合约定','以下两行是教学示意Diff，并非本次仓库改动。业务依据来自 flowerp/service.py 的 inventory()，当前实现为 (s.on_hand-s.reserved) AS available，export_inventory读取 available。','12:00');
text(s,'修改记录（Diff）教学示意',64,165,930,50,29,C.muted);
text(s,'− available = on_hand',64,245,930,65,37,C.red,true);
text(s,'+ available = on_hand - reserved',64,330,930,65,37,C.green,true);
text(s,'核对计算口径，也核对范围外是否发生改动',64,450,930,65,32);
foot(s,'仓库依据：flowerp/service.py 中的库存查询');
}
{
const s=slide('同一验收标准支持前后比较','这是教学示意，实际课堂需要运行产品导出并保留原始输出。测试需要读真实生成文件，而不是硬编码一个结果。先红后绿还需确认首次失败来自能力缺失。','13:30');
text(s,'修订前',64,185,420,60,32);text(s,'导出 5，检查失败',64,270,450,70,38,C.red,true);
text(s,'修订后',554,185,435,60,32);text(s,'导出 3，该项通过',554,270,435,70,38,C.green,true);
text(s,'同一输入、同一规则，并保留两次运行',64,425,930,65,33);foot(s,'案例推演：其他验收项仍需分别检查');
}
{
const s=slide('交付摘要呈现结果，也保留未决项','交付摘要是教学示意，不是本次已完成证明。完整链：真实业务需求、Spec、示意Diff、示意测试、示意交付摘要。真正演示时须替换为本次实际记录。','15:00');
lines(s,['需求：可用库存导出','修改：按已确认口径扣除预占数量','检查：示例数量通过，其他项待核对','决定：等待业务试用与人工审核'],64,175,930,96,33);foot(s,'摘要示意：可追溯事实与待办事项同时呈现');
}
{
const s=slide('工作台的价值来自稳定执行这些机制','把案例抽象回工作台设计。能力升级由真实失败触发，并在后续产品交付中验证。评价应包括返工、漏验与维护成本。','16:00');
lines(s,['保存确认后的要求，减少重复解释','核对实际改动，发现未经授权的变化','固定检查入口，降低漏验概率','保留失败与修订，支持复查和接手'],64,175,930,96,33);
}
{
const s=slide('项目、任务与记录形成可追溯关系','一个项目有多项任务，每项任务有多次运行。编号决定归属，快照保留当时需求。不要将数据库字段数量当作教学深度。','17:00');
const a=box(s,'项目\nFlowERP',64,220,265,135),b=box(s,'任务\n增加库存导出',394,220,265,135),c=box(s,'运行记录\n失败与复验',724,220,265,135);connect(s,a,b);connect(s,b,c);
text(s,'稳定编号明确归属，需求快照保留当时约定',64,440,930,70,32);foot(s,'一对多关系：项目包含任务，任务关联多次记录');
}
{
const s=slide('第一版提供五个可验证操作','五个操作是当前大纲增量。完整命令留在实践手册，课堂解释职责与验收。状态查询读记录，不等同于重新执行测试。','18:00');
const names=['初始化：确定工作台身份和数据目录','登记项目：保存代码位置','创建任务：保存本次需求','追加记录：保留命令、输出和运行结果','查看状态：返回已有信息与缺失项'];lines(s,names,64,160,930,80,32);
}
{
const s=slide('工作台以自身建设完成第一次验证','自举是用新能力记录自己的建设。开发前由学生直接监督Codex，输出先存文件。程序完成后导入原始观察时间与结果，不能编造历史记录。','19:00');
const a=box(s,'人与 Codex\n建设 V0.1',64,210,265,145),b=box(s,'开发期间\n保存运行输出',394,210,265,145),c=box(s,'程序建成后\n登记自身建设',724,210,265,145);connect(s,a,b);connect(s,b,c);
text(s,'自举验证：任务、需求与运行记录能否查回',64,445,930,68,32);foot(s,'本讲尚不实现工作台自动调用 Codex');
}
{
const s=slide('设计需要明确一致性与失败行为','在实现前讨论有实际取舍的设计问题。保存路径或快照，覆盖或追加，读取或执行。要求学生说明设计能解决什么，也有哪些局限。','20:00');
lines(s,['需求后来改变，如何查回本次依据？','再次运行失败，旧绿灯是否仍能代表当前？','重复任务编号，拒绝还是覆盖？','记录完整，是否足以自动接受交付？'],64,170,930,96,33);
}
{
const s=slide('正常路径验证记录能持久保存','学生本人实现后使用同一隔离目录。保存项目、任务、需求快照和实际结果。重开查询仍应一致。不得用参考实现测试结果代替本人达成。','21:00');
lines(s,['登记自身项目与建设任务','关联已确认需求和实际运行结果','重新打开程序，查询相同任务','核对要求版本与记录归属'],64,170,930,96,33);
}
{
const s=slide('失败路径验证错误不会破坏已有数据','先预测再操作，分别检查返回值和持久状态。缺证据或指定任务不存在须拒绝，并保持原项目任务证据。','22:00');
lines(s,['任务不存在：明确返回缺失信息','编号重复：拒绝覆盖历史内容','证据不足：指出未满足的条件','查询原任务：已有记录保持一致'],64,170,930,96,33);
}
{
const s=slide('环境检查通过，仍可能存在具体风险','本页2026-09-05参考仓库实际运行 .venv/Scripts/python.exe -X utf8 -m workbench.cli doctor，退出码0，status=ready。backup_freshness.warning=true、verified=false、files_present=false。该风险只针对本次默认运行目录，不概括所有部署。doctor是运行健康检查，不是全部学习环境达成证明。','23:00');
text(s,"$python = '.\\.venv\\Scripts\\python.exe'\n& $python -X utf8 -m workbench.cli doctor",64,165,930,100,28,C.ink);
text(s,'实际结果：ready，但未发现已验证的备份',64,300,930,65,32,C.red,true);
text(s,'接手报告：结构、约束、验证命令、风险',64,395,930,65,32);
foot(s,'本次参考仓库检查，不替代学生自己的实践记录');
}
{
const s=slide('四周路线逐步扩展工作台的交付能力','按课程大纲与课表概括四周产物和验收：V0受控执行最小交付，V1统一Eval与门禁，V2有界协作，V3服务界面反馈。L16需现场完成此前未实现需求。','25:00');
const values=[['阶段与成果','建设重点','验收依据'],['第一周 V0','规则、需求与执行','最小真实交付'],['第二周 V1','统一检查与门禁','违规被阻断'],['第三周 V2','有界修复与协作','停止条件有效'],['第四周 V3','服务、界面与反馈','现场新需求交付']];
const t=s.tables.add({rows:5,columns:3,left:64,top:160,width:930,height:370,columnWidths:[280,330,320],values});t.borders.assign({style:'solid',fill:C.line,width:1});
for(let r=0;r<5;r++)for(let c=0;c<3;c++){const cell=t.getCell(r,c);cell.fill=r===0?C.teal:'#FFFFFF';cell.text.style={typeface:font,fontSize:29,bold:r===0,color:r===0?'#FFFFFF':C.ink,verticalAlignment:'middle',autoFit:'none'};}
foot(s,'FlowERP 的持续增长检验每一阶段的工作台能力');
}
{
const s=slide('工作台的有效性需要由交付结果证明','总结并留两个有判断空间的问题。任务卡指向行动卡；实践手册提供跨平台步骤，SUBMISSION记录解释、运行、反馈与二次签字。完整实现安排课后，不夸称30分钟完成全部编码。','29:00');
text(s,'首先交付工作台，通过 FlowERP 验证并改进它',64,170,930,72,35,C.teal,true);
text(s,'讨论：哪些检查值得固化，哪些决定仍需人负责？',64,295,930,78,32);
text(s,'迁移：换一个客户项目，哪些能力可以直接复用？',64,415,930,78,32);
foot(s,'任务卡：行动卡.md    实践记录：SUBMISSION.md');
}
const candidate=path.join(tmp,'candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(candidate);
for(let i=0;i<p.slides.items.length;i++){
 const slide=p.slides.items[i];const blob=await p.export({slide,format:'png',scale:1});
 await fs.writeFile(path.join(tmp,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
}
await fs.writeFile(path.join(tmp,'pages.json'),JSON.stringify(pages,null,2));
const output=path.join(tmp,'final','L01.pptx');await fs.mkdir(path.dirname(output),{recursive:true});
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:output,pythonExecutable:python,
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','7','--require-native-table-slide','21'],
 explicitTotalSlideCount:22,requiredNativeTableOwnerSlides:[7,21],fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(tmp,'validation.json')});
console.log(JSON.stringify({tmp,output,pages:22}));
