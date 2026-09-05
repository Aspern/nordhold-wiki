import { createRouter, createWebHistory } from "vue-router";

import NotFoundPage from "../pages/NotFoundPage.vue";
import TowerCataloguePage from "../pages/TowerCataloguePage.vue";
import TowerDetailPage from "../pages/TowerDetailPage.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "tower-catalogue",
      component: TowerCataloguePage,
    },
    {
      path: "/towers/:towerId",
      name: "tower-detail",
      component: TowerDetailPage,
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFoundPage,
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
