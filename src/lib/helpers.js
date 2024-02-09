import chalk from 'chalk';
import fetch from 'node-fetch';
import ora from 'ora';

/**
 * Helper for any steps for a consistent UX.
 * @template T
 * @param {string} step  Name of step to show user.
 * @param {() => Promise<T>} fn  An async function to execute.
 * @returns {Promise<T>}
 */
async function step(str, fn) {
  // discardStdin prevents Ora from accepting input that would be passed to a
  // subsequent command, like a y/n confirmation step, which would be dangerous.
  const spin = ora({ text: `${str}...`, discardStdin: true }).start();
  try {
    const result = await fn();
    spin.succeed(chalk.green(str));
    return result;
  } catch (err) {
    spin.fail(str);
    console.error('  ' + chalk.red(err)); // maintain expected indentation
    console.log(err);
    process.exit(1);
  }
}

export async function isMinaGraphQlEndpointAvailable(endpoint) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ syncStatus }' }),
    });
    if (!response.ok) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export default step;
