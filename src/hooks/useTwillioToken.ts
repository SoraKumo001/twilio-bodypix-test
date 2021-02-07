import { useState, useEffect } from 'react';
import { getRoomToken } from '../libs/getRoomToken';

interface Props {
  roomName: string | null;
  sessionName: string | null;
}

export const useTwilioToken = ({ roomName, sessionName }: Props) => {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (roomName && sessionName) {
      setToken(null);
      getRoomToken(roomName, sessionName).then(setToken);
    }
  }, [roomName, sessionName]);
  return token;
};
