export default function(tasks, options) {
  let index = 0;

  let isStarted = false;

  // eslint-disable-next-line no-unused-vars
  for (const [key, value] of Object.entries(tasks)) {
    if (!(value === null)) {
      ++index;
    }

    if (value === 'started') {
      isStarted = true;

      return options.fn(index);
    }
  }

  if (!isStarted) {
    return options.inverse();
  }
}
