export const createSessionName = () => {
  let sessionName = null;
  if (typeof sessionStorage !== 'undefined') {
    const name = sessionStorage.getItem('name');
    if (name) sessionName = name;
    else {
      sessionName = new Date().toUTCString();
      sessionStorage.setItem('name', sessionName);
    }
  }
  return sessionName;
};
