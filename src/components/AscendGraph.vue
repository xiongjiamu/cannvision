<template>
  <div class="graph-container">
    <div id="graph-canvas" ref="graphContainer"></div>
    
    <!-- 底部控制栏和图例 -->
    <div class="bottom-bar">
      <div class="legend-section">
        <div class="legend-group">
          <span class="legend-label">→ 数据流向</span>
          <span class="legend-label">⚪ 指令流向</span>
          <span class="legend-label" style="background: #fff7e6; padding: 4px 12px; border-radius: 4px;">横/纵单元</span>
          <span class="legend-label" style="background: #e6f7ff; padding: 4px 12px; border-radius: 4px;">存储单元</span>
          <span class="legend-label" style="background: #f6ffed; padding: 4px 12px; border-radius: 4px;">计算单元</span>
        </div>
      </div>
      
      <div class="control-section">
        <button @click="triggerFlow" class="action-btn primary" :disabled="isAnimating">
          <span v-if="!isAnimating">▶️ 播放动画</span>
          <span v-else>⏸️ 运行中...</span>
        </button>
        <button @click="resetView" class="action-btn">🔄 重置</button>
        <button class="action-btn">💾 导出</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Graph } from '@antv/x6'
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

// 注册 GSAP 插件
gsap.registerPlugin(MotionPathPlugin)

const graphContainer = ref(null)
let graph = null
const isAnimating = ref(false)

// 定义动画路径序列 (L2 -> MTE2 -> Unified Buffer)
const animationPath = [
  { edgeId: 'Data_Bus_External', label: 'Global Memory → L2 Cache' },
  { edgeId: 'main-flow-edge', label: 'L2 Cache → MTE2' }
]

// 初始化图形
const initGraph = () => {
  graph = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth,
    height: graphContainer.value.clientHeight,
    grid: {
      size: 20,
      visible: true,
      type: 'dot',
      args: {
        color: '#e0e0e0',
        thickness: 1,
      },
    },
    panning: {
      enabled: true,
      modifiers: 'shift',
    },
    mousewheel: {
      enabled: true,
      modifiers: 'ctrl',
      minScale: 0.5,
      maxScale: 2,
    },
    connecting: {
      router: 'manhattan', // 【关键】曼哈顿路由，生成直角折线
      connector: {
        name: 'rounded',
        args: {
          radius: 10,
        },
      },
      anchor: 'center',
      connectionPoint: 'boundary',
      snap: true,
    },
  })

  createNodes()
  
  // 适配窗口大小
  window.addEventListener('resize', handleResize)
}

