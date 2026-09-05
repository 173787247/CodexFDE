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
const tmp=path.join(root,'.tmp','l01-ppt-'+stamp);
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
 text(s,String(p.slides.items.length).padStart(2,'0'),1170,666,48,26,18,C.muted);
 pages.push({title,time});
 s.speakerNotes.textFrame.setText(`L01 ${title}\n课堂时间点：${time}\n${note}\n\n讲义：docs/courses/L01/阅读讲义.md\n核验日期：2026-09-05\n参考来源：https://docs.python.org/3.11/library/unittest.html\n课程合同：docs/课程大纲-Codex-FDE行动营-个人研发自动化工作台.md\n本讲由学生直接监督 Codex 建设工作台 V0.1，FlowERP 本讲状态不变。`);
 return s;
}
function lines(s,items,x=80,y=200,w=1110,step=104,size=32){items.forEach((v,i)=>text(s,v,x,y+i*step,w,76,size));}
function box(s,label,x,y,w=250,h=100,color=C.teal){const o=s.shapes.add({geometry:'roundRect',position:{left:x,top:y,width:w,height:h},fill:'#FFFFFF',line:{fill:color,width:2}});o.text=label;o.text.style={typeface:font,fontSize:29,color:C.ink,bold:true,alignment:'center',verticalAlignment:'middle',insets:{top:8,bottom:8,left:8,right:8},autoFit:'none'};return o;}
function connect(s,a,b,from='right',to='left'){s.shapes.connect(a,b,{fromSide:from,toSide:to,kind:'straight',line:{fill:C.teal,width:2},tail:{type:'arrow',width:'sm',length:'sm'}});}
async function screenshot(s,file,caption){s.images.add({blob:await fs.readFile(path.join(lesson,'assets/final-deliverables',file)),contentType:'image/png',alt:caption,fit:'contain',position:{left:64,top:150,width:1152,height:448}});text(s,caption,64,615,1130,38,23,C.muted);}
function foot(s,value){text(s,value,80,591,1120,56,27,C.teal,true);}

