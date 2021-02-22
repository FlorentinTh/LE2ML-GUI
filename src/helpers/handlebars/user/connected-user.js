import APIHelper from '@APIHelper';

export default (id, options) => {
  const connectedUser = APIHelper.getConnectedUser();
  if (id === connectedUser._id) {
    return options.fn(this);
  }
  return options.inverse(this);
};
