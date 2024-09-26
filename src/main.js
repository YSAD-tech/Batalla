import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css';
const myApp = createApp(App);
myApp.use(Quasar, {
  plugins: {}, // Plugins can be added here
});
myApp.mount('#app');