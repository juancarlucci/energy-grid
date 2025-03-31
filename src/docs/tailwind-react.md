## Tailwind CSS Setup (React + Vite)

### Why This Approach

Tailwind v4’s npm package (`tailwindcss@4.x`) is a PostCSS library, not a CLI. For a simple React + Vite setup, use the standalone v3 CLI to generate CSS instead of wrestling with PostCSS config.

### Steps

1. **Install Tailwind CLI**:

   - Download: `curl -L -o tailwindcss-macos-x64 https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.14/tailwindcss-macos-x64`
   - Make executable: `chmod +x tailwindcss-macos-x64`
   - Move to global bin: `sudo mv tailwindcss-macos-x64 /usr/local/bin/tailwindcss`
   - Verify: `tailwindcss --help | grep "Tailwind CSS"` (shows v3.4.14)

2. **Setup Files**:

   - `src/styles/global.css`:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
   - `main.tsx`: `import "../dist/output.css";`

3. **Add Scripts** to `package.json`:
   ```json
   "scripts": {
     "build:css": "tailwindcss -i ./src/styles/global.css -o ./dist/output.css",
     "dev": "npm run build:css && vite"
   }
   ```

```
4. **Run:**
npm run dev—generates CSS and starts Vite. Test with <div className="bg-blue-500 h-10 w-10" />.

```
