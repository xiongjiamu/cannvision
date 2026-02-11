import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    // 项目部署在 GitHub Pages 子路径，需与仓库名一致（若仓库名不同请修改）
    base: '/cannvision/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // 生产环境移除 console.log，减小体积
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
    }
})
