/**
 * 展厅模板 + 展品元数据
 *
 * 展台槽位（slot）说明：
 *   pos   [x, z]  展台中心的地面坐标
 *   face  弧度    展品正面朝向（0 = 面向 +Z）
 *   tier  0 主厅中央 / 1 大型落地 / 2 常规展台 / 3 玻璃展柜
 *   fp    [w, d]  台面尺寸，展品超出会被自动缩小
 *   h     展台高度，展品底面自动吸附到 h
 *   style 'platform' 低平台 | 'plinth' 方柱台 | 'case' 玻璃柜 | 'niche' 壁龛台
 *
 * 展品 tier 与槽位 tier 匹配后按声明顺序自动排布，
 * 因此换模板 / 增删展品都不需要手工填坐标。
 */

export const TEMPLATES = {
  /* ================= 现代开放式 ================= */
  'modern-open': {
    name: '现代开放式',
    size: { w: 34, d: 22, h: 7.5 },
    palette: {
      floor: 0xe9ecef, floorLine: 0xc4ccd4, wall: 0xf5f7f9, ceiling: 0x2b3138,
      trim: 0x9aa5b1, accent: 0x2f6df6, fog: 0xdfe5ea,
    },
    ambient: { sky: 0xffffff, ground: 0xc9d2da, intensity: 1.15 },
    spawn: { pos: [0, 9.2], yaw: Math.PI },
    slots: [
      { id: 'm-c1', tier: 0, pos: [-7.5, -0.5], face: -0.35, fp: [7.6, 5.4], h: 0.32, style: 'platform' },
      { id: 'm-c2', tier: 0, pos: [7.5, -1.5], face: 0.3, fp: [7.2, 5.2], h: 0.32, style: 'platform' },
      { id: 'm-l1', tier: 1, pos: [-14.2, 6.4], face: Math.PI / 2, fp: [2.2, 2.2], h: 0.42, style: 'plinth' },
      { id: 'm-l2', tier: 1, pos: [-14.2, -0.4], face: Math.PI / 2, fp: [2.4, 2.4], h: 0.5, style: 'plinth' },
      { id: 'm-l3', tier: 1, pos: [-14.2, -7.2], face: Math.PI / 2, fp: [2.2, 2.2], h: 0.3, style: 'plinth' },
      { id: 'm-r1', tier: 1, pos: [14.2, -7.2], face: -Math.PI / 2, fp: [2.4, 2.4], h: 0.3, style: 'plinth' },
      { id: 'm-r2', tier: 3, pos: [14.2, 6.4], face: -Math.PI / 2, fp: [0.9, 0.9], h: 1.02, style: 'case' },
      { id: 'm-r3', tier: 3, pos: [14.2, -0.4], face: -Math.PI / 2, fp: [0.9, 0.9], h: 1.02, style: 'case' },
    ],
  },

  /* ================= 古典长廊式 ================= */
  'classic-corridor': {
    name: '古典长廊式',
    size: { w: 40, d: 13, h: 7 },
    palette: {
      floor: 0x6f6153, floorLine: 0x574b40, wall: 0xe7ddc9, ceiling: 0x4a3f34,
      trim: 0xb59b6e, accent: 0xc9a349, fog: 0x473e34,
    },
    ambient: { sky: 0xfff2dc, ground: 0x6c5c48, intensity: 0.95 },
    spawn: { pos: [-17.5, 0], yaw: -Math.PI / 2 },
    slots: [
      // 中轴大件
      { id: 'c-a1', tier: 0, pos: [-8.5, 0], face: -Math.PI / 2, fp: [6.0, 3.2], h: 0.28, style: 'platform' },
      { id: 'c-a2', tier: 0, pos: [1.5, 0], face: -Math.PI / 2, fp: [2.6, 2.6], h: 0.62, style: 'plinth' },
      { id: 'c-a3', tier: 0, pos: [11.5, 0], face: -Math.PI / 2, fp: [3.0, 3.0], h: 0.28, style: 'platform' },
      // 左壁龛（z 负侧，面向 +Z）
      { id: 'c-l1', tier: 2, pos: [-14.5, -4.4], face: 0, fp: [1.5, 1.2], h: 0.82, style: 'niche' },
      { id: 'c-l2', tier: 2, pos: [-7.5, -4.4], face: 0, fp: [1.5, 1.2], h: 0.82, style: 'niche' },
      { id: 'c-l3', tier: 2, pos: [-0.5, -4.4], face: 0, fp: [1.5, 1.2], h: 0.82, style: 'niche' },
      { id: 'c-l4', tier: 2, pos: [6.5, -4.4], face: 0, fp: [1.5, 1.2], h: 0.82, style: 'niche' },
      // 右壁龛（z 正侧，面向 -Z）
      { id: 'c-r1', tier: 3, pos: [-14.5, 4.4], face: Math.PI, fp: [1.0, 1.0], h: 0.95, style: 'case' },
      { id: 'c-r2', tier: 3, pos: [-7.5, 4.4], face: Math.PI, fp: [1.0, 1.0], h: 0.95, style: 'case' },
      { id: 'c-r3', tier: 3, pos: [-0.5, 4.4], face: Math.PI, fp: [1.0, 1.0], h: 0.95, style: 'case' },
      { id: 'c-r4', tier: 3, pos: [6.5, 4.4], face: Math.PI, fp: [1.0, 1.0], h: 0.95, style: 'case' },
    ],
  },

  /* ================= 自然史穹顶厅 ================= */
  'natural-dome': {
    name: '自然史穹顶厅',
    size: { w: 48, d: 32, h: 13 },
    palette: {
      floor: 0x3b4148, floorLine: 0x2b3037, wall: 0x59636d, ceiling: 0x1c2126,
      trim: 0x8d99a4, accent: 0x53b6a8, fog: 0x1b2126,
    },
    ambient: { sky: 0xdfeaf2, ground: 0x39424a, intensity: 0.85 },
    spawn: { pos: [0, 14], yaw: Math.PI },
    slots: [
      { id: 'n-hero', tier: 0, pos: [0, 0], face: 0, fp: [26, 6], h: 0.45, style: 'platform' },
      // 生态标本区
      { id: 'n-d1', tier: 1, pos: [-13.5, -10.5], face: 0.4, fp: [8.2, 8.2], h: 0.28, style: 'platform' },
      { id: 'n-d2', tier: 1, pos: [0, -11], face: 0, fp: [4.4, 4.4], h: 0.28, style: 'platform' },
      { id: 'n-d3', tier: 1, pos: [12.5, -10.5], face: -0.4, fp: [4.0, 4.0], h: 0.28, style: 'platform' },
      { id: 'n-d4', tier: 1, pos: [-13.5, 10.5], face: Math.PI - 0.4, fp: [3.6, 3.6], h: 0.28, style: 'platform' },
      // 地质 / 化石区
      { id: 'n-g1', tier: 2, pos: [-4, 11], face: Math.PI, fp: [1.8, 1.8], h: 0.5, style: 'plinth' },
      { id: 'n-g2', tier: 2, pos: [3.5, 11], face: Math.PI, fp: [2.6, 2.6], h: 0.4, style: 'plinth' },
      { id: 'n-g3', tier: 2, pos: [12.5, 11], face: Math.PI, fp: [1.8, 1.8], h: 0.62, style: 'plinth' },
      // 玻璃展柜
      { id: 'n-c1', tier: 3, pos: [-20.5, -3.5], face: Math.PI / 2, fp: [1.1, 1.1], h: 0.9, style: 'case' },
      { id: 'n-c2', tier: 3, pos: [-20.5, 3.5], face: Math.PI / 2, fp: [1.1, 1.1], h: 0.9, style: 'case' },
      { id: 'n-c3', tier: 3, pos: [20.5, -3.5], face: -Math.PI / 2, fp: [1.1, 1.1], h: 0.9, style: 'case' },
      { id: 'n-c4', tier: 3, pos: [20.5, 3.5], face: -Math.PI / 2, fp: [1.1, 1.1], h: 0.9, style: 'case' },
    ],
  },
};

