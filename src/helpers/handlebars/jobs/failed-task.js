export default tasks => {
  let failedTask;

  for (const [key, value] of Object.entries(tasks)) {
    if (value === 'failed') {
      failedTask = key;
    }
  }

  return failedTask;
};
