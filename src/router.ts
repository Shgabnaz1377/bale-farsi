import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'

export const router = createRouter({
  // Hash history so deep links work on any static host without rewrites.
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/unit/:id', name: 'unit', component: () => import('./views/UnitView.vue'), props: true },
    { path: '/lesson', name: 'lesson', component: () => import('./views/LessonView.vue') },
    { path: '/alphabet', name: 'alphabet', component: () => import('./views/AlphabetView.vue') },
    { path: '/words', name: 'words', component: () => import('./views/WordsView.vue') },
    { path: '/progress', name: 'progress', component: () => import('./views/ProgressView.vue') },
    { path: '/account', name: 'account', component: () => import('./views/AccountView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
