<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 联系人列表 -->
    <ContactList 
      :contacts="contacts" 
      :current-contact="currentContact"
      @select="selectContact"
      @add-contact="showAddContact = true"
    />
    
    <!-- 聊天主区域 -->
    <div v-if="currentContact" class="flex-1 flex flex-col">
      <!-- 聊天头部 -->
      <div class="p-4 bg-blue-600 text-white flex items-center">
        <div class="flex-1">
          <h2 class="text-lg font-semibold">{{ currentContact.name }}</h2>
          <div class="text-xs opacity-80 flex items-center">
            <span :class="{
              'text-green-300': currentContact.online,
              'text-gray-300': !currentContact.online
            }">
              ●
            </span>
            <span class="ml-1">
              {{ currentContact.online ? '在线' : '离线' }}
            </span>
          </div>
        </div>
        
        <button 
          @click="showSecurityCode = true"
          class="p-1 rounded-full hover:bg-blue-700 transition"
          title="验证安全码"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <!-- 消息区域 -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 bg-blue-50">
        <div v-for="(msg, index) in messages" :key="msg.id || index">
          <MessageBubble 
            :message="msg" 
            :is-own="msg.sender === user.id"
            @retract="retractMessage(msg)"
          />
          
          <!-- 消息状态 -->
          <div v-if="msg.sender === user.id" class="text-right text-xs text-gray-500 pr-2 -mt-1 mb-3">
            <span v-if="msg.status === 'sent'">已发送</span>
            <span v-else-if="msg.status === 'delivered'">已送达</span>
            <span v-else-if="msg.status === 'read'" class="text-blue-500">已读</span>
            <span v-else-if="msg.status === 'retracted'" class="text-gray-400">已撤回</span>
          </div>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="p-3 border-t border-blue-200 bg-white">
        <div v-if="fileToSend" class="mb-2 flex items-center justify-between bg-blue-50 p-2 rounded">
          <span class="text-sm text-blue-700 truncate">{{ fileToSend.name }}</span>
          <button @click="cancelFile" class="text-red-500">取消</button>
        </div>
        
        <div class="flex items-start">
          <FileUpload 
            ref="fileUpload"
            :session-key="currentSessionKey"
            @file-selected="fileSelected"
            @file-removed="fileRemoved"
          />
          
          <textarea
            v-model="newMessage"
            @keydown.enter.exact.prevent="sendMessage"
            placeholder="输入加密消息..."
            class="flex-1 ml-2 px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows="2"
          ></textarea>
          
          <button
            @click="sendMessage"
            class="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition self-stretch flex items-center"
          >
            发送
          </button>
        </div>
        
        <div class="mt-1 text-xs text-blue-500 flex justify-between">
          <span>消息使用AES-GCM 256位加密</span>
          <span>会话密钥指纹: {{ currentSessionKeyFingerprint }}</span>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="flex-1 flex items-center justify-center bg-blue-50">
      <div class="text-center text-blue-800 p-8 rounded-lg bg-white shadow">
        <h3 class="text-xl font-medium mb-2">欢迎使用安全聊天</h3>
        <p class="mb-4">请从左侧选择一个联系人开始加密对话</p>
        <button 
          @click="showAddContact = true"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          添加联系人
        </button>
      </div>
    </div>
    
    <!-- 安全码验证模态框 -->
    <SecurityCode 
      v-if="showSecurityCode && currentContact"
      :contact="currentContact"
      @close="showSecurityCode = false"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import ContactList from '@/components/ContactList'
import MessageBubble from '@/components/MessageBubble'
import FileUpload from '@/components/FileUpload'
import SecurityCode from '@/components/SecurityCode'
import CryptoService from '@/services/crypto'

export default {
  components: {
    ContactList,
    MessageBubble,
    FileUpload,
    SecurityCode
  },
  data() {
    return {
      newMessage: '',
      fileToSend: null,
      showSecurityCode: false
    }
  },
  computed: {
    ...mapState('auth', ['user']),
    ...mapState('chat', [
      'contacts',
      'currentContact',
      'messages',
      'currentSessionKey',
      'currentSessionKeyFingerprint'
    ])
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    }
  },
  methods: {
    ...mapActions('chat', [
      'selectContact',
      'sendTextMessage',
      'sendFileMessage',
      'retractMessage',
      'rotateSessionKey'
    ]),
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },
    
    fileSelected(file) {
      this.fileToSend = file
    },
    
    fileRemoved() {
      this.fileToSend = null
    },
    
    cancelFile() {
      this.fileToSend = null
      this.$refs.fileUpload.removeFile()
    },
    
    async sendMessage() {
      if (!this.newMessage.trim() && !this.fileToSend) return
      
      // 文本消息
      if (this.newMessage.trim()) {
        await this.sendTextMessage({
          receiverId: this.currentContact.id,
          message: this.newMessage
        })
        this.newMessage = ''
      }
      
      // 文件消息
      if (this.fileToSend) {
        const encryptedFile = await this.$refs.fileUpload.encryptFile()
        if (encryptedFile) {
          await this.sendFileMessage({
            receiverId: this.currentContact.id,
            file: encryptedFile
          })
          this.cancelFile()
        }
      }
    }
  },
  mounted() {
    this.scrollToBottom()
    
    // 每30分钟轮换会话密钥
    this.keyRotationInterval = setInterval(() => {
      if (this.currentContact) {
        this.rotateSessionKey(this.currentContact.id)
      }
    }, 30 * 60 * 1000) // 30分钟
  },
  beforeUnmount() {
    clearInterval(this.keyRotationInterval)
  }
}
</script>