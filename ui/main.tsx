import "./main.css";

import { render } from 'solid-js/web';
import { App } from './App/App.js';
import { setUserHue } from '../services/user/colors.js';

setUserHue(parseInt(localStorage.getItem('user-hue') ?? "345"));

render(() => <App />, document.getElementById('app')!);
