<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center">
    <div class="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 class="text-3xl font-bold text-center text-blue-600 mb-8">安全聊天室</h1>
      
      <form @submit.prevent="login" class="space-y-6">
        <input 
          v-model="username"
          type="text"
          placeholder="用户名"
          class="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        
        <input 
          v-model="password"
          type="password"
          placeholder="密码"
          class="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        
        <button 
          type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition duration-300"
        >
          登录 / 注册
        </button>
      </form>
      
      <div class="mt-6 text-center text-blue-500">
        <p>端到端加密保障 • 服务器无法解密您的消息</p>
      </div>
    </div>
  </div>
</template><template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center">
    <div class="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 class="text-3xl font-bold text-center text-blue-600 mb-8">安全聊天室</h1>
      
      <form @submit.prevent="login" class="space-y-6">
        <input 
          v-model="username"
          type="text"
          placeholder="用户名"
          class="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        
        <input 
          v-model="password"
          type="password"
          placeholder="密码"
          class="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        
        <button 
          type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition duration-300"
        >
          登录 / 注册
        </button>
      </form>
      
      <div class="mt-6 text-center text-blue-500">
        <p>端到端加密保障 • 服务器无法解密您的消息</p>
      </div>
    </div>
  </div>
</template>