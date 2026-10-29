import '@fontsource/tiny5/400.css';
import '@fontsource/pixelify-sans/700.css';
import './styles.css';
import { Scene } from './render/scene.ts';
import { initApp, render } from './ui/app.ts';
import './ui/home.ts';
import './ui/game.ts';
import './ui/results.ts';

if (new URLSearchParams(location.search).has('og')) document.documentElement.classList.add('og');

const scene = new Scene(document.getElementById('abyss') as HTMLCanvasElement);
initApp(document.getElementById('app')!, scene);
void document.fonts.ready.then(() => render());

// Dev-only handle for poking the scene from the console or tests.
if (import.meta.env.DEV) (window as unknown as { scene: Scene }).scene = scene;
