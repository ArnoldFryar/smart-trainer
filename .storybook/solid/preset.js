import path from 'path';
import solidPlugin from 'vite-plugin-solid';
import postcssConfig from "../../postcss.config.js";

export const addons = [
  path.dirname(require.resolve(path.join('@storybook/html', 'package.json'))),
];

export const core = {
  builder: '@storybook/builder-vite',
};

export function readPackageJson() {
  const packageJsonPath = path.resolve('package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const jsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  return JSON.parse(jsonContent);
}

export const viteFinal = async (config, { presets }) => {
  // config.plugins.unshift(solidPlugin({ hot: false }));
  // config.css ??= {};
  // config.css.postcss = postcssConfig;
  // console.log(config.plugins)
  return config;
};
