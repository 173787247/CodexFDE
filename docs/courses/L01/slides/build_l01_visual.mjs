import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),skill=process.env.SKILL_DIR,python=process.env.RUNTIME_PYTHON,deps=process.env.RUNTIME_NODE_MODULES;
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(deps,'@oai/artifact-tool/dist/artifact_tool.mjs')));
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
const tmp=path.join(root,'.tmp','l01-visual-'+new Date().toISOString().replace(/[:.]/g,'-'));
await fs.mkdir(tmp,{recursive:true});
const lesson=path.join(root,'docs/courses/L01');
const handout=await fs.readFile(path.join(lesson,'阅读讲义.md'),'utf8');
const contracts=handout.split('\n').filter(s=>/^- \*\*(核心内容|演示结果|课内增量|通过标准)\*\*：/.test(s)).join('\n');
const p=Presentation.create({slideSize:{width:1280,height:720}}),pages=[],tables=[];
const font='Microsoft YaHei';
const C={ink:'#20252D',blue:'#2757A5',pale:'#E9EFF9',muted:'#657080',line:'#BCC8DA',red:'#B93938',redp:'#FCECEA',green:'#187348',greenp:'#E6F4EC',gold:'#FFF0B0',paper:'#FFFFFF'};
function text(s,v,x,y,w,h,size=32,color=C.ink,bold=false,align='left'){
 const o=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 o.text=v;o.text.style={typeface:font,fontSize:size,color,bold,alignment:align,verticalAlignment:'middle',autoFit:'none',insets:{left:0,right:0,top:0,bottom:0}};return o;
}
function node(s,v,x,y,w,h,{fill=C.pale,color=C.ink,border=C.blue,size=30,bold=false,geometry='rect'}={}){
 const o=s.shapes.add({geometry,position:{left:x,top:y,width:w,height:h},fill,line:{fill:border,width:1.5}});
 o.text=v;o.text.style={typeface:font,fontSize:size,color,bold,alignment:'center',verticalAlignment:'middle',autoFit:'none',insets:{left:10,right:10,top:6,bottom:6}};return o;
}
function link(s,a,b,{from='right',to='left',color=C.ink,width=3}={}){s.shapes.connect(a,b,{fromSide:from,toSide:to,kind:'straight',line:{fill:color,width},tail:{type:'arrow',width:'sm',length:'sm'}});}
function anchor(s,x,y){return text(s,'',x,y,1,1,1);}
function slide(title,section,time,note,takeaway){
 const s=p.slides.add();s.background.fill=C.paper;const n=p.slides.items.length;
 text(s,title,64,65,1110,78,48,C.ink,true);
 text(s,section,66,22,900,30,21,C.blue);
 text(s,String(n).padStart(2,'0'),1170,29,45,30,20,C.muted,false,'right');
 const notes=`L01 ${title}\n时间点：${time}\n教学目的：${takeaway}\n${note}\n\n讲义：docs/courses/L01/阅读讲义.md\n核验日期：2026-09-05\n课程合同：docs/课程大纲-Codex-FDE行动营-个人研发自动化工作台.md\n基础测试资料：https://docs.python.org/3.11/library/unittest.html\n教学形式参考：李宏毅 MLDS 2018 Computational Graph，第5、7、9页，https://speech.ee.ntu.edu.tw/~tlkagk/courses/MLDS_2018/Lecture/Graph.pdf 。借鉴同图递进和颜色标注，所有课程图解为本课重新绘制。\n本讲由学生直接监督Codex建设V0.1，FlowERP本讲不开发。`;
 s.speakerNotes.textFrame.setText(notes+'\n教学组织参考：Stanford CS230 Fall 2025 Lecture 2，第6页具体输入到输出的图解、第15和20页案例后归纳方法，https://cs230.stanford.edu/syllabus/fall_2025/2/lecture_2.pdf 。仅借鉴教学形式，未复用图片或学校标识。');
 pages.push({page:n,section,title,time,purpose:takeaway,evidence:note});return s;
}
function note(s,v,color=C.blue){text(s,v,64,548,940,56,30,color,true);}
async function shot(s,file,x,y,w,h){s.images.add({blob:await fs.readFile(path.join(lesson,'assets/final-deliverables',file)),contentType:'image/png',alt:file,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function table(s,values,x,y,width,height,colWidths,{size=30,header=true}={}){
 tables.push(p.slides.items.length);const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width,height,columnWidths:colWidths,values});
 t.borders.assign({style:'solid',fill:C.line,width:1});
 for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){const k=t.getCell(r,c);k.fill=header&&r===0?C.blue:r%2?'#F4F7FB':'#FFFFFF';k.text.style={typeface:font,fontSize:size,color:header&&r===0?'#FFFFFF':C.ink,bold:header&&r===0,verticalAlignment:'middle',autoFit:'none'};}
 return t;
}
// This explicitly editable teaching diagram retains positions through slides 8–12.
function delivery(s,active=-1){
 const labels=['人\n确认要求','Codex\n实现 V0.1','CLI 程序\n接受检查','人\n验收决定'];const ns=[];
 for(let i=0;i<4;i++)ns.push(node(s,labels[i],64+i*245,205,200,95,{fill:i===active?C.gold:C.pale,border:i===active?'#BA8C22':C.line,bold:i===active,size:30}));
 for(let i=0;i<3;i++)link(s,ns[i],ns[i+1]);
 const names=['需求说明','修改对照','运行记录','接受或退回'];
 names.forEach((v,i)=>text(s,v,64+i*245,315,200,40,25,i===active?C.blue:C.muted,true,'center'));
 text(s,'人组织执行；V0.1 建成后保存这些依据',64,160,940,36,26,C.blue,true);
}
{
const s=slide('以终为始：一次可验证的 AI 交付怎样完成？','Codex + FDE 全链路 AI 编程行动营','0:00','开篇明确首要建设成果为工作台，FlowERP验证其价值。','理解本讲研究对象与课程作品。');
s.shapes.items[0].text='';
text(s,'以终为始：',64,150,950,90,64,C.ink,true);
text(s,'一次可验证的 AI 交付\n怎样完成？',64,245,950,175,58,C.ink,true);
text(s,'01',1030,110,180,140,110,C.blue,true,'right');
text(s,'个人工作台的价值、协作与设计',64,475,940,65,34,C.blue);
}
{
const s=slide('本讲的四个议题','学习导航','0:45','从成果进入问题，用V0.1自身建设贯穿解释与实践。FlowERP截图只展示最终目标。','建立阅读和听课导航。');
const rows=[['01','成果定位','首先交付什么'],['02','交付方法','凭什么判断任务完成'],['03','工作台设计','哪些能力值得固化'],['04','实践与路线','怎样验证自己的第一版']];
rows.forEach((r,i)=>{const y=175+i*84;text(s,r[0],64,y,75,58,40,C.blue,true);text(s,r[1],175,y,240,58,36,C.ink,true);text(s,r[2],455,y,535,58,32);});
note(s,'本讲交付 CLI 记录层；人组织 Codex 执行与检查');
}
{
const s=slide('首先交付个人研发工作台','成果定位','2:00','真实参考截图：assets/final-deliverables/workbench-overview.png。依次讲当前项目、任务、等待验收。截图不是L01学生已实现的证明。','从可观察的产品入口理解工作台用途。');
await shot(s,'workbench-overview.png',64,160,940,378);
note(s,'参考成品：L01 先实现命令行记录层');
}
{
const s=slide('FlowERP 的交付检验工作台价值','成果定位','3:00','工作台首先建成，再组织客户产品增长。后续由实际需求与失败触发工作台升级。Codex协助两者开发，但不是并列业务产品。','解释建设顺序和产品反馈。');
const w=node(s,'个人研发工作台\n组织执行与检查',64,225,350,125,{size:34,bold:true});
const f=node(s,'FlowERP\n形成客户可用的功能',645,225,350,125,{size:34,bold:true});link(s,w,f);
text(s,'交付需求',430,245,190,50,28,C.blue,false,'center');
node(s,'需求变化、失败与使用反馈',64,435,930,70,{fill:C.gold,border:'#D4B54E',size:30});link(s,f,anchor(s,820,435),{from:'bottom',to:'top',color:C.red});link(s,anchor(s,239,435),w,{from:'top',to:'bottom',color:C.red});
text(s,'Codex 协助建设工作台，也协助后续产品开发',64,160,940,40,29,C.muted);
note(s,'课程目标图：执行调度与客户产品在后续逐步建设');
}
{
const s=slide('一周后，怎样接手自己的任务？','成果定位','4:30','本讲贯穿个人工作台自身建设。要求在对话、检查在终端、结论在笔记；材料存在却未关联时，难以证明针对同一任务。图为设计情境。','从接手问题推导记录需求。');
const a=node(s,'对话中的要求',64,205,280,90,{size:32});
const b=node(s,'终端中的结果',390,205,280,90,{size:32});
const c=node(s,'笔记中的决定',716,205,280,90,{size:32});
const d=node(s,'同一个任务：采用哪份要求，检查了哪一版？',64,420,930,80,{fill:C.gold,border:'#BCA045',size:32});
for(const o of [a,b,c])link(s,o,d,{from:'bottom',to:'top'});
note(s,'记录层首先解决：材料属于哪次工作，怎样查回');
}
{
const s=slide('显示创建成功，任务就保存了吗？','交付方法','6:00','教学反例：创建命令返回成功，但数据仅在内存。关闭后重启查询找不到任务。实际演示需保留自己的运行结果。','区分运行成功与满足要求。');
table(s,[['观察时点','结果'],['创建命令','成功'],['关闭后查询','找不到任务']],64,205,440,265,[260,180],{size:30});
text(s,'约定：下次还能查回',555,210,450,65,34,C.green,true);
text(s,'实际：任务丢失',555,310,450,80,40,C.red,true);
text(s,'持久保存尚未实现',555,420,450,60,30,C.red);
note(s,'代码跑通不等于满足需求，要观察约定的结果');
}
{
const s=slide('L01 的建设范围','交付方法','7:30',`${contracts}\nV0.1先建立任务和记录基础，后续再接执行与统一检查。`, '理解第一版为何先选择记录能力。');
table(s,[['本讲 V0.1','后续逐步建设'],['项目、任务、运行记录','接入 Codex 执行'],['保存与查询的五个操作','统一检查和协作流程'],['需求决定与建设证据','通过工作台交付 FlowERP']],64,185,940,338,[470,470],{size:30});
note(s,'先有任务归属和记录，后续执行结果才有解释依据');
}
{
const s=slide('建设 V0.1：各环节交接什么？','交付方法','9:00','L01实际协作。人组织委托与测试，Codex实现，CLI接受检查，建成的V0.1保存记录。箭头不是自动调度功能。后续四页同图递进。','理解职责和交付依据的对应关系。');
delivery(s);
text(s,'每个环节留下可核对的依据',64,410,940,65,38,C.blue,true);
text(s,'任务标题之外，还需要需求、改动、结果与决定',64,485,940,52,30);
note(s,'L01 先实现记录基础，自动执行与检查在后续接入');
}
{
const s=slide('建设 V0.1：先固定验收依据','交付方法','10:30','Spec节选：持久保存任务、重复编号拒绝覆盖。重复策略是本课取舍，不是行业唯一方案。写集即允许修改的文件集合。','将模糊用途转为共同验收条件。');
delivery(s,0);
text(s,'需求说明（Spec）',64,380,940,48,32,C.blue,true);
text(s,'创建后关闭程序，下次仍能查回原要求',64,445,940,48,32);
text(s,'重复编号：本版拒绝创建，保留原内容',64,500,940,48,32);
note(s,'先确认行为，再确定允许修改的文件集合（写集）');
}
{
const s=slide('建设 V0.1：修改是否符合约定？','交付方法','12:00','设计变化示意而非可运行代码或真实Diff。核对数据库写入、读取与错误处理，实际差异由学生执行产生。','用改动对照核对实现与范围。');
delivery(s,1);
text(s,'修改对照（Diff），以下为设计变化示意',64,375,940,45,28,C.muted);
text(s,'−  任务仅留在当前进程的内存',64,425,940,55,37,C.red,true);
text(s,'+  写入本地存储，重启后读取',64,482,940,55,37,C.green,true);
note(s,'写入、读取和错误处理，都需要回到需求核对');
}
{
const s=slide('建设 V0.1：让真实操作接受检查','交付方法','13:30','两次独立进程：创建后退出，再启动查询。先红后绿是本课必要证据，不足以单独证明交付合格；还需范围、其他用例和人审。以下是实验预期，非已完成运行。','理解测试需要经过真实功能。');
delivery(s,2);
text(s,'同一实验：创建任务 → 退出 → 重新查询',64,385,940,45,30);
text(s,'实现前：任务丢失',64,455,450,60,36,C.red,true);
text(s,'实现后：原要求仍在',555,455,450,60,36,C.green,true);
note(s,'先红后绿：本课交付的必要条件，不是充分条件');
}
{
const s=slide('建设 V0.1：依据结果作出验收决定','交付方法','15:00','示意摘要：持久保存已检查，重复编号及其余操作仍待复核。人的决定需要对应实际验证范围。','说明验收是有范围的责任判断。');
delivery(s,3);
text(s,'持久保存检查通过',64,390,940,50,34,C.green,true);
text(s,'重复编号与其余操作，仍需复核',64,460,940,50,34);
note(s,'摘要示意：保留未决项，结论为“等待人工审核”');
}
{
const s=slide('哪些重复问题值得固化？','工作台设计','16:00','工作台效益需要真实观察，不虚构效率提升。取舍条件包括重复频率、遗漏损失与建设维护成本。','从案例推导工具能力及其成本。');
s.background.fill='#FFF8DC';
const problems=['反复查找旧要求','检查结果归属不清','失败后难以接手'];
const mechanisms=['保存需求快照','关联每次运行结果','保留历史尝试与修订'];
problems.forEach((v,i)=>{const y=195+i*105;const a=node(s,v,64,y,340,70,{fill:'#FFFFFF',border:C.line,size:31});const b=node(s,mechanisms[i],540,y,460,70,{size:31});link(s,a,b);});
note(s,'建设取舍：重复频率、遗漏后果与维护成本');
}
{
const s=slide('项目、任务、运行记录为什么分开？','工作台设计','17:00','一项目多任务，一任务多记录。ID为稳定编号，需求快照为当时内容副本。设计依据是生命周期和归属不同。','从信息变化推导数据关系。');
const a=node(s,'项目\n个人工作台',64,260,235,100,{size:32,bold:true});
const b=node(s,'本次任务\n开发 V0.1',410,200,245,100,{size:32,bold:true});
const b2=node(s,'后续任务\n接入执行',410,405,245,100,{size:32});
const c=node(s,'运行 1：失败',780,190,220,65,{fill:C.redp,border:C.red,size:28});
const c2=node(s,'运行 2：通过',780,305,220,65,{fill:C.greenp,border:C.green,size:28});
link(s,a,b);link(s,a,b2);link(s,b,c);link(s,b,c2);
text(s,'项目长期存在',64,400,260,45,27,C.muted);text(s,'任务会不断增加',410,325,270,42,27,C.muted);
note(s,'编号明确归属，需求快照保存本次采用的约定');
}
{
const s=slide('五个操作形成最小记录系统','工作台设计','18:00','命令对应workbench-init、workbench-project-add、workbench-task-create、workbench-evidence-add、workbench-status。命令参数在实践手册。查询不会执行测试。','理解操作如何产生、追加和读取数据。');
const a=node(s,'初始化\n工作台',64,190,200,100,{size:30}),b=node(s,'登记\n项目',310,190,200,100,{size:30}),c=node(s,'创建\n任务',555,190,200,100,{size:30}),d=node(s,'追加\n运行记录',800,190,200,100,{size:30});
link(s,a,b);link(s,b,c);link(s,c,d);
const saved=node(s,'已保存：工作台信息、项目、任务和多次运行记录',64,345,940,65,{fill:'#FFFFFF',border:C.line,size:29});
for(const [o,x] of [[a,164],[b,410],[c,655],[d,900]])link(s,o,anchor(s,x,345),{from:'bottom',to:'top'});
const q=node(s,'查看状态：读取已有信息，指出缺失材料',64,455,940,65,{fill:C.gold,border:'#C0A24F',size:30});
link(s,saved,q,{from:'bottom',to:'top'});
note(s,'交付 Python CLI 程序；查询读取记录，不运行测试');
}
{
const s=slide('第一次建设，由谁组织？','工作台设计','19:00','自举：程序尚不存在时人直接监督Codex，采集工具存文件；建成后登记自身建设并导入原始记录。导入不认证记录真实性。','解释自举的时间顺序与证据来源。');
text(s,'程序建成前',64,175,420,55,36,C.blue,true);text(s,'程序建成后',570,175,430,55,36,C.blue,true);
const a=node(s,'人与 Codex\n开发 V0.1',64,260,350,100,{size:34});
const b=node(s,'新工作台\n登记自己的建设任务',570,260,430,100,{size:32});
const f=node(s,'实际运行输出文件',64,445,350,65,{fill:C.gold,border:'#BCA045',size:29});
link(s,a,f,{from:'bottom',to:'top'});link(s,f,b,{from:'right',to:'bottom'});
text(s,'采集与导入：课程已提供的脚手架',570,430,430,70,27,C.muted);
note(s,'自举：用新工作台检查自己的记录和查询能力');
}
{
const s=slide('旧的通过结果，还能代表现在吗？','工作台设计','20:00','让学生先预测，再讨论任务状态需要绑定需求版本、测试与尝试。此页是设计情境，不是仓库实际状态机规范。','理解历史结论与当前状态的关系。');
const a=node(s,'需求版本 A\n检查通过',64,245,360,140,{fill:C.greenp,border:C.green,size:36,bold:true});
const b=node(s,'需求版本 B\n最新检查失败',640,245,360,140,{fill:C.redp,border:C.red,size:36,bold:true});link(s,a,b);
text(s,'需求修订',440,265,180,70,30,C.muted,false,'center');
text(s,'保留历史结论',64,420,400,60,32,C.green);
text(s,'当前问题仍需处理',640,420,360,60,32,C.red);
note(s,'设计情境：状态必须对应具体要求与本次尝试');
}
{
const s=slide('正常路径：关闭后还能查回吗？','工作台设计','21:00','预期行为，实际需要学生实现后执行。先登记项目任务再追加记录，关闭程序重开，同ID查询核对要求内容和运行记录。','把持久化设计转换为实验。');
const vals=['建立任务','追加记录','关闭重开','查询同一任务'];const ns=vals.map((v,i)=>node(s,v,64+i*245,230,200,85,{size:29,bold:true}));
for(let i=0;i<3;i++)link(s,ns[i],ns[i+1]);
text(s,'要核对的内容',64,370,940,50,34,C.blue,true);
text(s,'任务归属一致　　需求版本一致　　运行记录仍在',64,445,940,60,30);
note(s,'实验预期：数据持续保存，不能只在本次进程里可见');
}
{
const s=slide('失败路径：拒绝后，原数据还在吗？','工作台设计','22:00','任务编号重复是错误请求。实际操作需保存拒绝结果并再次查询原任务。仅观察错误提示无法证明已有数据不受破坏。','把失败响应和失败后状态分别验证。');
const a=node(s,'已有任务 A\n需求与记录已保存',64,220,360,130,{size:32});
const b=node(s,'重复创建任务 A\n请求被拒绝',640,220,360,130,{fill:C.redp,border:C.red,size:32});link(s,a,b);
const c=node(s,'重新查询任务 A：原内容保持不变',260,435,740,72,{fill:C.greenp,border:C.green,size:31});link(s,b,c,{from:'bottom',to:'top'});
note(s,'实验预期：错误响应与数据保持，都需要检查');
}
{
const s=slide('记录完整，意味着什么？','实践与路线','23:00','V0.1状态检查的范围：材料能够查到，不自动认证真伪或证明功能正确。以下为概念对照，不是实际运行报告。','理解记录完整性与交付正确性的边界。');
text(s,'状态查询检查：要求与运行记录是否齐全',64,185,940,65,34,C.ink,true);
node(s,'材料齐全',64,325,360,95,{fill:C.greenp,border:C.green,size:38,bold:true});
node(s,'仍需人工复验',575,325,425,95,{fill:C.gold,border:'#BCA045',size:36,bold:true});
text(s,'还需要',435,342,135,60,26,C.muted,false,'center');
text(s,'逐项核对：要求、测试、改动、实际结果',64,455,940,65,32);
note(s,'V0.1 保存判断依据，接受决定由人负责');
}
{
const s=slide('四周怎样逐步扩展工作台？','实践与路线','25:00','根据课程大纲概括四周。L04第一次受控库存导出，L16现场完成此前未实现小需求。阶段名为课程路线，不代表当前已实现状态。','理解阶段成果和验收依据。');
table(s,[['阶段','建设重点','验收依据'],['第一周 V0','规则、需求与执行','最小真实交付'],['第二周 V1','统一检查与门禁','违规被阻断'],['第三周 V2','有界修复与协作','停止条件有效'],['第四周 V3','服务、界面与反馈','现场新需求交付']],64,175,940,354,[240,355,345],{size:29});
note(s,'FlowERP 持续增长，每一阶段都接受产品交付检验');
}
{
const s=slide('工作台的设计，需要接受交付检验','实践与路线','29:00','结束回到建设主线和有实质判断的讨论。学生通过行动卡和手册完成五操作、本人Spec、红Diff绿和自举，反馈后签署接受范围。','将机制判断迁移到自己的方案。');
s.background.fill='#FFF8DC';
text(s,'先交付工作台，通过 FlowERP 验证并改进它',64,180,940,90,40,C.blue,true);
text(s,'哪些检查值得固定执行？\n哪些决定仍需要使用者参与？',64,320,940,100,35);
text(s,'换一个客户项目，哪些能力可以复用？',64,465,940,60,35);
note(s,'课后任务卡：行动卡.md　　实践记录：SUBMISSION.md');
}
await fs.writeFile(path.join(tmp,'teaching-map.json'),JSON.stringify(pages,null,2));
const candidate=path.join(tmp,'candidate.pptx');await (await PresentationFile.exportPptx(p)).save(candidate);
for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const png=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(tmp,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));}
const output=path.join(tmp,'final','L01.pptx');await fs.mkdir(path.dirname(output),{recursive:true});
const owners=[...new Set(tables)];
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:output,pythonExecutable:python,
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',...owners.flatMap(n=>['--require-native-table-slide',String(n)])],
 explicitTotalSlideCount:22,requiredNativeTableOwnerSlides:owners,fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(tmp,'validation.json')});
console.log(JSON.stringify({tmp,output,pages:22}));