/* ==================================================================== */
/* 三个展厅                                                              */
/* ==================================================================== */

export const HALLS = [
  {
    id: 'modern',
    name: '现代展馆',
    en: 'Hall of Modern Design',
    template: 'modern-open',
    theme: '#2f6df6',
    gradient: ['#0f2748', '#2f6df6', '#37c8d8'],
    tagline: '正在发生的未来',
    intro:
      '开放式无柱大跨度空间，以中央双平台承载概念载具，两翼列置智能终端与仿生机械。' +
      '展陈聚焦「设计如何回应人的下一个十年」——从出行方式、身体延伸到居所构造的连续演进。',
    highlights: ['概念载具', '智能穿戴', '仿生机器人', '增材制造'],
  },
  {
    id: 'classical',
    name: '古典展馆',
    en: 'Hall of Antiquities',
    template: 'classic-corridor',
    theme: '#c9a349',
    gradient: ['#1c1409', '#6b5322', '#c9a349'],
    tagline: '器以载道，纹以纪年',
    intro:
      '仿古长廊形制，中轴陈列青铜礼器与宫廷服饰，两侧壁龛与展柜依年代序列铺陈。' +
      '自新石器时代玉器起，历商周青铜、汉唐金银、宋元明清瓷器，兼陈古希腊陶艺以作东西对读。',
    highlights: ['青铜礼乐', '玉石礼器', '官窑瓷器', '皇室服饰'],
  },
  {
    id: 'natural',
    name: '自然历史馆',
    en: 'Hall of Natural History',
    template: 'natural-dome',
    theme: '#53b6a8',
    gradient: ['#0d1b1e', '#1f4d4a', '#53b6a8'],
    tagline: '四十六亿年的证词',
    intro:
      '13 米净高的穹顶大厅，中央架设 20 余米长的蜥脚类骨架。环厅依次为古生物化石、' +
      '天外来客与火山构造、现生哺乳动物生态景箱，以及浸制与针插标本柜。',
    highlights: ['恐龙骨架', '化石与陨石', '生态景箱', '标本柜'],
  },
];

