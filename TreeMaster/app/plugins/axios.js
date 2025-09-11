import { useUserStore } from '@/stores/user'
import axios from 'axios'

export default defineNuxtPlugin(() => {
  const userStore = useUserStore()

  const api = axios.create({
    baseURL: process.env.API_URL
  })

  // Intercepteur pour ajouter le token si présent
  api.interceptors.request.use(config => {
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  })

  return {
    provide: {
      api
    }
  }
})
