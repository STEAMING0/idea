// Reads theme setting and applies/removes the 'dark' class on <html>.
// Call once at startup in each window's index.tsx.
export async function applyTheme(): Promise<void> {
  const settings = await window.ipc.invoke('settings:getAll', undefined as never)
  const dark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}
