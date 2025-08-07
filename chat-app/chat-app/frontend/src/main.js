import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/tailwind.css'

const app = createApp(App)

app.use(store)
app.use(router)

// 全局安全配置
app.config.globalProperties.$sanitize = (input) => {
  return input.replace(/<[^>]*>/g, '')
}

app.mount('#app')