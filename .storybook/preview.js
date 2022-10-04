import { render } from 'solid-js/web';

let disposeStory;

export const decorators = [
  (Story) => {
    if (disposeStory) {
      disposeStory();
    }
    const root = document.getElementById('storybook-root');
    const solid = document.createElement('div');
    solid.className = 'bg-slate-800 text-white';

    solid.setAttribute('id', 'solid-root');
    root.appendChild(solid);
    disposeStory = render(Story, solid);
    return solid;
    // return createRoot(() => Story()); // do not work correctly https://github.com/solidjs/solid/issues/553
  },
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  layout: 'fullscreen',
  backgrounds: {
    default: 'dark',
    values: [
      {
        name: 'dark',
        value: '#1e293b',
      },
      {
        name: 'light',
        value: '#ffffff',
      },
    ],
  },
};
