import { deriveKey, generateKeyPair } from './cryptoUtils'

export default class CryptoService {
  static async initUser() {
    const keyPair = await generateKeyPair()
    localStorage.setItem('privateKey', JSON.stringify(keyPair.privateKey))
    return keyPair.publicKey
  }

  static async encryptMessage(message, sessionKey) {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sessionKey,
      data
    )
    
    return { iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) }
  }

  static async decryptMessage(encryptedData, sessionKey) {
    try {
      const { iv, ciphertext } = encryptedData
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        sessionKey,
        new Uint8Array(ciphertext)
      )
      
      return new TextDecoder().decode(decrypted)
    } catch (e) {
      console.error('Decryption failed:', e)
      return null
    }
  }

  static async encryptFile(file, sessionKey) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result
          const iv = crypto.getRandomValues(new Uint8Array(12))
          
          const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            sessionKey,
            arrayBuffer
          )
          
          resolve({
            filename: file.name,
            type: file.type,
            size: file.size,
            iv: Array.from(iv),
            ciphertext: Array.from(new Uint8Array(ciphertext))
          })
        } catch (error) {
          reject(error)
        }
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  static async getFingerprint(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey)
    const hash = await crypto.subtle.digest('SHA-256', exported)
    return Array.from(new Uint8Array(hash)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join(':')
  }
}