// Native text, diagrams and table remain editable. Screenshots retain their source pixels.
{
const s=slide(title,'开篇只说明本讲先看终点，再讨论工作台的必要性、协作和设计。完整标题来自课表。','0:00');
s.background.fill='#102D3B';s.shapes.items[0].text='';
text(s,'L01',72,70,300,80,52,'#79D5D7',true);
text(s,'以终为始：',72,190,1100,90,70,'#FFFFFF',true);
text(s,'一次可验证的 AI 交付怎样完成？',72,295,1100,90,54,'#FFFFFF',true);
text(s,'首先交付个人研发工作台',76,465,1080,65,34,'#B7E9E9');
text(s,'Codex + FDE 全链路 AI 编程行动营',76,620,1000,40,25,'#FFFFFF');
}
{
const s=slide('工作台是首要成果，FlowERP 验证它的价值','个人研发自动化工作台是首先建设的成果。FlowERP 是通过它持续开发的伴生客户产品，提供具体需求和交付结果。不能把两者讲成两条并列业务线。','1:00');
const a=box(s,'人与 Codex\n建设工作台',75,220,295,140),b=box(s,'个人研发自动化工作台\n组织开发与检查',445,220,365,140),c=box(s,'FlowERP\n提供实际产品结果',890,220,315,140);
connect(s,a,b);connect(s,b,c);
text(s,'实际需求和失败，帮助我们发现工作台还缺什么',130,430,1050,65,34,C.teal,true);
text(s,'改进工作台后，再用于下一次产品开发',130,515,1050,65,32);
}
{
const s=slide('个人工作台：安排开发、查看结果','引导学生找当前客户项目、最近交付和等待验收。截图是参考成品，展示后续形态，不是 L01 学生已经实现的能力。来源：docs/courses/L01/assets/final-deliverables/README.md。','2:00');await screenshot(s,'workbench-overview.png','参考成品：项目、任务、待验收结果集中在工作台');
}
{
const s=slide('打开任务，查清这次做了什么','依次指出需求、执行方式、自动检查、人工验收。该截图注明本次仅复验，不能据此声称实际调用 Codex 新增了功能。来源同截图采集说明。','3:00');await screenshot(s,'workbench-delivery-review.png','图中任务仅复验，仍等待人审');
}
{
const s=slide('FlowERP：检验工作台的客户项目','ERP 在此是电商日常经营管理系统。FlowERP 要有可用业务能力，不能只做演示壳。月销售显示 39055.78，是当月3笔未取消订单金额，含草稿、待发货和已发货，不等同于已收款收入。','4:00');await screenshot(s,'flowerp-dashboard-20260905.png','课程演示账套：月度金额按未取消订单统计，含草稿订单');
}
{
const s=slide('同一件商品：在库 5，预占 2，可用 3','后文统一使用第一行商品。预占是为已有订单留出的数量。问：销售还能向其他客户承诺多少？让学员回答3并说明原因。','5:00');await screenshot(s,'flowerp-inventory-20260905.png','预占：先为已有订单留住商品');
}
{
const s=slide('L01 的交付范围',`本讲先做能记录自身建设过程的 V0.1。说明当前与后续边界。\n${contracts}`,'6:00');
const vals=[['本讲要完成','后续继续建设'],['项目、任务和运行记录','工作台自动调用 Codex'],['五个操作与正常、失败检查','完整网页与自动检查流程'],['本人需求决定与建设记录','通过工作台开发 FlowERP']];
const t=s.tables.add({rows:4,columns:2,left:70,top:180,width:1140,height:355,columnWidths:[570,570],values:vals});
t.borders.assign({style:'solid',fill:C.line,width:1});
for(let r=0;r<4;r++)for(let c=0;c<2;c++){const cell=t.getCell(r,c);cell.fill=r===0?C.teal:'#FFFFFF';cell.text.style={typeface:font,fontSize:29,bold:r===0,color:r===0?'#FFFFFF':C.ink,verticalAlignment:'middle',autoFit:'none'};}
foot(s,'L04 首次通过工作台组织库存导出开发');
}
{
const s=slide('直接使用 Codex 后，仍要安排这些工作','不要否认直接和 Codex 合作能够完成开发。说明任务增加后，重复安排和信息散落会带来漏验与接手成本。','7:00');
lines(s,['确认这次到底要做什么','找到对应代码，约定允许修改的地方','运行检查，并保留这次的结果','下次出问题时，查回当时的依据'],80,165,1110,103,33);
}
{
const s=slide('文件能打开，数字仍可能是错的','仓库要求导出还能卖的数量。若导出5，销售可能多承诺2件。请学生保存首次判断：能打开表格，是否足以接受？还要检查什么？','8:30');
text(s,'5 − 2 = 3',90,175,1080,145,104,C.teal,true);
text(s,'实际导出 5 件',95,375,500,70,44,C.red,true);
text(s,'应当导出 3 件',690,375,500,70,44,C.green,true);
foot(s,'案例推演：只看到“已完成”，你还需要检查什么？');
}
{
const s=slide('一次交付中的角色分工','这是后续目标流程。每一步指出谁负责什么。L01 还不自动委托 Codex。实际产品操作必须进入检查，人的决定不能由生成代码者自我签收。','10:00');
const a=box(s,'人\n确认要求',70,185,310,115),b=box(s,'工作台\n组织任务',485,185,310,115),c=box(s,'Codex\n协助实现',900,185,310,115);
const d=box(s,'FlowERP\n产生产品结果',900,425,310,115),e=box(s,'工作台\n组织检查',485,425,310,115),f=box(s,'人\n试用并决定',70,425,310,115);
connect(s,a,b);connect(s,b,c);connect(s,c,d,'bottom','top');connect(s,d,e,'left','right');connect(s,e,f,'left','right');
foot(s,'目标流程：第一课先做任务和运行结果的记录');
}
{
const s=slide('案例中，开发前的共同要求','Spec 是写清目标、范围和验收办法的需求说明。Codex 可以帮忙提问，但人需要向使用者确认业务口径。写集是允许修改的文件范围，编码前要列清。','11:30');
lines(s,['任务：增加可用库存导出','内容：商品编号、名称、可用数量','规则：在库 5、预占 2，必须导出 3','范围：本次处理库存导出相关功能'],85,165,1110,102,33);foot(s,'Spec 就是这份确认后的需求说明');
}
{
const s=slide('检查真实生成的文件','先准备确定数据，再实际执行导出并读取文件。不要用硬编码导出值的玩具程序代替实际交付。该图是教学推演，非实际运行报告。','13:00');
const a=box(s,'准备商品\n在库 5、预占 2',65,255,255,135),b=box(s,'实际运行\n导出功能',365,255,255,135),c=box(s,'读取生成\n文件中的数量',665,255,255,135),d=box(s,'比较结果\n是否等于 3',965,255,255,135);
connect(s,a,b);connect(s,b,c);connect(s,c,d);foot(s,'固定步骤可以写成测试，由工作台每次组织运行');
}
{
const s=slide('失败、修改、再检查','红灯和绿灯表示检查结果。第一课先验证检查能发现能力缺失，再实现并用同一标准检查。Diff 是实际改动对照。失败和后续修订都应保留。','14:30');
text(s,'第一次',80,190,330,60,30);text(s,'导出 5，失败',80,278,360,85,43,C.red,true);
text(s,'查看修改',480,190,340,60,30);text(s,'是否扣除预占',480,278,350,85,39,C.ink,true);
text(s,'第二次',890,190,330,60,30);text(s,'导出 3，通过',890,278,340,85,41,C.green,true);
foot(s,'案例推演：按同一要求复验，实际操作时保留两次结果');
}
{
const s=slide('人的验收决定','一件商品检查通过不代表全部功能通过。人核对约定的所有检查、实际试用与剩余问题，再接受或退回。测试内容本身也可能写错，需要核对。','16:00');
lines(s,['测试检查了哪些要求？','实际功能能否按预想使用？','还有什么问题没有解决？'],90,195,1100,115,38);foot(s,'接受、退回或证据不足，都需要具体依据');
}
{
const s=slide('一个项目、多项任务、多次运行记录','解释一对多关系，用具体名称再引入 ID。编号用于稳定关联，不需背英文。任务保存当时需求副本叫快照，避免后来修改文件后丢失本次要求。','17:30');
const a=box(s,'项目\nFlowERP',75,225,310,130),b=box(s,'任务\n增加库存导出',485,225,310,130),c=box(s,'运行记录\n第一次失败\n第二次通过',900,190,305,200);
connect(s,a,b);connect(s,b,c);
text(s,'一个项目包含多项任务',75,405,690,55,31);text(s,'一项任务保留多次记录',75,475,690,55,31);foot(s,'ID 是编号，快照是当时要求的副本');
}
{
const s=slide('第一版的五个操作','前三步建立工作台、项目与任务，第四步追加真实运行记录，第五步查询已保存内容。状态查询不会自动运行测试。V0.1 是版本号。','19:00');
const names=['初始化','登记项目','创建任务','追加记录','查看状态'];const codes=['workbench-init','workbench-project-add','workbench-task-create','workbench-evidence-add','workbench-status'];
names.forEach((name,i)=>{text(s,String(i+1),85,165+i*86,60,60,35,C.teal,true);text(s,name,185,165+i*86,310,60,34,C.ink,true);text(s,codes[i],575,165+i*86,600,60,28,C.muted);});
}
{
const s=slide('工作台记录自己的建设过程','这是自举。程序没有建成时，由学生直接监督 Codex 开发并先保存输出。建成后登记自身项目和任务，导入实际记录。此时尚不自动调用 Codex。','20:30');
const a=box(s,'你与 Codex\n开发工作台',75,220,310,140),b=box(s,'先把运行结果\n保存成文件',485,220,310,140),c=box(s,'工作台完成后\n关联建设记录',895,220,310,140);
connect(s,a,b);connect(s,b,c);foot(s,'自举：用刚做出的工作台，记录它自己的建设');
}
{
const s=slide('正常路径：记录能保存，也能查回','操作应在自己的隔离练习区完成。项目是个人工作台自身，任务是开发 V0.1。关闭程序重新查询，确认数据实际保存而非只在当前会话中。','22:00');
lines(s,['登记“个人工作台”项目','创建“开发 V0.1”任务','追加这次真实运行的记录','重新查询，找到原要求与运行结果'],90,165,1110,101,34);
}
{
const s=slide('失败路径：拒绝错误，保留已有记录','先让学员预测，再执行。正常功能跑通和失败处理正确要分别验证。查询不存在任务不应破坏原任务，重复ID不应覆盖已有记录。','23:30');
lines(s,['编号重复：拒绝覆盖原任务','缺少结果：明确指出缺什么','任务不存在：返回错误说明','再查原任务：原来的记录仍然存在'],90,165,1110,101,34);
}
{
const s=slide('编码前的一页个人设计','让学生用自己的话先答，再与 Codex 讨论。避免照抄功能列表。根据回答区分能理解但环境未跑通，和能运行却说不清设计。','25:00');
lines(s,['工作台优先帮我减少什么麻烦？','项目、任务、运行记录为什么要分开？','输入错误时，程序应该怎样处理？','我怎样实际检查这五个操作？'],90,165,1110,103,33);
}
{
const s=slide('课后实践的顺序','完整命令在同目录实践操作手册，反馈和判断填提交模板。线上30分钟负责理解，完整实现课后分次完成。人签署需求，Codex不能代签，保留首次失败、修改和复验。','27:00');
lines(s,['先写设计，与 Codex 确认需求并本人签署','先运行测试，确认目标能力还缺失','实现后查看改动，再运行同一测试','用新工作台记下过程，请同伴复核'],90,165,1110,104,32);
}
{
const s=slide('首先交付工作台，再用产品检验价值','收束四问。请学生解释工作台与FlowERP主次，换一个文档校对项目说明哪些能力复用、哪些验收规则重定。提醒查同目录行动卡和提交模板，原始反馈不足就标待复核。','29:00');
text(s,'本讲完成工作台 V0.1',80,180,1120,85,48,C.teal,true);
text(s,'FlowERP 的持续开发，验证工作台是否真正有用',80,300,1120,90,35);
text(s,'阅读讲义讲清为什么\n实践操作手册带你跟做',80,425,1120,110,31);
text(s,'任务卡：行动卡.md     提交：SUBMISSION.md',80,583,1120,54,27,C.muted);
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
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','7'],
 explicitTotalSlideCount:22,requiredNativeTableOwnerSlides:[7],fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(tmp,'validation.json')});
console.log(JSON.stringify({tmp,output,pages:22}));
