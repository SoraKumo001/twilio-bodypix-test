export const getRoomToken = (room: string, name: string) =>
  fetch(`/api/auth?room=${room}&name=${name}`)
    .then((res) => res.json())
    .then((value) => (value.result === 'OK' ? value.token : null));
