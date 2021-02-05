import { NextApiHandler } from 'next';
import { jwt } from 'twilio';

const { ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET } = process.env;

const index: NextApiHandler = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  const { name, room } = req.query;
  if (ACCOUNT_SID && API_KEY_SID && API_KEY_SECRET) {
    const accessToken = new jwt.AccessToken(ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET, {
      identity: typeof name === 'string' ? name : '',
    });
    const grant = new jwt.AccessToken.VideoGrant({
      room: typeof room === 'string' ? room : '',
    });
    accessToken.addGrant(grant);
    const token = accessToken.toJwt();
    res.end(JSON.stringify({ result: 'OK', token }));
  } else {
    res.end(JSON.stringify({ result: 'NG' }));
  }
};
export default index;
