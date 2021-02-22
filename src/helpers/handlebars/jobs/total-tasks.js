export default tasks => {
  let total = 0;

  // eslint-disable-next-line no-unused-vars
  for (const [key, value] of Object.entries(tasks)) {
    if (!(value === null)) {
      ++total;
    }
  }

  return total;
};