// 创建硬件拓扑节点 - 按四大模块组织
const createNodes = () => {
  // ========================================
  // 模块一：全局存储与缓存层级 (Global Memory Hierarchy)
  // ========================================
  
  // Global Memory (全局内存 - HBM)
  const globalMemory = graph.addNode({
    id: 'global-memory',
    shape: 'rect',
    x: 80,
    y: 100,
    width: 160,
    height: 550,
    attrs: {
      body: {
        fill: '#bae7ff',
        stroke: '#40a9ff',
        strokeWidth: 3,
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'Global Memory',
        fill: '#096dd9',
        fontSize: 15,
        fontWeight: 'bold',
        refY: '50%',
      },
    },
    zIndex: 10,
  })

  // L2 Cache (二级共享缓存)
  const l2Cache = graph.addNode({
    id: 'l2-cache',
    shape: 'rect',
    x: 300,
    y: 130,
    width: 90,
    height: 490,
    attrs: {
      body: {
        fill: '#d3f1ff',
        stroke: '#69c0ff',
        strokeWidth: 3,
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'L2 Cache',
        fill: '#0050b3',
        fontSize: 14,
        fontWeight: 'bold',
        refY: '50%',
      },
    },
    zIndex: 10,
  })

  // ========================================
  // 模块二：AIC (AI Core) - 矩阵计算子系统
  // ========================================
  
  // --- 2.1 AIC 数据通路 ---
  
  // L1 Buffer (一级缓存 - AIC 专用)
  const l1Buffer = graph.addNode({
    id: 'l1-buffer',
    shape: 'rect',
    x: 480,
    y: 100,
    width: 210,
    height: 200,
    attrs: {
      body: {
        fill: '#91d5ff',
        stroke: '#1890ff',
        strokeWidth: 3,
        rx: 10,
        ry: 10,
      },
      label: {
        text: 'L1 Buffer',
        fill: '#003a8c',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    zIndex: 10,
  })

  // MTE2 节点 (L2 -> L1 搬运引擎) - 上部两个
  const mte2_1 = createMTENode('mte2-1', 570, 75, 'MTE2')
  const mte2_2 = createMTENode('mte2-2', 570, 250, 'MTE2')

  // MTE1 节点 (L1 -> L0 搬运引擎) - 右侧三个
  const mte1_1 = createMTENode('mte1-1', 880, 95, 'MTE1')
  const mte1_2 = createMTENode('mte1-2', 880, 150, 'MTE1')
  const mte1_3 = createMTENode('mte1-3', 880, 245, 'MTE1')

  // 计算输入缓冲
  const l0aBuffer = createBuffer('l0a-buffer', 980, 80, 'LOA Buffer')
  const l0bBuffer = createBuffer('l0b-buffer', 980, 145, 'LOB Buffer')
  const btBuffer = createBuffer('bt-buffer', 980, 230, 'BT Buffer')

  // FixPipe 和 FP Buffer (后处理路径)
  const fixPipe1 = createMTENode('fixpipe-1', 880, 300, 'FixPipe')
  const fpBuffer = createBuffer('fp-buffer', 980, 295, 'FP Buffer')

  // Cube (立方体计算单元 - 矩阵运算核心)
  const cube = graph.addNode({
    id: 'cube',
    shape: 'rect',
    x: 1130,
    y: 80,
    width: 90,
    height: 200,
    attrs: {
      body: {
        fill: '#95de64',
        stroke: '#52c41a',
        strokeWidth: 3,
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'Cube',
        fill: '#237804',
        fontSize: 16,
        fontWeight: 'bold',
        refY: '50%',
      },
    },
    zIndex: 10,
  })

  // L0C Buffer (结果累加器)
  const l0cBuffer = graph.addNode({
    id: 'l0c-buffer',
    shape: 'rect',
    x: 1280,
    y: 130,
    width: 110,
    height: 80,
    attrs: {
      body: {
        fill: '#91d5ff',
        stroke: '#1890ff',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'L0C Buffer',
        fill: '#003a8c',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
    zIndex: 10,
  })

  // 右侧 FixPipe (后处理)
  const fixPipe2 = createMTENode('fixpipe-2', 1315, 300, 'FixPipe', '💾')

  // --- 2.2 AIC 控制流核心 ---
  
  // DCache 和 ICache (上半部分)
  const dcache1 = createCacheNode('dcache-1', 750, 390, 'DCache')
  const icache1 = createCacheNode('icache-1', 750, 445, 'ICache')
  
  // Scalar 控制单元
  const scalar1 = createScalarNode('scalar-1', 920, 410, 'Scalar')
  
  // 指令序列 (菱形)
  const instSeq1 = createInstructionNode('inst-seq-1', 1120, 400, '指令序列')

  // ========================================
  // 模块三：AIV (AI Vector) - 向量计算子系统
  // ========================================
  
  // AIV 容器框 (虚线边框)
  const aivGroup = graph.addNode({
    id: 'aiv-group',
    shape: 'rect',
    x: 440,
    y: 520,
    width: 780,
    height: 220,
    attrs: {
      body: {
        fill: 'transparent',
        stroke: '#bfbfbf',
        strokeWidth: 2,
        strokeDasharray: '8 4',
        rx: 10,
        ry: 10,
      },
      label: {
        text: 'AIV',
        fill: '#8c8c8c',
        fontSize: 16,
        fontWeight: 'bold',
        refY: 15,
        refX: 10,
      },
    },
    zIndex: 1,
  })

  // MTE2 和 MTE3 (L2 -> Unified Buffer 搬运引擎)
  const mte2_aiv = createMTENode('mte2-aiv', 570, 550, 'MTE2')
  const mte3_aiv = createMTENode('mte3-aiv', 570, 590, 'MTE3')

  // Unified Buffer (统一缓冲区)
  const unifiedBuffer = graph.addNode({
    id: 'unified-buffer',
    shape: 'rect',
    x: 680,
    y: 550,
    width: 340,
    height: 60,
    attrs: {
      body: {
        fill: '#91d5ff',
        stroke: '#1890ff',
        strokeWidth: 3,
        rx: 10,
        ry: 10,
      },
      label: {
        text: 'Unified Buffer',
        fill: '#003a8c',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    zIndex: 20,
  })

  // Vector (向量计算单元)
  const vectorCore = graph.addNode({
    id: 'vector-core',
    shape: 'rect',
    x: 1240,
    y: 550,
    width: 130,
    height: 60,
    attrs: {
      body: {
        fill: '#95de64',
        stroke: '#52c41a',
        strokeWidth: 3,
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'Vector',
        fill: '#237804',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    zIndex: 20,
  })

  // --- AIV 控制流核心 ---
  
  // DCache 和 ICache (下半部分)
  const dcache2 = createCacheNode('dcache-2', 750, 650, 'DCache')
  const icache2 = createCacheNode('icache-2', 750, 705, 'ICache')
  
  // Scalar 控制单元
  const scalar2 = createScalarNode('scalar-2', 920, 670, 'Scalar')
  
  // 指令序列 (菱形)
  const instSeq2 = createInstructionNode('inst-seq-2', 1120, 660, '指令序列')

  // ========================================
  // 创建所有连接线
  // ========================================
  createAllConnections()

  // 延迟居中
  setTimeout(() => {
    graph.centerContent()
  }, 100)
}

// ========================================
// 辅助函数：创建节点
// ========================================

function createMTENode(id, x, y, label, icon = '') {
  return graph.addNode({
    id,
    shape: 'ellipse',
    x,
    y,
    width: 70,
    height: 32,
    attrs: {
      body: {
        fill: '#fff7e6',
        stroke: '#ffa940',
        strokeWidth: 2,
      },
      label: {
        text: icon ? `${icon} ${label}` : label,
        fill: '#d46b08',
        fontSize: 12,
        fontWeight: 'bold',
      },
    },
    zIndex: 15,
  })
}

function createBuffer(id, x, y, label) {
  return graph.addNode({
    id,
    shape: 'rect',
    x,
    y,
    width: 110,
    height: 55,
    attrs: {
      body: {
        fill: '#91d5ff',
        stroke: '#1890ff',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: label,
        fill: '#003a8c',
        fontSize: 13,
        fontWeight: '600',
      },
    },
    zIndex: 10,
  })
}

function createCacheNode(id, x, y, label) {
  return graph.addNode({
    id,
    shape: 'rect',
    x,
    y,
    width: 100,
    height: 45,
    attrs: {
      body: {
        fill: '#f5f5f5',
        stroke: '#d9d9d9',
        strokeWidth: 2,
        rx: 6,
        ry: 6,
      },
      label: {
        text: label,
        fill: '#595959',
        fontSize: 13,
        fontWeight: '600',
      },
    },
    zIndex: 10,
  })
}

function createScalarNode(id, x, y, label) {
  return graph.addNode({
    id,
    shape: 'rect',
    x,
    y,
    width: 90,
    height: 70,
    attrs: {
      body: {
        fill: '#95de64',
        stroke: '#52c41a',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: label,
        fill: '#237804',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
    zIndex: 10,
  })
}

function createInstructionNode(id, x, y, label) {
  return graph.addNode({
    id,
    shape: 'polygon',
    x,
    y,
    width: 110,
    height: 110,
    attrs: {
      body: {
        fill: '#ffd591',
        stroke: '#fa8c16',
        strokeWidth: 2,
        refPoints: '0,10 10,0 20,10 10,20',
      },
      label: {
        text: label,
        fill: '#ad6800',
        fontSize: 13,
        fontWeight: 'bold',
      },
    },
    zIndex: 10,
  })
}

// ========================================
// 创建所有连接线 - 按照四大模块组织
// ========================================

function createAllConnections() {
  // --- 模块一：存储层级连接 ---
  
  // Global Memory <-> L2 Cache (双向数据总线)
  addEdge('global-memory', 'l2-cache', '#40a9ff', 3, false, { name: 'Data_Bus_External' })
  addEdge('l2-cache', 'global-memory', '#40a9ff', 3, false, { name: 'Data_Bus_Return' })

  // --- 模块二：AIC 数据通路 ---
  
  // L2 -> MTE2 -> L1 Buffer (写入路径)
  addEdge('l2-cache', 'mte2-1', '#40a9ff', 2)
  addEdge('mte2-1', 'l1-buffer', '#40a9ff', 2)
  
  addEdge('l2-cache', 'mte2-2', '#40a9ff', 2)
  addEdge('mte2-2', 'l1-buffer', '#40a9ff', 2)

  // L1 Buffer -> MTE1 -> L0 Buffers (分发路径)
  addEdge('l1-buffer', 'mte1-1', '#1890ff', 2)
  addEdge('mte1-1', 'l0a-buffer', '#1890ff', 2)
  
  addEdge('l1-buffer', 'mte1-2', '#1890ff', 2)
  addEdge('mte1-2', 'l0b-buffer', '#1890ff', 2)
  
  addEdge('l1-buffer', 'mte1-3', '#1890ff', 2)
  addEdge('mte1-3', 'bt-buffer', '#1890ff', 2)

  // L1 Buffer -> FixPipe -> FP Buffer (FixPipe 输入路径)
  addEdge('l1-buffer', 'fixpipe-1', '#fa8c16', 2, true)
  addEdge('fixpipe-1', 'fp-buffer', '#fa8c16', 2, true)

  // L0 Buffers -> Cube (计算输入)
  addEdge('l0a-buffer', 'cube', '#1890ff', 2)
  addEdge('l0b-buffer', 'cube', '#1890ff', 2)
  addEdge('bt-buffer', 'cube', '#1890ff', 2)
  addEdge('fp-buffer', 'cube', '#fa8c16', 2, true)

  // Cube -> L0C Buffer (计算结果)
  addEdge('cube', 'l0c-buffer', '#52c41a', 3)

  // L0C Buffer -> FixPipe2 (后处理路径)
  addEdge('l0c-buffer', 'fixpipe-2', '#fa8c16', 2, true)

  // FP Buffer -> L1 Buffer (回写路径 - Loopback)
  addEdge('fp-buffer', 'l1-buffer', '#fa8c16', 2, true)

  // --- 模块二：AIC 控制流 ---
  
  // L2 -> DCache/ICache
  addEdge('l2-cache', 'dcache-1', '#69c0ff', 2)
  addEdge('l2-cache', 'icache-1', '#69c0ff', 2)

  // Cache -> Scalar
  addEdge('dcache-1', 'scalar-1', '#8c8c8c', 2)
  addEdge('icache-1', 'scalar-1', '#fa8c16', 2, true)

  // Scalar -> 指令序列
  addEdge('scalar-1', 'inst-seq-1', '#ffa940', 2)

  // 指令序列 -> 各执行单元 (虚线指令流)
  addEdge('inst-seq-1', 'cube', '#ffa940', 1.5, true)
  addEdge('inst-seq-1', 'fixpipe-2', '#ffa940', 1.5, true)
  addEdge('inst-seq-1', 'mte1-1', '#ffa940', 1.5, true)
  addEdge('inst-seq-1', 'mte2-1', '#ffa940', 1.5, true)

  // --- 模块三：AIV 数据通路 ---
  
  // L2 -> MTE2/MTE3 -> Unified Buffer (写入路径)
  addEdge('l2-cache', 'mte2-aiv', '#40a9ff', 2, false, { name: 'main-flow-edge' })
  addEdge('mte2-aiv', 'unified-buffer', '#40a9ff', 2)
  
  addEdge('l2-cache', 'mte3-aiv', '#40a9ff', 2)
  addEdge('mte3-aiv', 'unified-buffer', '#40a9ff', 2)

  // Unified Buffer <-> Vector (双向交互)
  addEdge('unified-buffer', 'vector-core', '#52c41a', 3)
  addEdge('vector-core', 'unified-buffer', '#52c41a', 2, true)

  // Unified Buffer -> L2 (回写路径)
  addEdge('unified-buffer', 'l2-cache', '#40a9ff', 2, true)

  // --- 模块三：AIV 控制流 ---
  
  // L2 -> DCache/ICache
  addEdge('l2-cache', 'dcache-2', '#69c0ff', 2)
  addEdge('l2-cache', 'icache-2', '#69c0ff', 2)

  // Cache -> Scalar
  addEdge('dcache-2', 'scalar-2', '#8c8c8c', 2)
  addEdge('icache-2', 'scalar-2', '#fa8c16', 2, true)

  // Scalar -> 指令序列
  addEdge('scalar-2', 'inst-seq-2', '#ffa940', 2)

  // 指令序列 -> 各执行单元 (虚线指令流)
  addEdge('inst-seq-2', 'vector-core', '#ffa940', 1.5, true)
  addEdge('inst-seq-2', 'mte2-aiv', '#ffa940', 1.5, true)
  addEdge('inst-seq-2', 'mte3-aiv', '#ffa940', 1.5, true)
}

// 添加边的辅助函数
function addEdge(source, target, color, width, dashed = false, meta = {}) {
  const edgeConfig = {
    source,
    target,
    attrs: {
      line: {
        stroke: color,
        strokeWidth: width,
        strokeDasharray: dashed ? '5 3' : '0',
        targetMarker: {
          name: 'classic',
          size: 7,
        },
      },
    },
    router: { 
      name: 'manhattan', 
      args: { 
        padding: 20,
        maxAllowedDirectionChange: 90,
      } 
    },
    connector: { 
      name: 'rounded', 
      args: { radius: 10 } 
    },
    zIndex: 5,
    ...meta,
  }
  
  if (meta.name) {
    edgeConfig.id = meta.name
  }
  
  graph.addEdge(edgeConfig)
}

// 触发数据流动画 - 沿完整路径序列
const triggerFlow = async () => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  console.log('🎬 启动数据流动画序列...')

  // 方案：简化为单条主路径动画
  const mainEdgeId = 'main-flow-edge' // L2 -> MTE2 路径
  const edge = graph.getCellById(mainEdgeId)
  
  if (!edge) {
    console.error('未找到主数据流路径')
    isAnimating.value = false
    return
  }

  const edgeView = graph.findViewByCell(edge)
  if (!edgeView) {
    console.error('未找到边视图')
    isAnimating.value = false
    return
  }

  const pathElement = edgeView.findOne('path')
  if (!pathElement) {
    console.error('未找到 SVG 路径元素')
    isAnimating.value = false
    return
  }

  // 创建数据流小球
  const token = document.createElement('div')
  token.className = 'data-token'
  graphContainer.value.appendChild(token)

  // 执行路径动画
  gsap.to(token, {
    motionPath: {
      path: pathElement,
      align: pathElement,
      alignOrigin: [0.5, 0.5],
      autoRotate: false,
    },
    duration: 3,
    ease: 'power2.inOut',
    onComplete: () => {
      token.remove()
      isAnimating.value = false
      console.log('✅ 数据流动画完成: L2 Cache → MTE2 → Unified Buffer')
    },
  })

  console.log('📊 动画路径: L2 Cache → MTE2 → AIV Unified Buffer')
}

// 重置视图
const resetView = () => {
  if (graph) {
    graph.centerContent()
    graph.zoomTo(1)
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (graph && graphContainer.value) {
    graph.resize(graphContainer.value.clientWidth, graphContainer.value.clientHeight)
  }
}

onMounted(() => {
  initGraph()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (graph) {
    graph.dispose()
  }
})
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

#graph-canvas {
  flex: 1;
  width: 100%;
  position: relative;
  background: linear-gradient(90deg, #fafafa 1px, transparent 1px),
              linear-gradient(#fafafa 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 底部控制栏 */
.bottom-bar {
  height: 70px;
  background: white;
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

.legend-section {
  flex: 1;
  display: flex;
  align-items: center;
}

.legend-group {
  display: flex;
  gap: 20px;
  align-items: center;
}

.legend-label {
  font-size: 12px;
  color: #595959;
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-section {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover:not(:disabled) {
  color: #1890ff;
  border-color: #1890ff;
}

.action-btn.primary {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.action-btn.primary:hover:not(:disabled) {
  background: #40a9ff;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