/* ==================================================================== */
/* 展品                                                                  */
/* 说明：name/en/era/material/desc/facts/license/credit 取自真实原型    */
/* （见 tools/refs/manifest.json）；id/hall/tier/size 与布局槽位绑定，   */
/* 不可改动。license/credit 为图源署名信息，供展馆署名页调用。          */
/* ==================================================================== */

export const EXHIBITS = [
  /* ---------------- 现代展馆 ---------------- */
  {
    id: 'concept-car', hall: 'modern', tier: 0, size: 4.9,
    name: '梅赛德斯-奔驰 VISION EQXX 概念车', en: 'Mercedes-Benz VISION EQXX',
    era: '2022 年', material: '碳纤维单体壳 · 铝合金副车架 · 117 块车顶太阳能板',
    category: '概念载具',
    desc: '奔驰 2022 年发布的能效研究概念车，以「单弓形（one-bow）」剪影著称——车长近 5 米而车高仅 1.35 米，视觉比例约 3.7:1。前脸为封闭盾形黑面板配环状灯带，车顶自 A 柱连续下滑收成水滴尾，后轮半包于轮眉之内。风阻系数低至 Cd 0.17，车顶 117 块太阳能板在理想条件下可额外提供约 25 km 续航。',
    facts: [['车长', '4 975 mm'], ['车高', '1 348 mm'], ['风阻系数', 'Cd 0.17'], ['太阳能板', '117 块']],
    license: 'CC BY-SA 4.0', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'evtol-aircraft', hall: 'modern', tier: 0, size: 5.6,
    name: '亿航 EH216-S 自动驾驶载人航空器', en: 'EHang EH216-S',
    era: '2023 年', material: '碳纤维臂 · 复合材座舱 · 橇式起落架',
    category: '概念载具',
    desc: '亿航 2023 年获中国民航局型号合格证的载人级自动驾驶飞行器。16 副共轴双桨分置于 8 根碳纤维放射臂端，提供垂直起降与巡航推进；座舱为两座并排胶囊体，配鸥翼门。整机净重约 650 kg，设计用于城市空中交通与低空观光，无需驾驶员操纵。',
    facts: [['最大起飞重量', '650 kg'], ['旋翼', '16 桨 / 8 轴'], ['外形', '5.63 × 5.63 m'], ['认证', '2023 TC 取证']],
    license: 'BSD-3-Clause', credit: 'Unitree Robotics 官方 G1 URDF/STL（网格与结构）',
  },
  {
    id: 'humanoid-robot', hall: 'modern', tier: 1, size: 1.75,
    displayYaw: -Math.PI / 2,
    name: '宇树 G1 人形机器人', en: 'Unitree G1 Humanoid Robot',
    era: '2024 年', material: '航空铝关节电机 · 白色银灰壳体 · 外露扁圆柱驱动器',
    category: '仿生机器人',
    desc: '宇树 2024 年发布的消费级人形机器人，身高 1.32 m、重约 35 kg，全身 23 个自由度（单腿 6、单臂 5、腰 1、单手 7）。头部为无面孔圆角传感器舱，顶置圆柱形 3D 激光雷达；肩部外置圆柱形关节电机为其最强识别特征，髋膝踝均可见外露扁圆柱驱动器，全关节中空走线。',
    facts: [['身高', '1 320 mm'], ['自重', '≈ 35 kg'], ['自由度', '23 DoF'], ['发布', '2024-05']],
    license: 'CC0', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'robot-dog', hall: 'modern', tier: 1, size: 1.1,
    name: '宇树 Go2 四足机器人', en: 'Unitree Go2 Quadruped Robot',
    era: '2023 年', material: '铝合金精密关节 · 扁长方体躯干 · 橡胶半球足垫',
    category: '仿生机器人',
    desc: '宇树 2023 年发布的四足机器人，机身 700 × 310 × 400 mm、重约 15 kg。头部前端为半球形 4D 广角激光雷达（360°×96°），是最显眼特征；四腿两段式扁平连杆，每腿 3 个关节电机，膝关节内走线无外露线缆；足端为小半球橡胶垫。黑色主体配银白灰装饰件与蓝色状态灯。',
    facts: [['机身', '700 × 310 × 400 mm'], ['自重', '≈ 15 kg'], ['关节电机', '12 个'], ['雷达', '4D 广角 L2']],
    license: 'BSD-3-Clause', credit: 'Unitree Robotics 官方 Go2 MJCF/OBJ（网格与结构）',
  },
  {
    id: 'printed-chair', hall: 'modern', tier: 1, size: 1.0,
    name: 'Maker Chair（拼图）3D 打印椅', en: 'Joris Laarman Lab — Maker Chair (Puzzle)',
    era: '2014 年', material: 'ABS 哑光长丝 · 立体拼图块拼合',
    category: '增材制造',
    desc: '荷兰设计师 Joris Laarman 实验室 2014 年的作品。整椅由上百块可拼合的立体拼图块组成，块与块之间留有可见分缝线——因而呈现为「外壳曲面 + 分块凹槽」而非平滑连续面。椅背与坐面为一片连续 S 形曲壳，向下延伸成四条锥形收细椅腿，腿与壳体过渡无明显接缝。',
    facts: [['高', '780 mm'], ['宽 × 深', '540 × 650 mm'], ['坐高', '430 mm'], ['构成', '上百拼图块']],
    license: 'CC BY 3.0', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'lattice-table', hall: 'modern', tier: 1, size: 1.45,
    name: '渐变 3D 打印混凝土茶几', en: 'Gradient Coffee Table (Aduatz × incremental3d)',
    era: '2021 年', material: '连续打印混凝土 · 等高线层条堆叠',
    category: '增材制造',
    desc: '设计师 Philipp Aduatz 与 incremental3d 于 2021 年合作的限量作品。桌体由连续水平打印层条堆叠而成，层高约 5—10 mm，层与层轮廓渐变错位形成等高线外观；整体为低矮长条形雕塑体，侧立面呈波浪扭转，颜色从一端色相平滑过渡到另一端。混凝土哑光粗糙，可见挤出料条的圆弧截面。',
    facts: [['高', '450 mm'], ['长 × 深', '1 490 × 560 mm'], ['层高', '≈ 8 mm'], ['限量', '50 + 2 AP']],
    license: 'CC BY 2.0', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'smart-watch', hall: 'modern', tier: 3, size: 0.30,
    name: '钛金属运动智能手表', en: 'Titanium Sport Smartwatch (Ultra 2 form)',
    era: '2023 年', material: '5 级钛金属表壳 · 蓝宝石平镜 · 氟橡胶表带',
    category: '智能穿戴',
    desc: '采用 5 级钛金属整体表壳，平整蓝宝石表镜边缘被钛壳抬高一圈形成护边。右侧数码表冠外径加大带纵向滚花并设独立护桥，表冠上方为侧边按钮；左侧橙色操作按钮为唯一撞色件。背面为圆形传感器阵列，支持双频 GPS 与深度计，整机可承受 100 m 防水。',
    facts: [['表壳', '49 × 44 × 14.4 mm'], ['重量', '≈ 61 g'], ['表镜', '蓝宝石平镜'], ['防护', '100 m / EN13319']],
    license: '程序化生成', credit: '形制参考 · 无外部图源',
  },
  {
    id: 'ar-glasses', hall: 'modern', tier: 3, size: 0.42,
    name: '混合现实头显', en: 'Mixed Reality Headset (HoloLens 2 form)',
    era: '2019 年', material: '碳纤维头箍 · 弧形透明波导护镜',
    category: '智能穿戴',
    desc: '碳纤维头箍加可上翻面罩，铰链在额头两侧。面罩为整片弧形透明护镜，内嵌波导片；前沿 4 颗可见光跟踪相机加 1 颗 RGB 与 1 颗 ToF 深度，鼻梁上方内侧 2 颗红外眼动相机。电池仓移至后脑勺实现前后 50:50 配重，后部旋钮式收紧。',
    facts: [['面罩', '190 × 62 mm'], ['头围', '≈ 200 mm'], ['重量', '≈ 566 g'], ['视场', '约 52° 对角']],
    license: '程序化生成', credit: '形制参考 · 无外部图源',
  },

  /* ---------------- 古典展馆 ---------------- */
  {
    id: 'bianzhong', hall: 'classical', tier: 0, size: 5.2,
    name: '曾侯乙编钟', en: 'Bianzhong of Marquis Yi of Zeng',
    era: '战国早期 · 公元前 433 年', material: '青铜（铜锡铅合金）· 木胎髹漆钟架 · 佩剑铜人承托',
    category: '青铜礼乐',
    desc: '1978 年湖北随县擂鼓墩曾侯乙墓出土，曲尺形三层八组共 65 件（钮钟 19、甬钟 45、楚王镈 1）。钟体为合瓦形截面，每钟正鼓与侧鼓两处敲击可发相距三度的两个乐音，是先秦「一钟双音」技术的巅峰物证。钟体篆间铸 36 枚乳钉状「枚」，错金铭文 3 755 字记录乐律。',
    facts: [['总数', '65 件'], ['音域', '五个八度'], ['铸法', '陶范合铸'], ['铭文', '3 755 字错金']],
    license: 'CC BY-SA 2.0', credit: 'Wikimedia Commons',
  },
  {
    id: 'bronze-fangding', hall: 'classical', tier: 0, size: 1.15,
    name: '后母戊鼎（司母戊鼎）', en: 'Houmuwu Ding',
    era: '商代晚期 · 约公元前 13—前 11 世纪', material: '青铜（含锡约 17%）',
    category: '青铜礼乐',
    desc: '现存最重的青铜礼器，1939 年出土于河南安阳，重达 832.84 kg。长方槽形腹、四柱足、双立耳，立耳外侧浮雕双虎噬人首；腹四壁仅四边缘各饰一条兽面纹带，中央大面积素面，四转角与每面中线共 8 条扉棱。内壁近耳处铸铭「后母戊」三字，为商王祖庚或祖甲祭祀母亲「戊」而铸。',
    facts: [['通高', '133 cm'], ['口长', '112 cm'], ['重量', '832.84 kg'], ['主纹', '兽面纹带']],
    license: 'CC BY-SA 3.0', credit: 'Wikimedia Commons',
  },
  {
    id: 'dragon-robe', hall: 'classical', tier: 0, size: 1.9,
    name: '明黄缂丝十二章龙袍', en: "Imperial Yellow Twelve-Symbol Dragon Robe",
    era: '清 · 雍正—光绪时期', material: '缂丝地 · 捻金线 · 孔雀羽线 · 米珠',
    category: '皇室服饰',
    desc: '明黄为皇帝专用色。通身以「通经断纬」的缂丝技法织就，正面前后与两肩各一条正龙，下摆行龙四条，合九龙之数。领襟与下摆织海水江崖纹，寓「江山永固」。衣身散布日、月、星辰、山、龙、华虫等十二章纹，为帝王衮服的最高规格。现藏大都会艺术博物馆。',
    facts: [['等级', '皇帝朝服'], ['技法', '缂丝（通经断纬）'], ['纹样', '九龙十二章'], ['衣长', '1 448 mm']],
    license: 'Public domain', credit: 'Chester Beatty Library / Wikimedia Commons',
  },
  {
    id: 'jade-cong', hall: 'classical', tier: 2, size: 0.60,
    name: '良渚玉琮王', en: 'Liangzhu Jade Cong King',
    era: '新石器时代良渚文化 · 约公元前 3300—2300 年', material: '透闪石软玉（反山 M12:98）',
    category: '玉石礼器',
    desc: '1986 年浙江余杭反山 M12 出土，高 8.9 cm、重 6.5 kg，为现存体量最大、雕工最精的玉琮，故称「琮王」。外方内圆、上大下小，四面直槽内上下各刻一个完整神人兽面纹共 8 个，四转角作两节简化神人兽面。以解玉砂线切割完成，是良渚「神权」的最高物证。',
    facts: [['通高', '8.9 cm'], ['重量', '6.5 kg'], ['纹样', '神人兽面纹'], ['出土地', '反山 M12:98']],
    license: 'CC0', credit: 'Wikimedia Commons',
  },
  {
    id: 'oracle-bone', hall: 'classical', tier: 2, size: 0.8,
    name: '牛肩胛骨刻辞', en: 'Oracle Bone Inscription on Ox Scapula',
    era: '商代晚期 · 约公元前 1200 年', material: '牛肩胛骨',
    category: '文字遗存',
    desc: '殷商王室占卜的实物遗存。占卜时先在骨背凿出枣核形长凿、旁加圆钻，再施灼烧，正面因热应力爆出「卜」字形裂纹，贞人据兆纹走向判定吉凶，再将卜问事项、占断与应验刻于旁。所刻即甲骨文，是目前已知汉字体系最早的成熟形态；部分刻辞可涂朱。',
    facts: [['载体', '牛肩胛骨'], ['尺寸', '约 260 × 130 mm'], ['内容', '卜雨 · 卜年 · 卜征'], ['文字', '甲骨文']],
    license: 'CC0', credit: 'Wikimedia Commons',
  },
  {
    id: 'greek-amphora', hall: 'classical', tier: 2, size: 1.0,
    name: '泛雅典娜奖瓶（黑绘双耳瓶）', en: 'Panathenaic Prize Amphora',
    era: '古希腊古风时期 · 约公元前 530 年', material: '雅典陶土 · 黑色化妆土釉',
    category: '古典陶艺',
    desc: '雅典每年泛雅典娜节体育赛事的获胜奖品瓶，内盛圣油，故又称奖瓶。阿提卡黑绘典型器：以富含铁质的细泥浆在赭红胎体上绘出人物剪影，经三段式烧成定色为黑。A 面常绘雅典娜持矛盾侧身立于两根多立克柱之间，柱头各立公鸡；B 面为赛事场景。是研究古希腊神话与竞技的一手材料。',
    facts: [['器型', '颈式双耳瓶'], ['技法', '黑绘（Black-figure）'], ['产地', '阿提卡'], ['用途', '竞技奖品']],
    license: 'CC0', credit: 'Wikimedia Commons',
  },
  {
    id: 'yuan-blue-vase', hall: 'classical', tier: 2, size: 0.82,
    name: '青花萧何月下追韩信梅瓶', en: 'Yuan Blue-and-White Meiping "Xiao He Chasing Han Xin"',
    era: '元 · 14 世纪', material: '景德镇瓷土 · 进口苏麻离青钴料',
    category: '官窑瓷器',
    desc: '元青花巅峰之作，1950 年出土于南京将军山沐英墓（现藏南京市博物馆）。小口平沿、丰肩、敛胫、平底，腹部主纹绘「萧何月下追韩信」历史故事，人物、松竹、江岸层次分明。青花用波斯进口「苏麻离青」，发色浓艳并在积釉处结深褐色铁锈斑，是元青花断代关键特征。',
    facts: [['通高', '44.1 cm'], ['钴料', '苏麻离青'], ['窑口', '景德镇'], ['题材', '萧何追韩信']],
    license: 'CC0', credit: 'Wikimedia Commons',
  },
  {
    id: 'chenghua-chicken-cup', hall: 'classical', tier: 3, size: 0.22,
    name: '明成化斗彩鸡缸杯', en: 'Chenghua Doucai Chicken Cup',
    era: '明 · 成化（1465—1487 年）', material: '斗彩瓷（青花勾勒 + 釉上填彩）',
    category: '官窑瓷器',
    desc: '成化御窑代表作。先以青花在坯上勾出全部轮廓，罩透明釉高温烧成；再于釉上按轮廓填施红、黄、绿等彩，低温二次烧结，青花与彩料「斗」合成画，故名斗彩。外壁绘子母鸡与湖石花草两组，笔意率真。器小胎薄，迎光透影如玉。现藏大都会艺术博物馆（1987.85）。',
    facts: [['口径', '8.3 cm'], ['通高', '4.1 cm'], ['款识', '大明成化年制'], ['题材', '子母鸡图']],
    license: 'CC0', credit: 'The Metropolitan Museum of Art',
  },
  {
    id: 'tang-silver-ewer', hall: 'classical', tier: 3, size: 0.55,
    name: '鎏金鹦鹉纹提梁银罐', en: 'Gilt Silver Jar with Parrot Design',
    era: '唐 · 8 世纪', material: '锤揲银胎 · 局部鎏金（何家村窖藏）',
    category: '金银器皿',
    desc: '1970 年西安南郊何家村窖藏出土（现藏陕西历史博物馆）。银片锤揲成型，覆碗形盖顶置宝珠钮，弧形提梁两端接肩部双系。通体鱼子纹地上錾刻鎏金：腹部两侧各一鹦鹉展翅团花，周围折枝葡萄卷草，盖面饰宝相花。银地金花形成「金花银器」效果，是唐代金银器工艺的高峰。',
    facts: [['通高', '24.2 cm'], ['重量', '1.789 kg'], ['装饰', '錾刻 + 鎏金'], ['源流', '何家村窖藏']],
    license: 'CC BY-SA 3.0', credit: 'Wikimedia Commons',
  },
  {
    id: 'jade-imperial-seal', hall: 'classical', tier: 3, size: 0.48,
    name: '「皇后之玺」玉印', en: 'Jade Seal of the Empress',
    era: '西汉 · 公元前 2 世纪', material: '和田白玉 · 螭虎钮',
    category: '玉玺印绶',
    desc: '1968 年陕西咸阳韩家湾出土（现藏陕西历史博物馆），是迄今所见唯一的汉代帝后玉玺，也是等级最高的汉代印章。选和田白玉整挖，印台正方形，螭虎钮伏卧状、头微昂、张口露齿、长尾卷曲。印面阴刻小篆白文「皇后之玺」四字，四侧阴刻云纹。',
    facts: [['材质', '和田白玉'], ['印纽', '螭虎钮'], ['印文', '皇后之玺'], ['重量', '33 g']],
    license: 'CC0', credit: 'Wikimedia Commons',
  },
  {
    id: 'phoenix-crown', hall: 'classical', tier: 3, size: 0.72,
    name: '孝端皇后九龙九凤冠', en: 'Nine-Dragon Nine-Phoenix Crown of Empress Xiaoduan',
    era: '明 · 万历（16 世纪末）', material: '翠鸟羽 · 金累丝 · 珍珠 4 414 颗 · 宝石 115 块',
    category: '皇室服饰',
    desc: '1957 年北京明定陵孝端显皇后棺内出土（现藏中国国家博物馆）。髹漆细竹丝编圆框为胎，外覆罗、点翠为地。九金龙盘绕（顶部大升龙 + 两侧各四行龙），九翠凤对称排列于龙下，冠后正中另有一凤；左右各出三扇博鬓共六扇。红蓝宝石 115 块、珍珠 4 414 颗，点翠色泽历数百年不褪。',
    facts: [['形制', '九龙九凤'], ['工艺', '点翠 + 金累丝'], ['珍珠', '4 414 颗'], ['重量', '2.32 kg']],
    license: 'Public domain', credit: 'Wikimedia Commons',
  },

  /* ---------------- 自然历史馆 ---------------- */
  {
    id: 'mamenchisaurus', hall: 'natural', tier: 0, size: 22,
    name: '合川马门溪龙骨架', en: 'Mamenchisaurus hochuanensis',
    era: '晚侏罗世 · 上沙溪庙组', material: '矿化骨骼化石 · 不锈钢承力支架',
    category: '古生物',
    desc: '蜥脚下目马门溪龙属，以极长颈部著称——颈椎 19 节，颈长可占体长近一半，为已知脊椎动物之最。正型标本 CCG V 20401 现架于成都自然博物馆，装架体长 22 m、髋高约 3.9 m。颈椎具复杂气腔构造减轻自重，由长颈肋交叠支撑；前后肢近等长，背线水平。本架为原化石与复制件混装。',
    facts: [['体长', '22 m'], ['颈长', '9.3 m'], ['髋高', '≈ 3.9 m'], ['产地', '四川合川']],
    license: 'CC BY 3.0', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'mammoth', hall: 'natural', tier: 1, size: 7.6,
    name: '真猛犸象生态装架', en: 'Mammuthus primigenius',
    era: '更新世晚期', material: '骨骼装架 · 模型皮毛 · 三维螺旋象牙',
    category: '古生物',
    desc: '真猛犸象适应末次冰期极寒草原：体表覆双层被毛，外层护毛长逾 90 cm，皮下脂肪厚达 10 cm；耳与尾极度缩短以减少散热。上门齿特化为强烈内卷的三维螺旋长牙（非平面弧），用于刨雪取食与雄性争斗。头骨高短、单穹顶状，肩部脂肪隆起、背线向后急降。约 1 万年前随冰期结束消退。',
    facts: [['肩高', '约 3.0 m'], ['体长', '约 4.5 m'], ['象牙弧', '约 2.6 m'], ['体重', '约 6 t']],
    license: 'CC BY-SA 2.0', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'siberian-tiger', hall: 'natural', tier: 1, size: 3.4,
    name: '东北虎生态标本', en: 'Siberian Tiger Habitat Mount',
    era: '现生 · 20 世纪采集', material: '剥制标本 · 聚氨酯模型胎 · 玻璃义眼',
    category: '生态景箱',
    desc: '虎的现存最大亚种，分布于中国东北、俄罗斯远东的针阔混交林。冬毛长而密，色浅、条纹稀疏，是对雪原环境的适应。本景箱还原初冬的红松林下层：底衬为实测采集的地被与岩石翻模，姿态取自野外红外相机记录的巡视步态。雄性头体长可达 2.1 m、肩高约 1 m。',
    facts: [['头体长', '2.1 m'], ['体重', '180—300 kg'], ['分布', '东北亚针阔混交林'], ['保护级别', '国家一级']],
    license: 'Public domain', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'giant-panda', hall: 'natural', tier: 1, size: 2.4,
    name: '大熊猫生态标本', en: 'Giant Panda Habitat Mount',
    era: '现生', material: '剥制标本 · 模型胎 · 仿真竹林场景',
    category: '生态景箱',
    desc: '食肉目熊科，却以竹为食占比 99%。腕骨特化出的「伪拇指」使其能对握竹竿，肠道仍保留典型食肉动物的短消化道，因此每日需进食 12—38 kg 竹子并排便逾 40 次。场景复原岷山海拔 2 400 m 的冷箭竹林。头体长约 1.55 m、肩高约 0.75 m。',
    facts: [['体重', '80—150 kg'], ['日食竹量', '12—38 kg'], ['伪拇指', '桡侧籽骨特化'], ['栖息海拔', '1 200—3 400 m']],
    license: 'CC BY 1.0', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'golden-monkey', hall: 'natural', tier: 1, size: 2.1,
    name: '川金丝猴生态标本', en: 'Golden Snub-nosed Monkey Mount',
    era: '现生', material: '剥制标本 · 树干实物翻模',
    category: '生态景箱',
    desc: '中国特有种，栖于秦岭、岷山海拔 1 500—3 300 m 的落叶阔叶与针叶混交林。鼻骨退化形成上仰的塌鼻，可减少高寒环境下的冻伤风险；面部裸皮呈蓝色，肩背披金黄色长毛，成年雄性可长逾 50 cm。营严格的树栖群居生活，群体常达数百只。头体长 0.68 m、尾长近等长。',
    facts: [['头体长', '57—76 cm'], ['分布', '秦岭 · 岷山 · 神农架'], ['社群', '重层社会，可达数百只'], ['保护级别', '国家一级']],
    license: 'CC BY-SA 2.0', credit: 'Wikimedia Commons（形制参考）',
  },
  {
    id: 'petrified-wood', hall: 'natural', tier: 2, size: 2.0,
    name: '硅化木', en: 'Petrified Wood (Agathoxylon arizonicum)',
    era: '晚三叠世 · 约 2.25 亿年前', material: '二氧化硅（玉髓、蛋白石）交代木质',
    category: '地质标本',
    desc: '树木被火山灰或河流沉积迅速掩埋后隔绝氧气，富含二氧化硅的地下水长期渗流，以分子级置换逐步取代木质纤维素，而细胞壁的空间构造被完整保留。因此断面上年轮、导管乃至射线细胞仍清晰可辨。铁、锰等杂质离子的介入造成红、黄、褐等色带。典型标本见美国石化森林国家公园。',
    facts: [['成因', '二氧化硅交代作用'], ['硬度', '莫氏 6.5—7'], ['保留结构', '年轮 · 导管 · 射线'], ['致色', 'Fe / Mn 离子']],
    license: 'CC BY 3.0', credit: 'Wikimedia Commons',
  },
  {
    id: 'basalt-columns', hall: 'natural', tier: 2, size: 2.4,
    name: '柱状节理玄武岩', en: 'Columnar Jointed Basalt',
    era: '古近纪 · 约 6 000 万年前', material: '玄武岩',
    category: '地质标本',
    desc: '玄武质熔岩流冷却收缩时，热应力在冷凝面上形成规则的收缩中心，并向熔岩体内部垂直推进，最终裂解为断面近六边形的长柱体。柱径与冷却速率成反比——冷却越慢柱体越粗，柱身常见水平球窝状分节。典型代表为北爱尔兰巨人堤道，柱径约 380—500 mm。',
    facts: [['断面', '多为五至六边形'], ['成因', '冷凝收缩节理'], ['柱径', '与冷却速率负相关'], ['岩性', '基性喷出岩']],
    license: 'CC BY-SA 2.0', credit: 'Wikimedia Commons',
  },
  {
    id: 'meteorite', hall: 'natural', tier: 3, size: 0.85,
    name: '吉卜铁陨石切片（维德曼花纹）', en: 'Gibeon Iron Meteorite Slice, Widmanstätten Pattern',
    era: '太阳系形成初期 · 约 45 亿年前', material: '铁镍合金基质 · 维斯台登纹',
    category: '地质标本',
    desc: '来自纳米比亚的吉卜（Gibeon）铁陨石，属 IVA 型细八面体石。切面经酸蚀显现维斯台登纹：铁纹石亮带沿八面体 {111} 四组方向排列，平行 (111) 面切割呈 60/120° 等边三角网格。表面深色熔壳与气印为高速穿越大气层时烧蚀所致。本展品为切片标本（非橄榄陨铁）。',
    facts: [['分类', '铁陨石 · IVA 型'], ['来源', '小行星核幔碎片'], ['特征', '维斯台登纹'], ['类型', '切片标本']],
    license: 'CC0', credit: 'Wikimedia Commons',
  },
  {
    id: 'trilobite-fossil', hall: 'natural', tier: 3, size: 0.62,
    name: '埃尔拉西虫三叶虫化石', en: 'Elrathia kingii Trilobite Fossil',
    era: '中寒武世 · 约 5.05 亿年前', material: '钙质外骨骼化石 · 泥灰岩基质',
    category: '古生物',
    desc: '产自美国犹他州 House Range 中寒武统 Wheeler 页岩的标准化石。头甲约占全长 1/3，胸部 13 节，尾甲小于头甲；宽长比约 0.6，头鞍前窄后宽锥形，新月形眼叶位于头鞍中前部。外骨骼深棕黑褐色，围岩为浅灰米黄泥灰质页岩。',
    facts: [['体长', '约 2.8 cm'], ['宽长比', '≈ 0.6'], ['胸节', '13 节'], ['产地', '犹他 Wheeler 组']],
    license: 'Public domain', credit: 'Wikimedia Commons',
  },
  {
    id: 'fish-fossil', hall: 'natural', tier: 3, size: 0.66,
    name: '始新世鱼化石（Knightia）', en: 'Knightia eocaena Fossil Fish',
    era: '始新世 · 约 5 200 万年前', material: '页岩基质 · 磷酸盐化骨骼',
    category: '古生物',
    desc: '产自美国怀俄明州绿河组（Fossil Butte）始新世湖相沉积，是北美最常见的化石鱼之一。体形细长鲱状，体高约体长 1/4；骨骼深棕黑至蜜糖褐，围岩为米白浅灰纹层状灰岩，常现平行细纹层。鳍条与椎骨呈梳状排列，保存极佳。',
    facts: [['体长', '约 12 cm'], ['生物群', '绿河组'], ['保存', '页岩纹层压型'], ['产地', '怀俄明']],
    license: 'CC0', credit: 'Wikimedia Commons',
  },
  {
    id: 'specimen-jar', hall: 'natural', tier: 3, size: 0.78,
    name: '深海头足类浸制标本', en: 'Deep-sea Cephalopod in Formalin',
    era: '现生 · 2018 年采集', material: '10% 中性福尔马林 · 硼硅玻璃标本罐',
    category: '浸制标本',
    desc: '采自西太平洋 1 240 m 水深。深海头足类的软组织无法制作干制标本，须先以福尔马林固定蛋白质、终止自溶，再长期保存于缓冲液中。标本罐使用硼硅玻璃以避免碱溶出改变液体 pH。个体外套膜上仍可辨识发光器的排列。',
    facts: [['采集水深', '1 240 m'], ['固定液', '10% 中性福尔马林'], ['胴长', '约 12 cm'], ['海域', '西太平洋']],
    license: 'CC BY 2.0', credit: 'Wikimedia Commons',
  },
  {
    id: 'insect-case', hall: 'natural', tier: 2, size: 1.15,
    name: '鳞翅目与鞘翅目标本柜', en: 'Lepidoptera & Coleoptera Cabinet',
    era: '现生', material: '干制针插标本 · 椴木框 · 无酸衬纸',
    category: '标本柜',
    desc: '上层为鳞翅目（蝴蝶）八种，下层为鞘翅目（甲虫）十种。蝶翅的色彩分结构色与色素色两类：闪蝶的蓝为鳞片微结构对光的干涉所致，角度一变颜色即变；而色素色则相对稳定。柜内衬无酸纸并置樟脑，需长期避光——紫外线会在数年内漂白色素色。',
    facts: [['鳞翅目', '8 种'], ['鞘翅目', '10 种'], ['固定', '不锈钢标本针'], ['保存要点', '避光 · 防蛀 · 控湿']],
    license: 'CC BY 2.0', credit: 'Natural History Museum, London / Wikimedia Commons',
  },
];

export function hallById(id) {
  return HALLS.find((h) => h.id === id);
}
export function exhibitsOf(hallId) {
  return EXHIBITS.filter((e) => e.hall === hallId);
}
export function exhibitById(id) {
  return EXHIBITS.find((e) => e.id === id);
}
