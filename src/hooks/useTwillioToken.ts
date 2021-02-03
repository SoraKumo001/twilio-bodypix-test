import { useState, useEffect } from 'react';
import { getRoomToken } from '../libs/getRoomToken';

interface Props {
  roomName: string;
  sessionName: string | null;
}

export const useTwilioToken = ({ roomName, sessionName }: Props) => {
  const [token, setToken] = useState<string>(null);
  useEffect(() => {
    roomName && sessionName && getRoomToken(roomName, sessionName).then(setToken);
  }, [roomName, sessionName]);
  return token;
};
