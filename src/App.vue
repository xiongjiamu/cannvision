<template>
  <div class="app-container">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">🔷</div>
      </div>
      <nav class="nav-menu">
        <div class="nav-item active">📊</div>
        <div class="nav-item">🔧</div>
        <div class="nav-item">⚙️</div>
        <div class="nav-item">📁</div>
        <div class="nav-item">📋</div>
      </nav>
    </aside>

    <!-- 主体内容区 -->
    <div class="main-wrapper">
      <!-- 顶部工具栏 -->
      <header class="toolbar">
        <div class="toolbar-left">
          <div class="product-selector">
            <span>产品：</span>
            <select class="product-dropdown">
              <option>Ascend 910B</option>
            </select>
          </div>
        </div>
        <div class="toolbar-center">
          <span class="title-hint">🔄 输入描述型入门教程演示</span>
        </div>
        <div class="toolbar-right">
          <button class="toolbar-btn">📱 键盘结构</button>
          <button class="toolbar-btn">🔖 首字证据</button>
          <button class="toolbar-btn">⚙️ 收起</button>
        </div>
      </header>

      <!-- 画布和右侧面板容器 -->
      <div class="content-wrapper">
        <main class="canvas-area">
          <AscendGraph />
        </main>

        <!-- 右侧信息面板 -->
        <aside class="right-panel">
          <div class="panel-section">
            <h3>基本架构</h3>
            <div class="legend-item">
              <span class="legend-dot" style="background: #91d5ff"></span>
              <span>存储单元</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #95de64"></span>
              <span>计算单元</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #ffd666"></span>
              <span>控制单元</span>
            </div>
          </div>
          
          <div class="panel-section">
            <h3>指令类型</h3>
            <div class="legend-item">Cube 指令序列</div>
            <div class="legend-item">FixPipe 指令序列</div>
            <div class="legend-item">MTE1 指令序列</div>
            <div class="legend-item">MTE2 指令序列</div>
          </div>

          <div class="panel-section">
            <h3>对齐要求</h3>
            <div class="legend-item">TPosition</div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import AscendGraph from './components/AscendGraph.vue'
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  background: #f0f2f5;
}

/* 左侧边栏 */
.sidebar {
  width: 60px;
  background: #001529;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.logo {
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 32px;
  cursor: pointer;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nav-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: #1890ff;
}

/* 主体区域 */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部工具栏 */
.toolbar {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.product-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.product-dropdown {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.title-hint {
  font-size: 14px;
  color: #fa8c16;
  background: #fff7e6;
  padding: 6px 16px;
  border-radius: 4px;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.toolbar-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.toolbar-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
}

/* 内容区 */
.content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 0;
}

.canvas-area {
  flex: 1;
  background: white;
  overflow: hidden;
}

/* 右侧面板 */
.right-panel {
  width: 200px;
  background: #fafafa;
  padding: 20px 15px;
  overflow-y: auto;
  border-left: 1px solid #e8e8e8;
}

.panel-section {
  margin-bottom: 25px;
}

.panel-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: #595959;
  cursor: pointer;
  transition: color 0.3s;
}

.legend-item:hover {
  color: #1890ff;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}
</style>
