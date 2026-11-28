import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import { account, accountReady, needsAccount } from './lib/account.ts'

export const router = createRouter({
  // Hash history so deep links work on any static host without rewrites.
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/practice', name: 'practice', component: () => import('./views/PracticeView.vue') },
    { path: '/unit/:id', name: 'unit', component: () => import('./views/UnitView.vue'), props: true },
    { path: '/lesson', name: 'lesson', component: () => import('./views/LessonView.vue') },
    { path: '/alphabet', name: 'alphabet', component: () => import('./views/AlphabetView.vue') },
    { path: '/words', name: 'words', component: () => import('./views/WordsView.vue') },
    { path: '/progress', name: 'progress', component: () => import('./views/ProgressView.vue') },
    { path: '/account', name: 'account', component: () => import('./views/AccountView.vue') },
    { path: '/review', name: 'review', component: () => import('./views/ReviewView.vue') },
    { path: '/admin', name: 'admin', component: () => import('./views/AdminView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
    { path: '/persian-not-arabic', name: 'not-arabic', component: () => import('./views/NotArabicView.vue') },
    { path: '/did-you-know', name: 'facts', component: () => import('./views/FactsView.vue') },
    { path: '/idioms', name: 'idioms', component: () => import('./views/IdiomsView.vue') },
    { path: '/characters', name: 'cast', component: () => import('./views/CastView.vue') },
    { path: '/privacy', name: 'privacy', component: () => import('./views/PrivacyView.vue') },
    { path: '/quick', name: 'quick', component: () => import('./views/QuickQuizView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// Guests get one free lesson, then sign up to go on; the owner page needs a signed-in account.
router.beforeEach(async (to) => {
  if (to.name !== 'lesson' && to.name !== 'admin' && to.name !== 'review') return true
  await accountReady()
  if (to.name === 'lesson' && needsAccount()) return { name: 'account', query: { gate: '1', next: to.fullPath } }
  if ((to.name === 'admin' || to.name === 'review') && account.enabled && !account.user) return { name: 'account', query: { next: to.fullPath } }
  return true
})
