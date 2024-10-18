import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Import React plugin if using React

export default defineConfig({
  server: {
    port: 3000, // The port the dev server will run on
    open: true, // Automatically open the app in the browser
  },
  build: {
    outDir: 'dist', // The output directory for the build
    sourcemap: true, // Generate sourcemaps for debugging
  },
  plugins: [
    react(), // Use the React plugin if applicable
    // Add any additional Vite plugins here
  ],
});
