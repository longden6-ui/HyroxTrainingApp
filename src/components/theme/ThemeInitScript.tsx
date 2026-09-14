import Script from 'next/script';

const THEME_INIT = `(function(){try{
  var t = localStorage.getItem('theme');
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}})();`;

export function ThemeInitScript() {
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: THEME_INIT }}
    />
  );
}
