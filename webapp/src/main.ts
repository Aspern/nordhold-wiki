import { createApp } from "vue";

import App from "./App.vue";
import { installApplicationPlugins } from "./app/plugins.ts";

const app = createApp(App);
installApplicationPlugins(app);
app.mount("#app");
