import { useState, useEffect } from 'react';
import { getRoomToken } from '../libs/getRoomToken';

interface Props {
  roomName: string;
}

export const useTwilioToken = ({ roomName }: Props) => {
  const [token, setToken] = useState<string>(null);
  useEffect(() => {
    roomName && getRoomToken(roomName, sessionStorage.getItem('name')).then(setToken);
  }, [roomName]);
  return token;
};
