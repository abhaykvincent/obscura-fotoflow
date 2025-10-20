import { isDeveloper } from '../analytics/utils';
import { checkDevTools } from './devtools';

export function welcomeConsole() {
  const clearConsole = () => {
    console.clear();
  };
  clearConsole();

  const devTools = checkDevTools();
  if (devTools.isDocked) {
    console.log('%cDevTools are docked', 'color: yellow');
  }

  if(devTools.devToolWidth > 650) {
    console.log(`

     ████████  ███████   ██████████  ███████    ████████  ██      ███████   ██         ██
    ░██░░░░░  ██░░░░░██ ░░░░███░░░  ██░░░░░██  ░██░░░░░  ░██     ██░░░░░██ ░██        ░██
    ░███████ ░██    ░██    ░███    ░██    ░██  ░███████  ░██    ░██    ░██ ░██    █   ░██
    ░██░░░░  ░██    ░██    ░███    ░██    ░██  ░██░░░░   ░██    ░██    ░██ ░░██ ░███ ░██
    ░██      ░██    ░██    ░███    ░██    ░██  ░██       ░██    ░██    ░██  ░░███░░░███
    ░██      ░░███████     ░███    ░░███████   ░██       ░██████░░███████    ░░█   ░░█
    ░░        ░░░░░░░      ░░       ░░░░░░░    ░░        ░░░░░░  ░░░░░░░      ░     ░


    `);
    }
    else{
    console.log(`

     ██████  █████   ████████  █████    ██████  ██     █████   ██   ██
    ░██░░░  ██░░░██ ░░░░██░░  ██░░░██  ░██░░░  ░██    ██░░░██ ░██  ░██
    ░█████ ░██  ░██    ░██   ░██  ░██  ░█████  ░██   ░██  ░██ ░██░█░██
    ░██    ░░█████     ░██   ░░█████   ░██     ░█████░░█████   ░█░ ░█
    ░░      ░░░░░      ░░     ░░░░░    ░░      ░░░░░  ░░░░░     ░  ░ 


    `);
    }

  console.log(`%c Welcome to Fotoflow!`, `color: #70ab17;`);

  if (isDeveloper) {
    console.log(`%c 💻 Running in Developement Mode`, `color: #00aaffff;`);
    console.log(`%c 📊🚫 This device is not being tracked by Analytics`, `color: #00aaff6c;`);
  }
  else{
    console.log(`%c 👁️‍🗨️ Observing session activity`, `color: #ffaa00;`);
  }
}